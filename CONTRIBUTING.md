# Contribute to Casework

Read the [Notion/Linear design standard](docs/design.md) before changing the interface. Start with the [research](docs/research/landscape.md), [product scope](docs/product.md) and [implemented API](docs/api.md). The current prototype is deliberately small. Changes should make one complete investigation workflow better.

1. Describe the user problem, expected behavior and evidence supporting it.
2. Run `python3 -m casework` with synthetic data only.
3. Add meaningful tests for state transitions, permissions, data integrity or failure recovery when changing them.
4. Run `python3 -m unittest discover -s tests -v`.
5. For interface changes, check desktop and narrow screens, keyboard focus, error states and empty states. Update screenshots only from the running app.
6. Update the README feature-status table when capabilities change.

Avoid speculative frameworks, connector stubs presented as integrations, fabricated AI output, or tests that merely repeat implementation constants. Prefer small pull requests with a concrete before/after example and validation. Use the Apache-2.0 license for contributions; no copyright assignment is requested.

Useful next contributions: independently reproduce onboarding; evaluate an existing platform against the research tasks; design the production alert schema; specify authentication and tenant isolation; build an import reconciliation fixture. Discuss schema, license and production-stack changes before undertaking a large implementation.

The public repository is [anshuman-pandey/casework](https://github.com/anshuman-pandey/casework). Once available, start with a [first-run report](https://github.com/anshuman-pandey/casework/issues/new?template=first_run.yml), bug report or focused workflow proposal. Fork the repo, create a branch and open a pull request; public contributions do not need a collaborator invitation. Direct write access is managed separately by the repository owner.

For optional browser checks, use Node 22+, run `npm ci`, then `npx playwright install chromium` and `npm test`. Linux may need `npx playwright install --with-deps chromium`. Set `CHROMIUM_PATH` to use another installed Chromium. The application itself has no Node dependency.

`python3 scripts/check_container.py` verifies Docker startup, all scenarios and complete record persistence through container recreation. It creates and cleans up only its own isolated test project. GitHub Actions runs Python, browser and container checks.

The [adoption review protocol](docs/adoption.md) is a useful first contribution for investigators and designers. A good report explains a specific hesitation or failed task; a good PR fixes one complete workflow.
