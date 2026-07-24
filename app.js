import { parseIntent } from "./src/intentParser.js";
import { createGameEngine } from "./src/gameEngine.js";
import { createBattleManager } from "./src/battleManager.js";
import { highlightText } from "./src/textHighlighter.js";

const setupScreen = document.querySelector("#setupScreen");
const consoleScreen = document.querySelector("#consoleScreen");
const characterList = document.querySelector("#characterList");
const enemyList = document.querySelector("#enemyList");
const encounterSummary = document.querySelector("#encounterSummary");
const startBattleButton = document.querySelector("#startBattleButton");
const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const commandHighlight = document.querySelector("#commandHighlight");
const outputList = document.querySelector("#outputList");
const outputPlaceholder = document.querySelector("#outputPlaceholder");

const CHARACTERS = [
  {
    id: "fighter",
    name: "Walter",
    role: "Human Fighter",
    summary: "Reliable frontline combatant.",
    hp: 12,
    armorClass: 15,
  },
];

const ENEMIES = [
  {
    id: "green-slime",
    name: "Green Slime",
    role: "Ooze / CR 1/4",
    summary: "Slow, corrosive and difficult to intimidate.",
    hp: 8,
    armorClass: 8,
  },
  {
    id: "cave-rat",
    name: "Cave Rat",
    role: "Beast / CR 0",
    summary: "Fast and fragile. Dangerous in numbers.",
    hp: 4,
    armorClass: 12,
  },
];

const selection = {
  characterId: CHARACTERS[0]?.id ?? null,
  enemyIds: new Set(),
};

const PLACEHOLDER_INTERVAL = 420;
const KEY_PRESS_AUDIO_PATH = "assets/audio/key-press.mp3";
const KEY_PRESS_MIN_PITCH = 0.86;
const KEY_PRESS_MAX_PITCH = 1.14;
const KEY_PRESS_VOLUME = 0.28;

const typingQueue = [];
const keyPressSound = new Audio(KEY_PRESS_AUDIO_PATH);
const gameEngine = createGameEngine("CITY");
const battleManager = createBattleManager();
keyPressSound.preload = "auto";

let isTyping = false;
let placeholderIndex = 0;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function createSelectionCard(entry, type) {
  const isCharacter = type === "character";
  const card = document.createElement("button");
  card.className = "selection-card";
  card.type = "button";
  card.dataset.id = entry.id;
  card.dataset.type = type;
  card.setAttribute("aria-pressed", "false");

  card.innerHTML = `
    <span class="selection-card__marker">${isCharacter ? "@" : "×"}</span>
    <span class="selection-card__body">
      <strong>${entry.name}</strong>
      <span>${entry.role}</span>
      <small>${entry.summary}</small>
    </span>
    <span class="selection-card__stats">HP ${entry.hp}<br>AC ${entry.armorClass}</span>
  `;

  card.addEventListener("click", () => {
    if (isCharacter) {
      selection.characterId = entry.id;
    } else if (selection.enemyIds.has(entry.id)) {
      selection.enemyIds.delete(entry.id);
    } else {
      selection.enemyIds.add(entry.id);
    }

    renderSelections();
  });

  return card;
}

function renderSelectionLists() {
  characterList.replaceChildren(
    ...CHARACTERS.map((entry) => createSelectionCard(entry, "character")),
  );
  enemyList.replaceChildren(
    ...ENEMIES.map((entry) => createSelectionCard(entry, "enemy")),
  );
}

function renderSelections() {
  document.querySelectorAll(".selection-card").forEach((card) => {
    const selected = card.dataset.type === "character"
      ? card.dataset.id === selection.characterId
      : selection.enemyIds.has(card.dataset.id);

    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });

  const character = CHARACTERS.find((entry) => entry.id === selection.characterId);
  const enemies = ENEMIES.filter((entry) => selection.enemyIds.has(entry.id));
  const valid = Boolean(character && enemies.length > 0 && !battleManager.hasActiveBattle());

  encounterSummary.textContent = battleManager.hasActiveBattle()
    ? "An active battle already exists."
    : valid
      ? `${character.name} // ${enemies.map((enemy) => enemy.name).join(" + ")}`
      : "Select at least one enemy.";
  startBattleButton.disabled = !valid;
}

function updateEmptyState() {
  outputPlaceholder.hidden = outputList.children.length !== 0;
}

function updateInputHighlight() {
  commandHighlight.innerHTML = highlightText(commandInput.value || " ");
  commandHighlight.scrollLeft = commandInput.scrollLeft;
}

function getTypingDelay(character) {
  return /[.,;:!?]/.test(character) ? 65 : 24;
}

function getRandomPitch() {
  return KEY_PRESS_MIN_PITCH + Math.random() * (KEY_PRESS_MAX_PITCH - KEY_PRESS_MIN_PITCH);
}

