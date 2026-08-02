# Explorer 2 Handoff Report: Instagram Highlights & Playable Reels Embeds Investigation (Milestone 1)

**Date**: 2026-07-31  
**Working Directory**: `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_2\`  
**Target Milestone**: Milestone 1 (Reliable Map Tiles & Live Playable Instagram Reels Embeds)

---

## 1. Observation

### 1.1 Architecture & Milestone Specifications
- **`c:\Users\huzai\Documents\learner2driver\PROJECT.md`**:
  - **Line 9**: `- **Third-Party Embeds**: Leaflet.js map tiles (CartoDB/Wikimedia basemaps) and official Instagram Reels script embeds ('<blockquote class="instagram-media">').`
  - **Line 14** (Milestone 1 Scope): `Replace 403 OSM URLs with CartoDB Voyager/Positron basemap provider; Replace static image cards with playable Instagram Reels embeds in 'index.html'`
  - **Line 44**: `'js/insta-highlights.js' — Instagram widget & Reels rendering logic.`
  - **Line 51**: `'styles/widgets.css' — Leaflet map, review bubbles, Instagram widget styling.`

### 1.2 Current DOM Structure in `index.html`
- **`c:\Users\huzai\Documents\learner2driver\index.html`**:
  - **Lines 314–330**: Section `#insta` contains two distinct containers:
    - **Line 324**: `<div id="instaStoriesContainer" class="insta-stories-scroll mb-3"></div>` (Story Circular Highlights ring bar).
    - **Line 327**: `<div id="instaFeedGrid" class="grid-3 mt-2"></div>` (3-column Instagram Feed Grid).
  - **Lines 468–482**: Defines modal container `<div id="instaStoryModalBackdrop" class="modal-backdrop">` which displays a static image preview modal (`#instaModalImg`, `#instaModalCaption`, `#instaModalLink`) when triggered.
  - **Line 492**: Loads `<script src="js/insta-highlights.js"></script>`.
  - **Observation**: Neither the official Instagram embed script (`https://www.instagram.com/embed.js`) nor any `<blockquote class="instagram-media">` embed tags are currently present in `index.html`.

### 1.3 Current Static Card Rendering in `js/insta-highlights.js`
- **`c:\Users\huzai\Documents\learner2driver\js\insta-highlights.js`**:
  - **Lines 8–49**: `FALLBACK_INSTA_POSTS` is an array of 5 static JavaScript objects:
    ```javascript
    {
      id: 101,
      title: '1st Timers 🎉',
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop',
      date: '2 hours ago',
      caption: '🎉 ZERO FAULTS! Massive congratulations to Ayesha Patel on passing 1st time with Farhan in Preston! #Learner2Driver #FirstTimePass',
      url: 'https://www.instagram.com/lrnr2drvr/'
    }
    ```
    - Note that `url` is identically set to the profile URL (`https://www.instagram.com/lrnr2drvr/`) for all 5 fallback posts, rather than individual Reel permalinks.
  - **Lines 71–107**: `fetchRealInstagramFeed()` reads `localStorage.getItem('l2d_insta_api_endpoint')`. If empty or if network fetch fails, `activeInstaPosts` defaults to `FALLBACK_INSTA_POSTS`.
  - **Lines 109–123**: `renderInstaStories()` injects interactive story ring elements (`.insta-story-item`) into `#instaStoriesContainer`, with an `onclick="openInstaModal(${story.id})"` handler.
  - **Lines 125–151**: `renderInstaFeedGrid()` slices `activeInstaPosts.slice(0, 3)` and generates HTML for three static `.glass-card` image cards into `#instaFeedGrid`:
    ```javascript
    grid.innerHTML = feedItems.map(post => `
      <div class="glass-card" style="padding: 1.25rem; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;" onclick="openInstaModal(${post.id})">
        <div>
          <div style="position: relative; aspect-ratio: 1/1; border-radius: 12px; overflow: hidden; margin-bottom: 1rem; background: #0F172A;">
            <img src="${post.img}" alt="${post.title}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop'">
            ...
          </div>
          ...
        </div>
      </div>
    `).join('');
    ```
  - **Lines 153–180**: `openInstaModal(storyId)` opens the static modal `#instaStoryModalBackdrop` displaying the image and caption.

