# Security boundary

This release is a **local, single-user prototype for synthetic data**. It uses Python's development HTTP server, has no user authentication or authorization, and is not suitable for sensitive or production data. Keep native startup on loopback. The Docker image uses an internal container listener, while the supplied Compose file publishes only host loopback. Private server evaluation can use an SSH tunnel as documented in [self-hosting](docs/self-hosting.md). Do not expose the app to the internet or treat localhost checks as identity controls.

Implemented safeguards include fixed static-asset routing, text escaping in the interface, same-origin mutation checks, a loopback Host allowlist, body-size limits, input validation, transactional decisions and optimistic version checks. These are not a comprehensive security review.

The audit history is stored in the same SQLite database. A person with database access can modify it. Evidence hashes are integrity identifiers, not proof that the source is truthful or a defense against a database administrator rewriting records.

Production prerequisites are described in [architecture](docs/architecture.md). No security certification is claimed. Before public launch, configure private vulnerability reporting and an actual monitored contact. Until then, don't post sensitive findings, secrets or customer records to public issues.
