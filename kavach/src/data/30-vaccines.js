/* ============================================================================
   data/30-vaccines — National Immunization Schedule (UIP, MoHFW) as used on
   the Odisha MCP card V-2023-24, with the limits of the NIS table
   (Immunization Handbook for Medical Officers 2017, Unit 2):
   BCG ≤1 y · OPV-0 ≤15 d · Hep B birth dose ≤24 h · OPV ≤5 y · MR ≤5 y ·
   JE ≤15 y (endemic districts only; JE-1 given after 12 months → at least
   3 months before JE-2, NIS footnote @) · DPT ≤7 y · PCV & fIPV 1→2 gap 8 wk.
   Late starters (NHM Odisha UIP training deck 2024, slides 12–14): Penta,
   Rota, PCV and fIPV are not started after 1 year, and a series begun before
   1 year is completed by 2 years. A Penta dose that can no longer be given is
   given as DPT (doses 4 weeks apart, up to 7 years) — `for` links each DPT
   dose to the Penta dose it replaces, `prevAlt` is the earlier dose when the
   child stayed on Penta. DPT and OPV boosters: at least 6 months after the
   3rd dose (`gapM`). `win` = end of the NIS window (9–12 m, 16–24 m, 5–6 y):
   a dose is 'due' until then and 'overdue' after.
   fIPV-3 at 9 months (added 2023). HPV: one dose of Gardasil-4 for girls aged
   14 — national drive from 28 Feb 2026, then on routine immunisation days
   (PIB, 28 Feb 2026). No schedule change in PIB's 17 Mar 2026 UIP summary.
   Ages: d = days, w = weeks, m = months, y = years from date of birth.
   ============================================================================ */
