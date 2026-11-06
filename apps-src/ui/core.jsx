/* Core UI kit: routing, settings, form controls, result blocks. EWS classes only. */
import { createContext } from 'preact';
import { useState, useEffect, useLayoutEffect, useContext, useCallback, useRef } from 'preact/hooks';

/* ------------------------------------------------------------ storage --- */
// Browser storage can be missing or throw (private windows, blocked site data); the app must work without it.
export const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
};

/* ------------------------------------------------------------- routing --- */
// Hash routes: #/ (tools home), #/learn, #/practice, #/tool/<id>, #/learn/<id>, #/practice/<id>, #/about
export function parseRoute(hash) {
  const h = (hash || '').replace(/^#/, '') || '/';
  const parts = h.split('?')[0].split('/').filter(Boolean);
  if (parts.length === 0) return { view: 'tools' };
  const [a, b] = parts;
  if (a === 'learn') return b ? { view: 'lesson', id: b } : { view: 'learn' };
  if (a === 'practice') return b ? { view: 'drill', id: b } : { view: 'practice' };
  if (a === 'tool' && b) return { view: 'tool', id: b };
  if (a === 'about') return { view: 'about' };
  if (a === 'settings') return { view: 'settings' };
  return { view: 'notfound' };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const on = () => { setRoute(parseRoute(location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

/* ------------------------------------------------------------ settings --- */
export const LEVELS = [
  { id: 'basic', label: 'Basic', note: 'Concepts and how to use each tool' },
  { id: 'intermediate', label: 'Intermediate', note: 'Adds assumptions, choices and pitfalls' },
  { id: 'advanced', label: 'Advanced', note: 'Adds derivations, methods and references' },
];

const SettingsCtx = createContext(null);

export function SettingsProvider({ appId, children }) {
  const key = `${appId}:settings`;
  const [s, setS] = useState(() => ({ level: 'intermediate', theme: 'system', ...store.get(key, {}) }));
  // Layout effect: the theme changes before the next paint, so there is no flash of the old one.
  useLayoutEffect(() => {
    store.set(key, s);
    const root = document.documentElement;
    if (s.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', s.theme);
  }, [s]);
  const update = useCallback((patch) => setS((old) => ({ ...old, ...patch })), []);
  return <SettingsCtx.Provider value={{ ...s, appId, update }}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);

/** Show children only at or above a level. */
export function AtLevel({ min = 'basic', children }) {
  const { level } = useSettings();
  const order = { basic: 0, intermediate: 1, advanced: 2 };
  return order[level] >= order[min] ? children : null;
}

/* ---------------------------------------------------------------- icons --- */
const paths = {
  search: 'M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z',
  settings: 'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM10.6 2h2.8l.5 2.6c.6.2 1.1.5 1.6.9l2.5-.9 1.4 2.4-2 1.7c.1.6.1 1.2 0 1.8l2 1.7-1.4 2.4-2.5-.9c-.5.4-1 .7-1.6.9l-.5 2.6h-2.8l-.5-2.6c-.6-.2-1.1-.5-1.6-.9l-2.5.9-1.4-2.4 2-1.7a5.6 5.6 0 0 1 0-1.8l-2-1.7 1.4-2.4 2.5.9c.5-.4 1-.7 1.6-.9L10.6 2Z',
  copy: 'M8 3h10a2 2 0 0 1 2 2v12h-2V5H8V3Zm-3 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 2v10h10V9H5Z',
  check: 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7 9.5 16.2Z',
  arrow: 'M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6L13 5Z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
};
export function Icon({ name, title }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined} fill="currentColor">
      {title ? <title>{title}</title> : null}
      <path d={paths[name]} />
    </svg>
  );
}

/* ---------------------------------------------------------------- forms --- */
let uid = 0;
export const useId = (prefix = 'f') => useRef(`${prefix}${++uid}`).current;

export function Field({ label, hint, error, children, id }) {
  return (
    <div class="field">
      <label for={id}>{label}</label>
      {children}
      {error ? <div class="err" id={`${id}-err`} role="alert">{error}</div> : hint ? <div class="hint" id={`${id}-hint`}>{hint}</div> : null}
    </div>
  );
}

/** A text box for numbers: keeps what the person typed, reports the parsed value and any error. */
export function NumberField({ label, value, onInput, hint, error, placeholder, inputMode = 'decimal' }) {
  const id = useId('n');
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <input id={id} type="text" inputMode={inputMode} autocomplete="off" spellcheck={false}
        value={value} placeholder={placeholder} aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        onInput={(e) => onInput(e.currentTarget.value)} />
    </Field>
  );
}

/** A labelled text box (names, units, free text). */
export function TextField({ label, value, onInput, hint, placeholder }) {
  const id = useId('t');
  return (
    <Field label={label} hint={hint} id={id}>
      <input id={id} type="text" value={value} placeholder={placeholder} aria-describedby={hint ? `${id}-hint` : undefined} onInput={(e) => onInput(e.currentTarget.value)} />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options, hint }) {
  const id = useId('s');
  return (
    <Field label={label} hint={hint} id={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        {options.map((o) => <option value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

/** Segmented choice; aria-pressed buttons in a labelled group. */
export function Seg({ label, value, onChange, options, wide }) {
  const id = useId('g');
  return (
    <div>
      {label ? <span class="label" id={id}>{label}</span> : null}
      <div class={`seg${wide ? ' wide' : ''}`} role="group" aria-labelledby={label ? id : undefined}>
        {options.map((o) => (
          <button type="button" aria-pressed={value === o.value ? 'true' : 'false'} disabled={o.disabled}
            title={o.title} onClick={() => !o.disabled && onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- display --- */
export function Callout({ kind = 'info', mark, children }) {
  const cls = kind === 'warn' ? 'callout warn' : kind === 'danger' ? 'callout danger' : 'callout';
  return (
    <div class={cls} role={kind === 'danger' ? 'alert' : undefined}>
      <span class="mk">{mark || (kind === 'warn' ? 'Caution' : kind === 'danger' ? 'Error' : 'Note')}</span>
      <div>{children}</div>
    </div>
  );
}

export const Chip = ({ lb, vl }) => <span class="datachip"><span class="lb">{lb}</span><span class="vl">{vl}</span></span>;

export function Eyebrow({ children, muted }) {
  return <p class="eyebrow">{children}{muted ? <span class="muted">{muted}</span> : null}</p>;
}

/** Static formula rendered to MathML at build time (tex`...` in source becomes an HTML string). */
export function MathView({ html, block }) {
  return block
    ? <div class="mathblock" dangerouslySetInnerHTML={{ __html: html }} />
    : <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Put text on the clipboard; with html, as rich text too (Word pastes a real table). Resolves true on success. */
export async function copyText(text, html) {
  if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      return true;
    } catch { /* fall back to plain text */ }
  }
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove();
      return ok;
    } catch { return false; }
  }
}

export function CopyButton({ text, html, label = 'Copy sentence' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    const ok = await copyText(typeof text === 'function' ? text() : text, typeof html === 'function' ? html() : html);
    setDone(ok ? 'Copied' : 'Copy failed: select the text instead');
    setTimeout(() => setDone(false), 2200);
  };
  return (
    <button type="button" class="btn ghost small" onClick={copy}>
      <Icon name={done === 'Copied' ? 'check' : 'copy'} /> {done || label}
    </button>
  );
}

/* -------------------------------------------------------------- headers --- */
export function PageHead({ crumbs = [], eyebrow, title, lede }) {
  return (
    <header class="head">
      {crumbs.length ? (
        <nav class="crumbs" aria-label="Breadcrumb">
          {crumbs.map((c, i) => [i ? <span aria-hidden="true">/</span> : null, c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>])}
        </nav>
      ) : null}
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1>{title}</h1>
      {lede ? <p class="lede">{lede}</p> : null}
    </header>
  );
}
