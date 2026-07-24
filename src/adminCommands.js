const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");

const DM_ORIGIN = { originator: "Dungeon Master", kind: "dm" };

function waitForRuntime() {
  if (window.__soloAdventuringDebug && window.__soloAdventuringChat) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const interval = window.setInterval(() => {
      if (window.__soloAdventuringDebug && window.__soloAdventuringChat) {
        window.clearInterval(interval);
        resolve();
      }
    }, 16);
  });
}

function getBattle() {
  return window.__soloAdventuringDebug?.getActiveBattle?.() ?? null;
}

function getCurrentActor() {
  return window.__soloAdventuringDebug?.getCurrentActor?.() ?? null;
}

function getIntentOrigin() {
  const actor = getCurrentActor();
  if (!actor) return { originator: "Walter", kind: "player" };

  return {
    originator: actor.components.Identity.name,
    kind: actor.components.Controller.type === "PLAYER" ? "player" : "creature",
  };
}

function ensureAdminState(entity) {
  entity.components.AdminState ??= {
    invulnerable: false,
    frozen: false,
  };
  return entity.components.AdminState;
}

function normalizeName(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findCreature(battle, rawName, { defeatedOnly = false } = {}) {
  const target = normalizeName(rawName);
  if (!target) return null;

  const creatures = Object.values(battle.entities).filter((entity) => {
    const defeated = entity.components.CombatState.defeated;
    return defeatedOnly ? defeated : true;
  });

  return creatures.find((entity) => {
    const name = normalizeName(entity.components.Identity.name);
    const definition = normalizeName(entity.definitionId ?? "");
    return name === target
      || definition === target
      || name.includes(target)
      || target.includes(name)
      || definition.includes(target);
  }) ?? null;
}

function currentEntityId(battle) {
  const order = battle.components.TurnOrder;
  return order.entityIds[order.currentIndex] ?? null;
}

function isTurnSuppressed(battle, entity) {
  if (!entity) return false;
  const admin = ensureAdminState(entity);
  if (admin.frozen) return true;

  const ownerId = battle.components.AdminRules?.stopTimeOwnerId ?? null;
  return Boolean(ownerId && entity.entityId !== ownerId);
}

async function say(text) {
  return window.__soloAdventuringChat.appendMessage(text, DM_ORIGIN);
}

async function normalizeTurnFlow() {
  const debug = window.__soloAdventuringDebug;
  const battle = getBattle();
  if (!debug || !battle) return;

  const originalPass = debug.battleManager.__adminOriginalPass
    ?? debug.battleManager.passCurrentTurn.bind(debug.battleManager);

  const limit = battle.components.TurnOrder.entityIds.length * 3;
  for (let index = 0; index < limit; index += 1) {
    const actor = getCurrentActor();
    if (!actor || !isTurnSuppressed(battle, actor)) return;

    const admin = ensureAdminState(actor);
    if (admin.frozen) {
      await say(`${actor.components.Identity.name} is suspended and loses its turn.`);
    } else {
      await say(`Time is stopped for ${actor.components.Identity.name}. Its turn is skipped.`);
    }

    originalPass();
  }
}

function installTurnGuards() {
  const manager = window.__soloAdventuringDebug?.battleManager;
  if (!manager || manager.__adminCommandsInstalled) return;

  manager.__adminCommandsInstalled = true;
  manager.__adminOriginalPass = manager.passCurrentTurn.bind(manager);
  manager.__adminOriginalAttack = manager.performUnarmedAttack.bind(manager);

  manager.passCurrentTurn = (...args) => {
    const result = manager.__adminOriginalPass(...args);
    queueMicrotask(() => normalizeTurnFlow());
    return result;
  };

  manager.performUnarmedAttack = (...args) => {
    const result = manager.__adminOriginalAttack(...args);
    queueMicrotask(() => normalizeTurnFlow());
    return result;
  };
}

async function executeCommand(command) {
  await waitForRuntime();
  installTurnGuards();

  const battle = getBattle();
  if (!battle) {
    await say("There is no active battle.");
    return;
  }

  const actor = getCurrentActor();
  const normalized = command.trim().toLowerCase();

  if (normalized === "/invunerable") {
    if (!actor) return;
    ensureAdminState(actor).invulnerable = true;
    await say(`${actor.components.Identity.name} is now invulnerable and cannot take damage.`);
    return;
  }

  if (normalized === "/stop time") {
    if (!actor) return;
    battle.components.AdminRules ??= {};
    battle.components.AdminRules.stopTimeOwnerId = actor.entityId;
    await say(`Time is stopped for everyone except ${actor.components.Identity.name}. Only ${actor.components.Identity.name} receives turns.`);
    await normalizeTurnFlow();
    return;
  }

  const match = normalized.match(/^\/(freeze|revive|kill)\s+(.+)$/);
  if (!match) {
    await say("Unknown control command.");
    return;
  }

  const [, action, rawTarget] = match;
  const target = findCreature(battle, rawTarget, { defeatedOnly: action === "revive" });
  if (!target) {
    await say(`No matching creature was found for \"${rawTarget}\".`);
    return;
  }

  if (action === "freeze") {
    ensureAdminState(target).frozen = true;
    await say(`${target.components.Identity.name} is suspended. It will automatically lose every turn.`);
    await normalizeTurnFlow();
    return;
  }

  if (action === "kill") {
    target.components.Health.current = 0;
    target.components.CombatState.defeated = true;
    await say(`${target.components.Identity.name} is defeated automatically.`);
    await normalizeTurnFlow();
    return;
  }

  target.components.Health.current = 1;
  target.components.CombatState.defeated = false;
  if (battle.components.BattleStatus.value !== "ACTIVE") {
    battle.components.BattleStatus.value = "ACTIVE";
  }
  await say(`${target.components.Identity.name} returns to the battle with 1 HP.`);
}

commandForm.addEventListener("submit", (event) => {
  const command = commandInput.value.trim();
  if (!command.startsWith("/")) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const origin = getIntentOrigin();
  window.__soloAdventuringChat?.appendMessage(command, origin);

  commandInput.value = "";
  commandInput.dispatchEvent(new Event("input", { bubbles: true }));
  commandInput.disabled = true;

  executeCommand(command)
    .catch((error) => {
      console.error("Control command failed", error);
      return waitForRuntime().then(() => say(`Control command failed: ${error.message}`));
    })
    .finally(() => {
      commandInput.disabled = false;
      commandInput.focus();
    });
}, true);

waitForRuntime().then(installTurnGuards);
