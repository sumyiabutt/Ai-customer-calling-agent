"""Terminal demo of the Week 1 agent: a simulated customer phone call.

The point of this file is to show the conversation behaviour that will later
run behind a real call. Nothing here dials a number.
"""

from __future__ import annotations

import argparse

from .agent import AgentResponse, CustomerSupportAgent

BANNER = """
==============================================================
  AI Customer Calling Agent - Week 1 local prototype
  SIMULATED CALL: text only, no phone call is placed.
  Type "exit" or "quit" to end the session.
==============================================================
"""

DEMO_CONVERSATION = (
    "Hello",
    "Where is my order ORD-1001?",
    "What are your business hours?",
    "How long does delivery take?",
    "Can you book me a flight to Dubai?",
    "I want to speak to a human representative",
    "That's all, thank you",
)


def print_exchange(customer_message: str, response: AgentResponse) -> None:
    """Print one customer turn and the agent's answer."""
    print(f"Customer: {customer_message}")
    print(f"Agent [{response.intent}]: {response.reply}")
    if response.escalate:
        print("[system] Escalation flag set: hand this call to a human representative.")
    print()


def run_demo(agent: CustomerSupportAgent) -> None:
    print("--- Fixed demo conversation ---\n")
    for message in DEMO_CONVERSATION:
        print_exchange(message, agent.handle_message(message))


def run_interactive(agent: CustomerSupportAgent) -> None:
    """Read messages from the terminal until the customer leaves the call."""
    print_exchange("Hello", agent.handle_message("hello"))

    while True:
        try:
            message = input("Customer: ")
        except (EOFError, KeyboardInterrupt):
            print("\n[call ended]")
            return

        if message.strip().lower() in {"exit", "quit"}:
            print("\n[call ended]")
            return

        response = agent.handle_message(message)
        print(f"Agent [{response.intent}]: {response.reply}")
        if response.escalate:
            print("[system] Escalation flag set: hand this call to a human representative.")
        print()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the Week 1 text-based prototype of the AI calling agent."
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="run a fixed sample conversation instead of interactive input",
    )
    args = parser.parse_args()

    print(BANNER)
    agent = CustomerSupportAgent()
    if args.demo:
        run_demo(agent)
    else:
        run_interactive(agent)


if __name__ == "__main__":
    main()
