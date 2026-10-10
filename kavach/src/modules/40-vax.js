/* ============================================================================
   modules/40-vax — immunisation engine, child tracker, Vitamin A +
   albendazole, missed-dose record, due items. Schedule in data/30-vaccines.
   Status per dose: given · due (from due date for 4 weeks) · overdue ·
   upcoming · waiting (previous dose of the series not yet given) ·
   missed (catch-up limit passed) · na (JE outside endemic districts, HPV boys).
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'vax.title': { en: 'Vaccines', or: 'ଟୀକାକରଣ' },
  'vax.tracker': { en: 'Vaccination record', or: 'ଟୀକାକରଣ ସୂଚନା' },
  'vax.next': { en: 'Next vaccines', or: 'ପରବର୍ତ୍ତୀ ଟୀକା' },
  'vax.overdue': { en: 'Overdue vaccines', or: 'ବିଳମ୍ବ ହୋଇଥିବା ଟୀକା' },
  'vax.allDone': { en: 'All vaccines due so far are given.', or: 'ଏପର୍ଯ୍ୟନ୍ତ ଦେବାକୁ ଥିବା ସମସ୍ତ ଟୀକା ଦିଆଯାଇଛି।' },
  'vax.progress': { en: '{n} of {t} doses given so far', or: 'ଏପର୍ଯ୍ୟନ୍ତ {t}ଟି ମଧ୍ୟରୁ {n}ଟି ଟୀକା ଦିଆଯାଇଛି' },
  'vax.fic': { en: 'Fully immunised (1st year)', or: 'ସମ୍ପୂର୍ଣ୍ଣ ଟୀକାକରଣ (ପ୍ରଥମ ବର୍ଷ)' },
  'vax.cic': { en: 'Completely immunised (2nd year)', or: 'ସମ୍ପୂର୍ଣ୍ଣ ଟୀକାକରଣ (ଦ୍ୱିତୀୟ ବର୍ଷ)' },
  'vax.ficLate': { en: 'Fully immunised (after 1 year)', or: 'ସମ୍ପୂର୍ଣ୍ଣ ଟୀକାକରଣ (୧ ବର୍ଷ ପରେ)' },
  'vax.six': { en: 'Six vaccination visits in the first 2 years complete the course: birth, 1½, 2½, 3½, 9 and 16 months.', or: 'ସମ୍ପୂର୍ଣ୍ଣ ଟୀକାକରଣ ପାଇଁ ଶିଶୁକୁ ୨ ବର୍ଷ ମଧ୍ୟରେ ୬ଥର ଟୀକାଦାନ କରନ୍ତୁ: ଜନ୍ମ, ଦେଢ଼, ଅଢ଼େଇ, ସାଢ଼େ ତିନି, ୯ ଓ ୧୬ ମାସ।' },
  'vax.markGiven': { en: 'Mark as given', or: 'ଦିଆଗଲା ବୋଲି ଚିହ୍ନିତ କରନ୍ତୁ' },
  'vax.markAll': { en: 'Mark these given', or: 'ଏଗୁଡ଼ିକ ଦିଆଗଲା ବୋଲି ଚିହ୍ନିତ କରନ୍ତୁ' },
  'vax.givenOn': { en: 'Given on', or: 'ଦିଆଯାଇଥିବା ତାରିଖ' },
  'vax.place': { en: 'Where', or: 'କେଉଁଠାରେ' },
  'vpl.session': { en: 'Mamata Divas / session', or: 'ମମତା ଦିବସ / ଟୀକା ଅଧିବେଶନ' }, 'vpl.fac': { en: 'Health centre / hospital', or: 'ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ର / ଡାକ୍ତରଖାନା' }, 'vpl.pvt': { en: 'Private', or: 'ଘରୋଇ' }, 'vpl.campaign': { en: 'Campaign (SIA)', or: 'ଅଭିଯାନ (SIA)' },
  'vax.batch': { en: 'Batch number (optional)', or: 'ବ୍ୟାଚ୍ ନମ୍ବର (ଇଚ୍ଛାଧୀନ)' },
  'vax.reaction': { en: 'Any reaction after the vaccine', or: 'ଟୀକା ପରେ କୌଣସି ପ୍ରତିକ୍ରିୟା' },
  'vax.notGiven': { en: 'Could not be given', or: 'ଦିଆଯାଇପାରିଲା ନାହିଁ' },
  'vax.reason': { en: 'Reason', or: 'ଟୀକା ନ ଦେବାର କାରଣ' },
  'vax.nextSession': { en: 'Next session date', or: 'ଆସନ୍ତା ଟୀକାକରଣ ଦିବସର ତାରିଖ' },
  'vax.missedTable': { en: 'Vaccines not given', or: 'ଦିଆ ନ ଯାଇଥିବା ଟୀକାର ବିବରଣୀ' },
  'vax.remove': { en: 'Remove this entry', or: 'ଏହି ବିବରଣୀ ହଟାନ୍ତୁ' },
  'vax.after': { en: 'after {x}', or: '{x} ପରେ' },
  'vax.later': { en: 'Later', or: 'ପରେ' },
  'vax.early': { en: '{x}: this date is before the due date ({d}). Doses given too early may not protect. Save anyway?', or: '{x}: ଏହି ତାରିଖ ଦେବା ତାରିଖ ({d}) ପୂର୍ବରୁ। ବହୁତ ଆଗରୁ ଦିଆଯାଇଥିବା ଟୀକା ସୁରକ୍ଷା ନ ଦେଇପାରେ। ତଥାପି ସେଭ୍ କରିବେ?' },
  'vax.noPrev': { en: '{x}: the earlier dose ({p}) is not recorded. Save anyway?', or: '{x}: ପୂର୍ବ ମାତ୍ରା ({p}) ଲେଖାଯାଇନାହିଁ। ତଥାପି ସେଭ୍ କରିବେ?' },
  'vax.check': { en: 'Check the date', or: 'ତାରିଖ ଯାଞ୍ଚ କରନ୍ତୁ' },
  'vax.dueOn': { en: 'Due {d}', or: '{d} ରେ ଦେବାକୁ' },
  'vax.upto': { en: 'Can be given until {d}', or: '{d} ପର୍ଯ୍ୟନ୍ତ ଦିଆଯାଇପାରିବ' },
  'vax.jeOnly': { en: 'Only in selected districts', or: 'କେବଳ ନିର୍ଦ୍ଦିଷ୍ଟ ଜିଲ୍ଲାରେ' },
  'vax.hpvNote': { en: 'Single dose for girls at 14 years, free at government facilities (from 2026).', or: '୧୪ ବର୍ଷ ବୟସର ଝିଅମାନଙ୍କ ପାଇଁ ଗୋଟିଏ ମାତ୍ରା, ସରକାରୀ ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ରରେ ମାଗଣା (୨୦୨୬ ଠାରୁ)।' },
  'vax.altDpt': { en: 'Penta cannot be started after 1 year — the ANM will give DPT instead.', or: '୧ ବର୍ଷ ପରେ ପେଣ୍ଟା ଆରମ୍ଭ କରାଯାଏ ନାହିଁ — ଏ.ଏନ୍.ଏମ୍. ଡି.ପି.ଟି. ଦେବେ।' },
  'vax.missedNote': { en: 'Window closed; ask the ANM about catch-up.', or: 'ସମୟସୀମା ବିତିଗଲା; ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ପଚାରନ୍ତୁ।' },
  'vax.four': { en: 'Four key messages on vaccination day', or: 'ମା\'ମାନଙ୍କ ପାଇଁ ଟୀକାକରଣ ଦିନ ଚାରୋଟି ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ବାର୍ତ୍ତା' },
  'vax.know': { en: 'Things to know about vaccination', or: 'ଟୀକାଦାନ ବିଷୟରେ କେତୋଟି ଜାଣିବା କଥା' },
  'vax.uwin': { en: 'Official vaccination certificate: U-WIN', or: 'ସରକାରୀ ଟୀକାକରଣ ପ୍ରମାଣପତ୍ର: U-WIN' },
  'vax.uwinSub': { en: 'Vaccines given at government sessions are recorded on U-WIN. Download the certificate with the mobile number given at registration.', or: 'ସରକାରୀ ଅଧିବେଶନରେ ଦିଆଯାଇଥିବା ଟୀକା U-WIN ରେ ଲେଖାଯାଏ। ପଞ୍ଜୀକରଣ ସମୟର ମୋବାଇଲ୍ ନମ୍ବର ସହ ପ୍ରମାଣପତ୍ର ଡାଉନଲୋଡ୍ କରନ୍ତୁ।' },
  'vax.how': { en: 'Dose and route', or: 'ମାତ୍ରା ଓ ପ୍ରୟୋଗ' },
  'vita.title': { en: 'Vitamin A and deworming', or: 'ଭିଟାମିନ୍ ଏ ଓ କୃମିନାଶକ' },
  'vita.rule': { en: 'Vitamin A at 9 months (1 lakh IU), then 2 lakh IU every 6 months until 5 years — 9 doses. From 18 months, albendazole is given with it (1–2 years: 200 mg; 2 years and above: 400 mg).', or: '୯ ମାସରେ ଭିଟାମିନ୍ ଏ (୧ ଲକ୍ଷ IU), ତା\'ପରେ ୫ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ପ୍ରତି ୬ ମାସରେ ୨ ଲକ୍ଷ IU — ୯ଟି ମାତ୍ରା। ୧୮ ମାସରୁ ଏହା ସହ କୃମିନାଶକ ଆଲ୍‌ବେଣ୍ଡାଜୋଲ୍ (୧–୨ ବର୍ଷ: ୨୦୦ ମି.ଗ୍ରା.; ୨ ବର୍ଷ ଓ ଅଧିକ: ୪୦୦ ମି.ଗ୍ରା.)।' },
  'vita.vitA': { en: 'Vitamin A', or: 'ଭିଟାମିନ୍ ଏ' }, 'vita.alb': { en: 'Albendazole', or: 'ଆଲ୍‌ବେଣ୍ଡାଜୋଲ୍' },
  'vita.at': { en: 'at {m} months', or: '{m} ମାସରେ' },
  'vax.open': { en: 'Open vaccination record', or: 'ଟୀକାକରଣ ସୂଚନା ଖୋଲନ୍ତୁ' },
  'vax.needDob': { en: "Add the child's date of birth to see the vaccine dates.", or: 'ଟୀକା ତାରିଖ ଦେଖିବା ପାଇଁ ଶିଶୁର ଜନ୍ମ ତାରିଖ ଦିଅନ୍ତୁ।' },
});

/* ---------------------------------------------------------------- engine */
const gv = (k, id) => (k.vax && k.vax[id] && k.vax[id].date) || null;
K.vax.at = (dob, a) => K.d.add(dob, a);
K.vax.state = (k, today, ctx) => {
  today = today || K.d.today(); ctx = ctx || { je: !!K.settings.get('jeArea') };
  const out = {};
  if (!k.dob) return out;
  K.vax.LIST.forEach(it => {
    const rec = (k.vax || {})[it.id] || {};
    let r;
    if (it.sex && k.sex && it.sex !== k.sex) r = { st: 'na', why: 'sex' };
    else if (it.je && !ctx.je && !rec.date) r = { st: 'na', why: 'je' };
    else if (rec.date) r = { st: 'given', date: rec.date };
    else {
      let due = K.vax.at(k.dob, it.due); let after = null;
      if (it.prev) { const pg = gv(k, it.prev); if (pg) due = K.d.max(due, K.d.addDays(pg, it.gap || 28)); else after = it.prev; }
      const lim = it.upto ? K.vax.at(k.dob, it.upto) : null;
      const startLim = it.start && !it.prev ? K.vax.at(k.dob, it.start) : null;
      const prevSt = it.prev ? out[it.prev] : null;
      if (startLim && K.d.cmp(today, startLim) > 0) r = { st: 'missed', due, why: 'start', alt: it.alt };
      else if (lim && K.d.cmp(today, lim) > 0) r = { st: 'missed', due, why: 'upto' };
      else if (after && prevSt && (prevSt.st === 'missed' || prevSt.st === 'na')) r = { st: prevSt.st, due, why: 'prev' };
      else if (after) r = { st: 'waiting', due, after, lim };
      else { const lag = K.d.diff(due, today); r = { st: lag < 0 ? 'upcoming' : lag <= 28 ? 'due' : 'overdue', due, lim }; }
      if (rec.missed) r.missedRec = rec.missed;
    }
    out[it.id] = Object.assign({ it }, r);
  });
  return out;
};
K.vax.vitaState = (k, today) => {
  today = today || K.d.today(); if (!k.dob) return [];
  return K.vax.VITA.map((v, i) => {
    const date = (k.vitA || {})[v.n]; const alb = (k.alb || {})[v.n];
    const due = K.d.addMonths(k.dob, v.m); const next = K.vax.VITA[i + 1]; const closes = next ? K.d.addMonths(k.dob, next.m) : K.d.addMonths(k.dob, 60 + 6);
    let st; if (date) st = 'given'; else if (K.d.cmp(today, closes) >= 0) st = 'missed'; else { const lag = K.d.diff(due, today); st = lag < 0 ? 'upcoming' : lag <= 28 ? 'due' : 'overdue'; }
    return { v, date, alb, due, st, albDose: v.m < 24 ? '200 mg' : '400 mg' };
  });
};
K.vax.counts = (st) => { const vals = Object.values(st).filter(s => s.st !== 'na' && s.st !== 'upcoming' && s.st !== 'waiting'); return { n: vals.filter(s => s.st === 'given').length, t: vals.length }; };
K.vax.fic = (k, st) => {
  const ids = ['BCG', 'OPV1', 'OPV2', 'OPV3', 'Penta1', 'Penta2', 'Penta3', 'MR1'];
  if (!ids.every(id => st[id] && st[id].st === 'given')) return null;
  const last = ids.map(id => st[id].date).sort().pop();
  const fic = K.d.cmp(last, K.d.addMonths(k.dob, 12)) <= 0 ? 'fic' : 'ficLate';
  const cicIds = ['MR2', 'DPTB1', 'OPVB'];
  const cic = cicIds.every(id => st[id] && st[id].st === 'given') && K.d.cmp(cicIds.map(id => st[id].date).sort().pop(), K.d.addMonths(k.dob, 24)) <= 0;
  return { fic, cic, date: last };
};
/* the next group a mother should bring the child for */
K.vax.nextGroup = (k, st, today) => {
  today = today || K.d.today();
  const live = Object.values(st).filter(s => ['due', 'overdue', 'upcoming'].includes(s.st));
  if (!live.length) return null;
  const over = live.filter(s => s.st === 'overdue');
  const first = live.slice().sort((a, b) => K.d.cmp(a.due, b.due))[0];
  const ref = over.length ? over : live.filter(s => K.d.diff(first.due, s.due) <= 14);
  return { items: ref, date: ref.map(s => s.due).sort()[0], status: over.length ? 'overdue' : first.st };
};
K.vax.lbl = (s) => ({ given: K.t('st.given'), due: K.t('st.due'), overdue: K.t('st.overdue'), upcoming: K.t('st.upcoming'), waiting: K.t('vax.later'), missed: K.t('st.missed'), na: K.t('st.na') }[s.st]);
K.vax.tone = (s) => ({ given: 'ok', due: 'due', overdue: 'over', upcoming: 'soon', waiting: 'soon', missed: 'red', na: 'soon' }[s.st]);

