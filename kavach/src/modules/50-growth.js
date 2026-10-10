/* ============================================================================
   modules/50-growth — WHO Child Growth Standards: z-scores, charts, status
   z = ((y/M)^L − 1)/(L·S); weight-based indicators use the WHO restricted
   method beyond ±3 SD (as in the WHO anthro package). Length < 731 days,
   height ≥ 731 days (±0.7 cm if measured the other way). Preterm babies
   under 2 years are assessed at corrected age.
   Classification (WHO; MCP card zones): WAZ < −2 moderately, < −3 severely
   underweight · HAZ < −2 stunted · WHZ < −2 wasted (MAM), < −3 SAM ·
   MUAC (6–59 m) < 11.5 cm SAM, 11.5–12.4 MAM · bilateral pitting oedema = SAM.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'gr.title': { en: 'Growth', or: 'ଶାରୀରିକ ବୃଦ୍ଧି' },
  'gr.add': { en: 'Add weight / height', or: 'ଓଜନ / ଉଚ୍ଚତା ଯୋଗ କରନ୍ତୁ' },
  'gr.edit': { en: 'Edit measurement', or: 'ମାପ ସଂଶୋଧନ' },
  'gr.date': { en: 'Date measured', or: 'ମାପ ତାରିଖ' },
  'gr.weight': { en: 'Weight', or: 'ଓଜନ' },
  'gr.length': { en: 'Length / height', or: 'ଲମ୍ବା / ଉଚ୍ଚତା' },
  'gr.pos': { en: 'Measured', or: 'କିପରି ମପାଗଲା' }, 'gr.pos.L': { en: 'Lying down (length)', or: 'ଶୁଆଇ (ଲମ୍ବା)' }, 'gr.pos.H': { en: 'Standing (height)', or: 'ଠିଆ କରାଇ (ଉଚ୍ଚତା)' },
  'gr.hc': { en: 'Head circumference', or: 'ମୁଣ୍ଡର ପରିଧି' },
  'gr.muac': { en: 'Mid-upper arm circumference (MUAC)', or: 'ବାମହାତର ଉପର ବାହୁର ମଧ୍ୟଭାଗର ମୋଟେଇ (MUAC)' },
  'gr.oedema': { en: 'Swelling of both feet (pitting oedema)', or: 'ଦୁଇ ପାଦ ଫୁଲା (ଦବାଇଲେ ଗାତ ହୁଏ)' },
  'gr.save': { en: 'Save measurement', or: 'ମାପ ସେଭ୍ କରନ୍ତୁ' },
  'gr.none': { en: 'No weight recorded yet. Weigh the child every month at the Anganwadi centre.', or: 'ଏପର୍ଯ୍ୟନ୍ତ ଓଜନ ଲେଖାଯାଇନାହିଁ। ପ୍ରତ୍ୟେକ ମାସରେ ପିଲାର ଓଜନ ଅଙ୍ଗନୱାଡ଼ି କେନ୍ଦ୍ରରେ ନିଶ୍ଚିତ ମାପନ୍ତୁ।' },
  'gr.monthly': { en: 'Have your child weighed at the Anganwadi centre every month.', or: 'ପ୍ରତ୍ୟେକ ମାସରେ ପିଲାର ଓଜନ ଅଙ୍ଗନୱାଡ଼ି କେନ୍ଦ୍ରରେ ନିଶ୍ଚିତ ମାପନ୍ତୁ।' },
  'gr.wfa': { en: 'Weight-for-age', or: 'ବୟସ ଅନୁସାରେ ଓଜନ' }, 'gr.lhfa': { en: 'Length/height-for-age', or: 'ବୟସ ଅନୁସାରେ ଲମ୍ବା/ଉଚ୍ଚତା' },
  'gr.wfh': { en: 'Weight-for-length/height', or: 'ଲମ୍ବା / ଉଚ୍ଚତା ଅନୁସାରେ ଓଜନ' }, 'gr.hcfa': { en: 'Head circumference-for-age', or: 'ବୟସ ଅନୁସାରେ ମୁଣ୍ଡର ପରିଧି' },
  'gr.who': { en: 'As per WHO Child Growth Standards', or: 'ବିଶ୍ୱ ସ୍ୱାସ୍ଥ୍ୟ ସଂସ୍ଥାର ଶିଶୁ ଶାରୀରିକ ବୃଦ୍ଧି ଚାର୍ଟ ଅନୁସାରେ' },
  'gr.ageAxis': { en: 'Age (months)', or: 'ବୟସ (ମାସ)' }, 'gr.kg': { en: 'Weight (kg)', or: 'ଓଜନ (କି.ଗ୍ରା.)' }, 'gr.cmAxis': { en: 'Length/height (cm)', or: 'ଲମ୍ବା / ଉଚ୍ଚତା (ସେ.ମି.)' }, 'gr.hcAxis': { en: 'Head circumference (cm)', or: 'ମୁଣ୍ଡର ପରିଧି (ସେ.ମି.)' },
  'gr.range': { en: 'Show', or: 'ଦେଖାନ୍ତୁ' }, 'gr.r1': { en: '0–1 y', or: '୦–୧ ବର୍ଷ' }, 'gr.r2': { en: '0–2 y', or: '୦–୨ ବର୍ଷ' }, 'gr.r5': { en: '0–5 y', or: '୦–୫ ବର୍ଷ' },
  'gr.history': { en: 'Measurements', or: 'ମାପ ତାଲିକା' },
  'gr.corrected': { en: 'Corrected age used (born early)', or: 'ସଂଶୋଧିତ ବୟସ ବ୍ୟବହୃତ (ସମୟ ପୂର୍ବରୁ ଜନ୍ମ)' },
  'gr.falter': { en: 'Weight has not increased since the last weighing. A flat or falling line is a warning: check feeding and illness, and talk to the AWW/ANM.', or: 'ଗତ ଓଜନଠାରୁ ଓଜନ ବଢ଼ିନାହିଁ। ସମତଳ ବା ତଳକୁ ଯାଉଥିବା ରେଖା ସତର୍କ ସଙ୍କେତ: ଖାଦ୍ୟ ଓ ଅସୁସ୍ଥତା ଯାଞ୍ଚ କରନ୍ତୁ ଓ ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ/ଏ.ଏନ୍.ଏମ୍.ଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।' },
  'gr.good': { en: 'Growing well. Keep the line going up: weigh every month.', or: 'ଭଲ ଭାବେ ବଢ଼ୁଛି। ରେଖା ଉପରକୁ ଯାଉଥିବା ଦରକାର: ପ୍ରତି ମାସ ଓଜନ କରନ୍ତୁ।' },
  'gr.zone.n': { en: 'Normal weight', or: 'ସ୍ୱାଭାବିକ ଓଜନ' },
  'gr.zone.m': { en: 'Moderately underweight (−2 to −3 SD)', or: 'ସାଧାରଣଠାରୁ କମ୍ ଓଜନ (୨ ରୁ ୩ ଏସ୍ ଡି)' },
  'gr.zone.s': { en: 'Severely underweight (below −3 SD)', or: 'ସାଧାରଣଠାରୁ ଅତ୍ୟନ୍ତ କମ୍ ଓଜନ (୩ ଏସ୍ ଡିରୁ ତଳେ)' },
  'gr.zone.hi': { en: 'Above +2 SD: check weight-for-height', or: '+୨ SD ଉପରେ: ଉଚ୍ଚତା ଅନୁସାରେ ଓଜନ ଯାଞ୍ଚ କରନ୍ତୁ' },
  /* growth-line legend, as on the MCP card (Odisha V-2023-24 p.27: ବିକାଶ ବକ୍ରରେଖା) */
  'gr.curve': { en: 'Growth line', or: 'ବିକାଶ ବକ୍ରରେଖା' },
  'gr.curve.up': { en: 'Going up: good', or: 'ଉପରକୁ: ଉତ୍ତମ' },
  'gr.curve.flat': { en: 'Flat: dangerous', or: 'ସମତଳ: ବିପଦପୂର୍ଣ୍ଣ' },
  'gr.curve.down': { en: 'Going down: very dangerous', or: 'ତଳକୁ: ଅତ୍ୟନ୍ତ ବିପଦପୂର୍ଣ୍ଣ' },
  'gr.tab.wfa': { en: 'Weight-age', or: 'ବୟସ-ଓଜନ' }, 'gr.tab.lhfa': { en: 'Height-age', or: 'ବୟସ-ଉଚ୍ଚତା' }, 'gr.tab.wfh': { en: 'Weight-height', or: 'ଉଚ୍ଚତା-ଓଜନ' }, 'gr.tab.hcfa': { en: 'Head', or: 'ମୁଣ୍ଡ' },
  'gr.lg.normal': { en: 'Normal range (−2 to +2 SD)', or: 'ସ୍ୱାଭାବିକ (−୨ ରୁ +୨ SD)' },
  'gr.lg.m': { en: '−2 to −3 SD', or: '−୨ ରୁ −୩ SD' }, 'gr.lg.s': { en: 'Below −3 SD', or: '−୩ SD ତଳେ' }, 'gr.lg.hi': { en: 'Above +2 SD', or: '+୨ SD ଉପରେ' },
  'gr.adv.m': { en: 'Talk to the AWW/ANM. Give 1–2 extra meals or snacks a day, keep breastfeeding, give the take-home ration, and weigh again in a month.', or: 'ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ/ଏ.ଏନ୍.ଏମ୍.ଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ। ଦିନକୁ ୧–୨ ଥର ଅଧିକ ଖାଦ୍ୟ ଦିଅନ୍ତୁ, ସ୍ତନ୍ୟପାନ ଜାରି ରଖନ୍ତୁ, ଘରକୁ ନିଆଯାଉଥିବା ଖାଦ୍ୟ ଦିଅନ୍ତୁ ଓ ମାସକ ପରେ ପୁଣି ଓଜନ କରନ୍ତୁ।' },
  'gr.adv.s': { en: 'Talk to the AWW/ANM immediately. The child needs a medical check; if the child has severe acute malnutrition, treatment is given at the Nutrition Rehabilitation Centre (NRC) at the district hospital.', or: 'ତୁରନ୍ତ ଅଙ୍ଗନୱାଡ଼ି କର୍ମୀ/ଏ.ଏନ୍.ଏମ୍.ଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ। ପିଲାର ଡାକ୍ତରୀ ପରୀକ୍ଷା ଆବଶ୍ୟକ; ଅତିଶୟ ପୁଷ୍ଟିହୀନ ହେଲେ ଜିଲ୍ଲା ଚିକିତ୍ସାଳୟର ପୁଷ୍ଟି ପୁନର୍ବାସ କେନ୍ଦ୍ର (NRC) ରେ ଚିକିତ୍ସା ହୁଏ।' },
  'gr.sam': { en: 'Severe acute malnutrition (SAM)', or: 'ଅତିଶୟ ପୁଷ୍ଟିହୀନତା (SAM)' },
  'gr.mam': { en: 'Moderate acute malnutrition (MAM)', or: 'ମଧ୍ୟମ ପୁଷ୍ଟିହୀନତା (MAM)' },
  'gr.samDo': { en: 'Refer to the Nutrition Rehabilitation Centre (NRC) / doctor today. The mother staying with the child at the NRC gets ₹100 a day for lost wages (Odisha).', or: 'ଆଜି ହିଁ ପୁଷ୍ଟି ପୁନର୍ବାସ କେନ୍ଦ୍ର (NRC) / ଡାକ୍ତରଙ୍କ ପାଖକୁ ପଠାନ୍ତୁ। NRC ରେ ପିଲା ସହ ରହୁଥିବା ମା\'ଙ୍କୁ ପ୍ରତିଦିନ ମଜୁରୀ ଭରଣା ବାବଦକୁ ୧୦୦ ଟଙ୍କା ମିଳେ (ଓଡ଼ିଶା)।' },
  'gr.stunt': { en: 'Stunted (short for age)', or: 'ବୟସ ଅନୁପାତରେ ଖର୍ବ (ଷ୍ଟଣ୍ଟିଙ୍ଗ୍)' }, 'gr.stuntS': { en: 'Severely stunted', or: 'ଅତ୍ୟଧିକ ଖର୍ବ' },
  'gr.waste': { en: 'Wasted (thin for height)', or: 'ଉଚ୍ଚତା ଅନୁପାତରେ କମ୍ ଓଜନ (ୱେଷ୍ଟିଙ୍ଗ୍)' }, 'gr.over': { en: 'Overweight', or: 'ଅଧିକ ଓଜନ' },
  'gr.micro': { en: 'Small head for age — refer for check-up (DEIC)', or: 'ବୟସ ଅନୁପାତରେ ଛୋଟ ମୁଣ୍ଡ — ପରୀକ୍ଷା ପାଇଁ ପଠାନ୍ତୁ (DEIC)' },
  'gr.macro': { en: 'Large head for age — refer for check-up', or: 'ବୟସ ଅନୁପାତରେ ବଡ଼ ମୁଣ୍ଡ — ପରୀକ୍ଷା ପାଇଁ ପଠାନ୍ତୁ' },
  'gr.implaus': { en: 'This value looks unlikely — please re-measure.', or: 'ଏହି ମାପ ଅସମ୍ଭବ ଲାଗୁଛି — ଦୟାକରି ପୁଣି ମାପନ୍ତୁ।' },
  'gr.need': { en: 'Add sex and date of birth to use the growth charts.', or: 'ବୃଦ୍ଧି ଚାର୍ଟ ପାଇଁ ଶିଶୁର ଲିଙ୍ଗ ଓ ଜନ୍ମ ତାରିଖ ଦିଅନ୍ତୁ।' },
  'gr.over5': { en: 'WHO growth standards cover 0–5 years.', or: 'WHO ବୃଦ୍ଧି ମାନକ ୦–୫ ବର୍ଷ ପାଇଁ।' },
  'gr.deleteQ': { en: 'Delete this measurement?', or: 'ଏହି ମାପ ବିଲୋପ କରିବେ?' },
  'gr.equal': { en: 'Ensure equal care for the girl child.', or: 'ବାଳିକାଙ୍କ ପାଇଁ ସମାନ ସୁବିଧା ସୁନିଶ୍ଚିତ କରନ୍ତୁ।' },
  'gr.muacNote': { en: 'MUAC applies from 6 months to 5 years: below 11.5 cm = SAM; 11.5–12.4 cm = MAM.', or: 'MUAC ୬ ମାସରୁ ୫ ବର୍ଷ ପାଇଁ: ୧୧.୫ ସେ.ମି.ରୁ କମ୍ = SAM; ୧୧.୫–୧୨.୪ ସେ.ମି. = MAM।' },
});

