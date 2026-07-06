# DESIGN.md — The Epidemiologist's Worksheet

**Brand design system · v1.0 (locked 6 July 2026)**
Owner: Dr. Abhishek Panda — Assistant Professor of Community Medicine, Government Medical College & Hospital, Sundargarh, Odisha, India.

> **Directive for any AI agent reading this file.** This is the canonical, locked specification for every visual artifact made for this owner — websites, LMS pages, the #CM-APP tool series, slide decks, posters, and documents. Treat every value here as fixed. Do **not** substitute fonts, invent new brand colours, warm the paper toward cream, or add gradients/heavy shadows. Build with the real content and vocabulary of community medicine and epidemiology. When a request leaves an axis free, resolve it in the direction this file describes, not toward a generic default. If you cannot honour a constraint, say so rather than silently drifting.

---

## 1 · Foundation

**Who it's for.** Undergraduate medical students (Phase I–III MBBS), faculty, residents, and public-health practitioners, in a tribal-majority, mining-affected district. The work is teaching material, research tools, health programme communication, and academic web tools.

**The single idea.** The interface behaves like a clean field worksheet: gridded, legible, quietly precise, with one colour reserved for the thing that matters. The look answers to the work — reading routine data and teaching epidemiology — not the other way round.

**The four rules (obey all four).**
1. **Ink on graph paper.** A faint 34px grid sits under everything, masked so it fades toward the edges. It signals measurement without shouting.
2. **Teal is the only voice.** `#0C5E4E` carries links, actions, and emphasis. If two things are teal, they are related.
3. **Amber is a signal, not decoration.** `#BE651F` appears rarely — a caution, a highlight, one call for attention per screen.
4. **Everything else stays quiet.** Fraunces used with restraint, generous space, no gradients, no drop-shadow theatre.

**Deliberate anti-defaults (do not regress to these).** The substrate is a *cool* paper (`#F4F5F1`), never warm cream. The accent pairing is clinical teal + earth amber, never terracotta-on-cream. The hero signature is a real epidemic curve, never a stock dashboard or a big-number-with-label template.

---

## 2 · Colour

Eleven locked brand values plus four functional signals. The palette is deliberately narrow: two brand colours doing real work, a graded set of inks, and hairlines.

### Surfaces & ink
| Token | Hex | Role |
|---|---|---|
| `--paper` | `#F4F5F1` | Page background (cool, faintly green off-white). |
| `--paper-2` | `#ECEEE7` | Pressed / hover surface, table header fill. |
| `--card` | `#FAFBF7` | Raised surface one step above the page. |
| `--ink` | `#15201B` | Headings and primary body text. |
| `--ink-soft` | `#4B5A52` | Secondary text, ledes, descriptions. |
| `--ink-faint` | `#7B877E` | Captions, metadata, timestamps only. |
| `--line` | `#D7DCD1` | Hairline borders, the grid line. |
| `--line-soft` | `#E4E7DD` | Section dividers, inner separators. |

### Brand
| Token | Hex | Role |
|---|---|---|
| `--primary` | `#0C5E4E` | The only interactive colour — links, buttons, active states, emphasis. |
| `--primary-deep` | `#08493C` | Primary hover / pressed. |
| `--accent` | `#BE651F` | One signal per screen — caution, "new", a single highlight. |
| `--accent-tint` | `#F0E2D2` | Amber background wash (pills, callouts). |

### Functional signals
| Token | Hex | Role |
|---|---|---|
| `--ok` | `#0C5E4E` | Success (reuses primary). |
| `--warn` | `#BE651F` | Caution (reuses accent). |
| `--danger` | `#A23B2B` | Error / destructive. Muted on purpose. |
| `--info` | `#3D6E7A` | Neutral information. |

**Semantic mapping.** Text: ink → ink-soft → ink-faint by importance. Surfaces: paper (page) → card (raised) → paper-2 (pressed). Action: primary fill / primary-deep hover. Attention: accent + accent-tint, sparingly.

**Contrast & restraint.** Ink on paper, and paper text on primary, both clear WCAG AA for body text. Never put ink-faint on anything a reader must act on. The functional signals are intentionally muted so they cannot out-shout the brand — the two brand colours can carry a whole product on their own.

---

## 3 · Typography

Three roles, one job each. Load from Google Fonts (see §10).

| Role | Family | Weights | Use |
|---|---|---|---|
| Display | **Fraunces** | roman 400/500/600 · italic 400/500 | Headlines and section titles, used with restraint. Optical sizing on; tracking pulled in. Italic in teal for a single emphasised word. |
| Body | **IBM Plex Sans** | 400/500/600/700 | All reading text, buttons, UI. Line-height 1.62, 62–70ch measure. 600 for buttons/strong emphasis. |
| Utility | **IBM Plex Mono** | 400/500/600 | Eyebrows, data, code, timestamps, index numbers. Uppercase with 0.14–0.18em tracking is the house tell. |

