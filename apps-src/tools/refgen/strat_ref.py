"""Reference values for engine/strat.js from statsmodels' StratifiedTable: the Mantel-Haenszel odds
ratio and its standard error, the Cochran-Mantel-Haenszel test, and the Breslow-Day test with and
without Tarone's correction. Uses the strata written by strat_ref.R (run that first).
Writes tests/ref/strat_py.json.   Run from apps-src/: python3 -I tools/refgen/strat_ref.py
"""
import json
import math

import numpy as np
from statsmodels.stats.contingency_tables import StratifiedTable

with open("tests/ref/strat.json") as f:
    sets = json.load(f)["two"]

out = []
for s in sets:
    tables = [np.array(t, dtype=float) for t in s["strata"]]
    # statsmodels needs every stratum to have both rows and both columns.
    keep = [t for t in tables if t.sum(axis=1).min() > 0 and t.sum(axis=0).min() > 0]
    st = StratifiedTable(keep)
    null = st.test_null_odds(correction=True)
    null_u = st.test_null_odds(correction=False)
    bd = st.test_equal_odds(adjust=False)
    bdt = st.test_equal_odds(adjust=True)
    out.append({
        "strata": s["strata"],
        "kept": len(keep),
        "or": float(st.oddsratio_pooled),
        "logSe": float(st.logodds_pooled_se),
        "cmh": float(null.statistic), "pCmh": float(null.pvalue),
        "cmhUncorrected": float(null_u.statistic),
        "bd": float(bd.statistic), "pBd": float(bd.pvalue),
        "bdTarone": float(bdt.statistic), "pBdTarone": float(bdt.pvalue),
        "rr": float(st.riskratio_pooled),
    })

with open("tests/ref/strat_py.json", "w") as f:
    json.dump({"source": "statsmodels 0.15 StratifiedTable", "two": out}, f, indent=1)
print("wrote tests/ref/strat_py.json")
for r in out:
    print(r["kept"], round(r["or"], 6), round(r["bd"], 6), round(r["bdTarone"], 6), round(r["cmh"], 6), round(r["rr"], 6))
