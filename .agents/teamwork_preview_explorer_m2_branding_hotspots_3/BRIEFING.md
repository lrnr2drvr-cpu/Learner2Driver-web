# BRIEFING — 2026-07-31T15:12:46Z

## Mission
Investigate car showroom hotspot coordinates (`X%` and `Y%`) and design a robust `localStorage` live sync architecture in `index.html#fleet` and `js/showroom.js`, and document M1 clean-up item for Instagram embed script.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only codebase researcher for Milestone 2 of the Learner2Driver overhaul
- Working directory: c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m2_branding_hotspots_3\
- Original parent: 8e2b87ca-0bbd-487a-b29d-55316fdee0db
- Milestone: Milestone 2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify or create any source code files
- Only write to working directory (`c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m2_branding_hotspots_3\`)

## Current Parent
- Conversation ID: 8e2b87ca-0bbd-487a-b29d-55316fdee0db
- Updated: 2026-07-31T15:12:46Z

## Investigation State
- **Explored paths**:
  - `PROJECT.md` (lines 20-24)
  - `index.html` (lines 181-204, 488)
  - `js/showroom.js` (entire file, especially lines 8-47, 55-63, 87-151)
  - `js/course-player.js` (lines 431-603)
  - `js/insta-highlights.js` (lines 163-183)
  - `styles/widgets.css` (lines 166-204)
  - `styles/components.css`
  - `js/app.js`
- **Key findings**:
  1. `localStorage` Storage Key: The project currently uses `l2d_custom_hotspots` in both `js/showroom.js:56` (`getFleetData()`) and `js/course-player.js:431,592` (`renderAdminContentEditor()` / `saveAdminContentEditorSettings()`).
  2. Critical Schema/Merge Bug: Admin savings via `js/course-player.js:575-592` store only `{ yaris: { hotspots: [...] }, kona: { hotspots: [...] } }`. Because `getFleetData()` in `js/showroom.js:55-63` returns `JSON.parse(custom)` directly without merging with `DEFAULT_FLEET_DATA`, calling `renderVehicle` on stored admin data causes `car.name`, `car.badge`, `car.price`, `car.img`, and `car.specs` to be `undefined`.
  3. CSS Positioning Offset: In `styles/widgets.css:182-198`, `.car-hotspot` is `32px` wide/high and positioned via `left: X%; top: Y%;` in `js/showroom.js:104`. This places the top-left corner at `(X%, Y%)`. Adding `margin-left: -16px; margin-top: -16px;` (or CSS `translate: -50% -50%`) centers the badge accurately over `(X%, Y%)` without conflicting with `@keyframes hotspotPulse`.
  4. Cross-Tab Live Sync: Adding a `'storage'` window event listener in `js/showroom.js` will enable automatic live re-rendering of showroom hotspots when Admin saves coordinates in another tab.
  5. M1 Clean-up Item: `index.html:488` lacks `id="instagram-embed-script"`, causing `processInstaEmbeds()` in `js/insta-highlights.js:172-179` to fail `document.getElementById('instagram-embed-script')` and inject a duplicate `<script>` tag into `document.body`.
- **Unexplored areas**: None. All target areas fully inspected and verified.

## Key Decisions Made
- Initialized briefing and recorded original prompt.
- Standardized storage key recommendation to `l2d_custom_hotspots` (with fallback support for `l2d_fleet_hotspots`).
- Designed deep-merge schema pattern for `getFleetData()` so vehicle metadata (`name`, `price`, `badge`, `img`, `specs`) is never lost when custom hotspots are stored in `localStorage`.

## Artifact Index
- `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m2_branding_hotspots_3\original_prompt.md` — Record of original prompt
- `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m2_branding_hotspots_3\progress.md` — Liveness heartbeat tracking file
- `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m2_branding_hotspots_3\handoff.md` — Comprehensive 5-component report on hotspot storage, live sync architecture, and M1 Instagram embed script clean-up
