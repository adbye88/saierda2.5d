from __future__ import annotations

import math
import re
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ITEM_JS = ROOT / "src" / "Item.js"
OUT_DIR = ROOT / "assets" / "icons" / "items"
SIZE = 256


def parse_items() -> dict[str, dict[str, str]]:
    text = ITEM_JS.read_text(encoding="utf-8")
    text = text.split("// ---------- 料理配方表 ----------", 1)[0]
    items: dict[str, dict[str, str]] = {}
    for item_id, body in re.findall(r"^\s*([A-Za-z0-9_]+):\s*\{([^{}]+)\}", text, re.M):
        data: dict[str, str] = {"id": item_id}
        for key in ["name", "type", "subtype", "element", "set", "tag", "buff", "resist"]:
            m = re.search(rf"{key}:\s*'([^']+)'", body)
            if m:
                data[key] = m.group(1)
        for key in ["atk", "def", "durability", "heal"]:
            m = re.search(rf"{key}:\s*([0-9]+)", body)
            if m:
                data[key] = m.group(1)
        items[item_id] = data
    return items


def rgba(hex_color: str, a: int = 255):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def lerp(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(4))


def canvas():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((42, 178, 214, 232), fill=rgba("000000", 80))
    for r in range(120, 12, -3):
        t = (120 - r) / 108
        col = lerp(rgba("0d1412", 238), rgba("342b19", 235), t)
        d.rounded_rectangle((128 - r, 128 - r, 128 + r, 128 + r), radius=28, fill=col)
    d.rounded_rectangle((18, 18, 238, 238), radius=25, fill=rgba("ffffff", 8), outline=rgba("f2d06a", 168), width=4)
    d.rounded_rectangle((26, 26, 230, 230), radius=20, outline=rgba("ffffff", 34), width=1)
    d.arc((32, 26, 232, 226), 205, 300, fill=rgba("fff4b4", 38), width=4)
    for i in range(10):
        a = 16 + i * 14
        d.ellipse((a, 28 + i * 3, a + 3, 31 + i * 3), fill=rgba("ffffff", 12))
    return img


def glow(img, color, blur=14, alpha=135):
    g = Image.new("RGBA", img.size, (0, 0, 0, 0))
    mask = img.split()[-1].filter(ImageFilter.GaussianBlur(blur))
    g.paste(color[:3] + (alpha,), mask=mask)
    return g


def rotate_layer(layer, angle):
    return layer.rotate(angle, resample=Image.Resampling.BICUBIC, center=(128, 128))


def shifted_mask(mask, dx, dy):
    out = Image.new("L", mask.size, 0)
    src_x0 = max(0, -dx)
    src_y0 = max(0, -dy)
    src_x1 = min(mask.size[0], mask.size[0] - dx)
    src_y1 = min(mask.size[1], mask.size[1] - dy)
    if src_x1 <= src_x0 or src_y1 <= src_y0:
        return out
    crop = mask.crop((src_x0, src_y0, src_x1, src_y1))
    out.paste(crop, (src_x0 + dx, src_y0 + dy))
    return out


def fill_from_mask(mask, color):
    img = Image.new("RGBA", mask.size, color)
    img.putalpha(mask)
    return img


def multiply_color(color, factor, alpha=None):
    return (
        max(0, min(255, int(color[0] * factor))),
        max(0, min(255, int(color[1] * factor))),
        max(0, min(255, int(color[2] * factor))),
        color[3] if alpha is None else alpha,
    )


def draw_polygon(draw, pts, fill, outline=None, width=1):
    draw.polygon(pts, fill=fill)
    if outline:
        draw.line(pts + [pts[0]], fill=outline, width=width, joint="curve")


def poly_layer(pts, fill, outline=None, width=1):
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    draw_polygon(d, pts, fill, outline, width)
    return layer


def rounded_rect_layer(box, radius, fill, outline=None, width=1):
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    return layer


