"""Start the Week 3 dashboard on loopback and verify every page over HTTP.

Uses a temporary database seeded with fictional calls, then prints a short
pass/fail line per check. Writes nothing into the real ``data/`` folder.

Run:
    python -m scripts.check_week3_dashboard
"""

from __future__ import annotations

import http.client
import sys
import tempfile
import threading
from contextlib import closing
from pathlib import Path

from src.call_store import CallStore
from src.dashboard.app import DashboardApp, build_server
from src.session import ConversationSession

PASSWORD = "check-password"
results: list[tuple[bool, str]] = []


def check(condition: bool, label: str) -> None:
    results.append((bool(condition), label))
    print(f"{'PASS' if condition else 'FAIL'}  {label}")


def main() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        store = CallStore(Path(tmp) / "calls.sqlite3")

        closed = ConversationSession()
        for message in ("Hello", "Where is my order ORD-1001?", "bye"):
            closed.handle(message)
        store.save_session(
            closed,
            caller_phone="0300-0000001",
            customer_id="CUST-001",
            customer_name="Sample Customer A",
        )

        transferred = ConversationSession()
        for message in ("<script>alert(1)</script>", "???", "???"):
            transferred.handle(message)
        store.save_session(
            transferred,
            caller_phone="0300-0000002",
            customer_id="CUST-002",
            customer_name="Sample Customer B",
        )

        server = build_server(store, None, PASSWORD, port=0)
        port = server.server_address[1]
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()

        def request(method: str, path: str, body: str | None = None,
                    cookie: str | None = None) -> tuple[int, dict, str]:
            headers: dict[str, str] = {}
            if body is not None:
                headers["Content-Type"] = "application/x-www-form-urlencoded"
            if cookie:
                headers["Cookie"] = cookie
            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
            try:
                connection.request(method, path, body=body, headers=headers)
                response = connection.getresponse()
                return response.status, dict(response.getheaders()), response.read().decode()
            finally:
                connection.close()

        try:
            status, headers, _ = request("GET", "/")
            check(status == 303 and headers.get("Location") == "/login",
                  "unauthenticated / redirects to /login")

            status, _, body = request("GET", "/login")
            check(status == 200 and "Sign in" in body, "login page renders")

            status, _, _ = request("POST", "/login", "username=admin&password=wrong")
            check(status == 401, "wrong password returns 401")

            status, headers, _ = request(
                "POST", "/login", f"username=admin&password={PASSWORD}"
            )
            cookie_header = headers.get("Set-Cookie", "")
            check(status == 303 and cookie_header.startswith("dashboard_session="),
                  "correct password sets a session cookie")
            check("HttpOnly" in cookie_header and "SameSite=Strict" in cookie_header,
                  "cookie is HttpOnly and SameSite=Strict")
            cookie = cookie_header.split(";", 1)[0]

            status, _, body = request("GET", "/", cookie=cookie)
            check(status == 200 and "Total calls" in body, "overview renders")
            check(">2<" in body, "overview counts both saved calls")
            check("50.0%" in body, "overview shows a 50% escalation rate")

            status, _, body = request("GET", "/calls", cookie=cookie)
            check(status == 200 and 'href="/calls/1"' in body, "call list renders rows")

            status, _, body = request("GET", "/calls?outcome=transferred", cookie=cookie)
            check(status == 200 and "Sample Customer B" in body
                  and "Sample Customer A" not in body,
                  "outcome filter shows only transferred calls")

            status, _, body = request("GET", "/calls?outcome=%3Cscript%3E", cookie=cookie)
            check(status == 200 and "<script>" not in body,
                  "invalid filter is ignored and not echoed")

            status, _, body = request("GET", f"/calls/{2}", cookie=cookie)
            check(status == 200 and "Recording:</strong> not available" in body,
                  "call detail says recordings are unavailable")
            check("&lt;script&gt;" in body and "<script>alert" not in body,
                  "stored customer message is HTML-escaped")

            status, _, body = request("GET", "/calls/1", cookie=cookie)
            check(status == 200 and "order_status" in body and "greeting" in body,
                  "transcript lists intents for a saved call")

            status, _, _ = request("GET", "/calls/99", cookie=cookie)
            check(status == 404, "unknown call returns 404")

            status, _, _ = request("GET", "/nope", cookie=cookie)
            check(status == 404, "unknown page returns 404")

            status, _, _ = request("POST", "/logout", "", cookie=cookie)
            check(status == 303, "logout redirects")
            status, _, _ = request("GET", "/", cookie=cookie)
            check(status == 303, "old cookie no longer grants access")

            status, _, _ = request(
                "POST", "/login", "x" * 5000
            )
            check(status == 413, "oversized request body is rejected")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(5)

    failures = [label for ok, label in results if not ok]
    print(f"\n{len(results) - len(failures)}/{len(results)} checks passed")
    print("Note: this verified the HTTP responses only; no browser was opened "
          "and no real customer data was used.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
