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

/* -------------------------------------- stratified analysis, standardisation --- */
// As with the measures, R and Python name their results alike: est, lo, hi, p_main, crude, homog_q or tarone.

G.mh = (s) => {
  const pt = s.design === 'pt', cc = s.design === 'case-control', cross = s.design === 'cross';
  const cols = pt ? ['a', 't1', 'c', 't0'] : ['a', 'b', 'c', 'd'];
  const name = pt ? 'rate ratio' : cc ? 'odds ratio' : cross ? 'prevalence ratio' : 'risk ratio';
  const typed = !!s.strata;
  let rData, pData;
  if (typed) {
    rData = ['strata <- data.frame(', `  stratum = ${rvec(s.strata.map((x) => x.label))},`,
      ...cols.map((c, j) => `  ${c} = ${rvec(s.strata.map((x) => x.vals[j]), num)}${j < 3 ? ',' : ')'}`)];
    pData = ['strata = pd.DataFrame({', `    "stratum": ${pvec(s.strata.map((x) => x.label))},`,
      ...cols.map((c) => `    "${c}": ${pvec(s.strata.map((x) => x.vals[cols.indexOf(c)]), pnum)},`), '})'];
  } else {
    const need = [s.exposure, s.outcome, s.stratum, ...(pt ? [s.time] : [])];
    rData = [`ok <- ${need.map((c) => `!is.na(${rcol(c)})`).join(' & ')}`,
      `x <- data.frame(ex = (${rLevel(s.exposure, s.exposed, s.numericE)})[ok], ou = (${rLevel(s.outcome, s.event, s.numericO)})[ok]${pt ? `, tt = ${rcol(s.time)}[ok]` : ''})`,
      `parts <- split(x, ${rcol(s.stratum)}[ok])   # one data frame for each level of ${pretty(s.stratum)}`,
      ...(pt
        ? ['strata <- data.frame(stratum = names(parts),', '  a = sapply(parts, function(g) sum(g$ex & g$ou)), t1 = sapply(parts, function(g) sum(g$tt[g$ex])),',
          '  c = sapply(parts, function(g) sum(!g$ex & g$ou)), t0 = sapply(parts, function(g) sum(g$tt[!g$ex])))']
        : ['strata <- data.frame(stratum = names(parts),', '  a = sapply(parts, function(g) sum(g$ex & g$ou)), b = sapply(parts, function(g) sum(g$ex & !g$ou)),',
          '  c = sapply(parts, function(g) sum(!g$ex & g$ou)), d = sapply(parts, function(g) sum(!g$ex & !g$ou)))'])];
    pData = [`ok = ${need.map((c) => `${pcol(c)}.notna()`).join(' & ')}`,
      `x = pd.DataFrame({"ex": ${pLevel(s.exposure, s.exposed, s.numericE, 'ok')}, "ou": ${pLevel(s.outcome, s.event, s.numericO, 'ok')}, "st": d.loc[ok, ${str(s.stratum)}]${pt ? `, "tt": d.loc[ok, ${str(s.time)}]` : ''}})`,
      'rows = []', `for st, g in x.groupby("st", sort=True):  # one row for each level of ${pretty(s.stratum)}`,
      pt ? '    rows.append({"stratum": st, "a": int((g.ex & g.ou).sum()), "t1": float(g.tt[g.ex].sum()), "c": int((~g.ex & g.ou).sum()), "t0": float(g.tt[~g.ex].sum())})'
        : '    rows.append({"stratum": st, "a": int((g.ex & g.ou).sum()), "b": int((g.ex & ~g.ou).sum()), "c": int((~g.ex & g.ou).sum()), "d": int((~g.ex & ~g.ou).sum())})',
      'strata = pd.DataFrame(rows)'];
  }
  const title = `Stratified analysis: Mantel-Haenszel ${name}${s.stratum ? `, ${pretty(s.outcome)} by ${pretty(s.exposure)}, stratified by ${pretty(s.stratum)}` : ''}`;
  const pyImports = typed ? ['import pandas as pd'] : [];
  if (pt) {
    return {
      title, data: !typed, rPkgs: ['metafor'], pyPkgs: ['pandas'], pyImports,
      r: ['library(metafor)', ...rData, 'strata <- strata[strata$t1 + strata$t0 > 0, ]   # strata with no person-time say nothing', 'strata',
        'res <- rma.mh(x1i = a, t1i = t1, x2i = c, t2i = t0, data = strata, measure = "IRR")   # Mantel-Haenszel rate ratio and the Mantel-Haenszel test', 'res',
        'est <- exp(as.numeric(res$b)); lo <- exp(res$ci.lb); hi <- exp(res$ci.ub); p_main <- res$MHp',
        'crude <- (sum(strata$a) / sum(strata$t1)) / (sum(strata$c) / sum(strata$t0))',
        'ok <- strata$a > 0 & strata$c > 0   # homogeneity of the rate ratio: inverse variance on the log scale',
        'homog <- rma(yi = log((a / t1) / (c / t0)), vi = 1 / a + 1 / c, data = strata[ok, ], method = "FE"); homog_q <- homog$QE',
        'c(crude = crude, adjusted = est, lower = lo, upper = hi, p = p_main, homogeneity_Q = homog_q, homogeneity_p = homog$QEp)',
        'rma.mh(x1i = a, t1i = t1, x2i = c, t2i = t0, data = strata, measure = "IRD")   # rate difference with Mantel-Haenszel weights'],
      py: [...pData, 'strata = strata[strata.t1 + strata.t0 > 0]  # strata with no person-time say nothing', 'print(strata)',
        'a, t1, c, t0 = (strata[k].to_numpy(float) for k in ["a", "t1", "c", "t0"])', 'T = t1 + t0', 'z = stats.norm.isf(0.025)',
        'num, den = a * t0 / T, c * t1 / T', 'est = num.sum() / den.sum()  # Mantel-Haenszel rate ratio',
        'se = np.sqrt(np.sum((a + c) * t1 * t0 / T**2) / (num.sum() * den.sum()))  # Greenland-Robins', 'lo, hi = est * np.exp(-z * se), est * np.exp(z * se)',
        '# Mantel-Haenszel test for person-time, with a continuity correction of 0.5 when the deviation is at least 0.5',
        'delta, var = np.sum(a - (a + c) * t1 / T), np.sum((a + c) * t1 * t0 / T**2)', 'chi = (abs(delta) - (0.5 if abs(delta) >= 0.5 else 0))**2 / var',
        'p_main = stats.chi2.sf(chi, 1)', 'crude = (a.sum() / t1.sum()) / (c.sum() / t0.sum())',
        'ok = (a > 0) & (c > 0)  # homogeneity of the rate ratio: inverse variance on the log scale', 'y, v = np.log((a / t1) / (c / t0))[ok], (1 / a + 1 / c)[ok]',
        'w = 1 / v; homog_q = np.sum(w * (y - np.sum(w * y) / np.sum(w))**2)',
        'w_d = t1 * t0 / T; ird = np.sum(w_d * (a / t1 - c / t0)) / w_d.sum()  # rate difference with Mantel-Haenszel weights',
        'print(f"crude {crude:.4f}; Mantel-Haenszel {est:.4f} (95% CI {lo:.4f} to {hi:.4f}); MH test p = {p_main:.4g}")',
        'print(f"homogeneity Q = {homog_q:.3f}, p = {stats.chi2.sf(homog_q, ok.sum() - 1):.4g}; rate difference {ird:.6g} per unit of person-time")'],
    };
  }
  const rCommon = ['library(metafor)', ...rData, 'strata <- strata[with(strata, a + b + c + d) > 0, ]   # strata with no one in them say nothing', 'strata',
    "tab <- array(t(as.matrix(strata[, c(\"a\", \"c\", \"b\", \"d\")])), dim = c(2, 2, nrow(strata)))   # each stratum's 2 x 2 table",
    'keep <- apply(tab, 3, sum) > 1', 'cmh <- mantelhaen.test(tab[, , keep, drop = FALSE])   # Cochran-Mantel-Haenszel test; MH odds ratio with the Robins-Breslow-Greenland CI', 'cmh',
    'p_main <- cmh$p.value', 'res_or <- rma.mh(ai = a, bi = b, ci = c, di = d, data = strata, measure = "OR")',
    "tarone <- res_or$TA   # Breslow-Day test with Tarone's correction (p in res_or$TAp)"];
  const pCommon = [...pData, 'strata = strata[strata[["a", "b", "c", "d"]].sum(axis=1) > 0]  # strata with no one in them say nothing', 'print(strata)',
    'a, b, c, dd = (strata[k].to_numpy(float) for k in ["a", "b", "c", "d"])', 'n1, n0, m1 = a + b, c + dd, a + c', 'n = n1 + n0', 'z = stats.norm.isf(0.025)',
    "# Cochran-Mantel-Haenszel test, as R's mantelhaen.test (0.5 correction when the deviation is at least 0.5)",
    'k = n > 1', 'delta = np.sum(a[k] - n1[k] * m1[k] / n[k])', 'var = np.sum(n1[k] * n0[k] * m1[k] * (n[k] - m1[k]) / (n[k]**2 * (n[k] - 1)))',
    'chi = (abs(delta) - (0.5 if abs(delta) >= 0.5 else 0))**2 / var', 'p_main = stats.chi2.sf(chi, 1)',
    '# Mantel-Haenszel odds ratio (Robins-Breslow-Greenland CI) and the Breslow-Day test with Tarone\'s correction',
    'tables = [np.array([[w, x], [y, v]]) for w, x, y, v in zip(a, b, c, dd) if min(w + x, y + v, w + y, x + v) > 0]',
    'st = StratifiedTable(tables)', 'tarone = st.test_equal_odds(adjust=True).statistic'];
  const pyImp = [...pyImports, 'from statsmodels.stats.contingency_tables import StratifiedTable'];
  if (cc) {
    return {
      title, data: !typed, rPkgs: ['metafor'], pyPkgs: ['pandas', 'statsmodels'], pyImports: pyImp,
      r: [...rCommon, 'est <- exp(as.numeric(res_or$b)); lo <- exp(res_or$ci.lb); hi <- exp(res_or$ci.ub)   # Mantel-Haenszel odds ratio',
        'crude <- (sum(strata$a) * sum(strata$d)) / (sum(strata$b) * sum(strata$c))',
        'c(crude = crude, adjusted = est, lower = lo, upper = hi, p = p_main, tarone = tarone, tarone_p = res_or$TAp)'],
      py: [...pCommon, 'est = st.oddsratio_pooled; lo, hi = st.oddsratio_pooled_confint()  # Mantel-Haenszel',
        'crude = (a.sum() * dd.sum()) / (b.sum() * c.sum())',
        'print(f"crude {crude:.4f}; Mantel-Haenszel {est:.4f} (95% CI {lo:.4f} to {hi:.4f}); CMH p = {p_main:.4g}; Tarone {tarone:.3f}, p = {stats.chi2.sf(tarone, len(tables) - 1):.4g}")'],
    };
  }
  return {
    title, data: !typed, rPkgs: ['metafor'], pyPkgs: ['pandas', 'statsmodels'], pyImports: pyImp,
    r: [...rCommon, `res <- rma.mh(ai = a, bi = b, ci = c, di = d, data = strata, measure = "RR")   # Mantel-Haenszel ${name}, Greenland-Robins variance`, 'res',
      'est <- exp(as.numeric(res$b)); lo <- exp(res$ci.lb); hi <- exp(res$ci.ub)', 'crude <- (sum(strata$a) / sum(strata$a + strata$b)) / (sum(strata$c) / sum(strata$c + strata$d))',
      `ok <- strata$a > 0 & strata$c > 0   # homogeneity of the ${name}: inverse variance on the log scale`,
      'homog <- rma(yi = log((a / (a + b)) / (c / (c + d))), vi = 1 / a - 1 / (a + b) + 1 / c - 1 / (c + d), data = strata[ok, ], method = "FE"); homog_q <- homog$QE',
      'c(crude = crude, adjusted = est, lower = lo, upper = hi, p = p_main, homogeneity_Q = homog_q, homogeneity_p = homog$QEp)',
      'rma.mh(ai = a, bi = b, ci = c, di = d, data = strata, measure = "RD")   # risk difference, Sato-Greenland-Robins variance',
      'exp(as.numeric(res_or$b))   # the Mantel-Haenszel odds ratio, for comparison'],
    py: [...pCommon, 'num, den = a * n0 / n, c * n1 / n', `est = num.sum() / den.sum()  # Mantel-Haenszel ${name}`,
      'se = np.sqrt(np.sum((a + c) * n1 * n0 / n**2 - a * c / n) / (num.sum() * den.sum()))  # Greenland-Robins', 'lo, hi = est * np.exp(-z * se), est * np.exp(z * se)',
      'crude = (a.sum() / n1.sum()) / (c.sum() / n0.sum())',
      `ok = (a > 0) & (c > 0)  # homogeneity of the ${name}: inverse variance on the log scale`, 'y, v = np.log((a / n1) / (c / n0))[ok], (1 / a - 1 / n1 + 1 / c - 1 / n0)[ok]',
      'w = 1 / v; homog_q = np.sum(w * (y - np.sum(w * y) / np.sum(w))**2)',
      'w_d = n1 * n0 / n; rd = np.sum((a * n0 - c * n1) / n) / w_d.sum()  # Mantel-Haenszel risk difference',
      'Ps = np.sum((n1**2 * c - n0**2 * a + 0.5 * n1 * n0 * (n0 - n1)) / n**2); Qs = np.sum((a * (n0 - c) + c * (n1 - a)) / (2 * n))',
      'rd_se = np.sqrt((rd * Ps + Qs) / w_d.sum()**2)  # Sato, Greenland and Robins',
      `print(f"crude {crude:.4f}; Mantel-Haenszel ${name} {est:.4f} (95% CI {lo:.4f} to {hi:.4f}); CMH p = {p_main:.4g}; homogeneity Q = {homog_q:.3f}")`,
      'print(f"risk difference {rd:.4f} (95% CI {rd - z * rd_se:.4f} to {rd + z * rd_se:.4f}); MH odds ratio {st.oddsratio_pooled:.4f}")'],
  };
};

