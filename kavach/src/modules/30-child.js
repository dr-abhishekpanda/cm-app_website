/* ============================================================================
   modules/30-child — child record: add/edit, overview, summary card
   Sections on the overview come from other modules via K.child.addSection.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'child.new': { en: 'Add a child', or: 'ଶିଶୁ ଯୋଗ କରନ୍ତୁ' },
  'child.edit': { en: "Edit child's details", or: 'ଶିଶୁର ବିବରଣୀ ସଂଶୋଧନ' },
  'child.name': { en: "Child's name", or: 'ଶିଶୁର ନାମ' },
  'child.nameHint': { en: 'Leave blank if not named yet', or: 'ନାମକରଣ ହୋଇନଥିଲେ ଖାଲି ରଖନ୍ତୁ' },
  'child.sex': { en: 'Sex', or: 'ଶିଶୁର ଲିଙ୍ଗ' }, 'sex.f': { en: 'Girl', or: 'ଝିଅ' }, 'sex.m': { en: 'Boy', or: 'ପୁଅ' },
  'child.dob': { en: 'Date of birth', or: 'ଜନ୍ମ ତାରିଖ' },
  'child.bw': { en: 'Birth weight', or: 'ଜନ୍ମ ସମୟରେ ଓଜନ' },
  'child.bwHint': { en: 'In kg, for example 2.8', or: 'କି.ଗ୍ରା.ରେ, ଯେପରି 2.8' },
  'child.ga': { en: 'Weeks of pregnancy at birth', or: 'ଜନ୍ମ ସମୟରେ ଗର୍ଭର ସପ୍ତାହ' },
  'child.gaHint': { en: 'Needed for babies born early (before 37 weeks)', or: 'ସମୟ ପୂର୍ବରୁ (୩୭ ସପ୍ତାହ ପୂର୍ବରୁ) ଜନ୍ମିତ ଶିଶୁ ପାଇଁ ଆବଶ୍ୟକ' },
  'child.ids': { en: 'Registration', or: 'ପଞ୍ଜୀକରଣ' },
  'child.birthReg': { en: 'Birth registration number', or: 'ଜନ୍ମ ପଞ୍ଜୀକରଣ ନଂ.' },
  'child.rch': { en: 'RCH ID (child)', or: 'ଶିଶୁର RCH ନଂ.' },
  'child.abha': { en: 'ABHA ID (child)', or: 'ଶିଶୁର ABHA ID ନଂ.' },
  'child.birth': { en: 'At birth', or: 'ଜନ୍ମ ସମୟରେ' },
  'child.cried': { en: 'Cried immediately after birth', or: 'ଶିଶୁ ଜନ୍ମ ହେବା ସଙ୍ଗେ ସଙ୍ଗେ କାନ୍ଦିଲା' },
  'child.resus': { en: 'If not, was resuscitation done?', or: 'ଯଦି ନା, ରିସସିଟେସନ କରାଯାଇଥିଲା କି?' },
  'child.bf': { en: 'Breastfeeding started', or: 'ଶିଶୁକୁ ସ୍ତନ୍ୟପାନ କରାଇବା' },
  'bf.1h': { en: 'Within 1 hour', or: 'ଜନ୍ମ ହେବାର ୧ ଘଣ୍ଟା ମଧ୍ୟରେ' }, 'bf.24h': { en: 'Within 24 hours', or: 'ଜନ୍ମ ହେବାର ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ' }, 'bf.late': { en: 'After 24 hours', or: 'ଜନ୍ମ ହେବାର ୨୪ ଘଣ୍ଟା ପରେ' },
  'child.colostrum': { en: 'First yellow milk (colostrum) given', or: 'ଶାଲଦୁଧ (ପ୍ରଥମ ହଳଦିଆ କ୍ଷୀର) ଦିଆଗଲା' },
  'child.vitk': { en: 'Vitamin K injection given', or: 'ଭିଟାମିନ୍ କେ ଦିଆଯାଇଥିଲା' },
  'child.sncu': { en: 'Admitted to SNCU / NBSU', or: 'ଏସ୍.ଏନ୍.ସି.ୟୁ. / ଏନ୍.ବି.ଏସ୍.ୟୁ.ରେ ଭର୍ତ୍ତି' },
  'child.sncuDis': { en: 'Discharge date', or: 'ଡିସ୍‌ଚାର୍ଜ ତାରିଖ' },
  'child.save': { en: 'Save child', or: 'ଶିଶୁ ସେଭ୍ କରନ୍ତୁ' },
  'child.photo': { en: 'Photo', or: 'ଫଟୋ' },
  'child.addPhoto': { en: 'Add photo', or: 'ଫଟୋ ଯୋଗ କରନ୍ତୁ' },
  'child.age': { en: 'Age', or: 'ବୟସ' },
  'child.corrected': { en: 'Corrected age {a} (born {w} weeks early)', or: 'ସଂଶୋଧିତ ବୟସ {a} ({w} ସପ୍ତାହ ଆଗରୁ ଜନ୍ମ)' },
  'child.lbw': { en: 'Low birth weight', or: 'କମ୍ ଓଜନ' }, 'child.vlbw': { en: 'Very low birth weight', or: 'ଅତି କମ୍ ଓଜନ' },
  'child.preterm': { en: 'Born early', or: 'ସମୟ ପୂର୍ବରୁ ଜନ୍ମ' },
  'child.details': { en: "Child's details", or: 'ଶିଶୁର ବିବରଣୀ' },
  'child.delete': { en: 'Remove this child from the card', or: 'ଏହି ଶିଶୁକୁ କାର୍ଡରୁ ହଟାନ୍ତୁ' },
  'child.deleteQ': { en: "All of this child's records (vaccines, weights) will be removed.", or: 'ଏହି ଶିଶୁର ସମସ୍ତ ବିବରଣୀ (ଟୀକା, ଓଜନ) ହଟିଯିବ।' },
  'child.lbwCare': { en: 'Baby under 2.5 kg: keep the baby warm with skin-to-skin contact (Kangaroo Mother Care), breastfeed often, and ask the ANM for extra visits.', or: 'ଶିଶୁର ଓଜନ ୨.୫ କି.ଗ୍ରା.ରୁ କମ୍: ମା\'ଙ୍କ ଛାତିରେ ଲଗାଇ ଉଷୁମ ରଖନ୍ତୁ (କଙ୍ଗାରୁ ମଦର୍ କେୟାର), ବାରମ୍ବାର ସ୍ତନ୍ୟପାନ କରାନ୍ତୁ ଏବଂ ଅଧିକ ଗୃହ ପରିଦର୍ଶନ ପାଇଁ ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ କୁହନ୍ତୁ।' },
  'child.rop': { en: 'Eye check for ROP by an eye doctor before 1 month of age (born before 34 weeks or under 2 kg).', or: 'ଏକ ମାସ ବୟସ ମଧ୍ୟରେ ଚକ୍ଷୁ ଡାକ୍ତରଙ୍କ ପାଖରେ ROP ଚକ୍ଷୁ ପରୀକ୍ଷା (୩୪ ସପ୍ତାହ ପୂର୍ବରୁ ଜନ୍ମ ବା ୨ କି.ଗ୍ରା.ରୁ କମ୍ ଓଜନ)।' },
  'child.ropDone': { en: 'ROP eye check done on', or: 'ROP ଚକ୍ଷୁ ପରୀକ୍ଷା ତାରିଖ' },
  'child.dangerBtn': { en: 'Danger signs', or: 'ବିପଦ ଲକ୍ଷଣ' },
});

K.child = K.child || {};
K.child.sections = [];
K.child.addSection = (order, fn) => { K.child.sections.push({ order, fn }); K.child.sections.sort(K.by('order')); };
Object.assign(K.child, {
  url: (c, k, rest = '') => `#/card/${c.id}/child/${k.id}${rest}`,
  label: (k) => k.name || (k.sex === 'f' ? K.t('sex.f') : k.sex === 'm' ? K.t('sex.m') : K.t('child.baby')),
  preterm: (k) => k.gaWeeks != null && k.gaWeeks < 37,
  /* corrected age for babies born before 37 weeks, used until 2 years */
  correctedDob: (k) => (K.child.preterm(k) && k.dob ? K.d.addDays(k.dob, (40 - k.gaWeeks) * 7) : k.dob),
  useCorrected: (k, on) => K.child.preterm(k) && k.dob && K.d.age(k.dob, on).months < 24,
  tone: (k) => (k.sex === 'f' ? 'pink' : k.sex === 'm' ? 'blue' : ''),
  bwClass(k) { const w = k.birthWeight; if (w == null) return null; if (w < 1.5) return { k: 'vlbw', tone: 'red' }; if (w < 2.5) return { k: 'lbw', tone: 'amber' }; return null; },
  ropNeeded: (k) => (k.gaWeeks != null && k.gaWeeks < 34) || (k.birthWeight != null && k.birthWeight < 2),
});

