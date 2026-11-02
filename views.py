"""HTML views for the local admin dashboard.

Every value that comes from the database or the request is escaped before it
reaches the page. The dashboard shows transcripts and customer messages, so
escaping is required even for a local-only tool.
"""

from __future__ import annotations

from datetime import datetime
from html import escape

STYLE = """
:root {
  --ink: #0b0b0c;
  --navy: #0f2c59;
  --mid: #1f4e8c;
  --pale: #d6e4f5;
  --card: #f4f6f9;
  --line: #d5dce6;
  --grey: #5a6270;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Segoe UI, Calibri, Arial, sans-serif;
  color: var(--ink);
  background: #eef2f8;
}
header.top {
  background: var(--ink);
  color: #fff;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border-bottom: 6px solid var(--navy);
}
.brand { font-size: 17px; font-weight: 700; letter-spacing: .3px; }
.brand span { color: #8fb4e3; font-weight: 400; }
nav { display: flex; align-items: center; gap: 18px; }
nav a { color: #d6e4f5; text-decoration: none; font-size: 14px; }
nav a:hover { text-decoration: underline; }
nav button {
  background: transparent;
  color: #d6e4f5;
  border: 1px solid #33527d;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 13px;
}
main { max-width: 1120px; margin: 28px auto 60px; padding: 0 20px; }
h1 { font-size: 24px; margin: 0 0 6px; }
h2 { font-size: 17px; margin: 28px 0 10px; }
.sub { color: var(--grey); margin: 0 0 22px; font-size: 14px; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
.card { background: #fff; border: 1px solid var(--line); border-top: 4px solid var(--navy); padding: 16px; }
.card .value { font-size: 28px; font-weight: 700; color: var(--navy); }
.card .label { color: var(--grey); font-size: 12px; text-transform: uppercase; letter-spacing: .6px; margin-top: 4px; }
table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid var(--line); }
th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); font-size: 13px; vertical-align: top; }
th { background: var(--card); color: var(--navy); font-size: 11px; text-transform: uppercase; letter-spacing: .6px; }
tr:last-child td { border-bottom: none; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.badge.closed { background: #e3f1e6; color: #22633a; }
.badge.transferred { background: #fde9e6; color: #8a2c1f; }
.badge.open { background: #e8eef9; color: var(--mid); }
.filters { margin: 0 0 14px; display: flex; gap: 8px; flex-wrap: wrap; }
.filters a { font-size: 13px; padding: 5px 11px; border: 1px solid var(--line); background: #fff; text-decoration: none; color: var(--mid); border-radius: 4px; }
.filters a.active { background: var(--navy); color: #fff; border-color: var(--navy); }
.back { font-size: 13px; }
.back a { color: var(--mid); }
.turns td.message { white-space: pre-wrap; max-width: 340px; }
.turns td.reply { white-space: pre-wrap; max-width: 460px; }
.note { background: #eef2f8; border-left: 4px solid var(--navy); padding: 12px 16px; font-size: 13px; }
.empty { background: #fff; border: 1px dashed var(--line); padding: 26px; text-align: center; color: var(--grey); font-size: 14px; }
.login-wrap { max-width: 420px; margin: 70px auto; background: #fff; border: 1px solid var(--line); border-top: 6px solid var(--navy); padding: 30px; }
.login-wrap h1 { font-size: 21px; }
label { display: block; font-size: 12px; color: var(--navy); font-weight: 600; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: .5px; }
input[type=text], input[type=password] { width: 100%; padding: 9px 11px; border: 1px solid var(--line); font-size: 14px; }
button.primary { margin-top: 20px; width: 100%; background: var(--navy); color: #fff; border: 0; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer; }
.error { background: #fde9e6; color: #8a2c1f; padding: 10px 12px; font-size: 13px; margin-top: 16px; }
footer { max-width: 1120px; margin: 0 auto; padding: 0 20px 30px; color: var(--grey); font-size: 12px; }
code { background: var(--card); padding: 2px 5px; font-size: 12px; }
"""


