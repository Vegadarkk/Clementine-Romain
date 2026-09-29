#!/usr/bin/env python3
"""Agrandit une photo trop petite pour un affichage plein écran, sans dénaturer les visages.

Principe : Real-ESRGAN « general x4v3 » (petit modèle, rapide sur CPU) produit une version 4×, que l'on
mélange à seulement 35 % avec un agrandissement classique (Lanczos), puis une netteté douce. L'IA seule
rend les yeux et la peau « peints » ; le mélange garde la ressemblance tout en gagnant en netteté.
Toujours comparer avant / après sur un recadrage des visages à l'échelle d'affichage réelle.

Installation (une fois) :
  pip install numpy pillow torch --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple
  curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth
  curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-wdn-x4v3.pth
Usage :
  python3 agrandir_photo.py source.webp sortie-2560.png 2560   # puis images_webp.py / tailles 640…2560
Pense aussi à `sizes` : l'arche zoome à 125 % et, en portrait, `object-fit: cover` rogne les côtés
(`sizes="(orientation: portrait) 166vh, 125vw"`), sinon le navigateur choisit une image trop petite.
Le vrai remède reste la photo originale du téléphone (non compressée par la messagerie) : demande-la.
"""
import sys, time
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image, ImageFilter

MIX, DENOISE = 0.35, 0.2  # part de l'IA dans le mélange ; débruitage (0 = garde le grain, 1 = lisse)


class SRVGGNetCompact(nn.Module):
    def __init__(self, num_feat=64, num_conv=32, upscale=4):
        super().__init__()
        self.body = nn.ModuleList([nn.Conv2d(3, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)])
        for _ in range(num_conv):
            self.body.append(nn.Conv2d(num_feat, num_feat, 3, 1, 1))
            self.body.append(nn.PReLU(num_parameters=num_feat))
        self.body.append(nn.Conv2d(num_feat, 3 * upscale * upscale, 3, 1, 1))
        self.up, self.scale = nn.PixelShuffle(upscale), upscale

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.up(out) + F.interpolate(x, scale_factor=self.scale, mode="nearest")


def weights(path):
    d = torch.load(path, map_location="cpu")
    return d.get("params", d.get("params_ema", d))


def esrgan_x4(img):
    a, b = weights("realesr-general-x4v3.pth"), weights("realesr-general-wdn-x4v3.pth")
    net = SRVGGNetCompact()
    net.load_state_dict({k: DENOISE * a[k] + (1 - DENOISE) * b[k] for k in a})
    net.eval()
    x = torch.from_numpy(np.asarray(img).astype(np.float32) / 255).permute(2, 0, 1)[None]
    _, _, H, W = x.shape
    y = torch.zeros(1, 3, H * 4, W * 4)
    T, P = 256, 12  # tuiles avec marge : mémoire raisonnable, pas de coutures
    with torch.no_grad():
        for i in range(0, H, T):
            for j in range(0, W, T):
                i0, j0, i1, j1 = max(i - P, 0), max(j - P, 0), min(i + T + P, H), min(j + T + P, W)
                o = net(x[:, :, i0:i1, j0:j1])
                hi, wj = min(T, H - i), min(T, W - j)
                y[:, :, i * 4:(i + hi) * 4, j * 4:(j + wj) * 4] = o[:, :, (i - i0) * 4:(i - i0 + hi) * 4, (j - j0) * 4:(j - j0 + wj) * 4]
    return Image.fromarray((y[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8))


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    src, out, width = sys.argv[1], sys.argv[2], int(sys.argv[3])
    t0 = time.time()
    img = Image.open(src).convert("RGB")
    size = (width, round(img.height * width / img.width))
    ai = esrgan_x4(img).resize(size, Image.LANCZOS)
    base = img.resize(size, Image.LANCZOS)
    Image.blend(base, ai, MIX).filter(ImageFilter.UnsharpMask(radius=1.2, percent=45, threshold=2)).save(out)
    print(f"{out} {size} en {time.time() - t0:.0f} s")
