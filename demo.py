"""Week 2 simulated call: typed words in, local speech out.

Run from the project root:

    python -m src.voice.demo              # fixed conversation, spoken locally
    python -m src.voice.demo --silent     # fixed conversation, printed only
    python -m src.voice.demo --interactive

No phone line, microphone or recording is used. "Customer" lines are typed or
supplied by the demo script; they are not speech recognition results.
"""

from __future__ import annotations

import argparse

from ..agent import AgentResponse
from .pipeline import VoicePipeline
from .tts import ConsoleTextToSpeech

BANNER = """
================================================================
  AI Customer Calling Agent - Week 2 simulated call
  SIMULATED CALL: typed input, local speech output.
  No phone line, no microphone and no recording are used.
  Type "exit" or "quit" to end the session.
================================================================
"""

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


def run_script(pipeline: VoicePipeline) -> None:
    print("--- Fixed demo conversation (simulated call) ---\n")
    for message in DEMO_SCRIPT:
        print_exchange(pipeline, message)
    print(f"[system] Call summary: {pipeline.session.summary()}")


def run_interactive(pipeline: VoicePipeline) -> None:
    print_exchange(pipeline, "Hello")

    while True:
        try:
            message = input("Customer: ")
        except (EOFError, KeyboardInterrupt):
            print("\n[call ended]")
            return

        if message.strip().lower() in {"exit", "quit"}:
            print("\n[call ended]")
            return

        print_exchange(pipeline, message, echo_customer=False)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the Week 2 simulated voice call (no telephony)."
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
    args = parser.parse_args()

    print(BANNER)
    pipeline = VoicePipeline.simulated(use_windows_voice=not args.silent)
    if args.silent:
        voice = "printed text (silent mode)"
    elif isinstance(pipeline.tts, ConsoleTextToSpeech):
        voice = "printed text (Windows voice unavailable)"
    else:
        voice = "local SAPI voice"
    print(f"Output mode: {voice}\n")

    if args.interactive:
        run_interactive(pipeline)
    else:
        run_script(pipeline)


if __name__ == "__main__":
    main()