K.growth = {};
const seg = (ind, sex, x) => { const segs = K.who[ind] && K.who[ind][sex]; if (!segs) return null; for (const s of segs) if (x >= s[0][0] && x <= s[s.length - 1][0]) return s; return null; };
K.growth.lms = (ind, sex, x) => {
  const s = seg(ind, sex, x); if (!s) return null;
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (s[mid][0] <= x) lo = mid; else hi = mid; }
  const a = s[lo], b = s[hi]; const t = b[0] === a[0] ? 0 : (x - a[0]) / (b[0] - a[0]);
  return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t];
};
K.growth.val = (lms, z) => { const [L, M, S] = lms; return Math.abs(L) < 1e-7 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L); };
K.growth.z = (y, lms, restricted) => {
  if (!lms || y == null || y <= 0) return null; const [L, M, S] = lms;
  let z = Math.abs(L) < 1e-7 ? Math.log(y / M) / S : (Math.pow(y / M, L) - 1) / (L * S);
  if (restricted) {
    const sd = k => K.growth.val(lms, k);
    if (z > 3) z = 3 + (y - sd(3)) / (sd(3) - sd(2));
    else if (z < -3) z = -3 + (y - sd(-3)) / (sd(-2) - sd(-3));
  }
  return z;
};
K.growth.defRange = (ageD) => (ageD <= 330 ? '1' : ageD <= 700 ? '2' : '5');
K.growth.sex = k => (k.sex === 'm' ? 1 : k.sex === 'f' ? 2 : null);
K.growth.ageDays = (k, date) => { const dob = K.child.useCorrected(k, date) ? K.child.correctedDob(k) : k.dob; return Math.max(0, K.d.diff(dob, date)); };

