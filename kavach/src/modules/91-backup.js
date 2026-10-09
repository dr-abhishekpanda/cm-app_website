/* ============================================================================
   modules/91-backup — backup file (export / share / import-merge),
   single-card file transfer, and text summary sharing.
   File format: { app:'kavach', format:1, exportedAt, cards:[…], media:[…], settings:{…} }
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'bk.title': { en: 'Backup & restore', or: 'ବ୍ୟାକଅପ୍ ଓ ପୁନରୁଦ୍ଧାର' },
  'bk.lede': { en: 'Cards live only on this phone. A backup file keeps them safe if the phone is lost, reset, or the browser data is cleared.', or: 'କାର୍ଡ କେବଳ ଏହି ଫୋନରେ ରହେ। ଫୋନ୍ ହଜିଲେ, ରିସେଟ୍ ହେଲେ ବା ବ୍ରାଉଜର୍ ତଥ୍ୟ ହଟିଲେ ବ୍ୟାକଅପ୍ ଫାଇଲ୍ ସେଗୁଡ଼ିକୁ ସୁରକ୍ଷିତ ରଖେ।' },
  'bk.save': { en: 'Save backup file', or: 'ବ୍ୟାକଅପ୍ ଫାଇଲ୍ ସେଭ୍ କରନ୍ତୁ' },
  'bk.saveSub': { en: 'Downloads one file with all cards. Keep it in Google Drive or send it to yourself.', or: 'ସମସ୍ତ କାର୍ଡ ସହିତ ଗୋଟିଏ ଫାଇଲ୍ ଡାଉନଲୋଡ୍ ହେବ। ଏହାକୁ Google Drive ରେ ରଖନ୍ତୁ କିମ୍ବା ନିଜକୁ ପଠାନ୍ତୁ।' },
  'bk.share': { en: 'Share backup file', or: 'ବ୍ୟାକଅପ୍ ଫାଇଲ୍ ସେୟାର୍ କରନ୍ତୁ' },
  'bk.shareSub': { en: 'Send the file through WhatsApp, Drive or email.', or: 'WhatsApp, Drive ବା ଇମେଲ୍ ମାଧ୍ୟମରେ ଫାଇଲ୍ ପଠାନ୍ତୁ।' },
  'bk.restore': { en: 'Restore from a file', or: 'ଫାଇଲ୍‌ରୁ ପୁନରୁଦ୍ଧାର କରନ୍ତୁ' },
  'bk.restoreSub': { en: 'Adds the cards in the file. If a card already exists, the newer copy is kept.', or: 'ଫାଇଲ୍‌ରେ ଥିବା କାର୍ଡ ଯୋଗ ହେବ। କାର୍ଡ ପୂର୍ବରୁ ଥିଲେ ନୂଆ ସଂସ୍କରଣ ରଖାଯିବ।' },
  'bk.last': { en: 'Last backup: {d}', or: 'ଶେଷ ବ୍ୟାକଅପ୍: {d}' },
  'bk.never': { en: 'No backup saved yet on this phone.', or: 'ଏହି ଫୋନରେ ଏପର୍ଯ୍ୟନ୍ତ ବ୍ୟାକଅପ୍ ସେଭ୍ ହୋଇନାହିଁ।' },
  'bk.badFile': { en: 'This is not a Kavach backup file.', or: 'ଏହା କବଚ ବ୍ୟାକଅପ୍ ଫାଇଲ୍ ନୁହେଁ।' },
  'bk.preview': { en: '{n} card(s) in the file: {add} new, {upd} newer than this phone, {same} already up to date.', or: 'ଫାଇଲ୍‌ରେ {n}ଟି କାର୍ଡ: {add}ଟି ନୂଆ, {upd}ଟି ଏହି ଫୋନଠାରୁ ନୂଆ, {same}ଟି ପୂର୍ବରୁ ଅଦ୍ୟତନ।' },
  'bk.import': { en: 'Add to this phone', or: 'ଏହି ଫୋନରେ ଯୋଗ କରନ୍ତୁ' },
  'bk.done': { en: 'Restored {n} card(s)', or: '{n}ଟି କାର୍ଡ ପୁନରୁଦ୍ଧାର ହେଲା' },
  'bk.storage': { en: 'Storage on this phone', or: 'ଏହି ଫୋନରେ ସଂରକ୍ଷଣ' },
  'bk.persist': { en: 'Protected from automatic clean-up', or: 'ସ୍ୱୟଂଚାଳିତ ସଫା ହେବାରୁ ସୁରକ୍ଷିତ' },
  'bk.notPersist': { en: 'The browser may clear data when space is low. Install the app and keep backups.', or: 'ସ୍ଥାନ କମ୍ ହେଲେ ବ୍ରାଉଜର୍ ତଥ୍ୟ ହଟାଇପାରେ। ଆପ୍ ଇନଷ୍ଟଲ୍ କରନ୍ତୁ ଓ ବ୍ୟାକଅପ୍ ରଖନ୍ତୁ।' },
  'bk.cardFile': { en: 'Send this card as a file', or: 'ଏହି କାର୍ଡକୁ ଫାଇଲ୍ ଭାବେ ପଠାନ୍ତୁ' },
  'sum.title': { en: 'MCP card summary', or: 'MCP କାର୍ଡ ସାରାଂଶ' },
  'sum.copied': { en: 'Summary copied. Paste it in WhatsApp or SMS.', or: 'ସାରାଂଶ କପି ହେଲା। WhatsApp ବା SMS ରେ ପେଷ୍ଟ କରନ୍ତୁ।' },
  'sum.copy': { en: 'Copy text', or: 'ଲେଖା କପି କରନ୍ତୁ' },
});

K.backup = {
  async build(cardIds) {
    const cards = K.store.list().filter(c => !cardIds || cardIds.includes(c.id)).map(K.copy);
    const media = (await K.db.all('media') || []).filter(m => cards.some(c => c.id === m.cardId));
    const s = K.settings.data;
    return { app: 'kavach', format: 1, exportedAt: new Date().toISOString(), build: K.build, cards, media,
      settings: cardIds ? undefined : { lang: s.lang, mode: s.mode, district: s.district, jeArea: s.jeArea, ifaDays: s.ifaDays, odiaNum: s.odiaNum } };
  },
  fileName(cardName) { return `kavach-${cardName ? String(cardName).replace(/[^\w଀-୿]+/g, '-').slice(0, 30) + '-' : 'backup-'}${K.d.today()}.json`; },
  async file(cardIds, name) { const data = await this.build(cardIds); return new File([JSON.stringify(data)], this.fileName(name), { type: 'application/json' }); },
  async parse(file) {
    const txt = await file.text(); let d;
    try { d = JSON.parse(txt); } catch (e) { return null; }
    if (!d || d.app !== 'kavach' || !Array.isArray(d.cards)) return null;
    return d;
  },
  plan(d) {
    const out = { add: [], upd: [], same: [] };
    d.cards.forEach(c => { if (!c || !c.id || !c.mother) return; const cur = K.store.card(c.id);
      if (!cur) out.add.push(c); else if ((c.updatedAt || '') > (cur.updatedAt || '')) out.upd.push(c); else out.same.push(c); });
    return out;
  },
  async apply(d) {
    const p = this.plan(d); let n = 0;
    for (const c0 of [...p.add, ...p.upd]) {
      const c = K.migrate ? K.migrate(c0) : c0; delete c.deletedAt; c.updatedAt = c.updatedAt || new Date().toISOString();
      await K.db.put('cards', c);
      const i = K.store.cards.findIndex(x => x.id === c.id); if (i >= 0) K.store.cards[i] = c; else K.store.cards.push(c);
      n++;
    }
    const have = new Set((await K.db.all('media') || []).map(m => m.id));
    for (const m of (d.media || [])) if (m && m.id && !have.has(m.id)) await K.db.put('media', m);
    K.bus.emit('cards');
    return n;
  },
};

K.route('/backup', () => {
  const lb = K.settings.get('lastBackup');
  const canShareFiles = !!(navigator.canShare && window.File && navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'application/json' })] }));
  return {
    title: K.t('bk.title'), back: '/more', tab: 'more',
    html: h`<div class="wrap">${K.ui.phead('', K.t('bk.title'), K.t('bk.lede'))}
      <p class="small">${lb ? K.t('bk.last', { d: K.d.fmt(lb.slice(0, 10), 'long') }) : K.t('bk.never')}</p>
      <div class="list">
        ${K.ui.li({ act: 'bkSave', icon: 'download', title: K.t('bk.save'), meta: K.t('bk.saveSub') })}
        ${canShareFiles ? K.ui.li({ act: 'bkShare', icon: 'share', title: K.t('bk.share'), meta: K.t('bk.shareSub') }) : ''}
        <label class="li" for="bk-file"><span class="lead info">${K.ui.icon('upload')}</span><span class="body"><span class="t">${K.t('bk.restore')}</span><span class="m">${K.t('bk.restoreSub')}</span></span><span class="trail">${K.ui.icon('chev', 'sm')}</span></label>
      </div>
      <input type="file" id="bk-file" accept="application/json,.json" hidden data-live="bkPick">
      <div id="bk-preview"></div>
      <section class="sec" style="margin-top:22px">${K.ui.eyebrow(K.t('bk.storage'))}
        <p class="small">${K.store.persisted ? K.t('bk.persist') : K.t('bk.notPersist')} · <span class="mono">${K.db.mode()}</span></p></section>
    </div>`,
  };
});
const stamp = () => K.settings.set('lastBackup', new Date().toISOString());
K.acts.bkSave = async () => { const f = await K.backup.file(); K.download(f.name, f); stamp(); K.ui.toast(K.t('saved')); setTimeout(K.refresh, 600); };
K.acts.bkShare = async () => {
  const f = await K.backup.file();
  try { await navigator.share({ files: [f], title: K.t('app.name') }); stamp(); K.refresh(); }
  catch (e) { if (e && e.name !== 'AbortError') { K.download(f.name, f); stamp(); } }
};
K.live.bkPick = async (el) => {
  const file = el.files && el.files[0]; if (!file) return;
  const d = await K.backup.parse(file); const box = K.$('#bk-preview');
  if (!d) { box.innerHTML = K.hv(K.h`<p></p>${K.ui.callout('danger', '', K.t('bk.badFile'))}`); return; }
  const p = K.backup.plan(d); K.backup._pending = d;
  box.innerHTML = K.hv(K.h`<p></p>${K.ui.callout('info', file.name, K.h`<p>${K.t('bk.preview', { n: d.cards.length, add: p.add.length, upd: p.upd.length, same: p.same.length })}</p>
    <p style="margin-top:10px">${K.ui.btn(K.t('bk.import'), { act: 'bkImport', icon: 'upload', disabled: !(p.add.length + p.upd.length) })}</p>`, 'upload')}`);
  el.value = '';
};
K.acts.bkImport = async () => { const d = K.backup._pending; if (!d) return; const n = await K.backup.apply(d); K.backup._pending = null;
  if (d.settings && !K.store.list().length) Object.entries(d.settings).forEach(([k, v]) => v != null && K.settings.set(k, v));
  K.ui.toast(K.t('bk.done', { n })); K.go('/'); };

/* ---------------------------------------------------------------- one card: file + text summary */
K.acts.cardFile = async (el) => {
  const c = K.card.load(el.dataset.arg); if (!c) return;
  const f = await K.backup.file([c.id], c.mother.name);
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: c.mother.name }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  K.download(f.name, f);
};
K.card.summaryText = (c) => {
  const m = c.mother; const lines = [`${K.t('sum.title')} — ${m.name || ''}`];
  const idl = [m.village, m.rchId ? 'RCH ' + m.rchId : '', m.phone].filter(Boolean).join(' · '); if (idl) lines.push(idl);
  K.summary.providers.forEach(p => { try { (p(c) || []).forEach(l => l && lines.push(l)); } catch (e) { console.error(e); } });
  const due = K.due.forCard(c).filter(i => i.days <= 30).slice(0, 6);
  if (due.length) { lines.push(''); lines.push(K.t('card.next') + ':'); due.forEach(i => lines.push(`• ${K.L(i.title)} — ${K.d.fmt(i.date)} (${K.due.label(i)})`)); }
  lines.push(''); lines.push(`${K.t('app.name')} · #CM-APP`);
  return lines.join('\n');
};
K.acts.shareCard = async (el) => {
  const c = K.card.load(el.dataset.arg); if (!c) return;
  const text = K.card.summaryText(c);
  if (navigator.share) { try { await navigator.share({ title: K.t('sum.title'), text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  K.ui.sheet.open(K.h`<h2>${K.t('sum.title')}</h2><div class="field"><textarea id="sum-txt" rows="12" readonly>${text}</textarea></div><p></p>
    <div class="btn-row">${K.ui.btn(K.t('sum.copy'), { act: 'copySummary', icon: 'check' })}${K.ui.btn(K.t('bk.cardFile'), { act: 'cardFile', arg: c.id, tone: 'ghost', icon: 'download' })}</div>`);
};
K.acts.copySummary = async () => { const t = K.$('#sum-txt'); try { await navigator.clipboard.writeText(t.value); } catch (e) { t.select(); document.execCommand && document.execCommand('copy'); } K.ui.toast(K.t('sum.copied')); };
