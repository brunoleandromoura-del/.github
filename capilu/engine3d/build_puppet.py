#!/usr/bin/env python3
"""Monta um boneco articulado a partir do desenho base e das variações (bocas, piscada).
Uso: build_puppet.py <saida_dir> <rig.json>
rig.json: {"base":..., "mouths":[repouso, media, aberta], "blink":..., "neck_y":440, "eye_boxes":[[x0,y0,x1,y1],...], "erase":[[x0,y0,x1,y1],...]}"""
import sys, json, os, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session
from transformers import pipeline

out, rig = sys.argv[1], json.load(open(sys.argv[2]))
os.makedirs(out, exist_ok=True)
base = Image.open(rig['base']).convert('RGB')
alpha = np.asarray(remove(base, session=new_session(rig.get('matting', 'isnet-general-use')), only_mask=True)).astype(np.float32) / 255
for b in rig.get('erase', []):  # apaga restos indesejados (ex.: flor solta)
    alpha[b[1]:b[3], b[0]:b[2]] = 0
# mantém só o maior componente conectado
n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 0.5).astype(np.uint8))
keep = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]); alpha *= cv2.dilate((lab == keep).astype(np.uint8), np.ones((9, 9), np.uint8))
# fecha buracos internos (ex.: parte de dentro das orelhas)
ff = (alpha > 0.5).astype(np.uint8); h_, w_ = ff.shape; fl = cv2.copyMakeBorder(ff, 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0)
cv2.floodFill(fl, None, (0, 0), 2); alpha[(fl[1:-1, 1:-1] == 0)] = 1.0
ys, xs = np.where(alpha > 0.5)
depth = np.asarray(pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")(base)["depth"].resize(base.size), dtype=np.float32) / 255
cv2.imwrite(f'{out}/alpha.png', (alpha * 255).astype(np.uint8))
cv2.imwrite(f'{out}/depth.png', (cv2.GaussianBlur(depth, (0, 0), 6) * 255).astype(np.uint8))
for i, m in enumerate(rig['mouths']): Image.open(m).convert('RGB').save(f'{out}/mouth_{i}.png')
if rig['blink'] == 'auto':  # pálpebras desenhadas: preenche o olho com o pelo ao redor e traça os cílios
    b0 = cv2.cvtColor(np.asarray(Image.open(rig['mouths'][0]).convert('RGB')), cv2.COLOR_RGB2BGR)
    m = np.zeros(b0.shape[:2], np.uint8)
    for b in rig['eye_boxes']: cv2.ellipse(m, ((b[0] + b[2]) // 2, (b[1] + b[3]) // 2), ((b[2] - b[0]) // 2, (b[3] - b[1]) // 2), 0, 0, 360, 255, -1)
    bl = cv2.inpaint(b0, cv2.dilate(m, np.ones((5, 5), np.uint8)), 15, cv2.INPAINT_TELEA)
    for b in rig['eye_boxes']:
        cv2.ellipse(bl, ((b[0] + b[2]) // 2, (b[1] + b[3]) // 2 - 6), (int((b[2] - b[0]) * 0.36), int((b[3] - b[1]) * 0.24)), 0, 15, 165, rig.get('lash', (20, 30, 45)), 7, cv2.LINE_AA)
    cv2.imwrite(f'{out}/blink.png', bl)
else:
    Image.open(rig['blink']).convert('RGB').save(f'{out}/blink.png')
feet = alpha[int(ys.max()) - 30: int(ys.max()) + 1]
meta = {"neck_y": rig['neck_y'], "eye_boxes": rig['eye_boxes'], "feet_y": int(ys.max()), "top_y": int(ys.min()),
        "cx": float(np.where(feet > 0.5)[1].mean()), "size": list(base.size)}
json.dump(meta, open(f'{out}/rig.json', 'w')); print('ok', out, meta)
