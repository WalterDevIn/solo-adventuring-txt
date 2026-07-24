import { rollDie } from "./dice.js";
import { addDiceOutput, waitForDiceTimeline } from "./diceUi.js";

const commandInput = document.querySelector("#commandInput");
const DM_ORIGIN = { originator: "Dungeon Master", kind: "dm" };
const AI_POLL_INTERVAL_MS = 140;
const MAX_CONSECUTIVE_AI_TURNS = 20;

const CREATURE_ATTACKS = Object.freeze({
  "cave-rat": [
    {
      id: "bite",
      name: "Bite",
      attackModifier: 4,
      damage: { sides: 4, modifier: 2, type: "piercing" },
    },
    {
      id: "claw",
      name: "Claw",
      attackModifier: 3,
      damage: { sides: 3, modifier: 1, type: "slashing" },
    },
  ],
  "green-slime": [
    {
      id: "pseudopod",
      name: "Pseudopod",
      attackModifier: 2,
      damage: { sides: 6, modifier: 1, type: "acid" },
    },
    {
      id: "corrosive-splash",
      name: "Corrosive Splash",
      attackModifier: 1,
      damage: { sides: 4, modifier: 2, type: "acid" },
    },
  ],
});

let aiBusy = false;

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

function getLivingOpponents(battle, actor) {
  return Object.values(battle.entities).filter((entity) =>
    entity.team !== actor.team
    && !entity.components.CombatState.defeated
    && entity.components.Health.current > 0,
  );
}

function chooseTarget(battle, actor) {
  const opponents = getLivingOpponents(battle, actor);
  if (opponents.length === 0) return null;

  const player = opponents.find((entity) => entity.components.Controller.type === "PLAYER");
  return player ?? opponents[0];
}

function weightedChoice(entries, random = Math.random) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = random() * total;

  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.value;
  }

  return entries.at(-1).value;
}

function getAttack(actor, attackId) {
  return CREATURE_ATTACKS[actor.definitionId]?.find((attack) => attack.id === attackId) ?? null;
}

function chooseRatDecision(actor) {
  const health = actor.components.Health;
  const healthRatio = health.maximum > 0 ? health.current / health.maximum : 0;

  if (healthRatio <= 0.25) {
    return weightedChoice([
      { value: { type: "pass", intent: "pass", reason: "terrified" }, weight: 76 },
      { value: { type: "attack", attackId: "bite" }, weight: 19 },
      { value: { type: "attack", attackId: "claw" }, weight: 5 },
    ]);
  }

  if (healthRatio <= 0.5) {
    return weightedChoice([
      { value: { type: "pass", intent: "pass", reason: "afraid" }, weight: 56 },
      { value: { type: "attack", attackId: "bite" }, weight: 34 },
      { value: { type: "attack", attackId: "claw" }, weight: 10 },
    ]);
  }

  return weightedChoice([
    { value: { type: "pass", intent: "pass", reason: "hesitates" }, weight: 34 },
    { value: { type: "attack", attackId: "bite" }, weight: 49 },
    { value: { type: "attack", attackId: "claw" }, weight: 17 },
  ]);
}

function chooseSlimeDecision() {
  return weightedChoice([
    { value: { type: "attack", attackId: "pseudopod" }, weight: 35 },
    { value: { type: "attack", attackId: "corrosive-splash" }, weight: 19 },
    { value: { type: "pass", intent: "stand still", reason: "holds-shape" }, weight: 25 },
    { value: { type: "pass", intent: "pass", reason: "distracted" }, weight: 21 },
  ]);
}

function chooseDecision(actor) {
  if (actor.definitionId === "cave-rat") return chooseRatDecision(actor);
  if (actor.definitionId === "green-slime") return chooseSlimeDecision();
  return { type: "pass", intent: "pass", reason: "hesitates" };
}

async function say(text) {
  return window.__soloAdventuringChat.appendMessage(text, DM_ORIGIN);
}

async function appendCreatureIntent(actor, text) {
  return window.__soloAdventuringChat.appendMessage(text, {
    originator: actor.components.Identity.name,
    kind: "creature",
  });
}

function applyDamage(target, damage) {
  const invulnerable = Boolean(target.components.AdminState?.invulnerable);
  if (invulnerable) return { applied: 0, invulnerable: true, defeated: false };

  target.components.Health.current = Math.max(0, target.components.Health.current - damage);
  const defeated = target.components.Health.current === 0;
  target.components.CombatState.defeated = defeated;
  return { applied: damage, invulnerable: false, defeated };
}

function describeTurnContinuation(turnResult) {
  if (turnResult?.outcome) return ` Battle result: ${turnResult.outcome}.`;

  const skipped = Array.isArray(turnResult?.skippedMessages)
    ? turnResult.skippedMessages.map((message) => ` ${message}`).join("")
    : "";
  const nextActor = getCurrentActor();
  const nextText = nextActor
    ? ` It is now ${nextActor.components.Identity.name}'s turn.`
    : "";
  return `${skipped}${nextText}`;
}

