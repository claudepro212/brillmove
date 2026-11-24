'use strict';
/* ============================================================
   BrillMove — free chess game review
   ============================================================ */

/* ---------------- utils ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const icon = (n, cls = '') => `<svg class="i ${cls}"><use href="#i-${n}"/></svg>`;
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e) { return false; } },
  del(k){ try { localStorage.removeItem(k); } catch(e) {} },
};
function toast(msg, ms = 2400){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }
const settings = Object.assign({board: 'nebula', pieces: 'cburnett', sound: true, anim: true, coords: true, depth: 16, speed: 1100, coach: 'pawnsworth', voice: false, hype: true, bigfx: true}, store.get('gl2_settings', {}));
const saveSettings = () => store.set('gl2_settings', settings);
if (settings.ver !== 3) { settings.ver = 3; settings.board = 'ocean'; if (settings.pieces === 'neon') settings.pieces = 'cburnett'; saveSettings(); }

/* ---------------- constants ---------------- */
const P_THUMB = 'M7.2 10.6V19H4.4v-8.4zM9 19h7.2c.9 0 1.6-.6 1.8-1.4l1.3-5.3c.3-1.2-.6-2.4-1.9-2.4h-3.6l.6-3.1c.2-1.1-.6-2-1.7-2L9 10.2z';
const P_STAR = 'M12 3.4l2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.4-4.2 6-.9z';
const P_BOOK = 'M4.6 6.4c2.3-1 4.7-.9 6.8.5v11.2c-2.1-1.3-4.5-1.5-6.8-.5zM12.6 6.9c2.1-1.4 4.5-1.5 6.8-.5v11.2c-2.3-1-4.7-.8-6.8.5z';
const CLS = {
  brilliant:  {label: 'Brilliant',  sym: '!!', c: '#1bada6', s: 'brilliant'},
  great:      {label: 'Great',      sym: '!',  c: '#5b8bb0', s: 'great'},
  best:       {label: 'Best',       path: P_STAR,  c: '#96bc4b', s: 'best'},
  excellent:  {label: 'Excellent',  path: P_THUMB, c: '#96bc4b', s: 'excellent'},
  good:       {label: 'Good',       sym: '✓',  c: '#97af8b', s: 'good'},
  book:       {label: 'Book',       path: P_BOOK,  c: '#a88865', s: 'a book move'},
  inaccuracy: {label: 'Inaccuracy', sym: '?!', c: '#f0c15c', s: 'an inaccuracy'},
  mistake:    {label: 'Mistake',    sym: '?',  c: '#e6912c', s: 'a mistake'},
  miss:       {label: 'Miss',       sym: '✕',  c: '#ee6b55', s: 'a miss'},
  blunder:    {label: 'Blunder',    sym: '??', c: '#ca3431', s: 'a blunder'},
  forced:     {label: 'Forced',     sym: '→',  c: '#8f9bb3', s: 'forced'},
};
const ORDER = ['brilliant','great','best','excellent','good','book','inaccuracy','mistake','miss','blunder'];
const BAD = new Set(['inaccuracy','mistake','miss','blunder']);
const KEY = new Set(['brilliant','great','mistake','miss','blunder']);
const BOARDS = {
  ocean: ['Ocean', '#e9eef6', '#7593c0'], classic: ['Classic', '#eeeed2', '#6f8f72'], nebula: ['Lavender', '#e3defa', '#8b7ccc'], emerald: ['Emerald', '#e4ecd9', '#58916f'], walnut: ['Walnut', '#eed9b6', '#a97a55'],
  glacier: ['Glacier', '#e1ebf4', '#6a90b6'], coral: ['Coral', '#fbe4d8', '#d27a6c'], midnight: ['Midnight', '#9295ad', '#454868'],
};
const PIECESETS = {cburnett: 'Classic', merida: 'Merida', chessnut: 'Chessnut', fantasy: 'Fantasy', spatial: 'Spatial', rhosgfx: 'Pixel', neon: 'Neon'};
const VAL = {p: 1, n: 3, b: 3, r: 5, q: 9, k: 0};
const PNAME = {p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king'};
const pieceUrl = (c, t) => `pieces/${settings.pieces === 'neon' ? 'cburnett' : settings.pieces}/${c}${t.toUpperCase()}.svg`;

function clsIcon(cls, size = 22){
  const c = CLS[cls]; if (!c) return '';
  const inner = c.path ? `<path d="${c.path}" fill="#fff"/>`
    : `<text x="12" y="12.6" text-anchor="middle" dominant-baseline="central" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="${c.sym.length > 1 ? 10.5 : 13.5}" fill="#fff">${c.sym}</text>`;
  return `<svg class="ci" width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11.6" fill="${c.c}"/>${inner}</svg>`;
}
function drawClsIcon(ctx, cls, cx, cy, r){
  const c = CLS[cls]; ctx.save();
  ctx.fillStyle = c.c; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  if (c.path) { ctx.translate(cx - r, cy - r); ctx.scale(r / 12, r / 12); ctx.fill(new Path2D(c.path)); }
  else { ctx.font = `900 ${r * (c.sym.length > 1 ? .9 : 1.15)}px Inter, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.sym, cx, cy + r * .06); }
  ctx.restore();
}

/* ---------------- sound (synthesized, no files) ---------------- */
const Sound = {
  ctx: null, buf: null,
  init(){
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC();
      const n = Math.floor(this.ctx.sampleRate * .18), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 5);
      this.buf = b;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  knock(freq, gain, t = 0){
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.4; g.gain.value = gain;
    s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + t);
  },
  tone(freq, dur, gain, t = 0, type = 'sine', to = null){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(freq, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + .05);
  },
  play(kind){
    if (!settings.sound) return;
    try {
      this.init();
      switch (kind) {
        case 'move': this.knock(1700, 2.2); break;
        case 'capture': this.knock(800, 3.2); this.knock(2400, 1.2, .025); break;
        case 'castle': this.knock(1700, 2); this.knock(1400, 2, .1); break;
        case 'check': this.knock(1700, 2); this.tone(988, .16, .08, .02, 'triangle'); break;
        case 'end': [523, 659, 784].forEach((f, k) => this.tone(f, .6, .07, k * .09)); break;
        case 'brilliant': [659, 880, 1175, 1568, 2093].forEach((f, k) => this.tone(f, .45, .07, k * .065)); break;
        case 'great': [784, 1175].forEach((f, k) => this.tone(f, .35, .07, k * .08)); break;
        case 'blunder': this.tone(220, .45, .12, 0, 'triangle', 92); break;
        case 'ok': [784, 988, 1319].forEach((f, k) => this.tone(f, .3, .08, k * .07)); break;
        case 'wrong': this.tone(180, .25, .1, 0, 'square', 150); break;
        case 'rooksac': this.knock(200, 6); this.knock(160, 6, .18); this.tone(147, .9, .12, .05, 'sawtooth', 110); this.tone(220, .9, .08, .05, 'sawtooth', 165); [392, 523, 659].forEach((f, k) => this.tone(f, .5, .06, .45 + k * .08, 'triangle')); break;
      }
    } catch(e) {}
  },
};
function moveSound(m){
  if (!m) return;
  if (m.san.includes('#')) Sound.play('end');
  else if (m.san.includes('+')) Sound.play('check');
  else if (m.flags && (m.flags.includes('k') || m.flags.includes('q'))) Sound.play('castle');
  else if (m.flags && (m.flags.includes('c') || m.flags.includes('e'))) Sound.play('capture');
  else Sound.play('move');
}

/* ---------------- confetti ---------------- */
const Confetti = {
  parts: [], raf: 0,
  burst(x, y, n = 140, colors = ['#2563eb', '#60a5fa', '#1bada6', '#facc15', '#16a34a', '#93c5fd']){
    if (!settings.anim) return;
    const cv = $('#confetti'); cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
      this.parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, r: 3 + Math.random() * 5, c: colors[i % colors.length], rot: Math.random() * 6, vr: Math.random() * .4 - .2, life: 1});
    }
    if (!this.raf) this.tick();
  },
  tick(){
    const cv = $('#confetti'), ctx = cv.getContext('2d'), d = devicePixelRatio;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of this.parts) {
      p.x += p.vx; p.y += p.vy; p.vy += .32; p.vx *= .985; p.rot += p.vr; p.life -= .011;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x * d, p.y * d); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r * d, -p.r * d * .45, p.r * 2 * d, p.r * d * .9); ctx.restore();
    }
    this.parts = this.parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    this.raf = this.parts.length ? requestAnimationFrame(() => this.tick()) : (ctx.clearRect(0, 0, cv.width, cv.height), 0);
  },
};

/* ---------------- arrows (shared by board + share cards) ---------------- */
function arrowGeom(a, b){
  const [x1, y1] = a, [x2, y2] = b, dx = x2 - x1, dy = y2 - y1;
  const pts = [[x1, y1]];
  const knight = (Math.abs(dx) === 1 && Math.abs(dy) === 2) || (Math.abs(dx) === 2 && Math.abs(dy) === 1);
  if (knight) pts.push(Math.abs(dx) > Math.abs(dy) ? [x2, y1] : [x1, y2]);
  pts.push([x2, y2]);
  const [px, py] = pts[pts.length - 2]; let ux = x2 - px, uy = y2 - py; const L = Math.hypot(ux, uy); ux /= L; uy /= L;
  const hl = .42, hw = .27, tip = [x2 - ux * .1, y2 - uy * .1], base = [tip[0] - ux * hl, tip[1] - uy * hl];
  let vx = pts[1][0] - x1, vy = pts[1][1] - y1; const vl = Math.hypot(vx, vy);
  pts[0] = [x1 + vx / vl * .22, y1 + vy / vl * .22];
  pts[pts.length - 1] = base;
  const nx = -uy, ny = ux;
  return {pts, head: [tip, [base[0] + nx * hw, base[1] + ny * hw], [base[0] - nx * hw, base[1] - ny * hw]]};
}
function arrowSVG(a, b, color, op = .85){
  const g = arrowGeom(a, b), f = p => p.map(n => n.toFixed(3));
  return `<g opacity="${op}"><path d="M${g.pts.map(p => f(p).join(' ')).join(' L')}" stroke="${color}" stroke-width=".17" fill="none" stroke-linejoin="round"/><polygon points="${g.head.map(p => f(p).join(',')).join(' ')}" fill="${color}"/></g>`;
}

/* ---------------- board ---------------- */
class Board {
  constructor(el, o = {}){
    this.el = el; this.o = o; this.flipped = !!o.flipped; this.st = null; this.sel = null; this.drag = null;
    el.className = 'bd' + (o.interactive ? ' inter' : '');
    el.innerHTML = '<div class="bd-sq"></div><div class="bd-fx"></div><div class="bd-pcs"></div><svg class="bd-arrows" viewBox="0 0 8 8"></svg><div class="bd-top"></div>';
    [this.sqL, this.fxL, this.pcL, this.arL, this.topL] = el.children;
    this.applySettings();
    if (o.interactive) this.bind();
  }
  applySettings(){
    this.el.dataset.set = settings.pieces;
    this.el.classList.toggle('nocoords', this.o.coords === false || !settings.coords);
    this.el.classList.toggle('noanim', !settings.anim);
    this.drawSquares();
    if (this.st) this.render(this.st);
  }
  xy(sq){ const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1; return this.flipped ? [7 - f, r] : [f, 7 - r]; }
  ctr(sq){ const [x, y] = this.xy(sq); return [x + .5, y + .5]; }
  tf(x, y){ return `translate(${x * 100}%,${y * 100}%)`; }
  drawSquares(){
    let h = '';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const f = this.flipped ? 7 - x : x, r = this.flipped ? y : 7 - y;
      h += `<div class="${(f + r) % 2 ? 'l' : 'd'}">${x === 0 ? `<span class="rk">${r + 1}</span>` : ''}${y === 7 ? `<span class="fl">${'abcdefgh'[f]}</span>` : ''}</div>`;
    }
    this.sqL.innerHTML = h;
  }
  setFlip(f){ if (this.flipped === f) return; this.flipped = f; this.drawSquares(); if (this.st) this.render(this.st); }
  set(st, anim){ this.st = st; this.sel = null; this.render(st, anim); }
  render(st, anim){
    const b = new Chess(st.fen).board(); let h = '';
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const p = b[7 - r][f]; if (!p) continue;
      const sq = 'abcdefgh'[f] + (r + 1), [x, y] = this.xy(sq);
      h += `<div class="pc ${p.color}" data-sq="${sq}" style="transform:${this.tf(x, y)};background-image:url(${pieceUrl(p.color, p.type)})"></div>`;
    }
    this.pcL.innerHTML = h;
    if (anim && settings.anim) for (const a of anim) {
      const e = this.pcL.querySelector(`[data-sq="${a.to}"]`); if (!e) continue;
      const [fx, fy] = this.xy(a.from), [tx, ty] = this.xy(a.to);
      e.style.transition = 'none'; e.style.transform = this.tf(fx, fy); void e.offsetWidth;
      e.style.transition = ''; e.style.transform = this.tf(tx, ty);
    }
    this.renderFx(); this.setArrows(st.arrows || []);
    let t = '';
    if (st.badge) { const [x, y] = this.xy(st.badge.sq); t = `<div class="bdg ${x === 7 ? 'edge-r' : ''} ${y === 0 ? 'edge-t' : ''}" style="left:${x * 12.5}%;top:${y * 12.5}%">${clsIcon(st.badge.cls)}</div>`; }
    this.topL.innerHTML = t;
  }
  setArrows(list){ this.arL.innerHTML = list.map(a => arrowSVG(this.ctr(a.from), this.ctr(a.to), a.color, a.op)).join(''); }
  renderFx(){
    const st = this.st; if (!st) return; let h = '';
    const box = (sq, cls, style = '') => { const [x, y] = this.xy(sq); return `<div class="${cls}" style="left:${x * 12.5}%;top:${y * 12.5}%;${style}"></div>`; };
    if (st.last) { const bg = `background:${st.hl || '#ffd84d'}`; h += box(st.last.from, 'hl', bg) + box(st.last.to, 'hl', bg); }
    if (st.check) h += box(st.check, 'chk');
    if (this.sel) { const ch = new Chess(st.fen); h += box(this.sel, 'sel'); for (const t of this.o.targets(this.sel)) h += box(t, ch.get(t) ? 'cap' : 'dot'); }
    this.fxL.innerHTML = h;
  }
  sqAt(e){
    const r = this.el.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * 8), y = Math.floor((e.clientY - r.top) / r.height * 8);
    if (x < 0 || x > 7 || y < 0 || y > 7) return null;
    return 'abcdefgh'[this.flipped ? 7 - x : x] + ((this.flipped ? y : 7 - y) + 1);
  }
  bind(){
    const el = this.el;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !this.st) return;
      const sq = this.sqAt(e); if (!sq) return;
      if (this.sel && sq !== this.sel && this.o.targets(this.sel).includes(sq)) { const f = this.sel; this.sel = null; this.renderFx(); this.o.onMove(f, sq, false); return; }
      if (!this.o.canPick(sq)) { if (this.sel) { this.sel = null; this.renderFx(); } return; }
      e.preventDefault();
      const wasSel = this.sel === sq; this.sel = sq; this.renderFx();
      const pe = this.pcL.querySelector(`[data-sq="${sq}"]`);
      this.drag = {from: sq, pe, sx: e.clientX, sy: e.clientY, moved: false, r: el.getBoundingClientRect(), wasSel};
      try { el.setPointerCapture(e.pointerId); } catch(_) {}
    });
    el.addEventListener('pointermove', e => {
      const d = this.drag; if (!d || !d.pe) return;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
      d.moved = true; const s = d.r.width / 8;
      d.pe.classList.add('dragging');
      d.pe.style.transform = `translate(${e.clientX - d.r.left - s / 2}px,${e.clientY - d.r.top - s / 2}px)`;
    });
    const end = (e, cancel) => {
      const d = this.drag; if (!d) return; this.drag = null;
      if (!d.moved) { if (d.wasSel) { this.sel = null; this.renderFx(); } return; }
      d.pe.classList.remove('dragging');
      const to = cancel ? null : this.sqAt(e);
      if (to && to !== d.from && this.o.targets(d.from).includes(to)) {
        const [x, y] = this.xy(to); d.pe.style.transition = 'none'; d.pe.style.transform = this.tf(x, y);
        this.sel = null; this.o.onMove(d.from, to, true);
      } else { const [x, y] = this.xy(d.from); d.pe.style.transform = this.tf(x, y); }
    };
    el.addEventListener('pointerup', e => end(e, false));
    el.addEventListener('pointercancel', e => end(e, true));
  }
}
function moveAnim(m, reverse){
  if (!m) return null;
  const a = [{from: m.from, to: m.to}];
  if (m.flags && (m.flags.includes('k') || m.flags.includes('q'))) {
    const r = m.color === 'w' ? '1' : '8', k = m.flags.includes('k');
    a.push({from: (k ? 'h' : 'a') + r, to: (k ? 'f' : 'd') + r});
  }
  return reverse ? a.map(x => ({from: x.to, to: x.from})) : a;
}
function kingInCheck(fen){
  const ch = new Chess(fen); if (!ch.in_check()) return null;
  const t = ch.turn(), b = ch.board();
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { const p = b[r][f]; if (p && p.type === 'k' && p.color === t) return 'abcdefgh'[f] + (8 - r); }
  return null;
}

/* ---------------- engine ---------------- */
class Engine {
  constructor(o = {}){
    this.mpv = o.multipv || 2;
    this.ls = new Set(); this.q = Promise.resolve();
    this.w = new Worker('engine/stockfish.js');
    this.w.onmessage = e => { const l = String(e.data); for (const f of [...this.ls]) f(l); };
    this.w.onerror = () => toast('The chess engine failed to load. Please refresh the page.');
    this.ready = this.init();
  }
  send(c){ this.w.postMessage(c); }
  waitFor(pred){ return new Promise(res => { const f = l => { if (pred(l)) { this.ls.delete(f); res(l); } }; this.ls.add(f); }); }
  async init(){
    const a = this.waitFor(l => l === 'uciok'); this.send('uci'); await a;
    this.send('setoption name Hash value 32'); this.send('setoption name MultiPV value ' + this.mpv);
    const b = this.waitFor(l => l === 'readyok'); this.send('isready'); await b;
  }
  static parse(l){
    if (!l.startsWith('info') || !l.includes(' pv ') || l.includes('bound')) return null;
    const sm = l.match(/ score (cp|mate) (-?\d+)/); if (!sm) return null;
    return {mp: +((l.match(/ multipv (\d+)/) || [0, 1])[1]), depth: +((l.match(/ depth (\d+)/) || [0, 0])[1]),
      type: sm[1], v: +sm[2], pv: l.split(' pv ')[1].trim().split(/\s+/).slice(0, 12)};
  }
  analyse(fen, depth){ return this.run(fen, 'go depth ' + depth); }
  run(fen, goCmd, pre = []){
    const job = () => new Promise(res => {
      const lines = {};
      const f = l => {
        const p = Engine.parse(l);
        if (p) lines[p.mp] = {type: p.type, v: p.v, pv: p.pv};
        else if (l.startsWith('bestmove')) { this.ls.delete(f); const bm = l.split(/\s+/)[1]; res({best: bm && bm !== '(none)' ? bm : null, lines}); }
      };
      this.ls.add(f); for (const c of pre) this.send(c); this.send('position fen ' + fen); this.send(goCmd);
    });
    const p = this.q.then(() => this.ready).then(job); this.q = p.catch(() => {}); return p;
  }
  stop(){ this.send('stop'); }
}
class LiveEngine {
  constructor(){ this.e = null; this.tok = 0; this.running = false; this.pend = false; }
  start(fen, cb){
    if (!this.e) this.e = new Engine();
    this.fen = fen; this.cb = cb; this.tok++;
    if (this.running) { this.pend = true; this.e.stop(); return; }
    this.go();
  }
  go(){
    this.running = true; this.pend = false;
    const tok = this.tok, cb = this.cb, fen = this.fen, lines = {}; let depth = 0;
    const f = l => {
      const p = Engine.parse(l);
      if (p) { lines[p.mp] = p; depth = p.depth; if (tok === this.tok && p.mp === 1) cb({depth, lines, fen}); }
      else if (l.startsWith('bestmove')) {
        this.e.ls.delete(f); this.running = false;
        if (this.pend) this.go(); else if (tok === this.tok) cb({depth, lines, fen, done: true});
      }
    };
    this.e.ready.then(() => { this.e.ls.add(f); this.e.send('position fen ' + fen); this.e.send('go depth 20'); });
  }
  stop(){ this.tok++; if (this.running && this.e) this.e.stop(); }
}
let engine = null;
const getEngine = () => engine || (engine = new Engine());
const live = new LiveEngine();

/* ---------------- eval math ---------------- */
const winp = cp => { cp = clamp(cp, -1500, 1500); return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1); };
const scoreWin = s => s.type === 'mate' ? (s.v > 0 ? 100 : 0) : winp(s.v);   // side to move
const moveAcc = loss => clamp(103.1668 * Math.exp(-0.04354 * loss) - 3.1669, 0, 100);
function fmtScore(s, turn){
  if (!s) return '';
  const sg = turn === 'w' ? 1 : -1;
  if (s.type === 'mate') { if (s.v === 0) return turn === 'w' ? '0-1' : '1-0'; const m = s.v * sg; return (m > 0 ? 'M' : '-M') + Math.abs(m); }
  const c = s.v * sg / 100; return (c > 0 ? '+' : '') + c.toFixed(2);
}
function matBal(ch, color){ let s = 0; for (const row of ch.board()) for (const p of row) if (p) s += (p.color === color ? 1 : -1) * VAL[p.type]; return s; }
const uciOf = m => m.from + m.to + (m.promotion || '');
const mvObj = u => ({from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4]});
function pvToSan(fen, pv, n){ const c = new Chess(fen), out = []; for (const u of (pv || []).slice(0, n)) { const r = c.move(mvObj(u)); if (!r) break; out.push(r.san); } return out; }
function nonPawnMat(fen){ let s = 0; for (const row of new Chess(fen).board()) for (const p of row) if (p && p.type !== 'p' && p.type !== 'k') s += VAL[p.type]; return s; }
function swing(fen, pv, n, color){
  const c = new Chess(fen), m0 = matBal(c, color); let first = null;
  for (let k = 0; k < Math.min(n, (pv || []).length); k++) { const r = c.move(mvObj(pv[k])); if (!r) break; if (k === 0) first = r; }
  return {d: matBal(c, color) - m0, first};
}

/* ---------------- game model ---------------- */
function hashStr(s){ let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function openingName(url){
  if (!url) return '';
  const words = decodeURIComponent(url.split('/').pop()).split('-'), out = [];
  for (const w of words) { const cut = w.search(/\.\.\.|\d+\./); if (cut === 0) break; if (cut > 0) { out.push(w.slice(0, cut)); break; } out.push(w); }
  return out.join(' ').trim();
}
function buildGame(pgn, meta = {}){
  let clean = pgn.replace(/\{[^}]*\}/g, ' ').replace(/\$\d+/g, ' ').replace(/;[^\n]*/g, ' ').replace(/\r/g, '');
  while (/\([^()]*\)/.test(clean)) clean = clean.replace(/\([^()]*\)/g, ' ');
  const ch = new Chess();
  if (!ch.load_pgn(clean, {sloppy: true})) throw new Error("Couldn't read that PGN.");
  const h = ch.header(), hist = ch.history({verbose: true});
  if (!hist.length) throw new Error('That game has no moves.');
  const b = new Chess(h.SetUp === '1' && h.FEN ? h.FEN : undefined);
  const positions = [{fen: b.fen(), turn: b.turn()}], moves = [];
  for (const m of hist) {
    const nLegal = b.moves().length;
    const r = b.move({from: m.from, to: m.to, promotion: m.promotion});
    moves.push({san: r.san, from: r.from, to: r.to, promotion: r.promotion, color: r.color, flags: r.flags, captured: r.captured, piece: r.piece, uci: uciOf(r), forced: nLegal === 1});
    positions.push({fen: b.fen(), turn: b.turn()});
  }
  const clocks = [...pgn.matchAll(/\[%clk\s+([\d:.]+)\]/g)].map(x => x[1].replace(/\.\d+$/, '').replace(/^0:/, ''));
  const M = {
    white: meta.white || h.White || 'White', black: meta.black || h.Black || 'Black',
    wElo: meta.wElo || h.WhiteElo || '', bElo: meta.bElo || h.BlackElo || '',
    result: h.Result || '*', date: (h.Date || '').replace(/\./g, '-').replace(/\?+/g, ''),
    opening: openingName(h.ECOUrl) || h.Opening || '', termination: h.Termination || '',
    userColor: meta.userColor || null, url: meta.url || h.Link || '', timeClass: meta.timeClass || '',
    wAv: meta.wAv || '', bAv: meta.bAv || '', fromApi: !!meta.fromApi,
  };
  const id = M.url ? 'u' + hashStr(M.url) : 'p' + hashStr(positions[0].fen + moves.map(m => m.uci).join(''));
  return {id, meta: M, pgn, positions, moves, clocks, done: false, depth: 0};
}

/* ---- classification ---- */
function isSacrifice(G, i){
  const mv = G.moves[i], ch = new Chess(G.positions[i].fen), m0 = matBal(ch, mv.color);
  ch.move({from: mv.from, to: mv.to, promotion: mv.promotion});
  const pv = ((G.positions[i + 1].lines || {})[1] || {}).pv || [];
  if (pv.length < 2) return false;
  const checks = [];
  for (let k = 0; k < Math.min(pv.length, 4); k++) { if (!ch.move(mvObj(pv[k]))) break; if (k === 1 || k === 3) checks.push(matBal(ch, mv.color)); }
  return checks.length > 0 && checks.every(b => b <= m0 - 2);
}
function isRecapture(G, i){
  if (i === 0) return false;
  const p = G.moves[i - 1], m = G.moves[i];
  return !!p.captured && p.to === m.to && !!m.captured;
}
function classify(G, i){
  const mv = G.moves[i], before = G.positions[i], after = G.positions[i + 1];
  const mw = p => mv.color === 'w' ? p.wW : 100 - p.wW;
  const wB = mw(before), wA = mw(after), loss = Math.max(0, wB - wA);
  const L = before.lines || {}, l1 = L[1], l2 = L[2];
  const isBest = !!before.best && mv.uci === before.best;
  const prev = i > 0 ? G.moves[i - 1].cls : null;
  let cls;
  if (mv.forced) cls = 'forced';
  else if ((isBest || loss < 1.5) && wA >= 50 && (wB < 97 || (l1 && l1.type === 'mate' && l1.v > 0)) && isSacrifice(G, i)) cls = 'brilliant';
  else if (isBest && l1 && l2 && scoreWin(l1) - scoreWin(l2) >= 20 && wB < 92 && wA > 35 && !isRecapture(G, i)) cls = 'great';
  else if (i < 10 && loss <= 8 && wA >= 30 && wA <= 70) cls = 'book';
  else if (isBest || loss < 0.6) cls = 'best';
  else if (loss <= 3) cls = 'excellent';
  else if (loss <= 7) cls = 'good';
  else if (prev && (prev === 'mistake' || prev === 'blunder' || prev === 'miss') && loss < 30 && wB >= 60) cls = 'miss';
  else if (loss <= 12) cls = 'inaccuracy';
  else if (loss <= 22) cls = 'mistake';
  else cls = 'blunder';
  Object.assign(mv, {cls, loss, acc: moveAcc(loss), wB, wA});
  mv.bestSan = before.best ? pvToSan(before.fen, [before.best], 1)[0] : null;
  mv.bestLine = l1 ? pvToSan(before.fen, l1.pv, 8) : [];
  mv.bestEval = l1 ? fmtScore(l1, before.turn) : '';
  mv.note = tacticNote(G, i);
  const np = nonPawnMat(before.fen);
  mv.phase = np <= 26 ? 'end' : i < 16 ? 'open' : 'mid';
  mv.rookSac = !BAD.has(cls) && cls !== 'forced' && isRookSac(G, i);
  if (mv.rookSac && mv.cls !== 'brilliant') mv.note = (mv.note ? mv.note + ' ' : '') + 'A rook sacrifice!';
}
function tacticNote(G, i){
  const m = G.moves[i], before = G.positions[i], after = G.positions[i + 1], notes = [];
  if (after.score && after.score.type === 'mate' && after.score.v === 0) return 'Checkmate!';
  const bestStr = m.bestSan ? `<b>${esc(m.bestSan)}</b>` : '';
  if (BAD.has(m.cls)) {
    const a1 = (after.lines || {})[1];
    if (after.score && after.score.type === 'mate' && after.score.v > 0) notes.push(`It allows mate in ${after.score.v}.`);
    else if (a1) { const s = swing(after.fen, a1.pv, 2, m.color); if (s.d <= -2 && s.first && s.first.captured) notes.push(`It hangs your ${PNAME[s.first.captured]}.`); }
  }
  if ((BAD.has(m.cls) || m.cls === 'good') && before.lines && before.lines[1] && m.bestSan && m.bestSan !== m.san) {
    const l1 = before.lines[1];
    if (l1.type === 'mate' && l1.v > 0) notes.push(`${bestStr} would have forced mate in ${l1.v}.`);
    else { const s = swing(before.fen, l1.pv, 2, m.color); if (s.d >= 2 && s.first && s.first.captured) notes.push(`${bestStr} would have won a ${PNAME[s.first.captured]}.`); }
  }
  return notes.join(' ');
}
function accuracy(G, color){
  const ms = G.moves.filter(m => m.color === color && m.acc != null && m.cls !== 'forced');
  if (!ms.length) return null;
  const mean = ms.reduce((a, m) => a + m.acc, 0) / ms.length;
  const harm = ms.length / ms.reduce((a, m) => a + 1 / Math.max(m.acc, 5), 0);
  return (mean + harm) / 2;
}
function phaseAcc(G, color, ph){
  const ms = G.moves.filter(m => m.color === color && m.phase === ph && m.acc != null && m.cls !== 'forced');
  return ms.length ? ms.reduce((a, m) => a + m.acc, 0) / ms.length : null;
}
const RT = [[0, 200], [40, 400], [50, 600], [60, 900], [70, 1250], [75, 1500], [80, 1750], [85, 2000], [90, 2300], [94, 2600], [97, 2900], [100, 3200]];
function estRating(acc, elo){
  if (acc == null) return null;
  let r = 0;
  for (let k = 1; k < RT.length; k++) if (acc <= RT[k][0]) { const [a0, r0] = RT[k - 1], [a1, r1] = RT[k]; r = r0 + (acc - a0) / (a1 - a0) * (r1 - r0); break; }
  if (+elo) r = r * .65 + +elo * .35;
  return Math.round(r / 25) * 25;
}
function countOf(G, c, k){ return G.moves.filter(m => m.color === c && m.cls === k).length; }
function achievements(G, c){
  const M = G.meta, out = [], my = G.moves.filter(m => m.color === c), opp = c === 'w' ? 'b' : 'w';
  const res = M.result === '1-0' ? (c === 'w' ? 'W' : 'L') : M.result === '0-1' ? (c === 'b' ? 'W' : 'L') : M.result === '1/2-1/2' ? 'D' : '?';
  const acc = accuracy(G, c), cnt = k => countOf(G, c, k);
  const wins = G.positions.map(p => p.wW == null ? 50 : (c === 'w' ? p.wW : 100 - p.wW));
  const minW = Math.min(...wins);
  const myElo = +(c === 'w' ? M.wElo : M.bElo), opElo = +(c === 'w' ? M.bElo : M.wElo);
  const last = G.positions[G.positions.length - 1];
  if (cnt('brilliant')) out.push(['💎', 'Brilliancy', `${cnt('brilliant')} brilliant move${cnt('brilliant') > 1 ? 's' : ''}`]);
  if (acc != null && acc >= 90 && my.length >= 10) out.push(['🎯', 'Sharpshooter', `${acc.toFixed(1)}% accuracy`]);
  if (my.length >= 10 && !cnt('blunder') && !cnt('mistake')) out.push(['🧼', 'Clean Sheet', 'No mistakes or blunders']);
  if (res === 'W' && minW <= 25) out.push(['🔥', 'Comeback Kid', `Won from ${minW.toFixed(0)}% winning chances`]);
  if (res === 'D' && minW <= 20) out.push(['🛡', 'Great Escape', `Saved a draw from ${minW.toFixed(0)}%`]);
  if (res === 'W' && myElo && opElo - myElo >= 100) out.push(['🗡', 'Giant Slayer', `Beat a player rated +${opElo - myElo}`]);
  if (res === 'W' && last.score && last.score.type === 'mate' && last.score.v === 0) out.push(['👑', 'Checkmate Artist', 'Finished with checkmate']);
  if (my.length >= 10 && my.filter(m => m.cls === 'best' || m.cls === 'brilliant' || m.cls === 'great').length / my.length >= .6) out.push(['🤖', 'Engine Twin', 'Played the top move 60%+ of the time']);
  if (cnt('great') >= 2) out.push(['⚡', 'Only-Move Hero', `${cnt('great')} great moves under pressure`]);
  if (countOf(G, opp, 'blunder') + countOf(G, opp, 'mistake') >= 1 && !cnt('miss') && res === 'W') out.push(['🦈', 'Punisher', 'Never let an opponent mistake slide']);
  if (res === 'W' && G.moves.length <= 50) out.push(['🚀', 'Blitzkrieg', `Won in ${Math.ceil(G.moves.length / 2)} moves`]);
  return out;
}

/* ---- analysis + cache ---- */
const cacheKey = (G, d) => `gl2_an_${G.id}_${d}`;
function cacheSave(key, val){
  let idx = store.get('gl2_idx', []).filter(k => k !== key); idx.push(key);
  while (idx.length > 80) store.del(idx.shift());
  while (!store.set(key, val) && idx.length > 1) store.del(idx.shift());
  store.set('gl2_idx', idx);
}
function resetAnalysis(G){ for (const p of G.positions) { delete p.score; delete p.lines; delete p.best; delete p.wW; } for (const m of G.moves) delete m.cls; G.done = false; }
async function analyzeGame(G, depth, onStep, cancelled){
  const key = cacheKey(G, depth), cache = store.get(key, null), N = G.positions.length;
  for (let i = 0; i < N; i++) {
    if (cancelled()) return false;
    const pos = G.positions[i], ch = new Chess(pos.fen);
    if (ch.in_checkmate()) { pos.score = {type: 'mate', v: 0}; pos.lines = {}; pos.best = null; }
    else if (ch.game_over()) { pos.score = {type: 'cp', v: 0}; pos.lines = {}; pos.best = null; }
    else if (cache && cache[i]) { pos.score = cache[i].s; pos.best = cache[i].b; pos.lines = cache[i].l || {}; }
    else {
      const r = await getEngine().analyse(pos.fen, depth);
      if (cancelled()) return false;
      pos.lines = r.lines; pos.best = r.best;
      const l1 = r.lines[1]; pos.score = l1 ? {type: l1.type, v: l1.v} : {type: 'cp', v: 0};
    }
    pos.wW = pos.turn === 'w' ? scoreWin(pos.score) : 100 - scoreWin(pos.score);
    if (i > 0) classify(G, i - 1);
    onStep && onStep(i, N);
  }
  G.done = true; G.depth = depth;
  if (!cache) cacheSave(key, G.positions.map(p => ({s: p.score, b: p.best, l: Object.fromEntries(Object.entries(p.lines || {}).map(([k, l]) => [k, {type: l.type, v: l.v, pv: l.pv.slice(0, 8)}]))})));
  store.set('gl2_sum_' + G.id, {w: accuracy(G, 'w'), b: accuracy(G, 'b'), d: depth});
  return true;
}

/* ============================================================
   Chess.com + player view
   ============================================================ */
const S = {user: null, prof: null, stats: null, archives: [], arch: {}, monthIdx: 0, games: [], tc: 'all', res: 'all', q: '', period: 1, huntGen: 0, hunting: false, avatars: {}};
async function api(url){ const r = await fetch(url); if (!r.ok) throw new Error(r.status === 404 ? 'not found' : 'HTTP ' + r.status); return r.json(); }
const DRAWS = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient']);
const TCI = {bullet: '', blitz: '', rapid: '', daily: ''};
const meOf = g => g.white.username.toLowerCase() === S.user ? 'w' : 'b';
function resOf(g){ const me = meOf(g) === 'w' ? g.white : g.black; return me.result === 'win' ? 'W' : DRAWS.has(me.result) ? 'D' : 'L'; }
const HOW = {checkmated: 'checkmate', resigned: 'resignation', timeout: 'time', abandoned: 'abandonment', agreed: 'agreement', repetition: 'repetition', stalemate: 'stalemate', insufficient: 'insufficient material', '50move': '50-move rule', timevsinsufficient: 'timeout vs insufficient material'};
function howEnded(g){ const r = resOf(g), me = meOf(g) === 'w' ? g.white : g.black, op = meOf(g) === 'w' ? g.black : g.white; return HOW[r === 'W' ? op.result : me.result] || ''; }
async function fetchArchive(url){ if (!S.arch[url]) S.arch[url] = (await api(url)).games || []; return S.arch[url]; }
function metaFromGame(g){
  return {white: g.white.username, black: g.black.username, wElo: g.white.rating, bElo: g.black.rating, userColor: S.user ? meOf(g) : null, url: g.url, timeClass: g.time_class, fromApi: true};
}

async function loadUser(name){
  name = (name || '').trim().replace(/^@/, '').toLowerCase();
  if (!name) return;
  if (!/^[a-z0-9_-]{2,30}$/.test(name)) { $('#home-err').textContent = 'That does not look like a Chess.com username.'; return; }
  $('#home-err').innerHTML = '<span class="muted">Looking up ' + esc(name) + '…</span>';
  try {
    const base = `https://api.chess.com/pub/player/${encodeURIComponent(name)}`;
    const [prof, arch] = await Promise.all([api(base), api(base + '/games/archives')]);
    let stats = {}; try { stats = await api(base + '/stats'); } catch(e) {}
    Object.assign(S, {user: name, prof, stats, archives: (arch.archives || []).slice().reverse(), arch: {}, monthIdx: 0, tc: 'all', res: 'all', q: ''});
    S.avatars[name] = prof.avatar || '';
    const rec = store.get('gl2_recent', []).filter(x => x.u !== name); rec.unshift({u: name, n: prof.username, a: prof.avatar || ''}); store.set('gl2_recent', rec.slice(0, 6));
    if (location.hash !== '#u=' + name) history.replaceState(null, '', '#u=' + encodeURIComponent(name));
    $('#home-err').textContent = ''; $('#q-opp').value = '';
    renderProfile(); renderRecent();
    $('#nav').classList.remove('hidden');
    $('#month').innerHTML = S.archives.map((u, i) => { const [y, m] = u.split('/').slice(-2); return `<option value="${i}">${new Date(+y, +m - 1).toLocaleString(undefined, {month: 'long', year: 'numeric'})}</option>`; }).join('');
    showPlayer('games');
    if (!S.archives.length) { $('#glist').innerHTML = '<div class="card">This player has no games yet.</div>'; return; }
    await loadMonth(0);
  } catch(e) {
    $('#home-err').textContent = e.message === 'not found' ? `No Chess.com player named “${name}”. Check the spelling?` : `Couldn't reach Chess.com (${e.message}). Try again in a moment.`;
  }
}
function flag(url){ const cc = (url || '').split('/').pop(); if (!/^[A-Z]{2}$/.test(cc)) return ''; return String.fromCodePoint(...[...cc].map(c => 127397 + c.charCodeAt(0))); }
function renderProfile(){
  const p = S.prof, st = S.stats || {};
  const tile = (k, l) => st[k] && st[k].last ? `<div class="rat"><small>${TCI[l.toLowerCase()] || ''} ${l}</small><b>${st[k].last.rating}</b>${st[k].best ? `<div class="dim" style="font-size:11px">best ${st[k].best.rating}</div>` : ''}</div>` : '';
  const joined = p.joined ? new Date(p.joined * 1000).getFullYear() : '';
  $('#prof').innerHTML = `${p.avatar ? `<img class="av" src="${esc(p.avatar)}" alt="">` : `<div class="av">${esc((p.username || '?')[0].toUpperCase())}</div>`}
    <div style="flex:1;min-width:220px;position:relative;z-index:1">
      <h2>${p.title ? `<span class="ttl">${esc(p.title)}</span>` : ''}${esc(p.username)} <span style="font-size:22px">${flag(p.country)}</span></h2>
      <div class="muted" style="font-size:13px;margin-top:4px">${p.name ? esc(p.name) + ' · ' : ''}${joined ? 'Member since ' + joined : ''}${p.followers ? ' · ' + p.followers.toLocaleString() + ' followers' : ''}</div>
      <div class="rats">${tile('chess_bullet', 'Bullet')}${tile('chess_blitz', 'Blitz')}${tile('chess_rapid', 'Rapid')}${tile('chess_daily', 'Daily')}${st.tactics && st.tactics.highest ? `<div class="rat"><small>Puzzles</small><b>${st.tactics.highest.rating}</b></div>` : ''}</div>
    </div>
    <div class="row"><span id="link-slot"></span><button class="btn sm" id="b-chg">Change player</button></div>`;
  renderLinkSlot();
  $('#b-chg').onclick = () => { show('home'); $('#i-user').focus(); $('#i-user').select(); };
}
async function loadMonth(i){
  S.monthIdx = i; $('#month').value = i;
  $('#glist').innerHTML = '<div class="card"><div class="skel" style="width:60%"></div><div class="skel" style="width:40%;margin-top:10px"></div></div>'.repeat(4);
  try { S.games = (await fetchArchive(S.archives[i])).slice().sort((a, b) => b.end_time - a.end_time); renderGames(); }
  catch(e) { $('#glist').innerHTML = `<div class="card">Couldn't load games: ${esc(e.message)}</div>`; }
}
function filteredGames(){
  return S.games.filter(g => (S.tc === 'all' || g.time_class === S.tc) && (S.res === 'all' || resOf(g) === S.res) &&
    (!S.q || (meOf(g) === 'w' ? g.black : g.white).username.toLowerCase().includes(S.q)));
}
function renderGames(){
  const chip = (k, v, l, cur) => `<button class="chip ${cur === v ? 'on' : ''}" data-${k}="${v}">${l}</button>`;
  $('#tc-chips').innerHTML = [['all', 'All'], ['bullet', 'Bullet'], ['blitz', 'Blitz'], ['rapid', 'Rapid'], ['daily', 'Daily']].map(([v, l]) => chip('tc', v, l, S.tc)).join('');
  $('#res-chips').innerHTML = [['all', 'Any result'], ['W', 'Wins'], ['L', 'Losses'], ['D', 'Draws']].map(([v, l]) => chip('res', v, l, S.res)).join('');
  const list = filteredGames();
  if (!list.length) { $('#glist').innerHTML = '<div class="card muted">No games match these filters.</div>'; return; }
  $('#glist').innerHTML = list.map(g => {
    const c = meOf(g), me = c === 'w' ? g.white : g.black, op = c === 'w' ? g.black : g.white, r = resOf(g);
    const variant = g.rules !== 'chess';
    const date = new Date(g.end_time * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
    const how = howEnded(g), op1 = openingName(g.eco);
    const sum = store.get('gl2_sum_u' + hashStr(g.url), null);
    const acc = sum ? {me: sum[c], op: sum[c === 'w' ? 'b' : 'w']} : g.accuracies ? {me: g.accuracies[c === 'w' ? 'white' : 'black'], op: g.accuracies[c === 'w' ? 'black' : 'white']} : null;
    return `<div class="gc" data-url="${esc(g.url)}" ${variant ? 'style="opacity:.5"' : ''}>
      <div class="res ${r}">${r}</div>
      <div style="min-width:0"><div class="who"><span class="cdot ${c}"></span>vs ${esc(op.username)} <span class="muted" style="font-weight:500">(${op.rating})</span>${sum ? '<span class="pill" style="padding:2px 8px;color:#96bc4b">✓ Reviewed</span>' : ''}</div>
        <div class="sub"><span class="tcic">${TCI[g.time_class] || ''}</span> ${esc(g.time_class)} · ${date}${how ? ' · by ' + esc(how) : ''}${variant ? ' · ' + esc(g.rules) + ' (not supported)' : ''}${op1 ? ' · ' + esc(op1) : ''}</div></div>
      <div class="accs">${acc && acc.me != null ? `<span class="pill" title="Your accuracy">You <b style="color:var(--text)">${(+acc.me).toFixed(1)}</b></span><span class="pill" title="Opponent accuracy">Opp ${(+acc.op).toFixed(1)}</span>` : ''}</div>
      <button class="btn sm ${variant ? '' : 'pri'}" ${variant ? 'disabled' : ''}>${sum ? 'Open' : 'Review'}</button></div>`;
  }).join('');
}
function openApiGame(g, ply){
  if (g.rules !== 'chess') return;
  let G; try { G = buildGame(g.pgn, metaFromGame(g)); } catch(e) { toast(e.message); return; }
  openReview(G, {ply});
}

/* ---------------- insights ---------------- */
async function renderInsights(){
  $('#per-chips').innerHTML = [[1, 'This month'], [3, '3 months'], [6, '6 months']].map(([v, l]) => `<button class="chip ${S.period === v ? 'on' : ''}" data-per="${v}">${l}</button>`).join('');
  const urls = S.archives.slice(0, S.period);
  $('#ins').innerHTML = '<div class="card w12"><div class="row"><div class="spin"></div>Crunching your games…</div></div>';
  let games = [];
  try { for (const u of urls) games = games.concat(await fetchArchive(u)); } catch(e) { $('#ins').innerHTML = `<div class="card w12">Couldn't load games: ${esc(e.message)}</div>`; return; }
  games = games.filter(g => g.rules === 'chess').sort((a, b) => a.end_time - b.end_time);
  $('#ins-note').textContent = `${games.length} games`;
  if (!games.length) { $('#ins').innerHTML = '<div class="card w12 muted">No standard chess games in this period.</div>'; return; }
  const tally = list => { const t = {W: 0, D: 0, L: 0}; for (const g of list) t[resOf(g)]++; t.n = list.length; t.score = t.n ? (t.W + t.D / 2) / t.n * 100 : 0; return t; };
  const bar = t => `<div class="bar"><i style="width:${t.W / t.n * 100}%;background:var(--win)"></i><i style="width:${t.D / t.n * 100}%;background:#94a3b8"></i><i style="width:${t.L / t.n * 100}%;background:var(--loss)"></i></div>`;
  const all = tally(games), asW = tally(games.filter(g => meOf(g) === 'w')), asB = tally(games.filter(g => meOf(g) === 'b'));
  const tcs = ['bullet', 'blitz', 'rapid', 'daily'].map(tc => [tc, tally(games.filter(g => g.time_class === tc))]).filter(([, t]) => t.n);
  // openings
  const ops = c => { const m = {}; for (const g of games.filter(x => meOf(x) === c)) { const o = openingName(g.eco) || 'Unknown'; (m[o] = m[o] || []).push(g); } return Object.entries(m).map(([o, l]) => [o, tally(l)]).sort((a, b) => b[1].n - a[1].n).slice(0, 6); };
  const opRows = c => ops(c).map(([o, t]) => `<div class="op"><span class="nm" title="${esc(o)}">${esc(o)}</span>${bar(t)}<b style="text-align:right;color:${t.score >= 55 ? 'var(--win)' : t.score <= 45 ? 'var(--loss)' : 'var(--text)'}">${t.score.toFixed(0)}%</b></div><div class="dim" style="font-size:11.5px;margin:-4px 0 4px">${t.n} games · ${t.W}W ${t.D}D ${t.L}L</div>`).join('') || '<span class="dim">No games</span>';
  // facts
  const wins = games.filter(g => resOf(g) === 'W');
  const opp = g => meOf(g) === 'w' ? g.black : g.white;
  const bestWin = wins.slice().sort((a, b) => opp(b).rating - opp(a).rating)[0];
  const byOpp = {}; for (const g of games) { const o = opp(g).username; byOpp[o] = byOpp[o] || {n: 0, L: 0, W: 0}; byOpp[o].n++; byOpp[o][resOf(g)] = (byOpp[o][resOf(g)] || 0) + 1; }
  const nemesis = Object.entries(byOpp).filter(([, v]) => v.L >= 2).sort((a, b) => b[1].L - a[1].L)[0];
  const fav = Object.entries(byOpp).sort((a, b) => b[1].n - a[1].n)[0];
  let streak = 0, cur = 0; for (const g of games) { cur = resOf(g) === 'W' ? cur + 1 : 0; streak = Math.max(streak, cur); }
  const how = r => { const m = {}; const l = games.filter(g => resOf(g) === r); for (const g of l) { const h = howEnded(g) || 'other'; m[h] = (m[h] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([h, n]) => `<span class="pill">${esc(h)} <b style="color:var(--text)">${Math.round(n / l.length * 100)}%</b></span>`).join(' ') || '<span class="dim">—</span>'; };
  const fact = (e, t, s) => `<div class="fact"><div class="e">${icon(e)}</div><div><b>${t}</b><small>${s}</small></div></div>`;
  $('#ins').innerHTML = `
    <div class="card"><h4>Record</h4><div class="big">${all.W}<span style="color:var(--win)">W</span> ${all.D}<span class="dim">D</span> ${all.L}<span style="color:var(--loss)">L</span></div>
      <div class="muted" style="margin:4px 0 12px">${all.n} games · ${all.score.toFixed(0)}% score</div>${bar(all)}</div>
    <div class="card"><h4>By color</h4>
      <div class="row" style="justify-content:space-between"><span><span class="cdot w"></span> White · ${asW.n}</span><b>${asW.score.toFixed(0)}%</b></div>${asW.n ? bar(asW) : ''}
      <div class="row" style="justify-content:space-between;margin-top:16px"><span><span class="cdot b"></span> Black · ${asB.n}</span><b>${asB.score.toFixed(0)}%</b></div>${asB.n ? bar(asB) : ''}</div>
    <div class="card"><h4>By time control</h4>${tcs.map(([tc, t]) => `<div class="row" style="justify-content:space-between;margin-top:8px"><span>${TCI[tc]} ${tc} · ${t.n}</span><b>${t.score.toFixed(0)}%</b></div>${bar(t)}`).join('')}</div>
    <div class="card w8"><h4>Rating trend</h4><canvas class="chart" id="rchart" height="220"></canvas><div class="row" id="rlegend" style="margin-top:8px"></div></div>
    <div class="card"><h4>Fun facts</h4>
      ${bestWin ? fact('trophy', 'Best win', `${esc(opp(bestWin).username)} (${opp(bestWin).rating})`) : ''}
      ${fact('zap', 'Longest win streak', `${streak} game${streak === 1 ? '' : 's'}`)}
      ${nemesis ? fact('swords', 'Nemesis', `${esc(nemesis[0])} beat you ${nemesis[1].L}×`) : ''}
      ${fav ? fact('user', 'Most played', `${esc(fav[0])} · ${fav[1].n} games`) : ''}
      ${fact('target', 'Checkmates delivered', String(wins.filter(g => howEnded(g) === 'checkmate').length))}</div>
    <div class="card w6"><h4><span class="cdot w"></span> Top openings as White</h4>${opRows('w')}</div>
    <div class="card w6"><h4><span class="cdot b"></span> Top openings as Black</h4>${opRows('b')}</div>
    <div class="card w6"><h4>How you win</h4><div class="row">${how('W')}</div></div>
    <div class="card w6"><h4>How you lose</h4><div class="row">${how('L')}</div></div>`;
  drawRatingChart(games);
}
function drawRatingChart(games){
  const cv = $('#rchart'); if (!cv) return;
  const dpr = devicePixelRatio || 1, w = cv.clientWidth, h = 220; cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  const COLORS = {bullet: '#db2777', blitz: '#f59e0b', rapid: '#16a34a', daily: '#2563eb'};
  const series = {}; for (const g of games) { const me = meOf(g) === 'w' ? g.white : g.black; (series[g.time_class] = series[g.time_class] || []).push([g.end_time, me.rating]); }
  const pts = Object.values(series).flat(); if (!pts.length) return;
  const t0 = Math.min(...pts.map(p => p[0])), t1 = Math.max(...pts.map(p => p[0])) || t0 + 1;
  let r0 = Math.min(...pts.map(p => p[1])), r1 = Math.max(...pts.map(p => p[1])); const pad = Math.max(20, (r1 - r0) * .1); r0 -= pad; r1 += pad;
  const L = 44, X = t => L + (t1 === t0 ? .5 : (t - t0) / (t1 - t0)) * (w - L - 10), Y = r => 10 + (1 - (r - r0) / (r1 - r0)) * (h - 30);
  ctx.font = '11px Inter'; ctx.fillStyle = '#8a97ab'; ctx.strokeStyle = 'rgba(15,27,45,.07)';
  for (let k = 0; k <= 4; k++) { const r = r0 + (r1 - r0) * k / 4, y = Y(r); ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(w, y); ctx.stroke(); ctx.fillText(Math.round(r), 4, y + 4); }
  for (const [tc, s] of Object.entries(series)) {
    const c = COLORS[tc] || '#fff'; ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.beginPath();
    s.forEach(([t, r], k) => k ? ctx.lineTo(X(t), Y(r)) : ctx.moveTo(X(t), Y(r))); ctx.stroke();
    const [lt, lr] = s[s.length - 1]; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(lt), Y(lr), 4, 0, 7); ctx.fill();
  }
  $('#rlegend').innerHTML = Object.entries(series).map(([tc, s]) => { const d = s[s.length - 1][1] - s[0][1]; return `<span class="pill"><i style="width:10px;height:10px;border-radius:3px;background:${COLORS[tc]}"></i>${tc} ${s[s.length - 1][1]} <b style="color:${d >= 0 ? 'var(--win)' : 'var(--loss)'}">${d >= 0 ? '+' : ''}${d}</b></span>`; }).join('');
}

/* ---------------- brilliant hunter ---------------- */
let huntRes = null;
async function runHunt(){
  if (S.hunting) { S.huntGen++; S.hunting = false; if (engine) engine.stop(); $('#b-hunt').textContent = 'Start scan'; $('#hunt-prog').classList.add('hidden'); return; }
  const n = +$('#hunt-n').value, list = filteredGames().filter(g => g.rules === 'chess').slice(0, n);
  if (!list.length) { toast('No games to scan with the current filters.'); return; }
  const gen = ++S.huntGen; S.hunting = true;
  $('#b-hunt').textContent = 'Stop'; $('#hunt-prog').classList.remove('hidden');
  huntRes = {games: [], n: list.length};
  for (let k = 0; k < list.length; k++) {
    let G; try { G = buildGame(list[k].pgn, metaFromGame(list[k])); } catch(e) { continue; }
    const ok = await analyzeGame(G, 11, (i, N) => {
      if (gen !== S.huntGen) return;
      $('#hunt-status').textContent = `Game ${k + 1} of ${list.length} · vs ${(G.meta.userColor === 'w' ? G.meta.black : G.meta.white)} · move ${Math.ceil(i / 2)}`;
      $('#hunt-bar').style.width = ((k + i / N) / list.length * 100) + '%';
    }, () => gen !== S.huntGen);
    if (!ok || gen !== S.huntGen) return;
    huntRes.games.push(G); renderHunt();
  }
  S.hunting = false; $('#b-hunt').textContent = 'Scan again'; $('#hunt-prog').classList.add('hidden');
  const b = huntRes.games.reduce((a, G) => a + countOf(G, G.meta.userColor, 'brilliant'), 0);
  if (b) { Sound.play('brilliant'); const r = $('#hunt-out').getBoundingClientRect(); Confetti.burst(innerWidth / 2, Math.max(120, r.top)); }
}
function renderHunt(){
  if (!huntRes) return;
  const gs = huntRes.games, tot = {}; for (const k of ORDER) tot[k] = gs.reduce((a, G) => a + countOf(G, G.meta.userColor, k), 0);
  const accs = gs.map(G => accuracy(G, G.meta.userColor)).filter(a => a != null);
  const avg = accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : null;
  const bestG = gs.slice().sort((a, b) => (accuracy(b, b.meta.userColor) || 0) - (accuracy(a, a.meta.userColor) || 0))[0];
  const items = []; gs.forEach((G, gi) => G.moves.forEach((m, i) => { if (m.color === G.meta.userColor && (m.cls === 'brilliant' || m.cls === 'great')) items.push({gi, i, m, G}); }));
  items.sort((a, b) => (a.m.cls === 'brilliant' ? 0 : 1) - (b.m.cls === 'brilliant' ? 0 : 1));
  $('#hunt-out').innerHTML = `
    <div class="card"><h4>Your totals across ${gs.length} game${gs.length === 1 ? '' : 's'}${gs.length < huntRes.n ? ` (of ${huntRes.n})` : ''}</h4>
      <div class="row" style="gap:18px;margin-bottom:6px"><div><div class="big">${avg == null ? '—' : avg.toFixed(1)}</div><div class="dim" style="font-size:12px">AVG ACCURACY</div></div>
      ${bestG ? `<div><div class="big" style="font-size:22px">${(accuracy(bestG, bestG.meta.userColor) || 0).toFixed(1)}%</div><div class="dim" style="font-size:12px">BEST GAME · vs ${esc(bestG.meta.userColor === 'w' ? bestG.meta.black : bestG.meta.white)}</div></div>` : ''}</div>
      <div class="row" style="margin-top:12px">${ORDER.map(k => `<span class="pill" style="${tot[k] ? '' : 'opacity:.45'}">${clsIcon(k, 18)} ${CLS[k].label} <b style="color:var(--text)">${tot[k]}</b></span>`).join('')}</div></div>
    <div class="card"><h4>${clsIcon('brilliant', 18)} Brilliant &amp; great moves</h4>
      ${items.length ? `<div class="bril-grid">${items.slice(0, 24).map((x, k) => `<div class="bril" data-k="${k}"><div class="mini"></div><div class="t">${clsIcon(x.m.cls, 18)} ${Math.floor(x.i / 2) + 1}${x.m.color === 'w' ? '.' : '...'} ${esc(x.m.san)}</div><div class="s">vs ${esc(x.G.meta.userColor === 'w' ? x.G.meta.black : x.G.meta.white)} · ${CLS[x.m.cls].label}</div></div>`).join('')}</div>`
        : '<div class="muted">No brilliant or great moves found yet. Keep hunting — try scanning more games!</div>'}</div>`;
  items.slice(0, 24).forEach((x, k) => {
    const el = $(`.bril[data-k="${k}"] .mini`), b = new Board(el, {coords: false, flipped: x.G.meta.userColor === 'b'});
    b.set({fen: x.G.positions[x.i + 1].fen, last: x.m, hl: CLS[x.m.cls].c, badge: {sq: x.m.to, cls: x.m.cls}});
    el.closest('.bril').onclick = () => openReview(x.G, {ply: x.i + 1});
  });
}

/* ============================================================
   Review
   ============================================================ */
const R = {G: null, ply: 0, gen: 0, tab: 'report', hint: false, play: null, retry: null, explore: null, analyzing: false, bestTok: 0};
let board = null;

function dispFen(){
  if (R.retry) return R.retry.fen || R.G.positions[R.retry.list[R.retry.k]].fen;
  if (R.explore) { const l = R.explore.line; return l.length ? l[l.length - 1].fen : R.G.positions[R.explore.base].fen; }
  return R.G.positions[R.ply].fen;
}
function boardState(){
  const G = R.G, fen = dispFen(), st = {fen, arrows: [], check: kingInCheck(fen)};
  if (R.retry) {
    const i = R.retry.list[R.retry.k];
    if (R.retry.last) { st.last = R.retry.last; st.hl = R.retry.lastColor; }
    if (R.retry.reveal && G.positions[i].best) { const b = G.positions[i].best; st.arrows.push({from: b.slice(0, 2), to: b.slice(2, 4), color: '#96bc4b'}); }
    return st;
  }
  if (R.explore) {
    const l = R.explore.line, last = l[l.length - 1];
    if (last) { st.last = last; st.hl = '#38bdf8'; }
    const lv = R.explore.live; if (lv && lv.fen === fen && lv.lines[1]) { const u = lv.lines[1].pv[0]; st.arrows.push({from: u.slice(0, 2), to: u.slice(2, 4), color: '#0284c7', op: .8}); }
    return st;
  }
  const m = R.ply > 0 ? G.moves[R.ply - 1] : null;
  if (m) {
    st.last = m; st.hl = m.cls ? CLS[m.cls].c : '#ffd84d';
    if (m.cls) st.badge = {sq: m.to, cls: m.cls};
    const pb = G.positions[R.ply - 1].best;
    if (m.cls && pb && pb !== m.uci && (BAD.has(m.cls) || m.cls === 'good' || R.showBest)) st.arrows.push({from: pb.slice(0, 2), to: pb.slice(2, 4), color: '#96bc4b'});
  }
  const cb = G.positions[R.ply].best;
  if (R.hint && cb) st.arrows.push({from: cb.slice(0, 2), to: cb.slice(2, 4), color: '#2563eb', op: .75});
  return st;
}
function initBoard(){
  board = new Board($('#board'), {
    interactive: true,
    canPick: sq => {
      const ch = new Chess(dispFen()), p = ch.get(sq);
      if (!p || p.color !== ch.turn()) return false;
      if (R.retry) return R.retry.state === 'try';
      return !ch.game_over();
    },
    targets: sq => new Chess(dispFen()).moves({square: sq, verbose: true}).map(m => m.to),
    onMove: (f, t, dragged) => R.retry ? retryMove(f, t, dragged) : userMove(f, t, dragged),
  });
}
function renderBoard(anim){ board.setFlip(R.flipped); board.set(boardState(), anim); }

function openReview(G, opts = {}){
  if (S.hunting && !G.done) { S.huntGen++; S.hunting = false; if (engine) engine.stop(); $('#b-hunt').textContent = 'Resume scan'; $('#hunt-prog').classList.add('hidden'); toast('Brilliant Hunter paused.'); }
  stopPlay(); live.stop();
  R.gen++; R.G = G; R.ply = opts.ply || 0; R.retry = null; R.explore = null; R.showBest = false;
  R.flipped = G.meta.userColor === 'b';
  if (!board) initBoard();
  show('review'); window.scrollTo(0, 0);
  setTab(opts.tab || (opts.ply ? 'moves' : 'report'));
  $('#retry-card').classList.add('hidden'); $('#explore-card').classList.add('hidden'); $('#coach-card').classList.remove('hidden');
  fetchAvatars(G);
  renderAll();
  if (G.done) finishUI(); else runAnalysis(settings.depth);
}
async function runAnalysis(depth){
  const gen = R.gen, G = R.G;
  R.analyzing = true;
  $('#an-spin').classList.remove('hidden'); $('#an-prog').classList.remove('hidden');
  $('#an-t').textContent = 'Analyzing your game with Stockfish 17…';
  const ok = await analyzeGame(G, depth, (i, N) => {
    if (gen !== R.gen) return;
    $('#an-pill').textContent = `${Math.round(i / (N - 1) * 100)}%`;
    $('#an-prog div').style.width = (100 * (i + 1) / N) + '%';
    if (Math.abs(i - R.ply) <= 1 || i % 6 === 0) renderAll(true);
  }, () => gen !== R.gen);
  if (!ok || gen !== R.gen) return;
  R.analyzing = false;
  finishUI();
}
function finishUI(){
  const G = R.G;
  $('#an-spin').classList.add('hidden'); $('#an-prog').classList.add('hidden');
  $('#an-t').innerHTML = `${icon('checkc', 'sm')} Review complete <span class="dim" style="font-weight:500;font-size:13px">· depth ${G.depth}${G.depth <= 11 ? ' (fast scan)' : ''}</span>`;
  $('#an-pill').innerHTML = G.depth < 20 ? `<button class="btn sm" id="b-deeper" style="padding:3px 9px">Analyze deeper</button>` : '';
  const d = $('#b-deeper'); if (d) d.onclick = () => { resetAnalysis(G); renderAll(); runAnalysis(Math.max(settings.depth, G.depth + 4, 16) >= 20 ? 20 : Math.max(settings.depth, G.depth + 4)); };
  renderAll();
}
async function fetchAvatars(G){
  if (!G.meta.fromApi) return;
  for (const c of ['w', 'b']) {
    const u = (c === 'w' ? G.meta.white : G.meta.black).toLowerCase();
    if (S.avatars[u] == null) { S.avatars[u] = ''; try { S.avatars[u] = (await api(`https://api.chess.com/pub/player/${encodeURIComponent(u)}`)).avatar || ''; } catch(e) {} }
    G.meta[c + 'Av'] = S.avatars[u];
  }
  if (R.G === G) { renderPlayers(); renderReport(); }
}
function setTab(t){
  R.tab = t;
  $$('.sidetabs .tab').forEach(b => b.classList.toggle('on', b.dataset.st === t));
  $('#p-report').classList.toggle('hidden', t !== 'report'); $('#p-moves').classList.toggle('hidden', t !== 'moves');
  if (t === 'report') drawGraph('#graph'); else { drawGraph('#graph2'); scrollMoves(); }
}

/* ---- render ---- */
function renderAll(light){
  renderBoard(); renderPlayers(); renderEval(); renderCoach(); renderMoves();
  if (R.tab === 'report') { if (!light || !R.analyzing || Math.random() < .3) renderReport(); drawGraph('#graph'); } else drawGraph('#graph2');
}
function avatarHTML(c){
  const M = R.G.meta, a = M[c + 'Av'], nm = c === 'w' ? M.white : M.black;
  return a ? `<img class="av s" src="${esc(a)}" alt="">` : `<div class="av s">${esc((nm || '?')[0].toUpperCase())}</div>`;
}
function capturedHTML(fen, c){
  const start = {p: 8, n: 2, b: 2, r: 2, q: 1}, have = {w: {p: 0, n: 0, b: 0, r: 0, q: 0}, b: {p: 0, n: 0, b: 0, r: 0, q: 0}};
  for (const row of new Chess(fen).board()) for (const p of row) if (p && p.type !== 'k') have[p.color][p.type]++;
  const opp = c === 'w' ? 'b' : 'w'; let h = '';
  for (const t of ['q', 'r', 'b', 'n', 'p']) for (let k = 0; k < Math.max(0, start[t] - have[opp][t]); k++) h += `<img src="${pieceUrl(opp, t)}" style="height:17px;margin-right:-5px;vertical-align:middle" alt="">`;
  const mat = x => have[x].p + 3 * have[x].n + 3 * have[x].b + 5 * have[x].r + 9 * have[x].q, d = mat(c) - mat(opp);
  return h + (d > 0 ? `<span style="letter-spacing:0;margin-left:9px;font-size:12px;font-weight:700">+${d}</span>` : '');
}
function clockAt(c){
  const G = R.G; let v = '';
  for (let i = 0; i < R.ply && i < G.clocks.length; i++) if (G.moves[i].color === c) v = G.clocks[i];
  if (!v) { const f = G.moves.findIndex(m => m.color === c); if (f >= 0 && G.clocks[f]) v = G.clocks[f]; }
  return v;
}
function renderPlayers(){
  const M = R.G.meta, fen = dispFen(), turn = new Chess(fen).turn();
  const bar = c => { const ck = clockAt(c);
    return `${avatarHTML(c)}<div style="min-width:0"><div class="row" style="gap:6px;flex-wrap:nowrap"><span class="nm">${esc(c === 'w' ? M.white : M.black)}</span><span class="rt">${(c === 'w' ? M.wElo : M.bElo) ? '(' + esc(c === 'w' ? M.wElo : M.bElo) + ')' : ''}</span></div><div class="cap">${capturedHTML(fen, c)}</div></div>
      ${ck ? `<span class="clk ${turn === c ? 'live' : ''}">${esc(ck)}</span>` : ''}`; };
  $('#pb-top').innerHTML = bar(R.flipped ? 'w' : 'b'); $('#pb-bot').innerHTML = bar(R.flipped ? 'b' : 'w');
  renderNow();
}
/* banner above the big navigation buttons: what was just played */
function renderNow(){
  const G = R.G, el = $('#nav-now'); if (!el || !G) return;
  const total = G.moves.length, last = G.positions.length - 1;
  $('#c-prev').disabled = !R.explore && !R.retry && R.ply === 0;
  $('#c-first').disabled = !R.explore && !R.retry && R.ply === 0;
  $('#c-next').disabled = !R.explore && !R.retry && R.ply >= last;
  $('#c-last').disabled = !R.explore && !R.retry && R.ply >= last;
  if (R.retry) { el.innerHTML = `${icon('undo', 'sm')}<b>Puzzle mode</b><span class="pos">Find the better move</span>`; return; }
  if (R.explore) { el.innerHTML = `${icon('eye', 'sm')}<b>Exploring your own line</b><span class="pos">Press Back to game to return</span>`; return; }
  if (R.ply === 0) { el.innerHTML = `<span class="lbl">START</span><b>${esc(G.meta.opening || 'Starting position')}</b><span class="pos">${total} moves · press Next move</span>`; return; }
  const m = G.moves[R.ply - 1], who = m.color === 'w' ? G.meta.white : G.meta.black, c = m.cls ? CLS[m.cls] : null;
  el.innerHTML = `<span class="cdot ${m.color}"></span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${esc(moveLabel(R.ply, m))}</b> <span class="muted">by ${esc(who)}</span></span>
    ${c ? `${clsIcon(m.cls, 20)}<span class="cl" style="color:${c.c}">${c.label}</span>` : '<div class="spin"></div>'}
    <span class="pos num">${R.ply} / ${total}</span>`;
}
function curEval(){
  if (R.explore && R.explore.live && R.explore.live.fen === dispFen() && R.explore.live.lines[1]) { const l = R.explore.live.lines[1], t = new Chess(dispFen()).turn(); return {w: t === 'w' ? scoreWin(l) : 100 - scoreWin(l), txt: fmtScore(l, t)}; }
  if (R.explore || R.retry) { const fen = dispFen(), ch = new Chess(fen); if (ch.in_checkmate()) return {w: ch.turn() === 'w' ? 0 : 100, txt: ch.turn() === 'w' ? '0-1' : '1-0'}; if (R.explore) return null; }
  const p = R.retry ? R.G.positions[R.retry.list[R.retry.k]] : R.G.positions[R.ply];
  return p.wW == null ? null : {w: p.wW, txt: fmtScore(p.score, p.turn)};
}
function renderEval(){
  const e = curEval(), w = e ? e.w : 50, f = $('#evf'), t = $('#evt');
  f.style.height = (R.flipped ? 100 - w : w) + '%';
  f.style.top = R.flipped ? '0' : 'auto'; f.style.bottom = R.flipped ? 'auto' : '0';
  t.textContent = e ? e.txt.replace(/^\+/, '') : '';
  const wa = w >= 50, atBottom = wa !== R.flipped;
  t.style.top = atBottom ? 'auto' : '5px'; t.style.bottom = atBottom ? '5px' : 'auto'; t.style.color = wa ? '#1e293b' : '#fff';
}
const moveLabel = (ply, m) => `${Math.floor((ply - 1) / 2) + 1}${m.color === 'w' ? '.' : '...'} ${m.san}`;
function lineHTML(G, ply, sans){
  const st = G.positions[ply - 1]; let n = Math.floor((ply - 1) / 2) + 1, white = st.turn === 'w', out = '';
  sans.forEach((s, k) => { if (white) out += `${n}. `; else if (k === 0) out += `${n}... `; out += (k === 0 ? `<b>${esc(s)}</b>` : esc(s)) + ' '; if (!white) n++; white = !white; });
  return out;
}
/* why the better move was better, in plain words */
function betterWhy(G, i){
  const m = G.moves[i], pos = G.positions[i], l1 = (pos.lines || {})[1], who = m.color === 'w' ? 'White' : 'Black';
  if (l1 && l1.type === 'mate' && l1.v > 0) return `It forces checkmate in ${l1.v}.`;
  if (l1) { const s = swing(pos.fen, l1.pv, 2, m.color); if (s.d >= 2 && s.first && s.first.captured) return `It wins a ${PNAME[s.first.captured]}.`; }
  const after = G.positions[i + 1];
  if (after.score && after.score.type === 'mate' && after.score.v > 0) return `Your move allowed mate in ${after.score.v}; this one doesn't.`;
  return `It keeps ${who}'s winning chances at ${m.wB.toFixed(0)}% instead of dropping to ${m.wA.toFixed(0)}%.`;
}
function renderCoach(){
  renderNow();
  if (R.retry) return renderRetry();
  if (R.explore) return renderExplore();
  const G = R.G, m = R.ply > 0 ? G.moves[R.ply - 1] : null;
  const ic = $('#co-ic'), t1 = $('#co-t1'), t2 = $('#co-t2'), wc = $('#co-wc'), ln = $('#co-line'), bt = $('#co-better');
  wc.classList.add('hidden'); ln.classList.add('hidden'); bt.innerHTML = '';
  $('#b-showbest').classList.add('hidden');
  if (!m) {
    ic.innerHTML = coachAvatar(48); setSay(coachLine('start', G.moves.length, ''));
    t1.textContent = G.meta.opening || 'Starting position';
    t2.innerHTML = 'Press <b>Next move</b> (or the <span class="kbd">→</span> key) to see what was played. <b>Key moment</b> jumps straight to the moves that mattered.';
    return;
  }
  if (!m.cls) { ic.innerHTML = coachAvatar(48); setSay('Let me think about this one…'); t1.textContent = moveLabel(R.ply, m); t2.textContent = 'Analyzing this move…'; return; }
  const c = CLS[m.cls], who = m.color === 'w' ? G.meta.white : G.meta.black;
  ic.innerHTML = coachAvatar(48, m.cls);
  setSay(coachLine(m.rookSac && m.cls !== 'brilliant' ? 'rooksac' : m.cls, R.ply * 7 + m.san.length, m.san));
  t1.innerHTML = `${esc(who)} played <span style="white-space:nowrap">${esc(moveLabel(R.ply, m))}</span> <span style="color:${c.c}">— ${c.label}${m.cls === 'brilliant' ? '!!' : m.cls === 'great' ? '!' : ''}</span>`;
  t2.innerHTML = explain(m) + (m.note && !BAD.has(m.cls) ? ' ' + m.note : '');
  // what could have been better
  const hasBetter = m.bestSan && m.bestSan !== m.san && !['forced', 'book', 'brilliant', 'great', 'best'].includes(m.cls);
  if (hasBetter) {
    const strong = BAD.has(m.cls);
    bt.innerHTML = `<div class="better"><div class="hd">${icon('bulb', 'sm')}${strong ? 'What you could have done better' : 'Slightly stronger was'}</div>
      <div class="mv">${clsIcon('best', 24)}${esc(moveLabel(R.ply, {color: m.color, san: m.bestSan}))}<span class="pill blue">${esc(m.bestEval)}</span></div>
      <div class="why">${betterWhy(G, R.ply - 1)}${strong && m.note ? ' ' + m.note : ''}</div>
      ${m.bestLine.length > 1 ? `<div class="ln">Line: ${lineHTML(G, R.ply, m.bestLine)}</div>` : ''}</div>`;
    $('#b-showbest').classList.remove('hidden');
  } else if (['brilliant', 'great'].includes(m.cls)) {
    bt.innerHTML = whyBoxHTML(G, R.ply - 1);
  } else if (m.cls === 'best') {
    bt.innerHTML = `<div class="better ok"><div class="hd">${icon('checkc', 'sm')}You found the engine's top move</div>
      ${m.bestLine.length > 1 ? `<div class="ln">Line: ${lineHTML(G, R.ply, m.bestLine)}</div>` : ''}</div>`;
  }
  if (m.cls !== 'forced') {
    wc.classList.remove('hidden');
    const dlt = m.wA - m.wB;
    wc.innerHTML = `<span style="white-space:nowrap">${esc(who)}'s winning chances</span><div class="bar"><i style="width:${m.wA}%"></i></div><b class="num" style="color:var(--text)">${m.wA.toFixed(0)}%</b><span class="num" style="font-weight:600;color:${dlt < -2 ? 'var(--loss)' : dlt > 2 ? 'var(--win)' : 'var(--dim)'}">${dlt >= 0 ? '+' : ''}${dlt.toFixed(0)}</span>`;
  }
}
function setSay(t){ $('#co-say').textContent = '“' + t + '”'; $('#co-name').textContent = coach().name; }
function speakCoach(){
  if (!settings.voice || !R.G || R.explore || R.retry) return;
  const m = R.ply > 0 ? R.G.moves[R.ply - 1] : null; if (m && !m.cls) return;
  const say = $('#co-say').textContent.replace(/[“”]/g, '');
  let why = m ? explain(m) : '';
  if (m && m.bestSan && m.bestSan !== m.san && BAD.has(m.cls)) why += ' ' + betterWhy(R.G, R.ply - 1);
  Speech.say((say + ' ' + why).replace(/<[^>]+>/g, ''), coach().voice);
}
function explain(m){
  const best = m.bestSan ? `<b>${esc(m.bestSan)}</b>` : 'another move';
  switch (m.cls) {
    case 'brilliant': return 'A sound sacrifice. You give up material and the position is still excellent for you.';
    case 'great': return 'The only good move in the position. Every alternative was clearly worse.';
    case 'best': return 'This is exactly what the engine would have played.';
    case 'excellent': return 'Very close to the best move. Strong play.';
    case 'good': return 'A reasonable move, though there was a slightly stronger option.';
    case 'book': return 'A standard opening move.';
    case 'forced': return 'This was the only legal move.';
    case 'inaccuracy': return `Not the most precise. ${best} was better.`;
    case 'mistake': return `This lets the advantage slip. ${best} was the stronger choice.`;
    case 'miss': return `Your opponent had just made an error, and this move doesn't punish it. ${best} would have.`;
    case 'blunder': return `This seriously damages the position. ${best} was the move here.`;
  }
  return '';
}
function renderMoves(){
  const G = R.G; let h = '';
  for (let i = 0; i < G.moves.length; i += 2) {
    h += `<div class="no">${G.positions[0].turn === 'b' && i === 0 ? '1…' : Math.floor(i / 2) + 1 + '.'}</div>`;
    for (const j of [i, i + 1]) {
      const m = G.moves[j]; if (!m) { h += '<div></div>'; continue; }
      const show = m.cls && !['excellent', 'good', 'forced', 'book'].includes(m.cls);
      const p = G.positions[j + 1];
      h += `<div class="m ${R.ply === j + 1 && !R.explore && !R.retry ? 'cur' : ''}" data-ply="${j + 1}">${show ? clsIcon(m.cls, 18) : ''}${esc(m.san)}${m.rookSac ? `<span title="Rook sacrifice" style="color:#ea580c;display:flex">${icon('rook', 'sm')}</span>` : ''}<span class="ev">${p.score ? esc(fmtScore(p.score, p.turn)) : ''}</span></div>`;
    }
  }
  $('#mvs').innerHTML = h; scrollMoves();
}
function scrollMoves(){
  const box = $('#mvs'), cur = box.querySelector('.cur'); if (!cur || R.tab !== 'moves') return;
  const top = cur.offsetTop - box.offsetTop;
  if (top < box.scrollTop + 10 || top > box.scrollTop + box.clientHeight - 50) box.scrollTop = top - box.clientHeight / 2;
}
const ACH_IC = {Brilliancy: 'spark', Sharpshooter: 'target', 'Clean Sheet': 'shield', 'Comeback Kid': 'trend', 'Great Escape': 'shield', 'Giant Slayer': 'swords', 'Checkmate Artist': 'trophy', 'Engine Twin': 'cpu', 'Only-Move Hero': 'zap', Punisher: 'target', Blitzkrieg: 'zap'};
function renderReport(){
  const G = R.G, M = G.meta, aw = accuracy(G, 'w'), ab = accuracy(G, 'b');
  const pl = c => { const a = c === 'w' ? aw : ab; return `<div class="p">${avatarHTML(c).replace('av s', 'av m')}<span class="nm">${esc(c === 'w' ? M.white : M.black)}</span><span class="accn ${c}">${a == null ? '—' : a.toFixed(1)}</span></div>`; };
  $('#rep-players').innerHTML = pl('w') + '<div class="vs">ACCURACY</div>' + pl('b');
  $('#rep-counts').innerHTML = ORDER.map(k => { const w = countOf(G, 'w', k), b = countOf(G, 'b', k);
    return `<tr class="${w + b ? '' : 'z'}"><td class="n" style="color:${CLS[k].c}">${w}</td><td class="l">${clsIcon(k, 22)}<span style="width:90px;text-align:left">${CLS[k].label}</span></td><td class="n" style="color:${CLS[k].c}">${b}</td></tr>`; }).join('');
  const ew = G.done ? estRating(aw, M.wElo) : null, eb = G.done ? estRating(ab, M.bElo) : null;
  $('#rep-est').innerHTML = `<div><b>${ew || '—'}</b></div><div><small>Game rating</small><small style="text-transform:none;letter-spacing:0;font-weight:500">estimated</small></div><div><b>${eb || '—'}</b></div>`;
  const grade = a => a == null ? 'var(--dim)' : a >= 90 ? '#4d8a1f' : a >= 75 ? '#6b8e5a' : a >= 60 ? '#b7791f' : '#dc2626';
  const pc = (c, ph) => { const a = phaseAcc(G, c, ph); return `<td class="num" style="color:${grade(a)};font-weight:800;font-size:16px">${a == null ? '—' : a.toFixed(0)}</td>`; };
  $('#rep-phase').innerHTML = `<tr><td class="dim" style="font-size:12px">${esc(M.white)}</td><td></td><td class="dim" style="font-size:12px">${esc(M.black)}</td></tr>` +
    [['open', 'Opening'], ['mid', 'Middlegame'], ['end', 'Endgame']].map(([k, l]) => `<tr>${pc('w', k)}<td>${l}</td>${pc('b', k)}</tr>`).join('');
  if (!G.done) return;
  // biggest improvements
  const side = M.userColor;
  $('#rep-imp-who').textContent = side ? 'for ' + (side === 'w' ? M.white : M.black) : 'both players';
  const imp = G.moves.map((m, i) => ({m, i})).filter(({m}) => (!side || m.color === side) && m.bestSan && m.bestSan !== m.san && m.loss >= 4 && !['forced', 'book'].includes(m.cls))
    .sort((a, b) => b.m.loss - a.m.loss).slice(0, 5);
  $('#rep-imp').innerHTML = imp.length ? imp.map(({m, i}) => `<div class="impi" data-ply="${i + 1}">${clsIcon(m.cls, 24)}
      <div style="min-width:0"><div class="n">Move ${Math.floor(i / 2) + 1}${side ? '' : ' · ' + esc(m.color === 'w' ? M.white : M.black)}</div>
      <div class="pl">You played <b>${esc(m.san)}</b> ${icon('next', 'sm')} better was <span class="bt">${esc(m.bestSan)}</span></div>
      <div class="muted" style="font-size:12.5px;margin-top:2px">${betterWhy(G, i)}</div></div>
      <div class="lost">−${m.loss.toFixed(0)}%<div class="dim" style="font-weight:500;font-size:11px">win chance</div></div></div>`).join('')
    : `<div class="better ok"><div class="hd">${icon('checkc', 'sm')}Nothing major to fix</div><div class="why">No move lost a meaningful amount of winning chances. Excellent game.</div></div>`;
  const sides = M.userColor ? [M.userColor] : ['w', 'b'];
  const ach = sides.flatMap(c => achievements(G, c).map(a => [...a, c]));
  $('#rep-ach').innerHTML = ach.length ? ach.map(([, t, s, c]) => `<div class="ach"><span class="e">${icon(ACH_IC[t] || 'trophy')}</span><div><b>${t}</b><small>${sides.length > 1 ? esc(c === 'w' ? M.white : M.black) + ' · ' : ''}${esc(s)}</small></div></div>`).join('')
    : '<span class="muted" style="font-size:14px">No badges this time. Standout games unlock achievements like Giant Slayer and Clean Sheet.</span>';
  let tp = -1, tl = 0; G.moves.forEach((m, i) => { if (m.loss > tl && BAD.has(m.cls)) { tl = m.loss; tp = i; } });
  const keys = G.moves.map((m, i) => ({m, i})).filter(x => KEY.has(x.m.cls));
  $('#rep-keys').innerHTML = keys.length ? keys.map(({m, i}) => `<div class="km" data-ply="${i + 1}">${clsIcon(m.cls, 22)}<b>${esc(moveLabel(i + 1, m))}</b><span class="muted" style="font-size:13px">${esc(m.color === 'w' ? M.white : M.black)}</span><span class="why">${i === tp ? '<b style="color:var(--loss)">Turning point</b> · ' : ''}${CLS[m.cls].label}${m.bestSan && BAD.has(m.cls) ? ' · best ' + esc(m.bestSan) : ''}</span></div>`).join('')
    : '<span class="muted" style="font-size:14px">A smooth game with no big swings or brilliancies.</span>';
}

/* ---- eval graph ---- */
function paintGraph(ctx, x0, y0, w, h, G, cur, o = {}){
  const P = G.positions, N = P.length;
  ctx.save(); ctx.fillStyle = o.bg || '#334155'; ctx.fillRect(x0, y0, w, h);
  const pad = (o.dot || 4) + 2, X = i => x0 + (N <= 1 ? 0 : i / (N - 1) * w), Y = v => y0 + pad + (1 - v / 100) * (h - pad * 2);
  const pts = []; for (let i = 0; i < N; i++) if (P[i].wW != null) pts.push([X(i), Y(P[i].wW), i]);
  if (pts.length) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], y0 + h); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.lineTo(pts[pts.length - 1][0], y0 + h); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  ctx.strokeStyle = 'rgba(37,99,235,.55)'; ctx.lineWidth = o.lw || 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x0, y0 + h / 2); ctx.lineTo(x0 + w, y0 + h / 2); ctx.stroke(); ctx.setLineDash([]);
  if (cur != null) { ctx.strokeStyle = '#2563eb'; ctx.lineWidth = (o.lw || 1) * 2; ctx.beginPath(); ctx.moveTo(X(cur), y0); ctx.lineTo(X(cur), y0 + h); ctx.stroke(); }
  const r = o.dot || 4;
  for (const [x, y, i] of pts) { const m = G.moves[i - 1]; if (m && KEY.has(m.cls)) { ctx.fillStyle = CLS[m.cls].c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.lineWidth = r / 2.5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); } }
  ctx.restore();
}
function drawGraph(sel){
  const c = $(sel), dpr = devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight; if (!w || !R.G) return;
  c.width = w * dpr; c.height = h * dpr; const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  paintGraph(ctx, 0, 0, w, h, R.G, R.explore ? R.explore.base : R.ply);
}
function graphPly(e){ const r = e.target.getBoundingClientRect(); return clamp(Math.round((e.clientX - r.left) / r.width * (R.G.positions.length - 1)), 0, R.G.positions.length - 1); }

