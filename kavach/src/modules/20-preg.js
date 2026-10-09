/* ============================================================================
   modules/20-preg — pregnancy core: dates (EDD/GA), registration, overview
   Dating: EDD = LMP + 280 days (Naegele), or from an ultrasound
   (scan date + GA at scan) when the health worker chooses USG dating.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'preg.new': { en: 'Register a pregnancy', or: 'ଗର୍ଭାବସ୍ଥା ପଞ୍ଜୀକରଣ' },
  'preg.newLede': { en: 'The first day of the last period (LMP) sets the expected date of delivery and every check-up date.', or: 'ଶେଷ ମାସିକ ଋତୁସ୍ରାବର ପ୍ରଥମ ଦିନ (LMP) ରୁ ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ ଓ ସମସ୍ତ ପରୀକ୍ଷା ତାରିଖ ସ୍ଥିର ହୁଏ।' },
  'preg.lmp': { en: 'First day of last menstrual period (LMP)', or: 'ଶେଷ ମାସିକ ଋତୁସ୍ରାବର ତାରିଖ (LMP)' },
  'preg.lmpUnknown': { en: "LMP not known? Give the expected date of delivery from an ultrasound or the ANM.", or: 'ଶେଷ ମାସିକ ତାରିଖ ଜଣା ନାହିଁ? ଅଲଟ୍ରାସାଉଣ୍ଡ ବା ଏ.ଏନ୍.ଏମ୍.ଙ୍କଠାରୁ ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ ଦିଅନ୍ତୁ।' },
  'preg.eddKnown': { en: 'Expected date of delivery (if LMP not known)', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ (LMP ଜଣା ନଥିଲେ)' },
  'preg.usg': { en: 'Date by ultrasound', or: 'ଅଲଟ୍ରାସାଉଣ୍ଡ ଅନୁସାରେ ତାରିଖ' },
  'preg.usgDate': { en: 'Scan date', or: 'ସ୍କାନ୍ ତାରିଖ' },
  'preg.usgGa': { en: 'Gestational age on the scan', or: 'ସ୍କାନ୍‌ରେ ଗର୍ଭ ବୟସ' },
  'preg.weeks': { en: 'weeks', or: 'ସପ୍ତାହ' },
  'preg.days': { en: 'days', or: 'ଦିନ' },
  'preg.basis': { en: 'Use for dates', or: 'ତାରିଖ ପାଇଁ ବ୍ୟବହାର କରନ୍ତୁ' },
  'preg.basis.lmp': { en: 'LMP', or: 'ଶେଷ ମାସିକ' }, 'preg.basis.usg': { en: 'Ultrasound', or: 'ଅଲଟ୍ରାସାଉଣ୍ଡ' },
  'preg.obs': { en: 'Earlier pregnancies', or: 'ପୂର୍ବ ଗର୍ଭାବସ୍ଥା' },
  'preg.gravida': { en: 'Total pregnancies (with this one)', or: 'ସମୁଦାୟ ଗର୍ଭ ସଂଖ୍ୟା (ଏହା ସହ)' },
  'preg.para': { en: 'Deliveries before', or: 'ପୂର୍ବ ପ୍ରସବ ସଂଖ୍ୟା' },
  'preg.abortions': { en: 'Miscarriages / abortions', or: 'ଗର୍ଭପାତ ସଂଖ୍ୟା' },
  'preg.living': { en: 'Living children', or: 'ଜୀବିତ ଶିଶୁଙ୍କ ସଂଖ୍ୟା' },
  'preg.prevPlace': { en: 'Last delivery was at', or: 'ପୂର୍ବ ପ୍ରସବ କେଉଁଠାରେ ହୋଇଥିଲା' },
  'preg.place.inst': { en: 'Hospital', or: 'ଅନୁଷ୍ଠାନ' }, 'preg.place.home': { en: 'Home', or: 'ଘର' },
  'preg.lastChildDob': { en: "Last child's date of birth", or: 'ଶେଷ ଶିଶୁର ଜନ୍ମ ତାରିଖ' },
  'preg.hist': { en: 'Problems before (tick all that apply)', or: 'ପୂର୍ବରୁ ଥିବା ସମସ୍ୟା (ଯାହା ପ୍ରଯୁଜ୍ୟ ଚିହ୍ନିତ କରନ୍ତୁ)' },
  'preg.village': { en: 'How easy is it to reach a hospital from the village?', or: 'ଗ୍ରାମରୁ ଡାକ୍ତରଖାନା ଯିବା କେତେ ସହଜ?' },
  'preg.village.ok': { en: 'Easy', or: 'ସହଜ' }, 'preg.village.seasonal': { en: 'Hard in rainy season', or: 'ବର୍ଷାଦିନେ କଷ୍ଟକର (ସାମୟିକ ଅପହଞ୍ଚ)' },
  'preg.village.always': { en: 'Always hard to reach', or: 'ସର୍ବଦା କଷ୍ଟକର (ସମ୍ପୂର୍ଣ୍ଣ ଅପହଞ୍ଚ)' },
  'preg.save': { en: 'Save pregnancy', or: 'ଗର୍ଭାବସ୍ଥା ସେଭ୍ କରନ୍ତୁ' },
  'preg.needDate': { en: 'Give the LMP, an ultrasound date, or the expected date of delivery.', or: 'ଶେଷ ମାସିକ ତାରିଖ, ଅଲଟ୍ରାସାଉଣ୍ଡ ତାରିଖ, ବା ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ ଦିଅନ୍ତୁ।' },
  'preg.badLmp': { en: 'This LMP gives a pregnancy longer than 44 weeks. Check the date.', or: 'ଏହି ତାରିଖ ଅନୁସାରେ ଗର୍ଭ ୪୪ ସପ୍ତାହରୁ ଅଧିକ। ତାରିଖ ଯାଞ୍ଚ କରନ୍ତୁ।' },
  'preg.edd': { en: 'Expected date of delivery', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ' },
  'preg.ga': { en: 'Weeks of pregnancy', or: 'ଗର୍ଭର ସପ୍ତାହ' },
  'preg.gaWD': { en: '{w} weeks {d} days', or: '{w} ସପ୍ତାହ {d} ଦିନ' },
  'preg.tri': { en: 'Trimester {n}', or: '{n} ତ୍ରୟମାସିକ' },
  'preg.tri.1': { en: '1st trimester', or: 'ପ୍ରଥମ ତ୍ରୟମାସିକ' }, 'preg.tri.2': { en: '2nd trimester', or: 'ଦ୍ୱିତୀୟ ତ୍ରୟମାସିକ' }, 'preg.tri.3': { en: '3rd trimester', or: 'ତୃତୀୟ ତ୍ରୟମାସିକ' },
  'preg.eddIn': { en: 'Delivery expected {r}', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ {r}' },
  'preg.past': { en: '{n} days past the expected date', or: 'ସମ୍ଭାବ୍ୟ ତାରିଖଠାରୁ {n} ଦିନ ଅଧିକ' },
  'preg.overview': { en: 'Pregnancy', or: 'ଗର୍ଭାବସ୍ଥା' },
  'preg.details': { en: 'Pregnancy details', or: 'ଗର୍ଭାବସ୍ଥା ବିବରଣୀ' },
  'preg.edit': { en: 'Edit pregnancy details', or: 'ଗର୍ଭାବସ୍ଥା ବିବରଣୀ ସଂଶୋଧନ' },
  'preg.close': { en: 'Pregnancy ended without delivery', or: 'ପ୍ରସବ ବିନା ଗର୍ଭାବସ୍ଥା ଶେଷ ହେଲା' },
  'preg.closeLede': { en: 'For miscarriage, abortion or ectopic pregnancy. The record is kept as history.', or: 'ଗର୍ଭପାତ, ଗର୍ଭ ନଷ୍ଟ ବା ଏକ୍ଟୋପିକ୍ ଗର୍ଭ ପାଇଁ। ବିବରଣୀ ଇତିହାସ ଭାବେ ରହିବ।' },
  'preg.endDate': { en: 'Date', or: 'ତାରିଖ' },
  'preg.endType': { en: 'What happened', or: 'କ\'ଣ ହେଲା' },
  'preg.end.misc': { en: 'Miscarriage', or: 'ସ୍ୱତଃ ଗର୍ଭପାତ' }, 'preg.end.mtp': { en: 'Abortion (MTP)', or: 'ଗର୍ଭପାତ (MTP)' }, 'preg.end.ectopic': { en: 'Ectopic pregnancy', or: 'ଏକ୍ଟୋପିକ୍ ଗର୍ଭ' }, 'preg.end.other': { en: 'Other', or: 'ଅନ୍ୟ' },
  'preg.closeBtn': { en: 'Close this pregnancy', or: 'ଏହି ଗର୍ଭାବସ୍ଥା ବନ୍ଦ କରନ୍ତୁ' },
  'preg.closedNote': { en: 'This pregnancy ended on {d} ({t}). After a miscarriage or abortion, ask your ANM about family planning and IFA tablets.', or: 'ଏହି ଗର୍ଭାବସ୍ଥା {d} ରେ ଶେଷ ହୋଇଛି ({t})। ଗର୍ଭପାତ ପରେ ପରିବାର ନିୟୋଜନ ଓ ଆଇ.ଏଫ୍.ଏ. ବଟିକା ବିଷୟରେ ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ପଚାରନ୍ତୁ।' },
  'preg.spacing': { en: 'Less than 2 years since the last birth. Short gaps raise risks for mother and baby; ask about spacing methods after this delivery.', or: 'ଶେଷ ପ୍ରସବରୁ ୨ ବର୍ଷରୁ କମ୍ ସମୟ। ଅଳ୍ପ ବ୍ୟବଧାନ ମା\' ଓ ଶିଶୁ ପାଇଁ ବିପଦ ବଢ଼ାଏ; ଏହି ପ୍ରସବ ପରେ ବ୍ୟବଧାନ ପଦ୍ଧତି ବିଷୟରେ ପଚାରନ୍ତୁ।' },
  'preg.recordDelivery': { en: 'Record the delivery', or: 'ପ୍ରସବ ବିବରଣୀ ଲେଖନ୍ତୁ' },
  'preg.sec.anc': { en: 'Check-ups (ANC)', or: 'ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା (ଏଏନ୍‌ସି)' },
  'preg.sec.tabs': { en: 'Injections & tablets', or: 'ଟୀକା ଓ ବଟିକା' },
  'preg.sec.tests': { en: 'Tests', or: 'ପରୀକ୍ଷା' },
  'preg.sec.plan': { en: 'Birth plan', or: 'ପ୍ରସବ ପ୍ରସ୍ତୁତି' },
  'preg.sec.care': { en: 'Care in pregnancy', or: 'ଗର୍ଭାବସ୍ଥାରେ ଯତ୍ନ' },
  'preg.sec.delivery': { en: 'Delivery', or: 'ପ୍ରସବ' },
  'preg.addAnc': { en: 'Add a check-up', or: 'ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ଯୋଗ କରନ୍ତୁ' },
  'preg.dangerBtn': { en: 'Danger signs', or: 'ବିପଦ ଲକ୍ଷଣ' },
});

/* combined history list: national MCP past/obstetric history + Odisha HRP section ଖ.୧ */
K.preg = K.preg || {};
K.preg.HIST = [
  { k: 'lscs', hrp: 'k12', en: 'Caesarean operation or other surgery on the uterus before', or: 'ଆଗରୁ ଅସ୍ତ୍ରୋପଚାର ଜନିତ ପ୍ରସବ / ଅନ୍ୟ କୌଣସି ଗର୍ଭାଶୟ ଜନିତ ଅସ୍ତ୍ରୋପଚାର' },
  { k: 'bleed', hrp: 'k15', en: 'Heavy bleeding before or after a delivery (APH / PPH)', or: 'ଅତୀତରେ ପ୍ରସବ ପୂର୍ବରୁ ରକ୍ତସ୍ରାବ / ପ୍ରସବ ପରବର୍ତ୍ତୀ ରକ୍ତସ୍ରାବ' },
  { k: 'ecl', hrp: 'k17', en: 'Fits (eclampsia) or high BP in a pregnancy', or: 'ଅତୀତରେ ଗର୍ଭାବସ୍ଥାରେ ବାତ ମାରୁଥିଲା / ଉଚ୍ଚ ରକ୍ତଚାପ ଥିଲା' },
  { k: 'loss', hrp: 'k14', en: 'Stillbirth, newborn death, or baby died of breathing trouble at birth', or: 'ଆଗରୁ ନବଜାତ ଶିଶୁର ମୃତ୍ୟୁ / ଗର୍ଭରେ ମୃତ୍ୟୁ / ଜନ୍ମ ସମୟରେ ଶ୍ୱାସରୁଦ୍ଧ ଜନିତ ମୃତ୍ୟୁ' },
  { k: 'lbw', hrp: 'k13', en: 'Baby born small (low birth weight), early, or growth-restricted', or: 'ପୂର୍ବରୁ ଓଜନ କମ୍ ଶିଶୁ / ପ୍ରିଟର୍ମ ଶିଶୁ / I.U.G.R ଶିଶୁ ଜନ୍ମ' },
  { k: 'ab3', hrp: 'k18', en: 'Three or more miscarriages', or: 'ଅତୀତରେ ଅତିକମ୍‌ରେ ୩ ଥର ସ୍ୱତଃ ଗର୍ଭପାତ' },
  { k: 'compl', hrp: 'k111', en: 'Difficult or obstructed labour before', or: 'ପୂର୍ବ ପ୍ରସବ ଜଟିଳ ଥିଲା' },
  { k: 'anom', hrp: 'k113', en: 'Baby with a birth defect before', or: 'ଆଗରୁ ଜନ୍ମଗତ ତ୍ରୁଟି ଥିବା ଶିଶୁ' },
  { k: 'infert', hrp: 'k110', en: 'Pregnant after long infertility or with treatment (IVF)', or: 'ଦୀର୍ଘ ଦିନ ବନ୍ଧ୍ୟାତ୍ୱ ପରେ ବା କୃତ୍ରିମ ଉପାୟରେ ଗର୍ଭବତୀ' },
  { k: 'dm', hrp: 'k16', en: 'Diabetes', or: 'ମଧୁମେହ' },
  { k: 'heart', hrp: 'k16', en: 'Heart disease', or: 'ହୃଦ୍‌ରୋଗ' },
  { k: 'liver', hrp: 'k16', en: 'Liver disease', or: 'ଯକୃତ ଜନିତ ସମସ୍ୟା' },
  { k: 'htn', hrp: 'k114', en: 'High blood pressure before this pregnancy', or: 'ଗର୍ଭ ପୂର୍ବରୁ ଉଚ୍ଚ ରକ୍ତଚାପ' },
  { k: 'tb', hrp: 'k19', en: 'TB or leprosy', or: 'ଯକ୍ଷ୍ମା କିମ୍ବା କୁଷ୍ଠ' },
  { k: 'hiv', hrp: 'k112', en: 'Known HIV positive', or: 'HIV+ ଚିହ୍ନଟ ହୋଇଥିଲେ' },
  { k: 'thyroid', hrp: 'k23', en: 'Thyroid disease', or: 'ଥାଇରଏଡ୍ ରୋଗ' },
  { k: 'blood', hrp: 'k22', en: 'Thalassaemia or sickle cell disease', or: 'ଥାଲାସେମିଆ / ରକ୍ତ ଶିକୁଳି ରୋଗ' },
  { k: 'asthma', en: 'Asthma', or: 'ଶ୍ୱାସ ରୋଗ (ଆଜ୍‌ମା)' },
];

