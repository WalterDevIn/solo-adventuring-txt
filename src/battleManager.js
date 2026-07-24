const BATTLE_STATUS = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  ACTIVE: "ACTIVE",
  VICTORY: "VICTORY",
  DEFEAT: "DEFEAT",
  ABANDONED: "ABANDONED",
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
    },
  };
}

function createBattleEntity({ character, enemies }) {
  const player = cloneCreatureDefinition(character, "PLAYER");
  const enemyEntities = enemies.map((enemy) => cloneCreatureDefinition(enemy, "ENEMY"));
  const participants = [player, ...enemyEntities];

  return {
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
            participantIds: participants.map((participant) => participant.entityId),
          },
        ],
      },
    },
    entities: Object.fromEntries(
      participants.map((participant) => [participant.entityId, participant]),
    ),
  };
}

function getParticipantName(battle, entityId) {
  return battle.entities[entityId]?.components.Identity.name ?? "Unknown";
}

function describeBattle(battle) {
  const { components } = battle;
  const currentEntityId = components.TurnOrder.entityIds[components.TurnOrder.currentIndex];
  const playerNames = components.BattleTeams.PLAYER.map((id) => getParticipantName(battle, id));
  const enemyNames = components.BattleTeams.ENEMY.map((id) => getParticipantName(battle, id));

  return [
    `Battle ${battle.entityId}`,
    `Status: ${components.BattleStatus.value}`,
    `Round: ${components.Round.value}`,
    `Current turn: ${getParticipantName(battle, currentEntityId)}`,
    `Player team: ${playerNames.join(", ")}`,
    `Enemy team: ${enemyNames.join(", ")}`,
  ].join("\n");
}

export function createBattleManager() {
  let activeBattle = null;

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

    hasActiveBattle() {
      return activeBattle !== null;
    },

    describeActiveBattle() {
      return activeBattle ? describeBattle(activeBattle) : "There is no active battle.";
    },

    leaveBattleView() {
      if (!activeBattle) {
        return { ok: false, message: "There is no active battle to leave." };
      }

      activeBattle.components.ViewState.playerPresent = false;
      activeBattle.components.BattleLog.entries.push({
        type: "BATTLE_VIEW_LEFT",
        round: activeBattle.components.Round.value,
      });

      return { ok: true, message: "You leave the battle view. The battle remains active." };
    },

    enterBattleView() {
      if (!activeBattle) {
        return { ok: false, message: "There is no active battle to enter." };
      }

      activeBattle.components.ViewState.playerPresent = true;
      activeBattle.components.BattleLog.entries.push({
        type: "BATTLE_VIEW_ENTERED",
        round: activeBattle.components.Round.value,
      });

      return { ok: true, message: describeBattle(activeBattle) };
    },

    clearBattle() {
      const previousBattle = activeBattle;
      activeBattle = null;
      return previousBattle;
    },
  };
}

export { BATTLE_STATUS };
