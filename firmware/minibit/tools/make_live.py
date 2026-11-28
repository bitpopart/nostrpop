"""Prepares everything the live (Wi-Fi) screens need.

* blanks the text that changes (price, temperature, time ...) in shots/btc|weather|clock.png (originals stay in tools/src)
* shrinks shots/menu.png to the fixed header; the scrolling menu list is a tall bitmap in the extras blob
* renders anti-aliased glyph atlases from the same fonts as the screen designs
* draws the weather icons
* writes extras.bin (appended to the screens blob by make_assets.py), menu_items.json and src/live_assets.h

Run from firmware/minibit/tools after make_wifi_screens.py:  python3 make_live.py
"""
import json, os, struct
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src'); SH = os.path.join(HERE, 'shots'); FD = os.path.join(HERE, 'fonts')
BG = (5, 6, 8); CARD = (17, 22, 31); WHITE = (220, 233, 255); GREY = (124, 139, 165)
GREEN = (91, 229, 132); RED = (255, 107, 90); ORANGE = (255, 150, 30); CYAN = (70, 230, 255)

def rgb565(c): return ((c[0] & 0xF8) << 8) | ((c[1] & 0xFC) << 3) | (c[2] >> 3)
def src(name): return Image.open(os.path.join(SRC, name + '.png')).convert('RGB')

# ---------------------------------------------------------------- measuring the original text
def measure(img, reg, bg):
    a = np.asarray(img).astype(int); x0, y0, x1, y1 = reg
    m = abs(a[y0:y1, x0:x1] - np.array(bg)).sum(axis=2) > 40
    ys, xs = np.where(m)
    return (x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1)

# ---------------------------------------------------------------- fonts
JBM4 = os.path.join(FD, 'jbm-400.ttf'); JBM5 = os.path.join(FD, 'jbm-500.ttf'); INTER = os.path.join(FD, 'inter.ttf')
ASCII = ''.join(chr(c) for c in range(32, 127))
LATIN = ASCII + ''.join(chr(c) for c in range(0xA0, 0x100)) + '€·°'
def mkfont(path, size, wght=None):
    f = ImageFont.truetype(path, size)
    if wght is not None: f.set_variation_by_axes([wght])
    return f
def ink(f, s):
    b = f.getbbox(s, anchor='ls'); return b  # (l, t, r, b) relative to pen/baseline

def fit(path, wght, sample, target_w):
    best = None
    for k in range(16, 400):
        sz = k / 2.0
        b = ink(mkfont(path, sz, wght), sample); w = b[2] - b[0]
        if best is None or abs(w - target_w) < best[0]: best = (abs(w - target_w), sz)
    return best[1]

# (id, path, wght, sample text, screen, region of the original ink, bg, charset)
FONTS = [
    ('PRICE', JBM5, None, '€84,210', 'btc', (20, 100, 340, 172), BG, '0123456789,.€- '),
    ('CHG', JBM5, None, '+1.8%', 'btc', (20, 186, 140, 214), BG, '0123456789+-.% '),
    ('CARD', JBM5, None, '912,345', 'btc', (30, 268, 200, 300), CARD, '0123456789,. satvB/-'),
    ('SMALL', JBM4, None, 'updated 2 min ago · mock data', 'btc', (20, 316, 330, 340), BG, LATIN),
    ('TEMP', INTER, 300, '11°', 'weather', (244, 70, 400, 155), BG, '0123456789-°'),
    ('COND', INTER, 400, 'light rain', 'weather', (244, 158, 400, 186), BG, LATIN),
    ('HILO', JBM4, None, '13° / 7°', 'weather', (244, 187, 400, 208), BG, '0123456789-°/ '),
    ('HOUR', JBM4, None, 'now', 'weather', (40, 246, 100, 262), CARD, 'now0123456789h'),
    ('HOURT', JBM5, None, '11°', 'weather', (40, 266, 100, 292), CARD, '0123456789-°'),
    ('ZBIG', JBM5, None, '2,100', 'zap', (140, 100, 440, 210), BG, '0123456789,'),
    ('ZAMT', JBM5, None, 56, None, None, None, '+0123456789, sat'),
    ('GMSG', INTER, 600, 26, None, None, None, LATIN),
    ('GSCORE', JBM5, None, 32, None, None, None, '0123456789'),
    ('TIME', INTER, 300, '23:41', 'clock', (40, 90, 420, 215), BG, '0123456789:-'),
    ('DATE', INTER, 400, 'Thursday 12 November', 'clock', (60, 218, 400, 252), BG, LATIN),
]
FN = {f[0]: i for i, f in enumerate(FONTS)}

