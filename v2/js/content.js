// Site wording. The page's HTML holds the default text; the instructor's edits are
// stored in Supabase as rows named "v2_<key>" and replace the text of any element
// marked data-key="<key>". Text only, never HTML.
import { readTable, store } from './config.js';

const CACHE = 'l2d_v2_content';
const PREFIX = 'v2_';

function apply(map) {
  document.querySelectorAll('[data-key]').forEach((el) => {
    const value = map[PREFIX + el.dataset.key];
    if (typeof value === 'string' && value.trim() !== '') el.textContent = value;
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
