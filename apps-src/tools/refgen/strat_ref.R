# Reference values for engine/strat.js from R: mantelhaen.test and poisson.test (stats), epiR
# (epi.2by2 with strata), metafor (rma.mh for the Mantel-Haenszel estimates, the CMH and Tarone tests
# and the person-time test; rma with method = "FE" for the inverse-variance tests of homogeneity) and
# epitools (ageadjust.direct). Writes tests/ref/strat.json.
# Run from apps-src/: Rscript --vanilla tools/refgen/strat_ref.R
suppressMessages({ library(epiR); library(epitools); library(metafor); library(jsonlite) })

num <- function(x) { x <- as.numeric(x); ifelse(is.infinite(x), ifelse(x > 0, 1e308, -1e308), x) }

# strata: list of c(a, b, c, d); rows exposed / unexposed, columns outcome / no outcome.
tabs <- function(strata, design) {
  K <- length(strata)
  ai <- sapply(strata, `[`, 1); bi <- sapply(strata, `[`, 2); ci <- sapply(strata, `[`, 3); di <- sapply(strata, `[`, 4)
  arr <- array(NA, dim = c(2, 2, K))
  for (k in 1:K) arr[, , k] <- matrix(strata[[k]], 2, 2, byrow = TRUE)
  out <- list(strata = lapply(strata, function(s) list(c(s[1], s[2]), c(s[3], s[4]))), design = design)
  keep <- apply(arr, 3, sum) > 1
  mh <- mantelhaen.test(arr[, , keep, drop = FALSE], correct = TRUE)
  mhu <- mantelhaen.test(arr[, , keep, drop = FALSE], correct = FALSE)
  out$cmh <- list(chi2 = num(mh$statistic), p = num(mh$p.value), chi2Uncorrected = num(mhu$statistic), pUncorrected = num(mhu$p.value),
                  or = num(mh$estimate), orCi = num(mh$conf.int))
  m <- rma.mh(ai = ai, bi = bi, ci = ci, di = di, measure = "OR", add = 0, to = "none", drop00 = FALSE)
  out$metaforOR <- list(est = num(exp(m$beta)), se = num(m$se), ci = num(exp(c(m$ci.lb, m$ci.ub))), cmh = num(m$MH), pCmh = num(m$MHp),
                        tarone = num(m$TA), pTarone = num(m$TAp))
  method <- switch(design, cohort = "cohort.count", cross = "cross.sectional", "case-control" = "case.control")
  # epiR stops on some sparse tables (its per-stratum score intervals); then it is simply not used.
  e <- tryCatch(suppressWarnings(epi.2by2(as.table(arr), method = method, conf.level = 0.95, units = 1, outcome = "as.columns"))$massoc.detail,
                error = function(err) NULL)
  g <- function(x) c(num(x$est), num(x$lower), num(x$upper))
  out$epiR <- if (is.null(e)) NULL else list(or = g(e$OR.mh.wald))
  if (design != "case-control") {
    mr <- rma.mh(ai = ai, bi = bi, ci = ci, di = di, measure = "RR", add = 0, to = "none", drop00 = FALSE)
    md <- rma.mh(ai = ai, bi = bi, ci = ci, di = di, measure = "RD", add = 0, to = "none", drop00 = FALSE)
    out$metaforRR <- list(est = num(exp(mr$beta)), se = num(mr$se))
    out$metaforRD <- list(est = num(md$beta), se = num(md$se))
    if (!is.null(e)) {
      out$epiR$rr <- g(if (design == "cross") e$PR.mh.wald else e$RR.mh.wald)
      if (!is.null(e$ARisk.mh.sato)) { out$epiR$rdSato <- g(e$ARisk.mh.sato); out$epiR$rdGR <- g(e$ARisk.mh.green) }
    }
    # Inverse-variance (Woolf) tests of homogeneity: metafor's equal-effects Q.
    n1 <- ai + bi; n0 <- ci + di
    ok <- ai > 0 & ci > 0 & n1 > 0 & n0 > 0
    if (sum(ok) >= 2) {
      f <- rma(yi = log((ai / n1) / (ci / n0))[ok], vi = (1 / ai - 1 / n1 + 1 / ci - 1 / n0)[ok], method = "FE")
      out$homogRR <- list(q = num(f$QE), p = num(f$QEp), k = sum(ok))
    }
    okd <- n1 > 0 & n0 > 0
    vrd <- (ai / n1) * (1 - ai / n1) / n1 + (ci / n0) * (1 - ci / n0) / n0
    okd <- okd & vrd > 0
    f <- rma(yi = (ai / n1 - ci / n0)[okd], vi = vrd[okd], method = "FE")
    out$homogRD <- list(q = num(f$QE), p = num(f$QEp), k = sum(okd))
  }
  out
}

