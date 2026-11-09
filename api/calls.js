'use strict';

const { json, sb, maskSensitive } = require('./_lib');

const SELECT =
  'id,vapi_call_id,started_at,ended_at,duration_seconds,caller_phone,customer_name,' +
  'transcript,turns,summary,outcome,ended_reason,handoff,created_at';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OUTCOMES = ['resolved', 'escalated', 'abandoned', 'info_only'];

function vapiKey() {
  return process.env.VAPI_PRIVATE_KEY || '';
}

async function vapiCall(path) {
  const key = vapiKey();
  if (!key) throw new Error('VAPI_PRIVATE_KEY is not set');
  const response = await fetch(`https://api.vapi.ai${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Vapi ${response.status}: ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : null;
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

function outcomeFrom(call) {
  const structured = (call.analysis && call.analysis.structuredData) || {};
  const declared = String(structured.outcome || '').toLowerCase();
  if (OUTCOMES.includes(declared)) return declared;
  const reason = String(call.endedReason || '');
  if (/assistant-error|silence-timeout|customer-did-not-answer|no-answer/i.test(reason)) {
    return 'abandoned';
  }
  return 'info_only';
}

function fromVapi(call) {
  const started = call.startedAt ? new Date(call.startedAt) : null;
  const ended = call.endedAt ? new Date(call.endedAt) : null;
  const valid = (date) => date && !Number.isNaN(date.getTime());
  const duration =
    valid(started) && valid(ended)
      ? Math.max(0, Math.round((ended.getTime() - started.getTime()) / 1000))
      : typeof call.durationSeconds === 'number'
        ? Math.round(call.durationSeconds)
        : null;
  const artifact = call.artifact || {};
  const turns = turnsFrom(artifact.messages);
  const transcript = maskSensitive(
    artifact.transcript || turns.map((turn) => `${turn.role}: ${turn.text}`).join('\n')
  ).slice(0, 40000);

  return {
    id: call.id,
    vapi_call_id: call.id,
    started_at: call.startedAt || (valid(started) ? started.toISOString() : null),
    ended_at: call.endedAt || (valid(ended) ? ended.toISOString() : null),
    duration_seconds: duration,
    caller_phone:
      call.type === 'webCall' ? 'Web call' : (call.customer && call.customer.number) || 'Unknown',
    customer_name: (call.customer && call.customer.name) || null,
    transcript,
    turns,
    summary: maskSensitive(
      (call.analysis && call.analysis.summary) || ''
    ).slice(0, 500) || null,
    outcome: outcomeFrom(call),
    ended_reason: call.endedReason || null,
    handoff: false,
    created_at: call.createdAt || call.startedAt || null,
    source: 'vapi',
  };
}

function sortNewest(rows) {
  return rows.sort((a, b) => {
    const left = new Date(a.created_at || a.started_at || 0).getTime() || 0;
    const right = new Date(b.created_at || b.started_at || 0).getTime() || 0;
    return right - left;
  });
}

function merge(primary, extra) {
  const seen = new Set(primary.map((row) => row.vapi_call_id || row.id));
  const merged = primary.slice();
  for (const row of extra) {
    const key = row.vapi_call_id || row.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }
  return sortNewest(merged).slice(0, 100);
}

async function listCalls() {
  const results = await Promise.allSettled([
    sb(`live_calls?select=${SELECT}&order=created_at.desc&limit=100`),
    vapiCall('/call?limit=100'),
  ]);

  const stored = results[0].status === 'fulfilled' ? results[0].value || [] : [];
  const remote = results[1].status === 'fulfilled' && Array.isArray(results[1].value)
    ? results[1].value.filter((call) => call && call.id).map(fromVapi)
    : [];

  if (!stored.length && !remote.length) {
    const problems = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason.message);
    if (problems.length) throw new Error(problems.join(' | '));
  }

  return merge(stored, remote);
}

async function getCall(id) {
  let stored = null;
  let storedError = null;
  try {
    stored = await sb(`live_calls?id=eq.${id}&select=${SELECT}`);
  } catch (error) {
    storedError = error;
  }
  if (stored && stored.length) return stored[0];

  try {
    const call = await vapiCall(`/call/${id}`);
    if (call && call.id) return fromVapi(call);
  } catch (error) {
    if (!storedError) throw error;
    throw new Error(`${storedError.message} | ${error.message}`);
  }
  if (storedError) throw storedError;
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const id = (req.query && req.query.id) || '';
  try {
    if (id) {
      if (!UUID.test(id)) {
        return json(res, 400, { error: 'Invalid call id' });
      }
      const call = await getCall(id);
      if (!call) return json(res, 404, { error: 'Call not found' });
      return json(res, 200, { call });
    }

    const calls = await listCalls();
    json(res, 200, { calls });
  } catch (error) {
    console.error('calls:', error.message);
    const failed = ['Supabase', 'Vapi'].filter((name) => String(error.message).includes(name));
    json(res, 502, {
      error: 'Live call data is not reachable right now.',
      ...(failed.length ? { unavailable: failed } : {}),
    });
  }
};
