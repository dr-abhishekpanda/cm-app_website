/* ============================================================================
   modules/80-tools — calculators for health workers (and curious parents).
   Nothing here is saved. Each tool cites its source at the bottom.
   - EDD / gestational age (Naegele: LMP + 280 days; or ultrasound dating)
   - High-risk quick check (Odisha MCP card V-2023-24 list, modules/22-hrp)
   - Anaemia: Anaemia Mukt Bharat Abhiyaan operational guidelines (MoHFW,
     June 2026). Hb cut-offs = WHO 2024 (§4.1): 6–23 m and 2nd-trimester
     pregnancy lowered to 10.5. Treatment (ch.4): 6–59 m IFA syrup 3 mg/kg/day
     by weight band 1 / 1.5 / 2 ml × 3 months; 5–9 y 1 pink tablet daily × 3 m;
     10–19 y 1 blue tablet daily × 3 m; women 20–49 y 1 red tablet daily × 3 m;
     breastfeeding (≤6 m after delivery) 2 red daily × 3 m; pregnancy mild /
     moderate 2 red daily, recheck at 1 month (IV iron sucrose ×5 or FCM ×2 for
     moderate as the doctor advises, after the 1st trimester). Recheck: severe
     1 m, moderate 2 m, mild 3 m. Severe → FRU/DH; Hb < 5 → transfusion.
   - Vaccine due dates (data/30-vaccines), growth z-scores (modules/50-growth),
     corrected age, ORS/zinc (WHO/IMNCI plans A and B), IFA/deworming doses (AMB).
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'tools.title': { en: 'Tools', or: 'ଉପକରଣ' },
  'tools.lede': { en: 'Quick calculators. Nothing you type here is saved.', or: 'ଶୀଘ୍ର ହିସାବ। ଏଠାରେ ଲେଖିଥିବା କିଛି ସେଭ୍ ହୁଏ ନାହିଁ।' },
  'tools.g.preg': { en: 'Pregnancy', or: 'ଗର୍ଭାବସ୍ଥା' }, 'tools.g.child': { en: 'Child', or: 'ଶିଶୁ' },
  'tools.src': { en: 'Source', or: 'ଉତ୍ସ' },
  'tools.result': { en: 'Result', or: 'ଫଳାଫଳ' },
  'tools.hcpNote': { en: 'For health workers. Follow the treating doctor where advice differs.', or: 'ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ପାଇଁ। ଭିନ୍ନ ପରାମର୍ଶ ଥିଲେ ଚିକିତ୍ସକଙ୍କ ପରାମର୍ଶ ମାନନ୍ତୁ।' },
  /* tool names */
  'tl.edd': { en: 'Due date and weeks', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ ଓ ସପ୍ତାହ' }, 'tl.eddSub': { en: 'From the last period or an ultrasound', or: 'ଶେଷ ଋତୁସ୍ରାବ ବା ଅଲ୍ଟ୍ରାସାଉଣ୍ଡରୁ' },
  'tl.hrp': { en: 'High-risk quick check', or: 'ବିପଦସଙ୍କୁଳ ଗର୍ଭ ଶୀଘ୍ର ଯାଞ୍ଚ' }, 'tl.hrpSub': { en: 'The Odisha MCP card list', or: 'ଓଡ଼ିଶା MCP କାର୍ଡ ତାଲିକା' },
  'tl.anaemia': { en: 'Anaemia: Hb and treatment', or: 'ରକ୍ତହୀନତା: ହିମୋଗ୍ଲୋବିନ୍ ଓ ଚିକିତ୍ସା' }, 'tl.anaemiaSub': { en: 'WHO cut-offs, Anaemia Mukt Bharat doses', or: 'WHO ମାନ, ଆନେମିଆ ମୁକ୍ତ ଭାରତ ମାତ୍ରା' },
  'tl.vax': { en: 'Vaccine due dates', or: 'ଟୀକା ତାରିଖ' }, 'tl.vaxSub': { en: 'The full schedule from a date of birth', or: 'ଜନ୍ମ ତାରିଖରୁ ସମ୍ପୂର୍ଣ୍ଣ ସୂଚୀ' },
  'tl.z': { en: 'Growth z-scores', or: 'ବୃଦ୍ଧି z-ସ୍କୋର' }, 'tl.zSub': { en: 'WHO standards, SAM and MAM', or: 'WHO ମାନକ, SAM ଓ MAM' },
  'tl.corrected': { en: 'Corrected age', or: 'ସଂଶୋଧିତ ବୟସ' }, 'tl.correctedSub': { en: 'For babies born early', or: 'ସମୟ ପୂର୍ବରୁ ଜନ୍ମିତ ଶିଶୁ ପାଇଁ' },
  'tl.breath': { en: 'Breath counter', or: 'ଶ୍ୱାସ ଗଣନା' }, 'tl.breathSub': { en: 'Fast breathing check', or: 'ଦ୍ରୁତ ଶ୍ୱାସ ଯାଞ୍ଚ' },
  'tl.ors': { en: 'Diarrhoea: ORS and zinc', or: 'ତରଳ ଝାଡ଼ା: ଓଆର୍ଏସ୍ ଓ ଜିଙ୍କ୍' }, 'tl.orsSub': { en: 'Dehydration check and amounts', or: 'ଜଳୀୟ ଅଭାବ ଯାଞ୍ଚ ଓ ପରିମାଣ' },
  'tl.ifa': { en: 'IFA and deworming doses', or: 'ଆଇ.ଏଫ୍.ଏ. ଓ କୃମିନାଶକ ମାତ୍ରା' }, 'tl.ifaSub': { en: 'Anaemia Mukt Bharat schedule by age', or: 'ବୟସ ଅନୁସାରେ ଆନେମିଆ ମୁକ୍ତ ଭାରତ ସୂଚୀ' },
  /* EDD */
  'edd.basis': { en: 'Work out from', or: 'କେଉଁଥିରୁ ହିସାବ' }, 'edd.b.lmp': { en: 'Last period (LMP)', or: 'ଶେଷ ଋତୁସ୍ରାବ (LMP)' }, 'edd.b.usg': { en: 'Ultrasound', or: 'ଅଲ୍ଟ୍ରାସାଉଣ୍ଡ' }, 'edd.b.edd': { en: 'Known due date', or: 'ଜଣାଥିବା ପ୍ରସବ ତାରିଖ' },
  'edd.lmp': { en: 'First day of the last period', or: 'ଶେଷ ଋତୁସ୍ରାବର ପ୍ରଥମ ଦିନ' },
  'edd.usgDate': { en: 'Date of the scan', or: 'ସ୍କାନ୍ ତାରିଖ' }, 'edd.usgW': { en: 'Weeks on the scan', or: 'ସ୍କାନ୍‌ରେ ସପ୍ତାହ' }, 'edd.usgD': { en: 'Days', or: 'ଦିନ' },
  'edd.edd': { en: 'Expected date of delivery', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ' },
  'edd.today': { en: 'Weeks today', or: 'ଆଜି ଗର୍ଭର ସପ୍ତାହ' },
  'edd.lmpEq': { en: 'LMP (worked back)', or: 'ଶେଷ ଋତୁସ୍ରାବ (ହିସାବ)' },
  'edd.keys': { en: 'Key dates', or: 'ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ତାରିଖ' },
  'edd.k12': { en: 'End of the first 3 months: first check-up by now', or: 'ପ୍ରଥମ ତ୍ରୟମାସ ଶେଷ: ପ୍ରଥମ ପରୀକ୍ଷା ଏହା ମଧ୍ୟରେ' },
  'edd.k14': { en: 'Start IFA and calcium; albendazole after this', or: 'ଆଇ.ଏଫ୍.ଏ. ଓ କ୍ୟାଲସିୟମ୍ ଆରମ୍ଭ; ଏହା ପରେ କୃମିନାଶକ' },
  'edd.k24': { en: 'Sugar test (OGTT) at 24–28 weeks', or: '୨୪–୨୮ ସପ୍ତାହରେ ଶର୍କରା ପରୀକ୍ଷା (OGTT)' },
  'edd.k28': { en: 'Third trimester begins; check-up at 28–34 weeks', or: 'ତୃତୀୟ ତ୍ରୟମାସ ଆରମ୍ଭ; ୨୮–୩୪ ସପ୍ତାହରେ ପରୀକ୍ଷା' },
  'edd.k36': { en: 'Check-up at 36 weeks; birth plan and bag ready', or: '୩୬ ସପ୍ତାହରେ ପରୀକ୍ଷା; ପ୍ରସବ ଯୋଜନା ଓ ବ୍ୟାଗ୍ ପ୍ରସ୍ତୁତ' },
  'edd.k37': { en: 'Full term', or: 'ପୂର୍ଣ୍ଣ ସମୟ' },
  'edd.k40': { en: 'Expected date of delivery', or: 'ସମ୍ଭାବ୍ୟ ପ୍ରସବ ତାରିଖ' },
  'edd.k41': { en: 'Not delivered by now: go to the hospital (high risk)', or: 'ଏପର୍ଯ୍ୟନ୍ତ ପ୍ରସବ ହୋଇନଥିଲେ ଡାକ୍ତରଖାନା ଯାଆନ୍ତୁ (ବିପଦସଙ୍କୁଳ)' },
  'edd.pmsma': { en: 'Next PMSMA (doctor check-up on the 9th)', or: 'ପରବର୍ତ୍ତୀ PMSMA (୯ ତାରିଖରେ ଡାକ୍ତରୀ ପରୀକ୍ଷା)' },
  'edd.bad': { en: 'These dates do not fit a current pregnancy (more than 44 weeks, or in the future). Check the date.', or: 'ଏହି ତାରିଖ ବର୍ତ୍ତମାନର ଗର୍ଭ ସହ ମେଳ ଖାଉନାହିଁ (୪୪ ସପ୍ତାହରୁ ଅଧିକ ବା ଭବିଷ୍ୟତ)। ତାରିଖ ଯାଞ୍ଚ କରନ୍ତୁ।' },
  'edd.usgNote': { en: 'If the LMP is known too, enter it: the scan replaces the LMP date only when the two differ by more than 5 days (scan before 9 weeks), 7 days (9–15 weeks), 10 days (16–21 weeks), 14 days (22–27 weeks) or 21 days (28 weeks or later).', or: 'LMP ମଧ୍ୟ ଜଣାଥିଲେ ଦିଅନ୍ତୁ: ଦୁହିଁଙ୍କ ମଧ୍ୟରେ ପାର୍ଥକ୍ୟ ୫ ଦିନ (୯ ସପ୍ତାହ ପୂର୍ବର ସ୍କାନ୍), ୭ ଦିନ (୯–୧୫ ସପ୍ତାହ), ୧୦ ଦିନ (୧୬–୨୧ ସପ୍ତାହ), ୧୪ ଦିନ (୨୨–୨୭ ସପ୍ତାହ) ବା ୨୧ ଦିନ (୨୮ ସପ୍ତାହ ବା ପରେ) ରୁ ଅଧିକ ହେଲେ ହିଁ ସ୍କାନ୍ ତାରିଖ ବ୍ୟବହାର ହୁଏ।' },
  'edd.lmpOpt': { en: 'First day of the last period, if known', or: 'ଶେଷ ଋତୁସ୍ରାବର ପ୍ରଥମ ଦିନ, ଜଣାଥିଲେ' },
  /* HRP */
  'thrp.lede': { en: 'Answer what you know. One "yes" makes the pregnancy high-risk. Nothing is saved — use the card\'s own high-risk check to record it.', or: 'ଜାଣିଥିବା ଉତ୍ତର ଦିଅନ୍ତୁ। ଗୋଟିଏ “ହଁ” ଥିଲେ ଗର୍ଭ ବିପଦସଙ୍କୁଳ। ଏଠାରେ କିଛି ସେଭ୍ ହୁଏ ନାହିଁ।' },
  'thrp.none': { en: 'No high-risk condition among the answers given. Check again at every visit.', or: 'ଦିଆଯାଇଥିବା ଉତ୍ତରରେ କୌଣସି ବିପଦସଙ୍କୁଳ ଅବସ୍ଥା ନାହିଁ। ପ୍ରତ୍ୟେକ ପରିଦର୍ଶନରେ ପୁଣି ଯାଞ୍ଚ କରନ୍ତୁ।' },
  'thrp.clear': { en: 'Clear answers', or: 'ଉତ୍ତର ହଟାନ୍ତୁ' },
  /* anaemia */
  'an.group': { en: 'Who', or: 'କିଏ' },
  'an.g.c6': { en: 'Child 6–59 months', or: 'ଶିଶୁ ୬–୫୯ ମାସ' }, 'an.g.c5': { en: 'Child 5–9 years', or: 'ପିଲା ୫–୯ ବର୍ଷ' }, 'an.g.a': { en: 'Adolescent 10–19 years', or: 'କିଶୋର/କିଶୋରୀ ୧୦–୧୯ ବର୍ଷ' },
  'an.g.p': { en: 'Pregnant woman', or: 'ଗର୍ଭବତୀ ମହିଳା' }, 'an.g.l': { en: 'Breastfeeding mother (up to 6 months after delivery)', or: 'ସ୍ତନ୍ୟପାନ କରାଉଥିବା ମା\' (ପ୍ରସବର ୬ ମାସ ପର୍ଯ୍ୟନ୍ତ)' },
  'an.g.w': { en: 'Woman 20–49 years, not pregnant', or: 'ମହିଳା ୨୦–୪୯ ବର୍ଷ, ଗର୍ଭବତୀ ନୁହଁନ୍ତି' }, 'an.g.m': { en: 'Man 15 years and over', or: 'ପୁରୁଷ ୧୫ ବର୍ଷ ଓ ଅଧିକ' },
  'an.cAge': { en: 'Age', or: 'ବୟସ' }, 'an.c.623': { en: '6–23 months', or: '୬–୨୩ ମାସ' }, 'an.c.2459': { en: '24–59 months', or: '୨୪–୫୯ ମାସ' },
  'an.ageA': { en: 'Age and sex', or: 'ବୟସ ଓ ଲିଙ୍ଗ' }, 'an.a.1011': { en: '10–11 years', or: '୧୦–୧୧ ବର୍ଷ' }, 'an.a.1214': { en: '12–14 years', or: '୧୨–୧୪ ବର୍ଷ' }, 'an.a.g15': { en: 'Girl 15–19', or: 'କିଶୋରୀ ୧୫–୧୯' }, 'an.a.b15': { en: 'Boy 15–19', or: 'କିଶୋର ୧୫–୧୯' },
  'an.hb': { en: 'Haemoglobin', or: 'ହିମୋଗ୍ଲୋବିନ୍' }, 'an.wt': { en: 'Weight', or: 'ଓଜନ' }, 'an.ga': { en: 'Weeks of pregnancy', or: 'ଗର୍ଭର ସପ୍ତାହ' },
  'an.gaNeed': { en: 'Enter the weeks: in the 2nd trimester (14–27 weeks) anaemia starts below 10.5 g/dl instead of 11.', or: 'ସପ୍ତାହ ଦିଅନ୍ତୁ: ଦ୍ୱିତୀୟ ତ୍ରୟମାସରେ (୧୪–୨୭ ସପ୍ତାହ) ୧୧ ବଦଳରେ ୧୦.୫ g/dl ରୁ କମ୍ ହେଲେ ରକ୍ତହୀନତା।' },
  'an.none': { en: 'No anaemia', or: 'ରକ୍ତହୀନତା ନାହିଁ' }, 'an.mild': { en: 'Mild anaemia', or: 'ମୃଦୁ ରକ୍ତହୀନତା' }, 'an.moderate': { en: 'Moderate anaemia', or: 'ମଧ୍ୟମ ରକ୍ତହୀନତା' }, 'an.severe': { en: 'Severe anaemia', or: 'ଗୁରୁତର ରକ୍ତହୀନତା' },
  'an.cut': { en: 'WHO 2024 cut-offs for this group (g/dl): no anaemia ≥{n}; mild {mi}; moderate {mo}; severe <{s}', or: 'ଏହି ଗୋଷ୍ଠୀ ପାଇଁ WHO ୨୦୨୪ ମାନ (g/dl): ରକ୍ତହୀନତା ନାହିଁ ≥{n}; ମୃଦୁ {mi}; ମଧ୍ୟମ {mo}; ଗୁରୁତର <{s}' },
  'an.treat': { en: 'Treatment (Anaemia Mukt Bharat)', or: 'ଚିକିତ୍ସା (ଆନେମିଆ ମୁକ୍ତ ଭାରତ)' },
  'an.c6.dose': { en: 'IFA syrup {ml} ml once a day for 3 months ({mg} mg elemental iron a day; the syrup has 20 mg iron per ml).', or: 'ଆଇ.ଏଫ୍.ଏ. ସିରପ୍ {ml} ମି.ଲି. ଦିନକୁ ଥରେ, ୩ ମାସ ({mg} ମି.ଗ୍ରା. ଲୌହସାର ପ୍ରତିଦିନ; ସିରପ୍‌ରେ ପ୍ରତି ମି.ଲି.ରେ ୨୦ ମି.ଗ୍ରା.)।' },
  'an.c6.band': { en: 'AMB weight bands (3 mg iron per kg a day): 6–10.9 kg → 1 ml; 11–14.9 kg → 1.5 ml; 15–19.9 kg → 2 ml.', or: 'AMB ଓଜନ ଶ୍ରେଣୀ (ପ୍ରତି କି.ଗ୍ରା.ରେ ଦିନକୁ ୩ ମି.ଗ୍ରା. ଲୌହସାର): ୬–୧୦.୯ କି.ଗ୍ରା. → ୧ ମି.ଲି.; ୧୧–୧୪.୯ କି.ଗ୍ରା. → ୧.୫ ମି.ଲି.; ୧୫–୧୯.୯ କି.ଗ୍ରା. → ୨ ମି.ଲି.।' },
  'an.c6.out': { en: 'Weight is outside the AMB bands (6–19.9 kg): dose as advised by the medical officer.', or: 'ଓଜନ AMB ଶ୍ରେଣୀ (୬–୧୯.୯ କି.ଗ୍ରା.) ବାହାରେ: ଚିକିତ୍ସକଙ୍କ ପରାମର୍ଶ ଅନୁସାରେ ମାତ୍ରା।' },
  'an.c6.f': { en: 'Recheck Hb after 2 months if moderate, 3 months if mild. Risen but not yet normal → continue for another 3 months; little or no rise (less than 1 g/dl) → check that the syrup is being given, and refer to the FRU / district hospital. Once Hb is normal for age (10.5 g/dl under 2 years, 11 g/dl from 2 years), go back to the twice-weekly preventive dose (1 ml).', or: 'ମଧ୍ୟମ ହେଲେ ୨ ମାସ ପରେ, ମୃଦୁ ହେଲେ ୩ ମାସ ପରେ ପୁଣି ହିମୋଗ୍ଲୋବିନ୍ ପରୀକ୍ଷା। ବଢ଼ିଛି କିନ୍ତୁ ସ୍ୱାଭାବିକ ହୋଇନାହିଁ → ଆଉ ୩ ମାସ ଜାରି ରଖନ୍ତୁ; ଅଳ୍ପ ବା ଆଦୌ ବଢ଼ିନାହିଁ (୧ g/dl ରୁ କମ୍) → ସିରପ୍ ନିୟମିତ ଦିଆଯାଉଛି କି ଯାଞ୍ଚ କରି FRU / ଜିଲ୍ଲା ଚିକିତ୍ସାଳୟକୁ ପଠାନ୍ତୁ। ବୟସ ଅନୁସାରେ ସ୍ୱାଭାବିକ ହେଲେ (୨ ବର୍ଷରୁ କମ୍: ୧୦.୫ g/dl; ୨ ବର୍ଷରୁ: ୧୧ g/dl) ସପ୍ତାହକୁ ଦୁଇଥର ପ୍ରତିଷେଧକ ମାତ୍ରା (୧ ମି.ଲି.) କୁ ଫେରନ୍ତୁ।' },
  'an.c5.dose': { en: 'One pink IFA tablet (45 mg iron + 400 mcg folic acid) once a day after a meal, for 3 months.', or: 'ଗୋଟିଏ ଗୋଲାପୀ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୪୫ ମି.ଗ୍ରା. ଲୌହସାର + ୪୦୦ ମାଇକ୍ରୋଗ୍ରାମ ଫୋଲିକ୍ ଏସିଡ୍) ଦିନକୁ ଥରେ ଖାଇବା ପରେ, ୩ ମାସ।' },
  'an.a.dose': { en: 'One blue IFA tablet (60 mg iron + 500 mcg folic acid) once a day after a meal, for 3 months.', or: 'ଗୋଟିଏ ନୀଳ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୬୦ ମି.ଗ୍ରା. ଲୌହସାର + ୫୦୦ ମାଇକ୍ରୋଗ୍ରାମ ଫୋଲିକ୍ ଏସିଡ୍) ଦିନକୁ ଥରେ ଖାଇବା ପରେ, ୩ ମାସ।' },
  'an.w.dose': { en: 'One red IFA tablet (60 mg iron + 500 mcg folic acid) once a day after a meal, for 3 months.', or: 'ଗୋଟିଏ ଲାଲ୍ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୬୦ ମି.ଗ୍ରା. ଲୌହସାର + ୫୦୦ ମାଇକ୍ରୋଗ୍ରାମ ଫୋଲିକ୍ ଏସିଡ୍) ଦିନକୁ ଥରେ ଖାଇବା ପରେ, ୩ ମାସ।' },
  'an.f3': { en: 'Recheck Hb after 2 months if moderate, 3 months if mild. Risen but not yet normal → continue for another 3 months; little or no rise (less than 1 g/dl) → check that the tablets are taken, and refer to the FRU / district hospital. Once normal → back to the weekly preventive tablet.', or: 'ମଧ୍ୟମ ହେଲେ ୨ ମାସ ପରେ, ମୃଦୁ ହେଲେ ୩ ମାସ ପରେ ପୁଣି ହିମୋଗ୍ଲୋବିନ୍ ପରୀକ୍ଷା। ବଢ଼ିଛି କିନ୍ତୁ ସ୍ୱାଭାବିକ ହୋଇନାହିଁ → ଆଉ ୩ ମାସ ଜାରି ରଖନ୍ତୁ; ଅଳ୍ପ ବା ଆଦୌ ବଢ଼ିନାହିଁ (୧ g/dl ରୁ କମ୍) → ବଟିକା ନିୟମିତ ଖାଉଛନ୍ତି କି ଯାଞ୍ଚ କରି FRU / ଜିଲ୍ଲା ଚିକିତ୍ସାଳୟକୁ ପଠାନ୍ତୁ। ସ୍ୱାଭାବିକ ହେଲେ ସାପ୍ତାହିକ ପ୍ରତିଷେଧକ ବଟିକାକୁ ଫେରନ୍ତୁ।' },
  'an.l.dose': { en: 'Two red IFA tablets (each 60 mg iron + 500 mcg folic acid) a day, for 3 months. For moderate anaemia the doctor may give injectable iron instead (iron sucrose in 5 doses or ferric carboxymaltose in 2 doses).', or: 'ଦିନକୁ ଦୁଇଟି ଲାଲ୍ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (ପ୍ରତ୍ୟେକରେ ୬୦ ମି.ଗ୍ରା. ଲୌହସାର + ୫୦୦ ମାଇକ୍ରୋଗ୍ରାମ ଫୋଲିକ୍ ଏସିଡ୍), ୩ ମାସ। ମଧ୍ୟମ ରକ୍ତହୀନତାରେ ଡାକ୍ତର ଏହା ବଦଳରେ ଇଞ୍ଜେକସନ୍ ଲୌହସାର ଦେଇପାରନ୍ତି (ଆଇରନ୍ ସୁକ୍ରୋଜ୍ ୫ ମାତ୍ରା ବା ଫେରିକ୍ କାର୍ବୋକ୍ସିମାଲ୍ଟୋଜ୍ ୨ ମାତ୍ରା)।' },
  'an.l.f': { en: 'Recheck Hb after 2 months if moderate, 3 months if mild. Little or no rise (less than 1 g/dl) → refer to the FRU / district hospital. Once normal → 1 red tablet a day until 6 months after delivery.', or: 'ମଧ୍ୟମ ହେଲେ ୨ ମାସ ପରେ, ମୃଦୁ ହେଲେ ୩ ମାସ ପରେ ପୁଣି ପରୀକ୍ଷା। ଅଳ୍ପ ବା ଆଦୌ ବଢ଼ିନାହିଁ (୧ g/dl ରୁ କମ୍) → FRU / ଜିଲ୍ଲା ଚିକିତ୍ସାଳୟକୁ ପଠାନ୍ତୁ। ସ୍ୱାଭାବିକ ହେଲେ ପ୍ରସବର ୬ ମାସ ପର୍ଯ୍ୟନ୍ତ ଦିନକୁ ଗୋଟିଏ ଲାଲ୍ ବଟିକା।' },
  'an.p.dose': { en: 'Two red IFA tablets (each 60 mg iron + 500 mcg folic acid) every day. Recheck Hb after 1 month: risen by 1 g/dl or more → continue, and go back to 1 tablet a day once Hb is normal; less than 1 g/dl rise, or falling → refer to the FRU / district hospital for tests.', or: 'ପ୍ରତିଦିନ ଦୁଇଟି ଲାଲ୍ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (ପ୍ରତ୍ୟେକରେ ୬୦ ମି.ଗ୍ରା. ଲୌହସାର + ୫୦୦ ମାଇକ୍ରୋଗ୍ରାମ ଫୋଲିକ୍ ଏସିଡ୍)। ୧ ମାସ ପରେ ପୁଣି ପରୀକ୍ଷା: ୧ g/dl ବା ଅଧିକ ବଢ଼ିଲେ ଜାରି ରଖନ୍ତୁ ଓ ସ୍ୱାଭାବିକ ହେଲେ ଦିନକୁ ଗୋଟିଏ ବଟିକାକୁ ଫେରନ୍ତୁ; ୧ g/dl ରୁ କମ୍ ବଢ଼ିଲେ ବା କମିଲେ ପରୀକ୍ଷା ପାଇଁ FRU / ଜିଲ୍ଲା ଚିକିତ୍ସାଳୟକୁ ପଠାନ୍ତୁ।' },
  'an.p.iv': { en: 'For moderate anaemia the doctor may choose injectable iron (iron sucrose in 5 doses or ferric carboxymaltose in 2 doses) — only after the first trimester.', or: 'ମଧ୍ୟମ ରକ୍ତହୀନତାରେ ଡାକ୍ତର ଇଞ୍ଜେକସନ୍ ଲୌହସାର ବାଛିପାରନ୍ତି (ଆଇରନ୍ ସୁକ୍ରୋଜ୍ ୫ ମାତ୍ରା ବା ଫେରିକ୍ କାର୍ବୋକ୍ସିମାଲ୍ଟୋଜ୍ ୨ ମାତ୍ରା) — କେବଳ ପ୍ରଥମ ତ୍ରୟମାସ ପରେ।' },
  'an.p.sev': { en: 'Severe anaemia: refer urgently to the FRU / district hospital, where injectable iron (only after the first trimester) or blood transfusion is decided.', or: 'ଗୁରୁତର ରକ୍ତହୀନତା: ତୁରନ୍ତ FRU / ଜିଲ୍ଲା ଚିକିତ୍ସାଳୟକୁ ପଠାନ୍ତୁ; ସେଠାରେ ଇଞ୍ଜେକସନ୍ ଲୌହସାର (କେବଳ ପ୍ରଥମ ତ୍ରୟମାସ ପରେ) ବା ରକ୍ତ ଦେବା ସ୍ଥିର ହେବ।' },
  'an.p.lt5': { en: 'Hb below 5 g/dl: admit at once for blood transfusion, at any stage of pregnancy.', or: 'ହିମୋଗ୍ଲୋବିନ୍ ୫ g/dl ରୁ କମ୍: ଗର୍ଭର ଯେକୌଣସି ସମୟରେ ରକ୍ତ ଦେବା ପାଇଁ ତୁରନ୍ତ ଭର୍ତ୍ତି କରନ୍ତୁ।' },
  'an.refer': { en: 'Severe anaemia: refer urgently to the FRU / district hospital.', or: 'ଗୁରୁତର ରକ୍ତହୀନତା: ତୁରନ୍ତ FRU / ଜିଲ୍ଲା ଚିକିତ୍ସାଳୟକୁ ପଠାନ୍ତୁ।' },
  'an.mo': { en: 'Treatment as advised by the medical officer; look for the cause.', or: 'ଚିକିତ୍ସକଙ୍କ ପରାମର୍ଶ ଅନୁସାରେ ଚିକିତ୍ସା; କାରଣ ଖୋଜନ୍ତୁ।' },
  'an.prev': { en: 'Keep up the preventive dose: {x}', or: 'ପ୍ରତିଷେଧକ ମାତ୍ରା ଜାରି ରଖନ୍ତୁ: {x}' },
  'an.sickle': { en: 'Iron is withheld in thalassaemia major and after repeated blood transfusions. Sickle cell disease and thalassaemia need the doctor’s plan — injectable iron for severe anaemia is not used in them.', or: 'ଥାଲାସେମିଆ ମେଜର ଓ ବାରମ୍ବାର ରକ୍ତ ନେଇଥିଲେ ଲୌହସାର ଦିଆଯାଏ ନାହିଁ। ସିକଲ୍ ସେଲ୍ ରୋଗ ଓ ଥାଲାସେମିଆରେ ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ଆବଶ୍ୟକ — ଗୁରୁତର ରକ୍ତହୀନତାର ଇଞ୍ଜେକସନ୍ ଲୌହସାର ଏମାନଙ୍କ ପାଇଁ ନୁହେଁ।' },
  'an.acute': { en: 'Do not give iron during an acute illness (fever, diarrhoea, pneumonia); restart after recovery.', or: 'ଜ୍ୱର, ତରଳ ଝାଡ଼ା, ନିମୋନିଆ ଭଳି ଅସୁସ୍ଥତା ସମୟରେ ଲୌହସାର ଦିଅନ୍ତୁ ନାହିଁ; ଭଲ ହେବା ପରେ ପୁଣି ଆରମ୍ଭ କରନ୍ତୁ।' },
  'an.v2026': { en: 'Cut-offs and doses follow the revised Anaemia Mukt Bharat Abhiyaan guidelines (MoHFW, June 2026), which use the WHO 2024 Hb cut-offs. Follow your district\'s instructions where they differ.', or: 'ମାନ ଓ ମାତ୍ରା ସଂଶୋଧିତ ଆନେମିଆ ମୁକ୍ତ ଭାରତ ଅଭିଯାନ ନିର୍ଦ୍ଦେଶାବଳୀ (ସ୍ୱାସ୍ଥ୍ୟ ମନ୍ତ୍ରଣାଳୟ, ଜୁନ୍ ୨୦୨୬) ଅନୁସାରେ, ଯାହା WHO ୨୦୨୪ ହିମୋଗ୍ଲୋବିନ୍ ମାନ ବ୍ୟବହାର କରେ। ଜିଲ୍ଲାର ନିର୍ଦ୍ଦେଶ ଭିନ୍ନ ହେଲେ ତାହା ମାନନ୍ତୁ।' },
  /* vaccine dates */
  'tv.dob': { en: 'Date of birth', or: 'ଜନ୍ମ ତାରିଖ' }, 'tv.sex': { en: 'Sex', or: 'ଲିଙ୍ଗ' }, 'tv.je': { en: 'JE vaccine given in this district', or: 'ଏହି ଜିଲ୍ଲାରେ ଜେ.ଇ. ଟୀକା ଦିଆଯାଏ' },
  'tv.due': { en: 'Due', or: 'ଦେବା ତାରିଖ' }, 'tv.until': { en: 'Until', or: 'ପର୍ଯ୍ୟନ୍ତ' },
  'tv.age': { en: 'Age today: {a}', or: 'ଆଜି ବୟସ: {a}' },
  'tv.note': { en: 'Use the child’s card to record doses — this tool only lists dates. Babies born early are vaccinated by their actual date of birth.', or: 'ଟୀକା ଲେଖିବା ପାଇଁ ଶିଶୁର କାର୍ଡ ବ୍ୟବହାର କରନ୍ତୁ — ଏଠାରେ କେବଳ ତାରିଖ। ସମୟ ପୂର୍ବରୁ ଜନ୍ମିତ ଶିଶୁଙ୍କୁ ପ୍ରକୃତ ଜନ୍ମ ତାରିଖ ଅନୁସାରେ ଟୀକା ଦିଆଯାଏ।' },
  /* z-scores */
  'tz.date': { en: 'Date measured', or: 'ମାପ ତାରିଖ' }, 'tz.ga': { en: 'Weeks of pregnancy at birth (if born early)', or: 'ଜନ୍ମ ସମୟରେ ଗର୍ଭର ସପ୍ତାହ (ସମୟ ପୂର୍ବରୁ ଜନ୍ମ ହେଲେ)' },
  'tz.need': { en: 'Enter sex, date of birth and at least one measurement.', or: 'ଲିଙ୍ଗ, ଜନ୍ମ ତାରିଖ ଓ ଅତି କମ୍‌ରେ ଗୋଟିଏ ମାପ ଦିଅନ୍ତୁ।' },
  'tz.age': { en: 'Age at measurement', or: 'ମାପ ସମୟରେ ବୟସ' },
  /* corrected age */
  'tc.ga': { en: 'Weeks of pregnancy at birth', or: 'ଜନ୍ମ ସମୟରେ ଗର୍ଭର ସପ୍ତାହ' },
  'tc.on': { en: 'On date', or: 'ତାରିଖରେ' },
  'tc.chrono': { en: 'Actual age', or: 'ପ୍ରକୃତ ବୟସ' }, 'tc.corr': { en: 'Corrected age', or: 'ସଂଶୋଧିତ ବୟସ' },
  'tc.early': { en: 'Born {w} weeks early', or: '{w} ସପ୍ତାହ ଆଗରୁ ଜନ୍ମ' },
  'tc.use': { en: 'Use the corrected age for growth and development until 2 years of actual age ({d}). Vaccines follow the actual age.', or: '୨ ବର୍ଷ ପ୍ରକୃତ ବୟସ ({d}) ପର୍ଯ୍ୟନ୍ତ ବୃଦ୍ଧି ଓ ବିକାଶ ପାଇଁ ସଂଶୋଧିତ ବୟସ ବ୍ୟବହାର କରନ୍ତୁ। ଟୀକା ପ୍ରକୃତ ବୟସ ଅନୁସାରେ।' },
  'tc.term': { en: 'Born at term (37 weeks or more): no correction needed.', or: 'ପୂର୍ଣ୍ଣ ସମୟରେ ଜନ୍ମ (୩୭ ସପ୍ତାହ ବା ଅଧିକ): ସଂଶୋଧନ ଆବଶ୍ୟକ ନାହିଁ।' },
  'tc.over2': { en: 'Past 2 years of actual age: correction is no longer used.', or: '୨ ବର୍ଷ ପ୍ରକୃତ ବୟସ ପରେ: ସଂଶୋଧନ ଆଉ ବ୍ୟବହାର ହୁଏ ନାହିଁ।' },
  /* ORS */
  'to.age': { en: 'Age', or: 'ବୟସ' }, 'to.m': { en: 'months', or: 'ମାସ' },
  'to.signs': { en: 'Look and feel (tick what you see)', or: 'ଦେଖନ୍ତୁ ଓ ଅନୁଭବ କରନ୍ତୁ (ଯାହା ଦେଖୁଛନ୍ତି ଚିହ୍ନ ଦିଅନ୍ତୁ)' },
  'to.s.leth': { en: 'Lethargic or unconscious', or: 'ଅଚେତ ବା ଅତ୍ୟଧିକ ନିସ୍ତେଜ' }, 'to.s.rest': { en: 'Restless, irritable', or: 'ଅସ୍ଥିର, ଚିଡ଼ଚିଡ଼ା' },
  'to.s.eyes': { en: 'Sunken eyes', or: 'ଆଖି ଗାତକୁ ପଶିଛି' },
  'to.s.nodrink': { en: 'Not able to drink, or drinks poorly', or: 'ପିଇ ପାରୁନାହିଁ ବା ଅଳ୍ପ ପିଉଛି' }, 'to.s.thirst': { en: 'Drinks eagerly, thirsty', or: 'ଆଗ୍ରହରେ ପିଉଛି, ଶୋଷିଲା' },
  'to.s.pinchVS': { en: 'Skin pinch goes back very slowly (over 2 seconds)', or: 'ଚର୍ମ ଚିମୁଟିଲେ ବହୁତ ଧୀରେ ଫେରୁଛି (୨ ସେକେଣ୍ଡରୁ ଅଧିକ)' }, 'to.s.pinchS': { en: 'Skin pinch goes back slowly', or: 'ଚର୍ମ ଚିମୁଟିଲେ ଧୀରେ ଫେରୁଛି' },
  'to.severe': { en: 'Severe dehydration', or: 'ଗୁରୁତର ଜଳୀୟ ଅଭାବ' }, 'to.some': { en: 'Some dehydration', or: 'କିଛି ଜଳୀୟ ଅଭାବ' }, 'to.no': { en: 'No dehydration', or: 'ଜଳୀୟ ଅଭାବ ନାହିଁ' },
  'to.severeDo': { en: 'Refer urgently to hospital for IV fluids (Plan C). Give ORS sips on the way if the child can drink; keep breastfeeding.', or: 'ଶିରା ମାଧ୍ୟମରେ ତରଳ ପାଇଁ ତୁରନ୍ତ ଡାକ୍ତରଖାନାକୁ ପଠାନ୍ତୁ (ପ୍ଲାନ୍ C)। ପିଇପାରିଲେ ବାଟରେ ଅଳ୍ପ ଅଳ୍ପ ଓଆର୍ଏସ୍ ଦିଅନ୍ତୁ; ସ୍ତନ୍ୟପାନ ଜାରି ରଖନ୍ତୁ।' },
  'to.someDo': { en: 'Plan B: give {ml} ml of ORS over 4 hours (75 ml per kg), then reassess. Continue breastfeeding.', or: 'ପ୍ଲାନ୍ B: ୪ ଘଣ୍ଟାରେ {ml} ମି.ଲି. ଓଆର୍ଏସ୍ ଦିଅନ୍ତୁ (ପ୍ରତି କି.ଗ୍ରା. ୭୫ ମି.ଲି.), ତା’ପରେ ପୁଣି ଯାଞ୍ଚ କରନ୍ତୁ। ସ୍ତନ୍ୟପାନ ଜାରି ରଖନ୍ତୁ।' },
  'to.someNoWt': { en: 'Plan B: 75 ml of ORS per kg over 4 hours — enter the weight to see the amount.', or: 'ପ୍ଲାନ୍ B: ୪ ଘଣ୍ଟାରେ ପ୍ରତି କି.ଗ୍ରା. ୭୫ ମି.ଲି. ଓଆର୍ଏସ୍ — ପରିମାଣ ପାଇଁ ଓଜନ ଦିଅନ୍ତୁ।' },
  'to.noDo': { en: 'Plan A at home: ORS after each loose stool — {amt}. Keep feeding.', or: 'ଘରେ ପ୍ଲାନ୍ A: ପ୍ରତ୍ୟେକ ତରଳ ଝାଡ଼ା ପରେ ଓଆର୍ଏସ୍ — {amt}। ଖାଇବା ଜାରି ରଖନ୍ତୁ।' },
  'to.amt2': { en: '50–100 ml (¼ to ½ cup)', or: '୫୦–୧୦୦ ମି.ଲି. (୧/୪ ରୁ ୧/୨ କପ୍)' }, 'to.amt10': { en: '100–200 ml (½ to 1 cup)', or: '୧୦୦–୨୦୦ ମି.ଲି. (୧/୨ ରୁ ୧ କପ୍)' }, 'to.amtOld': { en: 'as much as wanted', or: 'ଯେତେ ଚାହିଁବ' },
  'to.rule': { en: 'Severe dehydration: two or more of lethargic/unconscious, sunken eyes, not able to drink, skin pinch very slow. Some dehydration: two or more signs from either list.', or: 'ଗୁରୁତର ଜଳୀୟ ଅଭାବ: ଅଚେତ/ନିସ୍ତେଜ, ଆଖି ଗାତକୁ ପଶିବା, ପିଇ ନ ପାରିବା, ଚର୍ମ ବହୁତ ଧୀରେ ଫେରିବା — ଏଥିରୁ ଦୁଇଟି ବା ଅଧିକ। କିଛି ଜଳୀୟ ଅଭାବ: ଯେକୌଣସି ଦୁଇଟି ବା ଅଧିକ ଲକ୍ଷଣ।' },
  'to.dangerT': { en: 'Danger sign: refer urgently', or: 'ବିପଦ ଲକ୍ଷଣ: ତୁରନ୍ତ ପଠାନ୍ତୁ' },
  'to.dangerDo': { en: 'A child who is lethargic or unconscious, or not able to drink, needs hospital care now (call 108).', or: 'ଅଚେତ ବା ଅତ୍ୟଧିକ ନିସ୍ତେଜ, କିମ୍ବା ପିଇ ପାରୁନଥିବା ଶିଶୁକୁ ଏବେ ହିଁ ଡାକ୍ତରଖାନା ନିଅନ୍ତୁ (୧୦୮ କୁ ଫୋନ୍ କରନ୍ତୁ)।' },
  'to.onWay': { en: 'Give sips of ORS on the way if the child can drink, and keep breastfeeding.', or: 'ପିଇପାରିଲେ ବାଟରେ ଅଳ୍ପ ଅଳ୍ପ ଓଆର୍ଏସ୍ ଦିଅନ୍ତୁ ଓ ସ୍ତନ୍ୟପାନ ଜାରି ରଖନ୍ତୁ।' },
  'to.zinc': { en: 'Zinc: {z} once a day for 14 days.', or: 'ଜିଙ୍କ୍: ଦିନକୁ ଥରେ {z}, ୧୪ ଦିନ।' },
  'to.blood': { en: 'Blood in the stool, diarrhoea for 14 days or more, or any danger sign: refer.', or: 'ଝାଡ଼ାରେ ରକ୍ତ, ୧୪ ଦିନ ବା ଅଧିକ ତରଳ ଝାଡ଼ା, ବା କୌଣସି ବିପଦ ଲକ୍ଷଣ: ପଠାନ୍ତୁ।' },
  /* IFA table */
  'ti.who': { en: 'Who', or: 'କିଏ' }, 'ti.dose': { en: 'Dose', or: 'ମାତ୍ରା' }, 'ti.ifa': { en: 'IFA (prevention)', or: 'ଆଇ.ଏଫ୍.ଏ. (ପ୍ରତିଷେଧ)' }, 'ti.worm': { en: 'Deworming (albendazole 400 mg)', or: 'କୃମିନାଶକ (ଆଲ୍‌ବେଣ୍ଡାଜୋଲ୍ ୪୦୦ ମି.ଗ୍ରା.)' },
});

