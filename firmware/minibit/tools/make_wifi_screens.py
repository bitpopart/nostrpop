"""Draws the Wi-Fi setup screens and adds a Wi-Fi tile to the menu (448 x 368 design size).

Flow, the same as POWout: the board opens its own hotspot, the phone scans a QR code to join it,
the password is typed on the phone page (not on the tiny screen), the board connects and saves it.
Run from firmware/minibit/tools. Writes shots/menu.png (once) and shots/wifijoin|wifiwait|wifiok|wififail.png.
"""
import os
import segno
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SH = os.path.join(HERE, 'shots')
BG = (5, 6, 8); FG = (220, 233, 255); GREY = (124, 139, 165); CYAN = (70, 230, 255)
CARD = (17, 22, 31); EDGE = (40, 52, 74)
FD = '/usr/share/fonts/opentype/inter/'
def inter(sz, w='SemiBold'): return ImageFont.truetype(FD + 'Inter-%s.otf' % w, sz)
MONO = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 11)

AP_NAME = 'MiniBit-setup'
SS = 4  # supersample for smooth shapes

def wifi_icon(size, color=CYAN):
    """Three arcs and a dot, drawn big then scaled down."""
    s = size * 8
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cx, cy = s / 2, s * 0.82
    for i, r in enumerate((0.78, 0.54, 0.30)):
        R = s * r
        d.arc((cx - R, cy - R, cx + R, cy + R), 225, 315, fill=color, width=int(s * 0.1))
    d.ellipse((cx - s * 0.07, cy - s * 0.07, cx + s * 0.07, cy + s * 0.07), fill=color)
    return im.resize((size, size), Image.LANCZOS)

def paste_rgba(dst, src, xy): dst.paste(src, xy, src)

def top_bar(img):
    """Status bar (signal, menu, mic, battery) copied from the Setup screen, plus the back arrow from Feed."""
    setup = Image.open(os.path.join(SH, 'setup.png')).convert('RGB')
    feed = Image.open(os.path.join(SH, 'feed.png')).convert('RGB')
    img.paste(setup.crop((0, 0, 448, 40)), (0, 0))
    img.paste(feed.crop((56, 4, 100, 34)), (56, 4))

def pill(d, xy, text, fill=CYAN, fg=(5, 6, 8), size=18):
    x, y, w, h = xy
    d.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fill)
    f = inter(size, 'Bold'); tw = d.textlength(text, font=f)
    d.text((x + (w - tw) / 2, y + h / 2 - size * 0.62), text, font=f, fill=fg)

def qr_img(text, px):
    q = segno.make(text, error='m', boost_error=False)
    n = q.symbol_size(border=2)[0]; m = px // n
    a = Image.new('RGB', (n * m, n * m), (255, 255, 255)); d = ImageDraw.Draw(a)
    for y, row in enumerate(q.matrix_iter(border=2)):
        for x, v in enumerate(row):
            if v: d.rectangle((x * m, y * m, x * m + m - 1, y * m + m - 1), fill=(5, 6, 8))
    return a

def save(img, name): img.save(os.path.join(SH, name + '.png')); print('wrote', name)

# --- menu: Wi-Fi tile in the free slot (300,316) --------------------------------------------------
menu_path = os.path.join(SH, 'menu.png')
menu = Image.open(menu_path).convert('RGB')
if menu.getpixel((310, 330)) == BG:        # slot still empty
    tile = menu.crop((158, 264, 290, 306)).copy()      # the Setup tile as a base
    t = ImageDraw.Draw(tile)
    t.rectangle((5, 4, 40, 38), fill=CARD)             # wipe the icon area
    t.rectangle((44, 6, 128, 36), fill=CARD)           # wipe the label
    t.rounded_rectangle((6, 5, 6 + 31, 5 + 31), radius=7, outline=(24, 90, 110), width=1, fill=(14, 30, 40))
    paste_rgba(tile, wifi_icon(22), (11, 10))
    t.text((46, 10), 'Wi-Fi', font=inter(16, 'Medium'), fill=FG)
    menu.paste(tile, (300, 316)); menu.save(menu_path); print('menu: Wi-Fi tile added')
else:
    print('menu: slot already used, left as is')

# --- join: QR for the hotspot, steps for the phone page ---------------------------------------------
img = Image.new('RGB', (448, 368), BG); top_bar(img); d = ImageDraw.Draw(img)
d.text((24, 46), 'Wi-Fi', font=inter(30, 'SemiBold'), fill=FG)
d.text((26, 86), 'type the password on your phone', font=MONO, fill=GREY)
q = qr_img('WIFI:T:nopass;S:%s;;' % AP_NAME, 196)
d.rounded_rectangle((20, 112, 20 + q.width + 8, 112 + q.height + 8), radius=10, fill=(255, 255, 255))
img.paste(q, (24, 116))
x0 = 244
steps = [('1', 'Scan the code', 'to join ' + AP_NAME), ('2', 'Type your Wi-Fi', 'name and password'), ('3', 'Press Connect', 'then look at MiniBit')]
for i, (n, a, b) in enumerate(steps):
    y = 120 + i * 62
    d.ellipse((x0, y + 2, x0 + 26, y + 28), fill=CARD, outline=CYAN, width=2)
    d.text((x0 + 13, y + 15), n, font=inter(14, 'Bold'), fill=CYAN, anchor='mm')
    d.text((x0 + 38, y), a, font=inter(15, 'SemiBold'), fill=FG)
    d.text((x0 + 38, y + 20), b, font=MONO, fill=GREY)
d.text((24, 340), 'no password is typed on this screen', font=MONO, fill=GREY)
save(img, 'wifijoin')

# --- waiting ---------------------------------------------------------------------------------------
img = Image.new('RGB', (448, 368), BG); top_bar(img); d = ImageDraw.Draw(img)
paste_rgba(img, wifi_icon(120), (164, 92))
d.text((224, 250), 'Connecting', font=inter(26, 'SemiBold'), fill=FG, anchor='mm')
d.text((224, 284), 'this takes a few seconds', font=MONO, fill=GREY, anchor='mm')
save(img, 'wifiwait')

# --- connected -------------------------------------------------------------------------------------
img = Image.new('RGB', (448, 368), BG); top_bar(img); d = ImageDraw.Draw(img)
paste_rgba(img, wifi_icon(96), (176, 70))
d.text((224, 204), 'CONNECTED', font=inter(28, 'Bold'), fill=CYAN, anchor='mm')
d.text((224, 238), 'Wi-Fi saved on MiniBit', font=MONO, fill=GREY, anchor='mm')
pill(d, (134, 276, 180, 44), 'done')
save(img, 'wifiok')

# --- failed ----------------------------------------------------------------------------------------
img = Image.new('RGB', (448, 368), BG); top_bar(img); d = ImageDraw.Draw(img)
paste_rgba(img, wifi_icon(96, (255, 120, 90)), (176, 70))
d.text((224, 204), 'Could not connect', font=inter(26, 'Bold'), fill=(255, 150, 120), anchor='mm')
d.text((224, 238), 'check the password and try again', font=MONO, fill=GREY, anchor='mm')
pill(d, (134, 276, 180, 44), 'try again')
save(img, 'wififail')
