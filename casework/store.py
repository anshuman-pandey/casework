"""Transactional case storage and deliberately small, deterministic demo policy."""
from contextlib import contextmanager
import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from uuid import uuid4

POLICY = "demo-evidence-v1"


class Conflict(ValueError):
    pass


def now():
    return datetime.now(timezone.utc).isoformat()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def required_text(data, key, limit=200):
    value = data.get(key)
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError(f"{key} must be nonempty text, at most {limit} characters")
    return value.strip()


def validate_alert(data):
    if not isinstance(data, dict):
        raise ValueError("Expected a JSON object")
    result = {key: required_text(data, key) for key in ("source_id", "subject", "title", "category")}
    risk = data.get("risk")
    if type(risk) is not int or not 0 <= risk <= 100:
        raise ValueError("risk must be an integer from 0 to 100")
    result["risk"] = risk
    evidence = data.get("evidence", [])
    if not isinstance(evidence, list) or len(evidence) > 30:
        raise ValueError("evidence must be a list of at most 30 items")
    result["evidence"] = []
    for item in evidence:
        if not isinstance(item, dict):
            raise ValueError("Each evidence item must be an object")
        entry = {key: required_text(item, key, 4000 if key == "detail" else 200)
                 for key in ("label", "source", "detail", "observed_at")}
        try:
            observed = datetime.fromisoformat(entry["observed_at"])
            if observed.tzinfo is None or observed.utcoffset() is None:
                raise ValueError()
        except ValueError as exc:
            raise ValueError("observed_at must be an ISO timestamp with timezone") from exc
        if item.get("kind") not in ("identity", "transactions", "screening"):
            raise ValueError("evidence kind must be identity, transactions or screening")
        entry["kind"] = item["kind"]
        result["evidence"].append(entry)
    return result


def evaluate(case, at=None):
    """Illustrative eligibility only. Never infer innocence from narrative text."""
    at = at or datetime.now(timezone.utc)
    evidence = case["evidence"]
    kinds = {item["kind"] for item in evidence}
    complete = {"identity", "transactions", "screening"} <= kinds
    fresh = bool(evidence) and all(
        0 <= (at - datetime.fromisoformat(item["observed_at"])).total_seconds() <= 86400
        for item in evidence
    )
    checks = [
        {"label": "All three required evidence types present", "passed": complete},
        {"label": "Evidence observed within the last 24 hours", "passed": fresh},
        {"label": "Source risk score below demo threshold of 30", "passed": case["risk"] < 30},
    ]
    eligible = all(item["passed"] for item in checks)
    return {"policy": POLICY, "mode": "deterministic-demo", "case_version": case["version"],
            "evaluated_at": at.isoformat(), "checks": checks,
            "recommendation": "review_for_closure" if eligible else "investigate",
            "evidence_ids": [item["id"] for item in evidence],
            "explanation": "Eligibility demonstration only. Evidence content has not been verified. Human review is required."}


class Store:
    def __init__(self, path):
        self.path = str(path)
        with self.connect() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS cases (
                    id TEXT PRIMARY KEY, source_id TEXT NOT NULL UNIQUE,
                    payload_hash TEXT NOT NULL, subject TEXT NOT NULL,
                    title TEXT NOT NULL, category TEXT NOT NULL, risk INTEGER NOT NULL,
                    status TEXT NOT NULL, version INTEGER NOT NULL, created_at TEXT NOT NULL,
                    evidence TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS events (
                    seq INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL,
                    kind TEXT NOT NULL, at TEXT NOT NULL, payload TEXT NOT NULL,
                    FOREIGN KEY(case_id) REFERENCES cases(id));
                CREATE INDEX IF NOT EXISTS case_queue ON cases(status, risk DESC);
                CREATE INDEX IF NOT EXISTS case_events ON events(case_id, seq);
            """)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def event(self, db, case_id, kind, payload):
        db.execute("INSERT INTO events(case_id,kind,at,payload) VALUES (?,?,?,?)",
                   (case_id, kind, now(), canonical(payload)))

    def ingest(self, data):
        data = validate_alert(data)
        digest = hashlib.sha256(canonical(data).encode()).hexdigest()
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            previous = db.execute("SELECT id,payload_hash FROM cases WHERE source_id=?", (data["source_id"],)).fetchone()
            if previous:
                if previous["payload_hash"] != digest:
                    raise Conflict("source_id already exists with different content")
                return previous["id"], False
            case_id = "CW-" + uuid4().hex[:10].upper()
            evidence = []
            for item in data["evidence"]:
                evidence.append({**item, "id": "EV-" + uuid4().hex[:10],
                                 "sha256": hashlib.sha256(canonical(item).encode()).hexdigest()})
            db.execute("INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                       (case_id, data["source_id"], digest, data["subject"], data["title"],
                        data["category"], data["risk"], "open", 1, now(), canonical(evidence)))
            self.event(db, case_id, "ingested", {"source_id": data["source_id"], "actor": "local-demo"})
        return case_id, True

    def _get(self, db, case_id):
        row = db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone()
        if row is None:
            raise KeyError(case_id)
        case = dict(row)
        case["evidence"] = json.loads(case["evidence"])
        case["events"] = [{**dict(event), "payload": json.loads(event["payload"])} for event in
                          db.execute("SELECT * FROM events WHERE case_id=? ORDER BY seq", (case_id,))]
        return case

    def get(self, case_id):
        with self.connect() as db:
            return self._get(db, case_id)

    def list(self):
        with self.connect() as db:
            return [dict(row) for row in db.execute(
                "SELECT id,subject,title,category,risk,status,version,created_at FROM cases ORDER BY risk DESC,created_at DESC LIMIT 500")]

    def run_policy(self, case_id):
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            case = self._get(db, case_id)
            if case["status"] != "open":
                raise Conflict("Reopen the case before evaluating")
            result = evaluate(case)
            self.event(db, case_id, "policy_evaluated", result)
        return result

    def decide(self, case_id, data):
        if not isinstance(data, dict):
            raise ValueError("Expected a JSON object")
        action = data.get("action")
        if action not in ("close", "escalate", "reopen"):
            raise ValueError("action must be close, escalate or reopen")
        reason = required_text(data, "reason", 4000)
        if type(data.get("version")) is not int:
            raise ValueError("version must be an integer")
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            case = self._get(db, case_id)
            if case["version"] != data["version"]:
                raise Conflict("Case changed. Refresh before deciding.")
            if (action == "reopen") == (case["status"] == "open"):
                raise Conflict("Transition is not allowed from the current status")
            if action == "close":
                evaluations = [e for e in case["events"] if e["kind"] == "policy_evaluated"
                               and e["payload"]["case_version"] == case["version"]]
                if not evaluations:
                    raise Conflict("Run the policy evaluation before closing")
                if not all(c["passed"] for c in evaluate(case)["checks"]):
                    raise Conflict("Demo closure gate blocked. Investigate or escalate this case.")
            status = {"close": "closed", "escalate": "escalated", "reopen": "open"}[action]
            db.execute("UPDATE cases SET status=?,version=version+1 WHERE id=?", (status, case_id))
            self.event(db, case_id, action, {"reason": reason, "actor": "local-demo",
                                           "from_version": case["version"], "policy": POLICY})
        return self.get(case_id)
