/* Starts the stand-in APIs and `wrangler dev` with test settings, for the integration and browser tests. */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { startMockApis } from './mock-apis.mjs';

export const TEST = {
  token: '123:TEST',
  admin: 'admin-test-key',
  codes: 'batch1=CLINIC-2026, faculty=FAC-7788',
};
TEST.secret = createHash('sha256').update(`telegram-webhook|${TEST.token}`).digest('hex').slice(0, 48);

export async function startDevServer({ port = 8790, mockPort = 8788, vars = {} } = {}) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const mock = await startMockApis(mockPort);
  const tmp = mkdtempSync(join(tmpdir(), 'cma-'));
  const envFile = join(tmp, 'test.env');
  const settings = {
    ANTHROPIC_API_KEY: 'test-key',
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${mockPort}`,
    TELEGRAM_API_BASE: `http://127.0.0.1:${mockPort}`,
    TELEGRAM_BOT_TOKEN: TEST.token,
    ASSISTANT_CODES: TEST.codes,
    ADMIN_KEY: TEST.admin,
    OPEN_DAILY_PER_DEVICE: '3',
    BURST_PER_MINUTE: '100',
    ...vars,
  };
  writeFileSync(envFile, Object.entries(settings).map(([k, v]) => `${k}="${v}"`).join('\n'));
  const [cmd, ...args] = (process.env.WRANGLER || 'npx wrangler').split(' ');
  const dev = spawn(cmd, [...args, 'dev', '--port', String(port), '--ip', '127.0.0.1', '--env-file', envFile,
    '--persist-to', join(tmp, 'state'), '--show-interactive-dev-session=false', '--log-level', 'warn'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  let log = '';
  dev.stdout.on('data', (d) => { log += d; });
  dev.stderr.on('data', (d) => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  const stop = () => {
    dev.kill('SIGTERM');
    mock.server.close();
    rmSync(tmp, { recursive: true, force: true });
  };
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${base}/api/assistant/status`);
      if (r.ok) return { base, mock, stop, log: () => log };
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  stop();
  throw new Error('wrangler dev did not start:\n' + log);
}
