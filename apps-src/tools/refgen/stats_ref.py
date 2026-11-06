"""Reference values for the Phase 1 statistics engine.

Run from apps-src/:  python3 -I tools/refgen/stats_ref.py
Writes tests/ref/stats.json. Sources: SciPy, statsmodels, pingouin and scikit-posthocs; a few
values come from brute-force enumeration (exact Hodges-Lehmann intervals, exact R x C Fisher)
because no library computes them the same way. Regenerate only to add cases, never to make a
failing test pass.
"""
import itertools
import json
import math
import os
import sys

import mpmath
import numpy as np
import pandas as pd
import pingouin as pg
import scikit_posthocs as skp
import scipy
import scipy.stats as st
import statsmodels
from scipy.stats.contingency import association, odds_ratio
from statsmodels.stats.contingency_tables import Table, cochrans_q, mcnemar
from statsmodels.stats.multitest import multipletests
from statsmodels.stats.proportion import confint_proportions_2indep, proportion_confint, proportions_ztest

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "tests", "ref", "stats.json")


def f(x):
    x = float(x)
    if math.isnan(x):
        return "nan"
    if math.isinf(x):
        return "inf" if x > 0 else "-inf"
    return x


def arr(a):
    return [f(v) for v in np.asarray(a, dtype=float).ravel()]


rng = np.random.default_rng(20261031)
ref = {"meta": {"scipy": scipy.__version__, "statsmodels": statsmodels.__version__, "pingouin": pg.__version__,
                "scikit_posthocs": skp.__version__, "numpy": np.__version__, "python": sys.version.split()[0]}}

# ------------------------------------------------------------- noncentral ---
nc = {"nct": [], "ncx2": [], "ncf": []}
for t, df, d in [(2.0, 10, 1.0), (-1.5, 5, 0.5), (3.2, 30, 2.5), (0.5, 4, -1.0), (10, 20, 8), (1.96, 1000, 2.8),
                 (-3, 12, -2), (25, 60, 20), (2.1, 18, 0.0), (0.1, 2, 3), (4.5, 7, 6.5), (-0.7, 40, 0.3)]:
    nc["nct"].append([t, df, d, f(st.nct.cdf(t, df, d)) if d != 0 else f(st.t.cdf(t, df))])
for x, k, l in [(3.84, 1, 7.85), (10, 4, 2.0), (50, 10, 30), (0.5, 2, 0.1), (200, 20, 150), (3.84, 1, 0.01),
                (9.49, 4, 11.94), (1.0, 3, 25)]:
    nc["ncx2"].append([x, k, l, f(st.ncx2.cdf(x, k, l)), f(st.ncx2.sf(x, k, l))])
for x, d1, d2, l in [(3.35, 2, 27, 5), (2.0, 3, 60, 12), (4.0, 1, 10, 0.5), (1.5, 5, 100, 40), (2.76, 3, 76, 9.6)]:
    nc["ncf"].append([x, d1, d2, l, f(st.ncf.cdf(x, d1, d2, l)), f(st.ncf.sf(x, d1, d2, l))])
ref["noncentral"] = nc

# ------------------------------------------------------- studentized range ---
sr = {"cdf": [], "ppf": []}
for q, k, df in [(3.5, 3, 20), (4.2, 5, 30), (2.0, 2, 10), (5.5, 4, 12), (3.0, 10, 100), (6.0, 3, 5), (3.31, 3, 1000),
                 (1.0, 3, 60), (4.0, 6, 200)]:
    sr["cdf"].append([q, k, df, f(st.studentized_range.cdf(q, k, df))])
for p, k, df in [(0.95, 3, 20), (0.95, 4, 36), (0.99, 5, 60), (0.95, 2, 10), (0.9, 8, 120)]:
    sr["ppf"].append([p, k, df, f(st.studentized_range.ppf(p, k, df))])
ref["range"] = sr

