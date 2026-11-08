/* =========================================================
   COROX Films — film grain
   Six noise tiles, cycled every 3rd frame on #grain.
   Shared by the home page and the Process page.
   ========================================================= */

export function startGrain() {
  const el = document.getElementById('grain');
  if (!el) return;

  const tiles = [];
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
    tiles.push(`url(${canvas.toDataURL()})`);
  }

  let index = 0;
  const step = () => {
    index = (index + 1) % tiles.length;
    el.style.backgroundImage = tiles[index];
    el.style.backgroundPosition = `${(Math.random() * 128) | 0}px ${(Math.random() * 128) | 0}px`;
  };
  step();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  (function loop() {
    if (++frame % 3 === 0) step();
    requestAnimationFrame(loop);
  })();
}
