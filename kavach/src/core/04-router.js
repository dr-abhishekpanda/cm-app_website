/* ============================================================================
   core/04-router — hash routes → screens
   A screen returns { title, sub, back, tab, html, mount(root) }.
   back: true (history back) | '/path' (explicit parent) | falsy (no button)
   ============================================================================ */
K.routes = [];
K._nav = 0;
K.route = (pattern, fn) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  K.routes.push({ pattern, re, keys, fn });
};
K.path = () => (location.hash.replace(/^#/, '') || '/').split('?')[0] || '/';
K.query = () => new URLSearchParams(location.hash.split('?')[1] || '');
K.go = (path, opts = {}) => {
  const h = '#' + path;
  if (opts.replace) { history.replaceState(null, '', h); K.render(); }
  else if (location.hash === h) K.render();
  else location.hash = h;
};
K.back = () => {
  const s = K._screen || {};
  if (typeof s.back === 'string') { K.go(s.back); return; }
  if (K._nav > 0) history.back(); else K.go('/');
};
K.refresh = () => K.render({ keepScroll: true });

K.render = async (opts = {}) => {
  const path = K.path();
  let route = null, params = {};
  for (const r of K.routes) { const m = r.re.exec(path); if (m) { route = r; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); }); break; } }
  let s;
  try { s = route ? await route.fn(params, K.query()) : K.screens.notFound(); }
  catch (e) { console.error(e); s = K.screens.error(e); }
  if (!s) return;
  if (s.redirect) { K.go(s.redirect, { replace: true }); return; }
  K._screen = s;
  document.body.classList.toggle('no-tabs', !!s.noTabs);
  const view = K.$('#view');
  const y = window.scrollY;
  view.innerHTML = K.hv(s.html);
  // top bar
  const tt = K.$('#tb-title');
  tt.innerHTML = K.hv(K.h`<b>${s.title || K.t('app.name')}</b>${s.sub ? K.h`<small>${s.sub}</small>` : ''}`);
  K.$('#tb-back').hidden = !s.back; K.$('#tb-mark').hidden = !!s.back;
  K.$('#tb-lang').textContent = K.ui.langToggleLabel();
  document.title = (s.title ? s.title + ' · ' : '') + K.t('app.name');
  // tabs
  K.$$('#tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === (s.tab || '')));
  K.$$('#tabbar [data-i18n]').forEach(el => { el.textContent = K.t(el.dataset.i18n); });
  K.ui.updateBadges && K.ui.updateBadges();
  if (opts.keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  if (s.mount) { try { s.mount(view); } catch (e) { console.error(e); } }
  if (!opts.keepScroll) view.focus({ preventScroll: true });
  K.bus.emit('rendered', path);
};
window.addEventListener('hashchange', () => { K._nav++; K.ui && K.ui.sheet.close(true); K.speech && K.speech.stop(); K.render(); });
