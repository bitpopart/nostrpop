"""POPpins (POPART emoji pins): the faces, the pin art and the /poppins/ page body.

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
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="T-shirt with POPpins on the chest">'
        f'<path d="M92 24 L122 12 Q150 44 178 12 L208 24 L282 74 L250 118 L222 98 V268 H78 V98 L50 118 L18 74Z" '
        f'fill="#ff2f8a" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M122 12 Q150 44 178 12" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
        f'{pins}</svg>'
    )


def mock_bag():
    pins = use(15, 78, 150, 56, -6) + use(2, 134, 138, 54, 6) + use(9, 100, 196, 52, 4) + use(13, 160, 190, 48, -8)
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="Tote bag with POPpins">'
        f'<path d="M100 96 Q100 22 150 22 Q200 22 200 96" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>'
        f'<path d="M100 96 Q100 22 150 22 Q200 22 200 96" fill="none" stroke="#28c2ff" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M58 92 H242 L254 268 H46Z" fill="#28c2ff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'{pins}</svg>'
    )


def mock_cap():
    return (
        '<svg class="mock" viewBox="0 0 300 290" role="img" aria-label="Jacket with POPpins">'
        f'<path d="M40 70 L110 40 Q150 70 190 40 L260 70 L270 270 H30Z" fill="#ffe229" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M110 40 L150 130 L190 40" fill="none" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M150 130 V270" stroke="{INK}" stroke-width="5"/>'
        f'{use(20, 52, 150, 50, -6)}{use(4, 204, 140, 50, 8)}{use(21, 52, 205, 46, 5)}{use(10, 206, 202, 46, -6)}'
        f'</svg>'
    )


def back_svg():
    """The back of a POPpin: flat metal plate with a black rubber clutch on the post."""
    return (
        '<svg class="pin-back" viewBox="0 0 200 200" role="img" aria-label="Back of a POPpin with a black rubber clutch">'
        '<defs><radialGradient id="nick" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fafbfc"/><stop offset=".6" stop-color="#c9ced4"/><stop offset="1" stop-color="#9aa1a9"/></radialGradient></defs>'
        f'<circle cx="100" cy="100" r="82" fill="url(#nick)" stroke="{INK}" stroke-width="6"/>'
        f'<circle cx="100" cy="100" r="70" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="2"/>'
        f'<path id="arc" d="M38 118 A66 66 0 0 0 162 118" fill="none"/>'
        f'<text font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="13" letter-spacing="3" fill="#6b7178"><textPath href="#arc" startOffset="50%" text-anchor="middle">POPART.LOVE</textPath></text>'
        # rubber clutch
        f'<ellipse cx="100" cy="106" rx="42" ry="40" fill="#1b1b1b" stroke="{INK}" stroke-width="4"/>'
        f'<path d="M64 98 Q64 62 100 62 Q136 62 136 98 Q136 112 128 118 Q100 104 72 118 Q64 112 64 98Z" fill="#2a2a2a" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        f'<ellipse cx="100" cy="112" rx="13" ry="5.5" fill="#050505" transform="rotate(-18 100 112)"/>'
        f'<ellipse cx="84" cy="82" rx="14" ry="7" fill="#fff" fill-opacity=".22" transform="rotate(-30 84 82)"/>'
        '</svg>'
    )


def explain_svg():
    lab = 'font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="17" letter-spacing="1" text-anchor="middle"'
    return (
        '<svg class="explain" viewBox="0 0 560 250" role="img" aria-label="How a POPpin is built: the face, a metal post on a flat plate, and a black rubber clutch that locks it">'
        '<defs><linearGradient id="nk" x1="0" x2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset="1" stop-color="#9aa1a9"/></linearGradient></defs>'
        f'<image href="{pin_src(14)}" x="6" y="52" width="140" height="140"/>'
        # plate + post
        f'<rect x="196" y="60" width="16" height="124" rx="5" fill="url(#nk)" stroke="{INK}" stroke-width="4"/>'
        f'<path d="M212 122 H330" stroke="{INK}" stroke-width="11" stroke-linecap="round"/><path d="M212 122 H330" stroke="#c9ced4" stroke-width="5" stroke-linecap="round"/>'
        # clutch
        f'<path d="M376 82 H408 Q416 82 416 90 V156 Q416 164 408 164 H376 Q368 164 368 156 V90 Q368 82 376 82Z" fill="#1b1b1b" stroke="{INK}" stroke-width="4"/>'
        f'<path d="M416 92 Q470 88 474 124 Q470 160 416 156Z" fill="#2a2a2a" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
        f'<ellipse cx="446" cy="108" rx="14" ry="7" fill="#fff" fill-opacity=".2" transform="rotate(-20 446 108)"/>'
        f'<path d="M150 122 H190 M340 122 H364" stroke="{INK}" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round"/>'
        f'<text x="76" y="224" {lab}>1. POPpin</text>'
        f'<text x="262" y="224" {lab}>2. Metal post</text>'
        f'<text x="424" y="224" {lab}>3. Rubber clutch</text>'
        '</svg>'
    )


def page_body():
    n = len(PINS)
    return f"""<section class="pins-hero">
  <div class="container">
    <p class="kick">Emoji pins &middot; 3D &middot; Shiny</p>
    <h1><span>POPpins</span></h1>
    <p class="pins-lead">POPpins are tiny faces with big moods. Thick outlines, a glossy domed finish and a loud smile, made to clip on your bag, jacket, cap or t-shirt.</p>
    <div class="hero-pins" aria-hidden="true">{hero_pins()}</div>
    <a class="pins-cta" href="#notify">Get a drop alert &rarr;</a>
  </div>