def ellipse_layer(box, fill, outline=None, width=1):
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    d.ellipse(box, fill=fill, outline=outline, width=width)
    return layer


def palette(item):
    item_id = item["id"].lower()
    name = item.get("name", "")
    element = item.get("element") or item.get("resist") or item.get("buff") or ""
    if "ancient" in item_id or "古代" in name:
        return rgba("3fe2d5"), rgba("1b776f"), rgba("f3c764")
    if element in ("fire", "fireRes") or "火" in name or "flame" in item_id:
        return rgba("ff6b2e"), rgba("7a2318"), rgba("ffd27a")
    if element in ("ice", "cold", "coldRes") or "冰" in name or "雪" in name or "zora" in item_id:
        return rgba("7fe8ff"), rgba("1f5b8e"), rgba("ecffff")
    if element in ("shock",) or "雷" in name or "topaz" in item_id:
        return rgba("ffe24c"), rgba("725711"), rgba("fff5a8")
    if "royal" in item_id or "王族" in name or "近卫" in name:
        return rgba("f0d374"), rgba("44549a"), rgba("fff2b6")
    if "gerudo" in item_id or "七宝" in name or "沙漠" in name:
        return rgba("e0b255"), rgba("7a1f3d"), rgba("5be4d8")
    if "forest" in item_id or "森" in name or "mushroom" in item_id:
        return rgba("8fd35f"), rgba("31592d"), rgba("e8ffd0")
    if "lynel" in item_id or "兽神" in name or "蛮族" in name:
        return rgba("d9d3c2"), rgba("5a2621"), rgba("ff9a56")
    return rgba("d7d0b8"), rgba("5b4a32"), rgba("f7edc2")


def paste_shape(base, shape, color=None, blur=10):
    accent = color or rgba("ffdc76")
    mask = shape.split()[-1]
    contact = shifted_mask(mask, 10, 15).filter(ImageFilter.GaussianBlur(12))
    base.alpha_composite(fill_from_mask(contact, rgba("000000", 105)))
    base.alpha_composite(glow(shape, accent, blur=blur, alpha=120))

    # Build a bevel/extrusion stack so each icon reads like a lit 3D prop.
    side_col = multiply_color(accent, 0.34, 120)
    for off in range(10, 1, -2):
        side = shifted_mask(mask, off, off).filter(ImageFilter.GaussianBlur(0.35))
        base.alpha_composite(fill_from_mask(side, side_col))

    edge = mask.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.GaussianBlur(0.6))
    base.alpha_composite(fill_from_mask(edge, rgba("fff4c2", 115)))
    base.alpha_composite(shape)

    hi = Image.new("L", (SIZE, SIZE), 0)
    hd = ImageDraw.Draw(hi)
    for y in range(SIZE):
        for x in range(SIZE):
            if x + y < 220:
                hd.point((x, y), fill=max(0, 110 - int((x + y) * 0.36)))
    hi = ImageChops.multiply(hi, mask).filter(ImageFilter.GaussianBlur(0.7))
    base.alpha_composite(fill_from_mask(hi, rgba("ffffff", 155)))

    shade = Image.new("L", (SIZE, SIZE), 0)
    sd = ImageDraw.Draw(shade)
    for y in range(SIZE):
        for x in range(SIZE):
            if x + y > 245:
                sd.point((x, y), fill=min(92, int((x + y - 245) * 0.35)))
    shade = ImageChops.multiply(shade, mask).filter(ImageFilter.GaussianBlur(0.8))
    base.alpha_composite(fill_from_mask(shade, rgba("000000", 105)))


