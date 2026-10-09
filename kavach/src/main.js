/* ============================================================================
   main — boot sequence
   ============================================================================ */
(async function boot() {
  K.settings.load();
  K.speech.init();
  try { await K.store.init(); } catch (e) { console.error(e); }
  if (K.db.mode() !== 'idb') setTimeout(() => K.ui.toast(K.t('warn.storage'), 6000), 1200);
  K.bus.on('storage-warning', () => K.ui.toast(K.t('warn.storage'), 6000));
  K.bus.on('cards', () => K.ui.updateBadges());
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
  }
  if (!K.settings.get('onboarded') && K.path() !== '/welcome') { history.replaceState(null, '', '#/welcome'); }
  await K.render();
})();
