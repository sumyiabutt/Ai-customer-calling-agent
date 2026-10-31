"""Decision layer of the AI customer calling agent.

This module is the dialogue brain without audio. It takes the customer's words
as text, works out the intent, and returns a reply plus an escalation flag.
Week 2 wraps the same class with speech-to-text, a call session and
text-to-speech (see ``src.session`` and ``src.voice``).

Design rules:
- Rule-based intent detection, so every decision is explainable and testable.
- Answers come only from approved sample data in ``src.sample_data``.
- Short, speakable sentences; no invented facts, prices or promises.
- Anything unsupported is offered a human handoff instead of a guess.
"""

from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

from .knowledge_base import FaqEntry, KnowledgeBase
from .sample_data import BUSINESS_HOURS, BUSINESS_NAME, SAMPLE_ORDERS, TIME_ZONE

INTENT_GREETING = "greeting"
INTENT_ORDER_STATUS = "order_status"
INTENT_BUSINESS_HOURS = "business_hours"
INTENT_FAQ = "faq"
INTENT_HANDOFF = "handoff"
INTENT_GOODBYE = "goodbye"
INTENT_FALLBACK = "fallback"
INTENT_EMPTY = "empty"

SUPPORTED_INTENTS = (
    INTENT_GREETING,
    INTENT_ORDER_STATUS,
    INTENT_BUSINESS_HOURS,
    INTENT_FAQ,
    INTENT_HANDOFF,
    INTENT_GOODBYE,
    INTENT_FALLBACK,
    INTENT_EMPTY,
)

GREETING_REPLY = (
    f"Hello, and thank you for calling {BUSINESS_NAME}. "
    "I'm an AI assistant, and this call may be recorded. "
    "I can help with order status, business hours and common questions. "
    "How can I help you today?"
)
ASK_ORDER_NUMBER_REPLY = (
    "Of course. Please tell me your order number, for example ORD-1001."
)
INVALID_ORDER_NUMBER_REPLY = (
    "That order number doesn't look valid. Order numbers look like ORD-1001, "
    "the letters ORD followed by four digits. Could you read the number again?"
)
EMPTY_INPUT_REPLY = "Sorry, I didn't catch that. Could you please say it again?"
FALLBACK_REPLY = (
    "Sorry, I didn't quite understand that. I can help with order status, "
    "business hours, delivery and returns questions, or connect you to a human "
    "representative. Could you rephrase your question?"
)
GOODBYE_REPLY = f"You're welcome. Thank you for calling {BUSINESS_NAME}. Goodbye!"

HANDOFF_RE = re.compile(
    r"\b(?:human|representative|agent|operator|supervisor|manager|"
    r"someone|person|complaint|complain|escalate)\b",
    re.IGNORECASE,
)
ORDER_HINT_RE = re.compile(
    r"\b(?:order|ord|parcel|package|shipment|tracking|courier)\b", re.IGNORECASE
)
HOURS_RE = re.compile(
    r"\b(?:hours?|open|opening|close|closed|closing|timings?|weekend|"
    r"sunday|saturday|holidays?)\b",
    re.IGNORECASE,
)
GREETING_RE = re.compile(
    r"\b(?:hello|hi|hey|good morning|good afternoon|good evening|"
    r"assalam|salam|aoa|namaste)\b",
    re.IGNORECASE,
)
GOODBYE_RE = re.compile(
    r"\b(?:bye|goodbye|good bye|that's all|thats all|nothing else|"
    r"thank you|thanks|thank u)\b",
    re.IGNORECASE,
)

