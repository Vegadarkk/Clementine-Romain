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
10. Navigation sans rechargement (musique continue)

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
  **bat** (double battement calculé à chaque image) et **grandit** avec la proximité : petit loin du couple,
  presque la taille du disque tout près (échelle 0,56 → 3,4, battement adouci quand il est grand). Le rythme passe de 50 à 140 battements par minute
  quand on approche du point focal, avec une onde à chaque battement, une lueur, et de petits cœurs qui
  s'envolent tout près. Un clic lance une gerbe. Le point focal tient compte de `object-fit: cover`.
  Pour une autre photo, repère le point sur l'image et mets à jour `data-heart-focus`. Le couple veut ce
  cœur sur **toutes** ses photos : héros, photo plein écran et arche de la page RSVP (`.rsvp-aside .arch`).
  Même effet sur la photo plein écran (`.reveal-photo__frame`, point entre les visages, portée réduite
  `data-heart-reach="0.4"`) : le point est recalculé à chaque image depuis le cadre réel de `img`
  (zoom GSAP compris), et le texte posé dessus est en `pointer-events: none` pour ne pas couper le cœur.
- **Photo plein écran décorée** (`revealPhoto()`) : l'arche de départ porte le même décor que le héros
  (filet, bouquet, pivoine, rose, tampon « Save the date », pétales qui tombent), calé en JS sur l'arche
  (`placeDeco()`, recalé à chaque `refreshInit`). Chorégraphie liée au défilement : le décor s'envole
  vers l'extérieur (0 → 0,3), puis la photo s'ouvre (0,3 → 1,3), puis « Rendez-vous » s'écrit (≥ 1,27),
  pause de 0,35 ; section de 310vh. Apparition du décor par un déclencheur simple (`top 70%`) sur les
  images, envol sur leurs conteneurs : jamais deux animations sur la même propriété du même élément.
