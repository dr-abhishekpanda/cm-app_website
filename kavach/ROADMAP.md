# Roadmap — Maa 'o' Shishu Kavach

Each chunk ends with: build → Playwright check at phone size → BUILD-LOG entry → commit on `feature/kavach`.

| # | Chunk | Status |
|---|---|---|
| 0 | Foundations: sources, build script, shell, i18n, storage, router, UI kit, onboarding, settings, about | done |
| 1 | Family card core: home list, new card, dashboard, profile & contacts, backup/restore, share summary, recently deleted | done |
| 2 | Pregnancy: EDD/GA, ANC schedule + visit form with auto-flags, Odisha HRP checklist + red card, Td, IFA/calcium 180-day trackers, albendazole, tests, birth plan, care advice | done |
| 3 | Delivery & PNC: delivery record → child record, PNC/HBNC schedule (days 1/3/7/14/21/28/42), mother checks, postpartum danger signs, postpartum IFA/calcium, family planning chooser | done |
| 4 | Immunisation: UIP schedule engine with catch-up limits, tracker, Vitamin A + albendazole, AEFI advice, missed-dose list, FIC/CIC | done |
| 5 | Growth: WHO LMS tables, z-scores, SVG charts (WFA, L/HFA, WFL/H, HCFA), MUAC/SAM, faltering | done |
| 6 | Development & feeding: milestones + warning signs (2–3 m → 3 y), DEIC, parenting tips, feeding by age, HBYC, IFA syrup tracker, diarrhoea/pneumonia care, ROP reminder | done |
| 7 | Learn & counsel library, flipbook mode, read-aloud | done |
| 8 | Tools: EDD, vaccine due dates, z-score, anaemia + AMB doses, breath counter, ORS/zinc, IFA/albendazole doses, HRP quick screen, corrected age | done |
| 9 | Entitlements & helplines (dated sources), Due tab across cards, print view, calendar export, sample family | done |
| 10 | PWA (manifest, icons, service worker), QA, Odia review sheet, deploy notes, link from home page | done |
| 11 | Independent clinical audit and fixes: DPT catch-up, ORS danger signs, AMB June 2026, SNCU visit schedule, preterm growth, NIS windows, dating rule | done |
| 12 | Source review against latest versions: SSBSK 2026 home visits (HBNC/HBYC kept as a setting), 108 replaces 102 in Odisha, HPV drive note, ACOG reaffirmation, English quotes, full route sweep | done |