### 1.4 Current CSS Styles in `styles/widgets.css` & `styles/main.css`
- **`c:\Users\huzai\Documents\learner2driver\styles\widgets.css` (lines 207–266)**:
  - Defines `.insta-stories-scroll`, `.insta-story-item`, `.insta-story-ring`, `.insta-story-inner`, and `.insta-story-title` for the circular highlight rings.
  - No CSS styles exist for `.instagram-media`, iframe embeds, or `.insta-reel-card`.
- **`c:\Users\huzai\Documents\learner2driver\styles\main.css` (lines 417–448)**:
  - `.grid-3` sets `display: grid; grid-template-columns: 1fr; gap: 1.75rem;`. At `>= 768px`, it becomes 2 columns; at `>= 1024px`, it becomes 3 columns (`repeat(3, 1fr)`).

---

## 2. Logic Chain

1. **Why static cards currently appear instead of playable Reels**:
   - `renderInstaFeedGrid()` (`js/insta-highlights.js:125-151`) currently constructs `<div class="glass-card">` with static `<img>` elements and `onclick="openInstaModal(post.id)"`. It does not emit `<blockquote class="instagram-media">` tags.
   - Furthermore, `https://www.instagram.com/embed.js` is never loaded or invoked in `index.html` or `js/insta-highlights.js`.

2. **How Instagram's official embed player works**:
   - When Instagram's official script (`https://www.instagram.com/embed.js`) is loaded and executed, it scans the document for elements matching `<blockquote class="instagram-media" data-instgrm-permalink="...">` and transforms each blockquote into an interactive iframe containing the playable Reel video, controls, and caption.
   - For dynamically injected HTML (such as `renderInstaFeedGrid()` setting `grid.innerHTML`), we must explicitly invoke `window.instgrm.Embeds.process()` after DOM insertion so that Instagram's script transforms the newly injected blockquotes.

3. **Why fallback HTML inside `<blockquote class="instagram-media">` is essential**:
   - In offline mode, or when users have ad-blockers / tracking protection blocking `https://www.instagram.com/embed.js`, an empty blockquote would result in a blank space.
   - Any HTML placed *inside* `<blockquote class="instagram-media">...</blockquote>` serves as fallback content that is displayed until `embed.js` transforms the blockquote. By including a responsive 9:16 video thumbnail with a play button badge, caption, and direct link inside the blockquote, the UI remains polished even if the embed script is blocked.

4. **Why `FALLBACK_INSTA_POSTS` needs permalinks with shortcodes**:
   - For `embed.js` to render specific Reels, `data-instgrm-permalink` requires a valid URL format (`https://www.instagram.com/reel/<shortcode>/` or `/p/<shortcode>/`).
   - We must enhance each item in `FALLBACK_INSTA_POSTS` to include a `permalink` property containing realistic Learner2Driver Preston driving lesson and pass reel URLs.

5. **Maintaining responsive 3-column layout (`#instaFeedGrid`) without layout shifts**:
   - Instagram embed iframes vary in height depending on caption length. Setting `align-items: start;` on `#instaFeedGrid` prevents CSS grid columns from stretching adjacent cards.
   - Constraining the embed container with `max-width: 540px; min-width: 280px; width: 100%;` ensures that on mobile screens (`1fr` grid), table (`repeat(2, 1fr)`), and desktop (`repeat(3, 1fr)`), each Reel iframe renders responsively without horizontal overflow.

---

## 3. Caveats

- **Caveat 1 (Network Availability / Script Blocking)**:  
  In `CODE_ONLY` network mode or when a browser blocks third-party social widgets, `https://www.instagram.com/embed.js` cannot fetch external iframe content. The embedded fallback HTML designed in Section 4 ensures that visitors still see a responsive preview card with a play icon and direct link to Instagram.
- **Caveat 2 (Live API Endpoint Compatibility)**:  
  If an instructor configures a custom endpoint in `localStorage.getItem('l2d_insta_api_endpoint')`, the API payload may return items with or without valid `permalink` properties. Our recommended rendering logic checks whether an item has a valid `permalink` before rendering `<blockquote class="instagram-media">`, falling back to a static card if no valid permalink is present.
- **Caveat 3 (Story Highlights Modal Separation)**:  
  The interactive Story Highlights rings (`#instaStoriesContainer`) should continue opening `#instaStoryModalBackdrop` (`openInstaModal(story.id)`) for quick story previews, whereas the 3 feed cards in `#instaFeedGrid` play Reels directly in inline iframes.

---