const T = (k, v) => K.t(k, v);
K.tools = {};
K.tools.LIST = [
  { k: 'edd', icon: 'calendar', g: 'preg' }, { k: 'hrp', icon: 'alert', g: 'preg' }, { k: 'anaemia', icon: 'drop', g: 'preg' },
  { k: 'vax', icon: 'syringe', g: 'child' }, { k: 'z', icon: 'chart', g: 'child' }, { k: 'corrected', icon: 'baby', g: 'child' },
  { k: 'breath', icon: 'timer', g: 'child' }, { k: 'ors', icon: 'water', g: 'child' }, { k: 'ifa', icon: 'pill', g: 'child' },
];
const src = (txt) => h`<p class="small faint tool-src"><b>${T('tools.src')}:</b> ${txt}</p>`;
const resBox = () => h`<section id="tool-res" class="tool-res" aria-live="polite"></section>`;
const setRes = (html) => { const b = K.$('#tool-res'); if (b) b.innerHTML = K.hv(html); };
const page = (k, body, o = {}) => ({ title: T('tl.' + k), back: '/tools', tab: 'tools', html: h`<div class="wrap">${K.ui.phead(T('tools.title'), T('tl.' + k), o.lede || T('tl.' + k + 'Sub'))}${body}</div>`, mount: o.mount });

