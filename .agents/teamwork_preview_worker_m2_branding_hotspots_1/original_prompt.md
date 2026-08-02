## 2026-07-31T15:17:15Z

You are the Implementation Worker for Milestone 2 of the Learner2Driver overhaul.
Your working directory is: c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_worker_m2_branding_hotspots_1\
The workspace root is: c:\Users\huzai\Documents\learner2driver\

> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Objective
Implement Milestone 2 (Brand Logo Typography, Review Vehicle Bubbles & Showroom Hotspot Live Sync) per the verified specifications in:
`c:\Users\huzai\Documents\learner2driver\.agents\orchestrator\m2_synthesis.md`

### Specific Tasks
1. **Brand Logo Typography Fix (`index.html`, `course.html`, `styles/main.css`)**:
   - In all 4 navbar/footer locations (`index.html` lines 53-56, 406-408; `course.html` lines 57-60, 173-175), wrap the brand name in `<span class="brand-text"><span class="brand-l">L</span>earner2<span class="brand-d">D</span>river</span>`.
   - In `styles/main.css` (around line 257), keep `.brand-logo { display: flex; align-items: center; gap: 0.65rem; ... }` and add supporting rules:
     ```css
     .brand-text { display: inline; white-space: nowrap; }
     .brand-l { color: var(--color-red); font-weight: 800; }
     .brand-d { color: var(--color-green); font-weight: 800; }
     ```
   - This eliminates the flexbox gap around `L` and `D` while preserving badge spacing.
2. **Review Vehicle Filter Bubbles (`index.html`, `js/reviews.js`, `styles/widgets.css` or `styles/components.css`)**:
   - Restyle the review filter buttons at the bottom (`All Reviews`, `1st Time Passes`, `Manual Yaris`, `Automatic Kona EV`) into sleek, modern, highly legible pill badges (`.review-filter-btn`, `.review-filter-btn.active`) with clear active/inactive visual states.
   - Update `js/reviews.js` so clicking a filter button toggles `.active` on the clicked button and removes it from unselected buttons.
3. **Showroom Hotspot LocalStorage Live Sync (`js/showroom.js`, `styles/widgets.css`)**:
   - In `js/showroom.js`: Update `getFleetData()` to deep-merge custom hotspot arrays from `localStorage` (`l2d_custom_hotspots` / `l2d_fleet_hotspots`) into `DEFAULT_FLEET_DATA` so vehicle metadata (`name`, `price`, `badge`, `img`, `specs`) is preserved and never becomes `undefined`.
   - Add real-time live sync: attach a `window.addEventListener('storage', ...)` listener in `js/showroom.js` that re-renders the current showroom vehicle when hotspot storage updates, and expose `window.refreshShowroomDisplay = () => renderVehicle(currentVehicleId);` for same-page programmatic refresh.
   - In `styles/widgets.css:182`: Add `margin-left: -16px; margin-top: -16px;` to circular `.car-hotspot` badges so their center sits exactly over `(X%, Y%)`.
4. **M1 Clean-up Item (`index.html:488`)**:
   - Add `id="instagram-embed-script"` to `<script id="instagram-embed-script" async src="https://www.instagram.com/embed.js"></script>` in `index.html:488`.
5. **Verification**:
   - Verify zero JS syntax errors (`node --check` across all JS files).
   - Document your changes and verification in your handoff report.

### Output Requirements
1. Write a complete report to `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_worker_m2_branding_hotspots_1\handoff.md` following the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
2. When finished, send a concise summary message back to me ("main agent") using `send_message` with the absolute path to your `handoff.md`.
