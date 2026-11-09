/* AI Customer Calling Agent website.
 *
 * Views: home, dashboard, call log, sample and live call detail, build journey,
 * how it works, testing. Sample call records reproduce the captured stages.
 * Live calls come from the Vapi browser agent through the /api functions and
 * are labelled separately. No call audio is stored.
 */

'use strict';

const DATA_TODAY = '2026-11-02';
const TOTAL_TESTS = 104;
const VOICE_API = '/api';
const VOICE_DEMO_URL =
  'https://vapi.ai/?demo=true&shareKey=011447f5-b1c9-43ad-9ffa-7d9048296b50' +
  '&assistantId=ad1793c2-419a-4988-9434-79cef0d4ac62';

const REPLIES = {
  greeting:
    "Hello, and thank you for calling Sample Store Support. I'm an AI assistant, " +
    'and this call may be recorded. I can help with order status, business hours ' +
    'and common questions. How can I help you today?',
  askOrder: 'Of course. Please tell me your order number, for example ORD-1001.',
  fallback:
    "Sorry, I didn't quite understand that. I can help with order status, " +
    'business hours, delivery and returns questions, or connect you to a human ' +
    'representative. Could you rephrase your question?',
  hours:
    'Our team is available Monday to Friday from 9 AM to 6 PM; Saturday from ' +
    '10 AM to 2 PM; closed on Sunday (Asia/Karachi).',
  handoff:
    "I'm connecting you to a human representative now. Our team is available " +
    'Monday to Friday from 9 AM to 6 PM; Saturday from 10 AM to 2 PM; closed on ' +
    'Sunday (Asia/Karachi). A colleague will be with you shortly.',
  autoHandoff:
    "I'm sorry, I'm still having trouble understanding you. I'm connecting you " +
    'to a human representative now. Our team is available Monday to Friday from ' +
    '9 AM to 6 PM; Saturday from 10 AM to 2 PM; closed on Sunday (Asia/Karachi). ' +
    'A colleague will be with you shortly.',
  goodbye: "You're welcome. Thank you for calling Sample Store Support. Goodbye!",
};

const ORDER_REPLIES = {
  'ORD-1001':
    'Order ORD-1001 is marked as Shipped. It left the warehouse and is with the ' +
    'courier. Expected delivery: 30 October 2026. Tracking number: ' +
    'TRK-SAMPLE-1001. Is there anything else I can help you with?',
  'ORD-1002':
    'Order ORD-1002 is marked as Processing. Payment is confirmed and the order ' +
    'is being packed. Expected delivery: 2 November 2026. Is there anything ' +
    'else I can help you with?',
  'ORD-1003':
    'Order ORD-1003 is marked as Delivered. It was delivered to the address on ' +
    'file on 26 October 2026. Tracking number: TRK-SAMPLE-1003. Is there ' +
    'anything else I can help you with?',
  'ORD-1004':
    'Order ORD-1004 is marked as Out for delivery. It is with the delivery rider ' +
    'and is expected today. Tracking number: TRK-SAMPLE-1004. Is there anything ' +
    'else I can help you with?',
  'ORD-1005':
    'Order ORD-1005 is marked as Cancelled. It was cancelled at the customer\'s ' +
    'request and the refund is in progress. Is there anything else I can help ' +
    'you with?',
};

const FAQ_REPLIES = {
  shipping:
    'Standard delivery takes 3 to 5 working days after dispatch. Orders placed ' +
    'before 2 PM are usually dispatched the same working day. Is there anything ' +
    'else I can help you with?',
  charges:
    'Standard delivery is free for sample orders above 3,000 rupees. Below that, ' +
    'a flat sample fee of 250 rupees applies. Is there anything else I can help ' +
    'you with?',
  returns:
    'You can request a return within 7 days of delivery if the item is unused ' +
    'and in its original packaging. Approved refunds are processed within 5 to ' +
    '7 working days. Is there anything else I can help you with?',
  payment:
    'Sample payment methods are cash on delivery, debit or credit card, and bank ' +
    'transfer. Card details are never collected over the phone. Is there ' +
    'anything else I can help you with?',
  warranty:
    'Sample items carry a 6-month limited warranty that covers manufacturing ' +
    'defects. Damage caused by misuse is not covered. Is there anything else I ' +
    'can help you with?',
};

function turn(message, intent, reply, escalated) {
  return { message, intent, reply, escalated: Boolean(escalated) };
}

