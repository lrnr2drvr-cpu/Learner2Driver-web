# Milestone 4 Synthesis Report: Map Location Picker, Dynamic Reviews & Centered Instagram Feed

**Milestone**: Milestone 4 (M4)  
**Date**: 2026-08-01  
**Status**: Exploration Completed & Synthesized — Ready for Implementation  
**Target Files**:
- `index.html`
- `course.html`
- `js/widgets.js`
- `js/reviews.js`
- `js/insta-highlights.js`
- `js/app.js`
- `js/course-player.js`
- `styles/widgets.css`
- `styles/components.css`
- `styles/course.css`

---

## Executive Architectural Blueprint

Milestone 4 delivers three core features for Learner2Driver Preston:
1. **Preston Map Location Picker Modal**: Interactive Leaflet map location picker (`#mapPickerModalBackdrop`) for Preston Danger Spots, allowing instructors in Admin Edit Mode to click or drag a marker to update latitude and longitude (`lat`/`lng`) coordinates with live synchronization to main map markers, card readouts, and `l2d_custom_routes` in `localStorage`.
2. **Dynamic Reviews CRUD & Custom Vehicle Filter Pills**: Modernized review filter pills (`#reviewFilters` / `.review-filter-pill`) with live item counts (`Manual Yaris`, `Auto Kona EV`, `1st Time Pass`, etc.) dynamically generated from review data. Complete Reviews CRUD modal (`#reviewModalBackdrop`) supporting Student Name, Car Model Tag, Instructor, Rating (1-5 stars), Review Text, Pass Date, and Avatar URL, accessible via inline edit controls on `index.html` in Admin Mode and a dedicated 4th tab (`💬 Reviews CRUD Directory`) in `course.html` Admin Hub, persisting to `localStorage.getItem('l2d_custom_reviews')`.
3. **Centered Instagram Feed Overhaul**: Simplified `#insta` section by removing fake/static Instagram story avatar circles and modal handlers, overhauling grid styling (`.insta-grid`) with flexbox centering (`justify-content: center; flex: 1 1 320px; max-width: 360px`) for desktop viewports, enforcing 100% responsive containment on blockquotes/iframes (`min-width: 0 !important; width: 100% !important`), and enhancing the step-by-step Instagram API Integration Guide in `course.html` Admin Hub.

---

## Detailed Component Implementation Specifications

### Component 1: Leaflet "Pick Location on Map" Modal for Preston Danger Spots

#### Data Layer & Persistence (`js/widgets.js` & `localStorage`)
- Storage Key: `l2d_custom_routes`
- Data Structure: Dictionary mapping spot IDs (`1`, `2`, `3`, `4`) to `title`, `location`, `tip`, `lat`, `lng`.
- Implement accessor functions:
  ```js
  function getPrestonRouteTips() {
    try {
      const saved = localStorage.getItem('l2d_custom_routes');
      if (saved) return { ...DEFAULT_PRESTON_ROUTE_TIPS, ...JSON.parse(saved) };
    } catch(e) { console.error("Failed loading l2d_custom_routes:", e); }
    return { ...DEFAULT_PRESTON_ROUTE_TIPS };
  }

  function savePrestonRouteTips(tipsData) {
    try {
      localStorage.setItem('l2d_custom_routes', JSON.stringify(tipsData));
      window.dispatchEvent(new Event('storage'));
    } catch(e) { console.error("Failed saving l2d_custom_routes:", e); }
  }
  ```

#### Admin Mode UI Injection (`js/widgets.js:showRouteTip`)
- In `showRouteTip(spotId)`: check `window.L2D_EDIT_MODE || document.body.classList.contains('admin-edit-mode')`.
- Render Admin Editor Bar when Admin mode is active:
  ```html
  <div class="admin-spot-editor-bar mt-2 pt-2 border-top">
    <span class="badge bg-secondary me-2">📍 Coords: ${tipData.lat.toFixed(6)}, ${tipData.lng.toFixed(6)}</span>
    <button class="btn btn-secondary btn-sm admin-pick-location-btn" onclick="openMapPickerModal('${spotId}')">
      📍 Pick Location on Map
    </button>
  </div>
  ```

