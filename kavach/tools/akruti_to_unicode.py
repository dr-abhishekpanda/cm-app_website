# Akruti Ori Sarala (legacy glyph encoding) -> Unicode Odia converter.
# Built by aligning extracted glyph text against rendered pages of the Odisha MCP booklet V-2023-24.
import re, unicodedata

CONS = {  # base consonants / independent vowels / conjunct glyphs -> unicode
 'K':'କ','L':'ଖ','M':'ଗ','N':'ଘ','P':'ଚ','Q':'ଛ','R':'ଜ','S':'ଝ','U':'ଟ','V':'ଠ','W':'ଡ','X':'ଢ',
 'Y':'ଣ','Z':'ତ','[':'ଥ','\\':'ଦ',']':'ଧ','^':'ନ','_':'ପ','`':'ଫ','a':'ବ','b':'ଭ','c':'ମ','d':'ୟ',
 '~':'ଯ','e':'ର','f':'ଲ','k':'ଳ','g':'ଶ','h':'ଷ','i':'ସ','j':'ହ','l':'କ୍ଷ','q':'କ୍ତ','u':'ଙ୍କ',
 'w':'ଙ୍ଗ','y':'ଚ୍ଚ','z':'ଚ୍ଛ','m':'ଜ୍ଞ','«':'ନ୍ତ','ª':'ନ୍ତ୍ର','É':'ସ୍ତ','Ê':'ସ୍ୱ','Á':'ଷ୍ଟ','½':'ଶ୍ଚ',
 '¤':'ଧ୍ୟ','¡':'ଦ୍ଧ','¯':'ପ୍ତ','<':'ଣ୍ଟ','´':'ମ୍ବ','›':'ତ୍ସ','¦':'ନ୍ଦ','§':'ନ୍ଧ','Š':'ଣ୍ଡ','±':'ବ୍ଦ',
 '©':'ତ୍ତ','¸':'ମ୍ଭ','µ':'ମ୍ପ','‰':'ଣ୍ଣ','È':'ସ୍ତ୍ର','Ÿ':'ଦ୍ଦ','¬':'ଞ୍ଜ','Æ':'ସ୍ପ','Ä':'ସ୍କ','Ã':'ଷ୍କ',
 '‹':'ଣ୍ଢ','Ñ':'କ୍କ','²':'ବ୍ଧ','¹':'ମ୍ମ','*':'ଞ୍ଚ','·':'ଚା','n':'ଣ୍ଟ','o':'ତ୍ତ',
 '@':'ଅ','A':'ଇ','C':'ଉ','D':'ଊ','G':'ଏ','I':'ଓ','J':'ଔ',
}
SUBJ = {'â':'୍ର','ä':'୍ଲ','ß':'୍ୱ','ý':'୍ୟ','Ú':'୍ଥ','Ü':'୍ନ','à':'୍ମ','è':'୍ସ','ÿ':'଼','þ':'୍'}
MATRA_POST = {'û':'ା','ò':'ି','ô':'ି','ó':'ିଁ','ú':'ୀ','ê':'ୁ','ì':'ୂ','é':'ୃ'}
SIGNS = {'ñ':'ଁ','õ':'ଂ','ü':'ଃ','ö':'।'}
DIGITS = {str(i): chr(0x0B66+i) for i in range(10)}

def convert(s, odia_digits=True):
    out = []          # list of tokens; each cluster token is a dict
    i = 0
    n = len(s)
    pending_e = False # saw 'ù' and waiting for the cluster
    def last_cluster_index():
        # index in out of the last consonant-cluster token
        for k in range(len(out)-1, -1, -1):
            if isinstance(out[k], dict):
                return k
            if out[k] in (' ',):
                return None
        return None
    while i < n:
        ch = s[i]
        if ch == 'ù':
            pending_e = True; i += 1; continue
        if ch == 'I' and i+1 < n and s[i+1] == 'ß':
            tok = {'base': 'ୱ', 'subj': '', 'reph': False, 'pre': None, 'post': ''}
            if pending_e: tok['pre'] = 'େ'; pending_e = False
            out.append(tok); i += 2; continue
        if ch in SUBJ:
            k = last_cluster_index()
            if k is not None and not out[k]['post']:
                out[k]['subj'] += SUBJ[ch]; i += 1; continue
        if ch in CONS:
            tok = {'base': CONS[ch], 'subj': '', 'reph': False, 'pre': None, 'post': ''}
            i += 1
            # absorb subjoined marks / nukta / halant+consonant chains
            while i < n:
                c2 = s[i]
                if c2 in SUBJ:
                    tok['subj'] += SUBJ[c2]; i += 1
                    # explicit halant followed by consonant => continue cluster (e.g. Kþi = କ୍ସ)
                    if c2 == 'þ':
                        # explicit (visible) halant: keep it visible with ZWNJ when a consonant follows
                        if i < n and ((s[i] in CONS and s[i] not in '@ACDGIJ') or (s[i] == 'ù' and i+1 < n and s[i+1] in CONS)):
                            tok['subj'] += '\u200c'
                        break
                    continue
                break
            if pending_e:
                tok['pre'] = 'େ'; pending_e = False
            out.append(tok); continue
        if ch == 'ð':
            k = last_cluster_index()
            if k is not None: out[k]['reph'] = True
            i += 1; continue
        if ch == 'û':
            k = last_cluster_index()
            if k is not None and out[k].get('pre') == 'େ' and not out[k]['post']:
                out[k]['pre'] = 'ୋ'; i += 1; continue
        if ch == 'ø':
            k = last_cluster_index()
            if k is not None and out[k].get('pre') == 'େ':
                out[k]['pre'] = 'ୌ'
            i += 1; continue
        if ch == '÷':
            k = last_cluster_index()
            if k is not None and out[k].get('pre') == 'େ':
                out[k]['pre'] = 'ୈ'
            i += 1; continue
        if ch in MATRA_POST:
            k = last_cluster_index()
            if k is not None and out and isinstance(out[-1], dict):
                out[k]['post'] += MATRA_POST[ch]
            else:
                out.append(MATRA_POST[ch])
            i += 1; continue
        if ch in SIGNS:
            k = last_cluster_index()
            if ch != 'ö' and out and isinstance(out[-1], dict):
                out[-1]['post'] += SIGNS[ch]
            else:
                out.append(SIGNS[ch])
            i += 1; continue
        if ch in DIGITS:
            out.append(DIGITS[ch] if odia_digits else ch); i += 1; continue
        if pending_e:
            # stray e-matra glyph without a following consonant
            out.append('େ'); pending_e = False
        out.append(ch); i += 1
    # render
    res = []
    for t in out:
        if isinstance(t, dict):
            r = ('ର୍' if t['reph'] else '') + t['base'] + t['subj']
            pre = t['pre']
            post = t['post']
            if pre:
                # e/o/au/ai matra goes after cluster; keep any nasal sign after it
                r += pre + post
            else:
                r += post
            res.append(r)
        else:
            res.append(t)
    txt = ''.join(res)
    return unicodedata.normalize('NFC', txt)

if __name__ == '__main__':
    import sys
    for w in sys.argv[1:]:
        print(w, '->', convert(w))
