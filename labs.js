'use strict';
/* ============================================================
   BrillMove labs (loaded after extras.js):
   - Analysis board with live top-3 Stockfish lines
   - Opening Explorer: your personal opening tree with win rates
   - Guess the Move training (your games or classic games)
   - Classic brilliancies library
   - Mobile menu
   ============================================================ */

/* ---------------- classic games (public-domain historical games) ---------------- */
const CLASSICS = [
  {id: 'opera', t: 'The Opera Game', w: 'Paul Morphy', b: 'Duke Karl / Count Isouard', y: 1858, r: '1-0', side: 'w',
    d: "Morphy's lightning development ends with a queen sacrifice and mate, played during a night at the Paris opera.",
    m: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#'},
  {id: 'immortal', t: 'The Immortal Game', w: 'Adolf Anderssen', b: 'Lionel Kieseritzky', y: 1851, r: '1-0', side: 'w',
    d: 'Anderssen gives up both rooks, a bishop and his queen, then mates with his three remaining minor pieces.',
    m: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#'},
  {id: 'evergreen', t: 'The Evergreen Game', w: 'Adolf Anderssen', b: 'Jean Dufresne', y: 1852, r: '1-0', side: 'w',
    d: 'A rook sacrifice, a queen sacrifice and a beautiful bishop mate. Steinitz called it the evergreen in Anderssen\'s laurel wreath.',
    m: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7#'},
  {id: 'century', t: 'The Game of the Century', w: 'Donald Byrne', b: 'Bobby Fischer', y: 1956, r: '0-1', side: 'b',
    d: '13-year-old Bobby Fischer sacrifices his queen on move 17 and then hunts the white king with his minor pieces.',
    m: '1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2#'},
  {id: 'kasparov', t: "Kasparov's Immortal", w: 'Garry Kasparov', b: 'Veselin Topalov', y: 1999, r: '1-0', side: 'w',
    d: 'Kasparov sacrifices a rook with 24. Rxd4 and chases the black king all the way across the board.',
    m: '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7'},
];
const classicPGN = c => `[Event "${c.t}"]\n[White "${c.w}"]\n[Black "${c.b}"]\n[Date "${c.y}.??.??"]\n[Result "${c.r}"]\n\n${c.m} ${c.r}`;
function classicGame(c){ return buildGame(classicPGN(c), {white: c.w, black: c.b, userColor: c.side}); }
function renderClassics(){
  const el = $('#classics'); if (!el) return;
  el.innerHTML = CLASSICS.map(c => `<div class="classic" data-c="${c.id}"><div class="mini"></div>
    <div class="cl-body"><div class="cl-y">${c.y}</div><h3>${esc(c.t)}</h3><div class="cl-p">${esc(c.w)} vs ${esc(c.b)}</div><p>${esc(c.d)}</p>
    <div class="acts"><button class="btn sm pri" data-ca="review">${icon('play', 'sm')}Review</button><button class="btn sm" data-ca="guess">${icon('target', 'sm')}Guess the moves</button></div></div></div>`).join('');
  for (const c of CLASSICS) {
    const G = classicGame(c), last = G.moves[G.moves.length - 1];
    const b = new Board($(`.classic[data-c="${c.id}"] .mini`), {coords: false, flipped: c.side === 'b'});
    b.set({fen: G.positions[G.positions.length - 1].fen, last, hl: '#facc15', check: kingInCheck(G.positions[G.positions.length - 1].fen)});
  }
  el.onclick = e => {
    const a = e.target.closest('[data-ca]'); if (!a) return;
    const c = CLASSICS.find(x => x.id === a.closest('[data-c]').dataset.c);
    if (a.dataset.ca === 'review') openReview(classicGame(c), {tab: 'report'});
    else { openTrain(); startTrain(classicGame(c), c.side, `${c.t} (${c.y})`); }
  };
}

/* ---------------- analysis board ---------------- */
const AB = {b: null, ch: new Chess(), start: null, hist: [], live: new LiveEngine(3, 22), info: null, flipped: false};
function openBoard(fen){
  show('board'); window.scrollTo(0, 0);
  if (!AB.b) AB.b = new Board($('#ab-board'), {interactive: true,
    canPick: sq => { const p = AB.ch.get(sq); return !!p && p.color === AB.ch.turn() && !AB.ch.game_over(); },
    targets: sq => AB.ch.moves({square: sq, verbose: true}).map(m => m.to),
    onMove: (f, t, dragged) => abPlay({from: f, to: t, promotion: 'q'}, dragged)});
  if (fen) abLoad(fen, true);
  abRender(); abAnalyse();
}
function abPlay(mv, dragged){
  const r = AB.ch.move(mv); if (!r) return;
  AB.hist.push(r); moveSound(r); abRender(dragged ? null : moveAnim(r)); abAnalyse();
}
function abUndo(){ const r = AB.ch.undo(); if (!r) return; AB.hist.pop(); Sound.play('move'); abRender(moveAnim(r, true)); abAnalyse(); }
function abGoto(n){
  const c = new Chess(AB.start || undefined); const keep = AB.hist.slice(0, n);
  for (const m of keep) c.move({from: m.from, to: m.to, promotion: m.promotion});
  AB.ch = c; AB.hist = keep; abRender(); abAnalyse();
}
function abLoad(text, quiet){
  text = (text || '').trim();
  if (!text) { AB.ch = new Chess(); AB.start = null; AB.hist = []; return true; }
  if (/^[1-8pnbrqkPNBRQK/]+ [wb] /.test(text)) {
    const v = new Chess().validate_fen(text); if (!v.valid) { if (!quiet) toast('That FEN is not valid: ' + v.error); return false; }
    AB.ch = new Chess(text); AB.start = text; AB.hist = []; return true;
  }
  try { const G = buildGame(text); AB.start = G.positions[0].fen === new Chess().fen() ? null : G.positions[0].fen; AB.ch = new Chess(AB.start || undefined); AB.hist = [];
    for (const m of G.moves) AB.hist.push(AB.ch.move({from: m.from, to: m.to, promotion: m.promotion})); return true; }
  catch(e) { if (!quiet) toast('Paste a FEN or a PGN.'); return false; }
}
function abAnalyse(){
  const fen = AB.ch.fen(); AB.info = null;
  if (AB.ch.game_over()) { AB.live.stop(); abRenderLines(); abRenderEval(); return; }
  AB.live.start(fen, info => { if (info.fen !== AB.ch.fen()) return; AB.info = info; abRenderLines(); abRenderEval();
    const l = info.lines[1]; AB.b.setArrows(l ? [{from: l.pv[0].slice(0, 2), to: l.pv[0].slice(2, 4), color: '#2563eb', op: .75}] : []); });
  abRenderLines();
}
function abRender(anim){
  const fen = AB.ch.fen(), last = AB.hist[AB.hist.length - 1] || null;
  AB.b.setFlip(AB.flipped);
  AB.b.set({fen, last, hl: '#facc15', check: kingInCheck(fen)}, anim);
  abRenderEval();
  const st = new Chess(AB.start || undefined); let n = +st.fen().split(' ')[5], white = st.turn() === 'w', h = '';
  AB.hist.forEach((m, k) => { if (white) h += `<span class="ab-n">${n}.</span>`; else if (k === 0) h += `<span class="ab-n">${n}...</span>`;
    h += `<span class="ab-m ${k === AB.hist.length - 1 ? 'cur' : ''}" data-k="${k + 1}">${esc(m.san)}</span>`; if (!white) n++; white = !white; });
  $('#ab-moves').innerHTML = h || '<span class="dim">Make a move on the board, or paste a FEN / PGN below.</span>';
  $('#ab-turn').textContent = AB.ch.game_over() ? (AB.ch.in_checkmate() ? 'Checkmate' : 'Draw') : (AB.ch.turn() === 'w' ? 'White to move' : 'Black to move');
  $('#ab-fen').value = fen;
}
function abRenderEval(){
  const f = $('#ab-evf'), t = $('#ab-evt'); let w = 50, txt = '';
  if (AB.ch.in_checkmate()) { w = AB.ch.turn() === 'w' ? 0 : 100; txt = AB.ch.turn() === 'w' ? '0-1' : '1-0'; }
  else if (AB.info && AB.info.lines[1]) { const l = AB.info.lines[1], tn = AB.ch.turn(); w = tn === 'w' ? scoreWin(l) : 100 - scoreWin(l); txt = fmtScore(l, tn).replace(/^\+/, ''); }
  f.style.height = (AB.flipped ? 100 - w : w) + '%'; f.style.top = AB.flipped ? '0' : 'auto'; f.style.bottom = AB.flipped ? 'auto' : '0';
  const wa = w >= 50, atB = wa !== AB.flipped; t.textContent = txt; t.style.top = atB ? 'auto' : '5px'; t.style.bottom = atB ? '5px' : 'auto'; t.style.color = wa ? '#1e293b' : '#fff';
}
function abRenderLines(){
  const el = $('#ab-lines'), fen = AB.ch.fen(), tn = AB.ch.turn();
  if (AB.ch.game_over()) { el.innerHTML = `<div class="muted">${AB.ch.in_checkmate() ? 'Checkmate.' : 'The game is drawn.'}</div>`; $('#ab-depth').textContent = ''; return; }
  if (!AB.info) { el.innerHTML = '<div class="row muted"><div class="spin"></div>Stockfish is thinking…</div>'; return; }
  $('#ab-depth').textContent = 'depth ' + AB.info.depth;
  el.innerHTML = [1, 2, 3].map(k => { const l = AB.info.lines[k]; if (!l) return '';
    const sans = pvToSan(fen, l.pv, 10); let n = +fen.split(' ')[5], white = tn === 'w', s = '';
    sans.forEach((x, j) => { if (white) s += `${n}. `; else if (j === 0) s += `${n}... `; s += (j === 0 ? `<b>${esc(x)}</b>` : esc(x)) + ' '; if (!white) n++; white = !white; });
    return `<div class="ab-line" data-u="${l.pv[0]}"><span class="ab-ev ${(tn === 'w' ? 1 : -1) * (l.type === 'mate' ? (l.v > 0 ? 1 : -1) : l.v) >= 0 ? 'pos' : 'neg'}">${esc(fmtScore(l, tn))}</span><span class="ab-pv">${s}</span></div>`; }).join('');
}
function abToPGN(){
  const c = new Chess(AB.start || undefined); for (const m of AB.hist) c.move({from: m.from, to: m.to, promotion: m.promotion});
  if (AB.start) { c.header('SetUp', '1', 'FEN', AB.start); }
  c.header('White', 'White', 'Black', 'Black', 'Event', 'BrillMove analysis board'); return c.pgn();
}
$('#ab-lines').addEventListener('click', e => { const r = e.target.closest('[data-u]'); if (r) abPlay(mvObj(r.dataset.u)); });
$('#ab-moves').addEventListener('click', e => { const r = e.target.closest('[data-k]'); if (r) abGoto(+r.dataset.k); });
document.addEventListener('click', async e => { if (!e.target.closest('#v-board')) return;
  const b = e.target.closest('[data-ab]'); if (!b) return; const a = b.dataset.ab;
  if (a === 'undo') abUndo();
  if (a === 'reset') { abLoad(''); abRender(); abAnalyse(); }
  if (a === 'flip') { AB.flipped = !AB.flipped; abRender(); }
  if (a === 'load') { if (abLoad($('#ab-in').value)) { $('#ab-in').value = ''; abRender(); abAnalyse(); toast('Position loaded'); } }
  if (a === 'copy') { try { await navigator.clipboard.writeText(AB.ch.fen()); toast('FEN copied'); } catch(err) { prompt('FEN:', AB.ch.fen()); } }
  if (a === 'review') { if (AB.hist.length < 2) { toast('Play at least two moves first.'); return; } try { openReview(buildGame(abToPGN(), {white: 'White', black: 'Black'}), {tab: 'report'}); } catch(err) { toast(err.message); } }
});
document.addEventListener('keydown', e => {
  if ($('#v-board').classList.contains('hidden') || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || !$('#modal').classList.contains('hidden')) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); abUndo(); }
  if (e.key === 'f' || e.key === 'F') { AB.flipped = !AB.flipped; abRender(); }
});
// "Open in analysis board" from a review
(() => { const acts = $('#coach-card .acts'); if (!acts) return;
  acts.insertAdjacentHTML('beforeend', `<button class="btn sm" id="b-to-board">${icon('cpu', 'sm')}Analysis board</button>`);
  $('#b-to-board').onclick = () => openBoard(dispFen()); })();

/* ---------------- opening explorer ---------------- */
const OX = {color: 'w', period: 3, path: [], tree: null, key: '', b: null};
function sansOf(pgn){
  return pgn.replace(/\[[^\]]*\]/g, ' ').replace(/\{[^}]*\}/g, ' ').replace(/\([^)]*\)/g, ' ').replace(/\$\d+/g, ' ')
    .replace(/\d+\.(\.\.)?/g, ' ').replace(/(1-0|0-1|1\/2-1\/2|\*)\s*$/g, ' ').split(/\s+/).filter(x => x && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(x));
}
async function buildTree(){
  const key = `${S.user}|${OX.color}|${OX.period}`; if (OX.key === key && OX.tree) return OX.tree;
  let games = [];
  for (const u of S.archives.slice(0, OX.period)) { try { games = games.concat(await fetchArchive(u)); } catch(e) {} }
  games = games.filter(g => g.rules === 'chess' && meOf(g) === OX.color && !(g.initial_setup && g.initial_setup !== new Chess().fen())).sort((a, b) => b.end_time - a.end_time);
  const root = {n: 0, W: 0, D: 0, L: 0, k: {}, g: []};
  for (const g of games) {
    const r = resOf(g); root.n++; root[r]++;
    let node = root;
    for (const san of sansOf(g.pgn).slice(0, 24)) {
      node = node.k[san] || (node.k[san] = {n: 0, W: 0, D: 0, L: 0, k: {}, g: []});
      node.n++; node[r]++; if (node.g.length < 6) node.g.push(g);
    }
  }
  OX.tree = root; OX.key = key; return root;
}
async function renderOpenings(){
  const el = $('#pt-openings');
  el.innerHTML = `<div class="toolbar"><div class="chips" id="ox-color">${[['w', 'As White'], ['b', 'As Black']].map(([v, l]) => `<button class="chip ${OX.color === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="chips" id="ox-per">${[[1, 'This month'], [3, '3 months'], [6, '6 months'], [12, '12 months']].map(([v, l]) => `<button class="chip ${OX.period === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div></div>
    <div class="ox"><div class="card ox-left"><div id="ox-board"></div><div class="ox-path" id="ox-path"></div></div><div class="ox-right" id="ox-right"><div class="card"><div class="row"><div class="spin"></div>Building your opening tree…</div></div></div></div>`;
  $('#ox-color').onclick = e => { const b = e.target.closest('[data-v]'); if (b) { OX.color = b.dataset.v; OX.path = []; renderOpenings(); } };
  $('#ox-per').onclick = e => { const b = e.target.closest('[data-v]'); if (b) { OX.period = +b.dataset.v; OX.path = []; renderOpenings(); } };
  OX.b = new Board($('#ox-board'), {coords: true, flipped: OX.color === 'b'});
  await buildTree(); drawOX();
}
function drawOX(){
  let node = OX.tree; const c = new Chess(); let last = null;
  for (const s of OX.path) { node = node && node.k[s]; last = c.move(s); }
  OX.b.set({fen: c.fen(), last, hl: '#facc15'});
  const myTurn = c.turn() === OX.color, kids = node ? Object.entries(node.k).sort((a, b) => b[1].n - a[1].n) : [];
  const pct = n => n.n ? Math.round((n.W + n.D / 2) / n.n * 100) : 0;
  const bar = n => `<div class="bar" style="flex:1"><i style="width:${n.W / n.n * 100}%;background:var(--win)"></i><i style="width:${n.D / n.n * 100}%;background:#94a3b8"></i><i style="width:${n.L / n.n * 100}%;background:var(--loss)"></i></div>`;
  let n = 1, white = true, crumbs = `<span class="ox-c ${OX.path.length ? '' : 'on'}" data-p="0">Start</span>`;
  OX.path.forEach((s, k) => { crumbs += `<span class="ox-c ${k === OX.path.length - 1 ? 'on' : ''}" data-p="${k + 1}">${white ? n + '. ' : ''}${esc(s)}</span>`; if (!white) n++; white = !white; });
  $('#ox-path').innerHTML = `<div class="row" style="gap:4px">${crumbs}</div>${OX.path.length ? `<button class="btn sm ghost" id="ox-back">${icon('back', 'sm')}Back</button>` : ''}`;
  const top = kids[0];
  const insight = !node || !node.n ? 'No games reach this position in the selected period.'
    : !kids.length ? `Your games leave the tree here. ${node.n} game${node.n > 1 ? 's' : ''} reached this position.`
    : myTurn ? `Here you usually play <b>${esc(top[0])}</b> (${Math.round(top[1].n / node.n * 100)}% of ${node.n} games) and score <b>${pct(top[1])}%</b> with it.`
    : `Your opponents most often reply <b>${esc(top[0])}</b> (${Math.round(top[1].n / node.n * 100)}%). Your score against it: <b>${pct(top[1])}%</b>.`;
  const worst = kids.filter(([, k]) => k.n >= 3).sort((a, b) => pct(a[1]) - pct(b[1]))[0];
  $('#ox-right').innerHTML = `<div class="card"><h4>${icon('list', 'sm')}${myTurn ? 'Your moves here' : 'Opponent replies'}<span class="sub">${node ? node.n : 0} games · score ${node && node.n ? pct(node) : 0}%</span></h4>
      <div class="say" style="margin-top:0">${insight}${worst && pct(worst[1]) < 40 && !myTurn ? ` Watch out for <b>${esc(worst[0])}</b>: you only score ${pct(worst[1])}% against it.` : ''}</div>
      <div class="ox-tab">${kids.length ? kids.slice(0, 12).map(([s, k]) => `<div class="ox-row" data-s="${esc(s)}"><b class="ox-san">${esc(s)}</b><span class="ox-cnt num">${k.n}</span>${bar(k)}<span class="ox-pct num" style="color:${pct(k) >= 55 ? 'var(--win)' : pct(k) <= 45 ? 'var(--loss)' : 'var(--text)'}">${pct(k)}%</span></div>`).join('') : '<div class="muted" style="font-size:14px">No more moves from your games.</div>'}</div></div>
    ${node && node.g.length && OX.path.length ? `<div class="card"><h4>${icon('clock', 'sm')}Recent games in this line</h4><div class="glist">${node.g.map(g => { const r = resOf(g), o = meOf(g) === 'w' ? g.black : g.white;
      return `<div class="gc" data-url="${esc(g.url)}" style="grid-template-columns:auto minmax(0,1fr) auto"><div class="res ${r}">${r}</div><div style="min-width:0"><div class="who">vs ${esc(o.username)} <span class="muted" style="font-weight:500">(${o.rating})</span></div><div class="sub">${esc(g.time_class)} · ${new Date(g.end_time * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div></div><button class="btn sm">Review</button></div>`; }).join('')}</div></div>` : ''}`;
  $('#ox-path').onclick = e => { const p = e.target.closest('[data-p]'); if (p) { OX.path = OX.path.slice(0, +p.dataset.p); drawOX(); } if (e.target.closest('#ox-back')) { OX.path.pop(); drawOX(); } };
  $('#ox-right').onclick = e => {
    const r = e.target.closest('[data-s]'); if (r) { OX.path.push(r.dataset.s); Sound.play('move'); drawOX(); return; }
    const gcard = e.target.closest('[data-url]'); if (gcard) { const g = node.g.find(x => x.url === gcard.dataset.url); if (g) openApiGame(g, OX.path.length); }
  };
}

/* ---------------- guess the move ---------------- */
const TR = {b: null, G: null, side: 'w', ply: 0, score: 0, max: 0, found: 0, tries: 0, state: 'setup', fb: null, title: '', gen: 0, log: []};
function openTrain(){
  show('train'); window.scrollTo(0, 0);
  if (!TR.b) TR.b = new Board($('#tr-board'), {interactive: true,
    canPick: sq => { if (TR.state !== 'guess') return false; const p = new Chess(TR.G.positions[TR.ply].fen).get(sq); return !!p && p.color === TR.side; },
    targets: sq => new Chess(TR.G.positions[TR.ply].fen).moves({square: sq, verbose: true}).map(m => m.to),
    onMove: (f, t, dragged) => trainGuess(f, t, dragged)});
  if (TR.state === 'setup') renderTrainSetup(); else renderTrain();
}
function renderTrainSetup(){
  TR.state = 'setup';
  TR.b.set({fen: new Chess().fen()});
  $('#tr-top').innerHTML = ''; $('#tr-bot').innerHTML = '';
  const mine = S.user && S.games.length ? S.games.filter(g => g.rules === 'chess').slice(0, 12) : [];
  $('#tr-side').innerHTML = `<div class="card"><div class="coach">${coachAvatar(48)}<div style="flex:1;min-width:0"><div class="cname">${esc(coach().name)}</div><div class="say">“Let's train your vision. Pick a game, and guess every move one side played. You score points for finding the game move, or an equally good one.”</div></div></div></div>
    <div class="card"><h4>${icon('trophy', 'sm')}Classic games</h4><div class="plan">${CLASSICS.map(c => `<div class="pi" data-tc="${c.id}"><div style="flex:1;min-width:0"><b>${esc(c.t)}</b><div class="muted" style="font-size:12.5px">Play as ${esc(c.side === 'w' ? c.w : c.b)} · ${c.y}</div></div><button class="btn sm pri">Start</button></div>`).join('')}</div></div>
    ${mine.length ? `<div class="card"><h4>${icon('user', 'sm')}Your recent games<span class="sub">guess your own moves</span></h4><div class="plan">${mine.map(g => { const c = meOf(g), o = c === 'w' ? g.black : g.white;
      return `<div class="pi" data-tg="${esc(g.url)}"><div class="res ${resOf(g)}" style="width:30px;height:30px;font-size:12px">${resOf(g)}</div><div style="flex:1;min-width:0"><b>vs ${esc(o.username)}</b><div class="muted" style="font-size:12.5px">${esc(g.time_class)} · ${new Date(g.end_time * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div></div><button class="btn sm">Start</button></div>`; }).join('')}</div></div>`
      : `<div class="card"><div class="muted" style="font-size:14px">Want to guess your own moves? Search your Chess.com username first, then come back here.</div></div>`}`;
  $('#tr-side').onclick = e => {
    const c = e.target.closest('[data-tc]'); if (c) { const x = CLASSICS.find(y => y.id === c.dataset.tc); startTrain(classicGame(x), x.side, `${x.t} (${x.y})`); return; }
    const g = e.target.closest('[data-tg]'); if (g) { const x = S.games.find(y => y.url === g.dataset.tg); if (x) { try { startTrain(buildGame(x.pgn, metaFromGame(x)), meOf(x), `Your game vs ${(meOf(x) === 'w' ? x.black : x.white).username}`); } catch(err) { toast(err.message); } } }
  };
}
function startTrain(G, side, title){
  Object.assign(TR, {G, side, ply: 0, score: 0, max: 0, found: 0, state: 'guess', fb: null, title, log: []}); TR.gen++;
  TR.b.setFlip(side === 'b');
  trAdvance(true);
}
async function trAdvance(first){
  const G = TR.G, gen = TR.gen;
  while (TR.ply < G.moves.length && G.moves[TR.ply].color !== TR.side) {
    const m = G.moves[TR.ply]; TR.ply++;
    if (!first) { await sleep(450); if (gen !== TR.gen) return; }
    TR.b.set({fen: G.positions[TR.ply].fen, last: m, hl: '#facc15', check: kingInCheck(G.positions[TR.ply].fen)}, first ? null : moveAnim(m)); if (!first) moveSound(m);
  }
  if (TR.ply >= G.moves.length) { TR.state = 'done'; renderTrain(); Sound.play('end'); if (TR.max && TR.score / TR.max >= .7) Confetti.burst(innerWidth / 2, innerHeight / 3); return; }
  TR.state = 'guess'; TR.fb = null; renderTrain();
}
function trPlayers(){
  const M = TR.G.meta, top = TR.side === 'b' ? 'w' : 'b';
  const bar = c => `<div class="av s">${esc(((c === 'w' ? M.white : M.black) || '?')[0].toUpperCase())}</div><span class="nm">${esc(c === 'w' ? M.white : M.black)}</span>${c === TR.side ? '<span class="pill blue">You are guessing</span>' : ''}`;
  $('#tr-top').innerHTML = bar(top); $('#tr-bot').innerHTML = bar(TR.side);
}
async function trainGuess(from, to, dragged){
  const G = TR.G, i = TR.ply, gen = TR.gen, pos = G.positions[i], gm = G.moves[i];
  const ch = new Chess(pos.fen), r = ch.move({from, to, promotion: 'q'}); if (!r) return;
  TR.state = 'checking'; moveSound(r);
  TR.b.set({fen: ch.fen(), last: r, hl: '#93c5fd'}, dragged ? null : moveAnim(r));
  renderTrain();
  const u = uciOf(r); let pts, verdict, cls, best = null;
  const a0 = await getEngine().analyse(pos.fen, 12); if (gen !== TR.gen) return;
  const l1 = a0.lines[1], bestW = l1 ? scoreWin(l1) : 50; best = a0.best;
  const after = async fen => { const c = new Chess(fen); if (c.in_checkmate()) return 100; if (c.game_over()) return 50; const a = await getEngine().analyse(fen, 11); return a.lines[1] ? 100 - scoreWin(a.lines[1]) : 50; };
  if (u === gm.uci) { pts = 10; verdict = `You found the game move, <b>${esc(gm.san)}</b>!`; cls = u === best ? 'best' : 'great'; TR.found++; }
  else if (u === best) { pts = 10; verdict = `<b>${esc(r.san)}</b> is the engine's top choice, even better than what was played (${esc(gm.san)}).`; cls = 'best'; }
  else {
    const myW = await after(ch.fen()); if (gen !== TR.gen) return;
    const gW = await after(G.positions[i + 1].fen); if (gen !== TR.gen) return;
    const loss = Math.max(0, bestW - myW); pts = clamp(Math.round(10 - loss / 2.2), 0, 9);
    cls = loss < 2 ? 'excellent' : loss < 6 ? 'good' : loss < 12 ? 'inaccuracy' : loss < 22 ? 'mistake' : 'blunder';
    verdict = myW >= gW - 1.5 ? `<b>${esc(r.san)}</b> is just as good as the game move (${esc(gm.san)}).` : `<b>${esc(r.san)}</b> is ${CLS[cls].s}. The game continued <b>${esc(gm.san)}</b>.`;
  }
  TR.score += pts; TR.max += 10; TR.log.push({san: r.san, game: gm.san, pts, cls});
  TR.fb = {pts, verdict, cls, best: best ? pvToSan(pos.fen, [best], 1)[0] : null, game: gm.san};
  TR.state = 'feedback'; if (pts >= 9) Sound.play('ok'); else if (pts <= 3) Sound.play('wrong');
  renderTrain();
}
function trNext(){
  const G = TR.G, i = TR.ply, m = G.moves[i];
  TR.ply++; TR.b.set({fen: G.positions[TR.ply].fen, last: m, hl: '#facc15', check: kingInCheck(G.positions[TR.ply].fen)}, moveAnim(m)); moveSound(m);
  TR.state = 'auto'; renderTrain(); trAdvance(false);
}
function renderTrain(){
  if (TR.state === 'setup') return renderTrainSetup();
  trPlayers();
  const G = TR.G, total = G.moves.filter(m => m.color === TR.side).length, done = TR.log.length, pct = TR.max ? Math.round(TR.score / TR.max * 100) : 0;
  const head = `<div class="card"><div class="row" style="justify-content:space-between"><div><div class="cname">Guess the move</div><b style="font-size:16px">${esc(TR.title)}</b></div><button class="btn sm ghost" data-t="quit">${icon('x', 'sm')}Quit</button></div>
    <div class="cr-stats" style="margin-top:12px"><div><b class="num">${TR.score}</b><small>points</small></div><div><b class="num">${pct}%</b><small>score</small></div><div><b class="num">${TR.found}/${done}</b><small>game moves found</small></div><div><b class="num">${done}/${total}</b><small>moves</small></div></div></div>`;
  let body = '';
  if (TR.state === 'guess') body = `<div class="card"><div class="coach">${coachAvatar(44)}<div style="flex:1"><div class="say">“${TR.side === 'w' ? 'White' : 'Black'} to move. What did ${esc(TR.side === 'w' ? G.meta.white : G.meta.black)} play here? Drag a piece to guess.”</div></div></div><div class="acts"><button class="btn sm" data-t="hint">${icon('bulb', 'sm')}Hint (−3 points)</button><button class="btn sm ghost" data-t="skip">Show the move</button></div></div>`;
  else if (TR.state === 'checking') body = `<div class="card"><div class="row"><div class="spin"></div>Checking your move with Stockfish…</div></div>`;
  else if (TR.state === 'feedback') { const f = TR.fb; body = `<div class="card"><div class="coach"><div>${clsIcon(f.cls, 44)}</div><div style="flex:1"><div class="t1" style="font-size:20px">+${f.pts} points</div><div class="t2">${f.verdict}${f.best && f.best !== f.game ? ` Engine's choice: <b>${esc(f.best)}</b>.` : ''}</div></div></div><div class="acts"><button class="btn pri" data-t="next">Play the game move ${icon('next', 'sm')}</button></div></div>`; }
  else if (TR.state === 'done') { const lbl = pct >= 85 ? 'Grandmaster vision' : pct >= 70 ? 'Master class' : pct >= 55 ? 'Strong club player' : pct >= 40 ? 'Getting there' : 'Keep practicing';
    body = `<div class="card result-card"><h3 style="font-size:22px">${lbl}!</h3><div class="muted" style="margin:6px 0 12px">You scored <b style="color:var(--text)">${TR.score} of ${TR.max}</b> points (${pct}%) and found ${TR.found} of ${done} game moves.</div><div class="acts"><button class="btn pri" data-t="again">${icon('undo', 'sm')}Try again</button><button class="btn" data-t="review">${icon('chart', 'sm')}Review this game</button><button class="btn" data-t="quit">Pick another game</button></div></div>`; }
  else body = `<div class="card"><div class="row muted"><div class="spin"></div>Playing the moves…</div></div>`;
  const log = TR.log.length ? `<div class="card"><h4>${icon('list', 'sm')}Your guesses</h4><div class="keys">${TR.log.slice().reverse().slice(0, 12).map(x => `<div class="km" style="cursor:default">${clsIcon(x.cls, 20)}<b>${esc(x.san)}</b><span class="muted" style="font-size:13px">game: ${esc(x.game)}</span><span class="why">+${x.pts}</span></div>`).join('')}</div></div>` : '';
  $('#tr-side').innerHTML = head + body + log;
  $('#tr-side').onclick = e => {
    const b = e.target.closest('[data-t]'); if (!b) return; const a = b.dataset.t;
    if (a === 'quit') { TR.gen++; renderTrainSetup(); }
    if (a === 'next') trNext();
    if (a === 'again') startTrain(TR.G, TR.side, TR.title);
    if (a === 'review') { const G2 = buildGame(TR.G.pgn, {white: TR.G.meta.white, black: TR.G.meta.black, userColor: TR.side, url: TR.G.meta.url, fromApi: TR.G.meta.fromApi, end: TR.G.meta.end, user: TR.G.meta.user}); openReview(G2, {tab: 'report'}); }
    if (a === 'hint') { const gm = TR.G.moves[TR.ply]; TR.score = Math.max(0, TR.score - 3); TR.b.sel = gm.from; TR.b.renderFx(); toast(`Hint: move your ${PNAME[new Chess(TR.G.positions[TR.ply].fen).get(gm.from).type]}`); renderTrain(); }
    if (a === 'skip') { TR.max += 10; TR.log.push({san: '—', game: TR.G.moves[TR.ply].san, pts: 0, cls: 'miss'}); trNext(); }
  };
}

/* ---------------- mobile menu ---------------- */
function openMenu(){
  const items = [['games', 'list', 'My games'], ['coach', 'target', 'Coach report'], ['hunt', 'spark', 'Brilliant Hunter'], ['play', 'swords', 'Play the coach'], ['train', 'bulb', 'Guess the move'], ['board', 'cpu', 'Analysis board']];
  $('#mbox').innerHTML = `<h3>Menu<button class="btn sm ghost x" data-m="close">${icon('x', 'sm')}</button></h3><div class="menu-list">
    <button class="km" data-go="home">${icon('back', 'sm')}<b>Home</b></button>
    ${items.map(([k, ic, l]) => `<button class="km" data-go="${k}">${icon(ic, 'sm')}<b>${l}</b></button>`).join('')}
    <button class="km" data-go="theme">${icon('moon', 'sm')}<b>Light / dark mode</b></button></div>`;
  $('#modal').classList.remove('hidden');
  $('#mbox').onclick = e => {
    if (e.target.closest('[data-m=close]')) return closeModal();
    const b = e.target.closest('[data-go]'); if (!b) return; closeModal();
    const k = b.dataset.go;
    if (k === 'home') return show('home');
    if (k === 'theme') return $('#b-theme').click();
    $(`#nav [data-nav="${k}"]`).click();
  };
}


/* ---------------- boot ---------------- */
renderClassics();

/* ---------------- feature launcher (home page, "All features" menu, mobile menu) ---------------- */
const FEATURES = [
  {k: 'games', ic: 'list', t: 'Review my games', d: 'Pick any Chess.com game and replay it move by move with a coach.', user: true, c: '#2563eb'},
  {k: 'coach', ic: 'target', t: 'Coach report', d: 'Your weakest points, strengths, style and what to practice.', user: true, c: '#7c3aed'},
  {k: 'hunt', ic: 'spark', t: 'Brilliant Hunter', d: 'Find every brilliant move in your entire game history.', user: true, c: '#0d9488'},
  {k: 'openings', ic: 'flag', t: 'Opening explorer', d: 'Your personal opening tree with win rates for every move.', user: true, c: '#ea580c'},
  {k: 'play', ic: 'swords', t: 'Play the coach', d: 'Practice games at 7 levels with live tips and style analysis.', c: '#db2777'},
  {k: 'train', ic: 'bulb', t: 'Guess the move', d: 'Train your vision on your own games or famous classics.', c: '#ca8a04'},
  {k: 'board', ic: 'cpu', t: 'Analysis board', d: 'Set up any position and see Stockfish\'s top 3 lines live.', c: '#0891b2'},
  {k: 'insights', ic: 'trend', t: 'Player insights', d: 'Rating trend, best openings, streaks and your nemesis.', user: true, c: '#16a34a'},
  {k: 'classics', ic: 'trophy', t: 'Classic brilliancies', d: 'Replay the most famous sacrifices in chess history.', c: '#b45309'},
  {k: 'pgn', ic: 'copy', t: 'Paste a PGN', d: 'Review a game from any other site or app.', c: '#475569'},
];
function openFeature(k){
  closeModal();
  const f = FEATURES.find(x => x.k === k);
  if (k === 'play') return openPlay();
  if (k === 'train') return openTrain();
  if (k === 'board') return openBoard();
  if (k === 'classics' || k === 'pgn') {
    show('home');
    if (k === 'pgn') { $('#pgn-box').classList.remove('hidden'); setTimeout(() => { $('#pgn-box').scrollIntoView({behavior: 'smooth', block: 'center'}); $('#i-pgn').focus(); }, 50); }
    else setTimeout(() => $('#classics-sec').scrollIntoView({behavior: 'smooth'}), 50);
    return;
  }
  if (f && f.user) {
    if (S.user) return showPlayer(k);
    const L = linkedAcc();
    if (L) { S.pendingTab = k; return loadUser(L.u); }
    S.pendingTab = k; show('home'); window.scrollTo({top: 0, behavior: 'smooth'});
    setTimeout(() => $('#i-user').focus(), 250);
    toast('Enter your Chess.com username first');
  }
}
function launcherHTML(compact){
  return FEATURES.map(f => `<button class="tile ${compact ? 'sm' : ''}" data-feat="${f.k}" style="--tc:${f.c}">
    <span class="tile-ic">${f.k === 'hunt' ? clsIcon('brilliant', compact ? 22 : 26) : icon(f.ic)}</span>
    <span class="tile-t">${f.t}${f.user ? '' : ''}</span>${compact ? '' : `<span class="tile-d">${f.d}</span>`}
    ${f.user && !compact ? `<span class="tile-tag">${icon('user', 'sm')}Uses your username</span>` : ''}</button>`).join('');
}
function renderLauncher(){ const el = $('#launch'); if (el) el.innerHTML = launcherHTML(false); }
document.addEventListener('click', e => { const t = e.target.closest('[data-feat]'); if (t) openFeature(t.dataset.feat); });
function openAllFeatures(){
  $('#mbox').innerHTML = `<h3>All features<button class="btn sm ghost x" data-m="close">${icon('x', 'sm')}</button></h3>
    <div class="launch compact">${launcherHTML(true)}</div>
    <div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn sm ghost" data-go="home">${icon('back', 'sm')}Home</button><button class="btn sm ghost" data-go="theme">${icon('moon', 'sm')}Light / dark</button></div>`;
  $('#mbox').classList.add('wide'); $('#modal').classList.remove('hidden');
  $('#mbox').onclick = e => {
    if (e.target.closest('[data-m=close]')) return closeModal();
    const b = e.target.closest('[data-go]'); if (!b) return; closeModal();
    if (b.dataset.go === 'home') show('home'); else $('#b-theme').click();
  };
}
const _closeModal = closeModal;
closeModal = function(){ _closeModal(); $('#mbox').classList.remove('wide'); };
$('#b-menu').onclick = openAllFeatures;
$('#b-all').onclick = openAllFeatures;
$('#nav').onclick = e => { const b = e.target.closest('[data-nav]'); if (b) openFeature(b.dataset.nav); };
renderLauncher();
