// Génère les illustrations florales du site (SVG) aux couleurs de la palette du mariage.
// Usage : cd tools && npm run flowers
import { writeFileSync } from "node:fs";

const OUT = (name) => new URL(`../assets/img/${name}`, import.meta.url);
const r = (n) => Math.round(n * 100) / 100;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const jitter = (a) => (rand() - 0.5) * 2 * a;

const grad = (id, from, to, x2 = 0, y2 = 0) =>
  `<linearGradient id="${id}" x1="0" y1="1" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;

// Pétale « pivoine » : pointe légèrement froissée
const ruffled = (w, h) =>
  `M0 0C${r(-w)} ${r(-h * 0.28)} ${r(-w * 1.05)} ${r(-h * 0.86)} ${r(-w * 0.42)} ${r(-h)}Q${r(-w * 0.2)} ${r(-h * 0.92)} 0 ${r(-h * 0.97)}Q${r(w * 0.2)} ${r(-h * 0.92)} ${r(w * 0.42)} ${r(-h)}C${r(w * 1.05)} ${r(-h * 0.86)} ${r(w)} ${r(-h * 0.28)} 0 0Z`;
// Pétale « rose » : arrondi
const round = (w, h) =>
  `M0 0C${r(-w * 1.1)} ${r(-h * 0.35)} ${r(-w * 0.9)} ${r(-h)} 0 ${r(-h)}C${r(w * 0.9)} ${r(-h)} ${r(w * 1.1)} ${r(-h * 0.35)} 0 0Z`;

function ring({ n, w, h, fill, offset = 0, shape = ruffled, stroke = "#8E0E42", jitterRot = 7 }) {
  let g = "";
  for (let i = 0; i < n; i++) {
    const rot = (360 / n) * i + offset + jitter(jitterRot);
    const s = 0.9 + rand() * 0.18;
    g += `<path d="${shape(w * s, h * s)}" transform="rotate(${r(rot)})" fill="url(#${fill})" stroke="${stroke}" stroke-opacity=".2" stroke-width=".8"/>`;
  }
  return g;
}

function stamens(count, radius, colors) {
  let g = "";
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * radius;
    g += `<circle cx="${r(Math.cos(a) * d)}" cy="${r(Math.sin(a) * d)}" r="${r(1.3 + rand() * 1.6)}" fill="${colors[i % colors.length]}"/>`;
  }
  return g;
}

/* --------------------------------------------------------------- Pivoine */
function peony(prefix = "pv") {
  const defs =
    grad(`${prefix}1`, "#A3144D", "#F06292") +
    grad(`${prefix}2`, "#C2185B", "#F48FB1") +
    grad(`${prefix}3`, "#D81B60", "#F8BBD0") +
    grad(`${prefix}4`, "#E91E63", "#FFD9C7") +
    grad(`${prefix}5`, "#F06292", "#FFE6DA");
  const body =
    ring({ n: 9, w: 40, h: 92, fill: `${prefix}1` }) +
    ring({ n: 8, w: 34, h: 74, fill: `${prefix}2`, offset: 20 }) +
    ring({ n: 7, w: 28, h: 56, fill: `${prefix}3`, offset: 8 }) +
    ring({ n: 6, w: 20, h: 38, fill: `${prefix}4`, offset: 30 }) +
    ring({ n: 5, w: 13, h: 22, fill: `${prefix}5`, offset: 12 }) +
    stamens(22, 9, ["#FFB085", "#F4A261", "#FFD9C7"]);
  return { defs, body };
}

/* ------------------------------------------------------------ Rose pêche */
function rose(prefix = "rs") {
  const defs =
    grad(`${prefix}1`, "#E0754C", "#FFCDB3") +
    grad(`${prefix}2`, "#EE8A5E", "#FFDCC8") +
    grad(`${prefix}3`, "#F27F52", "#FFC4A6") +
    grad(`${prefix}4`, "#DA6A42", "#FFAF8A");
  let spiral = "";
  for (let i = 0; i < 4; i++) {
    const rad = 5 + i * 3.4;
    spiral += `<path d="M${r(-rad)} 0A${rad} ${r(rad * 0.9)} 0 0 1 ${r(rad * 0.8)} ${r(-rad * 0.5)}" transform="rotate(${i * 95})" fill="none" stroke="#D9714A" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>`;
  }
  const body =
    ring({ n: 7, w: 44, h: 86, fill: `${prefix}1`, shape: round, stroke: "#B8522B" }) +
    ring({ n: 6, w: 36, h: 66, fill: `${prefix}2`, offset: 25, shape: round, stroke: "#B8522B" }) +
    ring({ n: 5, w: 28, h: 46, fill: `${prefix}3`, offset: 10, shape: round, stroke: "#B8522B" }) +
    ring({ n: 4, w: 18, h: 28, fill: `${prefix}4`, offset: 40, shape: round, stroke: "#B8522B" }) +
    `<circle r="9" fill="#F28C63" opacity=".55"/>` +
    spiral;
  return { defs, body };
}

/* --------------------------------------------------------------- Feuilles */
const leafPath = (l, w) => `M0 0C${r(l * 0.3)} ${r(-w)} ${r(l * 0.72)} ${r(-w)} ${l} 0C${r(l * 0.72)} ${r(w)} ${r(l * 0.3)} ${r(w)} 0 0Z`;
function leaf(x, y, angle, l, w, fill) {
  return `<g transform="translate(${r(x)} ${r(y)}) rotate(${r(angle)})"><path d="${leafPath(l, w)}" fill="url(#${fill})"/><path d="M2 0Q${r(l * 0.5)} ${r(-w * 0.12)} ${r(l * 0.92)} 0" fill="none" stroke="#FFF9F2" stroke-opacity=".45" stroke-width="1"/></g>`;
}

// Branche : tige courbe (bézier quadratique) + feuilles alternées
function sprig({ x0, y0, cx, cy, x1, y1, leaves = 7, size = 1, fills = ["lf1", "lf2"], stroke = "#6B7F5E" }) {
  let g = `<path d="M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}" fill="none" stroke="${stroke}" stroke-width="${r(2.2 * size)}" stroke-linecap="round"/>`;
  for (let i = 1; i <= leaves; i++) {
    const t = i / (leaves + 0.6);
    const px = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1;
    const py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y1;
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    const dir = (Math.atan2(dy, dx) * 180) / Math.PI;
    const side = i % 2 ? -1 : 1;
    const len = (34 - t * 12) * size * (0.85 + rand() * 0.3);
    g += leaf(px, py, dir + side * (42 + jitter(8)), len, len * 0.36, fills[i % fills.length]);
  }
  g += leaf(x1, y1, (Math.atan2(y1 - cy, x1 - cx) * 180) / Math.PI, 24 * size, 8.5 * size, fills[0]);
  return g;
}
const LEAF_DEFS =
  `<linearGradient id="lf1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6B7F5E"/><stop offset="1" stop-color="#A8BFA6"/></linearGradient>` +
  `<linearGradient id="lf2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#58704D"/><stop offset="1" stop-color="#8FA886"/></linearGradient>`;

const svg = (vb, defs, body, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${extra}><defs>${defs}</defs>${body}</svg>\n`;

