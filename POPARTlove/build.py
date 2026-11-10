#!/usr/bin/env python3
"""POPART.love site generator.

Run from this folder:  python3 build.py
Writes the static pages (index.html, art/index.html, ...), the SVG artwork in
assets/img/, sitemap.xml and robots.txt. No dependencies beyond Python 3.

Edit the PAGES / content below, re-run, deploy the folder.
"""
import math
import json
import os
import re
from html import escape

ROOT = os.path.dirname(os.path.abspath(__file__))
DOMAIN = "https://popart.love"
TODAY = "2026-11-10"

INK = "#111111"
LOVE = "#ff2f8a"
FREEDOM = "#1e88ff"
JOY = "#ffd400"
MINT = "#19c3b1"

# ---------------------------------------------------------------- SVG art --

def write(path, content):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as fh:
        fh.write(content)


def svg_wrap(body, w=400, h=400, title=""):
    t = f"<title>{escape(title)}</title>" if title else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img">{t}'
        f"{body}</svg>\n"
    )


def dots(pid, color, opacity=0.25, size=14, r=2.6):
    return (
        f'<defs><pattern id="{pid}" width="{size}" height="{size}" patternUnits="userSpaceOnUse">'
        f'<circle cx="{size/2}" cy="{size/2}" r="{r}" fill="{color}" fill-opacity="{opacity}"/>'
        f"</pattern></defs>"
    )


def burst(cx, cy, r_out, r_in, points, fill, stroke_w=8, rot=0):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = math.pi * i / points + math.radians(rot)
        pts.append(f"{cx + r*math.cos(a):.1f},{cy + r*math.sin(a):.1f}")
    return (
        f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{INK}" '
        f'stroke-width="{stroke_w}" stroke-linejoin="round"/>'
    )


HEART = (
    "M200 335 C 70 245, 40 140, 112 92 C 158 66, 194 92, 200 124 "
    "C 206 92, 242 66, 288 92 C 360 140, 330 245, 200 335 Z"
)


def art_love_1():
    b = dots("d", INK)
    b += '<rect width="400" height="400" fill="#ffd3e4"/><rect width="400" height="400" fill="url(#d)"/>'
    b += burst(200, 205, 190, 140, 16, "#fff2a8", 8)
    b += f'<path d="{HEART}" fill="{LOVE}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>'
    b += f'<path d="M105 140 C 120 112, 150 108, 165 126" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>'
    b += f'<circle cx="92" cy="172" r="8" fill="#fff"/>'
    return svg_wrap(b, title="Love: big heart")


def art_love_2():
    b = dots("d", INK)
    b += '<rect width="400" height="400" fill="#bfe3ff"/><rect width="400" height="400" fill="url(#d)"/>'
    b += (
        f'<g transform="translate(-40 30) scale(.8)"><path d="{HEART}" fill="{FREEDOM}" '
        f'stroke="{INK}" stroke-width="14" stroke-linejoin="round"/></g>'
    )
    b += (
        f'<g transform="translate(110 -10) scale(.85)"><path d="{HEART}" fill="{LOVE}" '
        f'stroke="{INK}" stroke-width="14" stroke-linejoin="round"/></g>'
    )
    b += f'<path d="M175 118 C 188 100, 212 98, 224 112" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/>'
    return svg_wrap(b, title="Love: two hearts")


def art_freedom_1():
    b = dots("d", INK)
    b += f'<rect width="400" height="400" fill="#c9f2ee"/><rect width="400" height="400" fill="url(#d)"/>'
    b += burst(200, 200, 185, 150, 20, "#ffffff", 8, rot=9)
    # paper plane
    b += (
        f'<polygon points="52,196 350,74 262,326 206,238" fill="{FREEDOM}" stroke="{INK}" '
        f'stroke-width="12" stroke-linejoin="round"/>'
    )
    b += f'<polygon points="206,238 350,74 232,214" fill="#8cc4ff" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>'
    b += f'<polygon points="206,238 262,326 232,252" fill="{JOY}" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>'
    b += f'<path d="M40 300 C 80 290, 110 320, 150 300" fill="none" stroke="{INK}" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 16"/>'
    return svg_wrap(b, title="Freedom: paper plane")


def art_freedom_2():
    b = dots("d", INK)
    b += f'<rect width="400" height="400" fill="#ffe27a"/><rect width="400" height="400" fill="url(#d)"/>'
    b += f'<circle cx="200" cy="205" r="150" fill="#ffffff" stroke="{INK}" stroke-width="10"/>'
    # bird: body + wings + beak
    b += f'<path d="M90 230 C 120 170, 200 150, 255 190 C 285 140, 330 128, 352 142 C 335 176, 318 210, 300 238 C 272 290, 170 310, 90 230 Z" fill="{FREEDOM}" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>'
    b += f'<path d="M205 205 C 215 140, 250 100, 300 92 C 292 140, 262 190, 222 222 Z" fill="#8cc4ff" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>'
    b += f'<polygon points="92,224 56,236 94,246" fill="{JOY}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>'
    b += f'<circle cx="128" cy="222" r="8" fill="#fff" stroke="{INK}" stroke-width="4"/><circle cx="130" cy="222" r="3.5" fill="{INK}"/>'
    return svg_wrap(b, title="Freedom: bird")


def sun_face(cx, cy, r):
    return (
        f'<circle cx="{cx - r*0.36}" cy="{cy - r*0.12}" r="{r*0.09}" fill="{INK}"/>'
        f'<circle cx="{cx + r*0.36}" cy="{cy - r*0.12}" r="{r*0.09}" fill="{INK}"/>'
        f'<path d="M{cx - r*0.5} {cy + r*0.14} C {cx - r*0.3} {cy + r*0.62}, {cx + r*0.3} {cy + r*0.62}, {cx + r*0.5} {cy + r*0.14}" '
        f'fill="#fff" stroke="{INK}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>'
    )


def art_joy_1():
    b = dots("d", INK)
    b += f'<rect width="400" height="400" fill="#ffb4d2"/><rect width="400" height="400" fill="url(#d)"/>'
    b += burst(200, 200, 188, 118, 14, "#ffec6e", 9)
    b += f'<circle cx="200" cy="200" r="104" fill="{JOY}" stroke="{INK}" stroke-width="12"/>'
    b += f'<ellipse cx="146" cy="232" rx="16" ry="10" fill="{LOVE}" fill-opacity=".75"/><ellipse cx="254" cy="232" rx="16" ry="10" fill="{LOVE}" fill-opacity=".75"/>'
    b += sun_face(200, 200, 104)
    return svg_wrap(b, title="Joy: smiling sun")


