/* ============================================================================
   modules/21-anc — antenatal check-ups: schedule, visit form, auto-flags
   Schedule (Odisha MCP V-2023-24 / GoI): ANC-1 by 12 wk · ANC-2 14–26 wk ·
   ANC-3 28–34 wk · ANC-4 36 wk–delivery; PMSMA on the 9th in 2nd/3rd trimester.
   Thresholds: BP ≥140/90 (≥160/110 severe); Hb (AMB, pregnancy) <7 severe,
   7–9.9 moderate, 10–10.9 mild; FHR 110–160; fundal height ±4 cm of GA
   (Odisha HRP ଖ.୨.୧୮); monthly gain <0.5 or >3 kg from 2nd trimester (ଖ.୨.୧୧).
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'anc.title': { en: 'Check-up', or: 'ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା' },
  'anc.new': { en: 'New check-up', or: 'ନୂଆ ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା' },
  'anc.edit': { en: 'Edit check-up', or: 'ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ସଂଶୋଧନ' },
  'anc.n': { en: 'ANC {n}', or: '{n}ମ ଏଏନ୍‌ସି' },
  'anc.w1': { en: 'ANC 1 · register by 12 weeks', or: '୧ମ ଏଏନ୍‌ସି · ୧୨ ସପ୍ତାହ ମଧ୍ୟରେ ପଞ୍ଜୀକରଣ' },
  'anc.w2': { en: 'ANC 2 · 14–26 weeks', or: '୨ୟ ଏଏନ୍‌ସି · ୧୪–୨୬ ସପ୍ତାହ' },
  'anc.w3': { en: 'ANC 3 · 28–34 weeks', or: '୩ୟ ଏଏନ୍‌ସି · ୨୮–୩୪ ସପ୍ତାହ' },
  'anc.w4': { en: 'ANC 4 · 36 weeks to delivery', or: '୪ର୍ଥ ଏଏନ୍‌ସି · ୩୬ ସପ୍ତାହରୁ ପ୍ରସବ ପର୍ଯ୍ୟନ୍ତ' },
  'anc.min4': { en: 'At least 4 check-ups before delivery; register in the first 3 months.', or: 'ପ୍ରସବ ପୂର୍ବରୁ ଅତି କମରେ ୪ ଥର ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା କରାନ୍ତୁ। ଗର୍ଭ ପଞ୍ଜୀକରଣ ପ୍ରଥମ ତ୍ରୟମାସିକରେ କରନ୍ତୁ।' },
  'anc.pmsma': { en: 'PMSMA check-up by a doctor', or: 'ଡାକ୍ତରଙ୍କ ଦ୍ୱାରା PMSMA ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା' },
  'anc.pmsmaSub': { en: '9th of every month at the government hospital, in the 2nd or 3rd trimester. Free.', or: 'ପ୍ରତି ମାସର ୯ ତାରିଖ, ଦ୍ୱିତୀୟ/ତୃତୀୟ ତ୍ରୟମାସିକରେ, ସରକାରୀ ଡାକ୍ତରଖାନାରେ। ମାଗଣା।' },
  'anc.pmsmaHrp': { en: 'High-risk pregnancy: see the doctor at PMSMA every month (e-PMSMA follow-up).', or: 'ବିପଦସଙ୍କୁଳ ଗର୍ଭ: ପ୍ରତି ମାସ PMSMA ରେ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ (e-PMSMA)।' },
  'anc.visits': { en: 'Check-ups done', or: 'ହୋଇଥିବା ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା' },
  'anc.none': { en: 'No check-up recorded yet.', or: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ଲେଖା ହୋଇନାହିଁ।' },
  'anc.missed': { en: 'Missed', or: 'ହୋଇପାରିଲା ନାହିଁ' },
  'anc.where': { en: 'Where', or: 'କେଉଁଠାରେ' },
  'anc.by': { en: 'Checked by', or: 'କିଏ ଯାଞ୍ଚ କଲେ' },
  'pl.mamata': { en: 'Mamata Divas (VHSND)', or: 'ମମତା ଦିବସ' }, 'pl.sc': { en: 'Sub-centre', or: 'ଉପକେନ୍ଦ୍ର' }, 'pl.phc': { en: 'PHC', or: 'ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ର' },
  'pl.chc': { en: 'CHC / hospital', or: 'ଗୋଷ୍ଠୀ ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ର / ଡାକ୍ତରଖାନା' }, 'pl.pmsma': { en: 'PMSMA (9th)', or: 'PMSMA (୯ ତାରିଖ)' }, 'pl.pvt': { en: 'Private', or: 'ଘରୋଇ' }, 'pl.home': { en: 'Home visit', or: 'ଗୃହ ପରିଦର୍ଶନ' },
  'by.anm': { en: 'ANM', or: 'ଏ.ଏନ୍.ଏମ୍.' }, 'by.doc': { en: 'Doctor', or: 'ଡାକ୍ତର' }, 'by.asha': { en: 'ASHA', or: 'ଆଶା' }, 'by.self': { en: 'Myself', or: 'ନିଜେ' },
  'anc.measure': { en: 'Measurements', or: 'ମାପ' },
  'anc.weight': { en: 'Weight', or: "ମା'ଙ୍କ ଓଜନ" },
  'anc.bp': { en: 'Blood pressure', or: 'ରକ୍ତଚାପ' },
  'anc.sys': { en: 'Upper (systolic)', or: 'ଉପର (ସିଷ୍ଟୋଲିକ୍)' },
  'anc.dia': { en: 'Lower (diastolic)', or: 'ତଳ (ଡାଏଷ୍ଟୋଲିକ୍)' },
  'anc.hb': { en: 'Haemoglobin', or: 'ହିମୋଗ୍ଲୋବିନ୍' },
  'anc.urineAlb': { en: 'Urine albumin', or: 'ପରିସ୍ରାରେ ଆଲ୍‌ବୁମିନ୍' },
  'anc.urineSugar': { en: 'Urine sugar', or: 'ପରିସ୍ରାରେ ଶର୍କରା' },
  'u.nil': { en: 'Nil', or: 'ନାହିଁ' }, 'u.trace': { en: 'Trace', or: 'ସାମାନ୍ୟ' },
  'anc.sx': { en: 'Any problem today?', or: 'ଆଜି କୌଣସି ଅସୁବିଧା ଅଛି କି?' },
  'anc.given': { en: 'Given today', or: 'ଆଜି ଦିଆଗଲା' },
  'anc.td': { en: 'Td injection', or: 'ଟିଡି ଟୀକା' },
  'anc.ifa': { en: 'IFA tablets given', or: 'ଆଇ.ଏଫ୍.ଏ. ବଟିକା ଦିଆଗଲା' },
  'anc.ca': { en: 'Calcium tablets given', or: 'କ୍ୟାଲସିୟମ୍ ବଟିକା ଦିଆଗଲା' },
  'anc.alb': { en: 'Albendazole tablet given', or: 'କୃମିନାଶକ ବଟିକା ଦିଆଗଲା' },
  'anc.tabs': { en: 'tablets', or: 'ବଟିକା' },
  'anc.hw': { en: 'Examination (health worker)', or: 'ଶାରୀରିକ ପରୀକ୍ଷା (ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀ)' },
  'anc.pulse': { en: 'Pulse', or: 'ନାଡ଼ି ଗତି' }, 'anc.temp': { en: 'Temperature', or: 'ଶରୀରର ତାପମାତ୍ରା' },
  'anc.pallor': { en: 'Pallor', or: 'ଫିକା ଦେଖାଯିବା (ପାଲର୍)' }, 'anc.jaundice': { en: 'Jaundice', or: 'ହଳଦିଆ (ଜଣ୍ଡିସ୍)' },
  'anc.oedema': { en: 'Swelling (oedema)', or: 'ଫୁଲା (ଇଡିମା)' }, 'oed.none': { en: 'None', or: 'ନାହିଁ' }, 'oed.feet': { en: 'Feet only', or: 'କେବଳ ପାଦ' }, 'oed.gen': { en: 'Face / hands / body', or: 'ମୁହଁ / ହାତ / ଶରୀର' },
  'anc.fh': { en: 'Fundal height', or: 'ଗର୍ଭାଶୟର ଉଚ୍ଚତା' },
  'anc.lie': { en: 'Lie / presentation', or: 'ଶିଶୁର ଅବସ୍ଥିତି' }, 'lie.ceph': { en: 'Head down', or: 'ମୁଣ୍ଡ ତଳକୁ' }, 'lie.breech': { en: 'Breech', or: 'ପିଠି/ଗୋଡ଼ ତଳକୁ (ବ୍ରିଚ୍)' }, 'lie.trans': { en: 'Transverse', or: 'ଆଡ଼ େଇ (ଟ୍ରାନ୍ସଭର୍ସ)' }, 'lie.np': { en: 'Not palpable yet', or: 'ଏବେ ଜଣାପଡୁନାହିଁ' },
  'anc.fm': { en: "Baby's movements", or: 'ଗର୍ଭରେ ଶିଶୁ ଚଳିବା' }, 'fm.normal': { en: 'Normal', or: 'ସାଧାରଣ' }, 'fm.reduced': { en: 'Reduced', or: 'କମ୍' }, 'fm.absent': { en: 'Absent', or: 'ନାହିଁ' },
  'anc.fhr': { en: 'Fetal heart rate', or: 'ଗର୍ଭସ୍ଥ ଶିଶୁର ହୃତ୍‌ସ୍ପନ୍ଦନ' },
  'anc.pv': { en: 'P/V findings (if done)', or: 'ଯୋନି ପରୀକ୍ଷା (ଯଦି କରାଯାଇଛି)' },
  'anc.next': { en: 'Next visit', or: 'ପରବର୍ତ୍ତୀ ପରିଦର୍ଶନ' },
  'anc.result': { en: 'What this check-up shows', or: 'ଏହି ପରୀକ୍ଷାରୁ କ\'ଣ ଜଣାପଡ଼ିଲା' },
  'anc.allOk': { en: 'No warning signs in what was recorded.', or: 'ଲେଖାଯାଇଥିବା ତଥ୍ୟରେ କୌଣସି ସତର୍କ ଲକ୍ଷଣ ନାହିଁ।' },
  'anc.save': { en: 'Save check-up', or: 'ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ସେଭ୍ କରନ୍ତୁ' },
  'anc.deleteQ': { en: 'Delete this check-up?', or: 'ଏହି ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା ବିଲୋପ କରିବେ?' },
  'anc.dateOut': { en: 'This date is outside the pregnancy (before LMP or after delivery).', or: 'ଏହି ତାରିଖ ଗର୍ଭାବସ୍ଥା ସମୟ ବାହାରେ।' },
  'anc.wtTrend': { en: 'Weight across pregnancy', or: 'ଗର୍ଭାବସ୍ଥାରେ ଓଜନ' },
  'anc.wtGain': { en: 'Gained {kg} kg since {d}', or: '{d} ଠାରୁ {kg} କି.ଗ୍ରା. ବଢ଼ିଛି' },
  'anc.wtAdvice': { en: 'Aim to gain 9–11 kg in all, about 1 kg every month in the last 6 months.', or: 'ସମୁଦାୟ ୯–୧୧ କି.ଗ୍ରା. ଓଜନ ବଢ଼ିବା ଉଚିତ, ଶେଷ ୬ ମାସରେ ପ୍ରତି ମାସ ପ୍ରାୟ ୧ କି.ଗ୍ରା.।' },
  'anc.showMore': { en: 'Health-worker fields', or: 'ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ପାଇଁ ଅଂଶ' },
});

/* problems a woman can report — with Odisha HRP codes (ଖ.୨.x) */
K.anc = {};
K.anc.SX = [
  { k: 'bleed', hrp: 'k214', tone: 'danger', en: 'Bleeding from vagina', or: 'ଯୋନିରୁ ରକ୍ତସ୍ରାବ' },
  { k: 'leak', hrp: 'k214b', tone: 'danger', en: 'Water leaking (PROM)', or: 'ପାଣି ଯିବା (ପି.ଆର୍.ଓ.ଏମ୍.)' },
  { k: 'fmless', hrp: 'k216', tone: 'danger', en: 'Baby moving less', or: 'ଗର୍ଭସ୍ଥ ଶିଶୁର ଚଳପ୍ରଚଳ କମ୍' },
  { k: 'head', tone: 'danger', en: 'Severe headache / blurred vision', or: 'ପ୍ରବଳ ମୁଣ୍ଡବିନ୍ଧା / ଆଖି ଝାପ୍‌ସା' },
  { k: 'swell', tone: 'warn', en: 'Swelling of face or hands', or: 'ମୁହଁ ବା ହାତ ଫୁଲିବା' },
  { k: 'fever', hrp: 'k210', tone: 'warn', en: 'Fever / malaria', or: 'ଜ୍ୱର / ମ୍ୟାଲେରିଆ' },
  { k: 'pain', hrp: 'k219', tone: 'danger', en: 'Severe lower belly pain', or: 'ତଳିପେଟରେ ଅତ୍ୟଧିକ ଯନ୍ତ୍ରଣା' },
  { k: 'contr', hrp: 'k217', tone: 'warn', en: 'Irregular painful contractions', or: 'ଅନିୟମିତ ଯନ୍ତ୍ରଣାଯୁକ୍ତ କଣ୍ଟ୍ରାକ୍ସନ୍' },
  { k: 'disch', hrp: 'k215', tone: 'warn', en: 'Foul-smelling discharge', or: 'ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ଯୋନିସ୍ରାବ' },
  { k: 'sti', hrp: 'k213', tone: 'warn', en: 'Genital sores or itching (RTI/STI)', or: 'ଯୌନାଙ୍ଗରେ ଘା ବା କୁଣ୍ଡେଇ (RTI/STI)' },
  { k: 'yellow', hrp: 'k212', tone: 'danger', en: 'Yellow eyes (jaundice)', or: 'ଆଖି ହଳଦିଆ (ଜଣ୍ଡିସ୍)' },
  { k: 'vomit', tone: 'warn', en: 'Vomiting a lot', or: 'ଅତ୍ୟଧିକ ବାନ୍ତି' },
  { k: 'breath', tone: 'warn', en: 'Breathless, very tired', or: 'ଧଇଁସଇଁ, ଅତ୍ୟଧିକ ଦୁର୍ବଳ' },
  { k: 'urine', tone: 'warn', en: 'Burning when passing urine', or: 'ପରିସ୍ରା କଲାବେଳେ ଜଳାପୋଡ଼ା' },
];
K.anc.WINDOWS = [
  { n: 1, from: 0, to: 12 * 7, end: 14 * 7 - 1, key: 'anc.w1' },
  { n: 2, from: 14 * 7, to: 26 * 7, end: 28 * 7 - 1, key: 'anc.w2' },
  { n: 3, from: 28 * 7, to: 34 * 7, end: 36 * 7 - 1, key: 'anc.w3' },
  { n: 4, from: 36 * 7, to: 40 * 7, end: 44 * 7, key: 'anc.w4' },
];
K.anc.hbClass = (hb) => hb == null ? null : hb < 7 ? { k: 'severe', tone: 'danger', en: 'Severe anaemia', or: 'ଗୁରୁତର ରକ୍ତହୀନତା' }
  : hb < 10 ? { k: 'moderate', tone: 'warn', en: 'Moderate anaemia', or: 'ମଧ୍ୟମ ରକ୍ତହୀନତା' }
  : hb < 11 ? { k: 'mild', tone: 'warn', en: 'Mild anaemia', or: 'ସାମାନ୍ୟ ରକ୍ତହୀନତା' } : { k: 'normal', tone: 'ok', en: 'Normal', or: 'ସ୍ୱାଭାବିକ' };

