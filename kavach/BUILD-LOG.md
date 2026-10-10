# Build log — Maa 'o' Shishu Kavach

## 2026-10-09 · session 1 · chunks 0–2
- Sources: national MCP Card 2018 (English text) and Odisha MCP Card V-2023-24. The Odisha booklet uses legacy Akruti Ori Sarala fonts; `tools/akruti_to_unicode.py` + `tools/extract_odia_pdf.py` convert it to Unicode at glyph level (unmapped glyph ids 98/110/111 = ଞ୍ଚ / ଣ୍ଟ / ତ୍ତ). Output: `docs/sources/odisha-mcp-v2023-24.or.txt` (pages where the text was converted to outlines were read from the page images instead).
- Built: build script (single-file output), shell (top bar with language toggle + SOS, tab bar), onboarding, settings, about, recently deleted, backup/restore (JSON, share, merge-by-newer), card home/new/dashboard/profile, pregnancy registration, overview with GA ring, ANC schedule + visit form with live flags, HRP checklist (Odisha codes, auto-derived from records, manual override, red card), Td/albendazole form, IFA & calcium daily trackers, tests, birth plan, care advice, due providers.
- Checked in Chromium at 393×851: onboarding, home, settings, card creation, pregnancy flow, ANC flags (BP 146/96 + albumin + headache → pre-eclampsia flag; FH 29 cm at 24 wk → ±4 cm flag), HRP banner, trackers.
- Push was first blocked (Claude GitHub App not installed on the repo); access was fixed the same day and `feature/kavach` is on GitHub.

## 2026-10-09 · session 1 (cont.) · chunk 3
- Delivery record (up to 3 babies → child records), PNC/HBNC schedule (institutional 3/7/14/21/28/42; home delivery adds day 1; SNCU discharge resets the base), mother and newborn checks with flags, postpartum IFA/calcium trackers, family-planning chooser with Odisha incentives (booklet p.42), child record with corrected age, LBW/KMC advice and ROP screening reminder.

## 2026-10-10 · session 2 · chunks 4–5
- Immunisation (`data/30-vaccines.js`, `modules/40-vax.js`): UIP schedule with catch-up limits, statuses given/due/overdue/upcoming/waiting/missed/not needed, visit groups that fold (open = due now + next visit), "mark these given" for a session (Vitamin A dose 1 sits in the 9-month group and dose 2 in the 16–24-month group, as on the Odisha card p.28), early-dose and missing-previous-dose warnings (confirm, not block), missed-dose register, FIC/CIC, Vitamin A + albendazole list, four key messages, U-WIN link.
- Growth (`data/40-who-lms.js` generated, `modules/50-growth.js`): WAZ/HAZ/WLZ-WHZ/BAZ/HCZ with the WHO restricted method beyond ±3 SD for weight-based indicators, ±0.7 cm length/height switch at 731 days, corrected age for preterm babies under 2 years, MUAC and oedema → SAM/MAM, faltering check, SVG charts (0–1/0–2/0–5 y), zone and growth-line legends worded as on the Odisha card (p.27).
- Fixed: `K.formData` returned a boolean for a single valued checkbox (now a list unless the checkbox has no value attribute).
- Checked in Chromium at 393×851, English and Odia: 10-month girl with an overdue 9-month visit (group marked, Vit-A 1 recorded), early MR-2 warning, growth form live preview, MAM + faltering, 2-year-4-month boy with SAM by MUAC; home Due list and card pills.
