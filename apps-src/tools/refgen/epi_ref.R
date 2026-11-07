# Reference values for engine/epi.js from R: stats (binom.test, poisson.test, fisher.test,
# chisq.test, mcnemar.test, prop.test), epiR (epi.2by2) and epitools (oddsratio.midp,
# rateratio.midp, rateratio.wald). Writes tests/ref/epi.json.
# fisher.test and epitools find their limits with uniroot's default tolerance (about 1e-4), so the
# tests hold them to 2e-3; tight values for the exact odds ratio come from SciPy (epi_ref.py).
# epiR's score intervals for the risk and prevalence ratio are not used: in epiR 2.0.67 they are
# computed from a mis-ordered table (for 13/2176 against 5/3354 the "score" ratio is 1.84, not 4.01).
# Run from apps-src/: Rscript --vanilla tools/refgen/epi_ref.R
# Needs R with epiR and epitools (Ubuntu: r-cran-epir, r-cran-epitools).
suppressMessages({ library(epiR); library(epitools); library(jsonlite) })

num <- function(x) { x <- as.numeric(x); ifelse(is.infinite(x), ifelse(x > 0, 1e308, -1e308), x) }
ci95 <- function(v) c(num(v[1]), num(v[2]))

# Mid-p exact CI for the odds ratio, written from the definition (noncentral hypergeometric), so
# zero cells and very large ratios are covered where epitools' bracketing interval runs out.
midp_or <- function(a, b, c, d, conf = 0.95) {
  m <- a + c; n <- b + d; k <- a + b
  lo <- max(0, k - n); hi <- min(k, m); xs <- lo:hi
  ld <- lchoose(m, xs) + lchoose(n, k - xs)
  tails <- function(l) { e <- ld + l * xs; w <- exp(e - max(e)); w <- w / sum(w)
    c(sum(w[xs < a]), sum(w[xs == a]), sum(w[xs > a])) }
  al <- (1 - conf) / 2
  L <- if (a == lo) 0 else exp(uniroot(function(l) { t <- tails(l); t[3] + t[2] / 2 - al }, c(-60, 60), tol = 1e-13)$root)
  U <- if (a == hi) Inf else exp(uniroot(function(l) { t <- tails(l); t[1] + t[2] / 2 - al }, c(-60, 60), tol = 1e-13)$root)
  t0 <- tails(0)
  list(ci = c(L, U), p = min(1, 2 * min(t0[1] + t0[2] / 2, t0[3] + t0[2] / 2)))
}

# Mid-p exact CI for a binomial proportion, from the definition.
midp_binom <- function(x, n, conf = 0.95) {
  al <- (1 - conf) / 2
  lo <- if (x == 0) 0 else uniroot(function(p) pbinom(x, n, p, lower.tail = FALSE) + dbinom(x, n, p) / 2 - al, c(0, 1), tol = 1e-15)$root
  hi <- if (x == n) 1 else uniroot(function(p) pbinom(x - 1, n, p) + dbinom(x, n, p) / 2 - al, c(0, 1), tol = 1e-15)$root
  c(lo, hi)
}

# Delta-method variance of log(1 - PAF) for a cohort that samples the population (multinomial),
# computed numerically: an independent check of Jewell's closed form.
delta_paf <- function(a, b, c, d) {
  L <- function(v) { N <- sum(v); log(v[3] * N / ((v[3] + v[4]) * (v[1] + v[3]))) }
  v <- c(a, b, c, d); g <- numeric(4); h <- 1e-6
  for (i in 1:4) { up <- v; dn <- v; up[i] <- up[i] + h; dn[i] <- dn[i] - h; g[i] <- (L(up) - L(dn)) / (2 * h) }
  N <- sum(v); S <- diag(v) - outer(v, v) / N
  as.numeric(t(g) %*% S %*% g)
}

two <- function(t, design) {
  a <- t[1]; b <- t[2]; c <- t[3]; d <- t[4]
  mat <- matrix(c(a, b, c, d), nrow = 2, byrow = TRUE)
  out <- list(t = list(c(a, b), c(c, d)), design = design)
  method <- switch(design, cohort = "cohort.count", cross = "cross.sectional", "case-control" = "case.control")
  e <- suppressWarnings(epi.2by2(as.table(mat), method = method, conf.level = 0.95, units = 1, outcome = "as.columns"))$massoc.detail
  g <- function(x) c(num(x$est), num(x$lower), num(x$upper))
  ft <- fisher.test(mat)
  out$or <- list(wald = g(e$OR.strata.wald), exact = ci95(ft$conf.int), cmle = num(ft$estimate))
  mp <- midp_or(a, b, c, d)
  out$or$midp <- ci95(mp$ci)
  if (a > 0 && b > 0 && c > 0 && d > 0) {
    # epitools wants rows unexposed then exposed, columns no outcome then outcome.
    ep <- suppressWarnings(oddsratio.midp(matrix(c(d, b, c, a), 2, 2), interval = c(0, 1e5)))
    out$or$midpEpitools <- ci95(ep$measure[2, 2:3])
  }
  out$tests <- list(
    chi2 = num(suppressWarnings(chisq.test(mat, correct = FALSE))$statistic), p = num(suppressWarnings(chisq.test(mat, correct = FALSE))$p.value),
    chi2Yates = num(suppressWarnings(chisq.test(mat, correct = TRUE))$statistic), pYates = num(suppressWarnings(chisq.test(mat, correct = TRUE))$p.value),
    pFisher = num(ft$p.value), pMidp = num(mp$p))
  if (design == "case-control") {
    out$afe <- g(e$AFest.strata.wald)      # (OR - 1) / OR from fisher.test's conditional MLE and exact limits
    out$paf <- g(e$PAFest.strata.wald)     # Miettinen's formula with Jewell's variance
  } else {
    out$rr <- list(wald = g(if (design == "cross") e$PR.strata.wald else e$RR.strata.wald))
    out$rd <- list(wald = g(e$ARisk.strata.wald))
    out$afe <- g(e$AFRisk.strata.wald)
    out$paf <- g(e$PAFRisk.strata.wald)
    out$pafVarDelta <- if (c > 0) delta_paf(a, b, c, d) else NULL
    out$r1 <- list(wilson = ci95(prop.test(a, a + b, correct = FALSE)$conf.int), exact = ci95(binom.test(a, a + b)$conf.int))
  }
  out
}