def art_joy_2():
    b = dots("d", INK)
    b += f'<rect width="400" height="400" fill="#d6f77a"/><rect width="400" height="400" fill="url(#d)"/>'
    petals = ""
    for i in range(8):
        a = math.radians(i * 45)
        petals += (
            f'<circle cx="{200 + 88*math.cos(a):.1f}" cy="{200 + 88*math.sin(a):.1f}" r="52" '
            f'fill="{LOVE if i % 2 == 0 else "#ff8ab8"}" stroke="{INK}" stroke-width="10"/>'
        )
    b += petals
    b += f'<circle cx="200" cy="200" r="70" fill="{JOY}" stroke="{INK}" stroke-width="10"/>'
    b += sun_face(200, 200, 70)
    return svg_wrap(b, title="Joy: smiling flower")


ARTWORKS = [
    # file, builder, title, theme, blurb
    ("love-big-heart", art_love_1, "Big Heart", "love", "Thick lines, loud colours, one huge heart."),
    ("freedom-paper-plane", art_freedom_1, "Paper Plane", "freedom", "Fold it, throw it, let it go."),
    ("joy-sunny-face", art_joy_1, "Sunny Face", "joy", "A sun that will not stop smiling."),
    ("love-two-hearts", art_love_2, "Two Hearts", "love", "Two hearts, one beat."),
    ("freedom-bird", art_freedom_2, "Free Bird", "freedom", "Wings first, questions later."),
    ("joy-happy-flower", art_joy_2, "Happy Flower", "joy", "Eight petals of pure good mood."),
]


def logo_svg():
    b = f'<path d="{HEART}" transform="translate(-6 -6) scale(1.03)" fill="{LOVE}" stroke="{INK}" stroke-width="18" stroke-linejoin="round"/>'
    b += burst(300, 96, 70, 40, 8, JOY, 10, rot=8)
    b += f'<path d="M96 144 C 112 114, 146 110, 162 132" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/>'
    return svg_wrap(b, 400, 400, "POPART.love")


def favicon_svg():
    b = f'<rect width="64" height="64" rx="14" fill="{JOY}"/>'
    b += f'<path d="M32 54 C 10 40, 6 22, 18 14 C 25 10, 31 14, 32 20 C 33 14, 39 10, 46 14 C 58 22, 54 40, 32 54 Z" fill="{LOVE}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
    return svg_wrap(b, 64, 64, "POPART.love")


THEME_ICON = {
    "love": ("Love", "love", LOVE),
    "freedom": ("Freedom", "freedom", FREEDOM),
    "joy": ("Joy", "joy", JOY),
}

SERIES = [
    ("Masterpiece", "The core of the collection. Bold, clean, collectable."),
    ("Signed", "Hand signed by the artist."),
    ("Legend", "Rare. Few exist, everybody wants one."),
]


def card_svg(art_builder, theme, title, series, number):
    """Trading card: 500x700, art window, theme sign, series label."""
    name, _, color = THEME_ICON[theme]
    art = art_builder()
    inner = art.split("</title>", 1)[1].rsplit("</svg>", 1)[0] if "</title>" in art else art
    inner = inner.replace('id="d"', f'id="d{number}"').replace("url(#d)", f"url(#d{number})")
    sign = {
        "love": f'<path d="{HEART}" transform="translate(22 22) scale(.2)" fill="#fff" stroke="{INK}" stroke-width="30" stroke-linejoin="round"/>',
        "freedom": f'<polygon points="30,52 92,28 74,86 62,64" fill="#fff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>',
        "joy": f'<circle cx="60" cy="56" r="22" fill="#fff" stroke="{INK}" stroke-width="6"/>' + "".join(
            f'<line x1="{60+30*math.cos(math.radians(a)):.1f}" y1="{56+30*math.sin(math.radians(a)):.1f}" '
            f'x2="{60+40*math.cos(math.radians(a)):.1f}" y2="{56+40*math.sin(math.radians(a)):.1f}" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
            for a in range(0, 360, 45)
        ),
    }[theme]
    b = f'<rect x="6" y="6" width="488" height="688" rx="34" fill="{color}" stroke="{INK}" stroke-width="12"/>'
    b += f'<rect x="38" y="118" width="424" height="424" rx="16" fill="#fff" stroke="{INK}" stroke-width="10"/>'
    b += f'<svg x="44" y="124" width="412" height="412" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">{inner}</svg>'
    b += f'<circle cx="76" cy="62" r="40" fill="{color}" stroke="{INK}" stroke-width="8"/>'
    b += f'<g transform="translate(16 6)">{sign}</g>'
    fs = min(56, int(318 / (len(title) * 0.66)))  # shrink long titles so they stay inside the card
    b += (
        f'<text x="132" y="78" font-family="Bangers, Impact, Arial Black, sans-serif" font-size="{fs}" '
        f'fill="#111" letter-spacing="1">{escape(title.upper())}</text>'
    )
    b += (
        f'<text x="40" y="606" font-family="Bangers, Impact, Arial Black, sans-serif" font-size="40" '
        f'fill="#111" letter-spacing="2">{escape(series.upper())}</text>'
    )
    b += (
        f'<text x="460" y="606" text-anchor="end" font-family="Bangers, Impact, Arial Black, sans-serif" font-size="40" '
        f'fill="#111" letter-spacing="2">{escape(number)}</text>'
    )
    b += (
        f'<text x="250" y="660" text-anchor="middle" font-family="Bangers, Impact, Arial Black, sans-serif" '
        f'font-size="28" fill="#111" letter-spacing="6">POPART.LOVE</text>'
    )
    return svg_wrap(b, 500, 700, f"{title} - {series}")


# Available cards live in data/cards.json (newest first). Each entry points to
# assets/img/cards/<file>.webp, exported from the Card Maker.
EXAMPLE_CARDS = [
    (c["file"], c["name"], c["theme"], c["series"], c["rarity"], c["run"], c["blurb"], c.get("status", "available"), c.get("left"), c.get("online", True), c.get("offline", True), c.get("url", ""))
    for c in json.load(open(os.path.join(ROOT, "data", "cards.json"), encoding="utf-8"))
]


