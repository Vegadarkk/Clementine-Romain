# Design system : identité premium d'un site de mariage

Le kit (`assets/starter/assets/css/style.css`) est organisé en sections commentées
(`/* ---------- Nom ---------- */`). Commence par les variables de `:root`, puis ajuste les composants.

## Palette

Pars des couleurs données par le couple. Garde les noms du fournisseur en commentaire : c'est ce qui
permet de retrouver la bonne teinte quand le couple parle de « Juicy Peach ». Crée ensuite des teintes
dérivées pour tenir un contraste AA.

```css
:root {
  --fuchsia: #C2185B;  /* Radiant Fuchsia : accent principal, boutons, titres en italique */
  --rose: #E91E63;     /* Bold Rose */
  --peony: #F06292;    /* Vibrant Peony : points, fleurs */
  --peach: #FFB085;    /* Juicy Peach : soleil, filets */
  --blossom: #FFD9C7;  /* Soft Peach Blossom : fonds doux, texte clair sur fond sombre */
  --ivory: #FFF3E6;    /* Warm Ivory : fond de page */
  --sage: #A8BFA6;     /* Sage Leaf */
  --moss: #6B7F5E;     /* Moss Green */
  /* dérivées */
  --paper: #FFF9F2; --ink: #2F3829; --ink-soft: #55604C; --moss-deep: #4E5E43;
  --fuchsia-deep: #A3144D; --blossom-soft: #FFEADF; --sage-soft: #E4ECE0; --line: rgba(107,127,94,.26);
  color-scheme: only light;
}
```

- Le texte courant est dans un vert-de-gris très foncé (`--ink`), pas en noir pur. Les neutres tirent vers
  la palette.
- Les petits textes clairs sur fond coloré passent sur un fond assez foncé (`--fuchsia-deep`, `--moss-deep`).
  L'audit axe avait relevé un contraste de 3,3:1 sur le bandeau RSVP.
- **Mode sombre forcé** : Chrome et Dark Reader assombrissent le site (fond brun, textes illisibles).
  Mets `color-scheme: only light` dans `:root`, et dans `<head>`
  `<meta name="color-scheme" content="only light">` + `<meta name="darkreader-lock">`. Un site de mariage
  garde son identité claire ; c'est un choix délibéré.

## Typographie

- Titres : un serif élégant (Cormorant Garamond 500, l'italique en couleur accent pour un mot clé :
  « Nos *témoins* »).
- Texte : un sans-serif géométrique lisible (Jost 400/500), 1,0625 rem, interligne 1,7.
- Script : une calligraphie anglaise (Pinyon Script) pour les prénoms, « Rendez-vous », « Et la fête
  continue… ».
- Polices auto-hébergées en woff2 (`@fontsource/*` → `assets/fonts/`), avec `preload` pour les trois
  graisses critiques.
- Surtitres en capitales espacées (`letter-spacing: .3em`) encadrés de deux filets ; titres en
  `text-wrap: balance` ; texte courant limité à environ 65 caractères par ligne.
- **Insécables** : `&nbsp;` avant « : ; ! ? » et dans les groupes qui ne doivent jamais se séparer
  (« Clémentine&nbsp;&amp;&nbsp;Romain », « 10&nbsp;km », « 3&nbsp;juillet »).

## Motifs et matières

- **Arche** : c'est le fil rouge. On la retrouve dans le cadre photo du héros (`--arch: 999px 999px 18px 18px`),
  la photo qui passe de l'arche au plein écran, le logo et les formes des cartes.
- **Fleurs** (pivoine, rose, feuillage, bouquet, ornement) générées en SVG par `tools/build-flowers.mjs`.
  Laisse assez de marge dans le `viewBox` : une feuille coupée se voit tout de suite.
- **Montagnes** en couches (paysage SVG avec parallaxe) en haut de page, dans le programme et au-dessus
  du pied de page.
- **Grain papier** très léger (bruit SVG en superposition, opacité 0,05).
- **Pétales** qui tombent dans les bandeaux d'appel.

## Mise en page et finition

- Conteneur de 1180 px, gouttière `clamp(1rem, 4vw, 2.5rem)`, sections espacées avec `clamp(4.5rem, 10vw, 8.5rem)`.
- Espacements avec `gap` (flex / grid), pas de marges empilées.
- **Pas de carte seule sur sa ligne** : choisis un nombre de colonnes qui tombe juste, ou une grille flex
  centrée. Exemples : 5 fiches = 2 en vedette + 3 ; 7 fiches = 4 + 3 centrées.
- Un bloc centré a aussi son texte centré : attention aux sélecteurs plus spécifiques (`:not()`) qui
  écrasent `margin-inline: auto`.
- Ombres réservées aux objets (cartes, photos) ; filets fins `--line` pour structurer.
- Boutons sur fond fuchsia : blanc cassé au repos, **vert sauge clair** au survol (texte encre). Le vert
  foncé a été jugé trop lourd.
- Chiffres alignés en `font-variant-numeric: tabular-nums` (compte à rebours, téléphones, compteur).
- Boutons flottants (musique en bas à gauche, « haut de page » en bas à droite) : marge de sécurité
  `env(safe-area-inset-*)`, et le pied de page mobile réserve de la place en bas pour ne pas être caché.

## Responsive

Teste au minimum ces largeurs : 390 px (téléphone), 768 px, 1024 px, 1440 px, **2000–2560 px**. Les
défauts propres aux grands écrans passent inaperçus en 1440 px : ruban trop court, grille décalée,
photo recadrée sur le mauvais endroit, programme horizontal trop large.

## Accessibilité (intégrée au design)

- Lien d'évitement, focus visible (`outline` accent), navigation clavier complète, menu mobile qui
  rend le reste de la page `inert`.
- `prefers-reduced-motion` : animations coupées, contenu entièrement visible, Lenis désactivé.
- Sans JavaScript : tout est lisible (les états cachés dépendent de la classe `.motion`, ajoutée seulement
  si le JS tourne et que le visiteur n'a pas demandé moins d'animations).
- Images décoratives en `alt=""` + `aria-hidden`, photos du couple avec un vrai texte alternatif.
