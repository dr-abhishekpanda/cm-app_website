/* ============================================================================
   modules/90-more — More menu, Settings, About, Recently deleted
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'about.title': { en: 'About this app', or: 'ଏହି ଆପ୍ ବିଷୟରେ' },
  'about.what': { en: 'What it is', or: 'ଏହା କ\'ଣ' },
  'about.whatBody': { en: "Maa 'o' Shishu Kavach turns the Mother and Child Protection (MCP) Card into an app: the same records, schedules and advice, with reminders, charts and read-aloud. It follows the national MCP Card (MoHFW & MoWCD, 2018) and the Odisha MCP Card (V-2023-24), updated where national guidance has changed since.", or: "ମା' ଓ ଶିଶୁ କବଚ ମା' ଓ ଶିଶୁ ସୁରକ୍ଷା (MCP) କାର୍ଡକୁ ଏକ ଆପ୍‌ରେ ପରିଣତ କରେ: ସେହି ସମାନ ବିବରଣୀ, ସମୟସୂଚୀ ଓ ପରାମର୍ଶ, ସହିତ ସ୍ମାରକ, ଚାର୍ଟ ଓ ପଢ଼ି ଶୁଣାଇବା ସୁବିଧା। ଏହା ଜାତୀୟ MCP କାର୍ଡ (୨୦୧୮) ଓ ଓଡ଼ିଶା MCP କାର୍ଡ (V-2023-24) ଅନୁସରଣ କରେ, ଏବଂ ପରବର୍ତ୍ତୀ ଜାତୀୟ ନିର୍ଦ୍ଦେଶାବଳୀ ଅନୁଯାୟୀ ଅଦ୍ୟତନ କରାଯାଇଛି।" },
  'about.privacy': { en: 'Privacy', or: 'ଗୋପନୀୟତା' },
  'about.privacyBody': { en: 'All records stay in this browser on this phone. There is no account, no server and no tracking. Fonts load from Google Fonts the first time the app opens online. Clearing browser data deletes the cards, so keep a backup file.', or: 'ସମସ୍ତ ବିବରଣୀ ଏହି ଫୋନର ବ୍ରାଉଜରରେ ହିଁ ରହେ। କୌଣସି ଆକାଉଣ୍ଟ, ସର୍ଭର ବା ଟ୍ରାକିଙ୍ଗ୍ ନାହିଁ। ପ୍ରଥମ ଥର ଅନଲାଇନ୍ ଖୋଲିଲେ Google Fonts ରୁ ଅକ୍ଷର ଲୋଡ୍ ହୁଏ। ବ୍ରାଉଜର୍ ତଥ୍ୟ ହଟାଇଲେ କାର୍ଡ ମଧ୍ୟ ହଟିଯିବ, ତେଣୁ ବ୍ୟାକଅପ୍ ଫାଇଲ୍ ରଖନ୍ତୁ।' },
  'about.limits': { en: 'Limits', or: 'ସୀମା' },
  'about.limitsBody': { en: 'Use this app alongside your printed MCP card and your health workers, not instead of them. Schemes, amounts and helplines change; each one shows the date and source it was checked against.', or: 'ଏହି ଆପ୍‌କୁ ଆପଣଙ୍କ ଛପା MCP କାର୍ଡ ଓ ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ସହିତ ବ୍ୟବହାର କରନ୍ତୁ, ସେମାନଙ୍କ ବଦଳରେ ନୁହେଁ। ଯୋଜନା, ରାଶି ଓ ହେଲ୍ପଲାଇନ୍ ବଦଳେ; ପ୍ରତ୍ୟେକର ଯାଞ୍ଚ ତାରିଖ ଓ ସୂତ୍ର ଦିଆଯାଇଛି।' },
  'about.made': { en: 'Made by', or: 'ପ୍ରସ୍ତୁତକର୍ତ୍ତା' },
  'about.version': { en: 'Version', or: 'ସଂସ୍କରଣ' },
  'about.sources': { en: 'Main sources', or: 'ମୁଖ୍ୟ ସୂତ୍ର' },
  'trash.empty': { en: 'No deleted cards.', or: 'କୌଣସି ବିଲୋପିତ କାର୍ଡ ନାହିଁ।' },
  'trash.note': { en: 'Deleted cards are kept for 30 days, then removed for good.', or: 'ବିଲୋପିତ କାର୍ଡ ୩୦ ଦିନ ରଖାଯାଏ, ତା\'ପରେ ସ୍ଥାୟୀ ଭାବେ ହଟିଯାଏ।' },
  'trash.purge': { en: 'Delete for good', or: 'ସ୍ଥାୟୀ ଭାବେ ବିଲୋପ' },
  'trash.purgeQ': { en: 'This card will be removed from this phone for good.', or: 'ଏହି କାର୍ଡ ଏହି ଫୋନରୁ ସ୍ଥାୟୀ ଭାବେ ହଟିଯିବ।' },
  'trash.deletedOn': { en: 'Deleted {d}', or: '{d} ରେ ବିଲୋପ ହୋଇଛି' },
});

K.route('/more', () => ({
  title: K.t('more.title'), tab: 'more',
  html: h`<div class="wrap">
    ${K.ui.phead('', K.t('more.title'))}
    <div class="list">
      ${K.ui.li({ href: '#/settings', icon: 'gear', title: K.t('more.settings'), meta: `${K.i18n.info().name} · ${K.t('mode.' + K.settings.get('mode'))}` })}
      ${K.ui.li({ href: '#/backup', icon: 'download', title: K.t('more.backup'), meta: K.settings.get('lastBackup') ? K.d.fmt(K.settings.get('lastBackup').slice(0, 10)) : '–' })}
      ${K.ui.li({ href: '#/help', icon: 'phone', tone: 'red', title: K.t('more.help') })}
      ${K.ui.li({ href: '#/about', icon: 'info', tone: 'info', title: K.t('more.about') })}
      ${K.ui.li({ href: '#/trash', icon: 'trash', tone: 'ink', title: K.t('more.trash'), meta: K.digits(K.store.trash().length) })}
    </div>
    ${K.install.evt ? h`<p></p>${K.ui.callout('info', K.t('home.install'), K.ui.btn(K.t('home.installBtn'), { act: 'install', tone: 'ghost', size: 'sm', icon: 'download' }), 'download')}` : ''}
    <p class="foot-note">${K.t('app.by')}<br>${K.t('app.notGov')}</p>
  </div>`,
}));

K.route('/settings', () => {
  const s = K.settings.data;
  const rate = s.speechRate || 0.92;
  return {
    title: K.t('more.settings'), back: '/more', tab: 'more',
    html: h`<div class="wrap">
      ${K.ui.phead('', K.t('more.settings'))}
      <div class="fgroup">
        <div class="field"><span class="lbl">${K.t('set.lang')}</span>
          <div class="choices">${K.i18n.langs.map(l => h`<label class="choice"><input type="radio" name="lang" value="${l.code}" ${l.code === s.lang ? K.raw('checked') : ''} data-live="setLang"><span lang="${l.code}">${l.name}</span></label>`)}</div></div>
        <div class="field"><span class="lbl">${K.t('set.mode')}</span>
          <div class="choices">${['family', 'hcp'].map(m => h`<label class="choice"><input type="radio" name="mode" value="${m}" ${m === s.mode ? K.raw('checked') : ''} data-live="setMode"><span>${K.t('mode.' + m)}</span></label>`)}</div></div>
      </div>
      <p></p>
      <div class="fgroup">
        ${K.ui.sw({ name: 'odiaNum', checked: s.odiaNum, title: K.t('set.odiaNum', { od: K.keep('୧୨୩') }), sub: K.t('set.odiaNumSub', { od: K.keep('୧୨୩'), lat: K.keep('123') }), live: 'setBool' })}
        ${K.ui.sw({ name: 'largeText', checked: s.largeText, title: K.t('set.large'), sub: K.t('set.largeSub'), live: 'setBool' })}
        ${K.ui.sw({ name: 'jeArea', checked: s.jeArea, title: K.t('set.je'), sub: K.t('set.jeSub'), live: 'setBool' })}
      </div>
      <p></p>
      <div class="fgroup">
        ${K.ui.field({ name: 'district', label: K.t('set.district'), value: s.district, attrs: { 'data-live': 'setText', autocomplete: 'off' } })}
        <div class="field"><span class="lbl">${K.t('set.ifaDays')}</span>
          <div class="choices">${[[2, 5], [3, 6]].map(p => h`<label class="choice"><input type="radio" name="ifaDays" value="${p.join(',')}" ${String(s.ifaDays) === p.join(',') ? K.raw('checked') : ''} data-live="setIfaDays"><span>${K.d.WD[K.i18n.lang === 'or' ? 'or' : 'en'][p[0]]} + ${K.d.WD[K.i18n.lang === 'or' ? 'or' : 'en'][p[1]]}</span></label>`)}</div>
          <span class="hint">${K.t('set.ifaDaysSub')}</span></div>
        <div class="field"><label for="sp-rate">${K.t('set.speech')}</label>
          <input id="sp-rate" type="range" min="0.6" max="1.3" step="0.05" value="${rate}" data-live="setRate"></div>
      </div>
    </div>`,
  };
});
K.live.setLang = (el) => { K.settings.set('lang', el.value); K.refresh(); };
K.live.setMode = (el) => { K.settings.set('mode', el.value); K.ui.toast(K.t('saved')); };
K.live.setBool = (el) => { K.settings.set(el.name, el.checked); if (el.name === 'odiaNum' || el.name === 'largeText') K.refresh(); };
K.live.setText = K.debounce((el) => { K.settings.set(el.name, el.value.trim()); }, 400);
K.live.setIfaDays = (el) => { K.settings.set('ifaDays', el.value.split(',').map(Number)); };
K.live.setRate = (el) => { K.settings.set('speechRate', +el.value); };

K.route('/about', () => ({
  title: K.t('about.title'), back: '/more', tab: 'more',
  html: h`<div class="wrap">
    <div class="ob-hero" style="margin-top:4px"><svg class="mark ob-mark" aria-hidden="true"><use href="#i-kavach"/></svg>
      <h1 lang="or" class="ob-or">ମା' ଓ ଶିଶୁ କବଚ</h1><p class="ob-en" lang="en">Maa 'o' Shishu Kavach</p><p class="small">#CM-APP</p></div>
    <section class="sec">${K.ui.eyebrow(K.t('about.what'))}<p>${K.t('about.whatBody')}</p></section>
    <section class="sec">${K.ui.eyebrow(K.t('about.privacy'))}<p>${K.t('about.privacyBody')}</p></section>
    <section class="sec">${K.ui.eyebrow(K.t('about.limits'))}<p>${K.t('about.limitsBody')}</p>${K.ui.callout('warn', '', K.t('app.notGov'))}</section>
    <section class="sec">${K.ui.eyebrow(K.t('about.sources'))}
      <ul class="ul small">
        <li>Mother and Child Protection Card, 2018 version — MoHFW & MoWCD, Government of India.</li>
        <li>ମା' ଏବଂ ଶିଶୁ ସୁରକ୍ଷା କାର୍ଡ (MCP Card) V-2023-24 — NHM & ICDS, Government of Odisha.</li>
        <li>National Immunization Schedule (UIP), MoHFW — including fIPV-3 at 9 months and catch-up rules.</li>
        <li>WHO Child Growth Standards (2006): LMS tables from the WHO <span class="mono">anthro</span> package.</li>
        <li>Anemia Mukt Bharat operational guidelines (MoHFW, 2018); HBNC and HBYC guidelines (MoHFW).</li>
        <li>MAMATA-PMMVY, Department of Women & Child Development and Mission Shakti, Odisha (effective 1 April 2025).</li>
      </ul></section>
    <section class="sec">${K.ui.eyebrow(K.t('about.made'))}<p>${K.t('app.by')}</p></section>
    <p class="foot-note mono">${K.t('about.version')} ${K.build} · ${K.builtAt.slice(0, 10)} · ${K.db.mode()}</p>
  </div>`,
}));

K.route('/trash', () => {
  const list = K.store.trash();
  return {
    title: K.t('more.trash'), back: '/more', tab: 'more',
    html: h`<div class="wrap">${K.ui.phead('', K.t('more.trash'), K.t('trash.note'))}
      ${list.length ? h`<div class="list">${list.map(c => h`<div class="li">${K.ui.avatar(c.mother.name)}<span class="body"><span class="t">${c.mother.name || '–'}</span><span class="m">${K.t('trash.deletedOn', { d: K.d.fmt(c.deletedAt.slice(0, 10)) })}</span></span>
        <span class="trail">${K.ui.btn(K.t('btn.restore'), { act: 'restoreCard', arg: c.id, tone: 'ghost', size: 'sm' })}${K.ui.btn('', { act: 'purgeCard', arg: c.id, tone: 'quiet', size: 'sm', icon: 'trash', aria: K.t('trash.purge') })}</span></div>`)}</div>`
        : K.ui.empty('trash', K.t('trash.empty'))}</div>`,
  };
});
K.acts.restoreCard = async (el) => { await K.store.restore(el.dataset.arg); K.ui.toast(K.t('saved')); K.refresh(); };
K.acts.purgeCard = async (el) => { if (await K.ui.confirm(K.t('trash.purgeQ'), { danger: true, ok: K.t('trash.purge') })) { await K.store.purge(el.dataset.arg); K.refresh(); } };
