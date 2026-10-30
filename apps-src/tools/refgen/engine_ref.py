"""Reference values for the shared engine, computed with SciPy.

Run from apps-src/:  python3 tools/refgen/engine_ref.py
Writes tests/ref/special.json and tests/ref/dist.json. The engine tests compare
against these files, so regenerate them only when adding cases, never to make a
failing test pass.
"""
import json
import math
import os
import sys

import numpy as np
import scipy
from scipy import special as sp
from scipy import stats as st

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "tests", "ref")
os.makedirs(OUT, exist_ok=True)


def f(x):
    """JSON-safe float (inf and nan as strings)."""
    x = float(x)
    if math.isnan(x):
        return "nan"
    if math.isinf(x):
        return "inf" if x > 0 else "-inf"
    return x


meta = {"scipy": scipy.__version__, "numpy": np.__version__, "python": sys.version.split()[0]}

# ------------------------------------------------------------------ special
special = {"meta": meta, "lnGamma": [], "gammaP": [], "gammaQ": [], "erf": [], "erfc": [], "betaInc": []}
for x in [1e-8, 1e-5, 0.1, 0.5, 1, 1.5, 2, 2.5, 3.7, 10, 25.3, 100, 171.5, 1000, 1e5, 1e7, -0.5, -1.5, -2.3]:
    special["lnGamma"].append([x, f(sp.gammaln(x))])

for a in [0.5, 1, 2.5, 5, 10, 50, 100, 1000, 1e5]:
    for m in [0.01, 0.1, 0.5, 0.9, 1, 1.1, 2, 5, 10, 50]:
        x = a * m
        special["gammaP"].append([a, x, f(sp.gammainc(a, x))])
        special["gammaQ"].append([a, x, f(sp.gammaincc(a, x))])

for x in [-5, -3, -1, -0.5, -1e-3, 0, 1e-8, 0.1, 0.5, 1, 2, 3, 5, 10, 20, 26]:
    special["erf"].append([x, f(sp.erf(x))])
    special["erfc"].append([x, f(sp.erfc(x))])

for a in [0.5, 1, 2.5, 10, 100, 1e4]:
    for b in [0.5, 1, 2.5, 10, 100, 1e4]:
        for x in [0.001, 0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99, 0.999]:
            special["betaInc"].append([x, a, b, f(sp.betainc(a, b, x))])

with open(os.path.join(OUT, "special.json"), "w") as fh:
    json.dump(special, fh)

# --------------------------------------------------------------- distributions
dist = {"meta": meta}

zs = [-38, -10, -5, -3, -1.96, -1, 0, 0.5, 1.645, 1.96, 2.576, 3.29, 5, 8.2]
dist["normal"] = {
    "cdf": [[z, f(st.norm.cdf(z))] for z in zs],
    "sf": [[z, f(st.norm.sf(z))] for z in zs],
    "twoSided": [[z, f(2 * st.norm.sf(abs(z)))] for z in zs],
    "ppf": [[p, f(st.norm.ppf(p))] for p in [1e-300, 1e-100, 1e-20, 1e-10, 1e-5, 0.001, 0.025, 0.05, 0.1, 0.3, 0.5, 0.7, 0.9, 0.975, 0.999]],
    "isf": [[p, f(st.norm.isf(p))] for p in [1e-300, 1e-100, 1e-20, 1e-10, 1e-5, 0.001, 0.025, 0.05, 0.1, 0.3, 0.5]],
}

tdfs = [1, 2, 3, 5, 10, 18, 30, 100, 1000, 1e6]
txs = [-20, -4, -2.1, -1, 0, 0.5, 1.96, 2.1, 3.5, 10, 50]
dist["t"] = {
    "cdf": [[x, d, f(st.t.cdf(x, d))] for d in tdfs for x in txs],
    "sf": [[x, d, f(st.t.sf(x, d))] for d in tdfs for x in txs],
    "twoSided": [[x, d, f(2 * st.t.sf(abs(x), d))] for d in tdfs for x in txs],
    "ppf": [[p, d, f(st.t.ppf(p, d))] for d in tdfs for p in [1e-12, 1e-6, 0.001, 0.025, 0.05, 0.5, 0.95, 0.975, 0.995]],
    "isf": [[p, d, f(st.t.isf(p, d))] for d in tdfs for p in [1e-12, 1e-6, 0.001, 0.005, 0.025, 0.05]],
}