### Type scale
| Style | Font / weight | Size | Tracking / line-height |
|---|---|---|---|
| Display / H1 | Fraunces 500 | `clamp(2.6rem, 6.4vw, 4.4rem)` | `-0.032em` / `1.0`; `em` → italic teal |
| Section / H2 | Fraunces 500 | `clamp(1.9rem, 3.4vw, 2.7rem)` | `-0.02em` / `1.06` |
| Subhead / H3 | Fraunces 500 | `1.26rem` | `-0.01em` / `1.25` |
| Lede | IBM Plex Sans 400 | `clamp(1.05rem, 1.4vw, 1.18rem)` | ink-soft |
| Body | IBM Plex Sans 400 | `clamp(15.5px, 0.5vw + 14.5px, 17px)` | `1.62` |
| Small | IBM Plex Sans 500 | `0.9rem` | ink-soft |
| Eyebrow / label | IBM Plex Mono 500 | `0.72rem` | `0.18em`, UPPERCASE, primary, with a 26px×1.5px leading rule |
| Data | IBM Plex Mono 500 | `~0.82rem` | numbers, units, CIs, p-values |

Never set Fraunces at body sizes or for long paragraphs. Always set numbers, units, and code in IBM Plex Mono.

---

## 4 · Layout & space

| Token | Value | Role |
|---|---|---|
| `--maxw` | `1120px` | Content measure. |
| `--gutter` | `clamp(20px, 5vw, 56px)` | Page padding, fluid. |
| `--r` | `14px` | Default radius (cards, panels, inputs). |
| `--r-sm` | `9px` | Small radius (chips, notes, nested). |
| `--nav-h` | `72px` | Fixed nav height; scroll-padding offsets it. |
| Section rhythm | `clamp(56px, 8vw, 104px)` | Vertical padding per block. |
| Section divider | `1px solid var(--line-soft)` | Consecutive sections separated by a hairline, not a box. |
| `--shadow` | `0 1px 2px rgba(21,32,27,.04), 0 10px 30px -18px rgba(21,32,27,.28)` | Soft, long, low — hover/raise only, never a heavy default. |

---

## 5 · Signature elements (reuse these; they are what makes a build recognisably part of the set)

1. **Graph-paper substrate** (`.grid-bg`). Fixed, `z-index:-2`, a 34px grid drawn from two `--line` linear-gradients at 1px, `opacity:.32`, radial-masked (`radial-gradient(120% 90% at 70% 0%, #000 30%, transparent 78%)`) so it dissolves toward the edges. It should register subconsciously.
2. **The epi curve** (hero signature). A rise → peak → decline outbreak curve as an SVG path that draws itself on load via `stroke-dashoffset` (~2.3s, `cubic-bezier(.6,.05,.2,1)`), plotted over the grid, with a faint teal area fill, an amber peak dot, and 2–3 mono annotations (e.g. `peak · wk 6`, `epidemic weeks →`). Teal stroke. Gated by `prefers-reduced-motion` (show final state). This is the one moment of motion — a quiet nod to what the owner actually does.
3. **Ruled mono eyebrow** (`.eyebrow`). Every section opens with an uppercase mono label preceded by a short teal rule. Structural, not decorative — it names the part.
4. **Teal grain glow** (`.grain`). Fixed, `z-index:-1`, `opacity:.5`, a faint radial teal wash from the top-right (`radial-gradient(160% 120% at 80% -10%, rgba(12,94,78,.06), transparent 45%)`). Warms the paper a few percent without becoming a noticeable gradient.

---

## 6 · Components (named — reference them by name in prompts)

All are built only from the tokens above. Class names match the shipped `ews.css`.

- **`.btn`** with variant `primary` (teal fill, paper text), `ghost` (line border, teal text), `accent` (amber fill, white text). Pill shape (`border-radius:100px`), weight 600, `padding:11px 20px`, arrow `.arw` nudges right on hover, depresses 1px on active.
- **`.pill`** with `teal` / `amber` / `ink` — mono, uppercase, `0.68rem`, for category tags and status.
- **`.cards` / `.card`** — bordered raised tile: a `.pill`, an `h3`, a description `p`, and a `.go` mono call-to-action with `.arw`. Lifts 2–3px on hover. Used for the #CM-APP tool grid.
- **`.rows` / `.row`** — framed list; each row is a mono meta tag `.pk`, a title `.ti`, and a trailing `.arw`. Used for writing, talks, publications.
- **`.callout`** (+ `warn` / `danger`) — bordered panel with a coloured left-rule and a mono `.mk` marker. Teal for information, amber for caution, danger-red for errors. One instruction or caveat each.
- **`.field`** — form control: mono uppercase `label` + `input`/`select`/`textarea`, teal focus ring (`box-shadow:0 0 0 3px rgba(12,94,78,.12)`).
- **`.datachip`** — mono stat token: a small uppercase `.lb` and a teal `.vl` (e.g. `RR 2.14`, `95% CI 1.62–2.83`).
- **`.table`** — wrap a `<table>` for the framed, rounded look; mono uppercase header on `paper-2`, hairline rows, figures in mono.
- **Layout helpers** — `.wrap` (centres to `--maxw`), `.block` (section rhythm + hairline divider), `.eyebrow`, `.sec-head` + `.sec-link`.

