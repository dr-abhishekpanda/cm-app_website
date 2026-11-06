"""Reference values for engine/samplesize.js.

Run from apps-src/:  python3 -I tools/refgen/samplesize_ref.py
statsmodels gives the t-test and ANOVA power solutions; the closed-form formulas are written out
again here from the published sources, independently of the JavaScript, with SciPy's normal
quantiles; noncentral F power for regression uses scipy.stats.ncf.
"""
import json
import math
import os

import scipy.stats as st
import statsmodels
from scipy.optimize import brentq
from statsmodels.stats.power import FTestAnovaPower, TTestIndPower, TTestPower

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "tests", "ref", "samplesize.json")
z = st.norm.ppf


def za(alpha, sides=2):
    return z(1 - alpha / sides)


ref = {"meta": {"statsmodels": statsmodels.__version__}}

# Estimation (Lwanga and Lemeshow): n0 = z^2 p q / d^2, then Cochran's finite population correction.
ref["estProp"] = []
for p, d, rel, conf, N in [(0.3, 0.05, False, 0.95, None), (0.1, 0.2, True, 0.95, None), (0.5, 0.05, False, 0.95, 2000),
                           (0.62, 0.03, False, 0.99, None), (0.05, 0.01, False, 0.9, 10000)]:
    zz = z(1 - (1 - conf) / 2)
    a = d * p if rel else d
    n0 = zz * zz * p * (1 - p) / a ** 2
    n = n0 / (1 + (n0 - 1) / N) if N else n0
    ref["estProp"].append({"p": p, "d": d, "relative": rel, "conf": conf, "N": N, "n0": n0, "n": n})
ref["estMean"] = []
for sd, d, conf in [(25, 5, 0.95), (1.3, 0.2, 0.95), (12, 1.5, 0.99)]:
    zz = z(1 - (1 - conf) / 2)
    ref["estMean"].append({"sd": sd, "d": d, "conf": conf, "n": zz * zz * sd * sd / d ** 2})

# Buderer (1996).
ref["sensSpec"] = []
for se, sp, prev, d in [(0.9, 0.85, 0.2, 0.05), (0.8, 0.95, 0.1, 0.07), (0.95, 0.9, 0.5, 0.05)]:
    zz = z(0.975)
    ref["sensSpec"].append({"se": se, "sp": sp, "prev": prev, "d": d, "nSe": zz * zz * se * (1 - se) / (d * d * prev),
                            "nSp": zz * zz * sp * (1 - sp) / (d * d * (1 - prev))})

# Fleiss, Levin and Paik (2003), unequal allocation r = n2/n1, with and without continuity correction.
ref["twoProps"] = []
for p1, p2, alpha, power, sides, r in [(0.35, 0.2, 0.05, 0.8, 2, 1), (0.3, 0.4, 0.05, 0.9, 2, 1), (0.1, 0.05, 0.05, 0.8, 2, 2),
                                       (0.6, 0.45, 0.01, 0.8, 2, 0.5), (0.25, 0.15, 0.05, 0.8, 1, 1)]:
    a, b = za(alpha, sides), z(power)
    pb = (p1 + r * p2) / (1 + r)
    d = abs(p1 - p2)
    n1 = (a * math.sqrt((r + 1) * pb * (1 - pb)) + b * math.sqrt(r * p1 * (1 - p1) + p2 * (1 - p2))) ** 2 / (r * d * d)
    n1cc = n1 / 4 * (1 + math.sqrt(1 + 2 * (r + 1) / (n1 * r * d))) ** 2
    ref["twoProps"].append({"p1": p1, "p2": p2, "alpha": alpha, "power": power, "sides": sides, "ratio": r, "n1": n1, "n1cc": n1cc})

# Case-control from p0 (exposure in controls) and OR.
ref["caseControl"] = []
for p0, OR, r in [(0.2, 2.0, 1), (0.3, 1.5, 2), (0.05, 3.0, 4)]:
    p1 = OR * p0 / (1 + p0 * (OR - 1))
    a, b = za(0.05), z(0.8)
    pb = (p1 + r * p0) / (1 + r)
    d = abs(p1 - p0)
    n1 = (a * math.sqrt((r + 1) * pb * (1 - pb)) + b * math.sqrt(r * p1 * (1 - p1) + p0 * (1 - p0))) ** 2 / (r * d * d)
    ref["caseControl"].append({"p0": p0, "or": OR, "ratio": r, "p1": p1, "n1": n1})

