"""Week 2 simulated call: typed words in, local speech out.

Run from the project root:

    python -m src.voice.demo              # fixed conversation, spoken locally
    python -m src.voice.demo --silent     # fixed conversation, printed only
    python -m src.voice.demo --interactive

A finished call is saved to the local CRM and call log (Week 3). No phone line,
microphone or recording is used. "Customer" lines are typed or supplied by the
demo script; they are not speech recognition results.
"""

from __future__ import annotations

import argparse
import sqlite3

from ..agent import AgentResponse
from ..call_store import CallStore
from ..crm import CustomerRepository
from .pipeline import VoicePipeline
from .tts import ConsoleTextToSpeech

BANNER = """
================================================================
  AI Customer Calling Agent - simulated call
  SIMULATED CALL: typed input, local speech output.
  No phone line, no microphone and no recording are used.
  Finished calls are saved to a local SQLite call log.
================================================================
"""

DEFAULT_CALLER = "0300-0000001"

DEMO_SCRIPT = (
    "Hello",
    "Where is my order ORD-1002?",
    "How long does delivery take?",
    "Can you cancel my subscription?",
    "What is the weather in Karachi?",
    "Do you also sell laptops?",
    "Okay, that's all. Thank you",
)


def print_exchange(
    pipeline: VoicePipeline, customer_message: str, echo_customer: bool = True
) -> AgentResponse:
    if echo_customer:
        print(f"Customer: {customer_message}")
    response = pipeline.handle_audio(customer_message)

    if isinstance(pipeline.tts, ConsoleTextToSpeech):
        # The console back end already printed the reply above as "[voice] ...".
        print(f"[intent] {response.intent}")
    else:
        print(f"Agent [{response.intent}]: {response.reply}")
    if response.escalate:
        print("[system] Escalation flag set: hand this call to a human representative.")
    print()
    return response


def save_call(pipeline: VoicePipeline, caller_phone: str) -> int | None:
    """Write the finished call to the local CRM and call log (Week 3)."""
    session = pipeline.session
    if not session.turns:
        return None
    try:
        crm = CustomerRepository()
        customer = crm.find_customer_by_phone(caller_phone)
        customer_id = customer["id"] if customer else None
        customer_name = customer["name"] if customer else None
        store = CallStore()
        call_id = store.save_session(
            session,
            caller_phone=caller_phone,
            customer_id=customer_id,
            customer_name=customer_name,
        )
        crm.save_interaction(
            call_id, session.outcome, session.summary(), customer_id=customer_id
        )
    except (OSError, sqlite3.Error) as exc:
        print(f"[system] Call log not saved: {exc}")
        return None

    who = customer_name or "unknown caller"
    print(f"[system] Call #{call_id} saved locally ({who}, {session.outcome}).")
    return call_id


def run_script(pipeline: VoicePipeline, caller_phone: str) -> None:
    print("--- Fixed demo conversation (simulated call) ---\n")
    for message in DEMO_SCRIPT:
        print_exchange(pipeline, message)
    print(f"[system] Call summary: {pipeline.session.summary()}")
    save_call(pipeline, caller_phone)


def run_interactive(pipeline: VoicePipeline, caller_phone: str) -> None:
    print_exchange(pipeline, "Hello")
    print('Type "exit" or "quit" to end the call.\n')

    while True:
        try:
            message = input("Customer: ")
        except (EOFError, KeyboardInterrupt):
            print("\n[call ended]")
            break

        if message.strip().lower() in {"exit", "quit"}:
            print("[call ended]")
            break

        print_exchange(pipeline, message, echo_customer=False)

    save_call(pipeline, caller_phone)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the simulated voice call (no telephony)."
    )
    parser.add_argument(
        "--silent",
        action="store_true",
        help="print replies instead of using the local Windows voice",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="type customer messages instead of running the fixed script",
    )
    parser.add_argument(
        "--caller",
        default=DEFAULT_CALLER,
        help="simulated caller number used for the local CRM lookup (fictional)",
    )
    args = parser.parse_args()

    print(BANNER)
    pipeline = VoicePipeline.simulated(use_windows_voice=not args.silent)
    if args.silent:
        voice = "printed text (silent mode)"
    elif isinstance(pipeline.tts, ConsoleTextToSpeech):
        voice = "printed text (Windows voice unavailable)"
    else:
        voice = "local SAPI voice"
    print(f"Output mode: {voice}")
    print(f"Caller id (simulated): {args.caller}\n")

    if args.interactive:
        run_interactive(pipeline, args.caller)
    else:
        run_script(pipeline, args.caller)


if __name__ == "__main__":
    main()
