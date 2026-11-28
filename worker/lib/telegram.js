/* Telegram bot for Clinic members.
 * Set-up: create a bot with @BotFather, store its token as the secret TELEGRAM_BOT_TOKEN, then open
 * /api/assistant/admin/telegram-setup?key=YOUR_ADMIN_KEY once. That registers this Worker as the bot's
 * webhook (with a secret header, so only Telegram can call it), and sets the bot's commands and description.
 *
 * Members unlock the bot once with their Clinic access code (/code ABCD-1234, or a start link
 * https://t.me/<bot>?start=ABCD-1234). In private chats every message is a question; in groups the bot
 * answers /ask questions and replies to its own messages. Conversation context is kept for a few hours. */
import { json, hashId, sha256Hex, siteOrigin, istDay } from './util.js';
import { config } from './config.js';
import { checkCode, codeHashValid, quotaChecks, limitMessage } from './access.js';
import { askClaude, friendlyError } from './claude.js';
import { systemPrompt } from './prompts.js';
import { kb } from './kb.js';
import { renderMarkdown, splitForTelegram } from '../../assistant/lib/markdown.js';
import { findIdentifiers, identifierMessage } from '../../assistant/lib/guard.js';
import { store } from '../store.js';

const DAY = 86400;

/* The secret Telegram sends with every update, derived from the bot token so there is one secret less to manage. */
export async function telegramSecret(env) {
  return (await sha256Hex(`telegram-webhook|${env.TELEGRAM_BOT_TOKEN}`)).slice(0, 48);
}

