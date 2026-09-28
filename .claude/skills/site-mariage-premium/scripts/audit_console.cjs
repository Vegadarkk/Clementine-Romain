// Parcourt chaque page jusqu'en bas (défilement progressif pour déclencher les animations) et relève :
// erreurs JS, erreurs console, requêtes en échec, réponses HTTP >= 400, débordement horizontal.
// Usage : node audit_console.cjs <url_de_base> [pages] [largeur x hauteur] [clé sessionStorage d'intro à sauter]
// Ex.    : node audit_console.cjs http://127.0.0.1:8765/ index,hebergements,temoins,environs,rsvp,404 1440x900 cr-intro
const load = require('./_load.cjs');
const { chromium } = load('playwright');

const [base = 'http://127.0.0.1:8765/', pagesArg = 'index,hebergements,temoins,environs,rsvp,404', size = '1440x900', introKey = 'cr-intro'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);

(async () => {
  const b = await chromium.launch();
  let bad = 0;
  for (const pg of pagesArg.split(',')) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push('JS : ' + e.message));
    // Les erreurs de certificat viennent souvent du proxy de l'environnement de test, pas du site
    p.on('console', (m) => { if (m.type() === 'error' && !/ERR_CERT_AUTHORITY_INVALID/.test(m.text())) errs.push('console : ' + m.text()); });
    p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) errs.push(`HTTP ${r.status()} ${r.url()}`); });
    if (introKey) await p.addInitScript((k) => { try { sessionStorage.setItem(k, '1'); } catch (e) { /* rien */ } }, introKey);
    await p.goto(new URL(`${pg}.html`, base).href, { waitUntil: 'networkidle' });
    await p.waitForTimeout(2500);
    await p.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
    });
    await p.waitForTimeout(1200);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 0) errs.push(`débordement horizontal de ${overflow}px`);
    // Textes qui devraient être visibles mais sont restés à opacité ~0 (on ignore les panneaux volontairement masqués)
    const hidden = await p.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3, main p')].filter((e) => {
      if (!e.offsetParent || e.closest('[aria-hidden="true"], [inert], [hidden]') || getComputedStyle(e).visibility === 'hidden') return false;
      for (let n = e; n && n !== document.body; n = n.parentElement) if (+getComputedStyle(n).opacity < 0.05) return true;
      return false;
    }).length);
    if (hidden) errs.push(`${hidden} texte(s) encore invisible(s) après défilement complet`);
    bad += errs.length;
    console.log(`${pg} @${w} : ${errs.length ? errs.join(' | ') : 'OK'}`);
    await ctx.close();
  }
  await b.close();
  process.exitCode = bad ? 1 : 0;
})();
