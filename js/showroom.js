/**
 * ==========================================================================
 * LEARNER2DRIVER - TRAINING FLEET SHOWROOM (showroom.js)
 * Supports Custom Hotspot Coordinates (X% / Y%) from Admin Dashboard
 * ==========================================================================
 */

const DEFAULT_FLEET_DATA = {
  yaris: {
    id: 'yaris',
    name: '2019 Toyota Yaris (6-Speed Manual)',
    price: '£37 / Hour',
    badge: 'Agile Preston Hatchback',
    img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop',
    fallbackImg: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop',
    specs: [
      { label: 'Transmission', val: '6-Speed Manual' },
      { label: 'Dual Controls', val: 'He-Man DVSA Approved' },
      { label: 'Hill Assist', val: 'Electronic Auto-Hold' },
      { label: 'Fuel Type', val: '1.5L VVT-i Petrol Hybrid' }
    ],
    hotspots: [
      { id: 1, title: 'Biting Point Clutch', desc: 'Smooth, lightweight clutch pedal designed for effortless hill starts on Penwortham Bridge.', x: 26, y: 55 },
      { id: 2, title: 'He-Man Dual Controls', desc: 'Full instructor dual brake and clutch pedals for 100% safety during initial lessons.', x: 50, y: 48 },
      { id: 3, title: 'Reversing Camera', desc: 'Wide-angle rear view camera with active guideline grid for parallel parking.', x: 78, y: 52 }
    ]
  },
  kona: {
    id: 'kona',
    name: '2024 Hyundai Kona EV Ultimate (100% Automatic)',
    price: '£39 / Hour',
    badge: 'Zero Stalling Electric',
    img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop',
    fallbackImg: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop',
    specs: [
      { label: 'Transmission', val: '100% Automatic (Single Gear)' },
      { label: 'Stalling Risk', val: 'ZERO (Electric Motor)' },
      { label: 'Parking Aid', val: '360° HD Surround Cameras' },
      { label: 'Range', val: '310 Miles Electric Range' }
    ],
    hotspots: [
      { id: 1, title: 'Zero Stalling Electric', desc: 'No clutch, no gears! Focus 100% on road positioning and roundabouts around Chain Caul Way.', x: 30, y: 54 },
      { id: 2, title: '360° Surround View', desc: 'High-definition 4-camera overhead parking system makes bay parking effortlessly simple.', x: 52, y: 42 },
      { id: 3, title: 'Dual Electric Pedals', desc: 'Instructor dual braking system with instant regenerative stopping power.', x: 76, y: 58 }
    ]
  }
};

let currentVehicleId = 'yaris';

document.addEventListener('DOMContentLoaded', () => {
  initShowroom();
});

function getFleetData() {
  let customStr = null;
  let customSiteTextStr = null;
  try {
    customStr = localStorage.getItem('l2d_custom_hotspots') || localStorage.getItem('l2d_fleet_hotspots');
    customSiteTextStr = localStorage.getItem('l2d_custom_site_text');
  } catch(e) {}

  const merged = JSON.parse(JSON.stringify(DEFAULT_FLEET_DATA));

  // Merge custom site text (vehicle names, prices, badges)
  if (customSiteTextStr) {
    try {
      const siteText = JSON.parse(customSiteTextStr);
      if (siteText['fleet_yaris_name']) merged.yaris.name = siteText['fleet_yaris_name'];
      if (siteText['fleet_yaris_price']) merged.yaris.price = siteText['fleet_yaris_price'];
      if (siteText['fleet_yaris_badge']) merged.yaris.badge = siteText['fleet_yaris_badge'];

      if (siteText['fleet_kona_name']) merged.kona.name = siteText['fleet_kona_name'];
      if (siteText['fleet_kona_price']) merged.kona.price = siteText['fleet_kona_price'];
      if (siteText['fleet_kona_badge']) merged.kona.badge = siteText['fleet_kona_badge'];
    } catch(e) {}
  }

  // Merge custom hotspots & car properties (guaranteeing all 3 hotspots 1, 2, 3 exist for both Yaris & Kona)
  if (customStr) {
    try {
      const custom = JSON.parse(customStr);
      if (custom && typeof custom === 'object') {
        ['yaris', 'kona'].forEach(vehicleKey => {
          const customCar = custom[vehicleKey];
          const defaultCar = DEFAULT_FLEET_DATA[vehicleKey];
          if (!defaultCar) return;

          if (customCar && typeof customCar === 'object') {
            if (customCar.name) merged[vehicleKey].name = customCar.name;
            if (customCar.price) merged[vehicleKey].price = customCar.price;
            if (customCar.badge) merged[vehicleKey].badge = customCar.badge;

            // Merge hotspots array safely
            const customHsList = Array.isArray(customCar.hotspots) ? customCar.hotspots : (Array.isArray(customCar) ? customCar : []);
            const mergedHotspots = defaultCar.hotspots.map(defHs => {
              const matchedHs = customHsList.find(h => h.id === defHs.id);
              if (matchedHs) {
                return {
                  ...defHs,
                  ...matchedHs,
                  x: typeof matchedHs.x === 'number' ? matchedHs.x : defHs.x,
                  y: typeof matchedHs.y === 'number' ? matchedHs.y : defHs.y
                };
              }
              return JSON.parse(JSON.stringify(defHs));
            });
            merged[vehicleKey].hotspots = mergedHotspots;
          }
        });
      }
    } catch(e) {
      console.error('Error parsing custom fleet data from localStorage:', e);
    }
  }
  return merged;
}

