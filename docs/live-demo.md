# Browser practice workspace

[← Project](../README.md)

[Try Casework](https://casework-live.sunshinevendetta.chatgpt.site). Start a guided investigation, inspect evidence, evaluate policy, record a decision and export the record. No account or model key is required.

Workspace name and logo are optional browser preferences. Export appearance settings and import them into your self-hosted workspace. These are not shared organization settings.

The demo uses the same interface as the Python app. Its browser adapter replaces HTTP requests with session storage. Records expire after two hours on the next operation; closing the tab or resetting removes them. If storage is unavailable, memory-only mode is reported. Duplicating a browser tab can copy initial session state; subsequent changes remain separate.

Limits: 40 cases, 100 events per case, 2 MB serialized state. No case API calls or application analytics are sent. The hosting provider may retain ordinary asset request logs. Use synthetic data only.

Self-hosted mode uses SQLite and server-side validation. Browser policy checks are a demonstration, not a security boundary. Neither preview includes team authentication or production controls.

To build the static site with Python 3.12+:

```sh
python3 scripts/build_demo.py
```

Publish `dist/`. No backend, database or secrets are deployed. `build-info.json` records the source commit and version. Each demo links its matching source release; deployment follows tested releases rather than every push.
