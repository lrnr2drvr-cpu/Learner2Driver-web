# Handoff Report — Explorer 3: Showroom Hotspot Live Sync Architecture & M1 Instagram Embed Clean-Up

## 1. Observation

### A. Current Hotspot Storage, Loading, and Rendering
- **`PROJECT.md` Interface Contract (`PROJECT.md:20-24`)**:
  ```markdown
  ### Hotspot Storage & Sync (`js/showroom.js` ↔ Admin Portal)
  - Storage key: `l2d_fleet_hotspots` (or existing project localStorage key for fleet hotspots).
  - Schema: Object mapping vehicle keys to array of hotspot objects with `x` (percentage string/number), `y` (percentage string/number), title, and description.
  - Live sync: Admin changes save immediately to localStorage; showroom display dynamically loads coordinates on view/update.
  ```
- **Default Fleet Data (`js/showroom.js:8-47`)**:
  `DEFAULT_FLEET_DATA` defines two vehicle keys: `yaris` and `kona`. Each vehicle object contains `id`, `name`, `price`, `badge`, `img`, `fallbackImg`, `specs`, and `hotspots` (an array of 3 hotspot objects with `id`, `title`, `desc`, `x`, and `y` integer percentage coordinates).
  - Toyota Yaris default hotspots (`js/showroom.js:22-26`):
    `#1 (26%, 55%)` — "Biting Point Clutch"
    `#2 (50%, 48%)` — "He-Man Dual Controls"
    `#3 (78%, 52%)` — "Reversing Camera"
  - Hyundai Kona EV default hotspots (`js/showroom.js:41-45`):
    `#1 (30%, 54%)` — "Zero Stalling Electric"
    `#2 (52%, 42%)` — "360° Surround View"
    `#3 (76%, 58%)` — "Dual Electric Pedals"
- **Storage Key and Loading Function (`js/showroom.js:55-63`)**:
  ```javascript
  function getFleetData() {
    const custom = localStorage.getItem('l2d_custom_hotspots');
    if (custom) {
      try {
        return JSON.parse(custom);
      } catch(e) {}
    }
    return DEFAULT_FLEET_DATA;
  }
  ```
- **Admin Hotspot Storage & Editor (`js/course-player.js:431-447, 558-603`)**:
  In the Instructor Admin Portal (`course.html`), `renderAdminContentEditor()` reads `localStorage.getItem('l2d_custom_hotspots')` (`js/course-player.js:431`).
  When `saveAdminContentEditorSettings()` is called (`js/course-player.js:558`), it constructs and saves `customFleet`:
  ```javascript
  const customFleet = {
    yaris: {
      hotspots: [
        { id: 1, title: 'Biting Point Clutch', desc: 'Smooth, lightweight clutch pedal designed for effortless hill starts on Penwortham Bridge.', x: yx1, y: yy1 },
        { id: 2, title: 'He-Man Dual Controls', desc: 'Full instructor dual brake and clutch pedals for 100% safety during initial lessons.', x: yx2, y: yy2 },
        { id: 3, title: 'Reversing Camera', desc: 'Wide-angle rear view camera with active guideline grid for parallel parking.', x: yx3, y: yy3 }
      ]
    },
    kona: {
      hotspots: [ ... ]
    }
  };
  localStorage.setItem('l2d_custom_hotspots', JSON.stringify(customFleet));
  ```
- **Showroom Hotspot Rendering & Positioning (`js/showroom.js:87-110`)**:
  In `renderVehicle(vehicleId)`, `const fleet = getFleetData();` is evaluated (`js/showroom.js:92`), followed by `const car = fleet[vehicleId] || fleet.yaris;` (`js/showroom.js:93`).
  Hotspot badges are rendered with inline CSS percentage coordinates (`js/showroom.js:101-110`):
  ```javascript
  const hotspotsHtml = (car.hotspots || []).map(hs => `
    <div 
      class="car-hotspot" 
      style="left: ${hs.x}%; top: ${hs.y}%;"
      onclick="openHotspotTip(${hs.id}, '${vehicleId}')"
      title="Hotspot #${hs.id}: ${hs.title}">
      ${hs.id}
    </div>
  `).join('');
  ```

### B. Hotspot Badge Positioning Rules (`styles/widgets.css:182-204`)
- `.car-hotspot` is defined in `styles/widgets.css` (not `styles/components.css`) at lines 182-204:
  ```css
  .car-hotspot {
    position: absolute;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-red);
    color: #FFFFFF;
    font-weight: 800;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.35);
    animation: hotspotPulse 2s infinite;
    z-index: 10;
  }
  ```
  And its pulsing keyframes are defined at `styles/widgets.css:200-204`:
  ```css
  @keyframes hotspotPulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.6); }
    70% { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(211, 47, 47, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
  }
  ```

### C. M1 Clean-Up Item: Instagram Embed Script (`index.html:488` and `js/insta-highlights.js:163-183`)
- **`index.html:488`** currently contains:
  ```html
  <script async src="https://www.instagram.com/embed.js"></script>
  ```