# Matches "ORD-1001", "ord 1001" and "ORD1001"; the order id is normalised
# to ORD-1001 before lookup so customers can say it in different ways.
ORDER_ID_RE = re.compile(r"\bord[\s-]?(\d{3,6})\b", re.IGNORECASE)
BARE_ORDER_NUMBER_RE = re.compile(r"\d{3,6}")
# Matches an order reference that contains digits but is malformed, such as
# "ORD-12" or "order 12", so the agent can correct the customer politely.
INVALID_ORDER_RE = re.compile(
    r"\b(?:order|ord)[\s#:-]*([a-z0-9][a-z0-9-]*\d[a-z0-9-]*)",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class AgentResponse:
    """What the agent says, and whether the call should go to a human."""

    intent: str
    reply: str
    escalate: bool = False


def normalize_text(text: str) -> str:
    """Lower-case and collapse whitespace so keyword rules stay simple."""
    cleaned = text.replace("\u2019", "'").replace("\u2018", "'")
    return " ".join(cleaned.strip().lower().split())


def find_faq(
    normalized_text: str,
    entries: Sequence[Mapping[str, object] | FaqEntry] | None = None,
) -> dict[str, object] | None:
    """Return the best FAQ match as a plain dictionary, or None.

    Kept as a small public helper for callers that only need a lookup; the
    agent itself uses :class:`~src.knowledge_base.KnowledgeBase`.
    """
    entry = KnowledgeBase(entries).find(normalized_text)
    if entry is None:
        return None
    return {
        "id": entry.id,
        "question": entry.question,
        "answer": entry.answer,
        "keywords": entry.keywords,
    }


def _format_time(value: str) -> str:
    """Convert 24-hour '18:00' to a speakable '6 PM'."""
    hours, minutes = (int(part) for part in value.split(":"))
    suffix = "AM" if hours < 12 else "PM"
    display_hour = hours % 12 or 12
    if minutes:
        return f"{display_hour}:{minutes:02d} {suffix}"
    return f"{display_hour} {suffix}"


def summarize_business_hours(
    schedule: dict[str, tuple[str, str] | None] | None = None,
) -> str:
    """Group consecutive days with the same hours into one spoken phrase."""
    schedule = BUSINESS_HOURS if schedule is None else schedule

    groups: list[tuple[list[str], tuple[str, str] | None]] = []
    for day, hours in schedule.items():
        if groups and groups[-1][1] == hours:
            groups[-1][0].append(day)
        else:
            groups.append(([day], hours))

    phrases = []
    for days, hours in groups:
        if len(days) == 1:
            day_text = days[0]
        elif len(days) == 2:
            day_text = f"{days[0]} and {days[1]}"
        else:
            day_text = f"{days[0]} to {days[-1]}"

        if hours is None:
            phrases.append(f"closed on {day_text}")
        else:
            phrases.append(
                f"{day_text} from {_format_time(hours[0])} to {_format_time(hours[1])}"
            )
    return "; ".join(phrases)


class CustomerSupportAgent:
    """Handles one customer-support call for order status and store FAQs."""

    def __init__(
        self,
        orders: dict[str, dict] | None = None,
        knowledge_base: KnowledgeBase | None = None,
    ) -> None:
        self._orders = dict(SAMPLE_ORDERS if orders is None else orders)
        self._knowledge = KnowledgeBase() if knowledge_base is None else knowledge_base

    @property
    def knowledge_base(self) -> KnowledgeBase:
        return self._knowledge

    def handle_message(self, customer_message: str) -> AgentResponse:
        """Process one customer turn and return the agent's reply."""
        if not isinstance(customer_message, str):
            raise TypeError("customer_message must be a string")

        normalized = normalize_text(customer_message)
        if not normalized:
            return AgentResponse(INTENT_EMPTY, EMPTY_INPUT_REPLY)

        direct = self._parse_direct_order_reference(normalized)
        if direct is not None:
            return direct

        if HANDOFF_RE.search(normalized):
            return AgentResponse(
                INTENT_HANDOFF, f"Of course. {self.handoff_reply()}", escalate=True
            )

        if ORDER_HINT_RE.search(normalized):
            order_id = self._parse_order_id(normalized)
            if order_id is not None:
                return self._order_status_reply(order_id)
            if INVALID_ORDER_RE.search(normalized):
                return AgentResponse(INTENT_ORDER_STATUS, INVALID_ORDER_NUMBER_REPLY)
            return AgentResponse(INTENT_ORDER_STATUS, ASK_ORDER_NUMBER_REPLY)

        if HOURS_RE.search(normalized):
            return AgentResponse(INTENT_BUSINESS_HOURS, self._hours_reply())

        faq_entry = self._knowledge.find(normalized)
        if faq_entry is not None:
            return AgentResponse(
                INTENT_FAQ,
                f"{faq_entry.answer} Is there anything else I can help you with?",
            )

        if GREETING_RE.search(normalized) and len(normalized.split()) <= 8:
            return AgentResponse(INTENT_GREETING, GREETING_REPLY)

        if GOODBYE_RE.search(normalized):
            return AgentResponse(INTENT_GOODBYE, GOODBYE_REPLY)

        return AgentResponse(INTENT_FALLBACK, FALLBACK_REPLY)

    def _parse_direct_order_reference(self, normalized: str) -> AgentResponse | None:
        """Handle a turn that is only an order number, e.g. a reply to our prompt."""
        match = ORDER_ID_RE.fullmatch(normalized)
        if match is not None:
            return self._order_status_reply(f"ORD-{match.group(1)}")
        if BARE_ORDER_NUMBER_RE.fullmatch(normalized):
            return self._order_status_reply(f"ORD-{normalized}")
        if INVALID_ORDER_RE.fullmatch(normalized):
            return AgentResponse(INTENT_ORDER_STATUS, INVALID_ORDER_NUMBER_REPLY)
        return None

    def _parse_order_id(self, normalized: str) -> str | None:
        match = ORDER_ID_RE.search(normalized)
        if match is None:
            return None
        return f"ORD-{match.group(1)}"

    def _order_status_reply(self, order_id: str) -> AgentResponse:
        order = self._orders.get(order_id)
        if order is None:
            reply = (
                f"I couldn't find an order with the number {order_id} in our sample "
                "records. Please check the number on your order confirmation and try "
                "again, or ask me to connect you to a human representative."
            )
            return AgentResponse(INTENT_ORDER_STATUS, reply)

        sentences = [
            f"Order {order_id} is marked as {order['status']}. {order['status_detail']}"
        ]
        if order.get("expected_delivery"):
            sentences.append(f"Expected delivery: {order['expected_delivery']}.")
        if order.get("tracking_number"):
            sentences.append(f"Tracking number: {order['tracking_number']}.")
        sentences.append("Is there anything else I can help you with?")
        return AgentResponse(INTENT_ORDER_STATUS, " ".join(sentences))

    def _hours_reply(self) -> str:
        return (
            f"Our support line is open {summarize_business_hours()} "
            f"({TIME_ZONE}). Is there anything else I can help you with?"
        )

    def handoff_reply(self) -> str:
        """The transfer sentence, reused for requested and automatic handoffs."""
        return (
            "I'm connecting you to a human representative now. "
            f"Our team is available {summarize_business_hours()} ({TIME_ZONE}). "
            "A colleague will be with you shortly."
        )
