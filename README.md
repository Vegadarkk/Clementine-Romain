# Clémentine & Romain · 3 juillet 2027

Site du mariage de Clémentine et Romain : Héry-sur-Alby (mairie & église) et Château de Saint-Offenge (vin d’honneur & dîner).

Site **100 % statique** (HTML, CSS, JavaScript), sans base de données ni serveur : il s’héberge gratuitement sur GitHub Pages.

## Pages

| Page | Contenu |
| --- | --- |
| `index.html` | Accueil : compte à rebours, bienvenue, lieux + itinéraires, carte animée France → Bauges, programme « fil de la journée », ajout à l’agenda |
| `hebergements.html` | Hébergements à moins de 10 km, tentes, douche, véhicules aménagés, liens de recherche |
| `temoins.html` | Les 4 témoins et leur contact pour les surprises |
| `environs.html` | Que faire aux alentours : 15 idées filtrables qui se retournent sur la photo du lieu (visionneuse plein écran), carte interactive, activités, idées selon vos envies |
| `rsvp.html` | Formulaire de réponse envoyé automatiquement par e-mail |
| `404.html` | Page introuvable |

## Mise en ligne

**Adresse officielle : https://clementine-et-romain.pages.dev/** (Cloudflare Pages, gratuit, HTTPS).

- **Publier une mise à jour** : `cd tools && npm run pages`, puis depuis la racine `sh tools/deploy-cloudflare.sh`
  (variables `CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` requises). Seuls les fichiers du site sont
  publiés (`tools/dist.sh`) ; `_headers` ajoute les en-têtes de sécurité et le cache des polices.
- **Ancienne adresse** : GitHub Pages (branche `claude/eloquent-hamilton-t3b9w6`, dossier racine) reste
  active uniquement pour **rediriger automatiquement** les liens déjà partagés vers la nouvelle adresse.
- **Google** : le site est référençable (`INDEXABLE = true` dans `tools/build-pages.mjs`), avec
  `sitemap.xml`, `robots.txt` et des adresses canoniques. `logos.html` et `404.html` ne sont jamais
  référencées. Pour accélérer l'indexation : Google Search Console → ajouter la propriété
  `https://clementine-et-romain.pages.dev/` → envoyer `sitemap.xml`. Pour cacher de nouveau le site :
  `INDEXABLE = false`, `npm run pages`, republier.
- Changer d'adresse : `SITE_URL` (et `OLD_SITES` pour rediriger l'ancienne) dans `tools/build-pages.mjs`.

## Réponses RSVP par e-mail (à faire une seule fois)