K.route('/tools', () => ({ title: T('tools.title'), tab: 'tools',
  html: h`<div class="wrap">${K.ui.phead('', T('tools.title'), T('tools.lede'))}
    ${['preg', 'child'].map(g => h`<section class="sec">${K.ui.secH(T('tools.g.' + g))}<div class="list">${K.tools.LIST.filter(t => t.g === g).map(t => K.ui.li({ href: '#/tools/' + t.k, icon: t.icon, title: T('tl.' + t.k), meta: T('tl.' + t.k + 'Sub') }))}</div></section>`)}
  </div>` }));

/* ---------------------------------------------------------------- EDD */
K.route('/tools/edd', () => page('edd', h`<form class="form" data-form="noop" id="tedd">
    ${K.ui.choices({ name: 'basis', label: T('edd.basis'), value: 'lmp', options: ['lmp', 'usg', 'edd'].map(v => ({ v, l: T('edd.b.' + v) })), live: 'tEdd' })}
    <div class="fgroup" data-b="lmp">${K.ui.field({ name: 'lmp', type: 'date', label: T('edd.lmp'), max: K.d.today(), attrs: { 'data-live': 'tEdd' } })}</div>
    <div class="fgroup" data-b="usg" hidden>${K.ui.field({ name: 'usgDate', type: 'date', label: T('edd.usgDate'), max: K.d.today(), attrs: { 'data-live': 'tEdd' } })}
      <div class="frow">${K.ui.field({ name: 'usgW', type: 'number', label: T('edd.usgW'), attrs: { 'data-live': 'tEdd' } })}${K.ui.field({ name: 'usgD', type: 'number', label: T('edd.usgD'), attrs: { 'data-live': 'tEdd' } })}</div>
      ${K.ui.field({ name: 'lmp2', type: 'date', label: T('edd.lmpOpt'), max: K.d.today(), attrs: { 'data-live': 'tEdd' } })}
      <p class="small faint" style="margin:0">${T('edd.usgNote')}</p></div>
    <div class="fgroup" data-b="edd" hidden>${K.ui.field({ name: 'edd', type: 'date', label: T('edd.edd'), attrs: { 'data-live': 'tEdd' } })}</div>
  </form>${resBox()}${src('Naegele\'s rule (LMP + 280 days); ACOG Committee Opinion 700 (2017) for scan versus LMP dating; ANC schedule and PMSMA (9th of every month) as on the MCP card.')}`, { mount() { K.live.tEdd(); } }));
