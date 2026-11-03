/* Week 1–3 static demo.
 *
 * Overview and Calls show the Week 3 dashboard: the call records are fictional
 * sample data, except call #1, whose transcript was captured from the real
 * Week 3 simulated demo run. Journey describes what each project week built.
 * This is a read-only publication of the local dashboard; it has no backend,
 * no CRM API and no audio.
 */

'use strict';

const DEMO_PASSCODE = 'week3-demo';
const DEMO_USER = 'admin';
const AUTH_KEY = 'calling-agent-week3-demo';
const DEMO_TODAY = '2026-11-02';

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
  const end = new Date(`${DEMO_TODAY}T00:00:00Z`);
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
    week: 'Week 1',
    date: '28 October 2026',
    title: 'Discovery and foundation',
    points: [
      'Text-only prototype for one inbound support use case',
      'Greeting, order status, business hours and FAQ answers',
      'Fallback handling and human handoff',
      'Scope, requirements and risks written down',
    ],
    evidence: '27 automated tests',
  },
  {
    week: 'Week 2',
    date: '31 October 2026',
    title: 'Conversation quality and a local voice loop',
    points: [
      'Validated knowledge base for orders, hours and FAQs',
      'Per-call session with 3-strike fallback, then escalation',
      'Handoff summary so a colleague gets the context',
      'Local voice loop: typed input as the speech-recognition stand-in, Windows SAPI speech output',
    ],
    evidence: '65 automated tests in total',
  },
  {
    week: 'Week 3',
    date: '2 November 2026',
    title: 'CRM, call log and admin dashboard',
    points: [
      'Local SQLite CRM with customers, orders and interactions',
      'Call log with transcripts, outcomes and handoff notes',
      'Analytics for escalation rate, intents and daily volume',
      'Password-protected local dashboard, saved with every demo call',
    ],
    evidence: '104 automated tests, 19 live HTTP checks',
  },
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

/* ---------- Views ---------- */

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

function journeyView() {
  const cards = WEEKS.map((item) => `
    <article class="week-card">
      <div class="week-head">
        <span class="week-tag">${escapeHtml(item.week)}</span>
        <span class="week-date">${escapeHtml(item.date)}</span>
      </div>
      <h2 class="week-title">${escapeHtml(item.title)}</h2>
      <ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>
      <div class="week-foot">
        <span class="status done">Delivered</span>
        <span>${escapeHtml(item.evidence)}</span>
      </div>
    </article>`).join('');

  return `
    <div class="page-head">
      <div>
        <h1>Build journey</h1>
        <p class="page-sub">What each project week delivered, how it was tested, and what is still blocked. Everything here ran locally as a simulated demo.</p>
      </div>
    </div>

    <div class="week-grid">${cards}</div>

    <div class="grid-2">
      <section class="panel" aria-labelledby="blocked-title">
        <h2 id="blocked-title">Still blocked</h2>
        <p class="panel-note" style="margin:0">
          The live phone call is not part of the build. No telephony account, test number,
          webhook or speech-recognition service is connected, so the agent has never taken a
          real call. The demo runs locally: typed input stands in for speech recognition and
          Windows SAPI speaks the agent replies.
        </p>
      </section>

      <section class="panel" aria-labelledby="where-title">
        <h2 id="where-title">Where to look</h2>
        <p class="panel-note" style="margin:0 0 12px">The Week 3 dashboard is the working part of this site.</p>
        <p style="margin:0">
          <a href="#/">Overview</a> &mdash; numbers, intents and daily volume.<br>
          <a href="#/calls">Calls</a> &mdash; every saved call and its transcript.
        </p>
      </section>
    </div>`;
}

function overviewView() {
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
        <h1>Overview</h1>
        <p class="page-sub">Weeks 1&ndash;3 of the internship project. The numbers below come from the Week 3 call log of the simulated agent. Fictional sample data; recordings are not available.</p>
      </div>
    </div>

    <section class="cards" aria-label="Key numbers">
      <div class="card">
        <div class="value">${STATS.total}</div>
        <div class="label">Total calls</div>
        <div class="detail">27 Oct to 2 Nov 2026</div>
      </div>
      <div class="card">
        <div class="value">${STATS.escalated}</div>
        <div class="label">Transferred to a human</div>
        <div class="detail">Automatic or requested handoff</div>
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

    <section class="panel journey-strip" aria-labelledby="weeks-title">
      <h2 id="weeks-title">Weeks 1 to 3</h2>
      <ol class="week-chips">
        <li><span class="week-tag">Week 1</span><span>Text support prototype</span><span class="chip-note">27 tests</span></li>
        <li><span class="week-tag">Week 2</span><span>Knowledge base, session and voice loop</span><span class="chip-note">65 tests</span></li>
        <li><span class="week-tag">Week 3</span><span>CRM, call log and dashboard</span><span class="chip-note">104 tests</span></li>
      </ol>
      <p class="panel-note" style="margin:0">Live telephony is still blocked. <a href="#/journey">See the full build journey</a>.</p>
    </section>

    <div class="grid-2">
      <div>
        <section class="panel" aria-labelledby="recent-title">
          <h2 id="recent-title">Recent calls</h2>
          <p class="panel-note">Newest first. Open a call to read its full text transcript.</p>
          ${callsTable(SORTED_CALLS.slice(0, 6), 'No calls recorded yet.')}
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

        <section class="panel" aria-labelledby="limits-title">
          <h2 id="limits-title">Demo notes</h2>
          <p class="panel-note" style="margin:0">
            Read-only static snapshot of the Week 3 local dashboard, part of the Weeks 1&ndash;3
            project. No telephony, CRM API or audio is connected, and no recording exists.
            Names and orders are fictional.
          </p>
        </section>
      </div>
    </div>`;
}

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
        <h1>Calls</h1>
        <p class="page-sub">Every saved simulated call, newest first. Filter by outcome, then open a call for the transcript.</p>
      </div>
    </div>
    <div class="filters" role="group" aria-label="Filter calls by outcome">${chips}</div>
    ${callsTable(calls, 'No calls match this filter.')}`;
}

