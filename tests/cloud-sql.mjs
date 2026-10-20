import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    insert into auth.users values ('${a}'),('${b}');`);
  await db.exec(
    await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
  );
  // Setup is repeatable.
  await db.exec(
    await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
  );
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${a}';`);
  await db.query("select * from public.save_user_state(0,$1::jsonb)", [
    JSON.stringify({ name: "A" }),
  ]);
  await assert.rejects(
    db.query("select * from public.save_user_state(0,$1::jsonb)", [
      '{"name":"stale"}',
    ]),
    (e) => e.code === "40001",
  );
  await db.query("select * from public.save_user_state(1,$1::jsonb)", [
    '{"name":"A2"}',
  ]);
  await db.exec(`set request.jwt.claim.sub = '${b}';`);
  assert.equal(
    (await db.query("select * from public.user_state")).rows.length,
    0,
  );
  await db.query("select * from public.save_user_state(0,$1::jsonb)", [
    '{"name":"B"}',
  ]);
  const rows = (await db.query("select * from public.user_state")).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].user_id, b);
  await assert.rejects(
    db.query("update public.user_state set data='{}' where user_id=$1", [a]),
    (e) => e.code === "42501",
  );
  await assert.rejects(
    db.query("delete from public.user_state where user_id=$1", [a]),
    (e) => e.code === "42501",
  );
  await db.exec(`reset role; set role anon; set request.jwt.claim.sub = '';`);
  await assert.rejects(
    db.query("select * from public.user_state"),
    (e) => e.code === "42501",
  );
  await assert.rejects(
    db.query("select * from public.save_user_state(0,'{}'::jsonb)"),
    (e) => e.code === "42501",
  );
  console.log(
    "PASS: SQL PostgreSQL executado em PGlite; leitura isolada por usuário, escrita restrita à função autenticada, revisão atômica e bloqueio anônimo. Projeto Supabase real ainda não configurado.",
  );
} finally {
  await db.close();
}
