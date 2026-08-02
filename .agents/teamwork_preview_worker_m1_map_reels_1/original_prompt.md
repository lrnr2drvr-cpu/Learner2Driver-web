## 2026-07-31T15:02:51Z

You are the Implementation Worker for Milestone 1 of the Learner2Driver overhaul.
Your working directory is: c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_worker_m1_map_reels_1\
The workspace root is: c:\Users\huzai\Documents\learner2driver\

> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Objective
Implement Milestone 1 (Reliable Map Tiles & Live Playable Instagram Reels Embeds on index.html) per the verified specifications in:
`c:\Users\huzai\Documents\learner2driver\.agents\orchestrator\m1_synthesis.md`

### Specific Tasks
1. **Leaflet Map Tile Fix (`js/widgets.js`, `styles/widgets.css`)**:
   - In `js/widgets.js`, replace the HTTP 403-erroring OpenStreetMap tile layer URL (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) with CartoDB Voyager (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`) with `subdomains: 'abcd'`, `maxZoom: 20`, and full CARTO + OSM attribution.
   - Add a window resize event listener calling `prestonLeafletMap.invalidateSize()` to ensure clean mobile rendering.
   - Remove any unnecessary animated initial zoom `flyTo(1)` calls that trigger redundant tile requests.
2. **Instagram Reels Embeds (`js/insta-highlights.js`, `index.html`, `styles/widgets.css`)**:
   - In `js/insta-highlights.js`, replace static `FALLBACK_INSTA_POSTS` with 5 realistic driving lesson/pass Reels permalinks (`/reel/C7xPq8toDV2/`, `/reel/C8aM12pqL91/`, `/reel/C9kR34vwE05/`, `/reel/C6mN89qrT43/`, `/reel/C5jL56mnK21/`).
   - Modify `renderInstaFeedGrid()` to generate official `<blockquote class="instagram-media" data-instgrm-permalink="...">` tags.
   - IMPORTANT: Remove any card-level `onclick="openInstaModal(post.id)"` wrappers around the Reel embed blockquotes so interactive video controls (play, pause, mute) work directly without triggering the static image modal.
   - Dynamically load or include official `https://www.instagram.com/embed.js` script and call `window.instgrm.Embeds.process()` after DOM injection.
   - In `styles/widgets.css`, add mobile overflow protection for Instagram embeds:
     ```css
     .insta-embed-wrapper blockquote.instagram-media {
       min-width: 0 !important;
       max-width: 100% !important;
       width: 100% !important;
     }
     ```
3. **Verification**:
   - Verify that your code changes are syntactically valid and clean.
   - Document your changes and verification in your handoff report.

### Output Requirements
1. Write a complete report to `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_worker_m1_map_reels_1\handoff.md` following the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
2. When finished, send a concise summary message back to me ("main agent") using `send_message` with the absolute path to your `handoff.md`.
