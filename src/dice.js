const DIE_COMMAND_PATTERN = /^(?:roll|throw)?\s*(?:1)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i;

const MIN_SIDES = 2;
const MAX_SIDES = 10000;
const MAX_MODIFIER = 100000;

export function parseDiceCommand(command) {
  const match = command.trim().match(DIE_COMMAND_PATTERN);

  if (!match) {
    return null;
  }

  const sides = Number.parseInt(match[1], 10);
  const magnitude = match[3] ? Number.parseInt(match[3], 10) : 0;
  const modifier = match[2] === "-" ? -magnitude : magnitude;

  if (!Number.isSafeInteger(sides) || sides < MIN_SIDES || sides > MAX_SIDES) {
    return {
      ok: false,
      error: `The die must have between ${MIN_SIDES} and ${MAX_SIDES} sides.`,
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
    sides,
    modifier,
  };
}

export function rollDie(sides, modifier = 0, random = Math.random) {
  if (!Number.isSafeInteger(sides) || sides < MIN_SIDES || sides > MAX_SIDES) {
    throw new RangeError(`Invalid die sides: ${sides}`);
  }

  if (!Number.isSafeInteger(modifier) || Math.abs(modifier) > MAX_MODIFIER) {
    throw new RangeError(`Invalid die modifier: ${modifier}`);
  }

  const raw = Math.floor(random() * sides) + 1;

  return {
    type: "DIE_ROLLED",
    sides,
    modifier,
    raw,
    total: raw + modifier,
    expression: `d${sides}${formatModifier(modifier)}`,
  };
}

export function formatModifier(modifier) {
  if (modifier === 0) {
    return "";
  }

  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
}
