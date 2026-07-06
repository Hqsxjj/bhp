// anti-bot.js — 反爬防护模块
// 用于 Cloudflare Worker 的多层反爬防护

// ==================== 1. 客户端 IP 提取 ====================

/**
 * 提取真实客户端 IP
 * 在 Cloudflare CDN 后面，取 CF-Connecting-IP 头
 * wrangler dev 本地环境下该头不存在，fallback 到 X-Forwarded-For
 */
export function getClientIP(request) {
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP.trim();
  const xff = request.headers.get('X-Forwarded-For');
  if (xff) return xff.split(',')[0].trim();
  return '127.0.0.1';
}

// ==================== 2. 恶意 UA 检测 ====================

const BAD_BOT_PATTERNS = [
  'sqlmap', 'nikto', 'nmap', 'nessus', 'burp',
  'wpscan', 'masscan', 'zgrab', 'gobuster', 'dirbuster',
  'hydra', 'acunetix', 'netsparker', 'openvas', 'arachni',
  'vega', 'zap', 'wfuzz', 'ffuf', 'nuclei',
  'headless', 'phantom', 'selenium', 'playwright',
];

const BAD_BOT_REGEX = new RegExp(BAD_BOT_PATTERNS.join('|'), 'i');

/**
 * 检测恶意 UA
 * @param {string|null} userAgent
 * @returns {{blocked: boolean, reason?: string}}
 */
export function isBadBot(userAgent) {
  if (!userAgent || userAgent.trim() === '') {
    return { blocked: true, reason: 'empty_user_agent' };
  }
  if (BAD_BOT_REGEX.test(userAgent)) {
    return { blocked: true, reason: 'scanner_user_agent' };
  }
  return { blocked: false };
}

// ==================== 3. Sec-Fetch 请求头验证 ====================

/**
 * 检查 Sec-Fetch 请求头（现代浏览器自动发送，脚本/爬虫通常不发送）
 * 仅作为辅助信号，不作为硬性拦截条件
 * @param {Request} request
 * @returns {{suspicious: boolean, reason?: string}}
 */
export function checkSecFetch(request) {
  const secFetchSite = request.headers.get('Sec-Fetch-Site');
  const secFetchMode = request.headers.get('Sec-Fetch-Mode');
  const secFetchDest = request.headers.get('Sec-Fetch-Dest');

  // 有 Sec-Fetch 头 = 现代浏览器，安全放行
  if (secFetchSite || secFetchMode || secFetchDest) {
    return { suspicious: false };
  }

  // 无 Sec-Fetch 头 = 可能是脚本/旧浏览器/curl
  // 只有同时无 Accept 头才标记为可疑
  const accept = request.headers.get('Accept');
  if (!accept || accept === '*/*') {
    return { suspicious: true, reason: 'no_sec_fetch + no_accept' };
  }

  // 无 Sec-Fetch 但有 Accept: text/html 等 = 可能是旧浏览器，放行
  return { suspicious: false };
}

// ==================== 4. 速率限制（In-Memory） ====================

/**
 * 速率限制器
 * 使用模块级 Map 存储计数器（单 Worker isolate 单线程，无需加锁）
 * 隔离级别内共享，跨 isolate 不共享（CF 边缘节点层面分散，总体仍是有效防护）
 */

// tier -> { maxRequests, windowMs }
const RATE_LIMIT_TIERS = {
  'api':       { maxRequests: 60,  windowMs: 60000 },  // 通用 API: 60/分钟
  'sensitive': { maxRequests: 10,  windowMs: 60000 },  // 敏感端点: 10/分钟
  'page':      { maxRequests: 120, windowMs: 60000 },  // 页面请求: 120/分钟
};

// 内存中存储: key = `${ip}:${tier}`, value = { count, windowStart }
const rateLimitStore = new Map();

/**
 * 确定请求对应的限流等级
 * @param {string} path — 请求路径
 * @returns {'api'|'sensitive'|'page'}
 */
