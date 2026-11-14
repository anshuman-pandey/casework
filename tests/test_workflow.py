import copy
import json
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from casework.__main__ import make_handler
from casework.store import Conflict, Store, evaluate, now


def alert(key="alert-1", risk=10):
    return {"source_id": key, "subject": "Synthetic customer", "title": "Synthetic alert",
            "category": "AML", "risk": risk,
            "evidence": [{"kind": kind, "label": kind, "source": "fixture", "detail": "Synthetic only",
                          "observed_at": now()} for kind in ("identity", "transactions", "screening")]}


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "test.db"
        self.store = Store(self.path)
        self.data = alert()
        self.case_id, _ = self.store.ingest(self.data)

    def tearDown(self):
        self.temp.cleanup()

    def test_ingestion_is_idempotent_and_conflicting_replay_is_rejected(self):
        self.assertEqual(self.store.ingest(self.data), (self.case_id, False))
        changed = {**self.data, "risk": 40}
        with self.assertRaises(Conflict):
            self.store.ingest(changed)
        self.assertEqual(len(self.store.get(self.case_id)["events"]), 1)

    def test_parallel_retries_create_only_one_case(self):
        data = alert("parallel")
        with ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(lambda _: self.store.ingest(data), range(12)))
        self.assertEqual(sum(created for _, created in results), 1)
        self.assertEqual(len({case_id for case_id, _ in results}), 1)

    def test_close_requires_evaluation_and_keeps_audit(self):
        decision = {"action": "close", "version": 1, "reason": "Reviewed synthetic evidence"}
        with self.assertRaises(Conflict):
            self.store.decide(self.case_id, decision)
        self.store.run_policy(self.case_id)
        closed = self.store.decide(self.case_id, decision)
        self.assertEqual((closed["status"], closed["version"]), ("closed", 2))
        self.assertEqual(closed["events"][-1]["payload"]["reason"], decision["reason"])
        self.assertEqual(Store(self.path).get(self.case_id), closed)

    def test_concurrent_decisions_reject_lost_update(self):
        def decide(_):
            try:
                self.store.decide(self.case_id, {"action": "escalate", "version": 1, "reason": "Review needed"})
                return "success"
            except Conflict:
                return "conflict"
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertCountEqual(list(pool.map(decide, range(2))), ["success", "conflict"])
        self.assertEqual(len(self.store.get(self.case_id)["events"]), 2)

    def test_reopen_invalidates_old_evaluation(self):
        self.store.run_policy(self.case_id)
        self.store.decide(self.case_id, {"action": "close", "version": 1, "reason": "Reviewed"})
        self.store.decide(self.case_id, {"action": "reopen", "version": 2, "reason": "New concern"})
        with self.assertRaises(Conflict):
            self.store.decide(self.case_id, {"action": "close", "version": 3, "reason": "Old evaluation"})

    def test_high_risk_and_incomplete_cases_cannot_close(self):
        for data in (alert("high", 90), {**alert("missing"), "evidence": []}):
            case_id, _ = self.store.ingest(data)
            self.store.run_policy(case_id)
            with self.assertRaises(Conflict):
                self.store.decide(case_id, {"action": "close", "version": 1, "reason": "Try closure"})

    def test_stale_future_and_wrong_type_evidence_blocks(self):
        case = self.store.get(self.case_id)
        at = datetime.now(timezone.utc)
        for offset in (-25, 1):
            changed = copy.deepcopy(case)
            changed["evidence"][0]["observed_at"] = (at + timedelta(hours=offset)).isoformat()
            self.assertEqual(evaluate(changed, at)["recommendation"], "investigate")
        changed = copy.deepcopy(case)
        changed["evidence"][2]["kind"] = "identity"
        self.assertEqual(evaluate(changed, at)["recommendation"], "investigate")

    def test_closure_rechecks_freshness_after_recorded_evaluation(self):
        self.store.run_policy(self.case_id)
        with self.store.connect() as db:
            evidence = self.store.get(self.case_id)["evidence"]
            evidence[0]["observed_at"] = "2020-01-01T00:00:00+00:00"
            db.execute("UPDATE cases SET evidence=? WHERE id=?", (json.dumps(evidence), self.case_id))
        with self.assertRaises(Conflict):
            self.store.decide(self.case_id, {"action": "close", "version": 1, "reason": "Stale evidence"})

    def test_validation_rejects_bad_types_and_naive_dates(self):
        invalid = [None, [], {**alert(), "risk": True}, {**alert(), "risk": 101}, {**alert(), "subject": " "}]
        bad_date = alert(); bad_date["evidence"][0]["observed_at"] = "2026-11-14"
        invalid.append(bad_date)
        for data in invalid:
            with self.subTest(data=data):
                with self.assertRaises(ValueError):
                    self.store.ingest(data)
        self.assertEqual(len(self.store.list()), 1)

    def test_failed_transition_has_no_audit_or_state_side_effect(self):
        before = self.store.get(self.case_id)
        with self.assertRaises(Conflict):
            self.store.decide(self.case_id, {"action": "reopen", "version": 1, "reason": "Invalid"})
        self.assertEqual(self.store.get(self.case_id), before)


class HTTPTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.temp.name) / "http.db")
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.store))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown(); self.server.server_close(); self.thread.join()
        self.temp.cleanup()

    def request(self, path, data=None, headers=None):
        request = Request(self.base + path, data=json.dumps(data).encode() if data is not None else None,
                          headers={"Content-Type": "application/json", **(headers or {})})
        try:
            with urlopen(request, timeout=5) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    def test_http_workflow_and_export(self):
        code, created = self.request('/api/alerts', alert())
        self.assertEqual(code, 201)
        prefix = '/api/cases/' + created['id']
        self.assertEqual(self.request(prefix + '/evaluate', {})[0], 200)
        code, case = self.request(prefix + '/decisions', {"action": "close", "version": 1, "reason": "Reviewed fixtures"})
        self.assertEqual(code, 200)
        self.assertEqual(self.request(prefix + '/export'), (200, case))
        self.assertEqual(self.request(prefix + '/decisions', {"action": "close", "version": 1, "reason": "stale"})[0], 409)

    def test_cross_origin_and_rebinding_requests_rejected(self):
        self.assertEqual(self.request('/api/alerts', alert(), {"Origin": "https://untrusted.example"})[0], 403)
        self.assertEqual(self.request('/api/cases', headers={"Host": "untrusted.example"})[0], 403)

    def test_invalid_payload_and_missing_case(self):
        self.assertEqual(self.request('/api/alerts', {"risk": "high"})[0], 400)
        self.assertEqual(self.request('/api/cases/absent')[0], 404)
        self.assertEqual(self.request('/api/alerts', alert(), {"Content-Type": "text/plain"})[0], 415)


if __name__ == '__main__':
    unittest.main()