/* flags for one visit. Returns [{tone, en, or, hrp?}] */
K.anc.flags = (a, p, c) => {
  const out = []; const F = (tone, en, or, hrp) => out.push({ tone, en, or, hrp });
  const g = K.preg.ga(p, a.date) || { days: 0, w: 0 };
  const sys = K.num(a.bpSys), dia = K.num(a.bpDia), hb = K.num(a.hb), alb = a.urineAlb && a.urineAlb !== 'nil';
  const highBp = (sys != null && sys >= 140) || (dia != null && dia >= 90);
  if ((sys != null && sys >= 160) || (dia != null && dia >= 110)) F('danger', 'Very high BP (≥160/110): refer to hospital today.', 'ଅତ୍ୟଧିକ ଉଚ୍ଚ ରକ୍ତଚାପ (≥୧୬୦/୧୧୦): ଆଜି ହିଁ ଡାକ୍ତରଖାନାକୁ ପଠାନ୍ତୁ।', 'k28');
  else if (highBp) F('danger', 'High BP (≥140/90): refer to a doctor; check urine albumin.', 'ଉଚ୍ଚ ରକ୍ତଚାପ (≥୧୪୦/୯୦): ଡାକ୍ତରଙ୍କ ପାଖକୁ ପଠାନ୍ତୁ; ପରିସ୍ରାରେ ଆଲ୍‌ବୁମିନ୍ ପରୀକ୍ଷା କରନ୍ତୁ।', 'k28');
  if (highBp && (alb || (a.sx || []).includes('head') || a.oedema === 'gen')) F('danger', 'Signs of pre-eclampsia (high BP with albumin, headache or swelling).', 'ପ୍ରି-ଏକ୍ଲାମ୍ପସିଆର ଲକ୍ଷଣ (ଉଚ୍ଚ ରକ୍ତଚାପ ସହ ଆଲ୍‌ବୁମିନ୍, ମୁଣ୍ଡବିନ୍ଧା ବା ଫୁଲା)।', 'k28');
  if (sys != null && dia != null && sys < 90 && dia < 60) F('warn', 'Low BP: check for bleeding, dehydration or weakness.', 'କମ୍ ରକ୍ତଚାପ: ରକ୍ତସ୍ରାବ, ଜଳାଭାବ ବା ଦୁର୍ବଳତା ଯାଞ୍ଚ କରନ୍ତୁ।');
  const hc = K.anc.hbClass(hb);
  if (hc && hc.k === 'severe') F('danger', `Hb ${hb} g/dl: severe anaemia — high-risk pregnancy; refer for treatment.`, `ହିମୋଗ୍ଲୋବିନ୍ ${hb} g/dl: ଗୁରୁତର ରକ୍ତହୀନତା — ବିପଦସଙ୍କୁଳ ଗର୍ଭ; ଚିକିତ୍ସା ପାଇଁ ପଠାନ୍ତୁ।`, 'k27');
  else if (hc && hc.k !== 'normal') F('warn', `Hb ${hb} g/dl: ${hc.en.toLowerCase()} — take IFA as advised (treatment dose is 2 tablets a day).`, `ହିମୋଗ୍ଲୋବିନ୍ ${hb} g/dl: ${hc.or} — ପରାମର୍ଶ ଅନୁସାରେ ଆଇ.ଏଫ୍.ଏ. ଖାଆନ୍ତୁ (ଚିକିତ୍ସା ମାତ୍ରା ଦିନକୁ ୨ ବଟିକା)।`);
  if (alb && !highBp) F('warn', 'Albumin in urine: recheck BP and urine.', 'ପରିସ୍ରାରେ ଆଲ୍‌ବୁମିନ୍: ରକ୍ତଚାପ ଓ ପରିସ୍ରା ପୁଣି ଯାଞ୍ଚ କରନ୍ତୁ।', 'k29');
  if (a.urineSugar && a.urineSugar !== 'nil') F('warn', 'Sugar in urine: test for diabetes in pregnancy (OGTT).', 'ପରିସ୍ରାରେ ଶର୍କରା: ଗର୍ଭକାଳୀନ ମଧୁମେହ ପାଇଁ OGTT ପରୀକ୍ଷା କରନ୍ତୁ।', 'k29');
  const w = K.num(a.weight);
  if (w != null && w < 40) F('danger', 'Weight below 40 kg: high-risk pregnancy.', 'ଓଜନ ୪୦ କି.ଗ୍ରା.ରୁ କମ୍: ବିପଦସଙ୍କୁଳ ଗର୍ଭ।', 'k26');
  if (w != null && g.days >= 13 * 7) {
    const prev = (p.anc || []).filter(x => x !== a && x.id !== a.id && x.weight != null && K.d.diff(x.date, a.date) >= 21).sort(K.by('date', -1))[0];
    if (prev) { const days = K.d.diff(prev.date, a.date); const rate = (w - prev.weight) / (days / 30.4375);
      if (rate < 0.5) F('warn', `Gaining only ${K.round(rate, 1)} kg a month (less than 0.5 kg): check diet and baby's growth.`, `ମାସକୁ କେବଳ ${K.round(rate, 1)} କି.ଗ୍ରା. ଓଜନ ବଢ଼ୁଛି (୫୦୦ ଗ୍ରାମରୁ କମ୍): ଖାଦ୍ୟ ଓ ଶିଶୁର ବୃଦ୍ଧି ଯାଞ୍ଚ କରନ୍ତୁ।`, 'k211');
      else if (rate > 3) F('warn', `Gaining ${K.round(rate, 1)} kg a month (more than 3 kg): check BP and swelling.`, `ମାସକୁ ${K.round(rate, 1)} କି.ଗ୍ରା. ଓଜନ ବଢ଼ୁଛି (୩ କି.ଗ୍ରା.ରୁ ଅଧିକ): ରକ୍ତଚାପ ଓ ଫୁଲା ଯାଞ୍ଚ କରନ୍ତୁ।`, 'k211'); }
  }
  const pulse = K.num(a.pulse), temp = K.num(a.temp);
  if (pulse != null && pulse > 100) F('warn', 'Pulse above 100: look for anaemia, fever or infection.', 'ନାଡ଼ି ୧୦୦ ରୁ ଅଧିକ: ରକ୍ତହୀନତା, ଜ୍ୱର ବା ସଂକ୍ରମଣ ଯାଞ୍ଚ କରନ୍ତୁ।');
  const tC = temp == null ? null : (temp > 45 ? (temp - 32) * 5 / 9 : temp); // accepts °F too
  if (tC != null && tC >= 38) F('warn', 'Fever: test for malaria (RDT) the same day.', 'ଜ୍ୱର: ସେହି ଦିନ ମ୍ୟାଲେରିଆ (RDT) ପରୀକ୍ଷା କରନ୍ତୁ।', 'k210');
  if (+a.jaundice === 1) F('danger', 'Jaundice: refer to a doctor.', 'ଜଣ୍ଡିସ୍: ଡାକ୍ତରଙ୍କ ପାଖକୁ ପଠାନ୍ତୁ।', 'k212');
  if (+a.pallor === 1 && hb == null) F('warn', 'Pallor: test haemoglobin.', 'ଫିକା ଦେଖାଯାଉଛି: ହିମୋଗ୍ଲୋବିନ୍ ପରୀକ୍ଷା କରନ୍ତୁ।');
  if (a.oedema === 'gen' && !highBp) F('warn', 'Swelling of face or body: check BP and urine.', 'ମୁହଁ ବା ଶରୀର ଫୁଲା: ରକ୍ତଚାପ ଓ ପରିସ୍ରା ଯାଞ୍ଚ କରନ୍ତୁ।');
  const fh = K.num(a.fh);
  if (fh != null && g.days >= 20 * 7 && Math.abs(fh - g.w) > 4) F('warn', `Fundal height ${fh} cm at ${g.w} weeks differs by more than 4 cm: refer for ultrasound.`, `${g.w} ସପ୍ତାହରେ ଗର୍ଭାଶୟର ଉଚ୍ଚତା ${fh} ସେ.ମି. — ୪ ସେ.ମି.ରୁ ଅଧିକ ପାର୍ଥକ୍ୟ: ଅଲଟ୍ରାସାଉଣ୍ଡ ପାଇଁ ପଠାନ୍ତୁ।`, 'k218');
  if ((a.lie === 'breech' || a.lie === 'trans') && g.days >= 36 * 7) F('warn', 'Baby not head-down after 36 weeks: plan delivery at a hospital with caesarean facility (FRU).', '୩୬ ସପ୍ତାହ ପରେ ମଧ୍ୟ ଶିଶୁର ମୁଣ୍ଡ ତଳକୁ ନାହିଁ: ଅସ୍ତ୍ରୋପଚାର ସୁବିଧା ଥିବା ଡାକ୍ତରଖାନାରେ (FRU) ପ୍ରସବ ଯୋଜନା କରନ୍ତୁ।', 'k31');
  if (a.fm === 'reduced' || a.fm === 'absent') F('danger', "Baby's movements reduced or absent: go to hospital today.", 'ଗର୍ଭସ୍ଥ ଶିଶୁର ଚଳପ୍ରଚଳ କମ୍ ବା ନାହିଁ: ଆଜି ହିଁ ଡାକ୍ତରଖାନା ଯାଆନ୍ତୁ।', 'k216');
  const fhr = K.num(a.fhr);
  if (fhr != null && (fhr < 110 || fhr > 160)) F('danger', `Fetal heart ${fhr}/min is outside 110–160: refer urgently.`, `ଗର୍ଭସ୍ଥ ଶିଶୁର ହୃତ୍‌ସ୍ପନ୍ଦନ ${fhr}/ମିନିଟ୍ (୧୧୦–୧୬୦ ବାହାରେ): ତୁରନ୍ତ ପଠାନ୍ତୁ।`);
  (a.sx || []).forEach(k => { const s = K.anc.SX.find(x => x.k === k); if (s) F(s.tone, s.en, s.or, s.hrp); });
  return out;
};