/* ---------------------------------------------------------------- tracker screen */
K.route('/card/:id/child/:kid/vax', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  if (!k.dob) return { title: K.t('vax.tracker'), back: K.child.url(c, k).slice(1), html: h`<div class="wrap">${K.ui.callout('warn', '', K.t('vax.needDob'))}</div>` };
  const st = K.vax.state(k); const cnt = K.vax.counts(st); const fic = K.vax.fic(k, st);
  const hcp = K.settings.isHcp(); const vita = K.vax.vitaState(k);
  const ageM = K.d.age(k.dob).months;
  const row = (s) => {
    const it = s.it; const meta = [];
    if (s.st === 'given') meta.push(K.d.fmt(s.date)); else if (s.st === 'waiting') meta.push(K.t('vax.after', { x: (K.vax.LIST.find(i => i.id === s.after) || {}).code || '' })); else if (s.due) meta.push(K.t('vax.dueOn', { d: K.d.fmt(s.due) }));
    if (s.st !== 'given' && s.lim && s.st !== 'missed') meta.push(K.t('vax.upto', { d: K.d.fmt(s.lim) }));
    if (s.why === 'je') meta.push(K.t('vax.jeOnly'));
    if (s.st === 'missed' && s.alt === 'dpt') meta.push(K.t('vax.altDpt')); else if (s.st === 'missed') meta.push(K.t('vax.missedNote'));
    if (it.campaign) meta.push(K.t('vax.hpvNote'));
    return h`<button type="button" class="vrow ${s.st}" data-act="vaxSheet" data-arg="${c.id}|${k.id}|${it.id}" ${s.why === 'sex' ? K.raw('hidden') : ''}>
      <span class="vchip">${s.st === 'given' ? K.ui.icon('check', 'sm') : K.ui.icon('syringe', 'sm')}</span>
      <span class="vbody"><b class="vcode">${it.code}</b><span class="vp">${K.L(it.p)}</span><span class="vm">${meta.join(' · ')}</span>${hcp ? h`<span class="vhow mono">${it.how}</span>` : ''}</span>
      ${K.ui.pill(K.vax.lbl(s), K.vax.tone(s))}</button>`;
  };
  const vrowVita = (x) => h`<button type="button" class="vrow ${x.st}" data-act="vitaSheet" data-arg="${c.id}|${k.id}|${x.v.n}">
      <span class="vchip">${x.st === 'given' ? K.ui.icon('check', 'sm') : K.ui.icon('drop', 'sm')}</span>
      <span class="vbody"><b class="vcode">${x.v.code}</b><span class="vp">${K.L(K.vax.P.vita)}</span><span class="vm">${x.date ? K.d.fmt(x.date) : K.t('vax.dueOn', { d: K.d.fmt(x.due) })}${x.v.alb ? ' · ' + K.t('vita.alb') + (x.alb ? ' ' + K.d.fmt(x.alb) : ' ' + x.albDose) : ''}</span>${hcp ? h`<span class="vhow mono">${x.v.dose} · oral</span>` : ''}</span>
      ${K.ui.pill(K.vax.lbl({ st: x.st }), K.vax.tone({ st: x.st }))}</button>`;
  let nextOpen = false;
  const visits = K.vax.VISITS.filter(v => v.k !== 'y14' || k.sex !== 'm').map(v => {
    const items = K.vax.LIST.filter(it => it.v === v.k).map(it => st[it.id]).filter(Boolean);
    if (!items.length) return '';
    const vn = K.vax.groupVita(v.k); const va = vn ? vita.find(x => x.v.n === vn) : null;
    const allGiven = items.every(s => s.st === 'given' || s.st === 'na') && (!va || va.st === 'given');
    const live = items.some(s => ['due', 'overdue'].includes(s.st)) || (va && ['due', 'overdue'].includes(va.st));
    // open: groups with doses due now, plus the first group still to come; completed and far-off groups stay folded
    let open = live; if (!allGiven && !nextOpen && items.some(s => ['due', 'overdue', 'upcoming', 'waiting'].includes(s.st))) { open = true; nextOpen = true; }
    const markable = items.concat(va && !va.date ? [va] : []).filter(s => ['due', 'overdue'].includes(s.st) || (s.st === 'upcoming' && K.d.diff(K.d.today(), s.due) <= 7));
    return h`<details class="vgroup ${allGiven ? 'done' : ''}" ${open ? K.raw('open') : ''}><summary class="vg-h"><div><h3>${K.L(v.name)}</h3><span class="small faint">${K.d.fmt(K.vax.at(k.dob, v.due))}${v.sub ? ' · ' + K.L(v.sub) : ''}</span></div>
      <div class="vg-r">${markable.length > 1 ? K.ui.btn(K.t('vax.markAll'), { act: 'vaxGroup', arg: `${c.id}|${k.id}|${v.k}`, size: 'sm', tone: 'ghost', icon: 'check' }) : allGiven ? K.ui.pill(K.t('st.done'), 'ok', 'check') : h`<span class="small faint">${K.digits(items.filter(s => s.st === 'given').length)}/${K.digits(items.filter(s => s.st !== 'na').length)}</span>`}${K.ui.icon('down', 'sm vg-chev')}</div></summary>
      <div class="vlist">${items.map(row)}${va ? vrowVita(va) : ''}</div></details>`;
  });
  const missed = Object.values(st).filter(s => s.missedRec);
  return {
    title: K.t('vax.tracker'), sub: K.child.label(k), back: K.child.url(c, k).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + ' · ' + K.d.ageText(k.dob), K.t('vax.tracker'), K.t('vax.six'))}
      <div class="stats">${K.ui.stat(K.t('vax.title'), `${K.digits(cnt.n)}/${K.digits(cnt.t)}`, cnt.n === cnt.t ? '' : 'warn', K.t('vax.progress', { n: cnt.n, t: cnt.t }))}
        ${fic ? K.ui.stat(K.t(fic.cic ? 'vax.cic' : 'vax.' + fic.fic), K.d.fmt(fic.date), '', '') : ''}</div>
      ${!K.settings.get('jeArea') ? h`<p class="small faint" style="margin-top:8px">JE · ${K.t('set.jeSub')} <a href="#/settings">${K.t('more.settings')}</a></p>` : ''}
      <div class="vgroups">${visits}</div>
      <section class="sec" id="vita">${K.ui.secH(K.t('vita.title'))}<p class="small">${K.t('vita.rule')}</p>
        <div class="list">${vita.filter(x => x.v.m <= Math.max(ageM + 12, 9)).map(x => K.ui.li({ act: 'vitaSheet', arg: `${c.id}|${k.id}|${x.v.n}`, icon: x.st === 'given' ? 'check' : 'drop', tone: x.st === 'given' ? 'done' : x.st === 'overdue' ? 'red' : x.st === 'due' ? 'amber' : 'ink',
          title: `${x.v.code} · ${K.t('vita.at', { m: x.v.m })}`, meta: [x.date ? K.t('vita.vitA') + ' ' + K.d.fmt(x.date) : K.d.fmt(x.due) + ' · ' + x.v.dose, x.v.alb ? (x.alb ? K.t('vita.alb') + ' ' + K.d.fmt(x.alb) : K.t('vita.alb') + ' ' + x.albDose) : ''].filter(Boolean).join(' · '),
          trail: K.ui.pill(K.vax.lbl({ st: x.st }), K.vax.tone({ st: x.st })) }))}</div></section>
      ${missed.length ? h`<section class="sec">${K.ui.secH(K.t('vax.missedTable'))}<div class="table"><table><thead><tr><th>${K.t('vax.title')}</th><th>${K.t('date')}</th><th>${K.t('vax.reason')}</th><th>${K.t('vax.nextSession')}</th></tr></thead>
        <tbody>${missed.map(s => h`<tr><td class="num">${s.it.code}</td><td class="num">${K.d.fmt(s.missedRec.date)}</td><td>${s.missedRec.reason || '–'}</td><td class="num">${K.d.fmt(s.missedRec.next)}</td></tr>`)}</tbody></table></div></section>` : ''}
      <section class="sec">${K.ui.secH(K.t('vax.four'))}<div class="k-card"><ol class="four">${K.vax.FOUR.map(x => h`<li>${K.ui.icon(x.icon, 'sm')}<span>${K.L(x.t)}</span></li>`)}</ol></div></section>
      <section class="sec">${K.ui.secH(K.t('vax.know'))}<div class="k-card" id="vax-know"><ul class="ul">${K.vax.KNOW.map(x => h`<li>${K.L(x)}</li>`)}</ul><p style="margin:10px 0 0">${K.ui.say('#vax-know')}</p></div></section>
      <section class="sec"><a class="k-card" href="https://uwin.mohfw.gov.in/" target="_blank" rel="noopener"><b>${K.t('vax.uwin')}</b><p class="small" style="margin:4px 0 0">${K.t('vax.uwinSub')}</p></a></section>
    </div>`,
    mount() { if (K.anchor() === 'vita') { const e = K.$('#vita'); e && e.scrollIntoView(); } },
  };
});

/* doses recorded before their due date (more than 4 days early) or ahead of the previous dose get a confirm, not a block */
K.vax.warnings = (k, ids, date) => {
  const st = K.vax.state(k); const msgs = [];
  ids.forEach(id => {
    const s = st[id]; if (!s || !s.it) return;
    if (s.st === 'waiting') msgs.push(K.t('vax.noPrev', { x: s.it.code, p: (K.vax.LIST.find(i => i.id === s.after) || {}).code || '' }));
    else if (s.due && s.st !== 'given' && K.d.diff(date, s.due) > 4) msgs.push(K.t('vax.early', { x: s.it.code, d: K.d.fmt(s.due) }));
  });
  return msgs;
};
const okToSave = async (k, ids, date) => { const w = K.vax.warnings(k, ids, date); return !w.length || K.ui.confirm(w.join(' '), { title: K.t('vax.check'), ok: K.t('btn.save') }); };

/* mark one dose */
K.acts.vaxSheet = (el) => {
  const [cid, kid, vid] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  const it = K.vax.LIST.find(x => x.id === vid); const rec = (k.vax || {})[vid] || {}; const s = K.vax.state(k)[vid] || {};
  const places = ['session', 'fac', 'pvt', 'campaign'].map(v => ({ v, l: K.t('vpl.' + v) }));
  K.ui.sheet.open(h`<h2>${it.code}</h2><p class="small">${K.L(it.p)}${s.due && !rec.date ? ' · ' + K.t('vax.dueOn', { d: K.d.fmt(s.due) }) : ''}</p>
    ${K.settings.isHcp() ? h`<p class="small mono">${K.t('vax.how')}: ${it.how}</p>` : ''}
    <form class="form" data-form="vaxSave" data-arg="${el.dataset.arg}">
      ${K.ui.field({ name: 'date', type: 'date', label: K.t('vax.givenOn'), value: rec.date || K.d.today(), max: K.d.today(), attrs: { min: k.dob } })}
      ${K.ui.choices({ name: 'place', label: K.t('vax.place'), value: rec.place || 'session', options: places })}
      ${K.ui.field({ name: 'batch', label: K.t('vax.batch'), value: rec.batch, cls: 'mono' })}
      ${K.ui.field({ name: 'reaction', label: K.t('vax.reaction'), value: rec.reaction })}
      <div class="btn-row">${K.ui.btn(K.t('vax.markGiven'), { type: 'submit', icon: 'check' })}${rec.date ? K.ui.btn(K.t('vax.remove'), { act: 'vaxRemove', arg: el.dataset.arg, tone: 'ghost', icon: 'trash' }) : ''}</div>
    </form>
    ${!rec.date ? h`<details class="acc" style="margin-top:14px"><summary>${K.t('vax.notGiven')}</summary><div class="acc-b"><form class="form" data-form="vaxMissed" data-arg="${el.dataset.arg}">
      ${K.ui.field({ name: 'reason', label: K.t('vax.reason'), value: rec.missed && rec.missed.reason })}
      ${K.ui.field({ name: 'next', type: 'date', label: K.t('vax.nextSession'), value: rec.missed && rec.missed.next })}
      ${K.ui.btn(K.t('btn.save'), { type: 'submit', tone: 'ghost' })}</form></div></details>` : ''}`, { label: it.code });
};
K.forms.vaxSave = async (v, f) => {
  const [cid, kid, vid] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  if (!v.date || K.d.diff(v.date, K.d.today()) < 0 || (k.dob && K.d.diff(k.dob, v.date) < 0)) { K.ui.toast(K.t('err.date')); return; }
  if (!(k.vax && k.vax[vid] && k.vax[vid].date) && !(await okToSave(k, [vid], v.date))) return;
  k.vax = k.vax || {}; k.vax[vid] = { date: v.date, place: v.place || '', batch: v.batch || '', reaction: v.reaction || '' };
  await K.store.save(c); K.ui.sheet.close(); K.ui.toast(K.t('saved')); K.refresh();
};
K.forms.vaxMissed = async (v, f) => {
  const [cid, kid, vid] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  k.vax = k.vax || {}; k.vax[vid] = Object.assign({}, k.vax[vid], { missed: { date: K.d.today(), reason: v.reason || '', next: v.next || '' } });
  await K.store.save(c); K.ui.sheet.close(); K.refresh();
};
K.acts.vaxRemove = async (el) => {
  const [cid, kid, vid] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  delete k.vax[vid]; await K.store.save(c); K.ui.sheet.close(); K.refresh();
};
/* mark a whole visit group at a session */
K.vax.groupVita = (vk) => (vk === 'm9' ? 1 : vk === 'm16' ? 2 : 0);
K.acts.vaxGroup = (el) => {
  const [cid, kid, vk] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  const st = K.vax.state(k); const soon = (s) => ['due', 'overdue'].includes(s.st) || (s.st === 'upcoming' && K.d.diff(K.d.today(), s.due) <= 7);
  const items = K.vax.LIST.filter(it => it.v === vk).map(it => st[it.id]).filter(s => s && soon(s));
  const vn = K.vax.groupVita(vk); const va = vn ? K.vax.vitaState(k).find(x => x.v.n === vn) : null;
  const vaOn = va && !va.date && (soon(va) || (vn === 2 && K.d.age(k.dob).months >= 16));
  const v = K.vax.VISITS.find(x => x.k === vk);
  const box = (val, code, sub) => h`<label class="chk"><input type="checkbox" name="ids" value="${val}" checked><span class="box">${K.ui.icon('check', 'sm')}</span><span><b>${code}</b> <span class="small faint">${sub}</span></span></label>`;
  K.ui.sheet.open(h`<h2>${K.L(v.name)}</h2><form class="form" data-form="vaxGroupSave" data-arg="${cid}|${kid}">
    <div class="checklist">${items.map(s => box(s.it.id, s.it.code, K.L(s.it.p)))}${vaOn ? box('VitA' + vn, va.v.code, va.v.dose) : ''}${vaOn && va.v.alb && !va.alb ? box('Alb' + vn, K.t('vita.alb'), va.albDose) : ''}</div>
    ${K.ui.field({ name: 'date', type: 'date', label: K.t('vax.givenOn'), value: K.d.today(), max: K.d.today(), attrs: { min: k.dob } })}
    ${K.ui.choices({ name: 'place', label: K.t('vax.place'), value: 'session', options: ['session', 'fac', 'pvt'].map(x => ({ v: x, l: K.t('vpl.' + x) })) })}
    ${K.ui.btn(K.t('vax.markAll'), { type: 'submit', icon: 'check', block: true })}</form>`);
};
K.forms.vaxGroupSave = async (v, f) => {
  const [cid, kid] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  if (!v.date || K.d.diff(v.date, K.d.today()) < 0 || (k.dob && K.d.diff(k.dob, v.date) < 0)) { K.ui.toast(K.t('err.date')); return; }
  const ids = Array.isArray(v.ids) ? v.ids : []; const vaxIds = ids.filter(id => !/^(VitA|Alb)\d$/.test(id));
  if (!(await okToSave(k, vaxIds, v.date))) return;
  k.vax = k.vax || {}; k.vitA = k.vitA || {}; k.alb = k.alb || {};
  ids.forEach(id => { let m; if ((m = /^VitA(\d)$/.exec(id))) k.vitA[m[1]] = v.date; else if ((m = /^Alb(\d)$/.exec(id))) k.alb[m[1]] = v.date; else k.vax[id] = { date: v.date, place: v.place || '' }; });
  await K.store.save(c); K.ui.sheet.close(); K.ui.toast(K.t('saved')); K.refresh();
};
/* Vitamin A + albendazole sheet */
K.acts.vitaSheet = (el) => {
  const [cid, kid, n] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  const x = K.vax.vitaState(k).find(s => String(s.v.n) === n);
  K.ui.sheet.open(h`<h2>${x.v.code} · ${K.t('vita.at', { m: x.v.m })}</h2><p class="small">${x.v.dose}${x.v.alb ? ' · ' + K.t('vita.alb') + ' ' + x.albDose : ''}</p>
    <form class="form" data-form="vitaSave" data-arg="${el.dataset.arg}">
      ${K.ui.field({ name: 'vitA', type: 'date', label: K.t('vita.vitA'), value: x.date || K.d.today(), max: K.d.today() })}
      ${x.v.alb ? K.ui.field({ name: 'alb', type: 'date', label: K.t('vita.alb'), value: x.alb || K.d.today(), max: K.d.today() }) : ''}
      <div class="btn-row">${K.ui.btn(K.t('btn.save'), { type: 'submit', icon: 'check' })}${x.date ? K.ui.btn(K.t('vax.remove'), { act: 'vitaRemove', arg: el.dataset.arg, tone: 'ghost', icon: 'trash' }) : ''}</div></form>`);
};
K.forms.vitaSave = async (v, f) => {
  const [cid, kid, n] = f.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  k.vitA = k.vitA || {}; k.alb = k.alb || {};
  if (v.vitA) k.vitA[n] = v.vitA; if (v.alb) k.alb[n] = v.alb;
  await K.store.save(c); K.ui.sheet.close(); K.ui.toast(K.t('saved')); K.refresh();
};
K.acts.vitaRemove = async (el) => { const [cid, kid, n] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return; delete (k.vitA || {})[n]; delete (k.alb || {})[n]; await K.store.save(c); K.ui.sheet.close(); K.refresh(); };

/* ---------------------------------------------------------------- child overview section + card pill */
K.child.addSection(10, (c, k) => {
  if (!k.dob) return '';
  const st = K.vax.state(k); const nx = K.vax.nextGroup(k, st); const cnt = K.vax.counts(st); const fic = K.vax.fic(k, st);
  const url = K.child.url(c, k, '/vax');
  return h`<section class="sec">${K.ui.secH(K.t('vax.title'), h`<a class="link" href="${url}">${K.t('see.all')}</a>`)}
    <a class="k-card vax-sum" href="${url}">
      ${nx ? h`<div class="vs-top"><span class="eyebrow" style="margin:0">${nx.status === 'overdue' ? K.t('vax.overdue') : K.t('vax.next')}</span>${K.ui.pill(K.d.rel(nx.date), nx.status === 'overdue' ? 'over' : nx.status === 'due' ? 'due' : 'soon')}</div>
        <div class="vs-codes">${nx.items.map(s => h`<span class="vcode-chip">${s.it.code}</span>`)}</div>
        <span class="small">${K.d.weekday(nx.date)}, ${K.d.fmt(nx.date, 'long')}</span>` : h`<span class="small">${K.t('vax.allDone')}</span>`}
      <div class="vs-foot"><span class="small">${K.t('vax.progress', { n: cnt.n, t: cnt.t })}</span>${fic ? K.ui.pill(K.t(fic.cic ? 'vax.cic' : 'vax.' + fic.fic), 'ok', 'shield') : ''}</div>
      ${K.ui.bar(cnt.t ? cnt.n / cnt.t * 100 : 0, cnt.n < cnt.t ? 'amber' : '')}
    </a></section>`;
});
K.child.cardBits.push((c, k) => {
  if (!k.dob) return '';
  const nx = K.vax.nextGroup(k, K.vax.state(k)); if (!nx) return '';
  if (nx.status === 'overdue') return K.ui.pill(K.t('vax.overdue'), 'over', 'syringe');
  if (K.d.diff(K.d.today(), nx.date) <= 14) return K.ui.pill(`${nx.items[0].it.code}${nx.items.length > 1 ? ' +' + K.digits(nx.items.length - 1) : ''} · ${K.d.fmt(nx.date, 'dm')}`, nx.status === 'due' ? 'due' : 'soon', 'syringe');
  return '';
});

/* ---------------------------------------------------------------- due items */
K.due.add((c, today) => {
  const out = [];
  K.card.kids(c).forEach(k => {
    if (!k.dob) return;
    const st = K.vax.state(k, today);
    const over = Object.values(st).filter(s => s.st === 'overdue');
    const href = K.child.url(c, k, '/vax');
    if (over.length) out.push({ id: 'vaxo' + k.id, kind: 'vax', icon: 'syringe', href, who: K.child.label(k), status: 'overdue', date: over.map(s => s.due).sort()[0],
      title: { en: `${K.child.label(k)}: overdue vaccines ${over.map(s => s.it.code).join(', ')}`, or: `${K.child.label(k)}: ବିଳମ୍ବ ଟୀକା ${over.map(s => s.it.code).join(', ')}` } });
    const soon = Object.values(st).filter(s => s.st === 'due' || (s.st === 'upcoming' && K.d.diff(today, s.due) <= 45));
    const groups = {}; soon.forEach(s => { (groups[s.due] = groups[s.due] || []).push(s); });
    Object.entries(groups).forEach(([d, list]) => out.push({ id: 'vax' + k.id + d, kind: 'vax', icon: 'syringe', href, who: K.child.label(k), date: d,
      title: { en: `${K.child.label(k)}: ${list.map(s => s.it.code).join(', ')}`, or: `${K.child.label(k)}: ${list.map(s => s.it.code).join(', ')} ଟୀକା` } }));
    const va = K.vax.vitaState(k, today).find(x => x.st === 'due' || x.st === 'overdue' || (x.st === 'upcoming' && K.d.diff(today, x.due) <= 30));
    if (va) out.push({ id: 'vita' + k.id, kind: 'vax', icon: 'drop', href: href + '#vita', who: K.child.label(k), date: va.due, status: va.st === 'overdue' ? 'overdue' : undefined,
      title: { en: `${K.child.label(k)}: ${va.v.code}${va.v.alb ? ' + albendazole' : ''}`, or: `${K.child.label(k)}: ${va.v.code}${va.v.alb ? ' + କୃମିନାଶକ' : ''}` } });
  });
  return out;
});
K.summary.add((c) => K.card.kids(c).filter(k => k.dob).map(k => { const st = K.vax.state(k); const nx = K.vax.nextGroup(k, st); const cnt = K.vax.counts(st);
  return `${K.child.label(k)} — ${K.t('vax.progress', { n: cnt.n, t: cnt.t })}${nx ? `; ${K.t('vax.next')}: ${nx.items.map(s => s.it.code).join(', ')} (${K.d.fmt(nx.date)})` : ''}`; }));