def build_cards_json():
    src = os.path.join(ROOT, "data", "cards.json")
    write("assets/cards.json", open(src, encoding="utf-8").read())


def build_images():
    # assets/img/logo.svg is the uploaded Love icon; do not regenerate it here
    write("assets/img/favicon.svg", favicon_svg())
    for fn, builder, title, theme, blurb in ARTWORKS:
        write(f"assets/img/{fn}.svg", builder())


# ------------------------------------------------------------------- HTML --

NAV = [
    ("News", "/news/"),
    ("Studio", "/studio/"),
    ("PopUp", "/popup/"),
    ("Cards", "/cards/"),
    ("Verify", "/verify/"),
    ("Stickers", "/stickers/"),
    ("Prints", "/prints/"),
    ("Shop", "/shop/"),
]

TILES = [
    ("Cards", "/cards/", "\U0001F0CF", "c-yellow"),
    ("Stickers", "/stickers/", "\u2B50", "c-pink"),
    ("Prints", "/prints/", "\U0001F5BC\uFE0F", "c-lime"),
    ("Shop", "/shop/", "\U0001F6CD️", "c-sky"),
    ("News", "/news/", "\U0001F4F0", "c-red"),
    ("Studio", "/studio/", "\U0001F58C️", "c-orange"),
    ("PopUp", "/popup/", "\U0001F4CD", "c-purple"),
]

FONTS = (
    '<link rel="preload" href="/assets/fonts/bangers-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>'
)

pages_written = []


def nav_html(current):
    def link(n, h):
        cur = ' aria-current="page"' if h == current else ""
        return f'<li><a href="{h}"{cur}>{n}</a></li>'

    items = "".join(link(n, h) for n, h in NAV)
    mobile = items
    return f"""<a class="skip-link" href="#main">Skip to content</a>
<header class="nav">
  <div class="container nav-inner">
    <a class="brand" href="/" aria-label="POPART.love home">
      <img src="/assets/img/logo.svg" alt="" width="52" height="44">
      <img class="brand-wordmark" src="/assets/img/popart-love.svg" alt="POPART.love" width="256" height="37">
    </a>
    <ul class="nav-links">{items}</ul>
    <div class="nav-actions">
      <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="menu-panel" aria-label="Menu">&#9776;</button>
    </div>
  </div>
  <nav class="menu-panel" id="menu-panel" aria-label="Mobile"><ul>{mobile}</ul></nav>
</header>"""


def footer_html():
    quick = "".join(f'<li><a href="{h}">{n}</a></li>' for n, h in NAV)
    return f"""<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="/" aria-label="POPART.love home">
          <img src="/assets/img/logo.svg" alt="" width="52" height="44">
          <img class="brand-wordmark" src="/assets/img/popart-love.svg" alt="POPART.love" width="256" height="37">
        </a>
        <p class="tagline" style="margin-top:.8rem">The fan page for everyone who loves pop art. Love, Freedom &amp; Joy.</p>
        <div class="theme-dots" aria-hidden="true"><i style="background:var(--love)"></i><i style="background:var(--freedom)"></i><i style="background:var(--joy)"></i></div>
      </div>
      <div>
        <h3>Quick links</h3>
        <ul>{quick}</ul>
      </div>
      <div>
        <h3>More</h3>
        <ul>
          <li><a href="/sitemap.xml">Sitemap</a></li>
          <li><a href="https://bitpopart.com" rel="noopener">BitPopArt</a></li>
        </ul>
      </div>
      <div>
        <h3>Newsletter</h3>
        <p class="tagline">New art, new cards, new drops. No spam.</p>
        <form class="newsletter" id="newsletter-form" novalidate>
          <label for="nl-email" class="sr-only" style="position:absolute;left:-999px">Email address</label>
          <input id="nl-email" name="email" type="email" placeholder="your@email.com" autocomplete="email" required>
          <button class="btn" type="submit">Subscribe</button>
          <p class="form-msg" id="newsletter-msg" role="status" aria-live="polite"></p>
        </form>
      </div>
    </div>
    <div class="footer-bottom">
      &copy; 2026 POPART.love &middot; made by BitPopArt &middot; all artwork &copy;
    </div>
  </div>
</footer>
<script src="/assets/js/site.js" defer></script>
<script src="/assets/js/cards.js" defer></script>"""


LFJ_RE = re.compile(r"Love, Freedom(, | &amp; | &amp;amp; | and | or | & )Joy")
LFJ_HTML = '<span class="lfj"><span class="l">Love</span>, <span class="f">Freedom</span>\\1<span class="j">Joy</span></span>'


def colour_lfj(html):
    """Wherever the text reads Love, Freedom & Joy: Love pink, Freedom blue, Joy yellow (text nodes only)."""
    parts = re.split(r"(<script.*?</script>|<style.*?</style>|<[^>]+>)", html, flags=re.S)
    for i, p in enumerate(parts):
        if i % 2 == 0:
            parts[i] = LFJ_RE.sub(LFJ_HTML, p)
    return "".join(parts)


def page(path, title, desc, body, current=None, head_class=None, noindex=False):
    """path: '' for home, 'art' for /art/index.html."""
    url_path = "/" if path == "" else f"/{path}/"
    full_title = "POPART.love | Love, Freedom & Joy" if path == "" else f"{title} | POPART.love"
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(full_title)}</title>
<meta name="description" content="{escape(desc)}">
<link rel="canonical" href="{DOMAIN}{url_path}">
{'<meta name="robots" content="noindex, nofollow">' if noindex else ""}
<meta property="og:type" content="website">
<meta property="og:title" content="{escape(full_title)}">
<meta property="og:description" content="{escape(desc)}">
<meta property="og:url" content="{DOMAIN}{url_path}">
<meta name="theme-color" content="#ff7a14">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
{FONTS}
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
{nav_html(current if current is not None else url_path)}
<main id="main">
{body}
</main>
{footer_html()}
</body>
</html>
"""
    head, sep, rest = html.partition("</head>")
    html = head + sep + colour_lfj(rest)
    out = "index.html" if path == "" else f"{path}/index.html"
    write(out, html)
    if not noindex:
        pages_written.append(url_path)


def page_head(title, text):
    return f'<section class="page-head"><div class="container"><h1>{escape(title)}</h1><p>{text}</p></div></section>'


def art_card(fn, title, theme, blurb):
    name, cls, _ = THEME_ICON[theme]
    return f"""<article class="card">
  <figure><img src="/assets/img/{fn}.svg" alt="{escape(title)}: {escape(blurb)}" width="400" height="400" loading="lazy"></figure>
  <div class="body"><span class="tag {cls}">{name}</span><h3>{escape(title)}</h3><p>{escape(blurb)}</p></div>
