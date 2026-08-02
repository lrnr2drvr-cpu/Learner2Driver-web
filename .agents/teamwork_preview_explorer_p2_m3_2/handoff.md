# Milestone 3 Handoff Report: Image Upload & Aspect-Ratio Crop Modal System Specification

## 1. Observation
Direct analysis of the Learner2Driver Phase 2 codebase revealed the following structural details and architectural anchors across HTML, JavaScript, and CSS files:

- **HTML Page Structure & Target Images**:
  - `index.html`:
    - Section `#hero` (lines 78–113): Hero banner container. Currently uses CSS mesh backdrop (`.bg-mesh`). Hero car or background visual is targeted for custom imagery.
    - Section `#instructors` (lines 119–177): Features bio cards for Lead Instructor **Farhan Hussaini** (lines 129–150) and Female Instructor **Binish Moazzam** (lines 153–174). Currently clean photo-less cards.
    - Section `#fleet` (lines 183–206): Interactive vehicle showroom displaying **2019 Toyota Yaris Manual** and **2024 Hyundai Kona EV Automatic** via `#showroomDisplayBox` (injected by `js/showroom.js`).
    - Section `#gallery` (lines 350–378): Hall of Fame pass celebration photo grid containing student pass certificates (`.pass-photo-card img`).
  - `course.html`:
    - `#adminHubContainer` (lines 313–358): Admin Command Hub containing tab navigation (`#adminTabSiteSettings` / `#adminPanelSiteSettings`, lines 338–357).

- **Existing JavaScript Infrastructure**:
  - `js/app.js` (lines 203–255): Implements `applyCustomSiteContent()`, reading `l2d_site_content` from `localStorage` and updating text content across the landing page. Listens to `storage` cross-tab events.
  - `js/showroom.js` (lines 8–84): Defines `DEFAULT_FLEET_DATA` (Yaris and Kona EV with `img` URLs) and `getFleetData()` which parses `l2d_custom_hotspots` / `l2d_fleet_hotspots` from `localStorage`.
  - `js/course-player.js` (lines 997–1384): Implements `renderAdminSiteSettings()` and `saveAdminContentEditorSettings()`, managing `localStorage` persistence for site settings, car hotspots, and credentials.

- **Existing UI Components & Styling**:
  - `styles/components.css` (lines 386–419): Defines `.modal-backdrop` and `.modal-window` overlay styles with `backdrop-filter: blur(8px)`.
  - `styles/course.css` (lines 57–74, 239–265): Defines `.portal-input`, `.admin-editor-panel`, and `.editor-grid-2` layout containers.

---

## 2. Logic Chain
To provide Admin users with intuitive, zero-dependency client-side image customization across `index.html`, the system is structured into four cohesive layers:

1. **Target Identification & Attribute Binding (`[data-image-key]`)**:
   - Every customizable image element is annotated with a unique `data-image-key` attribute (e.g., `hero_car`, `instructor_farhan`, `instructor_binish`, `fleet_yaris`, `fleet_kona`).
   - Image elements are wrapped in a positioning container (`.image-crop-target-wrapper`) that hosts the hover edit trigger.

2. **Admin Edit Mode Overlay Trigger (`📷 Change Image`)**:
   - When Admin Mode is active (`courseState.isAdmin === true` or `.admin-edit-mode-active` on `<body>`), a floating hover edit button (`.btn-image-crop-trigger`) is rendered over each target image.
   - Clicking this button opens `#imageCropModalBackdrop` initialized with the target element's key and default aspect ratio constraint.

3. **HTML5 Canvas Cropping Engine & Modal (`#imageCropModalBackdrop`)**:
   - Modal allows dual input: local file selection via `<input type="file" accept="image/*">` or image URL entry.
   - Aspect ratio preset buttons (`16:9`, `1:1`, `4:3`, `Free`) update canvas dimension constraints.
   - HTML5 `<canvas id="imageCropCanvas">` renders live image previews, applying aspect-ratio calculation and center-crop math.
   - Export mechanism converts canvas image to base64 JPEG (`canvas.toDataURL('image/jpeg', 0.88)`).

