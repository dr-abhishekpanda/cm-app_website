/* ============================================================================
   modules/70-learn — Learn & counsel library: topics built from the card
   content already in the app (danger signs, pregnancy, newborn, feeding,
   vaccines, growth, development, sick child, IFA/anaemia, family planning,
   hygiene). Reading mode per topic, a full-screen flipbook for counselling
   (one card at a time, swipe or arrows, read aloud), and search.
   Cards: { t, lead?, items: [{en, or, icon?}], note?, tone? } — items are
   bilingual objects, so dictionary entries (K.i18n.dict[key]) can be reused.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'learn.title': { en: 'Learn & counsel', or: 'ଜାଣନ୍ତୁ ଓ ପରାମର୍ଶ' },
  'learn.lede': { en: 'Messages from the MCP card to read, listen to, or show during counselling.', or: 'MCP କାର୍ଡର ବାର୍ତ୍ତା — ପଢ଼ନ୍ତୁ, ଶୁଣନ୍ତୁ, ବା ପରାମର୍ଶ ସମୟରେ ଦେଖାନ୍ତୁ।' },
  'learn.search': { en: 'Search topics', or: 'ବିଷୟ ଖୋଜନ୍ତୁ' },
  'learn.noHit': { en: 'Nothing found. Try another word.', or: 'କିଛି ମିଳିଲା ନାହିଁ। ଅନ୍ୟ ଶବ୍ଦ ଚେଷ୍ଟା କରନ୍ତୁ।' },
  'learn.g.preg': { en: 'Pregnancy and birth', or: 'ଗର୍ଭାବସ୍ଥା ଓ ପ୍ରସବ' },
  'learn.g.child': { en: 'Newborn and child', or: 'ନବଜାତ ଶିଶୁ ଓ ପିଲା' },
  'learn.g.family': { en: 'Family and home', or: 'ପରିବାର ଓ ଘର' },
  'learn.flip': { en: 'Counsel with cards', or: 'କାର୍ଡ ଦେଖାଇ ପରାମର୍ଶ' },
  'learn.flipSub': { en: 'One card at a time, large text — swipe or use the arrows', or: 'ଗୋଟିଏ ଗୋଟିଏ କାର୍ଡ, ବଡ଼ ଅକ୍ଷର — ସ୍ୱାଇପ୍ କରନ୍ତୁ ବା ତୀର ଦବାନ୍ତୁ' },
  'learn.cards': { en: '{n} cards', or: '{n}ଟି କାର୍ଡ' },
  'learn.prev': { en: 'Previous', or: 'ପୂର୍ବ' }, 'learn.next': { en: 'Next', or: 'ପରବର୍ତ୍ତୀ' }, 'learn.done': { en: 'Done', or: 'ସମାପ୍ତ' },
  'learn.close': { en: 'Close', or: 'ବନ୍ଦ କରନ୍ତୁ' },
  'learn.of': { en: '{i} of {n}', or: '{n} ମଧ୍ୟରୁ {i}' },
  'learn.call': { en: 'Emergency numbers', or: 'ଜରୁରୀକାଳୀନ ନମ୍ବର' },
  'learn.c108': { en: '108 Ambulance', or: '୧୦୮ ଆମ୍ବୁଲାନ୍ସ' }, 'learn.c102': { en: '102 Janani Express', or: '୧୦୨ ଜନନୀ ଏକ୍ସପ୍ରେସ୍' }, 'learn.c104': { en: '104 Health helpline', or: '୧୦୪ ସ୍ୱାସ୍ଥ୍ୟ ହେଲ୍ପଲାଇନ୍' },
  'learn.dangerSub': { en: 'When to go to hospital at once', or: 'କେବେ ତୁରନ୍ତ ଡାକ୍ତରଖାନା ଯିବେ' },
  /* topic names */
  'lt.danger': { en: 'Danger signs', or: 'ବିପଦ ଲକ୍ଷଣ' },
  'lt.preg': { en: 'Care in pregnancy', or: 'ଗର୍ଭାବସ୍ଥାରେ ଯତ୍ନ' }, 'lt.pregSub': { en: 'Check-ups, tablets, food, anaemia', or: 'ପରୀକ୍ଷା, ବଟିକା, ଖାଦ୍ୟ, ରକ୍ତହୀନତା' },
  'lt.birth': { en: 'Birth and after', or: 'ପ୍ରସବ ଓ ପ୍ରସବ ପରେ' }, 'lt.birthSub': { en: 'Birth plan, home birth, care of the mother', or: 'ପ୍ରସବ ଯୋଜନା, ଘରେ ପ୍ରସବ, ମା’ଙ୍କ ଯତ୍ନ' },
  'lc.after': { en: 'After delivery — care of the mother', or: 'ପ୍ରସବ ପରେ ମା’ଙ୍କ ଯତ୍ନ' },
  'lt.newborn': { en: 'Newborn care', or: 'ନବଜାତ ଶିଶୁର ଯତ୍ନ' }, 'lt.newbornSub': { en: 'Warmth, breastfeeding, cord, home visits', or: 'ଉଷୁମତା, ସ୍ତନ୍ୟପାନ, ନାଭି, ଗୃହ ପରିଦର୍ଶନ' },
  'lt.feeding': { en: 'Breastfeeding and food', or: 'ସ୍ତନ୍ୟପାନ ଓ ଖାଦ୍ୟ' }, 'lt.feedingSub': { en: 'What to feed at each age', or: 'କେଉଁ ବୟସରେ କ’ଣ ଖୁଆଇବେ' },
  'lt.vax': { en: 'Vaccines', or: 'ଟୀକାକରଣ' }, 'lt.vaxSub': { en: 'Schedule and what to expect', or: 'ସୂଚୀ ଓ ଜାଣିବା କଥା' },
  'lt.growth': { en: 'Growth', or: 'ଶାରୀରିକ ବୃଦ୍ଧି' }, 'lt.growthSub': { en: 'Monthly weighing and the growth chart', or: 'ମାସିକ ଓଜନ ଓ ବୃଦ୍ଧି ଚାର୍ଟ' },
  'lt.dev': { en: 'Play and development', or: 'ଖେଳ ଓ ବିକାଶ' }, 'lt.devSub': { en: 'Parenting tips for each age', or: 'ପ୍ରତି ବୟସ ପାଇଁ ଲାଳନପାଳନ ସୂଚନା' },
  'lt.sick': { en: 'Diarrhoea, pneumonia, fever', or: 'ତରଳ ଝାଡ଼ା, ନିମୋନିଆ, ଜ୍ୱର' }, 'lt.sickSub': { en: 'Prevention and care at home', or: 'ପ୍ରତିରୋଧ ଓ ଘରେ ଯତ୍ନ' },
  'lt.anaemia': { en: 'Iron and anaemia', or: 'ଲୌହସାର ଓ ରକ୍ତହୀନତା' }, 'lt.anaemiaSub': { en: 'Food, IFA, deworming', or: 'ଖାଦ୍ୟ, ଆଇ.ଏଫ୍.ଏ., କୃମିନାଶକ' },
  'lt.fp': { en: 'Family planning', or: 'ପରିବାର ନିୟୋଜନ' }, 'lt.fpSub': { en: 'Spacing and permanent methods', or: 'ବ୍ୟବଧାନ ଓ ସ୍ଥାୟୀ ପଦ୍ଧତି' },
  'lt.hygiene': { en: 'Hygiene and malaria', or: 'ପରିଷ୍କାର ପରିଚ୍ଛନ୍ନତା ଓ ମ୍ୟାଲେରିଆ' }, 'lt.hygieneSub': { en: 'Handwashing, water, toilets, bed nets', or: 'ହାତ ଧୋଇବା, ପାଣି, ପାଇଖାନା, ମଶାରୀ' },
  /* card titles */
  'lc.anc': { en: 'Check-ups in pregnancy', or: 'ଗର୍ଭାବସ୍ଥାର ପରୀକ୍ଷା' },
  'lc.tabs': { en: 'Injections and tablets', or: 'ଟୀକା ଓ ବଟିକା' },
  'lc.care': { en: 'Food and rest', or: 'ଖାଦ୍ୟ ଓ ବିଶ୍ରାମ' },
  'lc.anDo': { en: 'To prevent anaemia — do', or: 'ରକ୍ତହୀନତାରୁ ରକ୍ଷା ପାଇବା ପାଇଁ' },
  'lc.anDont': { en: 'To prevent anaemia — do not', or: 'ରକ୍ତହୀନତାରୁ ରକ୍ଷା ପାଇବା ପାଇଁ କ’ଣ କରିବା ନାହିଁ' },
  'lc.plan': { en: 'Plan for the birth', or: 'ପ୍ରସବ ପାଇଁ ଯୋଜନା' },
  'lc.home': { en: 'If the birth happens at home', or: 'ଯଦି ଘରେ ପ୍ରସବ ହୁଏ' },
  'lc.homeNote': { en: 'It is safest to give birth in a health facility with a skilled birth attendant.', or: 'ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ଦକ୍ଷ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ଦ୍ୱାରା ପ୍ରସବ ସବୁଠାରୁ ନିରାପଦ।' },
  'lc.nbRemember': { en: 'Care of the newborn — remember', or: 'ନବଜାତ ଶିଶୁର ଯତ୍ନ — ମନେରଖନ୍ତୁ' },
  'lc.hbnc': { en: 'Home visits for the newborn', or: 'ନବଜାତ ଶିଶୁ ପାଇଁ ଗୃହ ପରିଦର୍ଶନ' },
  'lc.vaxSched': { en: 'Vaccine schedule', or: 'ଟୀକାକରଣ ସୂଚୀ' },
  'lc.grWeigh': { en: 'Weigh every month', or: 'ପ୍ରତି ମାସ ଓଜନ' },
  'lc.grZones': { en: 'Reading the weight chart', or: 'ଓଜନ ଚାର୍ଟ ବୁଝିବା' },
  'lc.grSam': { en: 'Severe malnutrition', or: 'ଅତିଶୟ ପୁଷ୍ଟିହୀନତା' },
  'lc.diarrPrev': { en: 'Preventing diarrhoea', or: 'ତରଳ ଝାଡ଼ା ନ ହେବା ପାଇଁ' },
  'lc.diarrTreat': { en: 'Treating diarrhoea at home', or: 'ତରଳ ଝାଡ଼ାର ଚିକିତ୍ସା' },
  'lc.pneuSigns': { en: 'Signs of pneumonia', or: 'ନିମୋନିଆ ଚିହ୍ନଟ' },
  'lc.pneuPrev': { en: 'Preventing pneumonia', or: 'ନିମୋନିଆ ନ ହେବା ପାଇଁ' },
  'lc.fever': { en: 'Fever', or: 'ଜ୍ୱର' },
  'lc.ifaKids': { en: 'IFA syrup for children (6 months – 5 years)', or: 'ଶିଶୁଙ୍କ ପାଇଁ ଆଇ.ଏଫ୍.ଏ. ସିରପ୍ (୬ ମାସ – ୫ ବର୍ଷ)' },
  'lc.fpSpacing': { en: 'Methods for spacing', or: 'ବ୍ୟବଧାନ ପଦ୍ଧତି' },
  'lc.fpPerm': { en: 'If the family is complete', or: 'ଯଦି ପରିବାର ସମ୍ପୂର୍ଣ୍ଣ' },
  'lc.hyg': { en: 'Clean hands, clean water, bed nets', or: 'ସଫା ହାତ, ସଫା ପାଣି, ମଶାରୀ' },
});

