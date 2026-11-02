"""Call log storage and analytics for Week 3 (SQLite).

Every finished simulated call can be written here: the caller, the linked CRM
customer, the outcome, the handoff summary and each turn with its intent and
reply. The dashboard reads this store.

There is no audio. A recording column will only make sense once telephony is
connected, so the dashboard explicitly reports recordings as unavailable
instead of pretending they exist.

The database lives under ``data/`` and is ignored by git.
"""

from __future__ import annotations

import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from .session import ConversationSession

DEFAULT_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "calls.sqlite3"

OUTCOMES = frozenset({"transferred", "closed", "open"})

SCHEMA = """
CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at TEXT NOT NULL,
    caller_phone TEXT,
    customer_id TEXT,
    customer_name TEXT,
    outcome TEXT NOT NULL,
    escalated INTEGER NOT NULL,
    summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS call_turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id INTEGER NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    customer_message TEXT NOT NULL,
    intent TEXT NOT NULL,
    reply TEXT NOT NULL,
    escalate INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calls_started ON calls(started_at);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
CREATE INDEX IF NOT EXISTS idx_turns_call ON call_turns(call_id);
"""

_CALL_COLUMNS = (
    "c.id, c.started_at, c.ended_at, c.caller_phone, c.customer_id, "
    "c.customer_name, c.outcome, c.escalated, c.summary, "
    "(SELECT COUNT(*) FROM call_turns t WHERE t.call_id = c.id) AS turn_count"
)


class CallStore:
    """Persist finished calls and answer dashboard queries."""

    def __init__(self, db_path: Path | str | None = None) -> None:
        self._path = Path(db_path) if db_path is not None else DEFAULT_DB_PATH
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with closing(self._connect()) as connection:
            connection.executescript(SCHEMA)
            connection.commit()

    @property
    def path(self) -> Path:
        return self._path

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def save_session(
        self,
        session: ConversationSession,
        caller_phone: str | None = None,
        customer_id: str | None = None,
        customer_name: str | None = None,
        ended_at: datetime | None = None,
    ) -> int:
        """Write one call and all of its turns; returns the call id."""
        started = session.started_at.astimezone(timezone.utc)
        ended = (ended_at or datetime.now(timezone.utc)).astimezone(timezone.utc)
        outcome = session.outcome
        if outcome not in OUTCOMES:
            raise ValueError(f"Unknown outcome: {outcome!r}")

        with closing(self._connect()) as connection:
            cursor = connection.execute(
                "INSERT INTO calls (started_at, ended_at, caller_phone, customer_id, "
                "customer_name, outcome, escalated, summary) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    started.isoformat(timespec="seconds"),
                    ended.isoformat(timespec="seconds"),
                    caller_phone,
                    customer_id,
                    customer_name,
                    outcome,
                    int(session.escalated),
                    session.summary(),
                ),
            )
            call_id = int(cursor.lastrowid)
            connection.executemany(
                "INSERT INTO call_turns (call_id, seq, customer_message, intent, "
                "reply, escalate) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    (
                        call_id,
                        index,
                        turn.customer_message,
                        turn.response.intent,
                        turn.response.reply,
                        int(turn.response.escalate),
                    )
                    for index, turn in enumerate(session.turns, start=1)
                ],
            )
            connection.commit()
        return call_id

    def list_calls(self, limit: int = 50, outcome: str | None = None) -> list[dict]:
        if not 1 <= int(limit) <= 500:
            raise ValueError("limit must be between 1 and 500")
        if outcome is not None and outcome not in OUTCOMES:
            raise ValueError(f"Unknown outcome: {outcome!r}")

        query = f"SELECT {_CALL_COLUMNS} FROM calls c"
        parameters: list[object] = []
        if outcome is not None:
            query += " WHERE c.outcome = ?"
            parameters.append(outcome)
        query += " ORDER BY c.started_at DESC, c.id DESC LIMIT ?"
        parameters.append(int(limit))

        with closing(self._connect()) as connection:
            rows = connection.execute(query, parameters).fetchall()
        return [dict(row) for row in rows]

    def get_call(self, call_id: int) -> dict | None:
        with closing(self._connect()) as connection:
            row = connection.execute(
                f"SELECT {_CALL_COLUMNS} FROM calls c WHERE c.id = ?",
                (int(call_id),),
            ).fetchone()
        return dict(row) if row else None

    def get_turns(self, call_id: int) -> list[dict]:
        with closing(self._connect()) as connection:
            rows = connection.execute(
                "SELECT seq, customer_message, intent, reply, escalate "
                "FROM call_turns WHERE call_id = ? ORDER BY seq",
                (int(call_id),),
            ).fetchall()
        return [dict(row) for row in rows]

    def analytics(self) -> dict:
        with closing(self._connect()) as connection:
            total = connection.execute("SELECT COUNT(*) FROM calls").fetchone()[0]
            escalated = connection.execute(
                "SELECT COUNT(*) FROM calls WHERE escalated = 1"
            ).fetchone()[0]
            outcome_rows = connection.execute(
                "SELECT outcome, COUNT(*) AS count FROM calls GROUP BY outcome"
            ).fetchall()
            intent_rows = connection.execute(
                "SELECT intent, COUNT(*) AS count FROM call_turns "
                "GROUP BY intent ORDER BY COUNT(*) DESC, intent"
            ).fetchall()
            total_turns = connection.execute(
                "SELECT COUNT(*) FROM call_turns"
            ).fetchone()[0]
            day_rows = connection.execute(
                "SELECT substr(started_at, 1, 10) AS day, COUNT(*) AS calls "
                "FROM calls GROUP BY day ORDER BY day DESC LIMIT 7"
            ).fetchall()

        return {
            "total_calls": total,
            "escalated_calls": escalated,
            "escalation_rate": round(escalated * 100 / total, 1) if total else 0.0,
            "outcomes": {row["outcome"]: row["count"] for row in outcome_rows},
            "intents": {row["intent"]: row["count"] for row in intent_rows},
            "total_turns": total_turns,
            "average_turns": round(total_turns / total, 1) if total else 0.0,
            "calls_by_day": [dict(row) for row in day_rows],
        }
