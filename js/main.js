/* =========================================================
   COROX Films — behaviour
   1. Helpers
   2. Build film acts from FILMS
   3. Title fitting
   4. Scroll scenes (logo split + title splits)
   5. Video loading
   6. Header nav
   7. Film grain
   8. Index + hover preview
   9. Player (theater)
   10. Footer crows
   11. Main loop
   ========================================================= */

import { FILMS } from './films.js';


/* 1. Helpers ---------------------------------------------- */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

const pad = n => String(n).padStart(2, '0');
const mmss = s => pad(Math.floor(s / 60)) + ':' + pad(Math.floor(s % 60));

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = matchMedia('(hover: hover) and (pointer: fine)').matches;

const theater = $('#theater');
const theaterOpen = () => theater.classList.contains('on');


/* 2. Build film acts from FILMS --------------------------- */

const main = $('#main');

FILMS.forEach((film, i) => {
  const section = document.createElement('section');
  section.className = 'scene act' + (film.wide ? ' wide' : '');
  section.id = 'act-' + film.id;
  section.innerHTML = `
    <div class="stick">
      <div class="reveal"><video muted loop playsinline preload="none" data-src="${film.src}"></video></div>
      <p class="kicker">File ${film.id} · ${film.time} · ${film.place}</p>
      <div class="ttl">
        <h2 class="tp">${film.title}</h2>
        <h2 class="bt" aria-hidden="true">${film.title}</h2>
      </div>
      <div class="hint">SCROLL <span>↓</span></div>
      <div class="cap">
        <div class="meta">File ${film.id} · ${film.time} · ${film.place} · ${film.dur}</div>
        <h3>${film.title}</h3>
        <p>${film.line}</p>
        <button class="btn" data-i="${i}"><i></i>WATCH WITH SOUND</button>
      </div>
    </div>`;
  main.appendChild(section);
});

$$('.cap .btn').forEach(btn => btn.addEventListener('click', () => openTheater(+btn.dataset.i)));


/* 3. Title fitting: each film title fills ~90% of the width */

function fitTitles() {
  $$('.ttl').forEach(ttl => {
    ttl.style.fontSize = '100px';
    const size = Math.min(260, 100 * innerWidth * .9 / ttl.scrollWidth);
    ttl.style.fontSize = size + 'px';
    ttl.closest('.stick').style.setProperty('--th', size * .9 + 'px');
  });
}

fitTitles();
document.fonts?.ready.then(fitTitles);
addEventListener('resize', fitTitles, { passive: true });


/* 4. Scroll scenes ----------------------------------------
   One engine for Act 1 (logo) and every film act.
   p = scroll progress through the section (0 → 1):
     e1  halves split apart
     e2  slit grows to full screen, halves fade
     e3  caption fades in                                  */

const scenes = $$('.scene').map(section => {
  const stage = $('.stick', section);
  const isDoor = section.id === 'door';
  return {
    section,
    isDoor,
    reveal: $('.reveal', stage),
    video: $('video', stage),
    kicker: $('.kicker', stage),
    hint: $('.hint', stage),
    caption: $('.cap', stage),
    anchor: isDoor ? $('.logo-wrap', stage) : $('.ttl', stage),
    top: isDoor ? $('.lg-xt', stage) : $('.tp', stage),
    bottom: isDoor ? $('.lg-xb', stage) : $('.bt', stage),
    rest: isDoor ? $('.lg-coro', stage) : null, // "CORO" slides away in Act 1
  };
});

