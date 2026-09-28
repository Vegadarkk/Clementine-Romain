"""Génère les images optimisées du site (WebP multi-tailles) depuis les originaux.

Usage : python3 tools/build-images.py <dossier_des_originaux>
Dépendance : Pillow (pip install pillow)
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("originals")
OUT = Path(__file__).resolve().parent.parent / "assets" / "img"

# (fichier source, nom de sortie, largeurs, recadrage (gauche, haut, droite, bas) ou None)
PHOTOS = [
    ("Photo Romain et Clémentine pour site internet 2.png", "photos/couple-arche", [640, 1024, 1448], None),
    ("Photo Romain et Clémentine pour site internet 1.png", "photos/couple-jardin", [640, 1024, 1446], None),
    ("photo Saint Offenge entrée salle.webp", "photos/chateau-entree", [640, 1024, 1600], None),
]

# Portraits des témoins recadrés en 4:5 autour du visage
TEMOINS = [
    ("Florent.jpg", "temoins/florent", (230, 60, 1130, 1185)),
    ("Pauline.jpg", "temoins/pauline", (0, 672, 900, 1797)),
    ("AnneC.jpg", "temoins/anne-cecile", (0, 20, 1200, 1520)),
    ("Amandine.jpg", "temoins/amandine", (80, 475, 980, 1600)),
]


def save_webp(im: Image.Image, dest: Path, width: int, quality: int = 78) -> None:
    ratio = width / im.width
    resized = im if ratio >= 1 else im.resize((width, round(im.height * ratio)), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    resized.save(dest, "WEBP", quality=quality, method=6)
    print(f"{dest.relative_to(OUT)}  {resized.size}  {dest.stat().st_size // 1024} Ko")


def load(name: str) -> Image.Image:
    im = Image.open(SRC / name)
    return ImageOps.exif_transpose(im).convert("RGB")


for src, out, widths, crop in PHOTOS:
    im = load(src)
    if crop:
        im = im.crop(crop)
    for w in widths:
        save_webp(im, OUT / f"{out}-{w}.webp", min(w, im.width))

for src, out, crop in TEMOINS:
    im = load(src).crop(crop)
    for w in (400, 800):
        save_webp(im, OUT / f"{out}-{w}.webp", w, quality=80)