</article>"""


def stock_label(status, left, runnum):
    if status == "sold-out":
        return "Sold out"
    if status == "coming-soon":
        return "Coming soon"
    if left is None:
        return "Available"
    return f"{left} of {runnum} left" if runnum else f"{left} left"


def stock_class(status):
    return {"sold-out": "out", "coming-soon": "soon"}.get(status, "ok")


ICON_CART = '<svg class="ico-s" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 1.9-1.4L21 8H6.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20" r="1.6" fill="currentColor"/><circle cx="17" cy="20" r="1.6" fill="currentColor"/></svg>'
ICON_PIN = '<svg class="ico-s" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>'


def where_html(online, offline, url, status, in_shop=False):
    """Where a card can be bought: online (external shop link) and/or offline (at a pop-up event)."""
    if status == "sold-out":
        return ""
    # online chip: external shop url when set, else the shop page (plain label on the shop page itself)
    if url:
        on = f'<a class="tag where" data-where="online" href="{escape(url)}" target="_blank" rel="noopener">{ICON_CART} Buy online</a>'
    elif in_shop:
        on = f'<a class="tag where" data-where="online">{ICON_CART} Online</a>'
    else:
        on = f'<a class="tag where" data-where="online" href="/shop/">{ICON_CART} Online</a>'
    off = f'<a class="tag where" data-where="offline" href="/popup/">{ICON_PIN} At events</a>'
    on = on.replace('<a ', '<a ', 1) if online else on.replace('class="tag where"', 'class="tag where" hidden', 1)
    off = off if offline else off.replace('class="tag where"', 'class="tag where" hidden', 1)
    return f'<div class="tags where-row">{on}{off}</div>'


def tribe_cards(limit=None, in_shop=False):
    cards = EXAMPLE_CARDS[:limit] if limit else EXAMPLE_CARDS
    out = ""
    for fn, title, theme, series, rarity, run, blurb, status, left, online, offline, url in cards:
        name, cls, _ = THEME_ICON[theme]
        runnum = re.search(r"\d+", run)
        runnum = runnum.group(0) if runnum else ""
        out += f'''<article class="card" data-card="{fn}" data-run="{runnum}"><figure class="cardfig"><button class="flip" type="button" aria-pressed="false" aria-label="Flip the {escape(title)} card"><span class="flip-inner"><img class="face front" src="/assets/img/cards/{fn}.webp" alt="POPART {escape(title)} card front, {series} series, {rarity}" width="600" height="840" loading="lazy"><img class="face back" src="/assets/img/cards/{fn}-back.webp" alt="POPART {escape(title)} card back" width="600" height="840" loading="lazy"></span></button><span class="flip-hint">Tap the card to flip</span></figure>
<div class="body"><div class="tags"><span class="tag {cls}">{name}</span><span class="tag">{rarity}</span><span class="tag stock {stock_class(status)}" data-stock>{stock_label(status, left, runnum)}</span></div><p class="card-price" data-price hidden></p>{where_html(online, offline, url, status, in_shop)}<h3>{escape(title)}</h3><p>{series} series. {run}. {escape(blurb)}</p></div></article>'''
    attrs = (f' data-limit="{limit}"' if limit else "") + (' data-shop="1"' if in_shop else "")
    return f'<div class="grid g3"{attrs}>{out}</div>'


RIBBON = ""

# ----------------------------------------------------------------- PAGES --

def build_pages():
    # ---- Home
    tiles = "".join(
        f'<a class="tile" href="{h}"><div class="ico {c}"><img src="/assets/img/icon-{n.lower()}.svg" alt="" width="64" height="64" loading="lazy"></div><span class="lbl">{n}</span></a>'
        for n, h, i, c in TILES
    )
    home = f"""
<section class="hero">
  <div class="container hero-inner">
    <div>
      <span class="kicker">The fan page for pop art lovers</span>
      <h1>Love, Freedom &amp; Joy</h1>
      <p class="lead">POPART.love is the fan page for everyone who loves pop art. Loud, happy, popart, collectible cards, stickers, prints and good vibes you can hold. Three themes, one big heart.</p>
      <p class="lead">POPART.love is part of the studio <a href="https://bitpopart.com" target="_blank" rel="noopener"><strong>bitpopart.com</strong></a>.</p>
      <div class="hero-actions">
        <a class="btn" href="/cards/">Collect the cards</a>
        <a class="btn yellow" href="/stickers/">See the stickers</a>
        <a class="btn blue" href="/shop/">Visit the shop</a>
      </div>
    </div>
    <div class="card-fan"><img src="/assets/img/cards/big-heart.webp" alt="Big Heart card" width="600" height="840"><img src="/assets/img/cards/sunny-face.webp" alt="Sunny Face card" width="600" height="840"><img src="/assets/img/cards/paper-plane.webp" alt="Paper Plane card" width="600" height="840"></div>
  </div>
</section>
{RIBBON}
<div class="container tiles-wrap"><nav class="tiles" aria-label="Sections">{tiles}</nav></div>

<section class="section"><div class="container">
  <div class="section-head"><div><h2>Stickers and prints</h2><p>Thick-outline pop art you can stick on a laptop or hang on a wall.</p></div></div>
  <div class="split">
    <div class="panel pink"><span class="kicker">Stickers</span><h3>Stick it anywhere</h3><p>Bold hearts, planes and suns as stickers.</p><a class="btn" href="/stickers/">See the stickers</a></div>
    <div class="panel blue"><span class="kicker">Prints</span><h3>Pop art for your wall</h3><p>Art prints in the Love, Freedom and Joy themes.</p><a class="btn" href="/prints/">See the prints</a></div>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><div><h2>Cards</h2><p>Collectible POPART cards. Pick a tribe, find the rare ones, trade with friends.</p></div><a class="link-more" href="/cards/">All cards &rarr;</a></div>
  {tribe_cards(3)}
