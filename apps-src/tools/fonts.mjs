/* The EWS fonts, embedded so the app looks right offline. Latin subsets only: Indian English text,
 * numbers and the punctuation the tools print. Other characters (Greek letters, superscripts) fall
 * back to the system font, as they would with the hosted fonts. */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const FACES = [
  // family, style, weight, file under node_modules
  ['Fraunces', 'normal', '100 900', '@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2'],
  ['Fraunces', 'italic', '100 900', '@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2'],
  ['IBM Plex Sans', 'normal', '400', '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2'],
  ['IBM Plex Sans', 'italic', '400', '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-italic.woff2'],
  ['IBM Plex Sans', 'normal', '500', '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2'],
  ['IBM Plex Sans', 'normal', '600', '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2'],
  ['IBM Plex Mono', 'normal', '400', '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'],
  ['IBM Plex Mono', 'normal', '500', '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2'],
  ['IBM Plex Mono', 'normal', '600', '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2'],
];

export async function fontCss(src) {
  const out = [];
  for (const [family, style, weight, file] of FACES) {
    const b64 = (await readFile(join(src, 'node_modules', file))).toString('base64');
    out.push(`@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${b64}) format("woff2")}`);
  }
  return out.join('\n');
}
