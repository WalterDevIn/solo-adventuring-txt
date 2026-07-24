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

const singleDieSound = new Audio(SINGLE_DIE_AUDIO_PATH);
const multipleDiceSound = new Audio(MULTIPLE_DICE_AUDIO_PATH);

for (const sound of [singleDieSound, multipleDiceSound]) {
  sound.preload = "auto";
  sound.load();
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

function formatRollDetails(roll) {
  if (roll.count === 1) {
    return roll.modifier === 0
      ? `natural ${roll.rolls[0]}`
      : `natural ${roll.rolls[0]}${formatModifier(roll.modifier)}`;
  }

  if (roll.modifierMode === DICE_MODIFIER_MODE.EACH && roll.modifier !== 0) {
    return `natural [${roll.rolls.join(", ")}] · adjusted [${roll.adjustedRolls.join(", ")}]`;
  }

  const natural = `[${roll.rolls.join(", ")}] = ${roll.raw}`;
  return roll.modifier === 0 ? natural : `${natural}${formatModifier(roll.modifier)}`;
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

export function addDiceOutput(
  roll,
  {
    actor = null,
    purpose = null,
    playSound = true,
    concealPrivateValues = null,
  } = {},
) {
  outputPlaceholder.hidden = true;

  const metadata = resolveMetadata(actor, purpose);
  const shouldConceal = concealPrivateValues ?? isAiActor(metadata.actor);

  const shell = document.createElement("div");
  shell.className = "output-entry-shell output-entry-shell--dice";

  const entry = document.createElement("article");
  entry.className = "dice-output";
  entry.dataset.actor = metadata.actor ?? "";
  entry.dataset.purpose = metadata.purpose ?? "";
  entry.dataset.concealed = String(shouldConceal);
  entry.setAttribute("aria-label", `Dice roll: ${roll.expression}`);

  const main = document.createElement("div");
  main.className = "dice-output__main";
  main.append(
    createExpression(roll, shouldConceal),
    createLabel(":", "dice-output__colon"),
  );

  const result = createLabel(String(roll.total), "dice-output__result");
  if (shouldConceal) result.classList.add("dice-output__secret");
  main.append(result);

  const details = document.createElement("div");
  details.className = "dice-output__details";
  details.textContent = formatRollDetails(roll);
  if (shouldConceal) details.classList.add("dice-output__details--concealed");

  entry.append(main, details);
  shell.append(entry);
  outputList.append(shell);
  removeOverflowingEntries(shell);

  if (playSound) playDiceSound(roll.count);
  return shell;
}

function addDiceError(message) {
  outputPlaceholder.hidden = true;

  const shell = document.createElement("div");
  shell.className = "output-entry-shell output-entry-shell--dice";

  const entry = document.createElement("p");
  entry.className = "dice-output dice-output--error";
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
  parseDiceCommand,
  rollDie,
  rollDice,
  addDiceOutput,
  playDiceSound,
};