/* ============================================================================
   core/01-i18n — languages, UI strings, numerals
   UI strings live in data/10-i18n-*.js as  key: { en:'…', or:'…' }.
   Content objects carry the same shape, so a new language (hi, sat, …) is
   added by giving each object one more property, or with K.i18n.patch().
   ============================================================================ */
K.i18n = {
  lang: 'or',
  langs: [
    { code: 'or', name: 'ଓଡ଼ିଆ', english: 'Odia', short: 'ଓଡ଼ିଆ', speech: 'or-IN' },
    { code: 'en', name: 'English', english: 'English', short: 'EN', speech: 'en-IN' },
  ],
  dict: {},
  odiaNum: false,
};
K.i18n.add = (obj) => { Object.keys(obj).forEach(k => { K.i18n.dict[k] = obj[k]; }); };
K.i18n.patch = (lang, obj) => { Object.keys(obj).forEach(k => { (K.i18n.dict[k] = K.i18n.dict[k] || {})[lang] = obj[k]; }); };
K.i18n.info = (code) => K.i18n.langs.find(l => l.code === (code || K.i18n.lang)) || K.i18n.langs[0];
K.i18n.isOr = () => K.i18n.lang === 'or';

const OD = '୦୧୨୩୪୫୬୭୮୯';
K.toOdiaDigits = s => String(s).replace(/[0-9]/g, d => OD[+d]);
K.toLatinDigits = s => String(s).replace(/[୦-୯]/g, d => String(OD.indexOf(d)));
/* numerals follow the setting: Odia digits only when Odia UI + setting on */
K.digits = s => (K.i18n.lang === 'or' && K.i18n.odiaNum) ? K.toOdiaDigits(s) : K.toLatinDigits(s);

/* K.keep('୧୨୩') marks a value that must not be digit-converted (examples, IDs) */
K.keep = s => ({ __keep: String(s) });
const KEEP_A = '⁣', KEEP_B = '⁤';
const fill = (s, vars) => {
  const kept = [];
  s = s.replace(/\{(\w+)\}/g, (m, k) => { const v = vars[k]; if (v == null) return m; if (typeof v === 'object' && v.__keep != null) { kept.push(v.__keep); return KEEP_A + (kept.length - 1) + KEEP_B; } return v; });
  return { s, kept };
};
const unkeep = (s, kept) => kept.length ? s.replace(new RegExp(KEEP_A + '([0-9୦-୯]+)' + KEEP_B, 'g'), (m, i) => kept[+K.toLatinDigits(i)]) : s;
K.t = (key, vars) => {
  const e = K.i18n.dict[key];
  let s = e == null ? key : (typeof e === 'string' ? e : (e[K.i18n.lang] != null ? e[K.i18n.lang] : (e.en != null ? e.en : key)));
  if (!vars) return K.digits(s);
  const f = fill(s, vars);
  return unkeep(K.digits(f.s), f.kept);
};
/* trusted dictionary strings that carry inline markup (<em>, <b>) */
K.tr = (key, vars) => K.raw(K.t(key, vars));
/* pick the current language from a bilingual object; plain strings pass through untouched */
K.L = (obj, vars) => {
  if (obj == null) return '';
  if (typeof obj === 'string' || typeof obj === 'number') return String(obj);
  let s = obj[K.i18n.lang] != null ? obj[K.i18n.lang] : (obj.en != null ? obj.en : '');
  if (!vars) return K.digits(s);
  const f = fill(s, vars);
  return unkeep(K.digits(f.s), f.kept);
};
/* is this content item available in the current language (for review badges)? */
K.hasLang = (obj) => obj && typeof obj === 'object' && obj[K.i18n.lang] != null;

/* numbers: fixed decimals, trimmed, localised digits */
K.n = (v, d = 1) => {
  if (v == null || v === '' || isNaN(v)) return '–';
  let s = (+v).toFixed(d);
  if (d > 0) s = s.replace(/\.?0+$/, '');
  return K.digits(s);
};
/* "3 days" / "1 day" — keys u.day / u.days etc. live in the UI dictionary */
K.plural = (n, unit) => K.t('u.' + unit + (Math.abs(n) === 1 ? '' : 's'), { n });
