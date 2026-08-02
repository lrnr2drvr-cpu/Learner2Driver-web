# Milestone 3 Handoff Report: Floating Admin Top Bar & Inline Text Editing Engine

## 1. Observation

### File & Codebase Inspection Findings

1. **`index.html` (501 lines)**:
   - Contains major landing page sections: Hero, Instructors (Farhan & Binish cards), Fleet Showroom, Test Readiness Quiz, Preston Map & Danger Spots, Instagram Feed, Booking Concierge, Pass Gallery, Google Reviews, and Footer.
   - Currently has hardcoded static text elements without `data-editable-key` attributes.
   - Some elements have element IDs (`siteHeroBadge`, `siteHeroHeading`, `siteHeroText`, `siteContactLocation`).

2. **`course.html` (491 lines)**:
   - Contains LMS Portal, Admin Login Modal, Student Account Management Modal, Course Modules/Lessons Modals, Course Hero, LMS Progress Bar, Admin Command Hub, Curriculum Tree, Video Theater, and Footer.
   - Has static text sections in Course Hero and Footer currently lacking `data-editable-key` attributes.

3. **`js/app.js` (257 lines)**:
   - Handles theme toggle (`l2d_theme`), mobile nav, stats counters, 3D card tilt, smooth scroll, toast notifications (`window.showToast`), and a basic `applyCustomSiteContent()` function that reads from `localStorage.getItem('l2d_site_content')`.
   - Runs on both `index.html` and `course.html`.
   - Currently lacks floating admin top bar initialization, global edit mode state, and inline text editing listeners.

4. **`js/course-player.js` (1810 lines)**:
   - Controls LMS state (`courseState`), admin login (`openAdminLoginModal()`, `submitAdminLoginModal()`), student progress, curriculum rendering, and admin hub tabs.
   - Admin login sets `courseState.isAdmin = true` in-memory, but does not persist an `l2d_is_admin` flag in `localStorage` across page navigations (e.g. going from `course.html` to `index.html`).

5. **`styles/components.css` (452 lines)**:
   - Contains styles for mobile bottom nav, floating call pill, glass cards, instructor cards, concierge UI, gallery, stats badges, modals, and toast notifications.
   - Currently lacks CSS classes for `#floatingAdminBar`, `#toggleEditModeBtn`, and `[data-editable-key]` outline states.

---

## 2. Logic Chain

From these observations, we derive the exact architecture needed for Phase 2 Milestone 3:

```
[Admin Authentication] ──> Save 'l2d_is_admin'='true' in localStorage
                                │
                                ▼
                       [initAdminTopBar()]
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
    Render `#floatingAdminBar`          Check 'l2d_admin_editing_mode'
    (Badge, Toggle, Admin Hub, Logout)           │
                                                 ▼
                                     [setEditingMode(enabled)]
                                                 │
                                                 ▼
                                     Toggle contenteditable="true"
                                     & outline styling on [data-editable-key]
                                                 │
                                ┌────────────────┴────────────────┐
                                ▼                                 ▼
                         [input / blur]                    [DOMContentLoaded]
                                │                                 │
                                ▼                                 ▼
                     Save to 'l2d_custom_site_text'    [hydrateSiteTextFromStorage()]
                     & show toast notification         Hydrate DOM from localStorage
```

### Key Architectural Decisions:

1. **Admin Session Persistence Across Pages**:
   - When admin logs in (via `submitAdminLoginModal()` or prompt in `course-player.js`), save `localStorage.setItem('l2d_is_admin', 'true')`.
   - When admin logs out, run `localStorage.removeItem('l2d_is_admin')` and `localStorage.removeItem('l2d_admin_editing_mode')`.
   - On page load (`DOMContentLoaded`), both `index.html` and `course.html` call `initAdminTopBar()`. If `localStorage.getItem('l2d_is_admin') === 'true'`, the floating bar is rendered automatically.

2. **Floating Admin Top Bar Structure (`#floatingAdminBar`)**:
   - Injected directly into `document.body` as the top-most element.
   - Fixed position (`position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 10000;`).
   - Dark graphite slate styling (`background: #0F172A; border-bottom: 1px solid rgba(255,255,255,0.15); box-shadow: 0 4px 20px rgba(0,0,0,0.3);`).
   - Elements:
     - Left: Admin Badge `<span class="admin-bar-badge">🛡️ Instructor Admin Mode</span>`
     - Center:
       - Edit Mode Toggle Switch `<button id="toggleEditModeBtn" class="edit-mode-toggle-btn">✏️ Edit Mode: OFF</button>`
       - Admin Hub Shortcut `<a href="course.html#adminHubContainer" class="admin-bar-btn">📊 Admin Hub</a>`
     - Right: Log Out Button `<button id="adminLogoutBtn" class="admin-bar-btn logout">Logout Admin 🚪</button>`
   - Body offset: When top bar is active, add `admin-mode-active` class to `<body>`, applying `padding-top: 52px` or adjusting `.top-header` `top: 52px` to prevent layout clipping.

