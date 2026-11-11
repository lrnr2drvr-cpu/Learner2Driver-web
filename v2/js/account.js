// The instructor sign-in dialog. Visitors never load the editing code: it is fetched
// only after a successful sign-in, or when a saved session is found.
import { signIn, hasSession, getSession } from './auth.js';

async function startEditing() {
  const session = await getSession();
  if (!session) return false;
  const { startEditing: start } = await import('./edit.js');
  start(session.email);
  return true;
}

export function initAccount() {
  const dialog = document.getElementById('signin');
  const open = document.getElementById('open-signin');
  const form = document.getElementById('signin-form');
  const error = document.getElementById('si-error');
  if (!dialog || !open || !form) return;

  open.addEventListener('click', async () => {
    if (hasSession() && await startEditing()) return;
    error.textContent = '';
    dialog.showModal();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    error.textContent = '';
    const result = await signIn(form.elements.email.value.trim(), form.elements.password.value);
    button.disabled = false;
    if (!result.ok) { error.textContent = result.error; return; }
    form.reset();
    dialog.close();
    startEditing();
  });

  if (hasSession()) startEditing();
}
