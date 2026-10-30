/* tex`...` and texd`...` (display) mark TeX formulas in source. The build replaces each one with
 * MathML rendered by Temml, so no maths library ships to the phone. These runtime versions are
 * only a fallback that shows the TeX itself if a formula somehow escaped the build step. */
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export function tex(strings) { return `<code>${esc(strings.raw.join(''))}</code>`; }
export const texd = tex;