K.forms.noop = () => {};
K.live.tEdd = K.debounce(() => {
  const f = K.$('#tedd'); if (!f) return; const v = K.formData(f); const b = v.basis || 'lmp';
  K.$$('[data-b]', f).forEach(el => { el.hidden = el.dataset.b !== b; });
  const p = b === 'lmp' ? { lmp: v.lmp } : b === 'usg' ? { eddBasis: 'usg', usgDate: v.usgDate, usgWeeks: v.usgW, usgDays: v.usgD || 0 } : { eddKnown: v.edd };
  if (b === 'usg' && (v.usgW == null || !v.usgDate)) return setRes('');
  const rule = b === 'usg' && v.lmp2 ? K.preg.datingRule(v.lmp2, v.usgDate, v.usgW, v.usgD) : null;
  const e = rule ? (rule.useScan ? rule.eddUsg : rule.eddLmp) : K.preg.edd(p); if (!e || !K.d.valid(e)) return setRes('');
  const g = K.preg.ga({ eddKnown: e }); const today = K.d.today();
  if (g.days < 0 || g.days > 44 * 7) return setRes(K.ui.callout('warn', '', T('edd.bad')));
  const lmp = K.d.addDays(e, -280); const at = (w) => K.d.addDays(lmp, w * 7);
  const rows = [[12, 'edd.k12'], [14, 'edd.k14'], [24, 'edd.k24'], [28, 'edd.k28'], [36, 'edd.k36'], [37, 'edd.k37'], [40, 'edd.k40'], [41, 'edd.k41']];
  const pm = g.days >= 84 ? K.anc.nextPmsma({ eddKnown: e }) : null;
  setRes(h`<div class="stats"><div class="stat"><span class="lb">${T('edd.edd')}</span><span class="vl">${K.d.fmt(e, 'long')}</span><span class="sub">${K.d.weekday(e)} · ${K.d.rel(e)}</span></div>
      <div class="stat"><span class="lb">${T('edd.today')}</span><span class="vl ink">${K.preg.gaText(g)}</span><span class="sub">${T('preg.tri.' + K.preg.tri(g.days))}</span></div></div>
    ${rule ? h`<p></p>${K.ui.callout(rule.useScan ? 'warn' : '', '', K.preg.ruleText(rule))}` : ''}
    ${b !== 'lmp' ? h`<p class="small">${T('edd.lmpEq')}: ${K.d.fmt(lmp, 'long')}</p>` : ''}
    <section class="sec">${K.ui.secH(T('edd.keys'))}<div class="list">${rows.map(([w, key]) => { const d = at(w); const past = K.d.cmp(d, today) < 0;
      return K.ui.li({ icon: w === 40 ? 'star' : w === 41 ? 'alert' : 'calendar', tone: past ? 'done' : w === 41 ? 'red' : '', title: T(key), meta: `${K.plural(w, 'week')} · ${K.d.fmt(d)}`, trail: past ? K.ui.icon('check', 'sm') : h`<span class="small faint">${K.d.rel(d)}</span>` }); })}
      ${pm ? K.ui.li({ icon: 'hospital', title: T('edd.pmsma'), meta: K.d.weekday(pm) + ', ' + K.d.fmt(pm), trail: h`<span class="small faint">${K.d.rel(pm)}</span>` }) : ''}</div></section>`);
}, 200);

