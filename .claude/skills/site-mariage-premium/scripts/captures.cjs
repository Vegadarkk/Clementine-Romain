// Captures pleine page de plusieurs pages, à plusieurs largeurs, après défilement complet (animations jouées).
// Usage : node captures.cjs <url_de_base> <dossier_de_sortie_ABSOLU> [pages] [largeurs, ex. 390,1440,2560]
// Le dossier doit être hors du dépôt Git (ex. le dossier de travail temporaire) pour ne jamais commiter les images.
const load = require('./_load.cjs');
const path = require('path');
const fs = require('fs');
const { chromium } = load('playwright');

const [base, outDir, pagesArg = 'index,hebergements,temoins,environs,rsvp', widthsArg = '390,1440,2560', introKey = 'cr-intro'] = process.argv.slice(2);
if (!base || !outDir || !path.isAbsolute(outDir)) {
  console.error('Usage : node captures.cjs <url_de_base> <dossier_de_sortie_ABSOLU> [pages] [largeurs]');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const b = await chromium.launch();
  for (const w of widthsArg.split(',').map(Number)) {
    const h = w < 700 ? 844 : w > 2000 ? 1300 : 900;
    for (const pg of pagesArg.split(',')) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 700, isMobile: w < 700 });
      const p = await ctx.newPage();
      if (introKey) await p.addInitScript((k) => { try { sessionStorage.setItem(k, '1'); } catch (e) { /* rien */ } }, introKey);
      await p.goto(new URL(`${pg}.html`, base).href, { waitUntil: 'networkidle' });
      await p.waitForTimeout(2000);
      await p.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
          if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true }); else window.scrollTo(0, 0);
      });
      await p.waitForTimeout(1500);
      const file = path.join(outDir, `${pg}-${w}.png`);
      await p.screenshot({ path: file, fullPage: true });
      console.log(file);
      await ctx.close();
    }
  }
  await b.close();
})();
