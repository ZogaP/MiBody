import extraFoods from "./menu-foods.json" with { type: "json" };
import { BUDGET_FOODS } from "./budget.js";
import { uid, num, nutrients } from "./core.js";

export const MENU_FOODS = [...BUDGET_FOODS, ...extraFoods];
export const LABEL_INGREDIENTS = {
  milk: { name: "Leite integral", unit: "ml", reference: 100, quantity: 250 },
  whey: { name: "Whey", unit: "g", reference: 30, quantity: 30 },
};
// Quantities belong to each recipe, rather than claiming equal nutrients across swaps.
export const MEAL_OPTIONS = [
  {
    id: "shake-strawberry",
    group: "shake",
    name: "Vitamina de morango com whey",
    note: "Bata o leite, o whey e os morangos. Morangos congelados também funcionam. Confira a porção do seu whey no rótulo.",
    items: [
      ["milk", 250],
      ["whey", 30],
      ["strawberry", 150],
    ],
  },
  {
    id: "shake-oats",
    group: "shake",
    name: "Vitamina de morango com aveia",
    note: "A mesma vitamina com aveia para variar a textura. A aveia acrescenta energia; confira o total antes de escolher.",
    items: [
      ["milk", 250],
      ["whey", 30],
      ["strawberry", 150],
      ["oats", 20],
    ],
  },
  {
    id: "chicken-carrot",
    group: "main",
    name: "Arroz, feijão e frango com cenoura",
    note: "Grelhe o frango e sirva com a cenoura cozida. Prepare porções de arroz e feijão para congelar.",
    items: [
      ["rice", 250],
      ["beans", 150],
      ["grilled-chicken", 100],
      ["carrot", 150],
      ["oil", 10],
    ],
  },
  {
    id: "chicken-beet",
    group: "main",
    name: "Arroz, feijão e frango com beterraba",
    note: "Frango grelhado com beterraba cozida como acompanhamento.",
    items: [
      ["rice", 250],
      ["beans", 150],
      ["grilled-chicken", 100],
      ["beet", 150],
      ["oil", 10],
    ],
  },
  {
    id: "chicken-sauce",
    group: "main",
    name: "Frango grelhado ao molho de tomate",
    note: "Grelhe o frango e acrescente o molho de tomate. Sirva com arroz, feijão e cenoura.",
    items: [
      ["rice", 220],
      ["beans", 150],
      ["grilled-chicken", 100],
      ["sauce", 100],
      ["carrot", 100],
      ["oil", 10],
    ],
  },
  {
    id: "eggs-rice",
    group: "main",
    name: "Arroz, feijão e ovos cozidos",
    note: "Uma alternativa com ovos: 150 g sem casca equivalem aproximadamente a três ovos. O tamanho dos ovos varia.",
    items: [
      ["rice", 220],
      ["beans", 150],
      ["egg", 150],
      ["carrot", 150],
      ["oil", 8],
    ],
  },
  {
    id: "pasta-beef",
    group: "main",
    name: "Macarrão com carne moída e molho de tomate",
    note: "Pese a massa seca e a carne crua antes de preparar. Use patinho moído sem gordura aparente como referência. Outras carnes e molhos alteram os nutrientes.",
    items: [
      ["pasta", 90],
      ["beef", 130],
      ["sauce", 150],
      ["carrot", 100],
      ["oil", 8],
    ],
  },
  {
    id: "pasta-chicken",
    group: "main",
    name: "Macarrão com frango grelhado",
    note: "Pese a massa seca antes de cozinhar. Corte o frango já grelhado em tiras e misture com molho de tomate. Sirva com beterraba.",
    items: [
      ["pasta", 90],
      ["grilled-chicken", 100],
      ["sauce", 150],
      ["beet", 100],
      ["oil", 8],
    ],
  },
  {
    id: "chicken-potato",
    group: "main",
    name: "Arroz, feijão, frango e batata",
    note: "Uma porção menor de arroz acompanha a batata inglesa cozida; mantenha o frango grelhado e a cenoura.",
    items: [
      ["rice", 150],
      ["beans", 150],
      ["grilled-chicken", 100],
      ["potato", 200],
      ["carrot", 100],
      ["oil", 10],
    ],
  },
  {
    id: "chicken-sweet-potato",
    group: "main",
    name: "Arroz, feijão, frango e batata-doce",
    note: "Varie o acompanhamento com batata-doce cozida e beterraba.",
    items: [
      ["rice", 150],
      ["beans", 150],
      ["grilled-chicken", 100],
      ["sweet-potato", 150],
      ["beet", 100],
      ["oil", 10],
    ],
  },
];
export function ingredientNote(key) {
  if (key === "pasta")
    return "Peso seco, antes de cozinhar; não é o peso da massa pronta.";
  if (key === "beef")
    return "Peso cru, antes de preparar; referência de patinho sem gordura.";
  if (key === "oil")
    return "Óleo total do preparo desta refeição; não acrescente novamente se já foi contabilizado.";
  if (key === "egg") return "Peso cozido, sem casca.";
  if (key === "oats") return "Peso seco.";
  if (key === "strawberry") return "Parte comestível, sem folhas.";
  if (key === "sauce")
    return "Molho pronto; valores médios TACO. Confira o rótulo do seu molho.";
  if (key === "whey")
    return "Peso do pó. Confira a porção no rótulo; dosadores variam de tamanho.";
  if (key === "milk") return "Volume em ml; nutrientes do rótulo informado.";
  return "Peso depois de preparar/cozinhar.";
}
export function optionRows(state, optionId, labels = {}, portions = {}) {
  const option = MEAL_OPTIONS.find((o) => o.id === optionId);
  if (!option) throw Error("Opção de refeição não encontrada.");
  return option.items.map(([key, quantity]) => {
    const label = LABEL_INGREDIENTS[key];
    const food = label
      ? state.foods.find((f) => f.id === labels[key] && f.unit === label.unit)
      : MENU_FOODS.find((f) => f.key === key);
    if (
      !food ||
      !num(food.reference) ||
      nutrients.some(
        (n) => !Number.isFinite(Number(food[n])) || num(food[n]) < 0,
      )
    )
      throw Error(
        `Cadastre e selecione o rótulo de ${label?.name || key} para calcular os nutrientes.`,
      );
    quantity = portions[key] === undefined ? quantity : num(portions[key]);
    if (quantity <= 0) throw Error("Informe quantidades maiores que zero.");
    return {
      ...structuredClone(food),
      quantity,
      portionNote: ingredientNote(key),
      menuOption: optionId,
    };
  });
}
export const planForDate = (state, date) =>
  state.planDays?.find((d) => d.date === date);
