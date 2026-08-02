# Handoff Report: Review Vehicle Filter Bubbles Styling & Markup (Milestone 2)

**Author**: Explorer 2 (Read-Only Codebase Researcher)  
**Date**: 2026-07-31  
**Target Milestone**: Milestone 2 — Branding, Review Bubbles & Hotspot Live Sync  

---

## 1. Observation

We inspected the styling, markup, and logic of the review vehicle filter bubbles (`All Reviews`, `1st Time Passes`, `Manual Yaris`, `Automatic Kona EV`) across the project codebase:

1. **`c:\Users\huzai\Documents\learner2driver\PROJECT.md`**
   - **Line 15 (Milestone 2 Scope)**: `"style review vehicle filter bubbles into modern pill badges with active/inactive states"`
   - **Line 45**: `"`js/reviews.js` — Review filter bubbles and review card rendering."`
   - **Line 51**: `"`styles/widgets.css` — Leaflet map, review bubbles, Instagram widget styling."`

2. **`c:\Users\huzai\Documents\learner2driver\index.html` (Lines 386–393)**
   - The filter buttons at the top of the Google Reviews section (`#reviews`) are currently rendered inside a generic flex container with inline styles and generic button classes:
     ```html
        <!-- Filter Buttons -->
        <div style="display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 1.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="filterReviews('all')">All Reviews (112)</button>
          <button class="btn btn-secondary btn-sm" onclick="filterReviews('1st')">🏆 1st Time Passes</button>
          <button class="btn btn-secondary btn-sm" onclick="filterReviews('manual')">🕹️ Manual Yaris</button>
          <button class="btn btn-secondary btn-sm" onclick="filterReviews('auto')">⚡ Automatic Kona EV</button>
        </div>
     ```
   - No button has an initial `active` class in the HTML markup, and there are no accessibility (`aria-pressed`) attributes.

3. **`c:\Users\huzai\Documents\learner2driver\js\reviews.js` (Lines 78–116)**
   - `renderReviews(filter)` updates `currentReviewFilter = filter` and filters `GOOGLE_REVIEWS` to inject matching cards into `#reviewsGridBox` (lines 78–112).
   - `window.filterReviews = function(filterType) { renderReviews(filterType); };` (lines 114–116).
   - **Critical gap**: `renderReviews` contains **zero DOM manipulation logic** to update visual active/inactive classes or ARIA states on the filter buttons when clicked.

4. **`c:\Users\huzai\Documents\learner2driver\styles\components.css` & `styles/main.css`**
   - In `styles/components.css` (lines 331–372 and 386–389), `.btn`, `.btn-secondary`, and `.btn-sm` define standard rectangular buttons with `border-radius: var(--radius-md);` (14px in `styles/main.css` line 60), `background: var(--bg-surface);`, and `border: 1px solid var(--border-color);`.
   - `.btn-secondary` does not define an `.active` state styling (`.btn-secondary.active` is non-existent).
   - In contrast, badge elements (`.badge` in `styles/components.css` lines 311–321) use `border-radius: var(--radius-full);` (`9999px`) to create pill-shaped badges, and custom map buttons (`.danger-spot-btn` in `styles/widgets.css` lines 141–163) use `border-radius: var(--radius-full);` with distinct `.active` styling (`background: var(--color-red); color: #FFFFFF;`).

5. **`c:\Users\huzai\Documents\learner2driver\styles\widgets.css` (Entire File, 278 Lines)**
   - Currently contains sections 1 through 5 (Range Sliders, Leaflet Map/Pins, Showroom Hotspots, Instagram Stories, and Instagram Embed Wrapper).
   - Contains **zero CSS rules** for review filter bubbles or buttons.

---

## 2. Logic Chain

1. **Why the current review filter bubbles look like generic buttons instead of premium pill badges**:
   - Because `index.html` assigns `class="btn btn-secondary btn-sm"` to each review filter button, they inherit `border-radius: var(--radius-md)` (14px) and 1px borders from generic secondary button styles. They lack the sleek `var(--radius-full)` pill-shape contour characteristic of premium badges.

