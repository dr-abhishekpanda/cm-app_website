"""Reference values for engine/diag.js from Python: Koopman's score CI for the likelihood ratios (each
a ratio of two independent proportions; statsmodels' score statistic solved for the ratio, as in
epi_ref.py), SciPy's exact CI for the diagnostic odds ratio (R's fisher.test finds large upper
limits by uniroot on 1/OR at its default tolerance, a few per cent out), and scikit-learn's AUC. Reads tests/ref/diag_input.json.
Writes tests/ref/diag_py.json.   Run from apps-src/: python3 -I tools/refgen/diag_ref.py
"""
import json
import math
from scipy.optimize import brentq
from scipy.stats.contingency import odds_ratio
from sklearn.metrics import roc_auc_score
from statsmodels.stats.proportion import test_proportions_2indep

Z2 = 1.959963984540054 ** 2


def score_ratio(x1, n1, x2, n2):
    if x1 == 0 and x2 == 0:
        return [0.0, math.inf]

    def g(l):
        r = test_proportions_2indep(x1, n1, x2, n2, value=math.exp(l), method="score", compare="ratio", correction=False)
        return float(r.statistic) ** 2 - Z2

    est = math.log((x1 / n1) / (x2 / n2)) if x1 > 0 and x2 > 0 else math.log(((x1 + 0.5) / (n1 + 1)) / ((x2 + 0.5) / (n2 + 1)))
    lo = 0.0 if x1 == 0 else math.exp(brentq(g, est - 30, est, xtol=1e-14, rtol=1e-14))
    hi = math.inf if x2 == 0 else math.exp(brentq(g, est, est + 30, xtol=1e-14, rtol=1e-14))
    return [lo, hi]


def clean(v):
    if isinstance(v, float) and math.isinf(v):
        return "inf" if v > 0 else "-inf"
    if isinstance(v, list):
        return [clean(x) for x in v]
    if isinstance(v, dict):
        return {k: clean(x) for k, x in v.items()}
    return v


inp = json.load(open("tests/ref/diag_input.json"))
tables = []
for tp, fp, fn, tn in inp["tables"]:
    n1, n0 = tp + fn, fp + tn
    row = {"t": [tp, fp, fn, tn], "lrPosScore": score_ratio(tp, n1, fp, n0), "lrNegScore": score_ratio(fn, n1, tn, n0)}
    if min(tp + fp, fn + tn, n1, n0) > 0:
        lo, hi = odds_ratio([[tp, fp], [fn, tn]], kind="conditional").confidence_interval(0.95)
        row["dorExact"] = [float(lo), float(hi)]
    tables.append(row)
rocs = []
for s in inp["rocSets"]:
    x = s["x"] if s["direction"] == "<" else [-v for v in s["x"]]
    rocs.append({"name": s["name"], "auc": float(roc_auc_score(s["y"], x))})
with open("tests/ref/diag_py.json", "w") as f:
    json.dump({"source": "statsmodels 0.15 test_proportions_2indep; SciPy 1.18 odds_ratio; scikit-learn roc_auc_score", "tables": clean(tables), "rocs": rocs}, f, indent=1)
print("wrote tests/ref/diag_py.json")
for t in tables:
    print(t)
