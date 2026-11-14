// Browser regression checks for the public build. CI runs this outside the managed Sites preview.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { execFileSync } = require("node:child_process");
(async () => {
  const root = path.resolve(__dirname, ".."),
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "casework-demo-ui-"));
  let browser, server;
  try {
    execFileSync("python3", ["scripts/build_demo.py", "--output", dir], {
      cwd: root,
    });
    server = http.createServer((req, res) => {
      const pathname = new URL(req.url, "http://localhost").pathname;
      const file = path.resolve(
        dir,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (
        !file.startsWith(dir + path.sep) ||
        !fs.existsSync(file) ||
        !fs.statSync(file).isFile()
      ) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".woff2": "font/woff2",
          ".json": "application/json",
        }[path.extname(file)] || "text/plain",
      );
      res.end(fs.readFileSync(file));
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({
      executablePath:
        process.env.CHROMIUM_PATH ||
        (fs.existsSync("/usr/bin/chromium")
          ? "/usr/bin/chromium"
          : chromium.executablePath()),
      headless: true,
      args: ["--no-sandbox"],
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 },
        reducedMotion: "reduce",
      }),
      other = await browser.newContext();
    const page = await context.newPage(),
      visitor = await other.newPage(),
      errors = [],
      apiRequests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (new URL(r.url()).pathname.startsWith("/api/"))
        apiRequests.push(r.url());
    });
    await page.goto(base);
    await page.getByRole("button", {name: "Switch to light appearance", exact: true}).waitFor();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.getByRole("button", {name: "Switch to light appearance", exact: true}).click();
    await page
      .getByRole("button", { name: "Start guided investigation", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Make it yours", exact: true })
      .click();
    await page
      .getByLabel("Business or workspace name")
      .fill("<img src=x onerror=alert(1)>");
    await page
      .getByRole("button", { name: "Save workspace", exact: true })
      .click();
    assert.equal(
      await page.locator("[data-workspace-name]").first().textContent(),
      "<img src=x onerror=alert(1)>",
    );
    assert.equal(await page.locator("[data-workspace-name] img").count(), 0);
    await page
      .getByRole("button", { name: "Make it yours", exact: true })
      .click();
    await page.getByLabel("Business or workspace name").fill("Orbit Pay");
    await page
      .getByLabel("Workspace logo", { exact: true })
      .setInputFiles({
        name: "logo.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGMwKAgAAAHEAPFSyqHAAAAAAElFTkSuQmCC",
          "base64",
        ),
      });
    await page.locator("#logo-preview img").waitFor();
    await page
      .getByRole("button", { name: "Save workspace", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Make it yours", exact: true })
      .click();
    let download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export workspace appearance", exact: true })
      .click();
    let file = await download;
    let chunks = [];
    for await (const c of await file.createReadStream()) chunks.push(c);
    const config = JSON.parse(Buffer.concat(chunks));
    assert.equal(config.name, "Orbit Pay");
    assert.match(config.logo, /^data:image\/png;base64,/);
    await page
      .getByRole("button", { name: "Remove logo", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save workspace", exact: true })
      .click();
    await visitor.goto(base);
    await visitor
      .getByRole("button", { name: "Start guided investigation", exact: true })
      .waitFor();
    assert.equal(
      await visitor.locator("[data-workspace-name]").first().textContent(),
      "Acme Corp",
    );
    await visitor
      .getByRole("button", { name: "Make it yours", exact: true })
      .click();
    await visitor
      .getByLabel("Import appearance JSON", { exact: true })
      .setInputFiles({
        name: "workspace.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify({ ...config, logo: "" })),
      });
    await visitor
      .getByText("Configuration loaded. Save to apply it.")
      .waitFor();
    await visitor
      .getByRole("button", { name: "Save workspace", exact: true })
      .click();
    assert.equal(
      await visitor.locator("[data-workspace-name]").first().textContent(),
      "Orbit Pay",
    );
    fs.mkdirSync(path.join(root, "test-results"), { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await page.locator("#toast").waitFor({ state: "hidden" });
    await page.screenshot({
      path: path.join(root, "test-results/demo-start.png"),
    });
    await page
      .getByRole("button", { name: "Start guided investigation", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Juniper Studio", exact: true })
      .waitFor();
    const caseId = page.url().split("#")[1];
    const otherError = await visitor.evaluate(async (id) => {
      try {
        await caseworkDemo.request("/api/cases/" + id);
        return null;
      } catch (e) {
        return e.message;
      }
    }, caseId);
    assert.match(otherError, /not found/);
    await page
      .getByRole("button", { name: "Inspect the evidence", exact: true })
      .click();
    await page
      .getByText(/Juniper Studio is a fictional design business/)
      .waitFor();
    assert.equal(await page.locator(".technical-details").first().getAttribute("open"), null);
    await page.getByRole("button", {name: "Review & close", exact: true}).click();
    assert.equal(await page.locator("#save-decision").isDisabled(), true);
    await page.getByLabel("Decision rationale").focus();
    await page.keyboard.press("Tab");
    assert.match(await page.getByLabel("Decision rationale").inputValue(), /Juniper Studio/);
    await page.getByRole("button", {name: "Check readiness to close", exact: true}).click();
    await page.getByText(/All three readiness checks pass/).waitFor();
    assert.equal(await page.locator("#save-decision").isEnabled(), true);
    await page.locator("#save-decision").click();
    await page.getByText(/Replace the bracketed prompt/).waitFor();
    await page.screenshot({path:path.join(root,"test-results/demo-decision.png")});
    await page
      .getByLabel("Decision rationale")
      .fill(
        "Reviewed the three synthetic sources and recorded this practice decision.",
      );
    await page
      .getByRole("button", { name: "Record decision", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Your decision is in the record" })
      .waitFor();
    download = page.waitForEvent("download");
    await page
      .getByRole("link", { name: "Download case record", exact: true })
      .click();
    file = await download;
    chunks = [];
    for await (const c of await file.createReadStream()) chunks.push(c);
    const record = JSON.parse(Buffer.concat(chunks));
    assert.equal(record.status, "closed");
    assert.equal(record.demo_mode, "browser-sandbox");
    assert.equal(
      record.events.at(-1).payload.reason,
      "Reviewed the three synthetic sources and recorded this practice decision.",
    );
    await page.reload();
    await page
      .getByRole("heading", { name: "Your decision is in the record" })
      .waitFor();
    assert.equal(
      await page.locator("[data-workspace-name]").first().textContent(),
      "Orbit Pay",
    );
    await page
      .getByRole("button", { name: "Use this workflow yourself" })
      .click();
    await page
      .getByRole("heading", { name: "This workspace. Your environment." })
      .waitFor();
    assert.match(
      await page.locator("#version-download").getAttribute("href"),
      /v0\.2\.0-preview\.2\.zip$/,
    );
    await page.getByRole("button", { name: "Close self-host guide" }).click();
    await page.locator("#toast").waitFor({ state: "hidden" });
    await page.screenshot({
      path: path.join(root, "test-results/demo-case.png"),
    });
    await page
      .getByRole("button", { name: "Switch to dark appearance", exact: true })
      .click();
    await page.mouse.move(1200, 30);
    await page.screenshot({
      path: path.join(root, "test-results/demo-dark.png"),
    });
    await page
      .getByRole("button", { name: "Switch to light appearance", exact: true })
      .click();
    await page.getByRole("button", { name: "Personalize workspace" }).click();
    await page.getByRole("button", { name: "Reset practice cases…" }).click();
    await page.getByRole("button", { name: "Keep my cases" }).click();
    await page.getByRole("button", { name: "Reset practice cases…" }).click();
    await page
      .getByRole("button", { name: "Reset this sandbox", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Start guided investigation", exact: true })
      .waitFor();
    assert.equal(await page.locator("#total").textContent(), "6");
    assert.equal(
      await page.locator("[data-workspace-name]").first().textContent(),
      "Orbit Pay",
    );
    await page.locator("#toast").waitFor({ state: "hidden" });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${width}`,
      );
      if (width === 390)
        await page.screenshot({
          path: path.join(root, "test-results/demo-mobile.png"),
          fullPage: true,
        });
    }
    await page.getByRole("button", {name:"Import alert", exact:true}).click();
    const sample = JSON.parse(await page.locator("#alert-json").inputValue());
    assert.equal(sample.subject, "Orbit Pay"); assert.equal(sample.evidence.length, 3);
    await page.getByLabel("Start from a scenario").selectOption("missing");
    assert.equal(JSON.parse(await page.locator("#alert-json").inputValue()).evidence.length, 2);
    await page.getByLabel("Start from a scenario").selectOption("risk");
    assert.equal(JSON.parse(await page.locator("#alert-json").inputValue()).risk, 89);
    await page.getByLabel("Start from a scenario").selectOption("payments");
    await page.getByRole("button",{name:"Validate & import",exact:true}).click();
    await page.getByRole("heading",{name:"Orbit Pay",exact:true}).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(apiRequests, []);
    console.log(
      "PASS public UI: branding/logo/config export and import, independent visitors, source inspection, policy, decision, record download, reload, self-host guide, reset, themes, 4 widths; zero API requests.",
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((r) => server.close(r));
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