K.learn = {};
const D = () => K.content.danger;
const dict = (key) => K.i18n.dict[key];
const dangerCard = (s) => ({ t: D()[s].title, lead: D()[s].lead, items: D()[s].items, tone: s === 'go' ? 'info' : 'danger', set: s });
K.learn.TOPICS = [
  { k: 'danger', icon: 'alert', tone: 'red', group: 'top', sub: 'learn.dangerSub', cards: () => ['preg', 'labour', 'post', 'newborn', 'child', 'go'].filter(s => D()[s]).map(dangerCard) },
  { k: 'preg', icon: 'mother', group: 'preg', cards: () => [
    { t: dict('lc.anc'), items: K.content.ancBasics },
    { t: dict('lc.tabs'), items: [Object.assign({ icon: 'syringe' }, dict('td.rule')), Object.assign({ icon: 'pill' }, dict('ifa.rule')), Object.assign({ icon: 'pill' }, dict('ca.rule')), Object.assign({ icon: 'pill' }, dict('alb.rule'))] },
    { t: dict('lc.care'), items: K.content.pregCare },
    { t: dict('lc.anDo'), items: K.content.anaemia.dos },
    { t: dict('lc.anDont'), items: K.content.anaemia.donts, tone: 'warn' },
    dangerCard('preg'),
  ] },
  { k: 'birth', icon: 'hospital', group: 'preg', cards: () => [
    { t: dict('lc.plan'), items: K.content.birthPlan.map(x => Object.assign({ icon: 'check' }, x)) },
    { t: dict('lc.home'), items: K.content.homeKit.map(x => Object.assign({ icon: 'check' }, x)), note: dict('lc.homeNote') },
    dangerCard('labour'),
    { t: dict('lc.after'), items: K.content.afterBirth },
    dangerCard('post'),
  ] },
  { k: 'newborn', icon: 'baby', group: 'child', cards: () => [
    { t: dict('lc.nbRemember'), items: K.content.newbornCare },
    { t: K.feed.STAGES[0].head, items: K.feed.STAGES[0].items.slice(0, 5).map(x => Object.assign({ icon: 'heart' }, x)) },
    { t: dict('child.lbw'), items: [Object.assign({ icon: 'heart' }, dict('child.lbwCare'))] },
    { t: dict('lc.hbnc'), items: K.content.hbnc },
    dangerCard('newborn'),
  ] },
  { k: 'feeding', icon: 'bowl', group: 'child', cards: () => K.feed.STAGES.map(st => ({ t: st.name, lead: st.head, amount: st.amount, items: st.items.map(x => Object.assign({ icon: st.icon }, x)) }))
    .concat([{ t: dict('feed.general'), items: K.feed.GENERAL.map(x => Object.assign({ icon: 'check' }, x)) }, { t: dict('lt.feeding'), items: [Object.assign({ icon: 'alert' }, K.feed.NO_BRAND)], tone: 'danger' }]) },
  { k: 'vax', icon: 'syringe', group: 'child', cards: () => [
    { t: dict('lc.vaxSched'), items: K.vax.VISITS.map(v => { const codes = K.vax.LIST.filter(i => i.v === v.k).map(i => i.code + (i.je ? '*' : '')).concat(v.k === 'm9' ? ['Vit-A 1'] : v.k === 'm16' ? ['Vit-A 2'] : []).join(', ');
      return { icon: 'syringe', en: `${v.name.en}: ${codes}`, or: `${v.name.or}: ${codes}` }; }), note: { en: '* JE only in selected districts.', or: '* ଜେ.ଇ. କେବଳ ନିର୍ଦ୍ଦିଷ୍ଟ ଜିଲ୍ଲାରେ।' } },
    { t: dict('vax.four'), items: K.vax.FOUR.map(x => Object.assign({ icon: x.icon }, x.t)) },
    { t: dict('vax.know'), items: K.vax.KNOW.map(x => Object.assign({ icon: 'info' }, x)) },
  ] },
  { k: 'growth', icon: 'scale', group: 'child', cards: () => [
    { t: dict('lc.grWeigh'), items: [Object.assign({ icon: 'scale' }, dict('gr.monthly')), Object.assign({ icon: 'chart' }, dict('gr.curve.up')), Object.assign({ icon: 'chart' }, dict('gr.curve.flat')), Object.assign({ icon: 'alert' }, dict('gr.curve.down'))] },
    { t: dict('lc.grZones'), items: [Object.assign({ icon: 'check' }, dict('gr.zone.n')), Object.assign({ icon: 'alert' }, dict('gr.zone.m')), Object.assign({ icon: 'alert' }, dict('gr.zone.s'))], note: dict('gr.adv.m') },
    { t: dict('lc.grSam'), items: [Object.assign({ icon: 'ruler' }, dict('gr.muacNote')), Object.assign({ icon: 'hand' }, dict('gr.oedema')), Object.assign({ icon: 'hospital' }, dict('gr.samDo'))], tone: 'danger' },
  ] },
  { k: 'dev', icon: 'star', group: 'child', cards: () => K.dev.BANDS.map(b => ({ t: b.name, items: b.tips.map(x => Object.assign({ icon: 'heart' }, x)) }))
    .concat([{ t: K.dev.TEXT.deic, items: [Object.assign({ icon: 'hospital' }, K.dev.TEXT.deicBody)], lead: K.dev.TEXT.warnLead }]) },
  { k: 'sick', icon: 'temp', group: 'child', cards: () => [
    { t: dict('lc.diarrTreat'), items: K.ill.DIARR_TREAT },
    { t: dict('lc.diarrPrev'), items: K.ill.DIARR_PREVENT },
    { t: dict('lc.pneuSigns'), items: K.ill.PNEU_SIGNS.concat(K.ill.FAST_TEXT.map(x => Object.assign({ icon: 'timer' }, x))), note: K.ill.CONTACT },
    { t: dict('lc.pneuPrev'), items: K.ill.PNEU_PREVENT },
    { t: dict('lc.fever'), items: [Object.assign({ icon: 'temp' }, dict('sick.fever1')), Object.assign({ icon: 'drop' }, dict('sick.fever2')), Object.assign({ icon: 'hospital' }, dict('sick.fever3'))] },
    dangerCard('child'),
  ] },
  { k: 'anaemia', icon: 'drop', group: 'family', cards: () => [
    { t: dict('lc.anDo'), items: K.content.anaemia.dos },
    { t: dict('lc.anDont'), items: K.content.anaemia.donts, tone: 'warn' },
    { t: dict('lc.ifaKids'), items: K.ill.IFA_RULES.map(x => Object.assign({ icon: 'drop' }, x)) },
  ] },
  { k: 'fp', icon: 'users', group: 'family', cards: () => [
    { t: dict('lc.fpSpacing'), lead: dict('fp.lede'), items: K.fp.METHODS.filter(m => m.group === 'spacing').map(m => ({ icon: m.icon, en: `${m.name.en} — ${m.when.en}`, or: `${m.name.or} — ${m.when.or}` })) },
    { t: dict('lc.fpPerm'), items: K.fp.METHODS.filter(m => m.group === 'permanent').map(m => ({ icon: m.icon, en: `${m.name.en}: ${m.what.en}`, or: `${m.name.or}: ${m.what.or}` })) },
  ] },
  { k: 'hygiene', icon: 'hand', group: 'family', cards: () => [{ t: dict('lc.hyg'), items: K.content.hygiene }] },
];
K.learn.topic = (k) => K.learn.TOPICS.find(t => t.k === k);
K.learn.title = (t) => K.t('lt.' + t.k);
K.learn.sub = (t) => (t.sub ? K.t(t.sub) : K.t('lt.' + t.k + 'Sub'));

