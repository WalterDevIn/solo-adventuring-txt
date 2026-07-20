const NPC_PATTERNS = [
  {
    npc: "GUIDE",
    patterns: [
      /\b(?:visit|see|meet|find|talk\s+to|speak\s+to|go\s+to|go\s+see)\s+(?:the\s+)?guide\b/,
      /\b(?:guide)\b/,
    ],
  },
  {
    npc: "NURSE",
    patterns: [
      /\b(?:visit|see|meet|find|talk\s+to|speak\s+to|go\s+to|go\s+see)\s+(?:the\s+)?nurse\b/,
      /\b(?:nurse|healer)\b/,
    ],
  },
  {
    npc: "ZOOLOGIST",
    patterns: [
      /\b(?:visit|see|meet|find|talk\s+to|speak\s+to|go\s+to|go\s+see)\s+(?:the\s+)?zoologist\b/,
      /\b(?:zoologist)\b/,
    ],
  },
];

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

  for (const npcRule of NPC_PATTERNS) {
    if (npcRule.patterns.some((pattern) => pattern.test(normalizedCommand))) {
      return {
        type: "VISIT_NPC",
        npc: npcRule.npc,
        raw: command,
        normalized: normalizedCommand,
      };
    }
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
