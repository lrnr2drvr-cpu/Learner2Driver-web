// Learn the area: four spots, each with a tip and a pin on the map.
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

let placed = [];
let pinMoved = null;

// A pin the signed-in instructor can drag to a new place.
function arm({ input, pin }) {
  if (!pinMoved || !pin.dragging || pin.dragging.enabled()) return;
  pin.dragging.enable();
  let from = pin.getLatLng();
  const place = (at) => {
    pin.setLatLng(at);
    input.dataset.lat = at.lat;
    input.dataset.lng = at.lng;
  };
  pin.on('dragstart', () => { from = pin.getLatLng(); });
  pin.on('dragend', () => {
    const to = pin.getLatLng();
    const back = from;
    place(to);
    // `undo` puts the pin back where it was on the map.
    pinMoved(Number(input.value), to, back, () => place(back));
  });
}

// Called by the editing code: `moved` receives the spot number, where the pin now is,
// where it was, and a function that moves it back on the map.
export function editPins(moved) {
  pinMoved = moved;
  placed.forEach(arm);
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
  // On a touch screen one finger scrolls the page past the map; the list, the pins,
  // the zoom buttons and a pinch still move it.
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const map = window.L.map(el, { scrollWheelZoom: false, zoomControl: true, dragging: !touch });
  window.L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

  const pins = inputs().map((input) => {
    const icon = window.L.divIcon({ className: 'pin', html: `<span>${input.value}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] });
    const pin = window.L.marker([Number(input.dataset.lat), Number(input.dataset.lng)], { icon, keyboard: false }).addTo(map);
    pin.on('click', () => { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); });
    return { input, pin };
  });
  placed = pins;
  placed.forEach(arm);

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

// The map library is served from this site and fetched only as the map comes near the screen.
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  const style = new Promise((resolve) => {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'vendor/leaflet/leaflet.css' });
    link.onload = resolve;
    link.onerror = resolve;
    // Placed ahead of the site's stylesheet, so the site's own rules for the map and its pins still win.
    const site = document.querySelector('link[rel="stylesheet"][href*="site.css"]');
    if (site) site.before(link); else document.head.prepend(link);
  });
  const script = new Promise((resolve, reject) => {
    const el = Object.assign(document.createElement('script'), { src: 'vendor/leaflet/leaflet.js' });
    el.onload = resolve;
    el.onerror = reject;
    document.head.append(el);
  });
  return Promise.all([style, script]);
}

export async function initRoutes() {
  const el = document.getElementById('map');
  if (!document.getElementById('spots') || !el) return;
  await applySaved();
  const start = () => loadLeaflet().then(buildMap).catch(() => { /* the fallback link to OpenStreetMap stays */ });
  if (!('IntersectionObserver' in window)) { start(); return; }
  const near = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    near.disconnect();
    start();
  }, { rootMargin: '800px 0px' });
  near.observe(el);
}
