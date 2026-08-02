# Milestone 4 Implementation Task: Multi-Agent Comprehensive Code & UI/UX Audit Fixes

You are M4 Worker 1 (Gen 2) for Milestone 4: Multi-Agent Comprehensive Code & UI/UX Audit.
Your working directory is: c:\Users\huzai\Documents\learner2driver\.agents\worker_m4_1_gen2\
The project workspace directory is: c:\Users\huzai\Documents\learner2driver\
The synthesis specification file is at: c:\Users\huzai\Documents\learner2driver\.agents\orchestrator\m4_synthesis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your objective is to implement ALL recommended fixes specified in `c:\Users\huzai\Documents\learner2driver\.agents\orchestrator\m4_synthesis.md` across:
1. `index.html`:
   - Add `id="contact"` and `aria-label="Site footer"` to the footer tag (`line 402`).
   - Wrap primary desktop navigation (`<ul class="nav-links-desktop">`) in `<nav aria-label="Main navigation">`.
   - Add `aria-label` attributes to Readiness Quiz controls (`#sliderHours`, `#selectTheory`, `#sliderManeuvers`, `#sliderRoundabouts`).
   - Add `class="stat-counter"` and `data-target` / `data-suffix` attributes to the three Academy Trust Badges (`90%+`, `100+`, `4.9 ★`).
   - Update Showroom Switcher container (`lines 189-196`) to use `display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem;` and remove `margin-left: 0.5rem;` on `#showKonaBtn`.
   - Add `flex-wrap: wrap; gap: 0.5rem;` to the danger spot map footer, and change `gap: 3rem;` to `gap: 1.5rem;` on the trust badges container.
   - Update `#instaStoryModalBackdrop` close button style to `min-width: 44px; min-height: 44px; padding: 0.5rem;`.
2. `course.html`:
   - Add `<nav class="mobile-bottom-nav" aria-label="Mobile Navigation">` before `</body>` matching `index.html`'s bottom navigation bar (with `course.html` video link marked active) so mobile students have navigation controls.
   - Wrap desktop navigation `<ul class="nav-links-desktop">` in `<nav aria-label="Course navigation">`.
3. `styles/*.css` (`styles/widgets.css`, `styles/components.css`, `styles/course.css`):
   - In `styles/widgets.css`, set `.car-hotspot` to `width: 44px; height: 44px; margin-left: -22px; margin-top: -22px;` and `.leaflet-custom-circle-pin` to `width: 44px; height: 44px;`.
   - In `styles/components.css` & `styles/course.css`, add `min-height: 44px;` to `.review-filter-btn`, `.danger-spot-btn`, `.lesson-item`, and `.btn`.
   - In `styles/components.css`, set `.pass-gallery-grid` to `grid-template-columns: 1fr;` on `< 576px` phones, `repeat(2, 1fr)` at `@media (min-width: 576px)`, and `repeat(4, 1fr)` at `@media (min-width: 768px)`. Add `flex-wrap: wrap; gap: 0.5rem;` to `.concierge-step-bar`.
   - In `styles/course.css`, add `max-height: 90vh; overflow-y: auto;` to `.student-portal-card`.
   - In `styles/components.css`, change `.toast-container` z-index from `3000` to `6000`.
4. JavaScript files (`js/app.js`, `js/course-player.js`, `js/showroom.js`, `js/booking-concierge.js`, `js/insta-highlights.js`, `js/widgets.js`):
   - In `js/app.js`: Add `if (isNaN(target)) return;` in `animateCounter(el)`. Wrap `document.querySelector(targetId)` in `initSmoothScroll()` with `try { ... } catch (err) {}`. Wrap `localStorage` calls in try/catch.
   - In `js/course-player.js`: Delete the shadowed local `function showToast(msg)` definition (`lines 937-947`) so it uses global `window.showToast`. Check `(m.lessons || []).some(...)` in `toggleLessonComplete()`. Check `if (!courseState.studentProgress[studentName]) return;` in `resetStudentProgress()`. Wrap all `localStorage` calls in try/catch.
   - In `js/showroom.js`: Guard `const car = fleet[vehicleId] || fleet.yaris || DEFAULT_FLEET_DATA.yaris;`. Render `.car-hotspot` pins as semantic `<button type="button" class="car-hotspot" ... aria-label="Hotspot #${hs.id}: ${hs.title}">`.
   - In `js/booking-concierge.js`: Create `updateTotalPrice()` helper that recomputes `bookingState.totalPrice = Math.round(base - (base * discount))` from `rate`, `hours`, and `discount`, and call it inside `selectVehicle()`, `selectPackage()`, and at the start of `renderConciergeStep(4)`.
   - In `js/insta-highlights.js`: In `fetchRealInstagramFeed()`, replace `'assets/hero-yaris.png'` with `'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop'`. Add `.onerror` handler on script creation. Add `Escape` key (`keydown`) and backdrop click event listeners to close `#instaStoryModalBackdrop`.
   - In `js/widgets.js`: In `initPrestonLeafletMap()`, add `if (prestonLeafletMap !== null) return;`.

When finished:
- Test your changes thoroughly (check syntax, ensure no broken references or syntax errors).
- Write a detailed handoff report to `c:\Users\huzai\Documents\learner2driver\.agents\worker_m4_1_gen2\handoff.md` detailing all file changes, code blocks modified, and verification results.
- Send a completion message via `send_message` with the summary and path to your handoff report.
