/* Builds the system prompt for each channel. The instructions live in worker/prompts/*.md so they
 * can be edited on GitHub like any document; the Worker bundles them at deploy time. */
import GENERAL from '../prompts/general.md';
import GROUNDED from '../prompts/grounded.md';
import { notesForPrompt } from './kb.js';
import { istDateLong } from './util.js';

const CHANNEL_NOTES = {
  web: 'You are answering in the chat window on Dr. Panda\'s website. Markdown is shown formatted. Keep tables small enough for a phone.',
  pwa: 'You are answering inside the Clinic Assistant app. The matching notes are shown in full under your answer.',
  telegram: 'You are answering in Telegram. Use short paragraphs, bold text and simple bullet lists only; no tables and no headings. Keep it under 200 words unless the user asks for more.',
};

/* Returns the "system" blocks for the Claude Messages API. The fixed instructions come first and are
 * marked for prompt caching, so repeated requests cost less; the notes for this question follow. */
export function systemPrompt({ mode, channel, hits, origin, member }) {
  const base = mode === 'grounded' ? GROUNDED : GENERAL;
  const context = [
    `Today's date: ${istDateLong()} (India Standard Time).`,
    CHANNEL_NOTES[channel] || '',
    member ? 'The user is a Clinic member (verified by access code).' : 'The user has not entered a Clinic access code.',
  ].filter(Boolean).join('\n');
  const blocks = [{ type: 'text', text: base.trim(), cache_control: { type: 'ephemeral' } }, { type: 'text', text: context }];
  if (hits && hits.length) {
    blocks.push({
      type: 'text',
      text: `CLINIC NOTES (written and checked by Dr. Abhishek Panda)\n\n${notesForPrompt(hits, origin)}`,
    });
  } else if (mode === 'grounded') {
    blocks.push({ type: 'text', text: 'CLINIC NOTES\n\n(No note matches this question.)' });
  }
  return blocks;
}
