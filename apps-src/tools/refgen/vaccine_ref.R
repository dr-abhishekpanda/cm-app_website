# Reference values for engine/vaccine.js from R: epiR's epi.2by2 (Katz and Woolf intervals for the risk
# and odds ratios), poisson.test (exact rate ratio), binom.test (exact interval for matched pairs and
# for the proportion of cases vaccinated), and glm for the screening method (Farrington's logistic
# model with logit coverage as an offset; Wald limits). VE = 1 - ratio throughout.
# Writes tests/ref/vaccine.json.   Run from apps-src/: Rscript --vanilla tools/refgen/vaccine_ref.R
suppressMessages({ library(epiR); library(jsonlite) })
num <- function(x) { x <- as.numeric(x); ifelse(is.infinite(x), ifelse(x > 0, 1e308, -1e308), x) }
ve <- function(r, ci) c(1 - r, 1 - ci[2], 1 - ci[1])

# [vaccinated cases, vaccinated non-cases (or controls), unvaccinated cases, unvaccinated non-cases]
cohort <- list(c(12, 288, 45, 155), c(3, 197, 20, 80), c(30, 970, 28, 972), c(14, 386, 62, 338))
cc <- list(c(40, 210, 95, 155), c(8, 60, 25, 40), c(120, 480, 160, 440))
two <- function(t, what) {
  e <- epi.2by2(as.table(matrix(t, nrow = 2, byrow = TRUE)), method = if (what == "RR") "cohort.count" else "case.control")
  m <- if (what == "RR") e$massoc.detail$RR.strata.wald else e$massoc.detail$OR.strata.wald
  r <- num(unlist(m[1, c("est", "lower", "upper")]))
  list(t = t, ratio = r, ve = ve(r[1], r[2:3]))
}
pt <- list(c(10, 5000, 40, 4000), c(2, 3000, 15, 2500), c(25, 8000, 30, 6000))
matched <- list(c(20, 8, 25, 47), c(5, 2, 12, 21), c(40, 15, 30, 15))
screen <- list(c(18, 60, 0.85), c(3, 25, 0.70), c(45, 50, 0.90), c(110, 200, 0.75))

out <- list(
  source = paste("R", getRversion(), "with epiR", packageVersion("epiR")),
  cohort = lapply(cohort, two, what = "RR"),
  cc = lapply(cc, two, what = "OR"),
  pt = lapply(pt, function(v) { p <- poisson.test(c(v[1], v[3]), c(v[2], v[4])); list(v = v, ratio = num(c(p$estimate, p$conf.int)), ve = ve(num(p$estimate), num(p$conf.int))) }),
  matched = lapply(matched, function(v) { b <- binom.test(v[2], v[2] + v[3])$conf.int; r <- b / (1 - b); list(v = v, ve = ve(v[2] / v[3], num(r))) }),
  screen = lapply(screen, function(v) {
    x <- v[1]; n <- v[2]; cov <- v[3]
    fit <- glm(cbind(x, n - x) ~ 1, family = binomial, offset = qlogis(cov), control = glm.control(epsilon = 1e-14, maxit = 100))   # tight convergence
    w <- 1 - exp(rev(as.numeric(confint.default(fit))))
    cp <- binom.test(x, n)$conf.int; toVE <- function(q) 1 - (q / (1 - q)) * ((1 - cov) / cov)
    list(v = v, est = 1 - exp(as.numeric(coef(fit))), logit = num(w), exact = num(c(toVE(cp[2]), toVE(cp[1]))))
  })
)
writeLines(toJSON(out, digits = NA, auto_unbox = TRUE), "tests/ref/vaccine.json")
cat("wrote tests/ref/vaccine.json\n")
