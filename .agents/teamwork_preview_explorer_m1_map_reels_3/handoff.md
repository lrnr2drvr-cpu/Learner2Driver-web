# Handoff Report: Milestone 1 Map & Instagram Reels Integration Investigation

**Explorer**: Explorer 3 (Read-only Codebase Researcher)  
**Target Milestone**: Milestone 1 (Reliable Map Tiles & Live Playable Instagram Reels Embeds)  
**Working Directory**: `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m1_map_reels_3\`  

---

## 1. Observation

### 1.1 Project & Objective Contract (`PROJECT.md` & `ORIGINAL_REQUEST.md`)
- `c:\Users\huzai\Documents\learner2driver\PROJECT.md` (lines 14–24):
  - **Milestone 1 Scope**: `"Replace 403 OSM URLs with CartoDB Voyager/Positron basemap provider; Replace static image cards with playable Instagram Reels embeds in index.html"`
  - **Third-Party Embeds**: `"- Third-Party Embeds: Leaflet.js map tiles (CartoDB/Wikimedia basemaps) and official Instagram Reels script embeds (<blockquote class="instagram-media">)."`
- `c:\Users\huzai\Documents\learner2driver\ORIGINAL_REQUEST.md` (lines 12–15):
  - **R1 Requirements**: `"Replace any 403-erroring OpenStreetMap tile layer URLs on the Leaflet map with a reliable, unrestricted basemap provider (e.g., CartoDB Voyager/Positron or Wikimedia basemaps)... Replace static Instagram image cards with actual, playable Instagram Reels embeds (<blockquote class="instagram-media" data-instgrm-permalink="..."> with official script) on index.html so visitors can watch real driving lessons and pass reels directly on the page."`

### 1.2 Leaflet Map Section (`index.html`, `js/widgets.js`, `styles/widgets.css`)
- **HTML Container & Loading Order (`index.html`)**:
  - Leaflet CSS CDN is loaded in `<head>` (line 37):
    ```html
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
    ```
  - Map Section (`#routes`, lines 269–309) uses a `.grid-2` layout container (line 293): `<div class="grid-2" style="align-items: start;">` with two children:
    1. `.preston-map-container` containing `<div id="prestonLeafletMap" style="width: 100%; height: 480px;"></div>` (line 296) and an address/attribution bar (lines 297–300).
    2. `#routeTipBox` (`<div id="routeTipBox" class="glass-card" style="padding: 2.25rem;">`, line 304).
  - Synchronous scripts are loaded at the bottom of `<body>` (lines 485–490):
    ```html
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <script src="js/app.js"></script>
    <script src="js/showroom.js"></script>
    <script src="js/widgets.js"></script>
    ```
- **Tile Layer Configuration & Error State (`js/widgets.js`)**:
  - `initPrestonLeafletMap()` (lines 104–148) currently initializes standard OpenStreetMap tiles (lines 120–123):
    ```javascript
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors • Preston PR2 2ZN'
    }).addTo(prestonLeafletMap);
    ```
  - **Missing Viewport Invalidation**: There is zero window resize listener or `ResizeObserver` calling `prestonLeafletMap.invalidateSize()` anywhere in `js/widgets.js`.
- **CSS Layout & Styling (`styles/widgets.css` & `styles/main.css`)**:
  - `.preston-map-container` (`styles/widgets.css`, lines 92–106) sets `position: relative; border-radius: var(--radius-lg); overflow: hidden; border: 2px solid var(--border-color);`.
  - `#prestonLeafletMap` sets `width: 100%; height: 480px; background: #0F172A; z-index: 10;`.
  - In `styles/main.css` (lines 411–439), `.grid-2` sets `grid-template-columns: 1fr;` on mobile (`< 768px`) and `repeat(2, 1fr)` on tablet/desktop (`>= 768px`).

