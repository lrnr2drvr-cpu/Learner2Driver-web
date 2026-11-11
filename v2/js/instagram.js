// Instagram: the latest posts from @lrnr2drvr. If the feed cannot be read,
// the section stays hidden rather than showing stand-in posts.
import { config } from './config.js';

const FRAME = 5 / 4; // width over height of a card's picture frame (matches .post__frame in site.css)
const SHOWN = 6;

function firstLine(caption) {
  const line = String(caption || '').split('\n')[0].replace(/[#@]\S+/g, '').replace(/\s+/g, ' ').trim();
  return line.length > 70 ? `${line.slice(0, line.lastIndexOf(' ', 70))}…` : line;
}

// Reel covers are tall frames with the photograph in a band across the middle and
// black above and below. Returns where that band sits, as fractions of the height.
function pictureBand(img) {
  const w = 48;
  const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  // A row belongs to the photograph when most of it is lit; stickers on the black bands are not wide enough.
  const lit = [];
  for (let y = 0; y < h; y += 1) {
    let bright = 0;
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2] > 40) bright += 1;
    }
    lit.push(bright / w > 0.6);
  }

  let best = { top: 0, rows: 0 };
  let start = null;
  for (let y = 0; y <= h; y += 1) {
    if (y < h && lit[y]) {
      if (start === null) start = y;
    } else if (start !== null) {
      if (y - start > best.rows) best = { top: start, rows: y - start };
      start = null;
    }
  }
  // Pull the edges in by a row and a half: the measurement is coarse, and this keeps
  // a sliver of the black band from showing at the top or bottom of the frame.
  const trim = 1.5;
  return { top: (best.top + trim) / h, height: Math.max(best.rows - 2 * trim, 0) / h };
}

// Sizes and places the image so the photograph fills the frame and is centred in it.
function centreOnPicture(img) {
  let band;
  try { band = pictureBand(img); } catch { return; } // pixels unreadable: keep the plain centred crop
  if (band.height < 0.25 || band.height > 0.85) return; // no clear band: the whole cover is the picture

  const ratio = img.naturalWidth / img.naturalHeight;
  const bandRatio = ratio / band.height;
  // Rendered size of the whole image, measured in frame widths and frame heights.
  const height = bandRatio >= FRAME ? 1 / band.height : FRAME / ratio;
  const width = bandRatio >= FRAME ? ratio / (band.height * FRAME) : 1;
  const top = 0.5 - (band.top + band.height / 2) * height;
  const left = (1 - width) / 2;

  img.classList.add('is-placed');
  img.style.width = `${width * 100}%`;
  img.style.height = `${height * 100}%`;
  img.style.left = `${left * 100}%`;
  img.style.top = `${top * 100}%`;
}

function card(post) {
  const image = post.sizes?.medium?.mediaUrl || post.thumbnailUrl || post.mediaUrl;
  if (!image || !post.permalink) return null;

  const link = document.createElement('a');
  link.className = 'post';
  link.href = post.permalink;
  link.target = '_blank';
  link.rel = 'noopener';

  const frame = document.createElement('span');
  frame.className = 'post__frame';
  const img = document.createElement('img');
  img.crossOrigin = 'anonymous'; // lets the page measure the picture; the image host allows it
  img.alt = '';
  img.loading = 'lazy';
  img.width = post.sizes?.medium?.width || 394;
  img.height = post.sizes?.medium?.height || 700;
  img.addEventListener('load', () => centreOnPicture(img), { once: true });
  img.src = image;
  frame.append(img);

  const text = document.createElement('span');
  text.className = 'post__text';
  text.textContent = firstLine(post.prunedCaption || post.caption) || 'See this post on Instagram';

  const date = document.createElement('time');
  date.className = 'post__date';
  if (post.timestamp) {
    const when = new Date(post.timestamp);
    date.dateTime = when.toISOString();
    date.textContent = when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }

  link.append(frame, text, date);
  return link;
}

export async function initInstagram() {
  const section = document.getElementById('instagram');
  const grid = document.getElementById('insta-grid');
  if (!section || !grid) return;

  try {
    const res = await fetch(config.instagramFeed, { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    const cards = (Array.isArray(data) ? data : data.posts || []).map(card).filter(Boolean).slice(0, SHOWN);
    if (cards.length < 3) return;
    // Keep full rows of three so the grid has no orphan on the last row.
    grid.replaceChildren(...cards.slice(0, cards.length - (cards.length % 3)));
    section.hidden = false;
  } catch {
    // Feed unavailable: leave the section hidden.
  }
}
