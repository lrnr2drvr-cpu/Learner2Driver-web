// Instagram: the latest posts from @lrnr2drvr. If the feed cannot be read,
// the section stays hidden rather than showing stand-in posts.
import { config } from './config.js';

function firstLine(caption) {
  const line = String(caption || '').split('\n')[0].replace(/[#@]\S+/g, '').replace(/\s+/g, ' ').trim();
  return line.length > 70 ? `${line.slice(0, line.lastIndexOf(' ', 70))}…` : line;
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
  img.src = image;
  img.alt = '';
  img.loading = 'lazy';
  img.width = post.sizes?.medium?.width || 394;
  img.height = post.sizes?.medium?.height || 700;
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
  const rail = document.getElementById('insta-rail');
  if (!section || !rail) return;

  try {
    const res = await fetch(config.instagramFeed, { headers: { Accept: 'application/json' } });
    if (!res.ok) return;
    const data = await res.json();
    const cards = (Array.isArray(data) ? data : data.posts || []).map(card).filter(Boolean);
    if (cards.length < 3) return;
    rail.replaceChildren(...cards);
    section.hidden = false;
  } catch {
    // Feed unavailable: leave the section hidden.
  }
}
