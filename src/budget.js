import foods from "./budget-foods.json" with { type: "json" };
import { total, uid } from "./core.js";

export const BUDGET_FOODS = foods;
export const BUDGET_MEALS = [
  {
    key: "breakfast",
    name: "Café da manhã",
    items: [
      ["egg", 100, "aproximadamente 2 ovos, sem casca"],
      ["oats", 60, "peso seco; pode preparar com água"],
      ["banana", 100, "sem casca; tamanho da fruta varia"],
    ],
  },
  {
    key: "lunch",
    name: "Almoço",
    items: [
      ["rice", 200, "peso já cozido"],
      ["beans", 100, "peso já cozido"],
      ["chicken", 120, "peso já cozido, sem pele"],
      ["cabbage", 50, "peso cru"],
      ["tomato", 100, "peso cru"],
      ["oil", 12, "total de óleo usado nesta refeição, inclusive no preparo"],
    ],
  },
  {
    key: "snack",
    name: "Lanche da tarde",
    items: [
      ["bread", 50, "aproximadamente 1 pão francês"],
      ["egg", 100, "aproximadamente 2 ovos, sem casca"],
      ["banana", 100, "sem casca"],
    ],
  },
  {
    key: "dinner",
    name: "Jantar",
    items: [
      ["rice", 200, "peso já cozido"],
      ["beans", 100, "peso já cozido"],
      ["chicken", 100, "peso já cozido, sem pele"],
      ["cabbage", 50, "peso cru"],
      ["tomato", 100, "peso cru"],
      ["oil", 12, "total de óleo usado nesta refeição, inclusive no preparo"],
    ],
  },
];
export function budgetRows() {
  return BUDGET_MEALS.flatMap((m) =>
    m.items.map(([key, quantity, portionNote]) => ({
      ...structuredClone(BUDGET_FOODS.find((f) => f.key === key)),
      quantity,
      portionNote,
      modelMeal: m.key,
      meal: m.name,
      planSeed: `budget-v1:${m.key}:${key}`,
    })),
  );
}
export function budgetGoals() {
  const t = total(budgetRows());
  return {
    kcal: Math.round(t.kcal / 50) * 50,
    protein: Math.round(t.protein / 5) * 5,
    carbs: Math.round(t.carbs / 5) * 5,
    fat: Math.round(t.fat / 5) * 5,
  };
}
export function addBudgetPlan(state, mealMap, { useGoals = false } = {}) {
  for (const m of BUDGET_MEALS)
    if (!state.meals.includes(mealMap[m.key]))
      throw Error("Escolha a refeição de destino para cada parte do exemplo.");
  let added = 0;
  for (const row of budgetRows()) {
    if (state.plans.some((p) => p.planSeed === row.planSeed)) continue;
    const sourceKey = "taco:" + row.tacoId;
    let food = state.foods.find((f) => f.sourceKey === sourceKey);
    if (!food) {
      food = {
        ...structuredClone(BUDGET_FOODS.find((f) => f.key === row.key)),
        sourceKey,
        id: uid(),
      };
      state.foods.push(food);
    }
    state.plans.push({
      ...row,
      id: uid(),
      foodId: food.id,
      meal: mealMap[row.modelMeal],
    });
    added++;
  }
  if (useGoals) Object.assign(state.profile, budgetGoals());
  return added;
}