export function getRateLimitTier(path) {
  // 敏感端点
  if (path === '/api/siri' || path === '/api/export' || path.startsWith('/api/admin/')) {
    return 'sensitive';
  }
  // API 端点
  if (path.startsWith('/api/')) {
    return 'api';
  }
  // 其他（页面、静态资源等）
  return 'page';
}

/**
 * 检查速率限制
 * @param {string} ip — 客户端 IP
 * @param {string} tier — 限流等级
 * @returns {{limited: boolean, retryAfter?: number}}
 */
export function checkRateLimit(ip, tier) {
  const config = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS['api'];
  const key = `${ip}:${tier}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // 窗口过期或不存在 → 重置
  if (!entry || (now - entry.windowStart) >= config.windowMs) {
    entry = { count: 1, windowStart: now };
    rateLimitStore.set(key, entry);
    return { limited: false };
  }

  // 窗口内
  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false };
}

/**
 * 定期清理过期条目（防止 Map 无限增长）
 * 每 5 分钟清理一次
 */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 300000; // 5 min

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    // 所有 tier 的 windowMs 都是 60000，此窗口过期就清理
    if ((now - entry.windowStart) >= 120000) { // 2x window as grace period
      rateLimitStore.delete(key);
    }
  }
  lastCleanup = now;
}

export function maybeCleanup() {
  if (Date.now() - lastCleanup > CLEANUP_INTERVAL) {
    cleanupRateLimitStore();
  }
}

// ==================== 5. IP 黑名单（KV 持久化） ====================

const BLOCKED_KEY_PREFIX = 'blocked:';
const DEFAULT_BLOCK_TTL = 86400; // 24 小时

/**
 * 检查 IP 是否在黑名单中
 * @param {object} env — Worker env (含 DATA_KV)
 * @param {string} ip
 * @returns {Promise<{blocked: boolean, reason?: string, blockedAt?: string}>}
 */
export async function isBlocked(env, ip) {
  try {
    const val = await env.DATA_KV.get(BLOCKED_KEY_PREFIX + ip);
    if (val) {
      const parsed = JSON.parse(val);
      return { blocked: true, reason: parsed.reason, blockedAt: parsed.time };
    }
  } catch (e) {
    // KV 读取失败时放行，避免误伤
    console.error('isBlocked KV error:', e.message);
  }
  return { blocked: false };
}

/**
 * 将 IP 加入黑名单
 * @param {object} env — Worker env
 * @param {string} ip
 * @param {string} reason — 封锁原因
 */
export async function blockIP(env, ip, reason) {
  try {
    const record = JSON.stringify({
      reason,
      time: new Date().toISOString(),
    });
    await env.DATA_KV.put(BLOCKED_KEY_PREFIX + ip, record, {
      expirationTtl: DEFAULT_BLOCK_TTL,
    });
  } catch (e) {
    console.error('blockIP KV error:', e.message);
  }
}

/**
 * 解除 IP 封锁
 * @param {object} env — Worker env
 * @param {string} ip
 */
export async function unblockIP(env, ip) {
  try {
    await env.DATA_KV.delete(BLOCKED_KEY_PREFIX + ip);
  } catch (e) {
    console.error('unblockIP KV error:', e.message);
  }
}

/**
 * 列出所有被封 IP
 * @param {object} env — Worker env
 * @returns {Promise<Array<{ip: string, reason: string, time: string}>>}
 */
export async function listBlockedIPs(env) {
  try {
    const list = await env.DATA_KV.list({ prefix: BLOCKED_KEY_PREFIX });
    const result = [];
    for (const key of list.keys) {
      const ip = key.name.slice(BLOCKED_KEY_PREFIX.length);
      const val = await env.DATA_KV.get(key.name);
      if (val) {
        const parsed = JSON.parse(val);
        result.push({ ip, reason: parsed.reason, time: parsed.time });
      }
    }
    return result;
  } catch (e) {
    console.error('listBlockedIPs KV error:', e.message);
    return [];
  }
}
