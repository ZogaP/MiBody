import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  timezoneId: "America/Sao_Paulo",
  acceptDownloads: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const action = (a) => page.locator(`[data-action="${a}"]`);
const fill = (n, v) => page.locator(`[name="${n}"]`).fill(String(v));
const submit = () => page.locator('dialog button[type="submit"]').click();
const wait = () => page.waitForTimeout(150);
async function stored() {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("mibody", 1);
        r.onsuccess = () => {
          const t = r.result.transaction("state");
          const g = t.objectStore("state").get("app");
          g.onsuccess = () => resolve(g.result);
          g.onerror = () => reject(g.error);
        };
      }),
  );
}
try {
  await page.goto(process.env.APP_URL || "http://localhost:4173");
  await action("onboard-skip").click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await action("new-template").click();
  await fill("name", "Treino A — Peito");
  await action("draft-new").click();
  await fill("name", "Supino reto");
  await fill("group", "Peito");
  await fill("sets", 2);
  await fill("reps", "8–12");
  await fill("kg", "20");
  await submit();
  await submit();
  assert.equal((await stored()).templates.length, 1);
  await action("start").click();
  await page.locator('[data-set-input="kg"]').first().fill("22,5");
  await page.locator('[data-set-input="reps"]').first().fill("10");
  await action("toggle-set").first().click();
  assert.equal((await stored()).active.exercises[0].sets[0].kg, 22.5);
  await page.reload();
  await action("continue").click();
  assert.equal(
    await page.locator('[data-set-input="kg"]').first().inputValue(),
    "22.5",
  );
  await page.evaluate(async () => {
    const r = indexedDB.open("mibody", 1);
    await new Promise((resolve) => (r.onsuccess = resolve));
    const db = r.result;
    const t = db.transaction("state", "readwrite"),
      s = t.objectStore("state");
    const g = s.get("app");
    g.onsuccess = () => {
      const state = g.result;
      state.active.startedAt = Date.now() - 120000;
      state.active.restUntil = Date.now() - 1000;
      s.put(state, "app");
    };
    await new Promise((resolve) => (t.oncomplete = resolve));
  });
  await page.reload();
  await action("continue").click();
  assert.match(await page.locator("#elapsed").textContent(), /^02:/);
  assert.equal((await stored()).active.restUntil, null);
  await action("pause").click();
  await action("resume").click();
  await action("finish").click();
  await action("confirm").click();
  assert.equal((await stored()).sessions.length, 1);
  assert.equal((await stored()).active, null);
  assert.match(await page.locator("dialog").textContent(), /225/);
  await action("close").first().click();
  await page.locator('[data-page="food"]').click();
  await action("add-entry").first().click();
  await action("entry-new-food").click();
  await fill("name", "Iogurte");
  await fill("reference", "100");
  for (const [n, v] of Object.entries({
    kcal: 100,
    protein: 10,
    carbs: 12,
    fat: 2,
  }))
    await fill(n, v);
  await submit();
  await fill("quantity", "150");
  await submit();
  assert.equal((await stored()).entries[0].quantity, 150);
  assert.match(await page.locator("main").textContent(), /150/);
  await page.locator('[data-tab="plano"]').click();
  await action("add-plan").first().click();
  await page
    .locator('[name="food-pick"]')
    .selectOption({ label: "Iogurte · 100 g" });
  await fill("quantity", "200");
  await submit();
  assert.equal((await stored()).plans.length, 1);
  assert.equal((await stored()).entries.length, 1);
  await action("consume-plan").click();
  await fill("quantity", "50");
  await submit();
  assert.equal((await stored()).entries.length, 2);
  await page.reload();
  assert.equal((await stored()).entries.length, 2);
  await page.locator('[data-page="user"]').click();
  await fill("name", "Ana");
  await fill("water", "2000");
  await fill("kcal", "1800");
  await page.locator('form[data-form="profile"] button[type="submit"]').click();
  assert.equal((await stored()).profile.name, "Ana");
  const downloadEvent = page.waitForEvent("download");
  await action("backup").click();
  const download = await downloadEvent;
  const path = await download.path();
  const before = await stored();
  await action("restore").click();
  await page.locator("#restore-file").setInputFiles(path);
  await action("confirm").click();
  assert.deepEqual(await stored(), before);
  await page.locator('[data-page="home"]').click();
  await action("add-water").click();
  await fill("ml", "300");
  await submit();
  assert.equal((await stored()).water[0].ml, 300);
  await action("add-water").click();
  await action("undo-water").click();
  assert.equal((await stored()).water.length, 0);
  await action("close").first().click();
  await action("add-body").click();
  await fill("weight", "72,5");
  await fill("waist", "80");
  await page.locator('[name="photo"]').setInputFiles("public/icon-192.png");
  await submit();
  await page.locator("dialog").waitFor({ state: "hidden" });
  assert.equal((await stored()).body[0].weight, 72.5);
  assert.match((await stored()).body[0].photo, /^data:image\/png;base64,/);
  await page.locator('[data-page="chart"]').click();
  assert.match(await page.locator("main").textContent(), /72,5/);
  await action("delete-photo").click();
  await action("confirm").click();
  assert.equal((await stored()).body[0].photo, "");
  await page.locator("dialog").waitFor({ state: "hidden" });
  assert.equal((await stored()).body[0].weight, 72.5);
  // Alterar catálogo e ficha não pode reescrever o passado.
  await page.locator('[data-page="food"]').click();
  await page.locator('[data-tab="alimentos"]').click();
  await action("edit-food").first().click();
  await fill("kcal", "200");
  await submit();
  assert.equal((await stored()).entries[0].kcal, 100);
  await action("new-recipe").click();
  await fill("name", "Iogurte em duas porções");
  await fill("yield", "2");
  await action("recipe-add").click();
  await page.locator("[data-recipe-quantity]").fill("100");
  await submit();
  assert.equal((await stored()).foods[1].kcal, 100);
  assert.equal((await stored()).foods[1].unit, "porção");
  await page.locator('[data-tab="diario"]').click();
  await action("favorite-meal").first().click();
  await fill("name", "Meu café");
  await submit();
  await page.locator('[data-tab="frequentes"]').click();
  await action("use-favorite").click();
  await page.locator('[name="target"]').selectOption("plan");
  await submit();
  assert.equal((await stored()).entries.length, 2);
  assert.equal((await stored()).plans.length, 3);
  await page.locator('[data-tab="diario"]').click();
  await action("copy-meal").first().click();
  await fill("date", "2026-01-15");
  await submit();
  assert.equal((await stored()).entries.length, 4);
  await action("copy-meal").first().click();
  await fill("date", "2026-01-15");
  await submit();
  assert.match(
    await page.locator("dialog .inline-error").textContent(),
    /já foi copiada/,
  );
  await action("close").first().click();
  assert.equal((await stored()).entries.length, 4);
  await page.locator('[data-page="workout"]').click();
  await action("edit-template").click();
  await action("draft-edit").click();
  await fill("name", "Supino com halteres");
  await submit();
  await submit();
  assert.equal((await stored()).sessions[0].exercises[0].name, "Supino reto");
  await action("duplicate-template").click();
  assert.equal((await stored()).templates.length, 2);
  await action("archive-template").last().click();
  await page.locator('[data-tab="arquivo"]').click();
  assert.match(await page.locator("main").textContent(), /cópia/);
  await page.locator('[data-page="user"]').click();
  const csvEvent = page.waitForEvent("download");
  await action("csv").click();
  assert.match((await csvEvent).suggestedFilename(), /\.csv$/);
  // Estruturas malformadas não devem abrir a confirmação nem substituir dados.
  await action("restore").click();
  await page.locator("#restore-file").setInputFiles({
    name: "invalido.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":99}'),
  });
  await page.waitForFunction(() =>
    document.querySelector("#toast").textContent.includes("Backup recusado"),
  );
  assert.match(await page.locator("#toast").textContent(), /Backup recusado/);
  assert.equal((await stored()).sessions.length, 1);
  await action("theme").click();
  await page.waitForFunction(() => document.body.classList.contains("light"));
  assert.equal(
    await page.locator("body").evaluate((e) => e.classList.contains("light")),
    true,
  );
  await action("theme").click();
  await page.waitForFunction(() => !document.body.classList.contains("light"));
  await page.locator('[data-page="home"]').click();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const destination of ["home", "workout", "food", "chart", "user"]) {
      await page.locator(`[data-page="${destination}"]`).click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `layout ${destination} width ${width}`,
      );
    }
  }
  await page.locator('[data-page="home"]').click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  await context.setOffline(true);
  await page.reload();
  await page.locator("h1").waitFor();
  await action("quick-water").click();
  assert.equal((await stored()).water.length, 1);
  await page.reload();
  assert.equal((await stored()).water.length, 1);
  assert.match(await page.locator("#online-status").textContent(), /offline/);
  // Falha de quota precisa ser visível e não pode ser apresentada como sucesso.
  await page.evaluate(() => {
    window.originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Quota simulada pelo teste", "QuotaExceededError");
    };
  });
  await action("quick-water").click();
  await page.locator("#storage-error").waitFor({ state: "visible" });
  assert.equal((await stored()).water.length, 1);
  assert.match(await page.locator("#toast").textContent(), /Gravação pendente/);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = window.originalPut;
  });
  await action("quick-water").click();
  await page.locator("#storage-error").waitFor({ state: "hidden" });
  assert.equal((await stored()).water.length, 3);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: treino, recuperação, relógio, histórico preservado, nutrição, plano separado, receita, favoritos, cópia sem duplicidade, perfil, backup/restauração, CSV, água, medidas, fotos e exclusão, temas, cinco telas em quatro larguras, gravação offline e falha/recuperação de armazenamento.",
  );
} finally {
  await browser.close();
}
