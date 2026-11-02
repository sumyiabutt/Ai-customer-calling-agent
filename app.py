"""Local admin dashboard for the AI Customer Calling Agent (Week 3).

A small standard-library HTTP server that shows the call log, transcripts and
basic analytics. It binds to 127.0.0.1 by default, requires a password, and
uses an in-memory session cookie.

This is a local demonstration tool, not production authentication: there is no
TLS, no user database and no multi-user permission model. Do not expose it to a
network or use it with real customer data.

Run:
    python -m src.dashboard
"""

from __future__ import annotations

import argparse
import hmac
import os
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

from ..call_store import OUTCOMES, CallStore
from ..crm import CustomerRepository
from . import views

COOKIE_NAME = "dashboard_session"
MAX_BODY_BYTES = 4096
MAX_DRAIN_BYTES = 1_048_576
CALL_PATH_RE = re.compile(r"^/calls/(\d+)$")
LOOPBACK_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})


@dataclass(frozen=True)
class Response:
    status: int
    body: str = ""
    headers: tuple[tuple[str, str], ...] = ()


def _redirect(location: str, headers: tuple[tuple[str, str], ...] = ()) -> Response:
    return Response(303, "", (("Location", location),) + headers)


def _session_cookie(token: str, max_age: int) -> tuple[tuple[str, str], ...]:
    return (
        (
            "Set-Cookie",
            f"{COOKIE_NAME}={token}; HttpOnly; SameSite=Strict; Path=/; "
            f"Max-Age={max_age}",
        ),
    )


class DashboardApp:
    """Routing and authentication, independent of the HTTP socket layer."""

    def __init__(
        self,
        call_store: CallStore,
        crm: CustomerRepository | None = None,
        password: str | None = None,
        username: str = "admin",
        session_ttl: timedelta = timedelta(hours=8),
    ) -> None:
        if not isinstance(password, str) or not password:
            raise ValueError("A dashboard password is required")
        if session_ttl <= timedelta(0):
            raise ValueError("session_ttl must be positive")
        self._calls = call_store
        self._crm = crm
        self._username = username
        self._password = password
        self._session_ttl = session_ttl
        self._sessions: dict[str, datetime] = {}

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def authenticate(self, username: str, password: str) -> str | None:
        user_ok = hmac.compare_digest(
            username.strip().encode("utf-8"), self._username.encode("utf-8")
        )
        password_ok = hmac.compare_digest(
            password.encode("utf-8"), self._password.encode("utf-8")
        )
        if not (user_ok and password_ok):
            return None
        token = secrets.token_urlsafe(32)
        self._sessions[token] = self._now() + self._session_ttl
        return token

    def is_authenticated(self, token: str | None) -> bool:
        if not token:
            return False
        expires_at = self._sessions.get(token)
        if expires_at is None:
            return False
        if expires_at <= self._now():
            self._sessions.pop(token, None)
            return False
        return True

    def logout(self, token: str | None) -> None:
        if token:
            self._sessions.pop(token, None)

    def get(
        self, path: str, query: dict[str, list[str]], token: str | None
    ) -> Response:
        path = path.rstrip("/") or "/"

        if path == "/login":
            if self.is_authenticated(token):
                return _redirect("/")
            return Response(200, views.login_page())

        if not self.is_authenticated(token):
            return _redirect("/login")

        if path == "/":
            stats = self._calls.analytics()
            recent = self._calls.list_calls(limit=10)
            return Response(200, views.overview_page(stats, recent))

        if path == "/calls":
            requested = query.get("outcome", [None])[0]
            selected = requested if requested in OUTCOMES else None
            calls = self._calls.list_calls(outcome=selected)
            return Response(200, views.calls_page(calls, selected))

        match = CALL_PATH_RE.match(path)
        if match:
            call = self._calls.get_call(int(match.group(1)))
            if call is None:
                return Response(404, views.not_found_page("That call does not exist."))
            turns = self._calls.get_turns(int(match.group(1)))
            return Response(200, views.call_detail_page(call, turns))

        return Response(404, views.not_found_page())

    def post(
        self, path: str, form: dict[str, list[str]], token: str | None
    ) -> Response:
        path = path.rstrip("/") or "/"

        if path == "/login":
            username = form.get("username", [""])[0]
            password = form.get("password", [""])[0]
            new_token = self.authenticate(username, password)
            if new_token is None:
                return Response(401, views.login_page("Invalid username or password."))
            max_age = int(self._session_ttl.total_seconds())
            return _redirect("/", _session_cookie(new_token, max_age))

        if path == "/logout":
            self.logout(token)
            return _redirect("/login", _session_cookie("", 0))

        if not self.is_authenticated(token):
            return _redirect("/login")

        return Response(404, views.not_found_page())


