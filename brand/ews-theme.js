/* ============================================================================
   THE EPIDEMIOLOGIST'S WORKSHEET  ·  ews-theme.js  ·  v1.0 (locked 6 Jul 2026)
   The brand tokens as JavaScript, for the two non-CSS surfaces:
     • React apps / CSS-in-JS  → use `tokens` (web fonts, hex with #)
     • pptxgenjs decks         → use `ppt`    (installed fonts, hex WITHOUT #)
   ============================================================================ */

/* ---------------------------------------------------------------- WEB ------ */
/* For React inline styles, styled-components, emotion, etc.
   Fonts assume the Google Fonts <link> is loaded (Fraunces + IBM Plex). */
export const tokens = {
  color: {
    paper:      "#F4F5F1",
    paper2:     "#ECEEE7",
    card:       "#FAFBF7",
    ink:        "#15201B",
    inkSoft:    "#4B5A52",
    inkFaint:   "#7B877E",
    line:       "#D7DCD1",
    lineSoft:   "#E4E7DD",
    primary:    "#0C5E4E",
    primaryDeep:"#08493C",
    accent:     "#BE651F",
    accentTint: "#F0E2D2",
    ok:         "#0C5E4E",
    warn:       "#BE651F",
    danger:     "#A23B2B",
    info:       "#3D6E7A",
  },
  font: {
    display: '"Fraunces", Georgia, "Times New Roman", serif',
    body:    '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
    mono:    '"IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace',
  },
  radius: { md: "14px", sm: "9px", pill: "100px" },
  space:  { maxw: "1120px", gutter: "clamp(20px,5vw,56px)", navH: "72px" },
  shadow: "0 1px 2px rgba(21,32,27,.04), 0 10px 30px -18px rgba(21,32,27,.28)",
};

/* Example (React):
   import { tokens } from "./ews-theme.js";
   const T = tokens;
   <button style={{
     background:T.color.primary, color:T.color.paper,
     fontFamily:T.font.body, fontWeight:600,
     border:"none", borderRadius:T.radius.pill, padding:"11px 20px", cursor:"pointer"
   }}>Open the tool</button>
   // The class-based components in ews.css also work if you load ews.css globally.
*/

/* ---------------------------------------------------------------- PPTX ----- */
/* pptxgenjs wants hex WITHOUT the leading #, and only fonts installed on the
   presenting machine. Fraunces/IBM Plex aren't universal, so map to the
   installed equivalents that hold the same serif/sans/mono roles. */
export const ppt = {
  // colours (no #)
  PAPER:   "F4F5F1",
  PAPER2:  "ECEEE7",
  CARD:    "FAFBF7",
  INK:     "15201B",
  INKSOFT: "4B5A52",
  INKFAINT:"7B877E",
  LINE:    "D7DCD1",
  PRIMARY: "0C5E4E",
  PRIMDEEP:"08493C",
  ACCENT:  "BE651F",
  ACCENTTINT:"F0E2D2",
  DANGER:  "A23B2B",
  INFO:    "3D6E7A",
  WHITE:   "FFFFFF",
  // fonts (installed equivalents — Georgia≈Fraunces role, Calibri≈Plex Sans, Consolas≈Plex Mono)
  HEAD: "Georgia",
  BODY: "Calibri",
  MONO: "Consolas",
};

/* Example (pptxgenjs, Node/CommonJS):
   const { ppt } = require("./ews-theme.js");   // see CommonJS note below
   slide.background = { color: ppt.PAPER };
   slide.addText("Measures of association", {
     x:0.55, y:0.4, fontFace: ppt.HEAD, fontSize: 30, color: ppt.INK, bold:true
   });
   slide.addShape("rect", { x:0.55, y:0.9, w:0.135, h:0.135, fill:{ color: ppt.PRIMARY } });
*/

/* ---------------------------------------------------------------- BOTH ------ */
/* This file uses ES `export`. For a Node/pptxgenjs script that uses require(),
   either rename to ews-theme.mjs and use import, or add at the very bottom:
     module.exports = { tokens, ppt };
   (and delete the two `export` keywords above). */
export default { tokens, ppt };
