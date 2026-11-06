/* R and Python scripts that reproduce an analysis from the app, so a result can be checked, extended
 * or archived with the thesis. Each tool passes a spec: what was run, on which columns, with which
 * options. The scripts read the data from a CSV file and print the same numbers the app shows.
 * Python scripts are run and compared with the app in tests/codegen; R scripts follow the same
 * steps with base R and long-established packages.
 */

export const DATA_FILE = 'research-app-data.csv';
const NA = ['', 'NA', 'na', 'N/A', 'n/a', '#N/A', 'NaN', 'nan', 'null', 'NULL', 'missing', '.', '-', '--', '?'];

/* ------------------------------------------------------------ literals --- */
const str = (s) => JSON.stringify(String(s)); // a valid string literal in both R and Python
const num = (x) => (Number.isFinite(x) ? String(x) : 'NA');
const pnum = (x) => (Number.isFinite(x) ? String(x) : 'float("nan")');
const rlit = (v, numeric) => (numeric ? String(v) : str(v));
const plit = (v, numeric) => (numeric ? String(v) : str(v));
const rvec = (xs, f = str) => `c(${xs.map(f).join(', ')})`;
const pvec = (xs, f = str) => `[${xs.map(f).join(', ')}]`;
const rcol = (n) => `d[[${str(n)}]]`;
const pcol = (n) => `d[${str(n)}]`;
const rname = (n) => `\`${String(n).replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``;
const pname = (n) => `Q(${str(n)})`;
const pretty = (s) => String(s).replace(/_/g, ' ');

function header(lang, title, { rPkgs = [], pyPkgs = [], pyImports = [], data = true, file = DATA_FILE }) {
  const date = new Date().toISOString().slice(0, 10);
  if (lang === 'r') {
    return [
      `# ${title}`,
      `# Written by #RESEARCH-APP (dr-abhishekpanda-cm.app) on ${date}. Read it before you rely on it.`,
      ...(data ? [`# Data: save the data as "${file}" (comma-separated, column names in the first row)`, '# in the same folder as this script; the app can download it for you.'] : []),
      ...(rPkgs.length ? [`# Packages, once: install.packages(${rvec(rPkgs)})`] : []),
      '',
      ...(data ? [`d <- read.csv(${str(file)}, check.names = FALSE, na.strings = ${rvec(NA)})`, ''] : []),
    ];
  }
  const pk = [...new Set(['numpy', 'scipy', ...(data ? ['pandas'] : []), ...pyPkgs])];
  return [
    `# ${title}`,
    `# Written by #RESEARCH-APP (dr-abhishekpanda-cm.app) on ${date}. Read it before you rely on it.`,
    ...(data ? [`# Data: save the data as "${file}" (comma-separated, column names in the first row)`, '# in the same folder as this script; the app can download it for you.'] : []),
    `# Packages, once: pip install ${pk.join(' ')}   (written for SciPy 1.18, statsmodels 0.15)`,
    '',
    'import numpy as np',
    ...(data ? ['import pandas as pd'] : []),
    'from scipy import stats',
    ...pyImports,
    '',
    ...(data ? [`d = pd.read_csv(${str(file)}, keep_default_na=False, na_values=${pvec(NA)})`, ''] : []),
  ];
}

/* --------------------------------------------------------- generators --- */
// Each returns { title, r: [lines], py: [lines], rPkgs?, pyPkgs?, pyImports?, data? }.

const G = {};

G.describe = (s) => {
  const t = s.qtype === 7 ? 7 : 6;
  const method = t === 6 ? 'weibull' : 'linear';
  const r = [`num_vars <- ${rvec(s.numeric)}`, `cat_vars <- ${rvec(s.categorical)}`];
  const py = [`num_vars = ${pvec(s.numeric)}`, `cat_vars = ${pvec(s.categorical)}`];
  if (!s.group) {
    r.push('for (v in num_vars) {', '  x <- d[[v]][!is.na(d[[v]])]', '  cat("\\n==", v, "==\\n")',
      `  print(round(c(n = length(x), mean = mean(x), sd = sd(x), median = median(x), q1 = unname(quantile(x, 0.25, type = ${t})),`,
      `                q3 = unname(quantile(x, 0.75, type = ${t})), min = min(x), max = max(x)), 3))`,
      '  if (length(x) >= 3 && length(x) <= 5000) print(shapiro.test(x))', '}',
      'for (v in cat_vars) {', '  cat("\\n==", v, "==\\n")', '  tab <- table(d[[v]])', '  print(cbind(n = tab, percent = round(100 * prop.table(tab), 1)))', '}');
    py.push('for v in num_vars:', '    x = d[v].dropna()',
      `    q1, q3 = np.quantile(x, [0.25, 0.75], method=${str(method)})  # ${t === 6 ? 'SPSS quartiles; "linear" for R and Excel' : 'R and Excel quartiles; "weibull" for SPSS'}`,
      '    print(f"== {v} ==")',
      '    print(f"n = {len(x)}, mean = {x.mean():.3f}, SD = {x.std(ddof=1):.3f}, median = {x.median():.3f}, Q1 = {q1:.3f}, Q3 = {q3:.3f}, min = {x.min()}, max = {x.max()}")',
      '    if 3 <= len(x) <= 5000:', '        sw = stats.shapiro(x)', '        print("Shapiro-Wilk:", sw)',
      'for v in cat_vars:', '    print(f"== {v} ==")', '    tab = d[v].value_counts()', '    print(pd.DataFrame({"n": tab, "percent": (100 * tab / tab.sum()).round(1)}))');
  } else {
    r.push(`g <- ${rcol(s.group)}`, 'for (v in num_vars) {', '  cat("\\n==", v, "by group ==\\n")',
      `  print(do.call(rbind, tapply(d[[v]], g, function(x) { x <- x[!is.na(x)]; round(c(n = length(x), mean = mean(x), sd = sd(x), median = median(x), q1 = unname(quantile(x, 0.25, type = ${t})), q3 = unname(quantile(x, 0.75, type = ${t}))), 3) })))`,
      '}', 'for (v in cat_vars) {', '  cat("\\n==", v, "by group (column percentages) ==\\n")', '  tab <- table(d[[v]], g)', '  print(tab)', '  print(round(100 * prop.table(tab, 2), 1))', '}');
    py.push(`g = ${str(s.group)}`, 'for v in num_vars:', '    print(f"== {v} by {g} ==")',
      `    print(d.groupby(g)[v].agg(["count", "mean", "std", "median", lambda x: np.quantile(x.dropna(), 0.25, method=${str(method)}), lambda x: np.quantile(x.dropna(), 0.75, method=${str(method)})]).round(3))`,
      'for v in cat_vars:', '    print(f"== {v} by {g} (column percentages) ==")', '    print(pd.crosstab(d[v], d[g]))', '    print((100 * pd.crosstab(d[v], d[g], normalize="columns")).round(1))');
  }
  return { title: 'Describe your data', r, py };
};

