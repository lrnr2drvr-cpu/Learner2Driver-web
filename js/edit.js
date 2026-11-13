// Click-to-edit for the signed-in instructor: wording, prices, the phone number, route
// spots and pins, car hotspots and photographs.
//
// How it stays safe:
//   - Only plain text and image addresses are ever saved, and the database checks the
//     instructor's token on every save.
//   - Each field has rules (a price is a whole number, a phone number is a phone number,
//     text has a length limit). A value that breaks them is refused before it is sent.
//   - If a save fails, the typed text stays on the page, is marked as not saved, and can
//     be retried. Nothing is silently lost.
//   - Every change can be undone, and any wording can be put back to the built-in original.
import { config } from './config.js';
import { authed, signOut } from './auth.js';
import { syncPhone, paintBrandLetters } from './content.js';
import { refreshBooking } from './booking.js';
import { editPins } from './routes.js';
import { editHotspots } from './edit-hotspots.js';

const PREFIX = 'v2_';
const RULES = { price_hour: 'number', price_block: 'number', price_block_was: 'number', phone: 'phone' };

const starting = new WeakMap(); // element -> its text when editing of it began
const unsaved = new Map(); // element -> function that tries its save again
const undos = [];          // most recent last: { label, run }
let bar = {};
let lastField = null;

function say(text, problem = false) {
  if (!bar.status) return;
  bar.status.textContent = text;
  bar.status.classList.toggle('is-problem', problem);
}

function refreshBar() {
  if (!bar.undo) return;
  bar.undo.disabled = undos.length === 0;
  bar.retry.hidden = unsaved.size === 0;
  const changed = lastField && lastField.isConnected && lastField.dataset.default !== undefined
    && lastField.textContent.trim() !== lastField.dataset.default.trim();
  bar.restore.disabled = !changed;
}

export function pushUndo(label, run) {
  undos.push({ label, run });
  if (undos.length > 30) undos.shift();
  refreshBar();
}

async function request(path, options) {
  const res = await authed(path, { keepalive: true, ...options });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.message || `The server answered ${res.status}.`);
  }
}

export function upsert(table, conflict, row) {
  return request(`/rest/v1/${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ ...row, updated_at: new Date().toISOString() }]),
  });
}

function removeSetting(key) {
  return request(`/rest/v1/site_settings?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE' });
}

// Runs a save and reports it. Resolves to true when it worked.
export async function save(label, work) {
  say(`Saving ${label}…`);
  try {
    await work();
    say(`Saved ${label}.`);
    return true;
  } catch (error) {
    say(`${label[0].toUpperCase()}${label.slice(1)} was not saved. ${error.message}`, true);
    return false;
  }
}

function problemWith(kind, text) {
  if (kind === 'number' && !(/^\d{1,4}$/.test(text) && Number(text) > 0)) return 'Use a whole number, like 38.';
  if (kind === 'phone' && !/^0\d{9,10}$/.test(text.replace(/\D/g, ''))) return 'Use a UK phone number, like 07427 330827.';
  return '';
}

// Makes an element editable as plain text.
//   commit(text, before) saves the change; it may return a function that undoes it.
//   kind and max are the field's rules.
export function editable(el, { label = 'the wording', commit, kind = 'text', max = 200 }) {
  const begun = () => starting.get(el) ?? '';
  el.setAttribute('contenteditable', 'plaintext-only');
  if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
  el.setAttribute('spellcheck', kind === 'text' ? 'true' : 'false');
  el.classList.add('is-editable');

  async function attempt(text, from) {
    let undo;
    const ok = await save(label, async () => { undo = await commit(text, from); });
    if (ok) {
      el.classList.remove('is-unsaved');
      unsaved.delete(el);
      if (typeof undo === 'function') pushUndo(label, undo);
    } else {
      // Keep what was typed, flag it, and let it be sent again. The last saved text
      // stays the point of comparison for whatever is typed next.
      starting.set(el, from);
      el.classList.add('is-unsaved');
      unsaved.set(el, () => attempt(el.textContent.replace(/\s+/g, ' ').trim(), from));
    }
    refreshBar();
  }

  el.addEventListener('focus', () => {
    if (el.firstElementChild) el.textContent = el.textContent; // plain text while typing
    if (!unsaved.has(el)) starting.set(el, el.textContent);
    lastField = el;
    refreshBar();
  });
  el.addEventListener('input', () => {
    if (el.textContent.length > max) {
      el.textContent = el.textContent.slice(0, max);
      say(`That is the longest this can be (${max} characters).`, true);
    }
  });
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); el.blur(); }
    if (event.key === 'Escape') { el.textContent = begun(); el.classList.remove('is-unsaved'); unsaved.delete(el); el.blur(); }
  });
  el.addEventListener('blur', () => {
    const before = begun();
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text || text === before.trim()) {
      if (!unsaved.has(el)) el.textContent = before;
      refreshBar();
      setTimeout(paintBrandLetters);
      return;
    }
    const problem = problemWith(kind, text);
    if (problem) { el.textContent = before; say(problem, true); refreshBar(); return; }
    el.textContent = text;
    starting.set(el, text); // a later blur with the same text is not a new change
    attempt(text, before.trim());
  });
  // A link that is being edited must not also be followed. (A route spot's label still
  // selects its spot, which is how the instructor reaches the other spots' tips.)
  el.addEventListener('click', (event) => { if (el.closest('a')) event.preventDefault(); });
}

