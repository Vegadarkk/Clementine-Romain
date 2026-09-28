/* Formulaire de réponse (RSVP) — envoi automatique par e-mail via FormSubmit */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const form = $("#rsvp-form");
  if (!form) return;

  const gsap = window.gsap;
  const motion = document.documentElement.classList.contains("motion") && !!gsap;
  const endpoint = form.dataset.endpoint;
  const mailto = form.dataset.mailto;
  const list = $("[data-guests]", form);
  const addBtn = $("[data-guest-add]", form);
  const countEl = $("[data-guest-count]", form);
  const statusEl = $("[data-status]", form);
  const submitBtn = $("[data-submit]", form);
  const allergies = $("[data-allergies]", form);
  const success = $("[data-success]");
  const already = $("[data-rsvp-already]");
  const MAX_GUESTS = 15;
  const STORE_KEY = "cr-rsvp";
  const store = (() => { try { return window.localStorage; } catch (e) { return null; } })();

  /* -------------------------------------------------- Délai de réponse */
  const left = $("[data-deadline-left]");
  if (left) {
    const deadline = new Date("2027-03-15T23:59:59+01:00").getTime();
    const days = Math.ceil((deadline - Date.now()) / 86400000);
    left.textContent = days > 1 ? `Encore ${days} jours pour répondre` : days === 1 ? "Dernier jour pour répondre !" : "La date est passée, mais écrivez-nous quand même !";
  }

  /* ---------------------------------------------- Réponse déjà envoyée */
  function showAlready() {
    if (!already || !store) return;
    try {
      const prev = JSON.parse(store.getItem(STORE_KEY) || "null");
      if (!prev) return;
      $("span", already).textContent = `Vous avez déjà répondu le ${prev.date} (${prev.presence === "Oui" ? "présent·e·s" : "absent·e·s"} · ${prev.names}). Vous pouvez envoyer une nouvelle réponse si quelque chose change.`;
      already.hidden = false;
    } catch (e) { /* stockage indisponible */ }
  }
  showAlready();

  /* ------------------------------------------------------------ Invités */
  const guestRows = () => $$(".guest", list);
  function renumber() {
    const rows = guestRows();
    rows.forEach((row, i) => {
      const n = i + 1;
      const input = $(".input", row);
      const label = $("label.visually-hidden", row);
      const child = $(".guest__child input", row);
      const remove = $(".guest__remove", row);
      input.id = `guest-${n}`;
      input.name = `Invité ${n}`;
      input.required = n === 1;
      label.htmlFor = input.id;
      label.textContent = `Prénom et nom de la personne ${n}`;
      child.name = `Enfant ${n}`;
      remove.setAttribute("aria-label", `Retirer la personne ${n}`);
      remove.hidden = rows.length === 1;
    });
    addBtn.hidden = rows.length >= MAX_GUESTS;
    updateCount();
  }
  function guests() {
    return guestRows()
      .map((row) => ({ name: $(".input", row).value.trim().replace(/\s+/g, " "), child: $(".guest__child input", row).checked }))
      .filter((g) => g.name);
  }
  function updateCount() {
    const g = guests();
    if (g.length) { setError("guests", ""); $$(".guest .input", list).forEach((i) => i.removeAttribute("aria-invalid")); }
    const kids = g.filter((x) => x.child).length;
    countEl.textContent = g.length
      ? `${g.length} personne${g.length > 1 ? "s" : ""}${kids ? `, dont ${kids} enfant${kids > 1 ? "s" : ""}` : ""}`
      : "";
    progress();
  }
  function addGuest(focus = true) {
    const rows = guestRows();
    if (rows.length >= MAX_GUESTS) return;
    const row = rows[0].cloneNode(true);
    $(".input", row).value = "";
    $(".input", row).removeAttribute("aria-invalid");
    $(".guest__child input", row).checked = false;
    list.appendChild(row);
    renumber();
    if (focus) $(".input", row).focus();
  }
  addBtn.hidden = false;
  addBtn.addEventListener("click", () => addGuest(true));
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".guest__remove");
    if (!btn) return;
    const row = btn.closest(".guest");
    const rows = guestRows();
    const idx = rows.indexOf(row);
    const done = () => {
      row.remove();
      renumber();
      const target = guestRows()[Math.max(0, idx - 1)];
      target && $(".input", target).focus();
    };
    if (motion) gsap.to(row, { opacity: 0, x: 30, height: 0, marginTop: 0, duration: 0.35, ease: "power2.in", onComplete: done });
    else done();
  });
  list.addEventListener("input", updateCount);
  list.addEventListener("change", updateCount);
  // « Entrée » dans le dernier champ ajoute une personne au lieu d’envoyer le formulaire
  list.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.matches(".input")) return;
    e.preventDefault();
    const rows = guestRows();
    const isLast = e.target.closest(".guest") === rows[rows.length - 1];
    if (isLast && e.target.value.trim()) addGuest(true);
    else if (!isLast) $(".input", rows[rows.indexOf(e.target.closest(".guest")) + 1]).focus();
  });

  /* ---------------------------------------------------------- Présence */
  const presence = () => { const r = $("input[name='Présence']:checked", form); return r ? r.value : ""; };
  function onPresence() {
    const p = presence();
    const no = p === "Non";
    allergies.classList.toggle("is-collapsed", no);
    $("#allergies").disabled = no;
    $("[data-message-num]", form).textContent = no ? "3" : "4";
    $("[data-email-num]", form).textContent = no ? "4" : "5";
    const choices = $("[data-choices]", form);
    choices.removeAttribute("aria-invalid");
    setError("presence", "");
    progress();
    if (motion && p) {
      const lbl = $(`label[for='presence-${p.toLowerCase()}']`, form);
      gsap.fromTo(lbl, { scale: 0.96 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    }
  }
  $$("input[name='Présence']", form).forEach((r) => r.addEventListener("change", onPresence));

  /* ---------------------------------------------------------- Progression */
  function progress() {
    const s1 = guests().length > 0;
    const s2 = !!presence();
    const bars = $$(".form-progress span", form);
    bars[0] && bars[0].classList.toggle("is-done", s1);
    bars[1] && bars[1].classList.toggle("is-done", s2);
    bars[2] && bars[2].classList.toggle("is-done", s1 && s2);
  }

  /* --------------------------------------------------------- Validation */
  function setError(key, message) {
    const el = $(`[data-error='${key}']`, form);
    if (el) el.textContent = message;
  }
  function validate() {
    let firstInvalid = null;
    const first = $(".guest .input", list);
    if (!guests().length) {
      setError("guests", "Indiquez au moins un nom et prénom.");
      first.setAttribute("aria-invalid", "true");
      firstInvalid = firstInvalid || first;
    } else {
      setError("guests", "");
      $$(".guest .input", list).forEach((i) => i.removeAttribute("aria-invalid"));
    }
    if (!presence()) {
      setError("presence", "Dites-nous si vous serez présent(s) ou non.");
      $("[data-choices]", form).setAttribute("aria-invalid", "true");
      firstInvalid = firstInvalid || $("#presence-oui");
    }
    const email = $("#email");
    const ev = email.value.trim();
    if (ev && !emailRe.test(ev)) {
      setError("email", "Cette adresse e-mail ne semble pas valide.");
      email.setAttribute("aria-invalid", "true");
      firstInvalid = firstInvalid || email;
    } else {
      setError("email", "");
      email.removeAttribute("aria-invalid");
    }
    return firstInvalid;
  }
  // Les erreurs s’effacent pendant la frappe (et non à la perte du focus) : sinon le bouton
  // « Envoyer » se déplace au moment du clic et le clic est perdu.
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const emailInput = $("#email");
  emailInput.addEventListener("input", () => {
    const v = emailInput.value.trim();
    if (!v || emailRe.test(v)) { setError("email", ""); emailInput.removeAttribute("aria-invalid"); }
  });
  emailInput.addEventListener("blur", () => {
    const v = emailInput.value.trim();
    if (v && !emailRe.test(v)) { setError("email", "Cette adresse e-mail ne semble pas valide."); emailInput.setAttribute("aria-invalid", "true"); }
  });

  /* -------------------------------------------------------------- Envoi */
  function summary() {
    const g = guests();
    const p = presence();
    return {
      names: g.map((x) => x.name).join(", "),
      lines: [
        `Présence : ${p === "Oui" ? "Oui, présent(s)" : "Non, absent(s)"}`,
        `Invités : ${g.map((x) => (x.child ? `${x.name} (enfant)` : x.name)).join(", ")}`,
        p === "Oui" ? `Allergies / intolérances : ${$("#allergies").value.trim() || "—"}` : null,
        `Petit mot : ${$("#message").value.trim() || "—"}`,
      ].filter(Boolean),
    };
  }
  function mailtoLink() {
    const s = summary();
    const subject = `RSVP mariage — ${s.names || "réponse"}`;
    return `mailto:${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(s.lines.join("\n"))}`;
  }
  function setLoading(on) {
    submitBtn.disabled = on;
    const label = $("[data-label]", submitBtn);
    label.textContent = on ? "Envoi en cours…" : "Envoyer ma réponse";
    const icon = $(".icon, .spinner", submitBtn);
    if (on && icon) { const sp = document.createElement("span"); sp.className = "spinner"; sp.setAttribute("aria-hidden", "true"); icon.replaceWith(sp); }
    if (!on) { const sp = $(".spinner", submitBtn); if (sp) sp.outerHTML = '<svg class="icon" aria-hidden="true"><use href="assets/img/icons.svg#i-send"/></svg>'; }
  }
  function confetti() {
    if (!motion) return;
    const box = document.createElement("div");
    box.className = "confetti";
    document.body.appendChild(box);
    const colors = ["#C2185B", "#E91E63", "#F06292", "#FFB085", "#FFD9C7", "#A8BFA6"];
    const cx = window.innerWidth / 2, cy = window.innerHeight * 0.45;
    for (let i = 0; i < 70; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      p.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % colors.length]};animation:none;opacity:1`;
      box.appendChild(p);
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * Math.min(window.innerWidth, 700) * 0.55;
      gsap.timeline()
        .to(p, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.7 - 80, rotation: Math.random() * 540, duration: 0.9, ease: "power3.out" })
        .to(p, { y: `+=${window.innerHeight * 0.7}`, x: `+=${(Math.random() - 0.5) * 120}`, rotation: `+=${Math.random() * 360}`, opacity: 0, duration: 2.2 + Math.random(), ease: "power1.in" });
    }
    setTimeout(() => box.remove(), 4500);
  }
  function showSuccess() {
    const s = summary();
    const p = presence();
    const firsts = guests().map((g) => g.name.split(" ")[0]);
    const who = firsts.length > 1 ? `${firsts.slice(0, -1).join(", ")} et ${firsts[firsts.length - 1]}` : firsts[0];
    $("[data-success-title]").textContent = `Merci ${who} !`;
    $("[data-success-text]").textContent = p === "Oui"
      ? "Votre réponse est bien arrivée. Nous avons hâte de vous retrouver le 3 juillet 2027 pour célébrer ce grand jour ensemble !"
      : "Votre réponse est bien arrivée. Vous allez nous manquer… Merci de nous avoir prévenus !";
    if (store) {
      try { store.setItem(STORE_KEY, JSON.stringify({ date: new Date().toLocaleDateString("fr-FR"), presence: p, names: s.names })); } catch (e) { /* ignore */ }
    }
    form.hidden = true;
    already && (already.hidden = true);
    success.hidden = false;
    if (motion) gsap.from(success.children, { opacity: 0, y: 30, duration: 0.8, stagger: 0.1, ease: "power3.out" });
    success.focus({ preventScroll: true });
    requestAnimationFrame(() => window.crScrollTo && window.crScrollTo(success.closest(".rsvp-card")));
    if (p === "Oui") confetti();
  }
  function showError(detail) {
    statusEl.className = "form-status form-status--error";
    statusEl.innerHTML = "";
    const msg = document.createElement("span");
    msg.textContent = `Oups, l’envoi n’a pas abouti${detail ? ` (${detail})` : ""}. Réessayez dans un instant, ou `;
    const a = document.createElement("a");
    a.href = mailtoLink();
    a.textContent = "envoyez votre réponse par e-mail";
    statusEl.append(msg, a, document.createTextNode("."));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "";
    statusEl.className = "form-status";
    const invalid = validate();
    if (invalid) {
      if (window.crScrollTo) window.crScrollTo(invalid.closest(".form-step") || invalid);
      invalid.focus({ preventScroll: true });
      if (motion) gsap.fromTo(invalid.closest(".form-step"), { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }
    // Pot de miel anti-robots : on simule un succès sans rien envoyer
    if ($("input[name='_honey']", form).value) { showSuccess(); return; }

    const g = guests();
    const p = presence();
    const email = $("#email").value.trim();
    const payload = {
      _subject: `RSVP ${p === "Oui" ? "✅ Présent(s)" : "❌ Absent(s)"} — ${g.map((x) => x.name).join(", ")}`,
      _template: "table",
      _captcha: "false",
      "Réponse": p === "Oui" ? "Oui, présent(s)" : "Non, absent(s)",
      "Invités": g.map((x) => (x.child ? `${x.name} (enfant)` : x.name)).join(", "),
      "Nombre d’adultes": String(g.filter((x) => !x.child).length),
      "Nombre d’enfants": String(g.filter((x) => x.child).length),
      "Allergies / intolérances": p === "Oui" ? ($("#allergies").value.trim() || "—") : "—",
      "Petit mot": $("#message").value.trim() || "—",
      "E-mail de l’invité": email || "—",
    };
    if (email) payload._replyto = email;

    setLoading(true);
    const ctrl = "AbortController" in window ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), 20000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success === true || data.success === "true")) showSuccess();
      else showError(data.message ? "service indisponible" : `erreur ${res.status}`);
    } catch (err) {
      showError(err && err.name === "AbortError" ? "délai dépassé" : "connexion impossible");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  });

  const again = $("[data-rsvp-again]");
  again && again.addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    showAlready();
    if (window.crScrollTo) window.crScrollTo(form.closest(".rsvp-card"));
    $(".guest .input", list).focus({ preventScroll: true });
  });

  renumber();
  onPresence();
})();
