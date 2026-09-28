# Clémentine & Romain · 3 juillet 2027

Site du mariage de Clémentine et Romain : Héry-sur-Alby (mairie & église) et Château de Saint-Offenge (vin d’honneur & dîner).

Site **100 % statique** (HTML, CSS, JavaScript), sans base de données ni serveur : il s’héberge gratuitement sur GitHub Pages.

## Pages

| Page | Contenu |
| --- | --- |
| `index.html` | Accueil : compte à rebours, bienvenue, lieux + itinéraires, carte animée France → Bauges, programme « fil de la journée », ajout à l’agenda |
| `hebergements.html` | Hébergements à moins de 10 km, tentes, douche, véhicules aménagés, liens de recherche |
| `temoins.html` | Les 4 témoins et leur contact pour les surprises |
| `environs.html` | Que faire aux alentours : 15 idées filtrables, carte interactive, activités, idées selon vos envies |
| `rsvp.html` | Formulaire de réponse envoyé automatiquement par e-mail |
| `404.html` | Page introuvable |

## Mise en ligne (GitHub Pages)

1. **Rendre le dépôt public** : Settings → General → tout en bas « Danger Zone » → **Change visibility** → Public.
2. **Activer Pages** : Settings → **Pages** → Build and deployment → Source : **Deploy from a branch** → branche `claude/eloquent-hamilton-t3b9w6` (ou `main` si la branche a été renommée/fusionnée), dossier **`/ (root)`** → Save.
3. Après 1 à 2 minutes, le site est en ligne à l’adresse **https://vegadarkk.github.io/Clementine-Romain/**.

Le site est marqué `noindex` et `robots.txt` bloque les moteurs de recherche : il n’apparaît pas sur Google, seules les personnes ayant le lien y accèdent.

Si l’adresse finale change (autre compte, nom de domaine), mettre à jour `SITE_URL` dans `tools/build-pages.mjs` puis lancer `npm run pages` (sert à l’aperçu du lien partagé sur WhatsApp/SMS).

## Réponses RSVP par e-mail (à faire une seule fois)

Les réponses sont envoyées via [FormSubmit](https://formsubmit.co) (gratuit, sans compte) à **mariage@example.com**.

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
- Cartes illustrées générées depuis des données géographiques réelles (`tools/build-map.mjs`, sources dans `tools/data/README.md`).
- Polices auto-hébergées (Cormorant Garamond, Jost, Pinyon Script — licence SIL OFL), icônes [Lucide](https://lucide.dev) (ISC).