/* dashboard tile */
K.child.summaryCard = (c, k) => {
  const bits = K.child.cardBits.map(fn => { try { return fn(c, k); } catch (e) { return ''; } }).filter(Boolean);
  return h`<a class="k-card cardrow" href="${K.child.url(c, k)}">
    ${K.ui.avatar(K.child.label(k), { tone: K.child.tone(k), img: k.photoThumb })}
    <span class="who"><b>${K.child.label(k)}</b><span class="small">${k.dob ? K.d.ageText(k.dob) : '–'}${k.dob ? ' · ' + K.d.fmt(k.dob) : ''}</span>
      ${bits.length ? h`<span class="pills">${bits}</span>` : ''}</span>${K.ui.icon('chev', 'sm')}</a>`;
};
K.child.cardBits = []; // modules push (c,k) => pill
/* small status tiles on the child overview (development, feeding, IFA syrup, home visits, sick child):
   modules call K.child.addTile(order, (c, k) => ({ icon, tone, title, sub, href }) | null) */
K.child.tiles = [];
K.child.addTile = (order, fn) => { K.child.tiles.push({ order, fn }); K.child.tiles.sort(K.by('order')); };
K.child.addSection(30, (c, k) => {
  if (!k.dob) return '';
  const tiles = K.child.tiles.map(t => { try { return t.fn(c, k); } catch (e) { console.error(e); return null; } }).filter(Boolean);
  if (!tiles.length) return '';
  return h`<section class="sec"><div class="tiles ctiles">${tiles.map(t => h`<a class="tile" href="${t.href}"><span class="ti-ic ${t.tone || ''}">${K.ui.icon(t.icon)}</span><b>${t.title}</b>${t.sub ? h`<small>${t.sub}</small>` : ''}</a>`)}</div></section>`;
});