## Notes to carry forward
- Odisha IFA syrup days for children: Tuesday + Friday (national card: Wednesday + Saturday) — setting `ifaDays`.
- MAMATA-PMMVY (Odisha, from 1 Apr 2025): ₹10,000 (boy) / ₹12,000 (girl) in two instalments (₹6,000 after AWC registration + ≥1 ANC within 6 months of LMP; ₹4,000/₹6,000 after birth registration + vaccines up to 14 weeks). Source: wcd.odisha.gov.in/en/ICDS/mamata-pmmvy (checked 9 Oct 2026).
- HPV vaccine: single dose for girls aged 14, nationwide from 28 Feb 2026 (campaign; first UIP inclusion). Source: Gavi VaccinesWork, 13 Mar 2026.
- UIP limits (NIS table, Immunization Handbook for MOs 2017): BCG ≤1 y; OPV-0 ≤15 d; Hep B birth dose ≤24 h; OPV 1–3 ≤5 y; MR ≤5 y; JE ≤15 y (endemic districts; JE-1 after 12 m → ≥3 months before JE-2); DPT ≤7 y; PCV & fIPV dose 1→2 interval 8 weeks. 'Due' lasts for the NIS window (9–12 m, 16–24 m, 5–6 y), then 'overdue'.
- Late starters (NHM Odisha UIP training deck 2024, slides 12–14): Penta/Rota/PCV/fIPV not started after 1 y; a series begun before 1 y is completed by 2 y. A Penta dose that can no longer be given is given as DPT (4 weeks apart, ≤7 y); DPT and OPV boosters ≥6 months after the 3rd dose. The deck gives 4 weeks between JE doses in catch-up, the national NIS footnote 3 months when JE-1 is after 12 m — the app follows the national footnote; confirm with the state.
- Vitamin A dose follows the age on the day (1 lakh IU < 12 m, 2 lakh IU from 12 m). Albendazole twice a year from 12 months (both cards' deworming table starts at 1–2 years): a 12-month dose, then with Vit-A 2–9; 200 mg < 2 y, 400 mg from 2 y on the day given.
- WHO growth data: `tools/gen_who_lms.py` samples the WHO anthro LMS tables (daily to day 42, weekly after; 0.5 cm for WFL/WFH). Max |Δz| against the full daily tables ≤ 0.006. App z-scores were checked against the full tables for five reference children (agreement to 0.001).
- Feeding amounts: the Odisha feeding page (p.8) says "¾ katori after 9 months", its HBYC table (p.7) and the national card say ½ katori at 9 months and ¾–1 katori from 12 months. The app follows the HBYC table / national card (IYCF); flagged for the Odia review.
- Fast breathing uses IMNCI cut-offs "or more" (≥60 / ≥50 / ≥40); both cards print "more than".
- 24-month warning sign 1: Odia print says "cannot stand steady while pulling a toy"; app uses the national meaning "does not walk steadily" — flagged for the Odia review.
- Anaemia follows the AMB Abhiyaan operational guidelines (MoHFW, June 2026; nhm.gov.in/New-Update-2025-26/Nutrition/AMB-guidelines/AMB-Abhiyaan-Guidelines.pdf, read 11 Oct 2026). Cut-offs WHO 2024 (§4.1): 6–23 m and 2nd-trimester pregnancy < 10.5 (mild 9.5–10.4, moderate 7–9.4). Treatment (ch.4): 6–59 m IFA syrup 3 mg/kg/day by weight band 1 / 1.5 / 2 ml × 3 months; 5–9 y 1 pink tablet daily × 3 m; 10–19 y 1 blue daily × 3 m; women 20–49 y 1 red daily × 3 m; breastfeeding (≤6 m) 2 red daily × 3 m; pregnancy mild/moderate 2 red daily, recheck at 1 month; IV iron (iron sucrose ×5 / FCM ×2) for moderate anaemia as the doctor advises, after the 1st trimester; severe → FRU/DH; Hb < 5 → transfusion. Recheck: severe 1 m, moderate 2 m, mild 3 m. The PDF's flowcharts extract poorly: the gestation split for severe anaemia (13–34 weeks vs <28/>28) could not be read reliably, so the app gives no week threshold for it — check against the printed flowchart.
- ORS tool: IMNCI/WHO dehydration check counts each sign once at its worse level (severe-row signs also count toward 'some'); lethargic/unconscious and not able to drink are general danger signs → urgent referral whatever the class.
- Postnatal: the mother's visits are counted from delivery; a baby admitted to SNCU/NBSU has its own visits on days 1, 3, 7, 14, 21, 28, 42 after discharge (Odisha card p.10). Visit records for that baby carry `sncu: 1`.
- Growth: no WHO grade before term-equivalent age (preterm, corrected age < 0); WHZ and SAM-by-WHZ only to 5 years.
- EDD: scan replaces LMP dating only beyond the ACOG Committee Opinion 700 (2017) limits (5 / 7 / 10 / 14 / 21 days by gestation at the scan).
- Independent clinical audit (11 Oct 2026): 24 findings (2 high, 10 medium, 12 low), all addressed in chunk 11 — see BUILD-LOG.
- Source review (11 Oct 2026), latest versions checked:
  - National MCP card: still the 2018 revision (UNICEF IEC flipbook uploaded Aug 2023 refers to the 2018 revisions); no newer card found. Odisha card: V-2023-24 is the newest found.
  - SSBSK (Samagra Shishu Bal Swasthya Karyakram), launched 29 June 2026 (The Tribune, Manorama Yearbook); Operational Guidelines 2026 read from the nurturing-care.org copy (the nhm.gov.in PDFs could not be fetched). It merges HBNC and HBYC from birth to 36 months: healthy newborn day 3, 7, 14, 42 (+ within 24 h for home births); at-risk newborn day 1, 3, 5, 7, 10, 14, 21, 28, 42 with a facility check within 8 days; young child 3, 6, 9, 12, 18, 24, 30, 36 months. Default in the app; Settings → "ASHA home-visit schedule" switches back to HBNC + HBYC as on the Odisha card. The guideline text is ambiguous on whether at-risk days count from birth or from discharge: the app counts from birth for babies at home (first visit day 3 after a facility birth) and from discharge for SNCU/NBSU graduates.
  - Ambulance: Odisha merged 102 into 108 on 30 June 2021 (OdishaTV); the Odisha card cover reads "108 / 108 – Janani Express". The app now shows 108 only.
  - HPV: PIB 28 Feb 2026 — one dose of Gardasil-4 for girls aged 14 at government facilities; a 3-month drive, then on routine immunisation days. PIB 17 Mar 2026: no other UIP schedule change; indigenous Td from Feb 2026.
  - ACOG Committee Opinion 700 reaffirmed in 2025 (Harvard RMF OB Guideline 7, 2026, cites it); thresholds unchanged.
  - No newer versions found for: Immunization Handbook for MOs (2017), IMNCI chart booklet, national GDM guideline (2018), JSY amounts, the Odisha card's FP, NRC, drop-back and e-PMSMA amounts (kept as printed on the card with their checked dates).
- Helplines: 108 ambulance, 102 Janani Express (pregnancy, up to 42 days postpartum, sick infants up to 1 year), 104 health helpline (Odisha, 24×7), 14416 Tele-MANAS, 14423 Kilkari re-listen (Odisha card p.46), 1515 POSHAN/PMMVY (replaced 14408 from 1 Nov 2025 — AIR News, 24 Oct 2025), 181 women, 1098 child, 112 emergency.
- Birth-plan checklist key renamed facility → hospital (it clashed with the facility-name field).
