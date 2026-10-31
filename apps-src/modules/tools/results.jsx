/* Tool: results to text and Table 1. Builds the participants table from the dataset (overall and by
 * group, mean (SD), median (IQR) or n (%), missing values, optional tests) with a descriptive
 * paragraph, and gathers the sentences and tables added from every other tool ("My results") for
 * copying into Word in one go. */
import { useState } from 'preact/hooks';
import { table1, suggestSummary, groupRows } from '../../engine/table1.js';
import { fixed, count } from '../../engine/format.js';
import { PageHead, Seg, Callout, CopyButton, Icon } from '../../ui/core.jsx';
import { DataPanel, useDataset, ColumnSelect, col } from '../../ui/data.jsx';
import { DataTable, Report, Refs } from '../../ui/results.jsx';
import { useNotebook, notebookText, notebookHtml } from '../../ui/notebook.jsx';
import { REFS } from '../refs.js';

const pretty = (s) => String(s).replace(/_/g, ' ');
const KIND_LABEL = { mean: 'Mean (SD)', median: 'Median (IQR)', cat: 'Categories, n (%)' };
const listJoin = (xs) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** A first draft of the participants paragraph, from the overall column. */
function describe(t) {
  const parts = [];
  for (const r of t.rows) {
    if (r.kind === 'mean') parts.push(`mean ${r.label.replace(/, mean \(SD\)$/, '')} ${r.cells[0].replace(/ \(/, ' (SD ')}`);
    else if (r.kind === 'median') parts.push(`median ${r.label.replace(/, median \(IQR\)$/, '')} ${r.cells[0].replace(/ \(/, ' (IQR ')}`);
  }
  const cats = [];
  let cur = null;
  for (const r of t.rows) {
    if (r.kind === 'head') { cur = { label: r.label, levels: [] }; cats.push(cur); } else if (r.kind === 'cat' && r.label.startsWith(' ') && cur) cur.levels.push(`${r.level}, ${r.cells[0].replace(/ \((.*)\)$/, ' ($1%)')}`);
    else if (r.kind === 'cat') { cats.push({ label: r.label, levels: [r.cells[0].replace(/ \((.*)\)$/, ' ($1%)')] }); cur = null; }
  }
  const s1 = `The analysis included ${count(t.n)} participants${t.groups.length ? ` (${t.groups.map((g, j) => `${g} ${count(t.sizes[j])}`).join(', ')})` : ''}.`;
  const s2 = parts.length ? ` Their ${listJoin(parts)}.` : '';
  const s3 = cats.map((c) => ` ${c.label}: ${c.levels.join('; ')}.`).join('');
  return s1 + s2 + s3;
}

