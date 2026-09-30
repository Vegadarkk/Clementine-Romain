---
name: site-mariage-premium
description: Conçoit, anime, audite et met en ligne un site web de mariage premium (multi-pages statique, animations au scroll, programme de la journée, lieux et carte, hébergements, témoins, idées de sorties, formulaire RSVP envoyé par e-mail, musique d'ambiance, logo monogramme) hébergé gratuitement (GitHub Pages, ou Cloudflare Pages pour une adresse sans le pseudo GitHub). À utiliser dès qu'on demande un site de mariage, un site pour les invités, un « save the date » ou un faire-part en ligne, une page RSVP ou de réponse à l'invitation, ou qu'on transmet le mail ou les infos d'un couple (date, mairie, église, château, horaires, témoins, hébergements) pour en faire un site — même si le mot « site » n'apparaît pas, et aussi pour modifier ou améliorer un site de mariage existant. Wedding website, premium animated wedding site, RSVP page.
---

# Site de mariage premium

Ce skill reprend tout ce qui a été appris en créant le site de Clémentine & Romain
(https://vegadarkk.github.io/Clementine-Romain/). C'est un site statique multi-pages en HTML/CSS/JS
sans framework, avec GSAP (ScrollTrigger, SplitText) et Lenis pour le mouvement, Leaflet pour la carte
et FormSubmit pour les réponses. Il est hébergé gratuitement sur GitHub Pages, ou sur Cloudflare Pages (`nom.pages.dev`) si l'adresse ne doit pas montrer le pseudo GitHub.

Un **kit de démarrage complet** et fonctionnel est fourni dans `assets/starter/` : pages, styles,
scripts, générateurs (logo, fleurs, cartes, icônes, gabarit commun), polices et bibliothèques.
Pars de ce kit plutôt que de zéro : il contient des dizaines de corrections de bugs déjà faites
(voir `references/pieges.md`). Mais **chaque couple mérite son identité** : palette, typographies,
motifs et textes se refont à chaque fois. Seules les mécaniques se réutilisent.

## Ce que l'utilisateur attend (le niveau d'exigence)

Ces attentes viennent directement de ses demandes. Elles valent pour tout nouveau site :

- **Premium et novateur, pas un site classique.** Des animations au scroll partout, des effets visuels
  soignés, un finishing/polishing « le plus poussé possible ». Un effet qui existe mais passe
  inaperçu compte comme un échec (« trop discret », « un cercle qui ne fait rien du tout »).
- **UI/UX friendly** : lisible, logique, rapide, agréable sur téléphone comme sur un écran de 2560 px.
- **Tout ce que le couple demande dans son message**, point par point, y compris le contenu des sites
  qu'il cite (par exemple les hébergements et photos du site du lieu de réception). Relis le brief à la
  fin pour vérifier que rien ne manque : sur le premier projet, les hébergements du château
  étaient demandés dans le mail et ont été oubliés.
- **Fonctionnel à 100 % et accessible à toute personne qui a le lien** (dépôt public + GitHub Pages).
- **Méthode** : planifier les tâches avant d'écrire la moindre ligne de code (TaskCreate), lancer un audit
  après chaque étape critique, utiliser tous les outils, skills et agents utiles (Claude Design pour le logo,
  sous-agent d'audit indépendant, recherche web).
- **Communication** : en français, courte et concrète. Donner le lien, dire ce qui a changé et ce qui
  reste en attente. Pas de longs rapports sauf demande, pas d'avertissements du type « je ne suis pas… ».
  Pendant les longues tâches, donner un point d'étape en une phrase de temps en temps.

L'utilisateur envoie souvent des retours en rafale, avec captures d'écran, pendant que tu travailles.
Note chaque retour dans la liste de tâches, dis en une ligne que c'est pris en compte, puis traite-les
tous. Une capture montre souvent un bug d'affichage réel (cache, grand écran, mode sombre forcé…) :
reproduis-le à la même taille d'écran avant de corriger.

## Déroulé

### 0. Cadrage (avant tout code)
1. Lis toutes les sources : le mail (souvent une capture ; propose de coller le texte si elle est illisible),
   les pièces jointes (zip de photos, palette de couleurs, .docx d'idées de sorties), le site d'exemple
   et les sites cités (lieu de réception…). Pour lire un site, `curl` suffit souvent. Ne contourne
   **jamais** une erreur de certificat TLS : si un site refuse, passe par la recherche web ou demande
   une capture.
2. Remplis le cahier des charges avec `references/cahier-des-charges.md` : infos du couple, pages,
   contenus, contraintes. Ne pose de question que si c'est vraiment bloquant. Sinon, prends une valeur
   par défaut sensée et dis-le.
3. Crée la liste de tâches (une par page ou fonctionnalité majeure, plus les audits et le déploiement).

### 1. Préparer les ressources
- Photos converties en WebP en plusieurs tailles (`scripts/images_webp.py`), recadrées sur les visages.
- Photo affichée en plein écran trop petite : demande l'original. N'agrandis par IA (`scripts/agrandir_photo.py`)
  qu'avec l'accord des mariés, visages avant / après à l'appui : un visage légèrement retouché les gêne, et le
  premier couple est revenu à sa photo originale (si accord : IA à 35 % seulement).
- Photos des lieux (page Environs) : Wikimedia Commons, licences libres, avec `scripts/photos_commons.py`.
  Regarde chaque image avant de la retenir : les homonymes de lieux sont fréquents.
  Le couple ne doit **jamais** être coupé, que ce soit dans une arche, un plein écran ou sur un écran large.
- Polices auto-hébergées (woff2, licence OFL), icônes Lucide en sprite SVG (`tools/build-icons.mjs`).
- Illustrations florales, cartes et monogramme générés par script (`tools/build-*.mjs`). Laisse une marge
  dans le `viewBox` : une feuille coupée « gâche tout ».
- Carte de France et zoom régional à partir de données géographiques réelles (`tools/build-map.mjs`,
  sources dans `tools/data/README.md`).

### 2. Design system
Lis `references/design-system.md`. La palette vient des couleurs du couple (souvent une planche
« panel de couleurs »). Associe trois familles de polices : un serif d'affichage, un sans-serif lisible
et un script pour les touches manuscrites. Choisis un motif récurrent tiré de leur univers (arche,
fleurs, montagnes…). Bloque le mode sombre forcé des navigateurs (`color-scheme: only light` et
`darkreader-lock`).

### 3. Gabarit commun
L'en-tête, le menu mobile, le pied de page, les métadonnées et les scripts sont injectés dans chaque page par
`tools/build-pages.mjs`, entre des marqueurs `<!-- HEADER:START -->…<!-- HEADER:END -->`. Le même script
ajoute un paramètre `?v=hash` aux CSS/JS/icônes, pour que les invités ne voient jamais une ancienne
version en cache. Relance `npm run pages` après toute modification de CSS ou de JS.

### 4. Les pages
Détail et fichiers dans `references/fonctionnalites.md`. Le socle habituel :

| Page | Contenu | Effets signature |
|---|---|---|
| Accueil | intro monogramme, héros photo en arche, compte à rebours, ruban défilant, mot du couple, photo arche → plein écran, deux lieux, carte France → région, programme horizontal, plan interactif du domaine, infos pratiques, appel à répondre | ciel du jour à la nuit étoilée, cœur vivant au survol du couple, texte « Rendez-vous » écrit à l'encre |
| Hébergements | texte du couple, radar « 10 km », chiffres clés, tentes/vans/douche, fiches d'hébergement classées par distance, taxis, liens Booking/Airbnb/Maps | radar dont la traînée suit le faisceau, fiches à badge de distance |
| Témoins | texte, photos, rôle de chacun, contact surprise | photos en formes organiques qui apparaissent l'une après l'autre et « respirent » |
| Environs | idées du .docx par catégorie, filtres, carte Leaflet, idées bonus | filtres en fondu en cascade, carte synchronisée |
| RSVP | date limite, noms (enfants compris), présence Oui/Non, allergies, petit mot, envoi automatique par e-mail | confettis, validation douce, réponse mémorisée |
| 404 + `logos.html` | page d'erreur ; comparatif des pistes de logo à montrer au couple | — |
| `choix-ouverture.html` (privée) | choix de l'écran d'accueil animé : aperçus jouables (ordinateur + téléphone, « Rejouer ») et lien vers chaque version en ligne (adresses d'aperçu Cloudflare `--branch <nom>`) | prototypes autonomes dans `assets/choix-ouverture/` |
| `choix-faire-part.html` + `faire-part.html` (privées) | choix du faire-part par e-mail (comme les logos), puis envoi par copier-coller dans Hotmail/Gmail, liens vers l'accueil | e-mail en tableaux, visuels @2x rendus depuis le site |

Sur toutes les pages : rideau de transition et navigation sans rechargement (`nav.js` : la musique
continue sans coupure), barre de progression, bouton « haut de page » (en fin de page), bouton de musique
d'ambiance, curseur personnalisé sur ordinateur.

### 5. Logo / monogramme
Propose 3 ou 4 pistes (arche fleurie, couronne, sceau de cire, éditorial) dessinées à partir des vraies
lettres d'une police script (`tools/build-logo.mjs`, lettres entrelacées par masques). Présente-les dans
un canevas Claude Design (outil Artifact, type Design) **et** dans une page `logos.html` à envoyer au
couple, avec fond clair, fond sombre, en-tête et petits formats. Recommande celle qui colle le mieux au
thème, intègre-la tout de suite et laisse le couple trancher.

### 6. Audits (après chaque étape critique, puis à la fin)
Protocole complet et scripts dans `references/audit.md` :
- axe-core sans aucune violation sur toutes les pages, en 1440 px et en 390 px ;
- aucune erreur console ni 404 ;
- site entièrement lisible sans JavaScript et avec « réduire les animations » ;
- captures desktop, mobile et **ultra-large (2000–2560 px)**, et tu les regardes réellement ;
- tests d'interaction ciblés : filtres (y compris en clics rapides), formulaire, menu, ancres, lecteur
  audio, plan du domaine ;
- un sous-agent d'audit indépendant pour les grosses étapes (il a trouvé 13 bugs la première fois).

### 7. Déploiement
Voir `references/deploiement.md` : dépôt public, GitHub Pages sur la branche de travail (racine),
`.nojekyll`, `SITE_URL` dans `build-pages.mjs`, vérification que les fichiers en ligne sont identiques
aux fichiers locaux, activation de FormSubmit (le **premier envoi** déclenche un mail d'activation au
couple : ne l'envoie jamais sans l'accord de l'utilisateur).

### 8. Livraison
Message court, en français :

```
C'est en ligne : <lien>
- <changement 1, une ligne>
- <changement 2>
Vérifié : <audits passés, en une ligne>.
En attente de ta part : <décision / info manquante>.
```

## Contraintes à respecter (et pourquoi)

- **Musique : jamais de son sans geste du visiteur** (les navigateurs l'interdisent de toute façon) : écran
  « Ouvrir l'invitation » dont le clic lance la musique, « Entrer sans musique » mémorisé, fondu du volume,
  aucune coupure d'une page à l'autre (`nav.js`, voir `references/fonctionnalites.md` § 10). Morceau
  fourni par le couple, ou enregistrement du domaine public / CC0 (Musopen, Open Goldberg…), crédité dans
  le README.
- **Droits** : les photos et plans d'un lieu de réception s'utilisent avec un crédit visible
  « © <Lieu> » et un lien. Garde les avis, noms et images d'autres mariages hors du site.
- **Données personnelles** : les adresses e-mail du couple et des témoins apparaissent dans le code d'un
  site public. FormSubmit propose un alias aléatoire pour masquer celle du couple : mentionne-le.
- **Aucun contenu masqué pour de bon** : tout élément animé part d'un état visible sans JS
  (classe `.motion` ajoutée par un script en tête, filet de sécurité de 5 s, bloc try/catch au lancement).
- **Responsive réel** : 390 px, 768 px, 1440 px et 2560 px. Un ruban, une grille ou un fond qui « s'arrête »
  sur grand écran est un bug.
- **Soin typographique** : espaces insécables avant « : ! ? » et dans « Clémentine & Romain », titres en
  `text-wrap: balance`, jamais une carte seule sur sa ligne, jamais un bloc centré dont le texte est
  aligné à gauche.
- **Git** : travailler sur la branche indiquée, messages de commit en français et descriptifs, avec les
  lignes de signature demandées par l'environnement. Aucun identifiant de modèle dans les commits.
  Ne jamais écrire de captures d'écran dans le dépôt (utilise un dossier de travail absolu).
- **Réseau** : ne désactive jamais la vérification TLS et ne contourne pas le proxy. Si une API limite les
  requêtes (Wikimedia 429) ou exige une clé (tuiles CARTO), change de source.

## Kit de démarrage

```bash
cp -r <skill>/assets/starter/. <dépôt>/
cd <dépôt>/tools && npm install
```

Suis ensuite `assets/starter/PERSONNALISER.md`, qui liste chaque endroit propre au couple : noms, date,
lieux, coordonnées GPS, e-mails, programme, fichier .ics, date limite de réponse, monogramme, données
cartographiques. Puis lance `npm run build` (icônes, fleurs, logo, cartes, pages). Les pages HTML du kit
sont celles du projet d'origine : garde leur structure et leurs attributs `data-*`, réécris tous les textes.

## Fichiers de référence

- `references/cahier-des-charges.md` : infos à collecter, correspondance entre le brief et les pages,
  valeurs par défaut, exemple de brief.
- `references/design-system.md` : variables CSS, typographie, motifs, mise en page, règles de finition.
- `references/fonctionnalites.md` : catalogue des effets premium (où ils sont dans le kit, comment les
  adapter, leurs pièges).
- `references/pieges.md` : bugs déjà rencontrés, leur cause et leur correction. À lire avant de modifier
  une animation, la carte, les filtres ou le formulaire.
- `references/audit.md` : protocole d'audit et utilisation des scripts.
- `references/deploiement.md` : GitHub Pages, Cloudflare Pages, référencement Google, cache, FormSubmit, vérification en ligne, README.
- `scripts/` : `audit_axe.cjs`, `audit_console.cjs`, `captures.cjs`, `verif_en_ligne.sh`, `images_webp.py`,
  `photos_commons.py` (photos libres des lieux, avec crédits), `agrandir_photo.py` (photo trop petite).
