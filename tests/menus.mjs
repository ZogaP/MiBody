import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const p = await context.newPage(),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const click = (a) => p.locator(`[data-action="${a}"]`).first().click();
const submit = () => p.locator("dialog [type=submit]").click();
const tab = (name) =>
  p.locator(`[data-action=food-tab][data-tab=${name}]`).click();
const option = (id) =>
  p.locator(`[data-action=meal-option][data-id=${id}]`).click();
const stored = () =>
  p.evaluate(
    () =>
      new Promise((resolve) => {
        const r = indexedDB.open("mibody", 1);
        r.onsuccess = () => {
          const g = r.result
            .transaction("state")
            .objectStore("state")
            .get("app");
          g.onsuccess = () => resolve(g.result);
        };
      }),
  );
const dateRows = (s, date) => s.planDays.find((d) => d.date === date).items;
const label = async (key, name, values) => {
  await p.locator(`[data-action=option-label][data-key=${key}]`).click();
  await p.locator("[name=name]").fill(name);
  for (const [field, value] of Object.entries(values))
    await p.locator(`[name=${field}]`).fill(String(value));
  await submit();
};
await p.addInitScript(() => localStorage.setItem("mibody-local-mode", "true"));
try {
  await p.goto(process.env.APP_URL || "http://localhost:4173");
  await click("onboard-skip");
  await p.locator("[data-page=food]").click();
  await p.locator("#date").fill("2026-10-21");
  await tab("plano");
  await click("budget-preview");
  await submit();
  const defaults = (await stored()).plans;
  await tab("opcoes");
  assert.equal(await p.locator(".meal-option").count(), 10);
  await p.locator("[data-action=option-group][data-group=main]").click();
  assert.equal(await p.locator(".meal-option").count(), 8);
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await option("chicken-carrot");
  const oldTotal = await p.locator("#option-totals").textContent();
  await p.locator("[name=portion-rice]").fill("230");
  assert.notEqual(await p.locator("#option-totals").textContent(), oldTotal);
  await submit();
  let s = await stored();
  assert.deepEqual(s.plans, defaults);
  assert.equal(s.entries.length, 0);
  assert.equal(s.profile.kcal, "");
  let lunch = dateRows(s, "2026-10-21").filter((r) => r.meal === "Almoço");
  assert.equal(lunch.length, 5);
  assert.equal(lunch[0].quantity, 230);
  await p.locator(`[data-action=edit-plan][data-id="${lunch[0].id}"]`).click();
  await p.locator("[name=quantity]").fill("240");
  await submit();
  await p
    .locator(`[data-action=consume-plan][data-id="${lunch[0].id}"]`)
    .click();
  await p.locator("[name=quantity]").fill("120");
  await submit();
  s = await stored();
  assert.equal(s.entries.length, 1);
  assert.equal(s.entries[0].quantity, 120);
  assert.equal(
    dateRows(s, "2026-10-21").find((r) => r.id === lunch[0].id).quantity,
    240,
  );
  const firstDay = dateRows(s, "2026-10-21");
  await p.locator("#date").fill("2026-10-22");
  await tab("opcoes");
  await option("pasta-beef");
  assert.match(await p.locator("dialog").textContent(), /Peso seco/);
  await p.locator("[name=meal]").selectOption("Jantar");
  await submit();
  s = await stored();
  assert.deepEqual(dateRows(s, "2026-10-21"), firstDay);
  assert.equal(
    dateRows(s, "2026-10-22").filter((r) => r.meal === "Jantar").length,
    5,
  );
  await click("copy-plan-day");
  await p.locator("dialog [name=date]").fill("2026-10-23");
  await submit();
  s = await stored();
  assert.equal(
    dateRows(s, "2026-10-23").length,
    dateRows(s, "2026-10-22").length,
  );
  assert.notEqual(
    dateRows(s, "2026-10-23")[0].id,
    dateRows(s, "2026-10-22")[0].id,
  );
  await tab("opcoes");
  await p.locator("[data-action=option-group][data-group=shake]").click();
  assert.equal(await p.locator(".meal-option").count(), 2);
  await option("shake-strawberry");
  await submit();
  assert.match(await p.locator(".inline-error").textContent(), /rótulo/);
  await p.locator("[name=portion-whey]").fill("35");
  await label("milk", "Leite do rótulo de teste", {
    kcal: 60,
    protein: 3,
    carbs: 5,
    fat: 3,
    fiber: 0,
    sodium: 40,
  });
  assert.equal(await p.locator("[name=portion-whey]").inputValue(), "35");
  assert.notEqual(await p.locator("[name=label-milk]").inputValue(), "");
  await label("whey", "Whey do rótulo de teste", {
    kcal: 120,
    protein: 24,
    carbs: 3,
    fat: 1,
    fiber: 0,
    sodium: 50,
  });
  assert.match(await p.locator("#option-totals").textContent(), /335 kcal/);
  await p.locator("[name=portion-whey]").fill("30");
  for (const width of [320, 390]) {
    await p.setViewportSize({ width, height: 844 });
    assert.equal(
      await p.locator("dialog").evaluate((e) => e.scrollWidth > e.clientWidth),
      false,
    );
  }
  await submit();
  s = await stored();
  assert.equal(
    dateRows(s, "2026-10-23").filter((r) => r.meal === "Café da manhã").length,
    3,
  );
  await tab("opcoes");
  await option("shake-strawberry");
  await p.locator("[name=meal]").selectOption("Lanche da tarde");
  assert.match(await p.locator("#option-totals").textContent(), /315 kcal/);
  await submit();
  await p.reload();
  await p.locator("[data-page=food]").click();
  await tab("plano");
  await p.locator("#date").fill("2026-10-23");
  assert.match(await p.locator("main").textContent(), /Cardápio próprio/);
  s = await stored();
  assert.equal(s.entries.length, 1);
  assert.deepEqual(s.plans, defaults);
  assert.equal(
    dateRows(s, "2026-10-23").filter((r) => r.meal === "Lanche da tarde")
      .length,
    3,
  );
  await p.locator("[data-page=user]").click();
  const event = p.waitForEvent("download");
  await click("backup");
  const file = await (await event).path(),
    before = await stored();
  await click("restore");
  await p.locator("#restore-file").setInputFiles(file);
  await click("confirm");
  assert.deepEqual(await stored(), before);
  await p.locator("[data-page=food]").click();
  await tab("plano");
  await p.locator("#date").fill("2026-10-23");
  await click("reset-plan-day");
  await click("confirm");
  s = await stored();
  assert.equal(s.planDays.length, 2);
  assert.equal(s.entries.length, 1);
  await tab("opcoes");
  await mkdir("test-results", { recursive: true });
  await p.screenshot({
    path: "test-results/opcoes-cardapio.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: dez opções, filtros, porções e totais, escolha e cópia por data, rótulos reutilizados, consumo separado, padrão e outros dias preservados, backup, persistência e layout móvel.",
  );
} finally {
  await browser.close();
}
