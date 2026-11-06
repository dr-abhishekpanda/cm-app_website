/* Tool: agreement and reliability. Cohen's kappa for two raters (weighted for ordered categories),
 * Fleiss' kappa for three or more raters with a bootstrap CI, the intraclass correlation with a guide
 * to choosing its form, Bland-Altman limits of agreement, and Cronbach's alpha with item statistics. */
import { useState } from 'preact/hooks';
import { cohenKappa, fleissKappa, icc, blandAltman, cronbach, kappaLabel, iccLabel } from '../../engine/agreement.js';
import { isMissing } from '../../engine/data.js';
import { fixed, pValue, count, sig, parseNumber } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, NumberField } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col, exampleAgreementCsv } from '../../ui/data.jsx';
import { DataTable, Report, Stats, Refs, Disclose } from '../../ui/results.jsx';
import { BlandAltmanPlot } from '../../ui/plot.jsx';
import { CodeExport } from '../../ui/code.jsx';
import { REFS } from '../refs.js';

const pretty = (s) => String(s).replace(/_/g, ' ');
const P = (p) => pValue(p).report;
const f2 = (v) => fixed(v, 2);
const pct = (v) => fixed(100 * v, 1);
const ci2 = (c) => `${f2(c[0])} to ${f2(c[1])}`;
const list = (xs) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const needData = <Callout mark="Data">Load or paste your data at the top of the page, or try the example screening-camp data.</Callout>;

function Checks({ items }) {
  const xs = items.filter(Boolean);
  if (!xs.length) return null;
  return (
    <div>
      <h3 class="sub">Checks</h3>
      <ul class="checks">{xs.map((c) => <li class={c.ok === true ? 'ok' : c.ok === false ? 'no' : 'info'}><span class="mk">{c.ok === true ? 'OK' : c.ok === false ? 'Check' : 'Note'}</span><span>{c.text}</span></li>)}</ul>
    </div>
  );
}

/** Pick several columns (raters, items) with checkboxes. */
function ColumnsPick({ ds, filter, value, onChange, label, hint }) {
  const opts = ds.columns.filter(filter);
  const toggle = (n) => onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);
  return (
    <div>
      <span class="label">{label}</span>
      <div class="varpick">{opts.map((c) => <label><input type="checkbox" checked={value.includes(c.name)} onChange={() => toggle(c.name)} />{pretty(c.name)}</label>)}</div>
      {!opts.length ? <p class="small">No suitable column in this dataset.</p> : hint ? <p class="small">{hint}</p> : null}
    </div>
  );
}

/** Put categories in order (weighted kappa needs the order). */
function OrderList({ items, onChange }) {
  const move = (i, d) => { const a = [...items]; [a[i], a[i + d]] = [a[i + d], a[i]]; onChange(a); };
  return (
    <ol class="orderlist">
      {items.map((it, i) => (
        <li><span>{it}</span>
          <button type="button" class="btn ghost small" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${it} up`}>{'↑'}</button>
          <button type="button" class="btn ghost small" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${it} down`}>{'↓'}</button>
        </li>
      ))}
    </ol>
  );
}

const sameSet = (a, b) => a && b && a.length === b.length && b.every((x) => a.includes(x));
const levelsOf = (cols) => {
  const out = [];
  for (const c of cols) for (const l of c.levels) if (!out.includes(l)) out.push(l);
  if (cols.every((c) => c.numeric)) out.sort((x, y) => parseNumber(x) - parseNumber(y));
  return out;
};

/* ------------------------------------------------------- Cohen's kappa --- */

