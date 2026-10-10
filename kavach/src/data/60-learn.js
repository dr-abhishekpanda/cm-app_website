/* ============================================================================
   data/60-learn — extra counselling content for the Learn library.
   anaemia: Odisha MCP card V-2023-24 p.43 (Odia; English translated here).
   newbornCare: national MCP card 2018 p.7 "Care of newborn" (Odia written
   for the app — flagged for review). ancBasics: Odisha p.3 and the SUMAN
   service guarantee (p.45). hygiene: Odisha pp.9 and 43.
   ============================================================================ */
K.content = K.content || {};
K.content.anaemia = {
  dos: [
    { icon: 'bowl', en: 'Anaemia comes from too little iron and other nutrients. Eat green leafy vegetables (khada, koshala, methi, palak, drumstick leaves), ragi (mandia), jaggery, chuda, fish, meat, eggs, dal and soybean.', or: 'ଲୌହସାର, ପୁଷ୍ଟିସାର ଓ ଅନ୍ୟାନ୍ୟ ଖାଦ୍ୟସାର ଅଭାବରୁ ରକ୍ତହୀନତା ହୋଇଥାଏ। ରକ୍ତହୀନତାରୁ ରକ୍ଷା ପାଇବା ପାଇଁ ଖାଦ୍ୟରେ ଖଡ଼ା, କୋଶଳା, ମେଥି, ପାଳଙ୍ଗ, ସଜନା ଇତ୍ୟାଦି ଶାଗ, ମାଣ୍ଡିଆ, ଗୁଡ଼, ଚୂଡ଼ା, ମାଛ, ମାଂସ, ଅଣ୍ଡା, ଡାଲି ଜାତୀୟ ଖାଦ୍ୟ, ସୋୟାବିନ ଇତ୍ୟାଦି ଖାଆନ୍ତୁ।' },
    { icon: 'sun', en: 'To absorb iron, eat fruits rich in vitamin C with meals: lemon, orange, tomato, guava, amla.', or: 'ଲୌହସାର ଶରୀରରେ ମିଶାଇବା ପାଇଁ ଖାଦ୍ୟ ସହିତ ଭିଟାମିନ୍-ସି ଯୁକ୍ତ ଖାଦ୍ୟ ଯଥା ଲେମ୍ବୁ, କମଳା, ଟମାଟୋ, ପିଜୁଳି, ଅଁଳା ଇତ୍ୟାଦି ଫଳ ଖାଆନ୍ତୁ।' },
    { icon: 'house', en: 'Do not go out barefoot to defecate in the open. Use a toilet.', or: 'ଖାଲି ପାଦରେ ବାହାରକୁ ଶୌଚ ଯାଆନ୍ତୁ ନାହିଁ। ପାଇଖାନା ବ୍ୟବହାର କରନ୍ତୁ।' },
    { icon: 'net', en: 'Sleep under an insecticide-treated bed net.', or: 'ଔଷଧ ବୁଡ଼ା ମଶାରୀ ଟାଣି ଶୁଅନ୍ତୁ।' },
    { icon: 'pill', en: 'Deworming tablets twice a year (February and August) for children aged 1–19 years and women aged 20–24 years.', or: '୧ ବର୍ଷରୁ ୧୯ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ପିଲା ଓ ୨୦ ବର୍ଷରୁ ୨୪ ବର୍ଷ ପ୍ରଜନନକ୍ଷମ ମହିଳାମାନଙ୍କୁ ବର୍ଷକୁ ଦୁଇଥର କୃମିନାଶକ ଔଷଧ ଖାଇବାକୁ ଦିଅନ୍ତୁ। (ଫେବୃଆରୀ ଓ ଅଗଷ୍ଟ)' },
    { icon: 'pill', en: 'Take iron and folic acid (IFA) tablets or syrup regularly.', or: 'ଲୌହସାର ଓ ଫୋଲିକ ଏସିଡ୍ ବଟିକା / ସିରପ୍ ନିୟମିତ ଖାଆନ୍ତୁ।' },
    { icon: 'water', en: 'Drink clean water. Keep your hands clean.', or: 'ପରିଷ୍କାର ପାଣି ପିଅନ୍ତୁ। ହାତକୁ ସଫା ରଖନ୍ତୁ।' },
    { icon: 'water', en: 'Drink lemon water after the IFA tablet.', or: 'ଲୌହସାର ଓ ଫୋଲିକ୍ ଏସିଡ୍ ବଟିକା ଖାଇବା ପରେ ଲେମ୍ବୁ ପାଣି ପିଅନ୍ତୁ।' },
  ],
  donts: [
    { icon: 'x', en: 'Do not drink tea or coffee with meals — keep at least 1 hour between food and tea or coffee.', or: 'ଖାଦ୍ୟ ସହିତ ଚା ଓ କଫି ପିଅନ୍ତୁ ନାହିଁ (ଖାଦ୍ୟ, ଚା ଓ କଫି ପିଇବା ମଧ୍ୟରେ ଅତି କମ୍‌ରେ ୧ ଘଣ୍ଟାର ବ୍ୟବଧାନ ରଖନ୍ତୁ)।' },
    { icon: 'x', en: 'Do not take calcium tablets with IFA tablets — keep at least 2 hours between them.', or: 'ଲୌହସାର ଓ ଫୋଲିକ ଏସିଡ୍ ବଟିକା ସହିତ କ୍ୟାଲସିୟମ୍ ବଟିକା ଖାଆନ୍ତୁ ନାହିଁ (ଏହି ଦୁଇଟି ବଟିକା ଖାଇବାର ବ୍ୟବଧାନ ଅତି କମ୍‌ରେ ୨ ଘଣ୍ଟା ରହିବା ଉଚିତ୍)।' },
    { icon: 'x', en: 'Do not drink soft drinks.', or: 'ମୃଦୁ ପାନୀୟ ପିଅନ୍ତୁ ନାହିଁ।' },
  ],
};
K.content.newbornCare = [
  { icon: 'sun', en: 'Keep the baby warm: skin-to-skin with the mother, covered head, hands and feet.', or: 'ଶିଶୁକୁ ଉଷୁମ ରଖନ୍ତୁ: ମା’ଙ୍କ ଛାତିରେ ଲଗାଇ ରଖନ୍ତୁ, ମୁଣ୍ଡ, ହାତ ଓ ପାଦ ଘୋଡ଼ାଇ ରଖନ୍ତୁ।' },
  { icon: 'heart', en: 'Start breastfeeding within 1 hour of birth.', or: 'ଜନ୍ମର ୧ ଘଣ୍ଟା ମଧ୍ୟରେ ସ୍ତନ୍ୟପାନ ଆରମ୍ଭ କରନ୍ତୁ।' },
  { icon: 'heart', en: "Feed the baby only mother's milk.", or: 'ଶିଶୁକୁ କେବଳ ମା’ କ୍ଷୀର ଦିଅନ୍ତୁ।' },
  { icon: 'water', en: 'Do not bathe the baby for the first 48 hours.', or: 'ପ୍ରଥମ ୪୮ ଘଣ୍ଟା ଶିଶୁକୁ ଗାଧୋଇବେ ନାହିଁ।' },
  { icon: 'shield', en: 'Keep the cord clean and dry. Put nothing on it.', or: 'ନାଭିକୁ ସଫା ଓ ଶୁଖିଲା ରଖନ୍ତୁ। ନାଭିରେ କିଛି ଲଗାନ୍ତୁ ନାହିଁ।' },
  { icon: 'users', en: 'Keep the baby away from sick people.', or: 'ଅସୁସ୍ଥ ଲୋକଙ୍କଠାରୁ ଶିଶୁକୁ ଦୂରରେ ରଖନ୍ତୁ।' },
  { icon: 'scale', en: 'Special care if the baby weighed less than 2.5 kg at birth — talk to the ANM.', or: 'ଜନ୍ମ ସମୟରେ ଓଜନ ୨.୫ କି.ଗ୍ରା.ରୁ କମ୍ ଥିଲେ ବିଶେଷ ଯତ୍ନ ଆବଶ୍ୟକ — ଏ.ଏନ୍.ଏମ୍.ଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।' },
];
K.content.hbnc = [
  { icon: 'house', en: 'The ASHA visits a newborn at home on days 3, 7, 14, 21, 28 and 42 (and on day 1 after a home birth) to check for danger signs.', or: 'ନିର୍ଦ୍ଦେଶାବଳୀ ଅନୁଯାୟୀ ଜନ୍ମର ୧ମ ଦିନ (କେବଳ ଘରେ ଜନ୍ମ ହୋଇଥିବା ଶିଶୁମାନଙ୍କ ପାଇଁ), ୩ୟ, ୭ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ଆଶାକର୍ମୀମାନେ ଗୃହ ପରିଦର୍ଶନ କରି ନବଜାତକଙ୍କର ସ୍ୱାସ୍ଥ୍ୟଗତ ବିପଦର ଲକ୍ଷଣ ଚିହ୍ନଟ କରିବେ।' },
  { icon: 'hospital', en: 'After discharge from an SNCU or NBSU, the same visits are counted from the day of discharge.', or: 'ଏସ୍.ଏନ୍.ସି.ୟୁ. ବା ଏନ୍.ବି.ଏସ୍.ୟୁ.ରୁ ଡିସ୍‌ଚାର୍ଜ ହେଲେ ଡିସ୍‌ଚାର୍ଜର ୧ମ, ୩ୟ, ୭ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ଗୃହ ପରିଦର୍ଶନ ହେବ।' },
  { icon: 'scale', en: 'Babies under 2.5 kg get three extra visits.', or: '୨.୫ କି.ଗ୍ରା.ରୁ କମ୍ ଓଜନର ଶିଶୁଙ୍କ ପାଇଁ ତିନୋଟି ଅଧିକ ପରିଦର୍ଶନ।' },
  { icon: 'eye', en: 'Babies born before 34 weeks or under 2 kg need an eye check for ROP by 1 month of age.', or: 'ଗର୍ଭଧାରଣ ଠାରୁ ୩୪ ସପ୍ତାହ ପୂରଣ ହେବା ପୂର୍ବରୁ ଜନ୍ମ ହୋଇଥିବା ବା ଜନ୍ମ ସମୟରେ ୨ କି.ଗ୍ରା.ରୁ କମ୍ ଓଜନ ଥିବା ଶିଶୁଙ୍କର ଏକ ମାସ ବୟସରେ ଚକ୍ଷୁ ପରୀକ୍ଷା (RoP Screening) ଆବଶ୍ୟକ।' },
];
K.content.ancBasics = [
  { icon: 'calendar', en: 'Register the pregnancy early, in the first 3 months, with your ANM or ASHA.', or: 'ପ୍ରଥମ ୩ ମାସ ମଧ୍ୟରେ ଏ.ଏନ୍.ଏମ୍. ବା ଆଶାଙ୍କ ପାଖରେ ଗର୍ଭ ପଞ୍ଜୀକରଣ କରନ୍ତୁ।' },
  { icon: 'hospital', en: 'At least 4 check-ups (ANC), with one in the first 3 months.', or: 'ଅତିକମ୍‌ରେ ୪ଟି ଗର୍ଭାବସ୍ଥାର ପରୀକ୍ଷା (ଏ.ଏନ୍.ସି.), ପ୍ରଥମ ତ୍ରୟମାସରେ ଗୋଟିଏ ସହିତ।' },
  { icon: 'user', en: 'In the 2nd or 3rd trimester, see a doctor at least once at the PMSMA clinic on the 9th of the month.', or: 'ଗର୍ଭାବସ୍ଥାର ଦ୍ୱିତୀୟ/ତୃତୀୟ ତ୍ରୟମାସିକ ମଧ୍ୟରେ ଅତିକମ୍‌ରେ ଥରେ ଗର୍ଭାବସ୍ଥାର ପରୀକ୍ଷା ଜଣେ ଡାକ୍ତରଙ୍କ ଦ୍ୱାରା ମାସର ୯ ତାରିଖରେ ହେଉଥିବା ପ୍ରଧାନମନ୍ତ୍ରୀ ସୁରକ୍ଷିତ ମାତୃତ୍ୱ ଅଭିଯାନରେ ନିଶ୍ଚିତ କରାନ୍ତୁ।' },
  { icon: 'pulse', en: 'At each check-up: weight, blood pressure, haemoglobin, urine test and abdominal check.', or: 'ପ୍ରତ୍ୟେକ ପରୀକ୍ଷାରେ: ଓଜନ, ରକ୍ତଚାପ, ହିମୋଗ୍ଲୋବିନ୍, ପରିସ୍ରା ପରୀକ୍ଷା ଓ ପେଟ ପରୀକ୍ଷା।' },
  { icon: 'drop', en: 'Blood tests once: blood group, HIV, syphilis, hepatitis B and blood sugar (OGTT); an ultrasound as advised.', or: 'ଥରେ ରକ୍ତ ପରୀକ୍ଷା: ରକ୍ତ ଗ୍ରୁପ୍, ଏଚ୍.ଆଇ.ଭି., ସିଫିଲିସ୍, ହେପାଟାଇଟିସ୍ ବି ଓ ରକ୍ତରେ ଶର୍କରା (OGTT); ପରାମର୍ଶ ଅନୁସାରେ ଅଲ୍ଟ୍ରାସାଉଣ୍ଡ।' },
  { icon: 'heart', en: 'All check-ups, tests, medicines, delivery and transport are free at government hospitals.', or: 'ସରକାରୀ ଡାକ୍ତରଖାନାରେ ସମସ୍ତ ପରୀକ୍ଷା, ଔଷଧ, ପ୍ରସବ ଓ ଯାତାୟାତ ମାଗଣା।' },
];
K.content.hygiene = [
  { icon: 'hand', en: 'Wash hands with soap and water: before cooking, before eating and feeding the child, after the toilet and after cleaning the child.', or: 'ଖାଦ୍ୟ ତିଆରି କରିବା ପୂର୍ବରୁ, ଶିଶୁକୁ ଖୁଆଇବା ପୂର୍ବରୁ, ମଳତ୍ୟାଗ କରିବା ପରେ ଏବଂ ଶିଶୁର ମଳ ସଫା କରିବା ପରେ ଦୁଇ ହାତକୁ ଭଲ ଭାବେ ସାବୁନ ଲଗାଇ ଧୁଅନ୍ତୁ।' },
  { icon: 'water', en: 'Keep drinking water clean and covered.', or: 'ପାନୀୟ ଜଳକୁ ସଫା, ସୁରକ୍ଷିତ ଏବଂ ଢାଙ୍କୁଣି ଥିବା ପାତ୍ରରେ ଘୋଡ଼ାଇ ରଖନ୍ତୁ।' },
  { icon: 'house', en: 'Always use a toilet; do not defecate in the open.', or: 'ସବୁ ସମୟରେ ପାଇଖାନା ବ୍ୟବହାର କରନ୍ତୁ ଏବଂ ଖୋଲାରେ ଶୌଚ କରନ୍ତୁ ନାହିଁ।' },
  { icon: 'net', en: 'Mother and child should sleep under an insecticide-treated bed net every night.', or: "ମାରାତ୍ମକ ମ୍ୟାଲେରିଆରୁ ରକ୍ଷା ପାଇବା ପାଇଁ ମା' ଓ ଶିଶୁ ନିୟମିତ ଔଷଧବୁଡ଼ା ମଶାରୀ ଟାଣି ଶୁଅନ୍ତୁ।" },
  { icon: 'temp', en: 'Any fever in a malaria area: get a malaria test (RDT) from the ASHA the same day.', or: 'ମ୍ୟାଲେରିଆ ଅଞ୍ଚଳରେ, ଯେକୌଣସି ଜ୍ୱର ହେଲେ ସେହି ଦିନ ଆଶାଙ୍କ ଠାରୁ ମ୍ୟାଲେରିଆ ପରୀକ୍ଷା (RDT) କରାନ୍ତୁ।' },
  { icon: 'house', en: 'Cook on an LPG stove so that there is no smoke in the house.', or: 'ରୋଷେଇ କରିବା ପାଇଁ ଏଲ୍‌ପିଜି ଗ୍ୟାସ୍ ବ୍ୟବହାର କରନ୍ତୁ। ତା ଦ୍ୱାରା ଘରେ ଧୁଆଁ ହୋଇନଥାଏ।' },
];
K.content.afterBirth = [
  { icon: 'hospital', en: 'Stay at least 48 hours in the hospital after delivery.', or: 'ପ୍ରସବ ପରେ ଅତିକମ୍‌ରେ ୪୮ ଘଣ୍ଟା ପର୍ଯ୍ୟନ୍ତ ଡାକ୍ତରଖାନାରେ ରୁହନ୍ତୁ।' },
  { icon: 'pill', en: 'Take one IFA tablet and two calcium tablets every day for at least 6 months after delivery.', or: 'ପ୍ରସବ ପରେ ଅତି କମ୍‌ରେ ୬ ମାସ ପର୍ଯ୍ୟନ୍ତ ପ୍ରତିଦିନ ଗୋଟିଏ ଆଇ.ଏଫ୍.ଏ. ବଟିକା ଓ ଦୁଇଟି କ୍ୟାଲସିୟମ୍ ବଟିକା ଖାଆନ୍ତୁ।' },
  { icon: 'house', en: 'The ASHA will visit you and the baby at home on days 3, 7, 14, 21, 28 and 42 after delivery.', or: 'ଆଶା ଦିଦି ପ୍ରସବ ପରେ ୩, ୭, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ମା’ ଓ ଶିଶୁଙ୍କୁ ଘରେ ଦେଖିବେ।' },
  { icon: 'bowl', en: 'Eat one extra meal a day while breastfeeding, drink enough water and rest well.', or: 'ସ୍ତନ୍ୟପାନ ସମୟରେ ଦିନକୁ ଗୋଟିଏ ଅଧିକ ଖାଦ୍ୟ ଖାଆନ୍ତୁ, ଯଥେଷ୍ଟ ପାଣି ପିଅନ୍ତୁ ଓ ଭଲ ଭାବେ ବିଶ୍ରାମ ନିଅନ୍ତୁ।' },
  { icon: 'heart', en: 'Keep the baby with you and breastfeed often, day and night.', or: 'ଶିଶୁକୁ ପାଖରେ ରଖନ୍ତୁ ଓ ଦିନ ରାତି ବାରମ୍ବାର ସ୍ତନ୍ୟପାନ କରାନ୍ତୁ।' },
  { icon: 'users', en: 'Choose a family planning method before 6 weeks after delivery.', or: 'ପ୍ରସବର ୬ ସପ୍ତାହ ପୂର୍ବରୁ ଗୋଟିଏ ପରିବାର ନିୟୋଜନ ପଦ୍ଧତି ବାଛନ୍ତୁ।' },
];