// Fleurs seules
{
  const p = peony();
  writeFileSync(OUT("fleur-pivoine.svg"), svg("-100 -100 200 200", p.defs, p.body));
  const s = rose();
  writeFileSync(OUT("fleur-rose.svg"), svg("-100 -100 200 200", s.defs, s.body));
}

// Feuillage (branche seule)
writeFileSync(
  OUT("feuillage.svg"),
  svg("0 0 260 200", LEAF_DEFS, sprig({ x0: 20, y0: 190, cx: 60, cy: 40, x1: 240, y1: 20, leaves: 9, size: 1.25 })),
);

// Bouquet d'angle : feuillage + pivoine + rose + boutons
{
  const p = peony("bp");
  const s = rose("br");
  const bud = (x, y, rot, sc, color) =>
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"><path d="M0 0C-9-6-10-20 0-30C10-20 9-6 0 0Z" fill="${color}"/><path d="M0 0C-6-4-12-10-13-18C-5-14-2-8 0 0ZM0 0C6-4 12-10 13-18C5-14 2-8 0 0Z" fill="#6B7F5E"/></g>`;
  const body =
    sprig({ x0: 210, y0: 230, cx: 150, cy: 120, x1: 30, y1: 60, leaves: 8, size: 1.3 }) +
    sprig({ x0: 210, y0: 230, cx: 300, cy: 150, x1: 380, y1: 40, leaves: 7, size: 1.15, fills: ["lf2", "lf1"] }) +
    sprig({ x0: 200, y0: 240, cx: 120, cy: 260, x1: 20, y1: 300, leaves: 6, size: 1.05 }) +
    bud(335, 105, 30, 1.2, "#F06292") +
    bud(95, 115, -40, 1.05, "#FFB085") +
    bud(60, 250, -100, 1, "#E91E63") +
    `<g transform="translate(285 205) scale(.85) rotate(18)">${s.body}</g>` +
    `<g transform="translate(180 200) scale(.95)">${p.body}</g>`;
  writeFileSync(OUT("bouquet.svg"), svg("0 0 400 340", LEAF_DEFS + p.defs + s.defs, body));
}

// Ornement de titre (branches symétriques + petite pivoine)
{
  const p = peony("op");
  const left = sprig({ x0: 118, y0: 24, cx: 70, cy: 34, x1: 6, y1: 22, leaves: 6, size: 0.55 });
  const right = `<g transform="translate(260 0) scale(-1 1)">${sprig({ x0: 118, y0: 24, cx: 70, cy: 34, x1: 6, y1: 22, leaves: 6, size: 0.55 })}</g>`;
  const body = left + right + `<g transform="translate(130 24) scale(.2)">${p.body}</g>`;
  writeFileSync(OUT("ornement.svg"), svg("0 0 260 48", LEAF_DEFS + p.defs, body));
}

console.log("Fleurs générées : fleur-pivoine, fleur-rose, feuillage, bouquet, ornement");