G.t2 = (s) => {
  const [a, b] = s.levels;
  const welch = !s.equalVar;
  return {
    title: `${welch ? "Welch's" : "Student's"} t-test: ${pretty(s.y)} by ${pretty(s.g)}`,
    r: [`a <- ${rcol(s.y)}[which(${rcol(s.g)} == ${rlit(a, s.gNumeric)})]`, `b <- ${rcol(s.y)}[which(${rcol(s.g)} == ${rlit(b, s.gNumeric)})]`,
      `sapply(list(${str(a)} = a, ${str(b)} = b), function(x) c(n = sum(!is.na(x)), mean = mean(x, na.rm = TRUE), sd = sd(x, na.rm = TRUE)))`,
      `res <- t.test(a, b, var.equal = ${welch ? 'FALSE' : 'TRUE'})   # difference = ${a} minus ${b}`, 'res'],
    py: [`a = d.loc[${pcol(s.g)} == ${plit(a, s.gNumeric)}, ${str(s.y)}].dropna()`, `b = d.loc[${pcol(s.g)} == ${plit(b, s.gNumeric)}, ${str(s.y)}].dropna()`,
      'print(pd.DataFrame({"n": [a.size, b.size], "mean": [a.mean(), b.mean()], "sd": [a.std(), b.std()]}, index=[' + `${str(a)}, ${str(b)}` + ']))',
      `res = stats.ttest_ind(a, b, equal_var=${welch ? 'False' : 'True'})  # difference = ${a} minus ${b}`,
      'print(res)', 'print("95% CI of the difference:", res.confidence_interval(0.95))'],
  };
};

G.t2s = (s) => {
  const [g1, g2] = s.groups;
  const welch = !s.equalVar;
  return {
    title: `${welch ? "Welch's" : "Student's"} t-test from summary figures`, data: false,
    r: [`n1 <- ${num(g1.n)}; m1 <- ${num(g1.mean)}; s1 <- ${num(g1.sd)}   # ${g1.label}`, `n2 <- ${num(g2.n)}; m2 <- ${num(g2.mean)}; s2 <- ${num(g2.sd)}   # ${g2.label}`,
      ...(welch ? ['se <- sqrt(s1^2 / n1 + s2^2 / n2)', 'df <- se^4 / ((s1^2 / n1)^2 / (n1 - 1) + (s2^2 / n2)^2 / (n2 - 1))']
        : ['sp <- sqrt(((n1 - 1) * s1^2 + (n2 - 1) * s2^2) / (n1 + n2 - 2))', 'se <- sp * sqrt(1 / n1 + 1 / n2)', 'df <- n1 + n2 - 2']),
      't <- (m1 - m2) / se', 'p <- 2 * pt(-abs(t), df)', 'ci <- (m1 - m2) + c(-1, 1) * qt(0.975, df) * se', 'res <- c(difference = m1 - m2, t = t, df = df, p = p, lower = ci[1], upper = ci[2])', 'res'],
    py: [`res = stats.ttest_ind_from_stats(${pnum(g1.mean)}, ${pnum(g1.sd)}, ${pnum(g1.n)}, ${pnum(g2.mean)}, ${pnum(g2.sd)}, ${pnum(g2.n)}, equal_var=${welch ? 'False' : 'True'})`, 'print(res)'],
  };
};

G.mw = (s) => {
  const [a, b] = s.levels;
  return {
    title: `Mann-Whitney U test: ${pretty(s.y)} by ${pretty(s.g)}`,
    r: [`a <- ${rcol(s.y)}[which(${rcol(s.g)} == ${rlit(a, s.gNumeric)})]`, `b <- ${rcol(s.y)}[which(${rcol(s.g)} == ${rlit(b, s.gNumeric)})]`,
      'sapply(list(a = a, b = b), function(x) quantile(x, c(0.25, 0.5, 0.75), na.rm = TRUE))',
      'res <- wilcox.test(a, b, conf.int = TRUE)   # exact when both groups are under 50 and there are no ties, as in the app', 'res'],
    py: [`a = d.loc[${pcol(s.g)} == ${plit(a, s.gNumeric)}, ${str(s.y)}].dropna()`, `b = d.loc[${pcol(s.g)} == ${plit(b, s.gNumeric)}, ${str(s.y)}].dropna()`,
      'ties = len(np.unique(np.r_[a, b])) < a.size + b.size',
      'exact = (not ties) and a.size < 50 and b.size < 50  # the rule R and the app use',
      'res = stats.mannwhitneyu(a, b, alternative="two-sided", method="exact" if exact else "asymptotic", use_continuity=True)', 'print(res)'],
  };
};

G.t1 = (s) => ({
  title: `One-sample t-test: ${pretty(s.y)} against ${s.mu}`,
  r: [`res <- t.test(${rcol(s.y)}, mu = ${num(s.mu)})`, 'res'],
  py: [`x = ${pcol(s.y)}.dropna()`, `res = stats.ttest_1samp(x, ${pnum(s.mu)})`, 'print(res)', 'print("95% CI of the mean:", res.confidence_interval(0.95))'],
});

const pyWilcoxon = (expr) => [
  `dlt = np.asarray(${expr})`, 'nz = dlt[dlt != 0]',
  'exact = len(nz) == len(dlt) and len(np.unique(np.abs(nz))) == len(nz) and len(nz) < 50  # as R: exact only without ties or zeros',
  'res = stats.wilcoxon(dlt, zero_method="wilcox", correction=True, method="exact" if exact else "asymptotic")', 'print(res)'];

G.w1 = (s) => ({
  title: `One-sample Wilcoxon signed-rank test: ${pretty(s.y)} against ${s.mu}`,
  r: [`res <- wilcox.test(${rcol(s.y)}, mu = ${num(s.mu)}, conf.int = TRUE)`, 'res'],
  py: [`x = ${pcol(s.y)}.dropna()`, ...pyWilcoxon(`x - ${pnum(s.mu)}`)],
});

G.tp = (s) => ({
  title: `Paired t-test: ${pretty(s.b)} minus ${pretty(s.a)}`,
  r: [`res <- t.test(${rcol(s.b)}, ${rcol(s.a)}, paired = TRUE)   # mean change = second minus first; incomplete pairs dropped`, 'res'],
  py: [`p = d[[${str(s.a)}, ${str(s.b)}]].dropna()`, `res = stats.ttest_rel(p[${str(s.b)}], p[${str(s.a)}])  # change = second minus first`, 'print(res)', 'print("95% CI of the mean change:", res.confidence_interval(0.95))'],
});

G.wp = (s) => ({
  title: `Wilcoxon signed-rank test (paired): ${pretty(s.b)} minus ${pretty(s.a)}`,
  r: [`p <- d[complete.cases(d[, ${rvec([s.a, s.b])}]), ]`, `res <- wilcox.test(p[[${str(s.b)}]], p[[${str(s.a)}]], paired = TRUE, conf.int = TRUE)`, 'res'],
  py: [`p = d[[${str(s.a)}, ${str(s.b)}]].dropna()`, ...pyWilcoxon(`p[${str(s.b)}] - p[${str(s.a)}]`)],
});

G.aov = (s) => ({
  title: `One-way ANOVA: ${pretty(s.y)} by ${pretty(s.g)}`, rPkgs: [], pyPkgs: ['pingouin'], pyImports: ['import pingouin as pg'],
  r: [`d$outcome <- ${rcol(s.y)}`, `d$group <- factor(${rcol(s.g)}, levels = ${rvec(s.levels)})`, 'fit <- aov(outcome ~ group, data = d)', 'summary(fit)                                      # classic ANOVA',
    'welch <- oneway.test(outcome ~ group, data = d, var.equal = FALSE)   # Welch\'s ANOVA', 'welch', 'TukeyHSD(fit)                                     # Tukey-Kramer comparisons'],
  py: [`levels = ${pvec(s.levels, (l) => plit(l, s.gNumeric))}`, `w = d[[${str(s.y)}, ${str(s.g)}]].dropna()`, `groups = [w.loc[w[${str(s.g)}] == lv, ${str(s.y)}] for lv in levels]`,
    'res = stats.f_oneway(*groups)  # classic ANOVA', 'print(res)', `welch = pg.welch_anova(data=w, dv=${str(s.y)}, between=${str(s.g)})`, 'print(welch)',
    'print(stats.tukey_hsd(*groups))', `print(pg.pairwise_gameshowell(data=w, dv=${str(s.y)}, between=${str(s.g)}))`],
});

