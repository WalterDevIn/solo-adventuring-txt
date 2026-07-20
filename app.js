const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputBox = document.querySelector("#outputBox");
const outputList = document.querySelector("#outputList");

const OUTPUT_MIN_LIFETIME = 5000;
const LINE_FADE_DURATION = 260;
const BOX_HEIGHT_DURATION = 420;
const ENTRY_REMOVE_DURATION = 420;
const LINE_EXIT_DURATION = 240;
const OUTPUT_VERTICAL_CHROME = 51;

const typingQueue = [];
let isTyping = false;
let isRevealing = false;
let collapseToken = 0;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function getOpenOutputHeight() {
  return Math.max(1, outputList.scrollHeight + OUTPUT_VERTICAL_CHROME);
}

function syncOutputHeight() {
  if (outputBox.hidden || !outputBox.classList.contains("is-open")) {
    return;
  }

  outputBox.style.height = `${getOpenOutputHeight()}px`;
}

const outputResizeObserver = new ResizeObserver(() => {
  syncOutputHeight();
});

outputResizeObserver.observe(outputList);

async function revealOutputBox() {
  collapseToken += 1;
  outputBox.classList.remove("is-collapsing", "is-line-leaving");

  if (!outputBox.hidden || isRevealing) {
    while (isRevealing) {
      await wait(16);
    }

    outputBox.classList.add("is-open", "is-line-visible");
    syncOutputHeight();
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
  await wait(BOX_HEIGHT_DURATION);

  isRevealing = false;
}

function getTypingDelay(character) {
  return /[.,;:!?]/.test(character) ? 65 : 24;
}

async function typeEntry(entry, text) {
  entry.classList.add("is-typing");

  for (const character of text) {
    entry.textContent += character;
    syncOutputHeight();
    await wait(getTypingDelay(character));
  }

  entry.classList.remove("is-typing");
  syncOutputHeight();
}

function scheduleEntryRemoval(entry) {
  window.setTimeout(() => removeEntry(entry), OUTPUT_MIN_LIFETIME);
}

async function removeEntry(entry) {
  if (!entry.isConnected || entry.classList.contains("is-leaving")) {
    return;
  }

  entry.style.maxHeight = `${entry.scrollHeight}px`;
  await nextFrame();
  entry.classList.add("is-leaving");
  syncOutputHeight();

  await wait(ENTRY_REMOVE_DURATION);
  entry.remove();
  syncOutputHeight();

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
  await wait(BOX_HEIGHT_DURATION);

  if (token !== collapseToken || outputList.children.length > 0) {
    outputBox.classList.remove("is-collapsing");
    outputBox.classList.add("is-open", "is-line-visible");
    syncOutputHeight();
    return;
  }

  outputBox.classList.add("is-line-leaving");
  await wait(LINE_EXIT_DURATION);

  if (token !== collapseToken || outputList.children.length > 0) {
    outputBox.classList.remove("is-collapsing", "is-line-leaving");
    outputBox.classList.add("is-open", "is-line-visible");
    syncOutputHeight();
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
    const { entry, text } = typingQueue.shift();
    await revealOutputBox();
    await typeEntry(entry, text);
    scheduleEntryRemoval(entry);
  }

  isTyping = false;
}

function addOutput(text) {
  collapseToken += 1;
  outputBox.classList.remove("is-collapsing", "is-line-leaving");

  const entry = document.createElement("p");
  entry.className = "output-entry";
  outputList.append(entry);
  syncOutputHeight();

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