</div></section>

<section class="section"><div class="container">
  <div class="split">
    <div class="panel pink">
      <span class="kicker">The idea</span>
      <h2>Pop art that feels good</h2>
      <p>Bright colours, bold black outlines and simple, happy subjects. No fine print, no hidden meaning: just art that makes a wall, a shelf or a day a bit better.</p>
      <a class="btn yellow" href="/studio/">Meet the studio</a>
    </div>
    <div class="panel yellow">
      <span class="kicker">Collect</span>
      <h2>Cards to collect and swap</h2>
      <p>Pick a tribe, find the rare ones and trade with friends. Flip a card to see its back.</p>
      <a class="btn" href="/cards/">See the cards</a>
    </div>
  </div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><div><h2>Shop</h2><p>Cards, sleeves, magnetic cardholders and framed originals.</p></div><a class="link-more" href="/shop/">Open shop &rarr;</a></div>
  <div class="grid g4">{shop_cards(limit=4)}</div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><div><h2>News</h2><p>What is new in the studio.</p></div><a class="link-more" href="/news/">All news &rarr;</a></div>
  <div class="grid g2">{news_cards()}</div>
</div></section>
"""
    page("", "", "POPART.love: new pop art in a thick-outline graffiti style. Collectible cards, stickers, prints and a shop. Love, Freedom and Joy.", home)

    # ---- Verify
    verify = page_head("Verify my card", "Type the code from the back of your card to check that it is a real POPART card.") + f"""
<section class="section"><div class="container">
  <div class="split wide-left">
    <div class="panel">
      <h2>Check a card code</h2>
      <form id="verify-form" class="verify-form" novalidate>
        <label for="v-code">Card code</label>
        <input id="v-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" placeholder="8BNK-CW4K">
        <label for="v-holder">Holder number (optional)</label>
        <input id="v-holder" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="5 digits, on the certificate and mount card">
        <button class="btn" type="submit">Verify my card</button>
      </form>
      <div id="v-result" class="verify-result" role="status" hidden></div>
    </div>
    <div class="prose">
      <h2>Where to find the code</h2>
      <p>Every numbered card has its own card code on the back, bottom right, a mix of letters and numbers like <strong>8BNK-CW4K</strong>. It also sits on the certificate and the mount card. You only need the code. The printed number such as 001/100 is not used, because anyone can copy a number, while a code can only be made by the artist. Open edition cards have no code.</p>
      <h2>What the check does</h2>
      <ol>
        <li>It looks for the code in the artist's private code system.</li>
        <li>It tells you which card and which copy number the code belongs to.</li>
        <li>If you also type the 5 digit holder number from the certificate and mount card, it checks that too. Only the holder of the card has that number.</li>
        <li>It shows if the copy is on the artist's list of sold cards, and how often the code has been checked, so you can spot a code that is used again and again.</li>
      </ol>
      <p class="notice">Not found? Check the letters again. Still not found? Ask the artist at the <a href="/popup/">next event</a> or through the <a href="/studio/">Studio page</a>.</p>
    </div>
  </div>
</div></section>
<script src="/assets/js/verify.js" defer></script>"""
    page("verify", "Verify my card", "Verify a POPART card with the code printed on its back.", verify, "/verify/")

    # ---- POPPLAY
    popplay = page_head("POPPLAY", "A two minute card game for two collectors. Collecting stays the main thing.") + f"""
<section class="section"><div class="container">
  <div class="split wide-left">
    <div class="prose">
      <span class="kicker">Bonus game</span>
      <h2>What is POPPLAY?</h2>
      <p>A small extra for when two collectors meet. It takes two minutes, with no board and no reading. You only need a stack of cards each. You can play with the cards you have, and if you like, for keeps.</p>
      <p>Each card carries a rarity, a tribe and a serial number. Those three things decide who wins a round.</p>
    </div>
    <div class="panel yellow">
      <h3>Quick facts</h3>
      <ul style="padding-left:1.1rem;margin:0">
        <li>2 players</li>
        <li>A stack of 5 cards each</li>
        <li>About 2 minutes</li>
        <li>Backs face up, nothing to see</li>
      </ul>
    </div>
  </div>
</div></section>

<section class="section"><div class="container">
  <h2>How a game goes</h2>
  <ol class="steps">
    <li><strong>Take a stack.</strong> Each player holds a stack of 5 cards with the backs facing up. The back shows only the artwork and the name, so nobody knows what is coming. Use cards you can afford to lose if you play for keeps.</li>
    <li><strong>Count 3, 2, 1, POP.</strong> Both players count out loud and, on POP, flip the top card of their stack face up on the table at the same time. The front shows rarity, tribe and serial.</li>
    <li><strong>See who wins.</strong> The stronger card wins the round, see the rules below. The winner takes both cards.</li>
    <li><strong>Repeat.</strong> Play until the stacks are empty. The player with the most cards wins the game. Two players can also play a quick best of 5.</li>
  </ol>
</div></section>

<section class="section"><div class="container">
  <div class="split">
    <div>
      <h2>Who wins a round</h2>
      <p>Check these in order and stop at the first one that decides it.</p>
      <ol class="steps">
        <li><strong>Rarity.</strong> The rarer card wins: Common, Uncommon, Rare, Super Rare, Ultra Rare, Unique.</li>
        <li><strong>Tribe.</strong> Same rarity? Love beats Freedom, Freedom beats Joy, Joy beats Love.</li>
        <li><strong>Serial.</strong> Same tribe too? The lower serial wins, so 001 beats 100. An open card loses to a numbered one.</li>
        <li><strong>Still equal?</strong> Both players take their card back and play the round again.</li>
      </ol>
    </div>
    <div>
      <h2>Example round</h2>
      <p>Both players flip a card on POP. <strong>Paper Plane</strong> is Super Rare and <strong>Big Heart</strong> is Common, so rarity decides it and the Paper Plane wins.</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:1rem">
        <figure class="card cardfig-plain" style="margin:0;padding:1rem;align-items:center"><img src="/assets/img/cards/paper-plane.webp" alt="Paper Plane card, Super Rare" width="600" height="840" loading="lazy" style="width:100%;max-width:200px;border-radius:4.5%"><figcaption class="tag stock ok" style="margin-top:.7rem">Super Rare wins</figcaption></figure>
        <figure class="card cardfig-plain" style="margin:0;padding:1rem;align-items:center"><img src="/assets/img/cards/big-heart.webp" alt="Big Heart card, Common" width="600" height="840" loading="lazy" style="width:100%;max-width:200px;border-radius:4.5%"><figcaption class="tag" style="margin-top:.7rem">Common</figcaption></figure>
      </div>
    </div>
  </div>
