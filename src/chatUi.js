const outputBox = document.querySelector("#outputBox");
const outputList = document.querySelector("#outputList");
const outputPlaceholder = document.querySelector("#outputPlaceholder");
const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");

const ORIGIN = Object.freeze({
  PLAYER: { name: "Walter", kind: "player" },
  DM: { name: "Dungeon Master", kind: "dm" },
  DICE: { name: "Dice", kind: "dice" },
});

const PRESENTATION_DELAY_MS = Object.freeze({
  dm: 380,
  dice: 110,
  creature: 220,
  player: 0,
});
const MESSAGE_ENTRANCE_MS = 240;
const MESSAGE_DWELL_MS = 90;
const MAX_MESSAGE_COUNT = 20;
const BOTTOM_THRESHOLD_PX = 28;

const scheduledShells = new WeakSet();
const entrancePromises = new WeakMap();
let presentationTimeline = Promise.resolve();
let autoScrollPinned = true;
let scrollFrame = null;
let pruningHistory = false;

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function getMessageShells() {
  return [...outputList.children].filter((node) =>
    node instanceof HTMLElement && node.classList.contains("output-entry-shell"),
  );
}

function isNearBottom() {
  const distance = outputBox.scrollHeight - outputBox.scrollTop - outputBox.clientHeight;
  return distance <= BOTTOM_THRESHOLD_PX;
}

function scrollToBottom({ force = false } = {}) {
  if (force) autoScrollPinned = true;
  if (!autoScrollPinned) return;
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);

  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null;
    outputBox.scrollTop = outputBox.scrollHeight;
  });
}

function pruneMessageHistory() {
  if (pruningHistory) return;
  pruningHistory = true;

  try {
    const shells = getMessageShells();
    const excess = shells.length - MAX_MESSAGE_COUNT;
    if (excess <= 0) return;

    shells.slice(0, excess).forEach((shell) => shell.remove());
  } finally {
    pruningHistory = false;
  }
}

function createOriginLabel(name) {
  const label = document.createElement("span");
  label.className = "message-originator";
  label.textContent = name;
  return label;
}

function resolveOrigin(shell) {
  if (shell.dataset.originator && shell.dataset.originKind) {
    return {
      name: shell.dataset.originator,
      kind: shell.dataset.originKind,
    };
  }

  const entry = shell.querySelector(".output-entry");
  return entry?.classList.contains("dice-output") ? ORIGIN.DICE : ORIGIN.DM;
}

function applyOrigin(shell) {
  if (!(shell instanceof HTMLElement)) return;
  if (!shell.classList.contains("output-entry-shell")) return;

  const origin = resolveOrigin(shell);
  shell.dataset.originator = origin.name;
  shell.dataset.originKind = origin.kind;
  shell.classList.add("output-entry-shell--chat");
  shell.classList.remove(
    "output-entry-shell--player",
    "output-entry-shell--creature",
    "output-entry-shell--system",
    "output-entry-shell--dm",
    "output-entry-shell--dice",
  );
  shell.classList.add(`output-entry-shell--${origin.kind}`);

  let label = shell.querySelector(":scope > .message-originator");
  if (!label) {
    label = createOriginLabel(origin.name);
    shell.prepend(label);
  } else if (label.textContent !== origin.name) {
    label.textContent = origin.name;
  }
}

function refreshMessageGroups() {
  const shells = getMessageShells();
  let previousOrigin = null;

  for (const shell of shells) {
    applyOrigin(shell);
    const currentOrigin = `${shell.dataset.originKind}:${shell.dataset.originator}`;
    const grouped = currentOrigin === previousOrigin;
    shell.classList.toggle("output-entry-shell--grouped", grouped);

    const label = shell.querySelector(":scope > .message-originator");
    if (label) label.hidden = grouped;
    previousOrigin = currentOrigin;
  }
}

function isInitiativeDice(shell) {
  const diceEntry = shell.querySelector(".dice-output");
  return diceEntry?.dataset.purpose === "Initiative";
}