- **`processInstaEmbeds()` in `js/insta-highlights.js:172-182`**:
  ```javascript
  if (!document.getElementById('instagram-embed-script')) {
    const script = document.createElement('script');
    script.id = 'instagram-embed-script';
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.onload = triggerProcess;
    document.body.appendChild(script);
  } else {
    setTimeout(triggerProcess, 500);
    setTimeout(triggerProcess, 1500);
  }
  ```

---

## 2. Logic Chain

### A. Critical Schema / Merging Bug in `getFleetData()`
1. When an instructor/admin edits hotspot coordinates in Admin Mode (`course.html`) via `saveAdminContentEditorSettings()` (`js/course-player.js:558-603`), `localStorage.setItem('l2d_custom_hotspots', ...)` saves an object containing only the `hotspots` arrays for `yaris` and `kona`: `{ yaris: { hotspots: [...] }, kona: { hotspots: [...] } }`. It does **not** include vehicle metadata such as `name`, `price`, `badge`, `img`, `fallbackImg`, or `specs`.
2. Because `getFleetData()` in `js/showroom.js:55-63` directly returns `JSON.parse(custom)` when `l2d_custom_hotspots` exists in `localStorage`, any call to `renderVehicle(vehicleId)` receives an object (`car`) that only has the `.hotspots` array.
3. Consequently, `car.name`, `car.badge`, `car.price`, `car.img`, and `car.specs` evaluate to `undefined`. This causes `#showroomDisplayBox` in `index.html#fleet` to render `<span class="badge">undefined</span>`, `<h3>undefined</h3>`, broken `<img src="undefined">`, and empty specification blocks.
4. **Resolution**: `getFleetData()` in `js/showroom.js` must perform a deep merge between `DEFAULT_FLEET_DATA` and any custom object retrieved from `localStorage`. This guarantees that vehicle metadata (`name`, `price`, `badge`, `img`, `specs`) is always preserved while dynamically loading updated `hotspots` coordinates.

### B. Storage Key Alignment
1. `PROJECT.md` specifies that the storage key is `l2d_fleet_hotspots` (or existing project localStorage key for fleet hotspots).
2. Because `l2d_custom_hotspots` is currently used across both `js/showroom.js` and `js/course-player.js`, we recommend keeping `l2d_custom_hotspots` as the primary key while checking `l2d_fleet_hotspots` as a fallback, ensuring backward compatibility with any saved data:
   ```javascript
   const custom = localStorage.getItem('l2d_custom_hotspots') || localStorage.getItem('l2d_fleet_hotspots');
   ```

### C. Live Sync Mechanism
1. Currently, `js/showroom.js` only reads `localStorage` when `renderVehicle(vehicleId)` is invoked (e.g. on DOMContentLoaded or switcher button clicks).
2. If an Admin modifies hotspot coordinates in another tab (`course.html`), or if programmatic changes occur, the open showroom tab (`index.html#fleet`) will not update until manually refreshed.
3. **Resolution**:
   - Add a `window.addEventListener('storage', ...)` event listener in `js/showroom.js` to detect cross-tab changes to `l2d_custom_hotspots` or `l2d_fleet_hotspots` and automatically invoke `renderVehicle(currentVehicleId)`.
   - Expose a global helper `window.refreshShowroomDisplay = () => renderVehicle(currentVehicleId);` for same-tab/programmatic triggers.

### D. CSS Hotspot Badge Centering Precision
1. In `js/showroom.js:104`, hotspot badges are styled with `left: ${hs.x}%; top: ${hs.y}%;`.
2. Because `.car-hotspot` (`styles/widgets.css:182`) has `width: 32px; height: 32px;` and no negative margin or translate offset, `left: X%; top: Y%;` positions the **top-left corner** of the circular pin at coordinate `(X%, Y%)`, not its visual center.
3. Applying `transform: translate(-50%, -50%)` would conflict with `@keyframes hotspotPulse` (`styles/widgets.css:200-204`) which animates `transform: scale(1)` to `scale(1.08)`.
4. **Resolution**: Add `margin-left: -16px; margin-top: -16px;` (or CSS `translate: -50% -50%;`) to `.car-hotspot` in `styles/widgets.css` so that the exact center of the badge sits over `(X%, Y%)` without interfering with `transform` keyframe animations.

### E. M1 Clean-Up Item Logic
1. On `index.html:488`, `<script async src="https://www.instagram.com/embed.js"></script>` lacks an `id` attribute.
2. When `processInstaEmbeds()` runs (`js/insta-highlights.js:163-183`), `document.getElementById('instagram-embed-script')` returns `null`.
3. Consequently, `processInstaEmbeds()` creates and appends a duplicate `<script id="instagram-embed-script" async src="https://www.instagram.com/embed.js"></script>` tag to `document.body`.
4. Adding `id="instagram-embed-script"` to `index.html:488` allows `processInstaEmbeds()` to locate the existing script tag immediately, hitting the `else` branch (`js/insta-highlights.js:179-182`) and preventing duplicate script injection.

