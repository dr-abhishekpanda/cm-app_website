/* ============================================================================
   data/52-illness — diarrhoea and pneumonia (prevention, home care, when to
   go), breath-count cut-offs, ORS and zinc, IFA syrup rules for children.
   Sources: Odisha MCP card V-2023-24 p.9 (diarrhoea, pneumonia) and p.39
   (IFA syrup, deworming); national MCP card 2018 pp.8–9 and p.27.
   Fast breathing (IMNCI / MCP card): < 2 months ≥ 60, 2–12 months ≥ 50,
   1–5 years ≥ 40 breaths a minute. Zinc 20 mg dispersible tablet: ½ tablet
   (10 mg) for 2–6 months, 1 tablet (20 mg) from 6 months, once daily × 14 days.
   ============================================================================ */
K.ill = K.ill || {};
K.ill.DIARR_PREVENT = [
  { icon: 'hand', en: 'Wash both hands with soap before preparing food, before feeding the child, after using the toilet and after cleaning the child’s stool. Follow the right way of handwashing.', or: 'ଖାଦ୍ୟ ତିଆରି କରିବା ପୂର୍ବରୁ, ଶିଶୁକୁ ଖୁଆଇବା ପୂର୍ବରୁ, ମଳତ୍ୟାଗ କରିବା ପରେ ଏବଂ ଶିଶୁର ମଳ ସଫା କରିବା ପରେ ଦୁଇ ହାତକୁ ଭଲ ଭାବେ ସାବୁନ ଲଗାଇ ଧୁଅନ୍ତୁ। ହାତ ଧୋଇବାର ସଠିକ୍ ପ୍ରଣାଳୀ ଅନୁସରଣ କରନ୍ତୁ।' },
  { icon: 'water', en: 'Keep drinking water clean and safe, in a covered container.', or: 'ପାନୀୟ ଜଳକୁ ସଫା, ସୁରକ୍ଷିତ ଏବଂ ଢାଙ୍କୁଣି ଥିବା ପାତ୍ରରେ ଘୋଡ଼ାଇ ରଖନ୍ତୁ।' },
  { icon: 'house', en: "Keep the child's surroundings clean and wash the child's hands often.", or: 'ଶିଶୁଟିର ପରିବେଶକୁ ସଫା ଓ ସ୍ୱଚ୍ଛ ରଖନ୍ତୁ ଏବଂ ଶିଶୁଟିର ହାତକୁ ବାରମ୍ବାର ଧୁଅନ୍ତୁ।' },
  { icon: 'shield', en: 'Always use a toilet; do not defecate in the open. Dispose of the child’s stool safely.', or: 'ସବୁ ସମୟରେ ପାଇଖାନା ବ୍ୟବହାର କରନ୍ତୁ ଏବଂ ଖୋଲାରେ ଶୌଚ କରନ୍ତୁ ନାହିଁ।' },
  { icon: 'syringe', en: 'Rotavirus vaccine (6, 10 and 14 weeks) protects against severe diarrhoea.', or: 'ରୋଟାଭାଇରସ୍ ଟୀକା (୬, ୧୦ ଓ ୧୪ ସପ୍ତାହ) ଗୁରୁତର ତରଳ ଝାଡ଼ାରୁ ସୁରକ୍ଷା ଦିଏ।' },
];
K.ill.DIARR_TREAT = [
  { icon: 'water', en: 'Mix 1 packet of ORS in 1 litre of clean drinking water.', or: '୧ ପ୍ୟାକେଟ୍ ଓଆର୍ଏସ୍ ଦ୍ରବଣକୁ ୧ ଲିଟର ପାନୀୟ ଜଳରେ ଭଲ ଭାବେ ଗୋଳାଇ ମିଶାଇ ଦିଅନ୍ତୁ।' },
  { icon: 'bottle', en: 'Give ORS as soon as diarrhoea starts and after every loose stool.', or: 'ତରଳ ଝାଡ଼ା ଆରମ୍ଭ ହେବା ମାତ୍ରେ ଏବଂ ପ୍ରତ୍ୟେକ ତରଳ ଝାଡ଼ା ପରେ ଶିଶୁକୁ ସଙ୍ଗେ ସଙ୍ଗେ ଓଆର୍ଏସ୍ ଦ୍ରବଣ ଦିଅନ୍ତୁ।' },
  { icon: 'pill', en: 'Zinc: ½ tablet for 2–6 months, 1 tablet from 6 months, dissolved in clean water or breast milk, once a day for 14 days — even after the diarrhoea stops.', or: '୨ ମାସରୁ ୬ ମାସର ଶିଶୁକୁ ଅଧା ବଟିକା ଏବଂ ୬ ମାସରୁ ଊର୍ଦ୍ଧ୍ୱ ଶିଶୁକୁ ଗୋଟିଏ ବଟିକା ଜିଙ୍କ୍, ବିଶୁଦ୍ଧ ଜଳ ବା ମା’ କ୍ଷୀରରେ ଗୋଳାଇ ଶିଶୁକୁ ଦିନକୁ ଥରେ ୧୪ ଦିନ ପର୍ଯ୍ୟନ୍ତ ଦିଅନ୍ତୁ।' },
  { icon: 'bowl', en: 'Keep feeding, including breastfeeding, during and after the diarrhoea.', or: 'ତରଳ ଝାଡ଼ା ସମୟରେ ବା ତରଳ ଝାଡ଼ା ହେବା ପରେ ଶିଶୁକୁ ଖୁଆଇବା ବା ସ୍ତନ୍ୟପାନ କରାଇବା ଜାରି ରଖନ୍ତୁ।' },
];
K.ill.PNEU_PREVENT = [
  { icon: 'sun', en: 'In winter keep children warm in woollen clothes and do not let them walk barefoot.', or: 'ଶୀତ ଦିନରେ ଶିଶୁଙ୍କୁ ଉଷୁମ ରଖିବା ପାଇଁ ଶୀତ ବସ୍ତ୍ରରେ ଘୋଡ଼ାଇ ରଖନ୍ତୁ ଓ ଖାଲି ପାଦରେ ଚାଲିବାକୁ ଦିଅନ୍ତୁ ନାହିଁ।' },
  { icon: 'baby', en: 'Do not keep a newborn without clothes.', or: 'ନବଜାତ ଶିଶୁଙ୍କୁ ଖୋଲା ଦେହରେ ରଖନ୍ତୁ ନାହିଁ।' },
  { icon: 'house', en: 'Cook on an LPG stove so that there is no smoke in the house.', or: 'ରୋଷେଇ କରିବା ପାଇଁ ଏଲ୍‌ପିଜି ଗ୍ୟାସ୍ ବ୍ୟବହାର କରନ୍ତୁ। ତା ଦ୍ୱାରା ଘରେ ଧୁଆଁ ହୋଇନଥାଏ।' },
  { icon: 'syringe', en: 'Give all doses of the PCV vaccine.', or: 'ପିସିଭି ଟୀକାର ନିୟମିତ ମାତ୍ରା ଦିଅନ୍ତୁ।' },
];
K.ill.PNEU_SIGNS = [
  { icon: 'lungs', en: 'Cough getting worse', or: 'ବହୁତ ଜୋର୍‌ରେ କାଶ ହେବା' },
  { icon: 'pulse', en: 'Fast breathing', or: 'ଶ୍ୱାସ କ୍ରିୟାର ଗତି ବଢ଼ିବା' },
  { icon: 'alert', en: 'Chest pulls in when breathing in', or: 'ନିଃଶ୍ୱାସ ନେଲାବେଳେ ଛାତି ଭିତରକୁ ପଶିବା' },
  { icon: 'temp', en: 'Fever', or: 'ଜ୍ୱର ହେବା' },
];
/* fast-breathing cut-off by age in months */
K.ill.fastCut = (ageMonths) => (ageMonths < 2 ? 60 : ageMonths < 12 ? 50 : 40);
K.ill.FAST_TEXT = [
  { en: 'Under 2 months: 60 or more breaths a minute', or: '୨ ମାସରୁ କମ୍ ବୟସର ଶିଶୁରେ ଶ୍ୱାସକ୍ରିୟାର ଗତି ମିନିଟ୍‌କୁ ୬୦ ବା ଅଧିକ' },
  { en: '2 months to 1 year: 50 or more breaths a minute', or: '୨ ମାସରୁ ୧ ବର୍ଷ ବୟସର ଶିଶୁରେ ଶ୍ୱାସକ୍ରିୟାର ଗତି ମିନିଟ୍‌କୁ ୫୦ ବା ଅଧିକ' },
  { en: '1 to 5 years: 40 or more breaths a minute', or: '୧ ବର୍ଷରୁ ୫ ବର୍ଷ ବୟସର ଶିଶୁରେ ଶ୍ୱାସକ୍ରିୟାର ଗତି ମିନିଟ୍‌କୁ ୪୦ ବା ଅଧିକ' },
];
K.ill.CONTACT = { en: 'At the first sign of diarrhoea or pneumonia, contact the ASHA or ANM at once.', or: 'ତରଳ ଝାଡ଼ା ବା ନିମୋନିଆର କୌଣସି ଲକ୍ଷଣ ଦେଖିବା ସଙ୍ଗେ ସଙ୍ଗେ ଆଶା ବା ମହିଳା ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।' };
/* IFA syrup for children 6–59 months (Anaemia Mukt Bharat; Odisha card p.39) */
K.ill.IFA_RULES = [
  { en: 'Give iron folic acid (IFA) syrup twice a week, on the fixed days.', or: 'ଆଇରନ୍ ଫଲିକ୍ ଏସିଡ୍ ସିରପ୍ ସପ୍ତାହକୁ ଦୁଇ ଥର, ନିର୍ଦ୍ଧାରିତ ଦିନରେ ଦିଅନ୍ତୁ।' },
  { en: 'Give 1 ml of IFA syrup with the auto-dispenser.', or: 'ଅଟୋ ଡିସ୍ପେନସର ବ୍ୟବହାର କରି ୧ ମି.ଲି. ଆଇ.ଏଫ୍.ଏ. ସିରପ୍ ଦିଅନ୍ତୁ।' },
  { en: 'If the child is sick or severely malnourished, give IFA syrup only as the doctor advises.', or: 'ଯଦି ଶିଶୁ ଅସୁସ୍ଥ ଥାଏ ବା ଅତିଶୟ ପୁଷ୍ଟିହୀନ ହୋଇଥାଏ ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ଅନୁଯାୟୀ ଆଇ.ଏଫ୍.ଏ ସିରପ୍ ଦିଅନ୍ତୁ।' },
  { en: 'Always give IFA syrup after food.', or: 'ଆଇ.ଏଫ୍.ଏ ସିରପ୍ ସର୍ବଦା ଖାଦ୍ୟ ଖାଇବା ପରେ ଦିଅନ୍ତୁ।' },
  { en: 'One 50 ml bottle lasts 6 months. When it is finished, ask your ASHA/ANM for a new bottle.', or: 'ଗୋଟିଏ ୫୦ ମି.ଲି. ଆଇ.ଏଫ୍.ଏ ସିରପ୍ ବୋତଲ ୬ ମାସ ଯାଇଥାଏ। ଏହା ସରିବା ମାତ୍ରେ ନିଜ ଆଶା/ଏ.ଏନ୍.ଏମ୍. ଦିଦିଙ୍କୁ ନୂଆ ବୋତଲ ମାଗନ୍ତୁ।' },
  { en: 'Tick each dose after giving it.', or: 'ଗୋଟିଏ ଆଇ.ଏଫ୍.ଏ ସିରପ୍ ଦେବା ପରେ ଗୋଟିଏ ଚିହ୍ନ ଲଗାନ୍ତୁ।' },
  { en: 'If there is any problem after the syrup, contact your ANM at once.', or: 'ଯଦି ସିରପ୍ ଖାଇବା ପରେ କୌଣସି ସମସ୍ୟା ହୋଇଥାଏ, ତୁରନ୍ତ ନିଜ ଏ.ଏନ୍.ଏମ୍. ଦିଦିଙ୍କୁ ଯୋଗାଯୋଗ କରନ୍ତୁ।' },
];
