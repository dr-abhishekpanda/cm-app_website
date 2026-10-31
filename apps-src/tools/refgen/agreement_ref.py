"""Reference values for engine/agreement.js and engine/meta.js.

Run from apps-src/:  python3 -I tools/refgen/agreement_ref.py
statsmodels (Cohen's and Fleiss' kappa, meta-analysis pooling and effect sizes), pingouin (ICC,
Cronbach's alpha); Bland-Altman, the I-squared interval, the prediction interval and Egger's test
are written out here from their published definitions.
"""
import json
import math
import os

import numpy as np
import pandas as pd
import pingouin as pg
import statsmodels.api as sm
from scipy import stats as st
from statsmodels.stats import meta_analysis as ma
from statsmodels.stats.inter_rater import cohens_kappa, fleiss_kappa

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "tests", "ref", "agreement.json")
rng = np.random.default_rng(1031)
ref = {}


def L(a):
    return [float(v) for v in np.asarray(a, float).ravel()]


ref["kappa"] = []
for t in ([[20, 5], [10, 15]], [[30, 6, 2], [5, 25, 7], [1, 4, 20]], [[12, 3, 1, 0], [4, 18, 5, 1], [0, 3, 14, 4], [0, 1, 2, 9]]):
    row = {"t": t}
    for wt, key in [(None, "none"), ("linear", "linear"), ("quadratic", "quadratic")]:
        if wt is not None and len(t) == 2:
            continue
        r = cohens_kappa(np.array(t), wt=wt)
        row[key] = {"kappa": float(r.kappa), "se": float(r.std_kappa), "se0": float(r.std_kappa0), "p": float(r.pvalue_two_sided)}
    ref["kappa"].append(row)
ref["fleiss"] = []
for N, k, n in [(20, 3, 4), (30, 4, 6)]:
    counts = np.array([rng.multinomial(n, rng.dirichlet(np.ones(k) * 0.7)) for _ in range(N)])
    ref["fleiss"].append({"counts": counts.tolist(), "kappa": float(fleiss_kappa(counts))})
ref["icc"] = []
for n, k in [(15, 3), (30, 4), (10, 2)]:
    truth = rng.normal(50, 10, n)
    data = truth[:, None] + rng.normal(0, 4, (n, k)) + rng.normal(0, 2, k)[None, :]
    long = pd.DataFrame({"y": data.ravel(), "s": np.repeat(np.arange(n), k), "r": np.tile(np.arange(k), n)})
    out = pg.intraclass_corr(data=long, targets="s", raters="r", ratings="y")
    ref["icc"].append({"data": [L(r) for r in data], "forms": [{"type": t, "icc": float(i), "F": float(F), "p": float(p), "lo": float(ci[0]), "hi": float(ci[1])}
                                                             for t, i, F, p, ci in zip(out["Type"], out["ICC"], out["F"], out["pval"] if "pval" in out else out["p-val"], out["CI95%"] if "CI95%" in out else out["CI95"])]})
ref["cronbach"] = []
for n, k in [(40, 5), (25, 8)]:
    latent = rng.normal(0, 1, n)
    data = np.round(3 + latent[:, None] * 0.8 + rng.normal(0, 0.8, (n, k)))
    a, ci = pg.cronbach_alpha(data=pd.DataFrame(data))
    ref["cronbach"].append({"data": [L(r) for r in data], "alpha": float(a), "ci": L(ci)})
ref["bland"] = []
for n in (30, 60):
    truth = rng.normal(120, 15, n)
    a, b = truth + rng.normal(0, 5, n), truth + 2 + rng.normal(0, 5, n)
    d = a - b
    bias, sd = d.mean(), d.std(ddof=1)
    t = st.t.isf(0.025, n - 1)
    ref["bland"].append({"a": L(a), "b": L(b), "bias": bias, "sd": sd, "loa": [bias - 1.959963984540054 * sd, bias + 1.959963984540054 * sd],
                         "ciBias": [bias - t * sd / math.sqrt(n), bias + t * sd / math.sqrt(n)], "seLoA": math.sqrt(3 * sd * sd / n)})

