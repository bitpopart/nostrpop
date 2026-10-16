# ZAPPER updates

Signed firmware updates for [ZAPPER](https://bitpopart.com) zap lamps, and **Zapper control**,
the program to manage all ZAPPER lamps on your own network.

ZAPPER is designed and built by JaccoElektro, offered to BitPopArt.

This repository holds only the published files, no source code.

## For lamp owners

Nothing to do here. A ZAPPER looks here once a day and shows on its overview when a new version
is out (*System, Updates*). One click installs it. The lamp installs an image only when its
SHA-256 is in `manifest.json` **and** that list carries a valid signature from the maker's
release key (BIP340 Schnorr, the same as nostr), in `manifest.sig`. The public key is built into
the firmware:

```
5e3ccae16b53c902c312cc4af9290575915f569fde9439f5a6cc2d7670d7d543
```

## Zapper control

Download page and phone app: **https://jaccoelektro.github.io/zapper-updates/** (served from this repository by
GitHub Pages). Or download [`control/zapper-control.py`](control/zapper-control.py) and run it with Python 3
(no packages needed): `python3 zapper-control.py`. It opens a page in your browser with every
ZAPPER on your network, updates them from here, and updates itself.

## Newest

Version **1.12.3**, 2026-10-16.
