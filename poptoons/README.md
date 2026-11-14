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
