// Construit le sprite d'icônes assets/img/icons.svg (icônes Lucide, licence ISC + quelques icônes maison)
// Usage : cd tools && npm run icons
import { readFileSync, writeFileSync } from "node:fs";

const LUCIDE = [
  "mountain", "mountain-snow", "waves", "house", "church", "landmark", "wine", "utensils-crossed", "users",
  "tent", "shower-head", "caravan", "bed-double", "calendar-heart", "calendar-plus", "map-pin", "navigation",
  "heart", "mail", "copy", "check", "footprints", "bike", "binoculars", "castle", "sun", "leaf", "clock", "gift",
  "plus", "minus", "x", "menu", "chevron-down", "external-link", "train-front", "plane", "compass", "sparkles",
  "tree-pine", "droplets", "car", "chef-hat", "baby", "user", "send", "arrow-right", "arrow-down",
  "map", "flower-2", "hotel", "search", "ship", "sailboat", "camera", "info", "circle-alert", "rotate-ccw", "phone", "globe", "trash-2", "user-plus", "party-popper",
];

const CUSTOM = {
  rings: '<circle cx="9" cy="14.5" r="5.5"/><circle cx="15" cy="14.5" r="5.5"/><path d="M15 3.2l1.9 2.1L15 7.4l-1.9-2.1z"/>',
  paraglider: '<path d="M3 8.5C7.5 3.5 16.5 3.5 21 8.5"/><path d="M3 8.5l9 8.5 9-8.5M8 5.6 12 17l4-11.4"/><circle cx="12" cy="19.5" r="1.6"/>',
  cheese: '<path d="M3 18v-6.5L15 5l6 6.5V18z"/><path d="M3 11.5h18"/><circle cx="8" cy="14.8" r="1.1"/><circle cx="14" cy="15.5" r="1.4"/><circle cx="18" cy="14" r=".8"/>',
  canoe: '<path d="M2 14h20c-2 3.5-6 5-10 5s-8-1.5-10-5z"/><path d="M16.5 3 9.5 16.5"/><path d="M15.4 2.2l2.4 1.2-1 2.3-2.4-1.2z"/>',
  bridge: '<path d="M2 8c5 6 15 6 20 0"/><path d="M2 8v12M22 8v12M2 15.5h20M7 11.9v3.6M12 13.4v2.1M17 11.9v3.6"/>',
  swim: '<circle cx="16.5" cy="6" r="2"/><path d="M4 12.5 9.5 9l3 3.5L9 15"/><path d="M2 17.5c1.7 0 1.7 1.2 3.3 1.2S7 17.5 8.7 17.5s1.7 1.2 3.3 1.2 1.7-1.2 3.3-1.2 1.7 1.2 3.4 1.2 1.6-1.2 3.3-1.2"/>',
  climbing: '<path d="M4 21 10 3h4l6 18"/><circle cx="12" cy="9" r="1.4"/><path d="M12 10.5v4l-2 3M12 12l2.5-1.5M12 14.5l2 3"/>',
};

let out = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n';
out += "<!-- Icônes : Lucide (https://lucide.dev, licence ISC) + icônes maison -->\n";
for (const name of LUCIDE) {
  const svg = readFileSync(new URL(`./node_modules/lucide-static/icons/${name}.svg`, import.meta.url), "utf8");
  const inner = svg
    .replace(/<!--.*?-->/gs, "")
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .replace(/\s*\n\s*/g, "")
    .replace(/ \/>/g, "/>");
  out += `<symbol id="i-${name}" viewBox="0 0 24 24">${inner}</symbol>\n`;
}
for (const [name, inner] of Object.entries(CUSTOM)) out += `<symbol id="i-${name}" viewBox="0 0 24 24">${inner}</symbol>\n`;
out += "</svg>\n";
writeFileSync(new URL("../assets/img/icons.svg", import.meta.url), out);
console.log(`icons.svg : ${LUCIDE.length + Object.keys(CUSTOM).length} icônes, ${(out.length / 1024).toFixed(1)} Ko`);
