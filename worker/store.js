/* AssistantStore: one small Durable Object (SQLite) that holds everything the Clinic Assistant must
 * remember between requests: daily usage counters, Telegram sign-ins and short conversation context,
 * and the records used to improve the notes. It needs no setup: Cloudflare creates it on first deploy
 * from the "migrations" entry in wrangler.jsonc. Every row carries an expiry time and old rows are
 * deleted automatically. Nothing here stores a phone number, IP address or Telegram id in plain form. */
import { DurableObject } from 'cloudflare:workers';

const HOUR = 3600 * 1000;

export class AssistantStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS counters (k TEXT PRIMARY KEY, n INTEGER NOT NULL, exp INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, exp INTEGER NOT NULL)`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL,
      kind TEXT NOT NULL, channel TEXT, body TEXT, exp INTEGER NOT NULL)`);
    this.sql.exec(`CREATE INDEX IF NOT EXISTS events_kind_ts ON events (kind, ts)`);
    this.lastSweep = 0;
  }

  sweep(now) {
    if (now - this.lastSweep < HOUR) return;
    this.lastSweep = now;
    this.sql.exec('DELETE FROM counters WHERE exp <= ?', now);
    this.sql.exec('DELETE FROM kv WHERE exp <= ?', now);
    this.sql.exec('DELETE FROM events WHERE exp <= ?', now);
  }

  count(key, now) {
    const row = this.sql.exec('SELECT n, exp FROM counters WHERE k = ?', key).toArray()[0];
    return row && row.exp > now ? row.n : 0;
  }

  /* Check every limit first; count the request against all of them only if none is full.
   * checks: [{ key, limit, ttl (seconds), report (true for the limit the user sees) }] */
  async consume(checks) {
    const now = Date.now();
    this.sweep(now);
    const rows = checks.map((c) => ({ ...c, n: this.count(c.key, now) }));
    const full = rows.find((r) => r.n >= r.limit);
    if (full) return { ok: false, blocked: full.name || full.key, remaining: 0 };
    for (const r of rows) {
      this.sql.exec(
        `INSERT INTO counters (k, n, exp) VALUES (?, 1, ?)
         ON CONFLICT(k) DO UPDATE SET n = CASE WHEN exp > ? THEN n + 1 ELSE 1 END,
                                      exp = CASE WHEN exp > ? THEN exp ELSE excluded.exp END`,
        r.key, now + r.ttl * 1000, now, now);
    }
    const shown = rows.filter((r) => r.report);
    const remaining = shown.length ? Math.min(...shown.map((r) => r.limit - r.n - 1)) : null;
    return { ok: true, remaining };
  }

  /* Give back a counted request when the answer failed for reasons outside the user's control. */
  async refund(keys) {
    const now = Date.now();
    for (const key of keys) this.sql.exec('UPDATE counters SET n = n - 1 WHERE k = ? AND n > 0 AND exp > ?', key, now);
    return true;
  }

  /* Add an amount to a counter, for example the tokens used today. */
  async add(key, amount, ttlSeconds) {
    const now = Date.now();
    const n = Math.max(0, Math.round(Number(amount) || 0));
    this.sql.exec(
      `INSERT INTO counters (k, n, exp) VALUES (?, ?, ?)
       ON CONFLICT(k) DO UPDATE SET n = CASE WHEN exp > ? THEN n + ? ELSE ? END,
                                    exp = CASE WHEN exp > ? THEN exp ELSE excluded.exp END`,
      key, n, now + ttlSeconds * 1000, now, n, n, now);
    return true;
  }

  async peek(keys) {
    const now = Date.now();
    return Object.fromEntries(keys.map((k) => [k, this.count(k, now)]));
  }

  async getValue(key) {
    const row = this.sql.exec('SELECT v, exp FROM kv WHERE k = ?', key).toArray()[0];
    return row && row.exp > Date.now() ? row.v : null;
  }

  async setValue(key, value, ttlSeconds) {
    this.sql.exec(`INSERT INTO kv (k, v, exp) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, exp = excluded.exp`,
      key, String(value), Date.now() + ttlSeconds * 1000);
    return true;
  }

  async deleteValue(key) {
    this.sql.exec('DELETE FROM kv WHERE k = ?', key);
    return true;
  }

  async logEvent(kind, channel, body, keepDays) {
    const now = Date.now();
    this.sweep(now);
    this.sql.exec('INSERT INTO events (ts, kind, channel, body, exp) VALUES (?, ?, ?, ?, ?)',
      now, kind, channel || '', JSON.stringify(body || {}).slice(0, 8000), now + keepDays * 24 * HOUR);
    return true;
  }

  async listEvents(kind, limit = 200) {
    return this.sql.exec('SELECT ts, kind, channel, body FROM events WHERE kind = ? AND exp > ? ORDER BY ts DESC LIMIT ?',
      kind, Date.now(), limit).toArray().map((r) => ({ ...r, body: safeParse(r.body) }));
  }

  async countersWithPrefix(prefix) {
    return this.sql.exec('SELECT k, n FROM counters WHERE k >= ? AND k < ? AND exp > ? ORDER BY k',
      prefix, prefix + '￿', Date.now()).toArray();
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

/* The single store instance every request talks to. */
export function store(env) {
  return env.ASSISTANT_STORE.get(env.ASSISTANT_STORE.idFromName('clinic-assistant'));
}