G.dsr = (s) => {
  const v = (j) => s.strata.map((x) => x.vals[j]);
  const per = s.per || 100000;
  return {
    title: s.two ? 'Direct standardisation: two groups compared' : 'Direct standardisation', data: false, rPkgs: ['epitools'], pyPkgs: ['pandas'], pyImports: ['import pandas as pd', 'from scipy.stats import gamma'],
    r: ['library(epitools)', 'dat <- data.frame(', `  group = ${rvec(s.strata.map((x) => x.label))},`, `  events = ${rvec(v(0), num)}, pop = ${rvec(v(1), num)}, std = ${rvec(v(2), num)}${s.two ? ',' : ')'}`,
      ...(s.two ? [`  events2 = ${rvec(v(3), num)}, pop2 = ${rvec(v(4), num)})`] : []),
      'res <- ageadjust.direct(count = dat$events, pop = dat$pop, stdpop = dat$std)   # gamma CI of Fay and Feuer (1997)', `res * ${per}   # per ${per}`,
      'dsr <- res[["adj.rate"]]; lo <- res[["lci"]]; hi <- res[["uci"]]; crude <- res[["crude.rate"]]',
      ...(s.two ? ['res2 <- ageadjust.direct(count = dat$events2, pop = dat$pop2, stdpop = dat$std)', `res2 * ${per}`,
        'w <- dat$std / sum(dat$std)', 'v1 <- sum(w^2 * dat$events / dat$pop^2); v2 <- sum(w^2 * dat$events2 / dat$pop2^2)',
        'ratio <- dsr / res2[["adj.rate"]]   # ratio of the standardised rates', 'se <- sqrt(v1 / dsr^2 + v2 / res2[["adj.rate"]]^2)   # delta method on the log scale',
        'ratio_lo <- ratio * exp(-qnorm(0.975) * se); ratio_hi <- ratio * exp(qnorm(0.975) * se)', 'c(ratio = ratio, lower = ratio_lo, upper = ratio_hi)'] : [])],
    py: ['dat = pd.DataFrame({', `    "group": ${pvec(s.strata.map((x) => x.label))},`, `    "events": ${pvec(v(0), pnum)}, "pop": ${pvec(v(1), pnum)}, "std": ${pvec(v(2), pnum)},`,
      ...(s.two ? [`    "events2": ${pvec(v(3), pnum)}, "pop2": ${pvec(v(4), pnum)},`] : []), '})',
      'def dsr_gamma(x, n, std):', '    w = std / std.sum()', '    dsr, v, wm = np.sum(w * x / n), np.sum(w**2 * x / n**2), np.max(w / n)',
      '    lo = gamma.ppf(0.025, dsr**2 / v, scale=v / dsr) if dsr > 0 else 0.0  # Fay and Feuer (1997)', '    hi = gamma.ppf(0.975, (dsr + wm)**2 / (v + wm**2), scale=(v + wm**2) / (dsr + wm))',
      '    return dsr, lo, hi, v', '',
      'dsr, lo, hi, v1 = dsr_gamma(dat["events"].to_numpy(float), dat["pop"].to_numpy(float), dat["std"].to_numpy(float))', 'crude = dat["events"].sum() / dat["pop"].sum()',
      `print(f"crude {${per} * crude:.4g}; standardised {${per} * dsr:.4g} ({${per} * lo:.4g} to {${per} * hi:.4g}) per ${per}")`,
      ...(s.two ? ['dsr2, lo2, hi2, v2 = dsr_gamma(dat["events2"].to_numpy(float), dat["pop2"].to_numpy(float), dat["std"].to_numpy(float))',
        'ratio = dsr / dsr2; se = np.sqrt(v1 / dsr**2 + v2 / dsr2**2)  # delta method on the log scale',
        'ratio_lo, ratio_hi = ratio * np.exp(-stats.norm.isf(0.025) * se), ratio * np.exp(stats.norm.isf(0.025) * se)',
        'print(f"ratio of standardised rates {ratio:.4f} ({ratio_lo:.4f} to {ratio_hi:.4f})")'] : [])],
  };
};

