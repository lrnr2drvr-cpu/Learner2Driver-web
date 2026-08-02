# Learner2Driver Phase 2 Milestone 1: Admin Hub Navigation Hierarchy & Modal Restructuring Analysis

**Author:** Explorer Subagent (`teamwork_preview_explorer_p2_m1_2`)  
**Target Milestone:** Learner2Driver Phase 2 Milestone 1  
**Date:** 2026-08-01  
**Status:** Complete  

---

## 1. Observation

Direct inspection of `course.html`, `js/course-player.js`, `styles/components.css`, and `styles/course.css` revealed the following structural facts about the existing Admin Hub layout:

### A. Current DOM Structure in `course.html`
1. **Admin Login Modal Backdrop** (`course.html:55-87`):
   - Element `#adminLoginModalBackdrop` handles authentication (`admin` / `Huzaifa1`).
2. **Edit Student Modal Backdrop** (`course.html:89-125`):
   - Element `#editStudentModalBackdrop` allows updating student name and assigned instructor (`Farhan Hussaini` or `Binish Moazzam`).
3. **Admin UI Mount Points** (`course.html:168-178`):
   - `#instructorAdminToolbar` (`course.html:168`) — Admin status bar rendered by `renderAdminToolbar()`.
   - `#adminContentEditorBox` (`course.html:171`) — Academy content and hotspot editor container.
   - `#adminProgressTableBox` (`course.html:178`) — Student progress table container.

### B. Current Rendering & State in `js/course-player.js`
1. **State Object** (`js/course-player.js:9-18`):
   ```javascript
   let courseState = {
     activeLessonId: null,
     isAdmin: false,
     currentStudent: null,
     studentProgress: {
       'Farhan Hussaini': { instructor: 'Farhan Hussaini', completed: [] },
       'Ayesha Patel': { instructor: 'Farhan Hussaini', completed: [] },
       'Liam O\'Connor': { instructor: 'Binish Moazzam', completed: [] }
     }
   };
   ```
2. **Vertical Element Stacking Problem**:
   - When `courseState.isAdmin === true`, `initCoursePlayer()` (lines 92-95) executes:
     ```javascript
     renderAdminProgressTable();
     renderAdminContentEditor();
     ```
   - Both `#adminProgressTableBox` and `#adminContentEditorBox` are set to `display: block` simultaneously.
   - There are **no navigation tabs or submenus**, resulting in an excessively long, vertically stacked layout where instructors must scroll past huge forms to perform routine tasks.

### C. Missing Core Features in Current Implementation
- **Student Accounts**: Lacks password storage per student profile, lacks transmission assignment (`Manual` vs `Automatic`).
- **Course Content CRUD**: Currently no UI to dynamically add, edit, or delete course modules and video lessons (currently hardcoded in `js/course-data.js`).
- **Instagram API Guidance**: Lacks an inline setup guide for Instagram Graph API connection.

---

## 2. Logic Chain

1. **Observation**: The current Admin Hub renders all management panels vertically stacked without tabbed views when `courseState.isAdmin` is enabled.
2. **Step 1 (Navigation Hierarchy)**: To improve usability and reduce clutter, we must wrap all Admin Hub features in a unified container `#adminHubContainer` with a tabbed ARIA navigation header (`role="tablist"`).
3. **Step 2 (Primary & Secondary Tab Architecture)**:
   - **Primary View (Default Tab)**: *Student Accounts & Progress Tracking* (`#adminTabStudents`). This is the default tab opened when an instructor logs in, focusing on daily administrative duties ("who has completed what", account setup with Username/Password/Transmission assignment, progress reset, profile deletion).
   - **Secondary Submenu Tabs**:
     - *Submenu Tab A: Course Content Editor* (`#adminTabContentEditor`). Handles Module & Lesson CRUD operations.
     - *Submenu Tab B: Advanced Site Settings* (`#adminTabSiteSettings`). Consolidates Site Text, Admin Credentials, Instagram API Endpoint + Setup Guide, and Fleet Hotspot Editor.
