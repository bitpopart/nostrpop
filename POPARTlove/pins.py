"""POPART Emoji Pins: the faces, the pin art and the /pins/ page body.

build.py imports this. To add a new pin when it is produced, edit PINS below:
  status "coming-soon" -> shows a Coming soon tag
  status "available"   -> shows a Buy button (needs a https url)
  status "sold-out"    -> shows a Sold out tag
Then run `python3 build.py`.
"""
from html import escape

INK = "#111111"
YELLOW = "#ffe229"

# ------------------------------------------------------------------ faces --
# Every face is drawn in a 100x100 box. The head is a circle (r 36) centred on
# (50, 56) so there is room above it for crowns, hats, halos and ears.
# Feature coordinates are relative to the head centre.

S = f'stroke="{INK}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"'


def dot_eyes(r=3.6):
    return f'<circle cx="-12" cy="-6" r="{r}" fill="{INK}"/><circle cx="12" cy="-6" r="{r}" fill="{INK}"/>'


def happy_eyes():
    return f'<path d="M-19 -3 Q-12 -13 -5 -3" fill="none" {S}/><path d="M5 -3 Q12 -13 19 -3" fill="none" {S}/>'


def closed_eyes():
    return f'<path d="M-19 -6 Q-12 0 -5 -6" fill="none" {S}/><path d="M5 -6 Q12 0 19 -6" fill="none" {S}/>'


def smile():
    return f'<path d="M-17 8 Q0 24 17 8" fill="none" {S}/>'


def frown():
    return f'<path d="M-15 19 Q0 6 15 19" fill="none" {S}/>'


def grin(teeth=True):
    line = f'<path d="M-17 13 H17" fill="none" stroke="{INK}" stroke-width="2.2"/>' if teeth else ""
    return f'<path d="M-19 6 Q0 34 19 6 Z" fill="#fff" {S}/>{line}'


def tongue():
    return f'<path d="M-6 17 Q-6 30 0 30 Q6 30 6 17 Z" fill="#ff4f6d" {S}/>'


def heart(x, y, s=1.0, fill="#ff2f5a"):
    return (f'<g transform="translate({x} {y}) scale({s})"><path d="M0 7 C-14 -3 -9 -13 0 -6 C9 -13 14 -3 0 7Z" '
            f'fill="{fill}" stroke="{INK}" stroke-width="{2.4 / s:.2f}" stroke-linejoin="round"/></g>')


