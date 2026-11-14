# An investigation workspace you can own

[← Project](../README.md) · [Research](research/landscape.md) · [Architecture](architecture.md)

**Casework is a working name, not a cleared brand.** This document defines the intended product. The README is the source of truth for what runs today.

## The first ten minutes

A developer starts a local instance with synthetic cases. An investigator opens an alert and sees why it fired, what evidence is present, and what is missing. They run a policy evaluation, inspect each reason, record a disposition, and export a complete record. No model key, signup, paid dataset, or vendor call should be needed to understand the product.

The next milestone is connecting a real source in a sandbox: validate schema, preview mappings, import with reconciliation, inspect failures, then replay without duplication. A successful demo is not a successful integration; measure both.

## The workspace

Use three stable areas: a queue for selecting work, the investigation record, and the evidence/decision panel. Keep risk, urgency, and confidence distinct. Dense information should remain legible; muted colors support hierarchy, while red and amber communicate actual risk or blockers. Keyboard focus, accessible labels, responsive layouts, and useful empty/error states are release requirements.

| Surface | Job | Completion criterion |
|---|---|---|
| Inbox | Find the next most important investigation | Saved views, typed filters, SLA ordering, ownership and visible reasons for priority |
| Case | Understand the subject and triggering activity | Linked alerts, subjects, timeline, amounts/currency, evidence snapshots and missing-data indicators |
| Evidence | Check a claim without hunting | Source, timestamp, content hash, access classification and exact citation target |
| Decision | Record a defensible disposition | Allowed transition, rationale, required evidence and reviewer identity validated on the server |
| Automation | Understand work delegated to agents | Run state, input snapshot, policy/model/tool versions, sources, errors, cost and proposed actions |
| Quality | Detect harmful speedups | Reopened cases, sampled closure errors, overrides, missed-risk estimates and reviewer agreement |
| Configuration | Adapt without a private fork | Versioned case schemas, forms, workflows, queues and policies with validation and rollback |
| Operations | Keep the service healthy | Ingestion lag, failed jobs, backup/restore status, storage and upgrade readiness |

## A case is a record of work, not a ticket

Model alerts separately from cases. Many alerts can belong to one investigation; related cases can retain separate jurisdiction, access, and filing obligations. Entity relationships are evidence-backed, not guessed from names. Preserve original IDs when importing. A decision has a reason, actor, policy version, evidence set and timestamp. Reopening creates a new event instead of erasing the prior decision.

Custom fields have types, validation, search semantics and migration rules. Persisted case forms refer to their schema version. Financial amounts use integer minor units plus currency; do not sum different currencies without an explicit rate and timestamp. All timestamps store UTC; render local time with an inspectable UTC value.

## Automation that can earn trust

The goal is policy-bounded auto-resolution, not an LLM with a close-case button. Use deterministic code for arithmetic, eligibility, permissions, deadlines and state transitions. Use models for evidence extraction, research planning, grounded synthesis and identifying contradictions.

1. **Observe:** run on historical or shadow traffic; change no case decisions.
2. **Recommend:** produce structured findings with evidence IDs and explicit unknowns.
3. **Approve:** an authorized reviewer accepts or edits a proposed action.
4. **Auto-resolve:** an explicitly enabled policy acts only on a validated narrow cohort; enforce sampling, stop conditions and a kill switch.

A production run must pin the case version and evidence snapshot. Record the model identifier, prompt/template hash, tool versions, policy version, actual outputs and costs. A model upgrade invalidates prior evaluation approval until checked. Exact LLM regeneration is not guaranteed; replay should recover the original recorded execution as well as support a new comparison run.

Retrieved documents are untrusted data. Instructions inside evidence never authorize tools. Read tools and action tools use different credentials. Network destinations and tools are allowlisted; budgets and timeouts are enforced outside the model. Redact sensitive fields before external inference according to tenant policy. Don't place cross-tenant evidence in a shared retrieval context.

Missing, stale, conflicting or unauthorized evidence blocks auto-resolution. Failure is an explicit result, not a benign finding. Confidence alone never authorizes closure. Filing a SAR, restricting an account, contacting a customer and closing an internal alert are separate capabilities with separate approval policies.

The included prototype demonstrates **deterministic policy evaluation only**. It is not an AI investigator and does not validate any real AML strategy.