4. **Step 3 (Accessibility & Responsiveness)**: Implementing `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `tabindex`, and keyboard arrow navigation ensures standard-compliant accessibility (WCAG 2.1 AA) and mobile responsiveness.

---

## 3. Caveats

1. **Backwards Compatibility**: The existing `courseState.studentProgress` object schema (`{ instructor, completed }`) must be extended gracefully to include `password` and `transmission` fields without breaking existing localStorage records:
   ```javascript
   studentProgress[studentName] = {
     instructor: 'Farhan Hussaini',
     transmission: 'Manual', // New field: 'Manual' | 'Automatic'
     password: 'defaultPassword123', // New field
     completed: ['m1-l1', 'm1-l2']
   };
   ```
2. **Course Data Persistence**: Course Content CRUD modifications will persist to `localStorage.getItem('l2d_custom_course_data')` with fallback to `window.COURSE_DATA`.

---

## 4. Conclusion & Complete Technical Specification

### A. Restructured Navigation Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ADMIN HUB CONTAINER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [ 🛡️ Instructor Admin Hub Header ]  [ Logged in as: admin ]  [ Logout ]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PRIMARY TABS (role="tablist"):                                             │
│ ┌───────────────────────────┬─────────────────────────────────────────────┐ │
│ │ 👥 Student Accounts (DEF) │ ⚙️ Content & Site Management (Submenu Drop) │ │
│ └───────────────────────────┴─────────────────────────────────────────────┘ │
│                                                                             │
│ SECONDARY SUBMENU TABS (for Content & Site Management):                      │
│ ┌───────────────────────────────┬─────────────────────────────────────────┐ │
│ │ 📚 Submenu Tab A:             │ 🛠️ Submenu Tab B:                       │ │
│ │ Course Content Editor (CRUD)  │ Advanced Site Settings                  │ │
│ └───────────────────────────────┴─────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ TAB PANELS (role="tabpanel"):                                               │
│                                                                             │
│ 🔹 PANEL 1: Student Accounts & Progress Tracking (Default View)              │
│   ├── Enrolment & Progress Analytics Table                                  │
│   ├── Actions: Setup Account (User/Pass/Transmission), Reset, Edit, Remove  │
│                                                                             │
│ 🔹 PANEL 2: Course Content Editor (Submenu Tab A)                            │
│   ├── Module Manager (Add Module, Edit Title, Delete Module)                │
│   └── Lesson Manager (Add Lesson, Title, Duration, YouTube URL, Tip, Delete) │
│                                                                             │
│ 🔹 PANEL 3: Advanced Site Settings (Submenu Tab B)                          │
│   ├── 📝 Section 1: Site Text & Branding Editor                             │
│   ├── 🛡️ Section 2: Admin Credentials Management                            │
│   ├── 📸 Section 3: Instagram API Endpoint & Setup Guide                    │
│   └── 🚗 Section 4: Showroom Fleet Hotspot Editor (X%/Y% Adjuster)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### B. HTML Template Structure (To replace lines 168-178 in `course.html`)

```html
<!-- RESTRUCTURED INSTRUCTOR ADMIN HUB (ONLY VISIBLE IN ADMIN MODE) -->
<div id="adminHubContainer" class="admin-hub-container" style="display: none;">
  <!-- Admin Header Toolbar -->
  <div class="admin-hub-header">
    <div>
      <span class="badge badge-primary mb-1">Instructor Administration</span>
      <h2 style="margin: 0; font-size: 1.5rem;">Preston Academy Admin Hub 🛡️</h2>
    </div>
    <div class="admin-hub-actions">
      <span id="adminHubUserBadge" class="admin-user-badge">👤 Admin: admin</span>
      <button class="btn btn-accent btn-sm" onclick="logoutStudent()">Log Out Admin</button>
    </div>
  </div>

  <!-- Primary & Submenu Navigation Bar -->
  <div class="admin-nav-bar">
    <div class="admin-tab-group" role="tablist" aria-label="Admin Hub Navigation">
      <!-- Primary Tab 1: Student Accounts & Progress (DEFAULT ACTIVE) -->
      <button id="adminTabStudents" 
              class="admin-tab-btn active" 
              role="tab" 
              aria-selected="true" 
              aria-controls="adminPanelStudents" 
              tabindex="0"
              onclick="switchAdminTab('students')">
        👥 Student Accounts & Progress
      </button>

      <!-- Primary Submenu Group: Content & Site Management -->
      <button id="adminTabContentEditor" 
              class="admin-tab-btn" 
              role="tab" 
              aria-selected="false" 
              aria-controls="adminPanelContentEditor" 
              tabindex="-1"
              onclick="switchAdminTab('content-editor')">
        📚 Course Content Editor
      </button>

      <button id="adminTabSiteSettings" 
              class="admin-tab-btn" 
              role="tab" 
              aria-selected="false" 
              aria-controls="adminPanelSiteSettings" 
              tabindex="-1"
              onclick="switchAdminTab('site-settings')">
        ⚙️ Advanced Site Settings
      </button>
    </div>
  </div>

  <!-- TAB PANEL 1: STUDENT ACCOUNTS & PROGRESS TRACKING (DEFAULT) -->
  <section id="adminPanelStudents" class="admin-tab-panel" role="tabpanel" aria-labelledby="adminTabStudents">
    <div class="admin-panel-card">
      <div class="admin-panel-header">
        <div>
          <span class="badge badge-primary mb-1">Enrolment & Analytics</span>
          <h3 style="margin: 0;">Student Progress & Account Directory</h3>
          <p style="margin: 0.3rem 0 0; color: var(--text-light); font-size: 0.9rem;">
            Monitor real-time course completion, assign transmission types (Manual vs Automatic), setup credentials, or reset progress.
          </p>
        </div>
        <button class="btn btn-primary" onclick="openCreateStudentModal()">
          + Setup New Student Account 🎓
        </button>
      </div>

      <!-- Analytics Cards Grid -->
      <div class="admin-analytics-grid">
        <div class="stat-card">
          <div id="statTotalStudents" class="stat-number">0</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-light);">Enrolled Students</div>
        </div>
        <div class="stat-card">
          <div id="statAvgProgress" class="stat-number">0%</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-light);">Average Course Completion</div>
        </div>
        <div class="stat-card">
          <div id="statManualAutoRatio" class="stat-number">0 / 0</div>
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-light);">Manual vs Auto Transmission</div>
        </div>
      </div>

      <!-- Student Directory Table -->
      <div class="student-progress-table-box" style="margin-top: 1.5rem; padding: 0;">
        <table class="student-progress-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Assigned Instructor</th>
              <th>Transmission</th>
              <th>Login Password</th>
              <th>Completed Lessons</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="adminStudentTableBody">
            <!-- Dynamically injected by renderAdminProgressTable() -->
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- TAB PANEL 2: SUBMENU TAB A - COURSE CONTENT EDITOR (CRUD) -->
  <section id="adminPanelContentEditor" class="admin-tab-panel hidden" role="tabpanel" aria-labelledby="adminTabContentEditor" hidden>
    <div class="admin-panel-card">
      <div class="admin-panel-header">
        <div>
          <span class="badge badge-primary mb-1">Curriculum Management</span>
          <h3 style="margin: 0;">Course Content Editor (Modules & Lessons CRUD)</h3>
          <p style="margin: 0.3rem 0 0; color: var(--text-light); font-size: 0.9rem;">
            Create, edit, or delete DVSA curriculum modules and video lessons. Changes update the student course hub dynamically.
          </p>
        </div>
        <button class="btn btn-primary" onclick="openAddModuleModal()">
          + Create New Module 📁
        </button>
      </div>

      <!-- Modules & Lessons Management List Container -->
      <div id="adminCourseCrudTree" class="admin-crud-tree">
        <!-- Dynamically rendered via renderAdminCourseCrud() -->
      </div>
    </div>
  </section>

  <!-- TAB PANEL 3: SUBMENU TAB B - ADVANCED SITE SETTINGS -->
  <section id="adminPanelSiteSettings" class="admin-tab-panel hidden" role="tabpanel" aria-labelledby="adminTabSiteSettings" hidden>
    <div class="admin-panel-card">
      <div class="admin-panel-header">
        <div>
          <span class="badge badge-primary mb-1">Global Configuration</span>
          <h3 style="margin: 0;">Advanced Site & Fleet Settings</h3>
          <p style="margin: 0.3rem 0 0; color: var(--text-light); font-size: 0.9rem;">
            Manage site text branding, instructor admin password, Instagram live feed API endpoint, and fleet showroom hotspot coordinates.
          </p>
        </div>
        <button class="btn btn-primary" onclick="saveAdminContentEditorSettings()">
          Save All Settings 💾
        </button>
      </div>

      <!-- SECTION 1: SITE TEXT & BRANDING EDITOR -->
      <div class="admin-editor-section">
        <h4 style="margin: 0 0 0.5rem; font-size: 1.15rem;">📝 Site Content & Branding Text</h4>
        <div class="editor-grid-2" style="margin-bottom: 1rem;">
          <div>
            <label for="editHeroBadge" style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Hero Badge Text</label>
            <input type="text" id="editHeroBadge" class="portal-input">
          </div>
          <div>
            <label for="editContactPhone" style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Contact Phone</label>
            <input type="text" id="editContactPhone" class="portal-input">
          </div>
        </div>
        <div style="margin-bottom: 1rem;">
          <label for="editHeroHeading" style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Hero Heading (HTML allowed)</label>
          <input type="text" id="editHeroHeading" class="portal-input">
        </div>
        <div style="margin-bottom: 1rem;">
          <label for="editHeroText" style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Hero Description</label>
          <textarea id="editHeroText" class="portal-input" style="height: 70px; resize: vertical;"></textarea>
        </div>
        <div>
          <label for="editContactLocation" style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Contact Location</label>
          <input type="text" id="editContactLocation" class="portal-input">
        </div>
      </div>

      <!-- SECTION 2: ADMIN CREDENTIALS MANAGEMENT -->
      <div class="admin-editor-section">
        <h4 style="margin: 0 0 0.5rem; font-size: 1.15rem;">🛡️ Instructor Admin Account Credentials</h4>
        <div class="editor-grid-2">
          <div>
            <label for="editAdminUsername" style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Admin Username</label>
            <input type="text" id="editAdminUsername" class="portal-input">
          </div>
          <div>
            <label for="editAdminPassword" style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Admin Password</label>
            <input type="password" id="editAdminPassword" class="portal-input">
          </div>
        </div>
      </div>

      <!-- SECTION 3: INSTAGRAM API ENDPOINT & SETUP GUIDE -->
      <div class="admin-editor-section">
        <h4 style="margin: 0 0 0.5rem; font-size: 1.15rem;">📸 Instagram API Endpoint & Integration Guide (@lrnr2drvr)</h4>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:0.75rem;">
          Paste your live Instagram Basic Display API endpoint or Behold JSON endpoint.
        </p>
        <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
          <input type="text" id="editInstaEndpoint" class="portal-input" style="margin-bottom:0;" placeholder="https://graph.instagram.com/me/media?fields=... or https://behold.so/api/v1/get/...">
          <button class="btn btn-secondary" onclick="testInstagramApiConnection()">Test API 🔌</button>
        </div>
        
        <!-- Setup Guide Box -->
        <div class="insta-guide-box">
          <strong style="color: var(--color-green); font-size: 0.9rem;">💡 Quick Instagram API Setup Instructions:</strong>
          <ol style="margin: 0.5rem 0 0 1.25rem; font-size: 0.85rem; color: var(--text-main); line-height: 1.6;">
            <li>Log into <a href="https://developers.facebook.com/" target="_blank" rel="noopener">Meta for Developers</a> and create an app with <strong>Instagram Basic Display</strong>.</li>
            <li>Add `@lrnr2drvr` as an Instagram Tester and accept the invitation in Instagram Settings -> Apps & Websites.</li>
            <li>Generate an <code>User Access Token</code> and copy your Graph API request URL into the field above.</li>
            <li>Alternatively, register a free JSON widget endpoint at <a href="https://behold.so" target="_blank" rel="noopener">Behold.so</a> for zero-config token refresh.</li>
          </ol>
        </div>
      </div>

      <!-- SECTION 4: SHOWROOM FLEET HOTSPOT EDITOR -->
      <div class="admin-editor-section">
        <h4 style="margin: 0 0 0.5rem; font-size: 1.15rem;">🚗 Showroom Fleet Hotspot Point Adjuster</h4>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:1rem;">
          Adjust X% (horizontal) and Y% (vertical) positions and descriptions for Toyota Yaris and Kona EV interactive badges.
        </p>
        <!-- Hotspots input controls rendered via renderAdminContentEditor() -->
        <div id="fleetHotspotFieldsContainer"></div>
      </div>
    </div>
  </section>
