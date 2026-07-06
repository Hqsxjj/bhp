// Supabase REST API helper for Cloudflare Workers
// Uses fetch() directly to avoid SDK compatibility issues

export function createSupabaseClient(env) {
  const baseUrl = env.SUPABASE_URL;
  const key = env.SUPABASE_KEY;

  if (!baseUrl || !key) {
    console.warn('[supabase] SUPABASE_URL or SUPABASE_KEY not configured. All operations will be no-ops.');
  }

  function headers() {
    return {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Prefer': 'return=minimal'
    };
  }

  /**
   * Upsert companies into the whitelist.
   * Accepts array of strings or array of { company_name, alias? } objects.
   * Uses resolution=merge-duplicates to upsert by unique company_name.
   */
  async function upsertCompanies(companies) {
    if (!baseUrl || !key) throw new Error('Supabase not configured');
    if (!Array.isArray(companies) || companies.length === 0) {
      return { count: 0 };
    }

    // Normalize: accept both string[] and object[]
    const rows = companies.map(function(c) {
      if (typeof c === 'string') {
        return { company_name: c.trim(), bank_name: '建行建易贷', status: '正常' };
      }
      return {
        company_name: (c.company_name || '').trim(),
        alias: c.alias || null,
        bank_name: c.bank_name || '建行建易贷',
        status: c.status || '正常'
      };
    }).filter(function(r) {
      return r.company_name.length > 0;
    });

    if (rows.length === 0) return { count: 0 };

    let count = 0;
    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const resp = await fetch(baseUrl + '/rest/v1/whitelist_companies?on_conflict=company_name', {
        method: 'POST',
        headers: Object.assign({}, headers(), {
          'Prefer': 'resolution=merge-duplicates'
        }),
        body: JSON.stringify(chunk)
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error('Supabase upsert failed [' + resp.status + ']: ' + text);
      }
      count += chunk.length;
    }

    return { count: count };
  }

  /**
   * Get all whitelist companies, sorted by company_name.
   */
  async function getAllCompanies() {
    if (!baseUrl || !key) return [];

    var all = [];
    var page = 0;
    var pageSize = 1000;

    while (true) {
      var from = page * pageSize;
      var to = from + pageSize - 1;

      var resp = await fetch(
        baseUrl + '/rest/v1/whitelist_companies?select=id,company_name,alias,bank_name,status,created_at&order=company_name.asc',
        {
          headers: Object.assign({}, headers(), {
            'Range': from + '-' + to
          })
        }
      );

      if (!resp.ok) {
        var text = await resp.text();
        throw new Error('Supabase query failed [' + resp.status + ']: ' + text);
      }

      var data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      all.push.apply(all, data);

      if (data.length < pageSize) {
        break;
      }

      page++;
    }

    return all;
  }

  /**
   * Check client company names against the whitelist.
   * Returns match results with case-insensitive comparison.
   */
  async function checkCompanies(companyNames) {
    if (!baseUrl || !key) throw new Error('Supabase not configured');

    // Fetch the full whitelist (efficient for typical sizes <10000 entries)
    const whitelist = await getAllCompanies();

    // Build a Set of lowercased company names for O(1) lookup
    var lookup = {};
    whitelist.forEach(function(entry) {
      if (entry.status === '已失效' || entry.status === '已删除') {
        return;
      }
      var name = (entry.company_name || '').toLowerCase().trim();
      if (name) {
        lookup[name] = entry;
      }
      var alias = (entry.alias || '').toLowerCase().trim();
      if (alias) {
        lookup[alias] = entry;
      }
    });

    return (companyNames || []).map(function(name) {
      if (!name || !name.trim()) {
        return { company: name, isMatch: false, matchedName: null, bank_name: null, status: null };
      }
      var key = name.toLowerCase().trim();
      var match = lookup[key] || null;
      return {
        company: name,
        isMatch: !!match,
        matchedName: match ? match.company_name : null,
        bank_name: match ? match.bank_name : null,
        status: match ? match.status : null
      };
    });
  }

  /**
   * Delete a company from the whitelist by name.
   */
  async function deleteCompany(companyName) {
    if (!baseUrl || !key) throw new Error('Supabase not configured');
    if (!companyName || !companyName.trim()) {
      throw new Error('company_name is required');
    }

    const resp = await fetch(
      baseUrl + '/rest/v1/whitelist_companies?company_name=eq.' + encodeURIComponent(companyName.trim()),
      {
        method: 'DELETE',
        headers: headers()
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error('Supabase delete failed [' + resp.status + ']: ' + text);
    }

    return { success: true };
  }

  /**
   * Save learning knowledge item to Supabase knowledge_base table.
   */
  async function saveKnowledge(item) {
    if (!baseUrl || !key) return null;

    const row = {
      title: item.title || '未命名知识',
      summary: item.summary || '',
      content: item.content || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      source_type: item.source_type || '自定义'
    };

    const resp = await fetch(baseUrl + '/rest/v1/knowledge_base', {
      method: 'POST',
      headers: Object.assign({}, headers(), {
        'Prefer': 'return=representation'
      }),
      body: JSON.stringify(row)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[supabase] saveKnowledge failed:', text);
      throw new Error('Supabase saveKnowledge failed: ' + text);
    }

    const data = await resp.json();
    return data && data[0] ? data[0] : null;
  }

  async function searchCustomers(queryStr) {
    if (!baseUrl || !key) return [];
    const resp = await fetch(
      baseUrl + '/rest/v1/customers?select=*&or=(name.ilike.%' + encodeURIComponent(queryStr) + '%,mobile.ilike.%' + encodeURIComponent(queryStr) + '%,company_name.ilike.%' + encodeURIComponent(queryStr) + '%)&order=created_at.desc',
      { headers: headers() }
    );
    if (!resp.ok) return [];
    return await resp.json();
  }

  async function searchSpeech(queryStr) {
    if (!baseUrl || !key) return [];
    const resp = await fetch(
      baseUrl + '/rest/v1/speech_library?select=*&or=(category.ilike.%' + encodeURIComponent(queryStr) + '%,scenario.ilike.%' + encodeURIComponent(queryStr) + '%,content.ilike.%' + encodeURIComponent(queryStr) + '%)&order=score.desc',
      { headers: headers() }
    );
    if (!resp.ok) return [];
    return await resp.json();
  }

  async function searchLoanCases(queryStr) {
    if (!baseUrl || !key) return [];
    const resp = await fetch(
      baseUrl + '/rest/v1/loan_cases?select=*&or=(company_name.ilike.%' + encodeURIComponent(queryStr) + '%,loan_product.ilike.%' + encodeURIComponent(queryStr) + '%)&order=company_name.asc',
      { headers: headers() }
    );
    if (!resp.ok) return [];
    return await resp.json();
  }

  async function searchKnowledge(queryStr) {
    if (!baseUrl || !key) return [];
    const resp = await fetch(
      baseUrl + '/rest/v1/knowledge_base?select=*&or=(title.ilike.%' + encodeURIComponent(queryStr) + '%,summary.ilike.%' + encodeURIComponent(queryStr) + '%,content.ilike.%' + encodeURIComponent(queryStr) + '%)&limit=5',
      { headers: headers() }
    );
    if (!resp.ok) return [];
    return await resp.json();
  }

  /**
   * Get all customers with pagination and optional search.
   */
  async function getAllCustomers(page, pageSize, search, sortBy, sortDir, category, batchLabel, excludeMobiles, accountId) {
    if (!baseUrl || !key) return { data: [], total: 0, page: page || 1, pageSize: pageSize || 50 };

    try {
      var p = page || 1;
      var ps = pageSize || 50; // no cap — fetch whatever client asks

      var baseSearch = '';
      if (search) {
        baseSearch = '&or=(name.ilike.%25' + encodeURIComponent(search) + '%25,mobile.ilike.%25' + encodeURIComponent(search) + '%25,company_name.ilike.%25' + encodeURIComponent(search) + '%25)';
      }

      // Exclude cooldown mobiles (cap at 100 to keep URL within limits)
      var excludeFilter = '';
      if (excludeMobiles && Array.isArray(excludeMobiles) && excludeMobiles.length > 0) {
        var capped = excludeMobiles.slice(0, 100);
        excludeFilter = '&mobile=not.in.(' + capped.map(function(m) { return encodeURIComponent(m); }).join(',') + ')';
      }

      // Account filter: if accountId provided, only show that account's data
      var accountFilter = '';
      if (accountId) {
        accountFilter = '&account_id=eq.' + encodeURIComponent(accountId);
      }

      var filterParams = '';
      if (category) {
        if (category === '线索池') {
          filterParams += '&or=(category.eq.待跟进,category.eq.潜在客户,category.is.null,category.eq.,category.eq.未分类)';
        } else if (category === '公海客户') {
          filterParams += '&or=(category.eq.公海客户,category.eq.其他)';
        } else {
          filterParams += '&category=eq.' + encodeURIComponent(category);
        }
      }
      if (batchLabel) {
        filterParams += '&batch_label=eq.' + encodeURIComponent(batchLabel);
      }

      // Build sort clause
      var orderClause = '&order=created_at.desc'; // default
      if (sortBy) {
        var dir = (sortDir === 'asc' ? 'asc' : 'desc');
        orderClause = '&order=' + encodeURIComponent(sortBy) + '.' + dir;
        if (sortBy !== 'created_at') {
          orderClause += ',created_at.desc'; // secondary sort
        }
      }

      // Try column sets from most to least specific
      var colSets = [
        'name,mobile,company_name,category,note,fund,batch_label,created_at,last_operation,account_id',
        'name,mobile,company_name,category,note,fund,created_at,last_operation,account_id',
        'name,mobile,company_name,category,note,batch_label,created_at,account_id',
        'name,mobile,company_name,category,note,created_at,account_id',
        'name,mobile,company_name,created_at,account_id',
        '*'
      ];

      // Supabase max 1000 rows/request. Loop until we hit the end.
      var SUPABASE_MAX = 1000;
      var allData = [];
      var totalCount = 0;
      var from = (p - 1) * ps;
      var currentFrom = from;

      while (true) {
        var fetchSize = SUPABASE_MAX;
        // On the last chunk, we may overshoot the total; Supabase just returns
        // whatever is left, so we can always ask for a full SUPABASE_MAX.
        var currentTo = currentFrom + fetchSize - 1;

        var headersWithCount = Object.assign({}, headers(), {
          'Range': currentFrom + '-' + currentTo,
          'Prefer': 'count=exact'
        });

        var resp = null;
        var batch = null;

        for (var ci = 0; ci < colSets.length; ci++) {
          var url2 = baseUrl + '/rest/v1/customers?select=' + colSets[ci] + orderClause + baseSearch + excludeFilter + accountFilter + filterParams;
          resp = await fetch(url2, { headers: headersWithCount });
          if (resp.ok) {
            batch = await resp.json();
            break;
          }
        }

        if (!batch || !Array.isArray(batch)) break;

        allData = allData.concat(batch);

        var contentRange = resp.headers.get('Content-Range');
        if (contentRange) {
          var parts = contentRange.split('/');
          if (parts.length === 2) totalCount = parseInt(parts[1], 10) || totalCount;
        }

        if (batch.length < fetchSize) break; // no more data
        currentFrom += fetchSize;
      }

      if (allData.length === 0) {
        console.error('[supabase] getAllCustomers failed, returning empty');
        return { data: [], total: 0, page: p, pageSize: ps };
      }

      // Use Content-Range total if available, otherwise fetched count
      return { data: allData, total: totalCount || allData.length, page: p, pageSize: ps };
    } catch (e) {
      console.error('[supabase] getAllCustomers error:', e.message);
      return { data: [], total: 0, page: page || 1, pageSize: pageSize || 50 };
    }
  }

  /**
   * Upsert customers (dialer clients) into Supabase.
   * Uses mobile as unique key to prevent duplicates.
   * Each customer gets: name, mobile, company_name, note, batch_label
   */
  async function upsertCustomers(customers, accountId) {
    if (!baseUrl || !key) return { count: 0, error: 'Supabase not configured' };
    if (!Array.isArray(customers) || customers.length === 0) return { count: 0 };

    var acctId = accountId || null;
    const rows = customers.map(function(c) {
      var noteVal = (c.note || '').trim();
      var callNoteVal = (c.callNote || '').trim();
      if (callNoteVal) {
        var marker = '[通话小记] ' + callNoteVal;
        if (!noteVal.includes(marker)) {
          if (noteVal) {
            noteVal += '\n' + marker;
          } else {
            noteVal = marker;
          }
        }
      }

      var fundVal = (c.fund || '').trim();
      if (fundVal) {
        // We want to ensure that fund is saved in noteVal JSON
        if (noteVal.indexOf('{') === 0) {
          try {
            var obj = JSON.parse(noteVal);
            if (obj && typeof obj === 'object') {
              obj.fund = fundVal;
              noteVal = JSON.stringify(obj);
            }
          } catch (e) {
            noteVal = JSON.stringify({ note: noteVal, fund: fundVal });
          }
        } else {
          noteVal = JSON.stringify({ note: noteVal, fund: fundVal });
        }
      }

      return {
        name: (c.name || '').trim() || '未知姓名',
        mobile: (c.mobile || c.phone || '').trim(),
        company_name: (c.company || c.company_name || '').trim(),
        note: noteVal,
        category: (c.category || '').trim() || '公海客户',
        batch_label: (c.batch_label || '').trim(),
        account_id: c.account_id || acctId
      };
    }).filter(function(r) {
      return r.mobile.length > 0;
    });

    // Deduplicate by mobile to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
    var uniqueMap = {};
    var uniqueRows = [];
    rows.forEach(function(row) {
      uniqueMap[row.mobile] = row;
    });
    for (var m in uniqueMap) {
      if (uniqueMap.hasOwnProperty(m)) {
        uniqueRows.push(uniqueMap[m]);
      }
    }

    if (uniqueRows.length === 0) return { count: 0 };

    // 跨账户保护：查询已存在的手机号归属，排除属于其他账户的记录
    // 防止 merge-duplicates 覆盖其他账户的 account_id
    var skippedForeignCount = 0;
    if (acctId) {
      try {
        var existingMobiles = {};
        // Query in chunks (Supabase in filter max ~100 items)
        var allMobiles = Object.keys(uniqueMap);
        for (var mi = 0; mi < allMobiles.length; mi += 100) {
          var mobileChunk = allMobiles.slice(mi, mi + 100);
          var inFilter = 'mobile=in.(' + mobileChunk.map(function(m) { return encodeURIComponent(m); }).join(',') + ')';
          var checkUrl = baseUrl + '/rest/v1/customers?select=mobile,account_id&' + inFilter;
          var checkResp = await fetch(checkUrl, { headers: headers() });
          if (checkResp.ok) {
            var checkData = await checkResp.json();
            if (Array.isArray(checkData)) {
              for (var ci = 0; ci < checkData.length; ci++) {
                existingMobiles[checkData[ci].mobile] = checkData[ci].account_id;
              }
            }
          }
        }
        // 过滤掉属于其他账户的记录
        var safeRows = [];
        for (var ri = 0; ri < uniqueRows.length; ri++) {
          var rowMobile = uniqueRows[ri].mobile;
          var existingOwner = existingMobiles[rowMobile];
          if (existingOwner && existingOwner !== acctId) {
            // 此手机号属于其他账户，跳过不覆盖
            skippedForeignCount++;
            console.warn('[supabase] Skipping mobile ' + rowMobile.slice(0, 3) + '**** — owned by ' + existingOwner);
          } else {
            safeRows.push(uniqueRows[ri]);
          }
        }
        uniqueRows = safeRows;
      } catch (preCheckErr) {
        // 预检失败不影响上传，继续（保守策略：允许上传）
        console.warn('[supabase] Pre-check for cross-account owners failed:', preCheckErr.message);
      }
    }

    if (uniqueRows.length === 0) {
      console.warn('[supabase] All ' + skippedForeignCount + ' mobiles owned by other accounts — nothing to upsert');
      return { count: 0, skipped: skippedForeignCount };
    }

    let count = 0;
    const batchSize = 500;
    for (let i = 0; i < uniqueRows.length; i += batchSize) {
      const chunk = uniqueRows.slice(i, i + batchSize);
      const resp = await fetch(baseUrl + '/rest/v1/customers?on_conflict=mobile', {
        method: 'POST',
        headers: Object.assign({}, headers(), {
          'Prefer': 'resolution=merge-duplicates'
        }),
        body: JSON.stringify(chunk)
      });

      if (!resp.ok) {
        const text = await resp.text();
        // If fund column doesn't exist, retry without it
        if (text.includes('fund') && text.includes('column')) {
          const fallbackRows = chunk.map(function(r) {
            var copy = Object.assign({}, r);
            delete copy.fund;
            return copy;
          });
          const fbResp = await fetch(baseUrl + '/rest/v1/customers?on_conflict=mobile', {
            method: 'POST',
            headers: Object.assign({}, headers(), {
              'Prefer': 'resolution=merge-duplicates'
            }),
            body: JSON.stringify(fallbackRows)
          });
          if (!fbResp.ok) {
            const fbText = await fbResp.text();
            throw new Error('Supabase upsert customers fallback failed [' + fbResp.status + ']: ' + fbText);
          }
        } else if (text.includes('batch_label') && text.includes('column')) {
          const fallbackRows = chunk.map(function(r) {
            var copy = Object.assign({}, r);
            delete copy.batch_label;
            delete copy.note;
            return copy;
          });
          const fbResp = await fetch(baseUrl + '/rest/v1/customers?on_conflict=mobile', {
            method: 'POST',
            headers: Object.assign({}, headers(), {
              'Prefer': 'resolution=merge-duplicates'
            }),
            body: JSON.stringify(fallbackRows)
          });
          if (!fbResp.ok) {
            const fbText = await fbResp.text();
            throw new Error('Supabase upsert customers failed [' + fbResp.status + ']: ' + fbText);
          }
        } else {
          throw new Error('Supabase upsert customers failed [' + resp.status + ']: ' + text);
        }
      }
      count += chunk.length;
    }

    return { count: count, skipped: skippedForeignCount || 0 };
  }

  /**
   * Batch update category for all customers with a given batch_label.
   * Uses a simpler approach: fetch all matching mobiles first, then PATCH each.
   */
  async function batchUpdateCategory(batchLabel, category, accountId) {
    if (!baseUrl || !key) throw new Error('Supabase not configured');
    if (!batchLabel || !category) throw new Error('batch_label and category required');

    // Account filter to prevent cross-account modification
    var acctFilter = '';
    if (accountId) {
      acctFilter = '&account_id=eq.' + encodeURIComponent(accountId);
    }

    // Fetch all matching mobiles (pagination loop)
    var allMobiles = [];
    var offset = 0;
    var pageSize = 1000;
    while (true) {
      var url2 = baseUrl + '/rest/v1/customers?select=mobile&batch_label=eq.' + encodeURIComponent(batchLabel) + acctFilter + '&limit=' + pageSize + '&offset=' + offset;
      var pageResp = await fetch(url2, { headers: headers() });
      if (!pageResp.ok) {
        var text = await pageResp.text();
        throw new Error('Batch query failed [' + pageResp.status + ']: ' + text);
      }
      var page = await pageResp.json();
      if (!Array.isArray(page) || page.length === 0) break;
      allMobiles.push.apply(allMobiles, page.map(function(r) { return r.mobile; }));
      if (page.length < pageSize) break;
      offset += pageSize;
    }

    if (allMobiles.length === 0) return { count: 0 };

    // PATCH each one (scoped to account)
    var updated = 0;
    for (var i = 0; i < allMobiles.length; i++) {
      var patchUrl = baseUrl + '/rest/v1/customers?mobile=eq.' + encodeURIComponent(allMobiles[i]);
      if (accountId) {
        patchUrl += '&account_id=eq.' + encodeURIComponent(accountId);
      }
      var patchResp = await fetch(
        patchUrl,
        {
          method: 'PATCH',
          headers: Object.assign({}, headers(), { 'Prefer': 'return=minimal' }),
          body: JSON.stringify({ category: category })
        }
      );
      if (patchResp.ok) updated++;
    }

    return { count: updated };
  }

  /**
   * Get customers for dialer batch pull using pulled_at ordering.
   * Never-pulled customers come first (newest first), then oldest-pulled come back.
   * This naturally implements "沉底" (sink to bottom) without KV cursors.
   */
  async function getCustomersForDialer(limit, excludeMobiles, accountId) {
    if (!baseUrl || !key) return { data: [], total: 0 };

    try {
      var lim = Math.min(limit || 50, 200);

      // Build mobile not.in filter for client-side current list
      var notInFilter = '';
      if (excludeMobiles && excludeMobiles.length > 0) {
        var uniqueMobiles = [];
        for (var ei = 0; ei < excludeMobiles.length; ei++) {
          var m = (excludeMobiles[ei] || '').trim();
          if (m && uniqueMobiles.indexOf(m) === -1) uniqueMobiles.push(m);
        }
        if (uniqueMobiles.length > 0) {
          notInFilter = '&mobile=not.in.(' + uniqueMobiles.map(function(m) { return encodeURIComponent(m); }).join(',') + ')';
        }
      }

      // Account filter: if accountId provided, only pull that account's customers
      var accountFilter = '';
      if (accountId) {
        accountFilter = '&account_id=eq.' + encodeURIComponent(accountId);
      }

      // 10-day cooldown: only return customers that are either never-pulled
      // or pulled more than 10 days ago. Prevents multi-device duplicates.
      var cooldownDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      var cooldownFilter = '&or=(pulled_at.is.null,pulled_at.lt.' + encodeURIComponent(cooldownDate) + ')';

      // Order: never-pulled first (newest import first), then oldest-pulled ascend
      // NULLs first = never pulled (top), then oldest pulled ascend (cycle back)
      var orderFilter = '&order=pulled_at.asc.nullsfirst,created_at.desc';

      var colSets = [
        'name,mobile,company_name,category,note,fund,batch_label,created_at,last_operation,pulled_at,account_id',
        'name,mobile,company_name,category,note,fund,created_at,last_operation,pulled_at,account_id',
        'name,mobile,company_name,category,note,batch_label,created_at,pulled_at,account_id',
        'name,mobile,company_name,category,note,created_at,pulled_at,account_id',
        'name,mobile,company_name,created_at,pulled_at,account_id',
        '*'
      ];

      var hdrs = Object.assign({}, headers(), {
        'Range': '0-' + (lim - 1),
        'Prefer': 'count=exact'
      });

      var data = null;
      var resp = null;
      for (var ci = 0; ci < colSets.length; ci++) {
        var qUrl = baseUrl + '/rest/v1/customers?select=' + colSets[ci] + orderFilter + cooldownFilter + accountFilter + notInFilter;
        resp = await fetch(qUrl, { headers: hdrs });
        if (resp.ok) {
          data = await resp.json();
          break;
        }
      }

      var totalCount = 0;
      if (resp) {
        var contentRange = resp.headers.get('Content-Range');
        if (contentRange) {
          var parts = contentRange.split('/');
          if (parts.length === 2) totalCount = parseInt(parts[1], 10) || 0;
        }
      }

      return {
        data: Array.isArray(data) ? data : [],
        total: totalCount,
        limit: lim
      };
    } catch (e) {
      console.error('[supabase] getCustomersForDialer error:', e.message);
      return { data: [], total: 0, error: e.message };
    }
  }

  /**
   * Batch-update pulled_at = NOW() for customers that were just loaded into the dialer.
   * Uses Supabase PATCH with mobile.in filter.
   */
  async function batchSetPulledAt(mobiles, accountId) {
    if (!baseUrl || !key) return;
    if (!mobiles || mobiles.length === 0) return;

    try {
      var uniqueMobiles = [];
      for (var i = 0; i < mobiles.length; i++) {
        var m = (mobiles[i] || '').trim();
        if (m && uniqueMobiles.indexOf(m) === -1) uniqueMobiles.push(m);
      }
      if (uniqueMobiles.length === 0) return;

      var inFilter = 'mobile=in.(' + uniqueMobiles.map(function(m) { return encodeURIComponent(m); }).join(',') + ')';
      var qUrl = baseUrl + '/rest/v1/customers?' + inFilter;
      // Belt-and-suspenders: if accountId provided, restrict to this account
      if (accountId) {
        qUrl += '&account_id=eq.' + encodeURIComponent(accountId);
      }
      var body = JSON.stringify({ pulled_at: new Date().toISOString() });

      var resp = await fetch(qUrl, {
        method: 'PATCH',
        headers: Object.assign({}, headers(), {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }),
        body: body
      });
      if (!resp.ok) {
        var errText = '';
        try { errText = await resp.text(); } catch(_) {}
        console.error('[supabase] batchSetPulledAt PATCH failed: HTTP ' + resp.status + ' — ' + errText.slice(0, 300));
      }
    } catch (e) {
      console.error('[supabase] batchSetPulledAt error:', e.message);
    }
  }

  return {
    upsertCompanies: upsertCompanies,
    getAllCompanies: getAllCompanies,
    checkCompanies: checkCompanies,
    deleteCompany: deleteCompany,
    saveKnowledge: saveKnowledge,
    searchCustomers: searchCustomers,
    searchSpeech: searchSpeech,
    searchLoanCases: searchLoanCases,
    searchKnowledge: searchKnowledge,
    upsertCustomers: upsertCustomers,
    getAllCustomers: getAllCustomers,
    updateCustomer: updateCustomer,
    getCustomersForDialer: getCustomersForDialer,
    batchSetPulledAt: batchSetPulledAt,
    batchUpdateCategory: batchUpdateCategory,
    deleteCustomer: deleteCustomer,
    deleteCustomers: deleteCustomers,
    saveCorrection: saveCorrection,
    getCorrections: getCorrections,
    getCorrectionsForExport: getCorrectionsForExport,
    getCorrectionsCount: getCorrectionsCount
  };

  /**
   * Update a single customer by mobile (unique key).
   * fields: { category?, note?, company_name?, name? }
   */
  async function updateCustomer(mobile, fields, accountId) {
    if (!baseUrl || !key) throw new Error('Supabase not configured');
    if (!mobile) throw new Error('mobile is required');

    var updateUrl = baseUrl + '/rest/v1/customers?mobile=eq.' + encodeURIComponent(mobile);
    // Belt-and-suspenders: if accountId provided, restrict to this account
    if (accountId) {
      updateUrl += '&account_id=eq.' + encodeURIComponent(accountId);
    }
    const resp = await fetch(updateUrl,
      {
        method: 'PATCH',
        headers: Object.assign({}, headers(), { 'Prefer': 'return=representation' }),
        body: JSON.stringify(fields)
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error('Supabase update customer failed [' + resp.status + ']: ' + text);
    }

    const data = await resp.json();
    return data && data[0] ? data[0] : null;
  }

  async function deleteCustomer(mobile, accountId) {
    if (!baseUrl || !key) throw new Error('Supabase not configured');
    if (!mobile) throw new Error('mobile is required');

    var delUrl = baseUrl + '/rest/v1/customers?mobile=eq.' + encodeURIComponent(mobile);
    if (accountId) {
      delUrl += '&account_id=eq.' + encodeURIComponent(accountId);
    }
    const resp = await fetch(delUrl,
      {
        method: 'DELETE',
        headers: headers()
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error('Supabase delete customer failed [' + resp.status + ']: ' + text);
    }
    return true;
  }

  async function deleteCustomers(mobiles, accountId) {
    if (!baseUrl || !key) throw new Error('Supabase not configured');
    if (!mobiles || mobiles.length === 0) throw new Error('mobiles are required');

    var acctFilter = '';
    if (accountId) {
      acctFilter = '&account_id=eq.' + encodeURIComponent(accountId);
    }

    const chunkSize = 100;
    for (let i = 0; i < mobiles.length; i += chunkSize) {
      const chunk = mobiles.slice(i, i + chunkSize);
      const inClause = chunk.map(function(m) { return encodeURIComponent(m); }).join(',');
      const resp = await fetch(
        baseUrl + '/rest/v1/customers?mobile=in.(' + inClause + ')' + acctFilter,
        {
          method: 'DELETE',
          headers: headers()
        }
      );
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error('Supabase delete customers failed [' + resp.status + ']: ' + text);
      }
    }
    return true;
  }

  /**
   * Save an OCR correction record (training data).
   */
  async function saveCorrection(correction) {
    if (!baseUrl || !key) return null;

    const row = {
      raw_text: correction.rawText || '',
      original_json: correction.originalContacts || [],
      corrected_json: correction.correctedContacts || [],
      source_file: correction.sourceFile || '',
      ocr_pipeline: correction.ocrPipeline || 'ai_vision',
      ocr_mode: correction.ocrMode || 'bulk',
      edit_count: correction.editCount || 0,
      metadata: correction.metadata || {}
    };

    const resp = await fetch(baseUrl + '/rest/v1/ocr_corrections', {
      method: 'POST',
      headers: Object.assign({}, headers(), {
        'Prefer': 'return=representation'
      }),
      body: JSON.stringify(row)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[supabase] saveCorrection failed:', text);
      throw new Error('Supabase saveCorrection failed [' + resp.status + ']: ' + text);
    }

    const data = await resp.json();
    return data && data[0] ? data[0] : null;
  }

  /**
   * Get OCR corrections with pagination and optional filtering.
   */
  async function getCorrections(page, pageSize, minEdits, sort) {
    if (!baseUrl || !key) return { data: [], total: 0, page: page || 1, pageSize: pageSize || 20 };

    try {
      var p = page || 1;
      var ps = pageSize || 20;
      var from = (p - 1) * ps;
      var to = from + ps - 1;

      var url2 = baseUrl + '/rest/v1/ocr_corrections?select=*';

      // Filter: only show rows with edits if minEdits > 0
      if (minEdits && minEdits > 0) {
        url2 += '&edit_count=gte.' + minEdits;
      }

      // Sort
      if (sort === 'oldest') {
        url2 += '&order=created_at.asc';
      } else {
        url2 += '&order=created_at.desc';
      }

      var headersWithCount = Object.assign({}, headers(), {
        'Range': from + '-' + to,
        'Prefer': 'count=exact'
      });

      var resp = await fetch(url2, { headers: headersWithCount });

      if (!resp.ok) {
        var text = await resp.text();
        throw new Error('Supabase getCorrections failed [' + resp.status + ']: ' + text);
      }

      var data = await resp.json();
      var total = data.length;
      var contentRange = resp.headers.get('Content-Range');
      if (contentRange) {
        var parts = contentRange.split('/');
        if (parts.length === 2) total = parseInt(parts[1], 10) || total;
      }

      return {
        data: Array.isArray(data) ? data : [],
        total: total,
        page: p,
        pageSize: ps
      };
    } catch (e) {
      console.error('[supabase] getCorrections error:', e.message);
      return { data: [], total: 0, page: page || 1, pageSize: pageSize || 20 };
    }
  }

  /**
   * Get OCR corrections for JSONL export.
   */
  async function getCorrectionsForExport(limit) {
    if (!baseUrl || !key) return [];

    var maxLimit = Math.min(limit || 200, 1000);
    var url2 = baseUrl + '/rest/v1/ocr_corrections?select=*&edit_count=gt.0&order=created_at.desc&limit=' + maxLimit;

    var resp = await fetch(url2, { headers: headers() });

    if (!resp.ok) {
      var text = await resp.text();
      throw new Error('Supabase getCorrectionsForExport failed [' + resp.status + ']: ' + text);
    }

    return await resp.json();
  }

  /**
   * Get total count of OCR corrections.
   */
  async function getCorrectionsCount() {
    if (!baseUrl || !key) return 0;

    try {
      var resp = await fetch(
        baseUrl + '/rest/v1/ocr_corrections?select=id&limit=0',
        {
          headers: Object.assign({}, headers(), {
            'Prefer': 'count=exact'
          })
        }
      );

      if (!resp.ok) return 0;

      var contentRange = resp.headers.get('Content-Range');
      if (contentRange) {
        var parts = contentRange.split('/');
        if (parts.length === 2) return parseInt(parts[1], 10) || 0;
      }
      return 0;
    } catch (e) {
      console.error('[supabase] getCorrectionsCount error:', e.message);
      return 0;
    }
  }
}


