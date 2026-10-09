# Build log — Maa 'o' Shishu Kavach

## 2026-10-09 · session 1 · chunks 0–2
- Sources: national MCP Card 2018 (English text) and Odisha MCP Card V-2023-24. The Odisha booklet uses legacy Akruti Ori Sarala fonts; `tools/akruti_to_unicode.py` + `tools/extract_odia_pdf.py` convert it to Unicode at glyph level (unmapped glyph ids 98/110/111 = ଞ୍ଚ / ଣ୍ଟ / ତ୍ତ). Output: `docs/sources/odisha-mcp-v2023-24.or.txt` (pages where the text was converted to outlines were read from the page images instead).
- Built: build script (single-file output), shell (top bar with language toggle + SOS, tab bar), onboarding, settings, about, recently deleted, backup/restore (JSON, share, merge-by-newer), card home/new/dashboard/profile, pregnancy registration, overview with GA ring, ANC schedule + visit form with live flags, HRP checklist (Odisha codes, auto-derived from records, manual override, red card), Td/albendazole form, IFA & calcium daily trackers, tests, birth plan, care advice, due providers.
- Checked in Chromium at 393×851: onboarding, home, settings, card creation, pregnancy flow, ANC flags (BP 146/96 + albumin + headache → pre-eclampsia flag; FH 29 cm at 24 wk → ±4 cm flag), HRP banner, trackers.
- Push from this session is blocked (Claude GitHub App not installed on the repo); commits are local until access is fixed.