3. **Global Editing Mode Engine**:
   - State stored in `window.L2D_EDIT_MODE` (boolean).
   - Persisted in `localStorage.getItem('l2d_admin_editing_mode')` (`'true'` or `'false'`).
   - `setEditingMode(enabled)`:
     - Updates `window.L2D_EDIT_MODE = enabled`.
     - Updates toggle button UI (active green background when ON, slate outline when OFF).
     - Finds all `document.querySelectorAll('[data-editable-key]')`.
     - Sets `contenteditable="true"` (when ON) or `contenteditable="false"` / removes attribute (when OFF).

4. **Visual Accent Cue Styling**:
   - When Edit Mode is ON, all editable elements receive:
     ```css
     [data-editable-key][contenteditable="true"] {
       outline: 2px dashed #059669 !important;
       outline-offset: 4px !important;
       border-radius: 4px !important;
       cursor: text !important;
       transition: outline 0.2s ease, background-color 0.2s ease !important;
     }
     [data-editable-key][contenteditable="true"]:hover,
     [data-editable-key][contenteditable="true"]:focus {
       outline: 2px solid #10B981 !important;
       background-color: rgba(5, 150, 105, 0.08) !important;
     }
     ```

5. **Inline Text Updating & LocalStorage Engine**:
   - Listening for `blur` and `input` events on all `[data-editable-key]` elements:
     - On `blur`:
       - Extract key: `const key = el.getAttribute('data-editable-key')`.
       - Read innerHTML: `const text = el.innerHTML.trim()`.
       - Update storage: Read `l2d_custom_site_text` JSON object from `localStorage`, set `storedText[key] = text`, write back to `localStorage.setItem('l2d_custom_site_text', JSON.stringify(storedText))`.
       - Trigger Toast: `showToast('Site text updated & saved! 💾')`.
       - Also sync with legacy `l2d_site_content` if applicable for backward compatibility.

6. **Hydration Engine (`hydrateSiteTextFromStorage()`)**:
   - Called during `DOMContentLoaded` on both `index.html` and `course.html`.
   - Code logic:
     ```javascript
     function hydrateSiteTextFromStorage() {
       try {
         const raw = localStorage.getItem('l2d_custom_site_text');
         if (!raw) return;
         const data = JSON.parse(raw);
         if (!data || typeof data !== 'object') return;

         Object.keys(data).forEach(key => {
           const elements = document.querySelectorAll(`[data-editable-key="${key}"]`);
           elements.forEach(el => {
             if (data[key] !== undefined && data[key] !== null) {
               el.innerHTML = data[key];
             }
           });
         });
       } catch (e) {
         console.warn('Error hydrating site text:', e);
       }
     }
     ```

---

## 3. Editable Text Section Catalog

Here is the complete inventory of text sections across `index.html` and `course.html` to be tagged with `data-editable-key`:

### `index.html` Editable Elements Catalog

