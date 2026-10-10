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
| 6 | Development & feeding: milestones + warning signs (2–3 m → 3 y), DEIC, parenting tips, feeding by age, HBYC, IFA syrup tracker, diarrhoea/pneumonia care, ROP reminder | next |
| 7 | Learn & counsel library, flipbook mode, read-aloud | |
| 8 | Tools: EDD, vaccine due dates, z-score, anaemia + AMB doses, breath counter, ORS/zinc, IFA/albendazole doses, HRP quick screen, corrected age | |
| 9 | Entitlements & helplines (dated sources), Due tab across cards, print view, calendar export, sample family | |
| 10 | PWA (manifest, icons, service worker), QA, Odia review sheet, deploy notes, link from home page | |

## Notes to carry forward
- Odisha IFA syrup days for children: Tuesday + Friday (national card: Wednesday + Saturday) — setting `ifaDays`.
- MAMATA-PMMVY (Odisha, from 1 Apr 2025): ₹10,000 (boy) / ₹12,000 (girl) in two instalments (₹6,000 after AWC registration + ≥1 ANC within 6 months of LMP; ₹4,000/₹6,000 after birth registration + vaccines up to 14 weeks). Source: wcd.odisha.gov.in/en/ICDS/mamata-pmmvy (checked 9 Oct 2026).
- HPV vaccine: single dose for girls aged 14, nationwide from 28 Feb 2026 (campaign; first UIP inclusion). Source: Gavi VaccinesWork, 13 Mar 2026.
- UIP catch-up: BCG ≤1 y; OPV-0 ≤15 d; Hep B birth dose ≤24 h; OPV 1–3 ≤5 y; Penta/Rota/PCV/fIPV not started after 12 m but series completed; DPT instead of Penta if starting after 1 y; MR ≤5 y; JE ≤15 y (endemic districts); DPT boosters ≤7 y; PCV & fIPV dose 1→2 interval 8 weeks.
- WHO growth data: `tools/gen_who_lms.py` samples the WHO anthro LMS tables (daily to day 42, weekly after; 0.5 cm for WFL/WFH). Max |Δz| against the full daily tables ≤ 0.006. App z-scores were checked against the full tables for five reference children (agreement to 0.001).
- Helplines: 108 ambulance, 102 Janani Express (pregnancy, up to 42 days postpartum, sick infants up to 1 year), 104 health helpline (Odisha, 24×7), 14416 Tele-MANAS, 14408 PMMVY.
