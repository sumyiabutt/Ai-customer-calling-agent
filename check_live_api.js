'use strict';

/* Offline check of the live-call API functions.
 *
 * Stubs the Supabase REST API and the Vapi assistant API, then calls the real
 * handlers. Run with: node scripts/check_live_api.js
 */

process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test';
process.env.VAPI_PUBLIC_KEY = 'public-test';
process.env.VAPI_PRIVATE_KEY = 'private-test';
process.env.VAPI_SERVER_SECRET = 'server-secret-test';
process.env.SETUP_TOKEN = 'setup-token-test';

const assert = require('node:assert');

const store = { calls: [], handoffs: [], settings: {}, faq: false };

function reply(body, status = 200) {
  const text = body === null || body === undefined ? '' : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => JSON.parse(text),
  };
}

const orders = [
  {
    order_id: 'ORD-1002',
    status: 'Processing',
    detail: 'Payment is confirmed and the order is being packed.',
    expected_delivery: '2 November 2026',
    tracking_number: null,
  },
];

global.fetch = async (url, options = {}) => {
  const parsed = new URL(url);
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;

  if (parsed.hostname === 'api.vapi.ai') {
    return reply({ id: 'asst_test_1', ...body }, method === 'POST' ? 201 : 200);
  }

  if (parsed.hostname === 'supabase.test') {
    const path = decodeURIComponent(parsed.pathname.replace('/rest/v1/', ''));
    const query = parsed.searchParams;
    const table = path.split('?')[0];

    if (table === 'orders') {
      const id = (query.get('order_id') || '').replace('eq.', '');
      return reply(orders.filter((order) => order.order_id === id));
    }
    if (table === 'faqs') {
      store.faq = true;
      return reply([
        { topic: 'shipping', question: 'How long does delivery take?', answer: 'Standard delivery takes 3 to 5 working days after dispatch.' },
        { topic: 'returns', question: 'What is the return policy?', answer: 'You can request a return within 7 days of delivery.' },
      ]);
    }
    if (table === 'settings') {
      if (method === 'POST') {
        store.settings[body.key] = body.value;
        return reply(null, 201);
      }
      const key = (query.get('key') || '').replace('eq.', '');
      return reply(store.settings[key] ? [{ value: store.settings[key] }] : []);
    }
    if (table === 'handoffs' && method === 'POST') {
      store.handoffs.push(body);
      return reply(null, 201);
    }
    if (table === 'live_calls') {
      const filter = query.get('vapi_call_id');
      if (method === 'PATCH') {
        const id = (filter || '').replace('eq.', '');
        const existing = store.calls.find((call) => call.vapi_call_id === id);
        if (!existing) return reply([]);
        Object.assign(existing, body);
        return reply([existing]);
      }
      if (method === 'POST') {
        const row = { id: `00000000-0000-4000-8000-${String(store.calls.length + 1).padStart(12, '0')}`, ...body };
        store.calls.push(row);
        return reply([row], 201);
      }
      if (filter) {
        const id = filter.replace('eq.', '');
        return reply(store.calls.filter((call) => call.vapi_call_id === id));
      }
      return reply(store.calls);
    }
  }

  throw new Error(`Unexpected fetch: ${method} ${url}`);
};

function call(handler, { method = 'GET', headers = {}, body, query = {} } = {}) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 0,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      end(text) {
        resolve({ status: this.statusCode, body: text ? JSON.parse(text) : null });
      },
    };
    handler({ method, headers, body, query }, res);
  });
}

async function tool(name, args, callId = 'call_abc') {
  const config = require('../web/api/vapi');
  const response = await call(config, {
    method: 'POST',
    headers: { 'x-vapi-secret': 'server-secret-test' },
    body: {
      message: {
        type: 'tool-calls',
        call: { id: callId },
        toolCallList: [{ id: `tc_${name}`, function: { name, arguments: JSON.stringify(args) } }],
      },
    },
  });
  assert.strictEqual(response.status, 200, `${name} returned ${response.status}`);
  return response.body.results[0].result;
}

