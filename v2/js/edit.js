// Click-to-edit for the signed-in instructor: wording, route spots and pins, and photographs.
// Everything saved is plain text or an image address; the database checks the instructor's
// token on every save.
import { config } from './config.js';
import { authed, signOut } from './auth.js';
import { refreshBooking } from './booking.js';
import { editPins } from './routes.js';

const PREFIX = 'v2_';
let status;

function say(text, problem = false) {
  if (!status) return;
  status.textContent = text;
  status.classList.toggle('is-problem', problem);
}

async function upsert(table, conflict, row) {
  const res = await authed(`/rest/v1/${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{ ...row, updated_at: new Date().toISOString() }]),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.message || `The server answered ${res.status}.`);
  }
}

async function save(label, work) {
  say(`Saving ${label}…`);
  try {
    await work();
    say(`Saved ${label}.`);
    return true;
  } catch (error) {
    say(`${label} was not saved. ${error.message}`, true);
    return false;
  }
}

// Makes an element editable as plain text. `commit` receives the new text and
// resolves to true when it was saved; otherwise the old text comes back.
function editable(el, commit) {
  let before = '';
  el.setAttribute('contenteditable', 'plaintext-only');
  if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
  el.setAttribute('spellcheck', 'true');
  el.classList.add('is-editable');
  el.addEventListener('focus', () => { before = el.textContent; });
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); el.blur(); }
    if (event.key === 'Escape') { el.textContent = before; el.blur(); }
  });
  el.addEventListener('blur', async () => {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text || text === before.trim()) { el.textContent = before; return; }
    el.textContent = text;
    if (!(await commit(text))) el.textContent = before;
  });
  // A link or label that is being edited must not also be followed or toggled.
  el.addEventListener('click', (event) => { if (el.closest('a, label')) event.preventDefault(); });
}

function editWording() {
  document.querySelectorAll('[data-key]').forEach((el) => {
    const key = el.dataset.key;
    editable(el, (text) => save('the wording', async () => {
      await upsert('site_settings', 'key', { key: PREFIX + key, value: text });
      document.querySelectorAll(`[data-key="${key}"]`).forEach((twin) => { if (twin !== el) twin.textContent = text; });
      refreshBooking();
    }));
  });
}

function editRoutes() {
  document.querySelectorAll('#spots input[name="spot"]').forEach((input) => {
    const id = Number(input.value);
    const label = document.querySelector(`label[for="${input.id}"]`);
    const tip = document.querySelector(`.tip--${id}`);
    if (!label || !tip) return;
    const title = tip.querySelector('h3');
    const text = tip.querySelector('p');

    const saveTitle = (el, twin) => editable(el, (value) => save('the spot', async () => {
      await upsert('preston_routes', 'spot_id', { spot_id: id, title: value });
      twin.textContent = value;
    }));
    saveTitle(label, title);
    saveTitle(title, label);
    editable(text, (value) => save('the tip', () => upsert('preston_routes', 'spot_id', { spot_id: id, tip: value })));
  });

  editPins((id, lat, lng) => save('the pin', () => upsert('preston_routes', 'spot_id', { spot_id: id, lat, lng })));
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

      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.hidden = true;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'replace glass';
      button.dataset.keep = '';
      button.dataset.for = name;
      button.textContent = 'Replace photo';
      button.addEventListener('click', () => picker.click());

      picker.addEventListener('change', () => {
        const file = picker.files[0];
        if (!file) return;
        save('the photo', async () => {
          const blob = await shrink(file);
          const res = await authed(`/storage/v1/object/site/${name}.jpg`, {
            method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob,
          });
          if (!res.ok) throw new Error(res.status === 404 || res.status === 400 ? 'Photo storage is not set up yet.' : `The server answered ${res.status}.`);
          const address = `${config.supabaseUrl}/storage/v1/object/public/site/${name}.jpg?v=${Date.now()}`;
          await upsert('site_settings', 'key', { key: `${PREFIX}img_${name}`, value: address });
          document.querySelectorAll(`img[data-img="${name}"]`).forEach((twin) => { twin.src = address; });
        });
        picker.value = '';
      });

      figure.append(button, picker);
    });
  });
}

export function startEditing(email) {
  if (document.getElementById('editbar')) return;
  document.documentElement.classList.add('is-editing');

  const bar = document.createElement('div');
  bar.id = 'editbar';
  bar.className = 'editbar glass';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Editing');

  const who = document.createElement('span');
  who.className = 'editbar__who';
  who.textContent = `Editing as ${email || 'instructor'}`;

  status = document.createElement('span');
  status.className = 'editbar__status';
  status.setAttribute('role', 'status');
  status.textContent = 'Click any outlined text to change it.';

  const leave = document.createElement('button');
  leave.type = 'button';
  leave.className = 'btn btn--small';
  leave.textContent = 'Sign out';
  leave.addEventListener('click', async () => { await signOut(); window.location.reload(); });

  bar.append(who, status, leave);
  document.body.append(bar);

  editWording();
  editRoutes();
  editPhotos();
}