</div>

<!-- ENHANCED CREATE / EDIT STUDENT ACCOUNT MODAL OVERLAY -->
<div id="studentAccountModalBackdrop" class="student-portal-gate" style="display: none;">
  <div class="student-portal-card">
    <div style="margin-bottom: 1.25rem;">
      <span class="badge badge-primary mb-1">Student Management</span>
      <h2 id="studentAccountModalTitle" style="margin: 0;">Setup New Student Account</h2>
      <p style="font-size: 0.92rem; color: var(--text-light); margin-top: 0.4rem;">
        Configure login credentials and transmission assignment for the student.
      </p>
    </div>

    <div style="text-align: left; margin-bottom: 1.5rem;">
      <input type="hidden" id="studentAccountOldName" value="">
      
      <label for="studentAccountNameInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Student Full Name / Username:
      </label>
      <input type="text" id="studentAccountNameInput" class="portal-input" placeholder="e.g. Farhan Hussaini" required>

      <label for="studentAccountPasswordInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Student Portal Password:
      </label>
      <input type="password" id="studentAccountPasswordInput" class="portal-input" placeholder="Enter student password" required>

      <label for="studentAccountTransmissionSelect" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Transmission Course Type:
      </label>
      <select id="studentAccountTransmissionSelect" class="portal-input">
        <option value="Manual">Manual Transmission 🕹️</option>
        <option value="Automatic">Automatic Transmission ⚡</option>
      </select>

      <label for="studentAccountInstructorSelect" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Assigned Driving Instructor:
      </label>
      <select id="studentAccountInstructorSelect" class="portal-input" style="margin-bottom: 0;">
        <option value="Farhan Hussaini">Farhan Hussaini (Manual & Auto)</option>
        <option value="Binish Moazzam">Binish Moazzam (Female Instructor)</option>
      </select>
    </div>

    <div style="display: flex; gap: 0.75rem;">
      <button class="btn btn-secondary w-full" onclick="closeStudentAccountModal()">Cancel</button>
      <button class="btn btn-primary w-full" onclick="saveStudentAccountModal()">Save Student Account 💾</button>
    </div>
  </div>
