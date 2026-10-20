import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const p = await browser.newPage({ viewport: { width: 390, height: 844 } }),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const click = (a) => p.locator(`[data-action="${a}"]`).first().click();
const submit = async () => {
  await p.locator("dialog [type=submit]").click();
  await p.locator("dialog").waitFor({ state: "hidden" });
};
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
await p.addInitScript(() => localStorage.setItem("mibody-local-mode", "true"));
try {
  await p.goto(process.env.APP_URL || "http://localhost:4173");
  await click("onboard-skip");
  await p.locator("[data-page=user]").click();
  await click("personal-setup");
  const setup = {
    name: "Pessoa de teste",
    age: 32,
    sex: "feminino",
    height: 169,
    weight: 68,
    allergies: "Anotação de teste",
    foodPreferences: "Preferência de teste",
    wheyNote: "Rótulo ainda pendente",
  };
  await p.locator("[name=setup]").fill(JSON.stringify(setup));
  await submit();
  let s = await stored();
  assert.equal(s.profile.age, 32);
  assert.equal(s.profile.initialWeight, 68);
  assert.equal(s.profile.water, 2500);
  assert.equal(s.profile.trainingWater, 3000);
  assert.equal(s.profile.hydrationMode, "liquids");
  assert.equal(s.templates.length, 5);
  assert.equal(s.plans.length, 10);
  assert.equal(s.mealGuides.length, 2);
  assert.equal(s.entries.length, 0);
  await p.locator("[data-form=profile] [type=submit]").click();
  s = await stored();
  assert.equal(s.profile.foodPreferences, setup.foodPreferences);
  await p.locator("[data-page=food]").click();
  await p.locator("[data-tab=plano]").click();
  assert.match(await p.locator("main").textContent(), /PARCIAL/);
  assert.equal(
    await p.getByText("Vitamina do seu plano", { exact: true }).count(),
    2,
  );
  await p.locator("[data-page=home]").click();
  await p.locator("#date").fill("2026-09-10");
  await click("gym-checkin");
  await p.waitForFunction(
    () => document.querySelector("#gym-month-days")?.textContent === "1 dias",
  );
  await p.locator("#date").fill("2026-09-11");
  await click("gym-checkin");
  await p.waitForFunction(
    () => document.querySelector("#gym-month-days")?.textContent === "2 dias",
  );
  await click("gym-checkin");
  await p.waitForFunction(
    () => document.querySelector("#gym-month-days")?.textContent === "1 dias",
  );
  await p.locator("#date").fill("2026-10-01");
  await p.waitForFunction(
    () => document.querySelector("#gym-month-days")?.textContent === "0 dias",
  );
  await click("add-water");
  await p.locator("[name=drink]").selectOption("milk");
  await p.locator("[name=ml]").fill("250");
  await submit();
  assert.match(await p.locator("main").textContent(), /0,25/);
  await p.reload();
  await p.locator("[data-page=home]").click();
  await p.locator("#date").fill("2026-09-10");
  await p.waitForFunction(
    () => document.querySelector("#gym-month-days")?.textContent === "1 dias",
  );
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: configuração privada, perfil completo, plano e vitaminas pendentes sem calorias inventadas, PPL sem duplicidade, hidratação com leite, presenças por mês, persistência e layout.",
  );
} finally {
  await browser.close();
}
