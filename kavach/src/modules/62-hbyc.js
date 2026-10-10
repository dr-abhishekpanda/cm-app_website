/* ============================================================================
   modules/62-hbyc — Home Based Care for Young Child: ASHA home visits at
   3, 6, 9, 12 and 15 months (Odisha MCP card V-2023-24 p.7 and p.10; HBYC
   guidelines, MoHFW/MWCD 2018). Checklist rows apply to the visit months
   marked on the card; vaccine, Vitamin A and weight rows are pre-filled
   from the child's record and can be changed.
   Stored as k.hbyc = [{ id, m, date, ans: { item: 0|1 }, notes }]
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'hbyc.title': { en: 'Home visits (HBYC)', or: 'ଗୃହ ପରିଦର୍ଶନ (HBYC)' },
  'hbyc.lede': { en: 'The ASHA visits at 3, 6, 9, 12 and 15 months to check growth, feeding, development and vaccines.', or: 'ଆଶା ଦିଦି ୩, ୬, ୯, ୧୨ ଓ ୧୫ ମାସରେ ଘରକୁ ଆସି ଶିଶୁର ବୃଦ୍ଧି, ଖାଦ୍ୟ, ବିକାଶ ଓ ଟୀକା ଯାଞ୍ଚ କରିବେ।' },
  'hbyc.visit': { en: '{m}-month visit', or: '{m} ମାସ ପରିଦର୍ଶନ' },
  'hbyc.verify': { en: 'ASHA checks', or: 'ଆଶାଙ୍କ ଦ୍ୱାରା ଯାଞ୍ଚ କରାଯିବ' },
  'hbyc.serve': { en: 'ASHA gives', or: 'ଆଶାଙ୍କ ଦ୍ୱାରା ସେବା ପ୍ରଦାନ କରାଯିବ' },
  'hbyc.date': { en: 'Date of visit', or: 'ପରିଦର୍ଶନ ତାରିଖ' },
  'hbyc.notes': { en: 'Notes / referral', or: 'ଟିପ୍ପଣୀ / ପ୍ରେରଣ' },
  'hbyc.save': { en: 'Save visit', or: 'ପରିଦର୍ଶନ ସେଭ୍ କରନ୍ତୁ' },
  'hbyc.auto': { en: 'from the record', or: 'ରେକର୍ଡରୁ' },
  'hbyc.done': { en: '{n} of {t} visits done', or: '{t}ଟି ମଧ୍ୟରୁ {n}ଟି ପରିଦର୍ଶନ ହୋଇଛି' },
  'hbyc.vaxOk': { en: 'Vaccines up to date', or: 'ସମସ୍ତ ଟୀକା ସମୟରେ ଦିଆଯାଇଛି' },
  'hbyc.vaxOver': { en: 'Overdue: {x}', or: 'ବିଳମ୍ବ: {x}' },
  'hbyc.flagSick': { en: 'Child is sick — check danger signs and refer if needed.', or: 'ଶିଶୁ ଅସୁସ୍ଥ — ବିପଦ ଲକ୍ଷଣ ଯାଞ୍ଚ କରି ଆବଶ୍ୟକ ହେଲେ ପଠାନ୍ତୁ।' },
  'hbyc.tile': { en: 'Home visits', or: 'ଗୃହ ପରିଦର୍ଶନ' },
  'hbyc.deleteQ': { en: 'Delete this visit record?', or: 'ଏହି ପରିଦର୍ଶନ ବିବରଣୀ ବିଲୋପ କରିବେ?' },
  'hbyc.over': { en: 'HBYC visits are for children aged 3 to 15 months.', or: 'HBYC ପରିଦର୍ଶନ ୩ ରୁ ୧୫ ମାସ ବୟସର ଶିଶୁଙ୍କ ପାଇଁ।' },
});

K.hbyc = {};
K.hbyc.MONTHS = [3, 6, 9, 12, 15];
const ALL = [3, 6, 9, 12, 15], FROM6 = [6, 9, 12, 15];
/* pos: "Yes" is the good answer. at: visit months where the row applies (card p.7) */
K.hbyc.CHECK = [
  { k: 'sick', at: ALL, pos: false, en: 'Is the child sick?', or: 'ଶିଶୁ ଅସୁସ୍ଥ ଅଛି କି?' },
  { k: 'bf', at: ALL, pos: true, en: 'Is breastfeeding continuing?', or: 'ସ୍ତନ୍ୟପାନ ଜାରି ଅଛି କି?' },
  { k: 'cf6', at: [6], pos: true, en: 'Complementary food: 2–3 spoons at a time, 2–3 times a day, with 1–2 snacks?', or: 'ଥରକରେ ୨-୩ ଚାମଚର ଖାଦ୍ୟ, ଦିନକୁ ୨-୩ଥର, ୧-୨ଥର ଜଳଖିଆ ଦିଆଯାଉଛି କି?' },
  { k: 'cf9', at: [9], pos: true, en: 'Complementary food: ½ cup at a time, 2–3 times a day, with 1–2 snacks?', or: 'ଥରକରେ ୧/୨ କପ୍ ଖାଦ୍ୟ, ଦିନକୁ ୨-୩ଥର, ୧-୨ ଥର ଜଳଖିଆ ଦିଆଯାଉଛି କି?' },
  { k: 'cf12', at: [12, 15], pos: true, en: 'Complementary food: ¾ to 1 cup at a time, 3–4 times a day, with 1–2 snacks?', or: 'ଥରକରେ ୩/୪-୧ କପ୍ ଖାଦ୍ୟ, ଦିନକୁ ୩-୪ଥର, ୧-୨ ଥର ଜଳଖିଆ ଦିଆଯାଉଛି କି?' },
  { k: 'wt', at: ALL, pos: true, en: 'Has the AWW recorded the weight?', or: 'ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ ଓଜନ ରେକର୍ଡ କରିଛନ୍ତି କି?', auto: (k, d) => ((k.growth || []).some(g => g.wt != null && Math.abs(K.d.diff(g.date, d)) <= 30) ? 1 : null) },
  { k: 'delay', at: ALL, pos: false, en: 'Does the child have developmental delay (any warning sign)?', or: 'ଶିଶୁଟିର ବିଳମ୍ବିତ ବିକାଶ ଅଛି କି?', auto: (k) => (K.dev && K.dev.anyWarn(k) ? 1 : null) },
  { k: 'imm', at: ALL, pos: true, en: 'Immunisation status checked?', or: 'ଟୀକାକରଣର ସ୍ଥିତି ଯାଞ୍ଚ କରାଯାଇଛି କି?' },
  { k: 'mr', at: [9, 12, 15], pos: true, en: 'MR vaccine given?', or: 'ଏମ୍ଆର୍ ଟୀକା ଦିଆଯାଇଛି କି?', auto: (k) => (k.vax && k.vax.MR1 && k.vax.MR1.date ? 1 : null) },
  { k: 'vita', at: [9, 12, 15], pos: true, en: 'Vitamin A given?', or: 'ଭିଟାମିନ୍ ‘ଏ’ ଦିଆଯାଇଛି କି?', auto: (k) => (k.vitA && k.vitA[1] ? 1 : null) },
  { k: 'orsHome', at: ALL, pos: true, en: 'ORS packet at home?', or: 'ଓ.ଆର୍.ଏସ୍ ପ୍ୟାକେଟ୍ ଘରେ ଅଛି କି?' },
  { k: 'ifaHome', at: FROM6, pos: true, en: 'IFA syrup at home?', or: 'ଆଇ.ଏଫ୍.ଏ ସିରପ ଘରେ ଅଛି କି?' },
];
K.hbyc.SERVE = [
  { k: 'cEbf', at: [3, 6], en: 'Counselled on breastfeeding only (until 6 months)?', or: 'କେବଳ ସ୍ତନ୍ୟପାନ ପାଇଁ ପରାମର୍ଶ ଦିଆଯାଇଛି କି?' },
  { k: 'cCf', at: FROM6, en: 'Counselled on complementary feeding?', or: 'ପରିପୂରକ ଖାଦ୍ୟ ବିଷୟରେ ପରାମର୍ଶ ଦିଆଯାଇଛି କି?' },
  { k: 'cHw', at: ALL, en: 'Counselled on handwashing?', or: 'ହାତ ଧୋଇବା ପ୍ରଣାଳୀର ବିଷୟରେ ପରାମର୍ଶ ଦିଆଯାଇଛି କି?' },
  { k: 'cPar', at: ALL, en: 'Counselled on parenting (play and talk)?', or: 'ଶିଶୁର ଲାଳନ ପାଳନ ବିଷୟରେ ପରାମର୍ଶ ଦିଆଯାଇଛି କି?' },
  { k: 'cFp', at: ALL, en: 'Counselled on family planning?', or: 'ପରିବାର ନିୟୋଜନ ବିଷୟରେ ପରାମର୍ଶ ଦିଆଯାଇଛି କି?' },
  { k: 'ors', at: ALL, en: 'ORS given?', or: 'ଓଆର୍ଏସ୍ ଦିଆଯାଇଛି କି?' },
  { k: 'ifa', at: FROM6, en: 'IFA syrup given?', or: 'ଆଇ.ଏଫ୍.ଏ ସିରପ ଦିଆଯାଇଛି କି?' },
];
K.hbyc.rec = (k, m) => (k.hbyc || []).find(v => +v.m === +m) || null;
/* visit status: done · due (from the due date for 30 days) · overdue (until the next visit is due) · missed · upcoming */
K.hbyc.list = (k, today) => {
  today = today || K.d.today();
  return K.hbyc.MONTHS.map((m, i) => {
    const date = K.d.addMonths(k.dob, m); const r = K.hbyc.rec(k, m); const next = K.hbyc.MONTHS[i + 1];
    const closes = next ? K.d.addMonths(k.dob, next) : K.d.addMonths(k.dob, 18);
    let st; if (r) st = 'given'; else if (K.d.cmp(today, closes) >= 0) st = 'missed'; else { const lag = K.d.diff(date, today); st = lag < 0 ? 'upcoming' : lag <= 30 ? 'due' : 'overdue'; }
    return { m, date, r, st };
  });
};
const vaxNote = (k, d) => { const st = K.vax.state(k, d); const over = Object.values(st).filter(s => s.st === 'overdue').map(s => s.it.code); return over.length ? K.t('hbyc.vaxOver', { x: over.join(', ') }) : K.t('hbyc.vaxOk'); };

