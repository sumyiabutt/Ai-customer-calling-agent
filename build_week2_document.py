"""Build WEEK2_DEVELOPMENT_DOCUMENT.docx from the Markdown source.

Reuses the black and dark-blue theme, cover page, contents, tables and page
numbering implemented in ``build_week1_document.py``.

Usage (from the project root):
    pip install -r requirements-dev.txt
    python scripts/build_week2_document.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_week1_document import build_document

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "WEEK2_DEVELOPMENT_DOCUMENT.md"
OUTPUT = ROOT / "WEEK2_DEVELOPMENT_DOCUMENT.docx"

META = {
    "prepared_by": "Sumyai Butt",
    "project": "AI Customer Calling Agent",
    "document_type": "Week 2 Development Progress Document",
    "week": "Week 2 - Core Voice Conversation Engine (Days 6 to 10)",
    "environment": "Python 3.12.10 on Windows (win32)",
    "related": "AI_Customer_Calling_Agent_Development_Plan.docx (unchanged)",
    "repository": "New Week 2 files added; Week 1 files updated; nothing deleted",
    "week_label": "WEEK 2",
    "header_line": "Week 2  |  Core Voice Conversation Engine",
    "subtitle": "Core Voice Conversation Engine",
    "doc_kind": "Development Progress Document",
    "cover_status": (
        "Voice loop implemented  |  65 unit tests passing  |  "
        "Live call and streaming STT pending access"
    ),
    "band": "WEEK 2 OF 4   |   DAYS 6 TO 10   |   VERSION 1.0   |   31 OCTOBER 2026",
    "footer_line": "Version 1.0  |  31 October 2026",
    "core_title": "AI Customer Calling Agent - Week 2 Development Document",
    "core_subject": "Week 2: Core Voice Conversation Engine",
    "core_keywords": (
        "AI calling agent, customer support, Week 2, knowledge base, session, "
        "speech synthesis, Python"
    ),
    "core_comments": (
        "Week 2 knowledge base, call session and local voice loop implemented and "
        "unit tested. No live call and no streaming speech recognition."
    ),
}


if __name__ == "__main__":
    build_document(SOURCE, OUTPUT, META)
