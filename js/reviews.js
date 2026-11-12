// Google reviews: the rating, the number of reviews and the latest review text,
// read from the Google Business profile. Nothing here is written by hand.
import { store } from './config.js';

const CACHE = 'l2d_v2_google';
const MAX_AGE = 12 * 60 * 60 * 1000; // ask Google at most twice a day per browser
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

function render(place) {
  if (Number.isFinite(place.rating)) {
    document.querySelectorAll('[data-google="rating"]').forEach((el) => { el.textContent = place.rating.toFixed(1); });
  }
  if (Number.isFinite(place.count)) {
    document.querySelectorAll('[data-google="count"]').forEach((el) => { el.textContent = String(place.count); });
  }
  const all = document.getElementById('reviews-all');
  if (all && place.link) all.href = place.link;

  const list = document.getElementById('review-list');
  const reviews = place.reviews.filter((review) => review.text.length > 40).slice(0, SHOWN);
  if (!list || reviews.length < SHOWN) return;

  list.replaceChildren(...reviews.map((review) => {
    const figure = document.createElement('figure');
    figure.className = 'quote';
    const quote = document.createElement('blockquote');
    const p = document.createElement('p');
    p.textContent = `“${excerpt(review.text)}”`;
    quote.append(p);
    const caption = document.createElement('figcaption');
    const link = document.createElement('a');
    link.href = review.link;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = review.author;
    caption.append(link, `, ${review.when || 'Google review'}`);
    figure.append(quote, caption);
    return figure;
  }));
}

export async function initReviews(settingsJson) {
  const cached = store.get(CACHE);
  if (cached) render(cached);
  if (cached && Date.now() - cached.at < MAX_AGE) return;

  let settings;
  try { settings = JSON.parse(settingsJson); } catch { return; }
  if (!settings?.apiKey || !settings?.placeId) return;

  try {
    const place = await fetchPlace(settings);
    store.set(CACHE, place);
    render(place);
  } catch {
    // Google could not be reached: the figures already on the page stay as they are.
  }
}
