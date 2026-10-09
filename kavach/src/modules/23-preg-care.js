/* ============================================================================
   modules/23-preg-care — Td doses, IFA & calcium 180-day trackers,
   albendazole, laboratory tests, birth plan, care advice (pregnancy).
   IFA: 1 tablet daily from the 4th month (14 wk) for 180 days; calcium:
   2 tablets daily from 14 wk; albendazole 400 mg once after the 1st
   trimester; Td-1 early, Td-2 four weeks later (booster if 2 doses in a
   pregnancy within the last 3 years), preferably before 36 weeks.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'tab.title': { en: 'Injections & tablets', or: 'ଟୀକା ଓ ବଟିକା' },
  'td.title': { en: 'Td (tetanus–diphtheria) injection', or: 'ଟିଟାନସ୍ ଡିପ୍‌ଥେରିଆ (ଟିଡି) ଟୀକା' },
  'td.rule': { en: 'Take 2 Td injections: Td-1 as soon as the pregnancy is known and Td-2 one month later. If you had 2 doses in a pregnancy within the last 3 years, one booster is enough.', or: '୨ଟି ଟିଟାନସ୍ ଡିପ୍‌ଥେରିଆ (ଟିଡି) ଟୀକା ନିଅନ୍ତୁ। ପ୍ରଥମ ଟିଡି ଗର୍ଭସଞ୍ଚାର ହେବାର ଜାଣିବା ପରେ ଏବଂ ଦ୍ୱିତୀୟ ଟିଡି ଏକ ମାସ ପରେ ନିଅନ୍ତୁ। ଯଦି ପୂର୍ବ ଗର୍ଭ ୩ ବର୍ଷ ଭିତରେ ହୋଇଥାଏ ଏବଂ ଦୁଇଟି ଟିଡି ଟୀକା ନେଇଥାନ୍ତି, ତାହେଲେ ଗୋଟିଏ ବୁଷ୍ଟର୍ ଟୀକା ନିଅନ୍ତୁ।' },
  'td.boosterOnly': { en: '2 Td doses in a pregnancy within the last 3 years (booster only)', or: 'ଗତ ୩ ବର୍ଷ ଭିତରେ ପୂର୍ବ ଗର୍ଭରେ ୨ଟି ଟିଡି ନେଇଛନ୍ତି (କେବଳ ବୁଷ୍ଟର୍)' },
  'td.td1': { en: 'Td-1', or: 'ଟିଡି-୧' }, 'td.td2': { en: 'Td-2', or: 'ଟିଡି-୨' }, 'td.booster': { en: 'Td booster', or: 'ଟିଡି ବୁଷ୍ଟର୍' },
  'td.due2': { en: 'Td-2 due from {d}', or: '{d} ଠାରୁ ଟିଡି-୨' },
  'ifa.title': { en: 'Iron (IFA) tablets', or: 'ଲୌହ (ଆଇ.ଏଫ୍.ଏ.) ବଟିକା' },
  'ifa.rule': { en: 'One tablet every day from the 4th month of pregnancy until delivery — at least 180 tablets. Take after food, with lemon water if you can; not with tea, coffee or milk.', or: 'ପ୍ରତ୍ୟେକ ଦିନ ଅତି କମ୍‌ରେ ଗୋଟିଏ ଲେଖାଏଁ ଲୌହ ବଟିକା ଗର୍ଭ ଧାରଣର ଚତୁର୍ଥ ମାସ ଠାରୁ ପ୍ରସବ ପର୍ଯ୍ୟନ୍ତ ଖାଆନ୍ତୁ (ଅତି କମ୍‌ରେ ୧୮୦ଟି)। ଖାଇବା ପରେ ଖାଆନ୍ତୁ, ସମ୍ଭବ ହେଲେ ଲେମ୍ବୁ ପାଣି ସହ; ଚା, କଫି ବା କ୍ଷୀର ସହ ନୁହେଁ।' },
  'ca.title': { en: 'Calcium tablets', or: 'କ୍ୟାଲସିୟମ୍ ବଟିକା' },
  'ca.rule': { en: 'Two calcium tablets every day from 14 weeks until delivery. Keep at least 2 hours between iron and calcium tablets.', or: 'ଗର୍ଭଧାରଣର ୧୪ ସପ୍ତାହ ଠାରୁ ପ୍ରସବ ପର୍ଯ୍ୟନ୍ତ ପ୍ରତିଦିନ ୨ଟି ଲେଖାଏଁ କ୍ୟାଲସିୟମ୍ ବଟିକା ଖାଆନ୍ତୁ। ଲୌହ ଓ କ୍ୟାଲସିୟମ୍ ବଟିକା ମଧ୍ୟରେ ଅତି କମ୍‌ରେ ୨ ଘଣ୍ଟା ବ୍ୟବଧାନ ରଖନ୍ତୁ।' },
  'alb.title': { en: 'Deworming (albendazole) tablet', or: 'କୃମି ନାଶକ (ଆଲ୍‌ବେଣ୍ଡାଜୋଲ୍) ବଟିକା' },
  'alb.rule': { en: 'One albendazole 400 mg tablet, once, after the first 3 months of pregnancy.', or: 'ଗର୍ଭଧାରଣର ତୃତୀୟ ମାସ ପରେ ଗୋଟିଏ କୃମି ନାଶକ ବଟିକା (୪୦୦ ମି.ଗ୍ରା.) ନିଶ୍ଚିତ ସେବନ କରନ୍ତୁ।' },
  'alb.given': { en: 'Given on', or: 'ଦିଆଯାଇଥିବା ତାରିଖ' },
  'trk.today': { en: 'Taken today', or: 'ଆଜି ଖାଇଲି' },
  'trk.notToday': { en: 'Tap when taken today', or: 'ଆଜି ଖାଇଲେ ଛୁଅଁନ୍ତୁ' },
  'trk.count': { en: '{n} of {t} days', or: '{t} ଦିନରୁ {n} ଦିନ' },
  'trk.start': { en: 'Started {d}', or: '{d} ରୁ ଆରମ୍ଭ' },
  'trk.startOn': { en: 'Start from {d} (14 weeks)', or: '{d} ରୁ ଆରମ୍ଭ କରନ୍ତୁ (୧୪ ସପ୍ତାହ)' },
  'trk.issued': { en: 'Tablets received: {n}', or: 'ମିଳିଥିବା ବଟିକା: {n}' },
  'trk.grid': { en: 'Tap a day to mark or unmark it', or: 'ଦିନଟିକୁ ଛୁଇଁ ଚିହ୍ନିତ କରନ୍ତୁ ବା ହଟାନ୍ତୁ' },
  'trk.open': { en: 'Open the daily tracker', or: 'ଦୈନିକ ଟ୍ରାକର୍ ଖୋଲନ୍ତୁ' },
  'trk.weekly': { en: 'Was she taking weekly IFA before this pregnancy?', or: 'ଗର୍ଭଧାରଣ ପୂର୍ବରୁ ସାପ୍ତାହିକ ଆଇ.ଏଫ୍.ଏ. ବଟିକା ଖାଉଥିଲେ କି?' },
  'tests.title': { en: 'Tests', or: 'ପରୀକ୍ଷା' },
  'tests.rule': { en: 'Get blood and urine tested at every visit. If any result is abnormal, go to the nearest health centre at once.', or: 'ପ୍ରତିଥର ରକ୍ତ ଏବଂ ପରିସ୍ରା ପରୀକ୍ଷା କରାଇ ନିଅନ୍ତୁ। ଯଦି କୌଣସି ଅସ୍ୱାଭାବିକ ଫଳାଫଳ ଦେଖାଯାଏ ତେବେ ତୁରନ୍ତ ନିକଟସ୍ଥ ସ୍ୱାସ୍ଥ୍ୟକେନ୍ଦ୍ରକୁ ଯାଆନ୍ତୁ।' },
  'test.bloodGroup': { en: 'Blood group & Rh', or: 'ବ୍ଲଡ୍ ଗ୍ରୁପ୍ ଏବଂ ଆର୍.ଏଚ୍.' },
  'test.hiv': { en: 'HIV', or: 'ଏଚ୍.ଆଇ.ଭି.' }, 'test.syphilis': { en: 'Syphilis (VDRL / RPR)', or: 'ସିଫିଲିସ୍ (ଭି.ଡି.ଆର୍.ଏଲ୍.)' },
  'test.hbsag': { en: 'Hepatitis B (HBsAg)', or: 'ହେପାଟାଇଟିସ୍-ବି' }, 'test.ogtt': { en: 'Sugar test (OGTT, 75 g, 2-hour)', or: 'ରକ୍ତରେ ଶର୍କରା (OGTT, ୭୫ ଗ୍ରାମ, ୨ ଘଣ୍ଟା)' },
  'test.tsh': { en: 'Thyroid (TSH)', or: 'ଥାଇରଏଡ୍ (TSH)' }, 'test.malaria': { en: 'Malaria (RDT)', or: 'ମ୍ୟାଲେରିଆ (RDT)' },
  'test.usg': { en: 'Ultrasound', or: 'ଅଲଟ୍ରାସାଉଣ୍ଡ' }, 'test.multiple': { en: 'Twins or more', or: 'ଯାଆଁଳା ବା ଅଧିକ' }, 'test.previa': { en: 'Placenta low-lying', or: 'ଗର୍ଭଫୁଲ ତଳକୁ' },
  'test.usgNotes': { en: 'Ultrasound findings', or: 'ଅଲଟ୍ରାସାଉଣ୍ଡ ଫଳାଫଳ' },
  'res.nd': { en: 'Not done', or: 'ହୋଇନାହିଁ' }, 'res.neg': { en: 'Negative', or: 'ନେଗେଟିଭ୍' }, 'res.pos': { en: 'Positive', or: 'ପଜିଟିଭ୍' },
  'test.gdmAt': { en: 'Do the OGTT at the first visit and again at 24–28 weeks. 140 mg/dl or more at 2 hours = diabetes in pregnancy.', or: 'ପ୍ରଥମ ପରିଦର୍ଶନରେ ଓ ୨୪–୨୮ ସପ୍ତାହରେ OGTT କରନ୍ତୁ। ୨ ଘଣ୍ଟାରେ ୧୪୦ mg/dl ବା ଅଧିକ = ଗର୍ଭକାଳୀନ ମଧୁମେହ।' },
  'test.save': { en: 'Save tests', or: 'ପରୀକ୍ଷା ସେଭ୍ କରନ୍ତୁ' },
  'test.latestHb': { en: 'Latest haemoglobin', or: 'ଶେଷ ହିମୋଗ୍ଲୋବିନ୍' },
  'plan.title': { en: 'Birth plan', or: 'ପ୍ରସବ ପ୍ରସ୍ତୁତି' },
  'plan.lede': { en: 'Ensure the delivery happens in a hospital. Prepare these before the 8th month.', or: 'ଡାକ୍ତରଖାନାରେ ପ୍ରସବ କରାଇବା ନିଶ୍ଚିତ କରନ୍ତୁ। ଅଷ୍ଟମ ମାସ ପୂର୍ବରୁ ଏଗୁଡ଼ିକ ପ୍ରସ୍ତୁତ କରନ୍ତୁ।' },
  'plan.done': { en: '{n} of {t} ready', or: '{t}ଟିରୁ {n}ଟି ପ୍ରସ୍ତୁତ' },
  'plan.home': { en: 'If a hospital birth is truly impossible: preparation for a home delivery', or: 'ସମ୍ଭବ ନହେଲେ ଘରେ ପ୍ରସବ କରାଇବା ନିମନ୍ତେ ପ୍ରସ୍ତୁତି' },
  'plan.homeNote': { en: 'A health-facility birth with a skilled attendant is always safer.', or: 'ଦକ୍ଷ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ଦ୍ୱାରା ଡାକ୍ତରଖାନାରେ ପ୍ରସବ ସର୍ବଦା ଅଧିକ ସୁରକ୍ଷିତ।' },
  'plan.facility': { en: 'Hospital for delivery', or: 'ପ୍ରସବ ପାଇଁ ଡାକ୍ତରଖାନା' },
  'plan.vehicle': { en: 'Vehicle / driver phone', or: 'ଗାଡ଼ି / ଚାଳକଙ୍କ ଫୋନ୍' },
  'plan.save': { en: 'Save birth plan', or: 'ପ୍ରସବ ପ୍ରସ୍ତୁତି ସେଭ୍ କରନ୍ତୁ' },
  'care.title': { en: 'Care in pregnancy', or: 'ଗର୍ଭାବସ୍ଥାରେ ଯତ୍ନ' },
  'care.more': { en: 'More advice for pregnancy', or: 'ଗର୍ଭାବସ୍ଥା ପାଇଁ ଅଧିକ ପରାମର୍ଶ' },
});

/* ---------------------------------------------------------------- care advice (MCP 2018 p.4 + Odisha p.4) */
K.content = K.content || {};
K.content.pregCare = [
  { icon: 'bowl', en: 'Eat many kinds of food, including fortified flour and oil. Eat about one extra meal a day (a quarter more than usual).', or: 'ବିଭିନ୍ନ ପ୍ରକାର ଖାଦ୍ୟ ପଦାର୍ଥ ଖାଆନ୍ତୁ। ଦୈନିକ ଖାଦ୍ୟ ସହିତ ଏକ ଥର ଅଧିକ ଖାଦ୍ୟ ଖାଆନ୍ତୁ।' },
  { icon: 'x', en: 'Do not avoid any food and do not fast.', or: 'କୌଣସି ଖାଦ୍ୟ ବାରଣ କରନ୍ତୁ ନାହିଁ। ଉପବାସ ରୁହନ୍ତୁ ନାହିଁ।' },
  { icon: 'home', en: 'Eat the take-home ration from the Anganwadi centre regularly.', or: 'ଅଙ୍ଗନୱାଡ଼ି କେନ୍ଦ୍ରରୁ ମିଳୁଥିବା ଖାଦ୍ୟ ନିୟମିତ ଖାଆନ୍ତୁ।' },
  { icon: 'moon', en: 'Rest at least 2 hours in the day and 8 hours at night.', or: 'ଦିନରେ ଅତି କମ୍‌ରେ ୨ ଘଣ୍ଟା ଏବଂ ରାତିରେ ୮ ଘଣ୍ଟା ବିଶ୍ରାମ ନିଅନ୍ତୁ।' },
  { icon: 'sparkle', en: 'Use iodised (double-fortified) salt.', or: 'ଆଇରନ୍ ଓ ଆୟୋଡିନ୍ ଯୁକ୍ତ ଲୁଣ ବ୍ୟବହାର କରନ୍ତୁ।' },
  { icon: 'water', en: 'Drink enough safe water.', or: 'ଯଥେଷ୍ଟ ପାଣି ପିଅନ୍ତୁ।' },
  { icon: 'heart', en: 'Rinse your mouth after meals and brush your teeth twice a day.', or: 'ଖାଇବା ପରେ ଭଲଭାବେ କୁଳି କରନ୍ତୁ ଏବଂ ଦିନକୁ ଦୁଇ ଥର ଦାନ୍ତ ଘସନ୍ତୁ।' },
  { icon: 'net', en: 'Sleep under an insecticide-treated bed net every night to stay safe from malaria.', or: "ମାରାତ୍ମକ ମ୍ୟାଲେରିଆରୁ ରକ୍ଷା ପାଇବା ପାଇଁ ମା' ଓ ଶିଶୁ ନିୟମିତ ଔଷଧବୁଡ଼ା ମଶାରୀ ଟାଣି ଶୁଅନ୍ତୁ।" },
  { icon: 'calendar', en: 'Attend the monthly Mamata Divas (Village Health, Sanitation and Nutrition Day) and take nutrition advice at every check-up.', or: 'ପ୍ରତି ମାସରେ ହେଉଥିବା ମମତା ଦିବସରେ ଯୋଗଦାନ କରନ୍ତୁ ଏବଂ ପ୍ରତ୍ୟେକ ଗର୍ଭ ପରୀକ୍ଷା ସମୟରେ ପୁଷ୍ଟି ସମ୍ବନ୍ଧୀୟ ପରାମର୍ଶ ନିଅନ୍ତୁ।' },
  { icon: 'shield', en: 'Finding out the sex of the baby before birth is illegal.', or: 'ଜନ୍ମ ପୂର୍ବରୁ ଭ୍ରୁଣର ଲିଙ୍ଗ ନିରୂପଣ କରିବା ଏକ ଆଇନଗତ ଅପରାଧ।' },
];
K.content.birthPlan = [
  { k: 'contact', en: 'Stay in touch with your ASHA, ANM and Anganwadi worker', or: 'ଆଶାକର୍ମୀ, ମହିଳା ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀ ଓ ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀଙ୍କ ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ' },
  { k: 'facility', en: 'Choose the hospital for delivery in advance', or: 'ପ୍ରସବ କରାଇବା ପାଇଁ ଆଗରୁ ଡାକ୍ତରଖାନା ଚିହ୍ନଟ କରି ରଖନ୍ତୁ' },
  { k: 'transport', en: 'Arrange transport in advance (102 / 108 are free)', or: 'ପ୍ରସବ ପୂର୍ବରୁ ଗମନାଗମନର ବ୍ୟବସ୍ଥା କରନ୍ତୁ (୧୦୨ / ୧୦୮ ମାଗଣା)' },
  { k: 'jsy', en: 'Register for JSY and MAMATA-PMMVY with the ASHA / AWW', or: 'ଆଶା / ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀଙ୍କ ମାଧ୍ୟମରେ JSY ଓ ମମତା-PMMVY ରେ ପଞ୍ଜୀକରଣ କରନ୍ତୁ' },
  { k: 'money', en: 'Keep some money aside for an emergency', or: 'ଜରୁରୀକାଳୀନ ପାଇଁ କିଛି ଟଙ୍କା ରଖନ୍ତୁ' },
  { k: 'companion', en: 'Decide who will go with you (birth companion)', or: 'ଆପଣଙ୍କ ସହ କିଏ ଯିବେ ସ୍ଥିର କରନ୍ତୁ' },
  { k: 'donor', en: 'Identify a blood donor in the family, in case blood is needed', or: 'ରକ୍ତ ଆବଶ୍ୟକ ହେଲେ ପରିବାରରେ ରକ୍ତଦାତା ଚିହ୍ନଟ କରନ୍ତୁ' },
  { k: 'bag', en: 'Keep a bag ready: this card, clean clothes for mother and baby, pads', or: 'ବ୍ୟାଗ୍ ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ: ଏହି କାର୍ଡ, ମା\' ଓ ଶିଶୁ ପାଇଁ ପରିଷ୍କାର ଲୁଗା, ପ୍ୟାଡ୍' },
  { k: 'stay48', en: 'Plan to stay at least 48 hours in hospital after delivery', or: 'ପ୍ରସବ ପରେ ଅତିକମ୍‌ରେ ୪୮ ଘଣ୍ଟା ପର୍ଯ୍ୟନ୍ତ ଡାକ୍ତରଖାନାରେ ରୁହନ୍ତୁ' },
];
K.content.homeKit = [
  { en: 'Delivery by a trained, skilled health worker', or: 'ପ୍ରସବ ତାଲିମ୍ ପ୍ରାପ୍ତ ଦକ୍ଷ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ଦ୍ୱାରା କରିବା' },
  { en: 'Use a disposable clean delivery kit', or: 'ପ୍ରସବ ପାଇଁ ଡିସ୍‌ପୋଜେବୁଲ୍ ଡେଲିଭରି କିଟ୍ ବ୍ୟବହାର କରିବା' },
  { en: 'Clean hands', or: 'ହାତ ପରିଷ୍କାର ରଖିବା' },
  { en: 'Clean floor and surroundings', or: 'ଚଟାଣ ଏବଂ ତାହାର ପରିବେଶକୁ ପରିଷ୍କାର ରଖିବା' },
  { en: 'A new, clean blade', or: 'ନୂଆ ଏବଂ ପରିଷ୍କାର ବ୍ଲେଡ୍ ବ୍ୟବହାର କରିବା' },
  { en: 'Clean thread to tie the cord; put nothing on the cord', or: 'ନାଭିକୁ ବାନ୍ଧିବା ପାଇଁ ପରିଷ୍କାର ସୂତା; ନାଭିରେ କିଛି ଲଗାଇବା ନାହିଁ' },
  { en: 'Clean, dry clothes ready for the newborn', or: 'ନବଜାତ ଶିଶୁ ପାଇଁ ପରିଷ୍କାର ଓ ଶୁଖିଲା କପଡ଼ାମାନ ସଜାଡି ରଖିବା' },
  { en: 'Breastfeed within one hour of birth', or: 'ଜନ୍ମର ସଙ୍ଗେ ସଙ୍ଗେ ବା ଅତିବେଶିରେ ଏକ ଘଣ୍ଟା ମଧ୍ୟରେ ଶିଶୁକୁ ସ୍ତନ୍ୟପାନ ସୁନିଶ୍ଚିତ କରନ୍ତୁ' },
  { en: 'Keep transport ready for an emergency', or: 'ଜରୁରୀକାଳୀନ ପାଇଁ ଗାଡ଼ି ପ୍ରସ୍ତୁତ ରଖନ୍ତୁ' },
];

