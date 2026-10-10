/* ============================================================================
   modules/95-sample — a made-up family for training and demonstrations:
   a mother 26 weeks pregnant (moderate anaemia, short birth interval) with a
   14-month-old girl (vaccines, Vitamin A, growth, IFA syrup, HBYC, milestones).
   No phone numbers, so no real person can be dialled. Marked sample: true.
   ============================================================================ */
K.i18n.add({
  'sample.added': { en: 'Sample family added', or: 'ନମୁନା ପରିବାର ଯୋଗ ହେଲା' },
  'sample.exists': { en: 'The sample family is already on this phone', or: 'ନମୁନା ପରିବାର ଆଗରୁ ଏହି ଫୋନରେ ଅଛି' },
});

K.sample = {};
K.sample.build = (today) => {
  today = today || K.d.today(); const D = (n) => K.d.addDays(today, n);
  const c = K.blank.card(); c.sample = true;
  Object.assign(c.mother, { name: 'Sunita Kujur', age: 26, husband: 'Ramesh Kujur', village: 'Kutra', block: 'Kutra', district: 'Sundargarh', bloodGroup: 'B+', height: 150, sickle: 'AA', mamata: 1 });
  Object.assign(c.contacts, { asha: 'Basanti Ekka', anm: 'Sarojini Toppo', aww: 'Malati Xalxo', awc: 'Kutra-3', deliveryPoint: 'CHC Kutra', fru: 'District HQ Hospital, Sundargarh', mamataDivas: 'Every 2nd Wednesday' });

  /* the child: 14 months old */
  const k = K.blank.child();
  Object.assign(k, { name: 'Rina', sex: 'f', dob: K.d.addMonths(today, -14), birthWeight: 2.7, gaWeeks: 39 });
  k.birth = { cried: 1, bf: '1h', colostrum: 1, vitk: 1, sncu: 0 };
  const at = (w) => K.d.addDays(k.dob, w);
  const give = (ids, d) => ids.forEach(id => { k.vax[id] = { date: d, place: 'session' }; });
  give(['BCG', 'OPV0', 'HepB0'], k.dob);
  give(['OPV1', 'Penta1', 'Rota1', 'fIPV1', 'PCV1'], at(44));
  give(['OPV2', 'Penta2', 'Rota2'], at(72));
  give(['OPV3', 'Penta3', 'Rota3', 'fIPV2', 'PCV2'], at(101));
  const m9 = K.d.addMonths(k.dob, 9); give(['MR1', 'fIPV3', 'PCVB'], K.d.addDays(m9, 6)); k.vitA[1] = K.d.addDays(m9, 6);
  const wts = [2.7, 3.6, 4.6, 5.4, 6.0, 6.5, 6.9, 7.2, 7.5, 7.7, 7.9, 8.1, 8.2, 8.3];
  k.growth = wts.map((w, i) => ({ id: K.uid('g'), date: K.d.addDays(K.d.addMonths(k.dob, i), i ? 3 : 0), wt: w, ht: i === 13 ? 72.5 : i === 9 ? 69 : null, pos: 'L', muac: i === 13 ? 13.4 : null, hc: null, oedema: 0 }))
    .filter(g => K.d.cmp(g.date, today) <= 0);
  // IFA syrup: bottle at 6 months, most doses in the last 8 weeks ticked
  k.ifa = { bottles: { 1: K.d.addMonths(k.dob, 6) }, days: {} };
  K.cifa.daysIn(D(-56), D(-1)).forEach((d, i) => { if (i % 5 !== 3) k.ifa.days[d] = 1; });
  k.ifa.start = Object.keys(k.ifa.days).sort()[0];
  k.hbyc = [3, 6, 9, 12].map(m => ({ id: K.uid('hb'), m, date: K.d.addDays(K.d.addMonths(k.dob, m), 2),
    ans: Object.assign({ sick: 0, bf: 1, wt: 1, delay: 0, imm: 1, orsHome: 1, cHw: 1, cPar: 1, cFp: 1, ors: m >= 6 ? 1 : 0 }, m >= 6 ? { ifaHome: 1, cCf: 1, ifa: 1 } : { cEbf: 1 }, m >= 9 ? { mr: 1, vita: 1 } : {}), notes: '' }));
  k.dev = { m9: { can: { 0: at(250), 1: at(250), 2: at(255), 3: at(262), 4: at(262) }, warn: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, date: K.d.addMonths(k.dob, 9) },
    m12: { can: { 0: at(330), 1: at(334), 2: at(350), 4: at(360) }, warn: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }, date: K.d.addDays(K.d.addMonths(k.dob, 12), 4) } };

  /* the pregnancy: 26 weeks */
  const p = K.blank.pregnancy();
  Object.assign(p, { lmp: D(-182), gravida: 2, para: 1, abortions: 0, living: 1, prevPlace: 'inst', lastChildDob: k.dob, village: 'no' });
  const lmp = p.lmp; const W = (w, d = 0) => K.d.addDays(lmp, w * 7 + d);
  p.anc = [
    { id: K.uid('a'), date: W(10, 2), place: 'sc', by: 'anm', weight: 48, bpSys: 110, bpDia: 70, hb: 10.2, urineAlb: 'nil', urineSugar: 'nil', pallor: 0, jaundice: 0, oedema: 'none', tdDose: 'td1', sx: [] },
    { id: K.uid('a'), date: W(18, 1), place: 'pmsma', by: 'doc', weight: 50.5, bpSys: 112, bpDia: 74, hb: 9.6, urineAlb: 'nil', urineSugar: 'nil', fh: 18, fhr: 142, pallor: 1, jaundice: 0, oedema: 'none', sx: [] },
    { id: K.uid('a'), date: W(24, 3), place: 'mamata', by: 'anm', weight: 52, bpSys: 118, bpDia: 76, hb: 9.4, urineAlb: 'nil', urineSugar: 'nil', fh: 24, fhr: 140, fm: 'normal', pallor: 1, jaundice: 0, oedema: 'none', sx: [] },
  ];
  p.td = { td1: W(10, 2), td2: W(14, 4) };
  p.albendazole = W(16, 0);
  p.tests = { bloodGroup: 'B+', hiv: 'neg', hivDate: W(10, 2), syphilis: 'neg', syphilisDate: W(10, 2), hbsag: 'neg', hbsagDate: W(10, 2), malaria: 'neg', malariaDate: W(18, 1), ogtt: 118, ogttDate: W(24, 3) };
  const tick = (o, from) => { let d = from; let i = 0; while (K.d.cmp(d, today) < 0) { if (i % 7 !== 5) o.days[d] = 1; d = K.d.addDays(d, 1); i++; } o.start = from; };
  tick(p.ifa, W(14)); tick(p.calcium, W(14));
  p.birthPlan = { facility: 'CHC Kutra', vehicle: '102', contact: 1, hospital: 1, transport: 1, jsy: 1 };

  k.pregId = '';
  c.pregnancies.push(p); c.children.push(k);
  return c;
};
K.acts.loadSample = async () => {
  if (K.store.list().some(c => c.sample)) { K.ui.toast(K.t('sample.exists')); const c = K.store.list().find(x => x.sample); K.go(`/card/${c.id}`); return; }
  const c = K.sample.build(); await K.store.save(c); K.ui.toast(K.t('sample.added')); K.go(`/card/${c.id}`);
};
