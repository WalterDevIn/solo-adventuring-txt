const $ = (selector) => document.querySelector(selector);

const introScreen = $("#introScreen");
const gameScreen = $("#gameScreen");
const beginButton = $("#beginButton");
const restartButton = $("#restartButton");
const commandForm = $("#commandForm");
const commandInput = $("#commandInput");
const commandHelp = $("#commandHelp");
const outputList = $("#outputList");
const suggestionList = $("#suggestionList");
const locationName = $("#locationName");
const timeLabel = $("#timeLabel");
const objectiveLabel = $("#objectiveLabel");
const nearbyList = $("#nearbyList");
const battleSection = $("#battleSection");
const battleList = $("#battleList");
const turnIndicator = $("#turnIndicator");
const playerHp = $("#playerHp");
const journalEntry = $("#journalEntry");

const WAIT = 14;

const scenes = {
  arrival: {
    location: "Mossfield", time: "Mañana · Lluvia ligera", objective: "Hablar con la Guía",
    nearby: ["Guía · puerta oriental", "Enfermera · enfermería"], journal: "Aún no hay descubrimientos.",
    messages: [
      ["MUNDO", "La lluvia se acumula sobre los techos de madera de Mossfield. La puerta oriental está abierta."],
      ["MUNDO", "Una guía encapuchada espera bajo el alero mientras observa el camino occidental."],
    ],
    suggestions: [
      { label: "Hablar con la Guía", command: "hablar con la guía", next: "guide" },
      { label: "Inspeccionar la puerta", command: "inspeccionar la puerta", next: "gate" },
    ],
  },
  gate: {
    location: "Mossfield · Puerta oriental", time: "Mañana · Lluvia ligera", objective: "Hablar con la Guía",
    nearby: ["Guía · cerca", "Huellas recientes de carro"], journal: "El camino occidental lleva tiempo sin utilizarse.",
    messages: [
      ["MUNDO", "La puerta no está dañada. Las huellas de carro entran desde el este, pero ninguna sale hacia el oeste."],
      ["SISTEMA", "El mundo comunica el peligro antes de que comience el combate."],
    ],
    suggestions: [{ label: "Hablar con la Guía", command: "hablar con la guía", next: "guide" }],
  },
  guide: {
    location: "Mossfield · Puerta oriental", time: "Mañana · Lluvia ligera", objective: "Saber más sobre la ruina occidental",
    nearby: ["Guía · cautelosa", "Camino occidental · cerrado"], journal: "La Guía cree que algo ocupa la antigua ruina occidental.",
    messages: [
      ["GUÍA", "¿Tú eres el aventurero? Bien. Necesito ojos en la vieja ruina, no otra tumba."],
      ["GUÍA", "Hace tres noches algo cruzó los campos. Desde entonces, el camino occidental quedó en silencio."],
    ],
    suggestions: [
      { label: "Preguntar por la ruina", command: "preguntar por la ruina", next: "briefing" },
      { label: "Preguntar por el peligro", command: "preguntar por el peligro", next: "danger" },
    ],
  },
  danger: {
    location: "Mossfield · Puerta oriental", time: "Mañana · Lluvia ligera", objective: "Saber más sobre la ruina occidental",
    nearby: ["Guía · inquieta", "Camino occidental · cerrado"], journal: "La Guía encontró residuos corrosivos cerca del camino.",
    messages: [
      ["GUÍA", "No encontré huellas en las que pudiera confiar. Solo hierba aplastada y un residuo verde que quemó mi guante."],
      ["GUÍA", "Cuando lo veas, no supongas que piensa como una persona."],
    ],
    suggestions: [{ label: "Preguntar por la ruina", command: "preguntar por la ruina", next: "briefing" }],
  },
  briefing: {
    location: "Mossfield · Puerta oriental", time: "Final de la mañana", objective: "Llegar a la ruina occidental",
    nearby: ["Guía · misión ofrecida", "Camino occidental · disponible"], journal: "Nueva pista: inspeccionar la ruina occidental y regresar con pruebas.",
    messages: [
      ["GUÍA", "Sigue los mojones de piedra. La ruina está a menos de una hora."],
      ["SISTEMA", "Nuevo objetivo: llegar a la ruina occidental."],
    ],
    suggestions: [{ label: "Salir del pueblo", command: "salir del pueblo", next: "road" }],
  },
  road: {
    location: "Camino occidental", time: "Cerca del mediodía · La lluvia cesa", objective: "Investigar las huellas",
    nearby: ["Mojón derrumbado", "Hierba aplastada", "Estructura distante"], journal: "Una criatura pesada se dirigió hacia la ruina.",
    messages: [
      ["MUNDO", "Mossfield desaparece detrás de la hierba mojada y las colinas bajas."],
      ["MUNDO", "Junto a un mojón roto, la hierba forma un rastro ancho y brillante."],
    ],
    suggestions: [
      { label: "Inspeccionar las huellas", command: "inspeccionar las huellas", next: "tracks" },
      { label: "Continuar hacia la ruina", command: "continuar hacia la ruina", next: "ruin" },
    ],
  },
  tracks: {
    location: "Camino occidental", time: "Cerca del mediodía · Nublado", objective: "Llegar a la ruina occidental",
    nearby: ["Rastro corrosivo", "Ruina · oeste"], journal: "Prueba: una criatura corrosiva viajó recientemente hacia la ruina.",
    messages: [
      ["MUNDO", "El rastro no es barro. Es una membrana fina adherida a la hierba."],
      ["SISTEMA", "Prueba registrada: residuo corrosivo."],
    ],
    suggestions: [{ label: "Continuar hacia la ruina", command: "continuar hacia la ruina", next: "ruin" }],
  },
  ruin: {
    location: "Ruina occidental · Patio", time: "Mediodía", objective: "Sobrevivir al encuentro",
    nearby: ["Arco derrumbado", "Baba verde · bloquea el paso"], journal: "Una Baba verde ocupa el patio.",
    battle: { turn: "Turno de Walter", playerHp: "12 / 12 PV", enemies: ["Baba verde · 8 / 8 PV · Cerca"] },
    messages: [
      ["MUNDO", "El patio permanece inmóvil salvo por un movimiento húmedo bajo el arco."],
      ["INTENCIÓN_ENEMIGA", "La Baba verde intenta bloquear el paso de Walter."],
      ["SISTEMA", "Comienza el encuentro. Walter actúa primero."],
    ],
    suggestions: [
      { label: "Inspeccionar la baba", command: "inspeccionar la baba", next: "inspectSlime" },
      { label: "Atacar a la baba", command: "atacar a la baba", next: "attackOne" },
      { label: "Esquivar", command: "esquivar", next: "dodge" },
    ],
  },
  inspectSlime: {
    location: "Ruina occidental · Patio", time: "Mediodía", objective: "Sobrevivir al encuentro",
    nearby: ["Arco derrumbado", "Baba verde · bloquea el paso"], journal: "Baba verde: lenta, corrosiva y sin armadura visible.",
    battle: { turn: "Turno de Walter", playerHp: "12 / 12 PV", enemies: ["Baba verde · 8 / 8 PV · Cerca"] },
    messages: [
      ["SISTEMA", "Baba verde · Movimiento lento · Cuerpo corrosivo · Sin armadura visible."],
      ["MUNDO", "Avanza plegándose sobre sí misma. Las piedras silban a su paso."],
    ],
    suggestions: [
      { label: "Atacar a la baba", command: "atacar a la baba", next: "attackOne" },
      { label: "Esquivar", command: "esquivar", next: "dodge" },
    ],
  },
  dodge: {
    location: "Ruina occidental · Patio", time: "Mediodía", objective: "Sobrevivir al encuentro",
    nearby: ["Arco derrumbado", "Baba verde · expuesta"], journal: "La Baba se extendió demasiado cuando Walter evitó su ataque.",
    battle: { turn: "Turno de Walter", playerHp: "12 / 12 PV", enemies: ["Baba verde · 8 / 8 PV · Cerca · Expuesta"] },
    messages: [
      ["INTENCIÓN_ENEMIGA", "La Baba verde intenta azotar a Walter."],
      ["DADOS", "Ataque de Baba verde · d20 → 7 · Falla"],
      ["MUNDO", "La criatura cruza las piedras y deja expuesto su núcleo."],
      ["SISTEMA", "Turno de Walter."],
    ],
    suggestions: [{ label: "Atacar a la baba expuesta", command: "atacar a la baba", next: "attackOne" }],
  },
  attackOne: {
    location: "Ruina occidental · Patio", time: "Mediodía", objective: "Derrotar a la Baba verde",
    nearby: ["Arco derrumbado", "Baba verde · herida"], journal: "La Baba verde está herida, pero todavía bloquea la ruina.",
    battle: { turn: "Turno de Walter", playerHp: "10 / 12 PV", enemies: ["Baba verde · 3 / 8 PV · Cerca · Herida"] },
    messages: [
      ["DADOS", "Ataque de Walter · d20 + 3 → 18 · Impacta"],
      ["DADOS", "Daño · d6 + 2 → 5"],
      ["MUNDO", "El golpe atraviesa la masa exterior de la Baba."],
      ["INTENCIÓN_ENEMIGA", "La Baba verde intenta golpear a Walter."],
      ["DADOS", "Ataque de Baba verde · d20 → 15 · Impacta · 2 de daño"],
      ["SISTEMA", "Turno de Walter."],
    ],
    suggestions: [{ label: "Rematar a la baba", command: "atacar a la baba", next: "victory" }],
  },
  victory: {
    location: "Ruina occidental · Patio", time: "Primeras horas de la tarde", objective: "Registrar la ruina",
    nearby: ["Baba derrotada", "Paso abierto", "Cámara derrumbada"], journal: "El paso hacia el interior de la ruina está abierto.", playerHp: "10 / 12 PV", battle: null,
    messages: [
      ["DADOS", "Ataque de Walter · d20 + 3 → 21 · Impacta"],
      ["DADOS", "Daño · d6 + 2 → 4"],
      ["MUNDO", "El núcleo expuesto colapsa y el resto de la masa queda inmóvil."],
      ["SISTEMA", "Victoria. El encuentro termina sin abandonar el flujo narrativo."],
    ],
    suggestions: [{ label: "Registrar la ruina", command: "registrar la ruina", next: "reward" }],
  },
  reward: {
    location: "Ruina occidental · Cámara interior", time: "Primeras horas de la tarde", objective: "Regresar a Mossfield",
    nearby: ["Cuenco de piedra", "Cofre roto", "Camino de regreso"], journal: "Walter recuperó un sello de caravana y un fragmento corroído.", playerHp: "10 / 12 PV",
    messages: [
      ["MUNDO", "Detrás de la Baba hay una cámara utilizada recientemente como zona de alimentación."],
      ["MUNDO", "Entre mochilas arruinadas encuentras un sello de caravana de latón y un fragmento cubierto de residuo verde."],
      ["SISTEMA", "Objetivo actualizado: regresar a Mossfield."],
    ],
    suggestions: [{ label: "Regresar a Mossfield", command: "regresar a mossfield", next: "return" }],
  },
  return: {
    location: "Mossfield", time: "Atardecer", objective: "Informar a la Guía",
    nearby: ["Guía · puerta", "Enfermera · atiende a un viajero"], journal: "El sello relaciona la ruina con una caravana desaparecida.", playerHp: "10 / 12 PV",
    messages: [
      ["MUNDO", "Mossfield está más ruidoso cuando regresas. Una caravana dañada llegó durante tu ausencia."],
      ["SISTEMA", "Durante tu ausencia: la Enfermera atendió a un viajero herido y la Guía regresó a la puerta."],
      ["GUÍA", "Regresaste. Muéstrame lo que encontraste."],
    ],
    suggestions: [{ label: "Entregar el sello a la Guía", command: "entregar el sello a la guía", next: "ending" }],
  },
  ending: {
    location: "Mossfield", time: "Atardecer", objective: "Prototipo completado",
    nearby: ["Guía · aliviada", "Nueva caravana"], journal: "La interfaz presentó exploración, conversación, combate y cambios del mundo.", playerHp: "10 / 12 PV",
    messages: [
      ["GUÍA", "Esto pertenecía a la caravana que perdimos. La ruina no fue el comienzo de todo esto."],
      ["SISTEMA", "Misión completada: La ruina occidental."],
      ["SISTEMA", "Punto de evaluación: ¿quedaron claras la intención, la consecuencia y la transformación del mundo?"],
    ],
    suggestions: [{ label: "Reiniciar el prototipo", command: "reiniciar", action: "restart" }],
  },
};

