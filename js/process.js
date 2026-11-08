/* =========================================================
   COROX Films — Process page (process.html)
   One section per film. Its clip holds the Blender previs
   (left half) and the final film (right half), frame-synced.
   Both halves are drawn onto one canvas, split by a slanted
   seam at the angle of the X.

   Scroll:  title splits → slit opens on the previs →
            the seam sweeps in and turns it into the film.
   Then:    the seam follows the pointer (drag on touch).

   Per section (data attributes on .process):
     data-w, data-h   size of ONE half of the clip
     data-shots       shot start times in seconds, one per
                      button in .pr-shots
   ========================================================= */

import { startGrain } from './grain.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const SLANT = .2;                                   // seam lean, as a share of frame height
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)');

/* Where the film sits on screen
   - tall clips: full screen on phones, a 9:16 column on wide screens
   - wide clips: full screen on wide screens, a 16:9 band on phones */
function frameRect(vw, vh, srcW, srcH) {
  const tallScreen = vw / vh < .75;
  if (srcH > srcW) {
    if (tallScreen) return { x: 0, y: 0, w: vw, h: vh };
    const w = Math.round(vh * srcW / srcH);
    return { x: Math.round((vw - w) / 2), y: 0, w, h: vh };
  }
  if (!tallScreen) return { x: 0, y: 0, w: vw, h: vh };
  const h = Math.round(vw * srcH / srcW * 1.25);   // a little taller than 16:9, cropped at the sides
  return { x: 0, y: Math.round(vh * .38 - h / 2), w: vw, h };
}

