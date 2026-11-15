# POPtoons

Static site for poptoons.fun: the POPtoons characters by BitPopArt, with a story and a POPART card for each one.

## Folder

```
poptoons/
  index.html              the whole site, one self-contained file (generated, do not edit by hand)
  CNAME                   poptoons.fun
  src/
    data.py               every collection and character: the one place to edit
    img/<key>.png         one drawing per character, on a white background
    site_template.html    page layout, styles and script
    build_site.py         builds ../index.html and the POPtoons data for popart.love
    build_guide.py        builds the PDF Character Guide from the same data
    fonts/                Lilita One and Poppins (SIL Open Font License)
```

## Adding a collection or a character

1. Save each new drawing as `src/img/<key>.png` (white background, cropped close to the character).
2. In `src/data.py`, add the collection to `COLLECTIONS` and each character to `CHARACTERS` (key, number, name, story, sound, series, tribe, tier, band colour).
3. Build and push:

```
cd poptoons/src
python3 build_site.py        # site + data and pictures for popart.love
cd ../../POPARTlove
python3 build.py             # popart.love pages (POPtoons and Collections pages read data/poptoons.json)
```

`build_site.py` needs `pillow`, `fonttools` and `brotli`. `build_guide.py` needs `reportlab` and `pillow` and writes `src/POPtoons-Character-Guide.pdf` (not committed).

## What it feeds on popart.love

- `/poptoons/` shows every POPtoons collection and links to poptoons.fun.
- `/collections/` shows the POPtoons collections under the card collections.

Both read `POPARTlove/data/poptoons.json` and the pictures in `POPARTlove/assets/img/poptoons/`, which `build_site.py` writes.

## Deploy (Cloudflare Pages)

- Build command: none
- Output directory: `poptoons`
- Custom domain: `poptoons.fun`

## Attaching POPART cards to a toon

Cards are shown on https://www.popart.love/cards/ and come from `POPARTlove/data/cards.json`.
To attach a card to a toon, add `"toon": "<character key>"` to the card's entry, for example
`"toon": "ogle"`. Then run `python3 poptoons/src/build_site.py` and `python3 POPARTlove/build.py`
and push. The card then shows on the toon's page on poptoons.fun (with a "Collect the card" button
to popart.love/cards/) and on popart.love/cards/ with a "POPtoon: <name>" tag that links back.
Toons without an attached card show a button to all POPART cards.

## More looks of a character (gallery)

To give a toon extra looks, save each one as `poptoons/src/img/<key>-v1.png`, `<key>-v2.png`, ... (drawing on white),
then add a `variations` list to that character in `src/data.py`:

    'variations': [('Good morning', 'flap-v1'), ('Sending love', 'flap-v2')],

Each item is (caption, image key). The character page on poptoons.fun then shows a "More looks of ..." row
(thumbnails sit next to the big picture, click one to swap it) and the PDF guide shows the same row on that character's page.
Flap is the first one, with 2 extra looks next to her original.

## Sharing

Every character page has a "Share" row (X, Facebook, WhatsApp, Telegram, Nostr, Copy link, and the phone's
own share sheet where available). It shares `https://poptoons.fun/#<character key>`. Nostr has no web share link, so that
button copies a ready note text to paste into your Nostr app. Link previews use `poptoons/og.png`, which is made by
`src/build_site.py`.
