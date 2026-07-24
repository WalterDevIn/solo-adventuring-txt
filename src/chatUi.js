const outputList = document.querySelector("#outputList");

function getBattleParticipants() {
  const battle = window.__soloAdventuringDebug?.getActiveBattle?.();
  if (!battle) return [];

  return Object.values(battle.entities).map((entity) => ({
    name: entity.components.Identity.name,
    controller: entity.components.Controller.type,
  }));
}

function inferOrigin(shell) {
  const entry = shell.querySelector(".output-entry");
  if (!entry) return { name: "System", kind: "system" };

  if (entry.classList.contains("dice-output")) {
    return { name: "System", kind: "system" };
  }

  const text = entry.textContent.trim();
  const participants = getBattleParticipants();

  for (const participant of participants) {
    const startsWithName = text === participant.name
      || text.startsWith(`${participant.name} `)
      || text.startsWith(`${participant.name}:`)
      || text.startsWith(`${participant.name}\n`);

    if (startsWithName) {
      return {
        name: participant.name,
        kind: participant.controller === "PLAYER" ? "player" : "creature",
      };
    }
  }

  if (/^you(?:\s|\b)/i.test(text)) {
    const player = participants.find((participant) => participant.controller === "PLAYER");
    return { name: player?.name ?? "Player", kind: "player" };
  }

  return { name: "System", kind: "system" };
}

function applyOrigin(shell) {
  if (!(shell instanceof HTMLElement)) return;
  if (!shell.classList.contains("output-entry-shell")) return;

  const origin = inferOrigin(shell);
  shell.classList.add("output-entry-shell--chat");
  shell.classList.remove(
    "output-entry-shell--player",
    "output-entry-shell--creature",
    "output-entry-shell--system",
  );
  shell.classList.add(`output-entry-shell--${origin.kind}`);
  shell.dataset.originator = origin.name;

  let label = shell.querySelector(":scope > .message-originator");
  if (!label) {
    label = document.createElement("span");
    label.className = "message-originator";
    shell.prepend(label);
  }
  label.textContent = origin.name;
}

function processNode(node) {
  if (!(node instanceof HTMLElement)) return;

  if (node.classList.contains("output-entry-shell")) {
    applyOrigin(node);
  }

  node.querySelectorAll?.(".output-entry-shell").forEach(applyOrigin);
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(processNode);
    }

    const shell = mutation.target instanceof HTMLElement
      ? mutation.target.closest(".output-entry-shell")
      : mutation.target.parentElement?.closest(".output-entry-shell");

    if (shell) applyOrigin(shell);
  }
});

observer.observe(outputList, {
  childList: true,
  subtree: true,
  characterData: true,
});

outputList.querySelectorAll(".output-entry-shell").forEach(applyOrigin);
