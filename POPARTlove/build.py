#!/usr/bin/env python3
"""POPART.love site generator.

Run from this folder:  python3 build.py
Writes the static pages (index.html, art/index.html, ...), the SVG artwork in
assets/img/, sitemap.xml and robots.txt. No dependencies beyond Python 3.

Edit the PAGES / content below, re-run, deploy the folder.
"""
import math
import os
from html import escape

ROOT = os.path.dirname(os.path.abspath(__file__))
DOMAIN = "https://popart.love"
TODAY = "2026-11-10"

INK = "#111111"
LOVE = "#ff2e7e"
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


CARDS = [
    ("card-love", art_love_1, "love", "Big Heart", "Masterpiece", "001"),
    ("card-freedom", art_freedom_1, "freedom", "Paper Plane", "Signed", "002"),
    ("card-joy", art_joy_1, "joy", "Sunny Face", "Legend", "003"),
]


def build_images():
    # assets/img/logo.svg is the uploaded Love icon; do not regenerate it here
    write("assets/img/favicon.svg", favicon_svg())
    for fn, builder, title, theme, blurb in ARTWORKS:
        write(f"assets/img/{fn}.svg", builder())
    for fn, builder, theme, title, series, number in CARDS:
        write(f"assets/img/{fn}.svg", card_svg(builder, theme, title, series, number))


# ------------------------------------------------------------------- HTML --

NAV = [
    ("News", "/news/"),
    ("Artist", "/artist/"),
    ("PopUp", "/popup/"),
    ("Art", "/art/"),
    ("Cards", "/cards/"),
    ("Projects", "/projects/"),
    ("Fundraising", "/fundraising/"),
    ("Shop", "/shop/"),
]

TILES = [
    ("Art", "/art/", "\U0001F3A8", "c-pink"),
    ("Cards", "/cards/", "\U0001F0CF", "c-yellow"),
    ("Shop", "/shop/", "\U0001F6CD️", "c-blue"),
    ("News", "/news/", "\U0001F4F0", "c-mint"),
    ("Artist", "/artist/", "\U0001F58C️", "c-orange"),
    ("PopUp", "/popup/", "\U0001F4CD", "c-purple"),
    ("Projects", "/projects/", "\U0001F6E0️", "c-lime"),
    ("Support", "/fundraising/", "\U0001F49B", "c-red"),
]

FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet">'
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
      <span class="brand-word">POPART<b>.love</b></span>
    </a>
    <ul class="nav-links">{items}</ul>
    <div class="nav-actions">
      <button class="icon-btn" id="theme-btn" type="button" aria-label="Switch to dark mode">&#9790;</button>
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
          <span class="brand-word">POPART<b>.love</b></span>
        </a>
        <p class="tagline" style="margin-top:.8rem">Love, Freedom &amp; Joy. Pop art with thick lines and a big heart.</p>
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
      &copy; 2026 POPART.love &middot; made by Johannes Oppewal &middot; all artwork &copy; the artist
    </div>
  </div>
</footer>
<script src="/assets/js/site.js" defer></script>"""


def page(path, title, desc, body, current=None, head_class=None):
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
<meta property="og:type" content="website">
<meta property="og:title" content="{escape(full_title)}">
<meta property="og:description" content="{escape(desc)}">
<meta property="og:url" content="{DOMAIN}{url_path}">
<meta name="theme-color" content="#ffd400">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
{FONTS}
<link rel="stylesheet" href="/assets/css/style.css">
<script>try{{var t=localStorage.getItem("popart-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark")}}catch(e){{}}</script>
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
    out = "index.html" if path == "" else f"{path}/index.html"
    write(out, html)
    pages_written.append(url_path)


def page_head(title, text):
    return f'<section class="page-head"><div class="container"><h1>{escape(title)}</h1><p>{text}</p></div></section>'


def art_card(fn, title, theme, blurb):
    name, cls, _ = THEME_ICON[theme]
    return f"""<article class="card">
  <figure><img src="/assets/img/{fn}.svg" alt="{escape(title)}: {escape(blurb)}" width="400" height="400" loading="lazy"></figure>
  <div class="body"><span class="tag {cls}">{name}</span><h3>{escape(title)}</h3><p>{escape(blurb)}</p></div>
