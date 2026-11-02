"""Unit tests for the Week 3 call log store and its analytics."""

import sqlite3
import tempfile
import unittest
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path

from src.call_store import CallStore
from src.session import ConversationSession


def make_session(*messages: str, max_fallbacks: int = 3) -> ConversationSession:
    session = ConversationSession(max_fallbacks=max_fallbacks)
    for message in messages:
        session.handle(message)
    return session


class CallStoreTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.path = Path(self._tmp.name) / "calls.sqlite3"
        self.store = CallStore(self.path)

    def test_saved_call_keeps_caller_outcome_and_turns(self) -> None:
        session = make_session("Hello", "Where is my order ORD-1001?", "bye")
        call_id = self.store.save_session(
            session,
            caller_phone="0300-0000001",
            customer_id="CUST-001",
            customer_name="Sample Customer A",
        )

        call = self.store.get_call(call_id)
        assert call is not None
        self.assertEqual(call["caller_phone"], "0300-0000001")
        self.assertEqual(call["customer_id"], "CUST-001")
        self.assertEqual(call["customer_name"], "Sample Customer A")
        self.assertEqual(call["outcome"], "closed")
        self.assertEqual(call["escalated"], 0)
        self.assertEqual(call["turn_count"], 3)

        turns = self.store.get_turns(call_id)
        self.assertEqual([turn["seq"] for turn in turns], [1, 2, 3])
        self.assertEqual(turns[0]["intent"], "greeting")
        self.assertEqual(turns[1]["intent"], "order_status")
        self.assertEqual(turns[2]["intent"], "goodbye")

    def test_escalated_call_is_stored_as_transferred(self) -> None:
        session = make_session("???", "???", "???")
        self.assertEqual(session.outcome, "transferred")

        call_id = self.store.save_session(session)
        call = self.store.get_call(call_id)
        assert call is not None
        self.assertEqual(call["outcome"], "transferred")
        self.assertEqual(call["escalated"], 1)
        self.assertEqual(call["turn_count"], 3)
        self.assertIn("transferred", call["summary"])

    def test_call_without_customer_is_allowed(self) -> None:
        call_id = self.store.save_session(make_session("Hello"))
        call = self.store.get_call(call_id)
        assert call is not None
        self.assertIsNone(call["caller_phone"])
        self.assertIsNone(call["customer_id"])
        self.assertIsNone(call["customer_name"])

    def test_calls_list_newest_first_and_filter_by_outcome(self) -> None:
        now = datetime.now(timezone.utc)
        older = self.store.save_session(make_session("bye"), ended_at=now)
        newer = self.store.save_session(make_session("Hello"), ended_at=now + timedelta(minutes=5))

        listed = self.store.list_calls()
        self.assertEqual([call["id"] for call in listed], [newer, older])

        closed = self.store.list_calls(outcome="closed")
        self.assertEqual([call["id"] for call in closed], [older])

        self.assertEqual(self.store.list_calls(outcome="transferred"), [])
        self.assertEqual(self.store.list_calls(limit=1), [listed[0]])

    def test_list_calls_validates_arguments(self) -> None:
        for bad_limit in (0, 501, -1):
            with self.subTest(limit=bad_limit):
                with self.assertRaises(ValueError):
                    self.store.list_calls(limit=bad_limit)
        with self.assertRaises(ValueError):
            self.store.list_calls(outcome="cancelled")

    def test_unknown_call_returns_none_and_no_turns(self) -> None:
        self.assertIsNone(self.store.get_call(999))
        self.assertEqual(self.store.get_turns(999), [])

    def test_analytics_counts_calls_turns_and_escalations(self) -> None:
        now = datetime.now(timezone.utc)
        self.store.save_session(make_session("Hello", "bye"), ended_at=now)
        self.store.save_session(make_session("Hello", "???", "???", "???"), ended_at=now)

        stats = self.store.analytics()
        self.assertEqual(stats["total_calls"], 2)
        self.assertEqual(stats["escalated_calls"], 1)
        self.assertEqual(stats["escalation_rate"], 50.0)
        self.assertEqual(stats["outcomes"], {"closed": 1, "transferred": 1})
        self.assertEqual(stats["total_turns"], 6)
        self.assertEqual(stats["average_turns"], 3.0)
        self.assertEqual(stats["intents"]["greeting"], 2)
        self.assertEqual(stats["intents"]["fallback"], 2)
        self.assertEqual(stats["intents"]["handoff"], 1)
        self.assertEqual(stats["calls_by_day"][0]["day"], now.date().isoformat())

    def test_analytics_on_empty_store_is_zeroed(self) -> None:
        stats = self.store.analytics()
        self.assertEqual(stats["total_calls"], 0)
        self.assertEqual(stats["escalation_rate"], 0.0)
        self.assertEqual(stats["average_turns"], 0.0)
        self.assertEqual(stats["outcomes"], {})
        self.assertEqual(stats["intents"], {})
        self.assertEqual(stats["calls_by_day"], [])

    def test_reopening_the_same_database_keeps_data(self) -> None:
        call_id = self.store.save_session(make_session("Hello"))
        reopened = CallStore(self.path)
        self.assertIsNotNone(reopened.get_call(call_id))
        self.assertEqual(reopened.analytics()["total_calls"], 1)

    def test_turns_are_removed_with_their_call(self) -> None:
        call_id = self.store.save_session(make_session("Hello"))
        with closing(sqlite3.connect(self.path)) as connection:
            connection.execute("PRAGMA foreign_keys = ON")
            connection.execute("DELETE FROM calls WHERE id = ?", (call_id,))
            connection.commit()
        self.assertEqual(self.store.get_turns(call_id), [])


if __name__ == "__main__":
    unittest.main()
