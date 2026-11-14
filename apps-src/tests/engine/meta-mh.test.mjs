/* Mantel-Haenszel and Peto pooling against tests/ref/meta_mh.json (metafor rma.mh and rma.peto). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRef, close } from './helpers.mjs';
import { poolMH, poolPeto, subgroupsMH } from '../../engine/meta.js';

const R = loadRef('meta_mh.json');

test('Mantel-Haenszel (OR, RR, RD) and Peto pooling match metafor: estimate, SE, CI, p, Q, I-squared and weights', () => {
  const bad = [];
  let n = 0;
  const eq = (tag, got, want, rel = 1e-9, abs = 1e-12) => {
    const g = Array.isArray(want) ? got : [got], w = Array.isArray(want) ? want : [want];
    w.forEach((x, i) => { n++; if (!close(g[i], x, rel, abs)) bad.push(`${tag}[${i}]: got ${g[i]}, want ${x}`); });
  };
  R.sets.forEach((s, j) => {
    for (const m of ['OR', 'RR', 'RD']) {
      const o = poolMH(s.counts, m), r = s[`mh${m}`], tag = `set ${j + 1} MH ${m}`;
      eq(`${tag} y`, o.y, r.y, 1e-11, 1e-15); eq(`${tag} se`, o.se, r.se); eq(`${tag} ci`, o.ci, r.ci, 1e-9, 1e-14); eq(`${tag} p`, o.p, r.p, 1e-8, 1e-15);
      eq(`${tag} Q`, o.Q, r.Q, 1e-9, 1e-12); eq(`${tag} pQ`, o.pQ, r.pQ, 1e-8, 1e-15); eq(`${tag} I2`, o.I2, r.I2, 1e-9, 1e-12);
      eq(`${tag} weights`, o.weights, r.weights, 1e-9, 1e-14);
    }
    const p = poolPeto(s.counts), r = s.peto, tag = `set ${j + 1} Peto`;
    eq(`${tag} y`, p.y, r.y, 1e-11, 1e-15); eq(`${tag} se`, p.se, r.se); eq(`${tag} ci`, p.ci, r.ci, 1e-9, 1e-14); eq(`${tag} p`, p.p, r.p, 1e-8, 1e-15);
    eq(`${tag} Q`, p.Q, r.Q, 1e-9, 1e-12); eq(`${tag} I2`, p.I2, r.I2, 1e-9, 1e-12); eq(`${tag} weights`, p.weights, r.weights, 1e-9, 1e-14);
    if (s.groups) {
      for (const m of ['OR', 'RR', 'RD', 'Peto']) {
        const sg = subgroupsMH(s.counts, s.groups, m === 'Peto' ? { method: 'Peto' } : { measure: m }), r2 = s[`sub${m}`], t2 = `set ${j + 1} subgroups ${m}`;
        eq(`${t2} y`, sg.fits.map((f) => f.fit.y), r2.y, 1e-11, 1e-15); eq(`${t2} se`, sg.fits.map((f) => f.fit.se), r2.se); eq(`${t2} Q between`, sg.Q, r2.Q, 1e-9, 1e-12);
      }
    }
  });
  assert.equal(bad.length, 0, `${bad.length} mismatches:\n${bad.slice(0, 30).join('\n')}`);
  assert.ok(n >= 170, `only ${n} comparisons`);
});
