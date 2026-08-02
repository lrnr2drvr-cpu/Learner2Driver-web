/**
 * ==========================================================================
 * LEARNER2DRIVER - REAL INSTAGRAM API POLLING (@lrnr2drvr)
 * Real HTTP fetch() polling from Instagram API / Proxy Endpoint
 * Centered flexbox grid & responsive embed containment
 * ==========================================================================
 */

const FALLBACK_INSTA_POSTS = [
  {
    id: 101,
    title: '1st Timers 🎉',
    img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop',
    date: '2 hours ago',
    caption: '🎉 ZERO FAULTS! Massive congratulations to Ayesha Patel on passing 1st time with Farhan in Preston! #Learner2Driver #FirstTimePass',
    url: 'https://www.instagram.com/reel/C7xPq8toDV2/'
  },
  {
    id: 102,
    title: 'Instructors 🚗',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
    date: '1 day ago',
    caption: '🚗 Meet your Preston DVSA-approved driving team: Farhan Hussaini & Binish Moazzam! Manual & Automatic tuition.',
    url: 'https://www.instagram.com/reel/C8aM12pqL91/'
  },
  {
    id: 103,
    title: 'Kona EV ⚡',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop',
    date: '3 days ago',
    caption: '⚡ 100% Electric, Zero Stalling! Experience our 2024 Hyundai Kona EV Ultimate with dual pedals and 360 surround cameras.',
    url: 'https://www.instagram.com/reel/C9kR34vwE05/'
  }
];

let activeInstaPosts = [...FALLBACK_INSTA_POSTS];

document.addEventListener('DOMContentLoaded', () => {
  initInstaHighlights();
});

const DEFAULT_BEHOLD_ENDPOINT = 'https://feeds.behold.so/JnT3KNlUepSxi6fR755B';

function getInstaApiEndpoint() {
  return localStorage.getItem('l2d_insta_api_endpoint') || 
    ((window.L2D_CONFIG && typeof window.L2D_CONFIG.getInstaEndpoint === 'function') ? window.L2D_CONFIG.getInstaEndpoint() : DEFAULT_BEHOLD_ENDPOINT);
}

async function initInstaHighlights() {
  await fetchRealInstagramFeed();
  renderInstaFeedGrid();
}

/**
 * REAL HTTP fetch() API Polling Engine for Instagram (@lrnr2drvr)
 * Supports Instagram Basic Display Graph API, Behold.so URLs, and RSS proxies.
 */
async function fetchRealInstagramFeed() {
  const endpoint = getInstaApiEndpoint();
  if (!endpoint || !endpoint.trim()) {
    return;
  }

  try {
    const response = await fetch(endpoint.trim(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.posts || data.data || data.items || []);
      if (items.length > 0) {
        activeInstaPosts = items.map((item, idx) => {
          const imgUrl = item.sizes?.medium?.mediaUrl || item.sizes?.small?.mediaUrl || item.sizes?.large?.mediaUrl || item.thumbnailUrl || item.mediaUrl || item.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop';
          const postCaption = item.caption || item.prunedCaption || item.text || 'View this Reel on @lrnr2drvr Instagram';
          const postLink = item.permalink || item.url || item.link || 'https://www.instagram.com/lrnr2drvr/';
          const formattedDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent Reel';

          return {
            id: item.id || (idx + 100),
            title: item.title || item.username || `Reel #${idx+1}`,
            img: imgUrl,
            date: formattedDate,
            caption: postCaption,
            url: postLink
          };
        });
        return;
      }
    }
  } catch (err) {
    console.warn('Real Instagram API poll note:', err);
  }
}

function renderInstaFeedGrid() {
  const grid = document.getElementById('instaFeedGrid');
  if (!grid) return;

  const feedItems = activeInstaPosts.slice(0, 3);

  grid.innerHTML = feedItems.map(post => `
    <div class="glass-card insta-embed-wrapper" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);">
      <div style="width: 100%;">
        <div style="position: relative; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1rem; height: 220px; background: var(--bg-body);">
          <img src="${post.img}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform='scale(1)'">
          <span class="badge badge-primary" style="position: absolute; top: 10px; right: 10px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2);">📸 @lrnr2drvr</span>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5; margin-bottom: 1rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          ${post.caption}
        </p>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.85rem; margin-top: auto;">
        <span style="font-size: 0.78rem; color: var(--text-light);">📅 ${post.date}</span>
        <a href="${post.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">View Post ↗</a>
      </div>
    </div>
  `).join('');
}

function processInstaEmbeds() {
  const triggerProcess = () => {
    if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
      window.instgrm.Embeds.process();
    }
  };

  triggerProcess();

  if (!document.getElementById('instagram-embed-script')) {
    const script = document.createElement('script');
    script.id = 'instagram-embed-script';
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.onload = triggerProcess;
    script.onerror = () => console.warn('Instagram embed script load failed.');
    document.body.appendChild(script);
  } else {
    setTimeout(triggerProcess, 500);
    setTimeout(triggerProcess, 1500);
  }
}

window.initInstaHighlights = initInstaHighlights;
window.fetchRealInstagramFeed = fetchRealInstagramFeed;
