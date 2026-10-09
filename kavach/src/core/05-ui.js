/* ============================================================================
   core/05-ui — component helpers (return K.Raw), sheets, toasts, dialogs,
   and global event delegation:
     data-act="name"   → K.acts[name](el, event)       (click)
     data-form="name"  → K.forms[name](values, form)   (submit)
     data-live="name"  → K.live[name](el, event)        (input/change)
   ============================================================================ */
const h = K.h;
K.acts = K.acts || {};
K.forms = K.forms || {};
K.live = K.live || {};
K.screens = K.screens || {};

K.ui = {
  icon: (name, cls) => h`<svg class="${K.cls('ic', cls)}" aria-hidden="true"><use href="#i-${name}"/></svg>`,
  langToggleLabel() { const L = K.i18n.langs; if (L.length === 2) return (L.find(l => l.code !== K.i18n.lang) || L[0]).short; return K.i18n.info().short; },

  /* buttons and links */
  btn(label, o = {}) {
    const cls = K.cls('btn', o.tone || 'primary', o.size, o.block && 'block', o.cls);
    const inner = h`${o.icon ? K.ui.icon(o.icon) : ''}<span>${label}</span>${o.arrow ? K.ui.icon('chev', 'sm') : ''}`;
    if (o.href) return h`<a class="${cls}" href="${o.href}" ${o.newTab ? K.raw('target="_blank" rel="noopener"') : ''}>${inner}</a>`;
    return h`<button type="${o.type || 'button'}" class="${cls}" ${o.act ? K.raw(`data-act="${K.esc(o.act)}"`) : ''} ${o.arg != null ? K.raw(`data-arg="${K.esc(o.arg)}"`) : ''} ${o.disabled ? K.raw('disabled') : ''} ${o.aria ? K.raw(`aria-label="${K.esc(o.aria)}"`) : ''}>${inner}</button>`;
  },
  pill: (text, tone = 'ink', icon) => h`<span class="pill ${tone}">${icon ? K.ui.icon(icon) : ''}${text}</span>`,
  stat: (lb, vl, tone, sub) => h`<div class="stat"><span class="lb">${lb}</span><span class="vl ${tone || ''}">${vl}</span>${sub ? h`<span class="sub">${sub}</span>` : ''}</div>`,
  callout(tone, title, body, icon) {
    const ic = icon || ({ danger: 'alert', warn: 'alert', info: 'info' }[tone] || 'info');
    return h`<div class="callout ${tone || ''}" role="${tone === 'danger' ? 'alert' : 'note'}">${K.ui.icon(ic)}<div class="ct">${title ? h`<b>${title}</b>` : ''}${body instanceof K.Raw ? body : (body ? h`<p>${body}</p>` : '')}</div></div>`;
  },
  empty: (icon, text, action) => h`<div class="empty">${K.ui.icon(icon)}<p>${text}</p>${action || ''}</div>`,
  eyebrow: (t) => h`<div class="eyebrow">${t}</div>`,
  phead: (eyebrow, title, lede) => h`<header class="phead">${eyebrow ? K.ui.eyebrow(eyebrow) : ''}<h1>${title}</h1>${lede ? h`<p class="lede">${lede}</p>` : ''}</header>`,
  secH: (title, link) => h`<div class="sec-h"><h2>${title}</h2>${link || ''}</div>`,

  /* list row */
  li(o) {
    const lead = o.icon ? h`<span class="lead ${o.tone || ''}">${K.ui.icon(o.icon)}</span>` : (o.leadHtml || '');
    const trail = o.trail != null ? o.trail : (o.href || o.act ? K.ui.icon('chev', 'sm') : '');
    const inner = h`${lead}<span class="body"><span class="t">${o.title}</span>${o.meta ? h`<span class="m">${o.meta}</span>` : ''}</span><span class="trail">${trail}</span>`;
    const cls = K.cls('li', !lead && 'no-lead', o.cls);
    if (o.href) return h`<a class="${cls}" href="${o.href}">${inner}</a>`;
    if (o.act) return h`<button type="button" class="${cls}" data-act="${o.act}" ${o.arg != null ? K.raw(`data-arg="${K.esc(o.arg)}"`) : ''}>${inner}</button>`;
    return h`<div class="${cls}">${inner}</div>`;
  },

  /* form fields — values are always escaped */
  field(o) {
    const id = o.id || 'f-' + (o.name || '').replace(/[^\w-]/g, '_') + '-' + Math.random().toString(36).slice(2, 6);
    const v = o.value == null ? '' : o.value;
    const req = o.required ? K.raw('required') : '';
    const extra = K.raw(Object.entries(o.attrs || {}).map(([k, val]) => `${k}="${K.esc(val)}"`).join(' '));
    let ctl;
    if (o.type === 'select') {
      ctl = h`<select id="${id}" name="${o.name}" ${req} ${extra}>${o.placeholder !== false ? h`<option value="">${o.placeholder || K.t('f.choose')}</option>` : ''}${(o.options || []).map(op => h`<option value="${op.v}" ${String(op.v) === String(v) ? K.raw('selected') : ''}>${op.l}</option>`)}</select>`;
    } else if (o.type === 'textarea') {
      ctl = h`<textarea id="${id}" name="${o.name}" rows="${o.rows || 3}" ${req} ${extra} placeholder="${o.ph || ''}">${v}</textarea>`;
    } else {
      const type = o.type || 'text';
      const num = type === 'number' || type === 'decimal';
      const inputmode = o.inputmode || (type === 'decimal' ? 'decimal' : type === 'number' ? 'numeric' : type === 'tel' ? 'tel' : '');
      const input = h`<input id="${id}" name="${o.name}" type="${num ? 'text' : type}" ${inputmode ? K.raw(`inputmode="${inputmode}"`) : ''} value="${v}" ${req} ${extra}
        ${o.ph ? K.raw(`placeholder="${K.esc(o.ph)}"`) : ''} ${o.max ? K.raw(`max="${K.esc(o.max)}"`) : ''} ${o.min ? K.raw(`min="${K.esc(o.min)}"`) : ''}
        ${num ? K.raw(`data-num="1" autocomplete="off"`) : ''} ${o.cls ? K.raw(`class="${K.esc(o.cls)}"`) : ''}>`;
      ctl = o.unit ? h`<div class="unit-wrap">${input}<span class="unit">${o.unit}</span></div>` : input;
    }
    return h`<div class="${K.cls('field', o.state, o.wrapCls)}" ${o.show === false ? K.raw('hidden') : ''}>${o.label ? h`<label for="${id}">${o.label}</label>` : ''}${ctl}${o.hint ? h`<span class="hint">${o.hint}</span>` : ''}${o.err ? h`<span class="err">${o.err}</span>` : ''}</div>`;
  },
  choices(o) {
    const multi = !!o.multi; const vals = multi ? (o.value || []) : [o.value];
    return h`<div class="field">${o.label ? h`<span class="lbl">${o.label}</span>` : ''}<div class="choices" role="${multi ? 'group' : 'radiogroup'}">${(o.options || []).map(op => h`<label class="choice ${op.tone || ''}"><input type="${multi ? 'checkbox' : 'radio'}" name="${o.name}" value="${op.v}" ${vals.map(String).includes(String(op.v)) ? K.raw('checked') : ''} ${o.live ? K.raw(`data-live="${K.esc(o.live)}"`) : ''}><span>${op.icon ? K.ui.icon(op.icon, 'sm') : ''}${op.l}</span></label>`)}</div>${o.hint ? h`<span class="hint">${o.hint}</span>` : ''}</div>`;
  },
  /* yes / no / (optional) unknown row; value 1 / 0 / '' */
  yn(o) {
    const v = o.value == null ? '' : String(o.value);
    return h`<div class="ynrow ${o.auto ? 'auto' : ''}"><div class="q">${o.code ? h`<span class="code">${o.code}</span>` : ''}${o.q}${o.sub ? h`<small>${o.sub}</small>` : ''}</div>
      <div class="yn ${o.pos ? 'pos' : ''}" role="radiogroup" aria-label="${o.q}"><label><input type="radio" name="${o.name}" value="1" ${v === '1' ? K.raw('checked') : ''} ${o.live ? K.raw(`data-live="${K.esc(o.live)}"`) : ''}><span>${o.yes || K.t('yes')}</span></label><label><input type="radio" name="${o.name}" value="0" ${v === '0' ? K.raw('checked') : ''} ${o.live ? K.raw(`data-live="${K.esc(o.live)}"`) : ''}><span>${o.no || K.t('no')}</span></label></div></div>`;
  },
  sw: (o) => h`<label class="switch"><span class="sw-t"><b>${o.title}</b>${o.sub ? h`<small>${o.sub}</small>` : ''}</span><input type="checkbox" name="${o.name}" ${o.checked ? K.raw('checked') : ''} ${o.live ? K.raw(`data-live="${K.esc(o.live)}"`) : ''}><span class="tr" aria-hidden="true"></span></label>`,
  seg: (items, active) => h`<div class="seg" role="tablist">${items.map(it => it.href ? h`<a href="${it.href}" class="${it.k === active ? 'on' : ''}" role="tab" aria-selected="${it.k === active}">${it.l}</a>` : h`<button type="button" class="${it.k === active ? 'on' : ''}" data-act="${it.act}" data-arg="${it.k}" role="tab" aria-selected="${it.k === active}">${it.l}</button>`)}</div>`,
  bar: (pct, tone) => h`<div class="bar ${tone || ''}" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${K.clamp(pct, 0, 100)}%"></i></div>`,
  avatar(name, o = {}) { return h`<span class="${K.cls('avatar', o.lg && 'lg', o.tone)}" aria-hidden="true">${o.img ? h`<img src="${o.img}" alt="">` : K.initials(name)}</span>`; },

  /* toast */
  toast(msg, ms = 2400) { const t = K.$('#toast'); t.textContent = msg; t.classList.add('in'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('in'), ms); },

  /* bottom sheet */
  sheet: {
    open(html, o = {}) {
      K.ui.sheet.close(true);
      const root = K.$('#sheet-root');
      root.innerHTML = K.hv(h`<div class="sheet-bg" data-act="sheetClose"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="${o.label || ''}"><div class="grab"></div><div class="sh-in">${html}</div></div>`);
      const sh = K.$('.sheet', root), bg = K.$('.sheet-bg', root);
      requestAnimationFrame(() => { sh.classList.add('in'); bg.classList.add('in'); });
      K.ui.sheet._onClose = o.onClose;
      const f = sh.querySelector('input,select,textarea,button:not(.sheet-x)'); if (f && o.focus !== false) setTimeout(() => f.focus({ preventScroll: true }), 220);
      if (o.mount) o.mount(sh);
      return sh;
    },
    close(instant) {
      const root = K.$('#sheet-root'); if (!root || !root.firstChild) return;
      const sh = K.$('.sheet', root), bg = K.$('.sheet-bg', root);
      const done = () => { root.innerHTML = ''; const f = K.ui.sheet._onClose; K.ui.sheet._onClose = null; f && f(); };
      if (instant) return done();
      sh && sh.classList.remove('in'); bg && bg.classList.remove('in'); setTimeout(done, 200);
    },
  },
  /* promise-based confirm, no native dialogs */
  confirm(msg, o = {}) {
    return new Promise(res => {
      K.ui._confirmRes = res;
      K.ui.sheet.open(h`<h2>${o.title || K.t('dlg.sure')}</h2><p class="lede">${msg}</p>
        <div class="btn-row" style="margin-top:16px">${K.ui.btn(o.ok || K.t('btn.ok'), { tone: o.danger ? 'danger' : 'primary', act: 'confirmYes', size: 'lg' })}${K.ui.btn(o.cancel || K.t('btn.cancel'), { tone: 'ghost', act: 'confirmNo', size: 'lg' })}</div>`,
        { onClose: () => { if (K.ui._confirmRes) { K.ui._confirmRes(false); K.ui._confirmRes = null; } } });
    });
  },
  updateBadges() {},
};
K.acts.sheetClose = () => K.ui.sheet.close();
K.acts.confirmYes = () => { const r = K.ui._confirmRes; K.ui._confirmRes = null; K.ui.sheet.close(); r && r(true); };
K.acts.confirmNo = () => { const r = K.ui._confirmRes; K.ui._confirmRes = null; K.ui.sheet.close(); r && r(false); };
K.acts.back = () => K.back();

