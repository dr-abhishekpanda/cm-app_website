/* Tool: describe your data. Summaries for numeric columns with a check of the distribution's
 * shape and the summary to report, frequency tables for categories, and plots; all optionally
 * split by a grouping column. */
import { useState, useMemo } from 'preact/hooks';
import { summarise, shapiroWilk, frequencies, QUANTILE_METHODS } from '../../engine/describe.js';
import { isMissing } from '../../engine/data.js';
import { normal } from '../../engine/dist.js';
import { fixed, pValue, count, dpFor, interval } from '../../engine/format.js';
import { PageHead, Seg, Callout, AtLevel, useSettings } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col } from '../../ui/data.jsx';
import { DataTable, Report, Refs } from '../../ui/results.jsx';
import { Histogram, BoxPlot, QQPlot, PercentBars } from '../../ui/plot.jsx';
import { REFS } from '../refs.js';

export const pretty = (name) => String(name).replace(/_/g, ' ');

/**
 * Is the distribution close enough to normal to summarise with mean and SD?
 * Shapiro-Wilk plus skewness and kurtosis z-scores with the cut-offs in Kim (2013):
 * |z| < 1.96 below n = 50, |z| < 3.29 for n = 50 to 299, and from n = 300 the absolute
 * skewness under 2 and excess kurtosis under 7 (Shapiro-Wilk flags trivial departures there).
 */
export function shapeVerdict(s, sw) {
  const n = s.n;
  if (n < 3) return { normal: null, reason: 'too few values to judge' };
  let shapeOk = true;
  if (Number.isFinite(s.skew) && Number.isFinite(s.kurt)) {
    if (n < 50) shapeOk = Math.abs(s.zSkew) < 1.96 && Math.abs(s.zKurt) < 1.96;
    else if (n < 300) shapeOk = Math.abs(s.zSkew) < 3.29 && Math.abs(s.zKurt) < 3.29;
    else shapeOk = Math.abs(s.skew) < 2 && Math.abs(s.kurt) < 7;
  }
  const swOk = !(sw.p < 0.05);
  const normalish = n >= 300 ? shapeOk : swOk && shapeOk;
  const dir = s.skew > 0.5 ? 'skewed to the right (a long upper tail)' : s.skew < -0.5 ? 'skewed to the left (a long lower tail)' : 'not normal in shape';
  return { normal: normalish, reason: normalish ? 'approximately normal' : dir };
}

function numericRow(name, label, x, missing, qtype, d) {
  const s = summarise(x, { qtype });
  const sw = s.n >= 3 && s.n <= 5000 && s.range > 0 ? shapiroWilk(x) : { p: NaN };
  const v = shapeVerdict(s, sw);
  return { name, label, s, sw, v, missing, d };
}

function NumericTable({ rows, grouped }) {
  const adv = useSettings().level === 'advanced';
  const cols = ['Variable', ...(grouped ? ['Group'] : []), 'n', 'Missing', 'Mean (SD)', '95% CI of mean', 'Median (IQR)', ...(adv ? ['95% CI of median'] : []), 'Min to max', 'Skewness', 'Shapiro-Wilk p', 'Summarise with'];
  const body = rows.map(({ name, label, s, sw, v, missing, d }) => {
    if (!s.n) return [pretty(name), ...(grouped ? [label] : []), '0', String(missing), ...Array(adv ? 8 : 7).fill('—')];
    return [
      pretty(name), ...(grouped ? [label] : []), count(s.n), String(missing),
      s.n > 1 ? `${fixed(s.mean, d)} (${fixed(s.sd, d)})` : fixed(s.mean, d),
      s.n > 1 ? interval(s.ciMean, d) : '—',
      `${fixed(s.median, d)} (${fixed(s.q1, d)} to ${fixed(s.q3, d)})`,
      ...(adv ? [Number.isFinite(s.ciMedian?.lo) ? `${fixed(s.ciMedian.lo, d)} to ${fixed(s.ciMedian.hi, d)}` : 'needs n ≥ 6'] : []),
      `${fixed(s.min, d)} to ${fixed(s.max, d)}`,
      Number.isFinite(s.skew) ? fixed(s.skew, 2) : '—',
      Number.isFinite(sw.p) ? pValue(sw.p).report.replace(/^p = /, '').replace(/^p /, '') : '—',
      { text: v.normal === null ? '—' : v.normal ? 'Mean (SD)' : 'Median (IQR)', cls: v.normal === false ? 'warn' : 'hl' },
    ];
  });
  const first = grouped ? 2 : 1;
  return <DataTable columns={cols} rows={body} numeric={Array.from({ length: cols.length - first - 1 }, (_, i) => i + first)} caption="Numeric variables" />;
}

