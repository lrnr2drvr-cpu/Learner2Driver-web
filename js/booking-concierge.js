/**
 * ==========================================================================
 * LEARNER2DRIVER - MULTI-STEP BOOKING CONCIERGE SCRIPT (booking-concierge.js)
 * Step 1: Instructor (Farhan vs Binish) -> Step 2: Car -> Step 3: Package -> Step 4: Cal.com
 * ==========================================================================
 */

const bookingState = {
  instructor: 'Farhan Hussaini',
  vehicle: 'Manual (Toyota Yaris)',
  rate: 38,
  package: '10-Hour Block Course',
  hours: 10,
  discount: 0,
  isFlatPrice: true,
  flatPrice: 350,
  totalPrice: 350,
  step: 1
};

function getCustomVal(key, defaultVal) {
  try {
    const map = JSON.parse(localStorage.getItem('l2d_custom_site_text') || '{}');
    return map[key] || defaultVal;
  } catch(e) { return defaultVal; }
}

function updateTotalPrice() {
  if ((bookingState.hours === 10 || bookingState.hours === 20) && bookingState.isFlatPrice) {
    bookingState.totalPrice = bookingState.flatPrice;
  } else {
    const base = bookingState.rate * bookingState.hours;
    bookingState.totalPrice = Math.round(base - (base * (bookingState.discount || 0)));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initBookingConcierge();
});

function initBookingConcierge() {
  const container = document.getElementById('bookingConciergeBox');
  if (!container) return;
  renderConciergeStep(1);
}

