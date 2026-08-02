# Technical Synthesis & Implementation Plan — Milestone 3

## Executive Summary
Milestone 3 delivers the **Floating Admin Top Bar, Inline Text Editing Mode, Image Upload & Aspect-Ratio Crop Modal, and Interactive Drag-and-Drop Hotspot Positioning Engine** for Learner2Driver Phase 2.

All implementations operate natively client-side using standard HTML5 APIs (Web Storage, Canvas 2D Context, Touch/Mouse Event Listeners, DOM ContentEditable) with zero external library dependencies.

---

## 1. Floating Admin Top Bar & Session Persistence

### Requirements
- Display a fixed top bar (`#floatingAdminBar`) on both `index.html` and `course.html` whenever the user is logged in as an instructor admin (`l2d_is_admin === 'true'`).
- The bar sits at `position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 10000;` with slate graphite background (`#0F172A`).
- Contains:
  - **Left**: Admin Status Badge (`🛡️ Instructor Admin (username)`).
  - **Center**: Toggle Edit Mode Button (`✏️ Edit Mode: ON / OFF`) and Admin Hub link (`📊 Admin Hub`).
  - **Right**: Log Out Button (`Log Out 🚪`).
- Adds `admin-mode-active` class to `<body>`, adjusting sticky header positioning (`top: 52px`).

### Data & State Management
- `localStorage.setItem('l2d_is_admin', 'true')` set upon successful admin authentication in `js/course-player.js`.
- `localStorage.setItem('l2d_admin_editing_mode', 'true' | 'false')` stores toggle state.
- `window.L2D_EDIT_MODE` holds in-memory boolean flag.

---

## 2. Inline Text Editing Engine (`contenteditable`)

### Target Element Decoration (`[data-editable-key]`)
Decorate key text elements across `index.html` and `course.html` with unique keys:
- `index.html`: `hero_badge`, `hero_heading`, `hero_text`, `stat_pass_rate_title`, `stat_passes_title`, `stat_rating_title`, `instructors_section_badge`, `instructors_section_title`, `instructors_section_sub`, `inst_farhan_bio`, `inst_binish_bio`, `fleet_section_title`, `quiz_section_title`, `routes_section_title`, `insta_section_title`, `book_section_title`, `gallery_section_title`, `reviews_section_title`, `footer_about_text`, `footer_contact_location`.
- `course.html`: `course_hero_badge`, `course_hero_heading`, `course_hero_sub`, `course_footer_about`.

### Editing Behavior & Styling
- When `window.L2D_EDIT_MODE` is `true`:
  - `contenteditable="true"` is set on all `[data-editable-key]` elements.
  - Accent styling: `outline: 2px dashed #059669; outline-offset: 4px; border-radius: 4px; cursor: text;`.
  - Focus/Hover styling: `outline: 2px solid #10B981; background: rgba(5, 150, 105, 0.08);`.
- On `blur`:
  - Extract element `data-editable-key` and `innerHTML.trim()`.
  - Save to `l2d_custom_site_text` JSON map in `localStorage`.
  - Trigger toast notification (`Site text updated & saved! 💾`).

### Hydration (`hydrateSiteTextFromStorage()`)
- Runs on `DOMContentLoaded` on both `index.html` and `course.html`.
- Parses `l2d_custom_site_text` and sets `el.innerHTML = customText[key]` for all matching `[data-editable-key]` elements.

---

## 3. Image Upload & Aspect-Ratio Crop Modal

### Target Image Decoration (`[data-image-key]`)
Decorate customizable site image elements with unique keys:
- `hero_car` (Hero background / car graphic)
- `instructor_farhan` (Farhan bio photo)
- `instructor_binish` (Binish bio photo)
- `fleet_yaris` (Toyota Yaris showroom image)
- `fleet_kona` (Hyundai Kona EV showroom image)

### Modal Component (`#imageCropModalBackdrop`)
- Injected into `index.html` and `course.html`.
- Form inputs: Local file selector (`<input type="file" accept="image/*">`), URL text input (`<input type="url">`), and aspect ratio presets (`16:9`, `1:1`, `4:3`, `free`).
- Canvas Workspace: HTML5 `<canvas id="imageCropCanvas">` rendering center-cropped preview.
- Canvas Math: Crop calculation based on image aspect ratio vs target preset aspect ratio. Exports base64 JPEG via `canvas.toDataURL('image/jpeg', 0.88)`.
- Base64 payload stored in `l2d_custom_site_images` dictionary in `localStorage`.
- `hydrateSiteImagesFromStorage()` updates `img.src` or `style.backgroundImage` for all `[data-image-key]` elements.