K.vax = K.vax || {};
K.vax.VISITS = [
  { k: 'birth', due: { d: 0 }, name: { en: 'At birth', or: 'ଜନ୍ମ ସମୟରେ' }, sub: { en: 'Within 24 hours of birth', or: 'ଜନ୍ମର ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ' } },
  { k: 'w6', due: { w: 6 }, name: { en: '6 weeks (1½ months)', or: 'ଦେଢ଼ ମାସ (୬ ସପ୍ତାହ)' } },
  { k: 'w10', due: { w: 10 }, name: { en: '10 weeks (2½ months)', or: 'ଅଢ଼େଇ ମାସ (୧୦ ସପ୍ତାହ)' } },
  { k: 'w14', due: { w: 14 }, name: { en: '14 weeks (3½ months)', or: 'ସାଢ଼େ ତିନି ମାସ (୧୪ ସପ୍ତାହ)' } },
  { k: 'm9', due: { m: 9 }, name: { en: '9 months', or: '୯ ମାସ' }, sub: { en: '9–12 months', or: '୯–୧୨ ମାସ' } },
  { k: 'm16', due: { m: 16 }, name: { en: '16–24 months', or: '୧୬–୨୪ ମାସ' } },
  { k: 'y5', due: { y: 5 }, name: { en: '5–6 years', or: '୫–୬ ବର୍ଷ' } },
  { k: 'y10', due: { y: 10 }, name: { en: '10 years', or: '୧୦ ବର୍ଷ' } },
  { k: 'y14', due: { y: 14 }, name: { en: '14 years (girls)', or: '୧୪ ବର୍ଷ (ଝିଅ)' } },
  { k: 'y16', due: { y: 16 }, name: { en: '16 years', or: '୧୬ ବର୍ଷ' } },
];
const P = {
  bcg: { en: 'Tuberculosis', or: 'ଯକ୍ଷ୍ମା' },
  hepb: { en: 'Hepatitis B (liver disease)', or: 'ହେପାଟାଇଟିସ୍ ବି (ଯକୃତ ରୋଗ)' },
  polio: { en: 'Polio', or: 'ପୋଲିଓ' },
  penta: { en: 'Whooping cough, diphtheria, tetanus, hepatitis B and Hib infections', or: 'କଳାକାଶ, ଡିପ୍‌ଥେରିଆ, ଧନୁଷ୍ଟଙ୍କାର, ହେପାଟାଇଟିସ୍ ବି ଓ ହିବ୍ ସଂକ୍ରମଣ' },
  rota: { en: 'Diarrhoea (rotavirus)', or: 'ତରଳ ଝାଡ଼ା (ରୋଟାଭାଇରସ୍)' },
  pcv: { en: 'Pneumonia', or: 'ନିମୋନିଆ' },
  mr: { en: 'Measles and rubella', or: 'ମିଳିମିଳା ଓ ରୁବେଲା' },
  je: { en: 'Brain fever (Japanese encephalitis)', or: 'ମସ୍ତିଷ୍କ ଜ୍ୱର (ଜାପାନିଜ୍ ଏନ୍‌ସେଫାଲାଇଟିସ୍)' },
  dpt: { en: 'Whooping cough, diphtheria and tetanus', or: 'କଳାକାଶ, ଡିପ୍‌ଥେରିଆ ଓ ଧନୁଷ୍ଟଙ୍କାର' },
  td: { en: 'Tetanus and diphtheria', or: 'ଧନୁଷ୍ଟଙ୍କାର ଓ ଡିପ୍‌ଥେରିଆ' },
  hpv: { en: 'Cervical cancer (HPV)', or: 'ଜରାୟୁ ମୁଖ କର୍କଟ (HPV)' },
  vita: { en: 'Night blindness and infections', or: 'ରାତିକଣା ଓ ସଂକ୍ରମଣ' },
};
/* id, code (as printed on the card), visit, due, limits, series links */
K.vax.LIST = [
  { id: 'BCG', code: 'BCG', v: 'birth', due: { d: 0 }, upto: { y: 1 }, p: P.bcg, how: '0.1 ml (0.05 ml < 1 month) · intradermal · left upper arm' },
  { id: 'OPV0', code: 'OPV-0', v: 'birth', due: { d: 0 }, upto: { d: 15 }, p: P.polio, how: '2 drops · oral' },
  { id: 'HepB0', code: 'Hep B birth dose', v: 'birth', due: { d: 0 }, upto: { d: 1 }, p: P.hepb, how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'OPV1', code: 'OPV-1', v: 'w6', due: { w: 6 }, upto: { y: 5 }, p: P.polio, how: '2 drops · oral' },
  { id: 'Penta1', code: 'Penta-1', v: 'w6', due: { w: 6 }, start: { y: 1 }, p: P.penta, alt: 'dpt', how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'DPT1', code: 'DPT-1', v: 'w6', due: { y: 1 }, upto: { y: 7 }, for: 'Penta1', p: P.dpt, how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'Rota1', code: 'Rota-1', v: 'w6', due: { w: 6 }, start: { y: 1 }, p: P.rota, how: '5 drops · oral (Rotavac; other brands: dose on the label)' },
  { id: 'fIPV1', code: 'f-IPV-1', v: 'w6', due: { w: 6 }, start: { y: 1 }, p: P.polio, how: '0.1 ml · intradermal · right upper arm' },
  { id: 'PCV1', code: 'PCV-1', v: 'w6', due: { w: 6 }, start: { y: 1 }, p: P.pcv, how: '0.5 ml · IM · anterolateral mid-thigh (right)' },
  { id: 'OPV2', code: 'OPV-2', v: 'w10', due: { w: 10 }, upto: { y: 5 }, prev: 'OPV1', gap: 28, p: P.polio, how: '2 drops · oral' },
  { id: 'Penta2', code: 'Penta-2', v: 'w10', due: { w: 10 }, upto: { y: 2 }, prev: 'Penta1', gap: 28, alt: 'dpt', p: P.penta, how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'DPT2', code: 'DPT-2', v: 'w10', due: { y: 1 }, upto: { y: 7 }, for: 'Penta2', prev: 'DPT1', prevAlt: 'Penta1', gap: 28, p: P.dpt, how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'Rota2', code: 'Rota-2', v: 'w10', due: { w: 10 }, upto: { y: 2 }, prev: 'Rota1', gap: 28, p: P.rota, how: '5 drops · oral (Rotavac; other brands: dose on the label)' },
  { id: 'OPV3', code: 'OPV-3', v: 'w14', due: { w: 14 }, upto: { y: 5 }, prev: 'OPV2', gap: 28, p: P.polio, how: '2 drops · oral' },
  { id: 'Penta3', code: 'Penta-3', v: 'w14', due: { w: 14 }, upto: { y: 2 }, prev: 'Penta2', gap: 28, alt: 'dpt', p: P.penta, how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'DPT3', code: 'DPT-3', v: 'w14', due: { y: 1 }, upto: { y: 7 }, for: 'Penta3', prev: 'DPT2', prevAlt: 'Penta2', gap: 28, p: P.dpt, how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'Rota3', code: 'Rota-3', v: 'w14', due: { w: 14 }, upto: { y: 2 }, prev: 'Rota2', gap: 28, p: P.rota, how: '5 drops · oral (Rotavac; other brands: dose on the label)' },
  { id: 'fIPV2', code: 'f-IPV-2', v: 'w14', due: { w: 14 }, upto: { y: 2 }, prev: 'fIPV1', gap: 56, p: P.polio, how: '0.1 ml · intradermal · right upper arm' },
  { id: 'PCV2', code: 'PCV-2', v: 'w14', due: { w: 14 }, upto: { y: 2 }, prev: 'PCV1', gap: 56, p: P.pcv, how: '0.5 ml · IM · anterolateral mid-thigh (right)' },
  { id: 'MR1', code: 'MR-1', v: 'm9', due: { m: 9 }, win: { m: 12 }, upto: { y: 5 }, p: P.mr, how: '0.5 ml · subcutaneous · right upper arm' },
  { id: 'JE1', code: 'JE-1', v: 'm9', due: { m: 9 }, win: { m: 12 }, upto: { y: 15 }, je: 1, p: P.je, how: '0.5 ml · subcutaneous · left upper arm (live SA-14-14-2; IM if the inactivated vaccine is supplied)' },
  { id: 'fIPV3', code: 'f-IPV-3', v: 'm9', due: { m: 9 }, win: { m: 12 }, upto: { y: 2 }, prev: 'fIPV2', gap: 28, p: P.polio, how: '0.1 ml · intradermal · left upper arm' },
  { id: 'PCVB', code: 'PCV booster', v: 'm9', due: { m: 9 }, win: { m: 12 }, upto: { y: 2 }, prev: 'PCV2', gap: 56, p: P.pcv, how: '0.5 ml · IM · anterolateral mid-thigh (right)' },
  { id: 'MR2', code: 'MR-2', v: 'm16', due: { m: 16 }, win: { m: 24 }, upto: { y: 5 }, prev: 'MR1', gap: 28, p: P.mr, how: '0.5 ml · subcutaneous · right upper arm' },
  { id: 'OPVB', code: 'OPV booster', v: 'm16', due: { m: 16 }, win: { m: 24 }, upto: { y: 5 }, prev: 'OPV3', gapM: 6, p: P.polio, how: '2 drops · oral' },
  { id: 'JE2', code: 'JE-2', v: 'm16', due: { m: 16 }, win: { m: 24 }, upto: { y: 15 }, prev: 'JE1', gap: 28, lateGapM: 3, je: 1, p: P.je, how: '0.5 ml · subcutaneous · left upper arm (live SA-14-14-2; IM if the inactivated vaccine is supplied)' },
  { id: 'DPTB1', code: 'DPT booster-1', v: 'm16', due: { m: 16 }, win: { m: 24 }, upto: { y: 7 }, prev: 'DPT3', prevAlt: 'Penta3', gapM: 6, p: P.dpt, how: '0.5 ml · IM · anterolateral mid-thigh' },
  { id: 'DPTB2', code: 'DPT booster-2', v: 'y5', due: { y: 5 }, win: { y: 6 }, upto: { y: 7 }, prev: 'DPTB1', gap: 168, p: P.dpt, how: '0.5 ml · IM · upper arm' },
  { id: 'Td10', code: 'Td-10', v: 'y10', due: { y: 10 }, p: P.td, how: '0.5 ml · IM · upper arm' },
  { id: 'HPV', code: 'HPV', v: 'y14', due: { y: 14 }, win: { y: 15 }, upto: { y: 15 }, sex: 'f', campaign: 1, p: P.hpv, how: '0.5 ml · IM · upper arm (deltoid) · single dose' },
  { id: 'Td16', code: 'Td-16', v: 'y16', due: { y: 16 }, p: P.td, how: '0.5 ml · IM · upper arm' },
];
/* Vitamin A: 1 lakh IU at 9 m, then 2 lakh IU every 6 months to 5 years (9 doses).
   Odisha card: Vit-A 2 at 18 m … Vit-A 9 at 60 m, each "& Albendazole syrup".
   The dose follows the age on the day: 1 lakh IU (1 ml) under 12 months, 2 lakh IU
   (2 ml) from 12 months — so a late first dose is 2 ml (NIS table; WHO 2011).
   Albendazole twice a year from 12 months (both MCP cards' deworming table starts at
   1–2 years with two doses; AMB 2026 ch.5): an albendazole-only dose at 12 months
   (stored as alb[0]), then with Vit-A 2–9. 200 mg under 2 years, 400 mg from 2 years. */
