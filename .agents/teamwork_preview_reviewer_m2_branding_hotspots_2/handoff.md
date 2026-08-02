# Milestone 2 Review & Verification Report — Reviewer 2

## 1. Observation

- **Showroom Hotspot LocalStorage Live Sync (`js/showroom.js`)**:
  - **Deep-Merge Implementation (`lines 55-81`)**:
    - Observed `getFleetData()` implementation:
      ```javascript
      function getFleetData() {
        const customStr = localStorage.getItem('l2d_custom_hotspots') || localStorage.getItem('l2d_fleet_hotspots');
        const merged = JSON.parse(JSON.stringify(DEFAULT_FLEET_DATA));
        if (customStr) {
          try {
            const custom = JSON.parse(customStr);
            if (custom && typeof custom === 'object') {
              Object.keys(merged).forEach(key => {
                const customCar = custom[key];
                if (customCar && typeof customCar === 'object') {
                  if (Array.isArray(customCar.hotspots)) {
                    merged[key].hotspots = customCar.hotspots;
                  }
                  Object.keys(customCar).forEach(prop => {
                    if (customCar[prop] !== undefined && prop !== 'hotspots') {
                      merged[key][prop] = customCar[prop];
                    }
                  });
                }
              });
            }
          } catch(e) {
            console.error('Error parsing custom fleet data from localStorage:', e);
          }
        }
        return merged;
      }
      ```
    - Verified that `getFleetData()` clones `DEFAULT_FLEET_DATA` (`JSON.parse(JSON.stringify(DEFAULT_FLEET_DATA))`) before merging `localStorage.getItem('l2d_custom_hotspots')` or `'l2d_fleet_hotspots'`.
    - Verified that when custom data from the Admin content editor (which stores only `hotspots` coordinates) is merged, essential vehicle metadata (`name`, `price`, `badge`, `img`, `fallbackImg`, `specs`) is preserved and is never `undefined`.
  - **Real-Time Live Sync (`lines 83-91`)**:
    - Observed storage event listener and global refresh function:
      ```javascript
      window.addEventListener('storage', (e) => {
        if (e.key === 'l2d_custom_hotspots' || e.key === 'l2d_fleet_hotspots' || !e.key) {
          renderVehicle(currentVehicleId);
        }
      });

      window.refreshShowroomDisplay = () => {
        renderVehicle(currentVehicleId);
      };
      ```
    - Verified that changes to `localStorage` across tabs (`storage` event) or same-page programmatic saves trigger `renderVehicle(currentVehicleId)`.
  - **Admin Content Editor Integration (`js/course-player.js:601-603`)**:
    - Observed in `saveAdminContentEditorSettings()`:
      ```javascript
      if (typeof window.refreshShowroomDisplay === 'function') {
        window.refreshShowroomDisplay();
      }
      ```
    - Verified that saving X% and Y% hotspot coordinates in the Admin Content Editor calls `window.refreshShowroomDisplay()`, immediately refreshing showroom badges on the page without requiring a manual reload.

- **Badge Centering (`styles/widgets.css:182-200`)**:
  - Observed `.car-hotspot` CSS styling:
    ```css
    .car-hotspot {
      position: absolute;
      width: 32px;
      height: 32px;
      margin-left: -16px;
      margin-top: -16px;
      border-radius: 50%;
      ...
    ```
  - Verified that `.car-hotspot` circular badges have exact `margin-left: -16px; margin-top: -16px;` centering applied to compensate for `width: 32px; height: 32px;`.

- **M1 Script ID Clean-up (`index.html:488` & `js/insta-highlights.js:172-183`)**:
  - Observed in `index.html` line 488:
    ```html
    <script id="instagram-embed-script" async src="https://www.instagram.com/embed.js"></script>
    ```
  - Observed in `js/insta-highlights.js` lines 172-179 that `processInstaEmbeds()` checks `!document.getElementById('instagram-embed-script')` before injecting an embed script.
  - Verified that having `id="instagram-embed-script"` on the `<script>` tag in `index.html` prevents duplicate `<script src="https://www.instagram.com/embed.js">` tags from being injected into the DOM.

- **Syntax & Console Exception Verification**:
  - Inspected all modified script files (`js/showroom.js`, `js/reviews.js`, `js/course-player.js`, `js/insta-highlights.js`).
  - Verified zero syntax errors, unclosed brackets/braces, or undefined DOM element references.
  - Verified null-safety guards (e.g., `const container = document.getElementById('showroomDisplayBox'); if (!container) return;`) preventing DevTools console exceptions when functions execute on pages without those containers.

