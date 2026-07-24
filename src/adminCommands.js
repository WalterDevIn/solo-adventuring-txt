const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");

const DM_ORIGIN = { originator: "Dungeon Master", kind: "dm" };
const ACTIVE_STATUS = "ACTIVE";

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

function getDebug() {
  return window.__soloAdventuringDebug ?? null;
}

function getBattle() {
  return getDebug()?.getActiveBattle?.() ?? null;
}

function getCurrentActor() {
  return getDebug()?.getCurrentActor?.() ?? null;
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

function isAlive(entity) {
  return Boolean(
    entity
    && !entity.components.CombatState.defeated
    && entity.components.Health.current > 0,
  );
}

function getLivingTeamMembers(battle, team) {
  return battle.components.BattleTeams[team]
    .map((entityId) => battle.entities[entityId])
    .filter(isAlive);
}

function evaluateOutcome(battle) {
  const livingPlayers = getLivingTeamMembers(battle, "PLAYER");
  const livingEnemies = getLivingTeamMembers(battle, "ENEMY");

  if (livingEnemies.length === 0) {
    battle.components.BattleStatus.value = "VICTORY";
    return "VICTORY";
  }

  if (livingPlayers.length === 0) {
    battle.components.BattleStatus.value = "DEFEAT";
    return "DEFEAT";
  }

  battle.components.BattleStatus.value = ACTIVE_STATUS;
  return null;
}

function getSuppressionReason(battle, entity) {
  if (!entity || !isAlive(entity)) return "defeated";
  if (ensureAdminState(entity).frozen) return "frozen";

  const ownerId = battle.components.AdminRules?.stopTimeOwnerId ?? null;
  if (ownerId && entity.entityId !== ownerId) return "time-stopped";
  return null;
}

async function say(text) {
  return window.__soloAdventuringChat.appendMessage(text, DM_ORIGIN);
}

function setCurrentTurn(battle, entity) {
  const turnOrder = battle.components.TurnOrder;
  const index = turnOrder.entityIds.indexOf(entity.entityId);
  if (index === -1) return;

  turnOrder.currentIndex = index;
  battle.components.TurnState.activeEntityId = entity.entityId;
  battle.components.TurnState.phase = "ACTING";
  battle.components.TurnState.hasActed = false;
}

async function normalizeTurnFlow() {
  const debug = getDebug();
  const battle = getBattle();
  if (!debug || !battle || battle.components.BattleStatus.value !== ACTIVE_STATUS) return;

  const originalPass = debug.battleManager.__adminOriginalPass
    ?? debug.battleManager.passCurrentTurn.bind(debug.battleManager);

  const orderLength = battle.components.TurnOrder.entityIds.length;
  const limit = Math.max(1, orderLength * 4);

  for (let index = 0; index < limit; index += 1) {
    const actor = getCurrentActor();
    const reason = getSuppressionReason(battle, actor);
    if (!reason) return;

    if (reason === "frozen") {
      await say(`${actor.components.Identity.name} is suspended and automatically loses its turn.`);
    } else if (reason === "defeated") {
      await say(`${actor.components.Identity.name} is defeated and cannot take its turn.`);
    }

    const result = originalPass();
    if (!result?.ok || result.outcome) return;
  }

  console.warn("Automatic turn normalization reached its safety limit.");
}

function queueAutomaticTurnMessages() {
  queueMicrotask(async () => {
    await normalizeTurnFlow();
  });
}

function installTurnGuards() {
  const manager = getDebug()?.battleManager;
  if (!manager || manager.__adminCommandsInstalled) return;

  manager.__adminCommandsInstalled = true;
  manager.__adminOriginalPass = manager.passCurrentTurn.bind(manager);
  manager.__adminOriginalAttack = manager.performUnarmedAttack.bind(manager);

  manager.passCurrentTurn = (...args) => {
    const result = manager.__adminOriginalPass(...args);
    queueAutomaticTurnMessages();
    return result;
  };

  manager.performUnarmedAttack = (...args) => {
    const battle = getBattle();
    const target = battle ? findCreature(battle, String(args[0] ?? "")) : null;
    const targetAdmin = target ? ensureAdminState(target) : null;
    const previousHealth = target?.components.Health.current ?? null;
    const previousDefeated = target?.components.CombatState.defeated ?? false;

    const result = manager.__adminOriginalAttack(...args);

    if (result.ok && target && targetAdmin?.invulnerable) {
      target.components.Health.current = previousHealth;
      target.components.CombatState.defeated = previousDefeated;
      result.damage = 0;
      result.targetHealth = previousHealth;
      result.defeated = previousDefeated;
      result.outcome = null;
      result.invulnerable = true;
      battle.components.BattleStatus.value = ACTIVE_STATUS;
    }

    queueAutomaticTurnMessages();
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

  if (normalized === "/invunerable" || normalized === "/invulnerable") {
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
    await say(`No matching creature was found for "${rawTarget}".`);
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

    const outcome = evaluateOutcome(battle);
    const outcomeText = outcome ? ` Battle result: ${outcome}.` : "";
    await say(`${target.components.Identity.name} is defeated automatically.${outcomeText}`);

    if (!outcome) await normalizeTurnFlow();
    return;
  }

  target.components.Health.current = 1;
  target.components.CombatState.defeated = false;
  battle.components.BattleStatus.value = ACTIVE_STATUS;

  const current = getCurrentActor();
  if (!isAlive(current)) setCurrentTurn(battle, target);

  await say(`${target.components.Identity.name} returns to the battle with 1 HP.`);
  await normalizeTurnFlow();
}

window.addEventListener("submit", (event) => {
  if (event.target !== commandForm) return;

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
