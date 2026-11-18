"""One white T-shirt per POPtoon: the toon and its quote printed on the chest.
Writes img/<key>-tee.png (used by build_site.py) and ../../POPARTlove/assets/img/tees/<key>.webp (used by popart.love/shop)."""
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import data

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_SHOP = os.path.join(HERE, '..', '..', 'POPARTlove', 'assets', 'img', 'tees')
S = 2            # supersampling
W = 600
INK = (17, 17, 17)


def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def tint(rgb, k):
    return tuple(round(c + (255 - c) * k) for c in rgb)


def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=font) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines


def tee(c):
    bg = hexrgb(c['color'])
    im = Image.new('RGB', (W * S, W * S), tint(bg, .35))
    d = ImageDraw.Draw(im)
    # halftone dots
    for y in range(0, W, 26):
        for x in range(13 + (13 if (y // 26) % 2 else 0), W, 26):
            d.ellipse(((x - 3) * S, (y - 3) * S, (x + 3) * S, (y + 3) * S), fill=tint(bg, .12))
    P = [(188, 100), (232, 90), (368, 90), (412, 100), (476, 124), (552, 196), (500, 282), (438, 246),
         (436, 548), (164, 548), (162, 246), (100, 282), (48, 196), (124, 124)]
    sc = lambda pts, dx=0, dy=0: [((x + dx) * S, (y + dy) * S) for x, y in pts]
    # hard pop-art shadow
    d.polygon(sc(P, 10, 10), fill=INK)
    d.line(sc(P + [P[0]], 10, 10), fill=INK, width=14 * S, joint='curve')
    # shirt
    d.polygon(sc(P), fill=(255, 255, 255))
    # soft fabric shading on the sleeves
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.polygon(sc([(124, 124), (48, 196), (100, 282), (162, 246)]), fill=(0, 0, 0, 16))
    sd.polygon(sc([(476, 124), (552, 196), (500, 282), (438, 246)]), fill=(0, 0, 0, 16))
    im = Image.alpha_composite(im.convert('RGBA'), sh.filter(ImageFilter.GaussianBlur(4 * S))).convert('RGB')
    d = ImageDraw.Draw(im)
    d.line(sc(P + [P[0]]), fill=INK, width=7 * S, joint='curve')
    # sleeve seams
    d.line(sc([(162, 246), (124, 124)]), fill=INK, width=4 * S)
    d.line(sc([(438, 246), (476, 124)]), fill=INK, width=4 * S)
    # collar: the neck opening, seen from the front
    d.pieslice((232 * S, 50 * S, 368 * S, 138 * S), 0, 180, fill=(226, 226, 226), outline=INK, width=6 * S)
    d.arc((243 * S, 58 * S, 357 * S, 126 * S), 10, 170, fill=INK, width=3 * S)
    # the quote in a pop art balloon, a bit above the toon
    font_for = lambda n: ImageFont.truetype(os.path.join(HERE, 'fonts', 'LilitaOne-Regular.ttf'), n * S)
    q = c['quote']
    for size in (20, 18, 16, 15, 14):
        font = font_for(size)
        lines = wrap(d, q, font, 214 * S)
        if len(lines) * size * 1.1 <= 66: break
    lh = round(size * 1.1 * S)
    th = lh * len(lines)
    bx0, bx1, by0 = 184 * S, 416 * S, 152 * S
    by1 = by0 + th + 24 * S
    tail = [(bx0 + 50 * S, by1 - 8 * S), (bx0 + 96 * S, by1 - 8 * S), (bx0 + 62 * S, by1 + 30 * S)]
    # the toon first, so the balloon can sit a bit over it
    art = Image.open(os.path.join(HERE, 'img', c['key'] + '.png')).convert('RGB')
    top = by1 // S - 18
    art.thumbnail((272 * S, (548 - 10 - top) * S), Image.LANCZOS)
    im.paste(art, (300 * S - art.width // 2, top * S + ((548 - 10 - top) * S - art.height) // 2))
    # the balloon is one shape (box + tail) with one continuous outline and a hard shadow
    import numpy as np
    from scipy import ndimage as ndi
    mk = Image.new('L', im.size, 0); md = ImageDraw.Draw(mk)
    md.rounded_rectangle((bx0, by0, bx1, by1), radius=26 * S, fill=255)
    md.polygon(tail, fill=255)
    inside = np.array(mk) > 127
    grown = ndi.distance_transform_edt(~inside) <= 5 * S
    shadow = np.roll(np.roll(grown, 6 * S, axis=0), 6 * S, axis=1)
    arr = np.array(im)
    arr[shadow] = INK
    arr[grown] = INK
    arr[inside] = (255, 255, 255)
    im = Image.fromarray(arr)
    d = ImageDraw.Draw(im)
    y = by0 + 12 * S
    for ln in lines:
        tw = d.textlength(ln, font=font)
        d.text(((bx0 + bx1) / 2 - tw / 2, y - 3 * S), ln, font=font, fill=INK)
        y += lh
    return im.resize((W, W), Image.LANCZOS)


def main(keys=None):
    os.makedirs(OUT_SHOP, exist_ok=True)
    for c in data.CHARACTERS:
        if keys and c['key'] not in keys: continue
        im = tee(c)
        im.save(os.path.join(HERE, 'img', c['key'] + '-tee.png'), optimize=True)
        im.save(os.path.join(OUT_SHOP, c['key'] + '.webp'), 'WEBP', quality=82)
    print('tees done')


if __name__ == '__main__':
    main(sys.argv[1:] or None)
