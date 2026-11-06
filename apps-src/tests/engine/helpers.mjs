import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export function loadRef(name) {
  return JSON.parse(readFileSync(join(here, '..', 'ref', name), 'utf8'));
}

export function num(v) {
  if (v === 'inf') return Infinity;
  if (v === '-inf') return -Infinity;
  if (v === 'nan') return NaN;
  return v;
}

/**
 * True when got matches want within a relative tolerance, with an absolute floor
 * for values near zero. Infinities must match exactly.
 */
export function close(got, want, rel = 1e-11, abs = 1e-300) {
  if (Number.isNaN(want)) return Number.isNaN(got);
  if (!Number.isFinite(want)) return got === want;
  if (!Number.isFinite(got)) return false;
  const diff = Math.abs(got - want);
  return diff <= abs || diff <= rel * Math.abs(want);
}

/** Collect failures instead of stopping at the first, so one run shows every problem. */
export function check(label, cases, fn, rel, abs) {
  const failures = [];
  let worst = 0;
  for (const c of cases) {
    const want = num(c[c.length - 1]);
    const args = c.slice(0, -1).map(num);
    const got = fn(...args);
    if (Number.isFinite(want) && want !== 0 && Number.isFinite(got)) {
      worst = Math.max(worst, Math.abs(got - want) / Math.abs(want));
    }
    if (!close(got, want, rel, abs)) failures.push(`${label}(${args.join(', ')}) = ${got}, want ${want}`);
  }
  return { failures, worst };
}