G.kw = (s) => ({
  title: `Kruskal-Wallis test: ${pretty(s.y)} by ${pretty(s.g)}`, pyPkgs: ['scikit-posthocs'], pyImports: ['import scikit_posthocs as sp'],
  r: [`d$outcome <- ${rcol(s.y)}`, `d$group <- factor(${rcol(s.g)})`, 'res <- kruskal.test(outcome ~ group, data = d)', 'res',
    "# Dunn's comparisons with the tie correction (as dunn.test and FSA compute them)",
    'w <- droplevels(d[!is.na(d$outcome) & !is.na(d$group), c("outcome", "group")])', 'N <- nrow(w); w$r <- rank(w$outcome); tt <- table(w$outcome)',
    'mr <- tapply(w$r, w$group, mean); n <- tapply(w$r, w$group, length); s2 <- N * (N + 1) / 12 - sum(tt^3 - tt) / (12 * (N - 1))',
    'pairs <- combn(levels(w$group), 2)', 'z <- apply(pairs, 2, function(q) (mr[q[1]] - mr[q[2]]) / sqrt(s2 * (1 / n[q[1]] + 1 / n[q[2]])))',
    `dunn <- data.frame(comparison = paste(pairs[1, ], "vs", pairs[2, ]), z = z, p = 2 * pnorm(-abs(z)), p.adjusted = p.adjust(2 * pnorm(-abs(z)), method = ${str({ holm: 'holm', bonferroni: 'bonferroni', bh: 'BH', hochberg: 'hochberg', by: 'BY' }[s.adjust || 'holm'] || 'holm')}))`, 'dunn'],
  py: [`w = d[[${str(s.y)}, ${str(s.g)}]].dropna()`, `groups = [x for _, x in w.groupby(${str(s.g)})[${str(s.y)}]]`, 'res = stats.kruskal(*groups)', 'print(res)',
    `print(sp.posthoc_dunn(w, val_col=${str(s.y)}, group_col=${str(s.g)}, p_adjust=${str(s.adjust === 'bh' ? 'fdr_bh' : s.adjust || 'holm')}))`],
});

G.fr = (s) => ({
  title: `Friedman test: ${s.cols.map(pretty).join(', ')}`,
  r: [`w <- d[complete.cases(d[, ${rvec(s.cols)}]), ${rvec(s.cols)}]`, 'res <- friedman.test(as.matrix(w))', 'res'],
  py: [`w = d[${pvec(s.cols)}].dropna()`, 'res = stats.friedmanchisquare(*[w[c] for c in w.columns])', 'print(res)'],
});

G.rm = (s) => ({
  title: `Repeated-measures ANOVA: ${s.cols.map(pretty).join(', ')}`, rPkgs: ['afex'], pyPkgs: ['pingouin'], pyImports: ['import pingouin as pg'],
  r: [`w <- d[complete.cases(d[, ${rvec(s.cols)}]), ${rvec(s.cols)}]`,
    'long <- data.frame(id = factor(rep(seq_len(nrow(w)), times = ncol(w))), time = factor(rep(names(w), each = nrow(w)), levels = names(w)), y = unlist(w, use.names = FALSE))',
    'fit <- aov(y ~ time + Error(id / time), data = long)', 'summary(fit)   # uncorrected F', 'rm <- afex::aov_ez("id", "y", long, within = "time")   # Greenhouse-Geisser corrected', 'rm'],
  py: [`w = d[${pvec(s.cols)}].dropna().reset_index(drop=True)`, 'long = w.reset_index().melt(id_vars="index", var_name="time", value_name="y")',
    'aov_rm = pg.rm_anova(data=long, dv="y", within="time", subject="index", correction=True)', 'print(aov_rm)'],
});

G.chi = (s) => ({
  title: `Chi-square test: ${pretty(s.r)} by ${pretty(s.c)}`,
  r: [`tab <- table(${rcol(s.r)}, ${rcol(s.c)})`, 'tab', 'res <- chisq.test(tab)   # Yates\' correction for a 2 x 2 table', 'res', 'res$expected',
    'fisher.test(tab)          # exact test; for a large table add simulate.p.value = TRUE, B = 1e5'],
  py: [`tab = pd.crosstab(${pcol(s.r)}, ${pcol(s.c)})`, 'print(tab)', 'res = stats.chi2_contingency(tab)  # Yates\' correction for a 2 x 2 table', 'print(res)',
    'if tab.shape == (2, 2):', '    print("Fisher\'s exact:", stats.fisher_exact(tab))'],
});

G.chiT = (s) => ({
  title: 'Chi-square test from a table of counts', data: false,
  r: [`tab <- matrix(${rvec(s.table.flat(), num)}, nrow = ${s.table.length}, byrow = TRUE,`, `              dimnames = list(${rvec(s.rows)}, ${rvec(s.cols)}))`, 'tab',
    'res <- chisq.test(tab)   # Yates\' correction for a 2 x 2 table', 'res', 'res$expected', 'fisher.test(tab)'],
  py: [`tab = np.array(${JSON.stringify(s.table)})  # rows: ${s.rows.join(', ')}; columns: ${s.cols.join(', ')}`, 'res = stats.chi2_contingency(tab)  # Yates\' correction for a 2 x 2 table', 'print(res)',
    'if tab.shape == (2, 2):', '    print("Fisher\'s exact:", stats.fisher_exact(tab))'],
});

G.mcn = (s) => ({
  title: "McNemar's test (paired proportions)", data: false, pyPkgs: ['statsmodels'], pyImports: ['from statsmodels.stats.contingency_tables import mcnemar'],
  r: [`tab <- matrix(c(${s.a}, ${s.b}, ${s.c}, ${s.d}), nrow = 2, byrow = TRUE)   # rows: first, columns: second`, 'res <- mcnemar.test(tab)          # chi-square with continuity correction', 'res',
    `exact <- binom.test(${s.b}, ${s.b + s.c})   # exact test on the ${s.b + s.c} discordant pairs`, 'exact'],
  py: [`tab = np.array([[${s.a}, ${s.b}], [${s.c}, ${s.d}]])  # rows: first, columns: second`, 'exact = mcnemar(tab, exact=True)', 'asym = mcnemar(tab, exact=False, correction=True)', 'print("exact:", exact)', 'print("chi-square:", asym)'],
});

G.cq = (s) => ({
  title: `Cochran's Q test: ${s.cols.map(pretty).join(', ')}`, pyPkgs: ['statsmodels'], pyImports: ['from statsmodels.stats.contingency_tables import cochrans_q'],
  r: [`w <- d[complete.cases(d[, ${rvec(s.cols)}]), ${rvec(s.cols)}]`, `x <- 1 * as.matrix(w == ${str(s.positive)})`,
    'k <- ncol(x); Cj <- colSums(x); Ri <- rowSums(x); N <- sum(x)', 'Q <- (k - 1) * (k * sum(Cj^2) - N^2) / (k * N - sum(Ri^2))',
    'res <- c(Q = Q, df = k - 1, p = pchisq(Q, df = k - 1, lower.tail = FALSE))', 'res'],
  py: [`w = d[${pvec(s.cols)}].dropna()`, `x = (w == ${str(s.positive)}).astype(int)`, 'res = cochrans_q(x)', 'print(res)'],
});

