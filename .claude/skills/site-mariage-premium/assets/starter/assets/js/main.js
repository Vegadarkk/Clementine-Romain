/* ==========================================================================
   Clémentine & Romain — scripts communs
   - Fonctionne sans animations (visiteurs « mouvement réduit » ou JS partiel)
   - Animations : GSAP + ScrollTrigger + SplitText, défilement fluide Lenis
   ========================================================================== */
(() => {
  "use strict";

  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const hasGsap = !!(gsap && ST);
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  window.__crReady = true;
  if (!hasGsap) html.classList.remove("motion", "intro", "curtain-in");
  // Promesse résolue quand l'écran « Ouvrir l'invitation » est fermé (ou s'il n'y en a pas)
  let gateDone = () => {};
  window.__crGate = new Promise((resolve) => { gateDone = resolve; });
  const motion = html.classList.contains("motion");
  const store = (() => { try { return window.sessionStorage; } catch (e) { return null; } })();

  // Navigation sans rechargement (nav.js) : tout ce que cette page pose sur window, document ou les
  // bibliothèques est retiré au changement de page, pour que la page suivante reparte de zéro.
  const nav = window.__crNav || null;
  const leaving = [];
  let alive = true;
  const onLeave = (fn) => { leaving.push(fn); };
  if (nav) nav.onLeave(() => { alive = false; leaving.splice(0).reverse().forEach((fn) => { try { fn(); } catch (e) { /* on continue le nettoyage */ } }); });
  const listen = (target, type, fn, opts) => {
    if (target.addEventListener) target.addEventListener(type, fn, opts); else target.addListener(fn);
    onLeave(() => { if (target.removeEventListener) target.removeEventListener(type, fn, opts); else target.removeListener(fn); });
  };
  const onTick = (fn) => { gsap.ticker.add(fn); onLeave(() => gsap.ticker.remove(fn)); };

  /* ------------------------------------------------------------------ Outils */
  const toastEl = $("[data-toast]");
  let toastTimer;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2800);
  }
  onLeave(() => clearTimeout(toastTimer));
  window.crToast = toast;

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await copyText(btn.getAttribute("data-copy"));
      toast(ok ? "Adresse copiée dans le presse-papiers ✓" : "Impossible de copier, sélectionnez l’adresse manuellement");
    });
  });

  /* --------------------------------------------------------- Défilement fluide */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 0.95, smoothWheel: true, anchors: true });
    lenis.on("scroll", ST.update);
    onTick((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    html.classList.add("lenis");
    onLeave(() => { lenis.destroy(); if (window.__lenis === lenis) window.__lenis = null; });
  }
  window.__lenis = lenis;
  // Le décalage sous l’en-tête vient du CSS (scroll-padding-top / scroll-margin-top),
  // respecté à la fois par Lenis et par le défilement natif.
  const scrollToEl = (el, immediate = false) => {
    if (!el) return;
    if (lenis) { lenis.resize(); lenis.scrollTo(el, { immediate, force: true }); }
    else el.scrollIntoView({ behavior: immediate ? "auto" : "smooth", block: "start" });
  };
  window.crScrollTo = scrollToEl;

  // Rotation d'une tablette / changement de format : on reste sur la même section.
  // Les épinglages (programme, carte) sont créés ou retirés selon la taille d'écran et la position
  // retombe à 0 avant même les événements « resize ». On retient donc en continu la section affichée,
  // puis on reprend celle d'avant le changement une fois les recalculs terminés.
  let keepEl = null;
  const seen = [];
  const sectionInView = () => {
    if (window.scrollY <= 0) return null;
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 3);
    const sec = el && el.closest("main > *, .site-footer");
    // Section épinglée : on retient la section elle-même (l'enveloppe de GSAP disparaît au changement)
    return sec && sec.classList.contains("pin-spacer") ? sec.firstElementChild : sec;
  };
  let seenTick = 0;
  listen(window, "scroll", () => {
    if (seenTick) return;
    seenTick = requestAnimationFrame(() => {
      seenTick = 0;
      seen.push({ t: performance.now(), el: sectionInView() });
      if (seen.length > 30) seen.shift();
    });
  }, { passive: true });
  const docW = () => document.documentElement.clientWidth;
  let lastW = docW();
  const onFormatChange = () => {
    if (keepEl) return;
    const before = performance.now() - 250;
    for (let i = seen.length - 1; i >= 0; i--) if (seen[i].t < before) { keepEl = seen[i].el; break; }
  };
  listen(window, "resize", () => { if (docW() !== lastW) { lastW = docW(); onFormatChange(); } }, { passive: true });
  ["(min-width: 1024px) and (min-height: 620px)", "(min-width: 900px) and (min-height: 640px)"].forEach((q) => {
    listen(window.matchMedia(q), "change", onFormatChange);
  });

  /* ---------------------------------------------------------------- En-tête */
  const header = $("[data-header]");
  const hero = $(".hero, .page-hero");
  if (header && hero && hero.matches(".page-hero:not(.page-hero--soft):not(.page-hero--illustrated)")) header.classList.add("on-dark");
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 30);
      const menuOpen = document.body.classList.contains("menu-open");
      header.classList.toggle("is-hidden", !menuOpen && y > lastY && y > (hero ? hero.offsetHeight * 0.6 : 400));
    }
    lastY = y;
  }
  listen(window, "scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------ Musique d’ambiance */
  // Lecture automatique dès l’arrivée. Les navigateurs bloquent le son tant que le visiteur n’a pas
  // interagi : la musique démarre alors au premier clic, toucher ou touche du clavier.
  // Si le visiteur la coupe, ce choix est mémorisé et respecté lors de ses prochaines visites.
  const musicBtn = $("[data-music]");
  if (musicBtn) {
    const KEY = "cr-music";
    const store = (() => { try { return window.sessionStorage; } catch (e) { return null; } })();
    const read = () => { try { return JSON.parse(store.getItem(KEY)) || {}; } catch (e) { return {}; } };
    const write = (v) => { try { store.setItem(KEY, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } };
    const OFF = "cr-music-off";
    const local = (() => { try { return window.localStorage; } catch (e) { return null; } })();
    const refused = () => { try { return local.getItem(OFF) === "1"; } catch (e) { return false; } };
    const remember = (off) => { try { if (off) local.setItem(OFF, "1"); else local.removeItem(OFF); } catch (e) { /* stockage indisponible */ } };
    const stateEl = $("[data-music-state]", musicBtn);
    const VOL = 0.32;
    let audio = null, fadeId = 0, wanted = false;
    // Un seul lecteur pour toute la visite : il survit aux changements de page (nav.js), la musique continue
    const ensure = () => {
      if (audio) return audio;
      const src = new URL(musicBtn.dataset.src, location.href).href;
      const live = window.__crAudio;
      if (live && live.src === src) { audio = live; return audio; }
      if (live) live.pause();
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0;
      window.__crAudio = audio;
      return audio;
    };
    // Changement de page : les fondus en cours s'arrêtent ; une musique coupée s'arrête pour de bon
    onLeave(() => { fadeId++; if (audio && !wanted) audio.pause(); });
    const fade = (to, ms, done) => {
      const id = ++fadeId, from = audio.volume, t0 = performance.now();
      const step = (now) => {
        if (id !== fadeId) return;
        const k = Math.min(1, (now - t0) / ms);
        try { audio.volume = from + (to - from) * k; } catch (e) { /* iOS : volume fixe */ }
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      };
      requestAnimationFrame(step);
    };
    const render = (playing) => {
      musicBtn.setAttribute("aria-pressed", String(playing));
      musicBtn.classList.toggle("is-playing", playing);
      if (stateEl) stateEl.textContent = playing ? "Couper la musique" : "Mettre la musique";
    };
    const save = () => write({ ...read(), on: wanted, t: audio ? audio.currentTime : read().t || 0 });
    const play = () => {
      const a = ensure();
      const saved = read();
      if (saved.t && !a.currentTime) { try { a.currentTime = saved.t; } catch (e) { /* pas encore chargé */ } }
      return a.play().then(() => { render(true); fade(VOL, 2200); musicBtn.classList.remove("is-waiting"); });
    };
    const stop = () => {
      render(false);
      if (!audio) return;
      fade(0, 700, () => { if (!wanted) audio.pause(); });
    };
    musicBtn.addEventListener("click", () => {
      // En attente du premier geste, rien n’est encore audible : un clic sur le bouton lance la musique
      wanted = musicBtn.getAttribute("aria-pressed") !== "true";
      musicBtn.classList.remove("is-waiting");
      stopWaiting();
      remember(!wanted);
      if (wanted) play().catch(() => { wanted = false; render(false); });
      else stop();
      save();
    });
    // Page suivante : on mémorise la position pour reprendre au même endroit
    listen(window, "pagehide", save);
    listen(document, "click", (e) => { if (e.target.closest("a[href]")) save(); }, true);
    // Premier geste du visiteur (clic, toucher, touche) : on relance la lecture bloquée
    const GESTURES = ["pointerdown", "pointerup", "touchend", "keydown", "click"];
    const resume = (e) => {
      if (e.target && e.target.closest && e.target.closest("[data-music], [data-gate]")) return;
      if (!wanted) { stopWaiting(); return; }
      play().then(() => { stopWaiting(); save(); }).catch(() => { /* pas encore un geste valable : on réessaie au suivant */ });
    };
    function stopWaiting() { GESTURES.forEach((g) => window.removeEventListener(g, resume, true)); }
    const saved = read();
    // Démarrage automatique, sauf si le visiteur a coupé la musique (dans cette visite ou une précédente)
    /* ---------- Écran « Ouvrir l'invitation » : son clic autorise la musique ---------- */
    const gate = $("[data-gate]");
    const gateOn = !!gate && html.classList.contains("gate");
    let hidden = [];
    const closeGate = () => {
      if (!gateOn || gate.dataset.closing) return;
      gate.dataset.closing = "1";
      try { store.setItem("cr-gate", "1"); store.setItem("cr-intro", "1"); } catch (e) { /* stockage indisponible */ }
      const end = () => {
        html.classList.remove("gate");
        hidden.forEach((el) => { el.inert = false; });
        if (window.__lenis) window.__lenis.start();
        gateDone();
      };
      if (motion && gsap) gsap.to(gate, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut", onComplete: end });
      else end();
    };
    if (gateOn) {
      hidden = $$("body > *").filter((el) => el !== gate && !el.classList.contains("cursor") && !el.inert);
      hidden.forEach((el) => { el.inert = true; });
      if (window.__lenis) window.__lenis.stop();
      const openBtn = $("[data-gate-open]", gate);
      openBtn.addEventListener("click", () => {
        wanted = true;
        remember(false);
        stopWaiting();
        musicBtn.classList.remove("is-waiting");
        play().then(save).catch(() => render(false)); // clic = geste autorisé : la musique démarre
        closeGate();
      });
      const silent = () => {
        wanted = false;
        remember(true);
        stopWaiting();
        musicBtn.classList.remove("is-waiting");
        stop();
        if (stateEl) stateEl.textContent = "Un peu de musique\u00a0?";
        save();
        closeGate();
      };
      $("[data-gate-silent]", gate).addEventListener("click", silent);
      gate.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); silent(); } });
      if (motion && gsap) {
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .fromTo($(".gate-screen__mono", gate), { clipPath: "inset(100% 0% 0% 0%)", y: 20 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1.4, ease: "power3.inOut" })
          .fromTo($$(".gate-screen__inner > :not(svg)", gate), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.7)
          .fromTo($$(".gate-screen__flower", gate), { opacity: 0, scale: 0.6, rotation: (i) => (i ? 120 : -20) }, { opacity: (i) => (window.innerWidth < 560 ? [0.55, 0.7][i] : 1), scale: 1, rotation: (i) => (i ? 160 : 0), duration: 1.6, ease: "back.out(1.3)", stagger: 0.15 }, 0.4);
      }
      requestAnimationFrame(() => openBtn.focus({ preventScroll: true }));
    } else {
      gateDone();
    }

    if (saved.on !== false && !refused()) {
      wanted = true;
      // Écran d'accueil affiché : il ne se ferme jamais seul, l'invité clique pour entrer ; la musique
      // attend ce clic (« Ouvrir l'invitation ») même si le navigateur autoriserait le son d'emblée
      if (!gateOn) play().then(save).catch(() => {
        musicBtn.classList.add("is-waiting");
        if (stateEl) stateEl.textContent = "Un peu de musique\u00a0?";
        GESTURES.forEach((g) => listen(window, g, resume, true));
      });
    } else {
      render(false);
      if (stateEl) stateEl.textContent = "Un peu de musique\u00a0?";
      // Une seule suggestion discrète par visite
      if (!read().hinted) {
        const onFirstScroll = () => {
          if (window.scrollY < window.innerHeight * 0.6) return;
          window.removeEventListener("scroll", onFirstScroll);
          write({ ...read(), hinted: true });
          setTimeout(() => {
            if (wanted) return;
            musicBtn.classList.add("is-hinting");
            setTimeout(() => musicBtn.classList.remove("is-hinting"), 4200);
          }, 1200);
        };
        listen(window, "scroll", onFirstScroll, { passive: true });
      }
    }
  }
  // Pas de bouton musique sur la page : pas d’écran d’accueil non plus
  if (!musicBtn) { html.classList.remove("gate"); gateDone(); }

  /* ------------------------------------------------------- Retour en haut */
  const toTop = $("[data-to-top]");
  if (toTop) {
    const ring = $(".to-top__progress", toTop);
    let shown = false;
    const update = () => {
      const y = window.scrollY, vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      if (ring) ring.style.strokeDashoffset = String(1 - (max > 0 ? Math.min(1, y / max) : 0));
      // Visible une fois arrivé dans le dernier tiers de la page (appel à répondre, pied de page…)
      const show = y > vh * 0.9 && max - y < Math.max(vh * 1.8, max * 0.2);
      if (show !== shown) {
        shown = show;
        toTop.classList.toggle("is-shown", show);
        toTop.tabIndex = show ? 0 : -1;
      }
    };
    listen(window, "scroll", update, { passive: true });
    listen(window, "resize", update, { passive: true });
    update();
    toTop.addEventListener("click", () => {
      const brand = $(".brand");
      const done = () => brand && brand.focus({ preventScroll: true });
      if (lenis) lenis.scrollTo(0, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), force: true, onComplete: done });
      else { window.scrollTo({ top: 0, behavior: motion ? "smooth" : "auto" }); done(); }
    });
  }

  /* ------------------------------------------------ Plan interactif du domaine */
  const domaine = $("[data-domaine]");
  if (domaine) {
    const spots = $$("[data-spot]", domaine);
    const slides = $$("[data-slide]", domaine);
    const nav = $(".domaine__nav", domaine);
    const count = $("[data-count]", domaine);
    const status = $("[data-domaine-status]", domaine);
    let current = 0;
    const show = (i, announce = true) => {
      current = (i + slides.length) % slides.length;
      const slide = slides[current];
      slides.forEach((s) => {
        const on = s === slide;
        s.classList.toggle("is-active", on);
        s.toggleAttribute("inert", !on);
        s.setAttribute("aria-hidden", String(!on));
      });
      spots.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.spot === slide.dataset.slide)));
      if (count) count.textContent = String(current + 1).padStart(2, "0");
      if (announce && status) status.textContent = `Lieu ${current + 1} sur ${slides.length} : ${$("h3", slide).textContent}`;
    };
    spots.forEach((b) => b.addEventListener("click", () => show(slides.findIndex((s) => s.dataset.slide === b.dataset.spot))));
    if (nav) {
      nav.hidden = false;
      $$("[data-step]", nav).forEach((b) => b.addEventListener("click", () => show(current + Number(b.dataset.step))));
    }
    const fromHash = slides.findIndex((sl) => location.hash === `#${sl.id}`);
    show(fromHash > -1 ? fromHash : 0, false);
    if (motion) listen(document, "cr:animations", () => {
      gsap.from(spots, { scale: 0, duration: 0.7, ease: "back.out(2)", stagger: 0.07, scrollTrigger: { trigger: domaine, start: "top 70%" } });
    });
  }

  /* ------------------------------------------------------------ Menu mobile */
  const toggle = $(".nav-toggle");
  const menu = $("#menu-mobile");
  if (toggle && menu) {
    const outside = [$(".skip-link"), $(".brand"), $("main"), $(".site-footer"), $("[data-to-top]"), $("[data-music]")].filter(Boolean);
    const setMenu = (open) => {
      outside.forEach((el) => el.toggleAttribute("inert", open));
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      if (open) {
        menu.removeAttribute("inert");
        header && header.classList.remove("is-hidden");
        lenis && lenis.stop();
        setTimeout(() => { const first = $("a", menu); first && first.focus(); }, 350);
      } else {
        menu.setAttribute("inert", "");
        lenis && lenis.start();
      }
    };
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    listen(document, "keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    listen(window.matchMedia("(min-width: 961px)"), "change", (e) => e.matches && setMenu(false));
  }

  /* ---------------------------------------------------------- Compte à rebours */
  $$("[data-countdown]").forEach((el) => {
    const target = new Date(el.getAttribute("data-countdown")).getTime();
    const units = { days: $("[data-unit=days]", el), hours: $("[data-unit=hours]", el), minutes: $("[data-unit=minutes]", el), seconds: $("[data-unit=seconds]", el) };
    const pad = (n) => String(n).padStart(2, "0");
    let timer;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        const done = document.createElement("p");
        done.className = "countdown--done";
        done.textContent = diff > -86400000 ? "C’est le grand jour\u00a0!" : "Merci d’avoir partagé ce jour avec nous";
        el.replaceWith(done);
        return;
      }
      const v = {
        days: String(Math.floor(diff / 86400000)),
        hours: pad(Math.floor((diff / 3600000) % 24)),
        minutes: pad(Math.floor((diff / 60000) % 60)),
        seconds: pad(Math.floor((diff / 1000) % 60)),
      };
      for (const k in units) {
        const node = units[k];
        if (node && node.textContent !== v[k]) {
          node.textContent = v[k];
          if (motion && hasGsap && node.dataset.ready) gsap.fromTo(node, { yPercent: -35, opacity: 0.2 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
          node.dataset.ready = "1";
        }
      }
    };
    tick();
    timer = setInterval(tick, 1000);
    onLeave(() => clearInterval(timer));
  });

  /* ------------------------------------------------------------- Agenda .ics */
  $$("[data-ics]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const esc = (s) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1");
      const lines = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Clementine et Romain//Mariage//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:mariage-clementine-romain-20270703",
        `DTSTAMP:${stamp}`,
        "DTSTART:20270703T120000Z",
        "DTEND:20270704T020000Z",
        `SUMMARY:${esc("Mariage de Clémentine & Romain")}`,
        `LOCATION:${esc("Mairie d’Héry-sur-Alby, 74540 Héry-sur-Alby")}`,
        `DESCRIPTION:${esc("14h00 Arrivée des invités · 14h30 Cérémonie civile (mairie d’Héry-sur-Alby) · 15h30 Cérémonie religieuse (église d’Héry-sur-Alby) · 17h00 Vin d’honneur et 20h30 Dîner au Château de Saint-Offenge, 50 route de Sainte-Euphémie, 73100 Saint-Offenge")}`,
        "END:VEVENT", "END:VCALENDAR",
      ];
      // RFC 5545 : lignes pliées à 75 octets (CRLF + espace), fin de fichier en CRLF
      const enc = new TextEncoder();
      const fold = (line) => {
        const out = [];
        let cur = "";
        for (const ch of line) {
          if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; }
          else cur += ch;
        }
        out.push(cur);
        return out.join("\r\n ");
      };
      const blob = new Blob([lines.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mariage-clementine-romain.ics";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Invitation ajoutée\u00a0: ouvrez le fichier pour l’enregistrer dans votre agenda");
    });
  });

  /* ----------------------------------------------------------------- Pétales */
  function makePetals(container, count, light) {
    const colors = light ? ["#FFF3E6", "#FFD9C7", "#FFB085"] : ["#F06292", "#FFB085", "#FFD9C7", "#E91E63", "#F8BBD0"];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      const size = 0.6 + Math.random() * 0.9;
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[i % colors.length];
      p.style.width = `${16 * size}px`;
      p.style.height = `${13 * size}px`;
      p.style.animationDuration = `${11 + Math.random() * 12}s`;
      p.style.animationDelay = `${-Math.random() * 20}s`;
      p.style.opacity = String(0.45 + Math.random() * 0.45);
      frag.appendChild(p);
    }
    container.appendChild(frag);
  }
  if (motion) $$("[data-petals]").forEach((c) => makePetals(c, +c.getAttribute("data-petals") || 12, c.hasAttribute("data-petals-light")));
  window.crPetals = makePetals;

  /* --------------------------------------------------- Transitions de pages */
  const curtain = $(".page-curtain");
  const curtainPanels = curtain ? $$(".page-curtain__panel", curtain) : [];
  function isInternalPage(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-ics")) return false;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return false;
    const norm = (path) => path.replace(/\/index\.html$/, "/").replace(/\.html$/, ""); // « /environs » = « /environs.html »
    if (norm(url.pathname) === norm(location.pathname) && url.hash) return false;
    return /(\.html|\/)$/.test(url.pathname);
  }
  // Lien vers la page où l'on se trouve déjà (logo, « Accueil » sur l'accueil) : on remonte en douceur, sans recharger
  listen(document, "click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    const norm = (path) => path.replace(/\/index\.html$/, "/").replace(/\.html$/, ""); // « /environs » = « /environs.html »
    if (url.origin !== location.origin || norm(url.pathname) !== norm(location.pathname) || /^(mailto|tel):/.test(a.getAttribute("href"))) return;
    if (url.hash) {
      // Même page mais adresse écrite autrement (« / » et « /index.html », « /environs » et « /environs.html ») : on défile au lieu de recharger.
      // Si l'adresse est identique, Lenis (option anchors) ou le navigateur s'en chargent déjà.
      if (url.pathname === location.pathname) return;
      let id = url.hash.slice(1);
      try { id = decodeURIComponent(id); } catch (err) { /* ancre mal formée */ }
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      scrollToEl(target);
      history.pushState(null, "", url.hash);
      return;
    }
    e.preventDefault();
    const brand = $(".brand");
    const done = () => brand && brand.focus({ preventScroll: true });
    if (lenis) lenis.scrollTo(0, { duration: 1.4, force: true, onComplete: done });
    else { window.scrollTo({ top: 0, behavior: motion ? "smooth" : "auto" }); done(); }
  });
  // Le rideau se ferme, puis la page suivante s'affiche : sans rechargement avec nav.js (la musique
  // continue), sinon par une navigation classique
  const closeCurtain = () => new Promise((resolve) => {
    gsap.killTweensOf(curtainPanels); // rideau encore en train de s'ouvrir : il repart d'où il est
    curtain.style.visibility = "visible";
    // y: 0 explicite : sinon GSAP ajoute le décalage CSS de départ (translateY(100%)) au sien et, sur la
    // première page visitée, le rideau finissait sa course sous l'écran, invisible
    gsap.timeline({ onComplete: resolve })
      .fromTo(curtainPanels, { y: 0, yPercent: 100 }, { y: 0, yPercent: 0, duration: 0.55, ease: "power4.inOut", stagger: 0.09 });
  });
  if (motion && curtain) {
    if (nav) nav.setLeave(closeCurtain);
    listen(document, "click", (e) => {
      const a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !isInternalPage(a)) return;
      e.preventDefault();
      const href = a.href;
      store && store.setItem("cr-curtain", "1");
      if (nav) nav.go(href);
      else closeCurtain().then(() => { location.href = href; });
    });
    listen(window, "pageshow", (e) => {
      if (e.persisted) { gsap.set(curtainPanels, { y: 0, yPercent: 100 }); curtain.style.visibility = "hidden"; }
    });
  }
  function curtainOut() {
    if (!html.classList.contains("curtain-in") || !curtain) return Promise.resolve();
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { html.classList.remove("curtain-in"); curtain.style.visibility = "hidden"; gsap.set(curtainPanels, { yPercent: 100 }); resolve(); } })
        .to(curtainPanels.slice().reverse(), { yPercent: -100, duration: 0.7, ease: "power4.inOut", stagger: 0.08, delay: 0.05 });
    });
  }

  /* ---------------------------------------------- Curseur, magnétisme, 3D */
  if (motion && finePointer) {
    const cursor = $(".cursor");
    if (cursor) {
      html.classList.add("cursor-on");
      const label = $(".cursor__label", cursor);
      const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
      listen(window, "pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); cursor.classList.remove("is-out"); heartMove(e); }, { passive: true });
      listen(document, "pointerleave", () => cursor.classList.add("is-out"));
      // Page affichée sans rechargement : le curseur reprend là où se trouve la souris
      if (nav && nav.soft && nav.pointer) {
        gsap.set(cursor, { x: nav.pointer.x, y: nav.pointer.y });
        cursor.classList.remove("is-out");
      }
      listen(document, "pointerover", (e) => {
        const link = e.target.closest("a, button, label, input, textarea, select, [role=button]");
        // Un lien placé dans une zone étiquetée garde son propre curseur
        let labelled = e.target.closest("[data-cursor]");
        if (labelled && link && link !== labelled && labelled.contains(link)) labelled = null;
        hearty = e.target.closest("[data-cursor-heart]");
        cursor.classList.toggle("is-heart", !!hearty);
        cursor.classList.toggle("has-label", !!labelled && !hearty);
        cursor.classList.toggle("is-link", !!link && !labelled && !hearty);
        if (labelled && label) label.textContent = labelled.getAttribute("data-cursor");
      });

      // Cœur vivant : il bat de plus en plus vite à mesure qu’on s’approche du baiser
      const ring = $(".cursor__ring", cursor);
      const heartSvg = $(".cursor__heart", cursor);
      let hearty = null, closeness = 0, target = 0, phase = 0, lastBeat = 0, px = 0, py = 0;
      const focusPoint = (el) => {
        const img = $("img", el);
        const r = el.getBoundingClientRect();
        const [fx, fy] = (el.dataset.heartFocus || "0.5 0.5").split(" ").map(Number);
        if (!img || !img.naturalWidth) return { x: r.left + r.width * fx, y: r.top + r.height * fy, r };
        // Position réelle du point dans l’image recadrée (object-fit: cover), zoom GSAP compris
        const b = img.getBoundingClientRect();
        const k = Math.max(b.width / img.naturalWidth, b.height / img.naturalHeight);
        const w = img.naturalWidth * k, h = img.naturalHeight * k;
        const [ox, oy] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
        return { x: b.left + (b.width - w) * ox + w * fx, y: b.top + (b.height - h) * oy + h * fy, r };
      };
      // Recalculé à chaque image : la photo bouge aussi pendant le défilement, souris immobile
      function heartTarget() {
        if (!hearty) { target = 0; return; }
        const f = focusPoint(hearty);
        const d = Math.hypot(px - f.x, py - f.y);
        target = gsap.utils.clamp(0, 1, 1 - d / (Math.max(f.r.width, f.r.height) * (parseFloat(hearty.dataset.heartReach) || 0.55)));
      }
      function heartMove(e) { px = e.clientX; py = e.clientY; }
      if (nav && nav.soft && nav.pointer) { px = nav.pointer.x; py = nav.pointer.y; }
      function floatHeart(x, y, big) {
        const h = document.createElement("span");
        h.className = "heart-float";
        h.innerHTML = `<svg viewBox="0 0 24 24">${heartSvg.innerHTML}</svg>`;
        document.body.appendChild(h);
        const s = (big ? 0.9 : 0.5) + Math.random() * 0.5;
        gsap.fromTo(h, { x, y, scale: 0.2, opacity: 0, rotation: gsap.utils.random(-25, 25) }, {
          x: x + gsap.utils.random(-60, 60), y: y - gsap.utils.random(70, 150), scale: s, rotation: gsap.utils.random(-30, 30),
          keyframes: { opacity: [0, 1, 1, 0] }, duration: gsap.utils.random(1.1, 1.7), ease: "power2.out", onComplete: () => h.remove(),
        });
      }
      onTick((time, dt) => {
        heartTarget();
        closeness += ((hearty ? target : 0) - closeness) * 0.08;
        cursor.style.setProperty("--close", closeness.toFixed(3));
        if (!hearty) { phase = 0; return; }
        // 50 → 140 battements par minute
        phase += (dt / 1000) * (0.85 + closeness * 1.5);
        const t = phase % 1;
        const bump = (c, w) => Math.max(0, 1 - Math.abs(t - c) / w);
        // Petit cœur loin du couple, presque la taille du disque tout près (battement adouci quand il est grand)
        const beat = 1 + (0.26 - 0.14 * closeness) * bump(0.08, 0.1) + (0.16 - 0.08 * closeness) * bump(0.3, 0.1);
        gsap.set(heartSvg, { scale: beat * (0.56 + 2.84 * closeness) });
        if (Math.floor(phase) !== lastBeat) {
          lastBeat = Math.floor(phase);
          const wave = document.createElement("i");
          wave.className = "cursor__wave";
          ring.appendChild(wave);
          gsap.fromTo(wave, { scale: 1, opacity: 0.55 + closeness * 0.3 }, { scale: 1.7 + closeness * 0.6, opacity: 0, duration: 1, ease: "power2.out", onComplete: () => wave.remove() });
          if (closeness > 0.72 && document.querySelectorAll(".heart-float").length < 14) floatHeart(px, py - 20, false);
        }
      });
      // Un clic sur la photo : une gerbe de petits cœurs
      $$("[data-cursor-heart]").forEach((el) => el.addEventListener("click", (e) => {
        for (let n = 0; n < 9; n++) setTimeout(() => floatHeart(e.clientX, e.clientY - 10, true), n * 45);
      }));
    }

    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });

    $$("[data-tilt]").forEach((el) => {
      gsap.set(el, { transformPerspective: 1000 });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 7);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
      });
      el.addEventListener("pointerleave", () => { rx(0); ry(0); });
    });

    const heroEl = $(".hero");
    if (heroEl) {
      const layers = $$("[data-depth]", heroEl).map((el) => ({
        d: parseFloat(el.getAttribute("data-depth")) || 0,
        x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3" }),
      }));
      heroEl.addEventListener("pointermove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(nx * 22 * l.d); l.y(ny * 16 * l.d); });
      });
    }
  }

  /* ================================================================ Animations */
  if (!motion) return;
  gsap.registerPlugin(ST);
  if (window.SplitText) gsap.registerPlugin(window.SplitText);
  gsap.defaults({ ease: "power3.out" });
  ST.config({ ignoreMobileResize: true });

  /* ---------- Intro puis entrée du héros ---------- */
  function heroIn() {
    if (!$(".hero")) return null;
    const names = $("[data-hero-names]");
    const media = $("[data-hero-media]");
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    if (names) {
      tl.to($$(".line, .amp", names), { clipPath: "inset(0 0% 0 0)", duration: 1.5, ease: "power2.inOut", stagger: 0.28 }, 0.1);
    }
    tl.to("[data-hero]", { opacity: 1, y: 0, duration: 1, stagger: 0.1, startAt: { y: 26 } }, 0.5);
    if (media) {
      tl.fromTo($(".hero__arch", media), { clipPath: "inset(100% 0% 0% 0% round 999px 999px 18px 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 999px 999px 18px 18px)", duration: 1.6, ease: "expo.inOut" }, 0)
        .from($(".hero__arch img", media), { scale: 1.35, duration: 2.2, ease: "expo.out" }, 0.4)
        .to($(".hero__arch-line", media), { opacity: 0.45, duration: 1.2 }, 1)
        .fromTo($$(".hero__flower", media), { opacity: 0, scale: 0.4, rotation: -25 }, { opacity: 1, scale: 1, rotation: (i) => (i ? 160 : 0), duration: 1.6, ease: "back.out(1.4)", stagger: 0.15 }, 1.1)
        .fromTo($(".hero__stamp", media), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1, ease: "back.out(2)" }, 1.5);
    }
    return tl;
  }

  function playIntro() {
    const screen = $(".intro-screen");
    if (!html.classList.contains("intro") || !screen) return Promise.resolve();
    lenis && lenis.stop();
    store && store.setItem("cr-intro", "1");
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => { html.classList.remove("intro"); lenis && lenis.start(); resolve(); },
      });
      const mono = $(".intro-screen__mono", screen);
      tl.fromTo(mono, { clipPath: "inset(100% 0% 0% 0%)", scale: 0.9, y: 20 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, y: 0, duration: 1.5, ease: "power3.inOut" })
        .to(mono, { scale: 1.04, duration: 0.5, ease: "sine.inOut" }, "+=0.05")
        .to(screen, { clipPath: "inset(0 0 100% 0)", duration: 0.85, ease: "expo.inOut" }, "+=0.05");
      const skip = () => tl.progress(0.92);
      screen.addEventListener("click", skip, { once: true });
      listen(document, "keydown", skip, { once: true });
    });
  }

  /* ---------- Titres découpés (à la demande, quand ils approchent de l’écran) ---------- */
  function splitTitles() {
    $$("[data-split]").forEach((el) => {
      ST.create({
        trigger: el, start: "top 98%", once: true,
        onEnter: () => {
          gsap.set(el, { opacity: 1 });
          if (!window.SplitText) { gsap.from(el, { opacity: 0, y: 30, duration: 1 }); return; }
          const split = window.SplitText.create(el, { type: "lines", mask: "lines", tag: "span", linesClass: "split-line" });
          gsap.from(split.lines, {
            yPercent: 115, rotation: 2, duration: 1.2, ease: "power4.out", stagger: 0.12,
            onComplete: () => split.revert(),
          });
        },
      });
    });
  }

  /* ---------- Apparitions génériques ---------- */
  function reveals() {
    $$("[data-reveal]").forEach((el) => {
      const type = el.getAttribute("data-reveal");
      const st = { trigger: el, start: "top 90%" };
      if (type === "draw") gsap.fromTo(el, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power2.inOut", scrollTrigger: st });
      else if (type === "clip") gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", duration: 1.4, ease: "expo.out", scrollTrigger: st });
      else gsap.to(el, { opacity: 1, y: 0, startAt: { y: 32 }, duration: 1.1, scrollTrigger: st });
    });
    $$("[data-reveal-group]").forEach((group) => {
      if (!group.children.length) return;
      gsap.to(group.children, { opacity: 1, y: 0, startAt: { y: 50 }, duration: 1.1, stagger: 0.13, scrollTrigger: { trigger: group, start: "top 86%" } });
    });
    $$("[data-parallax]").forEach((el) => {
      const amount = parseFloat(el.getAttribute("data-parallax")) || 10;
      gsap.fromTo(el, { yPercent: -amount }, { yPercent: amount, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$("[data-scrub-text]").forEach((el) => {
      if (!window.SplitText) return;
      const split = window.SplitText.create(el, { type: "words", tag: "span", aria: "none" });
      gsap.fromTo(split.words, { opacity: 0.2 }, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: 0.6 } });
    });
  }

  /* ---------- Photo : de l’arche au plein écran ---------- */
  function revealPhoto() {
    $$("[data-reveal-photo]").forEach((sec) => {
      const frame = $(".reveal-photo__frame", sec);
      const img = $("img", frame);
      // Arche toujours verticale, quelle que soit la forme de l’écran
      const archBox = () => {
        const w = frame.clientWidth, h = frame.clientHeight;
        const ah = h * (w < 700 ? 0.64 : 0.7);
        const aw = Math.min(ah * 0.8, w * 0.8);
        return { x: (w - aw) / 2, y: (h - ah) / 2, w: aw, h: ah };
      };
      const arch = () => { const a = archBox(); return `inset(${a.y}px ${a.x}px ${a.y}px ${a.x}px round ${a.w / 2}px ${a.w / 2}px 22px 22px)`; };
      // Décor (filet, fleurs, tampon) calé sur l’arche de départ, recalé à chaque changement de format
      const deco = $("[data-rp-deco]", sec);
      const placeDeco = () => {
        if (!deco) return;
        const a = archBox();
        deco.style.cssText = `left:${a.x}px;top:${a.y}px;width:${a.w}px;height:${a.h}px`;
      };
      placeDeco();
      ST.addEventListener("refreshInit", placeDeco);
      onLeave(() => ST.removeEventListener("refreshInit", placeDeco));
      if (deco) {
        // Apparition, comme l’arche de l’accueil, quand la section arrive à l’écran
        const pick = (s) => $(s, deco);
        const enter = gsap.timeline({ paused: true, defaults: { ease: "back.out(1.4)" } })
          .fromTo(pick(".rp-deco__line"), { opacity: 0, scale: 0.94 }, { opacity: 0.45, scale: 1, duration: 1.2, ease: "power2.out" }, 0)
          .fromTo(pick(".rp-deco__item--bouquet img"), { opacity: 0, scale: 0.4, rotation: -25 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.5 }, 0.15)
          .fromTo(pick(".rp-deco__item--top img"), { opacity: 0, scale: 0.4, rotation: 120 }, { opacity: 1, scale: 1, rotation: 160, duration: 1.5 }, 0.3)
          .fromTo(pick(".rp-deco__item--rose img"), { opacity: 0, scale: 0.4, rotation: 30 }, { opacity: 1, scale: 1, rotation: -12, duration: 1.4 }, 0.42)
          .fromTo(pick(".rp-deco__stamp"), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1, ease: "back.out(2)" }, 0.6);
        ST.create({ trigger: sec, start: "top 70%", once: true, onEnter: () => enter.play() });
      }
      // Position du couple dans l’image affichée (object-fit: cover, object-position: 50% 38%)
      const focus = () => {
        const w = frame.clientWidth, h = frame.clientHeight;
        const iw = img.naturalWidth || 1446, ih = img.naturalHeight || 1087;
        const k = Math.max(w / iw, h / ih);
        const rw = iw * k, rh = ih * k;
        const [ox, oy] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
        return { x: (w - rw) * ox + 0.445 * rw, y: (h - rh) * oy + 0.4 * rh, w, h };
      };
      const origin = () => { const f = focus(); return `${f.x}px ${f.y}px`; };
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.8, invalidateOnRefresh: true } });
      // 1) Le décor s’envole vers l’extérieur (durée D), 2) la photo s’ouvre, 3) le texte s’écrit
      const D = deco ? 0.3 : 0;
      // État de départ posé dès le temps 0 : pendant l’envol du décor, la photo est déjà cadrée sur les
      // visages (sans cela, elle sauterait au début de l’ouverture)
      const zx = () => { const f = focus(); return f.w / 2 - f.x; };
      const zy = () => { const f = focus(); return f.h * 0.46 - f.y; };
      tl.set(frame, { clipPath: arch }, 0).set(img, { scale: 1.25, x: zx, y: zy, transformOrigin: origin }, 0);
      if (deco) {
        const pick = (s) => $(s, deco);
        tl.to(pick(".rp-deco__item--line"), { opacity: 0, scale: 1.06, duration: D, ease: "power1.in" }, 0)
          .to(pick(".rp-deco__item--bouquet"), { xPercent: -70, yPercent: 40, rotation: -18, opacity: 0, duration: D, ease: "power2.in" }, 0)
          .to(pick(".rp-deco__item--top"), { xPercent: 80, yPercent: -70, rotation: 40, opacity: 0, duration: D, ease: "power2.in" }, 0)
          .to(pick(".rp-deco__item--rose"), { xPercent: -90, yPercent: -60, rotation: -30, opacity: 0, duration: D, ease: "power2.in" }, 0.02)
          .to(pick(".rp-deco__item--stamp"), { xPercent: 60, yPercent: 60, scale: 0.6, rotation: 90, opacity: 0, duration: D, ease: "power2.in" }, 0.02);
      }
      tl.fromTo(frame, { clipPath: arch }, { clipPath: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)", ease: "power2.inOut", duration: 1 }, D)
        .fromTo(img,
          { scale: 1.25, x: zx, y: zy, transformOrigin: origin },
          { scale: 1, x: 0, y: 0, transformOrigin: origin, ease: "power2.inOut", duration: 1 }, D)
        .to($(".reveal-photo__scrim", sec), { opacity: 1, ease: "none", duration: 0.45 }, D + 0.55)
        // Pause, photo pleinement ouverte, le temps de lire le texte
        .to({}, { duration: 0.35 }, D + 1);
      img.addEventListener("load", () => ST.refresh(), { once: true });

      // Texte : écrit à l’encre une fois la photo ouverte, effacé en remontant.
      // Tout est piloté par l’état VISIBLE de l’arche (chronologie lissée `tl`), jamais par la position brute
      // de la page : en défilant vite, l’arche suit avec un léger retard et le texte ne doit pas la devancer.
      const text = $("[data-rp-text]", sec);
      if (!text) return;
      // Garde-fou lié au défilement : le texte s'éteint avec l'arche si l'on remonte vite
      tl.fromTo(text, { "--rp-safe": 0 }, { "--rp-safe": 1, ease: "none", duration: 0.1 }, D + 0.75);
      const words = $$(".rp-w > span", text);
      const t = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
        .fromTo($(".rp-over", text), { opacity: 0, letterSpacing: "1em" }, { opacity: 1, letterSpacing: "0.42em", duration: 1.5 }, 0)
        .fromTo($(".rp-script", text), { "--ink": "-10%", y: 24, filter: "blur(5px)" }, { "--ink": "112%", y: 0, filter: "blur(0px)", duration: 2.1, ease: "power2.inOut" }, 0.15)
        .fromTo($(".rp-line", text), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.inOut" }, 1.05)
        .fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 1.1, stagger: 0.09, ease: "expo.out" }, 1.25)
        .fromTo($(".rp-place", text), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 1.6);
      // Photo ouverte (97 %) : le bloc s'allume et le texte s'écrit depuis le début. Dès que l'arche
      // recommence à se fermer (sous 95 %) : fondu rapide, puis remise à zéro, pour que le texte ne
      // réapparaisse jamais déjà écrit. L'écart 95/97 évite tout va-et-vient sur le seuil.
      let written = false;
      gsap.set(text, { "--rp-show": 0 });
      tl.eventCallback("onUpdate", () => {
        const time = tl.time();
        if (!written && time >= D + 0.97) {
          written = true;
          gsap.killTweensOf(text, "--rp-show");
          gsap.set(text, { "--rp-show": 1 });
          t.timeScale(1).restart();
        } else if (written && time < D + 0.95) {
          written = false;
          gsap.killTweensOf(text, "--rp-show"); // uniquement cette propriété : le garde-fou de `tl` reste intact
          gsap.to(text, { "--rp-show": 0, duration: 0.3, ease: "power2.out", onComplete: () => t.pause(0) });
        }
      });
    });
  }

  /* ---------- Bandeau défilant réactif à la vitesse ---------- */
  // Duplique le groupe autant que nécessaire pour couvrir tout l’écran (même très large)
  // et fait défiler exactement d’un groupe : la boucle est continue, sans trou.
  function fillMarquee(m) {
    const track = $(".marquee__track", m);
    const first = $(".marquee__group", track);
    const gw = first ? first.getBoundingClientRect().width : 0;
    if (!gw) return;
    const need = Math.ceil(window.innerWidth / gw) + 1;
    for (let n = $$(".marquee__group", track).length; n < need; n++) track.appendChild(first.cloneNode(true));
    track.style.setProperty("--marquee-shift", `${-gw}px`);
  }

  function marquee() {
    $$("[data-marquee]").forEach((m) => {
      fillMarquee(m);
      let rt;
      listen(window, "resize", () => { clearTimeout(rt); rt = setTimeout(() => fillMarquee(m), 200); });
      onLeave(() => clearTimeout(rt));
      const track = $(".marquee__track", m);
      const anim = track.getAnimations ? track.getAnimations()[0] : null;
      if (!anim) return;
      let rate = 1;
      ST.create({
        trigger: m, start: "top bottom", end: "bottom top",
        onUpdate: (self) => {
          const v = self.getVelocity();
          rate = gsap.utils.clamp(-5, 5, 1 + v / 450);
          anim.playbackRate = rate;
          gsap.to($$(".marquee__group", track), { skewX: gsap.utils.clamp(-8, 8, -v / 250), duration: 0.4, overwrite: true });
        },
      });
      onTick(() => {
        if (Math.abs(rate - 1) > 0.01) { rate += (1 - rate) * 0.05; anim.playbackRate = rate; }
      });
    });
  }

  /* ---------- Carte racontée ---------- */
  function mapStory() {
    const sec = $("[data-map-story]");
    if (!sec) return;
    const fr = $(".map-france", sec);
    const bg = $(".map-bauges", sec);
    if (!fr || !bg) return;
    const steps = $$(".map-steps li", sec);
    const setStep = (i) => steps.forEach((s, k) => s.classList.toggle("is-active", k === i));

    let pulse = null;
    const franceIn = (tl, at = 0) => tl
      .to($(".map-land", fr), { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, at)
      .to($(".map-land", fr), { fillOpacity: 1, duration: 0.8 }, at + 0.8)
      .from([$(".map-neighbours", fr), $(".map-region", fr)], { opacity: 0, duration: 0.8 }, at + 0.6)
      .to($$(".map-peak", fr), { opacity: 1, scaleY: 1, startAt: { scaleY: 0, transformOrigin: "50% 100%" }, duration: 0.6, stagger: 0.02, ease: "back.out(2)" }, at + 1)
      .to($$(".map-label", fr), { opacity: 1, duration: 0.5, stagger: 0.1 }, at + 1.3)
      .to($(".map-pin", fr), { opacity: 1, y: 0, startAt: { y: -60 }, duration: 0.7, ease: "bounce.out" }, at + 1.6)
      .add(() => pulse.play(), at + 2.1);
    const baugesIn = (tl, at = 0) => tl
      .to($$(".map-peak", bg), { opacity: 1, scaleY: 1, startAt: { scaleY: 0, transformOrigin: "50% 100%" }, duration: 0.6, stagger: 0.025, ease: "back.out(2)" }, at)
      .to($$(".map-label:not(.map-venue)", bg), { opacity: 1, duration: 0.5, stagger: 0.06 }, at + 0.4)
      .to($(".pin-hery", bg), { opacity: 1, y: 0, startAt: { y: -50 }, duration: 0.7, ease: "bounce.out" }, at + 0.7)
      .to($(".map-route-mask", bg), { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, at + 1)
      .to($(".pin-chateau", bg), { opacity: 1, y: 0, startAt: { y: -50 }, duration: 0.7, ease: "bounce.out" }, at + 2.2)
      .to($$(".map-venue", bg), { opacity: 1, x: 0, startAt: { x: -12 }, duration: 0.6, stagger: 0.3 }, at + 1.2);

    // Halo autour de l’épingle : on agrandit son rayon (attribut r) plutôt que de le mettre à l’échelle.
    // Une transformation sur un élément SVG qui a déjà transform-origin en CSS voit son origine appliquée
    // deux fois : le halo glissait en diagonale vers Paris au lieu de grossir sur place.
    pulse = gsap.fromTo($(".map-pulse", fr), { attr: { r: 10 }, opacity: 0.32 }, { attr: { r: 26 }, opacity: 0, duration: 1.8, repeat: -1, repeatDelay: 0.4, ease: "power1.out", paused: true });

    const mm = gsap.matchMedia();
    onLeave(() => mm.revert());
    mm.add("(min-width: 900px) and (min-height: 640px)", () => {
      sec.classList.add("is-story");
      const holder = $(".pin-main", fr).parentNode;
      const origin = `${(holder.dataset.pinX / 6).toFixed(2)}% ${(holder.dataset.pinY / 6).toFixed(2)}%`;
      const frFig = fr.closest("figure");
      const bgFig = bg.closest("figure");
      gsap.set(bgFig, { opacity: 0, scale: 0.35 });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sec, pin: $(".map-story__pin", sec), start: "top top", end: "+=220%", scrub: 1,
          onUpdate: (self) => setStep(self.progress < 0.12 ? 0 : self.progress < 0.48 ? 1 : 2),
        },
      });
      franceIn(gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 65%" } }));
      tl.to({}, { duration: 0.6 })
        .to(fr, { scale: 7, transformOrigin: origin, duration: 1.4, ease: "power2.in" }, 0.6)
        .to(frFig, { opacity: 0, duration: 0.5 }, 1.5)
        .to(bgFig, { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }, 1.5);
      baugesIn(tl, 2.3);
      tl.to({}, { duration: 0.8 });
      return () => { sec.classList.remove("is-story"); gsap.set([fr, frFig, bgFig], { clearProps: "all" }); };
    });
    mm.add("(max-width: 899px), (max-height: 639px)", () => {
      franceIn(gsap.timeline({ scrollTrigger: { trigger: fr, start: "top 75%" } }));
      baugesIn(gsap.timeline({ scrollTrigger: { trigger: bg, start: "top 75%" } }));
    });
  }

  /* ---------- Programme : le fil de la journée ---------- */
  function programme() {
    const sec = $("[data-programme]");
    if (!sec) return;
    const track = $(".programme__track", sec);
    const sun = $(".programme__sun", sec);
    // Du plein jour à la nuit étoilée : le soleil se couche derrière les montagnes,
    // le ciel passe au bleu nuit, la lune se lève et les étoiles s’allument.
    const skyStops = [
      { p: 0, top: "#FFF3E6", bot: "#FFE6D6", sun: "#FFE1B0" },
      { p: 0.45, top: "#FFE6D4", bot: "#FFC9A6", sun: "#FFC48F" },
      { p: 0.66, top: "#FDBFA3", bot: "#F68BAF", sun: "#FFA77F" },
      { p: 0.78, top: "#6E3C70", bot: "#E07A8E", sun: "#F4845F" },
      { p: 0.9, top: "#18204A", bot: "#3F3468", sun: "#E0705A" },
      { p: 1, top: "#0E1433", bot: "#262857", sun: "#E0705A" },
    ];
    const stars = $(".programme__stars", sec);
    if (stars && !stars.childElementCount) {
      const frag = document.createDocumentFragment();
      for (let n = 0; n < 90; n++) {
        const st = document.createElement("i");
        const big = Math.random() < 0.12;
        st.style.cssText = `left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.pow(Math.random(), 1.4) * 100).toFixed(2)}%;--s:${big ? 2.6 : 1 + Math.random() * 1.2}px;--t:${(2.5 + Math.random() * 4).toFixed(2)}s;--d:${(-Math.random() * 6).toFixed(2)}s`;
        frag.appendChild(st);
      }
      stars.appendChild(frag);
    }
    const mix = (a, b, t) => gsap.utils.interpolate(a, b, t);
    const clamp01 = gsap.utils.clamp(0, 1);
    function sky(p) {
      let i = 0;
      while (i < skyStops.length - 2 && p > skyStops[i + 1].p) i++;
      const a = skyStops[i], b = skyStops[i + 1];
      const t = clamp01((p - a.p) / (b.p - a.p));
      sec.style.setProperty("--sky-top", mix(a.top, b.top, t));
      sec.style.setProperty("--sky-bot", mix(a.bot, b.bot, t));
      sec.style.setProperty("--sun", mix(a.sun, b.sun, t));
      const dusk = clamp01((p - 0.7) / 0.2);
      const night = clamp01((p - 0.8) / 0.14);
      sec.style.setProperty("--dusk", dusk.toFixed(3));
      sec.style.setProperty("--night", night.toFixed(3));
      sec.classList.toggle("is-dusk", p > 0.7);
      sec.classList.toggle("is-night", night > 0.6);
      if (sun) {
        // Une seule courbe continue (arc parabolique) : le soleil glisse d'abord presque à plat,
        // puis descend de plus en plus vers la ligne des montagnes, derrière lesquelles il se couche.
        const t = clamp01(p / 0.9);
        sun.style.left = `${8 + t * 80}%`;
        sun.style.top = `${12 + Math.pow(t, 1.9) * 92}%`;
        sun.style.opacity = String(1 - clamp01((p - 0.82) / 0.08));
      }
    }
    sky(0);

    const mm = gsap.matchMedia();
    onLeave(() => mm.revert());
    mm.add("(min-width: 1024px) and (min-height: 620px)", () => {
      sec.classList.add("is-horizontal");
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(), ease: "none",
        scrollTrigger: { trigger: sec, pin: true, start: "top top", end: () => `+=${distance()}`, scrub: 1, invalidateOnRefresh: true, onUpdate: (self) => sky(self.progress) },
      });
      gsap.to($$(".programme__intro > *", sec), { opacity: 1, y: 0, startAt: { y: 30 }, duration: 1, stagger: 0.1, scrollTrigger: { trigger: sec, start: "top 70%" } });
      $$(".moment, .programme__outro", sec).forEach((m) => {
        // Les cartes visibles dès le début de l'épinglage apparaissent avec la section (sinon, en arrivant
        // pile au début par une ancre, leur déclencheur horizontal ne se lance jamais)
        const early = m.offsetLeft < window.innerWidth * 0.88;
        const st = early
          ? { trigger: sec, start: "top 75%", toggleActions: "play none none reverse" }
          : { trigger: m, containerAnimation: tween, start: "left 88%", toggleActions: "play none none reverse" };
        gsap.fromTo(m, { opacity: 0, rotation: 3, yPercent: 20 }, { opacity: 1, rotation: 0, yPercent: 0, duration: 1, scrollTrigger: st });
      });
      // Clavier : amener dans le champ de vision l’élément du fil qui reçoit le focus
      const onFocus = (e) => {
        const st = tween.scrollTrigger;
        const item = e.target.closest(".moment, .programme__intro, .programme__outro");
        if (!st || !item) return;
        sec.scrollLeft = 0;
        const x = gsap.utils.clamp(0, distance(), item.offsetLeft - window.innerWidth * 0.3);
        const y = st.start + (distance() ? (x / distance()) * (st.end - st.start) : 0);
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      };
      sec.addEventListener("focusin", onFocus);
      return () => { sec.removeEventListener("focusin", onFocus); sec.classList.remove("is-horizontal", "is-dusk", "is-night"); gsap.set(track, { clearProps: "transform" }); };
    });
    mm.add("(max-width: 1023px), (max-height: 619px)", () => {
      gsap.to($$(".programme__intro > *", sec), { opacity: 1, y: 0, startAt: { y: 30 }, duration: 1, stagger: 0.1, scrollTrigger: { trigger: sec, start: "top 80%" } });
      $$(".moment, .programme__outro", sec).forEach((m) => {
        gsap.to(m, { opacity: 1, x: 0, startAt: { x: 40 }, duration: 1, scrollTrigger: { trigger: m, start: "top 88%" } });
      });
      ST.create({ trigger: sec, start: "top 60%", end: "bottom bottom", onUpdate: (self) => sky(self.progress) });
    });
  }

  /* ---------- Témoins : apparitions en cascade ---------- */
  function witnesses() {
    const row = $("[data-witnesses]");
    if (!row) return;
    const tilt = (item) => parseFloat(getComputedStyle($(".witness2__shape", item)).getPropertyValue("--tilt")) || 0;
    const reveal = (item) => {
      const q = (sel) => $(sel, item);
      return gsap.timeline()
        // L'inclinaison propre à chaque forme (--tilt) est rendue au CSS à la fin (survol compris)
        .fromTo(q(".witness2__shape"), { opacity: 0, scale: 0, rotation: tilt(item) - 60 }, { opacity: 1, scale: 1, rotation: tilt(item), duration: 1.3, ease: "elastic.out(1, 0.55)", clearProps: "transform" }, 0)
        .fromTo(q(".witness2__photo"), { opacity: 0, scale: 0.25, rotation: -18 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.2, ease: "back.out(1.7)" }, 0.12)
        .fromTo(q(".witness2__photo img"), { scale: 1.6 }, { scale: 1, duration: 1.8, ease: "expo.out", clearProps: "transform" }, 0.12)
        .fromTo(q(".witness2__ring"), { opacity: 0, scale: 1.25 }, { opacity: 0.45, scale: 1, duration: 1, ease: "power3.out" }, 0.45)
        .fromTo(q(".witness2__flower"), { opacity: 0, scale: 0, rotation: -120 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.1, ease: "back.out(2.2)" }, 0.7)
        .fromTo(q(".witness2__name"), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power2.inOut" }, 0.55)
        .to(q(".witness2__swash path"), { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }, 1.3)
        .fromTo(q(".witness2__role"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, 1.45);
    };
    // Les témoins qui entrent ensemble dans l’écran apparaissent l’un après l’autre
    ST.batch($$(".witness2", row), {
      start: "top 85%",
      once: true,
      onEnter: (batch) => batch.forEach((item, i) => reveal(item).delay(i * 0.42)),
    });
  }

  /* ---------- Paysages (pied de page & en-têtes) ---------- */
  function landscapes() {
    $$(".landscape").forEach((svg) => {
      const layers = $$("[data-depth]", svg);
      const inHero = !!svg.closest(".page-hero");
      layers.forEach((layer) => {
        const d = parseFloat(layer.getAttribute("data-depth")) || 0;
        if (!d) return;
        if (inHero) gsap.to(layer, { y: d * 140, ease: "none", scrollTrigger: { trigger: svg.closest("section"), start: "top top", end: "bottom top", scrub: true } });
        else gsap.from(layer, { y: d * 90, ease: "none", scrollTrigger: { trigger: svg, start: "top bottom", end: "bottom bottom", scrub: true } });
      });
    });
  }

  /* ---------- En-têtes de sous-pages ---------- */
  function pageHero() {
    const ph = $(".page-hero");
    if (!ph) return;
    const img = $(".page-hero__media img", ph);
    if (img) gsap.fromTo(img, { yPercent: -4, scale: 1.12 }, { yPercent: 8, scale: 1, ease: "none", scrollTrigger: { trigger: ph, start: "top top", end: "bottom top", scrub: true } });
    const items = $$("[data-hero]", ph);
    gsap.to(items, { opacity: 1, y: 0, startAt: { y: 40 }, duration: 1.2, stagger: 0.12, ease: "power4.out", delay: 0.15 });
  }

  /* ---------- Barre de progression ---------- */
  function progressBar() {
    const bar = $(".scroll-progress span");
    if (bar) ST.create({ start: 0, end: "max", onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }) });
  }

  /* ---------- Lancement ---------- */
  // On attend les polices, mais jamais plus de 600 ms : le haut de page ne reste pas masqué
  const fontsReady = Promise.race([document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 600))]);
  // Page affichée sans rechargement : on attend aussi les scripts propres à la page (ex. environs.js)
  (nav && nav.soft ? Promise.all([fontsReady, nav.ready]) : fontsReady).then(async () => {
    if (!alive) return; // page déjà quittée
    try {
    splitTitles();
    reveals();
    revealPhoto();
    marquee();
    mapStory();
    programme();
    witnesses();
    landscapes();
    progressBar();
    document.dispatchEvent(new CustomEvent("cr:animations"));
    ST.refresh();
    // Retour arrière sans rechargement : position mémorisée ; sinon l'ancre de l'adresse
    const backTo = nav && nav.soft ? nav.takeScroll() : null;
    if (backTo != null) {
      if (lenis) lenis.scrollTo(backTo, { immediate: true, force: true }); else window.scrollTo(0, backTo);
    } else if (location.hash) {
      let id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch (e) { /* ancre mal formée : ignorée */ }
      const target = document.getElementById(id);
      if (target) scrollToEl(target, true);
    }
    await curtainOut();
    await playIntro();
    await window.__crGate; // le héros s'anime une fois l'invitation ouverte
    if (!alive) return;
    heroIn();
    pageHero();
    } catch (err) {
      // En cas d’imprévu, on affiche tout le contenu plutôt que de le laisser masqué
      html.classList.remove("motion", "intro", "curtain-in");
      if (window.console) console.error(err);
    }
  });
  // Images chargées : recalcul des positions (page affichée sans rechargement : ses propres images)
  if (nav && nav.soft) nav.loaded.then(() => { if (alive) ST.refresh(); });
  else listen(window, "load", () => ST.refresh());
  // Plusieurs recalculs s'enchaînent après un changement de format : on se replace une fois qu'ils sont finis
  let restoreTimer = 0;
  const onRefresh = () => {
    if (!keepEl) return;
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => { const el = keepEl; keepEl = null; if (el) scrollToEl(el, true); }, 180);
  };
  ST.addEventListener("refresh", onRefresh);
  onLeave(() => { ST.removeEventListener("refresh", onRefresh); clearTimeout(restoreTimer); });
})();
