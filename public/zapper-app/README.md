# ZAPPER updates

Signed firmware updates for [ZAPPER](https://bitpopart.com) zap lamps, the download page and the
USB flasher.

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

## Zapper Control and Zapper Screen

Nothing to download: every ZAPPER has them built in. Open any lamp in your browser and tap
**Zapper Control** to manage all ZAPPER lamps on your network, or **Zapper Screen** for a public
screen where anyone can zap the lamp of their choice.

Download page, manual and USB flasher: **https://jaccoelektro.github.io/zapper-updates/** (served
from this repository by GitHub Pages).

## Newest

Version **1.15.2**, 2026-10-29.