def star(x, y, r=8, fill="#ffb300"):
    import math
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.45
        a = -math.pi / 2 + i * math.pi / 5
        pts.append(f"{x + rr * math.cos(a):.1f},{y + rr * math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>'


def tear(x, y):
    return f'<path d="M{x} {y - 6} Q{x + 5} {y + 1} {x} {y + 6} Q{x - 5} {y + 1} {x} {y - 6}Z" fill="#4fc3f7" stroke="{INK}" stroke-width="1.8"/>'


def x_eyes():
    out = ""
    for cx in (-12, 12):
        out += f'<path d="M{cx - 5} -11 L{cx + 5} -1 M{cx + 5} -11 L{cx - 5} -1" fill="none" {S}/>'
    return out


def brows_angry():
    return f'<path d="M-21 -17 L-6 -10" fill="none" {S}/><path d="M21 -17 L6 -10" fill="none" {S}/>'


FACES = {
    "smiley": ("Smiley", YELLOW, dot_eyes() + smile(), ""),
    "big-grin": ("Big Grin", YELLOW, dot_eyes() + grin(), ""),
    "cheeky": ("Cheeky", YELLOW, dot_eyes() + smile() + tongue(), ""),
    "lol": ("LOL", YELLOW,
            f'<path d="M-19 -13 L-6 -6 L-19 1 M19 -13 L6 -6 L19 1" fill="none" {S}/>' + grin(), ""),
    "wink": ("Wink", YELLOW,
             f'<circle cx="-12" cy="-6" r="3.6" fill="{INK}"/><path d="M5 -5 Q12 -12 19 -5" fill="none" {S}/>' + smile(), ""),
    "love-eyes": ("Love Eyes", YELLOW, heart(-12, -6, 0.95) + heart(12, -6, 0.95) + grin(), ""),
    "cool": ("Cool", YELLOW,
             f'<path d="M-24 -12 H-3 V-3 Q-3 6 -11 6 H-16 Q-24 6 -24 -3Z M24 -12 H3 V-3 Q3 6 11 6 H16 Q24 6 24 -3Z" fill="{INK}" {S}/>'
             f'<path d="M-3 -9 H3" fill="none" {S}/>' + smile(), ""),
    "sleepy": ("Sleepy", YELLOW,
               closed_eyes() + f'<path d="M-8 14 Q0 19 8 14" fill="none" {S}/>'
               + f'<text x="22" y="-22" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="15" fill="{INK}">Z</text>'
               + f'<text x="31" y="-31" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="10" fill="{INK}">z</text>', ""),
    "grumpy": ("Grumpy", "#ff5a4a", brows_angry() + dot_eyes(3.2) + frown(), ""),
    "queasy": ("Queasy", "#9ad94f",
               dot_eyes() + f'<path d="M-18 16 q5 -7 9 0 t9 0 t9 0" fill="none" {S}/>', ""),
    "brrr": ("Brrr", "#9fe0ff",
             dot_eyes() + f'<rect x="-16" y="8" width="32" height="13" rx="3" fill="#fff" {S}/>'
             + f'<path d="M-8 8 V21 M0 8 V21 M8 8 V21" stroke="{INK}" stroke-width="2.2"/>', ""),
    "sob": ("Sob", YELLOW,
            dot_eyes() + frown()
            + f'<path d="M-15 -1 Q-19 12 -17 26 Q-11 26 -10 -1Z M15 -1 Q19 12 17 26 Q11 26 10 -1Z" fill="#4fc3f7" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>', ""),
    "royal": ("Royal", YELLOW, dot_eyes() + grin(),
              f'<g transform="translate(50 26)"><path d="M-17 4 L-21 -14 L-9 -5 L0 -19 L9 -5 L21 -14 L17 4Z" fill="#ffb300" {S}/>'
              f'<circle cx="0" cy="-1" r="2.4" fill="#ff2f5a"/></g>'),
    "star-struck": ("Star Struck", YELLOW, star(-12, -6, 9) + star(12, -6, 9) + grin(), ""),
    "angel": ("Angel", YELLOW, closed_eyes() + smile(),
              f'<ellipse cx="50" cy="19" rx="17" ry="5" fill="none" stroke="#29b6f6" stroke-width="4.5"/>'),
    "cowboy": ("Cowboy", YELLOW, dot_eyes() + smile(),
               f'<g transform="translate(50 30)"><path d="M-22 -2 Q-24 -24 0 -24 Q24 -24 22 -2Z" fill="#9a6a3a" {S}/>'
               f'<path d="M-36 4 Q-22 -4 0 -2 Q22 -4 36 4 Q22 12 0 8 Q-22 12 -36 4Z" fill="#b57c44" {S}/></g>'),
    "kitty": ("Kitty", YELLOW, dot_eyes() + smile(),
              f'<path d="M-33 -12 L-33 -42 L-10 -29Z" fill="{INK}" {S} transform="translate(50 56)"/>'
              f'<path d="M33 -12 L33 -42 L10 -29Z" fill="{INK}" {S} transform="translate(50 56)"/>'),
    "shocked": ("Shocked", YELLOW,
                f'<circle cx="-12" cy="-6" r="7" fill="#fff" {S}/><circle cx="12" cy="-6" r="7" fill="#fff" {S}/>'
                f'<circle cx="-12" cy="-6" r="2.6" fill="{INK}"/><circle cx="12" cy="-6" r="2.6" fill="{INK}"/>'
                f'<ellipse cx="0" cy="17" rx="6" ry="8" fill="#ff7a9a" {S}/>', ""),
    "dizzy": ("Dizzy", YELLOW, x_eyes() + f'<path d="M-16 16 q4 -6 8 0 t8 0 t8 0" fill="none" {S}/>', ""),
    "dapper": ("Dapper", YELLOW, dot_eyes()
               + f'<path d="M-18 11 Q-9 1 0 8 Q9 1 18 11 Q9 18 0 13 Q-9 18 -18 11Z" fill="{INK}" {S}/>', ""),
    "zapped": ("Zapped", YELLOW,
               f'<circle cx="-12" cy="-6" r="8" fill="#fff" {S}/><circle cx="12" cy="-6" r="8" fill="#fff" {S}/>'
               f'<path d="M-10 -13 L-15 -5 H-11 L-13 2 L-7 -7 H-11Z M14 -13 L9 -5 H13 L11 2 L17 -7 H13Z" fill="{INK}"/>' + grin(), ""),
    "joy-tears": ("Tears of Joy", YELLOW, happy_eyes() + grin() + tear(-27, 4) + tear(27, 4), ""),
    "shy": ("Shy", YELLOW,
            happy_eyes() + f'<path d="M-8 14 Q0 20 8 14" fill="none" {S}/>'
            + '<ellipse cx="-21" cy="8" rx="7" ry="4" fill="#ff6fa5" fill-opacity=".75"/><ellipse cx="21" cy="8" rx="7" ry="4" fill="#ff6fa5" fill-opacity=".75"/>', ""),
    "kiss": ("Kiss", YELLOW,
             f'<circle cx="-12" cy="-6" r="3.6" fill="{INK}"/><path d="M5 -5 Q12 -12 19 -5" fill="none" {S}/>'
             f'<path d="M-7 14 Q0 8 7 14 Q0 22 -7 14Z" fill="#ff2f5a" {S}/>' + heart(28, -30, 0.7, "#ff2f8a"), ""),
}


def face_symbol(pid, face):
    name, base, features, extra = face
    # extra can hold accessories placed in absolute (0..100) coordinates
    return (
        f'<symbol id="pin-{pid}" viewBox="0 0 100 100">'
        f'<circle cx="50" cy="56" r="36" fill="{base}" {S.replace("3.4", "4")}/>'
        # 3D dome: soft shade on the lower right rim and a glossy highlight upper left
        f'<path d="M72 78 A33 33 0 0 1 28 82" fill="none" stroke="rgba(0,0,0,.16)" stroke-width="6" stroke-linecap="round"/>'
        f'<g transform="translate(50 56)">{features}</g>'
        f'{extra}'
        f'<ellipse cx="34" cy="38" rx="11" ry="6" fill="#fff" fill-opacity=".5" transform="rotate(-35 34 38)"/>'
        f'<circle cx="44" cy="27" r="2.2" fill="#fff" fill-opacity=".7"/>'
        f'</symbol>'
    )


def symbols_html():
    syms = "".join(face_symbol(pid, f) for pid, f in FACES.items())
    return f'<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>{syms}</defs></svg>'


def pin_svg(pid, cls="pin3d", label=None):
    alt = f' role="img" aria-label="{escape(label)}"' if label else ' aria-hidden="true"'
    return f'<svg class="{cls}" viewBox="0 0 100 100"{alt}><use href="#pin-{pid}"/></svg>'


# ------------------------------------------------------------------- pins --
# The shop list. Add new pins here when they are made.
PINS = [{"id": pid, "name": f[0], "status": "coming-soon", "url": ""} for pid, f in FACES.items()]


def status_html(p):
    if p["status"] == "available" and p["url"].startswith("https://"):
        return f'<a class="btn" href="{escape(p["url"])}" target="_blank" rel="noopener">Buy</a>'
    if p["status"] == "sold-out":
        return '<span class="tag">Sold out</span>'
    return '<span class="tag soon">Coming soon</span>'


def pin_cards():
    out = []
    for p in PINS:
        out.append(
            f'<article class="pin-card">{pin_svg(p["id"], label=p["name"])}'
            f'<h3>{escape(p["name"])}</h3>{status_html(p)}</article>'
        )
    return "".join(out)


def hero_pins():
    ids = ["cool", "love-eyes", "big-grin", "star-struck", "cheeky"]
    return "".join(pin_svg(i, "pin3d hp") for i in ids)


def use(pid, x, y, size, rot=0):
    r = f' transform="rotate({rot} {x + size / 2} {y + size / 2})"' if rot else ""
    return f'<use class="mp" href="#pin-{pid}" x="{x}" y="{y}" width="{size}" height="{size}"{r}/>'


def mock_tee():
    pins = (use("cool", 60, 80, 62, -8) + use("love-eyes", 124, 66, 58, 6) + use("cheeky", 96, 128, 56, -4)
            + use("royal", 150, 120, 52, 8))
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="T-shirt with emoji pins on the chest">'
        f'<path d="M92 24 L122 12 Q150 44 178 12 L208 24 L282 74 L250 118 L222 98 V268 H78 V98 L50 118 L18 74Z" '
        f'fill="#ff2f8a" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M122 12 Q150 44 178 12" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'{pins}</svg>'
    )


