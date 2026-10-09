/* ============================================================================
   modules/22-hrp — high-risk pregnancy assessment
   Items follow "ଗର୍ଭବତୀ ମହିଳାଙ୍କର ବ୍ୟକ୍ତିଗତ ଆକଳନ" in the Odisha MCP card
   V-2023-24 (sections ଖ.୧ past history, ଖ.୨ current pregnancy, assessed at
   every ANC), plus four national PMSMA conditions marked "national".
   Each item is worked out from the records where possible; a health worker
   can override any item. One "yes" makes the pregnancy high-risk.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'hrp.title': { en: 'High-risk check', or: 'ବିପଦସଙ୍କୁଳ ଅବସ୍ଥାର ଆକଳନ' },
  'hrp.lede': { en: 'Assessed at the first visit and again at every check-up. If any answer is "yes", the pregnancy is high-risk: mark it on the card, give a red card and refer.', or: 'ପ୍ରଥମ ପରିଦର୍ଶନରେ ଓ ପ୍ରତ୍ୟେକ ଏଏନ୍‌ସିରେ ଆକଳନ କରନ୍ତୁ। ଗୋଟିଏ ବା ଅଧିକ ଅବସ୍ଥା/ଲକ୍ଷଣ ଦେଖିବାକୁ ପାଇଲେ ଗର୍ଭବତୀ ମହିଳାଙ୍କୁ ବିପଦସଙ୍କୁଳ ଚିହ୍ନଟ କରି ରେଡ୍ କାର୍ଡ ଦିଅନ୍ତୁ ଏବଂ ଉପଯୁକ୍ତ ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ରକୁ ପଠାନ୍ତୁ।' },
  'hrp.sec.past': { en: 'Past history (ask at the first visit)', or: 'ଅତୀତ ଗର୍ଭର ସୂଚନା (ପ୍ରଥମ ପରିଦର୍ଶନ ବେଳେ ଆକଳନ କରନ୍ତୁ)' },
  'hrp.sec.now': { en: 'This pregnancy', or: 'ବର୍ତ୍ତମାନର ଗର୍ଭାବସ୍ଥା' },
  'hrp.sec.anc': { en: 'Found at check-ups', or: 'ପ୍ରତ୍ୟେକ ଏଏନ୍‌ସି ସମୟରେ ଆକଳନ' },
  'hrp.sec.nat': { en: 'Other conditions (national PMSMA list)', or: 'ଅନ୍ୟ ଅବସ୍ଥା (ଜାତୀୟ PMSMA ତାଲିକା)' },
  'hrp.auto': { en: 'from records', or: 'ବିବରଣୀରୁ' },
  'hrp.isHigh': { en: 'High-risk pregnancy', or: 'ବିପଦସଙ୍କୁଳ ଗର୍ଭାବସ୍ଥା' },
  'hrp.notHigh': { en: 'No high-risk condition found so far', or: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ବିପଦସଙ୍କୁଳ ଅବସ୍ଥା ମିଳିନାହିଁ' },
  'hrp.recheck': { en: 'Check again at every visit — risk can appear later in pregnancy.', or: 'ପ୍ରତ୍ୟେକ ପରିଦର୍ଶନରେ ପୁଣି ଯାଞ୍ଚ କରନ୍ତୁ — ବିପଦ ପରେ ମଧ୍ୟ ଦେଖାଦେଇପାରେ।' },
  'hrp.because': { en: 'Because of:', or: 'କାରଣ:' },
  'hrp.what': { en: 'What to do', or: 'କ\'ଣ କରିବେ' },
  'hrp.do1': { en: 'Deliver only in a hospital with a specialist, blood bank and caesarean facility (FRU / district hospital).', or: 'କେବଳ ବିଶେଷଜ୍ଞ, ରକ୍ତ ଭଣ୍ଡାର ଓ ଅସ୍ତ୍ରୋପଚାର ସୁବିଧା ଥିବା ଡାକ୍ତରଖାନାରେ (FRU / ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ) ପ୍ରସବ କରାନ୍ତୁ।' },
  'hrp.do2': { en: 'See the doctor at PMSMA every month (e-PMSMA follow-up). In Odisha, ₹100 is given for travel for each specialist visit, up to three visits.', or: 'ପ୍ରତି ମାସ PMSMA ରେ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ (e-PMSMA)। ଓଡ଼ିଶାରେ ବିଶେଷଜ୍ଞଙ୍କ ପାଖକୁ ଯିବା ପାଇଁ ପ୍ରତି ଥର ୧୦୦ ଟଙ୍କା, ତିନୋଟି ଚେକଅପ୍ ପର୍ଯ୍ୟନ୍ତ ଦିଆଯାଏ।' },
  'hrp.do3': { en: 'Keep 102 / 108 numbers ready and know the danger signs.', or: '୧୦୨ / ୧୦୮ ନମ୍ବର ପାଖରେ ରଖନ୍ତୁ ଓ ବିପଦ ଲକ୍ଷଣ ଜାଣନ୍ତୁ।' },
  'hrp.do4': { en: 'Treat the cause: for example, IFA treatment or injection iron for anaemia, BP tablets for hypertension.', or: 'କାରଣର ଚିକିତ୍ସା କରାନ୍ତୁ: ଯେପରି ରକ୍ତହୀନତା ପାଇଁ ଆଇ.ଏଫ୍.ଏ. ଚିକିତ୍ସା ବା ଇଞ୍ଜେକ୍ସନ୍ ଲୌହ, ଉଚ୍ଚ ରକ୍ତଚାପ ପାଇଁ ଔଷଧ।' },
  'hrp.redCard': { en: 'Red card', or: 'ରେଡ୍ କାର୍ଡ' },
  'hrp.redNo': { en: 'Red card serial number', or: 'ରେଡ୍ କାର୍ଡର କ୍ରମିକ ନଂ.' },
  'hrp.redDate': { en: 'Date given', or: 'ରେଡ୍ କାର୍ଡ ପ୍ରଦାନ ତାରିଖ' },
  'hrp.referral': { en: 'Referral centre', or: 'ରେଫରାଲ ସେବା କେନ୍ଦ୍ର' },
  'hrp.hard': { en: 'Village is hard to reach', or: 'ଗ୍ରାମ ଅପହଞ୍ଚ' },
  'hrp.hardDo': { en: 'Plan to move near the delivery hospital before labour. Ask the ANM about a Maa Gruha (maternity waiting home) and book 102 early.', or: 'ପ୍ରସବ ଯନ୍ତ୍ରଣା ପୂର୍ବରୁ ଡାକ୍ତରଖାନା ପାଖକୁ ଯିବାର ଯୋଜନା କରନ୍ତୁ। ମା\' ଗୃହ (ପ୍ରସୂତି ଅପେକ୍ଷା ଗୃହ) ବିଷୟରେ ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ପଚାରନ୍ତୁ ଓ ୧୦୨ ଆଗୁଆ ବୁକ୍ କରନ୍ତୁ।' },
  'hrp.save': { en: 'Save assessment', or: 'ଆକଳନ ସେଭ୍ କରନ୍ତୁ' },
  'hrp.perAnc': { en: 'Result at each ANC', or: 'ପ୍ରତ୍ୟେକ ଏଏନ୍‌ସିରେ ଫଳାଫଳ' },
  'hrp.open': { en: 'Open the high-risk check', or: 'ବିପଦସଙ୍କୁଳ ଆକଳନ ଖୋଲନ୍ତୁ' },
});

const hist = (p, ...ks) => { const any = ks.some(k => p.hist && p.hist[k]); return any ? 1 : (p.hist ? 0 : null); };
const anyVisit = (p, c, code) => { const hit = (p.anc || []).slice().sort(K.by('date')).find(a => K.anc.flags(a, p, c).some(f => f.hrp === code)); return hit ? { v: 1, date: hit.date } : ((p.anc || []).length ? 0 : null); };
const test = (p, k, pos) => { const t = p.tests || {}; return t[k] == null || t[k] === '' ? null : (pos.includes(t[k]) ? 1 : 0); };

K.hrp = {};
K.hrp.ITEMS = [
  // ଖ.୧ — past history
  { code: 'k11', sec: 'past', tag: 'ଖ.୧.୧', en: 'Pregnant more than 4 times before', or: '୪ ରୁ ଅଧିକ ଥର ଗର୍ଭବତୀ ହୋଇଥିଲେ', auto: p => p.gravida != null ? (p.gravida - 1 > 4 ? 1 : 0) : null },
  { code: 'k12', sec: 'past', tag: 'ଖ.୧.୨', en: 'Caesarean delivery or other surgery on the uterus before', or: 'ଆଗରୁ ଅସ୍ତ୍ରୋପଚାର ଜନିତ ପ୍ରସବ / ଅନ୍ୟ କୌଣସି ଗର୍ଭାଶୟ ଜନିତ ଅସ୍ତ୍ରୋପଚାର କରାଯାଇଥିଲା', auto: p => hist(p, 'lscs') },
  { code: 'k13', sec: 'past', tag: 'ଖ.୧.୩', en: 'Low-birth-weight, preterm or growth-restricted (IUGR) baby before', or: 'ପୂର୍ବରୁ L.B.W. ଶିଶୁ / ପ୍ରିଟର୍ମ ଶିଶୁ / I.U.G.R ଶିଶୁ ଜନ୍ମ ହୋଇଥିଲେ', auto: p => hist(p, 'lbw') },
  { code: 'k14', sec: 'past', tag: 'ଖ.୧.୪', en: 'Newborn death, stillbirth or death from asphyxia at birth before', or: 'ଆଗରୁ କେବେ ନବଜାତ ଶିଶୁର ମୃତ୍ୟୁ / ଗର୍ଭରେ ମୃତ୍ୟୁ / ଜନ୍ମ ସମୟରେ ଶ୍ୱାସରୁଦ୍ଧ ଜନିତ ମୃତ୍ୟୁ ହୋଇଥିଲା', auto: p => hist(p, 'loss') },
  { code: 'k15', sec: 'past', tag: 'ଖ.୧.୫', en: 'Bleeding before or after a previous delivery (APH / PPH)', or: 'ଅତୀତରେ ପ୍ରସବ ପୂର୍ବରୁ ରକ୍ତସ୍ରାବ / ପ୍ରସବ ପରବର୍ତ୍ତୀ ରକ୍ତସ୍ରାବ ଜନିତ ସମସ୍ୟା ହୋଇଥିଲା', auto: p => hist(p, 'bleed') },
  { code: 'k16', sec: 'past', tag: 'ଖ.୧.୬', en: 'Diabetes, heart disease or liver disease', or: 'ମଧୁମେହ / ହୃଦ୍‌ରୋଗ / ଯକୃତ ଜନିତ ସମସ୍ୟା', auto: p => hist(p, 'dm', 'heart', 'liver') },
  { code: 'k17', sec: 'past', tag: 'ଖ.୧.୭', en: 'Fits or high blood pressure in a previous pregnancy', or: 'ଅତୀତରେ ଗର୍ଭାବସ୍ଥାରେ ବାତ ମାରୁଥିଲା / ଉଚ୍ଚ ରକ୍ତଚାପ ଥିଲା', auto: p => hist(p, 'ecl') },
  { code: 'k18', sec: 'past', tag: 'ଖ.୧.୮', en: 'Three or more miscarriages', or: 'ଅତୀତରେ ଅତିକମ୍‌ରେ ୩ ଥର ସ୍ୱତଃ ଗର୍ଭପାତ ହୋଇଥିଲା', auto: p => (p.abortions != null && p.abortions >= 3) ? 1 : hist(p, 'ab3') },
  { code: 'k19', sec: 'past', tag: 'ଖ.୧.୯', en: 'TB or leprosy in the past', or: 'ଅତୀତରେ ଯକ୍ଷ୍ମା କିମ୍ବା କୁଷ୍ଠ ହୋଇଥିଲା', auto: p => hist(p, 'tb') },
  { code: 'k110', sec: 'past', tag: 'ଖ.୧.୧୦', en: 'Pregnant after long infertility or by assisted means', or: 'ଦୀର୍ଘ ଦିନର ବନ୍ଧ୍ୟାତ୍ୱ ପରେ ଗର୍ଭବତୀ କିମ୍ବା କୃତ୍ରିମ ଉପାୟରେ ଗର୍ଭବତୀ', auto: p => hist(p, 'infert') },
  { code: 'k111', sec: 'past', tag: 'ଖ.୧.୧୧', en: 'Previous delivery was complicated', or: 'ପୂର୍ବ ପ୍ରସବ ଜଟିଳ ଥିଲା', auto: p => hist(p, 'compl') },
  { code: 'k112', sec: 'past', tag: 'ଖ.୧.୧୨', en: 'Known HIV positive', or: 'HIV+ ଚିହ୍ନଟ ହୋଇଥିଲେ', auto: p => hist(p, 'hiv') },
  // ଖ.୨.୧–୬ — this pregnancy
  { code: 'k21', sec: 'now', tag: 'ଖ.୨.୧', en: 'Age below 18 or above 35 years', or: 'ବୟସ ୧୮ ବର୍ଷରୁ କମ୍ ବା ୩୫ ବର୍ଷରୁ ଉର୍ଦ୍ଧ୍ୱ', auto: (p, c) => { const a = K.card.motherAge(c, K.preg.lmpEq(p) || K.d.today()); return a == null ? null : (a < 18 || a > 35 ? 1 : 0); } },
  { code: 'k22', sec: 'now', tag: 'ଖ.୨.୨', en: 'Thalassaemia or sickle cell disease', or: 'ଥାଲାସେମିଆ / ରକ୍ତ ଶିକୁଳି ରୋଗ', auto: (p, c) => (c.mother.sickle === 'SS' ? 1 : hist(p, 'blood')) },
  { code: 'k23', sec: 'now', tag: 'ଖ.୨.୩', en: 'Thyroid disease', or: 'ଥାଇରଏଡ୍ ରୋଗ', auto: p => hist(p, 'thyroid') },
  { code: 'k24', sec: 'now', tag: 'ଖ.୨.୪', en: 'Rh-negative blood group', or: 'ଗର୍ଭବତୀଙ୍କ Rh -ve', auto: (p, c) => { const bg = (p.tests && p.tests.bloodGroup) || c.mother.bloodGroup; return bg ? (/-$/.test(bg) ? 1 : 0) : null; } },
  { code: 'k25', sec: 'now', tag: 'ଖ.୨.୫', en: 'Height below 140 cm', or: 'ଉଚ୍ଚତା ୧୪୦ ସେ.ମି. ରୁ କମ୍', auto: (p, c) => (c.mother.height ? (c.mother.height < 140 ? 1 : 0) : null) },
  { code: 'k26', sec: 'now', tag: 'ଖ.୨.୬', en: 'Weight below 40 kg', or: 'ଓଜନ ୪୦ କେ.ଜି.ରୁ କମ୍', auto: (p, c) => anyVisit(p, c, 'k26') },
  // ଖ.୨.୭–୨୦ — at each check-up
  { code: 'k27', sec: 'anc', tag: 'ଖ.୨.୭', en: 'Severe anaemia (Hb below 7 g/dl)', or: 'ଗୁରୁତର ରକ୍ତହୀନତା (ହିମୋଗ୍ଲୋବିନ୍ ୭ g/dl ରୁ କମ୍)', auto: (p, c) => anyVisit(p, c, 'k27') },
  { code: 'k28', sec: 'anc', tag: 'ଖ.୨.୮', en: 'Blood pressure 140/90 or more', or: 'ରକ୍ତଚାପ ୧୪୦/୯୦ ବା ଅଧିକ', auto: (p, c) => anyVisit(p, c, 'k28') },
  { code: 'k29', sec: 'anc', tag: 'ଖ.୨.୯', en: 'Sugar or albumin in urine', or: 'ପରିସ୍ରାରେ ଶର୍କରା / ଆଲ୍‌ବୁମିନ୍', auto: (p, c) => anyVisit(p, c, 'k29') },
  { code: 'k210', sec: 'anc', tag: 'ଖ.୨.୧୦', en: 'Malaria or fever in pregnancy', or: 'ଗର୍ଭାବସ୍ଥାରେ ମ୍ୟାଲେରିଆ / ଜ୍ୱର', auto: (p, c) => test(p, 'malaria', ['pos']) || anyVisit(p, c, 'k210') },
  { code: 'k211', sec: 'anc', tag: 'ଖ.୨.୧୧', en: 'Monthly weight gain under 500 g or over 3 kg (from the 2nd trimester)', or: 'ଦ୍ୱିତୀୟ ତ୍ରୟମାସିକ ଠାରୁ ମାସିକ ଓଜନ ୫୦୦ ଗ୍ରାମରୁ କମ୍ ବା ୩ କେଜିରୁ ଅଧିକ ବଢ଼ିଛି', auto: (p, c) => anyVisit(p, c, 'k211') },
  { code: 'k212', sec: 'anc', tag: 'ଖ.୨.୧୨', en: 'Hepatitis B or jaundice', or: 'ହେପାଟାଇଟିସ୍ ବି / ଜଣ୍ଡିସ୍', auto: (p, c) => test(p, 'hbsag', ['pos']) || anyVisit(p, c, 'k212') },
  { code: 'k213', sec: 'anc', tag: 'ଖ.୨.୧୩', en: 'HIV, RTI or STI (including syphilis) in pregnancy', or: 'ଗର୍ଭାବସ୍ଥାରେ HIV+ / RTI / STI', auto: (p, c) => test(p, 'hiv', ['pos']) || test(p, 'syphilis', ['pos']) || anyVisit(p, c, 'k213') },
  { code: 'k214', sec: 'anc', tag: 'ଖ.୨.୧୪', en: 'Bleeding from the vagina', or: 'ଯୋନିରୁ ରକ୍ତସ୍ରାବ ହେଉଛି', auto: (p, c) => anyVisit(p, c, 'k214') },
  { code: 'k214b', sec: 'anc', tag: 'ଖ.୨.୧୪', en: 'Water leaking before labour (PROM)', or: 'ପି.ଆର୍.ଓ.ଏମ୍. / ଲିକିଙ୍ଗ୍', auto: (p, c) => anyVisit(p, c, 'k214b') },
  { code: 'k215', sec: 'anc', tag: 'ଖ.୨.୧୫', en: 'Foul-smelling vaginal discharge', or: 'ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ଯୋନିସ୍ରାବ', auto: (p, c) => anyVisit(p, c, 'k215') },
  { code: 'k216', sec: 'anc', tag: 'ଖ.୨.୧୬', en: "Baby's movements reduced (fewer than 15 in 12 hours)", or: 'ଗର୍ଭସ୍ଥ ଶିଶୁର ଚଳପ୍ରଚଳ କମି ଯାଇଛି (୧୨ ଘଣ୍ଟା ଭିତରେ ୧୫ ଥରରୁ କମ୍)', auto: (p, c) => anyVisit(p, c, 'k216') },
  { code: 'k217', sec: 'anc', tag: 'ଖ.୨.୧୭', en: 'Irregular painful contractions', or: 'ଅନିୟମିତ ଯନ୍ତ୍ରଣାଯୁକ୍ତ କଣ୍ଟ୍ରାକ୍ସନ୍', auto: (p, c) => anyVisit(p, c, 'k217') },
  { code: 'k218', sec: 'anc', tag: 'ଖ.୨.୧୮', en: 'Uterus size differs from weeks of pregnancy by more than 4 cm', or: 'ଗର୍ଭାଶୟର ଆକାର ଗର୍ଭସ୍ଥ ଶିଶୁର ବୟସ ଠାରୁ ୪ cm ଅଧିକ ବା କମ୍', auto: (p, c) => anyVisit(p, c, 'k218') },
  { code: 'k219', sec: 'anc', tag: 'ଖ.୨.୧୯', en: 'Severe lower belly pain in the first 3 months', or: 'ପ୍ରଥମ ତିନିମାସରେ ତଳିପେଟରେ ଅତ୍ୟଧିକ ଯନ୍ତ୍ରଣା', auto: (p, c) => { const hit = (p.anc || []).find(a => (a.sx || []).includes('pain') && K.preg.ga(p, a.date).days < 14 * 7); return hit ? { v: 1, date: hit.date } : ((p.anc || []).length ? 0 : null); } },
  { code: 'k220', sec: 'anc', tag: 'ଖ.୨.୨୦', en: 'More than 7 days past the expected date of delivery', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ ୭ ଦିନରୁ ଅଧିକ ଗଡ଼ିଛି', auto: p => { if (!K.preg.isActive(p)) return null; const g = K.preg.ga(p); return g ? (g.days > 287 ? 1 : 0) : null; } },
  // national additions
  { code: 'k31', sec: 'nat', tag: 'PMSMA', en: 'Baby not head-down (breech or transverse) after 36 weeks', or: '୩୬ ସପ୍ତାହ ପରେ ଶିଶୁର ମୁଣ୍ଡ ତଳକୁ ନାହିଁ (ବ୍ରିଚ୍ / ଟ୍ରାନ୍ସଭର୍ସ)', auto: (p, c) => anyVisit(p, c, 'k31') },
  { code: 'k32', sec: 'nat', tag: 'PMSMA', en: 'Twins or more', or: 'ଯାଆଁଳା ବା ଅଧିକ ଶିଶୁ', auto: p => (p.tests && p.tests.multiple != null ? +p.tests.multiple : null) },
  { code: 'k33', sec: 'nat', tag: 'PMSMA', en: 'Low-lying placenta (placenta praevia) on ultrasound', or: 'ଅଲଟ୍ରାସାଉଣ୍ଡରେ ଗର୍ଭଫୁଲ ତଳକୁ (ପ୍ଲାସେଣ୍ଟା ପ୍ରିଭିଆ)', auto: p => (p.tests && p.tests.previa != null ? +p.tests.previa : null) },
  { code: 'k34', sec: 'nat', tag: 'PMSMA', en: 'Diabetes in pregnancy (OGTT 2-hour value 140 mg/dl or more)', or: 'ଗର୍ଭକାଳୀନ ମଧୁମେହ (OGTT ୨ ଘଣ୍ଟା ମୂଲ୍ୟ ୧୪୦ mg/dl ବା ଅଧିକ)', auto: p => { const v = p.tests && K.num(p.tests.ogtt); return v == null ? null : (v >= 140 ? 1 : 0); } },
  { code: 'k113', sec: 'nat', tag: 'PMSMA', en: 'Previous baby with a birth defect', or: 'ପୂର୍ବରୁ ଜନ୍ମଗତ ତ୍ରୁଟି ଥିବା ଶିଶୁ', auto: p => hist(p, 'anom') },
  { code: 'k114', sec: 'nat', tag: 'PMSMA', en: 'High blood pressure before pregnancy (chronic hypertension)', or: 'ଗର୍ଭ ପୂର୍ବରୁ ଉଚ୍ଚ ରକ୍ତଚାପ', auto: p => hist(p, 'htn') },
];

/* effective value of one item: manual override wins over records */
K.hrp.value = (it, p, c) => {
  const m = p.hrp ? p.hrp[it.code] : undefined;
  let a = null; try { a = it.auto ? it.auto(p, c) : null; } catch (e) { a = null; }
  const av = a && typeof a === 'object' ? a.v : a; const date = a && typeof a === 'object' ? a.date : null;
  if (m === 0 || m === 1) return { v: m, src: 'manual', auto: av, date };
  return { v: av, src: av == null ? null : 'auto', auto: av, date };
};
K.preg.risk = (p, c) => {
  if (!p) return null;
  const reasons = K.hrp.ITEMS.map(it => ({ it, r: K.hrp.value(it, p, c) })).filter(x => x.r.v === 1);
  return { high: reasons.length > 0, reasons, hard: p.village === 'seasonal' || p.village === 'always' };
};