</div>
```

---

### C. JavaScript Tab Event Handlers & State Functions (For `js/course-player.js`)

```javascript
/**
 * Admin Hub Tab Switching Logic & Keyboard Accessibility
 */
window.switchAdminTab = function(tabName) {
  const tabs = {
    'students': { btn: 'adminTabStudents', panel: 'adminPanelStudents' },
    'content-editor': { btn: 'adminTabContentEditor', panel: 'adminPanelContentEditor' },
    'site-settings': { btn: 'adminTabSiteSettings', panel: 'adminPanelSiteSettings' }
  };

  if (!tabs[tabName]) return;

  Object.keys(tabs).forEach(key => {
    const btn = document.getElementById(tabs[key].btn);
    const panel = document.getElementById(tabs[key].panel);
    if (!btn || !panel) return;

    if (key === tabName) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      panel.classList.remove('hidden');
      panel.removeAttribute('hidden');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
      panel.classList.add('hidden');
      panel.setAttribute('hidden', 'true');
    }
  });

  // Re-render specific tab contents when active
  if (tabName === 'students') {
    renderAdminProgressTable();
  } else if (tabName === 'content-editor') {
    renderAdminCourseCrud();
  } else if (tabName === 'site-settings') {
    renderAdminContentEditor();
  }
};

