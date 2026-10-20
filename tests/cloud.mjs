import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const users = {
  "alpha@example.test": {
    id: "11111111-1111-4111-8111-111111111111",
    email: "alpha@example.test",
    aud: "authenticated",
    role: "authenticated",
    user_metadata: { display_name: "Alpha" },
  },
  "beta@example.test": {
    id: "22222222-2222-4222-8222-222222222222",
    email: "beta@example.test",
    aud: "authenticated",
    role: "authenticated",
    user_metadata: { display_name: "Beta" },
  },
};
const server = new Map(),
  errors = [];
const config = {
  url: "https://test-project.supabase.co",
  key: "sb_publishable_automated_test_public_key_only",
};
const expires = Math.floor(Date.now() / 1000) + 3600;
const token = (u) =>
  [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
    Buffer.from(
      JSON.stringify({
        sub: u.id,
        role: "authenticated",
        exp: expires,
      }),
    ).toString("base64url"),
    "test-signature",
  ].join(".");
const byToken = new Map(Object.values(users).map((u) => [token(u), u]));
const session = (u) => ({
  access_token: token(u),
  refresh_token: "refresh-" + u.id,
  token_type: "bearer",
  expires_in: 3600,
  user: u,
});
let unavailable = false;
async function setup() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(
    (c) => localStorage.setItem("mibody-cloud-config", JSON.stringify(c)),
    config,
  );
  await context.route("https://test-project.supabase.co/**", async (route) => {
    if (unavailable) return route.abort("internetdisconnected");
    const request = route.request(),
      url = new URL(request.url());
    const body =
      request.method() === "POST" || request.method() === "PUT"
        ? request.postDataJSON()
        : null;
    const reply = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (url.pathname === "/auth/v1/token") {
      const user = users[body.email];
      if (!user || body.password !== "Test-only-12345")
        return reply({ msg: "Invalid login credentials" }, 400);
      return reply(session(user));
    }
    if (url.pathname === "/auth/v1/signup")
      return reply({ user: users["alpha@example.test"], session: null });
    if (url.pathname === "/auth/v1/recover") return reply({});
    if (url.pathname === "/auth/v1/logout")
      return route.fulfill({ status: 204 });
    const user = byToken.get(
      request.headers().authorization?.replace("Bearer ", ""),
    );
    if (!user) return reply({ message: "Unauthorized" }, 401);
    if (url.pathname === "/auth/v1/user") return reply(user);
    if (url.pathname === "/rest/v1/user_state") {
      if (url.searchParams.get("user_id") !== "eq." + user.id) return reply([]);
      const row = server.get(user.id);
      return reply(
        row
          ? [
              url.searchParams.get("select") === "revision"
                ? { revision: row.revision }
                : row,
            ]
          : [],
      );
    }
    if (url.pathname === "/rest/v1/rpc/save_user_state") {
      const old = server.get(user.id);
      if ((old?.revision || 0) !== body.expected_revision)
        return reply(
          { code: "40001", message: "State changed on another device" },
          409,
        );
      const row = { data: body.payload, revision: (old?.revision || 0) + 1 };
      server.set(user.id, structuredClone(row));
      return reply([row]);
    }
    return reply({ message: "Unexpected route" }, 404);
  });
  const p = await context.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.APP_URL || "http://localhost:4173");
  return { context, p };
}
const action = (p, a) => p.locator(`[data-action="${a}"]`).first();
async function login(p, email, password = "Test-only-12345") {
  const form = p.locator('[data-form="sign-in"]');
  await form.locator("[name=email]").fill(email);
  await form.locator("[name=password]").fill(password);
  await form.locator("[type=submit]").click();
}
const wait = async (fn) => {
  for (let i = 0; i < 100; i++) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Expected synchronization did not finish");
};
try {
  const first = await setup(),
    p = first.p;
  assert.equal(await p.locator('[data-form="sign-in"]').count(), 1);
  await login(p, "alpha@example.test", "wrong-password");
  assert.match(
    await p.locator('[data-form="sign-in"] .inline-error').textContent(),
    /incorretos/,
  );
  await login(p, "alpha@example.test");
  await p.locator("[data-page=user]").waitFor();
  await p.locator("[data-page=user]").click();
  await p.locator("[name=name]").fill("Alpha private test");
  await p.locator("[data-form=profile] [type=submit]").click();
  await wait(
    () =>
      server.get(users["alpha@example.test"].id)?.data.profile.name ===
      "Alpha private test",
  );
  // A second independent browser loads only the same authenticated account.
  const second = await setup(),
    q = second.p;
  await login(q, "alpha@example.test");
  await q.locator("[data-page=user]").click();
  assert.equal(
    await q.locator("[name=name]").inputValue(),
    "Alpha private test",
  );
  // Simulate a remote change while this device has unsynchronized local edits.
  unavailable = true;
  await q.locator("[name=name]").fill("Alpha offline version");
  await q.locator("[data-form=profile] [type=submit]").click();
  const old = server.get(users["alpha@example.test"].id);
  old.data.profile.name = "Alpha other device";
  old.revision++;
  unavailable = false;
  await action(q, "go-account").click();
  await action(q, "cloud-sync").click();
  await q.getByText("Alterações em dois aparelhos", { exact: true }).waitFor();
  await action(q, "cloud-keep-local").click();
  await wait(
    () =>
      server.get(users["alpha@example.test"].id).data.profile.name ===
      "Alpha offline version",
  );
  await action(p, "go-account").click();
  await action(p, "cloud-sync").click();
  await p.locator("[data-page=user]").click();
  await wait(
    async () =>
      (await p.locator("[name=name]").inputValue()) === "Alpha offline version",
  );
  await action(p, "go-account").click();
  await action(p, "sign-out").click();
  await p.locator('[data-form="sign-in"]').waitFor();
  assert.doesNotMatch(
    await p.locator("body").textContent(),
    /Alpha offline version/,
  );
  await login(p, "beta@example.test");
  await p.locator("[data-page=user]").click();
  assert.equal(await p.locator("[name=name]").inputValue(), "Beta");
  await p.locator("[name=name]").fill("Beta only");
  await p.locator("[data-form=profile] [type=submit]").click();
  await wait(
    () =>
      server.get(users["beta@example.test"].id)?.data.profile.name ===
      "Beta only",
  );
  assert.equal(
    server.get(users["alpha@example.test"].id).data.profile.name,
    "Alpha offline version",
  );
  await p.reload();
  await p.locator("[data-page=user]").click();
  assert.equal(await p.locator("[name=name]").inputValue(), "Beta only");
  await action(p, "go-account").click();
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Supabase Auth/REST simulados; senha incorreta, login, duas contas isoladas, segundo aparelho, persistência, edição offline, conflito e resolução. Login em projeto real depende da configuração externa.",
  );
} finally {
  await browser.close();
}