# ---------------------------------------------------------------- fields (design coordinates, all even)
# (id, screen, x, y, w, h, bg)
FIELDS = [
    ('PRICE', 'btc', 24, 112, 376, 76, BG), ('CHG', 'btc', 24, 188, 120, 24, BG), ('SPARK', 'btc', 230, 190, 200, 36, BG),
    ('BLOCK', 'btc', 30, 268, 172, 32, CARD), ('FEES', 'btc', 246, 268, 172, 32, CARD), ('UPD', 'btc', 24, 318, 320, 24, BG),
    ('ICON', 'weather', 36, 72, 192, 128, BG), ('TEMP', 'weather', 250, 76, 190, 80, BG), ('COND', 'weather', 250, 160, 190, 26, BG),
    ('HILO', 'weather', 250, 188, 190, 20, BG), ('FOOT', 'weather', 34, 316, 330, 24, BG),
] + [('HL%d' % i, 'weather', 38 + 80 * i, 244, 62, 16, CARD) for i in range(5)] \
  + [('HT%d' % i, 'weather', 38 + 80 * i, 264, 62, 26, CARD) for i in range(5)] \
  + [('TIME', 'clock', 24, 100, 400, 110, BG), ('DATE', 'clock', 60, 218, 328, 34, BG)] \
  + [('NUM', 'zap', 140, 100, 300, 110, BG), ('TITLE', 'zapa', 24, 44, 400, 40, BG), ('AMT', 'zapa', 24, 262, 400, 64, BG), ('MSG', 'zapa', 24, 330, 400, 32, BG), ('LABEL', 'face', 140, 310, 168, 22, BG), ('MSG', 'game', 24, 52, 400, 40, BG), ('SC', 'game', 24, 278, 150, 58, BG), ('BE', 'game', 274, 278, 150, 58, BG)]
for f in FIELDS:
    assert all(v % 2 == 0 for v in f[2:6]), f

# originals -> tools/src once (shots/ gets the blanked versions)
for n in ('btc', 'weather', 'clock', 'menu', 'face', 'game', 'game2', 'zap'):
    if not os.path.exists(os.path.join(SRC, n + '.png')):
        Image.open(os.path.join(SH, n + '.png')).save(os.path.join(SRC, n + '.png'))

# ---------------------------------------------------------------- blank templates
for scr in ('btc', 'weather', 'clock'):
    im = src(scr); d = ImageDraw.Draw(im)
    if scr == 'btc': d.rectangle((20, 104, 440, 235), fill=BG)            # price, change and sparkline band
    for f in FIELDS:
        if f[1] == scr and f[0] not in ('PRICE', 'CHG', 'SPARK'): d.rectangle((f[2], f[3], f[2] + f[4] - 1, f[3] + f[5] - 1), fill=f[6])
    if scr == 'btc':   # keep the card labels: they sit above the value rows, outside the blanked rectangles
        pass
    im.save(os.path.join(SH, scr + '.png'))

for scr, box in (('zap', (140, 100, 440, 210)), ('face', (140, 310, 308, 332)), ('game', (0, 44, 448, 368)), ('game2', (0, 44, 448, 368))):
    im = src(scr); ImageDraw.Draw(im).rectangle(box, fill=BG); im.save(os.path.join(SH, scr + '.png'))