/* ---------------------------------------------------------------- HRP quick check */
K.route('/tools/hrp', () => {
  const secs = ['past', 'now', 'anc', 'nat'];
  return page('hrp', h`<form class="form" data-form="noop" id="thrp">
    ${secs.map(s => { const items = K.hrp.ITEMS.filter(x => x.sec === s); if (!items.length) return '';
      return h`<fieldset class="fgroup"><legend>${T('hrp.sec.' + s)}</legend>${items.map(x => K.ui.yn({ name: x.code, q: K.L(x), code: K.settings.isHcp() && x.tag ? x.tag : '', live: 'tHrp' }))}</fieldset>`; })}
    <p>${K.ui.btn(T('thrp.clear'), { act: 'tHrpClear', tone: 'quiet', size: 'sm', icon: 'x' })}</p>
  </form>${resBox()}${src('Odisha MCP card V-2023-24 (ଖ.୧, ଖ.୨) and the national PMSMA list.')}`, { lede: T('thrp.lede'), mount() { K.live.tHrp(); } });
});
K.live.tHrp = () => {
  const f = K.$('#thrp'); if (!f) return; const v = K.formData(f);
  const yes = K.hrp.ITEMS.filter(x => v[x.code] === '1'); const answered = K.hrp.ITEMS.filter(x => v[x.code] != null).length;
  if (!answered) return setRes('');
  setRes(yes.length ? h`${K.ui.callout('danger', T('hrp.isHigh'), h`<p>${T('hrp.because')}</p><ul class="ul">${yes.map(x => h`<li>${K.L(x)}</li>`)}</ul>`)}
      <section class="sec">${K.ui.secH(T('hrp.what'))}<ul class="ul">${['hrp.do1', 'hrp.do2', 'hrp.do3', 'hrp.do4'].map(k => h`<li>${T(k)}</li>`)}</ul></section>`
    : K.ui.callout('', '', T('thrp.none'), 'check'));
};
K.acts.tHrpClear = () => { K.$$('#thrp input[type=radio]').forEach(i => { i.checked = false; }); K.live.tHrp(); window.scrollTo(0, 0); };

