# Explore every implemented path

[← Project](../README.md) · [API contract](api.md)

Open **Getting started** in the sidebar or **Try a scenario** in the top bar. Each button creates a new synthetic case with a distinct source ID. Existing cases and decisions remain untouched. Observation times are generated when you click; the stale and future examples intentionally deviate from that time.

## First value: a decision you can inspect and export

Choose **Start guided investigation**. Juniper Studio has a profile, a payment extract and a screening fixture. Open each record, read the synthetic content, and inspect its source/time/hash. Click **Run policy check**. All three checks should pass. Click **Record a decision**, write your own rationale, and save it. The guide then offers **Download case record**.

Open the JSON: it includes the original evidence, the evaluation and your actual rationale. Reopen the investigation; its history remains. A new closure requires another evaluation. A passing gate only demonstrates coverage, age and risk rules; it does not establish legitimate activity.

## Deliberately blocked paths

| Sample | Expected checks: coverage / freshness / risk | Task |
|---|---|---|
| Cedar Trading · high risk | Pass / Pass / Fail | Attempt a closure: expect rejection. Cancel the dialog, escalate with a rationale, then inspect Activity. |
| Orchard Supply · missing screening | Fail / Pass / Pass | Identify the absent evidence type before running the check. Closure is blocked even with low source risk. |
| Willow Works · stale screening | Pass / Fail / Pass | Expand Screening snapshot and find the timestamp 48 hours in the past. |
| Birch Systems · future screening | Pass / Fail / Pass | Find the timestamp one hour ahead; this represents a source clock/ingestion problem. |

These intentionally isolate one failed check each. The six original queue fixtures remain available for free exploration. Fresh evidence naturally becomes stale after 24 hours; use a new practice case instead of rewriting old evidence.

## Historical decisions

**Reopen a reviewed case** creates Maple Services and performs real sample ingestion, evaluation and closure through the store. It starts closed with three events. Export it, reopen it with a rationale, and confirm the prior decision remains. The fixture is synthetic; the event history is actually stored, not a decorative activity feed.

## Integration and failure paths

Run `python3 -m casework.verify` against a running sandbox. It adds seven new cases and performs 34 checks: all six scenarios, blocked closure, escalation, reopen, old evaluation rejection, full JSON export, stale decision rejection, idempotent import, conflicting replay and invalid payload rejection. Existing records are untouched. For another port, add `--url http://127.0.0.1:8081`.

Generate your own reproducible fixture:

```sh
python3 -m casework.demo missing-evidence > sample-alert.json
```

Supported generator choices: `ready`, `high-risk`, `missing-evidence`, `stale-evidence`, `future-evidence`. Save once when testing replay; each generator invocation deliberately creates a new source ID. The history scenario requires state transitions and is created through the UI or `/api/demo/scenarios/history`.

The optional [browser test](../tests/browser.cjs) also covers search, empty filters, keyboard commands, case-link copying, browser history, rationale drafts, mobile layout, simulated connection failures, guided completion and literal rendering of HTML-like input. A clean workspace can use `python3 -m casework --empty --db empty-demo.db`.

## What the samples cannot prove

No model is connected. These samples cannot establish false-positive reduction, AML accuracy, agent reliability, sanctions coverage, filing correctness, permission isolation or enterprise throughput. Those capabilities require implementation, domain-specific evaluation datasets and independent review. The samples cover today's implemented surface, not every capability in the roadmap.
