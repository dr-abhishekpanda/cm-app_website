/* ============================================================================
   core/03-store — settings (localStorage) + family cards (IndexedDB)
   Everything stays on this device. Fallback order if IndexedDB is blocked:
   localStorage → memory (with a visible warning, never silently).
   ============================================================================ */
K.settings = {
  key: 'kavach.settings',
  data: {
    lang: 'or',            // 'or' | 'en' (more later)
    mode: 'family',        // 'family' | 'hcp'
    odiaNum: false,        // Odia numerals in Odia UI
    largeText: false,
    onboarded: false,
    district: '',
    jeArea: false,         // JE vaccine given in this district
    ifaDays: [2, 5],       // Odisha: IFA syrup on Tuesday + Friday (0=Sun)
    lastBackup: null,
    speechRate: 0.92,
    pinHash: null,
  },
  load() { const s = K.ls.get(this.key, null); if (s && typeof s === 'object') Object.assign(this.data, s); this.apply(); return this.data; },
  get(k) { return this.data[k]; },
  set(k, v) { this.data[k] = v; K.ls.set(this.key, this.data); this.apply(); K.bus.emit('settings', { k, v }); },
  apply() {
    K.i18n.lang = this.data.lang; K.i18n.odiaNum = !!this.data.odiaNum;
    document.documentElement.lang = this.data.lang;
    document.body && document.body.classList.toggle('large-text', !!this.data.largeText);
    document.body && document.body.classList.toggle('hcp', this.data.mode === 'hcp');
  },
  isHcp() { return this.data.mode === 'hcp'; },
};

K.db = (() => {
  const NAME = 'kavach', VER = 1;
  let dbp = null, mode = 'idb';
  const mem = { cards: new Map(), media: new Map(), meta: new Map() };
  const LSKEY = 'kavach.fallback';
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('no-idb'));
      let r; try { r = indexedDB.open(NAME, VER); } catch (e) { return rej(e); }
      r.onupgradeneeded = () => { const db = r.result;
        if (!db.objectStoreNames.contains('cards')) db.createObjectStore('cards', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('media')) db.createObjectStore('media', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'k' }); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error('idb-error'));
      r.onblocked = () => rej(new Error('idb-blocked'));
      setTimeout(() => rej(new Error('idb-timeout')), 6000);
    }).catch(err => { console.warn('IndexedDB unavailable, falling back', err); mode = 'ls'; loadLs(); return null; });
    return dbp;
  }
  function loadLs() {
    const s = K.ls.get(LSKEY, null);
    if (s == null && !K.ls.set(LSKEY, { cards: [], media: [] })) { mode = 'mem'; return; }
    (s && s.cards || []).forEach(c => mem.cards.set(c.id, c));
    (s && s.media || []).forEach(m => mem.media.set(m.id, m));
  }
  function saveLs() { if (mode !== 'ls') return; if (!K.ls.set(LSKEY, { cards: [...mem.cards.values()], media: [...mem.media.values()] })) { mode = 'mem'; K.bus.emit('storage-warning', 'full'); } }
  function req(db, store, m, fn) {
    return new Promise((res, rej) => {
      const t = db.transaction(store, m); const r = fn(t.objectStore(store)); let out;
      if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }
  return {
    open, mode: () => mode,
    async get(store, id) { const db = await open(); return db ? req(db, store, 'readonly', s => s.get(id)) : mem[store].get(id); },
    async all(store) { const db = await open(); return db ? req(db, store, 'readonly', s => s.getAll()) : [...mem[store].values()]; },
    async put(store, obj) { const db = await open(); if (db) return req(db, store, 'readwrite', s => s.put(obj)); mem[store].set(obj.id || obj.k, obj); saveLs(); },
    async del(store, id) { const db = await open(); if (db) return req(db, store, 'readwrite', s => s.delete(id)); mem[store].delete(id); saveLs(); },
    async clear(store) { const db = await open(); if (db) return req(db, store, 'readwrite', s => s.clear()); mem[store].clear(); saveLs(); },
  };
})();