# ---------------------------------------------------------------- describe ---
desc = []
sets = [rng.normal(12, 1.5, n) for n in (3, 4, 5, 8, 11, 12, 20, 50, 200, 1000)]
sets += [rng.lognormal(3, 0.6, 25), rng.uniform(0, 10, 30), np.round(rng.normal(0, 2, 40)), rng.exponential(2, 15)]
sets += [np.array([10.2, 11.5, 9.8, 12.1, 10.9, 11.0, 13.4, 9.5, 10.8, 11.7, 12.6, 10.1])]  # haemoglobin, g/dL
for x in sets:
    x = np.asarray(x, float)
    s = np.sort(x)
    row = {"x": arr(x), "mean": f(np.mean(x)), "sd": f(np.std(x, ddof=1)), "median": f(np.median(x)),
           "q1_6": f(np.quantile(x, 0.25, method="weibull")), "q3_6": f(np.quantile(x, 0.75, method="weibull")),
           "q1_7": f(np.quantile(x, 0.25)), "q3_7": f(np.quantile(x, 0.75))}
    if len(x) >= 4:
        row["skew"] = f(st.skew(x, bias=False))
        row["kurt"] = f(st.kurtosis(x, bias=False))
    sw = st.shapiro(x)
    row["swW"], row["swP"] = f(sw.statistic), f(sw.pvalue)
    if len(x) >= 6:
        ci = st.quantile_test(x, q=np.median(x), p=0.5).confidence_interval(0.95)
        row["ciMedian"] = [f(ci.low), f(ci.high)]
    if s[0] > 0:
        row["gmean"] = f(st.gmean(x))
    desc.append(row)
ref["describe"] = desc

# ----------------------------------------------------------------- compare ---


def nct_cdf_mp(t, df, d):
    """Noncentral t cdf by direct integration in mpmath (SciPy 1.18 returns NaN in places)."""
    mpmath.mp.dps = 30
    t, df, d = mpmath.mpf(t), mpmath.mpf(df), mpmath.mpf(d)
    k = df / 2
    lnc = -k * mpmath.log(2) - mpmath.loggamma(k)

    def integrand(u):
        return mpmath.ncdf(t * mpmath.sqrt(u / df) - d) * mpmath.exp(lnc + (k - 1) * mpmath.log(u) - u / 2)

    return float(mpmath.quad(integrand, [0, df / 4, df, 4 * df, mpmath.inf]))


def d_ci(t, df, k, conf=0.95):
    a = (1 - conf) / 2
    lo = scipy.optimize.brentq(lambda d: nct_cdf_mp(t, df, d) - (1 - a), t - 12, t + 12, xtol=1e-13)
    hi = scipy.optimize.brentq(lambda d: nct_cdf_mp(t, df, d) - a, t - 12, t + 12, xtol=1e-13)
    return [f(lo * k), f(hi * k)]


def hedges_j(df):
    return math.exp(math.lgamma(df / 2) - 0.5 * math.log(df / 2) - math.lgamma((df - 1) / 2))


comp = {"one": [], "paired": [], "two": [], "anova": [], "tukey": [], "gh": [], "rm": []}
for n, mu0 in [(8, 11), (25, 12), (60, 12.4)]:
    x = rng.normal(12, 1.6, n)
    r = st.ttest_1samp(x, mu0)
    ci = r.confidence_interval(0.95)
    comp["one"].append({"x": arr(x), "mu0": mu0, "t": f(r.statistic), "df": f(r.df), "p": f(r.pvalue),
                        "ci": [f(ci.low - mu0), f(ci.high - mu0)], "d": f((x.mean() - mu0) / x.std(ddof=1)),
                        "ciD": d_ci(r.statistic, n - 1, 1 / math.sqrt(n))})
for n in (6, 15, 40):
    x = rng.normal(100, 15, n)
    y = x + rng.normal(4, 8, n)
    r = st.ttest_rel(x, y)
    ci = r.confidence_interval(0.95)
    comp["paired"].append({"x": arr(x), "y": arr(y), "t": f(r.statistic), "df": f(r.df), "p": f(r.pvalue),
                           "ci": [f(ci.low), f(ci.high)], "ciD": d_ci(r.statistic, n - 1, 1 / math.sqrt(n))})
