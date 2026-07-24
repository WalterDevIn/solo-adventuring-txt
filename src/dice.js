const DICE_COMMAND_PATTERN = /^(?:roll|throw)?\s*(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?$/i;

const MIN_DICE = 1;
const MAX_DICE = 100;
const MIN_SIDES = 2;
const MAX_SIDES = 10000;
const MAX_MODIFIER = 100000;

export function parseDiceCommand(command) {
  const match = command.trim().match(DICE_COMMAND_PATTERN);

  if (!match) {
    return null;
  }

  const count = match[1] ? Number.parseInt(match[1], 10) : 1;
  const sides = Number.parseInt(match[2], 10);
  const magnitude = match[4] ? Number.parseInt(match[4], 10) : 0;
  const modifier = match[3] === "-" ? -magnitude : magnitude;

  if (!Number.isSafeInteger(count) || count < MIN_DICE || count > MAX_DICE) {
    return {
      ok: false,
      error: `You can roll between ${MIN_DICE} and ${MAX_DICE} dice at once.`,
    };
  }

  if (!Number.isSafeInteger(sides) || sides < MIN_SIDES || sides > MAX_SIDES) {
    return {
      ok: false,
      error: `Each die must have between ${MIN_SIDES} and ${MAX_SIDES} sides.`,
    };
  }

  if (!Number.isSafeInteger(modifier) || Math.abs(modifier) > MAX_MODIFIER) {
    return {
      ok: false,
      error: `The modifier must be between -${MAX_MODIFIER} and +${MAX_MODIFIER}.`,
    };
  }

  return {
    ok: true,
    count,
    sides,
    modifier,
  };
}

export function rollDice(count, sides, modifier = 0, random = Math.random) {
  if (!Number.isSafeInteger(count) || count < MIN_DICE || count > MAX_DICE) {
    throw new RangeError(`Invalid dice count: ${count}`);
  }

  if (!Number.isSafeInteger(sides) || sides < MIN_SIDES || sides > MAX_SIDES) {
    throw new RangeError(`Invalid die sides: ${sides}`);
  }

  if (!Number.isSafeInteger(modifier) || Math.abs(modifier) > MAX_MODIFIER) {
    throw new RangeError(`Invalid dice modifier: ${modifier}`);
  }

  const rolls = Array.from(
    { length: count },
    () => Math.floor(random() * sides) + 1,
  );
  const raw = rolls.reduce((sum, value) => sum + value, 0);

  return {
    type: count === 1 ? "DIE_ROLLED" : "DICE_ROLLED",
    count,
    sides,
    modifier,
    rolls,
    raw,
    total: raw + modifier,
    expression: `${count === 1 ? "" : count}d${sides}${formatModifier(modifier)}`,
  };
}

export function rollDie(sides, modifier = 0, random = Math.random) {
  return rollDice(1, sides, modifier, random);
}

export function formatModifier(modifier) {
  if (modifier === 0) {
    return "";
  }

  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
}
