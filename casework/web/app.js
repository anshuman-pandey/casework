const { t, error: localizedError } = window.caseworkI18n;
// Small, original outline icons share a 24-unit grid and 1.6-unit stroke.
const iconPaths = {
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  inbox: '<path d="m4 4-2 11v5h20v-5L20 4H4Z"/><path d="M2 15h6l2 3h4l2-3h6"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  "check-circle":
    '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="m6 6 12 12M6 18 18 6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  stack:
    '<rect x="5" y="6" width="15" height="15" rx="2"/><path d="M16 3H4a2 2 0 0 0-2 2v12M9 11h7M9 15h5"/>',
  keyboard:
    '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  moon: '<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M8 13h8m-8 4h5"/>',
  folder:
    '<path d="M3 7V5a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 9h18"/>',
  flag: '<path d="M5 21V3m0 1h7l2 2h6v10h-7l-2-2H5"/>',
  contact:
    '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="9" r="3"/><path d="M7 18a5 5 0 0 1 10 0"/>',
  receipt:
    '<path d="m5 3 3 2 4-2 4 2 3-2v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M9 9h6m-6 4h6"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>',
  "shield-check":
    '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/>',
  "chevron-right": '<path d="m9 5 7 7-7 7"/>',
  "chevron-up": '<path d="m6 15 6-6 6 6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "arrow-up-right": '<path d="M6 18 18 6M6 6h12v12"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  link: '<path d="m10 13 4-4m-6 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 3 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(2 0) scale(.9)"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  refresh: '<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 5v6h6M12 7v5l3 2"/>',
  activity: '<path d="M2 12h4l3-8 6 16 3-8h4"/>',
  signal: '<path d="M5 18v2m5-7v7m5-12v12m5-17v17"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18M7 15h3m4 0h3"/>',
};
function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.file}</svg>`;
}
document
  .querySelectorAll("[data-icon]")
  .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
const $ = (id) => document.getElementById(id);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let cases = [],
  selected = null,
  current = null,
  pendingAction = null,
  requestVersion = 0,
  toastTimer;
const drafts = new Map();
const expandedEvidence = new Map();
let showingStart = false;
function visibleCases() {
  const query = $("search").value.toLowerCase(),
    status = $("status-filter").value;
  return cases.filter(
    (c) =>
      (status === "all" || c.status === status) &&
      `${c.subject} ${c.title} ${c.id} ${c.category}`
        .toLowerCase()
        .includes(query),
  );
}
function syncNavigation() {
  [
    ["all-nav", "all"],
    ["open-nav", "open"],
    ["closed-nav", "closed"],
  ].forEach(([id, status]) => {
    const active = !showingStart && $("status-filter").value === status;
    $(id).classList.toggle("active", active);
    if (active) $(id).setAttribute("aria-current", "page");
    else $(id).removeAttribute("aria-current");
  });
  $("start-nav").classList.toggle("active", showingStart);
  if (showingStart) $("start-nav").setAttribute("aria-current", "page");
  else $("start-nav").removeAttribute("aria-current");
}
async function api(path, body) {
  if (window.caseworkDemo) return window.caseworkDemo.request(path, body);
  const response = await fetch(
    path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || t("Request failed"));
  return result;
}
function toast(message) {
  $("toast").textContent = localizedError(message);
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 5000);
}
const date = (value) =>
  new Date(value).toLocaleString(window.caseworkI18n.locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
function renderQueue() {
  const focusedId = document.activeElement?.dataset?.id;
  const filtered = visibleCases();
  syncNavigation();
  $("list-count").textContent = filtered.length;
  $("cases").innerHTML = filtered.length
    ? filtered
        .map(
          (c) =>
            `<button class="case-row ${c.id === selected ? "selected" : ""}" data-id="${escape(c.id)}" aria-pressed="${c.id === selected}"><span class="row-top"><span class="row-state status-${escape(c.status)}">${icon(c.status === "closed" ? "check-circle" : c.status === "escalated" ? "arrow-up-right" : "circle")}</span><span class="row-id">${escape(c.id)}</span><span class="risk ${c.risk >= 70 ? "high" : c.risk >= 30 ? "medium" : "low"}">${c.risk}</span></span><span class="case-copy"><strong>${escape(c.subject)}</strong><span class="row-trigger">${escape(c.title)}</span></span><span class="row-bottom"><span class="category-tag">${escape(c.category)}</span><span class="row-status">${escape(t(c.status))}</span></span></button>`,
        )
        .join("")
    : `<div class="empty"><span class="empty-icon">${icon("search")}</span><strong>${escape(t("No cases match these filters."))}</strong><p>${escape(t("Try a different search or import an alert."))}</p></div>`;
  $("cases")
    .querySelectorAll("[data-id]")
    .forEach((b) => {
      b.onclick = () => loadCase(b.dataset.id);
      if (b.dataset.id === focusedId) b.focus({ preventScroll: true });
    });
  syncCaseNavigation();
}
function syncCaseNavigation() {
  const ordered = visibleCases(),
    position = ordered.findIndex((item) => item.id === selected);
  if ($("previous-case")) $("previous-case").disabled = position <= 0;
  if ($("next-case"))
    $("next-case").disabled = position < 0 || position >= ordered.length - 1;
}
function adjacentCase(direction) {
  const ordered = visibleCases(),
    position = ordered.findIndex((item) => item.id === selected);
  if (position >= 0 && ordered[position + direction])
    loadCase(ordered[position + direction].id);
}
async function refresh() {
  cases = (await api("/api/cases")).cases;
  $("total").textContent = cases.length;
  $("nav-count").textContent = cases.length;
  $("open-count").textContent = cases.filter((c) => c.status === "open").length;
  $("closed-count").textContent = cases.filter(
    (c) => c.status === "closed",
  ).length;
  $("high-count").textContent = cases.filter(
    (c) => c.status === "open" && c.risk >= 70,
  ).length;
  renderQueue();
}
async function loadCase(id, navigate = true) {
  const version = ++requestVersion;
  showingStart = false;
  document.querySelector(".workbench").classList.remove("onboarding");
  selected = id;
  current = null;
  renderQueue();
  $("detail").setAttribute("aria-busy", "true");
  $("detail").innerHTML =
    `<div class="loading-state" role="status"><span class="loading-dot"></span> ${escape(t("Loading investigation…"))}</div>`;
  try {
    const result = await api(`/api/cases/${encodeURIComponent(id)}`);
    if (version !== requestVersion) return;
    current = result;
    if (navigate && location.hash !== `#${id}`)
      history.pushState(null, "", `#${id}`);
    renderDetail();
  } catch (error) {
    if (version !== requestVersion) return;
    $("detail").innerHTML =
      `<div class="empty"><h3>${escape(t("We couldn't open this case"))}</h3><p>${escape(localizedError(error.message))}</p><button class="button" id="retry-case">${escape(t("Try again"))}</button></div>`;
    $("retry-case").onclick = () => loadCase(id, navigate);
  } finally {
    if (version === requestVersion) $("detail").removeAttribute("aria-busy");
  }
}
function renderDetail() {
  const c = current;
  const evaluation = c.events
    .filter(
      (e) =>
        e.kind === "policy_evaluated" && e.payload.case_version === (c.status === "open" ? c.version : c.version - 1),
    )
    .at(-1)?.payload;
  const passed = evaluation?.checks.filter((check) => check.passed).length || 0;
  const riskClass = c.risk >= 70 ? "high" : c.risk >= 30 ? "medium" : "low";
  const ordered = visibleCases(),
    position = ordered.findIndex((item) => item.id === c.id);
  const status = `<span class="pill status-${escape(c.status)}">${icon(c.status === "closed" ? "check-circle" : c.status === "escalated" ? "arrow-up-right" : "circle")}${escape(t(c.status))}</span>`;
  $("detail").innerHTML = `
    <div class="case-toolbar"><div class="case-location">${icon("file")}<span class="case-id">${escape(c.id)}</span>${status}</div><div class="case-tools"><button class="icon-button" id="copy-case-link" aria-label="${escape(t("Copy case link"))}" title="${escape(t("Copy case link"))}">${icon("link")}</button><span class="tool-divider"></span><button class="icon-button" id="previous-case" aria-label="${escape(t("Previous case"))}" title="${escape(t("Previous case (K)"))}" ${position <= 0 ? "disabled" : ""}>${icon("chevron-up")}</button><button class="icon-button" id="next-case" aria-label="${escape(t("Next case"))}" title="${escape(t("Next case (J)"))}" ${position >= ordered.length - 1 ? "disabled" : ""}>${icon("chevron-down")}</button></div></div>
    <div class="case-layout"><div class="case-document">
      ${practiceGuide(c, evaluation)}
      <div class="document-heading"><span class="eyebrow">${escape(t("Investigation"))}</span><h3>${escape(c.subject)}</h3><p class="document-subtitle">${escape(c.category)}<span class="middle-dot">·</span>${escape(t("Created {date}", {date: date(c.created_at)}))}</p></div>
      <div class="trigger"><span class="trigger-icon">${icon("flag")}</span><div><span class="trigger-label">${escape(t("Why this case was opened"))}</span><p>${escape(c.title)}</p></div></div>
      <div class="section-label">${icon("folder")} ${escape(t("Evidence"))} <span class="section-count">${c.evidence.length}</span><span class="section-note">${escape(t("Source records"))}</span></div>
      <div class="evidence-grid">${c.evidence.length ? c.evidence.map((e) => `<details class="evidence" data-evidence="${escape(e.id)}" ${expandedEvidence.get(c.id)?.has(e.id) ? "open" : ""}><summary><span class="evidence-icon">${icon(e.kind === "identity" ? "contact" : e.kind === "transactions" ? "receipt" : "shield")}</span><span class="evidence-summary"><strong>${escape(e.label)}</strong><span>${escape(e.source)}</span></span><span class="evidence-kind">${escape(t(e.kind))}</span>${icon("chevron-right")}</summary><div class="evidence-content"><p>${escape(e.detail)}</p><dl class="evidence-meta"><div><dt>${escape(t("Reference"))}</dt><dd>${escape(e.id)}</dd></div><div><dt>${escape(t("Observed"))}</dt><dd>${escape(e.observed_at)}</dd></div></dl><details class="technical-details"><summary>${escape(t("Technical details"))}</summary><p>${escape(t("Content fingerprint (SHA-256). Useful when comparing exports; it does not verify the source or establish independent audit integrity."))}</p><code>${escape(e.sha256)}</code></details></div></details>`).join("") : `<div class="empty-evidence">${icon("folder")}<strong>${escape(t("No evidence attached"))}</strong><p>${escape(t("This case needs source records before it can be evaluated for closure."))}</p></div>`}</div>
      <div class="policy-box"><div class="policy-head"><div class="policy-title"><span class="policy-icon">${icon("shield-check")}</span><div><strong>${escape(t("Evidence readiness"))}</strong><span>${escape(t("Demo policy · human review required"))}</span></div></div>${evaluation ? `<span class="evaluation-status ${passed === 3 ? "passed" : "blocked"}">${icon(passed === 3 ? "check-circle" : "circle")}${escape(t("{count} of 3 checks passed", {count: passed}))}</span>` : `<span class="evaluation-status">${escape(t("Not evaluated"))}</span>`}</div>
        ${evaluation ? `<div class="checks">${evaluation.checks.map((check) => `<div class="check ${check.passed ? "" : "fail"}">${icon(check.passed ? "check-circle" : "circle")}<span>${escape(t(check.label))}</span></div>`).join("")}</div><p class="policy-explanation">${escape(t(evaluation.explanation))}</p>` : `<p class="policy-explanation">${escape(t("Check evidence coverage, freshness and the source risk threshold. This does not verify evidence content or determine whether activity is suspicious."))}</p>`}
        <div class="policy-footer"><span>${icon("lock")} ${escape(t("Deterministic checks"))}</span>${c.status === "open" ? `<button id="evaluate" class="button">${icon("play")}${escape(t("Run policy check"))}</button>` : `<span class="pill">${escape(t("Decision recorded"))}</span>`}</div>
      </div>
      <div class="decision-actions">${c.status === "open" ? `<button class="button primary" data-action="close">${icon("check")}${escape(t("Review & close"))}</button><button class="button" data-action="escalate">${icon("arrow-up-right")}${escape(t("Escalate case"))}</button>` : `<button class="button" data-action="reopen">${icon("refresh")}${escape(t("Reopen investigation"))}</button>`}<span class="decision-note">${icon("history")} ${escape(t("Every decision leaves a record"))}</span></div>
      <div class="section-label activity-label">${icon("activity")} ${escape(t("Activity"))} <span class="section-count">${c.events.length}</span><span class="section-note">${escape(t("Version {version}", {version: c.version}))}</span></div><ol class="history">${c.events
        .slice()
        .reverse()
        .map(
          (e) =>
            `<li><span class="event-icon">${icon(e.kind === "policy_evaluated" ? "shield-check" : e.kind === "ingested" ? "inbox" : "check")}</span><div><strong>${escape({ ingested: t("Alert imported"), policy_evaluated: t("Policy evaluation recorded"), close: t("Case closed"), escalate: t("Case escalated"), reopen: t("Investigation reopened") }[e.kind] || e.kind)}</strong><small title="${escape(e.at)}">${escape(e.payload.actor || e.payload.policy || "local-demo")}<span class="middle-dot">·</span>${escape(date(e.at))}</small>${e.payload.reason ? `<p>${escape(e.payload.reason)}</p>` : ""}</div></li>`,
        )
        .join("")}</ol>
    </div><aside class="case-inspector" aria-label="${escape(t("Case properties"))}"><h4>${escape(t("Properties"))}</h4><dl class="properties"><div><dt>${icon("circle")}${escape(t("Status"))}</dt><dd>${status}</dd></div><div><dt>${icon("signal")}${escape(t("Source risk"))}</dt><dd><span class="risk ${riskClass}">${c.risk}<span>/ 100</span></span><small>${escape(t("Provided by the source."))}<br>${escape(t("Not a finding of suspicious activity."))}</small></dd></div><div><dt>${icon("stack")}${escape(t("Case type"))}</dt><dd>${escape(c.category)}</dd></div><div><dt>${icon("calendar")}${escape(t("Created"))}</dt><dd title="${escape(c.created_at)}">${escape(date(c.created_at))}</dd></div><div><dt>${icon("link")}${escape(t("Source ID"))}</dt><dd class="mono">${escape(c.source_id)}</dd></div></dl>
    <div class="inspector-section"><h4>${escape(t("Case record"))}</h4><p>${escape(t("Evidence, evaluations and decision history in one portable record."))}</p><a class="export" href="/api/cases/${encodeURIComponent(c.id)}/export" download="${escape(c.id)}.json">${icon("download")}${escape(t("Export JSON"))}${icon("arrow-up-right")}</a></div><div class="inspector-note">${icon("lock")}<p>${window.caseworkDemo ? t("Browser sandbox") : t("Local sandbox")}<br><span>${escape(t("Synthetic records only"))}</span></p></div></aside></div>`;
  $("copy-case-link").onclick = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/#${c.id}`);
      toast(
        window.caseworkDemo
          ? t("Case link copied. It opens only in this tab’s practice session.")
          : t("Case link copied."),
      );
    } catch {
      toast(t("Could not copy. You can copy the case URL from the address bar."));
    }
  };
  $("previous-case").onclick = () => adjacentCase(-1);
  $("next-case").onclick = () => adjacentCase(1);
  syncCaseNavigation();
  if ($("guide-next"))
    $("guide-next").onclick = () => {
      if (evaluation && c.status === "open") {
        $("detail")
          .querySelector(
            `[data-action="${evaluation.checks.every((check) => check.passed) ? "close" : "escalate"}"]`,
          )
          .click();
      } else {
        const evidence = $("detail").querySelector("details");
        if (evidence) {
          evidence.open = true;
          evidence.querySelector("summary").focus();
          evidence.scrollIntoView({ block: "nearest" });
        }
      }
    };
  if ($("guide-decide")) $("guide-decide").onclick = () => $("detail").querySelector('[data-action="close"]').click();
  if ($("guide-scenarios")) $("guide-scenarios").onclick = () => showStart();
  $("detail")
    .querySelectorAll("[data-evidence]")
    .forEach((element) =>
      element.addEventListener("toggle", () => {
        if (!element.isConnected) return;
        const ids = expandedEvidence.get(c.id) || new Set();
        if (element.open) ids.add(element.dataset.evidence);
        else ids.delete(element.dataset.evidence);
        expandedEvidence.set(c.id, ids);
      }),
    );
  const run = $("evaluate");
  if (run)
    run.onclick = async () => {
      run.disabled = true;
      run.textContent = t("Checking evidence…");
      try {
        await api(`/api/cases/${encodeURIComponent(c.id)}/evaluate`, {});
        if (selected === c.id) {
          await loadCase(c.id, false);
          $("evaluate")?.focus({ preventScroll: true });
        }
        toast(t("Policy check recorded. Review each result before deciding."));
      } catch (e) {
        toaslocalizedError(e.message);
        run.disabled = false;
        run.innerHTML = icon("play") + t("Run policy check");
      }
    };
  $("detail")
    .querySelectorAll("[data-action]")
    .forEach(
      (button) =>
        (button.onclick = () => {
          decisionChecking = false;
          pendingAction = {
            id: c.id,
            version: c.version,
            action: button.dataset.action,
          };
          $("decision-title").textContent = {
            close: t("Review & close this case"),
            escalate: t("Escalate this investigation"),
            reopen: t("Reopen this investigation"),
          }[pendingAction.action];
          $("decision-description").textContent =
            pendingAction.action === "close"
              ? t("Accept the suggested rationale or write your own.")
              : t("Your rationale will be saved in the case history.");
          $("reason").value = drafts.get(c.id) || "";
          $("decision-error").textContent = "";
          updateDecisionHelp();
          $("decision-dialog").showModal();
          $("reason").focus();
          if (pendingAction.action === "close") checkDecision();
        }),
    );
}
let rationaleSuggestion = "";
let decisionChecking = false;
function updateDecisionHelp() {
  const check = current.events.filter(e => e.kind === "policy_evaluated" && e.payload.case_version === current.version).at(-1)?.payload;
  const closing = pendingAction.action === "close";
  const blocked = check?.checks.filter(c => !c.passed) || [];
  $("decision-readiness").textContent = !closing ? t("Saved to the case history.") : decisionChecking ? t("Checking evidence automatically…") : !check ? t("Readiness check required.") : blocked.length ? t("Closure is blocked. Unmet requirements: {checks}. Escalate for further review.", {checks: blocked.map(c => t(c.label)).join("; ")}) : t("✓ Checks passed. Ready to record.");
  $("save-decision").disabled = closing && (decisionChecking || !check || blocked.length > 0);
  const labels = current.evidence.map(e => e.label).join(", ") || t("no attached source records");
  const facts = t("This synthetic investigation concerns {subject}: {title}. The record contains {sources}.", {subject: current.subject, title: current.title, sources: labels}) + " ";
  rationaleSuggestion = facts + (pendingAction.action === "reopen" ? t("Reopening the practice case to reassess the evidence and retain the earlier decision history.") : pendingAction.action === "escalate" ? t("Escalating the practice case for further review: {checks}.", {checks: blocked.length ? blocked.map(c => t(c.label)).join("; ") : t("the alert and its supporting records")}) : t("Closing this practice case subject to the required evidence coverage, freshness and source-risk checks. This is a demonstration decision about synthetic data."));
  $("reason").placeholder = rationaleSuggestion;
  $("use-rationale").hidden = !!$("reason").value.trim();
}
function useRationale() {
  if ($("reason").value.trim()) return;
  $("reason").value = rationaleSuggestion;
  $("reason").dispatchEvent(new Event("input"));
  $("reason").focus();
  $("reason").setSelectionRange($("reason").value.length, $("reason").value.length);
}
$("use-rationale").onclick = useRationale;
$("reason").addEventListener("keydown", event => {
  if (event.key === "Tab" && !event.shiftKey && !$("reason").value.trim()) { event.preventDefault(); useRationale(); }
});
async function checkDecision() {
  const action = pendingAction;
  decisionChecking = true;
  $("decision-check").hidden = true;
  $("decision-error").textContent = "";
  updateDecisionHelp();
  try {
    await api(`/api/cases/${encodeURIComponent(action.id)}/evaluate`, {});
    const record = await api(`/api/cases/${encodeURIComponent(action.id)}`);
    if (pendingAction !== action || !$("decision-dialog").open) return;
    if (record.version !== action.version) throw new Error(t("This case changed. Close this dialog and reopen the case before deciding."));
    current = record;
    renderDetail();
  } catch (error) {
    if (pendingAction !== action || !$("decision-dialog").open) return;
    $("decision-error").textContent = localizedError(error.message);
    $("decision-check").hidden = false;
  } finally {
    if (pendingAction === action && $("decision-dialog").open) {
      decisionChecking = false;
      updateDecisionHelp();
      if (!$("decision-check").hidden) { $("save-decision").disabled = true; $("decision-readiness").textContent = t("Could not check readiness. Retry to continue."); }
    }
  }
}
$("decision-check").onclick = checkDecision;
$("decision-form").onsubmit = async (event) => {
  event.preventDefault();
  const submit = event.submitter;
  submit.disabled = true;
  try {
    const result = await api(
      `/api/cases/${encodeURIComponent(pendingAction.id)}/decisions`,
      { ...pendingAction, reason: $("reason").value },
    );
    drafts.delete(result.id);
    $("decision-dialog").close();
    await refresh();
    if (selected === result.id) await loadCase(result.id, false);
    toast(t("Decision saved with its rationale."));
  } catch (e) {
    $("decision-error").textContent = localizedError(e.message);
  } finally {
    submit.disabled = false;
  }
};
$("reason").oninput = () => {
  if (pendingAction) drafts.set(pendingAction.id, $("reason").value);
  $("use-rationale").hidden = !!$("reason").value.trim();
};
$("cancel-decision").onclick = () => $("decision-dialog").close();
window.addEventListener("beforeunload", (event) => {
  if ([...drafts.values()].some((value) => value.trim())) {
    event.preventDefault();
    event.returnValue = "";
  }
});
$("search").oninput = renderQueue;
$("status-filter").onchange = renderQueue;
[
  ["all-nav", "all"],
  ["open-nav", "open"],
  ["closed-nav", "closed"],
].forEach(
  ([id, status]) =>
    ($(id).onclick = () => {
      document
        .querySelectorAll(".nav")
        .forEach((b) => b.classList.remove("active"));
      $(id).classList.add("active");
      $("status-filter").value = status;
      if (showingStart) {
        if (visibleCases().length) {
          loadCase(visibleCases()[0].id);
          return;
        }
        requestVersion++;
        showingStart = false;
        document.querySelector(".workbench").classList.remove("onboarding");
        $("detail").innerHTML =
          `<div class="empty"><h3>${escape(t("No cases in this view"))}</h3><p>${escape(t("Choose another status or use Getting started to add a sample."))}</p></div>`;
      }
      renderQueue();
    }),
);
function fillImportScenario() {
  const choice = $("import-scenario").value;
  const subject = window.caseworkWorkspace.get().name;
  const observed_at = new Date().toISOString();
  const evidence = [
    {kind: "identity", label: "Customer profile", source: "Synthetic customer ledger", detail: `${subject} is a fictional business used for this sample. Expected monthly payment volume: USD 5,000.`, observed_at},
    {kind: "transactions", label: "Transaction extract", source: "Synthetic payment ledger", detail: "Three fictional supplier payments of USD 250, USD 280 and USD 310 triggered a repeated-payment alert. These amounts alone do not establish legitimacy.", observed_at},
    {kind: "screening", label: "Screening snapshot", source: "Synthetic screening fixture", detail: "Demo source record. No sanctions or watchlist service was queried.", observed_at}
  ];
  if (choice === "missing") evidence.pop();
  $("alert-json").value = JSON.stringify({source_id: `sandbox-${crypto.randomUUID()}`, subject, title: choice === "risk" ? "High source risk requires investigation" : "Repeated supplier payments require review", category: "Transaction monitoring", risk: choice === "risk" ? 89 : 18, evidence}, null, 2);
}
$("import-scenario").onchange = fillImportScenario;
$("import-button").onclick = () => {
  $("import-scenario").value = "payments";
  fillImportScenario();
  $("import-error").textContent = "";
  $("import-dialog").showModal();
};
$("cancel-import").onclick = () => $("import-dialog").close();
$("import-form").onsubmit = async (event) => {
  event.preventDefault();
  const submit = event.submitter;
  submit.disabled = true;
  try {
    let payload;
    try { payload = JSON.parse($("alert-json").value); }
    catch { throw new Error(t("Invalid JSON. Check the alert syntax and try again.")); }
    const result = await api("/api/alerts", payload);
    $("import-dialog").close();
    $("status-filter").value = "all";
    $("search").value = "";
    await refresh();
    await loadCase(result.id);
    toast(
      result.created
        ? t("Alert imported.")
        : t("Existing alert found; no duplicate created."),
    );
  } catch (e) {
    $("import-error").textContent = localizedError(e.message);
  } finally {
    submit.disabled = false;
  }
};

