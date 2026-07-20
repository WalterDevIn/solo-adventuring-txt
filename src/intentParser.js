const DESTINATION_PATTERNS = [
  {
    destination: "DUNGEON",
    patterns: [
      /\b(?:go|travel|walk|head|move|return|venture)\s+(?:to|toward|towards|into|back\s+to)\s+(?:the\s+)?dungeon\b/,
      /\b(?:enter|explore|visit)\s+(?:the\s+)?dungeon\b/,
      /\b(?:go|head|move|return)\s+(?:down|underground|below)\b/,
      /\b(?:dungeon|underground)\b/,
    ],
  },
  {
    destination: "CITY",
    patterns: [
      /\b(?:go|travel|walk|head|move|return)\s+(?:to|toward|towards|into|back\s+to)\s+(?:the\s+)?(?:city|town)\b/,
      /\b(?:enter|visit)\s+(?:the\s+)?(?:city|town)\b/,
      /\b(?:go|head|move|return)\s+(?:back\s+)?(?:home|outside|surface|above)\b/,
      /\b(?:city|town|surface)\b/,
    ],
  },
];

function normalizeCommand(command) {
  return command
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function parseIntent(command) {
  const normalizedCommand = normalizeCommand(command);

  if (!normalizedCommand) {
    return {
      type: "INVALID",
      reason: "EMPTY_COMMAND",
      raw: command,
    };
  }

  for (const destinationRule of DESTINATION_PATTERNS) {
    if (destinationRule.patterns.some((pattern) => pattern.test(normalizedCommand))) {
      return {
        type: "TRAVEL",
        destination: destinationRule.destination,
        raw: command,
        normalized: normalizedCommand,
      };
    }
  }

  return {
    type: "UNKNOWN",
    raw: command,
    normalized: normalizedCommand,
  };
}
