/* Stratified analysis and standardisation against tests/ref/strat.json (R: mantelhaen.test, poisson.test,
 * epiR, epitools, metafor) and tests/ref/strat_py.json (statsmodels StratifiedTable). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { mhTables, mhPersonTime, directStandard, dsrRatio, indirectStandard, poissonExactP, confoundingChange } from '../../engine/strat.js';

const R = loadRef('strat.json');
const PY = loadRef('strat_py.json');
const v = (x) => (x === 'NaN' || x === null || x === undefined ? NaN : x >= 1e308 ? Infinity : x <= -1e308 ? -Infinity : x);
const strata = (s) => s.map((t, i) => ({ label: `S${i + 1}`, t }));

function checker(label) {
  const bad = [];
  let n = 0;
  return {
    eq(name, got, want, rel = 1e-9, abs = 1e-12) {
      if (Array.isArray(want)) { want.forEach((w, i) => this.eq(`${name}[${i}]`, got?.[i], w, rel, abs)); return; }
      const w = v(want);
      if (Number.isNaN(w)) return; // the reference has no value here
      n++;
      if (!close(got, w, rel, abs)) bad.push(`${label} ${name}: got ${got}, want ${w}`);
    },
    ok(name, cond) { n++; if (!cond) bad.push(`${label} ${name}`); },
    /** Fails on any mismatch, and if fewer than `min` comparisons ran (so a check cannot pass by skipping). */
    done(min) {
      assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 30).join('\n')}`);
      assert.ok(n >= min, `${label}: only ${n} comparisons ran, expected at least ${min}`);
    },
  };
}

test('Mantel-Haenszel odds ratio, CMH test and Breslow-Day-Tarone match R (mantelhaen.test, metafor) and statsmodels', () => {
  const c = checker('MH');
  R.two.forEach((r, i) => {
    const o = mhTables(strata(r.strata), { design: r.design }), tag = `set ${i + 1}`;
    c.eq(`${tag} OR`, o.or.est, r.cmh.or, 1e-12);
    c.eq(`${tag} OR ci (mantelhaen.test, RBG)`, o.or.ci, r.cmh.orCi, 1e-9);
    c.eq(`${tag} OR se (metafor)`, o.or.se, r.metaforOR.se, 1e-9);
    c.eq(`${tag} CMH`, o.cmh.chi2, r.cmh.chi2, 1e-10); c.eq(`${tag} CMH p`, o.cmh.p, r.cmh.p, 1e-9, 1e-15);
    c.eq(`${tag} CMH uncorrected`, o.cmh.chi2Uncorrected, r.cmh.chi2Uncorrected, 1e-10); c.eq(`${tag} CMH p uncorrected`, o.cmh.pUncorrected, r.cmh.pUncorrected, 1e-9, 1e-15);
    if (r.epiR) c.eq(`${tag} epiR OR`, [o.or.est, ...o.or.ci], r.epiR.or, 1e-9);
    const p = PY.two[i];
    c.eq(`${tag} OR (statsmodels)`, o.or.est, p.or, 1e-12); c.eq(`${tag} log se (statsmodels)`, o.or.se, p.logSe, 1e-9);
    c.eq(`${tag} Breslow-Day`, o.bd.chi2, p.bd, 1e-8); c.eq(`${tag} BD p`, o.bd.p, p.pBd, 1e-7, 1e-15);
    c.eq(`${tag} Tarone`, o.bd.chi2Tarone, p.bdTarone, 1e-8); c.eq(`${tag} Tarone p`, o.bd.pTarone, p.pBdTarone, 1e-7, 1e-15);
    c.ok(`${tag} strata used by BD`, o.bd.k === p.kept);
    if (Number.isFinite(v(r.metaforOR.tarone)) && o.bd.k === r.strata.length) c.eq(`${tag} Tarone (metafor)`, o.bd.chi2Tarone, r.metaforOR.tarone, 1e-8);
  });
  c.done(100);
});

test('Mantel-Haenszel risk ratio and risk difference (Sato and Greenland-Robins variances) and homogeneity match metafor and epiR', () => {
  const c = checker('MH RR/RD');
  R.two.forEach((r, i) => {
    if (r.design === 'case-control') return;
    const o = mhTables(strata(r.strata), { design: r.design }), tag = `set ${i + 1}`;
    c.eq(`${tag} RR`, o.rr.est, r.metaforRR.est, 1e-12); c.eq(`${tag} RR se`, o.rr.se, r.metaforRR.se, 1e-9);
    c.eq(`${tag} RD`, o.rd.est, r.metaforRD.est, 1e-12, 1e-15); c.eq(`${tag} RD se (Sato, metafor)`, o.rd.se, r.metaforRD.se, 1e-9);
    if (r.epiR) {
      c.eq(`${tag} epiR RR`, [o.rr.est, ...o.rr.ci], r.epiR.rr, 1e-9);
      if (r.epiR.rdSato) { c.eq(`${tag} epiR RD Sato`, [o.rd.est, ...o.rd.ci], r.epiR.rdSato, 1e-9, 1e-14); c.eq(`${tag} epiR RD GR`, [o.rd.est, ...o.rd.ciGR], r.epiR.rdGR, 1e-9, 1e-14); }
    }
    if (r.homogRR) { c.eq(`${tag} homogeneity RR`, o.homogRR.q, r.homogRR.q, 1e-9); c.eq(`${tag} homogeneity RR p`, o.homogRR.p, r.homogRR.p, 1e-8, 1e-15); c.ok(`${tag} RR k`, o.homogRR.k === r.homogRR.k); }
    c.eq(`${tag} homogeneity RD`, o.homogRD.q, r.homogRD.q, 1e-9); c.eq(`${tag} homogeneity RD p`, o.homogRD.p, r.homogRD.p, 1e-8, 1e-15);
  });
  c.done(40);
});

test('person-time strata: Mantel-Haenszel rate ratio and difference, MH test and homogeneity match metafor and epiR', () => {
  const c = checker('MH person-time');
  R.pt.forEach((r, i) => {
    const o = mhPersonTime(r.strata), tag = `set ${i + 1}`;
    c.eq(`${tag} IRR`, o.irr.est, r.irr, 1e-12); c.eq(`${tag} IRR se`, o.irr.se, r.se, 1e-9); c.eq(`${tag} IRR ci`, o.irr.ci, r.ci, 1e-9);
    c.eq(`${tag} MH test`, o.test.chi2, r.mh, 1e-9); c.eq(`${tag} MH p`, o.test.p, r.pMh, 1e-8, 1e-15); c.eq(`${tag} MH uncorrected`, o.test.chi2Uncorrected, r.mhUncorrected, 1e-9);
    c.eq(`${tag} IRD`, o.ird.est, r.ird, 1e-11, 1e-15); c.eq(`${tag} IRD se`, o.ird.se, r.seIrd, 1e-9);
    if (r.homog) { c.eq(`${tag} homogeneity`, o.homogIRR.q, r.homog.q, 1e-9); c.ok(`${tag} homogeneity k`, o.homogIRR.k === r.homog.k); }
    if (r.epiR) c.eq(`${tag} epiR IRR`, [o.irr.est, ...o.irr.ci], r.epiR, 1e-9);
  });
  c.done(20);
});

test('direct standardisation (Fay-Feuer gamma CI) matches epitools; SMR matches poisson.test', () => {
  const c = checker('standardisation');
  R.direct.forEach((r, i) => {
    const o = directStandard(r.x.map((x, j) => ({ label: `S${j}`, x, n: r.n[j], std: r.std[j] }))), tag = `direct ${i + 1}`;
    c.eq(`${tag} crude`, o.crude, r.crude, 1e-12, 1e-16); c.eq(`${tag} DSR`, o.dsr, r.dsr, 1e-12, 1e-16);
    if (o.dsr > 0) c.eq(`${tag} CI`, o.ci, r.ci, 1e-8, 1e-14);
    else { c.ok(`${tag} lower limit 0 when no events`, o.ci[0] === 0); c.eq(`${tag} upper`, o.ci[1], r.ci[1], 1e-8, 1e-14); }
  });
  R.indirect.forEach((r) => {
    const o = indirectStandard([{ label: 'all', n: 1, rate: r.e }], r.o), tag = `SMR ${r.o}/${r.e}`;
    c.eq(`${tag}`, o.smr, r.smr, 1e-12); c.eq(`${tag} ci`, o.ci, r.ci, 1e-9, 1e-14); c.eq(`${tag} p`, o.p, r.p, 1e-9, 1e-15);
  });
  c.done(40);
});

test('worked checks: collapsing equal strata, the ratio of two DSRs, crude against adjusted', () => {
  // Two identical strata: the MH estimates equal each stratum's estimate, and the tests of homogeneity are 0.
  const o = mhTables(strata([[[20, 80], [10, 90]], [[20, 80], [10, 90]]]));
  assert.ok(close(o.or.est, (20 * 90) / (80 * 10), 1e-14) && close(o.rr.est, 2, 1e-14) && close(o.rd.est, 0.1, 1e-14));
  assert.ok(Math.abs(o.bd.chi2) < 1e-12 && Math.abs(o.homogRR.q) < 1e-12);
  // Ratio of DSRs: the same DSR gives 1 with a symmetric log interval.
  const d = directStandard([{ x: 10, n: 1000, std: 1 }, { x: 20, n: 1000, std: 1 }]);
  const r = dsrRatio(d, d);
  assert.ok(close(r.est, 1, 1e-15) && close(r.ci[0] * r.ci[1], 1, 1e-12));
  // Crude 2.0 against adjusted 1.6: 25% change.
  assert.ok(close(confoundingChange(2, 1.6).change, 25, 1e-12));
  // Exact Poisson test of 12 against 12 is 1.
  assert.equal(poissonExactP(12, 12), 1);
});
