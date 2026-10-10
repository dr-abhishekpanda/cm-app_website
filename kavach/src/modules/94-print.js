/* ============================================================================
   modules/94-print — printable summary of one family card (A4, black on
   white) for the paper file, a referral, or "Save as PDF". Uses the same
   records and engines as the screens; nothing new is stored.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'pr.title': { en: 'Print / save as PDF', or: 'ପ୍ରିଣ୍ଟ / PDF ସେଭ୍' },
  'pr.do': { en: 'Print or save as PDF', or: 'ପ୍ରିଣ୍ଟ କରନ୍ତୁ ବା PDF ସେଭ୍ କରନ୍ତୁ' },
  'pr.hint': { en: 'In the print window choose "Save as PDF" to keep a file, or send it to a printer.', or: 'ପ୍ରିଣ୍ଟ ୱିଣ୍ଡୋରେ ଫାଇଲ୍ ରଖିବା ପାଇଁ “Save as PDF” ବାଛନ୍ତୁ, ବା ପ୍ରିଣ୍ଟରକୁ ପଠାନ୍ତୁ।' },
  'pr.head': { en: 'Mother and child card — summary', or: 'ମା’ ଓ ଶିଶୁ କାର୍ଡ — ସାରାଂଶ' },
  'pr.printed': { en: 'Printed on {d} from Maa ’o’ Shishu Kavach (not an official government record). Keep with the MCP card.', or: '{d} ରେ ମା’ ଓ ଶିଶୁ କବଚରୁ ଛପା (ସରକାରୀ ରେକର୍ଡ ନୁହେଁ)। MCP କାର୍ଡ ସହ ରଖନ୍ତୁ।' },
  'pr.mother': { en: 'Mother', or: 'ମା’' }, 'pr.contacts': { en: 'Contacts', or: 'ଯୋଗାଯୋଗ' },
  'pr.preg': { en: 'Pregnancy', or: 'ଗର୍ଭାବସ୍ଥା' }, 'pr.anc': { en: 'Check-ups', or: 'ଗର୍ଭାବସ୍ଥାର ପରୀକ୍ଷା' },
  'pr.child': { en: 'Child', or: 'ଶିଶୁ' }, 'pr.vaxGiven': { en: 'Vaccines given', or: 'ଦିଆଯାଇଥିବା ଟୀକା' }, 'pr.vaxNext': { en: 'Due or overdue', or: 'ବାକି / ବିଳମ୍ବ' },
  'pr.growth': { en: 'Last weight', or: 'ଶେଷ ଓଜନ' }, 'pr.none': { en: 'None recorded', or: 'ଲେଖାଯାଇନାହିଁ' },
  'pr.tabs': { en: 'Tablets', or: 'ବଟିକା' }, 'pr.tests': { en: 'Tests', or: 'ପରୀକ୍ଷା' },
  'pr.risk': { en: 'High-risk', or: 'ବିପଦସଙ୍କୁଳ' }, 'pr.noRisk': { en: 'No high-risk condition recorded', or: 'କୌଣସି ବିପଦସଙ୍କୁଳ ଅବସ୍ଥା ଲେଖାଯାଇନାହିଁ' },
  'pr.delivery': { en: 'Delivery', or: 'ପ୍ରସବ' },
});

const row = (k, v) => (v == null || v === '' ? '' : h`<tr><th>${k}</th><td>${v}</td></tr>`);
const val = (x) => (x == null || x === '' ? '–' : x);

function motherBlock(c) {
  const m = c.mother || {}; const ct = c.contacts || {}; const age = K.card.motherAge(c);
  return h`<section class="pr-sec"><h2>${K.t('pr.mother')}</h2><table class="pr-kv"><tbody>
    ${row(K.t('m.name'), m.name)}${row(K.t('m.age'), age != null ? K.digits(age) : '')}${row(K.t('m.husband'), m.husband)}
    ${row(K.t('m.village'), [m.village, m.block, m.district].filter(Boolean).join(', '))}${row(K.t('m.phone'), m.phone)}
    ${row('RCH ID', m.rchId)}${row('ABHA', m.abhaId)}${row(K.t('test.bloodGroup'), m.bloodGroup)}${row(K.t('m.height'), m.height ? K.n(m.height, 1) + ' ' + K.t('u.cm') : '')}
  </tbody></table>
  <h3>${K.t('pr.contacts')}</h3><table class="pr-kv"><tbody>
    ${row('ASHA', [ct.asha, ct.ashaPhone].filter(Boolean).join(' · '))}${row('ANM', [ct.anm, ct.anmPhone].filter(Boolean).join(' · '))}${row('AWW', [ct.aww, ct.awwPhone, ct.awc].filter(Boolean).join(' · '))}
    ${row(K.t('c.dp'), [ct.deliveryPoint, ct.deliveryPhone].filter(Boolean).join(' · '))}${row('FRU', [ct.fru, ct.fruPhone].filter(Boolean).join(' · '))}
  </tbody></table></section>`;
}

function pregBlock(c, p) {
  const e = K.preg.edd(p); const g = K.preg.isActive(p) ? K.preg.ga(p) : null; const risk = K.preg.risk(p, c) || { high: false, reasons: [] };
  const td = p.td || {}; const t = p.tests || {}; const count = (o) => Object.keys((o && o.days) || {}).filter(d => o.days[d]).length;
  const anc = (p.anc || []).slice().sort(K.by('date'));
  return h`<section class="pr-sec"><h2>${K.t('pr.preg')}${p.delivery ? '' : g ? ' · ' + K.preg.gaText(g) : ''}</h2>
    <table class="pr-kv"><tbody>
      ${row('LMP', p.lmp ? K.d.fmt(p.lmp) : '')}${row('EDD', e ? K.d.fmt(e) : '')}
      ${row('G / P / A / L', [p.gravida, p.para, p.abortions, p.living].map(val).join(' / '))}
      ${row(K.t('pr.risk'), risk.high ? risk.reasons.map(x => K.L(x.it)).join('; ') : K.t('pr.noRisk'))}
      ${row('Td', [td.td1 && 'Td-1 ' + K.d.fmt(td.td1), td.td2 && 'Td-2 ' + K.d.fmt(td.td2), td.booster && 'Td-B ' + K.d.fmt(td.booster)].filter(Boolean).join(' · '))}
      ${row(K.t('pr.tabs'), `IFA ${K.digits(count(p.ifa))} · Ca ${K.digits(count(p.calcium))}${p.albendazole ? ' · Alb ' + K.d.fmt(p.albendazole) : ''}`)}
      ${row(K.t('pr.tests'), [t.bloodGroup && t.bloodGroup, ['hiv', 'syphilis', 'hbsag', 'malaria'].filter(k => t[k] && t[k] !== 'nd').map(k => `${K.t('test.' + k).split(' (')[0]}: ${K.t('res.' + t[k])}`).join(', '), t.ogtt != null && t.ogtt !== '' ? `OGTT ${t.ogtt}` : ''].filter(Boolean).join(' · '))}
    </tbody></table>
    ${anc.length ? h`<h3>${K.t('pr.anc')}</h3><table class="pr-tbl"><thead><tr><th>${K.t('date')}</th><th>GA</th><th>${K.t('u.kg')}</th><th>BP</th><th>Hb</th><th>Alb/Sug</th><th>FH</th><th>FHR</th></tr></thead><tbody>
      ${anc.map(a => { const ga = e ? K.preg.ga(p, a.date) : null; return h`<tr><td>${K.d.fmt(a.date, 'tbl')}</td><td>${ga ? K.preg.gaShort(ga) : '–'}</td><td>${val(a.weight)}</td><td>${a.bpSys ? K.digits(`${a.bpSys}/${a.bpDia || '–'}`) : '–'}</td><td>${val(a.hb)}</td><td>${[a.urineAlb, a.urineSugar].map(val).join('/')}</td><td>${val(a.fh)}</td><td>${val(a.fhr)}</td></tr>`; })}
    </tbody></table>` : ''}
    ${p.delivery ? h`<h3>${K.t('pr.delivery')}</h3><p>${K.d.fmt(p.delivery.date, 'long')}${p.delivery.place ? ' · ' + K.t('del.place.' + p.delivery.place) : ''}${p.delivery.facility ? ' · ' + p.delivery.facility : ''}</p>` : ''}
  </section>`;
}

function childBlock(c, k) {
  if (!k.dob) return '';
  const st = K.vax.state(k); const given = Object.values(st).filter(s => s.st === 'given').sort((a, b) => K.d.cmp(a.date, b.date));
  const pend = Object.values(st).filter(s => s.st === 'overdue' || s.st === 'due');
  const m = K.growth.latest(k); const r = m ? K.growth.assess(k, m) : null; const hl = r ? K.growth.headline(r) : null;
  return h`<section class="pr-sec"><h2>${K.t('pr.child')}: ${K.child.label(k)}</h2>
    <table class="pr-kv"><tbody>
      ${row(K.t('child.dob'), `${K.d.fmt(k.dob, 'long')} · ${K.d.ageText(k.dob)}`)}${row(K.t('child.sex'), k.sex ? K.t('sex.' + k.sex) : '')}
      ${row(K.t('child.bw'), k.birthWeight != null ? K.n(k.birthWeight, 2) + ' ' + K.t('u.kg') : '')}${row(K.t('child.ga'), k.gaWeeks != null ? K.digits(k.gaWeeks) : '')}
      ${row('RCH ID', k.rchId)}
      ${row(K.t('pr.growth'), m ? `${K.n(m.wt, 2)} ${K.t('u.kg')}${m.ht ? ' · ' + K.n(m.ht, 1) + ' ' + K.t('u.cm') : ''} (${K.d.fmt(m.date)})${hl ? ' · ' + hl.t : ''}${r && r.waz != null ? ` · WAZ ${K.digits(r.waz.toFixed(1))}` : ''}` : K.t('pr.none'))}
      ${row(K.t('vita.title'), Object.keys(k.vitA || {}).sort((a, b) => a - b).map(n => `Vit-A ${n}: ${K.d.fmt(k.vitA[n])}`).join(' · '))}
      ${row(K.t('pr.vaxNext'), pend.map(s => `${s.it.code} (${K.d.fmt(s.due)})`).join(', '))}
      ${K.dev && K.dev.anyWarn(k) ? row(K.t('dev.title'), K.t('dev.warnSeen') + ((k.dev || {}).deic ? ' · ' + K.t('dev.deicDone', { d: K.d.fmt(k.dev.deic) }) : '')) : ''}
    </tbody></table>
    <h3>${K.t('pr.vaxGiven')}</h3>${given.length ? h`<p class="pr-vax">${given.map(s => h`<span>${s.it.code} <b>${K.d.fmt(s.date, 'tbl')}</b></span>`)}</p>` : h`<p>${K.t('pr.none')}</p>`}
  </section>`;
}

K.route('/print/:id', ({ id }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound();
  const pregs = (c.pregnancies || []).slice().sort(K.by('createdAt', -1)).slice(0, 2);
  return { title: K.t('pr.title'), sub: c.mother.name, back: `/card/${id}`, tab: 'home', noTabs: true,
    html: h`<div class="wrap pr-wrap">
      <div class="pr-tools no-print">${K.ui.btn(K.t('pr.do'), { act: 'printNow', icon: 'print', block: true })}<p class="small">${K.t('pr.hint')}</p></div>
      <article class="pr-page">
        <header class="pr-h"><div><b>${K.t('app.name')}</b><span>${K.t('pr.head')}</span></div><span class="mono">${K.d.fmt(K.d.today())}</span></header>
        ${motherBlock(c)}
        ${pregs.map(p => pregBlock(c, p))}
        ${K.card.kids(c).map(k => childBlock(c, k))}
        <footer class="pr-f">${K.t('pr.printed', { d: K.d.fmt(K.d.today(), 'long') })}</footer>
      </article></div>` };
});
K.acts.printNow = () => window.print();