function KappaPanel({ ds }) {
  const [modeSel, setMode] = useState(null);
  const mode = modeSel ?? (ds ? 'data' : 'table');
  const [a, setA] = useState(null), [b, setB] = useState(null);
  const [order, setOrder] = useState(null);
  const [weights, setW] = useState('none');
  const [t, setT] = useState({ labels: ['Positive', 'Negative'], cells: [['40', '9'], ['6', '45']] });
  let table = null, labels = null, names = ['Rater A', 'Rater B'], dropped = 0, err = null;
  if (mode === 'data' && ds) {
    const ca = col(ds, a), cb = col(ds, b);
    if (ca && cb) {
      if (a === b) err = 'Pick two different columns.';
      else {
        const base = levelsOf([ca, cb]);
        labels = sameSet(order, base) ? order : base;
        names = [pretty(a), pretty(b)];
        if (labels.length < 2) err = 'Both raters used a single category, so agreement beyond chance cannot be measured.';
        else if (labels.length > 10) err = `There are ${labels.length} different ratings. Kappa needs a small number of categories; check that these columns hold categories, not measurements.`;
        else {
          table = labels.map(() => labels.map(() => 0));
          for (let i = 0; i < ds.n; i++) {
            const x = ca.raw[i], y = cb.raw[i];
            if (isMissing(x) || isMissing(y)) { dropped++; continue; }
            table[labels.indexOf(x)][labels.indexOf(y)]++;
          }
        }
      }
    }
  } else if (mode === 'table') {
    const cells = t.cells.map((r) => r.map((v) => parseNumber(v)));
    labels = t.labels.map((l, i) => l.trim() || `Category ${i + 1}`);
    if (!cells.every((r) => r.every((v) => Number.isInteger(v) && v >= 0))) err = 'Enter whole-number counts in every cell (0 is allowed).';
    else if (new Set(labels).size < labels.length) err = 'Give each category a different name.';
    else table = cells;
  }
  const k = labels ? labels.length : 0;
  const w = k > 2 ? weights : 'none';
  let res = null;
  if (table && !err) {
    const n = table.flat().reduce((s, v) => s + v, 0);
    if (n < 2) err = 'Enter at least two rated subjects.';
    else {
      res = cohenKappa(table, { weights: w });
      if (!Number.isFinite(res.kappa)) { err = 'Both raters put every subject in the same single category, so kappa is not defined.'; res = null; }
    }
  }
  const setCell = (i, j, v) => setT({ ...t, cells: t.cells.map((r, x) => (x === i ? r.map((c, y) => (y === j ? v : c)) : r)) });
  const addCat = () => setT({ labels: [...t.labels, `Category ${t.labels.length + 1}`], cells: [...t.cells.map((r) => [...r, '0']), t.labels.map(() => '0').concat('0')] });
  const dropCat = () => setT({ labels: t.labels.slice(0, -1), cells: t.cells.slice(0, -1).map((r) => r.slice(0, -1)) });
  const wName = { none: "Cohen's kappa", linear: "linear-weighted kappa", quadratic: "quadratic-weighted kappa" }[w];
  return (
    <>
      <section class="panel stack" aria-labelledby="kp-h">
        <h2 id="kp-h">Two raters</h2>
        <Seg label="Enter" value={mode} onChange={setMode} options={[{ value: 'data', label: 'Columns from your data', disabled: !ds, title: ds ? '' : 'Load data at the top first' }, { value: 'table', label: 'A table of counts' }]} />
        {mode === 'data' ? (ds ? (
          <>
            <div class="fields">
              <ColumnSelect ds={ds} label="First rater" value={a} onChange={(v) => { setA(v); setOrder(null); }} kind="group" maxLevels={10} />
              <ColumnSelect ds={ds} label="Second rater" value={b} onChange={(v) => { setB(v); setOrder(null); }} kind="group" maxLevels={10} exclude={[a].filter(Boolean)} />
            </div>
            {labels && labels.length > 2 && !err ? <div><span class="label">Order of the categories (needed for weighted kappa)</span><OrderList items={labels} onChange={setOrder} /></div> : null}
          </>
        ) : needData) : (
          <>
            <p class="small">Rows: the first rater's category; columns: the second rater's. The diagonal holds the subjects both put in the same category.</p>
            <div class="tablewrap">
              <table class="table compact entry">
                <thead><tr><th scope="col">First \ second</th>{t.labels.map((l, j) => <th scope="col"><input aria-label={`Category ${j + 1} name`} value={l} onInput={(e) => setT({ ...t, labels: t.labels.map((x, y) => (y === j ? e.currentTarget.value : x)) })} /></th>)}</tr></thead>
                <tbody>{t.labels.map((l, i) => (
                  <tr><th scope="row">{l || `Category ${i + 1}`}</th>{t.labels.map((_, j) => <td><input inputMode="numeric" aria-label={`Count: first rater ${l}, second rater ${t.labels[j]}`} value={t.cells[i][j]} onInput={(e) => setCell(i, j, e.currentTarget.value)} /></td>)}</tr>
                ))}</tbody>
              </table>
            </div>
            <div class="btn-row">
              {t.labels.length < 8 ? <button type="button" class="btn ghost small" onClick={addCat}>Add a category</button> : null}
              {t.labels.length > 2 ? <button type="button" class="btn ghost small" onClick={dropCat}>Remove the last category</button> : null}
            </div>
          </>
        )}
        {k > 2 ? <Seg label="Weights (ordered categories only)" value={weights} onChange={setW} options={[{ value: 'none', label: 'None' }, { value: 'linear', label: 'Linear' }, { value: 'quadratic', label: 'Quadratic' }]} /> : null}
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="kr-h">
          <div><h2 id="kr-h" style="margin-bottom:6px">{wName[0].toUpperCase() + wName.slice(1)} = {f2(res.kappa)}</h2>
            <p class="verdict-line mono">95% CI {ci2(res.ci)}; {res.label} agreement on the Landis and Koch scale</p></div>
          <Stats items={[['Subjects', count(res.n)], [w === 'none' ? 'Observed agreement' : 'Weighted observed agreement', `${pct(res.po)}%`], ['Expected by chance', `${pct(res.pe)}%`], ['z (kappa = 0)', fixed(res.z, 2)], ['p', pValue(res.p).exact], dropped ? ['Left out (a rating missing)', count(dropped)] : null]} />
          <DataTable caption={`${names[0]} (rows) by ${names[1]} (columns)`} columns={['', ...labels, 'Total']}
            rows={[...table.map((r, i) => [labels[i], ...r.map((v, j) => ({ text: count(v), cls: i === j ? 'hl' : '' })), count(r.reduce((s, v) => s + v, 0))]),
              ['Total', ...labels.map((_, j) => count(table.reduce((s, r) => s + r[j], 0))), count(res.n)]]}
            numeric={labels.map((_, j) => j + 1).concat(k + 1)} note="Highlighted cells: both raters chose the same category." />
          <Checks items={[
            k > 2 && w === 'none' ? { text: 'With ordered categories, weighted kappa gives partial credit for near-misses: linear weights for equally spaced categories, quadratic weights (close to the ICC) when large disagreements matter more.' } : null,
            res.po >= 0.85 && res.kappa < 0.6 ? { ok: false, text: `Observed agreement is high (${pct(res.po)}%) but kappa is only ${f2(res.kappa)}: when one category is very common, chance agreement is high and kappa falls. Report the observed agreement and the table alongside kappa.` } : null,
            { text: 'The Landis and Koch labels are conventions, not tests. Report kappa with its 95% CI and judge it against what the measurement is for.' },
          ]} />
          <Report text={`Agreement between ${names[0]} and ${names[1]} on ${count(res.n)} subjects was ${res.label} (${wName} ${f2(res.kappa)}, 95% CI ${ci2(res.ci)}; observed agreement ${pct(res.po)}%, agreement expected by chance ${pct(res.pe)}%).`} />
          <CodeExport spec={mode === 'table' ? { kind: 'kappa', table, levels: labels, weights: w } : { kind: 'kappa', a, b, levels: labels, weights: w }} />
          <AtLevel min="advanced"><p class="small">The standard error for the CI is the large-sample one of Fleiss, Cohen and Everitt (1969); the z test uses the standard error under no agreement beyond chance. {w !== 'none' ? `Weights: ${w === 'linear' ? '1 − |i − j| / (k − 1)' : '1 − (i − j)² / (k − 1)²'} for categories i and j in the order shown.` : ''}</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['cohen60', ...(w !== 'none' ? ['cohen68'] : []), 'fleissCohenEveritt', 'landisKoch']} /></div>
        </section>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------- Fleiss' kappa --- */

function FleissPanel({ ds }) {
  const [fmt, setFmt] = useState('raters');
  const [cols, setCols] = useState([]);
  if (!ds) return needData;
  const raterOk = (c) => c.levels.length >= 2 && c.levels.length <= 10;
  const picked = cols.filter((n) => { const c = col(ds, n); return c && (fmt === 'raters' ? raterOk(c) : c.numeric); });
  let res = null, err = null, cats = [], dropped = 0, n = 0;
  if (picked.length >= 2) {
    const cs = picked.map((nm) => col(ds, nm));
    const counts = [];
    if (fmt === 'raters') {
      cats = levelsOf(cs);
      for (let i = 0; i < ds.n; i++) {
        const r = cs.map((c) => c.raw[i]);
        if (r.some(isMissing)) { dropped++; continue; }
        counts.push(cats.map((l) => r.filter((x) => x === l).length));
      }
      n = picked.length;
    } else {
      cats = picked.map(pretty);
      const bad = [];
      for (let i = 0; i < ds.n; i++) {
        const r = cs.map((c) => c.numbers[i]);
        if (r.some((v) => v === null || !Number.isFinite(v))) { dropped++; continue; }
        if (r.some((v) => !Number.isInteger(v) || v < 0)) { bad.push(i + 1); continue; }
        counts.push(r);
      }
      const totals = [...new Set(counts.map((r) => r.reduce((s, v) => s + v, 0)))];
      if (bad.length) err = `Counts must be whole numbers of raters (rows ${bad.slice(0, 5).join(', ')}).`;
      else if (totals.length > 1) err = `Every subject needs the same number of raters; the row totals here vary (${totals.slice(0, 6).join(', ')}).`;
      n = totals[0];
    }
    if (!err && counts.length < 2) err = 'Fewer than two subjects have a complete set of ratings.';
    if (!err && n < 2) err = 'Each subject needs at least two ratings.';
    if (!err) { res = fleissKappa(counts); if (res.error) { err = res.error; res = null; } }
  }
  const raterNames = picked.map(pretty);
  return (
    <>
      <section class="panel stack" aria-labelledby="fk-h">
        <h2 id="fk-h">Three or more raters</h2>
        <Seg label="Your data have" value={fmt} onChange={(v) => { setFmt(v); setCols([]); }} options={[{ value: 'raters', label: 'One column per rater' }, { value: 'counts', label: 'One column per category (counts)' }]} />
        <ColumnsPick ds={ds} filter={fmt === 'raters' ? raterOk : (c) => c.numeric} value={cols} onChange={setCols}
          label={fmt === 'raters' ? 'Rater columns' : 'Category columns (number of raters choosing it)'} hint={fmt === 'raters' ? 'Each row is one subject; each chosen column is one rater.' : 'Each row is one subject; the counts in a row add up to the number of raters.'} />
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="fr-h">
          <div><h2 id="fr-h" style="margin-bottom:6px">Fleiss' kappa = {f2(res.kappa)}</h2>
            <p class="verdict-line mono">95% bootstrap CI {ci2(res.ci)}; {res.label} agreement on the Landis and Koch scale</p></div>
          <Stats items={[['Subjects', count(res.subjects)], ['Raters per subject', count(res.raters)], ['Categories', count(res.k)], ['Observed agreement', `${pct(res.Pbar)}%`], ['Expected by chance', `${pct(res.Pe)}%`], ['p (kappa = 0)', pValue(res.p).exact], dropped ? ['Left out (incomplete)', count(dropped)] : null]} />
          <DataTable caption="Agreement by category" columns={['Category', 'Share of all ratings', 'Kappa for the category']}
            rows={res.categories.map((c, j) => [cats[j], `${pct(c.p)}%`, Number.isFinite(c.kappa) ? f2(c.kappa) : '—'])} numeric={[1, 2]}
            note="A low category kappa shows where raters disagree most." />
          <Checks items={[
            dropped ? { ok: false, text: `${count(dropped)} subject${dropped === 1 ? '' : 's'} with a missing rating ${dropped === 1 ? 'was' : 'were'} left out. With missing ratings, Fleiss' kappa from complete cases can be biased; Krippendorff's alpha handles them (Zapf and colleagues 2016).` } : null,
            fmt === 'raters' && res.raters === 2 ? { text: "With two fixed raters, Cohen's kappa is the usual choice; Fleiss' kappa treats raters as interchangeable." } : null,
            { text: `The CI comes from ${count(res.B)} bootstrap resamples of subjects (fixed seed, so it repeats exactly). The asymptotic CI is not shown: it covers poorly when agreement is above zero (Zapf and colleagues 2016).` },
          ]} />
          <Report text={`Agreement among ${fmt === 'raters' ? `${res.raters} raters (${list(raterNames)})` : `${res.raters} raters`} on ${count(res.subjects)} subjects was ${res.label} (Fleiss' kappa ${f2(res.kappa)}, 95% bootstrap CI ${ci2(res.ci)}).`} />
          {fmt === 'raters' ? <CodeExport spec={{ kind: 'fleiss', cols: picked }} /> : null}
          <AtLevel min="advanced"><p class="small">Fleiss' kappa compares the agreement among raters within each subject with the agreement expected from the overall category proportions. The p-value uses the large-sample standard error under no agreement beyond chance (Fleiss, Nee and Landis 1979); category kappas follow Fleiss (1971).</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['fleiss71', 'fleissNeeLandis', 'zapf', 'landisKoch']} /></div>
        </section>
      ) : picked.length < 2 && !err ? <p class="small">Choose at least two {fmt === 'raters' ? 'rater' : 'category'} columns.</p> : null}
    </>
  );
}

