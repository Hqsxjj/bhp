// BHP 智能快捷拨号助手 - Cloudflare Worker
// 部署后绑定 DATA_KV 即可使用

import { DIALER_HTML } from './dialer_html.js';
import { DIET_HTML } from './diet_html.js';
import { LEARN_HTML, LEARN_DEFAULT_CONTENT } from './learn_html.js';
import { createSupabaseClient } from './supabase.js';

// KV 读取缓存
const kvCache = new Map();
function getKVCached(env, key, ttlMs = 60000) {
  const entry = kvCache.get(key);
  if (entry && (Date.now() - entry.ts) < ttlMs) return entry.value;
  const p = env.DATA_KV.get(key).then(v => {
    kvCache.set(key, { value: Promise.resolve(v), ts: Date.now() });
    return v;
  });
  kvCache.set(key, { value: p, ts: Date.now() });
  return p;
}

// ========== Auth Helpers ==========

function yesterdayKey(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function dialerHashPin(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function dialerGenToken() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
}

async function dialerGetAccounts(env) {
  var raw = await env.DATA_KV.get('dialer:accounts');
  return raw ? JSON.parse(raw) : [];
}

async function dialerSaveAccounts(env, accounts) {
  await env.DATA_KV.put('dialer:accounts', JSON.stringify(accounts));
}

async function dialerValidateSession(env, token) {
  if (!token) return null;
  var raw = await env.DATA_KV.get('dialer:session:' + token);
  if (!raw) return null;
  var session = JSON.parse(raw);
  // 12-hour session expiry
  var created = session.created_at ? new Date(session.created_at).getTime() : 0;
  if (Date.now() - created > 12 * 60 * 60 * 1000) {
    await env.DATA_KV.delete('dialer:session:' + token);
    return null;
  }
  return session;
}

// Turnstile 人机验证 — 调用 Cloudflare siteverify 校验 token
// 需要 env.TURNSTILE_SECRET 或 env.TURNSTILE_SECRET_KEY（Turnstile 控制台的 Secret Key）；未配置时返回 true（放行，向后兼容）
function getTurnstileSecret(env) {
  return env.TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY || '';
}
async function verifyTurnstile(env, token, remoteIp) {
  var tsSecret = getTurnstileSecret(env);
  if (!tsSecret) return true;
  if (!token || typeof token !== 'string') return false;
  try {
    var form = new FormData();
    form.append('secret', tsSecret);
    form.append('response', token);
    if (remoteIp) form.append('remoteip', remoteIp);
    var resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form
    });
    var data = await resp.json();
    return !!(data && data.success === true);
  } catch (e) {
    return false;
  }
}

// 批量 AI 判断公积金/单位/备注字段错位（复用 /api/ocr/correct 的 AI 配置模式）
async function aiJudgeFundBatch(env, batch) {
  let provider = await env.DATA_KV.get('config:ai_provider') || 'gemini';
  const visionKey = await env.DATA_KV.get('config:vision_api_key') || '';
  const aiKey = await env.DATA_KV.get('config:ai_api_key') || await env.DATA_KV.get('config:deepseek_api_key') || env.AI_API_KEY || env.DEEPSEEK_API_KEY || '';

  let apiKey = aiKey;
  if (provider === 'gemini' || (visionKey && !aiKey)) {
    provider = 'gemini';
    apiKey = visionKey || aiKey;
  }
  if (!apiKey) throw new Error('未配置 AI Key');

  let apiBase = await env.DATA_KV.get('config:ai_api_base') || env.AI_API_BASE;
  let model = await env.DATA_KV.get('config:ai_model') || env.AI_API_MODEL;

  if (provider === 'gemini') {
    if (!apiBase) apiBase = 'https://generativelanguage.googleapis.com/v1beta/openai/';
    if (!model) model = 'gemini-2.5-flash';
  } else {
    if (!apiBase) apiBase = 'https://api.deepseek.com/v1/';
    if (!model) model = 'deepseek-chat';
  }

  let url = apiBase;
  if (!url.endsWith('/')) url += '/';
  url += 'chat/completions';

  const systemPrompt = '你是客户数据修正专家。客户记录包含「公积金(fund)」「单位(company_name)」「备注(note)」三个字段，可能存错了位置。请逐条判断并输出修正建议。\n' +
    '规则：\n' +
    '1. fund 存了公司名称 → action=move_fund_to_company，company_name 填公司名，fund 清空\n' +
    '2. company_name 存了纯数字公积金（4-5位，非年份，可带小数如 5000.56）→ action=move_company_to_fund，fund 填该数字，company_name 清空\n' +
    '3. fund 和 company_name 存反了（company_name 是纯数字、fund 是中文机构名）→ action=swap\n' +
    '4. note 备注里误存了公司名称 → action=move_note_to_company，company_name 填公司名，note 移除该名称\n' +
    '5. note 备注里含 4-5 位金额数字（非年份，如 5000.56）且 fund 为空 → action=move_note_number_to_fund，fund 填整个金额含小数，note 移除该数字\n' +
    '6. fund 是乱码/无意义文字 → action=clear_fund，fund 清空\n' +
    '7. 记录没有错位问题 → action=skip，字段原样返回\n\n' +
    '金额带小数时整个金额含小数作为 fund（如 5000.56），绝对不要把小数部分拆进 note。\n' +
    '只输出 JSON 数组（禁止 markdown 包裹）：[{"mobile":"原手机号","company_name":"修正后的单位","fund":"修正后的公积金","note":"修正后的备注","action":"动作类型"}]，action 只能是 move_fund_to_company|move_company_to_fund|swap|move_note_to_company|move_note_number_to_fund|clear_fund|skip，每条必须包含 mobile 原值';

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请修正以下客户记录的字段错位：\n' + JSON.stringify(batch) }
      ],
      temperature: 0.1,
      max_tokens: 4096
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error('AI API error ' + resp.status + ': ' + errText.substring(0, 200));
  }

  const aiData = await resp.json();
  let content = aiData.choices[0].message.content.trim();
  if (content.startsWith('```')) {
    content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    const arrMatch = content.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try { parsed = JSON.parse(arrMatch[0]); } catch (e2) {}
    }
  }
  return Array.isArray(parsed) ? parsed : [];
}

// 本地规则未命中时的可疑判定：这些条目交给 AI 判断（乱码 fund、混入数字的 company、残留数字的 note）
function isSuspiciousFundEntry(c, INST_RE) {
  var f = (c.fund || '').trim();
  var comp = (c.company_name || '').trim();
  var note = (c.note || '').trim();
  // fund 含中文但非机构名 → 疑似乱码/注释
  if (f && /[一-龥]/.test(f) && !INST_RE.test(f)) return true;
  // fund 含非数字字符（¥/元/人民币/小数点 等合理成分除外）→ 疑似乱码
  var fClean = f.replace(/[¥￥元块人民币\s.,]+/g, '');
  if (fClean && /[^0-9]/.test(fClean)) return true;
  // fund 过长 → 疑似混入其他内容
  if (f.length > 12) return true;
  // company 含数字（非纯数字公积金，可能连写或混入）→ AI 判断
  if (comp && /\d/.test(comp)) return true;
  // note 仍含数字（可能 6 位以上金额或其他数字）→ AI 判断
  if (note && /\d/.test(note)) return true;
  return false;
}

