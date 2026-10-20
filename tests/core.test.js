import test from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  total,
  num,
  elapsed,
  startSession,
  volume,
  validateBackup,
  day,
  goalText,
  csv,
} from "../src/core.js";
test("números brasileiros e nutrição proporcional sem conversão de unidade", () => {
  assert.equal(num("12,5"), 12.5);
  const result = total([
    {
      quantity: 150,
      reference: 100,
      kcal: 200,
      protein: 10,
      carbs: 20,
      fat: 5,
    },
  ]);
  assert.equal(result.kcal, 300);
  assert.equal(result.protein, 15);
  assert.equal(result.fat, 7.5);
  assert.equal(total([{ quantity: 2, reference: 1, kcal: 100 }]).kcal, 200);
  assert.match(goalText(250, 200, "kcal"), /50 kcal acima/);
});
test("sessões preservam ficha e calculam apenas volume concluído", () => {
  const t = {
    id: "a",
    name: "Treino A",
    exercises: [{ id: "b", name: "Supino", sets: 2, kg: 20, reps: "8–12" }],
  };
  const s = startSession(t, day());
  t.exercises[0].name = "Outro";
  assert.equal(s.exercises[0].name, "Supino");
  assert.equal(s.exercises[0].sets[0].kg, "");
  s.exercises[0].sets[0] = { kg: 20, reps: 10, done: true };
  s.exercises[0].sets[1] = { kg: 100, reps: 100, done: false };
  assert.equal(volume(s), 200);
});
test("relógio recupera tempo real e exclui pausas", () => {
  const s = { startedAt: 1000, pausedMs: 2000, pausedAt: null };
  assert.equal(elapsed(s, 11000), 8000);
  s.pausedAt = 9000;
  assert.equal(elapsed(s, 99000), 6000);
  s.endedAt = 13000;
  s.pausedAt = null;
  assert.equal(elapsed(s, 99000), 10000);
});
test("backup valida versão, estrutura, duplicidade e registros", () => {
  const s = initial();
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(s))), s);
  assert.throws(() => validateBackup({ ...s, version: 2 }));
  assert.throws(() => validateBackup({ ...s, entries: [{ id: "x" }] }));
  assert.throws(() =>
    validateBackup({
      ...s,
      body: [{ id: "x", date: "2026-01-01", weight: -1 }],
    }),
  );
  assert.throws(() =>
    validateBackup({ ...s, library: [s.library[0], s.library[0]] }),
  );
});
test("datas usam calendário local e CSV escapa campos e fórmulas", () => {
  const d = new Date(2026, 1, 2, 0, 15);
  assert.equal(day(d), "2026-02-02");
  assert.match(
    csv([{ name: "=SUM(1)", value: 'a"b' }], ["name", "value"]),
    /'=SUM/,
  );
  assert.match(csv([{ name: 'a"b' }], ["name"]), /a""b/);
});
