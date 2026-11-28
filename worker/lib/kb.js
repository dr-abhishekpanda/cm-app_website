/* The knowledge base, bundled into the Worker at deploy time from the same file the app downloads,
 * so every channel answers from the same notes. Parsed and indexed once per Worker instance. */
import KB_TEXT from '../../assistant/kb/clinic-kb.md';
import { loadKB, absoluteLinks } from '../../assistant/lib/kb-core.js';

// Parsed once when the Worker starts (start-up time), not inside a request, so requests stay well
// within the CPU limit of Cloudflare's free plan.
const KB = loadKB(KB_TEXT);

export function kb() {
  return KB;
}

export function kbText() {
  return KB_TEXT;
}

/* Notes laid out for the AI: title, date, link and text, with site links made absolute. */
export function notesForPrompt(hits, origin, { maxChars = 9000 } = {}) {
  let used = 0;
  const blocks = [];
  hits.forEach((h, i) => {
    let body = absoluteLinks(h.body, origin);
    const room = maxChars - used;
    if (room < 400) return;
    if (body.length > room) body = body.slice(0, room).replace(/\s+\S*$/, '') + ' [...]';
    used += body.length;
    blocks.push(`[Note ${i + 1}] "${h.title}"\nUpdated: ${h.updated || 'not stated'}\nLink: ${origin}/assistant/notes/#${h.id}\n${body}`);
  });
  return blocks.join('\n\n---\n\n');
}

export function sourcesFor(hits) {
  return hits.map((h) => ({ id: h.id, title: h.title, updated: h.updated, url: `/assistant/notes/#${h.id}` }));
}
