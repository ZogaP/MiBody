import "./style.css";
import {
  uid,
  day,
  num,
  total,
  volume,
  elapsed,
  progress,
  goalText,
  initial,
  startSession,
  substituteExercise,
  validateBackup,
  csv,
  nutrients,
} from "./core.js";
import { openDB, saveDB } from "./db.js";
import {
  BUDGET_MEALS,
  budgetRows,
  budgetGoals,
  addBudgetPlan,
} from "./budget.js";
import {
  MACHINE_CATALOG,
  PPL_MACHINES,
  machineExercise,
  exerciseChoices,
  isMachine,
  addMachineLibrary,
  addMachinePack,
} from "./machines.js";

import {
  MEAL_OPTIONS,
  MENU_FOODS,
  LABEL_INGREDIENTS,
  ingredientNote,
  optionRows,
  chooseMealOption,
  plannedRows,
  planForDate,
  ensurePlanDay,
  copyDayPlan,
} from "./menus.js";

const basePath = import.meta.env.BASE_URL;
const iconURL = document.querySelector('link[rel="icon"]').href;
const portable = document.documentElement.dataset.portable === "true";
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v, d = 0) =>
  num(v).toLocaleString("pt-BR", { maximumFractionDigits: d });
const dateLabel = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
const time = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const paths = {
  home: "M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  workout: "M6 6v12M3 8v8m15-10v12m3-10v8M6 12h12",
  food: "M4 3v6a3 3 0 0 0 6 0V3M7 3v18m13 0V3c-5 2-5 10 0 10",
  chart: "M4 3v17h17M7 14l5-5 4 3 5-8",
  user: "M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  plus: "M12 5v14M5 12h14",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  water: "M12 3C9 8 5 12 5 16a7 7 0 0 0 14 0c0-4-4-8-7-13z",
  flame:
    "M12 3c0 7-7 7-7 13a7 7 0 0 0 14 0c0-3-2-5-3-7-1 3-3 3-3 3 1-4 0-6-1-9z",
  check: "M5 12l4 4L20 5",
  close: "M6 6l12 12M6 18 18 6",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  weight: "M5 8h14l2 13H3zM9 8V6a3 3 0 0 1 6 0v2",
  calendar: "M4 5h16v16H4zM8 3v4m8-4v4M4 10h16",
  edit: "M14 5l5 5M4 20l5-1L21 7l-5-5L4 14z",
  download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  shield: "M12 2l8 4v7c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6",
  trophy:
    "M8 3h8v8a4 4 0 0 1-8 0zM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 15v6m-4 0h8",
  pause: "M8 4v16M16 4v16",
  play: "M7 3l14 9-14 9z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
};
const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.plus}"/></svg>`;
const btn = (text, action, cls = "", extra = "") =>
  `<button type="button" class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const input = (label, name, value = "", type = "text", extra = "") =>
  `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const decimal = (label, name, value = "", extra = "") =>
  input(label, name, value, "text", `inputmode="decimal" data-number ${extra}`);
const select = (label, name, options, value = "") =>
  `<label>${label}<select name="${name}">${options
    .map((o) => {
      const [v, t] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(t)}</option>`;
    })
    .join("")}</select></label>`;
const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const weekdays = (selected) =>
  `<fieldset class="full"><legend>Dias da semana</legend><div class="row wrap">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label class="check"><input type="checkbox" name="days" value="${d}" ${selected?.includes(d) ? "checked" : ""}>${days[d]}</label>`).join("")}</div></fieldset>`;
let state,
  page = "home",
  tab = "fichas",
  selectedDate = day(),
  bodyMetric = "weight",
  period = "90",
  historyFilter = "",
  foodTab = "diario",
  planScope = "day",
  optionGroup = "all",
  optionMeal = "",
  optionReturn = null,
  optionLabelKey = null,
  optionDraft = null,
  installEvent = null,
  lastRest = null,
  draft = null,
  editId = null,
  foodMode = "entry",
  toastTimer;
