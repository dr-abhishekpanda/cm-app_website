/* Small helpers shared by the Clinic Assistant routes. */

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function html(body, status = 200, headers = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', ...headers },
  });
}

export function text(body, status = 200, headers = {}) {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8', ...headers } });
}

export async function sha256Hex(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* Identifiers (IP addresses, Telegram ids, codes) are stored only as salted hashes. */
export async function hashId(env, kind, value) {
  const salt = env.HASH_SALT || env.ADMIN_KEY || 'clinic-assistant';
  return (await sha256Hex(`${salt}|${kind}|${value}`)).slice(0, 32);
}

/* Day boundaries follow Indian Standard Time, so limits reset at midnight IST. */
export function istDay(now = Date.now()) {
  return new Date(now + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function istDateLong(now = Date.now()) {
  const d = new Date(now + 5.5 * 3600 * 1000);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '0.0.0.0';
}

export function siteOrigin(request, env) {
  return (env.SITE_URL || new URL(request.url).origin).replace(/\/+$/, '');
}

/* Browsers send Origin on cross-site requests; refuse other websites calling the API from their pages. */
export function originAllowed(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  const own = new URL(request.url).origin;
  const extra = String(env.ALLOWED_ORIGINS || '').split(/[\s,]+/).filter(Boolean);
  return origin === own || extra.includes(origin);
}

export function adminAllowed(request, env) {
  if (!env.ADMIN_KEY) return false;
  const url = new URL(request.url);
  const auth = request.headers.get('Authorization') || '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7) : url.searchParams.get('key');
  if (!key || key.length !== env.ADMIN_KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ env.ADMIN_KEY.charCodeAt(i);
  return diff === 0;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
