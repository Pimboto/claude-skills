"""Audio of pricetag_demo: Pimbo's finished mix (voice, music and his own effects) plus a few effects for things
that only exist in the 3D clip. His effects already sit on the right words: whoosh 163, pop + ping 218, thud 248,
pop 271.

    python make_audio.py [path to premix_en.wav]      -> audio.wav next to this file

Without an argument it looks for anymation/v2/v8/pricetag/premix_en.wav, five folders up from here.
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'audio'))
from sfx import Mix

premix = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', '..', '..', '..', 'v2', 'v8', 'pricetag', 'premix_en.wav')
m = Mix(frames=291, base=premix)
# Hook (0-20): the price races to $2,000 while the camera pushes in. Fast ticks rising in pitch, and a soft swish.
m.add(m.whoosh(16, 220, 1300, 0.25), 0, -24, 0.0)
for i, f in enumerate(range(1, 21, 2)): m.add(m.tick(1050 + 95 * i), f, -28 + i * 0.25, 0.15)
# Reframes start hard and brake long, so the swish peaks a third of the way in.
m.add(m.whoosh(26, 240, 1500, 0.33), 61, -22, -0.25)        # pull back and come round for the token (move 62-88)
m.add(m.ding(1318.5), 86, -25, 0.25)                        # the token appears
m.add(m.whoosh(22, 260, 1700, 0.33), 111, -23, 0.1)         # come back to the front for the price (move 112-134)
for i, f in enumerate(range(132, 156, 2)): m.add(m.tick(1500 + 110 * i), f, -30 + i * 0.3, 0.2)   # the price runs
m.add(m.thud(0.3), 155, -17); m.add(m.ding(987.8, 0.5), 155, -24)                                 # the price lands on $10,000
m.add(m.fizz(0.55), 151, -33, 0.2); m.add(m.sparkle(20, 14, 3200, 7500, seed=5), 151, -31)        # red sparks off the card frame
# Chest (lid opens 214-225; his mix already has a pop and a ping at 218): the latch, then the sparks.
m.add(m.clunk(), 213, -16, 0.3)
m.add(m.sparkle(32, 46, 2600, 6800, seed=11), 216, -21)                                           # gold sparks rising out of the chest
print('audio.wav', m.save(os.path.join(HERE, 'audio.wav')))
