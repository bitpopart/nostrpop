"""POPtoons Character Guide (PDF) builder.
The content lives in data.py. Run: python3 build_guide.py
Needs: reportlab, pillow.
"""
import math, os
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader

HERE = os.path.dirname(os.path.abspath(__file__))
F = lambda n: os.path.join(HERE, 'fonts', n)
pdfmetrics.registerFont(TTFont('Lilita', F('LilitaOne-Regular.ttf')))
pdfmetrics.registerFont(TTFont('Pop', F('Poppins-Regular.ttf')))
pdfmetrics.registerFont(TTFont('PopM', F('Poppins-Medium.ttf')))
pdfmetrics.registerFont(TTFont('PopB', F('Poppins-Bold.ttf')))
pdfmetrics.registerFont(TTFont('PopI', F('Poppins-Italic.ttf')))

W, H = A4
M = 42
INK = HexColor('#111111')
TRIBE = {'Love': '#F0364F', 'Freedom': '#2F8FEF', 'Joy': '#FFD422'}
TIERS = ['Common', 'Uncommon', 'Rare', 'Super Rare', 'Ultra Rare', 'Unique 1/1']
SERIES = ['Masterpiece', 'Signed', 'Legend']

from data import COLLECTIONS, CHARACTERS

# ------------------------------------------------------------------ helpers
_img_cache = {}
def img(key):
    if key not in _img_cache:
        p = os.path.join(HERE, 'img', key + '.png')
        im = Image.open(p).convert('RGB')
        s = 3
        im = im.resize((im.width * s, im.height * s), Image.LANCZOS)
        _img_cache[key] = (ImageReader(im), im.width, im.height)
    return _img_cache[key]

def draw_img(c, key, x, y, w, h):
    """Fit image inside box (x,y,w,h), centred."""
    r, iw, ih = img(key)
    k = min(w / iw, h / ih)
    dw, dh = iw * k, ih * k
    c.drawImage(r, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)

def box(c, x, y, w, h, fill='#FFFFFF', r=14, lw=3, shadow=6):
    if shadow:
        c.setFillColor(INK); c.setStrokeColor(INK)
        c.roundRect(x + shadow, y - shadow, w, h, r, stroke=0, fill=1)
    c.setFillColor(HexColor(fill) if isinstance(fill, str) else fill)
    c.setStrokeColor(INK); c.setLineWidth(lw)
    c.roundRect(x, y, w, h, r, stroke=1, fill=1)

def dots(c, x, y, w, h, color, step=16, rad=2.2, alpha=0.16):
    c.saveState()
    p = c.beginPath(); p.rect(x, y, w, h); c.clipPath(p, stroke=0, fill=0)
    c.setFillColor(HexColor(color)); c.setFillAlpha(alpha)
    row = 0
    yy = y
    while yy < y + h + step:
        xx = x + (step / 2 if row % 2 else 0)
        while xx < x + w + step:
            c.circle(xx, yy, rad, stroke=0, fill=1)
            xx += step
        yy += step * 0.866; row += 1
    c.restoreState()

def is_dark(hexcol):
    h = hexcol.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return (0.299 * r + 0.587 * g + 0.114 * b) < 140

def pop_text(c, x, y, txt, size, fill='#FFFFFF', stroke=2.5, shadow=3, font='Lilita', align='left'):
    w = pdfmetrics.stringWidth(txt, font, size)
    if align == 'center': x -= w / 2
    elif align == 'right': x -= w
    if shadow:
        c.setFillColor(INK); c.setFont(font, size)
        c.drawString(x + shadow, y - shadow, txt)
    t = c.beginText(x, y)
    t.setFont(font, size)
    t.setTextRenderMode(2)
    c.setLineWidth(stroke); c.setStrokeColor(INK); c.setLineJoin(1)
    c.setFillColor(HexColor(fill))
    t.textOut(txt)
    t.setTextRenderMode(0)
    c.drawText(t)
    # redraw the fill on top so the stroke doesn't eat the letter
    c.setFillColor(HexColor(fill)); c.setFont(font, size)
    c.drawString(x, y, txt)
    return w