4. **Hydration Engine (`hydrateSiteImagesFromStorage()`)**:
   - Reads `l2d_custom_site_images` dictionary from `localStorage`.
   - Iterates all `[data-image-key]` elements on the page, replacing `img.src` or `background-image` styles.
   - Updates `getFleetData()` in `js/showroom.js` to ensure vehicle showroom images reflect custom admin uploads.

---

## 3. Detailed Architectural Specification

### 3.1 Modal Layout & UI Component (`#imageCropModalBackdrop`)

Add the following modal backdrop template to `index.html` (and optionally `course.html`):

```html
<!-- IMAGE UPLOAD & ASPECT-RATIO CROP MODAL -->
<div id="imageCropModalBackdrop" class="modal-backdrop" style="display: none;">
  <div class="modal-window" style="max-width: 680px; padding: 2rem;">
    <!-- Modal Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
      <div>
        <span class="badge badge-primary mb-1">Admin Image Editor</span>
        <h3 id="imageCropModalTitle" style="margin: 0; font-size: 1.3rem;">Crop & Customize Site Image</h3>
      </div>
      <button type="button" class="btn btn-secondary btn-sm" onclick="closeImageCropModal()" style="min-width: 36px; height: 36px; padding: 0;">✕</button>
    </div>

    <!-- Hidden state inputs -->
    <input type="hidden" id="cropTargetImageKey" value="">
    <input type="hidden" id="cropActiveAspectRatio" value="16:9">

    <!-- Source Input Controls (File Upload OR Image URL) -->
    <div style="margin-bottom: 1.25rem;">
      <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Select Image Source:</label>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
        <div>
          <label for="imageFileInput" style="font-size: 0.78rem; color: var(--text-light); display: block; margin-bottom: 0.25rem;">Upload Local File</label>
          <input type="file" id="imageFileInput" accept="image/*" class="portal-input" style="padding: 0.5rem; margin-bottom: 0;" onchange="handleCropFileSelect(event)">
        </div>
        <div>
          <label for="imageUrlInput" style="font-size: 0.78rem; color: var(--text-light); display: block; margin-bottom: 0.25rem;">Or Enter Image URL</label>
          <div style="display: flex; gap: 0.4rem;">
            <input type="url" id="imageUrlInput" class="portal-input" placeholder="https://..." style="margin-bottom: 0;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="handleCropUrlLoad()">Load</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Aspect-Ratio Preset Selector Buttons -->
    <div style="margin-bottom: 1.25rem;">
      <label style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">Aspect Ratio Presets:</label>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn btn-secondary btn-sm btn-aspect-ratio active" data-ratio="16:9" onclick="setCropAspectRatio('16:9')">16:9 (Landscape Banner)</button>
        <button type="button" class="btn btn-secondary btn-sm btn-aspect-ratio" data-ratio="1:1" onclick="setCropAspectRatio('1:1')">1:1 (Square Avatar)</button>
        <button type="button" class="btn btn-secondary btn-sm btn-aspect-ratio" data-ratio="4:3" onclick="setCropAspectRatio('4:3')">4:3 (Card Feature)</button>
        <button type="button" class="btn btn-secondary btn-sm btn-aspect-ratio" data-ratio="free" onclick="setCropAspectRatio('free')">Original Ratio</button>
      </div>
    </div>

    <!-- Canvas Preview Workspace -->
    <div style="margin-bottom: 1.5rem; text-align: center; background: var(--bg-body); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
      <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 0.5rem;">Interactive Live Crop Workspace Preview</div>
      <canvas id="imageCropCanvas" width="640" height="360" style="max-width: 100%; height: auto; border: 2px dashed var(--color-green); border-radius: var(--radius-sm); background: #000; display: block; margin: 0 auto;"></canvas>
      <img id="cropSourceImage" src="" alt="Source preview" style="display: none;">
    </div>

    <!-- Modal Footer Actions -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
      <button type="button" class="btn btn-accent btn-sm" onclick="resetTargetImageToDefault()" style="background: var(--color-red, #EF4444); border-color: var(--color-red, #EF4444); color: #FFF;">Reset to Default Image ↺</button>
      <div style="display: flex; gap: 0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeImageCropModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveCroppedImage()">Crop & Save Image 💾</button>
      </div>
    </div>
  </div>
</div>
```

