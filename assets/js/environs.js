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
