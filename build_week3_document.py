"""Build WEEK3_DEVELOPMENT_DOCUMENT.docx from the Markdown source.

Reuses the black and dark-blue theme, cover page, contents, tables and page
numbering implemented in ``build_week1_document.py``.

Usage (from the project root):
    pip install -r requirements-dev.txt
    python scripts/build_week3_document.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_week1_document import build_document

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "WEEK3_DEVELOPMENT_DOCUMENT.md"
OUTPUT = ROOT / "WEEK3_DEVELOPMENT_DOCUMENT.docx"

META = {
    "prepared_by": "Sumyai Butt",
    "project": "AI Customer Calling Agent",
    "document_type": "Week 3 Development Progress Document",
    "week": "Week 3 - Business System Integration and Admin Dashboard (Days 11 to 15)",
    "environment": "Python 3.12.10 on Windows (win32)",
    "related": "AI_Customer_Calling_Agent_Development_Plan.docx (unchanged)",
    "repository": "New Week 3 files added; Week 1 and Week 2 files unchanged in behaviour",
    "week_label": "WEEK 3",
    "header_line": "Week 3  |  Business System Integration and Admin Dashboard",
    "subtitle": "Business System Integration and Admin Dashboard",
    "doc_kind": "Development Progress Document",
    "cover_status": (
        "Local CRM, call log and dashboard implemented  |  104 unit tests passing  |  "
        "Real CRM, telephony and recordings pending access"
    ),
    "band": "WEEK 3 OF 4   |   DAYS 11 TO 15   |   VERSION 1.0   |   2 NOVEMBER 2026",
    "footer_line": "Version 1.0  |  2 November 2026",
    "core_title": "AI Customer Calling Agent - Week 3 Development Document",
    "core_subject": "Week 3: Business System Integration and Admin Dashboard",
    "core_keywords": (
        "AI calling agent, customer support, Week 3, CRM, SQLite, call log, "
        "dashboard, analytics, Python"
    ),
    "core_comments": (
        "Week 3 local CRM, call log and password-protected admin dashboard "
        "implemented and tested. Fictional data only; no real CRM, telephony or "
        "recording."
    ),
}


if __name__ == "__main__":
    build_document(SOURCE, OUTPUT, META)
