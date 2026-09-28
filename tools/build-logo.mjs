// Monogramme C & R dessiné à partir des contours réels des lettres (Pinyon Script, Cormorant Garamond).
// Produit les variantes du logo (SVG) ; le résultat choisi est injecté dans le site par build-pages.mjs.
// Usage : cd tools && npm run logo
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import opentype from "opentype.js";

const font = (name) => {
  const buf = readFileSync(new URL(`./node_modules/@fontsource/${name}`, import.meta.url));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
export const PINYON = font("pinyon-script/files/pinyon-script-latin-400-normal.woff");
export const CORMORANT = font("cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff");
export const CORMORANT_I = font("cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff");

const r2 = (n) => Math.round(n * 100) / 100;

// Sérialisation maison des contours (toPathData d’opentype.js produit parfois des NaN à petite taille)
export function pathData(path) {
  let d = "";
  for (const c of path.commands) {
    if (c.type === "M" || c.type === "L") d += `${c.type}${r2(c.x)} ${r2(c.y)}`;
    else if (c.type === "Q") d += `Q${r2(c.x1)} ${r2(c.y1)} ${r2(c.x)} ${r2(c.y)}`;
    else if (c.type === "C") d += `C${r2(c.x1)} ${r2(c.y1)} ${r2(c.x2)} ${r2(c.y2)} ${r2(c.x)} ${r2(c.y)}`;
    else if (c.type === "Z") d += "Z";
  }
  return d;
}

// Chasse d’un glyphe (certaines polices sous-ensemble omettent celle de l’espace)
const adv = (f, g) => (Number.isFinite(g.advanceWidth) ? g.advanceWidth : f.unitsPerEm * 0.26);

// Chemin d’une chaîne, avec interlettrage, centré horizontalement sur cx
export function textPath(f, str, cx, baseline, size, tracking = 0) {
  str = str.normalize("NFC");
  let w = 0;
  const glyphs = f.stringToGlyphs(str);
  glyphs.forEach((g, i) => { w += adv(f, g) * (size / f.unitsPerEm) + (i < glyphs.length - 1 ? tracking : 0); });
  let x = cx - w / 2;
  let d = "";
  glyphs.forEach((g) => {
    d += pathData(g.getPath(x, baseline, size));
    x += adv(f, g) * (size / f.unitsPerEm) + tracking;
  });
  return { d, w };
}

// Boîte englobante d’une lettre
export function glyph(f, ch, x, y, size) {
  const p = f.getPath(ch, x, y, size);
  const bb = p.getBoundingBox();
  return { d: pathData(p), bb };
}

/**
 * Entrelacs C & R : chaque lettre est « coupée » là où l’autre passe dessus.
 * Au-dessus de splitY la lettre C passe devant, en dessous c’est R (effet tressé).
 * Les coupures sont faites par masques : le rendu reste correct sur n’importe quel fond.
 */
export function monogram({ id, size = 150, gap = 3.2, dx = 0.46, splitY = null, fill = "currentColor" }) {
  const c = glyph(PINYON, "C", 0, size, size);
  const cw = c.bb.x2 - c.bb.x1;
  const r = glyph(PINYON, "R", c.bb.x1 + cw * dx, size, size);
  const x1 = Math.min(c.bb.x1, r.bb.x1), x2 = Math.max(c.bb.x2, r.bb.x2);
  const y1 = Math.min(c.bb.y1, r.bb.y1), y2 = Math.max(c.bb.y2, r.bb.y2);
  const sy = splitY ?? (y1 + y2) / 2;
  const big = `x="${r2(x1 - 20)}" y="${r2(y1 - 20)}" width="${r2(x2 - x1 + 40)}" height="${r2(y2 - y1 + 40)}"`;
  const svg = `
  <defs>
    <clipPath id="${id}-top"><rect x="${r2(x1 - 20)}" y="${r2(y1 - 20)}" width="${r2(x2 - x1 + 40)}" height="${r2(sy - y1 + 20)}"/></clipPath>
    <clipPath id="${id}-bot"><rect x="${r2(x1 - 20)}" y="${r2(sy)}" width="${r2(x2 - x1 + 40)}" height="${r2(y2 - sy + 20)}"/></clipPath>
    <mask id="${id}-mc" maskUnits="userSpaceOnUse" ${big}><rect ${big} fill="#fff"/><g clip-path="url(#${id}-bot)"><path d="${r.d}" fill="#000" stroke="#000" stroke-width="${gap * 2}" stroke-linejoin="round"/></g></mask>
    <mask id="${id}-mr" maskUnits="userSpaceOnUse" ${big}><rect ${big} fill="#fff"/><g clip-path="url(#${id}-top)"><path d="${c.d}" fill="#000" stroke="#000" stroke-width="${gap * 2}" stroke-linejoin="round"/></g></mask>
  </defs>
  <path class="mono-c" d="${c.d}" mask="url(#${id}-mc)" fill="${fill}" stroke="${fill}" style="stroke-width: var(--mono-ink-sw, 0)"/>
  <path class="mono-r" d="${r.d}" mask="url(#${id}-mr)" fill="${fill}" stroke="${fill}" style="stroke-width: var(--mono-ink-sw, 0)"/>`;
  return { svg, bb: { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 }, c, r };
}

/* ------------------------------------------------------------ Botanique */
let seed = 23;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const leafD = (l, w) => `M0 0C${r2(l * 0.3)} ${r2(-w)} ${r2(l * 0.72)} ${r2(-w)} ${r2(l)} 0C${r2(l * 0.72)} ${r2(w)} ${r2(l * 0.3)} ${r2(w)} 0 0Z`;
export const leaf = (x, y, a, l, w, fill) => `<path d="${leafD(l, w)}" transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(a)})" fill="${fill}"></path>`;
const petal = (w, h) => `M0 0C${r2(-w)} ${r2(-h * 0.28)} ${r2(-w * 1.05)} ${r2(-h * 0.86)} ${r2(-w * 0.42)} ${r2(-h)}Q0 ${r2(-h * 0.95)} ${r2(w * 0.42)} ${r2(-h)}C${r2(w * 1.05)} ${r2(-h * 0.86)} ${r2(w)} ${r2(-h * 0.28)} 0 0Z`;
// Petite fleur (pivoine stylisée) centrée en (0,0), rayon ~ size
export function bloom(id, size, palette = ["#A3144D", "#E91E63", "#F48FB1", "#FFD9C7"]) {
  const rings = [[8, 0.42, 1], [7, 0.36, 0.78], [6, 0.3, 0.56], [5, 0.22, 0.34]];
  let defs = "", g = "";
  rings.forEach(([n, wr, hr], k) => {
    defs += `<linearGradient id="${id}-g${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${palette[Math.min(k, 2)]}"></stop><stop offset="1" stop-color="${palette[Math.min(k + 1, 3)]}"></stop></linearGradient>`;
    for (let i = 0; i < n; i++) g += `<path d="${petal(size * wr, size * hr)}" transform="rotate(${r2((360 / n) * i + k * 17 + (rand() - 0.5) * 10)})" fill="url(#${id}-g${k})"></path>`;
  });
  g += `<circle r="${r2(size * 0.1)}" fill="#FFB085"></circle>`;
  return { defs, g };
}
const LEAF_GRAD = (id) => `<linearGradient id="${id}-lf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#58704D"></stop><stop offset="1" stop-color="#A8BFA6"></stop></linearGradient>`;

/* ------------------------------------------------------------ Pistes */
// Place le monogramme pour qu’il tienne dans une largeur donnée, centré en (cx, cy)
function placeMono(id, cx, cy, width, fill) {
  const m = monogram({ id, dx: 0.4, fill });
  const k = width / m.bb.w;
  const tx = cx - (m.bb.x1 + m.bb.w / 2) * k;
  const ty = cy - (m.bb.y1 + m.bb.h / 2) * k;
  return `<g transform="translate(${r2(tx)} ${r2(ty)}) scale(${r2(k * 1000) / 1000})">${m.svg}</g>`;
}

// A · L’Arche
export function arche({ id = "la", date = true, ink = "currentColor", accent = "#C2185B", sub = "#4E5E43" } = {}) {
  const f = bloom(`${id}-b`, 17);
  // Guirlande : feuillage le long de l’arc, de la clé de voûte vers chaque côté
  let deco = "";
  const R = 90, cx = 120, cy = 125;
  for (const side of [-1, 1]) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = 270 + side * (12 + i * 10.5);          // 270° = sommet de l’arche
      const rad = (a * Math.PI) / 180;
      const out = i % 2 ? 1 : -1;
      const x = cx + Math.cos(rad) * (R + out * 1.5), y = cy + Math.sin(rad) * (R + out * 1.5);
      const tangent = a + side * 90;
      deco += leaf(x, y, tangent + out * side * 46, 15 - i * 1.1, 5.2 - i * 0.35, `url(#${id}-lf)`);
      if (i === 3 || i === 6) {
        const bx = cx + Math.cos(rad) * (R - out * 8), by = cy + Math.sin(rad) * (R - out * 8);
        deco += `<circle cx="${r2(bx)}" cy="${r2(by)}" r="2.4" fill="${i === 3 ? "#F06292" : "#FFB085"}"></circle>`;
      }
    }
  }
  const d = date ? textPath(CORMORANT, "03 · 07 · 2027", 120, 266, 14, 2.6).d : "";
  return {
    viewBox: "0 0 240 300",
    svg: `<defs>${LEAF_GRAD(id)}${f.defs}</defs>
  <path d="M30 290V125a90 90 0 0 1 180 0v165Z" fill="none" stroke="${accent}" stroke-width="1.8"></path>
  <path d="M39 281V125a81 81 0 0 1 162 0v156Z" fill="none" stroke="${accent}" stroke-width=".8" opacity=".55"></path>
  ${deco}
  <g transform="translate(120 35)">${f.g}</g>
  ${placeMono(`${id}-m`, 120, date ? 172 : 182, date ? 152 : 166, ink)}
  ${d ? `<path d="${d}" fill="${sub}"></path>` : ""}`,
  };
}

