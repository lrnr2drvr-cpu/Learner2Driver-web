# Handoff Report — Phase 2 Milestone 3: Interactive Drag-and-Drop Hotspot Positioning Engine

**Working Directory**: `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_p2_m3_3\`  
**Target Project**: `Learner2Driver Phase 2`  
**Milestone**: `Milestone 3 — Interactive Drag-and-Drop Hotspot Positioning Engine`

---

## 1. Observation

Direct investigation of the codebase revealed the following exact structures and implementations across key files:

### A. HTML Structure (`index.html`)
- **Fleet Section**: `#fleet` (lines 183–206) contains `#showroomDisplayBox` (`<div id="showroomDisplayBox" class="glass-card" style="padding: 2.5rem; text-align: center; max-width: 960px; margin: 0 auto;"></div>`).
- **Scripts Loaded**:
  - `js/app.js` (line 493)
  - `js/showroom.js` (line 494)
  - `js/widgets.js` (line 495)
  - `js/course-player.js` (loaded in `course.html`)

### B. Hotspot Rendering Engine (`js/showroom.js`)
- **Default Fleet Data**: `DEFAULT_FLEET_DATA` (lines 8–47) defines `yaris` and `kona` vehicles, each with a `hotspots` array of objects containing `id`, `title`, `desc`, `x` (percentage left), `y` (percentage top).
- **LocalStorage Data Access**: `getFleetData()` (lines 55–84) retrieves custom hotspot overrides from `localStorage.getItem('l2d_custom_hotspots')` or `localStorage.getItem('l2d_fleet_hotspots')`.
- **DOM Injection**: `renderVehicle(vehicleId)` (lines 118–184) renders `.showroom-car-view` and maps hotspots to HTML button elements:
  ```html
  <button 
    type="button"
    class="car-hotspot" 
    style="left: ${hs.x}%; top: ${hs.y}%;"
    onclick="openHotspotTip(${hs.id}, '${vehicleId}')"
    aria-label="Hotspot #${hs.id}: ${hs.title}"
    title="Hotspot #${hs.id}: ${hs.title}">
    ${hs.id}
  </button>
  ```
- **Live Display Refresh**: `window.refreshShowroomDisplay()` (lines 92–94) re-renders the current vehicle on demand.

### C. Styling Rules (`styles/widgets.css`)
- **Car View Container**: `.showroom-car-view` (lines 167–174) with `position: relative; max-width: 760px; margin: 0 auto 1.5rem; border-radius: var(--radius-lg); overflow: hidden;`.
- **Hotspot Pin Styling**: `.car-hotspot` (lines 183–201) with `position: absolute; width: 44px; height: 44px; margin-left: -22px; margin-top: -22px; border-radius: 50%; background: var(--color-red); color: #FFFFFF; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.35); animation: hotspotPulse 2s infinite; z-index: 10;`.

### D. Admin Hub Integration (`js/course-player.js`)
- **Admin Site Settings Hotspot Editor**: `renderAdminSiteSettings()` (lines 1125–1272) provides numeric input fields (`#editYarisX1`, `#editYarisY1`, etc.) for X% and Y% coordinates for both Yaris and Kona EV.
- **Persistence Helper**: `saveAdminContentEditorSettings()` (lines 1279–1384) collects form values and saves them into `localStorage` under both `l2d_custom_hotspots` and `l2d_fleet_hotspots`, then triggers `window.refreshShowroomDisplay()`.

---

## 2. Logic Chain

From the observations, the current hotspot system relies on static percentage coordinates rendered from `localStorage`. To enable an **Interactive Drag-and-Drop Hotspot Positioning Engine**, the following logic chain connects state, UI, mouse/touch events, calculation, tooltip feedback, and persistence:

1. **Admin Mode State Tracking (`l2d_admin_editing_mode`)**:
   - `localStorage.getItem('l2d_admin_editing_mode') === 'true'` (or `courseState.isAdmin`) dictates whether edit mode is active.
   - When edit mode is ON:
     - Hotspot pins gain class `.draggable` / `.hotspot-pin-draggable`.
     - An Admin Toggle Control Bar is displayed above `.showroom-car-view` to switch editing mode ON/OFF with live visual indicator.