/* ----------------------------------------------------------------- ICC --- */

const ICC_NAMES = {
  ICC1: ['ICC(1)', 'one-way random effects, absolute agreement, single rater'],
  ICC2: ['ICC(A,1)', 'two-way effects, absolute agreement, single rater'],
  ICC3: ['ICC(C,1)', 'two-way effects, consistency, single rater'],
  ICC1k: ['ICC(k)', 'one-way random effects, absolute agreement, mean of k raters'],
  ICC2k: ['ICC(A,k)', 'two-way effects, absolute agreement, mean of k raters'],
  ICC3k: ['ICC(C,k)', 'two-way effects, consistency, mean of k raters'],
};

function ICCPanel({ ds }) {
  const [cols, setCols] = useState([]);
  const [model, setModel] = useState('random');
  const [type, setType] = useState('absolute');
  const [unit, setUnit] = useState('single');
  if (!ds) return needData;
  const picked = cols.filter((n) => col(ds, n)?.numeric);
  let res = null, err = null, dropped = 0;
  if (picked.length >= 2) {
    const cs = picked.map((nm) => col(ds, nm));
    const data = [];
    for (let i = 0; i < ds.n; i++) {
      const r = cs.map((c) => c.numbers[i]);
      if (r.some((v) => v === null || !Number.isFinite(v))) { dropped++; continue; }
      data.push(r);
    }
    if (data.length < 3) err = 'Fewer than three subjects have every measurement.';
    else {
      res = icc(data);
      if (!res.forms.every((f) => Number.isFinite(f.icc))) { err = 'The ICC is not defined here: the subjects do not vary (every subject has the same mean).'; res = null; }
    }
  }
  const tp = model === 'one' ? 'absolute' : type;
  const id = (model === 'one' ? 'ICC1' : tp === 'absolute' ? 'ICC2' : 'ICC3') + (unit === 'mean' ? 'k' : '');
  const modelText = model === 'one' ? 'one-way random effects' : model === 'random' ? 'two-way random effects' : 'two-way mixed effects';
  const desc = `${modelText}, ${tp === 'absolute' ? 'absolute agreement' : 'consistency'}, ${unit === 'single' ? 'single rater' : `mean of ${picked.length} raters`}`;
  const f = res ? res.forms.find((x) => x.id === id) : null;
  return (
    <>
      <section class="panel stack" aria-labelledby="ic-h">
        <h2 id="ic-h">Measurements by several raters, or repeated</h2>
        <ColumnsPick ds={ds} filter={(c) => c.numeric} value={cols} onChange={setCols} label="Rater or occasion columns (numeric)" hint="Each row is one subject; each chosen column is one rater or one occasion." />
        <Seg label="Who rated each subject?" value={model} onChange={setModel} options={[
          { value: 'random', label: 'The same raters, standing for a wider pool' },
          { value: 'mixed', label: 'The same raters, the only ones of interest' },
          { value: 'one', label: 'Different raters for different subjects' },
        ]} />
        <Seg label="What must agree?" value={tp} onChange={setType} options={[
          { value: 'absolute', label: 'The actual values (absolute agreement)' },
          { value: 'consistency', label: 'Only the ranking (consistency)', disabled: model === 'one', title: model === 'one' ? 'A one-way model measures absolute agreement only' : '' },
        ]} />
        <Seg label="In practice the measurement will come from" value={unit} onChange={setUnit} options={[{ value: 'single', label: 'One rater' }, { value: 'mean', label: `The mean of ${picked.length >= 2 ? picked.length : 'k'} raters` }]} />
        <Disclose title="How to choose (Koo and Li 2016)">
          <p>Inter-rater reliability, with raters who stand for others like them: two-way random effects. Test-retest or intra-rater reliability, or these particular raters only: two-way mixed effects. Each subject rated by a different set of raters: one-way random effects.</p>
          <p>Choose absolute agreement when the raters' numbers must match, as when one rater's value replaces another's; consistency when a fixed offset between raters does not matter. Choose the single-rater form when one rater will measure in practice. Decide all three before looking at the result.</p>
        </Disclose>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {f ? (
        <section class="panel stack result-panel" aria-labelledby="icr-h">
          <div><h2 id="icr-h" style="margin-bottom:6px">{ICC_NAMES[id][0]} = {f2(f.icc)}</h2>
            <p class="verdict-line mono">95% CI {ci2(f.ci)}; {f.label} reliability (Koo and Li)</p></div>
          <Stats items={[['Subjects', count(res.n)], ['Raters or occasions', count(res.k)], ['Model', desc], ['F test (ICC = 0)', `F(${f.df1}, ${f.df2}) = ${fixed(f.F, 2)}`], ['p', pValue(f.p).exact], dropped ? ['Left out (incomplete)', count(dropped)] : null]} />
          <DataTable caption="All six forms (your choice highlighted)" columns={['Form', 'Model', 'ICC', '95% CI', 'Reliability']}
            rows={res.forms.map((x) => [{ text: ICC_NAMES[x.id][0], cls: x.id === id ? 'hl' : '' }, ICC_NAMES[x.id][1], { text: f2(x.icc), cls: x.id === id ? 'hl' : '' }, ci2(x.ci), x.label])} numeric={[2, 3]}
            note="Two-way random and two-way mixed models give the same numbers; they differ in what the result can be generalised to." />
          <Checks items={[
            res.n < 30 || res.k < 3 ? { ok: false, text: `Koo and Li suggest at least 30 subjects of varied values and at least 3 raters where possible; here there ${res.n === 1 ? 'is' : 'are'} ${count(res.n)} and ${count(res.k)}.` } : null,
            { text: `Koo and Li read the 95% CI, not only the estimate: here it spans ${iccLabel(f.ci[0])} to ${iccLabel(f.ci[1])} reliability (below 0.5 poor, 0.5 to 0.75 moderate, 0.75 to 0.9 good, above 0.9 excellent).` },
            { text: 'The ICC depends on how much the subjects differ: a narrow sample (all of similar size) gives a low ICC even with careful measurement.' },
          ]} />
          <Report text={`${unit === 'single' ? 'Reliability of a single rating' : `Reliability of the mean of ${res.k} ratings`} across ${list(picked.map(pretty))} on ${count(res.n)} subjects was ${f.label}: ${ICC_NAMES[id][0]} ${f2(f.icc)} (95% CI ${ci2(f.ci)}), from a ${desc} model.`} />
          <CodeExport spec={{ kind: 'icc', cols: picked, form: id }} />
          <AtLevel min="advanced"><p class="small">The forms follow McGraw and Wong (1996) and Shrout and Fleiss (1979): ICC(1) is their ICC(1,1), ICC(A,1) is ICC(2,1) and ICC(C,1) is ICC(3,1). The intervals use the F distribution, with Satterthwaite's degrees of freedom for absolute agreement in two-way models.</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['kooLi', 'mcgrawWong', 'shroutFleiss']} /></div>
        </section>
      ) : picked.length < 2 && !err ? <p class="small">Choose at least two numeric columns.</p> : null}
    </>
  );
}

