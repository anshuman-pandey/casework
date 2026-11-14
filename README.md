<div align="center">

![Casework — every decision, with its evidence](docs/assets/banner.svg)

### Open-source AML case management and fraud investigation

Start with a complete sample case. Keep the evidence, decision and history together.

**Apache-2.0** · **Developer preview** · **Python or Docker** · **No model key required**

[**Try the live demo →**](https://casework-live.sunshinevendetta.chatgpt.site) · [Download ZIP](https://github.com/anshuman-pandey/casework/archive/refs/heads/main.zip) · [Self-host](docs/self-hosting.md) · [Scenarios](docs/scenarios.md) · [Contribute](CONTRIBUTING.md)

</div>

> This is a working **single-user sandbox for synthetic data**. Model-backed agents, team authentication and enterprise operations are on the roadmap. Use synthetic data only. The Python server is for private evaluation; the public demo runs entirely in your browser.


## A complete investigation. No setup.

[**Open the practice workspace →**](https://casework-live.sunshinevendetta.chatgpt.site)

Start a guided case, inspect its sources, record your decision and download the evidence trail. Add your business name and logo if you like—no branding wizard stands between you and the workflow. No account or API key required.

Practice records stay in your browser session. The demo uses the same interface as the self-hosted app, with browser-local storage instead of SQLite. [Demo details and limits](docs/live-demo.md).

## Your first investigation

With **Python 3.12+** installed:

```sh
git clone https://github.com/anshuman-pandey/casework.git
cd casework
python3 -m casework --demo
```

Or [download and extract the ZIP](https://github.com/anshuman-pandey/casework/archive/refs/heads/main.zip), open a terminal in the extracted folder, and run the last command. On Windows, use `py -3 -m casework --demo`.

Open **http://127.0.0.1:8080** and click **Start guided investigation**.

1. **Inspect** the synthetic profile, payments and screening snapshot.
2. **Run the policy check** to see the three eligibility checks.
3. **Record a decision** with your own rationale.
4. **Download the case record**: evidence, evaluation and decision history in one JSON file.

That is the first useful outcome: a reviewable case decision you can take with you. Reopen the case and see that the earlier history remains.

No account, package installation, external database or API key is required. `--demo` creates a disposable workspace; stopping the process removes that workspace and leaves existing databases untouched. To keep your work across restarts, use `python3 -m casework` without `--demo`.

![Getting started: one guided investigation and five additional sample paths](docs/assets/demo-start.png)

## Prefer Docker?

From the repository folder, with Docker Engine/Desktop and **Compose v2.20+**:

```sh
docker compose up -d --build --wait
```

Open **http://127.0.0.1:8080**. The database lives in a named Docker volume and survives container recreation. `docker compose down` stops the app and keeps the data. No Python installation is needed on your host.

[Self-hosting guide](docs/self-hosting.md): prerequisites, another port, a private server over SSH, persistence, backup, troubleshooting and production requirements. The application port is published to **127.0.0.1 only**.

## Sample data that teaches the workflow

Six investigations are preloaded. **Getting started** also creates fresh, independent scenarios whenever you need them; it never resets your existing work.

| Scenario | What you can verify |
|---|---|
| Your first investigation | Inspect → evaluate → close with rationale → export → reopen |
| High source risk | Complete evidence still cannot bypass the risk gate; escalate instead |
| Missing evidence | Low risk does not substitute for the missing screening record |
| Stale evidence | A 48-hour-old source fails the 24-hour freshness check |
| Future evidence | A timestamp one hour ahead fails the same freshness check |
| Reviewed history | Reopen a closed fixture; prior decisions remain and another closure needs a new evaluation |

These cover the **implemented workflow**, including blocked paths. They do not simulate an AI agent, a sanctions provider or a regulatory filing system. [Scenario walkthroughs](docs/scenarios.md) include expected outcomes and developer replay tests.

## Designed for daily work

Notion and Linear are our explicit quality references: a readable case document, quiet navigation, consistent controls and fast keyboard interaction. [Our design standard](docs/design.md) links the primary research and the rules we apply.

Use **Ctrl/Cmd+K** for cases and commands, **/** for queue search, and **J/K** for case navigation. Copy case links, use browser Back/Forward, inspect evidence without losing expansion state, and keep rationale drafts during the session. Light/dark appearance is remembered locally. Fonts and icons are bundled; the application does not call a CDN or send telemetry.

![Casework investigation workspace](docs/assets/demo-case.png)

[Dark appearance](docs/assets/demo-dark.png) · [Mobile layout](docs/assets/demo-mobile.png) · [Command menu](docs/assets/commands.png)

## What works, and what comes next

| Available in this preview | Still to build |
|---|---|
| Public browser demo, optional branding, Python and Docker setup | Authenticated teams, RBAC, SSO and tenant isolation |
| Cases, evidence, search and status filters over the first 500 cases | Paginated search, saved views, SLAs and assignment |
| JSON ingestion with idempotent source IDs | CSV migration, connectors and reconciliation |
| Deterministic, versioned policy evaluation | Model-backed investigation with cited findings |
| Close, escalate and reopen with rationale | Governed autonomous resolution and external actions |
| Atomic decisions and application event history | Independent audit integrity, retention and legal holds |
| Portable JSON case exports | Regulatory filing packs and managed attachments |
| Browser workflow checks and container recovery checks | Enterprise load testing and a full accessibility audit |

The original code is **Apache-2.0**, with no feature keys or per-seat limits. Security and enterprise controls belong in the free distribution when implemented. Infrastructure, licensed datasets and optional model inference can still cost money. “Casework” remains a provisional product name.

## Bring in a synthetic alert

Generate a complete alert with fresh timestamps, save it once, and send it to the running app:

```sh
python3 -m casework.demo ready > sample-alert.json
curl http://127.0.0.1:8080/api/alerts \
  -H 'Content-Type: application/json' \
  --data-binary @sample-alert.json
```

Replay the same file and the original case ID is returned. Reuse that source ID with changed content and the API returns `409`. The static [minimal example](examples/alert.json) intentionally contains no evidence, so it imports but cannot close. [API contract →](docs/api.md)

To exercise every scenario and the import/replay path against a running sandbox:

```sh
python3 -m casework.verify
```

This adds seven synthetic cases and checks **34 outcomes**. It does not modify pre-existing cases. Inside Docker, use `docker compose exec casework python3 -m casework.verify` (add `--url` when using a different port).

## Build with us

[Contributor guide](CONTRIBUTING.md) · [First-run feedback](https://github.com/anshuman-pandey/casework/issues/new?template=first_run.yml) · [Security](SECURITY.md)

| Read next | Why |
|---|---|
| [Adoption requirements](docs/adoption.md) | First-value goals, user constraints and an uncoached review protocol |
| [Competitive research](docs/research/landscape.md) | Verafin, Unit21, Oscilar and adjacent alternatives; evidence versus hypotheses |
| [Product blueprint](docs/product.md) | User journeys, automation authority and release gates |
| [Architecture](docs/architecture.md) | Current implementation and production decisions |
| [Validation](docs/validation.md) | What was actually tested and what remains unverified |

```sh
python3 -m unittest discover -s tests -v
```

Python's standard library and SQLite keep the sandbox easy to evaluate. Node is only needed for optional browser checks. [Inter is separately licensed](THIRD_PARTY_NOTICES.md) under the SIL Open Font License.

---

[Apache-2.0](LICENSE) · Copyright 2026 Casework contributors.
