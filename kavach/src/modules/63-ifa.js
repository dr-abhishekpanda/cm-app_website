/* ============================================================================
   modules/63-ifa — IFA syrup for children 6–59 months (Anaemia Mukt Bharat):
   1 ml twice a week on the fixed days (Odisha: Tuesday and Friday; setting
   `ifaDays`), one 50 ml bottle ≈ 6 months. Ticks reuse K.acts.tick
   (k.ifa.days), bottles in k.ifa.bottles { n: date }.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'cifa.title': { en: 'IFA syrup (iron)', or: 'ଆଇ.ଏଫ୍.ଏ. ସିରପ୍ (ଲୌହସାର)' },
  'cifa.lede': { en: '1 ml twice a week, after food, from 6 months to 5 years.', or: '୬ ମାସରୁ ୫ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ସପ୍ତାହକୁ ଦୁଇଥର ଖାଇବା ପରେ ୧ ମି.ଲି.।' },
  'cifa.days': { en: 'Syrup days: {d}', or: 'ସିରପ୍ ଦିନ: {d}' },
  'cifa.todayGive': { en: "Today is a syrup day — tap after giving", or: 'ଆଜି ସିରପ୍ ଦିନ — ଦେବା ପରେ ଛୁଅନ୍ତୁ' },
  'cifa.todayDone': { en: "Today's dose given", or: 'ଆଜିର ମାତ୍ରା ଦିଆଗଲା' },
  'cifa.todayIs': { en: 'Syrup day today', or: 'ଆଜି ସିରପ୍ ଦିନ' },
  'cifa.next': { en: 'Next dose: {d}', or: 'ପରବର୍ତ୍ତୀ ମାତ୍ରା: {d}' },
  'cifa.last4': { en: '{n} of {t} doses in the last 4 weeks', or: 'ଗତ ୪ ସପ୍ତାହରେ {t}ଟି ମଧ୍ୟରୁ {n}ଟି ମାତ୍ରା' },
  'cifa.starts': { en: 'Starts when 6 months are complete: {d}', or: '୬ ମାସ ପୂରଣ ହେଲେ ଆରମ୍ଭ: {d}' },
  'cifa.ended': { en: 'IFA syrup is given until 5 years of age.', or: 'ଆଇ.ଏଫ୍.ଏ. ସିରପ୍ ୫ ବର୍ଷ ବୟସ ପର୍ଯ୍ୟନ୍ତ ଦିଆଯାଏ।' },
  'cifa.grid': { en: 'Last 8 weeks', or: 'ଗତ ୮ ସପ୍ତାହ' },
  'cifa.week': { en: 'Week of {d}', or: '{d} ସପ୍ତାହ' },
  'cifa.bottles': { en: 'Bottles received', or: 'ମା’ଙ୍କୁ ବୋତଲ ପ୍ରଦାନ କରିବାର ତାରିଖ' },
  'cifa.bottle': { en: 'Bottle {n}', or: 'ବୋତଲ-{n}' },
  'cifa.addBottle': { en: 'Record a bottle', or: 'ବୋତଲ ଲେଖନ୍ତୁ' },
  'cifa.bottleDate': { en: 'Date received', or: 'ପାଇଥିବା ତାରିଖ' },
  'cifa.nextBottle': { en: 'Ask for the next bottle around {d}', or: 'ପ୍ରାୟ {d} ରେ ନୂଆ ବୋତଲ ମାଗନ୍ତୁ' },
  'cifa.noBottle': { en: 'No bottle recorded yet. Ask your ASHA/ANM for IFA syrup and an auto-dispenser.', or: 'ଏପର୍ଯ୍ୟନ୍ତ ବୋତଲ ଲେଖାଯାଇନାହିଁ। ଆଶା/ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଆଇ.ଏଫ୍.ଏ. ସିରପ୍ ଓ ଅଟୋ ଡିସ୍ପେନସର ମାଗନ୍ତୁ।' },
  'cifa.rules': { en: 'Remember', or: 'ମନେରଖନ୍ତୁ' },
  'cifa.setDays': { en: 'Change the days', or: 'ଦିନ ବଦଳାନ୍ତୁ' },
  'cifa.tile': { en: 'IFA syrup', or: 'ଆଇ.ଏଫ୍.ଏ. ସିରପ୍' },
  'cifa.removeBottle': { en: 'Remove', or: 'ହଟାନ୍ତୁ' },
});

K.cifa = {};
K.cifa.days = () => { const d = K.settings.get('ifaDays'); return Array.isArray(d) && d.length ? d : [2, 5]; };
K.cifa.dayNames = (style) => K.cifa.days().map(i => K.d.WD[K.i18n.lang === 'or' ? 'or' : 'en'][i]).join(style === 'short' ? '/' : ' + ');
K.cifa.isDay = (iso) => K.cifa.days().includes(K.d.parse(iso).getDay());
K.cifa.window = (k) => ({ start: K.d.addMonths(k.dob, 6), end: K.d.addMonths(k.dob, 60) });
K.cifa.nextDay = (from) => { let d = from; for (let i = 0; i < 8; i++) { if (K.cifa.isDay(d)) return d; d = K.d.addDays(d, 1); } return from; };
/* syrup days in [a, b] */
K.cifa.daysIn = (a, b) => { const out = []; let d = a; while (K.d.cmp(d, b) <= 0) { if (K.cifa.isDay(d)) out.push(d); d = K.d.addDays(d, 1); } return out; };
K.cifa.last4 = (k, today) => {
  today = today || K.d.today(); const w = K.cifa.window(k);
  const a = K.d.max(w.start, K.d.addDays(today, -27)); if (K.d.cmp(a, today) > 0) return { n: 0, t: 0 };
  const ds = K.cifa.daysIn(a, today); const got = (k.ifa && k.ifa.days) || {};
  return { n: ds.filter(d => got[d]).length, t: ds.length };
};
K.cifa.bottles = (k) => Object.entries((k.ifa && k.ifa.bottles) || {}).map(([n, d]) => ({ n: +n, d })).sort((x, y) => x.n - y.n);

