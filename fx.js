'use strict';
/* ============================================================
   Coaches, hype voice, custom sound clips, full-screen effects.
   Loaded before app.js; everything here is only called later.
   ============================================================ */

/* ---------------- coaches (original characters) ---------------- */
const COACHES = {
  pawnsworth: {name: 'Professor Pawnsworth', emoji: '🦉', bg: 'linear-gradient(135deg,#7c4dff,#4c2bd1)', tag: 'Patient and wise. Loves a good plan.', voice: {pitch: .9, rate: .95},
    start: ['Ah, a fresh game. Let us see what you were thinking.', 'Take a seat. We shall study this one together.'],
    brilliant: ['Magnificent! A sacrifice worthy of the history books.', 'Remarkable. Few players would even consider {san}.'],
    great: ['Precisely the only move. Well calculated.', 'Excellent nerves. Everything else was worse.'],
    best: ['Textbook play.', 'Exactly what the masters would do.', 'Quite correct.'],
    excellent: ['A fine, principled move.', 'Very good. Very close to perfect.'],
    good: ['Reasonable, though there was a sharper path.', 'Solid, if a little modest.'],
    book: ['A well-known path. Theory approves.', 'Straight out of the opening books.'],
    inaccuracy: ['Hmm, a small slip. Let us look closer.', 'Not quite the most accurate.'],
    mistake: ['Ah. This is where things began to drift.', 'A teachable moment, I think.'],
    miss: ['Your opponent left the door open. We walked past it.', 'There was a gift on the board here.'],
    blunder: ['Oh dear. Let us not dwell — but let us learn.', 'A painful one. Every master has played moves like this.'],
    forced: ['No choice here at all.'], rooksac: ['And the rook is offered! How bold.']},
  betty: {name: 'Blitz Betty', emoji: '⚡', bg: 'linear-gradient(135deg,#ff3d81,#ff8a00)', tag: 'Hype! Speed! Total chaos!', voice: {pitch: 1.3, rate: 1.15},
    start: ["LET'S GOOO! Show me the madness!", "Buckle up, we're reviewing at full speed!"],
    brilliant: ['NO WAY!! {san}?! THAT IS INSANE!', "BRILLIANT!! I'm literally screaming right now!"],
    great: ['CLUTCH! The ONLY move and you found it!', 'Ice cold. Absolutely ice cold.'],
    best: ['Clean! Love it!', 'Yes yes YES!', 'Engine move, baby!'],
    excellent: ['Super nice!', 'Ooh, smooth!'],
    good: ["Fine, fine — but there was spicier stuff!", "Cool cool. Could've been cooler."],
    book: ['Opening prep! We love to see it.', 'Theory, theory, theory!'],
    inaccuracy: ['Eh, little wobble!', 'Hmm, not your crispiest move.'],
    mistake: ['Oof! That one stings!', 'Uh oh. Uh oh uh oh.'],
    miss: ['THEY BLUNDERED AND YOU MISSED IT?!', 'Free stuff was RIGHT THERE!'],
    blunder: ['NOOOOO! What happened?!', 'Chat, he did NOT just play that.'],
    forced: ['Only move — just send it!'], rooksac: ['HE SACRIFICES THE ROOOOOK!']},
  grizz: {name: 'Coach Grizz', emoji: '🐻', bg: 'linear-gradient(135deg,#a16207,#5b3a06)', tag: 'Tough love. No excuses.', voice: {pitch: .7, rate: .95},
    start: ["Alright. Let's see if you were paying attention.", 'Game tape time. No excuses.'],
    brilliant: ["Now THAT'S what I'm talking about. Brilliant.", "Big move. I'm almost proud."],
    great: ['Good. That was the only move. You found it.', "Pressure? Didn't bother you. Good."],
    best: ['Correct.', "That's the move. Keep it up.", 'Fine. Best move.'],
    excellent: ['Good work.', 'Solid. Next.'],
    good: ["It's okay. Not great.", 'You can do better. You know it.'],
    book: ['Opening move. You studied. Good.', 'Standard stuff.'],
    inaccuracy: ['Sloppy.', 'Tighten that up.'],
    mistake: ['No. Look at the board.', "That's a mistake. Again."],
    miss: ['They handed it to you. You dropped it.', 'Punish that. Every time.'],
    blunder: ['Unacceptable. Twenty push-ups.', "What was that? Seriously, what was that?"],
    forced: ['No choice. Move on.'], rooksac: ['Gave up the rook. Gutsy.']},
  robo: {name: 'R0-B0 Rook', emoji: '🤖', bg: 'linear-gradient(135deg,#00b8d4,#0e7490)', tag: 'Calculates everything. Feels nothing.', voice: {pitch: .4, rate: 1.05},
    start: ['Booting review protocol. Beep.', 'Loading game data. Emotions: disabled.'],
    brilliant: ['ERROR: BRILLIANCE OVERLOAD. {san} DETECTED.', 'Sacrifice calculated. Approval: 100 percent.'],
    great: ['Only-move located. Human performance: optimal.', 'Probability of finding this: low. You found it.'],
    best: ['Move matches engine output.', 'Optimal. Beep boop.', 'Correct. Proceeding.'],
    excellent: ['Deviation from optimal: minimal.', 'Acceptable efficiency.'],
    good: ['Sub-optimal. Minor inefficiency logged.', 'Adequate.'],
    book: ['Move found in opening database.', 'Theory confirmed.'],
    inaccuracy: ['Inaccuracy detected.', 'Small error logged.'],
    mistake: ['Mistake detected. Evaluation dropping.', 'Warning: advantage leaking.'],
    miss: ['Opponent error not exploited. Recalibrate.', 'Free material ignored. Illogical.'],
    blunder: ['CRITICAL ERROR. CRITICAL ERROR.', 'Blunder registered. Does not compute.'],
    forced: ['Single legal move executed.'], rooksac: ['Rook offered. Material: negative. Initiative: positive.']},
  captain: {name: 'Captain Checkmate', emoji: '🏴‍☠️', bg: 'linear-gradient(135deg,#16a34a,#065f46)', tag: 'Arr! Plunder their pieces!', voice: {pitch: .85, rate: 1},
    start: ["Ahoy! Let's see how ye sailed this one.", 'Hoist the sails, matey — review time!'],
    brilliant: ['Shiver me timbers! A legendary sacrifice!', 'Arr! {san} be worthy of a treasure chest!'],
    great: ['Ye found the only safe passage!', 'Steady hand on the wheel, matey!'],
    best: ['Arr, fine sailing!', 'Aye, that be the move!'],
    excellent: ['Smooth waters, matey!', 'Aye, very nice.'],
    good: ['Not bad, but there be richer treasure.', 'A decent catch.'],
    book: ['Sailin\' the charted waters.', 'By the old map!'],
    inaccuracy: ['Bit off course there.', 'Watch yer heading!'],
    mistake: ['Ye ran aground, matey!', 'Leak in the hull!'],
    miss: ['Treasure on the deck and ye left it!', 'They dropped their gold and ye sailed past!'],
    blunder: ['Man overboard!', 'Walk the plank for that one!'],
    forced: ['Only one way through these straits.'], rooksac: ['Throwin\' the rook overboard! Bold!']},
  luna: {name: 'Luna the Zen Knight', emoji: '🌙', bg: 'linear-gradient(135deg,#6366f1,#312e81)', tag: 'Breathe. See the whole board.', voice: {pitch: 1.1, rate: .85},
    start: ['Breathe in. Let us walk through this game calmly.', 'Every game is a lesson. Let us listen.'],
    brilliant: ['Beautiful. You let go of material and found harmony.', 'A move of pure vision.'],
    great: ['You stayed calm and found the only path.', 'Focus rewarded.'],
    best: ['Perfect balance.', 'Calm and correct.'],
    excellent: ['Graceful.', 'A peaceful, strong move.'],
    good: ['Good, though a clearer path existed.', 'Gentle — perhaps too gentle.'],
    book: ['Following the well-worn path.', 'The ancient path of theory.'],
    inaccuracy: ['A small ripple in the water.', 'Slightly out of balance.'],
    mistake: ['The mind wandered here.', 'Let us notice this and let it go.'],
    miss: ['An opportunity drifted by.', 'The moment to strike passed quietly.'],
    blunder: ['A storm. It happens to all of us.', 'Do not be harsh with yourself. Learn and breathe.'],
    forced: ['Only one way forward.'], rooksac: ['Releasing the rook... true detachment.']},
};
const coach = () => COACHES[settings.coach] || COACHES.pawnsworth;
function coachLine(kind, seed, san){
  const pool = coach()[kind] || coach().best;
  return pool[Math.abs(seed) % pool.length].replace('{san}', san || '');
}
function coachAvatar(size = 52, badge){
  const c = coach();
  return `<div class="cav" style="width:${size}px;height:${size}px;background:${c.bg};font-size:${size * .52}px" title="${esc(c.name)}">${c.emoji}${badge ? `<span class="cbdg">${clsIcon(badge, Math.round(size * .42))}</span>` : ''}</div>`;
}