def mock_bag():
    pins = (use("kitty", 78, 150, 56, -6) + use("big-grin", 134, 138, 54, 6) + use("star-struck", 100, 196, 52, 4)
            + use("wink", 160, 190, 48, -8))
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="Tote bag with emoji pins">'
        f'<path d="M100 96 Q100 22 150 22 Q200 22 200 96" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
        f'<path d="M100 96 Q100 22 150 22 Q200 22 200 96" fill="none" stroke="#28c2ff" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M58 92 H242 L254 268 H46Z" fill="#28c2ff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'{pins}</svg>'
    )


def mock_cap():
    pins = use("angel", 118, 72, 46, -6) + use("cowboy", 164, 80, 44, 8)
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="Denim jacket collar with emoji pins">'
        f'<path d="M40 70 L110 40 Q150 70 190 40 L260 70 L270 270 H30Z" fill="#ffe229" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M110 40 L150 130 L190 40" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M150 130 V270" stroke="{INK}" stroke-width="5"/>'
        f'{use("dapper", 52, 150, 50, -6)}{use("zapped", 204, 140, 50, 8)}{use("shy", 52, 205, 46, 5)}{use("kiss", 206, 202, 46, -6)}'
        f'</svg>'
    )


def page_body():
    n = len(PINS)
    return f"""{symbols_html()}
<section class="pins-hero">
  <div class="container">
    <p class="kick">3D &middot; Shiny &middot; Wear them anywhere</p>
    <h1><span>Emoji</span><span>Pins</span></h1>
    <p class="pins-lead">Tiny faces with big moods. Thick outlines, a glossy domed finish and a loud smile, made to clip on your bag, jacket, cap or t-shirt.</p>
    <div class="hero-pins" aria-hidden="true">{hero_pins()}</div>
    <a class="pins-cta" href="#notify">Get a drop alert &rarr;</a>
  </div>
</section>
<section class="section"><div class="container">
  <p class="notice"><strong>Coming soon.</strong> The first batch is still in the making. Each pin shows up below with a Buy button as soon as it is produced.</p>
  <div class="section-head" style="margin-top:2rem"><h2 class="fat" style="margin:0">Meet the faces</h2><p>{n} faces so far. More moods are on the way, so check back after every drop.</p></div>
  <div class="pin-grid">{pin_cards()}</div>
</div></section>
<section class="section"><div class="container">
  <div class="section-head"><h2 class="fat" style="margin:0">Pin them on everything</h2><p>Bag, tee, jacket, cap, lanyard or notebook. Mix a few faces and make your own mood board.</p></div>
  <div class="grid g3 mock-grid">
    <figure class="mock-card">{mock_tee()}<figcaption>T-shirt</figcaption></figure>
    <figure class="mock-card">{mock_bag()}<figcaption>Tote bag</figcaption></figure>
    <figure class="mock-card">{mock_cap()}<figcaption>Jacket</figcaption></figure>
  </div>
  <p class="notice" style="margin-top:1rem">These mockups show the idea. Real pins can look a little different once produced.</p>
</div></section>
<section class="section"><div class="container">
  <div class="grid g3">
    <div class="panel pink"><h3>The look</h3><p>Round, shiny and domed like a little button, with the same thick black outline as the rest of the POPART art.</p></div>
    <div class="panel blue"><h3>The fit</h3><p>Planned with a metal clasp so they stay put on fabric and bags. Sizes and materials will be shown with each drop.</p></div>
    <div class="panel yellow"><h3>The drops</h3><p>Small batches, a few faces at a time. When a batch is ready it is announced in the <a href="/news/">news</a> and added to this page.</p></div>
  </div>
</div></section>
<section class="section" id="notify"><div class="container">
  <div class="panel pink" style="text-align:center;padding:2rem 1.2rem">
    <h2 class="fat" style="margin:0 0 .6rem">Want the first batch?</h2>
    <p style="max-width:34rem;margin:0 auto 1rem">Leave your email in the newsletter box at the bottom of the page and you will hear about the first pins before anyone else.</p>
    <a class="btn" href="#nl-email" style="display:table;margin:.4rem auto 0">Go to the newsletter</a>
  </div>
</div></section>"""