| No. | Section | Target Element | Proposed `data-editable-key` | Default Text Content |
|---|---|---|---|---|
| 1 | Hero | `#siteHeroBadge` | `hero_badge` | `🚗 Preston DVSA-Approved Driving Academy` |
| 2 | Hero | `#siteHeroHeading` | `hero_heading` | `Welcome to <span style="color:#D32F2F; font-weight:800;">L</span>earner2<span style="color:#2E7D32; font-weight:800;">D</span>river Preston` |
| 3 | Hero | `#siteHeroText` | `hero_text` | `Professional Manual & Automatic tuition with Preston's top-rated instructors, Farhan Hussaini & Binish Moazzam...` |
| 4 | Hero Stats | Stat 1 Subtitle | `stat_pass_rate_title` | `1st-Time Pass Rate` |
| 5 | Hero Stats | Stat 2 Subtitle | `stat_passes_title` | `Preston Passes` |
| 6 | Hero Stats | Stat 3 Subtitle | `stat_rating_title` | `Google Rating` |
| 7 | Instructors | Section Badge | `instructors_section_badge` | `DVSA Approved Instructors` |
| 8 | Instructors | Section Title | `instructors_section_title` | `Meet Your Driving Instructors` |
| 9 | Instructors | Section Subtitle | `instructors_section_sub` | `Choose between male and female tuition tailored to your learning pace...` |
| 10 | Instructors | Farhan Bio | `inst_farhan_bio` | `With years of experience coaching Preston learners, Farhan specialises in test route navigation...` |
| 11 | Instructors | Binish Bio | `inst_binish_bio` | `Binish offers calm, patient, and empowering tuition for learners who prefer a female instructor...` |
| 12 | Fleet | Section Title | `fleet_section_title` | `Our Training Fleet` |
| 13 | Quiz | Section Title | `quiz_section_title` | `Test Readiness Quiz` |
| 14 | Routes | Section Title | `routes_section_title` | `Actual Preston Test Route & Danger Spot Explorer` |
| 15 | Instagram | Section Title | `insta_section_title` | `Follow Our Journey @lrnr2drvr` |
| 16 | Booking | Section Title | `book_section_title` | `Book Your Lesson Concierge` |
| 17 | Gallery | Section Title | `gallery_section_title` | `Recent 1st-Time Pass Celebrations 🎉` |
| 18 | Reviews | Section Title | `reviews_section_title` | `What Our Preston Students Say` |
| 19 | Footer | About Text | `footer_about_text` | `Preston's premier DVSA-approved driving academy offering Manual & Automatic lessons...` |
| 20 | Footer | Contact Location | `footer_contact_location` | `📍 Preston, Lancashire & Surrounding Areas (PR1-PR5)` |

### `course.html` Editable Elements Catalog

| No. | Section | Target Element | Proposed `data-editable-key` | Default Text Content |
|---|---|---|---|---|
| 21 | Course Hero | Hero Badge | `course_hero_badge` | `Preston DVSA Video Curriculum` |
| 22 | Course Hero | Hero Heading | `course_hero_heading` | `Student Video Course Hub & LMS` |
| 23 | Course Hero | Hero Subtitle | `course_hero_sub` | `Watch instructional videos from Farhan and Binish, check off completed lessons...` |
| 24 | Course Footer | Footer About | `course_footer_about` | `Preston's premier DVSA-approved driving academy. Structured Video Curriculum & LMS.` |

---

## 4. Caveats

1. **HTML Formatting vs Plain Text in Editable Fields**:
   - Certain headings (e.g. `hero_heading`) include styled HTML `<span>` tags. When editing via `contenteditable="true"`, using `innerHTML` ensures spans and inline colors are preserved.
   - Care should be taken during testing not to paste formatted external rich text that inserts unexpected inline CSS tags.
2. **Fixed Top Bar Header Offset**:
   - The primary site header `.top-header` is `position: sticky; top: 0;`. When `#floatingAdminBar` (52px high) is present, `.top-header` needs `top: 52px` so it sticks directly beneath the admin bar without overlapping.
3. **Cross-Tab Synchronization**:
   - Editing text in one browser tab updates `localStorage`. Adding a `window.addEventListener('storage')` listener that calls `hydrateSiteTextFromStorage()` ensures other open tabs refresh immediately.
4. **No Code Modification Violation**:
   - This handoff report is strictly an analysis and specification file written in `.agents/teamwork_preview_explorer_p2_m3_1/handoff.md`. No project source files in root have been modified.

---

## 5. Conclusion & Implementation Specification

### Proposed Implementation Code Additions

#### 1. CSS Styling for Floating Admin Top Bar & Outline System (`styles/components.css`)

