'use strict';
/* ============================================================
   BrillMove coach features (loaded after app.js):
   - "Why is this brilliant / great?" explanations
   - Link your Chess.com account + "review your new game together?"
   - Coach Report: weakest points across your past games
   - Play the coach: practice games with live style analysis
   ============================================================ */

/* ---------------- why brilliant / great ---------------- */
function whyBoxHTML(G, i){
  const m = G.moves[i], before = G.positions[i], after = G.positions[i + 1];
  const who = m.color === 'w' ? 'White' : 'Black', opp = m.color === 'w' ? 'Black' : 'White';
  const L1 = (after.lines || {})[1], pv = L1 ? L1.pv : [], reply = pvToSan(after.fen, pv, 6);
  let body = '', line = '';
  if (m.cls === 'brilliant') {
    const c = new Chess(after.fen); let lost = null;
    for (let k = 0; k < Math.min(pv.length, 4); k++) { const r = c.move(mvObj(pv[k])); if (!r) break; if (r.color !== m.color && r.captured) { lost = r.captured; break; } }
    body = `${lost ? `<b>${esc(m.san)}</b> offers your <b>${PNAME[lost]}</b>.` : `<b>${esc(m.san)}</b> gives up material on purpose.`} Normally that would lose, but here it works`;
    if (L1 && L1.type === 'mate' && L1.v < 0) body += `: it leads to a <b>forced checkmate in ${-L1.v}</b>.`;
    else if (reply.length) body += `: after ${opp}'s best reply <b>${esc(reply[0])}</b>, the follow-up <b>${esc(reply.slice(1, 5).join(' '))}</b> leaves ${who} clearly better (${esc(fmtScore(L1, after.turn))}).`;
    else body += ` and ${who} stays on top.`;
    const gm = G.moves[i + 1];
    if (gm && pv[0] && gm.uci !== pv[0]) body += ` In the game, ${opp} played <b>${esc(gm.san)}</b> instead.`;
    else if (gm && gm.captured && gm.to === m.to) body += ` In the game, ${opp} took the bait.`;
    body += ' Few players even consider a move like this, which is what makes it brilliant.';
    line = lineHTML(G, i + 1, [m.san, ...reply.slice(0, 6)]);
  } else {
    const l1 = (before.lines || {})[1], l2 = (before.lines || {})[2];
    const alt = l2 ? pvToSan(before.fen, [l2.pv[0]], 1)[0] : null;
    body = `This was the only move that keeps ${who}'s position together.`;
    if (alt && l1) body += ` The next best option, <b>${esc(alt)}</b>, would have dropped ${who}'s winning chances from <b>${scoreWin(l1).toFixed(0)}%</b> to <b>${scoreWin(l2).toFixed(0)}%</b>.`;
    body += ' Finding the one move under pressure is what makes it great.';
    line = m.bestLine.length > 1 ? lineHTML(G, i + 1, m.bestLine) : '';
  }
  const title = m.cls === 'brilliant' ? 'Why is this brilliant?' : 'Why is this a great move?';
  return `<div class="better why-box ${m.cls}">
    <div class="row" style="justify-content:space-between"><div class="hd">${clsIcon(m.cls, 18)}${title}</div><button class="btn sm ghost" data-act="toggle-why" style="padding:3px 8px">${R.whyOpen ? 'Hide' : 'Explain'}</button></div>
    <div class="${R.whyOpen ? '' : 'hidden'}" data-why-body><div class="why" style="margin-top:8px">${body}</div>
      ${line ? `<div class="ln">Line: ${line}</div>` : ''}
      <div class="acts" style="margin-top:10px"><button class="btn sm soft" data-act="idea" data-i="${i}">${icon('play', 'sm')}Show me the idea</button></div></div></div>`;
}
R.whyOpen = true;
async function playLine(base, ucis){
  stopPlay(); const tok = ++R.bestTok;
  R.explore = {base, line: [], live: null}; R.ply = base;
  renderExploreAll();
  for (const u of ucis.slice(0, 7)) {
    await sleep(R.explore.line.length ? 750 : 350);
    if (tok !== R.bestTok || !R.explore) return;
    const ch = new Chess(dispFen()), r = ch.move(mvObj(u)); if (!r) break;
    R.explore.line.push({fen: ch.fen(), san: r.san, from: r.from, to: r.to, flags: r.flags, color: r.color});
    moveSound(r); renderExploreAll(moveAnim(r));
  }
  if (tok === R.bestTok && R.explore) startLive();
}
$('#co-better').addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  if (a.dataset.act === 'toggle-why') { R.whyOpen = !R.whyOpen; renderCoach(); }
  if (a.dataset.act === 'idea') {
    const i = +a.dataset.i, G = R.G, m = G.moves[i], pv = (((G.positions[i + 1].lines || {})[1]) || {}).pv || [];
    playLine(i, [m.uci, ...pv]);
  }
});