/* ---- navigation ---- */
function go(p, o = {}){
  if (!R.G) return;
  if (R.retry) return;
  if (R.explore) exitExplore(true);
  p = clamp(p, 0, R.G.positions.length - 1);
  const d = p - R.ply; R.ply = p; R.showBest = false;
  let anim = null;
  if (d === 1 && !o.dragged) anim = moveAnim(R.G.moves[p - 1]);
  if (d === -1) anim = moveAnim(R.G.moves[p], true);
  renderBoard(anim); renderPlayers(); renderEval(); renderCoach(); renderMoves(); drawGraph(R.tab === 'report' ? '#graph' : '#graph2');
  if (d === 1) {
    const m = R.G.moves[p - 1]; moveSound(m);
    const special = Hype.onMove(m, R.G, p);
    if (!special) speakCoach(); else if (settings.voice && !settings.hype) setTimeout(speakCoach, 1400);
  } else if (d === -1) { Sound.play('move'); Speech.stop(); }
}
function togglePlay(){ if (R.play) stopPlay(); else startPlay(); }
function startPlay(){
  if (R.retry) return; if (R.explore) exitExplore(true);
  if (R.ply >= R.G.positions.length - 1) go(0);
  if (R.tab !== 'moves') setTab('moves');
  $('#c-play').innerHTML = icon('pause'); $('#c-play').classList.add('on');
  const step = () => {
    if (R.ply >= R.G.positions.length - 1) return stopPlay();
    go(R.ply + 1);
    const m = R.G.moves[R.ply - 1];
    R.play = setTimeout(step, settings.speed * (m && KEY.has(m.cls) ? 2.2 : 1));
  };
  R.play = setTimeout(step, 250);
}
function stopPlay(){ clearTimeout(R.play); R.play = null; const b = $('#c-play'); if (b) { b.innerHTML = icon('play'); b.classList.remove('on'); } }
function nextKey(){
  if (!R.G) return; stopPlay();
  for (let j = R.ply; j < R.G.moves.length; j++) if (KEY.has(R.G.moves[j].cls)) { if (R.tab !== 'moves') setTab('moves'); return go(j + 1); }
  toast(R.G.done ? 'No more key moments — that was the last one.' : 'Still analyzing — try again in a moment.');
}

