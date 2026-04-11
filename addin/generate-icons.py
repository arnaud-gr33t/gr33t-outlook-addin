#!/usr/bin/env python3
"""Generate Gr33t placeholder icons for Outlook add-in."""
from PIL import Image, ImageDraw, ImageFont
import os

GR33T_BLUE = (67, 135, 244)  # #4387F4
WHITE = (255, 255, 255)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "assets")

SIZES = [16, 32, 64, 80]

os.makedirs(OUTPUT_DIR, exist_ok=True)


def find_bold_font():
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


font_path = find_bold_font()


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded blue square background
    radius = max(2, size // 6)
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=GR33T_BLUE,
    )

    # "G" letter centered
    letter = "G"
    font_size = int(size * 0.7)
    try:
        font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), letter, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), letter, font=font, fill=WHITE)

    return img


for size in SIZES:
    icon = make_icon(size)
    out = os.path.join(OUTPUT_DIR, f"icon-{size}.png")
    icon.save(out, "PNG")
    print(f"✓ {out} ({size}x{size})")

print("Done.")
