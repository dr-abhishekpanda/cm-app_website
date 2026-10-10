/* ============================================================================
   modules/96-review — Odia review sheet: every bilingual string in the app
   (UI dictionary and content) as a CSV for a reviewer to check the Odia,
   with empty "status" and "comment" columns. UTF-8 with BOM so Excel opens
   Odia correctly. Also the "new version ready" banner for the service worker.
   ============================================================================ */
const h = K.h;
K.i18n.add({
  'rev.title': { en: 'Odia review sheet (CSV)', or: 'ଓଡ଼ିଆ ସମୀକ୍ଷା ଶିଟ୍ (CSV)' },
  'rev.sub': { en: 'Every English–Odia pair in the app, for a language reviewer', or: 'ଭାଷା ସମୀକ୍ଷକଙ୍କ ପାଇଁ ଆପ୍‌ର ସମସ୍ତ ଇଂରାଜୀ–ଓଡ଼ିଆ ଲେଖା' },
  'rev.done': { en: '{n} strings exported', or: '{n}ଟି ଲେଖା ରପ୍ତାନି ହେଲା' },
  'upd.ready': { en: 'A new version of the app is ready.', or: 'ଆପ୍‌ର ନୂଆ ସଂସ୍କରଣ ପ୍ରସ୍ତୁତ।' },
  'upd.reload': { en: 'Reload', or: 'ପୁଣି ଖୋଲନ୍ତୁ' },
});

K.review = {};
K.review.collect = () => {
  const rows = []; const seen = new WeakSet();
  const walk = (o, path) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if ((typeof o.en === 'string' || typeof o.or === 'string') && !Array.isArray(o)) rows.push({ path, en: o.en || '', or: o.or || '' });
    Object.keys(o).forEach(k => { if (k === 'en' || k === 'or') return; const v = o[k]; if (v && typeof v === 'object') walk(v, path ? `${path}.${k}` : k); });
  };
  Object.keys(K.i18n.dict).sort().forEach(k => { const e = K.i18n.dict[k]; if (e && typeof e === 'object') rows.push({ path: 'ui:' + k, en: e.en || '', or: e.or || '' }); });
  const content = { content: K.content, dev: K.dev && { BANDS: K.dev.BANDS, TEXT: K.dev.TEXT }, feed: K.feed && { STAGES: K.feed.STAGES, GENERAL: K.feed.GENERAL, NO_BRAND: K.feed.NO_BRAND, LEAD: K.feed.LEAD },
    ill: K.ill, vax: K.vax && { VISITS: K.vax.VISITS, P: K.vax.P, FOUR: K.vax.FOUR, KNOW: K.vax.KNOW }, hrp: K.hrp && K.hrp.ITEMS, fp: K.fp && K.fp.METHODS,
    help: K.help && { CALLS: K.help.CALLS, SCHEMES: K.help.SCHEMES }, hist: K.preg && K.preg.HIST, sx: K.anc && K.anc.SX, hbyc: K.hbyc && { CHECK: K.hbyc.CHECK, SERVE: K.hbyc.SERVE } };
  Object.keys(content).forEach(k => walk(content[k], k));
  // drop exact duplicates (same pair reused in several places), keep the first path
  const out = []; const key = new Set();
  rows.forEach(r => { const id = r.en + '\u0001' + r.or; if (key.has(id)) return; key.add(id); out.push(r); });
  return out;
};
K.review.csv = (rows) => {
  const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  return '﻿' + [['where', 'english', 'odia', 'status (ok / fix)', 'comment'].map(q).join(',')].concat(rows.map(r => [r.path, r.en, r.or, '', ''].map(q).join(','))).join('\r\n') + '\r\n';
};
K.acts.reviewCsv = () => { const rows = K.review.collect(); K.download(`kavach-odia-review-${K.build}.csv`, K.review.csv(rows), 'text/csv;charset=utf-8'); K.ui.toast(K.t('rev.done', { n: rows.length })); };

/* service-worker update banner */
K.ui.updateReady = () => {
  if (K.$('#upd-bar')) return;
  const b = document.createElement('div'); b.id = 'upd-bar'; b.className = 'upd-bar'; b.setAttribute('role', 'status');
  b.innerHTML = K.hv(h`<span>${K.t('upd.ready')}</span>${K.ui.btn(K.t('upd.reload'), { act: 'reloadApp', size: 'sm' })}`);
  document.body.appendChild(b);
};
K.acts.reloadApp = () => location.reload();
