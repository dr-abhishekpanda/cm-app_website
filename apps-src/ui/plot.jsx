/* Small SVG plots drawn in EWS colours (classes in app.css). No chart library: offline and light.
 * Each plot measures its box and draws at that width, so labels keep their size on a phone. */
import { useRef, useState, useLayoutEffect } from 'preact/hooks';
import { sig } from '../engine/format.js';

function useWidth(fallback = 640) {
  const ref = useRef(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => { const v = Math.round(el.getBoundingClientRect().width); if (v > 0) setW(v); };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

const heightFor = (w, max) => Math.round(Math.max(170, Math.min(max, w * 0.4)));

export function DensityPlot(props) {
  const [ref, w] = useWidth();
  return <div class="plotbox" ref={ref}><DensitySvg {...props} width={w} height={heightFor(w, 230)} /></div>;
}

export function BarPlot(props) {
  const [ref, w] = useWidth();
  return <div class="plotbox" ref={ref}><BarSvg {...props} width={w} height={heightFor(w, 220)} /></div>;
}

export function niceTicks(min, max, count = 6) {
  if (!(max > min)) return [min];
  const span = max - min;
  const step0 = span / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(step0));
  const err = step0 / mag;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

/**
 * A density curve with shaded regions and marker lines.
 * regions: [{ from, to, hot }]; marks: [{ x, label }]
 */
function DensitySvg({ pdf, xmin, xmax, regions = [], marks = [], label, width, height }) {
  const pad = { l: 14, r: 14, t: 18, b: 30 };
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const N = 260;
  const xs = Array.from({ length: N + 1 }, (_, i) => xmin + ((xmax - xmin) * i) / N);
  const raw = xs.map((x) => pdf(x));
  // Densities that are infinite at the boundary (chi-square with 1 df) are clipped to the visible peak.
  const skip = (xmax - xmin) * 0.015;
  let ymax = 0;
  raw.forEach((y, i) => { if (Number.isFinite(y) && xs[i] - xmin > skip) ymax = Math.max(ymax, y); });
  if (!(ymax > 0)) ymax = 1;
  ymax *= 1.08;
  const X = (x) => pad.l + ((x - xmin) / (xmax - xmin)) * W;
  const Y = (y) => pad.t + H - (Math.min(Number.isFinite(y) ? y : ymax, ymax) / ymax) * H;
  const curve = xs.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(2)},${Y(raw[i]).toFixed(2)}`).join('');
  const area = (from, to) => {
    const a = Math.max(xmin, from), b = Math.min(xmax, to);
    if (!(b > a)) return '';
    const pts = [];
    const n = 120;
    for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; pts.push(`${X(x).toFixed(2)},${Y(pdf(x)).toFixed(2)}`); }
    return `M${X(a).toFixed(2)},${Y(0).toFixed(2)}L${pts.join('L')}L${X(b).toFixed(2)},${Y(0).toFixed(2)}Z`;
  };
  const ticks = niceTicks(xmin, xmax, width < 420 ? 4 : 7);
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      {regions.map((r) => <path class={`area${r.hot ? ' hot' : ''}`} d={area(r.from, r.to)} />)}
      <path class="curve" d={curve} />
      <line class="axis" x1={pad.l} x2={pad.l + W} y1={Y(0)} y2={Y(0)} />
      {ticks.map((t) => [
        <line class="axis" x1={X(t)} x2={X(t)} y1={Y(0)} y2={Y(0) + 4} />,
        <text class="tick" x={X(t)} y={Y(0) + 16} text-anchor="middle">{sig(t, 3)}</text>,
      ])}
      {marks.filter((m) => m.x >= xmin && m.x <= xmax).map((m, i) => [
        <line class="mark" x1={X(m.x)} x2={X(m.x)} y1={pad.t - 4} y2={Y(0)} />,
        <text class="lab" x={X(m.x) + (X(m.x) > width * 0.75 ? -5 : 5)} y={pad.t + 8 + i * 13}
          text-anchor={X(m.x) > width * 0.75 ? 'end' : 'start'}>{m.label}</text>,
      ])}
    </svg>
  );
}

/** Bars for a discrete distribution; hot(k) marks the bars in the event of interest. */
function BarSvg({ ks, ps, hot = () => false, label, width, height }) {
  const pad = { l: 14, r: 14, t: 14, b: 30 };
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const pmax = Math.max(...ps, 1e-12) * 1.08;
  const n = ks.length;
  const bw = W / Math.max(n, 1);
  const every = Math.ceil(n / (width < 420 ? 6 : 12));
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      {ks.map((k, i) => {
        const h = (ps[i] / pmax) * H;
        return <rect class={`bar${hot(k) ? ' hot' : ''}`} x={pad.l + i * bw + bw * 0.12} y={pad.t + H - h} width={Math.max(1, bw * 0.76)} height={h} />;
      })}
      <line class="axis" x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} />
      {ks.map((k, i) => (i % every === 0 ? <text class="tick" x={pad.l + i * bw + bw / 2} y={pad.t + H + 16} text-anchor="middle">{k}</text> : null))}
    </svg>
  );
}

/* -------------------------------------------------- distribution plots --- */

function binEdges(x) {
  const n = x.length;
  let lo = Math.min(...x), hi = Math.max(...x);
  if (lo === hi) { lo -= 0.5; hi += 0.5; }
  const k = Math.max(5, Math.min(30, Math.ceil(Math.log2(n) + 1)));
  const raw = (hi - lo) / k;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const start = Math.floor(lo / step) * step;
  const edges = [];
  for (let e = start; e <= hi + step * 1e-9; e += step) edges.push(Number(e.toPrecision(12)));
  if (edges[edges.length - 1] <= hi) edges.push(Number((edges[edges.length - 1] + step).toPrecision(12)));
  return edges;
}

/** Histogram of counts, with a fitted normal curve scaled to counts when `normal` is set. */
export function Histogram(props) {
  const [ref, w] = useWidth();
  return <div class="plotbox" ref={ref}><HistSvg {...props} width={w} height={heightFor(w, 220)} /></div>;
}

function HistSvg({ x, label, normal: fit, unit = '', width, height }) {
  const pad = { l: 34, r: 12, t: 12, b: 30 };
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const edges = binEdges(x);
  const counts = new Array(edges.length - 1).fill(0);
  for (const v of x) {
    let i = Math.floor((v - edges[0]) / (edges[1] - edges[0]));
    i = Math.max(0, Math.min(counts.length - 1, i));
    counts[i]++;
  }
  const step = edges[1] - edges[0];
  let ymax = Math.max(...counts);
  let curve = null;
  if (fit && x.length > 2) {
    const m = x.reduce((a, b) => a + b, 0) / x.length;
    const s = Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / (x.length - 1));
    if (s > 0) {
      const f = (u) => (x.length * step * Math.exp(-0.5 * ((u - m) / s) ** 2)) / (s * Math.sqrt(2 * Math.PI));
      ymax = Math.max(ymax, f(m));
      curve = f;
    }
  }
  ymax *= 1.08;
  const X = (u) => pad.l + ((u - edges[0]) / (edges[edges.length - 1] - edges[0])) * W;
  const Y = (c) => pad.t + H - (c / ymax) * H;
  const xt = niceTicks(edges[0], edges[edges.length - 1], width < 420 ? 4 : 7);
  const yt = niceTicks(0, ymax, 4).filter((t) => Number.isInteger(t));
  let path = '';
  if (curve) {
    const N = 120;
    for (let i = 0; i <= N; i++) { const u = edges[0] + ((edges[edges.length - 1] - edges[0]) * i) / N; path += `${i ? 'L' : 'M'}${X(u).toFixed(1)},${Y(curve(u)).toFixed(1)}`; }
  }
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      {yt.map((t) => <g><line class="grid" x1={pad.l} x2={pad.l + W} y1={Y(t)} y2={Y(t)} /><text class="tick" x={pad.l - 6} y={Y(t) + 4} text-anchor="end">{t}</text></g>)}
      {counts.map((c, i) => <rect class="bar" x={X(edges[i]) + 0.5} y={Y(c)} width={Math.max(0.5, X(edges[i + 1]) - X(edges[i]) - 1)} height={pad.t + H - Y(c)} />)}
      {curve ? <path class="curve" d={path} /> : null}
      <line class="axis" x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} />
      {xt.map((t) => <text class="tick" x={X(t)} y={pad.t + H + 16} text-anchor="middle">{sig(t, 4)}{unit}</text>)}
    </svg>
  );
}

/** Box plots for one or more groups: median, quartiles, whiskers to 1.5 IQR, outliers as dots, mean as a cross. */
export function BoxPlot(props) {
  const [ref, w] = useWidth();
  const k = props.groups.length;
  return <div class="plotbox" ref={ref}><BoxSvg {...props} width={w} height={Math.max(170, Math.min(260, 120 + k * 10))} /></div>;
}

function q7(s, p) { const h = (s.length - 1) * p; const lo = Math.floor(h); return s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]); }

function BoxSvg({ groups, labels, label, width, height }) {
  const pad = { l: 40, r: 12, t: 12, b: 34 };
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const all = groups.flat();
  let lo = Math.min(...all), hi = Math.max(...all);
  if (lo === hi) { lo -= 1; hi += 1; }
  const padY = (hi - lo) * 0.06;
  lo -= padY; hi += padY;
  const Y = (v) => pad.t + H - ((v - lo) / (hi - lo)) * H;
  const slot = W / groups.length;
  const bw = Math.min(56, slot * 0.5);
  const yt = niceTicks(lo, hi, 5);
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      {yt.map((t) => <g><line class="grid" x1={pad.l} x2={pad.l + W} y1={Y(t)} y2={Y(t)} /><text class="tick" x={pad.l - 6} y={Y(t) + 4} text-anchor="end">{sig(t, 4)}</text></g>)}
      {groups.map((g, i) => {
        if (!g.length) return null;
        const s = Float64Array.from(g).sort();
        const q1 = q7(s, 0.25), md = q7(s, 0.5), q3 = q7(s, 0.75), iqr = q3 - q1;
        const wlo = s.find((v) => v >= q1 - 1.5 * iqr), whi = [...s].reverse().find((v) => v <= q3 + 1.5 * iqr);
        const out = g.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);
        const mean = g.reduce((a, b) => a + b, 0) / g.length;
        const cx = pad.l + slot * (i + 0.5);
        return (
          <g>
            <line class="whisker" x1={cx} x2={cx} y1={Y(wlo)} y2={Y(q1)} />
            <line class="whisker" x1={cx} x2={cx} y1={Y(q3)} y2={Y(whi)} />
            <line class="whisker" x1={cx - bw / 4} x2={cx + bw / 4} y1={Y(wlo)} y2={Y(wlo)} />
            <line class="whisker" x1={cx - bw / 4} x2={cx + bw / 4} y1={Y(whi)} y2={Y(whi)} />
            <rect class="box" x={cx - bw / 2} y={Y(q3)} width={bw} height={Math.max(1, Y(q1) - Y(q3))} />
            <line class="median" x1={cx - bw / 2} x2={cx + bw / 2} y1={Y(md)} y2={Y(md)} />
            <path class="meanmark" d={`M${cx - 4},${Y(mean) - 4}L${cx + 4},${Y(mean) + 4}M${cx - 4},${Y(mean) + 4}L${cx + 4},${Y(mean) - 4}`} />
            {out.map((v) => <circle class="outlier" cx={cx} cy={Y(v)} r="2.6" />)}
            <text class="tick" x={cx} y={pad.t + H + 16} text-anchor="middle">{String(labels?.[i] ?? i + 1).slice(0, 14)}</text>
            <text class="tick" x={cx} y={pad.t + H + 28} text-anchor="middle">n = {g.length}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Normal Q-Q plot: sorted values against normal quantiles, with a line through the quartiles. */
export function QQPlot(props) {
  const [ref, w] = useWidth();
  return <div class="plotbox" ref={ref}><QQSvg {...props} width={w} height={heightFor(w, 230)} /></div>;
}

let qqCount = 0;
function QQSvg({ x, label, ppf, width, height }) {
  const cid = useRef(`qq${++qqCount}`).current;
  const pad = { l: 40, r: 12, t: 12, b: 30 };
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const s = Float64Array.from(x).sort();
  const n = s.length;
  const z = Array.from(s, (_, i) => ppf((i + 1 - 0.375) / (n + 0.25)));
  const zlo = Math.min(-2.5, z[0]), zhi = Math.max(2.5, z[n - 1]);
  let lo = s[0], hi = s[n - 1];
  if (lo === hi) { lo -= 1; hi += 1; }
  const X = (v) => pad.l + ((v - zlo) / (zhi - zlo)) * W;
  const Y = (v) => pad.t + H - ((v - lo) / (hi - lo)) * H;
  const q1 = q7(s, 0.25), q3 = q7(s, 0.75), z1 = ppf(0.25), z3 = ppf(0.75);
  const slope = (q3 - q1) / (z3 - z1), icpt = q1 - slope * z1;
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      <defs><clipPath id={cid}><rect x={pad.l} y={pad.t} width={W} height={H} /></clipPath></defs>
      {niceTicks(lo, hi, 5).map((t) => <g><line class="grid" x1={pad.l} x2={pad.l + W} y1={Y(t)} y2={Y(t)} /><text class="tick" x={pad.l - 6} y={Y(t) + 4} text-anchor="end">{sig(t, 4)}</text></g>)}
      <line class="ref" clip-path={`url(#${cid})`} x1={X(zlo)} y1={Y(icpt + slope * zlo)} x2={X(zhi)} y2={Y(icpt + slope * zhi)} />
      {Array.from(s, (v, i) => <circle class="pt" cx={X(z[i])} cy={Y(v)} r="2.4" />)}
      <line class="axis" x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} />
      {niceTicks(zlo, zhi, 6).map((t) => <text class="tick" x={X(t)} y={pad.t + H + 16} text-anchor="middle">{sig(t, 2)}</text>)}
    </svg>
  );
}

