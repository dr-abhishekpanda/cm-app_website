/* dr-abhishekpanda-cm.app Worker.
 * The site itself is static files (served straight from the repository by Workers Static Assets).
 * This script only handles the Clinic Assistant's server routes; every other request goes to the
 * static files exactly as before. */
import { AssistantStore } from './store.js';
import { json, adminAllowed } from './lib/util.js';
import { handleChat, handleVerify, handleStatus, handleSearch, handleFeedback } from './lib/chat.js';
import { handleTelegram, telegramSetup } from './lib/telegram.js';
import { notesPage, kbPlainText, adminStats, adminRecords } from './lib/pages.js';

export { AssistantStore };

const API = '/api/assistant/';

const ROUTES = {
  'POST chat': handleChat,
  'POST verify': handleVerify,
  'GET status': handleStatus,
  'GET search': handleSearch,
  'POST feedback': handleFeedback,
  'POST telegram': handleTelegram,
  'GET kb.txt': kbPlainText,
};

const ADMIN = {
  'GET admin/telegram-setup': telegramSetup,
  'GET admin/stats': adminStats,
  'GET admin/records': adminRecords,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === '/assistant/notes' || path === '/assistant/notes/') {
        if (path === '/assistant/notes') return Response.redirect(`${url.origin}/assistant/notes/${url.search}`, 301);
        return notesPage(request, env);
      }
      if (path.startsWith(API)) {
        const route = `${request.method} ${path.slice(API.length).replace(/\/+$/, '')}`;
        if (ROUTES[route]) return await ROUTES[route](request, env, ctx);
        if (ADMIN[route]) {
          if (!adminAllowed(request, env)) return json({ error: 'not_found' }, 404);
          return await ADMIN[route](request, env, ctx);
        }
        return json({ error: 'not_found' }, 404);
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error('worker error', err && (err.stack || err.message));
      return json({ error: 'server_error', message: 'Something went wrong. Please try again.' }, 500);
    }
  },
};
