#!/usr/bin/env python3
"""Local Gmail SMTP helper for the PLG dummy. Not used by live MeritEdge.

  cp gst_smtp.env.example gst_smtp.env
  # edit gst_smtp.env
  python3 gst_smtp_server.py

Listens on 127.0.0.1:8766. The dummy HTML POSTs /send-gst after a successful pay.
"""
from __future__ import annotations

import json
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENV_PATH = ROOT / "gst_smtp.env"
HOST = "127.0.0.1"
PORT = 8766


def load_env() -> dict[str, str]:
    data: dict[str, str] = {}
    for key in (
        "GMAIL_USER",
        "GMAIL_APP_PASSWORD",
        "FROM_NAME",
        "FROM_EMAIL",
        "SMTP_HOST",
        "SMTP_PORT",
    ):
        if os.environ.get(key):
            data[key] = os.environ[key].strip()
    if ENV_PATH.exists():
        for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            data.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    data.setdefault("FROM_NAME", "TalentEdge")
    data.setdefault("FROM_EMAIL", data.get("GMAIL_USER", ""))
    data.setdefault("SMTP_HOST", "smtp.gmail.com")
    data.setdefault("SMTP_PORT", "587")
    return data


def send_mail(to_addr: str, subject: str, html: str) -> None:
    cfg = load_env()
    user = cfg.get("GMAIL_USER") or ""
    password = (cfg.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
    if not user or not password:
        raise RuntimeError(
            "Set GMAIL_USER and GMAIL_APP_PASSWORD in prototype/plg/gst_smtp.env"
        )
    if not to_addr or "@" not in to_addr:
        raise ValueError("Missing recipient email")
    from_email = cfg.get("FROM_EMAIL") or user
    from_name = cfg.get("FROM_NAME") or "TalentEdge"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = to_addr
    msg["Reply-To"] = from_email
    msg.attach(MIMEText(html, "html", "utf-8"))
    context = ssl.create_default_context()
    with smtplib.SMTP(cfg["SMTP_HOST"], int(cfg["SMTP_PORT"]), timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()
        smtp.login(user, password)
        smtp.sendmail(user, [to_addr], msg.as_string())


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path.rstrip("/") == "/health":
            cfg = load_env()
            ready = bool(cfg.get("GMAIL_USER") and cfg.get("GMAIL_APP_PASSWORD"))
            self._json(
                200,
                {
                    "ok": True,
                    "ready": ready,
                    "from": cfg.get("FROM_EMAIL") or cfg.get("GMAIL_USER") or "",
                    "user": cfg.get("GMAIL_USER") or "",
                },
            )
            return
        self._json(404, {"ok": False, "error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path.rstrip("/") != "/send-gst":
            self._json(404, {"ok": False, "error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > 400_000:
            self._json(413, {"ok": False, "error": "payload too large"})
            return
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"ok": False, "error": "invalid json"})
            return
        to_addr = str(data.get("to") or "").strip()
        subject = str(data.get("subject") or "GST Invoice").strip()
        html = str(data.get("html") or "")
        try:
            send_mail(to_addr, subject, html)
        except Exception as exc:  # noqa: BLE001 — surface SMTP errors to the dummy
            self._json(500, {"ok": False, "error": str(exc)})
            return
        self._json(200, {"ok": True, "to": to_addr})


def main() -> None:
    cfg = load_env()
    ready = bool(cfg.get("GMAIL_USER") and cfg.get("GMAIL_APP_PASSWORD"))
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"GST Gmail SMTP helper on http://{HOST}:{PORT}")
    print(f"  env file: {ENV_PATH} ({'ready' if ready else 'MISSING credentials'})")
    if not ready:
        print("  Copy gst_smtp.env.example to gst_smtp.env and add a Gmail app password.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
