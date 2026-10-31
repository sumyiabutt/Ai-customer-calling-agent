"""Conversation state for one simulated call (Week 2).

The Week 1 agent answers a single turn. A real call needs memory across turns:
how many times in a row the customer was misunderstood, whether the call has
already been handed to a human, whether the customer has said goodbye, and a
short summary for the person who receives a transfer.

The plan sets a limit of two or three failed attempts before escalation, so a
customer is never stuck in a loop with an agent that cannot understand them.
"""

from __future__ import annotations

from dataclasses import dataclass

from .agent import (
    INTENT_EMPTY,
    INTENT_FALLBACK,
    INTENT_GOODBYE,
    INTENT_HANDOFF,
    AgentResponse,
    CustomerSupportAgent,
)

DEFAULT_MAX_FALLBACKS = 3

# Silence and an unparsed question are both attempts where the agent failed to
# understand the customer, so both count towards automatic escalation.
MISUNDERSTOOD_INTENTS = frozenset({INTENT_FALLBACK, INTENT_EMPTY})


@dataclass(frozen=True)
class Turn:
    """One customer message and the reply that was given to it."""

    customer_message: str
    response: AgentResponse


class ConversationSession:
    """Wraps ``CustomerSupportAgent`` with per-call state."""

    def __init__(
        self,
        agent: CustomerSupportAgent | None = None,
        max_fallbacks: int = DEFAULT_MAX_FALLBACKS,
    ) -> None:
        if isinstance(max_fallbacks, bool) or not isinstance(max_fallbacks, int):
            raise TypeError("max_fallbacks must be an integer")
        if max_fallbacks < 1:
            raise ValueError("max_fallbacks must be at least 1")

        self._agent = CustomerSupportAgent() if agent is None else agent
        self._max_fallbacks = max_fallbacks
        self._fallback_count = 0
        self._turns: list[Turn] = []
        self._escalated = False
        self._ended = False

    @property
    def agent(self) -> CustomerSupportAgent:
        return self._agent

    @property
    def turns(self) -> tuple[Turn, ...]:
        return tuple(self._turns)

    @property
    def fallback_count(self) -> int:
        return self._fallback_count

    @property
    def max_fallbacks(self) -> int:
        return self._max_fallbacks

    @property
    def escalated(self) -> bool:
        return self._escalated

    @property
    def ended(self) -> bool:
        return self._ended

    def handle(self, customer_message: str) -> AgentResponse:
        """Process one customer turn, applying the escalation rule."""
        if self._ended:
            raise RuntimeError("This call has already ended.")

        response = self._agent.handle_message(customer_message)

        if response.intent in MISUNDERSTOOD_INTENTS:
            self._fallback_count += 1
        else:
            self._fallback_count = 0

        if (
            not response.escalate
            and not self._escalated
            and self._fallback_count >= self._max_fallbacks
        ):
            response = AgentResponse(
                INTENT_HANDOFF,
                "I'm sorry, I'm still having trouble understanding you. "
                f"{self._agent.handoff_reply()}",
                escalate=True,
            )

        if response.escalate:
            self._escalated = True
        if response.intent == INTENT_GOODBYE:
            self._ended = True

        self._turns.append(Turn(customer_message, response))
        return response

    def summary(self) -> str:
        """Short handoff note so the customer does not repeat themselves."""
        if not self._turns:
            return "No customer turns yet."

        topics: list[str] = []
        for turn in self._turns:
            topic = turn.response.intent.replace("_", " ")
            if topic not in topics:
                topics.append(topic)

        if self._escalated:
            outcome = "transferred to a human representative"
        elif self._ended:
            outcome = "closed by the customer"
        else:
            outcome = "still in progress"

        return (
            f"{len(self._turns)} customer turn(s); "
            f"topics: {', '.join(topics)}; outcome: {outcome}."
        )