/* ---------------------------------------------------------------- Td logic */
K.td = {
  status(p, today) {
    today = today || K.d.today(); const td = p.td || {};
    if (td.boosterOnly) return { done: !!td.booster, next: td.booster ? null : { k: 'booster', date: K.d.max(p.createdAt.slice(0, 10), K.preg.lmpEq(p) || today) } };
    if (!td.td1) return { done: false, next: { k: 'td1', date: K.d.max(p.createdAt.slice(0, 10), K.preg.lmpEq(p) || today) } };
    if (!td.td2) return { done: false, next: { k: 'td2', date: K.d.addDays(td.td1, 28) } };
    return { done: true, next: null };
  },
};

/* ---------------------------------------------------------------- tracker component (shared with postpartum) */
K.tracker = {
  /* t = { days:{iso:1}, start }, total days, from date (first allowed day) */
  render(id, label, t, total, from, opts = {}) {
    const today = K.d.today(); t = t || { days: {} };
    const start = t.start && K.d.cmp(t.start, from) < 0 ? t.start : from;
    const end = K.d.addDays(start, total - 1);
    const n = Object.keys(t.days || {}).filter(d => t.days[d]).length;
    const taken = !!(t.days || {})[today];
    const cells = []; let cur = start; let lastMonth = -1;
    // pad to Monday
    const dow = (K.d.parse(start).getDay() + 6) % 7; for (let i = 0; i < dow; i++) cells.push(h`<span class="tk-pad"></span>`);
    for (let i = 0; i < total; i++) {
      const dt = K.d.parse(cur); const fut = K.d.cmp(cur, today) > 0;
      if (dt.getMonth() !== lastMonth && i > 0 && dt.getDate() === 1) { /* month boundary marker via class */ }
      cells.push(h`<button type="button" class="tk ${t.days && t.days[cur] ? 'on' : ''} ${cur === today ? 'td' : ''} ${dt.getDate() === 1 ? 'm1' : ''}" ${fut ? K.raw('disabled') : ''}
        data-act="tick" data-arg="${opts.key}|${cur}" aria-pressed="${!!(t.days && t.days[cur])}" title="${K.d.fmt(cur)}">${K.digits(dt.getDate())}</button>`);
      lastMonth = dt.getMonth(); cur = K.d.addDays(cur, 1);
    }
    const issued = K.sum((t.issued || []).map(x => x.n));
    return h`<section class="k-card trk" id="${id}">
      <div class="trk-h"><div><h3>${label}</h3><p class="small" style="margin:2px 0 0">${opts.rule || ''}</p></div></div>
      <div class="trk-top">
        <button type="button" class="trk-today ${taken ? 'on' : ''}" data-act="tick" data-arg="${opts.key}|${today}" aria-pressed="${taken}" ${K.d.cmp(today, start) < 0 ? K.raw('disabled') : ''}>
          ${K.ui.icon(taken ? 'check' : 'pill', 'lg')}<span>${taken ? K.t('trk.today') : K.t('trk.notToday')}</span></button>
        <div class="trk-n"><b class="mono">${K.digits(n)}</b><span class="small">${K.t('trk.count', { n, t: total })}</span>${K.ui.bar(n / total * 100)}
          <span class="small faint">${K.d.cmp(today, start) < 0 ? K.t('trk.startOn', { d: K.d.fmt(start) }) : K.t('trk.start', { d: K.d.fmt(start) })}${issued ? ' · ' + K.t('trk.issued', { n: issued }) : ''}</span></div>
      </div>
      <details class="trk-more"><summary>${K.t('trk.grid')}</summary>
        <div class="tk-wd">${[1, 2, 3, 4, 5, 6, 0].map(i => h`<span>${K.d.WD[K.i18n.lang === 'or' ? 'or' : 'en'][i].slice(0, K.i18n.lang === 'or' ? 2 : 1)}</span>`)}</div>
        <div class="tk-grid">${cells}</div>
        <p class="small faint" style="margin:8px 0 0">${K.d.fmt(start)} → ${K.d.fmt(end)}</p></details>
    </section>`;
  },
};
/* data-arg = "<cardId>:<pregId|childId>:<path>|<date>" ; path like ifa / calcium / ppIfa */
K.acts.tick = async (el) => {
  const [key, date] = el.dataset.arg.split('|'); const [cid, oid, path] = key.split(':');
  const c = K.card.load(cid); if (!c) return;
  const o = K.card.findPreg(c, oid) || K.card.findKid(c, oid); if (!o) return;
  const t = o[path] = o[path] || { days: {} }; t.days = t.days || {};
  if (t.days[date]) delete t.days[date]; else { t.days[date] = 1; if (!t.start || K.d.cmp(date, t.start) < 0) t.start = date; }
  await K.store.save(c, true);
  K.refresh();
};