/* ---------------------------------------------------------------- form */
function childForm(c, k, isNew) {
  const b = k.birth || {};
  const F = (name, label, o = {}) => K.ui.field(Object.assign({ name, label, value: k[name] }, o));
  return h`<form class="form" data-form="childSave" data-id="${c.id}" data-kid="${isNew ? '' : k.id}" novalidate>
    <div class="fgroup">
      ${F('name', K.t('child.name'), { hint: K.t('child.nameHint'), attrs: { autocomplete: 'off' } })}
      ${K.ui.choices({ name: 'sex', label: K.t('child.sex'), value: k.sex, options: [{ v: 'f', l: K.t('sex.f') }, { v: 'm', l: K.t('sex.m') }] })}
      ${F('dob', K.t('child.dob'), { type: 'date', max: K.d.today(), required: true })}
      <div class="frow">${F('birthWeight', K.t('child.bw'), { type: 'decimal', unit: K.t('u.kg'), hint: K.t('child.bwHint') })}${F('gaWeeks', K.t('child.ga'), { type: 'number', hint: K.t('child.gaHint') })}</div>
    </div>
    <fieldset class="fgroup"><legend>${K.t('child.birth')}</legend>
      ${K.ui.yn({ name: 'cried', q: K.t('child.cried'), value: b.cried, pos: true })}
      ${K.ui.yn({ name: 'resus', q: K.t('child.resus'), value: b.resus })}
      ${K.ui.choices({ name: 'bf', label: K.t('child.bf'), value: b.bf, options: ['1h', '24h', 'late'].map(v => ({ v, l: K.t('bf.' + v), tone: v === 'late' ? 'warn' : '' })) })}
      ${K.ui.yn({ name: 'colostrum', q: K.t('child.colostrum'), value: b.colostrum, pos: true })}
      ${K.ui.yn({ name: 'vitk', q: K.t('child.vitk'), value: b.vitk, pos: true })}
      ${K.ui.yn({ name: 'sncu', q: K.t('child.sncu'), value: b.sncu })}
      ${F('sncuDischarge', K.t('child.sncuDis'), { type: 'date', max: K.d.today(), value: b.sncuDischarge })}
    </fieldset>
    <fieldset class="fgroup"><legend>${K.t('child.ids')}</legend>
      ${F('birthRegNo', K.t('child.birthReg'), { cls: 'mono' })}
      <div class="frow">${F('rchId', K.t('child.rch'), { cls: 'mono', type: 'number', inputmode: 'numeric' })}${F('abhaId', K.t('child.abha'), { cls: 'mono' })}</div>
    </fieldset>
    <div class="fgroup"><div class="field"><span class="lbl">${K.t('child.photo')}</span>
      <label class="btn ghost sm" style="justify-self:start">${K.ui.icon('upload')}<span>${K.t('child.addPhoto')}</span><input type="file" accept="image/*" capture="environment" name="photoFile" hidden data-live="photoPick"></label>
      <div id="photo-prev">${k.photoThumb ? h`<img src="${k.photoThumb}" alt="" class="photo-prev">` : ''}</div></div></div>
    <div class="btn-bar">${K.ui.btn(K.t('child.save'), { type: 'submit', icon: 'check' })}${K.ui.btn(K.t('btn.cancel'), { href: isNew ? `#/card/${c.id}` : K.child.url(c, k), tone: 'ghost' })}</div>
  </form>`;
}
/* photo → small JPEG thumbnail kept in the card (≈20–40 KB) */
K.child._photo = null;
K.live.photoPick = async (el) => {
  const f = el.files && el.files[0]; if (!f) return;
  const url = URL.createObjectURL(f); const img = new Image();
  img.onload = () => { const s = 360 / Math.max(img.width, img.height); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * Math.min(1, s)); cv.height = Math.round(img.height * Math.min(1, s));
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); K.child._photo = cv.toDataURL('image/jpeg', 0.72); URL.revokeObjectURL(url);
    K.$('#photo-prev').innerHTML = K.hv(K.h`<img src="${K.child._photo}" alt="" class="photo-prev">`); };
  img.src = url;
};

K.route('/card/:id/child/new', ({ id }, q) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound();
  K.child._photo = null;
  const k = K.blank.child();
  return { title: K.t('child.new'), sub: c.mother.name, back: `/card/${id}`, tab: 'home', html: h`<div class="wrap">${K.ui.phead(c.mother.name, K.t('child.new'))}${childForm(c, k, true)}</div>` };
});
K.route('/card/:id/child/:kid/edit', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  K.child._photo = null;
  return { title: K.t('child.edit'), sub: K.child.label(k), back: K.child.url(c, k).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(c.mother.name, K.t('child.edit'))}${childForm(c, k, false)}<p></p>
      <div class="list">${K.ui.li({ act: 'childDelete', arg: `${c.id}|${k.id}`, icon: 'trash', tone: 'red', title: K.t('child.delete') })}</div></div>` };
});
K.forms.childSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); if (!c) return;
  if (!v.dob || !K.d.valid(v.dob)) { K.ui.toast(K.t('err.date')); return; }
  if (K.d.diff(v.dob, K.d.today()) < 0) { K.ui.toast(K.t('err.future')); return; }
  let k = f.dataset.kid ? K.card.findKid(c, f.dataset.kid) : null; const isNew = !k;
  if (!k) { k = K.blank.child(); c.children.push(k); }
  let bw = v.birthWeight; if (bw != null && bw > 20) bw = bw / 1000; // typed in grams
  Object.assign(k, { name: v.name || '', sex: v.sex || '', dob: v.dob, birthWeight: bw != null ? K.round(bw, 3) : null, gaWeeks: v.gaWeeks != null ? v.gaWeeks : null,
    birthRegNo: v.birthRegNo || '', rchId: v.rchId != null ? String(v.rchId) : '', abhaId: v.abhaId || '' });
  k.birth = Object.assign(k.birth || {}, { cried: v.cried == null ? null : +v.cried, resus: v.resus == null ? null : +v.resus, bf: v.bf || '', colostrum: v.colostrum == null ? null : +v.colostrum,
    vitk: v.vitk == null ? null : +v.vitk, sncu: v.sncu == null ? null : +v.sncu, sncuDischarge: v.sncuDischarge || '' });
  if (K.child._photo) { k.photoThumb = K.child._photo; K.child._photo = null; }
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.child.url(c, k).slice(1), { replace: isNew });
};
K.acts.childDelete = async (el) => {
  const [cid, kid] = el.dataset.arg.split('|'); const c = K.card.load(cid); if (!c) return;
  if (!(await K.ui.confirm(K.t('child.deleteQ'), { danger: true, ok: K.t('btn.delete') }))) return;
  c.children = c.children.filter(x => x.id !== kid); await K.store.save(c); K.go(`/card/${cid}`);
};