/* ---------------- link your Chess.com account ---------------- */
const linkedAcc = () => store.get('gl2_link', null);
function renderLinkSlot(){
  const el = $('#link-slot'); if (!el || !S.user) return;
  const L = linkedAcc();
  el.innerHTML = L && L.u === S.user
    ? `<span class="pill green">${icon('check', 'sm')}Linked</span><button class="btn sm ghost" id="b-unlink">Unlink</button>`
    : `<button class="btn sm pri" id="b-link">${icon('user', 'sm')}This is me: link account</button>`;
  const l = $('#b-link'); if (l) l.onclick = linkAccount;
  const u = $('#b-unlink'); if (u) u.onclick = () => { store.del('gl2_link'); renderLinkSlot(); renderMeChip(); renderHomeLinked(); toast('Account unlinked'); };
}
function linkAccount(){
  const latest = S.games.reduce((a, g) => Math.max(a, g.end_time || 0), 0) || Math.floor(Date.now() / 1000);
  store.set('gl2_link', {u: S.user, name: S.prof.username, av: S.prof.avatar || '', seen: latest});
  renderLinkSlot(); renderMeChip(); renderHomeLinked();
  toast(`Linked! When you come back after a game, we'll offer to review it with you.`, 3500);
}
function renderMeChip(){
  const L = linkedAcc(), el = $('#me-chip');
  if (!L) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.innerHTML = `${L.av ? `<img src="${esc(L.av)}" alt="" style="width:22px;height:22px;border-radius:6px">` : icon('user', 'sm')}<span class="t">${esc(L.name || L.u)}</span>`;
}
$('#me-chip').onclick = () => { const L = linkedAcc(); if (L) loadUser(L.u); };
const pad2 = n => String(n).padStart(2, '0');
async function latestGamesFor(u){
  const d = new Date(), urls = [];
  for (let k = 0; k < 2; k++) { const x = new Date(d.getFullYear(), d.getMonth() - k, 1); urls.push(`https://api.chess.com/pub/player/${encodeURIComponent(u)}/games/${x.getFullYear()}/${pad2(x.getMonth() + 1)}`); }
  let out = [];
  for (const url of urls) { try { out = out.concat(await fetchArchive(url)); } catch(e) {} if (out.length) break; }
  return out.filter(g => g.rules === 'chess').sort((a, b) => b.end_time - a.end_time);
}
function gameMetaFor(g, u){
  const c = g.white.username.toLowerCase() === u ? 'w' : 'b';
  return {white: g.white.username, black: g.black.username, wElo: g.white.rating, bElo: g.black.rating, userColor: c, url: g.url, timeClass: g.time_class, fromApi: true};
}
function resultFor(g, u){ const me = g.white.username.toLowerCase() === u ? g.white : g.black; return me.result === 'win' ? 'W' : DRAWS.has(me.result) ? 'D' : 'L'; }
async function checkNewGames(){
  const L = linkedAcc(); if (!L) return;
  const games = await latestGamesFor(L.u), fresh = games.filter(g => g.end_time > (L.seen || 0));
  L.latest = games[0] ? games[0].url : null; store.set('gl2_link', L); renderHomeLinked(games[0]);
  if (!fresh.length) return;
  L.seen = fresh[0].end_time; store.set('gl2_link', L);
  if (!$('#modal').classList.contains('hidden') || !$('#v-review').classList.contains('hidden')) return;
  welcomeModal(fresh[0], fresh.length, L);
}
function welcomeModal(g, n, L){
  const meta = gameMetaFor(g, L.u), opp = meta.userColor === 'w' ? g.black : g.white, r = resultFor(g, L.u);
  const verb = r === 'W' ? 'won' : r === 'L' ? 'lost' : 'drew';
  $('#mbox').innerHTML = `<div class="welcome">
    <div class="row" style="gap:12px;flex-wrap:nowrap">${coachAvatar(52)}<div><div class="cname">${esc(coach().name)}</div><h3 style="margin:2px 0 0">Welcome back, ${esc(L.name || L.u)}!</h3></div><button class="btn sm ghost x" data-m="close" style="margin-left:auto">${icon('x', 'sm')}</button></div>
    <div class="say" style="margin-top:14px">“${n > 1 ? `You've played ${n} games since your last visit. ` : ''}You just ${verb} a ${esc(g.time_class)} game against <b>${esc(opp.username)}</b> (${opp.rating}). Want to go through it together, move by move? I'll show you what went well and what you could have done better.”</div>
    <div class="gc" style="cursor:default;box-shadow:none;margin-top:4px"><div class="res ${r}">${r}</div><div style="min-width:0"><div class="who"><span class="cdot ${meta.userColor === 'w' ? 'b' : 'w'}"></span>vs ${esc(opp.username)} <span class="muted" style="font-weight:500">(${opp.rating})</span></div><div class="sub">${esc(g.time_class)} · ${esc(openingName(g.eco) || '')}</div></div><span></span><span></span></div>
    <div class="acts" style="margin-top:16px"><button class="btn pri lg" data-w="go">${icon('play', 'sm')}Review it together</button><button class="btn lg" data-w="later">Not now</button></div></div>`;
  $('#modal').classList.remove('hidden');
  $('#mbox').onclick = e => {
    if (e.target.closest('[data-m=close]') || e.target.closest('[data-w=later]')) return closeModal();
    if (e.target.closest('[data-w=go]')) { closeModal(); reviewTogether(g, L.u); }
  };
  if (settings.voice) Speech.say(`Welcome back! You just ${verb} against ${opp.username}. Want to review it together?`, coach().voice);
}
function reviewTogether(g, u){
  let G; try { G = buildGame(g.pgn, gameMetaFor(g, u)); } catch(e) { toast(e.message); return; }
  openReview(G, {tab: 'moves'});
}
function renderHomeLinked(latestGame){
  const el = $('#home-linked'), L = linkedAcc(); if (!el) return;
  if (!L) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="card linked-card"><div class="row" style="gap:12px;flex-wrap:nowrap">${L.av ? `<img class="av s" src="${esc(L.av)}" alt="">` : `<div class="av s">${esc((L.name || L.u)[0].toUpperCase())}</div>`}
    <div style="min-width:0;flex:1"><b>Welcome back, ${esc(L.name || L.u)}</b><div class="muted" style="font-size:13px">Your account is linked</div></div></div>
    <div class="acts" style="margin-top:12px"><button class="btn sm pri" data-h="latest">${icon('play', 'sm')}Review latest game</button><button class="btn sm" data-h="report">${icon('chart', 'sm')}Coach report</button><button class="btn sm" data-h="play">${icon('swords', 'sm')}Play the coach</button></div></div>`;
  el.onclick = async e => {
    const b = e.target.closest('[data-h]'); if (!b) return;
    if (b.dataset.h === 'play') return openPlay();
    if (b.dataset.h === 'report') { await loadUser(L.u); return showPlayer('coach'); }
    const gs = await latestGamesFor(L.u); if (gs[0]) reviewTogether(gs[0], L.u); else toast('No recent games found');
  };
}

