"""Generate web derivatives from the untouched originals in assets-src/original.

Run with `npm run images` (Python 3 + Pillow). Outputs are committed so the build
never depends on Python. Originals are never modified.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
source = root / 'assets-src' / 'original'
output = root / 'public' / 'images'
output.mkdir(parents=True, exist_ok=True)
fonts = Path('C:/Windows/Fonts')


def save(image, name, quality=78):
    target = output / f'{name}.webp'
    image.save(target, 'WEBP', quality=quality, method=6)
    return target.stat().st_size


def variants(relative, name, widths, box=None, quality=78):
    with Image.open(source / relative) as original:
        image = original.convert('RGB')
        if box:
            image = image.crop(box)
        total = 0
        for width in widths:
            height = round(image.height * width / image.width)
            total += save(image.resize((width, height), Image.Resampling.LANCZOS), f'{name}-{width}', quality)
        print(f'{name}: {image.width}x{image.height} -> {widths}, {total // 1024} KB total')


# Heroes: the desktop crop drops the plant on the far left (the frame is portrait-leaning);
# the mobile crop drops the empty wall at the top. Each is served by <picture>, so a
# device downloads only one.
variants('heroes/nook-desktop-hero.webp', 'hero-desktop', [960, 1356], box=(180, 0, 1536, 1024), quality=80)
variants('heroes/nook-mobile-hero.webp', 'hero-mobile', [480, 820], box=(0, 250, 1024, 1536), quality=80)

# Every gallery image at card, detail and lightbox sizes, named <property>-<room>-<w>.
guide = json.loads((source / 'property-guide.json').read_text(encoding='utf-8'))
for prop in guide:
    for relative in prop['gallery']:
        room = Path(relative).stem
        variants(relative, f"{prop['id']}-{room}", [480, 800, 1280])

# Landscape social preview: cream panel with live-style type beside the desktop hero.
cream, olive, terracotta, charcoal = (244, 239, 229), (52, 62, 50), (184, 104, 72), (36, 39, 34)
og = Image.new('RGB', (1200, 630), cream)
with Image.open(source / 'heroes/nook-desktop-hero.webp') as original:
    photo = original.convert('RGB').crop((330, 0, 1536, 1024))
    photo = photo.resize((round(photo.width * 630 / photo.height), 630), Image.Resampling.LANCZOS)
    photo = photo.crop((0, 0, 640, 630))
    og.paste(photo, (560, 0))
draw = ImageDraw.Draw(og)
# The symbol, drawn from the same geometry as src/components/Logo.tsx (viewBox 260x300).
scale, ox, oy = 0.2, 64, 70
def pt(x, y): return (ox + x * scale, oy + y * scale)
outline = [pt(0, 0), pt(196, 82), pt(232, 97), pt(252, 120), pt(260, 160), pt(260, 300), pt(215, 300), pt(215, 147)]
import math
for step in range(0, 181, 6):
    angle = math.radians(step)
    outline.append(pt(153.5 + 61.5 * math.cos(angle), 147 - 61.5 * math.sin(angle)))
outline += [pt(92, 300), pt(0, 300)]
draw.polygon(outline, fill=olive)
serif = ImageFont.truetype(str(fonts / 'georgia.ttf'), 40)
draw.text((126, 66), 'nook', font=serif, fill=olive)
small = ImageFont.truetype(str(fonts / 'arialbd.ttf'), 15)
draw.text((127, 114), 'K A M P A L A', font=small, fill=olive)
headline = ImageFont.truetype(str(fonts / 'georgia.ttf'), 62)
draw.text((64, 200), 'Find your place', font=headline, fill=charcoal)
draw.text((64, 274), 'in Kampala.', font=headline, fill=charcoal)
draw.line((64, 372, 176, 372), fill=terracotta, width=3)
body = ImageFont.truetype(str(fonts / 'arial.ttf'), 23)
draw.text((64, 398), 'Apartments & stays across Kampala —', font=body, fill=olive)
draw.text((64, 430), 'an apartment discovery concept.', font=body, fill=olive)
badge = ImageFont.truetype(str(fonts / 'arialbd.ttf'), 13)
draw.text((64, 548), 'INDEPENDENT CONCEPT', font=badge, fill=(120, 118, 104))
draw.text((64, 568), 'ALL PROPERTIES AND PRICES ARE ILLUSTRATIVE', font=badge, fill=(120, 118, 104))
og.save(root / 'public' / 'og-image.jpg', 'JPEG', quality=86, optimize=True)
print('public/og-image.jpg written')

# PNG app icon for platforms that ignore SVG favicons.
icon = Image.new('RGB', (180, 180), cream)
d = ImageDraw.Draw(icon)
scale, ox, oy = 0.42, 35, 27
outline = [pt(0, 0), pt(196, 82), pt(232, 97), pt(252, 120), pt(260, 160), pt(260, 300), pt(215, 300), pt(215, 147)]
for step in range(0, 181, 6):
    angle = math.radians(step)
    outline.append(pt(153.5 + 61.5 * math.cos(angle), 147 - 61.5 * math.sin(angle)))
outline += [pt(92, 300), pt(0, 300)]
d.polygon(outline, fill=olive)
icon.save(root / 'public' / 'apple-touch-icon.png')
print('public/apple-touch-icon.png written')