## Measure false positives honestly

Distinguish duplicate ingestion, analyst workload reduction, benign disposition rate, and true detection false-positive rate. Deduplicating retransmissions is not reducing false positives. Closing more cases is not evidence of better detection.

For each typology/cohort, evaluate precision, estimated missed-risk rate, override rate, evidence completeness and time to final decision. Use independent adjudication, temporal holdouts and delayed outcomes where available. Sample auto-closed cases and unresolved cases to reduce selection bias. Preserve uncertainty and confidence intervals. Compare at matched detection coverage; do not optimize away difficult cases to improve throughput.

A proposed launch gate: no material degradation in the compliance team's agreed missed-risk bound; improved median handling time; every material narrative claim linked to evidence; no unauthorized actions in adversarial tests. Exact risk tolerances must be set with design partners. No universal numeric false-positive promise belongs in the README.

## Adoption is a product requirement

| Audience | Path to value | What must stay free |
|---|---|---|
| Five-person fintech | Local demo → one alert source → a small production instance | Core workflows, full APIs, exports, authentication, audit and backup |
| Growing risk team | Queues, QA, role separation, versioned templates and connectors | The same product, including SSO and authorization when shipped |
| Large enterprise | Private deployment, tenant isolation, identity lifecycle, regional controls and operational evidence | The same code and feature rights; support and hosting can be optional services |

**Distribution:** one reproducible release, signed artifacts and SBOM, clear compatibility policy, demo fixtures, a five-minute tour, API examples, migration recipes and searchable documentation. No required telemetry. Publish operational costs and performance methodology. Do not publish invented customer logos, stars, uptime, compliance badges or throughput numbers.

**Customization:** start with declarative JSON schemas and policy configuration; add a visual editor over the same representation after the semantics stabilize. Extensions run out of process through versioned APIs. Avoid arbitrary uploaded code in the core service.

**Migration:** import into a staging space; map types and IDs; generate counts/hashes and rejected-row reports; preserve source provenance; compare exported records; dual-run; cut over a cohort; keep rollback/export available. Never require replacement of the detection engine.

**Community:** Apache-2.0, contribution guide, public decision records, documented release ownership and issue triage. No contributor copyright transfer requirement. Sustainability should come from optional support, hosting, grants or sponsorship—not removing essential security controls from the free distribution.

## Delivery sequence and exit gates

| Stage | Deliverable | Exit gate |
|---|---|---|
| **0 · This repository** | Sourced research; runnable local workflow; persistent cases, evidence, evaluation, decision and export | Tests pass; screenshots reflect running software; limitations explicit |
| **1 · Design-partner alpha** | PostgreSQL, authenticated users, RBAC, generic ingestion, case forms, audit, attachments, backup/restore and import tooling | Three design partners complete a real sandbox workflow; isolation and restore tests pass |
| **2 · Assisted investigation** | Model adapters, durable runs, grounded narratives, enrichment contracts and approval UI | Held-out evaluation, injection tests, budget limits and reproducible run records reviewed |
| **3 · Limited autonomy** | Shadow comparison, cohort policy, sampling, stop conditions, idempotent actions | Agreed risk gates met over representative live-shadow traffic; kill switch and recovery demonstrated |
| **4 · Enterprise readiness** | SSO/SCIM, regional deployment, finer permissions, legal holds, HA and operational runbooks | Independent security review; load, migration, failover and restore exercises on target topology |

These are gates, not calendar promises. Agent work and platform hardening need separate milestones. Don't add ten connectors before one complete integration is maintainable. Don't add Kubernetes, a graph database or a vector store until a measured requirement justifies them.

## What we deliberately do not claim

This prototype is not production-safe, regulatory-certified, enterprise-scale, connected to real screening providers, or a replacement for specialist detection and filing services. The business proposition is free software with clear operational costs, not zero-cost compliance.

For US SAR workflows, accurate narrative and retained supporting evidence are important design inputs; jurisdiction-specific obligations must be verified when implementing a filing pack. See [FinCEN narrative guidance](https://www.fincen.gov/resources/statutes-regulations/guidance/suggestions-addressing-common-errors-noted-suspicious) and [supporting-documentation guidance](https://www.fincen.gov/resources/statutes-regulations/guidance/suspicious-activity-report-supporting-documentation). No filing integration is included today.
