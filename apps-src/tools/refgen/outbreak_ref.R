# Reference values for engine/outbreak.js from R, on the example wedding-lunch outbreak:
# the epidemic curve counted with cut() on POSIXct times (3-hour intervals from the lunch, and days),
# the incubation period (median, type 7 quartiles, geometric mean and Sartwell's dispersion factor),
# attack rates by age group with prop.test's Wilson interval, and the food-specific table with epiR's
# epi.2by2 (Katz interval for the risk ratio), chisq.test (Yates) and fisher.test.
# Run from apps-src/: node tools/refgen/outbreak_input.mjs, then Rscript --vanilla tools/refgen/outbreak_ref.R
suppressMessages({ library(epiR); library(jsonlite) })
d <- read.csv("tests/ref/outbreak_example.csv", check.names = FALSE, na.strings = c("", "NA"))
case <- d$Ill == "Yes"
onset <- as.POSIXct(paste(d$Onset_date, d$Onset_time), format = "%d/%m/%Y %H:%M", tz = "UTC")
timed <- case & !is.na(onset)
meal <- as.POSIXct("2026-03-14 13:00", tz = "UTC")

curve <- function(t, by_secs, include) {
  lo <- min(c(t, include)); hi <- max(c(t, include))
  base <- as.POSIXct(format(lo, "%Y-%m-%d"), tz = "UTC")
  start <- base + floor(as.numeric(difftime(lo, base, units = "secs")) / by_secs) * by_secs - by_secs
  breaks <- seq(start, by = by_secs, length.out = ceiling(as.numeric(difftime(hi, start, units = "secs")) / by_secs) + 2)
  tab <- table(cut(t, breaks = breaks, right = FALSE))
  list(starts = format(head(breaks, -1), "%Y-%m-%d %H:%M"), counts = as.integer(tab))
}
day <- as.POSIXct(as.Date(d$Onset_date[case], format = "%d/%m/%Y"), tz = "UTC")

h <- as.numeric(difftime(onset[timed], meal, units = "hours"))
h <- h[h > 0]

ag <- split(case, d$Age_group)
wil <- function(x, n) suppressWarnings(prop.test(x, n, correct = FALSE)$conf.int)
attack <- lapply(names(ag), function(g) { x <- sum(ag[[g]]); n <- length(ag[[g]]); list(group = g, cases = x, n = n, ar = x / n, ci = as.numeric(wil(x, n))) })

foods <- c("Rice", "Dal", "Mutton_curry", "Mixed_veg", "Kheer", "Curd_raita", "Water")
food <- lapply(foods, function(f) {
  ate <- d[[f]] == "Yes"
  a <- sum(ate & case); b <- sum(ate & !case); c <- sum(!ate & case); dd <- sum(!ate & !case)
  m <- matrix(c(a, c, b, dd), 2)
  e <- epi.2by2(as.table(matrix(c(a, b, c, dd), nrow = 2, byrow = TRUE)), method = "cohort.count")
  rr <- unlist(e$massoc.detail$RR.strata.wald[1, c("est", "lower", "upper")])
  list(item = f, cells = c(a, b, c, dd), rr = as.numeric(rr), pYates = suppressWarnings(chisq.test(m, correct = TRUE)$p.value), pFisher = fisher.test(m)$p.value,
    minExpected = min(suppressWarnings(chisq.test(m)$expected)))
})

out <- list(
  source = paste("R", getRversion(), "with epiR", packageVersion("epiR")),
  curve3h = curve(onset[timed], 3 * 3600, meal),
  curve1d = curve(day, 86400, meal),
  untimed = sum(case & is.na(onset)),
  incubation = list(n = length(h), median = median(h), q1 = unname(quantile(h, 0.25, type = 7)), q3 = unname(quantile(h, 0.75, type = 7)),
    min = min(h), max = max(h), mean = mean(h), sd = sd(h), geo = exp(mean(log(h))), disp = exp(sd(log(h)))),
  attack = attack, total = list(cases = sum(case), n = nrow(d), ci = as.numeric(wil(sum(case), nrow(d)))),
  food = food
)
writeLines(toJSON(out, digits = NA, auto_unbox = TRUE), "tests/ref/outbreak.json")
cat("wrote tests/ref/outbreak.json\n")
