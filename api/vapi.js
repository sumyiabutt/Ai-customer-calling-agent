'use strict';

const { json, body, sb, maskSensitive } = require('./_lib');

const OUTCOMES = ['resolved', 'escalated', 'abandoned', 'info_only'];
const STOP_WORDS = new Set([
  'about', 'after', 'also', 'and', 'are', 'can', 'could', 'does', 'for', 'from',
  'have', 'how', 'into', 'just', 'like', 'please', 'should', 'tell', 'that',
  'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'what',
  'when', 'where', 'which', 'will', 'with', 'would', 'your',
]);
const DEFAULT_HOURS =
  'ShopEasy support is open Monday to Saturday, 9 AM to 6 PM, and closed on Sunday.';

function parseArgs(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

async function getOrderStatus(args) {
  let orderId = String(args.order_id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^\d{4}$/.test(orderId)) orderId = `ORD-${orderId}`;
  else if (/^ORD\d+$/.test(orderId)) orderId = `ORD-${orderId.slice(3)}`;
  if (!orderId) {
    return 'Ask the customer for the order ID first, for example ORD-1001.';
  }
  const rows = await sb(
    `orders?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,status,detail,expected_delivery,tracking_number`
  );
  const order = rows && rows[0];
  if (!order) {
    return `No order was found with the ID ${orderId}. Ask the customer to check the number and try again. Do not guess a status.`;
  }
  const parts = [`Order ${order.order_id} is ${order.status}.`, order.detail];
  if (order.expected_delivery) parts.push(`Expected delivery: ${order.expected_delivery}.`);
  if (order.tracking_number) parts.push(`Tracking number: ${order.tracking_number}.`);
  return parts.join(' ');
}

async function searchFaq(args) {
  const question = String(args.question || '').toLowerCase();
  const words = question
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
  if (!words.length) {
    return 'Ask the customer to rephrase the question. Do not invent an answer.';
  }
  const rows = await sb('faqs?select=topic,question,answer');
  let best = null;
  let bestScore = 0;
  for (const row of rows || []) {
    const text = `${row.topic} ${row.question} ${row.answer}`.toLowerCase();
    const score = words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  if (!best || bestScore === 0) {
    return 'No approved knowledge-base answer matches that question. Say you do not have that information and offer a human agent.';
  }
  return best.answer;
}

async function getBusinessHours() {
  try {
    const rows = await sb('settings?key=eq.business_hours&select=value');
    if (rows && rows[0] && rows[0].value) return rows[0].value;
  } catch {
    // fall back to the approved default below
  }
  return DEFAULT_HOURS;
}

async function saveCall(patch) {
  const rows = await sb(`live_calls?vapi_call_id=eq.${encodeURIComponent(patch.vapi_call_id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: patch,
  });
  if (Array.isArray(rows) && rows.length) return rows[0];
  const inserted = await sb('live_calls', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: patch,
  });
  return Array.isArray(inserted) ? inserted[0] : inserted;
}

async function handoffToHuman(args, callId) {
  const record = {
    vapi_call_id: callId || null,
    customer_name: args.customer_name ? String(args.customer_name).slice(0, 120) : null,
    order_id: args.order_id ? String(args.order_id).slice(0, 40) : null,
    issue: maskSensitive(String(args.summary || '')).slice(0, 1000),
    reason: maskSensitive(String(args.reason || '')).slice(0, 300),
  };
  try {
    await sb('handoffs', { method: 'POST', body: record });
  } catch (error) {
    return `The handoff note could not be saved: ${error.message}. Tell the customer a human agent will follow up.`;
  }
  if (callId) {
    try {
      await saveCall({ vapi_call_id: callId, handoff: true, outcome: 'escalated' });
    } catch {
      // the end-of-call report will retry the saved record
    }
  }
  return 'Handoff summary saved. Tell the customer a human agent will take over now.';
}

async function logCallOutcome(args, callId) {
  const outcome = String(args.outcome || '').toLowerCase();
  if (!OUTCOMES.includes(outcome)) {
    return `save_failed: outcome must be one of ${OUTCOMES.join(', ')}`;
  }
  const summary = maskSensitive(String(args.summary || '')).slice(0, 500);
  if (!callId) {
    return 'Outcome noted for this conversation.';
  }
  try {
    await saveCall({ vapi_call_id: callId, outcome, summary });
    return 'Outcome and summary saved to the call log.';
  } catch (error) {
    return `save_failed: ${error.message}`;
  }
}

async function runTool(name, args, callId) {
  switch (name) {
    case 'get_order_status':
      return getOrderStatus(args);
    case 'search_faq':
      return searchFaq(args);
    case 'get_business_hours':
      return getBusinessHours();
    case 'handoff_to_human':
      return handoffToHuman(args, callId);
    case 'log_call_outcome':
      return logCallOutcome(args, callId);
    default:
      return `Unknown tool: ${name}`;
  }
}

function turnsFrom(messages) {
  return (messages || [])
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant' || item.role === 'bot'))
    .map((item) => ({
      role: item.role === 'user' ? 'customer' : 'agent',
      text: maskSensitive(
        typeof item.message === 'string'
          ? item.message
          : typeof item.content === 'string'
            ? item.content
            : ''
      ).slice(0, 2000),
    }))
    .filter((item) => item.text);
}

async function saveReport(message) {
  const call = message.call || {};
  const artifact = message.artifact || {};
  const analysis = message.analysis || {};
  const callId = call.id || message.callId;
  if (!callId) return;

  const started = call.startedAt ? new Date(call.startedAt) : null;
  const ended = call.endedAt ? new Date(call.endedAt) : null;
  const duration =
    started && ended && !Number.isNaN(started.getTime()) && !Number.isNaN(ended.getTime())
      ? Math.max(0, Math.round((ended.getTime() - started.getTime()) / 1000))
      : null;

  const turns = turnsFrom(artifact.messages);
  const transcript = maskSensitive(
    artifact.transcript || turns.map((turn) => `${turn.role}: ${turn.text}`).join('\n')
  ).slice(0, 40000);

  await saveCall({
    vapi_call_id: callId,
    started_at: call.startedAt || (started ? started.toISOString() : null),
    ended_at: call.endedAt || (ended ? ended.toISOString() : null),
    duration_seconds: duration,
    caller_phone: call.type === 'webCall' ? 'Web call' : call.customer?.number || 'Unknown',
    customer_name: call.customer?.name || null,
    transcript,
    turns,
    summary: maskSensitive(analysis.summary || '').slice(0, 500) || null,
    ended_reason: message.endedReason || null,
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const secret = process.env.VAPI_SERVER_SECRET || '';
  const supplied = req.headers['x-vapi-secret'] || '';
  if (!secret || supplied !== secret) {
    return json(res, 401, { error: 'Invalid webhook secret' });
  }

  const message = body(req).message || {};
  const callId = (message.call && message.call.id) || message.callId || null;

  try {
    if (message.type === 'tool-calls') {
      const toolCalls = message.toolCallList || message.toolCalls || [];
      const results = [];
      for (const toolCall of toolCalls) {
        const name = (toolCall.function && toolCall.function.name) || toolCall.name || '';
        const args = parseArgs((toolCall.function && toolCall.function.arguments) || toolCall.arguments);
        const toolCallId = toolCall.id || toolCall.toolCallId;
        let result;
        try {
          result = await runTool(name, args, callId);
        } catch (error) {
          result = `The support system could not complete that request: ${error.message}`;
        }
        results.push({ name, toolCallId, result: String(result) });
      }
      return json(res, 200, { results });
    }

    if (message.type === 'end-of-call-report') {
      await saveReport(message);
    }

    json(res, 200, { received: true });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
