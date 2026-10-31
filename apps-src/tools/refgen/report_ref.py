"""Reference values for engine/table1.js (Table 1).

Run from apps-src/:  python3 -I tools/refgen/report_ref.py
A simulated dataset with a three-level group (some missing), a normal and a skewed measurement,
a three-level category and a yes/no variable with missing values. Summaries from NumPy (quartiles
by R's types 6 and 7), tests from SciPy and pingouin, chosen by the same rules as the app.
"""
import json
import os

import numpy as np
import pandas as pd
import pingouin as pg
from scipy import stats as st

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "tests", "ref", "report.json")
rng = np.random.default_rng(1101)
n = 150
grp = rng.choice(["Rural", "Urban", "Tribal"], size=n, p=[0.45, 0.35, 0.2]).astype(object)
grp[rng.choice(n, 4, replace=False)] = ""
age = np.round(rng.normal(24, 4, n)).astype(float)
crp = np.round(rng.lognormal(1.2, 0.8, n), 2)
edu = rng.choice(["Primary", "Secondary", "Graduate"], size=n, p=[0.3, 0.5, 0.2]).astype(object)
anaemia = np.where(rng.uniform(size=n) < 0.55, "Yes", "No").astype(object)
anaemia[rng.choice(n, 6, replace=False)] = ""
df = pd.DataFrame({"Group": grp, "Age": age, "CRP": crp, "Education": edu, "Anaemia": anaemia})
csv = df.to_csv(index=False)
levels = list(dict.fromkeys([g for g in grp if g]))
keep = df[df.Group != ""]


def q(x, p, t):
    return float(np.quantile(x, p, method="weibull" if t == 6 else "linear"))


ref = {"csv": csv, "levels": levels, "n": int(len(keep)), "dropped": int((df.Group == "").sum())}
# Means and SDs by group, Welch's ANOVA (3 groups) and Welch's t (first two groups).
ref["age"] = [{"n": int(len(x)), "mean": float(x.mean()), "sd": float(x.std(ddof=1))} for x in (keep.Age.values, *[keep.Age[keep.Group == g].values for g in levels])]
wa = pg.welch_anova(data=keep, dv="Age", between="Group")
ref["ageWelchAnova"] = float(wa["p_unc" if "p_unc" in wa.columns else "p-unc"].iloc[0])
two = keep[keep.Group.isin(levels[:2])]
ref["ageWelchT"] = float(st.ttest_ind(two.Age[two.Group == levels[0]], two.Age[two.Group == levels[1]], equal_var=False).pvalue)
# Medians and quartiles (types 6 and 7), Kruskal-Wallis, Mann-Whitney as R chooses it.
for t in (6, 7):
    ref[f"crp{t}"] = [{"median": float(np.median(x)), "q1": q(x, 0.25, t), "q3": q(x, 0.75, t)} for x in (keep.CRP.values, *[keep.CRP[keep.Group == g].values for g in levels])]
ref["crpKW"] = float(st.kruskal(*[keep.CRP[keep.Group == g] for g in levels]).pvalue)
a, b = two.CRP[two.Group == levels[0]].values, two.CRP[two.Group == levels[1]].values
ties = len(np.unique(np.r_[a, b])) < len(a) + len(b)
exact = (not ties) and len(a) < 50 and len(b) < 50
ref["crpMW"] = float(st.mannwhitneyu(a, b, alternative="two-sided", method="exact" if exact else "asymptotic", use_continuity=True).pvalue)
ref["crpMWexact"] = bool(exact)
# Categories: counts, chi-square (3 x 3, no correction), Yates' chi-square (2 x 2 for yes/no in two groups).
tab = pd.crosstab(keep.Group, keep.Education).loc[levels, ["Primary", "Secondary", "Graduate"]]
ref["edu"] = tab.values.tolist()
chi = st.chi2_contingency(tab.values, correction=False)
ref["eduChi"] = float(chi.pvalue)
ref["eduMinExpected"] = float(chi.expected_freq.min())
an = keep[keep.Anaemia != ""]
ref["anaemiaYes"] = [int((an.Anaemia == "Yes").sum()), int(len(an))] + sum(([int(((an.Group == g) & (an.Anaemia == "Yes")).sum()), int((an.Group == g).sum())] for g in levels), [])
ref["anaemiaMissing"] = [int((keep.Anaemia == "").sum())] + [int(((keep.Group == g) & (keep.Anaemia == "")).sum()) for g in levels]
an2 = an[an.Group.isin(levels[:2])]
t2 = pd.crosstab(an2.Group, an2.Anaemia).loc[levels[:2], ["No", "Yes"]].values
ref["anaemiaYates"] = float(st.chi2_contingency(t2, correction=True).pvalue)
ref["anaemiaChi3"] = float(st.chi2_contingency(pd.crosstab(an.Group, an.Anaemia).loc[levels].values, correction=False).pvalue)
with open(OUT, "w") as fh:
    json.dump(ref, fh)
print("wrote", OUT, "levels", levels, "MW exact", exact, "min expected", ref["eduMinExpected"])
