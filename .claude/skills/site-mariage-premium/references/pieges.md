# Pièges déjà rencontrés : symptôme → cause → correction

Tous ces bugs se sont produits sur le premier site. Le kit contient déjà les corrections : ne les
réintroduis pas en réécrivant du code.

## Sommaire
1. Affichage et navigateur
2. Photos et illustrations
3. Animations et défilement
4. Cartes
5. Formulaire RSVP
6. Contenu et typographie
7. Outillage, réseau, déploiement

## 1. Affichage et navigateur

| Symptôme | Cause | Correction |
|---|---|---|
| Fond brun foncé, textes illisibles chez l'utilisateur | Mode sombre forcé de Chrome / Dark Reader | `color-scheme: only light` + `<meta name="color-scheme" content="only light">` + `<meta name="darkreader-lock">` |
| « Le bug est toujours là » alors qu'il est corrigé | Cache du navigateur (GitHub Pages : `max-age=600`) | `?v=<hash>` sur CSS/JS/icônes via `build-pages.mjs` ; conseiller Ctrl+F5 |
| Ruban défilant vide après quelques secondes sur écran de 2000 px | 2 groupes seulement, décalage de −50 % | dupliquer jusqu'à couvrir l'écran + décaler d'une largeur de groupe (`fillMarquee`) |
| Texte d'intro centré mais aligné à gauche | `.page-hero p:not(.overline)` (plus spécifique) écrase `margin-inline: auto` | même spécificité dans la règle de centrage |
| Surtitres en grand italique sur les sous-pages | `.page-hero p` stylait aussi `.overline` | `p:not(.overline)` |
| « Romain » seul sur la ligne suivante alors qu'il reste de la place | `max-width: 380px` trop court | largeur en `ch`, `text-wrap: pretty`, prénoms liés par des insécables |
| Bouton flottant sur le dernier texte du pied de page (mobile) | pas de réserve en bas | `padding-bottom` du pied de page augmenté sous 760 px |

## 2. Photos et illustrations

| Symptôme | Cause | Correction |
|---|---|---|
| Clémentine coupée par l'arche sur grand écran | arche en % d'un cadre paysage + centrage sur l'image | arche verticale calculée en px, point focal du couple (fractions) comme origine de transformation |
| L'utilisateur voyait encore l'ancien recadrage | cache | voir § 1 |
| Dernière feuille de l'ornement coupée | `viewBox` trop serré | agrandir le `viewBox` (et les `width/height` HTML), vérifier en capture zoomée |
| Logo « pas assez travaillé » | monogramme en texte simple | vraies lettres d'une police script, entrelacement, arche fleurie ; plusieurs pistes proposées |
| `toPathData()` d'opentype.js renvoie des NaN | bug de la bibliothèque sur certains glyphes | sérialiseur de chemin maison (`pathData()`) |
| Tracés de la couronne à l'envers | drapeau `sweep` de l'arc inversé | inverser le drapeau selon le côté |

## 3. Animations et défilement