let writing = Promise.resolve();
async function persist() {
  const snapshot = structuredClone(state);
  writing = writing.catch(() => {}).then(() => saveDB(snapshot));
  try {
    await writing;
    $("#storage-error").hidden = true;
    return true;
  } catch (e) {
    const el = $("#storage-error");
    el.hidden = false;
    el.textContent =
      "Não foi possível salvar. Seus dados ainda estão nesta tela. Faça um backup antes de sair e libere espaço no dispositivo.";
    console.error("IndexedDB:", e.name);
    return false;
  }
}
function toast(msg) {
  if (!$("#storage-error").hidden && !msg.startsWith("Backup")) {
    msg = "Gravação pendente. Faça um backup antes de sair.";
  }
  $("#toast").textContent = msg;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function modal(title, content, submit = "", label = "Salvar") {
  const m = $("#modal");
  m.innerHTML = `<header><h2>${title}</h2>${btn(icon("close"), "close", "icon", 'aria-label="Fechar"')}</header>${submit ? `<form data-form="${submit}">` : ""}${content}${submit ? `<div class="inline-error" role="alert"></div><footer>${btn("Cancelar", "close", "ghost")}<button type="submit" class="primary">${label}</button></footer></form>` : ""}`;
  if (!m.open) m.showModal();
}
function close() {
  optionReturn = null;
  optionDraft = null;
  $("#modal").close();
}
function empty(title, text, action, label, ico = "plus") {
  return `<div class="empty">${icon(ico, 30)}<h3>${title}</h3><p>${text}</p>${action ? btn(label, action, "primary") : ""}</div>`;
}
function header(title, sub, action = "") {
  return `<div class="page-head"><div><h1>${title}</h1><p>${sub}</p></div>${action}</div>`;
}
function bar(value, goal) {
  const pct = num(goal) > 0 ? Math.min(100, (num(value) / num(goal)) * 100) : 0;
  return `<div class="progress" role="progressbar" aria-label="Progresso em relação à meta" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct}%"></i></div>`;
}
function totals(date = selectedDate) {
  return total(state.entries.filter((e) => e.date === date));
}
function waterTotal(date = selectedDate) {
  return state.water
    .filter((e) => e.date === date)
    .reduce((a, e) => a + e.ml, 0);
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
function render() {
  document.body.classList.toggle("light", state.profile.theme === "light");
  const nav = [
    ["home", "Hoje"],
    ["workout", "Treinos"],
    ["food", "Alimentação"],
    ["chart", "Evolução"],
    ["user", "Perfil"],
  ];
  $("#app").innerHTML =
    `<div class="shell"><aside class="sidebar"><div><div class="brand"><img src="${iconURL}" alt=""><span>Mi<span>Body</span></span></div><p class="tagline">SEU RITMO. SUA EVOLUÇÃO.</p></div><nav aria-label="Navegação principal">${nav.map(([id, name]) => btn(`${icon(id)}<span>${name}</span>`, "nav", page === id ? "active" : "", `data-page="${id}" ${page === id ? 'aria-current="page"' : ""}`)).join("")}</nav><div class="sidebar-foot"><div class="avatar">${esc((state.profile.name || "M").slice(0, 1).toUpperCase())}</div><div><h3 style="font-size:12px">${esc(state.profile.name || "Seu espaço pessoal")}</h3><small>Um dia de cada vez.</small></div></div></aside><main class="main"><div class="topbar"><span class="eyebrow">SEU ESPAÇO DE CUIDADO</span><div class="brand mobile-brand"><img src="${iconURL}" alt=""><span>Mi<span>Body</span></span></div><div class="row"><span class="status"><i class="dot"></i><span id="online-status">${navigator.onLine ? "Salvo neste dispositivo" : "Modo offline"}</span></span><input class="date-input" id="date" aria-label="Data dos registros" type="date" value="${selectedDate}">${btn(icon("sun", 18), "theme", "icon", 'aria-label="Alternar tema"')}</div></div>${{ home: homeView, workout: workoutView, food: foodView, chart: evolutionView, user: profileView }[page]()}<p class="info-line">${icon("shield", 14)} Seus dados ficam neste dispositivo. Faça backups regularmente.</p></main></div>`;
  tick();
}

function homeView() {
  const t = totals(),
    w = waterTotal();
  const session = state.active;
  const scheduled = state.templates.filter(
    (t) =>
      !t.archived &&
      t.days.includes(new Date(selectedDate + "T12:00:00").getDay()),
  );
  const complete = state.sessions.filter((s) => s.date === selectedDate);
  const p = session ? progress(session) : null;
  return `${header(`${greeting()}${state.profile.name ? ", " + esc(state.profile.name.split(" ")[0]) : ""} <span class="accent">.</span>`, selectedDate === day() ? "Cada escolha conta. Vamos cuidar de você hoje?" : `Seus registros de ${dateLabel(selectedDate)}.`, `<span class="pill">${new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" })}</span>`)}<div class="grid stats"><div class="card"><div class="stat-icon">${icon("flame")}</div><div class="eyebrow">Calorias consumidas</div><div class="metric">${fmt(t.kcal)} <span>kcal</span></div><small>${esc(goalText(t.kcal, state.profile.kcal, "kcal"))}</small></div><div class="card"><div class="stat-icon">${icon("workout")}</div><div class="eyebrow">Treinos no mês</div><div class="metric">${state.sessions.filter((s) => s.date.startsWith(selectedDate.slice(0, 7))).length} <span>sessões</span></div><small>Seu movimento, registrado.</small></div><div class="card"><div class="stat-icon">${icon("water")}</div><div class="eyebrow">Água hoje</div><div class="metric">${fmt(w / 1000, 2)} <span>litros</span></div><small>${state.profile.water ? `Meta de ${fmt(state.profile.water / 1000, 2)} L` : "Defina sua meta no perfil"}</small></div></div><div class="grid cols"><div class="stack"><section class="card hero"><div class="row between"><span class="eyebrow">${icon("workout", 16)} SEU PRÓXIMO PASSO</span><span class="badge">${session ? "EM ANDAMENTO" : "TREINO DO DIA"}</span></div>${session ? `<h2>${esc(session.name)}</h2><p class="muted">${p.done} de ${p.all} séries concluídas</p>${bar(p.done, p.all)}${btn("Continuar treino " + icon("arrow", 17), "continue", "primary")}` : scheduled.length ? `<h2>${esc(scheduled[0].name)}</h2><p class="muted">${scheduled[0].exercises.length} exercícios · Planejado para ${days[new Date(selectedDate + "T12:00:00").getDay()]}</p>${btn("Iniciar treino " + icon("arrow", 17), "start", "primary", `data-id="${scheduled[0].id}"`)}` : `<h2>Seu próximo treino<br>começa aqui.</h2><p class="muted">${state.templates.some((t) => !t.archived) ? "Escolha uma ficha e faça o dia acontecer." : "Monte sua primeira ficha no seu ritmo."}</p>${btn((state.templates.some((t) => !t.archived) ? "Escolher treino" : "Criar meu treino") + " " + icon("arrow", 17), state.templates.some((t) => !t.archived) ? "go-workouts" : "new-template", "primary")}`}</section><div><div class="section-label"><h2>Registro rápido</h2><small>Pequenos passos, todos os dias</small></div><div class="quick">${btn(icon("food") + "Alimento", "add-entry")}${btn(icon("water") + "Água", "add-water")}${btn(icon("weight") + "Peso e medidas", "add-body")}</div></div><section class="card"><div class="card-head"><h2>Seu movimento</h2><small>${dateLabel(selectedDate)}</small></div>${complete.length ? complete.map((s) => `<div class="list-item row between"><div class="row"><div class="workout-num">${icon("check")}</div><div><h3>${esc(s.name)}</h3><small>${fmt(volume(s))} kg de volume · ${time(elapsed(s))}</small></div></div>${btn(icon("arrow", 17), "session-detail", "icon", `data-id="${s.id}" aria-label="Detalhes de ${esc(s.name)}"`)}</div>`).join("") : empty("Espaço para a sua próxima conquista", "Os treinos que você concluir aparecem aqui.", "go-workouts", "Explorar minhas fichas", "chart")}</section></div><div class="stack"><section class="card"><div class="card-head"><h2>Nutrição do dia</h2>${btn(icon("plus", 18), "add-entry", "icon", 'aria-label="Adicionar alimento"')}</div><div class="row" style="gap:24px"><div class="ring" style="--angle:${num(state.profile.kcal) ? Math.min(360, (t.kcal / num(state.profile.kcal)) * 360) : 0}deg"><div><strong>${fmt(t.kcal)}</strong><small>kcal</small></div></div><div><small>ENERGIA PARA O SEU DIA</small><h3 style="margin:9px 0">${state.profile.kcal ? `${fmt(state.profile.kcal)} kcal de meta` : "No seu equilíbrio"}</h3><small>${state.entries.some((e) => e.date === selectedDate) ? "Cada refeição faz parte." : "Adicione sua primeira refeição."}</small></div></div><div class="macro-row">${[
    ["protein", "Proteínas"],
    ["carbs", "Carboidratos"],
    ["fat", "Gorduras"],
  ]
    .map(
      ([k, label]) =>
        `<div><small>${label}</small><strong>${fmt(t[k], 1)} <small>g</small></strong>${bar(t[k], state.profile[k])}<small>${state.profile[k] ? `de ${fmt(state.profile[k])} g` : "Sem meta"}</small></div>`,
    )
    .join(
      "",
    )}</div></section><section class="card"><div class="card-head"><h2>Uma pausa para hidratar</h2>${icon("water", 20)}</div><div class="metric">${fmt(w / 1000, 2)} <span>/ ${state.profile.water ? fmt(state.profile.water / 1000, 2) + " L" : "meta não definida"}</span></div><div class="water-drops">${Array.from({ length: 8 }, (_, i) => `<span class="${state.profile.water ? ((w / num(state.profile.water)) * 8 > i ? "" : "dim") : i < Math.floor(w / 250) ? "" : "dim"}">${icon("water", 23)}</span>`).join("")}</div><div class="row between"><small>${esc(goalText(w, state.profile.water, "ml"))}</small>${btn("+ " + fmt(state.profile.waterQuick || 250) + " ml", "quick-water", "mini")}</div></section><div class="note">${icon("shield", 16)} <strong>Seu espaço, seus dados.</strong><br>Sem conta e sem sincronização entre aparelhos. Você tem o controle dos seus registros.</div></div></div>`;
}

function workoutView() {
  if (state.active && tab === "sessao") return activeView();
  return `${header("Treinos", "Consistência começa com um treino de cada vez.", btn(icon("plus", 16) + " Nova ficha", "new-template", "primary"))}<div class="tabs">${[["fichas", "Minhas fichas"], ["historico", "Histórico"], ["biblioteca", "Biblioteca"], ["arquivo", "Arquivadas"], ...(state.active ? [["sessao", "Treino em andamento"]] : [])].map(([v, l]) => btn(l, "workout-tab", tab === v ? "selected" : "", `data-tab="${v}"`)).join("")}</div>${tab === "fichas" ? `<section class="card plan-intro"><div><span class="badge">MÁQUINAS E POLIAS</span><h2>PPL + Upper + Lower</h2><p class="form-help">Cinco fichas de exemplo, na ordem da sua divisão. Prioridade para pino seletor, sem halteres ou anilhas.</p></div>${btn("Ver divisão", "machine-pack", "primary")}</section>` : ""}${tab === "historico" ? historyView() : tab === "biblioteca" ? libraryView() : templatesView(tab === "arquivo")}`;
}
function packPreview() {
  const missing = PPL_MACHINES.filter(
    (t) =>
      !state.templates.some((x) => x.seedKey === "ppl-machines-v1:" + t.key),
  );
  const content = `<div class="note">Exemplos editáveis para organizar sua divisão. Séries, repetições e descansos são referências gerais; ajuste ao seu treino atual com o instrutor. As cargas ficam em branco.</div><p class="form-help spaced">Sugestão de distribuição: Push → Pull → Legs → descanso → Upper → Lower → descanso. Os dias abaixo são opcionais.</p>${PPL_MACHINES.map(
    (t) =>
      `<section class="plan-preview"><h3>${esc(t.name)}</h3><ol>${t.items
        .map(([key, sets, reps]) => {
          const e = MACHINE_CATALOG.find((e) => e.catalogKey === key);
          return `<li><strong>${esc(e.name)}</strong><small>${sets} × ${esc(reps)} · ${esc(e.equipment)}</small></li>`;
        })
        .join(
          "",
        )}</ol>${missing.includes(t) ? select("Dia de " + t.key.charAt(0).toUpperCase() + t.key.slice(1), "day-" + t.key, [["", "Sem dia fixo"], ...[1, 2, 3, 4, 5, 6, 0].map((d) => [d, days[d]])]) : "<small>Ficha já adicionada. Edite os dias em Minhas fichas ou Arquivadas.</small>"}</section>`,
  ).join(
    "",
  )}<div class="note spaced">Máquinas com anilhas, Smith e halteres não entram neste exemplo. Se só houver leg press com anilhas, escolha uma alternativa com o instrutor em vez de assumir que a carga é equivalente.</div>`;
  modal(
    "Sua divisão com máquinas",
    content +
      (missing.length
        ? ""
        : `<footer>${btn("Ver minhas fichas", "pack-close", "primary")}</footer>`),
    missing.length ? "machine-pack" : "",
    "Adicionar " + missing.length + " fichas",
  );
}
let chooserContext = "",
  chooserIndex = -1,
  chooserMovement = "",
  chooserMachines = true;
function showExerciseChooser(
  context = "draft",
  index = -1,
  keepFilters = false,
) {
  if (!keepFilters) {
    chooserContext = context;
    chooserIndex = index;
    chooserMachines =
      (state.profile.equipmentPreference || "machines") === "machines";
    chooserMovement =
      context === "replace" ? state.active.exercises[index].movement || "" : "";
  }
  let choices = exerciseChoices(
    state.library,
    (state.profile.equipmentPreference || "machines") === "machines",
  );
  if (chooserMachines) choices = choices.filter(isMachine);
  if (chooserMovement)
    choices = choices.filter((e) => e.movement === chooserMovement);
  const current = context === "replace" ? state.active.exercises[index] : null;
  if (current) choices = choices.filter((e) => e.name !== current.name);
  modal(
    context === "replace" ? "Escolher alternativa" : "Escolher exercício",
    `<div class="row wrap"><label class="check"><input type="checkbox" id="chooser-machines" ${chooserMachines ? "checked" : ""}>Só máquinas e polias</label>${current?.movement ? `<label class="check"><input type="checkbox" id="chooser-movement" ${chooserMovement ? "checked" : ""}>Mesmo movimento</label>` : ""}</div><p class="form-help spaced">${current ? "Séries já concluídas serão preservadas no exercício original. Confira os ajustes e use uma nova carga para o novo aparelho." : "As máquinas e polias aparecem primeiro conforme sua preferência. Você pode ajustar as séries antes de adicionar."}</p><div class="stack spaced">${choices.map((e) => btn(`<span><strong>${esc(e.name)}</strong><small>${esc(e.group)} · ${esc(e.equipment || "Equipamento não informado")}</small></span>`, "choose-exercise", "exercise-choice", `data-id="${e.id}"`)).join("") || '<p class="form-help">Não há outra opção neste filtro. Desmarque “Mesmo movimento” para explorar o catálogo, ou configure um exercício personalizado.</p>'}</div><footer>${btn("Personalizar", "chooser-custom", "ghost")}${btn("Voltar", context === "draft" ? "back-template" : "close", "ghost")}</footer>`,
  );
}
function templatesView(archived) {
  const list = state.templates.filter((t) => !!t.archived === archived);
  return list.length
    ? `<div class="grid cols">${list
        .map(
          (t, i) =>
            `<article class="card"><div class="card-head"><div class="row"><div class="workout-num">${String(i + 1).padStart(2, "0")}</div><div><h2>${esc(t.name)}</h2><small>${t.exercises.length} exercícios · ${t.days.length ? t.days.map((d) => days[d]).join(", ") : "Sem dia fixo"}</small>${t.example ? '<span class="pill">Exemplo editável · máquinas</span>' : ""}</div></div>${btn(icon("edit", 17), "edit-template", "icon", `data-id="${t.id}" aria-label="Editar ficha"`)}</div>${t.exercises
              .slice(0, 4)
              .map(
                (e) =>
                  `<div class="list-item row between"><div><h3>${esc(e.name)}</h3><small>${esc(e.group)} ${e.equipment ? "· " + esc(e.equipment) : ""}</small></div><small>${e.sets} × ${esc(e.reps || "livre")}</small></div>`,
              )
              .join(
                "",
              )}${t.exercises.length > 4 ? `<small>+ ${t.exercises.length - 4} exercícios</small>` : ""}<div class="row wrap spaced">${!archived ? btn("Iniciar treino " + icon("play", 14), "start", "primary", `data-id="${t.id}"`) : ""}${btn("Duplicar", "duplicate-template", "mini", `data-id="${t.id}"`)}${btn(archived ? "Reativar" : "Arquivar", "archive-template", "mini", `data-id="${t.id}"`)}${btn("↑", "move-template", "mini", `data-id="${t.id}" aria-label="Mover ficha para cima"`)}${btn(icon("trash", 16), "delete-template", "icon danger", `data-id="${t.id}" aria-label="Excluir ficha"`)}</div></article>`,
        )
        .join("")}</div>`
    : `<section class="card">${empty(archived ? "Nenhuma ficha arquivada" : "Um treino com a sua cara", archived ? "Ao arquivar uma ficha, seu histórico permanece salvo." : "Crie uma ficha com os exercícios que você já pratica ou que recebeu do seu profissional.", archived ? "" : "new-template", "Criar primeira ficha", "workout")}</section>`;
}
function libraryView() {
  return `<div class="note">Biblioteca de nomes editável. Não é uma prescrição de exercícios. Séries e cargas devem seguir seu planejamento.</div><div class="section-label"><h2>Seus exercícios</h2><div class="row wrap">${btn("Máquinas e polias", "add-machine-library", "ghost")}${btn("+ Exercício", "new-library", "primary")}</div></div><div class="card">${state.library.map((e) => `<div class="list-item row between"><div><h3>${esc(e.name)}</h3><p>${esc(e.group)} ${e.equipment ? "· " + esc(e.equipment) : ""}</p></div><div class="row">${btn(icon("edit", 16), "edit-library", "icon", `data-id="${e.id}" aria-label="Editar ${esc(e.name)}"`)}${btn(icon("trash", 16), "delete-library", "icon danger", `data-id="${e.id}" aria-label="Excluir ${esc(e.name)}"`)}</div></div>`).join("") || empty("Biblioteca vazia", "Cadastre exercícios para reutilizar nas fichas.", "new-library", "Novo exercício")}</div>`;
}
function templateEditor(id) {
  editId = id || null;
  draft = id
    ? structuredClone(state.templates.find((t) => t.id === id))
    : { id: uid(), name: "", days: [], exercises: [], archived: false };
  showTemplate();
}
function showTemplate() {
  modal(
    editId ? "Editar ficha" : "Nova ficha",
    `<div class="form-grid">${input("Nome da ficha", "name", draft.name, "text", 'required maxlength="100" class="full"')}${weekdays(draft.days)}</div><div class="section-label"><h3>Exercícios na ordem do treino</h3></div><div id="draft-exercises">${draft.exercises.map((e, i) => `<div class="list-item"><div class="row between"><div><h3>${i + 1}. ${esc(e.name)}</h3><small>${e.sets} séries · ${esc(e.reps || "repetições livres")} · ${esc(e.kg || "—")} kg</small></div><div class="row">${btn("↑", "draft-up", "mini", `data-index="${i}" aria-label="Mover exercício para cima"`)}${btn(icon("edit", 15), "draft-edit", "icon", `data-index="${i}" aria-label="Editar exercício"`)}${btn(icon("close", 15), "draft-remove", "icon danger", `data-index="${i}" aria-label="Remover exercício"`)}</div></div></div>`).join("") || '<p class="form-help">Adicione pelo menos um exercício.</p>'}</div><div class="row wrap spaced">${btn("+ Exercício personalizado", "draft-new", "ghost")}${btn("Usar biblioteca", "draft-library", "ghost")}</div>`,
    "template",
  );
}
function syncDraft() {
  const f = $('form[data-form="template"]');
  if (f) {
    draft.name = f.elements.name.value;
    draft.days = [...f.querySelectorAll("[name=days]:checked")].map((x) =>
      Number(x.value),
    );
  }
}
function exerciseFields(e = {}) {
  return `<div class="form-grid">${input("Nome do exercício", "name", e.name, "text", 'required maxlength="120"')}${input("Grupo muscular", "group", e.group || "")}${input("Equipamento", "equipment", e.equipment || "")}${input("Séries", "sets", e.sets || 3, "number", 'min="1" max="30" required')}${input("Repetições previstas (ou faixa)", "reps", e.reps || "", "text", 'placeholder="Ex.: 8–12 ou 30 s"')}${decimal("Carga de referência (kg)", "kg", e.kg || "")}${input("Descanso (segundos)", "rest", e.rest ?? state.profile.rest, "number", 'min="0" max="3600" required')}${input("Vídeo demonstrativo (opcional)", "video", e.video || "", "url", 'placeholder="https://…"')}<label class="full">Observações<textarea name="notes" rows="2">${esc(e.notes || "")}</textarea></label></div>`;
}
let exerciseContext = "",
  exerciseIndex = -1,
  exerciseSource = {};
function exerciseEditor(context, e = {}, index = -1) {
  exerciseContext = context;
  exerciseIndex = index;
  exerciseSource = structuredClone(e);
  modal(
    context === "library-edit" ? "Editar exercício" : "Configurar exercício",
    exerciseFields(e),
    "exercise",
  );
}
function activeView() {
  const s = state.active,
    p = progress(s);
  return `${header(esc(s.name), "Seu foco agora é a próxima série.", `<div class="row wrap"><span class="badge">${s.pausedAt ? "PAUSADO" : "EM ANDAMENTO"}</span>${btn("Minhas fichas", "session-to-templates", "mini")}</div>`)}<div class="timer"><div><small>Tempo de treino</small><br><strong id="elapsed">${time(elapsed(s))}</strong></div><div id="rest-display"></div><div class="row">${btn(icon(s.pausedAt ? "play" : "pause", 16), s.pausedAt ? "resume" : "pause", "icon", `aria-label="${s.pausedAt ? "Continuar" : "Pausar"} treino"`)}${btn(icon("clock", 16), "rest", "icon", 'aria-label="Configurar descanso"')}</div></div><div class="row between spaced"><small>${p.done} de ${p.all} séries concluídas</small><strong>${p.all ? Math.round((p.done / p.all) * 100) : 0}%</strong></div>${bar(p.done, p.all)}<div class="note">Campos vazios são sugestões, não registros. Preencha carga e repetições antes de concluir a série. Para exercícios sem carga, registre 0 kg. O descanso alerta apenas com o app aberto.</div>${s.exercises
    .map((e, i) => {
      const previous = state.sessions
        .slice()
        .sort((a, b) => b.startedAt - a.startedAt)
        .flatMap((s) => s.exercises)
        .find(
          (x) =>
            x.name.toLowerCase() === e.name.toLowerCase() &&
            x.sets.some((s) => s.done),
        );
      return `<section class="exercise"><div class="row between"><div><small>EXERCÍCIO ${String(i + 1).padStart(2, "0")}</small><h3 style="margin-top:7px">${esc(e.name)}</h3></div>${btn("Substituir", "replace-exercise", "mini", `data-index="${i}"`)}</div><p class="form-help">${esc(e.group)} ${e.equipment ? "· " + esc(e.equipment) : ""} · Descanso: ${e.rest} s</p>${e.notes ? `<p class="note spaced">${esc(e.notes)}</p>` : ""}${e.video && /^https?:\/\//.test(e.video) ? `<a href="${esc(e.video)}" target="_blank" rel="noopener noreferrer" class="form-help">Vídeo de execução ↗</a>` : ""}<p class="form-help spaced">Planejado: ${esc(e.referenceReps || "livre")} repetições ${e.referenceKg !== "" && e.referenceKg !== undefined ? "· " + esc(e.referenceKg) + " kg" : ""}<br>Último registro: ${
        previous
          ? previous.sets
              .filter((s) => s.done)
              .map((s) => `${fmt(s.kg, 1)} kg × ${s.reps}`)
              .join(" · ")
          : "ainda não há séries anteriores"
      }</p><div class="set-head"><span>Série</span><span>Carga (kg)</span><span>Repetições</span><span>Feita</span></div>${e.sets.map((set, j) => `<div class="set ${set.done ? "done" : ""}"><small>${j + 1}</small><input aria-label="Carga exercício ${i + 1} série ${j + 1}" inputmode="decimal" data-set-input="kg" data-exercise="${i}" data-set="${j}" value="${esc(set.kg)}" placeholder="${esc(e.referenceKg || "kg")}"><input aria-label="Repetições exercício ${i + 1} série ${j + 1}" inputmode="numeric" data-set-input="reps" data-exercise="${i}" data-set="${j}" value="${esc(set.reps)}" placeholder="${esc(e.referenceReps || "reps")}">${btn(icon("check", 19), "toggle-set", "icon", `data-exercise="${i}" data-set="${j}" aria-label="${set.done ? "Desmarcar" : "Concluir"} série ${j + 1} de ${esc(e.name)}" aria-pressed="${set.done}"`)}</div>`).join("")}<div class="row wrap spaced">${btn("+ Série", "add-set", "mini", `data-index="${i}"`)}${btn("− Última série", "remove-set", "mini", `data-index="${i}"`)}${btn("Observações", "session-exercise-notes", "mini", `data-index="${i}"`)}</div></section>`;
    })
    .join(
      "",
    )}<div class="session-actions spaced">${btn("+ Exercício", "session-add", "ghost")}${btn("Anotação da sessão", "session-notes", "ghost")}${btn("Finalizar treino " + icon("check", 16), "finish", "primary")}${btn("Descartar", "discard", "danger")}</div>`;
}
function calendar() {
  const date = new Date(selectedDate + "T12:00:00"),
    year = date.getFullYear(),
    month = date.getMonth(),
    n = new Date(year, month + 1, 0).getDate(),
    offset = new Date(year, month, 1).getDay();
  return `<div class="card"><div class="row between">${btn("‹", "month-prev", "icon", 'aria-label="Mês anterior"')}<h3>${date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h3>${btn("›", "month-next", "icon", 'aria-label="Próximo mês"')}</div><div class="calendar">${days.map((d) => `<small>${d}</small>`).join("")}${"<span></span>".repeat(offset)}${Array.from(
    { length: n },
    (_, i) => {
      const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      return btn(
        String(i + 1),
        "calendar-date",
        `${state.sessions.some((s) => s.date === d) ? "trained" : ""} ${d === selectedDate ? "chosen" : ""}`,
        `data-date="${d}" aria-label="${d}${state.sessions.some((s) => s.date === d) ? ", com treino" : ""}"`,
      );
    },
  ).join(
    "",
  )}</div><small>Dias destacados têm sessões concluídas.</small></div>`;
}
function historyView() {
  const weekStart = new Date(selectedDate + "T12:00:00");
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const sessions = state.sessions
    .filter(
      (s) =>
        (!historyFilter || s.templateId === historyFilter) &&
        s.date.startsWith(selectedDate.slice(0, 7)),
    )
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt - a.startedAt);
  return `<div class="grid cols"><div class="stack">${calendar()}<div class="card"><h2>Frequência</h2><div class="row spaced" style="gap:40px"><div><div class="metric">${state.sessions.filter((s) => s.date >= day(weekStart) && s.date < day(weekEnd)).length}</div><small>sessões na semana selecionada</small></div><div><div class="metric">${state.sessions.filter((s) => s.date.startsWith(selectedDate.slice(0, 7))).length}</div><small>sessões no mês selecionado</small></div></div></div></div><div class="card"><div class="card-head"><h2>Sessões do mês</h2><span class="pill">${sessions.length} sessões</span></div>${select("Filtrar por ficha", "history-filter", [["", "Todas as fichas"], ...Array.from(new Map([...state.templates, ...state.sessions.map((s) => ({ id: s.templateId, name: s.name }))].map((t) => [t.id, t.name]))).map(([id, n]) => [id, n])], historyFilter)}${sessions.length ? sessions.map((s) => `<div class="list-item row between spaced"><div><small>${dateLabel(s.date)}</small><h3>${esc(s.name)}</h3><p>${time(elapsed(s))} · ${progress(s).done} séries · ${fmt(volume(s))} kg</p></div>${btn(icon("arrow", 16), "session-detail", "icon", `data-id="${s.id}" aria-label="Ver sessão ${esc(s.name)}"`)}</div>`).join("") : empty("Nenhuma sessão neste mês", "Finalize um treino para ver seus registros aqui.", "go-workouts", "Ver fichas", "calendar")}</div></div>`;
}
function sessionDetail(id) {
  const s = state.sessions.find((x) => x.id === id),
    prev = state.sessions
      .filter((x) => x.templateId === s.templateId && x.startedAt < s.startedAt)
      .sort((a, b) => b.startedAt - a.startedAt)[0];
  modal(
    esc(s.name),
    `<span class="badge">TREINO CONCLUÍDO · ${dateLabel(s.date)}</span><div class="grid stats spaced"><div><div class="metric">${time(elapsed(s))}</div><small>duração ativa</small></div><div><div class="metric">${progress(s).done}</div><small>séries concluídas</small></div><div><div class="metric">${fmt(volume(s))}</div><small>kg de volume</small></div></div><p class="form-help">${s.exercises.filter((e) => e.sets.some((s) => s.done)).length} exercícios realizados. Volume = soma de kg × repetições das séries concluídas.</p>${prev ? `<div class="note spaced">Sessão anterior (${dateLabel(prev.date)}): ${fmt(volume(prev))} kg de volume e ${progress(prev).done} séries. Diferença: ${fmt(volume(s) - volume(prev))} kg. Compare considerando mudanças nos exercícios e séries.</div>` : ""}${s.exercises.map((e) => `<div class="list-item spaced"><h3>${esc(e.name)}</h3>${e.sets.map((x, i) => `<p class="form-help">Série ${i + 1}: ${x.done ? `${fmt(x.kg, 1)} kg × ${fmt(x.reps)} reps` : "não concluída"}</p>`).join("")}${e.notes ? `<small>${esc(e.notes)}</small>` : ""}</div>`).join("")}${s.notes ? `<div class="note spaced">${esc(s.notes)}</div>` : ""}<div class="row spaced">${btn("Fechar", "close", "primary")}${btn("Excluir sessão", "delete-session", "danger", `data-id="${s.id}"`)}</div>`,
  );
}

function foodView() {
  const t = totals();
  return `${header("Alimentação", "Mais consciência em cada refeição.", btn(icon("plus", 16) + " Registrar", "add-entry", "primary"))}<div class="tabs">${[
    ["diario", "Diário alimentar"],
    ["plano", "Meu plano alimentar"],
    ["opcoes", "Opções de cardápio"],
    ["alimentos", "Meus alimentos"],
    ["frequentes", "Refeições frequentes"],
  ]
    .map(([v, l]) =>
      btn(l, "food-tab", foodTab === v ? "selected" : "", `data-tab="${v}"`),
    )
    .join("")}</div>${
    foodTab === "opcoes"
      ? mealOptionsView()
      : foodTab === "alimentos"
        ? foodLibrary()
        : foodTab === "frequentes"
          ? favoritesView()
          : `${
              foodTab === "plano"
                ? plannedOverview()
                : `<section class="card"><div class="row between"><div><small>CONSUMIDO EM ${dateLabel(selectedDate).toUpperCase()}</small><div class="metric">${fmt(t.kcal)} <span>kcal ${state.profile.kcal ? " / " + fmt(state.profile.kcal) : ""}</span></div><small>${esc(goalText(t.kcal, state.profile.kcal, "kcal"))}</small></div>${icon("food", 28)}</div><div class="macro-row">${[
                    ["protein", "Proteínas"],
                    ["carbs", "Carboidratos"],
                    ["fat", "Gorduras"],
                  ]
                    .map(
                      ([k, l]) =>
                        `<div><small>${l}</small><strong>${fmt(t[k], 1)} g</strong>${bar(t[k], state.profile[k])}<small>${esc(goalText(t[k], state.profile[k], "g"))}</small></div>`,
                    )
                    .join(
                      "",
                    )}</div><p class="form-help spaced">Fibras: ${fmt(t.fiber, 1)} g · Sódio: ${fmt(t.sodium)} mg</p></section>`
            }<div class="section-label"><h2>${foodTab === "plano" ? "Suas refeições planejadas" : "Suas refeições"}</h2><div class="row">${btn("Editar refeições", "edit-meals", "mini")}${foodTab === "plano" ? btn("+ Planejar", "add-plan", "primary mini") : ""}</div></div><div class="grid cols">${state.meals.map((meal) => mealCard(meal, foodTab === "plano")).join("")}</div>`
  }`;
}
function currentPlans() {
  return planScope === "default"
    ? state.plans
    : plannedRows(state, selectedDate);
}
function dateNavigation() {
  return `<div class="card menu-date row between wrap spaced"><div><small>CARDÁPIO DA DATA</small><h2>${dateLabel(selectedDate)}</h2></div><div class="row">${btn("← Anterior", "menu-date", "mini", 'data-offset="-1"')}${btn("Próximo →", "menu-date", "mini", 'data-offset="1"')}</div></div>`;
}
function plannedOverview() {
  const rows = currentPlans(),
    t = total(rows),
    custom = planForDate(state, selectedDate);
  return `${dateNavigation()}<section class="card plan-intro"><div><span class="badge">VARIE DURANTE A SEMANA</span><h2>Escolha o que comer em cada dia</h2><p class="form-help">Vitaminas para café e lanche; arroz, feijão, frango, ovos e macarrão para as refeições principais.</p></div>${btn("Explorar opções", "menu-options", "primary")}</section><div class="row wrap spaced">${btn("Plano desta data", "plan-scope", planScope === "day" ? "selected" : "mini", 'data-scope="day"')}${btn("Plano padrão", "plan-scope", planScope === "default" ? "selected" : "mini", 'data-scope="default"')}${planScope === "day" ? btn("Copiar cardápio para outra data", "copy-plan-day", "mini") : ""}${custom && planScope === "day" ? btn("Voltar ao padrão nesta data", "reset-plan-day", "mini") : ""}</div><p class="form-help spaced">${planScope === "default" ? "Editando o plano padrão usado nos dias sem cardápio próprio. Cardápios já personalizados são preservados." : custom ? `Cardápio próprio de ${dateLabel(selectedDate)}. Alterações aqui valem somente para esta data.` : `Esta data usa o plano padrão. Você pode editá-lo ou ${btn("Personalizar somente esta data", "customize-plan-day", "mini")}.`}</p><div class="note spaced">Planejar não registra consumo. Use “Registrar consumo” somente quando comer. As opções têm totais diferentes; confira as porções e suas metas.</div>${rows.length ? `<section class="card spaced"><small>TOTAL PLANEJADO · ESTIMATIVAS</small><div class="metric">${fmt(t.kcal)} <span>kcal</span></div><p class="form-help">Proteínas: ${fmt(t.protein, 1)} g · Carboidratos: ${fmt(t.carbs, 1)} g · Gorduras: ${fmt(t.fat, 1)} g</p></section>` : ""}<div class="row wrap spaced">${btn("Ver exemplo econômico", "budget-preview", "ghost")}</div>`;
}
function mealOptionsView() {
  const options = MEAL_OPTIONS.filter(
    (o) => optionGroup === "all" || o.group === optionGroup,
  );
  return `${dateNavigation()}<div class="section-label"><div><h2>Opções para variar</h2><p class="form-help">Escolha uma combinação, ajuste as porções e use na data selecionada. Você também pode salvar suas próprias refeições como frequentes.</p></div></div><div class="row wrap spaced">${[
    ["all", "Todas"],
    ["shake", "Café e lanche"],
    ["main", "Almoço e jantar"],
  ]
    .map(([key, name]) =>
      btn(
        name,
        "option-group",
        optionGroup === key ? "selected" : "mini",
        `data-group="${key}"`,
      ),
    )
    .join("")}</div><div class="grid cols spaced">${options
    .map((o) => {
      const labels = o.items.some(([key]) => LABEL_INGREDIENTS[key]);
      const t = labels ? null : total(optionRows(state, o.id));
      return `<section class="card meal-option"><span class="badge">${o.group === "shake" ? "CAFÉ DA MANHÃ OU LANCHE" : "ALMOÇO OU JANTAR"}</span><h3>${esc(o.name)}</h3><p class="form-help">${esc(o.note)}</p><small>${t ? `≈ ${fmt(t.kcal)} kcal · P ${fmt(t.protein, 1)} g · C ${fmt(t.carbs, 1)} g · G ${fmt(t.fat, 1)} g` : "Calcule com os rótulos do seu leite e whey."}</small><div class="spaced">${btn("Ver e escolher", "meal-option", "primary mini", `data-id="${o.id}"`)}</div></section>`;
    })
    .join(
      "",
    )}</div><p class="form-help spaced">Porções de exemplo editáveis. Referências TACO/NEPA–UNICAMP; marcas, preparo e temperos alteram os valores. O óleo listado inclui todo o preparo. As combinações não são equivalentes em nutrientes.</p>`;
}
function mealOptionPreview(id) {
  const option = MEAL_OPTIONS.find((o) => o.id === id);
  if (!option) throw Error("Opção não encontrada.");
  const destination = state.meals.includes(optionMeal)
    ? optionMeal
    : option.group === "shake"
      ? "Café da manhã"
      : "Almoço";
  modal(
    esc(option.name),
    `<input type="hidden" name="optionId" value="${option.id}"><div class="note">${esc(option.note)}</div><div class="form-grid spaced">${input("Data do cardápio", "date", selectedDate, "date", "required")}${select("Refeição que será substituída", "meal", state.meals, destination)}</div><p class="form-help spaced">A confirmação substitui apenas esta refeição na data escolhida. Outras datas e consumos são preservados.</p>${option.items
      .map(([key, quantity]) => {
        const label = LABEL_INGREDIENTS[key],
          food = MENU_FOODS.find((f) => f.key === key);
        const choices = label
          ? state.foods.filter((f) => f.unit === label.unit)
          : [];
        const preferred = choices.find((f) =>
          key === "whey" ? /whey/i.test(f.name) : /leite/i.test(f.name),
        );
        return `<section class="plan-preview"><h3>${esc(label?.name || food.name)}</h3><p class="form-help">${esc(ingredientNote(key))}</p>${label ? `${select("Alimento do seu rótulo", "label-" + key, [["", "Selecione o rótulo cadastrado"], ...choices.map((f) => [f.id, f.name])], preferred?.id || "")}<div class="spaced">${btn("Cadastrar rótulo de " + label.name, "option-label", "mini", `data-key="${key}" data-option="${id}"`)}</div>` : `<small>${esc(food.source)}</small>`}<div class="spaced">${decimal(`Quantidade (${label?.unit || food.unit})`, "portion-" + key, quantity, "required data-positive")}</div></section>`;
      })
      .join(
        "",
      )}<p class="form-help spaced">O whey usa 30 g de pó como referência inicial; ajuste para a porção do seu produto. Nenhuma marca é presumida. Nas opções com macarrão, pese a massa seca; a carne moída usa peso cru. Os demais estados estão indicados em cada ingrediente.</p><p class="form-help spaced">Confira ingredientes, rótulos e contato cruzado conforme suas alergias.${state.profile.allergies ? ` Anotações locais: ${esc(state.profile.allergies)}.` : ""}</p>`,
    "choose-meal-option",
    "Usar nesta data",
  );
  const form = $('form[data-form="choose-meal-option"]');
  if (optionDraft?.optionId === id) {
    for (const [key, value] of Object.entries(optionDraft)) {
      if (form.elements[key]) form.elements[key].value = value;
    }
  }
  form.insertAdjacentHTML(
    "afterbegin",
    '<div id="option-totals" class="note spaced" aria-live="polite"></div>',
  );
  updateOptionTotals();
}
function updateOptionTotals() {
  const form = $('form[data-form="choose-meal-option"]');
  if (!form) return;
  try {
    const data = readForm(form);
    const option = MEAL_OPTIONS.find((o) => o.id === data.optionId);
    const labels = Object.fromEntries(
      Object.keys(LABEL_INGREDIENTS).map((k) => [k, data["label-" + k]]),
    );
    const portions = Object.fromEntries(
      option.items.map(([k]) => [k, data["portion-" + k]]),
    );
    const t = total(optionRows(state, option.id, labels, portions));
    $("#option-totals").textContent =
      `Total desta opção: ≈ ${fmt(t.kcal)} kcal · P ${fmt(t.protein, 1)} g · C ${fmt(t.carbs, 1)} g · G ${fmt(t.fat, 1)} g.`;
  } catch (e) {
    $("#option-totals").textContent = e.message;
  }
}
function budgetPreview() {
  const rows = budgetRows(),
    t = total(rows),
    g = budgetGoals();
  const missing = rows.filter(
    (r) => !state.plans.some((p) => p.planSeed === r.planSeed),
  );
  modal(
    "Exemplo de plano econômico",
    `<div class="note">Este exemplo é adicionado ao plano padrão; cardápios próprios de outras datas são preservados. Referência geral para você revisar e adaptar às suas necessidades. Os totais vêm da TACO (4ª edição, 2011) e variam com marca, preparo e quantidade. Este exemplo não calcula suas necessidades pessoais.</div>${state.plans.length && missing.length ? `<p class="note spaced">Você já tem ${state.plans.length} itens planejados. A confirmação adiciona o exemplo ao plano atual; revise os itens para montar o dia que pretende seguir.</p>` : ""}<div class="row wrap spaced"><span class="pill">≈ ${fmt(t.kcal)} kcal</span><span class="pill">P ${fmt(t.protein)} g</span><span class="pill">C ${fmt(t.carbs)} g</span><span class="pill">G ${fmt(t.fat)} g</span></div>${BUDGET_MEALS.map(
      (m) =>
        `<section class="plan-preview"><h3>${esc(m.name)}</h3><ol>${rows
          .filter((r) => r.modelMeal === m.key)
          .map(
            (r) =>
              `<li><strong>${esc(r.name)} · ${fmt(r.quantity)} g</strong><small>${esc(r.portionNote)}</small></li>`,
          )
          .join(
            "",
          )}</ol>${missing.length ? select("Adicionar em", "budget-" + m.key, state.meals, state.meals.includes(m.name) ? m.name : state.meals[0]) : ""}</section>`,
    ).join(
      "",
    )}<div class="note spaced">O óleo listado já representa o total da refeição, inclusive o usado no preparo. Os pesos de arroz, feijão e frango são depois de cozinhar. Porções em unidades são aproximações: os cálculos usam gramas.</div><p class="form-help spaced">Compre frutas e vegetais da época, compare preços locais de ovos, frango e proteína de soja e prepare porções para congelar. As substituições mudam os nutrientes: cadastre os valores do rótulo ao trocar alimentos.</p><p class="form-help spaced">Confira rótulos e contato cruzado para suas alergias. ${state.profile.allergies ? `Suas anotações locais: <strong>${esc(state.profile.allergies)}</strong>.` : ""}</p><p class="form-help spaced">Fonte: <a href="https://github.com/raulfdm/taco-api/tree/main/references" target="_blank" rel="noopener noreferrer">TACO/NEPA–UNICAMP, arquivos de referência e transcrição</a>. Sódio do sal adicionado e de outros temperos não está incluído.</p>${missing.length ? `<label class="check spaced"><input type="checkbox" name="useBudgetGoals">Usar metas de referência: ${fmt(g.kcal)} kcal, P ${g.protein} g, C ${g.carbs} g e G ${g.fat} g.</label><p class="form-help spaced">Marque somente se quiser substituir suas metas atuais por esses valores aproximados. Você pode editá-los depois no Perfil.</p>` : `<footer>${btn("Voltar ao meu plano", "budget-close", "primary")}</footer>`}`,
    missing.length ? "budget-plan" : "",
    "Adicionar ao planejamento",
  );
}
function mealCard(meal, planned) {
  const rows = (
      planned
        ? currentPlans()
        : state.entries.filter((e) => e.date === selectedDate)
    ).filter((e) => e.meal === meal),
    t = total(rows);
  return `<section class="card"><div class="card-head"><div><h2>${esc(meal)}</h2><small>${fmt(t.kcal)} kcal · P ${fmt(t.protein, 1)} g · C ${fmt(t.carbs, 1)} g · G ${fmt(t.fat, 1)} g</small></div>${btn(icon("plus", 18), planned ? "add-plan" : "add-entry", "icon", `data-meal="${esc(meal)}" aria-label="Adicionar em ${esc(meal)}"`)}</div>${rows.length ? rows.map((e) => `<div class="list-item"><div class="row between"><div><h3>${esc(e.name)}</h3><p>${fmt(e.quantity, 1)} ${esc(e.unit)} · ${fmt(total([e]).kcal)} kcal</p><small>${esc(e.source || "Cadastro manual")}${e.brand ? " · " + esc(e.brand) : ""}</small>${e.portionNote ? `<p class="form-help">${esc(e.portionNote)}</p>` : ""}</div><div class="row">${btn(icon("edit", 16), planned ? "edit-plan" : "edit-entry", "icon", `data-id="${e.id}" aria-label="Editar ${esc(e.name)}"`)}${btn(icon("trash", 16), planned ? "delete-plan" : "delete-entry", "icon danger", `data-id="${e.id}" aria-label="Remover ${esc(e.name)}"`)}</div></div>${planned ? `<div class="spaced">${btn("Registrar consumo", "consume-plan", "mini", `data-id="${e.id}"`)}</div>` : ""}</div>`).join("") : `<p class="form-help">${planned ? "Nada planejado. Adicione alimentos e quantidades." : "Nenhum alimento registrado nesta refeição."}</p>`}${planned ? `<div class="spaced">${btn("Escolher outra opção", "menu-options", "mini", `data-meal="${esc(meal)}"`)}</div>` : ""}${rows.length ? `<div class="row wrap spaced">${!planned ? btn("Copiar para outra data", "copy-meal", "mini", `data-meal="${esc(meal)}"`) : ""}${btn("Salvar como frequente", planned ? "favorite-plan" : "favorite-meal", "mini", `data-meal="${esc(meal)}"`)}</div>` : ""}</section>`;
}
function foodLibrary() {
  return `<div class="row wrap spaced" style="margin-bottom:20px">${btn("+ Alimento do rótulo", "new-food", "primary")}${btn("+ Receita", "new-recipe", "ghost")}</div><div class="card">${state.foods.length ? state.foods.map((f) => `<div class="list-item row between"><div><h3>${esc(f.name)}</h3><p>${fmt(f.kcal)} kcal por ${fmt(f.reference, 1)} ${esc(f.unit)}</p><small>${esc(f.source)}${f.brand ? " · " + esc(f.brand) : ""}</small></div><div class="row">${btn(icon("edit", 16), "edit-food", "icon", `data-id="${f.id}" aria-label="Editar alimento"`)}${btn(icon("trash", 16), "delete-food", "icon danger", `data-id="${f.id}" aria-label="Excluir alimento"`)}</div></div>`).join("") : empty("Seu próprio catálogo", "Cadastre alimentos a partir do rótulo. Os valores são informados por você, sem buscas simuladas.", "new-food", "Cadastrar alimento", "food")}</div>`;
}
function favoritesView() {
  return `<div class="card">${state.favorites.length ? state.favorites.map((f) => `<div class="list-item"><div class="row between"><div><h3>${esc(f.name)}</h3><p>${f.items.length} alimentos · ${fmt(total(f.items).kcal)} kcal</p></div>${btn("Usar refeição", "use-favorite", "primary mini", `data-id="${f.id}"`)}</div><div class="spaced">${btn("Excluir", "delete-favorite", "danger mini", `data-id="${f.id}"`)}</div></div>`).join("") : empty("Menos repetição, mais praticidade", "No diário ou no plano, salve uma refeição para reutilizar seus alimentos e quantidades.", "", "", "food")}</div>`;
}
let currentMeal = "",
  currentFood = null,
  entryEditId = null;
function entryEditor(mode, id, meal) {
  foodMode = mode;
  editId = id || null;
  entryEditId = id || null;
  currentMeal = meal || state.meals[0];
  currentFood = id
    ? structuredClone(
        (mode === "plan" ? currentPlans() : state.entries).find(
          (e) => e.id === id,
        ),
      )
    : null;
  showEntry();
}
function showEntry() {
  const e = currentFood;
  modal(
    foodMode === "plan" ? "Planejar alimento" : "Registrar alimento",
    `${select("Refeição", "meal", state.meals, e?.meal || currentMeal)}${state.foods.length ? `<div class="spaced">${select("Escolher alimento do catálogo", "food-pick", [["", "Selecione um alimento"], ...state.foods.map((f) => [f.id, `${f.name} · ${f.reference} ${f.unit}`])], e?.foodId || "")}</div>` : ""}<div class="spaced" id="food-reference">${e ? foodReference(e) : '<div class="note">Escolha um alimento do catálogo ou cadastre os valores do rótulo.</div>'}</div><div class="spaced">${btn("+ Cadastrar alimento", "entry-new-food", "ghost")}</div><div class="form-grid spaced">${decimal("Quantidade consumida / planejada", "quantity", e?.quantity || "", "required data-positive")}${select("Unidade (mesma referência)", "unit", e ? [e.unit] : ["g"], e?.unit || "g")}</div><div class="note spaced">Sem conversão automática entre g, ml e porções. A quantidade deve usar a mesma unidade da referência nutricional.</div>`,
    "entry",
    foodMode === "plan" ? "Salvar planejamento" : "Registrar",
  );
}
function foodReference(f) {
  return `<h3>${esc(f.name)}</h3><p class="form-help">Por ${fmt(f.reference, 1)} ${esc(f.unit)}: ${fmt(f.kcal)} kcal · P ${fmt(f.protein, 1)} g · C ${fmt(f.carbs, 1)} g · G ${fmt(f.fat, 1)} g</p><small>Origem: ${esc(f.source || "Cadastro manual")}</small>`;
}
let foodReturn = false;
function foodEditor(id, back = false, preset = {}) {
  foodReturn = back;
  editId = id || null;
  const f = id ? state.foods.find((f) => f.id === id) : preset;
  modal(
    id ? "Editar alimento" : "Cadastrar alimento",
    `<div class="form-grid">${input("Nome", "name", f.name || "", "text", 'required maxlength="120"')}${input("Marca (opcional)", "brand", f.brand || "")}${decimal("Quantidade de referência", "reference", f.reference || 100, "required data-positive")}${select("Unidade de referência", "unit", ["g", "ml", "porção"], f.unit || "g")}${nutrients.map((k, i) => decimal(["Calorias (kcal)", "Proteínas (g)", "Carboidratos (g)", "Gorduras (g)", "Fibras (g, opcional)", "Sódio (mg, opcional)"][i], k, f[k] ?? "", i < 4 ? "required" : "")).join("")}${input("Origem dos valores", "source", f.source || "Rótulo", "text", 'required placeholder="Ex.: rótulo da embalagem"')}</div><div class="note spaced">Informe os nutrientes para a quantidade de referência, não para o pacote inteiro. Alterações não mudam registros anteriores.</div>`,
    "food",
  );
}
let recipeItems = [];
function recipeEditor() {
  recipeItems = [];
  modal(
    "Criar receita",
    `<div class="form-grid">${input("Nome da receita", "name", "", "text", "required")}${input("Rendimento (nº de porções)", "yield", 1, "number", 'min="1" max="10000" required')}</div><p class="form-help spaced">Adicione ingredientes do seu catálogo com a unidade correspondente. A receita será salva por porção.</p><div id="recipe-items"></div><div class="row spaced">${btn("+ Ingrediente", "recipe-add", "ghost")}</div>`,
    "recipe",
    "Salvar receita",
  );
}
function recipeRows() {
  $("#recipe-items").innerHTML = recipeItems
    .map(
      (r, i) =>
        `<div class="recipe-row"><label>Ingrediente<select data-recipe-food="${i}">${state.foods.map((f) => `<option value="${f.id}" ${f.id === r.foodId ? "selected" : ""}>${esc(f.name)} (${esc(f.unit)})</option>`).join("")}</select></label><label>Quantidade<input inputmode="decimal" data-recipe-quantity="${i}" value="${esc(r.quantity)}"></label>${btn("×", "recipe-remove", "icon", `data-index="${i}" aria-label="Remover ingrediente"`)}</div>`,
    )
    .join("");
}

function evolutionView() {
  const cutoff = new Date(selectedDate + "T12:00:00");
  cutoff.setDate(cutoff.getDate() - num(period));
  const list = state.body
    .filter(
      (b) =>
        b.date <= selectedDate && (period === "all" || b.date >= day(cutoff)),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const metricNames = {
    weight: "Peso (kg)",
    waist: "Cintura (cm)",
    abdomen: "Abdômen (cm)",
    hip: "Quadril (cm)",
    chest: "Peito (cm)",
    arm: "Braço (cm)",
    leg: "Perna (cm)",
  };
  const points = list.filter(
    (b) => b[bodyMetric] !== "" && b[bodyMetric] !== undefined,
  );
  const change =
    points.length > 1
      ? num(points.at(-1)[bodyMetric]) - num(points[0][bodyMetric])
      : null;
  return `${header("Sua evolução", "Registros reais. Cada pessoa tem seu próprio ritmo.", btn("+ Registro", "add-body", "primary"))}<div class="grid cols"><div class="stack"><section class="card"><div class="card-head"><h2>Medidas ao longo do tempo</h2></div><div class="form-grid">${select("Medida", "body-metric", Object.entries(metricNames), bodyMetric)}${select(
    "Período até a data selecionada",
    "body-period",
    [
      ["30", "30 dias"],
      ["90", "90 dias"],
      ["365", "1 ano"],
      ["all", "Todo o histórico"],
    ],
    period,
  )}</div>${points.length ? `<div class="row between spaced"><div class="metric">${fmt(points.at(-1)[bodyMetric], 1)} <span>${bodyMetric === "weight" ? "kg" : "cm"}</span></div><small>${change === null ? "Primeiro registro" : `${change > 0 ? "+" : ""}${fmt(change, 1)} ${bodyMetric === "weight" ? "kg" : "cm"} no período`}</small></div>${lineChart(points.map((p) => ({ date: p.date, value: num(p[bodyMetric]) })))}` : empty("Seu ponto de partida", "Adicione peso ou medidas para acompanhar suas mudanças.", "add-body", "Adicionar registro", "chart")}</section><section class="card"><h2>Força em evolução</h2>${exerciseProgress()}</section></div><div class="card"><div class="card-head"><h2>Registros corporais</h2><span class="pill">${list.length}</span></div>${
    list.length
      ? list
          .slice()
          .reverse()
          .map(
            (b) =>
              `<div class="list-item"><div class="row between"><h3>${dateLabel(b.date)}</h3><div class="row">${btn(icon("edit", 16), "edit-body", "icon", `data-id="${b.id}" aria-label="Editar medidas"`)}${btn(icon("trash", 16), "delete-body", "icon danger", `data-id="${b.id}" aria-label="Excluir registro corporal e foto"`)}</div></div><div class="row wrap spaced">${Object.entries(
                metricNames,
              )
                .filter(([k]) => b[k] !== "" && b[k] !== undefined)
                .map(
                  ([k, n]) =>
                    `<span class="pill">${n.split(" (")[0]}: ${fmt(b[k], 1)} ${k === "weight" ? "kg" : "cm"}</span>`,
                )
                .join(
                  "",
                )}</div>${b.photo ? `<img class="photo spaced" src="${esc(b.photo)}" alt="Foto pessoal de evolução em ${dateLabel(b.date)}">${btn("Excluir foto", "delete-photo", "mini danger spaced", `data-id="${b.id}"`)}` : ""}</div>`,
          )
          .join("")
      : empty(
          "Tudo começa com um registro",
          "Peso, medidas e fotos são opcionais. Você escolhe o que acompanhar.",
          "",
          "",
          "weight",
        )
  }</div></div>`;
}
function lineChart(points) {
  if (!points.length) return "";
  const values = points.map((p) => p.value),
    min = Math.min(...values),
    max = Math.max(...values),
    range = max - min || 1;
  const coords = points.map((p, i) => [
    35 + (points.length === 1 ? 0.5 : i / (points.length - 1)) * 310,
    125 - ((p.value - min) / range) * 90,
  ]);
  return `<svg class="chart" viewBox="0 0 380 165" role="img" aria-label="Evolução de ${fmt(values[0], 1)} para ${fmt(values.at(-1), 1)}"><path d="M35 30H350M35 75H350M35 125H350" stroke="var(--line)" fill="none"/><polyline points="${coords.map((p) => p.join(",")).join(" ")}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>${coords.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"><title>${points[i].date}: ${fmt(points[i].value, 1)}</title></circle>`).join("")}<text x="35" y="151">${dateLabel(points[0].date)}</text><text x="350" y="151" text-anchor="end">${dateLabel(points.at(-1).date)}</text><text x="4" y="31">${fmt(max, 1)}</text><text x="4" y="126">${fmt(min, 1)}</text></svg>`;
}
let selectedExercise = "";
function exerciseProgress() {
  const names = [
    ...new Set(
      state.sessions.flatMap((s) =>
        s.exercises
          .filter((e) => e.sets.some((x) => x.done))
          .map((e) => e.name),
      ),
    ),
  ];
  if (!names.length)
    return empty(
      "Seus recordes vão aparecer aqui",
      "Conclua séries com carga e repetições para acompanhar sua força.",
      "",
      "",
      "trophy",
    );
  if (!names.includes(selectedExercise)) selectedExercise = names[0];
  const rows = state.sessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.startedAt - b.startedAt)
    .flatMap((s) =>
      s.exercises
        .filter((e) => e.name === selectedExercise)
        .map((e) => ({ date: s.date, sets: e.sets.filter((s) => s.done) })),
    )
    .filter((r) => r.sets.length);
  const sets = rows.flatMap((r) => r.sets);
  const record = Math.max(...sets.map((s) => num(s.kg))),
    reps = Math.max(
      ...sets.filter((s) => num(s.kg) === record).map((s) => num(s.reps)),
    );
  return `<div class="spaced">${select("Exercício", "exercise-progress", names, selectedExercise)}</div><div class="row between spaced"><small>Maior carga registrada</small><h3>${fmt(record, 1)} kg × ${fmt(reps)} reps ${icon("trophy", 16)}</h3></div>${lineChart(rows.map((r) => ({ date: r.date, value: Math.max(...r.sets.map((s) => num(s.kg))) })))}<div class="scroll"><table><thead><tr><th>Data</th><th>Séries (kg × reps)</th></tr></thead><tbody>${rows
    .slice()
    .reverse()
    .map(
      (r) =>
        `<tr><td>${dateLabel(r.date)}</td><td>${r.sets.map((s) => `${fmt(s.kg, 1)} × ${s.reps}`).join(" · ")}</td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function profileView() {
  const p = state.profile;
  return `${header("Seu perfil", "Suas metas, suas preferências, seu controle.")}<div class="grid cols"><form class="card" data-form="profile"><div class="card-head"><h2>Sobre você</h2>${icon("user")}</div><div class="form-grid">${input("Nome", "name", p.name, "text", 'maxlength="100"')}${select(
    "Objetivo pessoal",
    "goal",
    [
      ["", "Escolher depois"],
      ["massa", "Ganhar massa muscular"],
      ["gordura", "Reduzir gordura"],
      ["manter", "Manter peso"],
      ["condicionamento", "Melhorar condicionamento"],
    ],
    p.goal,
  )}${decimal("Altura (cm, opcional)", "height", p.height)}${decimal("Peso inicial (kg, opcional)", "initialWeight", p.initialWeight)}${weekdays(p.days)}${input("Alergias e restrições (anotação local)", "allergies", p.allergies || "", "text", 'maxlength="2000" placeholder="Informe suas restrições, se houver"')}</div><div class="section-label"><h2>Metas diárias</h2></div><p class="form-help">Informe suas próprias metas. O MiBody não calcula dietas nem prescreve exercícios pelo objetivo.</p><div class="form-grid spaced">${[
    ["kcal", "Calorias (kcal)"],
    ["protein", "Proteínas (g)"],
    ["carbs", "Carboidratos (g)"],
    ["fat", "Gorduras (g)"],
    ["water", "Água (ml)"],
  ]
    .map(([k, l]) => decimal(l, k, p[k]))
    .join(
      "",
    )}</div><div class="section-label"><h2>Do seu jeito</h2></div><div class="form-grid">${select(
    "Tema",
    "theme",
    [
      ["dark", "Escuro"],
      ["light", "Claro"],
    ],
    p.theme,
  )}${select(
    "Prioridade de equipamentos",
    "equipmentPreference",
    [
      ["machines", "Máquinas e polias primeiro"],
      ["any", "Sem preferência"],
    ],
    p.equipmentPreference || "machines",
  )}${input("Descanso padrão (segundos)", "rest", p.rest, "number", 'required min="0" max="3600"')}${input("Atalho de água (ml)", "waterQuick", p.waterQuick || 250, "number", 'min="1" max="10000" required')}<label class="check"><input type="checkbox" name="autoRest" ${p.autoRest ? "checked" : ""}>Iniciar descanso ao concluir série</label></div><div class="inline-error" role="alert"></div><div class="spaced"><button class="primary" type="submit">Salvar perfil</button></div></form><div class="stack"><section class="card"><div class="card-head"><h2>Seus dados</h2>${icon("shield")}</div><p class="form-help">Armazenados neste navegador usando IndexedDB. Não são sincronizados entre aparelhos e podem ser removidos ao limpar os dados do navegador. Não enviamos dados ou fotos a servidores externos.</p><div class="stack spaced">${btn(icon("download", 17) + " Backup completo (JSON)", "backup", "primary")}${btn("Restaurar backup", "restore", "ghost")}${btn("Exportar registros (CSV)", "csv", "ghost")}${btn("Solicitar armazenamento persistente", "storage", "ghost")}${btn("Excluir todos os dados", "reset", "danger")}</div><input type="file" id="restore-file" accept="application/json,.json" hidden></section><section class="card"><h2>MiBody no seu celular</h2><p class="form-help spaced">${installInstructions()}</p>${installEvent ? `<div class="spaced">${btn("Instalar MiBody", "install", "primary")}</div>` : ""}<p class="form-help spaced">Após o primeiro acesso completo em HTTPS, o aplicativo pode abrir offline. Seus dados são salvos automaticamente. Alertas de descanso funcionam com o app aberto; não há notificações com o app fechado.</p><p id="offline-status" class="form-help spaced"></p></section><section class="note">MiBody 1.0 · Sem rastreadores.<br>Os registros ajudam a acompanhar sua rotina e não substituem orientação profissional.</section></div></div>`;
}
function installInstructions() {
  if (portable)
    return "Você está usando a versão em arquivo único. A instalação como PWA exige a versão hospedada em HTTPS. Faça backup antes de mover o arquivo ou trocar de navegador; os dados não acompanham o HTML automaticamente.";
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone)
    return "O MiBody já está aberto como aplicativo instalado.";
  if (/iPhone|iPad|iPod/.test(navigator.userAgent))
    return "No Safari, toque em Compartilhar e em “Adicionar à Tela de Início”. Abra o ícone criado para usar como aplicativo.";
  return "Em um navegador compatível, use “Instalar aplicativo” no menu. O botão de instalação aparece aqui quando o navegador disponibilizar essa opção. A instalação exige HTTPS (ou localhost durante desenvolvimento).";
}
let bodyPhoto = "";
function bodyEditor(id) {
  editId = id || null;
  const b = id ? state.body.find((b) => b.id === id) : {};
  bodyPhoto = b.photo || "";
  modal(
    id ? "Editar registro corporal" : "Peso, medidas e foto",
    `<div class="form-grid">${input("Data", "date", b.date || selectedDate, "date", "required")}${decimal("Peso (kg)", "weight", b.weight ?? "")}${[
      ["waist", "Cintura"],
      ["abdomen", "Abdômen"],
      ["hip", "Quadril"],
      ["chest", "Peito"],
      ["arm", "Braço"],
      ["leg", "Perna"],
    ]
      .map(([k, l]) => decimal(l + " (cm)", k, b[k] ?? ""))
      .join(
        "",
      )}<label class="full">Foto opcional (JPEG, PNG ou WebP, até 8 MB)<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label><p class="form-help full">A foto fica somente neste dispositivo e no backup que você exportar. Não fazemos análise de composição corporal.</p>${bodyPhoto ? '<label class="check full"><input type="checkbox" name="removePhoto">Remover foto existente</label>' : ""}</div>`,
    "body",
  );
}
function waterEditor() {
  modal(
    "Sua hidratação",
    `${decimal("Quantidade (ml)", "ml", state.profile.waterQuick || 250, "required data-positive")}<div class="row wrap spaced">${[150, 250, 500].map((n) => btn(n + " ml", "water-preset", "mini", `data-ml="${n}"`)).join("")}</div><div class="section-label"><h3>Registros de ${dateLabel(selectedDate)}</h3></div>${
      state.water
        .filter((w) => w.date === selectedDate)
        .map(
          (w) =>
            `<div class="list-item row between"><span>${fmt(w.ml)} ml</span>${btn("Desfazer", "undo-water", "mini danger", `data-id="${w.id}"`)}</div>`,
        )
        .join("") || '<p class="form-help">Nenhum registro nesta data.</p>'
    }`,
    "water",
    "Adicionar água",
  );
}

async function confirmAction(title, text, execute, label = "Confirmar") {
  modal(
    title,
    `<p class="form-help">${esc(text)}</p><footer>${btn("Cancelar", "close", "ghost")}${btn(label, "confirm", "primary")}</footer>`,
  );
  confirmation = execute;
}
let confirmation = null;
function download(name, content, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function backup() {
  download(
    `mibody-backup-${day()}.json`,
    JSON.stringify(state, null, 2),
    "application/json",
  );
  toast("Backup exportado. Guarde-o em um lugar seguro.");
}
function exportCSV() {
  const rows = [];
  state.entries.forEach((e) => {
    const t = total([e]);
    rows.push({
      tipo: "alimento",
      data: e.date,
      nome: e.name,
      refeicao: e.meal,
      quantidade: e.quantity,
      unidade: e.unit,
      ...t,
    });
  });
  state.sessions.forEach((s) =>
    s.exercises.forEach((e) =>
      e.sets.forEach((set, i) =>
        rows.push({
          tipo: "serie",
          data: s.date,
          nome: e.name,
          ficha: s.name,
          serie: i + 1,
          kg: set.kg,
          repeticoes: set.reps,
          concluida: set.done ? "sim" : "não",
          duracao_segundos: Math.round(elapsed(s) / 1000),
        }),
      ),
    ),
  );
  state.water.forEach((w) =>
    rows.push({ tipo: "agua", data: w.date, quantidade: w.ml, unidade: "ml" }),
  );
  state.body.forEach((b) =>
    rows.push({
      tipo: "corporal",
      data: b.date,
      ...Object.fromEntries(
        ["weight", "waist", "abdomen", "hip", "chest", "arm", "leg"].map(
          (k) => [k, b[k]],
        ),
      ),
    }),
  );
  download(
    `mibody-registros-${day()}.csv`,
    csv(rows, [
      "tipo",
      "data",
      "nome",
      "refeicao",
      "quantidade",
      "unidade",
      "kcal",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "sodium",
      "ficha",
      "serie",
      "kg",
      "repeticoes",
      "concluida",
      "duracao_segundos",
      "weight",
      "waist",
      "abdomen",
      "hip",
      "chest",
      "arm",
      "leg",
    ]),
    "text/csv;charset=utf-8",
  );
  toast("Registros exportados em CSV.");
}

const actions = {
  "menu-date": (b) => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + num(b.dataset.offset));
    selectedDate = day(date);
    planScope = "day";
    render();
  },
  "plan-scope": (b) => {
    planScope = b.dataset.scope;
    render();
  },
  "menu-options": (b) => {
    optionMeal = b.dataset.meal || "";
    optionGroup = /café|lanche|ceia/i.test(optionMeal)
      ? "shake"
      : optionMeal
        ? "main"
        : "all";
    foodTab = "opcoes";
    render();
  },
  "option-group": (b) => {
    optionGroup = b.dataset.group;
    optionMeal = "";
    render();
  },
  "meal-option": (b) => {
    optionReturn = null;
    optionDraft = null;
    mealOptionPreview(b.dataset.id);
  },
  "option-label": (b) => {
    optionDraft = Object.fromEntries(
      new FormData($('form[data-form="choose-meal-option"]')),
    );
    optionReturn = b.dataset.option;
    optionLabelKey = b.dataset.key;
    const label = LABEL_INGREDIENTS[b.dataset.key];
    foodEditor(null, false, {
      name: label.name,
      reference: label.reference,
      unit: label.unit,
    });
  },
  "customize-plan-day": async () => {
    ensurePlanDay(state, selectedDate);
    await persist();
    render();
  },
  "reset-plan-day": () =>
    confirmAction(
      "Voltar ao plano padrão?",
      "O cardápio próprio desta data será removido. O consumo registrado será preservado.",
      async () => {
        state.planDays = (state.planDays || []).filter(
          (p) => p.date !== selectedDate,
        );
        await persist();
        close();
        render();
      },
    ),
  "copy-plan-day": () =>
    modal(
      "Copiar cardápio",
      `${input("Data de destino", "date", "", "date", "required")}<p class="form-help spaced">Copia todas as refeições de ${dateLabel(selectedDate)} e substitui o cardápio da data de destino. O consumo registrado e o plano padrão são preservados.</p>`,
      "copy-plan-day",
      "Copiar e substituir",
    ),
  "budget-preview": budgetPreview,
  "budget-close": close,
  "machine-pack": packPreview,
  "pack-close": () => {
    close();
    page = "workout";
    tab = "fichas";
    render();
  },
  "session-to-templates": () => {
    tab = "fichas";
    render();
  },
  "add-machine-library": async () => {
    const count = addMachineLibrary(state);
    await persist();
    render();
    toast(
      count
        ? `${count} exercícios adicionados à biblioteca.`
        : "A biblioteca de máquinas já está disponível.",
    );
  },
  "choose-exercise": (b) => {
    const selected = exerciseChoices(state.library).find(
      (e) => e.id === b.dataset.id,
    );
    if (!selected) throw Error("Exercício não encontrado.");
    const e = structuredClone(selected);
    if (chooserContext === "replace") {
      const old = state.active.exercises[chooserIndex];
      e.sets = Math.max(1, old.sets.filter((s) => !s.done).length);
      e.reps = old.referenceReps || e.reps;
      e.rest = old.rest;
      e.kg = "";
    }
    exerciseEditor(chooserContext, e, chooserIndex);
  },
  "chooser-custom": () => exerciseEditor(chooserContext, {}, chooserIndex),
  close,
  nav: (b) => {
    page = b.dataset.page;
    render();
    window.scrollTo(0, 0);
  },
  theme: async () => {
    state.profile.theme = state.profile.theme === "dark" ? "light" : "dark";
    await persist();
    render();
  },
  "go-workouts": () => {
    page = "workout";
    tab = "fichas";
    render();
  },
  "workout-tab": (b) => {
    tab = b.dataset.tab;
    render();
  },
  "new-template": () => templateEditor(),
  "edit-template": (b) => templateEditor(b.dataset.id),
  "draft-new": () => {
    syncDraft();
    exerciseEditor("draft");
  },
  "draft-edit": (b) => {
    syncDraft();
    exerciseEditor(
      "draft",
      draft.exercises[+b.dataset.index],
      +b.dataset.index,
    );
  },
  "draft-up": (b) => {
    syncDraft();
    const i = +b.dataset.index;
    if (i > 0)
      [draft.exercises[i - 1], draft.exercises[i]] = [
        draft.exercises[i],
        draft.exercises[i - 1],
      ];
    showTemplate();
  },
  "draft-remove": (b) => {
    syncDraft();
    draft.exercises.splice(+b.dataset.index, 1);
    showTemplate();
  },
  "draft-library": () => {
    syncDraft();
    showExerciseChooser("draft");
  },
  "back-template": showTemplate,
  "duplicate-template": async (b) => {
    const t = structuredClone(
      state.templates.find((t) => t.id === b.dataset.id),
    );
    t.id = uid();
    delete t.seedKey;
    t.name += " (cópia)";
    state.templates.push(t);
    await persist();
    render();
    toast("Ficha duplicada.");
  },
  "archive-template": async (b) => {
    const t = state.templates.find((t) => t.id === b.dataset.id);
    t.archived = !t.archived;
    await persist();
    render();
  },
  "move-template": async (b) => {
    const i = state.templates.findIndex((t) => t.id === b.dataset.id);
    if (i > 0)
      [state.templates[i - 1], state.templates[i]] = [
        state.templates[i],
        state.templates[i - 1],
      ];
    await persist();
    render();
  },
  "delete-template": (b) =>
    confirmAction(
      "Excluir ficha?",
      "As sessões já realizadas serão preservadas.",
      async () => {
        state.templates = state.templates.filter((t) => t.id !== b.dataset.id);
        await persist();
        close();
        render();
      },
    ),
  "new-library": () => {
    editId = null;
    exerciseEditor("library");
  },
  "edit-library": (b) => {
    editId = b.dataset.id;
    exerciseEditor(
      "library-edit",
      state.library.find((e) => e.id === editId),
    );
  },
  "delete-library": (b) =>
    confirmAction(
      "Excluir exercício da biblioteca?",
      "Exercícios nas fichas e no histórico serão preservados.",
      async () => {
        state.library = state.library.filter((e) => e.id !== b.dataset.id);
        await persist();
        close();
        render();
      },
    ),
  start: async (b) => {
    if (state.active) {
      page = "workout";
      tab = "sessao";
      render();
      toast("Continue ou descarte o treino em andamento.");
      return;
    }
    const t = state.templates.find((t) => t.id === b.dataset.id);
    if (!t.exercises.length)
      return toast("Adicione exercícios à ficha antes de iniciar.");
    state.active = startSession(t, selectedDate);
    await persist();
    page = "workout";
    tab = "sessao";
    render();
    window.scrollTo(0, 0);
  },
  continue: () => {
    page = "workout";
    tab = "sessao";
    render();
  },
  "toggle-set": async (b) => {
    const s = state.active;
    if (s.pausedAt)
      return toast("Continue o treino antes de registrar a série.");
    const e = s.exercises[+b.dataset.exercise],
      set = e.sets[+b.dataset.set];
    if (
      !set.done &&
      (set.kg === "" ||
        set.reps === "" ||
        !validNumber(set.kg) ||
        !validNumber(set.reps) ||
        num(set.reps) <= 0 ||
        !Number.isInteger(num(set.reps)))
    )
      return toast(
        "Informe carga válida (0 ou mais) e repetições inteiras maiores que zero.",
      );
    set.done = !set.done;
    if (set.done) {
      set.kg = num(set.kg);
      set.reps = num(set.reps);
      if (state.profile.autoRest && num(e.rest) > 0) {
        s.restUntil = Date.now() + num(e.rest) * 1000;
        lastRest = null;
      }
    }
    await persist();
    render();
  },
  "add-set": async (b) => {
    state.active.exercises[+b.dataset.index].sets.push({
      id: uid(),
      kg: "",
      reps: "",
      done: false,
    });
    await persist();
    render();
  },
  "remove-set": (b) => {
    const e = state.active.exercises[+b.dataset.index];
    if (!e.sets.length) return;
    confirmAction(
      "Remover última série?",
      "Os valores dessa série serão removidos do treino em andamento.",
      async () => {
        e.sets.pop();
        await persist();
        close();
        render();
      },
    );
  },
  pause: async () => {
    state.active.pausedAt = Date.now();
    await persist();
    render();
  },
  resume: async () => {
    state.active.pausedMs += Date.now() - state.active.pausedAt;
    state.active.pausedAt = null;
    await persist();
    render();
  },
  rest: () =>
    modal(
      "Cronômetro de descanso",
      `${input("Tempo de descanso (segundos)", "seconds", state.profile.rest, "number", 'min="1" max="3600" required')}<p class="form-help spaced">O relógio usa o horário real e se recupera ao voltar do segundo plano. Som e vibração dependem do navegador e funcionam com o app aberto.</p>`,
      "rest",
      "Iniciar descanso",
    ),
  "stop-rest": async () => {
    state.active.restUntil = null;
    await persist();
    render();
  },
  "session-notes": () =>
    modal(
      "Anotação da sessão",
      `<label>Como foi o treino?<textarea name="notes" rows="4">${esc(state.active.notes)}</textarea></label>`,
      "session-notes",
    ),
  "session-exercise-notes": (b) => {
    exerciseIndex = +b.dataset.index;
    modal(
      "Observações do exercício",
      `<label>Observações<textarea name="notes" rows="4">${esc(state.active.exercises[exerciseIndex].notes)}</textarea></label>`,
      "exercise-notes",
    );
  },
  "replace-exercise": (b) => {
    const index = +b.dataset.index,
      e = state.active.exercises[index];
    if (e.sets.length && e.sets.every((s) => s.done))
      return toast(
        "Este exercício já foi concluído. Use + Exercício para acrescentar outro.",
      );
    showExerciseChooser("replace", index);
  },
  "session-add": () => showExerciseChooser("session"),
  finish: () => {
    if (!progress(state.active).done)
      return toast("Conclua pelo menos uma série antes de finalizar.");
    confirmAction(
      "Finalizar treino?",
      `${progress(state.active).done} de ${progress(state.active).all} séries concluídas. Séries não concluídas ficam identificadas no histórico.`,
      async () => {
        const s = state.active,
          now = Date.now();
        if (s.pausedAt) {
          s.pausedMs += now - s.pausedAt;
          s.pausedAt = null;
        }
        s.endedAt = now;
        s.restUntil = null;
        state.sessions.push(structuredClone(s));
        state.active = null;
        await persist();
        tab = "historico";
        render();
        sessionDetail(s.id);
        toast("Treino concluído. Boa!");
      },
      "Finalizar",
    );
  },
  discard: () =>
    confirmAction(
      "Descartar treino?",
      "A sessão em andamento será removida e não aparecerá no histórico.",
      async () => {
        state.active = null;
        await persist();
        close();
        tab = "fichas";
        render();
      },
    ),
  "session-detail": (b) => sessionDetail(b.dataset.id),
  "delete-session": (b) =>
    confirmAction(
      "Excluir sessão?",
      "Essa sessão será removida do histórico e dos indicadores.",
      async () => {
        state.sessions = state.sessions.filter((s) => s.id !== b.dataset.id);
        await persist();
        close();
        render();
      },
    ),
  "calendar-date": (b) => {
    selectedDate = b.dataset.date;
    render();
  },
  "month-prev": () => changeMonth(-1),
  "month-next": () => changeMonth(1),
  "food-tab": (b) => {
    foodTab = b.dataset.tab;
    render();
  },
  "add-entry": (b) => entryEditor("entry", null, b?.dataset.meal),
  "edit-entry": (b) => entryEditor("entry", b.dataset.id),
  "add-plan": (b) => entryEditor("plan", null, b?.dataset.meal),
  "edit-plan": (b) => entryEditor("plan", b.dataset.id),
  "delete-entry": (b) =>
    confirmAction(
      "Remover alimento?",
      "Esse consumo será removido do diário.",
      async () => {
        state.entries = state.entries.filter((e) => e.id !== b.dataset.id);
        await persist();
        close();
        render();
      },
    ),
  "delete-plan": (b) =>
    confirmAction(
      "Remover planejamento?",
      "Os alimentos já consumidos serão preservados.",
      async () => {
        const list = currentPlans();
        const index = list.findIndex((e) => e.id === b.dataset.id);
        if (index >= 0) list.splice(index, 1);
        await persist();
        close();
        render();
      },
    ),
  "new-food": () => {
    optionReturn = null;
    foodEditor();
  },
  "edit-food": (b) => foodEditor(b.dataset.id),
  "entry-new-food": () => {
    const f = $('form[data-form="entry"]');
    currentMeal = f.elements.meal.value;
    foodEditor(null, true);
  },
  "delete-food": (b) =>
    confirmAction(
      "Excluir alimento do catálogo?",
      "Diário, receitas e planejamento mantêm os valores já salvos.",
      async () => {
        state.foods = state.foods.filter((f) => f.id !== b.dataset.id);
        await persist();
        close();
        render();
      },
    ),
  "consume-plan": (b) => {
    const p = currentPlans().find((p) => p.id === b.dataset.id);
    foodMode = "entry";
    editId = null;
    entryEditId = null;
    currentMeal = p.meal;
    currentFood = structuredClone(p);
    showEntry();
  },
  "copy-meal": (b) => {
    currentMeal = b.dataset.meal;
    modal(
      "Copiar refeição",
      `${input("Data de destino", "date", day(), "date", "required")}${select("Refeição de destino", "meal", state.meals, currentMeal)}<p class="form-help spaced">Os alimentos e suas quantidades serão copiados. Registros existentes não serão removidos.</p>`,
      "copy-meal",
      "Copiar",
    );
  },
  "favorite-meal": (b) => saveFavorite(b.dataset.meal, false),
  "favorite-plan": (b) => saveFavorite(b.dataset.meal, true),
  "use-favorite": (b) => {
    editId = b.dataset.id;
    modal(
      "Usar refeição frequente",
      `${select("Refeição", "meal", state.meals)}${select("Destino", "target", [
        ["entry", "Diário da data selecionada"],
        ["plan", "Plano alimentar"],
      ])}`,
      "use-favorite",
      "Adicionar",
    );
  },
  "delete-favorite": (b) =>
    confirmAction(
      "Excluir refeição frequente?",
      "Os registros do diário serão preservados.",
      async () => {
        state.favorites = state.favorites.filter((f) => f.id !== b.dataset.id);
        await persist();
        close();
        render();
      },
    ),
  "edit-meals": () =>
    modal(
      "Organizar refeições",
      `<label>Um nome de refeição por linha<textarea name="meals" rows="8" required>${esc(state.meals.join("\n"))}</textarea></label><p class="form-help spaced">Para preservar os registros, refeições que possuem dados não podem ser removidas. Para renomear, use os campos abaixo.</p>${state.meals.map((m, i) => input(m, "rename-" + i, m, "text", 'required maxlength="80"')).join("")}`,
      "meals",
    ),
  "new-recipe": recipeEditor,
  "recipe-add": () => {
    if (!state.foods.length)
      return toast("Cadastre os ingredientes no catálogo primeiro.");
    recipeItems.push({ foodId: state.foods[0].id, quantity: 100 });
    recipeRows();
  },
  "recipe-remove": (b) => {
    recipeItems.splice(+b.dataset.index, 1);
    recipeRows();
  },
  "add-water": waterEditor,
  "water-preset": (b) => {
    $('form[data-form="water"]').elements.ml.value = b.dataset.ml;
  },
  "quick-water": async () => {
    state.water.push({
      id: uid(),
      date: selectedDate,
      ml: num(state.profile.waterQuick || 250),
    });
    await persist();
    render();
    toast("Água registrada. Use “Água” para desfazer.");
  },
  "undo-water": async (b) => {
    state.water = state.water.filter((w) => w.id !== b.dataset.id);
    await persist();
    render();
    waterEditor();
  },
  "add-body": () => bodyEditor(),
  "edit-body": (b) => bodyEditor(b.dataset.id),
  "delete-body": (b) =>
    confirmAction(
      "Excluir registro corporal?",
      "Peso, medidas e a foto deste registro serão removidos.",
      async () => {
        state.body = state.body.filter((x) => x.id !== b.dataset.id);
        await persist();
        close();
        render();
      },
    ),
  "delete-photo": (b) =>
    confirmAction(
      "Excluir foto?",
      "As medidas deste registro serão preservadas.",
      async () => {
        state.body.find((x) => x.id === b.dataset.id).photo = "";
        await persist();
        close();
        render();
      },
    ),
  backup,
  csv: exportCSV,
  restore: () => $("#restore-file").click(),
  storage: async () => {
    if (!navigator.storage?.persist)
      return toast("Armazenamento persistente não disponível neste navegador.");
    toast(
      (await navigator.storage.persist())
        ? "Armazenamento persistente concedido. Continue fazendo backups."
        : "O navegador não concedeu persistência. Faça backups regularmente.",
    );
  },
  reset: () =>
    modal(
      "Excluir todos os dados",
      `${input("Digite EXCLUIR para confirmar", "confirmation", "", "text", 'required pattern="EXCLUIR" autocomplete="off"')}<p class="form-help spaced">Esta ação remove todos os dados do MiBody neste dispositivo. Exporte um backup antes.</p>`,
      "reset",
      "Excluir permanentemente",
    ),
  install: async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    render();
  },
  "onboard-skip": async () => {
    state.onboarded = true;
    await persist();
    close();
  },
  "onboard-profile": async () => {
    state.onboarded = true;
    await persist();
    close();
    page = "user";
    render();
  },
  confirm: async () => {
    const f = confirmation;
    confirmation = null;
    if (f) await f();
  },
};
function changeMonth(delta) {
  const d = new Date(selectedDate + "T12:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  selectedDate = day(d);
  render();
}
function saveFavorite(meal, planned) {
  currentMeal = meal;
  foodMode = planned ? "plan" : "entry";
  modal(
    "Salvar refeição frequente",
    input("Nome", "name", meal, "text", 'required maxlength="100"'),
    "favorite",
  );
}
function validNumber(v) {
  return (
    /^\d+(?:[.,]\d+)?$/.test(String(v).trim()) &&
    Number.isFinite(num(v)) &&
    num(v) >= 0
  );
}
function readForm(f) {
  const out = Object.fromEntries(new FormData(f));
  for (const el of f.querySelectorAll("[data-number]")) {
    if (
      el.value !== "" &&
      (!validNumber(el.value) ||
        (el.hasAttribute("data-positive") && num(el.value) <= 0))
    )
      throw Error(
        `Confira o campo “${el.closest("label").childNodes[0].textContent.trim()}”. Use um número ${el.hasAttribute("data-positive") ? "maior que zero" : "positivo ou zero"}, com vírgula ou ponto.`,
      );
    out[el.name] = el.value === "" ? "" : num(el.value);
  }
  return out;
}
function getExercise(d) {
  if (d.video && !/^https?:\/\//.test(d.video))
    throw Error("O vídeo deve usar um link http ou https.");
  const metadata = { ...exerciseSource };
  if (
    d.name !== metadata.name ||
    d.equipment !== metadata.equipment ||
    d.group !== metadata.group
  ) {
    delete metadata.catalogKey;
    delete metadata.type;
    delete metadata.movement;
  }
  return {
    ...metadata,
    ...d,
    id: uid(),
    sets: num(d.sets),
    rest: num(d.rest),
    kg: d.kg,
  };
}
const forms = {
  "choose-meal-option": async (d) => {
    const labels = Object.fromEntries(
      Object.keys(LABEL_INGREDIENTS).map((k) => [k, d["label-" + k]]),
    );
    const option = MEAL_OPTIONS.find((o) => o.id === d.optionId);
    if (!option) throw Error("Opção não encontrada.");
    const portions = Object.fromEntries(
      option.items.map(([k]) => [k, d["portion-" + k]]),
    );
    chooseMealOption(state, d.date, d.meal, d.optionId, labels, portions);
    selectedDate = d.date;
    planScope = "day";
    foodTab = "plano";
    await persist();
    close();
    render();
    toast("Refeição escolhida para esta data. Nenhum consumo registrado.");
  },
  "copy-plan-day": async (d) => {
    copyDayPlan(state, selectedDate, d.date);
    selectedDate = d.date;
    planScope = "day";
    await persist();
    close();
    render();
    toast("Cardápio copiado para a data escolhida.");
  },
  "budget-plan": async (d, f) => {
    const map = Object.fromEntries(
      BUDGET_MEALS.map((m) => [m.key, d["budget-" + m.key]]),
    );
    planScope = "default";
    const added = addBudgetPlan(state, map, {
      useGoals: f.elements.useBudgetGoals.checked,
    });
    await persist();
    close();
    page = "food";
    foodTab = "plano";
    render();
    toast(
      `${added} itens adicionados ao plano. Consumo diário permanece separado.`,
    );
  },
  "machine-pack": async (d) => {
    const assignments = Object.fromEntries(
      PPL_MACHINES.map((t) => [t.key, d["day-" + t.key] ?? ""]),
    );
    const count = addMachinePack(state, assignments);
    await persist();
    close();
    page = "workout";
    tab = "fichas";
    render();
    toast(
      `${count} fichas adicionadas. Ajuste os dias e as referências como preferir.`,
    );
  },
  template: async (d, f) => {
    syncDraft();
    if (!draft.name.trim()) throw Error("Dê um nome à ficha.");
    if (!draft.exercises.length)
      throw Error("Adicione pelo menos um exercício.");
    const i = state.templates.findIndex((t) => t.id === draft.id);
    if (i >= 0) state.templates[i] = draft;
    else state.templates.push(draft);
    await persist();
    close();
    page = "workout";
    tab = "fichas";
    render();
    toast("Ficha salva.");
  },
  exercise: async (d) => {
    const e = getExercise(d);
    if (exerciseContext === "draft") {
      if (exerciseIndex >= 0) draft.exercises[exerciseIndex] = e;
      else draft.exercises.push(e);
      showTemplate();
      return;
    }
    if (exerciseContext.startsWith("library")) {
      if (exerciseContext === "library-edit") {
        e.id = editId;
        state.library[state.library.findIndex((x) => x.id === editId)] = e;
      } else state.library.push(e);
    } else {
      if (exerciseContext === "replace")
        substituteExercise(state.active, exerciseIndex, e);
      else
        state.active.exercises.push(
          startSession({ id: "", name: "", exercises: [e] }, selectedDate)
            .exercises[0],
        );
    }
    await persist();
    close();
    render();
  },
  rest: async (d) => {
    state.active.restUntil = Date.now() + num(d.seconds) * 1000;
    lastRest = null;
    await persist();
    close();
    render();
  },
  "session-notes": async (d) => {
    state.active.notes = d.notes;
    await persist();
    close();
  },
  "exercise-notes": async (d) => {
    state.active.exercises[exerciseIndex].notes = d.notes;
    await persist();
    close();
    render();
  },
  food: async (d) => {
    const id = editId || uid(),
      f = { ...d, id };
    nutrients.forEach((k) => (f[k] = num(f[k])));
    const i = state.foods.findIndex((x) => x.id === id);
    if (i >= 0) state.foods[i] = f;
    else state.foods.push(f);
    await persist();
    if (foodReturn) {
      currentFood = {
        ...structuredClone(f),
        foodId: f.id,
        quantity: f.reference,
        meal: currentMeal,
      };
      editId = null;
      showEntry();
    } else if (optionReturn) {
      const option = optionReturn;
      optionReturn = null;
      if (optionLabelKey && optionDraft)
        optionDraft["label-" + optionLabelKey] = f.id;
      optionLabelKey = null;
      mealOptionPreview(option);
    } else {
      close();
      render();
    }
    toast("Alimento salvo.");
  },
  entry: async (d) => {
    if (!currentFood) throw Error("Escolha ou cadastre um alimento.");
    const list = foodMode === "plan" ? currentPlans() : state.entries;
    const id = entryEditId || uid();
    const e = {
      ...structuredClone(currentFood),
      id,
      foodId: currentFood.foodId || currentFood.id,
      quantity: d.quantity,
      meal: d.meal,
    };
    if (foodMode === "entry") e.date = selectedDate;
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list[i] = e;
    else list.push(e);
    await persist();
    close();
    render();
    toast(
      foodMode === "plan"
        ? "Planejamento salvo. Nenhum consumo adicionado."
        : "Consumo registrado.",
    );
  },
  "copy-meal": async (d) => {
    if (d.date === selectedDate && d.meal === currentMeal)
      throw Error("Escolha outra data ou outra refeição.");
    const rows = state.entries.filter(
      (e) => e.date === selectedDate && e.meal === currentMeal,
    );
    const key = `copy:${selectedDate}:${currentMeal}:${d.date}:${d.meal}`;
    if (state.entries.some((e) => e.copyKey === key))
      throw Error("Esta refeição já foi copiada para esse destino.");
    state.entries.push(
      ...rows.map((e) => ({
        ...structuredClone(e),
        id: uid(),
        date: d.date,
        meal: d.meal,
        copyKey: key,
      })),
    );
    await persist();
    close();
    render();
    toast("Refeição copiada.");
  },
  favorite: async (d) => {
    const rows = (
      foodMode === "plan"
        ? currentPlans()
        : state.entries.filter((e) => e.date === selectedDate)
    ).filter((e) => e.meal === currentMeal);
    state.favorites.push({
      id: uid(),
      name: d.name,
      items: structuredClone(rows),
    });
    await persist();
    close();
    toast("Refeição salva como frequente.");
  },
  "use-favorite": async (d) => {
    const f = state.favorites.find((f) => f.id === editId);
    const list = d.target === "plan" ? currentPlans() : state.entries;
    list.push(
      ...f.items.map((e) => ({
        ...structuredClone(e),
        id: uid(),
        meal: d.meal,
        ...(d.target === "entry" ? { date: selectedDate } : {}),
      })),
    );
    await persist();
    close();
    render();
    toast("Refeição adicionada.");
  },
  meals: async (d) => {
    const old = state.meals,
      renamed = old.map((m, i) => d["rename-" + i].trim());
    if (renamed.some((m) => !m) || new Set(renamed).size !== renamed.length)
      throw Error("Use nomes de refeições diferentes e não vazios.");
    const wanted = d.meals
      .split("\n")
      .map((m) => m.trim())
      .filter(Boolean);
    const changedList = d.meals.trim() !== old.join("\n");
    let next = changedList ? wanted : renamed;
    if (!next.length || new Set(next).size !== next.length)
      throw Error("Mantenha pelo menos uma refeição com nome único.");
    const map = new Map(old.map((m, i) => [m, renamed[i]]));
    const used = [
      ...state.entries,
      ...state.plans,
      ...(state.planDays || []).flatMap((p) => p.items),
      ...state.favorites.flatMap((f) => f.items),
    ];
    if (changedList && used.some((e) => !wanted.includes(e.meal)))
      throw Error(
        "Não remova refeições com registros. Use os campos de renomear abaixo.",
      );
    if (!changedList)
      used.forEach((e) => {
        e.meal = map.get(e.meal) || e.meal;
      });
    state.meals = next;
    await persist();
    close();
    render();
  },
  recipe: async (d) => {
    if (!recipeItems.length) throw Error("Adicione pelo menos um ingrediente.");
    const ingredients = recipeItems.map((r) => {
      if (!validNumber(r.quantity) || num(r.quantity) <= 0)
        throw Error("Confira as quantidades dos ingredientes.");
      const f = state.foods.find((f) => f.id === r.foodId);
      if (!f) throw Error("Ingrediente não encontrado.");
      return { ...structuredClone(f), quantity: num(r.quantity) };
    });
    const t = total(ingredients),
      yieldCount = num(d.yield);
    if (!yieldCount) throw Error("Defina o número de porções.");
    state.foods.push({
      id: uid(),
      name: d.name,
      brand: "",
      unit: "porção",
      reference: 1,
      ...Object.fromEntries(nutrients.map((k) => [k, t[k] / yieldCount])),
      source: `Receita caseira · ${yieldCount} porções`,
      ingredients,
      yield: yieldCount,
    });
    await persist();
    close();
    render();
    toast("Receita salva no catálogo, por porção.");
  },
  water: async (d) => {
    if (d.ml > 10000) throw Error("Registre até 10.000 ml por vez.");
    state.water.push({ id: uid(), date: selectedDate, ml: d.ml });
    await persist();
    close();
    render();
    toast("Água registrada.");
  },
  body: async (d, f) => {
    const file = f.elements.photo.files[0];
    let photo = d.removePhoto ? "" : bodyPhoto;
    if (file) {
      if (
        file.size > 8 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw Error("Escolha uma imagem JPEG, PNG ou WebP de até 8 MB.");
      photo = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(Error("Não foi possível ler a imagem."));
        r.readAsDataURL(file);
      });
    }
    const b = {
      id: editId || uid(),
      date: d.date,
      photo,
      ...Object.fromEntries(
        ["weight", "waist", "abdomen", "hip", "chest", "arm", "leg"].map(
          (k) => [k, d[k]],
        ),
      ),
    };
    if (
      !photo &&
      ["weight", "waist", "abdomen", "hip", "chest", "arm", "leg"].every(
        (k) => b[k] === "",
      )
    )
      throw Error("Informe pelo menos uma medida ou foto.");
    const idx = state.body.findIndex((b) => b.id === editId);
    if (idx >= 0) state.body[idx] = b;
    else state.body.push(b);
    await persist();
    close();
    render();
    toast("Registro corporal salvo.");
  },
  profile: async (d, f) => {
    state.profile = {
      ...d,
      days: [...f.querySelectorAll("[name=days]:checked")].map((x) =>
        num(x.value),
      ),
      autoRest: f.elements.autoRest.checked,
      rest: num(d.rest),
      waterQuick: num(d.waterQuick),
    };
    state.onboarded = true;
    await persist();
    render();
    toast("Perfil e metas salvos.");
  },
  reset: async (d) => {
    if (d.confirmation !== "EXCLUIR")
      throw Error("Digite EXCLUIR para confirmar.");
    state = initial();
    state.onboarded = true;
    await persist();
    close();
    render();
    toast("Dados removidos deste dispositivo.");
  },
};

document.addEventListener("click", async (event) => {
  const b = event.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const fn = actions[b.dataset.action];
  if (!fn) return;
  b.disabled = true;
  try {
    await fn(b);
  } catch (e) {
    toast("Não foi possível concluir: " + e.message);
    console.error(e);
  } finally {
    if (b.isConnected) b.disabled = false;
  }
});
document.addEventListener("submit", async (event) => {
  const f = event.target.closest("form[data-form]");
  if (!f) return;
  event.preventDefault();
  if (f.dataset.busy) return;
  f.dataset.busy = "true";
  const b = f.querySelector("[type=submit]");
  if (b) b.disabled = true;
  try {
    const d = readForm(f);
    await forms[f.dataset.form](d, f);
  } catch (e) {
    const el = f.querySelector(".inline-error");
    if (el) el.textContent = e.message;
    else toast(e.message);
  } finally {
    delete f.dataset.busy;
    if (b?.isConnected) b.disabled = false;
  }
});
document.addEventListener("input", (event) => {
  const el = event.target;
  if (el.closest('form[data-form="choose-meal-option"]')) updateOptionTotals();
  if (el.dataset.setInput) {
    const s =
      state.active.exercises[+el.dataset.exercise].sets[+el.dataset.set];
    s[el.dataset.setInput] = el.value;
    s.done = false;
    const row = el.closest(".set");
    row.classList.remove("done");
    const button = row.querySelector("button");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute(
      "aria-label",
      button.getAttribute("aria-label").replace("Desmarcar", "Concluir"),
    );
    persist();
  }
  if (el.dataset.recipeQuantity !== undefined)
    recipeItems[+el.dataset.recipeQuantity].quantity = el.value;
});
document.addEventListener("change", async (event) => {
  const el = event.target;
  if (el.closest('form[data-form="choose-meal-option"]')) updateOptionTotals();
  if (el.id === "chooser-machines") {
    chooserMachines = el.checked;
    showExerciseChooser(chooserContext, chooserIndex, true);
  }
  if (el.id === "chooser-movement") {
    chooserMovement = el.checked
      ? state.active.exercises[chooserIndex].movement
      : "";
    showExerciseChooser(chooserContext, chooserIndex, true);
  }
  if (el.id === "date") {
    if (el.value) {
      selectedDate = el.value;
      planScope = "day";
      render();
    }
  }
  if (el.name === "history-filter") {
    historyFilter = el.value;
    render();
  }
  if (el.name === "body-metric") {
    bodyMetric = el.value;
    render();
  }
  if (el.name === "body-period") {
    period = el.value;
    render();
  }
  if (el.name === "exercise-progress") {
    selectedExercise = el.value;
    render();
  }
  if (el.name === "food-pick") {
    const f = state.foods.find((f) => f.id === el.value);
    currentFood = f ? { ...structuredClone(f), foodId: f.id } : null;
    $("#food-reference").innerHTML = f ? foodReference(f) : "";
    const form = $('form[data-form="entry"]');
    form.elements.unit.innerHTML = `<option>${esc(f?.unit || "g")}</option>`;
    form.elements.quantity.value = f?.reference || "";
  }
  if (el.dataset.recipeFood !== undefined)
    recipeItems[+el.dataset.recipeFood].foodId = el.value;
  if (el.id === "restore-file" && el.files[0]) {
    try {
      const file = el.files[0];
      if (file.size > 100 * 1024 * 1024)
        throw Error("O backup deve ter até 100 MB.");
      const restored = validateBackup(JSON.parse(await file.text()));
      confirmAction(
        "Substituir todos os dados?",
        `Backup válido: ${restored.sessions.length} sessões, ${restored.entries.length} alimentos registrados e ${restored.body.length} registros corporais. Os dados atuais serão substituídos. Exporte um backup antes de continuar.`,
        async () => {
          const previous = state;
          state = restored;
          if (await persist()) {
            close();
            render();
            toast("Backup restaurado.");
          } else {
            state = previous;
            toast("Restauração não gravada. Dados anteriores preservados.");
          }
        },
        "Substituir e restaurar",
      );
    } catch (e) {
      toast("Backup recusado: " + e.message);
    }
    el.value = "";
  }
});

let audio;
document.addEventListener(
  "pointerdown",
  () => {
    try {
      if (!audio) {
        const A = window.AudioContext || window.webkitAudioContext;
        if (A) audio = new A();
      }
      if (audio?.state === "suspended") audio.resume();
    } catch {}
  },
  { passive: true },
);
function alarm() {
  navigator.vibrate?.([200, 100, 200]);
  try {
    if (audio?.state === "running") {
      const o = audio.createOscillator(),
        g = audio.createGain();
      o.connect(g);
      g.connect(audio.destination);
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.12, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.6);
      o.start();
      o.stop(audio.currentTime + 0.6);
    }
  } catch {}
  toast("Descanso concluído. Pronto para a próxima?");
}
function tick() {
  const s = state?.active;
  if (!s) return;
  const clock = $("#elapsed");
  if (clock) clock.textContent = time(elapsed(s));
  const el = $("#rest-display");
  if (el)
    el.innerHTML = s.restUntil
      ? `<small>Descanso</small> <strong>${time(Math.max(0, s.restUntil - Date.now()))}</strong> ${btn("×", "stop-rest", "mini", 'aria-label="Cancelar descanso"')}`
      : "";
  if (s.restUntil && Date.now() >= s.restUntil && lastRest !== s.restUntil) {
    lastRest = s.restUntil;
    alarm();
    s.restUntil = null;
    persist();
  }
}
setInterval(tick, 1000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tick();
});
window.addEventListener("online", () => {
  const el = $("#online-status");
  if (el) el.textContent = "Salvo neste dispositivo";
});
window.addEventListener("offline", () => {
  const el = $("#online-status");
  if (el) el.textContent = "Modo offline";
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  if (page === "user") render();
});

