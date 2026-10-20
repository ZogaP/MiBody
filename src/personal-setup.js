import { uid, validateBackup } from "./core.js";
import { optionRows } from "./menus.js";
import { addMachinePack } from "./machines.js";

export function parsePersonalSetup(text) {
  if (typeof text !== "string" || text.length > 12000)
    throw Error("Cole uma configuração de até 12 mil caracteres.");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw Error(
      "A configuração precisa ser um JSON válido. Copie o bloco completo.",
    );
  }
  if (!data || Array.isArray(data) || typeof data !== "object")
    throw Error("Configuração inválida.");
  const result = {};
  for (const key of [
    "name",
    "allergies",
    "foodPreferences",
    "wheyNote",
    "activity",
    "sex",
  ]) {
    if (data[key] !== undefined) {
      if (
        typeof data[key] !== "string" ||
        data[key].length > (key === "name" ? 100 : 3000)
      )
        throw Error("Confira os textos do perfil.");
      result[key] = data[key];
    }
  }
  for (const [key, min, max] of [
    ["age", 18, 120],
    ["height", 100, 250],
    ["weight", 30, 400],
    ["kcal", 1200, 6000],
  ]) {
    if (data[key] !== undefined) {
      if (
        typeof data[key] !== "number" ||
        !Number.isFinite(data[key]) ||
        data[key] < min ||
        data[key] > max
      )
        throw Error(`Confira o campo ${key}.`);
      result[key] = data[key];
    }
  }
  if (!result.name?.trim()) throw Error("Informe o nome na configuração.");
  return result;
}
export function applyPersonalSetup(state, data) {
  const config = parsePersonalSetup(JSON.stringify(data));
  const next = structuredClone(state);
  const { weight, kcal = 2150, ...profile } = config;
  Object.assign(next.profile, profile, {
    goal: "gordura",
    kcal,
    protein: 150,
    carbs: "",
    fat: "",
    water: 2500,
    trainingWater: 3000,
    hydrationMode: "liquids",
    equipmentPreference: "machines",
    ...(weight !== undefined ? { initialWeight: weight } : {}),
  });
  for (const meal of ["Café da manhã", "Almoço", "Lanche da tarde", "Jantar"])
    if (!next.meals.includes(meal)) next.meals.push(meal);
  next.plans = [];
  for (const meal of ["Almoço", "Jantar"]) {
    for (const row of optionRows(next, "chicken-carrot")) {
      let food = next.foods.find((f) => f.sourceKey === `taco:${row.tacoId}`);
      if (!food) {
        const { quantity, portionNote, menuOption, ...reference } = row;
        food = { ...reference, id: uid(), sourceKey: `taco:${row.tacoId}` };
        next.foods.push(food);
      }
      next.plans.push({ ...row, id: uid(), foodId: food.id, meal });
    }
  }
  next.mealGuides = ["Café da manhã", "Lanche da tarde"].map((meal) => ({
    meal,
    option: "shake-strawberry",
    text: "250 ml de leite integral + uma porção inteira de whey conforme o rótulo + 150 g de morangos. Os 30 g de pó na opção são provisórios. Cadastre os rótulos para calcular e incluir a vitamina nos totais.",
  }));
  addMachinePack(next);
  next.onboarded = true;
  return validateBackup(next);
}
