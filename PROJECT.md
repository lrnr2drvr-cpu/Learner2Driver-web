# Project: Learner2Driver Overhaul (Phase 2)

## Architecture
- **Frontend Core**: Vanilla HTML5 (`index.html`, `course.html`), modular CSS3 (`styles/*.css`), and JavaScript (`js/*.js`).
- **Data & State Management**: Client-side `localStorage` used for dynamic content persistence including:
  - Course content syllabus data (`l2d_custom_course_data`).
  - Web Crypto SHA-256 hashed Admin & Student credentials.
  - Student accounts, transmission assignments (`Manual Tuition` vs `Automatic Tuition`) & student LMS progress.
  - Website text & crop modal images (`l2d_site_content`).
  - Fleet showroom hotspot relative X%/Y% coordinates (`l2d_custom_hotspots` / `l2d_fleet_hotspots`).
  - Preston danger spot route lat/lng coordinates (`l2d_custom_routes`).
  - Dynamic student reviews & car tags (`l2d_custom_reviews`).
- **Third-Party Embeds**: Leaflet.js map tiles & location picker modal, YouTube embed previews, official Instagram Reels script embeds (`<blockquote class="instagram-media">`).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Course Content Editor & Restructured Admin Hub Layout | Interactive Course Content Editor on `course.html` (Modules/Lessons CRUD, YouTube preview, `l2d_custom_course_data` persistence); Admin Hub restructuring into Student Accounts & Progress view (default) + submenus (Course Editor, Advanced Site Settings) | Phase 1 | DONE |
| 2 | SHA-256 Security & Transmission LMS | Web Crypto SHA-256 password hashing with salt for Admin and Student credentials; Username + Password student login; Transmission assignment (Manual vs Auto) highlighting tailored curriculum lessons | M1 | DONE |
| 3 | Floating Admin Bar, Inline Edit & Drag-Hotspots | Floating Admin Top Bar on `index.html` & `course.html` with 'Enable Editing Mode' toggle; inline `contenteditable` text editing; image upload & aspect-ratio crop modal (16:9, 1:1, 4:3); drag-and-drop hotspot positioning on `#fleet` | M1, M2 | DONE |
| 4 | Map Location Picker, Dynamic Reviews & Centered Insta Feed | 'Pick Location on Map' Leaflet picker modal for Preston Danger Spots (lat/lng); Dynamic Reviews CRUD (`l2d_custom_reviews`) with custom vehicle filter pills; remove story circles & center Instagram Reels grid on desktop viewports | M1 | DONE |
| 5 | Comprehensive Code & UI/UX Audit | Zero DevTools console errors across `index.html` and `course.html`; verify persistence and responsive UI across all Phase 2 features | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Course Content Data (`js/course-data.js` / `js/course-player.js`)
- Storage key: `l2d_custom_course_data`.
- Modules & Lessons CRUD schema: Array of modules containing id, title, and lessons array (id, title, duration, transmissionTag ['Manual'|'Auto'|'All'], youtubeUrl, tip).

### Web Crypto SHA-256 Password Security
- Storage keys: `l2d_admin_auth` / `l2d_student_accounts`.
- Standard browser `crypto.subtle.digest('SHA-256', ...)` hex hashing with salt. No plain-text passwords or hints stored or displayed.

### Floating Admin Bar & Inline Editing Mode
- Floating top bar displayed when Admin is logged in.
- `contenteditable="true"` inline text elements synced to `l2d_site_content`.
- Aspect ratio crop modal enforcing 16:9 (Hero), 1:1 (Avatars), 4:3 (Vehicles).
- Drag-and-drop relative X%/Y% hotspot saving to `l2d_custom_hotspots` / `l2d_fleet_hotspots`.

### Map Picker & Reviews CRUD
- Route coordinates (`lat`/`lng`) updated via interactive Leaflet picker modal and saved to `l2d_custom_routes`.
- Reviews CRUD saved to `l2d_custom_reviews`, dynamically generating filter badges (`Manual Yaris`, `Auto Kona EV`).

## Code Layout
- `index.html` — Main landing page (map, hero, fleet showroom, reviews, instagram highlights, admin bar, inline edit mode, route map picker modal).
- `course.html` — Student LMS course player interface and Instructor Admin Hub.
- `js/app.js` — Main application logic, floating admin bar, inline edit mode, image crop modal.
- `js/booking-concierge.js` — Booking modal and pricing logic.
- `js/course-data.js` — Syllabus data structure, default modules/lessons, `l2d_custom_course_data` helper.
- `js/course-player.js` — Course player UI, video tracking, admin hub tabs, student accounts CRUD, course content editor.
- `js/insta-highlights.js` — Instagram widget & Reels rendering logic.
- `js/reviews.js` — Dynamic reviews CRUD, review filter bubbles, card rendering.
- `js/showroom.js` — Fleet vehicle showroom, hotspot display, drag-and-drop hotspot positioning.
- `js/widgets.js` — Floating widgets, Leaflet map initialization, route picker modal.
- `styles/main.css` — Core layout, branding, navbar, footer typography.
- `styles/components.css` — Showroom, hotspots, buttons, modals, admin bar & admin hub styles.
- `styles/course.css` — LMS course player & course content editor styling.
- `styles/widgets.css` — Leaflet map, review bubbles, Instagram widget styling.