let currentSceneId = "arrival";
let isPresenting = false;
const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const normalize = (value) => value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

function clearOutput() { outputList.replaceChildren(); }
function originClass(origin) { return origin.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("_", "-"); }
function originLabel(origin) { return origin.replaceAll("_", " "); }

async function typeMessage(origin, text, instant = false) {
  const shell = document.createElement("article");
  shell.className = `message message--${originClass(origin)}`;
  const label = document.createElement("span");
  label.className = "message-origin";
  label.textContent = originLabel(origin);
  const body = document.createElement("p");
  shell.append(label, body);
  outputList.append(shell);
  if (instant) {
    body.textContent = text;
    outputList.scrollTop = outputList.scrollHeight;
    return;
  }
  for (const character of text) {
    body.textContent += character;
    outputList.scrollTop = outputList.scrollHeight;
    await wait(/[.,;:!?]/.test(character) ? WAIT * 2 : WAIT);
  }
}

function renderSuggestions(scene) {
  suggestionList.replaceChildren();
  for (const suggestion of scene.suggestions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = suggestion.label;
    button.addEventListener("click", () => {
      commandInput.value = suggestion.command;
      commandInput.focus();
    });
    suggestionList.append(button);
  }
}

function renderContext(scene) {
  locationName.textContent = scene.location;
  timeLabel.textContent = scene.time;
  objectiveLabel.textContent = scene.objective;
  journalEntry.textContent = scene.journal;
  playerHp.textContent = scene.playerHp ?? scene.battle?.playerHp ?? "12 / 12 PV";
  nearbyList.replaceChildren(...scene.nearby.map((item) => Object.assign(document.createElement("div"), { textContent: item })));
  if (scene.battle) {
    battleSection.hidden = false;
    battleList.replaceChildren(...scene.battle.enemies.map((item) => Object.assign(document.createElement("div"), { textContent: item })));
    turnIndicator.textContent = scene.battle.turn;
  } else {
    battleSection.hidden = true;
    battleList.replaceChildren();
    turnIndicator.textContent = "";
  }
}

