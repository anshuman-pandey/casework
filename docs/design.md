# Design standard: Notion's clarity, Linear's fluency

**Standing product requirement from the founder.** Notion and Linear are explicit references for Casework's design quality. Revisit this document for every new surface. This is our interpretation of public writing, not either company's complete internal design system or a claim of affiliation.

## What we learned from the people building them

| Primary source | Lesson | Casework application |
|---|---|---|
| [Linear: A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh), March 2026 | Give task content more weight than navigation; consistent action placement and restrained boundaries reduce distraction. | Compact navigation and queue; persistent header; investigation occupies the main canvas. |
| [Linear: Invisible details](https://linear.app/now/invisible-details), September 2020 | Small interaction costs compound; mouse affordances can also teach keyboard shortcuts. | Clickable commands with visible shortcuts; keyboard alternatives never become the only route. |
| [Linear: Triage Intelligence](https://linear.app/now/how-we-built-triage-intelligence), September 2025 | AI needs provenance and clear distinction from established metadata; slower reasoning needs honest progress. | Evidence-backed recommendations in context; distinct running, failed and completed states; no fake confidence or simulated agent work. |
| [Linear: Design is more than code](https://linear.app/now/design-is-more-than-code), December 2025 | Problem definition and conceptual exploration remain important even when implementation becomes easier. | Write the investigator's problem before designing a component; working code alone is not design validation. |
| [Linear Method: Manage design projects](https://linear.app/method/manage-design-projects) | Explore alternatives and solicit focused feedback before committing to polish. | Compare task flows with a design partner; ask where they hesitate and why, not only which screenshot they prefer. |
| [Notion: Updating the design of Notion pages](https://www.notion.com/blog/updating-the-design-of-notion-pages), March 2026 | Consistent spacing with context-sensitive grouping creates rhythm across different content types. | Compact repeated evidence rows; generous space between case sections; readable narrative line length. |
| [Notion: The design thinking behind Notion AI](https://www.notion.com/blog/the-design-thinking-behind-notion-ai), September 2023 | Flexible primitives need useful default workflows. Context determines which tools should appear. | A usable investigation template from the first case; assistance adjacent to evidence and decisions, not a mandatory blank chat. |
| [Notion: Designing Synced Blocks](https://www.notion.com/blog/designing-synced-blocks), June 2021 | Powerful underlying concepts need discoverable, understandable interfaces and clear paths to their source. | Evidence references should open the original snapshot. Complexity belongs behind understandable objects, not unfamiliar abstractions. |

Research retrieved 14 November 2026. We prioritized first-person product/design accounts and official guidance over template marketplaces, generic imitation tutorials or secondhand aesthetic analyses. This is a curated research pass, not every article ever published by either company.

## Our design direction

A calm, precise tool for spending hours investigating. Warm neutral surfaces, an understated indigo action color, compact navigation, and a document-like case record. Use typography and spacing before adding containers. Keep important text readable; muted does not mean illegible. This is an original interface drawing on shared principles, not a pixel copy of either product.

We considered a dashboard-first workspace, a full-page document with a hidden queue, and a persistent queue beside a case document. Choose the last for this prototype: investigators can compare and move between cases without losing their place. The initial promotional heading and large metric cards gave too much space to orientation; the revised layout makes work visible earlier.

### Rules that must survive feature growth

1. **The case is the center.** Navigation recedes; evidence and decisions remain prominent. Every prominent element must help the current task.
2. **One vocabulary.** Alert, case, evidence, evaluation and decision retain distinct meanings across interface, API and docs.
3. **Predictability before novelty.** Consistent action locations, familiar dialogs, obvious selected state, visible keyboard focus and reliable browser navigation.
4. **Progressive disclosure.** Show the source, relevance and freshness first; expose raw identifiers and hashes when inspecting an evidence record. Never hide a decision blocker.
5. **Useful defaults before customization.** Ship a complete case template. Add configurable views over coherent primitives, not a blank canvas that demands a consultant.
6. **Speed includes preserving context.** Don't reset a filter, switch a case unexpectedly after a background operation, or discard a rationale on a failed save. Show success only after the server confirms it.
7. **AI participates in the workflow.** Use the same evidence and action language as the product. An inference is a proposal, not a source fact. This prototype still has no AI model connected.
8. **Every state is designed.** Empty, loading, error, unavailable, stale, long-content and narrow-screen states are part of the feature.
9. **Beauty is functional.** No invented activity, meaningless metrics, decorative chart noise or unimplemented menu destinations.
10. **Keep tuning after release.** Track hesitation, accidental actions, task completion and repeated friction; don't equate a shipped mockup with a solved workflow.

## Shared tokens and behavior

The CSS defines paired light/dark surface, text, border, accent, status and focus tokens. Inter is bundled locally under the SIL Open Font License; no font service is required. Use a 4px spacing rhythm with 8/12/16/24/32px group spacing. The base is 13px; dense desktop controls use 11–12px and secondary metadata 9–10px. The case title is 28px. Mobile enlarges reading and control text. Revisit these compact desktop sizes with investigators using long sessions and text zoom. Use tabular numerals for risk/counts and monospace only for identifiers. Semantic status always has a text label as well as color. Original outline icons share one grid and stroke weight.

Desktop: 212px navigation, 300px queue (320px on wide screens), fluid investigation and a 198–220px properties panel. The properties panel moves beneath the document at narrower widths. Smaller screens collapse the rail; mobile stacks queue and document with bounded queue scrolling. Appearance and commands remain available in the compact header. Controls remain available without hover. Visible focus rings and reduced-motion support are mandatory. Brief opacity/position transitions should not delay task execution. No animation is needed to pretend an operation is running longer than it is.

Keyboard: Ctrl/Cmd+K opens commands; arrows choose a command and Enter executes it; Escape closes dialogs; `/` focuses case search; J/K move through the filtered queue outside editing controls. Commands must also be discoverable with the mouse. Case selection is encoded in the URL for reload and browser history.

## This pass: implemented versus next

Implemented: an inset workspace with a quiet sidebar, structured queue, document-style case layout and separate properties panel; locally bundled typography and consistent outline icons; expandable evidence records, explicit evaluation states and an activity timeline. Light/dark appearance persists locally and restores before paint. The command menu, case navigation shortcuts, filtered previous/next buttons, case-link copying, URL selection, in-memory rationale drafts, loading/retry states and evidence expansion preservation all work.

The first-run workspace offers one recommended complete investigation and five separate sample paths. It hides the queue until a case is selected, preserves existing data when adding practice, explains expected blockers and guides the next action using actual case state.

Next: real custom views and forms, a source-linked narrative editor, annotation/collaboration, a usable visual configuration flow and real grounded agent execution. These depend on functional data models; do not add decorative buttons ahead of the implementation.

## Review with the design partner

Give them an uncoached task: find a case, explain its trigger, locate its original evidence, identify missing context, record a justified decision and retrieve the record. Then change the inputs and observe whether they notice stale information. Repeat with keyboard and mouse. Record completion, hesitation, recovery and trust, not just visual preference.

Before approving a surface: check realistic long names, empty results, failed requests, unsaved input, keyboard focus, small screens, text zoom, reduced motion, status contrast and decision semantics. Automated smoke checks support this review; they do not replace accessibility or user testing.

## Workspace identity

Keep one consistent interface across deployments. Workspace name and logo are optional browser preferences; customization must not block the guided investigation. The first successful decision exposes a concrete next step: export the record or run the same interface locally. No compulsory company form or fabricated performance claims.

## Decision assistance and first-run defaults

New workspaces start in dark appearance with an editable Acme Corp name. Saved appearance and names remain respected. A closure dialog exposes unmet prerequisites before enabling submission, with an in-dialog readiness check that preserves the draft. Suggested rationale describes attached records and observed check results; the investigator supplies their findings. Tab accepts a suggestion only in an empty field, and the next Tab moves focus normally. Content fingerprints stay in optional technical details. Import is an integration entry point with complete editable synthetic scenarios, not an automatic monitoring connector.
