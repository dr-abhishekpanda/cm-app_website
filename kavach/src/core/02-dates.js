/* ============================================================================
   core/02-dates — calendar maths on plain ISO dates (YYYY-MM-DD, local)
   No times are stored for clinical dates; all differences use UTC midnights
   so daylight-saving or timezone quirks can never shift a day.
   ============================================================================ */
K.d = (() => {
  const MS = 86400000;
  const pad = n => String(n).padStart(2, '0');
  const parse = s => { if (!s) return null; if (s instanceof Date) return new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s)); if (!m) return null; return new Date(+m[1], +m[2] - 1, +m[3]); };
  const iso = d => { if (!d) return ''; d = parse(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const utc = s => { const d = parse(s); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
  const today = () => iso(new Date());
  const valid = s => !!parse(s) && !isNaN(parse(s).getTime());
  const diff = (a, b) => Math.round((utc(b) - utc(a)) / MS); /* b − a in days */
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const addMonths = (s, n) => { const d = parse(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d); };
  const add = (s, o) => { let r = s; if (o.y) r = addMonths(r, o.y * 12); if (o.m) r = addMonths(r, o.m); if (o.w) r = addDays(r, o.w * 7); if (o.d) r = addDays(r, o.d); return r; };
  /* completed calendar months between dates */
  const months = (a, b) => { const x = parse(a), y = parse(b); let m = (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth()); if (y.getDate() < x.getDate()) m--; return m; };
  const age = (dob, on) => { on = on || today(); const days = diff(dob, on); const tm = months(dob, on); const y = Math.floor(tm / 12), m = tm % 12;
    const anchor = addMonths(dob, tm); const d = diff(anchor, on); return { days, weeks: Math.floor(days / 7), months: tm, y, m, d }; };
  const cmp = (a, b) => utc(a) - utc(b);
  const min = (...a) => a.filter(Boolean).sort(cmp)[0];
  const max = (...a) => a.filter(Boolean).sort(cmp).pop();

  const MONTHS = {
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    or: ['ଜାନୁଆରୀ','ଫେବୃଆରୀ','ମାର୍ଚ୍ଚ','ଅପ୍ରେଲ','ମଇ','ଜୁନ୍','ଜୁଲାଇ','ଅଗଷ୍ଟ','ସେପ୍ଟେମ୍ବର','ଅକ୍ଟୋବର','ନଭେମ୍ବର','ଡିସେମ୍ବର'],
  };
  const WD = {
    en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    or: ['ରବିବାର','ସୋମବାର','ମଙ୍ଗଳବାର','ବୁଧବାର','ଗୁରୁବାର','ଶୁକ୍ରବାର','ଶନିବାର'],
  };
  const L = () => (MONTHS[K.i18n.lang] ? K.i18n.lang : 'en');
  /* fmt: 'long' 12 March 2026 · 'short' 12 Mar 2026 · 'dm' 12 Mar · 'num' 12/03/2026 · 'tbl' 12/03/26 · 'my' March 2026 */
  const fmt = (s, style = 'short') => {
    if (!s || !valid(s)) return '–';
    const d = parse(s), lg = L(), mn = MONTHS[lg][d.getMonth()];
    const short = lg === 'en' ? mn.slice(0, 3) : mn;
    let out;
    if (style === 'num') out = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    else if (style === 'tbl') out = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
    else if (style === 'dm') out = `${d.getDate()} ${short}`;
    else if (style === 'my') out = `${mn} ${d.getFullYear()}`;
    else if (style === 'long') out = `${d.getDate()} ${mn} ${d.getFullYear()}`;
    else out = `${d.getDate()} ${short} ${d.getFullYear()}`;
    return K.digits(out);
  };
  const weekday = s => WD[L()][parse(s).getDay()];
  const monthName = i => MONTHS[L()][i];

  /* relative: today / tomorrow / in 5 days / 3 weeks ago … */
  const rel = (s, base) => {
    base = base || today(); const n = diff(base, s); const a = Math.abs(n);
    if (n === 0) return K.t('rel.today');
    if (n === 1) return K.t('rel.tomorrow');
    if (n === -1) return K.t('rel.yesterday');
    let q, unit;
    if (a < 14) { q = a; unit = 'day'; } else if (a < 63) { q = Math.round(a / 7); unit = 'week'; } else if (a < 730) { q = Math.round(a / 30.4375); unit = 'month'; } else { q = Math.round(a / 365.25); unit = 'year'; }
    return K.t(n > 0 ? 'rel.in' : 'rel.ago', { x: K.plural(q, unit) });
  };
  /* human age: 2 years 3 months · 7 months 12 days · 18 days */
  const ageText = (dob, on, opts = {}) => {
    if (!dob) return '–'; const a = age(dob, on);
    if (a.days < 0) return '–';
    if (a.days < 60 && !opts.noWeeks) { return a.days < 14 ? K.plural(a.days, 'day') : `${K.plural(a.weeks, 'week')}${a.days % 7 ? ' ' + K.plural(a.days % 7, 'day') : ''}`; }
    if (a.y < 1) return `${K.plural(a.m, 'month')}${a.d && opts.days !== false ? ' ' + K.plural(a.d, 'day') : ''}`;
    return `${K.plural(a.y, 'year')}${a.m ? ' ' + K.plural(a.m, 'month') : ''}`;
  };
  return { parse, iso, today, valid, diff, add, addDays, addMonths, months, age, ageText, cmp, min, max, fmt, rel, weekday, monthName, MONTHS, WD };
})();