2. **Event Lifecycle & Boundary Clamping**:
   - Dragging is initiated via `mousedown` (or `touchstart`) on any `.car-hotspot.draggable` pin.
   - On drag start, query `parentRect = container.getBoundingClientRect()` to get the current rendered width (`parentRect.width`) and height (`parentRect.height`) of `.showroom-car-view`.
   - Global `mousemove` (or `touchmove`) listeners track pointer coordinates (`e.clientX`, `e.clientY` or `e.touches[0].clientX`, `e.touches[0].clientY`).
   - Calculate relative pixel position within container:
     $$\text{relX} = \text{clientX} - \text{parentRect.left}$$
     $$\text{relY} = \text{clientY} - \text{parentRect.top}$$
   - Calculate clamped percentage bounds (0% to 100%):
     $$\text{leftPercent} = \max\left(0, \min\left(100, \frac{\text{relX}}{\text{parentRect.width}} \times 100\right)\right)$$
     $$\text{topPercent} = \max\left(0, \min\left(100, \frac{\text{relY}}{\text{parentRect.height}} \times 100\right)\right)$$

3. **Real-time Live Readout Tooltip**:
   - While dragging, append or position a `.hotspot-drag-tooltip` badge attached to the pin.
   - Update text in real-time to `(X: ${leftPercent.toFixed(1)}%, Y: ${topPercent.toFixed(1)}%)`.
   - Apply inline styles `pin.style.left = leftPercent + '%'` and `pin.style.top = topPercent + '%'`.

4. **Persistence & Bidirectional Synchronization**:
   - On `mouseup` / `touchend`, clean up global listeners.
   - Update the in-memory hotspot object for `currentVehicleId`: `hotspot.x = Math.round(leftPercent)` (or `parseFloat(leftPercent.toFixed(1))`) and `hotspot.y = Math.round(topPercent)`.
   - Save updated JSON to both `l2d_fleet_hotspots` and `l2d_custom_hotspots` in `localStorage`.
   - Call `window.dispatchEvent(new Event('storage'))` and update any open Admin Site Settings input fields (`#editYarisX1`, `#editYarisY1`, etc.) so the table reflects the new drag-and-drop coordinates immediately.

---

## 3. Caveats

1. **Responsive Image Rescaling**:
   - The `.showroom-car-view` container width varies between mobile (320px) and desktop (760px). Using percentage coordinates (`left: X%`, `top: Y%`) guarantees perfect responsiveness regardless of viewport width.
2. **Touch Device Support**:
   - Mobile and tablet users require `touchstart`, `touchmove`, and `touchend` event handlers with `e.preventDefault()` to prevent default page scrolling while dragging pins.
3. **Click vs. Drag Disambiguation**:
   - In edit mode, clicking a pin without moving it should still open the hotspot explanation tip (`openHotspotTip`). A distance threshold (e.g. 3px movement) distinguishes a click from a drag.
4. **LocalStorage Compatibility**:
   - Both `l2d_fleet_hotspots` and `l2d_custom_hotspots` keys must be kept in sync to maintain backward compatibility with all modules.

---

## 4. Conclusion & Proposed Specification

### A. CSS Extensions (`styles/widgets.css`)
Add the following CSS rules for draggable handles, active drag glow, and live tooltip:

```css
/* Drag-and-Drop Hotspot Positioning Engine Styles */
.car-hotspot.draggable,
.hotspot-pin.draggable {
  cursor: grab;
  box-shadow: 0 0 0 3px #F57C00, 0 0 12px rgba(245, 124, 0, 0.6);
  border: 2px dashed #FFFFFF;
}

.car-hotspot.draggable:hover {
  transform: scale(1.12);
}

.car-hotspot.dragging,
.hotspot-pin.dragging {
  cursor: grabbing !important;
  z-index: 100 !important;
  animation: none !important;
  transform: scale(1.25) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(46, 125, 50, 0.9) !important;
  background: var(--color-green) !important;
}

.hotspot-drag-tooltip {
  position: absolute;
  bottom: 115%;
  left: 50%;
  transform: translateX(-50%);
  background: #0F172A;
  color: #4ADE80;
  border: 1px solid #334155;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  z-index: 105;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.admin-hotspot-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.65rem 1rem;
  margin-bottom: 1rem;
}
```

### B. JavaScript Implementation Patch (`js/showroom.js`)

Add Admin Edit Mode state check and Drag-and-Drop event listeners to `js/showroom.js`:

