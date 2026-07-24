import { formatModifier, parseDiceCommand, rollDie } from "./dice.js";

const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputList = document.querySelector("#outputList");
const outputPlaceholder = document.querySelector("#outputPlaceholder");

const D20_AUDIO_PATH = "assets/audio/dice.mp3";
const D20_VOLUME = 0.72;
const d20Sound = new Audio(D20_AUDIO_PATH);
d20Sound.preload = "auto";
d20Sound.load();

function playD20Sound() {
  d20Sound.pause();
  d20Sound.currentTime = 0;
  d20Sound.volume = D20_VOLUME;
  d20Sound.play().catch(() => {
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
    createLabel("DICE ROLL", "dice-output__label"),
    createLabel(roll.expression, "dice-output__expression"),
  );

  const result = document.createElement("div");
  result.className = "dice-output__result";
  result.textContent = String(roll.total);

  const details = document.createElement("div");
  details.className = "dice-output__details";
  details.textContent = roll.modifier === 0
    ? `natural ${roll.raw}`
    : `natural ${roll.raw}${formatModifier(roll.modifier)}`;

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

  const roll = rollDie(parsed.sides, parsed.modifier);

  addDiceOutput(roll);

  if (roll.sides === 20) {
    playD20Sound();
  }

  clearCommandInput();
}, true);

window.__soloAdventuringDice = {
  parseDiceCommand,
  rollDie,
};