### Hover Edit Trigger Button (`📷 Change Image`)
- Wrapped inside `.image-crop-target-wrapper`.
- When Edit Mode is active or on hover, displays floating button `.btn-image-crop-trigger` at top right of image wrapper.
- Clicking opens `#imageCropModalBackdrop` initialized with the target image key.

---

## 4. Interactive Drag-and-Drop Hotspot Positioning Engine

### Drag Handles & Cursor Styling
- When `l2d_admin_editing_mode` is `'true'`, hotspot pins (`.car-hotspot`) in `#fleet` showroom receive class `.draggable` (`cursor: grab; box-shadow: 0 0 0 3px #F57C00;`).
- While dragging, class `.dragging` applies (`cursor: grabbing; z-index: 100; background: #059669;`).

### Pointer & Touch Drag Calculation
- Listens to `mousedown`/`mousemove`/`mouseup` and `touchstart`/`touchmove`/`touchend`.
- Measures parent `.showroom-car-view` bounding rectangle: `rect = container.getBoundingClientRect()`.
- Calculates percentage position clamped between 0% and 100%:
  - `relX = clientX - rect.left`, `leftPercent = Math.max(0, Math.min(100, (relX / rect.width) * 100))`
  - `relY = clientY - rect.top`, `topPercent = Math.max(0, Math.min(100, (relY / rect.height) * 100))`
- Appends live tooltip readout `.hotspot-drag-tooltip` showing `(X: 45.2%, Y: 62.8%)` during drag.

### Persistence & Sync
- On drag release (`mouseup`/`touchend`):
  - Updates hotspot object in `getFleetData()`.
  - Saves JSON payload to both `l2d_fleet_hotspots` and `l2d_custom_hotspots` in `localStorage`.
  - Triggers toast notification: `Updated Hotspot #1 (YARIS) -> X: 45.2%, Y: 62.8% 🎯`.
  - Updates Admin Site Settings inputs (`#editYarisX1`, `#editYarisY1`, etc.) dynamically if rendered.

---

## 5. File Modifications Matrix

| File | Changes |
|---|---|
| `index.html` | Add `data-editable-key` to text elements, wrap image elements with `[data-image-key]` and `.image-crop-target-wrapper`, append `#imageCropModalBackdrop` template, ensure script order (`js/app.js`, `js/showroom.js`, `js/image-cropper.js`). |
| `course.html` | Add `data-editable-key` to Course Hero text elements, append `#imageCropModalBackdrop` modal template, attach Admin top bar script listeners. |
| `js/app.js` | Implement `initAdminTopBar()`, `setEditingMode()`, `hydrateSiteTextFromStorage()`, `setupEditableEventListeners()`, `handleAdminLogout()`, and multi-tab `storage` event sync. |
| `js/showroom.js` | Implement drag-and-drop hotspot event listeners (`attachHotspotDragEngine`), percentage clamping math, live tooltip readout, and `saveHotspotPosition()`. |
| `js/image-cropper.js` | Create standalone cropper module: `openImageCropModal()`, aspect ratio preset switching, canvas center-crop drawing, base64 export, `saveCroppedImage()`, and `hydrateSiteImagesFromStorage()`. |
| `styles/components.css` | Add CSS styles for `#floatingAdminBar`, `.toggle-edit-mode-btn`, `[contenteditable="true"]` dashed outline accents, `.image-crop-target-wrapper`, `.btn-image-crop-trigger`, and `#imageCropModalBackdrop`. |
| `styles/widgets.css` | Add CSS styles for `.car-hotspot.draggable`, `.car-hotspot.dragging`, and `.hotspot-drag-tooltip`. |

---

## 6. Verification & Pass Criteria
1. **Admin Top Bar**: Logging in as Admin renders `#floatingAdminBar` across both `index.html` and `course.html`.
2. **Inline Edit Mode**: Clicking "Enable Editing Mode" activates green dashed outlines on `[data-editable-key]` elements; editing text and blurring saves to `localStorage` and persists upon reload.
3. **Image Crop Modal**: Clicking `📷 Change Image` launches modal; uploading/selecting image and choosing aspect ratio (`16:9`, `1:1`, `4:3`) renders canvas crop preview and updates site image base64 URL.
4. **Drag & Drop Hotspots**: In Edit Mode, dragging hotspot pins on `#fleet` showroom updates pin position, displays live percentage tooltip `(X: %, Y: %)`, and persists coordinates in `localStorage` & Admin hub.
5. **Security & Quality**: Zero DevTools console errors; zero hardcoded shortcuts; full client-side persistence.
