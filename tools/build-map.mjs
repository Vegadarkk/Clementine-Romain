// Génère les deux cartes illustrées du site (France + zoom sur les Bauges)
// à partir de données géographiques réelles, puis les injecte dans index.html
// entre les marqueurs <!-- CARTE-FRANCE:START/END --> et <!-- CARTE-BAUGES:START/END -->.
//
// Usage : cd tools && npm install && npm run map
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { geoArea, geoConicConformal, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const here = (p) => new URL(p, import.meta.url);
const json = (p) => JSON.parse(readFileSync(here(p), "utf8"));

const world = json("./node_modules/world-atlas/countries-50m.json");
const countries = feature(world, world.objects.countries).features;
// d3-geo attend des anneaux dans le sens horaire (convention inverse de la RFC 7946) :
// un polygone dont l'aire dépasse une demi-sphère est retourné.
function rewind(f) {
  if (geoArea(f) > 2 * Math.PI) {
    const g = f.geometry;
    if (g.type === "Polygon") g.coordinates = g.coordinates.map((r) => r.slice().reverse());
    if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map((p) => p.map((r) => r.slice().reverse()));
  }
  return f;
}
const dep73 = rewind(json("./data/dep-73.geojson"));
const dep74 = rewind(json("./data/dep-74.geojson"));
const lakes = [rewind(json("./data/lac-annecy.geojson")), rewind(json("./data/lac-bourget.geojson"))];
const route = json("./data/route-hery-saint-offenge.geojson");

const PLACES = {
  hery: [6.0138, 45.7971],
  chateau: [6.0033, 45.7348],
  annecy: [6.1289, 45.8992],
  aix: [5.9146, 45.6886],
  chambery: [5.9204, 45.5663],
  paris: [2.3522, 48.8566],
  lyon: [4.8357, 45.764],
  geneve: [6.1432, 46.2044],
  marseille: [5.3698, 43.2965],
};

const r1 = (n) => Math.round(n * 10) / 10;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Petit générateur pseudo-aléatoire déterministe (rendu identique à chaque build)
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// Sommet illustré : face éclairée, face ombrée, neige optionnelle
function peak([x, y], size, snow = true) {
  const h = size * (0.95 + rand() * 0.35);
  const w = size * (0.62 + rand() * 0.18);
  const ax = x + (rand() - 0.5) * size * 0.2;
  const ay = y - h;
  const mid = x + w * 0.12;
  const pts = (arr) => arr.map(([a, b]) => `${r1(a)},${r1(b)}`).join(" ");
  let g = `<polygon class="pk-l" points="${pts([[ax, ay], [x - w, y], [mid, y]])}"/>`;
  g += `<polygon class="pk-d" points="${pts([[ax, ay], [mid, y], [x + w, y]])}"/>`;
  if (snow) {
    const t = 0.3;
    g += `<polygon class="pk-s" points="${pts([
      [ax, ay],
      [ax - w * t, ay + h * t],
      [ax - w * t * 0.45, ay + h * t * 0.78],
      [ax - w * 0.02, ay + h * t * 1.05],
      [ax + w * t * 0.5, ay + h * t * 0.8],
      [ax + w * t * 0.95, ay + h * t],
    ])}"/>`;
  }
  return `<g class="map-peak">${g}</g>`;
}

// Épingle (pointe en 0,0)
const PIN = "M0 0C-2.4-7.5-10-12-10-21a10 10 0 1 1 20 0C10-12 2.4-7.5 0 0Z";
// Groupe extérieur = position ; groupe intérieur = cible des animations (GSAP réécrit l'attribut transform)
const pin = ([x, y], scale, cls = "") =>
  `<g transform="translate(${r1(x)} ${r1(y)}) scale(${scale})" data-pin-x="${r1(x)}" data-pin-y="${r1(y)}"><g class="map-pin ${cls}"><path class="pin-b" d="${PIN}"/><circle class="pin-c" cx="0" cy="-21" r="4.2"/></g></g>`;

const WATERCOLOR = (id) => `
    <filter id="${id}-wc" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="${id}-grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/>
      <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.3  0 0 0 0.07 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>`;

/* ------------------------------------------------------------------ France */
function buildFrance() {
  const W = 600, H = 600;
  const france = countries.find((f) => f.id === "250");
  // On ne garde que la France métropolitaine (+ Corse)
  const metro = {
    type: "Feature",
    geometry: {
      type: "MultiPolygon",
      coordinates: france.geometry.coordinates.filter((poly) => {
        const [lon, lat] = poly[0][0];
        return lon > -6 && lon < 10 && lat > 41 && lat < 52;
      }),
    },
  };
  const proj = geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitExtent([[28, 24], [W - 28, H - 24]], metro);
  const path = geoPath(proj).digits(0);
  // Pays voisins : découpés au cadre pour alléger le SVG
  const clipped = geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitExtent([[28, 24], [W - 28, H - 24]], metro).clipExtent([[0, 0], [W, H]]);
  const npath = geoPath(clipped).digits(0);
  const neighbours = countries
    .filter((f) => ["724", "380", "756", "276", "056", "442", "250", "020", "492", "826"].includes(f.id) && f.id !== "250")
    .map((f) => `<path d="${npath(f)}"/>`)
    .join("");
  const P = (k) => proj(PLACES[k]);

  // Massifs montagneux (lon, lat, taille)
  const ranges = [
    // Alpes
    [6.9, 45.9, 21], [6.62, 45.72, 22], [6.85, 45.55, 24], [6.45, 45.35, 20], [6.95, 45.2, 22],
    [6.25, 45.05, 18], [6.65, 44.95, 21], [6.45, 44.65, 19], [6.85, 44.45, 18], [6.55, 44.2, 15],
    [7.05, 44.15, 14], [6.2, 45.62, 15], [5.9, 45.2, 13], [5.75, 44.85, 13],
    // Jura
    [6.35, 46.85, 10, false], [5.9, 46.72, 10, false],
    // Vosges
    [7.0, 48.05, 11, false], [7.15, 48.4, 10, false],
    // Massif central
    [2.85, 45.55, 12, false], [2.75, 45.1, 13, false], [3.55, 44.75, 11, false], [3.95, 45.3, 10, false],
    // Pyrénées
    [-1.2, 43.02, 12], [-0.45, 42.88, 16], [0.3, 42.78, 18], [1.05, 42.72, 16], [1.85, 42.62, 15], [2.45, 42.55, 11],
    // Corse
    [9.0, 42.25, 10, false], [9.1, 42.0, 9, false],
  ]
    .map(([lon, lat, s, snow = true]) => [proj([lon, lat]), s, snow])
    .sort((a, b) => a[0][1] - b[0][1])
    .map(([p, s, snow]) => peak(p, s, snow))
    .join("");

  const cities = [
    ["paris", "Paris", "end", -12, 5],
    ["lyon", "Lyon", "end", -11, 5],
    ["geneve", "Genève", "end", -9, -9],
    ["marseille", "Marseille", "end", -11, 5],
  ]
    .map(([k, label, anchor, dx, dy]) => {
      const [x, y] = P(k);
      return `<g class="map-label"><circle class="map-city" cx="${r1(x)}" cy="${r1(y)}" r="4.5"/><text x="${r1(x + dx)}" y="${r1(y + dy)}" text-anchor="${anchor}" class="map-city-t">${label}</text></g>`;
    })
    .join("");

  const [vx, vy] = proj([6.0085, 45.766]);
  return `<svg class="map-svg map-france" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="fr-title fr-desc">
  <title id="fr-title">Carte de France</title>
  <desc id="fr-desc">Le mariage a lieu en Savoie et Haute-Savoie, dans les Alpes, entre Annecy, Aix-les-Bains et Chambéry, à environ 1 h de Genève et 1 h 30 de Lyon.</desc>
  <defs>${WATERCOLOR("fr")}
  </defs>
  <g class="map-neighbours" filter="url(#fr-wc)">${neighbours}</g>
  <path class="map-land map-draw" pathLength="1" filter="url(#fr-wc)" d="${path(metro)}"/>
  <g class="map-region"><path d="${path(dep74)}"/><path d="${path(dep73)}"/></g>
  <rect class="map-grain" x="0" y="0" width="${W}" height="${H}" filter="url(#fr-grain)"/>
  <g class="map-peaks">${ranges}</g>
  <g class="map-cities">${cities}</g>
  <circle class="map-pulse" cx="${r1(vx)}" cy="${r1(vy)}" r="10"/>
  ${pin([vx, vy], 1.25, "pin-main")}
</svg>`;
}

/* ------------------------------------------------------- Zoom sur les Bauges */
function buildBauges() {
  const W = 600, H = 640;
  const bbox = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[[5.74, 45.53], [5.74, 45.95], [6.3, 45.95], [6.3, 45.53], [5.74, 45.53]]] },
  };
  const proj = geoMercator().fitExtent([[0, 0], [W, H]], bbox).clipExtent([[-10, -10], [W + 10, H + 10]]);
  const path = geoPath(proj).digits(1);
  const P = (lonlat) => proj(lonlat);

  const peaks = [
    // Massif des Bauges
    [6.222, 45.672, 44], [6.165, 45.69, 40], [6.2, 45.708, 32], [6.175, 45.652, 34], [6.13, 45.628, 30],
    [6.055, 45.64, 30], [6.245, 45.728, 28], [6.1, 45.662, 26], [6.262, 45.645, 32], [6.285, 45.69, 30],
    [6.21, 45.62, 26], [6.14, 45.7, 22], [6.265, 45.595, 28], [6.09, 45.61, 22],
    // Revard / Nivolet
    [5.985, 45.676, 28], [5.965, 45.617, 27], [6.02, 45.655, 20],
    // Semnoz
    [6.105, 45.797, 30], [6.112, 45.832, 23], [6.098, 45.765, 22],
    // Autour du lac d'Annecy
    [6.18, 45.915, 26], [6.285, 45.83, 34], [6.25, 45.868, 24],
    // Dent du Chat / Épine
    [5.83, 45.662, 28], [5.815, 45.628, 24], [5.87, 45.78, 16, false], [5.83, 45.88, 16, false], [5.8, 45.575, 20],
  ]
    .map(([lon, lat, s, snow = true]) => [P([lon, lat]), s, snow])
    .sort((a, b) => a[0][1] - b[0][1])
    .map(([p, s, snow]) => peak(p, s, snow))
    .join("");

  const lakeShapes = lakes.map((l) => `<path d="${path(l)}"/>`).join("");
  const routeD = path(route);

  const city = (k, label, anchor, dx, dy) => {
    const [x, y] = P(PLACES[k]);
    return `<g class="map-label"><circle class="map-city" cx="${r1(x)}" cy="${r1(y)}" r="5"/><text x="${r1(x + dx)}" y="${r1(y + dy)}" text-anchor="${anchor}" class="map-city-t">${label}</text></g>`;
  };
  const txt = (lonlat, label, cls, extra = "") => {
    const [x, y] = P(lonlat);
    return `<text x="${r1(x)}" y="${r1(y)}" class="${cls}" ${extra}>${esc(label)}</text>`;
  };

  const [hx, hy] = P(PLACES.hery);
  const [cx, cy] = P(PLACES.chateau);
  const [lx, ly] = P([5.868, 45.735]);
  const km5 = P([6.0, 45.56])[0] - P([6.0 - 5 / 77.9, 45.56])[0];

  return `<svg class="map-svg map-bauges" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="bg-title bg-desc">
  <title id="bg-title">Carte des lieux du mariage</title>
  <desc id="bg-desc">Héry-sur-Alby (Haute-Savoie), où ont lieu la mairie et l'église, se trouve à environ 10 km au nord du Château de Saint-Offenge (Savoie), lieu du vin d'honneur et du dîner, au pied du massif des Bauges, entre le lac d'Annecy et le lac du Bourget.</desc>
  <defs>${WATERCOLOR("bg")}
    <mask id="bg-route-mask" maskUnits="userSpaceOnUse"><path class="map-route-mask map-draw" pathLength="1" d="${routeD}"/></mask>
    <clipPath id="bg-clip"><rect x="0" y="0" width="${W}" height="${H}" rx="18"/></clipPath>
  </defs>
  <g clip-path="url(#bg-clip)">
    <rect class="map-paper" x="0" y="0" width="${W}" height="${H}"/>
    <g filter="url(#bg-wc)">
      <path class="map-d74" d="${path(dep74)}"/>
      <path class="map-d73" d="${path(dep73)}"/>
    </g>
    <path class="map-border" d="${path(dep74)}"/>
    <g class="map-lakes" filter="url(#bg-wc)">${lakeShapes}</g>
    <rect class="map-grain" x="0" y="0" width="${W}" height="${H}" filter="url(#bg-grain)"/>
    <g class="map-peaks">${peaks}</g>
    <g class="map-label">
      ${txt([6.03, 45.592], "LES BAUGES", "map-massif")}
      ${txt([5.905, 45.935], "74 · Haute-Savoie", "map-dep")}
      ${txt([6.13, 45.548], "73 · Savoie", "map-dep")}
      ${txt([6.2, 45.887], "Lac d’Annecy", "map-lake-t")}
      <text x="${r1(lx)}" y="${r1(ly)}" class="map-lake-t" transform="rotate(-78 ${r1(lx)} ${r1(ly)})" text-anchor="middle">Lac du Bourget</text>
    </g>
    ${city("annecy", "Annecy", "start", 10, 18)}
    ${city("aix", "Aix-les-Bains", "end", -10, 20)}
    ${city("chambery", "Chambéry", "start", 11, 5)}
    <path class="map-route" mask="url(#bg-route-mask)" d="${routeD}"/>
    ${pin([cx, cy], 1.35, "pin-chateau")}
    ${pin([hx, hy], 1.35, "pin-hery")}
    <g class="map-label map-venue">
      <text x="${r1(hx - 20)}" y="${r1(hy - 32)}" class="map-venue-t" text-anchor="end">Héry-sur-Alby</text>
      <text x="${r1(hx - 20)}" y="${r1(hy - 11)}" class="map-venue-s" text-anchor="end">Mairie &amp; église</text>
    </g>
    <g class="map-label map-venue">
      <text x="${r1(cx + 20)}" y="${r1(cy - 32)}" class="map-venue-t">Saint-Offenge</text>
      <text x="${r1(cx + 20)}" y="${r1(cy - 11)}" class="map-venue-s">Château · vin d’honneur &amp; dîner</text>
    </g>
    <g class="map-label map-compass" transform="translate(${W - 44} 52)">
      <path d="M0-26 7 0 0-6-7 0Z"/><path class="map-compass-s" d="M0 26 7 0 0 6-7 0Z"/>
      <text y="-32" text-anchor="middle">N</text>
    </g>
    <g class="map-label map-scale" transform="translate(28 ${H - 30})">
      <path d="M0 0H${r1(km5)}M0-5V5M${r1(km5)}-5V5"/>
      <text x="${r1(km5 + 10)}" y="5">5 km</text>
    </g>
  </g>
  <rect class="map-frame" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="17"/>
</svg>`;
}

const france = buildFrance();
const bauges = buildBauges();

mkdirSync(here("./out/"), { recursive: true });
writeFileSync(here("./out/carte-france.svg"), france);
writeFileSync(here("./out/carte-bauges.svg"), bauges);

const indexUrl = here("../index.html");
if (existsSync(indexUrl)) {
  let html = readFileSync(indexUrl, "utf8");
  const inject = (name, svg) => {
    const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
    if (!re.test(html)) throw new Error(`Marqueurs ${name} introuvables dans index.html`);
    html = html.replace(re, `$1\n${svg}\n$2`);
  };
  inject("CARTE-FRANCE", france);
  inject("CARTE-BAUGES", bauges);
  writeFileSync(indexUrl, html);
  console.log("Cartes injectées dans index.html");
}
console.log(`France: ${(france.length / 1024).toFixed(1)} Ko · Bauges: ${(bauges.length / 1024).toFixed(1)} Ko`);