/* window status for the 4 ANCs */
K.anc.schedule = (p, today) => {
  today = today || K.d.today();
  const lmp = K.preg.lmpEq(p); if (!lmp) return [];
  const gaNow = K.preg.ga(p, today).days;
  const visits = (p.anc || []).map(a => ({ a, g: K.preg.ga(p, a.date).days }));
  const bands = [[-999, 14 * 7], [14 * 7, 28 * 7], [28 * 7, 36 * 7], [36 * 7, 999]]; // a visit counts for the band its GA falls in
  return K.anc.WINDOWS.map((w, i) => {
    const done = visits.filter(v => v.g >= bands[i][0] && v.g < bands[i][1]);
    const from = K.d.addDays(lmp, w.from), to = K.d.addDays(lmp, w.to);
    let st;
    if (done.length) st = 'done';
    else if (p.delivery || p.status !== 'active') st = 'na';
    else if (gaNow >= bands[i][1]) st = 'missed';
    else if (gaNow >= w.from) st = gaNow > w.to ? 'overdue' : 'due';
    else st = 'upcoming';
    return { w, from, to, st, visits: done.map(v => v.a).sort(K.by('date')) };
  });
};
K.anc.nextPmsma = (p, today) => {
  today = today || K.d.today();
  const lmp = K.preg.lmpEq(p); if (!lmp) return null;
  let d = K.d.parse(today); d.setDate(9); if (K.d.iso(d) < today) d.setMonth(d.getMonth() + 1);
  for (let i = 0; i < 10; i++) {
    let s = K.d.iso(d); if (K.d.parse(s).getDay() === 0) s = K.d.addDays(s, 1); // Sunday → next working day
    const g = K.preg.ga(p, s).days;
    if (g > 40 * 7) return null;
    if (g >= 13 * 7) return s;
    d.setMonth(d.getMonth() + 1);
  }
  return null;
};

