const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputBox = document.querySelector("#outputBox");
const outputList = document.querySelector("#outputList");

const OUTPUT_MIN_LIFETIME = 5000;
const LINE_FADE_DURATION = 260;
const HEIGHT_DURATION = 460;
const ENTRY_REMOVE_DURATION = 440;
const LINE_EXIT_DURATION = 240;

const typingQueue = [];
let isTyping = false;
let isRevealing = false;
let collapseToken = 0;
let heightFrame = null;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function getTargetOutputHeight() {
  const styles = window.getComputedStyle(outputBox);
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
  const borderBottom = Number.parseFloat(styles.borderBottomWidth) || 0;

  return Math.ceil(
    outputList.scrollHeight + paddingTop + paddingBottom + borderTop + borderBottom,
  );
}

function syncOutputHeight() {
  if (outputBox.hidden || !outputBox.classList.contains("is-open")) {
    return;
  }

  outputBox.style.height = `${Math.max(1, getTargetOutputHeight())}px`;
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

const outputResizeObserver = new ResizeObserver(() => {
  scheduleOutputHeightSync();
});

outputResizeObserver.observe(outputList);

async function revealOutputBox() {
  collapseToken += 1;
  outputBox.classList.remove("is-collapsing", "is-line-leaving");

  if (!outputBox.hidden || isRevealing) {
    while (isRevealing) {
      await wait(16);
    }

    outputBox.classList.add("is-line-visible", "is-open");
    scheduleOutputHeightSync();
    return;
  }

  isRevealing = true;
  outputBox.hidden = false;
  outputBox.style.height = "1px";

  await nextFrame();
  outputBox.classList.add("is-line-visible");
  await wait(LINE_FADE_DURATION);

  outputBox.classList.add("is-open");
  await nextFrame();
  syncOutputHeight();
  await wait(HEIGHT_DURATION);

  isRevealing = false;
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
  scheduleOutputHeightSync();
  await wait(ENTRY_REMOVE_DURATION);

  outputResizeObserver.unobserve(shell);
  shell.remove();
  scheduleOutputHeightSync();

  if (outputList.children.length === 0 && typingQueue.length === 0 && !isTyping) {
    collapseOutputBox();
  }
}

async function collapseOutputBox() {
  const token = ++collapseToken;

  if (outputBox.hidden || outputList.children.length > 0 || isRevealing) {
    return;
  }

  outputBox.classList.remove("is-open");
  outputBox.classList.add("is-collapsing");
  outputBox.style.height = "1px";
  await wait(HEIGHT_DURATION);

  if (token !== collapseToken || outputList.children.length > 0) {
    outputBox.classList.remove("is-collapsing");
    outputBox.classList.add("is-line-visible", "is-open");
    scheduleOutputHeightSync();
    return;
  }

  outputBox.classList.add("is-line-leaving");
  await wait(LINE_EXIT_DURATION);

  if (token !== collapseToken || outputList.children.length > 0) {
    outputBox.classList.remove("is-collapsing", "is-line-leaving");
    outputBox.classList.add("is-line-visible", "is-open");
    scheduleOutputHeightSync();
    return;
  }

  outputBox.hidden = true;
  outputBox.style.height = "1px";
  outputBox.classList.remove("is-collapsing", "is-line-leaving", "is-line-visible");
}

async function processTypingQueue() {
  if (isTyping) {
    return;
  }

  isTyping = true;

  while (typingQueue.length > 0) {
    const { shell, entry, text } = typingQueue.shift();
    await revealOutputBox();
    await typeEntry(entry, text);
    scheduleEntryRemoval(shell);
  }

  isTyping = false;
}

function addOutput(text) {
  collapseToken += 1;
  outputBox.classList.remove("is-collapsing", "is-line-leaving");

  const shell = document.createElement("div");
  shell.className = "output-entry-shell";

  const entry = document.createElement("p");
  entry.className = "output-entry";

  shell.append(entry);
  outputList.append(shell);
  outputResizeObserver.observe(shell);

  typingQueue.push({ shell, entry, text });
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

window.addEventListener("resize", scheduleOutputHeightSync);
window.addEventListener("load", () => {
  commandInput.focus();
});