Object.assign(K.preg, {
  edd(p) {
    if (!p) return null;
    if (p.eddBasis === 'usg' && p.usgDate && p.usgWeeks != null) return K.d.addDays(p.usgDate, 280 - (p.usgWeeks * 7 + (p.usgDays || 0)));
    if (p.lmp) return K.d.addDays(p.lmp, 280);
    if (p.eddKnown) return p.eddKnown;
    if (p.usgDate && p.usgWeeks != null) return K.d.addDays(p.usgDate, 280 - (p.usgWeeks * 7 + (p.usgDays || 0)));
    return null;
  },
  lmpEq(p) { const e = K.preg.edd(p); return e ? K.d.addDays(e, -280) : null; },
  ga(p, on) { const e = K.preg.edd(p); if (!e) return null; const days = 280 - K.d.diff(on || K.d.today(), e); return { days, w: Math.floor(days / 7), d: ((days % 7) + 7) % 7 }; },
  tri: (days) => (days < 98 ? 1 : days < 196 ? 2 : 3),
  gaText: (g) => (g ? K.t('preg.gaWD', { w: g.w, d: g.d }) : '–'),
  gaShort: (g) => (g ? K.digits(`${g.w}w ${g.d}d`) : '–'),
  dateAt(p, weeks, days = 0) { const l = K.preg.lmpEq(p); return l ? K.d.addDays(l, weeks * 7 + days) : null; },
  isActive: (p) => p && p.status === 'active' && !p.delivery,
  url: (c, p, rest = '') => `#/card/${c.id}/preg/${p.id}${rest}`,
  /* latest recorded value of a field across ANC visits */
  latest(p, field) { const v = (p.anc || []).filter(a => a[field] != null && a[field] !== '').sort(K.by('date', -1))[0]; return v ? { v: v[field], date: v.date, visit: v } : null; },
});