function playKeyPressSound() {
  const sound = keyPressSound.cloneNode();
  sound.volume = KEY_PRESS_VOLUME;
  sound.playbackRate = getRandomPitch();
  sound.preservesPitch = false;
  sound.play().catch(() => {});
}

function removeOldestOverflowingEntries(protectedShell = null) {
  while (outputList.scrollHeight > outputList.clientHeight) {
    const oldestShell = outputList.firstElementChild;
    if (!oldestShell || oldestShell === protectedShell) break;
    oldestShell.remove();
  }
  updateEmptyState();
}

async function typeEntry(shell, entry, text) {
  entry.classList.add("is-typing");
  let visibleText = "";

  for (const character of text) {
    if (!shell.isConnected) return;
    visibleText += character;
    entry.innerHTML = highlightText(visibleText);
    playKeyPressSound();
    removeOldestOverflowingEntries(shell);
    await wait(getTypingDelay(character));
  }

  entry.classList.remove("is-typing");
}

async function processTypingQueue() {
  if (isTyping) return;
  isTyping = true;

  while (typingQueue.length > 0) {
    const { shell, entry, text } = typingQueue.shift();
    if (shell.isConnected) await typeEntry(shell, entry, text);
  }

  isTyping = false;
}

function addOutput(text) {
  outputPlaceholder.hidden = true;
  const shell = document.createElement("div");
  shell.className = "output-entry-shell";
  const entry = document.createElement("p");
  entry.className = "output-entry";
  shell.append(entry);
  outputList.append(shell);
  removeOldestOverflowingEntries(shell);
  typingQueue.push({ shell, entry, text });
  processTypingQueue();
}

function normalizeBattleCommand(command) {
  return command.trim().toLowerCase().replace(/\s+/g, " ");
}

function processBattleCommand(command) {
  const normalized = normalizeBattleCommand(command);

  if (["battle", "battle status", "status", "list battle", "turn status"].includes(normalized)) {
    return { handled: true, message: battleManager.describeActiveBattle() };
  }

  if (["pass", "pass turn", "end turn", "skip turn", "wait turn"].includes(normalized)) {
    const result = battleManager.passCurrentTurn();
    return { handled: true, message: result.message };
  }

  if (["leave battle", "leave combat", "exit battle view"].includes(normalized)) {
    const result = battleManager.leaveBattleView();
    return { handled: true, message: result.message };
  }

  if (["enter battle", "enter combat", "return to battle"].includes(normalized)) {
    const result = battleManager.enterBattleView();
    return { handled: true, message: result.message };
  }

  return { handled: false, message: "" };
}

function processCommand(command) {
  const battleResult = processBattleCommand(command);

  if (battleResult.handled) {
    addOutput(battleResult.message);
    return;
  }

  const intent = parseIntent(command);
  const result = gameEngine.processIntent(intent);
  console.debug("Command intent", intent);
  console.debug("Game result", result);
  addOutput(result.message);
}

function startCombatPrototype() {
  const character = CHARACTERS.find((entry) => entry.id === selection.characterId);
  const enemies = ENEMIES.filter((entry) => selection.enemyIds.has(entry.id));
  if (!character || enemies.length === 0 || battleManager.hasActiveBattle()) return;

  const battle = battleManager.createBattle({ character, enemies });
  const currentActor = battleManager.getCurrentActor();

  setupScreen.hidden = true;
  consoleScreen.hidden = false;
  addOutput(
    `Battle created. ${character.name} faces ${enemies.map((enemy) => enemy.name).join(" and ")}.\n` +
    `Round 1 begins. It is ${currentActor.components.Identity.name}'s turn.\n` +
    `Entity: ${battle.entityId}\nType "pass" to advance the mechanical turn cycle.`,
  );
  commandInput.focus();
}

window.setInterval(() => {
  const states = [".", "..", "..."];
  placeholderIndex = (placeholderIndex + 1) % states.length;
  outputPlaceholder.textContent = states[placeholderIndex];
}, PLACEHOLDER_INTERVAL);

startBattleButton.addEventListener("click", startCombatPrototype);
commandInput.addEventListener("input", updateInputHighlight);
commandInput.addEventListener("scroll", updateInputHighlight);
commandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const command = commandInput.value.trim();
  if (!command) {
    commandInput.focus();
    return;
  }
  processCommand(command);
  commandInput.value = "";
  updateInputHighlight();
  commandInput.focus();
});

window.addEventListener("resize", () => {
  removeOldestOverflowingEntries();
  updateInputHighlight();
});

window.addEventListener("load", () => {
  renderSelectionLists();
  renderSelections();
  updateEmptyState();
  updateInputHighlight();
});

window.__soloAdventuringDebug = {
  battleManager,
  getActiveBattle: () => battleManager.getActiveBattle(),
  getCurrentActor: () => battleManager.getCurrentActor(),
};