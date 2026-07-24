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

function playDiceSound(count) {
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

    if (!oldest || oldest === protectedShell) {
      break;
    }

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
    return [
      `rolls [${roll.rolls.join(", ")}]`,
      `each ${formatModifier(roll.modifier).trim()}`,
      `adjusted [${roll.adjustedRolls.join(", ")}]`,
      `total ${roll.total}`,
    ].join(" · ");
  }

  const rolledValues = `rolls [${roll.rolls.join(", ")}] = ${roll.raw}`;
  return roll.modifier === 0
    ? rolledValues
    : `${rolledValues}${formatModifier(roll.modifier)}`;
}

function addDiceOutput(roll) {
  outputPlaceholder.hidden = true;

  const shell = document.createElement("div");
  shell.className = "output-entry-shell output-entry-shell--dice";

  const entry = document.createElement("article");
  entry.className = "dice-output";
  entry.setAttribute("aria-label", `${roll.expression} rolled ${roll.total}`);

  const heading = document.createElement("div");
  heading.className = "dice-output__heading";
  heading.append(
    createLabel(roll.count === 1 ? "DIE ROLL" : "DICE ROLL", "dice-output__label"),
    createLabel(roll.expression, "dice-output__expression"),
  );

  const result = document.createElement("div");
  result.className = "dice-output__result";
  result.textContent = String(roll.total);

  const details = document.createElement("div");
  details.className = "dice-output__details";
  details.textContent = formatRollDetails(roll);

  entry.append(heading, result, details);
  shell.append(entry);
  outputList.append(shell);
  removeOverflowingEntries(shell);
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

  if (parsed === null) {
    return;
  }

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

  addDiceOutput(roll);
  playDiceSound(roll.count);
  clearCommandInput();
}, true);

window.__soloAdventuringDice = {
  DICE_MODIFIER_MODE,
  parseDiceCommand,
  rollDie,
  rollDice,
};