/* ---------------- speech ---------------- */
const Speech = {
  ok: 'speechSynthesis' in window,
  voice(){
    if (!this.ok) return null;
    const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    return vs.find(v => /Daniel|Samantha|Google US English|Alex|Karen/i.test(v.name)) || vs[0] || null;
  },
  say(text, o = {}){
    if (!this.ok || !settings.sound) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
      const v = this.voice(); if (v) u.voice = v;
      u.pitch = o.pitch ?? 1; u.rate = o.rate ?? 1; u.volume = o.volume ?? 1;
      speechSynthesis.speak(u);
    } catch(e) {}
  },
  stop(){ if (this.ok) try { speechSynthesis.cancel(); } catch(e) {} },
};

/* ---------------- custom clips (stored only in this browser) ---------------- */
const Clips = {
  db: null, urls: {}, names: {},
  SLOTS: {brilliant: 'Brilliant move', rooksac: 'Rook sacrifice', blunder: 'Blunder'},
  open(){
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('gl-clips', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('clips');
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      } catch(e) { rej(e); }
    });
  },
  async load(){
    try {
      const db = await this.open();
      for (const k of Object.keys(this.SLOTS)) {
        const v = await new Promise(res => { const q = db.transaction('clips').objectStore('clips').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); });
        if (v && v.blob) { this.urls[k] = URL.createObjectURL(v.blob); this.names[k] = v.name; }
      }
    } catch(e) {}
  },
  async save(k, file){
    const db = await this.open();
    await new Promise((res, rej) => { const t = db.transaction('clips', 'readwrite'); t.objectStore('clips').put({blob: file, name: file.name}, k); t.oncomplete = res; t.onerror = () => rej(t.error); });
    if (this.urls[k]) URL.revokeObjectURL(this.urls[k]);
    this.urls[k] = URL.createObjectURL(file); this.names[k] = file.name;
  },
  async del(k){
    const db = await this.open();
    await new Promise(res => { const t = db.transaction('clips', 'readwrite'); t.objectStore('clips').delete(k); t.oncomplete = res; t.onerror = res; });
    if (this.urls[k]) URL.revokeObjectURL(this.urls[k]); delete this.urls[k]; delete this.names[k];
  },
  play(k){
    if (!settings.sound || !this.urls[k]) return false;
    try { const a = new Audio(this.urls[k]); a.volume = 1; a.play().catch(() => {}); return true; } catch(e) { return false; }
  },
};