/* ---- explore ---- */
function userMove(from, to, dragged){
  stopPlay();
  const ch = new Chess(dispFen()), m = ch.move({from, to, promotion: 'q'}); if (!m) return;
  if (!R.explore) {
    const gm = R.G.moves[R.ply];
    if (gm && gm.from === from && gm.to === to) { go(R.ply + 1, {dragged}); return; }
    R.explore = {base: R.ply, line: [], live: null};
    if (R.tab !== 'moves') setTab('moves');
  }
  R.explore.line.push({fen: ch.fen(), san: m.san, from: m.from, to: m.to, flags: m.flags, color: m.color});
  moveSound(m);
  renderExploreAll(dragged ? null : moveAnim(m));
  startLive();
}
function startLive(){
  const fen = dispFen(), ch = new Chess(fen);
  if (ch.game_over()) { R.explore.live = null; renderExplore(); renderEval(); return; }
  live.start(fen, info => {
    if (!R.explore || info.fen !== dispFen()) return;
    R.explore.live = info; renderEval(); renderExplore(); board.setArrows(boardState().arrows);
  });
}
function renderExploreAll(anim){ renderBoard(anim); renderPlayers(); renderEval(); renderCoach(); renderMoves(); drawGraph('#graph2'); }
function renderExplore(){
  const E = R.explore, G = R.G; if (!E) return;
  $('#coach-card').classList.add('hidden'); $('#explore-card').classList.remove('hidden');
  const st = G.positions[E.base]; let n = Math.floor(E.base / 2) + 1, white = st.turn === 'w', line = '';
  E.line.forEach((x, k) => { if (white) line += `${n}. `; else if (k === 0) line += `${n}... `; line += esc(x.san) + ' '; if (!white) n++; white = !white; });
  const fen = dispFen(), ch = new Chess(fen), lv = E.live && E.live.fen === fen ? E.live : null;
  let evalTxt = '<span class="dim">thinking…</span>', best = '';
  if (ch.in_checkmate()) evalTxt = '<b>Checkmate!</b>';
  else if (ch.game_over()) evalTxt = '<b>Draw</b>';
  else if (lv && lv.lines[1]) { evalTxt = `<b style="font-family:Sora;font-size:18px">${esc(fmtScore(lv.lines[1], ch.turn()))}</b> <span class="dim">depth ${lv.depth}</span>`; best = pvToSan(fen, lv.lines[1].pv, 6).join(' '); }
  $('#explore-card').innerHTML = `<div class="row"><b style="display:flex;gap:7px;align-items:center">${icon('eye', 'sm')}Exploring your own line</b><span class="pill">from move ${Math.floor(E.base / 2) + 1}</span><div style="flex:1"></div><button class="btn sm" data-x="undo">${icon('undo', 'sm')}Undo</button><button class="btn sm pri" data-x="exit">Back to game</button></div>
    <div class="bline" style="margin-top:12px"><span class="dim">Your line:</span> ${line || '—'}</div>
    <div class="row" style="margin-top:12px">Engine eval: ${evalTxt}</div>
    ${best ? `<div class="bline"><span class="dim">Engine continues:</span> <b>${esc(best.split(' ')[0])}</b> ${esc(best.split(' ').slice(1).join(' '))}</div>` : ''}
    <div class="dim" style="font-size:12.5px;margin-top:10px">Keep dragging pieces to go deeper. ← undoes a move, Esc returns to the game.</div>`;
}
function undoExplore(){
  const E = R.explore; if (!E) return;
  const last = E.line.pop();
  if (!E.line.length) { exitExplore(); return; }
  renderExploreAll(moveAnim(last, true)); Sound.play('move'); startLive();
}
function exitExplore(silent){
  live.stop(); R.bestTok++; R.explore = null;
  $('#explore-card').classList.add('hidden'); $('#coach-card').classList.remove('hidden');
  if (!silent) renderAll();
}
async function playBestLine(){
  const G = R.G, m = G.moves[R.ply - 1]; if (!m) return;
  const pos = G.positions[R.ply - 1], pv = (pos.lines && pos.lines[1] && pos.lines[1].pv || []).slice(0, 6);
  if (!pv.length) return;
  stopPlay(); const tok = ++R.bestTok;
  const base = R.ply - 1;
  R.explore = {base, line: [], live: null}; R.ply = base;
  renderExploreAll();
  for (const u of pv) {
    await sleep(R.explore.line.length ? 750 : 350);
    if (tok !== R.bestTok || !R.explore) return;
    const ch = new Chess(dispFen()), r = ch.move(mvObj(u)); if (!r) break;
    R.explore.line.push({fen: ch.fen(), san: r.san, from: r.from, to: r.to, flags: r.flags, color: r.color});
    moveSound(r); renderExploreAll(moveAnim(r));
  }
  if (tok === R.bestTok && R.explore) startLive();
}