/* ---------------------------------------------------------------- tablets screen */
K.route('/card/:id/preg/:pid/tablets', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const td = p.td || {}; const st = K.td.status(p);
  const from14 = K.preg.dateAt(p, 14) || K.d.today();
  return {
    title: K.t('tab.title'), sub: c.mother.name, back: K.preg.url(c, p).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.t('preg.overview'), K.t('tab.title'))}
      <form class="form" data-form="tdSave" data-id="${id}" data-pid="${pid}">
        <fieldset class="fgroup"><legend>${K.t('td.title')}</legend><p class="small" style="margin:0">${K.t('td.rule')}</p>
          ${K.ui.sw({ name: 'boosterOnly', checked: !!td.boosterOnly, title: K.t('td.boosterOnly') })}
          <div class="frow">${K.ui.field({ name: 'td1', type: 'date', label: K.t('td.td1'), value: td.td1, max: K.d.today() })}${K.ui.field({ name: 'td2', type: 'date', label: K.t('td.td2'), value: td.td2, max: K.d.today() })}</div>
          ${K.ui.field({ name: 'booster', type: 'date', label: K.t('td.booster'), value: td.booster, max: K.d.today() })}
          ${st.next ? K.ui.callout(K.d.cmp(st.next.date, K.d.today()) <= 0 ? 'warn' : 'info', '', `${K.t('td.' + st.next.k)} · ${K.d.fmt(st.next.date)} (${K.d.rel(st.next.date)})`, 'syringe') : K.ui.callout('', '', K.t('st.done'), 'check')}
        </fieldset>
        <fieldset class="fgroup"><legend>${K.t('alb.title')}</legend><p class="small" style="margin:0">${K.t('alb.rule')}</p>
          ${K.ui.field({ name: 'albendazole', type: 'date', label: K.t('alb.given'), value: p.albendazole, max: K.d.today() })}
          ${K.ui.yn({ name: 'weeklyIfa', q: K.t('trk.weekly'), value: p.weeklyIfaBefore })}
        </fieldset>
        <div class="btn-row">${K.ui.btn(K.t('btn.save'), { type: 'submit', icon: 'check' })}</div>
      </form>
      <p></p>
      ${K.tracker.render('trk-ifa', K.t('ifa.title'), p.ifa, 180, from14, { key: `${id}:${pid}:ifa`, rule: K.t('ifa.rule') })}
      <p></p>
      ${K.tracker.render('trk-ca', K.t('ca.title'), p.calcium, 180, from14, { key: `${id}:${pid}:calcium`, rule: K.t('ca.rule') })}
    </div>`,
  };
});
K.forms.tdSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  p.td = { td1: v.td1 || '', td2: v.td2 || '', booster: v.booster || '', boosterOnly: !!v.boosterOnly };
  p.albendazole = v.albendazole || '';
  p.weeklyIfaBefore = v.weeklyIfa == null ? null : +v.weeklyIfa;
  await K.store.save(c); K.ui.toast(K.t('saved')); K.refresh();
};

/* ---------------------------------------------------------------- tests screen */
const RES = ['nd', 'neg', 'pos'];
K.route('/card/:id/preg/:pid/tests', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const t = p.tests || {};
  const bg = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(x => ({ v: x, l: x }));
  const res = (k) => h`<div class="test-row"><div class="frow"><div>${K.ui.choices({ name: k, label: K.t('test.' + k), value: t[k] || 'nd', options: RES.map(r => ({ v: r, l: K.t('res.' + r), tone: r === 'pos' ? 'danger' : '' })) })}</div>
      ${K.ui.field({ name: k + 'Date', type: 'date', label: K.t('date'), value: t[k + 'Date'], max: K.d.today() })}</div></div>`;
  const hb = K.preg.latest(p, 'hb');
  return {
    title: K.t('tests.title'), sub: c.mother.name, back: K.preg.url(c, p).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.t('preg.overview'), K.t('tests.title'), K.t('tests.rule'))}
      ${hb ? K.ui.stat(K.t('test.latestHb'), `${K.n(hb.v)} g/dl`, hb.v < 7 ? 'danger' : hb.v < 11 ? 'warn' : '', K.d.fmt(hb.date) + ' · ' + K.L(K.anc.hbClass(hb.v))) : ''}
      <p></p>
      <form class="form" data-form="testsSave" data-id="${id}" data-pid="${pid}">
        <div class="fgroup">${K.ui.field({ name: 'bloodGroup', type: 'select', label: K.t('test.bloodGroup'), value: t.bloodGroup || c.mother.bloodGroup, options: bg })}</div>
        <div class="fgroup">${res('hiv')}${res('syphilis')}${res('hbsag')}${res('malaria')}</div>
        <fieldset class="fgroup"><legend>${K.t('test.ogtt')}</legend><p class="small" style="margin:0">${K.t('test.gdmAt')}</p>
          <div class="frow">${K.ui.field({ name: 'ogtt', type: 'number', label: 'OGTT', value: t.ogtt, unit: 'mg/dl' })}${K.ui.field({ name: 'ogttDate', type: 'date', label: K.t('date'), value: t.ogttDate, max: K.d.today() })}</div></fieldset>
        <div class="fgroup"><div class="frow">${K.ui.field({ name: 'tsh', type: 'decimal', label: K.t('test.tsh'), value: t.tsh, unit: 'mIU/L' })}${K.ui.field({ name: 'tshDate', type: 'date', label: K.t('date'), value: t.tshDate, max: K.d.today() })}</div></div>
        <fieldset class="fgroup"><legend>${K.t('test.usg')}</legend>
          ${K.ui.field({ name: 'usgDate', type: 'date', label: K.t('date'), value: t.usgDate, max: K.d.today() })}
          ${K.ui.yn({ name: 'multiple', q: K.t('test.multiple'), value: t.multiple })}
          ${K.ui.yn({ name: 'previa', q: K.t('test.previa'), value: t.previa })}
          ${K.ui.field({ name: 'usgNotes', type: 'textarea', rows: 2, label: K.t('test.usgNotes'), value: t.usgNotes })}
        </fieldset>
        <div class="fgroup">${K.ui.field({ name: 'sickle', type: 'select', label: K.t('m.sickle'), value: c.mother.sickle, options: ['nt', 'AA', 'AS', 'SS', 'oth'].map(x => ({ v: x, l: K.t('sickle.' + x) })) })}</div>
        <div class="btn-bar">${K.ui.btn(K.t('test.save'), { type: 'submit', icon: 'check' })}</div>
      </form></div>`,
  };
});
K.forms.testsSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  const t = p.tests = p.tests || {};
  ['bloodGroup', 'hiv', 'hivDate', 'syphilis', 'syphilisDate', 'hbsag', 'hbsagDate', 'malaria', 'malariaDate', 'ogtt', 'ogttDate', 'tsh', 'tshDate', 'usgDate', 'usgNotes'].forEach(k => { if (v[k] == null || v[k] === '' || v[k] === 'nd') delete t[k]; else t[k] = v[k]; });
  ['multiple', 'previa'].forEach(k => { if (v[k] == null) delete t[k]; else t[k] = +v[k]; });
  if (t.bloodGroup && !c.mother.bloodGroup) c.mother.bloodGroup = t.bloodGroup;
  if (v.sickle) c.mother.sickle = v.sickle;
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.preg.url(c, p).slice(1));
};

