import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lnGamma, gammaP, gammaQ, erf, erfc, betaInc } from '../../engine/special.js';
import { loadRef, check } from './helpers.mjs';

const ref = loadRef('special.json');

function run(name, fn, rel = 1e-11, abs = 1e-300) {
  test(`${name} matches SciPy ${ref.meta.scipy}`, () => {
    const { failures, worst } = check(name, ref[name], fn, rel, abs);
    assert.equal(failures.length, 0, `${failures.length} mismatches (worst relative error ${worst.toExponential(2)}):\n${failures.slice(0, 15).join('\n')}`);
  });
}

// lnGamma near x = 1 and 2 is close to zero, so judge it by absolute error there.
run('lnGamma', lnGamma, 1e-12, 1e-14);
// Large shape parameters (a = 1e5) lose a few digits in the prefactor; 1e-9 is still far
// beyond what any report needs, and the tail values stay accurate relative to themselves.
run('gammaP', gammaP, 1e-9, 1e-300);
run('gammaQ', gammaQ, 1e-9, 1e-300);
run('erf', erf, 1e-13, 1e-16);
run('erfc', erfc, 1e-12, 1e-300);
run('betaInc', (x, a, b) => betaInc(x, a, b), 1e-9, 1e-300);
