/* Unit tests for the shared Clinic Assistant code: knowledge base, search, Markdown and the identifier guard.
 * Run from the repository root:  node --test worker/test/core.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseKB, loadKB, tokenize, stem, plainText, absoluteLinks } from '../../assistant/lib/kb-core.js';
import { renderMarkdown, renderInline, splitForTelegram } from '../../assistant/lib/markdown.js';
import { findIdentifiers } from '../../assistant/lib/guard.js';

const KB_TEXT = readFileSync(fileURLToPath(new URL('../../assistant/kb/clinic-kb.md', import.meta.url)), 'utf8');
const kb = loadKB(KB_TEXT);

test('the knowledge base parses into notes with unique ids', () => {
  assert.ok(kb.kb.entries.length >= 20, 'expected at least 20 notes');
  const ids = kb.kb.entries.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(kb.kb.meta.updated, '2026-11-26');
  for (const e of kb.kb.entries) {
    assert.ok(e.title && e.body, `note ${e.id} has a title and a body`);
    assert.ok(!/HOW TO EDIT/.test(e.body), 'editor comment never leaks into a note');
  }
});

test('metadata lines, drafts and duplicate ids', () => {
  const parsed = parseKB('# Notes\n\n## First note\nid: one\ntags: a, b; c\nupdated: 2026-01-02\n\nBody **one**.\n\n## Hidden\nstatus: draft\n\nSecret.\n\n## First note\n\nSecond body.');
  assert.equal(parsed.entries.length, 2);
  assert.deepEqual(parsed.entries[0].tags, ['a', 'b', 'c']);
  assert.equal(parsed.entries[0].updated, '2026-01-02');
  assert.equal(parsed.entries[0].text, 'Body one.');
  assert.equal(parsed.entries[1].id, 'first-note');
  assert.ok(!parsed.entries.some((e) => e.title === 'Hidden'));
});

test('tokenizer handles English, numbers and Indian scripts', () => {
  assert.deepEqual(tokenize('How do I set up ChatGPT settings?'), ['chatgpt', 'setting']);
  assert.deepEqual(tokenize('Call 108 now'), ['call', '108']);
  assert.deepEqual(tokenize('ଶିଶୁ ଟୀକାକରଣ'), ['ଶିଶୁ', 'ଟୀକାକରଣ']);
  assert.deepEqual(tokenize('टीकाकरण‍ कार्यक्रम'), ['टीकाकरण', 'कार्यक्रम']);
  assert.equal(stem('prompting'), 'prompt');
  assert.equal(stem('references'), 'reference');
  assert.equal(stem('policies'), 'policy');
});

const expectations = [
  ['How do I set up ChatGPT safely?', 'chatgpt-setup'],
  ['how to disclose AI use in my manuscript', 'ai-disclosure'],
  ['what is notebooklm', 'notebooklm'],
  ['how do I get an access code', 'access-codes'],
  ['whatsapp bot for my clinic cost', 'whatsapp-bots'],
  ['prompt for MCQs', 'prompting-basics'],
  ['fake references from AI', 'verify-ai-output'],
  ['dpdp rules children consent', 'dpdp-basics'],
  ['ambulance number', 'emergencies'],
  ['what is rag', 'chatbot-terms'],
  ['translate leaflet to odia', 'ai-translation'],
  ['chatgtp setup', 'chatgpt-setup'],
  ['aadhar', 'patient-privacy'],
];

for (const [q, id] of expectations) {
  test(`search: "${q}" finds ${id}`, () => {
    const res = kb.search(q, { limit: 3 });
    assert.ok(res.length, 'has results');
    assert.equal(res[0].id, id);
    assert.notEqual(res[0].confidence, 'low');
  });
}

test('unrelated questions find nothing confident', () => {
  assert.equal(kb.search('what is the capital of france').length, 0);
  assert.ok(!kb.search('explain p values').some((r) => r.confidence === 'high'));
});

test('relative links become absolute for other channels', () => {
  assert.equal(absoluteLinks('See [app](/research-app/) and [x](https://a.b/).', 'https://site.app'),
    'See [app](https://site.app/research-app/) and [x](https://a.b/).');
  assert.equal(plainText('**Bold** and [link](/x) and `code`'), 'Bold and link and code');
});

test('markdown: escapes HTML and blocks unsafe links', () => {
  const html = renderMarkdown('<script>alert(1)</script> **b** [x](javascript:alert(1)) [ok](https://a.b/c)');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!/href="javascript/i.test(html));
  assert.ok(html.includes('<strong>b</strong>'));
  assert.ok(html.includes('href="https://a.b/c"'));
  assert.ok(!renderInline('[x](data:text/html;base64,AAA)').includes('href'));
  assert.ok(!renderInline('"onmouseover="alert(1)').includes('"onmouseover'));
});

test('markdown: lists, tables, code and headings', () => {
  const html = renderMarkdown('# Title\n\n1. one\n2. two\n   - nested\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```\nx < y\n```');
  assert.ok(html.includes('<h1>Title</h1>'));
  assert.ok(/<ol><li>one<\/li><li>two<ul><li>nested<\/li><\/ul><\/li><\/ol>/.test(html));
  assert.ok(html.includes('<td>1</td>'));
  assert.ok(html.includes('<pre><code>x &lt; y</code></pre>'));
});

test('markdown: Telegram flavour uses only Telegram tags and absolute links', () => {
  const tg = renderMarkdown('## Head\n\n- **bold** item\n- see [notes](/assistant/notes/)\n\n| a | b |\n|---|---|\n| 1 | 2 |', { flavour: 'telegram', baseUrl: 'https://s.app' });
  assert.ok(tg.includes('<b>Head</b>'));
  assert.ok(tg.includes('• <b>bold</b> item'));
  assert.ok(tg.includes('<a href="https://s.app/assistant/notes/">notes</a>'));
  assert.ok(tg.includes('<pre>a | b\n1 | 2</pre>'));
  assert.ok(!/<(strong|em|ul|li|p|h\d|table)\b/.test(tg));
  const parts = splitForTelegram('a'.repeat(3000) + '\n\n' + 'b'.repeat(3000), 3500);
  assert.equal(parts.length, 2);
});

test('identifier guard', () => {
  assert.deepEqual(findIdentifiers('Call me on 98765 43210'), ['mobile number']);
  assert.ok(findIdentifiers('Aadhaar 2345 6789 0123').includes('Aadhaar number'));
  assert.ok(findIdentifiers('ABHA 91-1234-5678-9012').includes('ABHA number'));
  assert.ok(findIdentifiers('UHID: GMCH/2026/45678').includes('hospital record number'));
  assert.ok(findIdentifiers('my abha is ramesh.k@abdm').includes('ABHA address'));
  assert.deepEqual(findIdentifiers('In 2026, 108 ambulances served 1,20,000 people; sample size 384.'), []);
  assert.deepEqual(findIdentifiers('How do I set up ChatGPT?'), []);
});
