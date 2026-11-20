import sys, subprocess, numpy as np, cv2, soundfile as sf, torch
from PIL import Image
import os; ROOT = os.environ.get('CAPILU_ROOT', '/home/user/.github/capilu'); sys.path.insert(0, ROOT + '/engine')
import synth
from transformers import pipeline
W, H, FPS, SR = 1920, 1080, 30, 24000
scenes = [("sc_0_0.5.png", "tz_0.wav"), ("sc_1_0.5.png", "tz_1.wav"), ("sc_2_0.5.png", "tz_2.wav")]
INTRO, PAD, XF, OUTRO = 2.6, 1.1, 0.7, 3.2
depth = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")

def prep(path):
    im = Image.open(path).convert('RGB')
    d = np.asarray(depth(im)["depth"].resize(im.size), dtype=np.float32) / 255.0
    big = cv2.resize(np.asarray(im), (W, H), interpolation=cv2.INTER_LANCZOS4)
    big = cv2.addWeighted(big, 1.35, cv2.GaussianBlur(big, (0, 0), 2.2), -0.35, 0)
    d = cv2.GaussianBlur(cv2.resize(d, (W, H), interpolation=cv2.INTER_CUBIC), (0, 0), 9)
    return big, d

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
def shot(img, d, k, idx):
    """k em 0..1: zoom lento + balanço de câmera com paralaxe por profundidade."""
    z = 1.04 + 0.07 * k
    sx = (22 * np.sin(k * np.pi * 1.2 + idx)) ; sy = 8 * np.cos(k * np.pi + idx)
    cx, cy = W / 2, H / 2
    mx = (xx - cx) / z + cx + (d - 0.5) * sx
    my = (yy - cy) / z + cy + (d - 0.5) * sy
    return cv2.remap(img, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

prepped, voices, t = [], [], INTRO
segs = []
for im, wv in scenes:
    y, sr = sf.read(wv); y = y if y.ndim == 1 else y.mean(1)
    if sr != SR:
        y = np.interp(np.arange(0, len(y), sr / SR), np.arange(len(y)), y)
    dur = len(y) / SR + PAD
    segs.append((t, t + dur)); voices.append((t + 0.3, y)); prepped.append(prep(im)); t += dur
total = t + OUTRO
segs[0] = (0.0, segs[0][1]); segs[-1] = (segs[-1][0], total)

logo = np.asarray(Image.open(ROOT + '/brand/logo.png').convert('RGBA'))
def overlay(frame, a, scale, cy):
    if a <= 0: return frame
    lg = cv2.resize(logo, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    h, w = lg.shape[:2]; x0, y0 = (W - w) // 2, int(cy - h / 2)
    al = (lg[..., 3:4].astype(np.float32) / 255) * a
    frame[y0:y0 + h, x0:x0 + w] = (frame[y0:y0 + h, x0:x0 + w] * (1 - al) + lg[..., :3] * al).astype(np.uint8)
    return frame

n = int(total * SR); voice = np.zeros(n); talk = np.zeros(n)
for at, y in voices:
    y = y / max(1e-6, np.abs(y).max()) * 0.85
    i = int(at * SR); voice[i:i + len(y)] += y[: n - i]; talk[max(0, i - 6000): i + len(y) + 6000] = 1
k = int(0.3 * SR); talk = np.convolve(talk, np.ones(k) / k, mode='same')
mus = synth.music(total) * (0.5 - 0.33 * talk); fade = int(2 * SR); mus[-fade:] *= np.linspace(1, 0, fade)
fx = np.zeros(n); synth.add(fx, synth.sfx('jingle'), 0.1); synth.add(fx, synth.sfx('ding'), total - OUTRO + 0.2)
mus[: int(2.4 * SR)] *= 0.25
mix = np.tanh((voice + fx * 0.7 + mus) * 1.1) * 0.89
sf.write('teaser.wav', np.stack([mix, mix], 1), SR)

ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', 'teaser.wav',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', sys.argv[1]], stdin=subprocess.PIPE)
for f in range(int(total * FPS)):
    tt = f / FPS
    i = max(j for j, (a, b) in enumerate(segs) if tt >= a)
    a, b = segs[i]
    fr = shot(*prepped[i], (tt - a) / (b - a + XF), i)
    if i + 1 < len(segs) and tt > b - XF:  # transição cruzada
        a2, b2 = segs[i + 1]; w = (tt - (b - XF)) / XF
        fr2 = shot(*prepped[i + 1], (tt - a2) / (b2 - a2 + XF) if tt >= a2 else 0, i + 1)
        fr = cv2.addWeighted(fr, 1 - w, fr2, w, 0)
    elif i > 0 and tt < a:
        pass
    fr = np.ascontiguousarray(fr)
    if tt < INTRO: fr = overlay(fr, min(1, tt / 0.4, (INTRO - tt) / 0.5), 0.72, 905)
    if tt > total - OUTRO: fr = overlay(fr, min(1, (tt - (total - OUTRO)) / 0.5), 0.72, 905)
    if tt > total - 0.6: fr = (fr * ((total - tt) / 0.6)).astype(np.uint8)
    ff.stdin.write(fr.tobytes())
ff.stdin.close(); ff.wait(); print('ok', total)