def burst(c, cx, cy, rx, ry, txt, size=20, points=12, rot=-8, fill='#FFFFFF'):
    c.saveState()
    c.translate(cx, cy); c.rotate(rot)
    def path(dx=0, dy=0):
        p = c.beginPath()
        for i in range(points * 2):
            a = math.pi * i / points + 0.2
            k = 1.0 if i % 2 == 0 else 0.72
            px, py = math.cos(a) * rx * k + dx, math.sin(a) * ry * k + dy
            (p.moveTo if i == 0 else p.lineTo)(px, py)
        p.close(); return p
    c.setFillColor(INK); c.drawPath(path(5, -5), stroke=0, fill=1)
    c.setFillColor(HexColor(fill)); c.setStrokeColor(INK); c.setLineWidth(3); c.setLineJoin(1)
    c.drawPath(path(), stroke=1, fill=1)
    c.setFillColor(INK); c.setFont('Lilita', size)
    c.drawCentredString(0, -size * 0.34, txt)
    c.restoreState()

def para(c, txt, x, y_top, w, style):
    p = Paragraph(txt, style)
    _, h = p.wrap(w, 2000)
    p.drawOn(c, x, y_top - h)
    return y_top - h

BODY = ParagraphStyle('body', fontName='Pop', fontSize=11.5, leading=18, textColor=INK)
BODY_S = ParagraphStyle('bodys', fontName='Pop', fontSize=10, leading=15, textColor=INK)
FACT = ParagraphStyle('fact', fontName='Pop', fontSize=10.5, leading=15, textColor=INK)

def chip(c, x, y, txt, fill, size=10, padx=10, h=22, font='PopB'):
    w = pdfmetrics.stringWidth(txt, font, size) + padx * 2
    c.setFillColor(HexColor(fill)); c.setStrokeColor(INK); c.setLineWidth(2)
    c.roundRect(x, y, w, h, h / 2, stroke=1, fill=1)
    c.setFillColor(white if is_dark(fill) else INK); c.setFont(font, size)
    c.drawString(x + padx, y + h / 2 - size * 0.36, txt)
    return w

def tier_dots(c, x, y, tier, rad=5.5, gap=16):
    n = TIERS.index(tier) + 1
    for i in range(6):
        c.setStrokeColor(INK); c.setLineWidth(1.8)
        c.setFillColor(INK if i < n else white)
        c.circle(x + rad + i * gap, y, rad, stroke=1, fill=1)

def footer(c, page_no):
    c.setFont('PopM', 8.5); c.setFillColor(INK)
    c.drawString(M, 24, 'POPtoons Character Guide')
    c.drawCentredString(W / 2, 24, 'poptoons.fun · BitPopArt')
    c.drawRightString(W - M, 24, str(page_no))

def coll(key):
    return next(k for k in COLLECTIONS if k['key'] == key)