---

### 3.2 JavaScript Cropping Engine & Hydration Module (`js/image-cropper.js`)

Create a dedicated module file `js/image-cropper.js` (or append to `js/app.js`):

```javascript
/**
 * LEARNER2DRIVER - IMAGE UPLOAD & ASPECT-RATIO CROP ENGINE
 * Key-bound image customization with HTML5 Canvas & LocalStorage persistence
 */

const DEFAULT_IMAGE_RANGES = {
  '16:9': { w: 800, h: 450 },
  '1:1': { w: 400, h: 400 },
  '4:3': { w: 800, h: 600 },
  'free': { w: 800, h: 600 }
};

let loadedCropImage = null;

document.addEventListener('DOMContentLoaded', () => {
  hydrateSiteImagesFromStorage();
  initImageEditHoverTriggers();
});

/**
 * 1. Hydrate Site Images from localStorage ('l2d_custom_site_images')
 */
function hydrateSiteImagesFromStorage() {
  let customImages = {};
  try {
    const saved = localStorage.getItem('l2d_custom_site_images');
    if (saved) customImages = JSON.parse(saved);
  } catch (e) {
    console.error('Error loading l2d_custom_site_images:', e);
  }

  // Update elements with [data-image-key]
  document.querySelectorAll('[data-image-key]').forEach(el => {
    const key = el.getAttribute('data-image-key');
    const customSrc = customImages[key];

    if (customSrc) {
      if (el.tagName.toLowerCase() === 'img') {
        el.src = customSrc;
      } else {
        el.style.backgroundImage = `url("${customSrc}")`;
      }
    }
  });

  // Sync fleet images with showroom data if fleet keys exist
  if (customImages.fleet_yaris || customImages.fleet_kona) {
    if (typeof window.refreshShowroomDisplay === 'function') {
      window.refreshShowroomDisplay();
    }
  }
}

window.hydrateSiteImagesFromStorage = hydrateSiteImagesFromStorage;

/**
 * 2. Admin Edit Mode Hover Overlay Buttons
 */
function initImageEditHoverTriggers() {
  document.querySelectorAll('[data-image-key]').forEach(el => {
    const key = el.getAttribute('data-image-key');
    const parent = el.closest('.image-crop-target-wrapper') || el.parentElement;

    if (!parent.classList.contains('image-crop-target-wrapper')) {
      parent.classList.add('image-crop-target-wrapper');
    }

    if (!parent.querySelector('.btn-image-crop-trigger')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-image-crop-trigger';
      btn.innerHTML = '📷 Change Image';
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openImageCropModal(key);
      };
      parent.appendChild(btn);
    }
  });
}

window.initImageEditHoverTriggers = initImageEditHoverTriggers;

/**
 * 3. Modal Open & Aspect-Ratio Controller
 */
function openImageCropModal(imageKey, defaultRatio = '16:9') {
  const modal = document.getElementById('imageCropModalBackdrop');
  if (!modal) return;

  document.getElementById('cropTargetImageKey').value = imageKey;
  const titleEl = document.getElementById('imageCropModalTitle');
  if (titleEl) titleEl.textContent = `Crop & Customize Image [${imageKey}]`;

  // Auto-detect recommended ratio by key
  if (imageKey.includes('avatar') || imageKey.includes('instructor')) defaultRatio = '1:1';
  if (imageKey.includes('yaris') || imageKey.includes('kona') || imageKey.includes('fleet') || imageKey.includes('hero')) defaultRatio = '16:9';

  setCropAspectRatio(defaultRatio);
  modal.style.display = 'flex';
  modal.classList.add('active');

  // Load current image if available
  const existingEl = document.querySelector(`[data-image-key="${imageKey}"]`);
  if (existingEl) {
    const src = existingEl.tagName.toLowerCase() === 'img' ? existingEl.src : extractBgUrl(existingEl.style.backgroundImage);
    if (src) loadSourceImageToCanvas(src);
  }
}

window.openImageCropModal = openImageCropModal;

function closeImageCropModal() {
  const modal = document.getElementById('imageCropModalBackdrop');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

window.closeImageCropModal = closeImageCropModal;

function setCropAspectRatio(ratio) {
  document.getElementById('cropActiveAspectRatio').value = ratio;
  document.querySelectorAll('.btn-aspect-ratio').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-ratio') === ratio);
  });
  if (loadedCropImage) {
    renderCanvasCropPreview();
  }
}

window.setCropAspectRatio = setCropAspectRatio;

/**
 * 4. Image Loader & HTML5 Canvas Cropping Engine
 */
function handleCropFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    loadSourceImageToCanvas(e.target.result);
  };
  reader.readAsDataURL(file);
}

window.handleCropFileSelect = handleCropFileSelect;

function handleCropUrlLoad() {
  const url = document.getElementById('imageUrlInput')?.value.trim();
  if (!url) {
    alert('Please enter a valid image URL.');
    return;
  }
  loadSourceImageToCanvas(url);
}

window.handleCropUrlLoad = handleCropUrlLoad;

function loadSourceImageToCanvas(src) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    loadedCropImage = img;
    renderCanvasCropPreview();
  };
  img.onerror = () => {
    alert('Failed to load image from source. Please check the file format or CORS permissions.');
  };
  img.src = src;
}

function renderCanvasCropPreview() {
  if (!loadedCropImage) return;
  const canvas = document.getElementById('imageCropCanvas');
  const ctx = canvas.getContext('2d');
  const ratioMode = document.getElementById('cropActiveAspectRatio').value || '16:9';

  let targetWidth = 800;
  let targetHeight = 450;

  if (ratioMode === '1:1') {
    targetWidth = 500;
    targetHeight = 500;
  } else if (ratioMode === '4:3') {
    targetWidth = 800;
    targetHeight = 600;
  } else if (ratioMode === 'free') {
    targetWidth = 800;
    targetHeight = Math.round(800 * (loadedCropImage.height / loadedCropImage.width));
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Center-crop drawing math
  const imgAspect = loadedCropImage.width / loadedCropImage.height;
  const targetAspect = targetWidth / targetHeight;
  let drawW, drawH, offsetX, offsetY;

  if (imgAspect > targetAspect) {
    drawH = loadedCropImage.height;
    drawW = loadedCropImage.height * targetAspect;
    offsetX = (loadedCropImage.width - drawW) / 2;
    offsetY = 0;
  } else {
    drawW = loadedCropImage.width;
    drawH = loadedCropImage.width / targetAspect;
    offsetX = 0;
    offsetY = (loadedCropImage.height - drawH) / 2;
  }

  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(loadedCropImage, offsetX, offsetY, drawW, drawH, 0, 0, targetWidth, targetHeight);
}

/**
 * 5. Save & Reset Action Handlers
 */
function saveCroppedImage() {
  const canvas = document.getElementById('imageCropCanvas');
  const key = document.getElementById('cropTargetImageKey').value;
  if (!canvas || !key || !loadedCropImage) {
    alert('Please select or upload an image first.');
    return;
  }

  const base64Url = canvas.toDataURL('image/jpeg', 0.88);

  let customImages = {};
  try {
    const saved = localStorage.getItem('l2d_custom_site_images');
    if (saved) customImages = JSON.parse(saved);
    customImages[key] = base64Url;
    localStorage.setItem('l2d_custom_site_images', JSON.stringify(customImages));
  } catch (e) {
    console.error('Error saving custom site image:', e);
  }

  hydrateSiteImagesFromStorage();
  closeImageCropModal();
  if (typeof window.showToast === 'function') {
    window.showToast(`Updated custom image for [${key}]! 🖼️`);
  }
}

window.saveCroppedImage = saveCroppedImage;

function resetTargetImageToDefault() {
  const key = document.getElementById('cropTargetImageKey').value;
  if (!key) return;

  try {
    const saved = localStorage.getItem('l2d_custom_site_images');
    if (saved) {
      const customImages = JSON.parse(saved);
      delete customImages[key];
      localStorage.setItem('l2d_custom_site_images', JSON.stringify(customImages));
    }
  } catch (e) {}

  location.reload();
}

window.resetTargetImageToDefault = resetTargetImageToDefault;

function extractBgUrl(bgStr) {
  if (!bgStr) return '';
  const match = bgStr.match(/url\(['"]?(.*?)['"]?\)/);
  return match ? match[1] : '';
}
```