function renderConciergeStep(stepNum) {
  bookingState.step = stepNum;
  const container = document.getElementById('bookingConciergeBox');
  if (!container) return;

  const rateManual = parseInt(getCustomVal('book_rate_manual', '38')) || 38;
  const rateAuto = parseInt(getCustomVal('book_rate_auto', '38')) || 38;
  const price10 = parseInt(getCustomVal('book_price_10_v2', '350')) || 350;
  const price20 = parseInt(getCustomVal('book_price_20', '680')) || 680;

  let html = `
    <!-- Step Bar -->
    <div class="concierge-step-bar">
      <div class="concierge-step ${stepNum >= 1 ? 'active' : ''}" onclick="renderConciergeStep(1)">1. Instructor</div>
      <div class="concierge-step ${stepNum >= 2 ? 'active' : ''}" onclick="renderConciergeStep(2)">2. Vehicle</div>
      <div class="concierge-step ${stepNum >= 3 ? 'active' : ''}" onclick="renderConciergeStep(3)">3. Package</div>
      <div class="concierge-step ${stepNum >= 4 ? 'active' : ''}" onclick="renderConciergeStep(4)">4. Select Slot</div>
    </div>
  `;

  if (stepNum === 1) {
    html += `
      <h3 class="mb-1" data-editable-key="book_step1_title">Step 1: Choose Your Driving Instructor</h3>
      <p class="mb-3" data-editable-key="book_step1_sub">Select between our experienced male and female DVSA-approved driving instructors in Preston.</p>

      <div class="concierge-options-grid">
        <div class="concierge-option-card ${bookingState.instructor === 'Farhan' ? 'selected' : ''}" onclick="selectInstructor(event, 'Farhan')">
          <span class="badge badge-primary mb-1" data-editable-key="book_opt_farhan_badge">Lead Instructor (Male)</span>
          <h3 style="margin: 0; font-size: 1.25rem;" data-editable-key="book_opt_farhan_name">Farhan</h3>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;" data-editable-key="book_opt_farhan_desc">Specialist in Preston DVSA test routes, nervous learners, and mock practical test assessments.</p>
        </div>
        <div class="concierge-option-card ${bookingState.instructor === 'Binish' ? 'selected' : ''}" onclick="selectInstructor(event, 'Binish')">
          <span class="badge badge-warning mb-1" data-editable-key="book_opt_binish_badge">Female Instructor</span>
          <h3 style="margin: 0; font-size: 1.25rem;" data-editable-key="book_opt_binish_name">Binish</h3>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;" data-editable-key="book_opt_binish_desc">Patient, encouraging female instructor specialising in confidence building and smooth car control.</p>
        </div>
      </div>
    `;
  } else if (stepNum === 2) {
    html += `
      <h3 class="mb-1" data-editable-key="book_step2_title">Step 2: Choose Your Training Vehicle</h3>
      <p class="mb-3">Selected Instructor: <strong style="color: var(--color-green);">${bookingState.instructor}</strong>. Now pick your transmission.</p>

      <div class="concierge-options-grid">
        <div class="concierge-option-card ${bookingState.rate === rateManual ? 'selected' : ''}" onclick="selectVehicle(event, 'Manual (2019 Toyota Yaris)', ${rateManual})">
          <span class="badge badge-accent mb-1" data-editable-key="book_opt_yaris_badge">Manual Transmission</span>
          <h3 style="margin: 0; font-size: 1.25rem;" data-editable-key="book_opt_yaris_name">2019 Toyota Yaris Manual</h3>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;" data-editable-key="book_opt_yaris_desc">6-Speed manual gearbox with intuitive biting point, light clutch, and exceptional hatchback visibility.</p>
          <p style="margin: 0.5rem 0 0; font-weight: 700; color: var(--color-green);">£<span data-editable-key="book_rate_manual">${rateManual}</span>/hr</p>
        </div>
        <div class="concierge-option-card ${bookingState.rate === rateAuto ? 'selected' : ''}" onclick="selectVehicle(event, 'Auto (2024 Kona EV Ultimate)', ${rateAuto})">
          <span class="badge badge-primary mb-1" data-editable-key="book_opt_kona_badge">100% Electric Automatic</span>
          <h3 style="margin: 0; font-size: 1.25rem;" data-editable-key="book_opt_kona_name">2024 Hyundai Kona EV Ultimate</h3>
          <p style="margin: 0.5rem 0 0; font-size: 0.9rem;" data-editable-key="book_opt_kona_desc">Zero stalls, silent electric acceleration, dual panoramic displays, and surround view cameras.</p>
          <p style="margin: 0.5rem 0 0; font-weight: 700; color: var(--color-green);">£<span data-editable-key="book_rate_auto">${rateAuto}</span>/hr</p>
        </div>
      </div>
      <div class="text-left mt-2">
        <button class="btn btn-secondary btn-sm" onclick="renderConciergeStep(1)">← Back to Instructors</button>
      </div>
    `;
  } else if (stepNum === 3) {
    html += `
      <h3 class="mb-1" data-editable-key="book_step3_title">Step 3: Select Lesson Package & Discounts</h3>
      <p class="mb-3">Instructor: <strong>${bookingState.instructor}</strong> | Vehicle: <strong>${bookingState.vehicle}</strong></p>

      <div class="concierge-options-grid">
        <div class="concierge-option-card ${bookingState.hours === 1 ? 'selected' : ''}" onclick="selectPackage(event, 'Pay As You Go (1 Hour)', 1, 0, false, null)">
          <span class="badge badge-secondary mb-1" data-editable-key="book_pkg1_badge">Standard Rate</span>
          <h3 style="margin: 0; font-size: 1.15rem;" data-editable-key="book_pkg1_name">Pay As You Go (1 Hr)</h3>
          <p style="margin: 0.4rem 0 0; font-size: 0.88rem; font-weight: 700; color: var(--color-green);">£${bookingState.rate}/hr</p>
        </div>
        <div class="concierge-option-card highlight-savings ${bookingState.hours === 10 ? 'selected' : ''}" onclick="selectPackage(event, getCustomVal('book_pkg2_name', '10-Hour Block Course'), 10, 0, true, ${price10})">
          <div class="savings-tag-pill" data-editable-key="book_pkg2_discount_pill">⚡ Save ~10% OFF</div>
          <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.35rem;">
            <span class="badge badge-primary mb-1" data-editable-key="book_pkg2_badge">Most Popular ⭐ Block Package</span>
            <span class="discount-highlight-badge mb-1" data-editable-key="book_pkg2_save_highlight">SAVE 10% (£30 OFF)</span>
          </div>
          <h3 style="margin: 0; font-size: 1.15rem;" data-editable-key="book_pkg2_name">10-Hour Block Course</h3>
          <p style="margin: 0.4rem 0 0; font-size: 0.88rem; font-weight: 700; color: var(--color-green);">
            £<span data-editable-key="book_price_10_v2">${price10}</span> 
            <span style="color: #94A3B8; text-decoration: line-through; margin-left: 0.35rem; font-weight: 500;" data-editable-key="book_pkg2_was">(was £${bookingState.rate * 10})</span>
            <span style="color: #FFB74D; font-size: 0.82rem; margin-left: 0.35rem; font-weight: 700;" data-editable-key="book_pkg2_save_label">(Save £30!)</span>
          </p>
        </div>
        <div class="concierge-option-card highlight-savings ${bookingState.hours === 20 ? 'selected' : ''}" onclick="selectPackage(event, getCustomVal('book_pkg3_name', '20-Hour Intensive Pass'), 20, 0, true, ${price20})">
          <div class="savings-tag-pill" data-editable-key="book_pkg3_discount_pill">⚡ Save ~12% OFF</div>
          <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.35rem;">
            <span class="badge badge-warning mb-1" data-editable-key="book_pkg3_badge_v2">Best Value • Block Package</span>
            <span class="discount-highlight-badge mb-1" data-editable-key="book_pkg3_save_highlight">SAVE 12% (£80 OFF)</span>
          </div>
          <h3 style="margin: 0; font-size: 1.15rem;" data-editable-key="book_pkg3_name">20-Hour Intensive Pass</h3>
          <p style="margin: 0.4rem 0 0; font-size: 0.88rem; font-weight: 700; color: var(--color-green);">
            £<span data-editable-key="book_price_20">${price20}</span> 
            <span style="color: #94A3B8; text-decoration: line-through; margin-left: 0.35rem; font-weight: 500;" data-editable-key="book_pkg3_was">(was £${bookingState.rate * 20})</span>
            <span style="color: #FFB74D; font-size: 0.82rem; margin-left: 0.35rem; font-weight: 700;" data-editable-key="book_pkg3_save_label">(Save £80!)</span>
          </p>
        </div>
        <div class="concierge-option-card ${bookingState.hours === 2 ? 'selected' : ''}" onclick="selectPackage(event, 'Mock Practical Test Assessment (2 Hours)', 2, 0, false, null)">
          <span class="badge badge-accent mb-1" data-editable-key="book_pkg4_badge">DVSA Assessment</span>
          <h3 style="margin: 0; font-size: 1.15rem;" data-editable-key="book_pkg4_name">2-Hour Mock Driving Test</h3>
          <p style="margin: 0.4rem 0 0; font-size: 0.88rem; font-weight: 700; color: var(--color-green);">£${bookingState.rate * 2}</p>
        </div>
      </div>
      <div class="text-left mt-2">
        <button class="btn btn-secondary btn-sm" onclick="renderConciergeStep(2)">← Back to Vehicle</button>
      </div>
    `;
  } else if (stepNum === 4) {
    updateTotalPrice();
    html += `
      <div style="background: var(--bg-body); border: 1px solid var(--color-green); border-radius: var(--radius-lg); padding: 1.75rem; margin-bottom: 2rem; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <span class="badge badge-primary mb-1" data-editable-key="book_step4_badge">Summary Approved</span>
            <h3 style="margin: 0;" data-editable-key="book_step4_title">Your Tailored Lesson Package</h3>
          </div>
          <div style="font-size: 2rem; font-weight: 800; color: var(--color-green);">
            £${bookingState.totalPrice}
          </div>
        </div>
        <div class="grid-3" style="border-top: 1px solid var(--border-color); padding-top: 1rem; font-size: 0.92rem;">
          <div><strong>Instructor:</strong> ${bookingState.instructor}</div>
          <div><strong>Vehicle:</strong> ${bookingState.vehicle}</div>
          <div><strong>Package:</strong> ${bookingState.package}</div>
        </div>
      </div>

      <div class="text-center mb-3">
        <button class="btn btn-primary" onclick="showCalIframe()">
          Select Date & Time on Calendar 📅
        </button>
        <a href="tel:07427330827" class="btn btn-secondary ml-1">
          Call / WhatsApp 074-2733-0827 📞
        </a>
      </div>

      <!-- Optional Cal.com Reveal Box -->
      <div id="calIframeRevealBox" style="display: none; margin-top: 1.5rem;">
        <iframe src="https://cal.com/learner2driver" style="border: none; width: 100%; height: 680px; border-radius: var(--radius-lg);" title="Learner2Driver Cal.com Calendar"></iframe>
      </div>

      <div class="text-left mt-2">
        <button class="btn btn-secondary btn-sm" onclick="renderConciergeStep(3)">← Back to Packages</button>
      </div>
    `;
  }

  container.innerHTML = html;

  const isEditMode = window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true') || (localStorage.getItem('l2d_is_admin') === 'true');
  if (typeof window.setupInlineTextEditing === 'function') {
    window.setupInlineTextEditing(isEditMode);
  }
}

window.selectInstructor = function(event, name) {
  if (event && event.target && event.target.hasAttribute('contenteditable')) return;
  bookingState.instructor = name;
  renderConciergeStep(2);
};

window.selectVehicle = function(event, vehicleName, rate) {
  if (event && event.target && event.target.hasAttribute('contenteditable')) return;
  bookingState.vehicle = vehicleName;
  bookingState.rate = rate;
  updateTotalPrice();
  renderConciergeStep(3);
};

window.selectPackage = function(event, pkgName, hours, discount, isFlatPrice = false, flatPrice = null) {
  if (event && event.target && event.target.hasAttribute('contenteditable')) return;
  bookingState.package = pkgName;
  bookingState.hours = hours;
  bookingState.discount = discount;
  bookingState.isFlatPrice = isFlatPrice;
  bookingState.flatPrice = flatPrice;
  updateTotalPrice();
  renderConciergeStep(4);
};

window.showCalIframe = function() {
  const box = document.getElementById('calIframeRevealBox');
  if (box) {
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth' });
  }
};
