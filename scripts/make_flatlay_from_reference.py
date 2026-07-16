from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps


OUT = Path(r"E:\my_web\output\imagegen\tzq_flatlay_style.png")


def add_shadow(canvas, mask, offset=(18, 24), blur=22, opacity=120):
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    m = Image.new("L", canvas.size, 0)
    m.paste(mask, offset)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    shadow.putalpha(Image.eval(m, lambda a: int(a * opacity / 255)))
    canvas.alpha_composite(shadow)


def textured_fill(size, base, mask, grain=18, vertical=False):
    w, h = size
    rng = np.random.default_rng(7)
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    noise = rng.normal(0, grain, (h, w, 1))
    if vertical:
        stripe = (np.sin(np.linspace(0, 44, h))[:, None, None] * 5)
    else:
        stripe = (np.sin(np.linspace(0, 20, w))[None, :, None] * 4)
    rgb = np.clip(np.array(base, dtype=np.float32) + noise + stripe, 0, 255)
    arr[:, :, :3] = rgb
    arr[:, :, 3] = np.array(mask)
    return Image.fromarray(arr, "RGBA")


def wood_background(w=1024, h=1280):
    rng = np.random.default_rng(10)
    bg = Image.new("RGBA", (w, h), (58, 34, 23, 255))
    draw = ImageDraw.Draw(bg)
    x = 0
    while x < w:
        plank_w = int(rng.integers(68, 118))
        base = np.array([rng.integers(55, 90), rng.integers(32, 52), rng.integers(20, 32)])
        plank = np.zeros((h, plank_w, 4), dtype=np.uint8)
        grain = rng.normal(0, 9, (h, plank_w, 1))
        long = np.sin(np.linspace(0, rng.uniform(32, 55), h))[:, None, None] * rng.uniform(4, 8)
        thin = np.sin(np.linspace(0, rng.uniform(70, 130), plank_w))[None, :, None] * rng.uniform(2, 5)
        rgb = np.clip(base + grain + long + thin, 0, 255)
        plank[:, :, :3] = rgb
        plank[:, :, 3] = 255
        bg.alpha_composite(Image.fromarray(plank, "RGBA"), (x, 0))
        draw.line([(x, 0), (x, h)], fill=(22, 14, 10, 180), width=3)
        draw.line([(x + 4, 0), (x + 4, h)], fill=(116, 77, 52, 45), width=1)
        y = int(rng.integers(230, 350))
        while y < h:
            draw.line([(x, y), (min(x + plank_w, w), y)], fill=(31, 19, 13, 150), width=2)
            draw.line([(x, y + 3), (min(x + plank_w, w), y + 3)], fill=(116, 76, 48, 38), width=1)
            y += int(rng.integers(270, 430))
        for gx in range(x + 12, min(x + plank_w, w), 10):
            shade = int(rng.integers(28, 65))
            draw.line([(gx, 0), (gx + rng.integers(-4, 4), h)], fill=(shade, 25, 17, 42), width=1)
        x += plank_w
    vignette = Image.new("L", (w, h), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-260, -210, w + 260, h + 210), fill=255)
    vignette = ImageOps.invert(vignette.filter(ImageFilter.GaussianBlur(35)))
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    overlay.putalpha(Image.eval(vignette, lambda a: int(a * 0.18)))
    bg.alpha_composite(overlay)
    return bg


def paste_masked(canvas, layer, mask):
    canvas.alpha_composite(layer)
    return mask


