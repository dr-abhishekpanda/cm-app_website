/* Practice: p-values, critical values and degrees of freedom, with fresh numbers each time.
 * A set number seeds the generator, so a teacher can give a whole class the same questions. */
import { useState, useMemo } from 'preact/hooks';
import { studentT, chiSquare, fDist, normal } from '../../engine/dist.js';
import { fixed, sig, parseNumber, pValue } from '../../engine/format.js';
import { PageHead, NumberField, Callout, store, AtLevel } from '../../ui/core.jsx';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const between = (r, lo, hi, d = 2) => Number((lo + r() * (hi - lo)).toFixed(d));
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

/* Each template returns { stem, ask, kind: 'p' | 'crit' | 'df', answer, solution[] } */
const TEMPLATES = [
  (r) => {
    const n = int(r, 8, 30), t = between(r, 1.4, 3.6);
    const df = n - 1, p = studentT.twoSided(t, df);
    return {
      stem: `A paired t-test on knowledge scores of ${n} ASHAs before and after a malaria training session gives t = ${fixed(t, 2)}.`,
      ask: 'What is the two-sided p-value?', kind: 'p', answer: p,
      solution: [`Paired data: df = number of pairs − 1 = ${n} − 1 = ${df}.`, `p = 2 × P(T${sub(df)} ≥ ${fixed(t, 2)}) = ${sig(p, 4)}.`, verdictLine(p)],
    };
  },
  (r) => {
    const rows = int(r, 2, 3), cols = int(r, 2, 4), x = between(r, 1.5, 14, 2);
    const df = (rows - 1) * (cols - 1), p = chiSquare.sf(x, df);
    return {
      stem: `A ${rows} × ${cols} table of nutritional status by social group in an FAP survey gives χ² = ${fixed(x, 2)}.`,
      ask: 'What is the p-value?', kind: 'p', answer: p,
      solution: [`df = (rows − 1)(columns − 1) = (${rows} − 1)(${cols} − 1) = ${df}.`, `Chi-square tests use the upper tail: p = P(χ²${sub(df)} ≥ ${fixed(x, 2)}) = ${sig(p, 4)}.`, verdictLine(p)],
    };
  },
  (r) => {
    const k = int(r, 3, 4), m = int(r, 10, 30), F = between(r, 1.2, 5.5, 2);
    const d1 = k - 1, d2 = k * m - k, p = fDist.sf(F, d1, d2);
    return {
      stem: `A one-way ANOVA compares mean haemoglobin of pregnant women across ${k} blocks, ${m} women in each, and gives F = ${fixed(F, 2)}.`,
      ask: 'What is the p-value?', kind: 'p', answer: p,
      solution: [`df between = k − 1 = ${d1}; df within = N − k = ${k * m} − ${k} = ${d2}.`, `p = P(F${sub(`${d1},${d2}`)} ≥ ${fixed(F, 2)}) = ${sig(p, 4)}.`, verdictLine(p)],
    };
  },
  (r) => {
    const z = between(r, 1.1, 3.4, 2), p = normal.twoSided(z);
    return {
      stem: `A large survey compares two proportions and the test gives z = ${fixed(z, 2)}.`,
      ask: 'What is the two-sided p-value?', kind: 'p', answer: p,
      solution: [`p = 2 × P(Z ≥ ${fixed(z, 2)}) = ${sig(p, 4)}.`, verdictLine(p)],
    };
  },
  (r) => {
    const n1 = int(r, 6, 25), n2 = int(r, 6, 25), a = pick(r, [0.05, 0.01]);
    const df = n1 + n2 - 2, c = studentT.isf(a / 2, df);
    return {
      stem: `A Student t-test with equal variances compares ${n1} cases with ${n2} controls.`,
      ask: `What critical value must |t| reach for p < ${a} (two-sided)?`, kind: 'crit', answer: c,
      solution: [`df = n₁ + n₂ − 2 = ${n1} + ${n2} − 2 = ${df}.`, `Critical value = t${sub(df)} with ${a / 2} in each tail = ${fixed(c, 3)}.`],
    };
  },
  (r) => {
    const rows = int(r, 2, 4), cols = int(r, 2, 5);
    const df = (rows - 1) * (cols - 1);
    return {
      stem: `A chi-square test of association uses a table with ${rows} rows and ${cols} columns.`,
      ask: 'How many degrees of freedom does it have?', kind: 'df', answer: df,
      solution: [`df = (rows − 1)(columns − 1) = (${rows} − 1)(${cols} − 1) = ${df}.`],
    };
  },
];

const SUBS = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', ',': ',' };
function sub(x) { return String(x).split('').map((c) => SUBS[c] ?? c).join(''); }
function verdictLine(p) {
  return p < 0.05 ? `${pValue(p).report}: below 0.05, so statistically significant at the 5% level.` : `${pValue(p).report}: not below 0.05, so not statistically significant at the 5% level.`;
}

