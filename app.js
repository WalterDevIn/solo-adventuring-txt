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
let placeholderIndex = 0;
let heightAnimationFrame = null;

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
  if (!outputPlaceholder.hidden) {
    return outputPlaceholder.scrollHeight;
  }

  return outputList.scrollHeight;
}

function getNaturalOutputHeight() {
  return Math.max(
    71,
    Math.ceil(getVisibleContentHeight() + getOutputChromeHeight()),
  );
}

function setOutputHeight(targetHeight = getNaturalOutputHeight()) {
  if (heightAnimationFrame !== null) {
    window.cancelAnimationFrame(heightAnimationFrame);
  }

  const currentHeight = outputBox.getBoundingClientRect().height;
  outputBox.style.height = `${currentHeight}px`;

  heightAnimationFrame = window.requestAnimationFrame(() => {
    heightAnimationFrame = null;
    outputBox.style.height = `${targetHeight}px`;
  });
}

function measureHeightWithFinalText(entry, text) {
  const previousText = entry.textContent;
  const wasTyping = entry.classList.contains("is-typing");

  entry.classList.remove("is-typing");
  entry.textContent = text;

  const targetHeight = getNaturalOutputHeight();

  entry.textContent = previousText;
  if (wasTyping) {
    entry.classList.add("is-typing");
  }

  return targetHeight;
}

function updateEmptyState() {
  outputPlaceholder.hidden = outputList.children.length !== 0;
  setOutputHeight();
}

function getTypingDelay(character) {
  return /[.,;:!?]/.test(character) ? 65 : 24;
}

async function typeEntry(entry, text) {
  entry.classList.add("is-typing");

  const finalHeight = measureHeightWithFinalText(entry, text);
  setOutputHeight(finalHeight);

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

  const finalHeight = measureHeightWithFinalText(entry, text);
  setOutputHeight(finalHeight);

  typingQueue.push({ shell, entry, text });
  processTypingQueue();
}

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

window.addEventListener("resize", () => {
  outputBox.style.height = `${getNaturalOutputHeight()}px`;
});

window.addEventListener("load", () => {
  updateEmptyState();
  outputBox.style.height = `${getNaturalOutputHeight()}px`;
  commandInput.focus();
});
