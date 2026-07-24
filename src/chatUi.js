const outputList = document.querySelector("#outputList");
const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");

const ORIGIN = Object.freeze({
  PLAYER: { name: "Walter", kind: "player" },
  DM: { name: "Dungeon Master", kind: "dm" },
  DICE: { name: "Dice", kind: "dice" },
});

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

function appendPlayerInput(text) {
  const shell = document.createElement("div");
  shell.className = "output-entry-shell";
  shell.dataset.originator = ORIGIN.PLAYER.name;
  shell.dataset.originKind = ORIGIN.PLAYER.kind;

  const entry = document.createElement("p");
  entry.className = "output-entry output-entry--player-input";
  entry.textContent = text;

  shell.append(entry);
  outputList.append(shell);
  document.querySelector("#outputPlaceholder").hidden = true;
  refreshMessageGroups();
}

commandForm.addEventListener("submit", () => {
  const text = commandInput.value.trim();
  if (text) appendPlayerInput(text);
}, true);

const observer = new MutationObserver(() => {
  refreshMessageGroups();
});

observer.observe(outputList, {
  childList: true,
  subtree: true,
});

window.__soloAdventuringChat = {
  appendMessage(text, { originator, kind = "creature" }) {
    const shell = document.createElement("div");
    shell.className = "output-entry-shell";
    shell.dataset.originator = originator;
    shell.dataset.originKind = kind;

    const entry = document.createElement("p");
    entry.className = "output-entry";
    entry.textContent = text;
    shell.append(entry);
    outputList.append(shell);
    refreshMessageGroups();
    return shell;
  },
  refreshMessageGroups,
};

refreshMessageGroups();
