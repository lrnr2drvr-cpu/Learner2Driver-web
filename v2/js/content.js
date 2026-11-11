// Site wording. The page's HTML holds the default text; the instructor's edits are
// stored in Supabase as rows named "v2_<key>" and replace the text of any element
// marked data-key="<key>". Text only, never HTML.
import { config, readTable, store } from './config.js';

const CACHE = 'l2d_v2_content';
const PREFIX = 'v2_';
// Replacement photographs are only ever loaded from the site's own storage.
const PHOTOS = `${config.supabaseUrl}/storage/v1/object/public/site/`;

function apply(map) {
  document.querySelectorAll('[data-key]').forEach((el) => {
    const value = map[PREFIX + el.dataset.key];
    if (typeof value === 'string' && value.trim() !== '') el.textContent = value;
  });
  document.querySelectorAll('img[data-img]').forEach((img) => {
    const address = map[`${PREFIX}img_${img.dataset.img}`];
    if (typeof address === 'string' && address.startsWith(PHOTOS) && img.src !== address) img.src = address;
  });
}

// Shows the last known edits straight away, then refreshes them. Returns every row
// fetched (the edits plus the few settings other modules need), keyed by name.
export async function loadContent() {
  const cached = store.get(CACHE);
  if (cached) apply(cached);

  const rows = await readTable('site_settings?select=key,value&or=(key.like.v2_*,key.eq.google_reviews_config)');
  if (!rows.length) return cached || {};

  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  apply(map);
  const edits = Object.fromEntries(Object.entries(map).filter(([key]) => key.startsWith(PREFIX)));
  store.set(CACHE, edits);
  return map;
}