/* ---------------------------------------------------------------- registration form (new + edit share it) */
function pregForm(c, p, isNew) {
  const hcp = K.settings.isHcp();
  const F = (name, label, o = {}) => K.ui.field(Object.assign({ name, label, value: p[name] }, o));
  const hist = p.hist || {};
  return h`<form class="form" data-form="pregSave" data-id="${c.id}" data-pid="${isNew ? '' : p.id}" novalidate>
    <fieldset class="fgroup"><legend>${K.t('preg.lmp')}</legend>
      ${F('lmp', '', { type: 'date', max: K.d.today(), hint: K.t('preg.lmpUnknown') })}
      ${F('eddKnown', K.t('preg.eddKnown'), { type: 'date' })}
      <details class="acc" ${p.usgDate ? K.raw('open') : ''}><summary>${K.ui.icon('eye', 'sm')}${K.t('preg.usg')}</summary><div class="acc-b form">
        ${F('usgDate', K.t('preg.usgDate'), { type: 'date', max: K.d.today() })}
        <div class="frow">${F('usgWeeks', K.t('preg.usgGa') + ' · ' + K.t('preg.weeks'), { type: 'number' })}${F('usgDays', K.t('preg.days'), { type: 'number' })}</div>
        ${K.ui.choices({ name: 'eddBasis', label: K.t('preg.basis'), value: p.eddBasis || 'lmp', options: [{ v: 'lmp', l: K.t('preg.basis.lmp') }, { v: 'usg', l: K.t('preg.basis.usg') }] })}
      </div></details>
    </fieldset>
    <fieldset class="fgroup"><legend>${K.t('preg.obs')}</legend>
      <div class="frow">${F('gravida', K.t('preg.gravida'), { type: 'number' })}${F('para', K.t('preg.para'), { type: 'number' })}</div>
      <div class="frow">${F('abortions', K.t('preg.abortions'), { type: 'number' })}${F('living', K.t('preg.living'), { type: 'number' })}</div>
      ${K.ui.choices({ name: 'prevPlace', label: K.t('preg.prevPlace'), value: p.prevPlace, options: [{ v: 'inst', l: K.t('preg.place.inst') }, { v: 'home', l: K.t('preg.place.home') }, { v: 'na', l: K.t('na') }] })}
      ${F('lastChildDob', K.t('preg.lastChildDob'), { type: 'date', max: K.d.today() })}
    </fieldset>
    <fieldset class="fgroup"><legend>${K.t('preg.hist')}</legend>
      <div class="choices">${K.preg.HIST.map(x => h`<label class="choice warn"><input type="checkbox" name="hist" value="${x.k}" ${hist[x.k] ? K.raw('checked') : ''}><span>${K.L(x)}</span></label>`)}</div>
    </fieldset>
    <fieldset class="fgroup"><legend>${K.t('preg.village')}</legend>
      ${K.ui.choices({ name: 'village', value: p.village || 'ok', options: [{ v: 'ok', l: K.t('preg.village.ok') }, { v: 'seasonal', l: K.t('preg.village.seasonal'), tone: 'warn' }, { v: 'always', l: K.t('preg.village.always'), tone: 'warn' }] })}
    </fieldset>
    ${hcp || !isNew ? F('notes', K.t('notes'), { type: 'textarea' }) : ''}
    <div class="btn-bar">${K.ui.btn(K.t('preg.save'), { type: 'submit', icon: 'check' })}${K.ui.btn(K.t('btn.cancel'), { href: isNew ? `#/card/${c.id}` : K.preg.url(c, p), tone: 'ghost' })}</div>
  </form>`;
}
K.route('/card/:id/preg/new', ({ id }, q) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound();
  const act = K.card.activePreg(c); if (act) return { redirect: `/card/${id}/preg/${act.id}` };
  const p = K.blank.pregnancy();
  // prefill obstetric history from children already on the card
  const kids = K.card.kids(c); if (kids.length) { p.living = kids.length; p.lastChildDob = kids[0].dob || ''; }
  return { title: K.t('preg.new'), back: `/card/${id}`, tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(c.mother.name, K.t('preg.new'), K.t('preg.newLede'))}${pregForm(c, p, true)}</div>`, then: q.get('then') };
});
K.route('/card/:id/preg/:pid/edit', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  return { title: K.t('preg.edit'), back: K.preg.url(c, p).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(c.mother.name, K.t('preg.edit'))}${pregForm(c, p, false)}
      <p></p>${K.ui.li({ href: K.preg.url(c, p, '/close'), icon: 'flag', tone: 'ink', title: K.t('preg.close'), meta: K.t('preg.closeLede') })}</div>` };
});
K.forms.pregSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); if (!c) return;
  let p = f.dataset.pid ? K.card.findPreg(c, f.dataset.pid) : null; const isNew = !p;
  if (!p) p = K.blank.pregnancy();
  const today = K.d.today();
  if (!v.lmp && !v.eddKnown && !(v.usgDate && v.usgWeeks != null)) { K.ui.toast(K.t('preg.needDate'), 3500); return; }
  if (v.lmp && K.d.diff(v.lmp, today) > 44 * 7) { K.ui.toast(K.t('preg.badLmp'), 3500); return; }
  Object.assign(p, {
    lmp: v.lmp || '', eddKnown: v.eddKnown || '', usgDate: v.usgDate || '', usgWeeks: v.usgWeeks != null ? v.usgWeeks : null, usgDays: v.usgDays != null ? v.usgDays : null,
    eddBasis: v.eddBasis || (v.lmp ? 'lmp' : (v.usgDate ? 'usg' : 'lmp')),
    gravida: v.gravida != null ? v.gravida : null, para: v.para != null ? v.para : null, abortions: v.abortions != null ? v.abortions : null, living: v.living != null ? v.living : null,
    prevPlace: v.prevPlace || '', lastChildDob: v.lastChildDob || '', village: v.village || 'ok', notes: v.notes != null ? v.notes : (p.notes || ''),
  });
  p.hist = {}; (v.hist || []).forEach(k => { p.hist[k] = 1; });
  if (isNew) c.pregnancies.push(p);
  await K.store.save(c); K.ui.toast(K.t('saved'));
  const then = K._screen && K._screen.then;
  if (isNew && then === 'child') K.go(`/card/${c.id}/child/new`, { replace: true });
  else K.go(K.preg.url(c, p).slice(1), { replace: isNew });
};

/* ---------------------------------------------------------------- close (miscarriage / abortion) */
K.route('/card/:id/preg/:pid/close', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  return { title: K.t('preg.close'), back: K.preg.url(c, p, '/edit').slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(c.mother.name, K.t('preg.close'), K.t('preg.closeLede'))}
      <form class="form" data-form="pregClose" data-id="${id}" data-pid="${pid}">
        <div class="fgroup">${K.ui.field({ name: 'date', type: 'date', label: K.t('preg.endDate'), value: K.d.today(), max: K.d.today(), required: true })}
        ${K.ui.choices({ name: 'type', label: K.t('preg.endType'), value: 'misc', options: ['misc', 'mtp', 'ectopic', 'other'].map(x => ({ v: x, l: K.t('preg.end.' + x) })) })}</div>
        ${K.ui.btn(K.t('preg.closeBtn'), { type: 'submit', tone: 'danger', block: true, size: 'lg' })}
      </form></div>` };
});
K.forms.pregClose = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  p.status = 'ended'; p.ended = { date: v.date || K.d.today(), type: v.type || 'other' };
  await K.store.save(c); K.go(`/card/${c.id}`);
};

