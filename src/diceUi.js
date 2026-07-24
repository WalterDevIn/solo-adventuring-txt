import {
  DICE_MODIFIER_MODE,
  formatModifier,
  parseDiceCommand,
  rollDice,
  rollDie,
} from "./dice.js";

const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputList = document.querySelector("#outputList");
const outputPlaceholder = document.querySelector("#outputPlaceholder");

const SINGLE_DIE_AUDIO_PATH = "assets/audio/dice.mp3";
const MULTIPLE_DICE_AUDIO_PATH = "assets/audio/dices.mp3";
const DICE_VOLUME = 0.72;
export const MIN_ROLL_INTERVAL_MS = 1000;
// Kept as a compatibility alias for existing debug consumers.
export const MIN_DIE_INTERVAL_MS = MIN_ROLL_INTERVAL_MS;

const singleDieSound = new Audio(SINGLE_DIE_AUDIO_PATH);
const multipleDiceSound = new Audio(MULTIPLE_DICE_AUDIO_PATH);

for (const sound of [singleDieSound, multipleDiceSound]) {
  sound.preload = "auto";
  sound.load();
}

let diceTimeline = Promise.resolve();
let lastRollTimestamp = 0;
let initiativeBatchOpen = false;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function playDiceSound(count) {
  const sound = count > 1 ? multipleDiceSound : singleDieSound;
  sound.pause();
  sound.currentTime = 0;
  sound.volume = DICE_VOLUME;
  sound.play().catch(() => {
    // Browsers may block audio until the user has interacted with the page.
  });
}

async function waitForNextRoll() {
  const elapsed = performance.now() - lastRollTimestamp;
  if (lastRollTimestamp > 0 && elapsed < MIN_ROLL_INTERVAL_MS) {
    await wait(MIN_ROLL_INTERVAL_MS - elapsed);
  }
}

async function performRoll(count) {
  await waitForNextRoll();
  playDiceSound(count);
  lastRollTimestamp = performance.now();
}

function beginInitiativeBatch() {
  if (initiativeBatchOpen) return;

  initiativeBatchOpen = true;
  playDiceSound(2);
  lastRollTimestamp = performance.now();

  window.setTimeout(() => {
    initiativeBatchOpen = false;
  }, 0);
}

function removeOverflowingEntries(protectedShell) {
  while (outputList.scrollHeight > outputList.clientHeight) {
    const oldest = outputList.firstElementChild;
    if (!oldest || oldest === protectedShell) break;
    oldest.remove();
  }
}

function createLabel(text, className) {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}

function createExpression(roll, concealPrivateValues) {
  const expression = document.createElement("span");
  expression.className = "dice-output__expression";

  const base = roll.count === 1 ? `d${roll.sides}` : `${roll.count}d${roll.sides}`;
  expression.append(createLabel(base, "dice-output__base"));

  const modifierLabel = roll.modifierLabel ?? null;
  if (modifierLabel || roll.modifier !== 0) {
    const modifierText = modifierLabel
      ? ` + ${modifierLabel}`
      : formatModifier(roll.modifier);
    const modifier = createLabel(modifierText, "dice-output__modifier");
    if (concealPrivateValues) modifier.classList.add("dice-output__secret");
    expression.append(modifier);
  }

  return expression;
}

function resolveMetadata(actor, purpose) {
  if (actor) return { actor, purpose };
  if (!purpose) return { actor: null, purpose: null };

  const separatorIndex = purpose.lastIndexOf(" · ");
  if (separatorIndex === -1) return { actor: null, purpose };

  return {
    purpose: purpose.slice(0, separatorIndex),
    actor: purpose.slice(separatorIndex + 3),
  };
}

function isAiActor(actor) {
  if (!actor) return false;

  const battle = window.__soloAdventuringDebug?.getActiveBattle?.();
  if (!battle) return false;

  return Object.values(battle.entities).some((entity) =>
    entity.components.Identity.name === actor
    && entity.components.Controller.type === "AI",
  );
}

function renderDiceOutput(roll, metadata, shouldConceal) {
  outputPlaceholder.hidden = true;

  const shell = document.createElement("div");
  shell.className = "output-entry-shell output-entry-shell--dice";

  const entry = document.createElement("p");
  entry.className = "output-entry dice-output";
  entry.dataset.actor = metadata.actor ?? "";
  entry.dataset.purpose = metadata.purpose ?? "";
  entry.dataset.concealed = String(shouldConceal);
  entry.setAttribute("aria-label", `Dice roll: ${roll.expression}`);

  entry.append(
    createExpression(roll, shouldConceal),
    createLabel(": ", "dice-output__colon"),
  );

  const result = createLabel(String(roll.total), "dice-output__result");
  if (shouldConceal) result.classList.add("dice-output__secret");
  entry.append(result);

  shell.append(entry);
  outputList.append(shell);
  removeOverflowingEntries(shell);
  return shell;
}

export function addDiceOutput(
  roll,
  {
    actor = null,
    purpose = null,
    playSound = true,
    concealPrivateValues = null,
    counterDice = false,
  } = {},
) {
  const metadata = resolveMetadata(actor, purpose);
  const shouldConceal = concealPrivateValues ?? isAiActor(metadata.actor);
  const isInitiativeRoll = metadata.purpose === "Initiative";

  // Initiative is the one built-in simultaneous exception: every participant
  // rolls together at combat start. Counter dice can opt into the same timing.
  if (isInitiativeRoll || counterDice) {
    if (playSound) beginInitiativeBatch();
    return Promise.resolve(renderDiceOutput(roll, metadata, shouldConceal));
  }

  const task = async () => {
    if (playSound) {
      // A roll such as 5d6 is one physical event: all five dice are thrown together.
      await performRoll(roll.count);
    } else {
      await waitForNextRoll();
      lastRollTimestamp = performance.now();
    }

    return renderDiceOutput(roll, metadata, shouldConceal);
  };

  const scheduled = diceTimeline.then(task, task);
  diceTimeline = scheduled.then(() => undefined, () => undefined);
  return scheduled;
}

export function waitForDiceTimeline() {
  return diceTimeline;
}

function addDiceError(message) {
  outputPlaceholder.hidden = true;

  const shell = document.createElement("div");
  shell.className = "output-entry-shell";

  const entry = document.createElement("p");
  entry.className = "output-entry dice-output--error";
  entry.textContent = message;

  shell.append(entry);
  outputList.append(shell);
  removeOverflowingEntries(shell);
}

function clearCommandInput() {
  commandInput.value = "";
  commandInput.dispatchEvent(new Event("input", { bubbles: true }));
  commandInput.focus();
}

commandForm.addEventListener("submit", (event) => {
  const parsed = parseDiceCommand(commandInput.value);
  if (parsed === null) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (!parsed.ok) {
    addDiceError(parsed.error);
    clearCommandInput();
    return;
  }

  const roll = rollDice(
    parsed.count,
    parsed.sides,
    parsed.modifier,
    Math.random,
    parsed.modifierMode,
  );

  addDiceOutput(roll, {
    actor: "Player",
    purpose: "Manual roll",
  });
  clearCommandInput();
}, true);

window.__soloAdventuringDice = {
  DICE_MODIFIER_MODE,
  MIN_DIE_INTERVAL_MS,
  MIN_ROLL_INTERVAL_MS,
  parseDiceCommand,
  rollDie,
  rollDice,
  addDiceOutput,
  waitForDiceTimeline,
  playDiceSound,
};