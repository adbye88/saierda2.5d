from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


def crop_sheet(sheet_path: Path, item_ids: list[str], out_dir: Path, cols: int = 4, rows: int = 4, inset: float = 0.018):
    sheet = Image.open(sheet_path).convert("RGBA")
    w, h = sheet.size
    cell_w = w / cols
    cell_h = h / rows

    out_dir.mkdir(parents=True, exist_ok=True)
    for idx, item_id in enumerate(item_ids):
        if not item_id or item_id == "-":
            continue
        col = idx % cols
        row = idx // cols
        inset_x = int(cell_w * inset)
        inset_y = int(cell_h * inset)
        box = (
            int(col * cell_w) + inset_x,
            int(row * cell_h) + inset_y,
            int((col + 1) * cell_w) - inset_x,
            int((row + 1) * cell_h) - inset_y,
        )
        icon = sheet.crop(box)
        icon = ImageOps.fit(icon, (256, 256), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        icon = icon.filter(ImageFilter.UnsharpMask(radius=0.7, percent=105, threshold=2))
        icon.save(out_dir / f"{item_id}.png")


def main():
    parser = argparse.ArgumentParser(description="Crop a 4x4 AI-generated item icon sheet into 256px game icons.")
    parser.add_argument("sheet", type=Path)
    parser.add_argument("items", nargs="+", help="Item ids in row-major order. Use '-' for blank cells.")
    parser.add_argument("--out-dir", type=Path, default=Path(__file__).resolve().parents[1] / "assets" / "icons" / "items")
    parser.add_argument("--inset", type=float, default=0.018)
    args = parser.parse_args()
    crop_sheet(args.sheet, args.items, args.out_dir, inset=args.inset)
    print(f"cropped {len([i for i in args.items if i and i != '-'])} icons from {args.sheet}")


if __name__ == "__main__":
    main()