K.route('/card/:id/child/:kid/hbyc', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  const back = K.child.url(c, k).slice(1);
  if (!k.dob) return { title: K.t('hbyc.title'), back, html: h`<div class="wrap">${K.ui.callout('warn', '', K.t('vax.needDob'))}</div>` };
  const list = K.hbyc.list(k); const n = list.filter(x => x.r).length;
  return { title: K.t('hbyc.title'), sub: K.child.label(k), back, tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + ' · ' + K.d.ageText(k.dob), K.t('hbyc.title'), K.t('hbyc.lede'))}
      <p class="small">${K.t('hbyc.done', { n, t: list.length })}</p>
      <div class="list">${list.map(x => K.ui.li({ href: K.child.url(c, k, '/hbyc/' + x.m), icon: x.st === 'given' ? 'check' : 'house', tone: x.st === 'given' ? 'done' : x.st === 'overdue' ? 'red' : x.st === 'due' ? 'amber' : 'ink',
        title: K.t('hbyc.visit', { m: x.m }), meta: x.r ? K.d.fmt(x.r.date) : K.d.fmt(x.date), trail: K.ui.pill(x.st === 'given' ? K.t('st.done') : K.vax.lbl({ st: x.st }), K.vax.tone({ st: x.st })) }))}</div>
      ${K.d.age(k.dob).months >= 18 ? h`<p class="small faint" style="margin-top:12px">${K.t('hbyc.over')}</p>` : ''}
    </div>` };
});

K.route('/card/:id/child/:kid/hbyc/:m', ({ id, kid, m }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k || !k.dob) return K.screens.notFound();
  m = +m; if (!K.hbyc.MONTHS.includes(m)) return K.screens.notFound();
  const r = K.hbyc.rec(k, m) || {}; const ans = r.ans || {}; const date = r.date || K.d.today();
  const row = (it, pos) => { const auto = !r.ans && it.auto ? it.auto(k, date) : null; const v = ans[it.k] != null ? ans[it.k] : auto;
    return K.ui.yn({ name: it.k, q: K.L(it), value: v, pos, sub: auto != null && ans[it.k] == null ? K.t('hbyc.auto') : '' }); };
  return { title: K.t('hbyc.visit', { m }), sub: K.child.label(k), back: K.child.url(c, k, '/hbyc').slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + ' · ' + K.d.ageText(k.dob), K.t('hbyc.visit', { m }), K.d.fmt(K.d.addMonths(k.dob, m), 'long'))}
      <form class="form" data-form="hbycSave" data-arg="${c.id}|${k.id}|${m}">
        <div class="fgroup">${K.ui.field({ name: 'date', type: 'date', label: K.t('hbyc.date'), value: date, max: K.d.today(), attrs: { min: k.dob } })}</div>
        <fieldset class="fgroup"><legend>${K.t('hbyc.verify')}</legend>
          ${K.hbyc.CHECK.filter(it => it.at.includes(m)).map(it => row(it, it.pos))}
          <p class="small" style="margin:6px 0 0">${K.ui.icon('syringe', 'sm')} ${vaxNote(k, date)}</p>
        </fieldset>
        <fieldset class="fgroup"><legend>${K.t('hbyc.serve')}</legend>${K.hbyc.SERVE.filter(it => it.at.includes(m)).map(it => row(it, true))}</fieldset>
        <div class="fgroup">${K.ui.field({ name: 'notes', type: 'textarea', label: K.t('hbyc.notes'), value: r.notes })}</div>
        <div class="btn-bar">${K.ui.btn(K.t('hbyc.save'), { type: 'submit', icon: 'check' })}${r.id ? K.ui.btn('', { act: 'hbycDelete', arg: `${c.id}|${k.id}|${m}`, tone: 'ghost', icon: 'trash', aria: K.t('btn.delete') }) : ''}</div>
      </form>
      <p class="small faint" style="margin-top:12px"><a href="${K.child.url(c, k, '/dev')}">${K.t('dev.title')}</a> · <a href="${K.child.url(c, k, '/feed')}">${K.t('feed.title')}</a> · <a href="${K.child.url(c, k, '/growth')}">${K.t('gr.title')}</a> · <a href="${K.child.url(c, k, '/vax')}">${K.t('vax.title')}</a></p>
    </div>` };
});
K.forms.hbycSave = async (v, f) => {
  const [cid, kid, m] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  if (!v.date || K.d.diff(v.date, K.d.today()) < 0 || K.d.diff(k.dob, v.date) < 0) { K.ui.toast(K.t('err.date')); return; }
  const ans = {}; K.hbyc.CHECK.concat(K.hbyc.SERVE).forEach(it => { if (v[it.k] != null) ans[it.k] = +v[it.k]; });
  k.hbyc = k.hbyc || []; let r = K.hbyc.rec(k, m); if (!r) { r = { id: K.uid('hb'), m: +m }; k.hbyc.push(r); }
  Object.assign(r, { date: v.date, ans, notes: v.notes || '' });
  await K.store.save(c); K.ui.toast(K.t('saved'));
  if (ans.sick === 1) { K.go(K.child.url(c, k, '/sick').slice(1)); K.ui.toast(K.t('hbyc.flagSick'), 4000); } else K.go(K.child.url(c, k, '/hbyc').slice(1));
};
K.acts.hbycDelete = async (el) => {
  const [cid, kid, m] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  if (!(await K.ui.confirm(K.t('hbyc.deleteQ'), { danger: true, ok: K.t('btn.delete') }))) return;
  k.hbyc = (k.hbyc || []).filter(x => +x.m !== +m); await K.store.save(c); K.go(K.child.url(c, k, '/hbyc').slice(1));
};