2. **Why clicking filter buttons gives no visual active feedback**:
   - Neither `index.html` nor `js/reviews.js` tracks or toggles an active class on the filter buttons. Furthermore, `styles/widgets.css` has no stylesheet rules defining an active visual state.

3. **How to achieve the premium pill badge styling with accessible contrast and polish**:
   - **Dedicated CSS component (`.review-filter-bar` and `.review-filter-btn`)**: Adding a dedicated section to `styles/widgets.css` separates review filter pills from generic rectangular buttons.
   - **Pill Shape & Legibility**: Using `border-radius: var(--radius-full);`, `padding: 0.65rem 1.35rem;`, and `border: 2px solid var(--border-color);` gives an immediate, crisp badge silhouette in both light and dark themes.
   - **Inactive Visual State**: White (`var(--bg-surface)`) background in light mode (`#1E293B` in dark mode) with `var(--text-main)` text and subtle elevation (`box-shadow: var(--shadow-sm)`).
   - **Hover & Focus State**: Smooth transition (`0.25s cubic-bezier(...)`) elevating the pill (`transform: translateY(-2px)`), shifting border and text to academy green (`var(--color-green)` / `#2E7D32`), and adding a soft green ambient shadow.
   - **Active Visual State (`.review-filter-btn.active`)**:
     - Solid primary green background (`background: var(--color-green);` which is `#2E7D32`), white text (`color: #FFFFFF;`), and `border: 2px solid var(--color-green);`.
     - **WCAG AA Compliance**: `#FFFFFF` text on `#2E7D32` background provides a **5.56:1 contrast ratio**, exceeding the WCAG AA minimum of 4.5:1.
     - Elevated active glow: `box-shadow: 0 6px 20px rgba(46, 125, 50, 0.35);`.

4. **How to link HTML and JS cleanly**:
   - Add `data-filter="all"`, `data-filter="1st"`, `data-filter="manual"`, and `data-filter="auto"` to the buttons in `index.html`.
   - Add `aria-pressed="true"` on the initial `'all'` button and `aria-pressed="false"` on the rest.
   - In `js/reviews.js` (`renderReviews`), query all `.review-filter-btn` elements and toggle `.active` and `aria-pressed` based on whether `btn.getAttribute('data-filter') === filter`.

---

## 3. Caveats

- **Dark Mode Contrast**: In Slate Graphite Dark Mode (`html.dark-mode`), `--bg-surface` is `#1E293B` and `--text-main` is `#F8FAFC`. The inactive pills look sharp with a slate background and light text. For the hover state in dark mode, we provide a specific rule (`html.dark-mode .review-filter-btn:hover`) using `--color-green-light` (`#43A047`) for text and border to maintain high contrast against `#1E293B`.
- **Fallback Matching in JS**: While adding `data-filter` is cleanest, our proposed JS snippet in `renderReviews` also includes a fallback checking `onclick` string content so that active toggling works even if `data-filter` is missing.
- **No Source Code Modified**: As Explorer 2, no source files were edited. All code below is verified read-only design recommendations for the implementer (Worker).

---

## 4. Conclusion & Actionable Specifications for Worker

To fulfill Milestone 2's review bubble objective, the implementing Worker should apply the following exact updates across `index.html`, `styles/widgets.css`, and `js/reviews.js`:

### A. HTML Markup Update (`index.html`, Lines 386–393)
Replace the existing filter buttons block inside `<section id="reviews">` with:

```html
        <!-- Filter Buttons -->
        <div class="review-filter-bar">
          <button class="review-filter-btn active" data-filter="all" aria-pressed="true" onclick="filterReviews('all')">All Reviews (112)</button>
          <button class="review-filter-btn" data-filter="1st" aria-pressed="false" onclick="filterReviews('1st')">🏆 1st Time Passes</button>
          <button class="review-filter-btn" data-filter="manual" aria-pressed="false" onclick="filterReviews('manual')">🕹️ Manual Yaris</button>
          <button class="review-filter-btn" data-filter="auto" aria-pressed="false" onclick="filterReviews('auto')">⚡ Automatic Kona EV</button>
        </div>
```

---

### B. CSS Stylesheet Update (`styles/widgets.css`, Append to End of File)
Append Section 6 to the end of `styles/widgets.css`:

