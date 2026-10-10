/* ============================================================================
   data/51-feed — infant and young child feeding by age.
   Sources: Odisha MCP card V-2023-24 pp.6–8 (Odia), national MCP card 2018
   pp.10–11 (English). Amounts per meal follow the HBYC table on the same
   Odisha card (p.7) and the national card, which agree with India's IYCF
   guidance (6 m: 2–3 spoons; 9 m: ½ katori; 12–24 m: ¾–1 katori). The Odisha
   feeding page says "¾ katori after 9 months"; that line is left out so the
   card's two pages do not contradict each other — flagged for review.
   1 katori = 250 ml.
   ============================================================================ */
K.feed = K.feed || {};
K.feed.STAGES = [
  {
    k: 'ebf', from: 0, to: 6, icon: 'heart',
    name: { en: 'Birth to 6 months', or: 'ଜନ୍ମରୁ ୬ ମାସ' },
    head: { en: 'Early and only breastfeeding', or: 'ଯଥା ଶୀଘ୍ର ସମ୍ଭବ ଓ କେବଳ ସ୍ତନ୍ୟପାନ' },
    amount: { en: 'Only breast milk, day and night, as often as the baby wants', or: 'କେବଳ ମା’ କ୍ଷୀର, ଦିନ ଓ ରାତି, ଶିଶୁ ଯେତେବେଳେ ଚାହିଁବ' },
    items: [
      { en: 'Put the baby to the breast within 1 hour of birth. It helps breastfeeding succeed and builds the bond between mother and baby.', or: 'ଜନ୍ମ ପରେ ଯେତେଶୀଘ୍ର ସମ୍ଭବ ୧ ଘଣ୍ଟା ମଧ୍ୟରେ ଶିଶୁକୁ ସ୍ତନ୍ୟପାନ କରାନ୍ତୁ। ଏହା ସ୍ତନ୍ୟପାନକୁ ସଫଳ କରିବା ସହିତ ମା’ ଓ ଶିଶୁ ମଧ୍ୟରେ ଆବେଗିକ ସମ୍ପର୍କ ସ୍ଥାପନ କରେ।' },
      { en: "The mother's first yellow milk builds the baby's immunity and protects from diseases and infections.", or: 'ମା’ର ପ୍ରଥମ ହଳଦିଆ କ୍ଷୀର ଶିଶୁର ରୋଗ ପ୍ରତିରୋଧକାରୀ ଶକ୍ତି ବଢ଼ାଏ ଓ ଶିଶୁକୁ ବିଭିନ୍ନ ରୋଗ ଓ ସଂକ୍ରମଣରୁ ରକ୍ଷା କରେ।' },
      { en: 'Breast milk has all the nutrients and enough water. Until 6 months give only breast milk — nothing else to eat or drink.', or: 'ମା’ କ୍ଷୀରରେ ସମସ୍ତ ଖାଦ୍ୟସାର ଓ ଯଥେଷ୍ଟ ପାଣି ଥାଏ। ଶିଶୁକୁ ୬ ମାସ ପୁରିବା ପର୍ଯ୍ୟନ୍ତ କେବଳ ସ୍ତନ୍ୟପାନ କରାନ୍ତୁ। ସ୍ତନ୍ୟପାନ ଛଡ଼ା କୌଣସି ଖାଦ୍ୟ ଓ ପାନୀୟ ଦିଅନ୍ତୁ ନାହିଁ।' },
      { en: 'No honey, no other milk, no water, and nothing from a bottle or bowl.', or: 'ମହୁ, ଅନ୍ୟ କ୍ଷୀର, ପାଣି ବା ବୋତଲ / ଗିନାରେ କିଛି ଦିଅନ୍ତୁ ନାହିଁ।' },
      { en: 'Breastfeed whenever the baby wants, day and night. Frequent feeding makes more milk. Do not forget night feeds.', or: 'ଶିଶୁଟିକୁ ଦିନ ଓ ରାତି ଯେତେବେଳେ ଚାହିଁବ ସ୍ତନ୍ୟପାନ କରାନ୍ତୁ। ବାରମ୍ବାର ସ୍ତନ୍ୟପାନ କରାଇବା ଦ୍ୱାରା ମା’ର ଅଧିକ କ୍ଷୀର କ୍ଷରଣ ହୋଇଥାଏ। ରାତିରେ ସ୍ତନ୍ୟପାନ କରାଇବାକୁ ଭୁଲନ୍ତୁ ନାହିଁ।' },
      { en: "While feeding, hold the baby close to your body, look into the baby's eyes, smile and talk. Do not rock the baby while feeding.", or: 'ସ୍ତନ୍ୟପାନ କରାଇବା ସମୟରେ ନିଜ ଦେହ ସହିତ ଶିଶୁକୁ ଲଗାଇ ରଖନ୍ତୁ ଏବଂ ଶିଶୁର ଆଖି ସହିତ ଆଖି ମିଳାଇ ହସନ୍ତୁ, କଥା କୁହନ୍ତୁ। ସ୍ତନ୍ୟପାନ କରାଇବା ସମୟରେ ଶିଶୁକୁ ଝୁଲାନ୍ତୁ ନାହିଁ।' },
      { en: 'Good attachment: most of the dark part around the nipple is inside the baby’s mouth, and more of it shows above the mouth than below.', or: 'ସ୍ତନର ଅଗ୍ରଭାଗରେ ଥିବା କଳା ଅଂଶର ଅଧିକ ଭାଗ ପାଟି ଭିତରେ ରହିଛି ଏବଂ କଳା ଅଂଶର ତଳ ଭାଗଠାରୁ ଉପର ଭାଗ ଅଧିକ ଦେଖାଯାଉଛି।' },
      { en: 'Even when the baby is ill, give only breast milk until 6 months.', or: 'ଶିଶୁକୁ ଅସୁସ୍ଥତା ସମୟରେ ମଧ୍ୟ ୬ ମାସ ପର୍ଯ୍ୟନ୍ତ କେବଳ ସ୍ତନ୍ୟପାନ କରାନ୍ତୁ।' },
      { en: 'Breastfeeding makes children brighter.', or: 'ସ୍ତନ୍ୟପାନ ଶିଶୁକୁ ବୁଦ୍ଧିଆ କରାଏ।' },
      { en: 'Any difficulty with breastfeeding: talk to your ASHA, Anganwadi worker or ANM.', or: 'ସ୍ତନ୍ୟପାନ କରାଇବାରେ କୌଣସି ଅସୁବିଧା ହେଲେ ନିଜ ଅଞ୍ଚଳରେ ଥିବା ଆଶା, ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ ଓ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀ ସହିତ ସଂପର୍କ କରନ୍ତୁ।' },
    ],
  },
  {
    k: 'm6', from: 6, to: 7, icon: 'bowl',
    name: { en: 'At 6 months', or: '୬ ମାସ ପୂରଣ ହେଲେ' },
    head: { en: 'Start soft home-made food, keep breastfeeding', or: 'ସ୍ତନ୍ୟପାନ ସହିତ ଘରେ ତିଆରି ନରମ ଖାଦ୍ୟ ଆରମ୍ଭ କରନ୍ତୁ' },
    amount: { en: '2–3 spoons of soft, mashed food, 2–3 times a day', or: 'ଦିନକୁ ୨-୩ ଥର ୨-୩ ଚାମଚ ନରମ, ଚକଟା ଖାଦ୍ୟ' },
    items: [
      { en: 'Continue breastfeeding.', or: 'ସ୍ତନ୍ୟପାନ ଚାଲୁ ରଖନ୍ତୁ।' },
      { en: 'When 6 months are complete, give 2–3 spoons of soft, well-mashed food 2–3 times a day.', or: '୬ ମାସ ପରେ ଦିନକୁ ୨-୩ ଥର ୨-୩ ଚାମଚ ନରମ, ଚକଟା ଖାଦ୍ୟ ଦିଅନ୍ତୁ।' },
      { en: 'Start one food at a time: cereals and dal, with fruits and vegetables.', or: 'ଗୋଟିଏ ଥରରେ ଗୋଟିଏ ପ୍ରକାର ଖାଦ୍ୟ ଦିଅନ୍ତୁ। ଶସ୍ୟ, ଡାଲି ସହିତ ଫଳ ଓ ପନିପରିବା ଖାଇବାକୁ ଦିଅନ୍ତୁ।' },
      { en: 'Increase the amount slowly.', or: 'ଧୀରେ ଧୀରେ ଖାଦ୍ୟର ପରିମାଣ ବଢ଼ାନ୍ତୁ।' },
      { en: 'Give iron (IFA) syrup to keep the child healthy and help the brain grow.', or: 'ଶିଶୁକୁ ସୁସ୍ଥ ରଖିବା ସହିତ ବୁଦ୍ଧିର ବିକାଶ ପାଇଁ ଲୌହସାର ଦ୍ରବଣ ଖାଇବାକୁ ଦିଅନ୍ତୁ।' },
    ],
  },
  {
    k: 'm7', from: 7, to: 9, icon: 'bowl',
    name: { en: '7–9 months', or: '୭ ରୁ ୯ ମାସ' },
    head: { en: 'Thicker food, more often, more variety', or: 'ଅଧିକ ବହଳିଆ ଖାଦ୍ୟ, ଅଧିକ ଥର, ଅଧିକ ପ୍ରକାର' },
    amount: { en: '3 meals and 1 snack a day; by 9 months ½ katori a meal', or: 'ଦିନକୁ ୩ଥର ମୁଖ୍ୟ ଖାଦ୍ୟ ସହ ୧ ଥର ଜଳଖିଆ; ୯ ମାସ ବେଳକୁ ଥରକରେ ୧/୨ ଗିନା' },
    items: [
      { en: 'Continue breastfeeding.', or: 'ସ୍ତନ୍ୟପାନ ଚାଲୁ ରଖନ୍ତୁ।' },
      { en: 'Make the food thicker and give it 3–4 times a day: 3 meals and 1 snack.', or: 'ଖାଦ୍ୟକୁ ଅଧିକ ବହଳିଆ କରି ଦିନକୁ ୩-୪ଥର ଖାଇବାକୁ ଦିଅନ୍ତୁ। ୩ଥର ମୁଖ୍ୟ ଖାଦ୍ୟ ସହ ୧ ଥର ଜଳଖିଆ ଦିଅନ୍ତୁ।' },
      { en: 'By 9 months, give ½ katori of food at a time.', or: '୯ ମାସ ବେଳକୁ ଶିଶୁକୁ ୧/୨ ଗିନା ଖାଦ୍ୟ ଦିଅନ୍ତୁ।' },
      { en: 'Increase the amount and give many kinds of food. Try new dishes such as khichdi and upma.', or: 'ଖାଦ୍ୟର ପରିମାଣ ବଢ଼ାଇବା ସହିତ ବିଭିନ୍ନ ପ୍ରକାର ଖାଦ୍ୟ ଖାଇବାକୁ ଦିଅନ୍ତୁ। ନୂଆ ନୂଆ ଖାଦ୍ୟ ତିଆରି କରି ଦିଅନ୍ତୁ ଯେପରି ଖେଚୁଡ଼ି, ଉପମା ଇତ୍ୟାଦି।' },
      { en: 'Give at least 4 food groups: 1. cereals; 2. dal, fish, egg; 3. vegetables and fruits; 4. oil, ghee.', or: 'ଅତି କମ୍‌ରେ ୪ ପ୍ରକାର ଖାଦ୍ୟ ଦିଅନ୍ତୁ: ୧- ଶସ୍ୟ, ୨- ଡାଲି, ମାଛ, ଅଣ୍ଡା, ୩- ପନିପରିବା ଓ ଫଳ, ୪- ତେଲ, ଘିଅ।' },
      { en: 'Give iron (IFA) syrup.', or: 'ଲୌହସାର ଦ୍ରବଣ ଖାଇବାକୁ ଦିଅନ୍ତୁ।' },
    ],
  },
  {
    k: 'm9', from: 9, to: 12, icon: 'bowl',
    name: { en: '9–12 months', or: '୯ ରୁ ୧୨ ମାସ' },
    head: { en: 'Food the child can chew and pick up', or: 'ଚୋବାଇ ଖାଇବା ଓ ଆଙ୍ଗୁଠିରେ ଧରି ଖାଇବା ଭଳି ଖାଦ୍ୟ' },
    amount: { en: '½ katori a meal, 3–4 times a day, with 1–2 snacks', or: 'ଥରକରେ ୧/୨ ଗିନା, ଦିନକୁ ୩-୪ଥର, ୧-୨ ଥର ଜଳଖିଆ' },
    items: [
      { en: 'Continue breastfeeding.', or: 'ସ୍ତନ୍ୟପାନ ଚାଲୁ ରଖନ୍ତୁ।' },
      { en: 'Give at least ½ katori of food that needs chewing, 3–4 times a day, with 1–2 snacks.', or: 'ଅତି କମ୍‌ରେ ୧/୨ ଗିନା ଚୋବାଇ ଖାଇବା ଭଳି ଖାଦ୍ୟ ଦିନକୁ ୩-୪ଥର ଓ ୧-୨ ଥର ଜଳଖିଆ ଦିଅନ୍ତୁ।' },
      { en: 'Give food the child can pick up with the fingers. Let the child eat by hand, even if it is messy.', or: 'ଶିଶୁ ଆଙ୍ଗୁଠିରେ ଧରି ପାରୁଥିବା ଖାଦ୍ୟ ଖାଇବାକୁ ଦିଅନ୍ତୁ। ଶିଶୁ ନଷ୍ଟ କଲେ ମଧ୍ୟ ତାକୁ ନିଜ ହାତରେ ଖାଇବାକୁ ଉତ୍ସାହିତ କରନ୍ତୁ।' },
      { en: 'Vitamin A syrup (at 9 months) helps eyesight.', or: 'ଦୃଷ୍ଟିଶକ୍ତିର ଉନ୍ନତି ପାଇଁ ଖାଦ୍ୟ ପ୍ରାଣ ‘କ’ ଦ୍ରବଣ ଖାଇବାକୁ ଦିଅନ୍ତୁ।' },
      { en: 'Give iron (IFA) syrup.', or: 'ଲୌହସାର ଦ୍ରବଣ ଖାଇବାକୁ ଦିଅନ୍ତୁ।' },
    ],
  },
  {
    k: 'm12', from: 12, to: 60, icon: 'bowl',
    name: { en: '1 year and older', or: '୧ ବର୍ଷ ଓ ଅଧିକ' },
    head: { en: 'Family food, and breastfeeding to 2 years and beyond', or: 'ଘରର ସବୁ ଖାଦ୍ୟ, ଓ ୨ ବର୍ଷ ଓ ତଦୁର୍ଦ୍ଧ୍ୱ ପର୍ଯ୍ୟନ୍ତ ସ୍ତନ୍ୟପାନ' },
    amount: { en: '¾ to 1 katori a meal, 3–4 times a day, with 1–2 snacks', or: 'ଥରକରେ ୩/୪-୧ ଗିନା, ଦିନକୁ ୩-୪ଥର, ୧-୨ ଥର ଜଳଖିଆ' },
    items: [
      { en: 'Keep breastfeeding until 2 years and beyond, along with home-cooked food.', or: '୨ ବର୍ଷ ଓ ତଦୁର୍ଦ୍ଧ୍ୱ ବୟସ ପର୍ଯ୍ୟନ୍ତ ସ୍ତନ୍ୟପାନ ଜାରି ରଖିବା ସହିତ ଘର ତିଆରି ରନ୍ଧା ଖାଦ୍ୟ ଖାଇବାକୁ ଦିଅନ୍ତୁ।' },
      { en: 'After 12 months, give all the foods cooked at home for the family.', or: '୧୨ ମାସ ପରେ ଘରେ ତିଆରି ହେଉଥିବା ସମସ୍ତ ଖାଦ୍ୟ ଦିଅନ୍ତୁ।' },
      { en: '¾ to 1 katori at a time, 3–4 times a day, with 1–2 snacks.', or: 'ଥରକରେ ୩/୪-୧ ଗିନା ଖାଦ୍ୟ, ଦିନକୁ ୩-୪ଥର, ୧-୨ ଥର ଜଳଖିଆ ଦିଅନ୍ତୁ।' },
      { en: 'Let the child eat by hand, even if it is messy.', or: 'ଶିଶୁ ନଷ୍ଟ କଲେ ମଧ୍ୟ ତାକୁ ନିଜ ହାତରେ ଖାଇବାକୁ ଉତ୍ସାହିତ କରନ୍ତୁ।' },
      { en: 'Vitamin A every 6 months and deworming tablets as scheduled.', or: 'ପ୍ରତି ୬ ମାସରେ ଭିଟାମିନ୍ ‘ଏ’ ଓ ସମୟ ଅନୁସାରେ କୃମିନାଶକ ବଟିକା ଦିଅନ୍ତୁ।' },
      { en: 'Give iron (IFA) syrup.', or: 'ଲୌହସାର ଦ୍ରବଣ ଖାଇବାକୁ ଦିଅନ୍ତୁ।' },
    ],
  },
];
K.feed.GENERAL = [
  { en: 'Talk, smile and be patient to encourage the child to eat.', or: 'ଶିଶୁ ସହିତ କଥା କହି, ହସାଇ, ଧୈର୍ଯ୍ୟର ସହିତ ଶିଶୁକୁ ଖୁଆନ୍ତୁ।' },
  { en: 'Wash your hands with soap before preparing food and before feeding the child.', or: 'ଖାଦ୍ୟ ପ୍ରସ୍ତୁତ କରିବା ପୂର୍ବରୁ ଓ ଶିଶୁକୁ ଖୁଆଇବା ପୂର୍ବରୁ ହାତକୁ ସାବୁନରେ ଭଲ ଭାବେ ଧୁଅନ୍ତୁ।' },
  { en: 'If you give eggs, cook them well.', or: 'ଅଣ୍ଡା ଖୁଆଉଥିଲେ ଭଲ ଭାବରେ ରାନ୍ଧି ଖୁଆନ୍ତୁ।' },
  { en: 'Wash vegetables and fruits well in water before cooking or eating.', or: 'ରାନ୍ଧିବା / ଖାଇବା ପୂର୍ବରୁ ପନିପରିବା ଓ ଫଳକୁ ପାଣିରେ ଭଲ ଭାବେ ଧୁଅନ୍ତୁ।' },
  { en: "Cook well with clean water. Throw away food left on the child's plate.", or: 'ସଫା ପାଣିରେ ଭଲ ଭାବରେ ରାନ୍ଧନ୍ତୁ। ଶିଶୁର ବଳକା ଖାଦ୍ୟ ଫିଙ୍ଗି ଦିଅନ୍ତୁ।' },
  { en: 'Use only iodised salt; iodine helps the brain develop.', or: 'ଆୟୋଡିନ ଯୁକ୍ତ ଲୁଣ ବ୍ୟବହାର କରନ୍ତୁ। ଏହା ବୁଦ୍ଧିର ବିକାଶ କରାଏ।' },
  { en: '1 katori = 250 ml.', or: '୧ ଗିନା = ୨୫୦ ମି.ଲି.' },
];
/* Odisha card p.6, printed under the breastfeeding page */
K.feed.NO_BRAND = { en: 'Never brand (chenk) a child, whatever the illness. Branding harms the child and can kill.', or: 'କୌଣସି ପରିସ୍ଥିତିରେ ପିଲାଙ୍କୁ ଚେଙ୍କ ଦିଅନ୍ତୁ ନାହିଁ। ଚେଙ୍କ ପିଲାର ଜୀବନପ୍ରତି କ୍ଷତିକାରକ।' };
K.feed.LEAD = { en: 'Feeding, playing and talking with children helps them grow in body and mind.', or: 'ପିଲାମାନଙ୍କ ସହିତ ଖାଇବା, ଖେଳିବା ଓ କଥାବାର୍ତ୍ତା କରିବା ଦ୍ୱାରା ସେମାନଙ୍କର ଶାରୀରିକ ଓ ବୌଦ୍ଧିକ ବିକାଶ ହୋଇଥାଏ।' };