function updateScene(sc, now) {
  const rect = sc.section.getBoundingClientRect();
  const vh = innerHeight;
  const vw = innerWidth;
  if (rect.bottom < 0 || rect.top > vh) return;

  const p = clamp(-rect.top / (rect.height - vh));
  const idle = REDUCED_MOTION ? 0 : (Math.sin(now / 700) * .5 + .5) * .012; // tiny breathing gap
  const e1 = ease(clamp((p - .03) / .34));
  const e2 = ease(clamp((p - .3) / .36));
  const e3 = ease(clamp((p - .62) / .18));
  const gap = (e1 * .3 + idle) * vh;

  // Split the halves
  if (sc.isDoor) {
    sc.top.style.transform = `translate3d(${e1 * 2}vw, ${-gap}px, 0) rotate(${-e1 * 6}deg)`;
    sc.bottom.style.transform = `translate3d(${e1 * 2}vw, ${gap}px, 0) rotate(${e1 * 6}deg)`;
    sc.rest.style.transform = `translate3d(${-e1 * 14}vw, 0, 0)`;
    sc.rest.style.opacity = 1 - e1 * 1.1;
  } else {
    sc.top.style.transform = `translate3d(${-e1 * 3}vw, ${-gap}px, 0)`;
    sc.bottom.style.transform = `translate3d(${e1 * 3}vw, ${gap}px, 0)`;
  }
  sc.top.style.opacity = sc.bottom.style.opacity = 1 - e2 * 1.2;
  sc.kicker.style.opacity = sc.hint.style.opacity = 1 - e1 * 2;

  // Open the slit: starts at the X (Act 1) or the title, grows to full screen
  const box = sc.anchor.getBoundingClientRect();
  const cx = sc.isDoor ? box.left + box.width * .857 : box.left + box.width / 2;
  const cy = sc.isDoor ? box.top + box.height * .483 : box.top + box.height / 2;
  const halfW = sc.isDoor ? box.width * .085 : box.width * .5;
  const halfH = gap * .92;
  const L = lerp(cx - halfW, 0, e2);
  const R = lerp(cx + halfW, vw, e2);
  const T = lerp(cy - halfH, 0, e2);
  const B = lerp(cy + halfH, vh, e2);
  sc.reveal.style.clipPath = `inset(${T}px ${vw - R}px ${vh - B}px ${L}px round ${lerp(6, 0, e2)}px)`;

  // Caption
  sc.caption.style.opacity = e3;
  sc.caption.style.transform = `translateY(${(1 - e3) * 30}px)`;
  sc.caption.style.pointerEvents = e3 > .5 ? 'auto' : 'none';
}


/* 5. Video loading: only load/play footage near the screen */

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  const video = $('.reveal video', entry.target);
  if (entry.isIntersecting) {
    if (!video.src && video.dataset.src) video.src = video.dataset.src;
    if (!theaterOpen()) video.play().catch(() => {});
  } else {
    video.pause();
  }
}), { rootMargin: '50% 0px' });

scenes.forEach(sc => observer.observe(sc.section));

function resumeVisibleVideos() {
  if (theaterOpen()) return;
  scenes.forEach(sc => {
    const r = sc.section.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0 && sc.video.src && sc.video.paused) sc.video.play().catch(() => {});
  });
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) resumeVisibleVideos();
});


/* 6. Header nav ------------------------------------------- */