def make_blade(item, kind="sword"):
    fg, dark, accent = palette(item)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    if kind == "spear":
        d.line((119, 211, 141, 58), fill=rgba("3d281b"), width=15)
        d.line((124, 207, 146, 59), fill=rgba("8a5d34"), width=10)
        d.line((131, 204, 151, 61), fill=rgba("e3bb79"), width=3)
        draw_polygon(d, [(144, 38), (179, 79), (150, 111), (118, 74)], multiply_color(fg, 0.72), rgba("ffffff", 150), 2)
        draw_polygon(d, [(144, 38), (154, 82), (150, 111), (132, 72)], fg, None)
        draw_polygon(d, [(154, 82), (179, 79), (150, 111)], multiply_color(fg, 0.48), None)
        d.line((145, 50, 150, 105), fill=accent, width=3)
    elif kind == "claymore":
        blade = [(116, 39), (153, 41), (163, 148), (135, 204), (106, 148)]
        draw_polygon(d, blade, multiply_color(fg, 0.62), rgba("ffffff", 125), 2)
        draw_polygon(d, [(116, 39), (135, 55), (134, 195), (106, 148)], fg, None)
        draw_polygon(d, [(135, 55), (153, 41), (163, 148), (134, 195)], multiply_color(fg, 0.38), None)
        d.line((135, 54, 134, 194), fill=accent, width=5)
        d.rounded_rectangle((88, 141, 178, 161), radius=7, fill=multiply_color(dark, 0.72), outline=accent, width=3)
        d.rounded_rectangle((123, 157, 147, 218), radius=9, fill=rgba("6b452f"), outline=rgba("f0d08c"), width=2)
        d.line((130, 163, 130, 212), fill=rgba("e5bc7e", 120), width=3)
    elif kind == "club":
        d.rounded_rectangle((91, 46, 153, 168), radius=24, fill=multiply_color(dark, 0.45), outline=rgba("d4c19d"), width=4)
        d.rounded_rectangle((99, 43, 143, 160), radius=20, fill=dark, outline=rgba("f4d9a0", 120), width=2)
        for y in (62, 86, 112):
            d.line((92, y, 153, y + 14), fill=multiply_color(accent, 0.65), width=7)
            d.line((97, y - 2, 148, y + 9), fill=accent, width=3)
        d.rounded_rectangle((114, 151, 140, 218), radius=10, fill=rgba("6b452f"), outline=rgba("eac17b"), width=2)
    else:
        blade = [(128, 34), (158, 124), (138, 176), (118, 176), (98, 124)]
        draw_polygon(d, blade, multiply_color(fg, 0.55), rgba("ffffff", 150), 2)
        draw_polygon(d, [(128, 34), (128, 167), (118, 176), (98, 124)], fg, None)
        draw_polygon(d, [(128, 34), (158, 124), (138, 176), (128, 167)], multiply_color(fg, 0.36), None)
        d.line((128, 48, 128, 166), fill=accent, width=4)
        d.rounded_rectangle((84, 154, 172, 172), radius=8, fill=multiply_color(dark, 0.7), outline=accent, width=3)
        d.rounded_rectangle((116, 168, 142, 218), radius=10, fill=rgba("6b452f"), outline=rgba("f0d08c"), width=2)
        d.line((123, 173, 123, 210), fill=rgba("e5bc7e", 120), width=3)
    if item.get("element") == "fire":
        d.arc((68, 48, 190, 170), 300, 55, fill=rgba("ff7b28"), width=6)
    if item.get("element") == "ice":
        d.line((91, 84, 165, 132), fill=rgba("e8fdff", 190), width=3)
        d.polygon([(96, 86), (110, 79), (108, 94)], fill=rgba("e8fdff", 190))
    if item.get("element") == "shock":
        d.line((164, 62, 145, 95, 167, 95, 130, 149), fill=rgba("fff06a"), width=6)
    return rotate_layer(layer, -28)


def draw_weapon(base, item):
    subtype = item.get("subtype", "sword")
    kind = "spear" if subtype == "spear" else "claymore" if subtype == "claymore" else "club" if subtype == "club" else "sword"
    shape = make_blade(item, kind)
    paste_shape(base, shape, palette(item)[0], blur=11)