</div></section>

<section class="section"><div class="container">
  <h2>Rules and twists</h2>
  <div class="grid g3">
    <div class="panel pink"><h3>For fun or for keeps</h3><p><strong>For fun:</strong> everybody gets their own cards back at the end and you only count who won the most rounds.</p><p><strong>For keeps:</strong> the winner of each round really keeps both cards. Agree on this before you start.</p></div>
    <div class="panel blue"><h3>Playing a Trio</h3><p>Own the same series and the same rarity in all three tribes, Love, Freedom and Joy? Lay all three cards down as one card. A Trio counts as a Unique, so it beats everything except another Trio or a Unique, and then the lower serial wins.</p></div>
    <div class="panel yellow"><h3>Two extra twists</h3><p><strong>Streak bonus:</strong> win 3 rounds in a row and you also take the top card of your opponent's stack. Then your streak starts again at zero.</p><p><strong>One swap:</strong> once per game, before you count, say SWAP and trade your top card with the next card in your own stack. You cannot see it first. Each player gets one swap.</p></div>
  </div>
  <p class="notice" style="margin-top:1.4rem"><strong>Trading still works as before.</strong> Same icon swaps 1 for 1, other icons need several cards. <a href="/cards/">See the cards and the trading rules</a>.</p>
</div></section>"""
    page("popplay", "POPPLAY", "How to play POPPLAY: a two minute, two player card game with POPART cards. Rarity, tribe and serial decide each round.", popplay, "/cards/")

    # ---- Stickers and Prints
    def soon_card(art):
        fn, _b, title, theme, blurb = art
        name, cls, _ = THEME_ICON[theme]
        return f"""<article class="card">
  <figure><img src="/assets/img/{fn}.svg" alt="{escape(title)}" width="400" height="400" loading="lazy"></figure>
  <div class="body"><div class="tags"><span class="tag {cls}">{name}</span><span class="tag soon">Coming soon</span></div><h3>{escape(title)}</h3><p>{escape(blurb)}</p></div>
</article>"""

    stickers = page_head("Stickers", "Pop art stickers with thick black outlines. Stick them on a laptop, a bike or a notebook.") + f"""
<section class="section"><div class="container">
  <p class="notice" data-catalog-notice><strong>Coming soon.</strong> The stickers below are draft designs with placeholder art. Sizes, prices and ordering will be announced in the news.</p>
  <h2 style="margin-top:2rem">Sticker designs</h2>
  <div class="grid g3" data-kind="stickers">{"".join(soon_card(a) for a in ARTWORKS[:3])}</div>
</div></section>
<script src="/assets/js/catalog.js" defer></script>"""
    page("stickers", "Stickers", "POPART.love pop art stickers in the Love, Freedom and Joy themes.", stickers, "/stickers/")

    prints = page_head("Prints", "Pop art prints for your wall, in the three themes: Love, Freedom and Joy.") + f"""
<section class="section"><div class="container">
  <p class="notice" data-catalog-notice><strong>Coming soon.</strong> The prints below are draft designs with placeholder art. Sizes, prices and ordering will be announced in the news.</p>
  <h2 style="margin-top:2rem">Print designs</h2>
  <div class="grid g3" data-kind="prints">{"".join(soon_card(a) for a in ARTWORKS[3:])}</div>
</div></section>
<script src="/assets/js/catalog.js" defer></script>"""
    page("prints", "Prints", "POPART.love pop art prints in the Love, Freedom and Joy themes.", prints, "/prints/")

    # ---- Cards
    series_rows = "".join(f"<tr><td><strong>{n}</strong></td><td>{d}</td></tr>" for n, d in SERIES)
    series_rows += "<tr><td><strong>Unique 1/1</strong></td><td>One card, one owner, ever. Sold with a certificate card and can come in a small art frame.</td></tr>"
    rar = [("#8a8a8a","Common","Open edition"),("#2bb3a3","Uncommon","Numbered of 500"),("#f97316","Rare","Numbered of 100"),("#a78bfa","Super Rare","Numbered of 50"),("#e0b43a","Ultra Rare","Numbered of 21"),("#0a0a0a","Unique 1/1","One of one")]
    rarity_rows = "".join(f'<tr><td><span class="dot" style="background:{c}"></span><strong>{n}</strong></td><td>{d}</td></tr>' for c, n, d in rar)
    cards = page_head("Cards", "POPART collectible cards: pop art you can collect, swap and keep. All kinds of art, one big collection.") + f"""
<section class="section"><div class="container">
  <p class="notice"><strong>New cards land here.</strong> Every card made with the POPART Card Maker and added to the collection shows up below, newest first. Some cards still use draft art.</p>
  <h2 style="margin-top:2rem">Available cards</h2>
  {tribe_cards()}
</div></section>

<section class="section"><div class="container">
  <div class="split">
    <div>
      <h2>Pick a tribe</h2>
      <p>Every card carries one theme sign: <strong>Love</strong> (heart), <strong>Freedom</strong> (paper plane) or <strong>Joy</strong> (sun). The sign is your tribe.</p>
      <p>The card back is the same for every card, so nobody can see what you hold.</p>
    </div>
    <div>
      <h2>Series</h2>
      <div class="table-wrap"><table class="simple"><thead><tr><th>Series</th><th>What it means</th></tr></thead><tbody>{series_rows}</tbody></table></div>
      <h2 style="margin-top:1.6rem">Rarity ladder</h2>
      <div class="table-wrap"><table class="simple"><thead><tr><th>Rarity</th><th>Print run</th></tr></thead><tbody>{rarity_rows}</tbody></table></div>
    </div>
  </div>
