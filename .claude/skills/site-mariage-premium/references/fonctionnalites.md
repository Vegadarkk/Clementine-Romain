# Catalogue des fonctionnalités premium

## Sommaire
1. Socle technique (chargement, mouvement, filets de sécurité)
2. Commun à toutes les pages
3. Accueil
4. Hébergements
5. Témoins
6. Environs
7. RSVP
8. Logo et page de choix
9. Musique d'ambiance

Chaque entrée indique **où** la trouver dans le kit (`assets/starter/`) et **ce qui compte** pour
l'adapter. Les fonctions JS citées sont dans `assets/js/main.js`, sauf mention contraire.

---

## 1. Socle technique

- **Pile** : HTML statique + CSS + JS vanilla. Pas de build web nécessaire pour servir le site.
  `tools/` (Node) ne sert qu'à générer des ressources et à injecter le gabarit commun.
- **Bibliothèques incluses** dans `assets/vendor/` : GSAP 3 (ScrollTrigger, SplitText), Lenis
  (défilement fluide, `anchors: true`), Leaflet (page Environs uniquement). Pas de CDN : le site
  fonctionne même si un CDN est bloqué.
- **Classe `.motion`** : un petit script dans `<head>` (bloc `HEAD` de `build-pages.mjs`) ajoute `js`,
  puis `motion` si le visiteur n'a pas demandé de réduire les animations. Tous les états de départ
  cachés s'écrivent `.motion [data-reveal] { opacity: 0 }`. Sans JS ou en mouvement réduit, tout
  reste visible.
- **Filet de sécurité** : si `window.__crReady` n'est pas posé au bout de 5 s, la classe `motion` est
  retirée et le contenu apparaît. Le lancement dans `main.js` est aussi dans un try/catch qui retire
  `motion` en cas d'erreur.
- **Système d'apparition** (`reveals()`) : `data-reveal` (fondu + montée), `data-reveal="draw"`
  (dévoilement horizontal des ornements), `data-reveal="clip"`, `data-reveal-group` (enfants en cascade),
  `data-parallax`, `data-scrub-text`, `data-split` (titres découpés en lignes/mots par SplitText,
  **à la demande** quand le titre approche de l'écran : sur mobile, les découper tous au chargement
  bloquait le fil principal pendant 770 ms).
- **Défilement vers une ancre** : `window.crScrollTo(el)` passe par Lenis ; le décalage sous l'en-tête
  vient uniquement du CSS (`scroll-padding-top` / `scroll-margin-top`).

## 2. Commun à toutes les pages

