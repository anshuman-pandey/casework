// Exercise the same six-language workflow against Python and the static browser demo.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const { spawn, execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const languages = ["en", "de", "es", "ja", "zh-Hans", "zh-Hant"];
const browserLocales = ["en-US", "de-DE", "es-ES", "ja-JP", "zh-CN", "zh-TW"];
const catalogs = Object.fromEntries(languages.map(code => [code, require(`../locales/${code}.json`)]));
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "casework-languages-"));
  let browser, local, demo;
  try {
    execFileSync("python3", ["scripts/build_locales.py", "--check"], {cwd: root});
    const demoDir = path.join(dir, "demo");
    execFileSync("python3", ["scripts/build_demo.py", "--output", demoDir], {cwd: root});
    local = spawn("python3", ["-m", "casework", "--port", "0", "--db", path.join(dir, "cases.db")], {cwd: root});
    const localBase = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server startup timed out")), 10000);
      local.on("error", reject);
      local.stdout.on("data", chunk => {
        const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timer); resolve(match[0]); }
      });
      local.on("exit", code => { clearTimeout(timer); reject(new Error(`Server exited ${code}`)); });
    });
    // Drain the server log so the pipe cannot block a long test run.
    local.stderr.on("data", () => {});
    demo = http.createServer((req, res) => {
      const pathname = new URL(req.url, "http://localhost").pathname;
      const file = path.resolve(demoDir, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!file.startsWith(demoDir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.writeHead(404); res.end(); return;
      }
      res.setHeader("Content-Type", {".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css", ".woff2":"font/woff2"}[path.extname(file)] || "text/plain");
      res.end(fs.readFileSync(file));
    });
    await new Promise(resolve => demo.listen(0, "127.0.0.1", resolve));
    browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : chromium.executablePath()), headless:true, args:["--no-sandbox"]});
    fs.mkdirSync(path.join(root, "test-results"), {recursive:true});
    for (const [mode, base] of [["local", localBase], ["demo", `http://127.0.0.1:${demo.address().port}`]]) {
      for (const [index, code] of languages.entries()) {
        const text = catalogs[code];
        const context = await browser.newContext({locale: browserLocales[index], viewport:{width:1440,height:1100}, reducedMotion:"reduce"});
        const page = await context.newPage(), errors = [], apiRequests = [];
        page.on("pageerror", e => errors.push(e.message));
        page.on("request", r => { if (new URL(r.url()).pathname.startsWith("/api/")) apiRequests.push(r.url()); });
        const request = (url, body) => page.evaluate(async ({url, body}) => window.caseworkDemo ? window.caseworkDemo.request(url, body) : (await fetch(url, body === undefined ? {} : {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})).json(), {url, body});
        await page.goto(base);
        await page.getByRole("button", {name:text["Start guided investigation"],exact:true}).waitFor();
        assert.equal(await page.locator("html").getAttribute("lang"), code, "Browser locale is matched");
        assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
        assert.equal(await page.getByLabel(text.Language, {exact:true}).inputValue(), code);
        for (const width of [320,390,768,1440]) {
          await page.setViewportSize({width,height:1100});
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode}/${code}: onboarding overflow at ${width}`);
          assert.ok(await page.locator("#language-select").isVisible());
        }
        if (mode === "demo") await page.screenshot({path:path.join(root,`test-results/language-${code}-desktop.png`)});
        await page.locator('[data-scenario="ready"]').click();
        await page.locator("#guide-decide").waitFor();
        const id = new URL(page.url()).hash.slice(1);
        const original = await request(`/api/cases/${id}`);
        await page.locator("#guide-decide").click();
        await page.waitForFunction(() => !document.querySelector("#save-decision").disabled);
        assert.equal(await page.locator("#decision-title").textContent(), text["Review & close this case"]);
        assert.equal(await page.locator("#decision-readiness").textContent(), text["✓ Checks passed. Ready to record."]);
        await page.locator("#reason").press("Tab");
        const reason = await page.locator("#reason").inputValue();
        assert.ok(reason.includes(text["Closing this practice case subject to the required evidence coverage, freshness and source-risk checks. This is a demonstration decision about synthetic data."]));
        assert.ok(reason.includes(original.subject));
        // A locale switch cannot replace an accepted/edited draft, alter the case or authorize a decision.
        await page.evaluate(() => window.caseworkI18n.setLocale("en"));
        assert.equal(await page.locator("#reason").inputValue(), reason);
        await page.evaluate(code => window.caseworkI18n.setLocale(code), code);
        await page.locator("#reason").press("Tab");
        assert.notEqual(await page.evaluate(() => document.activeElement.id), "reason", "Tab leaves a filled field");
        await page.setViewportSize({width:390,height:900});
        assert.ok(await page.evaluate(() => document.querySelector("#decision-dialog").scrollWidth <= innerWidth));
        if (mode === "demo") await page.screenshot({path:path.join(root,`test-results/language-${code}-mobile.png`)});
        await page.locator("#save-decision").click();
        await page.getByRole("heading", {name:text["Your decision is in the record"],exact:true}).waitFor();
        const closed = await request(`/api/cases/${id}/export`);
        assert.equal(closed.status,"closed");
        assert.equal(closed.events.at(-1).payload.reason,reason);
        assert.deepEqual(closed.evidence,original.evidence,"Evidence is never translated");
        await page.locator("#language-select").selectOption(code === "de" ? "ja" : "de");
        assert.deepEqual(await request(`/api/cases/${id}/export`),closed,"Language switch does not mutate exported records");
        await page.locator("#language-select").selectOption(code);
        await page.reload();
        await page.getByRole("heading", {name:text["Your decision is in the record"],exact:true}).waitFor();
        assert.equal(await page.locator("html").getAttribute("lang"),code,"Saved preference survives reload");
        await page.setViewportSize({width:1440,height:1100});
        await page.locator("#top-command").click();
        await page.locator("#command-search").fill(text["Show open cases"]);
        assert.equal(await page.locator("#command-results [role=option]").count(),1,"Commands can be searched in the chosen language");
        await page.keyboard.press("Escape");
        await page.locator("#import-button").click();
        await page.locator("#alert-json").fill("{");
        await page.locator('#import-form button[type="submit"]').click();
        assert.equal(await page.locator("#import-error").textContent(),text["Invalid JSON. Check the alert syntax and try again."]);
        const sample = {source_id:`language-${mode}-${code}`,subject:"<b>Customer</b>",title:"Record decision",category:"Open",risk:18,evidence:[]};
        await page.locator("#alert-json").fill(JSON.stringify(sample));
        await page.locator('#import-form button[type="submit"]').click();
        await page.getByRole("heading",{name:sample.subject,exact:true}).waitFor();
        assert.equal(await page.locator(".trigger p").textContent(),sample.title,"User text matching a UI key stays original");
        assert.equal(await page.locator("#detail h3 b").count(),0,"Case content stays escaped");
        await page.locator('[data-action="close"]').click();
        await page.waitForFunction(() => document.querySelector("#decision-readiness").textContent.includes(window.caseworkI18n.t("All three required evidence types present")));
        assert.ok(await page.locator("#save-decision").isDisabled(),"Blocked evidence cannot close in any locale");
        await page.locator("#cancel-decision").click();
        assert.deepEqual(errors,[]);
        if(mode === "demo") assert.deepEqual(apiRequests,[],"Demo stays browser-only");
        await context.close();
        console.log(`PASS ${mode}/${code}: detection, layout, Tab decision, drafts, export integrity, reload, search, validation and blocked closure`);
      }
    }
    // Restricted storage and unsupported language still leave a usable workspace.
    const context = await browser.newContext({locale:"fr-FR"});
    await context.addInitScript(() => { Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked");}}); });
    const page = await context.newPage();
    await page.goto(localBase);
    await page.locator('[data-scenario="ready"]').waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"),"en");
    await page.locator("#language-select").selectOption("ja");
    await page.getByRole("button",{name:catalogs.ja["Start guided investigation"],exact:true}).waitFor();
    assert.equal(await page.evaluate(() => window.caseworkI18n.t("__proto__")),"__proto__");
    assert.deepEqual(await page.evaluate(() => ["zh-Hans-HK", "zh-Hant-CN", "zh-HK", "zh-SG"].map(window.caseworkI18n.resolveLanguage)), ["zh-Hans", "zh-Hant", "zh-Hant", "zh-Hans"]);
    await context.close();
  } finally {
    if(browser) await browser.close();
    if(local) local.kill();
    if(demo) await new Promise(resolve => demo.close(resolve));
    fs.rmSync(dir,{recursive:true,force:true});
  }
})().catch(error => {console.error(error);process.exitCode=1;});
