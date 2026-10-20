// General, editable examples. No personal loads, schedules or results are assumed.
const equipment = {
  machine: "Máquina com pino seletor",
  cable: "Polia com torre de pesos",
};
const catalogue = [
  [
    "chest-press",
    "Supino sentado na máquina",
    "Peito",
    "machine",
    "press",
    "Regule o banco para que os pegadores fiquem próximos da linha do peito. Mantenha as costas apoiadas.",
  ],
  [
    "incline-press",
    "Supino inclinado na máquina",
    "Peito",
    "machine",
    "press",
    "Use a versão com torre de pesos; a versão com anilhas não é a prioridade. Ajuste o banco antes de começar.",
  ],
  [
    "pec-deck",
    "Peck deck (voador)",
    "Peito",
    "machine",
    "fly",
    "Ajuste o banco e mantenha o movimento controlado, dentro de uma amplitude confortável.",
  ],
  [
    "cable-fly",
    "Crucifixo na polia",
    "Peito",
    "cable",
    "fly",
    "Use as torres com pino seletor. Ajuste a altura dos cabos com orientação do instrutor.",
  ],
  [
    "shoulder-press",
    "Desenvolvimento na máquina",
    "Ombros",
    "machine",
    "overhead",
    "Regule o banco e mantenha as costas apoiadas. Evite forçar uma amplitude desconfortável.",
  ],
  [
    "lateral",
    "Elevação lateral na máquina",
    "Ombros",
    "machine",
    "lateral",
    "Ajuste a altura do banco para alinhar o aparelho ao movimento dos ombros.",
  ],
  [
    "cable-lateral",
    "Elevação lateral na polia",
    "Ombros",
    "cable",
    "lateral",
    "Use a polia baixa com pegador. Não é necessário carregar halteres.",
  ],
  [
    "triceps-rope",
    "Tríceps na polia com corda",
    "Tríceps",
    "cable",
    "triceps",
    "Mantenha os cotovelos próximos do corpo e controle a volta do cabo.",
  ],
  [
    "triceps-bar",
    "Tríceps na polia com barra",
    "Tríceps",
    "cable",
    "triceps",
    "Use uma barra curta na polia alta. A carga é ajustada pelo pino da torre.",
  ],
  [
    "pulldown",
    "Puxada frontal na polia",
    "Costas",
    "cable",
    "vertical-pull",
    "Ajuste o apoio das coxas. Puxe à frente do corpo com controle, sem levar a barra atrás da cabeça.",
  ],
  [
    "neutral-pulldown",
    "Puxada frontal com pegada neutra",
    "Costas",
    "cable",
    "vertical-pull",
    "Use o pegador neutro na polia alta e ajuste o apoio das coxas.",
  ],
  [
    "row",
    "Remada sentada na máquina",
    "Costas",
    "machine",
    "row",
    "Prefira a máquina com apoio de peito e torre de pesos. Regule o banco e alcance dos pegadores.",
  ],
  [
    "cable-row",
    "Remada baixa na polia",
    "Costas",
    "cable",
    "row",
    "Mantenha o tronco estável e evite impulsionar o peso com o corpo.",
  ],
  [
    "reverse-fly",
    "Peck deck inverso",
    "Ombros posteriores",
    "machine",
    "rear-delt",
    "Confira a configuração para deltoide posterior e ajuste os pegadores antes da série.",
  ],
  [
    "biceps",
    "Rosca bíceps na máquina",
    "Bíceps",
    "machine",
    "biceps",
    "Ajuste o banco para apoiar os braços sem elevar os ombros.",
  ],
  [
    "cable-biceps",
    "Rosca bíceps na polia",
    "Bíceps",
    "cable",
    "biceps",
    "Use a polia baixa com barra ou pegador. Mantenha os cotovelos estáveis.",
  ],
  [
    "leg-press",
    "Leg press horizontal com torre",
    "Quadríceps e glúteos",
    "machine",
    "leg-press",
    "Confirme que a resistência usa pino seletor. O leg press 45° costuma exigir anilhas. Ajuste o banco e mantenha o quadril apoiado.",
  ],
  [
    "extension",
    "Cadeira extensora",
    "Quadríceps",
    "machine",
    "knee-extension",
    "Alinhe o eixo da máquina ao joelho e ajuste o apoio na parte inferior da perna.",
  ],
  [
    "seated-curl",
    "Cadeira flexora",
    "Posterior de coxa",
    "machine",
    "knee-flexion",
    "Ajuste o eixo ao joelho e os apoios conforme as instruções do aparelho.",
  ],
  [
    "lying-curl",
    "Mesa flexora com torre",
    "Posterior de coxa",
    "machine",
    "knee-flexion",
    "Ajuste o apoio das pernas e mantenha o quadril apoiado durante o movimento.",
  ],
  [
    "glutes",
    "Glúteo na máquina com torre",
    "Glúteos",
    "machine",
    "hip-extension",
    "Use a versão com pino seletor. Ajuste os apoios e mantenha o tronco estável.",
  ],
  [
    "cable-glutes",
    "Extensão de quadril na polia",
    "Glúteos",
    "cable",
    "hip-extension",
    "Use a polia baixa com tornozeleira e um apoio estável. Peça ajuda para regular a posição.",
  ],
  [
    "calf",
    "Panturrilha na máquina com torre",
    "Panturrilhas",
    "machine",
    "calf",
    "Prefira a versão com pino seletor. Ajuste os apoios e controle a subida e a descida.",
  ],
  [
    "abs",
    "Abdominal na máquina",
    "Abdômen",
    "machine",
    "abs",
    "Regule o banco e os apoios. Use uma amplitude controlada sem puxar o pescoço.",
  ],
  [
    "cable-abs",
    "Abdominal na polia",
    "Abdômen",
    "cable",
    "abs",
    "Use a polia alta com corda. Peça ao instrutor para ajustar a posição antes de começar.",
  ],
];
export const MACHINE_CATALOG = catalogue.map(
  ([catalogKey, name, group, type, movement, notes]) => ({
    catalogKey,
    name,
    group,
    type,
    movement,
    equipment: equipment[type],
    notes,
    sets: 2,
    reps: "10–15",
    rest: 90,
    kg: "",
    video: "",
  }),
);
export function machineExercise(key, overrides = {}) {
  const item = MACHINE_CATALOG.find((e) => e.catalogKey === key);
  if (!item) throw Error("Exercício da biblioteca não encontrado.");
  return { ...structuredClone(item), ...overrides, id: crypto.randomUUID() };
}
export const PPL_MACHINES = [
  {
    key: "push",
    name: "Push — Peito, ombros e tríceps",
    items: [
      ["chest-press", 3, "8–12", 120],
      ["incline-press", 2, "8–12", 120],
      ["shoulder-press", 2, "8–12", 120],
      ["lateral", 2, "12–15", 90],
      ["triceps-rope", 2, "10–15", 90],
    ],
  },
  {
    key: "pull",
    name: "Pull — Costas e bíceps",
    items: [
      ["pulldown", 3, "8–12", 120],
      ["row", 3, "8–12", 120],
      ["reverse-fly", 2, "12–15", 90],
      ["biceps", 2, "10–15", 90],
    ],
  },
  {
    key: "legs",
    name: "Legs — Pernas completas",
    items: [
      ["leg-press", 3, "10–15", 120],
      ["extension", 2, "10–15", 90],
      ["seated-curl", 3, "10–15", 90],
      ["calf", 2, "12–20", 90],
    ],
  },
  {
    key: "upper",
    name: "Upper — Parte superior",
    items: [
      ["chest-press", 2, "8–12", 120],
      ["pulldown", 2, "8–12", 120],
      ["row", 2, "8–12", 120],
      ["lateral", 2, "12–15", 90],
      ["triceps-rope", 2, "10–15", 90],
      ["biceps", 2, "10–15", 90],
    ],
  },
  {
    key: "lower",
    name: "Lower — Parte inferior",
    items: [
      ["leg-press", 3, "10–15", 120],
      ["lying-curl", 3, "10–15", 90],
      ["glutes", 2, "10–15", 90],
      ["calf", 2, "12–20", 90],
      ["abs", 2, "10–15", 90],
    ],
  },
];
export const isMachine = (e) =>
  ["machine", "cable"].includes(e.type) ||
  /máquina|polia|torre|extensora|flexora|peck deck/i.test(
    e.equipment + " " + e.name,
  );
