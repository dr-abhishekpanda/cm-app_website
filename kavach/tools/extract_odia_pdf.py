import pymupdf, sys, re
sys.path.insert(0, sys.argv[3])
import akruti
akruti.CONS['\x01'] = 'ଞ୍ଚ'
from akruti import convert
GID_FIX = {98: '\x01', 110: 'n', 111: 'o'}
doc = pymupdf.open(sys.argv[1])
out = open(sys.argv[2], 'w')
def clean(t):
    t = t.replace('ଅା', 'ଆ')
    t = re.sub(r'(?<=\S) ା(?=\s|$)', '।', t)
    t = re.sub(r'(?<=\s)ା(?=\s|$)', '।', t)
    t = re.sub(r'^ା(?=\s|$)', '।', t)
    return t
for pno, page in enumerate(doc, start=1):
    out.write(f"\n===== PAGE {pno} =====\n")
    lines = []  # each: [dir, normal, [(ak, text)]]
    for tr in sorted(page.get_texttrace(), key=lambda t: t['seqno']):
        ak = 'Akruti' in tr['font']
        txt = ''
        for c in tr['chars']:
            u, gid = c[0], c[1]
            if ak and (u in (0xFFFD,) or u <= 0):
                txt += GID_FIX.get(gid, '?')
            else:
                txt += chr(u) if u > 0 else '?'
        if not txt.strip():
            # spaces still matter for word breaks
            if lines: lines[-1][2].append((ak, txt))
            continue
        d = tr['dir']
        ox, oy = tr['chars'][0][2]
        normal = -ox * d[1] + oy * d[0]
        along = ox * d[0] + oy * d[1]
        if lines and abs(lines[-1][0][0]-d[0]) < 1e-3 and abs(lines[-1][0][1]-d[1]) < 1e-3 and abs(lines[-1][1]-normal) < 3 and along >= lines[-1][3] - 2:
            lines[-1][2].append((ak, txt)); lines[-1][3] = along + 1
        else:
            lines.append([d, normal, [(ak, txt)], along + 1])
    for d, nrm, segs, _ in lines:
        merged = []
        for ak, t in segs:
            if merged and merged[-1][0] == ak:
                merged[-1][1] += t
            else:
                merged.append([ak, t])
        line = ''.join(convert(t) if ak else t for ak, t in merged).strip()
        line = clean(line)
        if line:
            out.write(line + '\n')
out.close()