/* all indicators for one measurement */
K.growth.assess = (k, m) => {
  const sex = K.growth.sex(k); if (!sex || !k.dob || !m || !m.date) return null;
  const age = K.growth.ageDays(k, m.date); const r = { age, corrected: K.child.useCorrected(k, m.date) };
  const wt = K.num(m.wt), ht0 = K.num(m.ht), hc = K.num(m.hc), muac = K.num(m.muac); const oed = +m.oedema === 1;
  if (age > 1826) r.over5 = true;
  if (wt != null && age <= 1826 && !oed) r.waz = K.growth.z(wt, K.growth.lms('wfa', sex, age), true);
  if (ht0 != null) {
    let ht = ht0; const pos = m.pos || (age < 731 ? 'L' : 'H');
    if (age < 731 && pos === 'H') ht += 0.7; else if (age >= 731 && pos === 'L') ht -= 0.7;
    r.ht = ht;
    if (age <= 1826) r.haz = K.growth.z(ht, K.growth.lms('lhfa', sex, age), false);
    if (wt != null && !oed) { const ind = age < 731 ? 'wfl' : 'wfh'; const l = K.growth.lms(ind, sex, Math.round(ht * 10) / 10); if (l) r.whz = K.growth.z(wt, l, true); r.whInd = ind; }
    if (wt != null && !oed && age <= 1826) r.baz = K.growth.z(wt / Math.pow(ht / 100, 2), K.growth.lms('bfa', sex, age), true);
  }
  if (hc != null && age <= 1826) r.hcz = K.growth.z(hc, K.growth.lms('hcfa', sex, age), false);
  if (muac != null && age >= 182 && age <= 1826) r.muacCls = muac < 11.5 ? 'sam' : muac < 12.5 ? 'mam' : 'n';
  r.oedema = oed;
  // WHO implausible-value flags
  r.flag = (r.waz != null && (r.waz < -6 || r.waz > 5)) || (r.haz != null && (r.haz < -6 || r.haz > 6)) || (r.whz != null && (r.whz < -5 || r.whz > 5)) || (r.hcz != null && (r.hcz < -5 || r.hcz > 5));
  // headline
  const sam = oed || r.muacCls === 'sam' || (r.whz != null && r.whz < -3);
  const mam = !sam && (r.muacCls === 'mam' || (r.whz != null && r.whz < -2));
  r.sam = sam; r.mam = mam;
  r.zone = r.waz == null ? null : r.waz < -3 ? 's' : r.waz < -2 ? 'm' : r.waz > 2 ? 'hi' : 'n';
  r.tone = sam || r.zone === 's' ? 'red' : (mam || r.zone === 'm') ? 'amber' : r.zone === 'hi' ? 'info' : 'teal';
  return r;
};
K.growth.latest = (k, field = 'wt') => (k.growth || []).filter(m => m[field] != null).sort(K.by('date', -1))[0] || null;
K.growth.faltering = (k) => {
  const ws = (k.growth || []).filter(m => m.wt != null).sort(K.by('date', -1));
  if (ws.length < 2) return false; const a = ws[0], b = ws.find(x => K.d.diff(x.date, a.date) >= 21);
  if (!b || K.d.diff(b.date, a.date) > 75) return false;
  return a.wt <= b.wt && K.d.diff(k.dob, a.date) < 1096; // < 3 years
};
K.growth.headline = (r) => {
  if (!r) return null;
  if (r.sam) return { tone: 'red', t: K.t('gr.sam') };
  if (r.zone === 's') return { tone: 'red', t: K.t('gr.zone.s') };
  if (r.mam) return { tone: 'amber', t: K.t('gr.mam') };
  if (r.zone === 'm') return { tone: 'amber', t: K.t('gr.zone.m') };
  if (r.zone === 'hi') return { tone: 'info', t: K.t('gr.zone.hi') };
  if (r.zone === 'n') return { tone: 'teal', t: K.t('gr.zone.n') };
  return null;
};
const zs = (z) => (z == null ? '–' : K.digits((z >= 0 ? '+' : '') + z.toFixed(2)));