async function revealShell(shell, delay) {
  if (!shell.isConnected) return;
  if (delay > 0) await wait(delay);
  if (!shell.isConnected) return;

  shell.getBoundingClientRect();
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      shell.classList.remove("output-entry-shell--pending");
      shell.classList.add("output-entry-shell--visible");
      scrollToBottom();
      resolve();
    });
  });

  await wait(MESSAGE_ENTRANCE_MS);
}

function scheduleShell(shell) {
  if (!(shell instanceof HTMLElement)) return Promise.resolve();
  if (!shell.classList.contains("output-entry-shell")) return Promise.resolve();
  if (entrancePromises.has(shell)) return entrancePromises.get(shell);

  scheduledShells.add(shell);
  applyOrigin(shell);
  shell.classList.add("output-entry-shell--pending");

  const kind = shell.dataset.originKind ?? "dm";
  const immediate = kind === "player" || isInitiativeDice(shell);
  const delay = immediate ? 0 : (PRESENTATION_DELAY_MS[kind] ?? PRESENTATION_DELAY_MS.dm);
  const task = async () => {
    await revealShell(shell, delay);
    if (!immediate) await wait(MESSAGE_DWELL_MS);
    return shell;
  };

  const promise = immediate
    ? task()
    : presentationTimeline.then(task, task);

  if (!immediate) {
    presentationTimeline = promise.then(() => undefined, () => undefined);
  }

  entrancePromises.set(shell, promise);
  return promise;
}

function scheduleUnseenShells() {
  getMessageShells().forEach((shell) => {
    if (!scheduledShells.has(shell)) scheduleShell(shell);
  });
}

function appendMessage(text, { originator, kind }) {
  const shell = document.createElement("div");
  shell.className = "output-entry-shell";
  shell.dataset.originator = originator;
  shell.dataset.originKind = kind;

  const entry = document.createElement("p");
  entry.className = "output-entry";
  entry.textContent = text;

  shell.append(entry);
  outputList.append(shell);
  outputPlaceholder.hidden = true;
  pruneMessageHistory();
  refreshMessageGroups();
  scheduleShell(shell);
  scrollToBottom({ force: true });
  return shell;
}

function getCurrentIntentOrigin() {
  const actor = window.__soloAdventuringDebug?.getCurrentActor?.();
  if (!actor) return ORIGIN.PLAYER;

  const name = actor.components?.Identity?.name ?? ORIGIN.PLAYER.name;
  const controller = actor.components?.Controller?.type;
  return controller === "PLAYER"
    ? { name, kind: "player" }
    : { name, kind: "creature" };
}

commandForm.addEventListener("submit", () => {
  const text = commandInput.value.trim();
  if (!text) return;

  const intentOrigin = getCurrentIntentOrigin();
  appendMessage(text, {
    originator: intentOrigin.name,
    kind: intentOrigin.kind,
  });
}, true);

outputBox.addEventListener("scroll", () => {
  autoScrollPinned = isNearBottom();
}, { passive: true });

const observer = new MutationObserver((mutations) => {
  let childrenChanged = false;
  let addedMessage = false;

  for (const mutation of mutations) {
    if (mutation.type !== "childList") continue;
    childrenChanged = true;

    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement && node.classList.contains("output-entry-shell")) {
        addedMessage = true;
        scheduleShell(node);
      }
    });
  }

  if (!childrenChanged) return;
  pruneMessageHistory();
  refreshMessageGroups();
  if (addedMessage) scrollToBottom({ force: true });
});

observer.observe(outputList, {
  childList: true,
});

const resizeObserver = new ResizeObserver(() => {
  scrollToBottom();
});
resizeObserver.observe(outputList);

window.__soloAdventuringChat = {
  appendMessage(text, { originator, kind = "creature" }) {
    return appendMessage(text, { originator, kind });
  },
  waitForEntrance(shell) {
    return scheduleShell(shell);
  },
  refreshMessageGroups,
  scrollToBottom() {
    scrollToBottom({ force: true });
  },
  waitForPresentation() {
    return presentationTimeline;
  },
};

pruneMessageHistory();
refreshMessageGroups();
scheduleUnseenShells();
scrollToBottom({ force: true });