# Handoff Report: Leaflet Map Location Picker for Preston Danger Spots

**Agent**: M4 Explorer 1 (Map Location Picker Specialist)  
**Working Directory**: `.agents/explorer_m4_1`  
**Target Architecture**: Leaflet Map Location Picker Modal (`#mapPickerModalBackdrop`) for Preston Danger Spots  
**Storage Key**: `l2d_custom_routes` in `localStorage`  

---

## 1. Observation

1. **Existing Danger Spot Data Structure (`js/widgets.js:8-37`)**:
   `PRESTON_ROUTE_TIPS` is currently a hardcoded static `const` object mapping spot IDs (`1`, `2`, `3`, `4`) to `title`, `location`, `tip`, `lat`, and `lng`:
   - Spot 1: DVSA Test Centre (`lat: 53.7632`, `lng: -2.7481`)
   - Spot 2: Docks Swing Bridge (`lat: 53.7589`, `lng: -2.7295`)
   - Spot 3: Riversway Multi-Lane Junctions (`lat: 53.7610`, `lng: -2.7350`)
   - Spot 4: Penwortham Hill Start (`lat: 53.7525`, `lng: -2.7140`)

2. **Admin Mode State (`js/app.js:8`, `js/app.js:323-365`)**:
   Global admin mode state is tracked via `window.L2D_EDIT_MODE` (boolean) and class `admin-edit-mode` on `document.body`. Admin mode is enabled/disabled via `setEditingMode(enabled)` in `js/app.js`.

3. **Leaflet Map Container (`index.html:308-314`, `js/widgets.js:104-156`)**:
   The main Preston map `#prestonLeafletMap` is initialized in `initPrestonLeafletMap()`. Marker objects are stored in `leafletMarkers[spotId]`. Clicking a marker invokes `showRouteTip(spotId)`.

4. **Existing Modal Architecture (`index.html:482-495`)**:
   Modals on `index.html` follow the `.modal-backdrop` overlay pattern (e.g., `#instaStoryModalBackdrop`), using flex centering and dark backdrop transitions.

---

## 2. Logic Chain

1. **Storage Accessor Layer**:
   - To make danger spot coordinates dynamic and customizable by instructors without losing default locations, replace direct references to `PRESTON_ROUTE_TIPS` with accessor functions: `getPrestonRouteTips()` and `savePrestonRouteTips(tipsData)`.
   - `getPrestonRouteTips()` checks `localStorage.getItem('l2d_custom_routes')`. If found, it parses JSON and merges over `DEFAULT_PRESTON_ROUTE_TIPS`.
   - `savePrestonRouteTips()` serializes the updated dictionary to `localStorage.setItem('l2d_custom_routes', JSON.stringify(tipsData))`.

2. **Admin UI Button Injection**:
   - Inside `showRouteTip(spotId)` in `js/widgets.js`, check `window.L2D_EDIT_MODE || document.body.classList.contains('admin-edit-mode')`.
   - When Admin Mode is active, render an admin editor bar containing:
     a) Live coordinate display: `📍 Coords: <span id="routeSpotLat">${tipData.lat.toFixed(6)}</span>, <span id="routeSpotLng">${tipData.lng.toFixed(6)}</span>`
     b) Button: `<button class="btn btn-secondary btn-sm admin-pick-location-btn" onclick="openMapPickerModal(${spotId})">📍 Pick Location on Map</button>`

3. **Map Location Picker Modal Structure & Lifecycle**:
   - Place `#mapPickerModalBackdrop` in `index.html` before `</body>`.
   - Structural elements inside modal:
     - Header with title `Set Pin Location: Spot #${spotId}` and close button.
     - Live coordinate display bar (`#mapPickerLatDisplay`, `#mapPickerLngDisplay`).
     - Map canvas container `#modalPickerLeafletMap` (height: 340px–400px).
     - Instruction note and action buttons: Cancel and "Save Location Coordinates 💾" (`confirmMapPickerSave()`).
   - When `openMapPickerModal(spotId)` is called:
     - Record `activePickerSpotId = spotId`.
     - Read spot coordinates `lat` and `lng`.
     - Show modal (`modal.classList.add('active')`).
     - After 150ms delay (allowing modal DOM visibility transition), call `initOrUpdateModalPickerMap(lat, lng)` which initializes or setView on `modalPickerMap` and calls `modalPickerMap.invalidateSize()`.
     - Drop/update a draggable pin marker (`modalPickerMarker`) at target coordinates.
     - Map click handler updates marker position and updates coordinate display in real time (`updateMapPickerCoordsDisplay(lat, lng)`).
     - Marker `drag` and `dragend` events continuously update coordinate readout.

