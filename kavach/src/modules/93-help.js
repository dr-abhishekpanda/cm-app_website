/* ============================================================================
   modules/93-help — helplines and entitlements, each with its source and the
   date it was last checked. Amounts change: keep the "checked" dates honest.
   Sources: national MCP card 2018 p.1 (JSY, JSSK, PMSMA); Odisha MCP card
   V-2023-24 pp.43–46 (JSY amounts, e-PMSMA travel, NRC, ₹500 drop-back, SUMAN,
   Kilkari); WCD Odisha MAMATA-PMMVY page (checked 9 Oct 2026); AIR News
   24 Oct 2025 (POSHAN / PMMVY helpline 1515 replaced 14408 from 1 Nov 2025).
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'help.title': { en: 'Helplines and schemes', or: 'ହେଲ୍ପଲାଇନ୍ ଓ ଯୋଜନା' },
  'help.lede': { en: 'Free numbers to call, and what every mother and child is entitled to.', or: 'ମାଗଣା ଫୋନ୍ ନମ୍ବର, ଓ ପ୍ରତ୍ୟେକ ମା’ ଓ ଶିଶୁଙ୍କ ପ୍ରାପ୍ୟ ସୁବିଧା।' },
  'help.calls': { en: 'Call for help', or: 'ସାହାଯ୍ୟ ପାଇଁ ଫୋନ୍ କରନ୍ତୁ' },
  'help.local': { en: 'Your local contacts', or: 'ଆପଣଙ୍କ ସ୍ଥାନୀୟ ଯୋଗାଯୋଗ' },
  'help.localNone': { en: 'Add the ASHA, ANM and Anganwadi worker numbers on a family card to see them here.', or: 'ଏଠାରେ ଦେଖିବା ପାଇଁ ପରିବାର କାର୍ଡରେ ଆଶା, ଏ.ଏନ୍.ଏମ୍. ଓ ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀଙ୍କ ନମ୍ବର ଯୋଗ କରନ୍ତୁ।' },
  'help.schemes': { en: 'Your entitlements', or: 'ଆପଣଙ୍କ ପ୍ରାପ୍ୟ ସୁବିଧା' },
  'help.checked': { en: 'Source: {s} · checked {d}', or: 'ଉତ୍ସ: {s} · ଯାଞ୍ଚ {d}' },
  'help.note': { en: 'Amounts and rules change. Confirm with your ASHA, Anganwadi worker or ANM before you apply.', or: 'ରାଶି ଓ ନିୟମ ବଦଳେ। ଆବେଦନ ପୂର୍ବରୁ ଆଶା, ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ ବା ଏ.ଏନ୍.ଏମ୍.ଙ୍କ ଠାରୁ ନିଶ୍ଚିତ କରନ୍ତୁ।' },
  'help.notGovt': { en: 'This app is not an official government app. It helps you use the government MCP card and services.', or: 'ଏହା ସରକାରୀ ଆପ୍ ନୁହେଁ। ଏହା ସରକାରୀ MCP କାର୍ଡ ଓ ସେବା ବ୍ୟବହାରରେ ସାହାଯ୍ୟ କରେ।' },
});

K.help = {};
K.help.CALLS = [
  { n: '108', icon: 'ambulance', tone: 'danger', t: { en: 'Ambulance — any emergency', or: 'ଆମ୍ବୁଲାନ୍ସ — ଯେକୌଣସି ଜରୁରୀ ଅବସ୍ଥା' } },
  { n: '102', icon: 'ambulance', t: { en: 'Janani Express — pregnant women, mothers up to 42 days after delivery, sick infants up to 1 year', or: 'ଜନନୀ ଏକ୍ସପ୍ରେସ୍ — ଗର୍ଭବତୀ, ପ୍ରସବର ୪୨ ଦିନ ପର୍ଯ୍ୟନ୍ତ ମା’, ୧ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ଅସୁସ୍ଥ ଶିଶୁ' } },
  { n: '104', icon: 'phone', t: { en: 'Health helpline, 24 hours — advice and complaints', or: 'ସ୍ୱାସ୍ଥ୍ୟ ହେଲ୍ପଲାଇନ୍, ୨୪ ଘଣ୍ଟା — ପରାମର୍ଶ ଓ ଅଭିଯୋଗ' } },
  { n: '14416', icon: 'heart', t: { en: 'Tele-MANAS — feeling low, worried or not coping (free, 24 hours)', or: 'ଟେଲି-ମାନସ — ମନ ଦୁଃଖ, ଚିନ୍ତା ବା ଅସହାୟ ଲାଗିଲେ (ମାଗଣା, ୨୪ ଘଣ୍ଟା)' } },
  { n: '14423', icon: 'sound', t: { en: 'Kilkari — listen again to the weekly health messages (from the registered mobile)', or: 'କିଲକାରୀ — ସାପ୍ତାହିକ ସ୍ୱାସ୍ଥ୍ୟ ବାର୍ତ୍ତା ପୁଣି ଶୁଣନ୍ତୁ (ପଞ୍ଜୀକୃତ ମୋବାଇଲ୍‌ରୁ)' } },
  { n: '1515', icon: 'phone', t: { en: 'POSHAN and PMMVY (MAMATA) helpline', or: 'ପୋଷଣ ଓ PMMVY (ମମତା) ହେଲ୍ପଲାଇନ୍' } },
  { n: '181', icon: 'users', t: { en: 'Women helpline', or: 'ମହିଳା ହେଲ୍ପଲାଇନ୍' } },
  { n: '1098', icon: 'baby', t: { en: 'Child helpline', or: 'ଶିଶୁ ହେଲ୍ପଲାଇନ୍' } },
  { n: '112', icon: 'shield', t: { en: 'Police and all emergencies', or: 'ପୋଲିସ୍ ଓ ସମସ୍ତ ଜରୁରୀ ଅବସ୍ଥା' } },
];
const S = (en, or) => ({ en, or });
K.help.SCHEMES = [
  { k: 'jssk', icon: 'hospital', t: S('Free care at government hospitals (JSSK)', 'ସରକାରୀ ଡାକ୍ତରଖାନାରେ ମାଗଣା ସେବା (JSSK)'),
    items: [S('Free and cashless delivery, including caesarean section', 'ଅସ୍ତ୍ରୋପଚାର ସହିତ ସମ୍ପୂର୍ଣ୍ଣ ମାଗଣାରେ ପ୍ରସବ'), S('Free medicines, tests (blood, urine, ultrasound) and blood', 'ମାଗଣା ଔଷଧ, ପରୀକ୍ଷା (ରକ୍ତ, ପରିସ୍ରା, ଅଲ୍ଟ୍ରାସାଉଣ୍ଡ) ଓ ରକ୍ତ'),
      S('Free food during the stay: up to 3 days after a normal delivery, 7 days after a caesarean', 'ରହିବା ସମୟରେ ମାଗଣା ଖାଦ୍ୟ: ସ୍ୱାଭାବିକ ପ୍ରସବ ପରେ ୩ ଦିନ, ଅସ୍ତ୍ରୋପଚାର ପରେ ୭ ଦିନ ପର୍ଯ୍ୟନ୍ତ'),
      S('Free transport from home to hospital, between hospitals, and back home', 'ଘରୁ ଡାକ୍ତରଖାନା, ଡାକ୍ତରଖାନା ମଧ୍ୟରେ ଓ ଘରକୁ ଫେରିବା ମାଗଣା ଯାତାୟାତ'),
      S('Sick babies up to 1 year: free treatment, medicines, tests, blood and transport', '୧ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ଅସୁସ୍ଥ ଶିଶୁ: ମାଗଣା ଚିକିତ୍ସା, ଔଷଧ, ପରୀକ୍ଷା, ରକ୍ତ ଓ ଯାତାୟାତ'), S('No user charges of any kind', 'କୌଣସି ପ୍ରକାର ଶୁଳ୍କ ନାହିଁ')],
    src: 'National MCP card 2018, p.1', d: '2026-10-10' },
  { k: 'jsy', icon: 'star', t: S('Janani Suraksha Yojana (JSY)', 'ଜନନୀ ସୁରକ୍ଷା ଯୋଜନା (JSY)'),
    items: [S('Cash for giving birth in a government hospital or a JSY-accredited private hospital: ₹1,400 in rural areas, ₹1,000 in urban areas, paid into the bank account (DBT)', 'ସରକାରୀ ଡାକ୍ତରଖାନା ବା JSY ସ୍ୱୀକୃତିପ୍ରାପ୍ତ ବେସରକାରୀ ଡାକ୍ତରଖାନାରେ ପ୍ରସବ କଲେ ପ୍ରୋତ୍ସାହନ ରାଶି: ଗ୍ରାମାଞ୍ଚଳ ପାଇଁ ୧୪୦୦ ଟଙ୍କା ଓ ସହରାଞ୍ଚଳ ପାଇଁ ୧୦୦୦ ଟଙ୍କା, ଡି.ବି.ଟି. ମାଧ୍ୟମରେ ବ୍ୟାଙ୍କ ଆକାଉଣ୍ଟରେ')],
    src: 'Odisha MCP card V-2023-24, p.43', d: '2026-10-10' },
  { k: 'mamata', icon: 'mother', t: S('MAMATA–PMMVY (Odisha)', 'ମମତା–PMMVY (ଓଡ଼ିଶା)'),
    items: [S('From 1 April 2025: ₹6,000 after registering the pregnancy at the Anganwadi centre and at least one check-up within 6 months of the last period', '୧ ଏପ୍ରିଲ୍ ୨୦୨୫ ରୁ: ଅଙ୍ଗନୱାଡ଼ି କେନ୍ଦ୍ରରେ ଗର୍ଭ ପଞ୍ଜୀକରଣ ଓ ଶେଷ ଋତୁସ୍ରାବର ୬ ମାସ ମଧ୍ୟରେ ଅତି କମ୍‌ରେ ଗୋଟିଏ ପରୀକ୍ଷା ପରେ ୬,୦୦୦ ଟଙ୍କା'),
      S('Second instalment after birth registration and the baby’s vaccines up to 14 weeks: ₹4,000 for a boy, ₹6,000 for a girl', 'ଜନ୍ମ ପଞ୍ଜୀକରଣ ଓ ଶିଶୁର ୧୪ ସପ୍ତାହ ପର୍ଯ୍ୟନ୍ତ ଟୀକା ପରେ ଦ୍ୱିତୀୟ କିସ୍ତି: ପୁଅ ପାଇଁ ୪,୦୦୦ ଟଙ୍କା, ଝିଅ ପାଇଁ ୬,୦୦୦ ଟଙ୍କା'),
      S('For up to two live births; women of PVTG communities for all births until 31 March 2029', 'ଦୁଇଟି ଜୀବିତ ସନ୍ତାନ ପର୍ଯ୍ୟନ୍ତ; PVTG ସମ୍ପ୍ରଦାୟର ମହିଳାଙ୍କ ପାଇଁ ୩୧ ମାର୍ଚ୍ଚ ୨୦୨୯ ପର୍ଯ୍ୟନ୍ତ ସମସ୍ତ ଜନ୍ମ'),
      S('Apply through the Anganwadi worker. Documents asked for include Aadhaar, a bank or post-office account, the MCP card and ABHA ID — this app does not store Aadhaar or bank details.', 'ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀଙ୍କ ମାଧ୍ୟମରେ ଆବେଦନ କରନ୍ତୁ। ଆଧାର, ବ୍ୟାଙ୍କ ବା ଡାକଘର ଆକାଉଣ୍ଟ, MCP କାର୍ଡ ଓ ABHA ID ଆବଶ୍ୟକ — ଏହି ଆପ୍ ଆଧାର ବା ବ୍ୟାଙ୍କ ବିବରଣୀ ରଖେ ନାହିଁ।')],
    src: 'WCD Odisha, MAMATA-PMMVY page (wcd.odisha.gov.in)', d: '2026-10-09' },
  { k: 'pmsma', icon: 'user', t: S('PMSMA and e-PMSMA', 'PMSMA ଓ e-PMSMA'),
    items: [S('A free check-up by a doctor on the 9th of every month (the 10th if the 9th is a Sunday), at least once in the 2nd or 3rd trimester', 'ପ୍ରତି ମାସ ୯ ତାରିଖରେ (ରବିବାର ହେଲେ ୧୦ ତାରିଖ) ଡାକ୍ତରଙ୍କ ଦ୍ୱାରା ମାଗଣା ପରୀକ୍ଷା, ଦ୍ୱିତୀୟ ବା ତୃତୀୟ ତ୍ରୟମାସରେ ଅତି କମ୍‌ରେ ଥରେ'),
      S('High-risk pregnancies found under e-PMSMA get ₹100 for travel for each specialist check-up at a government hospital, for up to three check-ups (Odisha)', 'E-PMSMA ଅଧୀନରେ ଚିହ୍ନଟ ବିପଦସଙ୍କୁଳ ଗର୍ଭବତୀଙ୍କୁ ସରକାରୀ ଡାକ୍ତରଖାନାରେ ବିଶେଷଜ୍ଞ ଚେକଅପ୍ ପାଇଁ ଯାତାୟାତ ଖର୍ଚ୍ଚ ବାବଦକୁ ୧୦୦ ଟଙ୍କା ଲେଖାଏଁ, ତିନୋଟି ଚେକଅପ୍ ପର୍ଯ୍ୟନ୍ତ (ଓଡ଼ିଶା)')],
    src: 'National MCP card 2018, p.1; Odisha MCP card V-2023-24, p.43', d: '2026-10-10' },
  { k: 'suman', icon: 'shield', t: S('SUMAN — assured services', 'ସୁମନ୍ — ସୁନିଶ୍ଚିତ ସେବା'),
    items: [S('At least 4 check-ups in pregnancy, IFA tablets, Td injections and all tests, free', 'ଅତିକମ୍‌ରେ ୪ଟି ଗର୍ଭାବସ୍ଥାର ପରୀକ୍ଷା, ଆଇରନ୍ ଫଲିକ୍ ଏସିଡ୍ ବଟିକା, ଟିଡି ଇଞ୍ଜେକ୍‌ସନ୍ ଏବଂ ଗର୍ଭାବସ୍ଥାର ସମସ୍ତ ପରୀକ୍ଷା ମାଗଣା'),
      S('Six home visits for the newborn', 'ନବଜାତ ଶିଶୁର ଯତ୍ନ ନିମନ୍ତେ ୬ ଥର ଗୃହ ପରିଦର୍ଶନ'),
      S('Reaching a health centre within 1 hour in an emergency, and a free ride home after the 48-hour stay', 'ଯେକୌଣସି ଜରୁରୀ ପରିସ୍ଥିତିରେ ୧ ଘଣ୍ଟା ଭିତରେ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ପହଞ୍ଚାଇବା ଏବଂ ୪୮ ଘଣ୍ଟା ରହିବା ପରେ ଘରେ ପହଞ୍ଚାଇବାର ନିଶ୍ଚିତ ଆଶ୍ୱାସନା'),
      S('Respectful care with privacy and dignity; free care for sick newborns; birth certificate from the hospital', 'ସମ୍ମାନ, ଏକାନ୍ତତା ଏବଂ ସ୍ୱାଭିମାନର ସହିତ ସେବା; ଅସୁସ୍ଥ ନବଜାତ ଶିଶୁଙ୍କୁ ମାଗଣା ସେବା; ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରୁ ଜନ୍ମ ପ୍ରମାଣପତ୍ର'),
      S('Complaints are heard through the call centre (104) and web portal', 'କଲ୍ ସେଣ୍ଟର / ସହାୟତା କେନ୍ଦ୍ର ଏବଂ ୱେବ୍ ପୋର୍ଟାଲ ଯୋଗେ ଅଭିଯୋଗ ଶୁଣାଣି')],
    src: 'Odisha MCP card V-2023-24, p.45', d: '2026-10-10' },
  { k: 'dropback', icon: 'ambulance', t: S('₹500 for the trip home', 'ଘରକୁ ଫେରିବା ପାଇଁ ୫୦୦ ଟଙ୍କା'),
    items: [S('Mothers after delivery, and sick babies up to 1 year discharged from hospital (IPD, NRC, NBSU or SNCU), get ₹500 for travel home, paid by DBT (Odisha)', 'ପ୍ରସୂତୀ ମହିଳା ଓ ଜନ୍ମରୁ ୧ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ଡାକ୍ତରଖାନାରେ ଭର୍ତ୍ତି (ଆଇ.ପି.ଡି./ଏନ୍.ଆର୍.ସି./ଏନ୍.ବି.ଏସ୍.ୟୁ./ଏସ୍.ଏନ୍.ସି.ୟୁ.) ଅସୁସ୍ଥ ଶିଶୁଙ୍କ ଘରକୁ ଫେରିବା ପାଇଁ ୫୦୦ ଟଙ୍କା ଡି.ବି.ଟି. ମାଧ୍ୟମରେ')],
    src: 'Odisha MCP card V-2023-24, p.43', d: '2026-10-10' },
  { k: 'nrc', icon: 'scale', t: S('Nutrition Rehabilitation Centre (NRC)', 'ପୁଷ୍ଟି ପୁନର୍ବାସ କେନ୍ଦ୍ର (NRC)'),
    items: [S('Free treatment for children with severe acute malnutrition', 'ଅତିଶୟ ପୁଷ୍ଟିହୀନ ଶିଶୁଙ୍କ ପାଇଁ ମାଗଣା ଚିକିତ୍ସା'),
      S('The mother or caregiver staying with the child gets ₹100 a day for lost wages, ₹100 for travel at discharge, and ₹300 for four follow-up visits (Odisha)', 'NRC ରେ ପିଲା ସହିତ ରହୁଥିବା ମା’/ଯତ୍ନକାରୀଙ୍କୁ ପ୍ରତିଦିନ ମଜୁରୀ ଭରଣା ବାବଦକୁ ୧୦୦ ଟଙ୍କା, ଡିସଚାର୍ଜ ସମୟରେ ଯାତାୟାତ ବାବଦକୁ ୧୦୦ ଟଙ୍କା ଓ ୪ଥର ଫଲୋଅପ୍ ପାଇଁ ୩୦୦ ଟଙ୍କା (ଓଡ଼ିଶା)')],
    src: 'Odisha MCP card V-2023-24, p.43', d: '2026-10-10' },
  { k: 'rbsk', icon: 'star', t: S('RBSK and DEIC', 'RBSK ଓ ଡି.ଇ.ଆଇ.ସି.'),
    items: [S('Free screening of children for birth defects, deficiencies, diseases and developmental delay by mobile health teams and at Anganwadi centres and schools', 'ମୋବାଇଲ୍ ସ୍ୱାସ୍ଥ୍ୟ ଦଳ ଦ୍ୱାରା ଅଙ୍ଗନୱାଡ଼ି ଓ ବିଦ୍ୟାଳୟରେ ଜନ୍ମଗତ ତ୍ରୁଟି, ପୁଷ୍ଟି ଅଭାବ, ରୋଗ ଓ ବିଳମ୍ବିତ ବିକାଶ ପାଇଁ ମାଗଣା ଯାଞ୍ଚ'),
      Object.assign({}, K.dev.TEXT.deicBody)],
    src: 'Odisha MCP card V-2023-24, p.10', d: '2026-10-10' },
  { k: 'kilkari', icon: 'sound', t: S('Kilkari voice messages', 'କିଲକାରୀ ସ୍ୱର ବାର୍ତ୍ତା'),
    items: [S('Free weekly calls about mother and child health from 0124-4588000, from the 4th month of pregnancy until the baby is 1 year old', '୦୧୨୪୪୫୮୮୦୦୦ ନମ୍ବରରୁ ପ୍ରତି ସପ୍ତାହରେ ମାତୃ ଓ ଶିଶୁ ସ୍ୱାସ୍ଥ୍ୟ ସମ୍ବନ୍ଧିତ ସୂଚନା (ଗର୍ଭାବସ୍ଥାର ଚତୁର୍ଥ ମାସରୁ ଶିଶୁକୁ ଏକ ବର୍ଷ ହେବା ପର୍ଯ୍ୟନ୍ତ)'),
      S('Missed a call? Dial 14423 (toll-free) from the registered mobile to hear it again', 'କଲ୍ ଉଠାଇ ନ ପାରିଲେ ପଞ୍ଜୀକୃତ ମୋବାଇଲ୍‌ରୁ ୧୪୪୨୩ (ଟୋଲ୍ ଫ୍ରି) ଡାଏଲ୍ କରି ପୁନର୍ବାର ଶୁଣନ୍ତୁ')],
    src: 'Odisha MCP card V-2023-24, p.46', d: '2026-10-10' },
  { k: 'fp', icon: 'users', t: S('Family planning incentives', 'ପରିବାର ନିୟୋଜନ ପ୍ରୋତ୍ସାହନ'),
    items: [S('PPIUCD ₹300; Antara injection ₹100 per dose; female sterilisation ₹2,200 after delivery or ₹1,400 interval; male sterilisation (NSV) ₹2,000 — amounts as printed on the Odisha card', 'ପ୍ରସବ ପରବର୍ତ୍ତୀ ଆଇ ୟୁ ସି ଡି ୩୦୦ ଟଙ୍କା; ଅନ୍ତରା ଇଞ୍ଜେକସନ୍ ପ୍ରତି ମାତ୍ରା ୧୦୦ ଟଙ୍କା; ମହିଳା ବନ୍ଧ୍ୟାକରଣ ପ୍ରସବ ପରେ ୨,୨୦୦ ଟଙ୍କା ବା ଅନ୍ତର୍ବର୍ତ୍ତୀ ୧,୪୦୦ ଟଙ୍କା; ପୁରୁଷ ବନ୍ଧ୍ୟାକରଣ (NSV) ୨,୦୦୦ ଟଙ୍କା — ଓଡ଼ିଶା କାର୍ଡ ଅନୁସାରେ')],
    src: 'Odisha MCP card V-2023-24, p.42', d: '2026-10-10' },
];

K.route('/help', () => {
  // local contacts from the family cards (deduplicated by number)
  const seen = new Set(); const local = [];
  K.store.list().forEach(c => { const ct = c.contacts || {};
    [['asha', 'ashaPhone', 'ASHA'], ['anm', 'anmPhone', 'ANM'], ['aww', 'awwPhone', 'AWW'], ['deliveryPoint', 'deliveryPhone', ''], ['fru', 'fruPhone', 'FRU'], ['referral1', 'referral1Phone', '']].forEach(([n, p, role]) => {
      const num = (ct[p] || '').replace(/\s+/g, ''); if (!num || seen.has(num)) return; seen.add(num); local.push({ name: ct[n] || role, role, num }); }); });
  return { title: K.t('help.title'), tab: 'home', back: '/',
    html: h`<div class="wrap">${K.ui.phead('', K.t('help.title'), K.t('help.lede'))}
      <section class="sec">${K.ui.secH(K.t('help.calls'))}<div class="list">${K.help.CALLS.map(x => h`<a class="li" href="tel:${x.n}"><span class="lead ${x.tone === 'danger' ? 'red' : ''}">${K.ui.icon(x.icon)}</span><span class="body"><span class="t"><b class="mono call-n">${K.digits(x.n)}</b></span><span class="m">${K.L(x.t)}</span></span><span class="trail">${K.ui.icon('phone', 'sm')}</span></a>`)}</div></section>
      <section class="sec">${K.ui.secH(K.t('help.local'))}${local.length ? h`<div class="list">${local.map(x => h`<a class="li" href="tel:${x.num}"><span class="lead">${K.ui.icon('user')}</span><span class="body"><span class="t">${x.name}</span><span class="m mono">${x.role ? x.role + ' · ' : ''}${x.num}</span></span><span class="trail">${K.ui.icon('phone', 'sm')}</span></a>`)}</div>` : h`<p class="small">${K.t('help.localNone')}</p>`}</section>
      <section class="sec">${K.ui.secH(K.t('help.schemes'))}<p class="small">${K.t('help.note')}</p>
        <div class="stack">${K.help.SCHEMES.map(sc => h`<details class="acc" id="sch-${sc.k}"><summary>${K.ui.icon(sc.icon, 'sm')}<span>${K.L(sc.t)}</span></summary><div class="acc-b">
          <ul class="ill-list">${sc.items.map(x => h`<li>${K.ui.icon('check', 'sm')}<span>${K.L(x)}</span></li>`)}</ul>
          <p class="small faint" style="margin:8px 0 0">${K.t('help.checked', { s: sc.src, d: K.d.fmt(sc.d) })}</p></div></details>`)}</div></section>
      <p class="small faint">${K.t('help.notGovt')}</p>
    </div>`,
    mount() { const a = K.anchor(); if (a) { const e = document.getElementById(a); if (e) { e.open = true; e.scrollIntoView(); } } } };
});
