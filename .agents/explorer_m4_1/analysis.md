# Technical Analysis Report: Leaflet Map Location Picker for Preston Danger Spots

**Module**: M4 Map Location Picker Specialist  
**Target Files**: `index.html`, `js/widgets.js`, `js/app.js`, `styles/components.css`, `styles/widgets.css`  
**Storage Key**: `l2d_custom_routes`  

---

## 1. Executive Summary & Scope

The Learner2Driver Preston Academy web application provides an interactive OpenStreetMap view via Leaflet.js (`#prestonLeafletMap` on `index.html`), allowing learners to inspect four predefined DVSA Preston test route danger spots (DVSA Test Centre, Docks Swing Bridge, Riversway Multi-Lane Junctions, Penwortham Hill Start).

Currently, coordinates (`lat`, `lng`), titles, and instructor tips are hardcoded in `PRESTON_ROUTE_TIPS` inside `js/widgets.js`. This investigation establishes the exact architectural pattern, UI placement, modal implementation, real-time synchronization, and file changes required to enable **Admin Mode Map Location Picking** via a Leaflet picker modal (`#mapPickerModalBackdrop`), persisting custom coordinates to `localStorage` key `l2d_custom_routes`.

---

## 2. Existing Route Data & Storage Architecture

### 2.1 Current Implementation (`js/widgets.js`)
Currently, `PRESTON_ROUTE_TIPS` is declared as a static top-level `const` object in `js/widgets.js` (lines 8–37):

```javascript
const PRESTON_ROUTE_TIPS = {
  1: {
    title: '1. DVSA Test Centre (Chain Caul Way, PR2 2ZN)',
    location: 'Preston DVSA Hub Roundabout',
    tip: 'When exiting the DVSA test centre onto Chain Caul Way, watch out for the two-lane approach...',
    lat: 53.7632,
    lng: -2.7481
  },
  2: {
    title: '2. Docks Swing Bridge & Port Way',
    location: 'Preston Riversway Docks',
    tip: '...',
    lat: 53.7589,
    lng: -2.7295
  },
  3: {
    title: '3. Riversway Multi-Lane Junctions (A583)',
    location: 'Watery Lane / Riversway Corridor',
    tip: '...',
    lat: 53.7610,
    lng: -2.7350
  },
  4: {
    title: '4. Penwortham Hill Start & Guild Way',
    location: 'A59 / Penwortham Bridge',
    tip: '...',
    lat: 53.7525,
    lng: -2.7140
  }
};
```

### 2.2 Dynamic Persistence Model (`l2d_custom_routes`)
To support customizable coordinates while retaining baseline defaults, a dynamic data accessor pattern must replace direct `PRESTON_ROUTE_TIPS` references:

1. **Storage Key**: `l2d_custom_routes` in `window.localStorage`.
2. **Data Structure**:
   ```json
   {
     "1": { "title": "1. DVSA Test Centre...", "location": "...", "tip": "...", "lat": 53.7632, "lng": -2.7481 },
     "2": { "title": "2. Docks Swing Bridge...", "location": "...", "tip": "...", "lat": 53.7589, "lng": -2.7295 },
     "3": { "title": "3. Riversway Multi-Lane...", "location": "...", "tip": "...", "lat": 53.7610, "lng": -2.7350 },
     "4": { "title": "4. Penwortham Hill Start...", "location": "...", "tip": "...", "lat": 53.7525, "lng": -2.7140 }
   }
   ```
3. **Getter & Setter Functions**:
   ```javascript
   function getPrestonRouteTips() {
     try {
       const saved = localStorage.getItem('l2d_custom_routes');
       if (saved) {
         const parsed = JSON.parse(saved);
         return Object.assign({}, DEFAULT_PRESTON_ROUTE_TIPS, parsed);
       }
     } catch (e) {
       console.error('Error reading l2d_custom_routes:', e);
     }
     return Object.assign({}, DEFAULT_PRESTON_ROUTE_TIPS);
   }

   function savePrestonRouteTips(tipsData) {
     try {
       localStorage.setItem('l2d_custom_routes', JSON.stringify(tipsData));
     } catch (e) {
       console.error('Error saving l2d_custom_routes:', e);
     }
   }
   ```

---

## 3. Admin Mode UI & "📍 Pick Location on Map" Button Placement

### 3.1 Admin Edit Mode State Detection
In `js/app.js` (lines 323–365), admin mode state is tracked globally via `window.L2D_EDIT_MODE` (boolean) and CSS class `admin-edit-mode` on `document.body`.

### 3.2 UI Placement Strategy on `index.html`
When Admin Edit Mode is active (`window.L2D_EDIT_MODE === true`), the danger spot card displayed in `#routeTipBox` (rendered by `showRouteTip(spotId)` in `js/widgets.js`) must dynamically include:

1. **Latitude/Longitude Coordinates Readout Badge**: Displaying active coordinates (e.g. `📍 Lat: 53.763200 | Lng: -2.748100`).
2. **"📍 Pick Location on Map" Action Button**: Positioned in the card footer next to "Book Route Practice".