G.p1 = (s) => ({
  title: 'One proportion: exact binomial test', data: false,
  r: [`res <- binom.test(${s.x}, ${s.n}, p = ${num(s.p0)})   # exact test and Clopper-Pearson CI`, 'res', `wilson <- prop.test(${s.x}, ${s.n}, correct = FALSE)$conf.int   # Wilson score CI, as the app reports`, 'wilson'],
  py: [`res = stats.binomtest(${s.x}, ${s.n}, ${pnum(s.p0)})`, 'print(res)', 'print("Wilson 95% CI:", res.proportion_ci(method="wilson"))'],
});

G.p2 = (s) => ({
  title: 'Two proportions: difference with 95% CI', data: false, pyPkgs: ['statsmodels'], pyImports: ['from statsmodels.stats.proportion import confint_proportions_2indep'],
  r: [`x <- c(${s.x1}, ${s.x2}); n <- c(${s.n1}, ${s.n2})`, 'p <- x / n', 'wilson <- function(x, n, z = qnorm(0.975)) { p <- x / n; (p + z^2 / (2 * n) + c(-1, 1) * z * sqrt(p * (1 - p) / n + z^2 / (4 * n^2))) / (1 + z^2 / n) }',
    'w1 <- wilson(x[1], n[1]); w2 <- wilson(x[2], n[2])', 'diff <- p[1] - p[2]',
    'ci <- c(difference = diff, lower = diff - sqrt((p[1] - w1[1])^2 + (w2[2] - p[2])^2), upper = diff + sqrt((w1[2] - p[1])^2 + (p[2] - w2[1])^2))   # Newcombe hybrid score CI', 'ci',
    'res <- chisq.test(rbind(x, n - x))   # with Yates\' correction; fisher.test(rbind(x, n - x)) when an expected count is below 5', 'res'],
  py: [`ci = confint_proportions_2indep(${s.x1}, ${s.n1}, ${s.x2}, ${s.n2}, method="newcomb", compare="diff")  # Newcombe hybrid score CI`, `print("difference:", ${s.x1} / ${s.n1} - ${s.x2} / ${s.n2}, "95% CI:", ci)`,
    `res = stats.chi2_contingency([[${s.x1}, ${s.n1 - s.x1}], [${s.x2}, ${s.n2 - s.x2}]])  # Yates' correction`, 'print(res)'],
});

G.cor = (s) => {
  const fn = { pearson: 'pearsonr', spearman: 'spearmanr', kendall: 'kendalltau' }[s.method];
  return {
    title: `${s.method[0].toUpperCase()}${s.method.slice(1)} correlation: ${pretty(s.x)} and ${pretty(s.y)}`,
    r: [`res <- cor.test(${rcol(s.x)}, ${rcol(s.y)}, method = ${str(s.method)}${s.method === 'spearman' ? ', exact = FALSE)   # t approximation, as the app' : ')'}`, 'res'],
    py: [`p = d[[${str(s.x)}, ${str(s.y)}]].dropna()`,
      ...(s.method === 'kendall' ? [`ties = p[${str(s.x)}].duplicated().any() or p[${str(s.y)}].duplicated().any()`, `res = stats.kendalltau(p[${str(s.x)}], p[${str(s.y)}], method="exact" if (not ties and len(p) <= 50) else "asymptotic")`]
        : [`res = stats.${fn}(p[${str(s.x)}], p[${str(s.y)}])`]),
      'print(res)', ...(s.method === 'pearson' ? ['print("95% CI:", res.confidence_interval(0.95))'] : [])],
  };
};

G.adj = (s) => {
  const rm = { holm: 'holm', bonferroni: 'bonferroni', hochberg: 'hochberg', bh: 'BH', by: 'BY' }[s.method];
  const pm = { holm: 'holm', bonferroni: 'bonferroni', hochberg: 'simes-hochberg', bh: 'fdr_bh', by: 'fdr_by' }[s.method];
  return {
    title: 'Adjusted p-values', data: false, pyPkgs: ['statsmodels'], pyImports: ['from statsmodels.stats.multitest import multipletests'],
    r: [`p <- ${rvec(s.items.map((x) => x.p), num)}`, `names(p) <- ${rvec(s.items.map((x) => x.label))}`, `adjusted <- p.adjust(p, method = ${str(rm)})`, 'round(adjusted, 4)'],
    py: [`p = ${pvec(s.items.map((x) => x.p), pnum)}`, `labels = ${pvec(s.items.map((x) => x.label))}`, `reject, adjusted, _, _ = multipletests(p, method=${str(pm)})`, 'print(dict(zip(labels, np.round(adjusted, 4))))'],
  };
};

/* ---------------------------------------------------------- regression --- */

function rTerms(s) {
  const pre = s.terms.filter((t) => t.type === 'categorical').map((t) => `${rcol(t.name)} <- relevel(factor(${rcol(t.name)}), ref = ${str(t.ref)})`);
  const rhs = s.interaction ? [...s.terms.filter((t) => !s.interaction.includes(t.name)).map((t) => rname(t.name)), `${rname(s.interaction[0])} * ${rname(s.interaction[1])}`] : s.terms.map((t) => rname(t.name));
  return { pre, rhs: rhs.join(' + ') };
}
function pyTerms(s) {
  const term = (t) => (t.type === 'categorical' ? `C(${pname(t.name)}, Treatment(reference=${plit(t.ref, t.numeric)}))` : pname(t.name));
  const byName = Object.fromEntries(s.terms.map((t) => [t.name, term(t)]));
  const rhs = s.interaction ? [...s.terms.filter((t) => !s.interaction.includes(t.name)).map(term), `${byName[s.interaction[0]]} * ${byName[s.interaction[1]]}`] : s.terms.map(term);
  return rhs.join(' + ');
}

G.lm = (s) => {
  const { pre, rhs } = rTerms(s);
  return {
    title: `Linear regression: ${pretty(s.y)}`, rPkgs: ['car'], pyPkgs: ['statsmodels'], pyImports: ['import statsmodels.formula.api as smf'],
    r: [...pre, `m <- lm(${rname(s.y)} ~ ${rhs}, data = d)`, 'summary(m)', 'confint(m)', 'drop1(m, test = "F")   # each term, adjusted for the others', 'car::vif(m)            # collinearity', 'plot(m)                # residual checks'],
    py: [`m = smf.ols(${str(`${pname(s.y)} ~ ${pyTerms(s)}`)}, data=d).fit()`, 'print(m.summary())'],
  };
};

G.logit = (s) => {
  const { pre, rhs } = rTerms(s);
  return {
    title: `Logistic regression: ${pretty(s.y)} = ${s.event}`, rPkgs: ['pROC'], pyPkgs: ['statsmodels'], pyImports: ['import statsmodels.formula.api as smf'],
    r: [...pre, `d$outcome01 <- ifelse(is.na(${rcol(s.y)}), NA, as.integer(${rcol(s.y)} == ${rlit(s.event, s.yNumeric)}))`,
      `m <- glm(outcome01 ~ ${rhs}, family = binomial, data = d)`, 'summary(m)', 'exp(cbind(OR = coef(m), confint.default(m)))   # odds ratios with Wald CIs, as the app reports',
      'drop1(m, test = "LRT")                          # each term, adjusted for the others',
      '# Hosmer-Lemeshow test on deciles of fitted risk (as ResourceSelection::hoslem.test)',
      'y <- m$y; fp <- fitted(m); grp <- cut(fp, breaks = unique(quantile(fp, seq(0, 1, 0.1))), include.lowest = TRUE)',
      'o1 <- tapply(y, grp, sum); e1 <- tapply(fp, grp, sum); ng <- tapply(y, grp, length)',
      'hl <- sum((o1 - e1)^2 / e1 + ((ng - o1) - (ng - e1))^2 / (ng - e1))', 'c(chi2 = hl, df = length(ng) - 2, p = pchisq(hl, length(ng) - 2, lower.tail = FALSE))',
      'pROC::ci.auc(pROC::roc(m$y, fitted(m), quiet = TRUE))   # ROC area with DeLong CI'],
    py: [`d["outcome01"] = (${pcol(s.y)} == ${plit(s.event, s.yNumeric)}).astype(float).where(${pcol(s.y)}.notna())`,
      `m = smf.logit(${str(`outcome01 ~ ${pyTerms(s)}`)}, data=d).fit(disp=0)`, 'print(m.summary())',
      'print(pd.DataFrame({"OR": np.exp(m.params), "lower": np.exp(m.conf_int()[0]), "upper": np.exp(m.conf_int()[1])}).round(3))'],
  };
};

