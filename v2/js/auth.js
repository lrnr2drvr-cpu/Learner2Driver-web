// Instructor sign-in, straight against Supabase Auth. The database only accepts
// changes that carry a signed-in instructor's token; nothing here grants access by itself.
import { config, store } from './config.js';

const KEY = 'l2d_v2_session';
const headers = { apikey: config.supabaseKey, 'Content-Type': 'application/json' };

function clear() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

async function token(grant, body) {
  const res = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST', headers, body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.access_token) return null;
  return {
    access: data.access_token,
    refresh: data.refresh_token,
    expires: Date.now() + (data.expires_in || 3600) * 1000,
    email: data.user?.email || '',
  };
}

// The current session, refreshed if it is about to run out. null when signed out.
export async function getSession() {
  let session = store.get(KEY);
  if (!session) return null;
  if (session.expires - Date.now() < 60_000) {
    session = await token('refresh_token', { refresh_token: session.refresh }).catch(() => null);
    if (!session) { clear(); return null; }
    store.set(KEY, session);
  }
  return session;
}

export function hasSession() {
  return Boolean(store.get(KEY));
}

// A request made as the signed-in instructor.
export async function authed(path, options = {}) {
  const session = await getSession();
  if (!session) throw new Error('You are signed out. Sign in again to keep editing.');
  return fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: { apikey: config.supabaseKey, Authorization: `Bearer ${session.access}`, ...(options.headers || {}) },
  });
}

export async function signIn(email, password) {
  let session;
  try {
    session = await token('password', { email, password });
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
  }
  if (!session) return { ok: false, error: 'Incorrect email or password.' };
  store.set(KEY, session);

  // An account that is not on the instructor list is signed straight back out.
  try {
    const res = await authed('/rest/v1/rpc/is_admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (res.ok && (await res.json()) === false) {
      await signOut();
      return { ok: false, error: 'This account is not an instructor account.' };
    }
  } catch { /* the check could not run; the database still decides what can be saved */ }

  return { ok: true, email: session.email };
}

export async function signOut() {
  const session = store.get(KEY);
  clear();
  if (!session) return;
  try {
    await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
      method: 'POST', headers: { ...headers, Authorization: `Bearer ${session.access}` },
    });
  } catch { /* already signed out locally */ }
}