</div></section>

<section class="section"><div class="container">
  <h2>How trading works</h2>
  <ol class="steps">
    <li><strong>Same tribe, fair swap.</strong> A card trades one-for-one against a card with the same theme sign.</li>
    <li><strong>Other tribes, more cards.</strong> To get a card from another tribe, offer more cards. The rarer the card you want, the more cards you need.</li>
    <li><strong>Keep the rare ones.</strong> Signed, Legend and 1/1 Unique cards are the ones people chase.</li>
  </ol>
</div></section>

<section class="section"><div class="container">
  <div class="panel yellow">
    <span class="kicker">Bonus</span>
    <h2>POPPLAY: the 10-second game</h2>
    <p>Two players, one stack each. Count down together, <strong>3, 2, 1, POP</strong>, and put a card on the table. The higher card wins the round. That is the whole game, so it fits in any pocket and any break.</p>
    <a class="btn" href="/popplay/">How to play POPPLAY</a>
  </div>
  <div class="panel pink" style="margin-top:1.2rem">
    <span class="kicker">Collectors</span>
    <h2>Verify my card</h2>
    <p>Got a numbered card? Check its serial against the print run and the artist's list of sold cards.</p>
    <a class="btn" href="/verify/">Verify my card</a>
  </div>
</div></section>"""
    page("cards", "Cards", "POPART collectible pop art cards. Three tribes (Love, Freedom, Joy), rare series and one-of-a-kind cards.", cards, "/cards/")

    # ---- Shop
    shop = page_head("Shop", "Everything to collect, protect and show off your POPART cards.") + f"""
<section class="section"><div class="container">
  <p class="notice"><strong>Cards are sold online and at events.</strong> Use the Online button on a card to buy it in the shop, or find a card at a pop-up event, see <a href="/popup/">PopUp</a> for the next one. You can pay with Bitcoin, of course. Join the newsletter in the footer to hear first.</p>
  <div class="panel yellow free-promo" style="margin-top:1.4rem">
    <h2>Free downloads</h2>
    <p>Wallpapers, coloring pages, printables and more. Free for everyone who loves pop art.</p>
    <a class="btn yellow" href="/free/">See the free downloads</a>
  </div>
  <h2 style="margin-top:2rem" id="digital">Digital downloads</h2>
  <p>Print them at home. Free files download straight away. For paid files, buy with the Buy button and use the download code you get from the artist.</p>
  <div class="grid g3" id="digital-grid"><p class="notice" style="grid-column:1/-1">Digital sticker and print files will be listed here.</p></div>
  <div class="panel" style="margin-top:1.2rem">
    <h3>Bought a digital file? Enter your download code</h3>
    <form id="dl-form" class="dl-form" novalidate>
      <input id="dl-code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="14" placeholder="ABCD-EFGH-JKLM" aria-label="Download code">
      <button class="btn" type="submit">Download</button>
    </form>
    <p class="form-msg" id="dl-result" role="status"></p>
  </div>
  <h2 style="margin-top:2rem">All cards</h2>
  {tribe_cards(in_shop=True)}
  <h2 style="margin-top:2.4rem">More for collectors</h2>
  <div class="grid g3">{shop_cards()}</div>
</div></section>
<script src="/assets/js/dl.js" defer></script>"""
    page("shop", "Shop", "POPART.love shop: collectible pop art cards, sleeves, magnetic cardholders and framed one-of-a-kind cards.", shop, "/shop/")

    # ---- Free downloads (filled from the admin list)
    free = page_head("Free downloads", "Free pop art for everyone: wallpapers, printables and more. Download, enjoy, share.") + """
<section class="section"><div class="container">
  <div class="tags" id="free-filters" role="group" aria-label="Categories"></div>
  <div class="grid g3" id="free-grid" style="margin-top:1.2rem"><p class="notice" style="grid-column:1/-1"><strong>Coming soon.</strong> Free downloads will land here. Join the newsletter in the footer to hear first.</p></div>
  <p class="notice" style="margin-top:1.6rem">Free to use for yourself. Please do not sell the files or claim them as your own. Want more? <a href="/shop/">Visit the shop</a>.</p>
</div></section>
<script src="/assets/js/free.js" defer></script>"""
    page("free", "Free downloads", "Free pop art downloads from POPART.love: wallpapers, coloring pages, printables and more.", free, "/free/")

    # ---- News
    news = page_head("News", "What is happening in the POPART studio.") + f"""
<section class="section"><div class="container">
  <div class="grid g2">{news_cards()}</div>
</div></section>"""
    page("news", "News", "News from the POPART.love studio: new art, new cards and shop updates.", news, "/news/")

    # ---- Studio
    artist = page_head("Studio", "POPART.love is the fan page of the studio BitPopArt.") + f"""
<section class="section"><div class="container">
  <div class="split wide-left">
    <div class="prose">
      <h2>About BitPopArt</h2>
      <p>BitPopArt is a pop art studio. It designs and makes loud, happy art in a thick-outline graffiti style: bold colours, black lines and simple shapes, built around three plain, good ideas, <strong>Love</strong>, <strong>Freedom</strong> and <strong>Joy</strong>.</p>
      <p>The studio makes art you can hold and share: collectible cards, stickers, prints and digital files you can print at home, plus small tools and games around the art.</p>
      <h2>What POPART.love is</h2>
      <p>POPART.love is the fan page for everyone who loves pop art. It is the home of the POPART collectible cards, the Card Maker, stickers, prints, free downloads and news from the studio, so fans can collect, play, download and stay up to date in one place.</p>
      <h2>More about the artist</h2>
      <p>Want to know more about the artist behind the studio? You can find the story, the studio and more at <a href="https://bitpopart.com/artist" target="_blank" rel="noopener"><strong>bitpopart.com/artist</strong></a>, and all art works at <a href="https://bitpopart.com/art" target="_blank" rel="noopener"><strong>bitpopart.com/art</strong></a>.</p>
      <p><a class="btn" href="https://bitpopart.com/artist" target="_blank" rel="noopener">About the artist</a> <a class="btn yellow" href="https://bitpopart.com/art" target="_blank" rel="noopener">See all art works</a></p>
    </div>
    <div class="studio-side">
    <a class="studio-logo" href="https://www.bitpopart.com" target="_blank" rel="noopener" aria-label="Visit BitPopArt at bitpopart.com (opens in a new window)">
      <img src="/assets/img/bitpopart-logo.webp" alt="BitPopArt logo" width="900" height="583">
    </a>
    <div class="panel yellow">
      <h3>Studio facts</h3>
      <ul style="padding-left:1.1rem;margin:0">
        <li>Studio: <a href="https://bitpopart.com" rel="noopener">BitPopArt</a></li>
        <li>Style: thick-outline graffiti pop art</li>
        <li>Themes: Love, Freedom, Joy</li>
        <li>Artist: <a href="https://bitpopart.com/artist" rel="noopener">bitpopart.com/artist</a></li>
        <li>All art works: <a href="https://bitpopart.com/art" rel="noopener">bitpopart.com/art</a></li>
      </ul>
    </div>
    </div>
  </div>
