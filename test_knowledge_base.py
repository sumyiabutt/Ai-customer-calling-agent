"""Unit tests for the Week 2 knowledge base."""

import unittest

from src.knowledge_base import FaqEntry, KnowledgeBase


class FaqEntryTests(unittest.TestCase):
    def test_from_mapping_normalises_keywords(self) -> None:
        entry = FaqEntry.from_mapping(
            {
                "id": "loyalty",
                "question": "Do you have a loyalty programme?",
                "answer": "Yes, sample members earn points.",
                "keywords": ["Loyalty", "  Points "],
            }
        )
        self.assertEqual(entry.keywords, ("loyalty", "points"))

    def test_missing_answer_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            FaqEntry.from_mapping({"id": "x", "keywords": ["x"]})

    def test_empty_keywords_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            FaqEntry.from_mapping({"id": "x", "answer": "A.", "keywords": []})

    def test_non_mapping_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            FaqEntry.from_mapping(["not", "an", "entry"])  # type: ignore[arg-type]

    def test_validate_returns_the_entry(self) -> None:
        entry = FaqEntry("x", "Q?", "A.", ("x",))
        self.assertIs(entry.validate(), entry)


class KnowledgeBaseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.kb = KnowledgeBase()

    def test_sample_entries_are_loaded(self) -> None:
        self.assertEqual(len(self.kb), 5)
        self.assertIn("returns", self.kb.ids)

    def test_matching_entry_is_found(self) -> None:
        entry = self.kb.find("how long does delivery take")
        self.assertIsNotNone(entry)
        assert entry is not None
        self.assertEqual(entry.id, "shipping_time")

    def test_unknown_question_returns_none(self) -> None:
        self.assertIsNone(self.kb.find("can you book me a flight to dubai"))

    def test_empty_text_returns_none(self) -> None:
        self.assertIsNone(self.kb.find(""))
        self.assertIsNone(self.kb.find("   "))

    def test_highest_keyword_score_wins(self) -> None:
        entry = self.kb.find("is there a delivery charge or free shipping?")
        self.assertIsNotNone(entry)
        assert entry is not None
        self.assertEqual(entry.id, "delivery_charges")

    def test_custom_entries_replace_the_sample_set(self) -> None:
        kb = KnowledgeBase(
            [
                {
                    "id": "loyalty",
                    "question": "Do you have a loyalty programme?",
                    "answer": "Yes.",
                    "keywords": ("loyalty",),
                }
            ]
        )
        self.assertEqual(kb.ids, ("loyalty",))
        self.assertIsNone(kb.find("return policy"))
        self.assertEqual(kb.find("loyalty card").id, "loyalty")

    def test_entry_objects_are_accepted(self) -> None:
        kb = KnowledgeBase([FaqEntry("loyalty", "Q?", "Yes.", ("loyalty",))])
        self.assertEqual(kb.find("loyalty").id, "loyalty")

    def test_duplicate_ids_are_rejected(self) -> None:
        entry = FaqEntry("loyalty", "Q?", "Yes.", ("loyalty",))
        with self.assertRaises(ValueError):
            KnowledgeBase([entry, entry])

    def test_find_requires_text(self) -> None:
        with self.assertRaises(TypeError):
            self.kb.find(None)  # type: ignore[arg-type]


if __name__ == "__main__":
    unittest.main()
