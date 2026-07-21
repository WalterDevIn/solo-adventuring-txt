const TOKEN_GROUPS = [
  {
    className: "token-verb",
    words: new Set([
      "go",
      "travel",
      "walk",
      "head",
      "move",
      "return",
      "venture",
      "enter",
      "explore",
      "visit",
      "talk",
      "speak",
      "find",
    ]),
  },
  {
    className: "token-npc",
    words: new Set(["guide", "nurse", "zoologist", "healer"]),
  },
  {
    className: "token-place",
    words: new Set([
      "city",
      "town",
      "dungeon",
      "underground",
      "surface",
      "home",
      "clinic",
    ]),
  },
];

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTokenClass(word) {
  const normalizedWord = word.toLowerCase();
  return TOKEN_GROUPS.find((group) => group.words.has(normalizedWord))?.className;
}

export function highlightText(text) {
  const escapedText = escapeHtml(text);

  return escapedText.replace(/\b[a-zA-Z]+\b/g, (word) => {
    const tokenClass = getTokenClass(word);
    return tokenClass ? `<span class="${tokenClass}">${word}</span>` : word;
  });
}
