/* ============================================================================
   modules/10-card — family cards: Home list, new card, dashboard, profile
   A card = one mother + her pregnancies + her children (MCP card per family).
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'card.new': { en: 'New family card', or: 'ନୂଆ ପରିବାର କାର୍ଡ' },
  'card.newLede': { en: 'Start with the mother. Everything else can be added later.', or: "ମା'ଙ୍କ ବିବରଣୀରୁ ଆରମ୍ଭ କରନ୍ତୁ। ବାକି ସବୁ ପରେ ଯୋଗ କରିହେବ।" },
  'card.now': { en: 'What is happening now?', or: 'ବର୍ତ୍ତମାନ କ\'ଣ ଅବସ୍ଥା?' },
  'card.nowPreg': { en: 'She is pregnant', or: 'ସେ ଗର୍ଭବତୀ' },
  'card.nowChild': { en: 'She has a baby / young child', or: 'ତାଙ୍କର ଛୋଟ ଶିଶୁ ଅଛି' },
  'card.nowBoth': { en: 'Both', or: 'ଦୁହେଁ' },
  'card.create': { en: 'Create card', or: 'କାର୍ଡ ତିଆରି କରନ୍ତୁ' },
  'card.edit': { en: 'Edit profile & contacts', or: 'ପ୍ରୋଫାଇଲ୍ ଓ ଯୋଗାଯୋଗ ସଂଶୋଧନ' },
  'card.delete': { en: 'Delete this card', or: 'ଏହି କାର୍ଡ ବିଲୋପ କରନ୍ତୁ' },
  'card.deleteQ': { en: 'The card moves to Recently deleted for 30 days.', or: 'କାର୍ଡଟି ୩୦ ଦିନ ପାଇଁ "ନିକଟରେ ବିଲୋପ" ତାଲିକାକୁ ଯିବ।' },
  'card.family': { en: 'Family identification', or: 'ପରିବାର ପରିଚୟ' },
  'card.inst': { en: 'Health & Anganwadi contacts', or: 'ସ୍ୱାସ୍ଥ୍ୟ ଓ ଅଙ୍ଗନୱାଡ଼ି ଯୋଗାଯୋଗ' },
  'card.ids': { en: 'Identity numbers', or: 'ପରିଚୟ ନମ୍ବର' },
  'card.idsNote': { en: 'Aadhaar and bank details are not needed here; keep them on the printed card.', or: 'ଆଧାର ଓ ବ୍ୟାଙ୍କ ବିବରଣୀ ଏଠାରେ ଆବଶ୍ୟକ ନାହିଁ; ସେଗୁଡ଼ିକ ଛପା କାର୍ଡରେ ରଖନ୍ତୁ।' },
  'card.health': { en: 'Health details', or: 'ସ୍ୱାସ୍ଥ୍ୟ ବିବରଣୀ' },
  'card.next': { en: 'Next for this family', or: 'ଏହି ପରିବାର ପାଇଁ ପରବର୍ତ୍ତୀ ସେବା' },
  'card.preg': { en: 'Pregnancy', or: 'ଗର୍ଭାବସ୍ଥା' },
  'card.children': { en: 'Children', or: 'ଶିଶୁ' },
  'card.addPreg': { en: 'Add a pregnancy', or: 'ଗର୍ଭାବସ୍ଥା ଯୋଗ କରନ୍ତୁ' },
  'card.addChild': { en: 'Add a child', or: 'ଶିଶୁ ଯୋଗ କରନ୍ତୁ' },
  'card.noChildren': { en: 'No child added yet.', or: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଶିଶୁ ଯୋଗ ହୋଇନାହିଁ।' },
  'card.contacts': { en: 'Contacts', or: 'ଯୋଗାଯୋଗ' },
  'card.noContacts': { en: 'Add your ASHA, ANM and Anganwadi worker numbers so you can call them from here.', or: 'ଆଶା, ଏ.ଏନ୍.ଏମ୍. ଓ ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀଙ୍କ ନମ୍ବର ଯୋଗ କରନ୍ତୁ, ଯାହାଦ୍ୱାରା ଏଠାରୁ କଲ୍ କରିପାରିବେ।' },
  'card.pastPreg': { en: 'Earlier pregnancies', or: 'ପୂର୍ବ ଗର୍ଭାବସ୍ଥା' },
  'card.actions': { en: 'This card', or: 'ଏହି କାର୍ଡ' },
  'card.sample': { en: 'Sample', or: 'ନମୁନା' },

  'm.name': { en: "Mother's name", or: "ମା'ଙ୍କ ନାମ" },
  'm.dob': { en: 'Date of birth', or: 'ଜନ୍ମ ତାରିଖ' },
  'm.age': { en: 'Age (years)', or: 'ବୟସ (ବର୍ଷ)' },
  'm.ageHint': { en: 'Give date of birth or age', or: 'ଜନ୍ମ ତାରିଖ କିମ୍ବା ବୟସ ଦିଅନ୍ତୁ' },
  'm.husband': { en: "Husband's name", or: 'ସ୍ୱାମୀଙ୍କ ନାମ' },
  'm.phone': { en: 'Mobile number', or: 'ମୋବାଇଲ୍ ନମ୍ବର' },
  'm.phone2': { en: 'Second mobile (family)', or: 'ଦ୍ୱିତୀୟ ମୋବାଇଲ୍ (ପରିବାର)' },
  'm.village': { en: 'Village', or: 'ଗ୍ରାମ' },
  'm.ward': { en: 'Ward', or: 'ୱାର୍ଡ' },
  'm.block': { en: 'Block', or: 'ବ୍ଲକ' },
  'm.district': { en: 'District', or: 'ଜିଲ୍ଲା' },
  'm.rch': { en: 'RCH ID (mother)', or: "ମା'ଙ୍କ RCH ନଂ." },
  'm.abha': { en: 'ABHA ID (mother)', or: "ମା'ଙ୍କ ABHA ID ନଂ." },
  'm.blood': { en: 'Blood group', or: 'ବ୍ଲଡ୍ ଗ୍ରୁପ୍' },
  'm.edu': { en: 'Education', or: 'ଶିକ୍ଷାଗତ ଯୋଗ୍ୟତା' },
  'm.height': { en: 'Height', or: 'ଉଚ୍ଚତା' },
  'm.sickle': { en: 'Sickle cell test', or: 'ସିକିଲ୍ ସେଲ୍ ପରୀକ୍ଷା' },
  'm.mamata': { en: 'Eligible for MAMATA-PMMVY', or: 'ମମତା-ପିଏମ୍‌ଏମ୍‌ଭିୱାଇ ପାଇଁ ଯୋଗ୍ୟ' },
  'edu.0': { en: 'Cannot read', or: 'ନିରକ୍ଷର' }, 'edu.1': { en: 'Primary', or: 'ପ୍ରାଥମିକ' }, 'edu.2': { en: 'Middle', or: 'ମାଧ୍ୟମିକ' },
  'edu.3': { en: 'High school', or: 'ହାଇସ୍କୁଲ' }, 'edu.4': { en: 'Graduate', or: 'ସ୍ନାତକ' }, 'edu.5': { en: 'Post-graduate', or: 'ସ୍ନାତକୋତ୍ତର' },
  'sickle.nt': { en: 'Not tested', or: 'ପରୀକ୍ଷା ହୋଇନାହିଁ' }, 'sickle.AA': { en: 'Normal (AA)', or: 'ସ୍ୱାଭାବିକ (AA)' },
  'sickle.AS': { en: 'Trait / carrier (AS)', or: 'ବାହକ (AS)' }, 'sickle.SS': { en: 'Sickle cell disease (SS)', or: 'ସିକିଲ୍ ସେଲ୍ ରୋଗ (SS)' },
  'sickle.oth': { en: 'Other result', or: 'ଅନ୍ୟ ଫଳାଫଳ' },

  'c.asha': { en: 'ASHA', or: 'ଆଶା କର୍ମୀ' },
  'c.anm': { en: 'ANM (female health worker)', or: 'ମହିଳା ସ୍ୱାସ୍ଥ୍ୟ କର୍ମୀ (ଏ.ଏନ୍.ଏମ୍.)' },
  'c.aww': { en: 'Anganwadi worker', or: 'ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ' },
  'c.name': { en: 'Name', or: 'ନାମ' },
  'c.phone': { en: 'Phone', or: 'ଫୋନ୍' },
  'c.awc': { en: 'Anganwadi centre', or: 'ଅଙ୍ଗନୱାଡ଼ି କେନ୍ଦ୍ର' },
  'c.awcCode': { en: 'AWC code', or: 'ଅଙ୍ଗନୱାଡ଼ି କେନ୍ଦ୍ର କୋଡ୍' },
  'c.sc': { en: 'Sub-centre', or: 'ଉପକେନ୍ଦ୍ର' },
  'c.phc': { en: 'PHC', or: 'ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ର' },
  'c.chc': { en: 'CHC / hospital', or: 'ଗୋଷ୍ଠୀ ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ର / ଡାକ୍ତରଖାନା' },
  'c.dp': { en: 'Nearest delivery point', or: 'ନିକଟବର୍ତ୍ତୀ ଡେଲିଭରି ପଏଣ୍ଟ' },
  'c.fru': { en: 'Nearest FRU', or: 'ନିକଟବର୍ତ୍ତୀ FRU (ଏଫ୍.ଆର୍.ୟୁ.)' },
  'c.mamataDivas': { en: 'Fixed Mamata Divas (VHSND) day', or: 'ନିର୍ଦ୍ଧାରିତ ମମତା ଦିବସ' },
  'c.mamataDivasHint': { en: 'e.g. every 2nd Wednesday', or: 'ଯଥା ପ୍ରତି ମାସର ଦ୍ୱିତୀୟ ବୁଧବାର' },
});

/* ------------------------------------------------------------------ helpers */
K.card = {
  activePreg: c => (c.pregnancies || []).filter(p => p.status === 'active' && !p.delivery).sort(K.by(p => p.createdAt, -1))[0] || null,
  lastDelivered: c => (c.pregnancies || []).filter(p => p.delivery && p.delivery.date).sort(K.by(p => p.delivery.date, -1))[0] || null,
  kids: c => (c.children || []).filter(k => !k.died).sort(K.by(k => k.dob || '', -1)),
  motherAge(c, on) { const m = c.mother || {}; if (m.dob) return K.d.age(m.dob, on).y; if (m.age != null) { const base = (c.createdAt || '').slice(0, 10) || K.d.today(); return m.age + Math.max(0, Math.floor(K.d.diff(base, on || K.d.today()) / 365.25)); } return null; },
  stage(c) {
    const today = K.d.today();
    const p = K.card.activePreg(c);
    if (p && K.preg && K.preg.edd(p)) { const g = K.preg.ga(p, today); return { k: 'preg', p, ga: g }; }
    const d = K.card.lastDelivered(c);
    if (d) { const day = K.d.diff(d.delivery.date, today); if (day >= 0 && day <= 42) return { k: 'pnc', p: d, day }; }
    const kids = K.card.kids(c).filter(k => k.dob && K.d.age(k.dob).y < 6);
    if (kids.length) return { k: 'child', kid: kids[0] };
    if (p) return { k: 'pregNoDate', p };
    return { k: 'none' };
  },
  stagePills(c) {
    const s = K.card.stage(c), out = [];
    if (s.k === 'preg') {
      out.push(K.ui.pill(K.t('stage.preg', { w: s.ga.w }), 'teal', 'mother'));
      const r = K.preg.risk ? K.preg.risk(s.p, c) : null;
      if (r && r.high) out.push(K.ui.pill(K.t('st.high'), 'solid-red', 'alert'));
    } else if (s.k === 'pregNoDate') out.push(K.ui.pill(K.t('stage.pregNoDate'), 'teal', 'mother'));
    else if (s.k === 'pnc') out.push(K.ui.pill(K.t('stage.pnc', { d: s.day }), 'info', 'heart'));
    K.card.kids(c).filter(k => k.dob && K.d.age(k.dob).y < 6).slice(0, 3).forEach(k => out.push(K.ui.pill(`${k.name || K.t('child.baby')} · ${K.d.ageText(k.dob, null, { days: false })}`, k.sex === 'f' ? 'ink' : 'ink', 'baby')));
    return out;
  },
  findPreg: (c, pid) => (c.pregnancies || []).find(p => p.id === pid) || null,
  findKid: (c, kid) => (c.children || []).find(k => k.id === kid) || null,
  load(id) { const c = K.store.card(id); return c && !c.deletedAt ? c : null; },
  tel: (n) => String(n || '').replace(/[^\d+]/g, ''),
};
K.i18n.add({
  'stage.preg': { en: 'Pregnant · {w} wk', or: 'ଗର୍ଭବତୀ · {w} ସପ୍ତାହ' },
  'stage.pregNoDate': { en: 'Pregnant · add LMP', or: 'ଗର୍ଭବତୀ · ଶେଷ ମାସିକ ତାରିଖ ଦିଅନ୍ତୁ' },
  'stage.pnc': { en: 'After delivery · day {d}', or: 'ପ୍ରସବ ପରେ · {d} ଦିନ' },
  'child.baby': { en: 'Baby', or: 'ଶିଶୁ' },
});