async function boot() {
  try {
    state = await openDB();
    render();
    if (!state.onboarded) {
      modal(
        "Bem-vindo ao seu ritmo",
        `<div class="onboard"><img src="${iconURL}" alt="MiBody"><h2>Um lugar para<br>cuidar de você.</h2><p>Treinos, alimentação e evolução corporal. Tudo no seu dispositivo, sem conta e sem distrações.</p><div class="stack spaced">${btn("Configurar meu perfil", "onboard-profile", "primary")}${btn("Começar sem configurar", "onboard-skip", "ghost")}</div><p style="font-size:12px">Seus dados não sincronizam entre aparelhos. Exporte backups no Perfil.</p></div>`,
      );
    }
  } catch (e) {
    $("#storage-error").hidden = false;
    $("#storage-error").textContent =
      "O armazenamento local está indisponível. Libere espaço ou habilite o armazenamento do navegador e recarregue. Não registre dados antes de resolver.";
    $("#app").innerHTML =
      '<main class="main"><h1>MiBody</h1><p>Seus dados precisam de um lugar seguro neste dispositivo.</p><button onclick="location.reload()">Tentar novamente</button></main>';
    return;
  }
  if ("serviceWorker" in navigator && import.meta.env.PROD && !portable) {
    try {
      const reg = await navigator.serviceWorker.register(`${basePath}sw.js`, {
        scope: basePath,
      });
      const status = $("#offline-status");
      if (status) status.textContent = "Cache offline registrado.";
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          )
            toast(
              "Atualização disponível. Feche e reabra o app após salvar seus dados.",
            );
        });
      });
    } catch {
      toast(
        "Não foi possível preparar o modo offline. Reconecte e recarregue.",
      );
    }
  }
}
boot();