/* ---------------------------------------------------------------- chart */
K.growth.chart = (k, ind, range) => {
  const sex = K.growth.sex(k); if (!sex) return '';
  const byAge = ind !== 'wfh';
  const ageNow = K.d.diff(k.dob, K.d.today());
  let x0, x1, xs, ind2 = ind;
  if (byAge) { const maxD = range === '1' ? 365 : range === '2' ? 730 : 1826; x0 = 0; x1 = maxD; }
  else { const ap = ageNow < 731; ind2 = ap ? 'wfl' : 'wfh'; x0 = ap ? 45 : 65; x1 = ap ? (range === '1' ? 85 : 110) : 120; }
  const step = byAge ? Math.max(7, Math.round((x1 - x0) / 120)) : 0.5;
  xs = []; for (let x = x0; x <= x1 + 1e-9; x += step) xs.push(+x.toFixed(1)); if (xs[xs.length - 1] < x1) xs.push(x1);
  const zl = ind === 'wfh' ? [-3, -2, -1, 0, 1, 2, 3] : [-3, -2, 0, 2, 3];
  const segInd = (x) => (ind2 === 'lhfa' && x === 730.5 ? 730 : x);
  const line = (z) => xs.map(x => { const l = K.growth.lms(ind2, sex, segInd(x)); return l ? [x, K.growth.val(l, z)] : null; }).filter(Boolean);
  const L = {}; [-3, -2, -1, 0, 1, 2, 3].forEach(z => { L[z] = line(z); });
  // points
  const pts = (k.growth || []).filter(m => m.date).sort(K.by('date')).map(m => {
    const r = K.growth.assess(k, m); if (!r) return null;
    if (ind === 'wfa' && m.wt != null && !r.oedema) return { x: r.age, y: +m.wt, m };
    if (ind === 'lhfa' && r.ht != null) return { x: r.age, y: r.ht, m };
    if (ind === 'hcfa' && m.hc != null) return { x: r.age, y: +m.hc, m };
    if (ind === 'wfh' && m.wt != null && r.ht != null && !r.oedema) return { x: r.ht, y: +m.wt, m };
    return null;
  }).filter(p => p && p.x >= x0 && p.x <= x1);
  const ys = L[-3].map(p => p[1]).concat(L[3].map(p => p[1]), pts.map(p => p.y));
  let y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  const W = 360, H = 268, ML = 34, MR = 24, MT = 10, MB = 30;
  const X = x => ML + (x - x0) / (x1 - x0) * (W - ML - MR), Y = y => MT + (1 - (y - y0) / (y1 - y0)) * (H - MT - MB);
  const poly = (arr) => arr.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  const band = (lo, hi) => `${poly(lo)} ${poly(hi.slice().reverse())}`;
  const bottom = L[-3].map(p => [p[0], y0]), top = L[3].map(p => [p[0], y1]);
  // ticks
  const xt = []; if (byAge) { const stepM = x1 <= 365 ? 1 : x1 <= 730 ? 3 : 6; for (let m = 0; m * 30.4375 <= x1 + 1; m += stepM) xt.push({ v: m * 30.4375, l: K.digits(m), yr: m % 12 === 0 }); }
  else { for (let v = Math.ceil(x0 / 5) * 5; v <= x1; v += 5) xt.push({ v, l: K.digits(v), yr: v % 10 === 0 }); }
  const yStep = (y1 - y0) > 30 ? 5 : (y1 - y0) > 12 ? 2 : 1; const yt = []; for (let v = Math.ceil(y0 / yStep) * yStep; v <= y1; v += yStep) yt.push(v);
  const yLabel = ind === 'wfa' || ind === 'wfh' ? K.t('gr.kg') : ind === 'hcfa' ? K.t('gr.hcAxis') : K.t('gr.cmAxis');
  const xLabel = byAge ? K.t('gr.ageAxis') : K.t('gr.cmAxis');
  const lastP = pts[pts.length - 1];
  return h`<svg class="gchart ${sex === 2 ? 'girl' : 'boy'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${K.t('gr.' + ind)}">
    <rect x="${ML}" y="${MT}" width="${W - ML - MR}" height="${H - MT - MB}" class="bg"/>
    ${ind === 'wfa' ? h`<polygon class="b-s" points="${band(bottom, L[-3])}"/><polygon class="b-m" points="${band(L[-3], L[-2])}"/><polygon class="b-n" points="${band(L[-2], L[2])}"/>`
      : h`<polygon class="b-s" points="${band(bottom, L[-3])}"/><polygon class="b-m" points="${band(L[-3], L[-2])}"/><polygon class="b-n" points="${band(L[-2], L[2])}"/><polygon class="b-hi" points="${band(L[2], top)}"/>`}
    ${yt.map(v => h`<line class="gl" x1="${ML}" x2="${W - MR}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="gtk" x="${ML - 5}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${K.digits(v)}</text>`)}
    ${xt.map(t => h`<line class="${t.yr ? 'gl yr' : 'gl'}" x1="${X(t.v).toFixed(1)}" x2="${X(t.v).toFixed(1)}" y1="${MT}" y2="${H - MB}"/><text class="gtk" x="${X(t.v).toFixed(1)}" y="${H - MB + 13}" text-anchor="middle">${t.l}</text>`)}
    ${zl.map(z => h`<polyline class="zl z${z < 0 ? 'm' + -z : z}" points="${poly(L[z])}"/><text class="zt" x="${W - MR + 3}" y="${(Y(L[z][L[z].length - 1][1]) + 3.5).toFixed(1)}">${K.digits(z)}</text>`)}
    ${pts.length > 1 ? h`<polyline class="pl" points="${pts.map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}"/>` : ''}
    ${pts.map(p => h`<circle class="${p === lastP ? 'pt last' : 'pt'}" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p === lastP ? 5 : 3.6}"/>`)}
    <text class="ax" x="${(ML + W - MR) / 2}" y="${H - 3}" text-anchor="middle">${xLabel}</text>
    <text class="ax" transform="translate(10 ${(MT + H - MB) / 2}) rotate(-90)" text-anchor="middle">${yLabel}</text>
  </svg>`;
};

const LINE = (d) => h`<svg viewBox="0 0 30 14" aria-hidden="true"><polyline points="${d}"/></svg>`;
K.growth.legend = (ind) => {
  const zones = ind === 'wfa'
    ? [['n', K.t('gr.zone.n')], ['m', K.t('gr.zone.m')], ['s', K.t('gr.zone.s')]]
    : [['n', K.t('gr.lg.normal')], ['m', K.t('gr.lg.m')], ['s', K.t('gr.lg.s')], ['hi', K.t('gr.lg.hi')]];
  return h`<div class="legend">${zones.map(([c, t]) => h`<span><i class="lg-${c}"></i>${t}</span>`)}</div>
    ${ind === 'wfa' ? h`<div class="gr-lines"><b>${K.t('gr.curve')}</b><span class="up">${LINE('2,12 10,8 18,5 28,2')}${K.t('gr.curve.up')}</span><span class="flat">${LINE('2,7 28,7')}${K.t('gr.curve.flat')}</span><span class="down">${LINE('2,9 10,5 18,5 28,11')}${K.t('gr.curve.down')}</span></div>` : ''}`;
};

/* ---------------------------------------------------------------- screens */
K.route('/card/:id/child/:kid/growth', ({ id, kid }, q) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  const back = K.child.url(c, k).slice(1);
  if (!K.growth.sex(k) || !k.dob) return { title: K.t('gr.title'), back, html: h`<div class="wrap">${K.ui.callout('warn', '', K.t('gr.need'))}<p></p>${K.ui.btn(K.t('child.edit'), { href: K.child.url(c, k, '/edit'), tone: 'ghost' })}</div>` };
  const ind = q.get('i') || 'wfa'; const ageD = K.d.diff(k.dob, K.d.today());
  const range = q.get('r') || K.growth.defRange(ageD);
  const hcp = K.settings.isHcp();
  const list = (k.growth || []).slice().sort(K.by('date', -1));
  const last = list.find(m => m.wt != null); const r = last ? K.growth.assess(k, last) : null; const hl = K.growth.headline(r);
  const base = K.child.url(c, k, '/growth');
  const tabs = ['wfa', 'lhfa', 'wfh', 'hcfa'].map(x => ({ k: x, l: K.t('gr.tab.' + x), href: `${base}?i=${x}&r=${range}` }));
  const ranges = ind === 'wfh' ? [] : ['1', '2', '5'].map(x => ({ k: x, l: K.t('gr.r' + x), href: `${base}?i=${ind}&r=${x}` }));
  return {
    title: K.t('gr.title'), sub: K.child.label(k), back, tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + ' · ' + K.d.ageText(k.dob), K.t('gr.title'), K.t('gr.monthly'))}
      ${hl ? K.ui.callout(hl.tone === 'red' ? 'danger' : hl.tone === 'amber' ? 'warn' : hl.tone === 'info' ? 'info' : '', hl.t,
        hl.tone === 'red' ? (r.sam ? K.t('gr.samDo') : K.t('gr.adv.s')) : hl.tone === 'amber' ? K.t('gr.adv.m') : (K.growth.faltering(k) ? K.t('gr.falter') : K.t('gr.good')), hl.tone === 'teal' ? 'check' : null) : ''}
      ${K.growth.faltering(k) && hl && hl.tone !== 'teal' ? h`<p></p>${K.ui.callout('warn', '', K.t('gr.falter'))}` : ''}
      <p></p>${K.ui.btn(K.t('gr.add'), { href: K.child.url(c, k, '/growth/new'), icon: 'plus', block: true })}
      <section class="sec" style="margin-top:16px">
        <div class="seg-grid">${K.ui.seg(tabs, ind)}</div>
        <div class="k-card chart-card"><div class="chart-h"><b>${K.t('gr.' + ind)} · ${K.t(k.sex === 'f' ? 'sex.f' : 'sex.m')}</b><span class="small faint">${K.t('gr.who')}</span></div>
          ${K.growth.chart(k, ind, range)}
          ${ranges.length ? h`<div style="margin-top:8px">${K.ui.seg(ranges, range)}</div>` : ''}
          ${K.growth.legend(ind)}
          ${k.sex === 'f' ? h`<p class="small faint" style="margin:8px 0 0">${K.t('gr.equal')}</p>` : ''}
        </div>
      </section>
      <section class="sec">${K.ui.secH(K.t('gr.history'))}
        ${list.length ? h`<div class="table gr-table"><table><thead><tr><th>${K.t('date')}</th><th>${K.t('u.kg')}</th><th>${K.t('u.cm')}</th>${hcp ? h`<th>WAZ</th><th>HAZ</th><th>WHZ</th>` : h`<th></th>`}</tr></thead><tbody>
          ${list.map(m => { const a = K.growth.assess(k, m) || {}; const hl2 = K.growth.headline(a);
            return h`<tr data-act="grEdit" data-arg="${c.id}|${k.id}|${m.id}" class="tap"><td class="num">${K.d.fmt(m.date, 'tbl')}${a.corrected ? '*' : ''}<small>${K.d.diff(k.dob, m.date) === 0 ? K.L(K.vax.VISITS[0].name) : K.d.ageText(k.dob, m.date, { days: false, noWeeks: true })}</small></td><td class="num">${m.wt != null ? K.n(m.wt, 2) : '–'}</td><td class="num">${m.ht != null ? K.n(m.ht, 1) : '–'}</td>
              ${hcp ? h`<td class="num ${a.waz != null && a.waz < -2 ? 'neg' : ''}">${zs(a.waz)}</td><td class="num ${a.haz != null && a.haz < -2 ? 'neg' : ''}">${zs(a.haz)}</td><td class="num ${a.whz != null && a.whz < -2 ? 'neg' : ''}">${zs(a.whz)}</td>`
                : h`<td>${hl2 ? K.ui.pill(hl2.t.replace(/ \(.+\)/, ''), hl2.tone === 'teal' ? 'ok' : hl2.tone === 'amber' ? 'due' : hl2.tone === 'red' ? 'over' : 'info') : ''}</td>`}</tr>`; })}
        </tbody></table></div>${list.some(m => (K.growth.assess(k, m) || {}).corrected) ? h`<p class="small faint">* ${K.t('gr.corrected')}</p>` : ''}` : K.ui.empty('scale', K.t('gr.none'))}
      </section>
      <p class="small faint">${K.t('gr.muacNote')}</p>
    </div>`,
  };
});