for n1, n2, m2, s2 in [(10, 12, 1.0, 1.0), (25, 18, 0.5, 2.0), (7, 30, -1.2, 0.6), (50, 50, 0.3, 1.1)]:
    x = rng.normal(0, 1, n1)
    y = rng.normal(m2, s2, n2)
    row = {"x": arr(x), "y": arr(y)}
    for eq in (True, False):
        r = st.ttest_ind(x, y, equal_var=eq)
        ci = r.confidence_interval(0.95)
        row["student" if eq else "welch"] = {"t": f(r.statistic), "df": f(r.df), "p": f(r.pvalue), "ci": [f(ci.low), f(ci.high)]}
    sp = math.sqrt(((n1 - 1) * x.var(ddof=1) + (n2 - 1) * y.var(ddof=1)) / (n1 + n2 - 2))
    d = (x.mean() - y.mean()) / sp
    tp = st.ttest_ind(x, y, equal_var=True).statistic
    row["d"] = f(d)
    row["ciD"] = d_ci(tp, n1 + n2 - 2, math.sqrt(1 / n1 + 1 / n2))
    row["g"] = f(d * hedges_j(n1 + n2 - 2))
    comp["two"].append(row)
for sizes, means, sds in [((8, 10, 9), (5, 6, 7.5), (1.2, 1.4, 1.1)), ((15, 15, 15, 15), (20, 21, 21.5, 24), (3, 3, 5, 4)),
                          ((5, 12, 7, 20, 9), (1, 1.4, 0.8, 2.0, 1.1), (0.5, 0.9, 0.4, 1.2, 0.7))]:
    groups = [rng.normal(m, s, n) for n, m, s in zip(sizes, means, sds)]
    fo = st.f_oneway(*groups)
    df = pd.DataFrame({"y": np.concatenate(groups), "g": np.repeat(np.arange(len(groups)), [len(g) for g in groups])})
    w = pg.welch_anova(data=df, dv="y", between="g")
    lev = st.levene(*groups, center="mean")
    bf = st.levene(*groups, center="median")
    comp["anova"].append({"groups": [arr(g) for g in groups], "F": f(fo.statistic), "p": f(fo.pvalue),
                          "welchF": f(w["F"].iloc[0]), "welchDf2": f(w["ddof2"].iloc[0]), "welchP": f(w["p_unc"].iloc[0] if "p_unc" in w else w["p-unc"].iloc[0]),
                          "leveneF": f(lev.statistic), "leveneP": f(lev.pvalue), "bfF": f(bf.statistic), "bfP": f(bf.pvalue)})
    th = st.tukey_hsd(*groups)
    ci = th.confidence_interval(0.95)
    pairs = []
    k = len(groups)
    for i in range(k):
        for j in range(i + 1, k):
            pairs.append([i, j, f(th.statistic[i, j]), f(th.pvalue[i, j]), f(ci.low[i, j]), f(ci.high[i, j])])
    comp["tukey"].append({"groups": [arr(g) for g in groups], "pairs": pairs})
    gh = pg.pairwise_gameshowell(data=df, dv="y", between="g")
    pcol = "pval" if "pval" in gh else "p-unc"
    comp["gh"].append({"groups": [arr(g) for g in groups],
                       "pairs": [[int(a), int(b), f(dd), f(sdf), f(pv)] for a, b, dd, sdf, pv in zip(gh["A"], gh["B"], gh["diff"], gh["df"], gh[pcol])]})
for n, k in [(10, 3), (14, 4), (8, 5)]:
    base = rng.normal(50, 8, n)[:, None]
    data = base + rng.normal(0, 4, (n, k)) + np.linspace(0, 3, k)[None, :] + rng.normal(0, 1, (n, k)) * np.arange(1, k + 1)
    long = pd.DataFrame({"y": data.ravel(), "s": np.repeat(np.arange(n), k), "c": np.tile(np.arange(k), n)})
    aov = pg.rm_anova(data=long, dv="y", within="c", subject="s", correction=True, detailed=True)
    row0 = aov.iloc[0]
    sph = pg.sphericity(data=long, dv="y", within="c", subject="s")
    comp["rm"].append({"data": [arr(r) for r in data], "F": f(row0["F"]), "p": f(row0["p_unc"] if "p_unc" in row0 else row0["p-unc"]),
                       "pGG": f(row0["p_GG_corr"] if "p_GG_corr" in row0 else row0["p-GG-corr"]), "epsGG": f(row0["eps"]),
                       "mauchlyW": f(sph.W), "mauchlyP": f(sph.pval)})
