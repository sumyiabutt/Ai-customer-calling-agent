"""Unit tests for the Week 3 local CRM repository."""

import tempfile
import unittest
from pathlib import Path

from src.crm import CustomerRepository, normalize_phone
from src.sample_data import SAMPLE_ORDERS


class CrmTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.path = Path(self._tmp.name) / "crm.sqlite3"
        self.repo = CustomerRepository(self.path)

    def test_fictional_customers_are_seeded(self) -> None:
        for number in range(1, 6):
            customer = self.repo.find_customer_by_phone(f"0300-000000{number}")
            self.assertIsNotNone(customer)
            assert customer is not None
            self.assertEqual(customer["id"], f"CUST-00{number}")

    def test_phone_lookup_accepts_different_formats(self) -> None:
        expected = self.repo.find_customer_by_phone("0300-0000001")
        for variant in ("0300 0000001", "03000000001", "+92 300 0000001"):
            with self.subTest(variant=variant):
                self.assertEqual(
                    self.repo.find_customer_by_phone(variant), expected
                )

    def test_unknown_or_empty_phone_returns_none(self) -> None:
        self.assertIsNone(self.repo.find_customer_by_phone("0999-9999999"))
        self.assertIsNone(self.repo.find_customer_by_phone(""))
        self.assertIsNone(self.repo.find_customer_by_phone("not a number"))

    def test_phone_must_be_text(self) -> None:
        with self.assertRaises(TypeError):
            normalize_phone(None)  # type: ignore[arg-type]

    def test_orders_match_the_sample_data(self) -> None:
        orders = self.repo.load_orders()
        self.assertEqual(set(orders), set(SAMPLE_ORDERS))
        for order_id, order in SAMPLE_ORDERS.items():
            self.assertEqual(orders[order_id]["status"], order["status"])
            self.assertEqual(
                orders[order_id]["tracking_number"], order["tracking_number"]
            )

    def test_orders_can_be_listed_for_one_customer(self) -> None:
        orders = self.repo.list_orders("CUST-001")
        self.assertEqual([order["order_id"] for order in orders], ["ORD-1001"])

    def test_single_order_lookup(self) -> None:
        order = self.repo.get_order("ORD-1003")
        self.assertIsNotNone(order)
        assert order is not None
        self.assertEqual(order["status"], "Delivered")
        self.assertEqual(order["customer_name"], "Sample Customer C")
        self.assertIsNone(self.repo.get_order("ORD-9999"))

    def test_reseeding_does_not_duplicate_rows(self) -> None:
        CustomerRepository(self.path)
        self.assertEqual(len(self.repo.load_orders()), len(SAMPLE_ORDERS))

    def test_interaction_is_saved_and_listed(self) -> None:
        interaction_id = self.repo.save_interaction(
            7, "closed", "2 customer turn(s); outcome: closed.", "CUST-002"
        )
        self.assertGreater(interaction_id, 0)

        interactions = self.repo.list_interactions("CUST-002")
        self.assertEqual(len(interactions), 1)
        self.assertEqual(interactions[0]["call_id"], 7)
        self.assertEqual(interactions[0]["outcome"], "closed")
        self.assertEqual(self.repo.list_interactions("CUST-003"), [])

    def test_invalid_interaction_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            self.repo.save_interaction(1, "unknown", "Summary")
        with self.assertRaises(ValueError):
            self.repo.save_interaction(1, "closed", "   ")


if __name__ == "__main__":
    unittest.main()
