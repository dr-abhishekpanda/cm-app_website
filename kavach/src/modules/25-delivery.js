/* ============================================================================
   modules/25-delivery — delivery record, postnatal (PNC/HBNC) home visits
   for mother and newborn, postpartum IFA/calcium.
   HBNC schedule (Odisha MCP V-2023-24 p.10; HBNC guidelines): ASHA visits on
   days 3, 7, 14, 21, 28, 42 (plus day 1 for home births); after SNCU/NBSU
   discharge the same days are counted from discharge.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'del.title': { en: 'Delivery record', or: 'ପ୍ରସବ ବିବରଣୀ' },
  'del.date': { en: 'Date of delivery', or: 'ପ୍ରସବ ତାରିଖ' },
  'del.time': { en: 'Time', or: 'ସମୟ' },
  'del.place': { en: 'Place of delivery', or: 'ପ୍ରସବ ସ୍ଥାନ' },
  'del.place.inst': { en: 'Hospital', or: 'ଡାକ୍ତରଖାନା' }, 'del.place.home': { en: 'Home', or: 'ଘର' }, 'del.place.transit': { en: 'On the way', or: 'ବାଟରେ' },
  'del.facility': { en: 'Hospital name', or: 'ଡାକ୍ତରଖାନାର ନାମ' },
  'del.facType': { en: 'Type of facility', or: 'ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ରର ପ୍ରକାର' },
  'fac.sc': { en: 'Sub-centre', or: 'ଉପକେନ୍ଦ୍ର' }, 'fac.phc': { en: 'PHC', or: 'ପ୍ରା.ସ୍ୱା.କେ.' }, 'fac.chc': { en: 'CHC', or: 'ଗୋ.ସ୍ୱା.କେ.' }, 'fac.sdh': { en: 'Sub-divisional hospital', or: 'ଉପଖଣ୍ଡ ଡାକ୍ତରଖାନା' },
  'fac.dh': { en: 'District hospital', or: 'ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ' }, 'fac.mch': { en: 'Medical college', or: 'ମେଡିକାଲ୍ କଲେଜ' }, 'fac.pvt': { en: 'Private hospital', or: 'ଘରୋଇ ଡାକ୍ତରଖାନା' },
  'del.by': { en: 'Delivery conducted by', or: 'କିଏ ପ୍ରସବ କରାଇଲେ' },
  'att.doc': { en: 'Doctor', or: 'ଡାକ୍ତର' }, 'att.sba': { en: 'Nurse / ANM (skilled)', or: 'ନର୍ସ / ଏ.ଏନ୍.ଏମ୍. (ଦକ୍ଷ)' }, 'att.other': { en: 'Other / untrained', or: 'ଅନ୍ୟ / ଅପ୍ରଶିକ୍ଷିତ' },
  'del.type': { en: 'Type of delivery', or: 'ପ୍ରସବର ପ୍ରକାର' },
  'dt.normal': { en: 'Normal', or: 'ସାଧାରଣ' }, 'dt.assisted': { en: 'Assisted (vacuum / forceps)', or: 'ଯାନ୍ତ୍ରିକ' }, 'dt.cs': { en: 'Caesarean', or: 'ଅସ୍ତ୍ରୋପଚାର' },
  'del.ga': { en: 'Weeks of pregnancy at delivery', or: 'ପ୍ରସବ ସମୟରେ ଗର୍ଭର ସପ୍ତାହ' },
  'del.gaBand': { en: 'Delivered', or: 'ପ୍ରସବ ସମୟ' },
  'ga.lt34': { en: 'Before 34 weeks', or: '୩୪ ସପ୍ତାହ ପୂର୍ବରୁ' }, 'ga.34to37': { en: '34–37 weeks', or: '୩୪-୩୭ ସପ୍ତାହ ମଧ୍ୟରେ' }, 'ga.ge37': { en: 'After 37 weeks', or: '୩୭ ସପ୍ତାହ ପରେ' },
  'del.acs': { en: 'If born before 34 weeks: antenatal corticosteroid (dexamethasone) given?', or: 'ଯଦି ୩୪ ସପ୍ତାହ ପୂର୍ବରୁ ପ୍ରସବ ହୋଇଥାଏ, ତେବେ Antenatal Corticosteroid (ଡେକ୍ସାମିଥାଜୋନ) ଦିଆଯାଇଛି କି?' },
  'del.babies': { en: 'Number of babies', or: 'ଶିଶୁଙ୍କ ସଂଖ୍ୟା' },
  'del.baby': { en: 'Baby {n}', or: 'ଶିଶୁ {n}' },
  'del.outcome': { en: 'Outcome', or: 'ଫଳାଫଳ' }, 'out.live': { en: 'Live birth', or: 'ଜୀବିତ ଜନ୍ମ' }, 'out.still': { en: 'Stillbirth', or: 'ମୃତ ଜନ୍ମ' },
  'del.stay': { en: 'Days in hospital after delivery', or: 'ପ୍ରସବ ପରେ କେତେଦିନ ଡାକ୍ତରଖାନାରେ ରହିଲେ' },
  'del.compl': { en: 'Problems at delivery, if any', or: 'ଅସୁବିଧା, ଯଦି ହୋଇଛି' },
  'cmp.pph': { en: 'Heavy bleeding (PPH)', or: 'ଅତିରିକ୍ତ ରକ୍ତସ୍ରାବ (PPH)' }, 'cmp.ecl': { en: 'Fits (eclampsia)', or: 'ବାତ (ଏକ୍ଲାମ୍ପସିଆ)' }, 'cmp.obst': { en: 'Prolonged / obstructed labour', or: 'ଦୀର୍ଘ / ଅବରୁଦ୍ଧ ପ୍ରସବ' },
  'cmp.ret': { en: 'Retained placenta', or: 'ଗର୍ଭଫୁଲ ରହିଯିବା' }, 'cmp.tear': { en: 'Tear needing stitches', or: 'ଛିଣ୍ଡିବା (ସିଲେଇ ଆବଶ୍ୟକ)' }, 'cmp.sepsis': { en: 'Infection / fever', or: 'ସଂକ୍ରମଣ / ଜ୍ୱର' },
  'del.save': { en: 'Save delivery', or: 'ପ୍ରସବ ବିବରଣୀ ସେଭ୍ କରନ୍ତୁ' },
  'del.babyName': { en: 'Name (optional)', or: 'ନାମ (ଇଚ୍ଛାଧୀନ)' },
  'del.after': { en: 'After delivery', or: 'ପ୍ରସବ ପରେ' },
  'del.summary': { en: '{d} · {place} · {type}', or: '{d} · {place} · {type}' },
  'del.edit': { en: 'Edit delivery record', or: 'ପ୍ରସବ ବିବରଣୀ ସଂଶୋଧନ' },
  'pnc.title': { en: 'After delivery', or: 'ପ୍ରସବ ପରର ଯତ୍ନ' },
  'pnc.visits': { en: 'Home visits (mother and newborn)', or: 'ଗୃହ ପରିଦର୍ଶନ (ମା\' ଓ ନବଜାତ ଶିଶୁ)' },
  'pnc.day': { en: 'Day {n}', or: '{n} ଦିନ' },
  'pnc.visit': { en: 'Home visit · day {n}', or: 'ଗୃହ ପରିଦର୍ଶନ · {n} ଦିନ' },
  'pnc.mother': { en: "Mother's check", or: "ମା'ଙ୍କ ପ୍ରସବ ପରବର୍ତ୍ତୀ ଆକଳନ" },
  'pnc.baby': { en: 'Newborn check', or: 'ନବଜାତ ଶିଶୁର ଆକଳନ' },
  'pnc.rule': { en: 'The ASHA visits on days 3, 7, 14, 21, 28 and 42 after delivery (also day 1 if born at home). Stay 48 hours in hospital after delivery.', or: 'ପ୍ରସବ ପରେ ଆଶାକର୍ମୀ ୩ୟ, ୭ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ଗୃହ ପରିଦର୍ଶନ କରିବେ (ଘରେ ଜନ୍ମ ହୋଇଥିଲେ ୧ମ ଦିନ ମଧ୍ୟ)। ପ୍ରସବ ପରେ ୪୮ ଘଣ୍ଟା ଡାକ୍ତରଖାନାରେ ରୁହନ୍ତୁ।' },
  'pnc.save': { en: 'Save visit', or: 'ପରିଦର୍ଶନ ସେଭ୍ କରନ୍ତୁ' },
  'pnc.ppTabs': { en: 'Iron and calcium after delivery', or: 'ପ୍ରସବ ପରେ ଲୌହ ଓ କ୍ୟାଲସିୟମ୍' },
  'pnc.ppRule': { en: 'Take one IFA tablet and two calcium tablets every day for 6 months after delivery.', or: 'ପ୍ରସବ ପରଠାରୁ ୬ ମାସ ପର୍ଯ୍ୟନ୍ତ ଗୋଟିଏ IFA ଏବଂ ଦୁଇଟି କ୍ୟାଲସିୟମ୍ ବଟିକା ନିଶ୍ଚିତ ଖାଆନ୍ତୁ।' },
  'pnc.result': { en: 'What this visit shows', or: 'ଏହି ପରିଦର୍ଶନରୁ କ\'ଣ ଜଣାପଡ଼ିଲା' },
  'pnc.sncuNote': { en: 'Visits counted from SNCU/NBSU discharge on {d}.', or: '{d} ରେ SNCU/NBSU ଡିସ୍‌ଚାର୍ଜ ଦିନଠାରୁ ପରିଦର୍ଶନ ଗଣନା।' },
  // mother checks (Odisha p.6 list)
  'pm.pallor': { en: 'Palms or eyes pale (anaemia)', or: 'ହାତ ପାପୁଲି, ଆଖି ଶେଥା ପଡ଼ିଯିବା ବା ରକ୍ତହୀନତା ହେବା' },
  'pm.breast': { en: 'Breasts', or: 'ସ୍ତନ' }, 'br.normal': { en: 'Normal', or: 'ସାଧାରଣ' }, 'br.engorged': { en: 'Hard, swollen, painful', or: 'ଟାଣ/ନରମ/ଫୁଲିଯିବା' }, 'br.cracked': { en: 'Cracked nipple', or: 'ସ୍ତନବୃନ୍ତ ଫାଟିଯିବା' },
  'pm.uterus': { en: 'Pain or tenderness in the uterus', or: 'ଗର୍ଭାଶୟର ଦରଜ' },
  'pm.discharge': { en: 'Fever or foul-smelling discharge', or: 'ଜ୍ୱର କିମ୍ବା ଦୁର୍ଗନ୍ଧଯୁକ୍ତ ସ୍ରାବ' },
  'pm.episio': { en: 'Stitch site painful, swollen, or with pus or blood', or: 'ଏପିସିଓଟୋମି ଜାଗାରେ ବ୍ୟଥା /ଫୁଲିବା /ପୂଜ କିମ୍ବା ରକ୍ତ ବାହାରିବା' },
  'pm.pain': { en: 'Pain after delivery', or: 'ପ୍ରସବ ପରବର୍ତ୍ତୀ ଯନ୍ତ୍ରଣା' },
  'pm.bleed': { en: 'Heavy bleeding', or: 'ରକ୍ତ ସ୍ରାବ ହେବା' },
  'pm.fits': { en: 'Fits', or: 'ବାତ ମାରିବା' },
  'pm.headache': { en: 'Severe headache', or: 'ତୀକ୍ଷଣ ମୁଣ୍ଡବ୍ୟଥା ହେବା' },
  'pm.toilet': { en: 'Passing urine and stool normally', or: 'ପରିସ୍ରା / ମଳତ୍ୟାଗ କରିଛନ୍ତି' },
  'pm.bf': { en: 'Breastfeeding well', or: 'ସ୍ତନ୍ୟପାନ କରାଉଛନ୍ତି' },
  'pm.diet': { en: 'Eating normal food', or: 'ସାଧାରଣ ଖାଦ୍ୟ ଖାଉଛନ୍ତି' },
  'pm.rest': { en: 'Resting 8–10 hours a day', or: 'ଦିନକୁ ୮ ରୁ ୧୦ ଘଣ୍ଟା ବିଶ୍ରାମ' },
  'pm.mood': { en: 'Feeling very sad, anxious or unable to sleep most days', or: 'ଅଧିକାଂଶ ଦିନ ଅତ୍ୟଧିକ ଦୁଃଖ, ଚିନ୍ତା ବା ନିଦ ନ ହେବା' },
  'pm.fp': { en: 'Family planning counselling given', or: 'ପରିବାର ନିୟୋଜନ ପରାମର୍ଶ ଦିଆଗଲା' },
  'pm.other': { en: 'Any other problem', or: 'ଅନ୍ୟ କୌଣସି ଅସୁବିଧା' },
  // newborn checks (national MCP p.7 "Care of baby" + Odisha p.9)
  'pb.weight': { en: 'Weight', or: 'ଓଜନ' }, 'pb.temp': { en: 'Temperature (armpit)', or: 'ତାପମାତ୍ରା (କାଖ)' },
  'pb.breaths': { en: 'Breaths in one minute', or: 'ମିନିଟ୍‌ରେ ଶ୍ୱାସ ସଂଖ୍ୟା' },
  'pb.urine': { en: 'Passed urine', or: 'ପରିସ୍ରା କରୁଛି' }, 'pb.stool': { en: 'Passed stool', or: 'ଝାଡ଼ା ହେଉଛି' },
  'pb.ebf': { en: 'Only breast milk', or: 'କେବଳ ମା\' କ୍ଷୀର' },
  'pb.suck': { en: 'Sucking well', or: 'ଭଲ ଭାବେ ଚୁଚୁମୁଛି' }, 'pb.active': { en: 'Active (not drowsy)', or: 'ସକ୍ରିୟ (ନିସ୍ତେଜ ନୁହେଁ)' },
  'pb.diarrhoea': { en: 'Diarrhoea', or: 'ତରଳ ଝାଡ଼ା' }, 'pb.vomit': { en: 'Vomiting', or: 'ବାନ୍ତି' }, 'pb.fits': { en: 'Convulsions', or: 'ବାତ' },
  'pb.indrawing': { en: 'Chest indrawing', or: 'ଛାତି ଭିତରକୁ ପଶିବା' }, 'pb.jaundice': { en: 'Yellow palms or soles', or: 'ପାପୁଲି ବା ପାଦ ତଳ ହଳଦିଆ' },
  'pb.cord': { en: 'Cord stump', or: 'ନାଭି' }, 'cord.dry': { en: 'Dry, clean', or: 'ଶୁଖିଲା, ପରିଷ୍କାର' }, 'cord.red': { en: 'Red or with pus', or: 'ଲାଲ ବା ପୂଜ' },
  'pb.pustules': { en: 'Pus-filled boils on skin', or: 'ଚର୍ମରେ ପୂଜଥିବା ଫୋଟକା' }, 'pb.eyes': { en: 'Sticky or red eyes', or: 'ଆଖିରୁ ପିଚୁଟି ବା ଲାଲ ଆଖି' },
  'pb.kmc': { en: 'Kept warm (skin-to-skin if small)', or: 'ଉଷୁମ ରଖାଯାଇଛି (ଛୋଟ ଶିଶୁ ହେଲେ ଛାତିରେ ଲଗାଇ)' },
  'tool.breath': { en: 'Count breaths with the timer', or: 'ଟାଇମର୍ ସହ ଶ୍ୱାସ ଗଣନ୍ତୁ' },
});

K.pnc = {};
K.pnc.days = (p) => { const d = p.delivery || {}; return (d.place === 'inst' ? [3, 7, 14, 21, 28, 42] : [1, 3, 7, 14, 21, 28, 42]); };
K.pnc.base = (p, c) => { const d = p.delivery || {}; const kids = (c.children || []).filter(k => k.pregId === p.id); const s = kids.map(k => k.birth && k.birth.sncu && k.birth.sncuDischarge).filter(Boolean).sort().pop(); return s || d.date; };
K.pnc.schedule = (p, c, today) => {
  today = today || K.d.today(); if (!p.delivery || !p.delivery.date) return [];
  const base = K.pnc.base(p, c); // day 1 = day of birth (or of SNCU discharge)
  return K.pnc.days(p).map(n => {
    const date = K.d.addDays(base, n - 1);
    const v = (p.pnc || []).find(x => x.day === n);
    const lag = K.d.diff(date, today);
    const st = v ? 'done' : lag < 0 ? 'upcoming' : lag <= 2 ? 'due' : 'overdue';
    return { n, date, v, st };
  });
};

/* flags */
K.pnc.motherFlags = (m) => {
  const out = []; const F = (tone, key, extra) => out.push({ tone, en: K.i18n.dict[key].en + (extra ? ` — ${extra.en}` : ''), or: K.i18n.dict[key].or + (extra ? ` — ${extra.or}` : '') });
  const sys = K.num(m.bpSys), dia = K.num(m.bpDia), t = K.num(m.temp); const tC = t == null ? null : (t > 45 ? (t - 32) * 5 / 9 : t);
  if ((sys != null && sys >= 140) || (dia != null && dia >= 90)) out.push({ tone: 'danger', en: 'High BP after delivery (≥140/90): refer today — risk of eclampsia.', or: 'ପ୍ରସବ ପରେ ଉଚ୍ଚ ରକ୍ତଚାପ (≥୧୪୦/୯୦): ଆଜି ହିଁ ପଠାନ୍ତୁ — ଏକ୍ଲାମ୍ପସିଆ ଆଶଙ୍କା।' });
  if (tC != null && tC >= 38) out.push({ tone: 'danger', en: 'Fever after delivery: possible infection — refer.', or: 'ପ୍ରସବ ପରେ ଜ୍ୱର: ସଂକ୍ରମଣ ଆଶଙ୍କା — ପଠାନ୍ତୁ।' });
  const D = { tone: 'danger' }, W = { tone: 'warn' };
  [['bleed', D], ['fits', D], ['headache', D], ['uterus', D], ['discharge', D]].forEach(([k, o]) => { if (+m[k] === 1) F(o.tone, 'pm.' + k, { en: 'go to hospital', or: 'ଡାକ୍ତରଖାନା ଯାଆନ୍ତୁ' }); });
  [['pallor', W, { en: 'check haemoglobin; continue IFA', or: 'ହିମୋଗ୍ଲୋବିନ୍ ଯାଞ୍ଚ; IFA ଜାରି ରଖନ୍ତୁ' }], ['episio', W, { en: 'show to the ANM', or: 'ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଦେଖାନ୍ତୁ' }], ['pain', W, null]].forEach(([k, o, x]) => { if (+m[k] === 1) F(o.tone, 'pm.' + k, x); });
  if (m.breast === 'engorged') out.push({ tone: 'warn', en: 'Breasts hard and painful: feed often from both sides, check attachment; fever with a red breast needs a doctor.', or: 'ସ୍ତନ ଟାଣ ଓ ଯନ୍ତ୍ରଣାଦାୟକ: ଦୁଇପଟୁ ବାରମ୍ବାର ପିଆନ୍ତୁ, ଠିକ୍ ଭାବେ ଲଗାନ୍ତୁ; ଜ୍ୱର ସହ ଲାଲ ସ୍ତନ ହେଲେ ଡାକ୍ତର ଦେଖାନ୍ତୁ।' });
  if (m.breast === 'cracked') out.push({ tone: 'warn', en: 'Cracked nipple: correct the position and attachment; apply a little breast milk after feeds.', or: 'ସ୍ତନବୃନ୍ତ ଫାଟିଛି: ଶିଶୁକୁ ଠିକ୍ ଭାବେ ଲଗାନ୍ତୁ; ପିଆଇବା ପରେ ଟିକେ ମା\' କ୍ଷୀର ଲଗାନ୍ତୁ।' });
  if (+m.toilet === 0) out.push({ tone: 'warn', en: 'Not passing urine or stool normally: tell the ANM.', or: 'ପରିସ୍ରା ବା ମଳତ୍ୟାଗ ସାଧାରଣ ନୁହେଁ: ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଜଣାନ୍ତୁ।' });
  if (+m.bf === 0) out.push({ tone: 'warn', en: 'Breastfeeding difficulty: ask the ASHA/ANM to help with position and attachment.', or: 'ସ୍ତନ୍ୟପାନରେ ଅସୁବିଧା: ଆଶା/ଏ.ଏନ୍.ଏମ୍.ଙ୍କ ସାହାଯ୍ୟ ନିଅନ୍ତୁ।' });
  if (+m.mood === 1) out.push({ tone: 'warn', en: 'Low mood or worry after delivery is common and treatable. Talk to the ANM or doctor; Tele-MANAS 14416 is free.', or: 'ପ୍ରସବ ପରେ ମନ ଦୁଃଖ ବା ଚିନ୍ତା ସାଧାରଣ ଓ ଚିକିତ୍ସା ଯୋଗ୍ୟ। ଏ.ଏନ୍.ଏମ୍. ବା ଡାକ୍ତରଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ; ଟେଲି-ମାନସ୍ ୧୪୪୧୬ ମାଗଣା।' });
  return out;
};
K.pnc.babyFlags = (b, k, day) => {
  const out = []; const D = (en, or) => out.push({ tone: 'danger', en, or }); const W = (en, or) => out.push({ tone: 'warn', en, or });
  const t = K.num(b.temp); const tC = t == null ? null : (t > 45 ? (t - 32) * 5 / 9 : t);
  if (tC != null && tC >= 37.5) D('Feels hot (37.5 °C or more): danger sign — take to hospital.', 'ଗରମ (୩୭.୫ °C ବା ଅଧିକ): ବିପଦ ଲକ୍ଷଣ — ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ।');
  if (tC != null && tC < 35.5) D('Feels cold (below 35.5 °C): warm skin-to-skin and take to hospital.', 'ଥଣ୍ଡା (୩୫.୫ °C ରୁ କମ୍): ଛାତିରେ ଲଗାଇ ଉଷୁମ କରି ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ।');
  const br = K.num(b.breaths); if (br != null && br >= 60) D(`${br} breaths a minute (60 or more): fast breathing — take to hospital.`, `ମିନିଟ୍‌କୁ ${br} ଥର ଶ୍ୱାସ (୬୦ ବା ଅଧିକ): ଦ୍ରୁତ ଶ୍ୱାସ — ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ।`);
  if (+b.fits === 1) D('Convulsions: take to hospital now.', 'ବାତ: ଏବେ ହିଁ ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ।');
  if (+b.indrawing === 1) D('Chest indrawing: take to hospital now.', 'ଛାତି ଭିତରକୁ ପଶୁଛି: ଏବେ ହିଁ ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ।');
  if (+b.suck === 0) D('Not sucking well: danger sign.', 'ଭଲ ଭାବେ ଚୁଚୁମୁନାହିଁ: ବିପଦ ଲକ୍ଷଣ।');
  if (+b.active === 0) D('Drowsy or moves only when touched: danger sign.', 'ନିସ୍ତେଜ ବା ଛୁଇଁଲେ ହିଁ ହଲେ: ବିପଦ ଲକ୍ଷଣ।');
  if (+b.jaundice === 1) D('Yellow palms or soles: severe jaundice — take to hospital.', 'ପାପୁଲି ବା ପାଦ ତଳ ହଳଦିଆ: ଗୁରୁତର ଜଣ୍ଡିସ୍ — ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ।');
  if (b.cord === 'red') D('Red or pus-filled cord: infection — see the ANM today.', 'ନାଭି ଲାଲ ବା ପୂଜ: ସଂକ୍ରମଣ — ଆଜି ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଦେଖାନ୍ତୁ।');
  if (+b.pustules === 1) W('Skin boils with pus: see the ANM.', 'ଚର୍ମରେ ପୂଜଥିବା ଫୋଟକା: ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଦେଖାନ୍ତୁ।');
  if (+b.diarrhoea === 1) W('Diarrhoea: keep breastfeeding; see the ANM.', 'ତରଳ ଝାଡ଼ା: ସ୍ତନ୍ୟପାନ ଜାରି ରଖନ୍ତୁ; ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଦେଖାନ୍ତୁ।');
  if (+b.vomit === 1) W('Vomiting: see the ANM.', 'ବାନ୍ତି: ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଦେଖାନ୍ତୁ।');
  if (+b.eyes === 1) W('Sticky or red eyes: see the ANM.', 'ଆଖି ପିଚୁଟି ବା ଲାଲ: ଏ.ଏନ୍.ଏମ୍.ଙ୍କୁ ଦେଖାନ୍ତୁ।');
  if (+b.urine === 0 && day >= 2) W('No urine: danger if none within 48 hours of birth.', 'ପରିସ୍ରା ନାହିଁ: ଜନ୍ମର ୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ନ ହେଲେ ବିପଦ।');
  if (+b.ebf === 0) W('Give only breast milk for 6 months — no water, honey or other milk.', '୬ ମାସ ପର୍ଯ୍ୟନ୍ତ କେବଳ ମା\' କ୍ଷୀର — ପାଣି, ମହୁ ବା ଅନ୍ୟ କ୍ଷୀର ନୁହେଁ।');
  const w = K.num(b.weight), bw = k && k.birthWeight;
  if (w != null && bw) { const pct = (w - bw) / bw * 100;
    if (day <= 7 && pct < -10) W(`Lost ${K.round(-pct, 0)}% of birth weight: check feeding.`, `ଜନ୍ମ ଓଜନରୁ ${K.round(-pct, 0)}% କମିଛି: ସ୍ତନ୍ୟପାନ ଯାଞ୍ଚ କରନ୍ତୁ।`);
    if (day >= 14 && w < bw) W('Not back to birth weight by 2 weeks: check feeding with the ANM.', '୨ ସପ୍ତାହରେ ଜନ୍ମ ଓଜନରେ ପହଞ୍ଚିନାହିଁ: ଏ.ଏନ୍.ଏମ୍.ଙ୍କ ସହ ସ୍ତନ୍ୟପାନ ଯାଞ୍ଚ କରନ୍ତୁ।'); }
  return out;
};
K.pnc.flagList = (fl) => fl.length ? h`<div class="stack">${fl.map(f => K.ui.callout(f.tone === 'danger' ? 'danger' : 'warn', '', K.L(f)))}</div>` : K.ui.callout('', '', K.t('anc.allOk'), 'check');