/* ---- retry mistakes ---- */
function startRetry(){
  const G = R.G;
  if (!G.done) { toast('Wait for the review to finish first.'); return; }
  const mine = G.meta.userColor;
  const list = G.moves.map((m, i) => i).filter(i => ['mistake', 'blunder', 'miss'].includes(G.moves[i].cls) && (!mine || G.moves[i].color === mine) && G.positions[i].best);
  if (!list.length) { toast('No mistakes to retry. Clean game!'); return; }
  stopPlay(); if (R.explore) exitExplore(true);
  R.retry = {list, k: 0, solved: 0};
  setTab('moves'); $('#coach-card').classList.add('hidden'); $('#retry-card').classList.remove('hidden');
  setRetry();
}
function setRetry(){
  const Q = R.retry, i = Q.list[Q.k];
  Object.assign(Q, {state: 'try', tries: 0, reveal: false, fen: null, last: null});
  R.flipped = R.G.moves[i].color === 'b';
  renderBoard(); renderPlayers(); renderEval(); renderRetry(); renderMoves();
}
function renderRetry(){
  const Q = R.retry, i = Q.list[Q.k], m = R.G.moves[i], side = m.color === 'w' ? 'White' : 'Black';
  let msg;
  if (Q.state === 'try') msg = `In the game, ${side} played <b>${esc(m.san)}</b> — ${CLS[m.cls].s}. Find a better move by dragging or clicking a piece.${Q.tries ? `<br><span style="color:var(--loss);font-weight:700">Not quite — try again! (${Q.tries} ${Q.tries === 1 ? 'try' : 'tries'})</span>` : ''}`;
  else if (Q.state === 'ok') msg = `<span style="color:var(--win);font-weight:800">Correct!</span> <b>${esc(Q.played)}</b> is the best move. ${m.note || ''}`;
  else msg = `The best move was <b style="color:#96bc4b">${esc(m.bestSan)}</b>. Line: ${esc(m.bestLine.slice(0, 6).join(' '))}`;
  $('#retry-card').innerHTML = `<div class="row"><b style="display:flex;gap:7px;align-items:center">${icon('undo', 'sm')}Retry your mistakes</b><span class="pill">${Q.k + 1} / ${Q.list.length}</span><span class="pill" style="color:#96bc4b">${Q.solved} solved</span><div style="flex:1"></div><button class="btn sm" data-r="exit">Exit</button></div>
    <div class="coach" style="margin-top:14px"><div class="av2">${clsIcon(m.cls, 40)}</div><div><div class="t1">${side} to move — move ${Math.floor(i / 2) + 1}</div><div class="t2">${msg}</div></div></div>
    <div class="acts">${Q.state === 'try' ? `<button class="btn sm" data-r="hint">${icon('bulb', 'sm')}Hint</button><button class="btn sm" data-r="show">Show answer</button>` : ''}${Q.k < Q.list.length - 1 ? '<button class="btn sm pri" data-r="next">Next puzzle →</button>' : '<button class="btn sm pri" data-r="exit">Finish</button>'}</div>`;
}
function retryMove(from, to, dragged){
  const Q = R.retry, i = Q.list[Q.k], pos = R.G.positions[i];
  const ch = new Chess(pos.fen), r = ch.move({from, to, promotion: 'q'}); if (!r) return;
  const u = uciOf(r), l1 = pos.lines[1], l2 = pos.lines[2];
  const ok = u === pos.best || (l2 && l2.pv[0] === u && l1 && scoreWin(l1) - scoreWin(l2) <= 3);
  Q.fen = ch.fen(); Q.last = r; Q.lastColor = ok ? '#96bc4b' : '#ca3431';
  renderBoard(dragged ? null : moveAnim(r)); moveSound(r);
  if (ok) {
    Object.assign(Q, {state: 'ok', played: r.san}); Q.solved++;
    setTimeout(() => Sound.play('ok'), 150);
    const b = $('#board').getBoundingClientRect(); Confetti.burst(b.left + b.width / 2, b.top + b.height / 2, 70);
    renderRetry(); renderEval();
  } else {
    Q.tries++; setTimeout(() => Sound.play('wrong'), 150);
    renderRetry();
    setTimeout(() => { if (R.retry === Q && Q.state === 'try') { Q.fen = null; Q.last = null; renderBoard(moveAnim(r, true)); } }, 650);
  }
}
function exitRetry(){
  R.retry = null; R.flipped = R.G.meta.userColor === 'b';
  $('#retry-card').classList.add('hidden'); $('#coach-card').classList.remove('hidden');
  renderAll();
}

