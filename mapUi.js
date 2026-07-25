const locationName = document.querySelector("#locationName");
const objectiveLabel = document.querySelector("#objectiveLabel");
const battleSection = document.querySelector("#battleSection");
const mapLabel = document.querySelector("#mapLabel");
const mapView = document.querySelector("#mapView");
const mapCaption = document.querySelector("#mapCaption");

function pin(x, y, label, active = false) {
  return `
    <g class="map-pin${active ? " is-active" : "}" transform="translate(${x} ${y})">
      <line x1="0" y1="0" x2="0" y2="11"></line>
      <circle cx="0" cy="0" r="3.5"></circle>
      <text x="7" y="3">${label}</text>
    </g>
  `;
}

function renderSettlementMap(location) {
  const active = location.includes("Gate") ? "gate" : "square";
  mapLabel.textContent = "SETTLEMENT";
  mapCaption.textContent = "Relevant places only";
  mapView.innerHTML = `
    <svg viewBox="0 0 210 138" role="img" aria-label="Point map of Mossfield">
      <rect class="map-frame" x="1" y="1" width="208" height="136"></rect>
      <path class="map-path" d="M24 107 L69 87 L111 94 L165 45"></path>
      <path class="map-path" d="M69 87 L55 38"></path>
      ${pin(24, 107, "Gate", active === "gate")}
      ${pin(69, 87, "Square", active === "square")}
      ${pin(55, 38, "Infirmary")}
      ${pin(111, 94, "Inn")}
      ${pin(165, 45, "West road")}
    </svg>
  `;
}

function hexPoints(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
}

function renderTravelMap(location) {
  mapLabel.textContent = "TRAVEL · 3 MI / HEX";
  mapCaption.textContent = location.includes("Western Road") ? "Walter is one hex west of Mossfield" : "Lowlands route";
  const hexes = [];
  const radius = 21;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const cx = 28 + col * 36 + (row % 2 ? 18 : 0);
      const cy = 28 + row * 32;
      const active = row === 1 && col === 1;
      const destination = row === 1 && col === 3;
      hexes.push(`<polygon class="hex${active ? " is-active" : "}${destination ? " is-destination" : "}" points="${hexPoints(cx, cy, radius)}"></polygon>`);
      if (active) hexes.push(`<text class="map-symbol" x="${cx}" y="${cy + 3}">@</text>`);
      if (destination) hexes.push(`<text class="map-symbol" x="${cx}" y="${cy + 3}">R</text>`);
    }
  }
  mapView.innerHTML = `
    <svg viewBox="0 0 180 120" role="img" aria-label="Hex travel map with three-mile hexes">
      ${hexes.join("")}
      <text class="map-note" x="8" y="114">Mossfield ←  ·  Ruin R</text>
    </svg>
  `;
}

function renderCombatMap(location, objective) {
  const defeated = objective.includes("Search") || objective.includes("Return");
  mapLabel.textContent = "POSITION · 5 FT / CELL";
  mapCaption.textContent = defeated ? "Courtyard secured" : "Walter and the slime are adjacent";
  const cells = [];
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      cells.push(`<rect class="grid-cell" x="${col * 24}" y="${row * 24}" width="24" height="24"></rect>`);
    }
  }
  mapView.innerHTML = `
    <svg viewBox="0 0 144 144" role="img" aria-label="Combat grid with Walter and Green Slime">
      ${cells.join("")}
      <rect class="grid-obstacle" x="96" y="0" width="48" height="24"></rect>
      <rect class="grid-obstacle" x="0" y="120" width="48" height="24"></rect>
      <g class="combat-token is-player" transform="translate(60 84)">
        <circle r="8"></circle><text y="3">W</text>
      </g>
      ${defeated ? "" : `<g class="combat-token is-enemy" transform="translate(84 84)"><circle r="9"></circle><text y="3">S</text></g>`}
    </svg>
  `;
}

function renderMap() {
  if (!locationName || !mapView) return;
  const location = locationName.textContent || "";
  const objective = objectiveLabel?.textContent || "";
  const inBattle = battleSection && !battleSection.hidden;

  if (inBattle || location.includes("Western Ruin")) {
    renderCombatMap(location, objective);
    return;
  }
  if (location.includes("Road") || location.includes("Lowlands")) {
    renderTravelMap(location);
    return;
  }
  renderSettlementMap(location);
}

const observer = new MutationObserver(renderMap);
if (locationName) observer.observe(locationName, { childList: true, characterData: true, subtree: true });
if (objectiveLabel) observer.observe(objectiveLabel, { childList: true, characterData: true, subtree: true });
if (battleSection) observer.observe(battleSection, { attributes: true, attributeFilter: ["hidden"] });
window.addEventListener("load", renderMap);