/* collect a form into a plain object: numbers parsed, empties dropped, checkbox groups → arrays */
K.formData = (form) => {
  const out = {};
  const els = Array.from(form.elements).filter(e => e.name && !e.disabled);
  const groups = {};
  els.forEach(e => { if (e.type === 'checkbox') { (groups[e.name] = groups[e.name] || []).push(e); } });
  els.forEach(e => {
    if (e.type === 'checkbox') return;
    if (e.type === 'radio') { if (e.checked) out[e.name] = e.value; else if (!(e.name in out)) out[e.name] = undefined; return; }
    let v = e.value.trim();
    if (e.dataset.num) { v = K.toLatinDigits(v).replace(',', '.'); v = v === '' ? undefined : (isNaN(+v) ? undefined : +v); }
    else if (v === '') v = undefined;
    out[e.name] = v;
  });
  Object.entries(groups).forEach(([name, list]) => {
    if (list.length === 1 && !form.querySelectorAll(`[name="${CSS.escape(name)}"]`)[1]) out[name] = list[0].checked;
    else out[name] = list.filter(e => e.checked).map(e => e.value);
  });
  Object.keys(out).forEach(k => { if (out[k] === undefined) delete out[k]; });
  return out;
};

/* global delegation */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = K.acts[el.dataset.act];
  if (fn) { e.preventDefault(); try { fn(el, e); } catch (err) { console.error(err); } }
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const fn = K.forms[f.dataset.form];
  if (fn) { try { fn(K.formData(f), f, e); } catch (err) { console.error(err); K.ui.toast(K.t('err.generic')); } }
});
const liveHandler = (e) => { const el = e.target.closest('[data-live]'); if (!el) return; const fn = K.live[el.dataset.live]; if (fn) fn(el, e); };
document.addEventListener('input', liveHandler);
document.addEventListener('change', liveHandler);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') K.ui.sheet.close(); });
