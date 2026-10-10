/* ============================================================================
   modules/60-dev — child development: the current age band (corrected age
   under 2 years), the mother's "can do" ticks, the ASHA/AWW warning-sign
   check, parenting tips, DEIC referral. Content in data/50-dev.
   Stored as k.dev = { <band>: { can: { i: date }, warn: { i: 0|1 }, date },
                       deic: date-seen-at-DEIC }
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'dev.title': { en: 'Development', or: 'ଶିଶୁର ବିକାଶ' },
  'dev.lede': { en: 'Tick what your child can do. Play and talk with your child every day.', or: 'ଶିଶୁ ଯାହା କରିପାରୁଛି ସେଥିରେ ଚିହ୍ନ ଦିଅନ୍ତୁ। ପ୍ରତିଦିନ ଶିଶୁ ସହ ଖେଳନ୍ତୁ ଓ କଥା ହୁଅନ୍ତୁ।' },
  'dev.now': { en: 'For this age', or: 'ଏହି ବୟସ ପାଇଁ' },
  'dev.earlier': { en: 'Earlier ages', or: 'ପୂର୍ବ ବୟସ' },
  'dev.next': { en: 'Coming next', or: 'ଆଗକୁ' },
  'dev.young': { en: 'The first milestones are looked for from 2 months. Until then, breastfeed often, keep the baby warm, and talk and smile to your baby.', or: 'ପ୍ରଥମ ବିକାଶ ଲକ୍ଷଣ ୨ ମାସରୁ ଦେଖାଯାଏ। ସେ ପର୍ଯ୍ୟନ୍ତ ବାରମ୍ବାର ସ୍ତନ୍ୟପାନ କରାନ୍ତୁ, ଶିଶୁକୁ ଉଷୁମ ରଖନ୍ତୁ ଓ ତା’ ସହ କଥା ହୁଅନ୍ତୁ, ହସନ୍ତୁ।' },
  'dev.done': { en: '{n} of {t} done', or: '{t}ଟି ମଧ୍ୟରୁ {n}ଟି ହୋଇଛି' },
  'dev.warnSeen': { en: 'Warning sign noted', or: 'ସତର୍କତା ଲକ୍ଷଣ ଦେଖାଯାଇଛି' },
  'dev.warnNone': { en: 'No warning signs at the last check', or: 'ଶେଷ ଯାଞ୍ଚରେ କୌଣସି ସତର୍କତା ଲକ୍ଷଣ ନାହିଁ' },
  'dev.checkedOn': { en: 'Checked on {d}', or: '{d} ରେ ଯାଞ୍ଚ ହୋଇଛି' },
  'dev.check': { en: 'Warning-sign check', or: 'ସତର୍କତା ଲକ୍ଷଣ ଯାଞ୍ଚ' },
  'dev.checkSub': { en: 'Done by the ASHA / AWW. Answer "Yes" if the sign is present.', or: '{a} ଆଶା / ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ ଯାଞ୍ଚ କରିବେ। ଲକ୍ଷଣ ଥିଲେ “ହଁ” ଦିଅନ୍ତୁ।' },
  'dev.checkDate': { en: 'Date of check', or: 'ଯାଞ୍ଚ ତାରିଖ' },
  'dev.saveCheck': { en: 'Save check', or: 'ଯାଞ୍ଚ ସେଭ୍ କରନ୍ତୁ' },
  'dev.refer': { en: 'Refer to the DEIC', or: 'ଡି.ଇ.ଆଇ.ସି.କୁ ପଠାନ୍ତୁ' },
  'dev.referBody': { en: 'A warning sign was noted. Contact the health worker and get the child checked at the DEIC in the district headquarters hospital. Early help works best.', or: 'ସତର୍କତା ଲକ୍ଷଣ ଦେଖାଯାଇଛି। ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ସହ ଯୋଗାଯୋଗ କରି ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟଠାରେ ଥିବା ଡି.ଇ.ଆଇ.ସି.ରେ ଶିଶୁର ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ଓ ପରାମର୍ଶ ନିଅନ୍ତୁ। ଶୀଘ୍ର ଚିକିତ୍ସା ଅଧିକ ଫଳପ୍ରଦ।' },
  'dev.deicSeen': { en: 'Seen at the DEIC on', or: 'ଡି.ଇ.ଆଇ.ସି.ରେ ଦେଖାଇଥିବା ତାରିଖ' },
  'dev.deicDone': { en: 'Seen at the DEIC on {d}', or: '{d} ରେ ଡି.ଇ.ଆଇ.ସି.ରେ ଦେଖାଯାଇଛି' },
  'dev.corr': { en: 'Using corrected age {a} (born early)', or: 'ସଂଶୋଧିତ ବୟସ {a} ବ୍ୟବହୃତ (ସମୟ ପୂର୍ବରୁ ଜନ୍ମ)' },
  'dev.tickHint': { en: 'Tap to tick', or: 'ଚିହ୍ନ ଦେବା ପାଇଁ ଛୁଅନ୍ତୁ' },
  'dev.tile': { en: 'Development', or: 'ବିକାଶ' },
});

K.dev = K.dev || {};
/* age in months for milestones: corrected age for babies born early, until 2 years */
K.dev.ageM = (k, on) => { on = on || K.d.today(); const dob = K.child.useCorrected(k, on) ? K.child.correctedDob(k) : k.dob; return Math.max(0, K.d.diff(dob, on) / 30.4375); };
K.dev.current = (k, on) => { const m = K.dev.ageM(k, on); let cur = null; K.dev.BANDS.forEach(b => { if (m >= b.from) cur = b; }); return cur; };
K.dev.rec = (k, band) => ((k.dev || {})[band] || {});
K.dev.warnCount = (k, band) => Object.values(K.dev.rec(k, band).warn || {}).filter(v => +v === 1).length;
K.dev.anyWarn = (k) => K.dev.BANDS.some(b => K.dev.warnCount(k, b.k) > 0);
K.dev.canCount = (k, band) => Object.keys(K.dev.rec(k, band).can || {}).length;

