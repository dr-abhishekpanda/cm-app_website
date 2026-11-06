"""Executes each generated Python script in its own folder and evaluates the requested expressions.
Called by tests/codegen/run.mjs with the path of a manifest; prints one JSON line of results."""
import contextlib
import io
import json
import math
import os
import sys
import traceback
import warnings

warnings.filterwarnings("ignore")
manifest = json.load(open(sys.argv[1]))
out = []
start = os.getcwd()
for case in manifest:
    os.chdir(case["dir"])
    ns = {"__name__": "__main__"}
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            exec(compile(open("script.py").read(), "script.py", "exec"), ns)
        vals = []
        for e in case["exprs"]:
            v = eval(e, ns)
            v = float(v)
            vals.append(v if math.isfinite(v) else None)
        out.append({"values": vals})
    except Exception:
        out.append({"error": traceback.format_exc()})
    finally:
        os.chdir(start)
print(json.dumps(out))
