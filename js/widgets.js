/**
 * ==========================================================================
 * LEARNER2DRIVER - WIDGETS SCRIPT (widgets.js)
 * Leaflet.js OpenStreetMap with Geolocated Circular Pins & Quiz Score Math
 * ==========================================================================
 */

const DEFAULT_PRESTON_ROUTE_TIPS = {
  1: {
    title: '1. DVSA Test Centre (Chain Caul Way, PR2 2ZN)',
    location: 'Preston DVSA Hub Roundabout',
    tip: 'When exiting the DVSA test centre onto Chain Caul Way, watch out for the two-lane approach. Always check your right blind spot for fast-moving delivery vans before entering the roundabout.',
    lat: 53.7632,
    lng: -2.7481
  },
  2: {
    title: '2. Docks Swing Bridge & Port Way',
    location: 'Preston Riversway Docks',
    tip: 'The speed limit drops rapidly here and the bridge surface can be slippery when wet. Keep a 3-second following distance and be prepared for sudden traffic stops if the bridge signals activate.',
    lat: 53.7589,
    lng: -2.7295
  },
  3: {
    title: '3. Riversway Multi-Lane Junctions (A583)',
    location: 'Watery Lane / Riversway Corridor',
    tip: 'Lane discipline is critical! Examiners frequently test your ability to read gantry signs and select the correct lane early without straddling white lines.',
    lat: 53.7610,
    lng: -2.7350
  },
  4: {
    title: '4. Penwortham Hill Start & Guild Way',
    location: 'A59 / Penwortham Bridge',
    tip: 'A favourite spot for examiners to test hill starts in manual cars! Ensure you set your handbrake securely, find a strong biting point, and check all 6 mirrors before releasing.',
    lat: 53.7525,
    lng: -2.7140
  }
};

function getPrestonRouteTips() {
  try {
    const stored = localStorage.getItem('l2d_custom_routes');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        const merged = { ...DEFAULT_PRESTON_ROUTE_TIPS };
        [1, 2, 3, 4].forEach(spotId => {
          const item = parsed[spotId] || parsed[String(spotId)];
          if (item && typeof item === 'object') {
            merged[spotId] = {
              ...DEFAULT_PRESTON_ROUTE_TIPS[spotId],
              ...item,
              title: item.title || DEFAULT_PRESTON_ROUTE_TIPS[spotId].title,
              location: item.location || DEFAULT_PRESTON_ROUTE_TIPS[spotId].location,
              tip: item.tip || DEFAULT_PRESTON_ROUTE_TIPS[spotId].tip,
              lat: typeof item.lat === 'number' ? item.lat : DEFAULT_PRESTON_ROUTE_TIPS[spotId].lat,
              lng: typeof item.lng === 'number' ? item.lng : DEFAULT_PRESTON_ROUTE_TIPS[spotId].lng
            };
          }
        });
        return merged;
      }
    }
  } catch(e) {}
  return { ...DEFAULT_PRESTON_ROUTE_TIPS };
}

function savePrestonRouteTips(tipsData) {
  try {
    localStorage.setItem('l2d_custom_routes', JSON.stringify(tipsData));
    window.dispatchEvent(new Event('storage'));

    // Automatically sync every spot (1, 2, 3, 4) to Supabase PostgreSQL preston_routes table
    if (typeof window.syncRouteToSupabase === 'function' && tipsData) {
      Object.keys(tipsData).forEach(spotId => {
        window.syncRouteToSupabase(spotId, tipsData[spotId]);
      });
    }
  } catch(e) {}
}

const PRESTON_ROUTE_TIPS = getPrestonRouteTips();

let prestonLeafletMap = null;
let leafletMarkers = {};

document.addEventListener('DOMContentLoaded', () => {
  initReadinessQuiz();
  initPrestonLeafletMap();
});

