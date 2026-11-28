/* Access codes and daily limits.
 *
 * ASSISTANT_CODES (a secret) lists the Clinic member codes, separated by commas, spaces or new lines.
 * A code may carry a label for your own records: "batch1=ABCD-2026, faculty=FAC-7788" or just "ABCD-2026".
 * One shared code for the whole Clinic works; individual codes let you withdraw one person's access. */
import { hashId, istDay } from './util.js';
import { config } from './config.js';

export function parseCodes(env) {
  const map = new Map();
  for (const item of String(env.ASSISTANT_CODES || '').split(/[\s,;]+/)) {
    if (!item) continue;
    const eq = item.indexOf('=');
    const label = eq > 0 ? item.slice(0, eq).trim() : 'member';
    const code = (eq > 0 ? item.slice(eq + 1) : item).trim().toUpperCase();
    if (code.length >= 4) map.set(code, label || 'member');
  }
  return map;
}

export function normaliseCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

export async function checkCode(env, code) {
  const c = normaliseCode(code);
  if (!c) return null;
  const codes = parseCodes(env);
  if (!codes.has(c)) return null;
  return { label: codes.get(c), codeHash: await hashId(env, 'code', c) };
}

/* Telegram remembers a member by the hash of the code they entered; a withdrawn code stops working. */
export async function codeHashValid(env, codeHash) {
  if (!codeHash) return false;
  for (const c of parseCodes(env).keys()) if ((await hashId(env, 'code', c)) === codeHash) return true;
  return false;
}

const DAY = 86400;

/* The limits one request must fit within. pool: "member" or "open". */
export function quotaChecks(env, { pool, userKey, ipKey, channel }) {
  const C = config(env);
  const day = istDay();
  const minute = Math.floor(Date.now() / 60000);
  const checks = [];
  if (pool === 'member') {
    checks.push({ name: 'member-user', key: `q:${day}:m:${userKey}`, limit: C.memberPerUser, ttl: 2 * DAY, report: true });
    checks.push({ name: 'member-total', key: `q:${day}:m:total`, limit: C.memberTotal, ttl: 2 * DAY });
  } else {
    checks.push({ name: 'open-device', key: `q:${day}:o:d:${userKey}`, limit: C.openPerDevice, ttl: 2 * DAY, report: true });
    checks.push({ name: 'open-ip', key: `q:${day}:o:ip:${ipKey}`, limit: C.openPerIp, ttl: 2 * DAY });
    checks.push({ name: 'open-total', key: `q:${day}:o:total`, limit: C.openTotal, ttl: 2 * DAY });
  }
  checks.push({ name: 'burst', key: `b:${minute}:${ipKey || userKey}`, limit: C.burstPerMinute, ttl: 120 });
  checks.push({ name: 'stats', key: `s:${day}:msg:${channel}`, limit: 1e12, ttl: 100 * DAY });
  return checks;
}

export function limitMessage(blocked, env) {
  const C = config(env);
  switch (blocked) {
    case 'member-user':
      return `You have used today's ${C.memberPerUser} AI messages. The limit resets at midnight (IST). The notes still work.`;
    case 'member-total':
      return 'The Clinic Assistant has reached its daily limit for all members. Please try again tomorrow; the notes still work.';
    case 'open-device':
      return `You have used today's ${C.openPerDevice} free messages on this device. Clinic members can enter their access code for more. The limit resets at midnight (IST).`;
    case 'open-ip':
      return 'Many people on your network have used the website chat today, and its shared limit is full. It resets at midnight (IST). Clinic members can enter their access code.';
    case 'open-total':
      return 'The website chat has reached its daily limit for all visitors. Please try again tomorrow. Clinic members can use their access code.';
    case 'burst':
      return 'That was a lot of messages in one minute. Please wait a moment and try again.';
    default:
      return 'The daily limit has been reached. Please try again tomorrow.';
  }
}
