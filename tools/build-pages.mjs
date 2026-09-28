// Injecte les blocs communs (tête, en-tête, pied de page, scripts) dans chaque page HTML,
// entre les marqueurs <!-- NOM:START --> et <!-- NOM:END -->.
// Le site reste 100 % statique : ce script ne sert qu'à éviter les copier-coller.
// Usage : cd tools && npm run pages
import { readFileSync, writeFileSync } from "node:fs";

const PAGES = ["index.html", "hebergements.html", "temoins.html", "environs.html", "rsvp.html", "404.html"];
const SITE_URL = "https://vegadarkk.github.io/clementine-romain/";

/* ----------------------------------------------------- Paysage de montagnes */
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const r1 = (n) => Math.round(n * 10) / 10;

function ridge(baseY, amp, stepMin, stepMax) {
  const pts = [];
  let x = -60;
  let up = rand() > 0.5;
  while (x < 1500) {
    const h = up ? amp * (0.55 + rand() * 0.45) : amp * (rand() * 0.35);
    pts.push([x, baseY - h]);
    x += stepMin + rand() * (stepMax - stepMin);
    up = !up;
  }
  return pts;
}
function snowCaps(pts, threshold) {
  let caps = "";
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    if (ay > threshold) continue;
    const [lx, ly] = pts[i - 1];
    const [rx, ry] = pts[i + 1];
    const d = 0.26;
    const L = [ax + (lx - ax) * d, ay + (ly - ay) * d];
    const R = [ax + (rx - ax) * d, ay + (ry - ay) * d];
    const m1 = [ax + (lx - ax) * d * 0.45, ay + (ly - ay) * d * 0.7];
    const m2 = [ax + (rx - ax) * d * 0.2, ay + (ry - ay) * d * 1.05];
    const m3 = [ax + (rx - ax) * d * 0.6, ay + (ry - ay) * d * 0.72];
    caps += `<polygon points="${[[ax, ay], L, m1, m2, m3, R].map(([x, y]) => `${r1(x)},${r1(y)}`).join(" ")}"/>`;
  }
  return caps;
}
function landscape(cls = "") {
  const H = 360;
  const layers = [
    { c: "l-1", base: 150, amp: 95, s: [90, 170], depth: 0.5, snow: 88 },
    { c: "l-2", base: 205, amp: 90, s: [70, 150], depth: 0.35, snow: 132 },
    { c: "l-3", base: 250, amp: 80, s: [80, 160], depth: 0.22 },
    { c: "l-4", base: 290, amp: 70, s: [90, 190], depth: 0.12 },
    { c: "l-5", base: 330, amp: 52, s: [110, 220], depth: 0 },
  ];
  let body = `<circle class="l-sun" cx="1080" cy="120" r="54" data-depth="0.6"/>`;
  for (const l of layers) {
    const pts = ridge(l.base, l.amp, l.s[0], l.s[1]);
    const d = `M-60 ${H + 10}L${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}L1500 ${H + 10}Z`;
    body += `<g class="l-layer" data-depth="${l.depth}"><path class="${l.c}" d="${d}"/>${l.snow ? `<g class="l-snow">${snowCaps(pts, l.snow)}</g>` : ""}</g>`;
  }
  return `<svg class="landscape ${cls}" viewBox="0 0 1440 ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${body}</svg>`;
}

/* ------------------------------------------------------------------ Blocs */
const HEAD = `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#FFF3E6">
  <meta name="format-detection" content="telephone=no">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Clémentine &amp; Romain">
  <meta property="og:title" content="Clémentine &amp; Romain · 3 juillet 2027">
  <meta property="og:description" content="Nous nous marions ! Programme, lieux, hébergements et réponse à l’invitation.">
  <meta property="og:image" content="${SITE_URL}assets/img/og-image.jpg">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
  <link rel="preload" href="assets/fonts/pinyon-script-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/cormorant-garamond-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/jost-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/css/style.css">
  <script>
    /* Active les animations si le visiteur ne les a pas désactivées ; filet de sécurité si le JS ne se charge pas */
    (function (d) {
      var h = d.documentElement, s = null;
      h.classList.add("js");
      if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      h.classList.add("motion");
      try { s = window.sessionStorage; } catch (e) {}
      if (s && s.getItem("cr-curtain")) { h.classList.add("curtain-in"); s.removeItem("cr-curtain"); }
      else if (s && h.hasAttribute("data-intro") && !s.getItem("cr-intro")) h.classList.add("intro");
      setTimeout(function () { if (!window.__crReady) h.classList.remove("motion", "intro", "curtain-in"); }, 5000);
    })(document);
  </script>`;