/* ------------------------------------------------------------ survival --- */

G.surv = (s) => {
  const ev = `${rcol(s.event)} == ${rlit(s.eventLevel, s.eventNumeric)}`;
  const covs = s.covars || [];
  const pre = covs.filter((t) => t.type === 'categorical').map((t) => `${rcol(t.name)} <- relevel(factor(${rcol(t.name)}), ref = ${str(t.ref)})`);
  const gPre = s.group ? [`${rcol(s.group)} <- relevel(factor(${rcol(s.group)}), ref = ${str(s.groupLevels[0])})`] : [];
  const coxTerms = [...(s.group ? [rname(s.group)] : []), ...covs.map((t) => rname(t.name))];
  const times = s.times && s.times.length ? s.times : [];
  // Python: dummy columns for categorical terms.
  const pyCat = [...(s.group ? [{ name: s.group, ref: s.groupLevels[0], levels: s.groupLevels, numeric: s.groupNumeric }] : []), ...covs.filter((t) => t.type === 'categorical')];
  const pyNum = covs.filter((t) => t.type !== 'categorical');
  const used = [s.time, s.event, ...(s.group ? [s.group] : []), ...covs.map((t) => t.name)];
  return {
    title: `Survival analysis: ${pretty(s.time)}, event ${pretty(s.event)} = ${s.eventLevel}`, rPkgs: ['survival'], pyPkgs: ['lifelines'],
    pyImports: ['from lifelines import KaplanMeierFitter, CoxPHFitter', 'from lifelines.statistics import multivariate_logrank_test'],
    r: ['library(survival)', `d$status <- as.integer(${ev})`, ...gPre,
      `fit <- survfit(Surv(${rname(s.time)}, status) ~ ${s.group ? rname(s.group) : '1'}, data = d, conf.type = "log-log")`,
      'print(fit)                                  # median survival with 95% CI',
      ...(times.length ? [`summary(fit, times = ${rvec(times, num)})   # survival at chosen times`] : []),
      'plot(fit, conf.int = FALSE, mark.time = TRUE, xlab = ' + str(pretty(s.time)) + ', ylab = "Event-free")',
      ...(s.group ? [`lr <- survdiff(Surv(${rname(s.time)}, status) ~ ${rname(s.group)}, data = d)   # log-rank test`, 'lr'] : []),
      ...(coxTerms.length ? [...pre, `cox <- coxph(Surv(${rname(s.time)}, status) ~ ${coxTerms.join(' + ')}, data = d, ties = "efron")`, 'summary(cox)                                # hazard ratios with 95% CIs', 'cox.zph(cox)                                # proportional-hazards check'] : [])],
    py: [`s = d.dropna(subset=${pvec(used)}).copy()`, `s["status"] = (s[${str(s.event)}] == ${plit(s.eventLevel, s.eventNumeric)}).astype(int)`,
      ...(s.group ? [`for level, sub in s.groupby(${str(s.group)}):`, `    kmf = KaplanMeierFitter().fit(sub[${str(s.time)}], sub["status"], label=str(level))`, '    print(level, "median:", kmf.median_survival_time_)',
        ...(times.length ? [`    print(kmf.survival_function_at_times(${pvec(times, pnum)}))`] : []),
        `lr = multivariate_logrank_test(s[${str(s.time)}], s[${str(s.group)}], s["status"])`, 'print(lr.summary)']
        : [`kmf = KaplanMeierFitter().fit(s[${str(s.time)}], s["status"])`, 'print("median:", kmf.median_survival_time_)', ...(times.length ? [`print(kmf.survival_function_at_times(${pvec(times, pnum)}))`] : [])]),
      ...(coxTerms.length ? [
        `x = s[[${str(s.time)}, "status"${pyNum.map((t) => `, ${str(t.name)}`).join('')}]].copy()`,
        ...pyCat.flatMap((t) => (t.levels || []).filter((l) => String(l) !== String(t.ref)).map((l) => `x[${str(`${t.name}_${l}`)}] = (s[${str(t.name)}] == ${plit(l, t.numeric)}).astype(int)`)),
        `cph = CoxPHFitter().fit(x, duration_col=${str(s.time)}, event_col="status")  # Efron ties`, 'cph.print_summary()'] : [])],
  };
};

/* ----------------------------------------------------------- agreement --- */

G.kappa = (s) => {
  const k = s.levels.length;
  const wr = s.weights === 'linear' ? `, w = abs(outer(1:${k}, 1:${k}, "-"))` : '';
  return {
    title: `${s.weights === 'none' ? "Cohen's" : s.weights === 'linear' ? 'Linear-weighted' : 'Quadratic-weighted'} kappa: ${s.table ? 'from a table of counts' : `${pretty(s.a)} and ${pretty(s.b)}`}`,
    rPkgs: ['psych'], pyPkgs: ['statsmodels'], pyImports: ['from statsmodels.stats.inter_rater import cohens_kappa'], data: !s.table,
    r: [...(s.table ? [`tab <- matrix(${rvec(s.table.flat(), num)}, nrow = ${k}, byrow = TRUE, dimnames = list(${rvec(s.levels)}, ${rvec(s.levels)}))`]
      : [`lev <- ${rvec(s.levels)}   # category order (it matters for weighted kappa)`, `tab <- table(factor(${rcol(s.a)}, levels = lev), factor(${rcol(s.b)}, levels = lev))`]),
    'tab', `res <- psych::cohen.kappa(tab${wr})   # ${s.weights === 'none' ? 'unweighted kappa (first row)' : `weighted kappa (second row)${s.weights === 'linear' ? ' with linear weights' : ', quadratic weights by default'}`}, with 95% CIs`, 'res'],
    py: [...(s.table ? [`tab = np.array(${JSON.stringify(s.table)})  # categories: ${s.levels.join(', ')}`]
      : [`lev = ${pvec(s.levels)}  # category order (it matters for weighted kappa)`, `tab = pd.crosstab(pd.Categorical(${pcol(s.a)}, categories=lev), pd.Categorical(${pcol(s.b)}, categories=lev), dropna=False).to_numpy()`]),
    'print(tab)', `res = cohens_kappa(tab${s.weights === 'none' ? '' : `, wt=${str(s.weights)}`})`, 'print(res)'],
  };
};

