# The market, without the sales pitch

**Research cut: 14 November 2026 · Public-source desk research · Decision brief v0.1**

[← Project](../../README.md) · [Product blueprint](../product.md) · [Source register](sources.csv)

## What to build

Build an **independent investigation workspace** that accepts alerts from existing detection systems. Make installation, migration, customization, and evidence review unusually good. Offer the complete product under Apache-2.0. Start with fintech fraud/AML teams; keep the case model extensible without pretending every industry's workflows are interchangeable.

AI, graphs, configurable workflows, audit trails, and no-code rules already exist in this market. None is a defensible differentiation alone. The opportunity is a combination: unrestricted software, portable case records, low operational overhead, and automation whose behavior operators can inspect and test. This is a product hypothesis, not proven demand.

## Scope and evidence quality

We searched commercial product pages, technical documentation, release notes, public repositories, licensing terms, G2 product reviews, community discussions, and official reporting guidance. Verafin, Unit21, and Oscilar receive the deepest treatment. Seven adjacent products establish the competitive baseline. This is not an exhaustive inventory of every vendor or a hands-on procurement assessment.

**P** = primary vendor documentation; verifies that a capability is advertised/documented, not its effectiveness. **U** = individual user report; anecdotal, version-dependent, and subject to selection bias. **S** = third-party summary; weaker than a review inspected directly. **H** = our hypothesis. Missing public evidence means **unknown**, not absent.

No private customer data, paid analyst reports, vendor demos, interviews, or production benchmarks were available. No customer contacts were made. Search snippets guided discovery; the central conclusions use inspected pages. Employee reviews and SEO comparison rankings were excluded from customer-complaint evidence. Vendor ROI percentages are not comparable benchmarks. Dates below refer to visible publication/review dates where available; retrieval is 2026-11-14.

## The three reference competitors

| Platform | Documented strengths | Implication for Casework |
|---|---|---|
| **Nasdaq Verafin** | Integrated financial-crime investigations and entity research; its July 2025 announcement describes sanctions and EDD agents then in beta (not proof of current general availability). [P, V1–V2] | Compete on deployment and interoperability, not a claim that legacy vendors lack AI. Its data ecosystem and domain experience are substantial advantages. |
| **Unit21** | Agent-assisted triage, research, narratives, graph analysis, configurable workflows, quality oversight, and human decision control. June 2026 updates describe Case Agent and an API for customers' agents. [P, U1–U2] | Bring-your-own-agent and automated narratives are already competitive requirements. An open API alone is insufficient. |
| **Oscilar** | Queues, bulk actions, prioritization, investigation context, and narrative assistance. Its Agent Hub lets customers introduce custom agent logic. [P, O1–O2] | Ease of configuration and deployment must be demonstrated against a capable modern platform, not an obsolete caricature. |

