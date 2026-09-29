/* ==========================================================================
   Navigation sans rechargement entre les pages du site
   La musique d'ambiance continue d'une page à l'autre, sans coupure.
   Chaque page reste un vrai fichier HTML (adresse, référencement, accès direct, retour arrière) :
   ce script charge la page suivante en arrière-plan pendant que le rideau se ferme, remplace le
   contenu, puis relance les scripts de la page. Au moindre imprévu : navigation classique.
   ========================================================================== */
(() => {
  "use strict";

  // Page 404 (liens relatifs à une <base>) ou navigateur trop ancien : navigation classique
  if (!window.fetch || !window.DOMParser || !window.Promise || !history.pushState || document.querySelector("base")) return;

  const html = document.documentElement;
  const norm = (path) => path.replace(/\/index\.html$/, "/").replace(/\.html$/, ""); // « /environs » = « /environs.html »
  const parse = (url) => new URL(url, location.href);
  const PAGE_SCRIPT = /\/assets\/js\/[^/]+\.js$/; // scripts de page, relancés à chaque page
  const SELF = /\/assets\/js\/nav\.js$/;
  let shown = norm(location.pathname); // page affichée
  let leaves = []; // nettoyages de la page affichée (écouteurs globaux, carte, défilement…)
  let leave = null; // fermeture du rideau, fournie par main.js
  let busy = false, pendingPop = false, used = false, restoreY = null;

  // Versions des scripts déjà chargés : si le site a été mis à jour entre-temps, navigation classique
  const loaded = new Map();
  Array.from(document.scripts).forEach((s) => { if (s.src) { const u = parse(s.src); loaded.set(u.pathname, u.search); } });

  /* ---------------------------------------------- Positions dans l'historique */
  // Chaque entrée d'historique reçoit un identifiant ; on retient la position de défilement de chacune
  // pour la retrouver avec les boutons Précédent / Suivant.
  const positions = {};
  const stamp = () => {
    const st = history.state;
    if (st && st.crId) return st.crId;
    const id = Math.random().toString(36).slice(2);
    try { history.replaceState(Object.assign({}, st, { crId: id }), ""); } catch (e) { /* historique indisponible */ }
    return id;
  };
  let current = stamp();
  let tick = 0;
  window.addEventListener("scroll", () => {
    if (tick) return;
    tick = requestAnimationFrame(() => { tick = 0; if (!busy) positions[current] = window.scrollY; });
  }, { passive: true });
  window.addEventListener("hashchange", () => { current = stamp(); });
  // Retour immédiat au défilement mémorisé, sans animation (même avec « scroll-behavior: smooth »)
  const jump = (y) => {
    if (window.__lenis) { window.__lenis.scrollTo(y, { immediate: true, force: true }); return; }
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, y);
    html.style.scrollBehavior = prev;
  };

  /* ------------------------------------------------------------ Liens */
  function pageLink(a) {
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-ics")) return null;
    const href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto|tel|sms|javascript):/i.test(href)) return null;
    const url = parse(a.href);
    if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return null;
    if (norm(url.pathname) === shown) return null; // même page : main.js s'en charge (défilement)
    return url;
  }
  const linkOf = (e) => (e.target && e.target.closest ? e.target.closest("a[href]") : null);

  // Chargement anticipé dès le survol : la page est souvent prête avant la fin du rideau
  const cache = new Map();
  function prefetch(href) {
    const key = href.split("#")[0];
    if (!cache.has(key)) {
      const page = fetch(key, { credentials: "same-origin" }).then((res) => {
        const type = res.headers.get("content-type") || "";
        if (!res.ok || type.indexOf("text/html") < 0) throw new Error(`page ${res.status}`);
        return res.text().then((text) => ({ text, url: res.url || key }));
      });
      page.catch(() => cache.delete(key));
      cache.set(key, page);
    }
    return cache.get(key);
  }
  const warm = (e) => { const url = pageLink(linkOf(e)); if (url) prefetch(url.href).catch(() => {}); };
  document.addEventListener("pointerover", warm, { passive: true });
  document.addEventListener("touchstart", warm, { passive: true, capture: true });
  document.addEventListener("focusin", warm);

  // Clic sur un lien interne : main.js ferme le rideau et appelle go() ; sans animations
  // (mouvement réduit), c'est ici que la navigation est prise en charge.
  window.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = pageLink(linkOf(e));
    if (!url) return;
    e.preventDefault();
    go(url.href);
  });

  // Dernière position du pointeur : le curseur de la page suivante apparaît au bon endroit
  window.addEventListener("pointermove", (e) => { nav.pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });

  window.addEventListener("popstate", (e) => {
    const id = (e.state && e.state.crId) || null;
    // Précédent / Suivant pendant un changement de page : la dernière demande l'emporte
    if (busy) { pendingPop = true; return; }
    if (norm(location.pathname) === shown) {
      // Simple ancre sur la même page : le navigateur gère, sauf si l'on a pris la main sur le défilement
      if (!used) return;
      current = id || stamp();
      if (id && positions[id] != null) jump(positions[id]);
      else if (location.hash && window.crScrollTo) {
        let target = null;
        try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (err) { /* ancre mal formée */ }
        if (target) window.crScrollTo(target, true);
      }
      return;
    }
    go(location.href, id || true);
  });
  // Le navigateur reprend la main sur le défilement quand on quitte le site (rechargement compris)
  window.addEventListener("pagehide", () => { if (used) history.scrollRestoration = "auto"; });
  window.addEventListener("pageshow", (e) => { if (used && e.persisted) history.scrollRestoration = "manual"; });

  /* --------------------------------------------------------- Navigation */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Navigation classique : le rideau reste fermé, la page suivante l'ouvre
  function hard(href, pop) {
    try { if (html.classList.contains("motion")) sessionStorage.setItem("cr-curtain", "1"); } catch (e) { /* stockage indisponible */ }
    if (pop) location.reload(); else location.href = href;
  }

  // La page reçue est-elle une page du site, construite comme celle-ci ?
  function check(doc) {
    const body = doc.body;
    if (!body || doc.querySelector("base") || !body.querySelector("[data-header]") || !body.querySelector("main#contenu")) throw new Error("page");
    const scripts = Array.from(body.querySelectorAll("script[src]")).map((s) => parse(s.getAttribute("src")));
    if (!scripts.some((u) => /\/assets\/js\/main\.js$/.test(u.pathname))) throw new Error("scripts");
    scripts.concat(Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map((l) => parse(l.getAttribute("href")))).forEach((u) => {
      const had = loaded.has(u.pathname) ? loaded.get(u.pathname) : null;
      if (had !== null && had !== u.search) throw new Error("version");
    });
  }

  // Feuilles de style propres à la page suivante (ex. carte Leaflet) : chargées avant l'affichage
  function styles(doc) {
    const have = new Set(Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((l) => parse(l.href).pathname));
    const add = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).filter((l) => !have.has(parse(l.getAttribute("href")).pathname));
    return Promise.all(add.map((l) => new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = l.getAttribute("href");
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
      const u = parse(link.href);
      loaded.set(u.pathname, u.search);
    })));
  }

  // pop : identifiant de l'entrée d'historique (retour / avancer) ; closed : rideau déjà fermé
  async function go(href, pop, closed) {
    if (busy) return;
    busy = true;
    const target = parse(href);
    const closing = closed ? Promise.resolve() : Promise.race([Promise.resolve().then(() => (leave ? leave() : null)).catch(() => {}), wait(2000)]);
    let page, doc;
    try {
      page = await prefetch(target.href);
      doc = new DOMParser().parseFromString(page.text, "text/html");
      check(doc);
      await Promise.race([styles(doc), wait(4000)]);
      await closing;
    } catch (err) {
      await closing;
      if (pendingPop) { pendingPop = false; busy = false; go(location.href, (history.state && history.state.crId) || true, true); return; }
      hard(target.href, pop);
      return;
    }
    // Précédent / Suivant pressé pendant la fermeture du rideau : on va là où l'historique se trouve maintenant
    if (pendingPop) {
      pendingPop = false;
      busy = false;
      go(location.href, (history.state && history.state.crId) || true, true);
      return;
    }
    try {
      history.scrollRestoration = "manual";
      used = true;
      let path = norm(location.pathname);
      if (!pop) {
        const url = parse(page.url);
        url.hash = target.hash;
        current = Math.random().toString(36).slice(2);
        history.pushState({ crId: current }, "", url.href);
        path = norm(url.pathname);
        restoreY = null;
      } else {
        current = typeof pop === "string" ? pop : stamp();
        restoreY = positions[current] != null ? positions[current] : null;
      }
      await swap(doc, path);
    } catch (err) {
      if (window.console) console.error(err);
      hard(location.href, true);
      return;
    }
    busy = false;
    if (pendingPop) {
      pendingPop = false;
      if (norm(location.pathname) !== shown) go(location.href, (history.state && history.state.crId) || true);
    }
  }

  function syncHead(doc) {
    document.title = doc.title;
    ['meta[name="description"]', 'meta[name="robots"]', 'link[rel="canonical"]', 'meta[property="og:url"]', 'script[type="application/ld+json"]'].forEach((sel) => {
      const cur = document.head.querySelector(sel), next = doc.head.querySelector(sel);
      if (cur && next) cur.replaceWith(document.importNode(next, true));
      else if (cur) cur.remove();
      else if (next) document.head.appendChild(document.importNode(next, true));
    });
    const next = doc.documentElement;
    Array.from(html.attributes).forEach((a) => { if (a.name !== "class" && a.name !== "style" && !next.hasAttribute(a.name)) html.removeAttribute(a.name); });
    Array.from(next.attributes).forEach((a) => { if (a.name !== "class" && a.name !== "style") html.setAttribute(a.name, a.value); });
  }

  // Animations restées attachées à l'ancienne page : arrêtées (les boucles infinies ne tournent pas dans le vide)
  function killOrphans() {
    const gsap = window.gsap;
    if (!gsap) return;
    const detached = (t) => t && t.nodeType === 1 && !t.isConnected;
    const attached = (t) => t && t.nodeType === 1 && t.isConnected;
    gsap.globalTimeline.getChildren(false, true, true).forEach((anim) => {
      const tweens = anim.getChildren ? anim.getChildren(true, true, false) : [anim];
      const targets = [];
      tweens.forEach((t) => { if (t.targets) targets.push.apply(targets, t.targets()); });
      if (targets.some(detached) && !targets.some(attached)) anim.kill();
    });
  }

  function imagesReady() {
    const imgs = Array.from(document.images).filter((i) => !i.complete && i.loading !== "lazy");
    return Promise.race([
      Promise.all(imgs.map((i) => new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }); }))),
      wait(6000),
    ]);
  }

  function runScript(el) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      if (el.src) {
        s.src = el.getAttribute("src");
        s.async = false;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
        const u = parse(s.src);
        loaded.set(u.pathname, u.search);
      } else {
        s.textContent = el.textContent;
        document.body.appendChild(s);
        resolve();
      }
    });
  }

  async function swap(doc, path) {
    // 1. Nettoyage de la page affichée (dans l'ordre inverse de l'installation)
    const fns = leaves;
    leaves = [];
    leave = null;
    fns.reverse().forEach((fn) => { try { fn(); } catch (e) { if (window.console) console.error(e); } });
    if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach((t) => t.kill());

    // 2. En-tête du document et contenu
    syncHead(doc);
    const body = document.body, next = doc.body;
    const scripts = Array.from(next.querySelectorAll("script")).filter((s) => {
      s.remove();
      if (s.type && !/javascript|module/i.test(s.type)) return false;
      if (!s.getAttribute("src")) return true;
      const u = parse(s.getAttribute("src"));
      if (SELF.test(u.pathname)) return false;
      return PAGE_SCRIPT.test(u.pathname) || !loaded.has(u.pathname); // bibliothèque déjà chargée : gardée telle quelle
    });
    const motion = html.classList.contains("motion");
    const keep = ["js", "motion", "cursor-on"].filter((c) => html.classList.contains(c));
    html.className = keep.concat(motion ? ["curtain-in"] : []).join(" ");
    Array.from(body.attributes).forEach((a) => body.removeAttribute(a.name));
    Array.from(next.attributes).forEach((a) => body.setAttribute(a.name, a.value));
    const frag = document.createDocumentFragment();
    Array.from(next.childNodes).forEach((n) => frag.appendChild(document.adoptNode(n)));
    while (body.firstChild) body.removeChild(body.firstChild);
    body.appendChild(frag);
    killOrphans();
    jump(0);
    // ScrollTrigger garde en cache la position de défilement de l'ancienne page (et la remettrait après
    // son recalcul) : on la remet à zéro par sa propre fonction de défilement, puis on vide sa mémoire
    if (window.ScrollTrigger) { window.ScrollTrigger.getScrollFunc(window)(0); window.ScrollTrigger.clearScrollMemory(); }
    shown = path;
    try { sessionStorage.removeItem("cr-curtain"); } catch (e) { /* stockage indisponible */ }

    // 3. Scripts de la page, dans l'ordre. Comme au chargement classique, main.js ne lance ses animations
    // qu'une fois tous les scripts exécutés (nav.ready), et recalcule tout une fois les images chargées.
    nav.soft = true;
    let ready;
    nav.ready = new Promise((r) => { ready = r; });
    nav.loaded = nav.ready.then(imagesReady);
    let failed = null;
    const onError = (e) => { if (e.filename && PAGE_SCRIPT.test(parse(e.filename).pathname)) failed = e.error || e.message; };
    window.addEventListener("error", onError);
    try {
      for (const s of scripts) await runScript(s);
    } finally {
      window.removeEventListener("error", onError);
    }
    if (failed) throw failed;
    ready();
    // Sans animations (mouvement réduit), main.js ne gère pas le défilement : position retrouvée
    // au retour arrière, sinon ancre de l'adresse
    if (!html.classList.contains("motion")) {
      const y = nav.takeScroll();
      let anchor = null;
      try { anchor = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { /* ancre mal formée */ }
      if (y != null) jump(y);
      else if (anchor) {
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        anchor.scrollIntoView();
        html.style.scrollBehavior = prev;
      }
    }

    // 4. Lecteurs d'écran : annonce de la nouvelle page
    const say = document.createElement("p");
    say.className = "visually-hidden";
    say.setAttribute("role", "status");
    body.appendChild(say);
    setTimeout(() => { say.textContent = document.title; }, 120);
  }

  const nav = window.__crNav = {
    soft: false,
    pointer: null,
    ready: Promise.resolve(),
    loaded: Promise.resolve(),
    onLeave(fn) { leaves.push(fn); },
    setLeave(fn) { leave = fn; },
    takeScroll() { const y = restoreY; restoreY = null; return y; },
    prefetch,
    go,
  };
})();