ks = [1, 2, 3, 5, 10, 30, 100, 1000]
cxs = [0.001, 0.1, 1, 3.841, 5, 10, 30, 100, 500]
dist["chi2"] = {
    "cdf": [[x, k, f(st.chi2.cdf(x, k))] for k in ks for x in cxs],
    "sf": [[x, k, f(st.chi2.sf(x, k))] for k in ks for x in cxs],
    "ppf": [[p, k, f(st.chi2.ppf(p, k))] for k in ks for p in [1e-10, 0.001, 0.05, 0.5, 0.95, 0.999]],
    "isf": [[p, k, f(st.chi2.isf(p, k))] for k in ks for p in [1e-15, 1e-8, 0.001, 0.01, 0.05]],
}

fds = [(1, 1), (1, 10), (2, 5), (3, 20), (5, 5), (10, 100), (30, 30), (100, 1000)]
fxs = [0.01, 0.5, 1, 2, 3.5, 10, 100]
dist["F"] = {
    "cdf": [[x, a, b, f(st.f.cdf(x, a, b))] for (a, b) in fds for x in fxs],
    "sf": [[x, a, b, f(st.f.sf(x, a, b))] for (a, b) in fds for x in fxs],
    "isf": [[p, a, b, f(st.f.isf(p, a, b))] for (a, b) in fds for p in [1e-10, 0.001, 0.01, 0.05, 0.5]],
    "ppf": [[p, a, b, f(st.f.ppf(p, a, b))] for (a, b) in fds for p in [0.001, 0.05, 0.5]],
}