K.store = {
  cards: [],
  async init() {
    await K.db.open();
    try { this.cards = (await K.db.all('cards')) || []; } catch (e) { console.error(e); this.cards = []; }
    // purge soft-deleted cards older than 30 days
    const cutoff = Date.now() - 30 * 86400000;
    for (const c of this.cards.filter(c => c.deletedAt && Date.parse(c.deletedAt) < cutoff)) { await K.db.del('cards', c.id); }
    this.cards = this.cards.filter(c => !(c.deletedAt && Date.parse(c.deletedAt) < cutoff)).map(c => K.migrate ? K.migrate(c) : c);
    if (navigator.storage && navigator.storage.persisted) { try { this.persisted = await navigator.storage.persisted(); } catch (e) {} }
  },
  list() { return this.cards.filter(c => !c.deletedAt).sort(K.by(c => c.updatedAt || '', -1)); },
  trash() { return this.cards.filter(c => c.deletedAt); },
  card(id) { return this.cards.find(c => c.id === id) || null; },
  async save(card, quiet) {
    card.updatedAt = new Date().toISOString();
    const i = this.cards.findIndex(c => c.id === card.id);
    if (i >= 0) this.cards[i] = card; else this.cards.push(card);
    try { await K.db.put('cards', card); } catch (e) { console.error(e); K.ui && K.ui.toast(K.t('err.save')); throw e; }
    if (!this.persisted && navigator.storage && navigator.storage.persist) { try { this.persisted = await navigator.storage.persist(); } catch (e) {} }
    if (!quiet) K.bus.emit('cards', card.id);
    return card;
  },
  async softDelete(id) { const c = this.card(id); if (!c) return; c.deletedAt = new Date().toISOString(); await this.save(c); },
  async restore(id) { const c = this.card(id); if (!c) return; delete c.deletedAt; await this.save(c); },
  async purge(id) { this.cards = this.cards.filter(c => c.id !== id); await K.db.del('cards', id); const media = await K.db.all('media'); for (const m of media.filter(m => m.cardId === id)) await K.db.del('media', m.id); K.bus.emit('cards'); },
  async putMedia(m) { await K.db.put('media', m); return m.id; },
  async getMedia(id) { return id ? K.db.get('media', id) : null; },
};

/* new, empty records — the single source of truth for record shapes */
K.blank = {
  card: () => ({
    id: K.uid('c'), v: 1, createdAt: new Date().toISOString(), updatedAt: null,
    mother: { name: '', dob: '', age: null, husband: '', phone: '', phone2: '', village: '', ward: '', block: '', district: K.settings.get('district') || '',
      rchId: '', abhaId: '', bloodGroup: '', education: '', height: null, sickle: '', mamata: null, photo: null },
    contacts: { asha: '', ashaPhone: '', aww: '', awwPhone: '', anm: '', anmPhone: '', awc: '', awcCode: '', subCentre: '', phc: '', chc: '',
      deliveryPoint: '', deliveryPhone: '', fru: '', fruPhone: '', mamataDivas: '', referral1: '', referral1Phone: '' },
    pregnancies: [], children: [], notes: '', sample: false,
  }),
  pregnancy: () => ({
    id: K.uid('p'), createdAt: new Date().toISOString(), status: 'active',
    lmp: '', usgDate: '', usgWeeks: null, usgDays: null, eddBasis: 'lmp',
    gravida: null, para: null, abortions: null, living: null, prevPlace: '', lastChildDob: '',
    village: '', hist: {}, hrp: {}, anc: [], tests: {}, td: {}, ifa: { days: {} }, calcium: { days: {} }, albendazole: '',
    birthPlan: {}, fp: {}, delivery: null, pnc: [], ppIfa: { days: {} }, ppCalcium: { days: {} }, redCard: null, notes: '',
  }),
  child: () => ({
    id: K.uid('k'), pregId: '', name: '', sex: '', dob: '', birthWeight: null, gaWeeks: null, birthRegNo: '', rchId: '', abhaId: '', photo: null,
    birth: {}, vax: {}, vitA: {}, alb: {}, growth: [], dev: {}, hbnc: [], hbyc: [], ifa: { bottles: {}, days: {} }, ill: [], notes: '',
  }),
};
