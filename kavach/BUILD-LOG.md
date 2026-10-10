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

## 2026-10-10 · session 2 · chunk 6
- Development (`data/50-dev.js`, `modules/60-dev.js`): seven age bands (2–3 m … 3 y) with the card's milestones, parenting tips and warning signs in English (national card) and Odia (Odisha card); corrected age for preterm babies under 2 years; mother's ticks; ASHA/AWW warning-sign check; any warning sign → DEIC referral callout, due item and card pill until a DEIC visit date is entered.
- Feeding (`data/51-feed.js`, `modules/61-feed.js`): stage for the child's age open, other ages folded, general tips, read-aloud, the Odisha card's "never brand (chenk) a child" warning.
- HBYC (`modules/62-hbyc.js`): visits at 3/6/9/12/15 months with the card's checklist rows per visit, rows pre-filled from the record (weight in the last 30 days, MR-1, Vitamin A, development warning), "child sick" → sick-child screen.
- IFA syrup (`modules/63-ifa.js`): twice-weekly days from settings (Odisha Tue + Fri), 8-week grid, last-4-weeks adherence, bottle dates and next-bottle reminder, due item on syrup days.
- Sick child (`modules/64-sick.js`): danger signs first (newborn or child set by age) with 108/102 buttons, diarrhoea (ORS, zinc dose by age, 14-day zinc tracker), pneumonia signs and cut-offs, fever (incl. malaria RDT in endemic areas), breath counter at `/tools/breath` (60-second timer with tap counting or typed count).
- Child overview now shows status tiles (development, feeding, IFA syrup, home visits, sick child).
- Router: `#/path#anchor` links no longer break route matching (`K.anchor()`).
- Checked in Chromium at 393×851 in English and Odia: 10-month girl (milestone ticks, warning sign → DEIC, HBYC 9-month visit marked sick → sick screen, zinc tracker, breath count 55 at 2–12 m → fast), 40-day preterm boy (newborn danger set, "too young" development note), IFA day switched to Wed/Sat → "IFA syrup today" on Home.

## 2026-10-10 · session 2 · chunk 7
- Learn library (`data/60-learn.js`, `modules/70-learn.js`): 12 topics (danger signs, care in pregnancy, birth and after, newborn care, breastfeeding and food, vaccines, growth, play and development, diarrhoea/pneumonia/fever, iron and anaemia, family planning, hygiene and malaria) built from content already in the app plus the Odisha card's anaemia do's and don'ts (p.43) and the national card's newborn-care list (p.7).
- Reading mode with read-aloud per card; counselling flipbook (`#/learn/<topic>/flip/<n>`: one large card per screen, swipe, arrow keys, progress dots); search across all cards; danger-sign set pages with 108/102/104 buttons.
- Odia written for the app (not on the card) is listed in the data-file headers for the review sheet.
- Checked in Chromium at 393×851, English and Odia: hub, search ("zinc" → sick-child card), topic pages, flipbook next/arrow/swipe, danger sets.

## 2026-10-10 · session 2 · chunk 8
- Tools tab (`modules/80-tools.js`): EDD and weeks (LMP / ultrasound / known EDD, key dates incl. next PMSMA), high-risk quick check (the card's HRP list, nothing saved), anaemia (WHO cut-offs by group, AMB treatment by group and weight band, severe-anaemia referral by gestation, iron cautions in thalassaemia / sickle cell), vaccine due dates from a date of birth, growth z-scores (same engine as the card), corrected age, ORS/zinc with the IMNCI dehydration check (Plan B volume from weight), IFA and deworming doses by age.
- `K.growth.resultHtml` takes `{ stats }` so the z-score tool can show its own table.
- Checked in Chromium (English and Odia) with worked examples: LMP −168 d → 24w0d; scan 12w3d 70 days ago → EDD matches scan + 193 d; pregnant Hb 8.5 → moderate, 2 tablets; Hb 6.2 at 36 weeks → admit; 6–59 m Hb 9.5 at 9 kg → 1 ml, at 12 kg → 1.5 ml; 5–9 y 20 kg → 60 mg/day; girl 10 m 6.05 kg 66 cm → WAZ −2.85, WLZ −2.15 (MAM); 32-week baby at 120 days → corrected 64 days; 9 kg with some dehydration → 680 ml over 4 h.

## 2026-10-10 · session 2 · chunk 9
- Due tab (`modules/92-due.js`): all cards, grouped overdue / today / 7 days / 30 days / 90 days, filters (pregnancy, children, vaccines); providers now receive a horizon so long lists include upcoming vaccines, HBYC visits and the EDD. Calendar export: RFC 5545 .ics, all-day events with a reminder the evening before, lines folded at 73 octets (Odia-safe).
- Helplines and schemes (`modules/93-help.js`): call list, local contacts from the cards, JSSK, JSY, MAMATA-PMMVY, PMSMA/e-PMSMA, SUMAN, ₹500 drop-back, NRC, RBSK/DEIC, Kilkari, family-planning incentives — each with its source and checked date. PMMVY helpline updated to 1515.
- Print view (`modules/94-print.js`): A4 summary of a card (mother, contacts, pregnancy with ANC table, children with vaccines given, pending doses, last weight); print CSS hides the app chrome.
- Sample family (`modules/95-sample.js`): mother at 26 weeks with moderate anaemia and a 14-month-old girl with full records; no phone numbers.
- Fixed: birth-plan item key "facility" overwrote the hospital name (renamed to "hospital").
- Checked in Chromium (English and Odia): sample load, Due tab and filters, .ics download (6 events, max line 64 octets), help accordions, print view on screen and in print media, PDF render.