/* ============================================================
   Share cards + gallery
   ============================================================ */
const imgCache = {};
function loadImg(src){ if (!imgCache[src]) imgCache[src] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); return imgCache[src]; }
async function preloadPieces(){ const out = {}; for (const c of 'wb') for (const t of 'kqrbnp') out[c + t] = await loadImg(pieceUrl(c, t)); return out; }
function rr(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function fit(ctx, t, w){ t = String(t); while (ctx.measureText(t).width > w && t.length > 3) t = t.slice(0, -2) + '…'; return t; }
function drawBoardCanvas(ctx, x, y, size, fen, imgs, o = {}){
  const [, L, D] = BOARDS[settings.board] || BOARDS.ocean, s = size / 8, b = new Chess(fen).board(), flip = o.flip;
  const xy = sq => { const f = sq.charCodeAt(0) - 97, r = +sq[1] - 1; return flip ? [7 - f, r] : [f, 7 - r]; };
  ctx.save(); rr(ctx, x, y, size, size, 16); ctx.clip();
  for (let vy = 0; vy < 8; vy++) for (let vx = 0; vx < 8; vx++) { const f = flip ? 7 - vx : vx, r = flip ? vy : 7 - vy; ctx.fillStyle = (f + r) % 2 ? L : D; ctx.fillRect(x + vx * s, y + vy * s, s + .5, s + .5); }
  if (o.hl) for (const sq of o.hl) { const [vx, vy] = xy(sq); ctx.globalAlpha = .5; ctx.fillStyle = o.hlColor; ctx.fillRect(x + vx * s, y + vy * s, s, s); ctx.globalAlpha = 1; }
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const p = b[7 - r][f]; if (!p) continue; const [vx, vy] = xy('abcdefgh'[f] + (r + 1)), im = imgs[p.color + p.type]; if (!im) continue;
    ctx.save();
    if (settings.pieces === 'neon') { ctx.shadowColor = p.color === 'w' ? '#00e5ff' : '#ff3d81'; ctx.shadowBlur = s * .22; }
    else { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = s * .06; ctx.shadowOffsetY = s * .04; }
    ctx.drawImage(im, x + vx * s, y + vy * s, s, s); ctx.restore();
  }
  ctx.restore();
  if (o.arrow) {
    const c = sq => { const [vx, vy] = xy(sq); return [vx + .5, vy + .5]; };
    const g = arrowGeom(c(o.arrow.slice(0, 2)), c(o.arrow.slice(2, 4))), P = p => [x + p[0] * s, y + p[1] * s];
    ctx.save(); ctx.globalAlpha = .88; ctx.strokeStyle = ctx.fillStyle = '#96bc4b'; ctx.lineWidth = s * .17; ctx.lineJoin = 'round';
    ctx.beginPath(); g.pts.forEach((p, k) => k ? ctx.lineTo(...P(p)) : ctx.moveTo(...P(p))); ctx.stroke();
    ctx.beginPath(); g.head.forEach((p, k) => k ? ctx.lineTo(...P(p)) : ctx.moveTo(...P(p))); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  if (o.badge) { const [vx, vy] = xy(o.badge.sq), r = s * .25; const bx = Math.min(x + (vx + 1) * s - r * .4, x + size - r - 4), by = Math.max(y + vy * s + r * .4, y + r + 4);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 12; drawClsIcon(ctx, o.badge.cls, bx, by, r); ctx.restore(); }
}
function cardBase(W, H){
  const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5f7fb'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2563eb'; ctx.fillRect(0, 0, W, 150);
  const g = ctx.createLinearGradient(0, 0, W, 150); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.12)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = '#ffffff'; rr(ctx, 60, 46, 58, 58, 14); ctx.fill();
  return {c, ctx};
}
async function cardLogo(ctx, W, right){
  const im = await loadImg('pieces/cburnett/wN.svg'); if (im) ctx.drawImage(im, 65, 51, 48, 48);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = '800 36px Inter, sans-serif'; ctx.fillText('BrillMove', 136, 76);
  if (right) { ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '600 24px Inter, sans-serif'; ctx.fillText(fit(ctx, right, 480), W - 60, 76); }
}
function cardPlayers(ctx, W, y){
  const G = R.G, M = G.meta, cw = (W - 150) / 2;
  for (const [k, c] of [[0, 'w'], [1, 'b']]) {
    const x = 60 + k * (cw + 30), a = accuracy(G, c);
    ctx.save(); ctx.shadowColor = 'rgba(16,24,40,.08)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4; ctx.fillStyle = '#fff'; rr(ctx, x, y, cw, 120, 18); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#e3e8f0'; ctx.lineWidth = 2; rr(ctx, x, y, cw, 120, 18); ctx.stroke();
    ctx.fillStyle = c === 'w' ? '#ffffff' : '#1e293b'; rr(ctx, x + 24, y + 26, 22, 22, 5); ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#0f1b2d'; ctx.font = '700 28px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const elo = c === 'w' ? M.wElo : M.bElo; ctx.fillText(fit(ctx, (c === 'w' ? M.white : M.black) + (elo ? ` (${elo})` : ''), cw - 90), x + 60, y + 38);
    ctx.fillStyle = '#53627a'; ctx.font = '600 21px Inter, sans-serif'; ctx.fillText('Accuracy', x + 24, y + 86);
    ctx.fillStyle = '#2563eb'; ctx.font = '800 40px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(a == null ? '—' : a.toFixed(1), x + cw - 24, y + 84);
  }
}
async function makeMomentCard(){
  const W = 1080, H = 1350, {c, ctx} = cardBase(W, H), G = R.G, imgs = await preloadPieces();
  await cardLogo(ctx, W, G.meta.opening || G.meta.date || '');
  const m = R.ply > 0 ? G.moves[R.ply - 1] : null, cl = m && m.cls ? CLS[m.cls] : null;
  if (cl) {
    drawClsIcon(ctx, m.cls, 108, 222, 46);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = cl.c; ctx.font = '800 54px Inter, sans-serif';
    ctx.fillText(cl.label + (m.cls === 'brilliant' ? ' move!!' : m.cls === 'great' ? ' move!' : m.cls === 'best' ? ' move' : ''), 176, 204);
    ctx.fillStyle = '#0f1b2d'; ctx.font = '600 30px Inter, sans-serif';
    ctx.fillText(fit(ctx, `${moveLabel(R.ply, m)}  ·  ${m.color === 'w' ? G.meta.white : G.meta.black}`, W - 240), 176, 252);
  } else { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#0f1b2d'; ctx.font = '800 54px Inter, sans-serif'; ctx.fillText(R.ply ? 'Game moment' : 'Starting position', 60, 225); }
  const bs = 840, bx = (W - bs) / 2, by = 300, o = {flip: R.flipped};
  if (m) { o.hl = [m.from, m.to]; o.hlColor = cl ? cl.c : '#facc15'; if (cl) o.badge = {sq: m.to, cls: m.cls}; const pb = G.positions[R.ply - 1].best; if (cl && (BAD.has(m.cls) || m.cls === 'good') && pb && pb !== m.uci) o.arrow = pb; }
  ctx.save(); ctx.shadowColor = 'rgba(16,24,40,.22)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12; ctx.fillStyle = '#fff'; rr(ctx, bx, by, bs, bs, 16); ctx.fill(); ctx.restore();
  drawBoardCanvas(ctx, bx, by, bs, G.positions[R.ply].fen, imgs, o);
  const p = G.positions[R.ply], ev = p.score ? fmtScore(p.score, p.turn) : '';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#53627a'; ctx.font = '600 25px Inter, sans-serif';
  let info = ev ? `Eval ${ev}` : ''; if (m && o.arrow && m.bestSan) info += `   ·   Better was ${m.bestSan}`; if (m && m.cls === 'brilliant') info += '   ·   A sound sacrifice';
  ctx.fillText(info, 60, by + bs + 32);
  cardPlayers(ctx, W, H - 160);
  return c;
}
async function makeSummaryCard(){
  const W = 1080, H = 1350, {c, ctx} = cardBase(W, H), G = R.G, M = G.meta;
  await cardLogo(ctx, W, M.date || '');
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#0f1b2d'; ctx.font = '800 60px Inter, sans-serif'; ctx.fillText('Game Review', 60, 220);
  ctx.fillStyle = '#53627a'; ctx.font = '600 26px Inter, sans-serif'; ctx.fillText(fit(ctx, `${M.result}  ·  ${M.opening || Math.ceil(G.moves.length / 2) + ' moves'}`, W - 120), 60, 272);
  const ring = (cx, col) => {
    const cy = 440, Rr = 100, a = accuracy(G, col), nm = col === 'w' ? M.white : M.black, elo = col === 'w' ? M.wElo : M.bElo;
    ctx.lineWidth = 18; ctx.strokeStyle = '#e3e8f0'; ctx.beginPath(); ctx.arc(cx, cy, Rr, 0, 7); ctx.stroke();
    ctx.strokeStyle = '#2563eb'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, Rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ((a || 0) / 100)); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#0f1b2d'; ctx.font = '800 50px Inter, sans-serif'; ctx.fillText(a == null ? '—' : a.toFixed(1), cx, cy - 4);
    ctx.fillStyle = '#8a97ab'; ctx.font = '700 16px Inter, sans-serif'; ctx.fillText('ACCURACY', cx, cy + 38);
    ctx.fillStyle = '#0f1b2d'; ctx.font = '700 28px Inter, sans-serif'; ctx.fillText(fit(ctx, nm + (elo ? ` (${elo})` : ''), 420), cx, cy + Rr + 46);
    const est = estRating(a, elo); ctx.fillStyle = '#53627a'; ctx.font = '600 21px Inter, sans-serif'; ctx.fillText(est ? `Game rating ≈ ${est}` : '', cx, cy + Rr + 80);
  };
  ring(W * .27, 'w'); ring(W * .73, 'b');
  let y = 720;
  ctx.save(); ctx.shadowColor = 'rgba(16,24,40,.08)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4; ctx.fillStyle = '#fff'; rr(ctx, 60, y - 34, W - 120, ORDER.length * 42 + 36, 20); ctx.fill(); ctx.restore();
  for (const k of ORDER) {
    const a = countOf(G, 'w', k), b = countOf(G, 'b', k), cc = CLS[k];
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.font = '800 29px Inter, sans-serif';
    ctx.fillStyle = a ? cc.c : '#cfd8e6'; ctx.fillText(a, 210, y); ctx.fillStyle = b ? cc.c : '#cfd8e6'; ctx.fillText(b, W - 210, y);
    drawClsIcon(ctx, k, W / 2 - 110, y, 16);
    ctx.fillStyle = a + b ? '#0f1b2d' : '#8a97ab'; ctx.font = '600 25px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(cc.label, W / 2 - 80, y + 1);
    y += 42;
  }
  const gy = y + 26, gh = H - gy - 60;
  ctx.save(); rr(ctx, 60, gy, W - 120, gh, 18); ctx.clip(); paintGraph(ctx, 60, gy, W - 120, gh, G, null, {bg: '#334155', dot: 9, lw: 2}); ctx.restore();
  return c;
}