tables <- list(
  list(c(13, 2163, 5, 3349), "cohort"),
  list(c(40, 60, 20, 80), "cohort"),
  list(c(30, 70, 10, 90), "cohort"),      # risk difference exactly 0.2: NNT 5
  list(c(10, 90, 30, 70), "cohort"),      # protective
  list(c(12, 38, 6, 44), "cohort"),
  list(c(60, 140, 30, 170), "cross"),
  list(c(25, 15, 75, 85), "case-control"),
  list(c(647, 622, 2, 27), "case-control"),
  list(c(15, 35, 30, 20), "case-control"), # protective
  list(c(3, 7, 1, 9), "cohort"),
  list(c(0, 10, 5, 15), "cohort"),
  list(c(6, 4, 0, 10), "cohort")
)
twos <- lapply(tables, function(x) two(x[[1]], x[[2]]))

# Person-time: events and person-time in exposed and unexposed.
pt <- function(a, t1, c, t0) {
  pr <- poisson.test(c(a, c), c(t1, t0))
  out <- list(a = a, t1 = t1, c = c, t0 = t0, est = num(pr$estimate), exact = ci95(pr$conf.int), pExact = num(pr$p.value))
  if (a > 0 && c > 0) {
    m <- rateratio.midp(c(c, a, t0, t1)); w <- rateratio.wald(c(c, a, t0, t1))
    out$midpEpitools <- ci95(m$measure[2, 2:3]); out$pMidpEpitools <- num(m$p.value[2, 1]); out$wald <- ci95(w$measure[2, 2:3])
  }
  # Exact CI for the population fraction: 1 - PAF = (1 - a/m) T / t0 with the exact binomial CI of a/m.
  m <- a + c; TT <- t1 + t0; bt <- binom.test(a, m)$conf.int
  out$pafExact <- c(1 - (1 - a / m) * TT / t0, 1 - (1 - bt[1]) * TT / t0, 1 - (1 - bt[2]) * TT / t0)
  out$midpBinom <- midp_binom(a, m)
  out
}
pts <- list(pt(136, 22050, 1709, 127650), pt(41, 28010, 15, 19017), pt(4, 1000, 1, 2500), pt(0, 1200, 6, 3400), pt(9, 3100, 0, 800))

# Matched pairs: f case exposed only, g control exposed only.
mp <- function(e, f, g, h) {
  bt <- binom.test(f, f + g)
  mc <- mcnemar.test(matrix(c(e, g, f, h), 2, 2), correct = TRUE)
  mpb <- midp_binom(f, f + g)
  list(e = e, f = f, g = g, h = h, exact = ci95(bt$conf.int / (1 - bt$conf.int)), pExact = num(bt$p.value),
       chi2 = num(mc$statistic), p = num(mc$p.value), midp = ci95(mpb / (1 - mpb)))
}
mps <- list(mp(20, 30, 10, 40), mp(5, 9, 2, 14), mp(10, 6, 0, 30))

# Single proportions and rates.
props <- lapply(list(c(17, 120), c(0, 25), c(25, 25), c(3, 1000)), function(v)
  list(x = v[1], n = v[2], wilson = ci95(prop.test(v[1], v[2], correct = FALSE)$conf.int), exact = ci95(binom.test(v[1], v[2])$conf.int), midp = midp_binom(v[1], v[2])))
rates <- lapply(list(c(17, 3456.5), c(0, 1200), c(240, 1e5), c(1, 0.5)), function(v)
  list(x = v[1], t = v[2], exact = ci95(poisson.test(v[1], v[2])$conf.int)))

ref <- list(source = "R stats, epiR 2.0.67, epitools 0.5-10.1", two = twos, pt = pts, matched = mps, props = props, rates = rates)
writeLines(toJSON(ref, digits = NA, auto_unbox = TRUE, null = "null"), "tests/ref/epi.json")
cat("wrote tests/ref/epi.json\n")
