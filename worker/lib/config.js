/* Settings for the Clinic Assistant. Every value can be changed in wrangler.jsonc ("vars") without
 * touching code; secrets (API keys, codes, tokens) are set in the Cloudflare dashboard, never committed. */

function num(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function flag(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return !/^(false|0|no|off)$/i.test(String(value));
}

export function config(env) {
  return {
    // Claude models: one for the open, general-purpose chats (website, Telegram), one for notes-only answers (app).
    modelGeneral: env.MODEL_GENERAL || 'claude-haiku-5-5',
    modelGrounded: env.MODEL_GROUNDED || 'claude-haiku-5-5',
    maxTokensGeneral: num(env.MAX_TOKENS_GENERAL, 1200),
    maxTokensGrounded: num(env.MAX_TOKENS_GROUNDED, 700),

    // Who may use what. The website chat is open to visitors; the app's AI answers and Telegram need a code.
    websiteOpen: flag(env.WEBSITE_OPEN, true),

    // Daily limits (reset at midnight IST) and a per-minute burst limit.
    openPerDevice: num(env.OPEN_DAILY_PER_DEVICE, 15),
    openPerIp: num(env.OPEN_DAILY_PER_IP, 60),
    openTotal: num(env.OPEN_DAILY_TOTAL, 300),
    memberPerUser: num(env.MEMBER_DAILY_PER_USER, 40),
    memberTotal: num(env.MEMBER_DAILY_TOTAL, 2000),
    burstPerMinute: num(env.BURST_PER_MINUTE, 6),
    codeAttemptsPerDay: num(env.CODE_ATTEMPTS_PER_DAY, 10),
    searchPerMinute: num(env.SEARCH_PER_MINUTE, 30),

    // Records kept for improving the notes (questions the notes could not answer, "Not right" reports).
    logUnanswered: flag(env.LOG_UNANSWERED, true),
    keepDays: num(env.KEEP_DAYS, 60),
    telegramMemoryHours: num(env.TELEGRAM_MEMORY_HOURS, 6),

    contactEmail: env.CONTACT_EMAIL || 'support@dr-abhishekpanda-cm.app',
    contactWhatsApp: env.CONTACT_WHATSAPP || '(+91) 700-890-9595',
    anthropicBase: (env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, ''),
    telegramBase: (env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/+$/, ''),
  };
}