# ------------------------------------------------------------------ pages
def cover(c):
    c.setFillColor(HexColor('#FFD422')); c.rect(0, 0, W, H, stroke=0, fill=1)
    dots(c, 0, 0, W, H, '#E8822E', step=20, rad=3.2, alpha=0.35)
    lw = 440; lh = lw * 166.8 / 855
    c.drawImage(os.path.join(HERE, 'img', 'logo-white.png'), W / 2 - lw / 2, H - 150, lw, lh, mask='auto')
    c.saveState(); c.translate(W / 2, H - 168); c.rotate(-3)
    tw = pdfmetrics.stringWidth('CHARACTER GUIDE', 'Lilita', 24) + 36
    c.setFillColor(INK); c.roundRect(-tw / 2, -10, tw, 38, 9, stroke=0, fill=1)
    c.setFillColor(HexColor('#FFD422')); c.setFont('Lilita', 24)
    c.drawCentredString(0, 0, 'CHARACTER GUIDE'); c.restoreState()

    # character grid, grouped per collection with a label above each group
    groups = []
    solo = [ch for ch in CHARACTERS if not ch['collection']]
    if solo: groups.append(('Solo', '#111111', solo))
    for k in COLLECTIONS:
        groups.append((k['name'], k['color'], [ch for ch in CHARACTERS if ch['collection'] == k['key']]))
    def split(n):
        maxc = 8
        rows = math.ceil(n / maxc)
        base, extra = divmod(n, rows)
        return [base + (1 if r < extra else 0) for r in range(rows)]
    layout = [(nm, col, mem, split(len(mem))) for nm, col, mem in groups]
    gap = 9; lab_h = 30; ggap = 12
    cols = max(max(cnts) for _, _, _, cnts in layout)
    nrows = sum(len(cnts) for _, _, _, cnts in layout)
    area_top = H - 200; area_bot = 96
    fixed = len(layout) * lab_h + (len(layout) - 1) * ggap + (nrows - len(layout)) * gap
    s = min((W - 2 * 36 - (cols - 1) * gap) / cols, (area_top - area_bot - fixed) / nrows)
    total = fixed + nrows * s
    y = area_top - (area_top - area_bot - total) / 2
    for gi, (nm, colr, mem, cnts) in enumerate(layout):
        cw_ = pdfmetrics.stringWidth(nm, 'Lilita', 15) + 28
        c.setFillColor(INK); c.roundRect(W / 2 - cw_ / 2 + 3, y - 25 - 3, cw_, 24, 12, stroke=0, fill=1)
        c.setFillColor(HexColor(colr)); c.setStrokeColor(INK); c.setLineWidth(2.5)
        c.roundRect(W / 2 - cw_ / 2, y - 25, cw_, 24, 12, stroke=1, fill=1)
        c.setFillColor(white if is_dark(colr) else INK); c.setFont('Lilita', 15)
        c.drawCentredString(W / 2, y - 18.5, nm)
        y -= lab_h
        idx = 0
        for r, cnt in enumerate(cnts):
            chunk = mem[idx:idx + cnt]; idx += cnt
            rw = len(chunk) * s + (len(chunk) - 1) * gap
            x0 = (W - rw) / 2
            yy = y - s
            for i, ch in enumerate(chunk):
                x = x0 + i * (s + gap)
                box(c, x, yy, s, s, r=12, lw=2.8, shadow=4)
                draw_img(c, ch['key'], x + 6, yy + 6, s - 12, s - 12)
            y -= s + (gap if r < len(cnts) - 1 else 0)
        y -= ggap
    names = ' · '.join(k['name'] for k in COLLECTIONS)
    # domain pill
    dw = pdfmetrics.stringWidth('poptoons.fun', 'Lilita', 19) + 36
    c.setFillColor(INK); c.roundRect(W / 2 - dw / 2 + 4, 50 - 4, dw, 30, 15, stroke=0, fill=1)
    c.setFillColor(white); c.setStrokeColor(INK); c.setLineWidth(3)
    c.roundRect(W / 2 - dw / 2, 50, dw, 30, 15, stroke=1, fill=1)
    c.setFillColor(INK); c.setFont('Lilita', 19); c.drawCentredString(W / 2, 58.5, 'poptoons.fun')
    c.setFont('PopM', 9.5)
    c.drawCentredString(W / 2, 28, '%d characters · %d collections · Edition 7 · November 2026 · BitPopArt'
                        % (len(CHARACTERS), len(COLLECTIONS)))

