/* ============================================================================
   modules/64-sick — when the child is sick: danger signs first, diarrhoea
   (ORS + 14-day zinc tracker), pneumonia (signs + breath counter), fever,
   and the Odisha card's warning against branding. Breath counter at
   /tools/breath (optionally ?c=<card>&k=<child> to use the child's age).
   Fast breathing cut-offs from IMNCI: ≥60 (<2 m), ≥50 (2–12 m), ≥40 (1–5 y).
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'sick.title': { en: 'When the child is sick', or: 'ଶିଶୁ ଅସୁସ୍ଥ ହେଲେ' },
  'sick.tile': { en: 'Sick child', or: 'ଅସୁସ୍ଥ ଶିଶୁ' },
  'sick.tileSub': { en: 'Danger signs, diarrhoea, pneumonia, fever', or: 'ବିପଦ ଲକ୍ଷଣ, ତରଳ ଝାଡ଼ା, ନିମୋନିଆ, ଜ୍ୱର' },
  'sick.first': { en: 'First, look for danger signs', or: 'ପ୍ରଥମେ ବିପଦ ଲକ୍ଷଣ ଦେଖନ୍ତୁ' },
  'sick.call': { en: 'Call 108', or: '୧୦୮ କୁ ଫୋନ୍' }, 'sick.call102': { en: 'Call 102', or: '୧୦୨ କୁ ଫୋନ୍' },
  'sick.diarr': { en: 'Diarrhoea', or: 'ତରଳ ଝାଡ଼ା' },
  'sick.diarrTreat': { en: 'Treatment at home', or: 'ତରଳ ଝାଡ଼ାର ଚିକିତ୍ସା' },
  'sick.diarrPrev': { en: 'Prevention', or: 'ତରଳ ଝାଡ଼ା ନ ହେବା ପାଇଁ' },
  'sick.zincDose': { en: "Zinc for {name}: {dose} once a day for 14 days", or: '{name} ପାଇଁ ଜିଙ୍କ୍: ଦିନକୁ ଥରେ {dose}, ୧୪ ଦିନ' },
  'sick.zincHalf': { en: '½ tablet (10 mg)', or: 'ଅଧା ବଟିକା (୧୦ ମି.ଗ୍ରା.)' }, 'sick.zincOne': { en: '1 tablet (20 mg)', or: 'ଗୋଟିଏ ବଟିକା (୨୦ ମି.ଗ୍ରା.)' },
  'sick.zincYoung': { en: 'Under 2 months: no zinc at home — take the baby to a health facility.', or: '୨ ମାସରୁ କମ୍: ଘରେ ଜିଙ୍କ୍ ନୁହେଁ — ଶିଶୁକୁ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ନିଅନ୍ତୁ।' },
  'sick.zincStart': { en: 'Start the 14-day zinc record', or: '୧୪ ଦିନର ଜିଙ୍କ୍ ରେକର୍ଡ ଆରମ୍ଭ କରନ୍ତୁ' },
  'sick.zincTrk': { en: 'Zinc (14 days)', or: 'ଜିଙ୍କ୍ (୧୪ ଦିନ)' },
  'sick.zincStop': { en: 'Clear the zinc record', or: 'ଜିଙ୍କ୍ ରେକର୍ଡ ହଟାନ୍ତୁ' },
  'sick.orsAmt': { en: 'How much ORS after each loose stool: under 2 years 50–100 ml (¼ to ½ cup); 2 years and older 100–200 ml (½ to 1 cup). Give slowly with a spoon.', or: 'ପ୍ରତ୍ୟେକ ତରଳ ଝାଡ଼ା ପରେ କେତେ ଓଆର୍ଏସ୍: ୨ ବର୍ଷରୁ କମ୍ ୫୦–୧୦୦ ମି.ଲି. (୧/୪ ରୁ ୧/୨ କପ୍); ୨ ବର୍ଷ ଓ ଅଧିକ ୧୦୦–୨୦୦ ମି.ଲି. (୧/୨ ରୁ ୧ କପ୍)। ଚାମଚରେ ଧୀରେ ଧୀରେ ଦିଅନ୍ତୁ।' },
  'sick.pneu': { en: 'Pneumonia', or: 'ନିମୋନିଆ' },
  'sick.pneuSigns': { en: 'Signs of pneumonia', or: 'ନିମୋନିଆ ଚିହ୍ନଟ କରିବା ପାଇଁ' },
  'sick.pneuPrev': { en: 'Prevention', or: 'ନିମୋନିଆ ନ ହେବା ପାଇଁ' },
  'sick.breathsBy': { en: 'Pneumonia can be picked up by counting breaths for one full minute while the child is calm:', or: 'ଶ୍ୱାସକ୍ରିୟାର ଗତିକୁ ଗଣି ନିମୋନିଆ ଚିହ୍ନଟ କରାଯାଇପାରେ:' },
  'sick.countNow': { en: 'Count breaths now', or: 'ବର୍ତ୍ତମାନ ଶ୍ୱାସ ଗଣନ୍ତୁ' },
  'sick.fever': { en: 'Fever', or: 'ଜ୍ୱର' },
  'sick.fever1': { en: 'Give paracetamol drops or syrup as advised by the health worker, and sponge the body with a wet cloth.', or: 'ସ୍ୱାସ୍ଥ୍ୟକର୍ମୀଙ୍କ ପରାମର୍ଶ ଅନୁସାରେ ପାରାସିଟାମଲ୍ ଡ୍ରପ୍/ସିରପ୍ ଖୁଆନ୍ତୁ ଓ ଓଦା କନାରେ ଦେହକୁ ପୋଛନ୍ତୁ।' },
  'sick.fever2': { en: 'In malaria areas, ask the ASHA for a malaria test (RDT) the same day for any fever.', or: 'ମ୍ୟାଲେରିଆ ଅଞ୍ଚଳରେ, ଯେକୌଣସି ଜ୍ୱର ହେଲେ ସେହି ଦିନ ଆଶାଙ୍କ ଠାରୁ ମ୍ୟାଲେରିଆ ପରୀକ୍ଷା (RDT) କରାନ୍ତୁ।' },
  'sick.fever3': { en: 'Keep breastfeeding and giving food and fluids. Go to a health facility if fever is high, lasts more than 7 days, or comes with any danger sign.', or: 'ସ୍ତନ୍ୟପାନ, ଖାଦ୍ୟ ଓ ପାନୀୟ ଜାରି ରଖନ୍ତୁ। ପ୍ରବଳ ଜ୍ୱର, ୭ ଦିନରୁ ଅଧିକ ଜ୍ୱର, ବା କୌଣସି ବିପଦ ଲକ୍ଷଣ ଥିଲେ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଯାଆନ୍ତୁ।' },
  'sick.feedSick': { en: 'During any illness, keep breastfeeding and offer food often; after the illness give one extra meal a day for two weeks.', or: 'ଅସୁସ୍ଥତା ସମୟରେ ସ୍ତନ୍ୟପାନ ଜାରି ରଖନ୍ତୁ ଓ ବାରମ୍ବାର ଖାଦ୍ୟ ଦିଅନ୍ତୁ; ଭଲ ହେବା ପରେ ଦୁଇ ସପ୍ତାହ ଦିନକୁ ଗୋଟିଏ ଅଧିକ ଖାଦ୍ୟ ଦିଅନ୍ତୁ।' },
  /* breath counter */
  'br.title': { en: 'Breath counter', or: 'ଶ୍ୱାସ ଗଣନା' },
  'br.lede': { en: 'Count for one full minute while the child is calm or asleep. Watch the belly or chest rise.', or: 'ଶିଶୁ ଶାନ୍ତ ବା ଶୋଇଥିବା ବେଳେ ପୂରା ଏକ ମିନିଟ୍ ଗଣନ୍ତୁ। ପେଟ ବା ଛାତି ଉପରକୁ ଉଠିବା ଦେଖନ୍ତୁ।' },
  'br.age': { en: "Child's age", or: 'ଶିଶୁର ବୟସ' },
  'br.a1': { en: 'Under 2 months', or: '୨ ମାସରୁ କମ୍' }, 'br.a2': { en: '2–12 months', or: '୨–୧୨ ମାସ' }, 'br.a3': { en: '1–5 years', or: '୧–୫ ବର୍ଷ' },
  'br.start': { en: 'Start 60 seconds', or: '୬୦ ସେକେଣ୍ଡ ଆରମ୍ଭ' },
  'br.tap': { en: 'Tap for each breath', or: 'ପ୍ରତି ଶ୍ୱାସରେ ଛୁଅନ୍ତୁ' },
  'br.stop': { en: 'Stop', or: 'ବନ୍ଦ' },
  'br.again': { en: 'Count again', or: 'ପୁଣି ଗଣନ୍ତୁ' },
  'br.orType': { en: 'Or type the number you counted', or: 'କିମ୍ବା ଗଣିଥିବା ସଂଖ୍ୟା ଲେଖନ୍ତୁ' },
  'br.perMin': { en: 'breaths a minute', or: 'ଶ୍ୱାସ ପ୍ରତି ମିନିଟ୍' },
  'br.fast': { en: 'Fast breathing ({n} — cut-off {c})', or: 'ଦ୍ରୁତ ଶ୍ୱାସ ({n} — ସୀମା {c})' },
  'br.fastDo': { en: 'This child may have pneumonia. See the ASHA, ANM or doctor today. If the chest pulls in, or there is any danger sign, go to the hospital now (call 108).', or: 'ଶିଶୁର ନିମୋନିଆ ହୋଇପାରେ। ଆଜି ହିଁ ଆଶା, ଏ.ଏନ୍.ଏମ୍. ବା ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ। ଛାତି ଭିତରକୁ ପଶୁଥିଲେ ବା କୌଣସି ବିପଦ ଲକ୍ଷଣ ଥିଲେ ଏବେ ହିଁ ଡାକ୍ତରଖାନା ଯାଆନ୍ତୁ (୧୦୮)।' },
  'br.ok': { en: 'Not fast breathing ({n} — cut-off {c})', or: 'ଦ୍ରୁତ ଶ୍ୱାସ ନୁହେଁ ({n} — ସୀମା {c})' },
  'br.okDo': { en: 'Keep watching. Count again if the child gets worse, and look for chest indrawing.', or: 'ନଜର ରଖନ୍ତୁ। ଶିଶୁ ଅଧିକ ଅସୁସ୍ଥ ହେଲେ ପୁଣି ଗଣନ୍ତୁ ଓ ଛାତି ଭିତରକୁ ପଶୁଛି କି ଦେଖନ୍ତୁ।' },
  'br.indraw': { en: 'Chest indrawing (lower chest pulls in when breathing in) is a danger sign at any count.', or: 'ନିଃଶ୍ୱାସ ନେଲାବେଳେ ଛାତିର ତଳ ଭାଗ ଭିତରକୁ ପଶିବା ଯେକୌଣସି ଗଣନାରେ ବିପଦ ଲକ୍ଷଣ।' },
  'br.secs': { en: '{s} s', or: '{s} ସେ.' },
});

