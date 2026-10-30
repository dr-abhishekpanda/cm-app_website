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
