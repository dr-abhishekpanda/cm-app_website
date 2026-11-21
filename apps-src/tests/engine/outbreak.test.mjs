/* Outbreak tools against tests/ref/outbreak.json (R: cut() on POSIXct times, quantile type 7,
 * prop.test's Wilson interval, epiR's epi.2by2, chisq.test and fisher.test) on the example
 * wedding-lunch outbreak; dates and times, intervals and the probable period of exposure by hand. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { parseDateTime, parseTime, epiCurve, suggestInterval, exposureWindow, attackRates, foodTable, foodCounts, readYesNo, incubation, dateFormat, plainTimes, HOUR, DAY } from '../../engine/outbreak.js';
import { exampleOutbreakCsv } from '../../engine/examples.js';
import { readDataset, isMissing } from '../../engine/data.js';

const R = loadRef('outbreak.json');
const ds = readDataset(exampleOutbreakCsv());
const col = (n) => ds.columns.find((c) => c.name === n);
const ill = col('Ill').raw.map((v) => (isMissing(v) ? null : v === 'Yes'));
const events = [];
ill.forEach((y, i) => { if (y) { const p = parseDateTime(col('Onset_date').raw[i], isMissing(col('Onset_time').raw[i]) ? '' : col('Onset_time').raw[i]); if (p) events.push(p); } });
const meal = Date.UTC(2026, 2, 14, 13, 0);
const label = (t) => new Date(t).toISOString().slice(0, 16).replace('T', ' ');

test('dates and times of onset: day-first, ISO, month names, spreadsheet day numbers, 12- and 24-hour times', () => {
  const D = Date.UTC(2026, 2, 14);
  const cases = [
    [['14/03/2026'], D, false], [['14/03/2026', '22:30'], D + 22.5 * HOUR, true], [['2026-03-14 22:30'], D + 22.5 * HOUR, true],
    [['14-Mar-26', '9:05 pm'], D + 21 * HOUR + 5 * 60000, true], [['14.03.2026', '2230'], D + 22.5 * HOUR, true], [['Mar 14, 2026'], D, false],
    [['14 March 2026', '12:30 am'], D + 30 * 60000, true], [['14/3/26', '12:00 pm'], D + 12 * HOUR, true],
    [[String(D / DAY + 25569)], D, false], [[String(D / DAY + 25569 + 0.9375)], D + 22.5 * HOUR, true],
  ];
  for (const [args, t, timed] of cases) {
    const p = parseDateTime(...args);
    assert.deepEqual(p, { t, timed }, args.join(' '));
  }
  assert.deepEqual(parseDateTime('03/14/2026', '', { order: 'mdy' }), { t: D, timed: false });
  for (const bad of [['31/02/2026'], ['14/13/2026'], ['14/03/2026', '25:00'], ['14/03/2026', '7'], ['yesterday'], ['']]) assert.equal(parseDateTime(...bad), null, bad.join(' '));
  assert.equal(parseTime('13:00 pm'), null);
  assert.equal(dateFormat(['14/03/2026', '', '9/3/2026']), '%d/%m/%Y');
  assert.equal(dateFormat(['2026-03-14 22:30']), '%Y-%m-%d %H:%M');
  assert.equal(dateFormat(['14 Mar 2026']), null);
  assert.equal(dateFormat(['14/03/2026', '2026-03-15']), null);
  assert.ok(plainTimes(['22:30', '', '9:05']) && !plainTimes(['9 pm']));
  assert.deepEqual(['Yes', 'no', ' Y ', '1', 'ate', 'maybe', ''].map(readYesNo), [true, false, true, true, true, null, null]);
});

test("the epidemic curve counts each interval as R's cut() does, from the interval holding the lunch", () => {
  const cv = epiCurve(events, { unit: 'hour', width: 3, include: [meal] });
  assert.deepEqual(cv.bins.map((b) => label(b.start)), R.curve3h.starts);
  assert.deepEqual(cv.bins.map((b) => b.count), R.curve3h.counts);
  assert.equal(cv.untimed, R.untimed);
  assert.equal(cv.n + cv.untimed, R.total.cases);
  // Days: every case counts (with or without a time), and the same counts by date as R.
  const cd = epiCurve(events, { unit: 'day', width: 1, include: [meal] });
  const byStart = Object.fromEntries(cd.bins.map((b) => [label(b.start), b.count]));
  R.curve1d.starts.forEach((s, i) => assert.equal(byStart[s], R.curve1d.counts[i], s));
  assert.equal(cd.n, R.total.cases);
  assert.equal(cd.bins[0].count, 0); assert.equal(cd.bins[cd.bins.length - 1].count, 0);
  // Weeks start on a Monday: 14 March 2026 was a Saturday, so its week starts on 9 March.
  assert.equal(label(epiCurve(events, { unit: 'week', width: 1, pad: 0 }).bins[0].start), '2026-03-09 00:00');
  // Groups stack within each interval.
  const g = epiCurve(events.map((e, i) => ({ ...e, group: i % 2 ? 'B' : 'A' })), { unit: 'hour', width: 3 });
  assert.ok(g.bins.every((b) => b.groups.A + b.groups.B === b.count));
});

test('the interval is about a quarter of the average incubation period, and the probable period of exposure counts back from the curve (CDC)', () => {
  // CDC's example: an incubation period of 3 to 4 days suggests one-day intervals.
  assert.deepEqual(suggestInterval(3.5 * 24), { unit: 'day', width: 1 });
  assert.deepEqual(suggestInterval(24), { unit: 'hour', width: 6 });
  assert.deepEqual(suggestInterval(11.7), { unit: 'hour', width: 3 });
  assert.deepEqual(suggestInterval(2), { unit: 'hour', width: 1 });
  assert.deepEqual(suggestInterval(30 * 24), { unit: 'week', width: 1 });
  const cv = epiCurve(events, { unit: 'hour', width: 3, include: [meal] });
  // First case 17:45 less 4 hours; peak 21:00 to 24:00, centred on 22:30, less 11 hours; last case 11:45 next day less 23 hours.
  const w = exposureWindow(cv, { min: 4, avg: 11, max: 23 });
  assert.equal(label(w.fromFirst), '2026-03-14 13:45');
  assert.equal(label(w.fromPeak), '2026-03-14 11:30');
  assert.equal(label(w.fromLast), '2026-03-14 12:45');
  assert.equal(label(w.from), '2026-03-14 11:30'); assert.equal(label(w.to), '2026-03-14 13:45');
});

test('incubation period, attack rates and the food-specific table match R', () => {
  const inc = incubation(events.filter((e) => e.timed).map((e) => ({ exposure: meal, onset: e.t })));
  const r = R.incubation;
  for (const [k, rk] of [['n', 'n'], ['median', 'median'], ['q1', 'q1'], ['q3', 'q3'], ['min', 'min'], ['max', 'max'], ['mean', 'mean'], ['sd', 'sd'], ['geoMean', 'geo'], ['dispersion', 'disp']]) {
    assert.ok(close(inc[k], r[rk], 1e-12), `${k}: ${inc[k]} against ${r[rk]}`);
  }
  // Onsets before the exposure are counted and left out.
  assert.deepEqual(incubation([{ exposure: 10 * HOUR, onset: 9 * HOUR }, { exposure: 0, onset: 5 * HOUR }]).before, 1);

  const groups = new Map();
  ill.forEach((y, i) => { const g = col('Age_group').raw[i]; const t = groups.get(g) ?? { cases: 0, population: 0 }; t.population += 1; if (y) t.cases += 1; groups.set(g, t); });
  const ar = attackRates([...groups].map(([lab, t]) => ({ label: lab, ...t })));
  for (const ref of R.attack) {
    const row = ar.rows.find((x) => x.label === ref.group);
    assert.equal(row.cases, ref.cases); assert.equal(row.population, ref.n);
    assert.ok(close(row.ar, ref.ar, 1e-14) && close(row.ci[0], ref.ci[0], 1e-10) && close(row.ci[1], ref.ci[1], 1e-10), `${ref.group}: ${row.ci} against ${ref.ci}`);
  }
  assert.ok(close(ar.total.ci[0], R.total.ci[0], 1e-10) && close(ar.total.ci[1], R.total.ci[1], 1e-10));

  const items = R.food.map((f) => f.item);
  const counts = foodCounts(ill, items.map((name) => ({ name, ate: col(name).raw.map(readYesNo) })));
  const ft = foodTable(counts);
  for (const ref of R.food) {
    const row = ft.rows.find((x) => x.name === ref.item);
    assert.deepEqual([row.a, row.b, row.c, row.d], ref.cells, ref.item);
    assert.ok(close(row.ratio, ref.rr[0], 1e-12), `${ref.item} RR`);
    if (row.method === 'wald') assert.ok(close(row.ci[0], ref.rr[1], 1e-10) && close(row.ci[1], ref.rr[2], 1e-10), `${ref.item} Katz CI ${row.ci} against ${ref.rr}`);
    const p = ref.minExpected < 5 ? ref.pFisher : ref.pYates;
    assert.ok(close(row.test.p, p, 1e-8), `${ref.item} p ${row.test.p} against ${p}`);
    assert.ok(close(row.shareOfCases, ref.cells[0] / (ref.cells[0] + ref.cells[2]), 1e-15));
  }
  assert.equal(ft.rows[0].name, 'Mutton_curry');
  // Rice: few people did not eat it, so an expected count is below 5 and Fisher's exact test is reported.
  assert.equal(ft.rows.find((x) => x.name === 'Rice').test.method, "Fisher's exact test");
});