/* ---------------------------------------------------------------- delivery form */
K.route('/card/:id/preg/:pid/delivery', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const d = p.delivery || { date: K.d.today(), place: 'inst', type: 'normal', babies: [{ outcome: 'live' }], n: 1 };
  const g = K.preg.ga(p, d.date); const gaW = d.gaWeeks != null ? d.gaWeeks : (g ? g.w : null);
  const nb = d.n || (d.babies || []).length || 1;
  const baby = (i) => { const b = (d.babies || [])[i] || {}; const kid = b.childId ? K.card.findKid(c, b.childId) : null; const pre = `b${i + 1}_`;
    return h`<fieldset class="fgroup baby-fs" data-baby="${i + 1}" ${i >= nb ? K.raw('hidden') : ''}><legend>${K.t('del.baby', { n: i + 1 })}</legend>
      ${K.ui.choices({ name: pre + 'outcome', label: K.t('del.outcome'), value: b.outcome || 'live', options: [{ v: 'live', l: K.t('out.live') }, { v: 'still', l: K.t('out.still'), tone: 'danger' }] })}
      ${K.ui.choices({ name: pre + 'sex', label: K.t('child.sex'), value: b.sex || (kid && kid.sex), options: [{ v: 'f', l: K.t('sex.f') }, { v: 'm', l: K.t('sex.m') }] })}
      <div class="frow">${K.ui.field({ name: pre + 'wt', type: 'decimal', label: K.t('child.bw'), unit: K.t('u.kg'), value: b.wt != null ? b.wt : (kid && kid.birthWeight) })}${K.ui.field({ name: pre + 'name', label: K.t('del.babyName'), value: kid ? kid.name : b.name })}</div>
      ${K.ui.yn({ name: pre + 'cried', q: K.t('child.cried'), value: b.cried, pos: true })}
      ${K.ui.yn({ name: pre + 'resus', q: K.t('child.resus'), value: b.resus })}
      ${K.ui.yn({ name: pre + 'vitk', q: K.t('child.vitk'), value: b.vitk, pos: true })}
      ${K.ui.choices({ name: pre + 'bf', label: K.t('child.bf'), value: b.bf, options: ['1h', '24h', 'late'].map(v => ({ v, l: K.t('bf.' + v), tone: v === 'late' ? 'warn' : '' })) })}
      ${K.ui.yn({ name: pre + 'colostrum', q: K.t('child.colostrum'), value: b.colostrum, pos: true })}
    </fieldset>`; };
  return {
    title: K.t('del.title'), sub: c.mother.name, back: K.preg.url(c, p).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.t('preg.overview'), K.t('del.title'))}
      <form class="form" data-form="delSave" data-id="${id}" data-pid="${pid}" novalidate>
        <div class="fgroup">
          <div class="frow">${K.ui.field({ name: 'date', type: 'date', label: K.t('del.date'), value: d.date, max: K.d.today(), required: true, attrs: { 'data-live': 'delGa' } })}${K.ui.field({ name: 'time', type: 'time', label: K.t('del.time'), value: d.time })}</div>
          ${K.ui.choices({ name: 'place', label: K.t('del.place'), value: d.place, options: ['inst', 'home', 'transit'].map(v => ({ v, l: K.t('del.place.' + v) })) })}
          ${K.ui.field({ name: 'facility', label: K.t('del.facility'), value: d.facility || (p.birthPlan && p.birthPlan.facility) || c.contacts.deliveryPoint })}
          ${K.ui.field({ name: 'facType', type: 'select', label: K.t('del.facType'), value: d.facType, options: ['sc', 'phc', 'chc', 'sdh', 'dh', 'mch', 'pvt'].map(v => ({ v, l: K.t('fac.' + v) })) })}
          ${K.ui.choices({ name: 'by', label: K.t('del.by'), value: d.by, options: ['doc', 'sba', 'other'].map(v => ({ v, l: K.t('att.' + v), tone: v === 'other' ? 'warn' : '' })) })}
          ${K.ui.choices({ name: 'type', label: K.t('del.type'), value: d.type, options: ['normal', 'assisted', 'cs'].map(v => ({ v, l: K.t('dt.' + v) })) })}
        </div>
        <div class="fgroup">
          ${K.ui.field({ name: 'gaWeeks', type: 'number', label: K.t('del.ga'), value: gaW, unit: K.t('preg.weeks'), attrs: { 'data-live': 'delAcs' } })}
          <div id="acs-row" ${gaW != null && gaW < 34 ? '' : K.raw('hidden')}>${K.ui.yn({ name: 'acs', q: K.t('del.acs'), value: d.acs })}</div>
          ${K.ui.field({ name: 'stayDays', type: 'number', label: K.t('del.stay'), value: d.stayDays, unit: K.t('preg.days') })}
          <div class="field"><span class="lbl">${K.t('del.compl')}</span><div class="choices">${['pph', 'ecl', 'obst', 'ret', 'tear', 'sepsis'].map(k => h`<label class="choice danger"><input type="checkbox" name="compl" value="${k}" ${(d.compl || []).includes(k) ? K.raw('checked') : ''}><span>${K.t('cmp.' + k)}</span></label>`)}</div></div>
        </div>
        ${K.ui.choices({ name: 'n', label: K.t('del.babies'), value: String(nb), options: [1, 2, 3].map(v => ({ v: String(v), l: K.digits(v) })), live: 'delBabies' })}
        ${[0, 1, 2].map(baby)}
        <div class="btn-bar">${K.ui.btn(K.t('del.save'), { type: 'submit', icon: 'check' })}</div>
      </form></div>`,
  };
});
K.live.delBabies = (el) => { const n = +el.value; K.$$('.baby-fs').forEach(fs => { fs.hidden = +fs.dataset.baby > n; }); };
K.live.delAcs = (el) => { const v = K.num(K.toLatinDigits(el.value)); K.$('#acs-row').hidden = !(v != null && v < 34); };
K.live.delGa = (el) => {
  const f = el.closest('form'); const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p || !el.value) return;
  const g = K.preg.ga(p, el.value); if (g && f.gaWeeks) { f.gaWeeks.value = g.w; K.live.delAcs(f.gaWeeks); }
};
K.forms.delSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  if (!v.date || !K.d.valid(v.date)) { K.ui.toast(K.t('err.date')); return; }
  if (K.d.diff(v.date, K.d.today()) < 0) { K.ui.toast(K.t('err.future')); return; }
  const n = +(v.n || 1); const prev = (p.delivery && p.delivery.babies) || [];
  const d = { date: v.date, time: v.time || '', place: v.place || 'inst', facility: v.facility || '', facType: v.facType || '', by: v.by || '', type: v.type || 'normal',
    gaWeeks: v.gaWeeks != null ? v.gaWeeks : null, acs: v.acs == null ? null : +v.acs, stayDays: v.stayDays != null ? v.stayDays : null, compl: v.compl || [], n, babies: [] };
  for (let i = 1; i <= n; i++) {
    const g = (k) => v[`b${i}_${k}`];
    let wt = g('wt'); if (wt != null && wt > 20) wt = wt / 1000;
    const b = { outcome: g('outcome') || 'live', sex: g('sex') || '', wt: wt != null ? K.round(wt, 3) : null, cried: g('cried') == null ? null : +g('cried'), resus: g('resus') == null ? null : +g('resus'),
      vitk: g('vitk') == null ? null : +g('vitk'), bf: g('bf') || '', colostrum: g('colostrum') == null ? null : +g('colostrum'), childId: (prev[i - 1] || {}).childId || null };
    if (b.outcome === 'live') {
      let k = b.childId ? K.card.findKid(c, b.childId) : null;
      if (!k) { k = K.blank.child(); c.children.push(k); b.childId = k.id; }
      Object.assign(k, { pregId: p.id, dob: d.date, sex: b.sex, birthWeight: b.wt, gaWeeks: d.gaWeeks, name: g('name') || k.name || '' });
      k.birth = Object.assign(k.birth || {}, { cried: b.cried, resus: b.resus, vitk: b.vitk, bf: b.bf, colostrum: b.colostrum, place: d.place });
    } else if (b.childId) { c.children = c.children.filter(x => x.id !== b.childId); b.childId = null; }
    d.babies.push(b);
  }
  p.delivery = d; p.status = 'delivered';
  if (!p.ppIfa || !p.ppIfa.start) p.ppIfa = { days: (p.ppIfa && p.ppIfa.days) || {}, start: d.date };
  if (!p.ppCalcium || !p.ppCalcium.start) p.ppCalcium = { days: (p.ppCalcium && p.ppCalcium.days) || {}, start: d.date };
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.preg.url(c, p, '/pnc').slice(1));
};

/* ---------------------------------------------------------------- PNC overview */
K.route('/card/:id/preg/:pid/pnc', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  if (!p.delivery) return { redirect: `/card/${id}/preg/${pid}/delivery` };
  const d = p.delivery; const kids = c.children.filter(k => k.pregId === p.id);
  const sch = K.pnc.schedule(p, c); const base = K.pnc.base(p, c);
  const day = K.d.diff(d.date, K.d.today());
  const tone = { done: 'ok', due: 'due', overdue: 'over', upcoming: 'soon' }, lbl = { done: K.t('st.done'), due: K.t('st.due'), overdue: K.t('st.overdue'), upcoming: K.t('st.upcoming') };
  return {
    title: K.t('pnc.title'), sub: c.mother.name, back: `/card/${id}`, tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.t('preg.deliveredOn', { d: K.d.fmt(d.date, 'long') }), K.t('pnc.title'), day >= 0 && day <= 42 ? K.t('stage.pnc', { d: day }) : '')}
      <div class="k-card pad-s"><dl class="kv">
        <dt>${K.t('del.place')}</dt><dd>${K.t('del.place.' + d.place)}${d.facility ? ' · ' + d.facility : ''}</dd>
        <dt>${K.t('del.type')}</dt><dd>${K.t('dt.' + d.type)}</dd>
        ${d.gaWeeks != null ? h`<dt>${K.t('del.ga')}</dt><dd class="num">${K.digits(d.gaWeeks)}</dd>` : ''}
        ${d.babies.map((b, i) => h`<dt>${K.t('del.baby', { n: i + 1 })}</dt><dd>${K.t('out.' + b.outcome)}${b.sex ? ' · ' + K.t('sex.' + b.sex) : ''}${b.wt != null ? ' · ' + K.n(b.wt, 2) + ' ' + K.t('u.kg') : ''}</dd>`)}
      </dl><p style="margin:10px 0 0">${K.ui.btn(K.t('del.edit'), { href: K.preg.url(c, p, '/delivery'), tone: 'quiet', size: 'sm', icon: 'edit' })}</p></div>
      ${kids.length ? h`<div class="cards-list" style="margin-top:10px">${kids.map(k => K.child.summaryCard(c, k))}</div>` : ''}
      <section class="sec" style="margin-top:18px">${K.ui.secH(K.t('pnc.visits'))}
        <p class="small">${K.t('pnc.rule')}</p>${base !== d.date ? h`<p class="small">${K.t('pnc.sncuNote', { d: K.d.fmt(base) })}</p>` : ''}
        <div class="list">${sch.map(s => K.ui.li({ href: K.preg.url(c, p, '/pnc/' + s.n), icon: s.st === 'done' ? 'check' : 'house', tone: s.st === 'done' ? 'done' : s.st === 'due' ? 'amber' : s.st === 'overdue' ? 'red' : 'ink',
          title: K.t('pnc.day', { n: s.n }), meta: s.v ? K.d.fmt(s.v.date) : K.d.fmt(s.date), trail: K.ui.pill(lbl[s.st], tone[s.st]) }))}</div></section>
      <section class="sec">${K.ui.secH(K.t('pnc.ppTabs'))}<p class="small">${K.t('pnc.ppRule')}</p>
        ${K.tracker.render('trk-ppifa', K.t('ifa.title'), p.ppIfa, 180, d.date, { key: `${id}:${pid}:ppIfa` })}<p></p>
        ${K.tracker.render('trk-ppca', K.t('ca.title'), p.ppCalcium, 180, d.date, { key: `${id}:${pid}:ppCalcium` })}</section>
      ${K.fp ? K.fp.section(c, p) : ''}
      <section class="sec">${K.ui.callout('danger', K.L(K.content.danger.post.title), h`<ul>${K.content.danger.post.items.slice(0, 6).map(x => h`<li>${K.L(x)}</li>`)}</ul><p style="margin-top:8px"><a href="#/learn/danger/post">${K.t('see.all')}</a></p>`)}</section>
    </div>`,
  };
});

