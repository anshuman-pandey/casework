// Optional UI smoke test: requires Playwright and Chromium, not app dependencies.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync, existsSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "casework-ui-"));
  const server = spawn(
    "python3",
    ["-m", "casework", "--port", "0", "--db", path.join(dir, "ui.db")],
    { cwd: path.resolve(__dirname, "..") },
  );
  let browser;
  try {
    const base = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Server startup timed out")),
        10000,
      );
      server.once("error", reject);
      server.stdout.on("data", (chunk) => {
        const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) {
          clearTimeout(timer);
          resolve(match[0]);
        }
      });
      server.once("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Server exited: ${code}`));
      });
    });
    browser = await chromium.launch({
      executablePath:
        process.env.CHROMIUM_PATH ||
        (existsSync("/usr/bin/chromium")
          ? "/usr/bin/chromium"
          : chromium.executablePath()),
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.getByRole("button", {name: "Switch to light appearance", exact: true}).waitFor();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.getByRole("button", {name: "Switch to light appearance", exact: true}).click();
    await page
      .getByRole("button", { name: "Start guided investigation", exact: true })
      .waitFor();
    await page.locator("#all-nav").click();
    await page.getByRole("button", { name: /Atlas Studio/ }).click();
    await page.getByRole("heading", { name: "Atlas Studio" }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.ok(
      await page.evaluate(() =>
        [...document.fonts].some(
          (font) => font.family === "Inter" && font.status === "loaded",
        ),
      ),
      "Bundled font loads",
    );
    await page
      .getByRole("button", { name: "Switch to dark appearance" })
      .click();
    await page.reload();
    await page.getByRole("heading", { name: "Atlas Studio" }).waitFor();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page
      .getByRole("button", { name: "Switch to light appearance" })
      .click();
    await page.getByRole("button", { name: "Copy case link" }).click();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      page.url(),
    );
    await page.getByRole("button", { name: "Next case", exact: true }).click();
    await page.getByRole("heading", { name: "Fieldnote Design" }).waitFor();
    await page
      .getByRole("button", { name: "Previous case", exact: true })
      .click();
    await page.getByRole("heading", { name: "Atlas Studio" }).waitFor();
    await page.getByLabel("Search cases").fill("Atlas");
    assert.equal(
      await page
        .getByRole("button", { name: "Next case", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(
      await page
        .getByRole("button", { name: "Previous case", exact: true })
        .isDisabled(),
      true,
    );
    await page.getByLabel("Search cases").fill("");
    await page
      .locator("summary")
      .filter({ hasText: "Customer profile" })
      .click();
    await page.getByText(/Synthetic profile for Atlas Studio/).waitFor();
    await page.getByRole("button", { name: "Run policy check" }).click();
    await page.getByText("All three required evidence types present").waitFor();
    await page.getByRole("button", { name: "Review & close" }).click();
    await page
      .getByLabel("Decision rationale")
      .fill("Reviewed synthetic evidence in the browser test.");
    await page
      .getByRole("button", { name: "Record decision", exact: true })
      .click();
    await page.getByRole("button", { name: "Reopen investigation" }).waitFor();
    await page.reload();
    await page.getByRole("button", { name: /Atlas Studio/ }).click();
    await page.getByRole("button", { name: "Reopen investigation" }).waitFor();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Export JSON" }).click();
    const download = await downloadPromise;
    const chunks = [];
    for await (const chunk of await download.createReadStream())
      chunks.push(chunk);
    const exported = JSON.parse(Buffer.concat(chunks));
    assert.equal(exported.status, "closed");
    assert.equal(
      exported.events.at(-1).payload.reason,
      "Reviewed synthetic evidence in the browser test.",
    );
    await page.getByRole("button", { name: "Reopen investigation" }).click();
    await page
      .getByLabel("Decision rationale")
      .fill("Rechecking the original record.");
    await page
      .getByRole("button", { name: "Record decision", exact: true })
      .click();
    await page.getByRole("button", { name: "Run policy check" }).waitFor();
    await page.getByRole("button", { name: /Northstar Trading/ }).click();
    await page.getByRole("button", { name: "Run policy check" }).click();
    await page
      .getByText("Source risk score below demo threshold of 30")
      .waitFor();
    await page.getByRole("button", { name: "Review & close" }).click();
    await page
      .getByLabel("Decision rationale")
      .fill("Try a closure that should fail.");
    assert.equal(await page.locator("#save-decision").isDisabled(), true);
    await page.getByText(/Closure is blocked. Unmet requirements/).waitFor();
    await page.getByRole("button", { name: "Cancel decision" }).click();
    // Command menu, browser history, shortcut suppression while typing and draft retention.
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox", { name: "Search commands" }).fill("Atlas");
    await page.keyboard.press("Enter");
    await page.getByRole("heading", { name: "Atlas Studio" }).waitFor();
    const linkedUrl = page.url();
    assert.ok(linkedUrl.includes("#CW-"));
    await page.goBack();
    await page.getByRole("heading", { name: "Northstar Trading" }).waitFor();
    await page.goForward();
    await page.getByRole("heading", { name: "Atlas Studio" }).waitFor();
    await page.getByRole("button", { name: "Review & close" }).click();
    await page
      .getByLabel("Decision rationale")
      .fill("A draft kept while inspecting the source.");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Review & close" }).click();
    assert.equal(
      await page.getByLabel("Decision rationale").inputValue(),
      "A draft kept while inspecting the source.",
    );
    await page.getByLabel("Decision rationale").fill("");
    await page.keyboard.press("Escape");
    await page
      .locator("summary")
      .filter({ hasText: "Customer profile" })
      .click();
    await page.getByRole("button", { name: "Run policy check" }).click();
    await page.getByText("All three required evidence types present").waitFor();
    assert.equal(
      await page
        .locator("details")
        .filter({ hasText: "Customer profile" })
        .getAttribute("open"),
      "",
    );
    await page.keyboard.press("/");
    assert.equal(
      await page
        .getByLabel("Search cases")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.keyboard.type("j");
    await page.getByRole("heading", { name: "Atlas Studio" }).waitFor();
    await page.getByLabel("Search cases").fill("");
    await page.getByRole("button", { name: /Atlas Studio/ }).click();
    await page.keyboard.press("j");
    await page.getByRole("heading", { name: "Fieldnote Design" }).waitFor();
    await page.keyboard.press("k");
    await page.getByRole("heading", { name: "Atlas Studio" }).waitFor();
    await page.keyboard.press("Control+k");
    await page
      .getByRole("combobox", { name: "Search commands" })
      .fill("no matching command");
    await page.getByText("No matching cases or commands.").waitFor();
    await page.keyboard.press("Escape");
    // Failed navigation has a usable retry, with no stale case actions remaining.
    await page.route(
      "**/api/cases/*",
      (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "Test connection failure" }),
        }),
      { times: 1 },
    );
    await page.getByRole("button", { name: /Maya Chen/ }).click();
    await page.getByText("Test connection failure").waitFor();
    assert.equal(
      await page.getByRole("button", { name: "Review & close" }).count(),
      0,
    );
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page.getByRole("heading", { name: "Maya Chen" }).waitFor();
    await page.getByLabel("Search cases").fill("no such customer");
    await page.getByText(/No cases match these filters/).waitFor();
    await page.getByLabel("Search cases").fill("");
    await page.getByRole("button", { name: /Import alert/ }).click();
    await page.getByLabel("Alert JSON").fill(
      JSON.stringify({
        source_id: "browser-xss",
        subject: "<img src=x onerror=alert(1)>",
        title: "Escaping test",
        category: "Synthetic",
        risk: 10,
        evidence: [],
      }),
    );
    await page.getByRole("button", { name: "Validate & import" }).click();
    await page
      .getByRole("heading", { name: "<img src=x onerror=alert(1)>" })
      .waitFor();
    assert.equal(await page.locator("#detail img").count(), 0);
    await page.getByLabel("Filter by status").selectOption("escalated");
    await page.getByText(/No cases match these filters/).waitFor();
    await page.getByLabel("Filter by status").selectOption("all");
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow at ${width}`,
      );
    }
    await page.setViewportSize({ width: 390, height: 1000 });
    await page
      .getByRole("button", { name: "Switch to dark appearance" })
      .click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page
      .getByRole("button", { name: "Switch to light appearance" })
      .click();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.getByRole("button", { name: /Atlas Studio/ }).click();
    await page.getByRole("button", { name: "Run policy check" }).click();
    await page.getByText("All three required evidence types present").waitFor();
    await page.locator("#toast").waitFor({ state: "hidden" });
    if (process.env.CASEWORK_SCREENSHOT)
      await page.screenshot({
        path: process.env.CASEWORK_SCREENSHOT,
        fullPage: true,
      });
    // A newcomer completes a fresh guided case without consulting the README.
    await page.getByRole("button", { name: "Open getting started" }).click();
    await page
      .getByRole("button", { name: "Start guided investigation", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Juniper Studio", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Inspect the evidence", exact: true })
      .click();
    await page
      .getByText(/Juniper Studio is a fictional design business/)
      .waitFor();
    await page
      .getByRole("button", { name: "Run policy check", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Record a decision", exact: true })
      .click();
    await page
      .getByLabel("Decision rationale")
      .fill(
        "Reviewed the sample profile, payments and screening record in guided practice.",
      );
    await page
      .getByRole("button", { name: "Record decision", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Your decision is in the record" })
      .waitFor();
    const guidedDownloadPromise = page.waitForEvent("download");
    await page
      .getByRole("link", { name: "Download case record", exact: true })
      .click();
    const guidedDownload = await guidedDownloadPromise;
    const guidedChunks = [];
    for await (const chunk of await guidedDownload.createReadStream())
      guidedChunks.push(chunk);
    const guidedRecord = JSON.parse(Buffer.concat(guidedChunks));
    assert.equal(guidedRecord.status, "closed");
    assert.equal(guidedRecord.evidence.length, 3);
    assert.equal(
      guidedRecord.events.at(-1).payload.reason,
      "Reviewed the sample profile, payments and screening record in guided practice.",
    );
    await page
      .getByRole("button", { name: "Reopen investigation", exact: true })
      .click();
    await page
      .getByLabel("Decision rationale")
      .fill("Reopen the guided practice case.");
    await page
      .getByRole("button", { name: "Record decision", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "The history stays with the case" })
      .waitFor();
    await page
      .getByRole("button", { name: "Try another scenario", exact: true })
      .click();
    await page.route(
      "**/api/demo/scenarios/high-risk",
      (route) =>
        route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Practice creation failed; try again.",
          }),
        }),
      { times: 1 },
    );
    await page
      .getByRole("button", { name: /^Escalate a high-risk alert/ })
      .click();
    await page.getByText("Practice creation failed; try again.").waitFor();
    await page
      .getByRole("button", { name: /^Escalate a high-risk alert/ })
      .click();
    await page
      .getByRole("heading", { name: "Cedar Trading", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Run policy check", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Escalate with a rationale", exact: true })
      .click();
    await page
      .getByLabel("Decision rationale")
      .fill("Escalating the synthetic high-risk sample for review.");
    await page
      .getByRole("button", { name: "Record decision", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Your decision is in the record" })
      .waitFor();
    await page
      .getByRole("button", { name: "Try another scenario", exact: true })
      .click();
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page
        .getByRole("button", {
          name: "Start guided investigation",
          exact: true,
        })
        .waitFor();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Onboarding overflow at ${width}`,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: core investigation workflow, navigation, drafts, recovery, themes, local font, clipboard, responsive layouts, guided creation/inspection/closure/export/reopen, scenario failure/retry/escalation, no JS errors",
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((resolve) =>
      server.exitCode !== null ? resolve() : server.once("exit", resolve),
    );
    rmSync(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