#### Leaflet Location Picker Modal (`index.html` & `js/widgets.js`)
- Modal Backdrop: `#mapPickerModalBackdrop` inserted before `</body>` in `index.html`.
- Structure: Header, coordinate pill bar (`#mapPickerLatDisplay`, `#mapPickerLngDisplay`), Leaflet canvas `#modalPickerLeafletMap` (height: 360px), action buttons (Cancel, "Save Location Coordinates 💾" via `confirmMapPickerSave()`).
- Controller Logic:
  - `openMapPickerModal(spotId)`: Record `activePickerSpotId = spotId`, read current `lat`/`lng`, show modal backdrop (`.classList.add('active')`).
  - Defer Leaflet map init/view by 150ms: `setTimeout(() => { modalPickerMap.invalidateSize(); }, 150);`.
  - Drop/update draggable pin `modalPickerMarker` at target coordinates.
  - Map click handler & marker drag event handlers update `currentTempCoords` and coordinate readouts in real time.
- Confirmation & Synchronization (`confirmMapPickerSave()`):
  - Save updated rounded `lat`/`lng` coordinates to `l2d_custom_routes` in `localStorage`.
  - Call `syncMainMapAndCard(spotId)`:
    1) Update main map marker `leafletMarkers[spotId].setLatLng([lat, lng])`.
    2) Call `showRouteTip(spotId, false)` to refresh card text and fly main map camera (`flyTo`).
  - Show toast: `showToast("Updated Location for Danger Spot #" + spotId + "! 📍")`.

#### CSS Styling (`styles/widgets.css` & `styles/components.css`)
- Style `#modalPickerLeafletMap` with border-radius, shadow, height 360px.
- Style `.admin-pick-location-btn` and coordinate badges `.coords-pill`.

---

### Component 2: Dynamic Reviews CRUD & Custom Vehicle Filter Pills

#### Data Layer & Persistence (`js/reviews.js` & `localStorage`)
- Storage Key: `l2d_custom_reviews`
- Implement accessor functions:
  ```js
  function loadReviewsFromStorage() {
    try {
      const saved = localStorage.getItem('l2d_custom_reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) { console.error("Error loading l2d_custom_reviews:", e); }
    return [...DEFAULT_REVIEWS];
  }

  function saveReviewsToStorage(reviews) {
    try {
      localStorage.setItem('l2d_custom_reviews', JSON.stringify(reviews));
      window.dispatchEvent(new Event('storage'));
    } catch(e) { console.error("Error saving l2d_custom_reviews:", e); }
  }
  ```

#### Dynamic Filter Pill Generation Engine (`#reviewFilters`)
- HTML container: Replace static `<button>` elements inside `#reviewFilters` in `index.html` with a clean dynamic container `<div id="reviewFilters" class="review-filters-wrapper"></div>`.
- Extraction logic: Scan all active reviews, aggregate unique tag tokens (`Manual Yaris`, `Auto Kona EV`, `1st Time Pass`, etc.), count items per tag.
- Render dynamic filter pills:
  ```html
  <button class="review-filter-pill active" data-filter="all" onclick="filterReviews('all', this)">
    All Reviews <span class="pill-count">6</span>
  </button>
  <button class="review-filter-pill" data-filter="Manual Yaris" onclick="filterReviews('Manual Yaris', this)">
    Manual Yaris <span class="pill-count">3</span>
  </button>
  ```
- Filtering logic (`filterReviews(tag, buttonEl)`): Toggle `.active` state, filter visible `.review-card` elements by checking if review vehicle tag includes `tag`.

#### Admin Reviews CRUD Modal & Admin Hub Tab
- Modal Backdrop: `#reviewModalBackdrop` added to `index.html` and `course.html`.
- Form Fields:
  - Student Name (`#reviewStudentName`)
  - Car Model Tag (`#reviewCarTag` e.g., `Manual Yaris`, `Auto Kona EV`)
  - Instructor (`#reviewInstructor`)
  - Star Rating (`#reviewRating`, 1 to 5)
  - Review Text (`#reviewText`)
  - Pass Date (`#reviewDate`)
  - Avatar URL (`#reviewAvatarUrl`, with automatic initial fallback)
- Inline Admin Controls on `index.html`: When `L2D_EDIT_MODE` is active, render Edit ✏️ and Delete 🗑️ action buttons on each `.review-card`, plus a global `+ Add Student Review 💬` button in `#reviews` header.
- Admin Hub 4th Tab (`course.html` & `js/course-player.js`):
  - Add `tab4` button `<button id="adminTabReviews" class="admin-tab-btn" onclick="switchAdminTab('reviews')">💬 Reviews Directory</button>` to `.admin-nav-bar` in `course.html`.
  - Render Admin Reviews Directory table listing all reviews with Student Name, Vehicle Tag, Rating, Date, and Edit/Delete buttons.

