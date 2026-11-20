// Cena: transforma a linha do tempo (timeline.json) em um quadro SVG para o instante t.
let TL = null;
function setTimeline(tl) { TL = tl; }

function rnd(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

function confetti(t0, t, cx, cy, seed) {
  const dt = t - t0; if (dt < 0 || dt > 2.2) return '';
  const r = rnd(seed + 1), cols = ['#FF6B6B', '#FFC93C', '#6BCB77', '#2EC4B6', '#4D96FF', '#FF8A3D', '#fff'];
  let out = '';
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2, v = 380 + r() * 520, c = cols[Math.floor(r() * cols.length)], sz = 12 + r() * 16, sp = r() * 8 - 4;
    const x = cx + Math.cos(a) * v * dt, y = cy + Math.sin(a) * v * dt * 0.8 - 260 * dt + 620 * dt * dt;
    out += `<rect x="${-sz / 2}" y="${-sz / 3}" width="${sz}" height="${sz * 0.66}" rx="3" fill="${c}" opacity="${clamp(2.2 - dt)}" transform="translate(${x},${y}) rotate(${sp * dt * 120})"/>`;
  }
  return out;
}

function word(text, color, x, y, size, k) {
  const s = easeBack(k);
  return `<g transform="translate(${x},${y}) scale(${s})"><text text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="${size}" fill="${color}" stroke="#fff" stroke-width="${size * 0.2}" stroke-linejoin="round" paint-order="stroke">${text}</text></g>`;
}

function halo(color, x, y, r, a) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.55 * a}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${0.22 * a}"/>`;
}

