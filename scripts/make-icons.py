"""Generate the SCP Archive launcher icons and splash screens.

Run from the repo root: python scripts/make-icons.py
Requires Pillow. Outputs PWA icons into public/icons/ and Android resources
into android/app/src/main/res/.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BG = (23, 19, 16, 255)
PAPER = (240, 229, 215, 255)
PAPER_DIM = (176, 161, 146, 255)
ACCENT = (224, 106, 85, 255)


def _draw_archive(d: ImageDraw.ImageDraw, canvas: int, *, scale: float = 0.63) -> None:
    mark = canvas * scale
    left = (canvas - mark) / 2
    top = (canvas - mark) / 2
    right = left + mark
    bottom = top + mark
    stroke = max(2, int(mark * 0.055))

    d.rounded_rectangle(
        [left, top, right, bottom],
        radius=int(mark * 0.2),
        outline=PAPER,
        width=stroke,
    )

    inset = mark * 0.18
    line_left = left + inset
    line_right = right - inset
    ys = [top + mark * 0.33, top + mark * 0.5, top + mark * 0.67]
    widths = [1.0, 0.88, 0.72]
    for y, width in zip(ys, widths):
        d.rounded_rectangle(
            [line_left, y - stroke * 0.42, line_left + (line_right - line_left) * width, y + stroke * 0.42],
            radius=stroke * 0.42,
            fill=PAPER,
        )

    dot_r = mark * 0.042
    d.ellipse(
        [right - inset - dot_r * 2, ys[-1] - dot_r, right - inset, ys[-1] + dot_r],
        fill=ACCENT,
    )


def draw_mark(size: int, *, maskable: bool = False) -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Full-bleed ground. Maskable icons keep the mark well inside the safe zone.
    if maskable:
        d.rectangle([0, 0, canvas - 1, canvas - 1], fill=BG)
    else:
        d.rounded_rectangle(
            [0, 0, canvas - 1, canvas - 1],
            radius=int(canvas * 0.225),
            fill=BG,
        )

    _draw_archive(d, canvas, scale=0.55 if maskable else 0.63)
    return img.resize((size, size), Image.LANCZOS)


def draw_foreground(size: int) -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    _draw_archive(ImageDraw.Draw(img), canvas, scale=0.58)
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
    logo_size = int(min(width, height) * 0.4)
    scale = 4
    logo = Image.new("RGBA", (logo_size * scale, logo_size * scale), (0, 0, 0, 0))
    _draw_archive(ImageDraw.Draw(logo), logo_size * scale, scale=0.82)
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
    img.paste(logo, ((width - logo_size) // 2, (height - logo_size) // 2), logo)
    return img


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

    # Android's adaptive icon background.
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

    # A small opaque favicon fallback for very old browsers.
    draw_mark(64).save(ROOT / "public" / "favicon.png", optimize=True)
    android_icons()
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
