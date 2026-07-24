"""Generate a 512x512 placeholder brand icon for ScoreDeck.
Teal background, white SD monogram. Users can swap with real art later."""
from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 512
OUT = os.path.join(os.path.dirname(__file__), "icon.png")

TEAL = (75, 159, 174, 255)      # #4b9fae
TEAL_DARK = (47, 103, 112, 255) # #2f6770
WHITE = (255, 255, 255, 255)

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# Rounded-square background with a subtle gradient (simulated by two overlays)
radius = 96
d.rounded_rectangle([(0, 0), (SIZE, SIZE)], radius=radius, fill=TEAL)
# Darker bottom-right accent triangle
overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.rounded_rectangle([(SIZE * 0.35, SIZE * 0.55), (SIZE, SIZE)], radius=radius, fill=TEAL_DARK)
img = Image.alpha_composite(img, overlay)
d = ImageDraw.Draw(img)

# Try a system font, fallback to default
font = None
for candidate in [
    "C:/Windows/Fonts/segoeuib.ttf",   # Segoe UI Bold
    "C:/Windows/Fonts/arialbd.ttf",    # Arial Bold
    "C:/Windows/Fonts/arial.ttf",
]:
    if os.path.exists(candidate):
        font = ImageFont.truetype(candidate, size=280)
        break
if font is None:
    font = ImageFont.load_default()

text = "SD"
bbox = d.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
# Center-ish, nudged up a touch for optical balance
x = (SIZE - tw) // 2 - bbox[0]
y = (SIZE - th) // 2 - bbox[1] - 20
d.text((x, y), text, fill=WHITE, font=font)

# Small accent dot bottom-right
dot_r = 22
d.ellipse(
    [(SIZE - 90 - dot_r, SIZE - 90 - dot_r), (SIZE - 90 + dot_r, SIZE - 90 + dot_r)],
    fill=WHITE,
)

img.save(OUT, format="PNG")
print(f"Wrote {OUT} ({img.size})")