// 工作数据（轮数/通过微信数量）按账号存 KV：work_stats:{account_id}:{date}
// 同账号多设备共享（实时同步由前端轮询+上报完成）
async function fetchWorkRow(env, accountId, date) {
  var raw = await env.DATA_KV.get('work_stats:' + accountId + ':' + date);
  return raw ? JSON.parse(raw) : null;
}
async function upsertWorkRow(env, accountId, date, stats) {
  await env.DATA_KV.put('work_stats:' + accountId + ':' + date, JSON.stringify(stats));
}
// 设备级冷却倒计时（每台设备各自走 45-60 分钟）：与账号级轮次统计分开存，互不覆盖
function cooldownKey(accountId, date, deviceId) {
  return 'work_stats_cd:' + accountId + ':' + date + ':' + deviceId;
}
async function fetchCooldownRow(env, accountId, date, deviceId) {
  var raw = await env.DATA_KV.get(cooldownKey(accountId, date, deviceId));
  return raw ? JSON.parse(raw) : null;
}
async function upsertCooldownRow(env, accountId, date, deviceId, row) {
  await env.DATA_KV.put(cooldownKey(accountId, date, deviceId), JSON.stringify(row));
}
// device_id 只允许安全字符，防止拼接进 KV key
function validDeviceId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{4,64}$/.test(id);
}
// 日历日期运算（以日期字符串为基准，不涉及时区）
function addDays(dateStr, n) {
  var d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// 汇总 [startDate, endDate] 区间每天的 wechat_count
async function sumWechatRange(env, accountId, startDate, endDate) {
  var total = 0;
  var cur = startDate;
  while (cur <= endDate) {
    var row = await fetchWorkRow(env, accountId, cur);
    if (row) total += (row.wechat_count || 0);
    if (cur === endDate) break;
    cur = addDays(cur, 1);
  }
  return total;
}
// 计算本周（周一起）与本月累计通过微信数量
async function weekMonthCounts(env, accountId, dateStr) {
  var d = new Date(dateStr + 'T00:00:00Z');
  var mondayOffset = (d.getUTCDay() + 6) % 7; // 周一 = 0
  var weekStart = addDays(dateStr, -mondayOffset);
  var monthStart = dateStr.slice(0, 8) + '01';
  var week = await sumWechatRange(env, accountId, weekStart, dateStr);
  var month = await sumWechatRange(env, accountId, monthStart, dateStr);
  return { week_count: week, month_count: month };
}

// ========== Main Worker ==========

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-View-Account-Id'
        }
      });
    }

    // ==================== Auth API ====================

    if (path === '/api/dialer/auth/status' && request.method === 'POST') {
      try {
        var accounts = await dialerGetAccounts(env);
        return new Response(JSON.stringify({ has_accounts: accounts.length > 0, count: accounts.length }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/reset' && request.method === 'POST') {
      try {
        // Turnstile 人机验证 — 配置了 TURNSTILE_SECRET 时强制校验，未配置则放行
        if (getTurnstileSecret(env)) {
          var resetBody = await request.json().catch(function(){ return {}; });
          if (!(await verifyTurnstile(env, resetBody.turnstileToken, clientIP))) {
            return new Response(JSON.stringify({ error: '人机验证失败，请刷新页面后重试' }), {
              status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }
        var accounts = await dialerGetAccounts(env);
        var count = accounts.length;
        await env.DATA_KV.put('dialer:accounts', JSON.stringify([]));
        return new Response(JSON.stringify({ success: true, cleared: count }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/setup' && request.method === 'POST') {
      try {
        var body = await request.json();
        // Turnstile 人机验证 — 配置了 TURNSTILE_SECRET 时强制校验，未配置则放行
        if (getTurnstileSecret(env) && !(await verifyTurnstile(env, body.turnstileToken, clientIP))) {
          return new Response(JSON.stringify({ error: '人机验证失败，请刷新页面后重试' }), {
            status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        var accountName = (body.account_name || '').trim();
        var pin = (body.pin || '').trim();
        var label = (body.label || accountName || '').trim();
        if (!accountName) throw new Error('请输入账户名');
        if (pin.length < 4) throw new Error('PIN 至少需要 4 位数字');

        var accounts = await dialerGetAccounts(env);
        if (accounts.length > 0) throw new Error('已有账户存在，无法重复初始化');
        for (var an = 0; an < accounts.length; an++) {
          if (accounts[an].account_name === accountName) throw new Error('账户名已存在');
        }

        var accountId = 'acct_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
        var account = {
          account_id: accountId, account_name: accountName, pin_hash: dialerHashPin(pin), label: label,
          is_master: true, active: true, created_at: new Date().toISOString()
        };
        accounts.push(account);
        await dialerSaveAccounts(env, accounts);

        var token = dialerGenToken();
        await env.DATA_KV.put('dialer:session:' + token, JSON.stringify({ account_id: accountId, created_at: new Date().toISOString() }));

        return new Response(JSON.stringify({ success: true, account_id: accountId, is_master: true, label: label, session_token: token }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/login' && request.method === 'POST') {
      try {
        var body = await request.json();
        // 登录不做 Turnstile 校验（脚本加载失败时正常用户无法登录），改用服务端冷却防爆破：
        // 按账户名维度 2 次→1min / 3 次→5min / 4 次+→10min，账户不存在同样计数（防枚举）
        var accountName = (body.account_name || '').trim();
        var pin = (body.pin || '').trim();
        if (!accountName || pin.length < 4) throw new Error('请输入账户名和 PIN 码');

        var loginFailKey = 'dialer:login:fail:' + accountName;
        var loginFailRaw = await env.DATA_KV.get(loginFailKey);
        var loginFailState = loginFailRaw ? JSON.parse(loginFailRaw) : { count: 0, lastAttempt: 0 };
        if (loginFailState.count >= 2) {
          var lcd = loginFailState.count >= 4 ? 600 : (loginFailState.count === 3 ? 300 : 60);
          var lelapsed = (Date.now() - loginFailState.lastAttempt) / 1000;
          if (lelapsed < lcd) {
            var lremain = Math.ceil(lcd - lelapsed);
            return new Response(JSON.stringify({ success: false, error: 'LOCKOUT:' + lremain + ':请 ' + lremain + ' 秒后重试' }), {
              status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }

        var accounts = await dialerGetAccounts(env);
        var account = null;
        for (var ai = 0; ai < accounts.length; ai++) {
          if (accounts[ai].account_name === accountName || accounts[ai].account_id === accountName) { account = accounts[ai]; break; }
        }
        if (!account) {
          loginFailState.count = (loginFailState.count || 0) + 1;
          loginFailState.lastAttempt = Date.now();
          await env.DATA_KV.put(loginFailKey, JSON.stringify(loginFailState), { expirationTtl: 1800 });
          throw new Error('账户不存在');
        }
        if (!account.active) throw new Error('该账户已被禁用');
        if (account.pin_hash !== dialerHashPin(pin)) {
          loginFailState.count = (loginFailState.count || 0) + 1;
          loginFailState.lastAttempt = Date.now();
          var lttl = loginFailState.count >= 4 ? 1800 : 3600;
          await env.DATA_KV.put(loginFailKey, JSON.stringify(loginFailState), { expirationTtl: lttl });
          var lcd2 = loginFailState.count >= 4 ? 600 : (loginFailState.count >= 3 ? 300 : (loginFailState.count >= 2 ? 60 : 0));
          if (lcd2 > 0) {
            return new Response(JSON.stringify({ success: false, error: 'LOCKOUT:' + lcd2 + ':PIN 码错误，请 ' + lcd2 + ' 秒后重试' }), {
              status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
          throw new Error('PIN 码错误');
        }

        // 登录成功 — 清除失败计数
        await env.DATA_KV.delete(loginFailKey);

        var accountId = account.account_id;
        var token = dialerGenToken();
        await env.DATA_KV.put('dialer:session:' + token, JSON.stringify({ account_id: accountId, created_at: new Date().toISOString() }));

        return new Response(JSON.stringify({
          success: true, account_id: accountId, is_master: account.is_master !== false,
          label: account.label || '', session_token: token
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Unlock: verify PIN with cooldown lockout
    // 2nd wrong → 1min, 3rd wrong → 5min, 4th+ wrong → 10min
    // 注意：unlock 必须携带有效 session token（Bearer），session 本身已是门槛，不做 Turnstile 校验，
    // 否则 Turnstile 脚本加载失败时正常用户也无法解锁
    if (path === '/api/dialer/auth/unlock' && request.method === 'POST') {
      try {
        var body = await request.json();
        var pin = (body.pin || '').trim();
        if (!pin || pin.length < 4 || pin.length > 6) throw new Error('PIN 格式不正确');
        var unlockToken = (request.headers.get('Authorization') || '').replace('Bearer ', '');
        var unlockSession = await dialerValidateSession(env, unlockToken);
        if (!unlockSession) throw new Error('会话已过期，请重新登录');
        var accounts = await dialerGetAccounts(env);
        var found = null;
        for (var ui = 0; ui < accounts.length; ui++) {
          if (accounts[ui].account_id === unlockSession.account_id) { found = accounts[ui]; break; }
        }
        if (!found) throw new Error('账户不存在');

        // Cooldown check
        var failKey = 'dialer:unlock:fail:' + found.account_id;
        var failRaw = await env.DATA_KV.get(failKey);
        var failState = failRaw ? JSON.parse(failRaw) : { count: 0, lastAttempt: 0 };
        if (failState.count >= 2) {
          var cd = failState.count >= 4 ? 600 : (failState.count === 3 ? 300 : 60);
          var elapsed = (Date.now() - failState.lastAttempt) / 1000;
          if (elapsed < cd) {
            var remain = Math.ceil(cd - elapsed);
            return new Response(JSON.stringify({ error: 'LOCKOUT:' + remain + ':请 ' + remain + ' 秒后重试' }), {
              status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }

        if (found.pin_hash !== dialerHashPin(pin)) {
          failState.count = (failState.count || 0) + 1;
          failState.lastAttempt = Date.now();
          var ttl = failState.count >= 4 ? 1800 : 3600;
          await env.DATA_KV.put(failKey, JSON.stringify(failState), { expirationTtl: ttl });
          var cd2 = failState.count >= 4 ? 600 : (failState.count >= 3 ? 300 : (failState.count >= 2 ? 60 : 0));
          if (cd2 > 0) {
            return new Response(JSON.stringify({ error: 'LOCKOUT:' + cd2 + ':PIN 不正确，请 ' + cd2 + ' 秒后重试' }), {
              status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
          return new Response(JSON.stringify({ error: 'PIN 不正确' }), {
            status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Success — clear fail state
        await env.DATA_KV.delete(failKey);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/accounts' && request.method === 'GET') {
      try {
        var accounts = await dialerGetAccounts(env);
        var safe = accounts.map(function(a) {
          return { account_id: a.account_id, account_name: a.account_name || '', label: a.label || '', is_master: a.is_master !== false, active: a.active, created_at: a.created_at };
        });
        return new Response(JSON.stringify({ accounts: safe }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/accounts' && request.method === 'POST') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ai2 = 0; ai2 < accounts.length; ai2++) {
          if (accounts[ai2].account_id === session.account_id) { master = accounts[ai2]; break; }
        }
        if (!master || !master.is_master) throw new Error('仅主账户可创建子账户');

        var body = await request.json();
        var accountName = (body.account_name || '').trim();
        var pin = (body.pin || '').trim();
        var label = (body.label || accountName || '').trim();
        if (!accountName) throw new Error('请输入账户名');
        if (pin.length < 4) throw new Error('PIN 至少需要 4 位数字');
        for (var sn = 0; sn < accounts.length; sn++) {
          if (accounts[sn].account_name === accountName) throw new Error('账户名已存在');
        }

        var subId = 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
        var subAccount = {
          account_id: subId, account_name: accountName, pin_hash: dialerHashPin(pin), label: label,
          is_master: false, active: true, created_at: new Date().toISOString()
        };
        accounts.push(subAccount);
        await dialerSaveAccounts(env, accounts);

        return new Response(JSON.stringify({ success: true, account_id: subId, label: label }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/accounts' && request.method === 'PATCH') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ai3 = 0; ai3 < accounts.length; ai3++) {
          if (accounts[ai3].account_id === session.account_id) { master = accounts[ai3]; break; }
        }
        if (!master || !master.is_master) throw new Error('仅主账户可管理子账户');

        var body = await request.json();
        var targetId = (body.target_account_id || '').trim();
        if (!targetId) throw new Error('缺少目标账户 ID');
        if (targetId === master.account_id) throw new Error('不能修改主账户');

        var found = false;
        for (var ai4 = 0; ai4 < accounts.length; ai4++) {
          if (accounts[ai4].account_id === targetId) {
            if (body.active !== undefined) accounts[ai4].active = !!body.active;
            if (body.label !== undefined) accounts[ai4].label = String(body.label).trim();
            found = true; break;
          }
        }
        if (!found) throw new Error('子账户不存在');
        await dialerSaveAccounts(env, accounts);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/accounts' && request.method === 'DELETE') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ai5 = 0; ai5 < accounts.length; ai5++) {
          if (accounts[ai5].account_id === session.account_id) { master = accounts[ai5]; break; }
        }
        if (!master || !master.is_master) throw new Error('仅主账户可删除子账户');

        var body = await request.json();
        var targetId = (body.target_account_id || '').trim();
        if (!targetId) throw new Error('缺少目标账户 ID');
        if (targetId === master.account_id) throw new Error('不能删除主账户');

        var newList = [];
        for (var ai6 = 0; ai6 < accounts.length; ai6++) {
          if (accounts[ai6].account_id !== targetId) newList.push(accounts[ai6]);
        }
        if (newList.length === accounts.length) throw new Error('子账户不存在');

        // Migrate data back to master
        var supabaseUrl = env.SUPABASE_URL;
        var supabaseKey = env.SUPABASE_KEY;
        var migratedCount = 0;
        if (supabaseUrl && supabaseKey) {
          try {
            var shdrs = {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': 'Bearer ' + supabaseKey,
              'Prefer': 'return=minimal'
            };
            var pageSize = 500; var page = 0; var hasMore = true;
            while (hasMore) {
              var from = page * pageSize; var to = from + pageSize - 1;
              var patchUrl = supabaseUrl + '/rest/v1/customers?account_id=eq.' + encodeURIComponent(targetId) + '&limit=' + pageSize + '&offset=' + from;
              var patchResp = await fetch(patchUrl, { method: 'PATCH', headers: shdrs, body: JSON.stringify({ account_id: master.account_id }) });
              if (patchResp.ok) {
                var contentRange = patchResp.headers.get('content-range') || '';
                var rangeMatch = contentRange.match(/\d+-\d+\/(\d+)/);
                if (rangeMatch) { var total = parseInt(rangeMatch[1]); if (to >= total - 1) hasMore = false; }
                else { hasMore = false; }
                page++; migratedCount += pageSize;
              } else { hasMore = false; }
            }
          } catch (migErr) { /* best effort */ }
        }

        await dialerSaveAccounts(env, newList);

        return new Response(JSON.stringify({ success: true, migrated: migratedCount }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/auth/change-pin' && request.method === 'POST') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var body = await request.json();
        var oldPin = (body.old_pin || '').trim();
        var newPin = (body.new_pin || '').trim();
        if (oldPin.length < 4) throw new Error('请输入当前 PIN');
        if (newPin.length < 4) throw new Error('新 PIN 至少需要 4 位');

        var accounts = await dialerGetAccounts(env);
        var found = false;
        for (var ai7 = 0; ai7 < accounts.length; ai7++) {
          if (accounts[ai7].account_id === session.account_id) {
            if (accounts[ai7].pin_hash !== dialerHashPin(oldPin)) throw new Error('当前 PIN 码错误');
            accounts[ai7].pin_hash = dialerHashPin(newPin);
            found = true; break;
          }
        }
        if (!found) throw new Error('账户不存在');
        await dialerSaveAccounts(env, accounts);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== Stats API ====================

    // GET /api/dialer/accounts — 账号列表（所有已登录账号可用，用于数据分配目标选择；不含统计数据）
    if (path === '/api/dialer/accounts' && request.method === 'GET') {
      try {
        var accList = await dialerGetAccounts(env);
        return new Response(JSON.stringify({ success: true, accounts: accList.map(function(a) {
          return { account_id: a.account_id, account_name: a.account_name, label: a.label, is_master: a.is_master !== false, active: a.active !== false };
        }) }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/stats/accounts' && request.method === 'GET') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ak = 0; ak < accounts.length; ak++) {
          if (accounts[ak].account_id === session.account_id) { master = accounts[ak]; break; }
        }
        if (!master || !master.is_master) throw new Error('仅主账户可查看');

        var supabaseUrl = env.SUPABASE_URL;
        var supabaseKey = env.SUPABASE_KEY;
        var stats = [];
        var countMap = {};

        if (supabaseUrl && supabaseKey) {
          var hdrs = { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey };
          var pgSize = 1000; var pg = 0; var hasMore = true;
          while (hasMore) {
            var from = pg * pgSize; var to = from + pgSize - 1;
            var resp = await fetch(
              supabaseUrl + '/rest/v1/customers?select=account_id&order=created_at.desc',
              { headers: Object.assign({}, hdrs, { 'Range': from + '-' + to }) }
            );
            if (resp.ok) {
              var rows = await resp.json();
              if (!Array.isArray(rows) || rows.length === 0) { hasMore = false; }
              else {
                for (var ri = 0; ri < rows.length; ri++) {
                  var aid = rows[ri].account_id || '_unknown';
                  countMap[aid] = (countMap[aid] || 0) + 1;
                }
                if (rows.length < pgSize) hasMore = false;
                pg++;
              }
            } else { hasMore = false; }
          }
        }

        for (var ak2 = 0; ak2 < accounts.length; ak2++) {
          var a = accounts[ak2];
          stats.push({
            account_id: a.account_id,
            account_name: a.account_name || a.label || a.account_id.slice(0, 12),
            label: a.label || '',
            is_master: a.is_master !== false,
            active: a.active,
            upload_count: countMap[a.account_id] || 0
          });
        }
        for (var ck in countMap) {
          if (ck !== '_unknown' && !accounts.some(function(a) { return a.account_id === ck; })) {
            stats.push({ account_id: ck, account_name: ck.slice(0, 12), label: '', is_master: false, active: true, upload_count: countMap[ck] });
          }
        }

        return new Response(JSON.stringify({ stats: stats, unknown_count: countMap['_unknown'] || 0 }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/dialer/stats/migrate' && request.method === 'POST') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ak3 = 0; ak3 < accounts.length; ak3++) {
          if (accounts[ak3].account_id === session.account_id && accounts[ak3].is_master !== false) { master = accounts[ak3]; break; }
        }
        if (!master) throw new Error('仅主账户可操作');

        var supabaseUrl = env.SUPABASE_URL;
        var supabaseKey = env.SUPABASE_KEY;
        if (!supabaseUrl || !supabaseKey) throw new Error('Supabase 未配置');

        var hdrs = { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey, 'Prefer': 'return=minimal' };
        await fetch(supabaseUrl + '/rest/v1/customers?account_id=is.null', { method: 'PATCH', headers: hdrs, body: JSON.stringify({ account_id: master.account_id }) });
        await fetch(supabaseUrl + '/rest/v1/customers?account_id=eq.', { method: 'PATCH', headers: hdrs, body: JSON.stringify({ account_id: master.account_id }) });

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== Export API (master-only) ====================

    // POST /api/dialer/stats/email-config — save Resend API key
    if (path === '/api/dialer/stats/email-config' && request.method === 'POST') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ak = 0; ak < accounts.length; ak++) {
          if (accounts[ak].account_id === session.account_id && accounts[ak].is_master !== false) { master = accounts[ak]; break; }
        }
        if (!master) throw new Error('仅主账户可操作');

        var body = await request.json();
        if (body.resendApiKey !== undefined) {
          await env.DATA_KV.put('config:resend_api_key', body.resendApiKey || '');
        }
        if (body.backupFromEmail !== undefined) {
          await env.DATA_KV.put('config:backup_from_email', body.backupFromEmail || '');
        }
        if (body.backupTargetEmail !== undefined) {
          await env.DATA_KV.put('config:backup_target_email', body.backupTargetEmail || '');
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /api/dialer/stats/email-config — check if Resend key is set (never expose the key)
    if (path === '/api/dialer/stats/email-config' && request.method === 'GET') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ak = 0; ak < accounts.length; ak++) {
          if (accounts[ak].account_id === session.account_id && accounts[ak].is_master !== false) { master = accounts[ak]; break; }
        }
        if (!master) throw new Error('仅主账户可操作');

        var key = env.RESEND_API_KEY || await env.DATA_KV.get('config:resend_api_key') || '';
        var fromEmail = env.BHP_FROM_EMAIL || '';
        var targetEmail = env.BACKUP_TARGET_EMAIL || await env.DATA_KV.get('config:backup_target_email') || '';

        return new Response(JSON.stringify({ hasKey: !!key, fromEmail: fromEmail, targetEmail: targetEmail }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ hasKey: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /api/dialer/work-stats?date=YYYY-MM-DD&device_id=xxx — 工作数据（轮数/通过微信数量按账号存 KV，
    // 冷却倒计时按设备存，各设备各走各的；旧版账号级 transfer_ts 在设备键不存在时回退兼容一次）
    if (path === '/api/dialer/work-stats' && request.method === 'GET') {
      try {
        var wsAuth = request.headers.get('Authorization') || '';
        var wsToken = wsAuth.startsWith('Bearer ') ? wsAuth.slice(7) : '';
        var wsSession = await dialerValidateSession(env, wsToken);
        if (!wsSession) throw new Error('未登录');
        var wsDate = url.searchParams.get('date') || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(wsDate)) throw new Error('date 格式应为 YYYY-MM-DD');
        var wsDeviceId = url.searchParams.get('device_id') || '';
        var wsRow = await fetchWorkRow(env, wsSession.account_id, wsDate);
        var wm = await weekMonthCounts(env, wsSession.account_id, wsDate);
        var wsResp = wsRow || { date: wsDate, rounds: 0, wechat_count: 0 };
        // 设备级冷却：本设备键优先；无设备键时回退旧版账号级 transfer_ts/cooldown_ms（升级过渡期用一次）
        var wsCd = null;
        if (validDeviceId(wsDeviceId)) {
          wsCd = await fetchCooldownRow(env, wsSession.account_id, wsDate, wsDeviceId);
        }
        wsResp.transfer_ts = (wsCd && wsCd.transfer_ts) || (wsRow && wsRow.transfer_ts) || 0;
        // 返回前钳制冷却时长：0 = 无冷却；非 0 值至少 30 分钟（历史脏值如几十秒在此修正）
        var rawCdMs = (wsCd && wsCd.cooldown_ms) || (wsRow && wsRow.cooldown_ms) || 0;
        wsResp.cooldown_ms = rawCdMs === 0 ? 0 : Math.max(rawCdMs, 30 * 60 * 1000);
        wsResp.week_count = wm.week_count;
        wsResp.month_count = wm.month_count;
        return new Response(JSON.stringify(wsResp), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/dialer/work-stats/rounds — 完成一轮：+1（今日封顶6，账号级），冷却倒计时写设备键（设备级）
    if (path === '/api/dialer/work-stats/rounds' && request.method === 'POST') {
      try {
        var wrAuth = request.headers.get('Authorization') || '';
        var wrToken = wrAuth.startsWith('Bearer ') ? wrAuth.slice(7) : '';
        var wrSession = await dialerValidateSession(env, wrToken);
        if (!wrSession) throw new Error('未登录');
        var wrBody = await request.json();
        var wrDate = (wrBody.date || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(wrDate)) throw new Error('date 格式应为 YYYY-MM-DD');
        var value = parseInt(wrBody.value, 10);
        if (isNaN(value)) throw new Error('value 应为数字');
        var inTs = parseInt(wrBody.transferTs, 10) || Date.now();
        var wrRow = await fetchWorkRow(env, wrSession.account_id, wrDate) || { rounds: 0, wechat_count: 0 };
        // 取 max(云端, 上报值) 封顶 6：并发上报/失败重试都不会丢轮次
        wrRow.rounds = Math.min(6, Math.max(wrRow.rounds || 0, value));
        var wrDeviceId = (wrBody.device_id || '').trim();
        // 冷却倒计时：设备级键写本设备最新转出时刻（旧时刻重试不覆盖）；旧版账号级字段顺带清掉，避免其他设备继承
        if (validDeviceId(wrDeviceId)) {
          var wrCd = await fetchCooldownRow(env, wrSession.account_id, wrDate, wrDeviceId) || { transfer_ts: 0, cooldown_ms: 0 };
          if (inTs >= (wrCd.transfer_ts || 0)) {
            wrCd.transfer_ts = inTs;
            // 冷却时长钳制：0 = 无冷却；非 0 值至少 30 分钟（防历史脏值/上报错误把冷却写成几十秒）
            var rawCd = parseInt(wrBody.cooldownMs, 10) || 0;
            wrCd.cooldown_ms = rawCd === 0 ? 0 : Math.max(rawCd, 30 * 60 * 1000);
          }
          await upsertCooldownRow(env, wrSession.account_id, wrDate, wrDeviceId, wrCd);
          if (wrRow.transfer_ts) { wrRow.transfer_ts = 0; wrRow.cooldown_ms = 0; }
        } else if (inTs >= (wrRow.transfer_ts || 0)) {
          // 旧版客户端（无 device_id）：维持账号级行为
          wrRow.transfer_ts = inTs;
          var rawCd2 = parseInt(wrBody.cooldownMs, 10) || 0;
          wrRow.cooldown_ms = rawCd2 === 0 ? 0 : Math.max(rawCd2, 30 * 60 * 1000);
        }
        await upsertWorkRow(env, wrSession.account_id, wrDate, wrRow);
        // 响应带本设备冷却值（设备键优先，旧客户端回退账号级），客户端合并以云端为准
        var wrResp = {
          date: wrDate,
          rounds: wrRow.rounds,
          wechat_count: wrRow.wechat_count || 0,
          transfer_ts: (wrCd && wrCd.transfer_ts) || (wrRow.transfer_ts || 0),
          cooldown_ms: ((wrCd && wrCd.cooldown_ms) || (wrRow.cooldown_ms || 0)) === 0 ? 0 : Math.max((wrCd && wrCd.cooldown_ms) || (wrRow.cooldown_ms || 0), 30 * 60 * 1000)
        };
        return new Response(JSON.stringify(wrResp), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/dialer/work-stats/wechat — 手动增减通过微信数量 delta: +1 / -1
    if (path === '/api/dialer/work-stats/wechat' && request.method === 'POST') {
      try {
        var wcAuth = request.headers.get('Authorization') || '';
        var wcToken = wcAuth.startsWith('Bearer ') ? wcAuth.slice(7) : '';
        var wcSession = await dialerValidateSession(env, wcToken);
        if (!wcSession) throw new Error('未登录');
        var wcBody = await request.json();
        var wcDate = (wcBody.date || '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(wcDate)) throw new Error('date 格式应为 YYYY-MM-DD');
        var value = parseInt(wcBody.value, 10);
        if (isNaN(value)) throw new Error('value 应为数字');
        var wcRow = await fetchWorkRow(env, wcSession.account_id, wcDate) || { rounds: 0, wechat_count: 0, transfer_ts: 0 };
        // LWW 防乱序：带 ts 的请求只在 ts 严格新于云端已存 ts 时才写入——快速连点时旧值请求乱序晚到也不会覆盖新值；
        // 旧客户端不带 ts（0）视为最新直接写（兼容过渡期）
        var wcTs = parseInt(wcBody.ts, 10) || 0;
        var storedTs = wcRow.wechat_ts || 0;
        if (!wcTs || wcTs > storedTs) {
          wcRow.wechat_count = Math.max(0, value); // 绝对值写入：最后一次点击为准
          wcRow.wechat_ts = wcTs || Date.now();
        }
        await upsertWorkRow(env, wcSession.account_id, wcDate, wcRow);
        var wcWm = await weekMonthCounts(env, wcSession.account_id, wcDate);
        wcRow.week_count = wcWm.week_count;
        wcRow.month_count = wcWm.month_count;
        return new Response(JSON.stringify(wcRow), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== Content Config API ====================

    // GET /api/dialer/config?key=reminder|learn — 获取自定义内容配置（公开接口）
    if (path === '/api/dialer/config' && request.method === 'GET') {
      try {
        var configKey = url.searchParams.get('key') || '';
        if (configKey !== 'reminder' && configKey !== 'learn') {
          return new Response(JSON.stringify({ error: '无效的 key，请使用 reminder 或 learn' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        var kvRaw = await env.DATA_KV.get('config:' + configKey);
        if (kvRaw) {
          return new Response(kvRaw, {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        // 返回默认内容
        if (configKey === 'reminder') {
          return new Response(JSON.stringify({
            title: '微信运营提醒',
            items: [
              '休息30-50分钟，防止微信频繁',
              '给加上的微信打招呼设置标签',
              '打招呼记得多聊两句哦，增加权重',
              '早晚想一下非硬广告的文案，朋友圈每天发一条',
              '有些纠结的客户主动删除他防止权重降低'
            ]
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        } else {
          return new Response(JSON.stringify({
            title: '微信营销与账号运营完全手册',
            subtitle: '加人策略 \\u00b7 账号养号 \\u00b7 朋友圈运营 \\u00b7 客户转化 \\u00b7 风控合规',
            html: ''
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/dialer/config — 保存自定义内容配置（仅主账户）
    if (path === '/api/dialer/config' && request.method === 'POST') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ak = 0; ak < accounts.length; ak++) {
          if (accounts[ak].account_id === session.account_id && accounts[ak].is_master !== false) { master = accounts[ak]; break; }
        }
        if (!master) throw new Error('仅主账户可操作');

        var body = await request.json();
        var cfgKey = (body.key || '').trim();
        if (cfgKey !== 'reminder' && cfgKey !== 'learn') {
          throw new Error('无效的 key，请使用 reminder 或 learn');
        }
        if (!body.data || typeof body.data !== 'object') {
          throw new Error('缺少 data 字段');
        }
        await env.DATA_KV.put('config:' + cfgKey, JSON.stringify(body.data));

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : (e.message === '仅主账户可操作' ? 403 : 400),
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/dialer/stats/export-email — export all customers and email as CSV
    if (path === '/api/dialer/stats/export-email' && request.method === 'POST') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ak = 0; ak < accounts.length; ak++) {
          if (accounts[ak].account_id === session.account_id && accounts[ak].is_master !== false) { master = accounts[ak]; break; }
        }
        if (!master) throw new Error('仅主账户可操作');

        var body = await request.json();
        // 接收邮箱：前端传入优先，未填时用 Worker 环境变量 BACKUP_TARGET_EMAIL / KV 兜底
        var targetEmail = (body.email || '').trim() || env.BACKUP_TARGET_EMAIL || await env.DATA_KV.get('config:backup_target_email') || '';
        if (!targetEmail || targetEmail.indexOf('@') === -1) throw new Error('请输入有效的邮箱地址');
        if (body.email) await env.DATA_KV.put('config:backup_target_email', targetEmail);

        // Get Resend config (Worker 密钥优先，KV 兜底)
        var resendKey = env.RESEND_API_KEY || await env.DATA_KV.get('config:resend_api_key') || '';
        if (!resendKey) throw new Error('请先在数据备份页面配置 Resend API Key');

        var fromEmail = env.BHP_FROM_EMAIL || 'onboarding@resend.dev';

        // Fetch all customers
        var sb = createSupabaseClient(env);
        var rows = await sb.exportAllCustomers();

        // Generate CSV with UTF-8 BOM
        var BOM = '﻿';
        var headers = ['name', 'mobile', 'company_name', 'category', 'note', 'fund', 'batch_label', 'created_at', 'last_operation', 'account_id'];
        var lines = [headers.join(',')];
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          var fields = [];
          for (var hi = 0; hi < headers.length; hi++) {
            var val = r[headers[hi]];
            if (val === null || val === undefined) val = '';
            var str = String(val);
            // CSV escape: wrap in quotes if contains comma, quote, or newline
            if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
              str = '"' + str.replace(/"/g, '""') + '"';
            } else {
              str = '"' + str + '"';
            }
            fields.push(str);
          }
          lines.push(fields.join(','));
        }
        var csvContent = BOM + lines.join('\r\n');
        var base64 = Buffer.from(csvContent, 'utf-8').toString('base64');

        // Today's date for filename
        var today = new Date();
        var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        // Send via Resend API
        var resendResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + resendKey
          },
          body: JSON.stringify({
            from: 'BHP Backup <' + fromEmail + '>',
            to: [targetEmail],
            subject: 'BHP 数据备份 - ' + dateStr,
            text: '请查收附件中的客户数据备份。共 ' + rows.length + ' 条记录，来自所有账户。',
            attachments: [{
              filename: 'bhp_backup_' + dateStr + '.csv',
              content: base64,
              content_type: 'text/csv'
            }]
          })
        });

        if (!resendResp.ok) {
          var errText = await resendResp.text();
          console.error('[export-email] Resend API error:', errText);
          throw new Error('邮件发送失败: ' + errText.slice(0, 300));
        }

        return new Response(JSON.stringify({ success: true, count: rows.length, email: targetEmail, date: dateStr }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/admin/ai-correct-fund — AI 扫描修正公积金/单位/备注字段错位（仅主账户）
    if (path === '/api/admin/ai-correct-fund' && request.method === 'POST') {
      try {
        var authHeader = request.headers.get('Authorization') || '';
        var sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        var session = await dialerValidateSession(env, sessionToken);
        if (!session) throw new Error('未登录');

        var accounts = await dialerGetAccounts(env);
        var master = null;
        for (var ak = 0; ak < accounts.length; ak++) {
          if (accounts[ak].account_id === session.account_id && accounts[ak].is_master !== false) { master = accounts[ak]; break; }
        }
        if (!master) throw new Error('仅主账户可操作');

        var sb = createSupabaseClient(env);
        var result = await sb.getAllCustomers(1, 200, '', 'created_at', 'asc', '', '', null, '');
        var all = result.data || [];
        var totalScanned = all.length;

        // 与前端字段识别检查一致：机构名/纯数字金额(支持小数)/年份 判定
        var INST_RE = /[一-龥]*(?:幼儿园|小学|中学|学校|学院|大学|医院|银行|有限公司|集团|公司|企业|工厂|保险|证券|基金|海关|政府|研究院|实验室|局|院|所|部|中心|厂|处|会|队|站)[一-龥（）()]*/;
        var NUM_RE = /^\d{4,5}(\.\d{1,2})?$/;
        var YEAR_RE = /^(19|20)\d{2}$/;

        var corrections = [];
        var errors = [];
        var aiCandidates = [];
        var localCorrected = 0;

        for (var i = 0; i < all.length; i++) {
          var c = all[i];
          if (!c || !c.mobile) continue;
          var company = c.company_name || '';
          var fund = c.fund || '';
          var note = c.note || '';
          var action = '';

          // 本地确定性规则（与前端 sanitizeClientFields 一致）
          if (!fund && NUM_RE.test(company) && !YEAR_RE.test(company)) {
            fund = company; company = ''; action = 'move_company_to_fund';
          } else if (!company && fund && /[一-龥]/.test(fund) && INST_RE.test(fund)) {
            company = fund; fund = ''; action = 'move_fund_to_company';
          } else if (NUM_RE.test(company) && !YEAR_RE.test(company) && /[一-龥]/.test(fund)) {
            var tmp = fund; fund = company; company = tmp; action = 'swap';
          }
          if (!action && !company && note) {
            var instMatch = note.match(INST_RE);
            if (instMatch) {
              company = instMatch[0];
              note = note.replace(instMatch[0], '').replace(/^[\s;；,，|]+/, '').trim();
              action = 'move_note_to_company';
            }
          }
          if (!action && !fund && note) {
            // 前后数字边界防截断：6位以上数字不截前5位，留给 AI 判断
            var numMatch = note.match(/(?<!\d)\d{4,5}(?:\.\d{1,2})?(?!\d)/);
            if (numMatch && !YEAR_RE.test(numMatch[0])) {
              fund = numMatch[0];
              note = note.replace(numMatch[0], '').replace(/^[\s;；,，|]+/, '').trim();
              action = 'move_note_number_to_fund';
            }
          }

          if (action) {
            localCorrected++;
            corrections.push({
              mobile: c.mobile, action: action,
              old_company_name: c.company_name || '', old_fund: c.fund || '', old_note: c.note || '',
              new_company_name: company, new_fund: fund, fund_value: fund
            });
            try {
              var upFields = {};
              if (company !== (c.company_name || '')) upFields.company_name = company;
              if (fund !== (c.fund || '')) upFields.fund = fund;
              if (note !== (c.note || '')) upFields.note = note;
              await sb.updateCustomer(c.mobile, upFields, c.account_id || '');
            } catch (e) {
              errors.push(c.mobile + ': ' + e.message);
            }
          } else if (isSuspiciousFundEntry(c, INST_RE)) {
            // 本地规则无法确定 → 送 AI 判断
            aiCandidates.push({
              mobile: c.mobile, name: c.name || '',
              company_name: c.company_name || '', fund: c.fund || '', note: c.note || '',
              account_id: c.account_id || ''
            });
          }
        }

        // AI 批量判断（每批 15 条，单批失败不中断整体）
        var aiCorrected = 0;
        if (aiCandidates.length > 0) {
          var batchSize = 15;
          for (var bi = 0; bi < aiCandidates.length; bi += batchSize) {
            var batch = aiCandidates.slice(bi, bi + batchSize);
            try {
              var aiRes = await aiJudgeFundBatch(env, batch);
              for (var ri = 0; ri < aiRes.length; ri++) {
                var rec = aiRes[ri];
                if (!rec || !rec.mobile) continue;
                var orig = null;
                for (var oi = 0; oi < batch.length; oi++) {
                  if (batch[oi].mobile === String(rec.mobile)) { orig = batch[oi]; break; }
                }
                if (!orig) continue;
                var aiAction = rec.action || 'skip';
                if (aiAction === 'skip') continue;
                var newCompany = rec.company_name !== undefined ? String(rec.company_name || '').trim() : orig.company_name;
                var newFund = rec.fund !== undefined ? String(rec.fund || '').trim() : orig.fund;
                var newNote = rec.note !== undefined ? String(rec.note || '').trim() : orig.note;
                // 按 action 强制字段清空，防止 AI 输出不一致
                if (aiAction === 'clear_fund') newFund = '';
                if (aiAction === 'move_company_to_fund') newCompany = '';
                if (aiAction === 'move_fund_to_company') newFund = '';
                // AI 提取金额放宽到 4-8 位（本地规则只认 4-5 位，更长数字由 AI 判断）
                if (aiAction === 'move_note_number_to_fund' && !/^\d{4,8}(?:\.\d{1,2})?$/.test(newFund)) newFund = '';
                var aiUp = {};
                if (newCompany !== orig.company_name) aiUp.company_name = newCompany;
                if (newFund !== orig.fund) aiUp.fund = newFund;
                if (newNote !== orig.note) aiUp.note = newNote;
                if (Object.keys(aiUp).length === 0) continue;
                aiCorrected++;
                corrections.push({
                  mobile: orig.mobile, action: aiAction,
                  old_company_name: orig.company_name, old_fund: orig.fund, old_note: orig.note,
                  new_company_name: newCompany, new_fund: newFund, fund_value: newFund
                });
                try {
                  await sb.updateCustomer(orig.mobile, aiUp, orig.account_id || '');
                } catch (e) {
                  errors.push(orig.mobile + ': ' + e.message);
                }
              }
            } catch (e) {
              errors.push('AI 判断批次失败: ' + e.message);
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          total_scanned: totalScanned,
          suspicious_found: aiCandidates.length,
          local_corrected: localCorrected,
          ai_corrected: aiCorrected,
          corrections: corrections,
          errors: errors
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : (e.message === '仅主账户可操作' ? 403 : 400),
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/dialer/stats/backup-test — 测试邮件：只带 1 条客户数据，验证 Resend 配置
    if (path === '/api/dialer/stats/backup-test' && request.method === 'POST') {
      try {
        var btAuth = request.headers.get('Authorization') || '';
        var btToken = btAuth.startsWith('Bearer ') ? btAuth.slice(7) : '';
        var btSession = await dialerValidateSession(env, btToken);
        if (!btSession) throw new Error('未登录');

        var btAccounts = await dialerGetAccounts(env);
        var btMaster = null;
        for (var bk = 0; bk < btAccounts.length; bk++) {
          if (btAccounts[bk].account_id === btSession.account_id && btAccounts[bk].is_master !== false) { btMaster = btAccounts[bk]; break; }
        }
        if (!btMaster) throw new Error('仅主账户可操作');

        var btBody = await request.json();
        var btEmail = (btBody.email || '').trim() || env.BACKUP_TARGET_EMAIL || await env.DATA_KV.get('config:backup_target_email') || '';
        if (!btEmail || btEmail.indexOf('@') === -1) throw new Error('请输入有效的邮箱地址');

        var btKey = env.RESEND_API_KEY || await env.DATA_KV.get('config:resend_api_key') || '';
        if (!btKey) throw new Error('请先配置 Resend API Key（Worker 环境变量 RESEND_API_KEY 或数据备份页面保存）');
        var btFrom = env.BHP_FROM_EMAIL || 'onboarding@resend.dev';

        // 只拉 1 条客户数据（单次子请求，不触发分页上限）
        var sample = null;
        var btUrl = env.SUPABASE_URL;
        var btKey2 = env.SUPABASE_KEY;
        if (btUrl && btKey2) {
          var btResp = await fetch(btUrl + '/rest/v1/customers?select=name,mobile,company_name,category,note,fund&order=created_at.desc&limit=1', {
            headers: { 'apikey': btKey2, 'Authorization': 'Bearer ' + btKey2 }
          });
          if (btResp.ok) {
            var btRows = await btResp.json();
            if (Array.isArray(btRows) && btRows.length > 0) sample = btRows[0];
          }
        }

        // 构造测试 CSV（1 条数据；无客户数据时用说明行）
        var btHeaders = ['name', 'mobile', 'company_name', 'category', 'note', 'fund'];
        var btLines = [btHeaders.join(',')];
        if (sample) {
          var bvals = [];
          for (var bhi = 0; bhi < btHeaders.length; bhi++) {
            var bv = sample[btHeaders[bhi]];
            if (bv === null || bv === undefined) bv = '';
            var bs = String(bv);
            if (bs.indexOf(',') !== -1 || bs.indexOf('"') !== -1 || bs.indexOf('\n') !== -1 || bs.indexOf('\r') !== -1) {
              bs = '"' + bs.replace(/"/g, '""') + '"';
            } else { bs = '"' + bs + '"'; }
            bvals.push(bs);
          }
          btLines.push(bvals.join(','));
        } else {
          btLines.push('（暂无客户数据，仅测试邮件通道）,,,,,');
        }
        var btCsv = String.fromCharCode(0xFEFF) + btLines.join('\r\n');
        var btBase64 = Buffer.from(btCsv, 'utf-8').toString('base64');

        var btSend = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + btKey },
          body: JSON.stringify({
            from: 'BHP Backup <' + btFrom + '>',
            to: [btEmail],
            subject: 'BHP 邮件测试',
            text: '这是一封测试邮件，用于验证邮件备份通道。附件包含 1 条客户数据' + (sample ? '' : '（当前无客户数据）') + '。',
            attachments: [{ filename: 'bhp_test.csv', content: btBase64, content_type: 'text/csv' }]
          })
        });
        if (!btSend.ok) {
          var btErr = await btSend.text();
          console.error('[backup-test] Resend API error:', btErr);
          throw new Error('邮件发送失败: ' + btErr.slice(0, 300));
        }

        return new Response(JSON.stringify({ success: true, email: btEmail, sample: !!sample }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /api/dialer/stats/my-count — quick count of current account's customers
    if (path === '/api/dialer/stats/my-count' && request.method === 'GET') {
      try {
        var mcAuth = request.headers.get('Authorization') || '';
        var mcToken = mcAuth.startsWith('Bearer ') ? mcAuth.slice(7) : '';
        var mcSession = await dialerValidateSession(env, mcToken);
        if (!mcSession) throw new Error('未登录');

        var supabaseUrl = env.SUPABASE_URL;
        var supabaseKey = env.SUPABASE_KEY;
        var count = 0;

        if (supabaseUrl && supabaseKey) {
          var mcHdrs = { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey, 'Prefer': 'count=exact' };
          var mcResp = await fetch(
            supabaseUrl + '/rest/v1/customers?select=id&account_id=eq.' + encodeURIComponent(mcSession.account_id) + '&limit=1',
            { headers: mcHdrs }
          );
          var contentRange = mcResp.headers.get('content-range');
          if (contentRange) {
            var parts = contentRange.split('/');
            count = parseInt(parts[parts.length - 1], 10) || 0;
          }
        }

        return new Response(JSON.stringify({ count: count }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: e.message === '未登录' ? 401 : 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/dialer/destruct — destruct PIN triggers full data export + email + wipe
    if (path === '/api/dialer/destruct' && request.method === 'POST') {
      try {
        var body = await request.json();
        // Turnstile 人机验证 — 配置了 TURNSTILE_SECRET 时强制校验，未配置则放行
        if (getTurnstileSecret(env) && !(await verifyTurnstile(env, body.turnstileToken, clientIP))) {
          return new Response(JSON.stringify({ error: '人机验证失败，请刷新页面后重试' }), {
            status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        var inputPin = (body.pin || '').trim();
        var destructPin = env.DESTRUCT_PIN || '';
        if (!destructPin || !inputPin || inputPin.length < 9 || inputPin.length > 12 || inputPin !== destructPin) {
          return new Response(JSON.stringify({ error: 'PIN 错误' }), {
            status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // 接收邮箱：优先环境变量 DESTRUCT_EMAIL / BACKUP_TARGET_EMAIL，兜底用保存的接收邮箱
        var destructEmail = env.DESTRUCT_EMAIL || env.BACKUP_TARGET_EMAIL || await env.DATA_KV.get('config:backup_target_email') || '';
        var resendKey = env.RESEND_API_KEY || await env.DATA_KV.get('config:resend_api_key') || '';
        var fromEmail = env.BHP_FROM_EMAIL || 'onboarding@resend.dev';

        // Step 1: Export all customers
        var sb = createSupabaseClient(env);
        var rows = [];
        try { rows = await sb.exportAllCustomers(); } catch(e) { rows = []; }

        // Step 2: Generate CSV
        var BOM = '﻿';
        var csvHeaders = ['name', 'mobile', 'company_name', 'category', 'note', 'fund', 'batch_label', 'created_at', 'last_operation', 'account_id'];
        var csvLines = [csvHeaders.join(',')];
        for (var ri = 0; ri < rows.length; ri++) {
          var r = rows[ri];
          var vals = [];
          for (var hi = 0; hi < csvHeaders.length; hi++) {
            var v = r[csvHeaders[hi]];
            if (v === null || v === undefined) v = '';
            var s = String(v);
            if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) {
              s = '"' + s.replace(/"/g, '""') + '"';
            } else { s = '"' + s + '"'; }
            vals.push(s);
          }
          csvLines.push(vals.join(','));
        }
        var csvContent = BOM + csvLines.join('\r\n');
        var base64 = Buffer.from(csvContent, 'utf-8').toString('base64');
        var today = new Date();
        var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0') + '_' + String(today.getHours()).padStart(2, '0') + String(today.getMinutes()).padStart(2, '0');

        // Step 3: Send email if configured
        var emailResult = '未发送';
        if (destructEmail && resendKey) {
          var resendResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + resendKey },
            body: JSON.stringify({
              from: 'BHP Destruct <' + fromEmail + '>',
              to: [destructEmail],
              subject: 'BHP 数据销毁备份 - ' + dateStr,
              text: '爆破密码已触发。附件为全部客户数据备份（共 ' + rows.length + ' 条），数据已从数据库清除。',
              attachments: [{ filename: 'bhp_destruct_' + dateStr + '.csv', content: base64, content_type: 'text/csv' }]
            })
          });
          emailResult = resendResp.ok ? '已发送' : '发送失败';
        }

        // Step 4: Delete all customers from Supabase
        var deleted = 0;
        if (sb && rows.length > 0) {
          try {
            var allMobiles = [];
            for (var di = 0; di < rows.length; di++) {
              var m = rows[di].mobile;
              if (m) allMobiles.push(m);
            }
            // Delete in chunks of 5000（与 Max rows 一致，减少子请求数量）
            var chunkSize = 5000;
            for (var ci = 0; ci < allMobiles.length; ci += chunkSize) {
              var chunk = allMobiles.slice(ci, ci + chunkSize);
              var filter = 'mobile=in.(' + chunk.map(encodeURIComponent).join(',') + ')';
              var supabaseUrl = env.SUPABASE_URL;
              var supabaseKey = env.SUPABASE_KEY;
              if (supabaseUrl && supabaseKey) {
                await fetch(supabaseUrl + '/rest/v1/customers?' + filter, {
                  method: 'DELETE',
                  headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey, 'Prefer': 'return=minimal' }
                });
                deleted += chunk.length;
              }
            }
          } catch(e) { console.error('[destruct] delete error:', e); }
        }

        return new Response(JSON.stringify({
          success: true,
          exported: rows.length,
          deleted: deleted,
          email: emailResult,
          time: dateStr
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== WeChat Count API (KV-synced per account) ====================

    if (path === '/api/dialer/wechat/count' && request.method === 'GET') {
      var wcAuth = (request.headers.get('Authorization') || '').replace('Bearer ', '');
      var wcSession = await dialerValidateSession(env, wcAuth);
      if (!wcSession) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      var d = new Date();
      var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var dateParam = new URL(request.url).searchParams.get('date') || today;
      var raw = await env.DATA_KV.get('dialer:wc:' + wcSession.account_id + ':' + dateParam);
      var count = raw ? parseInt(raw, 10) : 0;
      return new Response(JSON.stringify({ count: count, date: dateParam }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (path === '/api/dialer/wechat/count' && request.method === 'POST') {
      var wcPostAuth = (request.headers.get('Authorization') || '').replace('Bearer ', '');
      var wcPostSession = await dialerValidateSession(env, wcPostAuth);
      if (!wcPostSession) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      try {
        var wcBody = await request.json();
        var wcDelta = parseInt(wcBody.delta, 10) || 0;
        var wcDate = wcBody.date;
        if (!wcDate) {
          var wcNow = new Date();
          wcDate = wcNow.getFullYear() + '-' + String(wcNow.getMonth() + 1).padStart(2, '0') + '-' + String(wcNow.getDate()).padStart(2, '0');
        }
        var wcKey = 'dialer:wc:' + wcPostSession.account_id + ':' + wcDate;
        var wcCurrent = parseInt(await env.DATA_KV.get(wcKey) || '0', 10);
        var wcNew = Math.max(wcCurrent + wcDelta, 0);
        await env.DATA_KV.put(wcKey, String(wcNew));
        return new Response(JSON.stringify({ count: wcNew, date: wcDate }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== Central Auth Gate ====================

    var _dialerAccountId = '';
    if (path.startsWith('/api/dialer/') && !path.startsWith('/api/dialer/auth/') && !path.startsWith('/api/dialer/stats/') && path !== '/api/dialer/destruct') {
      var _authHeader = request.headers.get('Authorization') || '';
      var _sessionToken = _authHeader.startsWith('Bearer ') ? _authHeader.slice(7) : '';
      var _session = await dialerValidateSession(env, _sessionToken);
      if (!_session) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      _dialerAccountId = _session.account_id;
      var _viewId = request.headers.get('X-View-Account-Id') || '';
      if (_viewId) {
        var _accts = await dialerGetAccounts(env);
        var _isMaster = false;
        for (var _ai = 0; _ai < _accts.length; _ai++) {
          if (_accts[_ai].account_id === _session.account_id && _accts[_ai].is_master !== false) { _isMaster = true; break; }
        }
        if (_isMaster) { _dialerAccountId = _viewId; }
      }
    }

    // ==================== Data API ====================

    // Upload customers
    if (path === '/api/dialer/upload-customers' && request.method === 'POST') {
      try {
        const body = await request.json();
        const customers = body.customers || [];
        const batchLabel = body.batch_label || '';
        const accountId = _dialerAccountId;
        const tagged = customers.map(function(c) {
          return Object.assign({}, c, { batch_label: batchLabel, account_id: c.account_id || accountId });
        });
        const sb = createSupabaseClient(env);
        const result = await sb.upsertCustomers(tagged, accountId);
        return new Response(JSON.stringify({ success: true, count: result.count, skipped: result.skipped || 0 }), {
          headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Query customers
    if (path === '/api/dialer/customers' && request.method === 'GET') {
      try {
        const url2 = new URL(request.url);
        const page = parseInt(url2.searchParams.get('page') || '1');
        const pageSize = parseInt(url2.searchParams.get('pageSize') || '50');
        const search = url2.searchParams.get('search') || '';
        const sortBy = url2.searchParams.get('sortBy') || '';
        const sortDir = url2.searchParams.get('sortDir') || 'asc';
        const category = url2.searchParams.get('category') || '';
        const batchLabel = url2.searchParams.get('batch_label') || '';
        const exclude = url2.searchParams.get('exclude') || '';
        const excludeMobiles = exclude ? exclude.split(',').filter(Boolean) : [];
        const accountId = _dialerAccountId;
        const sb = createSupabaseClient(env);
        const result = await sb.getAllCustomers(page, pageSize, search, sortBy, sortDir, category, batchLabel, excludeMobiles, accountId);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ data: [], total: 0, error: e.message }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Batch pull (换一批)
    if (path === '/api/dialer/customers/random' && (request.method === 'GET' || request.method === 'POST')) {
      try {
        let limit = 50;
        let excludeMobiles = null;
        var accountId = _dialerAccountId;

        if (request.method === 'POST') {
          try {
            const body = await request.json();
            limit = Math.min(parseInt(body.limit) || 50, 200);
            if (Array.isArray(body.exclude) && body.exclude.length > 0) excludeMobiles = body.exclude;
          } catch (parseErr) { /* use defaults */ }
        } else {
          limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '50'), 200);
        }

        // ======== Per-account pull lock (prevents multi-device duplicate claiming) ========
        var lockKey = 'dialer:lock:pull:' + (accountId || 'anonymous');
        var lockValue = Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        var existingLock = await env.DATA_KV.get(lockKey);
        if (existingLock) {
          // Another pull is in-flight for this account — return empty to avoid duplicates
          return new Response(JSON.stringify({ data: [], total: 0, locked: true, limit: limit }), {
            headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
          });
        }
        // Acquire lock with short TTL (auto-release if worker crashes)
        await env.DATA_KV.put(lockKey, lockValue, { expirationTtl: 60 });

        try {
          var mergedExclude = (excludeMobiles || []).slice();
          try {
            var cooldownPrefix = 'dialer:cooldown:' + (accountId || '') + ':';
            var cooldownList = await env.DATA_KV.list({ prefix: cooldownPrefix });
            if (cooldownList && cooldownList.keys) {
              for (var ci = 0; ci < cooldownList.keys.length; ci++) {
                var cm = cooldownList.keys[ci].name.replace(cooldownPrefix, '');
                if (cm && mergedExclude.indexOf(cm) === -1) mergedExclude.push(cm);
              }
            }
          } catch (kvErr) { /* continue */ }

          const sb = createSupabaseClient(env);
          const result = await sb.getCustomersForDialer(limit, mergedExclude.length > 0 ? mergedExclude : null, accountId);
          const data = result.data || [];

          // Background: update pulled_at + write KV cooldowns + release lock
          // Fire-and-forget after response so the client gets instant feedback.
          ctx.waitUntil((async function() {
            try {
              if (data.length > 0) {
                const mobiles = data.map(function(c) { return c.mobile || ''; }).filter(Boolean);
                // Parallel: PATCH pulled_at in DB + write all cooldown KV entries
                var bgTasks = [sb.batchSetPulledAt(mobiles, accountId)];
                for (var mi = 0; mi < mobiles.length; mi++) {
                  var ck = 'dialer:cooldown:' + (accountId || '') + ':' + mobiles[mi];
                  bgTasks.push(env.DATA_KV.put(ck, new Date().toISOString(), { expirationTtl: 10 * 24 * 3600 }));
                }
                await Promise.all(bgTasks);
              }
            } catch (bgErr) {
              console.error('[pull] background update error:', bgErr.message);
            } finally {
              try { await env.DATA_KV.delete(lockKey); } catch (_) {}
            }
          })());

          return new Response(JSON.stringify({ data: data, total: result.total || 0, limit: limit }), {
            headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
          });
        } catch (innerErr) {
          // Always release lock on error
          try { await env.DATA_KV.delete(lockKey); } catch (_) { }
          throw innerErr;
        }
      } catch (e) {
        return new Response(JSON.stringify({ data: [], total: 0, error: e.message }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Batch category update
    if (path === '/api/dialer/customers/batch-category' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { batch_label, category } = body;
        const accountId = _dialerAccountId;
        if (!batch_label || !category) throw new Error('缺少 batch_label 或 category');
        const sb = createSupabaseClient(env);
        const result = await sb.batchUpdateCategory(batch_label, category, accountId);
        return new Response(JSON.stringify({ success: true, updated: result.count }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 批量转入公海
    if (path === '/api/dialer/customers/transfer-to-pool' && request.method === 'POST') {
      try {
        const poolBody = await request.json();
        const mobiles = poolBody.mobiles || [];
        if (!Array.isArray(mobiles) || mobiles.length === 0) {
          return new Response(JSON.stringify({ success: false, error: '缺少 mobiles 参数' }), {
            status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        const sb = createSupabaseClient(env);
        const transferred = await sb.transferToPool(mobiles, _dialerAccountId);
        return new Response(JSON.stringify({ success: true, transferred: transferred, total: mobiles.length }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Timeline
    if (path === '/api/dialer/timeline' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { mobile, entry } = body;
        const accountId = _dialerAccountId;
        if (!mobile || !entry || !entry.type) throw new Error('缺少参数');
        const sb = createSupabaseClient(env);
        await sb.updateCustomer(mobile, { last_operation: entry }, accountId);
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Update customer
    if (path === '/api/dialer/customers' && request.method === 'PATCH') {
      try {
        const body = await request.json();
        const { mobile, fields } = body;
        const accountId = _dialerAccountId;
        const sb = createSupabaseClient(env);
        const updated = await sb.updateCustomer(mobile, fields, accountId);
        return new Response(JSON.stringify({ success: true, data: updated }), {
          headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Delete customer(s)
    if (path === '/api/dialer/customers' && request.method === 'DELETE') {
      try {
        const body = await request.json();
        const { mobile, mobiles } = body;
        const accountId = _dialerAccountId;
        const sb = createSupabaseClient(env);
        if (mobiles && Array.isArray(mobiles)) {
          await sb.deleteCustomers(mobiles, accountId);
          return new Response(JSON.stringify({ success: true, count: mobiles.length }), {
            headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
          });
        } else if (mobile) {
          await sb.deleteCustomer(mobile, accountId);
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
          });
        }
        throw new Error('缺少 mobile 或 mobiles');
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Reassign customers to sub-account
    if (path === '/api/dialer/customers/reassign' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { mobiles, target_account_id } = body;
        if (!mobiles || !Array.isArray(mobiles) || mobiles.length === 0) throw new Error('请选择要分配的客户');
        if (!target_account_id) throw new Error('请选择目标子账户');

        // 所有已登录账号都可分配（2026-08-04 放开主账户限制）
        var _accounts = await dialerGetAccounts(env);
        var _targetFound = false;
        for (var _ak = 0; _ak < _accounts.length; _ak++) {
          if (_accounts[_ak].account_id === target_account_id) { _targetFound = true; break; }
        }
        if (!_targetFound) throw new Error('目标账号不存在');
        if (target_account_id === _dialerAccountId) throw new Error('不能分配给当前账号自己');

        var supabaseUrl2 = env.SUPABASE_URL;
        var supabaseKey2 = env.SUPABASE_KEY;
        if (!supabaseUrl2 || !supabaseKey2) throw new Error('Supabase 未配置');

        // Batch SELECT
        var selBatchSize = 100;
        var existingMobiles = [];
        for (var _sb = 0; _sb < mobiles.length; _sb += selBatchSize) {
          var selChunk = mobiles.slice(_sb, _sb + selBatchSize);
          var selInFilter = selChunk.map(function(m) { return encodeURIComponent(m); }).join(',');
          var checkUrl = supabaseUrl2 + '/rest/v1/customers?select=mobile&mobile=in.(' + selInFilter + ')&account_id=eq.' + encodeURIComponent(_dialerAccountId) + '&limit=' + selBatchSize;
          var checkResp = await fetch(checkUrl, { headers: { 'apikey': supabaseKey2, 'Authorization': 'Bearer ' + supabaseKey2 } });
          if (checkResp.ok) {
            var rows2 = await checkResp.json();
            if (Array.isArray(rows2)) { for (var _ri = 0; _ri < rows2.length; _ri++) { existingMobiles.push(rows2[_ri].mobile); } }
          }
        }
        if (existingMobiles.length === 0) throw new Error('所选客户在数据库中不存在');

        // Batch PATCH
        var patchBatchSize = 200; var updatedTotal = 0;
        for (var _bi = 0; _bi < existingMobiles.length; _bi += patchBatchSize) {
          var patchChunk = existingMobiles.slice(_bi, _bi + patchBatchSize);
          var patchInFilter = patchChunk.map(function(m) { return encodeURIComponent(m); }).join(',');
          var patchUrl2 = supabaseUrl2 + '/rest/v1/customers?mobile=in.(' + patchInFilter + ')';
          var patchResp2 = await fetch(patchUrl2, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey2, 'Authorization': 'Bearer ' + supabaseKey2, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ account_id: target_account_id, pulled_at: null })
          });
          if (patchResp2.ok) updatedTotal += patchChunk.length;
        }

        return new Response(JSON.stringify({ success: true, updated: updatedTotal, selected: mobiles.length, found: existingMobiles.length }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== OCR & AI (from megz) ====================

    // 云端 AI 视觉 OCR 识别 (全图)
    if (path === '/api/ocr' && request.method === 'POST') {
      try {
        const body = await request.json();
        const base64 = body.image.replace(/^data:image\/\w+;base64,/, '');
        
        let imgArray;
        try {
          const { Buffer } = await import('node:buffer');
          imgArray = Buffer.from(base64, 'base64');
        } catch(e) {
          const binaryString = atob(base64);
          imgArray = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            imgArray[i] = binaryString.charCodeAt(i);
          }
        }

        const visionKey = await env.DATA_KV.get('config:vision_api_key') || '';
        let text = '';

        const fullVisionPrompt = "请识别并提取这张表格截图中的所有文字内容，保持行对齐。\n" +
          "特别注意：\n" +
          "1. 表格第一列通常为单字姓氏或姓名，可能紧邻左上角蓝色三角标里的“新”字（或“新”）。该“新”字属于标记符号，并非姓名的一部分，请在识别提取姓名/姓氏时，务必自动清洗掉前置的“新”字（例如：将“新 蔡”或“新蔡”清洗并只保留姓氏“蔡”）。\n" +
          "2. 必须精准识别并提取出原始中文字符（如温、朱、刘、严等），绝对不要将其转换为拼音或英文字母（例如：严禁将“温”提取为“Wen”），也不要进行翻译。\n" +
          "请以结构化的文本列表输出（每一行代表一个客户，包含姓名、手机号、公司、公积金/备注等信息）。\n" +
          "只输出提取到的文本内容，不要包含任何解释、分析或 markdown 代码块。";

        if (visionKey) {
          try {
            const apiBase = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
            const resp = await fetch(apiBase, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + visionKey
              },
              body: JSON.stringify({
                model: 'gemini-2.5-flash',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: fullVisionPrompt
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: body.image
                        }
                      }
                    ]
                  }
                ],
                max_tokens: 1500,
                temperature: 0.1
              })
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data.choices && data.choices[0] && data.choices[0].message) {
                text = (data.choices[0].message.content || '').trim();
              }
            } else {
              console.error('Gemini full vision API failed: ' + (await resp.text()));
            }
          } catch (geminiErr) {
            console.error('Gemini full vision API call error:', geminiErr);
          }
        }

        if (!text) {
          try {
            const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
              image: imgArray,
              prompt: fullVisionPrompt,
              max_tokens: 1000
            });
            text = (response.response || '').trim();
          } catch (llamaErr) {
            const errStr = String(llamaErr.message || llamaErr);
            if (errStr.includes('terms') || errStr.includes('license') || errStr.includes('agree')) {
              try {
                console.log('Workers AI terms agreement needed for full vision, trying to auto-agree...');
                await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { prompt: 'agree' });
                const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
                  image: imgArray,
                  prompt: fullVisionPrompt,
                  max_tokens: 1000
                });
                text = (response.response || '').trim();
              } catch (retryErr) {
                throw new Error('Workers AI Llama Full Vision retry failed: ' + retryErr.message);
              }
            } else {
              throw llamaErr;
            }
          }
        }

        return new Response(JSON.stringify({ text: text }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Workers AI 单细胞视觉模型识别 (Fallback)
    if (path === '/api/ocr/vision_cell' && request.method === 'POST') {
      try {
        const body = await request.json();
        const base64 = body.image.replace(/^data:image\/\w+;base64,/, '');
        
        let imgArray;
        try {
          const { Buffer } = await import('node:buffer');
          imgArray = Buffer.from(base64, 'base64');
        } catch(e) {
          const binaryString = atob(base64);
          imgArray = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            imgArray[i] = binaryString.charCodeAt(i);
          }
        }

        const visionKey = await env.DATA_KV.get('config:vision_api_key') || '';
        let text = '';

        const visionPrompt = "Please extract the original Chinese character (usually a single surname, e.g., 温, 刘, 朱) from this image. You MUST output ONLY the original Chinese character itself. DO NOT translate to pinyin, DO NOT output English letters, and DO NOT write any explanation. If no Chinese character is found, output nothing. \n请提取图片中的中文字符（通常是单个姓氏，例如：温、刘、朱）。你必须**只输出原中文字符本身**。**严禁输出任何英文字母、拼音或解释说明**。如果没有中文字符，请输出空。";

        if (visionKey) {
          try {
            const apiBase = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
            const resp = await fetch(apiBase, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + visionKey
              },
              body: JSON.stringify({
                model: 'gemini-2.5-flash',
                messages: [
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: visionPrompt
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: body.image
                        }
                      }
                    ]
                  }
                ],
                max_tokens: 10,
                temperature: 0.1
              })
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data.choices && data.choices[0] && data.choices[0].message) {
                text = (data.choices[0].message.content || '').trim();
              }
            } else {
              console.error('Gemini vision API failed: ' + (await resp.text()));
            }
          } catch (geminiErr) {
            console.error('Gemini API call error:', geminiErr);
          }
        }

        if (!text) {
          try {
            const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
              image: [...imgArray],
              prompt: visionPrompt,
              max_tokens: 10
            });
            text = (response.response || '').trim();
          } catch (llamaErr) {
            const errStr = String(llamaErr.message || llamaErr);
            if (errStr.includes('terms') || errStr.includes('license') || errStr.includes('agree')) {
              try {
                console.log('Workers AI terms agreement needed, trying to auto-agree...');
                await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', { prompt: 'agree' });
                const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
                  image: [...imgArray],
                  prompt: visionPrompt,
                  max_tokens: 10
                });
                text = (response.response || '').trim();
              } catch (retryErr) {
                throw new Error('Workers AI Llama Vision retry failed: ' + retryErr.message);
              }
            } else {
              throw llamaErr;
            }
          }
        }

        // remove any AI conversational filler like "The text is:" or quotes
        text = text.replace(/^["']|["']$/g, '').replace(/The text is:?\s*/i, '').trim();

        return new Response(JSON.stringify({ text: text }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // OCR 文本提取（粘贴文本直接解析）
    if (path === '/api/ocr/text' && request.method === 'POST') {
      try {
        const body = await request.json();
        const rawText = body.rawText || '';
        if (!rawText.trim()) {
          return new Response(JSON.stringify({ contacts: [] }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Server-side phone number extraction
        var phoneRe = /1[3-9]\d{9}/g;
        var seenPhones = {};
        var extractedContacts = [];
        var lines = rawText.split(/\r?\n/);

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line) continue;
          var phones = line.match(phoneRe);
          if (!phones) continue;
          phones.forEach(function(phone) {
            if (seenPhones[phone]) return;
            seenPhones[phone] = true;

            var name = '', company = '', note = '', fund = '';
            var cols = line.split(/\t/);

            if (cols.length >= 3) {
              // Tab-separated format
              var phoneCol = -1;
              for (var ci = 0; ci < cols.length; ci++) {
                if (cols[ci].includes(phone)) { phoneCol = ci; break; }
              }
              if (phoneCol >= 0) {
                if (phoneCol > 0) {
                  var rawName = cols[phoneCol - 1].trim();
                  var cleanedName = rawName.replace(/^[新旧]\s*/, '').trim();
                  name = cleanedName.length === 0 ? rawName : cleanedName;
                }
                // 处理手机号后面的所有列，不再提前 break
                var _companyParts = [];
                var _noteParts = [];
                for (var ci2 = phoneCol + 1; ci2 < cols.length; ci2++) {
                  var val = cols[ci2].trim();
                  if (!val) continue;
                  // 公积金/金额：纯数字（含小数点和千分位逗号，如 11872.00 / 27,501）
                  if (/^[\d,]+\.?\d*$/.test(val)) {
                    if (!fund) fund = val.replace(/,/g, '');
                    continue;
                  }
                  // 状态关键词：跳过（既不是公司也不是备注）
                  if (/^(新增跟进|已拨|正常号|空号|停机|无法接通|挂断|意向|备注|新增|待跟进|已跟进|无效|未接|已接通|关机|占线|无人接听|通话中)$/.test(val)) {
                    continue;
                  }
                  // 判断是公司/机构名还是备注：包含机构后缀 → 公司；其余 → 备注
                  if (/幼儿园|小学|中学|大学|学院|学校|公司|企业|集团|工厂|医院|银行|保险|证券|基金|局$|院$|所$|部$|中心$|厂$|处$|会$|队$|站$|海关|政府|研究院|实验室/.test(val)) {
                    _companyParts.push(val);
                  } else {
                    _noteParts.push(val);
                  }
                }
                company = _companyParts.join(' ');
                if (!company && _noteParts.length > 0) {
                  // 兜底：没有识别到机构时，取第一个非数字列作为公司
                  company = _noteParts.shift();
                }
                if (!note && _noteParts.length > 0) {
                  note = _noteParts.join('; ');
                }
              }
            } else {
              // Space-separated or multi-line format
              var before = line.substring(0, line.indexOf(phone));
              var nm = before.match(/([一-龥]{1,4})\s*$/);
              if (nm) {
                var rawNm = nm[1];
                var cleanedNm = rawNm.replace(/^[新旧]\s*/, '');
                name = cleanedNm.length === 0 ? rawNm : cleanedNm;
              } else {
                // Look at previous lines for name (multi-line format)
                for (var j = i - 1; j >= 0 && j >= i - 2; j--) {
                  var prev = lines[j].trim();
                  if (prev && /^[一-龥]{1,4}$/.test(prev)) { name = prev; break; }
                }
              }

              var after = line.substring(line.indexOf(phone) + phone.length).trim();

              if (after && /^\d+/.test(after)) {
                // 公积金/金额在前（如 18662.00），后面可能跟公司名
                var fundMatch = after.match(/^([\d,]+\.?\d*)\s*(.*)/);
                if (fundMatch) {
                  fund = fundMatch[1].replace(/,/g, '');
                  var rest = fundMatch[2].trim();
                  if (rest && !/^\d+$/.test(rest)) {
                    company = rest.replace(/\s*(新增跟进|已拨|正常号|空号|停机|无法接通).*$/, '').trim();
                  }
                }
                // 如果同行没有公司名，检查下一行
                if (!company) {
                  for (var k = i + 1; k < lines.length && k <= i + 2; k++) {
                    var nl = lines[k].trim();
                    if (nl && !/^\d+$/.test(nl) && nl.length > 1) { company = nl; break; }
                  }
                }
                // 兜底：确实无法解析时放入 note
                if (!fund && !company) note = after;
              } else if (after) {
                // Phone line has trailing text → company，可能末尾带公积金数字
                var fundAtEnd = after.match(/([\d,]+\.?\d*)$/);
                if (fundAtEnd) {
                  fund = fundAtEnd[1].replace(/,/g, '');
                  company = after.replace(/[\d,]+\.?\d*$/g, '').replace(/\s*(新增跟进|已拨|正常号|空号|停机|无法接通).*$/, '').trim();
                } else {
                  company = after.replace(/[\d.]+[\d\s]*$/g, '').replace(/\s*(新增跟进|已拨|正常号|空号|停机|无法接通).*$/, '').trim();
                }
              } else {
                // Nothing after phone — scan next lines, collect ALL (not just first)
                var _nextCompanyParts = [];
                var _nextNoteParts = [];
                for (var k2 = i + 1; k2 < lines.length && k2 <= i + 5; k2++) {
                  var nl2 = lines[k2].trim();
                  if (!nl2) continue;
                  if (/^[\d,]+\.?\d*$/.test(nl2)) {
                    // 纯数字（含小数） → 公积金/金额
                    if (!fund) fund = nl2.replace(/,/g, '');
                  } else if (/^\d+$/.test(nl2)) {
                    // 纯整数 → 可能是有意义的数字备注
                    if (!note && !fund) note = nl2;
                  } else if (/^(新增跟进|已拨|正常号|空号|停机|无法接通|挂断|意向|备注|新增|待跟进|已跟进|无效|未接|已接通|关机|占线|无人接听|通话中)$/.test(nl2)) {
                    // 状态关键词 → 跳过（放在 note 里标记一下）
                    if (!note) note = nl2;
                  } else if (nl2.length > 1 && !/^\d{11}$/.test(nl2)) {
                    // 文本 → 判断是公司还是备注
                    if (/幼儿园|小学|中学|大学|学院|学校|公司|企业|集团|工厂|医院|银行|保险|证券|基金|局$|院$|所$|部$|中心$|厂$|处$|会$|队$|站$|海关|政府|研究院|实验室/.test(nl2)) {
                      _nextCompanyParts.push(nl2);
                    } else {
                      _nextNoteParts.push(nl2);
                    }
                  }
                }
                company = _nextCompanyParts.join(' ');
                if (!company && _nextNoteParts.length > 0) {
                  company = _nextNoteParts.shift();
                }
                if (!note && _nextNoteParts.length > 0) {
                  note = _nextNoteParts.join('; ');
                }
              }
            }

            extractedContacts.push({ name: name, phone: phone, company: company, note: note, fund: fund });
          });
        }

        return new Response(JSON.stringify({ contacts: extractedContacts }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }


    // POST /api/ocr/test — Test Gemini/AI API connectivity
    if (path === '/api/ocr/test' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { saveOnly, visionApiKey, visionApiBase } = body;
        
        if (visionApiKey !== undefined) {
          await env.DATA_KV.put('config:vision_api_key', visionApiKey || '');
        }
        if (visionApiBase !== undefined) {
          await env.DATA_KV.put('config:vision_api_base', visionApiBase || '');
        }
        
        if (saveOnly) {
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        // Connectivity test
        const apiKey = visionApiKey || await env.DATA_KV.get('config:vision_api_key') || '';
        if (!apiKey) {
          return new Response(JSON.stringify({ success: false, error: 'API Key 不能为空' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        let apiBase = visionApiBase || await env.DATA_KV.get('config:vision_api_base') || 'https://generativelanguage.googleapis.com/v1beta/openai/';
        if (!apiBase.endsWith('/')) apiBase += '/';
        const url = apiBase + 'chat/completions';
        
        const testResp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model: 'gemini-2.5-flash',
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5
          })
        });
        
        if (!testResp.ok) {
          const errText = await testResp.text();
          return new Response(JSON.stringify({ success: false, error: `API 返回错误 (${testResp.status}): ${errText}` }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // OCR 文本修正与数据融合：用文本 AI 修正本地 WASM OCR 的识别错误，或进行双通道（本地OCR与云端视觉）数据融合纠错
    if (path === '/api/ocr/correct' && request.method === 'POST') {
      try {
        const body = await request.json();
        const localContacts = body.localContacts || null;
        const visionText = body.visionText || '';
        const rawText = body.rawText || '';
        const fileName = body.fileName || '';

        // Get the regular AI config
        let provider = await env.DATA_KV.get('config:ai_provider') || 'gemini';
        const visionKey = await env.DATA_KV.get('config:vision_api_key') || '';
        const aiKey = await env.DATA_KV.get('config:ai_api_key') || await env.DATA_KV.get('config:deepseek_api_key') || env.AI_API_KEY || env.DEEPSEEK_API_KEY || '';
        
        let apiKey = aiKey;
        if (provider === 'gemini' || (visionKey && !aiKey)) {
          provider = 'gemini';
          apiKey = visionKey || aiKey;
        }

        let apiBase = await env.DATA_KV.get('config:ai_api_base') || env.AI_API_BASE;
        let model = await env.DATA_KV.get('config:ai_model') || env.AI_API_MODEL;

        if (provider === 'gemini') {
          if (!apiBase) apiBase = 'https://generativelanguage.googleapis.com/v1beta/openai/';
          if (!model) model = 'gemini-2.5-flash';
        } else {
          if (!apiBase) apiBase = 'https://api.deepseek.com/v1/';
          if (!model) model = 'deepseek-chat';
        }

        if (!localContacts) {
          // ==================== Case 1: 仅修正/解析文本 (原逻辑) ====================
          if (!rawText.trim()) {
            return new Response(JSON.stringify({ contacts: [] }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          if (!apiKey) {
            var fallbackContacts = extractContactsFromRawText(rawText);
            return new Response(JSON.stringify({ contacts: fallbackContacts, rawText: rawText, engine: 'regex_fallback' }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          let url = apiBase;
          if (!url.endsWith('/')) url += '/';
          url += 'chat/completions';

          const systemPrompt = '你是一个 OCR 文本修正专家。下面的文本是从图片中通过 OCR 引擎识别出来的，典型错误包括：\n' +
            '1. 数字识别错误：0和O/o混淆、1和l/I/|混淆、8和B混淆、3和8混淆、5和6混淆、7和1混淆\n' +
            '2. 汉字识别错误：形近字混淆（如"张"误识别为"长"或"弓长"、"葛"识别错、"莫"识别错等）\n' +
            '3. 手机号错误：数字混入字母（如138识别为I38）\n' +
            '4. 换行和空格导致文本断裂或错位\n\n' +
            '【文本排版特征与重要前置说明】：\n' +
            '源图片是一个从左往右横向排版的表格。**每一行都代表且仅代表一个独立客户的所有关联信息，每一列都是特定的类别分类。**\n' +
            '由于缺少框线或识别误差，数据可能会发生错位、换行或断裂。你需要根据“横向为一行”的视觉逻辑，以11位手机号为核心锚点，寻找并还原与其属于同一行的所有客户信息。\n' +
            '每一行的典型字段排列顺序通常为：【姓/姓名】 【手机号】 【公积金/金额】 【公司/单位名称】 【备注】\n' +
            '例如 OCR 识别出的文本行为：“青 13510625191 27501 苏州热工研究院有限公司深圳分公司”，请对应地提取出各字段。\n\n' +
            '【你的任务】：\n' +
            '1. 逐行修正 OCR 文本中的所有识别错误，恢复拼写及排版。\n' +
            '2. 将手机号恢复为 11 位纯数字。\n' +
            '3. 修正明显被拆分或错别的汉字。\n' +
            '4. 按照规则提取所有联系人信息。\n\n' +
            '【提取规则】：\n' +
            '- name: 中文姓名（1-4个汉字）。注意：第一列通常为单字姓氏（如常见的单字姓氏），即使只有一个汉字，也是联系人的姓名/姓氏，请务必完整提取并填充到 name 字段，绝对不要忽略、丢弃或擅自补全为其他字。\n' +
            '- phone: 11位纯数字手机号（1开头）\n' +
            '- company: 公司/单位名称（包括：公司、企业、工厂、学校、幼儿园、小学、中学、大学、学院、研究院、研究所、实验室、医院、银行、政府机构、事业单位等所有组织机构）。单位名称中的括号注释属于单位名的一部分（如"海关(养)"整体是单位名），不要拆开或放入备注\n' +
            '- fund: 对应的公积金数字或金额数字（例如 27501、9660、24100、5000 等）。公积金数字可能在单位名称之前，也可能在单位名称之后，无论位置如何都要识别为 fund，绝对不要放入 note。金额带小数时整个金额含小数一起作为 fund（如 5000.56），绝对不要把小数部分拆出来放入 note\n' +
            '- note: 必须映射到此处的真实备注信息（如果识别出其他不能归类为公司或资金的文本，请放入此处）。\n\n' +
            '输出纯JSON（禁止markdown包裹）：\n' +
            '{\n  "correctedText": "修正后的完整原文...",\n  "corrections": [{"original": "识别错的", "corrected": "正确的", "reason": "原因"}],\n' +
            '  "contacts": [{"name": "", "phone": "", "company": "", "fund": "", "note": ""}]\n}';

          let aiResp;
          let maxRetries = 3;
          let retryDelay = 2000;
          
          for (let i = 0; i < maxRetries; i++) {
            aiResp = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: '请修正以下 OCR 文本并提取联系人：\n\n' + rawText.substring(0, 8000) }
                ],
                temperature: 0,
                max_tokens: 4096
              })
            });
            
            if (aiResp.ok) {
              break;
            }
            
            if (aiResp.status === 429 || aiResp.status >= 500) {
              if (i < maxRetries - 1) {
                console.log(`[OCR Correct] AI API rate limited or server error (${aiResp.status}), retrying in ${retryDelay}ms...`);
                await new Promise(r => setTimeout(r, retryDelay));
                retryDelay *= 2; // Exponential backoff
                continue;
              }
            } else {
              // Not a retryable error (e.g. 400, 401)
              break;
            }
          }

          if (!aiResp.ok) {
            const errText = await aiResp.text();
            console.error('[OCR Correct] AI API error:', aiResp.status, errText.substring(0, 200));
            var fbContacts = extractContactsFromRawText(rawText);
            return new Response(JSON.stringify({ contacts: fbContacts, rawText: rawText, engine: 'regex_fallback' }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          const aiData = await aiResp.json();
          let content = aiData.choices[0].message.content.trim();
          if (content.startsWith('```')) {
            content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
          }

          let parsed;
          try {
            parsed = JSON.parse(content);
          } catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) { try { parsed = JSON.parse(jsonMatch[0]); } catch(e2) {} }
          }

          if (!parsed || !parsed.contacts || parsed.contacts.length === 0) {
            var fbContacts2 = extractContactsFromRawText(rawText);
            return new Response(JSON.stringify({ contacts: fbContacts2, rawText: rawText, engine: 'regex_fallback' }), {
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }

          var contacts = parsed.contacts.map(function(c) {
            if (!c) return null;
            var phone = (c.phone || '').replace(/[oOiIlLbB\s\-]/g, function(m) {
              return {o:'0',O:'0',i:'1',I:'1',l:'1',L:'1',b:'6',B:'8'}[m] || '';
            }).replace(/\D/g, '');
            
            // Clean name (strip leading "新", "旧", "听", "一" etc. badge characters)
            var name = (c.name || '').trim();
            name = name.replace(/^[新旧听一]+[\s\-\|]*/, '').replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').trim();
            
            return {
              name: name,
              phone: phone.length === 11 && phone[0] === '1' ? phone : '',
              company: (c.company || '').trim(),
              fund: (c.fund || '').trim(),
              note: (c.note || '').trim()
            };
          }).filter(function(c) { return c && c.phone; });

          console.log('[OCR Correct] AI corrected ' + contacts.length + ' contacts from raw text (' + rawText.length + ' chars)');

          try {
            const sb = createSupabaseClient(env);
            await sb.saveCorrection({
              rawText: rawText.substring(0, 1000),
              originalContacts: extractContactsFromRawText(rawText),
              correctedContacts: contacts,
              sourceFile: fileName || 'ocr_correct',
              ocrPipeline: 'text_ai_correct',
              ocrMode: 'bulk',
              editCount: parsed.corrections ? parsed.corrections.length : 1,
              metadata: { correctedText: parsed.correctedText || '', corrections: parsed.corrections || [] }
            });
          } catch (saveErr) {
            console.warn('[OCR Correct] Failed to save training data:', saveErr.message);
          }

          return new Response(JSON.stringify({
            contacts: contacts,
            rawText: rawText,
            correctedText: parsed.correctedText || '',
            corrections: parsed.corrections || [],
            engine: 'text_ai_correct'
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // ==================== Case 2: 本地 OCR 与云端 Vision AI 结果融合 (混合管线) ====================
        if (!apiKey) {
          return new Response(JSON.stringify({ contacts: localContacts, engine: 'local_only_no_key' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        let url = apiBase;
        if (!url.endsWith('/')) url += '/';
        url += 'chat/completions';

        const mergeSystemPrompt = '你是一个 OCR 数据融合专家。下面有两份来自同一张客户登记表格截图的识别数据：\n' +
          '1. 【本地 OCR 提取数据】：这是通过本地 Wasm Tesseract 切片提取的，它的特征是【手机号、公司名称和公积金/金额】识别极其精准，但由于表格左侧图标干扰，【姓名/姓氏】常被误识别（如将“温”识别为“严”）、遗漏或变为乱码字符。\n' +
          '2. 【云端视觉 AI 文本】：这是多模态大模型对原图进行完整 OCR 识别得到的原始文本，它的特征是【姓名/姓氏】识别极其精准（特别是单字姓氏），但手机号偶有细微数字错乱。\n\n' +
          '【你的任务】：\n' +
          '请利用这两份数据进行智能对齐与纠错融合：\n' +
          '- 以手机号为核心轴，将【本地 OCR 提取数据】的每一行与【云端视觉 AI 文本】对应的行进行匹配对齐。\n' +
          '- 姓名（name）字段：必须优先采用【云端视觉 AI 文本】中识别出的正确姓氏或姓名，纠正本地数据中因图标干扰导致的错别字（如将“严”纠正为“温/朱/刘”等原始汉字）、遗漏或多余字符。第一列通常为单字姓氏，请务必完整保留，不要过滤掉单字姓氏。\n' +
          '- 手机号（phone）字段：必须优先采用【本地 OCR 提取数据】中精准无误的 11 位数字手机号。\n' +
          '- 公司名称（company）、公积金（fund）和备注（note）字段：结合两份数据进行合理补充与合并。金额带小数时整个金额含小数一起作为 fund（如 5000.56），不要把小数部分拆进 note。\n\n' +
          '输出纯 JSON（不要包含 markdown 代码块包裹，只输出 JSON 本身，格式必须符合）：\n' +
          '{\n  "contacts": [{"name": "正确姓名", "phone": "11位纯数字手机", "company": "正确公司", "fund": "公积金金额", "note": "备注"}]\n}';

        const userMessage = '请将以下本地 OCR 提取的列表与云端 AI 视觉提取的原始文本进行合并纠错：\n\n' +
          '【本地 OCR 提取数据】：\n' + JSON.stringify(localContacts, null, 2) + '\n\n' +
          '【云端视觉 AI 文本】：\n' + visionText;

        const aiResp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: mergeSystemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.1,
            max_tokens: 4096
          })
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error('[OCR Merge] AI API error:', aiResp.status, errText.substring(0, 200));
          return new Response(JSON.stringify({ contacts: localContacts, engine: 'local_only_api_error' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const aiData = await aiResp.json();
        let content = aiData.choices[0].message.content.trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }

        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try { parsed = JSON.parse(jsonMatch[0]); } catch(e2) {}
          }
        }

        if (parsed && parsed.contacts) {
          const cleanedContacts = parsed.contacts.map(function(c) {
            if (!c) return null;
            var name = (c.name || '').trim();
            name = name.replace(/^[新旧听一]+[\s\-\|]*/, '').replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').trim();
            return {
              name: name,
              phone: (c.phone || '').trim(),
              company: (c.company || '').trim(),
              fund: (c.fund || '').trim(),
              note: (c.note || '').trim()
            };
          }).filter(Boolean);

          return new Response(JSON.stringify({ contacts: cleanedContacts, engine: 'hybrid_merge' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        return new Response(JSON.stringify({ contacts: localContacts, engine: 'local_only_parse_failed' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        console.error('[OCR Correct] error:', e.message);
        return new Response(JSON.stringify({ error: 'OCR 文本修正失败: ' + e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // POST /api/ocr/categorize — Clean, correct, and re-classify contacts lists using text AI
    if (path === '/api/ocr/categorize' && request.method === 'POST') {
      let contactsList = [];
      try {
        const body = await request.json();
        contactsList = body.contacts || [];
        const fileName = body.fileName || '';
        
        if (contactsList.length === 0) {
          return new Response(JSON.stringify({ contacts: [] }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        let provider = await env.DATA_KV.get('config:ai_provider') || 'gemini';
        const visionKey = await env.DATA_KV.get('config:vision_api_key') || '';
        const aiKey = await env.DATA_KV.get('config:ai_api_key') || await env.DATA_KV.get('config:deepseek_api_key') || env.AI_API_KEY || env.DEEPSEEK_API_KEY || '';
        
        let apiKey = aiKey;
        if (provider === 'gemini' || (visionKey && !aiKey)) {
          provider = 'gemini';
          apiKey = visionKey || aiKey;
        }

        let apiBase = await env.DATA_KV.get('config:ai_api_base') || env.AI_API_BASE;
        let model = await env.DATA_KV.get('config:ai_model') || env.AI_API_MODEL;

        if (provider === 'gemini') {
          if (!apiBase) apiBase = 'https://generativelanguage.googleapis.com/v1beta/openai/';
          if (!model) model = 'gemini-2.5-flash';
        } else {
          if (!apiBase) apiBase = 'https://api.deepseek.com/v1/';
          if (!model) model = 'deepseek-chat';
        }

        if (!apiKey) {
          return new Response(JSON.stringify({ contacts: contactsList, engine: 'bypass' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        let url = apiBase;
        if (!url.endsWith('/')) url += '/';
        url += 'chat/completions';

        const systemPrompt = '你是一个通讯录数据清洗与智能分类专家。输入是一个包含从图片表格中通过本地 OCR 识别初步对齐的联系人 JSON 数组。\n' +
          '【重要前置说明】：原始图片严格遵循“从左往右横向为一行（一个客户的所有信息），一列为一个特定类别”的结构。由于表格无框线、列间距小或识别误差，同一行的数据可能会发生错位，你需要根据“一行代表一个客户”的逻辑，对数据进行横向重新拼装与修正。\n\n' +
          '【具体清洗与归类规则】：\n' +
          '1. **姓名 (name)**：通常位于第一列，为1-4个汉字（允许单字姓氏，绝对不能漏掉）。如果“公司”等信息被误放入姓名列，请将其移出。姓名或公司若存在形近字识别错误，请结合语境修正。\n' +
          '2. **电话 (phone)**：这是最关键的锚点信息，绝对正确且不可更改！你需要以电话号码为准基线，寻找与其属于同一行的“姓名”、“公司”和“备注”信息。\n' +
          '3. **公司/单位 (company)**：如果原数据中公司名被错放在了姓名或备注列，请根据行对应关系，将其移动到此处；纠正错别字（如“腾城”->“鹏城”）。\n' +
          '4. **备注 (note)**：必须映射到数据库的备注栏。真实的附加信息（如职称、日期、职位、跟进情况等）。如果备注里包含公司名，请将公司名抽离到 company 字段，剩下的留作 note。不要随意舍弃有用的备注信息。\n\n' +
          '【输出格式】：\n' +
          '请严格遵循下方纯 JSON 格式输出（不要输出 Markdown 格式的 ```json），确保每个对象都包含 name, phone, company, note 四个字段：\n' +
          '{\n  "contacts": [\n    { "name": "正确的姓名", "phone": "13XXXXXXXXX", "company": "正确归类后的公司", "note": "提取的备注信息" }\n  ]\n}';

        const aiResp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '请对以下初步提取的联系人列表进行清洗和重新分类归类：\n\n' + JSON.stringify(contactsList, null, 2) }
            ],
            temperature: 0,
            max_tokens: 4096
          })
        });

        if (!aiResp.ok) {
          const errText = await aiResp.text();
          console.error('[OCR Categorize] AI API error:', aiResp.status, errText.substring(0, 200));
          return new Response(JSON.stringify({ contacts: contactsList, engine: 'bypass_api_error' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const aiData = await aiResp.json();
        let content = aiData.choices[0].message.content.trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }

        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch (e) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) { try { parsed = JSON.parse(jsonMatch[0]); } catch(e2) {} }
        }

        if (!parsed || !parsed.contacts || parsed.contacts.length === 0) {
          return new Response(JSON.stringify({ contacts: contactsList, engine: 'bypass_parse_error' }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        console.log('[OCR Categorize] AI processed ' + parsed.contacts.length + ' contacts');

        return new Response(JSON.stringify({
          contacts: parsed.contacts,
          engine: 'text_ai_categorize'
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (e) {
        console.error('[OCR Categorize] error:', e.message);
        return new Response(JSON.stringify({ contacts: contactsList, error: e.message, engine: 'bypass_exception' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Helper: phone + contact extraction from raw text (regex fallback)
    function extractContactsFromRawText(rawText) {
      var phoneRe = /1[3-9]\d{9}/g;
      var seenPhones = {};
      var contacts = [];
      var lines = rawText.split(/\r?\n/);
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li].trim();
        if (!line) continue;
        var phones = line.match(phoneRe);
        if (!phones) continue;
        phones.forEach(function(phone) {
          if (seenPhones[phone]) return;
          seenPhones[phone] = true;
          var name = '', company = '', fund = '', note = '';
          var before = line.substring(0, line.indexOf(phone)).trim();
          var nm = before.match(/(?:^|\s)([一-龥]{2,4})(?=\s|$)/);
          if (!nm) nm = before.match(/^([一-龥]{2,4})/);
          if (!nm) nm = before.match(/([一-龥]{1,4})\s*$/);
          if (nm) name = nm[1].replace(/^[新旧听一]+[\s\-\|]*/, '');
          var after = line.substring(line.indexOf(phone) + phone.length).trim();

          if (after) {
            // 同行有文本：先提取末尾公积金数字
            var fundAtEnd = after.match(/([\d,]+\.?\d*)$/);
            if (fundAtEnd) {
              fund = fundAtEnd[1].replace(/,/g, '');
              after = after.replace(/[\d,]+\.?\d*$/g, '').trim();
            }
            // 公积金数字在单位名之前（如 "5000 幼儿园"）时也能提取
            var fundAtStart = after.match(/^([\d,]+\.?\d*)\s*/);
            if (fundAtStart) {
              if (!fund) fund = fundAtStart[1].replace(/,/g, '');
              after = after.replace(/^[\d,]+\.?\d*\s*/, '').trim();
            }
            // 清理状态关键词
            after = after.replace(/\s*(新增跟进|已拨|正常号|空号|停机|无法接通|挂断|意向|备注|新增|待跟进|已跟进|无效|未接|已接通|关机|占线|无人接听|通话中)$/, '').trim();
            if (after) {
              company = after;
            }
          }

          // 同行没有文本或只有公积金 → 扫描后续行
          if (!company && !note) {
            var _fbCompanyParts = [];
            var _fbNoteParts = [];
            for (var kj = li + 1; kj < lines.length && kj <= li + 5; kj++) {
              var nll = lines[kj].trim();
              if (!nll) continue;
              if (/^[\d,]+\.?\d*$/.test(nll)) {
                if (!fund) fund = nll.replace(/,/g, '');
              } else if (/^(新增跟进|已拨|正常号|空号|停机|无法接通|挂断|意向|备注|新增|待跟进|已跟进|无效|未接|已接通|关机|占线|无人接听|通话中)$/.test(nll)) {
                if (!note) note = nll;
              } else if (nll.length > 1 && !/^\d{11}$/.test(nll)) {
                if (/幼儿园|小学|中学|大学|学院|学校|公司|企业|集团|工厂|医院|银行|保险|证券|基金|局$|院$|所$|部$|中心$|厂$|处$|会$|队$|站$|海关|政府|研究院|实验室/.test(nll)) {
                  _fbCompanyParts.push(nll);
                } else {
                  _fbNoteParts.push(nll);
                }
              }
            }
            if (_fbCompanyParts.length > 0) {
              company = _fbCompanyParts.join(' ');
            } else if (_fbNoteParts.length > 0) {
              company = _fbNoteParts.shift();
            }
            if (_fbNoteParts.length > 0) {
              note = _fbNoteParts.join('; ');
            }
          }

          // 如果上面都没解析出公司，after 前面已经被置为 company
          contacts.push({ name: name, phone: phone, company: company, fund: fund, note: note || '' });
        });
      }
      return contacts;
    }


    // === OCR Correction Training Data APIs ===

    // POST /api/ocr/correction — save a correction pair
    if (path === '/api/ocr/correction' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { rawText, originalContacts, correctedContacts, sourceFile, ocrPipeline, ocrMode, metadata } = body;
        if (!rawText && (!originalContacts || originalContacts.length === 0)) {
          return new Response(JSON.stringify({ error: '缺少 rawText 或 originalContacts' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // Compute edit_count by comparing original vs corrected
        var editCount = 0;
        if (originalContacts && correctedContacts) {
          for (var i = 0; i < Math.max(originalContacts.length, correctedContacts.length); i++) {
            var orig = originalContacts[i] || {};
            var corr = correctedContacts[i] || {};
            if (orig.name !== corr.name) editCount++;
            if (orig.phone !== corr.phone) editCount++;
            if (orig.company !== corr.company) editCount++;
            if (orig.note !== corr.note) editCount++;
          }
        }

        const sb = createSupabaseClient(env);
        const saved = await sb.saveCorrection({
          rawText: rawText || '',
          originalContacts: originalContacts || [],
          correctedContacts: correctedContacts || [],
          sourceFile: sourceFile || '',
          ocrPipeline: ocrPipeline || 'ai_vision',
          ocrMode: ocrMode || 'bulk',
          editCount: editCount,
          metadata: metadata || {}
        });

        // Update KV caches
        try {
          var countStr = await env.DATA_KV.get('correction:count');
          var count = parseInt(countStr || '0', 10) + 1;
          await env.DATA_KV.put('correction:count', String(count), { expirationTtl: 3600 });
          await env.DATA_KV.put('correction:last_sync', new Date().toISOString());

          // Update few_shot_examples ring buffer if user made edits
          if (editCount > 0 && originalContacts && correctedContacts) {
            var examples = [];
            try {
              var cached = await env.DATA_KV.get('config:few_shot_examples');
              if (cached) examples = JSON.parse(cached);
            } catch(e) {}
            examples.unshift({
              rawText: (rawText || '').substring(0, 500),
              originalContacts: originalContacts.map(function(c) {
                return { name: c.name || '', phone: c.phone || '', company: c.company || '', note: c.note || '' };
              }),
              correctedContacts: correctedContacts.map(function(c) {
                return { name: c.name || '', phone: c.phone || '', company: c.company || '', note: c.note || '' };
              })
            });
            if (examples.length > 20) examples.length = 20;
            await env.DATA_KV.put('config:few_shot_examples', JSON.stringify(examples), { expirationTtl: 86400 });
          }
        } catch (kvErr) {
          console.error('[OCR correction] KV update failed:', kvErr.message);
        }

        return new Response(JSON.stringify({ success: true, id: saved ? saved.id : null }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        console.error('[OCR correction] Save failed:', e.message);
        return new Response(JSON.stringify({ error: '保存修正记录失败: ' + e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /api/ocr/corrections — list corrections
    if (path === '/api/ocr/corrections' && request.method === 'GET') {
      try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 200);
        const minEdits = parseInt(url.searchParams.get('minEdits') || '0', 10);
        const sort = url.searchParams.get('sort') || 'newest';

        const sb = createSupabaseClient(env);
        const result = await sb.getCorrections(page, pageSize, minEdits, sort);

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        console.error('[OCR corrections] List failed:', e.message);
        return new Response(JSON.stringify({ error: '获取修正记录失败: ' + e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /api/ocr/corrections/export — export as JSONL for fine-tuning
    if (path === '/api/ocr/corrections/export' && request.method === 'GET') {
      try {
        const url = new URL(request.url);
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 1000);

        const sb = createSupabaseClient(env);
        const rows = await sb.getCorrectionsForExport(limit);

        var jsonlLines = [];
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          jsonlLines.push(JSON.stringify({
            input: {
              rawText: row.raw_text || '',
              contacts: row.original_json || []
            },
            output: {
              contacts: row.corrected_json || []
            }
          }));
        }

        return new Response(jsonlLines.join('\n'), {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Content-Disposition': 'attachment; filename="ocr_training_data.jsonl"',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (e) {
        console.error('[OCR correction export] Failed:', e.message);
        return new Response(JSON.stringify({ error: '导出失败: ' + e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /api/ocr/corrections/stats — quick stats
    if (path === '/api/ocr/corrections/stats' && request.method === 'GET') {
      try {
        var count = 0;
        var lastSync = '';
        try {
          var cachedCount = await env.DATA_KV.get('correction:count');
          if (cachedCount) count = parseInt(cachedCount, 10) || 0;
          lastSync = await env.DATA_KV.get('correction:last_sync') || '';
        } catch (kvErr) {}

        // Fallback: query Supabase directly if KV is empty
        if (count === 0) {
          const sb = createSupabaseClient(env);
          count = await sb.getCorrectionsCount();
        }

        return new Response(JSON.stringify({ count: count, lastSync: lastSync }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        console.error('[OCR stats] Failed:', e.message);
        return new Response(JSON.stringify({ count: 0, lastSync: '' }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== Static Assets ====================

    if (path === '/manifest.json') {
      const manifest = {
        name: '减肥打卡',
        short_name: '减肥打卡',
        description: '减肥打卡',
        start_url: '/dialer',
        display: 'standalone',
        background_color: '#f2f2f7',
        theme_color: '#f2f2f7',
        orientation: 'portrait',
        icons: [
          { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      };
      return new Response(JSON.stringify(manifest), {
        headers: { 'Content-Type': 'application/manifest+json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (path === '/icon.svg') {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8a0c8"/>
      <stop offset="50%" stop-color="#d08ae8"/>
      <stop offset="100%" stop-color="#a8a0f0"/>
    </linearGradient>
    <linearGradient id="hair" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4a3050"/>
      <stop offset="100%" stop-color="#3d2840"/>
    </linearGradient>
    <radialGradient id="blush" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ff90a8" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#ff90a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- bg -->
  <rect width="512" height="512" rx="120" fill="url(#bg)"/>
  <!-- hair back -->
  <ellipse cx="256" cy="180" rx="200" ry="160" fill="url(#hair)"/>
  <!-- hair sides -->
  <path d="M56 200 Q56 340 120 400 Q80 320 60 220 Z" fill="url(#hair)"/>
  <path d="M456 200 Q456 340 392 400 Q432 320 452 220 Z" fill="url(#hair)"/>
  <!-- face -->
  <ellipse cx="256" cy="260" rx="130" ry="140" fill="#ffe4d0"/>
  <!-- bangs -->
  <path d="M56 200 Q100 100 180 120 Q200 70 256 90 Q312 70 332 120 Q412 100 456 200 Q380 140 256 130 Q132 140 56 200 Z" fill="url(#hair)"/>
  <!-- ahoge -->
  <path d="M240 92 Q256 50 272 92" fill="none" stroke="#4a3050" stroke-width="5" stroke-linecap="round"/>
  <!-- eyes -->
  <ellipse cx="195" cy="250" rx="28" ry="34" fill="white"/>
  <ellipse cx="317" cy="250" rx="28" ry="34" fill="white"/>
  <ellipse cx="200" cy="252" rx="18" ry="22" fill="#3d2840"/>
  <ellipse cx="322" cy="252" rx="18" ry="22" fill="#3d2840"/>
  <!-- eye highlights -->
  <circle cx="208" cy="240" r="7" fill="white"/>
  <circle cx="195" cy="258" r="3.5" fill="white"/>
  <circle cx="330" cy="240" r="7" fill="white"/>
  <circle cx="317" cy="258" r="3.5" fill="white"/>
  <!-- eyebrows -->
  <path d="M165 210 Q190 200 220 212" fill="none" stroke="#3d2840" stroke-width="5" stroke-linecap="round"/>
  <path d="M347 210 Q322 200 292 212" fill="none" stroke="#3d2840" stroke-width="5" stroke-linecap="round"/>
  <!-- blush -->
  <ellipse cx="145" cy="285" rx="30" ry="18" fill="url(#blush)"/>
  <ellipse cx="367" cy="285" rx="30" ry="18" fill="url(#blush)"/>
  <!-- mouth -->
  <path d="M230 300 Q256 330 282 300" fill="none" stroke="#e88090" stroke-width="5" stroke-linecap="round"/>
  <!-- ribbon accessory -->
  <g transform="translate(360, 100)">
    <ellipse cx="0" cy="0" rx="30" ry="18" fill="#ff7090"/>
    <ellipse cx="-20" cy="-10" rx="18" ry="24" fill="#ff6088" transform="rotate(-30)"/>
    <ellipse cx="20" cy="-10" rx="18" ry="24" fill="#ff80a0" transform="rotate(30)"/>
    <circle cx="0" cy="-5" r="8" fill="#ffe040"/>
  </g>
  <!-- sparkles -->
  <g fill="white" opacity="0.7">
    <polygon points="420,160 424,150 428,160 438,164 428,168 424,178 420,168 410,164" />
    <polygon points="80,120 83,113 86,120 93,123 86,126 83,133 80,126 73,123" />
    <polygon points="440,320 443,313 446,320 453,323 446,326 443,333 440,326 433,323" />
  </g>
</svg>`;
      return new Response(svg, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (path === '/icon.png') {
      return new Response(Uint8Array.from(atob('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'), c => c.charCodeAt(0)), {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*' }
      });
    }


    // ==================== Diet API ====================

    if (path === '/api/diet/data' && request.method === 'GET') {
      try {
        const url2 = new URL(request.url);
        const date = url2.searchParams.get('date') || new Date().toISOString().slice(0,10);
        const raw = await env.DATA_KV.get('diet:' + date);
        const rawCfg = await env.DATA_KV.get('diet:config');
        let config = {}; try { config = JSON.parse(rawCfg); } catch(e) {}
        let data = {}; try { data = JSON.parse(raw); } catch(e) {}
        if (!data.yesterdayWeight) {
          const yd = yesterdayKey(date);
          const rawY = await env.DATA_KV.get('diet:' + yd);
          if (rawY) { try { const yD = JSON.parse(rawY); if (yD.weight) data.yesterdayWeight = yD.weight; } catch(e) {} }
        }
        return new Response(JSON.stringify({ data, config }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/diet/data' && request.method === 'POST') {
      try {
        const body = await request.json();
        const date = body.date || new Date().toISOString().slice(0,10);
        const data = body.data || {};
        await env.DATA_KV.put('diet:' + date, JSON.stringify(data));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (path === '/api/diet/config' && request.method === 'POST') {
      try {
        const cfg = await request.json();
        await env.DATA_KV.put('diet:config', JSON.stringify(cfg));
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // GET /api/diet/monthly?month=YYYY-MM — 返回当月每天是否有打卡记录
    if (path === '/api/diet/monthly' && request.method === 'GET') {
      try {
        const url2 = new URL(request.url);
        const month = url2.searchParams.get('month') || new Date().toISOString().slice(0, 7);
        const prefix = 'diet:' + month;
        const list = await env.DATA_KV.list({ prefix });
        const days = {};
        for (const k of list.keys) {
          const dateKey = k.name.replace('diet:', '');
          try {
            const raw = await env.DATA_KV.get(k.name);
            const d = JSON.parse(raw);
            if (d && d.completed) {
              days[dateKey] = true;
            }
          } catch(e) {}
        }
        return new Response(JSON.stringify({ days }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ==================== Page Serving ====================

    // 学习中心页面（支持自定义内容）
    if (path === '/learn' || path === '/learn/') {
      try {
        var learnRaw = await env.DATA_KV.get('config:learn');
        var learnContent = LEARN_DEFAULT_CONTENT;
        if (learnRaw) {
          try {
            var learnCfg = JSON.parse(learnRaw);
            if (learnCfg.html && learnCfg.html.trim()) {
              learnContent = learnCfg.html;
            }
          } catch (parseErr) { /* use default */ }
        }
        var learnPage = LEARN_HTML.replace('<!--LEARN_CONTENT-->', learnContent);
        return new Response(learnPage, {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' }
        });
      } catch (e) {
        // Fallback to default
        return new Response(LEARN_HTML.replace('<!--LEARN_CONTENT-->', LEARN_DEFAULT_CONTENT), {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' }
        });
      }
    }

    // 减肥打卡页面
    if (path === '/diet' || path === '/diet/') {
      return new Response(DIET_HTML, {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' }
      });
    }

    // BHP 拨号器 — 首页，需要认证
    if (path === '/' || path === '' || path === '/dialer' || path === '/dialer/') {
      return new Response(DIALER_HTML, {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache', 'Expires': '0'
        }
      });
    }

    // 404
    return new Response('Not Found', { status: 404 });
  }
};