G.fleiss = (s) => ({
  title: `Fleiss' kappa: ${s.cols.map(pretty).join(', ')}`, pyPkgs: ['statsmodels'], pyImports: ['from statsmodels.stats.inter_rater import fleiss_kappa, aggregate_raters'],
  r: [`w <- d[complete.cases(d[, ${rvec(s.cols)}]), ${rvec(s.cols)}]`, 'cats <- sort(unique(unlist(lapply(w, as.character))))',
    'counts <- t(apply(w, 1, function(r) table(factor(as.character(r), levels = cats))))   # raters choosing each category, per subject',
    'fleiss <- function(x) { N <- nrow(x); n <- sum(x[1, ]); pj <- colSums(x) / (N * n); Pi <- (rowSums(x^2) - n) / (n * (n - 1)); Pe <- sum(pj^2); (mean(Pi) - Pe) / (1 - Pe) }',
    'kappa <- fleiss(counts)', 'N <- nrow(counts); n <- sum(counts[1, ]); pj <- colSums(counts) / (N * n); qj <- 1 - pj',
    'se0 <- sqrt(2 / (sum(pj * qj)^2 * N * n * (n - 1)) * (sum(pj * qj)^2 - sum(pj * qj * (qj - pj))))   # Fleiss, Nee and Landis (1979)',
    'c(kappa = kappa, z = kappa / se0, p = 2 * pnorm(-abs(kappa / se0)))', 'set.seed(20261031)',
    'boot <- replicate(2000, fleiss(counts[sample(N, replace = TRUE), , drop = FALSE]))', 'quantile(boot, c(0.025, 0.975), na.rm = TRUE)   # percentile bootstrap 95% CI'],
  py: [`w = d[${pvec(s.cols)}].dropna()`, 'counts, cats = aggregate_raters(w.astype(str).to_numpy())', 'kappa = fleiss_kappa(counts)', 'print("Fleiss\' kappa:", kappa)',
    'rng = np.random.default_rng(20261031)', 'boot = [fleiss_kappa(counts[rng.integers(0, len(counts), len(counts))]) for _ in range(2000)]', 'print("95% bootstrap CI:", np.quantile(boot, [0.025, 0.975]))'],
});

// pingouin names the forms after McGraw and Wong (older versions used ICC1 ... ICC3k).
const ICC_PG = { ICC1: ['ICC(1,1)', 'ICC1'], ICC2: ['ICC(A,1)', 'ICC2'], ICC3: ['ICC(C,1)', 'ICC3'], ICC1k: ['ICC(1,k)', 'ICC1k'], ICC2k: ['ICC(A,k)', 'ICC2k'], ICC3k: ['ICC(C,k)', 'ICC3k'] };
G.icc = (s) => {
  const id = s.form;
  const model = id.startsWith('ICC1') ? 'oneway' : 'twoway';
  const type = id.startsWith('ICC3') ? 'consistency' : 'agreement';
  const unit = id.endsWith('k') ? 'average' : 'single';
  return {
    title: `Intraclass correlation: ${s.cols.map(pretty).join(', ')}`, rPkgs: ['psych'], pyPkgs: ['pingouin'], pyImports: ['import pingouin as pg'],
    r: [`w <- d[complete.cases(d[, ${rvec(s.cols)}]), ${rvec(s.cols)}]`, 'res <- psych::ICC(w, lmer = FALSE)   # all six forms (Shrout and Fleiss)', 'res',
      `res$results[res$results$type == ${str(id)}, ]   # the form you chose: ${model === 'oneway' ? 'one-way' : 'two-way'}, ${type === 'agreement' ? 'absolute agreement' : 'consistency'}, ${unit === 'single' ? 'single rater' : 'mean of raters'}`],
    py: [`w = d[${pvec(s.cols)}].dropna().reset_index(drop=True)`, 'long = w.reset_index().melt(id_vars="index", var_name="rater", value_name="score")',
      'icc = pg.intraclass_corr(data=long, targets="index", raters="rater", ratings="score")', 'print(icc)', `row = icc[icc["Type"].isin(${pvec(ICC_PG[id])})]  # the form you chose`, 'print(row)'],
  };
};

G.ba = (s) => {
  const rd = s.scale === 'percent' ? 'diff <- 100 * (a - b) / ((a + b) / 2)' : s.scale === 'ratio' ? 'diff <- log(a) - log(b)' : 'diff <- a - b';
  const pd = s.scale === 'percent' ? 'diff = 100 * (a - b) / ((a + b) / 2)' : s.scale === 'ratio' ? 'diff = np.log(a) - np.log(b)' : 'diff = a - b';
  return {
    title: `Bland-Altman: ${pretty(s.a)} against ${pretty(s.b)}`, pyPkgs: ['statsmodels'], pyImports: ['import statsmodels.api as sm'],
    r: [`p <- d[complete.cases(d[, ${rvec([s.a, s.b])}]), ${rvec([s.a, s.b])}]`, 'a <- p[[1]]; b <- p[[2]]', rd, 'avg <- (a + b) / 2', 'n <- length(diff); bias <- mean(diff); s <- sd(diff)',
      'loa <- bias + c(-1, 1) * qnorm(0.975) * s', 'tq <- qt(0.975, n - 1); se_loa <- sqrt(3 * s^2 / n)',
      'out <- rbind(bias = bias + c(0, -1, 1) * c(1, tq, tq) * c(1, s / sqrt(n), s / sqrt(n)), lower = loa[1] + c(0, -1, 1) * tq * se_loa, upper = loa[2] + c(0, -1, 1) * tq * se_loa)',
      'colnames(out) <- c("estimate", "lower 95% CI", "upper 95% CI")', s.scale === 'ratio' ? 'exp(out)   # as ratios a / b' : 'out',
      'summary(lm(diff ~ avg))   # proportional bias: the slope', 'plot(avg, diff, xlab = "Mean of the two methods", ylab = "Difference"); abline(h = c(bias, loa), lty = c(1, 2, 2))'],
    py: [`p = d[[${str(s.a)}, ${str(s.b)}]].dropna()`, `a, b = p[${str(s.a)}].to_numpy(), p[${str(s.b)}].to_numpy()`, pd, 'avg = (a + b) / 2', 'n = diff.size; bias = diff.mean(); sd = diff.std(ddof=1)',
      'loa = bias + np.array([-1, 1]) * stats.norm.isf(0.025) * sd', 'tq = stats.t.isf(0.025, n - 1); se_loa = np.sqrt(3 * sd**2 / n)',
      'print("bias:", bias, "95% CI:", bias + np.array([-1, 1]) * tq * sd / np.sqrt(n))', 'print("limits of agreement:", loa)',
      'print("CI of lower limit:", loa[0] + np.array([-1, 1]) * tq * se_loa, "CI of upper limit:", loa[1] + np.array([-1, 1]) * tq * se_loa)',
      ...(s.scale === 'ratio' ? ['print("as ratios a / b: bias", np.exp(bias), "limits", np.exp(loa))'] : []),
      'slope = sm.OLS(diff, sm.add_constant(avg)).fit()', 'print("proportional bias: slope", slope.params[1], "p", slope.pvalues[1])'],
  };
};

G.alpha = (s) => ({
  title: `Cronbach's alpha: ${s.cols.map(pretty).join(', ')}`, rPkgs: ['psych'], pyPkgs: ['pingouin'], pyImports: ['import pingouin as pg'],
  r: [`w <- d[complete.cases(d[, ${rvec(s.cols)}]), ${rvec(s.cols)}]`, 'res <- psych::alpha(w)   # alpha with CI, item-rest correlations (r.drop) and alpha if an item is dropped', 'res'],
  py: [`w = d[${pvec(s.cols)}].dropna()`, 'alpha, ci = pg.cronbach_alpha(data=w)', 'print("alpha:", alpha, "95% CI (Feldt):", ci)', 'total = w.sum(axis=1)',
    'print(pd.DataFrame({"item-rest r": {c: np.corrcoef(w[c], total - w[c])[0, 1] for c in w.columns}, "alpha if deleted": {c: pg.cronbach_alpha(data=w.drop(columns=c))[0] for c in w.columns}}).round(3))'],
});