function setupSection(section) {
  const stage = $('.pr-stage', section);
  const canvas = $('canvas', stage);
  const ctx = canvas.getContext('2d');
  const video = $('.pr-src', section);
  const seamEl = $('.pr-seam', section);
  const tagL = $('.pr-tag-l', section);
  const tagR = $('.pr-tag-r', section);
  const kicker = $('.kicker', section);
  const hint = $('.hint', section);
  const ttl = $('.ttl', section);
  const top = $('.tp', section);
  const bottom = $('.bt', section);
  const caption = $('.pr-cap', section);
  const list = $('.pr-shots', section);
  const items = $$('.pr-shots button', section);
  const now = $('.pr-now', section);
  const soundBtn = $('.pr-sound', section);

  const SRC_W = +section.dataset.w, SRC_H = +section.dataset.h;
  const SHOTS = section.dataset.shots.split(',').map(Number);

  const s = {
    section, video, visible: false, loaded: false,
    seam: 1.1, pointerSeam: null, frame: { x: 0, y: 0, w: 0, h: 0 },
  };

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  /* Draw one half of the clip into the frame, cover-fit */
  function drawHalf(half, f) {
    const k = Math.max(f.w / SRC_W, f.h / SRC_H);
    const dw = SRC_W * k, dh = SRC_H * k;
    ctx.drawImage(video, half * SRC_W, 0, SRC_W, SRC_H, f.x + (f.w - dw) / 2, f.y + (f.h - dh) / 2, dw, dh);
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (video.readyState < 2) return;
    const f = s.frame;
    ctx.save();
    ctx.beginPath(); ctx.rect(f.x, f.y, f.w, f.h); ctx.clip();
    drawHalf(0, f);                                         // previs underneath
    const lean = f.h * SLANT / 2;
    const sx = f.x + f.w * s.seam;
    ctx.beginPath();                                        // final to the right of the seam
    ctx.moveTo(sx + lean, f.y);
    ctx.lineTo(f.x + f.w + lean * 2, f.y);
    ctx.lineTo(f.x + f.w + lean * 2, f.y + f.h);
    ctx.lineTo(sx - lean, f.y + f.h);
    ctx.closePath();
    ctx.save(); ctx.clip(); drawHalf(1, f); ctx.restore();
    if (s.seam > -.2 && s.seam < 1.2) {
      ctx.strokeStyle = 'rgba(231,227,216,.95)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + lean, f.y); ctx.lineTo(sx - lean, f.y + f.h); ctx.stroke();
    }
    ctx.restore();
  }

  /* Labels ride along the seam, about a quarter of the way down */
  function placeSeamLabels() {
    const f = s.frame;
    const lean = f.h * SLANT / 2;
    const x = f.x + f.w * s.seam + lean * .52;
    seamEl.style.transform = `translate3d(${x}px, ${f.y + f.h * .24}px, 0)`;
    seamEl.style.opacity = s.seam > .02 && s.seam < .98 ? 1 : 0;
    tagL.style.opacity = s.seam > .3 ? 1 : 0;
    tagR.style.opacity = s.seam < .7 ? 1 : 0;
  }

  /* Visitor steering: hover on desktop, horizontal drag on touch */
  const toSeam = e => clamp((e.clientX - s.frame.x) / s.frame.w, 0, 1);
  const live = () => section.classList.contains('live');
  stage.addEventListener('pointermove', e => {
    if (live() && (fine.matches || e.pressure > 0)) s.pointerSeam = toSeam(e);
  });
  stage.addEventListener('pointerdown', e => { if (live()) s.pointerSeam = toSeam(e); });
  stage.addEventListener('pointerleave', () => { if (fine.matches) s.pointerSeam = null; });
  stage.addEventListener('pointercancel', () => { s.pointerSeam = null; });

  /* Shot list: shows where you are, click to jump */
  items.forEach((btn, i) => btn.addEventListener('click', () => {
    video.currentTime = SHOTS[i] + .02;
    video.play().catch(() => {});
  }));
  function markShot() {
    const t = video.currentTime;
    let i = 0;
    while (i < SHOTS.length - 1 && t >= SHOTS[i + 1]) i++;
    items.forEach((b, k) => b.classList.toggle('on', k === i));
    if (items[i] && now.textContent !== items[i].textContent) now.textContent = items[i].textContent;
  }

  /* Sound: one section at a time */
  s.mute = () => {
    video.muted = true;
    soundBtn.textContent = 'SOUND ON';
    soundBtn.setAttribute('aria-pressed', 'false');
  };
  soundBtn.addEventListener('click', () => {
    if (video.muted) {
      sections.forEach(o => o !== s && o.mute());
      video.muted = false;
      video.play().catch(() => {});
      soundBtn.textContent = 'SOUND OFF';
      soundBtn.setAttribute('aria-pressed', 'true');
    } else s.mute();
  });

  /* Load and play only near the screen */
  new IntersectionObserver(([entry]) => {
    s.visible = entry.isIntersecting;
    if (s.visible) {
      if (!s.loaded) { video.src = video.dataset.src; s.loaded = true; }
      video.play().catch(() => {});
    } else {
      video.pause();
      s.mute();
    }
  }, { rootMargin: '40% 0px' }).observe(section);

  /* Scroll timeline */
  s.update = t => {
    const r = section.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;

    const p = clamp(-r.top / (r.height - vh));
    const idle = REDUCED ? 0 : (Math.sin(t / 700) * .5 + .5) * .012;
    const e1 = ease(clamp((p - .03) / .26));   // title splits
    const e2 = ease(clamp((p - .22) / .26));   // slit opens to the frame
    const e4 = ease(clamp((p - .46) / .28));   // seam sweeps in
    const e3 = ease(clamp((p - .66) / .14));   // caption + shot list
    const gap = (e1 * .3 + idle) * vh;

    top.style.transform = `translate3d(${-e1 * 3}vw, ${-gap}px, 0)`;
    bottom.style.transform = `translate3d(${e1 * 3}vw, ${gap}px, 0)`;
    top.style.opacity = bottom.style.opacity = 1 - e2 * 1.2;
    kicker.style.opacity = hint.style.opacity = 1 - e1 * 2;

    // Slit: from the title out to the film frame
    s.frame = frameRect(vw, vh, SRC_W, SRC_H);
    const f = s.frame;
    const box = ttl.getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    const L = lerp(cx - box.width / 2, f.x, e2);
    const R = lerp(cx + box.width / 2, f.x + f.w, e2);
    const T = lerp(cy - gap * .92, f.y, e2);
    const B = lerp(cy + gap * .92, f.y + f.h, e2);
    stage.style.clipPath = `inset(${T}px ${vw - R}px ${vh - B}px ${L}px round ${lerp(6, 0, e2)}px)`;

    // Seam: scroll drives it in, then the visitor can take over
    const isLive = e4 > .98;
    section.classList.toggle('live', isLive);
    if (!isLive) s.pointerSeam = null;
    const target = s.pointerSeam ?? lerp(1.12, .5, e4);
    s.seam = lerp(s.seam, target, s.pointerSeam === null ? .25 : .22);

    caption.style.opacity = list.style.opacity = e3;
    caption.style.transform = `translateY(${(1 - e3) * 30}px)`;
    caption.style.pointerEvents = list.style.pointerEvents = e3 > .5 ? 'auto' : 'none';

    draw();
    placeSeamLabels();
    markShot();
  };

  return s;
}


/* Title fitting: each title fills ~90% of the width (same rule as the home page) */
function fitTitles() {
  $$('.process .ttl').forEach(ttl => {
    ttl.style.fontSize = '100px';
    const size = Math.min(260, 100 * innerWidth * .9 / ttl.scrollWidth);
    ttl.style.fontSize = size + 'px';
    ttl.closest('.stick').style.setProperty('--th', size * .9 + 'px');
  });
}

const sections = $$('.process').map(setupSection);

fitTitles();
document.fonts?.ready.then(fitTitles);
addEventListener('resize', fitTitles, { passive: true });
startGrain();

document.addEventListener('visibilitychange', () => {
  sections.forEach(s => {
    if (document.hidden) s.video.pause();
    else if (s.visible) s.video.play().catch(() => {});
  });
});

(function loop(t) {
  sections.forEach(s => s.visible && s.update(t));
  requestAnimationFrame(loop);
})(performance.now());