---

## 3. Caveats
- **No caveats.** All file paths, storage keys, rendering functions, CSS rules, and script references were directly verified against the complete contents of `PROJECT.md`, `index.html`, `js/showroom.js`, `js/course-player.js`, `js/insta-highlights.js`, and `styles/widgets.css`.

---

## 4. Conclusion & Concrete Design Proposals

### A. Recommended Code Change for `js/showroom.js` (`getFleetData` and Live Sync)
In `js/showroom.js`, replace `getFleetData()` (lines 55-63) and add the live sync listener and global refresher:

```javascript
/**
 * Retrieves fleet data by deep-merging localStorage custom hotspots into DEFAULT_FLEET_DATA.
 * Supports both 'l2d_custom_hotspots' (existing) and 'l2d_fleet_hotspots' (PROJECT.md contract).
 */
function getFleetData() {
  const custom = localStorage.getItem('l2d_custom_hotspots') || localStorage.getItem('l2d_fleet_hotspots');
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      return {
        yaris: {
          ...DEFAULT_FLEET_DATA.yaris,
          ...parsed.yaris,
          hotspots: parsed.yaris?.hotspots || DEFAULT_FLEET_DATA.yaris.hotspots
        },
        kona: {
          ...DEFAULT_FLEET_DATA.kona,
          ...parsed.kona,
          hotspots: parsed.kona?.hotspots || DEFAULT_FLEET_DATA.kona.hotspots
        }
      };
    } catch(e) {
      console.warn('Failed to parse custom fleet hotspots from localStorage; reverting to default:', e);
    }
  }
  return DEFAULT_FLEET_DATA;
}

/**
 * Live Sync: Re-renders the active vehicle immediately when localStorage is modified in another tab/window.
 */
window.addEventListener('storage', (e) => {
  if (e.key === 'l2d_custom_hotspots' || e.key === 'l2d_fleet_hotspots') {
    renderVehicle(currentVehicleId);
  }
});

/**
 * Live Sync: Programmatic helper to re-render active vehicle display in the same window/tab.
 */
window.refreshShowroomDisplay = function() {
  renderVehicle(currentVehicleId);
};
```

### B. Recommended CSS Fix for Hotspot Centering in `styles/widgets.css` (lines 182-198)
In `styles/widgets.css`, update `.car-hotspot` to center the badge over coordinates without breaking `@keyframes hotspotPulse`:

```css
.car-hotspot {
  position: absolute;
  width: 32px;
  height: 32px;
  margin-left: -16px; /* Centers 32px badge horizontally over X% */
  margin-top: -16px;  /* Centers 32px badge vertically over Y% */
  border-radius: 50%;
  background: var(--color-red);
  color: #FFFFFF;
  font-weight: 800;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 0 4px rgba(211, 47, 47, 0.35);
  animation: hotspotPulse 2s infinite;
  z-index: 10;
}
```

### C. Recommended M1 Clean-Up Fix in `index.html` (line 488)
In `index.html`, update line 488 to add `id="instagram-embed-script"`:

```html
<!-- Official Instagram Embed Script -->
<script id="instagram-embed-script" async src="https://www.instagram.com/embed.js"></script>
```

---

## 5. Verification Method

### A. Independent Verification Steps
1. **Verify M1 Instagram Embed Clean-Up**:
   - Inspect `index.html:488` to confirm `<script id="instagram-embed-script" async src="https://www.instagram.com/embed.js"></script>`.
   - Open `index.html` in a browser and check DevTools Console/Elements: verify only **one** `<script id="instagram-embed-script">` element is present in the DOM.
2. **Verify Showroom Deep-Merge Logic & Schema**:
   - In DevTools Console on `index.html#fleet`, run:
     ```javascript
     localStorage.setItem('l2d_custom_hotspots', JSON.stringify({
       yaris: { hotspots: [{ id: 1, title: 'Test Spot', desc: 'Custom Desc', x: 40, y: 40 }] }
     }));
     ```
   - Invoke `getFleetData()` (or view `#fleet` display): confirm `car.name` ("2019 Toyota Yaris (6-Speed Manual)"), `car.badge`, `car.price`, and `car.img` render correctly alongside the updated hotspot at `(40%, 40%)`.
3. **Verify Live Sync Architecture**:
   - Open `index.html#fleet` in Tab 1 and `course.html` (Admin Portal) in Tab 2.
   - In Tab 2, change any Yaris coordinate in the Admin Content Editor and click **Save All Editor Changes 💾**.
   - Switch to Tab 1: confirm that the `#fleet` showroom display dynamically re-rendered the hotspot badge at the new coordinates via the `'storage'` event listener without refreshing the page.

### B. Invalidation Conditions
- If `DEFAULT_FLEET_DATA` is restructured in future milestones to include additional top-level properties or nested objects per vehicle, `getFleetData()` deep-merge logic should be updated accordingly.
