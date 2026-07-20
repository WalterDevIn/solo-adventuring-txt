const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputBox = document.querySelector("#outputBox");
const outputList = document.querySelector("#outputList");
const outputPlaceholder = document.querySelector("#outputPlaceholder");

const OUTPUT_MIN_LIFETIME = 5000;
const ENTRY_FADE_DURATION = 420;
const PLACEHOLDER_INTERVAL = 420;

const typingQueue = [];
let isTyping = false;
let heightFrame = null;
let placeholderIndex = 0;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function getVisibleContentHeight() {
  if (!outputPlaceholder.hidden) {
    return outputPlaceholder.scrollHeight;
  }

  return outputList.scrollHeight;
}

function getTargetOutputHeight() {
  const styles = window.getComputedStyle(outputBox);
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;

  return Math.ceil(
    getVisibleContentHeight() + paddingTop + paddingBottom + borderTop + borderBottom,
  );
}

function syncOutputHeight() {
  outputBox.style.height = `${getTargetOutputHeight()}px`;
}

function scheduleOutputHeightSync() {
  if (heightFrame !== null) {
    return;
  }

  heightFrame = window.requestAnimationFrame(() => {
    heightFrame = null;
    syncOutputHeight();
  });
}

function updateEmptyState() {
  const isEmpty = outputList.children.length === 0;
  outputPlaceholder.hidden = !isEmpty;
  scheduleOutputHeightSync();
}

function getTypingDelay(character) {
  return /[.,;:!?]/.test(character) ? 65 : 24;
}

async function typeEntry(entry, text) {
  entry.classList.add("is-typing");

  for (const character of text) {
    entry.textContent += character;
    scheduleOutputHeightSync();
    await wait(getTypingDelay(character));
  }

  entry.classList.remove("is-typing");
  scheduleOutputHeightSync();
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

  outputResizeObserver.unobserve(shell);
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
  outputResizeObserver.observe(shell);

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