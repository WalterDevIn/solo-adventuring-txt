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

function getBattle(battleManager) {
  return battleManager.getActiveBattle?.() ?? null;
}

function getCurrentActor(battleManager) {
  return battleManager.getCurrentActor?.() ?? null;
}

function findCreature(battle, rawName, { defeatedOnly = false } = {}) {
  const target = normalizeName(rawName);
  if (!target) return null;

  return Object.values(battle.entities).find((entity) => {
    if (defeatedOnly && !entity.components.CombatState.defeated) return false;

    const name = normalizeName(entity.components.Identity.name);
    const definition = normalizeName(entity.definitionId ?? "");
    return name === target
      || definition === target
      || name.includes(target)
      || target.includes(name)
      || definition.includes(target);
  }) ?? null;
}

function isLiving(entity) {
  return Boolean(
    entity
    && !entity.components.CombatState.defeated
    && entity.components.Health.current > 0,
  );
}

function evaluateOutcome(battle) {
  const livingPlayers = battle.components.BattleTeams.PLAYER
    .map((id) => battle.entities[id])
    .filter(isLiving);
  const livingEnemies = battle.components.BattleTeams.ENEMY
    .map((id) => battle.entities[id])
    .filter(isLiving);

  if (livingEnemies.length === 0) return "VICTORY";
  if (livingPlayers.length === 0) return "DEFEAT";
  return null;
}

function isTurnSuppressed(battle, entity) {
  if (!entity || !isLiving(entity)) return true;
  if (ensureAdminState(entity).frozen) return true;

  const ownerId = battle.components.AdminRules?.stopTimeOwnerId ?? null;
  return Boolean(ownerId && entity.entityId !== ownerId);
}

export function reconcileAdminTurnFlow(battleManager) {
  const battle = getBattle(battleManager);
  if (!battle || battle.components.BattleStatus.value !== "ACTIVE") {
    return { notices: [], currentActor: getCurrentActor(battleManager), outcome: null };
  }

  const notices = [];
  const maximumSkips = Math.max(1, battle.components.TurnOrder.entityIds.length * 2);

  for (let index = 0; index < maximumSkips; index += 1) {
    const actor = getCurrentActor(battleManager);
    if (!actor || !isTurnSuppressed(battle, actor)) {
      return { notices, currentActor: actor, outcome: null };
    }

    const name = actor.components.Identity.name;
    const admin = ensureAdminState(actor);

    if (!isLiving(actor)) {
      notices.push(`${name} is defeated and cannot take its turn.`);
    } else if (admin.frozen) {
      notices.push(`${name} is suspended and automatically loses its turn.`);
    } else {
      notices.push(`Time is stopped for ${name}. Its turn is skipped.`);
    }

    const passResult = battleManager.passCurrentTurn();
    if (passResult.outcome) {
      return { notices, currentActor: null, outcome: passResult.outcome };
    }
  }

  return {
    notices: [...notices, "Turn reconciliation stopped to prevent an infinite loop."],
    currentActor: getCurrentActor(battleManager),
    outcome: null,
  };
}

export function applyInvulnerabilityToAttack(result, battleManager) {
  if (!result?.ok || !result.targetId) return result;

  const battle = getBattle(battleManager);
  const target = battle?.entities[result.targetId];
  if (!target || !ensureAdminState(target).invulnerable) return result;

  const restoredHealth = Math.max(1, result.targetHealth + result.damage);
  target.components.Health.current = restoredHealth;
  target.components.CombatState.defeated = false;
  battle.components.BattleStatus.value = "ACTIVE";

  return {
    ...result,
    damage: 0,
    targetHealth: restoredHealth,
    defeated: false,
    outcome: null,
    invulnerable: true,
  };
}

export function executeAdminCommand(command, battleManager) {
  const normalized = command.trim().toLowerCase();
  if (!normalized.startsWith("/")) return { handled: false, messages: [] };

  const battle = getBattle(battleManager);
  if (!battle) {
    return { handled: true, messages: ["There is no active battle."] };
  }

  const actor = getCurrentActor(battleManager);

  if (normalized === "/invunerable" || normalized === "/invulnerable") {
    if (!actor) return { handled: true, messages: ["There is no current actor."] };
    ensureAdminState(actor).invulnerable = true;
    return {
      handled: true,
      messages: [`${actor.components.Identity.name} is now invulnerable and cannot take damage.`],
    };
  }

  if (normalized === "/stop time") {
    if (!actor) return { handled: true, messages: ["There is no current actor."] };
    battle.components.AdminRules ??= {};
    battle.components.AdminRules.stopTimeOwnerId = actor.entityId;
    const flow = reconcileAdminTurnFlow(battleManager);
    return {
      handled: true,
      messages: [
        `Time is stopped for everyone except ${actor.components.Identity.name}. Only ${actor.components.Identity.name} receives turns.`,
        ...flow.notices,
      ],
      flow,
    };
  }

  const match = normalized.match(/^\/(freeze|revive|kill)\s+(.+)$/);
  if (!match) {
    return { handled: true, messages: ["Unknown control command."] };
  }

  const [, action, rawTarget] = match;
  const target = findCreature(battle, rawTarget, { defeatedOnly: action === "revive" });
  if (!target) {
    return {
      handled: true,
      messages: [`No matching creature was found for "${rawTarget}".`],
    };
  }

  if (action === "freeze") {
    ensureAdminState(target).frozen = true;
    const flow = reconcileAdminTurnFlow(battleManager);
    return {
      handled: true,
      messages: [
        `${target.components.Identity.name} is suspended. It will automatically lose every turn.`,
        ...flow.notices,
      ],
      flow,
    };
  }

  if (action === "kill") {
    target.components.Health.current = 0;
    target.components.CombatState.defeated = true;
    const outcome = evaluateOutcome(battle);

    if (outcome) {
      battle.components.BattleStatus.value = outcome;
      return {
        handled: true,
        messages: [`${target.components.Identity.name} is defeated automatically. Battle result: ${outcome}.`],
      };
    }

    const flow = reconcileAdminTurnFlow(battleManager);
    return {
      handled: true,
      messages: [
        `${target.components.Identity.name} is defeated automatically.`,
        ...flow.notices,
      ],
      flow,
    };
  }

  target.components.Health.current = 1;
  target.components.CombatState.defeated = false;
  battle.components.BattleStatus.value = "ACTIVE";

  const current = getCurrentActor(battleManager);
  if (!current || !isLiving(current)) {
    const targetIndex = battle.components.TurnOrder.entityIds.indexOf(target.entityId);
    battle.components.TurnOrder.currentIndex = Math.max(0, targetIndex);
    battle.components.TurnState.activeEntityId = target.entityId;
    battle.components.TurnState.hasActed = false;
  }

  const flow = reconcileAdminTurnFlow(battleManager);
  return {
    handled: true,
    messages: [
      `${target.components.Identity.name} returns to the battle with 1 HP.`,
      ...flow.notices,
    ],
    flow,
  };
}
