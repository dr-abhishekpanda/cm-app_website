/* ============================================================================
   core/06-speech — read-aloud with the phone's own text-to-speech
   Long text is split into sentence-sized utterances (Chrome on Android stops
   long utterances). If the phone has no voice for the language, the button
   explains that instead of failing silently.
   ============================================================================ */
K.speech = {
  ok: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  voices: [],
  active: null,
  init() {
    if (!this.ok) return;
    const load = () => { try { this.voices = speechSynthesis.getVoices() || []; } catch (e) { this.voices = []; } };
    load();
    try { speechSynthesis.addEventListener('voiceschanged', load); } catch (e) { speechSynthesis.onvoiceschanged = load; }
  },
  voiceFor(lang) {
    const want = (K.i18n.info(lang).speech || 'en-IN').toLowerCase();
    const base = want.split('-')[0];
    const vs = this.voices.map(v => ({ v, l: String(v.lang || '').replace('_', '-').toLowerCase() }));
    return (vs.find(x => x.l === want) || vs.find(x => x.l.startsWith(base + '-')) || vs.find(x => x.l === base) || {}).v || null;
  },
  can(lang) { return this.ok && (!!this.voiceFor(lang || K.i18n.lang) || (lang || K.i18n.lang) === 'en'); },
  chunks(text) {
    const parts = String(text).replace(/\s+/g, ' ').split(/(?<=[।.!?;:])\s+/).map(s => s.trim()).filter(Boolean);
    const out = []; let cur = '';
    parts.forEach(p => { if ((cur + ' ' + p).length > 180 && cur) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p; });
    if (cur) out.push(cur);
    return out;
  },
  speak(text, btn) {
    if (!this.ok) { K.ui.toast(K.t('say.none')); return; }
    if (this.active && this.active === btn) { this.stop(); return; }
    this.stop();
    const lang = K.i18n.lang, voice = this.voiceFor(lang);
    if (!voice && lang !== 'en') { K.ui.toast(K.t('say.noVoice'), 4200); return; }
    const plain = K.toLatinDigits(text);
    const q = this.chunks(plain);
    this.active = btn || true;
    if (btn) { btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); }
    const rate = K.settings.get('speechRate') || 0.92;
    q.forEach((s, i) => {
      const u = new SpeechSynthesisUtterance(s);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = K.i18n.info(lang).speech;
      u.rate = rate;
      if (i === q.length - 1) u.onend = () => this.stop();
      u.onerror = () => this.stop();
      speechSynthesis.speak(u);
    });
  },
  stop() {
    if (this.ok) { try { speechSynthesis.cancel(); } catch (e) {} }
    if (this.active && this.active !== true) { this.active.classList.remove('on'); this.active.setAttribute('aria-pressed', 'false'); }
    this.active = null;
  },
};
/* <button class="say" data-act="say" data-arg="#selector"> reads that element's text */
K.ui.say = (target, label) => K.h`<button type="button" class="say" data-act="say" data-arg="${target}" aria-pressed="false">${K.ui.icon('sound')}<span>${label || K.t('btn.listen')}</span></button>`;
K.acts.say = (el) => { const t = document.querySelector(el.dataset.arg); if (t) K.speech.speak(t.innerText, el); };
