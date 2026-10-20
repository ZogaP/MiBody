import { MACHINE_CATALOG, machineExercise } from "./machines.js";
export const VERSION = 1;
export const uid = () => crypto.randomUUID();
export const day = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const num = (v) => {
  if (typeof v === "string") v = v.trim().replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const nutrients = ["kcal", "protein", "carbs", "fat", "fiber", "sodium"];
export const total = (rows) =>
  rows.reduce(
    (a, r) => {
      nutrients.forEach(
        (k) => (a[k] += (num(r[k]) * num(r.quantity)) / num(r.reference || 1)),
      );
      return a;
    },
    Object.fromEntries(nutrients.map((k) => [k, 0])),
  );
export const volume = (session) =>
  session.exercises.reduce(
    (a, e) =>
      a +
      e.sets
        .filter((s) => s.done)
        .reduce((b, s) => b + num(s.kg) * num(s.reps), 0),
    0,
  );
export const elapsed = (s, now = Date.now()) =>
  Math.max(
    0,
    (s.endedAt || s.pausedAt || now) - s.startedAt - (s.pausedMs || 0),
  );
export const progress = (s) => {
  const sets = s.exercises.flatMap((e) => e.sets);
  return { done: sets.filter((s) => s.done).length, all: sets.length };
};
export const goalText = (value, goal, unit = "") =>
  !num(goal)
    ? "Meta não definida"
    : value > goal
      ? `${Math.round((value - goal) * 10) / 10} ${unit} acima da meta`
      : `${Math.round((goal - value) * 10) / 10} ${unit} para a meta`;
export function initial() {
  return {
    version: VERSION,
    profile: {
      name: "",
      goal: "",
      height: "",
      initialWeight: "",
      days: [],
      kcal: "",
      protein: "",
      carbs: "",
      fat: "",
      water: "",
      theme: "dark",
      rest: 90,
      autoRest: true,
      waterQuick: 250,
      equipmentPreference: "machines",
      allergies: "",
    },
    onboarded: false,
    templates: [],
    sessions: [],
    active: null,
    foods: [],
    entries: [],
    water: [],
    body: [],
    plans: [],
    favorites: [],
    meals: [
      "Café da manhã",
      "Lanche da manhã",
      "Almoço",
      "Lanche da tarde",
      "Jantar",
      "Ceia",
    ],
    library: MACHINE_CATALOG.map((e) => machineExercise(e.catalogKey)),
  };
}
export function startSession(template, date) {
  return {
    id: uid(),
    templateId: template.id,
    name: template.name,
    date,
    startedAt: Date.now(),
    pausedMs: 0,
    pausedAt: null,
    restUntil: null,
    notes: "",
    exercises: template.exercises.map((e) => ({
      ...structuredClone(e),
      id: uid(),
      sets: Array.from({ length: num(e.sets) }, () => ({
        id: uid(),
        kg: "",
        reps: "",
        done: false,
      })),
      referenceKg: e.kg,
      referenceReps: e.reps,
    })),
  };
}
export function substituteExercise(session, index, candidate) {
  const current = session.exercises[index];
  if (!current) throw Error("Exercício não encontrado.");
  const completed = current.sets.filter((s) => s.done);
  const replacement = startSession(
    { id: "", name: "", exercises: [candidate] },
    session.date,
  ).exercises[0];
  if (completed.length) {
    // Keep every actual set under the exercise that was performed.
    current.sets = current.sets.filter((s) => s.done);
    session.exercises.splice(index + 1, 0, replacement);
  } else session.exercises[index] = replacement;
  return replacement;
}
export function validateBackup(data) {
  if (
    !data ||
    data.version !== VERSION ||
    !data.profile ||
    typeof data.profile !== "object" ||
    Array.isArray(data.profile)
  )
    throw Error("Versão ou perfil do backup inválido.");
  const arrays = [
    "templates",
    "sessions",
    "foods",
    "entries",
    "water",
    "body",
    "plans",
    "favorites",
    "meals",
    "library",
  ];
  for (const key of arrays)
    if (!Array.isArray(data[key]) || data[key].length > 100000)
      throw Error(`Estrutura inválida: ${key}.`);
  const id = (r) => r && typeof r === "object" && typeof r.id === "string";
  const date = (r) =>
    typeof r.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
    !Number.isNaN(Date.parse(r.date)) &&
    new Date(r.date).toISOString().slice(0, 10) === r.date;
  const finite = (v) =>
    (typeof v === "number" || typeof v === "string") &&
    v !== "" &&
    Number.isFinite(Number(String(v).replace(",", "."))) &&
    num(v) >= 0;
  const optionalNumber = (v) => v === "" || finite(v);
  const food = (r) =>
    id(r) &&
    typeof r.name === "string" &&
    finite(r.reference) &&
    num(r.reference) > 0 &&
    ["g", "ml", "porção"].includes(r.unit) &&
    nutrients.every((k) => finite(r[k]));
  const exercise = (e) =>
    id(e) &&
    typeof e.name === "string" &&
    finite(e.sets) &&
    Number.isInteger(num(e.sets)) &&
    num(e.sets) > 0 &&
    num(e.sets) <= 30 &&
    optionalNumber(e.kg) &&
    typeof e.reps === "string" &&
    finite(e.rest) &&
    num(e.rest) <= 3600;
  const session = (r) =>
    id(r) &&
    date(r) &&
    typeof r.name === "string" &&
    Number.isFinite(r.startedAt) &&
    r.startedAt >= 0 &&
    Number.isFinite(r.pausedMs) &&
    r.pausedMs >= 0 &&
    (r.pausedAt === null || Number.isFinite(r.pausedAt)) &&
    (r.endedAt === undefined || Number.isFinite(r.endedAt)) &&
    (r.restUntil === null || Number.isFinite(r.restUntil)) &&
    Array.isArray(r.exercises) &&
    r.exercises.every(
      (e) =>
        id(e) &&
        typeof e.name === "string" &&
        finite(e.rest) &&
        Array.isArray(e.sets) &&
        e.sets.every(
          (s) =>
            id(s) &&
            typeof s.done === "boolean" &&
            optionalNumber(s.kg) &&
            optionalNumber(s.reps) &&
            (!s.done ||
              (finite(s.kg) &&
                finite(s.reps) &&
                num(s.reps) > 0 &&
                Number.isInteger(num(s.reps)))),
        ),
    );
  const p = data.profile;
  if (
    p.allergies !== undefined &&
    (typeof p.allergies !== "string" || p.allergies.length > 2000)
  )
    throw Error("Anotações de alergias inválidas.");
  if (
    p.equipmentPreference !== undefined &&
    !["machines", "any"].includes(p.equipmentPreference)
  )
    throw Error("Preferência de equipamentos inválida.");
  if (
    typeof p.name !== "string" ||
    !["", "massa", "gordura", "manter", "condicionamento"].includes(p.goal) ||
    !["dark", "light"].includes(p.theme) ||
    !Array.isArray(p.days) ||
    !p.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) ||
    ![
      "height",
      "initialWeight",
      "kcal",
      "protein",
      "carbs",
      "fat",
      "water",
    ].every((k) => optionalNumber(p[k])) ||
    !finite(p.rest) ||
    num(p.rest) > 3600 ||
    typeof p.autoRest !== "boolean" ||
    !finite(p.waterQuick) ||
    num(p.waterQuick) <= 0 ||
    num(p.waterQuick) > 10000
  )
    throw Error("Preferências do perfil inválidas.");
  if (
    !data.meals.every((m) => typeof m === "string" && m.length > 0) ||
    new Set(data.meals).size !== data.meals.length ||
    !data.meals.length
  )
    throw Error("Refeições inválidas.");
  for (const key of arrays.filter((k) => k !== "meals"))
    if (
      !data[key].every(id) ||
      new Set(data[key].map((r) => r.id)).size !== data[key].length
    )
      throw Error(`Identificadores inválidos: ${key}.`);
  if (
    !data.foods.every(food) ||
    !data.entries.every(
      (r) =>
        food(r) && date(r) && finite(r.quantity) && data.meals.includes(r.meal),
    ) ||
    !data.plans.every(
      (r) => food(r) && finite(r.quantity) && data.meals.includes(r.meal),
    )
  )
    throw Error("Alimentos ou quantidades inválidos.");
  if (
    !data.water.every((r) => date(r) && finite(r.ml)) ||
    !data.body.every(
      (r) =>
        date(r) &&
        ["weight", "waist", "abdomen", "hip", "chest", "arm", "leg"].every(
          (k) => r[k] === undefined || r[k] === "" || finite(r[k]),
        ) &&
        (r.photo === undefined ||
          r.photo === "" ||
          /^data:image\/(jpeg|png|webp);base64,/.test(r.photo)),
    )
  )
    throw Error("Registros corporais inválidos.");
  if (
    !data.templates.every(
      (t) =>
        typeof t.name === "string" &&
        Array.isArray(t.days) &&
        t.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
        Array.isArray(t.exercises) &&
        t.exercises.every(exercise),
    )
  )
    throw Error("Fichas inválidas.");
  if (
    !data.sessions.every((r) => session(r) && Number.isFinite(r.endedAt)) ||
    (data.active !== null && !session(data.active))
  )
    throw Error("Sessões inválidas.");
  if (
    !data.favorites.every(
      (r) =>
        typeof r.name === "string" &&
        Array.isArray(r.items) &&
        r.items.every((r) => food(r) && finite(r.quantity)),
    ) ||
    !data.library.every(exercise)
  )
    throw Error("Biblioteca inválida.");
  return data;
}
export function csv(rows, columns) {
  return (
    "\uFEFF" +
    columns.map((c) => `"${c}"`).join(";") +
    "\r\n" +
    rows
      .map((r) =>
        columns
          .map(
            (k) =>
              '"' +
              String(r[k] ?? "")
                .replace(/^[=+@-]/, "'$&")
                .replaceAll('"', '""') +
              '"',
          )
          .join(";"),
      )
      .join("\r\n")
  );
}
