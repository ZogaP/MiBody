import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    timezoneId: "America/Sao_Paulo",
  }),
  p = await context.newPage(),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const click = (a) => p.locator(`[data-action="${a}"]`).first().click();
const submit = () => p.locator("dialog [type=submit]").click();
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
try {
  await p.goto(process.env.APP_URL || "http://localhost:4173");
  await click("onboard-skip");
  await p.locator("[data-page=food]").click();
  await p.locator("[data-tab=plano]").click();
  await click("budget-preview");
  assert.match(await p.locator("dialog").textContent(), /TACO/);
  assert.equal(await p.locator("[name=useBudgetGoals]").isChecked(), false);
  for (const width of [320, 390]) {
    await p.setViewportSize({ width, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.equal(
      await p.locator("dialog").evaluate((e) => e.scrollWidth > e.clientWidth),
      false,
    );
  }
  await submit();
  let s = await stored();
  assert.equal(s.plans.length, 18);
  assert.equal(s.entries.length, 0);
  assert.equal(s.profile.kcal, "");
  await click("budget-preview");
  assert.equal(await p.locator("dialog [type=submit]").count(), 0);
  await click("budget-close");
  await click("consume-plan");
  await p.locator("[name=quantity]").fill("50");
  await submit();
  s = await stored();
  assert.equal(s.entries.length, 1);
  assert.equal(s.entries[0].quantity, 50);
  assert.equal(s.plans[0].quantity, 100);
  assert.equal(s.entries[0].kcal, 146);
  await p.reload();
  await p.locator("[data-page=food]").click();
  await p.locator("[data-tab=plano]").click();
  assert.match(await p.locator("main").textContent(), /TOTAL PLANEJADO/);
  await p.locator("[data-page=user]").click();
  await p.locator("[name=allergies]").fill("Anotação local de teste");
  await p.locator("form[data-form=profile] [type=submit]").click();
  const event = p.waitForEvent("download");
  await click("backup");
  const file = await (await event).path();
  const before = await stored();
  await click("restore");
  await p.locator("#restore-file").setInputFiles(file);
  await click("confirm");
  assert.deepEqual(await stored(), before);
  await p.locator("[data-page=food]").click();
  await p.locator("[data-tab=plano]").click();
  await click("budget-preview");
  assert.match(
    await p.locator("dialog").textContent(),
    /Anotação local de teste/,
  );
  await click("budget-close");
  await click("delete-plan");
  await click("confirm");
  assert.equal((await stored()).plans.length, 17);
  await click("budget-preview");
  await p.locator("[name=useBudgetGoals]").check();
  await submit();
  s = await stored();
  assert.equal(s.plans.length, 18);
  assert.equal(s.profile.kcal, 2150);
  assert.equal(s.entries.length, 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: exemplo alimentar com fonte, importação sem duplicidade, metas preservadas e alteração expressa, separação plano/consumo, cálculo por gramas, persistência, alergias locais, backup e layout móvel.",
  );
} finally {
  await browser.close();
}