/* ---------------------------------------------------------------- GA ring */
K.preg.ring = (g) => {
  const pct = K.clamp(g.days / 280, 0, 1); const r = 46, C = 2 * Math.PI * r;
  return h`<svg class="ga-ring" viewBox="0 0 120 120" role="img" aria-label="${K.preg.gaText(g)}">
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--line)" stroke-width="9"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--primary)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 60 60)"/>
    <text x="60" y="58" text-anchor="middle" class="ga-w">${K.digits(g.w)}</text><text x="60" y="78" text-anchor="middle" class="ga-u">${K.t('preg.weeks')}</text></svg>`;
};

/* ---------------------------------------------------------------- summary card on the family dashboard */
K.preg.summaryCard = (c, p) => {
  const e = K.preg.edd(p), g = K.preg.ga(p);
  const risk = K.preg.risk ? K.preg.risk(p, c) : null;
  if (!g) return K.ui.li({ href: K.preg.url(c, p), icon: 'mother', title: K.t('stage.pregNoDate') });
  const over = K.d.diff(e, K.d.today());
  return h`<a class="k-card preg-sum" href="${K.preg.url(c, p)}">
    ${K.preg.ring(g)}
    <div><b>${K.preg.gaText(g)}</b><span class="small">${K.t('preg.tri.' + K.preg.tri(g.days))}</span>
      <span class="small">${K.t('preg.edd')}: <span class="mono">${K.d.fmt(e)}</span> · ${over > 0 ? K.t('preg.past', { n: over }) : K.d.rel(e)}</span>
      ${risk && risk.high ? h`<span class="pills" style="margin-top:6px">${K.ui.pill(K.t('st.high'), 'solid-red', 'alert')}</span>` : ''}</div>
    ${K.ui.icon('chev', 'sm')}</a>`;
};