async function openShare(kind){
  if (kind === 'summary' && !R.G.done) { toast('Wait for the review to finish first.'); return; }
  $('#mbox').innerHTML = '<div class="row"><div class="spin"></div> Rendering your card…</div>'; $('#modal').classList.remove('hidden');
  const canvas = kind === 'summary' ? await makeSummaryCard() : await makeMomentCard();
  const url = canvas.toDataURL('image/png'), m = R.ply > 0 ? R.G.moves[R.ply - 1] : null;
  const title = kind === 'summary' ? `${R.G.meta.white} vs ${R.G.meta.black}` : (m && m.cls ? `${CLS[m.cls].label} ${m.san}` : 'Game moment');
  $('#mbox').innerHTML = `<h3>${kind === 'summary' ? 'Game summary card' : 'Share this move'}<button class="btn sm x" data-m="close">${icon('x', 'sm')}</button></h3>
    <img class="prev" src="${url}" alt="Share card preview">
    <div class="acts"><button class="btn pri" data-m="dl">${icon('download', 'sm')}Download PNG</button><button class="btn" data-m="copy">${icon('copy', 'sm')}Copy image</button><button class="btn" data-m="save">${icon('bookmark', 'sm')}Save to gallery</button></div>`;
  $('#mbox').onclick = async e => {
    const a = e.target.closest('[data-m]'); if (!a) return;
    if (a.dataset.m === 'close') closeModal();
    if (a.dataset.m === 'dl') download(url, title);
    if (a.dataset.m === 'copy') { try { const blob = await new Promise(r => canvas.toBlob(r)); await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]); toast('Copied to clipboard ✓'); } catch(err) { toast('Copying is not supported here — use Download.'); } }
    if (a.dataset.m === 'save') { saveToGallery(canvas, title); a.disabled = true; a.textContent = 'Saved'; }
  };
}
function download(url, title){ const a = document.createElement('a'); a.href = url; a.download = 'brillmove-' + title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '') + (url.startsWith('data:image/jpeg') ? '.jpg' : '.png'); a.click(); }
function saveToGallery(canvas, title){
  const t = document.createElement('canvas'); t.width = 540; t.height = 675; t.getContext('2d').drawImage(canvas, 0, 0, 540, 675);
  const items = store.get('gl2_saved', []); items.unshift({id: Date.now(), img: t.toDataURL('image/jpeg', .86), title});
  while (items.length && !store.set('gl2_saved', items)) items.pop();
  updateSaved(); toast('Saved to your gallery');
}
function updateSaved(){ const n = store.get('gl2_saved', []).length, el = $('#saved-n'); el.textContent = n; el.classList.toggle('hidden', !n); }
function openGallery(){
  const items = store.get('gl2_saved', []);
  $('#mbox').innerHTML = `<h3>Saved moments<button class="btn sm x" data-m="close">${icon('x', 'sm')}</button></h3>` + (items.length
    ? `<div class="gal">${items.map(it => `<div class="it" data-id="${it.id}" title="${esc(it.title)}"><img src="${it.img}" alt="${esc(it.title)}"><button class="del" data-del="${it.id}" title="Delete">✕</button></div>`).join('')}</div>`
    : '<p class="muted">Nothing saved yet. During a review, press “Share this move” and then “Save to gallery”.</p>');
  $('#modal').classList.remove('hidden');
  $('#mbox').onclick = e => {
    if (e.target.closest('[data-m=close]')) return closeModal();
    const d = e.target.closest('[data-del]');
    if (d) { store.set('gl2_saved', store.get('gl2_saved', []).filter(x => String(x.id) !== d.dataset.del)); updateSaved(); openGallery(); return; }
    const it = e.target.closest('.it'); if (!it) return;
    const x = items.find(v => String(v.id) === it.dataset.id);
    $('#mbox').innerHTML = `<h3>${esc(x.title)}<button class="btn sm x" data-m="back">${icon('back', 'sm')}Back</button></h3><img class="prev" src="${x.img}" alt=""><div class="acts"><button class="btn pri" data-m="dl">${icon('download', 'sm')}Download</button></div>`;
    $('#mbox').onclick = ev => { const a = ev.target.closest('[data-m]'); if (!a) return; if (a.dataset.m === 'back') openGallery(); if (a.dataset.m === 'dl') download(x.img, x.title); };
  };
}
function closeModal(){ $('#modal').classList.add('hidden'); }