/* ---------------------------------------------------------------- overview */
K.route('/card/:id/child/:kid', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  const a = k.dob ? K.d.age(k.dob) : null; const bw = K.child.bwClass(k);
  const corr = K.child.useCorrected(k) ? K.t('child.corrected', { a: K.d.ageText(K.child.correctedDob(k)), w: 40 - k.gaWeeks }) : '';
  const sections = K.child.sections.map(s => { try { return s.fn(c, k); } catch (e) { console.error(e); return ''; } });
  return {
    title: K.child.label(k), sub: c.mother.name, back: `/card/${id}`, tab: 'home',
    html: h`<div class="wrap">
      <header class="phead cardhead"><div class="cardrow">${K.ui.avatar(K.child.label(k), { lg: true, tone: K.child.tone(k), img: k.photoThumb })}
        <div class="who"><h1>${K.child.label(k)}</h1><p class="small" style="margin:2px 0 6px">${a ? K.d.ageText(k.dob) : '–'} · ${K.d.fmt(k.dob, 'long')}${corr ? h`<br>${corr}` : ''}</p>
        <span class="pills">${k.sex ? K.ui.pill(K.t('sex.' + k.sex), 'ink') : ''}${k.birthWeight != null ? K.ui.pill(`${K.n(k.birthWeight, 2)} ${K.t('u.kg')}`, bw ? bw.tone : 'ink') : ''}${bw ? K.ui.pill(K.t('child.' + bw.k), bw.tone) : ''}${K.child.preterm(k) ? K.ui.pill(K.t('child.preterm'), 'amber') : ''}</span></div><span></span></div></header>
      <div class="btn-row" style="margin:0 0 16px">${K.ui.btn(K.t('child.dangerBtn'), { href: a && a.days < 60 ? '#/learn/danger/newborn' : '#/learn/danger/child', tone: 'ghost', icon: 'alert' })}</div>
      ${sections}
      <section class="sec">${K.ui.secH(K.t('child.details'))}<div class="list">${K.ui.li({ href: K.child.url(c, k, '/edit'), icon: 'edit', title: K.t('child.edit'), meta: [k.rchId ? 'RCH ' + k.rchId : '', k.birthRegNo ? K.t('child.birthReg') + ' ' + k.birthRegNo : ''].filter(Boolean).join(' · ') })}</div></section>
    </div>`,
  };
});

