// Gera a identidade visual: avatar, banner do canal, marca d'água e miniaturas.
// Uso: node brand.mjs            -> brand/*.png
//      node brand.mjs thumb <saida.png> "<LINHA 1>" "<LINHA 2>" <cor> <prop1,prop2,...>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const brandDir = path.join(here, '..', 'brand');
const FONT_CSS = `@font-face{font-family:"Baloo 2";font-weight:400 800;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(here, 'fonts/Baloo2.ttf')).toString('base64')})}`;
const browser = await chromium.launch();

async function shot(file, w, h, build, arg, transparent = false) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(here, 'stage.html')).href);
  await page.addStyleTag({ content: FONT_CSS + (transparent ? 'html,body{background:transparent!important}' : '') });
  if (transparent) await page.evaluate(() => { document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; });
  await page.evaluate(async ([w, h, fn, arg]) => {
    await document.fonts.load('800 100px "Baloo 2"'); await document.fonts.ready;
    const svg = document.getElementById('stage');
    svg.setAttribute('width', w); svg.setAttribute('height', h); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML = new Function('arg', 'return (' + fn + ')(arg)')(arg);
  }, [w, h, build.toString(), arg]);
  await page.screenshot({ path: file, omitBackground: transparent });
  await page.close();
  console.log('ok', file);
}

const thumb = (a) => {
  const items = a.props.map((id, i) => {
    const cols = 3, x = 690 + (i % cols) * 215, y = 410 + Math.floor(i / cols) * 200;
    return `<g transform="translate(${x},${y}) rotate(${[-8, 7, 6, -6, -5, 8][i % 6]}) scale(.52)"><circle r="180" fill="#fff" opacity=".9"/>${prop(id, 1)}</g>`;
  }).join('');
  const line = (txt, y, size, fill) => `<text x="640" y="${y}" text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="${size}" fill="${fill}" stroke="#2B2D42" stroke-width="${size * 0.3}" stroke-linejoin="round" paint-order="stroke">${txt}</text>
    <text x="640" y="${y}" text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="${size}" fill="${fill}" stroke="#fff" stroke-width="${size * 0.16}" stroke-linejoin="round" paint-order="stroke">${txt}</text>`;
  return `<g transform="scale(${1280 / 1920})">${background(3)}</g>
    ${items}
    <g transform="translate(330,770) scale(.98)">${capilu({ mouth: 0.75, wave: 1, t: 0.4, look: 0.6 })}</g>
    <g transform="translate(250,0)">${line(a.l1, 130, 120, '#FFC93C')}${line(a.l2, 250, 150, a.color)}</g>`;
};

if (process.argv[2] === 'thumb') {
  const [, , , out, l1, l2, color, props] = process.argv;
  await shot(out, 1280, 720, thumb, { l1, l2, color, props: props.split(',') });
} else {
  fs.mkdirSync(brandDir, { recursive: true });
  // Avatar 800x800 (o YouTube recorta em círculo)
  await shot(path.join(brandDir, 'avatar-800.png'), 800, 800, () => `
    <rect width="800" height="800" fill="#FFC93C"/>
    <circle cx="400" cy="400" r="330" fill="#FFE08A"/>
    <path d="M0 640 Q 400 560 800 640 V800 H0z" fill="#57B865"/>
    <g transform="translate(400,1010) scale(1.25)">${capilu({ mouth: 0.5, t: 0.4 })}</g>`);
  // Banner 2560x1440 — área segura central 1546x423 (logo + lema dentro dela)
  await shot(path.join(brandDir, 'banner-2560x1440.png'), 2560, 1440, () => `
    <g transform="scale(${2560 / 1920})">${background(3)}</g>
    <g transform="translate(700,960) scale(.52)">${capilu({ mouth: 0.6, wave: 1, t: 0.4, look: 0.5 })}</g>
    ${logo(1420, 720, 0.95)}
    ${tagline(1420, 850, 78)}
    <text x="1420" y="925" text-anchor="middle" font-family="'Baloo 2'" font-weight="700" font-size="46" fill="#fff" stroke="#2B2D42" stroke-width="9" stroke-linejoin="round" paint-order="stroke">Vídeo novo toda semana • Aprender brincando</text>`);
  // Logo com fundo transparente
  await shot(path.join(brandDir, 'logo.png'), 1100, 420, () => `${logo(550, 250, 1.1)}${tagline(550, 370, 64)}`, null, true);
  // Marca d'água do vídeo 150x150
  await shot(path.join(brandDir, 'marca-dagua-150.png'), 150, 150, () => `<circle cx="75" cy="75" r="72" fill="#FFC93C"/><g transform="translate(75,186) scale(.23)">${capilu({ t: 0.4, bird: false })}</g>`, null, true);
  // Paleta
  await shot(path.join(brandDir, 'paleta.png'), 1400, 360, () => {
    const c = [['#C07F3F', 'Capilu'], ['#FFC93C', 'Sol'], ['#FF6B6B', 'Coral'], ['#6BCB77', 'Folha'], ['#2EC4B6', 'Rio'], ['#4D96FF', 'Céu'], ['#2B2D42', 'Tinta'], ['#FFF6E5', 'Creme']];
    return `<rect width="1400" height="360" fill="#fff"/>` + c.map(([h, n], i) => `<rect x="${30 + i * 170}" y="30" width="150" height="210" rx="28" fill="${h}" stroke="#eee" stroke-width="3"/>
      <text x="${105 + i * 170}" y="285" text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="34" fill="#2B2D42">${n}</text>
      <text x="${105 + i * 170}" y="325" text-anchor="middle" font-family="'Baloo 2'" font-weight="500" font-size="26" fill="#666">${h}</text>`).join('');
  });
}
await browser.close();