</article>"""


def tribe_cards():
    return f"""<div class="grid g3">
{''.join(f'''<article class="card"><figure style="background:transparent;border:0;padding:1rem 1rem 0"><img src="/assets/img/{fn}.svg" alt="POPART {escape(title)} trading card, {series} series" width="500" height="700" loading="lazy"></figure>
<div class="body"><span class="tag {THEME_ICON[theme][1]}">{THEME_ICON[theme][0]}</span><h3>{escape(title)}</h3><p>{series} series, card {number}.</p></div></article>''' for fn, _b, theme, title, series, number in CARDS)}
</div>"""


RIBBON = (
    '<div class="ribbon" aria-hidden="true"><span>'
    + "".join(f"LOVE<b>&#10084;</b>FREEDOM<b>&#9733;</b>JOY<b>&#9728;</b>" for _ in range(6))
    + "</span></div>"
)

# ----------------------------------------------------------------- PAGES --

def build_pages():
    # ---- Home
    tiles = "".join(
        f'<a class="tile" href="{h}"><div class="ico {c}">{i}</div><span class="lbl">{n}</span></a>'
        for n, h, i, c in TILES
    )
    art4 = "".join(art_card(a[0], a[2], a[3], a[4]) for a in ARTWORKS[:4])
    home = f"""
<section class="hero">
  <div class="container hero-inner">
    <div>
      <span class="kicker">New pop art. Thick lines.</span>
      <h1><span class="l">Love</span>, <span class="f">Freedom</span> &amp; <span class="j">Joy</span></h1>
      <p class="lead">POPART.love is a home for loud, happy, hand-made pop art: paintings, collectible cards and good vibes you can hold. Three themes, one big heart.</p>
      <div class="hero-actions">
        <a class="btn" href="/art/">See the art</a>
        <a class="btn yellow" href="/cards/">Collect the cards</a>
        <a class="btn blue" href="/shop/">Visit the shop</a>
      </div>
    </div>
    <div class="hero-art"><img src="/assets/img/love-big-heart.svg" alt="Pop art painting of a big pink heart on a yellow starburst" width="400" height="400"></div>
  </div>
</section>
{RIBBON}
<div class="container tiles-wrap"><nav class="tiles" aria-label="Sections">{tiles}</nav></div>

<section class="section"><div class="container">
  <div class="section-head"><div><h2>Art</h2><p>Fresh work in the thick-outline graffiti style. Each piece belongs to Love, Freedom or Joy.</p></div><a class="link-more" href="/art/">All art &rarr;</a></div>
  <div class="grid g4">{art4}</div>
</div></section>

<section class="section"><div class="container">
  <div class="section-head"><div><h2>Cards</h2><p>Collectible POPART cards. Pick a tribe, find the rare ones, trade with friends.</p></div><a class="link-more" href="/cards/">All cards &rarr;</a></div>
  {tribe_cards()}
</div></section>

