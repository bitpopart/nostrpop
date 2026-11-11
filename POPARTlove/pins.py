"""POPicons (POPART emoji pins): the faces, the pin art and the /popicons/ page body.

build.py imports this. To add a new pin when it is produced, edit PINS below:
  status "coming-soon" -> shows a Coming soon tag
  status "available"   -> shows a Buy button (needs a https url)
  status "sold-out"    -> shows a Sold out tag
Then run `python3 build.py`.
"""
from html import escape

INK = "#111111"
YELLOW = "#ffe229"

# ------------------------------------------------------------------- art --
# The pins are the vector emojis from Johannes's Emojis.svg, split into one SVG per
# emoji in assets/img/pins/emoji-NN.svg (NN = reading order on the original sheet).
import os

PIN_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "img", "pins")


def pin_ids():
    return sorted(int(f[6:8]) for f in os.listdir(PIN_DIR) if f.startswith("emoji-") and f.endswith(".svg"))


def pin_src(n):
    return f"/assets/img/pins/emoji-{n:02d}.svg"


def pin_img(n, cls="pin3d", label=None):
    alt = escape(label) if label else ""
    return (f'<span class="{cls}" style="--src:url({pin_src(n)})">'
            f'<img src="{pin_src(n)}" alt="{alt}" width="240" height="240" loading="lazy"></span>')


# ------------------------------------------------------------------- pins --
# The shop list. Add names or flip a pin to "available" (with a https url) when it is made.
NAMES = {
    1: "Tongue Out", 2: "Happy", 3: "Happy Tears", 4: "Kiss", 5: "Red Lips", 6: "Yikes", 7: "Hearts", 8: "Cheeky",
    9: "Fangs", 10: "Vampire", 11: "Wide Eyes", 12: "Zapped", 13: "Blush", 14: "Heart Eyes", 15: "Big Grin", 16: "Cackle",
    17: "Sneaky", 18: "Googly", 19: "Gritted", 20: "Cheesy", 21: "Sweaty Smile", 22: "Sad", 23: "Nervous",
}
PINS = [{"id": n, "name": NAMES.get(n, f"Emoji {n:02d}"), "status": "coming-soon", "url": ""} for n in pin_ids()]


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
            f'<article class="pin-card">{pin_img(p["id"], label=p["name"])}'
            f'<h3>{escape(p["name"])}</h3>{status_html(p)}</article>'
        )
    return "".join(out)


def hero_pins():
    ids = [14, 1, 15, 12, 5]
    return "".join(pin_img(i, "pin3d hp") for i in ids)


def use(n, x, y, size, rot=0):
    r = f' transform="rotate({rot} {x + size / 2} {y + size / 2})"' if rot else ""
    return f'<image class="mp" href="{pin_src(n)}" x="{x}" y="{y}" width="{size}" height="{size}"{r}/>'


def mock_tee():
    pins = use(14, 60, 80, 62, -8) + use(5, 124, 66, 58, 6) + use(1, 96, 128, 56, -4) + use(12, 150, 120, 52, 8)
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="T-shirt with POPicons on the chest">'
        f'<path d="M92 24 L122 12 Q150 44 178 12 L208 24 L282 74 L250 118 L222 98 V268 H78 V98 L50 118 L18 74Z" '
        f'fill="#ff2f8a" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M122 12 Q150 44 178 12" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'{pins}</svg>'
    )


def mock_bag():
    pins = use(15, 78, 150, 56, -6) + use(2, 134, 138, 54, 6) + use(9, 100, 196, 52, 4) + use(13, 160, 190, 48, -8)
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="Tote bag with POPicons">'
        f'<path d="M100 96 Q100 22 150 22 Q200 22 200 96" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
        f'<path d="M100 96 Q100 22 150 22 Q200 22 200 96" fill="none" stroke="#28c2ff" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M58 92 H242 L254 268 H46Z" fill="#28c2ff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'{pins}</svg>'
    )


def mock_cap():
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="Jacket with POPicons">'
        f'<path d="M40 70 L110 40 Q150 70 190 40 L260 70 L270 270 H30Z" fill="#ffe229" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M110 40 L150 130 L190 40" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M150 130 V270" stroke="{INK}" stroke-width="5"/>'
        f'{use(20, 52, 150, 50, -6)}{use(4, 204, 140, 50, 8)}{use(21, 52, 205, 46, 5)}{use(10, 206, 202, 46, -6)}'
        f'</svg>'
    )


def page_body():
    n = len(PINS)
    return f"""<section class="pins-hero">
  <div class="container">
    <p class="kick">Emoji pins &middot; 3D &middot; Shiny</p>
    <h1><span>POPicons</span></h1>
    <p class="pins-lead">POPicons are tiny faces with big moods. Thick outlines, a glossy domed finish and a loud smile, made to clip on your bag, jacket, cap or t-shirt.</p>
    <div class="hero-pins" aria-hidden="true">{hero_pins()}</div>
    <a class="pins-cta" href="#notify">Get a drop alert &rarr;</a>
  </div>
</section>
<section class="section"><div class="container">
  <p class="notice"><strong>Coming soon.</strong> The first batch is still in the making. Each POPicon shows up below with a Buy button as soon as it is produced.</p>
  <div class="section-head" style="margin-top:2rem"><h2 class="fat" style="margin:0">Meet the POPicons</h2><p>{n} POPicons so far. More moods are on the way, so check back after every drop.</p></div>
  <div class="pin-grid">{pin_cards()}</div>
</div></section>
<section class="section"><div class="container">
  <div class="section-head"><h2 class="fat" style="margin:0">Pin POPicons on everything</h2><p>Bag, tee, jacket, cap, lanyard or notebook. Mix a few faces and make your own mood board.</p></div>
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