| Élément | Où | Notes |
|---|---|---|
| En-tête (logo + nav + bouton « Je réponds ») qui se cache en descendant | `build-pages.mjs` (HEADER), `onScroll()` | `aria-current` posé automatiquement selon `data-page` du `<body>` |
| Logos (en-tête et pied de page) cliquables vers l'accueil | `build-pages.mjs` (`.brand`, `.site-footer__home`) | un lien vers la page courante (logo ou « Accueil » sur l'accueil) remonte en douceur au lieu de recharger |
| Menu mobile plein écran | `setMenu()` | tout le reste devient `inert`, Échap ferme, focus sur le 1er lien |
| Intro monogramme (1re visite) | `playIntro()`, `.intro-screen` | une seule fois par session (`sessionStorage cr-intro`), cliquable pour passer |
| Rideau entre les pages | `curtainOut()`, `isInternalPage()` | `/index.html` et `/` sont la même page (sinon l'ancre `#programme` recharge) |
| Barre de progression | `progressBar()` | |
| Curseur personnalisé, boutons magnétiques, cartes inclinées | bloc « Curseur, magnétisme, 3D » | uniquement sur pointeur précis (`hover: hover`), jamais sur tactile |
| Paysage de montagnes en parallaxe | `landscape()` dans `build-pages.mjs`, `landscapes()` | |
| Pétales dans les bandeaux | `makePetals()`, `data-petals` | |
| Bouton « haut de page » | bloc « Retour en haut » | apparaît seulement en fin de page, anneau de progression, rend le focus au logo |
| Musique d'ambiance | bloc « Musique d'ambiance » | voir § 9 |
| Toast + copier dans le presse-papiers | `toast()`, `data-copy` | |

## 3. Accueil

- **Héros** : prénoms en script qui se dévoilent (`data-hero-names`), photo en **arche** qui monte
  (`data-hero-media`), tampon tournant « Save the date », fleurs en parallaxe à la souris (`data-depth`),
  compte à rebours (`data-unit`), boutons « Je réponds » / « Le programme ».
- **Cœur vivant au survol du couple** : `.hero__arch[data-cursor-heart][data-heart-focus="0.466 0.585"]`
  (point du baiser dans l'image, en fractions). Le curseur devient un disque avec un vrai cœur SVG qui
  **bat** (double battement calculé à chaque image). Le rythme passe de 50 à 140 battements par minute
  quand on approche du point focal, avec une onde à chaque battement, une lueur, et de petits cœurs qui
  s'envolent tout près. Un clic lance une gerbe. Le point focal tient compte de `object-fit: cover`.
  Pour une autre photo, repère le point sur l'image et mets à jour `data-heart-focus`.
  Même effet sur la photo plein écran (`.reveal-photo__frame`, point entre les visages, portée réduite
  `data-heart-reach="0.4"`) : le point est recalculé à chaque image depuis le cadre réel de `img`
  (zoom GSAP compris), et le texte posé dessus est en `pointer-events: none` pour ne pas couper le cœur.
- **Ruban défilant** (`fillMarquee()` / `marquee()`) : le groupe est dupliqué autant que nécessaire pour
  couvrir l'écran, et le décalage vaut exactement la largeur d'un groupe (`--marquee-shift`). Il
  accélère et s'incline selon la vitesse de défilement.
- **Photo arche → plein écran** (`revealPhoto()`) : section de 230 vh avec un bloc collant. L'arche,
  toujours verticale, est calculée en pixels. L'image démarre **centrée sur le couple**
  (point focal en fractions) puis se déploie. Le voile sombre apparaît avec le déploiement. Le texte
  (`data-rp-text`) joue une animation en temps réel (pas liée au défilement) : surtitre qui se resserre,
  mot script écrit à l'encre (masque dégradé sur `--ink`), filet qui se trace, date qui monte ligne par
  ligne, lieux. L'animation se rejoue à l'envers en remontant. Sur ordinateur le texte est en bas à
  gauche, sur mobile en bas au centre : ne jamais le poser sur les visages.
- **Deux lieux** : cartes (illustration SVG du village, photo du château) avec adresse, horaires et
  itinéraire Google Maps.
- **Carte racontée** (`mapStory()`) : la France se dessine (contour, pics, épingle qui rebondit), zoom
  vers la région, puis carte régionale (lacs, massif, trajet entre les deux lieux qui se trace). Carte
  générée depuis de vraies données (`tools/build-map.mjs`). Les épingles sont dans un groupe positionné
  + un groupe animé.
- **Programme horizontal** (`programme()`) : section épinglée qui défile horizontalement sur grand écran,
  en liste verticale sur mobile. Le ciel suit la journée (`sky(p)`) : crème → pêche → coucher rose →
  violet → **nuit bleue**. Le soleil suit une seule courbe continue puis **se couche derrière les
  montagnes** (paysage large dédié `PAYSAGE_SOIR`, sommets toujours visibles) et disparaît,
  la lune se lève, 90 étoiles scintillent, une étoile filante passe (classe `is-night`). Le paysage
  s'assombrit. Termine par « Et la fête continue… » + ajout à l'agenda (.ics généré, Google Agenda).
- **Plan interactif du domaine** (`data-domaine`) : plan du lieu (fourni par le lieu) avec des numéros
  pulsants, posés **à côté** des libellés du plan et pas dessus. Au clic : photo + description en fondu,
  flèches précédent/suivant, annonce pour lecteur d'écran, crédit du lieu. Sans JS : toutes les fiches
  sont listées.
- **Infos pratiques** + bandeau final « Serez-vous des nôtres ? ».

## 4. Hébergements

- Citation du couple, **radar** « 10 km » : le faisceau est un **trait fin** (pseudo-élément, pas le bord
  du dégradé conique, qui sort crénelé) et tourne dans le sens horaire. La **traînée suit** le faisceau
  (dégradé `transparent 72% → accent 100%`). Chaque point pulse juste **après** le passage du faisceau
  (décalage d'animation négatif calculé selon son angle).
- Chiffres clés (nombre d'adresses, lits à proximité, gîtes à pied).
- Tentes / douche / vans (cartes info) + photo de l'espace tentes avec renvoi vers le plan.
- **Fiches d'hébergement** (`.stay`) : photo 3:2 avec badge de distance (fuchsia si « à pied »), type et
  capacité, commune, téléphone `tel:`, lien « Site web » / « Voir l'annonce ». Deux groupes
  (« À deux pas » / « Un peu plus loin »), grille flex centrée pour éviter les cartes seules.
- Encart taxis, liens de recherche Booking / Airbnb / Google Maps pré-remplis avec les dates.

## 5. Témoins

`witnesses()` + `.witness2`. Chaque témoin a une **forme organique** différente derrière la photo (blob
SVG qui « respire » avec `@keyframes morph`), un anneau, une fleur, le prénom qui se dévoile, un trait
calligraphié qui se dessine, puis le statut. Les témoins qui entrent ensemble à l'écran apparaissent
**l'un après l'autre** (`ST.batch` + délai de 0,42 s). Encart « organiser une surprise » avec l'e-mail
(copier + mailto). Le texte d'intro est centré.

## 6. Environs (`assets/js/environs.js`)

- Fiches (catégorie, icône, texte, « Voir sur la carte », « Itinéraire »).
- **Filtres** collants : fondu sortant rapide, puis cascade entrante. **Pas de GSAP Flip** : son
  positionnement absolu laissait des cartes décalées, voire une page vide, sur grand écran et en clics
  rapides. L'animation en cours est terminée proprement avant d'en lancer une autre. Si la grille est
  sortie de l'écran, remontée douce vers les filtres (après `lenis.resize()`, car la page vient de
  raccourcir).
- **Carte Leaflet** chargée à l'approche : fond Esri World Topo (relief, sans clé), bascule automatique
  sur OpenStreetMap après 4 erreurs de tuiles, marqueurs colorés par catégorie, lieux du mariage en plus
  grand. CARTO exige désormais une clé API : ne pas l'utiliser.
- Idées bonus empilées (cartes qui rétrécissent quand la suivante arrive).

## 7. RSVP (`assets/js/rsvp.js`, `rsvp.html`)

- Envoi AJAX à FormSubmit (`data-endpoint="https://formsubmit.co/ajax/<email>"`), `_subject` explicite
  (✅/❌ + noms), `_template: table`, `_captcha: false`, pot de miel `_honey`, champ `email` (réponse
  directe à l'invité). Repli : lien mailto pré-rempli si l'envoi échoue.
- Invités multiples (ajout/suppression, case « Enfant »), présence Oui/Non en `radiogroup`,
  allergies, petit mot avec compteur, barre de progression du formulaire.
- Validation douce : les erreurs s'effacent **à la saisie** et pas à la perte de focus (sinon le
  décalage de mise en page fait rater le clic sur « Envoyer »). `form.noValidate = true` est posé en JS,
  pas dans le HTML, pour que le repli sans JS garde la validation native.
- Libellé du bouton dans `[data-label]` (sinon « Envoi en cours… » reste affiché).
- Succès : confettis, message personnalisé, réponse mémorisée (`localStorage`) avec « modifier ma
  réponse ». Date limite dépassée : message dédié.

## 8. Logo et page de choix

- `tools/build-logo.mjs` : lettres tirées des vrais contours de Pinyon Script (opentype.js ; sérialiseur
  `pathData()` maison, car `toPathData()` produisait des NaN). Entrelacement par masques (C au-dessus de R
  en haut, R au-dessus de C en bas). Quatre pistes : arche fleurie, couronne, sceau de cire, éditorial.
  `npm run logos` génère les pistes dans `assets/img/logos/` ; `npm run logo` génère le logo du site
  (symboles `#logo-arche` injectés dans chaque page + favicon).
- Couleurs du logo pilotées en CSS (`currentColor`, `--mono-accent`, `--mono-sub`, épaisseurs `--mono-sw`).
- Canevas Claude Design (outil Artifact) avec une planche par piste, et `logos.html` à envoyer au couple :
  fond clair, fond sombre, en-tête, petits formats, bouton « Je choisis celui-ci », piste recommandée
  mise en avant avec la raison.

## 9. Musique d'ambiance

- Bouton rond en bas à gauche (`data-music`), barres d'égaliseur animées pendant la lecture, info-bulle
  qui indique le morceau. **Aucune lecture automatique.** Une suggestion discrète s'affiche une seule
  fois par visite, au bout de 5 s.
- Fondu d'entrée de 2,2 s jusqu'au volume 0,32, fondu de sortie de 0,7 s. État et position mémorisés dans
  `sessionStorage`. Sur la page suivante, reprise au même endroit. Si le navigateur bloque la lecture,
  elle reprend au premier geste du visiteur (le bouton pulse).
- Fichier : MP3 VBR (~100 kb/s), volume normalisé (`loudnorm I=-20`), fondus au début et à la fin,
  métadonnées propres. Pour l'encoder sans ffmpeg système : `pip install imageio-ffmpeg`.
- Sources sûres : Musopen (domaine public), Open Goldberg / Open Well-Tempered Clavier (CC0),
  Internet Archive en filtrant sur `licenseurl` (publicdomain / CC0), en vérifiant l'interprète.
  L'API Wikimedia peut renvoyer 429 depuis un serveur partagé.
