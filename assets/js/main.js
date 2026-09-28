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
  const motion = html.classList.contains("motion");
  const store = (() => { try { return window.sessionStorage; } catch (e) { return null; } })();

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
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    html.classList.add("lenis");
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
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------ Menu mobile */
  const toggle = $(".nav-toggle");
  const menu = $("#menu-mobile");
  if (toggle && menu) {
    const outside = [$(".skip-link"), $(".brand"), $("main"), $(".site-footer")].filter(Boolean);
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
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => e.matches && setMenu(false));
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
        done.textContent = diff > -86400000 ? "C’est le grand jour !" : "Merci d’avoir partagé ce jour avec nous";
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
      const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
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
    const norm = (path) => path.replace(/\/index\.html$/, "/");
    if (norm(url.pathname) === norm(location.pathname) && url.hash) return false;
    return /(\.html|\/)$/.test(url.pathname);
  }
  if (motion && curtain) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !isInternalPage(a)) return;
      e.preventDefault();
      const href = a.href;
      store && store.setItem("cr-curtain", "1");
      curtain.style.visibility = "visible";
      gsap.timeline({ onComplete: () => { location.href = href; } })
        .fromTo(curtainPanels, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: "power4.inOut", stagger: 0.09 });
    });
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) { gsap.set(curtainPanels, { yPercent: 100 }); curtain.style.visibility = "hidden"; }
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
      window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); cursor.classList.remove("is-out"); }, { passive: true });
      document.addEventListener("pointerleave", () => cursor.classList.add("is-out"));
      document.addEventListener("pointerover", (e) => {
        const labelled = e.target.closest("[data-cursor]");
        const link = e.target.closest("a, button, label, input, textarea, select, [role=button]");
        cursor.classList.toggle("has-label", !!labelled);
        cursor.classList.toggle("is-link", !!link && !labelled);
        if (labelled && label) label.textContent = labelled.getAttribute("data-cursor");
      });
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
      const text = $(".intro-screen__mono text", screen);
      tl.to(text, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" })
        .to([text, $$(".intro-screen__mono tspan", screen)], { fillOpacity: 1, duration: 0.5 }, "-=0.45")
        .to($(".intro-screen__date", screen), { opacity: 1, letterSpacing: "0.3em", duration: 0.6 }, "-=0.35")
        .to(screen, { clipPath: "inset(0 0 100% 0)", duration: 0.85, ease: "expo.inOut" }, "+=0.1");
      const skip = () => tl.progress(0.92);
      screen.addEventListener("click", skip, { once: true });
      document.addEventListener("keydown", skip, { once: true });
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
      const small = window.matchMedia("(max-width: 700px)").matches;
      const start = small ? "inset(18% 14% 18% 14% round 36vw 36vw 22px 22px)" : "inset(15% 33% 15% 33% round 17vw 17vw 22px 22px)";
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.8 } });
      tl.fromTo(frame, { clipPath: start }, { clipPath: "inset(0% 0% 0% 0% round 0vw 0vw 0px 0px)", ease: "power2.inOut", duration: 1 })
        .fromTo($("img", frame), { scale: 1.3 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .to($(".reveal-photo__text", sec), { opacity: 1, y: 0, startAt: { y: 50 }, duration: 0.35 }, 0.7);
    });
  }

  /* ---------- Bandeau défilant réactif à la vitesse ---------- */
  function marquee() {
    $$("[data-marquee]").forEach((m) => {
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
          gsap.to(track, { skewX: gsap.utils.clamp(-8, 8, -v / 250), duration: 0.4, overwrite: true });
        },
      });
      gsap.ticker.add(() => {
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

    const franceIn = (tl, at = 0) => tl
      .to($(".map-land", fr), { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, at)
      .to($(".map-land", fr), { fillOpacity: 1, duration: 0.8 }, at + 0.8)
      .from([$(".map-neighbours", fr), $(".map-region", fr)], { opacity: 0, duration: 0.8 }, at + 0.6)
      .to($$(".map-peak", fr), { opacity: 1, scaleY: 1, startAt: { scaleY: 0, transformOrigin: "50% 100%" }, duration: 0.6, stagger: 0.02, ease: "back.out(2)" }, at + 1)
      .to($$(".map-label", fr), { opacity: 1, duration: 0.5, stagger: 0.1 }, at + 1.3)
      .to($(".map-pin", fr), { opacity: 1, y: 0, startAt: { y: -60 }, duration: 0.7, ease: "bounce.out" }, at + 1.6)
      .to($(".map-pulse", fr), { opacity: 0.25, duration: 0.3 }, at + 2.1);
    const baugesIn = (tl, at = 0) => tl
      .to($$(".map-peak", bg), { opacity: 1, scaleY: 1, startAt: { scaleY: 0, transformOrigin: "50% 100%" }, duration: 0.6, stagger: 0.025, ease: "back.out(2)" }, at)
      .to($$(".map-label:not(.map-venue)", bg), { opacity: 1, duration: 0.5, stagger: 0.06 }, at + 0.4)
      .to($(".pin-hery", bg), { opacity: 1, y: 0, startAt: { y: -50 }, duration: 0.7, ease: "bounce.out" }, at + 0.7)
      .to($(".map-route-mask", bg), { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, at + 1)
      .to($(".pin-chateau", bg), { opacity: 1, y: 0, startAt: { y: -50 }, duration: 0.7, ease: "bounce.out" }, at + 2.2)
      .to($$(".map-venue", bg), { opacity: 1, x: 0, startAt: { x: -12 }, duration: 0.6, stagger: 0.3 }, at + 1.2);

    gsap.to($(".map-pulse", fr), { scale: 2.6, transformOrigin: "50% 50%", opacity: 0, duration: 1.8, repeat: -1, ease: "power1.out", delay: 3 });

    const mm = gsap.matchMedia();
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
          onUpdate: (self) => setStep(self.progress < 0.12 ? 0 : self.progress < 0.36 ? 1 : 2),
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
    const skyStops = [
      { p: 0, top: "#FFF3E6", bot: "#FFE6D6", sun: "#FFE1B0" },
      { p: 0.45, top: "#FFE6D4", bot: "#FFC9A6", sun: "#FFC48F" },
      { p: 0.75, top: "#FDBFA3", bot: "#F68BAF", sun: "#FFA77F" },
      { p: 1, top: "#5E2A4C", bot: "#C9457A", sun: "#F06292" },
    ];
    const mix = (a, b, t) => gsap.utils.interpolate(a, b, t);
    function sky(p) {
      let i = 0;
      while (i < skyStops.length - 2 && p > skyStops[i + 1].p) i++;
      const a = skyStops[i], b = skyStops[i + 1];
      const t = gsap.utils.clamp(0, 1, (p - a.p) / (b.p - a.p));
      sec.style.setProperty("--sky-top", mix(a.top, b.top, t));
      sec.style.setProperty("--sky-bot", mix(a.bot, b.bot, t));
      sec.style.setProperty("--sun", mix(a.sun, b.sun, t));
      const dusk = gsap.utils.clamp(0, 1, (p - 0.78) / 0.22);
      sec.style.setProperty("--dusk", dusk.toFixed(3));
      sec.classList.toggle("is-dusk", p > 0.9);
      if (sun) { sun.style.left = `${10 + p * 78}%`; sun.style.top = `${12 + Math.pow(p, 1.6) * 62}%`; }
    }
    sky(0);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (min-height: 620px)", () => {
      sec.classList.add("is-horizontal");
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(), ease: "none",
        scrollTrigger: { trigger: sec, pin: true, start: "top top", end: () => `+=${distance()}`, scrub: 1, invalidateOnRefresh: true, onUpdate: (self) => sky(self.progress) },
      });
      gsap.to($$(".programme__intro > *", sec), { opacity: 1, y: 0, startAt: { y: 30 }, duration: 1, stagger: 0.1, scrollTrigger: { trigger: sec, start: "top 70%" } });
      $$(".moment, .programme__outro", sec).forEach((m) => {
        gsap.fromTo(m, { opacity: 0, rotation: 3, yPercent: 20 }, { opacity: 1, rotation: 0, yPercent: 0, duration: 1, scrollTrigger: { trigger: m, containerAnimation: tween, start: "left 88%", toggleActions: "play none none reverse" } });
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
      return () => { sec.removeEventListener("focusin", onFocus); sec.classList.remove("is-horizontal", "is-dusk"); gsap.set(track, { clearProps: "transform" }); };
    });
    mm.add("(max-width: 1023px), (max-height: 619px)", () => {
      gsap.to($$(".programme__intro > *", sec), { opacity: 1, y: 0, startAt: { y: 30 }, duration: 1, stagger: 0.1, scrollTrigger: { trigger: sec, start: "top 80%" } });
      $$(".moment, .programme__outro", sec).forEach((m) => {
        gsap.to(m, { opacity: 1, x: 0, startAt: { x: 40 }, duration: 1, scrollTrigger: { trigger: m, start: "top 88%" } });
      });
      ST.create({ trigger: sec, start: "top 60%", end: "bottom bottom", onUpdate: (self) => sky(self.progress) });
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
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([fontsReady, curtainOut()]).then(async () => {
    try {
    splitTitles();
    reveals();
    revealPhoto();
    marquee();
    mapStory();
    programme();
    landscapes();
    progressBar();
    document.dispatchEvent(new CustomEvent("cr:animations"));
    ST.refresh();
    if (location.hash) {
      let id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch (e) { /* ancre mal formée : ignorée */ }
      const target = document.getElementById(id);
      if (target) requestAnimationFrame(() => scrollToEl(target, true));
    }
    await playIntro();
    heroIn();
    pageHero();
    } catch (err) {
      // En cas d’imprévu, on affiche tout le contenu plutôt que de le laisser masqué
      html.classList.remove("motion", "intro", "curtain-in");
      if (window.console) console.error(err);
    }
  });
  window.addEventListener("load", () => ST.refresh());
})();
