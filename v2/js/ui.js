// Small interface behaviours: the entrance on scroll, the current nav link,
// the phone menu, the car hotspots and the readiness score.
import { readTable } from './config.js';

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One entrance, used everywhere. Content is visible without script.
export function initReveal() {
  const items = document.querySelectorAll('.reveal');
  const showAll = () => items.forEach((el) => el.classList.add('is-in'));
  if (!('IntersectionObserver' in window)) { showAll(); return; }
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); seen.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => seen.observe(el));
  setTimeout(showAll, 4000);
}

// Marks the nav link for the section being read.
export function initNav() {
  const links = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        const on = link.getAttribute('href') === `#${entry.target.id}`;
        if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach((section) => spy.observe(section));

  // The phone menu closes when a link is chosen or Escape is pressed.
  const menu = document.querySelector('.menu');
  if (!menu) return;
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) menu.open = false; });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') menu.open = false; });
}

// Car hotspots: a dot on the photo opens a short note. Saved hotspots replace the built-in one.
function wireHotspot(dot) {
  const note = document.getElementById(dot.getAttribute('aria-controls'));
  if (!note) return;
  dot.addEventListener('click', () => {
    const open = dot.getAttribute('aria-expanded') === 'true';
    dot.setAttribute('aria-expanded', String(!open));
    note.hidden = open;
  });
}

function hotspotNodes(car, spot, index) {
  const id = `hs-${car}-${index + 1}`;
  const place = `--x: ${Number(spot.x)}%; --y: ${Number(spot.y)}%`;

  const dot = document.createElement('button');
  dot.className = 'hotspot';
  dot.type = 'button';
  dot.dataset.keep = '';
  dot.style.cssText = place;
  dot.setAttribute('aria-expanded', 'false');
  dot.setAttribute('aria-controls', id);
  const label = document.createElement('span');
  label.className = 'visually-hidden';
  label.textContent = spot.title;
  dot.append(label);

  const note = document.createElement('div');
  note.className = 'hotspot__note glass';
  note.id = id;
  note.dataset.keep = '';
  note.hidden = true;
  note.style.cssText = place;
  const title = document.createElement('strong');
  title.textContent = spot.title;
  const text = document.createElement('span');
  text.textContent = spot.desc || '';
  note.append(title, text);

  return [dot, note];
}

export async function initHotspots() {
  document.querySelectorAll('.hotspot').forEach(wireHotspot);

  const rows = await readTable('fleet_hotspots?select=vehicle_id,hotspots');
  rows.forEach((row) => {
    const figure = document.querySelector(`[data-car="${row.vehicle_id}"]`);
    const spots = (Array.isArray(row.hotspots) ? row.hotspots : [])
      .filter((spot) => spot && spot.title && Number.isFinite(Number(spot.x)) && Number.isFinite(Number(spot.y)));
    if (!figure || !spots.length) return;
    figure.querySelectorAll('.hotspot, .hotspot__note').forEach((el) => el.remove());
    spots.forEach((spot, index) => {
      const [dot, note] = hotspotNodes(row.vehicle_id, spot, index);
      figure.append(dot, note);
      wireHotspot(dot);
    });
  });
}

// Readiness score: the same sum the previous site used, shown as a score out of 100.
export function initQuiz() {
  const hours = document.getElementById('q-hours');
  const man = document.getElementById('q-man');
  const rnd = document.getElementById('q-rnd');
  const out = document.getElementById('q-score');
  const note = document.getElementById('q-note');
  if (!hours || !man || !rnd || !out) return;

  let shown = Number(out.textContent);
  let frame;

  function fill(input) {
    const span = input.max - input.min;
    input.style.setProperty('--fill', `${((input.value - input.min) / span) * 100}%`);
  }

  function update() {
    const theory = Number(document.querySelector('input[name="theory"]:checked').value);
    document.getElementById('o-hours').textContent = hours.value;
    document.getElementById('o-man').textContent = `${man.value} of 5`;
    document.getElementById('o-rnd').textContent = `${rnd.value} of 5`;
    [hours, man, rnd].forEach(fill);

    const total = Math.min(Math.round(Math.min(Number(hours.value), 45) + theory + (man.value / 5) * 20 + (rnd.value / 5) * 20), 98);
    if (note) {
      note.textContent = total >= 85 ? 'You sound ready. A mock test with us will confirm it.'
        : total >= 60 ? 'Nearly there. A mock test with us will show what is left.'
          : 'Early days. A few more lessons will move this quickly.';
    }

    cancelAnimationFrame(frame);
    if (still) { shown = total; out.textContent = total; return; }
    (function step() {
      if (shown === total) return;
      shown += shown < total ? 1 : -1;
      out.textContent = shown;
      frame = requestAnimationFrame(step);
    }());
  }

  [hours, man, rnd].forEach((input) => input.addEventListener('input', update));
  document.getElementById('q-theory').addEventListener('change', update);
  update();
}
