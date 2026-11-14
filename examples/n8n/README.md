# A synthetic alert becomes a reviewable case

[← Casework](../../README.md)

Import [synthetic-alert.json](synthetic-alert.json) into a local n8n instance. It creates one Casework case, replays the same alert to demonstrate deduplication, and retrieves the complete case record. No model, credentials, paid provider or community node is required. It does not evaluate, close or escalate cases.

## Run it

1. Start Casework from the repository folder: `python3 -m casework --demo --port 8080`.
2. Use n8n running **natively on the same machine**, import the workflow JSON, and execute it manually.
3. Inspect **Create case**: `created: true`. **Replay same alert** returns the same ID with `created: false`. **Read case record** returns one open case with three synthetic evidence records.
4. Open the case at `http://127.0.0.1:8080/#CASE_ID`, replacing CASE_ID with the returned ID. Make any decision yourself in Casework.

**Build synthetic alert** contains the editable payload and base URL. Its source ID uses the n8n execution ID: a new execution creates a new case; the two imports inside that execution reuse the exact same payload. To test a changed replay, change content while retaining the source ID; Casework rejects it with HTTP 409.

The public Casework demo is browser-local and exposes no case API. n8n Cloud cannot reach your machine's localhost. Docker containers have separate loopback networks: do not change Host headers, expose Casework publicly or disable its checks to work around that. The verification script below uses a shared container network namespace; normal native n8n avoids this networking setup.

## Reproduce the integration check (Linux + Docker)

```sh
python3 scripts/check_n8n.py
```

The check uses a temporary Casework database, a temporary n8n volume and the pinned n8n 2.47.7 image. It imports and executes this exact workflow in n8n, asserts one new case despite two imports, checks three sources, and confirms no decision was recorded. It removes only its own containers and volume. Initial image download requires internet access. Native macOS/Windows execution is not independently verified.

Errors stop the workflow: no “continue on fail” behavior or automatic closure is enabled. Use synthetic data only; this preview has no application authentication.