async function tg(env, method, payload) {
  const C = config(env);
  const res = await fetch(`${C.telegramBase}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = {};
  try { data = await res.json(); } catch { /* not JSON */ }
  return { ok: res.ok && data.ok !== false, status: res.status, data };
}

/* Send Markdown as Telegram HTML, split into messages of a safe length. If Telegram rejects the
 * formatting, the same text goes again as plain text, so the member always gets the answer. */
async function sendMarkdown(env, chatId, md, origin, replyTo) {
  for (const [i, part] of splitForTelegram(md).entries()) {
    const payload = {
      chat_id: chatId,
      text: renderMarkdown(part, { flavour: 'telegram', baseUrl: origin }),
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    };
    if (replyTo && i === 0) payload.reply_parameters = { message_id: replyTo, allow_sending_without_reply: true };
    const res = await tg(env, 'sendMessage', payload);
    if (!res.ok && res.status === 400) {
      delete payload.parse_mode;
      payload.text = part;
      await tg(env, 'sendMessage', payload);
    }
  }
}

function welcome(C, origin, authorised) {
  const lines = [
    '**Clinic Assistant** of the Digital & AI Fluency Clinic for Healthcare Professionals.',
    '',
    'Ask me how to use AI and digital tools in your work, or any other question. I answer like a well-informed colleague and use the Clinic\'s checked notes where they help.',
  ];
  if (!authorised) {
    lines.push('', 'This bot is for Clinic members. Send your access code like this:', '`/code ABCD-1234`');
  } else {
    lines.push('', 'Just type your question. /new starts a fresh conversation; /help lists the commands.');
  }
  lines.push('', `Never share patient-identifiable details. I am an AI and can make mistakes. Privacy: ${origin}/assistant/privacy/`);
  return lines.join('\n');
}

const HELP = [
  '**Commands**',
  '- /code ABCD-1234: unlock the bot with your Clinic access code',
  '- /ask your question: ask in a group (in a private chat, just type)',
  '- /new: start a fresh conversation',
  '- /feedback what was wrong: report a wrong or unsafe answer',
  '- /privacy: what is stored and for how long',
  '- /help: this list',
].join('\n');

function privacyText(C, origin) {
  return [
    '**What the Clinic Assistant stores**',
    `- Your Telegram account, as a scrambled code (not your name or number), so you do not have to re-enter the access code. Kept up to a year.`,
    `- Your recent messages and answers, for ${C.telegramMemoryHours} hours, so you can ask follow-up questions. /new deletes them at once.`,
    '- A daily count of your messages, for the daily limit. Kept two days.',
    '- What you send with /feedback, to improve the notes. Kept up to ' + C.keepDays + ' days.',
    'Questions go to Anthropic\'s Claude to write the answer. Telegram also processes messages under its own policy.',
    `Full notice: ${origin}/assistant/privacy/ . Questions: ${C.contactEmail}`,
  ].join('\n');
}

export async function handleTelegram(request, env, ctx) {
  if (!env.TELEGRAM_BOT_TOKEN) return json({ error: 'not_configured' }, 404);
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== await telegramSecret(env)) return new Response('forbidden', { status: 403 });
  let update;
  try { update = await request.json(); } catch { return new Response('ok'); }
  const origin = siteOrigin(request, env);
  ctx.waitUntil(processUpdate(update, env, origin).catch((err) => console.error('telegram update failed', err && err.message)));
  return new Response('ok');
}

async function processUpdate(update, env, origin) {
  const C = config(env);
  const msg = update && (update.message || update.edited_message);
  if (!msg || !msg.chat || !msg.from || msg.from.is_bot) return;
  const chatId = msg.chat.id;
  const isPrivate = msg.chat.type === 'private';
  const st = store(env);
  const userKey = await hashId(env, 'tg-user', msg.from.id);
  const chatKey = await hashId(env, 'tg-chat', chatId);

  if (typeof msg.text !== 'string') {
    if (isPrivate) await sendMarkdown(env, chatId, 'I can read typed text only for now. Please type your question.', origin);
    return;
  }
  const text = msg.text.trim();
  const cmd = text.match(/^\/([A-Za-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/);
  const command = cmd ? cmd[1].toLowerCase() : null;
  const arg = cmd ? (cmd[2] || '').trim() : '';
  const repliedToBot = Boolean(msg.reply_to_message && msg.reply_to_message.from && msg.reply_to_message.from.is_bot);

  const authKey = `tg:auth:${userKey}`;
  const authorised = await codeHashValid(env, await st.getValue(authKey));

  const tryCode = async (code) => {
    const gate = await st.consume([{ name: 'attempts', key: `tgv:${istDay()}:${userKey}`, limit: C.codeAttemptsPerDay, ttl: 2 * DAY }]);
    if (!gate.ok) return sendMarkdown(env, chatId, 'Too many attempts today. Please try again tomorrow.', origin);
    const member = await checkCode(env, code);
    if (!member) return sendMarkdown(env, chatId, `That access code is not valid. Check it, or email ${C.contactEmail} for a new one.`, origin);
    await st.setValue(authKey, member.codeHash, 365 * DAY);
    return sendMarkdown(env, chatId, 'Code accepted. Welcome to the Clinic Assistant. Type your question.', origin);
  };

  switch (command) {
    case 'start':
      if (arg && /^[A-Za-z0-9_-]{4,64}$/.test(arg) && !authorised && isPrivate) return tryCode(arg);
      return sendMarkdown(env, chatId, welcome(C, origin, authorised), origin);
    case 'code':
      if (!isPrivate) return sendMarkdown(env, chatId, 'Please send your code to me in a private chat, not in the group.', origin, msg.message_id);
      if (!arg) return sendMarkdown(env, chatId, 'Send your code like this: `/code ABCD-1234`', origin);
      return tryCode(arg);
    case 'help':
      return sendMarkdown(env, chatId, HELP, origin);
    case 'privacy':
      return sendMarkdown(env, chatId, privacyText(C, origin), origin);
    case 'new':
    case 'reset':
      await st.deleteValue(`tg:hist:${chatKey}`);
      return sendMarkdown(env, chatId, 'Done. The next question starts a fresh conversation.', origin);
    case 'feedback': {
      if (!arg) return sendMarkdown(env, chatId, 'Tell me what was wrong, like this: `/feedback the answer about NotebookLM sharing was out of date`', origin);
      const note = findIdentifiers(arg).length ? '[removed: contained an identifier]' : arg.slice(0, 800);
      await st.logEvent('feedback', 'telegram', { rating: 'down', note }, C.keepDays);
      return sendMarkdown(env, chatId, 'Thank you. Dr. Panda reviews these reports and corrects the notes.', origin);
    }
    case 'ask':
      if (!arg) return sendMarkdown(env, chatId, 'Add your question after /ask, for example: `/ask how do I disclose AI use in a manuscript?`', origin, msg.message_id);
      return answer(arg);
    case null:
      if (isPrivate || repliedToBot) {
        if (!authorised && isPrivate && /^[A-Za-z0-9-]{4,40}$/.test(text)) return tryCode(text);
        return answer(text);
      }
      return; // ordinary group chatter is ignored
    default:
      if (isPrivate) return sendMarkdown(env, chatId, 'I do not know that command. /help lists what I can do.', origin);
      return;
  }

  async function answer(question) {
    if (!authorised) {
      return sendMarkdown(env, chatId, isPrivate
        ? 'This bot is for Clinic members. Send your access code like this: `/code ABCD-1234`'
        : 'This bot is for Clinic members. Open a private chat with me and send your access code first.', origin, isPrivate ? undefined : msg.message_id);
    }
    const found = findIdentifiers(question);
    if (found.length) return sendMarkdown(env, chatId, identifierMessage(found), origin, msg.message_id);
    if (question.length > 4000) return sendMarkdown(env, chatId, 'Please keep a message under 4,000 characters.', origin);
    if (!env.ANTHROPIC_API_KEY) return sendMarkdown(env, chatId, 'AI answers are not switched on yet. Please try later.', origin);

    const checks = quotaChecks(env, { pool: 'member', userKey, ipKey: '', channel: 'telegram' });
    const quota = await st.consume(checks);
    if (!quota.ok) return sendMarkdown(env, chatId, limitMessage(quota.blocked, env), origin, msg.message_id);
    const countedKeys = checks.filter((c) => c.name !== 'stats').map((c) => c.key);

    await tg(env, 'sendChatAction', { chat_id: chatId, action: 'typing' });
    const histKey = `tg:hist:${chatKey}`;
    let history = [];
    try { history = JSON.parse((await st.getValue(histKey)) || '[]'); } catch { history = []; }
    const messages = [...history, { role: 'user', content: question }].slice(-9);
    while (messages.length && messages[0].role !== 'user') messages.shift();

    const k = kb();
    let hits = k.search(question, { limit: 3, minConfidence: 'high', relative: 0.5 });
    if (!hits.length && history.length) {
      const earlier = history.filter((m) => m.role === 'user').pop();
      if (earlier) hits = k.search(`${earlier.content} ${question}`, { limit: 3, minConfidence: 'high', relative: 0.5 });
    }
    try {
      const out = await askClaude(env, {
        model: C.modelGeneral,
        system: systemPrompt({ mode: 'general', channel: 'telegram', hits, origin, member: true }),
        messages,
        maxTokens: C.maxTokensGeneral,
      });
      const reply = out.text || 'I could not write an answer to that. Please rephrase it.';
      await sendMarkdown(env, chatId, reply, origin, isPrivate ? undefined : msg.message_id);
      const keep = [...messages, { role: 'assistant', content: reply.slice(0, 6000) }].slice(-8);
      const day = istDay();
      const u = out.usage || {};
      await Promise.all([
        st.setValue(histKey, JSON.stringify(keep), C.telegramMemoryHours * 3600),
        st.add(`s:${day}:tok_in`, (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0), 100 * DAY),
        st.add(`s:${day}:tok_out`, u.output_tokens || 0, 100 * DAY),
      ]);
    } catch (err) {
      console.error('telegram answer failed', err.status || '', err.detail || err.message);
      await st.refund(countedKeys);
      await sendMarkdown(env, chatId, friendlyError(err), origin);
    }
  }
}

/* One-time set-up: webhook, commands and descriptions. Safe to run again after changing the token. */
export async function telegramSetup(request, env) {
  if (!env.TELEGRAM_BOT_TOKEN) return json({ ok: false, message: 'Set the TELEGRAM_BOT_TOKEN secret first.' }, 400);
  const origin = siteOrigin(request, env);
  const me = await tg(env, 'getMe', {});
  const hook = await tg(env, 'setWebhook', {
    url: `${origin}/api/assistant/telegram`,
    secret_token: await telegramSecret(env),
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: true,
    max_connections: 20,
  });
  const commands = await tg(env, 'setMyCommands', {
    commands: [
      { command: 'start', description: 'Welcome note' },
      { command: 'code', description: 'Enter your Clinic access code' },
      { command: 'ask', description: 'Ask a question (needed in groups)' },
      { command: 'new', description: 'Start a fresh conversation' },
      { command: 'feedback', description: 'Report a wrong or unsafe answer' },
      { command: 'privacy', description: 'What is stored and for how long' },
      { command: 'help', description: 'How to use the Clinic Assistant' },
    ],
  });
  const description = await tg(env, 'setMyDescription', {
    description: 'Clinic Assistant of the Digital & AI Fluency Clinic for Healthcare Professionals (Dr. Abhishek Panda, GMCH Sundaragada). Practical help with AI and digital tools for doctors, nurses, faculty and students. For Clinic members: send /code with your access code. Never share patient-identifiable details.',
  });
  const short = await tg(env, 'setMyShortDescription', {
    short_description: 'AI and digital-tools help for healthcare professionals. Clinic members only.',
  });
  const username = me.data && me.data.result && me.data.result.username;
  return json({
    ok: hook.ok && commands.ok,
    bot: username ? `https://t.me/${username}` : null,
    webhook: hook.ok ? `${origin}/api/assistant/telegram` : hook.data,
    commands: commands.ok,
    description: description.ok && short.ok,
    next: username ? `Share https://t.me/${username} with members. A start link with a code: https://t.me/${username}?start=YOURCODE` : 'Check that the bot token is correct.',
  });
}

