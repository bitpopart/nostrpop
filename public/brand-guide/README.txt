======================================================
  BitPopArt — Brand Guide Package
  bitpopart.com · Bitcoin Pop Art by Johannes Oppewal
  Version: 2026-07-16
======================================================

CONTENTS
────────

  index.html           ← Open this in a browser for the full interactive guide

  logos/
    bitpopart-logo.svg          Main logo mark (Bitcoin ₿ character)
    bitpopart-logo.png          Raster version (PNG)
    bitpopart-text-logo.svg     Full "BitPopArt" wordmark
    block-text-logo.svg         "BLOCK" sub-brand text logo
    app-icon.svg                App / favicon icon (512×512)

  icons/
    B-Funny_avatar_orange.svg   Bitcoin character mascot (orange)
    App_icon.svg                Heart / Pop-art app icon (red bg)
    spray_paint_icon.svg        Spray-paint art tool icon
    fan-app-icon.png            Fan app PNG icon

  buttons/
    Art_button.svg              Navigation tile — Art
    News_button.svg             Navigation tile — News
    PopUP_button.svg            Navigation tile — PopUp events
    Shop_button.svg             Navigation tile — Shop
    artist_button.svg           Navigation tile — Artist profile
    fundraising_button.svg      Navigation tile — Fundraising
    projects_button.svg         Navigation tile — Projects

  gradients/
    gradient-bitcoin-orange.svg         orange-500 → orange-600
    gradient-orange-to-pink.svg         orange-500 → pink-500 (Nostr CTA)
    gradient-orange-to-yellow.svg       orange-500 → yellow-400 (Hero text)
    gradient-page-background-light.svg  Page body gradient reference
    gradient-dark-bitcoin.svg           orange-950 → orange-900 (dark canvas)

  colors/
    color-palette.svg    Full visual color palette (all swatches)
    colors.txt           ← MAIN COLOR REFERENCE — hex codes, CSS vars, gradients

  fonts/
    typography-specimen.svg    All type styles at a glance

  ui-components/
    ui-buttons.svg             Buttons, badges, card states
    border-radius-spacing.svg  Radius scale + spacing system

HOW TO USE
──────────

  1. Open index.html in any modern browser for the interactive guide
  2. Use colors/colors.txt as your go-to hex/CSS reference
  3. Import SVGs directly into Figma, Illustrator, or any design tool
  4. All SVG logos are multi-layer — they can be opened in AI/Inkscape to edit individual layers
  5. The bitpopart-logo.svg uses named classes (cls-1 through cls-7) for programmatic recoloring

LOGO COLOR RULES
────────────────

  bitpopart-logo.svg:
    - Bitcoin body fill:  #f7931a  (official Bitcoin orange)
    - Pop red accent:     #ff042c
    - White fills:        #ffffff
    - Outlines:           #000000

  bitpopart-text-logo.svg:
    - "BIT" + "POP":  #231f20  (near-black)
    - "B" symbol:     #f7931a  (orange)
    - "ART":          #ff1b27  (red)

FONTS
─────

  Primary:   Inter Variable
  Install:   npm install @fontsource-variable/inter
  Import:    import '@fontsource-variable/inter'
  CSS:       font-family: 'Inter Variable', 'Inter', system-ui, sans-serif

  Monospace (block data):  'Courier New', 'JetBrains Mono', monospace

======================================================
