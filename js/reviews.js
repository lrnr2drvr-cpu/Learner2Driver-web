// Google reviews: the rating, the number of reviews and the latest review text,
// read from the Google Business profile. Nothing here is written by hand.
//
// Google charges per lookup, so the answer is shared: whenever a signed-in instructor
// opens the site, a fresh answer is fetched and saved for everyone. Visitors use that
// shared copy and only ask Google themselves if it is more than a day old.
import { store } from './config.js';
import { hasSession, authed } from './auth.js';

const CACHE = 'l2d_v2_google2';              // this browser's copy
const SHARED = 'google_cache';               // the copy saved in site_settings for everyone
const VISITOR_AGE = 24 * 60 * 60 * 1000;     // visitors refresh a copy older than a day
const INSTRUCTOR_AGE = 10 * 60 * 1000;       // an instructor refreshes one older than ten minutes
const SHOWN = 3;

async function fetchPlace(settings) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(settings.placeId)}`
    + `?fields=rating,userRatingCount,googleMapsUri,reviews&key=${encodeURIComponent(settings.apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google answered ${res.status}`);
  const data = await res.json();
  return {
    at: Date.now(),
    rating: data.rating,
    count: data.userRatingCount,
    link: data.googleMapsUri,
    reviews: (data.reviews || []).map((review) => ({
      author: review.authorAttribution?.displayName || 'Google reviewer',
      when: review.relativePublishTimeDescription || '',
      text: review.text?.text || review.originalText?.text || '',
      link: review.googleMapsUri || data.googleMapsUri,
    })),
  };
}

// The first sentences of a review, up to a readable length.
function excerpt(text, limit = 200) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return stop > 80 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

// Only links that go to Google are ever put on the page.
function googleLink(address) {
  return typeof address === 'string' && /^https:\/\/(maps|www|search)\.google\.com\//.test(address) ? address : null;
}

function render(place) {
  if (Number.isFinite(place.rating)) {
    document.querySelectorAll('[data-google="rating"]').forEach((el) => { el.textContent = place.rating.toFixed(1); });
  }
  if (Number.isFinite(place.count)) {
    document.querySelectorAll('[data-google="count"]').forEach((el) => { el.textContent = String(place.count); });
  }
  const all = document.getElementById('reviews-all');
  if (all && googleLink(place.link)) all.href = place.link;

  const list = document.getElementById('review-list');
  const reviews = (Array.isArray(place.reviews) ? place.reviews : [])
    .filter((review) => review && typeof review.text === 'string' && review.text.length > 40)
    .slice(0, SHOWN);
  if (!list || reviews.length < SHOWN) return;

  list.replaceChildren(...reviews.map((review) => {
    const figure = document.createElement('figure');
    figure.className = 'quote';
    const quote = document.createElement('blockquote');
    const p = document.createElement('p');
    p.textContent = `“${excerpt(review.text)}”`;
    quote.append(p);
    const caption = document.createElement('figcaption');
    const name = String(review.author || 'Google reviewer');
    const address = googleLink(review.link);
    if (address) {
      const link = document.createElement('a');
      link.href = address;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = name;
      caption.append(link);
    } else {
      caption.append(name);
    }
    caption.append(`, ${review.when || 'Google review'}`);
    figure.append(quote, caption);
    return figure;
  }));
}

function parse(json) {
  try {
    const value = JSON.parse(json);
    return value && Number.isFinite(value.at) ? value : null;
  } catch {
    return null;
  }
}

// Saves a fresh answer for every visitor. Only works for a signed-in instructor.
async function share(place) {
  try {
    await authed('/rest/v1/site_settings?on_conflict=key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([{ key: SHARED, value: JSON.stringify(place), updated_at: new Date().toISOString() }]),
    });
  } catch { /* not signed in after all, or offline: visitors keep the older copy */ }
}

export async function initReviews(settingsJson, sharedJson) {
  // Show the newest copy to hand: the shared one or this browser's own.
  const copies = [parse(sharedJson), store.get(CACHE)].filter((copy) => copy && Number.isFinite(copy.at));
  const newest = copies.sort((a, b) => b.at - a.at)[0];
  if (newest) render(newest);

  const instructor = hasSession();
  const age = newest ? Date.now() - newest.at : Infinity;
  if (age < (instructor ? INSTRUCTOR_AGE : VISITOR_AGE)) return;

  let settings;
  try { settings = JSON.parse(settingsJson); } catch { return; }
  if (!settings?.apiKey || !settings?.placeId) return;

  try {
    const place = await fetchPlace(settings);
    store.set(CACHE, place);
    render(place);
    if (instructor) share(place);
  } catch {
    // Google could not be reached: the figures already on the page stay as they are.
  }
}