/* -------------------------------------------------------- meta-analysis --- */

G.meta = (s) => {
  const rows = s.studies;
  const isR = ['OR', 'RR', 'ratio'].includes(s.measure);
  const cols = { binary: ['e1', 'n1', 'e2', 'n2'], continuous: ['m1', 'sd1', 'n1', 'm2', 'sd2', 'n2'], proportion: ['events', 'total'], reported: ['est', 'lower', 'upper'] }[s.type];
  const rData = ['dat <- data.frame(', `  study = ${rvec(rows.map((r) => r.name))},`, ...cols.map((c, j) => `  ${c} = ${rvec(rows.map((r) => r.vals[j]), num)},`), ...(s.subgroups ? [`  subgroup = ${rvec(rows.map((r) => r.sub || 'Not given'))},`] : []), '  stringsAsFactors = FALSE)'];
  const pData = ['dat = pd.DataFrame({', `    "study": ${pvec(rows.map((r) => r.name))},`, ...cols.map((c, j) => `    "${c}": ${pvec(rows.map((r) => r.vals[j]), pnum)},`), ...(s.subgroups ? [`    "subgroup": ${pvec(rows.map((r) => r.sub || 'Not given'))},`] : []), '})'];
  let rEff, pEff;
  if (s.type === 'binary' && s.measure !== 'RD') {
    const yR = s.measure === 'OR' ? 'log(a * dd / (b * cc))' : 'log((a / (a + b)) / (cc / (cc + dd)))';
    const vR = s.measure === 'OR' ? '1 / a + 1 / b + 1 / cc + 1 / dd' : '1 / a - 1 / (a + b) + 1 / cc - 1 / (cc + dd)';
    rEff = ['a <- dat$e1; b <- dat$n1 - dat$e1; cc <- dat$e2; dd <- dat$n2 - dat$e2',
      'dat <- dat[!((a == 0 & cc == 0) | (b == 0 & dd == 0)), ]   # no events (or all events) in both groups: no information on a ratio',
      'a <- dat$e1; b <- dat$n1 - dat$e1; cc <- dat$e2; dd <- dat$n2 - dat$e2', 'z <- a == 0 | b == 0 | cc == 0 | dd == 0   # 0.5 added to every cell of a study with a zero cell',
      'a[z] <- a[z] + 0.5; b[z] <- b[z] + 0.5; cc[z] <- cc[z] + 0.5; dd[z] <- dd[z] + 0.5', `dat$yi <- ${yR}`, `dat$vi <- ${vR}`];
    pEff = ['a, b, c, e = dat.e1, dat.n1 - dat.e1, dat.e2, dat.n2 - dat.e2', 'dat = dat[~(((a == 0) & (c == 0)) | ((b == 0) & (e == 0)))].reset_index(drop=True)  # no information on a ratio',
      'a, b, c, e = (dat.e1).astype(float), (dat.n1 - dat.e1).astype(float), (dat.e2).astype(float), (dat.n2 - dat.e2).astype(float)',
      'z = (a == 0) | (b == 0) | (c == 0) | (e == 0)  # 0.5 added to every cell of a study with a zero cell', 'a[z] += 0.5; b[z] += 0.5; c[z] += 0.5; e[z] += 0.5',
      s.measure === 'OR' ? 'dat["yi"] = np.log(a * e / (b * c)); dat["vi"] = 1 / a + 1 / b + 1 / c + 1 / e' : 'dat["yi"] = np.log((a / (a + b)) / (c / (c + e))); dat["vi"] = 1 / a - 1 / (a + b) + 1 / c - 1 / (c + e)'];
  } else if (s.type === 'binary') {
    rEff = ['p1 <- dat$e1 / dat$n1; p2 <- dat$e2 / dat$n2', 'dat$yi <- p1 - p2', 'dat$vi <- p1 * (1 - p1) / dat$n1 + p2 * (1 - p2) / dat$n2',
      'z <- dat$vi == 0   # 0.5 added to every cell only where the variance would be 0', 'q1 <- (dat$e1 + 0.5) / (dat$n1 + 1); q2 <- (dat$e2 + 0.5) / (dat$n2 + 1)',
      'dat$yi[z] <- (q1 - q2)[z]; dat$vi[z] <- (q1 * (1 - q1) / (dat$n1 + 1) + q2 * (1 - q2) / (dat$n2 + 1))[z]'];
    pEff = ['p1, p2 = dat.e1 / dat.n1, dat.e2 / dat.n2', 'dat["yi"] = p1 - p2; dat["vi"] = p1 * (1 - p1) / dat.n1 + p2 * (1 - p2) / dat.n2',
      'z = dat.vi == 0  # 0.5 added to every cell only where the variance would be 0', 'q1, q2 = (dat.e1 + 0.5) / (dat.n1 + 1), (dat.e2 + 0.5) / (dat.n2 + 1)',
      'dat.loc[z, "yi"] = (q1 - q2)[z]; dat.loc[z, "vi"] = (q1 * (1 - q1) / (dat.n1 + 1) + q2 * (1 - q2) / (dat.n2 + 1))[z]'];
  } else if (s.type === 'continuous') {
    rEff = s.measure === 'MD' ? ['dat$yi <- dat$m1 - dat$m2', 'dat$vi <- dat$sd1^2 / dat$n1 + dat$sd2^2 / dat$n2']
      : ['N <- dat$n1 + dat$n2', 'sp <- sqrt(((dat$n1 - 1) * dat$sd1^2 + (dat$n2 - 1) * dat$sd2^2) / (N - 2))', 'dat$yi <- (1 - 3 / (4 * N - 9)) * (dat$m1 - dat$m2) / sp   # Hedges\' g, as RevMan',
        'dat$vi <- N / (dat$n1 * dat$n2) + dat$yi^2 / (2 * (N - 3.94))'];
    pEff = s.measure === 'MD' ? ['dat["yi"] = dat.m1 - dat.m2', 'dat["vi"] = dat.sd1**2 / dat.n1 + dat.sd2**2 / dat.n2']
      : ['N = dat.n1 + dat.n2', 'sp = np.sqrt(((dat.n1 - 1) * dat.sd1**2 + (dat.n2 - 1) * dat.sd2**2) / (N - 2))', 'dat["yi"] = (1 - 3 / (4 * N - 9)) * (dat.m1 - dat.m2) / sp  # Hedges\' g, as RevMan',
        'dat["vi"] = N / (dat.n1 * dat.n2) + dat.yi**2 / (2 * (N - 3.94))'];
  } else if (s.type === 'proportion') {
    rEff = ['x <- dat$events; n <- dat$total; z <- x == 0 | x == n   # 0.5 added when a study has 0% or 100%', 'x[z] <- x[z] + 0.5; n[z] <- n[z] + 1',
      'dat$yi <- log(x / (n - x))   # logit', 'dat$vi <- 1 / x + 1 / (n - x)'];
    pEff = ['x, n = dat.events.astype(float), dat.total.astype(float)', 'z = (x == 0) | (x == n)  # 0.5 added when a study has 0% or 100%', 'x[z] += 0.5; n[z] += 1',
      'dat["yi"] = np.log(x / (n - x)); dat["vi"] = 1 / x + 1 / (n - x)'];
  } else {
    rEff = isR ? ['dat$yi <- log(dat$est)', 'dat$vi <- ((log(dat$upper) - log(dat$lower)) / (2 * qnorm(0.975)))^2'] : ['dat$yi <- dat$est', 'dat$vi <- ((dat$upper - dat$lower) / (2 * qnorm(0.975)))^2'];
    pEff = isR ? ['dat["yi"] = np.log(dat.est)', 'dat["vi"] = ((np.log(dat.upper) - np.log(dat.lower)) / (2 * stats.norm.isf(0.025)))**2'] : ['dat["yi"] = dat.est', 'dat["vi"] = ((dat.upper - dat.lower) / (2 * stats.norm.isf(0.025)))**2'];
  }
  const back = isR ? 'exp' : s.measure === 'PLO' ? 'plogis' : '';
  const pback = isR ? 'np.exp' : s.measure === 'PLO' ? '(lambda v: 1 / (1 + np.exp(-v)))' : '';
  const random = s.model !== 'fixed';
  const method = random ? s.method : 'FE';
  const r = ['library(metafor)', ...rData, ...rEff,
    `res <- rma(yi, vi, data = dat, method = ${str(method)}${random && s.hksj ? ', test = "knha"' : ''}, slab = study)   # ${random ? `random effects, ${s.method}${s.hksj ? ' with the Hartung-Knapp-Sidik-Jonkman CI' : ''}` : 'fixed effect (inverse variance)'}`,
    'res', back ? `predict(res, transf = ${back})   # pooled estimate on the ${isR ? 'ratio' : 'proportion'} scale` : 'predict(res)',
    ...(random ? ['confint(res)   # Q-profile CIs for tau^2 (and I^2)', '# Prediction interval as in the app: t on k - 2 df (Higgins, Thompson and Spiegelhalter 2009)',
      'se_re <- sqrt(1 / sum(1 / (dat$vi + res$tau2)))', `pred_int <- c(res$b) + c(-1, 1) * qt(0.975, res$k - 2) * sqrt(res$tau2 + se_re^2); ${back ? `${back}(pred_int)` : 'pred_int'}`] : []),
    `forest(res${isR ? ', atransf = exp' : s.measure === 'PLO' ? ', transf = plogis' : ''})`, 'funnel(res)', 'regtest(res, model = "lm")   # Egger\'s test',
    ...(s.subgroups ? ['# Subgroups, each with its own tau^2, and the test for subgroup differences (as RevMan):',
      `sub <- lapply(split(dat, dat$subgroup), function(x) rma(yi, vi, data = x, method = ${str(method)}${random && s.hksj ? ', test = "knha"' : ''}))`,
      `between <- rma(sapply(sub, function(m) c(m$b)), sei = sapply(sub, function(m) m$se), method = "FE")`, 'between$QE; between$QEp   # Q between subgroups and its p'] : [])];
  const py = [...pData, ...pEff, 'y, v = dat.yi.to_numpy(float), dat.vi.to_numpy(float)', 'k = y.size',
    'w = 1 / v; fe = np.sum(w * y) / np.sum(w); se_fe = np.sqrt(1 / np.sum(w))', 'Q = np.sum(w * (y - fe)**2); I2 = max(0.0, (Q - (k - 1)) / Q) if Q > 0 else 0.0',
    'def qgen(t2):', '    wr = 1 / (v + t2); mu = np.sum(wr * y) / np.sum(wr)', '    return np.sum(wr * (y - mu)**2)',
    ...(method === 'DL' ? ['tau2 = max(0.0, (Q - (k - 1)) / (np.sum(w) - np.sum(w**2) / np.sum(w)))  # DerSimonian-Laird']
      : method === 'PM' ? ['from scipy.optimize import brentq', 'if qgen(0) <= k - 1:', '    tau2 = 0.0', 'else:', '    hi = 1.0', '    while qgen(hi) > k - 1:', '        hi *= 2', '    tau2 = brentq(lambda t: qgen(t) - (k - 1), 0, hi, xtol=1e-14)  # Paule-Mandel']
        : method === 'REML' ? ['from scipy.optimize import brentq', 'def score(t2):', '    wr = 1 / (v + t2); mu = np.sum(wr * y) / np.sum(wr)', '    return np.sum(wr**2 * (y - mu)**2) - np.sum(wr) + np.sum(wr**2) / np.sum(wr)',
          'if score(0) <= 0:', '    tau2 = 0.0', 'else:', '    hi = 1.0', '    while score(hi) > 0:', '        hi *= 2', '    tau2 = brentq(score, 0, hi, xtol=1e-14)  # REML']
          : ['tau2 = 0.0  # fixed effect']),
    'wr = 1 / (v + tau2); re = np.sum(wr * y) / np.sum(wr); se_re = np.sqrt(1 / np.sum(wr))',
    ...(random && s.hksj ? ['q = np.sum(wr * (y - re)**2) / (k - 1); se_hk = np.sqrt(q / np.sum(wr))', 'ci_re = re + np.array([-1, 1]) * stats.t.isf(0.025, k - 1) * se_hk  # Hartung-Knapp-Sidik-Jonkman']
      : ['ci_re = re + np.array([-1, 1]) * stats.norm.isf(0.025) * se_re']),
    'ci_fe = fe + np.array([-1, 1]) * stats.norm.isf(0.025) * se_fe',
    'pred_int = re + np.array([-1, 1]) * stats.t.isf(0.025, k - 2) * np.sqrt(tau2 + se_re**2) if k > 2 else None  # prediction interval, t on k - 2 df',
    `back = ${pback || '(lambda v: v)'}`,
    'print(f"k = {k}; Q = {Q:.3f} on {k - 1} df (p = {stats.chi2.sf(Q, k - 1):.4g}); I2 = {100 * I2:.1f}%; tau2 = {tau2:.4g}")',
    'print("fixed effect:", back(fe), back(ci_fe))', `print(${random ? '"random effects:"' : '"(random effects not requested)"'}, back(re), back(ci_re))`, 'print("95% prediction interval:", None if pred_int is None else back(pred_int))',
    'import statsmodels.api as sm', 'se = np.sqrt(v); egger = sm.OLS(y / se, sm.add_constant(1 / se)).fit()', 'print("Egger intercept:", egger.params[0], "p:", egger.pvalues[0])'];
  return { title: `Meta-analysis (${s.measure})`, data: false, rPkgs: ['metafor'], pyPkgs: ['pandas', 'statsmodels'], pyImports: ['import pandas as pd'], r, py };
};

