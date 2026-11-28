/* Stand-ins for the Anthropic and Telegram APIs, so the Worker can be tested locally without keys,
 * network access or cost. The Worker is pointed here through ANTHROPIC_BASE_URL and TELEGRAM_API_BASE. */
import http from 'node:http';

export function startMockApis(port) {
  const calls = { claude: [], telegram: [] };
  const server = http.createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};

    if (req.method === 'POST' && req.url === '/v1/messages') {
      calls.claude.push({ headers: req.headers, body });
      if (req.headers['x-api-key'] !== 'test-key') {
        res.writeHead(401, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'bad key' } }));
      }
      const system = (body.system || []).map((b) => b.text).join('\n');
      const question = body.messages[body.messages.length - 1].content;
      if (/FORCE_ERROR/.test(question)) {
        res.writeHead(529, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'busy' } }));
      }
      const tag = `MOCK[model=${body.model};notes=${/CLINIC NOTES \(written/.test(system)};grounded=${/notes-only answers/.test(system)};turns=${body.messages.length}]`;
      const answer = `${tag} **Answer** to: ${question}\n\n- point one\n- see [the notes](/assistant/notes/)`;
      if (body.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const send = (ev) => res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
        send({ type: 'message_start', message: { usage: { input_tokens: 1200, output_tokens: 1 } } });
        send({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
        for (const piece of answer.match(/[\s\S]{1,12}/g)) send({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: piece } });
        send({ type: 'content_block_stop', index: 0 });
        send({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 80 } });
        send({ type: 'message_stop' });
        return res.end();
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({
        content: [{ type: 'text', text: answer }],
        usage: { input_tokens: 1000, output_tokens: 60, cache_read_input_tokens: 200 },
        stop_reason: 'end_turn',
      }));
    }

    const tg = req.url.match(/^\/bot([^/]+)\/(\w+)$/);
    if (req.method === 'POST' && tg) {
      calls.telegram.push({ token: tg[1], method: tg[2], body });
      res.writeHead(200, { 'content-type': 'application/json' });
      if (tg[2] === 'getMe') return res.end(JSON.stringify({ ok: true, result: { id: 1, is_bot: true, username: 'clinic_test_bot' } }));
      if (tg[2] === 'sendMessage' && body.parse_mode === 'HTML' && /<unclosed>/.test(body.text)) {
        res.writeHead(400);
        return res.end(JSON.stringify({ ok: false, description: "Bad Request: can't parse entities" }));
      }
      return res.end(JSON.stringify({ ok: true, result: true }));
    }

    res.writeHead(404);
    res.end('not found');
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, calls })));
}
