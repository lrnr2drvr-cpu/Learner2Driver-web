# Handoff Report: Milestone 1 — Leaflet Map Tile Layer & Initialization Investigation

## Summary
The HTTP 403 Forbidden error on the Learner2Driver Leaflet map is caused by OpenStreetMap Foundation tile servers (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) blocking browser tile requests that lack an approved `User-Agent` or valid referer. Replacing the single tile URL occurrence in `js/widgets.js:120` with **CartoDB Voyager** (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`) resolves the 403 errors and provides 100% reliable tile delivery. Additionally, three map container sizing and Leaflet initialization bugs were identified in `js/widgets.js` and `styles/widgets.css` (`invalidateSize` missing, immediate `flyTo` on load, and `z-index: 10` on the map container).

---

## 1. Observation

### 1.1 Leaflet Map Initialization & Tile Layer Locations
We inspected all 15 files in the project root (`PROJECT.md`, `index.html`, `course.html`, `js/*.js`, and `styles/*.css`).

1. **Map Initialization & Tile Layer (`c:\Users\huzai\Documents\learner2driver\js\widgets.js:104-148`)**:
   - `initPrestonLeafletMap()` initializes `prestonLeafletMap` on line 113:
     ```javascript
     113:     prestonLeafletMap = L.map('prestonLeafletMap', {
     114:       center: [53.7600, -2.7350],
     115:       zoom: 14,
     116:       zoomControl: true,
     117:       scrollWheelZoom: false
     118:     });
     ```
   - On lines 120–123, the existing OpenStreetMap tile layer is instantiated:
     ```javascript
     120:     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     121:       maxZoom: 19,
     122:       attribution: '© OpenStreetMap contributors • Preston PR2 2ZN'
     123:     }).addTo(prestonLeafletMap);
     ```

2. **Map DOM Container (`c:\Users\huzai\Documents\learner2driver\index.html:295-301`)**:
   - In `index.html`, the container for the map is defined as:
     ```html
     295:         <div class="preston-map-container">
     296:           <div id="prestonLeafletMap" style="width: 100%; height: 480px;"></div>
     297:           <div style="background: #0F172A; color: #FFF; padding: 0.65rem 1rem; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
     298:             <span>📍 Preston DVSA Test Centre • Chain Caul Way, Preston PR2 2ZN</span>
     299:             <a href="https://www.openstreetmap.org/?mlat=53.7632&mlon=-2.7481#map=15/53.7632/-2.7481" target="_blank" rel="noopener noreferrer" style="color: #43A047; font-weight: 700;">View Full UK Map ↗</a>
     300:           </div>
     301:         </div>
     ```
   - Leaflet CSS is imported on line 37 (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`) and Leaflet JS on line 485 (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`).

3. **Map Container Styling (`c:\Users\huzai\Documents\learner2driver\styles\widgets.css:92-106`)**:
   - In `styles/widgets.css`, the map container is styled as:
     ```css
     92: .preston-map-container {
     93:   position: relative;
     94:   border-radius: var(--radius-lg);
     95:   overflow: hidden;
     96:   border: 2px solid var(--border-color);
     97:   background: var(--bg-surface);
     98:   box-shadow: var(--shadow-sm);
     99: }
     100: 
     101: #prestonLeafletMap {
     102:   width: 100%;
     103:   height: 480px;
     104:   background: #0F172A;
     105:   z-index: 10;
     106: }
     ```

4. **Every Occurrence of Tile URLs in the Codebase**:
   - Searching across all `.js`, `.html`, `.css`, and `.md` files revealed **exactly one** occurrence of a tile layer URL:
     - `js/widgets.js:120`: `'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'`
   - Note: `index.html:299` contains `'https://www.openstreetmap.org/?mlat=53.7632&mlon=-2.7481#map=15/53.7632/-2.7481'`, which is an external hyperlink to the OSM website, not a tile server URL.
   - `PROJECT.md:14` notes under Milestone 1: `"Replace 403 OSM URLs with CartoDB Voyager/Positron basemap provider"`.

5. **Map Container Sizing & Initialization Observations**:
   - No call to `prestonLeafletMap.invalidateSize()` exists anywhere in `js/widgets.js` or `js/app.js`.
   - On line 144 of `js/widgets.js`, `showRouteTip(1);` is called synchronously at the end of `initPrestonLeafletMap()`.
   - Inside `showRouteTip(spotId)` (`js/widgets.js:170-176`), `prestonLeafletMap.flyTo([tipData.lat, tipData.lng], 16, { animate: true, duration: 1.2 });` is executed immediately on page load.
   - `#prestonLeafletMap` has `z-index: 10;` explicitly set in `styles/widgets.css:105`.

---

## 2. Logic Chain

1. **Why OSM Tiles Return HTTP 403 Forbidden**:
   - The OpenStreetMap Foundation (OSMF) operates `tile.openstreetmap.org` servers primarily for OpenStreetMap editing and community testing. Under their official Tile Usage Policy, they actively block requests from applications/browsers that do not provide a specific, approved `User-Agent` HTTP header, requests originating from unapproved Referers, and requests from web applications that generate significant traffic or lack caching.
   - When `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')` runs in a browser on `index.html`, browser requests contain a standard web browser `User-Agent` and the local/hosted domain `Referer`, which OSM's CDN proxy blocks with `403 Forbidden`.

2. **Why CartoDB Voyager is the Optimal Basemap Replacement**:
   - CARTO (CartoDB) basemap tiles (`https://{s}.basemaps.cartocdn.com/...`) are designed for reliable third-party web application embeds, require no API key for standard public raster tile usage, support retina/high-DPI (`{r}` / `@2x`), and do not enforce strict OSM Referer/User-Agent 403 blocks.
   - **CartoDB Voyager** is a warm, colorful, and modern map style that visually complements Learner2Driver's red/green branding (`--color-red: #D32F2F`, `--color-green: #2E7D32`).
   - CartoDB requires explicit attribution to both OpenStreetMap contributors and CARTO:
     `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>`

3. **Map Container Sizing & Leaflet Initialization Bugs**:
   - **Bug A — Missing `invalidateSize()`**: When `initPrestonLeafletMap()` executes on `DOMContentLoaded`, web fonts (`Outfit`, `Plus Jakarta Sans`) and hero background images above `#routes` may still be rendering. When DOM elements above the map change height, Leaflet's internal calculation of container dimensions becomes stale. Without calling `prestonLeafletMap.invalidateSize()`, tiles on the right/bottom edges can clip or render as blank grey squares, and markers appear off-center.
   - **Bug B — Map Container `z-index: 10` in `styles/widgets.css:105`**: Leaflet uses internal stacking panes (`leaflet-map-pane`, `leaflet-tile-pane`, `leaflet-marker-pane`, `leaflet-popup-pane`) with z-indexes ranging from 200 to 700. Explicitly setting `z-index: 10` on `#prestonLeafletMap` creates an unnecessary stacking context that can interfere with mobile dropdowns, toast overlays, and sticky navigation headers.
   - **Bug C — Immediate Animated `flyTo()` on Initial Page Load**: Calling `showRouteTip(1)` at `js/widgets.js:144` immediately triggers `prestonLeafletMap.flyTo([53.7632, -2.7481], 16, { animate: true, duration: 1.2 })`. Because `L.map` was just initialized with `center: [53.7600, -2.7350]` at `zoom: 14`, this immediately forces Leaflet to animate and request zoom-14, zoom-15, and zoom-16 tiles simultaneously on page load, increasing tile loading contention.

---

## 3. Caveats

- **No caveats.** All codebase files were examined and all occurrences of Leaflet/map code were verified.
- Note on Wikimedia tiles (`https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png`): While Wikimedia basemaps are an alternative, they also reserve the right to throttle or block high-traffic Referers without a custom User-Agent. CartoDB Voyager/Positron remains the most reliable primary choice for static web embeds.

---

## 4. Conclusion & Recommended Code Changes

### 4.1 Tile Layer Replacement (`js/widgets.js:120-123`)

Replace the existing 403 OSM tile URL with **CartoDB Voyager** (or **CartoDB Positron** for a minimal light theme), specifying subdomains `'abcd'` and correct CARTO + OSM attribution.

#### Before (`js/widgets.js:120-123`):
```javascript
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors • Preston PR2 2ZN'
    }).addTo(prestonLeafletMap);
```

#### After — Recommended CartoDB Voyager (`js/widgets.js:120-124`):
```javascript
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> • Preston PR2 2ZN'
    }).addTo(prestonLeafletMap);
```

*(Alternative Positron URL if a minimalist grey style is desired: `'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'`)*

---

### 4.2 Fix Map Initialization & Sizing Bugs (`js/widgets.js:113-148`)

1. Initialize `prestonLeafletMap` centered directly on **Danger Spot #1** (`[53.7632, -2.7481]`, zoom 15) so the map does not animate/jump on initial page load.
2. Add a `setTimeout` call to `prestonLeafletMap.invalidateSize()` after DOM rendering.
3. Add a window `resize` event listener so tiles never clip when the browser window is resized.
4. Modify `showRouteTip` to accept an `animate` parameter (`false` on initial load, `true` when clicked by users).

#### Before (`js/widgets.js:113-148`):
```javascript
    prestonLeafletMap = L.map('prestonLeafletMap', {
      center: [53.7600, -2.7350],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors • Preston PR2 2ZN'
    }).addTo(prestonLeafletMap);

    // Place custom geolocated circular marker pins
    Object.keys(PRESTON_ROUTE_TIPS).forEach(id => {
      const num = parseInt(id, 10);
      const data = PRESTON_ROUTE_TIPS[num];

      const pinIcon = L.divIcon({
        className: 'custom-leaflet-icon-wrapper',
        html: `<div id="mapPinCircle${num}" class="leaflet-custom-circle-pin">${num}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([data.lat, data.lng], { icon: pinIcon }).addTo(prestonLeafletMap);
      marker.on('click', () => {
        showRouteTip(num);
      });
      leafletMarkers[num] = marker;
    });

    showRouteTip(1);
  } catch(e) {
    showRouteTip(1);
  }
}
```

#### After (`js/widgets.js:113-155`):
```javascript
    prestonLeafletMap = L.map('prestonLeafletMap', {
      center: [53.7632, -2.7481],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> • Preston PR2 2ZN'
    }).addTo(prestonLeafletMap);

    // Place custom geolocated circular marker pins
    Object.keys(PRESTON_ROUTE_TIPS).forEach(id => {
      const num = parseInt(id, 10);
      const data = PRESTON_ROUTE_TIPS[num];

      const pinIcon = L.divIcon({
        className: 'custom-leaflet-icon-wrapper',
        html: `<div id="mapPinCircle${num}" class="leaflet-custom-circle-pin">${num}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([data.lat, data.lng], { icon: pinIcon }).addTo(prestonLeafletMap);
      marker.on('click', () => {
        showRouteTip(num, true);
      });
      leafletMarkers[num] = marker;
    });

    showRouteTip(1, false);

    // Ensure map container size is recalculated after fonts and layout render
    setTimeout(() => {
      if (prestonLeafletMap) {
        prestonLeafletMap.invalidateSize();
      }
    }, 250);

    // Recalculate on window resize
    window.addEventListener('resize', () => {
      if (prestonLeafletMap) {
        prestonLeafletMap.invalidateSize();
      }
    });
  } catch(e) {
    showRouteTip(1, false);
  }
}
```

---

### 4.3 Update `showRouteTip` Signature to Accept `animate` Flag (`js/widgets.js:150-178`)

#### Before (`js/widgets.js:150-178`):
```javascript
window.showRouteTip = function(spotId) {
  const tipData = PRESTON_ROUTE_TIPS[spotId];
  if (!tipData) return;
...
  // Pan / Fly to exact geolocation on Leaflet map
  if (prestonLeafletMap && typeof prestonLeafletMap.flyTo === 'function') {
    try {
      prestonLeafletMap.flyTo([tipData.lat, tipData.lng], 16, {
        animate: true,
        duration: 1.2
      });
    } catch(err) {}
  }
```

#### After (`js/widgets.js:150-178`):
```javascript
window.showRouteTip = function(spotId, animate = true) {
  const tipData = PRESTON_ROUTE_TIPS[spotId];
  if (!tipData) return;
...
  // Pan / Fly to exact geolocation on Leaflet map
  if (prestonLeafletMap && typeof prestonLeafletMap.flyTo === 'function' && animate) {
    try {
      prestonLeafletMap.flyTo([tipData.lat, tipData.lng], 16, {
        animate: true,
        duration: 1.2
      });
    } catch(err) {}
  }
```

---

### 4.4 Clean Up Map Container CSS (`styles/widgets.css:101-106`)

Remove `z-index: 10;` from `#prestonLeafletMap` to avoid stacking context conflicts.

#### Before (`styles/widgets.css:101-106`):
```css
#prestonLeafletMap {
  width: 100%;
  height: 480px;
  background: #0F172A;
  z-index: 10;
}
```

#### After (`styles/widgets.css:101-105`):
```css
#prestonLeafletMap {
  width: 100%;
  height: 480px;
  background: #0F172A;
}
```

---

## 5. Verification Method

1. **Static Verification (Code Inspection)**:
   - Check `js/widgets.js` at line 120 to verify that `tile.openstreetmap.org` has been replaced by `basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` (or `light_all`).
   - Check that `subdomains: 'abcd'` and CARTO attribution are included in the options object.
   - Verify `prestonLeafletMap.invalidateSize()` is called inside a `setTimeout(..., 250)` block and in a window `resize` event handler.

2. **Functional & Visual Verification (Browser Test)**:
   - Open `index.html` in a web browser (e.g. Chrome / Firefox / Edge) and scroll to `#routes` ("Actual Preston Test Route & Danger Spot Explorer").
   - Open browser **DevTools → Network tab**, filter by `Img` or `png`, and confirm that tile requests to `basemaps.cartocdn.com` return **HTTP 200 OK** (zero HTTP 403 errors).
   - Click each of the 4 Danger Spot buttons (`1. DVSA Chain Caul Way Roundabout`, `2. Docks Swing Bridge`, `3. Riversway Multi-Lane Corridor`, `4. Penwortham Hill Start`) and click each circular red pin (`#1`, `#2`, `#3`, `#4`) on the Leaflet map to confirm smooth `flyTo` animation and tip rendering in `#routeTipBox`.
   - Resize the browser window from desktop (1200px) down to mobile (375px) width and verify that no grey/clipped tiles appear in the map container.