Sources: [V1](https://verafin.com/wp-content/uploads/2024/11/case-management-feature-sheet-nasdaq-verafin-20241128.pdf), [V2](https://ir.nasdaq.com/news-releases/news-release-details/nasdaq-verafin-announces-launch-its-agentic-ai-workforce), [U1](https://www.unit21.ai/products/case-management), [U2](https://www.unit21.ai/blog/what-shipped-in-june-the-case-investigates-itself-before-you-open-it), [O1](https://oscilar.com/solutions/case-management), [O2](https://oscilar.com/blog/oscilar-agent-hub).

## What people actually report

| Evidence | Observed friction | Design response | Confidence / caveat |
|---|---|---|---|
| Verafin G2, financial-services reviewer, updated 2025-05-06 | Customization requires careful setup against the institution's risk profile. | Validated starter packs; show assumptions and missing inputs before activation. | U; single report, also praises resources. |
| Verafin G2, 2025-05-21 | Dated interface and time-consuming integration. | Fast, keyboard-accessible workspace; executable ingestion examples. | U; reviewer listed in marketing/advertising; weaker domain evidence. |
| Unit21 G2 AI summary, May 2026 | Manual CTR steps, complex rule setup, interface and custom-field filtering friction. | Test filtering and reporting workflows with analysts. | S; underlying individual reviews were not exposed in the retrieved page. Do not present as independently confirmed current defects. |
| Oscilar G2, payments/fraud leader, 2026-01-30 | Initial implementation and learning took longer than expected. | Measure first-value time with an unaided developer; progressive configuration. | U; reviewer praises day-to-day manageability after setup. |
| Oscilar G2, 2025-10-30 | Release promotion ownership and bulk resolution still required manual effort. | Versioned change promotion and previewable, resumable bulk jobs. | U; improvements were reportedly planned. Current product page advertises bulk actions. |
| Oscilar G2, community-bank implementation account | Some ATM/cash scenarios and reporting/admin content required vendor work. | Versioned domain packs with fixtures and explicit coverage. | U; not evidence that the entire capability is missing. |

Review sources: [Verafin](https://www.g2.com/products/verafin/reviews), [Unit21 summary](https://ai.g2.com/product/unit21), [Oscilar](https://www.g2.com/products/oscilar/reviews). Verafin's retrieved page had only three reviews. Oscilar's page had thirty and was predominantly positive. These samples cannot establish market-wide dissatisfaction or complaint prevalence.

**A useful contradiction:** Unit21's public support article already documents custom-data filtering, including text/numeric operators, while excluding booleans and arrays. The article is dated 2022. Therefore, “Unit21 has no custom-field filtering” would be false; current operator coverage requires verification. [U3](https://support.unit21.ai/hc/en-us/articles/10521085268884-How-to-use-Custom-Data-Filters-to-find-Cases)

## Adjacent competition and build-versus-extend

| Product | Evidence-supported baseline | What it changes |
|---|---|---|
| **NICE Actimize ActOne** | Enterprise investigations, external data/alert integration, analytics, reporting, and AI. [A1] | Enterprise breadth is table stakes; don't promise parity from a small prototype. |
| **Lucinity** | Case manager and Luci assistance; a system-agnostic copilot plugin is publicly described. [A2] | Working alongside existing tools is already a market strategy. Migration quality must be better, not merely mentioned. |
| **Hawk** | Public docs cover case management, reporting, investigative agents, analytics, entity risk, and tenants. [A3] | Tenant separation and operational controls belong in the base architecture. |
| **ComplyAdvantage Mesh** | Customer cases, configurable workflows, and API/webhook integration, including an external case-management mode. [A4] | Integrate with specialist screening vendors instead of rebuilding their datasets. |
| **Sardine** | Case management and public updates covering manual cases, comments, report escalation, templates, and attachments. [A5] | An attractive alert table alone is not a case manager. |
| **Marble** | Self-hosted fraud/AML platform, case investigations, audit, APIs, and AI; free core plus commercial features. [M1] | The most relevant build-versus-extend comparison. Conduct a hands-on evaluation before committing to an expensive rewrite. |
| **Ballerine** | Risk workflow infrastructure and manual-review back office; current README says the OSS repository is undergoing a rebuild and is not actively supported. [B1] | Maintenance continuity, upgrades, and contributor trust matter as much as license cost. Re-check status before reuse. |

Sources: [A1](https://www.niceactimize.com/Documents/actone-enterprise-case-manager-brochure.pdf), [A2](https://lucinity.com/blog/lucinity-launches-copilot-plugin), [A3](https://docs.hawk.ai/), [A4](https://support.complyadvantage.com/articles/1901668528-mesh-api-faqs), [A5](https://www.sardine.ai/blog/risk-platform-updates-november-2023), [M1](https://github.com/checkmarble/marble), [B1](https://github.com/ballerine-io/ballerine).

### “Open source” needs a license check

Marble's documentation identifies its core license as **Elastic License 2.0**. ELv2 restricts providing substantial functionality as a hosted/managed service and bypassing license-key controls. Those restrictions differ materially from the unrestricted fields-of-use principle in the Open Source Definition. We classify this as source-available for this comparison, despite the vendor's terminology. Verify each component and version before reuse; don't infer every repository has the same license. [M2](https://docs.checkmarble.com/docs/opensource-1), [L1](https://www.elastic.co/licensing/elastic-license), [L2](https://opensource.org/osd)

**Decision:** Apache-2.0 for our original code. Favor adoption, embedding, and partner hosting. The tradeoff is that others can offer proprietary derivatives or competing hosted services. Don't add a noncommercial clause or a “no competing SaaS” clause and still call it Apache-2.0. Software can be free; infrastructure, paid data, model inference, and operational labor remain real costs.

## Gaps worth testing—not claims that nobody offers them

| Opportunity hypothesis | Why it matters | What would prove it |
|---|---|---|
| First useful case without a sales call or cloud account | Setup effort recurs in reviews. | 8/10 independent developers ingest and resolve a synthetic case in ≤15 minutes, including prerequisite setup measured separately. |
| Complete controls in the free distribution | Procurement and tiering can obstruct adoption. | Public feature manifest; SSO, authorization, audit/export and backup included when implemented. |
| Migration as a product feature | A new UI is insufficient when history lives elsewhere. | Import a real anonymized export with reconciliation, original IDs, timestamps, permissions and error report. |
| Evidence freshness is visible | Fast summaries can hide stale or missing inputs. | Every material assertion links to a dated snapshot; missing evidence prevents eligible auto-resolution. |
| Reproducible automation | Operators need to explain why a case closed. | Replay recorded inputs against pinned policy/model/tool versions; preserve original outputs when nondeterministic. |
| Cross-tool closure | Work often extends beyond case status. | Reliable idempotent action delivery, acknowledgements, retries and reconciliation; never equate “queued” with “done.” |
| Safe bulk handling | Similar alerts invite repetitive effort and accidental overreach. | Preview membership and exceptions; rerun checks at execution; per-item result and recovery. |
| Honest operational simplicity | Self-hosting can transfer vendor work to customers. | One supported production topology, restore drills, upgrade tests and a measured support burden. |

## Strategic choices

1. **Enter beside existing detection.** Take generic JSON/CSV first. Keep original alert identifiers and raw evidence. Avoid a mandatory detection-engine migration.
2. **Win one repeatable workflow.** Initial target: 2–20 investigators at fintechs handling transaction-monitoring alerts. AML narratives and fraud decisions need distinct policies; do not merge the semantics.
3. **Keep specialist data pluggable.** Consortium intelligence, adverse media, sanctions data, identity verification, and regulator connectivity are not free just because our code is.
4. **Make automation earn authority.** Observe → recommend → approve → narrowly auto-resolve. Approval is a policy choice. Account restrictions, SAR submission, and materially adverse decisions require separate authorities.
5. **Use quality-adjusted efficiency.** Faster closure is not success if missed suspicious activity rises. Closed-as-benign is an analyst disposition, not ground-truth proof of a false positive.
6. **Don't sell employee-count scaling.** A 50,000-person company might have 80 investigators; a tiny fintech might ingest millions of events. Size by concurrent users, case volume, evidence bytes, jurisdiction and availability requirements.

## Research still needed before a product-market claim

Recruit 12–15 analysts, engineering owners and compliance leads across small fintechs, sponsor banks and enterprises. Ask them to show a recent redacted investigation, not rank hypothetical features. Measure time spent gathering evidence, repeat searches, handoffs, rework and actual integration hours. Include satisfied incumbent customers and teams that rejected OSS.

Run identical tasks in trial deployments: import 100 cases, change one workflow, filter a typed custom field, export a complete case, restrict a reviewer, restore a backup, and promote a policy. Record assistance required, failure modes and elapsed time. Obtain current quotes and contract/export terms rather than inventing incumbent pricing.

Evaluate Marble hands-on for fit and component licensing. If its permitted deployment and product model satisfy a design partner, integration may be better than replacement. Establish a customer-specific labelled evaluation set and jurisdiction-specific reporting review before making any false-positive, compliance, or autonomous-resolution claims.
