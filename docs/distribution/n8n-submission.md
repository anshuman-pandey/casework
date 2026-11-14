# n8n Creator Portal submission draft

Submit through https://creators.n8n.io/ after signing in to a creator account. This is a template submission, not a PR to n8n core.

**Title:** Create and replay a synthetic fraud alert in Casework

**Workflow:** [synthetic-alert.json](../../examples/n8n/synthetic-alert.json)

**Description:** Learn how to turn a monitoring-system-shaped alert into a reviewable case. This workflow builds a synthetic Acme Corp alert, imports it into a local Casework instance, replays the identical payload to demonstrate deduplication, and fetches the complete case record. It does not evaluate or resolve the alert automatically.

**Requirements:** Casework developer preview and n8n running on the same local host. No external provider, AI model, credentials or community node is required. Not compatible with n8n Cloud connecting to localhost, or with the browser-only public Casework demo. Docker users should follow the shared-network verification example rather than expose the unauthenticated preview server publicly.

**Setup and expected outputs:** [Integration guide](../../examples/n8n/README.md).

**Affiliation:** I maintain Casework. This is a synthetic-data demonstration, not production AML automation.

Status: not submitted. The creator portal requires account sign-in and the connected browser runtime is unavailable.