def draw_shield(base, item):
    fg, dark, accent = palette(item)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    pts = [(128, 35), (185, 61), (174, 153), (128, 215), (82, 153), (71, 61)]
    if "wood" in item["id"].lower() or "boko" in item["id"].lower():
        fg, dark = rgba("9b6b3a"), rgba("4a2e1e")
    side = [(185, 61), (196, 74), (184, 163), (128, 225), (128, 215), (174, 153)]
    draw_polygon(d, side, multiply_color(dark, 0.38), None)
    draw_polygon(d, pts, dark, rgba("f2d06a", 180), 4)
    inner = [(128, 51), (168, 70), (160, 145), (128, 194), (96, 145), (88, 70)]
    draw_polygon(d, inner, fg, rgba("ffffff", 75), 2)
    draw_polygon(d, [(128, 51), (168, 70), (160, 145), (128, 194)], multiply_color(fg, 0.52), None)
    draw_polygon(d, [(128, 51), (128, 194), (96, 145), (88, 70)], multiply_color(fg, 1.18), None)
    d.line((128, 58, 128, 190), fill=accent, width=5)
    d.arc((94, 70, 162, 158), 220, 320, fill=rgba("ffffff", 80), width=3)
    if "ancient" in item["id"].lower():
        d.ellipse((107, 91, 149, 133), outline=rgba("66fff0"), width=5)
        d.ellipse((121, 105, 135, 119), fill=rgba("eaffff"))
    elif "hylian" in item["id"].lower():
        d.polygon([(128, 75), (144, 114), (128, 102), (112, 114)], fill=rgba("d73d42"))
        d.polygon([(128, 111), (151, 144), (128, 133), (105, 144)], fill=rgba("f4d96e"))
    return paste_shape(base, layer, accent, blur=12)


def draw_bow(base, item):
    fg, dark, accent = palette(item)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    d.arc((56, 36, 174, 224), 278, 80, fill=multiply_color(dark, 0.45), width=19)
    d.arc((58, 34, 170, 220), 278, 80, fill=dark, width=14)
    d.arc((70, 45, 180, 212), 278, 80, fill=fg, width=8)
    d.arc((75, 50, 170, 205), 285, 72, fill=rgba("ffffff", 90), width=2)
    d.line((143, 54, 107, 204), fill=rgba("f3e8ce"), width=2)
    d.line((72, 145, 186, 112), fill=rgba("d8c28c"), width=5)
    d.polygon([(190, 111), (171, 101), (174, 122)], fill=accent)
    if "duplex" in item["id"].lower():
        d.arc((79, 40, 189, 218), 278, 80, fill=rgba("3c2d2a"), width=5)
    if item.get("element"):
        d.ellipse((92, 128, 122, 158), fill=fg, outline=rgba("ffffff", 120), width=2)
    return paste_shape(base, rotate_layer(layer, -14), fg, blur=10)


def draw_armor(base, item):
    fg, dark, accent = palette(item)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    lower = item.get("type") == "armor_lower"
    if lower:
        d.rounded_rectangle((91, 64, 125, 204), radius=11, fill=multiply_color(dark, 0.42))
        d.rounded_rectangle((145, 64, 179, 204), radius=11, fill=multiply_color(dark, 0.42))
        d.rounded_rectangle((84, 58, 118, 198), radius=11, fill=dark, outline=rgba("ffffff", 55), width=2)
        d.rounded_rectangle((138, 58, 172, 198), radius=11, fill=dark, outline=rgba("ffffff", 55), width=2)
        d.rounded_rectangle((88, 51, 168, 81), radius=9, fill=fg, outline=accent, width=2)
        d.line((126, 81, 116, 198), fill=accent, width=3)
        d.line((130, 81, 140, 198), fill=accent, width=3)
    else:
        d.polygon([(96, 80), (120, 58), (138, 83), (156, 58), (180, 80), (194, 190), (82, 190)], fill=multiply_color(dark, 0.42))
        d.polygon([(86, 67), (110, 45), (128, 72), (146, 45), (170, 67), (184, 183), (72, 183)], fill=dark, outline=accent)
        d.polygon([(98, 73), (118, 65), (128, 93), (138, 65), (158, 73), (166, 171), (90, 171)], fill=fg)
        d.polygon([(128, 93), (138, 65), (158, 73), (166, 171), (128, 171)], fill=multiply_color(fg, 0.58))
        d.line((128, 96, 128, 170), fill=accent, width=4)
        d.line((103, 96, 153, 96), fill=rgba("ffffff", 55), width=3)
    return paste_shape(base, layer, fg, blur=11)