/* one card as HTML (reading mode or flipbook) */
K.learn.card = (cd, id, o = {}) => h`<article class="lcard ${cd.tone || ''} ${o.big ? 'big' : ''}" id="${id}">
  <h2>${K.L(cd.t)}</h2>${cd.lead ? h`<p class="lc-lead">${K.L(cd.lead)}</p>` : ''}
  ${cd.amount ? h`<div class="feed-amt">${K.ui.icon('bowl', 'sm')}<span>${K.L(cd.amount)}</span></div>` : ''}
  <ul class="ill-list">${(cd.items || []).map(x => h`<li>${K.ui.icon(x.icon || 'check', 'sm')}<span>${K.L(x)}</span></li>`)}</ul>
  ${cd.note ? h`<p class="lc-note">${K.L(cd.note)}</p>` : ''}
  ${o.say !== false ? h`<p class="lc-say">${K.ui.say('#' + id)}</p>` : ''}
</article>`;
const callRow = () => h`<div class="btn-row call-row">${K.ui.btn(K.t('learn.c108'), { href: 'tel:108', tone: 'danger', icon: 'ambulance', size: 'sm' })}${K.ui.btn(K.t('learn.c102'), { href: 'tel:102', tone: 'ghost', icon: 'phone', size: 'sm' })}${K.ui.btn(K.t('learn.c104'), { href: 'tel:104', tone: 'ghost', icon: 'phone', size: 'sm' })}</div>`;

