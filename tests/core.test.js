import test from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  total,
  num,
  elapsed,
  startSession,
  substituteExercise,
  volume,
  validateBackup,
  day,
  goalText,
  csv,
} from "../src/core.js";
import {
  MACHINE_CATALOG,
  addMachinePack,
  addMachineLibrary,
  exerciseChoices,
  machineExercise,
  isMachine,
} from "../src/machines.js";
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
test("PPL com máquinas é opcional, não duplica e preserva dados anteriores", () => {
  const s = initial();
  s.profile.name = "Meu nome";
  s.library.push({
    id: "custom",
    name: "Meu exercício",
    group: "Outro",
    equipment: "",
    sets: 2,
    reps: "10",
    rest: 90,
    kg: "",
    notes: "",
    video: "",
  });
  const before = structuredClone(s.library);
  assert.equal(s.templates.length, 0);
  assert.equal(addMachinePack(s), 5);
  assert.equal(addMachinePack(s), 0);
  assert.deepEqual(s.library, before);
  assert.equal(s.profile.name, "Meu nome");
  assert.equal(s.profile.equipmentPreference, "machines");
  assert.deepEqual(
    s.templates.map((t) => t.name.split(" — ")[0]),
    ["Push", "Pull", "Legs", "Upper", "Lower"],
  );
  assert.ok(
    s.templates.every(
      (t) =>
        t.days.length === 0 &&
        t.example &&
        t.exercises.every((e) => isMachine(e) && e.kg === ""),
    ),
  );
  assert.equal(s.sessions.length, 0);
  assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(s))), s);
  assert.throws(() => addMachinePack(initial(), { push: "1", pull: "1" }));
  const scheduled = initial();
  addMachinePack(scheduled, {
    push: "1",
    pull: "2",
    legs: "3",
    upper: "5",
    lower: "6",
  });
  assert.deepEqual(
    scheduled.templates.map((t) => t.days[0]),
    [1, 2, 3, 5, 6],
  );
});
test("biblioteca antiga é preservada e máquinas aparecem antes de pesos livres", () => {
  const custom = {
    id: "custom",
    name: "Agachamento livre",
    equipment: "Barra",
    group: "Pernas",
    sets: 3,
    reps: "10",
    rest: 90,
    kg: 20,
  };
  const s = initial();
  s.library = [custom];
  assert.equal(addMachineLibrary(s), MACHINE_CATALOG.length);
  assert.equal(addMachineLibrary(s), 0);
  assert.deepEqual(s.library[0], custom);
  const choices = exerciseChoices(s.library);
  assert.ok(isMachine(choices[0]));
  assert.equal(choices.at(-1).id, "custom");
  const legacy = initial();
  delete legacy.profile.equipmentPreference;
  assert.doesNotThrow(() => validateBackup(legacy));
});
test("troca de aparelho preserva séries reais, volume e carga em branco na alternativa", () => {
  const e = machineExercise("chest-press", { sets: 3, reps: "8–12" }),
    s = startSession({ id: "t", name: "Push", exercises: [e] }, day());
  s.exercises[0].sets[0] = { id: "done", done: true, kg: 25, reps: 10 };
  const replacement = substituteExercise(
    s,
    0,
    machineExercise("incline-press", { sets: 2 }),
  );
  assert.equal(s.exercises.length, 2);
  assert.equal(s.exercises[0].name, e.name);
  assert.deepEqual(s.exercises[0].sets, [
    { id: "done", done: true, kg: 25, reps: 10 },
  ]);
  assert.equal(replacement.sets.length, 2);
  assert.ok(replacement.sets.every((s) => s.kg === "" && !s.done));
  assert.equal(volume(s), 250);
  const fresh = startSession({ id: "t", name: "Push", exercises: [e] }, day());
  substituteExercise(fresh, 0, machineExercise("incline-press"));
  assert.equal(fresh.exercises.length, 1);
});
