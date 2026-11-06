/* "R and Python code for this analysis": the script, a copy button, and downloads of the script and
 * of the data the script reads. Scripts come from engine/codegen.js. */
import { useState } from 'preact/hooks';
import { scriptFor, datasetCsv, DATA_FILE } from '../engine/codegen.js';
import { Seg, CopyButton } from './core.jsx';
import { Disclose } from './results.jsx';
import { useDataset } from './data.jsx';

function save(name, text, type) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch { return false; }
}

function CodeBody({ spec }) {
  const ds = useDataset();
  const [lang, setLang] = useState('r');
  const sc = scriptFor(spec, lang);
  if (!sc) return <p class="small">Code export is not available for this analysis yet.</p>;
  return (
    <div class="stack" style="gap:12px">
      <Seg value={lang} onChange={setLang} options={[{ value: 'r', label: 'R' }, { value: 'py', label: 'Python' }]} />
      <pre class="code" tabIndex={0} aria-label={`${lang === 'r' ? 'R' : 'Python'} script`}><code>{sc.text}</code></pre>
      <div class="btn-row">
        <CopyButton text={sc.text} label="Copy code" />
        <button type="button" class="btn ghost small" onClick={() => save(sc.filename, sc.text, 'text/plain')}>Download {sc.filename}</button>
        {sc.usesData && ds ? <button type="button" class="btn ghost small" onClick={() => save(DATA_FILE, datasetCsv(ds), 'text/csv')}>Download the data ({DATA_FILE})</button> : null}
      </div>
      <p class="small">
        {sc.usesData ? <>Keep the script and <span class="mono">{DATA_FILE}</span> in one folder. </> : <>The numbers are written into the script. </>}
        {lang === 'py'
          ? 'Python scripts are run on the example data and compared with the app before every release.'
          : 'R scripts follow the same steps with base R and long-established packages; they are checked by reading, not yet by running.'}
        {sc.packages.length ? ` Packages: ${sc.packages.join(', ')}.` : ''}
      </p>
    </div>
  );
}

/** A collapsed panel with the R and Python code for an analysis spec. */
export function CodeExport({ spec, title = 'R and Python code for this analysis' }) {
  if (!spec) return null;
  return <Disclose title={title}><CodeBody spec={spec} /></Disclose>;
}