/* ---------------------------------------------------------------- hub */
K.route('/learn', () => {
  const tile = (t) => h`<a class="tile" href="#/learn/${t.k}"><span class="ti-ic ${t.tone || ''}">${K.ui.icon(t.icon)}</span><b>${K.learn.title(t)}</b><small>${K.learn.sub(t)}</small></a>`;
  const group = (g) => h`<section class="sec">${K.ui.secH(K.t('learn.g.' + g))}<div class="tiles">${K.learn.TOPICS.filter(t => t.group === g).map(tile)}</div></section>`;
  return { title: K.t('learn.title'), tab: 'learn',
    html: h`<div class="wrap">${K.ui.phead('', K.t('learn.title'), K.t('learn.lede'))}
      <a class="danger-tile" href="#/learn/danger">${K.ui.icon('alert')}<span><b>${K.t('lt.danger')}</b><small>${K.t('learn.dangerSub')}</small></span>${K.ui.icon('chev')}</a>
      <div class="learn-q">${K.ui.field({ name: 'q', type: 'search', ph: K.t('learn.search'), attrs: { 'data-live': 'learnSearch', 'aria-label': K.t('learn.search'), autocomplete: 'off' } })}</div>
      <div id="learn-hits"></div>
      <div id="learn-groups">${['preg', 'child', 'family'].map(group)}</div>
    </div>` };
});
K.live.learnSearch = K.debounce((el) => {
  const q = (el.value || '').trim().toLowerCase(); const box = K.$('#learn-hits'); const groups = K.$('#learn-groups'); if (!box) return;
  if (q.length < 2) { box.innerHTML = ''; groups.hidden = false; return; }
  const hits = [];
  K.learn.TOPICS.forEach(t => t.cards().forEach((cd, i) => {
    const text = [K.L(cd.t), cd.lead ? K.L(cd.lead) : '', ...(cd.items || []).map(x => K.L(x))].join(' ').toLowerCase();
    if (text.includes(q) || K.learn.title(t).toLowerCase().includes(q)) hits.push({ t, cd, i });
  }));
  groups.hidden = true;
  box.innerHTML = K.hv(hits.length ? h`<div class="list">${hits.slice(0, 30).map(x => K.ui.li({ href: `#/learn/${x.t.k}#lc-${x.i}`, icon: x.t.icon, tone: x.t.tone === 'red' ? 'red' : '', title: K.L(x.cd.t), meta: K.learn.title(x.t) }))}</div>` : K.ui.empty('search', K.t('learn.noHit')));
}, 200);

/* ---------------------------------------------------------------- topic page (reading mode) */
K.route('/learn/:topic', ({ topic }) => {
  const t = K.learn.topic(topic); if (!t) return K.screens.notFound();
  const cards = t.cards();
  return { title: K.learn.title(t), back: '/learn', tab: 'learn',
    html: h`<div class="wrap">${K.ui.phead(K.t('learn.title'), K.learn.title(t), t.k === 'danger' ? '' : K.learn.sub(t))}
      <a class="k-card flip-cta" href="#/learn/${t.k}/flip/0">${K.ui.icon('play')}<span><b>${K.t('learn.flip')}</b><small>${K.t('learn.flipSub')} · ${K.t('learn.cards', { n: cards.length })}</small></span>${K.ui.icon('chev', 'sm')}</a>
      ${t.k === 'danger' ? h`<section class="sec">${K.ui.secH(K.t('learn.call'))}${callRow()}</section>` : ''}
      <div class="stack lcards">${cards.map((cd, i) => K.learn.card(cd, 'lc-' + i))}</div>
    </div>`,
    mount() { const a = K.anchor(); if (a) { const e = document.getElementById(a); e && e.scrollIntoView(); } } };
});
/* a single danger set, e.g. #/learn/danger/newborn */
K.route('/learn/danger/:set', ({ set }) => {
  const d = D()[set]; if (!d) return K.screens.notFound();
  const i = K.learn.topic('danger').cards().findIndex(c => c.set === set);
  return { title: K.L(d.title), back: '/learn/danger', tab: 'learn',
    html: h`<div class="wrap">${K.learn.card(dangerCard(set), 'lc-d', { big: true })}<p></p>${callRow()}<p></p>${K.learn.card(dangerCard('go'), 'lc-go')}
      <p style="margin-top:14px">${K.ui.btn(K.t('learn.flip'), { href: `#/learn/danger/flip/${Math.max(0, i)}`, tone: 'ghost', icon: 'play' })}</p></div>` };
});

/* ---------------------------------------------------------------- flipbook */
K.route('/learn/:topic/flip/:i', ({ topic, i }) => {
  const t = K.learn.topic(topic); if (!t) return K.screens.notFound();
  const cards = t.cards(); const n = cards.length; i = K.clamp(parseInt(i, 10) || 0, 0, n - 1);
  const cd = cards[i];
  return { title: K.learn.title(t), sub: K.t('learn.of', { i: i + 1, n }), back: `/learn/${t.k}`, tab: 'learn', noTabs: true,
    html: h`<div class="flip" data-topic="${t.k}" data-i="${i}" data-n="${n}">
      <div class="flip-dots" aria-hidden="true">${cards.map((_, j) => h`<i class="${j === i ? 'on' : j < i ? 'past' : ''}"></i>`)}</div>
      <div class="flip-card">${K.learn.card(cd, 'flip-c', { big: true, say: false })}</div>
      <div class="flip-bar">
        ${K.ui.btn(K.t('learn.prev'), { act: 'flipGo', arg: String(i - 1), tone: 'ghost', icon: 'back', disabled: i === 0 })}
        ${K.ui.say('#flip-c')}
        ${i < n - 1 ? K.ui.btn(K.t('learn.next'), { act: 'flipGo', arg: String(i + 1), arrow: true }) : K.ui.btn(K.t('learn.done'), { href: `#/learn/${t.k}`, icon: 'check' })}
      </div>
    </div>`,
    mount(root) {
      const card = K.$('.flip-card', root); let x0 = null, y0 = null;
      card.addEventListener('touchstart', (e) => { const p = e.touches[0]; x0 = p.clientX; y0 = p.clientY; }, { passive: true });
      card.addEventListener('touchend', (e) => { if (x0 == null) return; const p = e.changedTouches[0]; const dx = p.clientX - x0, dy = p.clientY - y0; x0 = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) K.learn.flipTo(i + (dx < 0 ? 1 : -1)); }, { passive: true });
    } };
});
K.learn.flipTo = (j) => { const f = K.$('.flip'); if (!f) return; const n = +f.dataset.n; if (j < 0 || j >= n) return; K.go(`/learn/${f.dataset.topic}/flip/${j}`, { replace: true }); };
K.acts.flipGo = (el) => K.learn.flipTo(+el.dataset.arg);
document.addEventListener('keydown', (e) => { const f = K.$('.flip'); if (!f || e.target.closest('input,textarea,select')) return;
  if (e.key === 'ArrowRight') K.learn.flipTo(+f.dataset.i + 1); else if (e.key === 'ArrowLeft') K.learn.flipTo(+f.dataset.i - 1); });
