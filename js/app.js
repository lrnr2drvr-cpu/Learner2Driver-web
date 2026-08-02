/**
 * ==========================================================================
 * LEARNER2DRIVER - MAIN APPLICATION SCRIPT (app.js)
 * Mobile Nav, Dark/Light Mode, Stats Counter, Smooth 3D Tilt FX
 * ==========================================================================
 */

window.L2D_EDIT_MODE = false;

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileBottomNav();
  initStatsCounters();
  init3DCardTilt();
  initSmoothScroll();
  initScrollRevealEngine();
  applyCustomSiteContent();
  hydrateSiteTextFromStorage();
  initAdminTopBar();
  setupEditableEventListeners();
  initHubSpotCrm();
});

window.initHubSpotCrm = function() {
  const portalId = (window.L2D_CONFIG && typeof window.L2D_CONFIG.getHubSpotPortalId === 'function')
    ? window.L2D_CONFIG.getHubSpotPortalId()
    : (localStorage.getItem('l2d_hubspot_portal_id') || '');

  if (!portalId || document.getElementById('hs-script-loader')) return;

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.id = 'hs-script-loader';
  script.async = true;
  script.defer = true;
  script.src = `//js.hs-scripts.com/${portalId}.js`;
  document.head.appendChild(script);
};

/**
 * Native IntersectionObserver Scroll Reveal Engine
 */
function initScrollRevealEngine() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (!elements || elements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -30px 0px'
  });

  elements.forEach(el => observer.observe(el));
}
window.initScrollRevealEngine = initScrollRevealEngine;

/**
 * 1. Dark / Light Mode Toggle with LocalStorage Persistence
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('l2d_theme') || 'light';
  } catch (e) {}
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode');
    updateToggleIcon(toggleBtn, 'dark');
  } else {
    updateToggleIcon(toggleBtn, 'light');
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    const newTheme = isDark ? 'dark' : 'light';
    try {
      localStorage.setItem('l2d_theme', newTheme);
    } catch (e) {}
    updateToggleIcon(toggleBtn, newTheme);
    showToast(`Switched to ${isDark ? 'Slate Graphite Dark' : 'Clean Light'} Mode`);
  });
}

function updateToggleIcon(btn, theme) {
  if (theme === 'light') {
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    btn.setAttribute('title', 'Switch to Slate Graphite Dark Mode');
  } else {
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    btn.setAttribute('title', 'Switch to Clean Light Mode');
  }
}

/**
 * 2. Mobile & Desktop Active ScrollSpy Navigation Highlighting Engine
 */
function initMobileBottomNav() {
  const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
  const desktopNavItems = document.querySelectorAll('.nav-links-desktop a');
  const targetSections = Array.from(document.querySelectorAll('section[id], header[id]')).filter(el => !!el.id);

  function updateActiveNav(activeId) {
    if (!activeId) return;

    mobileNavItems.forEach(item => {
      const href = item.getAttribute('href') || '';
      if (href === `#${activeId}` || (activeId === 'hero' && (href === '#hero' || href === 'index.html'))) {
        item.classList.add('active');
      } else if (!href.includes('course.html')) {
        item.classList.remove('active');
      }
    });

    desktopNavItems.forEach(item => {
      const href = item.getAttribute('href') || '';
      if (href === `#${activeId}` || (activeId === 'hero' && href === '#hero')) {
        item.classList.add('active');
      } else if (!href.includes('course.html')) {
        item.classList.remove('active');
      }
    });
  }

  if (targetSections.length > 0 && typeof IntersectionObserver !== 'undefined') {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id) {
          updateActiveNav(entry.target.id);
        }
      });
    }, observerOptions);

    targetSections.forEach(sec => observer.observe(sec));
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY < 120) {
      updateActiveNav('hero');
    } else if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 100)) {
      updateActiveNav('book');
    }
  }, { passive: true });
}

/**
 * 3. Animated Stats Counters (90% Pass Rate, 100+ Students, etc.)
 */
