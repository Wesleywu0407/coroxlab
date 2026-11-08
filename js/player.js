import { FILMS } from './films.js';

document.body.insertAdjacentHTML('beforeend', `<dialog id="theater" aria-label="Film player">
    <div class="th-title" id="thTitle"></div>
    <button class="th-close" id="thClose">CLOSE ✕</button>
    <button class="th-side th-prev" id="thPrev" aria-label="Previous film">‹</button>
    <div class="th-box">
      <video id="thV" playsinline preload="auto"></video>
      <div class="th-bar">
        <button id="thPlay" aria-label="Play or pause">❚❚</button>
        <div class="th-prog" id="thProg"><div><span id="thFill"></span></div></div>
        <span id="thTime">00:00 / 00:00</span>
        <button id="thMute" aria-label="Mute">SND</button>
      </div>
    </div>
    <button class="th-side th-next" id="thNext" aria-label="Next film">›</button>
  </dialog>`);

const $ = selector => document.querySelector(selector);
export const theater = $('#theater');
export const theaterOpen = () => theater.open;
const pad = n => String(n).padStart(2, '0');
const mmss = s => pad(Math.floor(s / 60)) + ':' + pad(Math.floor(s % 60));

const player = $('#thV');
const playerBox = $('.th-box');
const playBtn = $('#thPlay');
const muteBtn = $('#thMute');
const progress = $('#thProg');
let current = 0;

export function openTheater(i) {
  current = (i + FILMS.length) % FILMS.length;
  const film = FILMS[current];
  playerBox.classList.toggle('wide', !!film.wide);
  player.src = film.src;
  player.muted = false;
  // A fast switch or close can abort play. Only autoplay denial needs a muted retry.
  player.play().catch(error => {
    if (error.name !== 'NotAllowedError' || !theater.open || FILMS[current] !== film) return;
    player.muted = true;
    player.play().catch(() => {});
  });
  $('#thTitle').innerHTML = `<strong>${film.title}</strong>File ${film.id} · ${film.time} · ${film.place}`;
  if (!theater.open) theater.showModal();
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.reveal video, .film-preview').forEach(v => v.pause());
  updateMuteLabel();
}

theater.addEventListener('close', () => {
  player.pause();
  document.body.style.overflow = '';
});

const togglePlay = () => (player.paused ? player.play().catch(() => {}) : player.pause());
const toggleMute = () => { player.muted = !player.muted; };
function updateMuteLabel() { muteBtn.textContent = player.muted ? 'MUTE' : 'SND'; }

$('#thClose').onclick = () => theater.close();
$('#thPrev').onclick = () => openTheater(current - 1);
$('#thNext').onclick = () => openTheater(current + 1);
theater.addEventListener('click', e => { if (e.target === theater) theater.close(); });

player.addEventListener('click', togglePlay);
playBtn.onclick = togglePlay;
muteBtn.onclick = toggleMute;
player.addEventListener('play', () => { playBtn.textContent = '❚❚'; });
player.addEventListener('pause', () => { playBtn.textContent = '▶'; });
player.addEventListener('ended', () => openTheater(current + 1));
player.addEventListener('volumechange', updateMuteLabel);

// Seek by click or drag on the progress bar
let seeking = false;
const seekTo = e => {
  const b = progress.getBoundingClientRect();
  if (player.duration) player.currentTime = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)) * player.duration;
};
progress.addEventListener('pointerdown', e => { seeking = true; progress.setPointerCapture(e.pointerId); seekTo(e); });
progress.addEventListener('pointermove', e => { if (seeking) seekTo(e); });
progress.addEventListener('pointerup', () => { seeking = false; });

// Keyboard: Esc close, ←/→ prev/next, Space play/pause, M mute
addEventListener('keydown', e => {
  if (!theaterOpen()) return;
  if (e.key === 'ArrowRight') openTheater(current + 1);
  else if (e.key === 'ArrowLeft') openTheater(current - 1);
  else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); togglePlay(); }
  else if (e.key.toLowerCase() === 'm') toggleMute();
});

const fill = $('#thFill');
const timeLabel = $('#thTime');
function updateProgress() {
  const duration = Number.isFinite(player.duration) ? player.duration : 0;
  fill.style.width = (duration ? player.currentTime / duration * 100 : 0) + '%';
  timeLabel.textContent = mmss(player.currentTime) + ' / ' + mmss(duration);
}
for (const event of ['timeupdate', 'durationchange', 'emptied']) {
  player.addEventListener(event, updateProgress);
}
