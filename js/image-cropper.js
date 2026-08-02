/**
 * ==========================================================================
 * LEARNER2DRIVER - IMAGE UPLOAD & ASPECT-RATIO CROP MODAL (image-cropper.js)
 * Aspect Ratios: 16:9, 1:1, 4:3, Free. Canvas 2D Center-Crop Export.
 * ==========================================================================
 */

let cropperState = {
  activeKey: null,
  loadedImg: null,
  aspectRatio: '16:9'
};

document.addEventListener('DOMContentLoaded', () => {
  ensureCropModalInDom();
  hydrateSiteImagesFromStorage();
  if (window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true')) {
    setupImageCropTriggers(true);
  }
});

function ensureCropModalInDom() {
  if (document.getElementById('imageCropModalBackdrop')) return;

  const modalHtml = `
    <div id="imageCropModalBackdrop" class="modal-backdrop">
      <div class="modal-window" style="max-width: 620px; padding: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge badge-primary">Image Cropper</span>
            <h3 id="imageCropModalTitle" style="margin: 0; font-size: 1.2rem;">Crop & Update Site Image</h3>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeImageCropModal()" style="min-width: 36px; padding: 0.4rem;">✕</button>
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 0.4rem;">1. Select Local Image File:</label>
          <input type="file" id="imageCropFileInput" accept="image/*" class="portal-input" style="padding: 0.5rem;" onchange="handleCropFileSelect(event)">
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 0.4rem;">Or Enter Image URL:</label>
          <div style="display: flex; gap: 0.5rem;">
            <input type="url" id="imageCropUrlInput" placeholder="https://images.unsplash.com/..." class="portal-input" style="margin-bottom: 0;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="loadCropImageFromUrl()">Load Image</button>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 0.4rem;">2. Choose Aspect Ratio Preset:</label>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="aspect-btn active" data-ratio="16:9" onclick="setCropAspectRatio('16:9', this)">16:9 (Hero)</button>
            <button type="button" class="aspect-btn" data-ratio="1:1" onclick="setCropAspectRatio('1:1', this)">1:1 (Square / Avatar)</button>
            <button type="button" class="aspect-btn" data-ratio="4:3" onclick="setCropAspectRatio('4:3', this)">4:3 (Fleet Vehicle)</button>
            <button type="button" class="aspect-btn" data-ratio="free" onclick="setCropAspectRatio('free', this)">Free / Native</button>
          </div>
        </div>

        <div style="text-align: center; background: #0F172A; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
          <div style="font-size: 0.78rem; color: #94A3B8; margin-bottom: 0.5rem; font-weight: 600;">HTML5 Center-Cropped Preview Canvas</div>
          <canvas id="imageCropCanvas" style="max-width: 100%; max-height: 300px; border-radius: 6px; display: block; margin: 0 auto; background: #1E293B;"></canvas>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="closeImageCropModal()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="saveCroppedImage()">Save & Apply Image 💾</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openImageCropModal = function(imageKey) {
  ensureCropModalInDom();
  cropperState.activeKey = imageKey;

  const modal = document.getElementById('imageCropModalBackdrop');
  const title = document.getElementById('imageCropModalTitle');
  if (title) title.textContent = `Crop & Update Image (${imageKey})`;

  // Default aspect ratio depending on image key
  let defaultRatio = '16:9';
  if (imageKey.includes('instructor')) defaultRatio = '1:1';
  if (imageKey.includes('fleet') || imageKey.includes('yaris') || imageKey.includes('kona')) defaultRatio = '4:3';
  if (imageKey === 'hero_car') defaultRatio = '16:9';

  cropperState.aspectRatio = defaultRatio;

  // Highlight active aspect ratio button
  const aspectBtns = document.querySelectorAll('#imageCropModalBackdrop .aspect-btn');
  aspectBtns.forEach(btn => {
    if (btn.getAttribute('data-ratio') === defaultRatio) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Try loading current element image
  let currentSrc = '';
  try {
    const imagesMap = JSON.parse(localStorage.getItem('l2d_custom_site_images') || '{}');
    if (imagesMap[imageKey]) {
      currentSrc = imagesMap[imageKey];
    }
  } catch(e) {}

  if (!currentSrc) {
    const targetEl = document.querySelector(`[data-image-key="${imageKey}"]`);
    if (targetEl) {
      if (targetEl.tagName === 'IMG') {
        currentSrc = targetEl.src;
      } else {
        const bg = window.getComputedStyle(targetEl).backgroundImage;
        const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1]) currentSrc = match[1];
      }
    }
  }

  const urlInput = document.getElementById('imageCropUrlInput');
  const fileInput = document.getElementById('imageCropFileInput');
  if (urlInput) urlInput.value = '';
  if (fileInput) fileInput.value = '';

  if (currentSrc) {
    loadImgObject(currentSrc);
  } else {
    cropperState.loadedImg = null;
    renderCropPreview();
  }

  if (modal) modal.classList.add('active');
};

window.closeImageCropModal = function() {
  const modal = document.getElementById('imageCropModalBackdrop');
  if (modal) modal.classList.remove('active');
};

function setCropAspectRatio(ratio, btnEl) {
  cropperState.aspectRatio = ratio;
  const aspectBtns = document.querySelectorAll('#imageCropModalBackdrop .aspect-btn');
  aspectBtns.forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  renderCropPreview();
}
window.setCropAspectRatio = setCropAspectRatio;

function handleCropFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    loadImgObject(e.target.result);
  };
  reader.readAsDataURL(file);
}
window.handleCropFileSelect = handleCropFileSelect;

function loadCropImageFromUrl() {
  const input = document.getElementById('imageCropUrlInput');
  if (!input || !input.value.trim()) {
    alert('Please enter a valid image URL.');
    return;
  }
  loadImgObject(input.value.trim());
}
window.loadCropImageFromUrl = loadCropImageFromUrl;

function loadImgObject(src) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    cropperState.loadedImg = img;
    renderCropPreview();
  };
  img.onerror = () => {
    // If CORS or error, try without crossOrigin or prompt
    cropperState.loadedImg = img;
    renderCropPreview();
  };
  img.src = src;
}

function renderCropPreview() {
  const canvas = document.getElementById('imageCropCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (!cropperState.loadedImg || !cropperState.loadedImg.width) {
    canvas.width = 400;
    canvas.height = 225;
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select a file or enter image URL to preview crop', canvas.width / 2, canvas.height / 2);
    return;
  }

  const imgW = cropperState.loadedImg.width;
  const imgH = cropperState.loadedImg.height;

  let numRatio = imgW / imgH;
  if (cropperState.aspectRatio === '16:9') numRatio = 16 / 9;
  if (cropperState.aspectRatio === '1:1') numRatio = 1;
  if (cropperState.aspectRatio === '4:3') numRatio = 4 / 3;

  let srcW, srcH, srcX, srcY;
  const nativeRatio = imgW / imgH;

  if (nativeRatio > numRatio) {
    srcH = imgH;
    srcW = imgH * numRatio;
    srcX = (imgW - srcW) / 2;
    srcY = 0;
  } else {
    srcW = imgW;
    srcH = imgW / numRatio;
    srcX = 0;
    srcY = (imgH - srcH) / 2;
  }

  const canvasW = Math.min(srcW, 800);
  const canvasH = Math.round(canvasW / numRatio);

  canvas.width = canvasW;
  canvas.height = canvasH;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(cropperState.loadedImg, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
}

window.saveCroppedImage = function() {
  const canvas = document.getElementById('imageCropCanvas');
  if (!canvas || !cropperState.loadedImg || !cropperState.activeKey) {
    alert('Please select or upload an image first.');
    return;
  }

  try {
    const base64Data = canvas.toDataURL('image/jpeg', 0.88);
    let imagesMap = {};
    try {
      imagesMap = JSON.parse(localStorage.getItem('l2d_custom_site_images') || '{}');
    } catch(e) {}

    imagesMap[cropperState.activeKey] = base64Data;
    localStorage.setItem('l2d_custom_site_images', JSON.stringify(imagesMap));
    
    if (typeof window.syncSiteTextToSupabase === 'function') {
      window.syncSiteTextToSupabase('custom_site_images_json', JSON.stringify(imagesMap));
    }

    hydrateSiteImagesFromStorage();
    closeImageCropModal();
    if (typeof window.showToast === 'function') {
      window.showToast(`Image updated & saved for ${cropperState.activeKey}! 📸`);
    }
  } catch(e) {
    console.error('Error exporting canvas image:', e);
    alert('Could not process canvas image. Note: cross-origin images might be restricted by browser CORS. Try uploading a local file.');
  }
};

window.hydrateSiteImagesFromStorage = function() {
  let imagesMap = {};
  try {
    const raw = localStorage.getItem('l2d_custom_site_images');
    if (raw) imagesMap = JSON.parse(raw);
  } catch(e) {}

  const imageEls = document.querySelectorAll('[data-image-key]');
  imageEls.forEach(el => {
    const key = el.getAttribute('data-image-key');
    if (imagesMap[key]) {
      const dataUrl = imagesMap[key];
      if (el.tagName === 'IMG') {
        el.src = dataUrl;
      } else {
        el.style.backgroundImage = `url("${dataUrl}")`;
      }
    }
  });

  const bgEls = document.querySelectorAll('[data-background-key]');
  bgEls.forEach(el => {
    const key = el.getAttribute('data-background-key');
    if (imagesMap[key]) {
      const dataUrl = imagesMap[key];
      const isDark = document.documentElement.classList.contains('dark-mode');
      if (isDark) {
        el.style.background = `linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.95) 100%), url("${dataUrl}") center/cover no-repeat`;
      } else {
        el.style.background = `linear-gradient(180deg, rgba(248, 250, 252, 0.85) 0%, rgba(248, 250, 252, 0.93) 100%), url("${dataUrl}") center/cover no-repeat`;
      }
    }
  });

  // Update showroom default fleet images if needed
  if (typeof DEFAULT_FLEET_DATA !== 'undefined') {
    if (imagesMap['fleet_yaris'] && DEFAULT_FLEET_DATA.yaris) {
      DEFAULT_FLEET_DATA.yaris.img = imagesMap['fleet_yaris'];
    }
    if (imagesMap['fleet_kona'] && DEFAULT_FLEET_DATA.kona) {
      DEFAULT_FLEET_DATA.kona.img = imagesMap['fleet_kona'];
    }
    if (typeof window.refreshShowroomDisplay === 'function') {
      window.refreshShowroomDisplay();
    }
  }
};

window.setupImageCropTriggers = function(enabled) {
  const targets = document.querySelectorAll('[data-image-key]');
  targets.forEach(target => {
    const key = target.getAttribute('data-image-key');
    let wrapper = target.closest('.image-crop-target-wrapper');

    if (!wrapper) {
      wrapper = target.parentElement;
      if (wrapper && !wrapper.classList.contains('image-crop-target-wrapper')) {
        wrapper.classList.add('image-crop-target-wrapper');
      }
    }

    if (wrapper) {
      let btn = wrapper.querySelector('.btn-image-crop-trigger:not(.hero-bg-edit-trigger)');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-image-crop-trigger';
        btn.innerHTML = `📷 Change Image`;
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openImageCropModal(key);
        };
        wrapper.appendChild(btn);
      }
      btn.style.display = enabled ? 'inline-flex' : 'none';
    }
  });

  const bgTargets = document.querySelectorAll('[data-background-key]');
  bgTargets.forEach(target => {
    const key = target.getAttribute('data-background-key');
    let btn = target.querySelector('.hero-bg-edit-trigger');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-image-crop-trigger hero-bg-edit-trigger';
      btn.style.position = 'absolute';
      btn.style.top = '16px';
      btn.style.right = '16px';
      btn.style.zIndex = '100';
      btn.innerHTML = `🖼️ Change Background Image`;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openImageCropModal(key);
      };
      target.style.position = 'relative';
      target.appendChild(btn);
    }
    btn.style.display = enabled ? 'inline-flex' : 'none';
  });
};

