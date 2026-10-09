/* ============================================================================
   core/00-util — namespace, safe HTML templating, small helpers
   Every module talks through window.K. HTML is built with K.h`...`, which
   escapes interpolated values unless they are K.raw()/nested K.h results.
   ============================================================================ */
const K = window.K = window.K || {};
K.build = '{{BUILD}}';
K.builtAt = '{{BUILT_AT}}';

class Raw { constructor(s){ this.s = s; } toString(){ return this.s; } }
K.Raw = Raw;
K.raw = s => new Raw(s == null ? '' : String(s));
K.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
K.hv = v => (v == null || v === false || v === true) ? '' : (v instanceof Raw) ? v.s : Array.isArray(v) ? v.map(K.hv).join('') : K.esc(v);
K.h = (strs, ...vals) => { let o = strs[0]; for (let i = 0; i < vals.length; i++) o += K.hv(vals[i]) + strs[i + 1]; return new Raw(o); };

K.$ = (sel, root) => (root || document).querySelector(sel);
K.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
K.uid = (p) => (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
K.clamp = (n, a, b) => Math.min(b, Math.max(a, n));
K.round = (n, d = 1) => { if (n == null || isNaN(n)) return n; const f = Math.pow(10, d); return Math.round(n * f) / f; };
K.isNum = v => v !== '' && v != null && !isNaN(+v) && isFinite(+v);
K.num = v => K.isNum(v) ? +v : null;
K.debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
K.copy = o => (o == null ? o : JSON.parse(JSON.stringify(o)));
K.get = (o, path, dflt) => { const v = String(path).split('.').reduce((a, k) => (a == null ? a : a[k]), o); return v === undefined ? dflt : v; };
K.set = (o, path, val) => { const ks = String(path).split('.'); let a = o; ks.slice(0, -1).forEach(k => { if (a[k] == null || typeof a[k] !== 'object') a[k] = {}; a = a[k]; }); a[ks[ks.length - 1]] = val; return o; };
K.by = (key, dir = 1) => (a, b) => { const x = typeof key === 'function' ? key(a) : a[key], y = typeof key === 'function' ? key(b) : b[key]; return (x > y ? 1 : x < y ? -1 : 0) * dir; };
K.sum = arr => arr.reduce((s, x) => s + (+x || 0), 0);
K.initials = name => { const p = String(name || '').trim().split(/\s+/).filter(Boolean); if (!p.length) return '·'; return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); };
K.cls = (...a) => a.filter(Boolean).join(' ');

/* lightweight event bus */
K.bus = (() => { const m = {}; return {
  on: (e, f) => { (m[e] = m[e] || []).push(f); return () => { m[e] = (m[e] || []).filter(x => x !== f); }; },
  emit: (e, d) => (m[e] || []).slice().forEach(f => { try { f(d); } catch (err) { console.error(err); } }),
}; })();

/* safe localStorage (private windows can throw) */
K.ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

/* download a Blob/text as a file */
K.download = (name, data, type = 'application/json') => {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
};

/* simple hash for PIN (not encryption; app-lock only) */
K.sha256 = async (s) => {
  if (!(window.crypto && crypto.subtle)) return 'x' + Array.from(String(s)).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
};