/* ------------------------------------------------------------------ home */
K.route('/', () => {
  if (!K.settings.get('onboarded')) return { redirect: '/welcome' };
  const cards = K.store.list();
  const hcp = K.settings.isHcp();
  const lb = K.settings.get('lastBackup');
  const needBackup = cards.some(c => !c.sample) && (!lb || K.d.diff(lb.slice(0, 10), K.d.today()) > 30);
  const due = K.due.all(7).slice(0, hcp ? 8 : 5);
  const cardRow = (c) => {
    const nx = K.due.forCard(c).find(i => i.status !== 'upcoming' || i.days <= 30);
    return h`<a class="k-card cardrow" href="#/card/${c.id}">
      ${K.ui.avatar(c.mother.name, { tone: '' })}
      <span class="who"><b>${c.mother.name || '–'}${c.sample ? h`<span class="sample-badge">${K.t('card.sample')}</span>` : ''}</b>
        <span class="pills">${K.card.stagePills(c)}</span>
        ${nx ? h`<span class="nx">${K.ui.icon('bell')}<span>${K.L(nx.title)} · ${K.due.label(nx)}</span></span>` : ''}</span>
      ${K.ui.icon('chev', 'sm')}</a>`;
  };
  return {
    title: K.t('app.name'), sub: K.t('app.tag'), tab: 'home',
    html: h`<div class="wrap">
      ${!cards.length ? h`<section class="hero">${K.ui.eyebrow(K.t('home.eyebrow'))}<h1>${K.tr('home.title')}</h1><p class="lede">${K.t('app.tag')}</p></section>` : ''}
      <a class="danger-tile" href="#/learn/danger">${K.ui.icon('alert')}<span><b>${K.t('home.danger')}</b><small>${K.t('home.dangerSub')}</small></span>${K.ui.icon('chev')}</a>
      <p></p>
      ${needBackup ? h`${K.ui.callout('warn', '', h`<p>${K.t('home.backupNag')}</p><p style="margin-top:8px">${K.ui.btn(K.t('home.backupNow'), { href: '#/backup', tone: 'ghost', size: 'sm', icon: 'download' })}</p>`, 'download')}<p></p>` : ''}
      <section class="sec">
        ${K.ui.secH(K.t('home.cards'), cards.length ? K.ui.btn(K.t('home.newCard'), { href: '#/card/new', tone: 'ghost', size: 'sm', icon: 'plus' }) : '')}
        ${cards.length ? h`<div class="cards-list">${cards.map(cardRow)}</div>`
          : K.ui.empty('users', K.t('home.noCards'), K.ui.btn(K.t('card.new'), { href: '#/card/new', size: 'lg', icon: 'plus' }))}
      </section>
      ${cards.length ? h`<section class="sec">${K.ui.secH(K.t('home.dueToday'), h`<a class="link" href="#/due">${K.t('see.all')}</a>`)}
        ${due.length ? h`<div class="list">${due.map(it => K.ui.li({ href: it.href, icon: it.icon || 'bell', tone: it.status === 'overdue' ? 'red' : it.status === 'due' ? 'amber' : 'ink',
            title: K.L(it.title), meta: `${(K.store.card(it.cardId) || { mother: {} }).mother.name || ''} · ${K.d.fmt(it.date, 'dm')}`, trail: K.ui.pill(K.due.label(it), K.due.tone(it)) }))}</div>`
          : h`<p class="small">${K.t('home.allClear')}</p>`}</section>` : ''}
      <section class="sec"><div class="tiles">
        <a class="tile" href="#/learn"><span class="ti-ic">${K.ui.icon('book')}</span><b>${K.t('home.learn')}</b><small>${K.t('home.learnSub')}</small></a>
        <a class="tile" href="#/help"><span class="ti-ic red">${K.ui.icon('phone')}</span><b>${K.t('home.help')}</b><small>${K.t('home.helpSub')}</small></a>
        <a class="tile" href="#/tools"><span class="ti-ic info">${K.ui.icon('tools')}</span><b>${K.t('home.tools')}</b><small>${K.t('home.toolsSub')}</small></a>
      </div></section>
      ${K.install.evt ? K.ui.callout('info', K.t('home.install'), K.ui.btn(K.t('home.installBtn'), { act: 'install', tone: 'ghost', size: 'sm', icon: 'download' }), 'download') : ''}
      ${hcp || !cards.length ? h`<p class="tc" style="margin-top:18px">${K.ui.btn(K.t('home.sample'), { act: 'loadSample', tone: 'quiet', size: 'sm', icon: 'sparkle' })}</p>` : ''}
    </div>`,
  };
});

