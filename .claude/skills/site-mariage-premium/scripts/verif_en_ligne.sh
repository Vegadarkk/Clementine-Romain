#!/usr/bin/env bash
# Attend que GitHub Pages serve la nouvelle version, puis compare chaque fichier local à sa version en ligne.
# Usage : bash verif_en_ligne.sh <url_publique_du_site/> <fichier1> [fichier2 ...]   (lancé depuis la racine du site)
# Ex.    : bash verif_en_ligne.sh https://moncompte.github.io/Mon-Mariage/ index.html assets/css/style.css assets/js/main.js
set -u
BASE="$1"; shift
FIRST="$1"
want=$(sha1sum "$FIRST" | cut -c1-12)
for i in $(seq 1 40); do
  got=$(curl -sS "${BASE}${FIRST}?nocache=$RANDOM$i" | sha1sum | cut -c1-12)
  [ "$got" = "$want" ] && { echo "En ligne après $i vérification(s)"; break; }
  sleep 10
done
status=0
for f in "$@"; do
  l=$(curl -sS "${BASE}${f}?x=$RANDOM" | sha1sum | cut -c1-12); r=$(sha1sum "$f" | cut -c1-12)
  if [ "$l" = "$r" ]; then echo "OK    $f"; else echo "DIFF  $f"; status=1; fi
done
exit $status
