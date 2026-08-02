# Handoff Report — M4 Explorer 3 (Centered Instagram Feed Specialist)

## 1. Observation

### HTML Structure (`index.html`)
- **Location**: `index.html` lines 328–343 and 482–495.
- **Section Elements**:
  - `index.html:337`: `<div id="instaStoriesContainer" class="insta-stories-scroll mb-3"></div>` (renders story rings).
  - `index.html:340`: `<div id="instaFeedGrid" class="grid-3 mt-2"></div>` (uses rigid 3-column `.grid-3`).
  - `index.html:482–495`: `<div id="instaStoryModalBackdrop" class="modal-backdrop">...</div>` (story preview modal).
  - `index.html:501`: `<script id="instagram-embed-script" async src="https://www.instagram.com/embed.js"></script>`.
  - `index.html:509`: `<script src="js/insta-highlights.js"></script>`.

### JavaScript Logic (`js/insta-highlights.js`)
- **Location**: `js/insta-highlights.js` lines 1–231.
- **Key Functions**:
  - `initInstaHighlights()` (lines 61–65): Calls `fetchRealInstagramFeed()`, `renderInstaStories()`, `renderInstaFeedGrid()`.
  - `renderInstaStories()` (lines 109–123): Populates `#instaStoriesContainer` with story circles and `openInstaModal(storyId)` click handlers.
  - `renderInstaFeedGrid()` (lines 125–161): Populates `#instaFeedGrid` with `<blockquote class="instagram-media">` embeds using inline style `min-width:326px; max-width:540px; width:100%;`.
  - `processInstaEmbeds()` (lines 163–184): Executes `window.instgrm.Embeds.process()`.
  - Story Modal Handlers (lines 186–231): `openInstaModal` and `closeInstaModal`.

### CSS Layout Rules (`styles/widgets.css` & `styles/course.css`)
- **Location**: `styles/widgets.css` lines 210–280.
- **CSS Selectors**:
  - `.insta-stories-scroll`, `.insta-story-item`, `.insta-story-ring`, `.insta-story-inner`, `.insta-story-title` (lines 210–269).
  - `.insta-embed-wrapper`, `.insta-embed-wrapper blockquote.instagram-media` (lines 271–280).
- **Location**: `styles/course.css` line 230: `.insta-guide-box` background and border styling inside Admin Hub.

### Admin Hub API Guide (`js/course-player.js`)
- **Location**: `js/course-player.js` lines 1124–1146 (`renderAdminSiteSettings()`) and lines 1412–1432 (`testInstagramApiConnection()`).
- **Elements**: Input `#editInstaEndpoint`, test button `testInstagramApiConnection()`, container `.insta-guide-box`.

---

## 2. Logic Chain

1. **Observation**: `index.html:337` and `js/insta-highlights.js:109–123` render fake/static story avatar circles in `#instaStoriesContainer` and wire modal preview dialogs.
   **Inference**: Story avatar circles add visual noise and duplicate the content shown in post embeds. Removing `#instaStoriesContainer` and modal handlers simplifies `#insta` section focus purely onto video embeds (Reels & Posts).

2. **Observation**: `index.html:340` uses `class="grid-3 mt-2"` for `#instaFeedGrid`. In `styles/main.css:433–464`, `.grid-3` uses standard `grid-template-columns: repeat(3, 1fr)`.
   **Inference**: When 1 or 2 posts exist or on widescreen desktop displays, cards either left-align or stretch unnaturally across wide column tracks. Replacing `.grid-3` with a flexbox container `.insta-grid` using `justify-content: center`, `flex: 1 1 320px`, and `max-width: 360px` per card ensures Reels/Posts are always centered on desktop viewports without awkward whitespace.

3. **Observation**: `js/insta-highlights.js:134` injects `<blockquote class="instagram-media" ... style="min-width:326px; ...">`. Instagram's embed script replaces/wraps blockquotes with dynamically created `<iframe>` tags.
   **Inference**: Rigid inline `min-width: 326px` causes horizontal overflow on screens under 360px wide. Stripping inline `min-width:326px` from the blockquote HTML and declaring CSS rules with `min-width: 0 !important; max-width: 100% !important; width: 100% !important;` for `.insta-embed-wrapper iframe` guarantees 100% responsive containment across all screen sizes.

4. **Observation**: `js/course-player.js:1124–1146` renders `.insta-guide-box` in Admin Hub Tab 3 ("⚙️ Advanced Site Settings").
   **Inference**: Instructors require clear instructions for configuring live Instagram Graph API or proxy feed URLs. Enhancing `.insta-guide-box` with explicit 4-step setup instructions and a JSON response schema reference ensures seamless API setup and connection testing.

---

## 3. Caveats

- **External Network Restriction**: The system operates in CODE_ONLY mode, so live HTTP requests to Instagram Graph API (`graph.instagram.com`) cannot be executed during local testing; `fetchRealInstagramFeed()` falls back to `FALLBACK_INSTA_POSTS` as designed.
- **Instagram SDK Script Execution**: Instagram's `embed.js` script dynamically mutates the DOM by swapping `<blockquote class="instagram-media">` with `<iframe>`. CSS overrides MUST target both `blockquote.instagram-media` AND `iframe.instagram-media` / `iframe` inside `.insta-embed-wrapper` using `!important`.

---

## 4. Conclusion

To achieve a cleanly centered, fully responsive Instagram section and comprehensive Admin setup guide:
1. **Remove Story Circles**: Delete `#instaStoriesContainer` from `index.html`, remove `renderInstaStories()` from `js/insta-highlights.js`, update header subtitle, and clean up story modal code.
2. **Center Desktop Grid**: Replace `class="grid-3 mt-2"` on `#instaFeedGrid` with `class="insta-grid mt-2"`. Add `.insta-grid` flexbox CSS (`justify-content: center; flex: 1 1 320px; max-width: 360px`) in `styles/widgets.css`.
3. **Responsive Embeds**: Strip inline `min-width: 326px` from blockquote rendering in `js/insta-highlights.js`, and add iframe responsiveness CSS rules (`min-width: 0 !important; max-width: 100% !important; width: 100% !important`).
4. **Admin Integration Guide**: Enhance `.insta-guide-box` in `js/course-player.js` with structured step-by-step instructions, JSON schema example, and endpoint connection testing feedback.

---

## 5. Verification Method

### File Inspection
- Verify `index.html` section `#insta` contains `<div id="instaFeedGrid" class="insta-grid mt-2"></div>` without `#instaStoriesContainer`.
- Verify `js/insta-highlights.js` contains `initInstaHighlights()` invoking `fetchRealInstagramFeed()` and `renderInstaFeedGrid()`.
- Verify `styles/widgets.css` contains `.insta-grid` flex centering rules and `.insta-embed-wrapper iframe` responsive overrides.
- Verify `js/course-player.js` contains `.insta-guide-box` rendering inside `renderAdminSiteSettings()`.

### Layout & Responsiveness Checklist
- **Desktop (≥1024px)**: 3 Reel/Post cards centered side-by-side inside `#instaFeedGrid`.
- **Tablet (640px–1023px)**: Cards center cleanly across 2 columns.
- **Mobile (<640px)**: Cards stack 1-column full width without horizontal scrolling or min-width clipping.
