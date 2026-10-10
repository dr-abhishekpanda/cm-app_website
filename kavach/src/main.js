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
  // no service worker on localhost while developing, unless localStorage "kavach.swdev" is set (for offline tests)
  const isLocal = /^(localhost|127\.)/.test(location.hostname); let swDev = false; try { swDev = !!localStorage.getItem('kavach.swdev'); } catch (e) {}
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && (!isLocal || swDev)) {
    const hadController = !!navigator.serviceWorker.controller; // first install is not an "update"
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) K.ui.updateReady(); });
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW', err));
  }
  if (!K.settings.get('onboarded') && K.path() !== '/welcome') { history.replaceState(null, '', '#/welcome'); }
  await K.render();
})();