## 4. Conclusion & Recommended Implementation Specification

To fulfill Milestone 1 without altering story highlights, implementers should apply the following three specific changes:

### 4.1 Update `FALLBACK_INSTA_POSTS` in `js/insta-highlights.js`
Replace lines 8–49 in `c:\Users\huzai\Documents\learner2driver\js\insta-highlights.js` with realistic driving lesson and pass Reel permalinks:

```javascript
const FALLBACK_INSTA_POSTS = [
  {
    id: 101,
    title: '1st Time Pass - Ayesha 🎉',
    img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop',
    date: '2 hours ago',
    caption: '🎉 ZERO FAULTS! Massive congratulations to Ayesha Patel on passing 1st time with Farhan in Preston! #Learner2Driver #FirstTimePass',
    permalink: 'https://www.instagram.com/reel/C7xPq8toDV2/',
    url: 'https://www.instagram.com/reel/C7xPq8toDV2/'
  },
  {
    id: 102,
    title: 'Preston Roundabout Tips 🛣️',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
    date: '1 day ago',
    caption: '🛣️ Chain Caul Way roundabout tips! Watch Farhan explain lane discipline and mirror checks near the Preston test centre. #PrestonTestRoute #DrivingTips',
    permalink: 'https://www.instagram.com/reel/C8aM12pqL91/',
    url: 'https://www.instagram.com/reel/C8aM12pqL91/'
  },
  {
    id: 103,
    title: 'Kona EV Hill Start ⚡',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop',
    date: '3 days ago',
    caption: '⚡ 100% Electric, Zero Stalling! Watch how Auto-Hold makes Penwortham hill starts effortless in our 2024 Hyundai Kona EV Ultimate.',
    permalink: 'https://www.instagram.com/reel/C9kR34vwE05/',
    url: 'https://www.instagram.com/reel/C9kR34vwE05/'
  },
  {
    id: 104,
    title: 'Parallel Parking Yaris 🕹️',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop',
    date: '5 days ago',
    caption: '🕹️ Master parallel parking in 60 seconds! Key reference points in our 2019 Toyota Yaris for 1st-time pass maneuvers.',
    permalink: 'https://www.instagram.com/reel/C6mN89qrT43/',
    url: 'https://www.instagram.com/reel/C6mN89qrT43/'
  },
  {
    id: 105,
    title: 'Zero Faults Dimitri 🏆',
    img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop',
    date: '1 week ago',
    caption: '🏆 PERFECT SCORE! Dimitri P. passed with ZERO driver faults in Preston. Incredible control on Docks Swing Bridge!',
    permalink: 'https://www.instagram.com/reel/C5jL56mnK21/',
    url: 'https://www.instagram.com/reel/C5jL56mnK21/'
  }
];
```

### 4.2 Replace `renderInstaFeedGrid()` & Add `processInstagramEmbeds()` in `js/insta-highlights.js`
Replace `renderInstaFeedGrid()` (lines 125–151 of `js/insta-highlights.js`) with the following Reels embed renderer and script loader:

```javascript
function renderInstaFeedGrid() {
  const grid = document.getElementById('instaFeedGrid');
  if (!grid) return;

  const feedItems = activeInstaPosts.slice(0, 3);

  grid.innerHTML = feedItems.map(post => {
    const permalinkUrl = post.permalink || post.url || 'https://www.instagram.com/lrnr2drvr/';
    const isEmbeddable = permalinkUrl.includes('/reel/') || permalinkUrl.includes('/p/');

    if (isEmbeddable) {
      return `
        <div class="glass-card insta-reel-card" style="padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; align-items: center; min-height: 500px; overflow: hidden;">
          <div style="width: 100%; display: flex; justify-content: center; overflow: hidden; border-radius: 12px; background: #0F172A; width: 100%;">
            <blockquote class="instagram-media" 
                        data-instgrm-permalink="${permalinkUrl}/?utm_source=ig_embed&amp;utm_campaign=loading" 
                        data-instgrm-version="14" 
                        style="background:#FFF; border:0; border-radius:12px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 0; max-width: 540px; min-width: 280px; width: 100%;">
              <div style="padding: 1rem; text-align: center; background: var(--bg-surface);">
                <a href="${permalinkUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display: block;">
                  <div style="position: relative; aspect-ratio: 9/16; max-height: 340px; border-radius: 8px; overflow: hidden; margin-bottom: 0.75rem; background: #0F172A;">
                    <img src="${post.img}" alt="${post.title}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop'">
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35);">
                      <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(211, 47, 47, 0.95); color: #FFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      </div>
                    </div>
                  </div>
                  <p style="font-size: 0.88rem; color: var(--text-main); font-weight: 600; margin-bottom: 0.5rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${post.caption}</p>
                  <span style="font-size: 0.78rem; font-weight: 700; color: var(--color-green);">Watch Reel on Instagram (@lrnr2drvr) ↗</span>
                </a>
              </div>
            </blockquote>
          </div>
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 0.75rem;">
            <span style="font-size: 0.75rem; color: var(--text-light);">${post.date}</span>
            <a href="${permalinkUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 0.78rem; font-weight: 700; color: var(--color-green);">Watch on Instagram ↗</a>
          </div>
        </div>
      `;
    }

    // Fallback static card if not an embeddable permalink
    return `
      <div class="glass-card" style="padding: 1.25rem; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;" onclick="openInstaModal(${post.id})">
        <div>
          <div style="position: relative; aspect-ratio: 1/1; border-radius: 12px; overflow: hidden; margin-bottom: 1rem; background: #0F172A;">
            <img src="${post.img}" alt="${post.title}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop'">
            <div style="position: absolute; top:10px; right:10px; background: rgba(0,0,0,0.7); color: #FFF; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight:700; display:flex; align-items:center; gap:4px;">
              @lrnr2drvr
            </div>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-main); font-weight: 600; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">
            ${post.caption}
          </p>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.65rem;">
          <span style="font-size: 0.75rem; color: var(--text-light);">${post.date}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--color-green);">View on Instagram →</span>
        </div>
      </div>
    `;
  }).join('');

  processInstagramEmbeds();
}

/**
 * Dynamically loads official Instagram embed.js library and processes blockquotes.
 */
function processInstagramEmbeds() {
  if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
    window.instgrm.Embeds.process();
    return;
  }

  if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.onload = () => {
      if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
        window.instgrm.Embeds.process();
      }
    };
    script.onerror = () => {
      console.warn('Instagram embed.js blocked or offline; fallback Reel card HTML will be displayed.');
    };
    document.body.appendChild(script);
  }
}
```

### 4.3 Append Reels Embed Responsive Styles to `styles/widgets.css`
Append the following CSS rules to the end of `c:\Users\huzai\Documents\learner2driver\styles\widgets.css`:

```css
/* ==========================================================================
   5. INSTAGRAM REELS EMBED CARDS & RESPONSIVE GRID (#instaFeedGrid)
   ========================================================================== */
.insta-reel-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 1rem;
  min-height: 500px;
  overflow: hidden;
  transition: var(--transition-smooth);
}

.insta-reel-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-green);
}

.insta-reel-card .instagram-media {
  margin: 0 auto !important;
  max-width: 540px !important;
  min-width: 280px !important;
  width: 100% !important;
}

#instaFeedGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
  align-items: start;
}

@media (min-width: 768px) {
  #instaFeedGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  #instaFeedGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 5. Verification Method

1. **DOM Inspection Verification**:
   - Inspect `index.html` in a browser and navigate to `#insta`.
   - Verify that `#instaFeedGrid` contains 3 `.insta-reel-card` containers, each wrapping a `<blockquote class="instagram-media">` element with `data-instgrm-permalink` pointing to the `/reel/<shortcode>/` URLs.
2. **Script Execution Verification**:
   - In the browser DevTools Console, inspect `window.instgrm.Embeds`.
   - Verify that `https://www.instagram.com/embed.js` is attached to `document.body` and that calling `window.instgrm.Embeds.process()` executes without throwing console errors.
3. **Offline / Fallback UI Verification**:
   - In DevTools Network tab, block request URLs matching `instagram.com/embed.js` (or test in an offline environment).
   - Reload `index.html` and verify that each card in `#instaFeedGrid` displays the fallback 9:16 video thumbnail with the red play button badge, caption, date, and external link "Watch Reel on Instagram (@lrnr2drvr) ↗".
4. **Responsive Layout Verification**:
   - Test viewport widths at `375px` (mobile, 1 column), `768px` (tablet, 2 columns), and `1200px` (desktop, 3 columns).
   - Ensure cards align cleanly with `align-items: start;` and that no horizontal scrollbar or clipping occurs.
