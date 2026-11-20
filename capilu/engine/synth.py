"""Instrumentos sintetizados: trilha original da Capilu e efeitos sonoros."""
import numpy as np

SR = 24000


# ---------- síntese de instrumentos ----------
def env_pluck(n, decay):
    return np.exp(-np.arange(n) / SR * decay)


def marimba(f, dur, vol=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * env_pluck(n, 7) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * env_pluck(n, 22)
    y[:60] *= np.linspace(0, 1, 60)
    return y * vol


def bass(f, dur, vol=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * env_pluck(n, 4)
    y[:120] *= np.linspace(0, 1, 120)
    return y * vol


def shaker(dur=0.06, vol=1.0):
    n = int(dur * SR); rng = np.random.default_rng(7)
    y = np.diff(rng.standard_normal(n + 1)) * env_pluck(n, 60)
    return y * vol * 0.5


def add(buf, y, at):
    i = int(at * SR)
    if i >= len(buf): return
    y = y[: len(buf) - i]
    buf[i:i + len(y)] += y


N = {'C3': 130.81, 'F2': 87.31, 'G2': 98.0, 'A2': 110.0, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.0,
     'A4': 440.0, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.0, 'C6': 1046.5}


def music(total):
    """Tema da Capilu: dó maior, 108 bpm, progressão C–G–Am–F, melodia pentatônica."""
    buf = np.zeros(int(total * SR) + SR)
    beat = 60 / 108
    chords = [('C3', ['C4', 'E4', 'G4']), ('G2', ['D4', 'G4', 'B4']), ('A2', ['C4', 'E4', 'A4']), ('F2', ['C4', 'F4', 'A4'])]
    melody = [  # (batida dentro da frase de 16 tempos, nota, duração em tempos)
        (0, 'E5', 1), (1, 'G5', 1), (2, 'E5', .5), (2.5, 'D5', .5), (3, 'C5', 1),
        (4, 'D5', 1), (5, 'G5', 1), (6, 'D5', 2),
        (8, 'C5', 1), (9, 'E5', 1), (10, 'A5', 1), (11, 'G5', 1),
        (12, 'A5', .5), (12.5, 'G5', .5), (13, 'E5', 1), (14, 'C5', 2)]
    bars = int(total / (beat * 4)) + 1
    for b in range(bars):
        t0 = b * 4 * beat
        root, tri = chords[b % 4]
        add(buf, bass(N[root], beat * 1.8, 0.5), t0)
        add(buf, bass(N[root], beat * 1.2, 0.35), t0 + 2.5 * beat)
        for k in range(8):
            add(buf, marimba(N[tri[[0, 1, 2, 1, 0, 2, 1, 2][k]]], beat * 0.9, 0.16), t0 + k * beat / 2)
            if k % 2 == 1: add(buf, shaker(vol=0.12), t0 + k * beat / 2)
    for ph in range(int(total / (beat * 16)) + 1):
        if ph % 2 == 1: continue  # melodia frase sim, frase não: deixa espaço para a voz
        for (bt, note, d) in melody:
            add(buf, marimba(N[note], beat * d * 1.2, 0.2), ph * 16 * beat + bt * beat)
    return buf[: int(total * SR)]


def sfx(name):
    t = lambda d: np.arange(int(d * SR)) / SR
    if name == 'pop':
        x = t(0.14); return np.sin(2 * np.pi * (900 * np.exp(-x * 14) + 200) * x) * np.exp(-x * 26) * 0.6
    if name == 'ding':
        x = t(1.0); return (np.sin(2 * np.pi * 1318.5 * x) + 0.6 * np.sin(2 * np.pi * 1975.5 * x) + .4 * np.sin(2 * np.pi * 2637 * x)) * np.exp(-x * 5) * 0.28
    if name == 'chirp':
        x = t(0.12); one = np.sin(2 * np.pi * (2400 + 9000 * x) * x) * np.sin(np.pi * x / 0.12) ** 2 * 0.3
        return np.concatenate([one, np.zeros(1400), one, np.zeros(1400), one])
    if name == 'boing':
        x = t(0.45); return np.sin(2 * np.pi * (180 + 260 * x + 40 * np.sin(2 * np.pi * 9 * x)) * x) * np.exp(-x * 6) * 0.5
    if name == 'jingle':
        buf = np.zeros(int(3.2 * SR))
        for i, n in enumerate(['C5', 'E5', 'G5', 'C6']): add(buf, marimba(N[n], 0.6, 0.5), i * 0.16)
        for n in ['C5', 'E5', 'G5', 'C6']: add(buf, marimba(N[n], 1.6, 0.3), 0.8)
        return buf
    raise ValueError(name)