| Symptôme | Cause | Correction |
|---|---|---|
| Radar « à l'envers » : traînée et réactions des points avant le faisceau | sens du dégradé conique et délais des points | traînée derrière le faisceau, délai négatif calculé depuis l'angle de chaque point |
| Faisceau du radar « en escalier » | bord net d'un `conic-gradient` non anti-aliasé | trait fin en pseudo-élément (1,5 px + légère lueur) tournant avec le balayage |
| Montagnes en bande plate, sommets invisibles sur écran de 2000 px | paysage de 1440 en `slice` + faible hauteur : le haut (les sommets) est rogné | paysage dédié plus large (`landscape(cls, { W: 2400, align: "xMidYMin" })`) : calé en haut, c'est le pied des montagnes qui est rogné quand la hauteur manque, jamais les cimes ; tester aussi des écrans larges mais peu hauts (2000×700) |
| Soleil qui « plonge d'un coup » | trajectoire en deux morceaux (palier puis chute) | une seule courbe : x linéaire, y = 12 + 92·t^1,9 ; relever 20 positions et tracer la courbe pour vérifier |
| Soleil encore visible et ciel violet à la fin du programme | derniers paliers du ciel trop clairs, soleil jamais caché | paliers jusqu'au bleu nuit, soleil sous les montagnes puis opacité 0, lune + étoiles + étoile filante |
| « Rendez-vous » écrit avant l'ouverture de l'arche, puis effacé et réécrit (défilement rapide, petit écran) | déclencheur basé sur la position brute de la page alors que l'arche suit avec le lissage `scrub` ; seuil unique = va-et-vient | tout piloter par la chronologie lissée ; opacité = `--rp-safe` (lié au défilement) × `--rp-show` (JS) : le bloc ne s'allume qu'au lancement de l'écriture (0,97) et s'éteint puis se remet à zéro dès 0,95 → jamais de texte « déjà écrit » ; pause de 0,35 photo ouverte, section de 270vh. Attention : `overwrite: true` tuerait aussi la tween de `tl` sur le même élément → `killTweensOf(el, "--rp-show")` |
| Photo plein écran floue sur grand écran et sur mobile | source de 1446 px, zoom de 125 % pendant l'arche, `sizes="100vw"` alors que `cover` en portrait affiche ~166vh de large | tailles jusqu'à 2560 px (`scripts/agrandir_photo.py` si la source est petite), `sizes="(orientation: portrait) 166vh, 125vw"` ; ne jamais « vectoriser » une photo (rendu dessin, visages dénaturés) |
| Texte « Rendez-vous » trop discret | petit, sans contraste, simple fondu | plus grand, voile sombre, animation en plusieurs temps ; jamais sur les visages |
| Cœur au survol « qui ne fait rien » | libellé statique | cœur SVG qui bat, rythme selon la distance au couple, ondes, petits cœurs |
| Cartes filtrées décalées ou page vide (Environs) | GSAP Flip `absolute: true` interrompu (`killTweensOf`) → cartes restées en absolu | fondu en cascade sans positionnement absolu ; terminer l'animation en cours avant la suivante |
| Cartes filtrées invisibles | l'animation enregistrait l'état caché (opacité 0) posé par l'apparition au défilement | au premier filtre : tuer les déclencheurs d'apparition et tout rendre visible |
| Remontée vers la grille au mauvais endroit | Lenis gardait l'ancienne position alors que la page venait de raccourcir | `lenis.resize()` puis `scrollTo(nombre)` calculé avec `window.scrollY` |
| Ancres qui arrivent trop haut | décalage soustrait deux fois (Lenis applique déjà `scroll-padding-top`) | aucun décalage manuel : seulement le CSS |
| « Programme » recharge l'accueil | `/` et `/index.html` comparés comme deux pages différentes | normaliser `index.html` avant la comparaison |
| Programme décalé après Tab au clavier | le navigateur défile horizontalement un conteneur `overflow: hidden` | `overflow: clip` + recalage sur `focusin` |
| Contenu du héros invisible pour toujours | `decodeURIComponent` a planté sur une ancre mal formée | try/catch + retrait de `.motion` en cas d'erreur au lancement |
| Performance mobile faible (TBT 770 ms) | SplitText sur tous les titres au chargement | découpe à la demande, intro raccourcie |
| Transform de l'épingle écrasé par GSAP | positionnement et animation sur le même groupe SVG | groupe extérieur positionné + groupe intérieur animé |
| Interpolation `clip-path` absurde | valeurs de départ et d'arrivée de structures différentes | `fromTo` avec la même structure et les mêmes unités |
| Icônes vides dans les boutons créés en JS | identifiant sans le préfixe du sprite (`#image` au lieu de `#i-image`) | `#i-${nom}` ; vérifier chaque icône ajoutée dans `tools/build-icons.mjs` (`npm run icons`) |
| Carte retournée qui ne tourne pas (GSAP) | GSAP relisait une rotation posée par une classe CSS (matrice ambiguë) | en mode animé, seul GSAP pilote la rotation (`gsap.set(inner, { rotationY: 0 })` au départ) ; la règle CSS `rotateY(180deg)` est réservée à `html:not(.motion)` |
| Échap sans effet dans la visionneuse après un clic dans le vide | écouteur `keydown` posé sur la visionneuse, le focus était reparti sur `body` | écouteur sur `document`, actif seulement quand la visionneuse est ouverte |
| Cercle rose qui glisse en diagonale sur la carte (vers Paris, puis la Bretagne) | halo de l'épingle mis à l'échelle par GSAP alors que son CSS a déjà `transform-box: fill-box; transform-origin: center` : l'origine est appliquée deux fois | animer le rayon (`attr: { r }`) au lieu de `scale`, et lancer la boucle seulement après l'apparition de la carte |
| Photo qui « saute » au début de son ouverture | tween `fromTo` placé plus loin dans une chronologie à `invalidateOnRefresh` : avant son début, ses valeurs de départ ne sont pas appliquées | poser l'état de départ avec `tl.set(…, 0)` (valeurs en fonctions), puis le `fromTo` à sa place |
| Musique jamais lancée malgré « lecture automatique » | aucun navigateur n'autorise le son sans clic, toucher ou touche | écran « Ouvrir l'invitation » ; tester avec `--autoplay-policy=document-user-activation-required` et une navigation par **clic** sur un lien |
| Web3Forms injoignable depuis le serveur de travail (403 « Just a moment… ») | protection Cloudflare contre les serveurs | normal : la clé se crée et l'envoi réel se teste depuis un vrai navigateur ; dans les tests, intercepter `api.web3forms.com` |
| Le bouton « haut de page » apparaît trop tôt | seuil de 30 % de la page | apparition dans les derniers ~20 % / 1,8 écran |

## 4. Cartes