export function exerciseChoices(library, preferMachines = true) {
  const choices = [...library.map((e) => structuredClone(e))];
  for (const item of MACHINE_CATALOG)
    if (
      !choices.some(
        (e) =>
          e.catalogKey === item.catalogKey ||
          e.name.toLowerCase() === item.name.toLowerCase(),
      )
    )
      choices.push({
        ...structuredClone(item),
        id: "catalog:" + item.catalogKey,
      });
  return choices.sort(
    (a, b) =>
      (preferMachines ? Number(isMachine(b)) - Number(isMachine(a)) : 0) ||
      a.name.localeCompare(b.name, "pt-BR"),
  );
}
export function addMachineLibrary(state) {
  let count = 0;
  for (const e of MACHINE_CATALOG)
    if (
      !state.library.some(
        (x) =>
          x.catalogKey === e.catalogKey ||
          x.name.toLowerCase() === e.name.toLowerCase(),
      )
    ) {
      state.library.push(machineExercise(e.catalogKey));
      count++;
    }
  return count;
}
export function addMachinePack(state, assignments = {}) {
  const days = Object.values(assignments).filter(
    (d) => d !== "" && d !== undefined,
  );
  if (
    days.some(
      (d) => !Number.isInteger(Number(d)) || Number(d) < 0 || Number(d) > 6,
    ) ||
    new Set(days.map(Number)).size !== days.length
  )
    throw Error("Escolha dias diferentes ou deixe os treinos sem dia fixo.");
  let count = 0;
  for (const t of PPL_MACHINES) {
    const seedKey = "ppl-machines-v1:" + t.key;
    if (state.templates.some((x) => x.seedKey === seedKey)) continue;
    state.templates.push({
      id: crypto.randomUUID(),
      seedKey,
      name: t.name,
      days:
        assignments[t.key] === undefined || assignments[t.key] === ""
          ? []
          : [Number(assignments[t.key])],
      archived: false,
      example: true,
      exercises: t.items.map(([key, sets, reps, rest]) =>
        machineExercise(key, { sets, reps, rest }),
      ),
    });
    count++;
  }
  addMachineLibrary(state);
  state.profile.equipmentPreference = "machines";
  return count;
}