function Table1Panel({ ds }) {
  const [group, setGroup] = useState(null);
  const [picked, setPicked] = useState([]);
  const [kinds, setKinds] = useState({});
  const [overall, setOverall] = useState(true);
  const [tests, setTests] = useState(false);
  const [compact, setCompact] = useState(true);
  const [qtype, setQ] = useState(6);
  if (!ds) return <Callout mark="Data">Load or paste your data above, or try the example data.</Callout>;
  const rows = groupRows(ds, group);
  const idLike = (c) => !c.numeric && c.levels.length === ds.n - c.missing && ds.n > 20;
  const candidates = ds.columns.filter((c) => c.name !== group && !idLike(c) && (c.numeric || c.levels.length <= 20));
  const chosen = picked.filter((n) => candidates.some((c) => c.name === n));
  const suggested = Object.fromEntries(chosen.map((n) => [n, suggestSummary(col(ds, n), rows)]));
  const kindOf = (n) => kinds[n] || suggested[n];
  const vars = chosen.map((n) => ({ name: n, kind: kindOf(n) }));
  const t = vars.length ? table1(ds, { vars, group, overall, tests, compact, qtype }) : null;
  const tAll = vars.length ? table1(ds, { vars, group: null, compact, qtype }) : null;
  const toggle = (n) => setPicked(chosen.includes(n) ? chosen.filter((x) => x !== n) : [...chosen, n]);
  const numericChosen = chosen.filter((n) => col(ds, n).numeric);
  const caption = `Table 1. Characteristics of the participants${group ? `, by ${pretty(group)}` : ''}`;
  return (
    <>
      <section class="panel stack" aria-labelledby="t1-h">
        <h2 id="t1-h">Table 1</h2>
        <div class="fields">
          <ColumnSelect ds={ds} label="Columns by group (optional)" value={group} onChange={setGroup} kind="group" maxLevels={8} allowNone hint="For example the study arm, or exposed and unexposed" />
        </div>
        <div>
          <span class="label">Rows: characteristics to show</span>
          <div class="varpick">{candidates.map((c) => <label><input type="checkbox" checked={chosen.includes(c.name)} onChange={() => toggle(c.name)} />{pretty(c.name)}</label>)}</div>
          <div class="btn-row" style="margin-top:8px">
            <button type="button" class="btn ghost small" onClick={() => setPicked(candidates.map((c) => c.name))}>Choose all</button>
            {chosen.length ? <button type="button" class="btn ghost small" onClick={() => setPicked([])}>Clear</button> : null}
          </div>
          {chosen.length ? <p class="small">Rows appear in the order you tick them.</p> : null}
        </div>
        {numericChosen.length ? (
          <div class="stack" style="gap:8px">
            <span class="label">How to summarise each measurement</span>
            {numericChosen.map((n) => (
              <div class="sumrow">
                <span>{pretty(n)}</span>
                <select aria-label={`Summary for ${pretty(n)}`} value={kindOf(n)} onChange={(e) => setKinds({ ...kinds, [n]: e.currentTarget.value })}>
                  {['mean', 'median', 'cat'].map((k) => <option value={k}>{KIND_LABEL[k]}{suggested[n] === k ? ' (suggested)' : ''}</option>)}
                </select>
              </div>
            ))}
            <p class="small">Suggested: categories for 6 or fewer distinct values; the median when Shapiro-Wilk rejects normality (p &lt; 0.05) in any group; otherwise the mean.</p>
          </div>
        ) : null}
        <div class="fields">
          {group ? <Seg label="Overall column" value={overall ? 'y' : 'n'} onChange={(v) => setOverall(v === 'y')} options={[{ value: 'y', label: 'Show' }, { value: 'n', label: 'Hide' }]} /> : null}
          <Seg label="Yes/no characteristics" value={compact ? 'y' : 'n'} onChange={(v) => setCompact(v === 'y')} options={[{ value: 'y', label: 'One row' }, { value: 'n', label: 'Every category' }]} />
          <Seg label="Quartiles as in" value={qtype} onChange={setQ} options={[{ value: 6, label: 'SPSS' }, { value: 7, label: 'R and Excel' }]} />
          {group ? <Seg label="p-values" value={tests ? 'y' : 'n'} onChange={(v) => setTests(v === 'y')} options={[{ value: 'n', label: 'None' }, { value: 'y', label: 'Add' }]} /> : null}
        </div>
        {group && tests ? (
          <Callout kind="warn" mark="Think first">
            <p>In a randomised trial, any baseline difference arises by chance, so CONSORT advises against testing it; STROBE likewise advises against tests in descriptive tables. Add p-values only when comparing the groups is a stated aim, as in a cross-sectional comparison.</p>
          </Callout>
        ) : null}
      </section>
      {t ? (
        <section class="panel stack result-panel" aria-labelledby="t1r-h">
          <div><p class="eyebrow" style="margin-bottom:8px">Result</p><h2 id="t1r-h" style="margin-bottom:6px">{caption.replace(/^Table 1\. /, '')}</h2></div>
          <DataTable caption={caption} columns={t.columns} rows={t.rows.map((r) => r.all.map((c, i) => (r.kind === 'head' && i === 0 ? { text: c, cls: 'hl' } : c)))}
            numeric={t.columns.map((_, i) => i).slice(1)} note={t.footnotes.join(' ')} />
          <Report label="Participants paragraph (a first draft to edit)" text={describe(tAll)} />
          {group && tests ? <div class="prose"><span class="label">References</span><Refs refs={REFS} ids={['consortEE10', 'strobeEE', 'kirkwood']} /></div> : null}
        </section>
      ) : <p class="small">Tick the characteristics to show.</p>}
    </>
  );
}