def _layout(title: str, content: str, nav: bool = True) -> str:
    navigation = (
        '<nav><a href="/">Overview</a><a href="/calls">Calls</a>'
        '<form method="post" action="/logout">'
        '<button type="submit">Sign out</button></form></nav>'
        if nav
        else ""
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)} - Calling Agent Admin</title>
<style>{STYLE}</style>
</head>
<body>
<header class="top">
  <div class="brand">AI Calling Agent <span>Admin</span></div>
  {navigation}
</header>
<main>{content}</main>
<footer>Local demo dashboard. Fictional sample data only. No customer data leaves this machine.</footer>
</body>
</html>"""


def _format_time(value: str | None) -> str:
    if not value:
        return "-"
    try:
        moment = datetime.fromisoformat(value)
    except ValueError:
        return escape(value)
    return moment.strftime("%d %b %Y %H:%M UTC")


def _badge(outcome: str) -> str:
    safe = escape(outcome)
    return f'<span class="badge {safe}">{safe}</span>'


def _short(text: str, limit: int = 90) -> str:
    clean = escape(text)
    return clean if len(clean) <= limit else f"{clean[: limit - 1]}..."


def login_page(error: str | None = None) -> str:
    error_html = f'<div class="error">{escape(error)}</div>' if error else ""
    content = f"""
<div class="login-wrap">
  <h1>Sign in</h1>
  <p class="sub">Admin dashboard for the AI Customer Calling Agent.</p>
  <form method="post" action="/login">
    <label for="username">Username</label>
    <input id="username" name="username" type="text" autocomplete="username" required>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <button class="primary" type="submit">Sign in</button>
  </form>
  {error_html}
</div>"""
    return _layout("Sign in", content, nav=False)


def _calls_table(calls: list[dict]) -> str:
    if not calls:
        return (
            '<div class="empty">No calls recorded yet. Run '
            "<code>python -m src.voice.demo</code> to create one.</div>"
        )
    rows = []
    for call in calls:
        rows.append(
            "<tr>"
            f'<td><a href="/calls/{int(call["id"])}">{int(call["id"])}</a></td>'
            f"<td>{_format_time(call['started_at'])}</td>"
            f"<td>{escape(call.get('caller_phone') or '-')}</td>"
            f"<td>{escape(call.get('customer_name') or 'Unknown caller')}</td>"
            f"<td>{_badge(call['outcome'])}</td>"
            f"<td>{int(call['turn_count'])}</td>"
            f"<td>{_short(call['summary'])}</td>"
            "</tr>"
        )
    return (
        "<table><thead><tr><th>Call</th><th>Started</th><th>Caller</th>"
        "<th>Customer</th><th>Outcome</th><th>Turns</th><th>Summary</th>"
        "</tr></thead><tbody>" + "".join(rows) + "</tbody></table>"
    )


def overview_page(stats: dict, recent_calls: list[dict]) -> str:
    outcomes = stats["outcomes"]
    outcome_rows = "".join(
        f"<tr><td>{_badge(name)}</td><td>{count}</td></tr>"
        for name, count in sorted(outcomes.items())
    ) or '<tr><td colspan="2">No calls yet</td></tr>'

    intent_rows = "".join(
        f"<tr><td>{escape(name.replace('_', ' '))}</td><td>{count}</td></tr>"
        for name, count in stats["intents"].items()
    ) or '<tr><td colspan="2">No turns yet</td></tr>'

    day_rows = "".join(
        f"<tr><td>{escape(day['day'])}</td><td>{day['calls']}</td></tr>"
        for day in stats["calls_by_day"]
    ) or '<tr><td colspan="2">No calls yet</td></tr>'

    content = f"""
