/* Values a tool accepts from the address, so another tool can open it ready for a design:
 * #/tool/measures?tab=two&design=case-control. Each tool reads only the keys listed here and
 * falls back to its usual start for anything else. The design chooser's links are checked
 * against this list (tests/engine/designs.test.mjs). */
export const PRESETS = {
  measures: { tab: ['freq', 'two', 'pt', 'matched', 'impact'], design: ['cohort', 'case-control', 'cross'], kind: ['prop', 'rate'] },
  'sample-size': {
    design: ['prop', 'mean', 'diag', 'two-props', 'cc', 'cohort', 'two-means', 'paired-means', 'paired-props', 'one-mean', 'one-prop',
      'corr', 'anova', 'regression', 'survival', 'ni-props', 'ni-means'],
    cluster: ['none', 'icc', 'de'],
  },
  diagnostic: { tab: ['test', 'roc', 'compare'], design: ['cross', 'case-control'], kind: ['binary', 'paired', 'unpaired', 'summary'] },
  vaccines: { tab: ['ve', 'programme'], design: ['cohort', 'pt', 'case-control', 'tnd', 'matched', 'screening', 'published'] },
  stratified: { tab: ['strat', 'direct', 'indirect'], design: ['cohort', 'case-control', 'cross', 'pt'] },
  agreement: { tab: ['kappa', 'fleiss', 'icc', 'ba', 'alpha'] },
  regression: { kind: ['linear', 'logistic'] },
  tests: { tab: ['choose', 'run'] },
  outbreak: { tab: ['curve', 'attack', 'food', 'incubation'] },
  question: { tab: ['frame', 'finer', 'title'] },
  objectives: { tab: ['objectives', 'hypotheses', 'variables'] },
  survival: {},
  'meta-analysis': {},
  describe: {},
};

/** The preset value if the tool accepts it, otherwise the fallback. */
export const pick = (preset, tool, key, fallback) => {
  const v = preset?.[key];
  return v != null && PRESETS[tool]?.[key]?.includes(v) ? v : fallback;
};

/** The address that opens a tool with a preset. */
export const toolHref = (tool, preset = {}) => {
  const q = Object.entries(preset).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `#/tool/${tool}${q ? `?${q}` : ''}`;
};