4. **Real-Time Synchronization**:
   - When `confirmMapPickerSave()` is clicked:
     - Update `tips[activePickerSpotId]` with rounded coordinates (`Number(lat.toFixed(6))`).
     - Invoke `savePrestonRouteTips(tips)`.
     - Call `syncMainMapAndCard(spotId)`:
       1) Updates `leafletMarkers[spotId].setLatLng([lat, lng])`.
       2) Calls `showRouteTip(spotId, false)` to refresh card text, lat/lng badges, and fly main map camera (`flyTo`) to the new coordinates.
     - Close modal and trigger `showToast("Updated Location for Danger Spot #...! 📍")`.
   - Add `l2d_custom_routes` key handling to `window.addEventListener('storage', ...)` in `js/app.js` for multi-tab synchronization.

---

## 3. Caveats

- **Leaflet Modal Sizing**: Leaflet maps rendered inside containers that were previously `display: none` can render with tile alignment issues unless `map.invalidateSize()` is explicitly called after the modal is displayed. The 150ms `setTimeout` deferral handles this timing requirement.
- **CDN Availability**: If the Leaflet CDN is offline or blocked, `typeof L === 'undefined'` safeguards must gracefully fall back without throwing unhandled exceptions.
- **Coordinate Precision**: Coordinates must be formatted with `.toFixed(6)` to avoid floating-point representation artifacts in JSON storage (e.g. `53.763200000000004`).

---

## 4. Conclusion

The map location picker modal for Preston Danger Spots can be cleanly integrated into Learner2Driver with **zero breaking changes** to the existing architecture. 

### Summary of Required File Modifications:

1. **`index.html`**:
   - Add `#mapPickerModalBackdrop` HTML container before line 497 (`</body>`).

2. **`js/widgets.js`**:
   - Rename static `PRESTON_ROUTE_TIPS` to `DEFAULT_PRESTON_ROUTE_TIPS`.
   - Implement `getPrestonRouteTips()` and `savePrestonRouteTips()`.
   - Update `initPrestonLeafletMap()` to read coordinates from `getPrestonRouteTips()`.
   - Update `showRouteTip()` to render the Admin Editor Bar with "📍 Pick Location on Map" button when Admin Mode is enabled.
   - Add modal handler functions: `openMapPickerModal()`, `closeMapPickerModal()`, `initOrUpdateModalPickerMap()`, `updatePickerMarkerPosition()`, `updateMapPickerCoordsDisplay()`, `confirmMapPickerSave()`, and `syncMainMapAndCard()`.

3. **`js/app.js`**:
   - In `setEditingMode(enabled)`, call `showRouteTip()` for the currently selected spot to immediately toggle the "📍 Pick Location on Map" button.
   - Add `l2d_custom_routes` to the `storage` event listener.

4. **`styles/widgets.css`**:
   - Add styling rules for `.map-picker-modal-window`, `#modalPickerLeafletMap`, `.map-picker-coords-bar`, `.coords-pill`, `.map-picker-instructions`, and `.map-picker-actions`.

5. **`styles/components.css`**:
   - Add `.admin-pick-location-btn` button styles.

---

## 5. Verification Method

1. **Analysis Verification**:
   - Inspect `.agents/explorer_m4_1/analysis.md` for complete code snippets, HTML structural definitions, and JS controller logic.

2. **Manual UI Verification Steps (for Implementer/Worker Agent)**:
   - Load `index.html` in browser. Verify baseline 4 Preston Danger Spots load on Leaflet map.
   - Log into Admin Mode or run `setEditingMode(true)` in browser console. Verify "📍 Pick Location on Map" button and coordinate readouts appear on the active danger spot card.
   - Click "📍 Pick Location on Map". Verify modal `#mapPickerModalBackdrop` opens, Leaflet map renders correctly, and pin is placed at current spot coordinates.
   - Click a new location on the picker map or drag the pin. Verify live lat/lng readout updates.
   - Click "Save Location Coordinates 💾". Verify:
     a) Modal closes and toast notification appears.
     b) Main map marker immediately moves to the new geolocation.
     c) Main map smoothly pans/flies to new coordinates.
     d) Danger spot card lat/lng readout updates.
     e) `localStorage.getItem('l2d_custom_routes')` contains updated coordinates.
   - Refresh browser page. Verify updated custom location persists from `localStorage`.