def draw_gem(d, center, r, color, accent):
    x, y = center
    pts = [(x, y - r), (x + r, y - r // 3), (x + r * 2 // 3, y + r), (x, y + r * 4 // 3), (x - r * 2 // 3, y + r), (x - r, y - r // 3)]
    shadow = [(px + 9, py + 12) for px, py in pts]
    draw_polygon(d, shadow, multiply_color(color, 0.32, 145), None)
    draw_polygon(d, pts, color, rgba("ffffff", 150), 2)
    d.polygon([(x, y - r), (x + r, y - r // 3), (x, y - r // 5)], fill=multiply_color(accent, 1.18))
    d.polygon([(x + r, y - r // 3), (x + r * 2 // 3, y + r), (x, y + r * 4 // 3), (x, y - r // 5)], fill=multiply_color(color, 0.55))
    d.polygon([(x, y - r + 5), (x + r // 2, y - r // 5), (x, y + r // 2), (x - r // 2, y - r // 5)], fill=accent)


def draw_beveled_ellipse(d, box, fill, outline, depth=12):
    x0, y0, x1, y1 = box
    side = multiply_color(fill, 0.42, 215)
    d.ellipse((x0 + depth, y0 + depth, x1 + depth, y1 + depth), fill=side)
    d.ellipse(box, fill=fill, outline=outline, width=3)
    d.arc((x0 + 8, y0 + 8, x1 - 12, y1 - 12), 205, 330, fill=rgba("ffffff", 95), width=4)
    d.arc((x0 + depth, y0 + depth, x1 + depth, y1 + depth), 22, 142, fill=multiply_color(fill, 0.25, 125), width=5)


def draw_faceted_leaf(d, pts, fill, accent):
    cx = sum(p[0] for p in pts) // len(pts)
    cy = sum(p[1] for p in pts) // len(pts)
    side = [(x + 10, y + 12) for x, y in pts]
    draw_polygon(d, side, multiply_color(fill, 0.33, 150), None)
    draw_polygon(d, pts, fill, rgba("ffffff", 115), 2)
    right = [pts[1], pts[2], pts[3], (cx, cy)]
    left = [pts[0], (cx, cy), pts[4], pts[5]]
    d.polygon(right, fill=multiply_color(fill, 0.58))
    d.polygon(left, fill=multiply_color(fill, 1.16))
    d.line((pts[0][0], pts[0][1], pts[3][0], pts[3][1]), fill=accent, width=3)


def draw_material(base, item):
    fg, dark, accent = palette(item)
    item_id = item["id"].lower()
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    if any(k in item_id for k in ["ruby", "sapphire", "topaz", "opal", "amber", "stone", "core", "fragment", "rupee"]):
        draw_gem(d, (128, 120), 50, fg, accent)
        if "core" in item_id:
            d.ellipse((96, 88, 160, 152), outline=rgba("66fff0"), width=6)
            d.ellipse((117, 109, 139, 131), fill=rgba("eaffff"))
    elif "horn" in item_id:
        d.pieslice((78, 54, 194, 220), 210, 330, fill=multiply_color(fg, 0.38), outline=None)
        d.pieslice((70, 42, 184, 210), 210, 330, fill=fg, outline=accent, width=4)
        d.pieslice((95, 77, 163, 181), 210, 330, fill=rgba("171310", 255))
        d.arc((77, 50, 181, 201), 213, 314, fill=rgba("ffffff", 105), width=4)
    elif "fang" in item_id:
        pts = [(95, 56), (135, 206), (160, 58), (132, 98), (122, 98)]
        draw_polygon(d, [(x + 8, y + 11) for x, y in pts], rgba("5f5747", 125), None)
        draw_polygon(d, pts, rgba("eadfc8"), rgba("ffffff", 150), 2)
        d.polygon([(95, 56), (122, 98), (135, 206), (112, 104)], fill=rgba("fff7dd"))
        d.polygon([(160, 58), (135, 206), (132, 98)], fill=rgba("b8aa8b"))
    elif "guts" in item_id:
        draw_beveled_ellipse(d, (77, 78, 179, 171), rgba("8d2634"), rgba("ff8b8b"), depth=11)
        d.arc((92, 92, 164, 154), 25, 280, fill=rgba("ffd0bd", 110), width=5)
    elif "tail" in item_id or "fin" in item_id or "scale" in item_id:
        draw_faceted_leaf(d, [(69, 145), (137, 54), (188, 89), (170, 144), (145, 197), (105, 174)], fg, accent)
        for i in range(5):
            d.line((91 + i * 18, 141 - i * 14, 136 + i * 9, 174 - i * 11), fill=rgba("ffffff", 65), width=2)
    elif "gear" in item_id or "shaft" in item_id or "screw" in item_id or "spring" in item_id:
        d.ellipse((84, 84, 190, 190), fill=multiply_color(dark, 0.34, 180))
        d.ellipse((75, 75, 181, 181), fill=dark, outline=accent, width=6)
        for a in range(0, 360, 45):
            x = 128 + math.cos(math.radians(a)) * 63
            y = 128 + math.sin(math.radians(a)) * 63
            d.rounded_rectangle((x - 10, y - 10, x + 10, y + 10), radius=4, fill=dark, outline=accent, width=2)
        d.ellipse((106, 106, 150, 150), fill=rgba("0b2d2c"), outline=rgba("66fff0"), width=4)
        d.arc((87, 82, 165, 165), 210, 325, fill=rgba("ffffff", 70), width=4)
    elif "jelly" in item_id:
        draw_beveled_ellipse(d, (72, 73, 184, 188), fg[:3] + (210,), rgba("ffffff", 120), depth=10)
        d.ellipse((98, 92, 132, 126), fill=rgba("ffffff", 70))
    elif "wood" in item_id:
        for off in (0, 28, 56):
            x = 70 + off
            y = 92 - off // 4
            d.rounded_rectangle((x + 8, y + 9, x + 42, y + 101), radius=10, fill=rgba("3c2517", 170))
            d.rounded_rectangle((x, y, x + 32, y + 92), radius=10, fill=rgba("8c5a33"), outline=rgba("e0b476"), width=2)
            d.ellipse((x - 3, y - 4, x + 35, y + 27), fill=rgba("b57b45"), outline=rgba("eac48a"), width=2)
            d.arc((x + 5, y + 3, x + 27, y + 22), 180, 540, fill=rgba("5a321e"), width=2)
    elif "eyeball" in item_id:
        draw_beveled_ellipse(d, (66, 76, 190, 180), rgba("eadfd2"), rgba("ffb68a"), depth=10)
        d.ellipse((100, 92, 156, 164), fill=fg, outline=rgba("271616"), width=4)
        d.ellipse((119, 114, 139, 140), fill=rgba("0d0a08"))
    elif "hoof" in item_id:
        d.rounded_rectangle((94, 73, 182, 194), radius=38, fill=multiply_color(dark, 0.36, 165))
        d.rounded_rectangle((84, 63, 172, 184), radius=38, fill=dark, outline=accent, width=4)
        d.line((128, 93, 128, 184), fill=rgba("1a120d"), width=6)
    else:
        draw_gem(d, (128, 124), 44, fg, accent)
    return paste_shape(base, layer, fg, blur=11)


def draw_food(base, item):
    fg, dark, accent = palette(item)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    item_id = item["id"].lower()
    if "apple" in item_id:
        apple = rgba("d84235") if "hearty" not in item_id else rgba("63c566")
        draw_beveled_ellipse(d, (75, 73, 181, 188), apple, rgba("ffd0b8"), depth=10)
        d.pieslice((103, 71, 185, 188), 275, 90, fill=multiply_color(apple, 0.62, 210))
        d.ellipse((95, 90, 126, 121), fill=rgba("ffffff", 70))
        d.line((128, 74, 139, 49), fill=rgba("624025"), width=7)
        d.ellipse((139, 49, 169, 70), fill=rgba("75c45e"))
    elif "mushroom" in item_id or "shroom" in item_id:
        cap = rgba("d1a052") if "stam" not in item_id else rgba("e6d75a")
        d.pieslice((70, 68, 204, 188), 180, 360, fill=multiply_color(cap, 0.42, 180))
        d.pieslice((61, 58, 195, 178), 180, 360, fill=cap, outline=rgba("fff2c0"), width=3)
        d.arc((73, 71, 181, 157), 205, 330, fill=rgba("ffffff", 90), width=4)
        d.rounded_rectangle((107, 117, 149, 199), radius=18, fill=rgba("e8d2ae"), outline=rgba("ffffff", 80), width=2)
        d.rounded_rectangle((128, 124, 154, 201), radius=14, fill=rgba("9e825f", 135))
        d.ellipse((90, 86, 112, 104), fill=rgba("ffffff", 90))
    elif "meat" in item_id or "roasted" in item_id:
        draw_beveled_ellipse(d, (73, 80, 181, 171), rgba("b9452f"), rgba("ffbd74"), depth=12)
        d.ellipse((105, 102, 149, 149), fill=rgba("f4cda1"))
        d.arc((86, 88, 166, 157), 205, 330, fill=rgba("fff0c0", 100), width=3)
        if "raw" in item_id:
            d.arc((70, 70, 190, 190), 200, 320, fill=rgba("ffffff", 85), width=4)
    elif "fish" in item_id or "bass" in item_id or "seafood" in item_id:
        d.ellipse((79, 101, 184, 170), fill=rgba("1d4f5d", 165))
        d.ellipse((69, 91, 174, 160), fill=rgba("63b7c8"), outline=rgba("dffbff"), width=3)
        d.pieslice((102, 92, 173, 160), 270, 90, fill=rgba("317d92", 210))
        d.polygon([(174, 126), (211, 95), (210, 157)], fill=rgba("38869f"), outline=rgba("dffbff"))
        d.polygon([(183, 130), (214, 116), (210, 157)], fill=rgba("1f566b"))
        d.ellipse((93, 111, 105, 123), fill=rgba("121a20"))
    elif "elixir" in item_id:
        d.rounded_rectangle((103, 79, 175, 201), radius=22, fill=multiply_color(dark, 0.38, 175))
        d.rounded_rectangle((92, 68, 164, 190), radius=22, fill=dark, outline=accent, width=4)
        d.pieslice((116, 75, 164, 189), 275, 90, fill=multiply_color(dark, 0.58, 210))
        d.rectangle((105, 50, 151, 76), fill=rgba("c7b27a"), outline=accent)
        d.ellipse((108, 104, 148, 154), fill=fg[:3] + (190,), outline=rgba("ffffff", 110), width=2)
        d.ellipse((118, 111, 136, 129), fill=rgba("ffffff", 80))
    elif "skewer" in item_id or "dish" in item_id:
        d.line((68, 190, 190, 61), fill=rgba("d7b57b"), width=7)
        colors = [fg, rgba("b9452f"), rgba("e0c25a"), rgba("6fc76a")]
        for i, c in enumerate(colors):
            x = 91 + i * 25
            y = 160 - i * 25
            d.rounded_rectangle((x - 10, y - 8, x + 26, y + 24), radius=10, fill=multiply_color(c, 0.36, 160))
            d.rounded_rectangle((x - 18, y - 16, x + 18, y + 16), radius=10, fill=c, outline=rgba("fff0c0"), width=2)
    elif "egg" in item_id:
        draw_beveled_ellipse(d, (84, 57, 172, 198), rgba("f2e7c8"), rgba("ffffff", 130), depth=10)
        d.pieslice((108, 66, 176, 196), 275, 90, fill=rgba("b9ac8d", 100))
    else:
        draw_beveled_ellipse(d, (75, 75, 181, 181), fg, accent, depth=10)
    return paste_shape(base, layer, fg, blur=10)


def draw_key(base, item):
    fg, dark, accent = palette(item)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    item_id = item["id"].lower()
    if "heart" in item_id:
        pts = [(128, 199), (74, 140), (66, 93), (94, 65), (128, 93), (162, 65), (190, 93), (182, 140)]
        draw_polygon(d, [(x + 8, y + 10) for x, y in pts], rgba("5b1018", 145), None)
        draw_polygon(d, pts, rgba("e94450"), rgba("ffd0d0"), 3)
        d.polygon([(128, 199), (128, 93), (162, 65), (190, 93), (182, 140)], fill=rgba("a91f32", 185))
        d.ellipse((88, 86, 123, 119), fill=rgba("ffffff", 70))
    elif "stamina" in item_id:
        d.ellipse((70, 70, 186, 186), outline=rgba("9cff6d"), width=12)
        pts = [(128, 44), (143, 103), (204, 104), (154, 136), (171, 196), (128, 159), (85, 196), (102, 136), (52, 104), (113, 103)]
        draw_polygon(d, [(x + 8, y + 10) for x, y in pts], rgba("254711", 140), None)
        draw_polygon(d, pts, rgba("d9ff76"), rgba("ffffff"), 2)
        d.polygon([(128, 44), (143, 103), (204, 104), (154, 136), (128, 159)], fill=rgba("88c83b", 175))
    elif "slate" in item_id:
        d.rounded_rectangle((87, 58, 191, 218), radius=18, fill=rgba("08161c", 170))
        d.rounded_rectangle((76, 47, 180, 207), radius=18, fill=rgba("233b48"), outline=rgba("66fff0"), width=4)
        d.pieslice((108, 52, 180, 205), 275, 90, fill=rgba("0d2029", 175))
        d.ellipse((103, 82, 153, 132), outline=rgba("66fff0"), width=5)
        d.line((91, 165, 165, 165), fill=rgba("66fff0"), width=4)
    elif "key" in item_id:
        d.ellipse((78, 88, 138, 148), outline=rgba("6b552a", 170), width=10)
        d.line((134, 134, 201, 201), fill=rgba("6b552a", 170), width=12)
        d.ellipse((70, 80, 130, 140), outline=accent, width=10)
        d.line((126, 126, 193, 193), fill=accent, width=12)
        d.line((166, 166, 190, 147), fill=accent, width=8)
        d.line((178, 178, 202, 159), fill=accent, width=8)
    else:
        draw_gem(d, (128, 122), 52, fg, accent)
    return paste_shape(base, layer, fg, blur=12)


def make_icon(item):
    base = canvas()
    t = item.get("type", "")
    if t == "weapon":
        draw_weapon(base, item)
    elif t == "shield":
        draw_shield(base, item)
    elif t == "bow":
        draw_bow(base, item)
    elif t.startswith("armor"):
        draw_armor(base, item)
    elif t == "food":
        draw_food(base, item)
    elif t == "material":
        draw_material(base, item)
    elif t == "key":
        draw_key(base, item)
    else:
        draw_material(base, item)
    # Soft final contrast and crisp small-icon edge.
    base = base.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3))
    return base


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    items = parse_items()
    for stale in OUT_DIR.glob("*.png"):
        if stale.stem not in items:
            stale.unlink()
    for item_id, item in items.items():
        make_icon(item).save(OUT_DIR / f"{item_id}.png")
    print(f"generated {len(items)} item icons into {OUT_DIR}")


if __name__ == "__main__":
    main()
