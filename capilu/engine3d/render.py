#!/usr/bin/env python3
"""Renderiza uma história com bonecos articulados sobre cenário 3D.
Uso: render.py <build_dir (timeline.json + falas)> <historia_dir (fundo)> <puppets_dir> <saida.mp4>"""
import sys, os, json, subprocess, numpy as np, cv2, soundfile as sf
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here); sys.path.insert(0, os.path.join(here, '..', 'engine'))
import synth
from puppet import Puppet, smooth
from transformers import pipeline

build, sdir, pdir, out = sys.argv[1:5]
W, H, FPS, SR = 1920, 1080, 30, 24000
OVER = 1.1  # o cenário cobre 10% além do quadro, para a câmera poder andar
tl = json.load(open(f'{build}/timeline.json', encoding='utf-8'))
T = tl['duration']; NF = int(T * FPS); GY = tl.get('ground_y', 950)
beats = tl['beats']

# ---------- cenário ----------
bg0 = Image.open(os.path.join(sdir, tl['background'])).convert('RGB')
bd = np.asarray(pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")(bg0)["depth"].resize(bg0.size), dtype=np.float32) / 255
BW, BH = int(W * OVER), int(H * OVER)
bg = cv2.resize(np.asarray(bg0), (BW, BH), interpolation=cv2.INTER_LANCZOS4)
bg = cv2.addWeighted(bg, 1.3, cv2.GaussianBlur(bg, (0, 0), 2.0), -0.3, 0)
bd = cv2.GaussianBlur(cv2.resize(bd, (BW, BH)), (0, 0), 8)
PY, PX = np.mgrid[0:H, 0:W].astype(np.float32)

# ---------- personagens: trilhas de posição, pulos e fala ----------
cast = {n: dict(c, pup=Puppet(os.path.join(pdir, c['puppet'])), segs=[], hops=[], talk=np.zeros(NF + 2, np.float32), x0=None, ph=i * 1.7) for i, (n, c) in enumerate(tl['cast'].items())}
OFF = {'left': -320, 'right': W + 320}
for b in beats:
    for a in b.get('do', []):
        c = cast[a['who']]; t0 = b['t0'] + a.get('at', 0)
        cur = c['segs'][-1][3] if c['segs'] else None
        if a['act'] == 'enter': c['segs'].append((t0, t0 + a.get('dur', 1.8), OFF[a['from']], a['to']))
        elif a['act'] == 'exit': c['segs'].append((t0, t0 + a.get('dur', 1.8), cur, OFF[a['to']]))
        elif a['act'] == 'move': c['segs'].append((t0, t0 + a.get('dur', 1.0), cur, a['to']))
        elif a['act'] == 'hop': c['hops'] += [b.get('start', t0) + 0.05 + k * 0.46 for k in range(a.get('n', 1))]
    if b.get('say'):
        y, sr = sf.read(f"{build}/{b['wav']}"); hop = sr // FPS
        rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2) + 1e-9) for i in range(len(y) // hop)])
        rms = rms / (np.percentile(rms, 90) + 1e-9); f0 = int(b['start'] * FPS)
        cast[b['who']]['talk'][f0:f0 + len(rms)] = np.clip(rms, 0, 1.3)[: NF + 2 - f0]


def char_state(c, t):
    """posição x, altura do pulo, achatamento, se está presente e inclinação de corrida"""
    if not c['segs'] or t < c['segs'][0][0]: return None
    seg = [s for s in c['segs'] if t >= s[0]][-1]
    k = smooth((t - seg[0]) / (seg[1] - seg[0])); x = seg[2] + (seg[3] - seg[2]) * k
    moving = seg[0] <= t < seg[1]; hop = 0.0; sq = 0.0; lean = 0.0
    if moving:  # anda pulando
        u = ((t - seg[0]) / 0.36) % 1.0; hop = 46 * np.sin(np.pi * u); sq = -0.06 * np.cos(2 * np.pi * u)
        lean = 5.0 * np.sign(seg[3] - seg[2]) * np.sin(np.pi * (t - seg[0]) / (seg[1] - seg[0]))
    for h in c['hops']:
        u = (t - h) / 0.42
        if 0 <= u < 1: hop = max(hop, 95 * np.sin(np.pi * u)); sq = 0.07 * np.sin(np.pi * u)
        elif 1 <= u < 1.5: sq = -0.09 * np.sin(np.pi * (u - 1) * 2) * (1.5 - u) * 2
    if not (-300 < x < W + 300): return None
    return x, hop, sq, lean


def blend(frame, rgba, M):
    """compõe sprite pré-multiplicado com transformação afim"""
    spr = cv2.warpAffine(rgba, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    a = spr[..., 3:4]; ys, xs = np.where(a[..., 0] > 0.003)
    if len(ys) == 0: return
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    frame[y0:y1, x0:x1] = frame[y0:y1, x0:x1] * (1 - a[y0:y1, x0:x1]) + spr[y0:y1, x0:x1, :3]


# ---------- áudio ----------
n = int(T * SR); voice = np.zeros(n); talk = np.zeros(n); fx = np.zeros(n)
for b in beats:
    if b.get('say'):
        y, sr = sf.read(f"{build}/{b['wav']}"); y = y / max(1e-6, np.abs(y).max()) * 0.85
        i = int(b['start'] * SR); y = y[: n - i]; voice[i:i + len(y)] += y; talk[max(0, i - 6000): i + len(y) + 6000] = 1
    if b.get('sfx'): synth.add(fx, synth.sfx(b['sfx']), b['t0'] + 0.1)
k = int(0.3 * SR); talk = np.convolve(talk, np.ones(k) / k, mode='same')
mus = synth.music(T) * (0.42 - 0.3 * talk); mus[: int(2.4 * SR)] *= 0.25; fade = int(2 * SR); mus[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh((voice + fx * 0.7 + mus) * 1.1) * 0.89
sf.write(f'{build}/audio.wav', np.stack([mix, mix], 1), SR)

logo = np.asarray(Image.open(os.path.join(here, '..', 'brand', 'logo.png')).convert('RGBA')).astype(np.float32)
lg = cv2.resize(logo, None, fx=0.64, fy=0.64, interpolation=cv2.INTER_AREA)
logo_spans = [(b['t0'], b['t0'] + b['wait']) for b in beats if b.get('logo')]

ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', f'{build}/audio.wav',
                       '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
cam = np.array([W / 2, H / 2, 1.0]); mouth_hold = {n_: [0, 0] for n_ in cast}
only = [int(x) for x in os.environ['FRAMES'].split(',')] if os.environ.get('FRAMES') else None
for f in range(NF):
    t = f / FPS
    # câmera: aproxima de quem fala, abre quando ninguém fala
    sp = next((b for b in beats if b.get('say') and b['start'] - 0.3 <= t <= b['end'] + 0.25), None)
    states = {n_: char_state(c, t) for n_, c in cast.items()}
    tgt = np.array([W / 2, H / 2, 1.0])
    if sp and states[sp['who']]:
        tgt = np.array([W / 2 + (states[sp['who']][0] - W / 2) * 0.5, H / 2 + 28, 1.13])
    cam += (tgt - cam) * 0.045
    cx, cy, z = cam
    cx = np.clip(cx, W / 2 - (W * OVER - W / z) / 2 + 2, W / 2 + (W * OVER - W / z) / 2 - 2)
    cy = np.clip(cy, H / 2 - (H * OVER - H / z) / 2 + 2, H / 2 + (H * OVER - H / z) / 2 - 2)
    if only and f not in only: continue
    wx = (PX - W / 2) / z + cx; wy = (PY - H / 2) / z + cy
    par = (cx - W / 2) * 0.05 + 6 * np.sin(t * 0.5)
    bx = (wx + (BW - W) / 2).astype(np.float32); by = (wy + (BH - H) / 2).astype(np.float32)
    dloc = cv2.remap(bd, bx, by, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    frame = cv2.remap(bg, (bx + (dloc - 0.5) * par).astype(np.float32), by, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).astype(np.float32)
    present = [(n_, s) for n_, s in states.items() if s]
    for n_, (x, hop, sq, lean) in present:  # sombras de contato
        c = cast[n_]; s = c['height'] / c['pup'].height
        sxp, syp = (x - cx) * z + W / 2, (GY - cy) * z + H / 2
        rx, ry = int(170 * s * z * (1 - hop / 400)), int(34 * s * z); pad = 40
        x0, y0 = int(sxp - rx - pad), int(syp - ry - pad); x1, y1 = x0 + 2 * (rx + pad), y0 + 2 * (ry + pad)
        if x0 >= 0 and y0 >= 0 and x1 <= W and y1 <= H:
            m = np.zeros((y1 - y0, x1 - x0), np.float32); cv2.ellipse(m, (rx + pad, ry + pad), (rx, ry), 0, 0, 360, 1, -1)
            frame[y0:y1, x0:x1] *= 1 - 0.42 * (1 - hop / 300) * cv2.GaussianBlur(m, (0, 0), 14)[..., None]
    for n_, (x, hop, sq, lean) in sorted(present, key=lambda p: cast[p[0]]['height']):
        c = cast[n_]; p = c['pup']; env = float(c['talk'][f])
        want = 0 if env < 0.14 else 1 if env < 0.6 else 2
        mh = mouth_hold[n_]
        if want != mh[0] and f - mh[1] >= 2: mh[0], mh[1] = want, f
        others = [s[0] for m_, s in present if m_ != n_]
        turn = float(np.clip((others[0] - x) / 500, -1, 1)) * 0.55 if others else 0.35 * np.sin(t * 0.7 + c['ph'])
        talking = env > 0.05
        tilt = (3.2 * np.sin(t * 2.4 + c['ph']) if talking else 1.6 * np.sin(t * 0.9 + c['ph'])) + lean * 0.6
        blink = ((t + c['ph'] * 1.3) % 3.3) < 0.12 or ((t * 0.83 + c['ph']) % 4.7) < 0.1
        rgba = p.pose(mouth=mh[0], blink=blink, tilt=tilt, bob=7 * min(env, 1.0) + hop * 0.05, turn=turn, breathe=np.sin(t * 1.9 + c['ph']))
        s = c['height'] / p.height; sx, sy = s * (1 - sq) * z, s * (1 + sq) * z
        th = np.deg2rad(lean); co, si = np.cos(th), np.sin(th)
        A = np.array([[sx * co, -sy * si], [sx * si, sy * co]])
        anchor = np.array([p.cx, p.feet]); dst = np.array([(x - cx) * z + W / 2, (GY - hop - cy) * z + H / 2])
        M = np.hstack([A, (dst - A @ anchor)[:, None]]).astype(np.float32)
        blend(frame, rgba, M)
    for a, b_ in logo_spans:
        if a <= t <= b_:
            al = min(1, (t - a) / 0.4, (b_ - t) / 0.4); h, w = lg.shape[:2]; x0, y0 = (W - w) // 2, 40
            aa = lg[..., 3:4] / 255 * al; frame[y0:y0 + h, x0:x0 + w] = frame[y0:y0 + h, x0:x0 + w] * (1 - aa) + lg[..., :3] * aa
    if t > T - 0.5: frame *= (T - t) / 0.5
    fr = np.clip(frame, 0, 255).astype(np.uint8)
    if only: Image.fromarray(fr).save(f'{build}/still_{f:05d}.jpg', quality=90)
    else: ff.stdin.write(fr.tobytes())
ff.stdin.close(); ff.wait(); print('ok', out, T)