function judge(q, text) {
  const t = String(text).trim();
  if (q.kind === 'p' && /^<\s*0?\.001$/.test(t.replace(/\s/g, ''))) return q.answer < 0.001;
  const v = parseNumber(t);
  if (!Number.isFinite(v)) return null;
  if (q.kind === 'df') return v === q.answer;
  if (q.kind === 'crit') return Math.abs(v - q.answer) <= Math.max(0.006, 0.003 * Math.abs(q.answer));
  return Math.abs(v - q.answer) <= Math.max(0.0006, 0.02 * q.answer);
}

function makeSet(seed, n = 8) {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => pick(r, TEMPLATES)(r));
}

export default function PValuesPractice() {
  const key = 'research:practice:p-values';
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 9000) + 1000);
  const [seedText, setSeedText] = useState(String(seed));
  const set = useMemo(() => makeSet(seed), [seed]);
  const [i, setI] = useState(0);
  const [ans, setAns] = useState('');
  const [state, setState] = useState(null); // null | { ok, shown }
  const [score, setScore] = useState({ right: 0, done: 0 });
  const [err, setErr] = useState('');
  const q = set[i];
  const best = store.get(key, null);

  const check = () => {
    const res = judge(q, ans);
    if (res === null) { setErr(q.kind === 'df' ? 'Enter a whole number' : 'Enter a number, such as 0.034'); return; }
    setErr('');
    setState({ ok: res });
    setScore((s) => ({ right: s.right + (res ? 1 : 0), done: s.done + 1 }));
  };
  const next = () => {
    if (i + 1 >= set.length) {
      const pct = Math.round((100 * score.right) / Math.max(1, score.done));
      if (!best || pct > best) store.set(key, pct);
    }
    setI((v) => (v + 1) % set.length); setAns(''); setState(null); setErr('');
  };
  const startSet = (s) => { setSeed(s); setI(0); setAns(''); setState(null); setScore({ right: 0, done: 0 }); setErr(''); };

  return (
    <div>
      <PageHead crumbs={[{ label: 'Practice', href: '#/practice' }, { label: 'Analyse' }]} eyebrow="Practice · Analyse"
        title="p-Values, Critical Values and Degrees of Freedom"
        lede="Eight questions with new numbers every set. Work them out with tables, a calculator or the p-value tool, then check." />
      <div class="split">
        <section class="panel q" aria-labelledby="q-h">
          <p class="eyebrow" id="q-h">Question {i + 1} of {set.length}<span class="muted">· set {seed}</span></p>
          <p class="stem">{q.stem}</p>
          <p><strong>{q.ask}</strong></p>
          <div class="fields" style="max-width:340px">
            <NumberField label={q.kind === 'df' ? 'Degrees of freedom' : q.kind === 'crit' ? 'Critical value' : 'p-value'}
              value={ans} onInput={(v) => { setAns(v); setErr(''); }} error={err}
              hint={q.kind === 'p' ? 'Three decimals, or < 0.001' : q.kind === 'crit' ? 'Three decimals' : undefined}
              inputMode={q.kind === 'df' ? 'numeric' : 'decimal'} />
          </div>
          <div class="btn-row" style="margin-top:14px">
            {state ? <button type="button" class="btn primary" onClick={next}>{i + 1 >= set.length ? 'Start again' : 'Next question'} <span class="arw">{'→'}</span></button>
              : <button type="button" class="btn primary" onClick={check}>Check</button>}
            {!state ? <button type="button" class="btn ghost" onClick={() => setState({ ok: null })}>Show the answer</button> : null}
          </div>
          {state ? (
            <div class="feedback" aria-live="polite">
              <Callout kind={state.ok === false ? 'warn' : 'info'} mark={state.ok === true ? 'Correct' : state.ok === false ? 'Not quite' : 'Answer'}>
                <p><strong>Answer: {q.kind === 'p' ? `${pValue(q.answer).report} (exact ${pValue(q.answer).exact})` : q.kind === 'crit' ? fixed(q.answer, 3) : q.answer}</strong></p>
                {q.solution.map((line) => <p>{line}</p>)}
              </Callout>
            </div>
          ) : null}
        </section>
        <aside class="panel stack" aria-labelledby="sc-h">
          <h2 id="sc-h">Your set</h2>
          <p class="score">Correct {score.right} of {score.done} answered{best !== null ? ` · best set ${best}%` : ''}</p>
          <div class="fields" style="grid-template-columns:1fr auto;align-items:end">
            <NumberField label="Set number" value={seedText} onInput={setSeedText} inputMode="numeric" hint="Share a number so a class gets the same questions" />
            <button type="button" class="btn ghost" style="margin-bottom:22px" onClick={() => { const s = parseNumber(seedText); if (Number.isInteger(s) && s > 0) startSet(s); }}>Load</button>
          </div>
          <button type="button" class="btn ghost" onClick={() => { const s = Math.floor(Math.random() * 9000) + 1000; setSeedText(String(s)); startSet(s); }}>New set</button>
          <AtLevel min="intermediate">
            <p class="small">Tolerances: p-values within 0.0006 or 2%, whichever is larger; critical values within 0.006. Answers from printed tables may differ in the third decimal.</p>
          </AtLevel>
        </aside>
      </div>
    </div>
  );
}