# t-tests by statsmodels (continuous n, exact noncentral t).
ref["twoMeansT"] = []
for es, alpha, power, ratio, alt in [(0.5, 0.05, 0.8, 1, "two-sided"), (0.3, 0.05, 0.9, 1, "two-sided"), (0.8, 0.01, 0.8, 2, "two-sided"),
                                     (0.5, 0.05, 0.8, 1, "larger"), (1.2, 0.05, 0.95, 1, "two-sided")]:
    n1 = TTestIndPower().solve_power(effect_size=es, alpha=alpha, power=power, ratio=ratio, alternative=alt)
    pw = TTestIndPower().power(effect_size=es, nobs1=30, alpha=alpha, ratio=ratio, alternative=alt)
    ref["twoMeansT"].append({"es": es, "alpha": alpha, "power": power, "ratio": ratio, "sides": 2 if alt == "two-sided" else 1, "n1": n1, "power30": pw})
ref["oneMeanT"] = []
for es, alpha, power, alt in [(0.5, 0.05, 0.8, "two-sided"), (0.25, 0.05, 0.9, "two-sided"), (1.0, 0.01, 0.8, "two-sided"), (0.4, 0.05, 0.8, "larger")]:
    n = TTestPower().solve_power(effect_size=es, alpha=alpha, power=power, alternative=alt)
    pw = TTestPower().power(effect_size=es, nobs=20, alpha=alpha, alternative=alt)
    ref["oneMeanT"].append({"es": es, "alpha": alpha, "power": power, "sides": 2 if alt == "two-sided" else 1, "n": n, "power20": pw})
ref["anova"] = []
for f, k, alpha, power in [(0.25, 3, 0.05, 0.8), (0.4, 4, 0.05, 0.9), (0.1, 5, 0.05, 0.8), (0.25, 2, 0.01, 0.8)]:
    total = FTestAnovaPower().solve_power(effect_size=f, k_groups=k, alpha=alpha, power=power)
    pw = FTestAnovaPower().power(effect_size=f, nobs=60, k_groups=k, alpha=alpha)
    ref["anova"].append({"f": f, "k": k, "alpha": alpha, "power": power, "total": total, "power60": pw})

# Multiple regression: noncentral F with lambda = f^2 N, solved here with scipy.stats.ncf.
ref["regression"] = []
for r2, pr, alpha, power in [(0.1, 3, 0.05, 0.8), (0.2, 5, 0.05, 0.9), (0.05, 1, 0.05, 0.8)]:
    f2 = r2 / (1 - r2)

    def pw(N):
        d1, d2 = pr, N - pr - 1
        return st.ncf.sf(st.f.isf(alpha, d1, d2), d1, d2, f2 * N)

    N = brentq(lambda N: pw(N) - power, pr + 2.5, 10000, xtol=1e-9)
    ref["regression"].append({"r2": r2, "predictors": pr, "alpha": alpha, "power": power, "N": N})

# Connor (1987), Fisher z correlation, Schoenfeld (1983), non-inferiority.
ref["paired"] = [{"p10": p10, "p01": p01, "n": (za(0.05) * math.sqrt(p10 + p01) + z(0.8) * math.sqrt(p10 + p01 - (p10 - p01) ** 2)) ** 2 / (p10 - p01) ** 2}
                 for p10, p01 in [(0.2, 0.1), (0.15, 0.05), (0.3, 0.25)]]
ref["corr"] = [{"r": r, "n": ((za(0.05) + z(0.8)) / math.atanh(r)) ** 2 + 3, "power50": st.norm.cdf(math.atanh(r) * math.sqrt(47) - za(0.05))}
               for r in (0.3, 0.5, 0.1)]
ref["survival"] = [{"hr": hr, "ratio": rt, "events": (za(0.05) + z(0.8)) ** 2 / ((1 / (1 + rt)) * (rt / (1 + rt)) * math.log(hr) ** 2)}
                   for hr, rt in [(0.7, 1), (0.5, 2), (1.5, 1)]]
ref["niProps"] = [{"pT": pT, "pC": pC, "margin": m, "nC": (z(0.975) + z(0.8)) ** 2 * (pT * (1 - pT) + pC * (1 - pC)) / (pT - pC + m) ** 2}
                  for pT, pC, m in [(0.85, 0.85, 0.1), (0.7, 0.72, 0.1), (0.9, 0.88, 0.05)]]
ref["niMeans"] = [{"sd": sd, "diff": dd, "margin": m, "nC": 2 * sd * sd * (z(0.975) + z(0.8)) ** 2 / (dd + m) ** 2}
                  for sd, dd, m in [(10, 0, 4), (1.5, 0.2, 0.5)]]
with open(OUT, "w") as fh:
    json.dump(ref, fh, indent=0)
print("wrote", OUT)
