# The first useful outcome

[← Project](../README.md)

A new evaluator should reach this conclusion through their own actions: **“I can inspect why an alert exists, make a justified decision, and take the whole record with me.”** Opening a dashboard or seeing a fabricated AI conclusion does not count as activation.

## Lessons applied

| Source | Lesson | Implemented response |
|---|---|---|
| [Notion's design thinking behind AI](https://www.notion.com/blog/the-design-thinking-behind-notion-ai) | Flexible tools need useful defaults and assistance in context. | A complete investigation is one button away. Guidance sits beside the actual case and changes with its recorded state. |
| [Linear's invisible details](https://linear.app/now/invisible-details) | Repeated small interaction costs matter. | Keyboard commands, visible alternatives, persistent case links and preserved rationale drafts. |
| [n8n's Docker Compose installation guide](https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose.md), read 14 November 2026 | Name prerequisites, distinguish test and production environments, persist data explicitly, and verify health after startup. | One supplied Compose file, a named volume, a health check, a private hosting path, and tests that recreate the container and compare complete records. This is a deployment lesson, not a license or feature comparison. |

## The shortest useful path

Open the public demo → one fresh investigation → open decision → Tab to accept the sample rationale → record → export. No registration, provider key, schema design, connector installation or configuration wizard comes before that outcome.

The first-run screen provides one recommended action, with separate sample paths for blockers. Each sample has a stated expected outcome. New samples preserve existing work. `--demo` offers a disposable workspace; persistent native and Docker modes are separate and clearly named.

## Requirements for a successful evaluator

| Person / context | What they need | Current support / remaining constraint |
|---|---|---|
| Non-developer investigator | A running sandbox, readable sample evidence and a clear next step | Guided case and scenario descriptions are implemented. A public browser-local demo requires no setup; self-hosting remains a separate path. |
| Developer without Docker | Python 3.12+, a writable folder and a free port | No Python packages, Node build or external database required. Windows launcher instructions are included. Windows/macOS have not been tested directly in this environment. |
| Developer who prefers containers | Docker Engine/Desktop and Compose v2.20+ | One build/start command; no host Python dependency. First build needs internet access for the base image. |
| Private server evaluator | An SSH account and a tunnel to the server's loopback port | Supported for synthetic single-user evaluation. No public port or reverse proxy is needed. |
| Integrator | An alert contract and reproducible examples | Fresh JSON generator, API guide and 34-check verification command. CSV and vendor connectors are not implemented. |
| Maintainer | Reproducible checks, feedback, versioned source and a recovery path | Python, browser and Docker checks; issue templates; Git releases and hosting instructions. |
| Real operational team | Authentication, permissions, secure deployment, managed evidence and proven recovery | **Not supported by this preview.** Production prerequisites are explicit in the hosting and architecture documents. |

## Acceptance targets, not measured adoption claims

- With prerequisites installed, an uncoached evaluator should reach the application within five minutes. Record download/build time separately.
- From the first screen, they should produce a recorded decision and export within three minutes, without reading repository internals.
- They should explain why a deliberately blocked case cannot close and recover from a failed action without assistance.
- A developer should import and replay a synthetic alert within ten minutes using the documented contract.
- A restart must preserve every complete case record in persistent mode; starting fresh practice must not destroy existing work.

Only the last technical guarantees are covered by automated checks today. The human time targets need observed trials; there is no adoption benchmark or user-study result yet. We collect no telemetry by default.

## A useful first contribution

Give a collaborator the public repo link and these tasks without a live walkthrough:

1. Open the live demo, then try self-hosting using the README. Record OS, chosen path, elapsed time and the first point of confusion.
2. Complete the guided case, export it and explain what the policy did and did not establish.
3. Find and escalate a blocked case. Explain the blocker in their own words.
4. Restart their persistent workspace and locate the same decision.
5. Import a synthetic alert, replay it and confirm that it did not duplicate.

Use the **First-run feedback** issue form: record completion, hesitation, missing information and expected versus actual behavior. Do not include real customer data. Prefer one concrete improvement per PR. Public forks and PRs do not require a collaborator invitation; direct write access is a separate maintainer decision.