function bandCard(c, k, b, o = {}) {
  const r = K.dev.rec(k, b.k); const can = r.can || {}; const warn = r.warn || {}; const wn = K.dev.warnCount(k, b.k);
  const id = 'dev-' + b.k; const hcp = K.settings.isHcp();
  return h`<div class="dev-band" id="${id}">
    <div class="dev-sub"><h3>${K.L(K.dev.TEXT.canHead)}</h3><span class="small faint">${K.t('dev.done', { n: Object.keys(can).length, t: b.can.length })}</span></div>
    <div class="checklist dev-can">${b.can.map((x, i) => h`<button type="button" class="chk ${can[i] ? 'on' : ''}" data-act="devCan" data-arg="${c.id}|${k.id}|${b.k}|${i}" aria-pressed="${!!can[i]}"><span class="box">${K.ui.icon('check', 'sm')}</span><span>${K.L(x)}${can[i] ? h`<small class="faint"> · ${K.d.fmt(can[i], 'dm')}</small>` : ''}</span></button>`)}</div>
    <div class="dev-sub"><h3>${K.L(K.dev.TEXT.tipsHead)}</h3></div>
    <div class="k-card" id="${id}-tips"><ul class="ul">${b.tips.map(x => h`<li>${K.L(x)}</li>`)}</ul><p style="margin:10px 0 0">${K.ui.say('#' + id + '-tips')}</p></div>
    <div class="dev-sub"><h3>${K.L(K.dev.TEXT.warnHead)} · ${K.L(b.atName)}</h3>${r.date ? K.ui.pill(wn ? K.t('dev.warnSeen') : K.t('dev.checkedOn', { d: K.d.fmt(r.date, 'dm') }), wn ? 'over' : 'ok', wn ? 'alert' : 'check') : ''}</div>
    <p class="small" style="margin:0 0 8px">${K.L(K.dev.TEXT.warnLead)}</p>
    <details class="acc dev-check" ${o.openCheck || wn ? K.raw('open') : ''}><summary>${K.t('dev.check')}</summary><div class="acc-b">
      <form class="form" data-form="devCheck" data-arg="${c.id}|${k.id}|${b.k}">
        <p class="small faint" style="margin:0">${K.t('dev.checkSub', { a: K.L(b.atName) })}</p>
        ${b.warn.map((x, i) => K.ui.yn({ name: 'w' + i, q: K.L(x), value: warn[i] }))}
        ${K.ui.field({ name: 'date', type: 'date', label: K.t('dev.checkDate'), value: r.date || K.d.today(), max: K.d.today(), attrs: { min: k.dob } })}
        ${K.ui.btn(K.t('dev.saveCheck'), { type: 'submit', icon: 'check', tone: hcp ? 'primary' : 'ghost' })}
      </form></div></details>
  </div>`;
}