function grForm(c, k, m, isNew) {
  const ageD = k.dob ? K.d.diff(k.dob, m.date || K.d.today()) : 0;
  return h`<form class="form" data-form="grSave" data-id="${c.id}" data-kid="${k.id}" data-mid="${isNew ? '' : m.id}" novalidate>
    <div class="fgroup">
      ${K.ui.field({ name: 'date', type: 'date', label: K.t('gr.date'), value: m.date || K.d.today(), max: K.d.today(), attrs: { min: k.dob, 'data-live': 'grPreview' } })}
      <div class="frow">${K.ui.field({ name: 'wt', type: 'decimal', label: K.t('gr.weight'), unit: K.t('u.kg'), value: m.wt, attrs: { 'data-live': 'grPreview' } })}${K.ui.field({ name: 'ht', type: 'decimal', label: K.t('gr.length'), unit: K.t('u.cm'), value: m.ht, attrs: { 'data-live': 'grPreview' } })}</div>
      ${K.ui.choices({ name: 'pos', label: K.t('gr.pos'), value: m.pos || (ageD < 731 ? 'L' : 'H'), options: ['L', 'H'].map(v => ({ v, l: K.t('gr.pos.' + v) })), live: 'grPreview' })}
      <div class="frow">${K.ui.field({ name: 'muac', type: 'decimal', label: 'MUAC', unit: K.t('u.cm'), value: m.muac, attrs: { 'data-live': 'grPreview' } })}${K.ui.field({ name: 'hc', type: 'decimal', label: K.t('gr.hc'), unit: K.t('u.cm'), value: m.hc, attrs: { 'data-live': 'grPreview' } })}</div>
      ${K.ui.yn({ name: 'oedema', q: K.t('gr.oedema'), value: m.oedema, live: 'grPreview' })}
    </div>
    <section id="gr-preview" aria-live="polite"></section>
    <div class="btn-bar">${K.ui.btn(K.t('gr.save'), { type: 'submit', icon: 'check' })}${!isNew ? K.ui.btn('', { act: 'grDelete', arg: `${c.id}|${k.id}|${m.id}`, tone: 'ghost', icon: 'trash', aria: K.t('btn.delete') }) : ''}</div>
  </form>`;
}
K.route('/card/:id/child/:kid/growth/:mid', ({ id, kid, mid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  const isNew = mid === 'new'; const m = isNew ? { date: K.d.today() } : (k.growth || []).find(x => x.id === mid); if (!m) return K.screens.notFound();
  return { title: isNew ? K.t('gr.add') : K.t('gr.edit'), sub: K.child.label(k), back: K.child.url(c, k, '/growth').slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + ' · ' + K.d.ageText(k.dob), isNew ? K.t('gr.add') : K.t('gr.edit'))}${grForm(c, k, m, isNew)}</div>`, mount() { K.live.grPreview(); } };
});
K.acts.grEdit = (el) => { const [cid, kid, mid] = el.dataset.arg.split('|'); K.go(`/card/${cid}/child/${kid}/growth/${mid}`); };
K.growth.resultHtml = (k, r, o = {}) => {
  if (!r) return '';
  const hcp = o.stats != null ? o.stats : K.settings.isHcp(); const out = []; const hl = K.growth.headline(r);
  if (r.flag) out.push(K.ui.callout('warn', '', K.t('gr.implaus')));
  if (hl) out.push(K.ui.callout(hl.tone === 'red' ? 'danger' : hl.tone === 'amber' ? 'warn' : hl.tone === 'info' ? 'info' : '', hl.t, hl.tone === 'red' ? (r.sam ? K.t('gr.samDo') : K.t('gr.adv.s')) : hl.tone === 'amber' ? K.t('gr.adv.m') : '', hl.tone === 'teal' ? 'check' : null));
  if (r.haz != null && r.haz < -2) out.push(K.ui.callout('warn', r.haz < -3 ? K.t('gr.stuntS') : K.t('gr.stunt'), ''));
  if (r.whz != null && r.whz > 2) out.push(K.ui.callout('info', K.t('gr.over'), ''));
  if (r.hcz != null && r.hcz < -2) out.push(K.ui.callout('warn', K.t('gr.micro'), ''));
  if (r.hcz != null && r.hcz > 2) out.push(K.ui.callout('warn', K.t('gr.macro'), ''));
  if (r.over5) out.push(K.ui.callout('info', '', K.t('gr.over5')));
  const stats = hcp ? h`<div class="stats" style="margin-top:8px">${[['WAZ', r.waz], ['HAZ', r.haz], [r.whInd === 'wfh' ? 'WHZ' : 'WLZ', r.whz], ['BAZ', r.baz], ['HCZ', r.hcz]].filter(x => x[1] != null)
    .map(x => K.ui.stat(x[0], zs(x[1]), x[1] < -3 ? 'danger' : x[1] < -2 ? 'warn' : '', ''))}${r.corrected ? K.ui.stat(K.t('child.age'), K.d.ageText(K.d.addDays(K.d.today(), -r.age)), 'ink', K.t('gr.corrected')) : ''}</div>` : '';
  return h`<div class="stack">${out}</div>${stats}`;
};
K.live.grPreview = K.debounce(() => {
  const f = K.$('form[data-form="grSave"]'); if (!f) return; const c = K.card.load(f.dataset.id); const k = c && K.card.findKid(c, f.dataset.kid); if (!k) return;
  const v = K.formData(f); if (v.ht != null && v.ht < 30) v.ht = null; if (v.wt != null && v.wt > 60) v.wt = v.wt / 1000; const m = Object.assign({ date: K.d.today() }, v);
  const r = (m.wt != null || m.ht != null || m.hc != null || m.muac != null || m.oedema) ? K.growth.assess(k, m) : null;
  K.$('#gr-preview').innerHTML = K.hv(r ? h`<h3 style="margin:4px 0 8px">${K.t('anc.result')}</h3>${K.growth.resultHtml(k, r)}` : '');
}, 300);
K.forms.grSave = async (v, f) => {
  const c = K.card.load(f.dataset.id); const k = c && K.card.findKid(c, f.dataset.kid); if (!k) return;
  if (!v.date || K.d.diff(v.date, K.d.today()) < 0 || (k.dob && K.d.diff(k.dob, v.date) < 0)) { K.ui.toast(K.t('err.date')); return; }
  let wt = v.wt; if (wt != null && wt > 60) wt = wt / 1000; // grams typed
  let m = f.dataset.mid ? (k.growth || []).find(x => x.id === f.dataset.mid) : null;
  if (!m) { m = { id: K.uid('g') }; (k.growth = k.growth || []).push(m); }
  Object.assign(m, { date: v.date, wt: wt != null ? K.round(wt, 3) : null, ht: v.ht != null ? v.ht : null, pos: v.pos || '', muac: v.muac != null ? v.muac : null, hc: v.hc != null ? v.hc : null, oedema: v.oedema == null ? null : +v.oedema });
  await K.store.save(c); K.ui.toast(K.t('saved')); K.go(K.child.url(c, k, '/growth').slice(1));
};
K.acts.grDelete = async (el) => {
  const [cid, kid, mid] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return;
  if (!(await K.ui.confirm(K.t('gr.deleteQ'), { danger: true, ok: K.t('btn.delete') }))) return;
  k.growth = (k.growth || []).filter(x => x.id !== mid); await K.store.save(c); K.go(K.child.url(c, k, '/growth').slice(1));
};

/* ---------------------------------------------------------------- overview section, card pill, due */
K.child.addSection(20, (c, k) => {
  if (!k.dob) return '';
  const last = K.growth.latest(k); const r = last ? K.growth.assess(k, last) : null; const hl = K.growth.headline(r);
  const url = K.child.url(c, k, '/growth');
  return h`<section class="sec">${K.ui.secH(K.t('gr.title'), h`<a class="link" href="${url}">${K.t('see.all')}</a>`)}
    <a class="k-card gr-sum" href="${url}">
      ${last ? h`<div class="gr-top"><div><span class="mono gr-w">${K.n(last.wt, 2)} ${K.t('u.kg')}</span><span class="small faint">${K.d.fmt(last.date)} · ${K.d.rel(last.date)}</span></div>${hl ? K.ui.pill(hl.t.replace(/ \(.+\)/, ''), hl.tone === 'teal' ? 'ok' : hl.tone === 'amber' ? 'due' : hl.tone === 'red' ? 'over' : 'info') : ''}</div>
        ${K.growth.sex(k) ? K.growth.chart(k, 'wfa', K.growth.defRange(K.d.diff(k.dob, K.d.today()))) : ''}
        ${K.growth.faltering(k) ? K.ui.callout('warn', '', K.t('gr.falter')) : ''}` : h`<span class="small">${K.t('gr.none')}</span>`}
    </a>
    <p style="margin:8px 0 0">${K.ui.btn(K.t('gr.add'), { href: K.child.url(c, k, '/growth/new'), tone: 'ghost', size: 'sm', icon: 'plus' })}</p></section>`;
});
K.child.cardBits.push((c, k) => {
  const last = K.growth.latest(k); if (!last) return '';
  const hl = K.growth.headline(K.growth.assess(k, last)); if (!hl || hl.tone === 'teal') return '';
  return K.ui.pill(hl.t.replace(/ \(.+\)/, ''), hl.tone === 'amber' ? 'due' : hl.tone === 'red' ? 'over' : 'info', 'scale');
});
K.due.add((c, today) => {
  const out = [];
  K.card.kids(c).forEach(k => {
    if (!k.dob) return; const age = K.d.age(k.dob, today); if (age.months >= 60) return;
    const last = K.growth.latest(k); const every = age.months < 36 ? 1 : 3;
    const date = last ? K.d.addMonths(last.date, every) : K.d.addMonths(k.dob, 1);
    if (K.d.diff(today, date) <= 10) out.push({ id: 'wt' + k.id, kind: 'growth', icon: 'scale', href: K.child.url(c, k, '/growth/new'), who: K.child.label(k), date: K.d.cmp(date, k.dob) < 0 ? today : date,
      title: { en: `${K.child.label(k)}: weigh at the Anganwadi centre`, or: `${K.child.label(k)}: ଅଙ୍ଗନୱାଡ଼ି କେନ୍ଦ୍ରରେ ଓଜନ` } });
    const r = last && K.growth.assess(k, last);
    if (r && r.sam) out.push({ id: 'sam' + k.id, kind: 'danger', icon: 'alert', href: K.child.url(c, k, '/growth'), who: K.child.label(k), date: last.date, status: 'overdue',
      title: { en: `${K.child.label(k)}: severe acute malnutrition — refer to NRC`, or: `${K.child.label(k)}: ଅତିଶୟ ପୁଷ୍ଟିହୀନତା — NRC କୁ ପଠାନ୍ତୁ` } });
  });
  return out;
});
K.summary.add((c) => K.card.kids(c).map(k => { const m = K.growth.latest(k); if (!m) return ''; const hl = K.growth.headline(K.growth.assess(k, m)); return `${K.child.label(k)}: ${K.n(m.wt, 2)} kg (${K.d.fmt(m.date)})${hl ? ' · ' + hl.t : ''}`; }));
