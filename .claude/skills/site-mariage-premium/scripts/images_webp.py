"""Convertit une photo en WebP multi-tailles pour le site (srcset).

Usage :
  python3 images_webp.py <source> <destination_sans_extension> [--widths 640,1024,1600]
                         [--ratio 3:2 --focus 0.5,0.4] [--crop G,H,D,B] [--quality 78]

Exemples :
  # photo du couple, gardée entière
  python3 images_webp.py originaux/couple.png site/assets/img/photos/couple --widths 640,1024,1448
  # fiche d'hébergement recadrée en 3:2, centrée un peu plus bas
  python3 images_webp.py gite.webp site/assets/img/hebergements/gite --widths 480,800 --ratio 3:2 --focus 0.5,0.55
  # portrait de témoin recadré à la main autour du visage (pixels source)
  python3 images_webp.py Florent.jpg site/assets/img/temoins/florent --widths 400,800 --crop 230,60,1130,1185

Produit <destination>-<largeur>.webp pour chaque largeur (jamais d'agrandissement au-delà de la source)
et affiche la taille des fichiers. Dépendance : Pillow (pip install pillow).
"""
import argparse
from pathlib import Path

from PIL import Image, ImageOps


def crop_ratio(im, ratio, fx, fy):
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        x = round((w - nw) * fx)
        return im.crop((x, 0, x + nw, h))
    nh = round(w / ratio)
    y = round((h - nh) * fy)
    return im.crop((0, y, w, y + nh))


def main():
    ap = argparse.ArgumentParser(description="Photo → WebP multi-tailles")
    ap.add_argument("source")
    ap.add_argument("dest")
    ap.add_argument("--widths", default="640,1024,1600")
    ap.add_argument("--ratio", help="ex. 3:2, 4:5, 16:9")
    ap.add_argument("--focus", default="0.5,0.5", help="point à garder lors du recadrage (fractions x,y)")
    ap.add_argument("--crop", help="recadrage manuel G,H,D,B en pixels source")
    ap.add_argument("--quality", type=int, default=78)
    a = ap.parse_args()

    im = ImageOps.exif_transpose(Image.open(a.source))
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        rgba = im.convert("RGBA")
        bg.paste(rgba, mask=rgba.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    if a.crop:
        im = im.crop(tuple(int(v) for v in a.crop.split(",")))
    if a.ratio:
        rw, rh = (float(v) for v in a.ratio.split(":"))
        fx, fy = (float(v) for v in a.focus.split(","))
        im = crop_ratio(im, rw / rh, fx, fy)

    dest = Path(a.dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    done = []
    for width in [int(v) for v in a.widths.split(",")]:
        w = min(width, im.width)
        if any(d == w for d, _ in done):
            continue
        out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        path = Path(f"{dest}-{w}.webp")
        out.save(path, "WEBP", quality=a.quality, method=6)
        done.append((w, path))
        print(f"{path}  {out.width}×{out.height}  {path.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
