# Déploiement, formulaire et livraison

## GitHub Pages (gratuit)

1. Le dépôt doit être **public** pour GitHub Pages gratuit. Demande l'autorisation avant de changer la
   visibilité ; l'utilisateur peut aussi le faire lui-même (Settings → General → Change visibility).
2. Settings → Pages → Source « Deploy from a branch » → la branche de travail → dossier `/ (root)`.
3. Ajoute un fichier `.nojekyll` à la racine (sinon Jekyll ignore des fichiers).
4. Renseigne en tête de `tools/build-pages.mjs` : `SITE_URL` (balises Open Graph pour un joli aperçu sur
   WhatsApp et SMS, `canonical`, sitemap), avec une image `og-image.jpg` de 1200×630 ; `INDEXABLE`
   (`false` par défaut : `noindex` + `robots.txt` fermé, le site n'est accessible que par le lien ;
   `true` : pages indexables, `robots.txt` ouvert, `sitemap.xml` et données structurées `WebSite`) ;
   `OLD_SITES` (anciennes adresses redirigées vers `SITE_URL` après un déménagement). `404.html` et
   `logos.html` ne sont jamais indexées.
5. Page 404 : le petit script en tête de `404.html` (kit) écrit `<base href="/<Depot>/">` d'après
   l'adresse, pour que styles et liens marchent depuis n'importe quel chemin introuvable.
6. Après chaque `git push`, attends puis vérifie avec `scripts/verif_en_ligne.sh`. Le cache CDN de
   GitHub Pages dure 10 min : les paramètres `?v=hash` de `build-pages.mjs` évitent les vieilles versions
   chez les invités. En cas de doute chez l'utilisateur, conseille Ctrl+F5.

Si la branche par défaut n'existe pas (pas de `main`), la création de pull request échoue. Dis-le à
l'utilisateur et propose de créer `main` avec son accord, ou de publier directement depuis la branche
de travail.

## Adresse sans le pseudo GitHub : Cloudflare Pages (gratuit)

L'adresse GitHub Pages contient le pseudo du propriétaire (`pseudo.github.io/Depot/`). Si l'utilisateur
ne veut pas le montrer, Cloudflare Pages donne gratuitement `nom-du-projet.pages.dev` (HTTPS, bande
passante illimitée, déploiement automatique à chaque `git push`). L'utilisateur doit créer le compte
lui-même :
1. dash.cloudflare.com → inscription gratuite → Workers & Pages → Create → onglet Pages → Connect to Git
   → autoriser GitHub (le dépôt peut même devenir privé) → choisir le dépôt.
2. Project name = le futur nom (`clementine-et-romain` → `clementine-et-romain.pages.dev`) ; branche de
   production = la branche du site ; Framework preset « None » ; Build command `sh tools/dist.sh` ;
   Build output directory `dist`. `tools/dist.sh` ne publie que le site (ni outils, ni skill, ni README),
   `_headers` ajoute des en-têtes de sécurité et le cache long des polices et bibliothèques.
3. Quand l'adresse répond : `SITE_URL` = la nouvelle adresse, `INDEXABLE = true` si le couple veut être
   trouvé sur Google, `OLD_SITES = ["https://pseudo.github.io/Depot/"]` pour rediriger les anciens liens
   déjà partagés, `npm run pages`, push, vérification en ligne sur les deux adresses.
4. Google : Search Console → propriété « Préfixe de l'URL » → validation par balise HTML (l'utilisateur
   donne le code, ajoute-le dans `HEAD` de `build-pages.mjs`) → envoyer `sitemap.xml`. Compter quelques
   jours à quelques semaines ; la recherche « Clémentine et Romain mariage » doit alors trouver le site.

