// Injecte les blocs communs (tête, en-tête, pied de page, scripts) dans chaque page HTML,
// entre les marqueurs <!-- NOM:START --> et <!-- NOM:END -->.
// Le site reste 100 % statique : ce script ne sert qu'à éviter les copier-coller.
// Usage : cd tools && npm run pages
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { siteLogo } from "./build-logo.mjs";

const LOGO = siteLogo();

// Empreinte courte d’un fichier : ajoutée aux URL (?v=…) pour que chaque mise à jour
// soit prise en compte immédiatement malgré le cache du navigateur.
const fingerprint = (path) => {
  try { return createHash("sha1").update(readFileSync(new URL(`../${path}`, import.meta.url))).digest("hex").slice(0, 8); }
  catch { return null; }
};
function bustCache(html) {
  return html
    .replace(/(href|src)="(assets\/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g, (m, attr, path) => {
      const v = fingerprint(path);
      return v ? `${attr}="${path}?v=${v}"` : m;
    })
    .replace(/assets\/img\/icons\.svg(?:\?v=[0-9a-f]+)?#/g, () => `assets/img/icons.svg?v=${fingerprint("assets/img/icons.svg")}#`);
}

const PAGES = ["index.html", "hebergements.html", "temoins.html", "environs.html", "rsvp.html", "404.html", "logos.html"];
// Adresse publique du site (avec la barre finale). Pour changer d'hébergeur : modifier ici, puis `npm run pages`.
const SITE_URL = "https://clementine-et-romain.pages.dev/";
// Référencement : true = le site peut apparaître sur Google ; false = caché (noindex + robots.txt fermé).
const INDEXABLE = true;
// Anciennes adresses redirigées automatiquement vers SITE_URL (ex. l'adresse GitHub Pages après un déménagement).
const OLD_SITES = ["https://vegadarkk.github.io/Clementine-Romain/"];
// Pages jamais référencées (page d'erreur, comparatif des logos réservé aux mariés).
const PRIVATE_PAGES = ["404.html", "logos.html"];
const pageUrl = (page) => SITE_URL + (page === "index.html" ? "" : page.replace(/\.html$/, ""));

/* ----------------------------------------------------- Paysage de montagnes */
let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const r1 = (n) => Math.round(n * 10) / 10;