// Shows a wording value everywhere it appears, and updates what depends on it.
function showWording(key, text) {
  document.querySelectorAll(`[data-key="${key}"]`).forEach((twin) => { twin.textContent = text; });
  syncPhone();
  refreshBooking();
  setTimeout(paintBrandLetters);
}

// Saves a wording value. A value equal to the built-in original removes the saved row.
async function storeWording(key, text, original) {
  if (text === original) await removeSetting(PREFIX + key);
  else await upsert('site_settings', 'key', { key: PREFIX + key, value: text });
}

function editWording() {
  document.querySelectorAll('[data-key]').forEach((el) => {
    const key = el.dataset.key;
    if (el.dataset.default === undefined) el.dataset.default = el.textContent;
    const original = el.dataset.default.replace(/\s+/g, ' ').trim();
    editable(el, {
      kind: RULES[key] || 'text',
      max: el.matches('h1, h2, h3') ? 70 : 200,
      commit: async (text, before) => {
        await storeWording(key, text, original);
        showWording(key, text);
        return async () => { await storeWording(key, before, original); showWording(key, before); };
      },
    });
  });
}

function restoreOriginal() {
  const el = lastField;
  if (!el || el.dataset.default === undefined) return;
  const key = el.dataset.key;
  const original = el.dataset.default.replace(/\s+/g, ' ').trim();
  const before = el.textContent.replace(/\s+/g, ' ').trim();
  if (before === original) return;
  save('the original wording', async () => {
    await removeSetting(PREFIX + key);
    showWording(key, original);
    starting.set(el, original);
    el.classList.remove('is-unsaved');
    unsaved.delete(el);
    pushUndo('the original wording', async () => { await storeWording(key, before, original); showWording(key, before); });
  }).then(refreshBar);
}

function editRoutes() {
  document.querySelectorAll('#spots input[name="spot"]').forEach((input) => {
    const id = Number(input.value);
    const label = document.querySelector(`label[for="${input.id}"]`);
    const tip = document.querySelector(`.tip--${id}`);
    if (!label || !tip) return;
    const title = tip.querySelector('h3');
    const text = tip.querySelector('p');

    const showTitle = (value) => { label.textContent = value; title.textContent = value; };
    const titleField = (el) => editable(el, {
      label: 'the spot',
      max: 60,
      commit: async (value, before) => {
        await upsert('preston_routes', 'spot_id', { spot_id: id, title: value });
        showTitle(value);
        return async () => { await upsert('preston_routes', 'spot_id', { spot_id: id, title: before }); showTitle(before); };
      },
    });
    titleField(label);
    titleField(title);
    editable(text, {
      label: 'the tip',
      max: 240,
      commit: async (value, before) => {
        await upsert('preston_routes', 'spot_id', { spot_id: id, tip: value });
        return async () => { await upsert('preston_routes', 'spot_id', { spot_id: id, tip: before }); text.textContent = before; };
      },
    });
  });

  editPins(async (id, to, from, moveBack) => {
    const ok = await save('the pin', () => upsert('preston_routes', 'spot_id', { spot_id: id, lat: to.lat, lng: to.lng }));
    if (!ok) { moveBack(); return; }
    pushUndo('the pin', async () => {
      await upsert('preston_routes', 'spot_id', { spot_id: id, lat: from.lat, lng: from.lng });
      moveBack();
    });
  });
}

// Shrinks a chosen photograph in the browser so uploads stay small.
async function shrink(file, longest = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, longest / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => { canvas.toBlob(resolve, 'image/jpeg', 0.86); });
}

