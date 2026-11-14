# Reference values for Mantel-Haenszel and Peto pooling in engine/meta.js, from metafor's rma.mh and
# rma.peto (default arguments: add = 1/2, to = "only0", drop00 = TRUE for the study effects).
# Writes tests/ref/meta_mh.json.   Run from apps-src/: Rscript --vanilla tools/refgen/meta_mh_ref.R
suppressMessages({ library(metafor); library(jsonlite) })

num <- function(x) as.numeric(x)

fit <- function(m) list(y = num(m$beta), se = num(m$se), ci = num(c(m$ci.lb, m$ci.ub)), p = num(m$pval),
                        Q = num(m$QE), pQ = num(m$QEp), I2 = num(m$I2) / 100, weights = num(weights(m)) / 100)

one <- function(counts, groups = NULL) {
  e1 <- sapply(counts, `[`, 1); n1 <- sapply(counts, `[`, 2); e2 <- sapply(counts, `[`, 3); n2 <- sapply(counts, `[`, 4)
  out <- list(counts = counts)
  for (ms in c("OR", "RR", "RD")) out[[paste0("mh", ms)]] <- fit(rma.mh(ai = e1, n1i = n1, ci = e2, n2i = n2, measure = ms))
  out$peto <- fit(rma.peto(ai = e1, n1i = n1, ci = e2, n2i = n2))
  if (!is.null(groups)) {
    out$groups <- groups
    for (ms in c("OR", "RR", "RD")) {
      parts <- lapply(unique(groups), function(g) { i <- groups == g; rma.mh(ai = e1[i], n1i = n1[i], ci = e2[i], n2i = n2[i], measure = ms) })
      b <- sapply(parts, function(m) num(m$beta)); s <- sapply(parts, function(m) num(m$se))
      out[[paste0("sub", ms)]] <- list(y = b, se = s, Q = num(rma(yi = b, sei = s, method = "FE")$QE))
    }
    parts <- lapply(unique(groups), function(g) { i <- groups == g; rma.peto(ai = e1[i], n1i = n1[i], ci = e2[i], n2i = n2[i]) })
    b <- sapply(parts, function(m) num(m$beta)); s <- sapply(parts, function(m) num(m$se))
    out$subPeto <- list(y = b, se = s, Q = num(rma(yi = b, sei = s, method = "FE")$QE))
  }
  out
}

sets <- list(
  # The meta-analysis tool's illustrative example, with its two subgroups.
  one(list(c(18, 120, 30, 118), c(25, 210, 41, 205), c(9, 64, 12, 60), c(40, 300, 52, 310), c(12, 95, 25, 90), c(30, 150, 31, 148), c(7, 80, 16, 82)),
      c("Facility", "Community", "Facility", "Community", "Facility", "Community", "Facility")),
  # Rare events, zero cells and one study with no events in either group.
  one(list(c(0, 50, 2, 48), c(1, 40, 0, 42), c(0, 30, 0, 31), c(3, 100, 7, 98), c(2, 60, 5, 61))),
  # Unbalanced arms and a large effect, where Peto's method is biased.
  one(list(c(12, 40, 3, 120), c(9, 35, 2, 110), c(15, 50, 6, 150)))
)
writeLines(toJSON(list(source = "metafor rma.mh and rma.peto", sets = sets), digits = NA, auto_unbox = TRUE), "tests/ref/meta_mh.json")
cat("wrote tests/ref/meta_mh.json\n")