/* --------------------------------------------------------- Bland-Altman --- */

function BAPanel({ ds }) {
  const [a, setA] = useState(null), [b, setB] = useState(null);
  const [scale, setScale] = useState('raw');
  const [limitText, setLimit] = useState('');
  if (!ds) return needData;
  const ca = col(ds, a), cb = col(ds, b);
  let res = null, err = null, dropped = 0;
  const xa = [], xb = [];
  if (ca && cb) {
    if (a === b) err = 'Pick two different columns.';
    else {
      for (let i = 0; i < ds.n; i++) {
        const u = ca.numbers[i], v = cb.numbers[i];
        if (u === null || v === null || !Number.isFinite(u) || !Number.isFinite(v)) { dropped++; continue; }
        xa.push(u); xb.push(v);
      }
      if (xa.length < 3) err = 'Fewer than three subjects have both measurements.';
      else if (scale === 'ratio' && [...xa, ...xb].some((v) => v <= 0)) err = 'Ratios need values above zero in both columns. Use the difference or the percentage difference.';
      else if (scale === 'percent' && xa.some((v, i) => v + xb[i] === 0)) err = 'A pair has a mean of zero, so its percentage difference is not defined.';
      else res = blandAltman(xa, xb, { scale });
    }
  }
  const dec = ca && cb ? Math.max(ca.decimals || 0, cb.decimals || 0) : 1;
  const d = scale === 'raw' ? Math.min(4, dec + 1) : scale === 'percent' ? 1 : 3;
  const show = (v) => (scale === 'ratio' ? fixed(Math.exp(v), 3) : fixed(v, d));
  const unitTxt = scale === 'percent' ? '%' : '';
  const nA = pretty(a || 'A'), nB = pretty(b || 'B');
  const lim = parseNumber(limitText);
  const limOk = Number.isFinite(lim) && lim > 0 && (scale !== 'ratio' || lim > 1);
  const bounds = limOk ? (scale === 'ratio' ? [-Math.log(lim), Math.log(lim)] : [-lim, lim]) : null;
  let verdict = null;
  if (res && bounds) {
    const inLoA = res.loa[0] >= bounds[0] && res.loa[1] <= bounds[1];
    const inCI = res.ciLo[0] >= bounds[0] && res.ciHi[1] <= bounds[1];
    verdict = { ok: inLoA && inCI ? true : inLoA ? null : false, text: inLoA && inCI ? `The limits of agreement, and their 95% CIs, lie within the acceptable range of ±${limitText}${scale === 'percent' ? '%' : ''}.` : inLoA ? `The limits of agreement lie within ±${limitText}${scale === 'percent' ? '%' : ''}, but their 95% CIs reach beyond it: a larger sample would settle the question.` : `The limits of agreement go beyond the acceptable range of ±${limitText}${scale === 'percent' ? '%' : ''}: the methods cannot be used interchangeably on this criterion.` };
  }
  const label = { raw: `Difference (${nA} − ${nB})`, percent: `Difference as % of the mean`, ratio: `Ratio (${nA} / ${nB})` }[scale];
  return (
    <>
      <section class="panel stack" aria-labelledby="ba-h">
        <h2 id="ba-h">Two methods measuring the same thing</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="New method (A)" value={a} onChange={setA} kind="numeric" />
          <ColumnSelect ds={ds} label="Reference method (B)" value={b} onChange={setB} kind="numeric" exclude={[a].filter(Boolean)} />
        </div>
        <Seg label="Compare as" value={scale} onChange={setScale} options={[{ value: 'raw', label: 'Difference (A − B)' }, { value: 'percent', label: 'Percentage difference' }, { value: 'ratio', label: 'Ratio (A / B)' }]} />
        <div class="fields">
          <NumberField label={scale === 'ratio' ? 'Largest acceptable ratio (optional)' : `Largest acceptable difference${scale === 'percent' ? ', %' : ''} (optional)`} value={limitText} onInput={setLimit}
            hint={scale === 'ratio' ? 'For example 1.1 for within 10% either way; decide it before the analysis' : 'Decide it on clinical grounds before the analysis'}
            error={limitText.trim() && !limOk ? (scale === 'ratio' ? 'Enter a ratio above 1.' : 'Enter a positive number.') : ''} />
        </div>
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="bar-h">
          <div><h2 id="bar-h" style="margin-bottom:6px">{scale === 'ratio' ? `Mean ratio ${show(res.bias)}` : `Bias ${show(res.bias)}${unitTxt}`}</h2>
            <p class="verdict-line mono">95% limits of agreement {show(res.loa[0])}{unitTxt} to {show(res.loa[1])}{unitTxt}</p></div>
          <Stats items={[['Pairs', count(res.n)], [scale === 'ratio' ? 'Geometric mean ratio (95% CI)' : 'Mean difference (95% CI)', `${show(res.bias)}${unitTxt} (${show(res.ciBias[0])} to ${show(res.ciBias[1])})`],
            [scale === 'ratio' ? 'SD of log ratios' : 'SD of differences', scale === 'ratio' ? fixed(res.sd, 4) : `${fixed(res.sd, d)}${unitTxt}`],
            ['Lower limit (95% CI)', `${show(res.loa[0])}${unitTxt} (${show(res.ciLo[0])} to ${show(res.ciLo[1])})`], ['Upper limit (95% CI)', `${show(res.loa[1])}${unitTxt} (${show(res.ciHi[0])} to ${show(res.ciHi[1])})`],
            ['Trend with size (slope, p)', `${sig(res.slope, 3)}, ${P(res.pSlope)}`], dropped ? ['Left out (incomplete)', count(dropped)] : null]} />
          <figure style="margin:0">
            <BlandAltmanPlot avg={res.avg} diff={scale === 'ratio' ? res.diff.map(Math.exp) : res.diff} bias={scale === 'ratio' ? Math.exp(res.bias) : res.bias}
              loa={scale === 'ratio' ? res.loa.map(Math.exp) : res.loa} ref0={scale === 'ratio' ? 1 : 0} label={`Bland-Altman plot: ${label} against the mean`} />
            <figcaption class="figcap">Vertical axis: {label}. Solid line: the {scale === 'ratio' ? 'mean ratio' : 'mean difference (bias)'}; dashed lines: the 95% limits of agreement.</figcaption>
          </figure>
          <Checks items={[
            verdict,
            res.pSlope < 0.05 ? { ok: false, text: `The ${scale === 'ratio' ? 'ratios' : 'differences'} change with the size of the measurement (slope ${sig(res.slope, 3)}, ${P(res.pSlope)}): one pair of limits does not fit the whole range.${scale === 'raw' ? ' Try the percentage difference or the ratio.' : ''}` } : { ok: true, text: `No clear trend in the ${scale === 'ratio' ? 'ratios' : 'differences'} with the size of the measurement (${P(res.pSlope)}).` },
            !bounds ? { text: 'Whether these limits are acceptable is a clinical judgement: set the largest acceptable difference before the analysis, and enter it above.' } : null,
            { text: 'Correlation is not agreement: two methods can correlate closely and still differ by amounts that matter.' },
          ]} />
          <Report text={scale === 'ratio'
            ? `Across ${count(res.n)} paired measurements, ${nA} gave values ${res.bias >= 0 ? 'higher' : 'lower'} than ${nB} by a geometric mean ratio of ${show(res.bias)} (95% CI ${show(res.ciBias[0])} to ${show(res.ciBias[1])}); 95% of ratios are expected to lie between ${show(res.loa[0])} and ${show(res.loa[1])}.`
            : `Across ${count(res.n)} paired measurements, the mean difference (${nA} − ${nB}) was ${show(res.bias)}${unitTxt} (95% CI ${show(res.ciBias[0])} to ${show(res.ciBias[1])}${unitTxt}), and the 95% limits of agreement were ${show(res.loa[0])}${unitTxt} to ${show(res.loa[1])}${unitTxt}${scale === 'percent' ? ' of the mean of the two methods' : ''}.`} />
          <CodeExport spec={{ kind: 'ba', a, b, scale }} />
          <AtLevel min="advanced"><p class="small">Limits of agreement are the mean difference ± 1.96 SD of the differences. Their 95% CIs use the approximate standard error √(3s²/n) with t on n − 1 df, as in Bland and Altman (1999). {scale === 'ratio' ? 'Ratios are analysed as differences of logarithms and transformed back.' : ''}</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['blandAltman86', 'blandAltman99']} /></div>
        </section>
      ) : !ca || !cb ? <p class="small">Choose the two measurement columns.</p> : null}
    </>
  );
}