/* ---------------------------------------------------------------- overview section */
K.preg.addSection(10, (c, p) => {
  const sched = K.anc.schedule(p);
  const visits = (p.anc || []).slice().sort(K.by('date', -1));
  const active = K.preg.isActive(p);
  const pm = active ? K.anc.nextPmsma(p) : null;
  const risk = K.preg.risk ? K.preg.risk(p, c) : null;
  const tone = { done: 'ok', due: 'due', overdue: 'over', missed: 'over', upcoming: 'soon', na: 'soon' };
  const lbl = { done: K.t('st.done'), due: K.t('st.due'), overdue: K.t('st.overdue'), missed: K.t('anc.missed'), upcoming: K.t('st.upcoming'), na: '–' };
  const wts = (p.anc || []).filter(a => a.weight != null).sort(K.by('date'));
  return h`<section class="sec">${K.ui.secH(K.t('preg.sec.anc'), active ? K.ui.btn(K.t('btn.add'), { href: K.preg.url(c, p, '/anc/new'), tone: 'ghost', size: 'sm', icon: 'plus' }) : '')}
    <div class="list">${sched.map(s => K.ui.li({ icon: s.st === 'done' ? 'check' : 'calendar', tone: s.st === 'done' ? 'done' : s.st === 'due' ? 'amber' : (s.st === 'overdue' || s.st === 'missed') ? 'red' : 'ink',
      title: K.t(s.w.key), meta: s.visits.length ? s.visits.map(v => K.d.fmt(v.date)).join(', ') : `${K.d.fmt(s.from, 'dm')} – ${K.d.fmt(s.to)}`, trail: K.ui.pill(lbl[s.st], tone[s.st]) }))}
      ${pm ? K.ui.li({ icon: 'hospital', tone: 'info', title: K.t('anc.pmsma'), meta: `${K.d.weekday(pm)}, ${K.d.fmt(pm, 'long')} · ${risk && risk.high ? K.t('anc.pmsmaHrp') : K.t('anc.pmsmaSub')}`, trail: K.ui.pill(K.d.rel(pm), 'info') }) : ''}
    </div>
    <p class="small faint" style="margin-top:6px">${K.t('anc.min4')}</p>
    ${visits.length ? h`<h3 style="margin:14px 0 8px">${K.t('anc.visits')}</h3><div class="list">${visits.map(a => {
      const g = K.preg.ga(p, a.date); const fl = K.anc.flags(a, p, c);
      const vals = [a.weight != null ? `${K.n(a.weight)} ${K.t('u.kg')}` : '', a.bpSys ? `BP ${K.digits(a.bpSys + '/' + (a.bpDia || '–'))}` : '', a.hb != null ? `Hb ${K.n(a.hb)}` : ''].filter(Boolean).join(' · ');
      return K.ui.li({ href: K.preg.url(c, p, '/anc/' + a.id), icon: fl.some(f => f.tone === 'danger') ? 'alert' : fl.length ? 'info' : 'check', tone: fl.some(f => f.tone === 'danger') ? 'red' : fl.length ? 'amber' : 'done',
        title: `${K.d.fmt(a.date)} · ${K.preg.gaShort(g)}`, meta: vals || K.t('anc.none'), trail: fl.length ? K.ui.pill(K.digits(fl.length), fl.some(f => f.tone === 'danger') ? 'over' : 'due', 'alert') : '' });
    })}</div>` : h`<p class="small">${K.t('anc.none')}</p>`}
    ${wts.length >= 2 ? K.anc.weightChart(p, wts) : ''}
  </section>`;
});