K.sick = {};
K.sick.ageM = (k) => (k && k.dob ? K.d.diff(k.dob, K.d.today()) / 30.4375 : null);
const zincDose = (m) => (m < 2 ? null : m < 6 ? K.t('sick.zincHalf') : K.t('sick.zincOne'));
const list = (arr, id) => h`<ul class="ill-list" ${id ? K.raw(`id="${id}"`) : ''}>${arr.map(x => h`<li>${x.icon ? K.ui.icon(x.icon, 'sm') : ''}<span>${K.L(x)}</span></li>`)}</ul>`;

K.route('/card/:id/child/:kid/sick', ({ id, kid }) => {
  const c = K.card.load(id); if (!c) return K.screens.notFound(); const k = K.card.findKid(c, kid); if (!k) return K.screens.notFound();
  const m = K.sick.ageM(k); const set = m != null && m < 2 ? K.content.danger.newborn : K.content.danger.child;
  const dose = m != null ? zincDose(m) : null; const z = k.zinc; const key = `${c.id}:${k.id}:zinc`;
  return { title: K.t('sick.title'), sub: K.child.label(k), back: K.child.url(c, k).slice(1), tab: 'home',
    html: h`<div class="wrap">${K.ui.phead(K.child.label(k) + (k.dob ? ' · ' + K.d.ageText(k.dob) : ''), K.t('sick.title'))}
      <section class="k-card danger-box"><h2>${K.t('sick.first')}</h2><p class="small">${K.L(set.lead || set.title)}</p>
        <ul class="ill-list">${set.items.map(x => h`<li>${K.ui.icon(x.icon || 'alert', 'sm')}<span>${K.L(x)}</span></li>`)}</ul>
        <div class="btn-row">${K.ui.btn(K.t('sick.call'), { href: 'tel:108', tone: 'danger', icon: 'phone' })}${K.ui.btn(K.t('sick.call102'), { href: 'tel:102', tone: 'ghost', icon: 'ambulance' })}</div></section>
      <section class="sec">${K.ui.secH(K.t('sick.diarr'))}
        <h3 class="ill-h">${K.t('sick.diarrTreat')}</h3>${list(K.ill.DIARR_TREAT, 'ill-dt')}
        <p class="small">${K.t('sick.orsAmt')}</p>
        ${m != null ? (dose ? h`<div class="k-card"><b>${K.t('sick.zincDose', { name: K.child.label(k), dose })}</b>
            ${z && z.start ? h`<div style="margin-top:10px">${K.tracker.render('trk-zinc', K.t('sick.zincTrk'), z, 14, z.start, { key })}</div><p style="margin:8px 0 0">${K.ui.btn(K.t('sick.zincStop'), { act: 'zincClear', arg: `${c.id}|${k.id}`, tone: 'quiet', size: 'sm', icon: 'trash' })}</p>`
              : h`<p style="margin:10px 0 0">${K.ui.btn(K.t('sick.zincStart'), { act: 'zincStart', arg: `${c.id}|${k.id}`, tone: 'ghost', size: 'sm', icon: 'pill' })}</p>`}</div>`
          : K.ui.callout('warn', '', K.t('sick.zincYoung'))) : ''}
        <details class="acc" style="margin-top:10px"><summary>${K.t('sick.diarrPrev')}</summary><div class="acc-b">${list(K.ill.DIARR_PREVENT)}</div></details>
        <p style="margin:10px 0 0">${K.ui.say('#ill-dt')}</p>
      </section>
      <section class="sec">${K.ui.secH(K.t('sick.pneu'))}
        <h3 class="ill-h">${K.t('sick.pneuSigns')}</h3>${list(K.ill.PNEU_SIGNS, 'ill-ps')}
        <p class="small">${K.t('sick.breathsBy')}</p><ul class="ul small">${K.ill.FAST_TEXT.map(x => h`<li>${K.L(x)}</li>`)}</ul>
        <p>${K.ui.btn(K.t('sick.countNow'), { href: `#/tools/breath?c=${c.id}&k=${k.id}`, icon: 'timer' })}</p>
        <details class="acc"><summary>${K.t('sick.pneuPrev')}</summary><div class="acc-b">${list(K.ill.PNEU_PREVENT)}</div></details>
      </section>
      <section class="sec">${K.ui.secH(K.t('sick.fever'))}<div class="k-card" id="ill-fv"><ul class="ul"><li>${K.t('sick.fever1')}</li><li>${K.t('sick.fever2')}</li><li>${K.t('sick.fever3')}</li></ul><p style="margin:10px 0 0">${K.ui.say('#ill-fv')}</p></div></section>
      <section class="sec">${K.ui.callout('info', '', K.t('sick.feedSick'), 'bowl')}<p></p>${K.ui.callout('', '', K.L(K.ill.CONTACT), 'phone')}<p></p>${K.ui.callout('danger', '', K.L(K.feed.NO_BRAND))}</section>
    </div>` };
});
K.acts.zincStart = async (el) => { const [cid, kid] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return; k.zinc = { start: K.d.today(), days: {} }; await K.store.save(c); K.refresh(); };
K.acts.zincClear = async (el) => { const [cid, kid] = el.dataset.arg.split('|'); const c = K.card.load(cid); const k = c && K.card.findKid(c, kid); if (!k) return; k.zinc = null; await K.store.save(c); K.refresh(); };

K.child.addTile(50, (c, k) => {
  const z = k.zinc; const zLive = z && z.start && K.d.diff(z.start, K.d.today()) < 14;
  return { icon: 'alert', tone: 'red', title: K.t('sick.tile'), href: K.child.url(c, k, '/sick'),
    sub: zLive ? `${K.t('sick.zincTrk')} · ${K.digits(Object.keys(z.days || {}).length)}/${K.digits(14)}` : K.t('sick.tileSub') };
});
K.due.add((c, today) => {
  const out = [];
  K.card.kids(c).forEach(k => { const z = k.zinc; if (!z || !z.start) return; const d = K.d.diff(z.start, today); if (d < 0 || d >= 14 || (z.days || {})[today]) return;
    out.push({ id: 'zinc' + k.id, kind: 'med', icon: 'pill', href: K.child.url(c, k, '/sick'), who: K.child.label(k), date: today,
      title: { en: `${K.child.label(k)}: zinc today (day ${d + 1} of 14)`, or: `${K.child.label(k)}: ଆଜି ଜିଙ୍କ୍ (୧୪ ମଧ୍ୟରୁ ${d + 1} ଦିନ)` } }); });
  return out;
});

/* ---------------------------------------------------------------- breath counter */
K.sick.timer = null;
K.route('/tools/breath', (_, q) => {
  const c = q.get('c') && K.card.load(q.get('c')); const k = c && K.card.findKid(c, q.get('k'));
  const m = k ? K.sick.ageM(k) : null; const band = m == null ? '' : m < 2 ? 'a1' : m < 12 ? 'a2' : 'a3';
  return { title: K.t('br.title'), sub: k ? K.child.label(k) : '', back: k ? K.child.url(c, k, '/sick').slice(1) : '/tools', tab: 'tools',
    html: h`<div class="wrap">${K.ui.phead('', K.t('br.title'), K.t('br.lede'))}
      <form class="form" data-form="breathCalc">
        ${K.ui.choices({ name: 'age', label: K.t('br.age'), value: band, options: ['a1', 'a2', 'a3'].map(v => ({ v, l: K.t('br.' + v) })), live: 'breathAge' })}
        <div class="br-box k-card">
          <div class="br-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="br-bg"/><circle cx="60" cy="60" r="52" class="br-fg" id="br-arc" stroke-dasharray="326.7" stroke-dashoffset="0"/></svg>
            <div class="br-mid"><b class="mono" id="br-count">0</b><span class="small" id="br-secs">${K.t('br.secs', { s: 60 })}</span></div></div>
          <button type="button" class="btn primary lg block" data-act="breathGo" id="br-go">${K.ui.icon('timer')}<span>${K.t('br.start')}</span></button>
          <button type="button" class="btn accent lg block br-tap" data-act="breathTap" id="br-tap" hidden><span>${K.t('br.tap')}</span></button>
        </div>
        ${K.ui.field({ name: 'n', id: 'br-n', type: 'number', label: K.t('br.orType'), unit: K.t('br.perMin'), attrs: { 'data-live': 'breathAge' } })}
      </form>
      <section id="br-result" aria-live="polite"></section>
      <p class="small">${K.t('br.indraw')}</p>
      <ul class="ul small">${K.ill.FAST_TEXT.map(x => h`<li>${K.L(x)}</li>`)}</ul>
    </div>`,
    mount() { K.sick.breath = { n: 0, running: false }; K.live.breathAge(); },
  };
});
K.sick.result = () => {
  const f = K.$('form[data-form="breathCalc"]'); if (!f) return; const v = K.formData(f); const box = K.$('#br-result'); if (!box) return;
  const n = v.n; if (n == null || !v.age) { box.innerHTML = ''; return; }
  const cut = { a1: 60, a2: 50, a3: 40 }[v.age]; const fast = n >= cut;
  box.innerHTML = K.hv(fast ? K.ui.callout('danger', K.t('br.fast', { n, c: cut }), K.t('br.fastDo')) : K.ui.callout('', K.t('br.ok', { n, c: cut }), K.t('br.okDo'), 'check'));
};
K.live.breathAge = () => K.sick.result();
K.acts.breathGo = () => {
  const s = K.sick.breath = { n: 0, running: true, t0: Date.now() };
  K.$('#br-go').hidden = true; K.$('#br-tap').hidden = false; K.$('#br-count').textContent = K.digits(0); K.$('#br-n').value = ''; K.$('#br-result').innerHTML = '';
  clearInterval(K.sick.timer);
  K.sick.timer = setInterval(() => {
    const el = K.$('#br-secs'); if (!el) { clearInterval(K.sick.timer); return; }
    const left = Math.max(0, 60 - Math.floor((Date.now() - s.t0) / 1000));
    el.textContent = K.t('br.secs', { s: left }); K.$('#br-arc').setAttribute('stroke-dashoffset', String(326.7 * (1 - left / 60)));
    if (left <= 0) { clearInterval(K.sick.timer); s.running = false; K.$('#br-tap').hidden = true; const g = K.$('#br-go'); g.hidden = false; g.querySelector('span').textContent = K.t('br.again');
      K.$('#br-n').value = s.n; K.sick.result(); if (navigator.vibrate) navigator.vibrate(300); }
  }, 250);
};
K.acts.breathTap = () => { const s = K.sick.breath; if (!s || !s.running) return; s.n++; K.$('#br-count').textContent = K.digits(s.n); };
K.bus.on && K.bus.on('rendered', () => { if (!K.$('#br-secs')) clearInterval(K.sick.timer); });
