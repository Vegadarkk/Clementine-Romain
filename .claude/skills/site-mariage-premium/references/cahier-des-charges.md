# Cahier des charges : ce qu'il faut collecter et où ça va

## Sommaire
1. Informations à extraire du brief
2. Correspondance brief → pages
3. Valeurs par défaut quand une info manque
4. Exemple de brief réel (anonymisé)
5. Liste de contrôle finale « rien n'a été oublié »

## 1. Informations à extraire du brief

Le brief arrive en général par un mail du couple (souvent en capture d'écran), avec des pièces jointes.
Relève chaque élément dans un tableau avant de coder.

| Élément | Exemples / remarques |
|---|---|
| Prénoms, ordre d'affichage | « Clémentine & Romain » (esperluette, garder l'ordre du couple) |
| Date | samedi 3 juillet 2027 → compte à rebours, .ics, logo, pied de page |
| Lieux et adresses | mairie, église, lieu de réception (adresse complète, coordonnées GPS) |
| Horaires | arrivée, mairie, église, vin d'honneur, dîner… (souvent provisoires : garder faciles à modifier) |
| Carte demandée | ex. « carte de la France avec un point sur les villages et les montagnes autour » (invités venant de loin) |
| Palette | planche de couleurs nommées (ex. Radiant Fuchsia, Bold Rose, Vibrant Peony, Juicy Peach, Soft Peach Blossom, Warm Ivory, Sage Leaf, Moss Green) |
| Photos du couple | pour l'accueil ; repérer les visages pour les recadrages |
| Hébergements | texte du couple + infos tentes / douche / vans + liste du lieu de réception (site web à exploiter) |
| Témoins | texte, photos, statut sous chaque photo (« ami de Romain », « sœur de Clémentine »…), e-mail de contact pour les surprises |
| RSVP | adresse de réception, date limite, champs (noms enfants compris, présence Oui/Non, allergies, petit mot), phrase sur l'absence de réponse |
| Environs | document Word d'idées (balades, villages, lacs, activités) |
| Site d'exemple | pour l'ambiance et les effets (ex. apparitions successives des photos des témoins en formes organiques) |
| Sites cités | site du lieu : photos des espaces, plan du domaine, hébergements recommandés, taxis, capacité |

Pour un site cité (lieu de réception) : `curl` la page et relève les images (`wp-content/uploads/...`),
les textes des espaces, le plan, les hébergements (nom, commune, distance/temps, nombre de gîtes ou
chambres, capacité, téléphone, lien), les taxis. Sur WordPress, l'API `wp-json/wp/v2/media?search=<nom>`
donne souvent l'image originale en grand format à la place de la vignette.

## 2. Correspondance brief → pages

- **Accueil** : prénoms, date, compte à rebours, mot de bienvenue, photos, lieux, carte, programme,
  plan du lieu si disponible, infos pratiques, appel à répondre.
- **Hébergements** : texte du couple (citation), radar du rayon annoncé, chiffres clés, tentes / vans /
  douche, fiches (classées par distance, badge « à pied » en couleur), taxis, liens de recherche.
- **Témoins** : texte d'intro centré, une carte par témoin (photo en forme organique, prénom, statut),
  encart « organiser une surprise » avec l'e-mail (bouton copier + mailto).
- **Que faire dans les environs** : une fiche par idée du .docx (catégorie, texte, « voir sur la carte »,
  « itinéraire »), filtres par catégorie, carte Leaflet, idées bonus.
- **RSVP** : formulaire exact demandé, date limite visible, message de confirmation personnalisé.
- **logos.html** : comparatif des pistes de monogramme pour le couple (hors menu, `noindex`).

## 3. Valeurs par défaut quand une info manque

- Horaires provisoires : les afficher tels quels, faciles à modifier (README).
- Pas de bios des témoins : prénom + statut suffisent, prévoir l'emplacement.
- Pas de liste d'hébergements : cartes de recherche (Booking, Airbnb, Google Maps) pré-remplies avec les
  dates du mariage, plus un modèle de fiche en commentaire.
- Pas de musique choisie : pièce de piano douce du domaine public (Bach, Satie, Chopin), bouton désactivé
  par défaut.
- Pas de logo : monogramme des initiales en script, recommandation argumentée.

Questions qui méritent d'être posées (et seulement celles-là) :
- capture du mail illisible → proposer de coller le texte ;
- qui envoie le premier RSVP de test (il déclenche l'activation FormSubmit chez le couple) ;
- passer le dépôt en public (nécessaire pour GitHub Pages gratuit), si l'utilisateur ne l'a pas déjà autorisé.

## 4. Exemple de brief réel (anonymisé)

> Voici un exemple de site que nous avions vu : <site d'exemple>.
> La décoration se fera avec un panel de couleurs (en PJ), ainsi que des photos de nous pour l'accueil.
> - **Date** : 3 juillet 2027
> - **Lieux** : mairie et église à <village 1>, vin d'honneur et dîner au <château>. Si possible une carte
>   de la France avec un point sur les villages et les montagnes autour (beaucoup d'invités viennent de loin).
> - **Horaires** (provisoires) : arrivée 14h00, mairie 14h30, église 15h30, vin d'honneur 17h00, dîner 20h30.
> - **Hébergements** : un onglet avec ce texte : « Nous ne proposons pas d'hébergements… tous situés dans les
>   10 km autour de notre domaine. Un espace herbeux plat peut permettre de planter des tentes… Une douche
>   est disponible… Véhicule aménagé : parking plat derrière la mairie, à 100 m du domaine. »
>   Et ajouter les hébergements proposés sur le site du château (tout en bas de la page, avec les images).
> - **Témoins** : « Ils ont accepté de vivre cette belle aventure à nos côtés… » + e-mail pour organiser une
>   surprise + photos avec le statut de chacun sous la photo.
> - **Réponses** : directement sur le site, envoyées automatiquement à <e-mail>. « Merci de nous répondre
>   avant le 15 mars 2027… » ; noms (enfants compris) ; Oui / Non ; allergie ; petit mot.
> - **Que faire dans les environs** : document Word en PJ.

Demandes arrivées ensuite en cours de route (à intégrer d'office la prochaine fois) : effets des témoins
comme sur le site d'exemple, photo centrée sur le couple avant le déploiement, logo plus travaillé
(Claude Design), exploitation des photos et du plan du château, bouton « haut de page », musique
d'ambiance activable, cœur animé au survol du couple, ciel qui finit en nuit étoilée, texte de la
photo plein écran plus visible et animé de façon premium.

## 5. Liste de contrôle finale « rien n'a été oublié »

- [ ] Chaque puce du brief a une place visible sur le site (relire le mail ligne par ligne).
- [ ] Les textes fournis par le couple sont repris mot pour mot (fautes de frappe corrigées discrètement).
- [ ] Les sites cités ont été exploités, avec crédit.
- [ ] Date, horaires, adresses et date limite sont identiques partout (accueil, .ics, RSVP, pied de page).
- [ ] Le RSVP arrive bien à l'adresse voulue (après activation FormSubmit).
- [ ] Le lien public fonctionne dans une fenêtre privée, sur téléphone.