function formatAttackIntent(actor, attack, target) {
  if (actor.definitionId === "green-slime") {
    return `uses ${attack.name} on ${target.components.Identity.name}`;
  }
  return `${attack.id} ${target.components.Identity.name}`;
}

function describePass(actor, decision) {
  if (actor.definitionId === "cave-rat") {
    if (decision.reason === "terrified") {
      return "The cave rat is too terrified to attack and gives up its turn.";
    }
    if (decision.reason === "afraid") {
      return "The cave rat recoils in fear and lets its turn pass.";
    }
    return "The cave rat hesitates, searching for an escape instead of attacking.";
  }

  if (actor.definitionId === "green-slime") {
    if (decision.reason === "holds-shape") {
      return "The slime holds itself together and remains perfectly still, passing its turn.";
    }
    return "The slime becomes distracted by its own shifting form and loses its turn.";
  }

  return `${actor.components.Identity.name} hesitates and loses its turn.`;
}

async function executePass(actor, decision) {
  const manager = getDebug().battleManager;
  await appendCreatureIntent(actor, decision.intent);
  const turnResult = manager.passCurrentTurn();
  await say(describePass(actor, decision) + describeTurnContinuation(turnResult));
}

async function executeAttack(actor, attack, target) {
  const manager = getDebug().battleManager;
  const actorName = actor.components.Identity.name;
  const targetName = target.components.Identity.name;

  await appendCreatureIntent(actor, formatAttackIntent(actor, attack, target));
  await say(`${actorName} tries to use ${attack.name} against ${targetName}.`);

  const attackRoll = rollDie(20, attack.attackModifier);
  await addDiceOutput(attackRoll, {
    actor: actorName,
    purpose: attack.name,
    concealPrivateValues: false,
  });

  const targetArmorClass = target.components.ArmorClass.value;
  const hit = attackRoll.total >= targetArmorClass;

  if (!hit) {
    await waitForDiceTimeline();
    const turnResult = manager.passCurrentTurn();
    await say(
      `${actorName} misses ${targetName} with ${attack.name}.`
      + describeTurnContinuation(turnResult),
    );
    return;
  }

  const damageRoll = rollDie(attack.damage.sides, attack.damage.modifier);
  await addDiceOutput(damageRoll, {
    actor: actorName,
    purpose: `${attack.name} damage`,
    concealPrivateValues: false,
  });
  await waitForDiceTimeline();

  const damageResult = applyDamage(target, damageRoll.total);
  const turnResult = manager.passCurrentTurn();
  const continuation = describeTurnContinuation(turnResult);

  if (damageResult.invulnerable) {
    await say(
      `${actorName} hits ${targetName} with ${attack.name}, but ${targetName} is invulnerable and takes no damage.`
      + continuation,
    );
    return;
  }

  const defeatedText = damageResult.defeated ? ` ${targetName} is defeated.` : "";
  await say(
    `${actorName} hits ${targetName} with ${attack.name} for ${damageResult.applied} ${attack.damage.type} damage. `
    + `${targetName} has ${target.components.Health.current} HP remaining.`
    + defeatedText
    + continuation,
  );
}

async function executeAiTurn(actor) {
  const battle = getBattle();
  if (!battle) return;

  const decision = chooseDecision(actor);
  if (decision.type === "pass") {
    await executePass(actor, decision);
    return;
  }

  const attack = getAttack(actor, decision.attackId);
  const target = chooseTarget(battle, actor);
  if (!attack || !target) {
    await executePass(actor, { type: "pass", intent: "pass", reason: "hesitates" });
    return;
  }

  await executeAttack(actor, attack, target);
}

async function resolveAiTurns() {
  if (aiBusy) return;

  const firstActor = getCurrentActor();
  if (!firstActor || firstActor.components.Controller.type !== "AI") return;

  aiBusy = true;
  commandInput.disabled = true;

  try {
    for (let index = 0; index < MAX_CONSECUTIVE_AI_TURNS; index += 1) {
      const battle = getBattle();
      const actor = getCurrentActor();

      if (!battle || battle.components.BattleStatus.value !== "ACTIVE") return;
      if (!actor || actor.components.Controller.type !== "AI") return;

      await executeAiTurn(actor);
    }

    console.warn("AI turn resolution reached its safety limit.");
  } catch (error) {
    console.error("Creature AI failed", error);
    await say(`Creature AI failed: ${error.message}`);
  } finally {
    aiBusy = false;
    const actor = getCurrentActor();
    const battle = getBattle();
    const shouldEnableInput = Boolean(
      actor
      && actor.components.Controller.type === "PLAYER"
      && battle?.components.BattleStatus.value === "ACTIVE",
    );
    commandInput.disabled = !shouldEnableInput;
    if (shouldEnableInput) commandInput.focus();
  }
}

waitForRuntime().then(() => {
  window.setInterval(() => {
    void resolveAiTurns();
  }, AI_POLL_INTERVAL_MS);
});

window.__soloAdventuringCreatureAttacks = {
  catalog: CREATURE_ATTACKS,
  chooseDecision,
  resolveAiTurns,
};