```css
/* ==========================================================================
   FLOATING ADMIN TOP BAR & INLINE EDITING ENGINE (MILESTONE 3)
   ========================================================================== */

/* Body top padding offset when Admin Bar is active */
body.admin-mode-active {
  padding-top: 52px !important;
}

body.admin-mode-active .top-header {
  top: 52px !important;
}

/* Floating Admin Bar Container */
#floatingAdminBar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: #0F172A;
  color: #FFFFFF;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  font-family: var(--font-body, system-ui, sans-serif);
  font-size: 0.88rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.admin-bar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-bar-status-badge {
  background: rgba(5, 150, 105, 0.2);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full, 9999px);
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.admin-bar-center {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-edit-mode-btn {
  background: #1E293B;
  color: #F8FAFC;
  border: 1px solid #475569;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-full, 9999px);
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
}

.toggle-edit-mode-btn:hover {
  background: #334155;
  border-color: #64748B;
}

.toggle-edit-mode-btn.active {
  background: #059669;
  color: #FFFFFF;
  border-color: #10B981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

.admin-bar-link-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-md, 6px);
  font-weight: 600;
  font-size: 0.82rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.admin-bar-link-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.admin-bar-logout-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #FCA5A5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-md, 6px);
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-bar-logout-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #FFFFFF;
}

/* Inline ContentEditable Highlight Style when Edit Mode is ON */
[data-editable-key][contenteditable="true"] {
  outline: 2px dashed #059669 !important;
  outline-offset: 4px !important;
  border-radius: 4px !important;
  cursor: text !important;
  transition: outline 0.2s ease, background-color 0.2s ease !important;
}

[data-editable-key][contenteditable="true"]:hover,
[data-editable-key][contenteditable="true"]:focus {
  outline: 2px solid #10B981 !important;
  background-color: rgba(5, 150, 105, 0.08) !important;
}
```

#### 2. JavaScript Engine (`js/app.js` or dedicated module)

```javascript
/**
 * Milestone 3: Floating Admin Top Bar & Inline Editing Engine
 */
document.addEventListener('DOMContentLoaded', () => {
  hydrateSiteTextFromStorage();
  initAdminTopBar();
  setupEditableEventListeners();
});

/**
 * 1. Hydrate custom text from localStorage across index.html & course.html
 */
function hydrateSiteTextFromStorage() {
  try {
    const raw = localStorage.getItem('l2d_custom_site_text');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return;

    Object.keys(data).forEach(key => {
      const elements = document.querySelectorAll(`[data-editable-key="${key}"]`);
      elements.forEach(el => {
        if (data[key] !== undefined && data[key] !== null) {
          el.innerHTML = data[key];
        }
      });
    });
  } catch (e) {
    console.error('Error hydrating site text:', e);
  }
}

/**
 * 2. Initialize Floating Admin Top Bar
 */
function initAdminTopBar() {
  const isAdmin = localStorage.getItem('l2d_is_admin') === 'true';
  let bar = document.getElementById('floatingAdminBar');

  if (!isAdmin) {
    if (bar) bar.remove();
    document.body.classList.remove('admin-mode-active');
    setEditingMode(false);
    return;
  }

  document.body.classList.add('admin-mode-active');

  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'floatingAdminBar';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  const adminUser = localStorage.getItem('l2d_admin_user') || 'admin';
  const isEditing = localStorage.getItem('l2d_admin_editing_mode') === 'true';

  bar.innerHTML = `
    <div class="admin-bar-left">
      <span class="admin-bar-status-badge">🛡️ Instructor Admin (${adminUser})</span>
    </div>
    <div class="admin-bar-center">
      <button id="toggleEditModeBtn" class="toggle-edit-mode-btn ${isEditing ? 'active' : ''}" onclick="toggleEditMode()">
        ✏️ Edit Mode: ${isEditing ? 'ON' : 'OFF'}
      </button>
      <a href="course.html#adminHubContainer" class="admin-bar-link-btn">📊 Admin Hub</a>
    </div>
    <div class="admin-bar-right">
      <button class="admin-bar-logout-btn" onclick="handleAdminLogout()">Log Out 🚪</button>
    </div>
  `;

  window.L2D_EDIT_MODE = isEditing;
  applyEditModeState(isEditing);
}

/**
 * 3. Toggle Edit Mode State
 */
function toggleEditMode() {
  const newMode = !window.L2D_EDIT_MODE;
  setEditingMode(newMode);
}

function setEditingMode(enabled) {
  window.L2D_EDIT_MODE = enabled;
  localStorage.setItem('l2d_admin_editing_mode', enabled ? 'true' : 'false');

  const btn = document.getElementById('toggleEditModeBtn');
  if (btn) {
    if (enabled) {
      btn.classList.add('active');
      btn.innerHTML = '✏️ Edit Mode: ON';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '✏️ Edit Mode: OFF';
    }
  }

  applyEditModeState(enabled);
  if (typeof window.showToast === 'function') {
    window.showToast(enabled ? 'Inline Editing Mode Activated ✏️' : 'Inline Editing Mode Disabled 🔒');
  }
}

function applyEditModeState(enabled) {
  const editables = document.querySelectorAll('[data-editable-key]');
  editables.forEach(el => {
    if (enabled) {
      el.setAttribute('contenteditable', 'true');
    } else {
      el.removeAttribute('contenteditable');
    }
  });
}

/**
 * 4. Setup Input & Blur Listeners to save text updates into localStorage
 */
function setupEditableEventListeners() {
  document.addEventListener('blur', (e) => {
    const el = e.target;
    if (el && el.hasAttribute && el.hasAttribute('data-editable-key')) {
      const key = el.getAttribute('data-editable-key');
      const val = el.innerHTML.trim();
      saveEditableContent(key, val);
    }
  }, true);
}

function saveEditableContent(key, value) {
  try {
    let customText = {};
    const raw = localStorage.getItem('l2d_custom_site_text');
    if (raw) {
      customText = JSON.parse(raw);
    }
    customText[key] = value;
    localStorage.setItem('l2d_custom_site_text', JSON.stringify(customText));
    if (typeof window.showToast === 'function') {
      window.showToast('Site text updated & saved! 💾');
    }
  } catch (e) {
    console.error('Error saving editable content:', e);
  }
}

/**
 * 5. Handle Admin Logout
 */
function handleAdminLogout() {
  localStorage.removeItem('l2d_is_admin');
  localStorage.removeItem('l2d_admin_editing_mode');
  if (window.courseState) {
    window.courseState.isAdmin = false;
  }
  initAdminTopBar();
  if (typeof window.showToast === 'function') {
    window.showToast('Logged out of Admin Mode.');
  }
}

// Multi-tab storage sync
window.addEventListener('storage', (e) => {
  if (e.key === 'l2d_custom_site_text') {
    hydrateSiteTextFromStorage();
  }
  if (e.key === 'l2d_is_admin' || e.key === 'l2d_admin_editing_mode') {
    initAdminTopBar();
  }
});
```