function detailView(callId) {
  const call = CALLS.find((item) => item.id === callId);
  if (!call) {
    return `
      <p class="back"><a href="#/calls">&larr; Back to calls</a></p>
      <h1>Call not found</h1>
      <p class="page-sub">That call does not exist in this demo.</p>`;
  }

  const rows = call.turns.map((item, index) => `
    <tr>
      <td class="num">${index + 1}</td>
      <td class="turn-message">${escapeHtml(item.message)}</td>
      <td>${escapeHtml(item.intent)}${item.escalated ? '<span class="escalated-tag">escalated</span>' : ''}</td>
      <td class="turn-reply">${escapeHtml(item.reply)}</td>
    </tr>`).join('');

  return `
    <p class="back"><a href="#/calls">&larr; Back to calls</a></p>
    <div class="page-head">
      <div class="call-head">
        <h1>Call #${call.id}</h1>
        ${badge(call.outcome)}
      </div>
      <p class="page-sub" style="margin:0">${formatTime(call.started_at)} to ${formatTime(call.ended_at)}</p>
    </div>

    <div class="note">
      <strong>Recording:</strong> not available. No telephony or audio capture is
      connected, so this call has a text transcript only.
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

/* ---------- Routing and auth ---------- */

const loginView = $('#login-view');
const appView = $('#app-view');
const main = $('#main');

let authedThisVisit = false;

function isAuthenticated() {
  if (authedThisVisit) return true;
  try {
    return window.sessionStorage.getItem(AUTH_KEY) === 'ok';
  } catch {
    return false;
  }
}

function setAuthenticated(value) {
  authedThisVisit = value;
  try {
    if (value) window.sessionStorage.setItem(AUTH_KEY, 'ok');
    else window.sessionStorage.removeItem(AUTH_KEY);
  } catch {
    /* Storage can be unavailable; the in-memory flag still covers this visit. */
  }
}

function showLogin() {
  appView.hidden = true;
  loginView.hidden = false;
  const password = $('#password');
  if (password) password.focus();
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
}

function setActiveNav(routeName) {
  document.querySelectorAll('nav a[data-nav]').forEach((link) => {
    const active = link.dataset.nav === routeName;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function route() {
  if (!isAuthenticated()) {
    showLogin();
    return;
  }
  showApp();
  const hash = window.location.hash || '#/';
  const match = hash.match(/^#\/calls\/(\d+)\/?$/);
  if (match) {
    main.innerHTML = detailView(Number(match[1]));
    setActiveNav('calls');
  } else if (hash.replace(/\/$/, '') === '#/calls') {
    main.innerHTML = callsView();
    setActiveNav('calls');
  } else if (hash.replace(/\/$/, '') === '#/journey') {
    main.innerHTML = journeyView();
    setActiveNav('journey');
  } else {
    main.innerHTML = overviewView();
    setActiveNav('overview');
  }
  main.focus({ preventScroll: true });
}

/* ---------- Events ---------- */

$('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const username = $('#username').value.trim();
  const password = $('#password').value;
  const error = $('#login-error');
  if (username === DEMO_USER && password === DEMO_PASSCODE) {
    setAuthenticated(true);
    error.hidden = true;
    $('#password').value = '';
    window.location.hash = '#/';
    route();
  } else {
    error.textContent = 'Invalid username or password. Use the demo passcode shown below.';
    error.hidden = false;
    $('#password').select();
  }
});

$('#signout-button').addEventListener('click', () => {
  setAuthenticated(false);
  window.history.replaceState(null, '', window.location.pathname);
  showLogin();
});

document.querySelector('nav').addEventListener('click', (event) => {
  if (event.target.closest('#about-button')) {
    $('#about-dialog').showModal();
  }
});

$('#about-close').addEventListener('click', () => $('#about-dialog').close());

$('#about-dialog').addEventListener('click', (event) => {
  if (event.target === $('#about-dialog')) $('#about-dialog').close();
});

main.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-filter]');
  if (!chip) return;
  activeFilter = chip.dataset.filter;
  main.innerHTML = callsView();
});

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);

route();
