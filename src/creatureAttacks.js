import { rollDie } from "./dice.js";
import { addDiceOutput, waitForDiceTimeline } from "./diceUi.js";

const commandForm = document.querySelector("#commandForm");
const commandInput = document.querySelector("#commandInput");

const DM_ORIGIN = { originator: "Dungeon Master", kind: "dm" };

const CREATURE_ATTACKS = Object.freeze({
  "cave-rat": [
    {
      id: "bite",
      name: "Bite",
      aliases: ["bite", "attack"],
      attackModifier: 4,
      damage: { sides: 4, modifier: 2, type: "piercing" },
    },
    {
      id: "claw",
      name: "Claw",
      aliases: ["claw", "scratch"],
      attackModifier: 3,
      damage: { sides: 3, modifier: 1, type: "slashing" },
    },
  ],
  "green-slime": [
    {
      id: "pseudopod",
      name: "Pseudopod",
      aliases: ["pseudopod", "slam", "attack"],
      attackModifier: 2,
      damage: { sides: 6, modifier: 1, type: "acid" },
    },
    {
      id: "corrosive-splash",
      name: "Corrosive Splash",
      aliases: ["corrosive splash", "splash"],
      attackModifier: 1,
      damage: { sides: 4, modifier: 2, type: "acid" },
    },
  ],
});

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

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getCurrentActor() {
  return window.__soloAdventuringDebug?.getCurrentActor?.() ?? null;
}

function getBattle() {
  return window.__soloAdventuringDebug?.getActiveBattle?.() ?? null;
}

function getLivingOpponent(battle, actor, rawTarget) {
  const normalizedTarget = normalize(rawTarget);
  const opponents = Object.values(battle.entities).filter((entity) =>
    entity.team !== actor.team
    && !entity.components.CombatState.defeated
    && entity.components.Health.current > 0,
  );

  return opponents.find((entity) => {
    const name = normalize(entity.components.Identity.name);
    const definition = normalize(entity.definitionId ?? "");
    return name === normalizedTarget
      || definition === normalizedTarget
      || name.includes(normalizedTarget)
      || normalizedTarget.includes(name)
      || definition.includes(normalizedTarget);
  }) ?? null;
}

function parseCreatureAttack(command, actor) {
  const attacks = CREATURE_ATTACKS[actor.definitionId];
  if (!attacks) return null;

  const normalizedCommand = normalize(command);
  for (const attack of attacks) {
    const aliases = [...attack.aliases].sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
      if (normalizedCommand === alias) {
        return { attack, targetText: "Walter" };
      }

      if (normalizedCommand.startsWith(`${alias} `)) {
        const targetText = normalizedCommand.slice(alias.length).trim()
          .replace(/^the\s+/, "");
        if (targetText) return { attack, targetText };
      }
    }
  }

  return null;
}

async function say(text) {
  return window.__soloAdventuringChat.appendMessage(text, DM_ORIGIN);
}

function appendCreatureIntent(actor, command) {
  return window.__soloAdventuringChat.appendMessage(command, {
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

async function executeCreatureAttack(actor, attack, target) {
  const manager = window.__soloAdventuringDebug.battleManager;
  const actorName = actor.components.Identity.name;
  const targetName = target.components.Identity.name;

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
    await say(`${actorName} misses ${targetName} with ${attack.name}. ${turnResult.message}`);
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

  if (damageResult.invulnerable) {
    await say(`${actorName} hits ${targetName} with ${attack.name}, but ${targetName} is invulnerable and takes no damage. ${turnResult.message}`);
    return;
  }

  const defeatedText = damageResult.defeated ? ` ${targetName} is defeated.` : "";
  await say(
    `${actorName} hits ${targetName} with ${attack.name} for ${damageResult.applied} ${attack.damage.type} damage. `
    + `${targetName} has ${target.components.Health.current} HP remaining.`
    + defeatedText
    + ` ${turnResult.message}`,
  );
}

commandForm.addEventListener("submit", (event) => {
  const actor = getCurrentActor();
  if (!actor || actor.components.Controller.type !== "AI") return;

  const command = commandInput.value.trim();
  if (!command || command.startsWith("/")) return;

  const parsed = parseCreatureAttack(command, actor);
  if (!parsed) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const battle = getBattle();
  const target = battle ? getLivingOpponent(battle, actor, parsed.targetText) : null;

  commandInput.value = "";
  commandInput.dispatchEvent(new Event("input", { bubbles: true }));
  commandInput.disabled = true;

  waitForRuntime()
    .then(() => appendCreatureIntent(actor, command))
    .then(async () => {
      if (!target) {
        await say(`No living target matches "${parsed.targetText}".`);
        return;
      }
      await executeCreatureAttack(actor, parsed.attack, target);
    })
    .catch((error) => {
      console.error("Creature attack failed", error);
      return say(`Creature attack failed: ${error.message}`);
    })
    .finally(() => {
      commandInput.disabled = false;
      commandInput.focus();
    });
}, true);

window.__soloAdventuringCreatureAttacks = {
  catalog: CREATURE_ATTACKS,
};
