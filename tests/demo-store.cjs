const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const {
  createStore,
  evaluate,
  canonical,
} = require("../casework/web/demo-store.js");
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "casework-contract-"));
  try {
    execFileSync("python3", ["scripts/build_demo.py", "--output", dir], {
      cwd: path.resolve(__dirname, ".."),
    });
    vm.runInThisContext(
      fs.readFileSync(path.join(dir, "demo-data.js"), "utf8"),
    );
    const fixtures = globalThis.CASEWORK_DEMO_FIXTURES;
    let saved = "",
      time = Date.now();
    const store = createStore({
      fixtures,
      read: () => saved,
      write: (v) => {
        saved = v;
      },
      clock: () => time,
    });
    assert.equal((await store.request("/api/cases")).cases.length, 6);
    for (const scenario of fixtures.scenarios) {
      let c = await store.request("/api/demo/scenarios/" + scenario.id, {});
      if (scenario.id === "history") {
        assert.equal(c.status, "closed");
        c = await store.request(`/api/cases/${c.id}/decisions`, {
          action: "reopen",
          version: 2,
          reason: "Recheck",
        });
        await assert.rejects(
          store.request(`/api/cases/${c.id}/decisions`, {
            action: "close",
            version: 3,
            reason: "Old evaluation",
          }),
          /Run the policy/,
        );
      }
      const result = await store.request(`/api/cases/${c.id}/evaluate`, {});
      assert.deepEqual(
        result.checks.map((c) => c.passed),
        scenario.checks,
      );
      // Compare the browser evaluation with the actual Python function at the same time.
      const python = execFileSync(
        "python3",
        [
          "-c",
          "import json,sys;from datetime import datetime;from casework.store import evaluate;x=json.load(sys.stdin);print(json.dumps(evaluate(x['case'],datetime.fromisoformat(x['at']))))",
        ],
        {
          cwd: path.resolve(__dirname, ".."),
          input: JSON.stringify({ case: c, at: result.evaluated_at }),
          encoding: "utf8",
        },
      );
      assert.deepEqual(JSON.parse(python).checks, result.checks);
      const before = await store.request(`/api/cases/${c.id}`);
      if (scenario.checks.every(Boolean)) {
        const closed = await store.request(`/api/cases/${c.id}/decisions`, {
          action: "close",
          version: c.version,
          reason: "Reviewed the synthetic records",
        });
        assert.equal(closed.status, "closed");
        assert.equal(
          (await store.request(`/api/cases/${c.id}/export`)).events.at(-1)
            .payload.reason,
          "Reviewed the synthetic records",
        );
        await assert.rejects(
          store.request(`/api/cases/${c.id}/decisions`, {
            action: "escalate",
            version: c.version,
            reason: "Stale",
          }),
          /Case changed/,
        );
      } else {
        await assert.rejects(
          store.request(`/api/cases/${c.id}/decisions`, {
            action: "close",
            version: c.version,
            reason: "Try closure",
          }),
          /gate blocked/,
        );
        assert.deepEqual(await store.request(`/api/cases/${c.id}`), before);
        assert.equal(
          (
            await store.request(`/api/cases/${c.id}/decisions`, {
              action: "escalate",
              version: c.version,
              reason: "Needs review",
            })
          ).status,
          "escalated",
        );
      }
    }
    let c = await store.request("/api/demo/scenarios/ready", {});
    const replay = {
      ...c,
      evidence: c.evidence.map(({ id, sha256, ...e }) => e),
    };
    assert.deepEqual(await store.request("/api/alerts", replay), {
      id: c.id,
      created: false,
    });
    await assert.rejects(
      store.request("/api/alerts", { ...replay, risk: 70 }),
      /different content/,
    );
    await assert.rejects(
      store.request("/api/alerts", { ...replay, risk: true }),
      /risk must/,
    );
    const parallel = await Promise.all(
      Array.from({ length: 3 }, () =>
        store.request("/api/demo/scenarios/ready", {}),
      ),
    );
    assert.equal(new Set(parallel.map((c) => c.id)).size, 3);
    const isolated = createStore({ fixtures });
    await assert.rejects(isolated.request(`/api/cases/${c.id}`), /not found/);
    const restored = createStore({ fixtures, read: () => saved });
    assert.equal((await restored.request(`/api/cases/${c.id}`)).id, c.id);
    await store.request(`/api/cases/${c.id}/evaluate`, {});
    time += 25 * 3600000;
    // Session TTL replaces the sandbox; expired identifiers cannot retrieve old records.
    await assert.rejects(store.request(`/api/cases/${c.id}`), /not found/);
    assert.equal((await store.request("/api/cases")).cases.length, 6);
    for (let i = 0; i < 34; i++)
      await store.request("/api/demo/scenarios/ready", {});
    await assert.rejects(
      store.request("/api/demo/scenarios/ready", {}),
      /40 cases/,
    );
    await store.reset();
    assert.equal((await store.request("/api/cases")).cases.length, 6);
    let disk = "";
    const failing = createStore({
      fixtures,
      read: () => disk,
      write: (v) => {
        if (v.includes("practice-")) throw Error("quota");
        disk = v;
      },
    });
    await failing.request("/api/cases");
    await assert.rejects(
      failing.request("/api/demo/scenarios/ready", {}),
      /quota/,
    );
    assert.equal((await failing.request("/api/cases")).cases.length, 6);
    const value = { name: "Café <studio>", nested: { z: 3, a: "日本" } };
    const py = execFileSync(
      "python3",
      [
        "-c",
        "import json,sys;from casework.store import canonical;print(canonical(json.load(sys.stdin)))",
      ],
      {
        cwd: path.resolve(__dirname, ".."),
        input: JSON.stringify(value),
        encoding: "utf8",
      },
    ).trim();
    assert.equal(canonical(value), py);
    console.log(
      "PASS browser/Python policy parity, six scenarios, export, replay, rollback, concurrent mutations, isolated stores, reload, expiry, capacity, reset and quota failure.",
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
