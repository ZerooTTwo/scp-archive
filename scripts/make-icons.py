"""Generate PWA / Android icons and splash screens from the SCP-CN mark.

Run from the repo root: python scripts/make-icons.py
Requires Pillow. The source mark lives at assets/brand/scp-cn-logo.png and is
used under CC BY-SA 3.0 (SCP Wiki CN). Outputs public/icons/ and Android res/.
"""

from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / "assets" / "brand" / "scp-cn-logo.png"

BG = (23, 19, 16, 255)
PAPER = (240, 229, 215, 255)


def _load_mark(size: int, color: tuple[int, int, int, int] = PAPER) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    # The source is black line art on white. Turn white into transparency so the
    # mark can be recoloured without keeping a square background.
    ink = ImageOps.grayscale(source).point(lambda value: 255 - value)
    alpha = ImageChops.multiply(ink, source.getchannel("A"))
    bbox = alpha.getbbox()
    if bbox:
        alpha = alpha.crop(bbox)
    alpha = alpha.resize((size, size), Image.LANCZOS)
    solid = Image.new("RGBA", alpha.size, color)
    solid.putalpha(alpha)
    return solid


def _paste_center(canvas: Image.Image, mark: Image.Image) -> None:
    left = (canvas.width - mark.width) // 2
    top = (canvas.height - mark.height) // 2
    canvas.alpha_composite(mark, (left, top))


def draw_mark(size: int, *, maskable: bool = False) -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if maskable:
        d.rectangle([0, 0, canvas - 1, canvas - 1], fill=BG)
        mark_ratio = 0.54
    else:
        d.rounded_rectangle(
            [0, 0, canvas - 1, canvas - 1],
            radius=int(canvas * 0.225),
            fill=BG,
        )
        mark_ratio = 0.68

    _paste_center(img, _load_mark(int(canvas * mark_ratio)))
    return img.resize((size, size), Image.LANCZOS)


def draw_foreground(size: int) -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    _paste_center(img, _load_mark(int(canvas * 0.58)))
    return img.resize((size, size), Image.LANCZOS)


def draw_round(size: int) -> Image.Image:
    mark = draw_mark(size)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(mark, (0, 0), mask)
    return out


def draw_splash(width: int, height: int) -> Image.Image:
    img = Image.new("RGB", (width, height), BG[:3])
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    logo_size = int(min(width, height) * 0.38)
    logo = _load_mark(logo_size)
    layer.alpha_composite(logo, ((width - logo_size) // 2, (height - logo_size) // 2))
    out = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    return out


def write_favicon_svg() -> None:
    icon = draw_mark(96)
    buffer = io.BytesIO()
    icon.save(buffer, format="PNG", optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">'
        '<rect width="96" height="96" rx="22" fill="#171310"/>'
        f'<image href="data:image/png;base64,{encoded}" width="96" height="96"/>'
        "</svg>\n"
    )
    (ROOT / "public" / "favicon.svg").write_text(svg, encoding="utf-8")


def android_icons() -> None:
    res = ROOT / "android" / "app" / "src" / "main" / "res"
    if not res.exists():
        return

    legacy = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    adaptive = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}

    for density, size in legacy.items():
        folder = res / f"mipmap-{density}"
        folder.mkdir(exist_ok=True)
        draw_mark(size).save(folder / "ic_launcher.png", optimize=True)
        draw_round(size).save(folder / "ic_launcher_round.png", optimize=True)

    for density, size in adaptive.items():
        folder = res / f"mipmap-{density}"
        folder.mkdir(exist_ok=True)
        draw_foreground(size).save(folder / "ic_launcher_foreground.png", optimize=True)

    (res / "values" / "ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        "<resources>\n"
        '    <color name="ic_launcher_background">#171310</color>\n'
        "</resources>\n",
        encoding="utf-8",
    )

    splash_sizes = {
        "drawable": (480, 320),
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1600, 960),
        "drawable-land-xxxhdpi": (1920, 1280),
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
    }
    for folder, (width, height) in splash_sizes.items():
        target = res / folder
        target.mkdir(exist_ok=True)
        draw_splash(width, height).save(target / "splash.png", optimize=True)


def main() -> None:
    draw_mark(192).save(OUT / "icon-192.png", optimize=True)
    draw_mark(512).save(OUT / "icon-512.png", optimize=True)
    draw_mark(512, maskable=True).save(OUT / "icon-maskable-512.png", optimize=True)
    draw_mark(180).save(OUT / "apple-touch-icon.png", optimize=True)

    draw_mark(64).save(ROOT / "public" / "favicon.png", optimize=True)
    write_favicon_svg()
    android_icons()
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