```javascript
// Admin Edit Mode Helper
function isAdminEditingMode() {
  try {
    return localStorage.getItem('l2d_admin_editing_mode') === 'true' || 
           (window.courseState && window.courseState.isAdmin);
  } catch(e) {
    return false;
  }
}

window.toggleAdminHotspotEditing = function() {
  const current = isAdminEditingMode();
  try {
    localStorage.setItem('l2d_admin_editing_mode', (!current).toString());
  } catch(e) {}
  if (window.showToast) {
    window.showToast(!current ? '🎯 Hotspot Drag & Drop Edit Mode ON' : '🔒 Hotspot Edit Mode OFF');
  }
  renderVehicle(currentVehicleId);
};

// Render Vehicle Update with Drag Engine Attachment
function attachHotspotDragEngine(pinEl, hs, vehicleId) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let hasMoved = false;
  let tooltipEl = null;

  const onStart = (e) => {
    if (!isAdminEditingMode()) return;
    
    isDragging = true;
    hasMoved = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;

    pinEl.classList.add('dragging');

    // Create Tooltip Readout
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'hotspot-drag-tooltip';
    tooltipEl.innerHTML = `(X: ${hs.x.toFixed(1)}%, Y: ${hs.y.toFixed(1)}%)`;
    pinEl.appendChild(tooltipEl);

    document.addEventListener('mousemove', onMove, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  };

  const onMove = (e) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = Math.abs(clientX - startX);
    const dy = Math.abs(clientY - startY);
    if (dx > 3 || dy > 3) hasMoved = true;

    const container = pinEl.closest('.showroom-car-view');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const leftPercent = Math.max(0, Math.min(100, (relX / rect.width) * 100));
    const topPercent = Math.max(0, Math.min(100, (relY / rect.height) * 100));

    pinEl.style.left = `${leftPercent}%`;
    pinEl.style.top = `${topPercent}%`;

    if (tooltipEl) {
      tooltipEl.innerHTML = `(X: ${leftPercent.toFixed(1)}%, Y: ${topPercent.toFixed(1)}%)`;
    }
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;

    pinEl.classList.remove('dragging');
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }

    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);

    if (hasMoved) {
      const container = pinEl.closest('.showroom-car-view');
      if (container) {
        const rect = container.getBoundingClientRect();
        const curLeftPx = parseFloat(pinEl.style.left) || hs.x;
        const curTopPx = parseFloat(pinEl.style.top) || hs.y;
        
        const finalX = Math.round(curLeftPx * 10) / 10;
        const finalY = Math.round(curTopPx * 10) / 10;

        // Persist to LocalStorage
        saveHotspotPosition(vehicleId, hs.id, finalX, finalY);
      }
    }
  };

  pinEl.addEventListener('mousedown', onStart);
  pinEl.addEventListener('touchstart', onStart, { passive: false });
}

function saveHotspotPosition(vehicleId, hotspotId, newX, newY) {
  const fleet = getFleetData();
  if (fleet[vehicleId] && fleet[vehicleId].hotspots) {
    const targetHs = fleet[vehicleId].hotspots.find(h => h.id === hotspotId);
    if (targetHs) {
      targetHs.x = newX;
      targetHs.y = newY;
      
      try {
        localStorage.setItem('l2d_fleet_hotspots', JSON.stringify(fleet));
        localStorage.setItem('l2d_custom_hotspots', JSON.stringify(fleet));
      } catch(e) {}

      if (window.showToast) {
        window.showToast(`Updated Hotspot #${hotspotId} (${vehicleId.toUpperCase()}) -> X: ${newX}%, Y: ${newY}% 🎯`);
      }

      // Dynamic sync with Admin Site Settings Table
      if (typeof window.renderAdminSiteSettings === 'function') {
        window.renderAdminSiteSettings();
      }
    }
  }
}
```

---

## 5. Verification Method

To verify the Interactive Drag-and-Drop Hotspot Positioning Engine:

1. **Enable Admin Edit Mode in Browser Console**:
   ```javascript
   localStorage.setItem('l2d_admin_editing_mode', 'true');
   window.refreshShowroomDisplay();
   ```
2. **Inspect Pin Drag Handles**:
   - Verify hotspot pins (`.car-hotspot`) gain the orange dashed border (`.draggable`) and grab cursor.
3. **Execute Pin Dragging**:
   - Click and drag hotspot `#1` on Toyota Yaris across the vehicle canvas.
   - Observe live floating readout tooltip: `(X: 45.2%, Y: 62.8%)`.
   - Release mouse button and confirm toast notification appears: `Updated Hotspot #1 (YARIS) -> X: 45.2%, Y: 62.8% 🎯`.
4. **Verify LocalStorage Persistence**:
   - Inspect `localStorage.getItem('l2d_fleet_hotspots')` in Developer Tools.
   - Verify coordinates for hotspot 1 have updated.
5. **Verify Admin Table Sync**:
   - Open Admin Hub -> Site Settings tab in `course.html`.
   - Confirm input fields `#editYarisX1` and `#editYarisY1` automatically reflect `45` and `63`.