G.smr = (s) => {
  const per = s.per || 1000;
  return {
    title: 'Indirect standardisation: standardised mortality (or incidence) ratio', data: false, pyPkgs: ['pandas'], pyImports: ['import pandas as pd', 'from scipy.stats import chi2, poisson'],
    r: ['dat <- data.frame(', `  group = ${rvec(s.strata.map((x) => x.label))},`, `  pop = ${rvec(s.strata.map((x) => x.vals[0]), num)},`,
      `  rate = ${rvec(s.strata.map((x) => x.vals[1]), num)} / ${per})   # the standard's rates, per person`,
      `observed <- ${s.observed}`, 'expected <- sum(dat$pop * dat$rate)',
      'res <- poisson.test(observed, expected)   # exact CI for the SMR, and the exact test of observed against expected', 'res',
      'smr <- observed / expected; lo <- res$conf.int[1]; hi <- res$conf.int[2]; p_main <- res$p.value', 'c(observed = observed, expected = expected, smr = smr, lower = lo, upper = hi)'],
    py: [`pop = np.array(${pvec(s.strata.map((x) => x.vals[0]), pnum)})`, `rate = np.array(${pvec(s.strata.map((x) => x.vals[1]), pnum)}) / ${per}  # the standard's rates, per person`,
      `observed = ${s.observed}`, 'expected = np.sum(pop * rate)', 'smr = observed / expected',
      'lo = chi2.ppf(0.025, 2 * observed) / (2 * expected) if observed > 0 else 0.0  # exact (Ulm 1990)', 'hi = chi2.ppf(0.975, 2 * observed + 2) / (2 * expected)',
      '# Exact two-sided p, as R\'s poisson.test: the chance of counts no more likely than the one observed',
      'k = np.arange(0, int(4 * max(observed, expected)) + 200)', 'pk = poisson.pmf(k, expected)',
      'p_main = min(1.0, pk[pk <= poisson.pmf(observed, expected) * (1 + 1e-7)].sum())',
      'print(f"observed {observed}, expected {expected:.2f}; SMR {smr:.4f} ({lo:.4f} to {hi:.4f}); p = {p_main:.4g}")'],
  };
};