function sentenceNumeric(name, rows) {
  const anySkewed = rows.some((r) => r.v.normal === false);
  const shape = anySkewed ? 'was not normally distributed' : 'was approximately normally distributed';
  const stat = ({ s, d }, of = '') => (anySkewed
    ? `median ${of}${fixed(s.median, d)} (IQR ${fixed(s.q1, d)} to ${fixed(s.q3, d)})`
    : `mean ${of}${fixed(s.mean, d)} (SD ${fixed(s.sd, d)}; 95% CI ${interval(s.ciMean, d)})`);
  const ok = rows.filter((r) => r.s.n > 1);
  if (!ok.length) return '';
  if (ok.length === 1 && !ok[0].label) return `${pretty(name)} ${shape} (n = ${count(ok[0].s.n)}), with a ${stat(ok[0], 'of ')}.`;
  return `${pretty(name)} ${shape}: ${ok.map((r) => `${stat(r)} in ${r.label} (n = ${count(r.s.n)})`).join('; ')}.`;
}

function CategoricalBlock({ ds, name, groupName }) {
  const c = col(ds, name);
  const g = groupName ? col(ds, groupName) : null;
  const present = c.raw.filter((v) => !isMissing(v));
  const missing = c.raw.length - present.length;
  if (!g) {
    const f = frequencies(present, { order: c.levels });
    const rows = f.map((r) => [r.value, count(r.count), fixed(r.pct, 1), interval(r.ci, 1), fixed(r.cumPct, 1)]);
    rows.push([{ text: 'Total', cls: 'hl' }, count(present.length), '100.0', '', '']);
    if (missing) rows.push(['Missing', count(missing), '', '', '']);
    const N = present.length;
    const list = f.slice(0, 6).map((r) => `${count(r.count)} (${fixed(r.pct, 1)}%) ${r.value}`).join(', ');
    const binary = f.length === 2;
    const yes = f.find((r) => /^(yes|y|1|present|positive|true)$/i.test(r.value));
    const say = binary && yes
      ? `${pretty(name)}: ${count(yes.count)} of ${count(N)} (${fixed(yes.pct, 1)}%; 95% CI ${interval(yes.ci, 1)}).`
      : `Of ${count(N)} participants with ${pretty(name)} recorded: ${list}${f.length > 6 ? ', and others' : ''}.`;
    return (
      <div class="stack">
        <DataTable columns={[pretty(name), 'n', '%', '95% CI (Wilson)', 'Cumulative %']} rows={rows} numeric={[1, 2, 3, 4]}
          note={missing ? `Percentages exclude ${count(missing)} missing.` : undefined} />
        <PercentBars items={f.map((r) => ({ label: r.value, pct: r.pct, ci: r.ci }))} label={`Percentage in each category of ${pretty(name)}, with 95% CIs`} />
        <Report text={say} />
      </div>
    );
  }
  // Cross-tabulation with column percentages (the usual Table 1 layout).
  const groups = g.levels;
  const cats = c.levels;
  const t = cats.map(() => groups.map(() => 0));
  const colN = groups.map(() => 0);
  c.raw.forEach((v, i) => {
    const gv = g.raw[i];
    if (isMissing(v) || isMissing(gv)) return;
    t[cats.indexOf(v)][groups.indexOf(gv)]++;
    colN[groups.indexOf(gv)]++;
  });
  const rows = cats.map((cat, i) => [cat, ...groups.map((_, j) => (colN[j] ? `${count(t[i][j])} (${fixed((100 * t[i][j]) / colN[j], 1)}%)` : '0'))]);
  rows.push([{ text: 'Total', cls: 'hl' }, ...colN.map((n) => count(n))]);
  return (
    <DataTable columns={[pretty(name), ...groups.map((x) => `${pretty(groupName)}: ${x}`)]} rows={rows} numeric={groups.map((_, j) => j + 1)}
      note="Column percentages: each group adds up to 100%. To test the difference, use Choose and Run a Test." />
  );
}

