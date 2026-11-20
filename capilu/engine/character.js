// Capilu — a capivarinha curiosa. Desenho vetorial original.
// Origem local: centro dos pés (0,0); y negativo sobe. Altura ~620, largura ~420.
const PAL = {
  fur: '#C07F3F', furDark: '#93592A', belly: '#E8BC86', snout: '#DDA466',
  nose: '#4E2C14', cheek: '#FF9AA2', flower: '#FFC93C', flowerCore: '#FF8A3D',
  bird: '#FFD23F', birdWing: '#F5A623', beak: '#FF7A2F', ink: '#2B2D42',
  sky1: '#8FD8F8', sky2: '#DDF4FF', sun: '#FFC93C', hill1: '#8BD88F', hill2: '#6BCB77',
  river: '#2EC4B6', grass: '#57B865', coral: '#FF6B6B', cream: '#FFF6E5',
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const easeBack = (k) => { k = clamp(k); const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

function tico(t, chirp = 0) {
  const bob = Math.sin(t * 5) * 3 - chirp * 26 * Math.abs(Math.sin(t * 14));
  const beakOpen = chirp > 0 ? 10 * Math.abs(Math.sin(t * 22)) : 0;
  return `<g transform="translate(70,${-656 + bob})">
    <path d="M-8 30 v16 M10 30 v16" stroke="${PAL.beak}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="38" ry="34" fill="${PAL.bird}"/>
    <ellipse cx="-14" cy="6" rx="18" ry="13" fill="${PAL.birdWing}" transform="rotate(${-20 - chirp * 30 * Math.abs(Math.sin(t * 18))} -14 6)"/>
    <path d="M30 ${-8 - beakOpen / 2} l24 ${6} l-24 ${4}z" fill="${PAL.beak}"/>
    <path d="M30 ${0 + beakOpen / 2} l20 ${0} l-20 ${7}z" fill="#E86A1F"/>
    <circle cx="14" cy="-10" r="6" fill="${PAL.ink}"/><circle cx="16" cy="-12" r="2" fill="#fff"/>
    <path d="M-6 -32 q4 -16 12 -2" fill="none" stroke="${PAL.birdWing}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

// opts: mouth 0..1, blink 0..1 (1 = fechado), wave 0..1, point 0..1, look -1..1, t (s), chirp 0..1, happy 0..1, bird bool
function capilu(o = {}) {
  const { mouth = 0, blink = 0, wave = 0, point = 0, look = 0, t = 0, chirp = 0, happy = 0, bird = true } = o;
  const breathe = Math.sin(t * 2.2) * 4;
  const eyeSy = Math.max(0.08, 1 - blink);
  const px = look * 7;
  const waveAng = wave > 0 ? -125 * wave + Math.sin(t * 11) * 16 * wave : point > 0 ? -78 * point : 0;
  const mo = clamp(mouth);
  const eye = (cx) => happy > 0.5
    ? `<path d="M${cx - 20} -486 q20 -24 40 0" fill="none" stroke="${PAL.ink}" stroke-width="9" stroke-linecap="round"/>`
    : `<g transform="translate(${cx},-490) scale(1,${eyeSy})"><circle r="19" fill="${PAL.ink}"/><circle cx="${-6 + px}" cy="-7" r="7" fill="#fff"/><circle cx="${7 + px}" cy="6" r="3" fill="#fff" opacity=".8"/></g>`;
  const mouthSvg = mo > 0.06
    ? `<g transform="translate(0,-316)"><ellipse rx="${32 + mo * 6}" ry="${10 + mo * 26}" fill="#5A2418"/><ellipse cy="${6 + mo * 14}" rx="${18 + mo * 4}" ry="${4 + mo * 10}" fill="#FF8FA3"/></g>`
    : `<path d="M-34 -332 q34 ${24 + happy * 8} 68 0" fill="none" stroke="${PAL.nose}" stroke-width="8" stroke-linecap="round"/>`;
  const teeth = `<rect x="-17" y="-330" width="15" height="${mo > 0.06 ? 16 : 20}" rx="4" fill="#fff"/><rect x="2" y="-330" width="15" height="${mo > 0.06 ? 16 : 20}" rx="4" fill="#fff"/>`;
  return `<g>
    <ellipse cx="0" cy="4" rx="210" ry="24" fill="#000" opacity=".12"/>
    <ellipse cx="-92" cy="-10" rx="62" ry="24" fill="${PAL.furDark}"/><ellipse cx="92" cy="-10" rx="62" ry="24" fill="${PAL.furDark}"/>
    <g transform="translate(0,${breathe * 0.4})">
      <ellipse cx="-180" cy="-190" rx="36" ry="70" fill="${PAL.furDark}" transform="rotate(18 -180 -190)"/>
      <g transform="rotate(${waveAng} 168 -240)"><ellipse cx="186" cy="-186" rx="36" ry="72" fill="${PAL.furDark}" transform="rotate(-18 186 -186)"/></g>
      <ellipse cx="0" cy="-160" rx="196" ry="${166 + breathe}" fill="${PAL.fur}"/>
      <ellipse cx="0" cy="-120" rx="120" ry="${96 + breathe}" fill="${PAL.belly}" opacity=".55"/>
    </g>
    <g transform="translate(0,${breathe}) rotate(${Math.sin(t * 1.3) * 2.2 + look * 2} 0 -330)">
      <g><ellipse cx="-150" cy="-560" rx="30" ry="34" fill="${PAL.furDark}"/><ellipse cx="-150" cy="-556" rx="15" ry="18" fill="#6B3F1C"/>
         <ellipse cx="150" cy="-560" rx="30" ry="34" fill="${PAL.furDark}"/><ellipse cx="150" cy="-556" rx="15" ry="18" fill="#6B3F1C"/></g>
      <rect x="-172" y="-590" width="344" height="350" rx="120" fill="${PAL.fur}"/>
      <path d="M-22 -590 q8 -30 22 -4 q10 -32 24 2" fill="${PAL.fur}" stroke="${PAL.furDark}" stroke-width="6" stroke-linejoin="round"/>
      <rect x="-138" y="-452" width="276" height="200" rx="92" fill="${PAL.snout}"/>
      <circle cx="-150" cy="-400" r="26" fill="${PAL.cheek}" opacity=".7"/><circle cx="150" cy="-400" r="26" fill="${PAL.cheek}" opacity=".7"/>
      ${eye(-104)}${eye(104)}
      <path d="M-74 -420 q0 -26 30 -26 h88 q30 0 30 26 q0 30 -44 34 q-18 2 -22 20 h-16 q-4 -18 -22 -20 q-44 -4 -44 -34z" fill="${PAL.nose}"/>
      <ellipse cx="-40" cy="-420" rx="11" ry="7" fill="#2A1508"/><ellipse cx="40" cy="-420" rx="11" ry="7" fill="#2A1508"/>
      ${mouthSvg}${teeth}
      <g transform="translate(-140,-566) rotate(${Math.sin(t * 1.7) * 5})">
        ${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-22" rx="15" ry="20" fill="${PAL.flower}" transform="rotate(${a})"/>`).join('')}
        <circle r="13" fill="${PAL.flowerCore}"/>
      </g>
      ${bird ? tico(t, chirp) : ''}
    </g>
  </g>`;
}

// Cenário: beira de rio inspirada no Pantanal
function background(t, tint) {
  const cloud = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})" fill="#fff" opacity=".95"><ellipse rx="90" ry="38"/><ellipse cx="-50" cy="-22" rx="52" ry="38"/><ellipse cx="30" cy="-34" rx="62" ry="46"/></g>`;
  const cx = (base, sp) => ((base + t * sp) % 2400) - 240;
  const bush = (x, y, s, c) => `<g transform="translate(${x},${y}) scale(${s})" fill="${c}"><circle r="60"/><circle cx="-62" cy="18" r="46"/><circle cx="64" cy="14" r="50"/></g>`;
  const reed = (x, s) => `<g transform="translate(${x},925) scale(${s}) rotate(${Math.sin(t * 1.5 + x) * 3})"><path d="M0 0 q-6 -70 0 -150" stroke="#3E9B4F" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="-9" y="-176" width="18" height="52" rx="9" fill="#8A5528"/></g>`;
  return `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.sky1}"/><stop offset="1" stop-color="${PAL.sky2}"/></linearGradient>
      <linearGradient id="riv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FD6CB"/><stop offset="1" stop-color="${PAL.river}"/></linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#sky)"/>
    <g transform="translate(1690,170)"><circle r="120" fill="${PAL.sun}" opacity=".25"/><circle r="84" fill="${PAL.sun}"/></g>
    ${cloud(cx(300, 14), 190, 1.1)}${cloud(cx(1300, 9), 120, 0.8)}${cloud(cx(2000, 12), 290, 0.7)}
    <path d="M0 700 Q 330 520 720 660 T 1380 640 T 1920 600 V1080 H0z" fill="${PAL.hill1}"/>
    <path d="M0 780 Q 420 650 900 760 T 1920 720 V1080 H0z" fill="${PAL.hill2}"/>
    ${bush(1560, 735, 1, '#4FB061')}${bush(250, 770, 0.8, '#4FB061')}
    <path d="M0 840 Q 480 800 960 838 T 1920 830 V1080 H0z" fill="url(#riv)"/>
    ${[0, 1, 2, 3, 4].map(i => `<path d="M${200 + i * 380 + Math.sin(t * 1.2 + i) * 24} ${880 + (i % 2) * 34} q30 -12 60 0 t60 0" stroke="#fff" stroke-width="6" fill="none" opacity=".55" stroke-linecap="round"/>`).join('')}
    <path d="M0 950 Q 500 900 960 940 T 1920 925 V1080 H0z" fill="${PAL.grass}"/>
    ${reed(70, 1)}${reed(130, 0.75)}${reed(1840, 0.9)}${reed(1780, 0.7)}
    ${tint ? `<rect width="1920" height="1080" fill="${tint.color}" opacity="${tint.a}"/>` : ''}`;
}

function logo(x, y, s = 1, t = 99) {
  const cols = ['#FF6B6B', '#FFC93C', '#6BCB77', '#2EC4B6', '#4D96FF', '#FF8A3D'];
  const L = 'Capilu'.split('');
  const w = [150, 132, 138, 70, 62, 130];
  let cx = -w.reduce((a, b) => a + b, 0) / 2, out = '';
  L.forEach((ch, i) => {
    const k = easeBack((t - i * 0.09) / 0.45);
    const rot = [-6, 4, -3, 5, -4, 6][i];
    out += `<g transform="translate(${cx + w[i] / 2},${(1 - k) * -60}) scale(${k}) rotate(${rot})">
      <text text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="250" stroke="#fff" stroke-width="44" stroke-linejoin="round" fill="#fff">${ch}</text>
      <text text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="250" stroke="${PAL.ink}" stroke-width="14" stroke-linejoin="round" paint-order="stroke" fill="${cols[i]}">${ch}</text></g>`;
    cx += w[i];
  });
  return `<g transform="translate(${x},${y}) scale(${s})">${out}</g>`;
}

function tagline(x, y, size = 64, fill = PAL.ink) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Baloo 2'" font-weight="700" font-size="${size}" fill="${fill}" stroke="#fff" stroke-width="${size / 5}" stroke-linejoin="round" paint-order="stroke">a capivarinha curiosa</text>`;
}