/* ============================================================
   Settings
   ============================================================ */
function applyBoard(){ const [, l, d] = BOARDS[settings.board] || BOARDS.ocean; document.documentElement.style.setProperty('--sq-l', l); document.documentElement.style.setProperty('--sq-d', d); }
function openSettings(){
  const bOpt = Object.entries(BOARDS).map(([k, [n, l, d]]) => `<div class="opt ${settings.board === k ? 'on' : ''}" data-k="board" data-v="${k}"><div class="sw"><i style="background:${l}"></i><i style="background:${d}"></i></div>${n}</div>`).join('');
  const pOpt = Object.entries(PIECESETS).map(([k, n]) => { const f = k === 'neon' ? 'cburnett' : k; return `<div class="opt ${settings.pieces === k ? 'on' : ''}" data-k="pieces" data-v="${k}"><div class="pp" style="${k === 'neon' ? 'background:#1b1630' : ''}"><img src="pieces/${f}/wN.svg" alt=""><img src="pieces/${f}/bQ.svg" alt=""></div>${n}</div>`; }).join('');
  const tg = (k, l, sub) => `<label class="tgl"><span>${l}<br><small class="dim">${sub}</small></span><input type="checkbox" data-t="${k}" ${settings[k] ? 'checked' : ''}></label>`;
  $('#mbox').innerHTML = `<h3>Settings<button class="btn sm x" data-m="close">${icon('x', 'sm')}</button></h3>
    <div class="set-g"><b>Board</b><div class="opts">${bOpt}</div></div>
    <div class="set-g"><b>Pieces</b><div class="opts">${pOpt}</div></div>
    <div class="set-g"><b>Engine strength</b><select class="in" id="s-depth" style="width:100%"><option value="12">Fast — depth 12</option><option value="16">Balanced — depth 16 (recommended)</option><option value="20">Deep — depth 20 (slower)</option></select></div>
    <div class="set-g"><b>Autoplay speed</b><select class="in" id="s-speed" style="width:100%"><option value="700">Fast</option><option value="1100">Normal</option><option value="1800">Slow</option></select></div>
    <div class="set-g"><b>Your coach</b><div class="opts coaches">${Object.entries(COACHES).map(([k, c]) => `<div class="opt ${settings.coach === k ? 'on' : ''}" data-k="coach" data-v="${k}"><div class="cav" style="width:46px;height:46px;margin:2px auto 6px;background:${c.bg};font-size:16px">${c.emoji}</div>${esc(c.name)}<div class="dim" style="font-weight:500;font-size:11px;margin-top:2px">${esc(c.tag)}</div></div>`).join('')}</div></div>
    <div class="set-g"><b>Hype &amp; effects</b>${tg('voice', 'Coach voice', 'Your coach reads each move comment out loud')}${tg('hype', 'Hype voice', 'Shouts for brilliant moves and rook sacrifices')}${tg('bigfx', 'Full-screen effects', 'Giant animation for brilliants and rook sacs')}</div>
    <div class="set-g"><b>Your own sound clips</b><div class="dim" style="font-size:12.5px;margin-bottom:6px">Upload any audio clip you have the rights to use (MP3, WAV, M4A, max 3 MB). It replaces the built-in sound and stays only in this browser.</div>${Object.entries(Clips.SLOTS).map(([k, l]) => `<div class="tgl" style="cursor:default"><span>${l}<br><small class="dim">${Clips.names[k] ? esc(Clips.names[k]) : 'Built-in sound'}</small></span><span class="row">${Clips.urls[k] ? `<button class="btn sm" data-clip-test="${k}">${icon('play', 'sm')}</button><button class="btn sm" data-clip-del="${k}">Remove</button>` : ''}<label class="btn sm">Upload<input type="file" accept="audio/*" data-clip="${k}" hidden></label></span></div>`).join('')}<div class="row" style="margin-top:10px"><button class="btn sm" data-preview="brilliant">Preview brilliant</button><button class="btn sm" data-preview="rooksac">Preview rook sac</button></div></div>
    <div class="set-g">${tg('sound', 'Sounds', 'Move, capture and brilliant-move sounds')}${tg('anim', 'Animations', 'Sliding pieces and confetti')}${tg('coords', 'Coordinates', 'Show a–h and 1–8 on the board')}</div>`;
  $('#s-depth').value = settings.depth; $('#s-speed').value = settings.speed;
  $('#modal').classList.remove('hidden');
  $('#mbox').onclick = e => {
    if (e.target.closest('[data-m=close]')) return closeModal();
    const ct = e.target.closest('[data-clip-test]'); if (ct) { Clips.play(ct.dataset.clipTest); return; }
    const cd = e.target.closest('[data-clip-del]'); if (cd) { Clips.del(cd.dataset.clipDel).then(openSettings); return; }
    const pv = e.target.closest('[data-preview]'); if (pv) { closeModal(); Hype.onMove({cls: pv.dataset.preview === 'brilliant' ? 'brilliant' : 'best', rookSac: pv.dataset.preview === 'rooksac', san: pv.dataset.preview === 'brilliant' ? 'Qb8+' : 'Rxh7+', color: 'w'}, {meta: {white: 'Preview', black: ''}}, 31); return; }
    const o = e.target.closest('.opt'); if (!o) return;
    settings[o.dataset.k] = o.dataset.v; saveSettings(); applyBoard(); refreshBoards(); openSettings();
    if (o.dataset.k === 'coach') { const c = coach(); Speech.say(c.start[0], c.voice); }
  };
  $('#mbox').onchange = e => {
    if (e.target.dataset.t) { settings[e.target.dataset.t] = e.target.checked; saveSettings(); refreshBoards(); updateSoundBtn(); }
    if (e.target.id === 's-depth') { settings.depth = +e.target.value; saveSettings(); toast('New reviews will use depth ' + settings.depth); }
    if (e.target.id === 's-speed') { settings.speed = +e.target.value; saveSettings(); }
    if (e.target.dataset.clip) { const f = e.target.files[0]; if (!f) return; if (f.size > 3e6) { toast('That clip is over 3 MB — try a shorter one.'); return; } Clips.save(e.target.dataset.clip, f).then(() => { toast('Clip saved ✓'); Clips.play(e.target.dataset.clip); openSettings(); }).catch(() => toast('Could not save that clip in this browser.')); }
  };
}
function refreshBoards(){ if (R.G && !$('#v-review').classList.contains('hidden')) renderCoach(); if (board) board.applySettings(); if (demo.b) demo.b.applySettings(); if (R.G) renderPlayers(); if (huntRes) renderHunt(); }
function updateSoundBtn(){ $('#b-sound').innerHTML = icon(settings.sound ? 'vol' : 'mute'); }

