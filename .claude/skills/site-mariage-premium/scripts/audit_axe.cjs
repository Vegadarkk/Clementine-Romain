// Audit d'accessibilité axe-core (WCAG 2.1 A/AA + bonnes pratiques) sur plusieurs pages et deux tailles.
// Usage : node audit_axe.cjs <url_de_base> [pages séparées par des virgules] [largeurs, ex. 1440x900,390x844]
// Ex.    : node audit_axe.cjs http://127.0.0.1:8765/ index,hebergements,temoins,environs,rsvp,404
// Pré-requis : playwright + axe-core (npm i -D playwright axe-core), serveur local lancé (npx http-server . -p 8765 -c-1).
const load = require('./_load.cjs');
const { chromium } = load('playwright');
const axeSrc = require('fs').readFileSync(load.resolve('axe-core/axe.min.js'), 'utf8');

const [base = 'http://127.0.0.1:8765/', pagesArg = 'index,hebergements,temoins,environs,rsvp,404', sizesArg = '1440x900,390x844'] = process.argv.slice(2);
const pages = pagesArg.split(',');
const sizes = sizesArg.split(',').map((s) => s.split('x').map(Number));

(async () => {
  const b = await chromium.launch();
  let total = 0;
  for (const [w, h] of sizes) {
    for (const pg of pages) {
      // Mouvement réduit : tout le contenu est visible, axe voit la page complète
      const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      await p.goto(new URL(`${pg}.html`, base).href, { waitUntil: 'networkidle' });
      await p.waitForTimeout(800);
      await p.addScriptTag({ content: axeSrc });
      const res = await p.evaluate(async () => {
        const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
        return r.violations.map((v) => ({
          id: v.id, impact: v.impact, n: v.nodes.length, help: v.help,
          targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ') + (n.any[0] && n.any[0].data && n.any[0].data.contrastRatio ? ` [${n.any[0].data.fgColor} sur ${n.any[0].data.bgColor} = ${n.any[0].data.contrastRatio}]` : '')),
        }));
      });
      total += res.length;
      console.log(`== ${pg} @${w} : ${res.length} violation(s)`);
      res.forEach((v) => console.log(`  - [${v.impact}] ${v.id} (${v.n}) ${v.help}\n      ${v.targets.join('\n      ')}`));
      await ctx.close();
    }
  }
  await b.close();
  console.log(total ? `\n${total} violation(s) au total` : '\nAucune violation.');
  process.exitCode = total ? 1 : 0;
})();
