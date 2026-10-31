"""Text-to-speech back ends for the Week 2 simulated call.

Two implementations:

- ``SapiTextToSpeech`` uses the Windows built-in speech synthesizer through
  PowerShell. It needs no API key and no pip package, so the agent can be
  heard on this laptop. It is local speech synthesis, not a telephony voice.
- ``ConsoleTextToSpeech`` prints the reply for machines without a voice.

Neither back end sends audio anywhere. A production call will use a telephony
voice (ElevenLabs, Azure Neural, Google TTS or Cartesia), which requires the
API access listed in the README.
"""

from __future__ import annotations

import os
import shutil
import subprocess


class ConsoleTextToSpeech:
    """Prints replies instead of playing audio."""

    available = True

    def speak(self, text: str) -> bool:
        """Display the text; returns True because the customer can read it."""
        print(f"[voice] {text}")
        return True


class SapiTextToSpeech:
    """Speaks through the Windows SAPI voice using the bundled PowerShell."""

    def __init__(self, powershell_path: str | None = None, rate: int = 0) -> None:
        if not -10 <= rate <= 10:
            raise ValueError("rate must be between -10 and 10")
        self._powershell = (
            powershell_path if powershell_path else self._find_powershell()
        )
        self._rate = rate

    @staticmethod
    def _find_powershell() -> str | None:
        system_root = os.environ.get("SystemRoot", r"C:\Windows")
        candidates = (
            os.path.join(
                system_root, "System32", "WindowsPowerShell", "v1.0", "powershell.exe"
            ),
            shutil.which("powershell"),
        )
        for candidate in candidates:
            if candidate and os.path.isfile(candidate):
                return candidate
        return None

    @property
    def available(self) -> bool:
        return bool(self._powershell and os.path.isfile(self._powershell))

    def speak(self, text: str) -> bool:
        """Play the text aloud; returns False when no voice could play it."""
        if not self.available or not text.strip():
            return False

        script = (
            "$ErrorActionPreference = 'Stop'; "
            "[Console]::InputEncoding = [System.Text.Encoding]::UTF8; "
            "$text = [Console]::In.ReadToEnd(); "
            "$voice = New-Object -ComObject SAPI.SpVoice; "
            f"$voice.Rate = {self._rate}; "
            "$voice.Speak($text) > $null"
        )
        try:
            completed = subprocess.run(
                [
                    self._powershell,
                    "-NoProfile",
                    "-NonInteractive",
                    "-Command",
                    script,
                ],
                input=text,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=60,
                check=False,
            )
        except (OSError, subprocess.SubprocessError):
            return False
        return completed.returncode == 0
