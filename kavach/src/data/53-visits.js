/* ============================================================================
   data/53-visits — ASHA home-visit schedules for newborns and young children.
   The setting `visitPlan` picks one; SSBSK is the default.

   SSBSK — Samagra Shishu Bal Swasthya Karyakram (MoHFW; launched 29 June 2026;
   Operational Guidelines 2026, Table 3.1 and Fig. 4.1). HBNC and HBYC are
   merged into one programme from birth to 36 months:
     healthy newborn, facility birth: day 3, 7, 14, 42 (the first visit on the
       day of discharge or day 3)
     birth at home: within 24 hours (day 1), then day 3, 7, 14, 42
     'at-risk' newborn: day 1, 3, 5, 7, 10, 14, 21, 28, 42 — day 1 = day of
       delivery or day of discharge; facility follow-up within 8 days of life.
       At risk: birth weight < 2.5 kg, preterm, not started on breast milk or
       unable to breastfeed, admitted to / discharged from SNCU, NBSU, MNCU or
       NICU, birth defect, not back to birth weight by day 14.
     young child: 3, 6, 9, 12, 18, 24, 30, 36 months
   In the app, day numbers for babies at home are days of life (day 1 = day of
   birth); a facility birth's first visit is day 3. Babies discharged from the
   SNCU / NBSU have their own schedule counted from discharge.

   HBNC + HBYC — as printed on the Odisha MCP card V-2023-24 (pp.7, 10):
     newborn day 3, 7, 14, 21, 28, 42 (+ day 1 for births at home); SNCU / NBSU
     graduates day 1, 3, 7, 14, 21, 28, 42 after discharge; young child 3, 6,
     9, 12, 15 months.
   ============================================================================ */
