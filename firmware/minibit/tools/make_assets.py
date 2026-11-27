import json, struct, sys
from PIL import Image
import numpy as np
FLIP = len(sys.argv) > 1 and sys.argv[1] == "flip"   # flip = USB-C on the left (default: USB-C on the right)
hits = json.load(open('/home/claude/fw/hits.json'))
names = [s['name'] for s in hits['screens']]
blob = bytearray()
for n in names:
    im = Image.open(f'/home/claude/fw/shots/{n}.png').convert('RGB')      # 448 x 368 design
    im = im.rotate(90 if FLIP else -90, expand=True)                        # 368 x 448 panel
    a = np.asarray(im).astype(np.uint16)
    v = ((a[...,0] & 0xF8) << 8) | ((a[...,1] & 0xFC) << 3) | (a[...,2] >> 3)
    blob += v.astype('<u2').tobytes()
open('/home/claude/fw/gen/screens.bin','wb').write(blob)
print(len(names), 'screens', len(blob), 'bytes')
json.dump(names, open('/home/claude/fw/gen/names.json','w'))
