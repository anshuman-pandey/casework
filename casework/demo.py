"""Fresh, explicitly synthetic scenarios for exploration and integration tests."""
import argparse
from datetime import datetime, timedelta, timezone
import json
from uuid import uuid4

SCENARIOS = [
    {"id": "ready", "title": "Your first investigation", "subject": "Juniper Studio",
     "description": "Inspect three sources, run the checks, record a decision and export the history.",
     "outcome": "All three checks pass; human review is still required.", "checks": [True, True, True]},
    {"id": "high-risk", "title": "Escalate a high-risk alert", "subject": "Cedar Trading",
     "description": "Complete evidence does not override the source risk threshold. Try closing, then escalate.",
     "outcome": "Risk check fails. Closure is blocked; escalation is available.", "checks": [True, True, False]},
    {"id": "missing-evidence", "title": "Find the missing evidence", "subject": "Orchard Supply",
     "description": "A low source risk score is not enough when the screening record is absent.",
     "outcome": "Coverage check fails. Closure is blocked.", "checks": [False, True, True]},
    {"id": "stale-evidence", "title": "Catch an outdated source", "subject": "Willow Works",
     "description": "The screening snapshot is 48 hours old. Inspect its observation time.",
     "outcome": "Freshness check fails. Closure is blocked.", "checks": [True, False, True]},
    {"id": "future-evidence", "title": "Spot a timestamp problem", "subject": "Birch Systems",
     "description": "A source timestamp is one hour in the future, simulating a clock or ingestion error.",
     "outcome": "Freshness check fails. Closure is blocked.", "checks": [True, False, True]},
    {"id": "history", "title": "Reopen a reviewed case", "subject": "Maple Services",
     "description": "Open a case with a recorded evaluation and closure. Reopen it and inspect the retained history.",
     "outcome": "Starts closed. Reopening requires a new evaluation before another closure.", "checks": [True, True, True]},
]


def scenario(key):
    return next((item for item in SCENARIOS if item["id"] == key), None)


def sample_alert(key="ready"):
    item = scenario(key)
    if item is None:
        raise ValueError("Unknown demo scenario")
    at = datetime.now(timezone.utc)
    evidence = [
        {"kind": "identity", "label": "Customer profile", "source": "Synthetic customer ledger",
         "detail": f"{item['subject']} is a fictional design business. Onboarding recorded an expected monthly payment volume of USD 5,000. This fixture is not a verified identity."},
        {"kind": "transactions", "label": "Transaction extract", "source": "Synthetic payment ledger",
         "detail": "Three fictional supplier payments: USD 250, USD 280 and USD 310. The alert was triggered by repeated payments. Compare the amounts with the profile; a matching pattern alone does not establish legitimacy."},
        {"kind": "screening", "label": "Screening snapshot", "source": "Synthetic screening fixture",
         "detail": "Demonstration source record only. No real sanctions or watchlist service was queried. The demo policy checks presence and age, not the truth of this content."},
    ]
    for record in evidence:
        record["observed_at"] = at.isoformat()
    if key == "missing-evidence":
        evidence.pop()
    if key in ("stale-evidence", "future-evidence"):
        evidence[-1]["observed_at"] = (at + timedelta(hours=-48 if key == "stale-evidence" else 1)).isoformat()
    return {"source_id": f"practice-{key}-{uuid4().hex}", "subject": item["subject"],
            "title": "Repeated supplier payments require review", "category": "Transaction monitoring",
            "risk": 89 if key == "high-risk" else 18, "evidence": evidence}


def create_scenario(store, key):
    case_id, _ = store.ingest(sample_alert(key))
    if key == "history":
        store.run_policy(case_id)
        store.decide(case_id, {"action": "close", "version": 1,
                              "reason": "Synthetic walkthrough: reviewed the sample sources and recorded a demonstration decision."})
    return store.get(case_id)


def main():
    parser = argparse.ArgumentParser(description="Print a fresh synthetic alert as JSON. Save it once to test idempotent replay.")
    parser.add_argument("scenario", choices=[s["id"] for s in SCENARIOS if s["id"] != "history"], nargs="?", default="ready")
    print(json.dumps(sample_alert(parser.parse_args().scenario), indent=2))


if __name__ == "__main__":
    main()