/* ------------------------------------------------------ Cronbach's alpha --- */

function AlphaPanel({ ds }) {
  const [cols, setCols] = useState([]);
  if (!ds) return needData;
  const picked = cols.filter((n) => col(ds, n)?.numeric);
  let res = null, err = null, dropped = 0;
  if (picked.length >= 2) {
    const cs = picked.map((nm) => col(ds, nm));
    const data = [];
    for (let i = 0; i < ds.n; i++) {
      const r = cs.map((c) => c.numbers[i]);
      if (r.some((v) => v === null || !Number.isFinite(v))) { dropped++; continue; }
      data.push(r);
    }
    if (data.length < 3) err = 'Fewer than three respondents answered every chosen item.';
    else {
      res = cronbach(data);
      if (!Number.isFinite(res.alpha)) { err = 'Alpha is not defined: the total score does not vary.'; res = null; }
    }
  }
  const names = picked.map(pretty);
  const neg = res ? res.items.filter((x) => x.itemRest < 0) : [];
  const better = res ? res.items.filter((x) => x.alphaIfDeleted > res.alpha + 0.005).sort((x, y) => y.alphaIfDeleted - x.alphaIfDeleted) : [];
  return (
    <>
      <section class="panel stack" aria-labelledby="ca-h">
        <h2 id="ca-h">Items of a scale</h2>
        <ColumnsPick ds={ds} filter={(c) => c.numeric} value={cols} onChange={setCols} label="Item columns (scored, reverse-scored items already reversed)" hint="Each row is one respondent; choose the items of one scale or subscale." />
      </section>
      {err ? <Callout kind="warn" mark="Check"><p>{err}</p></Callout> : null}
      {res ? (
        <section class="panel stack result-panel" aria-labelledby="car-h">
          <div><h2 id="car-h" style="margin-bottom:6px">Cronbach's alpha = {f2(res.alpha)}</h2>
            <p class="verdict-line mono">95% CI {ci2(res.ci)} (Feldt)</p></div>
          <Stats items={[['Respondents', count(res.n)], ['Items', count(res.k)], dropped ? ['Left out (an item missing)', count(dropped)] : null]} />
          <DataTable caption="Item statistics" columns={['Item', 'Mean', 'SD', 'Item-rest correlation', 'Alpha if item deleted']}
            rows={res.items.map((x, j) => [names[j], fixed(x.mean, 2), fixed(x.sd, 2), { text: fixed(x.itemRest, 2), cls: x.itemRest < 0 ? 'hl' : '' }, { text: Number.isFinite(x.alphaIfDeleted) ? fixed(x.alphaIfDeleted, 2) : '—', cls: x.alphaIfDeleted > res.alpha + 0.005 ? 'hl' : '' }])}
            numeric={[1, 2, 3, 4]} note="Item-rest correlation: the item against the total of the other items." />
          <Checks items={[
            neg.length ? { ok: false, text: `${list(neg.map((x) => names[x.j]))} ${neg.length === 1 ? 'runs' : 'run'} against the rest of the scale (negative item-rest correlation): reverse-score ${neg.length === 1 ? 'it' : 'them'} if worded the other way, or review the wording.` } : null,
            better.length ? { ok: false, text: `Removing ${names[better[0].j]} would raise alpha from ${f2(res.alpha)} to ${f2(better[0].alphaIfDeleted)}: check whether it belongs to this scale.` } : null,
            res.alpha < 0.7 ? { ok: false, text: 'Alpha is below 0.70. Reported acceptable values range from 0.70 to 0.95 (Tavakol and Dennick 2011); low values can come from too few items, weakly related items or more than one construct.' } : res.alpha > 0.9 ? { ok: false, text: 'Alpha is above 0.90: some items may repeat one another (Tavakol and Dennick 2011).' } : { ok: true, text: 'Alpha lies in the range usually reported as acceptable, 0.70 to 0.95 (Tavakol and Dennick 2011).' },
            { text: 'Alpha rises with the number of items, and it measures internal consistency: it does not show that the items measure a single construct. A new scale needs a factor analysis for that.' },
          ]} />
          <Report text={`Internal consistency of the ${res.k}-item scale (${list(names)}) in ${count(res.n)} respondents: Cronbach's alpha ${f2(res.alpha)} (95% CI ${ci2(res.ci)}).${better.length ? ` Removing ${names[better[0].j]} would raise alpha to ${f2(better[0].alphaIfDeleted)}.` : ''}`} />
          <CodeExport spec={{ kind: 'alpha', cols: picked }} />
          <AtLevel min="advanced"><p class="small">Alpha = k / (k − 1) × (1 − sum of item variances / variance of the total). The 95% CI uses Feldt's F distribution with n − 1 and (n − 1)(k − 1) df.</p></AtLevel>
          <div class="prose"><h3 class="sub">References</h3><Refs refs={REFS} ids={['cronbach51', 'feldt65', 'tavakol']} /></div>
        </section>
      ) : picked.length < 2 && !err ? <p class="small">Choose at least two item columns.</p> : null}
    </>
  );
}