K.child.addTile(40, (c, k) => {
  const age = K.d.age(k.dob).months; if (age >= 18 && !(k.hbyc || []).length) return null;
  const list = K.hbyc.list(k); const nx = list.find(x => ['due', 'overdue', 'upcoming'].includes(x.st));
  return { icon: 'house', tone: nx && nx.st === 'overdue' ? 'amber' : '', title: K.t('hbyc.tile'), href: K.child.url(c, k, '/hbyc'),
    sub: `${K.t('hbyc.done', { n: list.filter(x => x.r).length, t: list.length })}${nx ? ' · ' + K.t('hbyc.visit', { m: nx.m }) + ' ' + K.d.fmt(nx.date, 'dm') : ''}` };
});
K.due.add((c, today, horizon) => {
  const out = []; const H = Math.max(7, horizon || 0);
  K.card.kids(c).forEach(k => {
    if (!k.dob || K.d.age(k.dob, today).months >= 18) return;
    K.hbyc.list(k, today).filter(x => x.st === 'due' || x.st === 'overdue' || (x.st === 'upcoming' && K.d.diff(today, x.date) <= H)).forEach(x => out.push({
      id: 'hbyc' + k.id + x.m, kind: 'visit', icon: 'house', href: K.child.url(c, k, '/hbyc/' + x.m), who: K.child.label(k), date: x.date, status: x.st === 'overdue' ? 'overdue' : undefined,
      title: { en: `${K.child.label(k)}: ASHA home visit (${x.m} months)`, or: `${K.child.label(k)}: ଆଶାଙ୍କ ଗୃହ ପରିଦର୍ଶନ (${x.m} ମାସ)` } }));
  });
  return out;
});
