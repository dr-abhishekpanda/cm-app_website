/* ============================================================================
   modules/92-due — the Due tab: everything due across all cards on this
   phone (from the K.due providers), grouped by urgency and filterable, plus a
   calendar file (.ics, RFC 5545) with all-day reminders for the next 90 days.
   ============================================================================ */
const h = K.h;

K.i18n.add({
  'due.title': { en: 'Due', or: 'ବାକି ସେବା' },
  'due.lede': { en: 'What is due across all the family cards on this phone.', or: 'ଏହି ଫୋନର ସମସ୍ତ ପରିବାର କାର୍ଡରେ ବାକି ଥିବା ସେବା।' },
  'due.g.over': { en: 'Overdue', or: 'ବିଳମ୍ବ ହୋଇଛି' }, 'due.g.today': { en: 'Today', or: 'ଆଜି' }, 'due.g.week': { en: 'Next 7 days', or: 'ଆସନ୍ତା ୭ ଦିନ' },
  'due.g.month': { en: 'Next 30 days', or: 'ଆସନ୍ତା ୩୦ ଦିନ' }, 'due.g.later': { en: 'Later (up to 90 days)', or: 'ପରେ (୯୦ ଦିନ ପର୍ଯ୍ୟନ୍ତ)' },
  'due.f.all': { en: 'All', or: 'ସବୁ' }, 'due.f.preg': { en: 'Pregnancy', or: 'ଗର୍ଭାବସ୍ଥା' }, 'due.f.child': { en: 'Children', or: 'ଶିଶୁ' }, 'due.f.vax': { en: 'Vaccines', or: 'ଟୀକା' },
  'due.none': { en: 'Nothing due in the next 90 days.', or: 'ଆସନ୍ତା ୯୦ ଦିନରେ କିଛି ବାକି ନାହିଁ।' },
  'due.noCards': { en: 'No family card yet. Due dates appear here once a card has a pregnancy or a child.', or: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ପରିବାର କାର୍ଡ ନାହିଁ। କାର୍ଡରେ ଗର୍ଭାବସ୍ଥା ବା ଶିଶୁ ଯୋଗ ହେଲେ ତାରିଖ ଏଠାରେ ଦେଖାଯିବ।' },
  'due.ics': { en: 'Add reminders to the phone calendar', or: 'ଫୋନ୍ କ୍ୟାଲେଣ୍ଡରରେ ସ୍ମାରକ ଯୋଗ କରନ୍ତୁ' },
  'due.icsSub': { en: 'Saves a calendar file (.ics) for the next 90 days; open it to add the dates.', or: 'ଆସନ୍ତା ୯୦ ଦିନ ପାଇଁ କ୍ୟାଲେଣ୍ଡର ଫାଇଲ୍ (.ics) ସେଭ୍ ହେବ; ଖୋଲି ତାରିଖ ଯୋଗ କରନ୍ତୁ।' },
  'due.icsNone': { en: 'Nothing to add.', or: 'ଯୋଗ କରିବାକୁ କିଛି ନାହିଁ।' },
  'due.count': { en: '{n} items', or: '{n}ଟି' }, 'due.count1': { en: '1 item', or: '୧ଟି' },
});

K.due.kindOf = (it) => (/\/preg\//.test(it.href || '') ? 'preg' : /\/child\//.test(it.href || '') ? 'child' : 'other');
K.due.groupOf = (it) => (it.status === 'overdue' || it.days < 0 ? 'over' : it.days === 0 ? 'today' : it.days <= 7 ? 'week' : it.days <= 30 ? 'month' : 'later');
K.due.row = (it, showWho) => {
  const c = K.store.card(it.cardId); const who = c ? c.mother.name || '–' : '';
  return K.ui.li({ href: it.href, icon: it.icon || 'bell', tone: it.status === 'overdue' ? 'red' : it.status === 'due' ? 'amber' : 'ink',
    title: K.L(it.title), meta: [showWho ? who : '', K.d.fmt(it.date, 'dm')].filter(Boolean).join(' · '), trail: K.ui.pill(K.due.label(it), K.due.tone(it)) });
};

K.route('/due', (_, q) => {
  const cards = K.store.list(); const f = q.get('f') || 'all';
  const all = K.due.all(90).filter(it => f === 'all' || (f === 'vax' ? it.kind === 'vax' : K.due.kindOf(it) === f));
  const groups = ['over', 'today', 'week', 'month', 'later'];
  const showWho = cards.length > 1 || K.settings.isHcp();
  const tabs = ['all', 'preg', 'child', 'vax'].map(k => ({ k, l: K.t('due.f.' + k), href: k === 'all' ? '#/due' : '#/due?f=' + k }));
  return { title: K.t('due.title'), tab: 'due',
    html: h`<div class="wrap">${K.ui.phead('', K.t('due.title'), K.t('due.lede'))}
      ${!cards.length ? K.ui.empty('bell', K.t('due.noCards'), K.ui.btn(K.t('home.newCard'), { href: '#/card/new', icon: 'plus' })) : h`
      ${K.ui.seg(tabs, f)}
      ${all.length ? groups.map(g => { const items = all.filter(it => K.due.groupOf(it) === g); if (!items.length) return '';
        return h`<section class="sec">${K.ui.secH(K.t('due.g.' + g) + ' · ' + (items.length === 1 ? K.t('due.count1') : K.t('due.count', { n: items.length })))}<div class="list">${items.map(it => K.due.row(it, showWho))}</div></section>`; })
        : h`<div style="margin-top:16px">${K.ui.empty('check', K.t('due.none'))}</div>`}
      <section class="sec"><button type="button" class="k-card flip-cta" data-act="dueIcs" style="width:100%;text-align:left">${K.ui.icon('calendar')}<span><b>${K.t('due.ics')}</b><small>${K.t('due.icsSub')}</small></span>${K.ui.icon('download', 'sm')}</button></section>`}
    </div>` };
});

/* ---------------------------------------------------------------- calendar file */
K.ics = {};
const enc = new TextEncoder();
K.ics.esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/* fold lines at 73 octets, never splitting a character (RFC 5545 §3.1) */
K.ics.fold = (line) => { const out = []; let cur = '', bytes = 0; for (const ch of line) { const b = enc.encode(ch).length; if (bytes + b > 73) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; } else { cur += ch; bytes += b; } } out.push(cur); return out.join('\r\n'); };
K.ics.date = (iso) => iso.replace(/-/g, '');
K.ics.build = (items) => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maa o Shishu Kavach//MCP card//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + K.ics.esc(K.t('app.name'))];
  const today = K.d.today();
  items.forEach(it => {
    const d = K.d.cmp(it.date, today) < 0 ? today : it.date; const c = K.store.card(it.cardId); const title = K.L(it.title);
    L.push('BEGIN:VEVENT', 'UID:' + K.ics.esc(`${it.cardId}-${it.id}-${d}@kavach`), 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + K.ics.date(d), 'DTEND;VALUE=DATE:' + K.ics.date(K.d.addDays(d, 1)),
      'SUMMARY:' + K.ics.esc(title), 'DESCRIPTION:' + K.ics.esc(`${c ? c.mother.name + ' · ' : ''}${K.t('app.name')}`), 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + K.ics.esc(title), 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(K.ics.fold).join('\r\n') + '\r\n';
};
K.acts.dueIcs = () => {
  const items = K.due.all(90);
  if (!items.length) { K.ui.toast(K.t('due.icsNone')); return; }
  K.download(`kavach-reminders-${K.d.today()}.ics`, K.ics.build(items), 'text/calendar;charset=utf-8');
};
