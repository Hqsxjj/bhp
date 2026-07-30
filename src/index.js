// BHP 智能快捷拨号助手 - Cloudflare Worker
// 部署后绑定 DATA_KV 即可使用

import { DIALER_HTML } from './dialer_html.js';
import { DIET_HTML } from './diet_html.js';
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

// ========== Main Worker ==========

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

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
        var accountName = (body.account_name || '').trim();
        var pin = (body.pin || '').trim();
        if (!accountName || pin.length < 4) throw new Error('请输入账户名和 PIN 码');

        var accounts = await dialerGetAccounts(env);
        var account = null;
        for (var ai = 0; ai < accounts.length; ai++) {
          if (accounts[ai].account_name === accountName || accounts[ai].account_id === accountName) { account = accounts[ai]; break; }
        }
        if (!account) throw new Error('账户不存在');
        if (!account.active) throw new Error('该账户已被禁用');
        if (account.pin_hash !== dialerHashPin(pin)) throw new Error('PIN 码错误');

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

        var key = await env.DATA_KV.get('config:resend_api_key') || '';

        return new Response(JSON.stringify({ hasKey: !!key }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ hasKey: false, error: e.message }), {
          status: e.message === '未登录' ? 401 : 400,
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
        var targetEmail = (body.email || '').trim();
        if (!targetEmail || targetEmail.indexOf('@') === -1) throw new Error('请输入有效的邮箱地址');

        // Get Resend config
        var resendKey = await env.DATA_KV.get('config:resend_api_key') || '';
        if (!resendKey) throw new Error('请先在数据备份页面配置 Resend API Key');

        var fromEmail = await env.DATA_KV.get('config:backup_from_email') || 'backup@resend.dev';

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
          throw new Error('邮件发送失败，请检查 Resend API Key 和发送者邮箱配置');
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
    if (path.startsWith('/api/dialer/') && !path.startsWith('/api/dialer/auth/') && !path.startsWith('/api/dialer/stats/')) {
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

        var _accounts = await dialerGetAccounts(env);
        var _masterFound = false;
        for (var _aj = 0; _aj < _accounts.length; _aj++) {
          if (_accounts[_aj].account_id === _dialerAccountId && _accounts[_aj].is_master !== false) { _masterFound = true; break; }
        }
        if (!_masterFound) throw new Error('仅主账户可分配客户');

        var _targetFound = false;
        for (var _ak = 0; _ak < _accounts.length; _ak++) {
          if (_accounts[_ak].account_id === target_account_id) { _targetFound = true; break; }
        }
        if (!_targetFound) throw new Error('目标子账户不存在');

        var supabaseUrl2 = env.SUPABASE_URL;
        var supabaseKey2 = env.SUPABASE_KEY;
        if (!supabaseUrl2 || !supabaseKey2) throw new Error('Supabase 未配置');

        // Batch SELECT
        var selBatchSize = 100;
        var existingMobiles = [];
        for (var _sb = 0; _sb < mobiles.length; _sb += selBatchSize) {
          var selChunk = mobiles.slice(_sb, _sb + selBatchSize);
          var selInFilter = selChunk.map(function(m) { return encodeURIComponent(m); }).join(',');
          var checkUrl = supabaseUrl2 + '/rest/v1/customers?select=mobile&mobile=in.(' + selInFilter + ')&limit=' + selBatchSize;
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
            '- company: 公司/单位名称（包括：公司、企业、工厂、学校、幼儿园、小学、中学、大学、学院、研究院、研究所、实验室、医院、银行、政府机构、事业单位等所有组织机构）\n' +
            '- fund: 对应的公积金数字或金额数字（通常在手机号之后、公司名称之前，例如 27501、9660、24100 等）\n' +
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
          '- 公司名称（company）、公积金（fund）和备注（note）字段：结合两份数据进行合理补充与合并。\n\n' +
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
        background_color: '#ededed',
        theme_color: '#4a6cf7',
        orientation: 'portrait',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
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