let commandItems = [],
  commandIndex = 0;
function renderCommands() {
  const query = $("command-search").value.trim().toLowerCase();
  const actions = [
    {
      label: t("Getting started and sample scenarios"),
      hint: t("Learn"),
      run: () => showStart(),
    },
    {
      label: t("Import alert"),
      hint: t("Create"),
      run: () => $("import-button").click(),
    },
    {
      label: t("Show open cases"),
      hint: t("View"),
      run: () => $("open-nav").click(),
    },
    {
      label: t("Show all investigations"),
      hint: t("View"),
      run: () => $("all-nav").click(),
    },
    {
      label: t("Show closed cases"),
      hint: t("View"),
      run: () => $("closed-nav").click(),
    },
    {
      label: t("Keyboard shortcuts"),
      hint: t("Help"),
      run: () => $("shortcuts-dialog").showModal(),
    },
    {
      label: t(document.documentElement.dataset.theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"),
      hint: t("Appearance"),
      run: toggleTheme,
    },
  ];
  commandItems = [
    ...actions,
    ...cases.map((c) => ({
      label: c.subject,
      hint: t(c.status),
      search: c.title,
      run: () => {
        $("status-filter").value = "all";
        $("search").value = "";
        loadCase(c.id);
      },
    })),
  ].filter((item) =>
    `${item.label} ${item.search || ""}`.toLowerCase().includes(query),
  );
  commandIndex = Math.max(0, Math.min(commandIndex, commandItems.length - 1));
  $("command-results").innerHTML = commandItems.length
    ? commandItems
        .map(
          (item, index) =>
            `<div role="option" id="command-${index}" aria-selected="${index === commandIndex}" class="command-option ${index === commandIndex ? "chosen" : ""}" data-command="${index}"><span>${escape(item.label)}</span><small>${escape(item.hint)}</small></div>`,
        )
        .join("")
    : `<p class="empty">${escape(t("No matching cases or commands."))}</p>`;
  if (commandItems.length)
    $("command-search").setAttribute(
      "aria-activedescendant",
      `command-${commandIndex}`,
    );
  else $("command-search").removeAttribute("aria-activedescendant");
  $("command-results")
    .querySelectorAll("[data-command]")
    .forEach(
      (item) =>
        (item.onclick = () => executeCommand(Number(item.dataset.command))),
    );
}
function executeCommand(index) {
  const item = commandItems[index];
  if (item) {
    $("command-dialog").close();
    item.run();
  }
}
function openCommands() {
  if (document.querySelector("dialog[open]")) return;
  $("command-search").value = "";
  commandIndex = 0;
  renderCommands();
  $("command-dialog").showModal();
  $("command-search").focus();
}
$("command-button").onclick = openCommands;
$("top-command").onclick = openCommands;
$("close-command").onclick = () => $("command-dialog").close();
$("shortcuts-button").onclick = () => $("shortcuts-dialog").showModal();
$("close-shortcuts").onclick = () => $("shortcuts-dialog").close();
$("command-search").oninput = () => {
  commandIndex = 0;
  renderCommands();
};
$("command-search").onkeydown = (event) => {
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    commandIndex += event.key === "ArrowDown" ? 1 : -1;
    renderCommands();
    document
      .getElementById(`command-${commandIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter") {
    event.preventDefault();
    executeCommand(commandIndex);
  }
};
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openCommands();
    return;
  }
  if (
    document.querySelector("dialog[open]") ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.target.closest('input, textarea, select, [contenteditable="true"]')
  )
    return;
  if (event.key === "/") {
    event.preventDefault();
    if (showingStart) $("all-nav").click();
    $("search").focus();
  }
  if (event.key === "?") {
    event.preventDefault();
    $("shortcuts-dialog").showModal();
  }
  if (["j", "k"].includes(event.key.toLowerCase())) {
    const visible = visibleCases();
    if (!visible.length) return;
    event.preventDefault();
    const index = visible.findIndex((c) => c.id === selected);
    const next =
      visible[
        Math.max(
          0,
          Math.min(
            visible.length - 1,
            index + (event.key.toLowerCase() === "j" ? 1 : -1),
          ),
        )
      ];
    loadCase(next.id).then(() => {
      const row = [...$("cases").querySelectorAll("[data-id]")].find(
        (b) => b.dataset.id === next.id,
      );
      row?.focus({ preventScroll: true });
      row?.scrollIntoView({ block: "nearest" });
    });
  }
});
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (cases.some((c) => c.id === id)) loadCase(id, false);
  else if (!id || id === "start") showStart(false);
});
function practiceGuide(c, evaluation) {
  const match = c.source_id.match(
    /^practice-(ready|high-risk|missing-evidence|stale-evidence|future-evidence|history)-/,
  );
  if (!match) return "";
  const explanations = {
    ready:
      t("Open the decision, press Tab to accept the sample rationale, then record it. Checks run automatically; the source records are here whenever you want to inspect them."),
    "high-risk":
      t("This sample has complete, fresh evidence and a high source risk score. Run the check, try closing to see the guardrail, then escalate with your rationale."),
    "missing-evidence":
      t("The screening record is missing. Inspect the sources and run the check: a low source risk score cannot replace missing evidence."),
    "stale-evidence":
      t("Open the screening snapshot and inspect its observation time. It is 48 hours old; the demo policy allows 24 hours."),
    "future-evidence":
      t("The screening timestamp is one hour in the future. Run the check to see how a source clock problem blocks closure."),
    history:
      t("This sample already has a recorded evaluation and closure. Export the record, then reopen it. The prior history remains; another closure needs a fresh evaluation."),
  };
  const decided = c.status !== "open";
  const reopened = c.events.some((event) => event.kind === "reopen");
  let title = t("Follow a case from evidence to decision"),
    body = explanations[match[1]];
  if (reopened) {
    title = t("The history stays with the case");
    body =
      t("Your earlier decision is still in Activity. Run a new evaluation before deciding again; the previous evaluation does not authorize a new closure.");
  } else if (decided) {
    title = t("Your decision is in the record");
    body =
      match[1] === "history"
        ? explanations.history
        : t("Your rationale and the evidence are preserved together. Download the record to inspect it, or reopen the case to continue the investigation.");
  } else if (evaluation) {
    title = evaluation.checks.every((check) => check.passed)
      ? t("The checks passed. Your review comes next.")
      : t("A blocker is visible");
    body = evaluation.checks.every((check) => check.passed)
      ? t("Accept the complete sample rationale with Tab, or edit it before recording. The evidence stays with the decision.")
      : t("Review the failed check below. A closure attempt will be rejected by the policy gate; you can escalate the case with a rationale.");
  }
  return `<section class="practice-guide" aria-label="${escape(t("Practice guide"))}"><div class="guide-kicker">${icon("play")} ${escape(t("Guided practice"))}</div><h4>${escape(title)}</h4><p>${escape(body)}</p><div class="guide-actions">${!decided && !evaluation ? `<button class="button primary" id="guide-decide">${escape(t("Record a decision"))}</button>` : ""}${decided ? `<a class="button" href="/api/cases/${encodeURIComponent(c.id)}/export" download="${escape(c.id)}.json">${icon("download")}${escape(t("Download case record"))}</a>` : `<button class="button" id="guide-next">${icon(evaluation ? "arrow-up-right" : "folder")}${evaluation ? (evaluation.checks.every((check) => check.passed) ? t("Record a decision") : t("Escalate with a rationale")) : t("Inspect the evidence")}</button>`}<button class="text-button" id="guide-scenarios">${escape(t("Try another scenario"))} ${icon("arrow-up-right")}</button></div>${decided ? `<div class="completion-next"><span>${escape(t("{count} source records · Decision history preserved · Export ready", {count: c.evidence.length}))}</span><button class="button primary" data-self-host>${escape(t("Use this workflow yourself"))} ${icon("arrow-up-right")}</button></div>` : ""}</section>`;
}
async function showStart(navigate = true) {
  const version = ++requestVersion;
  showingStart = true;
  selected = null;
  current = null;
  document.querySelector(".workbench").classList.add("onboarding");
  renderQueue();
  $("detail").removeAttribute("aria-busy");
  if (navigate && location.hash !== "#start")
    history.pushState(null, "", "#start");
  $("detail").innerHTML =
    `<div class="loading-state" role="status"><span class="loading-dot"></span> ${escape(t("Preparing your workspace…"))}</div>`;
  try {
    const [catalog, health] = await Promise.all([
      api("/api/demo/scenarios"),
      api("/api/health"),
    ]);
    if (version !== requestVersion) return;
    const first = catalog.scenarios.find((s) => s.id === "ready");
    $("detail").innerHTML =
      `<div class="start-page"><div class="start-eyebrow">${icon("layers")} ${escape(t("YOUR PRACTICE WORKSPACE"))}</div><h2>${escape(t("Your first investigation."))}<br>${escape(t("A clear path to a decision."))}</h2><div class="workspace-personalize"><span class="mini-workspace-logo" data-workspace-logo>S</span><span><strong data-workspace-name>Acme Corp</strong><small>${escape(t("Your workspace, your identity"))}</small></span><button class="button" data-personalize>${escape(t("Make it yours"))}</button></div><p class="start-intro">${escape(t("Follow the evidence, check what is missing, and record a decision you can explain. Everything here is synthetic and ready to explore."))}</p><section class="first-investigation"><div class="start-card-icon">${icon("shield-check")}</div><div><div class="start-recommendation">${escape(t("START HERE"))}</div><h3>${escape(t("Take one case all the way through"))}</h3><p>${escape(t("A complete sample, a ready-to-use rationale, and a downloadable decision record."))}</p><ol class="start-steps"><li>${escape(t("Open the sample"))}</li><li>${escape(t("Tab to accept"))}</li><li>${escape(t("Record the decision"))}</li></ol><button class="button primary" data-scenario="ready">${icon("play")}${escape(t("Start guided investigation"))}</button><span class="start-fresh">${escape(t("No signup. No API key. A real practice workflow."))}</span><div class="first-case-secondary"><button class="text-button" data-self-host>${escape(t("Or run it in your own environment"))} ${icon("arrow-up-right")}</button></div></div></section><p id="scenario-error" class="error" role="alert"></p><div class="start-section-heading"><h3>${escape(t("Explore the other paths"))}</h3><span>${escape(t("Real actions · Predictable sample outcomes"))}</span></div><div class="scenario-grid">${catalog.scenarios
        .filter((s) => s.id !== "ready")
        .map(
          (s) =>
            `<button class="scenario-card" data-scenario="${escape(s.id)}"><span class="scenario-icon">${icon(s.id === "history" ? "history" : s.id.includes("evidence") ? "folder" : "flag")}</span><strong>${escape(t(s.title))}</strong><span>${escape(t(s.description))}</span><small>${escape(t(s.outcome))}</small><span class="scenario-open">${escape(t("Open fresh sample"))} ${icon("arrow-up-right")}</span></button>`,
        )
        .join(
          "",
        )}</div><div class="start-footnote">${icon("lock")}<p>${window.caseworkDemo ? (window.caseworkDemo.storageAvailable ? t("Practice stays in this tab, expires after two hours on your next action, and can be reset at any time. Nothing you enter is sent to our server.") : t("Browser storage is unavailable. Practice lasts until this page reloads. Nothing you enter is sent to our server.")) : health.storage === "temporary" ? t("This workspace is disposable. Its data is removed when the server stops.") : t("Your cases are saved in this workspace and kept across restarts.")}<br>${escape(t("Samples use current timestamps, except the deliberately stale and future scenarios. No model or external data service is connected."))}</p></div></div>`;
    window.caseworkWorkspace?.apply();
    $("detail").scrollTop = 0;
    $("detail")
      .querySelectorAll("[data-scenario]")
      .forEach(
        (button) =>
          (button.onclick = async () => {
            $("scenario-error").textContent = "";
            $("detail")
              .querySelectorAll("[data-scenario]")
              .forEach((b) => (b.disabled = true));
            try {
              const created = await api(
                `/api/demo/scenarios/${encodeURIComponent(button.dataset.scenario)}`,
                {},
              );
              if (version === requestVersion) {
                $("status-filter").value = "all";
                $("search").value = "";
              }
              await refresh();
              if (version === requestVersion) {
                await loadCase(created.id);
                if (innerWidth <= 640)
                  $("detail").scrollIntoView({ block: "start" });
              } else toast(t("Practice case added to the queue."));
            } catch (error) {
              if (version === requestVersion) {
                $("scenario-error").textContent = localizedError(error.message);
                $("detail")
                  .querySelectorAll("[data-scenario]")
                  .forEach((b) => (b.disabled = false));
              } else toaslocalizedError(error.message);
            }
          }),
      );
  } catch (error) {
    if (version !== requestVersion) return;
    $("detail").innerHTML =
      `<div class="empty"><h3>${escape(t("We couldn't load the practice workspace"))}</h3><p>${escape(localizedError(error.message))}</p><button class="button" id="retry-start">${escape(t("Try again"))}</button></div>`;
    $("retry-start").onclick = () => showStart(false);
  }
}
$("start-nav").onclick = () => showStart();
$("start-button").onclick = () => showStart();

async function initialize() {
  try {
    await refresh();
    const linked = cases.find((c) => c.id === location.hash.slice(1));
    if (linked) await loadCase(linked.id, false);
    else await showStart(false);
  } catch (error) {
    $("cases").innerHTML =
      `<div class="empty"><p>${escape(t("Could not load the queue."))}</p><button class="button" id="retry-queue">${escape(t("Try again"))}</button></div>`;
    $("retry-queue").onclick = initialize;
    toaslocalizedError(error.message);
  }
}
document.addEventListener("casework:notice", (event) => toast(event.detail));
document.addEventListener("casework:exported", () =>
  toast(
    t("Case record download started. Your evidence and decision history are included."),
  ),
);
document.addEventListener("casework:reset", async () => {
  requestVersion++;
  drafts.clear();
  expandedEvidence.clear();
  current = null;
  selected = null;
  pendingAction = null;
  history.replaceState(null, "", "#start");
  $("search").value = "";
  $("status-filter").value = "all";
  await initialize();
  toast(t("Fresh practice is ready. Your workspace appearance was kept."));
});
initialize();

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  $("theme-button").setAttribute(
    "aria-label",
    t(dark ? "Switch to light appearance" : "Switch to dark appearance"),
  );
  $("theme-button").innerHTML =
    icon(dark ? "sun" : "moon") +
    `<span>${escape(t(dark ? "Light appearance" : "Dark appearance"))}</span>`;
  $("mobile-theme-button").setAttribute(
    "aria-label",
    t(dark ? "Switch to light appearance" : "Switch to dark appearance"),
  );
  $("mobile-theme-button").title =
    t(dark ? "Switch to light appearance" : "Switch to dark appearance");
  $("mobile-theme-button").innerHTML = icon(dark ? "sun" : "moon");
  try {
    localStorage.setItem("casework-theme", theme);
  } catch {}
}
function toggleTheme() {
  setTheme(
    document.documentElement.dataset.theme === "dark" ? "light" : "dark",
  );
}
let savedTheme = "dark";
try {
  savedTheme = localStorage.getItem("casework-theme") || "dark";
} catch {}
setTheme(savedTheme === "light" ? "light" : "dark");
$("theme-button").onclick = toggleTheme;
$("mobile-theme-button").onclick = toggleTheme;

document.addEventListener("casework:language", () => {
  window.caseworkWorkspace.apply();
  setTheme(document.documentElement.dataset.theme);
  renderQueue();
  if (showingStart) showStart(false);
  else if (current) renderDetail();
  if ($("command-dialog").open) renderCommands();
  if ($("decision-dialog").open && pendingAction && current) {
    $("decision-title").textContent = t({close: "Review & close this case", escalate: "Escalate this investigation", reopen: "Reopen this investigation"}[pendingAction.action]);
    $("decision-description").textContent = t(pendingAction.action === "close" ? "Accept the suggested rationale or write your own." : "Your rationale will be saved in the case history.");
    updateDecisionHelp();
  }
});