/* ---------------------------------------------------------------- PNC / HBNC visit form */
K.route('/card/:id/preg/:pid/pnc/:day', ({ id, pid, day }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p || !p.delivery) return K.screens.notFound();
  const n = +day; const s = K.pnc.schedule(p, c).find(x => x.n === n) || { date: K.d.today() };
  const m = (p.pnc || []).find(x => x.day === n) || {};
  const kids = c.children.filter(k => k.pregId === p.id);
  const POS = ['pm.toilet', 'pm.bf', 'pm.diet', 'pm.rest', 'pm.fp', 'pb.ebf', 'pb.suck', 'pb.active', 'pb.urine', 'pb.stool', 'pb.kmc'];
  const yn = (name, key, val, live) => K.ui.yn({ name, q: K.t(key), value: val, live: live || 'pncPreview', pos: POS.includes(key) });
  const babyFs = (k) => { const b = (k.hbnc || []).find(x => x.day === n) || {}; const pre = `k_${k.id}_`;
    return h`<fieldset class="fgroup"><legend>${K.t('pnc.baby')} · ${K.child.label(k)}</legend>
      <div class="frow">${K.ui.field({ name: pre + 'weight', type: 'decimal', label: K.t('pb.weight'), unit: K.t('u.kg'), value: b.weight, attrs: { 'data-live': 'pncPreview' } })}${K.ui.field({ name: pre + 'temp', type: 'decimal', label: K.t('pb.temp'), unit: '°C', value: b.temp, attrs: { 'data-live': 'pncPreview' } })}</div>
      ${K.ui.field({ name: pre + 'breaths', type: 'number', label: K.t('pb.breaths'), unit: '/min', value: b.breaths, hint: h`<a href="#/tools/breath">${K.t('tool.breath')}</a>`, attrs: { 'data-live': 'pncPreview' } })}
      ${['ebf', 'suck', 'active', 'urine', 'stool', 'kmc'].map(x => yn(pre + x, 'pb.' + x, b[x]))}
      ${['diarrhoea', 'vomit', 'fits', 'indrawing', 'jaundice', 'pustules', 'eyes'].map(x => yn(pre + x, 'pb.' + x, b[x]))}
      ${K.ui.choices({ name: pre + 'cord', label: K.t('pb.cord'), value: b.cord, options: [{ v: 'dry', l: K.t('cord.dry') }, { v: 'red', l: K.t('cord.red'), tone: 'danger' }], live: 'pncPreview' })}
    </fieldset>`; };
  return {
    title: K.t('pnc.visit', { n }), sub: c.mother.name, back: K.preg.url(c, p, '/pnc').slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.t('pnc.title'), K.t('pnc.visit', { n }))}
      <form class="form" data-form="pncSave" data-id="${id}" data-pid="${pid}" data-day="${n}" novalidate>
        <div class="fgroup">${K.ui.field({ name: 'date', type: 'date', label: K.t('date'), value: m.date || (K.d.cmp(s.date, K.d.today()) <= 0 ? s.date : K.d.today()), max: K.d.today(), required: true })}
          ${K.ui.choices({ name: 'by', label: K.t('anc.by'), value: m.by || (K.settings.isHcp() ? 'asha' : ''), options: ['asha', 'anm', 'doc', 'self'].map(v => ({ v, l: K.t('by.' + v) })) })}</div>
        <fieldset class="fgroup"><legend>${K.t('pnc.mother')}</legend>
          <div class="frow">${K.ui.field({ name: 'bpSys', type: 'number', label: K.t('anc.sys'), unit: 'mmHg', value: m.bpSys, attrs: { 'data-live': 'pncPreview' } })}${K.ui.field({ name: 'bpDia', type: 'number', label: K.t('anc.dia'), unit: 'mmHg', value: m.bpDia, attrs: { 'data-live': 'pncPreview' } })}</div>
          ${K.ui.field({ name: 'temp', type: 'decimal', label: K.t('anc.temp'), unit: '°C', value: m.temp, attrs: { 'data-live': 'pncPreview' } })}
          ${K.ui.choices({ name: 'breast', label: K.t('pm.breast'), value: m.breast, options: ['normal', 'engorged', 'cracked'].map(v => ({ v, l: K.t('br.' + v), tone: v === 'normal' ? '' : 'warn' })), live: 'pncPreview' })}
          ${['pallor', 'bleed', 'uterus', 'discharge', 'episio', 'pain', 'fits', 'headache', 'mood'].map(k => yn(k, 'pm.' + k, m[k]))}
          ${['toilet', 'bf', 'diet', 'rest', 'fp'].map(k => yn(k, 'pm.' + k, m[k]))}
          ${K.ui.field({ name: 'other', label: K.t('pm.other'), value: m.other })}
        </fieldset>
        ${kids.map(babyFs)}
        <section id="pnc-preview" aria-live="polite"></section>
        <div class="btn-bar">${K.ui.btn(K.t('pnc.save'), { type: 'submit', icon: 'check' })}</div>
      </form></div>`,
    mount() { K.live.pncPreview(); },
  };
});
const pncCollect = (v, f, c, p) => {
  const n = +f.dataset.day; const m = { day: n, date: v.date, by: v.by || '' };
  ['bpSys', 'bpDia', 'temp', 'breast', 'other'].forEach(k => { if (v[k] != null) m[k] = v[k]; });
  ['pallor', 'bleed', 'uterus', 'discharge', 'episio', 'pain', 'fits', 'headache', 'mood', 'toilet', 'bf', 'diet', 'rest', 'fp'].forEach(k => { if (v[k] != null) m[k] = +v[k]; });
  const babies = c.children.filter(k => k.pregId === p.id).map(k => { const pre = `k_${k.id}_`; const b = { day: n, date: v.date };
    Object.keys(v).filter(x => x.startsWith(pre)).forEach(x => { const key = x.slice(pre.length); const val = v[x]; b[key] = ['weight', 'temp', 'breaths', 'cord'].includes(key) ? val : +val; });
    return { k, b }; });
  return { m, babies, n };
};
K.live.pncPreview = K.debounce(() => {
  const f = K.$('form[data-form="pncSave"]'); if (!f) return; const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  const { m, babies, n } = pncCollect(K.formData(f), f, c, p);
  const fl = K.pnc.motherFlags(m).concat(...babies.map(({ k, b }) => K.pnc.babyFlags(b, k, n).map(x => Object.assign({}, x, { en: `${K.child.label(k)}: ${x.en}`, or: `${K.child.label(k)}: ${x.or}` }))));
  K.$('#pnc-preview').innerHTML = K.hv(h`<h3 style="margin:4px 0 8px">${K.t('pnc.result')}</h3>${K.pnc.flagList(fl)}`);
}, 300);
K.forms.pncSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  if (!v.date || !K.d.valid(v.date) || K.d.diff(v.date, K.d.today()) < 0) { K.ui.toast(K.t('err.date')); return; }
  const { m, babies, n } = pncCollect(v, f, c, p);
  p.pnc = (p.pnc || []).filter(x => x.day !== n).concat([m]).sort(K.by('day'));
  babies.forEach(({ k, b }) => { k.hbnc = (k.hbnc || []).filter(x => x.day !== n).concat([b]).sort(K.by('day'));
    if (b.weight != null) { k.growth = k.growth || []; const g = k.growth.find(x => x.src === 'hbnc' && x.day === n); if (g) Object.assign(g, { date: b.date, wt: b.weight }); else k.growth.push({ id: K.uid('g'), date: b.date, wt: b.weight, src: 'hbnc', day: n }); } });
  if (m.fp === 1) { p.fp = p.fp || {}; p.fp.counselled = p.fp.counselled || m.date; }
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.preg.url(c, p, '/pnc').slice(1));
};

/* ---------------------------------------------------------------- pregnancy overview: delivery section */
K.preg.addSection(60, (c, p) => {
  if (p.status === 'ended') return '';
  if (p.delivery) return h`<section class="sec">${K.ui.secH(K.t('preg.sec.delivery'))}<div class="list">${K.ui.li({ href: K.preg.url(c, p, '/pnc'), icon: 'baby', tone: 'done', title: K.t('preg.deliveredOn', { d: K.d.fmt(p.delivery.date) }), meta: `${K.t('del.place.' + p.delivery.place)} · ${K.t('dt.' + p.delivery.type)}` })}</div></section>`;
  const g = K.preg.ga(p);
  return h`<section class="sec">${K.ui.secH(K.t('preg.sec.delivery'))}${K.ui.btn(K.t('preg.recordDelivery'), { href: K.preg.url(c, p, '/delivery'), tone: g && g.days >= 28 * 7 ? 'primary' : 'ghost', icon: 'baby', block: true })}</section>`;
});

/* dashboard: delivered pregnancies within 42 days show the PNC card */
K.due.add((c, today) => {
  const out = [];
  (c.pregnancies || []).filter(p => p.delivery && K.d.diff(p.delivery.date, today) <= 45).forEach(p => {
    const nx = K.pnc.schedule(p, c, today).find(s => s.st !== 'done');
    if (nx) out.push({ id: 'pnc' + nx.n, kind: 'pnc', icon: 'house', href: K.preg.url(c, p, '/pnc/' + nx.n), title: { en: `Home visit after delivery · day ${nx.n}`, or: `ପ୍ରସବ ପରେ ଗୃହ ପରିଦର୍ଶନ · ${nx.n} ଦିନ` }, date: nx.date, status: nx.st === 'overdue' ? 'overdue' : undefined });
  });
  return out;
});
K.summary.add((c) => (c.pregnancies || []).filter(p => p.delivery && K.d.diff(p.delivery.date, K.d.today()) <= 60).map(p => `${K.t('preg.deliveredOn', { d: K.d.fmt(p.delivery.date) })} · ${K.t('del.place.' + p.delivery.place)} · ${K.t('dt.' + p.delivery.type)}`));