<section class="section"><div class="container">
  <div class="split">
    <div class="panel pink">
      <span class="kicker">The idea</span>
      <h2>Pop art that feels good</h2>
      <p>Bright colours, bold black outlines and simple, happy subjects. No fine print, no hidden meaning: just art that makes a wall, a shelf or a day a bit better.</p>
      <a class="btn yellow" href="/artist/">Meet the artist</a>
    </div>
    <div class="panel yellow">
      <span class="kicker" style="background:#111">Coming up</span>
      <h2>Projects in the studio</h2>
      <p>A card maker, a quick two-player card game, framed one-of-a-kind pieces and more. Follow along as it grows.</p>
      <a class="btn" href="/projects/">See projects</a>
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
    page("", "", "POPART.love: new pop art in a thick-outline graffiti style. Art, collectible cards, projects and a shop. Love, Freedom and Joy.", home)

    # ---- Art
    allart = "".join(art_card(a[0], a[2], a[3], a[4]) for a in ARTWORKS)
    art = page_head("Art", "Pop art in thick outlines. Every piece belongs to one of three themes: Love, Freedom or Joy.") + f"""
<section class="section"><div class="container">
  <p class="notice"><strong>Placeholder artwork.</strong> These six pieces are stand-ins so the layout can be reviewed. Replace the files in <code>assets/img/</code> and the entries in <code>build.py</code> with the real paintings.</p>
  <h2 style="margin-top:2rem">Themes</h2>
  <div class="grid g3" style="margin-bottom:2.4rem">
    <div class="panel pink"><h3>Love</h3><p>Hearts, hugs and everything warm.</p></div>
    <div class="panel blue"><h3>Freedom</h3><p>Wings, planes and open space.</p></div>
    <div class="panel yellow"><h3>Joy</h3><p>Suns, flowers and big smiles.</p></div>
  </div>
  <h2>Gallery</h2>
  <div class="grid g3">{allart}</div>
</div></section>"""
    page("art", "Art", "Pop art gallery in a thick-outline graffiti style. Themes: Love, Freedom and Joy.", art, "/art/")

    # ---- Cards
    series_rows = "".join(f"<tr><td><strong>{n}</strong></td><td>{d}</td></tr>" for n, d in SERIES)
    series_rows += "<tr><td><strong>1/1 Unique</strong></td><td>One card, one owner, ever. Sold with a certificate card and can come in a small art frame.</td></tr>"
    cards = page_head("Cards", "POPART collectible cards: pop art you can collect, swap and keep. All kinds of art, one big collection.") + f"""
<section class="section"><div class="container">
  <p class="notice"><strong>Draft cards.</strong> The three cards below use placeholder art. Final card art, numbering and availability will be announced in the news.</p>
  <h2 style="margin-top:2rem">The first three</h2>
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
      <h2>Rare and unique</h2>
      <div class="table-wrap"><table class="simple"><thead><tr><th>Series</th><th>What it means</th></tr></thead><tbody>{series_rows}</tbody></table></div>
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
  </div>
</div></section>"""
    page("cards", "Cards", "POPART collectible pop art cards. Three tribes (Love, Freedom, Joy), rare series and one-of-a-kind cards.", cards, "/cards/")

    # ---- Shop
    shop = page_head("Shop", "Everything to collect, protect and show off your POPART cards.") + f"""
<section class="section"><div class="container">
  <p class="notice"><strong>Opening soon.</strong> Products, prices and checkout will appear here when the shop opens. Join the newsletter in the footer to hear first.</p>
  <div class="grid g3" style="margin-top:1.6rem">{shop_cards()}</div>
</div></section>"""
    page("shop", "Shop", "POPART.love shop: collectible pop art cards, sleeves, magnetic cardholders and framed one-of-a-kind cards.", shop, "/shop/")

    # ---- News
    news = page_head("News", "What is happening in the POPART studio.") + f"""
<section class="section"><div class="container">
  <div class="grid g2">{news_cards()}</div>
</div></section>"""
    page("news", "News", "News from the POPART.love studio: new art, new cards and shop updates.", news, "/news/")

    # ---- Artist
    artist = page_head("Artist", "Johannes Oppewal, pop artist.") + f"""
<section class="section"><div class="container">
  <div class="split wide-left">
    <div class="prose">
      <h2>Hi, I am Johannes</h2>
      <p>I am a designer and artist. I paint and design in a thick-outline graffiti pop art style: loud colours, black lines, simple shapes.</p>
      <p>POPART.love is where that style meets three plain, good ideas: <strong>Love</strong>, <strong>Freedom</strong> and <strong>Joy</strong>. No complicated story. Just art that is made to be happy.</p>
      <p>I like art you can actually hold: cards, prints and frames.</p>
      <p><a class="btn" href="/art/">See the art</a></p>
    </div>
    <div class="panel yellow">
      <h3>Quick facts</h3>
      <ul style="padding-left:1.1rem;margin:0">
        <li>Style: thick-outline graffiti pop art</li>
        <li>Themes: Love, Freedom, Joy</li>
        <li>Also: <a href="https://bitpopart.com" rel="noopener">BitPopArt</a></li>
      </ul>
    </div>
  </div>
</div></section>"""
    page("artist", "Artist", "Meet Johannes Oppewal, pop artist. Thick-outline graffiti pop art about Love, Freedom and Joy.", artist, "/artist/")

    # ---- PopUp
    popup = page_head("PopUp", "Live pop art: markets, exhibitions and pop-up shops.") + """
<section class="section"><div class="container">
  <div class="split">
    <div class="panel">
      <h2>Upcoming</h2>
      <p>No events scheduled yet. Dates and places will be listed here, with a map link and opening hours.</p>
      <p class="notice">Want POPART at your market, shop or festival? Use the newsletter below and we will be in touch, or ask at the next event.</p>
    </div>
    <div class="panel pink">
      <h2>What a PopUp looks like</h2>
      <p>Originals on the wall, cards on the table, sleeves and cardholders in reach, and a few cards to swap on the spot.</p>
    </div>
  </div>
</div></section>"""
    page("popup", "PopUp", "POPART.love pop-up events: markets, exhibitions and pop-up shops with art and collectible cards.", popup, "/popup/")

    # ---- Projects
    projects = page_head("Projects", "What is being made in the studio right now.") + """
<section class="section"><div class="container">
  <div class="grid g2">
    <article class="card"><div class="body"><span class="tag love">Cards</span><h3>POPART Cards</h3><p>Collectible pop art cards in three tribes and three series, plus 1/1 Unique cards. <a href="/cards/">More about cards</a>.</p></div></article>
    <article class="card"><div class="body"><span class="tag joy">Tool</span><h3>POPART Card Maker</h3><p>A simple tool to design cards for the collection, with themes, series, numbering and one standard card back.</p><span class="tag soon">In progress</span></div></article>
    <article class="card"><div class="body"><span class="tag freedom">Game</span><h3>POPPLAY</h3><p>A two-player game with the same cards: count 3, 2, 1, POP and the higher card wins.</p><span class="tag soon">In progress</span></div></article>
    <article class="card"><div class="body"><span class="tag love">Frames</span><h3>Framed 1/1 Unique</h3><p>A small art frame for one-of-a-kind cards, with a certificate card and a mount card.</p><span class="tag soon">Planned</span></div></article>
    <article class="card"><div class="body"><span class="tag joy">Art</span><h3>New graffiti pop art</h3><p>A growing series of thick-outline paintings about Love, Freedom and Joy.</p><span class="tag soon">Ongoing</span></div></article>
  </div>
</div></section>"""
    page("projects", "Projects", "Projects in the POPART.love studio: collectible cards, card maker, POPPLAY game and framed one-of-a-kind cards.", projects, "/projects/")

    # ---- Fundraising / Support
    fund = page_head("Fundraising", "Help POPART grow. Every bit of support turns into more art.") + """
<section class="section"><div class="container">
  <div class="split">
    <div class="prose">
      <h2>Ways to help</h2>
      <ul>
        <li><strong>Collect.</strong> Buy cards and art. It is the best way to keep the studio running.</li>
        <li><strong>Share.</strong> Show a friend a card, post a painting, tell somebody.</li>
        <li><strong>Subscribe.</strong> The newsletter is free and helps plan what to make next.</li>
        <li><strong>Invite.</strong> Bring a PopUp to your market or shop.</li>
      </ul>
    </div>
    <div class="panel yellow">
      <h2>Campaigns</h2>
      <p>No campaign is running at the moment. When one starts (a print run, a frame series, a new painting) it will be listed here with a goal and a progress bar.</p>
    </div>
  </div>
</div></section>"""
    page("fundraising", "Fundraising", "Support POPART.love: collect, share, subscribe or bring a pop-up to your event.", fund, "/fundraising/")

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
    ("card-love", "POPART cards", "love", "Single collectible cards from the Masterpiece, Signed and Legend series."),
    ("card-freedom", "Card sleeves", "freedom", "Keep your cards clean and sharp."),
    ("card-joy", "Magnetic cardholders", "joy", "Show your best card on the wall or the desk."),
    ("love-two-hearts", "Framed 1/1 Unique", "love", "A one-of-a-kind card in a small art frame, with certificate card and mount card."),
]


def shop_cards(limit=None):
    items = SHOP_ITEMS[:limit] if limit else SHOP_ITEMS
    out = ""
    for fn, title, theme, blurb in items:
        cls = THEME_ICON[theme][1]
        out += f"""<article class="card"><figure><img src="/assets/img/{fn}.svg" alt="{escape(title)}" width="400" height="400" loading="lazy" style="object-fit:cover;aspect-ratio:1/1;width:100%"></figure>
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
    urls = "".join(
        f"  <url><loc>{DOMAIN}{p}</loc><lastmod>{TODAY}</lastmod></url>\n" for p in sorted(set(pages_written))
    )
    write("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {DOMAIN}/sitemap.xml\n")
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
    build_pages()
    build_meta()
    print(f"Built {len(set(pages_written))} pages:")
    for p in sorted(set(pages_written)):
        print("  ", p)
