/* ============================================================================
   core/07-migrate — bring older cards (and imported backups) up to the
   current record shape so screens never meet a missing field. Runs on every
   card loaded from storage or a backup file. Idempotent.
   ============================================================================ */
K.migrate = (c) => {
  if (!c || typeof c !== 'object') return c;
  const base = K.blank.card();
  c.mother = Object.assign({}, base.mother, c.mother || {});
  c.contacts = Object.assign({}, base.contacts, c.contacts || {});
  c.pregnancies = (Array.isArray(c.pregnancies) ? c.pregnancies : []).map(p => {
    const q = Object.assign(K.blank.pregnancy(), p || {});
    ['ifa', 'calcium', 'ppIfa', 'ppCalcium'].forEach(k => { q[k] = Object.assign({ days: {} }, q[k] || {}); q[k].days = q[k].days || {}; });
    q.anc = Array.isArray(q.anc) ? q.anc : []; q.pnc = Array.isArray(q.pnc) ? q.pnc : [];
    ['hist', 'hrp', 'tests', 'td', 'birthPlan', 'fp'].forEach(k => { q[k] = q[k] || {}; });
    // birth plan item "facility" (a tick) clashed with the facility name field — now "hospital"
    if (q.birthPlan.facility === 1) { q.birthPlan.hospital = 1; q.birthPlan.facility = ''; }
    return q;
  });
  c.children = (Array.isArray(c.children) ? c.children : []).map(k => {
    const x = Object.assign(K.blank.child(), k || {});
    x.ifa = Object.assign({ bottles: {}, days: {} }, x.ifa || {}); x.ifa.days = x.ifa.days || {}; x.ifa.bottles = x.ifa.bottles || {};
    ['birth', 'vax', 'vitA', 'alb', 'dev'].forEach(f => { x[f] = x[f] || {}; });
    ['growth', 'hbnc', 'hbyc', 'ill'].forEach(f => { x[f] = Array.isArray(x[f]) ? x[f] : []; });
    return x;
  });
  if (c.v == null) c.v = 1;
  return c;
};
