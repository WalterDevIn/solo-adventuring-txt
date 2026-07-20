const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");
const outputList = document.querySelector("#outputList");
const outputPlaceholder = document.querySelector("#outputPlaceholder");

const OUTPUT_MIN_LIFETIME = 5000;
const ENTRY_FADE_DURATION = 420;
const PLACEHOLDER_INTERVAL = 420;
const KEY_PRESS_AUDIO_PATH = "assets/audio/key-press.mp3";
const KEY_PRESS_MIN_PITCH = 0.86;
const KEY_PRESS_MAX_PITCH = 1.14;
const KEY_PRESS_VOLUME = 0.28;

const typingQueue = [];
const keyPressSound = new Audio(KEY_PRESS_AUDIO_PATH);
keyPressSound.preload = "auto";

let isTyping = false;
let placeholderIndex = 0;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function updateEmptyState() {
  outputPlaceholder.hidden = outputList.children.length !== 0;
}

function getTypingDelay(character) {
  return /[.,;:!?]/.test(character) ? 65 : 24;
}

function getRandomPitch() {
  return (
    KEY_PRESS_MIN_PITCH +
    Math.random() * (KEY_PRESS_MAX_PITCH - KEY_PRESS_MIN_PITCH)
  );
}

function playKeyPressSound() {
  const sound = keyPressSound.cloneNode();
  sound.volume = KEY_PRESS_VOLUME;
  sound.playbackRate = getRandomPitch();
  sound.preservesPitch = false;

  sound.play().catch(() => {
    // El navegador puede bloquear audio antes de la primera interacción.
  });
}

function removeOldestOverflowingEntries(protectedShell = null) {
  while (outputList.scrollHeight > outputList.clientHeight) {
    const oldestShell = outputList.firstElementChild;

    if (!oldestShell || oldestShell === protectedShell) {
      break;
    }

    oldestShell.remove();
  }

  updateEmptyState();
}

async function typeEntry(shell, entry, text) {
  entry.classList.add("is-typing");

  for (const character of text) {
    if (!shell.isConnected) {
      return;
    }

    entry.textContent += character;
    playKeyPressSound();
    removeOldestOverflowingEntries(shell);
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

    if (!shell.isConnected) {
      continue;
    }

    await typeEntry(shell, entry, text);

    if (shell.isConnected) {
      scheduleEntryRemoval(shell);
    }
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

  removeOldestOverflowingEntries(shell);
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
  removeOldestOverflowingEntries();
});

window.addEventListener("load", () => {
  updateEmptyState();
  commandInput.focus();
});