def draw_shirt(canvas):
    mask = Image.new("L", canvas.size, 0)
    d = ImageDraw.Draw(mask)
    shirt = [
        (260, 168), (420, 168), (472, 248), (548, 282), (513, 410),
        (454, 388), (470, 560), (212, 560), (226, 388), (166, 410),
        (132, 282), (208, 248),
    ]
    d.polygon(shirt, fill=255)
    d.rounded_rectangle((220, 168, 462, 562), radius=34, fill=255)
    add_shadow(canvas, mask, (16, 24), 20, 95)
    layer = textured_fill(canvas.size, (82, 184, 211), mask, grain=9)
    canvas.alpha_composite(layer)
    draw = ImageDraw.Draw(canvas)
    draw.arc((272, 135, 410, 256), 10, 170, fill=(36, 126, 153, 230), width=14)
    draw.arc((286, 150, 396, 244), 20, 160, fill=(32, 112, 138, 170), width=5)
    draw.line([(252, 183), (214, 250), (167, 282)], fill=(47, 143, 170, 135), width=3)
    draw.line([(428, 183), (466, 250), (514, 282)], fill=(47, 143, 170, 135), width=3)
    draw.line([(248, 360), (228, 552)], fill=(50, 145, 170, 85), width=2)
    draw.line([(432, 360), (452, 552)], fill=(50, 145, 170, 85), width=2)

    logo = Image.new("RGBA", (140, 90), (0, 0, 0, 0))
    ld = ImageDraw.Draw(logo)
    ld.ellipse((26, 28, 86, 66), fill=(225, 50, 35, 255))
    ld.ellipse((55, 20, 118, 68), fill=(214, 67, 41, 255))
    ld.polygon([(65, 29), (79, 14), (91, 34)], fill=(73, 120, 52, 255))
    ld.arc((22, 28, 87, 68), 190, 330, fill=(170, 29, 28, 200), width=3)
    ld.arc((54, 19, 120, 70), 205, 345, fill=(166, 38, 31, 190), width=3)
    ld.ellipse((44, 34, 58, 43), fill=(255, 128, 93, 145))
    ld.ellipse((80, 30, 96, 40), fill=(255, 134, 92, 130))
    logo = logo.filter(ImageFilter.GaussianBlur(0.25))
    canvas.alpha_composite(logo, (274, 286))

    highlight = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
    hd = ImageDraw.Draw(highlight)
    hd.line([(246, 205), (236, 528)], fill=(255, 255, 255, 22), width=3)
    hd.line([(431, 206), (450, 528)], fill=(255, 255, 255, 18), width=3)
    canvas.alpha_composite(highlight)


def draw_skirt(canvas):
    mask = Image.new("L", canvas.size, 0)
    d = ImageDraw.Draw(mask)
    skirt = [(204, 555), (472, 555), (527, 782), (148, 782)]
    d.polygon(skirt, fill=255)
    add_shadow(canvas, mask, (18, 20), 22, 105)
    canvas.alpha_composite(textured_fill(canvas.size, (126, 128, 91), mask, grain=10, vertical=True))
    draw = ImageDraw.Draw(canvas)
    draw.line([(200, 558), (474, 558)], fill=(92, 92, 63, 210), width=13)
    draw.line([(214, 582), (175, 760)], fill=(82, 84, 60, 145), width=3)
    draw.line([(462, 582), (500, 760)], fill=(82, 84, 60, 145), width=3)
    draw.line([(337, 560), (337, 781)], fill=(92, 92, 62, 95), width=2)
    draw.arc((218, 590, 314, 694), 190, 312, fill=(83, 84, 61, 145), width=3)
    draw.arc((360, 590, 456, 694), 228, 350, fill=(83, 84, 61, 145), width=3)
    draw.line([(323, 566), (300, 638), (321, 682)], fill=(204, 201, 154, 190), width=3)
    draw.line([(351, 566), (378, 637), (357, 682)], fill=(204, 201, 154, 190), width=3)
    draw.ellipse((294, 631, 306, 642), fill=(96, 89, 62, 255))
    draw.ellipse((373, 630, 385, 641), fill=(96, 89, 62, 255))
    for y in (615, 704, 776):
        draw.line([(168, y), (508, y - 4)], fill=(96, 98, 70, 75), width=2)


