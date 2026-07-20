const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputBox = document.querySelector("#outputBox");
const outputList = document.querySelector("#outputList");

const OUTPUT_MIN_LIFETIME = 5000;
const LINE_FADE_DURATION = 260;
const BOX_EXPAND_DURATION = 520;
const ENTRY_REMOVE_DURATION = 420;
const BOX_COLLAPSE_DURATION = 560;

const typingQueue = [];
let isTyping = false;
let isRevealing = false;
let collapseToken = 0;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function revealOutputBox() {
  collapseToken += 1;
  outputBox.classList.remove("is-collapsing");

  if (!outputBox.hidden || isRevealing) {
    while (isRevealing) {
      await wait(16);
    }
    return;
  }

  isRevealing = true;
  outputBox.hidden = false;
  outputBox.classList.add("is-line-entering");
  await wait(LINE_FADE_DURATION);

  outputBox.classList.remove("is-line-entering");
  outputBox.classList.add("is-expanding");
  await wait(BOX_EXPAND_DURATION);
  outputBox.classList.remove("is-expanding");
  isRevealing = false;
}

function getTypingDelay(character) {
  return /[.,;:!?]/.test(character) ? 65 : 24;
}

async function typeEntry(entry, text) {
  entry.classList.add("is-typing");

  for (const character of text) {
    entry.textContent += character;
    await wait(getTypingDelay(character));
  }

  entry.classList.remove("is-typing");
}

function scheduleEntryRemoval(entry) {
  window.setTimeout(() => removeEntry(entry), OUTPUT_MIN_LIFETIME);
}

async function removeEntry(entry) {
  if (!entry.isConnected || entry.classList.contains("is-leaving")) {
    return;
  }

  entry.classList.add("is-leaving");
  await wait(ENTRY_REMOVE_DURATION);
  entry.remove();

  if (outputList.children.length === 0 && typingQueue.length === 0 && !isTyping) {
    collapseOutputBox();
  }
}

async function collapseOutputBox() {
  const token = ++collapseToken;

  if (outputBox.hidden || outputList.children.length > 0 || isRevealing) {
    return;
  }

  outputBox.classList.remove("is-line-entering", "is-expanding");
  outputBox.classList.add("is-collapsing");
  await wait(BOX_COLLAPSE_DURATION);

  if (token !== collapseToken || outputList.children.length > 0) {
    outputBox.classList.remove("is-collapsing");
    return;
  }

  outputBox.hidden = true;
  outputBox.classList.remove("is-collapsing");
}

async function processTypingQueue() {
  if (isTyping) {
    return;
  }

  isTyping = true;

  while (typingQueue.length > 0) {
    const { entry, text } = typingQueue.shift();
    await revealOutputBox();
    await typeEntry(entry, text);
    scheduleEntryRemoval(entry);
  }

  isTyping = false;
}

function addOutput(text) {
  collapseToken += 1;
  outputBox.classList.remove("is-collapsing");

  const entry = document.createElement("p");
  entry.className = "output-entry";
  outputList.append(entry);

  typingQueue.push({ entry, text });
  processTypingQueue();
}

commandForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const command = commandInput.value.trim();
  if (!command) {
    commandInput.focus();
    return;
  }

  addOutput(command);
  commandInput.value = "";
  commandInput.focus();
});

window.addEventListener("load", () => {
  commandInput.focus();
});
