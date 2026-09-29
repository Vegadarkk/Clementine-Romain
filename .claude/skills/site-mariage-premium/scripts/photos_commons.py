#!/usr/bin/env python3
"""Photos libres de droits des lieux (Wikimedia Commons) pour les cartes retournables de la page Environs.

1. Chercher et REGARDER les candidates (planche contact numérotée) :
     python3 photos_commons.py search "Col de Leschaux" leschaux
     python3 photos_commons.py search "cat:Alby-sur-Chéran" alby      # fichiers d'une catégorie
   → leschaux.jpg (planche) + leschaux.json. Ouvre la planche et vérifie que c'est le BON lieu :
     les homonymes sont fréquents (il y a deux « col de Leschaux », deux « cascade du Pissieu »).
     Préfère une photo où le lieu est reconnaissable (panneau, monument) à une belle vue ambiguë.

2. Télécharger les photos retenues, avec auteur et licence :
     picks.json : [["leschaux", "File:Col de Leschaux (900m).JPG"], ["semnoz", "File:..."], ...]
     python3 photos_commons.py fetch picks.json <site>/assets/img/environs
   → <nom>-800.webp (dos de carte) et <nom>-1600.webp (visionneuse) + credits.json, et affiche les
     attributs data-photo-* à coller sur chaque <article class="place">.

Wikimedia limite fortement les requêtes (erreur 429) : ce script envoie UNE requête groupée pour toutes
les métadonnées, un User-Agent explicite, et attend entre les téléchargements. Si le 429 arrive quand
même, patiente une à deux minutes et relance (les fichiers déjà téléchargés sont sautés).
"""
import html, io, json, os, re, subprocess, sys, time, urllib.parse

UA = "WeddingSiteBuilder/1.0 (static wedding website; contact via repository owner)"
API = "https://commons.wikimedia.org/w/api.php?"


def get(url, binary=False):
    code = b""
    for attempt in range(5):
        r = subprocess.run(["curl", "-sS", "-A", UA, "-w", "\n%{http_code}", url], capture_output=True)
        body, code = r.stdout.rsplit(b"\n", 1)
        if code == b"200":
            return body if binary else json.loads(body)
        time.sleep(15 * (attempt + 1))
    sys.exit(f"Échec {code.decode()} : {url}")


def strip(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def search(query, key):
    from PIL import Image, ImageDraw
    base = {"action": "query", "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": 300, "format": "json"}
    if query.startswith("cat:"):
        base.update({"generator": "categorymembers", "gcmtitle": "Category:" + query[4:], "gcmtype": "file", "gcmlimit": 40})
    else:
        base.update({"generator": "search", "gsrsearch": query, "gsrnamespace": 6, "gsrlimit": 18})
    pages = sorted(get(API + urllib.parse.urlencode(base)).get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    res = []
    for p in pages:
        ii = p["imageinfo"][0]
        if ii["mime"] in ("image/jpeg", "image/png", "image/webp"):
            res.append({"title": p["title"], "w": ii["width"], "h": ii["height"], "thumb": ii["thumburl"],
                        "license": ii["extmetadata"].get("LicenseShortName", {}).get("value", "")})
    json.dump(res, open(f"{key}.json", "w"), ensure_ascii=False, indent=1)
    tiles = []
    for i, r in enumerate(res):
        time.sleep(0.4)
        im = Image.open(io.BytesIO(get(r["thumb"], True))).convert("RGB")
        im.thumbnail((300, 225))
        t = Image.new("RGB", (300, 250), "white")
        t.paste(im, ((300 - im.width) // 2, 0))
        ImageDraw.Draw(t).text((4, 230), f"{i} {r['w']}x{r['h']} {r['license'][:18]}", fill="black")
        tiles.append(t)
    cols = 6
    sheet = Image.new("RGB", (cols * 300, max(1, (len(tiles) + cols - 1) // cols) * 250), "white")
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 300, (i // cols) * 250))
    sheet.save(f"{key}.jpg", quality=80)
    for i, r in enumerate(res):
        print(i, r["title"], r["w"], r["h"], r["license"])
    print(f"Planche : {key}.jpg")


def fetch(picks_file, out_dir):
    from PIL import Image
    picks = json.load(open(picks_file))
    os.makedirs(out_dir, exist_ok=True)
    q = {"action": "query", "titles": "|".join(t for _, t in picks), "prop": "imageinfo",
         "iiprop": "url|size|extmetadata", "iiurlwidth": 1920, "format": "json", "formatversion": 2}
    d = get(API + urllib.parse.urlencode(q))
    norm = {n["from"]: n["to"] for n in d["query"].get("normalized", [])}
    pages = {p["title"]: p for p in d["query"]["pages"]}
    credits = {}
    for name, title in picks:
        p = pages[norm.get(title, title)]
        ii, m = p["imageinfo"][0], p["imageinfo"][0]["extmetadata"]
        artist = re.sub(r" from .*$", "", strip(m.get("Artist", {}).get("value")))  # « X from Annecy, France » (Flickr)
        credits[name] = {"file": p["title"], "source": ii["descriptionurl"], "artist": artist,
                         "license": m.get("LicenseShortName", {}).get("value", ""), "licenseUrl": m.get("LicenseUrl", {}).get("value", ""),
                         "description": strip(m.get("ImageDescription", {}).get("value"))[:200]}
        target = os.path.join(out_dir, f"{name}-1600.webp")
        if not os.path.exists(target):
            im = Image.open(io.BytesIO(get(ii["thumburl"], True))).convert("RGB")
            for w, quality in ((800, 80), (1600, 70)):
                r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
                r.save(os.path.join(out_dir, f"{name}-{w}.webp"), "WEBP", quality=quality, method=6)
            time.sleep(2)
    json.dump(credits, open(os.path.join(out_dir, "credits.json"), "w"), ensure_ascii=False, indent=1)
    print("\nAttributs à ajouter sur chaque <article class=\"place\"> (écris data-photo-alt toi-même, en français) :\n")
    for name, c in credits.items():
        print(f'{name}: data-photo="assets/img/environs/{name}" data-photo-alt="…" '
              f'data-photo-credit="{html.escape(c["artist"])}" data-photo-license="{c["license"]}" '
              f'data-photo-license-url="{c["licenseUrl"]}" data-photo-source="{html.escape(c["source"])}"')
        print(f"   ({c['description'][:110]})")
    print("\nGarde credits.json hors du site (ou supprime-le) : les crédits sont déjà affichés au dos des cartes.")


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "search":
        search(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 4 and sys.argv[1] == "fetch":
        fetch(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