def overview(c, page_no):
    c.setFillColor(white); c.rect(0, 0, W, H, stroke=0, fill=1)
    pop_text(c, M, H - 92, 'The POPtoons', 46, fill='#F0364F', stroke=3, shadow=4)
    y = para(c, "POPtoons are pop art characters by BitPopArt, at home on poptoons.fun. Each one has a name, a short story "
                "and a card. Characters that belong together form a collection. New collections "
                "and characters are added to this guide as they are drawn.",
             M, H - 116, W - 2 * M, BODY)

    # card key
    y -= 18
    c.setFont('Lilita', 20); c.setFillColor(INK); c.drawString(M, y - 16, 'How the cards work')
    y -= 30
    cw = (W - 2 * M - 2 * 14) / 3
    bh = 140
    heads = [('Series', '#FFFFFF'), ('Tribe', '#FFFFFF'), ('Tier', '#FFFFFF')]
    for i, (hd, col) in enumerate(heads):
        x = M + i * (cw + 14)
        box(c, x, y - bh, cw, bh, fill=col, r=12, lw=2.5, shadow=5)
        c.setFillColor(INK); c.setFont('Lilita', 17); c.drawString(x + 14, y - 28, hd)
        if hd == 'Series':
            for j, s in enumerate(SERIES):
                c.setFont('PopM', 10.5); c.drawString(x + 14, y - 54 - j * 22, s)
        elif hd == 'Tribe':
            for j, (t, colr) in enumerate(TRIBE.items()):
                chip(c, x + 14, y - 66 - j * 30, t, colr)
        else:
            for j, t in enumerate(TIERS):
                yy = y - 50 - j * 16.5
                n = j + 1
                for k in range(6):
                    c.setStrokeColor(INK); c.setLineWidth(1.2)
                    c.setFillColor(INK if k < n else white)
                    c.circle(x + 18 + k * 9, yy + 3.2, 3.2, stroke=1, fill=1)
                c.setFillColor(INK); c.setFont('PopM', 9.5); c.drawString(x + 76, yy, t)
    y -= bh + 16
    y = para(c, "Every character belongs to one series, one tribe and one tier. The tribe sign "
                "decides what a card trades against. The tier says how hard it is to find.",
             M, y, W - 2 * M, BODY_S)

    # collections list, two columns
    y -= 16
    c.setFont('Lilita', 20); c.setFillColor(INK); c.drawString(M, y - 16, 'The collections')
    y -= 30
    tw = W - 2 * M
    cgap = 14; bw = (tw - cgap) / 2; hgt = 66; tab = 46
    tg = ParagraphStyle('tg', parent=BODY_S, fontSize=8.3, leading=10.6)
    for i, k in enumerate(COLLECTIONS):
        mem = [ch for ch in CHARACTERS if ch['collection'] == k['key']]
        x = M + (i % 2) * (bw + cgap)
        yy = y - (i // 2) * (hgt + 11)
        box(c, x, yy - hgt, bw, hgt, r=12, lw=2.5, shadow=5)
        c.setFillColor(HexColor(k['color'])); c.setStrokeColor(INK); c.setLineWidth(2.5)
        c.roundRect(x, yy - hgt, tab, hgt, 12, stroke=1, fill=1)
        c.setFillColor(white if is_dark(k['color']) else INK); c.setFont('Lilita', 20)
        c.drawCentredString(x + tab / 2, yy - hgt / 2 - 7, k['no'])
        c.setFillColor(INK); c.setFont('Lilita', 16); c.drawString(x + tab + 11, yy - 21, k['name'])
        nw = pdfmetrics.stringWidth(k['name'], 'Lilita', 16)
        c.setFont('PopM', 8.5); c.drawString(x + tab + 11 + nw + 8, yy - 20, '%d characters' % len(mem))
        para(c, k['tagline'], x + tab + 11, yy - 27, bw - tab - 20, tg)
    footer(c, page_no); c.showPage(); page_no += 1

    # index table on its own page(s)
    c.setFillColor(white); c.rect(0, 0, W, H, stroke=0, fill=1)
    pop_text(c, M, H - 92, 'All characters', 46, fill='#2F8FEF', stroke=3, shadow=4)
    cols = [('No.', 0), ('Character', 34), ('Collection', 190), ('Series', 282), ('Tribe', 366), ('Tier', 436)]
    rh = 17
    def head(y):
        c.setFillColor(INK); c.roundRect(M, y - 22, tw, 24, 6, stroke=0, fill=1)
        c.setFillColor(white); c.setFont('PopB', 9.5)
        for name, off in cols: c.drawString(M + 10 + off, y - 14, name)
        return y - 24
    y = head(H - 122)
    for i, ch in enumerate(CHARACTERS):
        if y - rh < 56:
            c.setStrokeColor(INK); c.setLineWidth(2); c.line(M, y, M + tw, y)
            footer(c, page_no); c.showPage(); page_no += 1
            c.setFillColor(INK); c.setFont('Lilita', 20); c.drawString(M, H - 76, 'All characters (continued)')
            y = head(H - 96)
        yy = y - rh
        if i % 2 == 0:
            c.setFillColor(HexColor('#F4F1EA')); c.rect(M, yy, tw, rh, stroke=0, fill=1)
        c.setFillColor(INK); c.setFont('PopB', 9)
        c.drawString(M + 10, yy + 5, ch['no'])
        c.drawString(M + 10 + 34, yy + 5, ch['name'])
        nw = pdfmetrics.stringWidth(ch['name'] + ' ', 'PopB', 9)
        c.setFont('Pop', 8.5); c.drawString(M + 10 + 34 + nw, yy + 5, ch['kind'])
        c.setFont('Pop', 9)
        c.drawString(M + 10 + 190, yy + 5, coll(ch['collection'])['name'] if ch['collection'] else 'Solo')
        c.drawString(M + 10 + 282, yy + 5, ch['series'])
        chip(c, M + 10 + 366, yy + 2, ch['tribe'], TRIBE[ch['tribe']], size=7, padx=7, h=13)
        c.setFillColor(INK); c.setFont('Pop', 9)
        c.drawString(M + 10 + 436, yy + 5, ch['tier'])
        y -= rh
    c.setStrokeColor(INK); c.setLineWidth(2); c.line(M, y, M + tw, y)
    footer(c, page_no)
    return page_no

def collection_page(c, k, page_no):
    members = [ch for ch in CHARACTERS if ch['collection'] == k['key']]
    top = 232
    c.setFillColor(white); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(HexColor(k['color'])); c.rect(0, H - top, W, top, stroke=0, fill=1)
    dots(c, 0, H - top, W, top, '#FFFFFF', step=18, rad=2.8, alpha=0.22)
    c.setStrokeColor(INK); c.setLineWidth(4); c.line(0, H - top, W, H - top)
    chip(c, M, H - 62, 'POPtoons · Collection %s' % k['no'], '#111111', size=10)
    pop_text(c, M, H - 150, k['name'], 78, fill='#FFFFFF', stroke=4, shadow=6)
    c.setFillColor(white); c.setFont('PopM', 12.5)
    c.drawString(M, H - 190, k['tagline'])
    c.setFont('PopB', 11); c.drawString(M, H - 214, '%d characters' % len(members))

    y = H - top - 30
    badges = k.get('badges', [])[:2]
    textw = W - 2 * M - (190 if badges else 0)
    for p in k['intro']:
        y = para(c, p, M, y, textw, BODY) - 10
    # badges on the right
    bx = W - M - 160; by = H - top - 30
    for j, b in enumerate(badges):
        d = 100
        x = bx + (0 if j == 0 else 62); yy = by - d - j * 88
        draw_img(c, b, x, yy, d, d)

    # members grid
    y = (min(y, by - 188) if badges else y) - 4
    c.setFillColor(INK); c.setFont('Lilita', 20); c.drawString(M, y - 14, 'The characters')
    y -= 30
    cols = 3; gap = 14
    cw = (W - 2 * M - (cols - 1) * gap) / cols
    compact = len(members) > 12
    ch_h = 50 if compact else (102 if len(members) <= 6 else 88)
    rgap = 8 if compact else 14
    for i, ch in enumerate(members):
        col = i % cols; row = i // cols
        x = M + col * (cw + gap); yy = y - (row + 1) * ch_h - row * rgap
        box(c, x, yy, cw, ch_h, r=12, lw=2.5, shadow=5)
        if compact:
            draw_img(c, ch["key"], x + 6, yy + 5, 42, ch_h - 10)
            avail = cw - 58 - 8
            fs = 15
            while pdfmetrics.stringWidth(ch['name'], 'Lilita', fs) > avail: fs -= 0.5
            c.setFillColor(INK); c.setFont('Lilita', fs); c.drawString(x + 56, yy + ch_h - 17, ch['name'])
            fk = 8
            while pdfmetrics.stringWidth(ch['kind'], 'Pop', fk) > avail: fk -= 0.25
            c.setFont('Pop', fk); c.drawString(x + 56, yy + ch_h - 27, ch['kind'])
            chip(c, x + 56, yy + 4, ch['tribe'], TRIBE[ch['tribe']], size=7, padx=6, h=13)
            continue
        draw_img(c, ch["key"], x + 8, yy + 32, 80, ch_h - 40)
        avail = cw - 94 - 8
        fs = 17
        while pdfmetrics.stringWidth(ch['name'], 'Lilita', fs) > avail: fs -= 0.5
        c.setFillColor(INK); c.setFont('Lilita', fs); c.drawString(x + 94, yy + ch_h - 30, ch['name'])
        fk = 9
        while pdfmetrics.stringWidth(ch['kind'], 'Pop', fk) > avail: fk -= 0.25
        c.setFont('Pop', fk); c.drawString(x + 94, yy + ch_h - 44, ch['kind'])
        chip(c, x + 94, yy + (28 if ch_h > 95 else 24), ch['tribe'], TRIBE[ch['tribe']], size=8, padx=7, h=(17 if ch_h > 95 else 15))
        c.setFillColor(INK); c.setFont('PopM', 8.5)
        c.drawString(x + 10, yy + 20, ch['series'])
        c.setFont('Pop', 8.5); c.drawString(x + 10, yy + 5, ch['tier'])
        tier_dots(c, x + cw - 78, yy + (15 if ch_h > 95 else 12), ch['tier'], rad=4, gap=11.5)
    rows = math.ceil(len(members) / cols)
    y -= rows * ch_h + (rows - 1) * rgap + 20
    # notes
    nw = (W - 2 * M - 14) / 2
    for j, (hd, txt) in enumerate(k.get('notes', [])[:2]):
        x = M + j * (nw + 14)
        c.setFillColor(INK); c.setFont('PopB', 10.5); c.drawString(x, y - 10, hd)
        para(c, txt, x, y - 16, nw, BODY_S)
    footer(c, page_no)

def character_page(c, ch, page_no):
    col = ch['color']
    long = sum(len(p) for p in ch['story']) > 500
    body = ParagraphStyle('b', parent=BODY, fontSize=11.5 if long else 13, leading=18 if long else 20.5)
    fact = ParagraphStyle('f', parent=FACT, fontSize=10.5 if long else 11.5, leading=15 if long else 17)
    tw = W - 2 * M
    fact_txt = ['<font name="PopB">%s:</font> %s' % (hd, txt) for hd, txt in ch['facts']]
    need = 114 + (36 if ch.get('quote') else 0)  # name block
    need += sum(Paragraph(p, body).wrap(tw, 2000)[1] + 9 for p in ch['story']) + 8
    need += sum(Paragraph(t, fact).wrap(tw, 2000)[1] + 4 for t in fact_txt)
    vars_ = ch.get('variations') or []
    need += 98 if vars_ else 0
    strip_top = 52 + 86
    top = max(250, min(400, H - strip_top - 34 - need))
    c.setFillColor(white); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(HexColor(col)); c.rect(0, H - top, W, top, stroke=0, fill=1)
    dots(c, 0, H - top, W, top, '#FFFFFF' if is_dark(col) else '#111111', step=18, rad=2.8,
         alpha=0.22 if is_dark(col) else 0.10)
    c.setStrokeColor(INK); c.setLineWidth(4); c.line(0, H - top, W, H - top)

    k = coll(ch['collection']) if ch['collection'] else None
    chip(c, M, H - 62, 'POPtoons · %s' % (k['name'] if k else 'Solo'), '#111111', size=10)
    pop_text(c, W - M, H - 66, 'No. ' + ch['no'], 26, fill='#FFFFFF', stroke=2.5, shadow=3, align='right')

    s = top - 100
    ix = M + 20; iy = H - top + 26
    box(c, ix, iy, s, s, r=24, lw=4, shadow=8)
    draw_img(c, ch['key'], ix + 16, iy + 16, s - 32, s - 32)
    snd = ch['sound']
    size = 30 if len(snd) <= 5 else 22
    free = W - M - (ix + s)
    burst(c, ix + s + free / 2 + 6, iy + s / 2 - 6, min(112, free / 2 - 14), 78, snd, size=size)

    y = H - top - 62
    w = pop_text(c, M, y, ch['name'], 60, fill=col, stroke=3.5, shadow=5)
    c.setFillColor(INK); c.setFont('PopM', 15); c.drawString(M + w + 14, y + 4, ch['kind'])
    c.setFont('PopI', 11.5); c.drawString(M, y - 30, ch['role'])

    y -= 52
    if ch.get('quote'):
        q = '\u201c%s\u201d' % ch['quote']
        qs = 13
        while pdfmetrics.stringWidth(q, 'PopB', qs) > tw - 30 and qs > 9: qs -= 0.5
        qw = pdfmetrics.stringWidth(q, 'PopB', qs) + 28
        box(c, M, y - 24, qw, 30, r=12, lw=2.5, shadow=4)
        c.setFillColor(INK); c.setFont('PopB', qs); c.drawString(M + 14, y - 14, q)
        y -= 40
    for p in ch['story']:
        y = para(c, p, M, y, tw, body) - 9

    y -= 8
    for t in fact_txt:
        y = para(c, t, M, y, tw, fact) - 4

    # more looks of this toon
    if vars_:
        vb = 52 + 86 + 16
        c.setFillColor(INK); c.setFont('PopB', 9)
        c.drawString(M, vb + 14 + 64 + 8, 'MORE LOOKS OF %s' % ch['name'].upper())
        for i, (cap, vkey) in enumerate([('Original', ch['key'])] + list(vars_)):
            vx = M + i * 84
            box(c, vx, vb + 14, 64, 64, r=10, lw=2.5, shadow=3)
            draw_img(c, vkey, vx + 6, vb + 20, 52, 52)
            c.setFillColor(INK); c.setFont('PopM', 7.5); c.drawCentredString(vx + 32, vb + 3, cap)

    # card strip
    sh = 86; sy = 52
    box(c, M, sy, W - 2 * M, sh, r=14, lw=3, shadow=6)
    c.saveState()
    cp = c.beginPath(); cp.roundRect(M, sy, W - 2 * M, sh, 14); c.clipPath(cp, stroke=0, fill=0)
    c.setFillColor(INK); c.rect(M, sy + sh - 24, W - 2 * M, 24, stroke=0, fill=1)
    c.restoreState()
    # round the top corners of the black bar by redrawing the outline
    c.setStrokeColor(INK); c.setLineWidth(3); c.roundRect(M, sy, W - 2 * M, sh, 14, stroke=1, fill=0)
    c.setFillColor(white); c.setFont('PopB', 9.5)
    c.drawString(M + 16, sy + sh - 16.5, 'POPART CARD')
    cw = (W - 2 * M) / 3
    labels = [('Series', ch['series']), ('Tribe', ch['tribe']), ('Tier', ch['tier'])]
    for i, (lab, val) in enumerate(labels):
        x = M + i * cw
        if i:
            c.setStrokeColor(INK); c.setLineWidth(2); c.line(x, sy, x, sy + sh - 24)
        c.setFillColor(HexColor('#555555')); c.setFont('PopM', 8.5); c.drawString(x + 16, sy + 44, lab.upper())
        if lab == 'Tribe':
            chip(c, x + 16, sy + 13, val, TRIBE[val], size=11, padx=12, h=24)
        elif lab == 'Tier':
            c.setFillColor(INK); c.setFont('Lilita', 17); c.drawString(x + 16, sy + 22, val)
            tier_dots(c, x + 16, sy + 11, val, rad=3.6, gap=10.5)
        else:
            c.setFillColor(INK); c.setFont('Lilita', 19); c.drawString(x + 16, sy + 17, val)
    c.setFont('PopM', 8.5); c.setFillColor(INK)
    c.drawString(M, 24, 'POPtoons Character Guide'); c.drawCentredString(W / 2, 24, 'poptoons.fun · BitPopArt')
    c.drawRightString(W - M, 24, str(page_no))

def build(out):
    c = canvas.Canvas(out, pagesize=A4)
    c.setTitle('POPtoons Character Guide'); c.setAuthor('BitPopArt')
    c.setSubject('POPtoons characters and collections')
    cover(c); c.showPage()
    n = 2
    n = overview(c, n); c.showPage(); n += 1
    # solo characters first, then each collection followed by its members
    for ch in CHARACTERS:
        if not ch['collection']:
            character_page(c, ch, n); c.showPage(); n += 1
    for k in COLLECTIONS:
        collection_page(c, k, n); c.showPage(); n += 1
        for ch in CHARACTERS:
            if ch['collection'] == k['key']:
                character_page(c, ch, n); c.showPage(); n += 1
    c.save()

if __name__ == '__main__':
    build(os.path.join(HERE, 'POPtoons-Character-Guide.pdf'))
    print('wrote POPtoons-Character-Guide.pdf')
