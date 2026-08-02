# Handoff Report — Explorer 2: Admin Portal Site Content Editor & Hotspot Coordinate Editor (`X%` / `Y%`)

**Author**: Explorer 2 (Read-only Codebase Researcher)  
**Date**: 2026-07-31  
**Milestone**: Milestone 3 (Instructor Admin Portal & LMS Progress Fix)  
**Working Directory**: `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_m3_admin_lms_2\`

---

## 1. Observation

### A. PROJECT.md Interface Contracts & Requirements
- **`PROJECT.md`:6, 20-23**: Storage key for vehicle hotspot coordinates is specified as `l2d_custom_hotspots` / `l2d_fleet_hotspots`. The schema is an object mapping vehicle keys (`yaris`, `kona`) to an object with a `hotspots` array containing `x` (percentage number/string), `y` (percentage number/string), `title`, and `description`. It specifies deep-merging into `DEFAULT_FLEET_DATA` and live sync via `localStorage` storage events and `window.refreshShowroomDisplay()`.
- **`PROJECT.md`:16, 25-31**: Milestone 3 scope requires:
  1. Student Course Progress Tracking table.
  2. Account Management (setup, edit, remove student accounts).
  3. Site Content Editor ("update website text, headings, images").
  4. Hotspot Editor ("edit X% and Y% coordinates for training fleet vehicles and save to localStorage").

### B. Admin Portal & Editor Container in `course.html`
- **`course.html`:93, 96, 102**: When in Admin mode, three containers are unhidden:
  - `<div id="instructorAdminToolbar" class="admin-toolbar" style="display: none;"></div>` (`course.html`:93)
  - `<div id="adminContentEditorBox" style="display: none;"></div>` (`course.html`:96)
  - `<div id="adminProgressTableBox" style="display: none;"></div>` (`course.html`:102)
- **`course.html`:205-209**: The scripts included in `course.html` are strictly:
  - `<script src="js/app.js"></script>`
  - `<script src="js/course-data.js"></script>`
  - `<script src="js/course-player.js"></script>`  
  Notably, `js/showroom.js` is **not** included on `course.html`.

### C. Current Hotspot Editor Implementation in `js/course-player.js`
- **`js/course-player.js`:419-556 (`renderAdminContentEditor`)**:
  - The function reads `localStorage.getItem('l2d_custom_hotspots')` (or defaults to `DEFAULT_FLEET_DATA`-like coordinates) (`js/course-player.js`:431-447).
  - Despite the heading `<h2>Academy Content & Car Hotspot Editor</h2>` (`js/course-player.js`:456), the form only renders:
    1. A section for adjusting hotspot coordinates (`editYarisX1`/`Y1` through `X3`/`Y3` and `editKonaX1`/`Y1` through `X3`/`Y3`), using `<input type="number" ... min="0" max="100">` (`js/course-player.js`:481-540).
    2. A section for Instagram API Endpoint configuration (`editInstaEndpoint`) (`js/course-player.js`:547-553).
  - **No inputs exist for hotspot `title` or `desc` (`description`)**.
  - **No inputs or UI exist for editing website text, headings, or images (Site Content Editor is completely absent)**.
- **`js/course-player.js`:558-607 (`saveAdminContentEditorSettings`)**:
  - Reads X and Y coordinate integers from DOM inputs (`editYarisX1` through `editKonaY3`) (`js/course-player.js`:560-573).
  - Constructs `customFleet` with **hardcoded** text strings for `title` and `desc` for all 6 hotspots (`js/course-player.js`:575-590):
    - Example: `{ id: 1, title: 'Biting Point Clutch', desc: 'Smooth, lightweight clutch pedal...', x: yx1, y: yy1 }`.
  - Saves only to `localStorage.setItem('l2d_custom_hotspots', JSON.stringify(customFleet))` (`js/course-player.js`:592). It does not write to `'l2d_fleet_hotspots'`.
  - Calls `if (typeof window.refreshShowroomDisplay === 'function') { window.refreshShowroomDisplay(); }` (`js/course-player.js`:601-603). Because `showroom.js` is not loaded on `course.html`, `window.refreshShowroomDisplay` is `undefined`, and this call does nothing on `course.html`.

### D. Showroom Hotspot Consumer in `js/showroom.js`
- **`js/showroom.js`:55-81 (`getFleetData`)**:
  - Reads from either `l2d_custom_hotspots` or `l2d_fleet_hotspots`: `const customStr = localStorage.getItem('l2d_custom_hotspots') || localStorage.getItem('l2d_fleet_hotspots');` (`js/showroom.js`:56).
  - Merges into `DEFAULT_FLEET_DATA`. When `Array.isArray(customCar.hotspots)` is true, it replaces the vehicle's `hotspots` array entirely: `merged[key].hotspots = customCar.hotspots;` (`js/showroom.js`:67).
- **`js/showroom.js`:83-87**:
  - Listens for window storage events: `window.addEventListener('storage', (e) => { if (e.key === 'l2d_custom_hotspots' || e.key === 'l2d_fleet_hotspots' || !e.key) { renderVehicle(currentVehicleId); } });`.
- **`js/showroom.js`:89-91**:
  - Exposes `window.refreshShowroomDisplay = () => { renderVehicle(currentVehicleId); };`.
- **`js/showroom.js`:129-137, 166-170, 193-197**:
  - Renders hotspot badges using `left: ${hs.x}%; top: ${hs.y}%;` and displays `hs.title` and `hs.desc`.

---

## 2. Logic Chain

1. **Why the Site Content Editor is Missing**:  
   `PROJECT.md`:30 explicitly mandates a "Site Content Editor (update website text, headings, images)" in the Admin Portal. However, `renderAdminContentEditor()` in `js/course-player.js`:419-556 only provides fields for Yaris/Kona hotspot numeric coordinates and the Instagram API endpoint. Neither `course-player.js` nor any other JS file reads or writes a `localStorage` key for site content (such as `l2d_site_content`). Thus, the Site Content Editor is currently unimplemented.

2. **Why Hotspot Titles & Descriptions Cannot Be Edited & Why Custom Text is Overwritten**:  
   In `renderAdminContentEditor()`, the HTML form only generates `<input type="number">` fields for the X and Y percentages of each hotspot (`js/course-player.js`:481-540). When `saveAdminContentEditorSettings()` executes (`js/course-player.js`:575-590), it builds a new `customFleet` object using the DOM numeric values for X/Y, but **hardcodes** all `title` and `desc` strings. Because `js/showroom.js`:67 replaces the entire `hotspots` array with whatever is stored in `l2d_custom_hotspots`, any attempt to customize or preserve hotspot titles and descriptions is impossible with the current code.

3. **Why `refreshShowroomDisplay()` Fails on `course.html`**:  
   When an admin clicks "Save All Editor Changes 💾" on `course.html`, `js/course-player.js`:601 attempts to call `window.refreshShowroomDisplay()`. Because `course.html`:205-209 does not import `js/showroom.js` and does not contain `#showroomDisplayBox`, `refreshShowroomDisplay` is undefined. While saving to `localStorage` triggers a cross-tab `'storage'` event for any open `index.html` tab, the admin editing from `course.html` receives no inline visual feedback or immediate preview of where their new X% / Y% coordinates land on the car image.