</div></section>"""
    page("studio", "Studio", "BitPopArt studio: the pop art studio behind POPART.love, the fan page for everyone who loves pop art.", artist, "/studio/")

    # ---- PopUp
    popup = page_head("PopUp", "Live pop art: markets, exhibitions and pop-up shops.") + """
<section class="section"><div class="container">
  <h2>Upcoming events</h2>
  <div class="event-grid" id="events-upcoming"><p class="notice">No events scheduled yet. Dates and places will be listed here.</p></div>
  <h2 style="margin-top:2.4rem">Past events</h2>
  <div class="event-grid" id="events-past"></div>
</div></section>
<section class="section"><div class="container">
  <div class="split">
    <div class="panel">
      <h2>Your market, shop or festival?</h2>
      <p>Want POPART at your market, shop or festival? Use the newsletter below and we will be in touch, or ask at the next event.</p>
    </div>
    <div class="panel pink">
      <h2>What a PopUp looks like</h2>
      <p>Originals on the wall, cards on the table, sleeves and cardholders in reach, and a few cards to swap on the spot.</p>
    </div>
  </div>
</div></section>
<script src="/assets/js/events.js" defer></script>"""
    page("popup", "PopUp", "POPART.love pop-up events: markets, exhibitions and pop-up shops with art and collectible cards.", popup, "/popup/")

    # ---- Admin (looks like a 404 to everyone; admin.js reveals the editor only for the owner key)
    admin = page_head("Page not found", "That page flew away like a paper plane.") + """
<section class="section"><div class="container" id="admin-root"><a class="btn" href="/">Back to the home page</a></div></section>
<script src="/assets/js/cards-admin.js" defer></script>
<script src="/assets/js/events-admin.js" defer></script>
<script src="/assets/js/catalog-admin.js" defer></script>
<script src="/assets/js/admin.js" defer></script>"""
    page("admin", "Page not found", "Page not found.", admin, "/admin/", noindex=True)

    # ---- 404
    nf = page_head("Page not found", "That page flew away like a paper plane.") + """
<section class="section"><div class="container"><a class="btn" href="/">Back to the home page</a></div></section>"""
    page("404-tmp", "Not found", "Page not found.", nf, "")
    # 404 must live at /404.html for Cloudflare Pages
    src = os.path.join(ROOT, "404-tmp", "index.html")
    os.replace(src, os.path.join(ROOT, "404.html"))
    os.rmdir(os.path.join(ROOT, "404-tmp"))
    pages_written.remove("/404-tmp/")


SHOP_ITEMS = [
    ("cards/big-heart", "POPART cards", "love", "Single collectible cards from the Masterpiece, Signed and Legend series."),
    ("cards/paper-plane", "Card sleeves", "freedom", "Keep your cards clean and sharp."),
    ("cards/sunny-face", "Magnetic cardholders", "joy", "Show your best card on the wall or the desk."),
    ("love-two-hearts", "Framed 1/1 Unique", "love", "A one-of-a-kind card in a small art frame, with certificate card and mount card."),
]


def shop_fig(fn, title):
    if fn.startswith("cards/"):
        return f'<figure class="cardfig"><img src="/assets/img/{fn}.webp" alt="{escape(title)}" width="600" height="840" loading="lazy"></figure>'
    return f'<figure><img src="/assets/img/{fn}.svg" alt="{escape(title)}" width="400" height="400" loading="lazy" style="object-fit:cover;aspect-ratio:1/1;width:100%"></figure>'


def shop_cards(limit=None):
    items = SHOP_ITEMS[:limit] if limit else SHOP_ITEMS
    out = ""
    for fn, title, theme, blurb in items:
        cls = THEME_ICON[theme][1]
        out += f"""<article class="card">{shop_fig(fn, title)}
<div class="body"><span class="tag soon">Coming soon</span><h3>{escape(title)}</h3><p>{escape(blurb)}</p></div></article>"""
    return out


NEWS_ITEMS = [
    ("2026-11-10", "Welcome to POPART.love", "A new home for pop art about Love, Freedom and Joy. Art, cards and a shop are on the way."),
    ("2026-11-10", "POPART cards: three tribes, three series", "Every card carries a Love, Freedom or Joy sign and belongs to the Masterpiece, Signed or Legend series. Unique 1/1 cards come on top."),
]


def news_cards():
    out = ""
    for d, t, b in NEWS_ITEMS:
        out += f'<article class="card"><div class="body"><time datetime="{d}" class="tag soon">{d}</time><h3>{escape(t)}</h3><p>{escape(b)}</p></div></article>'
    return out


def build_meta():
    pages_written.append("/cards/maker/")  # static page: cards/maker/index.html
    urls = "".join(
        f"  <url><loc>{DOMAIN}{p}</loc><lastmod>{TODAY}</lastmod></url>\n" for p in sorted(set(pages_written))
    )
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    write("_redirects", "/artist/ /studio/ 301\n/artist /studio/ 301\n")
    write("robots.txt", f"User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: {DOMAIN}/sitemap.xml\n")
    write("CNAME", "popart.love\n")
    write(
        "_headers",
        """/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: no-cache
""",
    )


if __name__ == "__main__":
    build_images()
    build_cards_json()
    build_pages()
    build_meta()
    print(f"Built {len(set(pages_written))} pages:")
    for p in sorted(set(pages_written)):
        print("  ", p)