// B · La Couronne
export function couronne({ id = "lc", ink = "currentColor", sub = "#4E5E43" } = {}) {
  const p = bloom(`${id}-p`, 25), q = bloom(`${id}-q`, 17, ["#E0754C", "#F29468", "#FFC4A6", "#FFE3D4"]);
  const R = 114, C = 150;
  const pt = (deg, rr = R) => [C + Math.cos((deg * Math.PI) / 180) * rr, C + Math.sin((deg * Math.PI) / 180) * rr];
  let stems = "", leaves = "", berries = "";
  for (const side of [-1, 1]) {
    // branche : du bas (90°) vers le haut, en laissant une ouverture au sommet
    const a0 = 90 + side * 6, a1 = 90 + side * 158;
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    stems += `<path d="M${r2(x0)} ${r2(y0)}A${R} ${R} 0 0 ${side > 0 ? 1 : 0} ${r2(x1)} ${r2(y1)}" fill="none" stroke="#6B7F5E" stroke-width="1.5" stroke-linecap="round"></path>`;
    const n = 17;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const a = a0 + (a1 - a0) * t;
      const [x, y] = pt(a);
      const tangent = a + side * 90;           // direction de la branche (vers la pointe)
      const out = i % 2 ? 1 : -1;               // alternance extérieur / intérieur
      const len = 21 - t * 9, wid = 7.2 - t * 2.8;
      leaves += leaf(x, y, tangent + out * side * 42, len, wid, `url(#${id}-lf)`);
      if (i % 5 === 3) { const [bx, by] = pt(a, R + out * 11); berries += `<circle cx="${r2(bx)}" cy="${r2(by)}" r="2.6" fill="${i % 2 ? "#F06292" : "#FFB085"}"></circle>`; }
    }
    leaves += leaf(x1, y1, a1 + side * 90, 13, 4.5, `url(#${id}-lf)`);
  }
  const d = textPath(CORMORANT, "03 · 07 · 2027", 150, 212, 14, 2.6).d;
  return {
    viewBox: "0 0 300 300",
    svg: `<defs>${LEAF_GRAD(id)}${p.defs}${q.defs}</defs>${stems}${leaves}${berries}
  <g transform="translate(176 258)">${q.g}</g><g transform="translate(144 262)">${p.g}</g>
  ${placeMono(`${id}-m`, 150, 140, 148, ink)}<path d="${d}" fill="${sub}"></path>`,
  };
}