# Meta-analysis.
ref["meta"] = []
for k in (5, 8, 12):
    y = rng.normal(-0.3, 0.25, k)
    v = rng.uniform(0.01, 0.12, k)
    row = {"y": L(y), "v": L(v)}
    for m, key in [("dl", "DL"), ("pm", "PM")]:
        r = ma.combine_effects(y, v, method_re=m)
        sf = r.summary_frame()
        row[key] = {"fe": float(r.mean_effect_fe), "seFE": float(sf.loc["fixed effect", "sd_eff"]), "re": float(r.mean_effect_re),
                    "seRE": float(sf.loc["random effect", "sd_eff"]), "tau2": float(r.tau2), "Q": float(r.q), "I2": float(r.i2),
                    "seHKSJ": float(r.sd_eff_w_re_hksj)}
    # Prediction interval, I^2 interval and Egger by their definitions.
    w = 1 / v
    W = w.sum()
    fe = (w * y).sum() / W
    Q = (w * (y - fe) ** 2).sum()
    tau2 = max(0.0, (Q - (k - 1)) / (W - (w * w).sum() / W))
    wr = 1 / (v + tau2)
    re = (wr * y).sum() / wr.sum()
    s = math.sqrt(tau2 + 1 / wr.sum())
    tt = st.t.isf(0.025, k - 2)
    row["piDL"] = [re - tt * s, re + tt * s]
    df = k - 1
    se_lnH = 0.5 * (math.log(Q) - math.log(df)) / (math.sqrt(2 * Q) - math.sqrt(2 * k - 3)) if Q > k else math.sqrt(1 / (2 * (k - 2)) * (1 - 1 / (3 * (k - 2) ** 2)))
    H = math.sqrt(max(1.0, Q / df))
    lo, hi = max(1.0, math.exp(math.log(H) - 1.959963984540054 * se_lnH)), max(1.0, math.exp(math.log(H) + 1.959963984540054 * se_lnH))
    row["I2ci"] = [max(0.0, (lo * lo - 1) / (lo * lo)), max(0.0, (hi * hi - 1) / (hi * hi))]
    se = np.sqrt(v)
    eg = sm.OLS(y / se, sm.add_constant(1 / se)).fit()
    row["egger"] = {"intercept": float(eg.params[0]), "p": float(eg.pvalues[0])}
    ref["meta"].append(row)
ref["effects"] = []
for e1, n1, e2, n2 in [(12, 50, 20, 52), (0, 30, 5, 31), (45, 120, 30, 118)]:
    row = {"e1": e1, "n1": n1, "e2": e2, "n2": n2}
    for stat, key in [("odds-ratio", "OR"), ("rr", "RR"), ("diff", "RD")]:
        zc = 0.5 if (key != "RD" and min(e1, n1 - e1, e2, n2 - e2) == 0) else None
        eff, var = ma.effectsize_2proportions(np.array([e1]), np.array([n1]), np.array([e2]), np.array([n2]), statistic=stat,
                                              zero_correction=zc, zero_kwds={"method": "both"} if zc else None)
        row[key] = [float(np.asarray(eff).ravel()[0]), float(np.asarray(var).ravel()[0])]
    ref["effects"].append(row)
ref["smd"] = []
for m1, s1, n1, m2, s2, n2 in [(10.2, 1.4, 30, 9.6, 1.6, 32), (55, 12, 15, 61, 10, 14)]:
    g, var = ma.effectsize_smd(np.array([m1]), np.array([s1]), np.array([n1]), np.array([m2]), np.array([s2]), np.array([n2]))
    ref["smd"].append({"in": [m1, s1, n1, m2, s2, n2], "g": float(np.asarray(g).ravel()[0]), "v": float(np.asarray(var).ravel()[0])})

# --- Phase 1d additions (appended so the earlier cases keep their values) ---------------------------
from scipy import optimize as opt


def reml_tau2(y, v):
    """Maximise the restricted log-likelihood directly (an independent check of the score root)."""
    def nll(t2):
        w = 1 / (v + t2)
        mu = (w * y).sum() / w.sum()
        return 0.5 * (np.log(v + t2).sum() + math.log(w.sum()) + (w * (y - mu) ** 2).sum())
    hi = 10 * max(np.var(y, ddof=1), v.max())
    r = opt.minimize_scalar(nll, bounds=(0, hi), method="bounded", options={"xatol": 1e-13, "maxiter": 2000})
    return max(0.0, float(r.x)) if nll(0.0) > r.fun else 0.0


def qgen(y, v, t2):
    w = 1 / (v + t2)
    mu = (w * y).sum() / w.sum()
    return float((w * (y - mu) ** 2).sum())


def qprofile(y, v, conf=0.95):
    df = len(y) - 1
    a = (1 - conf) / 2
    out = []
    for target in (st.chi2.isf(a, df), st.chi2.ppf(a, df)):
        if qgen(y, v, 0.0) <= target:
            out.append(0.0)
            continue
        hi = 1.0
        while qgen(y, v, hi) > target:
            hi *= 2
        out.append(float(opt.brentq(lambda t: qgen(y, v, t) - target, 0, hi, xtol=1e-15, rtol=1e-14)))
    return out


def dl_pool(y, v):
    w = 1 / v
    W = w.sum()
    fe = (w * y).sum() / W
    Q = (w * (y - fe) ** 2).sum()
    k = len(y)
    tau2 = max(0.0, (Q - (k - 1)) / (W - (w * w).sum() / W)) if k > 1 else 0.0
    wr = 1 / (v + tau2)
    return {"fe": fe, "seFE": math.sqrt(1 / W), "re": (wr * y).sum() / wr.sum(), "seRE": math.sqrt(1 / wr.sum()), "tau2": tau2}


