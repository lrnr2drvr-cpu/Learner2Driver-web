// Site wording. The page's HTML holds the default text; the instructor's edits are
// stored in Supabase as rows named "v2_<key>" and replace the text of any element
// marked data-key="<key>". Text only, never HTML.
import { config, readTable, store } from './config.js';

const CACHE = 'l2d_v2_content';
const PREFIX = 'v2_';
// Replacement photographs are only ever loaded from the site's own storage.
const PHOTOS = `${config.supabaseUrl}/storage/v1/object/public/site/`;
const PHONE = '07427330827'; // used if the saved number is ever not a usable one

// The phone number as dialled, taken from the one place it is written on the page.
export function phoneDigits() {
  const el = document.querySelector('[data-key="phone"]');
  const digits = (el ? el.textContent : '').replace(/\D/g, '');
  return /^0\d{9,10}$/.test(digits) ? digits : PHONE;
}

export function whatsappNumber() {
  return `44${phoneDigits().slice(1)}`;
}

// Every call link, WhatsApp link and printed number follows the one editable number.
export function syncPhone() {
  const source = document.querySelector('[data-key="phone"]');
  if (!source) return;
  const digits = phoneDigits();
  const shown = source.textContent.trim();
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => { link.href = `tel:${digits}`; });
  document.querySelectorAll('[data-phone]').forEach((el) => { el.textContent = shown; });
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
    const query = link.href.indexOf('?');
    link.href = `https://wa.me/${whatsappNumber()}${query > -1 ? link.href.slice(query) : ''}`;
  });
}

function apply(map) {
  document.querySelectorAll('[data-key]').forEach((el) => {
    // Remember the built-in wording once, so an edit can always be taken back to it.
    if (el.dataset.default === undefined) el.dataset.default = el.textContent;
    const value = map[PREFIX + el.dataset.key];
    el.textContent = typeof value === 'string' && value.trim() !== '' ? value : el.dataset.default;
  });
  document.querySelectorAll('img[data-img]').forEach((img) => {
    const address = map[`${PREFIX}img_${img.dataset.img}`];
    if (typeof address === 'string' && address.startsWith(PHOTOS) && img.src !== address) img.src = address;
  });
  syncPhone();
}

// Shows the last known edits straight away, then refreshes them. Returns every row
// fetched (the edits plus the few settings other modules need), keyed by name.
export async function loadContent() {
  const cached = store.get(CACHE);
  if (cached) apply(cached);

  const rows = await readTable('site_settings?select=key,value&or=(key.like.v2_*,key.eq.google_reviews_config)');
  if (!rows.length) return cached || {};

  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  // While the instructor is editing, the page is the truth: never write over it.
  if (!document.documentElement.classList.contains('is-editing')) apply(map);
  const edits = Object.fromEntries(Object.entries(map).filter(([key]) => key.startsWith(PREFIX)));
  store.set(CACHE, edits);
  return map;
}
