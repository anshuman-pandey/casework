"""Run with python3 -m casework. Local synthetic-data evaluation only."""
import argparse
import json
import os
import signal
import sqlite3
import tempfile
from contextlib import ExitStack
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from .store import Conflict, Store, now
from .demo import SCENARIOS, create_scenario, scenario

WEB = Path(__file__).parent / "web"


def seed(store):
    if store.list():
        return
    examples = [
        ("Northstar Trading", "Rapid movement across new counterparties", "Transaction monitoring", 89, 3),
        ("Maya Chen", "Payment velocity above expected activity", "Fraud review", 67, 2),
        ("Atlas Studio", "Recurring supplier payment flagged", "Transaction monitoring", 18, 3),
        ("Harbor Logistics", "Customer profile needs additional evidence", "Customer review", 44, 1),
        ("Luca Moretti", "Name similarity requires a closer look", "Screening review", 52, 2),
        ("Fieldnote Design", "Known recurring invoice pattern", "Transaction monitoring", 12, 3),
    ]
    for index, (subject, title, category, risk, count) in enumerate(examples):
        evidence = [
            {"kind": "identity", "label": "Customer profile", "source": "Synthetic customer ledger",
             "detail": f"Synthetic profile for {subject}. This is a demonstration record, not a verified identity."},
            {"kind": "transactions", "label": "Transaction extract", "source": "Synthetic payment ledger",
             "detail": "Three example payments: USD 250.00, USD 280.00, USD 310.00. Illustrative records only."},
            {"kind": "screening", "label": "Screening snapshot", "source": "Synthetic screening fixture",
             "detail": "A fixture representing the presence of a screening result. No real sanctions database has been queried."},
        ][:count]
        store.ingest({"source_id": f"demo-{index}", "subject": subject, "title": title,
                      "category": category, "risk": risk,
                      "evidence": [{**item, "observed_at": now()} for item in evidence]})


def make_handler(store, temporary=False):
    class Handler(BaseHTTPRequestHandler):
        def send(self, status, body, content_type="application/json"):
            raw = json.dumps(body, allow_nan=False).encode() if content_type == "application/json" else body
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'")
            self.end_headers()
            self.wfile.write(raw)

        def allowed_host(self):
            return self.headers.get("Host") in (f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}")

        def do_GET(self):
            if not self.allowed_host():
                return self.send(403, {"error": "Loopback host required"})
            path = urlparse(self.path).path
            try:
                if path == "/api/cases":
                    return self.send(200, {"cases": store.list(), "limit": 500})
                if path == "/api/health":
                    return self.send(200, {"status": "ok", "mode": "local-demo", "storage": "temporary" if temporary else "persistent"})
                if path == "/api/demo/scenarios":
                    return self.send(200, {"scenarios": SCENARIOS})
                parts = path.strip("/").split("/")
                if len(parts) in (3, 4) and parts[:2] == ["api", "cases"]:
                    if len(parts) == 4 and parts[3] != "export":
                        return self.send(404, {"error": "Not found"})
                    return self.send(200, store.get(parts[2]))
                assets = {"/": ("index.html", "text/html; charset=utf-8"),
                          "/app.js": ("app.js", "text/javascript; charset=utf-8"),
                          "/theme.js": ("theme.js", "text/javascript; charset=utf-8"),
                          "/style.css": ("style.css", "text/css; charset=utf-8"),
                          "/fonts/InterVariable.woff2": ("fonts/InterVariable.woff2", "font/woff2")}
                if path in assets:
                    filename, content_type = assets[path]
                    return self.send(200, (WEB / filename).read_bytes(), content_type)
                self.send(404, {"error": "Not found"})
            except KeyError:
                self.send(404, {"error": "Case not found"})

        def do_POST(self):
            if not self.allowed_host():
                return self.send(403, {"error": "Loopback host required"})
            origin = self.headers.get("Origin")
            if origin and origin not in (f"http://127.0.0.1:{self.server.server_port}", f"http://localhost:{self.server.server_port}"):
                return self.send(403, {"error": "Cross-origin requests are not allowed"})
            if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                return self.send(415, {"error": "Use application/json"})
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= 65536:
                    return self.send(413, {"error": "Body must be 1–65536 bytes"})
                data = json.loads(self.rfile.read(length))
                parts = urlparse(self.path).path.strip("/").split("/")
                if len(parts) == 4 and parts[:3] == ["api", "demo", "scenarios"]:
                    if scenario(parts[3]) is None:
                        return self.send(404, {"error": "Unknown demo scenario"})
                    return self.send(201, create_scenario(store, parts[3]))
                if parts == ["api", "alerts"]:
                    case_id, created = store.ingest(data)
                    return self.send(201 if created else 200, {"id": case_id, "created": created})
                if len(parts) == 4 and parts[:2] == ["api", "cases"]:
                    if parts[3] == "evaluate":
                        return self.send(200, store.run_policy(parts[2]))
                    if parts[3] == "decisions":
                        return self.send(200, store.decide(parts[2], data))
                self.send(404, {"error": "Not found"})
            except Conflict as exc:
                self.send(409, {"error": str(exc)})
            except (ValueError, UnicodeDecodeError) as exc:
                self.send(400, {"error": str(exc)})
            except KeyError:
                self.send(404, {"error": "Case not found"})

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    storage = parser.add_mutually_exclusive_group()
    storage.add_argument("--db", help="Persistent database path (default: casework.db)")
    storage.add_argument("--demo", action="store_true", help="Use a disposable sample workspace; leave existing data untouched")
    parser.add_argument("--port", type=int, default=os.environ.get("CASEWORK_PORT", "8080"))
    parser.add_argument("--host", choices=("127.0.0.1", "0.0.0.0"), default="127.0.0.1",
                        help="Use 0.0.0.0 only inside a container with a loopback-published port")
    parser.add_argument("--empty", action="store_true", help="Skip synthetic seed cases")
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error("port must be between 0 and 65535")
    def stop(signum, frame):
        raise KeyboardInterrupt
    signal.signal(signal.SIGTERM, stop)
    with ExitStack() as stack:
        path = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix="casework-demo-"))) / "demo.db" if args.demo else Path(args.db or "casework.db")
        try:
            store = Store(path)
            if not args.empty:
                seed(store)
            server = ThreadingHTTPServer((args.host, args.port), make_handler(store, args.demo))
        except (OSError, sqlite3.Error) as error:
            parser.exit(1, f"Could not start Casework: {error}\nCheck the writable database directory and whether the port is available. Try --port 8081.\n")
        print(f"Casework local demo: http://127.0.0.1:{server.server_port} — synthetic data only", flush=True)
        print("Open Getting started to launch a fresh guided investigation.", flush=True)
        print("Disposable workspace: data is removed when this process stops." if args.demo else f"Database: {path.resolve()} (kept across restarts)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == "__main__":
    main()