/* tiny weight-by-week chart with the 1 kg/month guide line from the first weight */
K.anc.weightChart = (p, wts) => {
  const pts = wts.map(a => ({ x: K.preg.ga(p, a.date).days / 7, y: +a.weight }));
  const x0 = 0, x1 = 42, ys = pts.map(q => q.y);
  const y0 = Math.floor(Math.min(...ys) - 2), y1 = Math.ceil(Math.max(...ys, pts[0].y + 10) + 1);
  const W = 320, H = 150, L = 34, B = 22, T = 8, R = 8;
  const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  const first = pts[0]; // guide: flat to 12 weeks, then about 1 kg a month (MCP card)
  const g12 = Math.max(first.x, 12);
  const guide = [[first.x, first.y], [g12, first.y], [40, first.y + (40 - g12) / 4.345]];
  const gx = [0, 12, 28, 40], gy = []; for (let v = Math.ceil(y0 / 5) * 5; v <= y1; v += 5) gy.push(v);
  const gain = pts[pts.length - 1].y - pts[0].y;
  return h`<div class="k-card" style="margin-top:12px"><div class="eyebrow">${K.t('anc.wtTrend')}</div>
    <svg class="mini-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${K.t('anc.wtTrend')}">
      ${gy.map(v => h`<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" class="t">${K.digits(v)}</text>`)}
      ${gx.map(v => h`<line x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${H - B}" class="g"/><text x="${X(v)}" y="${H - 6}" text-anchor="middle" class="t">${K.digits(v)}</text>`)}
      <polyline points="${guide.map(q => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(' ')}" class="guide"/>
      <polyline points="${pts.map(q => `${X(q.x).toFixed(1)},${Y(q.y).toFixed(1)}`).join(' ')}" class="line"/>
      ${pts.map(q => h`<circle cx="${X(q.x).toFixed(1)}" cy="${Y(q.y).toFixed(1)}" r="3.6" class="dot"/>`)}
    </svg>
    <p class="small" style="margin:6px 0 0">${K.t('anc.wtGain', { kg: K.n(gain), d: K.d.fmt(wts[0].date) })}. ${K.t('anc.wtAdvice')}</p></div>`;
};

/* ---------------------------------------------------------------- visit form */
function ancForm(c, p, a, isNew) {
  const hcp = K.settings.isHcp();
  const F = (name, label, o = {}) => K.ui.field(Object.assign({ name, label, value: a[name], attrs: { 'data-live': 'ancPreview' } }, o));
  const ch = (name, label, opts, val) => K.ui.choices({ name, label, value: val != null ? val : a[name], options: opts, live: 'ancPreview' });
  const ua = ['nil', 'trace', '1', '2', '3'].map(v => ({ v, l: v === 'nil' ? K.t('u.nil') : v === 'trace' ? K.t('u.trace') : '+'.repeat(+v) }));
  const us = ['nil', '1', '2', '3'].map(v => ({ v, l: v === 'nil' ? K.t('u.nil') : '+'.repeat(+v) }));
  const td = p.td || {};
  const tdOpts = [{ v: '', l: K.t('none') }, { v: 'td1', l: 'Td-1' }, { v: 'td2', l: 'Td-2' }, { v: 'booster', l: 'Td booster' }];
  const hw = h`<div class="frow">${F('pulse', K.t('anc.pulse'), { type: 'number', unit: '/min' })}${F('temp', K.t('anc.temp'), { type: 'decimal', unit: '°C' })}</div>
      ${K.ui.yn({ name: 'pallor', q: K.t('anc.pallor'), value: a.pallor, live: 'ancPreview' })}
      ${K.ui.yn({ name: 'jaundice', q: K.t('anc.jaundice'), value: a.jaundice, live: 'ancPreview' })}
      ${ch('oedema', K.t('anc.oedema'), ['none', 'feet', 'gen'].map(v => ({ v, l: K.t('oed.' + v) })))}
      <div class="frow">${F('fh', K.t('anc.fh'), { type: 'decimal', unit: K.t('u.cm') })}${F('fhr', K.t('anc.fhr'), { type: 'number', unit: '/min' })}</div>
      ${ch('lie', K.t('anc.lie'), ['ceph', 'breech', 'trans', 'np'].map(v => ({ v, l: K.t('lie.' + v) })))}
      ${ch('fm', K.t('anc.fm'), ['normal', 'reduced', 'absent'].map(v => ({ v, l: K.t('fm.' + v), tone: v === 'normal' ? '' : 'danger' })))}
      ${F('pv', K.t('anc.pv'))}`;
  return h`<form class="form" data-form="ancSave" data-id="${c.id}" data-pid="${p.id}" data-aid="${isNew ? '' : a.id}" novalidate>
    <div class="fgroup">
      ${F('date', K.t('date'), { type: 'date', max: K.d.today(), required: true })}
      ${ch('place', K.t('anc.where'), ['mamata', 'sc', 'phc', 'chc', 'pmsma', 'pvt', 'home'].map(v => ({ v, l: K.t('pl.' + v) })))}
      ${ch('by', K.t('anc.by'), ['anm', 'doc', 'asha', 'self'].map(v => ({ v, l: K.t('by.' + v) })))}
    </div>
    <fieldset class="fgroup"><legend>${K.t('anc.measure')}</legend>
      ${F('weight', K.t('anc.weight'), { type: 'decimal', unit: K.t('u.kg') })}
      <div class="field"><span class="lbl">${K.t('anc.bp')}</span><div class="frow">${F('bpSys', K.t('anc.sys'), { type: 'number', unit: 'mmHg' })}${F('bpDia', K.t('anc.dia'), { type: 'number', unit: 'mmHg' })}</div></div>
      ${F('hb', K.t('anc.hb'), { type: 'decimal', unit: 'g/dl' })}
      ${ch('urineAlb', K.t('anc.urineAlb'), ua)}
      ${ch('urineSugar', K.t('anc.urineSugar'), us)}
    </fieldset>
    <fieldset class="fgroup"><legend>${K.t('anc.sx')}</legend>
      <div class="choices">${K.anc.SX.map(s => h`<label class="choice ${s.tone === 'danger' ? 'danger' : 'warn'}"><input type="checkbox" name="sx" value="${s.k}" ${(a.sx || []).includes(s.k) ? K.raw('checked') : ''} data-live="ancPreview"><span>${K.L(s)}</span></label>`)}</div>
    </fieldset>
    <fieldset class="fgroup"><legend>${K.t('anc.given')}</legend>
      ${ch('tdDose', K.t('anc.td'), tdOpts, a.tdDose || '')}
      <div class="frow">${F('ifaGiven', K.t('anc.ifa'), { type: 'number', unit: K.t('anc.tabs') })}${F('caGiven', K.t('anc.ca'), { type: 'number', unit: K.t('anc.tabs') })}</div>
      ${K.ui.sw({ name: 'albGiven', checked: !!a.albGiven, title: K.t('anc.alb') })}
    </fieldset>
    ${hcp ? h`<fieldset class="fgroup"><legend>${K.t('anc.hw')}</legend>${hw}</fieldset>`
      : h`<details class="acc"><summary>${K.ui.icon('users', 'sm')}${K.t('anc.showMore')}</summary><div class="acc-b form">${hw}</div></details>`}
    <div class="fgroup">${F('next', K.t('anc.next'), { type: 'date' })}${F('notes', K.t('notes'), { type: 'textarea', rows: 2 })}</div>
    <section id="anc-preview" aria-live="polite"></section>
    <div class="btn-bar">${K.ui.btn(K.t('anc.save'), { type: 'submit', icon: 'check' })}${!isNew ? K.ui.btn('', { act: 'ancDelete', arg: a.id, tone: 'ghost', icon: 'trash', aria: K.t('btn.delete') }) : ''}</div>
  </form>`;
}
K.anc.renderFlags = (fl) => fl.length
  ? h`<div class="stack">${fl.map(f => K.ui.callout(f.tone === 'danger' ? 'danger' : 'warn', '', K.L(f)))}</div>`
  : K.ui.callout('', '', K.t('anc.allOk'), 'check');
K.live.ancPreview = K.debounce(() => {
  const f = K.$('form[data-form="ancSave"]'); if (!f) return;
  const c = K.card.load(f.dataset.id), p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  const v = K.formData(f); v.date = v.date || K.d.today(); v.id = f.dataset.aid || '__new';
  const box = K.$('#anc-preview'); box.innerHTML = K.hv(h`<h3 style="margin:4px 0 8px">${K.t('anc.result')}</h3>${K.anc.renderFlags(K.anc.flags(v, p, c))}`);
}, 300);

const ancRoute = ({ id, pid, aid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const isNew = aid === 'new';
  const a = isNew ? { date: K.d.today(), place: '', by: K.settings.isHcp() ? 'anm' : '' } : (p.anc || []).find(x => x.id === aid);
  if (!a) return K.screens.notFound();
  const g = K.preg.ga(p, a.date);
  return { title: isNew ? K.t('anc.new') : K.t('anc.edit'), sub: c.mother.name, back: K.preg.url(c, p).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(g ? K.preg.gaText(g) : '', isNew ? K.t('anc.new') : K.t('anc.edit') + ' · ' + K.d.fmt(a.date))}${ancForm(c, p, a, isNew)}</div>`,
    mount() { K.live.ancPreview(); } };
};
K.route('/card/:id/preg/:pid/anc/:aid', ancRoute);