/* ---------------------------------------------------------------- birth plan */
K.route('/card/:id/preg/:pid/plan', ({ id, pid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const p = K.card.findPreg(c, pid); if (!p) return K.screens.notFound();
  const bp = p.birthPlan || {};
  const items = K.content.birthPlan.concat((p.village === 'seasonal' || p.village === 'always') ? [{ k: 'maaGruha', en: 'Stay near the hospital before labour (ask about Maa Gruha)', or: 'ପ୍ରସବ ଯନ୍ତ୍ରଣା ପୂର୍ବରୁ ଡାକ୍ତରଖାନା ପାଖରେ ରୁହନ୍ତୁ (ମା\' ଗୃହ ବିଷୟରେ ପଚାରନ୍ତୁ)' }] : []);
  return {
    title: K.t('plan.title'), sub: c.mother.name, back: K.preg.url(c, p).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.t('preg.overview'), K.t('plan.title'), K.t('plan.lede'))}
      <form class="form" data-form="planSave" data-id="${id}" data-pid="${pid}">
        <div class="fgroup"><div class="checklist">${items.map(it => h`<label class="chk"><input type="checkbox" name="plan" value="${it.k}" ${bp[it.k] ? K.raw('checked') : ''}><span class="box">${K.ui.icon('check', 'sm')}</span><span>${K.L(it)}</span></label>`)}</div></div>
        <div class="fgroup"><div class="frow">${K.ui.field({ name: 'facility', label: K.t('plan.facility'), value: bp.facility || c.contacts.deliveryPoint })}${K.ui.field({ name: 'facilityPhone', type: 'tel', label: K.t('c.phone'), value: bp.facilityPhone || c.contacts.deliveryPhone })}</div>
          ${K.ui.field({ name: 'vehicle', type: 'tel', label: K.t('plan.vehicle'), value: bp.vehicle })}</div>
        <details class="acc"><summary>${K.ui.icon('house', 'sm')}${K.t('plan.home')}</summary><div class="acc-b"><p class="small">${K.t('plan.homeNote')}</p><ul class="ul">${K.content.homeKit.map(x => h`<li>${K.L(x)}</li>`)}</ul></div></details>
        <div class="btn-bar">${K.ui.btn(K.t('plan.save'), { type: 'submit', icon: 'check' })}</div>
      </form></div>`,
  };
});
K.forms.planSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const p = c && K.card.findPreg(c, f.dataset.pid); if (!p) return;
  const bp = { facility: v.facility || '', facilityPhone: v.facilityPhone || '', vehicle: v.vehicle || '' }; (v.plan || []).forEach(k => { bp[k] = 1; });
  p.birthPlan = bp;
  if (bp.facility && !c.contacts.deliveryPoint) { c.contacts.deliveryPoint = bp.facility; c.contacts.deliveryPhone = bp.facilityPhone; }
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.preg.url(c, p).slice(1));
};

/* ---------------------------------------------------------------- overview sections */
K.preg.addSection(20, (c, p) => {
  if (p.status === 'ended') return '';
  const st = K.td.status(p); const td = p.td || {};
  const n = o => Object.keys((o && o.days) || {}).length;
  const from14 = K.preg.dateAt(p, 14);
  const tdMeta = [td.td1 && `Td-1 ${K.d.fmt(td.td1)}`, td.td2 && `Td-2 ${K.d.fmt(td.td2)}`, td.booster && `Booster ${K.d.fmt(td.booster)}`].filter(Boolean).join(' · ');
  const url = K.preg.url(c, p, '/tablets');
  return h`<section class="sec">${K.ui.secH(K.t('preg.sec.tabs'), h`<a class="link" href="${url}">${K.t('open')}</a>`)}<div class="list">
    ${K.ui.li({ href: url, icon: 'syringe', tone: st.done ? 'done' : 'amber', title: K.t('td.title'), meta: tdMeta || (st.next ? `${K.t('td.' + st.next.k)} · ${K.d.fmt(st.next.date)}` : ''), trail: K.ui.pill(st.done ? K.t('st.done') : K.t('st.due'), st.done ? 'ok' : 'due') })}
    ${K.ui.li({ href: url, icon: 'pill', title: K.t('ifa.title'), meta: n(p.ifa) ? K.t('trk.count', { n: n(p.ifa), t: 180 }) : (from14 ? K.t('trk.startOn', { d: K.d.fmt(from14) }) : ''), trail: K.ui.pill(K.digits(n(p.ifa)) + '/' + K.digits(180), n(p.ifa) >= 180 ? 'ok' : 'soon') })}
    ${K.ui.li({ href: url, icon: 'pill', tone: 'info', title: K.t('ca.title'), meta: n(p.calcium) ? K.t('trk.count', { n: n(p.calcium), t: 180 }) : (from14 ? K.t('trk.startOn', { d: K.d.fmt(from14) }) : ''), trail: K.ui.pill(K.digits(n(p.calcium)) + '/' + K.digits(180), n(p.calcium) >= 180 ? 'ok' : 'soon') })}
    ${K.ui.li({ href: url, icon: 'pill', tone: p.albendazole ? 'done' : 'ink', title: K.t('alb.title'), meta: p.albendazole ? K.d.fmt(p.albendazole) : K.t('alb.rule'), trail: p.albendazole ? K.ui.pill(K.t('st.given'), 'ok') : '' })}
  </div></section>`;
});
K.preg.addSection(30, (c, p) => {
  if (p.status === 'ended') return '';
  const t = p.tests || {}; const url = K.preg.url(c, p, '/tests');
  const tone = r => r === 'pos' ? 'over' : r === 'neg' ? 'ok' : 'soon';
  const lab = r => r ? K.t('res.' + r) : K.t('res.nd');
  const hb = K.preg.latest(p, 'hb');
  const rows = [
    ['test.bloodGroup', t.bloodGroup || c.mother.bloodGroup || '', (t.bloodGroup || c.mother.bloodGroup) ? (/-$/.test(t.bloodGroup || c.mother.bloodGroup) ? 'over' : 'ok') : 'soon'],
    ['anc.hb', hb ? `${K.n(hb.v)} g/dl` : '', hb ? (hb.v < 11 ? (hb.v < 7 ? 'over' : 'due') : 'ok') : 'soon'],
    ['test.hiv', lab(t.hiv), tone(t.hiv)], ['test.syphilis', lab(t.syphilis), tone(t.syphilis)], ['test.hbsag', lab(t.hbsag), tone(t.hbsag)],
    ['test.ogtt', t.ogtt ? `${K.n(t.ogtt, 0)} mg/dl` : '', t.ogtt ? (t.ogtt >= 140 ? 'over' : 'ok') : 'soon'],
  ];
  return h`<section class="sec">${K.ui.secH(K.t('preg.sec.tests'), h`<a class="link" href="${url}">${K.t('btn.edit')}</a>`)}
    <a class="k-card pad-s tests-grid" href="${url}">${rows.map(r => h`<span class="tg"><span class="small">${K.t(r[0])}</span>${K.ui.pill(r[1] || K.t('res.nd'), r[2])}</span>`)}</a></section>`;
});
K.preg.addSection(40, (c, p) => {
  if (!K.preg.isActive(p)) return '';
  const bp = p.birthPlan || {}; const tot = K.content.birthPlan.length; const done = K.content.birthPlan.filter(x => bp[x.k]).length;
  return h`<section class="sec">${K.ui.secH(K.t('preg.sec.plan'))}<a class="k-card pad-s plan-card" href="${K.preg.url(c, p, '/plan')}">
    <span class="small">${K.t('plan.done', { n: done, t: tot })}</span>${K.ui.bar(done / tot * 100, done < tot ? 'amber' : '')}
    <span class="small faint">${bp.facility ? K.t('plan.facility') + ': ' + bp.facility : K.t('plan.lede')}</span></a></section>`;
});
K.preg.addSection(50, (c, p) => {
  if (!K.preg.isActive(p)) return '';
  return h`<section class="sec">${K.ui.secH(K.t('care.title'), h`<a class="link" href="#/learn/preg">${K.t('see.all')}</a>`)}
    <div class="k-card advice" id="care-adv"><ul class="adv">${K.content.pregCare.slice(0, 6).map(x => h`<li>${K.ui.icon(x.icon, 'sm')}<span>${K.L(x)}</span></li>`)}</ul>
    <div class="btn-row" style="margin-top:8px">${K.ui.say('#care-adv')}${K.ui.btn(K.t('care.more'), { href: '#/learn/preg', tone: 'quiet', size: 'sm', arrow: true })}</div></div></section>`;
});

/* ---------------------------------------------------------------- due items */
K.due.add((c, today) => {
  const p = K.card.activePreg(c); if (!p || !K.preg.edd(p)) return [];
  const out = []; const url = K.preg.url(c, p); const g = K.preg.ga(p, today);
  const st = K.td.status(p, today);
  if (st.next && g && g.days < 40 * 7) out.push({ id: 'td', kind: 'vax', icon: 'syringe', href: url + '/tablets', title: { en: st.next.k === 'td1' ? 'Td-1 injection' : st.next.k === 'td2' ? 'Td-2 injection' : 'Td booster injection', or: st.next.k === 'td1' ? 'ଟିଡି-୧ ଟୀକା' : st.next.k === 'td2' ? 'ଟିଡି-୨ ଟୀକା' : 'ଟିଡି ବୁଷ୍ଟର୍ ଟୀକା' }, date: st.next.date });
  const d14 = K.preg.dateAt(p, 14);
  if (d14 && !Object.keys((p.ifa && p.ifa.days) || {}).length && !(p.ifa && p.ifa.issued && p.ifa.issued.length) && g.days < 36 * 7)
    out.push({ id: 'ifa', kind: 'tab', icon: 'pill', href: url + '/tablets', title: { en: 'Start IFA and calcium tablets', or: 'ଆଇ.ଏଫ୍.ଏ. ଓ କ୍ୟାଲସିୟମ୍ ବଟିକା ଆରମ୍ଭ କରନ୍ତୁ' }, date: d14 });
  if (d14 && !p.albendazole && g.days < 36 * 7) out.push({ id: 'alb', kind: 'tab', icon: 'pill', href: url + '/tablets', title: { en: 'Albendazole tablet (once)', or: 'କୃମି ନାଶକ ବଟିକା (ଥରେ)' }, date: d14 });
  const t = p.tests || {};
  if (!t.hiv || !t.syphilis || !(t.bloodGroup || c.mother.bloodGroup)) out.push({ id: 'labs', kind: 'test', icon: 'drop', href: url + '/tests', title: { en: 'Blood tests: blood group, HIV, syphilis', or: 'ରକ୍ତ ପରୀକ୍ଷା: ବ୍ଲଡ୍ ଗ୍ରୁପ୍, HIV, ସିଫିଲିସ୍' }, date: K.d.max(p.createdAt.slice(0, 10), K.preg.lmpEq(p)) });
  const d24 = K.preg.dateAt(p, 24); if (d24 && !t.ogtt && g.days < 32 * 7) out.push({ id: 'ogtt', kind: 'test', icon: 'drop', href: url + '/tests', title: { en: 'Sugar test (OGTT) at 24–28 weeks', or: '୨୪–୨୮ ସପ୍ତାହରେ ଶର୍କରା ପରୀକ୍ଷା (OGTT)' }, date: d24 });
  const bp = p.birthPlan || {}; const done = K.content.birthPlan.filter(x => bp[x.k]).length;
  const d32 = K.preg.dateAt(p, 32); if (d32 && done < 5 && g.days < 40 * 7) out.push({ id: 'plan', kind: 'plan', icon: 'flag', href: url + '/plan', title: { en: 'Complete the birth plan', or: 'ପ୍ରସବ ପ୍ରସ୍ତୁତି ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ' }, date: d32 });
  return out;
});