ref["reml"] = []
for k in (4, 7, 10, 15):
    v = rng.uniform(0.01, 0.1, k)
    y = rng.normal(-0.25, np.sqrt(0.06 + v))
    t2 = reml_tau2(y, v)
    wr = 1 / (v + t2)
    ref["reml"].append({"y": L(y), "v": L(v), "tau2": t2, "re": float((wr * y).sum() / wr.sum()), "seRE": math.sqrt(1 / wr.sum()),
                        "qprofile": qprofile(y, v)})
# Subgroups (DerSimonian-Laird within each subgroup; Q between subgroups on the random-effects estimates).
ref["subgroups"] = []
for sizes in ((3, 4), (2, 3, 4)):
    ys, vs, gs = [], [], []
    for g, kk in enumerate(sizes):
        v = rng.uniform(0.01, 0.1, kk)
        y = rng.normal(-0.4 + 0.25 * g, np.sqrt(0.03 + v))
        ys += list(y); vs += list(v); gs += [f"G{g + 1}"] * kk
    ys, vs = np.array(ys), np.array(vs)
    fits = [dl_pool(ys[[i for i, x in enumerate(gs) if x == g]], vs[[i for i, x in enumerate(gs) if x == g]]) for g in dict.fromkeys(gs)]
    est = np.array([f["re"] for f in fits]); se = np.array([f["seRE"] for f in fits])
    w = 1 / se ** 2
    mu = (w * est).sum() / w.sum()
    Qb = float((w * (est - mu) ** 2).sum())
    ref["subgroups"].append({"y": L(ys), "v": L(vs), "g": gs, "re": L(est), "Q": Qb, "p": float(st.chi2.sf(Qb, len(sizes) - 1))})
# Fleiss' kappa: the null standard error against simulation, category kappas, and a bootstrap CI.
def fleiss_parts(counts):
    counts = np.asarray(counts, float)
    N, k = counts.shape
    n = counts[0].sum()
    pj = counts.sum(0) / (N * n)
    Pi = ((counts ** 2).sum(1) - n) / (n * (n - 1))
    Pe = (pj ** 2).sum()
    return (Pi.mean() - Pe) / (1 - Pe), pj


N, n, pj_true = 100, 4, np.array([0.5, 0.3, 0.2])
sims = np.array([fleiss_parts(rng.multinomial(1, pj_true, size=(N, n)).sum(1))[0] for _ in range(20000)])
qj = 1 - pj_true
sPQ = (pj_true * qj).sum()
se_formula = math.sqrt(2 / (sPQ ** 2 * N * n * (n - 1)) * (sPQ ** 2 - (pj_true * qj * (qj - pj_true)).sum()))
ref["fleissNull"] = {"N": N, "n": n, "pj": L(pj_true), "mcSD": float(sims.std(ddof=1)), "seFormula": se_formula}
print("Fleiss null SE: formula", se_formula, "simulated", sims.std(ddof=1))
truth = rng.choice(3, size=60, p=[0.45, 0.35, 0.2])
ratings = np.where(rng.uniform(size=(60, 5)) < 0.7, truth[:, None], rng.choice(3, size=(60, 5)))
counts = np.stack([(ratings == j).sum(1) for j in range(3)], 1)
kap, pj = fleiss_parts(counts)
catk = [1 - (counts[:, j] * (n5 - counts[:, j])).sum() / (60 * n5 * (n5 - 1) * pj[j] * (1 - pj[j])) for j, n5 in [(j, 5) for j in range(3)]]
boots = []
for _ in range(20000):
    kb, _p = fleiss_parts(counts[rng.integers(0, 60, 60)])
    if np.isfinite(kb):
        boots.append(kb)
ref["fleissBoot"] = {"counts": counts.tolist(), "kappa": float(kap), "categories": [float(x) for x in catk],
                     "ci": [float(np.quantile(boots, 0.025)), float(np.quantile(boots, 0.975))]}
# Bland-Altman on percentage and ratio scales.
truth = rng.lognormal(math.log(12), 0.25, 40)
a, b = truth * rng.lognormal(0.02, 0.05, 40), truth * rng.lognormal(0, 0.05, 40)
ref["blandScale"] = []
for scale in ("percent", "ratio"):
    d = 100 * (a - b) / ((a + b) / 2) if scale == "percent" else np.log(a) - np.log(b)
    bias, sd = d.mean(), d.std(ddof=1)
    ref["blandScale"].append({"scale": scale, "a": L(a), "b": L(b), "bias": float(bias), "sd": float(sd),
                              "loa": [float(bias - 1.959963984540054 * sd), float(bias + 1.959963984540054 * sd)]})
with open(OUT, "w") as fh:
    json.dump(ref, fh)
print("wrote", OUT)
