/* Reading a dataset: pasted cells from Excel or Google Sheets (tab-separated), CSV files, or
 * typed values. Columns are typed as numeric or categorical; blanks and the usual missing-value
 * codes are treated as missing. Pure functions; the data never leave the device. */
import { parseNumber } from './format.js';

// 'None' and 'Nil' are not here: in health records they are usually real answers (education: none;
// addictions: nil), and dropping a real category silently is worse than showing a code as a category.
export const MISSING = new Set(['', 'na', 'n/a', '#n/a', 'nan', 'null', 'missing', '.', '-', '--', '?']);
export const isMissing = (s) => MISSING.has(String(s).trim().toLowerCase());

function detectDelimiter(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 20);
  if (lines.some((l) => l.includes('\t'))) return '\t';
  const count = (ch) => lines.reduce((s, l) => s + l.split(ch).length - 1, 0);
  const c = count(','), sc = count(';');
  if (sc > c) return ';';
  if (c > 0) return ',';
  return /\s/.test(lines[0] || '') ? 'space' : ',';
}

/** Split delimited text into rows of cells, honouring double-quoted fields. */
export function parseDelimited(text, delimiter = detectDelimiter(text)) {
  const rows = [];
  if (delimiter === 'space') {
    for (const line of text.split(/\r?\n/)) if (line.trim()) rows.push(line.trim().split(/\s+/));
    return { rows, delimiter };
  }
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"' && cell.trim() === '') { q = true; cell = ''; }
    else if (ch === delimiter) { row.push(cell.trim()); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== '')) rows.push(row);
  return { rows, delimiter };
}

const looksNumeric = (s) => Number.isFinite(parseNumber(s));

/**
 * Build a dataset from text. The first row is a header unless every cell in it is a number.
 * Returns { columns: [{ name, raw, numbers, missing, numeric, levels, decimals }], n, delimiter, warnings }.
 */
export function readDataset(text, { header = 'auto' } = {}) {
  let { rows, delimiter } = parseDelimited(text);
  if (!rows.length) return { columns: [], n: 0, delimiter, warnings: [] };
  // A single line of numbers ("12 13.5 14") is one variable, not one row.
  if (rows.length === 1 && rows[0].length > 1 && rows[0].every((c) => looksNumeric(c) || isMissing(c))) rows = rows[0].map((c) => [c]);
  const width = Math.max(...rows.map((r) => r.length));
  const first = rows[0];
  const hasHeader = header === 'auto' ? first.some((c) => c !== '' && !looksNumeric(c)) && rows.length > 1 : header;
  const names = Array.from({ length: width }, (_, j) => {
    const h = hasHeader ? (first[j] || '').trim() : '';
    return h || `Column ${j + 1}`;
  });
  // Unique names, so a column can be picked by name.
  const seen = new Map();
  names.forEach((nm, j) => { const c = seen.get(nm) || 0; seen.set(nm, c + 1); if (c) names[j] = `${nm} (${c + 1})`; });
  const body = hasHeader ? rows.slice(1) : rows;
  const warnings = [];
  const columns = names.map((name, j) => {
    const raw = body.map((r) => (r[j] ?? '').trim());
    let missing = 0, numericCount = 0, decimals = 0;
    const numbers = raw.map((s) => {
      if (isMissing(s)) { missing++; return null; }
      const v = parseNumber(s);
      if (Number.isFinite(v)) {
        numericCount++;
        const m = s.match(/\.(\d+)/);
        if (m) decimals = Math.max(decimals, m[1].length);
        return v;
      }
      return NaN;
    });
    const present = raw.length - missing;
    const numeric = present > 0 && numericCount === present;
    // A mostly numeric column with a few text entries is usually a typing slip ("12..5", "l0");
    // a short coded scale such as parity 0, 1, 2, "3+" is a category and is left alone.
    const distinctNumbers = new Set(numbers.filter((v) => v !== null && Number.isFinite(v))).size;
    const nearlyNumeric = !numeric && present > 0 && numericCount / present >= 0.8 && distinctNumbers > 10;
    if (nearlyNumeric) {
      const bad = raw.map((s, i) => [s, i]).filter(([s], i) => numbers[i] !== null && Number.isNaN(numbers[i])).slice(0, 3);
      warnings.push(`${name}: ${present - numericCount} entr${present - numericCount === 1 ? 'y is' : 'ies are'} not numbers (${bad.map(([s, i]) => `row ${i + 1}: "${s}"`).join(', ')}). Fix them or they count as a separate category.`);
    }
    const levels = [];
    const levelSet = new Set();
    for (const s of raw) if (!isMissing(s) && !levelSet.has(s)) { levelSet.add(s); levels.push(s); }
    if (numeric) levels.sort((a, b) => parseNumber(a) - parseNumber(b));
    return { name, raw, numbers: numeric ? numbers : numbers.map((v) => (Number.isFinite(v) ? v : null)), missing, numeric, levels, decimals };
  });
  return { columns, n: body.length, delimiter, header: hasHeader, warnings };
}

/** Values of a numeric column with their row indices, missing dropped. */
export function numericValues(col) {
  const out = [], rows = [];
  col.numbers.forEach((v, i) => { if (v !== null && Number.isFinite(v)) { out.push(v); rows.push(i); } });
  return { values: out, rows };
}

/** Split a numeric column by the levels of a grouping column (rows missing either are dropped). */
export function splitBy(valueCol, groupCol) {
  const groups = new Map();
  for (const lv of groupCol.levels) groups.set(lv, []);
  let dropped = 0;
  valueCol.numbers.forEach((v, i) => {
    const g = groupCol.raw[i];
    if (v === null || !Number.isFinite(v) || isMissing(g)) { dropped++; return; }
    groups.get(g).push(v);
  });
  return { labels: [...groups.keys()], groups: [...groups.values()], dropped };
}

/** Rows where every listed numeric column is present (for paired and repeated measures). */
export function completeRows(cols) {
  const out = [];
  let dropped = 0;
  const n = cols[0].numbers.length;
  for (let i = 0; i < n; i++) {
    const vals = cols.map((c) => c.numbers[i]);
    if (vals.every((v) => v !== null && Number.isFinite(v))) out.push(vals); else dropped++;
  }
  return { rows: out, dropped };
}

/** Cross-tabulate two categorical columns: counts[rowLevel][colLevel]. */
export function crossTab(rowCol, colCol) {
  const rl = rowCol.levels, cl = colCol.levels;
  const t = rl.map(() => cl.map(() => 0));
  let dropped = 0;
  rowCol.raw.forEach((r, i) => {
    const c = colCol.raw[i];
    if (isMissing(r) || isMissing(c)) { dropped++; return; }
    t[rl.indexOf(r)][cl.indexOf(c)]++;
  });
  return { table: t, rowLevels: rl, colLevels: cl, dropped };
}

/** Parse a free list of numbers (spaces, commas, new lines). */
export function parseNumberList(text) {
  const parts = String(text).split(/[\s,;]+/).filter(Boolean);
  const values = [], bad = [];
  for (const p of parts) { const v = parseNumber(p); if (Number.isFinite(v)) values.push(v); else if (!isMissing(p)) bad.push(p); }
  return { values, bad };
}