function editPhotos() {
  const names = new Set(Array.from(document.querySelectorAll('img[data-img]')).map((img) => img.dataset.img));
  names.forEach((name) => {
    document.querySelectorAll(`img[data-img="${name}"]`).forEach((img) => {
      const figure = img.closest('figure');
      // The hero shows the same two photographs as the cars section; they are replaced there.
      if (!figure || figure.closest('#hero-cars') || figure.querySelector(`.replace[data-for="${name}"]`)) return;

      const picker = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*', hidden: true });
      const button = Object.assign(document.createElement('button'), { type: 'button', className: 'replace glass', textContent: 'Replace photo' });
      button.dataset.keep = '';
      button.dataset.for = name;
      button.addEventListener('click', () => picker.click());

      picker.addEventListener('change', () => {
        const file = picker.files[0];
        if (!file) return;
        const setting = `${PREFIX}img_${name}`;
        const before = img.getAttribute('src');
        const show = (address) => document.querySelectorAll(`img[data-img="${name}"]`).forEach((twin) => { twin.src = address; });
        save('the photo', async () => {
          const blob = await shrink(file);
          // Each upload gets its own file, so the previous photograph is still there to go back to.
          const path = `${name}-${Date.now()}.jpg`;
          const res = await authed(`/storage/v1/object/site/${path}`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob });
          if (!res.ok) throw new Error(res.status === 404 || res.status === 400 ? 'Photo storage is not set up yet.' : `The server answered ${res.status}.`);
          const address = `${config.supabaseUrl}/storage/v1/object/public/site/${path}`;
          await upsert('site_settings', 'key', { key: setting, value: address });
          show(address);
          pushUndo('the photo', async () => {
            if (before.startsWith(config.supabaseUrl)) await upsert('site_settings', 'key', { key: setting, value: before });
            else await removeSetting(setting);
            show(before);
          });
        });
        picker.value = '';
      });

      figure.append(button, picker);
    });
  });
}

function button(text, quiet = true) {
  return Object.assign(document.createElement('button'), { type: 'button', className: quiet ? 'btn btn--small btn--quiet' : 'btn btn--small', textContent: text });
}

export function startEditing(email) {
  if (document.getElementById('editbar')) return;
  document.documentElement.classList.add('is-editing');

  const el = Object.assign(document.createElement('div'), { id: 'editbar', className: 'editbar glass' });
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Editing');

  const who = Object.assign(document.createElement('span'), { className: 'editbar__who', textContent: `Editing as ${email || 'instructor'}` });
  const status = Object.assign(document.createElement('span'), { className: 'editbar__status', textContent: 'Click any outlined text to change it.' });
  status.setAttribute('role', 'status');

  const retry = button('Try again', false);
  retry.hidden = true;
  retry.addEventListener('click', () => Array.from(unsaved.values()).forEach((again) => again()));

  const undo = button('Undo');
  undo.addEventListener('click', async () => {
    const last = undos.pop();
    if (!last) return;
    const ok = await save(`the undo of ${last.label}`, last.run);
    if (!ok) undos.push(last);
    refreshBar();
  });

  const restore = button('Restore original');
  // Keep the field in focus terms: the button acts on the field last clicked.
  restore.addEventListener('mousedown', (event) => event.preventDefault());
  restore.addEventListener('click', restoreOriginal);

  const leave = button('Sign out', false);
  leave.addEventListener('click', async () => {
    if (unsaved.size && !window.confirm('Some changes are not saved. Sign out anyway?')) return;
    await signOut();
    window.location.reload();
  });

  const desk = Object.assign(document.createElement('a'), { className: 'btn btn--small btn--quiet', href: 'course.html', textContent: 'Students and settings' });

  const actions = Object.assign(document.createElement('span'), { className: 'editbar__actions' });
  actions.append(retry, undo, restore, desk, leave);
  el.append(who, status, actions);
  document.body.append(el);
  bar = { status, retry, undo, restore };

  // Leaving with a field still open: finish it so it saves. Leaving with failed saves: warn.
  window.addEventListener('pagehide', () => { if (document.activeElement?.classList.contains('is-editable')) document.activeElement.blur(); });
  window.addEventListener('beforeunload', (event) => { if (unsaved.size) event.preventDefault(); });

  editWording();
  editRoutes();
  editPhotos();
  editHotspots({ editable, save, upsert, pushUndo });
  refreshBar();
}
