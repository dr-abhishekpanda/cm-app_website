/* ============================================================================
   modules/26-fp — family planning after delivery: method basket, timing,
   breastfeeding safety, Odisha beneficiary incentives (MCP V-2023-24 p.42).
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'fp.title': { en: 'Family planning', or: 'ପରିବାର ନିୟୋଜନ' },
  'fp.lede': { en: 'A gap of 3 years between two children is good for the health of both mother and child. Choose any method from the basket of choices.', or: '୨ଟି ପିଲା ମଧ୍ୟରେ ୩ ବର୍ଷ ବ୍ୟବଧାନ ରହିଲେ ଉଭୟ ମା\' ଓ ଛୁଆର ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ ହିତକର। ପରିବାର ନିୟୋଜନ ଯୋଜନାରେ ଯୋଗାଉଥିବା ପସନ୍ଦ ବାସ୍କେଟ୍‌ରୁ ଯେ କୌଣସି ପଦ୍ଧତି ଆପଣ ବ୍ୟବହାର କରିପାରିବେ।' },
  'fp.spacing': { en: 'Spacing methods', or: 'ବ୍ୟବଧାନ ପଦ୍ଧତି' },
  'fp.permanent': { en: 'If your family is complete — permanent methods', or: 'ଯଦି ଆପଣଙ୍କର ପରିବାର ସମ୍ପୂର୍ଣ୍ଣ — ସ୍ଥାୟୀ ପଦ୍ଧତି' },
  'fp.when': { en: 'When to start', or: 'କେବେ ଆରମ୍ଭ କରିବେ' },
  'fp.bfSafe': { en: 'Safe while breastfeeding', or: 'ସ୍ତନ୍ୟପାନ ସମୟରେ ସୁରକ୍ଷିତ' },
  'fp.incentive': { en: 'Incentive (Odisha)', or: 'ପ୍ରୋତ୍ସାହନ ରାଶି (ଓଡ଼ିଶା)' },
  'fp.chosen': { en: 'Method chosen', or: 'ବଛାଯାଇଥିବା ପଦ୍ଧତି' },
  'fp.adopted': { en: 'Date started', or: 'ଆରମ୍ଭ ତାରିଖ' },
  'fp.counselled': { en: 'Counselling given on', or: 'ପରାମର୍ଶ ଦିଆଯାଇଥିବା ତାରିଖ' },
  'fp.none': { en: 'Not decided yet', or: 'ଏପର୍ଯ୍ୟନ୍ତ ସ୍ଥିର ହୋଇନାହିଁ' },
  'fp.save': { en: 'Save choice', or: 'ପସନ୍ଦ ସେଭ୍ କରନ୍ତୁ' },
  'fp.incNote': { en: 'Amounts as printed on the Odisha MCP card V-2023-24; confirm with the ANM.', or: 'ଓଡ଼ିଶା MCP କାର୍ଡ V-2023-24 ରେ ଥିବା ରାଶି; ଏ.ଏନ୍.ଏମ୍.ଙ୍କଠାରୁ ନିଶ୍ଚିତ କରନ୍ତୁ।' },
  'fp.next': { en: 'Choose a method before 6 weeks after delivery', or: 'ପ୍ରସବର ୬ ସପ୍ତାହ ପୂର୍ବରୁ ଗୋଟିଏ ପଦ୍ଧତି ବାଛନ୍ତୁ' },
});

K.fp = {};
K.fp.METHODS = [
  { k: 'lam', group: 'spacing', icon: 'heart', name: { en: 'Breastfeeding method (LAM)', or: 'ସ୍ତନ୍ୟପାନ ପଦ୍ଧତି (LAM)' },
    what: { en: 'Protects only while all three are true: baby under 6 months, only breast milk day and night, and periods have not returned. Start another method by 6 months.', or: 'କେବଳ ଏହି ତିନୋଟି ସତ୍ୟ ଥିବା ପର୍ଯ୍ୟନ୍ତ ସୁରକ୍ଷା ଦିଏ: ଶିଶୁ ୬ ମାସରୁ କମ୍, ଦିନରାତି କେବଳ ମା\' କ୍ଷୀର, ଏବଂ ମାସିକ ଫେରିନାହିଁ। ୬ ମାସ ପୂର୍ବରୁ ଅନ୍ୟ ପଦ୍ଧତି ଆରମ୍ଭ କରନ୍ତୁ।' },
    when: { en: 'From delivery', or: 'ପ୍ରସବ ପରଠାରୁ' }, bf: 1 },
  { k: 'ppiucd', group: 'spacing', icon: 'shield', name: { en: 'Copper-T (IUCD)', or: 'କପର୍-ଟି (ଆଇ ୟୁ ସି ଡି)' },
    what: { en: 'IUCD 380A works for 10 years; IUCD 375 for 5 years. Can be removed whenever you want a child.', or: 'ଆଇ ୟୁ ସି ଡି ୩୮୦ଏ ୧୦ ବର୍ଷ ଲାଗି, ୩୭୫ ୫ ବର୍ଷ ଲାଗି ପ୍ରଭାବ ପକାଇଥାଏ। ଶିଶୁ ଚାହିଁଲେ ଯେକୌଣସି ସମୟରେ କଢ଼ାଯାଇପାରେ।' },
    when: { en: 'Within 48 hours of delivery (PPIUCD), or after 6 weeks (interval IUCD)', or: 'ପ୍ରସବର ୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ (ପ୍ରସବ ପରବର୍ତ୍ତୀ ଆଇ ୟୁ ସି ଡି), କିମ୍ବା ପ୍ରସବର ୬ ସପ୍ତାହ ପରେ' }, bf: 1, inc: '₹300 (PPIUCD / post-abortion IUCD)' },
  { k: 'antara', group: 'spacing', icon: 'syringe', name: { en: 'Injectable (Antara)', or: 'ଗର୍ଭନିରୋଧକ ଇଞ୍ଜେକସନ୍ (ଅନ୍ତରା)' },
    what: { en: 'One injection every 3 months. Available with the ANM.', or: 'ପ୍ରତି ୩ ମାସରେ ଗୋଟିଏ ଇଞ୍ଜେକସନ୍। ମହିଳା ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ନିକଟରେ ଉପଲବ୍ଧ।' },
    when: { en: '6 weeks after delivery', or: 'ପ୍ରସବର ୬ ସପ୍ତାହ ପରେ' }, bf: 1, inc: '₹100 per injection' },
  { k: 'chhaya', group: 'spacing', icon: 'pill', name: { en: 'Weekly pill (Chhaya)', or: 'ସାପ୍ତାହିକ ବଟିକା (ଛାୟା - ସେଣ୍ଟକ୍ରୋମାନ୍)' },
    what: { en: 'Non-hormonal. Twice a week for the first 3 months, then once a week.', or: 'ହରମୋନ୍ ବିହୀନ। ପ୍ରଥମ ୩ ମାସ ସପ୍ତାହକୁ ଦୁଇଥର, ତା\'ପରେ ସପ୍ତାହକୁ ଥରେ।' },
    when: { en: 'Any time after delivery', or: 'ପ୍ରସବ ପରେ ଯେକୌଣସି ସମୟରେ' }, bf: 1 },
  { k: 'pop', group: 'spacing', icon: 'pill', name: { en: 'Progestogen-only pill', or: 'କେବଳ ପ୍ରୋଜେଷ୍ଟେରୋନ୍ ବଟିକା' },
    what: { en: 'One pill every day at the same time.', or: 'ପ୍ରତିଦିନ ସମାନ ସମୟରେ ଗୋଟିଏ ବଟିକା।' },
    when: { en: '6 weeks after delivery', or: 'ପ୍ରସବର ୬ ସପ୍ତାହ ପରେ' }, bf: 1 },
  { k: 'malan', group: 'spacing', icon: 'pill', name: { en: 'Combined pill (Mala-N)', or: 'ସଂଯୁକ୍ତ ଗର୍ଭନିରୋଧକ ବଟିକା (ମାଲା-ଏନ୍)' },
    what: { en: 'One pill every day. Can reduce breast milk in the first months.', or: 'ପ୍ରତିଦିନ ଗୋଟିଏ ବଟିକା। ପ୍ରଥମ ମାସଗୁଡ଼ିକରେ ମା\' କ୍ଷୀର କମାଇପାରେ।' },
    when: { en: 'After 6 months if breastfeeding', or: 'ସ୍ତନ୍ୟପାନ କରାଉଥିଲେ ୬ ମାସ ପରେ' }, bf: 0 },
  { k: 'condom', group: 'spacing', icon: 'shield', name: { en: 'Condom (Nirodh)', or: 'ନିରୋଧ' },
    what: { en: 'Use every time. Also protects from sexually transmitted infections. Free from the ASHA.', or: 'ପ୍ରତି ଥର ବ୍ୟବହାର କରନ୍ତୁ। ଯୌନ ସଂକ୍ରମଣରୁ ମଧ୍ୟ ରକ୍ଷା କରେ। ଆଶାଙ୍କଠାରୁ ମାଗଣା।' },
    when: { en: 'Any time', or: 'ଯେକୌଣସି ସମୟରେ' }, bf: 1 },
  { k: 'implant', group: 'spacing', icon: 'shield', name: { en: 'Implant', or: 'ଇମ୍ପ୍ଲାଣ୍ଟ' },
    what: { en: 'A modern method placed under the skin of the arm; protects continuously for 3 years. Also used after delivery.', or: 'ଇମ୍ପ୍ଲାଣ୍ଟ ଏକ ଆଧୁନିକ ଗର୍ଭନିରୋଧକ ପଦ୍ଧତି ଯାହା କ୍ରମାଗତ ଭାବରେ ତିନିବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ମହିଳାଙ୍କୁ ଅନିଚ୍ଛାକୃତ ଗର୍ଭଧାରଣରୁ ସୁରକ୍ଷା ଯୋଗାଇଥାଏ। ଏହା ଏକ ଫଳପ୍ରଦ ପ୍ରସବ-ପରବର୍ତ୍ତୀ ପଦ୍ଧତି।' },
    when: { en: 'After delivery, where available', or: 'ପ୍ରସବ ପରେ, ଯେଉଁଠାରେ ଉପଲବ୍ଧ' }, bf: 1 },
  { k: 'fster', group: 'permanent', icon: 'flag', name: { en: 'Female sterilisation', or: 'ମହିଳା ବନ୍ଧ୍ୟାକରଣ' },
    what: { en: 'Permanent. Minilap or laparoscopic operation.', or: 'ସ୍ଥାୟୀ। ମିନିଲ୍ୟାପ୍ ବା ଲାପରୋସ୍କୋପି ଅସ୍ତ୍ରୋପଚାର।' },
    when: { en: 'Within 7 days of delivery, or after 6 weeks', or: 'ପ୍ରସବର ୭ ଦିନ ମଧ୍ୟରେ, କିମ୍ବା ୬ ସପ୍ତାହ ପରେ' }, bf: 1, inc: '₹2200 after delivery · ₹1400 interval (minilap / laparoscopy)' },
  { k: 'nsv', group: 'permanent', icon: 'flag', name: { en: 'Male sterilisation (NSV)', or: 'ପୁରୁଷ ବନ୍ଧ୍ୟାକରଣ (NSV)' },
    what: { en: 'Permanent, simple, no-scalpel. Use condoms for 3 months after the operation.', or: 'ସ୍ଥାୟୀ, ସରଳ, ଛୁରୀ ବିନା। ଅସ୍ତ୍ରୋପଚାର ପରେ ୩ ମାସ ପର୍ଯ୍ୟନ୍ତ ନିରୋଧ ବ୍ୟବହାର କରନ୍ତୁ।' },
    when: { en: 'Any time', or: 'ଯେକୌଣସି ସମୟରେ' }, bf: 1, inc: '₹2000' },
];
K.fp.card = (m, chosen) => h`<details class="acc fp ${chosen ? 'on' : ''}"><summary>${K.ui.icon(m.icon, 'sm')}<span>${K.L(m.name)}</span>${chosen ? K.ui.pill(K.t('fp.chosen'), 'ok', 'check') : ''}</summary>
  <div class="acc-b"><p>${K.L(m.what)}</p><dl class="kv"><dt>${K.t('fp.when')}</dt><dd>${K.L(m.when)}</dd><dt>${K.t('fp.bfSafe')}</dt><dd>${m.bf ? K.t('yes') : K.t('no')}</dd>
  ${m.inc ? h`<dt>${K.t('fp.incentive')}</dt><dd class="num">${m.inc}</dd>` : ''}</dl></div></details>`;
K.fp.section = (c, p) => {
  const fp = p.fp || {}; const m = K.fp.METHODS.find(x => x.k === fp.method);
  return h`<section class="sec">${K.ui.secH(K.t('fp.title'), h`<a class="link" href="${K.preg.url(c, p, '/fp')}">${K.t('open')}</a>`)}
    <div class="list">${K.ui.li({ href: K.preg.url(c, p, '/fp'), icon: 'family', tone: m ? 'done' : 'amber', title: m ? K.L(m.name) : K.t('fp.none'), meta: m && fp.date ? K.t('fp.adopted') + ': ' + K.d.fmt(fp.date) : K.t('fp.next') })}</div></section>`;
};
K.route('/card/:id/preg/:pid/fp', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const fp = p.fp || {};
  const grp = (g) => K.fp.METHODS.filter(m => m.group === g).map(m => K.fp.card(m, fp.method === m.k));
  return {
    title: K.t('fp.title'), sub: c.mother.name, back: (p.delivery ? K.preg.url(c, p, '/pnc') : K.preg.url(c, p)).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead('', K.t('fp.title'), K.t('fp.lede'))}
      <section class="sec">${K.ui.eyebrow(K.t('fp.spacing'))}${grp('spacing')}</section>
      <section class="sec">${K.ui.eyebrow(K.t('fp.permanent'))}${grp('permanent')}<p class="foot-note">${K.t('fp.incNote')}</p></section>
      <form class="form" data-form="fpSave" data-id="${id}" data-pid="${pid}"><div class="fgroup">
        ${K.ui.field({ name: 'method', type: 'select', label: K.t('fp.chosen'), value: fp.method, options: K.fp.METHODS.map(m => ({ v: m.k, l: K.L(m.name) })), placeholder: K.t('fp.none') })}
        <div class="frow">${K.ui.field({ name: 'date', type: 'date', label: K.t('fp.adopted'), value: fp.date, max: K.d.today() })}${K.ui.field({ name: 'counselled', type: 'date', label: K.t('fp.counselled'), value: fp.counselled, max: K.d.today() })}</div>
      </div><div class="btn-bar">${K.ui.btn(K.t('fp.save'), { type: 'submit', icon: 'check' })}</div></form>
    </div>`,
  };
});
K.forms.fpSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  p.fp = { method: v.method || '', date: v.date || '', counselled: v.counselled || '' };
  await K.store.save(c); K.ui.toast(K.t('saved')); K.back();
};
K.due.add((c, today) => {
  const out = [];
  (c.pregnancies || []).filter(p => p.delivery && !(p.fp && p.fp.method) && K.d.diff(p.delivery.date, today) <= 60).forEach(p => {
    out.push({ id: 'fp', kind: 'fp', icon: 'family', href: K.preg.url(c, p, '/fp'), title: { en: 'Choose a family planning method', or: 'ପରିବାର ନିୟୋଜନ ପଦ୍ଧତି ବାଛନ୍ତୁ' }, date: K.d.addDays(p.delivery.date, 41) });
  });
  return out;
});
