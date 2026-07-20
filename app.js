const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputBox = document.querySelector("#outputBox");
const outputList = document.querySelector("#outputList");
const outputPlaceholder = document.querySelector("#outputPlaceholder");

const OUTPUT_MIN_LIFETIME = 5000;
const ENTRY_FADE_DURATION = 420;
const PLACEHOLDER_INTERVAL = 420;
const MIN_OUTPUT_HEIGHT = 71;

const typingQueue = [];
let isTyping = false;
let placeholderIndex = 0;
let resizeFrame = null;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function getOutputChromeHeight() {
  const styles = window.getComputedStyle(outputBox);

  return (
    (Number.parseFloat(styles.paddingTop) || 0) +
    (Number.parseFloat(styles.paddingBottom) || 0) +
    (Number.parseFloat(styles.borderTopWidth) || 0) +
    (Number.parseFloat(styles.borderBottomWidth) || 0)
  );
}

function getVisibleContentHeight() {
  return outputPlaceholder.hidden
    ? outputList.scrollHeight
    : outputPlaceholder.scrollHeight;
}

function getTargetOutputHeight() {
  return Math.max(
    MIN_OUTPUT_HEIGHT,
    Math.ceil(getVisibleContentHeight() + getOutputChromeHeight()),
  );
}

function syncOutputHeight() {
  outputBox.style.height = `${getTargetOutputHeight()}px`;
}

function scheduleOutputHeightSync() {
  if (resizeFrame !== null) {
    return;
  }

  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    syncOutputHeight();
  });
}

function updateEmptyState() {
  outputPlaceholder.hidden = outputList.children.length !== 0;
  scheduleOutputHeightSync();
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

function scheduleEntryRemoval(shell) {
  window.setTimeout(() => removeEntry(shell), OUTPUT_MIN_LIFETIME);
}

async function removeEntry(shell) {
  if (!shell.isConnected || shell.classList.contains("is-leaving")) {
    return;
  }

  shell.classList.add("is-leaving");
  await wait(ENTRY_FADE_DURATION);

  shell.remove();
  updateEmptyState();
}

async function processTypingQueue() {
  if (isTyping) {
    return;
  }

  isTyping = true;

  while (typingQueue.length > 0) {
    const { shell, entry, text } = typingQueue.shift();
    await typeEntry(entry, text);
    scheduleEntryRemoval(shell);
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

  scheduleOutputHeightSync();
  typingQueue.push({ shell, entry, text });
  processTypingQueue();
}

const outputResizeObserver = new ResizeObserver(() => {
  scheduleOutputHeightSync();
});

outputResizeObserver.observe(outputList);

window.setInterval(() => {
  const states = [".", "..", "..."];
  placeholderIndex = (placeholderIndex + 1) % states.length;
  outputPlaceholder.textContent = states[placeholderIndex];
}, PLACEHOLDER_INTERVAL);

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

window.addEventListener("resize", scheduleOutputHeightSync);
window.addEventListener("load", () => {
  updateEmptyState();
  syncOutputHeight();
  commandInput.focus();
});