K.forms.ancSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  if (!v.date || !K.d.valid(v.date)) { K.ui.toast(K.t('err.date')); return; }
  if (K.d.diff(v.date, K.d.today()) < 0) { K.ui.toast(K.t('err.future')); return; }
  const lmp = K.preg.lmpEq(p); if (lmp && (K.d.diff(lmp, v.date) < 0 || (p.delivery && K.d.diff(p.delivery.date, v.date) > 0))) { K.ui.toast(K.t('anc.dateOut'), 3500); return; }
  let a = f.dataset.aid ? (p.anc || []).find(x => x.id === f.dataset.aid) : null;
  if (!a) { a = { id: K.uid('a') }; (p.anc = p.anc || []).push(a); }
  const keys = ['date', 'place', 'by', 'weight', 'bpSys', 'bpDia', 'hb', 'urineAlb', 'urineSugar', 'pulse', 'temp', 'pallor', 'jaundice', 'oedema', 'fh', 'fhr', 'lie', 'fm', 'pv', 'tdDose', 'ifaGiven', 'caGiven', 'next', 'notes'];
  keys.forEach(k => { if (v[k] == null || v[k] === '') delete a[k]; else a[k] = (k === 'pallor' || k === 'jaundice') ? +v[k] : v[k]; });
  a.sx = v.sx || []; a.albGiven = !!v.albGiven;
  // carry "given today" into the pregnancy trackers
  p.td = p.td || {};
  if (a.tdDose && !p.td[a.tdDose]) p.td[a.tdDose] = a.date;
  if (a.albGiven && !p.albendazole) p.albendazole = a.date;
  if (a.ifaGiven) { p.ifa = p.ifa || { days: {} }; p.ifa.issued = (p.ifa.issued || []).filter(x => x.visit !== a.id); p.ifa.issued.push({ date: a.date, n: a.ifaGiven, visit: a.id }); if (!p.ifa.start) p.ifa.start = a.date; }
  if (a.caGiven) { p.calcium = p.calcium || { days: {} }; p.calcium.issued = (p.calcium.issued || []).filter(x => x.visit !== a.id); p.calcium.issued.push({ date: a.date, n: a.caGiven, visit: a.id }); if (!p.calcium.start) p.calcium.start = a.date; }
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.preg.url(c, p).slice(1));
};
K.acts.ancDelete = async (el) => {
  const f = el.closest('form'); const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  if (!(await K.ui.confirm(K.t('anc.deleteQ'), { danger: true, ok: K.t('btn.delete') }))) return;
  p.anc = (p.anc || []).filter(x => x.id !== el.dataset.arg);
  ['ifa', 'calcium'].forEach(k => { if (p[k] && p[k].issued) p[k].issued = p[k].issued.filter(x => x.visit !== el.dataset.arg); });
  await K.store.save(c); K.go(K.preg.url(c, p).slice(1));
};

