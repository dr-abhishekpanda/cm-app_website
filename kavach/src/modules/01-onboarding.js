/* ============================================================================
   modules/01-onboarding — first run: language, who uses the phone, privacy
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'ob.step1': { en: 'Step 1', or: 'ପ୍ରଥମ ପଦକ୍ଷେପ' },
  'ob.step2': { en: 'Step 2', or: 'ଦ୍ୱିତୀୟ ପଦକ୍ଷେପ' },
  'ob.change': { en: 'You can change these later in More → Settings.', or: 'ପରେ ଅଧିକ → ସେଟିଙ୍ଗ୍‌ରେ ଏହା ବଦଳାଇ ପାରିବେ।' },
});

K.route('/welcome', () => {
  const mode = K.settings.get('mode');
  const langBtn = (l) => h`<button type="button" class="ob-lang ${l.code === K.i18n.lang ? 'on' : ''}" data-act="obLang" data-arg="${l.code}" lang="${l.code}" aria-pressed="${l.code === K.i18n.lang}"><b>${l.name}</b><small>${l.english}</small></button>`;
  const modeOpt = (v, icon, title, sub) => h`<label class="ob-mode"><input type="radio" name="mode" value="${v}" ${mode === v ? K.raw('checked') : ''}><span class="ob-mode-in"><span class="lead">${K.ui.icon(icon, 'lg')}</span><span><b>${title}</b><small>${sub}</small></span></span></label>`;
  return {
    title: K.t('ob.title'), tab: '', noTabs: true,
    html: h`<div class="wrap ob">
      <div class="ob-hero">
        <svg class="mark ob-mark" aria-hidden="true"><use href="#i-kavach"/></svg>
        <h1 lang="or" class="ob-or">ମା' ଓ ଶିଶୁ କବଚ</h1>
        <p class="ob-en" lang="en">Maa 'o' Shishu Kavach</p>
        <p class="lede">${K.t('ob.lead')}</p>
      </div>
      <form class="form" data-form="onboard">
        <section class="sec">${K.ui.eyebrow(K.t('ob.step1'))}<h2>${K.t('ob.lang')}</h2><div class="ob-langs">${K.i18n.langs.map(langBtn)}</div></section>
        <section class="sec">${K.ui.eyebrow(K.t('ob.step2'))}<h2>${K.t('ob.who')}</h2>
          <div class="stack">${modeOpt('family', 'mother', K.t('ob.family'), K.t('ob.familySub'))}${modeOpt('hcp', 'users', K.t('ob.hcp'), K.t('ob.hcpSub'))}</div>
        </section>
        ${K.ui.callout('info', K.t('ob.privacy'), K.t('ob.privacyBody'), 'lock')}
        ${K.ui.callout('', '', K.t('ob.care'), 'heart')}
        ${K.ui.btn(K.t('ob.go'), { type: 'submit', size: 'lg', block: true, arrow: true })}
        <p class="small tc faint">${K.t('ob.change')}</p>
      </form>
    </div>`,
  };
});
K.acts.obLang = (el) => {
  const m = K.$('input[name=mode]:checked'); if (m) K.settings.data.mode = m.value;
  K.settings.set('lang', el.dataset.arg); K.refresh();
};
K.forms.onboard = (v) => {
  K.settings.set('mode', v.mode || 'family');
  K.settings.set('onboarded', true);
  K.go('/', { replace: true });
};
