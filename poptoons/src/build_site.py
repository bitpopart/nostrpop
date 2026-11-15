"""Build the POPtoons site (poptoons.fun) and the POPtoons data for popart.love.

The content lives in data.py and the drawings in img/<character key>.png.

    python3 build_site.py

writes
  ../index.html                                  the whole site, one self-contained file
  ../../POPARTlove/data/poptoons.json            collection list used by POPARTlove/build.py
  ../../POPARTlove/assets/img/poptoons/*.webp    collection pictures for popart.love

Afterwards run POPARTlove/build.py so popart.love picks up the changes.
Needs: pillow, fonttools, brotli (pip install pillow fonttools brotli).
"""
import shutil
import base64, io, json, os, subprocess, tempfile
from PIL import Image
import data

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
POPART = os.path.join(os.path.dirname(SITE), 'POPARTlove')
GLYPHS = 'U+0020-007E,U+00A0-00FF,U+2018-201D,U+2022,U+2026,U+2039-203A'


def font_face(family, file, weight=400, style='normal'):
    """Subset a font to Latin and return an @font-face rule with the font embedded."""
    out = os.path.join(tempfile.gettempdir(), file.replace('.ttf', '.woff2'))
    subprocess.run(['pyftsubset', os.path.join(HERE, 'fonts', file), '--unicodes=' + GLYPHS, '--flavor=woff2',
                    '--layout-features=kern,liga', '--output-file=' + out],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    b64 = base64.b64encode(open(out, 'rb').read()).decode()
    return ("@font-face{font-family:'%s';font-weight:%d;font-style:%s;font-display:swap;"
            "src:url(data:font/woff2;base64,%s) format('woff2')}" % (family, weight, style, b64))


def drawing(key, size):
    """The character drawing on white, scaled so its longest side is `size`."""
    im = Image.open(os.path.join(HERE, 'img', key + '.png')).convert('RGB')
    k = size / max(im.size)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def image_uri(key, size=420):
    buf = io.BytesIO()
    drawing(key, size).quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()


def members(coll_key):
    return [c for c in data.CHARACTERS if c['collection'] == coll_key]


def make_og():
    """1200x630 share picture (poptoons/og.png) used for link previews."""
    from PIL import ImageDraw
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), (255, 212, 34)); d = ImageDraw.Draw(im)
    for y in range(14, H, 30):
        for x in range(14 + (15 if (y // 30) % 2 else 0), W, 30):
            d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(244, 190, 20))
    logo = Image.open(os.path.join(HERE, 'img', 'logo-white.png')).convert('RGBA')
    lw = 760; logo = logo.resize((lw, round(lw * logo.height / logo.width)), Image.LANCZOS)
    im.paste(logo, ((W - lw) // 2, 70), logo)
    picks = ['lilmoo', 'bun', 'lumo', 'uno', 'bo', 'plop', 'hiya']
    tw, gap = 140, 22; x0 = (W - (len(picks) * tw + (len(picks) - 1) * gap)) // 2; y0 = 330
    for i, k in enumerate(picks):
        x = x0 + i * (tw + gap)
        d.rounded_rectangle((x + 6, y0 + 6, x + tw + 6, y0 + tw + 6), radius=22, fill=(17, 17, 17))
        d.rounded_rectangle((x, y0, x + tw, y0 + tw), radius=22, fill='white', outline=(17, 17, 17), width=4)
        c = Image.open(os.path.join(HERE, 'img', k + '.png')).convert('RGB'); c.thumbnail((tw - 24, tw - 24), Image.LANCZOS)
        im.paste(c, (x + (tw - c.width) // 2, y0 + (tw - c.height) // 2))
    from PIL import ImageFont
    f = ImageFont.truetype(os.path.join(HERE, 'fonts', 'Poppins-Bold.ttf'), 34)
    t = 'Characters with a story  ·  poptoons.fun'
    tb = d.textbbox((0, 0), t, font=f); d.text(((W - tb[2]) // 2, 520), t, font=f, fill=(17, 17, 17))
    im.save(os.path.join(HERE, '..', 'og.png'), optimize=True)


def build_site():
    make_og()
    shutil.copy(os.path.join(HERE, 'img', 'logo.svg'), os.path.join(HERE, '..', 'logo.svg'))
    shutil.copy(os.path.join(HERE, 'img', 'logo-white.svg'), os.path.join(HERE, '..', 'logo-white.svg'))
    fonts = '\n'.join([
        font_face('Lilita One', 'LilitaOne-Regular.ttf'),
        font_face('Poppins', 'Poppins-Regular.ttf', 400),
        font_face('Poppins', 'Poppins-Medium.ttf', 500),
        font_face('Poppins', 'Poppins-Medium.ttf', 600),
        font_face('Poppins', 'Poppins-Bold.ttf', 700),
        font_face('Poppins', 'Poppins-Italic.ttf', 400, 'italic'),
    ])
    keep = ('key', 'no', 'name', 'kind', 'role', 'collection', 'color', 'sound', 'story', 'facts', 'series', 'tribe', 'tier')
    # POPART cards attached to a toon: data/cards.json entries with "toon": "<character key>"
    cards_by_toon = {}
    cj = os.path.join(POPART, 'data', 'cards.json')
    for card in (json.load(open(cj, encoding='utf-8')) if os.path.exists(cj) else []):
        t = card.get('toon')
        src = os.path.join(POPART, 'assets', 'img', 'cards', card['file'] + '.webp')
        if t and os.path.exists(src):
            im = Image.open(src).convert('RGB')
            im.thumbnail((240, 336), Image.LANCZOS)
            buf = io.BytesIO(); im.save(buf, 'WEBP', quality=80)
            cards_by_toon.setdefault(t, []).append({
                'file': card['file'], 'name': card['name'], 'tier': card['rarity'], 'series': card['series'],
                'img': 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()})
    variations = {c['key']: [{'name': n, 'img': image_uri(f, 560)} for n, f in c['variations']]
                  for c in data.CHARACTERS if c.get('variations')}
    payload = {
        'variations': variations,
        'cards': cards_by_toon,
        'collections': [{k: c[k] for k in ('key', 'no', 'name', 'color', 'tagline', 'intro', 'notes')} for c in data.COLLECTIONS],
        'characters': [{k: c[k] for k in keep} for c in data.CHARACTERS],
        'images': {c['key']: image_uri(c['key']) for c in data.CHARACTERS},
    }
    html = open(os.path.join(HERE, 'site_template.html'), encoding='utf-8').read()
    html = html.replace('/*LOGO_WHITE*/', open(os.path.join(HERE, 'img', 'logo-white.inline.svg'), encoding='utf-8').read()).replace('/*LOGO*/', open(os.path.join(HERE, 'img', 'logo.inline.svg'), encoding='utf-8').read()).replace('/*FONTS*/', fonts).replace('/*DATA*/', json.dumps(payload, ensure_ascii=False).replace('</', '<\\/'))
    out = os.path.join(SITE, 'index.html')
    open(out, 'w', encoding='utf-8').write(html)
    print('wrote', os.path.relpath(out, os.path.dirname(SITE)), round(os.path.getsize(out) / 1024), 'KB')


def group_picture(keys, size=800):
    """Up to four characters of a collection on one white square."""
    keys = keys[:4]
    canvas = Image.new('RGB', (size, size), 'white')
    cell = size // 2
    spots = {1: [(size // 4, size // 4)], 2: [(0, size // 4), (cell, size // 4)],
             3: [(0, 0), (cell, 0), (size // 4, cell)], 4: [(0, 0), (cell, 0), (0, cell), (cell, cell)]}[len(keys)]
    for key, (x, y) in zip(keys, spots):
        im = drawing(key, cell - 70)
        canvas.paste(im, (x + (cell - im.width) // 2, y + (cell - im.height) // 2))
    return canvas


def thumb_picture(key, w=256, h=360):
    """One character on a white portrait tile, for the small collection tiles."""
    canvas = Image.new('RGB', (w, h), 'white')
    im = drawing(key, w - 36)
    canvas.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
    return canvas


def build_popart():
    if not os.path.isdir(POPART):
        print('POPARTlove folder not found, skipped the popart.love export')
        return
    img_dir = os.path.join(POPART, 'assets', 'img', 'poptoons')
    os.makedirs(img_dir, exist_ok=True)
    rows = []
    for k in data.COLLECTIONS:
        mem = members(k['key'])
        group_picture([c['key'] for c in mem]).save(os.path.join(img_dir, k['key'] + '.webp'), 'WEBP', quality=84, method=6)
        thumb_picture(mem[0]['key']).save(os.path.join(img_dir, k['key'] + '-thumb.webp'), 'WEBP', quality=84, method=6)
        rows.append({'key': k['key'], 'no': k['no'], 'name': k['name'], 'tagline': k['tagline'],
                     'count': len(mem), 'characters': [c['name'] for c in mem]})
    shutil.copy(os.path.join(HERE, 'img', 'logo.svg'), os.path.join(img_dir, 'logo.svg'))
    out = os.path.join(POPART, 'data', 'poptoons.json')
    json.dump({'site': 'https://poptoons.fun', 'characters': len(data.CHARACTERS), 'toons': {c['key']: c['name'] for c in data.CHARACTERS}, 'collections': rows},
              open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(out, 'a').write('\n')
    print('wrote POPARTlove/data/poptoons.json and', len(rows) * 2, 'pictures')


if __name__ == '__main__':
    build_site()
    build_popart()