/* ---------------- style analysis (shared by play + report) ---------------- */
function styleOf(moves){
  const my = moves.filter(m => m.cls && m.cls !== 'forced'); const n = my.length || 1;
  let agg = 0, sharp = 0, bad = 0, acc = 0;
  for (const m of my) {
    const fwd = m.color === 'w' ? +m.to[1] >= 5 : +m.to[1] <= 4;
    if (m.captured) agg += .6; if (m.san.includes('+')) agg += .8; if (fwd && m.piece !== 'p' && m.piece !== 'k') agg += .5;
    if (m.cls === 'brilliant' || m.rookSac) agg += 2;
    if (['best', 'great', 'brilliant'].includes(m.cls)) sharp++;
    if (['mistake', 'blunder', 'miss'].includes(m.cls)) bad++;
    acc += m.acc || 0;
  }
  const S2 = {aggression: clamp(Math.round(agg / n * 110), 0, 100), precision: clamp(Math.round(acc / n), 0, 100),
    tactics: clamp(Math.round(sharp / n * 160), 0, 100), safety: clamp(100 - Math.round(bad / n * 250), 0, 100), n: my.length};
  let label, desc;
  if (S2.aggression >= 60 && S2.precision >= 80) [label, desc] = ['Sharp attacker', 'You go for the initiative and usually back it up with accurate moves.'];
  else if (S2.aggression >= 60) [label, desc] = ['Daring attacker', 'You love to attack, but some attacks come at the cost of accuracy. Make sure every sacrifice is backed by calculation.'];
  else if (S2.precision >= 85) [label, desc] = ['Precise strategist', 'Calm, accurate, few weaknesses. You win by not giving your opponent anything.'];
  else if (S2.safety >= 80 && S2.aggression < 40) [label, desc] = ['Solid positional player', 'You keep things safe and steady. Look for more chances to take the initiative.'];
  else if (S2.safety < 50) [label, desc] = ['Risk taker', 'Your games swing a lot. Slowing down on critical moves will turn more of them into wins.'];
  else [label, desc] = ['All-rounder', 'A balanced mix of attack and defence. Sharpening your calculation will lift everything.'];
  return Object.assign(S2, {label, desc});
}
function metersHTML(st){
  const row = (l, v) => `<div class="meter"><span>${l}</span><div class="bar"><i style="width:${v}%"></i></div><b class="num">${v}</b></div>`;
  return row('Aggression', st.aggression) + row('Precision', st.precision) + row('Tactical eye', st.tactics) + row('Safety', st.safety);
}

