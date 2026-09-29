#!/bin/sh
# Prépare le dossier « dist » publié par Cloudflare Pages (ou Netlify) : uniquement les fichiers du site,
# sans les outils, le skill ni le README.
# Réglages Cloudflare Pages : commande de build « sh tools/dist.sh », répertoire de sortie « dist ».
set -e
cd "$(dirname "$0")/.."
rm -rf dist
mkdir dist
cp ./*.html robots.txt dist/
[ -f sitemap.xml ] && cp sitemap.xml dist/
[ -f _headers ] && cp _headers dist/
cp -R assets dist/
echo "dist/ prêt : $(find dist -type f | wc -l | tr -d ' ') fichiers"