/* newborn alerts section: LBW care + ROP reminder */
K.child.addSection(2, (c, k) => {
  if (!k.dob) return '';
  const a = K.d.age(k.dob); const out = [];
  if (k.birthWeight != null && k.birthWeight < 2.5 && a.days <= 90) out.push(K.ui.callout('warn', K.t('child.lbw'), K.t('child.lbwCare'), 'heart'));
  if (K.child.ropNeeded(k) && a.days <= 60 && !k.ropDate) out.push(K.ui.callout('warn', 'ROP', h`<p>${K.t('child.rop')}</p><form class="form" data-form="ropSave" data-id="${c.id}" data-kid="${k.id}" style="margin-top:8px"><div class="frow">${K.ui.field({ name: 'ropDate', type: 'date', label: K.t('child.ropDone'), max: K.d.today() })}<div style="align-self:end">${K.ui.btn(K.t('btn.save'), { type: 'submit', size: 'sm' })}</div></div></form>`, 'eye'));
  return out.length ? h`<div class="stack" style="margin-bottom:16px">${out}</div>` : '';
});
K.forms.ropSave = async (v, f) => { const c = K.card.load(f.dataset.id); const k = c && K.card.findKid(c, f.dataset.kid); if (!k || !v.ropDate) return; k.ropDate = v.ropDate; await K.store.save(c); K.refresh(); };
K.due.add((c, today) => {
  const out = [];
  K.card.kids(c).forEach(k => { if (k.dob && K.child.ropNeeded(k) && !k.ropDate && K.d.diff(k.dob, today) <= 60)
    out.push({ id: 'rop' + k.id, kind: 'test', icon: 'eye', href: K.child.url(c, k), who: K.child.label(k), title: { en: 'ROP eye check (before 1 month)', or: 'ROP ଚକ୍ଷୁ ପରୀକ୍ଷା (୧ ମାସ ପୂର୍ବରୁ)' }, date: K.d.addDays(k.dob, 20) }); });
  return out;
});
K.summary.add((c) => K.card.kids(c).map(k => `${K.child.label(k)}: ${K.d.fmt(k.dob)} (${K.d.ageText(k.dob)})${k.birthWeight != null ? ', ' + K.t('child.bw') + ' ' + K.n(k.birthWeight, 2) + ' kg' : ''}`));
