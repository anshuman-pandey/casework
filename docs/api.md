# Local prototype API

[← Project](../README.md)

Base URL: `http://127.0.0.1:8080`. Synthetic data only. This single-user prototype has no authentication; native startup binds to loopback and Compose publishes only host loopback. Every mutation requires `Content-Type: application/json`. Browser requests must have a same-origin Origin. The server accepts localhost/127.0.0.1 Host headers only. Do not expose it through a public proxy.

| Method | Path | Result |
|---|---|---|
| GET | `/api/health` | Local-demo health and `temporary`/`persistent` storage mode |
| GET | `/api/demo/scenarios` | Six synthetic scenarios with descriptions and expected checks |
| POST | `/api/demo/scenarios/{scenario}` | Create a fresh sample; send `{}`; `201` returns the complete case |
| GET | `/api/cases` | Up to 500 cases, ordered by source risk descending then creation time descending |
| GET | `/api/cases/{id}` | Case, evidence and chronological events |
| GET | `/api/cases/{id}/export` | Same complete case record as JSON |
| POST | `/api/alerts` | `201` created or `200` idempotent replay |
| POST | `/api/cases/{id}/evaluate` | Deterministic policy evaluation, recorded as an event; send `{}` |
| POST | `/api/cases/{id}/decisions` | Updated case after a valid transition |

## Alert contract

```json
{
  "source_id": "my-detector:alert-123",
  "subject": "Synthetic customer",
  "title": "Unusual transfer pattern",
  "category": "Transaction monitoring",
  "risk": 45,
  "evidence": []
}
```

The four text fields are required, nonblank and limited to 200 characters. `risk` is an integer 0–100. Namespace `source_id` by source yourself; this demo has no tenant/source registry. The SHA-256 of normalized accepted input fields detects conflicting replay. Reordering evidence changes the payload; unknown input fields are ignored and are not preserved. This is not yet a lossless general-purpose importer.

Evidence is a list of at most 30 objects, each with `kind` (`identity`, `transactions` or `screening`), `label`, `source`, `detail` and `observed_at`. All are required. Detail is limited to 4,000 characters; other text to 200. The timestamp must be ISO 8601 with timezone. The server generates evidence IDs and hashes the accepted metadata/content. The source timestamp is caller-supplied and is not independently verified.

Maximum request body: 65,536 bytes. The included evidence model is demonstrative; it cannot represent an arbitrary enterprise investigation yet.

## Decisions

```json
{
  "action": "escalate",
  "version": 1,
  "reason": "Missing source-of-funds evidence; specialist review required."
}
```

Open cases may close or escalate; closed/escalated cases may reopen. Rationale is required and limited to 4,000 characters. `version` must match the latest case. A successful transition increments it. Evaluation events do not increment the case version because they don't change case facts.

Closure requires an evaluation for the current version and rechecks policy eligibility at decision time. All required evidence types must exist; all source observation times must be in the last 24 hours and not in the future; source risk must be below 30. These are **illustrative demo rules, not an AML policy**. High-risk/incomplete cases may escalate. Reopening requires a new evaluation before closure.

Errors use `{"error":"message"}`: `400` invalid payload, `403` host/origin blocked, `404` unknown path/case, `409` stale version/replay/transition conflict, `413` invalid body size, `415` unsupported media type. API stability is not promised before the alpha contract is defined.

Practice scenario IDs are `ready`, `high-risk`, `missing-evidence`, `stale-evidence`, `future-evidence` and `history`. Each call adds a new case and leaves prior work intact. `history` also records an evaluation and closure through the same store operations. Unknown scenario IDs return `404`. These sample-creation endpoints are part of the synthetic sandbox, not a production data ingestion API.
