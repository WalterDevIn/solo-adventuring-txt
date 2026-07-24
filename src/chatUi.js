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

const scheduledShells = new WeakSet();
const entrancePromises = new WeakMap();
let presentationTimeline = Promise.resolve();

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
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
  const shells = [...outputList.children].filter((node) =>
    node instanceof HTMLElement && node.classList.contains("output-entry-shell"),
  );

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
  [...outputList.children]
    .filter((node) => node instanceof HTMLElement)
    .forEach((shell) => {
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
  refreshMessageGroups();
  scheduleShell(shell);
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

const observer = new MutationObserver((mutations) => {
  let childrenChanged = false;

  for (const mutation of mutations) {
    if (mutation.type !== "childList") continue;
    childrenChanged = true;
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLElement && node.classList.contains("output-entry-shell")) {
        scheduleShell(node);
      }
    });
  }

  if (childrenChanged) refreshMessageGroups();
});

observer.observe(outputList, {
  childList: true,
});

window.__soloAdventuringChat = {
  appendMessage(text, { originator, kind = "creature" }) {
    return appendMessage(text, { originator, kind });
  },
  waitForEntrance(shell) {
    return scheduleShell(shell);
  },
  refreshMessageGroups,
  waitForPresentation() {
    return presentationTimeline;
  },
};

refreshMessageGroups();
scheduleUnseenShells();