/* ---------------------------------------------------------------- anaemia */
/* Hb cut-offs (g/dl): [no anaemia ≥, mild ≥, moderate ≥] — severe below the last.
   WHO 2024, as adopted by the AMB Abhiyaan guidelines (MoHFW, June 2026, §4.1). */
K.tools.HB = { c623: [10.5, 9.5, 7], c2459: [11, 10, 7], c5: [11.5, 11, 8], a1011: [11.5, 11, 8], a1214: [12, 11, 8], ag15: [12, 11, 8], ab15: [13, 11, 8],
  p: [11, 10, 7], p2: [10.5, 9.5, 7], l: [12, 11, 8], w: [12, 11, 8], m: [13, 11, 8] };
K.tools.hbClass = (key, hb) => { const c = K.tools.HB[key]; if (!c || hb == null) return null; return hb >= c[0] ? 'none' : hb >= c[1] ? 'mild' : hb >= c[2] ? 'moderate' : 'severe'; };
/* the key for a group; pregnancy uses the 2nd-trimester cut-off at 14–27 weeks (K.preg.tri) */
K.tools.hbKey = (g, v) => (g === 'a' ? 'a' + (v.ag || '1214') : g === 'c6' ? 'c' + (v.cg || '623') : g === 'p' && v.ga != null && K.preg.tri(v.ga * 7) === 2 ? 'p2' : g);
const PREV = {
  c6: { en: '1 ml IFA syrup twice a week', or: 'ସପ୍ତାହକୁ ଦୁଇଥର ୧ ମି.ଲି. ଆଇ.ଏଫ୍.ଏ. ସିରପ୍' },
  c5: { en: '1 pink IFA tablet (45 mg) once a week', or: 'ସପ୍ତାହକୁ ଥରେ ଗୋଟିଏ ଗୋଲାପୀ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୪୫ ମି.ଗ୍ରା.)' },
  a: { en: '1 blue IFA tablet (60 mg) once a week', or: 'ସପ୍ତାହକୁ ଥରେ ଗୋଟିଏ ନୀଳ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୬୦ ମି.ଗ୍ରା.)' },
  p: { en: '1 red IFA tablet (60 mg) every day from the 2nd trimester (4th month), for 180 days', or: 'ଦ୍ୱିତୀୟ ତ୍ରୟମାସ (୪ର୍ଥ ମାସ) ରୁ ୧୮୦ ଦିନ ପ୍ରତିଦିନ ଗୋଟିଏ ଲାଲ୍ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୬୦ ମି.ଗ୍ରା.)' },
  l: { en: '1 red IFA tablet (60 mg) every day for 180 days after delivery', or: 'ପ୍ରସବ ପରେ ୧୮୦ ଦିନ ପ୍ରତିଦିନ ଗୋଟିଏ ଲାଲ୍ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୬୦ ମି.ଗ୍ରା.)' },
  w: { en: '1 red IFA tablet (60 mg) once a week', or: 'ସପ୍ତାହକୁ ଥରେ ଗୋଟିଏ ଲାଲ୍ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୬୦ ମି.ଗ୍ରା.)' },
};
K.route('/tools/anaemia', () => page('anaemia', h`<form class="form" data-form="noop" id="tan">
    ${K.ui.field({ name: 'g', type: 'select', label: T('an.group'), value: 'p', placeholder: false, options: ['c6', 'c5', 'a', 'p', 'l', 'w', 'm'].map(v => ({ v, l: T('an.g.' + v) })), attrs: { 'data-live': 'tAn' } })}
    <div data-show="c6" hidden>${K.ui.choices({ name: 'cg', label: T('an.cAge'), value: '623', options: ['623', '2459'].map(v => ({ v, l: T('an.c.' + v) })), live: 'tAn' })}</div>
    <div data-show="a" hidden>${K.ui.choices({ name: 'ag', label: T('an.ageA'), value: '1214', options: ['1011', '1214', 'g15', 'b15'].map(v => ({ v, l: T('an.a.' + v) })), live: 'tAn' })}</div>
    <div class="frow">${K.ui.field({ name: 'hb', type: 'decimal', label: T('an.hb'), unit: 'g/dl', attrs: { 'data-live': 'tAn' } })}
      <div data-show="c6">${K.ui.field({ name: 'wt', type: 'decimal', label: T('an.wt'), unit: T('u.kg'), attrs: { 'data-live': 'tAn' } })}</div>
      <div data-show="p">${K.ui.field({ name: 'ga', type: 'number', label: T('an.ga'), attrs: { 'data-live': 'tAn' } })}</div></div>
  </form>${resBox()}<p class="small">${T('tools.hcpNote')}</p>${K.ui.callout('info', '', T('an.v2026'))}
  ${src('Anaemia Mukt Bharat Abhiyaan operational guidelines (MoHFW, June 2026): WHO 2024 haemoglobin cut-offs (section 4.1) and treatment protocols (chapter 4).')}`, { mount() { K.live.tAn(); } }));