**Si la liaison Git échoue** (erreur 8000011 : l'application GitHub de Cloudflare n'est pas installée)
et qu'un jeton `CLOUDFLARE_API_TOKEN` (droit « Cloudflare Pages : Edit ») est disponible, fais-le
toi-même : `GET /accounts` pour l'identifiant du compte, `POST /accounts/<id>/pages/projects` avec
`{"name": "…", "production_branch": "main"}` (projet **séparé** des projets existants de l'utilisateur),
puis `sh tools/deploy-cloudflare.sh` (wrangler, envoi direct ; `CLOUDFLARE_ACCOUNT_ID` requis). Chaque
mise à jour du site = `npm run pages` + ce script + `git push`. Publie d'abord sur Cloudflare et
vérifie, **puis** pousse sur GitHub : la redirection de l'ancienne adresse ne doit partir que vers un
site déjà en ligne. Vérifie en ligne avec curl (Chromium de l'environnement refuse le TLS du proxy).

**Adresse sans suffixe** (`clementine-et-romain.fr` au lieu de `….pages.dev`) : l'hébergement reste
gratuit, mais le nom de domaine s'achète (environ 1 à 12 € par an selon l'extension et les promotions).
Aucun nom gratuit sans suffixe n'existe aujourd'hui (Freenom est fermé ; `eu.org` est gratuit mais
garde le suffixe et demande des jours d'attente). Vérifie la disponibilité par RDAP
(`https://rdap.nic.fr/domain/<nom>.fr`, `https://rdap.verisign.com/com/v1/domain/<nom>.com` : 404 = libre).
L'achat revient à l'utilisateur (paiement) ; ensuite, rattache le domaine au projet Pages
(`POST /accounts/<id>/pages/projects/<projet>/domains`, DNS chez Cloudflare de préférence), puis mets
`SITE_URL` sur le domaine (canonical, sitemap, aperçus). L'adresse `pages.dev` reste servie : la balise
canonical suffit pour que Google ne retienne que le domaine.

Cloudflare sert `/environs` au lieu de `/environs.html` (redirection 308) : les `canonical` et le sitemap
utilisent déjà la forme sans `.html`, et `main.js` considère les deux formes comme la même page.

## Formulaire RSVP (FormSubmit)

- Point d'envoi : `https://formsubmit.co/ajax/<email>` (dans `data-endpoint`), repli classique dans
  `action`, adresse aussi dans `data-mailto` pour le lien de secours.
- **Activation** : le tout premier envoi déclenche un mail « Activate Form » vers l'adresse de réception.
  Le couple doit cliquer sur « Activate » (vérifier les indésirables). **Ne fais jamais ce premier envoi
  sans accord** : demande qui s'en charge (toi, l'utilisateur ou le couple).
- Après activation, FormSubmit fournit un alias aléatoire : le remplacer dans `rsvp.html` masque
  l'adresse du couple dans le code public.
- Champs envoyés : `_subject`, `_template: table`, `_captcha: false`, `_honey`, `email` / `_replyto`,
  noms, présence, allergies, message. Les tests se font en interceptant la requête (`page.route`),
  jamais avec un vrai envoi.

## README du site (à livrer)

Le kit contient un README modèle (`assets/starter/README.md`) à adapter. Il couvre :
- le lien public et la procédure GitHub Pages ;
- l'activation FormSubmit ;
- où modifier chaque contenu (horaires, témoins, hébergements, idées, plan du domaine, logo) ;
- les commandes (`npm run pages`, `npm run build`, `npm run logos`, conversion des photos) ;
- les détails techniques et **crédits** : bibliothèques, polices (OFL), icônes (Lucide, ISC), fonds de
  carte (Esri / OSM), musique (interprète + licence), photos du lieu (© lieu).

## Commits

- Commits en français, descriptifs, groupés par lot de retours (« Carte des idées réparée, bouton haut de
  page, radar net… »), avec les lignes de signature demandées par l'environnement.
- Aucun identifiant de modèle dans les commits, la PR ou le code.
- `git status` avant chaque `git add -A`. Les captures d'écran et fichiers de test restent hors du dépôt.
- Pousse sur la branche indiquée (`git push -u origin <branche>`), en réessayant avec un délai
  progressif seulement en cas d'erreur réseau.

## Message de livraison

Court, en français :
```
C'est en ligne : https://<compte>.github.io/<Depot>/  (Ctrl+F5 si tu vois l'ancienne version)
- <changement> …
Vérifié : axe 0 violation (7 pages × 2 tailles), aucune erreur console, <tests spécifiques>.
En attente : <ex. qui envoie le 1er RSVP pour activer FormSubmit ?>
```
Pour la page `logos.html`, donne son lien à part (« à montrer à <prénom> ») avec ta recommandation en
une phrase.
