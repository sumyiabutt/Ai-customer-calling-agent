"""Unit tests for Week 2 call-session state and escalation."""

import unittest

from src.agent import INTENT_FALLBACK, INTENT_GREETING, INTENT_HANDOFF
from src.session import DEFAULT_MAX_FALLBACKS, ConversationSession

UNKNOWN_REQUEST = "Can you book me a flight to Dubai?"
GREETING = "Hello"


class SessionSetupTests(unittest.TestCase):
    def test_new_session_is_fresh(self) -> None:
        session = ConversationSession()
        self.assertEqual(session.fallback_count, 0)
        self.assertEqual(session.max_fallbacks, DEFAULT_MAX_FALLBACKS)
        self.assertFalse(session.escalated)
        self.assertFalse(session.ended)
        self.assertEqual(session.turns, ())
        self.assertEqual(session.summary(), "No customer turns yet.")

    def test_invalid_fallback_limit_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            ConversationSession(max_fallbacks=0)
        with self.assertRaises(TypeError):
            ConversationSession(max_fallbacks=True)


class EscalationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.session = ConversationSession()

    def test_one_miss_does_not_transfer(self) -> None:
        response = self.session.handle(UNKNOWN_REQUEST)
        self.assertEqual(response.intent, INTENT_FALLBACK)
        self.assertFalse(response.escalate)
        self.assertEqual(self.session.fallback_count, 1)
        self.assertFalse(self.session.escalated)

    def test_three_consecutive_misses_transfer_to_human(self) -> None:
        self.session.handle(UNKNOWN_REQUEST)
        self.session.handle("What is the weather in Karachi?")
        response = self.session.handle("Do you also sell laptops?")

        self.assertEqual(response.intent, INTENT_HANDOFF)
        self.assertTrue(response.escalate)
        self.assertIn("human representative", response.reply)
        self.assertEqual(self.session.fallback_count, 3)
        self.assertTrue(self.session.escalated)

    def test_success_resets_the_miss_counter(self) -> None:
        self.session.handle(UNKNOWN_REQUEST)
        self.session.handle(UNKNOWN_REQUEST)
        greeting = self.session.handle(GREETING)
        self.assertEqual(greeting.intent, INTENT_GREETING)
        self.assertEqual(self.session.fallback_count, 0)

        self.session.handle(UNKNOWN_REQUEST)
        self.assertEqual(self.session.fallback_count, 1)
        self.assertFalse(self.session.escalated)

    def test_silence_counts_as_a_miss(self) -> None:
        for _ in range(DEFAULT_MAX_FALLBACKS):
            response = self.session.handle("")
        self.assertEqual(response.intent, INTENT_HANDOFF)
        self.assertTrue(self.session.escalated)

    def test_custom_limit_escalates_sooner(self) -> None:
        session = ConversationSession(max_fallbacks=2)
        session.handle(UNKNOWN_REQUEST)
        response = session.handle(UNKNOWN_REQUEST)
        self.assertTrue(response.escalate)
        self.assertTrue(session.escalated)

    def test_requested_handoff_is_not_replaced_by_auto_transfer(self) -> None:
        first = self.session.handle("I want to speak to a human")
        self.assertEqual(first.intent, INTENT_HANDOFF)
        self.assertTrue(self.session.escalated)

        for _ in range(DEFAULT_MAX_FALLBACKS):
            response = self.session.handle(UNKNOWN_REQUEST)
        self.assertEqual(response.intent, INTENT_FALLBACK)
        self.assertFalse(response.escalate)

    def test_goodbye_ends_the_session(self) -> None:
        self.session.handle("That's all, thank you")
        self.assertTrue(self.session.ended)
        with self.assertRaises(RuntimeError):
            self.session.handle(GREETING)


class SummaryTests(unittest.TestCase):
    def test_summary_lists_topics_and_transfer_outcome(self) -> None:
        session = ConversationSession()
        session.handle(GREETING)
        session.handle("Where is my order ORD-1001?")
        session.handle("I want to speak to a human")

        summary = session.summary()
        self.assertIn("3 customer turn(s)", summary)
        self.assertIn("greeting", summary)
        self.assertIn("order status", summary)
        self.assertIn("transferred to a human representative", summary)

    def test_summary_reports_closed_calls(self) -> None:
        session = ConversationSession()
        session.handle("bye")
        self.assertIn("closed by the customer", session.summary())

    def test_turns_are_recorded_in_order(self) -> None:
        session = ConversationSession()
        session.handle(GREETING)
        session.handle(UNKNOWN_REQUEST)
        messages = [turn.customer_message for turn in session.turns]
        self.assertEqual(messages, [GREETING, UNKNOWN_REQUEST])


if __name__ == "__main__":
    unittest.main()
