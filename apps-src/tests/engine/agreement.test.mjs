/* Agreement, reliability and meta-analysis against tests/ref/agreement.json (statsmodels, pingouin, definitions). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { cohenKappa, fleissKappa, icc, cronbach, blandAltman } from '../../engine/agreement.js';
import { pool, egger, binaryEffect, continuousEffect } from '../../engine/meta.js';

const ref = loadRef('agreement.json');
function checker(label) {
  const bad = [];
  return {
    eq(name, got, want, rel = 1e-9, abs = 1e-12) {
      if (Array.isArray(want)) { want.forEach((w, i) => this.eq(`${name}[${i}]`, got[i], w, rel, abs)); return; }
      if (!close(got, want, rel, abs)) bad.push(`${label} ${name}: got ${got}, want ${want}`);
    },
    done() { assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 25).join('\n')}`); },
  };
}

test("Cohen's kappa (unweighted and weighted) and Fleiss' kappa match statsmodels", () => {
  const c = checker('kappa');
  for (const r of ref.kappa) {
    for (const w of ['none', 'linear', 'quadratic']) {
      if (!r[w]) continue;
      const k = cohenKappa(r.t, { weights: w });
      c.eq(`${w} kappa`, k.kappa, r[w].kappa, 1e-12); c.eq(`${w} se`, k.se, r[w].se, 1e-10);
      c.eq(`${w} se0`, k.se0, r[w].se0, 1e-10); c.eq(`${w} p`, k.p, r[w].p, 1e-8, 1e-15);
    }
  }
  for (const r of ref.fleiss) c.eq('Fleiss', fleissKappa(r.counts).kappa, r.kappa, 1e-12);
  c.done();
});

test('ICC, Cronbach alpha and Bland-Altman', () => {
  const c = checker('reliability');
  for (const r of ref.icc) {
    const o = icc(r.data);
    const names = { 'ICC(1,1)': 'ICC1', 'ICC(A,1)': 'ICC2', 'ICC(C,1)': 'ICC3', 'ICC(1,k)': 'ICC1k', 'ICC(A,k)': 'ICC2k', 'ICC(C,k)': 'ICC3k' };
    for (const f of r.forms) {
      const g = o.forms.find((x) => x.id === (names[f.type] || f.type));
      c.eq(`${f.type} icc`, g.icc, f.icc, 1e-11); c.eq(`${f.type} F`, g.F, f.F, 1e-11); c.eq(`${f.type} p`, g.p, f.p, 1e-8, 1e-15);
      c.eq(`${f.type} ci`, g.ci, [f.lo, f.hi], 1e-2, 1e-2); // pingouin rounds its CI to 2 decimals
    }
  }
  for (const r of ref.cronbach) {
    const o = cronbach(r.data);
    c.eq('alpha', o.alpha, r.alpha, 1e-12); c.eq('alpha ci', o.ci, r.ci, 1e-2, 5e-3); // pingouin rounds to 3 decimals
  }
  for (const r of ref.bland) {
    const o = blandAltman(r.a, r.b);
    c.eq('bias', o.bias, r.bias, 1e-12); c.eq('sd', o.sd, r.sd, 1e-12); c.eq('loa', o.loa, r.loa, 1e-12); c.eq('ci bias', o.ciBias, r.ciBias, 1e-12);
  }
  c.done();
});

test('meta-analysis pooling, heterogeneity, prediction interval and Egger', () => {
  const c = checker('meta');
  for (const r of ref.meta) {
    for (const m of ['DL', 'PM']) {
      const o = pool(r.y, r.v, { method: m });
      const tol = m === 'PM' ? 1e-6 : 1e-9; // statsmodels iterates Paule-Mandel to a looser tolerance
      c.eq(`${m} fe`, o.fe, r[m].fe, 1e-12); c.eq(`${m} seFE`, o.seFE, r[m].seFE, 1e-12); c.eq(`${m} Q`, o.Q, r[m].Q, 1e-12);
      if (r[m].tau2 < 0) {
        // statsmodels leaves a negative DerSimonian-Laird estimate untruncated; the standard estimator is max(0, .).
        c.eq(`${m} tau2 truncated`, o.tau2, 0); c.eq(`${m} I2 truncated`, o.I2, 0); c.eq(`${m} re = fe`, o.re, o.fe, 1e-12);
        c.eq(`${m} HKSJ se`, pool(r.y, r.v, { method: m, hksj: true }).seRE, o.seFE * Math.sqrt(o.Q / o.df), 1e-12);
        continue;
      }
      c.eq(`${m} re`, o.re, r[m].re, tol); c.eq(`${m} seRE`, o.seRE, r[m].seRE, tol); c.eq(`${m} tau2`, o.tau2, r[m].tau2, tol * 10, 1e-12);
      c.eq(`${m} I2`, o.I2, Math.max(0, r[m].I2), 1e-11); // statsmodels reports (Q - df) / Q without truncating at 0
      c.eq(`${m} HKSJ se`, pool(r.y, r.v, { method: m, hksj: true }).seRE, r[m].seHKSJ, tol);
    }
    const dl = pool(r.y, r.v, { method: 'DL' });
    c.eq('prediction interval', dl.pi, r.piDL, 1e-11); c.eq('I2 interval', dl.I2ci, r.I2ci, 1e-11);
    const e = egger(r.y, r.v);
    c.eq('Egger intercept', e.intercept, r.egger.intercept, 1e-10); c.eq('Egger p', e.p, r.egger.p, 1e-9);
  }
  for (const r of ref.effects) for (const m of ['OR', 'RR', 'RD']) {
    const o = binaryEffect(r.e1, r.n1, r.e2, r.n2, m);
    c.eq(`${m} y`, o.y, r[m][0], 1e-12); c.eq(`${m} v`, o.v, r[m][1], 1e-12);
  }
  for (const r of ref.smd) {
    const o = continuousEffect(...r.in, 'SMD');
    c.eq('g', o.y, r.g, 1e-12); c.eq('var g', o.v, r.v, 1e-12);
  }
  c.done();
});

test("Fleiss' kappa: null standard error matches simulation; category kappas; bootstrap CI", async () => {
  const c = checker('fleiss');
  // Build counts whose margins equal the simulated category probabilities, so se0 is the formula at those p.
  const fn = ref.fleissNull;
  const totals = fn.pj.map((p) => Math.round(p * fn.N * fn.n));
  const counts = [];
  const left = [...totals];
  for (let i = 0; i < fn.N; i++) {
    const row = [0, 0, 0];
    for (let r = 0; r < fn.n; r++) { const j = left.findIndex((x) => x > 0); row[j]++; left[j]--; }
    counts.push(row);
  }
  const o = fleissKappa(counts, { B: 10 });
  c.eq('null SE = formula', o.se0, fn.seFormula, 1e-12);
  c.eq('null SE ~ simulated SD', o.se0, fn.mcSD, 0.02); // 20 000 simulations: Monte Carlo error under 1%
  const fb = ref.fleissBoot;
  const k = fleissKappa(fb.counts);
  c.eq('kappa', k.kappa, fb.kappa, 1e-12);
  c.eq('category kappas', k.categories.map((x) => x.kappa), fb.categories, 1e-12);
  const wsum = k.categories.reduce((s, x) => s + x.p * (1 - x.p), 0);
  c.eq('kappa = weighted mean of category kappas', k.categories.reduce((s, x) => s + x.p * (1 - x.p) * x.kappa, 0) / wsum, k.kappa, 1e-12);
  c.eq('bootstrap CI', k.ci, fb.ci, 0, 0.015); // different generators and B: agreement within resampling error
  c.eq('same seed, same CI', fleissKappa(fb.counts).ci, k.ci, 0, 0);
  c.done();
});

test('REML tau-squared, Q-profile interval, subgroups, leave-one-out, zero cells and Bland-Altman scales', async () => {
  const { tau2Interval, subgroups, leaveOneOut } = await import('../../engine/meta.js');
  const c = checker('meta+');
  for (const r of ref.reml) {
    const o = pool(r.y, r.v, { method: 'REML' });
    c.eq('REML tau2', o.tau2, r.tau2, 1e-6, 1e-9); // the reference maximises the likelihood numerically
    c.eq('REML re', o.re, r.re, 1e-6); c.eq('REML seRE', o.seRE, r.seRE, 1e-6);
    c.eq('Q-profile', tau2Interval(r.y, r.v), r.qprofile, 1e-9, 1e-12);
    c.eq('Q-profile in pool', o.tau2ci, r.qprofile, 1e-9, 1e-12);
  }
  for (const r of ref.subgroups) {
    const o = subgroups(r.y, r.v, r.g, { method: 'DL' });
    c.eq('subgroup estimates', o.fits.map((f) => f.fit.re), r.re, 1e-12);
    c.eq('Q between', o.Q, r.Q, 1e-10); c.eq('p between', o.p, r.p, 1e-9, 1e-15);
  }
  const r0 = ref.reml[1];
  const loo = leaveOneOut(r0.y, r0.v, { method: 'DL' });
  c.eq('leave-one-out count', loo.length, r0.y.length);
  c.eq('leave-one-out first', loo[0].re, pool(r0.y.slice(1), r0.v.slice(1), { method: 'DL' }).re, 1e-14);
  // Zero cells: double-zero studies are left out of OR and RR; RD gets 0.5 only when its variance is 0.
  c.eq('double zero OR excluded', Number.isNaN(binaryEffect(0, 20, 0, 22, 'OR').y) ? 1 : 0, 1);
  c.eq('double zero RR excluded', binaryEffect(20, 20, 22, 22, 'RR').excluded ? 1 : 0, 1);
  const rd = binaryEffect(0, 20, 0, 22, 'RD');
  c.eq('RD corrected', [rd.y, rd.v], [0.5 / 21 - 0.5 / 23, (0.5 / 21) * (20.5 / 21) / 21 + (0.5 / 23) * (22.5 / 23) / 23], 1e-12);
  c.eq('RD single zero uncorrected', binaryEffect(0, 30, 5, 31, 'RD').corrected ? 1 : 0, 0);
  for (const r of ref.blandScale) {
    const o = blandAltman(r.a, r.b, { scale: r.scale });
    c.eq(`${r.scale} bias`, o.bias, r.bias, 1e-12); c.eq(`${r.scale} sd`, o.sd, r.sd, 1e-12); c.eq(`${r.scale} loa`, o.loa, r.loa, 1e-12);
  }
  c.done();
});
