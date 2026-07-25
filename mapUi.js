const locationName = document.querySelector("#locationName");
const objectiveLabel = document.querySelector("#objectiveLabel");
const battleSection = document.querySelector("#battleSection");
const mapLabel = document.querySelector("#mapLabel");
const mapView = document.querySelector("#mapView");
const mapCaption = document.querySelector("#mapCaption");

const COLORS = {
  line: "#77828d",
  faint: "#38414a",
  text: "#dcecff",
  muted: "#9aa6b2",
  player: "#dcecff",
  enemy: "#ffb9b9",
  destination: "#b8ffc9",
  background: "#080b0f",
};

function pin(x, y, label, active = false) {
  const fill = active ? COLORS.player : COLORS.background;
  const stroke = active ? COLORS.player : COLORS.line;
  const text = active ? COLORS.text : COLORS.muted;
  return `
    <g transform="translate(${x} ${y})">
      <line x1="0" y1="0" x2="0" y2="12" stroke="${stroke}" stroke-width="1.5"></line>
      <circle cx="0" cy="0" r="4" fill="${fill}" stroke="${stroke}" stroke-width="1.5"></circle>
      <text x="7" y="3" fill="${text}" font-size="7">${label}</text>
    </g>
  `;
}

function setMapMarkup(markup) {
  if (!mapView) return;
  mapView.innerHTML = markup;
  mapView.dataset.rendered = "true";
}

function renderSettlementMap(location) {
  const active = location.includes("Gate") ? "gate" : "square";
  mapLabel.textContent = "SETTLEMENT";
  mapCaption.textContent = "Relevant places only";
  setMapMarkup(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 138" width="100%" height="100%" role="img" aria-label="Point map of Mossfield">
      <rect x="1" y="1" width="208" height="136" fill="${COLORS.background}" stroke="${COLORS.faint}" stroke-width="2"></rect>
      <path d="M24 107 L69 87 L111 94 L165 45" fill="none" stroke="${COLORS.line}" stroke-width="1.5"></path>
      <path d="M69 87 L55 38" fill="none" stroke="${COLORS.line}" stroke-width="1.5"></path>
      ${pin(24, 107, "Gate", active === "gate")}
      ${pin(69, 87, "Square", active === "square")}
      ${pin(55, 38, "Infirmary")}
      ${pin(111, 94, "Inn")}
      ${pin(165, 45, "West road")}
    </svg>
  `);
}

function hexPoints(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
}

function renderTravelMap(location) {
  mapLabel.textContent = "TRAVEL · 3 MI / HEX";
  mapCaption.textContent = location.includes("Western Road")
    ? "Walter is one hex west of Mossfield"
    : "Lowlands route";

  const hexes = [];
  const radius = 21;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const cx = 28 + col * 36 + (row % 2 ? 18 : 0);
      const cy = 28 + row * 32;
      const active = row === 1 && col === 1;
      const destination = row === 1 && col === 3;
      const stroke = destination ? COLORS.destination : active ? COLORS.player : COLORS.line;
      const fill = active ? "#1b2630" : COLORS.background;
      const dash = destination ? 'stroke-dasharray="4 3"' : "";
      hexes.push(`<polygon points="${hexPoints(cx, cy, radius)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${dash}></polygon>`);
      if (active) hexes.push(`<text x="${cx}" y="${cy + 3}" fill="${COLORS.text}" font-size="10" text-anchor="middle">@</text>`);
      if (destination) hexes.push(`<text x="${cx}" y="${cy + 3}" fill="${COLORS.destination}" font-size="10" text-anchor="middle">R</text>`);
    }
  }

  setMapMarkup(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 120" width="100%" height="100%" role="img" aria-label="Hex travel map with three-mile hexes">
      <rect width="180" height="120" fill="${COLORS.background}"></rect>
      ${hexes.join("")}
      <text x="8" y="114" fill="${COLORS.muted}" font-size="7">Mossfield ←  ·  Ruin R</text>
    </svg>
  `);
}

function renderCombatMap(objective) {
  const defeated = objective.includes("Search") || objective.includes("Return");
  mapLabel.textContent = "POSITION · 5 FT / CELL";
  mapCaption.textContent = defeated ? "Courtyard secured" : "Walter and the slime are adjacent";

  const cells = [];
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      cells.push(`<rect x="${col * 24}" y="${row * 24}" width="24" height="24" fill="${COLORS.background}" stroke="${COLORS.faint}" stroke-width="1"></rect>`);
    }
  }

  setMapMarkup(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144" width="100%" height="100%" role="img" aria-label="Combat grid with Walter and Green Slime">
      ${cells.join("")}
      <rect x="96" y="0" width="48" height="24" fill="#26303a" stroke="${COLORS.line}"></rect>
      <rect x="0" y="120" width="48" height="24" fill="#26303a" stroke="${COLORS.line}"></rect>
      <g transform="translate(60 84)">
        <circle r="9" fill="${COLORS.player}" stroke="#ffffff" stroke-width="1.5"></circle>
        <text y="3" fill="#050608" font-size="8" font-weight="bold" text-anchor="middle">W</text>
      </g>
      ${defeated ? "" : `<g transform="translate(84 84)"><circle r="10" fill="${COLORS.enemy}" stroke="#ffffff" stroke-width="1.5"></circle><text y="3" fill="#050608" font-size="8" font-weight="bold" text-anchor="middle">S</text></g>`}
    </svg>
  `);
}

export function renderContextMap({ location, objective, inBattle }) {
  if (!mapView || !mapLabel || !mapCaption) return;
  if (inBattle || location.includes("Western Ruin")) renderCombatMap(objective);
  else if (location.includes("Road") || location.includes("Lowlands")) renderTravelMap(location);
  else renderSettlementMap(location);
}

let lastSignature = "";
function renderFromDom() {
  const context = {
    location: locationName?.textContent || "Mossfield",
    objective: objectiveLabel?.textContent || "",
    inBattle: Boolean(battleSection && !battleSection.hidden),
  };
  const signature = JSON.stringify(context);
  if (signature === lastSignature && mapView?.dataset.rendered === "true") return;
  lastSignature = signature;
  renderContextMap(context);
}

renderFromDom();
document.addEventListener("DOMContentLoaded", renderFromDom);
window.addEventListener("load", renderFromDom);
window.setInterval(renderFromDom, 120);