export const plannedRows = (state, date) =>
  planForDate(state, date)?.items ?? state.plans;
export function ensurePlanDay(state, date) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw Error("Escolha uma data válida.");
  let record = planForDate(state, date);
  if (!record) {
    record = { id: uid(), date, items: structuredClone(state.plans) };
    (state.planDays ??= []).push(record);
  }
  return record;
}
export function chooseMealOption(
  state,
  date,
  meal,
  optionId,
  labels = {},
  portions = {},
) {
  if (!state.meals.includes(meal))
    throw Error("Escolha uma refeição de destino válida.");
  const rows = optionRows(state, optionId, labels, portions);
  const record = ensurePlanDay(state, date);
  record.items = record.items.filter((r) => r.meal !== meal);
  for (const row of rows) {
    let food = state.foods.find((f) =>
      row.tacoId ? f.sourceKey === `taco:${row.tacoId}` : f.id === row.id,
    );
    if (!food) {
      const { quantity, portionNote, menuOption, ...reference } = row;
      food = { ...reference, sourceKey: `taco:${row.tacoId}`, id: uid() };
      state.foods.push(food);
    }
    record.items.push({ ...row, id: uid(), foodId: food.id, meal });
  }
  return rows.length;
}
export function copyDayPlan(state, from, to) {
  if (from === to) throw Error("Escolha uma data diferente.");
  const items = plannedRows(state, from).map((r) => ({
    ...structuredClone(r),
    id: uid(),
  }));
  if (!items.length)
    throw Error("Adicione refeições ao cardápio antes de copiar.");
  ensurePlanDay(state, to).items = items;
}