K.live.tAn = K.debounce(() => {
  const f = K.$('#tan'); if (!f) return; const v = K.formData(f); const g = v.g || 'p';
  K.$$('[data-show]', f).forEach(el => { el.hidden = !el.dataset.show.split(' ').includes(g); });
  const key = K.tools.hbKey(g, v); const hb = v.hb;
  if (hb == null || hb < 2 || hb > 22) return setRes('');
  const cls = K.tools.hbClass(key, hb); const c = K.tools.HB[key];
  const tone = cls === 'severe' ? 'danger' : cls === 'none' ? '' : 'warn';
  const cut = T('an.cut', { n: c[0], mi: `${c[1]}–${(c[0] - 0.1).toFixed(1)}`, mo: `${c[2]}–${(c[1] - 0.1).toFixed(1)}`, s: c[2] });
  const out = [];
  if (cls === 'none') { if (PREV[g]) out.push(h`<p>${T('an.prev', { x: K.L(PREV[g]) })}</p>`); }
  else if (cls === 'severe') out.push(h`<p><b>${g === 'p' ? T(hb < 5 ? 'an.p.lt5' : 'an.p.sev') : T('an.refer')}</b></p>`);
  else if (g === 'c6') {
    const w = v.wt; const ml = w == null ? null : w >= 6 && w < 11 ? 1 : w >= 11 && w < 15 ? 1.5 : w >= 15 && w < 20 ? 2 : 0;
    out.push(ml ? h`<p><b>${T('an.c6.dose', { ml: K.n(ml, 1), mg: K.n(ml * 20, 0) })}</b></p>` : ml === 0 ? h`<p>${T('an.c6.out')}</p>` : '', h`<p class="small">${T('an.c6.band')}</p><p>${T('an.c6.f')}</p>`);
  } else if (g === 'c5' || g === 'a' || g === 'w') out.push(h`<p><b>${T('an.' + g + '.dose')}</b></p><p>${T('an.f3')}</p>`);
  else if (g === 'l') out.push(h`<p><b>${T('an.l.dose')}</b></p><p>${T('an.l.f')}</p>`);
  else if (g === 'p') out.push(h`<p><b>${T('an.p.dose')}</b></p><p class="small">${T('an.p.iv')}</p>`);
  else out.push(h`<p>${T('an.mo')}</p>`);
  setRes(h`${K.ui.callout(tone, T('an.' + cls) + ` · ${K.n(hb, 1)} g/dl`, cut, cls === 'none' ? 'check' : null)}
    ${g === 'p' && v.ga == null ? h`<p class="small faint" style="margin:8px 0 0">${T('an.gaNeed')}</p>` : ''}
    ${cls !== 'none' ? h`<section class="sec">${K.ui.secH(T('an.treat'))}<div class="k-card tool-adv">${out}<p class="small faint">${T('an.acute')}</p><p class="small faint">${T('an.sickle')}</p></div></section>` : h`<div style="margin-top:10px">${out}</div>`}`);
}, 200);

/* ---------------------------------------------------------------- vaccine dates */
K.route('/tools/vax', () => page('vax', h`<form class="form" data-form="noop" id="tvax">
    <div class="frow">${K.ui.field({ name: 'dob', type: 'date', label: T('tv.dob'), max: K.d.today(), attrs: { 'data-live': 'tVax' } })}
      ${K.ui.field({ name: 'sex', type: 'select', label: T('tv.sex'), placeholder: '–', options: [{ v: 'f', l: T('sex.f') }, { v: 'm', l: T('sex.m') }], attrs: { 'data-live': 'tVax' } })}</div>
    ${K.ui.sw({ name: 'je', title: T('tv.je'), checked: !!K.settings.get('jeArea'), live: 'tVax' })}
  </form>${resBox()}<p class="small faint">${T('tv.note')}</p>${src('National Immunization Schedule (MoHFW) as printed on the Odisha MCP card V-2023-24, with the age limits of the Immunization Handbook for Medical Officers (2017); fIPV-3 at 9 months; HPV for girls at 14 (2026); late starters as in the NHM Odisha UIP training deck (2024): DPT in place of Penta after 1 year.')}`, { mount() { K.live.tVax(); } }));
K.live.tVax = K.debounce(() => {
  const f = K.$('#tvax'); if (!f) return; const v = K.formData(f); if (!v.dob) return setRes('');
  const k = { dob: v.dob, sex: v.sex || '', vax: {}, vitA: {}, alb: {} };
  const st = K.vax.state(k, K.d.today(), { je: !!v.je });
  const vita = K.vax.vitaState(k); const a0 = K.vax.alb0State(k);
  const vrow = (x) => h`<tr><td class="num">${x.v.code}</td><td class="num">${K.d.fmt(x.due)}</td><td class="small">${x.dose}${x.v.alb ? ' + ' + T('vita.alb') + ' ' + x.albDose : ''}</td></tr>`;
  const rows = K.vax.VISITS.filter(x => x.k !== 'y14' || v.sex !== 'm').map(vis => {
    const items = K.vax.LIST.filter(it => it.v === vis.k).map(it => st[it.id]).filter(s => s && s.st !== 'na');
    if (!items.length) return '';
    return h`<tr class="tv-h"><td colspan="3"><b>${K.L(vis.name)}</b> <span class="small faint">${K.d.fmt(K.vax.at(v.dob, vis.due))}</span></td></tr>
      ${items.map(s => h`<tr><td class="num">${s.it.code}</td><td class="num">${K.d.fmt(s.due)}</td><td class="num small">${s.lim ? K.d.fmt(s.lim) : (s.st === 'missed' ? T('st.missed') : '')}</td></tr>`)}`;
  });
  setRes(h`<p class="small">${T('tv.age', { a: K.d.ageText(v.dob) })}</p>
    <div class="table"><table><thead><tr><th>${T('vax.title')}</th><th>${T('tv.due')}</th><th>${T('tv.until')}</th></tr></thead><tbody>${rows}
      <tr class="tv-h"><td colspan="3"><b>${T('vita.title')}</b></td></tr>${vrow(vita[0])}
      ${a0 ? h`<tr><td>${T('vita.alb')}</td><td class="num">${K.d.fmt(a0.due)}</td><td class="small">${a0.albDose}</td></tr>` : ''}${vita.slice(1).map(vrow)}</tbody></table></div>`);
}, 200);

/* ---------------------------------------------------------------- z-scores */
K.route('/tools/z', () => page('z', h`<form class="form" data-form="noop" id="tz">
    <div class="fgroup">
      ${K.ui.choices({ name: 'sex', label: T('tv.sex'), options: [{ v: 'f', l: T('sex.f') }, { v: 'm', l: T('sex.m') }], live: 'tZ' })}
      <div class="frow">${K.ui.field({ name: 'dob', type: 'date', label: T('tv.dob'), max: K.d.today(), attrs: { 'data-live': 'tZ' } })}${K.ui.field({ name: 'date', type: 'date', label: T('tz.date'), value: K.d.today(), max: K.d.today(), attrs: { 'data-live': 'tZ' } })}</div>
      ${K.ui.field({ name: 'ga', type: 'number', label: T('tz.ga'), attrs: { 'data-live': 'tZ' } })}
    </div>
    <div class="fgroup">
      <div class="frow">${K.ui.field({ name: 'wt', type: 'decimal', label: T('gr.weight'), unit: T('u.kg'), attrs: { 'data-live': 'tZ' } })}${K.ui.field({ name: 'ht', type: 'decimal', label: T('gr.length'), unit: T('u.cm'), attrs: { 'data-live': 'tZ' } })}</div>
      ${K.ui.choices({ name: 'pos', label: T('gr.pos'), options: ['L', 'H'].map(v => ({ v, l: T('gr.pos.' + v) })), live: 'tZ' })}
      <div class="frow">${K.ui.field({ name: 'muac', type: 'decimal', label: 'MUAC', unit: T('u.cm'), attrs: { 'data-live': 'tZ' } })}${K.ui.field({ name: 'hc', type: 'decimal', label: T('gr.hc'), unit: T('u.cm'), attrs: { 'data-live': 'tZ' } })}</div>
      ${K.ui.yn({ name: 'oedema', q: T('gr.oedema'), live: 'tZ' })}
    </div>
  </form>${resBox()}${src('WHO Child Growth Standards (2006) LMS tables from the WHO anthro package; WHO / IMNCI classification of SAM and MAM.')}`, { mount() { K.live.tZ(); } }));
K.live.tZ = K.debounce(() => {
  const f = K.$('#tz'); if (!f) return; const v = K.formData(f);
  if (!v.sex || !v.dob || (v.wt == null && v.ht == null && v.hc == null && v.muac == null && !v.oedema)) return setRes(h`<p class="small faint">${T('tz.need')}</p>`);
  let wt = v.wt; if (wt != null && wt > 60) wt = wt / 1000;
  const k = { sex: v.sex, dob: v.dob, gaWeeks: v.ga != null ? v.ga : null };
  const m = { date: v.date || K.d.today(), wt, ht: v.ht != null && v.ht >= 30 ? v.ht : null, pos: v.pos, muac: v.muac, hc: v.hc, oedema: v.oedema };
  const r = K.growth.assess(k, m); if (!r) return setRes('');
  const zs = (z) => (z == null ? '–' : K.digits((z >= 0 ? '+' : '') + z.toFixed(2)));
  const row = (lb, z, txt) => (z == null ? '' : h`<tr><td>${lb}</td><td class="num ${z < -2 ? 'neg' : ''}">${zs(z)}</td><td class="small">${txt}</td></tr>`);
  const cl = (z, a, b, c) => (z < -3 ? a : z < -2 ? b : c);
  setRes(h`<p class="small">${T('tz.age')}: ${K.d.ageText(v.dob, m.date)}${r.corrected ? ' · ' + T('gr.corrected') : ''}</p>
    ${K.growth.resultHtml(k, r, { stats: false })}
    <div class="table" style="margin-top:10px"><table><tbody>
      ${row('WAZ', r.waz, r.waz == null ? '' : cl(r.waz, T('gr.zone.s'), T('gr.zone.m'), r.waz > 2 ? T('gr.zone.hi') : T('gr.zone.n')))}
      ${row('HAZ', r.haz, r.haz == null ? '' : cl(r.haz, T('gr.stuntS'), T('gr.stunt'), '–'))}
      ${row(r.whInd === 'wfh' ? 'WHZ' : 'WLZ', r.whz, r.whz == null ? '' : cl(r.whz, 'SAM', 'MAM', r.whz > 2 ? T('gr.over') : '–'))}
      ${row('BAZ', r.baz, '')}
      ${row('HCZ', r.hcz, r.hcz == null ? '' : r.hcz < -2 ? T('gr.micro') : r.hcz > 2 ? T('gr.macro') : '–')}
    </tbody></table></div>`);
}, 250);

