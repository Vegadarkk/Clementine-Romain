#!/bin/sh
# Publie le site sur Cloudflare Pages (projet « nom-du-projet » → https://nom-du-projet.pages.dev/).
# Prérequis : variables CLOUDFLARE_API_TOKEN (droit « Cloudflare Pages : Edit ») et CLOUDFLARE_ACCOUNT_ID.
# Usage : sh tools/deploy-cloudflare.sh   (depuis la racine du dépôt, après `npm run pages`)
set -e
cd "$(dirname "$0")/.."
sh tools/dist.sh
npx --yes wrangler@3 pages deploy dist --project-name nom-du-projet --branch main --commit-dirty=true
rm -rf dist