window.addEventListener('storage', (e) => {
  if (e.key === 'l2d_custom_hotspots' || e.key === 'l2d_fleet_hotspots' || !e.key) {
    renderVehicle(currentVehicleId);
  }
});

window.refreshShowroomDisplay = () => {
  renderVehicle(currentVehicleId);
};

function initShowroom() {
  const container = document.getElementById('showroomDisplayBox');
  if (!container) return;

  const showYarisBtn = document.getElementById('showYarisBtn');
  const showKonaBtn = document.getElementById('showKonaBtn');

  if (showYarisBtn) {
    showYarisBtn.addEventListener('click', () => {
      renderVehicle('yaris');
    });
  }

  if (showKonaBtn) {
    showKonaBtn.addEventListener('click', () => {
      renderVehicle('kona');
    });
  }

  renderVehicle('yaris');
}

function renderVehicle(vehicleId) {
  currentVehicleId = vehicleId;
  const container = document.getElementById('showroomDisplayBox');
  if (!container) return;

  const fleet = getFleetData();
  const car = fleet[vehicleId] || fleet.yaris || DEFAULT_FLEET_DATA.yaris;

  const showYarisBtn = document.getElementById('showYarisBtn');
  const showKonaBtn = document.getElementById('showKonaBtn');

  if (showYarisBtn) showYarisBtn.className = vehicleId === 'yaris' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
  if (showKonaBtn) showKonaBtn.className = vehicleId === 'kona' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';

  const isEditMode = window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true');

  const hotspotsHtml = (car.hotspots || []).map(hs => `
    <button 
      type="button"
      class="car-hotspot ${isEditMode ? 'draggable' : ''}" 
      data-hotspot-id="${hs.id}"
      data-vehicle-id="${vehicleId}"
      style="left: ${hs.x}%; top: ${hs.y}%;"
      onclick="if (!this.classList.contains('was-dragged')) openHotspotTip(${hs.id}, '${vehicleId}')"
      aria-label="Hotspot #${hs.id}: ${hs.title}"
      title="Hotspot #${hs.id}: ${hs.title}">
      ${hs.id}
    </button>
  `).join('');

  const specsHtml = (car.specs || []).map((s, idx) => `
    <div style="background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.85rem;">
      <div style="font-size: 0.78rem; color: var(--text-light);" data-editable-key="fleet_${vehicleId}_spec_${idx}_label">${s.label}</div>
      <strong style="color: var(--text-main); font-size: 0.95rem;" data-editable-key="fleet_${vehicleId}_spec_${idx}_val">${s.val}</strong>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
      <div class="text-left">
        <span class="badge badge-primary mb-1" data-editable-key="fleet_${vehicleId}_badge">${car.badge}</span>
        <h3 style="margin: 0; color: var(--text-main); font-size: 1.6rem;" data-editable-key="fleet_${vehicleId}_name">${car.name}</h3>
      </div>
      <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--color-green);" data-editable-key="fleet_${vehicleId}_price">
        ${car.price}
      </div>
    </div>

    <!-- Interactive Car Hotspot Canvas -->
    <div class="showroom-car-view image-crop-target-wrapper">
      <img src="${car.img}" alt="${car.name}" data-image-key="fleet_${vehicleId}" onerror="this.src='${car.fallbackImg}'">
      ${hotspotsHtml}
    </div>

    <!-- Hotspot Explanation Card -->
    <div id="hotspotExplanationCard" style="background: var(--bg-body); border: 1px solid var(--color-green); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; text-align: left;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
        <span class="badge badge-primary" data-editable-key="fleet_${vehicleId}_hs_${car.hotspots?.[0]?.id || 1}_badge">Interactive Hotspot #${car.hotspots?.[0]?.id || 1}</span>
        <strong style="color: var(--text-main); font-size: 1.05rem;" data-editable-key="fleet_${vehicleId}_hs_${car.hotspots?.[0]?.id || 1}_title">${car.hotspots?.[0]?.title || 'Dual Controls'}</strong>
      </div>
      <p style="margin: 0; color: var(--text-main); font-size: 0.95rem;" data-editable-key="fleet_${vehicleId}_hs_${car.hotspots?.[0]?.id || 1}_desc">
        ${car.hotspots?.[0]?.desc || 'Full instructor dual controls for your safety.'}
      </p>
    </div>

    <!-- Vehicle Technical Specifications -->
    <div class="grid-4" style="text-align: left;">
      ${specsHtml}
    </div>
  `;

  attachHotspotDragEngine();
  if (typeof window.setupImageCropTriggers === 'function') {
    window.setupImageCropTriggers(isEditMode);
  }
  if (typeof window.hydrateSiteTextFromStorage === 'function') {
    window.hydrateSiteTextFromStorage();
  }
  if (typeof window.setupInlineTextEditing === 'function') {
    window.setupInlineTextEditing(isEditMode);
  }
}

window.openHotspotTip = function(hotspotId, vehicleId) {
  const fleet = getFleetData();
  const car = fleet[vehicleId] || fleet.yaris || DEFAULT_FLEET_DATA.yaris;
  const hs = (car.hotspots || []).find(h => h.id === hotspotId);
  if (!hs) return;

  const card = document.getElementById('hotspotExplanationCard');
  if (!card) return;

  const isEditMode = window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true') || (localStorage.getItem('l2d_is_admin') === 'true');

  card.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
      <span class="badge badge-primary" data-editable-key="fleet_${vehicleId}_hs_${hs.id}_badge">Interactive Hotspot #${hs.id}</span>
      <strong style="color: var(--text-main); font-size: 1.05rem;" data-editable-key="fleet_${vehicleId}_hs_${hs.id}_title">${hs.title}</strong>
    </div>
    <p style="margin: 0; color: var(--text-main); font-size: 0.95rem;" data-editable-key="fleet_${vehicleId}_hs_${hs.id}_desc">
      ${hs.desc}
    </p>
  `;

  if (typeof window.setupInlineTextEditing === 'function') {
    window.setupInlineTextEditing(isEditMode);
  }
};

/**
 * ==========================================================================
 * INTERACTIVE DRAG-AND-DROP HOTSPOT POSITIONING ENGINE
 * ==========================================================================
 */
function attachHotspotDragEngine() {
  const container = document.getElementById('showroomDisplayBox');
  if (!container) return;

  if (container.dataset.dragEngineAttached) return;
  container.dataset.dragEngineAttached = 'true';

  let activeHsEl = null;
  let activeVehicleId = null;
  let activeHotspotId = null;
  let isDragging = false;
  let dragTooltip = null;
  let startX = 0, startY = 0;
  let hasMoved = false;

  function onDragStart(e) {
    const isEditMode = window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true');
    if (!isEditMode) return;

    const pin = e.target.closest('.car-hotspot');
    if (!pin) return;

    activeHsEl = pin;
    activeVehicleId = pin.getAttribute('data-vehicle-id') || currentVehicleId;
    activeHotspotId = parseInt(pin.getAttribute('data-hotspot-id'), 10);

    isDragging = true;
    hasMoved = false;
    pin.classList.add('dragging');
    pin.classList.remove('was-dragged');

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;

    dragTooltip = pin.querySelector('.hotspot-drag-tooltip');
    if (!dragTooltip) {
      dragTooltip = document.createElement('div');
      dragTooltip.className = 'hotspot-drag-tooltip';
      pin.appendChild(dragTooltip);
    }
    const currentLeft = pin.style.left || '50%';
    const currentTop = pin.style.top || '50%';
    dragTooltip.textContent = `(X: ${currentLeft}, Y: ${currentTop})`;
    dragTooltip.style.display = 'block';

    document.addEventListener('mousemove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function onDragMove(e) {
    if (!isDragging || !activeHsEl) return;

    const view = activeHsEl.closest('.showroom-car-view');
    if (!view) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (Math.abs(clientX - startX) > 4 || Math.abs(clientY - startY) > 4) {
      hasMoved = true;
    }

    if (e.cancelable) e.preventDefault();

    const rect = view.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    const leftPercent = Math.max(0, Math.min(100, (relX / rect.width) * 100));
    const topPercent = Math.max(0, Math.min(100, (relY / rect.height) * 100));

    activeHsEl.style.left = `${leftPercent.toFixed(1)}%`;
    activeHsEl.style.top = `${topPercent.toFixed(1)}%`;

    if (dragTooltip) {
      dragTooltip.textContent = `(X: ${leftPercent.toFixed(1)}%, Y: ${topPercent.toFixed(1)}%)`;
    }
  }

  function onDragEnd(e) {
    if (!isDragging || !activeHsEl) return;

    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    activeHsEl.classList.remove('dragging');
    if (dragTooltip) {
      dragTooltip.style.display = 'none';
    }

    if (hasMoved) {
      activeHsEl.classList.add('was-dragged');
      setTimeout(() => {
        if (activeHsEl) activeHsEl.classList.remove('was-dragged');
      }, 300);

      const leftPercent = parseFloat(activeHsEl.style.left);
      const topPercent = parseFloat(activeHsEl.style.top);

      saveHotspotPosition(activeVehicleId, activeHotspotId, leftPercent, topPercent);
    }

    isDragging = false;
    activeHsEl = null;
  }

  container.addEventListener('mousedown', onDragStart);
  container.addEventListener('touchstart', onDragStart, { passive: false });
}

function saveHotspotPosition(vehicleId, hotspotId, xPercent, yPercent) {
  let fleet = getFleetData();

  if (fleet[vehicleId] && Array.isArray(fleet[vehicleId].hotspots)) {
    let hs = fleet[vehicleId].hotspots.find(h => h.id === hotspotId);
    if (hs) {
      hs.x = parseFloat(xPercent.toFixed(1));
      hs.y = parseFloat(yPercent.toFixed(1));
    }
  }

  const payload = JSON.stringify(fleet);
  try {
    localStorage.setItem('l2d_fleet_hotspots', payload);
    localStorage.setItem('l2d_custom_hotspots', payload);

    // Automatically sync updated vehicle hotspots & coordinates to Supabase fleet_hotspots table
    if (typeof window.syncHotspotsToSupabase === 'function') {
      window.syncHotspotsToSupabase(fleet);
    }
  } catch(e) {}

  // Sync inputs in Admin Site Settings tab if present
  const titleVehicle = vehicleId === 'yaris' ? 'Yaris' : 'Kona';
  const xInput = document.getElementById(`edit${titleVehicle}X${hotspotId}`);
  const yInput = document.getElementById(`edit${titleVehicle}Y${hotspotId}`);
  if (xInput) xInput.value = xPercent.toFixed(1);
  if (yInput) yInput.value = yPercent.toFixed(1);

  if (typeof window.showToast === 'function') {
    window.showToast(`Updated Hotspot #${hotspotId} (${vehicleId.toUpperCase()}) -> X: ${xPercent.toFixed(1)}%, Y: ${yPercent.toFixed(1)}% 🎯`);
  }
}