| Symptôme | Cause | Correction |
|---|---|---|
| Tuiles « API KEY REQUIRED » | CARTO exige désormais une clé | Esri World Topo sans clé, repli OSM après 4 erreurs |
| OSM renvoie « Access blocked » pendant les tests | politique d'OSM contre les clients non navigateur (curl) | normal en test ; dans les tests Playwright, servir les tuiles via `route` + curl |
| Tuiles en `ERR_CERT_AUTHORITY_INVALID` dans Chromium de test | proxy TLS de l'environnement | ne pas contourner ; intercepter avec `page.route()` et récupérer via curl (TLS vérifié) |
| Carte illustrée : polygones inversés | sens d'enroulement (d3 attend le sens horaire) | `rewind()` des géométries |

## 5. Formulaire RSVP

| Symptôme | Cause | Correction |
|---|---|---|
| Clic sur « Envoyer » perdu | l'erreur s'effaçait au `blur` et décalait le bouton | effacer à la saisie |
| « Envoi en cours… » reste affiché | le texte du bouton écrasait l'icône / mauvais sélecteur | libellé dans `[data-label]` |
| Sans JS, envoi d'un formulaire vide | `novalidate` écrit dans le HTML | `form.noValidate = true` en JS |
| L'erreur de présence n'est pas lue par les lecteurs d'écran | `aria-invalid` sur une div | `role="radiogroup"` étiqueté par la légende |
| Nouvelle ligne d'invité à moitié invisible | clonage d'une ligne en cours d'animation | cloner un modèle propre enregistré au démarrage |
| Les réponses de l'invité ne reviennent pas | champ nommé « E-mail » | champ `email` (+ `_replyto`) pour FormSubmit |
| « L'envoi n'a pas abouti (connexion impossible) » pour tout le monde | FormSubmit renvoyait une erreur 500 **sans en-tête CORS** (panne du service, septembre 2026) : le navigateur n'y voit qu'une erreur réseau | ne jamais dépendre d'un seul service : Web3Forms d'abord (`data-web3forms-key`), FormSubmit en relais, puis e-mail prérempli **et** bouton « Copier ma réponse » ; diagnostiquer avec un envoi vers `…@example.com` ou une boîte jetable, jamais vers le couple |
| Aucun e-mail reçu | FormSubmit non activé | le **1er envoi** déclenche un mail « Activate Form » au destinataire (vérifier les indésirables) ; ne pas l'envoyer sans accord |

## 6. Contenu et typographie

- Anglicismes et coquilles dans les textes fournis (« nous vous partageons les contacts ») : corriger
  discrètement quand la phrase est à nous, garder le texte du couple quand il est cité.
- Ambiguïtés de lieu : « derrière la mairie » quand il y a deux mairies → préciser laquelle.
- Uniformiser les marques de pluriel (« présent(s) » partout, ou « présent·e·s » partout).
- Espaces insécables avant la ponctuation haute, y compris dans les chaînes JS (`Merci ${nom} !`).
- Page 404 sans styles sur un sous-chemin GitHub Pages : `<base href="/<Depot>/">` sur cette page
  seulement (le kit le calcule par script d'après l'adresse).

## 7. Outillage, réseau, déploiement

| Symptôme | Cause | Correction |
|---|---|---|
| Captures d'écran commitées par erreur (`shots/`) | script lancé avec le dépôt comme dossier courant | chemins de sortie absolus vers le dossier de travail ; `git status` avant chaque commit |
| Échec de création de PR (« base invalid ») | le dépôt n'a pas de branche `main` | le dire à l'utilisateur ; ne pas créer de branche sans son accord |
| Wikimedia répond 429 | limite de requêtes par IP partagée | une seule requête API groupée (`titles=A\|B\|…`), User-Agent explicite, pauses (`scripts/photos_commons.py`) ; pour l'audio : Internet Archive (filtrer sur `licenseurl`), Musopen |
| Chromium refuse un site en TLS | proxy de l'environnement | `curl` pour lire la page, jamais d'option qui désactive la vérification |
| Pas de ffmpeg | environnement minimal | `pip install imageio-ffmpeg` (binaire statique) |
| Script généré dans un bloc cassé (`$1` remplacé par du HTML, antislashs perdus) | `String.replace` interprète `$1` dans la chaîne de remplacement ; un `\/` dans un gabarit JS devient `/` | injection par fonction `(m, a, b) => …` ; pas d'expression régulière dans le code généré |
| Test Playwright bloqué sur `networkidle` | la musique joue et télécharge en continu | `waitUntil: "load"` ; tester l'autoplay avec `--autoplay-policy=document-user-activation-required` (réel) et `no-user-gesture-required` |
| Musique automatique muette à l'arrivée | règle des navigateurs : pas de son sans geste du visiteur (le défilement ne compte pas) | normal : le bouton pulse, lecture au premier clic/toucher/touche ; ne jamais promettre un son dès l'ouverture |