### 1.3 Instagram Highlights Section (`index.html`, `js/insta-highlights.js`, `styles/widgets.css`)
- **HTML Container & Missing Embed Script (`index.html`)**:
  - `#insta` section (lines 315–329) contains `#instaStoriesContainer` (`<div id="instaStoriesContainer" class="insta-stories-scroll mb-3"></div>`, line 324) and `#instaFeedGrid` (`<div id="instaFeedGrid" class="grid-3 mt-2"></div>`, line 327).
  - The official Instagram embed script (`https://www.instagram.com/embed.js`) is **not included** anywhere in `index.html`.
- **Current Rendering & Fallback Data (`js/insta-highlights.js`)**:
  - `FALLBACK_INSTA_POSTS` (lines 8–49) stores 5 static post objects (`id`, `title`, `img`, `date`, `caption`, `url`). Neither fallback posts nor API-polled items contain a `reel_url`, `permalink`, or blockquote markup.
  - `renderInstaFeedGrid()` (lines 125–151) dynamically injects 3 static image cards via `innerHTML` (lines 131–150):
    ```javascript
    grid.innerHTML = feedItems.map(post => `
      <div class="glass-card" style="padding: 1.25rem; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;" onclick="openInstaModal(${post.id})">
        <div>
          <div style="position: relative; aspect-ratio: 1/1; border-radius: 12px; overflow: hidden; margin-bottom: 1rem; background: #0F172A;">
            <img src="${post.img}" alt="${post.title}" ...>
    ```
- **CSS Grid & Overflow Risk (`styles/main.css` & `styles/widgets.css`)**:
  - In `styles/main.css` (lines 417–448), `.grid-3` uses `grid-template-columns: 1fr;` on mobile (`< 768px`), `repeat(2, 1fr);` on tablet (`>= 768px`), and `repeat(3, 1fr);` on desktop (`>= 1024px`).
  - Official Instagram embeds (`<blockquote class="instagram-media">`) enforce a default minimum width of `min-width: 326px;` via inline styling when rendered by `embed.js`.

---

## 2. Logic Chain

1. **Why OSM Tiles Error with HTTP 403 Forbidden (`js/widgets.js:120`)**:
   - Standard OpenStreetMap tile servers (`https://{s}.tile.openstreetmap.org/...`) enforce strict usage and User-Agent policies, blocking requests with HTTP 403 Forbidden when embedded on third-party sites or when usage thresholds are exceeded.
   - **Resolution**: Replacing the tile layer with CartoDB Voyager (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`) or CartoDB Positron (`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`) with `subdomains: 'abcd'`, `maxZoom: 20`, and retina support (`{r}`) eliminates 403 blocks while retaining OpenStreetMap attribution.

2. **Why Mobile Viewport Changes Cause Grey Map Tile Gaps (`js/widgets.js:104-148`)**:
   - On mobile devices, orientation changes (portrait ↔ landscape) or dynamic address bar hiding change the dimensions of `#prestonLeafletMap`. Because Leaflet caches tile container dimensions at initialization, unrendered grey tile gaps appear unless `map.invalidateSize()` is called.
   - **Resolution**: Attach a window resize listener or `ResizeObserver` on `#prestonLeafletMap` to invoke `if (prestonLeafletMap) prestonLeafletMap.invalidateSize();` after a short debounce.

3. **Why Dynamic Injection of Instagram Embeds Fails Without `.process()` (`js/insta-highlights.js:125`)**:
   - When Instagram's embed script (`https://www.instagram.com/embed.js`) loads, it scans the DOM once for `<blockquote class="instagram-media">` elements and transforms them into interactive `<iframe>`s.
   - If `renderInstaFeedGrid()` injects `<blockquote class="instagram-media">` elements into `grid.innerHTML` dynamically after `embed.js` has already executed, the blockquotes will sit as unrendered blank/plain-text containers.
   - **Resolution**:
     - Load `<script async src="https://www.instagram.com/embed.js"></script>` in `index.html`.
     - In `renderInstaFeedGrid()`, after setting `grid.innerHTML` with `<blockquote class="instagram-media" data-instgrm-permalink="...">`, explicitly invoke:
       ```javascript
       if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
         window.instgrm.Embeds.process();
       }
       ```

4. **Why Playable Reels Embeds Will Exhibit Click/Modal Conflicts (`js/insta-highlights.js:132`)**:
   - Currently, each feed item is wrapped in an enclosing `<div class="glass-card" ... onclick="openInstaModal(${post.id})">`.
   - If interactive Reels embeds are placed inside this clickable wrapper, clicks on the iframe controls (play, pause, volume toggle) will either be swallowed by the cross-origin iframe or will trigger `openInstaModal()`, opening a static image preview modal (`#instaStoryModalImg`, `index.html:475`) instead of letting the user play the video.
   - **Resolution**: Remove the enclosing card-level `onclick="openInstaModal(${post.id})"` attribute for Reels embeds in `#instaFeedGrid`. Reserve `openInstaModal()` strictly for the Story circular highlight rings (`#instaStoriesContainer`).

5. **Why Instagram Embeds Can Break Responsive Layouts on Mobile (`styles/main.css:417`)**:
   - Instagram's embed script injects inline styles including `min-width: 326px; width: 99.375%; max-width: 540px;`.
   - On small mobile viewports (320px–360px wide) or in `.grid-3` two-column tablet layouts (`768px` width), `min-width: 326px` overflows the grid cell and causes horizontal page scrolling.
   - **Resolution**: Wrap each blockquote in a container class (`.insta-embed-wrapper`) and add a responsive safeguard in `styles/widgets.css`:
     ```css
     .insta-embed-wrapper {
       width: 100%;
       max-width: 100%;
       overflow: hidden;
       display: flex;
       justify-content: center;
     }
     .insta-embed-wrapper blockquote.instagram-media {
       min-width: 0 !important;
       max-width: 100% !important;
       width: 100% !important;
       margin: 0 auto !important;
     }
     ```

6. **Why Content-Security-Policy (CSP) & CORS Can Silently Break M1 Features in a Worker**:
   - Both Leaflet CartoDB tiles and Instagram Reels rely on third-party cross-origin scripts, iframes, and image CDNs.
   - If a Cloudflare Worker or HTTP server sends a restrictive `Content-Security-Policy` header, browser DevTools will throw `Refused to frame 'https://www.instagram.com/'`, `Refused to load script 'https://www.instagram.com/embed.js'`, or `Refused to load image 'https://a.basemaps.cartocdn.com/...'`.
   - **Resolution**: The Worker/backend CSP must whitelist:
     - `script-src`: `'self' 'unsafe-inline' https://www.instagram.com https://unpkg.com`;
     - `frame-src`: `'self' https://www.instagram.com https://*.instagram.com`;
     - `img-src`: `'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://*.cdninstagram.com https://*.fbcdn.net https://images.unsplash.com https://unpkg.com`;
     - `style-src`: `'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com`;
     - `connect-src`: `'self' https://www.instagram.com https://*.instagram.com` (plus any custom API URL stored in `l2d_insta_api_endpoint`).

---

## 3. Caveats

- **No Caveats on Local Codebase Scope**: All HTML, CSS, and JS files relevant to Milestone 1 were fully inspected and analyzed.
- **Instagram API Token Configuration**: In `js/insta-highlights.js:71`, `fetchRealInstagramFeed()` reads `localStorage.getItem('l2d_insta_api_endpoint')`. If an admin configures an external proxy/API endpoint, that endpoint's domain must also be permitted by `connect-src` in the Worker CSP.

---

## 4. Conclusion & Actionable Recommendations for Milestone 1 Implementer

To complete Milestone 1 safely without DevTools console errors, broken event listeners, or layout overflow, the Implementer should execute the following 5 exact changes:

1. **Replace Leaflet OSM URL with CartoDB Voyager (`js/widgets.js:120-123`)**:
   ```javascript
   // Replace:
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     maxZoom: 19,
     attribution: '© OpenStreetMap contributors • Preston PR2 2ZN'
   }).addTo(prestonLeafletMap);

   // With:
   L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
     maxZoom: 20,
     subdomains: 'abcd',
     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> • Preston PR2 2ZN'
   }).addTo(prestonLeafletMap);
   ```

2. **Add Map Viewport Invalidation Safeguard (`js/widgets.js:144`)**:
   ```javascript
   window.addEventListener('resize', () => {
     if (prestonLeafletMap) {
       setTimeout(() => prestonLeafletMap.invalidateSize(), 200);
     }
   });
   ```

3. **Include Instagram Embed Script & Include Reel Permalinks (`index.html` & `js/insta-highlights.js`)**:
   - In `index.html` (below line 492), add:
     ```html
     <script async src="https://www.instagram.com/embed.js"></script>
     ```
   - In `js/insta-highlights.js:8-49`, update `FALLBACK_INSTA_POSTS` to include official Reel permalinks (e.g. `url: 'https://www.instagram.com/reel/C8q_X9xN0Xp/'` or `@lrnr2drvr` driving lesson reel URLs).
   - In `renderInstaFeedGrid()` (`js/insta-highlights.js:125-151`), generate Instagram embed blockquote markup **without** card-level `onclick="openInstaModal(...)` wrappers:
     ```javascript
     grid.innerHTML = feedItems.map(post => `
       <div class="insta-embed-wrapper glass-card" style="padding: 1rem; overflow: hidden; display: flex; flex-direction: column; align-items: center;">
         <blockquote class="instagram-media" data-instgrm-permalink="${post.url}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
         </blockquote>
       </div>
     `).join('');

     // CRITICAL: Process dynamic embeds after DOM injection
     if (window.instgrm && window.instgrm.Embeds && typeof window.instgrm.Embeds.process === 'function') {
       window.instgrm.Embeds.process();
     }
     ```

4. **Add Mobile Overflow Safeguard CSS (`styles/widgets.css`)**:
   - Append to `styles/widgets.css`:
     ```css
     .insta-embed-wrapper {
       width: 100%;
       max-width: 100%;
       overflow: hidden;
       display: flex;
       justify-content: center;
     }
     .insta-embed-wrapper blockquote.instagram-media {
       min-width: 0 !important;
       max-width: 100% !important;
       width: 100% !important;
       margin: 0 auto !important;
     }
     ```

5. **Worker CSP Safeguard Specification (For Cloudflare Worker / Server)**:
   - Ensure any HTTP response CSP header includes:
     - `script-src 'self' 'unsafe-inline' https://www.instagram.com https://unpkg.com`
     - `frame-src 'self' https://www.instagram.com https://*.instagram.com`
     - `img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://*.cdninstagram.com https://*.fbcdn.net https://images.unsplash.com https://unpkg.com`
     - `style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com`

---

## 5. Verification Method

1. **Static DOM & Code Verification**:
   - Inspect `js/widgets.js` to confirm `L.tileLayer` uses `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/...` and `window.addEventListener('resize', ...)` calls `invalidateSize()`.
   - Inspect `index.html` to confirm `<script async src="https://www.instagram.com/embed.js"></script>` is loaded.
   - Inspect `js/insta-highlights.js` to confirm `renderInstaFeedGrid()` outputs `<blockquote class="instagram-media">`, calls `window.instgrm.Embeds.process()`, and does **not** attach `onclick="openInstaModal(...)"` to the Reel wrapper.
   - Inspect `styles/widgets.css` to confirm `.insta-embed-wrapper blockquote.instagram-media { min-width: 0 !important; ... }` is present.

2. **Runtime & DevTools Console Verification (in Browser)**:
   - Open `index.html` in Chrome/Edge DevTools (Network tab & Console tab).
   - **Map Check**: Scroll to `#routes`. Verify that map tiles load from `*.basemaps.cartocdn.com` with `HTTP 200` status codes and zero `HTTP 403 Forbidden` errors.
   - **Resize Check**: Emulate mobile device viewports (320px–360px width) and toggle orientation (portrait ↔ landscape). Confirm `#prestonLeafletMap` renders without grey tile gaps and no horizontal scrollbar appears on the page.
   - **Reels Check**: Scroll to `#insta`. Verify that `embed.js` transforms `<blockquote class="instagram-media">` into cross-origin `<iframe>` elements without CSP/CORS console errors, and that clicking play/pause inside the Reel iframe plays video without triggering `openInstaModal()`.