function ridge(baseY, amp, stepMin, stepMax, W = 1440) {
  const pts = [];
  let x = -60;
  let up = rand() > 0.5;
  while (x < W + 60) {
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
// W : largeur du viewBox. Un paysage plus large (ex. 2400) garde ses sommets visibles sur les très
// grands écrans, là où « slice » rognerait le haut d'un paysage de 1440.
function landscape(cls = "", { W = 1440, sun = true, align = "xMidYMax" } = {}) {
  const H = 360;
  const layers = [
    { c: "l-1", base: 150, amp: 95, s: [90, 170], depth: 0.5, snow: 88 },
    { c: "l-2", base: 205, amp: 90, s: [70, 150], depth: 0.35, snow: 132 },
    { c: "l-3", base: 250, amp: 80, s: [80, 160], depth: 0.22 },
    { c: "l-4", base: 290, amp: 70, s: [90, 190], depth: 0.12 },
    { c: "l-5", base: 330, amp: 52, s: [110, 220], depth: 0 },
  ];
  let body = sun ? `<circle class="l-sun" cx="${r1(W * 0.75)}" cy="120" r="54" data-depth="0.6"/>` : "";
  for (const l of layers) {
    const pts = ridge(l.base, l.amp, l.s[0], l.s[1], W);
    const d = `M-60 ${H + 10}L${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}L${W + 60} ${H + 10}Z`;
    body += `<g class="l-layer" data-depth="${l.depth}"><path class="${l.c}" d="${d}"/>${l.snow ? `<g class="l-snow">${snowCaps(pts, l.snow)}</g>` : ""}</g>`;
  }
  return `<svg class="landscape ${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${align} slice" aria-hidden="true" focusable="false">${body}</svg>`;
}

/* ------------------------------------------------------------------ Blocs */
const REDIRECT = OLD_SITES.length
  ? `<script>(function () { var old = ${JSON.stringify(OLD_SITES.map((u) => { const x = new URL(u); return [x.hostname, x.pathname]; }))};
    for (var i = 0; i < old.length; i++) if (location.hostname === old[i][0] && location.pathname.indexOf(old[i][1]) === 0) {
      var rest = location.pathname.slice(old[i][1].length);
      if (rest.slice(-10) === "index.html") rest = rest.slice(0, -10); else if (rest.slice(-5) === ".html") rest = rest.slice(0, -5);
      location.replace(${JSON.stringify(SITE_URL)} + rest + location.search + location.hash); return; } })();</script>
  `
  : "";
const HEAD = `${REDIRECT}<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="__ROBOTS__">__CANONICAL__
  <meta name="theme-color" content="#FFF3E6">
  <meta name="color-scheme" content="only light">
  <meta name="darkreader-lock">
  <meta name="format-detection" content="telephone=no">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Clémentine &amp; Romain">
  <meta property="og:title" content="Clémentine &amp; Romain · 3 juillet 2027">
  <meta property="og:description" content="Nous nous marions&nbsp;! Programme, lieux, hébergements et réponse à l’invitation.">
  <meta property="og:image" content="${SITE_URL}assets/img/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Clémentine et Romain sous une arche de verdure · samedi 3 juillet 2027">
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
      var h = d.documentElement, s = null, l = null;
      h.classList.add("js");
      try { s = window.sessionStorage; } catch (e) {}
      try { l = window.localStorage; } catch (e) {}
      // Écran « Ouvrir l'invitation » à la première page de la visite : son clic autorise la musique
      // (sauf si le visiteur l'a déjà refusée, et jamais pour les robots d'indexation)
      if (s && !s.getItem("cr-gate") && !(l && l.getItem("cr-music-off") === "1") && !/bot|crawl|spider|lighthouse|slurp/i.test(navigator.userAgent)) h.classList.add("gate");
      setTimeout(function () { if (!window.__crReady) h.classList.remove("motion", "intro", "curtain-in", "gate"); }, 5000);
      if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      h.classList.add("motion");
      if (s && s.getItem("cr-curtain")) { h.classList.add("curtain-in"); s.removeItem("cr-curtain"); }
      else if (!h.classList.contains("gate") && s && h.hasAttribute("data-intro") && !s.getItem("cr-intro")) h.classList.add("intro");
    })(document);
  </script>`;

const NAV = [
  ["accueil", "index.html", "Accueil"],
  ["programme", "index.html#programme", "Programme"],
  ["hebergements", "hebergements.html", "Hébergements"],
  ["temoins", "temoins.html", "Témoins"],
  ["environs", "environs.html", "Environs"],
];

// Écran d'invitation « faire-part à volets » : le même décor est posé sur chaque volet (chaque volet en
// montre sa moitié) ; le second exemplaire est masqué aux lecteurs d'écran.
const GATE_SPRIG = '<path d="M4 42C5 24 15 10 38 4"/><path d="M9 33c5-2 9 0 10 4"/><path d="M9 33c1-5 5-8 9-8"/><path d="M15 22c5-3 9-1 11 2"/><path d="M15 22c1-5 6-7 10-7"/><path d="M24 13c4-2 8-1 10 1"/><circle class="gf-sprig__dot" cx="39.5" cy="4" r="1.8"/>';
const gateArt = (copy) => `<div class="gf-art"><div class="gf-grain"></div><div class="gf-frame"></div>${["tl", "tr", "bl", "br"].map((c) => `<svg class="gf-sprig gf-sprig--${c}" viewBox="0 0 46 46" aria-hidden="true" focusable="false">${GATE_SPRIG}</svg>`).join("")}
      <img class="gf-fl gf-fl--1" src="assets/img/bouquet.svg" alt="" width="420" height="340" loading="lazy"><img class="gf-fl gf-fl--2" src="assets/img/fleur-pivoine.svg" alt="" width="200" height="200" loading="lazy">
      <div class="gf-txt"><p class="gf-over">Bienvenue</p><p class="gf-names script"${copy ? "" : ' id="gate-title"'}><span class="gf-n1">Clémentine</span> <span class="gf-amp">&amp;</span>&nbsp;Romain</p><p class="gf-tag">ont la joie de vous convier à leur mariage</p><p class="gf-date"${copy ? "" : ' id="gate-desc"'}>Samedi 3&nbsp;juillet&nbsp;2027 · Héry-sur-Alby</p></div></div>`;
// Éclats de cire projetés quand le cachet se brise
const GATE_CRUMBS = [[-44, 10, 6], [-26, -18, 5], [-8, 26, 4], [18, -22, 5], [34, 16, 6], [48, -6, 4], [6, 38, 5]]
  .map(([dx, dy, sz]) => `<span class="gf-crumb" style="--dx: ${dx}px; --dy: ${dy}px; --s: ${sz}px" aria-hidden="true"></span>`).join("");

const HEADER = `${LOGO.symbols}
  <a class="skip-link" href="#contenu">Aller au contenu</a>
  <div class="gate-screen" data-gate role="dialog" aria-modal="true" aria-labelledby="gate-title" aria-describedby="gate-desc">
    <div class="gf-door gf-door--l">${gateArt(false)}<div class="gf-edge"></div><div class="gf-shade"></div></div>
    <div class="gf-door gf-door--r" aria-hidden="true">${gateArt(true)}<div class="gf-edge"></div><div class="gf-shade"></div></div>
    <div class="gf-seam" aria-hidden="true"></div>
    <div class="petals gate-screen__petals" aria-hidden="true" data-petals="12"></div>
    <div class="gf-ribbon" aria-hidden="true"><span class="gf-rib gf-rib--l"></span><span class="gf-rib gf-rib--r"></span></div>
    <span class="gf-ripple" aria-hidden="true"></span>
    <button class="gf-seal" type="button" data-gate-seal tabindex="-1" aria-hidden="true"><span class="gf-seal-in"><span class="gf-whole"><img src="assets/img/cachet.svg" alt="" width="300" height="300" loading="lazy"></span><span class="gf-half gf-half--l"><img src="assets/img/cachet.svg" alt="" width="300" height="300" loading="lazy"></span><span class="gf-half gf-half--r"><img src="assets/img/cachet.svg" alt="" width="300" height="300" loading="lazy"></span><span class="gf-sheen"></span></span></button>
    ${GATE_CRUMBS}
    <div class="gf-ui">
      <button class="btn gate-screen__open" type="button" data-gate-open><svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#i-heart"/></svg>Ouvrir l’invitation</button>
      <p class="gate-screen__note">La musique démarre à l’ouverture</p>
      <button class="gate-screen__silent" type="button" data-gate-silent>Entrer sans musique</button>
    </div>
  </div>
  <div class="intro-screen" aria-hidden="true">
    <div class="intro-screen__inner">
      <svg class="intro-screen__mono" viewBox="0 0 240 300"><use href="#logo-arche-date"></use></svg>
    </div>
  </div>
  <div class="page-curtain" aria-hidden="true"><div class="page-curtain__panel"></div><div class="page-curtain__panel page-curtain__panel--front"><svg class="page-curtain__mark" viewBox="0 0 240 300"><use href="#logo-arche"></use></svg></div></div>
  <div class="scroll-progress" aria-hidden="true"><span></span></div>
  <header class="site-header" data-header>
    <div class="container site-header__inner">
      <a class="brand" href="index.html">
        <svg class="brand__mark" viewBox="0 0 240 300" aria-hidden="true" focusable="false"><use href="#logo-arche"></use></svg>
        <span class="brand__text"><span class="brand__names">Clémentine <em>&amp;</em> Romain</span><span class="brand__date">03 · 07 · 2027</span></span>
        <b class="visually-hidden"> · accueil</b>
      </a>
      <nav class="nav" aria-label="Navigation principale">
        <ul class="nav__list">
${NAV.map(([k, href, label]) => `          <li><a class="nav__link" data-nav="${k}" href="${href}">${label}</a></li>`).join("\n")}
        </ul>
        <a class="btn btn--sm" data-nav="rsvp" href="rsvp.html" data-magnetic><svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#i-mail"/></svg>Je réponds</a>
      </nav>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="menu-mobile"><span></span><span></span><span></span><b class="visually-hidden">Menu</b></button>
    </div>
  </header>
  <div class="mobile-menu" id="menu-mobile" inert data-lenis-prevent>
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
        <a class="site-footer__home" href="index.html">
          <svg class="site-footer__mark" viewBox="0 0 240 300" aria-hidden="true" focusable="false"><use href="#logo-arche"></use></svg>
          <span class="site-footer__names">Clémentine <span>&amp;</span>&nbsp;Romain</span>
          <b class="visually-hidden"> · retour à l’accueil</b>
        </a>
        <p class="site-footer__date">Samedi 3&nbsp;juillet&nbsp;2027 · <span class="nowrap">Héry-sur-Alby</span> · <span class="nowrap">Saint-Offenge</span></p>
        <nav aria-label="Pied de page">
          <ul>
${[...NAV, ["rsvp", "rsvp.html", "Répondre"]].map(([, href, label]) => `            <li><a href="${href}">${label}</a></li>`).join("\n")}
          </ul>
        </nav>
        <p class="site-footer__small">Réponse souhaitée avant le 15 mars 2027 · Fait avec <svg class="icon" aria-label="amour" role="img"><use href="assets/img/icons.svg#i-heart"/></svg> pour notre grand jour</p>
      </div>
    </div>
  </footer>
  <button class="music" type="button" data-music aria-pressed="false" aria-label="Musique d’ambiance" data-src="assets/audio/perfect-violon.mp3">
    <span class="music__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    <span class="music__label" aria-hidden="true"><b data-music-state>Un peu de musique&nbsp;?</b><small>Ed Sheeran · Perfect, au violon</small></span>
  </button>
  <button class="to-top" type="button" data-to-top aria-label="Revenir en haut de la page" tabindex="-1">
    <svg class="to-top__ring" viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle cx="26" cy="26" r="24"/><circle class="to-top__progress" cx="26" cy="26" r="24" pathLength="1"/></svg>
    <svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#i-arrow-up"/></svg>
    <span class="to-top__label" aria-hidden="true">Haut de page</span>
  </button>
  <div class="toast" role="status" aria-live="polite" data-toast></div>
  <div class="cursor is-out" aria-hidden="true"><div class="cursor__ring"><span class="cursor__label"></span><svg class="cursor__heart" viewBox="0 0 24 24"><path d="M12 20.7l-1.3-1.2C6 15.2 3 12.5 3 9.2 3 6.5 5.1 4.4 7.8 4.4c1.5 0 3 .7 4.2 1.9 1.2-1.2 2.7-1.9 4.2-1.9 2.7 0 4.8 2.1 4.8 4.8 0 3.3-3 6-7.7 10.3L12 20.7z"/></svg></div><div class="cursor__dot"></div></div>
  <div class="grain" aria-hidden="true"></div>`;

const SCRIPTS = `<script src="assets/vendor/gsap.min.js" defer></script>
  <script src="assets/vendor/ScrollTrigger.min.js" defer></script>
  <script src="assets/vendor/SplitText.min.js" defer></script>
  <script src="assets/vendor/lenis.min.js" defer></script>
  <script src="assets/js/nav.js" defer></script>
  <script src="assets/js/main.js" defer></script>`;

// Page 404 : base des liens relatifs = chemin du site (racine si la page est servie ailleurs)
const BASE_PATH = new URL(SITE_URL).pathname;
const BASE = `<base href="${BASE_PATH}">
  <script>
    if (location.pathname.indexOf(${JSON.stringify(BASE_PATH)}) !== 0) document.querySelector("base").setAttribute("href", "/");
  </script>`;

const BLOCKS = {
  HEAD, HEADER, FOOTER, SCRIPTS, BASE,
  PAYSAGE: landscape("landscape--hero"),
  // Programme : paysage large, sans soleil dessiné (le vrai soleil se couche derrière).
  // Calé en haut (YMin) : si la hauteur manque, c'est le pied des montagnes qui est rogné, jamais les cimes.
  PAYSAGE_SOIR: landscape("landscape--soir", { W: 2400, sun: false, align: "xMidYMin" }),
};

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
    if (name === "HEAD") {
      const open = INDEXABLE && !PRIVATE_PAGES.includes(page);
      content = content.replace("__ROBOTS__", open ? "index, follow, max-image-preview:large" : "noindex, nofollow").replace("__CANONICAL__",
        PRIVATE_PAGES.includes(page) ? "" : `\n  <link rel="canonical" href="${pageUrl(page)}">\n  <meta property="og:url" content="${pageUrl(page)}">` +
          (open && page === "index.html" ? `\n  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "Clémentine & Romain", alternateName: "Mariage de Clémentine et Romain", url: SITE_URL })}</script>` : ""));
    }
    if (name === "HEADER" && current) {
      content = content.replace(new RegExp(`data-nav="${current}"`, "g"), `data-nav="${current}" aria-current="page"`);
    }
    // Fonction de remplacement : un « $ » dans un bloc ne doit pas être interprété
    html = html.replace(re, (m, start, end) => `${start}\n  ${content}\n  ${end}`);
  }
  html = bustCache(html);
  writeFileSync(url, html);
  console.log(`✓ ${page}`);
}

/* ------------------------------------------- Moteurs de recherche : robots.txt et sitemap.xml */
const publicPages = PAGES.filter((p) => !PRIVATE_PAGES.includes(p));
writeFileSync(new URL("../robots.txt", import.meta.url), INDEXABLE
  ? `User-agent: *\nDisallow: /logos\nDisallow: /logos.html\n\nSitemap: ${SITE_URL}sitemap.xml\n`
  : "User-agent: *\nDisallow: /\n");
const today = new Date().toISOString().slice(0, 10);
const sitemapUrl = new URL("../sitemap.xml", import.meta.url);
if (INDEXABLE) {
  writeFileSync(sitemapUrl, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPages
    .map((p) => `  <url><loc>${pageUrl(p)}</loc><lastmod>${today}</lastmod><priority>${p === "index.html" ? "1.0" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`);
  console.log("✓ robots.txt, sitemap.xml (site référencé)");
} else {
  try { unlinkSync(sitemapUrl); } catch { /* absent */ }
  console.log("✓ robots.txt (site caché des moteurs de recherche)");
}
