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
  p = await context.newPage();
const errors = [];
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
await p.addInitScript(() => localStorage.setItem("mibody-local-mode", "true"));
try {
  await p.goto(process.env.APP_URL || "http://localhost:4173");
  await click("onboard-skip");
  await p.locator("[data-page=workout]").click();
  await click("machine-pack");
  assert.match(await p.locator("dialog").textContent(), /Exemplos editáveis/);
  assert.match(
    await p.locator("dialog").textContent(),
    /Leg press horizontal com torre/,
  );
  for (const [name, value] of Object.entries({
    push: "1",
    pull: "2",
    legs: "3",
    upper: "5",
    lower: "6",
  }))
    await p.locator(`[name=day-${name}]`).selectOption(value);
  await submit();
  assert.equal((await stored()).templates.length, 5);
  assert.equal((await stored()).sessions.length, 0);
  await click("machine-pack");
  assert.equal(await p.locator("dialog [type=submit]").count(), 0);
  await click("pack-close");
  assert.equal((await stored()).templates.length, 5);
  await click("start");
  await p.locator("[data-set-input=kg]").first().fill("20");
  await p.locator("[data-set-input=reps]").first().fill("10");
  await click("toggle-set");
  await click("replace-exercise");
  assert.match(await p.locator("dialog").textContent(), /Supino inclinado/);
  assert.equal(
    await p
      .locator("dialog")
      .getByText("Cadeira extensora", { exact: true })
      .count(),
    0,
  );
  await click("choose-exercise");
  assert.equal(await p.locator("[name=sets]").inputValue(), "2");
  assert.equal(await p.locator("[name=kg]").inputValue(), "");
  await submit();
  let s = (await stored()).active;
  assert.equal(s.exercises[0].sets.length, 1);
  assert.equal(s.exercises[0].sets[0].kg, 20);
  assert.equal(s.exercises[0].sets[0].done, true);
  assert.equal(s.exercises[1].sets.length, 2);
  assert.ok(s.exercises[1].sets.every((x) => x.kg === "" && !x.done));
  await p.reload();
  await click("continue");
  s = (await stored()).active;
  assert.equal(s.exercises[0].sets[0].done, true);
  assert.equal(s.exercises[1].name, "Supino inclinado na máquina");
  await p.setViewportSize({ width: 320, height: 844 });
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    "Treino em andamento deve caber em 320 px.",
  );
  await p.setViewportSize({ width: 390, height: 844 });
  await p.locator("[data-page=user]").click();
  assert.equal(
    await p.locator("[name=equipmentPreference]").inputValue(),
    "machines",
  );
  const download = p.waitForEvent("download");
  await click("backup");
  const path = await (await download).path();
  const before = await stored();
  await click("restore");
  await p.locator("#restore-file").setInputFiles(path);
  await click("confirm");
  assert.deepEqual(await stored(), before);
  await p.locator("[data-page=workout]").click();
  await click("session-to-templates");
  await click("machine-pack");
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
  assert.deepEqual(errors, []);
  console.log(
    "PASS: importar PPL sem duplicar, planejamento opcional, alternativas de máquinas, preservação de séries concluídas, carga em branco na troca, recuperação, preferência, backup e layout móvel.",
  );
} finally {
  await browser.close();
}