K.route('/card/:id/child/:kid/ifa', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  const back = K.child.url(c, k).slice(1);
  if (!k.dob) return { title: K.t('cifa.title'), back, html: h`<div class="wrap">${K.ui.callout('warn', '', K.t('vax.needDob'))}</div>` };
  const today = K.d.today(); const w = K.cifa.window(k); const key = `${c.id}:${k.id}:ifa`; const got = (k.ifa && k.ifa.days) || {};
  const before = K.d.cmp(today, w.start) < 0, after = K.d.cmp(today, w.end) >= 0;
  const isDay = K.cifa.isDay(today); const nx = K.cifa.nextDay(isDay ? K.d.addDays(today, 1) : today);
  const l4 = K.cifa.last4(k, today);
  // weeks grid: 8 weeks back from this week (Monday start), syrup days only
  const monday = K.d.addDays(today, -((K.d.parse(today).getDay() + 6) % 7));
  const weeks = []; for (let i = 7; i >= 0; i--) { const ws = K.d.addDays(monday, -7 * i); weeks.push({ ws, days: K.cifa.daysIn(ws, K.d.addDays(ws, 6)) }); }
  const btl = K.cifa.bottles(k); const lastB = btl[btl.length - 1];
  return { title: K.t('cifa.title'), sub: K.child.label(k), back, tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + ' · ' + K.d.ageText(k.dob), K.t('cifa.title'), K.t('cifa.lede'))}
      <p class="small">${K.t('cifa.days', { d: K.cifa.dayNames() })} · <a href="#/settings">${K.t('cifa.setDays')}</a></p>
      ${before ? K.ui.callout('info', '', K.t('cifa.starts', { d: K.d.fmt(w.start, 'long') }), 'calendar') : after ? K.ui.callout('info', '', K.t('cifa.ended')) : h`
      <section class="k-card trk">
        <div class="trk-top">
          ${isDay ? h`<button type="button" class="trk-today ${got[today] ? 'on' : ''}" data-act="tick" data-arg="${key}|${today}" aria-pressed="${!!got[today]}">${K.ui.icon(got[today] ? 'check' : 'drop', 'lg')}<span>${got[today] ? K.t('cifa.todayDone') : K.t('cifa.todayGive')}</span></button>`
            : h`<div class="trk-today off">${K.ui.icon('calendar', 'lg')}<span>${K.t('cifa.next', { d: K.d.weekday(nx) + ', ' + K.d.fmt(nx, 'dm') })}</span></div>`}
          <div class="trk-n"><b class="mono">${K.digits(l4.n)}/${K.digits(l4.t)}</b><span class="small">${K.t('cifa.last4', { n: l4.n, t: l4.t })}</span>${K.ui.bar(l4.t ? l4.n / l4.t * 100 : 0, l4.n < l4.t ? 'amber' : '')}</div>
        </div>
        <details class="trk-more" open><summary>${K.t('cifa.grid')}</summary>
          <div class="cifa-weeks">${weeks.map(wk => h`<div class="cifa-wk"><span class="small faint">${K.d.fmt(wk.ws, 'dm')}</span>${wk.days.map(d => { const fut = K.d.cmp(d, today) > 0; const pre = K.d.cmp(d, w.start) < 0;
            return h`<button type="button" class="tk ${got[d] ? 'on' : ''} ${d === today ? 'td' : ''}" ${fut || pre ? K.raw('disabled') : ''} data-act="tick" data-arg="${key}|${d}" aria-pressed="${!!got[d]}" title="${K.d.fmt(d)}"><small>${K.d.WD[K.i18n.lang === 'or' ? 'or' : 'en'][K.d.parse(d).getDay()].slice(0, K.i18n.lang === 'or' ? 2 : 3)}</small>${K.digits(K.d.parse(d).getDate())}</button>`; })}</div>`)}</div>
        </details>
      </section>`}
      <section class="sec">${K.ui.secH(K.t('cifa.bottles'))}
        ${btl.length ? h`<div class="list">${btl.map(b => K.ui.li({ icon: 'bottle', tone: 'done', title: K.t('cifa.bottle', { n: b.n }), meta: K.d.fmt(b.d), act: 'cifaBottleDel', arg: `${c.id}|${k.id}|${b.n}`, trail: h`<span class="small faint">${K.t('cifa.removeBottle')}</span>` }))}</div>
          <p class="small" style="margin:8px 0 0">${K.t('cifa.nextBottle', { d: K.d.fmt(K.d.addMonths(lastB.d, 6)) })}</p>` : h`<p class="small">${K.t('cifa.noBottle')}</p>`}
        <form class="form k-card" data-form="cifaBottle" data-arg="${c.id}|${k.id}" style="margin-top:10px"><div class="frow">${K.ui.field({ name: 'date', type: 'date', label: K.t('cifa.bottleDate'), value: today, max: today, attrs: { min: k.dob } })}<div style="align-self:end">${K.ui.btn(K.t('cifa.addBottle'), { type: 'submit', size: 'sm', tone: 'ghost', icon: 'plus' })}</div></div></form>
      </section>
      <section class="sec">${K.ui.secH(K.t('cifa.rules'))}<div class="k-card" id="cifa-rules"><ol class="ul">${K.ill.IFA_RULES.map(x => h`<li>${K.L(x)}</li>`)}</ol><p style="margin:10px 0 0">${K.ui.say('#cifa-rules')}</p></div></section>
    </div>` };
});
K.forms.cifaBottle = async (v, f) => {
  const [cid, kid] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k || !v.date) return;
  k.ifa = k.ifa || { days: {}, bottles: {} }; k.ifa.bottles = k.ifa.bottles || {};
  const n = Math.max(0, ...Object.keys(k.ifa.bottles).map(Number)) + 1; k.ifa.bottles[n] = v.date;
  await K.store.save(c); K.ui.toast(K.t('saved')); K.refresh();
};
K.acts.cifaBottleDel = async (el) => {
  const [cid, kid, n] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  if (!(await K.ui.confirm(K.t('cifa.bottle', { n }) + ' · ' + K.t('cifa.removeBottle') + '?', { ok: K.t('btn.delete'), danger: true }))) return;
  delete k.ifa.bottles[n]; await K.store.save(c); K.refresh();
};

K.child.addTile(30, (c, k) => {
  const today = K.d.today(); const w = K.cifa.window(k);
  if (K.d.cmp(today, w.end) >= 0) return null;
  const href = K.child.url(c, k, '/ifa');
  if (K.d.cmp(today, w.start) < 0) return { icon: 'drop', title: K.t('cifa.tile'), href, sub: K.t('cifa.starts', { d: K.d.fmt(w.start) }) };
  const l4 = K.cifa.last4(k, today); const isDay = K.cifa.isDay(today); const got = (k.ifa && k.ifa.days) || {};
  return { icon: 'drop', tone: isDay && !got[today] ? 'amber' : '', title: K.t('cifa.tile'), href,
    sub: isDay && !got[today] ? K.t('cifa.todayIs') : K.t('cifa.last4', { n: l4.n, t: l4.t }) };
});
K.due.add((c, today) => {
  const out = [];
  if (!K.cifa.isDay(today)) return out;
  K.card.kids(c).forEach(k => {
    if (!k.dob) return; const w = K.cifa.window(k);
    if (K.d.cmp(today, w.start) < 0 || K.d.cmp(today, w.end) >= 0) return;
    if ((k.ifa && k.ifa.days || {})[today]) return;
    out.push({ id: 'cifa' + k.id + today, kind: 'ifa', icon: 'drop', href: K.child.url(c, k, '/ifa'), who: K.child.label(k), date: today,
      title: { en: `${K.child.label(k)}: IFA syrup today (1 ml)`, or: `${K.child.label(k)}: ଆଜି ଆଇ.ଏଫ୍.ଏ. ସିରପ୍ (୧ ମି.ଲି.)` } });
  });
  return out;
});