function initReadinessQuiz() {
  const hoursSlider = document.getElementById('sliderHours');
  const theorySelect = document.getElementById('selectTheory');
  const maneuversSlider = document.getElementById('sliderManeuvers');
  const roundaboutsSlider = document.getElementById('sliderRoundabouts');

  if (!hoursSlider || !theorySelect || !maneuversSlider || !roundaboutsSlider) return;

  const updateMath = () => {
    const hrs = parseInt(hoursSlider.value, 10);
    const theoryBonus = parseInt(theorySelect.value, 10);
    const man = parseInt(maneuversSlider.value, 10);
    const rnd = parseInt(roundaboutsSlider.value, 10);

    const valHours = document.getElementById('valHours');
    const valTheory = document.getElementById('valTheory');
    const valManeuvers = document.getElementById('valManeuvers');
    const valRoundabouts = document.getElementById('valRoundabouts');

    if (valHours) valHours.textContent = `${hrs} hrs`;
    if (valTheory) valTheory.textContent = theorySelect.options[theorySelect.selectedIndex].text.split(' ')[0];
    if (valManeuvers) valManeuvers.textContent = `${man} / 5`;
    if (valRoundabouts) valRoundabouts.textContent = `${rnd} / 5`;

    const hrsScore = Math.min((hrs / 45) * 45, 45);
    const manScore = (man / 5) * 20;
    const rndScore = (rnd / 5) * 20;

    const total = Math.min(Math.round(hrsScore + theoryBonus + manScore + rndScore), 98);

    const scoreDisplay = document.getElementById('quizScoreDisplay');
    const scoreMsg = document.getElementById('quizScoreMessage');

    if (scoreDisplay) scoreDisplay.textContent = `${total}%`;

    if (scoreMsg) {
      let customText = null;
      try {
        const rawMap = localStorage.getItem('l2d_custom_site_text');
        if (rawMap) {
          const map = JSON.parse(rawMap);
          if (total >= 85 && map['quiz_msg_high']) customText = map['quiz_msg_high'];
          else if (total >= 60 && map['quiz_msg_mid']) customText = map['quiz_msg_mid'];
          else if (total < 60 && map['quiz_msg_low']) customText = map['quiz_msg_low'];
          else if (map['quiz_result_message']) customText = map['quiz_result_message'];
        }
      } catch(e) {}

      if (customText) {
        scoreMsg.innerHTML = customText;
      } else {
        if (total >= 85) {
          scoreMsg.innerHTML = `✨ <strong style="color:var(--color-green);">Outstanding (${total}%)!</strong> You are ready for a mock test with Farhan or Binish!`;
          scoreMsg.style.color = 'var(--color-green)';
        } else if (total >= 60) {
          scoreMsg.innerHTML = `🚗 <strong>Good Progress (${total}%)!</strong> A few more hours with our instructors will get you test-ready.`;
          scoreMsg.style.color = 'var(--text-main)';
        } else {
          scoreMsg.innerHTML = `💡 <strong>Just Getting Started (${total}%)!</strong> Book our 10-Hour Block course to build rapid road confidence.`;
          scoreMsg.style.color = 'var(--text-main)';
        }
      }
    }
  };

  hoursSlider.addEventListener('input', updateMath);
  theorySelect.addEventListener('change', updateMath);
  maneuversSlider.addEventListener('input', updateMath);
  roundaboutsSlider.addEventListener('input', updateMath);

  updateMath();
}

