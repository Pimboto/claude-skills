"""Audio of test5: no voice, a quiet held chord and effects on the events of the scene.

    python make_audio.py      -> audio.wav next to this file
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'audio'))
from sfx import Mix

m = Mix(frames=150, seed=7)
m.pad()
m.add(m.whoosh(16, 220, 1300, 0.25), 0, -16)                # hook push-in (0-17)
m.add(m.whoosh(24, 240, 1500, 0.33), 34, -15, -0.2)         # reframe (34-58)
m.add(m.clunk(), 59, -9, 0.3)                               # the lid opens at 60
m.add(m.sparkle(32, 46, seed=11), 62, -14)                  # sparks
m.add(m.ding(1318.5), 63, -17, 0.25)                        # the token comes out
m.add(m.ding(987.8, 0.6), 93, -16)                          # second ring
print('audio.wav', m.save(os.path.join(HERE, 'audio.wav'), peak=0.9))