/* ------------------------------------------------------------------ api --- */

/** The script for a spec in 'r' or 'py': { text, filename, packages, usesData }. */
export function scriptFor(spec, lang) {
  const gen = G[spec?.kind];
  if (!gen) return null;
  const g = gen(spec);
  const data = g.data !== false;
  const head = header(lang, g.title, { rPkgs: g.rPkgs || [], pyPkgs: g.pyPkgs || [], pyImports: g.pyImports || [], data });
  const body = lang === 'r' ? g.r : g.py;
  const base = (spec.kind || 'analysis').replace(/[^a-z0-9]+/gi, '-');
  return { text: `${[...head, ...body].join('\n')}\n`, filename: `research-app-${base}.${lang === 'r' ? 'R' : 'py'}`, packages: lang === 'r' ? g.rPkgs || [] : g.pyPkgs || [], usesData: data };
}

export const CODE_KINDS = Object.keys(G);

/** The dataset as CSV text (original cell values), for the scripts to read. */
export function datasetCsv(ds) {
  const q = (s) => (/[",\n\r]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
  const lines = [ds.columns.map((c) => q(c.name)).join(',')];
  for (let i = 0; i < ds.n; i++) lines.push(ds.columns.map((c) => q(c.raw[i] ?? '')).join(','));
  return `${lines.join('\n')}\n`;
}