function initStatsCounters() {
  const counters = document.querySelectorAll('.stat-counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
  const target = parseFloat(el.getAttribute('data-target'));
  if (isNaN(target)) return;
  const prefix = el.getAttribute('data-prefix') || '';
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1800;
  const start = performance.now();

  function update(time) {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = (easeOut * target).toFixed(target % 1 === 0 ? 0 : 1);
    el.textContent = `${prefix}${current}${suffix}`;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * 4. 3D Card Tilt FX for Desktop Glassmorphism
 */
function init3DCardTilt() {
  if (window.innerWidth < 992) return; // Disable on touch screens
  const cards = document.querySelectorAll('.tilt-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

/**
 * 5. Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      try {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {}
    });
  });
}

/**
 * 6. Global Toast Notification Helper
 */
window.showToast = function(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>⚡</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

/**
 * 7. Site Content Consumer (Hero Badge, Heading, Text, Contact Phone & Location)
 */
window.applyCustomSiteContent = function() {
  try {
    let content = {};
    const savedContent = localStorage.getItem('l2d_site_content');
    if (savedContent) {
      try { content = JSON.parse(savedContent) || {}; } catch(e) {}
    }
    let customText = {};
    const savedText = localStorage.getItem('l2d_custom_site_text');
    if (savedText) {
      try { customText = JSON.parse(savedText) || {}; } catch(e) {}
    }

    const heroBadge = content.heroBadge || customText.hero_badge;
    const heroHeading = content.heroHeading || customText.hero_heading;
    const heroText = content.heroText || customText.hero_text;
    const contactPhone = content.contactPhone || customText.footer_contact_phone;
    const contactLocation = content.contactLocation || customText.footer_contact_location;

    if (heroBadge) {
      const el = document.getElementById('siteHeroBadge') || document.querySelector('#hero .badge');
      if (el) el.textContent = heroBadge;
    }
    if (heroHeading) {
      const el = document.getElementById('siteHeroHeading') || document.querySelector('#hero h1');
      if (el) el.innerHTML = heroHeading;
    }
    if (heroText) {
      const el = document.getElementById('siteHeroText') || document.querySelector('#hero p');
      if (el) el.innerHTML = heroText;
    }
    if (contactPhone) {
      const cleanPhone = contactPhone.replace(/\s+/g, '');
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.href = `tel:${cleanPhone}`;
        const span = a.querySelector('span');
        if (span) {
          span.textContent = contactPhone;
        } else if (!a.innerHTML.includes('<svg') && !a.innerHTML.includes('WhatsApp')) {
          a.textContent = contactPhone;
        }
      });
      document.querySelectorAll('.site-contact-phone').forEach(el => {
        el.textContent = contactPhone;
      });
    }
    if (contactLocation) {
      const cleanLoc = contactLocation.replace(/^📍\s*/, '');
      const el = document.getElementById('siteContactLocation');
      if (el) el.textContent = `📍 ${cleanLoc}`;
      document.querySelectorAll('.site-contact-location').forEach(el => {
        el.textContent = `📍 ${cleanLoc}`;
      });
    }
  } catch(e) {
    console.error('Error applying custom site content:', e);
  }
};

window.addEventListener('storage', (e) => {
  if (!e.key || e.key === 'l2d_site_content' || e.key === 'l2d_custom_site_text') {
    if (typeof window.applyCustomSiteContent === 'function') {
      window.applyCustomSiteContent();
    }
    if (typeof window.hydrateSiteTextFromStorage === 'function') {
      window.hydrateSiteTextFromStorage();
    }
  }
  if (e.key === 'l2d_is_admin' || e.key === 'l2d_admin_editing_mode') {
    if (typeof window.initAdminTopBar === 'function') {
      window.initAdminTopBar();
    }
  }
  if (e.key === 'l2d_custom_site_images') {
    if (typeof window.hydrateSiteImagesFromStorage === 'function') {
      window.hydrateSiteImagesFromStorage();
    }
  }
  if (e.key === 'l2d_custom_routes') {
    if (typeof window.showRouteTip === 'function' && window.currentSpotId) {
      window.showRouteTip(window.currentSpotId, true);
    }
  }
  if (e.key === 'l2d_custom_reviews') {
    if (typeof window.renderReviews === 'function') {
      window.renderReviews(window.currentReviewFilter || 'all');
    }
  }
});

/**
 * ==========================================================================
 * 8. FLOATING ADMIN TOP BAR (#floatingAdminBar) & SESSION PERSISTENCE
 * ==========================================================================
 */
window.initAdminTopBar = function() {
  const isAdmin = localStorage.getItem('l2d_is_admin') === 'true';
  let bar = document.getElementById('floatingAdminBar');

  if (!isAdmin) {
    if (bar) bar.remove();
    document.body.classList.remove('admin-mode-active');
    setEditingMode(false);
    return;
  }

  document.body.classList.add('admin-mode-active');
  const adminUser = localStorage.getItem('l2d_admin_user') || 'admin';
  const savedEditMode = localStorage.getItem('l2d_admin_editing_mode') === 'true';
  const isLMSComingSoon = localStorage.getItem('l2d_course_coming_soon') === 'true';

  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'floatingAdminBar';
    bar.className = 'floating-admin-bar';
    document.body.prepend(bar);
  }

  bar.innerHTML = `
    <div class="admin-bar-left">
      <span class="badge badge-primary admin-status-badge">Instructor Admin (${adminUser})</span>
    </div>
    <div class="admin-bar-center">
      <button id="toggleEditModeBtn" class="toggle-edit-mode-btn ${savedEditMode ? '' : 'off'}" onclick="toggleEditingMode()">
        ${savedEditMode ? 'Edit Mode: ON' : 'Edit Mode: OFF'}
      </button>
      <button id="toggleLMSBtn" class="toggle-edit-mode-btn ${isLMSComingSoon ? '' : 'off'}" style="background: ${isLMSComingSoon ? 'var(--color-amber, #F57C00)' : 'rgba(255,255,255,0.15)'}; margin-left: 0.4rem;" onclick="toggleLMSComingSoon()">
        ${isLMSComingSoon ? '🚧 LMS: Coming Soon' : '🌐 LMS: Live'}
      </button>
      <a href="course.html#adminHubContainer" class="admin-hub-top-link">Admin Hub</a>
    </div>
    <div class="admin-bar-right">
      <button class="admin-logout-btn" onclick="handleAdminLogout()">Log Out</button>
    </div>
  `;

  setEditingMode(savedEditMode);
};

window.toggleLMSComingSoon = function() {
  const current = localStorage.getItem('l2d_course_coming_soon') === 'true';
  const next = !current;
  try {
    localStorage.setItem('l2d_course_coming_soon', next ? 'true' : 'false');
  } catch(e) {}

  if (typeof window.syncSiteTextToSupabase === 'function') {
    window.syncSiteTextToSupabase('course_coming_soon', next ? 'true' : 'false');
  }

  if (typeof window.showToast === 'function') {
    window.showToast(next ? 'Course LMS is now in COMING SOON mode 🚧' : 'Course LMS is now LIVE 🌐');
  }

  window.initAdminTopBar();

  if (typeof window.checkAndApplyLMSComingSoonMode === 'function') {
    window.checkAndApplyLMSComingSoonMode();
  }
};

/**
 * Toggle & Sync In-Memory and LocalStorage Editing Mode State
 */
window.setEditingMode = function(enabled) {
  if (!enabled) {
    window.saveAllEditableContentFromDOM();
  }

  window.L2D_EDIT_MODE = !!enabled;
  try {
    localStorage.setItem('l2d_admin_editing_mode', enabled ? 'true' : 'false');
  } catch(e) {}

  const toggleBtn = document.getElementById('toggleEditModeBtn');
  if (toggleBtn) {
    toggleBtn.innerHTML = enabled ? 'Edit Mode: ON' : 'Edit Mode: OFF';
    if (enabled) {
      toggleBtn.classList.remove('off');
    } else {
      toggleBtn.classList.add('off');
    }
  }

  if (enabled) {
    document.body.classList.add('admin-edit-mode');
  } else {
    document.body.classList.remove('admin-edit-mode');
  }

  // Update contenteditable on all decorated elements
  setupEditableEventListeners();
  const editables = document.querySelectorAll('[data-editable-key]');
  editables.forEach(el => {
    if (enabled) {
      el.setAttribute('contenteditable', 'true');
    } else {
      el.removeAttribute('contenteditable');
    }
  });

  if (!enabled) {
    window.hydrateSiteTextFromStorage();
  }

  // Refresh dynamic components
  if (typeof window.renderReviews === 'function') {
    window.renderReviews(window.currentReviewFilter || 'all');
  }
  if (typeof window.showRouteTip === 'function' && window.currentSpotId) {
    window.showRouteTip(window.currentSpotId, true);
  }

  // Refresh showroom if present
  if (typeof window.refreshShowroomDisplay === 'function') {
    window.refreshShowroomDisplay();
  }

  // Trigger image crop buttons visibility
  if (typeof window.setupImageCropTriggers === 'function') {
    window.setupImageCropTriggers(enabled);
  }
};

window.toggleEditingMode = function() {
  const current = window.L2D_EDIT_MODE;
  const next = !current;
  setEditingMode(next);
  if (typeof window.showToast === 'function') {
    window.showToast(next ? 'Inline Edit Mode Enabled' : 'Inline Edit Mode Disabled');
  }
};

window.handleAdminLogout = function() {
  try {
    localStorage.removeItem('l2d_is_admin');
    localStorage.removeItem('l2d_admin_editing_mode');
    localStorage.removeItem('l2d_admin_user');
    document.body.classList.remove('admin-edit-mode');
  } catch(e) {}

  if (typeof window.setEditingMode === 'function') {
    window.setEditingMode(false);
  }

  if (typeof window.initAdminTopBar === 'function') {
    window.initAdminTopBar();
  }

  if (typeof window.showToast === 'function') {
    window.showToast('Logged out of Admin session 🚪');
  }

  // If currently on course.html, redirect back to index.html landing page cleanly
  if (window.location.pathname.includes('course.html')) {
    window.location.href = 'index.html';
  }
};

/**
 * ==========================================================================
 * 9. INLINE TEXT EDITING ENGINE (contenteditable)
 * ==========================================================================
 */
window.setupEditableEventListeners = function(forceEnable) {
  const isEnabled = forceEnable !== undefined 
    ? !!forceEnable 
    : (window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true') || (localStorage.getItem('l2d_is_admin') === 'true'));

  const editables = document.querySelectorAll('[data-editable-key]');
  editables.forEach(el => {
    if (isEnabled) {
      el.setAttribute('contenteditable', 'true');
    } else {
      el.removeAttribute('contenteditable');
    }

    if (el.tagName === 'A' && !el.dataset.hasClickListener) {
      el.dataset.hasClickListener = 'true';
      el.addEventListener('click', (e) => {
        if (window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true')) {
          e.preventDefault();
        }
      });
    }

    if (el.dataset.hasBlurListener) return;
    el.dataset.hasBlurListener = 'true';

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        el.blur();
      } else if (e.key === 'Escape') {
        el.blur();
      }
    });

    el.addEventListener('blur', () => {
      const key = el.getAttribute('data-editable-key');
      let val = el.innerHTML.trim();
      if (val === '' || val === '<br>') {
        val = '[Edit Text]';
        el.innerHTML = val;
      }

      let customMap = {};
      try {
        customMap = JSON.parse(localStorage.getItem('l2d_custom_site_text') || '{}');
      } catch(e) {}

      customMap[key] = val;
      try {
        localStorage.setItem('l2d_custom_site_text', JSON.stringify(customMap));
      } catch(e) {}

      // Trigger immediate live Supabase push on every blur event
      if (typeof window.syncSiteTextToSupabase === 'function') {
        window.syncSiteTextToSupabase(key, val);
      }

      // Sync Phase 1 site content fields
      if (key === 'hero_badge' || key === 'hero_heading' || key === 'hero_text' || key === 'footer_contact_location') {
        syncPhase1SiteContent(key, val);
      }

      // Sync custom car hotspots if key matches fleet_..._hs_...
      if (key.startsWith('fleet_') && key.includes('_hs_')) {
        syncCustomHotspotFromInlineEdit(key, val);
      }

      // Sync custom route tips if key matches route_spot_...
      if (key.startsWith('route_spot_')) {
        syncCustomRouteTipFromInlineEdit(key, val);
      }

      if (typeof window.showToast === 'function') {
        window.showToast('Site text updated & saved! 💾');
      }
    });
  });
};

window.setupInlineTextEditing = window.setupEditableEventListeners;

function syncCustomHotspotFromInlineEdit(key, val) {
  // Key format: fleet_{carKey}_hs_{spotId}_{title|desc}
  const match = key.match(/^fleet_([a-z]+)_hs_(\d+)_(title|desc)$/);
  if (!match) return;
  const [, carKey, spotIdStr, field] = match;
  const spotId = parseInt(spotIdStr, 10);

  try {
    const raw = localStorage.getItem('l2d_custom_hotspots') || localStorage.getItem('l2d_fleet_hotspots');
    const customObj = raw ? JSON.parse(raw) : { yaris: { hotspots: [] }, kona: { hotspots: [] } };
    if (!customObj[carKey]) customObj[carKey] = { hotspots: [] };
    if (!Array.isArray(customObj[carKey].hotspots)) customObj[carKey].hotspots = [];

    let hs = customObj[carKey].hotspots.find(h => h.id === spotId);
    if (!hs) {
      hs = { id: spotId, title: '', desc: '', x: 30, y: 50 };
      customObj[carKey].hotspots.push(hs);
    }

    if (field === 'title') hs.title = val.replace(/<[^>]*>/g, '');
    if (field === 'desc') hs.desc = val.replace(/<[^>]*>/g, '');

    localStorage.setItem('l2d_custom_hotspots', JSON.stringify(customObj));
    localStorage.setItem('l2d_fleet_hotspots', JSON.stringify(customObj));

    // Live sync fleet hotspots to Supabase fleet_hotspots table
    if (typeof window.syncHotspotsToSupabase === 'function') {
      window.syncHotspotsToSupabase(carKey, customObj[carKey].hotspots);
    }
  } catch(e) {
    console.warn('Error syncing custom hotspot inline edit:', e);
  }
}

function syncCustomRouteTipFromInlineEdit(key, val) {
  // Key format: route_spot_{spotId}_{title|location|tip}
  const match = key.match(/^route_spot_(\d+)_(title|location|tip)$/);
  if (!match) return;
  const [, spotIdStr, field] = match;
  const spotId = parseInt(spotIdStr, 10);

  try {
    const raw = localStorage.getItem('l2d_custom_routes');
    let routesObj = raw ? JSON.parse(raw) : {};
    if (typeof window.getPrestonRouteTips === 'function') {
      routesObj = { ...window.getPrestonRouteTips(), ...routesObj };
    }
    if (!routesObj[spotId]) {
      routesObj[spotId] = { title: '', location: '', tip: '', lat: 53.7632, lng: -2.7481 };
    }
    let cleanText = val.replace(/<[^>]*>/g, '').replace(/^Farhan & Binish's Advice:\s*"?/i, '').replace(/"$/, '').trim();
    if (field === 'title') routesObj[spotId].title = cleanText;
    if (field === 'location') routesObj[spotId].location = cleanText;
    if (field === 'tip') routesObj[spotId].tip = cleanText;

    localStorage.setItem('l2d_custom_routes', JSON.stringify(routesObj));

    // Live sync route #1..#4 to Supabase preston_routes table
    if (typeof window.syncRouteToSupabase === 'function') {
      window.syncRouteToSupabase(spotId, routesObj[spotId]);
    }
  } catch(e) {
    console.warn('Error syncing custom route tip inline edit:', e);
  }
}

function syncPhase1SiteContent(key, val) {
  let content = {};
  try {
    const saved = localStorage.getItem('l2d_site_content');
    if (saved) content = JSON.parse(saved);
  } catch(e) {}

  if (key === 'hero_badge') content.heroBadge = val;
  if (key === 'hero_heading') content.heroHeading = val;
  if (key === 'hero_text') content.heroText = val;
  if (key === 'footer_contact_location') {
    const cleanLoc = val.replace(/^📍\s*/, '');
    content.contactLocation = cleanLoc;
  }

  try {
    localStorage.setItem('l2d_site_content', JSON.stringify(content));
  } catch(e) {}
}

window.hydrateSiteTextFromStorage = function() {
  let customMap = {};
  try {
    const raw = localStorage.getItem('l2d_custom_site_text');
    if (raw) customMap = JSON.parse(raw);
  } catch(e) {}

  const editables = document.querySelectorAll('[data-editable-key]');
  editables.forEach(el => {
    const key = el.getAttribute('data-editable-key');
    if (customMap[key] !== undefined && customMap[key] !== null) {
      let val = customMap[key];
      if (val.includes('instagram.com/lrnr2drvr')) {
        val = val.replace(/style="color:\s*var\(--color-green\);?"/gi, 'class="gradient-text-insta" style="font-weight:800;"');
      }
      if (key === 'hero_heading') {
        val = val.replace(/earner2Driver/gi, 'earner<span class="brand-2">2</span><span class="text-gradient-primary" style="font-weight:800;">D</span>river');
        val = val.replace(/earner<span[^>]*>2<\/span>/gi, 'earner<span class="brand-2">2</span>');
        val = val.replace(/earner2/gi, 'earner<span class="brand-2">2</span>');
      }
      if (key === 'stat_rating_val' && (val === '4.9 Rating' || val === '4.9')) {
        val = '5★ Rating';
      }
      el.innerHTML = val;
    }
  });
};

window.saveAllEditableContentFromDOM = function() {
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    try { document.activeElement.blur(); } catch(e) {}
  }

  let customMap = {};
  try {
    const raw = localStorage.getItem('l2d_custom_site_text');
    if (raw) customMap = JSON.parse(raw);
  } catch(e) {}

  const editables = document.querySelectorAll('[data-editable-key]');
  editables.forEach(el => {
    const key = el.getAttribute('data-editable-key');
    if (!key) return;
    let val = el.innerHTML.trim();
    if (val === '' || val === '<br>') {
      val = '[Edit Text]';
      el.innerHTML = val;
    }
    customMap[key] = val;

    if (key === 'hero_badge' || key === 'hero_heading' || key === 'hero_text' || key === 'footer_contact_location') {
      syncPhase1SiteContent(key, val);
    }
    if (key.startsWith('fleet_') && key.includes('_hs_')) {
      syncCustomHotspotFromInlineEdit(key, val);
    }
    if (key.startsWith('route_spot_')) {
      syncCustomRouteTipFromInlineEdit(key, val);
    }
  });

  try {
    localStorage.setItem('l2d_custom_site_text', JSON.stringify(customMap));
    if (typeof window.pushLocalDataToCloud === 'function') {
      window.pushLocalDataToCloud(false);
    }
  } catch(e) {}
};

window.addEventListener('beforeunload', () => {
  if (window.L2D_EDIT_MODE || (localStorage.getItem('l2d_admin_editing_mode') === 'true')) {
    window.saveAllEditableContentFromDOM();
  }
});

/**
 * ==========================================================================
 * 10. GLOBAL ADMIN LOGIN MODAL HANDLERS (for index.html & course.html)
 * ==========================================================================
 */
window.openAdminLoginModal = function() {
  const modal = document.getElementById('adminLoginModalBackdrop');
  if (!modal) {
    window.location.href = 'course.html#adminHubContainer';
    return;
  }
  const userEl = document.getElementById('adminLoginUsername');
  const passEl = document.getElementById('adminLoginPassword');
  const errEl = document.getElementById('adminLoginError');

  let adminUser = 'admin';
  try {
    adminUser = localStorage.getItem('l2d_admin_user') || 'admin';
  } catch(e) {}

  if (userEl) userEl.value = adminUser;
  if (passEl) passEl.value = '';
  if (errEl) errEl.textContent = '';

  modal.style.display = 'flex';
  if (passEl) passEl.focus();
};

window.closeAdminLoginModal = function() {
  const modal = document.getElementById('adminLoginModalBackdrop');
  if (modal) modal.style.display = 'none';
  const errEl = document.getElementById('adminLoginError');
  if (errEl) errEl.textContent = '';
};

window.submitAdminLoginModal = async function(event) {
  if (event && event.preventDefault) event.preventDefault();

  const userEl = document.getElementById('adminLoginUsername');
  const passEl = document.getElementById('adminLoginPassword');
  const errEl = document.getElementById('adminLoginError');

  const user = userEl ? userEl.value.trim() : '';
  const pass = passEl ? passEl.value : '';

  let storedUser = 'admin';
  try {
    storedUser = localStorage.getItem('l2d_admin_user') || 'admin';
  } catch(e) {}

  const storedSalt = localStorage.getItem('l2d_admin_password_salt');
  const storedHash = localStorage.getItem('l2d_admin_password_hash');

  let isValid = false;
  if (typeof window.verifyPassword === 'function' && storedSalt && storedHash) {
    if (user === storedUser) {
      isValid = await window.verifyPassword(pass, storedSalt, storedHash);
    }
  } else if (user === storedUser) {
    const legacyPass = localStorage.getItem('l2d_admin_pass') || 'Huzaifa1';
    if (pass === legacyPass) {
      isValid = true;
    }
  }

  if (isValid) {
    try {
      localStorage.setItem('l2d_is_admin', 'true');
      localStorage.setItem('l2d_admin_user', user);
    } catch(e) {}
    closeAdminLoginModal();
    if (typeof window.initAdminTopBar === 'function') {
      window.initAdminTopBar();
    }
    if (typeof window.setEditingMode === 'function') {
      window.setEditingMode(true);
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`Admin Mode Unlocked (${user})! Inline Edit Mode Active 🛡️`);
    }
  } else {
    if (errEl) {
      errEl.textContent = 'Invalid Admin Credentials.';
    } else {
      alert('Invalid Admin Credentials.');
    }
  }
};
