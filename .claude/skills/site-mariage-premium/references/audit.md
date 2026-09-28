# Protocole d'audit

L'utilisateur demande un audit **après chaque étape critique** : ressources, gabarit commun, chaque page,
puis avant chaque mise en ligne. Un audit sert à trouver des bugs, pas à confirmer que tout va bien.
Regarde vraiment les captures et fais tes propres tests d'interaction.

## Préparation

```bash
cd <racine du site>
npx http-server . -p 8765 -s -c-1          # en arrière-plan ; -c-1 : pas de cache pendant les tests
npm i -D playwright axe-core               # si absents (dans tools/ ou un dossier de travail)
```

Dans l'environnement cloud, Chromium est préinstallé (`PLAYWRIGHT_BROWSERS_PATH`) : ne lance pas
`playwright install`. Les scripts du skill chargent Playwright et axe-core en local ou en global.

## 1. Accessibilité : axe-core, 0 violation attendue

```bash
node <skill>/scripts/audit_axe.cjs http://127.0.0.1:8765/ index,hebergements,temoins,environs,rsvp,404,logos
```
Le script vérifie deux tailles (1440 et 390) en mouvement réduit. Les problèmes les plus fréquents sont
les contrastes des petits textes sur fond coloré, les liens identiques sans contexte (ajouter un texte
masqué « de <Nom> (nouvel onglet) ») et les rôles ARIA incomplets.

## 2. Console, 404, débordements, textes restés invisibles

```bash
node <skill>/scripts/audit_console.cjs http://127.0.0.1:8765/ index,hebergements,temoins,environs,rsvp,404,logos 1440x900
node <skill>/scripts/audit_console.cjs http://127.0.0.1:8765/ index,hebergements,temoins,environs,rsvp 390x844
```

## 3. Captures à regarder (desktop, mobile, très grand écran)

```bash
node <skill>/scripts/captures.cjs http://127.0.0.1:8765/ /chemin/absolu/de/travail/captures index,hebergements 390,1440,2560
```
Le dossier de sortie doit être **hors du dépôt**. Ouvre les images avec l'outil de lecture et découpe
les zones utiles en Python (PIL) pour les voir en grand. Points à contrôler :
- visages jamais coupés ni couverts par un texte ;
- aucune feuille, fleur ou lettre de logo coupée ;
- pas de carte seule sur une ligne, pas de trou dans les rubans ou les grilles en 2560 px ;
- textes lisibles sur les photos (voile sombre suffisant) ;
- alignements cohérents (bloc centré = texte centré) ;
- boutons flottants qui ne cachent rien en bas de page mobile.

Pour une animation liée au défilement, capture plusieurs étapes (ex. programme à 0,5 / 0,72 / 0,84 / 1
de sa progression) en pilotant `window.__lenis.scrollTo(...)` puis en attendant ~1,5 s. Pour une
trajectoire (soleil, épingle), relève les positions à 20 étapes et trace la courbe sur une capture.
C'est ainsi qu'on voit une cassure ou une plongée brutale.

## 4. Tests d'interaction ciblés (à écrire avec Playwright selon la page)

- **Filtres** : chaque catégorie puis « Tout », une rafale de clics rapides, et un filtre lancé en bas de
  grille. Vérifier le nombre de cartes visibles, leur opacité (1), leur position (dans la grille) et que
  la grille remonte sous les filtres. Attendre la fin de la cascade (~2 s) avant de mesurer.
- **RSVP** : envoi vide (erreurs + focus), ajout/suppression d'invités, clic sur Envoyer juste après une
  saisie, mode sans JS. Intercepter l'appel FormSubmit avec `page.route()` pour ne **rien** envoyer.
- **Navigation** : liens du menu, ancre `#programme` depuis une autre page et depuis l'accueil servi en
  `/`, menu mobile au clavier (Tab ne sort pas du menu, Échap ferme).
- **Carte Leaflet** : les tuiles se chargent. Dans l'environnement de test, servir les tuiles via
  `page.route()` + `curl`, car Chromium y rejette le certificat du proxy.
- **Musique** : clic → `aria-pressed=true` et lecture ; navigation → reprise ; re-clic → pause. Lancer
  Chromium avec `--autoplay-policy=no-user-gesture-required` pour tester la reprise.
- **Curseur cœur** : `--close` proche de 0 loin du couple et proche de 1 sur le point focal ; les petits
  cœurs apparaissent.

## 5. Sans JavaScript et mouvement réduit

- Contexte Playwright avec `javaScriptEnabled: false` : tout le contenu est visible et lisible, aucun
  bouton inutile (musique masquée).
- `reducedMotion: 'reduce'` : pas de `.motion`, contenu complet, Lenis coupé.

## 6. Performance (au moins une fois)

Lighthouse mobile ou mesure du Total Blocking Time. Repères du premier site : desktop 99, mobile environ 80
après la découpe des titres à la demande.

## 7. Audit indépendant (grosses étapes)

Lance un sous-agent avec pour mission de **trouver** des bugs (reproduits dans Chromium, avec étapes et
correctifs proposés), sans modifier de fichiers. La première fois, il en a trouvé 13 : cartes filtrées
invisibles, ancre qui recharge la page, double décalage d'ancre, focus hors du menu, contrastes, 404 sur
un sous-chemin, textes… Corrige, puis relance la vérification de chaque point.

## 8. Après déploiement

```bash
bash <skill>/scripts/verif_en_ligne.sh https://<compte>.github.io/<Depot>/ index.html assets/css/style.css assets/js/main.js
```
Tous les fichiers doivent répondre « OK ». Sinon, la publication GitHub Pages n'est pas encore passée.