/* ---------------------------------------------------------------- due items */
K.due.add((c, today) => {
  const p = K.card.activePreg(c); if (!p || !K.preg.edd(p)) return [];
  const out = []; const g = K.preg.ga(p, today); const url = K.preg.url(c, p);
  const sched = K.anc.schedule(p, today);
  const next = sched.find(s => s.st === 'due' || s.st === 'overdue' || s.st === 'upcoming');
  if (next) out.push({ id: 'anc' + next.w.n, kind: 'anc', icon: 'calendar', href: url + '/anc/new', who: c.mother.name,
    title: { en: `ANC ${next.w.n} check-up`, or: `${['', '୧ମ', '୨ୟ', '୩ୟ', '୪ର୍ଥ'][next.w.n]} ସ୍ୱାସ୍ଥ୍ୟ ପରୀକ୍ଷା (ଏଏନ୍‌ସି)` },
    date: next.st === 'upcoming' ? next.from : (next.st === 'overdue' ? next.to : today), status: next.st === 'overdue' ? 'overdue' : undefined });
  const pm = K.anc.nextPmsma(p, today);
  if (pm && K.d.diff(today, pm) <= 31) out.push({ id: 'pmsma', kind: 'anc', icon: 'hospital', href: url, title: { en: 'PMSMA doctor check-up (9th)', or: 'PMSMA ଡାକ୍ତରୀ ପରୀକ୍ଷା (୯ ତାରିଖ)' }, date: pm });
  const e = K.preg.edd(p);
  if (g && g.days > 287) out.push({ id: 'postdate', kind: 'danger', icon: 'alert', href: url, title: { en: 'Past the expected date by more than 7 days — see a doctor today', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖରୁ ୭ ଦିନରୁ ଅଧିକ ବିତିଗଲାଣି — ଆଜି ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ' }, date: K.d.addDays(e, 7), status: 'overdue' });
  return out;
});
K.summary.add((c) => {
  const p = K.card.activePreg(c); if (!p) return [];
  const last = (p.anc || []).slice().sort(K.by('date', -1))[0]; if (!last) return [];
  return [`${K.t('anc.title')} ${K.d.fmt(last.date)}: ${[last.weight != null ? K.n(last.weight) + ' kg' : '', last.bpSys ? 'BP ' + last.bpSys + '/' + (last.bpDia || '') : '', last.hb != null ? 'Hb ' + last.hb : ''].filter(Boolean).join(', ')}`];
});