#### Proposed HTML Injection inside `showRouteTip(spotId)` (`js/widgets.js`):
```javascript
const isAdminEdit = window.L2D_EDIT_MODE || document.body.classList.contains('admin-edit-mode');

const adminControlsHtml = isAdminEdit ? `
  <div class="admin-spot-editor-bar" style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
    <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-green);">
      📍 Coords: <span id="routeSpotLat">${tipData.lat.toFixed(6)}</span>, <span id="routeSpotLng">${tipData.lng.toFixed(6)}</span>
    </div>
    <button class="btn btn-secondary btn-sm admin-pick-location-btn" onclick="openMapPickerModal(${spotId})">
      📍 Pick Location on Map
    </button>
  </div>
` : '';
```

---

## 4. Leaflet Map Location Picker Modal (`#mapPickerModalBackdrop`)

### 4.1 Modal DOM Structure (`index.html`)
The modal should be placed before `</body>` on `index.html`, matching existing modal patterns (e.g., `#instaStoryModalBackdrop`):

```html
<!-- LEAFLET MAP LOCATION PICKER MODAL (ADMIN MODE) -->
<div id="mapPickerModalBackdrop" class="modal-backdrop">
  <div class="modal-window map-picker-modal-window">
    <div class="map-picker-header">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="badge badge-primary">Admin Location Picker</span>
        <h3 id="mapPickerSpotTitle" style="margin: 0; font-size: 1.15rem;">Set Coordinates for Spot</h3>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="closeMapPickerModal()" style="min-width: 36px; min-height: 36px; padding: 0;">✕</button>
    </div>

    <!-- Live Coordinate Readout Bar -->
    <div class="map-picker-coords-bar">
      <span>Active Pin Geolocation:</span>
      <div class="coords-pill">
        <span>Lat: <strong id="mapPickerLatDisplay">53.763200</strong></span>
        <span style="opacity: 0.5;">|</span>
        <span>Lng: <strong id="mapPickerLngDisplay">-2.748100</strong></span>
      </div>
    </div>

    <!-- Modal Leaflet Canvas -->
    <div id="modalPickerLeafletMap" class="modal-leaflet-canvas"></div>

    <p class="map-picker-instructions">
      💡 Click anywhere on the map or drag the circular pin to update coordinates in real-time.
    </p>

    <div class="map-picker-actions">
      <button class="btn btn-secondary" onclick="closeMapPickerModal()">Cancel</button>
      <button id="mapPickerSaveBtn" class="btn btn-primary" onclick="confirmMapPickerSave()">Save Location Coordinates 💾</button>
    </div>
  </div>
</div>
```

### 4.2 Modal Leaflet Map Controller (`js/widgets.js`)

```javascript
let modalPickerMap = null;
let modalPickerMarker = null;
let activePickerSpotId = null;
let currentTempCoords = { lat: 53.7632, lng: -2.7481 };

window.openMapPickerModal = function(spotId) {
  activePickerSpotId = spotId;
  const tips = getPrestonRouteTips();
  const spotData = tips[spotId];
  if (!spotData) return;

  currentTempCoords = { lat: spotData.lat, lng: spotData.lng };

  const modal = document.getElementById('mapPickerModalBackdrop');
  const titleEl = document.getElementById('mapPickerSpotTitle');
  if (titleEl) titleEl.textContent = `Set Pin Location: Spot #${spotId}`;
  
  updateMapPickerCoordsDisplay(currentTempCoords.lat, currentTempCoords.lng);

  if (modal) modal.classList.add('active');

  // Initialize or update Leaflet map after modal animation completes
  setTimeout(() => {
    initOrUpdateModalPickerMap(currentTempCoords.lat, currentTempCoords.lng);
  }, 150);
};

window.closeMapPickerModal = function() {
  const modal = document.getElementById('mapPickerModalBackdrop');
  if (modal) modal.classList.remove('active');
  activePickerSpotId = null;
};

