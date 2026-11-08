import { FILMS } from './films.js';
import { openTheater, theaterOpen } from './player.js';

const grid = document.querySelector('#films');
const previewOnHover = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');

FILMS.forEach((film, index) => {
  const card = document.createElement('article');
  card.className = 'film-card';
  card.id = 'file-' + film.id;
  card.innerHTML = `
    <button class="film-frame" aria-label="Watch ${film.title} with sound">
      <img src="${film.still}" alt="${film.stillAlt}" loading="${index < 2 ? 'eager' : 'lazy'}">
      <video class="film-preview" muted playsinline loop preload="none" aria-hidden="true"></video>
      <span class="play-mark" aria-hidden="true">▶</span>
    </button>
    <div class="file-meta"><span>File ${film.id} · ${film.place}</span><span>${film.dur}</span></div>
    <h2>${film.title}</h2>
    <p class="synopsis">${film.description}</p>
    <dl><dt>AI video model</dt><dd>${film.model}</dd><dt>Production</dt><dd>${film.production}</dd></dl>`;
  const button = card.querySelector('button');
  const preview = card.querySelector('video');
  button.addEventListener('click', () => openTheater(index));
  button.addEventListener('pointerenter', () => {
    if (!previewOnHover.matches || theaterOpen()) return;
    if (!preview.src) preview.src = film.src;
    preview.play().catch(() => {});
  });
  preview.addEventListener('playing', () => {
    button.classList.toggle('previewing', !preview.paused && button.matches(':hover') && !theaterOpen());
  });
  preview.addEventListener('pause', () => button.classList.remove('previewing'));
  button.addEventListener('pointerleave', () => preview.pause());
  grid.append(card);
});