$$('[data-go]').forEach(btn => btn.addEventListener('click', () => {
  const target = document.getElementById(btn.dataset.go);
  scrollTo({ top: target.offsetTop, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
}));


/* 7. Film grain: 6 noise tiles, cycled every 3rd frame ---- */

const grainEl = $('#grain');
const grainTiles = [];
{
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  for (let k = 0; k < 6; k++) {
    const img = ctx.createImageData(128, 128);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() < .5 ? 0 : (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    grainTiles.push(`url(${canvas.toDataURL()})`);
  }
}
let grainIndex = 0;
function stepGrain() {
  grainIndex = (grainIndex + 1) % grainTiles.length;
  grainEl.style.backgroundImage = grainTiles[grainIndex];
  grainEl.style.backgroundPosition = `${(Math.random() * 128) | 0}px ${(Math.random() * 128) | 0}px`;
}
stepGrain();


/* 8. Index + hover preview -------------------------------- */

$('#rows').innerHTML = FILMS.map((film, i) => `
  <button class="row" data-i="${i}">
    <span class="id">${film.id}</span>
    <span class="tt">${film.title}</span>
    <span class="pl">${film.time} · ${film.place.toUpperCase()}</span>
    <span class="du">${film.dur}</span>
    <span class="go"><i></i></span>
  </button>`).join('');

const peek = $('#peek');
const peekVideo = $('video', peek);
let mouseX = 0, mouseY = 0, peekX = 0, peekY = 0;

addEventListener('pointermove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

$$('.row').forEach(row => {
  row.addEventListener('click', () => openTheater(+row.dataset.i));
  if (!FINE_POINTER) return;
  row.addEventListener('pointerenter', () => {
    const film = FILMS[+row.dataset.i];
    if (peekVideo.dataset.src !== film.src) {
      peekVideo.src = film.src;
      peekVideo.dataset.src = film.src;
    }
    peek.classList.toggle('wide', !!film.wide);
    peekVideo.play().catch(() => {});
    peek.classList.add('on');
  });
  row.addEventListener('pointerleave', () => {
    peek.classList.remove('on');
    peekVideo.pause();
  });
});


/* 9. Player (theater) ------------------------------------- */

const player = $('#thV');
const playerBox = $('.th-box');
const playBtn = $('#thPlay');
const muteBtn = $('#thMute');
const progress = $('#thProg');
let current = 0;

function openTheater(i) {
  current = (i + FILMS.length) % FILMS.length;
  const film = FILMS[current];
  playerBox.classList.toggle('wide', !!film.wide);
  player.src = film.src;
  player.muted = false;
  // Try with sound; fall back to muted if the browser blocks it
  player.play().catch(() => { player.muted = true; player.play().catch(() => {}); });
  $('#thTitle').innerHTML = `<strong>${film.title}</strong>File ${film.id} · ${film.time} · ${film.place}`;
  theater.classList.add('on');
  document.body.style.overflow = 'hidden';
  $$('.reveal video').forEach(v => v.pause());
  updateMuteLabel();
}

function closeTheater() {
  theater.classList.remove('on');
  player.pause();
  document.body.style.overflow = '';
  resumeVisibleVideos();
}

const togglePlay = () => (player.paused ? player.play().catch(() => {}) : player.pause());
const toggleMute = () => { player.muted = !player.muted; };
function updateMuteLabel() { muteBtn.textContent = player.muted ? 'MUTE' : 'SND'; }

$('#thClose').onclick = closeTheater;
$('#thPrev').onclick = () => openTheater(current - 1);
$('#thNext').onclick = () => openTheater(current + 1);
theater.addEventListener('click', e => { if (e.target === theater) closeTheater(); });

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
  if (player.duration) player.currentTime = clamp((e.clientX - b.left) / b.width) * player.duration;
};
progress.addEventListener('pointerdown', e => { seeking = true; progress.setPointerCapture(e.pointerId); seekTo(e); });
progress.addEventListener('pointermove', e => { if (seeking) seekTo(e); });
progress.addEventListener('pointerup', () => { seeking = false; });

// Keyboard: Esc close, ←/→ prev/next, Space play/pause, M mute
addEventListener('keydown', e => {
  if (!theaterOpen()) return;
  if (e.key === 'Escape') closeTheater();
  else if (e.key === 'ArrowRight') openTheater(current + 1);
  else if (e.key === 'ArrowLeft') openTheater(current - 1);
  else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key.toLowerCase() === 'm') toggleMute();
});


/* 10. Footer: click the logo and the crows leave ---------- */

$('#flogo').addEventListener('click', e => {
  if (REDUCED_MOTION) return;
  for (let k = 0; k < 22; k++) {
    const bird = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    bird.setAttribute('viewBox', '0 0 44 20');
    bird.setAttribute('class', 'bird');
    bird.innerHTML = '<g class="w"><path d="M2 4 Q12 2 22 12 Q32 2 42 4"/></g>';
    document.body.appendChild(bird);

    const sx = e.clientX + (Math.random() - .5) * 80;
    const sy = e.clientY + (Math.random() - .5) * 30;
    const ex = sx + (Math.random() < .5 ? -1 : 1) * (innerWidth * .6 + Math.random() * innerWidth * .5);
    const ey = -80 - Math.random() * 200;
    const scale = .5 + Math.random() * 1.1;
    $('.w', bird).style.animationDelay = -Math.random() * .3 + 's';

    bird.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(${scale * .4})` },
      { transform: `translate(${lerp(sx, ex, .5)}px, ${lerp(sy, ey, .4) - 80}px) scale(${scale})` },
      { transform: `translate(${ex}px, ${ey}px) scale(${scale * 1.2})` },
    ], {
      duration: 1800 + Math.random() * 1400,
      delay: k * 40,
      easing: 'cubic-bezier(.3, .1, .4, 1)',
      fill: 'forwards',
    }).onfinish = () => bird.remove();
  }
});


/* 11. Main loop ------------------------------------------- */

const fill = $('#thFill');
const timeLabel = $('#thTime');
let frame = 0;

(function loop(now) {
  frame++;
  scenes.forEach(sc => updateScene(sc, now));
  if (!REDUCED_MOTION && frame % 3 === 0) stepGrain();

  if (FINE_POINTER) {
    peekX = lerp(peekX, mouseX + 24, .18);
    peekY = lerp(peekY, mouseY - 150, .18);
    peek.style.transform = `translate3d(${peekX}px, ${peekY}px, 0)`;
  }

  if (theaterOpen() && player.duration) {
    fill.style.width = (player.currentTime / player.duration) * 100 + '%';
    timeLabel.textContent = `${mmss(player.currentTime)} / ${mmss(player.duration)}`;
  }

  requestAnimationFrame(loop);
})(performance.now());
