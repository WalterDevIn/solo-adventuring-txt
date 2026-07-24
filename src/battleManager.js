const BATTLE_STATUS = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  ACTIVE: "ACTIVE",
  VICTORY: "VICTORY",
  DEFEAT: "DEFEAT",
  ABANDONED: "ABANDONED",
});

const TURN_PHASE = Object.freeze({
  READY: "READY",
  ACTING: "ACTING",
  ENDED: "ENDED",
});

function createId(prefix) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}:${Date.now().toString(36)}-${randomPart}`;
}

function cloneCreatureDefinition(definition, team) {
  return {
    entityId: createId("creature"),
    definitionId: definition.id,
    team,
    components: {
      Identity: {
        name: definition.name,
        role: definition.role,
      },
      Health: {
        current: definition.hp,
        maximum: definition.hp,
      },
      ArmorClass: {
        value: definition.armorClass,
      },
      Controller: {
        type: team === "PLAYER" ? "PLAYER" : "AI",
      },
      CombatState: {
        defeated: false,
      },
    },
  };
}

function getParticipant(battle, entityId) {
  return battle.entities[entityId] ?? null;
}

function isParticipantAbleToAct(battle, entityId) {
  const participant = getParticipant(battle, entityId);

  return Boolean(
    participant &&
    !participant.components.CombatState.defeated &&
    participant.components.Health.current > 0,
  );
}

function getParticipantName(battle, entityId) {
  return getParticipant(battle, entityId)?.components.Identity.name ?? "Unknown";
}

function getCurrentTurnEntityId(battle) {
  const turnOrder = battle.components.TurnOrder;
  return turnOrder.entityIds[turnOrder.currentIndex] ?? null;
}

function appendBattleLog(battle, type, details = {}) {
  battle.components.BattleLog.entries.push({
    type,
    round: battle.components.Round.value,
    turnNumber: battle.components.TurnState.turnNumber,
    ...details,
  });
}

function beginCurrentTurn(battle) {
  const entityId = getCurrentTurnEntityId(battle);

  if (!entityId) {
    throw new Error("The battle has no current participant.");
  }

  battle.components.TurnState.phase = TURN_PHASE.ACTING;
  battle.components.TurnState.activeEntityId = entityId;
  battle.components.TurnState.hasActed = false;

  appendBattleLog(battle, "TURN_STARTED", {
    entityId,
  });
}

function findNextAbleParticipantIndex(battle, fromIndex) {
  const order = battle.components.TurnOrder.entityIds;

  for (let offset = 1; offset <= order.length; offset += 1) {
    const candidateIndex = (fromIndex + offset) % order.length;
    const candidateId = order[candidateIndex];

    if (isParticipantAbleToAct(battle, candidateId)) {
      return candidateIndex;
    }
  }

  return -1;
}

function getLivingTeamMembers(battle, team) {
  return battle.components.BattleTeams[team].filter((entityId) =>
    isParticipantAbleToAct(battle, entityId),
  );
}

function evaluateBattleOutcome(battle) {
  const livingPlayers = getLivingTeamMembers(battle, "PLAYER");
  const livingEnemies = getLivingTeamMembers(battle, "ENEMY");

  if (livingEnemies.length === 0) {
    battle.components.BattleStatus.value = BATTLE_STATUS.VICTORY;
    appendBattleLog(battle, "BATTLE_ENDED", { outcome: BATTLE_STATUS.VICTORY });
    return BATTLE_STATUS.VICTORY;
  }

  if (livingPlayers.length === 0) {
    battle.components.BattleStatus.value = BATTLE_STATUS.DEFEAT;
    appendBattleLog(battle, "BATTLE_ENDED", { outcome: BATTLE_STATUS.DEFEAT });
    return BATTLE_STATUS.DEFEAT;
  }

  return null;
}

function advanceTurn(battle) {
  const turnOrder = battle.components.TurnOrder;
  const previousIndex = turnOrder.currentIndex;
  const previousEntityId = getCurrentTurnEntityId(battle);

  appendBattleLog(battle, "TURN_ENDED", {
    entityId: previousEntityId,
  });

  battle.components.TurnState.phase = TURN_PHASE.ENDED;

  const outcome = evaluateBattleOutcome(battle);
  if (outcome) {
    return { outcome, roundAdvanced: false };
  }

  const nextIndex = findNextAbleParticipantIndex(battle, previousIndex);
  if (nextIndex === -1) {
    throw new Error("No participant is able to take the next turn.");
  }

  const roundAdvanced = nextIndex <= previousIndex;

  if (roundAdvanced) {
    battle.components.Round.value += 1;
    appendBattleLog(battle, "ROUND_STARTED", {
      round: battle.components.Round.value,
    });
  }

  turnOrder.currentIndex = nextIndex;
  battle.components.TurnState.turnNumber += 1;
  beginCurrentTurn(battle);

  return { outcome: null, roundAdvanced };
}

function createBattleEntity({ character, enemies }) {
  const player = cloneCreatureDefinition(character, "PLAYER");
  const enemyEntities = enemies.map((enemy) => cloneCreatureDefinition(enemy, "ENEMY"));
  const participants = [player, ...enemyEntities];

  const battle = {
    entityId: createId("battle"),
    components: {
      BattleStatus: {
        value: BATTLE_STATUS.ACTIVE,
      },
      BattleParticipants: {
        entityIds: participants.map((participant) => participant.entityId),
      },
      BattleTeams: {
        PLAYER: [player.entityId],
        ENEMY: enemyEntities.map((enemy) => enemy.entityId),
      },
      TurnOrder: {
        entityIds: participants.map((participant) => participant.entityId),
        currentIndex: 0,
      },
      TurnState: {
        turnNumber: 1,
        activeEntityId: player.entityId,
        phase: TURN_PHASE.READY,
        hasActed: false,
      },
      Round: {
        value: 1,
      },
      ViewState: {
        playerPresent: true,
      },
      BattleLog: {
        entries: [
          {
            type: "BATTLE_STARTED",
            round: 1,
            turnNumber: 1,
            participantIds: participants.map((participant) => participant.entityId),
          },
          {
            type: "ROUND_STARTED",
            round: 1,
            turnNumber: 1,
          },
        ],
      },
    },
    entities: Object.fromEntries(
      participants.map((participant) => [participant.entityId, participant]),
    ),
  };

  beginCurrentTurn(battle);
  return battle;
}

function describeBattle(battle) {
  const { components } = battle;
  const currentEntityId = getCurrentTurnEntityId(battle);
  const currentParticipant = getParticipant(battle, currentEntityId);
  const playerNames = components.BattleTeams.PLAYER.map((id) => getParticipantName(battle, id));
  const enemyNames = components.BattleTeams.ENEMY.map((id) => getParticipantName(battle, id));

  return [
    `Battle ${battle.entityId}`,
    `Status: ${components.BattleStatus.value}`,
    `Round: ${components.Round.value}`,
    `Turn: ${components.TurnState.turnNumber}`,
    `Phase: ${components.TurnState.phase}`,
    `Current actor: ${getParticipantName(battle, currentEntityId)} (${currentParticipant?.components.Controller.type ?? "UNKNOWN"})`,
    `Player team: ${playerNames.join(", ")}`,
    `Enemy team: ${enemyNames.join(", ")}`,
  ].join("\n");
}

export function createBattleManager() {
  let activeBattle = null;

  function requireActiveBattle() {
    if (!activeBattle) {
      return { ok: false, message: "There is no active battle." };
    }

    if (activeBattle.components.BattleStatus.value !== BATTLE_STATUS.ACTIVE) {
      return {
        ok: false,
        message: `The battle is ${activeBattle.components.BattleStatus.value.toLowerCase()}.`,
      };
    }

    return { ok: true, battle: activeBattle };
  }

  return {
    createBattle(configuration) {
      if (activeBattle) {
        throw new Error("An active battle already exists.");
      }

      activeBattle = createBattleEntity(configuration);
      return activeBattle;
    },

    getActiveBattle() {
      return activeBattle;
    },

    getCurrentActor() {
      if (!activeBattle) return null;
      return getParticipant(activeBattle, getCurrentTurnEntityId(activeBattle));
    },

    hasActiveBattle() {
      return activeBattle !== null;
    },

    describeActiveBattle() {
      return activeBattle ? describeBattle(activeBattle) : "There is no active battle.";
    },

    passCurrentTurn() {
      const activeResult = requireActiveBattle();
      if (!activeResult.ok) return activeResult;

      const battle = activeResult.battle;
      const actorId = getCurrentTurnEntityId(battle);
      const actorName = getParticipantName(battle, actorId);

      if (battle.components.TurnState.hasActed) {
        return { ok: false, message: `${actorName} has already acted this turn.` };
      }

      battle.components.TurnState.hasActed = true;
      appendBattleLog(battle, "ACTION_PASSED", { entityId: actorId });

      const { outcome, roundAdvanced } = advanceTurn(battle);

      if (outcome) {
        return {
          ok: true,
          message: `${actorName} passes. Battle result: ${outcome}.`,
          outcome,
        };
      }

      const nextActorId = getCurrentTurnEntityId(battle);
      const nextActorName = getParticipantName(battle, nextActorId);
      const roundMessage = roundAdvanced
        ? ` Round ${battle.components.Round.value} begins.`
        : "";

      return {
        ok: true,
        message: `${actorName} passes.${roundMessage} It is now ${nextActorName}'s turn.`,
        currentActorId: nextActorId,
        roundAdvanced,
      };
    },

    leaveBattleView() {
      if (!activeBattle) {
        return { ok: false, message: "There is no active battle to leave." };
      }

      activeBattle.components.ViewState.playerPresent = false;
      appendBattleLog(activeBattle, "BATTLE_VIEW_LEFT");

      return { ok: true, message: "You leave the battle view. The battle remains active." };
    },

    enterBattleView() {
      if (!activeBattle) {
        return { ok: false, message: "There is no active battle to enter." };
      }

      activeBattle.components.ViewState.playerPresent = true;
      appendBattleLog(activeBattle, "BATTLE_VIEW_ENTERED");

      return { ok: true, message: describeBattle(activeBattle) };
    },

    clearBattle() {
      const previousBattle = activeBattle;
      activeBattle = null;
      return previousBattle;
    },
  };
}

export { BATTLE_STATUS, TURN_PHASE };