Les réponses sont envoyées via [FormSubmit](https://formsubmit.co) (gratuit, sans compte) à **clementine.leytier@hotmail.fr**.

1. Une fois le site en ligne, envoyer **une réponse de test** depuis la page RSVP.
2. Clémentine reçoit un e-mail « Activate Form » de FormSubmit : cliquer sur **Activate**. (Vérifier les courriers indésirables.)
3. C’est tout : chaque réponse arrive ensuite automatiquement, sous forme de tableau (présence, invités, adultes/enfants, allergies, petit mot, e-mail de l’invité pour répondre directement).

Optionnel : FormSubmit fournit après activation une adresse « alias » aléatoire. La remplacer dans `rsvp.html` (attributs `action` et `data-endpoint` du formulaire) masque l’adresse e-mail dans le code source.

Si l’envoi échoue (connexion, service indisponible), l’invité se voit proposer un lien pour envoyer sa réponse par e-mail, pré-rempli.

## Modifier les contenus

Les textes se modifient directement dans les fichiers `.html` :

- **Horaires** : `index.html` (cartes des lieux, section `programme`) et `assets/js/main.js` (fichier agenda `.ics`, fonction « Agenda .ics »).
- **Témoins** : `temoins.html` (photos dans `assets/img/temoins/`).
- **Hébergements** : `hebergements.html`, listes `<ul class="stays">` (adresses recommandées par le château) — un modèle de fiche est fourni en commentaire juste au-dessus.
- **Plan du domaine** : `index.html`, section `domaine` (position des numéros sur le plan : `style="left:…%;top:…%"`).
- **Choix du logo** : `logos.html` présente les 4 pistes de monogramme (à partager avec Clémentine) ; les fichiers sont régénérés par `npm run logos`.
- **Idées de sorties** : `environs.html` (chaque idée a ses coordonnées GPS `data-lat` / `data-lng` pour la carte).

En-tête, menu et pied de page sont communs à toutes les pages : les modifier dans `tools/build-pages.mjs`, puis :

```bash
cd tools
npm install
npm run pages      # réinjecte en-tête / pied de page dans chaque page
npm run build      # régénère tout : icônes, fleurs, cartes, pages
```

Photos : `python3 tools/build-images.py <dossier_des_originaux>` (nécessite `pip install pillow`) crée les versions WebP optimisées.

## Tester en local

```bash
npx http-server . -p 8080
```

puis ouvrir <http://localhost:8080>.

## Détails techniques

- Animations : [GSAP](https://gsap.com) (ScrollTrigger, SplitText) et défilement fluide [Lenis](https://lenis.darkroom.engineering), fichiers inclus dans `assets/vendor/`.
- Accessibilité : navigation clavier, lien d’évitement, contrastes AA, respect du réglage « réduire les animations » du téléphone/ordinateur, contenu entièrement lisible sans JavaScript.
- Carte des environs : [Leaflet](https://leafletjs.com), fond topographique © Esri (repli automatique sur © OpenStreetMap).
- Musique d’ambiance (bouton en bas à gauche, jamais en lecture automatique) : J.-S. Bach, *Aria* des Variations Goldberg, par Shelley Katz — enregistrement [Musopen](https://musopen.org) versé au domaine public (`assets/audio/`).
- Plan, photos des espaces et des hébergements, contacts : © [Château de Saint-Offenge](https://chateaudesaintoffenge.fr/mariage-chateau-saint-offenge/), crédités sur les pages concernées.
- Photos des lieux (page Environs, redimensionnées) : [Wikimedia Commons](https://commons.wikimedia.org), licences Creative Commons, auteur et licence affichés au dos de chaque carte — [Massif des Bauges](https://commons.wikimedia.org/wiki/File:Bauges_Roc_des_Boeufs_Cret_du_Char.jpg) (Myrabella, CC BY-SA 3.0) ; [Semnoz](https://commons.wikimedia.org/wiki/File:Cr%C3%AAt_de_Chatillon_@_Semnoz_(35510686495).jpg) (Guilhem Vellut, CC BY 2.0) ; [Col de Leschaux](https://commons.wikimedia.org/wiki/File:Col_de_Leschaux_(900m).JPG) (Florian Pépellin, CC BY-SA 3.0) ; [Belvédère de la Chambotte](https://commons.wikimedia.org/wiki/File:Restaurant_@_Belv%C3%A9d%C3%A8re_de_la_Chambotte_(51043815161).jpg) (Guilhem Vellut, CC BY 2.0) ; [Pont de l’Abîme](https://commons.wikimedia.org/wiki/File:Pont_de_l%27Ab%C3%AEme_@_Les_Gorges_du_Ch%C3%A9ran_@_Bauges_(37366181572).jpg) (Guilhem Vellut, CC BY 2.0) ; [Cascade du Pissieu](https://commons.wikimedia.org/wiki/File:Le_Ch%C3%A2telard_Cascade_de_Pissieu_5.jpg) (Zairon, CC BY-SA 4.0) ; [Héry-sur-Alby](https://commons.wikimedia.org/wiki/File:Vue_g%C3%A9n%C3%A9rale_d%27H%C3%A9ry-sur-Alby.jpg) (TheHuntsmanMovie, CC BY-SA 4.0) ; [Saint-Offenge](https://commons.wikimedia.org/wiki/File:PaqStOff01.JPG) (Dominique73, CC BY-SA 3.0) ; [Alby-sur-Chéran](https://commons.wikimedia.org/wiki/File:Alby-sur-Cheran-1.jpg) (Ric, CC BY-SA 3.0) ; [Annecy](https://commons.wikimedia.org/wiki/File:Palais_de_l%27Isle_in_Annecy_11.jpg) (Tournasol7, CC BY-SA 4.0) ; [Aix-les-Bains](https://commons.wikimedia.org/wiki/File:Grand_Port_d%27Aix-les-Bains_(juin_2018).JPG) (Florian Pépellin, CC BY-SA 4.0) ; [Abbaye d’Hautecombe](https://commons.wikimedia.org/wiki/File:Abbaye_d%27Hautecombe_c%C3%B4t%C3%A9_lac_(2018).JPG) (Florian Pépellin, CC BY-SA 4.0) ; [Chanaz](https://commons.wikimedia.org/wiki/File:Canal_de_Savi%C3%A8res_et_pont_v%C3%A9nitien_de_Chanaz_(%C3%A9t%C3%A9_2018).JPG) (Florian Pépellin, CC BY-SA 4.0) ; [Lac d’Annecy](https://commons.wikimedia.org/wiki/File:Col_de_la_Forclaz_Blick_auf_den_Lac_d%27Annecy_11.jpg) (Zairon, CC BY-SA 4.0) ; [Lac du Bourget](https://commons.wikimedia.org/wiki/File:Mont_du_Chat_@_Lac_du_Bourget_(50976517826).jpg) (Guilhem Vellut, CC BY 2.0).
- Cartes illustrées générées depuis des données géographiques réelles (`tools/build-map.mjs`, sources dans `tools/data/README.md`).
- Polices auto-hébergées (Cormorant Garamond, Jost, Pinyon Script — licence SIL OFL), icônes [Lucide](https://lucide.dev) (ISC).
