// Renderiza um episódio: quadros via Chromium (Playwright) -> ffmpeg -> MP4 com áudio.
// Uso: node render.mjs <pasta-build> <saida.mp4> [--stills t1,t2,...]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [build, out] = process.argv.slice(2);
const stillsArg = process.argv.includes('--stills') ? process.argv[process.argv.indexOf('--stills') + 1] : null;
const tl = JSON.parse(fs.readFileSync(path.join(build, 'timeline.json'), 'utf8'));
const WORKERS = 4;
const FONT_CSS = `@font-face{font-family:"Baloo 2";font-weight:400 800;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(here, 'fonts/Baloo2.ttf')).toString('base64')})}`;

const browser = await chromium.launch();
async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(here, 'stage.html')).href);
  await page.addStyleTag({ content: FONT_CSS });
  await page.evaluate(async (t) => { setTimeline(t); await document.fonts.load('800 100px "Baloo 2"'); await document.fonts.ready; }, tl);
  return page;
}

if (stillsArg) {
  const page = await newPage();
  for (const t of stillsArg.split(',').map(Number)) {
    await page.evaluate((t) => renderAt(t), t);
    await page.screenshot({ path: path.join(build, `still-${String(t).padStart(5, '0')}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const per = Math.ceil(tl.frames / WORKERS);
const parts = [];
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const a = w * per, b = Math.min(tl.frames, a + per);
  if (a >= b) return;
  const part = path.join(build, `part${w}.mp4`); parts[w] = part;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(tl.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(tl.fps), part], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  const page = await newPage();
  for (let f = a; f < b; f++) {
    await page.evaluate((t) => renderAt(t), f / tl.fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (w === 0 && f % 150 === 0) console.log(`quadro ${f}/${per}`);
  }
  ff.stdin.end(); await done; await page.close();
}));
await browser.close();

const list = path.join(build, 'parts.txt');
fs.writeFileSync(list, parts.filter(Boolean).map((p) => `file '${path.resolve(p)}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', path.join(build, 'audio.wav'),
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('ok', out);