K.visits = {
  PLANS: {
    ssbsk: { newborn: [3, 7, 14, 42], home: [1, 3, 7, 14, 42], atRisk: [1, 3, 5, 7, 10, 14, 21, 28, 42], sncu: [1, 3, 5, 7, 10, 14, 21, 28, 42], child: [3, 6, 9, 12, 18, 24, 30, 36], childEnd: 36 },
    hbnc: { newborn: [3, 7, 14, 21, 28, 42], home: [1, 3, 7, 14, 21, 28, 42], atRisk: null, sncu: [1, 3, 7, 14, 21, 28, 42], child: [3, 6, 9, 12, 15], childEnd: 15 },
  },
  plan: () => (K.settings.get('visitPlan') === 'hbnc' ? 'hbnc' : 'ssbsk'),
  get: () => K.visits.PLANS[K.visits.plan()],
  /* every month any plan visits at, so records kept under the other plan still show */
  ALL_MONTHS: [3, 6, 9, 12, 15, 18, 24, 30, 36],
};
/* SSBSK 'at-risk' newborn, from what the card records */
K.visits.atRisk = (k) => {
  if (!k) return false; const b = k.birth || {};
  if (k.birthWeight != null && k.birthWeight < 2.5) return true;
  if (k.gaWeeks != null && k.gaWeeks < 37) return true;
  if (b.bf === 'late' || +b.sncu === 1 || +b.extraCare === 1) return true;
  if (k.birthWeight != null && k.dob) { // not back to birth weight by day 14
    const w = (k.hbnc || []).map(x => ({ date: x.date, wt: x.weight })).concat(k.growth || []).filter(x => x && x.date && x.wt != null && K.d.diff(k.dob, x.date) >= 13);
    if (w.some(x => +x.wt < k.birthWeight)) return true;
  }
  return false;
};
/* newborn visit days for the mother and the babies at home */
K.visits.newbornDays = (place, atRisk) => {
  const P = K.visits.get(); const home = place && place !== 'inst';
  if (P.atRisk && atRisk) return home ? P.atRisk : P.atRisk.filter(d => d >= 3);
  return home ? P.home : P.newborn;
};
K.visits.TEXT = {
  ssbsk: {
    name: { en: 'SSBSK', or: 'SSBSK' },
    pnc: { en: 'SSBSK (from June 2026): the ASHA visits mother and baby on days 3, 7, 14 and 42 after delivery, and within 24 hours of a birth at home. Stay 48 hours in hospital after delivery.', or: 'SSBSK (ଜୁନ୍ ୨୦୨୬ ରୁ): ଆଶାକର୍ମୀ ପ୍ରସବ ପରେ ୩ୟ, ୭ମ, ୧୪ ଓ ୪୨ ଦିନରେ ମା\' ଓ ଶିଶୁଙ୍କୁ ଗୃହ ପରିଦର୍ଶନ କରିବେ, ଘରେ ଜନ୍ମ ହେଲେ ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ ମଧ୍ୟ। ପ୍ରସବ ପରେ ୪୮ ଘଣ୍ଟା ଡାକ୍ତରଖାନାରେ ରୁହନ୍ତୁ।' },
    risk: { en: 'A baby who needs extra care (under 2.5 kg, born before 37 weeks, not breastfed in the first day, or with a birth defect) is visited on days 1, 3, 5, 7, 10, 14, 21, 28 and 42, and should be checked at a health facility within 8 days of birth.', or: 'ଅଧିକ ଯତ୍ନ ଆବଶ୍ୟକ ଶିଶୁ (୨.୫ କି.ଗ୍ରା.ରୁ କମ୍ ଓଜନ, ୩୭ ସପ୍ତାହ ପୂର୍ବରୁ ଜନ୍ମ, ପ୍ରଥମ ଦିନ ସ୍ତନ୍ୟପାନ ଆରମ୍ଭ ହୋଇନଥିବା, ବା ଜନ୍ମଗତ ତ୍ରୁଟି ଥିବା) ୧ମ, ୩ୟ, ୫ମ, ୭ମ, ୧୦ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ପରିଦର୍ଶନ ପାଇବେ, ଓ ଜନ୍ମର ୮ ଦିନ ମଧ୍ୟରେ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ଯାଞ୍ଚ ହେବା ଉଚିତ୍।' },
    sncu: { en: 'A baby discharged from the SNCU / NBSU is visited on days 1, 3, 5, 7, 10, 14, 21, 28 and 42 after discharge (SSBSK).', or: 'SNCU / NBSU ରୁ ଡିସ୍‌ଚାର୍ଜ ହୋଇଥିବା ଶିଶୁଙ୍କୁ ଡିସ୍‌ଚାର୍ଜର ୧ମ, ୩ୟ, ୫ମ, ୭ମ, ୧୦ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ଗୃହ ପରିଦର୍ଶନ (SSBSK)।' },
    child: { en: 'The ASHA visits at 3, 6, 9, 12, 18, 24, 30 and 36 months to check growth, feeding, development and vaccines (SSBSK).', or: 'ଆଶା ଦିଦି ୩, ୬, ୯, ୧୨, ୧୮, ୨୪, ୩୦ ଓ ୩୬ ମାସରେ ଘରକୁ ଆସି ଶିଶୁର ବୃଦ୍ଧି, ଖାଦ୍ୟ, ବିକାଶ ଓ ଟୀକା ଯାଞ୍ଚ କରିବେ (SSBSK)।' },
    over: { en: 'SSBSK home visits are for children up to 3 years.', or: 'SSBSK ଗୃହ ପରିଦର୍ଶନ ୩ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ଶିଶୁଙ୍କ ପାଇଁ।' },
  },
  hbnc: {
    name: { en: 'HBYC', or: 'HBYC' },
    pnc: { en: 'The ASHA visits on days 3, 7, 14, 21, 28 and 42 after delivery (also day 1 if born at home). Stay 48 hours in hospital after delivery.', or: 'ପ୍ରସବ ପରେ ଆଶାକର୍ମୀ ୩ୟ, ୭ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ଗୃହ ପରିଦର୍ଶନ କରିବେ (ଘରେ ଜନ୍ମ ହୋଇଥିଲେ ୧ମ ଦିନ ମଧ୍ୟ)। ପ୍ରସବ ପରେ ୪୮ ଘଣ୍ଟା ଡାକ୍ତରଖାନାରେ ରୁହନ୍ତୁ।' },
    risk: { en: 'Babies under 2.5 kg at birth get three extra visits.', or: '୨.୫ କି.ଗ୍ରା.ରୁ କମ୍ ଓଜନର ଶିଶୁଙ୍କ ପାଇଁ ତିନୋଟି ଅଧିକ ପରିଦର୍ଶନ।' },
    sncu: { en: 'A baby who was admitted to the SNCU / NBSU is visited by the ASHA on days 1, 3, 7, 14, 21, 28 and 42 after discharge.', or: 'SNCU / NBSU ରେ ଭର୍ତ୍ତି ହୋଇଥିବା ଶିଶୁଙ୍କୁ ଆଶାକର୍ମୀ ଡିସ୍‌ଚାର୍ଜର ୧ମ, ୩ୟ, ୭ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନରେ ଗୃହ ପରିଦର୍ଶନ କରିବେ।' },
    child: { en: 'The ASHA visits at 3, 6, 9, 12 and 15 months to check growth, feeding, development and vaccines.', or: 'ଆଶା ଦିଦି ୩, ୬, ୯, ୧୨ ଓ ୧୫ ମାସରେ ଘରକୁ ଆସି ଶିଶୁର ବୃଦ୍ଧି, ଖାଦ୍ୟ, ବିକାଶ ଓ ଟୀକା ଯାଞ୍ଚ କରିବେ।' },
    over: { en: 'HBYC visits are for children aged 3 to 15 months.', or: 'HBYC ପରିଦର୍ଶନ ୩ ରୁ ୧୫ ମାସ ବୟସର ଶିଶୁଙ୍କ ପାଇଁ।' },
  },
};
K.visits.text = (key) => K.L(K.visits.TEXT[K.visits.plan()][key]);
/* Learn: home visits under SSBSK (written for the app from the 2026 guidelines) */
K.content = K.content || {};
K.content.visitsSsbsk = [
  { icon: 'house', en: 'SSBSK (Samagra Shishu Bal Swasthya Karyakram, from June 2026) joins the newborn and young-child home visits into one programme up to 3 years.', or: 'ସମଗ୍ର ଶିଶୁ ବାଳ ସ୍ୱାସ୍ଥ୍ୟ କାର୍ଯ୍ୟକ୍ରମ (SSBSK, ଜୁନ୍ ୨୦୨୬ ରୁ) ନବଜାତ ଶିଶୁ ଓ ଛୋଟ ପିଲାଙ୍କ ଗୃହ ପରିଦର୍ଶନକୁ ୩ ବର୍ଷ ପର୍ଯ୍ୟନ୍ତ ଗୋଟିଏ କାର୍ଯ୍ୟକ୍ରମରେ ଯୋଡ଼ିଛି।' },
  { icon: 'house', en: 'Every newborn: the ASHA visits on days 3, 7, 14 and 42, and within 24 hours of a birth at home.', or: 'ପ୍ରତ୍ୟେକ ନବଜାତ ଶିଶୁ: ଆଶାକର୍ମୀ ୩ୟ, ୭ମ, ୧୪ ଓ ୪୨ ଦିନରେ ଗୃହ ପରିଦର୍ଶନ କରିବେ, ଘରେ ଜନ୍ମ ହେଲେ ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ ମଧ୍ୟ।' },
  { icon: 'scale', en: 'A baby who needs extra care (under 2.5 kg, born early, not breastfed, a birth defect, or home from the SNCU) gets 9 visits — days 1, 3, 5, 7, 10, 14, 21, 28 and 42 — and a check at the health facility within 8 days of birth.', or: 'ଅଧିକ ଯତ୍ନ ଆବଶ୍ୟକ ଶିଶୁ (୨.୫ କି.ଗ୍ରା.ରୁ କମ୍, ସମୟ ପୂର୍ବରୁ ଜନ୍ମ, ସ୍ତନ୍ୟପାନ କରୁନଥିବା, ଜନ୍ମଗତ ତ୍ରୁଟି, ବା SNCU ରୁ ଫେରିଥିବା) ୯ଟି ପରିଦର୍ଶନ ପାଇବେ — ୧ମ, ୩ୟ, ୫ମ, ୭ମ, ୧୦ମ, ୧୪, ୨୧, ୨୮ ଓ ୪୨ ଦିନ — ଓ ଜନ୍ମର ୮ ଦିନ ମଧ୍ୟରେ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ଯାଞ୍ଚ।' },
  { icon: 'calendar', en: 'Young child: home visits at 3, 6, 9, 12, 18, 24, 30 and 36 months.', or: 'ଛୋଟ ପିଲା: ୩, ୬, ୯, ୧୨, ୧୮, ୨୪, ୩୦ ଓ ୩୬ ମାସରେ ଗୃହ ପରିଦର୍ଶନ।' },
];