/** Mantel-Haenszel or Peto pooling of 2 x 2 counts: metafor's rma.mh / rma.peto in R, written out in Python. */
function metaMH(s) {
  const rows = s.studies, peto = s.pooling === 'peto', m = peto ? 'OR' : s.measure, isR = m !== 'RD';
  const name = peto ? "Peto's odds ratio" : `Mantel-Haenszel ${{ OR: 'odds ratio', RR: 'risk ratio', RD: 'risk difference' }[m]}`;
  const rData = ['dat <- data.frame(', `  study = ${rvec(rows.map((r) => r.name))},`, ...['e1', 'n1', 'e2', 'n2'].map((c, j) => `  ${c} = ${rvec(rows.map((r) => r.vals[j]), num)},`),
    ...(s.subgroups ? [`  subgroup = ${rvec(rows.map((r) => r.sub || 'Not given'))},`] : []), '  stringsAsFactors = FALSE)'];
  const call = (d) => (peto ? `rma.peto(ai = e1, n1i = n1, ci = e2, n2i = n2, data = ${d}` : `rma.mh(ai = e1, n1i = n1, ci = e2, n2i = n2, data = ${d}, measure = ${str(m)}`);
  const r = ['library(metafor)', ...rData, `res <- ${call('dat')}, slab = study)   # ${name}, fixed effect, from the counts as they are`, 'res',
    isR ? 'predict(res, transf = exp)   # on the ratio scale' : 'predict(res)', `forest(res${isR ? ', atransf = exp' : ''})`,
    ...(s.subgroups ? ['# Subgroups pooled the same way, and the test for subgroup differences (as RevMan):',
      `sub <- lapply(split(dat, dat$subgroup), function(x) ${call('x')}))`,
      'between <- rma(sapply(sub, function(m) c(m$b)), sei = sapply(sub, function(m) m$se), method = "FE")', 'between$QE; between$QEp   # Q between subgroups and its p'] : [])];
  const pyPool = (v) => (peto
    ? [`m = ${v}e1 + ${v}e2; n = ${v}n1 + ${v}n2`, `E = ${v}n1 * m / n; V = ${v}n1 * ${v}n2 * m * (n - m) / (n**2 * (n - 1))  # expected events and hypergeometric variance`,
      `est = np.sum(${v}e1 - E) / np.sum(V); se = 1 / np.sqrt(np.sum(V))  # Peto: log OR = sum(O - E) / sum(V)`]
    : m === 'OR' ? [`a, b, c, dd = ${v}e1, ${v}n1 - ${v}e1, ${v}e2, ${v}n2 - ${v}e2; n = ${v}n1 + ${v}n2`,
      'R, S, P, Qx = a * dd / n, b * c / n, (a + dd) / n, (b + c) / n',
      'est = np.log(R.sum() / S.sum())  # Mantel-Haenszel log odds ratio',
      'se = np.sqrt((P * R).sum() / (2 * R.sum()**2) + (P * S + Qx * R).sum() / (2 * R.sum() * S.sum()) + (Qx * S).sum() / (2 * S.sum()**2))  # Robins-Breslow-Greenland']
      : m === 'RR' ? [`a, c, n1, n2 = ${v}e1, ${v}e2, ${v}n1, ${v}n2; n = n1 + n2`, 'num, den = a * n2 / n, c * n1 / n',
        'est = np.log(num.sum() / den.sum())  # Mantel-Haenszel log risk ratio', 'se = np.sqrt((((a + c) * n1 * n2 / n**2) - a * c / n).sum() / (num.sum() * den.sum()))  # Greenland-Robins']
        : [`a, c, n1, n2 = ${v}e1, ${v}e2, ${v}n1, ${v}n2; n = n1 + n2`, 'w = n1 * n2 / n', 'est = ((a * n2 - c * n1) / n).sum() / w.sum()  # Mantel-Haenszel risk difference',
          'Ps = ((n1**2 * c - n2**2 * a + 0.5 * n1 * n2 * (n2 - n1)) / n**2).sum(); Qs = ((a * (n2 - c) + c * (n1 - a)) / (2 * n)).sum()',
          'se = np.sqrt((est * Ps + Qs) / w.sum()**2)  # Sato, Greenland and Robins']);
  const pyQ = peto
    ? ['ok = V > 0', 'Q = np.sum((e1 - E)[ok]**2 / V[ok]) - np.sum((e1 - E)[ok])**2 / np.sum(V[ok])  # heterogeneity']
    : ['# Heterogeneity: each study\'s estimate (0.5 added to tables with a zero cell; tables with no events, or only events, in both groups left out), as metafor',
      'aa, bb, cc, ee = e1.copy(), n1 - e1, e2.copy(), n2 - e2', 'ok = ~(((aa == 0) & (cc == 0)) | ((bb == 0) & (ee == 0)))', 'aa, bb, cc, ee = aa[ok], bb[ok], cc[ok], ee[ok]',
      'z0 = (aa == 0) | (bb == 0) | (cc == 0) | (ee == 0)', 'aa[z0] += 0.5; bb[z0] += 0.5; cc[z0] += 0.5; ee[z0] += 0.5',
      ...(m === 'OR' ? ['yi = np.log(aa * ee / (bb * cc)); vi = 1 / aa + 1 / bb + 1 / cc + 1 / ee']
        : m === 'RR' ? ['yi = np.log((aa / (aa + bb)) / (cc / (cc + ee))); vi = 1 / aa - 1 / (aa + bb) + 1 / cc - 1 / (cc + ee)']
          : ['p1, p2 = aa / (aa + bb), cc / (cc + ee)', 'yi = p1 - p2; vi = p1 * (1 - p1) / (aa + bb) + p2 * (1 - p2) / (cc + ee)']),
      'Q = np.sum((yi - mh)**2 / vi)'];
  const py = ['dat = pd.DataFrame({', `    "study": ${pvec(rows.map((r) => r.name))},`, ...['e1', 'n1', 'e2', 'n2'].map((c, j) => `    "${c}": ${pvec(rows.map((r) => r.vals[j]), pnum)},`),
    ...(s.subgroups ? [`    "subgroup": ${pvec(rows.map((r) => r.sub || 'Not given'))},`] : []), '})',
    'e1, n1, e2, n2 = (dat[c].to_numpy(float) for c in ["e1", "n1", "e2", "n2"])', ...pyPool(''), 'mh, se_mh = est, se',
    'ci_mh = mh + np.array([-1, 1]) * stats.norm.isf(0.025) * se_mh', 'p = 2 * stats.norm.sf(abs(mh / se_mh))',
    ...(peto ? ['m = e1 + e2; n = n1 + n2; E = n1 * m / n; V = n1 * n2 * m * (n - m) / (n**2 * (n - 1))'] : []), ...pyQ,
    'k = len(dat); I2 = max(0.0, (Q - (k - 1)) / Q) if Q > 0 else 0.0',
    `print(f"${name}: {${isR ? 'np.exp(mh)' : 'mh'}:.4f} (95% CI {${isR ? 'np.exp(ci_mh[0])' : 'ci_mh[0]'}:.4f} to {${isR ? 'np.exp(ci_mh[1])' : 'ci_mh[1]'}:.4f}); p = {p:.4g}; Q = {Q:.3f}")`,
    ...(s.subgroups ? ['# Subgroups pooled the same way, and the test for subgroup differences (as RevMan)', 'ys, ses = [], []', 'for g, x in dat.groupby("subgroup", sort=False):',
      '    e1, n1, e2, n2 = (x[c].to_numpy(float) for c in ["e1", "n1", "e2", "n2"])', ...pyPool('').map((l) => `    ${l}`), '    ys.append(est); ses.append(se)',
      'ys, ws = np.array(ys), 1 / np.array(ses)**2', 'q_between = np.sum(ws * (ys - np.sum(ws * ys) / np.sum(ws))**2)', 'print(f"Q between subgroups {q_between:.3f} on {len(ys) - 1} df")'] : [])];
  return { title: `Meta-analysis: ${name}`, data: false, rPkgs: ['metafor'], pyPkgs: ['pandas'], pyImports: ['import pandas as pd'], r, py };
}

