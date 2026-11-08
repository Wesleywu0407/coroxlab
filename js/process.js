/* =========================================================
   COROX Films — Process act ("Grey boxes")
   One clip holds the Blender previs (left half) and the final
   film (right half), frame-synced. Both halves are drawn onto
   one canvas, split by a slanted seam at the angle of the X.

   Scroll:  title splits → slit opens on the previs →
            the seam sweeps in and turns it into the film.
   Then:    the seam follows the pointer (drag on touch).
   ========================================================= */

const $ = (sel, el = document) => el.querySelector(sel);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const section = $('#process');
if (section) {
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
  const items = [...section.querySelectorAll('.pr-shots button')];
  const soundBtn = $('#prSound');

  const SRC_W = 720, SRC_H = 1280;          // each half of the clip
  const SLANT = .2;                          // seam lean, as a share of frame height
  const SHOTS = [0, 2.417, 4.625, 6.333, 7.333];
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seam = 1.1;            // 0 = all final, 1 = all previs (share of frame width)
  let target = 1.1;
  let pointerSeam = null;    // set while the visitor is steering the seam
  let frame = { x: 0, y: 0, w: 0, h: 0 };
  let visible = false;
  let loaded = false;

  /* Size the canvas to the screen (capped pixel ratio keeps it light) */
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  /* Where the film sits: full screen on tall screens, a 9:16 column on wide ones */
  function frameRect(vw, vh) {
    if (vw / vh < .75) return { x: 0, y: 0, w: vw, h: vh, full: true };
    const h = vh, w = Math.round(vh * 9 / 16);
    return { x: Math.round((vw - w) / 2), y: 0, w, h, full: false };
  }

  /* Draw one half of the clip into the frame, cover-fit */
  function drawHalf(half, f) {
    const s = Math.max(f.w / SRC_W, f.h / SRC_H);
    const dw = SRC_W * s, dh = SRC_H * s;
    ctx.drawImage(video, half * SRC_W, 0, SRC_W, SRC_H, f.x + (f.w - dw) / 2, f.y + (f.h - dh) / 2, dw, dh);
  }

  function draw() {
    const vw = innerWidth, vh = innerHeight;
    ctx.clearRect(0, 0, vw, vh);
    if (video.readyState < 2) return;
    const f = frame;
    ctx.save();
    ctx.beginPath(); ctx.rect(f.x, f.y, f.w, f.h); ctx.clip();
    drawHalf(0, f);                                         // previs underneath
    const lean = f.h * SLANT / 2;
    const sx = f.x + f.w * seam;
    ctx.beginPath();                                        // final to the right of the seam
    ctx.moveTo(sx + lean, f.y);
    ctx.lineTo(f.x + f.w + lean * 2, f.y);
    ctx.lineTo(f.x + f.w + lean * 2, f.y + f.h);
    ctx.lineTo(sx - lean, f.y + f.h);
    ctx.closePath();
    ctx.save(); ctx.clip(); drawHalf(1, f); ctx.restore();
    if (seam > -.2 && seam < 1.2) {                         // the seam itself
      ctx.strokeStyle = 'rgba(231,227,216,.95)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + lean, f.y); ctx.lineTo(sx - lean, f.y + f.h); ctx.stroke();
    }
    ctx.restore();
  }

  /* Labels ride along the seam */
  function placeSeamLabels() {
    const f = frame;
    const lean = f.h * SLANT / 2;
    const x = f.x + f.w * seam + lean * .52;                // about a quarter of the way down
    seamEl.style.transform = `translate3d(${x}px, ${f.y + f.h * .24}px, 0)`;
    seamEl.style.opacity = seam > .02 && seam < .98 ? 1 : 0;
    // Drop a label once its side is too narrow to hold it
    tagL.style.opacity = seam > .3 ? 1 : 0;
    tagR.style.opacity = seam < .7 ? 1 : 0;
  }

  /* Visitor steering: hover on desktop, horizontal drag on touch */
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const toSeam = e => clamp((e.clientX - frame.x) / frame.w, 0, 1);
  stage.addEventListener('pointermove', e => {
    if (!section.classList.contains('live')) return;
    if (fine.matches || e.pressure > 0) pointerSeam = toSeam(e);
  });
  stage.addEventListener('pointerdown', e => {
    if (section.classList.contains('live')) pointerSeam = toSeam(e);
  });
  stage.addEventListener('pointerleave', () => { if (fine.matches) pointerSeam = null; });
  stage.addEventListener('pointercancel', () => { pointerSeam = null; });

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
    $('#prShot').textContent = items[i]?.dataset.name || '';
  }

  soundBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted) video.play().catch(() => {});
    soundBtn.textContent = video.muted ? 'SOUND ON' : 'SOUND OFF';
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
  });

  /* Load and play only near the screen */
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      if (!loaded) { video.src = video.dataset.src; loaded = true; }
      if (!document.querySelector('#theater')?.open) video.play().catch(() => {});
    } else {
      video.pause();
      if (!video.muted) { video.muted = true; soundBtn.textContent = 'SOUND ON'; soundBtn.setAttribute('aria-pressed', 'false'); }
    }
  }, { rootMargin: '40% 0px' }).observe(section);

  document.querySelector('#theater')?.addEventListener('close', () => { if (visible) video.play().catch(() => {}); });
  document.querySelector('#theater')?.addEventListener('toggle', e => { if (e.newState === 'open') video.pause(); });

  /* Scroll timeline */
  function update(now) {
    const r = section.getBoundingClientRect();
    const vw = innerWidth, vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) return;

    const p = clamp(-r.top / (r.height - vh));
    const idle = REDUCED ? 0 : (Math.sin(now / 700) * .5 + .5) * .012;
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
    frame = frameRect(vw, vh);
    const box = ttl.getBoundingClientRect();
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    const L = lerp(cx - box.width / 2, frame.x, e2);
    const R = lerp(cx + box.width / 2, frame.x + frame.w, e2);
    const T = lerp(cy - gap * .92, frame.y, e2);
    const B = lerp(cy + gap * .92, frame.y + frame.h, e2);
    stage.style.clipPath = `inset(${T}px ${vw - R}px ${vh - B}px ${L}px round ${lerp(6, 0, e2)}px)`;

    // Seam: scroll drives it in, then the visitor can take over
    const live = e4 > .98;
    section.classList.toggle('live', live);
    if (!live) pointerSeam = null;
    target = pointerSeam ?? lerp(1.12, .5, e4);
    seam = lerp(seam, target, pointerSeam === null ? .25 : .22);

    caption.style.opacity = list.style.opacity = e3;
    caption.style.transform = `translateY(${(1 - e3) * 30}px)`;
    caption.style.pointerEvents = list.style.pointerEvents = e3 > .5 ? 'auto' : 'none';

    draw();
    placeSeamLabels();
    markShot();
  }

  (function loop(now) {
    if (visible) update(now);
    requestAnimationFrame(loop);
  })(performance.now());
}