const CALLS = [
  {
    id: 1,
    started_at: '2026-11-02T17:49:25Z',
    ended_at: '2026-11-02T17:52:10Z',
    caller_phone: '0300-0000001',
    customer_id: 'CUST-001',
    customer_name: 'Sample Customer A',
    outcome: 'transferred',
    escalated: true,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('Where is my order ORD-1002?', 'order_status', ORDER_REPLIES['ORD-1002']),
      turn('How long does delivery take?', 'faq', FAQ_REPLIES.shipping),
      turn('Can you cancel my subscription?', 'fallback', REPLIES.fallback),
      turn('What is the weather in Karachi?', 'fallback', REPLIES.fallback),
      turn('Do you also sell laptops?', 'handoff', REPLIES.autoHandoff, true),
      turn("Okay, that's all. Thank you", 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 2,
    started_at: '2026-11-02T15:12:00Z',
    ended_at: '2026-11-02T15:14:20Z',
    caller_phone: '0300-0000002',
    customer_id: 'CUST-002',
    customer_name: 'Sample Customer B',
    outcome: 'closed',
    escalated: false,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('Has ORD-1003 arrived?', 'order_status', ORDER_REPLIES['ORD-1003']),
      turn('Great, thanks. Bye', 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 3,
    started_at: '2026-11-02T12:40:00Z',
    ended_at: '2026-11-02T12:43:05Z',
    caller_phone: '0300-0000003',
    customer_id: 'CUST-003',
    customer_name: 'Sample Customer C',
    outcome: 'closed',
    escalated: false,
    turns: [
      turn('Hi there', 'greeting', REPLIES.greeting),
      turn('What are your business hours?', 'business_hours', REPLIES.hours),
      turn('What is your return policy?', 'faq', FAQ_REPLIES.returns),
      turn('Okay, thank you', 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 4,
    started_at: '2026-11-01T18:05:00Z',
    ended_at: '2026-11-01T18:08:40Z',
    caller_phone: '0345-1112233',
    customer_id: null,
    customer_name: null,
    outcome: 'transferred',
    escalated: true,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('I need help with my parcel', 'order_status', REPLIES.askOrder),
      turn('Can you book a flight for me?', 'fallback', REPLIES.fallback),
      turn("What's the weather in Karachi?", 'fallback', REPLIES.fallback),
      turn('Do you also sell laptops?', 'handoff', REPLIES.autoHandoff, true),
      turn('Okay, bye', 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 5,
    started_at: '2026-11-01T10:20:00Z',
    ended_at: '2026-11-01T10:22:15Z',
    caller_phone: '0300-0000004',
    customer_id: 'CUST-004',
    customer_name: 'Sample Customer D',
    outcome: 'closed',
    escalated: false,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('Where is ORD-1004?', 'order_status', ORDER_REPLIES['ORD-1004']),
      turn('Perfect, thanks', 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 6,
    started_at: '2026-11-01T09:05:00Z',
    ended_at: '2026-11-01T09:06:50Z',
    caller_phone: '0300-0000005',
    customer_id: 'CUST-005',
    customer_name: 'Sample Customer E',
    outcome: 'closed',
    escalated: false,
    turns: [
      turn('Assalam o Alaikum', 'greeting', REPLIES.greeting),
      turn('Is ORD-1005 cancelled?', 'order_status', ORDER_REPLIES['ORD-1005']),
      turn('Alright, thank you', 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 7,
    started_at: '2026-10-31T16:30:00Z',
    ended_at: '2026-10-31T16:31:40Z',
    caller_phone: '0300-0000001',
    customer_id: 'CUST-001',
    customer_name: 'Sample Customer A',
    outcome: 'open',
    escalated: false,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('Which payment methods do you accept?', 'faq', FAQ_REPLIES.payment),
    ],
  },
  {
    id: 8,
    started_at: '2026-10-31T11:15:00Z',
    ended_at: '2026-10-31T11:18:30Z',
    caller_phone: '0300-0000002',
    customer_id: 'CUST-002',
    customer_name: 'Sample Customer B',
    outcome: 'transferred',
    escalated: true,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('Where is ORD-1002?', 'order_status', ORDER_REPLIES['ORD-1002']),
      turn('Can you change my delivery address?', 'fallback', REPLIES.fallback),
      turn('Please connect me to a person', 'handoff', REPLIES.handoff, true),
    ],
  },
  {
    id: 9,
    started_at: '2026-10-30T14:45:00Z',
    ended_at: '2026-10-30T14:49:10Z',
    caller_phone: '0300-0000003',
    customer_id: 'CUST-003',
    customer_name: 'Sample Customer C',
    outcome: 'closed',
    escalated: false,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('What are the delivery charges?', 'faq', FAQ_REPLIES.charges),
      turn('Is there a warranty?', 'faq', FAQ_REPLIES.warranty),
      turn('What about returns?', 'faq', FAQ_REPLIES.returns),
      turn("That's all, thanks", 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 10,
    started_at: '2026-10-30T10:10:00Z',
    ended_at: '2026-10-30T10:11:55Z',
    caller_phone: '0321-9988776',
    customer_id: null,
    customer_name: null,
    outcome: 'closed',
    escalated: false,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('What time do you close?', 'business_hours', REPLIES.hours),
      turn('Thanks', 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 11,
    started_at: '2026-10-29T13:25:00Z',
    ended_at: '2026-10-29T13:28:20Z',
    caller_phone: '0300-0000004',
    customer_id: 'CUST-004',
    customer_name: 'Sample Customer D',
    outcome: 'closed',
    escalated: false,
    turns: [
      turn('Hi', 'greeting', REPLIES.greeting),
      turn('Where is ORD-1004?', 'order_status', ORDER_REPLIES['ORD-1004']),
      turn('What is the return policy?', 'faq', FAQ_REPLIES.returns),
      turn('Okay bye', 'goodbye', REPLIES.goodbye),
    ],
  },
  {
    id: 12,
    started_at: '2026-10-28T17:55:00Z',
    ended_at: '2026-10-28T17:59:30Z',
    caller_phone: '0300-0000005',
    customer_id: 'CUST-005',
    customer_name: 'Sample Customer E',
    outcome: 'transferred',
    escalated: true,
    turns: [
      turn('Hello', 'greeting', REPLIES.greeting),
      turn('Where is ORD-1005?', 'order_status', ORDER_REPLIES['ORD-1005']),
      turn('I want a refund', 'faq', FAQ_REPLIES.returns),
      turn('Can I speak to a human?', 'handoff', REPLIES.handoff, true),
      turn('Thank you', 'goodbye', REPLIES.goodbye),
    ],
  },
];

/* ---------- Derived data ---------- */

const OUTCOME_LABELS = {
  transferred: 'transferred to a human representative',
  closed: 'closed by the customer',
  open: 'still in progress',
};

function summarize(call) {
  const topics = [];
  for (const item of call.turns) {
    const topic = item.intent.replace(/_/g, ' ');
    if (!topics.includes(topic)) topics.push(topic);
  }
  return (
    `${call.turns.length} customer turn(s); topics: ${topics.join(', ')}; ` +
    `outcome: ${OUTCOME_LABELS[call.outcome]}.`
  );
}

function latestFirst(calls) {
  return [...calls].sort((a, b) => b.started_at.localeCompare(a.started_at));
}

function lastSevenDays() {
  const days = [];
  const end = new Date(`${DATA_TODAY}T00:00:00Z`);
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(end);
    day.setUTCDate(day.getUTCDate() - offset);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

function computeStats(calls) {
  const total = calls.length;
  const escalated = calls.filter((call) => call.escalated).length;
  const turns = calls.reduce((sum, call) => sum + call.turns.length, 0);
  const outcomes = { transferred: 0, closed: 0, open: 0 };
  const intents = {};
  for (const call of calls) {
    outcomes[call.outcome] += 1;
    for (const item of call.turns) {
      intents[item.intent] = (intents[item.intent] || 0) + 1;
    }
  }
  const days = lastSevenDays().map((day) => ({
    day,
    calls: calls.filter((call) => call.started_at.slice(0, 10) === day).length,
  }));
  return {
    total,
    escalated,
    escalationRate: total ? Math.round((escalated * 1000) / total) / 10 : 0,
    totalTurns: turns,
    averageTurns: total ? Math.round((turns * 10) / total) / 10 : 0,
    outcomes,
    intents,
    days,
  };
}

const STATS = computeStats(CALLS);
const SORTED_CALLS = latestFirst(CALLS);

const WEEKS = [
  {
    week: 'Stage 1',
    date: '28 October 2026',
    title: 'Discovery and foundation',
    summary:
      'A text-only support prototype with intent detection, order validation, ' +
      'FAQ answers, fallback handling and a human handoff path.',
    points: [
      'Use case, scope, requirements and risks written down',
      'Eight intents, including invalid order numbers and empty input',
      'Order lookup for ORD-1001 to ORD-1005',
      'Fallback reply and human handoff path',
      '27 unit tests and the Stage 1 report',
    ],
    evidence: '27 automated tests',
    pending: 'First live test call: no telephony account, number or credentials.',
    link: { label: 'See the intent list', href: '#/how-it-works' },
  },
  {
    week: 'Stage 2',
    date: '31 October 2026',
    title: 'Conversation quality and a local voice loop',
    summary:
      'A validated knowledge base, per-call session state, three-strike ' +
      'automatic escalation, a handoff summary and a local voice loop.',
    points: [
      'Knowledge base with five approved FAQ topics (14 tests)',
      'Per-call session with three-strike escalation and handoff summary (12 tests)',
      'Voice pipeline with pluggable speech-to-text and text-to-speech (12 tests)',
      'Windows SAPI speech output with a printed fallback',
      '65 tests in total and the Stage 2 report',
    ],
    evidence: '65 automated tests',
    pending: 'Streaming speech recognition and a live telephony test call.',
    link: { label: 'How the session works', href: '#/how-it-works' },
  },
  {
    week: 'Stage 3',
    date: '2 November 2026',
    title: 'CRM, call log and admin dashboard',
    summary:
      'A local SQLite CRM, a saved call log with transcripts and outcomes, ' +
      'analytics, and a password-protected admin dashboard.',
    points: [
      'SQLite CRM with customers, orders and interactions (10 tests)',
      'Call log with transcript, outcome and caller link (10 tests)',
      'Dashboard login, filters and transcript pages (19 tests)',
      '19 live HTTP checks against the local server',
      '104 tests in total and the Stage 3 report',
    ],
    evidence: '104 automated tests',
    pending: 'Real client CRM API, call recordings and production authentication.',
    link: { label: 'Open the dashboard', href: '#/dashboard' },
  },
  {
    week: 'Stage 4',
    date: '5 November 2026',
    title: 'Live voice agent',
    summary:
      'A browser voice call through Vapi, webhook tools that read the approved ' +
      'orders and FAQs, and finished calls saved to a hosted database.',
    points: [
      'Assistant definition kept in code: five approved tools and a signed webhook',
      'Webhook with secret verification for order status, FAQ, hours, handoff and outcome',
      'Browser call dock with live transcript, mute and end call',
      'Dashboard wired to live calls from the database, with a Vapi API fallback, labelled apart from sample data',
      'Card and CNIC patterns masked before saving; no audio is stored',
      '23 offline API checks, plus a hosted setup page that creates the assistant from this code',
    ],
    evidence: '23 API checks',
    pending: 'Project-assistant test call: the Vapi public and private keys and the Supabase service key still need valid values in Vercel.',
    link: { label: 'Live calls in the dashboard', href: '#/dashboard' },
  },
];

const INTENTS = [
  ['greeting', '"Hello", "Assalam o Alaikum"', 'Returns the greeting and lists what it can help with.'],
  ['order_status', '"Where is ORD-1002?"', 'Validates the order number and reads status, expected date and tracking.'],
  ['business_hours', '"What time do you close?"', 'Answers from the approved business-hours entry.'],
  ['faq', '"What is your return policy?"', 'Answers only from the five approved FAQ topics.'],
  ['handoff', '"Can I speak to a human?"', 'Confirms the transfer and marks the call escalated.'],
  ['goodbye', '"Thanks, bye"', 'Closes the conversation politely.'],
  ['fallback', '"Book me a flight"', 'Says it did not understand and offers the supported topics.'],
  ['empty', '(no input)', 'Asks the caller to repeat and counts it as a failed turn.'],
];

/* ---------- Helpers ---------- */

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function formatTime(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return escapeHtml(iso);
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
  return `${escapeHtml(formatted)} UTC`;
}

function formatShortTime(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return escapeHtml(iso);
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
  return `${escapeHtml(formatted)} UTC`;
}

function formatDay(day) {
  const date = new Date(`${day}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

function badge(outcome) {
  return `<span class="badge ${escapeHtml(outcome)}">${escapeHtml(outcome)}</span>`;
}

function shortText(text, limit = 86) {
  return text.length <= limit ? escapeHtml(text) : `${escapeHtml(text.slice(0, limit - 1))}\u2026`;
}

function plural(count, singular) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

/* ---------- Shared partials ---------- */

function callsTable(calls, emptyMessage) {
  if (!calls.length) {
    return `<div class="empty">${escapeHtml(emptyMessage)}</div>`;
  }
  const rows = calls.map((call) => `
    <tr>
      <td class="num"><a href="#/calls/${call.id}">${call.id}</a></td>
      <td>${formatShortTime(call.started_at)}</td>
      <td class="phone">${escapeHtml(call.caller_phone)}</td>
      <td>${escapeHtml(call.customer_name || 'Unknown caller')}</td>
      <td>${badge(call.outcome)}</td>
      <td class="num">${call.turns.length}</td>
      <td>${shortText(summarize(call))}</td>
    </tr>`).join('');
  return `
    <div class="table-wrap">
      <table class="calls-table">
        <thead>
          <tr>
            <th class="num">Call</th><th>Started</th><th>Caller</th>
            <th>Customer</th><th>Outcome</th><th class="num">Turns</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function barList(entries, tone, labelFn) {
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return `<div class="bars">${entries.map(([name, count]) => `
    <div class="bar-row">
      <span class="bar-label">${escapeHtml(labelFn ? labelFn(name) : name)}</span>
      <span class="bar-value">${count}</span>
      <span class="bar-track"><span class="bar-fill ${tone}" style="width:${Math.round((count / max) * 100)}%"></span></span>
    </div>`).join('')}</div>`;
}

/* ---------- Live voice calls ---------- */

let liveCalls = [];
let liveCallsState = 'idle';
let liveCallsError = '';
const dock = { vapi: null, muted: false, timer: null, started: 0, busy: false };

async function fetchJson(path, options) {
  const response = await fetch(path, {
    headers: { Accept: 'application/json', ...(options && options.headers) },
    ...options,
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

async function loadLiveCalls(force) {
  if (liveCallsState === 'loading') return;
  if (liveCallsState === 'ready' && !force) {
    renderLivePanel();
    return;
  }
  if (liveCallsState === 'error' && !force) {
    renderLivePanel();
    return;
  }
  liveCallsState = 'loading';
  liveCallsError = '';
  try {
    const data = await fetchJson(`${VOICE_API}/calls`);
    liveCalls = Array.isArray(data.calls) ? data.calls : [];
    liveCallsState = 'ready';
  } catch (error) {
    liveCalls = [];
    liveCallsState = 'error';
    liveCallsError = error.message;
  }
  renderLivePanel();
}

function liveBadge() {
  return '<span class="badge live">Live call</span>';
}

function sampleBadge() {
  return '<span class="badge sample">Sample data</span>';
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds === '') return '-';
  const total = Math.max(0, Math.round(Number(seconds)));
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

function liveCallsPanel() {
  return `
    <section class="panel" aria-labelledby="live-calls-title">
      <div class="panel-head">
        <h2 id="live-calls-title">Live calls</h2>
        ${liveBadge()}
      </div>
      <p class="panel-note">Calls from the live voice agent, with their transcript and
        outcome. These are real conversations, separate from the sample records below.</p>
      <div id="live-panel"><div class="empty">Loading live calls\u2026</div></div>
    </section>`;
}

function renderLivePanel() {
  const target = document.getElementById('live-panel');
  if (!target) return;

  if (liveCallsState === 'loading' || liveCallsState === 'idle') {
    target.innerHTML = '<div class="empty">Loading live calls\u2026</div>';
    return;
  }
  if (liveCallsState === 'error') {
    const offline = /404|Failed to fetch|NetworkError/i.test(liveCallsError);
    target.innerHTML = offline
      ? '<div class="empty">Live calling needs the Vercel API deployment. This copy of the site shows sample data only.</div>'
      : '<div class="empty">Live calls are not connected yet: the hosted keys are still being set up. ' +
        'The sample records below are unchanged. <a href="#/setup">Open hosted setup</a></div>';
    return;
  }
  if (!liveCalls.length) {
    target.innerHTML =
      '<div class="empty">No live calls yet. Use \u201cTalk to the agent\u201d to make the first one.</div>';
    return;
  }

  const rows = liveCalls.map((call) => `
    <tr>
      <td><a href="#/live/${encodeURIComponent(call.id)}">${escapeHtml(shortId(call.id))}</a></td>
      <td>${formatShortTime(call.started_at || call.created_at)}</td>
      <td class="phone">${escapeHtml(call.caller_phone || 'Web call')}</td>
      <td>${formatDuration(call.duration_seconds)}</td>
      <td>${badge(call.outcome || 'info_only')}</td>
      <td>${shortText(call.summary || 'No summary saved', 70)}</td>
    </tr>`).join('');

  target.innerHTML = `
    <div class="table-wrap">
      <table class="calls-table">
        <thead>
          <tr><th>Call</th><th>Started</th><th>Caller</th><th>Duration</th>
            <th>Outcome</th><th>Summary</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function shortId(id) {
  return String(id || '').slice(0, 8);
}

async function loadLiveDetail(id) {
  const target = document.getElementById('live-detail');
  if (!target) return;
  try {
    const data = await fetchJson(`${VOICE_API}/calls?id=${encodeURIComponent(id)}`);
    target.innerHTML = liveDetailBody(data.call);
  } catch (error) {
    target.innerHTML = `
      <h1>Live call not found</h1>
      <p class="page-sub">${escapeHtml(error.message)}</p>`;
  }
}

function liveDetailBody(call) {
  const turns = Array.isArray(call.turns) ? call.turns : [];
  const rows = turns.length
    ? turns.map((item, index) => `
      <tr>
        <td class="num">${index + 1}</td>
        <td>${escapeHtml(item.role === 'customer' ? 'Customer' : 'Agent')}</td>
        <td class="turn-message">${escapeHtml(item.text)}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" class="empty">No transcript was saved for this call.</td></tr>';

  return `
    <div class="page-head">
      <div class="call-head">
        <h1>Live call ${escapeHtml(shortId(call.id))}</h1>
        ${liveBadge()} ${badge(call.outcome || 'info_only')}
      </div>
      <p class="page-sub" style="margin:0">${formatTime(call.started_at)} to ${formatTime(call.ended_at)}</p>
    </div>

    <div class="note">
      <strong>Audio:</strong> not recorded or stored. This page holds the text
      transcript and summary only.
    </div>

    <div class="detail-grid">
      <section class="panel" aria-labelledby="live-facts-title">
        <h2 id="live-facts-title">Call details</h2>
        <dl class="facts">
          <dt>Caller</dt><dd>${escapeHtml(call.caller_phone || 'Web call')}</dd>
          <dt>Customer</dt><dd>${escapeHtml(call.customer_name || 'Not given')}</dd>
          <dt>Duration</dt><dd>${formatDuration(call.duration_seconds)}</dd>
          <dt>Outcome</dt><dd>${badge(call.outcome || 'info_only')}</dd>
          <dt>Handoff</dt><dd>${call.handoff ? 'Yes' : 'No'}</dd>
          <dt>Ended because</dt><dd>${escapeHtml(call.ended_reason || '-')}</dd>
          <dt>Summary</dt><dd>${escapeHtml(call.summary || 'No summary saved')}</dd>
        </dl>
      </section>

      <section class="panel" aria-labelledby="live-handoff-title">
        <h2 id="live-handoff-title">Handoff</h2>
        <p class="panel-note" style="margin:0">
          ${call.handoff
            ? 'A handoff summary was created during this call for the receiving colleague.'
            : 'No handoff was needed for this call.'}
        </p>
      </section>
    </div>

    <section class="panel" aria-labelledby="live-transcript-title">
      <h2 id="live-transcript-title">Transcript</h2>
      <p class="panel-note">${plural(turns.length, 'turn')} saved. Card and ID numbers are masked.</p>
      <div class="table-wrap">
        <table class="turns-table">
          <thead><tr><th class="num">#</th><th>Speaker</th><th>Text</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

function liveDetailView(id) {
  return `
    <p class="back"><a href="#/calls">&larr; Back to the call log</a></p>
    <div id="live-detail"><div class="empty">Loading live call\u2026</div></div>`;
}

/* ---------- Browser call dock ---------- */

function ensureDock() {
  let node = document.getElementById('call-dock');
  if (node) return node;
  node = document.createElement('section');
  node.id = 'call-dock';
  node.className = 'call-dock';
  node.setAttribute('aria-live', 'polite');
  node.hidden = true;
  node.innerHTML = `
    <div class="dock-head">
      <span class="dock-title">Sumyia \u00b7 ShopEasy</span>
      <span class="dock-status" id="call-status">Ready</span>
    </div>
    <p class="dock-note" id="call-note">Allow microphone access when the browser asks.</p>
    <div class="dock-transcript" id="call-transcript"></div>
    <div class="dock-actions">
      <button class="btn btn-primary" id="call-mute" type="button" aria-pressed="false" hidden>Mute</button>
      <button class="btn btn-ghost" id="call-end" type="button" hidden>End call</button>
      <button class="btn btn-ghost" id="call-close" type="button">Close</button>
    </div>`;
  document.body.appendChild(node);
  return node;
}

function setDockStatus(text, tone) {
  const status = document.getElementById('call-status');
  if (!status) return;
  status.textContent = text;
  status.className = `dock-status ${tone || ''}`.trim();
}

function setDockNote(text) {
  const note = document.getElementById('call-note');
  if (note) note.textContent = text;
}

function setCallControls(active) {
  const mute = document.getElementById('call-mute');
  const end = document.getElementById('call-end');
  if (mute) mute.hidden = !active;
  if (end) end.hidden = !active;
}

function clearDockDemoLink() {
  ['call-demo-link', 'call-setup-link'].forEach((id) => {
    const link = document.getElementById(id);
    if (link) link.remove();
  });
}

function showDockDemoLink() {
  const note = document.getElementById('call-note');
  if (!note || document.getElementById('call-demo-link')) return;
  const link = document.createElement('a');
  link.id = 'call-demo-link';
  link.className = 'dock-demo';
  link.href = VOICE_DEMO_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Open the Vapi sample call (not Sumyia) \u2192';
  note.insertAdjacentElement('afterend', link);
}

function showDockSetupLink() {
  const note = document.getElementById('call-note');
  if (!note || document.getElementById('call-setup-link')) return;
  const link = document.createElement('a');
  link.id = 'call-setup-link';
  link.className = 'dock-demo';
  link.href = '#/setup';
  link.textContent = 'Open hosted setup \u2192';
  link.addEventListener('click', () => closeDock());
  note.insertAdjacentElement('afterend', link);
}

function appendDockTurn(speaker, text) {
  const box = document.getElementById('call-transcript');
  if (!box) return;
  const line = document.createElement('p');
  line.className = `dock-line ${speaker === 'Customer' ? 'customer' : 'agent'}`;
  const who = document.createElement('span');
  who.textContent = speaker;
  line.appendChild(who);
  line.appendChild(document.createTextNode(text));
  box.appendChild(line);
  while (box.children.length > 8) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
}

function startDockTimer() {
  stopDockTimer();
  dock.started = Date.now();
  dock.timer = window.setInterval(() => {
    const seconds = Math.floor((Date.now() - dock.started) / 1000);
    setDockStatus(`Live \u00b7 ${formatDuration(seconds)}`, 'live');
  }, 1000);
}

function stopDockTimer() {
  if (dock.timer) window.clearInterval(dock.timer);
  dock.timer = null;
}

async function startLiveCall() {
  if (dock.busy) return;
  dock.busy = true;

  const node = ensureDock();
  node.hidden = false;
  const transcript = document.getElementById('call-transcript');
  if (transcript) transcript.innerHTML = '';
  setCallControls(false);
  clearDockDemoLink();
  setDockNote('Checking the live voice setup\u2026');
  setDockStatus('Checking', 'warn');

  try {
    const config = await fetchJson(`${VOICE_API}/config`);
    if (!config.configured) {
      const issue = config.keyIssue || '';
      if (issue === 'masked' || issue === 'placeholder') {
        setDockStatus('Key needs replacing', 'warn');
        setDockNote(
          `The public key saved in hosting is ${issue === 'masked' ? 'masked bullet characters' : 'placeholder text'}, ` +
          'not a usable Vapi key. Replace the VAPI_PUBLIC_KEY value with the key copied ' +
          'from Vapi, then redeploy. The setup page lists what else is still missing.'
        );
      } else if (issue === 'empty') {
        setDockStatus('Setup needed', 'warn');
        setDockNote(
          'No Vapi public key is saved in the hosting project yet. Add VAPI_PUBLIC_KEY, ' +
          'redeploy, then open the setup page. Nothing was recorded and the dashboard ' +
          'still shows sample data.'
        );
      } else {
        setDockStatus('Assistant missing', 'warn');
        setDockNote(
          'The public key is in place, but no assistant matches this project, so a call ' +
          'cannot start. Open the setup page and create the assistant.'
        );
      }
      showDockDemoLink();
      showDockSetupLink();
      return;
    }

    setDockStatus('Connecting\u2026', 'warn');
    setDockNote('Allow microphone access when the browser asks.');

    const module = await import('https://esm.sh/@vapi-ai/web@2');
    const Vapi = module.default || module.Vapi;
    const vapi = new Vapi(config.publicKey);
    dock.vapi = vapi;

    vapi.on('call-start', () => {
      setCallControls(true);
      setDockStatus('Live \u00b7 0:00', 'live');
      setDockNote('You are speaking with Sumyia, an AI assistant. This call is transcribed.');
      startDockTimer();
    });
    vapi.on('speech-start', () => {
      if (!dock.muted) setDockNote('Sumyia is speaking. You can interrupt at any time.');
    });
    vapi.on('speech-end', () => {
      if (!dock.muted) setDockNote('Listening\u2026');
    });
    vapi.on('message', (message) => {
      if (message && message.type === 'transcript' && message.transcriptType === 'final') {
        appendDockTurn(message.role === 'user' ? 'Customer' : 'Agent', message.transcript);
      }
    });
    vapi.on('error', (error) => {
      setCallControls(false);
      setDockStatus('Call error', 'warn');
      setDockNote((error && (error.message || error.errorMsg)) || 'The call could not start.');
    });
    vapi.on('call-end', () => {
      stopDockTimer();
      setCallControls(false);
      setDockStatus('Call ended', '');
      setDockNote('Transcript saving to the dashboard\u2026');
      dock.vapi = null;
      window.setTimeout(() => {
        liveCallsState = 'idle';
        loadLiveCalls(true);
      }, 4000);
    });

    await vapi.start(config.assistantId);
  } catch (error) {
    const message = String(error.message || 'The voice SDK could not load.');
    if (/Request failed \(404\)|Failed to fetch|NetworkError/i.test(message)) {
      setDockStatus('Not available here', 'warn');
      setDockNote('Live calling runs on the deployed site with the API functions. This page is served without that backend.');
      return;
    }
    setDockStatus('Call failed', 'warn');
    setDockNote(`${message} Check the microphone permission and connection.`);
  } finally {
    dock.busy = false;
  }
}

function stopLiveCall() {
  if (dock.vapi) {
    try {
      dock.vapi.stop();
    } catch {
      // the call is already closed
    }
    dock.vapi = null;
  }
  stopDockTimer();
  setCallControls(false);
  setDockStatus('Call ended', '');
}

function toggleMute() {
  const button = document.getElementById('call-mute');
  if (!dock.vapi || !button) return;
  dock.muted = !dock.muted;
  dock.vapi.setMuted(dock.muted);
  button.setAttribute('aria-pressed', String(dock.muted));
  button.textContent = dock.muted ? 'Unmute' : 'Mute';
  setDockNote(dock.muted ? 'Microphone muted.' : 'Listening\u2026');
}

function closeDock() {
  stopLiveCall();
  const node = document.getElementById('call-dock');
  if (node) node.hidden = true;
}

/* ---------- Home ---------- */

function homeView() {
  const features = [
    ['01', 'Understands the request', 'Every customer turn maps to one of eight support intents, from order status to a direct request for a human.'],
    ['02', 'Checks approved data only', 'Order answers come from the CRM. Hours and FAQ answers come from validated knowledge-base entries, so the agent does not guess.'],
    ['03', 'Speaks in short sentences', 'Replies are written for a phone call: one or two plain sentences that a voice can read naturally.'],
    ['04', 'Escalates on purpose', 'A direct request, or three failed turns in a row, transfers the caller with a summary attached.'],
    ['05', 'Logs every call', 'The finished call is saved with its transcript, outcome and summary. Live web calls go to the hosted call log and appear in the dashboard.'],
    ['06', 'Shows the numbers', 'The dashboard turns the call log into escalation rate, average turns, intent counts and daily volume.'],
  ];

  const featureCards = features.map(([num, title, text]) => `
    <article class="feature">
      <span class="feature-num">${num}</span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </article>`).join('');

  const timeline = WEEKS.map((item) => `
    <div class="tl-item">
      <span class="tl-week">${escapeHtml(item.week)}</span>
      <span class="tl-date">${escapeHtml(item.date)}</span>
      <h3 class="tl-title">${escapeHtml(item.title)}</h3>
      <p class="tl-text">${escapeHtml(item.summary)}</p>
      <span class="tl-tests">${escapeHtml(item.evidence)}</span>
    </div>`).join('');

  const arch = [
    ['01', 'Speech in', 'The caller speaks in the browser; Vapi handles the microphone, speech recognition and the reply.'],
    ['02', 'Intent', 'The sentence is classified into one of eight intents.'],
    ['03', 'Data lookup', 'Orders, hours and FAQs are read through tools from the approved tables.'],
    ['04', 'Session policy', 'Failed turns are counted; a handoff summary is prepared.'],
    ['05', 'Voice reply', 'Vapi speaks a short approved sentence back to the caller.'],
    ['06', 'Record', 'The finished call is written to the hosted call log and shown in the dashboard.'],
  ].map(([num, title, note]) => `
    <div class="arch-step">
      <span class="arch-num">${num}</span>
      <span class="arch-title">${escapeHtml(title)}</span>
      <span class="arch-note">${escapeHtml(note)}</span>
    </div>`).join('');

  return `
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">AI customer support</p>
      <h1>AI Customer<br>Calling Agent</h1>
      <p class="hero-lead">A customer-support voice agent that understands a request,
        answers from approved business data in short speakable sentences, and
        transfers the caller to a human when it should.</p>
      <div class="hero-actions">
        <button class="btn btn-live" type="button" data-action="talk">Talk to the agent</button>
        <a class="btn btn-ghost" href="#/dashboard">Open the dashboard</a>
        <a class="btn btn-ghost" href="#/how-it-works">See how it works</a>
      </div>
      <p class="hero-meta">Vapi voice agent &middot; hosted call log &middot; English voice &middot; 104 tests + 23 API checks</p>
    </div>

    <div class="call-card" aria-label="Sample call excerpt">
      <div class="call-card-head">
        <div>
          <span class="cc-kicker">Call #1</span>
          <span class="cc-sub">2 November 2026 &middot; 2m 45s &middot; sample data</span>
        </div>
        ${badge('transferred')}
      </div>
      <div class="cc-turn">
        <p class="cc-said"><span class="cc-who">Customer</span>Where is my order ORD-1002?</p>
        <p class="cc-reply"><span class="cc-intent">order status</span>Order ORD-1002 is marked as Processing. Payment is confirmed and the order is being packed. Expected delivery: 2 November 2026.</p>
      </div>
      <div class="cc-turn">
        <p class="cc-said"><span class="cc-who">Customer</span>How long does delivery take?</p>
        <p class="cc-reply"><span class="cc-intent">faq</span>Standard delivery takes 3 to 5 working days after dispatch.</p>
      </div>
      <div class="cc-turn">
        <p class="cc-said"><span class="cc-who">Customer</span>What is the weather in Karachi?</p>
        <p class="cc-reply"><span class="cc-intent">fallback</span>Sorry, I didn't quite understand that. I can help with order status, business hours, delivery and returns questions, or connect you to a human representative.</p>
      </div>
      <div class="call-card-foot">
        <span class="dot" aria-hidden="true"></span>
        Escalated after three unrecognised turns &mdash; handoff summary attached
      </div>
    </div>
  </section>

  <section class="stat-band" aria-label="Project at a glance">
    <div class="stat"><span class="stat-value">${TOTAL_TESTS}</span><span class="stat-label">Automated tests passing</span></div>
    <div class="stat"><span class="stat-value">8</span><span class="stat-label">Supported intents</span></div>
    <div class="stat"><span class="stat-value">12</span><span class="stat-label">Calls in the log</span></div>
    <div class="stat"><span class="stat-value">4</span><span class="stat-label">Build stages delivered</span></div>
  </section>

  <section class="section">
    <div class="live-band">
      <div>
        <p class="section-kicker">Live voice agent</p>
        <h2>Talk to Sumyia in the browser</h2>
        <p>Press the button, allow the microphone and speak in English.
          When the hosted keys are present the call runs inside this page and the
          finished call is saved to the dashboard with its transcript and outcome.</p>
        <p class="live-band-note">Browser calls only: no phone number is connected.
          Urdu and mixed-language speech are the next step. Audio is never stored.
          The second button opens Vapi's own sample assistant, not Sumyia, and its
          calls are not saved to this dashboard.</p>
      </div>
      <div class="live-band-actions">
        <button class="btn btn-live" type="button" data-action="talk">Talk to the agent</button>
        <a class="btn btn-ghost" href="${VOICE_DEMO_URL}" target="_blank" rel="noopener">Vapi sample call (not Sumyia)</a>
        <a class="btn btn-ghost" href="#/dashboard">See live calls</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <p class="section-kicker">Capabilities</p>
      <h2>What the agent does</h2>
      <p>Six behaviours make up the support flow, from reading the request to
        saving the call for the team.</p>
    </div>
    <div class="feature-grid">${featureCards}</div>
  </section>

  <section class="section">
    <div class="section-head">
      <p class="section-kicker">Timeline</p>
      <h2>Built in four stages</h2>
      <p>Each stage added one layer: the decision logic, the conversation and
        local voice loop, the business system, then the live voice agent.</p>
    </div>
    <div class="timeline">${timeline}</div>
    <p style="margin:16px 0 0"><a class="link-arrow" href="#/journey">Read the full build journey</a></p>
  </section>

  <section class="section">
    <div class="section-head">
      <p class="section-kicker">Architecture</p>
      <h2>How a call flows</h2>
      <p>Six stages from the caller's sentence to the saved call record.</p>
    </div>
    <div class="arch-flow">${arch}</div>
    <p style="margin:16px 0 0"><a class="link-arrow" href="#/how-it-works">Read the full architecture</a></p>
  </section>

  <section class="section">
    <div class="grid-2">
      <div class="panel">
        <h2>Working today</h2>
        <ul class="scope-list yes">
          <li>Intent detection across eight intents, including empty input</li>
          <li>Order status from five approved sample orders</li>
          <li>Five approved FAQ topics plus business hours</li>
          <li>Three-strike automatic escalation with a handoff summary</li>
          <li>Vapi browser voice call wired to the approved-data tools</li>
          <li>Hosted call log wired to the dashboard, labelled separately from sample data</li>
          <li>Admin dashboard with sample calls, transcript view and analytics</li>
          <li>104 automated tests and 23 offline API checks</li>
        </ul>
      </div>
      <div class="panel">
        <h2>Not connected yet</h2>
        <ul class="scope-list no">
          <li>Real phone number and public telephony line</li>
          <li>Project-assistant test call: valid Vapi and Supabase key values are still missing in Vercel</li>
          <li>Urdu and mixed Urdu-English speech</li>
          <li>Client CRM or order API (sample orders stand in)</li>
          <li>Call recordings, audio storage and playback (not stored by design)</li>
          <li>Production login with admin and viewer roles</li>
          <li>Outbound calling, calling hours and a Do-Not-Call list</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="cta-band">
    <div>
      <h2>Explore the build</h2>
      <p>The dashboard shows the call log and analytics. The journey page covers
        each stage, and the testing page lists every suite and the captured results.</p>
    </div>
    <div class="cta-links">
      <a class="btn btn-primary" href="#/dashboard">Dashboard</a>
      <a class="btn btn-ghost" href="#/journey">Journey</a>
      <a class="btn btn-ghost" href="#/testing">Testing</a>
    </div>
  </section>`;
}

/* ---------- Dashboard ---------- */

function dashboardView() {
  const outcomeEntries = ['transferred', 'closed', 'open']
    .map((name) => [name, STATS.outcomes[name]]);
  const intentEntries = Object.entries(STATS.intents)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const maxDay = Math.max(...STATS.days.map((day) => day.calls), 1);
  const dayChart = STATS.days.map((day) => `
    <div class="day-col" title="${day.calls} call(s) on ${day.day}">
      <span class="day-value">${day.calls}</span>
      <span class="day-bar" style="height:${Math.max(3, Math.round((day.calls / maxDay) * 110))}px"></span>
      <span class="day-name">${formatDay(day.day)}</span>
    </div>`).join('');

  return `
    <div class="page-head">
      <div>
        <h1>Dashboard</h1>
        <p class="page-sub">Live browser calls next to the ${STATS.total} sample
          records from 27 October to 2 November 2026. Every row says which kind it
          is. No audio is recorded.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-live" type="button" data-action="talk">Talk to the agent</button>
      </div>
    </div>

    <section class="cards" aria-label="Key numbers">
      <div class="card">
        <div class="value">${STATS.total}</div>
        <div class="label">Sample calls</div>
        <div class="detail">27 Oct to 2 Nov 2026</div>
      </div>
      <div class="card">
        <div class="value">${STATS.escalated}</div>
        <div class="label">Transferred to a human</div>
        <div class="detail">Requested or automatic handoff</div>
      </div>
      <div class="card">
        <div class="value">${STATS.escalationRate}%</div>
        <div class="label">Escalation rate</div>
        <div class="detail">${STATS.escalated} of ${plural(STATS.total, 'call')}</div>
      </div>
      <div class="card">
        <div class="value">${STATS.averageTurns}</div>
        <div class="label">Average turns per call</div>
        <div class="detail">${plural(STATS.totalTurns, 'turn')} in total</div>
      </div>
    </section>

    ${liveCallsPanel()}

    <section class="panel journey-strip" aria-labelledby="weeks-title">
      <h2 id="weeks-title">Build stages</h2>
      <ol class="week-chips">
        <li><span class="week-tag">Stage 1</span><span>Text support prototype</span><span class="chip-note">27 tests</span></li>
        <li><span class="week-tag">Stage 2</span><span>Knowledge base, session and voice loop</span><span class="chip-note">65 tests</span></li>
        <li><span class="week-tag">Stage 3</span><span>CRM, call log and dashboard</span><span class="chip-note">104 tests</span></li>
      </ol>
      <p class="panel-note" style="margin:0">Live web calling runs on the browser
        agent. A phone number is not connected. <a href="#/journey">See the full build journey</a>.</p>
    </section>

    <div class="grid-2">
      <div>
        <section class="panel" aria-labelledby="recent-title">
          <div class="panel-head">
            <h2 id="recent-title">Recent calls</h2>
            ${sampleBadge()}
          </div>
          <p class="panel-note">Sample records, newest first. Open a call for its full text transcript.</p>
          ${callsTable(SORTED_CALLS.slice(0, 6), 'No calls recorded yet.')}
          <p style="margin:12px 0 0"><a class="link-arrow" href="#/calls">Open the full call log</a></p>
        </section>

        <section class="panel" aria-labelledby="intents-title">
          <h2 id="intents-title">Intents across all turns</h2>
          <p class="panel-note">Every customer turn is classified before the agent replies.</p>
          ${intentEntries.length
            ? barList(intentEntries, 'navy', (name) => name.replace(/_/g, ' '))
            : '<div class="empty">No turns recorded yet.</div>'}
        </section>
      </div>

      <div>
        <section class="panel" aria-labelledby="outcomes-title">
          <h2 id="outcomes-title">Outcomes</h2>
          ${barList(outcomeEntries, 'warm')}
        </section>

        <section class="panel" aria-labelledby="days-title">
          <h2 id="days-title">Calls per day</h2>
          <p class="panel-note">Last seven days, UTC.</p>
          <div class="day-chart" role="img" aria-label="Bar chart of calls per day for the last seven days">${dayChart}</div>
        </section>

        <section class="panel" aria-labelledby="data-title">
          <h2 id="data-title">About this data</h2>
          <p class="panel-note" style="margin:0">
            Sample customer names, phone numbers, orders and transcripts fill the
            ${STATS.total}-call log. Live browser calls are stored separately in the
            hosted database and marked <strong>Live call</strong>. No telephony line
            or audio recording is connected.
          </p>
        </section>
      </div>
    </div>`;
}

/* ---------- Calls ---------- */

let activeFilter = 'all';

function filteredCalls() {
  return activeFilter === 'all'
    ? SORTED_CALLS
    : SORTED_CALLS.filter((call) => call.outcome === activeFilter);
}

function callsView() {
  const filters = [
    ['all', 'All', SORTED_CALLS.length],
    ['transferred', 'Transferred', STATS.outcomes.transferred],
    ['closed', 'Closed', STATS.outcomes.closed],
    ['open', 'Open', STATS.outcomes.open],
  ];
  const chips = filters.map(([value, label, count]) => `
    <button type="button" data-filter="${value}" class="${activeFilter === value ? 'active' : ''}">
      ${label} <span class="bar-value">${count}</span>
    </button>`).join('');
  const calls = filteredCalls();
  return `
    <div class="page-head">
      <div>
        <h1>Call log</h1>
        <p class="page-sub">Live browser calls first, then the saved sample calls.
          Open any row for the full transcript.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-live" type="button" data-action="talk">Talk to the agent</button>
      </div>
    </div>

    ${liveCallsPanel()}

    <section class="panel" aria-labelledby="sample-calls-title">
      <div class="panel-head">
        <h2 id="sample-calls-title">Sample calls</h2>
        ${sampleBadge()}
      </div>
      <div class="filters" role="group" aria-label="Filter sample calls by outcome">${chips}</div>
      ${callsTable(calls, 'No calls match this filter.')}
    </section>`;
}

function detailView(callId) {
  const call = CALLS.find((item) => item.id === callId);
  if (!call) {
    return `
      <p class="back"><a href="#/calls">&larr; Back to the call log</a></p>
      <h1>Call not found</h1>
      <p class="page-sub">That call does not exist in this call log.</p>`;
  }

  const rows = call.turns.map((item, index) => `
    <tr>
      <td class="num">${index + 1}</td>
      <td class="turn-message">${escapeHtml(item.message)}</td>
      <td>${escapeHtml(item.intent)}${item.escalated ? '<span class="escalated-tag">escalated</span>' : ''}</td>
      <td class="turn-reply">${escapeHtml(item.reply)}</td>
    </tr>`).join('');

  return `
    <p class="back"><a href="#/calls">&larr; Back to the call log</a></p>
    <div class="page-head">
      <div class="call-head">
        <h1>Call #${call.id}</h1>
        ${badge(call.outcome)}
      </div>
      <p class="page-sub" style="margin:0">${formatTime(call.started_at)} to ${formatTime(call.ended_at)}</p>
    </div>

    <div class="note">
      <strong>Audio:</strong> not recorded. Calls are simulated with typed customer
      input, so this page holds the text transcript only.
    </div>

    <div class="detail-grid">
      <section class="panel" aria-labelledby="facts-title">
        <h2 id="facts-title">Call details</h2>
        <dl class="facts">
          <dt>Customer</dt><dd>${escapeHtml(call.customer_name || 'Unknown caller')}</dd>
          <dt>Customer id</dt><dd class="phone">${escapeHtml(call.customer_id || '-')}</dd>
          <dt>Caller number</dt><dd class="phone">${escapeHtml(call.caller_phone)}</dd>
          <dt>Outcome</dt><dd>${badge(call.outcome)}</dd>
          <dt>Escalated</dt><dd>${call.escalated ? 'Yes' : 'No'}</dd>
          <dt>Started</dt><dd>${formatTime(call.started_at)}</dd>
          <dt>Ended</dt><dd>${formatTime(call.ended_at)}</dd>
          <dt>Summary</dt><dd>${escapeHtml(summarize(call))}</dd>
        </dl>
      </section>

      <section class="panel" aria-labelledby="handoff-title">
        <h2 id="handoff-title">Handoff note</h2>
        <p class="panel-note" style="margin:0">
          ${call.escalated
            ? 'A human representative was requested or triggered automatically. The summary above is what the receiving colleague sees, so the customer does not have to repeat themselves.'
            : 'No handoff was needed. The call ended without a transfer.'}
        </p>
      </section>
    </div>

    <section class="panel" aria-labelledby="transcript-title">
      <h2 id="transcript-title">Transcript</h2>
      <p class="panel-note">${plural(call.turns.length, 'customer turn')} in this call.</p>
      <div class="table-wrap">
        <table class="turns-table">
          <thead><tr><th class="num">#</th><th>Customer</th><th>Intent</th><th>Agent reply</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

/* ---------- Build journey ---------- */

function journeyView() {
  const cards = WEEKS.map((item) => `
    <article class="week-card">
      <div class="week-head">
        <span class="week-tag">${escapeHtml(item.week)}</span>
        <span class="week-date">${escapeHtml(item.date)}</span>
      </div>
      <h2 class="week-title">${escapeHtml(item.title)}</h2>
      <ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
      <div class="week-links"><a href="${escapeHtml(item.link.href)}">${escapeHtml(item.link.label)} &rarr;</a></div>
      <div class="week-foot">
        <span class="status done">Delivered</span>
        <span>${escapeHtml(item.evidence)}</span>
      </div>
      <p class="week-pending">Pending access: ${escapeHtml(item.pending)}</p>
    </article>`).join('');

  const nextSteps = [
    'Add valid Vapi and Supabase key values in Vercel, redeploy, then run the hosted setup page to create the assistant.',
    'Run the first live test calls: order status, FAQ and escalation, with latency measured.',
    'Add Urdu and mixed Urdu-English speech.',
    'Put server-side admin and viewer login in front of the live-call API.',
    'Connect the client CRM or order API in place of the sample database.',
    'Add appointments, outbound calling with calling hours, and a Do-Not-Call list.',
  ].map((step) => `<li class="step-text" style="padding:6px 0">${escapeHtml(step)}</li>`).join('');

  const accessRows = [
    ['Vapi public and private keys', 'Create the assistant and start the browser call'],
    ['Supabase project URL and service-role key', 'Hosted order, FAQ and call tables'],
    ['Vercel environment variables', 'Keep server keys out of the browser and repository'],
    ['Vapi webhook secret', 'Prove that each tool call comes from Vapi'],
    ['Setup token', 'Protect the one-time assistant creation endpoint'],
    ['Supabase schema, already applied', 'Tables, sample orders and FAQs exist in the hosted project'],
    ['Microphone permission', 'Speak to the agent in the browser'],
    ['Approved content and a caller notice', 'Replace sample data before any client call'],
  ].map(([item, purpose]) => `<tr><td>${escapeHtml(item)}</td><td>${escapeHtml(purpose)}</td></tr>`).join('');

  return `
    <div class="page-head">
      <div>
        <h1>Build journey</h1>
        <p class="page-sub">What each build stage delivered, how it was tested and
          what still needs external access. Stages 1 to 3 run on the local
          prototype. Stage 4 is deployed through Vapi: the API functions, the hosted
          tables and a setup page that builds the assistant are live, while the
          project assistant waits on valid key values in the hosting project.</p>
      </div>
    </div>

    <div class="week-grid" style="margin-top:24px">${cards}</div>

    <section class="panel" style="margin-top:22px" aria-labelledby="next-title">
      <h2 id="next-title">Next steps</h2>
      <p class="panel-note">The remaining work depends on accounts and access that
        are not available in this environment.</p>
      <ul style="margin:0;padding-left:20px;font-size:13.5px">${nextSteps}</ul>
    </section>

    <div class="grid-2" style="margin-top:18px">
      <section class="panel" aria-labelledby="access-title">
        <h2 id="access-title">Access required for a live call</h2>
        <p class="panel-note">The key values are the remaining block. The schema,
          API functions and setup page are already in place.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Access</th><th>Purpose</th></tr></thead>
            <tbody>${accessRows}</tbody>
          </table>
        </div>
      </section>

      <section class="panel" aria-labelledby="blocked-title">
        <h2 id="blocked-title">Still blocked</h2>
        <p class="panel-note" style="margin:0">
          No phone line is connected. The API functions, the hosted tables and the setup
          page are deployed; the project assistant still needs valid key values in Vercel
          before a call can run on this page and be saved to the call log. A key-free link
          to Vapi's own sample assistant is available, and those calls are not saved here.
        </p>
      </section>
    </div>`;
}

/* ---------- How it works ---------- */

function howItWorksView() {
  const steps = [
    ['Reception', 'The caller speaks in the browser. Vapi handles the microphone, speech recognition and the spoken reply.'],
    ['Intent detection', 'Phrase rules classify the turn: greeting, order status, business hours, FAQ, handoff, goodbye, fallback or empty.'],
    ['Approved data', 'Orders and FAQs come from the approved tables. Live calls read Supabase; the sample dashboard reads bundled sample calls.'],
    ['Session policy', 'A per-call session counts failed turns. Three in a row, or any direct request, triggers a handoff and prepares a summary.'],
    ['Spoken reply', 'Vapi speaks a short approved sentence; the call dock shows the transcript as the call runs.'],
    ['Persistence', 'The end-of-call report is saved to the hosted call log with transcript, summary, outcome and duration. No audio is stored.'],
    ['Visibility', 'The dashboard reads the call log to show volume, escalation rate, intents and average turns.'],
  ].map(([title, text], index) => `
    <li class="step">
      <span class="step-num">${index + 1}</span>
      <span>
        <span class="step-title">${escapeHtml(title)}</span>
        <span class="step-text">${escapeHtml(text)}</span>
      </span>
    </li>`).join('');

  const intentRows = INTENTS.map(([name, example, behavior]) => `
    <tr>
      <td class="phone">${escapeHtml(name)}</td>
      <td>${escapeHtml(example)}</td>
      <td>${escapeHtml(behavior)}</td>
    </tr>`).join('');

  const dataRows = [
    ['customers', 'Customer id, name, phone and notes for the sample callers.'],
    ['orders', 'Order number, status, expected delivery and tracking number.'],
    ['interactions', 'Customer-linked notes created during support work.'],
    ['calls', 'One row per finished call: caller, start, end, outcome and escalation.'],
    ['call_turns', 'Each customer message with its intent, reply and escalation flag.'],
  ].map(([name, purpose]) => `<tr><td class="phone">${escapeHtml(name)}</td><td>${escapeHtml(purpose)}</td></tr>`).join('');

  const stackRows = [
    ['Prototype', 'Python 3.12 (3.10+) with the standard library; 104 tests'],
    ['Voice', 'Vapi: Deepgram speech recognition, an OpenAI assistant model and a Vapi voice'],
    ['API', 'Node.js serverless functions on Vercel, with the webhook secret checked on every call'],
    ['Hosted data', 'Supabase Postgres: orders, faqs, live_calls, handoffs and settings'],
    ['Sample data', 'SQLite CRM and call log behind the Python prototype and the sample records'],
    ['This site', 'Plain HTML, CSS and JavaScript with hash routing, no build step'],
    ['Reports', 'python-docx generator scripts with a shared black and navy theme'],
  ].map(([layer, tech]) => `<tr><td>${escapeHtml(layer)}</td><td>${escapeHtml(tech)}</td></tr>`).join('');

  return `
    <div class="page-head">
      <div>
        <h1>How it works</h1>
        <p class="page-sub">The pipeline, the eight intents, the escalation rules,
          the data model and the safety limits of the local build, plus what the
          hosted version adds.</p>
      </div>
    </div>

    <section class="section" style="margin-top:26px">
      <div class="section-head">
        <p class="section-kicker">Pipeline</p>
        <h2>From sentence to saved call</h2>
      </div>
      <ol class="steps">${steps}</ol>
    </section>

    <section class="section">
      <div class="section-head">
        <p class="section-kicker">Intents</p>
        <h2>What the agent understands</h2>
        <p>Anything outside these categories becomes a fallback, and repeated
          fallbacks lead to a human.</p>
      </div>
      <div class="panel" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Intent</th><th>Example</th><th>Response</th></tr></thead>
            <tbody>${intentRows}</tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="grid-2">
        <div class="panel">
          <h2>Escalation rules</h2>
          <ul class="scope-list yes">
            <li>A direct request such as "can I speak to a human" transfers immediately.</li>
            <li>Three failed turns in a row trigger an automatic transfer.</li>
            <li>Empty input counts as a failed turn.</li>
            <li>Once escalated, the session stops trying to answer and prepares the handoff.</li>
          </ul>
        </div>
        <div class="panel">
          <h2>Handoff summary</h2>
          <p class="panel-note" style="margin:0">
            The summary lists the customer, the number of turns, the topics that
            came up and the reason for the transfer. It is attached to the saved
            call so the receiving colleague can continue without making the caller
            repeat everything.
          </p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <p class="section-kicker">Data</p>
        <h2>Data model</h2>
      </div>
      <div class="grid-2">
        <div class="panel">
          <h2>Sample database tables</h2>
          <p class="panel-note">These SQLite tables back the sample dashboard. Live
            calls use the Supabase tables: orders, faqs, live_calls, handoffs and
            settings.</p>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Table</th><th>Holds</th></tr></thead>
              <tbody>${dataRows}</tbody>
            </table>
          </div>
        </div>
        <div class="panel">
          <h2>Dashboard safety</h2>
          <ul class="scope-list yes">
            <li>Binds to loopback only by default</li>
            <li>Password checked with a constant-time comparison</li>
            <li>HttpOnly and SameSite=Strict session cookie</li>
            <li>All rendered values are HTML-escaped</li>
            <li>Request bodies are capped at 4 KB</li>
            <li>Sessions live in memory; restarting signs everyone out</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <p class="section-kicker">Stack</p>
        <h2>Built with</h2>
      </div>
      <div class="panel" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Layer</th><th>Technology</th></tr></thead>
            <tbody>${stackRows}</tbody>
          </table>
        </div>
      </div>
    </section>`;
}

/* ---------- Testing ---------- */

function testingView() {
  const suites = [
    ['test_agent.py', 'Intents, replies, order validation and escalation flags', 27],
    ['test_knowledge_base.py', 'Approved FAQ entries, lookup and unknown topics', 14],
    ['test_session.py', 'Per-call state, three-strike rule and handoff summary', 12],
    ['test_voice_pipeline.py', 'Speech interfaces, pipeline order and escalation', 12],
    ['test_crm.py', 'Customers, orders, interactions and seed data', 10],
    ['test_call_store.py', 'Saved calls, transcripts and analytics', 10],
    ['test_dashboard.py', 'Login, pages, filters, escaping and logout', 19],
  ].map(([file, covers, count]) => `
    <tr>
      <td class="phone">${escapeHtml(file)}</td>
      <td>${escapeHtml(covers)}</td>
      <td class="num">${count}</td>
    </tr>`).join('');

  const downloads = [
    ['Stage 1', 'WEEK1_DEVELOPMENT_DOCUMENT.docx', 'Discovery, intents, prototype'],
    ['Stage 2', 'WEEK2_DEVELOPMENT_DOCUMENT.docx', 'Knowledge base, session, voice loop'],
    ['Stage 3', 'WEEK3_DEVELOPMENT_DOCUMENT.docx', 'CRM, call log, dashboard'],
  ].map(([stage, file, meta]) => `
    <a class="download" href="${file}" download>
      <span class="file-tag">DOCX</span>
      <strong>${escapeHtml(stage)} report</strong>
      <span class="download-meta">${escapeHtml(meta)}</span>
    </a>`).join('');

  return `
    <div class="page-head">
      <div>
        <h1>Testing</h1>
        <p class="page-sub">Seven test suites, ${TOTAL_TESTS} tests and a live HTTP
          check of the dashboard. The results below were captured from the local
          build, not from this static site.</p>
      </div>
    </div>

    <section class="cards" aria-label="Test totals">
      <div class="card">
        <div class="value">${TOTAL_TESTS}</div>
        <div class="label">Tests passing</div>
        <div class="detail">Run on Python 3.12.10</div>
      </div>
      <div class="card">
        <div class="value">7</div>
        <div class="label">Test suites</div>
        <div class="detail">Agent, knowledge, session, voice, CRM, log, dashboard</div>
      </div>
      <div class="card">
        <div class="value">0</div>
        <div class="label">Failures</div>
        <div class="detail">Last full run: OK</div>
      </div>
      <div class="card">
        <div class="value">19</div>
        <div class="label">Dashboard HTTP checks</div>
        <div class="detail">Login, pages, filters, escaping, logout</div>
      </div>
    </section>

    <section class="section" style="margin-top:8px">
      <div class="section-head">
        <p class="section-kicker">Coverage</p>
        <h2>What each suite checks</h2>
      </div>
      <div class="panel" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Suite</th><th>Covers</th><th class="num">Tests</th></tr></thead>
            <tbody>${suites}</tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="grid-2">
        <div class="panel">
          <h2>Run the suites</h2>
          <p class="panel-note">From the project root, with no third-party packages:</p>
          <pre class="code">python -m unittest discover -s tests -t . -v</pre>
          <h2 style="margin-top:16px">Run the agent</h2>
          <pre class="code">python -m src.cli --demo
python -m src.voice.demo --silent
python -m src.dashboard</pre>
        </div>
        <div class="panel">
          <h2>Captured evidence</h2>
          <ul class="scope-list yes">
            <li>Full test output: 104 tests, 0 failures</li>
            <li>Dashboard HTTP check: 19 of 19 passed</li>
            <li>Static site check: 13 of 13 rendering checks passed</li>
            <li>Simulated call transcripts saved for the sample stages</li>
            <li>Step A API check: 23 of 23 passed with stubbed services</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <p class="section-kicker">Reports</p>
        <h2>Development reports</h2>
        <p>Each report covers that stage's scope, implementation, tests and the
          access that is still pending.</p>
      </div>
      <div class="downloads">${downloads}</div>
    </section>

    <section class="callout" style="margin-top:22px">
      <h2>Not covered by these tests</h2>
      <p>Live telephony, streaming speech recognition, a real client CRM and call
        recordings are not connected, so there are no automated tests for them.
        The suite covers the decision layer, the session rules, the voice-pipeline
        interfaces, the local database and the dashboard server.</p>
    </section>`;
}

/* ---------- Hosted setup ---------- */

const SETUP_TOKEN_KEY = 'shopeasy.setupToken';

function readSetupToken() {
  const input = document.getElementById('setup-token');
  const typed = input && input.value ? input.value.trim() : '';
  if (!typed) {
    try { return sessionStorage.getItem(SETUP_TOKEN_KEY) || ''; } catch { return ''; }
  }
  try { sessionStorage.setItem(SETUP_TOKEN_KEY, typed); } catch { /* storage can be disabled */ }
  return typed;
}

function setupResult(html, tone) {
  const box = document.getElementById('setup-output');
  if (!box) return;
  box.className = `setup-result ${tone || ''}`.trim();
  box.innerHTML = html;
}

function setupRow(label, ok) {
  return `<li>${escapeHtml(label)}: ${ok ? 'set' : 'missing'}</li>`;
}

function setupView() {
  return `
    <div class="page-head">
      <div>
        <p class="section-kicker">Hosted setup</p>
        <h1>Connect the live agent</h1>
        <p>Two things are needed before a call can run inside this page: the Vapi keys in
          the hosting environment, and an assistant built from the definition in this project.
          This page never displays a key value.</p>
      </div>
    </div>

    <div class="grid-2">
      <section class="panel" aria-labelledby="setup-keys-title">
        <div class="panel-head">
          <h2 id="setup-keys-title">1. Environment variables</h2>
        </div>
        <p class="panel-note">Set these in the hosting project, then redeploy. Values are
          entered there, never in this site or the repository. A saved change takes effect
          only after the newest deployment is rebuilt. If the setup token is no longer
          known, replace <code>SETUP_TOKEN</code> with a new value you choose, redeploy, and
          use that value below.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Where the value comes from</th></tr></thead>
            <tbody>
              <tr><td><code>VAPI_PUBLIC_KEY</code></td><td>Vapi \u2192 API Keys \u2192 Public API keys.
                Use <strong>Add Key</strong>, because an existing key is only shown as dots.</td></tr>
              <tr><td><code>VAPI_PRIVATE_KEY</code></td><td>Vapi \u2192 API Keys \u2192 Private API keys.
                Server only; never used in the browser.</td></tr>
              <tr><td><code>VAPI_SERVER_SECRET</code></td><td>A long random string you choose.
                Vapi sends it back with every webhook request.</td></tr>
              <tr><td><code>SETUP_TOKEN</code></td><td>Another string you choose. It unlocks the
                two buttons in the next panel.</td></tr>
              <tr><td><code>SUPABASE_URL</code></td><td>Supabase \u2192 Project Settings \u2192 API \u2192
                Project URL.</td></tr>
              <tr><td><code>SUPABASE_SERVICE_ROLE_KEY</code></td><td>Supabase \u2192 Project Settings
                \u2192 API keys \u2192 service_role. Server only.</td></tr>
              <tr><td><code>VAPI_ASSISTANT_ID</code></td><td>Optional. Leave it empty; after setup
                the assistant is found by name.</td></tr>
            </tbody>
          </table>
        </div>
        <ul class="scope-list yes">
          <li>Public key: the client-side key used by the browser SDK.</li>
          <li>Private key: server only, used to create the assistant and read calls.</li>
          <li>Webhook secret: checked on every request from Vapi to this backend.</li>
          <li>Setup token: a string only the owner knows; it unlocks the buttons below.</li>
        </ul>
        <p class="panel-note">The Supabase pair is only needed to store calls and to read
          the seed orders and FAQs. Without it, calls still run but the tools have no data.</p>
      </section>

      <section class="panel" aria-labelledby="setup-assistant-title">
        <div class="panel-head">
          <h2 id="setup-assistant-title">2. Create the assistant</h2>
        </div>
        <p class="panel-note">The assistant named <strong>Sumyia \u2014 ShopEasy</strong> is
          defined in <code>api/_assistant.js</code>: greeting, system prompt, five tools and
          the signed webhook. These buttons check the environment, then create or update it
          in Vapi.</p>
        <div class="setup-form">
          <input id="setup-token" type="password" autocomplete="off" spellcheck="false"
            aria-label="Setup token"
            placeholder="Setup token (kept in this browser tab only)">
        </div>
        <div class="setup-actions">
          <button class="btn btn-ghost" type="button" data-action="setup-check">Check configuration</button>
          <button class="btn btn-primary" type="button" data-action="setup-create">Create or update assistant</button>
        </div>
        <div id="setup-output" class="setup-result"></div>
      </section>
    </div>

    <section class="panel" style="margin-top:18px" aria-labelledby="setup-test-title">
      <div class="panel-head">
        <h2 id="setup-test-title">3. Make the first call</h2>
      </div>
      <p class="panel-note">When the check above shows every key accepted and an assistant id,
        start a call and ask for <code>ORD-1002</code>, then an FAQ question, then ask for a
        human. Each call appears under Live calls on the dashboard once Vapi sends its
        end-of-call report.</p>
      <div class="setup-actions">
        <button class="btn btn-live" type="button" data-action="talk">Talk to the agent</button>
        <a class="btn btn-ghost" href="#/dashboard">Open dashboard</a>
      </div>
    </section>

    <section class="callout" style="margin-top:18px">
      <h2>Why this page cannot fill in the keys</h2>
      <p>Pasting a key value into a web page that then writes it to the hosting provider would
        expose it to the browser and to this code. The key values are therefore entered only by
        the account owner in the hosting dashboard. Everything after that step can run from
        here.</p>
    </section>`;
}

async function runSetupCheck() {
  const token = readSetupToken();
  if (!token) {
    setupResult('<p>Enter the setup token first.</p>', 'warn');
    return;
  }
  setupResult('<p class="muted">Checking the hosting configuration\u2026</p>');

  try {
    const state = await fetchJson(`${VOICE_API}/setup`, { headers: { 'x-setup-token': token } });
    const rows = [
      ['Vapi public key', state.vapiPublicKey && !state.publicKeyIssue],
      ['Vapi private key', state.vapiPrivateKey],
      ['Webhook secret', state.vapiServerSecret],
      ['Supabase URL', state.supabaseUrl],
      ['Supabase service key', state.supabaseServiceKey],
    ];
    const missing = rows.filter((row) => !row[1]);
    const parts = [
      `<ul class="scope-list ${missing.length ? 'no' : 'yes'}">${rows
        .map((row) => setupRow(row[0], row[1]))
        .join('')}</ul>`,
    ];
    if (state.publicKeyIssue === 'masked') {
      parts.push('<p>The stored public key is only bullet characters, so a masked copy was ' +
        'saved. Delete that variable in the hosting project and add it again with the real key.</p>');
    } else if (state.publicKeyIssue === 'placeholder') {
      parts.push('<p>The stored public key is not a key. It is ' +
        `${state.publicKeyLength} characters of plain text, which is what placeholder typing ` +
        'looks like. Delete the variable, add it again and paste the Public API key copied ' +
        'from Vapi, then redeploy.</p>');
    } else if (state.publicKeyIssue === 'empty') {
      parts.push('<p>No Vapi public key is saved in the hosting project yet.</p>');
    }
    parts.push(state.vapiOk
      ? '<p class="muted">Vapi accepted the private key.</p>'
      : `<p class="muted">Vapi rejected the private key check (${state.vapiStatus || 'no response'}).</p>`);
    if (state.supabaseUrl && state.supabaseServiceKey) {
      parts.push(state.supabaseOk
        ? '<p class="muted">Supabase accepted the service key.</p>'
        : `<p class="muted">Supabase rejected the service key check ` +
          `(${state.supabaseStatus || 'no response'}). Orders, FAQs and saved calls stay unavailable until it is replaced.</p>`);
    } else {
      parts.push('<p class="muted">Supabase is not set up: calls can run, but the tools have no order or FAQ data.</p>');
    }
    parts.push(state.assistantId
      ? `<p>Assistant id: <code>${escapeHtml(state.assistantId)}</code></p>`
      : '<p class="muted">No assistant with this name exists yet. Use the button above.</p>');
    setupResult(parts.join(''), missing.length || !state.vapiOk ||
      (state.supabaseServiceKey && !state.supabaseOk) ? 'warn' : '');
  } catch (error) {
    setupResult(`<p>${escapeHtml(error.message)}</p>` +
      '<p class="muted">A rejected token is the usual cause. Enter the same value that is ' +
      'stored as the setup token in the hosting project.</p>', 'warn');
  }
}

async function runSetupCreate() {
  const token = readSetupToken();
  if (!token) {
    setupResult('<p>Enter the setup token first.</p>', 'warn');
    return;
  }
  setupResult('<p class="muted">Creating the assistant in Vapi\u2026</p>');

  try {
    const data = await fetchJson(`${VOICE_API}/setup`, {
      method: 'POST',
      headers: { 'x-setup-token': token, 'Content-Type': 'application/json' },
      body: '{}',
    });
    const parts = [
      `<p><strong>${data.created ? 'Assistant created' : 'Assistant updated'}.</strong> ` +
        `Id: <code>${escapeHtml(data.assistantId)}</code></p>`,
      `<p class="muted">Webhook: <code>${escapeHtml(data.serverUrl || '')}</code></p>`,
    ];
    if (data.warning) parts.push(`<p class="muted">${escapeHtml(data.warning)}</p>`);
    parts.push('<p class="muted">Reload the home page and start a call to test it.</p>');
    setupResult(parts.join(''));
  } catch (error) {
    setupResult(`<p>${escapeHtml(error.message)}</p>` +
      '<p class="muted">The private key and webhook secret must both be valid values in the ' +
      'hosting project before this can succeed.</p>', 'warn');
  }
}

/* ---------- Routing ---------- */

const main = $('#main');

const TITLES = {
  home: 'AI Customer Calling Agent',
  dashboard: 'Dashboard — AI Customer Calling Agent',
  calls: 'Call log — AI Customer Calling Agent',
  journey: 'Build journey — AI Customer Calling Agent',
  how: 'How it works — AI Customer Calling Agent',
  testing: 'Testing — AI Customer Calling Agent',
  setup: 'Hosted setup — AI Customer Calling Agent',
};

function setActiveNav(routeName) {
  document.querySelectorAll('nav a[data-nav]').forEach((link) => {
    const active = link.dataset.nav === routeName;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function route() {
  const hash = (window.location.hash || '#/').replace(/\/$/, '') || '#/';
  const match = hash.match(/^#\/calls\/(\d+)$/);
  const liveMatch = hash.match(/^#\/live\/([0-9a-f-]{36})$/i);
  let view = 'home';
  let html;
  let title = TITLES.home;

  if (match) {
    html = detailView(Number(match[1]));
    view = 'calls';
    title = `Call #${match[1]} — AI Customer Calling Agent`;
  } else if (liveMatch) {
    html = liveDetailView(liveMatch[1]);
    view = 'calls';
    title = 'Live call — AI Customer Calling Agent';
  } else if (hash === '#/calls') {
    html = callsView();
    view = 'calls';
  } else if (hash === '#/dashboard') {
    html = dashboardView();
    view = 'dashboard';
  } else if (hash === '#/journey') {
    html = journeyView();
    view = 'journey';
  } else if (hash === '#/how-it-works') {
    html = howItWorksView();
    view = 'how';
  } else if (hash === '#/testing') {
    html = testingView();
    view = 'testing';
  } else if (hash === '#/setup') {
    html = setupView();
    view = 'setup';
  } else {
    html = homeView();
  }

  main.innerHTML = html;
  setActiveNav(view);
  document.title = match || liveMatch ? title : TITLES[view];
  window.scrollTo({ top: 0, behavior: 'auto' });
  main.focus({ preventScroll: true });

  if (view === 'setup') {
    const input = document.getElementById('setup-token');
    if (input) {
      try { input.value = sessionStorage.getItem(SETUP_TOKEN_KEY) || ''; } catch { /* storage can be disabled */ }
    }
  }

  if (liveMatch) loadLiveDetail(liveMatch[1]);
  else if (view === 'dashboard' || view === 'calls') loadLiveCalls();
}

main.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-action="setup-check"]')) {
    runSetupCheck();
    return;
  }
  if (event.target.closest('[data-action="setup-create"]')) {
    runSetupCreate();
    return;
  }
  const chip = event.target.closest('[data-filter]');
  if (!chip) return;
  activeFilter = chip.dataset.filter;
  main.innerHTML = callsView();
  const pressed = $(`[data-filter="${activeFilter}"]`, main);
  if (pressed) pressed.focus();
  loadLiveCalls();
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  if (event.target.closest('[data-action="talk"]')) {
    startLiveCall();
    return;
  }
  if (event.target.closest('#call-mute')) {
    toggleMute();
    return;
  }
  if (event.target.closest('#call-end')) {
    stopLiveCall();
    return;
  }
  if (event.target.closest('#call-close')) {
    closeDock();
  }
});

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);

route();