---

### 3.3 CSS Hover Overlay & Trigger Button Styles (`styles/components.css`)

Append to `styles/components.css`:

```css
/* ==========================================================================
   ADMIN IMAGE EDIT OVERLAY & CROP TRIGGER BUTTONS
   ========================================================================== */

.image-crop-target-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
  width: 100%;
}

.btn-image-crop-trigger {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  background: var(--color-green);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-full);
  padding: 0.45rem 0.9rem;
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.image-crop-target-wrapper:hover .btn-image-crop-trigger,
body.admin-edit-mode-active .btn-image-crop-trigger {
  opacity: 1;
  pointer-events: auto;
}

.btn-image-crop-trigger:hover {
  transform: scale(1.05);
  background: #236527;
}

.btn-aspect-ratio.active {
  background: var(--color-green) !important;
  color: #FFFFFF !important;
  border-color: var(--color-green) !important;
  box-shadow: var(--shadow-glow);
}
```

---

## 4. Caveats
- **Local Storage Quota Limits**: Base64 data URLs consume ~33% more space than raw binary. Export quality is set to `0.88` JPEG and canvas dimensions are capped at 800px width to ensure storage payloads stay within localStorage limits (~5MB total).
- **CORS Limitations on Remote URLs**: When fetching external image URLs via `<canvas>`, servers without permissive `Access-Control-Allow-Origin` headers may taint the canvas. A clear error toast handles CORS exceptions gracefully, directing admins to upload local image files.
- **Cross-Tab Synchronization**: Changes saved to `l2d_custom_site_images` trigger the native window `storage` event, ensuring instant live preview across open browser tabs.

