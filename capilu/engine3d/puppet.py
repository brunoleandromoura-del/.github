"""Boneco articulado: boca sincronizada com a fala, piscada, cabeça que inclina e vira, respiração e pulos."""
import json, numpy as np, cv2

PAD = 80


def smooth(k):
    k = np.clip(k, 0, 1); return k * k * (3 - 2 * k)


class Puppet:
    def __init__(self, d):
        self.rig = r = json.load(open(f'{d}/rig.json'))
        a = cv2.imread(f'{d}/alpha.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
        pad = lambda im, v=0: cv2.copyMakeBorder(im, PAD, PAD, PAD, PAD, cv2.BORDER_CONSTANT, value=v)
        self.alpha = pad(a)
        self.depth = pad(cv2.imread(f'{d}/depth.png', cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255)
        rgb = lambda f: pad(cv2.cvtColor(cv2.imread(f'{d}/{f}'), cv2.COLOR_BGR2RGB).astype(np.float32))
        self.mouths = [rgb(f'mouth_{i}.png') for i in range(3)]
        blink = rgb('blink.png')
        h, w = self.alpha.shape
        m = np.zeros((h, w), np.float32)
        for b in r['eye_boxes']:
            cv2.ellipse(m, ((b[0] + b[2]) // 2 + PAD, (b[1] + b[3]) // 2 + PAD), ((b[2] - b[0]) // 2, (b[3] - b[1]) // 2), 0, 0, 360, 1, -1)
        m = cv2.GaussianBlur(m, (0, 0), 5)[..., None]
        # quadros pré-multiplicados: [boca][piscando]
        self.frames = [[np.dstack([f * self.alpha[..., None], self.alpha]) for f in (mo, mo * (1 - m) + blink * m)] for mo in self.mouths]
        self.neck = r['neck_y'] + PAD; self.feet = r['feet_y'] + PAD; self.cx = r['cx'] + PAD
        self.height = r['feet_y'] - r['top_y']
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        self.xx, self.yy = xx, yy
        self.wh = smooth((self.neck + 45 - yy) / 90)  # 1 na cabeça, 0 no corpo
        head = (self.alpha > 0.5) & (yy < self.neck)
        self.dref = float(np.median(self.depth[head]))

    def pose(self, mouth=0, blink=False, tilt=0.0, bob=0.0, turn=0.0, breathe=0.0):
        """Devolve RGBA pré-multiplicado (float32) com a cabeça inclinada/virada e o peito respirando."""
        src = self.frames[mouth][1 if blink else 0]
        xx, yy, wh = self.xx, self.yy, self.wh
        th = np.deg2rad(tilt) * wh
        dx, dy = xx - self.cx, yy - self.neck
        c, s = np.cos(th), np.sin(th)
        mx = self.cx + dx * c + dy * s - (self.depth - self.dref) * turn * 60 * wh
        my = self.neck + (-dx * s + dy * c) - bob * wh
        body = 1 - wh
        mx = mx - (xx - self.cx) * breathe * 0.02 * body * smooth((yy - self.neck) / 120) * smooth((self.feet - 60 - yy) / 120)
        return cv2.remap(src, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
