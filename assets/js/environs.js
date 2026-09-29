/* Page « Que faire aux alentours » : filtres animés, carte interactive, idées empilées */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const html = document.documentElement;
  const motion = html.classList.contains("motion") && !!window.gsap;
  const gsap = window.gsap;
  const places = $$(".place");
  let revealTriggers = [];
  // Au premier filtrage, on abandonne l’apparition au défilement : toutes les cartes deviennent visibles
  function revealAllPlaces() {
    if (!revealTriggers.length) return;
    revealTriggers.forEach((t) => t.kill());
    revealTriggers = [];
    gsap.set(places, { opacity: 1, y: 0 });
  }
  const CATS = { balades: "Balades & panoramas", villages: "Villages & patrimoine", lacs: "Lacs & activités" };

  /* ------------------------------------------------------------ Filtres */
  const filters = $("[data-filters]");
  const status = $("[data-filter-status]");
  const grid = $("[data-places]");
  if (grid && filters) {
    grid.addEventListener("focusin", (e) => {
      const fb = filters.getBoundingClientRect().bottom;
      const t = e.target.getBoundingClientRect().top;
      if (t < fb + 8) {
        const y = window.scrollY + t - fb - 24;
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
      }
    });
  }
  if (filters) {
    filters.hidden = false;
    const chips = $$("[data-filter]", filters);
    let filterTl = null;
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        if (chip.getAttribute("aria-pressed") === "true") return;
        const cat = chip.dataset.filter;
        chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
        const shown = places.filter((p) => cat === "all" || p.dataset.cat === cat);
        const apply = () => places.forEach((p) => { p.hidden = !shown.includes(p); });
        // Si la grille a défilé hors de l’écran, on remonte en douceur jusqu’aux filtres
        const bringBack = () => {
          if (!grid || grid.getBoundingClientRect().top >= 0) return;
          // La page vient de raccourcir : on part de la position réelle (le navigateur a pu la ramener)
          const top = Math.max(0, grid.getBoundingClientRect().top + window.scrollY - filters.offsetHeight - 110);
          if (window.__lenis) { window.__lenis.resize(); window.__lenis.scrollTo(top, { duration: 0.9, force: true }); }
          else window.scrollTo({ top, behavior: motion ? "smooth" : "auto" });
        };
        if (motion) {
          // Fondu sortant des cartes visibles, puis entrée en cascade des cartes retenues.
          // Pas de positionnement absolu : la grille garde toujours sa mise en page normale.
          if (filterTl) filterTl.progress(1).kill();
          revealAllPlaces();
          const visible = places.filter((p) => !p.hidden);
          filterTl = gsap.timeline({ onComplete: () => { filterTl = null; window.ScrollTrigger && window.ScrollTrigger.refresh(); } })
            .to(visible, { opacity: 0, y: 14, duration: 0.22, stagger: 0.012, ease: "power2.in", overwrite: true })
            .add(() => { apply(); bringBack(); })
            .fromTo(shown, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out", overwrite: true });
        } else {
          apply();
          bringBack();
        }
        if (status) status.textContent = `${shown.length} idée${shown.length > 1 ? "s" : ""} affichée${shown.length > 1 ? "s" : ""}`;
      });
    });
  }

  /* ------------------------------------------------ Apparition des cartes */
  if (motion && window.ScrollTrigger) {
    gsap.set(places, { opacity: 0, y: 40 });
    revealTriggers = window.ScrollTrigger.batch(places, {
      start: "top 90%",
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", overwrite: true }),
    });

    const ideas = $$("[data-ideas] .idea");
    ideas.forEach((idea, i) => {
      gsap.from(idea, { opacity: 0, y: 60, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: idea, start: "top 92%" } });
      const next = ideas[i + 1];
      if (next) {
        gsap.to(idea, { scale: 0.93, ease: "none", scrollTrigger: { trigger: next, start: "top 75%", end: "top 25%", scrub: true } });
      }
    });
  }

  /* ------------------------------ Cartes retournables : la photo du lieu au dos */
  const withPhoto = places.filter((p) => p.dataset.photo);
  let openLightbox = null;
  if (withPhoto.length && grid) {
    const use = $("use", grid);
    const sprite = use ? use.getAttribute("href").split("#")[0] : "assets/img/icons.svg";
    const ic = (id) => `<svg class="icon" aria-hidden="true"><use href="${sprite}#i-${id}"/></svg>`;
    const esc = (v) => String(v || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const touch = window.matchMedia("(hover: none)").matches;
    const credit = (d) => `Photo&nbsp;: <a href="${esc(d.photoSource)}" target="_blank" rel="noopener">${esc(d.photoCredit)}<span class="visually-hidden"> sur Wikimedia Commons (nouvel onglet)</span></a> · <a href="${esc(d.photoLicenseUrl)}" target="_blank" rel="noopener">${esc(d.photoLicense)}<span class="visually-hidden"> (licence, nouvel onglet)</span></a>`;

    const hint = document.createElement("p");
    hint.className = "places-hint";
    hint.innerHTML = `${ic("image")}<span>${touch ? "Touchez" : "Cliquez sur"} une carte pour la retourner et découvrir le lieu en photo.</span>`;
    grid.before(hint);

    // Charge la photo au premier survol (ou au retournement) : rien n’est téléchargé tant qu’on ne s’y intéresse pas
    const loadPhoto = (p) => {
      const img = $(".place__photo img", p);
      if (!img || img.getAttribute("src")) return;
      const back = $(".place__back", p);
      const ready = () => back.classList.add("is-ready");
      img.addEventListener("load", ready, { once: true });
      img.addEventListener("error", ready, { once: true });
      img.sizes = "(max-width: 700px) 92vw, 420px";
      img.srcset = `${p.dataset.photo}-800.webp 800w, ${p.dataset.photo}-1600.webp 1600w`;
      img.src = `${p.dataset.photo}-800.webp`;
      if (img.complete && img.naturalWidth) ready();
    };

    const flip = (p, toBack) => {
      if (p.classList.contains("is-flipped") === toBack) return;
      const inner = $(".place__inner", p), front = $(".place__front", p), back = $(".place__back", p);
      const hadFocus = p.contains(document.activeElement);
      if (toBack) loadPhoto(p);
      p.classList.toggle("is-flipped", toBack);
      front.inert = toBack;
      back.inert = !toBack;
      if (motion) {
        gsap.to(inner, { rotationY: toBack ? 180 : 0, duration: 1.1, ease: "power3.inOut", overwrite: "auto" });
        // La carte se soulève pendant qu’elle tourne, puis se repose
        gsap.fromTo(inner, { z: 0 }, { z: 90, duration: 0.55, ease: "power2.out", yoyo: true, repeat: 1, overwrite: false });
      }
      if (hadFocus) (toBack ? $("[data-zoom]", back) : $(".place__turn", front)).focus({ preventScroll: true });
    };

    withPhoto.forEach((p) => {
      const d = p.dataset;
      const name = $("h3", p).textContent.trim();
      const front = document.createElement("div");
      front.className = "place__face place__front";
      front.setAttribute("data-cursor", "Photo");
      while (p.firstChild) front.appendChild(p.firstChild);
      const turn = document.createElement("button");
      turn.type = "button";
      turn.className = "place__turn";
      turn.setAttribute("aria-label", `Voir la photo : ${name}`);
      turn.innerHTML = ic("image");
      front.appendChild(turn);

      const back = document.createElement("div");
      back.className = "place__face place__back";
      back.innerHTML = `
        <button class="place__photo" type="button" data-cursor="Retourner" aria-label="Retourner la carte : ${esc(name)}"><img alt="${esc(d.photoAlt)}" width="800" height="533" decoding="async"></button>
        <div class="place__caption">
          <span class="place__cat">${esc(CATS[d.cat])}</span>
          <p class="place__name">${esc(name)}</p>
          <p class="place__credit">${credit(d)}</p>
          <div class="place__back-actions">
            <button type="button" class="place__btn place__btn--main" data-zoom>${ic("maximize-2")}Agrandir</button>
          </div>
        </div>`;
      back.inert = true;

      const inner = document.createElement("div");
      inner.className = "place__inner";
      inner.append(front, back);
      p.appendChild(inner);
      p.classList.add("place--flip");
      if (motion) gsap.set(inner, { rotationY: 0, z: 0 });

      front.addEventListener("click", (e) => {
        if (e.target.closest("a, input, select, textarea, button:not(.place__turn)")) return;
        const sel = window.getSelection && String(window.getSelection());
        if (sel && front.contains(window.getSelection().anchorNode)) return; // on laisse sélectionner le texte
        flip(p, true);
      });
      // Au dos : « Agrandir » ouvre la visionneuse, un clic n’importe où ailleurs sur la photo retourne la carte
      back.addEventListener("click", (e) => {
        if (e.target.closest("[data-zoom]")) openLightbox(p);
        else if (!e.target.closest("a")) flip(p, false);
      });
      p.addEventListener("pointerenter", () => loadPhoto(p), { once: true });
      front.addEventListener("focusin", () => loadPhoto(p), { once: true });
    });

    /* ---------------------------------------------- Visionneuse plein écran */
    let lb = null, list = [], index = 0, returnTo = null, inerted = [];
    const hiRes = () => window.innerWidth * (window.devicePixelRatio || 1) > 1000;
    const build = () => {
      lb = document.createElement("div");
      lb.className = "lightbox";
      lb.hidden = true;
      lb.setAttribute("role", "dialog");
      lb.setAttribute("aria-modal", "true");
      lb.setAttribute("aria-labelledby", "lightbox-title");
      lb.innerHTML = `
        <div class="lightbox__backdrop" data-lb-close></div>
        <figure class="lightbox__figure">
          <img class="lightbox__img" alt="">
          <figcaption class="lightbox__caption">
            <span class="lightbox__cat"></span>
            <p class="lightbox__title" id="lightbox-title"></p>
            <p class="lightbox__desc"></p>
            <p class="lightbox__credit"></p>
          </figcaption>
        </figure>
        <p class="lightbox__count" aria-live="polite"></p>
        <button type="button" class="lightbox__btn lightbox__nav lightbox__nav--prev" data-lb-step="-1" aria-label="Photo précédente">${ic("chevron-left")}</button>
        <button type="button" class="lightbox__btn lightbox__nav lightbox__nav--next" data-lb-step="1" aria-label="Photo suivante">${ic("chevron-right")}</button>
        <button type="button" class="lightbox__btn lightbox__close" data-lb-close aria-label="Fermer la photo">${ic("x")}</button>`;
      document.body.appendChild(lb);
      lb.addEventListener("click", (e) => {
        if (e.target.closest("[data-lb-close]")) close();
        const s = e.target.closest("[data-lb-step]");
        if (s) step(+s.dataset.lbStep);
      });
      // Écouté sur tout le document : un clic dans le vide ne doit pas désactiver le clavier
      document.addEventListener("keydown", (e) => {
        if (lb.hidden) return;
        if (e.key === "Escape") { e.preventDefault(); close(); }
        else if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
      });
      // Balayage sur mobile
      let x0 = null, y0 = 0;
      lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      lb.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
      }, { passive: true });
    };
    const render = (dir) => {
      const p = list[index], d = p.dataset;
      const fig = $(".lightbox__figure", lb), img = $(".lightbox__img", lb);
      const apply = () => {
        const low = `${d.photo}-800.webp`, high = `${d.photo}-1600.webp`;
        img.alt = d.photoAlt;
        img.src = low;
        if (hiRes()) {
          const hi = new Image();
          hi.onload = () => { if (list[index] === p) img.src = high; };
          hi.src = high;
        }
        $(".lightbox__cat", lb).textContent = CATS[d.cat];
        $(".lightbox__title", lb).textContent = $("h3", p).textContent.trim();
        $(".lightbox__desc", lb).textContent = d.photoAlt;
        $(".lightbox__credit", lb).innerHTML = credit(d);
        $(".lightbox__count", lb).textContent = list.length > 1 ? `${index + 1} / ${list.length}` : "";
      };
      if (dir && motion) {
        gsap.to(fig, { x: -50 * dir, opacity: 0, duration: 0.24, ease: "power2.in", overwrite: true, onComplete: () => {
          apply();
          gsap.fromTo(fig, { x: 50 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
        } });
      } else apply();
    };
    const step = (n) => {
      if (list.length < 2) return;
      index = (index + n + list.length) % list.length;
      render(n);
    };
    openLightbox = (p) => {
      if (!lb) build();
      list = withPhoto.filter((x) => !x.hidden);
      index = Math.max(0, list.indexOf(p));
      returnTo = document.activeElement;
      render(0);
      $$(".lightbox__nav", lb).forEach((b) => { b.hidden = list.length < 2; });
      lb.hidden = false;
      // Le reste de la page devient inaccessible (clavier et lecteurs d’écran) tant que la photo est ouverte
      inerted = Array.from(document.body.children).filter((el) => el !== lb && !el.classList.contains("cursor") && !el.inert);
      inerted.forEach((el) => { el.inert = true; });
      if (window.__lenis) window.__lenis.stop();
      if (!window.__lenis || window.matchMedia("(pointer: coarse)").matches) html.classList.add("lightbox-lock");
      if (motion) {
        gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out", overwrite: true });
        gsap.fromTo($(".lightbox__figure", lb), { y: 34, scale: 0.95, opacity: 0, x: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.05, overwrite: true });
      }
      $(".lightbox__close", lb).focus({ preventScroll: true });
    };
    const close = () => {
      if (!lb || lb.hidden || lb.dataset.closing) return;
      lb.dataset.closing = "1";
      const end = () => {
        delete lb.dataset.closing;
        lb.hidden = true;
        inerted.forEach((el) => { el.inert = false; });
        inerted = [];
        html.classList.remove("lightbox-lock");
        if (window.__lenis) window.__lenis.start();
        if (returnTo && returnTo.isConnected) returnTo.focus({ preventScroll: true });
      };
      if (motion) gsap.to(lb, { opacity: 0, duration: 0.32, ease: "power2.in", overwrite: true, onComplete: end });
      else end();
    };
  }

  /* ----------------------------------------------------- Carte Leaflet */
  const mapEl = $("#env-map");
  let map = null;
  const markers = {};
  const gmaps = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lng}`;

  function icon(kind) {
    const big = kind === "mariage";
    const s = big ? 36 : 30;
    return window.L.divIcon({
      className: "env-marker-wrap",
      html: `<span class="env-marker env-marker--${kind}"></span>`,
      iconSize: [s, s],
      iconAnchor: [s / 2, Math.round(s * 1.2)],
      popupAnchor: [0, -Math.round(s * 1.15)],
    });
  }

  function initMap() {
    if (map || !mapEl || !window.L) return;
    const L = window.L;
    mapEl.innerHTML = "";
    const touch = window.matchMedia("(pointer: coarse)").matches;
    map = L.map(mapEl, { scrollWheelZoom: false, dragging: !touch, tap: false, zoomSnap: 0.5, zoomControl: false });
    L.control.zoom({ zoomInTitle: "Zoom avant", zoomOutTitle: "Zoom arrière" }).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    map.on("popupopen", (ev) => {
      const close = ev.popup.getElement() && ev.popup.getElement().querySelector(".leaflet-popup-close-button");
      if (close) { close.setAttribute("aria-label", "Fermer"); close.title = "Fermer"; }
    });
    // Fond Esri « World Topo » (relief doux, sans clé API) ; repli sur OpenStreetMap
    // si ses tuiles ne répondent pas.
    const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    const topo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: `Fond &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, USGS · ${OSM}`,
    }).addTo(map);
    let failed = 0;
    topo.on("tileerror", () => {
      if (++failed !== 4) return;
      map.removeLayer(topo);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: OSM }).addTo(map);
    });

    const wedding = [
      { key: "hery", lat: 45.79708, lng: 6.01379, name: "Mairie & église d’Héry-sur-Alby", sub: "Cérémonies · 14h30 et 15h30" },
      { key: "chateau", lat: 45.7348, lng: 6.0033, name: "Château de Saint-Offenge", sub: "Vin d’honneur 17h00 · Dîner 20h30" },
    ];
    const bounds = [];
    wedding.forEach((w) => {
      markers[w.key] = L.marker([w.lat, w.lng], { icon: icon("mariage"), title: w.name, zIndexOffset: 1000 })
        .bindPopup(`<strong>${w.name}</strong>${w.sub}<br><a href="${gmaps(w.lat, w.lng)}" target="_blank" rel="noopener">Itinéraire<span class="visually-hidden"> (nouvel onglet)</span></a>`)
        .addTo(map);
      bounds.push([w.lat, w.lng]);
    });
    places.forEach((p) => {
      if (p.dataset.marker) { markers[p.id] = markers[p.dataset.marker]; return; }
      const lat = +p.dataset.lat, lng = +p.dataset.lng;
      const name = $("h3", p).textContent;
      markers[p.id] = L.marker([lat, lng], { icon: icon(p.dataset.cat), title: name })
        .bindPopup(`<strong>${name}</strong>${CATS[p.dataset.cat]}<br><a href="${gmaps(lat, lng)}" target="_blank" rel="noopener">Itinéraire<span class="visually-hidden"> (nouvel onglet)</span></a>`)
        .addTo(map);
      bounds.push([lat, lng]);
    });
    map.fitBounds(bounds, { padding: [36, 36] });
    map.on("click focus", () => { map.scrollWheelZoom.enable(); if (!touch) map.dragging.enable(); });
    map.on("blur", () => map.scrollWheelZoom.disable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());
  }

  if (mapEl) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { initMap(); io.disconnect(); }
      }, { rootMargin: "400px" });
      io.observe(mapEl);
    } else {
      initMap();
    }
  }

  // « Voir sur la carte »
  places.forEach((p) => {
    const btn = $("[data-show-on-map]", p);
    if (!btn || !mapEl) return;
    btn.hidden = false;
    btn.addEventListener("click", () => {
      initMap();
      const m = markers[p.id];
      if (window.crScrollTo) window.crScrollTo(mapEl.closest(".env-map-wrap") || mapEl);
      else mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
      if (map && m) {
        setTimeout(() => {
          map.flyTo(m.getLatLng(), 13, { duration: 1.2 });
          map.once("moveend", () => m.openPopup());
        }, 700);
      }
    });
  });
})();