G.meta = (s) => {
  if (s.type === 'binary' && (s.pooling === 'mh' || s.pooling === 'peto')) return metaMH(s);
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

/* ------------------------------------- frequency, association, impact --- */
// These scripts name their results the same way in R and Python (est, lo, hi, p_main, ...), so the
// test harness can read both with the same expressions.

const rLevel = (column, level, numeric) => `${rcol(column)} == ${rlit(level, numeric)}`;
const pLevel = (column, level, numeric, rows = null) => `${rows ? `d.loc[${rows}, ${str(column)}]` : pcol(column)} == ${plit(level, numeric)}`;

G.freqP = (s) => {
  const exact = s.method === 'exact';
  const r = s.col
    ? [`v <- ${rcol(s.col)}; v <- v[!is.na(v)]`, `x <- sum(v == ${rlit(s.level, s.numeric)}); n <- length(v)`]
    : [`x <- ${s.x}; n <- ${s.n}`];
  const py = s.col
    ? [`v = ${pcol(s.col)}.dropna()`, `x = int((v == ${plit(s.level, s.numeric)}).sum()); n = int(len(v))`]
    : [`x, n = ${s.x}, ${s.n}`];
  return {
    title: `A proportion with its 95% CI${s.col ? `: ${pretty(s.col)} "${s.level}"` : ''}`, data: !!s.col,
    r: [...r, 'est <- x / n', 'res <- binom.test(x, n)                               # exact test; Clopper-Pearson CI in res$conf.int',
      'wilson <- prop.test(x, n, correct = FALSE)$conf.int   # Wilson score CI',
      `lo <- ${exact ? 'res$conf.int[1]' : 'wilson[1]'}; hi <- ${exact ? 'res$conf.int[2]' : 'wilson[2]'}   # the app's ${exact ? 'exact' : 'Wilson'} interval`,
      'c(proportion = est, lower = lo, upper = hi)'],
    py: [...py, 'est = x / n', 'res = stats.binomtest(x, n)', `ci = res.proportion_ci(method=${str(exact ? 'exact' : 'wilson')})   # ${exact ? 'Clopper-Pearson' : 'Wilson score'}, as the app reports`,
      'lo, hi = ci.low, ci.high', 'print(f"proportion {est:.4f}, 95% CI {lo:.4f} to {hi:.4f}")'],
  };
};

G.freqR = (s) => {
  const r = s.col
    ? [`ok <- !is.na(${rcol(s.col)}) & !is.na(${rcol(s.time)})`, `x <- sum(${rcol(s.col)}[ok] == ${rlit(s.level, s.numeric)}); t <- sum(${rcol(s.time)}[ok])`]
    : [`x <- ${s.x}; t <- ${num(s.t)}   # events and person-time`];
  const py = s.col
    ? [`ok = ${pcol(s.col)}.notna() & ${pcol(s.time)}.notna()`, `x = int((${pLevel(s.col, s.level, s.numeric, 'ok')}).sum()); t = float(d.loc[ok, ${str(s.time)}].sum())`]
    : [`x, t = ${s.x}, ${pnum(s.t)}  # events and person-time`];
  return {
    title: 'A rate with its exact Poisson 95% CI', data: !!s.col, pyImports: ['from scipy.stats import chi2'],
    r: [...r, 'res <- poisson.test(x, t)   # exact (Garwood) CI for the rate', 'est <- x / t; lo <- res$conf.int[1]; hi <- res$conf.int[2]',
      'c(rate = est, lower = lo, upper = hi)   # multiply by 1000 for a rate per 1,000 units of person-time'],
    py: [...py, 'est = x / t', 'lo = chi2.ppf(0.025, 2 * x) / (2 * t) if x > 0 else 0.0   # exact (Garwood) limits', 'hi = chi2.ppf(0.975, 2 * x + 2) / (2 * t)',
      'print(f"rate {est:.6g}, 95% CI {lo:.6g} to {hi:.6g} (per unit of person-time)")'],
  };
};

/** The 2 x 2 table from typed counts or from two columns. */
function tableLines(s, colNames) {
  const dn = `dimnames = list(c("Exposed", "Unexposed"), ${rvec(colNames)})`;
  if (!s.exposure) {
    const [[a, b], [c, d]] = s.table;
    return {
      r: [`tab <- matrix(c(${a}, ${b}, ${c}, ${d}), nrow = 2, byrow = TRUE,`, `              ${dn})`],
      py: [`tab = np.array([[${a}, ${b}], [${c}, ${d}]])  # rows: exposed, unexposed; columns: ${colNames.join(', ').toLowerCase()}`],
    };
  }
  return {
    r: [`ok <- !is.na(${rcol(s.exposure)}) & !is.na(${rcol(s.outcome)})`,
      `ex <- (${rLevel(s.exposure, s.exposed, s.numericE)})[ok]; ou <- (${rLevel(s.outcome, s.event, s.numericO)})[ok]`,
      'tab <- matrix(c(sum(ex & ou), sum(ex & !ou), sum(!ex & ou), sum(!ex & !ou)), nrow = 2, byrow = TRUE,', `              ${dn})`],
    py: [`ok = ${pcol(s.exposure)}.notna() & ${pcol(s.outcome)}.notna()`,
      `ex = ${pLevel(s.exposure, s.exposed, s.numericE, 'ok')}; ou = ${pLevel(s.outcome, s.event, s.numericO, 'ok')}`,
      'tab = np.array([[int((ex & ou).sum()), int((ex & ~ou).sum())], [int((~ex & ou).sum()), int((~ex & ~ou).sum())]])  # rows: exposed, unexposed'],
  };
}

G.epi2x2 = (s) => {
  const cc = s.design === 'case-control';
  const name = cc ? 'Odds ratio' : s.design === 'cross' ? 'Prevalence ratio' : 'Risk ratio';
  const t = tableLines(s, cc ? ['Cases', 'Controls'] : ['Outcome', 'No outcome']);
  const title = `${name} from a 2 x 2 table${s.exposure ? `: ${pretty(s.outcome)} by ${pretty(s.exposure)}` : ''}`;
  const pe = Number.isFinite(s.pe) ? s.pe : null;
  if (cc) {
    return {
      title, data: !!s.exposure, pyImports: ['from scipy.stats.contingency import odds_ratio as conditional_or'],
      r: [...t.r, 'tab', 'z <- qnorm(0.975)', 'small <- min(tab) < 5   # the app uses the exact interval when a cell is below 5',
        'est <- (tab[1, 1] * tab[2, 2]) / (tab[1, 2] * tab[2, 1])   # odds ratio',
        'woolf <- exp(log(est) + c(-1, 1) * z * sqrt(sum(1 / tab)))', 'ft <- fisher.test(tab)   # exact test; ft$conf.int is the exact (conditional) CI',
        'ci <- if (small) ft$conf.int else woolf', 'lo <- ci[1]; hi <- ci[2]',
        'chi <- suppressWarnings(chisq.test(tab))   # Yates\' correction', 'p_main <- if (any(chi$expected < 5)) ft$p.value else chi$p.value   # the app\'s choice of test',
        '# Attributable fraction among the exposed from the OR (prevented fraction 1 - OR below 1)',
        'afe <- if (est >= 1) (est - 1) / est else 1 - est; afe_ci <- if (est >= 1) (ci - 1) / ci else rev(1 - ci)',
        "# Population fraction: Miettinen's formula with the proportion of cases exposed; Jewell's variance",
        'paf <- (tab[1, 1] * tab[2, 2] - tab[1, 2] * tab[2, 1]) / (tab[2, 2] * sum(tab[, 1]))',
        'L <- log(1 - paf); se <- sqrt(tab[1, 1] / (tab[2, 1] * sum(tab[, 1])) + tab[1, 2] / (tab[2, 2] * sum(tab[, 2])))',
        'if (paf >= 0) paf_ci <- 1 - exp(L + c(1, -1) * z * se) else { paf <- 1 - exp(-L); paf_ci <- 1 - exp(-L + c(1, -1) * z * se) }   # prevented when protective',
        'paf_lo <- paf_ci[1]; paf_hi <- paf_ci[2]',
        'out <- rbind(c(est, lo, hi), c(afe, afe_ci), c(paf, paf_ci))',
        'dimnames(out) <- list(c("Odds ratio", if (est >= 1) "Attributable fraction, exposed" else "Prevented fraction, exposed", if (L <= 0) "Attributable fraction, population" else "Prevented fraction, population"), c("estimate", "lower", "upper"))',
        'round(out, 4)', 'p_main'],
      py: [...t.py, 'print(tab)', 'z = stats.norm.ppf(0.975)', 'small = tab.min() < 5  # the app uses the exact interval when a cell is below 5',
        'est = tab[0, 0] * tab[1, 1] / (tab[0, 1] * tab[1, 0])  # odds ratio',
        'woolf = np.exp(np.log(est) + np.array([-1, 1]) * z * np.sqrt((1 / tab).sum()))',
        'exact = conditional_or(tab, kind="conditional").confidence_interval(0.95)', 'lo, hi = (exact.low, exact.high) if small else woolf',
        'chi = stats.chi2_contingency(tab)  # Yates\' correction', 'p_main = stats.fisher_exact(tab).pvalue if chi.expected_freq.min() < 5 else chi.pvalue',
        'afe = (est - 1) / est if est >= 1 else 1 - est',
        "# Population fraction: Miettinen's formula with the proportion of cases exposed; Jewell's variance",
        'paf = (tab[0, 0] * tab[1, 1] - tab[0, 1] * tab[1, 0]) / (tab[1, 1] * tab[:, 0].sum())',
        'L = np.log(1 - paf); se = np.sqrt(tab[0, 0] / (tab[1, 0] * tab[:, 0].sum()) + tab[0, 1] / (tab[1, 1] * tab[:, 1].sum()))',
        'if paf >= 0:', '    paf_lo, paf_hi = 1 - np.exp(L + z * se), 1 - np.exp(L - z * se)', 'else:  # prevented fraction when the exposure protects',
        '    paf = 1 - np.exp(-L); paf_lo, paf_hi = 1 - np.exp(-L + z * se), 1 - np.exp(-L - z * se)',
        'print(f"odds ratio {est:.4f} (95% CI {lo:.4f} to {hi:.4f}); p = {p_main:.4g}")', 'print(f"exposed fraction {afe:.4f}; population fraction {paf:.4f} ({paf_lo:.4f} to {paf_hi:.4f})")'],
    };
  }
  const cohort = s.design !== 'cross';
  const rPaf = pe !== null
    ? [`pe <- ${pe}   # proportion of the population exposed, entered in the app (Levin's formula)`, 'lev <- function(r) pe * (r - 1) / (1 + pe * (r - 1))',
      'paf <- lev(est); paf_ci <- lev(ci)', 'if (paf < 0) { pf <- function(x) 1 - 1 / (1 - x); paf <- pf(paf); paf_ci <- rev(pf(paf_ci)) }   # prevented when protective']
    : ["# Population fraction from the study's own exposure split; Jewell's variance of log(1 - PAF)",
      'paf <- (tab[1, 1] * tab[2, 2] - tab[1, 2] * tab[2, 1]) / (sum(tab[, 1]) * n0)',
      'L <- log(1 - paf); se <- sqrt((tab[1, 2] + paf * (tab[1, 1] + tab[2, 2])) / (sum(tab) * tab[2, 1]))',
      'if (paf >= 0) paf_ci <- 1 - exp(L + c(1, -1) * z * se) else { paf <- 1 - exp(-L); paf_ci <- 1 - exp(-L + c(1, -1) * z * se) }   # prevented when protective'];
  const pyPaf = pe !== null
    ? [`pe = ${pe}  # proportion of the population exposed, entered in the app (Levin's formula)`, 'lev = lambda r: pe * (r - 1) / (1 + pe * (r - 1))',
      'paf, paf_lo, paf_hi = lev(est), lev(lo), lev(hi)', 'if paf < 0:  # prevented fraction when the exposure protects',
      '    pf = lambda x: 1 - 1 / (1 - x)', '    paf, paf_lo, paf_hi = pf(paf), pf(paf_hi), pf(paf_lo)']
    : ["# Population fraction from the study's own exposure split; Jewell's variance of log(1 - PAF)",
      'paf = (tab[0, 0] * tab[1, 1] - tab[0, 1] * tab[1, 0]) / (tab[:, 0].sum() * n0)',
      'L = np.log(1 - paf); se = np.sqrt((tab[0, 1] + paf * (tab[0, 0] + tab[1, 1])) / (tab.sum() * tab[1, 0]))',
      'if paf >= 0:', '    paf_lo, paf_hi = 1 - np.exp(L + z * se), 1 - np.exp(L - z * se)', 'else:  # prevented fraction when the exposure protects',
      '    paf = 1 - np.exp(-L); paf_lo, paf_hi = 1 - np.exp(-L + z * se), 1 - np.exp(-L - z * se)'];
  return {
    title, data: !!s.exposure, pyPkgs: ['statsmodels'],
    pyImports: ['from scipy.optimize import brentq', 'from statsmodels.stats.proportion import confint_proportions_2indep'],
    r: [...t.r, 'tab', 'z <- qnorm(0.975)', 'x1 <- tab[1, 1]; n1 <- sum(tab[1, ]); x0 <- tab[2, 1]; n0 <- sum(tab[2, ])',
      'small <- min(tab) < 5   # the app uses the score interval for the ratio when a cell is below 5',
      'r1 <- x1 / n1; r0 <- x0 / n0', `est <- r1 / r0   # ${name.toLowerCase()}`,
      'wald <- exp(log(est) + c(-1, 1) * z * sqrt(1 / x1 - 1 / n1 + 1 / x0 - 1 / n0))   # Katz, log scale',
      "koopman <- function(l) {   # Koopman's score statistic for the ratio exp(l), minus z^2",
      '  phi <- exp(l); N <- n1 + n0; B <- phi * (n1 + x0) + x1 + n0; C <- x1 + x0',
      '  p0 <- 2 * C / (B + sqrt(max(0, B^2 - 4 * phi * N * C))); p1 <- phi * p0',
      '  (x1 / n1 - phi * x0 / n0)^2 / (p1 * (1 - p1) / n1 + phi^2 * p0 * (1 - p0) / n0) - z^2', '}',
      's <- if (x1 > 0 && x0 > 0) log(est) else log(((x1 + 0.5) / (n1 + 1)) / ((x0 + 0.5) / (n0 + 1)))',
      'score <- c(if (x1 == 0) 0 else exp(uniroot(koopman, c(s - 30, s), tol = 1e-12)$root),',
      '           if (x0 == 0) Inf else exp(uniroot(koopman, c(s, s + 30), tol = 1e-12)$root))',
      'ci <- if (small) score else wald', 'lo <- ci[1]; hi <- ci[2]',
      "# Difference with Newcombe's hybrid score interval",
      'wilson <- function(x, n) { p <- x / n; (p + z^2 / (2 * n) + c(-1, 1) * z * sqrt(p * (1 - p) / n + z^2 / (4 * n^2))) / (1 + z^2 / n) }',
      'w1 <- wilson(x1, n1); w0 <- wilson(x0, n0)', 'rd <- r1 - r0',
      'rd_lo <- rd - sqrt((r1 - w1[1])^2 + (w0[2] - r0)^2); rd_hi <- rd + sqrt((w1[2] - r1)^2 + (r0 - w0[1])^2)',
      ...(cohort ? ['nnt <- 1 / abs(rd)   # number needed to treat or to harm; round up for planning'] : []),
      'odds_ratio <- (tab[1, 1] * tab[2, 2]) / (tab[1, 2] * tab[2, 1])',
      'ft <- fisher.test(tab)   # exact test; ft$conf.int is the exact CI for the odds ratio',
      'chi <- suppressWarnings(chisq.test(tab))   # Yates\' correction', 'p_main <- if (any(chi$expected < 5)) ft$p.value else chi$p.value   # the app\'s choice of test',
      `afe <- if (est >= 1) (est - 1) / est else 1 - est   # attributable fraction among the exposed (prevented below 1)`,
      'afe_ci <- if (est >= 1) (ci - 1) / ci else rev(1 - ci)',
      ...rPaf, 'paf_lo <- paf_ci[1]; paf_hi <- paf_ci[2]',
      `out <- rbind(c(est, lo, hi), c(100 * rd, 100 * rd_lo, 100 * rd_hi), c(odds_ratio, ft$conf.int), c(afe, afe_ci), c(paf, paf_ci))`,
      `dimnames(out) <- list(c(${str(name)}, "Difference (percentage points)", "Odds ratio (exact CI)", "Fraction among the exposed", "Fraction in the population"), c("estimate", "lower", "upper"))`,
      'round(out, 4)', 'p_main', ...(cohort ? ['nnt'] : [])],
    py: [...t.py, 'print(tab)', 'z = stats.norm.ppf(0.975)', 'x1, n1, x0, n0 = int(tab[0, 0]), int(tab[0].sum()), int(tab[1, 0]), int(tab[1].sum())',
      'small = tab.min() < 5  # the app uses the score interval for the ratio when a cell is below 5',
      'r1, r0 = x1 / n1, x0 / n0', `est = r1 / r0 if x0 > 0 else np.inf  # ${name.toLowerCase()}`,
      'wald = np.exp(np.log(est) + np.array([-1, 1]) * z * np.sqrt(1 / x1 - 1 / n1 + 1 / x0 - 1 / n0)) if x1 > 0 and x0 > 0 else (np.nan, np.nan)  # Katz',
      '', '', "def koopman(l):  # Koopman's score statistic for the ratio exp(l), minus z^2",
      '    phi = np.exp(l)', '    N, B, C = n1 + n0, phi * (n1 + x0) + x1 + n0, x1 + x0',
      '    p0 = 2 * C / (B + np.sqrt(max(0.0, B * B - 4 * phi * N * C)))', '    p1 = phi * p0',
      '    return (x1 / n1 - phi * x0 / n0) ** 2 / (p1 * (1 - p1) / n1 + phi ** 2 * p0 * (1 - p0) / n0) - z ** 2', '', '',
      's = np.log(est) if x1 > 0 and x0 > 0 else np.log(((x1 + 0.5) / (n1 + 1)) / ((x0 + 0.5) / (n0 + 1)))',
      'score = (0.0 if x1 == 0 else np.exp(brentq(koopman, s - 30, s, xtol=1e-12)), np.inf if x0 == 0 else np.exp(brentq(koopman, s, s + 30, xtol=1e-12)))',
      'lo, hi = score if small else wald',
      'rd = r1 - r0', 'rd_lo, rd_hi = confint_proportions_2indep(x1, n1, x0, n0, method="newcomb", compare="diff")  # Newcombe',
      ...(cohort ? ['nnt = 1 / abs(rd)  # number needed to treat or to harm; round up for planning'] : []),
      'odds_ratio = tab[0, 0] * tab[1, 1] / (tab[0, 1] * tab[1, 0])',
      'chi = stats.chi2_contingency(tab)  # Yates\' correction', 'p_main = stats.fisher_exact(tab).pvalue if chi.expected_freq.min() < 5 else chi.pvalue',
      'afe = (est - 1) / est if est >= 1 else 1 - est  # attributable fraction among the exposed (prevented below 1)',
      ...pyPaf,
      `print(f"${name.toLowerCase()} {est:.4f} (95% CI {lo:.4f} to {hi:.4f}); difference {100 * rd:.2f} points ({100 * rd_lo:.2f} to {100 * rd_hi:.2f}); p = {p_main:.4g}")`,
      'print(f"odds ratio {odds_ratio:.4f}; exposed fraction {afe:.4f}; population fraction {paf:.4f} ({paf_lo:.4f} to {paf_hi:.4f})")'],
  };
};

G.eptime = (s) => {
  const r = s.exposure
    ? [`ok <- !is.na(${rcol(s.exposure)}) & !is.na(${rcol(s.outcome)}) & !is.na(${rcol(s.time)})`,
      `ex <- (${rLevel(s.exposure, s.exposed, s.numericE)})[ok]; ev <- (${rLevel(s.outcome, s.event, s.numericO)})[ok]; tt <- ${rcol(s.time)}[ok]`,
      'a <- sum(ex & ev); t1 <- sum(tt[ex]); c0 <- sum(!ex & ev); t0 <- sum(tt[!ex])']
    : [`a <- ${s.a}; t1 <- ${num(s.t1)}   # events and person-time, exposed`, `c0 <- ${s.c}; t0 <- ${num(s.t0)}   # unexposed`];
  const py = s.exposure
    ? [`ok = ${pcol(s.exposure)}.notna() & ${pcol(s.outcome)}.notna() & ${pcol(s.time)}.notna()`,
      `ex = ${pLevel(s.exposure, s.exposed, s.numericE, 'ok')}; ev = ${pLevel(s.outcome, s.event, s.numericO, 'ok')}; tt = d.loc[ok, ${str(s.time)}]`,
      'a, t1 = int((ex & ev).sum()), float(tt[ex].sum()); c0, t0 = int((~ex & ev).sum()), float(tt[~ex].sum())']
    : [`a, t1 = ${s.a}, ${pnum(s.t1)}  # events and person-time, exposed`, `c0, t0 = ${s.c}, ${pnum(s.t0)}  # unexposed`];
  return {
    title: `Rate ratio from events and person-time${s.exposure ? `: ${pretty(s.outcome)} by ${pretty(s.exposure)}` : ''}`, data: !!s.exposure,
    r: [...r, 'res <- poisson.test(c(a, c0), c(t1, t0))   # exact CI and test for the rate ratio, conditional on the events', 'res',
      'est <- unname(res$estimate); lo <- res$conf.int[1]; hi <- res$conf.int[2]; p_main <- res$p.value',
      'ird <- a / t1 - c0 / t0; ird_se <- sqrt(a / t1^2 + c0 / t0^2)', 'ird_ci <- ird + c(-1, 1) * qnorm(0.975) * ird_se   # rate difference, Wald',
      'c(rate_exposed = a / t1, rate_unexposed = c0 / t0, rate_ratio = est, lower = lo, upper = hi)'],
    py: [...py, 'res = stats.binomtest(a, a + c0, t1 / (t1 + t0))  # exact, conditional on the events (as R poisson.test)', 'ci = res.proportion_ci(method="exact")',
      'to_irr = lambda p: p / (1 - p) * t0 / t1 if p < 1 else np.inf',
      'est = (a / t1) / (c0 / t0) if c0 > 0 else np.inf', 'lo, hi = to_irr(ci.low), to_irr(ci.high)', 'p_main = res.pvalue',
      'ird = a / t1 - c0 / t0', 'ird_se = np.sqrt(a / t1 ** 2 + c0 / t0 ** 2)',
      'print(f"rates {a / t1:.6g} and {c0 / t0:.6g}; rate ratio {est:.4f} (95% CI {lo:.4f} to {hi:.4f}); exact p = {p_main:.4g}")'],
  };
};

G.epmatch = (s) => ({
  title: 'Matched case-control pairs (1:1): matched odds ratio', data: false, pyPkgs: ['statsmodels'], pyImports: ['from statsmodels.stats.contingency_tables import mcnemar'],
  r: [`tab <- matrix(c(${s.e}, ${s.f}, ${s.g}, ${s.h}), nrow = 2, byrow = TRUE,   # pairs`, '              dimnames = list(Case = c("Exposed", "Unexposed"), Control = c("Exposed", "Unexposed")))', 'tab',
    'f <- tab[1, 2]; g <- tab[2, 1]   # discordant pairs', 'est <- f / g   # matched odds ratio',
    'bt <- binom.test(f, f + g)   # exact, conditional on the discordant pairs', 'lo <- bt$conf.int[1] / (1 - bt$conf.int[1]); hi <- bt$conf.int[2] / (1 - bt$conf.int[2])',
    'mc <- mcnemar.test(tab)   # continuity corrected', 'p_main <- if (f + g < 25) bt$p.value else mc$p.value   # exact below 25 discordant pairs, as the app',
    'c(odds_ratio = est, lower = lo, upper = hi, p = p_main)'],
  py: [`tab = np.array([[${s.e}, ${s.f}], [${s.g}, ${s.h}]])  # pairs: rows case exposed, unexposed; columns control exposed, unexposed`,
    'f, g = int(tab[0, 1]), int(tab[1, 0])  # discordant pairs', 'est = f / g if g > 0 else np.inf  # matched odds ratio',
    'bt = stats.binomtest(f, f + g)', 'ci = bt.proportion_ci(method="exact")', 'lo, hi = ci.low / (1 - ci.low), (ci.high / (1 - ci.high) if ci.high < 1 else np.inf)',
    'mc = mcnemar(tab, exact=False, correction=True)', 'p_main = bt.pvalue if f + g < 25 else mc.pvalue  # exact below 25 discordant pairs, as the app',
    'print(f"matched odds ratio {est:.4f} (95% CI {lo:.4f} to {hi:.4f}); p = {p_main:.4g}")'],
});

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