def draw_cap(canvas):
    mask = Image.new("L", canvas.size, 0)
    d = ImageDraw.Draw(mask)
    d.ellipse((708, 78, 926, 212), fill=255)
    d.pieslice((704, 132, 930, 292), 188, 352, fill=255)
    add_shadow(canvas, mask, (12, 18), 18, 90)
    layer = textured_fill(canvas.size, (235, 236, 235), mask, grain=6)
    canvas.alpha_composite(layer)
    draw = ImageDraw.Draw(canvas)
    draw.arc((718, 80, 916, 216), 190, 350, fill=(210, 211, 211, 210), width=4)
    draw.arc((755, 88, 876, 216), 190, 350, fill=(202, 203, 203, 160), width=2)
    draw.line([(816, 86), (816, 206)], fill=(204, 205, 205, 120), width=2)
    draw.arc((776, 150, 858, 194), 12, 164, fill=(15, 15, 15, 230), width=5)


def draw_bag(canvas):
    mask = Image.new("L", canvas.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((650, 390, 852, 740), radius=42, fill=255)
    d.line([(708, 388), (690, 248), (816, 248), (796, 388)], fill=255, width=26)
    add_shadow(canvas, mask, (18, 22), 24, 120)
    layer = textured_fill(canvas.size, (18, 20, 20), mask, grain=8, vertical=True)
    canvas.alpha_composite(layer)
    draw = ImageDraw.Draw(canvas)
    draw.line([(700, 256), (714, 384)], fill=(4, 5, 5, 255), width=14)
    draw.line([(806, 256), (790, 384)], fill=(4, 5, 5, 255), width=14)
    draw.arc((690, 226, 818, 384), 180, 360, fill=(70, 72, 72, 190), width=4)
    draw.rounded_rectangle((670, 408, 832, 724), radius=30, outline=(61, 65, 64, 210), width=4)
    draw.line([(704, 464), (817, 448)], fill=(94, 96, 93, 130), width=3)
    draw.line([(680, 693), (830, 706)], fill=(73, 75, 72, 100), width=2)
    draw.text((760, 624), "good", fill=(228, 228, 220, 140))
    draw.text((759, 647), "pop", fill=(228, 228, 220, 140))


def draw_sandal(canvas, center, angle=-22):
    shoe = Image.new("RGBA", (220, 310), (0, 0, 0, 0))
    mask = Image.new("L", shoe.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((54, 34, 155, 258), radius=42, fill=255)
    d.rounded_rectangle((44, 34, 165, 112), radius=22, fill=255)
    add = Image.new("RGBA", shoe.size, (0, 0, 0, 0))
    add.alpha_composite(textured_fill(shoe.size, (14, 15, 15), mask, grain=8))
    sd = ImageDraw.Draw(add)
    sd.rounded_rectangle((50, 35, 160, 110), radius=22, outline=(70, 72, 72, 185), width=4)
    sd.rounded_rectangle((76, 118, 136, 236), radius=30, fill=(7, 8, 8, 255))
    sd.line([(43, 64), (168, 91)], fill=(78, 80, 80, 230), width=10)
    sd.line([(67, 126), (151, 160)], fill=(76, 78, 78, 230), width=9)
    sd.line([(96, 239), (136, 239)], fill=(100, 103, 102, 165), width=3)
    shoe = add.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    sm = shoe.split()[-1]
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    pos = (int(center[0] - shoe.width / 2) + 15, int(center[1] - shoe.height / 2) + 20)
    sh = Image.new("L", canvas.size, 0)
    sh.paste(sm, pos)
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    shadow.putalpha(Image.eval(sh, lambda a: int(a * 0.45)))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(shoe, (int(center[0] - shoe.width / 2), int(center[1] - shoe.height / 2)))


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas = wood_background()
    draw_cap(canvas)
    draw_bag(canvas)
    draw_shirt(canvas)
    draw_skirt(canvas)
    draw_sandal(canvas, (710, 900), -24)
    draw_sandal(canvas, (845, 1010), 24)
    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.1, percent=85, threshold=3))
    canvas.convert("RGB").save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
