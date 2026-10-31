"""The voice loop around the dialogue agent (Week 2).

One turn travels: transcript in -> call session -> spoken reply out. The
speech components are pluggable protocols, so the typed stand-ins used now can
be replaced by streaming telephony STT/TTS without touching the dialogue code.

What this is not: there is no microphone, no audio streaming and no phone
line. Barge-in (the customer interrupting the agent) cannot be implemented
without a real audio stream and is still open (see README limitations).
"""

from __future__ import annotations

from typing import Protocol

from ..agent import AgentResponse
from ..session import ConversationSession
from .stt import TypedInputSTT
from .tts import ConsoleTextToSpeech, SapiTextToSpeech


class SpeechToText(Protocol):
    """Turns one piece of customer audio into text."""

    def transcribe(self, audio: str) -> str: ...


class TextToSpeech(Protocol):
    """Delivers the agent reply to the customer; False means not delivered."""

    def speak(self, text: str) -> bool: ...


class VoicePipeline:
    """Connects speech input, the call session and speech output."""

    def __init__(
        self,
        session: ConversationSession,
        stt: SpeechToText,
        tts: TextToSpeech,
    ) -> None:
        self._session = session
        self._stt = stt
        self._tts = tts
        self._last_transcript = ""
        self._last_delivered = False

    @property
    def session(self) -> ConversationSession:
        return self._session

    @property
    def stt(self) -> SpeechToText:
        return self._stt

    @property
    def tts(self) -> TextToSpeech:
        return self._tts

    @property
    def last_transcript(self) -> str:
        return self._last_transcript

    @property
    def last_delivered(self) -> bool:
        """Whether the last reply actually reached the customer."""
        return self._last_delivered

    def handle_audio(self, audio: str) -> AgentResponse:
        """Run one full turn and speak the reply."""
        transcript = self._stt.transcribe(audio)
        self._last_transcript = transcript
        response = self._session.handle(transcript)
        self._last_delivered = self._tts.speak(response.reply)
        return response

    @classmethod
    def simulated(
        cls,
        session: ConversationSession | None = None,
        use_windows_voice: bool = True,
    ) -> "VoicePipeline":
        """Build the offline demo pipeline, falling back to printed replies."""
        tts: TextToSpeech = (
            SapiTextToSpeech() if use_windows_voice else ConsoleTextToSpeech()
        )
        if not getattr(tts, "available", True):
            tts = ConsoleTextToSpeech()
        return cls(session or ConversationSession(), TypedInputSTT(), tts)