bins = []
for n, p in [(10, 0.5), (20, 0.1), (100, 0.03), (1000, 0.4)]:
    for k in sorted(set([0, 1, 2, n // 10, n // 4, n // 2, n - 1, n])):
        bins.append([k, n, p, f(st.binom.pmf(k, n, p)), f(st.binom.cdf(k, n, p)), f(st.binom.sf(k, n, p))])
dist["binomial"] = bins

pois = []
for mu in [0.5, 3, 20, 150]:
    for k in sorted(set([0, 1, 2, int(mu), int(mu * 2), int(mu * 3) + 1])):
        pois.append([k, mu, f(st.poisson.pmf(k, mu)), f(st.poisson.cdf(k, mu)), f(st.poisson.sf(k, mu))])
dist["poisson"] = pois

# Quantiles in the far tails: SciPy's inverse functions are themselves approximate there
# (st.f.isf(1e-10, 1, 10) is off by 2e-8 relative), so solve sf(x) = p with mpmath at
# 40 digits instead. Normal quantiles use mpmath too, for the same reason.
import mpmath as mp

mp.mp.dps = 40


def mp_root(fun, guess):
    """Bracketed root (Illinois method) around a positive or negative starting guess."""
    g = mp.mpf(guess)
    if g == 0:
        lo, hi = mp.mpf(-1), mp.mpf(1)
    else:
        lo, hi = g / 2, g * 2
        if lo > hi:
            lo, hi = hi, lo
    for _ in range(400):
        if mp.sign(fun(lo)) != mp.sign(fun(hi)):
            break
        width = hi - lo
        lo, hi = lo - width, hi + width
        if g > 0 and lo <= 0:
            lo = g / mp.mpf(10) ** 6
    return f(mp.findroot(fun, (lo, hi), solver="illinois", tol=mp.mpf(10) ** -35, maxsteps=2000))


def t_sf(x, d):
    x, d = mp.mpf(x), mp.mpf(d)
    tail = mp.betainc(d / 2, mp.mpf(1) / 2, 0, d / (d + x * x), regularized=True) / 2
    return tail if x >= 0 else 1 - tail


def chi2_sf(x, k):
    return mp.gammainc(mp.mpf(k) / 2, mp.mpf(x) / 2, mp.inf, regularized=True)


def f_sf(x, a, b):
    a, b, x = mp.mpf(a), mp.mpf(b), mp.mpf(x)
    return mp.betainc(b / 2, a / 2, 0, b / (b + a * x), regularized=True)


def solve_upper(sf, p, guess):
    """x with sf(x) = p, on the log scale for small p."""
    p = mp.mpf(p)
    if p < mp.mpf("0.001"):
        return mp_root(lambda x: mp.log(sf(x)) - mp.log(p), guess)
    return mp_root(lambda x: sf(x) - p, guess)


def solve_lower(cdf, p, guess):
    p = mp.mpf(p)
    if p < mp.mpf("0.001"):
        return mp_root(lambda x: mp.log(cdf(x)) - mp.log(p), guess)
    return mp_root(lambda x: cdf(x) - p, guess)


def norm_sf(x):
    return mp.erfc(mp.mpf(x) / mp.sqrt(2)) / 2


def norm_isf(p):
    if p == 0.5:
        return 0.0
    if p > 0.5:
        return -norm_isf_exact(1 - mp.mpf(p))
    return norm_isf_exact(mp.mpf(p))


def norm_isf_exact(p):
    return solve_upper(norm_sf, p, st.norm.isf(float(p)))


dist["normal"]["ppf"] = [[p, -norm_isf(p) if p != 0.5 else 0.0] for p, _ in dist["normal"]["ppf"]]
dist["normal"]["isf"] = [[p, norm_isf(p)] for p, _ in dist["normal"]["isf"]]

dist["t"]["isf"] = [[p, d, solve_upper(lambda x, d=d: t_sf(x, d), p, st.t.isf(p, d))] for p, d, _ in dist["t"]["isf"]]
dist["t"]["ppf"] = [[p, d, (-solve_upper(lambda x, d=d: t_sf(x, d), p, st.t.isf(p, d)) if p < 0.5 else
                           (0.0 if p == 0.5 else solve_upper(lambda x, d=d: t_sf(x, d), 1 - p, st.t.isf(1 - p, d))))]
                    for p, d, _ in dist["t"]["ppf"]]
dist["chi2"]["isf"] = [[p, k, solve_upper(lambda x, k=k: chi2_sf(x, k), p, st.chi2.isf(p, k))] for p, k, _ in dist["chi2"]["isf"]]
def chi2_cdf(x, k):
    return mp.gammainc(mp.mpf(k) / 2, 0, mp.mpf(x) / 2, regularized=True)


def f_cdf(x, a, b):
    a, b, x = mp.mpf(a), mp.mpf(b), mp.mpf(x)
    return mp.betainc(a / 2, b / 2, 0, a * x / (a * x + b), regularized=True)


dist["chi2"]["ppf"] = [[p, k, solve_lower(lambda x, k=k: chi2_cdf(x, k), p, st.chi2.ppf(p, k))] for p, k, _ in dist["chi2"]["ppf"]]
dist["F"]["isf"] = [[p, a, b, solve_upper(lambda x, a=a, b=b: f_sf(x, a, b), p, st.f.isf(p, a, b))] for p, a, b, _ in dist["F"]["isf"]]
dist["F"]["ppf"] = [[p, a, b, solve_lower(lambda x, a=a, b=b: f_cdf(x, a, b), p, st.f.ppf(p, a, b))] for p, a, b, _ in dist["F"]["ppf"]]
dist["meta"]["quantiles"] = "mpmath %s at %d digits" % (mp.__version__, mp.mp.dps)

with open(os.path.join(OUT, "dist.json"), "w") as fh:
    json.dump(dist, fh)

print("wrote", os.path.relpath(OUT), "| scipy", scipy.__version__)