/* ---------------- coach report (past games) ---------------- */
const clockSec = s => { if (!s) return null; const p = s.split(':').map(Number); return p.reduce((a, x) => a * 60 + x, 0); };
function computeReport(Gs){
  const R2 = {n: Gs.length, W: 0, D: 0, L: 0, acc: [], ph: {open: [], mid: [], end: []}, cnt: {}, hangs: 0, missedTac: 0, conv: 0, saves: 0, timeBad: 0, bad: 0,
    wAcc: [], bAcc: [], games: [], moves: []};
  for (const k of ORDER) R2.cnt[k] = 0;
  for (const G of Gs) {
    const c = G.meta.userColor, my = G.moves.filter(m => m.color === c), res = G.meta.result === '1-0' ? (c === 'w' ? 'W' : 'L') : G.meta.result === '0-1' ? (c === 'b' ? 'W' : 'L') : 'D';
    R2[res]++;
    const a = accuracy(G, c); if (a != null) { R2.acc.push(a); (c === 'w' ? R2.wAcc : R2.bAcc).push(a); }
    for (const ph of ['open', 'mid', 'end']) { const v = phaseAcc(G, c, ph); if (v != null) R2.ph[ph].push(v); }
    const wins = G.positions.map(p => p.wW == null ? 50 : (c === 'w' ? p.wW : 100 - p.wW));
    if (Math.max(...wins) >= 85 && res !== 'W') R2.conv++;
    if (Math.min(...wins) <= 25 && res !== 'L') R2.saves++;
    const start = clockSec(G.clocks[G.moves.findIndex(m => m.color === c)]);
    G.moves.forEach((m, i) => {
      if (m.color !== c || !m.cls) return;
      R2.cnt[m.cls] = (R2.cnt[m.cls] || 0) + 1; R2.moves.push(m);
      if (!BAD.has(m.cls)) return;
      if (m.cls !== 'inaccuracy') R2.bad++;
      if ((m.note || '').includes('hangs your')) R2.hangs++;
      const l1 = (G.positions[i].lines || {})[1];
      if (l1 && (l1.type === 'mate' && l1.v > 0 || swing(G.positions[i].fen, l1.pv, 2, c).d >= 2)) R2.missedTac++;
      const t = clockSec(G.clocks[i]);
      if (start && t != null && t < Math.max(15, start * .12) && m.cls !== 'inaccuracy') R2.timeBad++;
    });
    R2.games.push({url: G.meta.url, opp: c === 'w' ? G.meta.black : G.meta.white, acc: a, res, bad: my.filter(m => ['mistake', 'blunder', 'miss'].includes(m.cls)).length});
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const n = R2.n || 1, pa = {open: avg(R2.ph.open), mid: avg(R2.ph.mid), end: avg(R2.ph.end)};
  const W = [], ST = [];
  const PH = {open: ['Opening play', 'the opening', 'Learn the ideas (not just the moves) behind 1–2 openings for each color. Focus on fast development, castling early and controlling the center.'],
    mid: ['Middlegame decisions', 'the middlegame', 'Before each move, name your opponent\'s threat and your best plan. Practice "candidate moves": list 2–3 options and compare them.'],
    end: ['Endgame technique', 'the endgame', 'Study king activity and basic king-and-pawn and rook endgames. In the endgame your king is a fighting piece.']};
  const phs = Object.entries(pa).filter(([k, v]) => v != null && R2.ph[k].length >= 2);
  if (phs.length >= 2) {
    const [wk, wv] = phs.reduce((a, b) => b[1] < a[1] ? b : a), others = avg(phs.filter(x => x[0] !== wk).map(x => x[1]));
    if (others - wv >= 3) W.push({s: (others - wv) * 3.2, t: PH[wk][0], e: `Your accuracy in ${PH[wk][1]} is <b>${wv.toFixed(0)}%</b>, compared with <b>${others.toFixed(0)}%</b> in the rest of the game.`, tip: PH[wk][2]});
    const [bk, bv] = phs.reduce((a, b) => b[1] > a[1] ? b : a); ST.push([`Strong ${PH[bk][0].toLowerCase()}`, `${bv.toFixed(0)}% accuracy`]);
  }
  const bpg = R2.cnt.blunder / n;
  if (bpg >= .4) W.push({s: bpg * 45, t: 'Blunders', e: `You average <b>${bpg.toFixed(1)} blunders per game</b>. One blunder is often enough to lose.`, tip: 'Use a "blunder check" before every move: What does my opponent\'s last move attack? After my move, is every piece still defended?'});
  else ST.push(['Few blunders', `${bpg.toFixed(1)} per game`]);
  if (R2.hangs / n >= .25) W.push({s: R2.hangs / n * 55, t: 'Leaving pieces undefended', e: `<b>${R2.hangs}</b> times a move left a piece hanging that your opponent could simply take.`, tip: 'Before you let go of a piece, ask: can it be captured for free on its new square, and did moving it leave something else unprotected?'});
  if (R2.missedTac / n >= .4) W.push({s: R2.missedTac / n * 40, t: 'Spotting tactics', e: `You missed <b>${R2.missedTac}</b> chances to win material or deliver mate.`, tip: 'Solve 10 tactics puzzles a day and always check every check, capture and threat (in that order) on your turn.'});
  if (R2.cnt.miss / n >= .3) W.push({s: R2.cnt.miss / n * 45, t: 'Punishing mistakes', e: `<b>${R2.cnt.miss}</b> times your opponent made a mistake and you didn't take advantage.`, tip: 'After every opponent move, ask "why did they play that, and what did it weaken?" Mistakes are easiest to punish right away.'});
  if (R2.conv / n >= .15) W.push({s: R2.conv / n * 70, t: 'Converting winning positions', e: `In <b>${R2.conv} of ${R2.n}</b> games you had a winning position but didn't win.`, tip: 'When ahead: trade pieces (not pawns), remove counterplay first, and don\'t rush. Simple and safe beats fancy.'});
  else if (R2.W) ST.push(['Closing out wins', 'You convert your advantages']);
  if (R2.timeBad >= 2 && R2.bad && R2.timeBad / R2.bad >= .3) W.push({s: R2.timeBad / R2.bad * 60, t: 'Time management', e: `<b>${Math.round(R2.timeBad / R2.bad * 100)}%</b> of your mistakes happened when your clock was almost empty.`, tip: 'Spend less time on the opening and simple moves, and save it for critical moments. Never let the clock drop below 10% without a plan.'});
  const wa = avg(R2.wAcc), ba = avg(R2.bAcc);
  if (wa != null && ba != null && Math.abs(wa - ba) >= 5 && R2.wAcc.length >= 2 && R2.bAcc.length >= 2) {
    const weak = wa < ba ? 'White' : 'Black';
    W.push({s: Math.abs(wa - ba) * 2.5, t: `Playing as ${weak}`, e: `Your accuracy is <b>${Math.min(wa, ba).toFixed(0)}%</b> as ${weak} vs <b>${Math.max(wa, ba).toFixed(0)}%</b> as ${weak === 'White' ? 'Black' : 'White'}.`, tip: `Pick one solid opening system as ${weak} and play it consistently so the positions feel familiar.`});
  }
  if (R2.cnt.brilliant) ST.push(['Brilliant ideas', `${R2.cnt.brilliant} brilliant move${R2.cnt.brilliant > 1 ? 's' : ''}`]);
  if (R2.saves) ST.push(['Fighting spirit', `Saved ${R2.saves} bad position${R2.saves > 1 ? 's' : ''}`]);
  W.sort((a, b) => b.s - a.s);
  const gs = R2.games.filter(g => g.acc != null);
  return {n: R2.n, W: R2.W, D: R2.D, L: R2.L, acc: avg(R2.acc), bpg, weak: W.slice(0, 4), strong: ST.slice(0, 4), style: styleOf(R2.moves),
    worst: gs.slice().sort((a, b) => a.acc - b.acc)[0] || null, best: gs.slice().sort((a, b) => b.acc - a.acc)[0] || null, at: Date.now()};
}
let coachGen = 0;
function renderCoachTab(){
  const cached = S.user ? store.get('gl2_coach_' + S.user, null) : null;
  $('#pt-coach').innerHTML = `<div class="card"><div class="hunt-hero">${coachAvatar(52)}
      <div style="flex:1;min-width:220px"><h3 style="margin:0 0 4px;font-size:17px">Your coach report</h3><div class="muted" style="font-size:14px">${esc(coach().name)} analyzes your recent games and tells you your weakest points, your strengths, your playing style and what to practice next.</div></div>
      <div class="row"><select class="in" id="cr-n"><option value="10">Last 10 games</option><option value="20" selected>Last 20 games</option><option value="30">Last 30 games</option></select><button class="btn pri" id="b-cr">${cached ? 'Update report' : 'Analyze my games'}</button></div></div>
    <div id="cr-prog" class="hidden"><div class="row" style="margin-top:16px"><div class="spin"></div><span id="cr-status">Starting…</span></div><div class="prog"><div id="cr-bar"></div></div></div></div>
    <div id="cr-out" style="display:grid;gap:16px;margin-top:16px;grid-template-columns:minmax(0,1fr)"></div>`;
  $('#b-cr').onclick = runCoachReport;
  if (cached) renderReportOut(cached);
}
async function runCoachReport(){
  const gen = ++coachGen, N = +$('#cr-n').value;
  $('#cr-prog').classList.remove('hidden'); $('#b-cr').disabled = true;
  let pool = S.games.filter(g => g.rules === 'chess');
  for (let k = 1; pool.length < N && k < 4 && k < S.archives.length; k++) { try { pool = pool.concat((await fetchArchive(S.archives[k])).filter(g => g.rules === 'chess')); } catch(e) {} }
  pool = pool.sort((a, b) => b.end_time - a.end_time).slice(0, N);
  const Gs = [];
  for (let k = 0; k < pool.length; k++) {
    let G; try { G = buildGame(pool[k].pgn, metaFromGame(pool[k])); } catch(e) { continue; }
    const ok = await analyzeGame(G, 11, (i, n) => {
      if (gen !== coachGen) return;
      $('#cr-status').textContent = `Reading game ${k + 1} of ${pool.length} · vs ${G.meta.userColor === 'w' ? G.meta.black : G.meta.white}`;
      $('#cr-bar').style.width = ((k + i / n) / pool.length * 100) + '%';
    }, () => gen !== coachGen);
    if (!ok || gen !== coachGen) return;
    Gs.push(G);
  }
  if (gen !== coachGen) return;
  $('#cr-prog').classList.add('hidden'); $('#b-cr').disabled = false; $('#b-cr').textContent = 'Update report';
  if (!Gs.length) { toast('No standard games to analyze.'); return; }
  const rep = computeReport(Gs); store.set('gl2_coach_' + S.user, rep);
  renderReportOut(rep);
  if (settings.voice) Speech.say(rep.weak[0] ? `I've looked at your last ${rep.n} games. Your biggest area to improve is ${rep.weak[0].t}.` : `I've looked at your last ${rep.n} games. No major weaknesses, great job!`, coach().voice);
}
function renderReportOut(rep){
  const top = rep.weak[0], c = coach();
  const intro = top ? `I went through your last ${rep.n} games. The thing that would win you the most games right now is <b>${esc(top.t.toLowerCase())}</b>.` : `I went through your last ${rep.n} games and found no major weak spot. Keep it up!`;
  $('#cr-out').innerHTML = `
    <div class="card"><div class="coach">${coachAvatar(48)}<div style="flex:1;min-width:0"><div class="cname">${esc(c.name)}</div><div class="say">“${intro}”</div>
      <div class="cr-stats"><div><b class="num">${rep.n}</b><small>games</small></div><div><b class="num">${rep.W}-${rep.D}-${rep.L}</b><small>W-D-L</small></div><div><b class="num">${rep.acc == null ? '—' : rep.acc.toFixed(1)}</b><small>avg accuracy</small></div><div><b class="num">${rep.bpg.toFixed(1)}</b><small>blunders / game</small></div></div></div></div></div>
    <div class="card"><h4>${icon('target', 'sm')}What to improve<span class="sub">most important first</span></h4><div style="display:grid;gap:10px">
      ${rep.weak.length ? rep.weak.map((w, k) => `<div class="weak"><div class="rank">${k + 1}</div><div style="min-width:0"><h5>${esc(w.t)}</h5><div class="ev">${w.e}</div><div class="sev"><i style="width:${clamp(Math.round(w.s), 12, 100)}%"></i></div><div class="tip"><b>Try this:</b> ${esc(w.tip)}</div></div></div>`).join('')
        : '<div class="better ok"><div class="hd">' + icon('checkc', 'sm') + 'No clear weak spot</div><div class="why">Your play is balanced. Analyze more games for a sharper picture.</div></div>'}</div></div>
    <div class="card"><h4>${icon('trophy', 'sm')}Your strengths</h4><div class="achs">${rep.strong.length ? rep.strong.map(([t, s]) => `<div class="ach"><span class="e">${icon('check')}</span><div><b>${esc(t)}</b><small>${esc(s)}</small></div></div>`).join('') : '<span class="muted">Play a few more games to reveal your strengths.</span>'}</div></div>
    <div class="card"><h4>${icon('user', 'sm')}Your playing style</h4><div class="style-lbl">${esc(rep.style.label)}</div><div class="muted" style="font-size:14px;margin:4px 0 14px">${esc(rep.style.desc)}</div>${metersHTML(rep.style)}</div>
    <div class="card"><h4>${icon('list', 'sm')}Your practice plan</h4><div class="plan">
      ${rep.worst ? `<div class="pi"><span class="rank">1</span><div style="flex:1">Go through your toughest recent game (vs ${esc(rep.worst.opp)}, ${rep.worst.acc.toFixed(0)}% accuracy) move by move.</div><button class="btn sm pri" data-cr="worst">Review it</button></div>` : ''}
      ${rep.worst && rep.worst.bad ? `<div class="pi"><span class="rank">2</span><div style="flex:1">Turn its ${rep.worst.bad} mistake${rep.worst.bad > 1 ? 's' : ''} into puzzles and find the better moves yourself.</div><button class="btn sm" data-cr="retry">Retry mistakes</button></div>` : ''}
      <div class="pi"><span class="rank">3</span><div style="flex:1">Play a practice game against me. I'll comment on every move and track your style live.</div><button class="btn sm" data-cr="play">Play the coach</button></div></div>
      <div class="dim" style="font-size:12px;margin-top:10px">Report based on a fast engine pass (depth 11) over your last ${rep.n} standard games · ${new Date(rep.at).toLocaleDateString()}</div></div>`;
  $('#cr-out').onclick = e => {
    const b = e.target.closest('[data-cr]'); if (!b) return;
    if (b.dataset.cr === 'play') return openPlay();
    const g = [...S.games, ...Object.values(S.arch).flat()].find(x => x.url === rep.worst.url); if (!g) { toast('Game not found. Try updating the report.'); return; }
    let G; try { G = buildGame(g.pgn, metaFromGame(g)); } catch(err) { return; }
    openReview(G, {tab: b.dataset.cr === 'retry' ? 'moves' : 'report'});
    if (b.dataset.cr === 'retry') { const t = setInterval(() => { if (R.G === G && G.done) { clearInterval(t); startRetry(); } }, 300); }
  };
}

/* ---------------- play the coach ---------------- */
const LEVELS = [
  {n: 'Beginner', elo: '~600', pre: ['setoption name UCI_LimitStrength value false', 'setoption name Skill Level value 0'], go: 'go depth 1'},
  {n: 'Casual', elo: '~900', pre: ['setoption name UCI_LimitStrength value false', 'setoption name Skill Level value 3'], go: 'go depth 4'},
  {n: 'Club', elo: '~1200', pre: ['setoption name UCI_LimitStrength value false', 'setoption name Skill Level value 6'], go: 'go depth 7'},
  {n: 'Intermediate', elo: '1500', pre: ['setoption name Skill Level value 20', 'setoption name UCI_LimitStrength value true', 'setoption name UCI_Elo value 1500'], go: 'go movetime 400'},
  {n: 'Advanced', elo: '1900', pre: ['setoption name Skill Level value 20', 'setoption name UCI_LimitStrength value true', 'setoption name UCI_Elo value 1900'], go: 'go movetime 500'},
  {n: 'Expert', elo: '2300', pre: ['setoption name Skill Level value 20', 'setoption name UCI_LimitStrength value true', 'setoption name UCI_Elo value 2300'], go: 'go movetime 600'},
  {n: 'Master', elo: '2800+', pre: ['setoption name UCI_LimitStrength value false', 'setoption name Skill Level value 20'], go: 'go movetime 900'},
];
const PL = Object.assign({lvl: 2, colorPick: 'w', tips: true, evalbar: false}, store.get('gl2_play', {}), {b: null, ch: null, G: null, over: false, thinking: false, gen: 0, opp: null, you: 'w', flipped: false, hint: null, say: ''});
const savePL = () => store.set('gl2_play', {lvl: PL.lvl, colorPick: PL.colorPick, tips: PL.tips, evalbar: PL.evalbar});
const oppEngine = () => PL.opp || (PL.opp = new Engine({multipv: 1}));
function openPlay(){
  show('play'); window.scrollTo(0, 0);
  if (!PL.b) PL.b = new Board($('#play-board'), {interactive: true,
    canPick: sq => { if (!PL.ch || PL.over || PL.thinking || PL.ch.turn() !== PL.you) return false; const p = PL.ch.get(sq); return !!p && p.color === PL.you; },
    targets: sq => PL.ch ? PL.ch.moves({square: sq, verbose: true}).map(m => m.to) : [],
    onMove: (f, t, dragged) => playUser(f, t, dragged)});
  if (!PL.ch) { PL.ch = new Chess(); renderPlayBoard(); }
  renderPlaySide();
}
function renderPlayBoard(anim){
  const G = PL.G, last = G && G.moves.length ? G.moves[G.moves.length - 1] : null, fen = PL.ch.fen(), arrows = [];
  if (PL.hint) arrows.push({from: PL.hint.slice(0, 2), to: PL.hint.slice(2, 4), color: '#2563eb', op: .8});
  const badge = last && last.cls && last.color === PL.you && PL.tips ? {sq: last.to, cls: last.cls} : null;
  PL.b.setFlip(PL.flipped);
  PL.b.set({fen, last, hl: badge ? CLS[last.cls].c : '#facc15', badge, arrows, check: kingInCheck(fen)}, anim);
  const lp = G ? G.positions[G.positions.length - 1] : null;
  $('#play-evb').classList.toggle('hidden', !PL.evalbar);
  const w = lp && lp.wW != null ? lp.wW : 50; const f = $('#play-evf');
  f.style.height = (PL.flipped ? 100 - w : w) + '%'; f.style.top = PL.flipped ? '0' : 'auto'; f.style.bottom = PL.flipped ? 'auto' : '0';
  const bar = (c, top) => { const me = c === PL.you, nm = me ? (linkedAcc() ? linkedAcc().name : 'You') : coach().name;
    return `${me ? `<div class="av s">${esc(nm[0].toUpperCase())}</div>` : coachAvatar(32)}<div style="min-width:0"><span class="nm">${esc(nm)}</span> <span class="rt">${me ? '' : '(' + LEVELS[PL.lvl].n + ' · ' + LEVELS[PL.lvl].elo + ')'}</span><div class="cap">${capturedHTML(fen, c)}</div></div>${PL.G && PL.ch.turn() === c && !PL.over ? `<span class="clk live" style="font-family:inherit;font-size:12px">${me ? 'Your move' : 'Thinking…'}</span>` : ''}`; };
  const top = PL.flipped ? 'w' : 'b';
  $('#pp-top').innerHTML = bar(top); $('#pp-bot').innerHTML = bar(top === 'w' ? 'b' : 'w');
}
function renderPlaySide(){
  const out = $('#play-side');
  if (!PL.G) {
    out.innerHTML = `<div class="card"><div class="coach">${coachAvatar(52)}<div style="flex:1;min-width:0"><div class="cname">${esc(coach().name)}</div><div class="say">“Let's play! I'll comment on your moves and figure out your playing style as we go.”</div></div></div></div>
    <div class="card"><h4>${icon('sliders', 'sm')}New practice game</h4>
      <div class="set-g"><b>Opponent coach</b><div class="opts coaches">${Object.entries(COACHES).map(([k, c]) => `<div class="opt ${settings.coach === k ? 'on' : ''}" data-coach="${k}"><div class="cav" style="width:40px;height:40px;margin:2px auto 6px;background:${c.bg};font-size:14px">${c.emoji}</div>${esc(c.name)}</div>`).join('')}</div></div>
      <div class="set-g"><b>Strength</b><div class="opts lvls">${LEVELS.map((l, k) => `<div class="opt ${PL.lvl === k ? 'on' : ''}" data-lvl="${k}"><b style="display:block;color:var(--text);font-size:13px">${l.n}</b>${l.elo}</div>`).join('')}</div></div>
      <div class="set-g"><b>You play as</b><div class="seg" id="pl-color">${[['w', 'White'], ['r', 'Random'], ['b', 'Black']].map(([v, l]) => `<button class="${PL.colorPick === v ? 'on' : ''}" data-col="${v}">${l}</button>`).join('')}</div></div>
      <label class="tgl"><span>Coach tips during the game<br><small class="dim">Your coach comments on each of your moves</small></span><input type="checkbox" id="pl-tips" ${PL.tips ? 'checked' : ''}></label>
      <label class="tgl"><span>Show evaluation bar<br><small class="dim">Off is better practice</small></span><input type="checkbox" id="pl-evb" ${PL.evalbar ? 'checked' : ''}></label>
      <button class="btn pri lg" id="pl-start" style="width:100%;margin-top:16px">${icon('play', 'sm')}Start game</button></div>`;
    out.onclick = e => {
      const c = e.target.closest('[data-coach]'); if (c) { settings.coach = c.dataset.coach; saveSettings(); renderPlaySide(); renderPlayBoard(); return; }
      const l = e.target.closest('[data-lvl]'); if (l) { PL.lvl = +l.dataset.lvl; savePL(); renderPlaySide(); renderPlayBoard(); return; }
      const col = e.target.closest('[data-col]'); if (col) { PL.colorPick = col.dataset.col; savePL(); renderPlaySide(); return; }
      if (e.target.closest('#pl-start')) startPlayGame();
    };
    out.onchange = e => { if (e.target.id === 'pl-tips') PL.tips = e.target.checked; if (e.target.id === 'pl-evb') { PL.evalbar = e.target.checked; renderPlayBoard(); } savePL(); };
    return;
  }
  const G = PL.G, st = styleOf(G.moves.filter(m => m.color === PL.you)), accs = G.moves.filter(m => m.color === PL.you && m.acc != null);
  const accNow = accs.length ? accuracy(G, PL.you) : null;
  out.innerHTML = `${PL.over ? `<div class="card result-card"><h3 style="font-size:20px">${esc(PL.over)}</h3><div class="muted" style="margin:6px 0 14px">${accNow != null ? `Your accuracy: <b style="color:var(--text)">${accNow.toFixed(1)}%</b> · ` : ''}Style: <b style="color:var(--text)">${esc(st.label)}</b></div>
      <div class="acts"><button class="btn pri" data-pa="review">${icon('chart', 'sm')}Review this game with ${esc(coach().name.split(' ')[0])}</button><button class="btn" data-pa="new">${icon('play', 'sm')}New game</button></div></div>` : ''}
    <div class="card"><div class="coach">${coachAvatar(48)}<div style="flex:1;min-width:0"><div class="cname">${esc(coach().name)}</div><div class="say" id="pl-say">“${PL.say || 'Your move. Show me what you\'ve got!'}”</div></div></div>
      ${PL.over ? '' : `<div class="acts"><button class="btn sm" data-pa="undo">${icon('undo', 'sm')}Take back</button><button class="btn sm" data-pa="hint">${icon('bulb', 'sm')}Hint</button><button class="btn sm" data-pa="flip">${icon('flip', 'sm')}Flip</button><button class="btn sm ghost" data-pa="resign">Resign</button></div>`}</div>
    <div class="card"><h4>${icon('user', 'sm')}Your style in this game<span class="sub">${st.n} moves analyzed</span></h4><div class="style-lbl">${st.n >= 6 ? esc(st.label) : 'Reading your style…'}</div><div class="muted" style="font-size:13.5px;margin:4px 0 12px">${st.n >= 6 ? esc(st.desc) : 'Play a few moves and your coach will start profiling your play.'}</div>${metersHTML(st)}
      ${accNow != null ? `<div class="meter" style="margin-top:6px"><span>Accuracy</span><div class="bar"><i style="width:${accNow.toFixed(0)}%"></i></div><b class="num">${accNow.toFixed(0)}</b></div>` : ''}</div>
    <div class="card"><h4>${icon('list', 'sm')}Moves</h4><div class="mvs" id="pl-mvs">${playMovesHTML()}</div></div>`;
  const mv = $('#pl-mvs'); mv.scrollTop = mv.scrollHeight;
  out.onclick = e => {
    const b = e.target.closest('[data-pa]'); if (!b) return;
    const a = b.dataset.pa;
    if (a === 'new') { PL.gen++; PL.G = null; PL.over = false; PL.ch = new Chess(); PL.hint = null; PL.say = ''; renderPlayBoard(); renderPlaySide(); }
    if (a === 'flip') { PL.flipped = !PL.flipped; renderPlayBoard(); }
    if (a === 'undo') playUndo();
    if (a === 'hint') playHint();
    if (a === 'resign') { if (confirm('Resign this game?')) endPlay(`You resigned`, PL.you === 'w' ? '0-1' : '1-0'); }
    if (a === 'review') reviewPlayed();
  };
}
function playMovesHTML(){
  const G = PL.G; let h = '';
  for (let i = 0; i < G.moves.length; i += 2) {
    h += `<div class="no">${Math.floor(i / 2) + 1}.</div>`;
    for (const j of [i, i + 1]) { const m = G.moves[j]; if (!m) { h += '<div></div>'; continue; }
      const show = m.cls && m.color === PL.you && PL.tips && !['excellent', 'good', 'forced', 'book'].includes(m.cls);
      h += `<div class="m">${show ? clsIcon(m.cls, 18) : ''}${esc(m.san)}</div>`; }
  }
  return h;
}
function startPlayGame(){
  PL.gen++; PL.you = PL.colorPick === 'r' ? (Math.random() < .5 ? 'w' : 'b') : PL.colorPick; PL.flipped = PL.you === 'b';
  PL.ch = new Chess(); PL.over = false; PL.hint = null; PL.thinking = false;
  const me = linkedAcc() ? linkedAcc().name : 'You', cn = coach().name;
  PL.G = {id: 'play' + Date.now(), meta: {white: PL.you === 'w' ? me : cn, black: PL.you === 'b' ? me : cn, wElo: '', bElo: '', userColor: PL.you, result: '*', opening: ''},
    positions: [{fen: PL.ch.fen(), turn: 'w'}], moves: [], clocks: [], done: false};
  PL.say = coachLine('start', Date.now() % 7, ''); Sound.play('end');
  analyzePlayPos(0);
  renderPlayBoard(); renderPlaySide();
  if (PL.you === 'b') setTimeout(playEngine, 500);
}
function pushPlay(r, nLegal){
  PL.G.moves.push({san: r.san, from: r.from, to: r.to, promotion: r.promotion, color: r.color, flags: r.flags, captured: r.captured, piece: r.piece, uci: uciOf(r), forced: nLegal === 1});
  PL.G.positions.push({fen: PL.ch.fen(), turn: PL.ch.turn()});
}
function playUser(f, t, dragged){
  if (PL.over || PL.ch.turn() !== PL.you) return;
  const n = PL.ch.moves().length, r = PL.ch.move({from: f, to: t, promotion: 'q'}); if (!r) return;
  PL.hint = null; pushPlay(r, n); moveSound(r); renderPlayBoard(dragged ? null : moveAnim(r));
  analyzePlayPos(PL.G.positions.length - 1);
  if (!checkPlayOver()) { renderPlaySide(); setTimeout(playEngine, 250); }
}
async function playEngine(){
  if (PL.over || PL.ch.turn() === PL.you) return;
  const gen = PL.gen, L = LEVELS[PL.lvl], t0 = Date.now();
  PL.thinking = true; renderPlayBoard();
  const r = await oppEngine().run(PL.ch.fen(), L.go, L.pre);
  await sleep(Math.max(0, 450 - (Date.now() - t0)));
  if (gen !== PL.gen || PL.over) return;
  PL.thinking = false;
  if (!r.best) return;
  const n = PL.ch.moves().length, mv = PL.ch.move(mvObj(r.best)); if (!mv) return;
  pushPlay(mv, n); moveSound(mv); renderPlayBoard(moveAnim(mv));
  analyzePlayPos(PL.G.positions.length - 1);
  if (!checkPlayOver()) renderPlaySide();
}
async function analyzePlayPos(i){
  const G = PL.G, gen = PL.gen, pos = G.positions[i], ch = new Chess(pos.fen);
  if (ch.in_checkmate()) { pos.score = {type: 'mate', v: 0}; pos.lines = {}; pos.best = null; }
  else if (ch.game_over()) { pos.score = {type: 'cp', v: 0}; pos.lines = {}; pos.best = null; }
  else { const r = await getEngine().analyse(pos.fen, 12); if (gen !== PL.gen) return; pos.lines = r.lines; pos.best = r.best; const l1 = r.lines[1]; pos.score = l1 ? {type: l1.type, v: l1.v} : {type: 'cp', v: 0}; }
  pos.wW = pos.turn === 'w' ? scoreWin(pos.score) : 100 - scoreWin(pos.score);
  if (i > 0 && G.positions[i - 1].wW != null) {
    classify(G, i - 1);
    const m = G.moves[i - 1];
    if (m.color === PL.you) coachReact(m, i);
  }
  if (gen === PL.gen) { renderPlayBoard(); if (!PL.over || i === G.positions.length - 1) renderPlaySide(); }
}
function coachReact(m, ply){
  if (!PL.tips) return;
  let s = coachLine(m.rookSac && m.cls !== 'brilliant' ? 'rooksac' : m.cls, ply * 3 + m.san.length, m.san);
  if (BAD.has(m.cls) && m.bestSan) s += ` ${m.bestSan} was better.${m.note ? ' ' + m.note.replace(/<[^>]+>/g, '') : ''}`;
  PL.say = s;
  if (m.cls === 'brilliant' || m.rookSac) Hype.onMove(m, PL.G, ply);
  else if (settings.voice) Speech.say(s, coach().voice);
}
function checkPlayOver(){
  const ch = PL.ch; if (!ch.game_over()) return false;
  if (ch.in_checkmate()) { const youWon = ch.turn() !== PL.you; endPlay(youWon ? 'You won by checkmate!' : `${coach().name} won by checkmate`, ch.turn() === 'w' ? '0-1' : '1-0'); }
  else endPlay(ch.in_stalemate() ? 'Draw by stalemate' : ch.in_threefold_repetition() ? 'Draw by repetition' : 'Draw', '1/2-1/2');
  return true;
}
function endPlay(text, result){
  PL.over = text; PL.thinking = false; PL.gen++; PL.G.meta.result = result;
  const youWon = (result === '1-0' && PL.you === 'w') || (result === '0-1' && PL.you === 'b');
  PL.say = youWon ? 'Well played! Let\'s review it together to see what made the difference.' : result === '1/2-1/2' ? 'A hard-fought draw. Want to look at where you could have pushed for more?' : 'Good fight. Let\'s review it together and find what to improve.';
  Sound.play('end'); if (youWon) Confetti.burst(innerWidth / 2, innerHeight / 3);
  renderPlayBoard(); renderPlaySide();
}
function playUndo(){
  if (!PL.G || PL.over) return;
  PL.gen++; PL.thinking = false; PL.hint = null;
  const G = PL.G; let k = 0;
  while (G.moves.length && k < 2) { PL.ch.undo(); G.moves.pop(); G.positions.pop(); k++; if (PL.ch.turn() === PL.you) break; }
  if (PL.ch.turn() !== PL.you && G.moves.length) { PL.ch.undo(); G.moves.pop(); G.positions.pop(); }
  PL.say = 'Okay, take your time and try again.'; renderPlayBoard(); renderPlaySide();
  const i = G.positions.length - 1; if (G.positions[i].wW == null) analyzePlayPos(i);
}
async function playHint(){
  if (!PL.G || PL.over || PL.ch.turn() !== PL.you) return;
  const pos = PL.G.positions[PL.G.positions.length - 1];
  const best = pos.best || (await getEngine().analyse(pos.fen, 12)).best;
  if (!best || PL.ch.fen() !== pos.fen) return;
  PL.hint = best; PL.say = `Look at your ${PNAME[PL.ch.get(best.slice(0, 2)).type]} on ${best.slice(0, 2)}.`; renderPlayBoard(); renderPlaySide();
}
function reviewPlayed(){
  const ch = new Chess(); const M = PL.G.meta;
  for (const m of PL.G.moves) ch.move({from: m.from, to: m.to, promotion: m.promotion});
  ch.header('White', M.white, 'Black', M.black, 'Result', M.result, 'Event', 'BrillMove practice game');
  let G; try { G = buildGame(ch.pgn(), {userColor: PL.you, white: M.white, black: M.black}); } catch(e) { toast(e.message); return; }
  G.meta.result = M.result;
  openReview(G, {tab: 'report'});
}

/* ---------------- boot ---------------- */
$('#b-play-home') && ($('#b-play-home').onclick = openPlay);
renderMeChip(); renderHomeLinked();
setTimeout(checkNewGames, 1200);