/* ---------------- full-screen effects ---------------- */
const VFX = {
  el: null, t: 0,
  show(kind, sub){
    if (!settings.anim || !settings.bigfx) return;
    clearTimeout(this.t); if (this.el) this.el.remove();
    const brill = kind === 'brilliant';
    const core = brill ? clsIcon('brilliant', 220) : `<img src="${pieceUrl('w', 'r')}" alt="" style="width:220px;height:220px">`;
    const el = document.createElement('div');
    el.className = 'vfx ' + kind;
    el.innerHTML = `<div class="vfx-flash"></div><div class="vfx-rays"></div><div class="vfx-ring"></div><div class="vfx-ring r2"></div>
      <div class="vfx-core">${core}</div>
      <div class="vfx-text">${brill ? 'BRILLIANT!!' : 'ROOK SACRIFICE!'}</div>
      ${sub ? `<div class="vfx-sub">${esc(sub)}</div>` : ''}`;
    el.onclick = () => this.hide();
    document.body.appendChild(el); this.el = el;
    Confetti.burst(innerWidth / 2, innerHeight / 2, 220, brill ? ['#1bada6', '#5ff2e9', '#ffffff', '#00e5ff', '#b6ff3b'] : ['#ff7a18', '#ffd84d', '#ff3d81', '#ffffff']);
    this.t = setTimeout(() => this.hide(), 2600);
  },
  hide(){ clearTimeout(this.t); const e = this.el; this.el = null; if (!e) return; e.classList.add('out'); setTimeout(() => e.remove(), 350); },
};

/* ---------------- hype: what happens when a special move lands ---------------- */
const Hype = {
  onMove(m, G, ply){
    if (!m) return;
    const who = m.color === 'w' ? G.meta.white : G.meta.black;
    const label = moveLabel(ply, m);
    if (m.cls === 'brilliant') {
      VFX.show('brilliant', `${label} · ${who}`);
      if (!Clips.play('brilliant')) {
        setTimeout(() => Sound.play('brilliant'), 100);
        if (settings.hype) setTimeout(() => Speech.say('Brilliiiiant!', {pitch: 1.5, rate: .75}), 450);
      }
      return true;
    }
    if (m.rookSac) {
      VFX.show('rooksac', `${label} · ${who}`);
      if (!Clips.play('rooksac')) {
        Sound.play('rooksac');
        if (settings.hype) setTimeout(() => Speech.say('And they sacrifice the roooook!', {pitch: .8, rate: .85}), 350);
      }
      return true;
    }
    if (m.cls === 'great') { setTimeout(() => Sound.play('great'), 120); return false; }
    if (m.cls === 'blunder') { if (!Clips.play('blunder')) setTimeout(() => Sound.play('blunder'), 100); return false; }
    return false;
  },
};

/* rook sacrifice: a rook is offered/left where it gets taken, and material really goes down */
function isRookSac(G, i){
  const m = G.moves[i]; if (!m || m.piece !== 'r') return false;
  if (m.captured && VAL[m.captured] >= 5) return false;
  const n = G.moves[i + 1], c0 = new Chess(G.positions[i].fen), m0 = matBal(c0, m.color);
  if (n && n.to === m.to && n.captured === 'r') {
    const after = G.positions[Math.min(i + 3, G.positions.length - 1)];
    return matBal(new Chess(after.fen), m.color) <= m0 - 2;
  }
  const pv = ((G.positions[i + 1].lines || {})[1] || {}).pv || [];
  if (pv[0] && pv[0].slice(2, 4) === m.to) {
    const c = new Chess(G.positions[i + 1].fen);
    for (let k = 0; k < Math.min(2, pv.length); k++) if (!c.move(mvObj(pv[k]))) return false;
    return matBal(c, m.color) <= m0 - 2;
  }
  return false;
}
