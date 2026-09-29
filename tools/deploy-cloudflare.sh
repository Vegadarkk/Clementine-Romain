#!/bin/sh
# Publie le site sur Cloudflare Pages (projet « clementine-et-romain » → https://clementine-et-romain.pages.dev/).
# Prérequis : variables CLOUDFLARE_API_TOKEN (droit « Cloudflare Pages : Edit ») et CLOUDFLARE_ACCOUNT_ID.
# Usage : sh tools/deploy-cloudflare.sh   (depuis la racine du dépôt, après `npm run pages`)
set -e
cd "$(dirname "$0")/.."
sh tools/dist.sh
npx --yes wrangler@3 pages deploy dist --project-name clementine-et-romain --branch main --commit-dirty=true
rm -rf dist
