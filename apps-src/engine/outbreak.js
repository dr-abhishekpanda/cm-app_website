/* Outbreak investigation: dates and times of onset, the epidemic curve, the probable period of
 * exposure, attack rates, food-specific attack-rate tables and the incubation period.
 *
 * Times are milliseconds since 1970-01-01 read as UTC, so a curve never shifts with the
 * computer's time zone. The interval for the curve is about a quarter of the average incubation
 * period, and the probable period of exposure counts back the minimum incubation period from the
 * first case, the average from the peak and the maximum from the last case (CDC Quick Learns).
 * Incubation periods are summarised by their median and range, and on the log scale by Sartwell's
 * (1950) geometric mean and dispersion factor.
 */
import { twoByTwo } from './epi.js';
import { wilson, quantile } from './describe.js';

export const HOUR = 3600000, DAY = 24 * HOUR, WEEK = 7 * DAY;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function utc(y, m, d) {
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2200)) return null;
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  return back.getUTCFullYear() === y && back.getUTCMonth() === m - 1 && back.getUTCDate() === d ? t : null;
}
const fullYear = (y) => (y < 100 ? 2000 + y : y);

/** Milliseconds after midnight for a time of day ('22:30', '9:05 pm', '2230'), or null. */
export function parseTime(text) {
  const s = String(text ?? '').trim().toLowerCase().replace(/\./g, '');
  if (!s) return null;
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) { const k = s.match(/^(\d{2})(\d{2})$/); if (k) m = [s, k[1], k[2], undefined, undefined]; }
  if (!m) return null;
  let h = Number(m[1]); const min = Number(m[2] ?? 0), sec = Number(m[3] ?? 0);
  if (m[4]) { if (h < 1 || h > 12) return null; h = (h % 12) + (m[4] === 'pm' ? 12 : 0); }
  if (h > 23 || min > 59 || sec > 59 || (!m[2] && !m[4])) return null;
  return h * HOUR + min * 60000 + sec * 1000;
}

/**
 * A date, with an optional time, as { t, timed } (t in milliseconds since 1970-01-01 UTC), or null.
 * Reads ISO dates (2026-03-14), day-first or month-first dates with / - or . (order: 'dmy' or 'mdy'),
 * month names (14 Mar 2026, 14-Mar-26) and spreadsheet day numbers. A time may follow the date in
 * the same text, or come separately.
 */