# ---------------------------------------------------------------- font atlases
atlas = bytearray()           # alpha bitmaps, 1 byte per pixel
glyph_rows = []               # per font list of (code, off, adv16, w, h, xo, yo)
font_meta = []                # per font: (ink-left offset, ink-top offset) of the sample to align with the original
for (fid, path, wght, sample, scr, reg, bg, chars) in FONTS:
    if reg is None:                      # fixed size font, positions are given when drawing
        size = sample; f = mkfont(path, size, wght); font_meta.append((0, 0, size, None))
    else:
        orig = measure(src(scr), reg, bg)
        tw = orig[2] - orig[0]
        size = fit(path, wght, sample, tw)
        f = mkfont(path, size, wght)
        b = ink(f, sample)
        font_meta.append((orig[0] - b[0], orig[1] - b[1], size, orig))   # pen x and baseline y that reproduce the original
    rows = []
    for ch in sorted(set(chars)):
        code = ord(ch)
        pad = 4; W = int(size * 1.6) + 2 * pad; H = int(size * 1.8) + 2 * pad
        im = Image.new('L', (W, H), 0); dd = ImageDraw.Draw(im)
        base = pad + int(size * 1.2)
        dd.text((pad, base), ch, font=f, fill=255, anchor='ls')
        bb = im.getbbox()
        adv = int(round(f.getlength(ch) * 16))
        if bb is None:
            rows.append((code, 0, adv, 0, 0, 0, 0)); continue
        crop = im.crop(bb); w, h = crop.size
        off = len(atlas); atlas += bytes(crop.tobytes())
        rows.append((code, off, adv, w, h, bb[0] - pad, bb[1] - base))
    glyph_rows.append(rows)
    print('font %-6s size %5.1f  %d glyphs' % (fid, size, len(rows)))

# ---------------------------------------------------------------- weather icons (192 x 128 on BG)
IW, IH = 192, 128
S4 = 4
def canvas(): return Image.new('RGB', (IW * S4, IH * S4), BG)
def circ(d, cx, cy, r, col): d.ellipse(((cx - r) * S4, (cy - r) * S4, (cx + r) * S4, (cy + r) * S4), fill=col)
def rrect(d, x0, y0, x1, y1, r, col): d.rounded_rectangle((x0 * S4, y0 * S4, x1 * S4, y1 * S4), radius=r * S4, fill=col)
def poly(d, pts, col): d.polygon([(x * S4, y * S4) for x, y in pts], fill=col)
SUN = (249, 233, 78); CL_B = (124, 139, 165); CL_F = (152, 166, 189); CL_D = (96, 108, 132); CL_DF = (118, 130, 154)
def cloud(d, dx=0, dy=0, back=CL_B, front=CL_F):
    circ(d, 92 + dx, 72 + dy, 42, back); circ(d, 130 + dx, 53 + dy, 36, front); rrect(d, 40 + dx, 78 + dy, 190 + dx, 122 + dy, 22, front)
def finish(im): return im.resize((IW, IH), Image.LANCZOS)
icons = []
im = canvas(); d = ImageDraw.Draw(im)                      # 0 clear day
circ(d, 96, 64, 34, SUN)
import math
for k in range(8):
    a = k * math.pi / 4; poly(d, [(96 + 44 * math.cos(a) - 4 * math.sin(a), 64 + 44 * math.sin(a) + 4 * math.cos(a)), (96 + 44 * math.cos(a) + 4 * math.sin(a), 64 + 44 * math.sin(a) - 4 * math.cos(a)), (96 + 58 * math.cos(a), 64 + 58 * math.sin(a))], SUN)
icons.append(finish(im))
im = canvas(); d = ImageDraw.Draw(im)                      # 1 clear night
circ(d, 96, 64, 40, (235, 228, 190)); circ(d, 116, 52, 36, BG)
icons.append(finish(im))
im = src('weather').crop((36, 72, 228, 200)); icons.append(im)   # 2 partly cloudy (the original artwork)
im = canvas(); d = ImageDraw.Draw(im); cloud(d, -6, -4); icons.append(finish(im))   # 3 cloud
im = canvas(); d = ImageDraw.Draw(im); cloud(d, -6, -14, CL_D, CL_DF)                # 4 rain
for x in (62, 98, 134):
    poly(d, [(x, 104), (x + 5, 104), (x - 3, 122), (x - 8, 122)], (80, 170, 255))