</section>
<section class="section"><div class="container">
  <p class="notice"><strong>Coming soon.</strong> The first batch is still in the making. Each POPpin shows up below with a Buy button as soon as it is produced.</p>
  <div class="section-head" style="margin-top:2rem"><h2 class="fat" style="margin:0">Meet the POPpins</h2><p>{n} POPpins so far. More moods are on the way, so check back after every drop.</p></div>
  <div class="pin-grid">{pin_cards()}</div>
</div></section>
<section class="section"><div class="container">
  <div class="section-head"><h2 class="fat" style="margin:0">Pin POPpins on everything</h2><p>Bag, tee, jacket, cap, lanyard or notebook. Mix a few faces and make your own mood board.</p></div>
  <div class="grid g3 mock-grid">
    <figure class="mock-card">{mock_tee()}<figcaption>T-shirt</figcaption></figure>
    <figure class="mock-card">{mock_bag()}<figcaption>Tote bag</figcaption></figure>
    <figure class="mock-card">{mock_cap()}<figcaption>Jacket</figcaption></figure>
  </div>
  <p class="notice" style="margin-top:1rem">These mockups show the idea. Real pins can look a little different once produced.</p>
</div></section>
<section class="section"><div class="container">
  <div class="section-head"><h2 class="fat" style="margin:0">What is on the back</h2><p>Every POPpin has a flat metal plate with a post and a black rubber clutch that locks on. Tap the pin to flip it over.</p></div>
  <div class="grid g2 back-grid">
    <div class="back-card">
      <div class="flip" id="flip"><div class="flip-inner">
        <div class="flip-face">{pin_img(14, "pin3d big")}</div>
        <div class="flip-face flip-back">{back_svg()}</div>
      </div></div>
      <button class="btn yellow" type="button" id="flip-btn" aria-pressed="false">Flip it over</button>
    </div>
    <div class="back-card">{explain_svg()}
      <p class="back-note">Push the post through your bag, jacket or cap, then press the rubber clutch on from the other side. It grips the post, so the POPpin stays put.</p>
    </div>
  </div>
</div></section>
<script>
(function(){{var f=document.getElementById("flip"),b=document.getElementById("flip-btn");if(!f||!b)return;
function t(){{var on=f.classList.toggle("on");b.setAttribute("aria-pressed",on);b.textContent=on?"Flip it back":"Flip it over";}}
b.addEventListener("click",t);f.addEventListener("click",t);}})();
</script>
<section class="section"><div class="container">
  <div class="grid g3">
    <div class="panel pink"><h3>The look</h3><p>Round, shiny and domed like a little button, with the same thick black outline as the rest of the POPART art.</p></div>
    <div class="panel blue"><h3>The fit</h3><p>A black rubber clutch back locks onto a metal post, so they stay put on fabric and bags. Sizes and materials will be shown with each drop.</p></div>
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
