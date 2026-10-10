/* ============================================================================
   modules/61-feed — what to feed at this age (data/51-feed), read aloud;
   other ages folded. Also the general-information route /learn/feeding.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'feed.title': { en: 'Feeding', or: 'ଶିଶୁକୁ ଖାଦ୍ୟ' },
  'feed.now': { en: 'For this age', or: 'ଏହି ବୟସ ପାଇଁ' },
  'feed.howMuch': { en: 'How much', or: 'କେତେ ଖାଦ୍ୟ' },
  'feed.other': { en: 'Other ages', or: 'ଅନ୍ୟ ବୟସ' },
  'feed.general': { en: 'For every meal', or: 'ସାଧାରଣ ସୂଚନା' },
  'feed.tile': { en: 'Feeding', or: 'ଖାଦ୍ୟ' },
});

K.feed = K.feed || {};
K.feed.stageFor = (ageM) => K.feed.STAGES.slice().reverse().find(s => ageM >= s.from) || K.feed.STAGES[0];
/* completed months of age (chronological; feeding follows actual age) */
K.feed.ageM = (k) => (k.dob ? K.d.diff(k.dob, K.d.today()) / 30.4375 : 0);

const stageCard = (st, id, open) => h`<details class="acc feed-st" ${open ? K.raw('open') : ''} id="${id}">
  <summary><span class="feed-ic">${K.ui.icon(st.icon, 'sm')}</span><span><b>${K.L(st.name)}</b><small>${K.L(st.head)}</small></span></summary>
  <div class="acc-b"><div class="feed-amt">${K.ui.icon('bowl', 'sm')}<span><span class="eyebrow" style="margin:0 0 2px">${K.t('feed.howMuch')}</span>${K.L(st.amount)}</span></div>
    <ul class="ul" id="${id}-l">${st.items.map(x => h`<li>${K.L(x)}</li>`)}</ul><p style="margin:10px 0 0">${K.ui.say('#' + id + '-l')}</p></div></details>`;

function feedPage(k) {
  const ageM = k ? K.feed.ageM(k) : null; const cur = ageM != null ? K.feed.stageFor(ageM) : null;
  return h`${K.ui.callout('', '', K.L(K.feed.LEAD), 'heart')}
    ${cur ? h`<section class="sec">${K.ui.secH(K.t('feed.now'))}${stageCard(cur, 'feed-' + cur.k, true)}</section>` : ''}
    <section class="sec">${cur ? K.ui.secH(K.t('feed.other')) : ''}<div class="stack">${K.feed.STAGES.filter(s => s !== cur).map(s => stageCard(s, 'feed-' + s.k, false))}</div></section>
    <section class="sec">${K.ui.secH(K.t('feed.general'))}<div class="k-card" id="feed-gen"><ul class="ul">${K.feed.GENERAL.map(x => h`<li>${K.L(x)}</li>`)}</ul><p style="margin:10px 0 0">${K.ui.say('#feed-gen')}</p></div></section>
    <section class="sec">${K.ui.callout('danger', '', K.L(K.feed.NO_BRAND))}</section>`;
}

K.route('/card/:id/child/:kid/feed', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  return { title: K.t('feed.title'), sub: K.child.label(k), back: K.child.url(c, k).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + (k.dob ? ' · ' + K.d.ageText(k.dob) : ''), K.t('feed.title'))}${feedPage(k)}</div>` };
});
K.route('/learn/feeding', () => ({ title: K.t('feed.title'), back: '/learn', tab: 'learn',
  html: h`<div class="wrap">${K.ui.phead('', K.t('feed.title'))}${feedPage(null)}</div>` }));

K.child.addTile(20, (c, k) => {
  const st = K.feed.stageFor(K.feed.ageM(k));
  return { icon: 'bowl', title: K.t('feed.tile'), sub: K.L(st.amount), href: K.child.url(c, k, '/feed') };
});
