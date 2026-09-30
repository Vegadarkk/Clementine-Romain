// Visuels du faire-part par e-mail : chaque « plaque » de visuels.html devient une image @2x dans
// assets/img/faire-part (JPEG pour les grands visuels, PNG pour le reste), sur le fond papier des e-mails.
// Usage : cd tools && node faire-part/rendre.mjs   (Playwright requis : npx playwright ou installation globale)
import { readFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = process.env.FP_OUT || join(ROOT, "assets/img/faire-part");
// Nom de la plaque → fichier publié (les e-mails pointent vers ces noms : ne pas les changer)
const FILES = {
  "a-hero": "a-sceau.jpg", "a-orn": "a-ornement.png", "a-sign": "a-signature.png", "a-foot": "a-pied.jpg",
  "b-logo": "b-monogramme.png", "b-hero": "b-photo.jpg", "b-names": "b-prenoms.png", "b-mont": "b-montagnes.png",
  "b-ico-date": "b-picto-date.png", "b-ico-lieu": "b-picto-lieu.png", "b-ico-rsvp": "b-picto-reponse.png",
};
const TYPES = { ".html": "text/html", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg" };

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("/opt/node22/lib/node_modules/playwright")); }

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
// Tout est servi depuis le dépôt, sans serveur : /__fp/visuels.html et /assets/…
await page.route("http://faire-part.local/**", (route) => {
  const path = decodeURIComponent(new URL(route.request().url()).pathname);
  const file = path.startsWith("/__fp/") ? join(HERE, path.slice(6)) : join(ROOT, path);
  if (!existsSync(file) || !statSync(file).isFile()) return route.fulfill({ status: 404, body: "" });
  route.fulfill({ body: readFileSync(file), contentType: TYPES[extname(file)] || "application/octet-stream" });
});
await page.goto("http://faire-part.local/__fp/visuels.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
for (const [id, name] of Object.entries(FILES)) {
  const el = await page.$("#" + id);
  if (!el) { console.warn("plaque absente :", id); continue; }
  const type = name.endsWith(".jpg") ? "jpeg" : "png";
  await el.screenshot({ path: join(OUT, name), type, ...(type === "jpeg" ? { quality: 88 } : {}) });
  console.log("✓", name);
}
await browser.close();
console.log("Optimiser ensuite les PNG (ex. pngquant) : les e-mails doivent rester légers.");
