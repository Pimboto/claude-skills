"""KIT / audio. A small mixer for the sound of a video: an optional base track (voice and music already mixed)
plus synthesized effects placed by frame number.

    from sfx import Mix
    m = Mix(frames=291, base='premix.wav')          # base is optional
    m.track('voice.wav'); m.track('music.wav', gain_db=-1, skip=19.4, fade_in=0.15)     # or build the base from separate files
    m.add(m.whoosh(26, 240, 1500, peak_at=0.33), frame=61, gain_db=-22, pan=-0.25)
    m.add(m.ding(1318.5), 86, -25, 0.25)
    m.save('audio.wav')

Rules (references/STYLE_BIBLE.md, sound): a whoosh on every camera move, peaking where the move is fastest (a third
of the way in for a reframe); ticks while a number runs; a low thud plus a ding when something lands.
Effects stay well under the voice: the ones in pricetag_demo sit 11 to 25 dB below the base mix.
Everything is seeded: the same script always writes the same file. The order of the calls matters for that.
Whoever writes these numbers cannot hear the result: a person has to listen before a video goes out.
"""
import numpy as np, scipy.io.wavfile as wf, scipy.signal as sg


class Mix:
    def __init__(self, frames, base=None, seed=3, fps=30, sr=44100):
        self.sr, self.fps = sr, fps
        self.n = int(sr * (frames / fps))
        self.rs = np.random.RandomState(seed)
        self.sfx = np.zeros((self.n, 2))
        self.base = self._load(base) if base else np.zeros((self.n, 2))

    def _load(self, path):
        sr, x = wf.read(path); x = x.astype(np.float64) / 32768.0
        if x.ndim == 1: x = x[:, None]
        if sr != self.sr: x = sg.resample_poly(x, self.sr, sr, axis=0)
        x = x[:self.n]
        if len(x) < self.n: x = np.vstack([x, np.zeros((self.n - len(x), x.shape[1]))])
        return np.repeat(x, 2, 1) if x.shape[1] == 1 else x

    def track(self, path, gain_db=0.0, skip=0.0, at_frame=0, fade_in=0.0):
        """Add a sound file to the base: a voice track, a music bed. skip = seconds of the file to jump over;
        at_frame = where it starts in the video. gain_db is a number, or a list of (frame, dB) points: the gain
        moves in a straight line between them (to lift the music for the last part, for example).
        Returns what was added, so the script can measure it."""
        sr, x = wf.read(path); x = x.astype(np.float64) / (1.0 if x.dtype.kind == 'f' else 32768.0)
        if x.ndim == 1: x = x[:, None]
        if sr != self.sr: x = sg.resample_poly(x, self.sr, sr, axis=0)
        a = self.at(at_frame); x = x[int(round(skip * self.sr)):][:max(0, self.n - a)]
        if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        if np.isscalar(gain_db): g = np.full(len(x), 10 ** (gain_db / 20))
        else:
            pts = sorted(gain_db); frame_of = (a + np.arange(len(x))) / self.sr * self.fps
            g = 10 ** (np.interp(frame_of, [q[0] for q in pts], [q[1] for q in pts]) / 20)
        k = min(len(x), int(fade_in * self.sr))
        if k: g[:k] *= np.linspace(0, 1, k)
        self.base[a:a + len(x)] += x * g[:, None]
        return x * g[:, None]

    def at(self, frame):
        """Frame number -> sample index."""
        return int(round(frame / self.fps * self.sr))

    def add(self, sig, frame, gain_db=0.0, pan=0.0):
        """Place an effect at a frame. Mono signals are panned (-1 left, 1 right); stereo ones are added as they are."""
        a = self.at(frame); sig = sig[:max(0, self.n - a)]; g = 10 ** (gain_db / 20)
        if sig.ndim == 2: self.sfx[a:a + len(sig)] += sig * g; return
        self.sfx[a:a + len(sig), 0] += sig * g * np.sqrt(0.5 * (1 - pan)) * 1.414
        self.sfx[a:a + len(sig), 1] += sig * g * np.sqrt(0.5 * (1 + pan)) * 1.414

    # ---- effects (all return a signal normalised to peak 1)
    def whoosh(self, frames, f_lo=260, f_hi=2600, peak_at=0.5, width_oct=1.1):
        """Band of noise whose centre sweeps up to f_hi at peak_at and back down; loudness follows the same bell."""
        sr = self.sr; n = self.at(frames); win = 2048; hop = 256; out = np.zeros(n + win); w = np.hanning(win)
        freqs = np.fft.rfftfreq(win, 1 / sr)
        for k in range(0, n, hop):
            u = k / n; bell = np.sin(np.pi * min(1, u / (2 * peak_at))) if u < peak_at else np.sin(np.pi * (0.5 + 0.5 * (u - peak_at) / (1 - peak_at)))
            fc = f_lo * (f_hi / f_lo) ** bell
            shape = np.exp(-0.5 * (np.log2(np.maximum(freqs, 1) / fc) / (width_oct / 2)) ** 2)
            spec = shape * (self.rs.randn(len(freqs)) + 1j * self.rs.randn(len(freqs)))
            out[k:k + win] += np.fft.irfft(spec, win) * w * bell ** 1.5
        out = out[:n]; return out / (np.abs(out).max() + 1e-9)

    def tick(self, freq):
        """One short click of a counter."""
        n = int(0.03 * self.sr); t = np.arange(n) / self.sr; return np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.006)

    def ding(self, freq, dur=0.45):
        """A small bell: something appears or lands."""
        n = int(dur * self.sr); t = np.arange(n) / self.sr; e = np.exp(-t / (dur / 4)) * np.minimum(1, t / 0.003)
        return (np.sin(2 * np.pi * freq * t) + 0.45 * np.sin(2 * np.pi * freq * 2.01 * t) + 0.2 * np.sin(2 * np.pi * freq * 3.02 * t)) * e / 1.65

    def thud(self, dur=0.28):
        """A low hit: weight landing."""
        n = int(dur * self.sr); t = np.arange(n) / self.sr; f = 78 * np.exp(-t * 5) + 42
        return np.sin(2 * np.pi * np.cumsum(f) / self.sr) * np.exp(-t / 0.08)

    def clunk(self):
        """Wooden latch: a short band of mid noise (the click) on top of a low knock."""
        sr = self.sr; n = int(0.22 * sr); t = np.arange(n) / sr
        nz = self.rs.randn(n); bb, aa = sg.butter(2, [320 / (sr / 2), 1100 / (sr / 2)], 'band'); click = sg.lfilter(bb, aa, nz) * np.exp(-t / 0.012)
        f = 120 * np.exp(-t * 9) + 62; knock = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t / 0.055)
        x = 0.55 * click / (np.abs(click).max() + 1e-9) + knock; return x / np.abs(x).max()

    def sparkle(self, frames, count, f_lo=2600, f_hi=6800, seed=11):
        """Many tiny high pings, dense at the start and thinning out: what small sparks sound like. Stereo."""
        sr = self.sr; r2 = np.random.RandomState(seed); n = self.at(frames); out = np.zeros((n + int(0.6 * sr), 2))
        for _ in range(count):
            at = int(n * r2.rand() ** 1.8); fr = f_lo * (f_hi / f_lo) ** r2.rand(); d = 0.035 + 0.06 * r2.rand(); m = int(d * 4 * sr); t = np.arange(m) / sr
            ping = np.sin(2 * np.pi * fr * t) * np.exp(-t / d) * (0.35 + 0.65 * r2.rand()) * (1 - 0.6 * at / n); pan = r2.uniform(-0.7, 0.7)
            out[at:at + m, 0] += ping * np.sqrt(0.5 * (1 - pan)); out[at:at + m, 1] += ping * np.sqrt(0.5 * (1 + pan))
        return out / (np.abs(out).max() + 1e-9)

    def fizz(self, dur=0.5):
        """A short hiss of high noise: sparks coming off something."""
        sr = self.sr; n = int(dur * sr); t = np.arange(n) / sr; bb, aa = sg.butter(2, [4200 / (sr / 2), 9500 / (sr / 2)], 'band')
        x = sg.lfilter(bb, aa, self.rs.randn(n)) * np.exp(-t / (dur / 3.5)) * np.minimum(1, t / 0.004); return x / np.abs(x).max()

    def pad(self, freqs=(110.0, 164.81, 220.0), level_db=-24):
        """A quiet held chord for a video with no music. Returns nothing: it is added to the mix directly."""
        t = np.arange(self.n) / self.sr; dur = self.n / self.sr; env = np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 0.6)
        x = sum(a * np.sin(2 * np.pi * f * t + 0.3 * i) for i, (f, a) in enumerate(zip(freqs, (1.0, 0.7, 0.5)))) * env * (0.85 + 0.15 * np.sin(2 * np.pi * 0.4 * t))
        self.add(x / np.abs(x).max(), 0, level_db)

    def save(self, path, fade_out=0.35, peak=0.97):
        """Base + effects -> 16-bit stereo WAV. Returns the levels, so the script can print them."""
        mix = self.base + self.sfx
        fade = np.ones(self.n); k = int(fade_out * self.sr); fade[-k:] = np.linspace(1, 0, k); mix *= fade[:, None]
        pk = np.abs(mix).max()
        if pk > peak: mix *= peak / pk
        wf.write(path, self.sr, (mix * 32767).astype(np.int16))
        rms = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
        return dict(base_db=round(float(rms(self.base)), 1), effects_db=round(float(rms(self.sfx)), 1), mix_db=round(float(rms(mix)), 1), peak=round(float(np.abs(mix).max()), 2))
