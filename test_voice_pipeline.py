"""Unit tests for the Week 2 voice loop and speech back ends."""

import io
import unittest
from contextlib import redirect_stdout

from src.agent import INTENT_GREETING, INTENT_HANDOFF
from src.session import ConversationSession
from src.voice import (
    ConsoleTextToSpeech,
    SapiTextToSpeech,
    TypedInputSTT,
    VoicePipeline,
)


class FakeSTT:
    def __init__(self) -> None:
        self.inputs: list[str] = []

    def transcribe(self, audio: str) -> str:
        self.inputs.append(audio)
        return audio.strip()


class FakeTTS:
    def __init__(self, delivered: bool = True) -> None:
        self.delivered = delivered
        self.spoken: list[str] = []

    def speak(self, text: str) -> bool:
        self.spoken.append(text)
        return self.delivered


class PipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.stt = FakeSTT()
        self.tts = FakeTTS()
        self.session = ConversationSession()
        self.pipeline = VoicePipeline(self.session, self.stt, self.tts)

    def test_one_turn_returns_reply_and_speaks_it(self) -> None:
        response = self.pipeline.handle_audio("  Hello  ")
        self.assertEqual(response.intent, INTENT_GREETING)
        self.assertEqual(self.pipeline.last_transcript, "Hello")
        self.assertEqual(self.tts.spoken, [response.reply])
        self.assertTrue(self.pipeline.last_delivered)
        self.assertEqual(len(self.session.turns), 1)

    def test_undelivered_reply_is_reported(self) -> None:
        pipeline = VoicePipeline(self.session, self.stt, FakeTTS(delivered=False))
        pipeline.handle_audio("Hello")
        self.assertFalse(pipeline.last_delivered)

    def test_pipeline_applies_fallback_escalation(self) -> None:
        first = self.pipeline.handle_audio("Can you book me a flight?")
        self.assertFalse(first.escalate)
        self.pipeline.handle_audio("What is the weather in Karachi?")
        third = self.pipeline.handle_audio("Do you also sell laptops?")

        self.assertEqual(third.intent, INTENT_HANDOFF)
        self.assertTrue(third.escalate)
        self.assertEqual(self.pipeline.session.fallback_count, 3)

    def test_non_text_audio_is_rejected(self) -> None:
        pipeline = VoicePipeline(self.session, TypedInputSTT(), self.tts)
        with self.assertRaises(TypeError):
            pipeline.handle_audio(None)  # type: ignore[arg-type]

    def test_simulated_pipeline_can_run_without_a_voice(self) -> None:
        pipeline = VoicePipeline.simulated(use_windows_voice=False)
        self.assertIsInstance(pipeline.tts, ConsoleTextToSpeech)
        self.assertIsInstance(pipeline.stt, TypedInputSTT)

        buffer = io.StringIO()
        with redirect_stdout(buffer):
            response = pipeline.handle_audio("hello")
        self.assertEqual(response.intent, INTENT_GREETING)
        self.assertIn(response.reply, buffer.getvalue())


class TypedInputSTTTests(unittest.TestCase):
    def test_text_is_returned_as_transcript(self) -> None:
        self.assertEqual(TypedInputSTT().transcribe("  where is my order "), "where is my order")

    def test_empty_detection_uses_the_agent_normaliser(self) -> None:
        stt = TypedInputSTT()
        self.assertTrue(stt.is_empty("   \n\t "))
        self.assertFalse(stt.is_empty("hello"))

    def test_non_text_input_is_rejected(self) -> None:
        with self.assertRaises(TypeError):
            TypedInputSTT().transcribe(None)  # type: ignore[arg-type]


class TextToSpeechTests(unittest.TestCase):
    def test_console_back_end_prints_the_reply(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            delivered = ConsoleTextToSpeech().speak("Hello from the agent.")
        self.assertTrue(delivered)
        self.assertIn("Hello from the agent.", buffer.getvalue())

    def test_missing_powershell_is_reported_not_crashed(self) -> None:
        tts = SapiTextToSpeech(powershell_path="C:/definitely/not/here/powershell.exe")
        self.assertFalse(tts.available)
        self.assertFalse(tts.speak("Hello"))

    def test_empty_text_is_not_spoken(self) -> None:
        if not SapiTextToSpeech().available:
            self.skipTest("Windows PowerShell is not available")
        self.assertFalse(SapiTextToSpeech().speak("   "))

    def test_invalid_rate_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            SapiTextToSpeech(rate=99)


if __name__ == "__main__":
    unittest.main()
