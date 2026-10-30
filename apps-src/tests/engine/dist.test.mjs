import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normal, studentT, chiSquare, fDist, binomial, poisson } from '../../engine/dist.js';
import { loadRef, check, num, close } from './helpers.mjs';

const ref = loadRef('dist.json');
const TAG = `SciPy ${ref.meta.scipy}`;

function run(label, cases, fn, rel = 1e-10, abs = 1e-300) {
  test(`${label} matches ${TAG}`, () => {
    const { failures, worst } = check(label, cases, fn, rel, abs);
    assert.equal(failures.length, 0, `${failures.length} mismatches (worst relative error ${worst.toExponential(2)}):\n${failures.slice(0, 15).join('\n')}`);
  });
}

run('normal.cdf', ref.normal.cdf, normal.cdf, 1e-12);
run('normal.sf', ref.normal.sf, normal.sf, 1e-12);
run('normal.twoSided', ref.normal.twoSided, normal.twoSided, 1e-12);
run('normal.ppf', ref.normal.ppf, normal.ppf, 1e-13, 1e-15);
run('normal.isf', ref.normal.isf, normal.isf, 1e-13, 1e-15);

run('t.cdf', ref.t.cdf, studentT.cdf, 1e-9);
run('t.sf', ref.t.sf, studentT.sf, 1e-9);
run('t.twoSided', ref.t.twoSided, studentT.twoSided, 1e-9);
run('t.ppf', ref.t.ppf, studentT.ppf, 1e-9, 1e-12);
run('t.isf', ref.t.isf, studentT.isf, 1e-9, 1e-12);

run('chi2.cdf', ref.chi2.cdf, chiSquare.cdf, 1e-9);
run('chi2.sf', ref.chi2.sf, chiSquare.sf, 1e-9);
run('chi2.ppf', ref.chi2.ppf, chiSquare.ppf, 1e-9);
run('chi2.isf', ref.chi2.isf, chiSquare.isf, 1e-9);

run('F.cdf', ref.F.cdf, fDist.cdf, 1e-9);
run('F.sf', ref.F.sf, fDist.sf, 1e-9);
run('F.isf', ref.F.isf, fDist.isf, 1e-9);
run('F.ppf', ref.F.ppf, fDist.ppf, 1e-9);

test(`binomial pmf, cdf and sf match ${TAG}`, () => {
  const bad = [];
  for (const [k, n, p, pmf, cdf, sf] of ref.binomial) {
    if (!close(binomial.pmf(k, n, p), num(pmf), 1e-10)) bad.push(`pmf(${k},${n},${p}) = ${binomial.pmf(k, n, p)} want ${pmf}`);
    if (!close(binomial.cdf(k, n, p), num(cdf), 1e-10)) bad.push(`cdf(${k},${n},${p}) = ${binomial.cdf(k, n, p)} want ${cdf}`);
    if (!close(binomial.sf(k, n, p), num(sf), 1e-10)) bad.push(`sf(${k},${n},${p}) = ${binomial.sf(k, n, p)} want ${sf}`);
  }
  assert.equal(bad.length, 0, bad.slice(0, 15).join('\n'));
});

test(`Poisson pmf, cdf and sf match ${TAG}`, () => {
  const bad = [];
  for (const [k, mu, pmf, cdf, sf] of ref.poisson) {
    if (!close(poisson.pmf(k, mu), num(pmf), 1e-10)) bad.push(`pmf(${k},${mu}) = ${poisson.pmf(k, mu)} want ${pmf}`);
    if (!close(poisson.cdf(k, mu), num(cdf), 1e-10)) bad.push(`cdf(${k},${mu}) = ${poisson.cdf(k, mu)} want ${cdf}`);
    if (!close(poisson.sf(k, mu), num(sf), 1e-10)) bad.push(`sf(${k},${mu}) = ${poisson.sf(k, mu)} want ${sf}`);
  }
  assert.equal(bad.length, 0, bad.slice(0, 15).join('\n'));
});

test('the worked example in the plan: t = 2.1 with 18 df', () => {
  // Two-sided p from the t distribution, not the normal (the CM-EPI-BIO-APP bug).
  assert.ok(Math.abs(studentT.twoSided(2.1, 18) - 0.0500904) < 1e-7);
  assert.ok(Math.abs(normal.twoSided(2.1) - 0.0357288) < 1e-7);
});