function frame(t) {
  const L = TL.lines;
  // estado acumulado até t
  const st = { mode: 'title', modeT: 0, item1: null, item2: null, word: null, ask: null, recap: null, hits: [], hops: [], bursts: [], challenge: null, wave: null, chirp: null };
  let cur = null;
  L.forEach((ln, i) => {
    if (ln.cueStart > t) return;
    const c = ln.cue, s = ln.cueStart;
    cur = ln;
    const setMode = (m) => { if (st.mode !== m) { st.mode = m; st.modeT = s; } };
    if (c.type === 'title') setMode('title');
    else if (c.type === 'greet') { setMode('main'); st.wave = [ln.start, ln.end]; }
    else if (c.type === 'tico') { st.chirp = [ln.start + 0.9, ln.end + 0.8]; }
    else if (c.type === 'item') { setMode('main'); st.item1 = { id: c.id, t0: s }; st.item2 = null; st.word = null; st.ask = null; st.challenge = null; }
    else if (c.type === 'ask') { st.ask = { t0: ln.end, t1: (L[i + 1] || ln).cueStart }; }
    else if (c.type === 'reveal') { st.word = { text: c.word, color: c.color, t0: ln.start }; st.ask = null; st.hops.push(ln.start); st.bursts.push([ln.start, 1340, 430, i]); }
    else if (c.type === 'also') { st.item2 = { id: c.id, t0: s }; }
    else if (c.type === 'recap') { setMode('recap'); st.recap = c.items; st.hits = []; st.item1 = st.item2 = st.word = null; }
    else if (c.type === 'hit') { st.hits[c.i] = ln.start; }
    else if (c.type === 'cheer') { st.hops.push(ln.start, ln.start + 0.55); st.bursts.push([ln.start, 960, 420, i]); }
    else if (c.type === 'challenge') { setMode('main'); st.recap = null; st.item1 = { id: c.id, t0: s }; st.challenge = { text: c.text, color: c.color, t0: s }; }
    else if (c.type === 'bye') { setMode('bye'); st.item1 = null; st.challenge = null; st.wave = [ln.start, ln.end + 2.5]; st.chirp = [ln.end, ln.end + 0.9]; st.bursts.push([ln.end - 1.2, 960, 380, i]); }
  });

  const fi = Math.min(TL.mouth.length - 1, Math.floor(t * TL.fps));
  const mouth = TL.mouth[fi] || 0;
  const blinkPhase = (t + 0.7) % 3.4; const blink = blinkPhase < 0.14 ? Math.sin(blinkPhase / 0.14 * Math.PI) : 0;
  const hopY = st.hops.reduce((a, h) => { const d = t - h; return d >= 0 && d < 0.5 ? Math.max(a, Math.sin(d / 0.5 * Math.PI) * 90) : a; }, 0);
  const happy = st.hops.some(h => t - h >= 0 && t - h < 0.9) ? 1 : 0;
  const waving = st.wave && t >= st.wave[0] && t <= st.wave[1] ? clamp(Math.min(t - st.wave[0], st.wave[1] - t) / 0.3) : 0;
  const chirp = st.chirp && t >= st.chirp[0] && t <= st.chirp[1] ? 1 : 0;
  const mk = easeInOut((t - st.modeT) / 0.6);

  // posição da Capilu por modo
  const poses = { title: [960, 1060, 0.78], main: [520, 970, 1.08], recap: [250, 1000, 0.8], bye: [960, 1020, 1.05] };
  const prev = st.mode === 'main' && st.modeT > 60 ? poses.recap : st.mode === 'recap' ? poses.main : st.mode === 'bye' ? poses.main : poses.title;
  const P = poses[st.mode].map((v, i) => lerp(prev[i], v, mk));
  const hasItem = st.mode === 'main' && st.item1;
  const pointing = hasItem && !waving ? clamp((t - st.item1.t0) / 0.3) * (st.challenge ? 0 : 1) * (t - st.item1.t0 < 2.2 ? 1 : 0) : 0;

  let tint = null;
  

  let fg = '';
  if (st.mode === 'title') {
    fg += `<rect width="1920" height="1080" fill="#FFF6E5" opacity="${0.35}"/>`;
    fg += logo(960, 310, 1.15, t - 0.15);
    fg += `<g opacity="${clamp((t - 1.2) / 0.5)}">${tagline(960, 440, 76)}</g>`;
    fg += confetti(0.75, t, 960, 300, 3);
  }

  if (hasItem) {
    const two = !!st.item2;
    const k2 = two ? easeInOut((t - st.item2.t0) / 0.45) : 0;
    const x1 = lerp(1340, 1150, k2), y = 420;
    const k1 = easeBack((t - st.item1.t0) / 0.5);
    if (st.word) fg += halo(st.word.color, 1340, y, 300 + Math.sin(t * 2) * 10, clamp((t - st.word.t0) / 0.4));
    const bob = Math.sin(t * 2.4) * 10;
    fg += `<g transform="translate(${x1},${y + bob}) scale(${k1 * lerp(1.15, 0.92, k2)})">${prop(st.item1.id, t)}</g>`;
    if (two) fg += `<g transform="translate(1560,${y - bob}) scale(${easeBack((t - st.item2.t0) / 0.5) * 0.92})">${prop(st.item2.id, t)}</g>`;
    if (st.ask && t >= st.ask.t0 - 0.2) {
      const span = st.ask.t1 - st.ask.t0;
      for (let i = 0; i < 3; i++) { const k = easeBack((t - st.ask.t0 - i * span / 3.4) / 0.3); if (k > 0) fg += `<g transform="translate(${1200 + i * 140},770) scale(${k}) rotate(${Math.sin(t * 5 + i) * 10})"><text text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="190" fill="#FF8A3D" stroke="#fff" stroke-width="34" stroke-linejoin="round" paint-order="stroke">?</text></g>`; }
    }
    if (st.word) fg += word(st.word.text, st.word.color, 1340, 830, st.word.text.length > 7 ? 170 : 200, (t - st.word.t0) / 0.45);
    if (st.challenge) {
      fg += word(st.challenge.text, st.challenge.color, 1340, 830, 190, (t - st.challenge.t0) / 0.45);
      const a = t * 1.6; // lupa procurando
      fg += `<g transform="translate(${1340 + Math.cos(a) * 150},${420 + Math.sin(a * 1.3) * 90}) rotate(-20)"><circle r="92" fill="#fff" opacity=".28"/><circle r="92" fill="none" stroke="#2B2D42" stroke-width="20"/><rect x="-13" y="92" width="26" height="120" rx="13" fill="#2B2D42"/></g>`;
    }
  }

  if (st.mode === 'recap' && st.recap) {
    const n = st.recap.length, sp = 1140 / (n - 1), R = Math.min(140, sp * 0.44), q = R / 140;
    st.recap.forEach((it, i) => {
      const x = 640 + i * sp, y = 400;
      const h = st.hits[i];
      fg += `<circle cx="${x}" cy="${y}" r="${R}" fill="#fff" opacity="${0.5 * mk}"/>`;
      if (h !== undefined && t >= h) {
        const k = easeBack((t - h) / 0.45);
        fg += `<circle cx="${x}" cy="${y}" r="${R}" fill="${it.color}" opacity=".22"/>`;
        fg += `<g transform="translate(${x},${y + Math.sin(t * 2.4 + i) * 8}) scale(${k * 0.72 * q})">${prop(it.id, t)}</g>`;
        fg += word(it.word, it.color, x, y + R + 75, Math.min(60, sp * 0.18), (t - h) / 0.45);
      } else {
        fg += `<text x="${x}" y="${y + 50 * q}" text-anchor="middle" font-family="'Baloo 2'" font-weight="800" font-size="${160 * q}" fill="#FF8A3D" opacity="${0.5 * mk}">?</text>`;
      }
    });
  }

  if (st.mode === 'bye') {
    fg += `<g opacity="${mk}">${word('Até a próxima!', '#FF6B6B', 960, 200, 140, (t - st.modeT) / 0.5)}</g>`;
  }

  const look = hasItem ? 0.9 : 0;
  const squash = 1 + (hopY > 0 ? 0.04 : 0);
  const ch = `<g transform="translate(${P[0]},${P[1] - hopY}) scale(${P[2]},${P[2] * squash})">${capilu({ mouth, blink, wave: waving, point: pointing, look, t, chirp, happy })}</g>`;
  const bursts = st.bursts.map(b => confetti(b[0], t, b[1], b[2], b[3])).join('');
  // em modo título/tchau a Capilu fica à frente; nos demais também (objetos ficam à direita)
  return background(t, tint) + fg + ch + bursts;
}

function renderAt(t) { document.getElementById('stage').innerHTML = frame(t); }