<h1>Overview</h1>
<p class="sub">Call log and basic analytics from the local store. Recordings are not available because telephony is not connected.</p>
<div class="cards">
  <div class="card"><div class="value">{stats['total_calls']}</div><div class="label">Total calls</div></div>
  <div class="card"><div class="value">{stats['escalated_calls']}</div><div class="label">Transferred to a human</div></div>
  <div class="card"><div class="value">{stats['escalation_rate']}%</div><div class="label">Escalation rate</div></div>
  <div class="card"><div class="value">{stats['average_turns']}</div><div class="label">Average turns per call</div></div>
</div>

<h2>Recent calls</h2>
{_calls_table(recent_calls)}

<h2>Outcomes</h2>
<table><thead><tr><th>Outcome</th><th>Calls</th></tr></thead><tbody>{outcome_rows}</tbody></table>

<h2>Intents across all turns</h2>
<table><thead><tr><th>Intent</th><th>Turns</th></tr></thead><tbody>{intent_rows}</tbody></table>

<h2>Calls per day</h2>
<table><thead><tr><th>Day (UTC)</th><th>Calls</th></tr></thead><tbody>{day_rows}</tbody></table>
"""
    return _layout("Overview", content)


def calls_page(calls: list[dict], selected: str | None) -> str:
    labels = (("", "All"), ("transferred", "Transferred"), ("closed", "Closed"), ("open", "Open"))
    filters = "".join(
        f'<a class="{"active" if (selected or "") == value else ""}" '
        f'href="/calls{("?outcome=" + value) if value else ""}">{label}</a>'
        for value, label in labels
    )
    content = f"""
<h1>Calls</h1>
<p class="sub">Every saved simulated call, newest first. Filter by outcome.</p>
<div class="filters">{filters}</div>
{_calls_table(calls)}
"""
    return _layout("Calls", content)


def call_detail_page(call: dict, turns: list[dict]) -> str:
    rows = []
    for turn in turns:
        escalation = " [escalated]" if turn["escalate"] else ""
        rows.append(
            "<tr>"
            f"<td>{int(turn['seq'])}</td>"
            f'<td class="message">{escape(turn["customer_message"])}</td>'
            f"<td>{escape(turn['intent'])}{escalation}</td>"
            f'<td class="reply">{escape(turn["reply"])}</td>'
            "</tr>"
        )
    if not rows:
        rows.append('<tr><td colspan="4">No turns recorded for this call.</td></tr>')

    content = f"""
<p class="back"><a href="/calls">&larr; Back to calls</a></p>
<h1>Call #{int(call['id'])}</h1>
<p class="sub">{_format_time(call['started_at'])} to {_format_time(call['ended_at'])}</p>

<div class="note">
  <strong>Recording:</strong> not available. No telephony or audio capture is connected,
  so this call has a text transcript only.
</div>

<h2>Call details</h2>
<table>
<tbody>
<tr><th>Customer</th><td>{escape(call.get('customer_name') or 'Unknown caller')}</td></tr>
<tr><th>Customer id</th><td>{escape(call.get('customer_id') or '-')}</td></tr>
<tr><th>Caller number</th><td>{escape(call.get('caller_phone') or '-')}</td></tr>
<tr><th>Outcome</th><td>{_badge(call['outcome'])}</td></tr>
<tr><th>Escalated</th><td>{'Yes' if call['escalated'] else 'No'}</td></tr>
<tr><th>Summary</th><td>{escape(call['summary'])}</td></tr>
</tbody>
</table>

<h2>Transcript</h2>
<table class="turns">
<thead><tr><th>#</th><th>Customer</th><th>Intent</th><th>Agent reply</th></tr></thead>
<tbody>{''.join(rows)}</tbody>
</table>
"""
    return _layout(f"Call {int(call['id'])}", content)


def not_found_page(message: str = "Page not found") -> str:
    content = f"""
<h1>Not found</h1>
<p class="sub">{escape(message)}</p>
<p class="back"><a href="/">Return to overview</a></p>
"""
    return _layout("Not found", content)