export default function DescribeTool() {
  const ds = useDataset();
  const [qtype, setQtype] = useState(6);
  const [picked, setPicked] = useState(null);
  const [cats, setCats] = useState(null);
  const [groupName, setGroupName] = useState(null);
  const [plotVar, setPlotVar] = useState(null);

  const numericCols = ds ? ds.columns.filter((c) => c.numeric && c.levels.length > 1) : [];
  const catCols = ds ? ds.columns.filter((c) => !c.numeric || c.levels.length <= 6).filter((c) => c.levels.length >= 1 && c.levels.length <= 30) : [];
  const chosen = picked ?? numericCols.filter((c) => c.levels.length > 6).slice(0, 4).map((c) => c.name);
  const chosenCats = cats ?? catCols.filter((c) => !c.numeric).slice(0, 3).map((c) => c.name);
  const group = groupName ? col(ds, groupName) : null;

  const blocks = useMemo(() => {
    if (!ds) return [];
    return chosen.map((name) => {
      const c = col(ds, name);
      if (!c) return null;
      const d = dpFor(c.decimals);
      if (!group) {
        const x = c.numbers.filter((v) => v !== null && Number.isFinite(v));
        return { name, rows: [numericRow(name, '', x, c.missing, qtype, d)] };
      }
      const rows = group.levels.map((lv) => {
        const x = [];
        let miss = 0;
        c.numbers.forEach((v, i) => { if (group.raw[i] !== lv) return; if (v === null || !Number.isFinite(v)) miss++; else x.push(v); });
        return numericRow(name, lv, x, miss, qtype, d);
      });
      return { name, rows };
    }).filter(Boolean);
  }, [ds, chosen.join('|'), groupName, qtype]);

  const toggle = (list, setList, name) => setList(list.includes(name) ? list.filter((x) => x !== name) : [...list, name]);
  const pv = plotVar && chosen.includes(plotVar) ? plotVar : chosen[0];
  const pvCol = pv ? col(ds, pv) : null;
  const pvValues = pvCol ? pvCol.numbers.filter((v) => v !== null && Number.isFinite(v)) : [];

  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Analyse' }]} eyebrow="Analyse"
        title="Describe Your Data"
        lede="Summaries for every variable, a check of each distribution's shape with the summary to report, frequency tables and plots. Your data stay on this device." />
      <div class="stack">
        <DataPanel />
        {!ds ? (
          <Callout mark="Start here">
            <p>Paste your data above, open a CSV file, or load the example: a simulated antenatal anaemia follow-up of 120 women. A single column of numbers also works.</p>
          </Callout>
        ) : (
          <>
            <section class="panel stack" aria-labelledby="vars-h">
              <h2 id="vars-h">Variables</h2>
              {numericCols.length ? (
                <div>
                  <span class="label">Numeric</span>
                  <div class="varpick">{numericCols.map((c) => <label><input type="checkbox" checked={chosen.includes(c.name)} onChange={() => toggle(chosen, setPicked, c.name)} />{pretty(c.name)}</label>)}</div>
                </div>
              ) : null}
              {catCols.length ? (
                <div>
                  <span class="label">Categorical</span>
                  <div class="varpick">{catCols.map((c) => <label><input type="checkbox" checked={chosenCats.includes(c.name)} onChange={() => toggle(chosenCats, setCats, c.name)} />{pretty(c.name)}</label>)}</div>
                </div>
              ) : null}
              <div class="fields">
                <ColumnSelect ds={ds} label="Split by group (optional)" value={groupName} onChange={setGroupName} kind="group" maxLevels={10} allowNone />
                <div>
                  <Seg label="Quartiles as in" value={qtype} onChange={setQtype} options={[{ value: 6, label: 'SPSS', title: QUANTILE_METHODS[6] }, { value: 7, label: 'R and Excel', title: QUANTILE_METHODS[7] }]} />
                </div>
              </div>
            </section>

            {blocks.length ? (
              <section class="panel stack" aria-labelledby="num-h">
                <h2 id="num-h">Numeric summaries</h2>
                <NumericTable rows={blocks.flatMap((b) => b.rows)} grouped={!!group} />
                {blocks.map((b) => <Report label={`${pretty(b.name)}: sentence for your results`} text={sentenceNumeric(b.name, b.rows)} />)}
                <AtLevel min="intermediate">
                  <Callout mark="Mean or median">
                    <p>"Summarise with" combines the Shapiro-Wilk test with skewness and kurtosis. Below 300 values a distribution is treated as approximately normal when Shapiro-Wilk p is at least 0.05 and the skewness and kurtosis z-scores stay under 1.96 (n below 50) or 3.29 (n of 50 to 299); from 300 values, when skewness is under 2 and excess kurtosis under 7 in absolute value. Look at the histogram and Q-Q plot too: tests alone over-react in large samples and miss problems in small ones.</p>
                  </Callout>
                </AtLevel>
              </section>
            ) : null}

            {pv ? (
              <section class="panel stack" aria-labelledby="plot-h">
                <div class="dp-head" style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
                  <h2 id="plot-h" style="margin:0 auto 0 0">Plots</h2>
                  <div style="min-width:200px"><ColumnSelect ds={ds} label="Variable" value={pv} onChange={setPlotVar} kind="numeric" exclude={ds.columns.filter((c) => !chosen.includes(c.name)).map((c) => c.name)} /></div>
                </div>
                <div class="plotgrid">
                  <figure><Histogram x={pvValues} normal label={`Histogram of ${pretty(pv)} with a fitted normal curve`} /><figcaption>Histogram with the normal curve of the same mean and SD.</figcaption></figure>
                  <figure><QQPlot x={pvValues} ppf={normal.ppf} label={`Normal Q-Q plot of ${pretty(pv)}`} /><figcaption>Normal Q-Q plot: points near the dashed line mean a near-normal shape.</figcaption></figure>
                  <figure>
                    {group ? (() => {
                      const gs = group.levels.map((lv) => pvCol.numbers.filter((v, i) => v !== null && Number.isFinite(v) && group.raw[i] === lv));
                      return <BoxPlot groups={gs} labels={group.levels} label={`Box plots of ${pretty(pv)} by ${pretty(groupName)}`} />;
                    })() : <BoxPlot groups={[pvValues]} labels={[pretty(pv)]} label={`Box plot of ${pretty(pv)}`} />}
                    <figcaption>Box: quartiles and median; whiskers to 1.5 IQR; circles are values beyond; the cross marks the mean.</figcaption>
                  </figure>
                </div>
              </section>
            ) : null}

            {chosenCats.length ? (
              <section class="panel stack" aria-labelledby="cat-h">
                <h2 id="cat-h">Categorical variables</h2>
                {chosenCats.map((name) => <CategoricalBlock ds={ds} name={name} groupName={groupName && groupName !== name ? groupName : null} />)}
              </section>
            ) : null}
          </>
        )}
        <section class="panel prose" aria-labelledby="dref-h">
          <h2 id="dref-h">Methods and references</h2>
          <p>Means come with t-based 95% confidence intervals. In the Advanced view the table adds a distribution-free 95% interval for the median, from order statistics (Campbell and Gardner). Quartiles follow your choice: SPSS and Minitab (Hyndman-Fan type 6) or R and Excel QUARTILE.INC (type 7); the median is the same in both. Skewness and kurtosis are the bias-adjusted G1 and G2 that SPSS reports. Percentages carry Wilson score intervals.</p>
          <AtLevel min="advanced">
            <p>Shapiro-Wilk uses Royston's algorithm AS R94, the one in R and SciPy, valid from 3 to 5,000 values. Every function is checked against SciPy and NumPy before release.</p>
          </AtLevel>
          <Refs refs={REFS} ids={['kirkwood', 'ghasemi', 'kimSkew', 'royston', 'hyndman', 'campbellGardner', 'wilson']} />
        </section>
      </div>
    </div>
  );
}
