# Validation record

**Run date:** 14 November 2026. Local Linux environment; Python 3.12.14, Node 24.22.1, Chromium through Playwright.

## Executed successfully

```sh
python3 -m unittest discover -s tests -v
node tests/browser.cjs
python3 -m compileall -q casework
node --check casework/web/app.js
```

The Python suite passed **18 tests** covering scenario expectations, non-destructive repeated practice, disposable-workspace cleanup, fresh fixture generation, ingestion replay/conflicts, parallel ingestion, evaluation-before-close, persistence, concurrent decisions, reopen semantics, missing/stale/future evidence, closure-time revalidation, invalid inputs, rollback on failed transitions, HTTP export and host/origin checks.

The browser smoke test passed evidence expansion, policy evaluation, closure, persistence after reload, JSON download, reopening, blocked high-risk closure, search/empty results, JSON import, literal rendering of HTML-like input, status filters and no horizontal overflow at 390, 768 and 1440 pixels. No uncaught JavaScript errors were observed.

The screenshot in the README was captured from the running application with synthetic fixtures and visually inspected. It is not a mockup. The browser test uses an isolated temporary database and cleans it up.

## Reproduce the optional browser check

The application itself needs no Node packages. The optional browser test requires the `playwright` Node package available to Node and a Chromium binary. This environment already supplied both. Set `CHROMIUM_PATH` if Chromium is not at `/usr/bin/chromium`. Run from the repository root:

```sh
node tests/browser.cjs
```

The script starts its own loopback server on an available port. It uses `--no-sandbox` for this container's browser; use a properly sandboxed browser runner in a hardened CI environment. GitHub Actions defines Python checks for 3.12 and 3.13, a browser workflow job, and a Docker lifecycle job. Remote results are available in the repository Actions tab; local results below are recorded separately.

## Notion / Linear design pass

The expanded browser suite also passed command-menu search and empty states, Ctrl+K and J/K navigation, shortcut suppression in a text input, case URL history with Back/Forward, rationale draft retention after cancellation, evidence expansion after evaluation, and recovery from a simulated 503 response. Existing investigation workflow checks continue to pass.

Desktop and mobile screenshots were refreshed from the redesigned application. The implementation includes focus styles and reduced-motion CSS, but a full assistive-technology and contrast audit remains outstanding. Design research and enduring requirements are in [design.md](design.md) and the repository's AGENTS.md.

The visual polish pass also passed local font loading, light/dark appearance persistence through reload, the appearance control on mobile, copying a case URL to the browser clipboard, and previous/next navigation that updates when filters change. The complete 13-test Python suite and browser workflow suite passed after these changes. Source syntax checks passed for both JavaScript files and Python modules.

The current previews show the real application at 1600px (light, dark and commands) and 390px (mobile). Inter is bundled locally with its license. Primary button colors were adjusted to provide at least 4.5:1 contrast with white labels in both themes; this targeted check is not a full accessibility audit.

## Not verified

No production deployment, multi-user identity/authorization, tenant isolation, regulatory filing, real model behavior, false-positive reduction, external data connector, enterprise load, full WCAG audit, independent penetration test or disaster recovery is claimed. The browser checks are a smoke test, not proof of comprehensive usability or accessibility. Performance figures in the architecture are proposed targets, not measurements.

## Download, onboarding and hosting pass

The complete local Python suite passed 18 tests. The expanded browser suite passed the guided path from fresh sample creation through inspection, evaluation, closure, downloaded JSON verification and reopening. It also passed a simulated sample-creation failure followed by retry and escalation, and onboarding layout checks at 390, 768 and 1440px. Actual first-run desktop and mobile screenshots were inspected.

`python3 scripts/check_container.py` successfully built the Docker image, waited for health, executed all six sample scenarios and the 34-check API verifier, recreated the container, and compared all 13 complete case records before/after. The application UID was verified as 10001. The check cleaned up its own test volume. An initial image permission failure was corrected by assigning copied application files to that non-root user.

The disposable-mode test verified that the existing database was unchanged, temporary storage was reported, six seed cases loaded, and the temporary directory was removed on graceful shutdown. Markdown local links and source syntax checks passed. Windows/macOS native startup, human time-to-value targets, SSH deployment and the manual backup recovery instructions have not been independently validated in this Linux environment.

The preview ZIP was extracted into a clean directory, started independently, and passed all 34 API checks. GitHub Actions results are tracked separately from these local checks.

## Public browser demo and workspace identity

GitHub Actions run [43618337716](https://github.com/anshuman-pandey/casework/actions/runs/43618337716) passed Python 3.12/3.13, container lifecycle, existing native browser checks and the new public demo checks. The public browser journey covers logo/name configuration, appearance export/import, separate visitor contexts, inspect/evaluate/decide/export, reload, self-host download link, reset confirmation, themes and widths 320/390/768/1440. It recorded zero case API requests and zero JavaScript errors.

The browser store contract suite also passed scenario parity against Python, idempotency, concurrent mutation serialization, failed-write rollback, expiry, capacity and reset. This is targeted parity for the included scenarios, not proof that arbitrary browser and server inputs are equivalent.

The managed interactive preview relay was unavailable. Browser checks ran in GitHub Actions; no local interactive browser inspection is claimed for this pass. The manual **Refresh product screenshots** workflow regenerates and commits real demo screenshots for review.

Public deployment succeeded on 14 November 2026. Anonymous HTTP retrieval confirmed the authored page and build-info for v0.2.0-preview.1; Sites reports public access. Desktop, dark and 390px mobile screenshots from the CI browser run were visually inspected. Screenshot capture now waits for transient notifications to disappear.

## Folder-independent startup

The `start.py` launcher was checked on Linux from an unrelated working directory with an extracted project path containing spaces. Startup selected a free port, health reported the expected mode, six sample cases loaded, disposable mode left no project database, and two persistent launches returned the same records. All 18 Python tests passed. The macOS shell launcher passed shell syntax checking. Native Finder/Windows double-click behavior and actual desktop browser opening have not been verified here; the printed URL and explicit Python path remain available as fallbacks.