/* ---------------------------------------------------------------- overview */
K.preg.sections = []; // modules push (c, p) => K.Raw sections, ordered by .order
K.preg.addSection = (order, fn) => { K.preg.sections.push({ order, fn }); K.preg.sections.sort(K.by('order')); };

K.route('/card/:id/preg/:pid', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound();
  const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const e = K.preg.edd(p), g = K.preg.ga(p), today = K.d.today();
  const active = K.preg.isActive(p);
  const over = e ? K.d.diff(e, today) : 0;
  const kidsLast = p.lastChildDob && K.d.diff(p.lastChildDob, K.preg.lmpEq(p) || today) < 730 - 280;
  let head;
  if (p.status === 'ended') head = K.ui.callout('info', K.t('preg.ended'), K.t('preg.closedNote', { d: K.d.fmt(p.ended.date), t: K.t('preg.end.' + p.ended.type) }));
  else if (p.delivery) head = K.ui.callout('', K.t('preg.deliveredOn', { d: K.d.fmt(p.delivery.date) }), '', 'baby');
  else if (g) head = h`<div class="k-card preg-head">${K.preg.ring(g)}<div>
      ${K.ui.eyebrow(K.t('preg.tri.' + K.preg.tri(g.days)))}
      <h1 class="ga-h">${K.preg.gaText(g)}</h1>
      <p class="small" style="margin:4px 0 0">${K.t('preg.edd')}: <b class="mono">${K.d.fmt(e, 'long')}</b><br>${over > 0 ? h`<span class="pill red">${K.t('preg.past', { n: over })}</span>` : K.t('preg.eddIn', { r: K.d.rel(e) })}</p>
      <div class="ga-track" aria-hidden="true">${K.ui.bar(g.days / 280 * 100)}<div class="ga-ticks"><span>0</span><span>12</span><span>28</span><span>40</span></div></div>
    </div></div>`;
  else head = K.ui.callout('warn', K.t('stage.pregNoDate'), K.t('preg.needDate'));
  const sections = K.preg.sections.map(s => { try { return s.fn(c, p); } catch (err) { console.error(err); return ''; } });
  return {
    title: K.t('preg.overview'), sub: c.mother.name, back: `/card/${id}`, tab: 'home',
    html: h`<div class="wrap">
      ${head}
      ${active && kidsLast ? h`<p></p>${K.ui.callout('warn', '', K.t('preg.spacing'))}` : ''}
      ${active ? h`<div class="btn-row" style="margin:14px 0 18px">${K.ui.btn(K.t('preg.addAnc'), { href: K.preg.url(c, p, '/anc/new'), icon: 'plus' })}${K.ui.btn(K.t('preg.dangerBtn'), { href: '#/learn/danger/preg', tone: 'ghost', icon: 'alert' })}</div>` : h`<p></p>`}
      ${sections}
      <section class="sec">${K.ui.secH(K.t('preg.details'))}<div class="list">
        ${K.ui.li({ href: K.preg.url(c, p, '/edit'), icon: 'edit', title: K.t('preg.edit'), meta: [p.lmp ? K.t('preg.lmpOn', { d: K.d.fmt(p.lmp) }) : '', p.gravida ? `G${p.gravida} P${p.para || 0} A${p.abortions || 0} L${p.living || 0}` : ''].filter(Boolean).join(' · ') })}
      </div></section>
    </div>`,
  };
});

/* summary line for shared text */
K.summary.add((c) => {
  const p = K.card.activePreg(c); if (!p) return [];
  const g = K.preg.ga(p), e = K.preg.edd(p); if (!g) return [];
  const r = K.preg.risk ? K.preg.risk(p, c) : null;
  return [`${K.t('preg.overview')}: ${K.preg.gaText(g)} · ${K.t('preg.edd')} ${K.d.fmt(e)}${r && r.high ? ' · ' + K.t('st.high') : ''}`];
});
