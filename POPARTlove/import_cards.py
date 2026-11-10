#!/usr/bin/env python3
"""Import cards made in the POPART Card Maker ("Send cards to popart.love" panel).

  python3 import_cards.py popart-site-cards.json [more files...]

For each card in the site file this
  - writes the front and back pictures to assets/img/cards/<id>.webp and <id>-back.webp
  - adds the card at the top of data/cards.json (or updates it if the id exists,
    keeping its status, stock and shop link)
Then run build.py, commit and push. The Verify my card page picks the new card up
from data/cards.json; set its sold serials in /admin/.
"""
import base64
import json
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
CARDS = os.path.join(ROOT, "data", "cards.json")


def decode_image(uri, dest):
    head, _, b64 = uri.partition(",")
    if not head.startswith("data:image/webp"):
        raise SystemExit("Expected a WebP picture in the site file")
    full = os.path.join(ROOT, "assets", "img", "cards", dest)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "wb") as fh:
        fh.write(base64.b64decode(b64))


def main(paths):
    with open(CARDS, encoding="utf-8") as fh:
        cards = json.load(fh)
    count = 0
    for path in paths:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        for c in data.get("cards", []):
            cid = c["id"]
            decode_image(c["front"], cid + ".webp")
            decode_image(c["back"], cid + "-back.webp")
            run = c.get("run", "open")
            entry = {
                "file": cid,
                "name": c["name"],
                "theme": c["tribe"].lower(),
                "series": c["series"],
                "rarity": c["rarity"],
                "run": "Open run" if run == "open" else "Run of " + run,
                "blurb": c.get("tagline") or c["name"],
                "status": "available",
                "left": None,
                "online": True,
                "offline": True,
                "url": "",
            }
            for i, old in enumerate(cards):
                if old.get("file") == cid:
                    for k in ("status", "left", "online", "offline", "url"):
                        entry[k] = old.get(k, entry[k])
                    cards[i] = entry
                    break
            else:
                cards.insert(0, entry)
            count += 1
    with open(CARDS, "w", encoding="utf-8") as fh:
        json.dump(cards, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"Imported {count} card(s). Now run: python3 build.py")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1:])