function NotebookPanel() {
  const nb = useNotebook();
  const [confirm, setConfirm] = useState(false);
  const download = () => {
    const html = `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><title>My results</title></head><body>${notebookHtml(nb.items)}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'my-results.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (!nb.items.length) {
    return (
      <Callout mark="Empty">
        <p>Nothing here yet. Under any result sentence or table in the tools, press <strong>Add to my results</strong>. The items gather here, in order, ready to edit and copy into your paper or thesis together.</p>
      </Callout>
    );
  }
  const when = (iso) => { try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };
  return (
    <section class="panel stack" aria-labelledby="nb-h">
      <h2 id="nb-h">My results</h2>
      <div class="btn-row">
        <CopyButton text={() => notebookText(nb.items)} html={() => notebookHtml(nb.items)} label="Copy all for Word" />
        <button type="button" class="btn ghost small" onClick={download}>Download (opens in Word)</button>
        {confirm ? (
          <>
            <button type="button" class="btn ghost small" onClick={() => { nb.clear(); setConfirm(false); }}>Yes, remove all</button>
            <button type="button" class="btn ghost small" onClick={() => setConfirm(false)}>Keep them</button>
          </>
        ) : <button type="button" class="btn ghost small" onClick={() => setConfirm(true)}>Remove all</button>}
      </div>
      {nb.saved ? <p class="small">Kept in this browser on this device until you remove them. Nothing is uploaded.</p>
        : <Callout kind="warn" mark="Not saved"><p>This browser is not keeping them (private window or blocked storage): copy them before you close the page.</p></Callout>}
      <ol class="nblist">
        {nb.items.map((it, i) => (
          <li class="nbitem">
            <div class="nbhead">
              <span class="mono small">{i + 1}. {it.source || 'Result'}{it.at ? ` · ${when(it.at)}` : ''}</span>
              <span class="nbbtns">
                <button type="button" class="btn ghost small" disabled={i === 0} onClick={() => nb.move(it.id, -1)} aria-label={`Move item ${i + 1} up`}>{'↑'}</button>
                <button type="button" class="btn ghost small" disabled={i === nb.items.length - 1} onClick={() => nb.move(it.id, 1)} aria-label={`Move item ${i + 1} down`}>{'↓'}</button>
                <button type="button" class="btn ghost small" onClick={() => nb.remove(it.id)} aria-label={`Remove item ${i + 1}`}>{'×'}</button>
              </span>
            </div>
            {it.kind === 'table'
              ? <DataTable caption={it.title} columns={it.columns} rows={it.rows} note={it.note} numeric={it.columns.map((_, j) => j).slice(1)} add={false} />
              : <textarea class="paste nbtext" rows={3} value={it.text} aria-label={`Result ${i + 1}, editable`} onInput={(e) => nb.update(it.id, { text: e.currentTarget.value })} />}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ResultsTool() {
  const ds = useDataset();
  const nb = useNotebook();
  const [tab, setTab] = useState('table1');
  return (
    <div>
      <PageHead crumbs={[{ label: 'Tools', href: '#/' }, { label: 'Report' }]} eyebrow="Report" title="Results to Text and Table 1"
        lede="Build the participants table from your data, with a first-draft paragraph, and gather the sentences and tables you add from every tool into one list to edit and copy into Word." />
      <div class="stack">
        <div><Seg wide value={tab} onChange={setTab} options={[{ value: 'table1', label: 'Table 1' }, { value: 'mine', label: `My results (${nb.items.length})` }]} /></div>
        {tab === 'table1' ? <><DataPanel /><Table1Panel ds={ds} /></> : <NotebookPanel />}
        <p class="small"><Icon name="check" /> Copying for Word puts real tables on the clipboard: paste into Word or Google Docs and the rows and columns arrive intact.</p>
      </div>
    </div>
  );
}
