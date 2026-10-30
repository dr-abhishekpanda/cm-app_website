"""Reference values for engine/regression.js and engine/survival.js.

Run from apps-src/:  python3 -I tools/refgen/models_ref.py
statsmodels (OLS, Logit), scikit-learn (ROC AUC), lifelines (Kaplan-Meier, log-rank, Cox with
Efron ties). Hosmer-Lemeshow and DeLong's SE are written out here from their definitions.
"""
import json
import math
import os

import lifelines
import numpy as np
import sklearn
import statsmodels
import statsmodels.api as sm
from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.statistics import logrank_test, multivariate_logrank_test
from lifelines.utils import median_survival_times
from scipy import stats as st
from sklearn.metrics import roc_auc_score

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "tests", "ref", "models.json")
rng = np.random.default_rng(31102026)
ref = {"meta": {"statsmodels": statsmodels.__version__, "sklearn": sklearn.__version__, "lifelines": lifelines.__version__}}


def L(a):
    return [float(v) for v in np.asarray(a, float).ravel()]


# ------------------------------------------------------------------ OLS ---
ref["ols"] = []
for n, p in [(40, 2), (120, 4), (25, 1)]:
    X = rng.normal(0, 1, (n, p))
    X[:, 0] = X[:, 0] * 3 + 10
    y = 2 + X @ rng.normal(0, 1, p) + rng.normal(0, 1.5, n)
    Xd = sm.add_constant(X)
    f = sm.OLS(y, Xd).fit()
    ci = f.conf_int(0.05)
    infl = f.get_influence()
    ref["ols"].append({"X": [L(r) for r in Xd], "y": L(y), "beta": L(f.params), "se": L(f.bse), "p": L(f.pvalues),
                       "lo": L(ci[:, 0]), "hi": L(ci[:, 1]), "r2": float(f.rsquared), "adjR2": float(f.rsquared_adj),
                       "F": float(f.fvalue) if p > 0 else None, "pF": float(f.f_pvalue), "cooks": L(infl.cooks_distance[0][:5]),
                       "lev": L(infl.hat_matrix_diag[:5])})

# ------------------------------------------------------------- logistic ---
ref["logit"] = []
for n, p in [(200, 2), (150, 3), (80, 1)]:
    X = rng.normal(0, 1, (n, p))
    eta = -0.4 + X @ np.linspace(0.8, -0.5, p)
    y = (rng.uniform(0, 1, n) < 1 / (1 + np.exp(-eta))).astype(int)
    Xd = sm.add_constant(X)
    f = sm.Logit(y, Xd).fit(disp=0, tol=1e-12, maxiter=100)
    ci = np.exp(f.conf_int(0.05))
    mu = f.predict(Xd)
    # Hosmer-Lemeshow with breaks at the deciles of fitted risk (R's hoslem.test).
    br = np.unique(np.quantile(mu, np.linspace(0, 1, 11)))
    grp = np.clip(np.searchsorted(br, mu, side="left") - 1, 0, len(br) - 2)
    grp[mu == br[0]] = 0
    hl = 0.0
    for g in range(len(br) - 1):
        m = grp == g
        o1, e1, c = y[m].sum(), mu[m].sum(), m.sum()
        hl += (o1 - e1) ** 2 / e1 + ((c - o1) - (c - e1)) ** 2 / (c - e1)
    G = len(br) - 1
    # DeLong SE (definition with explicit placement values).
    pos, neg = mu[y == 1], mu[y == 0]
    psi = (pos[:, None] > neg[None, :]).astype(float) + 0.5 * (pos[:, None] == neg[None, :])
    v10, v01 = psi.mean(1), psi.mean(0)
    se = math.sqrt(v10.var(ddof=1) / len(pos) + v01.var(ddof=1) / len(neg))
    ref["logit"].append({"X": [L(r) for r in Xd], "y": [int(v) for v in y], "beta": L(f.params), "se": L(f.bse), "p": L(f.pvalues),
                         "orLo": L(ci[:, 0]), "orHi": L(ci[:, 1]), "ll": float(f.llf), "ll0": float(f.llnull), "lr": float(f.llr),
                         "pLR": float(f.llr_pvalue), "mcfadden": float(f.prsquared), "hl": hl, "hlDf": G - 2, "hlP": float(st.chi2.sf(hl, G - 2)),
                         "auc": float(roc_auc_score(y, mu)), "aucSE": se})

# -------------------------------------------------------------- survival ---
ref["km"] = []
for n, ties in [(30, False), (80, True), (12, True)]:
    t = rng.exponential(10, n)
    c = rng.exponential(15, n)
    time = np.minimum(t, c)
    if ties:
        time = np.ceil(time)
    event = (t <= c).astype(int)
    if ties:
        event[time == np.max(time)] = 0
    kmf = KaplanMeierFitter().fit(time, event)
    sf = kmf.survival_function_.iloc[:, 0]
    ci = kmf.confidence_interval_
    med_ci = median_survival_times(ci)
    ev_times = sorted(set(time[event == 1]))
    ref["km"].append({"time": L(time), "event": [int(v) for v in event], "t": [float(x) for x in ev_times],
                      "S": [float(sf.loc[x]) for x in ev_times], "lo": [float(ci.iloc[:, 0].loc[x]) for x in ev_times],
                      "hi": [float(ci.iloc[:, 1].loc[x]) for x in ev_times], "median": float(kmf.median_survival_time_),
                      "medianLo": float(med_ci.iloc[0, 0]), "medianHi": float(med_ci.iloc[0, 1])})
ref["logrank"] = []
for k, n in [(2, 60), (3, 90), (2, 25)]:
    g = np.repeat(np.arange(k), n // k)
    t = rng.exponential(10 * (1 + 0.4 * g))
    c = rng.exponential(25, len(g))
    time, event = np.ceil(np.minimum(t, c)), (t <= c).astype(int)
    if k == 2:
        r = logrank_test(time[g == 0], time[g == 1], event[g == 0], event[g == 1])
    else:
        r = multivariate_logrank_test(time, g, event)
    ref["logrank"].append({"time": L(time), "event": [int(v) for v in event], "group": [int(v) for v in g], "chi2": float(r.test_statistic), "p": float(r.p_value)})
ref["cox"] = []
for n, p, tied in [(100, 2, True), (60, 1, False), (150, 3, True)]:
    X = rng.normal(0, 1, (n, p))
    if p > 1:
        X[:, -1] = (X[:, -1] > 0).astype(float)
    t = rng.exponential(10 * np.exp(-(X @ np.linspace(0.6, -0.4, p))))
    c = rng.exponential(20, n)
    time, event = np.minimum(t, c), (t <= c).astype(int)
    if tied:
        time = np.ceil(time)
    import pandas as pd
    df = pd.DataFrame(X, columns=[f"x{j}" for j in range(p)])
    df["T"], df["E"] = time, event
    f = CoxPHFitter().fit(df, "T", "E", fit_options={"precision": 1e-13, "max_steps": 200})
    ref["cox"].append({"X": [L(r) for r in X], "time": L(time), "event": [int(v) for v in event], "beta": L(f.params_), "se": L(f.standard_errors_),
                       "p": L(f.summary["p"]), "ll": float(f.log_likelihood_), "c": float(f.concordance_index_)})
with open(OUT, "w") as fh:
    json.dump(ref, fh)
print("wrote", OUT)