export function parseDateTime(dateText, timeText = '', { order = 'dmy' } = {}) {
  let s = String(dateText ?? '').trim();
  if (!s) return null;
  let tod = null;
  const sep = s.match(/^(\S+?)(?:T|\s+)(\d{1,2}(?::\d{2}){1,2}\s*(?:[ap]\.?m\.?)?|\d{1,2}\s*[ap]\.?m\.?)$/i);
  if (sep) { s = sep[1]; tod = parseTime(sep[2]); if (tod === null) return null; }
  let day = null;
  let m;
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const v = Number(s);
    if (v > 20000 && v < 80000) {
      day = Math.round((Math.floor(v) - 25569) * DAY);
      if (tod === null && v % 1) tod = Math.round((v % 1) * 24 * 60) * 60000;
    }
  } else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) day = utc(Number(m[1]), Number(m[2]), Number(m[3]));
  else if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/))) {
    const [a, b, y] = [Number(m[1]), Number(m[2]), fullYear(Number(m[3]))];
    day = order === 'mdy' ? utc(y, a, b) : utc(y, b, a);
  } else if ((m = s.match(/^(\d{1,2})[\s/-]+([a-z]{3,9})[\s/,-]+(\d{2}|\d{4})$/i))) {
    const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    day = mo ? utc(fullYear(Number(m[3])), mo, Number(m[1])) : null;
  } else if ((m = s.match(/^([a-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/i))) {
    const mo = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1;
    day = mo ? utc(Number(m[3]), mo, Number(m[2])) : null;
  }
  if (day === null) return null;
  if (tod === null && String(timeText ?? '').trim()) { tod = parseTime(timeText); if (tod === null) return null; }
  return { t: day + (tod ?? 0), timed: tod !== null };
}

const startOfDay = (t) => Math.floor(t / DAY) * DAY;
// 1970-01-01 was a Thursday, so Monday-start weeks begin 3 days after a multiple of 7 days.
const mondayOf = (t) => Math.floor((t - 4 * DAY) / WEEK) * WEEK + 4 * DAY;

/** Interval length in milliseconds. */
export const intervalMs = ({ unit, width }) => width * (unit === 'hour' ? HOUR : unit === 'day' ? DAY : WEEK);

/**
 * The interval for an epidemic curve: about a quarter of the average incubation period (CDC),
 * rounded to the nearest of 1, 2, 3, 4, 6, 8 or 12 hours, 1, 2 or 3 days, or whole weeks.
 */
export function suggestInterval(avgIncubationHours) {
  const target = avgIncubationHours / 4;
  if (!(target > 0)) return { unit: 'day', width: 1 };
  if (target > 7 * 24) return { unit: 'week', width: Math.max(1, Math.round(target / (7 * 24))) };
  const ladder = [1, 2, 3, 4, 6, 8, 12, 24, 48, 72, 168];
  const best = ladder.reduce((a, b) => (Math.abs(Math.log(b / target)) < Math.abs(Math.log(a / target)) ? b : a));
  return best < 24 ? { unit: 'hour', width: best } : best < 168 ? { unit: 'day', width: best / 24 } : { unit: 'week', width: 1 };
}

/**
 * Counts by interval. events: [{ t, timed, group }]. Hourly intervals use only events with a time
 * of onset; the others are counted in `untimed`. Intervals start at midnight (hours and days) or on
 * a Monday (weeks); `pad` empty intervals are added before the first case and after the last.
 * Returns { bins: [{ start, end, count, groups }], groups, n, untimed, first, last, peak, median }.
 */
export function epiCurve(events, { unit = 'day', width = 1, pad = 1, include = [] } = {}) {
  const valid = events.filter((e) => e && Number.isFinite(e.t));
  const used = unit === 'hour' ? valid.filter((e) => e.timed) : valid;
  if (!used.length) return null;
  const size = intervalMs({ unit, width });
  const ts = used.map((e) => e.t).sort((a, b) => a - b);
  const first = ts[0], last = ts[ts.length - 1];
  // Intervals sit on a grid from midnight (hours, days) or Monday (weeks); the axis starts with the
  // interval holding the first case, or an earlier time asked for, such as the meal.
  const lo = Math.min(first, ...include.filter(Number.isFinite)), hi = Math.max(last, ...include.filter(Number.isFinite));
  const base = unit === 'week' ? mondayOf(lo) : startOfDay(lo);
  const origin = base + Math.floor((lo - base) / size) * size - pad * size;
  const nBins = Math.floor((hi - origin) / size) + 1 + pad;
  const groups = [...new Set(used.map((e) => e.group ?? ''))].filter((g) => g !== '').sort();
  const bins = Array.from({ length: nBins }, (_, i) => ({ start: origin + i * size, end: origin + (i + 1) * size, count: 0, groups: Object.fromEntries(groups.map((g) => [g, 0])) }));
  for (const e of used) {
    const b = bins[Math.floor((e.t - origin) / size)];
    b.count += 1;
    if (e.group != null && e.group !== '') b.groups[e.group] += 1;
  }
  const top = Math.max(...bins.map((b) => b.count));
  const peak = bins.filter((b) => b.count === top);
  return { unit, width, size, bins, groups, n: used.length, untimed: valid.length - used.length, invalid: events.length - valid.length, first, last, peak, median: quantile(ts, 0.5) };
}

/**
 * The probable period of exposure for a point-source outbreak (CDC Quick Learn): the first case
 * less the minimum incubation period, the peak less the average, the last case less the maximum.
 * Incubation periods in hours; the peak is the middle of the first interval with the most cases.
 */
export function exposureWindow(curve, { min, avg, max }) {
  const out = {};
  if (Number.isFinite(min)) out.fromFirst = curve.first - min * HOUR;
  if (Number.isFinite(avg)) out.fromPeak = (curve.peak[0].start + curve.peak[0].end) / 2 - avg * HOUR;
  if (Number.isFinite(max)) out.fromLast = curve.last - max * HOUR;
  const v = Object.values(out);
  if (v.length) { out.from = Math.min(...v); out.to = Math.max(...v); }
  return out;
}

/** Attack rate with Wilson's interval. */
export function attackRate(cases, population, conf = 0.95) {
  return { cases, population, ar: population > 0 ? cases / population : NaN, ci: population > 0 ? wilson(cases, population, conf) : null };
}

/** Attack rates for groups [{ label, cases, population }], with the total. */
export function attackRates(groups, conf = 0.95) {
  const rows = groups.map((g) => ({ label: g.label, ...attackRate(g.cases, g.population, conf) }));
  const cases = groups.reduce((s, g) => s + g.cases, 0), population = groups.reduce((s, g) => s + g.population, 0);
  return { rows, total: attackRate(cases, population, conf) };
}

/**
 * Food-specific attack rates. items: [{ name, a, b, c, d }] where, in a cohort of everyone at the
 * meal, a = ate and ill, b = ate and well, c = did not eat and ill, d = did not eat and well; in a
 * case-control study a = cases who ate, b = controls who ate, c = cases who did not, d = controls who
 * did not. Each item gets the attack rates (or the proportions exposed), the risk ratio (or odds
 * ratio) with the interval the association tool reports, the test it reports, and the share of cases
 * who ate the item. Rows are sorted by the ratio, highest first.
 */
export function foodTable(items, { design = 'cohort', conf = 0.95 } = {}) {
  const cc = design === 'case-control';
  const rows = items.map((it) => {
    const tb = twoByTwo([[it.a, it.b], [it.c, it.d]], { conf, design: cc ? 'case-control' : 'cohort' });
    const R = cc ? tb.or : tb.rr;
    const auto = R ? R.auto : null;
    const test = tb.tests ? (tb.tests.exact ? { p: tb.tests.pFisher, method: "Fisher's exact test" } : { p: tb.tests.pYates, method: "χ² with Yates' correction" }) : null;
    return {
      name: it.name, a: it.a, b: it.b, c: it.c, d: it.d,
      ate: it.a + it.b, notAte: it.c + it.d,
      arAte: cc ? null : tb.r1?.p ?? NaN, arNot: cc ? null : tb.r0?.p ?? NaN,
      casesExposed: cc ? (tb.pCases?.p ?? NaN) : null, controlsExposed: cc ? (tb.pControls?.p ?? NaN) : null,
      ratio: R ? R.est : NaN, ci: R && auto ? R[auto] : null, method: auto,
      rd: cc ? null : tb.rd?.est ?? NaN,
      shareOfCases: it.a + it.c > 0 ? it.a / (it.a + it.c) : NaN,
      test,
    };
  });
  const key = (r) => (Number.isNaN(r.ratio) ? -Infinity : r.ratio);
  rows.sort((x, y) => key(y) - key(x) || y.shareOfCases - x.shareOfCases);
  return { design, rows };
}

/** Food-item counts from columns: ill[i] true/false/null, ate[k][i] true/false/null. */
export function foodCounts(ill, items) {
  return items.map(({ name, ate }) => {
    let a = 0, b = 0, c = 0, d = 0, missing = 0;
    ill.forEach((y, i) => {
      const x = ate[i];
      if (y == null || x == null) { missing += 1; return; }
      if (x && y) a += 1; else if (x) b += 1; else if (y) c += 1; else d += 1;
    });
    return { name, a, b, c, d, missing };
  });
}

/** Yes-or-no answers about eating an item: true, false or null for anything else. */
export function readYesNo(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (/^(yes|y|1|true|ate|eaten|consumed)$/.test(s)) return true;
  if (/^(no|n|0|false|not eaten|did not eat)$/.test(s)) return false;
  return null;
}

/**
 * Incubation periods in hours from exposure and onset times (milliseconds). Onsets at or before
 * exposure are left out and counted. Summary: median, quartiles (R's type 7), range, mean and SD,
 * and on the log scale the geometric mean and Sartwell's dispersion factor (exp of the SD of the logs).
 */
export function incubation(pairs) {
  const hours = [], before = [];
  for (const { exposure, onset } of pairs) {
    if (!Number.isFinite(exposure) || !Number.isFinite(onset)) continue;
    const h = (onset - exposure) / HOUR;
    if (h > 0) hours.push(h); else before.push(h);
  }
  const n = hours.length;
  if (!n) return { n: 0, before: before.length, hours };
  const s = [...hours].sort((a, b) => a - b);
  const mean = s.reduce((x, y) => x + y, 0) / n;
  const sd = n > 1 ? Math.sqrt(s.reduce((x, y) => x + (y - mean) ** 2, 0) / (n - 1)) : NaN;
  const logs = s.map(Math.log), lm = logs.reduce((x, y) => x + y, 0) / n;
  const lsd = n > 1 ? Math.sqrt(logs.reduce((x, y) => x + (y - lm) ** 2, 0) / (n - 1)) : NaN;
  return {
    n, before: before.length, hours: s,
    median: quantile(s, 0.5), q1: quantile(s, 0.25), q3: quantile(s, 0.75), min: s[0], max: s[n - 1],
    mean, sd, geoMean: Math.exp(lm), dispersion: Math.exp(lsd),
  };
}

const DATE_RX = {
  '%Y-%m-%d': '\\d{4}-\\d{1,2}-\\d{1,2}', '%d/%m/%Y': '\\d{1,2}/\\d{1,2}/\\d{4}', '%m/%d/%Y': '\\d{1,2}/\\d{1,2}/\\d{4}',
  '%d-%m-%Y': '\\d{1,2}-\\d{1,2}-\\d{4}', '%m-%d-%Y': '\\d{1,2}-\\d{1,2}-\\d{4}', '%d.%m.%Y': '\\d{1,2}\\.\\d{1,2}\\.\\d{4}', '%m.%d.%Y': '\\d{1,2}\\.\\d{1,2}\\.\\d{4}',
};

/**
 * The strptime format (shared by R and Python) that reads every non-blank value of a date column
 * the way the app reads it: ISO, or day-first (month-first) with / - or ., with an optional time as
 * HH:MM. Null for anything else (month names, spreadsheet day numbers, a mix), so that no script is
 * offered that would read the dates differently.
 */
export function dateFormat(values, { order = 'dmy' } = {}) {
  const v = values.map((x) => String(x ?? '').trim()).filter(Boolean);
  if (!v.length) return null;
  const dm = order === 'mdy' ? ['%m/%d/%Y', '%m-%d-%Y', '%m.%d.%Y'] : ['%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y'];
  for (const f of ['%Y-%m-%d', ...dm]) {
    if (v.every((s) => new RegExp(`^${DATE_RX[f]}$`).test(s))) return f;
    if (v.every((s) => new RegExp(`^${DATE_RX[f]} \\d{1,2}:\\d{2}$`).test(s))) return `${f} %H:%M`;
  }
  return null;
}

/** True when every non-blank value is a time written as H:MM or HH:MM (24-hour). */
export const plainTimes = (values) => values.map((x) => String(x ?? '').trim()).filter(Boolean).every((s) => /^\d{1,2}:\d{2}$/.test(s));
