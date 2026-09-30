# Personnaliser le kit pour un nouveau couple

Le kit est la copie fonctionnelle du site de Clémentine & Romain. Tout ce qui est propre au couple est
listé ci-dessous. Remplace-le, puis relance `cd tools && npm install && npm run build`.
Les images (photos, témoins, lieu, hébergements, og-image, apple-touch-icon) et la musique ne sont pas
incluses : ajoute-les avec `scripts/images_webp.py` et un enregistrement libre de droits.

Pour tout retrouver : `grep -rn -i "clémentine\|clementine\|romain\|2027\|héry\|offenge\|bauges\|example.com" .`

## Identité (à refaire à chaque fois)
- `assets/css/style.css` → `:root` : palette (noms du fournisseur en commentaire), polices, rayons.
  Ajuste aussi les couleurs du ciel du programme (`skyStops` dans `main.js`) à la palette.
- `assets/fonts/` + `@font-face` en tête de `style.css` si tu changes de polices (`@fontsource/*` dans `tools/`).
- `tools/build-flowers.mjs` : couleurs et formes des fleurs → `npm run flowers`.
- `tools/build-pages.mjs` : textes de l'écran d'invitation (`gateArt()` : prénoms, accroche, date, lieu)
  puis `node build-logo.mjs --cachet` pour regénérer le cachet de cire aux nouvelles initiales.
- `tools/build-logo.mjs` : initiales (`glyph(PINYON, "C", …)` et `glyph(PINYON, "R", …)` dans `monogram()`), textes
  (« 03 · 07 · 2027 », prénoms en capitales, « samedi 3 juillet 2027 ») → `npm run logo` (site + favicon)
  et `npm run logos` (pistes pour `logos.html`).

## Textes et données du couple
- `tools/build-pages.mjs` : `SITE_URL`, `INDEXABLE` (Google), `OLD_SITES` (redirections), balises Open Graph (titre, description), marque de l'en-tête
  (prénoms, date), menu (`NAV`), date du menu mobile, pied de page (prénoms, date, lieux, date limite).
- `index.html` : héros (prénoms, date, compte à rebours `data-countdown="2027-07-03T14:00:00+02:00"`), ruban défilant, mot de bienvenue, photo
  plein écran (`data-rp-text`), lieux (adresses, horaires, itinéraires), carte racontée (textes des
  étapes), programme (horaires, lieux, textes), plan du domaine (photos, positions `left/top` en %,
  textes, crédit), infos pratiques, bandeau RSVP. Point focal du baiser : `data-heart-focus` sur
  `.hero__arch`. Point focal de la photo plein écran : `focus()` dans `revealPhoto()` (`main.js`), et point du cœur
  (entre les visages) : `data-heart-focus` sur `.reveal-photo__frame` (`data-heart-reach` = rayon d’approche).
- `hebergements.html` : citation du couple, rayon du radar, chiffres clés, tentes/vans/douche, fiches
  (`.stay`), taxis, liens de recherche (dates dans les URL Booking/Airbnb), crédit.
- `temoins.html` : texte d'intro, prénoms, statuts, photos, e-mail de contact (`temoins@example.com`).
- `environs.html` : fiches d'idées (texte, catégorie `data-cat`, coordonnées `data-lat`/`data-lng`),
  photo au dos (`data-photo` + `data-photo-alt/credit/license/license-url/source`, fichiers
  `assets/img/environs/<nom>-800.webp` et `-1600.webp` via `scripts/photos_commons.py`), idées bonus.
  Ces attributs sont retirés du kit (photos propres à chaque lieu) : sans `data-photo`, une fiche reste
  une fiche simple, non retournable. Exemple complet : `references/fonctionnalites.md` § 6.
- `assets/js/environs.js` : les deux lieux du mariage sur la carte Leaflet (`wedding`, avec coordonnées et horaires).
- `rsvp.html` : adresse FormSubmit (`mariage@example.com` dans `action`, `data-endpoint`, `data-mailto`),
  date limite, textes.
- `assets/js/rsvp.js` : date limite (`deadline`), message de succès (date du mariage), prénoms dans
  `from_name` (Web3Forms) et dans le texte « Copier ma réponse ».
- `rsvp.html` : clé Web3Forms (`data-web3forms-key`, reçue par e-mail par la personne qui reçoit les
  réponses), date limite du bandeau et du rappel en haut de page (`.hero-deadline`).
- `assets/js/main.js` : fichier agenda `.ics` (UID, DTSTART/DTEND en UTC, titre, lieu, description, nom du
  fichier). Titre du morceau et source audio (`data-src`) : bouton musique dans `build-pages.mjs`.
- `404.html`, `logos.html` : titres et textes.
- `README.md` : liens, adresse de réception, crédits.
- `tools/deploy-cloudflare.sh` : nom du projet Cloudflare Pages (`--project-name`), si le site y est publié.

## Cartes (données géographiques)
- `tools/build-map.mjs` + `tools/data/` : départements, lacs, trajet entre les lieux, pics, villages,
  positions des épingles. Sources dans `tools/data/README.md` (départements : france-geojson / IGN ;
  lacs : OpenStreetMap via Nominatim ; trajet : OSRM ; France et voisins : `world-atlas`, Natural Earth). Pour un autre lieu, remplace les GeoJSON (départements concernés, lacs, trajet
  mairie → réception) et les coordonnées, puis `npm run map` (réinjecte les SVG dans `index.html`).

## Clés de stockage navigateur
Préfixe `cr-` (`cr-intro`, `cr-curtain`, `cr-rsvp`, `cr-music`, `cr-logo`). Tu peux le garder, ou le
remplacer par les initiales du nouveau couple partout (`build-pages.mjs`, `main.js`, `rsvp.js`, `logos.html`).