ref["compare"] = comp

# ---------------------------------------------------------------- nonparam ---


def u_null_counts(n1, n2):
    """Exact null distribution of U by enumerating every split (small samples only)."""
    N = n1 + n2
    counts = {}
    base = n1 * (n1 + 1) // 2
    for comb in itertools.combinations(range(1, N + 1), n1):
        u = sum(comb) - base
        counts[u] = counts.get(u, 0) + 1
    total = math.comb(N, n1)
    return [counts.get(u, 0) / total for u in range(n1 * n2 + 1)]


def v_null(n):
    counts = [0] * (n * (n + 1) // 2 + 1)
    for mask in range(1 << n):
        s = sum(i + 1 for i in range(n) if mask >> i & 1)
        counts[s] += 1
    return [c / (1 << n) for c in counts]


def qdisc(pmf, a):
    s = 0
    for i, p in enumerate(pmf):
        s += p
        if s >= a - 10 * np.finfo(float).eps:
            return i
    return len(pmf) - 1


npar = {"mw": [], "wx": [], "kw": [], "fr": []}
for n1, n2, ties in [(6, 7, False), (8, 5, False), (12, 15, True), (30, 25, True), (40, 45, False)]:
    x = rng.normal(0, 1, n1)
    y = rng.normal(0.7, 1, n2)
    if ties:
        x, y = np.round(x * 2), np.round(y * 2)
    row = {"x": arr(x), "y": arr(y)}
    meth = "exact" if not ties and n1 < 50 and n2 < 50 else "asymptotic"
    r = st.mannwhitneyu(x, y, method=meth, use_continuity=True)
    row.update({"U": f(r.statistic), "p": f(r.pvalue), "method": meth})
    diffs = np.sort(np.subtract.outer(x, y).ravel())
    row["hl"] = f(np.median(diffs))
    if meth == "exact" and n1 + n2 <= 16:
        pmf = u_null_counts(n1, n2)
        qu = max(1, qdisc(pmf, 0.025))
        ql = n1 * n2 - qu
        row["hlCi"] = [f(diffs[qu - 1]), f(diffs[ql])]
    npar["mw"].append(row)
for n, ties in [(9, False), (14, False), (25, True), (60, False)]:
    x = rng.normal(10, 2, n)
    y = x + rng.normal(0.8, 1.5, n)
    if ties:
        x, y = np.round(x), np.round(y)
    d = x - y
    nz = int((d != 0).sum())
    has_ties = len(np.unique(np.abs(d[d != 0]))) < nz
    meth = "exact" if (not has_ties and nz == n and n < 50) else "approx"
    r = st.wilcoxon(x, y, method=meth, correction=True, zero_method="wilcox")
    dn = d[d != 0]
    walsh = np.sort([(dn[i] + dn[j]) / 2 for i in range(len(dn)) for j in range(i, len(dn))])
    row = {"x": arr(x), "y": arr(y), "Vmin": f(r.statistic), "p": f(r.pvalue), "method": meth, "hl": f(np.median(walsh))}
    if meth == "exact" and n <= 14:
        pmf = v_null(n)
        qu = max(1, qdisc(pmf, 0.025))
        ql = n * (n + 1) // 2 - qu
        row["hlCi"] = [f(walsh[qu - 1]), f(walsh[ql])]
    npar["wx"].append(row)
for sizes, shifts in [((8, 9, 10), (0, 0.5, 1.2)), ((15, 12, 20, 9), (0, 0, 0.8, 1.5))]:
    groups = [np.round(rng.normal(s, 1, n) * 3) for n, s in zip(sizes, shifts)]
    r = st.kruskal(*groups)
    dunn = skp.posthoc_dunn([list(g) for g in groups], p_adjust="holm").to_numpy()
    k = len(groups)
    npar["kw"].append({"groups": [arr(g) for g in groups], "H": f(r.statistic), "p": f(r.pvalue),
                       "dunnHolm": [[i, j, f(dunn[i, j])] for i in range(k) for j in range(i + 1, k)]})
for n, k in [(12, 3), (20, 4)]:
    data = np.round(rng.normal(0, 1, (n, k)) + np.linspace(0, 1, k)[None, :], 1)
    r = st.friedmanchisquare(*[data[:, j] for j in range(k)])
    npar["fr"].append({"data": [arr(r_) for r_ in data], "chi2": f(r.statistic), "p": f(r.pvalue)})
ref["nonparam"] = npar

# ------------------------------------------------------------------ tables ---


def fisher_rxc_brute(t):
    t = np.asarray(t)
    rows, cols = t.sum(1), t.sum(0)
    N = t.sum()
    lf = [math.lgamma(i + 1) for i in range(N + 1)]
    const = sum(lf[r] for r in rows) + sum(lf[c] for c in cols) - lf[N]

    def lp(tab):
        return const - sum(lf[v] for v in np.ravel(tab))

    obs = lp(t)
    R, C = t.shape
    total = 0.0

    def rec(i, colleft, cells):
        nonlocal total
        if i == R - 1:
            tab = cells + [list(colleft)]
            v = lp(tab)
            if v <= obs + math.log1p(1e-7):
                total += math.exp(v)
            return
        for row in itertools.product(*[range(c + 1) for c in colleft]):
            if sum(row) != rows[i]:
                continue
            rec(i + 1, [c - v for c, v in zip(colleft, row)], cells + [list(row)])

    rec(0, list(cols), [])
    return total


tabs = {"chi": [], "fisher2": [], "fisherRxC": [], "mcnemar": [], "trend": [], "cochranQ": []}
for t in ([[12, 5], [7, 15]], [[30, 10, 5], [20, 25, 15]], [[3, 7, 2], [6, 2, 9], [4, 4, 4]], [[45, 55], [30, 70]],
          [[2, 8], [9, 1]]):
    t = np.array(t)
    c0 = st.chi2_contingency(t, correction=False)
    row = {"t": t.tolist(), "chi2": f(c0.statistic), "p": f(c0.pvalue), "df": int(c0.dof), "expected": arr(c0.expected_freq),
           "cramerV": f(association(t, method="cramer")),
           "G2": f(st.chi2_contingency(t, correction=False, lambda_="log-likelihood").statistic),
           "adjRes": arr(Table(t).standardized_resids)}
    if t.shape == (2, 2):
        c1 = st.chi2_contingency(t, correction=True)
        row["chi2Yates"], row["pYates"] = f(c1.statistic), f(c1.pvalue)
    tabs["chi"].append(row)
for t in ([[12, 5], [7, 15]], [[2, 8], [9, 1]], [[0, 10], [5, 5]], [[20, 380], [8, 392]], [[1, 0], [0, 1]], [[45, 55], [30, 70]]):
    t = np.array(t)
    p = st.fisher_exact(t).pvalue
    o = odds_ratio(t, kind="conditional")
    ci = o.confidence_interval(0.95)
    tabs["fisher2"].append({"t": t.tolist(), "p": f(p), "or": f(o.statistic), "ci": [f(ci.low), f(ci.high)]})
for t in ([[3, 1, 2], [1, 4, 0], [0, 2, 5]], [[2, 3], [5, 0], [1, 4]], [[4, 0, 1, 2], [1, 3, 2, 0]], [[3, 2, 1], [1, 2, 4]]):
    tabs["fisherRxC"].append({"t": t, "p": f(fisher_rxc_brute(t))})
for b, c in [(15, 5), (3, 9), (0, 4), (25, 22), (40, 18)]:
    tab = [[50, b], [c, 30]]
    tabs["mcnemar"].append({"b": b, "c": c, "pExact": f(mcnemar(tab, exact=True).pvalue),
                            "chi2": f(mcnemar(tab, exact=False, correction=True).statistic),
                            "p": f(mcnemar(tab, exact=False, correction=True).pvalue)})
for t in ([[10, 20, 30, 40], [40, 30, 20, 10]], [[5, 9, 14, 22], [45, 41, 36, 28]], [[8, 12, 10], [12, 8, 10], [10, 10, 10]]):
    t = np.array(t)
    r = Table(t).test_ordinal_association()
    tabs["trend"].append({"t": t.tolist(), "z": f(r.zscore), "p": f(r.pvalue)})
for n, k in [(20, 3), (30, 4)]:
    data = (rng.uniform(0, 1, (n, k)) < np.linspace(0.3, 0.7, k)[None, :]).astype(int)
    r = cochrans_q(data)
    tabs["cochranQ"].append({"data": data.tolist(), "Q": f(r.statistic), "p": f(r.pvalue)})
ref["tables"] = tabs

# --------------------------------------------------------------- correlate ---
cor = []
for n, rho, ties in [(10, 0.6, False), (30, 0.3, False), (25, -0.5, True), (80, 0.1, False), (45, 0.7, True)]:
    x = rng.normal(0, 1, n)
    y = rho * x + math.sqrt(1 - rho * rho) * rng.normal(0, 1, n)
    if ties:
        x, y = np.round(x * 2), np.round(y * 2)
    pr = st.pearsonr(x, y)
    pci = pr.confidence_interval(0.95)
    sp = st.spearmanr(x, y)
    meth = "exact" if (not ties and n <= 50) else "asymptotic"
    kt = st.kendalltau(x, y, method=meth)
    cor.append({"x": arr(x), "y": arr(y), "r": f(pr.statistic), "pR": f(pr.pvalue), "ciR": [f(pci.low), f(pci.high)],
                "rho": f(sp.statistic), "pRho": f(sp.pvalue), "tau": f(kt.statistic), "pTau": f(kt.pvalue), "tauMethod": meth})
ref["correlate"] = cor

# ------------------------------------------------------------- proportions ---
props = {"one": [], "two": []}
for x, n, p0 in [(7, 20, 0.5), (0, 15, 0.1), (15, 15, 0.8), (42, 120, 0.3), (3, 250, 0.02), (1, 1, 0.5)]:
    w = proportion_confint(x, n, method="wilson")
    cp = proportion_confint(x, n, method="beta")
    props["one"].append({"x": x, "n": n, "p0": p0, "wilson": [f(w[0]), f(w[1])], "cp": [f(cp[0]), f(cp[1])],
                         "pBinom": f(st.binomtest(x, n, p0).pvalue)})
for x1, n1, x2, n2 in [(15, 50, 8, 52), (56, 70, 48, 80), (5, 56, 0, 29), (9, 10, 3, 10), (120, 400, 95, 410)]:
    ci = confint_proportions_2indep(x1, n1, x2, n2, method="newcomb", compare="diff")
    z = proportions_ztest([x1, x2], [n1, n2])
    props["two"].append({"x1": x1, "n1": n1, "x2": x2, "n2": n2, "ci": [f(ci[0]), f(ci[1])], "z": f(z[0]), "p": f(z[1])})
ref["proportions"] = props

# ------------------------------------------------------------ multiplicity ---
mult = []
for pv in ([0.01, 0.04, 0.03, 0.005, 0.2], [0.001, 0.008, 0.039, 0.041, 0.042, 0.06, 0.074, 0.205, 0.212, 0.216],
           [0.5, 0.02, 0.9, 0.049]):
    row = {"p": pv}
    for key, m in [("bonferroni", "bonferroni"), ("holm", "holm"), ("hochberg", "simes-hochberg"), ("bh", "fdr_bh"), ("by", "fdr_by")]:
        row[key] = arr(multipletests(pv, method=m)[1])
    mult.append(row)
ref["multiplicity"] = mult

with open(OUT, "w") as fh:
    json.dump(ref, fh, indent=0)
print("wrote", OUT)
