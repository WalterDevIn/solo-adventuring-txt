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
    location: "Mossfield", time: "Morning · Light rain", objective: "Speak with the Guide",
    nearby: ["Guide · eastern gate", "Nurse · infirmary"], journal: "No discoveries yet.",
    messages: [
      ["WORLD", "Rain gathers on the timber roofs of Mossfield. The eastern gate stands open."],
      ["WORLD", "A hooded guide waits beneath the awning, watching the western road."],
    ],
    suggestions: [
      { label: "Talk to the Guide", command: "talk to the guide", next: "guide" },
      { label: "Inspect the gate", command: "inspect the gate", next: "gate" },
    ],
  },
  gate: {
    location: "Mossfield · Eastern Gate", time: "Morning · Light rain", objective: "Speak with the Guide",
    nearby: ["Guide · nearby", "Fresh wagon tracks"], journal: "The western road has been left unused.",
    messages: [
      ["WORLD", "The gate is undamaged. Wagon tracks enter from the east, but none leave toward the west."],
      ["SYSTEM", "The world communicates danger before combat begins."],
    ],
    suggestions: [{ label: "Talk to the Guide", command: "talk to the guide", next: "guide" }],
  },
  guide: {
    location: "Mossfield · Eastern Gate", time: "Morning · Light rain", objective: "Learn about the western ruin",
    nearby: ["Guide · cautious", "Closed western road"], journal: "The Guide believes something occupies the old western ruin.",
    messages: [
      ["GUIDE", "You are the adventurer? Good. I need eyes on the old ruin, not another grave."],
      ["GUIDE", "Three nights ago, something crossed the fields. Since then, the western road has gone silent."],
    ],
    suggestions: [
      { label: "Ask about the ruin", command: "ask about the ruin", next: "briefing" },
      { label: "Ask about the danger", command: "ask about the danger", next: "danger" },
    ],
  },
  danger: {
    location: "Mossfield · Eastern Gate", time: "Morning · Light rain", objective: "Learn about the western ruin",
    nearby: ["Guide · uneasy", "Closed western road"], journal: "The Guide found corrosive residue near the road.",
    messages: [
      ["GUIDE", "No tracks I could trust. Only flattened grass and green residue that burned my glove."],
      ["GUIDE", "If you see it, do not assume it thinks like a person."],
    ],
    suggestions: [{ label: "Ask about the ruin", command: "ask about the ruin", next: "briefing" }],
  },
  briefing: {
    location: "Mossfield · Eastern Gate", time: "Late morning", objective: "Reach the western ruin",
    nearby: ["Guide · mission offered", "Western road · available"], journal: "New lead: inspect the western ruin and return with evidence.",
    messages: [
      ["GUIDE", "Follow the stone markers. The ruin is less than an hour away."],
      ["SYSTEM", "New objective: Reach the western ruin."],
    ],
    suggestions: [{ label: "Leave town", command: "leave town", next: "road" }],
  },
  road: {
    location: "Western Road", time: "Near noon · Rain fading", objective: "Investigate the tracks",
    nearby: ["Ruined marker", "Flattened grass", "Distant structure"], journal: "A heavy creature moved toward the ruin.",
    messages: [
      ["WORLD", "Mossfield disappears behind wet grass and low hills."],
      ["WORLD", "Near a broken marker, the grass has been pressed into a broad, glistening trail."],
    ],
    suggestions: [
      { label: "Inspect the tracks", command: "inspect the tracks", next: "tracks" },
      { label: "Continue to the ruin", command: "continue to the ruin", next: "ruin" },
    ],
  },
  tracks: {
    location: "Western Road", time: "Near noon · Overcast", objective: "Reach the western ruin",
    nearby: ["Corrosive trail", "Ruin · west"], journal: "Evidence: a corrosive ooze traveled toward the ruin.",
    messages: [
      ["WORLD", "The trail is not mud. It is a thin membrane clinging to the grass."],
      ["SYSTEM", "Evidence recorded: Corrosive residue."],
    ],
    suggestions: [{ label: "Continue to the ruin", command: "continue to the ruin", next: "ruin" }],
  },
  ruin: {
    location: "Western Ruin · Courtyard", time: "Noon", objective: "Survive the encounter",
    nearby: ["Collapsed arch", "Green Slime · passage"], journal: "A Green Slime occupies the courtyard.",
    battle: { turn: "Walter's turn", playerHp: "12 / 12 HP", enemies: ["Green Slime · 8 / 8 HP · Near"] },
    messages: [
      ["WORLD", "The courtyard is still except for a wet movement beneath the arch."],
      ["ENEMY_INTENTION", "Green Slime moves to block Walter's passage."],
      ["SYSTEM", "Encounter started. Walter acts first."],
    ],
    suggestions: [
      { label: "Inspect the slime", command: "inspect the slime", next: "inspectSlime" },
      { label: "Attack the slime", command: "attack the slime", next: "attackOne" },
      { label: "Dodge", command: "dodge", next: "dodge" },
    ],
  },
  inspectSlime: {
    location: "Western Ruin · Courtyard", time: "Noon", objective: "Survive the encounter",
    nearby: ["Collapsed arch", "Green Slime · passage"], journal: "Green Slime: slow, corrosive, no visible armor.",
    battle: { turn: "Walter's turn", playerHp: "12 / 12 HP", enemies: ["Green Slime · 8 / 8 HP · Near"] },
    messages: [
      ["SYSTEM", "Green Slime · Slow movement · Corrosive body · No visible armor."],
      ["WORLD", "It advances by folding over itself. The stones hiss where it passes."],
    ],
    suggestions: [
      { label: "Attack the slime", command: "attack the slime", next: "attackOne" },
      { label: "Dodge", command: "dodge", next: "dodge" },
    ],
  },
  dodge: {
    location: "Western Ruin · Courtyard", time: "Noon", objective: "Survive the encounter",
    nearby: ["Collapsed arch", "Green Slime · exposed"], journal: "The slime overextended after Walter evaded it.",
    battle: { turn: "Walter's turn", playerHp: "12 / 12 HP", enemies: ["Green Slime · 8 / 8 HP · Near · Exposed"] },
    messages: [
      ["ENEMY_INTENTION", "Green Slime lashes at Walter."],
      ["DICE", "Green Slime attack · d20 → 7 · Miss"],
      ["WORLD", "The creature crosses the stones and leaves its core exposed."],
      ["SYSTEM", "Walter's turn."],
    ],
    suggestions: [{ label: "Attack the exposed slime", command: "attack the slime", next: "attackOne" }],
  },
  attackOne: {
    location: "Western Ruin · Courtyard", time: "Noon", objective: "Defeat the Green Slime",
    nearby: ["Collapsed arch", "Green Slime · wounded"], journal: "The Green Slime is wounded but still blocks the ruin.",
    battle: { turn: "Walter's turn", playerHp: "10 / 12 HP", enemies: ["Green Slime · 3 / 8 HP · Near · Wounded"] },
    messages: [
      ["DICE", "Walter attack · d20 + 3 → 18 · Hit"],
      ["DICE", "Damage · d6 + 2 → 5"],
      ["WORLD", "The blow tears through the slime's outer mass."],
      ["ENEMY_INTENTION", "Green Slime strikes Walter."],
      ["DICE", "Green Slime attack · d20 → 15 · Hit · 2 damage"],
      ["SYSTEM", "Walter's turn."],
    ],
    suggestions: [{ label: "Finish the slime", command: "attack the slime", next: "victory" }],
  },
  victory: {
    location: "Western Ruin · Courtyard", time: "Early afternoon", objective: "Search the ruin",
    nearby: ["Defeated slime", "Open passage", "Collapsed chamber"], journal: "The passage into the ruin is open.", playerHp: "10 / 12 HP", battle: null,
    messages: [
      ["DICE", "Walter attack · d20 + 3 → 21 · Hit"],
      ["DICE", "Damage · d6 + 2 → 4"],
      ["WORLD", "The exposed core collapses and the remaining mass goes still."],
      ["SYSTEM", "Victory. The encounter ends without leaving the narrative flow."],
    ],
    suggestions: [{ label: "Search the ruin", command: "search the ruin", next: "reward" }],
  },
  reward: {
    location: "Western Ruin · Inner Chamber", time: "Early afternoon", objective: "Return to Mossfield",
    nearby: ["Stone basin", "Broken chest", "Road home"], journal: "Recovered a caravan seal and a corroded fragment.", playerHp: "10 / 12 HP",
    messages: [
      ["WORLD", "Behind the slime lies a chamber used recently as a feeding ground."],
      ["WORLD", "Among ruined packs you find a brass caravan seal and a fragment covered in green residue."],
      ["SYSTEM", "Objective updated: Return to Mossfield."],
    ],
    suggestions: [{ label: "Return to Mossfield", command: "return to mossfield", next: "return" }],
  },
  return: {
    location: "Mossfield", time: "Evening", objective: "Report to the Guide",
    nearby: ["Guide · gate", "Nurse · treating traveler"], journal: "The seal connects the ruin to a missing caravan.", playerHp: "10 / 12 HP",
    messages: [
      ["WORLD", "Mossfield is louder when you return. A damaged caravan arrived while you were away."],
      ["SYSTEM", "While you were away: the Nurse treated an injured traveler; the Guide returned to the gate."],
      ["GUIDE", "You came back. Show me what you found."],
    ],
    suggestions: [{ label: "Give the seal to the Guide", command: "give the seal to the guide", next: "ending" }],
  },
  ending: {
    location: "Mossfield", time: "Evening", objective: "Prototype complete",
    nearby: ["Guide · relieved", "New caravan"], journal: "Exploration, dialogue, combat and world change were presented through one interface.", playerHp: "10 / 12 HP",
    messages: [
      ["GUIDE", "This belonged to the caravan we lost. The ruin was not the beginning of this."],
      ["SYSTEM", "Quest completed: The Western Ruin."],
      ["SYSTEM", "Evaluation point: were intention, consequence and world change clear?"],
    ],
    suggestions: [{ label: "Restart the prototype", command: "restart", action: "restart" }],
  },
};

let currentSceneId = "arrival";
let isPresenting = false;
const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const normalize = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function clearOutput() { outputList.replaceChildren(); }
function originClass(origin) { return origin.toLowerCase().replaceAll("_", "-"); }
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
  playerHp.textContent = scene.playerHp ?? scene.battle?.playerHp ?? "12 / 12 HP";
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
  commandHelp.textContent = "Choose a suggestion or write the equivalent intention.";
  isPresenting = false;
}

async function submitIntention(rawCommand) {
  const scene = scenes[currentSceneId];
  const match = scene.suggestions.find((suggestion) => normalize(suggestion.command) === normalize(rawCommand));
  if (!match) {
    commandHelp.textContent = "That intention is outside this scripted scene. Use one of the contextual suggestions.";
    commandInput.select();
    return;
  }
  if (match.action === "restart") return restartPrototype();
  await typeMessage("PLAYER_INTENTION", rawCommand, true);
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
  commandHelp.textContent = "The prototype accepts the suggested intentions for this scene.";
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