function initPrestonLeafletMap() {
  if (prestonLeafletMap !== null) return;
  const mapEl = document.getElementById('prestonLeafletMap');
  if (!mapEl || typeof L === 'undefined') {
    // Fallback UI card if Leaflet library is undefined or blocked
    if (mapEl) {
      mapEl.innerHTML = `
        <div class="glass-card" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; background: var(--bg-surface); border: 2px dashed var(--border-color); border-radius: var(--radius-md);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🗺️</div>
          <h3 style="margin: 0 0 0.5rem 0; color: var(--text-main); font-size: 1.25rem;">Interactive Preston Map Offline</h3>
          <p style="font-size: 0.9rem; color: var(--text-light); max-width: 420px; margin-bottom: 1.25rem; line-height: 1.5;">
            Leaflet map library could not be loaded. You can still inspect all Preston test route danger spots and Farhan's insider tips using the buttons above!
          </p>
          <a href="https://www.google.com/maps/search/Preston+DVSA+Test+Centre+PR2+2ZN" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            Open Preston DVSA on Google Maps ↗
          </a>
        </div>
      `;
    }
    showRouteTip(1, true);
    return;
  }

  const tips = getPrestonRouteTips();

  try {
    prestonLeafletMap = L.map('prestonLeafletMap', {
      center: [53.7632, -2.7481],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> • Preston PR2 2ZN'
    }).addTo(prestonLeafletMap);

    window.addEventListener('resize', () => {
      if (prestonLeafletMap) {
        prestonLeafletMap.invalidateSize();
      }
    });

    // Place custom geolocated circular marker pins
    Object.keys(tips).forEach(id => {
      const num = parseInt(id, 10);
      const data = tips[num];

      const pinIcon = L.divIcon({
        className: 'custom-leaflet-icon-wrapper',
        html: `<div id="mapPinCircle${num}" class="leaflet-custom-circle-pin">${num}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([data.lat, data.lng], { icon: pinIcon }).addTo(prestonLeafletMap);
      marker.on('click', () => {
        showRouteTip(num);
      });
      leafletMarkers[num] = marker;
    });

    const mapEl = document.getElementById('prestonLeafletMap');
    if (mapEl) {
      mapEl.classList.remove('reveal', 'reveal-scale', 'reveal-left', 'reveal-right');
    }

    showRouteTip(1, true);

    setTimeout(() => {
      if (prestonLeafletMap) prestonLeafletMap.invalidateSize();
    }, 250);
  } catch(e) {
    showRouteTip(1, true);
  }
}

window.showRouteTip = function(spotId, skipFlyTo = false) {
  window.currentSpotId = spotId;
  const tips = getPrestonRouteTips();
  const tipData = tips[spotId];
  if (!tipData) return;

  const container = document.getElementById('routeTipBox');
  if (!container) return;

  // Update Danger Spot button active states
  [1, 2, 3, 4].forEach(num => {
    const btn = document.getElementById(`spotBtn${num}`);
    if (btn) {
      btn.className = num === spotId ? 'danger-spot-btn active' : 'danger-spot-btn';
    }
    const pinCircle = document.getElementById(`mapPinCircle${num}`);
    if (pinCircle) {
      pinCircle.className = num === spotId ? 'leaflet-custom-circle-pin active' : 'leaflet-custom-circle-pin';
    }
  });

  // Pan / Fly to exact geolocation on Leaflet map
  if (!skipFlyTo && prestonLeafletMap && typeof prestonLeafletMap.flyTo === 'function') {
    try {
      prestonLeafletMap.flyTo([tipData.lat, tipData.lng], 16, {
        animate: true,
        duration: 1.2
      });
    } catch(err) {}
  }

  const isAdminEdit = window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true') || (localStorage.getItem('l2d_is_admin') === 'true');

  let adminBarHtml = '';
  if (isAdminEdit) {
    adminBarHtml = `
      <div class="admin-spot-editor-bar mt-2 pt-2 border-top" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 0.85rem;">
        <span class="badge badge-secondary coords-pill">📍 Coords: ${tipData.lat.toFixed(6)}, ${tipData.lng.toFixed(6)}</span>
        <button class="btn btn-secondary btn-sm admin-pick-location-btn" onclick="openMapPickerModal(${spotId})">
          📍 Pick Location on Map
        </button>
      </div>
    `;
  }

  let cleanTip = (tipData.tip || '').replace(/^<strong>\s*Farhan & Binish's Advice:\s*<\/strong>\s*"?/i, '').replace(/^Farhan & Binish's Advice:\s*"?/i, '').replace(/"$/, '').trim();

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.85rem;">
      <div>
        <span class="badge badge-primary mb-1" data-editable-key="route_spot_${spotId}_badge">Preston Danger Spot Tip #${spotId}</span>
        <h3 style="margin: 0; color: var(--text-main); font-size: 1.3rem;" data-editable-key="route_spot_${spotId}_title">${tipData.title}</h3>
      </div>
      <span class="badge badge-warning" data-editable-key="route_spot_${spotId}_location">${tipData.location}</span>
    </div>
    <p style="color: var(--text-main); font-size: 1rem; line-height: 1.7; margin-bottom: 1.5rem;">
      <strong data-editable-key="route_spot_${spotId}_label">Farhan & Binish's Advice:</strong> "<span data-editable-key="route_spot_${spotId}_tip">${cleanTip}</span>"
    </p>
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: var(--bg-body); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
      <div>
        <strong style="color: var(--text-main); font-size: 0.9rem;" data-editable-key="route_spot_${spotId}_practice_title">Practising this route?</strong>
        <div style="font-size: 0.82rem; color: var(--text-light);" data-editable-key="route_spot_${spotId}_practice_desc">Ask your instructor to drive through ${tipData.location} on your next lesson.</div>
      </div>
      <a href="#book" class="btn btn-primary btn-sm" data-editable-key="route_spot_${spotId}_button">Book Route Practice →</a>
    </div>
    ${adminBarHtml}
  `;

  if (typeof window.setupInlineTextEditing === 'function') {
    window.setupInlineTextEditing(isAdminEdit);
  }
};

/**
 * Leaflet Location Picker Modal Controller
 */
let activePickerSpotId = null;
let modalPickerMap = null;
let modalPickerMarker = null;
let currentTempCoords = { lat: 0, lng: 0 };

window.openMapPickerModal = function(spotId) {
  activePickerSpotId = parseInt(spotId, 10);
  const tips = getPrestonRouteTips();
  const tipData = tips[activePickerSpotId];
  if (!tipData) return;

  currentTempCoords = { lat: tipData.lat, lng: tipData.lng };

  const modal = document.getElementById('mapPickerModalBackdrop');
  const titleEl = document.getElementById('mapPickerModalTitle');
  const latDisp = document.getElementById('mapPickerLatDisplay');
  const lngDisp = document.getElementById('mapPickerLngDisplay');

  if (titleEl) titleEl.textContent = `Set Location Coordinates: Spot #${activePickerSpotId}`;
  if (latDisp) latDisp.textContent = `Lat: ${currentTempCoords.lat.toFixed(6)}`;
  if (lngDisp) lngDisp.textContent = `Lng: ${currentTempCoords.lng.toFixed(6)}`;

  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  const mapContainer = document.getElementById('modalPickerLeafletMap');
  if (!mapContainer || typeof L === 'undefined') return;

  if (modalPickerMap) {
    try {
      modalPickerMap.remove();
    } catch(e) {}
    modalPickerMap = null;
  }

  modalPickerMap = L.map('modalPickerLeafletMap', {
    center: [currentTempCoords.lat, currentTempCoords.lng],
    zoom: 15,
    zoomControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(modalPickerMap);

  modalPickerMarker = L.marker([currentTempCoords.lat, currentTempCoords.lng], {
    draggable: true
  }).addTo(modalPickerMap);

  const updateFromLatLng = (lat, lng) => {
    currentTempCoords.lat = parseFloat(lat.toFixed(6));
    currentTempCoords.lng = parseFloat(lng.toFixed(6));
    if (latDisp) latDisp.textContent = `Lat: ${currentTempCoords.lat.toFixed(6)}`;
    if (lngDisp) lngDisp.textContent = `Lng: ${currentTempCoords.lng.toFixed(6)}`;
  };

  modalPickerMarker.on('drag', (e) => {
    const pos = e.target.getLatLng();
    updateFromLatLng(pos.lat, pos.lng);
  });

  modalPickerMarker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    updateFromLatLng(pos.lat, pos.lng);
  });

  modalPickerMap.on('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    if (modalPickerMarker) {
      modalPickerMarker.setLatLng([lat, lng]);
    }
    updateFromLatLng(lat, lng);
  });

  const triggerInvalidate = () => {
    if (modalPickerMap) {
      modalPickerMap.invalidateSize();
    }
  };
  triggerInvalidate();
  setTimeout(triggerInvalidate, 100);
  setTimeout(triggerInvalidate, 350);
};

window.closeMapPickerModal = function() {
  const modal = document.getElementById('mapPickerModalBackdrop');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
};

window.confirmMapPickerSave = function() {
  if (!activePickerSpotId) return;
  const tips = getPrestonRouteTips();
  if (!tips[activePickerSpotId]) return;

  tips[activePickerSpotId].lat = currentTempCoords.lat;
  tips[activePickerSpotId].lng = currentTempCoords.lng;

  savePrestonRouteTips(tips);
  syncMainMapAndCard(activePickerSpotId);
  closeMapPickerModal();

  if (typeof showToast === 'function') {
    showToast(`Updated Danger Spot #${activePickerSpotId} Location! 📍`);
  }
};

window.syncMainMapAndCard = function(spotId) {
  const tips = getPrestonRouteTips();
  const tipData = tips[spotId];
  if (!tipData) return;

  if (leafletMarkers[spotId]) {
    leafletMarkers[spotId].setLatLng([tipData.lat, tipData.lng]);
  }

  showRouteTip(spotId, false);
};

window.getPrestonRouteTips = getPrestonRouteTips;
window.savePrestonRouteTips = savePrestonRouteTips;