4. **Why Numeric-Only Editing is Unintuitive**:  
   Admins currently must guess percentage integers (0–100 for X and Y) for six different hotspots without a visual reference. Adding a click-to-place interactive preview or visual indicator would transform the Hotspot Editor from an error-prone form into an intuitive visual tool.

---

## 3. Caveats

- **No Caveats on Code Analysis**: All observations are directly verified from full file reads of `PROJECT.md`, `course.html`, `js/course-player.js`, `js/showroom.js`, and `index.html`.
- **Scope Boundary**: As a read-only Explorer, no source files were modified. All proposals below are detailed architectural and code-level recommendations for Implementer agents.

---

## 4. Conclusion & Recommended Enhancements

To fulfill Milestone 3 ("Instructor Admin Portal & LMS Progress Fix") and ensure intuitive, robust editing with clean real-time showroom sync, we recommend the following **4 exact enhancements**:

### Enhancement 1: Add a Full "Site Content Editor" to `js/course-player.js` & `js/app.js`

1. **Storage Schema (`l2d_site_content`)**:  
   Define a JSON schema in `localStorage` under key `l2d_site_content`:
   ```javascript
   {
     heroBadge: "🚗 Preston DVSA-Approved Driving Academy",
     heroHeading: "Welcome to Learner2Driver Preston",
     heroText: "Professional Manual & Automatic tuition with Preston's top-rated instructors...",
     contactPhone: "074-2733-0827",
     contactLocation: "Preston, Lancashire & Surrounding Areas (PR1-PR5)"
   }
   ```