// C · Le Sceau (cachet de cire)
export function sceau({ id = "ls", paper = "#FFF9F2" } = {}) {
  let pts = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rr = 122 + (rand() - 0.5) * 9 + (i % 7 === 0 ? 7 : 0);
    pts.push([150 + Math.cos(a) * rr, 150 + Math.sin(a) * rr]);
  }
  // courbe lissée (Catmull-Rom → Bézier)
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
    d += `C${r2(p1[0] + (p2[0] - p0[0]) / 6)} ${r2(p1[1] + (p2[1] - p0[1]) / 6)} ${r2(p2[0] - (p3[0] - p1[0]) / 6)} ${r2(p2[1] - (p3[1] - p1[1]) / 6)} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  // texte circulaire en contours
  const ringText = "CLÉMENTINE & ROMAIN · 3 JUILLET 2027 · ";
  const size = 12.5, R = 101;
  const glyphs = CORMORANT.stringToGlyphs(ringText.normalize("NFC"));
  const total = glyphs.reduce((w, g) => w + adv(CORMORANT, g) * (size / CORMORANT.unitsPerEm) + 2.2, 0);
  const scale = (2 * Math.PI * R) / total;
  let ang = -90, ring = "";
  glyphs.forEach((g) => {
    const step = (adv(CORMORANT, g) * (size / CORMORANT.unitsPerEm) + 2.2) * scale;
    const mid = ang + ((step / 2) / (2 * Math.PI * R)) * 360;
    const gp = pathData(g.getPath(-adv(CORMORANT, g) * (size / CORMORANT.unitsPerEm) / 2, 0, size));
    if (gp) ring += `<path d="${gp}" transform="rotate(${r2(mid + 90)} 150 150) translate(150 ${150 - R + 4})"></path>`;
    ang += (step / (2 * Math.PI * R)) * 360;
  });
  return {
    viewBox: "0 0 300 300",
    svg: `<defs><radialGradient id="${id}-w" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="#E0457F"></stop><stop offset=".6" stop-color="#C2185B"></stop><stop offset="1" stop-color="#8E0E42"></stop></radialGradient></defs>
  <path d="${d}Z" fill="url(#${id}-w)"></path>
  <circle cx="150" cy="150" r="88" fill="none" stroke="${paper}" stroke-opacity=".35" stroke-width="1.4"></circle>
  <circle cx="150" cy="150" r="114" fill="none" stroke="#8E0E42" stroke-opacity=".5" stroke-width="1"></circle>
  <g fill="${paper}" fill-opacity=".85">${ring}</g>
  <g transform="translate(1.6 2)" opacity=".45">${placeMono(`${id}-s`, 150, 150, 142, "#6E0A33")}</g>
  ${placeMono(`${id}-m`, 150, 150, 142, paper)}`,
  };
}

// D · L’Éditorial
export function editorial({ id = "le", ink = "currentColor", accent = "#C2185B", sub = "#4E5E43" } = {}) {
  const names = textPath(CORMORANT, "CLÉMENTINE & ROMAIN", 180, 186, 16, 4.2).d;
  const date = textPath(CORMORANT_I, "samedi 3 juillet 2027", 180, 212, 15, 0.6).d;
  return {
    viewBox: "0 0 360 230",
    svg: `<path d="M24 92H96M264 92H336" stroke="${accent}" stroke-width="1"></path>
  <path d="M24 92l5-3v6zM336 92l-5-3v6z" fill="${accent}"></path>
  ${placeMono(`${id}-m`, 180, 86, 176, ink)}
  <path d="${names}" fill="${ink}"></path><path d="${date}" fill="${sub}"></path>`,
  };
}

const wrap = (m, color = "#2F3829", bg = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${m.viewBox}" style="color:${color}${bg ? `;background:${bg}` : ""}">${m.svg}</svg>\n`;