/* ============================================================
   Home demo board (Morphy's Opera Game)
   ============================================================ */
const DEMO = 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#'.split(' ');
const DEMO_CLS = {18: 'great', 24: 'great', 30: 'brilliant', 32: 'best'};
const demo = {b: null, i: 0, ch: null, t: 0};
function demoStep(){
  clearTimeout(demo.t);
  if ($('#v-home').classList.contains('hidden')) { demo.t = setTimeout(demoStep, 1500); return; }
  if (!demo.ch || demo.i >= DEMO.length) { demo.ch = new Chess(); demo.i = 0; demo.b.set({fen: demo.ch.fen()}); setDemoTag(null); demo.t = setTimeout(demoStep, 900); return; }
  const m = demo.ch.move(DEMO[demo.i]), cls = DEMO_CLS[demo.i] || null;
  demo.b.set({fen: demo.ch.fen(), last: m, hl: cls ? CLS[cls].c : '#ffd84d', badge: cls ? {sq: m.to, cls} : null, check: kingInCheck(demo.ch.fen())}, moveAnim(m));
  setDemoTag(cls ? {cls, label: `${Math.floor(demo.i / 2) + 1}${m.color === 'w' ? '.' : '...'} ${m.san}`} : null);
  demo.i++;
  demo.t = setTimeout(demoStep, cls === 'brilliant' ? 2600 : demo.i >= DEMO.length ? 3200 : 820);
}
function setDemoTag(x){
  if (!x) { $('#demo-ic').innerHTML = `<img src="${pieceUrl('w', 'n')}" style="width:30px">`; $('#demo-t').textContent = 'Morphy vs. Duke & Count, 1858'; $('#demo-s').textContent = 'Watch a classic get reviewed'; return; }
  $('#demo-ic').innerHTML = clsIcon(x.cls, 30); $('#demo-t').innerHTML = `${esc(x.label)} <span style="color:${CLS[x.cls].c}">${CLS[x.cls].label}${x.cls === 'brilliant' ? '!!' : ''}</span>`; $('#demo-s').textContent = x.cls === 'brilliant' ? 'Queen sacrifice, mate next move' : 'Morphy vs. Duke & Count, 1858';
}

/* ============================================================
   Views + events
   ============================================================ */
function show(v){
  for (const id of ['home', 'player', 'review', 'play']) $('#v-' + id).classList.toggle('hidden', id !== v);
  if (v !== 'review') { stopPlay(); live.stop(); }
  $$('#nav button').forEach(b => b.classList.toggle('on', (v === 'player' && b.dataset.nav === S.ptab) || (v === 'play' && b.dataset.nav === 'play')));
}
function showPlayer(tab){
  S.ptab = tab; show('player');
  $$('#ptabs .tab').forEach(b => b.classList.toggle('on', b.dataset.pt === tab));
  for (const t of ['games', 'insights', 'hunt', 'coach']) $('#pt-' + t).classList.toggle('hidden', t !== tab);
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.nav === tab));
  if (tab === 'insights') renderInsights();
  if (tab === 'hunt') renderHunt();
  if (tab === 'coach') renderCoachTab();
}
function renderRecent(){
  const rec = store.get('gl2_recent', []);
  $('#recent').innerHTML = rec.length ? '<span class="dim" style="font-size:13px">Recent:</span>' + rec.map(r => `<span class="pill" data-u="${esc(r.u)}">${r.a ? `<img src="${esc(r.a)}" style="width:16px;height:16px;border-radius:5px" alt="">` : ''}${esc(r.n || r.u)}</span>`).join('') : '';
}
function startPgn(){
  const p = $('#i-pgn').value.trim(); if (!p) return;
  try { openReview(buildGame(p)); } catch(e) { toast(e.message); }
}

$('#legend').innerHTML = ORDER.map(k => `<span class="pill" style="color:var(--text)">${clsIcon(k, 18)}${CLS[k].label}</span>`).join('');
$('#fi-bril').innerHTML = clsIcon('brilliant', 30); $('#hunt-ic').innerHTML = clsIcon('brilliant', 18); $('#hunt-big').innerHTML = clsIcon('brilliant', 34);
$('#f-user').onsubmit = e => { e.preventDefault(); Sound.init && settings.sound && Sound.init(); loadUser($('#i-user').value); };
$('#recent').onclick = e => { const p = e.target.closest('[data-u]'); if (p) { $('#i-user').value = p.dataset.u; loadUser(p.dataset.u); } };
$('#t-pgn').onclick = () => $('#pgn-box').classList.toggle('hidden');
$('#b-pgn').onclick = startPgn;
$('#go-home').onclick = () => { show('home'); };
$('#nav').onclick = e => { const b = e.target.closest('[data-nav]'); if (!b) return; if (b.dataset.nav === 'play') return openPlay(); if (S.user) return showPlayer(b.dataset.nav); const L = linkedAcc(); if (L) loadUser(L.u).then(() => showPlayer(b.dataset.nav)); else { show('home'); $('#i-user').focus(); toast('Enter your Chess.com username first'); } };
$('#ptabs').onclick = e => { const b = e.target.closest('[data-pt]'); if (b) showPlayer(b.dataset.pt); };
$('#month').onchange = e => loadMonth(+e.target.value);
$('#tc-chips').onclick = e => { const c = e.target.closest('[data-tc]'); if (c) { S.tc = c.dataset.tc; renderGames(); } };
$('#res-chips').onclick = e => { const c = e.target.closest('[data-res]'); if (c) { S.res = c.dataset.res; renderGames(); } };
$('#q-opp').oninput = e => { S.q = e.target.value.trim().toLowerCase(); renderGames(); };
$('#per-chips').onclick = e => { const c = e.target.closest('[data-per]'); if (c) { S.period = +c.dataset.per; renderInsights(); } };
$('#glist').onclick = e => { const c = e.target.closest('.gc'); if (!c) return; const g = S.games.find(x => x.url === c.dataset.url); if (g) openApiGame(g); };
$('#b-hunt').onclick = runHunt;
$('#b-back').onclick = () => { R.gen++; if (engine && R.analyzing) engine.stop(); R.analyzing = false; if (R.retry) exitRetry(); if (R.explore) exitExplore(true); if (S.user) showPlayer(S.ptab || 'games'); else show('home'); if (S.user && S.ptab === 'games') renderGames(); };
$$('.sidetabs .tab').forEach(b => b.onclick = () => setTab(b.dataset.st));
$('#b-cta').onclick = () => { window.scrollTo({top: 0, behavior: 'smooth'}); setTimeout(() => $('#i-user').focus(), 300); };
$('#rep-imp').onclick = e => { const m = e.target.closest('[data-ply]'); if (m) { setTab('moves'); go(+m.dataset.ply); if (innerWidth < 1000) window.scrollTo({top: 0, behavior: 'smooth'}); } };
$('#b-start').onclick = () => { setTab('moves'); if (R.ply === 0) go(1); };
$('#c-first').onclick = () => { stopPlay(); go(0); };
$('#c-prev').onclick = () => { stopPlay(); R.explore ? undoExplore() : go(R.ply - 1); };
$('#c-next').onclick = () => { stopPlay(); go(R.ply + 1); };
$('#c-last').onclick = () => { stopPlay(); go(R.G.positions.length - 1); };
$('#c-play').onclick = togglePlay;
$('#c-key').onclick = nextKey;
$('#c-flip').onclick = () => { R.flipped = !R.flipped; renderBoard(); renderPlayers(); renderEval(); };
$('#c-hint').onclick = () => { R.hint = !R.hint; $('#c-hint').classList.toggle('on', R.hint); renderBoard(); };
$('#b-showbest').onclick = playBestLine;
$('#b-share').onclick = () => openShare('moment');
$('#b-sumcard').onclick = () => openShare('summary');
$('#b-retry1').onclick = startRetry; $('#b-retry2').onclick = startRetry;
$('#b-pgnc').onclick = async () => { try { await navigator.clipboard.writeText(R.G.pgn); toast('PGN copied'); } catch(e) { toast('Copy failed'); } };
$('#mvs').onclick = e => { const m = e.target.closest('[data-ply]'); if (m) { stopPlay(); if (R.retry) exitRetry(); go(+m.dataset.ply); } };
$('#rep-keys').onclick = e => { const m = e.target.closest('[data-ply]'); if (m) { setTab('moves'); go(+m.dataset.ply); if (innerWidth < 980) window.scrollTo({top: 0, behavior: 'smooth'}); } };
for (const id of ['#graph', '#graph2']) {
  $(id).onclick = e => { stopPlay(); if (R.retry) return; go(graphPly(e)); };
  $(id).onmousemove = e => { const p = graphPly(e), m = R.G.moves[p - 1]; e.target.title = m ? `${moveLabel(p, m)}${m.cls ? ' — ' + CLS[m.cls].label : ''}` : 'Start'; };
}
$('#explore-card').onclick = e => { const b = e.target.closest('[data-x]'); if (!b) return; if (b.dataset.x === 'undo') undoExplore(); else exitExplore(); };
$('#retry-card').onclick = e => {
  const a = e.target.closest('[data-r]'); if (!a) return; const Q = R.retry;
  if (a.dataset.r === 'exit') exitRetry();
  if (a.dataset.r === 'hint') { const b = R.G.positions[Q.list[Q.k]].best; board.sel = b.slice(0, 2); board.renderFx(); toast('Hint: move the highlighted piece'); }
  if (a.dataset.r === 'show') { Q.state = 'shown'; Q.reveal = true; Q.fen = null; Q.last = null; renderBoard(); renderRetry(); }
  if (a.dataset.r === 'next') { Q.k++; setRetry(); }
};
$('#b-settings').onclick = openSettings;
$('#b-gallery').onclick = openGallery;
$('#b-sound').onclick = () => { settings.sound = !settings.sound; saveSettings(); updateSoundBtn(); if (settings.sound) Sound.play('move'); };
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!$('#modal').classList.contains('hidden')) return closeModal(); if (R.explore) return exitExplore(); if (R.retry) return exitRetry(); }
  if ($('#v-review').classList.contains('hidden') || !$('#modal').classList.contains('hidden') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  const k = e.key;
  if (k === 'ArrowLeft') { e.preventDefault(); stopPlay(); R.explore ? undoExplore() : go(R.ply - 1); }
  else if (k === 'ArrowRight') { e.preventDefault(); stopPlay(); if (!R.explore) go(R.ply + 1); }
  else if (k === 'Home') { stopPlay(); go(0); }
  else if (k === 'End') { stopPlay(); go(R.G.positions.length - 1); }
  else if (k === ' ') { e.preventDefault(); togglePlay(); }
  else if (k === 'f' || k === 'F') $('#c-flip').click();
  else if (k === 'k' || k === 'K') nextKey();
  else if (k === 'h' || k === 'H') $('#c-hint').click();
});
window.addEventListener('resize', () => { if (R.G && !$('#v-review').classList.contains('hidden')) drawGraph(R.tab === 'report' ? '#graph' : '#graph2'); });
window.addEventListener('hashchange', () => { const m = location.hash.match(/u=([^&]+)/); if (m && decodeURIComponent(m[1]).toLowerCase() !== S.user) { $('#i-user').value = decodeURIComponent(m[1]); loadUser(decodeURIComponent(m[1])); } });

/* ---------------- boot ---------------- */
applyBoard(); updateSaved(); updateSoundBtn(); $('#c-play').innerHTML = icon('play'); renderRecent(); Clips.load();
$('#b-coach').onclick = openSettings;
$('#b-speak').onclick = () => { const v = settings.voice; settings.voice = true; speakCoach(); settings.voice = v; };
demo.b = new Board($('#demo-board'), {coords: false}); demoStep();
(() => {
  const m = location.hash.match(/u=([^&]+)/);
  if (m) { const u = decodeURIComponent(m[1]); $('#i-user').value = u; loadUser(u); }
  else { const r = store.get('gl2_recent', []); if (r[0]) $('#i-user').value = r[0].u; }
})();