---

### Component 3: Centered Instagram Feed Overhaul

#### Story Circles Removal
- `index.html`: Remove `<div id="instaStoriesContainer">` and modal `#instaStoryModalBackdrop`. Update header subtitle to "Watch real driving lesson clips, test passes, and instructor tips!".
- `js/insta-highlights.js`: Remove `renderInstaStories()`, `openInstaModal()`, and `closeInstaModal()`.
- `styles/widgets.css`: Deprecate `.insta-stories-*` circle rules.

#### Desktop Flexbox Grid Centering (`.insta-grid`)
- `index.html`: Change `#instaFeedGrid` class from `grid-3 mt-2` to `insta-grid mt-2`.
- `styles/widgets.css`:
  ```css
  .insta-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 1.75rem;
    max-width: 1140px;
    margin: 0 auto;
  }
  .insta-embed-wrapper {
    flex: 1 1 320px;
    max-width: 360px;
    display: flex;
    justify-content: center;
  }
  ```

#### Responsive Embed Containment Overrides
- `js/insta-highlights.js`: Strip inline `min-width:326px` from generated `<blockquote class="instagram-media">` elements.
- `styles/widgets.css`:
  ```css
  .insta-embed-wrapper blockquote.instagram-media,
  .insta-embed-wrapper iframe.instagram-media,
  .insta-embed-wrapper iframe {
    min-width: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 auto !important;
  }
  ```

#### Admin Hub Instagram API Integration Guide
- `js/course-player.js`: Enhance `.insta-guide-box` in Admin Hub Tab 3 ("⚙️ Advanced Site Settings") with clear 4-step setup instructions for live Instagram Graph API access tokens, expected JSON schema example, token refresh endpoints, and live endpoint testing feedback (`testInstagramApiConnection()`).

---

## Action Plan for Implementation Worker

1. **Modify `index.html`**:
   - Update `#reviews` header with dynamic `#reviewFilters` container and `+ Add Student Review 💬` button.
   - Update `#insta` section: remove `#instaStoriesContainer`, change `#instaFeedGrid` to `class="insta-grid mt-2"`.
   - Add modal backdrops `#mapPickerModalBackdrop` and `#reviewModalBackdrop` before `</body>`.

2. **Modify `course.html`**:
   - Add 4th tab button `💬 Reviews Directory` (`#adminTabReviews`) to `.admin-nav-bar`.
   - Add tab pane `#adminReviewsPane` container in Admin Hub.

3. **Modify `js/widgets.js`**:
   - Convert `PRESTON_ROUTE_TIPS` to dynamic storage accessors `getPrestonRouteTips()` and `savePrestonRouteTips()`.
   - Inject Admin Mode "📍 Pick Location on Map" button and coordinate readouts into `showRouteTip()`.
   - Add map picker modal controller functions (`openMapPickerModal`, `closeMapPickerModal`, `confirmMapPickerSave`, `syncMainMapAndCard`).

4. **Modify `js/reviews.js`**:
   - Implement storage accessors `loadReviewsFromStorage()` and `saveReviewsToStorage()`.
   - Build dynamic filter pill generation engine (`renderReviewFilterPills()`).
   - Implement review rendering with inline Admin edit/delete buttons.
   - Implement review CRUD modal controller functions (`openReviewModal`, `saveReviewFromModal`, `deleteReview`).

5. **Modify `js/insta-highlights.js`**:
   - Clean up story circles logic.
   - Strip inline `min-width:326px` from generated blockquotes.
   - Retain `processInstaEmbeds()` for `window.instgrm.Embeds.process()`.

6. **Modify `js/app.js` & `js/course-player.js`**:
   - Add `l2d_custom_routes` and `l2d_custom_reviews` to storage event listener in `js/app.js`.
   - Implement `switchAdminTab('reviews')` and `renderAdminReviewsTable()` in `js/course-player.js`.
   - Enhance `.insta-guide-box` in `js/course-player.js`.

7. **Modify CSS (`styles/widgets.css`, `styles/components.css`, `styles/course.css`)**:
   - Add `.insta-grid` flexbox centering and responsive embed iframe overrides.
   - Add `.review-filter-pill` and active badge styles.
   - Add `#modalPickerLeafletMap` and map picker modal styles.

8. **Verification & Testing**:
   - Run browser testing: check console errors, test Leaflet map picker, test Reviews CRUD and dynamic filter pills, test Instagram centered grid across viewports.