K.route('/card/:id/child/:kid/dev', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  const back = K.child.url(c, k).slice(1);
  if (!k.dob) return { title: K.t('dev.title'), back, html: h`<div class="wrap">${K.ui.callout('warn', '', K.t('vax.needDob'))}</div>` };
  const cur = K.dev.current(k); const idx = cur ? K.dev.BANDS.indexOf(cur) : -1;
  const earlier = idx > 0 ? K.dev.BANDS.slice(0, idx).reverse() : [];
  const next = K.dev.BANDS[idx + 1];
  const corr = K.child.useCorrected(k) ? K.t('dev.corr', { a: K.d.ageText(K.child.correctedDob(k)) }) : '';
  const warnAny = K.dev.anyWarn(k); const deic = (k.dev || {}).deic;
  return {
    title: K.t('dev.title'), sub: K.child.label(k), back, tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + ' · ' + K.d.ageText(k.dob), K.t('dev.title'), K.t('dev.lede'))}
      ${corr ? h`<p class="small faint" style="margin-top:-6px">${corr}</p>` : ''}
      ${warnAny ? h`<div class="stack" style="margin-bottom:14px">${K.ui.callout('danger', K.t('dev.refer'), deic ? K.t('dev.deicDone', { d: K.d.fmt(deic) }) : K.t('dev.referBody'))}
        ${!deic ? h`<form class="form k-card" data-form="devDeic" data-arg="${c.id}|${k.id}"><div class="frow">${K.ui.field({ name: 'date', type: 'date', label: K.t('dev.deicSeen'), max: K.d.today() })}<div style="align-self:end">${K.ui.btn(K.t('btn.save'), { type: 'submit', size: 'sm', tone: 'ghost' })}</div></div></form>` : ''}</div>` : ''}
      ${cur ? h`<section class="sec"><div class="sec-h"><h2>${K.L(cur.name)}</h2>${K.ui.pill(K.t('dev.now'), 'teal')}</div>${bandCard(c, k, cur, { openCheck: K.settings.isHcp() && K.dev.ageM(k) >= cur.at - 0.5 })}</section>`
        : K.ui.callout('info', '', K.t('dev.young'), 'baby')}
      ${next && !cur ? h`<section class="sec"><details class="acc"><summary>${K.t('dev.next')} · ${K.L(next.name)}</summary><div class="acc-b">${bandCard(c, k, next)}</div></details></section>` : ''}
      ${earlier.length ? h`<section class="sec">${K.ui.secH(K.t('dev.earlier'))}<div class="stack">${earlier.map(b => { const wn = K.dev.warnCount(k, b.k);
        return h`<details class="acc"><summary>${K.L(b.name)} <span class="small faint">· ${K.t('dev.done', { n: K.dev.canCount(k, b.k), t: b.can.length })}</span>${wn ? h` ${K.ui.pill(K.t('dev.warnSeen'), 'over', 'alert')}` : ''}</summary><div class="acc-b">${bandCard(c, k, b)}</div></details>`; })}</div></section>` : ''}
      ${next && cur ? h`<section class="sec"><details class="acc"><summary>${K.t('dev.next')} · ${K.L(next.name)}</summary><div class="acc-b"><ul class="ul">${next.can.map(x => h`<li>${K.L(x)}</li>`)}</ul></div></details></section>` : ''}
      <section class="sec"><div class="k-card"><b>${K.L(K.dev.TEXT.deic)}</b><p class="small" style="margin:6px 0 0">${K.L(K.dev.TEXT.deicBody)}</p></div></section>
    </div>`,
    mount() { const a = K.anchor(); if (a) { const e = document.getElementById(a); e && e.scrollIntoView(); } },
  };
});

K.acts.devCan = async (el) => {
  const [cid, kid, band, i] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  k.dev = k.dev || {}; const r = k.dev[band] = k.dev[band] || {}; r.can = r.can || {};
  if (r.can[i]) delete r.can[i]; else r.can[i] = K.d.today();
  await K.store.save(c);
  el.classList.toggle('on', !!r.can[i]); el.setAttribute('aria-pressed', String(!!r.can[i]));
  const b = K.dev.BANDS.find(x => x.k === band); const sub = el.closest('.dev-band'); const cnt = sub && sub.querySelector('.dev-sub .faint');
  if (cnt && b) cnt.textContent = K.t('dev.done', { n: Object.keys(r.can).length, t: b.can.length });
};
K.forms.devCheck = async (v, f) => {
  const [cid, kid, band] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  const b = K.dev.BANDS.find(x => x.k === band); if (!b) return;
  if (!v.date || K.d.diff(v.date, K.d.today()) < 0) { K.ui.toast(K.t('err.date')); return; }
  const warn = {}; b.warn.forEach((x, i) => { if (v['w' + i] != null) warn[i] = +v['w' + i]; });
  k.dev = k.dev || {}; const r = k.dev[band] = k.dev[band] || {}; r.warn = warn; r.date = v.date;
  await K.store.save(c); K.ui.toast(K.t('saved')); K.refresh();
};
K.forms.devDeic = async (v, f) => {
  const [cid, kid] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k || !v.date) return;
  k.dev = k.dev || {}; k.dev.deic = v.date; await K.store.save(c); K.refresh();
};

/* overview tile, card pill, due items, summary */
K.child.addTile(10, (c, k) => {
  const cur = K.dev.current(k); const warn = K.dev.anyWarn(k) && !(k.dev || {}).deic;
  return { icon: 'star', tone: warn ? 'red' : '', title: K.t('dev.tile'), href: K.child.url(c, k, '/dev'),
    sub: warn ? K.t('dev.warnSeen') : cur ? `${K.L(cur.name)} · ${K.t('dev.done', { n: K.dev.canCount(k, cur.k), t: cur.can.length })}` : K.L(K.dev.BANDS[0].name) };
});
K.child.cardBits.push((c, k) => (K.dev.anyWarn(k) && !(k.dev || {}).deic ? K.ui.pill(K.t('dev.warnSeen'), 'over', 'star') : ''));
K.due.add((c, today) => {
  const out = [];
  K.card.kids(c).forEach(k => {
    if (!k.dob) return;
    const m = K.dev.ageM(k, today);
    if (K.dev.anyWarn(k) && !(k.dev || {}).deic) {
      out.push({ id: 'deic' + k.id, kind: 'danger', icon: 'star', href: K.child.url(c, k, '/dev'), who: K.child.label(k), status: 'overdue', date: today,
        title: { en: `${K.child.label(k)}: development warning sign — check at the DEIC`, or: `${K.child.label(k)}: ବିକାଶ ସତର୍କତା ଲକ୍ଷଣ — ଡି.ଇ.ଆଇ.ସି.ରେ ଯାଞ୍ଚ` } });
      return;
    }
    // the warning-sign check is due from the band's "at" age for two months
    const b = K.dev.BANDS.find(x => m >= x.at && m < x.at + 2 && !K.dev.rec(k, x.k).date);
    if (b && K.settings.isHcp()) out.push({ id: 'devchk' + k.id + b.k, kind: 'check', icon: 'star', href: K.child.url(c, k, '/dev'), who: K.child.label(k),
      date: K.d.addMonths(K.child.useCorrected(k, today) ? K.child.correctedDob(k) : k.dob, b.at),
      title: { en: `${K.child.label(k)}: development check (${b.atName.en.toLowerCase()})`, or: `${K.child.label(k)}: ବିକାଶ ଯାଞ୍ଚ (${b.atName.or})` } });
  });
  return out;
});
K.summary.add((c) => K.card.kids(c).filter(k => k.dob).map(k => { const cur = K.dev.current(k); if (!cur) return '';
  return `${K.child.label(k)} — ${K.t('dev.title')}: ${K.L(cur.name)}, ${K.t('dev.done', { n: K.dev.canCount(k, cur.k), t: cur.can.length })}${K.dev.anyWarn(k) ? ' · ' + K.t('dev.warnSeen') : ''}`; }));