/* ------------------------------------------------------------------ new card */
K.route('/card/new', () => ({
  title: K.t('card.new'), back: '/', tab: 'home',
  html: h`<div class="wrap">${K.ui.phead('', K.t('card.new'), K.t('card.newLede'))}
    <form class="form" data-form="newCard" novalidate>
      <div class="fgroup">
        ${K.ui.field({ name: 'name', label: K.t('m.name'), required: true, attrs: { autocomplete: 'off' } })}
        <div class="frow">${K.ui.field({ name: 'dob', type: 'date', label: K.t('m.dob'), max: K.d.today() })}${K.ui.field({ name: 'age', type: 'number', label: K.t('m.age') })}</div>
        <span class="hint small">${K.t('m.ageHint')}</span>
        ${K.ui.field({ name: 'phone', type: 'tel', label: K.t('m.phone'), attrs: { autocomplete: 'off', maxlength: 14 } })}
        <div class="frow">${K.ui.field({ name: 'village', label: K.t('m.village') })}${K.ui.field({ name: 'husband', label: K.t('m.husband') })}</div>
      </div>
      ${K.ui.choices({ name: 'now', label: K.t('card.now'), value: 'preg', options: [{ v: 'preg', l: K.t('card.nowPreg'), icon: 'mother' }, { v: 'child', l: K.t('card.nowChild'), icon: 'baby' }, { v: 'both', l: K.t('card.nowBoth') }] })}
      ${K.ui.btn(K.t('card.create'), { type: 'submit', size: 'lg', block: true, arrow: true })}
    </form></div>`,
}));
K.forms.newCard = async (v, f) => {
  if (!v.name) { K.ui.toast(K.t('err.required')); f.name.focus(); return; }
  if (v.dob && K.d.diff(v.dob, K.d.today()) < 0) { K.ui.toast(K.t('err.future')); return; }
  const c = K.blank.card();
  Object.assign(c.mother, { name: v.name, dob: v.dob || '', age: v.dob ? null : (v.age || null), phone: v.phone || '', village: v.village || '', husband: v.husband || '' });
  await K.store.save(c);
  if (v.now === 'child') K.go(`/card/${c.id}/child/new`, { replace: true });
  else K.go(`/card/${c.id}/preg/new` + (v.now === 'both' ? '?then=child' : ''), { replace: true });
};

