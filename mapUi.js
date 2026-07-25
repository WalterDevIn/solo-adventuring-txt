const locationName = document.querySelector("#locationName");
const objectiveLabel = document.querySelector("#objectiveLabel");
const battleSection = document.querySelector("#battleSection");
const mapLabel = document.querySelector("#mapLabel");
const mapView = document.querySelector("#mapView");
const mapCaption = document.querySelector("#mapCaption");

const stroke = "rgba(225,235,244,.72)";
const muted = "#8f9ba7";
const bright = "#f2f5f7";
const accent = "#dcecff";
const hostile = "#ffb9b9";

function pin(x, y, label, active = false) {
  return `<g transform="translate(${x} ${y})"><line x1="0" y1="0" x2="0" y2="11" stroke="${stroke}"/><circle cx="0" cy="0" r="4" fill="${active ? accent : "#050608"}" stroke="${active ? accent : stroke}"/><text x="7" y="3" fill="${active ? bright : muted}" font-size="8">${label}</text></g>`;
}

function renderSettlementMap(location) {
  const active = location.includes("Puerta") ? "gate" : "square";
  mapLabel.textContent = "ASENTAMIENTO";
  mapCaption.textContent = "Solo se muestran los lugares relevantes";
  mapView.innerHTML = `<svg viewBox="0 0 210 138" role="img" aria-label="Mapa de puntos de Mossfield">
    <rect x="1" y="1" width="208" height="136" fill="none" stroke="rgba(225,235,244,.35)"/>
    <path d="M24 107 L69 87 L111 94 L165 45 M69 87 L55 38" fill="none" stroke="${stroke}" stroke-width="1.5"/>
    ${pin(24,107,"Puerta",active === "gate")}${pin(69,87,"Plaza",active === "square")}${pin(55,38,"Enfermería")}${pin(111,94,"Posada")}${pin(165,45,"Camino oeste")}
  </svg>`;
}

function hexPoints(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30);
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
}

function renderTravelMap() {
  mapLabel.textContent = "VIAJE · 3 MILLAS / HEX";
  mapCaption.textContent = "Walter está a un hexágono al oeste de Mossfield";
  const hexes = [];
  const radius = 21;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const cx = 28 + col * 36 + (row % 2 ? 18 : 0);
      const cy = 28 + row * 32;
      const active = row === 1 && col === 1;
      const destination = row === 1 && col === 3;
      hexes.push(`<polygon points="${hexPoints(cx,cy,radius)}" fill="${active ? "rgba(220,236,255,.2)" : "rgba(255,255,255,.025)"}" stroke="${destination ? "#b8ffc9" : active ? accent : stroke}" stroke-width="1.2" ${destination ? 'stroke-dasharray="4 3"' : ""}/>`);
      if (active) hexes.push(`<text x="${cx}" y="${cy + 4}" fill="${bright}" font-size="11" text-anchor="middle">@</text>`);
      if (destination) hexes.push(`<text x="${cx}" y="${cy + 4}" fill="${bright}" font-size="10" text-anchor="middle">R</text>`);
    }
  }
  mapView.innerHTML = `<svg viewBox="0 0 180 120" role="img" aria-label="Mapa hexagonal de viaje">${hexes.join("")}<text x="8" y="114" fill="${muted}" font-size="8">Mossfield ← · Ruina R</text></svg>`;
}

function renderCombatMap(objective) {
  const defeated = objective.includes("Registrar") || objective.includes("Regresar");
  mapLabel.textContent = "POSICIÓN · 5 PIES / CASILLA";
  mapCaption.textContent = defeated ? "Patio asegurado" : "Walter y la Baba están adyacentes";
  const cells = [];
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 6; col += 1) cells.push(`<rect x="${col * 24}" y="${row * 24}" width="24" height="24" fill="rgba(255,255,255,.02)" stroke="rgba(225,235,244,.38)"/>`);
  }
  mapView.innerHTML = `<svg viewBox="0 0 144 144" role="img" aria-label="Cuadrícula de combate con Walter y la Baba verde">${cells.join("")}
    <rect x="96" y="0" width="48" height="24" fill="rgba(225,235,244,.18)" stroke="${stroke}"/><rect x="0" y="120" width="48" height="24" fill="rgba(225,235,244,.18)" stroke="${stroke}"/>
    <g transform="translate(60 84)"><circle r="9" fill="${accent}"/><text y="3" fill="#050608" font-size="8" font-weight="bold" text-anchor="middle">W</text></g>
    ${defeated ? "" : `<g transform="translate(84 84)"><circle r="10" fill="${hostile}"/><text y="3" fill="#050608" font-size="8" font-weight="bold" text-anchor="middle">B</text></g>`}
  </svg>`;
}

function renderMap() {
  if (!locationName || !mapView || !mapLabel || !mapCaption) return;
  const location = locationName.textContent || "";
  const objective = objectiveLabel?.textContent || "";
  const inBattle = battleSection && !battleSection.hidden;
  if (inBattle || location.includes("Ruina occidental")) return renderCombatMap(objective);
  if (location.includes("Camino") || location.includes("Tierras bajas")) return renderTravelMap();
  renderSettlementMap(location);
}

window.renderContextMap = renderMap;
window.addEventListener("DOMContentLoaded", renderMap);
window.addEventListener("load", renderMap);
window.setInterval(renderMap, 120);