async function presentScene(sceneId) {
  const scene = scenes[sceneId];
  if (!scene || isPresenting) return;
  currentSceneId = sceneId;
  isPresenting = true;
  commandInput.disabled = true;
  renderContext(scene);
  renderSuggestions(scene);
  for (const [origin, text] of scene.messages) await typeMessage(origin, text);
  commandInput.disabled = false;
  commandInput.value = "";
  commandInput.focus();
  commandHelp.textContent = "Elige una sugerencia o escribe la intención equivalente.";
  isPresenting = false;
}

async function submitIntention(rawCommand) {
  const scene = scenes[currentSceneId];
  const match = scene.suggestions.find((suggestion) => normalize(suggestion.command) === normalize(rawCommand));
  if (!match) {
    commandHelp.textContent = "Esa intención queda fuera de esta escena guionada. Utiliza una de las sugerencias contextuales.";
    commandInput.select();
    return;
  }
  if (match.action === "restart") return restartPrototype();
  await typeMessage("INTENCIÓN_DEL_JUGADOR", rawCommand, true);
  await presentScene(match.next);
}

function startPrototype() {
  introScreen.hidden = true;
  gameScreen.hidden = false;
  clearOutput();
  presentScene("arrival");
}

function restartPrototype() {
  currentSceneId = "arrival";
  isPresenting = false;
  clearOutput();
  gameScreen.hidden = true;
  introScreen.hidden = false;
  commandInput.value = "";
  commandHelp.textContent = "El prototipo acepta las intenciones sugeridas para esta escena.";
  beginButton.focus();
}

beginButton.addEventListener("click", startPrototype);
restartButton.addEventListener("click", restartPrototype);
commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isPresenting) return;
  const command = commandInput.value.trim();
  if (!command) return commandInput.focus();
  submitIntention(command);
});