2. **UI in `renderAdminContentEditor()` (`js/course-player.js`)**:  
   Add a new section above the Hotspot Editor titled **"📝 Site Content Editor (Text, Headings & Info)"** with text inputs / textareas for `editHeroBadge`, `editHeroHeading`, `editHeroText`, `editContactPhone`, and `editContactLocation`.
3. **Save Handler in `saveAdminContentEditorSettings()` (`js/course-player.js`)**:  
   Read values from these inputs and save via:
   ```javascript
   const siteContent = {
     heroBadge: document.getElementById('editHeroBadge')?.value.trim() || '',
     heroHeading: document.getElementById('editHeroHeading')?.value.trim() || '',
     heroText: document.getElementById('editHeroText')?.value.trim() || '',
     contactPhone: document.getElementById('editContactPhone')?.value.trim() || '',
     contactLocation: document.getElementById('editContactLocation')?.value.trim() || ''
   };
   localStorage.setItem('l2d_site_content', JSON.stringify(siteContent));
   ```
4. **Global Consumer (`js/app.js`)**:  
   Add `window.applyCustomSiteContent()` in `js/app.js` that runs on `DOMContentLoaded` and on `'storage'` events:
   ```javascript
   window.applyCustomSiteContent = function() {
     const saved = localStorage.getItem('l2d_site_content');
     if (!saved) return;
     try {
       const content = JSON.parse(saved);
       const heroBadgeEl = document.querySelector('#hero .badge');
       const heroHeadingEl = document.querySelector('#hero h1');
       const heroTextEl = document.querySelector('#hero p');
       if (heroBadgeEl && content.heroBadge) heroBadgeEl.textContent = content.heroBadge;
       if (heroHeadingEl && content.heroHeading) heroHeadingEl.innerHTML = content.heroHeading;
       if (heroTextEl && content.heroText) heroTextEl.textContent = content.heroText;
     } catch(e) {}
   };
   ```

---

### Enhancement 2: Support Editing `title` and `desc` in the Hotspot Editor (`js/course-player.js`)

