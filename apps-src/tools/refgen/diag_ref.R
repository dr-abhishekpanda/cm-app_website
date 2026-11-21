# Reference values for engine/diag.js from R: prop.test (Wilson) and binom.test (Clopper-Pearson) for
# sensitivity, specificity and predictive values; epiR's epi.tests for the likelihood ratios (Simel's
# log interval) and the diagnostic odds ratio; fisher.test for its exact interval; pROC for ROC curves
# (coordinates, AUC, DeLong's variance and CI, Youden and closest-to-top-left cut-offs, the direction it
# picks by itself, DeLong's tests for paired and unpaired curves). Reads tests/ref/diag_input.json (node tools/refgen/diag_input.mjs).
# Writes tests/ref/diag.json.   Run from apps-src/: Rscript --vanilla tools/refgen/diag_ref.R
suppressMessages({ library(epiR); library(pROC); library(jsonlite) })

inp <- fromJSON("tests/ref/diag_input.json", simplifyVector = TRUE)
num <- function(x) { x <- as.numeric(x); ifelse(is.infinite(x), ifelse(x > 0, 1e308, -1e308), x) }
pr <- function(x, n) {
  if (n == 0) return(NULL)
  list(est = x / n, wilson = num(prop.test(x, n, correct = FALSE)$conf.int), exact = num(binom.test(x, n)$conf.int))
}

tables <- lapply(seq_len(nrow(inp$tables)), function(i) {
  t <- inp$tables[i, ]; tp <- t[1]; fp <- t[2]; fn <- t[3]; tn <- t[4]
  out <- list(t = t, se = pr(tp, tp + fn), sp = pr(tn, fp + tn), ppv = pr(tp, tp + fp), npv = pr(tn, fn + tn),
              prev = pr(tp + fn, sum(t)), acc = pr(tp + tn, sum(t)))
  e <- tryCatch(suppressWarnings(epi.tests(as.table(matrix(c(tp, fp, fn, tn), nrow = 2, byrow = TRUE)), method = "wilson", digits = 4))$detail,
                error = function(err) NULL)
  if (!is.null(e)) {
    g <- function(s) num(unlist(e[e$statistic == s, c("est", "lower", "upper")]))
    out$epiR <- list(lrPos = g("lr.pos"), lrNeg = g("lr.neg"), dor = g("diag.or"), youden = g("youden"))
  }
  if (min(tp + fp, fn + tn, tp + fn, fp + tn) > 0) {
    f <- fisher.test(matrix(c(tp, fn, fp, tn), nrow = 2))
    out$dorExact <- num(f$conf.int); out$dorCmle <- num(f$estimate)
  }
  out
})

rocOne <- function(y, x, d) {
  r <- roc(y, x, levels = c(0, 1), direction = d, quiet = TRUE)
  all <- coords(r, "all", ret = c("threshold", "sensitivity", "specificity"), transpose = FALSE)
  yo <- coords(r, "best", best.method = "youden", ret = c("threshold", "sensitivity", "specificity"), transpose = FALSE)
  tl <- coords(r, "best", best.method = "closest.topleft", ret = c("threshold", "sensitivity", "specificity"), transpose = FALSE)
  list(auc = num(auc(r)), var = num(var(r, method = "delong")), ci = num(ci.auc(r, method = "delong"))[c(1, 3)],
       se = num(all$sensitivity), sp = num(all$specificity), threshold = num(all$threshold),
       youden = list(threshold = num(yo$threshold), se = num(yo$sensitivity), sp = num(yo$specificity)),
       topleft = list(threshold = num(tl$threshold), se = num(tl$sensitivity), sp = num(tl$specificity)), roc = r)
}

rocs <- lapply(seq_len(nrow(inp$rocSets)), function(i) {
  s <- inp$rocSets[i, ]
  o <- rocOne(unlist(s$y), unlist(s$x), s$direction); o$roc <- NULL
  o$auto <- roc(unlist(s$y), unlist(s$x), levels = c(0, 1), quiet = TRUE)$direction   # pROC's own choice when none is given
  c(list(name = s$name), o)
})

paired <- lapply(seq_len(nrow(inp$paired)), function(i) {
  s <- inp$paired[i, ]
  # A marker whose lower values mean disease is negated, so both curves point the same way (pROC warns otherwise).
  y <- unlist(s$y); a <- unlist(s$a) * ifelse(s$dirA == ">", -1, 1); b <- unlist(s$b) * ifelse(s$dirB == ">", -1, 1)
  ra <- roc(y, a, levels = c(0, 1), direction = "<", quiet = TRUE); rb <- roc(y, b, levels = c(0, 1), direction = "<", quiet = TRUE)
  t <- roc.test(ra, rb, method = "delong", paired = TRUE)
  list(name = s$name, aucA = num(auc(ra)), aucB = num(auc(rb)), varA = num(var(ra)), varB = num(var(rb)), cov = num(cov(ra, rb, method = "delong")),
       z = num(t$statistic), p = num(t$p.value), ci = num(t$conf.int))
})

unpaired <- lapply(seq_len(nrow(inp$unpaired)), function(i) {
  s <- inp$unpaired[i, ]
  r1 <- roc(unlist(s$y1), unlist(s$x1), levels = c(0, 1), direction = s$direction, quiet = TRUE)
  r2 <- roc(unlist(s$y2), unlist(s$x2), levels = c(0, 1), direction = s$direction, quiet = TRUE)
  t <- roc.test(r1, r2, method = "delong", paired = FALSE)
  list(name = s$name, auc1 = num(auc(r1)), auc2 = num(auc(r2)), var1 = num(var(r1)), var2 = num(var(r2)),
       z = num(t$statistic), p = num(t$p.value), ci = if (is.null(t$conf.int)) NULL else num(t$conf.int))
})

writeLines(toJSON(list(source = paste("R", getRversion(), "with epiR", packageVersion("epiR"), "and pROC", packageVersion("pROC")),
                       tables = tables, rocs = rocs, paired = paired, unpaired = unpaired), digits = NA, auto_unbox = TRUE, null = "null"),
           "tests/ref/diag.json")
cat("wrote tests/ref/diag.json\n")
