/* Adjusting p-values for multiple comparisons. Checked against statsmodels multipletests.
 *   bonferroni  Bonferroni
 *   holm        Holm (1979) step-down; controls the family-wise error rate, never worse than Bonferroni
 *   hochberg    Hochberg (1988) step-up; needs independent or positively dependent tests
 *   bh          Benjamini-Hochberg (1995) false discovery rate
 *   by          Benjamini-Yekutieli (2001) false discovery rate under any dependence
 */
export const ADJUST_METHODS = {
  bonferroni: 'Bonferroni', holm: 'Holm', hochberg: 'Hochberg', bh: 'Benjamini-Hochberg (FDR)', by: 'Benjamini-Yekutieli (FDR)', none: 'None',
};

export function adjust(p, method = 'holm') {
  const m = p.length;
  if (m === 0 || method === 'none') return p.slice();
  const order = p.map((v, i) => i).sort((a, b) => p[a] - p[b]);
  const out = new Array(m);
  if (method === 'bonferroni') return p.map((v) => Math.min(1, v * m));
  if (method === 'holm') {
    let run = 0;
    order.forEach((idx, r) => { run = Math.max(run, Math.min(1, (m - r) * p[idx])); out[idx] = run; });
    return out;
  }
  if (method === 'hochberg') {
    let run = 1;
    for (let r = m - 1; r >= 0; r--) { const idx = order[r]; run = Math.min(run, (m - r) * p[idx]); out[idx] = Math.min(1, run); }
    return out;
  }
  if (method === 'bh' || method === 'by') {
    const c = method === 'by' ? Array.from({ length: m }, (_, i) => 1 / (i + 1)).reduce((a, b) => a + b, 0) : 1;
    let run = 1;
    for (let r = m - 1; r >= 0; r--) { const idx = order[r]; run = Math.min(run, (p[idx] * m * c) / (r + 1)); out[idx] = Math.min(1, run); }
    return out;
  }
  throw new Error(`Unknown adjustment: ${method}`);
}
