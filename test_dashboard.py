"""Unit tests for the Week 3 local admin dashboard."""

import http.client
import tempfile
import threading
import time
import unittest
from datetime import timedelta
from pathlib import Path

from src.call_store import CallStore
from src.dashboard.app import MAX_BODY_BYTES, DashboardApp, build_server
from src.session import ConversationSession

PASSWORD = "test-password"


class DashboardAppTestCase(unittest.TestCase):
    """Routing and session rules without opening a socket."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.store = CallStore(Path(self._tmp.name) / "calls.sqlite3")
        self.app = DashboardApp(self.store, password=PASSWORD)

    def _save_call(self, message: str = "Hello") -> int:
        session = ConversationSession()
        session.handle(message)
        return self.store.save_session(session, caller_phone="0300-0000001")

    def test_password_is_required(self) -> None:
        with self.assertRaises(ValueError):
            DashboardApp(self.store, password="")
        with self.assertRaises(ValueError):
            DashboardApp(self.store, password=None)  # type: ignore[arg-type]

    def test_protected_pages_redirect_to_login(self) -> None:
        for path in ("/", "/calls", "/calls/1"):
            with self.subTest(path=path):
                response = self.app.get(path, {}, None)
                self.assertEqual(response.status, 303)
                self.assertIn(("Location", "/login"), response.headers)

    def test_login_page_is_public(self) -> None:
        response = self.app.get("/login", {}, None)
        self.assertEqual(response.status, 200)
        self.assertIn("Sign in", response.body)

    def test_login_redirects_when_already_signed_in(self) -> None:
        token = self.app.authenticate("admin", PASSWORD)
        response = self.app.get("/login", {}, token)
        self.assertEqual(response.status, 303)

    def test_wrong_password_is_rejected(self) -> None:
        self.assertIsNone(self.app.authenticate("admin", "wrong"))
        self.assertIsNone(self.app.authenticate("someone", PASSWORD))
        response = self.app.post(
            "/login", {"username": ["admin"], "password": ["wrong"]}, None
        )
        self.assertEqual(response.status, 401)
        self.assertIn("Invalid username or password", response.body)

    def test_username_is_trimmed_for_login(self) -> None:
        token = self.app.authenticate("  admin  ", PASSWORD)
        self.assertIsNotNone(token)

    def test_successful_login_sets_hardened_cookie(self) -> None:
        response = self.app.post(
            "/login", {"username": ["admin"], "password": [PASSWORD]}, None
        )
        self.assertEqual(response.status, 303)
        self.assertIn(("Location", "/"), response.headers)
        cookies = [value for name, value in response.headers if name == "Set-Cookie"]
        self.assertEqual(len(cookies), 1)
        self.assertIn("HttpOnly", cookies[0])
        self.assertIn("SameSite=Strict", cookies[0])
        self.assertIn("Path=/", cookies[0])

    def test_logout_invalidates_the_token(self) -> None:
        token = self.app.authenticate("admin", PASSWORD)
        self.assertTrue(self.app.is_authenticated(token))
        response = self.app.post("/logout", {}, token)
        self.assertEqual(response.status, 303)
        self.assertFalse(self.app.is_authenticated(token))

    def test_expired_session_is_rejected(self) -> None:
        app = DashboardApp(self.store, password=PASSWORD, session_ttl=timedelta(microseconds=1))
        token = app.authenticate("admin", PASSWORD)
        time.sleep(0.01)
        self.assertFalse(app.is_authenticated(token))
        self.assertEqual(app.get("/", {}, token).status, 303)

    def test_unknown_path_is_not_found(self) -> None:
        token = self.app.authenticate("admin", PASSWORD)
        self.assertEqual(self.app.get("/nope", {}, token).status, 404)

    def test_unknown_call_is_not_found(self) -> None:
        token = self.app.authenticate("admin", PASSWORD)
        self.assertEqual(self.app.get("/calls/999", {}, token).status, 404)

    def test_invalid_outcome_filter_falls_back_to_all_calls(self) -> None:
        self._save_call()
        token = self.app.authenticate("admin", PASSWORD)
        response = self.app.get("/calls", {"outcome": ["<script>"]}, token)
        self.assertEqual(response.status, 200)
        self.assertIn('href="/calls/1"', response.body)
        self.assertNotIn("<script>", response.body)

    def test_overview_and_pages_render_saved_data(self) -> None:
        self._save_call()
        token = self.app.authenticate("admin", PASSWORD)
        overview = self.app.get("/", {}, token)
        self.assertEqual(overview.status, 200)
        self.assertIn("Total calls", overview.body)
        self.assertIn("0300-0000001", overview.body)
        calls = self.app.get("/calls", {}, token)
        self.assertIn("Every saved simulated call", calls.body)
        self.assertIn('href="/calls/1"', calls.body)


class DashboardServerTestCase(unittest.TestCase):
    """HTTP-level checks against a real loopback server on an ephemeral port."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.store = CallStore(Path(self._tmp.name) / "calls.sqlite3")
        session = ConversationSession()
        session.handle("<script>alert('xss')</script>")
        session.handle("bye")
        self.call_id = self.store.save_session(session, caller_phone="0300-0000001")

        self.server = build_server(self.store, None, PASSWORD, port=0)
        self.port = self.server.server_address[1]
        self._thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self._thread.start()
        self.addCleanup(self._thread.join, 5)
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)

    def request(self, method: str, path: str, body: str | bytes | None = None,
                headers: dict[str, str] | None = None):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        self.addCleanup(connection.close)
        payload = body.encode("utf-8") if isinstance(body, str) else body
        connection.request(method, path, body=payload, headers=headers or {})
        response = connection.getresponse()
        return response, response.read().decode("utf-8")

    def login(self) -> str:
        response, _ = self.request(
            "POST",
            "/login",
            "username=admin&password=test-password",
            {"Content-Type": "application/x-www-form-urlencoded"},
        )
        self.assertEqual(response.status, 303)
        cookie = response.getheader("Set-Cookie") or ""
        return cookie.split(";", 1)[0]

    def test_unauthenticated_get_redirects(self) -> None:
        response, _ = self.request("GET", "/")
        self.assertEqual(response.status, 303)
        self.assertEqual(response.getheader("Location"), "/login")

    def test_login_flow_and_security_headers(self) -> None:
        response, body = self.request("GET", "/login")
        self.assertEqual(response.status, 200)
        self.assertEqual(response.getheader("X-Content-Type-Options"), "nosniff")
        self.assertEqual(response.getheader("Referrer-Policy"), "no-referrer")
        self.assertIn("Sign in", body)

        bad, _ = self.request("POST", "/login", "username=admin&password=wrong")
        self.assertEqual(bad.status, 401)

        cookie = self.login()
        self.assertTrue(cookie.startswith("dashboard_session="))

        authed, overview = self.request("GET", "/", headers={"Cookie": cookie})
        self.assertEqual(authed.status, 200)
        self.assertIn("Total calls", overview)
        self.assertIn("Local demo dashboard", overview)

    def test_transcript_is_escaped(self) -> None:
        cookie = self.login()
        response, body = self.request("GET", f"/calls/{self.call_id}", headers={"Cookie": cookie})
        self.assertEqual(response.status, 200)
        self.assertIn("Recording:</strong> not available", body)
        self.assertNotIn("<script>alert", body)
        self.assertIn("&lt;script&gt;", body)

    def test_unknown_call_returns_404(self) -> None:
        cookie = self.login()
        response, body = self.request("GET", "/calls/999", headers={"Cookie": cookie})
        self.assertEqual(response.status, 404)
        self.assertIn("Not found", body)

    def test_logout_clears_access(self) -> None:
        cookie = self.login()
        response, _ = self.request("POST", "/logout", "", {"Cookie": cookie})
        self.assertEqual(response.status, 303)
        self.assertIn("Max-Age=0", response.getheader("Set-Cookie") or "")
        after, _ = self.request("GET", "/", headers={"Cookie": cookie})
        self.assertEqual(after.status, 303)

    def test_oversized_body_is_rejected(self) -> None:
        response, body = self.request(
            "POST",
            "/login",
            "x" * (MAX_BODY_BYTES + 10),
            {"Content-Type": "application/x-www-form-urlencoded"},
        )
        self.assertEqual(response.status, 413)
        self.assertIn("Request too large", body)


if __name__ == "__main__":
    unittest.main()