---

## 7 · Motion & accessibility (the quality floor is non-negotiable)

- **One orchestrated moment**: the epi curve drawing on load. Nothing else competes with it.
- **Scroll reveals**: a gentle 14px rise + fade as sections enter (`[data-reveal]` + IntersectionObserver), staggered, never looping.
- **Micro-interactions**: arrows nudge, cards lift 2–3px, buttons depress 1px — 120–180ms, ease.
- **`prefers-reduced-motion: reduce`** disables every animation and shows final states.
- Visible **`:focus-visible`** ring in teal on all interactive elements; tap targets ≥ 40px; full responsive reflow to one column on phones.

---

## 8 · Voice & copy (visually correct is not enough — it must sound right too)

- **Spelling:** British / Indian English — colour, organisation, programme, behaviour, -ise endings.
- **Register:** plain, active, sentence case. Specific beats clever. A control says exactly what happens ("Open the tool", not "Submit"); the same verb carries through the flow.
- **Vocabulary:** use real domain terms accurately (epidemiology, NTEP, ANC, immunisation schedule, MMAS-8, etc.) and name things as students and practitioners recognise them, never by how the system is built.
- **Numbers:** always precise, set in mono; never round away a confidence interval or a p-value.
- **Never:** hype, filler, placeholder text ("insert headline here"), exclamation-heavy tone, or emoji (unless explicitly asked). Empty and error states give direction, not mood.
- **Attribution when relevant:** Dr. Abhishek Panda, Assistant Professor of Community Medicine, GMCH Sundargarh; the tool series brands as **#CM-APP**.

---

## 9 · Format targets

**Web (primary)** — Fraunces + IBM Plex Sans + IBM Plex Mono via Google Fonts; the full system ships as `ews.css` (link it, add the two substrate `<div>`s). Tokens also available as JS in `ews-theme.js`.

**Slide decks / PDF (pptxgenjs, print)** — Fraunces and IBM Plex are **not** installed on most machines, so map the three roles to installed equivalents that hold the same serif / sans / mono character: **Georgia** (display), **Calibri** (body), **Consolas** (mono). Colours are the same hex, written **without** the leading `#` for pptxgenjs. Keep the house habits: a small teal square + uppercase mono-style eyebrow, teal for structure, amber for a single signal.

---

## 10 · Paste-ready snippets

**Google Fonts (web `<head>`):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..500&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Design tokens (`:root`):**
```css
:root{
  /* surfaces & ink */
  --paper:#F4F5F1; --paper-2:#ECEEE7; --card:#FAFBF7;
  --ink:#15201B; --ink-soft:#4B5A52; --ink-faint:#7B877E;
  --line:#D7DCD1; --line-soft:#E4E7DD;
  /* brand */
  --primary:#0C5E4E; --primary-deep:#08493C;
  --accent:#BE651F; --accent-tint:#F0E2D2;
  /* functional signals */
  --ok:#0C5E4E; --warn:#BE651F; --danger:#A23B2B; --info:#3D6E7A;
  /* type */
  --font-display:"Fraunces",Georgia,"Times New Roman",serif;
  --font-body:"IBM Plex Sans",system-ui,-apple-system,sans-serif;
  --font-mono:"IBM Plex Mono",ui-monospace,"SFMono-Regular",monospace;
  /* measure, radius, rhythm */
  --maxw:1120px; --gutter:clamp(20px,5vw,56px);
  --r:14px; --r-sm:9px; --nav-h:72px;
  --shadow:0 1px 2px rgba(21,32,27,.04), 0 10px 30px -18px rgba(21,32,27,.28);
}
```

**Substrate (add once inside `<body>`):**
```html
<div class="grid-bg" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
```

The complete component CSS lives in `ews.css` (hosted at `https://dr-abhishekpanda-cm.app/brand/ews.css`). For faithful output, prefer linking or reading that file over re-deriving components from this spec.

---

## 11 · Provenance

Version 1.0, locked 6 July 2026. Any change to a colour, typeface, token, or signature bumps the version (v1.1, v2.0). Canonical files: `ews.css`, `ews-theme.js`, and this `DESIGN.md` — hosted under `https://dr-abhishekpanda-cm.app/brand/` and committed in the `dr-abhishekpanda/cm-app_website` repository.
