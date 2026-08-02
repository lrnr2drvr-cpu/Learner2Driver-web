# BRIEFING — 2026-07-31T19:00:40Z

## Mission
Investigate Admin Portal Site Content Editor and Hotspot Coordinate Editor (X%/Y%) in course.html, js/course-player.js, and js/showroom.js, and recommend HTML/JS enhancements for intuitive, robust editing and real-time showroom sync.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only codebase researcher
- Working directory: c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m3_admin_lms_2\
- Original parent: 8e2b87ca-0bbd-487a-b29d-55316fdee0db
- Milestone: Milestone 3 (Instructor Admin Portal & LMS Progress Fix)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify project source files
- Only write to working directory c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m3_admin_lms_2\
- No external web requests (CODE_ONLY mode)

## Current Parent
- Conversation ID: 8e2b87ca-0bbd-487a-b29d-55316fdee0db
- Updated: 2026-07-31T19:00:40Z

## Investigation State
- **Explored paths**: `PROJECT.md`, `course.html`, `js/course-player.js`, `js/showroom.js`, `index.html`, `js/app.js`, `js/widgets.js`, `js/reviews.js`, `js/booking-concierge.js`, `js/insta-highlights.js`, `js/course-data.js`
- **Key findings**:
  1. Site Content Editor ("update website text, headings, images") required by `PROJECT.md`:30 is currently missing/unimplemented in `js/course-player.js` and `course.html`.
  2. Hotspot Editor in `js/course-player.js`:467-544 only provides `<input type="number">` fields for `X%` and `Y%`. It lacks inputs for `title` and `desc`, and `saveAdminContentEditorSettings()` hardcodes `title` and `desc` on save, overwriting any customizations.
  3. Real-time showroom sync from `course.html` fails because `course.html` does not include `js/showroom.js` nor `#showroomDisplayBox`; `refreshShowroomDisplay` is undefined. Cross-tab `storage` events work for `index.html#fleet`, but inline visual feedback on `course.html` is missing.
- **Unexplored areas**: None.

## Key Decisions Made
- Recommended 4 exact HTML/JS enhancements:
  1. Add a complete Site Content Editor (`l2d_site_content`) in `js/course-player.js` and consumer in `js/app.js`.
  2. Add `title` and `desc` input fields to the Hotspot Editor and dynamically read/save them to both `l2d_custom_hotspots` and `l2d_fleet_hotspots`.
  3. Provide an inline Showroom live preview modal/canvas with click-to-place visual percentage coordinate selection.
  4. Implement cross-tab and same-tab event broadcasting and clear instructor toast feedback.

## Artifact Index
- c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m3_admin_lms_2\original_prompt.md — Original prompt
- c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m3_admin_lms_2\handoff.md — Comprehensive Handoff Protocol report
- c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m3_admin_lms_2\progress.md — Progress heartbeat