sets <- list(
  # Confounding: exposure common in the older stratum, where the outcome is also more common.
  list(list(c(10, 90, 5, 95), c(60, 140, 15, 35)), "cohort"),
  # Effect modification: the ratio differs between strata.
  list(list(c(20, 80, 10, 90), c(12, 88, 30, 70), c(25, 75, 24, 76)), "cohort"),
  # Sparse strata with zero cells and an uninformative stratum (no unexposed).
  list(list(c(2, 3, 0, 5), c(1, 4, 1, 4), c(3, 2, 1, 6), c(0, 5, 0, 4), c(4, 0, 2, 3), c(2, 6, 0, 0)), "cohort"),
  # Cross-sectional.
  list(list(c(30, 70, 20, 80), c(45, 55, 35, 65)), "cross"),
  # Case-control, three age groups.
  list(list(c(12, 20, 8, 40), c(30, 25, 20, 45), c(40, 15, 30, 25)), "case-control"),
  # Case-control, protective and sparse.
  list(list(c(1, 9, 4, 6), c(2, 8, 5, 5), c(0, 7, 3, 4)), "case-control")
)
two <- lapply(sets, function(s) tabs(s[[1]], s[[2]]))

# Person-time strata: c(a, t1, c, t0).
pts <- function(strata) {
  x1 <- sapply(strata, `[`, 1); t1 <- sapply(strata, `[`, 2); x2 <- sapply(strata, `[`, 3); t2 <- sapply(strata, `[`, 4)
  m <- rma.mh(x1i = x1, t1i = t1, x2i = x2, t2i = t2, measure = "IRR", add = 0, to = "none", drop00 = FALSE)
  mc <- rma.mh(x1i = x1, t1i = t1, x2i = x2, t2i = t2, measure = "IRR", add = 0, to = "none", drop00 = FALSE, correct = FALSE)
  d <- rma.mh(x1i = x1, t1i = t1, x2i = x2, t2i = t2, measure = "IRD", add = 0, to = "none", drop00 = FALSE)
  out <- list(strata = lapply(strata, function(s) list(a = s[1], t1 = s[2], c = s[3], t0 = s[4])),
              irr = num(exp(m$beta)), se = num(m$se), ci = num(exp(c(m$ci.lb, m$ci.ub))), mh = num(m$MH), pMh = num(m$MHp),
              mhUncorrected = num(mc$MH), ird = num(d$beta), seIrd = num(d$se))
  ok <- x1 > 0 & x2 > 0
  if (sum(ok) >= 2) {
    f <- rma(yi = log((x1 / t1) / (x2 / t2))[ok], vi = (1 / x1 + 1 / x2)[ok], method = "FE")
    out$homog <- list(q = num(f$QE), p = num(f$QEp), k = sum(ok))
  }
  # epiR's layout per stratum: exposed cases, exposed person-time / unexposed cases, unexposed person-time.
  arr <- array(NA, dim = c(2, 2, length(strata)))
  for (k in seq_along(strata)) arr[, , k] <- matrix(c(x1[k], t1[k], x2[k], t2[k]), 2, 2, byrow = TRUE)
  e <- tryCatch(suppressWarnings(epi.2by2(as.table(arr), method = "cohort.time", conf.level = 0.95, units = 1))$massoc.detail, error = function(err) NULL)
  if (!is.null(e)) out$epiR <- c(num(e$IRR.mh.wald$est), num(e$IRR.mh.wald$lower), num(e$IRR.mh.wald$upper))
  out
}
ptl <- list(
  pts(list(c(12, 2400, 8, 3100), c(30, 1800, 22, 2600), c(41, 950, 25, 1100))),
  pts(list(c(3, 500, 1, 700), c(0, 300, 2, 450), c(5, 200, 4, 380), c(2, 90, 0, 60)))
)

# Direct standardisation: events, population and standard population per stratum.
dsr <- function(x, n, std) {
  r <- ageadjust.direct(count = x, pop = n, stdpop = std)
  list(x = x, n = n, std = std, crude = num(r[["crude.rate"]]), dsr = num(r[["adj.rate"]]), ci = num(c(r[["lci"]], r[["uci"]])))
}
who <- c(8.86, 8.69, 8.60, 8.47, 8.22, 7.93, 7.61, 7.15, 6.59, 6.04, 5.37, 4.55, 3.72, 2.96, 2.21, 1.52, 0.91, 0.44, 0.15, 0.04, 0.005)
direct <- list(
  dsr(c(4, 9, 16, 30, 52), c(5200, 4800, 3900, 2600, 1500), c(30000, 25000, 20000, 15000, 10000)),
  dsr(c(0, 2, 5, 11, 20), c(4100, 3900, 3000, 2100, 900), c(30000, 25000, 20000, 15000, 10000)),
  dsr(c(1, 0, 3, 7, 12, 15, 9), c(12000, 10000, 8000, 6500, 4200, 2500, 900), c(17.55, 16.69, 15.83, 13.63, 10.91, 6.17, 2.375)),
  dsr(rep(0, 4), c(1000, 900, 800, 700), c(25, 25, 25, 25)),
  dsr(c(0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 9, 8, 6, 3, 1, 0), rep(c(4000, 3000, 2000), 7), who)
)

# Indirect standardisation: observed events against expected.
smr <- function(o, e) { r <- poisson.test(o, e); list(o = o, e = e, smr = num(r$estimate), ci = num(r$conf.int), p = num(r$p.value)) }
indirect <- list(smr(25, 18.4), smr(7, 12.6), smr(0, 3.2), smr(140, 152.3), smr(3, 0.8), smr(12, 12))

ref <- list(source = "R stats, epiR 2.0.67, epitools, metafor", two = two, pt = ptl, direct = direct, indirect = indirect)
writeLines(toJSON(ref, digits = NA, auto_unbox = TRUE, null = "null"), "tests/ref/strat.json")
cat("wrote tests/ref/strat.json\n")