if (process.argv[2] === "--pistes") {
  const dir = new URL("./out/logo/", import.meta.url);
  mkdirSync(dir, { recursive: true });
  const all = { arche: arche(), couronne: couronne(), sceau: sceau(), editorial: editorial() };
  for (const [k, m] of Object.entries(all)) writeFileSync(new URL(`${k}.svg`, dir), wrap(m));
  // Versions pour fond sombre
  const light = {
    arche: arche({ id: "lad", ink: "#FFF9F2", accent: "#FFD9C7", sub: "#FFD9C7" }),
    couronne: couronne({ id: "lcd", ink: "#FFF9F2", sub: "#FFD9C7" }),
    sceau: sceau({ id: "lsd" }),
    editorial: editorial({ id: "led", ink: "#FFF9F2", accent: "#FFD9C7", sub: "#FFD9C7" }),
  };
  for (const [k, m] of Object.entries(light)) writeFileSync(new URL(`${k}-clair.svg`, dir), wrap(m, "#FFF9F2"));
  writeFileSync(new URL("pistes.json", dir), JSON.stringify(all));
  console.log(Object.entries(all).map(([k, m]) => `${k}: ${(m.svg.length / 1024).toFixed(1)} Ko`).join(" · "));
}

/* ------------------------------------------------------------ Logo du site (piste A · L’Arche) */
// Symboles SVG à insérer une fois par page, réutilisés via <use href="#logo-arche">.
// Couleurs pilotées en CSS : lettres = currentColor, filets de l’arche = --mono-accent, date = --mono-sub.
export function siteLogo() {
  const a = arche({ id: "logo", date: false, ink: "currentColor", accent: "ACCENT" });
  const mark = a.svg
    .replace('stroke="ACCENT" stroke-width="1.8"', 'style="stroke: var(--mono-accent, #C2185B); stroke-width: var(--mono-sw, 1.8)"')
    .replace('stroke="ACCENT" stroke-width=".8"', 'style="stroke: var(--mono-accent, #C2185B); stroke-width: var(--mono-sw2, .8)"');
  const date = textPath(CORMORANT, "03 · 07 · 2027", 120, 272, 15, 2.8).d;
  const symbols = `<svg class="logo-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;overflow:hidden">
    <symbol id="logo-arche" viewBox="0 0 240 300">${mark}</symbol>
    <symbol id="logo-arche-date" viewBox="0 0 240 300"><use href="#logo-arche"></use><path d="${date}" style="fill: var(--mono-sub, #4E5E43)"></path></symbol>
  </svg>`;
  // Icône d’onglet : arche pleine fuchsia, monogramme ivoire (lisible dès 16 px)
  const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 20 212 276">
  <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D23A73"></stop><stop offset="1" stop-color="#A3144D"></stop></linearGradient></defs>
  <path d="M22 292V125a98 98 0 0 1 196 0v167Z" fill="url(#fg)"></path>
  <path d="M34 280V125a86 86 0 0 1 172 0v155Z" fill="none" stroke="#FFD9C7" stroke-width="3" opacity=".55"></path>
  ${placeMono("fav", 120, 190, 176, "#FFF9F2")}
</svg>\n`;
  return { symbols, fav };
}

if (process.argv[2] === "--site") {
  const { fav } = siteLogo();
  writeFileSync(new URL("../assets/img/favicon.svg", import.meta.url), fav);
  console.log("assets/img/favicon.svg");
}
