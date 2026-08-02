## 2026-08-01T08:06:26Z
You are the Implementation Worker for Learner2Driver Phase 2 - Milestone 3: Floating Admin Top Bar, Inline Edit Mode, Image Upload & Crop Modal, and Drag-and-Drop Hotspots.

Your working directory for metadata/handoff files is: `c:\Users\huzai\Documents\learner2driver\.agents\worker_p2_m3_1`
The project workspace directory is: `c:\Users\huzai\Documents\learner2driver`

Read the technical synthesis specification in `c:\Users\huzai\Documents\learner2driver\.agents\orchestrator\m3_synthesis.md` and `PROJECT.md` for complete requirements.

Key Tasks to Implement:
1. **Floating Admin Top Bar (`#floatingAdminBar`) & Session Persistence**:
   - Fixed top bar (52px height, `#0F172A` background, z-index 10000) displayed on `index.html` and `course.html` when `localStorage.getItem('l2d_is_admin') === 'true'`.
   - Includes Admin Status badge (`🛡️ Instructor Admin (username)`), center toggle edit mode button (`✏️ Edit Mode: ON/OFF`) and `📊 Admin Hub` link, and `Log Out 🚪` button.
   - Adds `admin-mode-active` class to `<body>`, pushing header down (`top: 52px`).
   - Syncs `window.L2D_EDIT_MODE` in-memory boolean and `localStorage.setItem('l2d_admin_editing_mode', ...)` state.

2. **Inline Text Editing Engine (`contenteditable`)**:
   - Decorate key text elements in `index.html` and `course.html` with `data-editable-key` attributes (e.g. `hero_badge`, `hero_heading`, `hero_text`, `stat_pass_rate_title`, `stat_passes_title`, `stat_rating_title`, `instructors_section_badge`, `instructors_section_title`, `instructors_section_sub`, `inst_farhan_bio`, `inst_binish_bio`, `fleet_section_title`, `quiz_section_title`, `routes_section_title`, `insta_section_title`, `book_section_title`, `gallery_section_title`, `reviews_section_title`, `footer_about_text`, `footer_contact_location`, `course_hero_badge`, `course_hero_heading`, `course_hero_sub`, `course_footer_about`).
   - When edit mode is active, set `contenteditable="true"` and apply green dashed accent outline (`outline: 2px dashed #059669; outline-offset: 4px;`).
   - On `blur`, save modified `innerHTML.trim()` to `l2d_custom_site_text` map in `localStorage` and trigger toast notification (`Site text updated & saved! 💾`).
   - `hydrateSiteTextFromStorage()` runs on DOMContentLoaded to populate custom text.

3. **Image Upload & Aspect-Ratio Crop Modal (`#imageCropModalBackdrop`)**:
   - Decorate target images with `data-image-key` (`hero_car`, `instructor_farhan`, `instructor_binish`, `fleet_yaris`, `fleet_kona`).
   - Wrap images in `.image-crop-target-wrapper`. When edit mode is ON or on hover, show `📷 Change Image` floating button (`.btn-image-crop-trigger`).
   - Create crop modal `#imageCropModalBackdrop` with file selector, image URL input, aspect ratio presets (16:9, 1:1, 4:3, free), and HTML5 `<canvas id="imageCropCanvas">` center-crop preview.
   - Save base64 JPEG payload to `l2d_custom_site_images` in `localStorage`.
   - `hydrateSiteImagesFromStorage()` updates `img.src` or background image on page load.
   - Put crop modal logic in `js/image-cropper.js` (or `js/app.js`) and CSS in `styles/components.css`.

4. **Interactive Drag-and-Drop Hotspot Positioning Engine**:
   - In `js/showroom.js`, when edit mode is active (`l2d_admin_editing_mode === 'true'`), add `.draggable` class to hotspot pins (`.car-hotspot`) in `#fleet`.
   - Handle pointer & touch drag events (`mousedown`/`mousemove`/`mouseup`, `touchstart`/`touchmove`/`touchend`).
   - Calculate relative percentage relative to `.showroom-car-view` bounding box, clamping between 0% and 100%.
   - Display live position readout tooltip `.hotspot-drag-tooltip` during drag (e.g. `(X: 45.2%, Y: 62.8%)`).
   - On drop, save updated coordinates to `l2d_fleet_hotspots` and `l2d_custom_hotspots` in `localStorage`, and show toast notification.

5. **File Matrix**:
   - `index.html`: `data-editable-key` attributes, `data-image-key` wrappers, append `#imageCropModalBackdrop`, script tags (`js/image-cropper.js`).
   - `course.html`: `data-editable-key` attributes, `#imageCropModalBackdrop`.
   - `js/app.js`: `initAdminTopBar()`, `setEditingMode()`, `hydrateSiteTextFromStorage()`, `setupEditableEventListeners()`, `handleAdminLogout()`, `storage` sync.
   - `js/showroom.js`: Drag-and-drop hotspot listeners, clamping math, tooltip, `saveHotspotPosition()`.
   - `js/image-cropper.js`: Crop modal logic, aspect-ratio canvas crop, `hydrateSiteImagesFromStorage()`.
   - `styles/components.css` & `styles/widgets.css`: Styling for top bar, contenteditable dashed outline, crop modal, draggable hotspots & drag tooltips.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, test all features thoroughly, verify zero console errors, write your findings and test verification details to `c:\Users\huzai\Documents\learner2driver\.agents\worker_p2_m3_1\handoff.md`, and report completion.
