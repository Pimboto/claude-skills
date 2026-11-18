"""An animator's tools as pure functions of the frame number (frames can render in any order).

The 12 principles (Thomas and Johnston, The Illusion of Life) that code can carry, and the tool for each:
- slow in / slow out ............ ease_* curves on every move, never linear for a body
- anticipation .................. a small move the other way before the action (Track keys: squash before a jump)
- squash and stretch ............ squash(s): volume-preserving scale; stretch on speed, squash on impact
- follow-through / overlap ...... lag(): parts read the main channel some frames late; spring() after a stop
- arcs .......................... arc(): jumps follow a parabola, not a straight line
- timing / pose-to-pose ......... Track: key poses with their own ease, holds between them
- exaggeration .................. overshoot (out_back) and big eye swaps on the key pose
- secondary action .............. springs fired by an event (the palm shakes when the character lands)
"""
import math


def clamp01(u):
    return 0.0 if u < 0 else 1.0 if u > 1 else u


def lin(u):
    return u


def ease_in(u, p=3):
    return u ** p


def ease_out(u, p=3):
    return 1 - (1 - u) ** p


def ease_inout(u, p=3):
    return (2 * u) ** p / 2 if u < 0.5 else 1 - (2 - 2 * u) ** p / 2


def out_back(u, s=1.70158):
    """Goes past the target and comes back: overshoot."""
    c3 = s + 1
    return 1 + c3 * (u - 1) ** 3 + s * (u - 1) ** 2


def in_back(u, s=1.70158):
    """Pulls back first, then goes: a built-in anticipation."""
    return (s + 1) * u ** 3 - s * u ** 2


def inout_back(u, s=1.70158 * 1.525):
    if u < 0.5:
        return ((2 * u) ** 2 * ((s + 1) * 2 * u - s)) / 2
    return ((2 * u - 2) ** 2 * ((s + 1) * (2 * u - 2) + s) + 2) / 2


EASES = {'lin': lin, 'in': ease_in, 'out': ease_out, 'inout': ease_inout,
         'outback': out_back, 'inback': in_back, 'inoutback': inout_back,
         'in2': lambda u: ease_in(u, 2), 'out2': lambda u: ease_out(u, 2), 'inout2': lambda u: ease_inout(u, 2),
         'step': lambda u: 1.0 if u >= 1 else 0.0}


class Track:
    """Pose-to-pose channel. keys: (frame, value, ease); the ease shapes the move INTO that key.
    Before the first key and after the last one the value holds."""

    def __init__(self, *keys):
        self.keys = sorted(keys, key=lambda k: k[0])

    def __call__(self, f):
        k = self.keys
        if f <= k[0][0]:
            return k[0][1]
        for (f0, v0, _), (f1, v1, e) in zip(k, k[1:]):
            if f <= f1:
                u = (f - f0) / (f1 - f0) if f1 > f0 else 1.0
                return v0 + (v1 - v0) * EASES[e](clamp01(u))
        return k[-1][1]


def spring(t, period, decay):
    """Damped cosine: 1 at t=0, swings past 0, settles to 0. 0 before t=0."""
    if t < 0:
        return 0.0
    return math.exp(-t / decay) * math.cos(2 * math.pi * t / period)


def kick(t, period, decay):
    """Damped sine: starts at 0 with full speed, swings, settles. For a hit that pushes something."""
    if t < 0:
        return 0.0
    return math.exp(-t / decay) * math.sin(2 * math.pi * t / period)


def looped(f, hit, T):
    """Frames since `hit` in a loop of length T (0..T-1), so effects carry across the wrap."""
    return (f - hit) % T


def squash(s):
    """Volume-preserving scale for a vertical factor s (s<1 squash, s>1 stretch)."""
    w = 1 / math.sqrt(max(s, 0.05))
    return (w, w, s)


def arc(u, h):
    """Height of a jump at progress u (0..1) with apex h: a parabola."""
    u = clamp01(u)
    return 4 * h * u * (1 - u)


def lag(fn, f, frames):
    """Overlapping action: a part follows the main channel `frames` late."""
    return fn(f - frames)


def speed(fn, f, d=1.0):
    """Change of a channel per frame (central difference)."""
    return (fn(f + d) - fn(f - d)) / (2 * d)
