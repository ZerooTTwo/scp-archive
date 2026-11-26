"""Generate PWA / Android icons for both SCP Archive brand marks.

Run from the repo root: python scripts/make-icons.py
Requires Pillow.

Sources (CC BY-SA 3.0, SCP Wiki):
  assets/brand/scp-logo-official-badge.png  official SCP mark
  assets/brand/scp-cn-logo.png              SCP-CN branch mark

Outputs:
  public/icons/                  official (default PWA / boot icon)
  public/icons/official/         in-app official mark
  public/icons/cn/               in-app CN mark
  android/app/src/main/res/      official + CN launcher icons, official splash
"""

from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_ICONS = ROOT / "public" / "icons"

BG = (23, 19, 16, 255)
PAPER = (240, 229, 215, 255)

MARKS = {
    "official": ROOT / "assets" / "brand" / "scp-logo-official-badge.png",
    "cn": ROOT / "assets" / "brand" / "scp-cn-logo.png",
}


def _load_mark(source_path: Path, size: int, color=PAPER) -> Image.Image:
    """Turn a black mark on white/transparent into a recoloured alpha shape."""
    source = Image.open(source_path).convert("RGBA")
    ink = ImageOps.grayscale(source).point(lambda value: 255 - value)
    alpha = ImageChops.multiply(ink, source.getchannel("A"))
    bbox = alpha.getbbox()
    if bbox:
        alpha = alpha.crop(bbox)
    # Keep the original aspect ratio; the official badge is slightly wider than tall.
    scale = min(size / alpha.width, size / alpha.height)
    alpha = alpha.resize(
        (max(1, round(alpha.width * scale)), max(1, round(alpha.height * scale))),
        Image.LANCZOS,
    )
    solid = Image.new("RGBA", alpha.size, color)
    solid.putalpha(alpha)
    return solid


def _paste_center(canvas: Image.Image, mark: Image.Image) -> None:
    left = (canvas.width - mark.width) // 2
    top = (canvas.height - mark.height) // 2
    canvas.alpha_composite(mark, (left, top))


def draw_mark(mark_name: str, size: int, *, maskable: bool = False) -> Image.Image:
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

    _paste_center(img, _load_mark(MARKS[mark_name], int(canvas * mark_ratio)))
    return img.resize((size, size), Image.LANCZOS)


def draw_foreground(mark_name: str, size: int) -> Image.Image:
    scale = 4
    canvas = size * scale
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    _paste_center(img, _load_mark(MARKS[mark_name], int(canvas * 0.58)))
    return img.resize((size, size), Image.LANCZOS)


def draw_round(mark_name: str, size: int) -> Image.Image:
    mark = draw_mark(mark_name, size)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(mark, (0, 0), mask)
    return out


def draw_splash(mark_name: str, width: int, height: int) -> Image.Image:
    img = Image.new("RGB", (width, height), BG[:3])
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    logo_size = int(min(width, height) * 0.38)
    logo = _load_mark(MARKS[mark_name], logo_size)
    layer.alpha_composite(
        logo, ((width - logo.width) // 2, (height - logo.height) // 2)
    )
    out = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    return out


def write_favicon_svg() -> None:
    icon = draw_mark("official", 96)
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


def web_icons() -> None:
    for mark_name in MARKS:
        out = PUBLIC_ICONS if mark_name == "official" else PUBLIC_ICONS / mark_name
        if mark_name == "official":
            out.mkdir(parents=True, exist_ok=True)
            (out / "official").mkdir(exist_ok=True)
        out = PUBLIC_ICONS / mark_name
        out.mkdir(parents=True, exist_ok=True)
        draw_mark(mark_name, 192).save(out / "icon-192.png", optimize=True)
        draw_mark(mark_name, 512).save(out / "icon-512.png", optimize=True)
        draw_mark(mark_name, 512, maskable=True).save(
            out / "icon-maskable-512.png", optimize=True
        )
        draw_mark(mark_name, 180).save(out / "apple-touch-icon.png", optimize=True)

    # Root aliases keep PWA manifests and the pre-React boot screen working.
    for name in ("icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"):
        (PUBLIC_ICONS / name).write_bytes((PUBLIC_ICONS / "official" / name).read_bytes())
    draw_mark("official", 64).save(ROOT / "public" / "favicon.png", optimize=True)
    write_favicon_svg()


def android_icons() -> None:
    legacy = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    adaptive = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
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

    app = ROOT / "android" / "app"
    if not app.exists():
        return
    res = app / "src" / "main" / "res"
    res.mkdir(parents=True, exist_ok=True)

    # MainActivityOfficial uses the standard ic_launcher names; the CN alias gets
    # a parallel set so both can stay in the single APK.
    for mark_name, suffix in (("official", ""), ("cn", "_cn")):
        for density, size in legacy.items():
            folder = res / f"mipmap-{density}"
            folder.mkdir(parents=True, exist_ok=True)
            draw_mark(mark_name, size).save(folder / f"ic_launcher{suffix}.png", optimize=True)
            draw_round(mark_name, size).save(
                folder / f"ic_launcher{suffix}_round.png", optimize=True
            )
        for density, size in adaptive.items():
            folder = res / f"mipmap-{density}"
            folder.mkdir(parents=True, exist_ok=True)
            draw_foreground(mark_name, size).save(
                folder / f"ic_launcher{suffix}_foreground.png", optimize=True
            )

    # A splash screen cannot follow a runtime icon switch; keep the official mark.
    for folder, (width, height) in splash_sizes.items():
        target = res / folder
        target.mkdir(parents=True, exist_ok=True)
        draw_splash("official", width, height).save(target / "splash.png", optimize=True)


def main() -> None:
    web_icons()
    android_icons()
    print("icons written for", ", ".join(MARKS))


if __name__ == "__main__":
    main()
