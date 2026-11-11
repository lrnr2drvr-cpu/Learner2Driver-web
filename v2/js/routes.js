// Test routes: four spots, each with a tip and a pin on the map.
// The spots in the HTML are the defaults; the instructor's saved versions replace them.
import { readTable } from './config.js';

const TILES = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles by <a href="https://www.hotosm.org/">HOT</a>';

// Saved titles look like "1. Golden Way Roundabout" and may hold HTML entities.
function plain(text) {
  const box = document.createElement('textarea');
  box.innerHTML = String(text || '');
  return box.value.replace(/^\s*\d+\.\s*/, '').replace(/\s+/g, ' ').trim();
}

function inputs() {
  return Array.from(document.querySelectorAll('#spots input[name="spot"]'));
}

async function applySaved() {
  const rows = await readTable('preston_routes?select=spot_id,title,tip,lat,lng&order=spot_id');
  rows.forEach((row) => {
    const input = document.getElementById(`s-${row.spot_id}`);
    const tip = document.querySelector(`.tip--${row.spot_id}`);
    if (!input || !tip) return;
    const title = plain(row.title);
    if (title) {
      document.querySelector(`label[for="${input.id}"]`).textContent = title;
      tip.querySelector('h3').textContent = title;
    }
    if (plain(row.tip)) tip.querySelector('p').textContent = plain(row.tip);
    if (Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
      input.dataset.lat = row.lat;
      input.dataset.lng = row.lng;
    }
  });
}

function buildMap() {
  const el = document.getElementById('map');
  if (!el || !window.L) return null;
  el.replaceChildren();

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = window.L.map(el, { scrollWheelZoom: false, zoomControl: true });
  window.L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

  const pins = inputs().map((input) => {
    const icon = window.L.divIcon({ className: 'pin', html: `<span>${input.value}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] });
    const pin = window.L.marker([Number(input.dataset.lat), Number(input.dataset.lng)], { icon, keyboard: false }).addTo(map);
    pin.on('click', () => { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); });
    return { input, pin };
  });

  // Leave room at the foot for the tip card that sits over the map on wide screens.
  const wide = window.matchMedia('(min-width: 60rem)').matches;
  map.fitBounds(window.L.latLngBounds(pins.map(({ pin }) => pin.getLatLng())), { paddingTopLeft: [48, 48], paddingBottomRight: [48, wide ? 220 : 48] });

  function show(move) {
    pins.forEach(({ input, pin }) => {
      const el = pin.getElement();
      if (el) el.classList.toggle('is-on', input.checked);
      if (input.checked && move) map.flyTo(pin.getLatLng(), 14, { animate: !still, duration: 0.8 });
    });
  }
  document.getElementById('spots').addEventListener('change', () => show(true));
  show(false);
  return map;
}

export async function initRoutes() {
  if (!document.getElementById('spots')) return;
  await applySaved();
  // Leaflet loads with "defer", so it may arrive after this module runs.
  if (window.L) buildMap();
  else window.addEventListener('load', buildMap, { once: true });
}