- **Écran « Ouvrir l'invitation »** (`[data-gate]`, gabarit commun) : première page de la visite ; son
  clic autorise la musique, qui continue ensuite de page en page (Chrome garde l'autorisation lors d'une
  navigation par lien). Ne se ferme **jamais** seul (demande du couple : l'invité clique pour entrer, même si le navigateur permettrait le son) ; la musique attend ce clic ; « Entrer sans musique » est mémorisé ;
  jamais pour les robots ; l'intro du monogramme et le héros attendent sa fermeture (`window.__crGate`).
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
- **Cartes retournables** : un clic (ou un toucher) sur une fiche la fait pivoter en 3D (GSAP `rotationY`
  + `z` en aller-retour : la carte se soulève en tournant) et montre au dos la photo du lieu, son nom,
  le crédit (auteur + licence, liens vers Commons) et un bouton « Agrandir ». Un clic n'importe où
  ailleurs sur le dos la retourne à nouveau (pas de bouton « Retourner » : jugé superflu ; au clavier, la
  photo est un bouton « Retourner la carte »). Le dos
  est construit en JS à partir des attributs `data-photo`, `data-photo-alt`, `data-photo-credit`,
  `data-photo-license`, `data-photo-license-url`, `data-photo-source` de chaque `<article class="place">` :
  sans JS, les fiches restent lisibles comme avant. La photo n'est téléchargée qu'au premier survol ou
  au retournement (reflet animé en attendant). Bouton rond « photo » en haut à droite de chaque fiche
  (accès clavier), phrase d'aide au-dessus de la grille, étiquette « Photo » / « Agrandir » sur le
  curseur. La face cachée est `inert`, et le focus passe d'une face à l'autre au clavier.
  Photos : Wikimedia Commons, choisies **en regardant chaque image** (`scripts/photos_commons.py`).
- **Visionneuse plein écran** (même fichier) : fond sombre flouté, photo 1600 px (800 px affichée
  d'abord, depuis le cache), catégorie, nom, description (le texte alternatif), crédit, compteur
  « 2 / 15 », flèches, clavier (←, →, Échap), balayage sur mobile, clic sur le fond pour fermer. Elle ne
  parcourt que les fiches visibles avec le filtre actif. Pendant l'ouverture : reste de la page `inert`,
  Lenis arrêté (il bloque la molette), `overflow: hidden` seulement sur écran tactile ou sans Lenis (sinon
  la barre de défilement disparaît et la page saute). Focus rendu au bouton d'origine à la fermeture.
  C'est une `div` en `z-index: 380` et pas un `<dialog>` : la couche supérieure du `<dialog>` passerait
  au-dessus du curseur personnalisé.
- Idées bonus empilées (cartes qui rétrécissent quand la suivante arrive).

## 7. RSVP (`assets/js/rsvp.js`, `rsvp.html`)

- Envoi en chaîne : Web3Forms (`data-web3forms-key`), puis FormSubmit (`data-endpoint="https://formsubmit.co/ajax/<email>"`), 15 s chacun ; échec des deux → e-mail prérempli + « Copier ma réponse ». `_subject` explicite
  (✅/❌ + noms), `_template: table`, `_captcha: false`, pot de miel `_honey`, champ `email` (réponse
  directe à l'invité). Repli : lien mailto pré-rempli si l'envoi échoue.
- Invités multiples (ajout/suppression, case « Enfant »), présence Oui/Non en `radiogroup`,
  allergies, petit mot avec compteur, barre de progression du formulaire.
- Validation douce : les erreurs s'effacent **à la saisie** et pas à la perte de focus (sinon le
  décalage de mise en page fait rater le clic sur « Envoyer »). `form.noValidate = true` est posé en JS,
  pas dans le HTML, pour que le repli sans JS garde la validation native.
- Libellé du bouton dans `[data-label]` (sinon « Envoi en cours… » reste affiché).
- **Date limite impossible à manquer sur ordinateur** (retour de la mariée) : sur mobile, la carte douce
  suffit ; à partir de 901 px, bandeau fuchsia (titre en grand, compte à rebours en pastille, pastille de
  date qui pulse) + rappel cliquable « Réponse souhaitée avant le … » dans le haut de page, qui mène au
  formulaire.
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
  qui indique le morceau. **Lecture automatique** dès l'arrivée (demande du premier couple). Les
  navigateurs bloquent le son sans geste du visiteur : le bouton pulse et la musique démarre au premier
  clic, toucher ou touche (`pointerdown`, `pointerup`, `touchend`, `keydown`, `click` ; le défilement ne
  compte pas). Un clic sur le bouton pendant cette attente **lance** la musique (rien n'est encore
  audible). Si le visiteur la coupe, le refus est mémorisé dans `localStorage` (`cr-music-off`) et
  respecté aux visites suivantes ; il n'y a alors plus de lecture automatique, seulement la suggestion
  discrète. Pour revenir à « aucune lecture automatique », il suffit de démarrer dans la branche « refus ».
- Fondu d'entrée de 2,2 s jusqu'au volume 0,32, fondu de sortie de 0,7 s. État et position mémorisés dans
  `sessionStorage` (repli si la navigation se fait par rechargement). Si le navigateur bloque la lecture,
  elle reprend au premier geste du visiteur (le bouton pulse).
- **Aucune coupure entre les pages** grâce à la navigation sans rechargement (§ 10) : un seul lecteur
  (`window.__crAudio`) pour toute la visite, réutilisé par chaque page.
- Fichier : MP3 VBR (~100 kb/s), volume normalisé (`loudnorm I=-20`), fondus au début et à la fin,
  métadonnées propres. Pour l'encoder sans ffmpeg système : `pip install imageio-ffmpeg`.
- Sources sûres : Musopen (domaine public), Open Goldberg / Open Well-Tempered Clavier (CC0),
  Internet Archive en filtrant sur `licenseurl` (publicdomain / CC0), en vérifiant l'interprète.
  L'API Wikimedia peut renvoyer 429 depuis un serveur partagé.

## 10. Navigation sans rechargement (`assets/js/nav.js`)

But : la musique ne se coupe plus d'une page à l'autre, et les changements de page sont plus rapides.
Chaque page reste un vrai fichier HTML (adresse, référencement, accès direct, Précédent/Suivant).

- Chargé une seule fois, avant `main.js` (bloc SCRIPTS). Au survol d'un lien interne, la page suivante est
  chargée en arrière-plan ; au clic, `main.js` ferme le rideau et appelle `__crNav.go(href)` (sans
  animations : `nav.js` prend le clic lui-même).
- Remplacement : nettoyage de la page affichée (`__crNav.onLeave`), arrêt de tous les ScrollTrigger et des
  animations restées sur l'ancien contenu, mise à jour du `<head>` (titre, description, canonique, robots,
  og:url, JSON-LD, feuilles de style manquantes comme `leaflet.css`), remplacement du contenu de `<body>`,
  défilement en haut, puis exécution des scripts de page (`assets/js/*.js`) ; les bibliothèques déjà
  chargées ne le sont pas deux fois. `main.js` attend `__crNav.ready` (tous les scripts exécutés) puis
  recalcule après `__crNav.loaded` (images chargées), comme `load` au premier chargement.
- **Chaque script de page déclare ce qu'il pose hors de la page** : `listen(cible, type, fn)` pour window,
  document et `matchMedia`, `onTick(fn)` pour `gsap.ticker`, `onLeave(() => …)` pour les intervalles,
  `mm.revert()`, `lenis.destroy()`, `ST.removeEventListener`, `map.remove()`, `io.disconnect()`. Tout ajout
  d'écouteur global doit passer par là, sinon il s'additionne à chaque page visitée.
- Précédent/Suivant : identifiant par entrée d'historique, position de défilement retrouvée ; un
  Précédent pendant la fermeture du rideau l'emporte. Ancres (`index.html#programme`) comme au chargement.
- Navigation classique de secours (le rideau reste fermé, la page suivante l'ouvre) : page introuvable,
  réponse qui n'est pas une page du site, script ou feuille de style d'une autre version (site mis à jour
  entre-temps), erreur pendant l'exécution. Désactivée sur la page 404 (`<base>`).
- Accessibilité : focus remis au début du document, titre annoncé (`role="status"`), lien d'évitement
  premier au Tab.
- Tests indispensables (voir `pieges.md` § 3) : comparer chaque page atteinte sans rechargement avec la
  même page chargée normalement (nombre de ScrollTrigger et leurs positions, intervalles, écouteurs
  globaux, animations orphelines, un seul lecteur audio, `currentTime` qui continue) ; Précédent/Suivant ;
  ancre ; mobile + menu ; mouvement réduit ; 30 navigations d'affilée (mémoire stable).

