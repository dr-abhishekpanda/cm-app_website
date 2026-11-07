"""Reference values for engine/epi.js from statsmodels: Koopman's score CI for the risk ratio,
Newcombe's hybrid score CI and the Wald CI for the risk difference; SciPy's conditional maximum-
likelihood odds ratio and its exact CI. Writes tests/ref/epi_py.json.
Run from apps-src/: python3 -I tools/refgen/epi_ref.py

The score limits are found by solving statsmodels' score statistic (test_proportions_2indep,
correction=False) for the ratio. statsmodels' closed-form interval is also stored: it agrees except
when every exposed person has the outcome, where its cubic picks the wrong root (for 10 of 10
against 5 of 10 it gives a lower limit of 1.333 although the statistic equals 1.96 squared at 1.269).
"""
import json
import math
from scipy.optimize import brentq
from scipy.stats.contingency import odds_ratio
from statsmodels.stats.proportion import confint_proportions_2indep, test_proportions_2indep

Z2 = 1.959963984540054 ** 2


def score_root(a, b, c, d):
    n1, n0 = a + b, c + d

    def g(l):
        r = test_proportions_2indep(a, n1, c, n0, value=math.exp(l), method="score", compare="ratio", correction=False)
        return float(r.statistic) ** 2 - Z2

    est = math.log((a / n1) / (c / n0)) if a > 0 and c > 0 else math.log(((a + 0.5) / (n1 + 1)) / ((c + 0.5) / (n0 + 1)))
    lo = 0.0 if a == 0 else math.exp(brentq(g, est - 30, est, xtol=1e-14, rtol=1e-14))
    hi = math.inf if c == 0 else math.exp(brentq(g, est, est + 30, xtol=1e-14, rtol=1e-14))
    return [lo, hi]

TABLES = [
    (13, 2163, 5, 3349), (40, 60, 20, 80), (30, 70, 10, 90), (10, 90, 30, 70), (12, 38, 6, 44),
    (60, 140, 30, 170), (3, 7, 1, 9), (0, 10, 5, 15), (6, 4, 0, 10), (10, 0, 5, 5), (2, 48, 9, 41),
    (1, 999, 0, 1000), (25, 0, 20, 5), (25, 15, 75, 85), (647, 622, 2, 27), (15, 35, 30, 20),
]


def ci(a, b, c, d, method, compare, **kw):
    lo, hi = confint_proportions_2indep(a, a + b, c, c + d, method=method, compare=compare, alpha=0.05, **kw)
    return [float(lo), float(hi)]


out = []
for a, b, c, d in TABLES:
    row = {"t": [[a, b], [c, d]]}
    row["rrScore"] = score_root(a, b, c, d)
    row["rrScoreClosedForm"] = ci(a, b, c, d, "score", "ratio", correction=False)
    row["rdNewcombe"] = ci(a, b, c, d, "newcomb", "diff")
    row["rdWald"] = ci(a, b, c, d, "wald", "diff")
    if (a + b) and (c + d) and (a + c) and (b + d):
        o = odds_ratio([[a, b], [c, d]], kind="conditional")
        lo, hi = o.confidence_interval(0.95)
        row["orCmle"] = float(o.statistic)
        row["orExact"] = [float(lo), float(hi)]
    out.append(row)

def clean(v):
    """JSON has no infinity: write it as the string 'inf', which tests/engine/helpers.mjs reads back."""
    if isinstance(v, float) and math.isinf(v):
        return "inf" if v > 0 else "-inf"
    if isinstance(v, list):
        return [clean(x) for x in v]
    if isinstance(v, dict):
        return {k: clean(x) for k, x in v.items()}
    return v


out = clean(out)
with open("tests/ref/epi_py.json", "w") as f:
    json.dump({"source": "statsmodels 0.15 confint_proportions_2indep and test_proportions_2indep", "two": out}, f, indent=1)
print("wrote tests/ref/epi_py.json")
for r in out:
    print(r["t"], r["rrScore"], r["rrScoreClosedForm"])