const NAV = [
  ["accueil", "index.html", "Accueil"],
  ["programme", "index.html#programme", "Programme"],
  ["hebergements", "hebergements.html", "Hébergements"],
  ["temoins", "temoins.html", "Témoins"],
  ["environs", "environs.html", "Environs"],
];

const HEADER = `<a class="skip-link" href="#contenu">Aller au contenu</a>
  <div class="intro-screen" aria-hidden="true">
    <div class="intro-screen__inner">
      <svg class="intro-screen__mono" viewBox="0 0 400 160"><text x="200" y="118" text-anchor="middle">C<tspan dx="8" class="amp">&amp;</tspan><tspan dx="8">R</tspan></text></svg>
      <p class="intro-screen__date">03 · 07 · 2027</p>
    </div>
  </div>
  <div class="page-curtain" aria-hidden="true"><div class="page-curtain__panel"></div><div class="page-curtain__panel page-curtain__panel--front"><span>C<em>&amp;</em>R</span></div></div>
  <div class="scroll-progress" aria-hidden="true"><span></span></div>
  <header class="site-header" data-header>
    <div class="container site-header__inner">
      <a class="brand" href="index.html">C<span>&amp;</span>R<b class="visually-hidden"> · Clémentine et Romain, accueil</b></a>
      <nav class="nav" aria-label="Navigation principale">
        <ul class="nav__list">
${NAV.map(([k, href, label]) => `          <li><a class="nav__link" data-nav="${k}" href="${href}">${label}</a></li>`).join("\n")}
        </ul>
        <a class="btn btn--sm" data-nav="rsvp" href="rsvp.html" data-magnetic><svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#i-mail"/></svg>Je réponds</a>
      </nav>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-mobile"><span></span><span></span><span></span><b class="visually-hidden">Menu</b></button>
    </div>
  </header>
  <div class="mobile-menu" id="menu-mobile" inert>
    <nav aria-label="Menu mobile">
      <ul>
${NAV.map(([k, href, label]) => `        <li><a data-nav="${k}" href="${href}">${k === "environs" ? "Que faire aux alentours" : label}</a></li>`).join("\n")}
      </ul>
    </nav>
    <div class="mobile-menu__foot">
      <a class="btn" data-nav="rsvp" href="rsvp.html"><svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#i-mail"/></svg>Répondre à l’invitation</a>
      <p class="mobile-menu__date">Samedi 3 juillet 2027</p>
    </div>
  </div>`;

const FOOTER = `<footer class="site-footer">
    ${landscape("landscape--footer")}
    <div class="site-footer__body">
      <div class="container">
        <p class="site-footer__names">Clémentine <span>&amp;</span> Romain</p>
        <p class="site-footer__date">Samedi 3 juillet 2027 · Héry-sur-Alby · Saint-Offenge</p>
        <nav aria-label="Pied de page">
          <ul>
${[...NAV, ["rsvp", "rsvp.html", "Répondre"]].map(([, href, label]) => `            <li><a href="${href}">${label}</a></li>`).join("\n")}
          </ul>
        </nav>
        <p class="site-footer__small">Réponse souhaitée avant le 15 mars 2027 · Fait avec <svg class="icon" aria-label="amour" role="img"><use href="assets/img/icons.svg#i-heart"/></svg> pour notre grand jour</p>
      </div>
    </div>
  </footer>
  <div class="toast" role="status" aria-live="polite" data-toast></div>
  <div class="cursor is-out" aria-hidden="true"><div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div></div>
  <div class="grain" aria-hidden="true"></div>`;

const SCRIPTS = `<script src="assets/vendor/gsap.min.js" defer></script>
  <script src="assets/vendor/ScrollTrigger.min.js" defer></script>
  <script src="assets/vendor/SplitText.min.js" defer></script>
  <script src="assets/vendor/lenis.min.js" defer></script>
  <script src="assets/js/main.js" defer></script>`;

const BLOCKS = { HEAD, HEADER, FOOTER, SCRIPTS, PAYSAGE: landscape("landscape--hero") };

for (const page of PAGES) {
  const url = new URL(`../${page}`, import.meta.url);
  let html;
  try {
    html = readFileSync(url, "utf8");
  } catch {
    continue;
  }
  const current = (html.match(/<body[^>]*data-page="([^"]+)"/) || [])[1];
  for (const [name, block] of Object.entries(BLOCKS)) {
    const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`, "g");
    let content = block;
    if (name === "HEADER" && current) {
      content = content.replace(new RegExp(`data-nav="${current}"`, "g"), `data-nav="${current}" aria-current="page"`);
    }
    html = html.replace(re, `$1\n  ${content}\n  $2`);
  }
  writeFileSync(url, html);
  console.log(`✓ ${page}`);
}