def make_handler(app: DashboardApp):
    class DashboardHandler(BaseHTTPRequestHandler):
        server_version = "CallingAgentDashboard/1.0"

        def do_GET(self) -> None:
            parts = urlsplit(self.path)
            response = app.get(parts.path, parse_qs(parts.query), self._token())
            self._send(response)

        def do_POST(self) -> None:
            parts = urlsplit(self.path)
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length > MAX_BODY_BYTES:
                # Drain a bounded amount so the client can read the 413 instead
                # of losing the connection mid-write, then close it.
                if length <= MAX_DRAIN_BYTES:
                    self.rfile.read(length)
                self.close_connection = True
                self._send(
                    Response(
                        413,
                        views.not_found_page("Request too large."),
                        (("Connection", "close"),),
                    )
                )
                return
            raw = self.rfile.read(length).decode("utf-8", "replace")
            form = parse_qs(raw, keep_blank_values=True)
            response = app.post(parts.path, form, self._token())
            self._send(response)

        def _token(self) -> str | None:
            header = self.headers.get("Cookie")
            if not header:
                return None
            cookie = SimpleCookie()
            try:
                cookie.load(header)
            except Exception:
                return None
            morsel = cookie.get(COOKIE_NAME)
            return morsel.value if morsel is not None else None

        def _send(self, response: Response) -> None:
            body = response.body.encode("utf-8")
            self.send_response(response.status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            for name, value in response.headers:
                self.send_header(name, value)
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)

        def log_message(self, format: str, *args: object) -> None:
            # Keep the demo console readable; the dashboard is local-only.
            pass

    return DashboardHandler


def build_server(
    call_store: CallStore,
    crm: CustomerRepository | None,
    password: str,
    username: str = "admin",
    host: str = "127.0.0.1",
    port: int = 8080,
) -> ThreadingHTTPServer:
    app = DashboardApp(call_store, crm, password, username=username)
    server = ThreadingHTTPServer((host, port), make_handler(app))
    server.daemon_threads = True
    server.app = app  # type: ignore[attr-defined]
    return server


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Run the local admin dashboard (no real customer data)."
    )
    parser.add_argument("--host", default="127.0.0.1", help="bind address")
    parser.add_argument("--port", type=int, default=8080, help="bind port")
    args = parser.parse_args(argv)

    password = os.environ.get("DASHBOARD_PASSWORD")
    generated = False
    if not password:
        password = secrets.token_urlsafe(9)
        generated = True
    username = os.environ.get("DASHBOARD_USER", "admin")

    calls = CallStore()
    crm = CustomerRepository()
    server = build_server(
        calls, crm, password, username=username, host=args.host, port=args.port
    )
    port = server.server_address[1]
    display_host = "127.0.0.1" if args.host in {"0.0.0.0", "::"} else args.host

    print("AI Customer Calling Agent - local admin dashboard")
    print(f"Open http://{display_host}:{port}/")
    print(f"Username: {username}")
    if generated:
        print(f"One-time password for this run: {password}")
        print("Set DASHBOARD_PASSWORD to use a fixed password instead.")
    else:
        print("Password: value of DASHBOARD_PASSWORD")
    if args.host not in LOOPBACK_HOSTS:
        print("WARNING: this demo has no TLS and must not be exposed to a network.")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