icons.append(finish(im))
im = canvas(); d = ImageDraw.Draw(im); cloud(d, -6, -14, CL_B, CL_F)                 # 5 snow
for x in (62, 98, 134):
    circ(d, x, 114, 6, (235, 244, 255))
icons.append(finish(im))
im = canvas(); d = ImageDraw.Draw(im); cloud(d, -6, -16, CL_D, CL_DF)                # 6 thunder
poly(d, [(104, 84), (82, 112), (98, 112), (90, 128), (120, 100), (103, 100), (112, 84)], SUN)
icons.append(finish(im))
im = canvas(); d = ImageDraw.Draw(im)                                                # 7 fog
for k, (x0, x1) in enumerate(((36, 156), (60, 180), (36, 156), (60, 180))):
    rrect(d, x0, 28 + k * 26, x1, 40 + k * 26, 6, CL_F if k % 2 == 0 else CL_B)
icons.append(finish(im))

def to_panel565(im):
    """448x368-style design image -> panel orientation (rotate -90), RGB565 little endian."""
    a = np.asarray(im.rotate(-90, expand=True).convert('RGB')).astype(np.uint16)
    return (((a[..., 0] & 0xF8) << 8) | ((a[..., 1] & 0xFC) << 3) | (a[..., 2] >> 3)).astype('<u2').tobytes()

# ---------------------------------------------------------------- scrolling menu list
HDR = 48
menu_src = src('menu')
hits = json.load(open(os.path.join(HERE, 'hits.json')))
mh = {h['id']: h for h in [s for s in hits['screens'] if s['name'] == 'menu'][0]['hits']}
order = [('Bit', 'mc0'), ('Face', 'mc1'), ('Moods', 'mc2'), ('Clock', 'mc3'), ('Timer', 'mc4'), ('Bitcoin', 'mc5'), ('Zap', 'mc6'),
         ('Pay', 'mc7'), ('Power', 'mc8'), ('Steps', 'mc9'), ('Play', 'mc10'), ('Weather', 'mc11'), ('Voice', 'mc12'),
         ('Wi-Fi', 'mcwifi'), ('Setup', 'mc13'), ('Edit home', 'mc14'), ('Themes', 'mc15'), ('Home', 'mc16')]
