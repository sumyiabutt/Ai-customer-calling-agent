"""Speech-to-text stand-ins for the Week 2 simulated call.

A real call needs a streaming STT engine (Deepgram, Google, Azure or Whisper).
No STT credentials are available in this environment, so the pipeline accepts
text that the caller or demo script supplies and treats it as the transcript.

Important: this does not listen to a microphone and does not claim that speech
recognition is working. It exists so the rest of the voice loop can be built,
tested and demoed without pretending a phone call happened.
"""

from __future__ import annotations

from ..agent import normalize_text


class TypedInputSTT:
    """Accepts typed text and returns it as the transcript."""

    def transcribe(self, audio: str) -> str:
        if not isinstance(audio, str):
            raise TypeError("TypedInputSTT needs text input")
        return audio.strip()

    def is_empty(self, transcript: str) -> bool:
        return not normalize_text(transcript)
