/* Browser-only sandbox adapter. The Python Store remains the self-hosted authority. */
(function (root) {
  const POLICY = "demo-evidence-v1",
    TTL = 2 * 60 * 60 * 1000;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const canonical = (value) => {
    const ordered = (v) =>
      Array.isArray(v)
        ? v.map(ordered)
        : v && typeof v === "object"
          ? Object.fromEntries(
              Object.keys(v)
                .sort()
                .map((k) => [k, ordered(v[k])]),
            )
          : v;
    return JSON.stringify(ordered(value)).replace(
      /[\u007f-\uffff]/g,
      (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
    );
  };
  async function hash(value) {
    const bytes = await root.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(canonical(value)),
    );
    return [...new Uint8Array(bytes)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  }
  function text(data, key, max = 200) {
    const value = data?.[key];
    if (typeof value !== "string" || !value.trim() || [...value].length > max)
      throw new Error(
        `${key} must be nonempty text, at most ${max} characters`,
      );
    return value.trim();
  }
  function validate(data) {
    if (!data || Array.isArray(data) || typeof data !== "object")
      throw new Error("Expected a JSON object");
    const result = Object.fromEntries(
      ["source_id", "subject", "title", "category"].map((k) => [
        k,
        text(data, k),
      ]),
    );
    if (!Number.isInteger(data.risk) || data.risk < 0 || data.risk > 100)
      throw new Error("risk must be an integer from 0 to 100");
    result.risk = data.risk;
    const records = data.evidence ?? [];
    if (!Array.isArray(records) || records.length > 30)
      throw new Error("evidence must be a list of at most 30 items");
    result.evidence = records.map((item) => {
      if (!item || Array.isArray(item) || typeof item !== "object")
        throw new Error("Each evidence item must be an object");
      const record = Object.fromEntries(
        ["label", "source", "detail", "observed_at"].map((k) => [
          k,
          text(item, k, k === "detail" ? 4000 : 200),
        ]),
      );
      if (
        !/(Z|[+-]\d{2}:?\d{2})$/i.test(record.observed_at) ||
        !Number.isFinite(Date.parse(record.observed_at))
      )
        throw new Error("observed_at must be an ISO timestamp with timezone");
      if (!["identity", "transactions", "screening"].includes(item.kind))
        throw new Error(
          "evidence kind must be identity, transactions or screening",
        );
      return { ...record, kind: item.kind };
    });
    return result;
  }
  function evaluate(c, at = Date.now()) {
    const kinds = new Set(c.evidence.map((e) => e.kind));
    const checks = [
      {
        label: "All three required evidence types present",
        passed: ["identity", "transactions", "screening"].every((k) =>
          kinds.has(k),
        ),
      },
      {
        label: "Evidence observed within the last 24 hours",
        passed:
          c.evidence.length > 0 &&
          c.evidence.every((e) => {
            const age = at - Date.parse(e.observed_at);
            return age >= 0 && age <= 86400000;
          }),
      },
      {
        label: "Source risk score below demo threshold of 30",
        passed: c.risk < 30,
      },
    ];
    return {
      policy: POLICY,
      mode: "deterministic-demo",
      case_version: c.version,
      evaluated_at: new Date(at).toISOString(),
      checks,
      recommendation: checks.every((c) => c.passed)
        ? "review_for_closure"
        : "investigate",
      evidence_ids: c.evidence.map((e) => e.id),
      explanation:
        "Eligibility demonstration only. Evidence content has not been verified. Human review is required.",
    };
  }
  function createStore({
    read = () => null,
    write = () => {},
    fixtures,
    clock = Date.now,
  }) {
    let state,
      queue = Promise.resolve();
    const stamp = () => new Date(clock()).toISOString();
    const id = (prefix) =>
      prefix +
      root.crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
    function event(s, c, kind, payload) {
      if (c.events.length >= 100)
        throw new Error(
          "This practice case has reached 100 events. Export it and start a fresh sample.",
        );
      c.events.push({
        seq: ++s.seq,
        case_id: c.id,
        kind,
        at: stamp(),
        payload,
      });
    }
    async function ingest(s, input) {
      const data = validate(input),
        digest = await hash(data),
        prior = s.cases.find((c) => c.source_id === data.source_id);
      if (prior) {
        if (prior.payload_hash !== digest)
          throw new Error("source_id already exists with different content");
        return { id: prior.id, created: false };
      }
      if (s.cases.length >= 40)
        throw new Error(
          "This sandbox holds 40 cases. Export your work, then reset practice in Workspace settings.",
        );
      const c = {
        ...data,
        id: id("CW-"),
        payload_hash: digest,
        status: "open",
        version: 1,
        created_at: stamp(),
        events: [],
        evidence: [],
      };
      for (const e of data.evidence)
        c.evidence.push({ ...e, id: id("EV-"), sha256: await hash(e) });
      event(s, c, "ingested", {
        source_id: c.source_id,
        actor: "browser-demo",
      });
      s.cases.push(c);
      return { id: c.id, created: true };
    }
    const find = (s, key) => {
      const c = s.cases.find((c) => c.id === key);
      if (!c)
        throw new Error(
          "Case not found in this browser sandbox. Open Getting started to begin a fresh case.",
        );
      return c;
    };
    function run(s, c) {
      if (c.status !== "open")
        throw new Error("Reopen the case before evaluating");
      const result = evaluate(c, clock());
      event(s, c, "policy_evaluated", result);
      return result;
    }
    function decide(s, c, data) {
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new Error("Expected a JSON object");
      if (!["close", "escalate", "reopen"].includes(data.action))
        throw new Error("action must be close, escalate or reopen");
      const reason = text(data, "reason", 4000);
      if (!Number.isInteger(data.version))
        throw new Error("version must be an integer");
      if (data.version !== c.version)
        throw new Error("Case changed. Refresh before deciding.");
      if ((data.action === "reopen") === (c.status === "open"))
        throw new Error("Transition is not allowed from the current status");
      if (data.action === "close") {
        if (
          !c.events.some(
            (e) =>
              e.kind === "policy_evaluated" &&
              e.payload.case_version === c.version,
          )
        )
          throw new Error("Run the policy evaluation before closing");
        if (!evaluate(c, clock()).checks.every((c) => c.passed))
          throw new Error(
            "Demo closure gate blocked. Investigate or escalate this case.",
          );
      }
      event(s, c, data.action, {
        reason,
        actor: "browser-demo",
        from_version: c.version,
        policy: POLICY,
      });
      c.status = { close: "closed", escalate: "escalated", reopen: "open" }[
        data.action
      ];
      c.version++;
      return c;
    }
    function materialize(template, source) {
      const data = clone(template);
      data.source_id = source;
      data.evidence = data.evidence.map((e) => {
        const { offset_ms = 0, ...rest } = e;
        return {
          ...rest,
          observed_at: new Date(clock() + offset_ms).toISOString(),
        };
      });
      return data;
    }
    function commit(next) {
      const serialized = JSON.stringify(next);
      if (new TextEncoder().encode(serialized).length > 2000000)
        throw new Error(
          "Sandbox storage is full. Export your work and reset practice.",
        );
      write(serialized);
      state = next;
    }
    async function initialize() {
      if (!state) {
        try {
          const saved = JSON.parse(read());
          if (
            saved?.schema === 1 &&
            saved.expires > clock() &&
            saved.cases?.length <= 40
          )
            state = saved;
        } catch {}
      }
      if (!state || state.expires <= clock()) {
        const next = { schema: 1, expires: clock() + TTL, seq: 0, cases: [] };
        for (const [i, template] of fixtures.seeds.entries())
          await ingest(next, materialize(template, `demo-${i}`));
        commit(next);
      }
    }
    async function request(path, body) {
      await initialize();
      const s = clone(state),
        parts = path.split("/").filter(Boolean),
        mutate = body !== undefined;
      let result;
      if (!mutate && path === "/api/health")
        return {
          status: "ok",
          mode: "browser-demo",
          storage: "browser-session",
          expires: state.expires,
        };
      if (!mutate && path === "/api/demo/scenarios")
        return { scenarios: clone(fixtures.scenarios) };
      if (!mutate && path === "/api/cases")
        return {
          cases: s.cases
            .sort(
              (a, b) =>
                b.risk - a.risk || b.created_at.localeCompare(a.created_at),
            )
            .map(({ evidence, events, payload_hash, source_id, ...c }) => c),
          limit: 40,
        };
      if (mutate && path === "/api/alerts") result = await ingest(s, body);
      else if (
        mutate &&
        parts.slice(0, 3).join("/") === "api/demo/scenarios" &&
        parts.length === 4
      ) {
        const key = parts[3],
          template = fixtures.templates[key];
        if (!template) throw new Error("Unknown demo scenario");
        const added = await ingest(
            s,
            materialize(template, `practice-${key}-${id("")}`),
          ),
          c = find(s, added.id);
        if (key === "history") {
          run(s, c);
          decide(s, c, {
            action: "close",
            version: 1,
            reason:
              "Synthetic walkthrough: reviewed the sample sources and recorded a demonstration decision.",
          });
        }
        result = c;
      } else if (
        parts[0] === "api" &&
        parts[1] === "cases" &&
        parts.length >= 3
      ) {
        const c = find(s, parts[2]);
        if (
          !mutate &&
          (parts.length === 3 || (parts.length === 4 && parts[3] === "export"))
        )
          return { ...clone(c), demo_mode: "browser-sandbox" };
        if (mutate && parts.length === 4 && parts[3] === "evaluate")
          result = run(s, c);
        else if (mutate && parts.length === 4 && parts[3] === "decisions")
          result = decide(s, c, body);
        else throw new Error("Not found");
      } else throw new Error("Not found");
      commit(s);
      return clone(result);
    }
    return {
      request(path, body) {
        const job = queue.then(() => request(path, body));
        queue = job.catch(() => {});
        return job;
      },
      reset() {
        const job = queue.then(async () => {
          write("");
          state = null;
          await initialize();
        });
        queue = job.catch(() => {});
        return job;
      },
    };
  }
  root.CaseworkDemoStore = { createStore, evaluate, validate, canonical };
  if (typeof module !== "undefined") module.exports = root.CaseworkDemoStore;
})(globalThis);