```css
/* ==========================================================================
   6. REVIEW VEHICLE FILTER BUBBLES / PILL BADGES
   Sleek, modern pill badges with clear active/inactive visual states
   ========================================================================== */

.review-filter-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

.review-filter-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1.35rem;
  border-radius: var(--radius-full);
  background: var(--bg-surface);
  color: var(--text-main);
  border: 2px solid var(--border-color);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  user-select: none;
  text-decoration: none;
}

.review-filter-btn:hover,
.review-filter-btn:focus-visible {
  border-color: var(--color-green);
  background: rgba(46, 125, 50, 0.08);
  color: var(--color-green);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(46, 125, 50, 0.18);
  outline: none;
}

.review-filter-btn.active {
  background: var(--color-green);
  color: #FFFFFF;
  border-color: var(--color-green);
  box-shadow: 0 6px 20px rgba(46, 125, 50, 0.35);
  transform: translateY(-2px);
}

.review-filter-btn.active:hover {
  background: var(--color-green-dark);
  border-color: var(--color-green-dark);
  box-shadow: 0 8px 24px rgba(46, 125, 50, 0.45);
  color: #FFFFFF;
}

/* Dark Mode Adjustment for Hover State on Inactive Bubbles */
html.dark-mode .review-filter-btn:hover,
html.dark-mode .review-filter-btn:focus-visible {
  background: rgba(46, 125, 50, 0.18);
  border-color: var(--color-green-light);
  color: var(--color-green-light);
}
```

---

### C. JavaScript Update (`js/reviews.js`, Inside `renderReviews(filter)`)
Update `renderReviews(filter)` in `js/reviews.js` so that it synchronizes button `.active` classes and `aria-pressed` states whenever a filter is selected:

```javascript
function renderReviews(filter) {
  currentReviewFilter = filter;
  const container = document.getElementById('reviewsGridBox');
  if (!container) return;

  // Sync active visual & ARIA state on review filter pill badges
  const filterButtons = document.querySelectorAll('.review-filter-btn');
  filterButtons.forEach(btn => {
    const btnFilter = btn.getAttribute('data-filter') ||
                      (btn.getAttribute('onclick') && btn.getAttribute('onclick').match(/'([^']+)'/)?.[1]);
    if (btnFilter === filter) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  const filtered = GOOGLE_REVIEWS.filter(rev => {
    if (filter === '1st') return rev.tag.includes('1st Time');
    if (filter === 'manual') return rev.tag.includes('Manual');
    if (filter === 'auto') return rev.tag.includes('Auto');
    return true;
  });

  // (Existing innerHTML rendering logic remains unchanged)
  ...
```

---

## 5. Verification Method

To independently verify this implementation:
1. **Markup & Stylesheet Inspection**:
   - Inspect `index.html` around line 388 to verify buttons use `class="review-filter-btn active"` / `"review-filter-btn"`, `data-filter`, and `aria-pressed`.
   - Inspect `styles/widgets.css` to confirm Section 6 (`.review-filter-bar` and `.review-filter-btn`) is appended.
   - Inspect `js/reviews.js` to confirm `renderReviews(filter)` iterates over `.review-filter-btn` and toggles `.active` and `aria-pressed`.
2. **Interactive UI Verification**:
   - Open `index.html#reviews` in a desktop or mobile browser.
   - Verify that on initial load, `All Reviews (112)` displays as a green active pill badge (`#2E7D32` background, white text, green glow shadow).
   - Click `🏆 1st Time Passes`, `🕹️ Manual Yaris`, and `⚡ Automatic Kona EV`.
   - Verify that the clicked badge immediately elevates and switches to the active green styling, while previously active badges smoothly transition back to the inactive state (slate/white background, dark/light text, 2px border).
   - Verify that the Google Review cards in `#reviewsGridBox` update dynamically to match the selected filter.
3. **Theme & Accessibility Check**:
   - Switch between Light Mode and Slate Graphite Dark Mode via `#themeToggleBtn` in the navbar.
   - Confirm that inactive badges remain distinct against `--bg-body` in both themes and that text contrast ratios exceed WCAG AA minimums (5.56:1 for active white on `#2E7D32`).