## 2. Logic Chain & Adversarial Challenge

- **Why Deep-Merge works and survives edge cases**:
  - In Admin mode, `saveAdminContentEditorSettings()` stores custom coordinates as an object containing only `yaris.hotspots` and `kona.hotspots`. A naive `JSON.parse` replacement of `DEFAULT_FLEET_DATA` would erase `name`, `price`, `badge`, `img`, `fallbackImg`, and `specs`, breaking the UI.
  - By cloning `DEFAULT_FLEET_DATA` and iterating over each vehicle key, `getFleetData()` selectively overrides `hotspots` only when `Array.isArray(customCar.hotspots)` is true, and only overrides other properties if `customCar[prop] !== undefined`.
  - **Adversarial stress-test**:
    - *What if `localStorage` contains invalid or corrupted JSON?* The `try-catch` block catches syntax errors, logs a warning, and safely falls back to `DEFAULT_FLEET_DATA`.
    - *What if `customCar` is `null`?* Guard `if (customCar && typeof customCar === 'object')` prevents null-reference exceptions.
    - *What if `DEFAULT_FLEET_DATA` is modified?* Because `JSON.parse(JSON.stringify(DEFAULT_FLEET_DATA))` creates an independent deep clone on every call, `DEFAULT_FLEET_DATA` is never mutated.

- **Why `-16px` negative margin centering is superior to transform translate**:
  - When positioning an element with `left: X%; top: Y%;`, its top-left corner sits at `(X%, Y%)`. A 32x32px circle has its geometric center at `(16px, 16px)`.
  - Applying `margin-left: -16px; margin-top: -16px;` shifts the circle 16px left and 16px up, aligning its center precisely over `(X%, Y%)`.
  - **Adversarial stress-test**:
    - *Why not use `transform: translate(-50%, -50%)`?* Because `.car-hotspot` has an active CSS animation `@keyframes hotspotPulse` that animates `transform: scale(1) -> scale(1.08)`. If `translate(-50%, -50%)` were used, the `scale()` animation would overwrite the translation, causing the badge to jump out of alignment. Using negative margins separates positioning from CSS transform animations, ensuring zero visual jitter.

- **Why Script ID Clean-up prevents duplicate script tags**:
  - `processInstaEmbeds()` checks whether `document.getElementById('instagram-embed-script')` exists. Adding `id="instagram-embed-script"` to line 488 of `index.html` ensures that the element check succeeds immediately, triggering `window.instgrm.Embeds.process()` instead of creating redundant DOM script nodes.

## 3. Caveats

- No caveats. The implementation adheres to project conventions, maintains full backward compatibility with default data, and introduces zero integrity violations or shortcuts.

## 4. Conclusion

- **Verdict**: **PASS** / **APPROVE**
- **Quality Review Verdict**: APPROVE — Complete and correct implementation of Showroom Hotspot Live Sync, badge centering, and script ID clean-up.
- **Adversarial Review Verdict**: APPROVE — Robust against malformed localStorage data, missing metadata properties, DOM absence, and CSS transform animation conflicts.

## 5. Verification Method

1. **Showroom Deep-Merge & Live Sync Verification**:
   - Open `index.html` in a browser and scroll to the Training Fleet Showroom.
   - Open browser DevTools Console and execute:
     ```javascript
     localStorage.setItem('l2d_custom_hotspots', JSON.stringify({
       yaris: { hotspots: [{ id: 1, title: 'Adversarial Test Point', desc: 'Tested X/Y Center', x: 50, y: 50 }] }
     }));
     window.refreshShowroomDisplay();
     ```
   - Confirm that the Yaris vehicle card re-renders with full metadata (`2019 Toyota Yaris`, `£37 / Hour`, specs, and badges) intact, and the hotspot #1 badge sits at `(50%, 50%)`.
2. **Badge Centering Verification**:
   - In browser DevTools Elements inspector, inspect any `.car-hotspot` element.
   - Verify Computed CSS styles show `width: 32px`, `height: 32px`, `margin-left: -16px`, and `margin-top: -16px`, placing the center of the circle on the exact `left` and `top` percentage values.
3. **Instagram Script ID Clean-up Verification**:
   - Inspect `index.html` source around line 488 and confirm `<script id="instagram-embed-script" async src="https://www.instagram.com/embed.js"></script>`.
   - In DevTools Console, check `document.querySelectorAll('script[src*="instagram.com/embed.js"]').length` and verify it equals `1` (no duplicate scripts injected).
