"""Fictional sample data for the Week 1 prototype.

IMPORTANT
---------
Every order, product, policy and hour in this file is made-up sample data.
It is not real customer data and it does not describe a real company. It
exists only so the agent can be built and tested before the client supplies
approved content (see docs/WEEK1_DEVELOPMENT_DOCUMENT.md, section 8).

Replace this module with an approved data source / API in Week 3.
"""

BUSINESS_NAME = "Sample Store Support"
TIME_ZONE = "Asia/Karachi"

# Monday-to-Friday opening hours are identical, which lets the agent group
# them into one sentence ("Monday to Friday") instead of reading five lines.
BUSINESS_HOURS: dict[str, tuple[str, str] | None] = {
    "Monday": ("09:00", "18:00"),
    "Tuesday": ("09:00", "18:00"),
    "Wednesday": ("09:00", "18:00"),
    "Thursday": ("09:00", "18:00"),
    "Friday": ("09:00", "18:00"),
    "Saturday": ("10:00", "14:00"),
    "Sunday": None,  # None means the line is closed that day.
}

SAMPLE_ORDERS: dict[str, dict[str, str | None]] = {
    "ORD-1001": {
        "customer_name": "Sample Customer A",
        "product": "Wireless Headphones (sample item)",
        "status": "Shipped",
        "status_detail": "It left the warehouse and is with the courier.",
        "expected_delivery": "30 October 2026",
        "tracking_number": "TRK-SAMPLE-1001",
    },
    "ORD-1002": {
        "customer_name": "Sample Customer B",
        "product": "Cotton Bedsheet Set (sample item)",
        "status": "Processing",
        "status_detail": "Payment is confirmed and the order is being packed.",
        "expected_delivery": "2 November 2026",
        "tracking_number": None,
    },
    "ORD-1003": {
        "customer_name": "Sample Customer C",
        "product": "Stainless Steel Water Bottle (sample item)",
        "status": "Delivered",
        "status_detail": "It was delivered to the address on file on 26 October 2026.",
        "expected_delivery": None,
        "tracking_number": "TRK-SAMPLE-1003",
    },
    "ORD-1004": {
        "customer_name": "Sample Customer D",
        "product": "Desk Lamp (sample item)",
        "status": "Out for delivery",
        "status_detail": "It is with the delivery rider and is expected today.",
        "expected_delivery": "28 October 2026",
        "tracking_number": "TRK-SAMPLE-1004",
    },
    "ORD-1005": {
        "customer_name": "Sample Customer E",
        "product": "Bluetooth Speaker (sample item)",
        "status": "Cancelled",
        "status_detail": "It was cancelled at the customer's request and the refund is in progress.",
        "expected_delivery": None,
        "tracking_number": None,
    },
}

# Answers are deliberately short so they can be spoken aloud. The agent only
# ever repeats these approved sentences; it never composes new policy.
FAQ_ENTRIES: list[dict[str, object]] = [
    {
        "id": "shipping_time",
        "question": "How long does delivery take?",
        "keywords": (
            "how long",
            "delivery time",
            "shipping time",
            "when will",
            "arrive",
            "how many days",
        ),
        "answer": (
            "Standard delivery takes 3 to 5 working days after dispatch. "
            "Orders placed before 2 PM are usually dispatched the same working day."
        ),
    },
    {
        "id": "delivery_charges",
        "question": "What are the delivery charges?",
        "keywords": (
            "delivery charge",
            "shipping cost",
            "delivery fee",
            "free shipping",
            "shipping charges",
        ),
        "answer": (
            "Standard delivery is free for sample orders above 3,000 rupees. "
            "Below that, a flat sample fee of 250 rupees applies."
        ),
    },
    {
        "id": "returns",
        "question": "What is the return and refund policy?",
        "keywords": ("return", "refund", "exchange", "money back"),
        "answer": (
            "You can request a return within 7 days of delivery if the item is unused "
            "and in its original packaging. Approved refunds are processed within "
            "5 to 7 working days."
        ),
    },
    {
        "id": "payment",
        "question": "Which payment methods are accepted?",
        "keywords": (
            "payment",
            "how can i pay",
            "credit card",
            "debit card",
            "cash on delivery",
            "bank transfer",
        ),
        "answer": (
            "Sample payment methods are cash on delivery, debit or credit card, "
            "and bank transfer. Card details are never collected over the phone."
        ),
    },
    {
        "id": "warranty",
        "question": "Is there a warranty on the products?",
        "keywords": ("warranty", "guarantee", "damaged", "broken", "repair"),
        "answer": (
            "Sample items carry a 6-month limited warranty that covers manufacturing "
            "defects. Damage caused by misuse is not covered."
        ),
    },
]