/* ---------------------------------------------------------------- screen */
K.route('/card/:id/preg/:pid/hrp', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const risk = K.preg.risk(p, c); const rc = p.redCard || {};
  const row = (it) => { const r = K.hrp.value(it, p, c);
    return K.ui.yn({ name: it.code, code: it.tag, q: K.L(it), value: r.v == null ? '' : r.v, auto: r.src === 'auto',
      sub: r.src === 'auto' ? `${K.t('hrp.auto')}${r.date ? ' · ' + K.d.fmt(r.date) : ''}` : (r.src === 'manual' && r.auto != null && r.auto !== r.v ? `${K.t('hrp.auto')}: ${r.auto ? K.t('yes') : K.t('no')}` : '') }); };
  const group = (sec) => h`<fieldset class="fgroup"><legend>${K.t('hrp.sec.' + sec)}</legend><div>${K.hrp.ITEMS.filter(i => i.sec === sec).map(row)}</div></fieldset>`;
  const perAnc = K.anc.schedule(p).map(s => { const hit = s.visits.some(a => K.anc.flags(a, p, c).some(f => f.hrp)) || (s.visits.length && risk.reasons.some(x => x.it.sec !== 'anc'));
    return { n: s.w.n, v: s.visits.length ? (hit ? 1 : 0) : null, d: s.visits[0] && s.visits[0].date }; });
  return {
    title: K.t('hrp.title'), sub: c.mother.name, back: K.preg.url(c, p).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.t('preg.overview'), K.t('hrp.title'), K.t('hrp.lede'))}
      ${risk.high ? K.ui.callout('danger', K.t('hrp.isHigh'), h`<p>${K.t('hrp.because')}</p><ul>${risk.reasons.map(x => h`<li>${K.L(x.it)}</li>`)}</ul>`)
        : K.ui.callout('', K.t('hrp.notHigh'), K.t('hrp.recheck'), 'shield')}
      ${risk.hard ? h`<p></p>${K.ui.callout('warn', K.t('hrp.hard'), K.t('hrp.hardDo'), 'pin')}` : ''}
      ${risk.high ? h`<section class="sec" style="margin-top:14px">${K.ui.eyebrow(K.t('hrp.what'))}<ul class="ul">${['hrp.do1', 'hrp.do2', 'hrp.do3', 'hrp.do4'].map(k => h`<li>${K.t(k)}</li>`)}</ul></section>` : h`<p></p>`}
      <form class="form" data-form="hrpSave" data-id="${id}" data-pid="${pid}">
        ${risk.high || rc.no ? h`<fieldset class="fgroup"><legend>${K.t('hrp.redCard')}</legend><div class="frow">
          ${K.ui.field({ name: 'redNo', label: K.t('hrp.redNo'), value: rc.no, cls: 'mono' })}${K.ui.field({ name: 'redDate', type: 'date', label: K.t('hrp.redDate'), value: rc.date, max: K.d.today() })}</div>
          ${K.ui.field({ name: 'referral', label: K.t('hrp.referral'), value: rc.referral })}</fieldset>` : ''}
        ${group('past')}${group('now')}${group('anc')}${group('nat')}
        ${K.settings.isHcp() ? h`<div class="k-card"><div class="eyebrow">${K.t('hrp.perAnc')}</div><div class="grid2">${perAnc.map(x => K.ui.stat(K.t('anc.n', { n: x.n }), x.v == null ? '–' : x.v ? K.t('st.high') : K.t('no'), x.v ? 'danger' : 'ink', x.d ? K.d.fmt(x.d) : ''))}</div></div>` : ''}
        <div class="btn-bar">${K.ui.btn(K.t('hrp.save'), { type: 'submit', icon: 'check' })}</div>
      </form></div>`,
  };
});
K.forms.hrpSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  p.hrp = {};
  K.hrp.ITEMS.forEach(it => {
    if (v[it.code] == null || v[it.code] === '') return;
    const val = +v[it.code]; const r = K.hrp.value(it, Object.assign({}, p, { hrp: {} }), c);
    if (r.auto !== val) p.hrp[it.code] = val; // only store real overrides
  });
  if (v.redNo || v.redDate || v.referral) p.redCard = { no: v.redNo || '', date: v.redDate || '', referral: v.referral || '' };
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.preg.url(c, p).slice(1));
};

/* overview section: risk banner + link (order 5 → shows first) */
K.preg.addSection(5, (c, p) => {
  if (p.status === 'ended') return '';
  const r = K.preg.risk(p, c);
  return h`<section class="sec">${r.high
    ? h`<a class="k-card danger hrp-banner" href="${K.preg.url(c, p, '/hrp')}"><span class="pills">${K.ui.pill(K.t('hrp.isHigh'), 'solid-red', 'alert')}${p.redCard && p.redCard.no ? K.ui.pill(K.t('hrp.redCard') + ' ' + p.redCard.no, 'red') : ''}</span>
        <span class="small" style="display:block;margin-top:8px">${r.reasons.slice(0, 4).map(x => K.L(x.it)).join(' · ')}${r.reasons.length > 4 ? ' …' : ''}</span></a>`
    : h`<div class="list">${K.ui.li({ href: K.preg.url(c, p, '/hrp'), icon: 'shield', title: K.t('hrp.title'), meta: K.t('hrp.notHigh') })}</div>`}
    ${r.hard ? h`<p></p>${K.ui.callout('warn', K.t('hrp.hard'), K.t('hrp.hardDo'), 'pin')}` : ''}</section>`;
});
