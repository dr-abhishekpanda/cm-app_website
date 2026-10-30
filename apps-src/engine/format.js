/* Number formatting shared by every app. Indian English conventions:
 * decimal point, en-IN digit grouping for counts (1,00,000), minus sign U+2212 in display text.
 * Numbers are never rounded away silently: reports carry the conventional form and the exact value.
 */

const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const MINUS = '−';

const toSup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
const fixMinus = (s) => s.replace(/^-/, MINUS).replace(/e-/, 'e' + MINUS);

/** "2.345 × 10⁻⁵" with n significant figures. */
export function sci(x, n = 4) {
  if (!Number.isFinite(x)) return special(x);
  if (x === 0) return '0';
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${fixMinus(m)} × 10${toSup(Number(e))}`;
}

function special(x) {
  if (Number.isNaN(x)) return '—';
  return x > 0 ? '∞' : MINUS + '∞';
}

/** n significant figures, switching to scientific form below 1e-4 or at and above 1e7. */
export function sig(x, n = 4) {
  if (x === null || x === undefined) return '—';
  if (!Number.isFinite(x)) return special(x);
  if (x === 0) return '0';
  const ax = Math.abs(x);
  if (ax < 1e-4 || ax >= 1e7) return sci(x, n);
  // toPrecision, then drop the exponent form JavaScript uses for some magnitudes
  let s = Number(x.toPrecision(n)).toString();
  if (/e/.test(s)) s = x.toFixed(Math.max(0, n - 1 - Math.floor(Math.log10(ax))));
  return fixMinus(s);
}

/** Fixed decimals; dashes for missing values; a true minus sign. */
export function fixed(x, d = 2) {
  if (x === null || x === undefined) return '—';
  if (!Number.isFinite(x)) return special(x);
  const s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d);
  return fixMinus(s);
}

/** Counts with Indian digit grouping: 125000 -> 1,25,000. */
export function count(n) {
  if (!Number.isFinite(n)) return special(n);
  return fixMinus(Math.round(n).toLocaleString('en-IN'));
}

/**
 * A p-value in two forms: `report` follows the usual journal style
 * (three decimals, or "< 0.001"); `exact` keeps four significant figures.
 */
export function pValue(p) {
  if (p === null || p === undefined || Number.isNaN(p)) return { report: 'p = —', exact: '—', value: NaN };
  const exact = p >= 1e-4 ? sig(p, 4) : sci(p, 3);
  if (p < 0.001) return { report: 'p < 0.001', exact, value: p };
  if (p > 0.999) return { report: 'p > 0.999', exact, value: p };
  // Just below 0.05 would print as "0.050"; a fourth decimal keeps the reader from misreading it.
  if (p < 0.05 && p >= 0.0495) return { report: `p = ${p.toFixed(4)}`, exact, value: p };
  return { report: `p = ${p.toFixed(3)}`, exact, value: p };
}

/** Parse a number typed by a user: accepts "1,25,000", "2.1", "−3", "1e-5". Returns NaN when it is not a number. */
export function parseNumber(text) {
  if (typeof text === 'number') return text;
  if (text === null || text === undefined) return NaN;
  const s = String(text).trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
  if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return Number(s);
}

/** Decimal places for a summary of data recorded to `d` decimals: one more than the data, 1 to 4. */
export const dpFor = (d) => Math.min(4, Math.max(1, (d || 0) + 1));

/** "a to b" interval text, the form journals prefer over "a-b" when values can be negative. */
export const interval = (ci, d = 2, f = fixed) => `${f(ci[0], d)} to ${f(ci[1], d)}`;

/** Odds, risk and hazard ratios as journals print them: two decimals, more below 0.1, one decimal from 10. */
export function ratio(x) {
  if (!Number.isFinite(x)) return x === Infinity ? '∞' : '—';
  if (x < 0.1) return sig(x, 2);
  if (x < 10) return fixed(x, 2);
  return fixed(x, 1);
}