/* ------------------------------------------------------------------ dashboard */
K.route('/card/:id', ({ id }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound();
  const m = c.mother, ct = c.contacts || {};
  const p = K.card.activePreg(c);
  const kids = K.card.kids(c);
  const due = K.due.forCard(c).filter(i => i.days <= 45).slice(0, 6);
  const age = K.card.motherAge(c);
  const meta = [age != null ? K.t('u.years', { n: age }) : '', m.village, m.rchId ? 'RCH ' + m.rchId : ''].filter(Boolean).join(' · ');
  const contact = (role, name, phone) => (name || phone) ? K.ui.li({ icon: 'user', title: name || K.t(role), meta: K.t(role) + (phone ? ' · ' + phone : ''),
    trail: phone ? h`<a class="icon-btn" href="tel:${K.card.tel(phone)}" aria-label="${K.t('btn.call')}">${K.ui.icon('phone')}</a>` : '' }) : '';
  const contactsHtml = [contact('c.asha', ct.asha, ct.ashaPhone), contact('c.anm', ct.anm, ct.anmPhone), contact('c.aww', ct.aww, ct.awwPhone),
    ct.deliveryPoint || ct.deliveryPhone ? contact('c.dp', ct.deliveryPoint, ct.deliveryPhone) : '', ct.mamataDivas ? K.ui.li({ icon: 'calendar', title: ct.mamataDivas, meta: K.t('c.mamataDivas') }) : ''].filter(x => x && String(x));
  const pastPregs = (c.pregnancies || []).filter(x => x !== p).sort(K.by(x => (x.delivery && x.delivery.date) || x.createdAt, -1));
  return {
    title: m.name || K.t('app.name'), sub: K.t('app.tag'), back: '/', tab: 'home',
    html: h`<div class="wrap">
      <header class="phead cardhead">
        <div class="cardrow">${K.ui.avatar(m.name, { lg: true })}<div class="who"><h1>${m.name || '–'}</h1><p class="small" style="margin:2px 0 6px">${meta}</p><span class="pills">${K.card.stagePills(c)}</span></div><span></span></div>
      </header>
      ${c.sample ? K.ui.callout('info', '', K.t('sample.note'), 'sparkle') : ''}
      ${due.length ? h`<section class="sec">${K.ui.secH(K.t('card.next'))}<div class="list">${due.map(it => K.ui.li({ href: it.href, icon: it.icon || 'bell', tone: it.status === 'overdue' ? 'red' : it.status === 'due' ? 'amber' : 'ink',
          title: K.L(it.title), meta: [it.who, K.d.fmt(it.date)].filter(Boolean).join(' · '), trail: K.ui.pill(K.due.label(it), K.due.tone(it)) }))}</div></section>` : ''}
      <section class="sec">${K.ui.secH(K.t('card.preg'))}
        ${p ? (K.preg && K.preg.summaryCard ? K.preg.summaryCard(c, p) : K.ui.li({ href: `#/card/${c.id}/preg/${p.id}`, icon: 'mother', title: K.t('card.preg') }))
          : K.ui.btn(K.t('card.addPreg'), { href: `#/card/${c.id}/preg/new`, tone: 'ghost', icon: 'plus' })}
      </section>
      <section class="sec">${K.ui.secH(K.t('card.children'), K.ui.btn(K.t('card.addChild'), { href: `#/card/${c.id}/child/new`, tone: 'ghost', size: 'sm', icon: 'plus' }))}
        ${kids.length ? h`<div class="cards-list">${kids.map(k => K.child && K.child.summaryCard ? K.child.summaryCard(c, k) : K.ui.li({ href: `#/card/${c.id}/child/${k.id}`, icon: 'baby', title: k.name || K.t('child.baby') }))}</div>`
          : h`<p class="small">${K.t('card.noChildren')}</p>`}
      </section>
      <section class="sec">${K.ui.secH(K.t('card.contacts'), h`<a class="link" href="#/card/${c.id}/edit#contacts">${K.t('btn.edit')}</a>`)}
        ${contactsHtml.length ? h`<div class="list">${contactsHtml}</div>` : h`<p class="small">${K.t('card.noContacts')}</p>`}
      </section>
      ${pastPregs.length ? h`<section class="sec">${K.ui.secH(K.t('card.pastPreg'))}<div class="list">${pastPregs.map(x => K.ui.li({ href: `#/card/${c.id}/preg/${x.id}`, icon: 'mother', tone: 'ink',
          title: x.delivery ? K.t('preg.deliveredOn', { d: K.d.fmt(x.delivery.date) }) : K.t('preg.lmpOn', { d: K.d.fmt(x.lmp) }), meta: x.status === 'ended' ? K.t('preg.ended') : '' }))}</div></section>` : ''}
      <section class="sec">${K.ui.secH(K.t('card.actions'))}<div class="list">
        ${K.ui.li({ href: `#/card/${c.id}/edit`, icon: 'edit', title: K.t('card.edit') })}
        ${K.ui.li({ href: `#/print/${c.id}`, icon: 'print', title: K.t('btn.print') })}
        ${K.ui.li({ act: 'shareCard', arg: c.id, icon: 'share', title: K.t('btn.share') })}
        ${K.ui.li({ act: 'deleteCard', arg: c.id, icon: 'trash', tone: 'red', title: K.t('card.delete') })}
      </div></section>
    </div>`,
  };
});
K.acts.deleteCard = async (el) => {
  if (!(await K.ui.confirm(K.t('card.deleteQ'), { danger: true, ok: K.t('btn.delete') }))) return;
  await K.store.softDelete(el.dataset.arg); K.ui.toast(K.t('deleted')); K.go('/');
};
K.i18n.add({
  'sample.note': { en: 'Sample family for training. Names and numbers are made up.', or: 'ପ୍ରଶିକ୍ଷଣ ପାଇଁ ନମୁନା ପରିବାର। ନାମ ଓ ସଂଖ୍ୟା କାଳ୍ପନିକ।' },
  'preg.deliveredOn': { en: 'Delivered {d}', or: '{d} ରେ ପ୍ରସବ' },
  'preg.lmpOn': { en: 'LMP {d}', or: 'ଶେଷ ମାସିକ {d}' },
  'preg.ended': { en: 'Closed', or: 'ବନ୍ଦ' },
});

/* ------------------------------------------------------------------ profile edit */
K.route('/card/:id/edit', ({ id }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound();
  const m = c.mother, ct = c.contacts || {};
  const hcp = K.settings.isHcp();
  const bg = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(x => ({ v: x, l: x }));
  const F = (name, label, o = {}) => K.ui.field(Object.assign({ name, label, value: K.get(c, name) }, o));
  return {
    title: K.t('card.edit'), back: `/card/${id}`, tab: 'home',
    html: h`<div class="wrap">${K.ui.phead('', K.t('card.edit'))}
    <form class="form" data-form="editCard" data-id="${id}" novalidate>
      <fieldset class="fgroup"><legend>${K.t('card.family')}</legend>
        ${F('mother.name', K.t('m.name'), { required: true })}
        <div class="frow">${F('mother.dob', K.t('m.dob'), { type: 'date', max: K.d.today() })}${F('mother.age', K.t('m.age'), { type: 'number' })}</div>
        ${F('mother.husband', K.t('m.husband'))}
        <div class="frow">${F('mother.phone', K.t('m.phone'), { type: 'tel' })}${F('mother.phone2', K.t('m.phone2'), { type: 'tel' })}</div>
        <div class="frow">${F('mother.village', K.t('m.village'))}${F('mother.ward', K.t('m.ward'))}</div>
        <div class="frow">${F('mother.block', K.t('m.block'))}${F('mother.district', K.t('m.district'))}</div>
        ${F('mother.education', K.t('m.edu'), { type: 'select', options: [0, 1, 2, 3, 4, 5].map(i => ({ v: String(i), l: K.t('edu.' + i) })) })}
      </fieldset>
      <fieldset class="fgroup"><legend>${K.t('card.ids')}</legend>
        ${F('mother.rchId', K.t('m.rch'), { type: 'number', inputmode: 'numeric', cls: 'mono' })}
        ${F('mother.abhaId', K.t('m.abha'), { cls: 'mono', hint: '14 digits · xx-xxxx-xxxx-xxxx' })}
        <p class="small faint" style="margin:0">${K.t('card.idsNote')}</p>
      </fieldset>
      <fieldset class="fgroup"><legend>${K.t('card.health')}</legend>
        <div class="frow">${F('mother.bloodGroup', K.t('m.blood'), { type: 'select', options: bg })}${F('mother.height', K.t('m.height'), { type: 'decimal', unit: K.t('u.cm') })}</div>
        ${F('mother.sickle', K.t('m.sickle'), { type: 'select', options: ['nt', 'AA', 'AS', 'SS', 'oth'].map(x => ({ v: x, l: K.t('sickle.' + x) })) })}
        ${K.ui.yn({ name: 'mother.mamata', q: K.t('m.mamata'), value: m.mamata })}
      </fieldset>
      <fieldset class="fgroup" id="contacts"><legend>${K.t('card.inst')}</legend>
        <div class="frow">${F('contacts.asha', K.t('c.asha'))}${F('contacts.ashaPhone', K.t('c.phone'), { type: 'tel' })}</div>
        <div class="frow">${F('contacts.anm', K.t('c.anm'))}${F('contacts.anmPhone', K.t('c.phone'), { type: 'tel' })}</div>
        <div class="frow">${F('contacts.aww', K.t('c.aww'))}${F('contacts.awwPhone', K.t('c.phone'), { type: 'tel' })}</div>
        <div class="frow">${F('contacts.awc', K.t('c.awc'))}${F('contacts.awcCode', K.t('c.awcCode'), { cls: 'mono' })}</div>
        ${F('contacts.mamataDivas', K.t('c.mamataDivas'), { ph: K.t('c.mamataDivasHint') })}
        <div class="frow">${F('contacts.subCentre', K.t('c.sc'))}${F('contacts.phc', K.t('c.phc'))}</div>
        ${F('contacts.chc', K.t('c.chc'))}
        <div class="frow">${F('contacts.deliveryPoint', K.t('c.dp'))}${F('contacts.deliveryPhone', K.t('c.phone'), { type: 'tel' })}</div>
        <div class="frow">${F('contacts.fru', K.t('c.fru'))}${F('contacts.fruPhone', K.t('c.phone'), { type: 'tel' })}</div>
      </fieldset>
      ${F('notes', K.t('notes'), { type: 'textarea' })}
      <div class="btn-bar">${K.ui.btn(K.t('btn.save'), { type: 'submit', icon: 'check' })}${K.ui.btn(K.t('btn.cancel'), { href: `#/card/${id}`, tone: 'ghost' })}</div>
    </form></div>`,
    mount() { if (location.hash.includes('#contacts')) { const el = K.$('#contacts'); el && el.scrollIntoView(); } },
  };
});
K.forms.editCard = async (v, f) => {
  const c = K.card.load(f.dataset.id); if (!c) return;
  if (!v['mother.name']) { K.ui.toast(K.t('err.required')); return; }
  ['mother.name', 'mother.dob', 'mother.husband', 'mother.phone', 'mother.phone2', 'mother.village', 'mother.ward', 'mother.block', 'mother.district', 'mother.education',
    'mother.abhaId', 'mother.bloodGroup', 'mother.sickle', 'contacts.asha', 'contacts.ashaPhone', 'contacts.anm', 'contacts.anmPhone', 'contacts.aww', 'contacts.awwPhone',
    'contacts.awc', 'contacts.awcCode', 'contacts.mamataDivas', 'contacts.subCentre', 'contacts.phc', 'contacts.chc', 'contacts.deliveryPoint', 'contacts.deliveryPhone',
    'contacts.fru', 'contacts.fruPhone', 'notes'].forEach(k => K.set(c, k, v[k] == null ? '' : String(v[k])));
  K.set(c, 'mother.rchId', v['mother.rchId'] == null ? '' : String(v['mother.rchId']));
  K.set(c, 'mother.age', c.mother.dob ? null : (v['mother.age'] == null ? null : v['mother.age']));
  K.set(c, 'mother.height', v['mother.height'] == null ? null : v['mother.height']);
  K.set(c, 'mother.mamata', v['mother.mamata'] == null ? null : +v['mother.mamata']);
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(`/card/${c.id}`);
};
