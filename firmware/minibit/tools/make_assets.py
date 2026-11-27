import json, struct, sys, os, gzip
HERE = os.path.dirname(os.path.abspath(__file__))
from PIL import Image
import numpy as np
FLIP = len(sys.argv) > 1 and sys.argv[1] == "flip"   # flip = USB-C on the left (default: USB-C on the right)
hits = json.load(open(os.path.join(HERE, 'hits.json')))
names = [s['name'] for s in hits['screens']]
blob = bytearray()
for n in names:
    im = Image.open(os.path.join(HERE, 'shots', n + '.png')).convert('RGB')      # 448 x 368 design
    im = im.rotate(90 if FLIP else -90, expand=True)                        # 368 x 448 panel
    a = np.asarray(im).astype(np.uint16)
    v = ((a[...,0] & 0xF8) << 8) | ((a[...,1] & 0xFC) << 3) | (a[...,2] >> 3)
    blob += v.astype('<u2').tobytes()
out = os.path.join(HERE, '..', 'assets'); os.makedirs(out, exist_ok=True)
open(os.path.join(out, 'screens.bin.gz'), 'wb').write(gzip.compress(bytes(blob), 9, mtime=0))
print(len(names), 'screens', len(blob), 'bytes')

