/* Clinic Assistant: a safety net for patient-identifiable numbers.
 * The app and the website chat run this before sending a question; the Worker runs it again.
 * It catches numbers that identify a person (mobile, Aadhaar, ABHA, hospital record numbers).
 * It cannot catch names or descriptions, so the notes and the AI still remind people not to share them. */

const PATTERNS = [
  { kind: 'mobile number', re: /(?<![\d])(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?![\d])/ },
  { kind: 'Aadhaar number', re: /(?<![\d])[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?![\d])/ },
  { kind: 'ABHA number', re: /(?<![\d])\d{2}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}(?![\d])|(?<![\d])\d{14}(?![\d])/ },
  { kind: 'ABHA address', re: /\b[\w.]{3,}@(?:abdm|sbx)\b/i },
  { kind: 'hospital record number', re: /\b(?:uhid|mrn|mr\s*no|ip\s*no|ipd\s*no|opd\s*no|cr\s*no|bht\s*no|reg(?:istration)?\.?\s*no)\b\.?[\s:#-]*[a-z]{0,4}[\s/-]?\d{3,}/i },
];

/* Returns the kinds of identifier found, for example ["mobile number"]. Empty means none found. */
export function findIdentifiers(text) {
  const s = String(text || '');
  const kinds = [];
  for (const p of PATTERNS) if (p.re.test(s) && !kinds.includes(p.kind)) kinds.push(p.kind);
  return kinds;
}

export function identifierMessage(kinds) {
  const list = kinds.length > 1 ? kinds.slice(0, -1).join(', ') + ' and ' + kinds[kinds.length - 1] : kinds[0];
  return `Your message seems to contain a ${list}. Please remove it and send again. ` +
    'Never share patient-identifiable details (names, phone numbers, Aadhaar, ABHA, hospital numbers or photos) with any AI tool.';
}