/**
 * Keyboard Navigation for ARIA tablist
 */
document.addEventListener('keydown', (e) => {
  const activeTabBtn = document.activeElement;
  if (!activeTabBtn || !activeTabBtn.classList.contains('admin-tab-btn')) return;

  const tabBtns = Array.from(document.querySelectorAll('.admin-tab-group .admin-tab-btn'));
  let index = tabBtns.indexOf(activeTabBtn);
  if (index === -1) return;

  if (e.key === 'ArrowRight') {
    index = (index + 1) % tabBtns.length;
    tabBtns[index].focus();
    tabBtns[index].click();
  } else if (e.key === 'ArrowLeft') {
    index = (index - 1 + tabBtns.length) % tabBtns.length;
    tabBtns[index].focus();
    tabBtns[index].click();
  } else if (e.key === 'Home') {
    tabBtns[0].focus();
    tabBtns[0].click();
  } else if (e.key === 'End') {
    tabBtns[tabBtns.length - 1].focus();
    tabBtns[tabBtns.length - 1].click();
  }
});

/**
 * Render Analytics & Student Progress Table
 */
function renderAdminProgressTable() {
  const tableBody = document.getElementById('adminStudentTableBody');
  const container = document.getElementById('adminHubContainer');
  if (!container) return;

  if (!courseState.isAdmin) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  const totalLessons = countTotalLessons();
  const students = Object.keys(courseState.studentProgress);
  let totalCompPct = 0;
  let manualCount = 0;
  let autoCount = 0;

  const rowsHtml = students.map(studentName => {
    const data = courseState.studentProgress[studentName] || {};
    const compCount = (data.completed || []).length;
    const pct = totalLessons > 0 ? Math.min(100, Math.round((compCount / totalLessons) * 100)) : 0;
    totalCompPct += pct;

    const trans = data.transmission || 'Manual';
    if (trans === 'Automatic') autoCount++; else manualCount++;
    const pass = data.password ? '••••••••' : 'Default (None)';

    return `
      <tr>
        <td><strong>👤 ${studentName}</strong></td>
        <td><span class="badge badge-secondary">${data.instructor || 'Farhan Hussaini'}</span></td>
        <td><span class="badge ${trans === 'Automatic' ? 'badge-warning' : 'badge-primary'}">${trans}</span></td>
        <td><code style="font-size: 0.8rem;">${pass}</code></td>
        <td>${compCount} / ${totalLessons}</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <strong style="color: var(--color-green);">${pct}%</strong>
            <div style="width: 70px; height: 6px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: var(--color-green);"></div>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn btn-secondary btn-sm" onclick="openEditStudentModal('${studentName}')" style="padding: 4px 8px; font-size: 0.75rem;">Edit</button>
            <button class="btn btn-secondary btn-sm" onclick="resetStudentProgress('${studentName}')" style="padding: 4px 8px; font-size: 0.75rem;">Reset</button>
            <button class="btn btn-accent btn-sm" onclick="deleteStudentAccount('${studentName}')" style="padding: 4px 8px; font-size: 0.75rem; background: var(--color-red, #EF4444); border-color: var(--color-red, #EF4444); color: #FFF;">Remove</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (tableBody) tableBody.innerHTML = rowsHtml;

  // Update Stats
  const statStudents = document.getElementById('statTotalStudents');
  const statAvg = document.getElementById('statAvgProgress');
  const statRatio = document.getElementById('statManualAutoRatio');

  if (statStudents) statStudents.textContent = students.length;
  if (statAvg) statAvg.textContent = students.length > 0 ? `${Math.round(totalCompPct / students.length)}%` : '0%';
  if (statRatio) statRatio.textContent = `${manualCount} M / ${autoCount} A`;
}

/**
 * Open Modal to Create/Edit Student Profile
 */
window.openCreateStudentModal = function() {
  const modal = document.getElementById('studentAccountModalBackdrop');
  const title = document.getElementById('studentAccountModalTitle');
  const oldName = document.getElementById('studentAccountOldName');
  const nameInput = document.getElementById('studentAccountNameInput');
  const passInput = document.getElementById('studentAccountPasswordInput');
  const transSelect = document.getElementById('studentAccountTransmissionSelect');
  const instSelect = document.getElementById('studentAccountInstructorSelect');

  if (!modal) return;
  if (title) title.textContent = 'Setup New Student Account';
  if (oldName) oldName.value = '';
  if (nameInput) nameInput.value = '';
  if (passInput) passInput.value = '';
  if (transSelect) transSelect.value = 'Manual';
  if (instSelect) instSelect.value = 'Farhan Hussaini';

  modal.style.display = 'flex';
};

window.openEditStudentModal = function(studentName) {
  const data = courseState.studentProgress[studentName];
  if (!data) return;

  const modal = document.getElementById('studentAccountModalBackdrop');
  const title = document.getElementById('studentAccountModalTitle');
  const oldName = document.getElementById('studentAccountOldName');
  const nameInput = document.getElementById('studentAccountNameInput');
  const passInput = document.getElementById('studentAccountPasswordInput');
  const transSelect = document.getElementById('studentAccountTransmissionSelect');
  const instSelect = document.getElementById('studentAccountInstructorSelect');

  if (!modal) return;
  if (title) title.textContent = `Edit Student Profile: ${studentName}`;
  if (oldName) oldName.value = studentName;
  if (nameInput) nameInput.value = studentName;
  if (passInput) passInput.value = data.password || '';
  if (transSelect) transSelect.value = data.transmission || 'Manual';
  if (instSelect) instSelect.value = data.instructor || 'Farhan Hussaini';

  modal.style.display = 'flex';
};

window.closeStudentAccountModal = function() {
  const modal = document.getElementById('studentAccountModalBackdrop');
  if (modal) modal.style.display = 'none';
};

window.saveStudentAccountModal = function() {
  const oldName = document.getElementById('studentAccountOldName')?.value;
  const newName = document.getElementById('studentAccountNameInput')?.value.trim();
  const password = document.getElementById('studentAccountPasswordInput')?.value.trim();
  const transmission = document.getElementById('studentAccountTransmissionSelect')?.value || 'Manual';
  const instructor = document.getElementById('studentAccountInstructorSelect')?.value || 'Farhan Hussaini';

  if (!newName) {
    alert('Please enter a student username.');
    return;
  }

  if (!oldName && courseState.studentProgress[newName]) {
    alert(`Account "${newName}" already exists!`);
    return;
  }

  const existingCompleted = oldName && courseState.studentProgress[oldName] ? courseState.studentProgress[oldName].completed : [];

  const updatedRecord = {
    instructor,
    transmission,
    password,
    completed: existingCompleted
  };

  if (oldName && oldName !== newName) {
    delete courseState.studentProgress[oldName];
  }

  courseState.studentProgress[newName] = updatedRecord;
  saveLMSStateToStorage();
  closeStudentAccountModal();
  renderAdminProgressTable();
  showToast(`Saved student account: ${newName} 🎉`);
};

/**
 * Instagram API Endpoint Live Tester
 */
window.testInstagramApiConnection = function() {
  const url = document.getElementById('editInstaEndpoint')?.value.trim();
  if (!url) {
    alert('Please enter an Instagram API endpoint URL to test.');
    return;
  }
  showToast('Testing Instagram API connection... 🔌');
  fetch(url)
    .then(res => {
      if (res.ok) {
        alert('✅ Instagram API Endpoint connected successfully! Live posts ready.');
      } else {
        alert(`⚠️ API returned status ${res.status}. Check endpoint URL and access token permissions.`);
      }
    })
    .catch(err => {
      alert(`⚠️ Connection Error: Unable to fetch endpoint. (${err.message})`);
    });
};
```

---

### D. CSS Styling Rules (For `styles/course.css`)

```css
/* ==========================================================================
   RESTRUCTURED ADMIN HUB CONTAINER & ACCESSIBLE TAB NAV STYLES
   ========================================================================== */

.admin-hub-container {
  background: var(--bg-surface);
  border: 2px solid var(--color-green);
  border-radius: var(--radius-lg);
  padding: 1.75rem;
  margin-bottom: 2.5rem;
  box-shadow: var(--shadow-md);
}

.admin-hub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.admin-user-badge {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-green);
  background: rgba(46, 125, 50, 0.1);
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-full);
}

/* Primary & Submenu Navigation Bar */
.admin-nav-bar {
  margin: 1.25rem 0;
}

.admin-tab-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.admin-tab-btn {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.92rem;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
  outline: none;
}

.admin-tab-btn:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
}

.admin-tab-btn.active {
  color: var(--color-green);
  background: var(--bg-body);
  border-color: var(--color-green);
  box-shadow: 0 4px 0 var(--bg-body);
}

.admin-tab-btn:focus-visible {
  outline: 2px solid var(--color-green);
  outline-offset: 2px;
}

/* Tab Panels */
.admin-tab-panel {
  display: block;
}

.admin-tab-panel.hidden,
.admin-tab-panel[hidden] {
  display: none !important;
}

.admin-panel-card {
  background: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.75rem;
}

.admin-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* Analytics Cards Grid */
.admin-analytics-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .admin-analytics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Instagram Setup Guide Box */
.insta-guide-box {
  background: var(--bg-surface);
  border-left: 4px solid var(--color-green);
  padding: 1rem;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-top: 0.75rem;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .admin-tab-btn {
    width: 100%;
    text-align: left;
    border-radius: var(--radius-sm);
  }
  .admin-tab-group {
    border-bottom: none;
  }
}
```

---

## 5. Verification Method

To verify this implementation during Phase 2 Milestone 1 implementation:

1. **DOM Structure & Render Verification**:
   - Unlock admin mode by calling `openAdminLoginModal()` or typing credentials (`admin` / `Huzaifa1`).
   - Inspect `#adminHubContainer` in DevTools. Verify that only `#adminPanelStudents` is visible by default (`hidden` attribute absent).
2. **Tab Navigation & Keyboard Interactivity**:
   - Click `adminTabContentEditor` and `adminTabSiteSettings`. Verify that clicking each tab hides non-active panels and shows the target panel cleanly.
   - Use `Tab` key to focus on the active tab button, then press `ArrowRight` / `ArrowLeft`. Confirm keyboard focus moves smoothly and activates adjacent tabs.
3. **Student Account Setup & Data Persistence**:
   - Click "+ Setup New Student Account". Fill in username, password, select `Automatic` transmission and instructor. Save and verify that the new profile appears in the analytics table and persists in `localStorage.getItem('l2d_student_progress')`.
4. **Instagram API Connection Test**:
   - Navigate to Advanced Site Settings tab, enter an endpoint URL, click "Test API 🔌", and verify toast and alert response handling.
