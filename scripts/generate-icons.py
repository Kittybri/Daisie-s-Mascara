"""Generate the vector-style Daisie Mascara mark at native icon resolutions."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / "extension" / "icons"
root.mkdir(parents=True, exist_ok=True)
for size in (16, 32, 48, 128):
    scale = 4
    image = Image.new("RGBA", (size * scale, size * scale))
    draw = ImageDraw.Draw(image)
    def xy(points):
        return [(round(x * size * scale / 128), round(y * size * scale / 128)) for x, y in points]
    draw.rounded_rectangle(xy([(16, 16), (112, 112)]), radius=24 * size * scale / 128, fill="#152D3B")
    draw.polygon(xy([(64, 31), (91, 41), (89, 67), (82, 82), (64, 96), (46, 82), (39, 67), (37, 41)]), fill="#FBF7EF")
    draw.line(xy([(45, 64), (54, 68), (64, 63), (74, 59), (84, 63)]), fill="#B56440", width=max(2, round(6 * size * scale / 128)), joint="curve")
    draw.line(xy([(52, 77), (62, 80), (75, 73)]), fill="#152D3B", width=max(2, round(5 * size * scale / 128)), joint="curve")
    image.resize((size, size), Image.Resampling.LANCZOS).save(root / f"icon{size}.png")
