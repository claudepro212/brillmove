'use strict';
/* ============================================================
   BrillMove extras (loaded last):
   - shareable review links  (#g=user/gameId/YYYY/MM[/ply])
   - light / dark / system theme
   - keyboard shortcuts panel
   - installable app (service worker + install button)
   ============================================================ */

/* ---------------- shareable links ---------------- */
function shareSpec(G, ply){
  const M = G && G.meta; if (!M || !M.url || !M.end || !M.user) return null;
  const d = new Date(M.end * 1000);
  return `${M.user}/${gid(M.url)}/${d.getUTCFullYear()}/${pad2h(d.getUTCMonth() + 1)}${ply ? '/' + ply : ''}`;
}
function shareURL(ply){ const s = shareSpec(R.G, ply); return s ? `${location.origin}${location.pathname}#g=${s}` : null; }
const _openReview = openReview;
openReview = function(G, opts){
  _openReview(G, opts);
  const s = shareSpec(G); if (s) history.replaceState(null, '', '#g=' + s);
};
$('#b-back').addEventListener('click', () => history.replaceState(null, '', S.user ? '#u=' + encodeURIComponent(S.user) : location.pathname));
async function copyLink(withMove){
  const url = shareURL(withMove ? R.ply : 0);
  if (!url) { toast('Only Chess.com games can be shared by link.'); return; }
  try { await navigator.clipboard.writeText(url); toast(withMove ? 'Link to this move copied' : 'Link to this review copied'); }
  catch(e) { prompt('Copy this link:', url); }
}
async function openShared(spec){
  const [user, id, y, m, ply] = spec.split('/');
  if (!user || !id || !y || !m) return;
  toast('Loading shared game…');
  try {
    const gs = (await api(`https://api.chess.com/pub/player/${encodeURIComponent(user)}/games/${y}/${m}`)).games || [];
    const g = gs.find(x => gid(x.url) === id);
    if (!g) { toast('That shared game could not be found.'); return; }
    const c = g.white.username.toLowerCase() === user.toLowerCase() ? 'w' : 'b';
    const G = buildGame(g.pgn, {white: g.white.username, black: g.black.username, wElo: g.white.rating, bElo: g.black.rating, userColor: c, url: g.url, timeClass: g.time_class, fromApi: true, end: g.end_time, user: user.toLowerCase()});
    openReview(G, {ply: +ply || 0, tab: +ply ? 'moves' : 'report'});
  } catch(e) { toast("Couldn't load the shared game from Chess.com."); }
}
function handleHash(){ const m = location.hash.match(/^#g=([^&]+)/); if (m) openShared(decodeURIComponent(m[1])); }
window.addEventListener('hashchange', handleHash);
handleHash();
// share buttons
(() => {
  const acts = $('#coach-card .acts');
  if (acts) acts.insertAdjacentHTML('beforeend', `<button class="btn sm" id="b-link-move">${icon('copy', 'sm')}Copy link</button>`);
  const row = $('#b-pgnc') && $('#b-pgnc').parentElement;
  if (row) row.insertAdjacentHTML('beforeend', `<button class="btn" id="b-link-game">${icon('copy', 'sm')}Share review link</button>`);
  $('#b-link-move') && ($('#b-link-move').onclick = () => copyLink(true));
  $('#b-link-game') && ($('#b-link-game').onclick = () => copyLink(false));
})();

/* ---------------- theme ---------------- */
const mq = matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){
  const t = settings.theme || 'light', dark = t === 'dark' || (t === 'auto' && mq.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#b-theme').innerHTML = icon(dark ? 'sun' : 'moon');
  $('#b-theme').title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  document.querySelector('meta[name=theme-color]').content = dark ? '#0b1220' : '#2563eb';
  if (R.G && !$('#v-review').classList.contains('hidden')) drawGraph(R.tab === 'report' ? '#graph' : '#graph2');
}
$('#b-theme').onclick = () => { settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; saveSettings(); applyTheme(); };
mq.addEventListener && mq.addEventListener('change', applyTheme);
applyTheme();

/* ---------------- keyboard shortcuts ---------------- */
function openShortcuts(){
  const K = [['→', 'Next move'], ['←', 'Previous move (or undo in explore mode)'], ['Home / End', 'First / last move'], ['Space', 'Autoplay on / off'],
    ['K', 'Jump to the next key moment'], ['H', "Show the engine's best move"], ['F', 'Flip the board'], ['Esc', 'Close a window / leave explore or puzzle mode'], ['?', 'Show this list']];
  $('#mbox').innerHTML = `<h3>Keyboard shortcuts<button class="btn sm ghost x" data-m="close">${icon('x', 'sm')}</button></h3>
    <div class="keys">${K.map(([k, d]) => `<div class="km" style="cursor:default"><span class="kbd" style="min-width:64px;text-align:center">${k}</span><span>${d}</span></div>`).join('')}</div>`;
  $('#modal').classList.remove('hidden');
  $('#mbox').onclick = e => { if (e.target.closest('[data-m=close]')) closeModal(); };
}
document.addEventListener('keydown', e => {
  if (e.key === '?' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openShortcuts(); }
});
(() => { const t = $('.navi .tools'); if (t) t.insertAdjacentHTML('beforeend', `<button class="btn sm ghost" id="c-keys" title="Keyboard shortcuts (?)"><span class="kbd">?</span><span class="t">Shortcuts</span></button>`); $('#c-keys') && ($('#c-keys').onclick = openShortcuts); })();

/* ---------------- installable app ---------------- */
let installEvt = null;
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $$('.b-install').forEach(b => b.classList.remove('hidden')); });
window.addEventListener('appinstalled', () => { $$('.b-install').forEach(b => b.classList.add('hidden')); toast('BrillMove installed'); });
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
async function installApp(){
  if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; return; }
  $('#mbox').innerHTML = `<h3>Install BrillMove<button class="btn sm ghost x" data-m="close">${icon('x', 'sm')}</button></h3>
    <p class="muted" style="margin-top:0">BrillMove works like an app: it gets its own icon and opens full screen, and the chess engine stays saved on your device for faster reviews.</p>
    <div class="plan">
      <div class="pi"><span class="rank">1</span><div style="flex:1"><b>iPhone / iPad (Safari):</b> tap the Share button, then <b>Add to Home Screen</b>.</div></div>
      <div class="pi"><span class="rank">2</span><div style="flex:1"><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Install app</b> or <b>Add to Home screen</b>.</div></div>
      <div class="pi"><span class="rank">3</span><div style="flex:1"><b>Computer (Chrome / Edge):</b> click the install icon at the right end of the address bar.</div></div>
    </div>`;
  $('#modal').classList.remove('hidden');
  $('#mbox').onclick = e => { if (e.target.closest('[data-m=close]')) closeModal(); };
}
$$('.b-install').forEach(b => { b.onclick = installApp; if (!standalone && (isIOS || matchMedia('(pointer:coarse)').matches)) b.classList.remove('hidden'); });
if (standalone) $$('.b-install').forEach(b => b.classList.add('hidden'));