1. **Add Form Controls in `renderAdminContentEditor()`**:  
   For each hotspot (Yaris #1-#3, Kona #1-#3), include `<input type="text">` for `title` and `<textarea>` for `desc` alongside the numeric `X%` and `Y%` inputs:
   ```html
   <div style="margin-bottom:0.75rem;">
     <label style="font-size:0.82rem; font-weight:700;">Point #1 Title & Description</label>
     <input type="text" id="editYarisTitle1" class="portal-input mb-1" value="${fleet.yaris.hotspots[0].title || ''}" placeholder="Hotspot Title">
     <input type="text" id="editYarisDesc1" class="portal-input mb-1" value="${fleet.yaris.hotspots[0].desc || ''}" placeholder="Hotspot Description">
     <div style="display:flex; gap:0.5rem; margin-top:0.25rem;">
       <input type="number" id="editYarisX1" class="portal-input" style="margin:0;" value="${fleet.yaris.hotspots[0].x}" min="0" max="100">
       <span style="align-self:center;">% X</span>
       <input type="number" id="editYarisY1" class="portal-input" style="margin:0;" value="${fleet.yaris.hotspots[0].y}" min="0" max="100">
       <span style="align-self:center;">% Y</span>
     </div>
   </div>
   ```
2. **Read Dynamic Values in `saveAdminContentEditorSettings()`**:  
   Instead of hardcoding `'Biting Point Clutch'`, read `document.getElementById('editYarisTitle1')?.value.trim()` and `document.getElementById('editYarisDesc1')?.value.trim()`, falling back to default strings only if blank.
3. **Write to Both Storage Keys**:  
   To ensure complete compatibility with `PROJECT.md`:21 and `js/showroom.js`:56, save the JSON string to both `'l2d_custom_hotspots'` and `'l2d_fleet_hotspots'`:
   ```javascript
   const customStr = JSON.stringify(customFleet);
   localStorage.setItem('l2d_custom_hotspots', customStr);
   localStorage.setItem('l2d_fleet_hotspots', customStr);
   ```

---

### Enhancement 3: Add an Inline Showroom Live Preview Modal/Canvas in Admin Mode

1. **Add Preview Modal / Mini-Showroom in `renderAdminContentEditor()`**:  
   Add a button **"👁️ Test / Preview Hotspots on Car Canvas"** inside `renderAdminContentEditor()`.
2. **Inline Interactive Canvas**:  
   When clicked, display an inline preview container showing the vehicle image (`yaris` or `kona`) with the circular pins rendered at the current input values (`editYarisX1.value` / `editYarisY1.value`).
3. **Click-to-Place (Visual Picker)**:  
   Add an event listener to the preview image so that when an admin clicks on a location on the image:
   - Calculate percentage coordinates:  
     ```javascript
     const rect = img.getBoundingClientRect();
     const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
     const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
     ```
   - Automatically populate the selected point's `X%` and `Y%` input fields with `xPct` and `yPct` and move the pin marker instantly.

---

### Enhancement 4: Cross-Tab & Same-Tab Synchronization Robustness

1. **Broadcast Storage Updates**:  
   When saving settings in `js/course-player.js`:558, trigger a custom `window.dispatchEvent(new Event('l2d_fleet_updated'))` so any components listening in the same window update immediately.
2. **Safe `refreshShowroomDisplay` Invocation**:  
   Keep `if (typeof window.refreshShowroomDisplay === 'function') { window.refreshShowroomDisplay(); }` so that if an Admin modal is ever opened from `index.html` in the future, `#showroomDisplayBox` updates live without reloading.
3. **Informative Toast / Feedback**:  
   Update the save confirmation toast to explicitly inform the instructor: `"Saved! Showroom display on index.html#fleet and site content updated in real-time across open tabs."`

---

## 5. Verification Method

To independently verify the current observations and test any future implementation of these recommendations:

1. **Verify File Contents & Line Numbers**:
   - Inspect `PROJECT.md` lines 20-32 to confirm the Admin Portal and Hotspot contracts.
   - Inspect `js/course-player.js` lines 419-607 (`renderAdminContentEditor` & `saveAdminContentEditorSettings`) to verify that only X/Y coordinates and Instagram endpoint are currently present, and that `title` and `desc` are hardcoded.
   - Inspect `course.html` lines 205-209 to confirm `js/showroom.js` is not imported.

2. **Functional Verification (Post-Implementation)**:
   - **Step 1**: Open `course.html` in a browser and click **"Login as Admin"** (User: `admin`, Pass: `Huzaifa1`).
   - **Step 2**: Verify that the new **Site Content Editor** inputs appear in `#adminContentEditorBox`. Edit text/headings, click "Save All Editor Changes", and inspect `localStorage.getItem('l2d_site_content')` in browser DevTools to confirm persistence.
   - **Step 3**: Verify that the **Hotspot Editor** displays `Title`, `Description`, `X%`, and `Y%` fields for all 6 vehicle hotspots.
   - **Step 4**: Change a hotspot's X% and Y% coordinates and Title/Description, and click "Save All Editor Changes".
   - **Step 5**: Check DevTools Console / Application tab to verify `localStorage.getItem('l2d_custom_hotspots')` and `localStorage.getItem('l2d_fleet_hotspots')` contain the updated `title`, `desc`, `x`, and `y` values.
   - **Step 6**: Open `index.html#fleet` in a second tab (or observe cross-tab sync) to confirm the Yaris and Kona EV vehicle showroom renders the circular pins at the new percentage coordinates with the updated Title and Description in the tip box.