---

## 6. Verification Method

To independently verify the Milestone 3 implementation once written by the Implementer agent:

1. **Verify Hydration**:
   - Open browser developer console.
   - Run: `localStorage.setItem('l2d_custom_site_text', JSON.stringify({ hero_badge: '🚗 TEST HYDRATED BADGE' }));`
   - Refresh `index.html`.
   - Inspect `#siteHeroBadge`. It must display `🚗 TEST HYDRATED BADGE`.

2. **Verify Admin Top Bar Visibility & Session**:
   - Run: `localStorage.setItem('l2d_is_admin', 'true');`
   - Refresh `index.html` and `course.html`.
   - Confirm `#floatingAdminBar` appears fixed at top with Admin status badge, "Enable Editing Mode" button, "Admin Hub" link, and "Log Out" button.

3. **Verify Toggle Edit Mode Engine**:
   - Click `#toggleEditModeBtn`. Confirm button changes to green `✏️ Edit Mode: ON`.
   - Confirm `window.L2D_EDIT_MODE` is `true` and `localStorage.getItem('l2d_admin_editing_mode')` is `'true'`.
   - Inspect elements with `data-editable-key` (e.g. hero badge, hero heading). Confirm they have `contenteditable="true"` and dashed green outline (`outline: 2px dashed #059669`).

4. **Verify Inline Text Edit & Storage Saving**:
   - Click inside `[data-editable-key="hero_badge"]`, edit text to `🚗 Custom New Badge Text`.
   - Click outside the element to trigger `blur`.
   - Confirm toast appears (`Site text updated & saved! 💾`).
   - Check `localStorage.getItem('l2d_custom_site_text')`. Confirm JSON object contains `"hero_badge": "🚗 Custom New Badge Text"`.
   - Refresh page. Confirm text persists.

5. **Verify Logout**:
   - Click "Log Out" button in `#floatingAdminBar`.
   - Confirm top bar disappears, `contenteditable` attributes are removed, and `localStorage.getItem('l2d_is_admin')` is cleared.