function initOrUpdateModalPickerMap(lat, lng) {
  const mapEl = document.getElementById('modalPickerLeafletMap');
  if (!mapEl || typeof L === 'undefined') return;

  if (!modalPickerMap) {
    modalPickerMap = L.map('modalPickerLeafletMap', {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(modalPickerMap);

    modalPickerMap.on('click', (e) => {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;
      updatePickerMarkerPosition(newLat, newLng);
    });
  } else {
    modalPickerMap.setView([lat, lng], 16);
    modalPickerMap.invalidateSize();
  }

  const pinIcon = L.divIcon({
    className: 'custom-leaflet-icon-wrapper',
    html: `<div class="leaflet-custom-circle-pin active">📍</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  if (!modalPickerMarker) {
    modalPickerMarker = L.marker([lat, lng], {
      icon: pinIcon,
      draggable: true
    }).addTo(modalPickerMap);

    modalPickerMarker.on('drag', (e) => {
      const pos = e.target.getLatLng();
      updateMapPickerCoordsDisplay(pos.lat, pos.lng);
    });

    modalPickerMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      currentTempCoords = { lat: pos.lat, lng: pos.lng };
      updateMapPickerCoordsDisplay(pos.lat, pos.lng);
    });
  } else {
    modalPickerMarker.setLatLng([lat, lng]);
  }
}

function updatePickerMarkerPosition(lat, lng) {
  currentTempCoords = { lat, lng };
  if (modalPickerMarker) {
    modalPickerMarker.setLatLng([lat, lng]);
  }
  updateMapPickerCoordsDisplay(lat, lng);
}

function updateMapPickerCoordsDisplay(lat, lng) {
  const latEl = document.getElementById('mapPickerLatDisplay');
  const lngEl = document.getElementById('mapPickerLngDisplay');
  if (latEl) latEl.textContent = Number(lat).toFixed(6);
  if (lngEl) lngEl.textContent = Number(lng).toFixed(6);
}

window.confirmMapPickerSave = function() {
  if (!activePickerSpotId) return;

  const tips = getPrestonRouteTips();
  if (tips[activePickerSpotId]) {
    tips[activePickerSpotId].lat = Number(currentTempCoords.lat.toFixed(6));
    tips[activePickerSpotId].lng = Number(currentTempCoords.lng.toFixed(6));
    savePrestonRouteTips(tips);

    // Live update map and card display
    syncMainMapAndCard(activePickerSpotId);
    closeMapPickerModal();

    if (typeof window.showToast === 'function') {
      window.showToast(`Updated Location for Danger Spot #${activePickerSpotId}! 📍`);
    }
  }
};
```

---

## 5. Live Marker & UI Synchronization

When `confirmMapPickerSave()` commits updated coordinates to `localStorage`:

1. **Main Preston Map Marker Update**:
   ```javascript
   function syncMainMapAndCard(spotId) {
     const tips = getPrestonRouteTips();
     const updatedData = tips[spotId];
     if (!updatedData) return;

     // 1. Update stored marker in memory
     if (leafletMarkers[spotId]) {
       leafletMarkers[spotId].setLatLng([updatedData.lat, updatedData.lng]);
     }

     // 2. Re-render tip card readout
     showRouteTip(spotId, false);
   }
   ```
2. **Re-centering Main Map (`flyTo`)**:
   Calling `showRouteTip(spotId, false)` invokes `prestonLeafletMap.flyTo([updatedData.lat, updatedData.lng], 16)` smoothly navigating the camera to the new coordinates.
3. **Cross-Tab LocalStorage Event Handler**:
   In `js/app.js`, add `l2d_custom_routes` to the `storage` event listener so changes in one tab immediately update active markers across all open tabs:
   ```javascript
   window.addEventListener('storage', (e) => {
     if (e.key === 'l2d_custom_routes') {
       if (typeof window.refreshPrestonMapMarkers === 'function') {
         window.refreshPrestonMapMarkers();
       }
     }
   });
   ```

---

## 6. Concrete File Changes Plan

| File Path | Direct Changes Required |
| --- | --- |
| `index.html` | Insert `#mapPickerModalBackdrop` container before closing `</body>` tag (around line 496). |
| `js/widgets.js` | 1. Replace static `PRESTON_ROUTE_TIPS` with `DEFAULT_PRESTON_ROUTE_TIPS` and dynamic `getPrestonRouteTips()` / `savePrestonRouteTips()`.<br>2. Update `initPrestonLeafletMap()` to read dynamic coordinates.<br>3. Add Admin mode check & "📍 Pick Location on Map" button inside `showRouteTip()`.<br>4. Add `openMapPickerModal()`, `closeMapPickerModal()`, `initOrUpdateModalPickerMap()`, `confirmMapPickerSave()`, `syncMainMapAndCard()`, `refreshPrestonMapMarkers()`. |
| `js/app.js` | 1. Update `setEditingMode(enabled)` to re-trigger `showRouteTip()` or refresh map widgets so the pick button toggles dynamically when Edit Mode changes.<br>2. Include `l2d_custom_routes` in the global `storage` event listener. |
| `styles/widgets.css` | Add `.map-picker-modal-window`, `#modalPickerLeafletMap`, `.map-picker-coords-bar`, `.coords-pill`, `.map-picker-instructions`, `.map-picker-actions`. |
| `styles/components.css` | Add `.admin-pick-location-btn` styling matching system emerald green & slate components. |

---

## 7. Verification & Safety Safeguards

1. **Leaflet Container Re-render Protection (`invalidateSize()`)**:
   Leaflet maps rendered inside CSS hidden modals (`display: none` / `opacity: 0`) require `map.invalidateSize()` after becoming visible. Using `setTimeout(..., 150)` prevents tile rendering glitches.
2. **Precision Formatting**:
   Coordinates are sanitized with `Number(val).toFixed(6)` to avoid floating-point overflow strings in `localStorage`.
3. **Graceful Fallback**:
   If Leaflet CDN is unavailable or `localStorage` fails, `getPrestonRouteTips()` falls back to hardcoded defaults without throwing errors.
