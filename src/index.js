// BHP 智能快捷拨号助手 - Cloudflare Worker
// 部署后绑定 DATA_KV 即可使用

import { DIALER_HTML } from './dialer_html.js';
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
  return JSON.parse(raw);
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

        if (data.length > 0) {
          const mobiles = data.map(function(c) { return c.mobile || ''; }).filter(Boolean);
          sb.batchSetPulledAt(mobiles, accountId).catch(function() { /* fire-and-forget */ });
          for (var mi = 0; mi < mobiles.length; mi++) {
            var ck = 'dialer:cooldown:' + (accountId || '') + ':' + mobiles[mi];
            env.DATA_KV.put(ck, new Date().toISOString(), { expirationTtl: 10 * 24 * 3600 }).catch(function() { });
          }
        }

        return new Response(JSON.stringify({ data: data, total: result.total || 0, limit: limit }), {
          headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
        });
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

    // ==================== Page Serving ====================

    if (path === '/dialer' || path === '/dialer/' || path === '/') {
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