K.vax.VITA = [9, 18, 24, 30, 36, 42, 48, 54, 60].map((m, i) => ({ id: 'VitA' + (i + 1), n: i + 1, m, code: 'Vit-A ' + (i + 1), alb: i > 0 }));
K.vax.ALB0 = { n: 0, m: 12, code: 'Albendazole' };
K.vax.vitaDose = (ageM) => (ageM < 12 ? '1 lakh IU (1 ml)' : '2 lakh IU (2 ml)');
K.vax.albDose = (ageM) => (ageM < 24 ? '200 mg' : '400 mg');
K.vax.P = P;
K.vax.FOUR = [
  { icon: 'syringe', t: { en: 'Which vaccine was given, and what disease it protects from', or: 'କେଉଁ ଟୀକା ଦିଆଯାଇଛି, କେଉଁ ରୋଗରୁ ସୁରକ୍ଷା ମିଳେ' } },
  { icon: 'alert', t: { en: 'Normal reactions after the vaccine; contact the ANM for any side effect. Wait at least 30 minutes at the vaccination centre.', or: 'ସ୍ୱାଭାବିକ ପ୍ରତିକ୍ରିୟା / କୌଣସି ପାର୍ଶ୍ୱ ପ୍ରତିକ୍ରିୟା ଘଟିବା ପରେ ମହିଳା ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କୁ ଯୋଗାଯୋଗ କରିବେ। (ଟୀକା ନେବାପରେ ଟୀକାକରଣ କେନ୍ଦ୍ରରେ ଅତି କମ୍‌ରେ ୩୦ ମିନିଟ୍ ଅପେକ୍ଷା କରନ୍ତୁ)' } },
  { icon: 'calendar', t: { en: 'The next vaccine: which date, what time, which vaccine, and where', or: 'ପରବର୍ତ୍ତୀ ଟୀକା: କେଉଁ ତାରିଖ, କେଉଁ ସମୟ, କେଉଁ ଟୀକା, କେଉଁ ସ୍ଥାନରେ ଦିଆଯିବ' } },
  { icon: 'shield', t: { en: 'Keep the Mother and Child Protection card safe and bring it to every vaccination', or: "ମା' ଓ ଶିଶୁ ସୁରକ୍ଷା କାର୍ଡ ସାଇତି ରଖନ୍ତୁ ଓ ଟୀକାକରଣ ସମୟରେ ମନେରଖି ସାଙ୍ଗରେ ଆଣନ୍ତୁ" } },
];
K.vax.KNOW = [
  { en: 'If the child is unwell before or after vaccination, tell the health worker.', or: 'ଟୀକାଦାନ ପୂର୍ବରୁ ଓ ପରେ ଶିଶୁ ଅସୁସ୍ଥ ହେଲେ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କୁ ଜଣାନ୍ତୁ।' },
  { en: 'Do not give breast milk or water while the child is crying hard, asleep, unconscious or having fits.', or: 'ଶିଶୁ କାନ୍ଦିବାବେଳେ, ଶୋଇବାବେଳେ, ଅଚେତ ଥିଲେ, ବାତ ମାରିଲେ ମା\'କ୍ଷୀର କିମ୍ବା ପାଣି ପିଆନ୍ତୁ ନାହିଁ।' },
  { en: 'For fever, give paracetamol drops/syrup as advised and sponge the body with a wet cloth.', or: 'ଜ୍ୱର ହେଲେ ପାରାସିଟାମଲ୍ ଡ୍ରପ୍/ସିରପ୍ ଖୁଆନ୍ତୁ ଓ ଓଦା କନାରେ ଦେହକୁ ପୋଛନ୍ତୁ।' },
  { en: 'If the injection site turns red and swollen, put a cold cloth on it and tell the health worker.', or: 'ଟୀକାନେବା ସ୍ଥାନ ଲାଲ୍ ହୋଇ ଫୁଲିଲେ ଥଣ୍ଡା କପଡ଼ା ପକାନ୍ତୁ ଓ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କୁ ଜଣାନ୍ତୁ।' },
  { en: 'Wait half an hour at the vaccination centre after the vaccine.', or: 'ଟୀକାନେବା ପରେ ଅଧଘଣ୍ଟା ଟୀକାଦାନ କେନ୍ଦ୍ରରେ ଅପେକ୍ଷା କରନ୍ତୁ।' },
  { en: 'If the child has a fit, carry the child to hospital lying face-down across your lap, head lower than the body.', or: 'ଶିଶୁକୁ ବାତ ମାରିଲେ ଡାକ୍ତରଖାନାକୁ ନେଲାବେଳେ କୋଳରେ ମୁହଁମାଡ଼ି ଶୁଆଇ ରଖି ନିଅନ୍ତୁ। ଦେହଠାରୁ ମୁଣ୍ଡ ତଳକୁ ରହିବା ଉଚିତ୍।' },
  { en: 'A small swelling or wound at the BCG site is normal; it heals into a small scar.', or: 'ବିସିଜି ସ୍ଥାନରେ ଛୋଟ ଫୁଲା ବା ଘା ସ୍ୱାଭାବିକ; ଏହା ଛୋଟ ଦାଗ ହୋଇ ଶୁଖିଯାଏ।' },
];