async function main() {
  const results = [];
  const ok = (label) => results.push(`PASS  ${label}`);

  const configHandler = require('../web/api/config');
  const setupHandler = require('../web/api/setup');
  const vapiHandler = require('../web/api/vapi');
  const callsHandler = require('../web/api/calls');

  let response = await call(configHandler);
  assert.strictEqual(response.body.configured, false);
  ok('config reports not configured before setup');

  response = await call(setupHandler, { method: 'POST', headers: { 'x-setup-token': 'wrong' } });
  assert.strictEqual(response.status, 401);
  ok('setup rejects a wrong token');

  response = await call(setupHandler, {
    method: 'POST',
    headers: { 'x-setup-token': 'setup-token-test', host: 'example.vercel.app' },
  });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.assistantId, 'asst_test_1');
  assert.strictEqual(store.settings.vapi_assistant_id, 'asst_test_1');
  ok('setup creates an assistant and stores its id');

  response = await call(setupHandler, {
    method: 'POST',
    headers: { 'x-setup-token': 'setup-token-test', host: 'example.vercel.app' },
  });
  assert.strictEqual(response.body.updated, true);
  ok('setup updates the existing assistant');

  response = await call(configHandler);
  assert.strictEqual(response.body.configured, true);
  assert.strictEqual(response.body.publicKey, 'public-test');
  ok('config returns the public key and assistant id');

  response = await call(vapiHandler, {
    method: 'POST',
    headers: { 'x-vapi-secret': 'wrong' },
    body: { message: { type: 'tool-calls' } },
  });
  assert.strictEqual(response.status, 401);
  ok('webhook rejects a wrong secret');

  let result = await tool('get_order_status', { order_id: 'ord 1002' });
  assert.match(result, /ORD-1002 is Processing/);
  assert.match(result, /2 November 2026/);
  ok('order found');

  result = await tool('get_order_status', { order_id: 'ORD-9999' });
  assert.match(result, /No order was found/);
  assert.doesNotMatch(result, /Processing/);
  ok('order not found');

  result = await tool('search_faq', { question: 'how long is delivery' });
  assert.match(result, /3 to 5 working days/);
  ok('FAQ hit');

  result = await tool('search_faq', { question: 'do you sell cars' });
  assert.match(result, /No approved knowledge-base answer/);
  ok('FAQ miss');

  result = await tool('get_business_hours', {});
  assert.match(result, /Monday to Saturday/);
  ok('business hours');

  result = await tool('handoff_to_human', {
    summary: 'Customer asked for a manager about a refund.',
    reason: 'Requested a human',
  });
  assert.match(result, /Handoff summary saved/);
  assert.strictEqual(store.handoffs.length, 1);
  ok('handoff saved');

  result = await tool('log_call_outcome', { outcome: 'resolved', summary: 'Order status answered.' });
  assert.match(result, /saved to the call log/);
  ok('outcome saved');

  result = await tool('log_call_outcome', { outcome: 'nonsense', summary: 'x' });
  assert.match(result, /save_failed/);
  ok('invalid outcome rejected');

  response = await call(vapiHandler, {
    method: 'POST',
    headers: { 'x-vapi-secret': 'server-secret-test' },
    body: {
      message: {
        type: 'end-of-call-report',
        endedReason: 'customer-ended-call',
        call: {
          id: 'call_abc',
          type: 'webCall',
          startedAt: '2026-11-05T10:00:00.000Z',
          endedAt: '2026-11-05T10:01:30.000Z',
        },
        artifact: {
          messages: [
            { role: 'assistant', message: 'Hello, this is Sumyia.' },
            { role: 'user', message: 'My card is 4111 1111 1111 1111.' },
          ],
        },
        analysis: { summary: 'Customer asked about an order.' },
      },
    },
  });
  assert.strictEqual(response.status, 200);
  const saved = store.calls.find((row) => row.vapi_call_id === 'call_abc');
  assert.ok(saved);
  assert.strictEqual(saved.duration_seconds, 90);
  assert.strictEqual(saved.outcome, 'resolved');
  assert.strictEqual(saved.caller_phone, 'Web call');
  assert.match(saved.transcript, /XXXX XXXX XXXX XXXX/);
  assert.doesNotMatch(saved.transcript, /4111 1111 1111 1111/);
  assert.strictEqual(saved.turns.length, 2);
  ok('end-of-call report saved, duration and masked transcript');

  response = await call(callsHandler, { query: {} });
  assert.strictEqual(response.body.calls.length, 1);
  ok('call list');

  response = await call(callsHandler, { query: { id: 'not-a-uuid' } });
  assert.strictEqual(response.status, 400);
  ok('call detail rejects a bad id');

  response = await call(callsHandler, { query: { id: saved.id } });
  assert.strictEqual(response.body.call.id, saved.id);
  ok('call detail');

  console.log(results.join('\n'));
  console.log(`\n${results.length} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