/** Horizontal bars of percentages with 95% CI whiskers, for categories or proportions by group. */
export function PercentBars(props) {
  const [ref, w] = useWidth();
  const k = props.items.length;
  return <div class="plotbox" ref={ref}><PctSvg {...props} width={w} height={24 + k * 30} /></div>;
}

function PctSvg({ items, label, width, height }) {
  const pad = { l: Math.min(150, width * 0.36), r: 54, t: 6, b: 18 };
  const W = width - pad.l - pad.r;
  const X = (p) => pad.l + (p / 100) * W;
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      {[0, 25, 50, 75, 100].map((t) => <g><line class="grid" x1={X(t)} x2={X(t)} y1={pad.t} y2={height - pad.b} /><text class="tick" x={X(t)} y={height - 4} text-anchor="middle">{t}%</text></g>)}
      {items.map((it, i) => {
        const y = pad.t + i * 30 + 6;
        return (
          <g>
            <text class="lab" x={pad.l - 8} y={y + 12} text-anchor="end">{String(it.label).slice(0, 22)}</text>
            <rect class="bar hot" x={X(0)} y={y} width={Math.max(1, X(it.pct) - X(0))} height="18" />
            {it.ci ? <line class="whisker" x1={X(it.ci[0])} x2={X(it.ci[1])} y1={y + 9} y2={y + 9} /> : null}
            <text class="lab" x={X(100) + 6} y={y + 13}>{it.pct.toFixed(1)}%</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Scatter plot with an optional least-squares line. */
export function ScatterPlot(props) {
  const [ref, w] = useWidth();
  return <div class="plotbox" ref={ref}><ScatterSvg {...props} width={w} height={heightFor(w, 260)} /></div>;
}

function ScatterSvg({ x, y, label, xLabel, yLabel, line, width, height }) {
  const pad = { l: 44, r: 12, t: 12, b: 40 };
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  let x0 = Math.min(...x), x1 = Math.max(...x), y0 = Math.min(...y), y1 = Math.max(...y);
  if (x0 === x1) { x0 -= 1; x1 += 1; }
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const px = (x1 - x0) * 0.05, py = (y1 - y0) * 0.06;
  x0 -= px; x1 += px; y0 -= py; y1 += py;
  const X = (v) => pad.l + ((v - x0) / (x1 - x0)) * W;
  const Y = (v) => pad.t + H - ((v - y0) / (y1 - y0)) * H;
  let fit = null;
  if (line && x.length > 2) {
    const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
    const b = sxy / sxx, a = my - b * mx;
    fit = [a + b * x0, a + b * x1];
  }
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      {niceTicks(y0, y1, 5).map((t) => <g><line class="grid" x1={pad.l} x2={pad.l + W} y1={Y(t)} y2={Y(t)} /><text class="tick" x={pad.l - 6} y={Y(t) + 4} text-anchor="end">{sig(t, 4)}</text></g>)}
      {x.map((v, i) => <circle class="pt" cx={X(v)} cy={Y(y[i])} r="2.6" />)}
      {fit ? <line class="ref" x1={X(x0)} y1={Y(fit[0])} x2={X(x1)} y2={Y(fit[1])} /> : null}
      <line class="axis" x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} />
      {niceTicks(x0, x1, width < 420 ? 4 : 7).map((t) => <text class="tick" x={X(t)} y={pad.t + H + 16} text-anchor="middle">{sig(t, 4)}</text>)}
      {xLabel ? <text class="lab" x={pad.l + W / 2} y={height - 4} text-anchor="middle">{xLabel}</text> : null}
      {yLabel ? <text class="lab" x={12} y={pad.t + H / 2} text-anchor="middle" transform={`rotate(-90 12 ${pad.t + H / 2})`}>{yLabel}</text> : null}
    </svg>
  );
}

/** A single curve y(x) with an optional horizontal target line and a marked point. */
export function LinePlot(props) {
  const [ref, w] = useWidth();
  return <div class="plotbox" ref={ref}><LineSvg {...props} width={w} height={heightFor(w, 220)} /></div>;
}

function LineSvg({ xs, ys, label, xLabel, yLabel, target, mark, yMax = 1, yFmt = (v) => `${Math.round(v * 100)}%`, width, height }) {
  const pad = { l: 44, r: 14, t: 12, b: 40 };
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const x0 = xs[0], x1 = xs[xs.length - 1];
  const X = (v) => pad.l + ((v - x0) / (x1 - x0 || 1)) * W;
  const Y = (v) => pad.t + H - (Math.max(0, Math.min(yMax, v)) / yMax) * H;
  const path = xs.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join('');
  return (
    <svg class="plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <title>{label}</title>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => <g><line class="grid" x1={pad.l} x2={pad.l + W} y1={Y(t * yMax)} y2={Y(t * yMax)} /><text class="tick" x={pad.l - 6} y={Y(t * yMax) + 4} text-anchor="end">{yFmt(t * yMax)}</text></g>)}
      {target != null ? <line class="ref" x1={pad.l} x2={pad.l + W} y1={Y(target)} y2={Y(target)} /> : null}
      <path class="curve" d={path} />
      {mark ? <g><line class="mark" x1={X(mark.x)} x2={X(mark.x)} y1={pad.t} y2={pad.t + H} /><circle class="pt" cx={X(mark.x)} cy={Y(mark.y)} r="4" /><text class="lab" x={X(mark.x) + (X(mark.x) > pad.l + W * 0.7 ? -6 : 6)} y={pad.t + 12} text-anchor={X(mark.x) > pad.l + W * 0.7 ? 'end' : 'start'}>{mark.label}</text></g> : null}
      <line class="axis" x1={pad.l} x2={pad.l + W} y1={pad.t + H} y2={pad.t + H} />
      {niceTicks(x0, x1, width < 420 ? 4 : 7).map((t) => <text class="tick" x={X(t)} y={pad.t + H + 16} text-anchor="middle">{sig(t, 4)}</text>)}
      {xLabel ? <text class="lab" x={pad.l + W / 2} y={height - 4} text-anchor="middle">{xLabel}</text> : null}
    </svg>
  );
}