/* ---------------------------------------------------------------- corrected age */
K.route('/tools/corrected', () => page('corrected', h`<form class="form" data-form="noop" id="tca">
    <div class="frow">${K.ui.field({ name: 'dob', type: 'date', label: T('tv.dob'), max: K.d.today(), attrs: { 'data-live': 'tCa' } })}${K.ui.field({ name: 'ga', type: 'number', label: T('tc.ga'), attrs: { 'data-live': 'tCa' } })}</div>
    ${K.ui.field({ name: 'on', type: 'date', label: T('tc.on'), value: K.d.today(), attrs: { 'data-live': 'tCa' } })}
  </form>${resBox()}${src('Corrected age = actual age − (40 − weeks at birth) weeks, used until 2 years (AAP / IAP practice).')}`, { mount() { K.live.tCa(); } }));
K.live.tCa = K.debounce(() => {
  const f = K.$('#tca'); if (!f) return; const v = K.formData(f); if (!v.dob || v.ga == null) return setRes('');
  const on = v.on || K.d.today(); if (K.d.cmp(on, v.dob) < 0) return setRes('');
  if (v.ga >= 37) return setRes(K.ui.callout('', '', T('tc.term'), 'check'));
  const early = 40 - v.ga; const cdob = K.d.addDays(v.dob, early * 7); const two = K.d.addMonths(v.dob, 24);
  const over = K.d.cmp(on, two) >= 0;
  setRes(h`<div class="stats"><div class="stat"><span class="lb">${T('tc.chrono')}</span><span class="vl ink">${K.d.ageText(v.dob, on)}</span></div>
    <div class="stat"><span class="lb">${T('tc.corr')}</span><span class="vl">${K.d.cmp(on, cdob) < 0 ? '–' : K.d.ageText(cdob, on)}</span><span class="sub">${T('tc.early', { w: early })}</span></div></div>
    <p class="small" style="margin-top:10px">${over ? T('tc.over2') : T('tc.use', { d: K.d.fmt(two) })}</p>`);
}, 200);

/* ---------------------------------------------------------------- ORS and zinc */
/* IMNCI chart booklet / WHO Treatment of Diarrhoea (2005), 2 months – 5 years.
   Four features, each counted once at its worse level: condition (restless →
   lethargic/unconscious), eyes (sunken), drinking (thirsty → not able to drink),
   skin pinch (slow → very slow). Severe = two or more severe-row signs; some =
   two or more features at either level. Lethargic/unconscious and not able to
   drink are also general danger signs: urgent referral whatever the class. */
const SIGNS_SEV = ['leth', 'eyes', 'nodrink', 'pinchVS'];
const FEATURES = [['rest', 'leth'], ['eyes'], ['thirst', 'nodrink'], ['pinchS', 'pinchVS']];
K.tools.dehydration = (s) => {
  const nSev = SIGNS_SEV.filter(x => s.includes(x)).length; const nAny = FEATURES.filter(f => f.some(x => s.includes(x))).length;
  return { cls: nSev >= 2 ? 'severe' : nAny >= 2 ? 'some' : 'no', danger: s.includes('leth') || s.includes('nodrink') };
};
K.route('/tools/ors', () => page('ors', h`<form class="form" data-form="noop" id="tors">
    <div class="frow">${K.ui.field({ name: 'age', type: 'number', label: T('to.age'), unit: T('to.m'), attrs: { 'data-live': 'tOrs' } })}${K.ui.field({ name: 'wt', type: 'decimal', label: T('an.wt'), unit: T('u.kg'), attrs: { 'data-live': 'tOrs' } })}</div>
    <div class="field"><span class="lbl">${T('to.signs')}</span><div class="choices">${['leth', 'rest', 'eyes', 'nodrink', 'thirst', 'pinchVS', 'pinchS'].map(s => h`<label class="choice ${SIGNS_SEV.includes(s) && s !== 'eyes' ? 'danger' : 'warn'}"><input type="checkbox" name="s" value="${s}" data-live="tOrs"><span>${T('to.s.' + s)}</span></label>`)}</div>
      <p class="small faint" style="margin:6px 0 0">${T('to.rule')}</p></div>
  </form>${resBox()}${src('IMNCI chart booklet (MoHFW) and WHO Treatment of Diarrhoea (2005): dehydration classes and Plans A, B and C; zinc as on the Odisha MCP card (p.9).')}`, { mount() { K.live.tOrs(); } }));
K.live.tOrs = K.debounce(() => {
  const f = K.$('#tors'); if (!f) return; const v = K.formData(f); const s = v.s || []; const age = v.age;
  if (age == null && v.wt == null && !s.length) return setRes('');
  const { cls, danger } = K.tools.dehydration(s);
  const amt = age == null ? T('to.amt2') + ' / ' + T('to.amt10') : age < 24 ? T('to.amt2') : age < 120 ? T('to.amt10') : T('to.amtOld');
  const z = age == null ? null : age < 2 ? null : age < 6 ? T('sick.zincHalf') : T('sick.zincOne');
  // with a danger sign the child goes to hospital now: no home plan, no green tick
  const plan = cls === 'severe' ? K.ui.callout('danger', T('to.severe'), T('to.severeDo'))
    : danger ? K.ui.callout('warn', T('to.' + cls), T('to.onWay'))
    : cls === 'some' ? K.ui.callout('warn', T('to.some'), v.wt ? T('to.someDo', { ml: K.n(Math.round(v.wt * 75 / 10) * 10, 0) }) : T('to.someNoWt'))
    : K.ui.callout('', T('to.no'), T('to.noDo', { amt }), 'check');
  setRes(h`${danger ? h`${K.ui.callout('danger', T('to.dangerT'), T('to.dangerDo'))}<p></p>` : ''}${plan}<div class="k-card tool-adv" style="margin-top:10px">${z ? h`<p><b>${T('to.zinc', { z })}</b></p>` : age != null && age < 2 ? h`<p>${T('sick.zincYoung')}</p>` : ''}<p class="small">${T('to.blood')}</p></div>`);
}, 200);

/* ---------------------------------------------------------------- IFA and deworming doses */
K.route('/tools/ifa', () => {
  const rows = [
    [{ en: 'Low-birth-weight babies 0–6 months', or: 'କମ୍ ଓଜନର ଶିଶୁ ୦–୬ ମାସ' }, { en: 'IFA drops in the dose prescribed by the paediatrician', or: 'ଶିଶୁରୋଗ ବିଶେଷଜ୍ଞଙ୍କ ଲେଖାଥିବା ମାତ୍ରାରେ ଆଇ.ଏଫ୍.ଏ. ଡ୍ରପ୍' }, { en: '–', or: '–' }],
    [{ en: '6–59 months', or: '୬–୫୯ ମାସ' }, PREV.c6, { en: '12–24 months: ½ tablet; 24–59 months: 1 tablet — twice a year', or: '୧୨–୨୪ ମାସ: ଅଧା ବଟିକା; ୨୪–୫୯ ମାସ: ଗୋଟିଏ ବଟିକା — ବର୍ଷକୁ ଦୁଇଥର' }],
    [{ en: '5–9 years', or: '୫–୯ ବର୍ଷ' }, PREV.c5, { en: '1 tablet twice a year', or: 'ବର୍ଷକୁ ଦୁଇଥର ଗୋଟିଏ ବଟିକା' }],
    [{ en: '10–19 years', or: '୧୦–୧୯ ବର୍ଷ' }, PREV.a, { en: '1 tablet twice a year', or: 'ବର୍ଷକୁ ଦୁଇଥର ଗୋଟିଏ ବଟିକା' }],
    [{ en: 'Women 20–49 years (not pregnant, not breastfeeding)', or: 'ମହିଳା ୨୦–୪୯ ବର୍ଷ (ଗର୍ଭବତୀ ନୁହଁନ୍ତି, ସ୍ତନ୍ୟପାନ କରାଉନାହାନ୍ତି)' }, { en: '1 red IFA tablet (60 mg) once a week', or: 'ସପ୍ତାହକୁ ଥରେ ଗୋଟିଏ ଲାଲ୍ ଆଇ.ଏଫ୍.ଏ. ବଟିକା (୬୦ ମି.ଗ୍ରା.)' }, { en: '1 tablet twice a year', or: 'ବର୍ଷକୁ ଦୁଇଥର ଗୋଟିଏ ବଟିକା' }],
    [{ en: 'Pregnant women', or: 'ଗର୍ଭବତୀ ମହିଳା' }, PREV.p, { en: '1 tablet once, after the first 3 months (preferably in the 2nd trimester)', or: 'ପ୍ରଥମ ତିନି ମାସ ପରେ ଥରେ ଗୋଟିଏ ବଟିକା (ଦ୍ୱିତୀୟ ତ୍ରୟମାସରେ)' }],
    [{ en: 'Breastfeeding mothers (0–6 months after delivery)', or: 'ସ୍ତନ୍ୟପାନ କରାଉଥିବା ମା’ (ପ୍ରସବ ପରେ ୦–୬ ମାସ)' }, PREV.l, { en: '–', or: '–' }],
  ];
  return page('ifa', h`<div class="table"><table><thead><tr><th>${T('ti.who')}</th><th>${T('ti.ifa')}</th><th>${T('ti.worm')}</th></tr></thead>
      <tbody>${rows.map(r => h`<tr><td><b>${K.L(r[0])}</b></td><td class="small">${K.L(r[1])}</td><td class="small">${K.L(r[2])}</td></tr>`)}</tbody></table></div>
    <p class="small" style="margin-top:10px">${T('an.acute')}</p>${K.ui.callout('info', '', T('an.v2026'))}
    ${src('Anaemia Mukt Bharat Abhiyaan operational guidelines (MoHFW, June 2026), chapters 3 and 5; National Deworming Day rounds in February and August; Odisha MCP card p.43.')}`);
});
