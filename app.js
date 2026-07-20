const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputBox = document.querySelector("#outputBox");
const outputList = document.querySelector("#outputList");

const OUTPUT_MIN_LIFETIME = 5000;
const LINE_FADE_DURATION = 260;
const HEIGHT_DURATION = 440;
const ENTRY_REMOVE_DURATION = 440;
const LINE_EXIT_DURATION = 240;
const OUTPUT_VERTICAL_CHROME = 45;

const typingQueue = [];
let isTyping = false;
let isRevealing = false;
let collapseToken = 0;
let layoutFrame = null;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function measureEntry(shell) {
  const entry = shell.firstElementChild;
  return entry ? Math.ceil(entry.scrollHeight) : 0;
}

function scheduleLayoutSync() {
  if (layoutFrame !== null) {
    return;
  }

  layoutFrame = window.requestAnimationFrame(() => {
    layoutFrame = null;
    syncLayout();
  });
}

function syncLayout() {
  const shells = [...outputList.children];
  let totalHeight = 0;

  for (const shell of shells) {
    if (!shell.classList.contains("is-leaving")) {
      shell.style.height = `${measureEntry(shell)}px`;
    }

    totalHeight += shell.getBoundingClientRect().height;
  }

  if (shells.length > 1) {
    totalHeight += (shells.length - 1) * 16;
  }

  outputList.style.height = `${Math.ceil(totalHeight)}px`;

  if (!outputBox.hidden && outputBox.classList.contains("is-open")) {
    outputBox.style.height = `${Math.max(1, Math.ceil(totalHeight + OUTPUT_VERTICAL_CHROME))}px`;
  }
}

const outputResizeObserver = new ResizeObserver(() => {
  scheduleLayoutSync();
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
    scheduleLayoutSync();
    return;
  }

  isRevealing = true;
  outputBox.hidden = false;
  outputBox.style.height = "1px";
  outputList.style.height = "0px";

  await nextFrame();
  outputBox.classList.add("is-line-visible");
  await wait(LINE_FADE_DURATION);

  outputBox.classList.add("is-open");
  scheduleLayoutSync();
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
    scheduleLayoutSync();
    await wait(getTypingDelay(character));
  }

  entry.classList.remove("is-typing");
  scheduleLayoutSync();
}

function scheduleEntryRemoval(shell) {
  window.setTimeout(() => removeEntry(shell), OUTPUT_MIN_LIFETIME);
}

async function removeEntry(shell) {
  if (!shell.isConnected || shell.classList.contains("is-leaving")) {
    return;
  }

  shell.style.height = `${measureEntry(shell)}px`;
  await nextFrame();
  shell.classList.add("is-leaving");
  scheduleLayoutSync();

  await wait(ENTRY_REMOVE_DURATION);
  shell.remove();
  scheduleLayoutSync();

  if (outputList.children.length === 0 && typingQueue.length === 0 && !isTyping) {
    collapseOutputBox();
  }
}

async function collapseOutputBox() {
  const token = ++collapseToken;

  if (outputBox.hidden || outputList.children.length > 0 || isRevealing) {
    return;
  }

  outputList.style.height = "0px";
  outputBox.classList.remove("is-open");
  outputBox.classList.add("is-collapsing");
  outputBox.style.height = "1px";

  await wait(HEIGHT_DURATION);

  if (token !== collapseToken || outputList.children.length > 0) {
    outputBox.classList.remove("is-collapsing");
    outputBox.classList.add("is-line-visible", "is-open");
    scheduleLayoutSync();
    return;
  }

  outputBox.classList.add("is-line-leaving");
  await wait(LINE_EXIT_DURATION);

  if (token !== collapseToken || outputList.children.length > 0) {
    outputBox.classList.remove("is-collapsing", "is-line-leaving");
    outputBox.classList.add("is-line-visible", "is-open");
    scheduleLayoutSync();
    return;
  }

  outputBox.hidden = true;
  outputBox.style.height = "1px";
  outputList.style.height = "0px";
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
  outputResizeObserver.observe(entry);

  scheduleLayoutSync();
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

window.addEventListener("resize", scheduleLayoutSync);
window.addEventListener("load", () => {
  commandInput.focus();
});
