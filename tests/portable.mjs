import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";

const html = readFileSync("index.html", "utf8");
let redirect;
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)[1];
runInNewContext(bootstrap, {
  URL,
  location: {
    protocol: "file:",
    href: "file:///Downloads/MiBody-main/index.html",
    replace: (url) => (redirect = url),
  },
  document: { documentElement: { dataset: {} } },
});
assert.equal(redirect, "file:///Downloads/MiBody-main/MiBody.html");

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const p = await context.newPage();
const errors = [],
  networkAssets = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("request", (r) => {
  if (r.url().startsWith("http") && r.resourceType() !== "document")
    networkAssets.push(r.url());
});
const click = (a) => p.locator(`[data-action="${a}"]`).first().click();
const fill = (name, value) => p.locator(`[name="${name}"]`).fill(String(value));
const submit = () => p.locator("dialog button[type=submit]").click();
try {
  await p.goto(process.env.PORTABLE_URL || "http://localhost:4173/MiBody.html");
  await click("onboard-skip");
  assert.equal(await p.locator("html").getAttribute("data-portable"), "true");
  await click("new-template");
  await fill("name", "Treino local");
  await click("draft-new");
  await fill("name", "Agachamento");
  await submit();
  await submit();
  await click("start");
  await p.locator("[data-set-input=kg]").first().fill("20");
  await p.locator("[data-set-input=reps]").first().fill("12");
  await click("toggle-set");
  await p.reload();
  await click("continue");
  assert.equal(
    await p.locator("[data-set-input=kg]").first().inputValue(),
    "20",
  );
  await p.locator("[data-page=home]").click();
  await context.setOffline(true);
  await click("quick-water");
  await p.waitForFunction(() =>
    document.querySelector("#toast").textContent.includes("Água registrada"),
  );
  assert.match(await p.locator("main").textContent(), /0,25/);
  await context.setOffline(false);
  await p.reload();
  assert.match(await p.locator("main").textContent(), /0,25/);
  await p.locator("[data-page=user]").click();
  assert.match(await p.locator("main").textContent(), /arquivo único/);
  const download = p.waitForEvent("download");
  await click("backup");
  assert.match((await download).suggestedFilename(), /\.json$/);
  assert.deepEqual(
    networkAssets,
    [],
    "O HTML autocontido não pode depender de CSS, JS, ícones ou serviços externos.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: redirecionamento do index local, HTML autocontido sem requisições externas, criação e recuperação de treino, água sem rede, persistência e backup. Execução via file: não testada: o navegador gerenciado bloqueia esse protocolo.",
  );
} finally {
  await browser.close();
}