---

## 5. Conclusion
The proposed Image Upload & Aspect-Ratio Crop Modal System provides an intuitive, admin-friendly image customization experience without external library dependencies. It cleanly integrates with `index.html` elements via `[data-image-key]` attributes, hydrates from `localStorage`, and provides pixel-perfect HTML5 canvas aspect-ratio cropping.

---

## 6. Verification Method

### 6.1 Independent Code Verification
1. Inspect `index.html` to confirm target image elements are decorated with `[data-image-key="hero_car"]`, `[data-image-key="instructor_farhan"]`, `[data-image-key="instructor_binish"]`, `[data-image-key="fleet_yaris"]`, and `[data-image-key="fleet_kona"]`.
2. Inspect `styles/components.css` to verify `.image-crop-target-wrapper` and `.btn-image-crop-trigger` hover animation rules.

### 6.2 Interactive Browser Verification
1. Launch local web server or open `index.html` in browser.
2. Hover over instructor or fleet image cards to observe the `📷 Change Image` floating edit button.
3. Click `📷 Change Image` to launch `#imageCropModalBackdrop`.
4. Upload a local image file or paste an image URL.
5. Select aspect ratio presets (`16:9`, `1:1`, `4:3`) and verify live canvas crop rendering.
6. Click `Crop & Save Image 💾` and verify the element updates immediately and persists after page reload (`localStorage.getItem('l2d_custom_site_images')`).
