// Public settings. Nothing here is secret: the Supabase key is the publishable one,
// and the database decides what a visitor may read (row-level security).
export const config = {
  supabaseUrl: 'https://uxgychlmmnpfrnkhrhbc.supabase.co',
  supabaseKey: 'sb_publishable_LM5nEdUBi1dJ0l8Cu26S9g_-muMtCPV',
  instagramFeed: 'https://feeds.behold.so/JnT3KNlUepSxi6fR755B',
  whatsapp: '447427330827',
};

// Read rows from a Supabase table as a visitor. Returns [] if the request fails.
export async function readTable(path) {
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
      headers: { apikey: config.supabaseKey, Accept: 'application/json' },
    });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

// localStorage that never throws (private windows, blocked storage).
export const store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};