/* ---------------------------------------------------------------- page --- */

export default function AgreementTool() {
  const ds = useDataset();
  const [tab, setTab] = useState('kappa');
  const Body = { kappa: KappaPanel, fleiss: FleissPanel, icc: ICCPanel, ba: BAPanel, alpha: AlphaPanel }[tab];
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} title="Agreement and Reliability"
        lede="How far raters, methods or occasions agree, and how consistent the items of a scale are: kappa, weighted kappa, Fleiss' kappa, the intraclass correlation, Bland-Altman limits and Cronbach's alpha." />
      <div class="stack">
        <DataPanel examples={[{ label: 'Load example screening-camp data', csv: exampleAgreementCsv, source: 'example-agree' }]} />
        <Disclose title="Which method fits my data?">
          <ul>
            <li>Categories from two raters (positive or negative; grades): <strong>Cohen's kappa</strong>, weighted when the categories are ordered.</li>
            <li>Categories from three or more raters: <strong>Fleiss' kappa</strong>.</li>
            <li>Measurements from two or more raters, or repeated on two or more occasions: <strong>intraclass correlation</strong>.</li>
            <li>Two methods or instruments measuring the same quantity: <strong>Bland-Altman limits of agreement</strong>.</li>
            <li>Items of a questionnaire scale: <strong>Cronbach's alpha</strong>.</li>
          </ul>
        </Disclose>
        <div><Seg wide value={tab} onChange={setTab} options={[
          { value: 'kappa', label: 'Two raters' }, { value: 'fleiss', label: 'Three or more raters' }, { value: 'icc', label: 'ICC' },
          { value: 'ba', label: 'Bland-Altman' }, { value: 'alpha', label: "Cronbach's alpha" },
        ]} /></div>
        <Body ds={ds} />
      </div>
    </div>
  );
}