TW, TH, GAP, PADX, PADY = 206, 64, 12, 12, 8
ROWS = (len(order) + 1) // 2
LIST_H = PADY * 2 + ROWS * TH + (ROWS - 1) * 12
if LIST_H % 2: LIST_H += 1
lst = Image.new('RGB', (448, LIST_H), BG); ld = ImageDraw.Draw(lst)
lf = ImageFont.truetype(INTER, 22); lf.set_variation_by_axes([500])
items = []
for i, (label, hid) in enumerate(order):
    col, row = i % 2, i // 2
    x = PADX + col * (TW + GAP); y = PADY + row * (TH + 12)
    ld.rounded_rectangle((x, y, x + TW - 1, y + TH - 1), radius=18, fill=CARD, outline=(40, 52, 74), width=1)
    h = mh[hid]; icon = menu_src.crop((int(h['x']) + 3, int(h['y']) + 3, int(h['x']) + 39, int(h['y']) + 39)).resize((48, 48), Image.LANCZOS)
    lst.paste(icon, (x + 12, y + 8))
    ld.text((x + 74, y + TH // 2), label, font=lf, fill=WHITE, anchor='lm')
    items.append({'x': x, 'y': y, 'w': TW, 'h': TH, 't': dict(zip([o[1] for o in order], [mh[o[1]]['t'] for o in order]))[hid]})
json.dump({'listH': LIST_H, 'headerH': HDR, 'items': items}, open(os.path.join(HERE, 'menu_items.json'), 'w'), indent=1)
lst.save('/tmp/menulist.png')

# header-only menu screen
hdr = Image.new('RGB', (448, 368), BG); hdr.paste(menu_src.crop((0, 0, 448, HDR)), (0, 0)); hdr.save(os.path.join(SH, 'menu.png'))

# ---------------------------------------------------------------- Wi-Fi status icon (alpha mask)
def wifi_alpha(size):
    s_ = size * 8
    im = Image.new('L', (s_, s_), 0); d = ImageDraw.Draw(im)
    cx, cy = s_ / 2, s_ * 0.82
    for r in (0.78, 0.54, 0.30):
        R = s_ * r; d.arc((cx - R, cy - R, cx + R, cy + R), 225, 315, fill=255, width=int(s_ * 0.1))
    d.ellipse((cx - s_ * 0.07, cy - s_ * 0.07, cx + s_ * 0.07, cy + s_ * 0.07), fill=255)
    return im.resize((size, size), Image.LANCZOS)
wi = wifi_alpha(22)
# ---------------------------------------------------------------- which screens have a status bar, and where the mic is
bar_type = []; bar_bg = []
for s in hits['screens']:
    p = os.path.join(SH, s['name'] + '.png')
    im = np.asarray(Image.open(p).convert('RGB')).astype(int)
    def has(x0, x1): return (abs(im[8:30, x0:x1] - np.array(BG)).sum(axis=2) > 120).sum() > 30
    free = (abs(im[8:30, 266:288] - np.array(im[9, 270])).sum(axis=2) > 60).sum() == 0
    bar_type.append(-1 if not (has(236, 256) and free) else (1 if s['name'] == 'menu' else 0))
    bar_bg.append(rgb565(tuple(int(v) for v in im[9, 270])))

# ---------------------------------------------------------------- extras blob + header
extras = bytearray()
def put(b):
    while len(extras) % 4: extras.append(0)
    o = len(extras); extras.extend(b); return o
list_off = put(to_panel565(lst))
icon_off = [put(to_panel565(i)) for i in icons]
atlas_off = put(bytes(atlas))
open(os.path.join(HERE, 'extras.bin'), 'wb').write(extras)

L = ['// generated by tools/make_live.py, do not edit', '#pragma once', '#include <stdint.h>',
     'struct GlyphE { uint32_t off; uint16_t adv16; uint16_t code; uint8_t w, h; int16_t xo, yo; };',
     'struct FontE { const GlyphE *g; uint16_t n; int16_t penx, basey; };',
     'struct FieldE { int16_t x, y, w, h; uint16_t bg; };',
     '#define MENU_LIST_OFF %d' % list_off, '#define MENU_LIST_H %d' % LIST_H, '#define MENU_HDR_H %d' % HDR,
     '#define ICON_W %d' % IW, '#define ICON_H %d' % IH, '#define N_ICONS %d' % len(icons),
     'static const uint32_t ICON_OFF[N_ICONS] = {%s};' % ','.join(str(o) for o in icon_off),
     '#define ATLAS_OFF %d' % atlas_off, '#define EXTRAS_SIZE %d' % len(extras)]
for i, (fid, *_r) in enumerate(FONTS): L.append('#define FN_%s %d' % (fid, i))
L.append('#define FN_COUNT %d' % len(FONTS))
for i, rows in enumerate(glyph_rows):
    L.append('static const GlyphE GL_%d[] = {%s};' % (i, ','.join('{%d,%d,%d,%d,%d,%d,%d}' % (r[1], r[2], r[0], r[3], r[4], r[5], r[6]) for r in rows)))
L.append('static const FontE FONTS[FN_COUNT] = {%s};' % ','.join('{GL_%d,%d,%d,%d}' % (i, len(glyph_rows[i]), font_meta[i][0], font_meta[i][1]) for i in range(len(FONTS))))
for i, f in enumerate(FIELDS): L.append('#define FLD_%s %d' % (('%s_%s' % (f[1], f[0])).upper(), i))
L.append('static const FieldE FIELDS[] = {%s};' % ','.join('{%d,%d,%d,%d,%d}' % (f[2], f[3], f[4], f[5], rgb565(f[6])) for f in FIELDS))
L.append('static const int8_t BAR_TYPE[] = {%s};   // -1 none, 0 mic at x 240, 1 menu header' % ','.join(str(b) for b in bar_type))
L.append('static const uint16_t BAR_BG[] = {%s};' % ','.join(str(b) for b in bar_bg))
names = [x['name'] for x in hits['screens']]
L.append('struct MItem { int16_t x, y, w, h, to; };')
L.append('static const MItem MENU_ITEMS[] = {%s};' % ','.join('{%d,%d,%d,%d,%d}' % (it['x'], it['y'], it['w'], it['h'], names.index({'edit': 'pick'}.get(it['t'], it['t']))) for it in items))
L.append('#define N_MENU_ITEMS %d' % len(items))
L.append('#define WIFI_ICON_W 22')
L.append('static const uint8_t WIFI_ALPHA[22 * 22] = {%s};' % ','.join(str(v) for v in wi.tobytes()))
open(os.path.join(HERE, '..', 'src', 'live_assets.h'), 'w').write('\n'.join(L) + '\n')
print('extras', len(extras), 'bytes; menu list', LIST_H, 'px; icons', len(icons), '; atlas', len(atlas))

# ---------------------------------------------------------------- preview (PIL, same sizes and anchors as the firmware)
def preview():
    def txt(im, fid, s, col, align='l', ax=None):
        i = FN[fid]; path, wght = FONTS[i][1], FONTS[i][2]; f = mkfont(path, font_meta[i][2], wght)
        d = ImageDraw.Draw(im); x = font_meta[i][0]; y = font_meta[i][1]
        if align == 'c': x = ax - f.getlength(s) / 2
        elif align == 'r': x = ax - f.getlength(s)
        d.text((x, y), s, font=f, fill=col, anchor='ls')
    b = Image.open(os.path.join(SH, 'btc.png')).convert('RGB')
    txt(b, 'PRICE', '€97,350', WHITE); txt(b, 'CHG', '-0.6%', RED); txt(b, 'CARD', '912,345', WHITE)
    d = ImageDraw.Draw(b); txt(b, 'SMALL', 'updated 1 min ago · coingecko', GREY)
    f = mkfont(JBM5, font_meta[FN['CARD']][2]); d.text((246 + 6, font_meta[FN['CARD']][1]), '12 sat/vB', font=f, fill=WHITE, anchor='ls')
    d.line([(232 + k * 14, 214 - (k * 7) % 22 - k) for k in range(14)], fill=ORANGE, width=2)
    w = Image.open(os.path.join(SH, 'weather.png')).convert('RGB'); w.paste(icons[4], (36, 72))
    txt(w, 'TEMP', '4°', WHITE); txt(w, 'COND', 'light rain', GREY); txt(w, 'HILO', '6° / 1°', WHITE)
    for k, (l, t) in enumerate((('now', '4°'), ('18h', '3°'), ('21h', '2°'), ('00h', '1°'), ('03h', '1°'))):
        txt(w, 'HOUR', l, GREY, 'c', 69 + 80 * k); txt(w, 'HOURT', t, WHITE, 'c', 69 + 80 * k)
    txt(w, 'SMALL', 'Sneek, Netherlands', GREY)
    c = Image.open(os.path.join(SH, 'clock.png')).convert('RGB')
    txt(c, 'TIME', '16:08', WHITE, 'c', 224); txt(c, 'DATE', 'Saturday 28 November', GREY, 'c', 224)
    m = Image.new('RGB', (896, 736)); [m.paste(im, ((i % 2) * 448, (i // 2) * 368)) for i, im in enumerate((b, w, c, lst.crop((0, 0, 448, 368))))]
    m.save('/tmp/live_preview.png')
preview()
