/* ============================================================================
   modules/00-shell — fallback screens, language toggle, install prompt,
   tab badges, the due-items registry used by Home and the Due tab.
   ============================================================================ */
const h = K.h;

K.screens.notFound = () => ({
  title: K.t('err.notFound'), back: '/',
  html: h`<div class="wrap">${K.ui.empty('search', K.t('err.notFoundSub'), K.ui.btn(K.t('nav.home'), { href: '#/', tone: 'ghost' }))}</div>`,
});
K.screens.error = (e) => ({
  title: K.t('err.generic'), back: '/',
  html: h`<div class="wrap">${K.ui.callout('danger', K.t('err.generic'), String(e && e.message || e))}<p></p>${K.ui.btn(K.t('nav.home'), { href: '#/', tone: 'ghost' })}</div>`,
});

/* language toggle in the top bar: two languages → swap; more → picker */
K.acts.toggleLang = () => {
  const L = K.i18n.langs;
  if (L.length === 2) { K.settings.set('lang', (L.find(l => l.code !== K.i18n.lang) || L[0]).code); K.refresh(); return; }
  K.ui.sheet.open(h`<h2>${K.t('set.lang')}</h2><div class="list">${L.map(l => K.ui.li({ act: 'setLang', arg: l.code, title: l.name, meta: l.english, trail: l.code === K.i18n.lang ? K.ui.icon('check') : '' }))}</div>`);
};
K.acts.setLang = (el) => { K.settings.set('lang', el.dataset.arg); K.ui.sheet.close(true); K.refresh(); };

/* PWA install prompt (Chrome/Android) */
K.install = { evt: null };
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); K.install.evt = e; K.bus.emit('installable'); });
window.addEventListener('appinstalled', () => { K.install.evt = null; K.ui.toast('✓'); });
K.acts.install = async () => { const e = K.install.evt; if (!e) return; e.prompt(); try { await e.userChoice; } catch (err) {} K.install.evt = null; K.refresh(); };

/* summary-line providers for the shared text summary (see 91-backup) */
K.summary = { providers: [], add(fn) { this.providers.push(fn); } };

/* ---------------------------------------------------------------- due registry
   Each module registers a provider: (card, today) => [item, …]
   item: { id, cardId, childId?, kind, title (bilingual|string), date (ISO), href,
           tone?: 'red'|'amber'|'teal', icon?, note? }
   status is derived from the date: overdue (< today) · due (≤ +7 d) · upcoming */
K.due = {
  providers: [],
  add(fn) { this.providers.push(fn); },
  /* horizon (days) lets providers with narrow "due soon" windows also list later items (Due tab, calendar file) */
  forCard(card, today, horizon) {
    today = today || K.d.today();
    const out = [];
    this.providers.forEach(p => { try { (p(card, today, horizon || 0) || []).forEach(it => out.push(Object.assign({ cardId: card.id }, it))); } catch (e) { console.error(e); } });
    out.forEach(it => { const n = K.d.diff(today, it.date); it.days = n; it.status = it.status || (n < 0 ? 'overdue' : n <= 7 ? 'due' : 'upcoming'); });
    return out.sort((a, b) => (a.status === 'overdue' ? 0 : 1) - (b.status === 'overdue' ? 0 : 1) || K.d.cmp(a.date, b.date));
  },
  all(horizon = 30) {
    const t = K.d.today(); const out = [];
    K.store.list().forEach(c => this.forCard(c, t, horizon).forEach(it => { if (it.days <= horizon) out.push(it); }));
    return out.sort((a, b) => (a.status === 'overdue' ? 0 : 1) - (b.status === 'overdue' ? 0 : 1) || K.d.cmp(a.date, b.date));
  },
  label(it) { return it.status === 'overdue' ? K.t('st.overdue') : it.days === 0 ? K.t('rel.today') : K.d.rel(it.date); },
  tone(it) { return it.status === 'overdue' ? 'over' : it.status === 'due' ? 'due' : 'soon'; },
};
K.ui.updateBadges = () => {
  const a = K.$('#tabbar a[data-tab="due"]'); if (!a) return;
  let b = K.$('.badge', a);
  let n = 0; try { n = K.due.all(0).filter(i => i.status === 'overdue' || i.days <= 0).length; } catch (e) {}
  if (!n) { b && b.remove(); return; }
  if (!b) { b = document.createElement('span'); b.className = 'badge'; a.appendChild(b); }
  b.textContent = n > 99 ? '99+' : K.digits(n);
};
