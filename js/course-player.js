/**
 * ==========================================================================
 * LEARNER2DRIVER - VIDEO COURSE HUB & STUDENT LMS (course-player.js)
 * Web Crypto SHA-256 Hashed Passwords & Transmission-Tailored Syllabus
 * ==========================================================================
 */

let courseState = {
  activeLessonId: null,
  isAdmin: false,
  currentStudent: null,
  syllabusFilter: 'all',
  studentProgress: {
    'Farhan Hussaini': { instructor: 'Farhan Hussaini', transmission: 'Manual', completed: [] },
    'Ayesha Patel': { instructor: 'Farhan Hussaini', transmission: 'Automatic', completed: [] },
    'Liam O\'Connor': { instructor: 'Binish Moazzam', transmission: 'Manual', completed: [] }
  }
};

window.courseState = courseState;

function getAdminUsername() {
  try {
    return localStorage.getItem('l2d_admin_user') || 'admin';
  } catch(e) {
    return 'admin';
  }
}

/**
 * Web Crypto SHA-256 Password Security Helpers
 */
function generateSaltHex(lengthBytes = 16) {
  const array = new Uint8Array(lengthBytes);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, saltHex) {
  if (!password) password = '';
  if (!saltHex) saltHex = '';
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(inputPassword, storedSaltHex, storedHashHex) {
  if (!storedHashHex) return false;
  const hash = await hashPassword(inputPassword, storedSaltHex);
  return hash === storedHashHex;
}

/**
 * Migration Helper: Upgrade plain-text passwords to SHA-256 + Salt
 */
async function migrateCredentialsToSHA256() {
  try {
    const adminHash = localStorage.getItem('l2d_admin_password_hash');
    const adminSalt = localStorage.getItem('l2d_admin_password_salt');
    if (!adminHash || !adminSalt) {
      const legacyAdminPass = localStorage.getItem('l2d_admin_pass') || 'Huzaifa1';
      const salt = generateSaltHex(16);
      const hash = await hashPassword(legacyAdminPass, salt);
      localStorage.setItem('l2d_admin_password_salt', salt);
      localStorage.setItem('l2d_admin_password_hash', hash);
      localStorage.removeItem('l2d_admin_pass');
    } else {
      localStorage.removeItem('l2d_admin_pass');
    }
  } catch(e) {
    console.warn('Error migrating admin credentials to SHA-256:', e);
  }

  let stateModified = false;
  if (courseState.studentProgress && typeof courseState.studentProgress === 'object') {
    for (const studentName of Object.keys(courseState.studentProgress)) {
      const student = courseState.studentProgress[studentName];
      if (student && (student.password || !student.passwordHash)) {
        const plainPass = student.password || 'Learner2026!';
        const salt = generateSaltHex(16);
        const hash = await hashPassword(plainPass, salt);
        student.passwordSalt = salt;
        student.passwordHash = hash;
        delete student.password;
        stateModified = true;
      }
    }
  }
  if (stateModified) {
    saveLMSStateToStorage();
  }
}

window.generateSaltHex = generateSaltHex;
window.hashPassword = hashPassword;
window.verifyPassword = verifyPassword;
window.migrateCredentialsToSHA256 = migrateCredentialsToSHA256;

/**
 * Transmission Normalization & Math
 */
function normalizeTransmission(tx) {
  if (!tx || typeof tx !== 'string') return 'All';
  const clean = tx.trim().toLowerCase();
  if (clean.includes('manual')) return 'Manual';
  if (clean.includes('auto')) return 'Auto';
  return 'All';
}

function calculateStudentProgressMetrics(studentName) {
  const student = (courseState.studentProgress && courseState.studentProgress[studentName]) || { completed: [], transmission: 'Manual' };
  const completedSet = new Set(student.completed || []);
  const studentTx = normalizeTransmission(student.transmission);

  let overallTotal = 0;
  let overallCompleted = 0;
  let trackTotal = 0;
  let trackCompleted = 0;

  (window.COURSE_DATA || []).forEach(mod => {
    (mod.lessons || []).forEach(lesson => {
      overallTotal++;
      const isCompleted = completedSet.has(lesson.id);
      if (isCompleted) overallCompleted++;

      const lessonTx = normalizeTransmission(lesson.transmission);
      const isTrackMatch = (lesson.transmission === 'All' || lessonTx === studentTx);

      if (isTrackMatch) {
        trackTotal++;
        if (isCompleted) trackCompleted++;
      }
    });
  });

  const trackPercent = trackTotal > 0 ? Math.min(100, Math.round((trackCompleted / trackTotal) * 100)) : 0;
  const overallPercent = overallTotal > 0 ? Math.min(100, Math.round((overallCompleted / overallTotal) * 100)) : 0;

  return {
    studentTx,
    trackCompleted,
    trackTotal,
    trackPercent,
    overallCompleted,
    overallTotal,
    overallPercent
  };
}

window.normalizeTransmission = normalizeTransmission;
window.calculateStudentProgressMetrics = calculateStudentProgressMetrics;

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.loadCourseDataFromStorage === 'function') {
    window.loadCourseDataFromStorage();
  }
  loadLMSStateFromStorage();
  await migrateCredentialsToSHA256();
  initCoursePlayer();
  setupAdminTabKeyNav();
  checkAndApplyLMSComingSoonMode();
});

window.checkAndApplyLMSComingSoonMode = function() {
  const isComingSoon = localStorage.getItem('l2d_course_coming_soon') === 'true';
  const isAdmin = localStorage.getItem('l2d_is_admin') === 'true';
  let overlay = document.getElementById('lmsComingSoonOverlay');

  if (!isComingSoon) {
    if (overlay) overlay.remove();
    const mainSec = document.getElementById('lmsMainCourseContainer') || document.querySelector('.course-container');
    if (mainSec) mainSec.style.display = '';
    return;
  }

  const mainSec = document.getElementById('lmsMainCourseContainer') || document.querySelector('.course-container') || document.querySelector('main');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lmsComingSoonOverlay';
    overlay.className = 'container py-5 text-center';
    overlay.style.cssText = 'max-width: 820px; margin: 3rem auto; position: relative; z-index: 100;';
    
    if (mainSec && mainSec.parentNode) {
      mainSec.parentNode.insertBefore(overlay, mainSec);
    } else {
      document.body.prepend(overlay);
    }
  }

  if (mainSec) mainSec.style.display = 'none';

  overlay.innerHTML = `
    <div class="glass-card" style="padding: 3.5rem 2rem; border-radius: var(--radius-lg, 24px); background: var(--bg-surface); border: 2px solid var(--border-color); box-shadow: var(--shadow-xl); position: relative; overflow: hidden;">
      <div style="font-size: 3.5rem; margin-bottom: 1.25rem;">🎬</div>
      <span class="badge badge-accent mb-2" style="font-weight: 700; letter-spacing: 0.5px;">✨ VIDEO MODULES IN PRODUCTION</span>
      <h1 style="font-family: var(--font-heading); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800; margin: 0.75rem 0 1rem; color: var(--text-main);">
        Preston DVSA Video Curriculum <span class="text-gradient-primary">Coming Soon</span>
      </h1>
      <p style="font-size: 1.05rem; color: var(--text-light); max-width: 620px; margin: 0 auto 2rem; line-height: 1.6;">
        Farhan & Binish are currently filming and curating high-definition Preston test route walkthroughs, maneuver breakdowns, and student lesson modules. Check back soon!
      </p>
      
      <div style="display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; align-items: center; margin-bottom: 1.5rem;">
        <a href="index.html" class="btn btn-secondary btn-sm" style="padding: 0.75rem 1.4rem; font-weight: 700;">
          ← Return to Main Academy
        </a>
        <a href="index.html#book" class="btn btn-primary btn-sm" style="padding: 0.75rem 1.6rem; font-weight: 700; background: linear-gradient(135deg, var(--color-green, #10B981), #059669); border: none;">
          🚗 Book Practical Driving Lessons
        </a>
        <a href="tel:07427330827" class="btn btn-secondary btn-sm" style="padding: 0.75rem 1.4rem; font-weight: 700;">
          📞 Call 074-2733-0827
        </a>
      </div>

      ${isAdmin ? `
        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px dashed var(--border-color); font-size: 0.88rem; color: var(--text-muted);">
          <span style="color: var(--color-amber, #F57C00); font-weight: 700;">🛡️ Instructor Admin Mode Active:</span> Coming Soon mode is currently ACTIVE for website visitors. 
          <br>
          <button onclick="toggleLMSComingSoon()" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 0.35rem 0.85rem; margin-top: 0.5rem; font-weight: 700;">
            Turn Off Coming Soon Mode & Go Live 🌐
          </button>
        </div>
      ` : ''}
    </div>
  `;
};

function loadLMSStateFromStorage() {
  try {
    const savedStudent = localStorage.getItem('l2d_current_student');
    if (savedStudent && savedStudent.trim() !== '') {
      courseState.currentStudent = savedStudent;
    } else {
      courseState.currentStudent = null;
    }

    const savedProgress = localStorage.getItem('l2d_student_progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        if (parsed && typeof parsed === 'object') {
          courseState.studentProgress = parsed;
        }
      } catch(e) {}
    }

    const savedFilter = localStorage.getItem('l2d_syllabus_filter');
    if (savedFilter === 'all' || savedFilter === 'track') {
      courseState.syllabusFilter = savedFilter;
    } else {
      courseState.syllabusFilter = 'all';
    }

    if (localStorage.getItem('l2d_is_admin') === 'true') {
      courseState.isAdmin = true;
    }
  } catch(e) {}

  // Ensure default fields for student entries
  Object.keys(courseState.studentProgress || {}).forEach(name => {
    const sp = courseState.studentProgress[name];
    if (sp) {
      if (!sp.instructor) sp.instructor = 'Farhan Hussaini';
      if (!sp.transmission) sp.transmission = 'Manual';
      if (!Array.isArray(sp.completed)) sp.completed = [];
    }
  });

  const validLessonIds = new Set();
  (window.COURSE_DATA || []).forEach(mod => {
    (mod.lessons || []).forEach(l => validLessonIds.add(l.id));
  });
  if (validLessonIds.size > 0) {
    Object.keys(courseState.studentProgress || {}).forEach(name => {
      const sp = courseState.studentProgress[name];
      if (sp && Array.isArray(sp.completed)) {
        sp.completed = sp.completed.filter(id => validLessonIds.has(id));
      }
    });
  }
}

function saveLMSStateToStorage() {
  console.log('💾 saveLMSStateToStorage running for currentStudent:', courseState.currentStudent);
  try {
    if (courseState.currentStudent) {
      localStorage.setItem('l2d_current_student', courseState.currentStudent);
    } else {
      localStorage.removeItem('l2d_current_student');
    }
    localStorage.setItem('l2d_student_progress', JSON.stringify(courseState.studentProgress));
    if (courseState.syllabusFilter) {
      localStorage.setItem('l2d_syllabus_filter', courseState.syllabusFilter);
    }

    if (typeof window.syncSiteTextToSupabase === 'function') {
      console.log('🌐 Calling syncSiteTextToSupabase for l2d_student_progress_json...');
      window.syncSiteTextToSupabase('l2d_student_progress_json', JSON.stringify(courseState.studentProgress));
    } else {
      console.warn('⚠️ syncSiteTextToSupabase is NOT a function on window!');
    }

    if (typeof window.syncStudentToSupabase === 'function') {
      console.log('🎓 Calling syncStudentToSupabase for all student progress entries...');
      Object.keys(courseState.studentProgress || {}).forEach(name => {
        window.syncStudentToSupabase(name, courseState.studentProgress[name]);
      });
    } else {
      console.warn('⚠️ syncStudentToSupabase is NOT a function on window!');
    }

    if (typeof window.pushLocalDataToCloud === 'function') {
      window.pushLocalDataToCloud(false);
    }
  } catch(e) {
    console.error('❌ Exception in saveLMSStateToStorage:', e);
  }
}

window.saveLMSStateToStorage = saveLMSStateToStorage;

function initCoursePlayer() {
  checkStudentLoginGate();

  renderLMSHeaderBar();
  renderCurriculumSidebar();
  renderAdminHub();

  const hash = window.location.hash;
  if (hash === '#adminHubContainer' || hash === '#adminSettings' || hash === '#adminHub') {
    if (!courseState.isAdmin) {
      openAdminLoginModal();
    } else {
      const hub = document.getElementById('adminHubContainer');
      if (hub) {
        hub.style.display = 'block';
        hub.scrollIntoView({ behavior: 'smooth' });
      }
      if (hash === '#adminSettings' && typeof window.switchAdminTab === 'function') {
        window.switchAdminTab('adminTabSettings');
      }
    }
  }

  if (!courseState.activeLessonId) {
    const firstMod = (window.COURSE_DATA || [])[0];
    const firstLess = firstMod?.lessons?.[0];
    if (firstLess) {
      selectLesson(firstMod.id, firstLess.id, true);
    }
  } else {
    const mod = (window.COURSE_DATA || []).find(m => (m.lessons || []).some(l => l.id === courseState.activeLessonId));
    if (mod) {
      selectLesson(mod.id, courseState.activeLessonId, true);
    }
  }
}

function checkStudentLoginGate() {
  const gate = document.getElementById('studentPortalGate');
  if (!gate) return;

  const isAdmin = courseState.isAdmin || (localStorage.getItem('l2d_is_admin') === 'true');

  if (isAdmin || courseState.currentStudent) {
    gate.style.display = 'none';
  } else {
    gate.style.display = 'flex';
  }
}

/**
 * Student Authentication Logic
 */
async function authenticateStudent(username, plainPassword) {
  if (!username || !plainPassword || !username.trim() || !plainPassword.trim()) {
    return { success: false, error: "Please enter both username and password" };
  }

  const trimmedUser = username.trim();
  const studentKeys = Object.keys(courseState.studentProgress || {});
  const studentKey = studentKeys.find(k => k.toLowerCase() === trimmedUser.toLowerCase());

  if (!studentKey) {
    return { success: false, error: "Student username not found" };
  }

  const student = courseState.studentProgress[studentKey];
  if (!student) {
    return { success: false, error: "Student username not found" };
  }

  let isMatch = false;
  if (student.passwordHash && student.passwordSalt) {
    isMatch = await verifyPassword(plainPassword, student.passwordSalt, student.passwordHash);
  } else if (student.password) {
    if (student.password === plainPassword) {
      isMatch = true;
      student.passwordSalt = generateSaltHex(16);
      student.passwordHash = await hashPassword(plainPassword, student.passwordSalt);
      delete student.password;
      saveLMSStateToStorage();
    }
  }

  if (!isMatch) {
    return { success: false, error: "Incorrect password" };
  }

  courseState.currentStudent = studentKey;
  saveLMSStateToStorage();
  return { success: true, studentName: studentKey };
}

window.authenticateStudent = authenticateStudent;

window.submitStudentPortalLogin = async function(event) {
  if (event && event.preventDefault) event.preventDefault();

  const nameInput = document.getElementById('portalStudentUsername') || document.getElementById('portalStudentName');
  const passInput = document.getElementById('portalStudentPassword');
  const errEl = document.getElementById('portalStudentLoginError');

  if (errEl) errEl.textContent = '';

  const username = nameInput ? nameInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  const res = await authenticateStudent(username, password);

  if (!res.success) {
    if (errEl) {
      errEl.textContent = res.error;
    } else {
      alert(res.error);
    }
    return;
  }

  if (passInput) passInput.value = '';
  if (errEl) errEl.textContent = '';

  checkStudentLoginGate();
  renderLMSHeaderBar();
  renderCurriculumSidebar();
  showToast(`Welcome back, ${res.studentName}! LMS Dashboard Unlocked`);
};

/**
 * Admin Authentication Handler
 */
window.openAdminLoginModal = async function() {
  const modal = document.getElementById('adminLoginModalBackdrop');
  if (!modal) {
    const user = prompt('Instructor Admin Username:', getAdminUsername());
    if (user === null) return;
    const pass = prompt('Instructor Admin Password:', '');
    if (pass === null) return;

    const storedUser = getAdminUsername();
    const storedSalt = localStorage.getItem('l2d_admin_password_salt');
    const storedHash = localStorage.getItem('l2d_admin_password_hash');

    let isValid = false;
    if (user.trim() === storedUser && storedSalt && storedHash) {
      isValid = await verifyPassword(pass, storedSalt, storedHash);
    }

    if (isValid) {
      courseState.isAdmin = true;
      localStorage.setItem('l2d_is_admin', 'true');
      localStorage.setItem('l2d_admin_user', user);
      saveLMSStateToStorage();
      checkStudentLoginGate();
      renderLMSHeaderBar();
      renderAdminHub();
      if (typeof window.initAdminTopBar === 'function') {
        window.initAdminTopBar();
      }
      showToast(`Admin Mode Unlocked (${user})!`);
    } else {
      alert(`Invalid Admin Credentials.`);
    }
    return;
  }

  const userEl = document.getElementById('adminLoginUsername');
  const passEl = document.getElementById('adminLoginPassword');
  const errEl = document.getElementById('adminLoginError');

  if (userEl) userEl.value = getAdminUsername();
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

  const storedUser = getAdminUsername();
  const storedSalt = localStorage.getItem('l2d_admin_password_salt');
  const storedHash = localStorage.getItem('l2d_admin_password_hash');

  let isValid = false;
  if (user === storedUser && storedSalt && storedHash) {
    isValid = await verifyPassword(pass, storedSalt, storedHash);
  } else if (user === storedUser) {
    const legacyPass = localStorage.getItem('l2d_admin_pass') || 'Huzaifa1';
    if (pass === legacyPass) {
      isValid = true;
      const newSalt = generateSaltHex(16);
      const newHash = await hashPassword(pass, newSalt);
      localStorage.setItem('l2d_admin_password_salt', newSalt);
      localStorage.setItem('l2d_admin_password_hash', newHash);
      localStorage.removeItem('l2d_admin_pass');
    }
  }

  if (isValid) {
    courseState.isAdmin = true;
    localStorage.setItem('l2d_is_admin', 'true');
    localStorage.setItem('l2d_admin_user', user);
    saveLMSStateToStorage();
    closeAdminLoginModal();
    checkStudentLoginGate();
    renderLMSHeaderBar();
    renderAdminHub();
    if (typeof window.initAdminTopBar === 'function') {
      window.initAdminTopBar();
    }
    showToast(`Admin Mode Unlocked (${user})!`);
  } else {
    if (errEl) {
      errEl.textContent = 'Invalid Admin Credentials.';
    } else {
      alert('Invalid Admin Credentials.');
    }
  }
};

window.logoutStudent = function() {
  const wasAdmin = courseState.isAdmin || (localStorage.getItem('l2d_is_admin') === 'true');
  courseState.currentStudent = null;
  courseState.isAdmin = false;
  localStorage.removeItem('l2d_is_admin');
  localStorage.removeItem('l2d_admin_editing_mode');
  localStorage.removeItem('l2d_admin_user');
  document.body.classList.remove('admin-edit-mode');
  saveLMSStateToStorage();

  if (wasAdmin) {
    if (typeof window.showToast === 'function') showToast('Logged out of Admin Mode 🚪');
    // Cleanly redirect to main landing page index.html instead of showing student login gate
    window.location.href = 'index.html';
  } else {
    checkStudentLoginGate();
    renderLMSHeaderBar();
    renderAdminHub();
    if (typeof window.initAdminTopBar === 'function') {
      window.initAdminTopBar();
    }
    showToast('Logged out of LMS.');
  }
};

window.setSyllabusFilter = function(filterMode) {
  if (filterMode !== 'all' && filterMode !== 'track') return;
  courseState.syllabusFilter = filterMode;
  try {
    localStorage.setItem('l2d_syllabus_filter', filterMode);
  } catch(e) {}
  renderCurriculumSidebar();
};

/**
 * Top LMS Progress & Header Bar
 */
function renderLMSHeaderBar() {
  const bar = document.getElementById('studentLMSBar');
  if (!bar) return;

  if (courseState.isAdmin && !courseState.currentStudent) {
    bar.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.85rem; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <span class="badge badge-primary">Admin Mode</span>
          <strong style="color: var(--text-main); font-size: 1.05rem;">Instructor Command Hub Active</strong>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="openCreateStudentModal()">+ Setup Student Account</button>
          <button class="btn btn-accent btn-sm" onclick="logoutStudent()">Log Out Admin</button>
        </div>
      </div>
    `;
    return;
  }

  if (!courseState.currentStudent) {
    bar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <span class="badge badge-primary">Student LMS</span>
        <strong style="color: var(--text-light);">Not Logged In</strong>
        <button class="btn btn-primary btn-sm" onclick="checkStudentLoginGate()">Student Login</button>
      </div>
    `;
    return;
  }

  const metrics = calculateStudentProgressMetrics(courseState.currentStudent);
  const isAuto = metrics.studentTx === 'Auto';
  const trackLabel = isAuto ? 'Automatic Track (Kona EV)' : 'Manual Track (Yaris)';
  const trackBadgeClass = isAuto ? 'badge-transmission-auto' : 'badge-transmission-manual';

  bar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
      <span class="badge badge-primary">${courseState.isAdmin ? 'Admin Mode' : 'Student LMS'}</span>
      <strong style="color: var(--text-main); font-size: 1.05rem;">${courseState.currentStudent}</strong>
      <span class="badge ${trackBadgeClass}">${trackLabel}</span>
      <button class="btn btn-secondary btn-sm" onclick="logoutStudent()" style="padding: 0.25rem 0.7rem; font-size: 0.78rem;">Switch Profile / Log Out</button>
    </div>
    <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
      <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-green);">
        Track Progress: ${metrics.trackCompleted}/${metrics.trackTotal} (${metrics.trackPercent}%)
        <div style="width: 120px; height: 8px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden; margin-top: 3px;">
          <div style="width: ${metrics.trackPercent}%; height: 100%; background: var(--color-green); transition: width 0.4s ease;"></div>
        </div>
      </div>
      <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-light);">
        Overall Progress: ${metrics.overallCompleted}/${metrics.overallTotal} (${metrics.overallPercent}%)
        <div style="width: 120px; height: 8px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden; margin-top: 3px;">
          <div style="width: ${metrics.overallPercent}%; height: 100%; background: #3B82F6; transition: width 0.4s ease;"></div>
        </div>
      </div>
    </div>
  `;
}

function countTotalLessons() {
  let count = 0;
  (window.COURSE_DATA || []).forEach(mod => {
    count += (mod.lessons || []).length;
  });
  return count;
}

/**
 * Curriculum Sidebar Renderer with Transmission Track Highlight & Filter Toggle
 */
function renderCurriculumSidebar() {
  const container = document.getElementById('curriculumTree');
  const countBadge = document.getElementById('moduleCountBadge');
  if (countBadge) countBadge.textContent = `${(window.COURSE_DATA || []).length} Modules`;
  if (!container) return;

  const activeStudent = courseState.currentStudent;
  const studentData = (courseState.studentProgress && courseState.studentProgress[activeStudent]) || { completed: [] };
  const completedSet = new Set(studentData.completed || []);
  const studentTx = normalizeTransmission(studentData.transmission);
  const filterMode = courseState.syllabusFilter || 'all';

  const filterToggleHtml = `
    <div style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
      <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
        Syllabus Filter:
      </div>
      <div style="display: flex; gap: 6px; background: var(--bg-body); padding: 3px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
        <button class="syllabus-toggle-btn ${filterMode === 'all' ? 'active' : ''}" onclick="setSyllabusFilter('all')" style="flex:1;">
          All Lessons
        </button>
        <button class="syllabus-toggle-btn ${filterMode === 'track' ? 'active' : ''}" onclick="setSyllabusFilter('track')" style="flex:1;">
          My Track Only
        </button>
      </div>
    </div>
  `;

  const modulesHtml = (window.COURSE_DATA || []).map(module => {
    let lessons = module.lessons || [];

    if (filterMode === 'track') {
      lessons = lessons.filter(l => {
        const lTx = normalizeTransmission(l.transmission);
        return l.transmission === 'All' || lTx === studentTx;
      });
    }

    if (lessons.length === 0) return '';

    return `
      <div class="module-group">
        <div class="module-header">
          <span>📁 ${module.title}</span>
          <span class="badge badge-primary" style="font-size: 0.7rem;">${lessons.length}</span>
        </div>
        <ul class="lesson-list">
          ${lessons.map(lesson => {
            const isDone = completedSet.has(lesson.id);
            const isAct = courseState.activeLessonId === lesson.id;
            const lTx = normalizeTransmission(lesson.transmission);

            let itemClass = 'lesson-item';
            let badgeHtml = '';

            if (lesson.transmission === 'All') {
              itemClass += ' track-universal';
              badgeHtml = `<span class="badge badge-transmission-all" style="font-size:0.65rem; padding:1px 6px;">Core Track</span>`;
            } else if (lTx === studentTx) {
              if (studentTx === 'Auto') {
                itemClass += ' track-match-auto';
                badgeHtml = `<span class="badge badge-transmission-auto" style="font-size:0.65rem; padding:1px 6px;">My Track (Kona EV)</span>`;
              } else {
                itemClass += ' track-match-manual';
                badgeHtml = `<span class="badge badge-transmission-manual" style="font-size:0.65rem; padding:1px 6px;">My Track (Yaris)</span>`;
              }
            } else {
              itemClass += ' track-off';
              const offText = lTx === 'Auto' ? 'Auto Only' : 'Manual Only';
              badgeHtml = `<span class="badge badge-secondary" style="font-size:0.65rem; padding:1px 6px;">${offText}</span>`;
            }

            if (isAct) itemClass += ' active';

            return `
              <li class="${itemClass}" onclick="selectLesson('${module.id}', '${lesson.id}')">
                <div style="display:flex; flex-direction:column; gap:2px; overflow:hidden;">
                  <span style="display:flex; align-items:center; gap:6px; font-weight:${isAct ? '700' : '500'};">
                    <span style="color: ${isDone ? 'var(--color-green)' : 'var(--text-light)'};">
                      ${isDone ? '✓' : '•'}
                    </span>
                    <span style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${lesson.title}</span>
                  </span>
                  <div style="display:flex; align-items:center; gap:6px; margin-left:14px;">
                    ${badgeHtml}
                    <span style="font-size:0.72rem; color:var(--text-light);">${lesson.duration || ''}</span>
                  </div>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  }).join('');

  container.innerHTML = filterToggleHtml + (modulesHtml || '<div style="padding:1rem; text-align:center; color:var(--text-light); font-size:0.88rem;">No lessons match the selected track filter.</div>');
}

window.renderCurriculumSidebar = renderCurriculumSidebar;

window.selectLesson = function(moduleId, lessonId, isInitialLoad) {
  courseState.activeLessonId = lessonId;
  const mod = (window.COURSE_DATA || []).find(m => m.id === moduleId);
  if (!mod) return;
  const lesson = (mod.lessons || []).find(l => l.id === lessonId);
  if (!lesson) return;

  renderLessonTheater(lesson);
  renderCurriculumSidebar();

  if (!isInitialLoad) {
    const videoBox = document.getElementById('lmsMainCourseContainer') || document.querySelector('.video-theater-box');
    if (videoBox) {
      videoBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

function renderLessonTheater(lesson) {
  const titleEl = document.getElementById('activeLessonTitle');
  const metaEl = document.getElementById('activeLessonMeta');
  const tipEl = document.getElementById('activeLessonTip');
  const frameEl = document.getElementById('activeVideoFrame');
  const checkBtnContainer = document.getElementById('lessonCheckBtnContainer');

  if (titleEl) {
    titleEl.setAttribute('data-editable-key', `lesson_${lesson.id}_title`);
    titleEl.textContent = lesson.title;
  }
  let transText = 'All Transmissions';
  if (lesson.transmission === 'Manual') transText = 'Manual (Yaris)';
  if (lesson.transmission === 'Auto' || lesson.transmission === 'Automatic') transText = 'Automatic (Kona EV)';

  if (metaEl) {
    metaEl.setAttribute('data-editable-key', `lesson_${lesson.id}_meta`);
    metaEl.textContent = `⏱️ ${lesson.duration} • ${transText}`;
  }
  if (tipEl) {
    tipEl.setAttribute('data-editable-key', `lesson_${lesson.id}_tip`);
    tipEl.textContent = lesson.instructorTip || lesson.tips || 'Always check your blind spot before moving off!';
  }

  const studentData = (courseState.studentProgress && courseState.studentProgress[courseState.currentStudent]) || { completed: [] };
  const isDone = (studentData.completed || []).includes(lesson.id);

  if (checkBtnContainer) {
    checkBtnContainer.innerHTML = `
      <button class="complete-lesson-btn ${isDone ? 'completed' : ''}" onclick="toggleLessonComplete('${lesson.id}')">
        ${isDone ? '✓ Completed' : '○ Mark as Completed'}
      </button>
    `;
  }

  const yt = (typeof window.parseYouTubeUrl === 'function') 
    ? window.parseYouTubeUrl(lesson.youtubeUrl || lesson.embedUrl || lesson.videoId) 
    : { videoId: lesson.videoId || 'dQw4w9WgXcQ', embedUrl: lesson.embedUrl };

  const ytId = yt.videoId || lesson.videoId || extractYouTubeID(lesson.youtubeUrl) || 'dQw4w9WgXcQ';
  const posterUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;

  const videoWrapper = frameEl ? frameEl.parentElement : document.querySelector('.video-frame-wrapper');
  if (videoWrapper) {
    videoWrapper.style.position = 'relative';
    videoWrapper.style.width = '100%';
    videoWrapper.style.paddingTop = '56.25%'; // 16:9 aspect ratio
    videoWrapper.style.height = '0';
    videoWrapper.style.overflow = 'hidden';
    videoWrapper.style.borderRadius = 'var(--radius-lg)';
    videoWrapper.style.background = '#000';

    videoWrapper.innerHTML = `
      <div id="ytPosterContainer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="playLessonVideoNow('${ytId}')">
        <img src="${posterUrl}" alt="${lesson.title}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: transform 0.3s ease;" onmouseenter="this.style.transform='scale(1.03)'" onmouseleave="this.style.transform='scale(1)'" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop'">
        <div style="position: relative; z-index: 2; text-align: center; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(8px); padding: 1.25rem 1.75rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,0.2); max-width: 85%;">
          <div style="width: 58px; height: 58px; border-radius: 50%; background: #FF0000; color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin: 0 auto 0.75rem; box-shadow: 0 0 20px rgba(255,0,0,0.6);">▶</div>
          <h3 style="color: #FFF; font-size: 1.1rem; font-weight: 700; margin: 0 0 0.3rem 0;">${lesson.title}</h3>
          <span style="font-size: 0.82rem; color: #CBD5E1;">Click to Start Video • Preston DVSA Syllabus</span>
        </div>
      </div>
    `;
  }

  window.playLessonVideoNow = function(videoId) {
    if (!videoWrapper) return;

    // Check if running on local file:// filesystem protocol where YouTube blocks iframe embeds (Error 153)
    if (window.location.protocol === 'file:') {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
      videoWrapper.innerHTML = `
        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: #0F172A; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;"></div>
          <h3 style="color: #FFF; font-size: 1.15rem; margin-bottom: 0.5rem;">Playing Video on YouTube ↗</h3>
          <p style="color: #94A3B8; font-size: 0.88rem; max-width: 480px; margin-bottom: 1.25rem;">
            Opened in new tab! (YouTube security policy blocks iframe embeds on local file:// paths; works natively on web servers).
          </p>
          <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="btn btn-primary btn-sm" style="background: #FF0000; border: none; font-weight: 700;">
            Re-open Video on YouTube (Full HD) ↗
          </a>
        </div>
      `;
      return;
    }

    const cleanEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    videoWrapper.innerHTML = `
      <iframe id="activeVideoFrame" src="${cleanEmbedUrl}" title="Lesson Video Embed" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="position: absolute; top:0; left:0; width: 100%; height: 100%; border: none; border-radius: var(--radius-lg);"></iframe>
    `;

    // Automatically fetch duration from YouTube IFrame Player API
    loadYouTubeIframeApiIfNeeded();
    let attempts = 0;
    const hookYtPlayer = () => {
      attempts++;
      if (window.YT && window.YT.Player) {
        try {
          new window.YT.Player('activeVideoFrame', {
            events: {
              'onReady': (event) => {
                const dur = event.target.getDuration();
                if (dur && dur > 0) {
                  const m = Math.floor(dur / 60);
                  const s = Math.floor(dur % 60);
                  const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
                  autoSaveLessonDuration(courseState.activeLessonId, formatted);
                }
              },
              'onStateChange': (event) => {
                if (event.target && typeof event.target.getDuration === 'function') {
                  const dur = event.target.getDuration();
                  if (dur && dur > 0) {
                    const m = Math.floor(dur / 60);
                    const s = Math.floor(dur % 60);
                    const formatted = `${m}:${s < 10 ? '0' : ''}${s}`;
                    autoSaveLessonDuration(courseState.activeLessonId, formatted);
                  }
                }
              }
            }
          });
        } catch(e) {}
      } else if (attempts < 10) {
        setTimeout(hookYtPlayer, 500);
      }
    };
    setTimeout(hookYtPlayer, 600);
  };

  function loadYouTubeIframeApiIfNeeded() {
    if (window.YT && window.YT.Player) return;
    if (document.getElementById('ytIframeApiScript')) return;
    const tag = document.createElement('script');
    tag.id = 'ytIframeApiScript';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  function autoSaveLessonDuration(lessonId, formattedDuration) {
    if (!lessonId || !formattedDuration) return;
    for (const mod of (window.COURSE_DATA || [])) {
      const les = (mod.lessons || []).find(l => l.id === lessonId);
      if (les && les.duration !== formattedDuration) {
        les.duration = formattedDuration;
        const metaEl = document.getElementById('activeLessonMeta');
        if (metaEl) {
          let transText = 'All Transmissions';
          if (les.transmission === 'Manual') transText = 'Manual (Yaris)';
          if (les.transmission === 'Auto' || les.transmission === 'Automatic') transText = 'Automatic (Kona EV)';
          metaEl.textContent = `⏱️ ${formattedDuration} • ${transText}`;
        }
        if (typeof window.saveCourseDataToStorage === 'function') {
          window.saveCourseDataToStorage();
        }
        break;
      }
    }
  }

  window.changeLessonVideoUrl = function(lessonId) {
    const newUrl = prompt('Enter new YouTube Video URL or Video ID for this lesson:', lesson.youtubeUrl || `https://www.youtube.com/watch?v=${ytId}`);
    if (!newUrl || !newUrl.trim()) return;

    let foundMod = null;
    let foundLess = null;
    (window.COURSE_DATA || []).forEach(m => {
      (m.lessons || []).forEach(l => {
        if (l.id === lessonId) {
          foundMod = m;
          foundLess = l;
        }
      });
    });

    if (foundLess) {
      foundLess.youtubeUrl = newUrl.trim();
      const extracted = extractYouTubeID(newUrl.trim());
      if (extracted) {
        foundLess.videoId = extracted;
        foundLess.embedUrl = `https://www.youtube.com/embed/${extracted}?rel=0&enablejsapi=1`;
      }
      if (typeof window.saveCourseDataToStorage === 'function') {
        window.saveCourseDataToStorage(window.COURSE_DATA);
      }
      renderLessonTheater(foundLess);
      if (typeof window.showToast === 'function') showToast('Updated YouTube Video URL!');
    }
  };

  let fallbackEl = document.getElementById('ytFallbackBanner');
  if (videoWrapper) {
    if (!fallbackEl) {
      fallbackEl = document.createElement('div');
      fallbackEl.id = 'ytFallbackBanner';
      fallbackEl.className = 'mt-2';
      fallbackEl.style.cssText = 'font-size: 0.88rem; color: var(--text-light); text-align: center; background: var(--bg-body); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;';
      videoWrapper.after(fallbackEl);
    }
    fallbackEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-weight: 600; color: var(--text-main);">Lesson Video (${lesson.title}):</span>
      </div>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        ${courseState.isAdmin ? `
          <button onclick="changeLessonVideoUrl('${lesson.id}')" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">
            ✏️ Edit Video URL
          </button>
        ` : ''}
        <a href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="background: #FF0000; border: none; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;">
          Play on YouTube (Full HD) ↗
        </a>
      </div>
    `;
  }

  if (typeof window.setupInlineTextEditing === 'function') {
    window.setupInlineTextEditing();
  }
}

window.toggleLessonComplete = function(lessonId) {
  console.log('🔘 toggleLessonComplete called for student:', courseState.currentStudent, 'lessonId:', lessonId);
  if (!courseState.currentStudent) {
    alert('Please log in to your Student Portal to save checkmark progress!');
    checkStudentLoginGate();
    return;
  }
  let studentData = courseState.studentProgress[courseState.currentStudent];
  if (!studentData) {
    studentData = { instructor: 'Farhan Hussaini', transmission: 'Manual', completed: [] };
    courseState.studentProgress[courseState.currentStudent] = studentData;
  }
  if (!Array.isArray(studentData.completed)) {
    studentData.completed = [];
  }
  const idx = studentData.completed.indexOf(lessonId);
  if (idx > -1) {
    studentData.completed.splice(idx, 1);
    showToast(`Unchecked lesson completion.`);
  } else {
    studentData.completed.push(lessonId);
    showToast(`✓ Marked lesson completed! Keep going! 🚀`);
  }
  saveLMSStateToStorage();
  renderLMSHeaderBar();
  renderCurriculumSidebar();
  const currentMod = (window.COURSE_DATA || []).find(m => (m.lessons || []).some(l => l.id === lessonId));
  const currentLess = currentMod?.lessons.find(l => l.id === lessonId);
  if (currentLess) renderLessonTheater(currentLess);
  if (courseState.isAdmin) renderAdminProgressTable();
};

/**
 * UNIFIED ADMIN HUB CONTROLLER & RENDERER
 */
function renderAdminHub() {
  const hubContainer = document.getElementById('adminHubContainer');
  if (!hubContainer) return;

  if (!courseState.isAdmin) {
    hubContainer.style.display = 'none';
    return;
  }

  hubContainer.style.display = 'block';
  const badgeEl = document.getElementById('adminHubUserBadge');
  if (badgeEl) badgeEl.textContent = `${getAdminUsername()}`;

  renderAdminProgressTable();
  renderAdminContentEditor();
  renderAdminSiteSettings();
  renderAdminReviewsTable();
}

window.renderAdminHub = renderAdminHub;

/**
 * Tab Navigation Logic (`switchAdminTab`)
 */
window.switchAdminTab = function(tabName) {
  const tabs = {
    students: { btn: 'adminTabStudents', panel: 'adminPanelStudents' },
    contentEditor: { btn: 'adminTabContentEditor', panel: 'adminPanelContentEditor' },
    siteSettings: { btn: 'adminTabSiteSettings', panel: 'adminPanelSiteSettings' },
    reviews: { btn: 'adminTabReviews', panel: 'adminPanelReviews' }
  };

  Object.keys(tabs).forEach(key => {
    const btnEl = document.getElementById(tabs[key].btn);
    const panelEl = document.getElementById(tabs[key].panel);
    if (!btnEl || !panelEl) return;

    if (key === tabName) {
      btnEl.classList.add('active');
      btnEl.setAttribute('aria-selected', 'true');
      btnEl.setAttribute('tabindex', '0');
      panelEl.removeAttribute('hidden');
      panelEl.style.display = 'block';
    } else {
      btnEl.classList.remove('active');
      btnEl.setAttribute('aria-selected', 'false');
      btnEl.setAttribute('tabindex', '-1');
      panelEl.setAttribute('hidden', 'true');
      panelEl.style.display = 'none';
    }
  });
};

function setupAdminTabKeyNav() {
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (!activeEl || !activeEl.classList.contains('admin-tab-btn')) return;

    const tabButtons = Array.from(document.querySelectorAll('.admin-tab-btn'));
    const currentIndex = tabButtons.indexOf(activeEl);
    if (currentIndex === -1) return;

    let targetIndex = null;
    if (e.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % tabButtons.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = tabButtons.length - 1;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      tabButtons[targetIndex].focus();
      tabButtons[targetIndex].click();
    }
  });
}

/**
 * Primary Tab 1: Student Accounts & Progress Renderer
 */
function renderAdminProgressTable() {
  const panel = document.getElementById('adminPanelStudents');
  if (!panel) return;

  const studentKeys = Object.keys(courseState.studentProgress || {});
  const totalStudents = studentKeys.length;

  let totalTrackPctSum = 0;
  let manualCount = 0;
  let autoCount = 0;

  studentKeys.forEach(name => {
    const metrics = calculateStudentProgressMetrics(name);
    totalTrackPctSum += metrics.trackPercent;
    if (metrics.studentTx === 'Auto') {
      autoCount++;
    } else {
      manualCount++;
    }
  });

  const avgTrackPct = totalStudents > 0 ? Math.round(totalTrackPctSum / totalStudents) : 0;

  const rowsHtml = studentKeys.map(studentName => {
    const data = courseState.studentProgress[studentName] || {};
    const metrics = calculateStudentProgressMetrics(studentName);
    const isAuto = metrics.studentTx === 'Auto';
    const escapedName = studentName.replace(/'/g, "\\'").replace(/"/g, '&quot;');

    return `
      <tr>
        <td>
          <button type="button" class="btn btn-sm btn-secondary action-view-modules" onclick="openStudentModulesModal('${escapedName}')" style="border: none; background: transparent; color: var(--text-main); font-weight: 800; cursor: pointer; text-align: left; padding: 0;">
            ${studentName}
          </button>
        </td>
        <td><span class="badge badge-secondary">${data.instructor || 'Farhan Hussaini'}</span></td>
        <td><span class="badge ${isAuto ? 'badge-transmission-auto' : 'badge-transmission-manual'}">${isAuto ? 'Automatic' : 'Manual'}</span></td>
        <td><span class="badge badge-secondary">SHA-256 Protected</span></td>
        <td>
          <div style="display:flex; flex-direction:column; gap:2px;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <strong style="color: var(--color-green); font-size:0.85rem;">Track: ${metrics.trackPercent}%</strong>
              <span style="font-size:0.75rem; color:var(--text-light);">(${metrics.trackCompleted}/${metrics.trackTotal})</span>
            </div>
            <div style="width: 100px; height: 5px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
              <div style="width: ${metrics.trackPercent}%; height: 100%; background: var(--color-green);"></div>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:2px;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <strong style="color: #3B82F6; font-size:0.85rem;">Overall: ${metrics.overallPercent}%</strong>
              <span style="font-size:0.75rem; color:var(--text-light);">(${metrics.overallCompleted}/${metrics.overallTotal})</span>
            </div>
            <div style="width: 100px; height: 5px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
              <div style="width: ${metrics.overallPercent}%; height: 100%; background: #3B82F6;"></div>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary btn-sm action-view-modules" onclick="openStudentModulesModal('${escapedName}')" style="padding: 4px 10px; font-size: 0.75rem; cursor: pointer;">Modules</button>
            <button type="button" class="btn btn-secondary btn-sm action-edit-student" onclick="openEditStudentModal('${escapedName}')" style="padding: 4px 10px; font-size: 0.75rem; cursor: pointer;">Edit</button>
            <button type="button" class="btn btn-secondary btn-sm action-reset-student" onclick="resetStudentProgress('${escapedName}')" style="padding: 4px 10px; font-size: 0.75rem; cursor: pointer;">Reset</button>
            <button type="button" class="btn btn-accent btn-sm action-delete-student" onclick="deleteStudentAccount('${escapedName}')" style="padding: 4px 10px; font-size: 0.75rem; background: var(--color-red, #EF4444); border-color: var(--color-red, #EF4444); color: #FFF; cursor: pointer;">Remove</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  panel.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card">
          <div class="stat-number">${totalStudents}</div>
          <div style="font-size:0.85rem; font-weight:700; color:var(--text-light);">Enrolled Students</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${avgTrackPct}%</div>
          <div style="font-size:0.85rem; font-weight:700; color:var(--text-light);">Avg Track Completion</div>
        </div>
        <div class="stat-card">
          <div style="font-family:var(--font-heading); font-size:1.6rem; font-weight:800; color:var(--color-green); margin-bottom:0.25rem;">
            Manual: ${manualCount} | Auto: ${autoCount}
          </div>
          <div style="font-size:0.85rem; font-weight:700; color:var(--text-light);">Manual vs Auto Ratio</div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
        <div>
          <h3 style="margin:0;">Student Enrolment & Progress Directory</h3>
          <p style="margin:0; font-size:0.88rem; color:var(--text-light);">Manage student portal credentials, assigned instructors, transmission courses, and dual track progress.</p>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="student-progress-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Instructor</th>
              <th>Transmission</th>
              <th>Security</th>
              <th>Track Progress</th>
              <th>Overall Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center; color:var(--text-light);">No student accounts found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  panel.querySelectorAll('.action-view-modules').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sName = decodeURIComponent(btn.getAttribute('data-student') || '');
      if (sName) openStudentModulesModal(sName);
    });
  });

  panel.querySelectorAll('.action-edit-student').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sName = decodeURIComponent(btn.getAttribute('data-student') || '');
      if (sName) openEditStudentModal(sName);
    });
  });

  panel.querySelectorAll('.action-reset-student').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sName = decodeURIComponent(btn.getAttribute('data-student') || '');
      if (sName) resetStudentProgress(sName);
    });
  });

  panel.querySelectorAll('.action-delete-student').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const sName = decodeURIComponent(btn.getAttribute('data-student') || '');
      if (sName) deleteStudentAccount(sName);
    });
  });
}

window.renderAdminProgressTable = renderAdminProgressTable;

/**
 * STUDENT MODULES & LESSON PROGRESS INSPECTOR MODAL
 */
window.openStudentModulesModal = function(studentName) {
  const modal = document.getElementById('studentModulesModal');
  const headerEl = document.getElementById('studentModulesModalHeader');
  const bodyEl = document.getElementById('studentModulesModalBody');
  if (!modal || !headerEl || !bodyEl) return;

  const data = courseState.studentProgress[studentName] || { instructor: 'Farhan Hussaini', transmission: 'Manual', completed: [] };
  if (!Array.isArray(data.completed)) data.completed = [];
  const metrics = calculateStudentProgressMetrics(studentName);
  const isAuto = metrics.studentTx === 'Auto';
  const modules = window.COURSE_DATA || [];

  headerEl.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
      <div>
        <h2 style="margin: 0 0 0.5rem 0; font-size: 1.4rem;">Student Progress: <span style="color: var(--color-green);">${studentName}</span></h2>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <span class="badge badge-secondary">Instructor: ${data.instructor || 'Farhan Hussaini'}</span>
          <span class="badge ${isAuto ? 'badge-transmission-auto' : 'badge-transmission-manual'}">${isAuto ? 'Automatic Track' : 'Manual Track'}</span>
          <span class="badge badge-primary">Track Progress: ${metrics.trackCompleted}/${metrics.trackTotal} (${metrics.trackPercent}%)</span>
          <span class="badge badge-secondary">Overall: ${metrics.overallCompleted}/${metrics.overallTotal} (${metrics.overallPercent}%)</span>
        </div>
      </div>
    </div>
  `;

  let modulesHtml = modules.map(mod => {
    const lessons = mod.lessons || [];
    const completedInMod = lessons.filter(l => data.completed.includes(l.id)).length;
    const isModComplete = lessons.length > 0 && completedInMod === lessons.length;

    const lessonRows = lessons.map(lesson => {
      const isDone = data.completed.includes(lesson.id);
      const isPreview = lesson.isFreePreview;
      const lessonTx = lesson.transmission || 'All';
      const escapedStudentName = studentName.replace(/'/g, "\\'").replace(/"/g, '&quot;');

      return `
        <div class="student-lesson-row" onclick="toggleStudentLessonAdmin('${escapedStudentName}', '${lesson.id}')" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; margin-bottom: 0.5rem; background: ${isDone ? 'rgba(46, 125, 50, 0.08)' : 'var(--bg-body)'}; border: 1px solid ${isDone ? 'rgba(46, 125, 50, 0.3)' : 'var(--border-color)'}; border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition-fast);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isDone ? 'var(--color-green)' : 'var(--border-color)'}; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0;">
              ${isDone ? '✓' : '•'}
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${lesson.title}</div>
              <div style="font-size: 0.78rem; color: var(--text-light); display: flex; gap: 0.5rem; align-items: center; margin-top: 2px;">
                <span>${lesson.duration || '5:00'}</span>
                <span>•</span>
                <span>${lessonTx === 'Manual' ? 'Manual' : lessonTx === 'Auto' ? 'Auto' : 'All Transmissions'}</span>
                ${isPreview ? '<span style="color: var(--color-green); font-weight: 600;">Free Preview</span>' : ''}
              </div>
            </div>
          </div>
          <div>
            <span class="badge ${isDone ? 'badge-primary' : 'badge-secondary'}" style="font-size: 0.78rem; padding: 0.35rem 0.75rem; background: ${isDone ? 'var(--color-green)' : '#94A3B8'}; color: #FFF;">
              ${isDone ? 'Completed' : 'Mark Complete'}
            </span>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 1.5rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
          <div>
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${mod.title}</h3>
            <span style="font-size: 0.8rem; color: var(--text-light);">${mod.description || ''}</span>
          </div>
          <div>
            <span class="badge ${isModComplete ? 'badge-primary' : 'badge-secondary'}" style="font-size: 0.8rem;">
              Module Progress: ${completedInMod}/${lessons.length}
            </span>
          </div>
        </div>
        <div>
          ${lessonRows || '<p style="font-size: 0.85rem; color: var(--text-light);">No lessons in this module.</p>'}
        </div>
      </div>
    `;
  }).join('');

  bodyEl.innerHTML = modulesHtml;
  modal.style.display = 'block';
};

window.closeStudentModulesModal = function() {
  const modal = document.getElementById('studentModulesModal');
  if (modal) modal.style.display = 'none';
};

window.toggleStudentLessonAdmin = function(studentName, lessonId) {
  let studentData = courseState.studentProgress[studentName];
  if (!studentData) {
    studentData = { instructor: 'Farhan Hussaini', transmission: 'Manual', completed: [] };
    courseState.studentProgress[studentName] = studentData;
  }
  if (!Array.isArray(studentData.completed)) {
    studentData.completed = [];
  }

  const idx = studentData.completed.indexOf(lessonId);
  if (idx > -1) {
    studentData.completed.splice(idx, 1);
    if (typeof showToast === 'function') showToast(`Unmarked lesson for ${studentName}`);
  } else {
    studentData.completed.push(lessonId);
    if (typeof showToast === 'function') showToast(`✓ Marked lesson complete for ${studentName}! 🚀`);
  }

  saveLMSStateToStorage();
  openStudentModulesModal(studentName);
  renderAdminProgressTable();
};

/**
 * Submenu Tab A: Course Content Editor Renderer
 */
function renderAdminContentEditor() {
  const panel = document.getElementById('adminPanelContentEditor');
  if (!panel) return;

  const modules = window.COURSE_DATA || [];

  const moduleCardsHtml = modules.map((module) => {
    const lessons = module.lessons || [];
    const lessonRowsHtml = lessons.map((lesson) => {
      let transBadge = '<span class="badge badge-transmission-all">Manual & Auto</span>';
      if (lesson.transmission === 'Manual') {
        transBadge = '<span class="badge badge-transmission-manual">Manual Only</span>';
      } else if (lesson.transmission === 'Auto' || lesson.transmission === 'Automatic') {
        transBadge = '<span class="badge badge-transmission-auto">Auto Only</span>';
      }

      const previewBadge = lesson.isFreePreview 
        ? '<span class="badge badge-primary" style="font-size:0.7rem;">Free Preview</span>' 
        : '<span class="badge badge-secondary" style="font-size:0.7rem;">LMS Enrolled</span>';

      return `
        <tr>
          <td><strong>${lesson.title}</strong></td>
          <td>${lesson.duration || '5:00'}</td>
          <td>${transBadge}</td>
          <td>${previewBadge}</td>
          <td>
            <div style="display:flex; gap:0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="openEditLessonModal('${module.id}', '${lesson.id}')" style="padding:3px 8px; font-size:0.75rem;">Edit</button>
              <button class="btn btn-accent btn-sm" onclick="deleteLesson('${module.id}', '${lesson.id}')" style="padding:3px 8px; font-size:0.75rem; background: var(--color-red, #EF4444); border-color: var(--color-red, #EF4444); color: #FFF;">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="module-editor-card">
        <div class="module-editor-header">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <h3 style="margin:0; font-size:1.1rem;">📁 ${module.title}</h3>
              <span class="badge badge-primary" style="font-size:0.72rem;">${lessons.length} Lessons</span>
            </div>
            <p style="margin:0; font-size:0.85rem; color:var(--text-light);">${module.description || 'No description provided.'}</p>
          </div>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" onclick="openCreateLessonModal('${module.id}')" style="font-size:0.78rem;">+ Add Lesson</button>
            <button class="btn btn-secondary btn-sm" onclick="openEditModuleModal('${module.id}')" style="font-size:0.78rem;">Edit Module</button>
            <button class="btn btn-accent btn-sm" onclick="deleteModule('${module.id}')" style="font-size:0.78rem; background: var(--color-red, #EF4444); border-color: var(--color-red, #EF4444); color: #FFF;">Delete Module</button>
          </div>
        </div>

        <div style="overflow-x:auto;">
          <table class="lesson-editor-table">
            <thead>
              <tr>
                <th>Lesson Title</th>
                <th>Duration</th>
                <th>Transmission</th>
                <th>Access Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${lessonRowsHtml || '<tr><td colspan="5" style="text-align:center; color:var(--text-light);">No lessons in this module. Click "+ Add Lesson" to create one.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  panel.innerHTML = `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <h3 style="margin:0;">Course Content Editor & Curriculum Manager</h3>
          <p style="margin:0; font-size:0.88rem; color:var(--text-light);">Create, edit, or delete modules and video lessons. Changes persist automatically to localStorage.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-primary btn-sm" onclick="openCreateModuleModal()">+ Add New Module</button>
          <button class="btn btn-secondary btn-sm" onclick="resetCourseDataToDefaults()">Reset to Defaults ↺</button>
        </div>
      </div>

      ${moduleCardsHtml || '<p style="text-align:center; color:var(--text-light);">No course modules found. Click "+ Add New Module" to get started.</p>'}
    </div>
  `;
}

window.renderAdminContentEditor = renderAdminContentEditor;

/**
 * Submenu Tab B: Advanced Site Settings Renderer
 */
function renderAdminSiteSettings() {
  const panel = document.getElementById('adminPanelSiteSettings');
  if (!panel) return;

  let siteContentStr = null;
  let currentInstaEndpoint = '';
  try {
    siteContentStr = localStorage.getItem('l2d_site_content');
    currentInstaEndpoint = localStorage.getItem('l2d_insta_api_endpoint') || '';
  } catch(e) {}

  const siteContent = siteContentStr ? JSON.parse(siteContentStr) : {
    heroBadge: 'Preston DVSA-Approved Driving Academy',
    heroHeading: 'Welcome to <span style="color:#D32F2F; font-weight:800;">L</span>earner2<span style="color:#2E7D32; font-weight:800;">D</span>river Preston',
    heroText: 'Professional Manual & Automatic tuition with Preston\'s top-rated instructors, <strong>Farhan Hussaini</strong> & <strong>Binish Moazzam</strong>. Learn in our dual-controlled <strong>2019 Toyota Yaris</strong> or <strong>2024 Hyundai Kona EV Ultimate</strong>.',
    contactPhone: '074-2733-0827',
    contactLocation: 'Preston, Lancashire & Surrounding Areas (PR1-PR5)'
  };

  let fleetStr = null;
  try {
    fleetStr = localStorage.getItem('l2d_custom_hotspots') || localStorage.getItem('l2d_fleet_hotspots');
  } catch(e) {}
  const fleet = fleetStr ? JSON.parse(fleetStr) : {
    yaris: {
      hotspots: [
        { id: 1, title: 'Biting Point Clutch', desc: 'Smooth, lightweight clutch pedal designed for effortless hill starts on Penwortham Bridge.', x: 26, y: 55 },
        { id: 2, title: 'He-Man Dual Controls', desc: 'Full instructor dual brake and clutch pedals for 100% safety during initial lessons.', x: 50, y: 48 },
        { id: 3, title: 'Reversing Camera', desc: 'Wide-angle rear view camera with active guideline grid for parallel parking.', x: 78, y: 52 }
      ]
    },
    kona: {
      hotspots: [
        { id: 1, title: 'Zero Stalling Electric', desc: 'No clutch, no gears! Focus 100% on road positioning and roundabouts around Chain Caul Way.', x: 30, y: 54 },
        { id: 2, title: '360° Surround View', desc: 'High-definition 4-camera overhead parking system makes bay parking effortlessly simple.', x: 52, y: 42 },
        { id: 3, title: 'Dual Electric Pedals', desc: 'Instructor dual braking system with instant regenerative stopping power.', x: 76, y: 58 }
      ]
    }
  };

  panel.innerHTML = `
    <div class="admin-editor-panel" style="margin-bottom:0;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
        <div>
          <span class="badge badge-primary mb-1">Admin Configuration</span>
          <h2 style="margin:0;">Advanced Site Settings & Integrations</h2>
          <p style="margin:0; color:var(--text-light); font-size:0.9rem;">
            Configure site branding, admin security credentials, Instagram Graph API feeds, and car showroom hotspot coordinates.
          </p>
        </div>
        <button class="btn btn-primary" onclick="saveAdminContentEditorSettings()">
          Save All Settings
        </button>
      </div>

      <!-- SECTION 0: CROSS-DEVICE CLOUD SYNC & JSON BACKUP / RESTORE -->
      <div class="admin-editor-section" style="border-top:none; padding-top:0; margin-top:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.75rem;">
          <div>
            <h3 style="margin:0; font-size:1.35rem; color:var(--text-main);">Cross-Device Cloud Sync & Database Backup</h3>
            <p style="font-size:0.88rem; color:var(--text-light); margin:0.2rem 0 0;">
              Export 1-click JSON database backups or connect a free REST Cloud Sync endpoint so all browsers, tablets, and phones stay 100% in sync!
            </p>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="downloadSiteBackupFile()">Download Backup (.json)</button>
            <label class="btn btn-secondary btn-sm" style="margin:0; cursor:pointer;">
              Import Backup (.json)
              <input type="file" accept=".json" style="display:none;" onchange="importSiteBackupFile(event)">
            </label>
          </div>
        </div>

        <div style="background:var(--bg-body); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-top:1rem;">
          <h4 style="margin-top:0; margin-bottom:0.5rem; font-size:1.05rem;">Live Cloud API Sync Endpoint (Firebase / JSONBin / REST)</h4>
          <p style="font-size:0.85rem; color:var(--text-light); margin-bottom:1rem;">
            Paste your Cloud JSON API Endpoint URL (e.g. <code>https://api.jsonbin.io/v3/b/YOUR_BIN_ID</code> or Firebase Firestore REST URL) to sync changes live across browsers.
          </p>

          <div class="editor-grid-2" style="margin-bottom:1rem;">
            <div>
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Cloud API Endpoint URL</label>
              <input type="text" id="editCloudSyncUrl" class="portal-input" placeholder="https://api.jsonbin.io/v3/b/..." value="${localStorage.getItem('l2d_cloud_sync_url') || ''}">
            </div>
            <div>
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Cloud API Master Key / Secret Token (Optional)</label>
              <input type="password" id="editCloudSyncKey" class="portal-input" placeholder="$2a$10$..." value="${localStorage.getItem('l2d_cloud_sync_key') || ''}">
            </div>
          </div>

          <div style="display:flex; gap:0.65rem; flex-wrap:wrap; align-items:center;">
            <button type="button" class="btn btn-primary btn-sm" onclick="saveAndTestCloudSync()">Save & Push to Cloud</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="pullCloudDataToLocal(true)">Pull Latest Cloud Data</button>
            <span id="cloudSyncStatusBadge" style="font-size:0.82rem; font-weight:700; color:var(--text-light);">
              Status: ${localStorage.getItem('l2d_cloud_sync_url') ? 'Cloud Endpoint Configured' : 'Cloud Sync Inactive (Using Local Storage & JSON Backups)'}
            </span>
          </div>
        </div>

        <!-- Official Supabase Connection Box -->
        <div style="background:var(--bg-body); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--color-green); margin-top:1.25rem;">
          <h4 style="margin-top:0; margin-bottom:0.5rem; font-size:1.05rem; color:var(--color-green);">Official Supabase Realtime Database Integration</h4>
          <p style="font-size:0.85rem; color:var(--text-light); margin-bottom:1rem;">
            Paste your Supabase Project URL and Anon Public Key below. Once connected, all inline edits, student accounts, progress, and danger spot test routes will automatically sync to your Supabase PostgreSQL database tables!
          </p>

          <div class="editor-grid-2" style="margin-bottom:1rem;">
            <div>
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Supabase Project URL</label>
              <input type="text" id="editSupabaseUrl" class="portal-input" placeholder="https://xyzcompany.supabase.co" value="${localStorage.getItem('l2d_supabase_url') || ''}">
            </div>
            <div>
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Supabase Anon Public Key</label>
              <input type="password" id="editSupabaseKey" class="portal-input" placeholder="eyJhbGciOiJIUzI1NiIsInR..." value="${localStorage.getItem('l2d_supabase_key') || ''}">
            </div>
          </div>

          <div style="margin-bottom:1rem; padding:0.65rem; background:rgba(16, 185, 129, 0.08); border-radius:var(--radius-sm); border:1px dashed var(--color-green);">
            <label style="font-size:0.85rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:0.5rem;">
              <input type="checkbox" id="editSupabaseAutoSync" ${localStorage.getItem('l2d_supabase_auto_sync') === 'true' ? 'checked' : ''} onchange="toggleSupabaseAutoSync(this.checked)">
              <span>Enable Automatic Real-Time Background Supabase Sync (Disabled by Default)</span>
            </label>
            <p style="font-size:0.78rem; color:var(--text-light); margin:0.3rem 0 0 1.6rem;">
              When unchecked (default), changes remain local to your browser until you manually click <b>Sync All Data to Supabase</b>.
            </p>
          </div>

          <div style="display:flex; gap:0.65rem; flex-wrap:wrap; align-items:center;">
            <button type="button" class="btn btn-primary btn-sm" onclick="saveAndTestSupabaseConnection()">Sync All Data to Supabase</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="pullSupabaseDataToLocal(true)">Pull Data from Supabase</button>
            <span id="supabaseStatusBadge" style="font-size:0.82rem; font-weight:700; color:var(--text-light);">
              Status: ${localStorage.getItem('l2d_supabase_url') ? 'Supabase Configured' : 'Supabase Inactive'}
            </span>
          </div>
        </div>
      </div>

      <!-- SECTION 1: INSTRUCTOR ADMIN CREDENTIALS -->
      <div class="admin-editor-section">
        <h3 style="margin-bottom:0.5rem; font-size:1.25rem;">Instructor Admin Credentials</h3>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:0.75rem;">
          Update the admin username and password used to unlock Admin Mode.
        </p>
        <div class="editor-grid-2">
          <div>
            <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Admin Username</label>
            <input type="text" id="editAdminUsername" class="portal-input">
          </div>
          <div>
            <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Admin Password</label>
            <input type="password" id="editAdminPassword" class="portal-input">
          </div>
        </div>
      </div>

      <!-- SECTION 2: SITE CONTENT & BRANDING -->
      <div class="admin-editor-section">
        <h3 style="margin-bottom:0.5rem; font-size:1.25rem;">📝 Site Content & Branding Editor</h3>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:1rem;">
          Customize the landing page Hero Badge, Hero Heading, Hero Description, Contact Phone, and Location.
        </p>
        <div class="editor-grid-2" style="margin-bottom:1rem;">
          <div>
            <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Hero Badge Text</label>
            <input type="text" id="editHeroBadge" class="portal-input">
          </div>
          <div>
            <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Contact Phone</label>
            <input type="text" id="editContactPhone" class="portal-input">
          </div>
        </div>
        <div style="margin-bottom:1rem;">
          <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Hero Main Heading (HTML allowed)</label>
          <input type="text" id="editHeroHeading" class="portal-input">
        </div>
        <div style="margin-bottom:1rem;">
          <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Hero Text Description (HTML allowed)</label>
          <textarea id="editHeroText" class="portal-input" style="height: 80px; resize: vertical;"></textarea>
        </div>
        <div>
          <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Contact Location</label>
          <input type="text" id="editContactLocation" class="portal-input">
        </div>
      </div>

      <!-- SECTION 3: INSTAGRAM API ENDPOINT & GUIDE -->
      <div class="admin-editor-section">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
          <h3 style="margin:0; font-size:1.25rem;">📸 Instagram Basic Display API Endpoint (@lrnr2drvr)</h3>
          <button class="btn btn-secondary btn-sm" onclick="testInstagramApiConnection()">Test API Connection 📡</button>
        </div>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:0.75rem;">
          Paste your Instagram Basic Display Graph API URL or Behold JSON Feed Endpoint to fetch live student pass posts.
        </p>
        <input type="text" id="editInstaEndpoint" class="portal-input" placeholder="e.g. https://graph.instagram.com/me/media?... or https://feeds.behold.so/..." value="${currentInstaEndpoint}">

        <div class="insta-guide-box">
          <h4 style="margin-top:0; margin-bottom:0.5rem; color:var(--color-green);">📸 Instagram Feed Integration Guide (@lrnr2drvr)</h4>
          <p style="font-size:0.88rem; margin-bottom:0.75rem;">
            To display live Instagram posts from <strong>@lrnr2drvr</strong> on the Learner2Driver landing page:
          </p>
          <ol style="font-size:0.85rem; padding-left:1.25rem; line-height:1.6; margin-bottom:0.75rem;">
            <li>Create a Meta for Developers account and set up Instagram Basic Display API or use a service like <strong>Behold.so</strong> / <strong>Elfsight</strong>.</li>
            <li>Generate your Graph API Access Token or JSON Feed URL for @lrnr2drvr. Expected JSON format: <code>[ { "id": "...", "caption": "...", "media_url": "...", "permalink": "..." } ]</code>.</li>
            <li>Paste your full endpoint URL into the input field above.</li>
            <li>Click <strong>Test API Connection</strong> to verify connectivity, then click <strong>Save All Settings</strong>.</li>
          </ol>
          <div style="font-size:0.8rem; color:var(--text-light); background:var(--bg-body); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
            💡 <strong>Pro-Tip:</strong> Instagram Graph API long-lived access tokens expire every 60 days. If using Behold.so, tokens auto-refresh seamlessly.
          </div>
        </div>
      </div>

      <!-- SECTION 3B: GOOGLE BUSINESS PROFILE REVIEWS API & GUIDE -->
      <div class="admin-editor-section">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
          <h3 style="margin:0; font-size:1.25rem;">🌟 Google Business Profile Reviews API Sync</h3>
          <button class="btn btn-secondary btn-sm" onclick="testGoogleApiConnection()">Test Google API 📡</button>
        </div>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:0.75rem;">
          Connect your Google Places API Key and Google Place ID to auto-sync verified student reviews from your Google Business Profile.
        </p>
        <div class="editor-grid-2" style="margin-bottom:1rem;">
          <div>
            <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Google Places API Key</label>
            <input type="text" id="editGoogleApiKey" class="portal-input" placeholder="AIzaSy..." value="${localStorage.getItem('l2d_google_places_api_key') || ''}">
          </div>
          <div>
            <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">Google Place ID (Learner2Driver)</label>
            <input type="text" id="editGooglePlaceId" class="portal-input" placeholder="ChIJ..." value="${localStorage.getItem('l2d_google_place_id') || ''}">
          </div>
        </div>

        <div class="insta-guide-box">
          <h4 style="margin-top:0; margin-bottom:0.5rem; color:var(--color-green);">🌟 Google Business Profile Reviews Setup Guide</h4>
          <ol style="font-size:0.85rem; padding-left:1.25rem; line-height:1.6; margin-bottom:0.75rem;">
            <li>Go to <strong>Google Cloud Console</strong> and enable the <strong>Places API</strong>.</li>
            <li>Generate an API Key under Credentials and restrict it to your domain.</li>
            <li>Find your <strong>Google Place ID</strong> using the Google Place ID Finder tool for <em>Learner2Driver Preston</em>.</li>
            <li>Paste your API Key and Place ID into the fields above and click <strong>Save All Settings</strong>.</li>
          </ol>
        </div>
      </div>

      <!-- SECTION 3C: HUBSPOT CRM INTEGRATION -->
      <div class="admin-editor-section">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.5rem;">
          <h3 style="margin:0; font-size:1.25rem;">🧡 HubSpot CRM Platform Integration</h3>
          <button class="btn btn-secondary btn-sm" onclick="saveHubSpotPortalIdSetting()">Sync HubSpot to Database ☁️</button>
        </div>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:0.75rem;">
          Enter your 8-digit <strong>HubSpot Hub / Portal ID</strong> to automatically activate HubSpot Live Chat, Lead Capture Forms, and Sales Analytics across all browsers & devices. Syncs to Supabase live!
        </p>
        <div style="max-width: 480px; margin-bottom:1rem;">
          <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.3rem;">HubSpot Hub / Portal ID</label>
          <input type="text" id="editHubspotPortalId" class="portal-input" placeholder="e.g. 12345678" value="${localStorage.getItem('l2d_hubspot_portal_id') || ''}">
        </div>
      </div>

      <!-- SECTION 4: CAR HOTSPOT COORDINATE ADJUSTER -->
      <div class="admin-editor-section">
        <h3 style="margin-bottom:0.5rem; font-size:1.25rem;">Showroom Fleet Hotspot Point Adjuster (X%/Y% Coordinates)</h3>
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:1.25rem;">
          Edit the title, detailed description, X% (left-to-right), and Y% (top-to-bottom) for all 6 numbered circular badges on the Yaris and Kona EV.
        </p>

        <div class="editor-grid-2">
          <!-- Toyota Yaris Hotspots -->
          <div style="background:var(--bg-body); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <strong style="display:block; margin-bottom:0.75rem; color:var(--text-main);">2019 Toyota Yaris Manual Hotspots</strong>

            <div style="margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-color);">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #1 Title</label>
              <input type="text" id="editYarisTitle1" class="portal-input" style="margin-bottom:0.4rem;">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #1 Description</label>
              <textarea id="editYarisDesc1" class="portal-input" style="height:60px; margin-bottom:0.4rem;"></textarea>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <span style="font-size:0.8rem; font-weight:700;">X (%):</span>
                <input type="number" id="editYarisX1" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
                <span style="font-size:0.8rem; font-weight:700;">Y (%):</span>
                <input type="number" id="editYarisY1" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
              </div>
            </div>

            <div style="margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-color);">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #2 Title</label>
              <input type="text" id="editYarisTitle2" class="portal-input" style="margin-bottom:0.4rem;">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #2 Description</label>
              <textarea id="editYarisDesc2" class="portal-input" style="height:60px; margin-bottom:0.4rem;"></textarea>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <span style="font-size:0.8rem; font-weight:700;">X (%):</span>
                <input type="number" id="editYarisX2" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
                <span style="font-size:0.8rem; font-weight:700;">Y (%):</span>
                <input type="number" id="editYarisY2" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
              </div>
            </div>

            <div>
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #3 Title</label>
              <input type="text" id="editYarisTitle3" class="portal-input" style="margin-bottom:0.4rem;">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #3 Description</label>
              <textarea id="editYarisDesc3" class="portal-input" style="height:60px; margin-bottom:0.4rem;"></textarea>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <span style="font-size:0.8rem; font-weight:700;">X (%):</span>
                <input type="number" id="editYarisX3" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
                <span style="font-size:0.8rem; font-weight:700;">Y (%):</span>
                <input type="number" id="editYarisY3" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
              </div>
            </div>
          </div>

          <!-- Hyundai Kona EV Hotspots -->
          <div style="background:var(--bg-body); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <strong style="display:block; margin-bottom:0.75rem; color:var(--text-main);">2024 Hyundai Kona EV Ultimate Hotspots</strong>

            <div style="margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-color);">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #1 Title</label>
              <input type="text" id="editKonaTitle1" class="portal-input" style="margin-bottom:0.4rem;">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #1 Description</label>
              <textarea id="editKonaDesc1" class="portal-input" style="height:60px; margin-bottom:0.4rem;"></textarea>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <span style="font-size:0.8rem; font-weight:700;">X (%):</span>
                <input type="number" id="editKonaX1" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
                <span style="font-size:0.8rem; font-weight:700;">Y (%):</span>
                <input type="number" id="editKonaY1" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
              </div>
            </div>

            <div style="margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-color);">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #2 Title</label>
              <input type="text" id="editKonaTitle2" class="portal-input" style="margin-bottom:0.4rem;">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #2 Description</label>
              <textarea id="editKonaDesc2" class="portal-input" style="height:60px; margin-bottom:0.4rem;"></textarea>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <span style="font-size:0.8rem; font-weight:700;">X (%):</span>
                <input type="number" id="editKonaX2" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
                <span style="font-size:0.8rem; font-weight:700;">Y (%):</span>
                <input type="number" id="editKonaY2" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
              </div>
            </div>

            <div>
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #3 Title</label>
              <input type="text" id="editKonaTitle3" class="portal-input" style="margin-bottom:0.4rem;">
              <label style="font-size:0.82rem; font-weight:700; display:block; margin-bottom:0.25rem;">Point #3 Description</label>
              <textarea id="editKonaDesc3" class="portal-input" style="height:60px; margin-bottom:0.4rem;"></textarea>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                <span style="font-size:0.8rem; font-weight:700;">X (%):</span>
                <input type="number" id="editKonaX3" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
                <span style="font-size:0.8rem; font-weight:700;">Y (%):</span>
                <input type="number" id="editKonaY3" class="portal-input" style="margin:0; width:80px;" min="0" max="100">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  };

  setVal('editAdminUsername', getAdminUsername());
  const adminPassInput = document.getElementById('editAdminPassword');
  if (adminPassInput) {
    adminPassInput.value = '';
    adminPassInput.placeholder = 'Leave blank to keep current password';
  }

  let customMap = {};
  try {
    const raw = localStorage.getItem('l2d_custom_site_text');
    if (raw) customMap = JSON.parse(raw);
  } catch(e) {}

  setVal('editHeroBadge', customMap.hero_badge || siteContent.heroBadge);
  setVal('editHeroHeading', customMap.hero_heading || siteContent.heroHeading);
  setVal('editHeroText', customMap.hero_text || siteContent.heroText);
  setVal('editContactPhone', siteContent.contactPhone);
  setVal('editContactLocation', customMap.footer_contact_location || siteContent.contactLocation);

  setVal('editYarisTitle1', fleet.yaris?.hotspots?.[0]?.title || 'Biting Point Clutch');
  setVal('editYarisDesc1', fleet.yaris?.hotspots?.[0]?.desc || '');
  setVal('editYarisX1', fleet.yaris?.hotspots?.[0]?.x || 26);
  setVal('editYarisY1', fleet.yaris?.hotspots?.[0]?.y || 55);

  setVal('editYarisTitle2', fleet.yaris?.hotspots?.[1]?.title || 'He-Man Dual Controls');
  setVal('editYarisDesc2', fleet.yaris?.hotspots?.[1]?.desc || '');
  setVal('editYarisX2', fleet.yaris?.hotspots?.[1]?.x || 50);
  setVal('editYarisY2', fleet.yaris?.hotspots?.[1]?.y || 48);

  setVal('editYarisTitle3', fleet.yaris?.hotspots?.[2]?.title || 'Reversing Camera');
  setVal('editYarisDesc3', fleet.yaris?.hotspots?.[2]?.desc || '');
  setVal('editYarisX3', fleet.yaris?.hotspots?.[2]?.x || 78);
  setVal('editYarisY3', fleet.yaris?.hotspots?.[2]?.y || 52);

  setVal('editKonaTitle1', fleet.kona?.hotspots?.[0]?.title || 'Zero Stalling Electric');
  setVal('editKonaDesc1', fleet.kona?.hotspots?.[0]?.desc || '');
  setVal('editKonaX1', fleet.kona?.hotspots?.[0]?.x || 30);
  setVal('editKonaY1', fleet.kona?.hotspots?.[0]?.y || 54);

  setVal('editKonaTitle2', fleet.kona?.hotspots?.[1]?.title || '360° Surround View');
  setVal('editKonaDesc2', fleet.kona?.hotspots?.[1]?.desc || '');
  setVal('editKonaX2', fleet.kona?.hotspots?.[1]?.x || 52);
  setVal('editKonaY2', fleet.kona?.hotspots?.[1]?.y || 42);

  setVal('editKonaTitle3', fleet.kona?.hotspots?.[2]?.title || 'Dual Electric Pedals');
  setVal('editKonaDesc3', fleet.kona?.hotspots?.[2]?.desc || '');
  setVal('editKonaX3', fleet.kona?.hotspots?.[2]?.x || 76);
  setVal('editKonaY3', fleet.kona?.hotspots?.[2]?.y || 58);
}

window.renderAdminSiteSettings = renderAdminSiteSettings;

window.saveAndTestCloudSync = async function() {
  const url = document.getElementById('editCloudSyncUrl')?.value || '';
  const key = document.getElementById('editCloudSyncKey')?.value || '';

  window.saveCloudSyncConfig(url, key, true);
  if (!url) {
    alert('Please enter a valid Cloud API Endpoint URL (e.g. JSONBin URL or Firebase REST endpoint).');
    return;
  }

  const badge = document.getElementById('cloudSyncStatusBadge');
  if (badge) {
    badge.innerHTML = '⌛ Testing Connection & Pushing Database to Cloud...';
    badge.style.color = 'var(--color-amber, #F59E0B)';
  }

  const ok = await window.pushLocalDataToCloud(true);
  if (ok && badge) {
    badge.innerHTML = '🟢 Cloud Sync Connected & Live!';
    badge.style.color = 'var(--color-green)';
  } else if (badge) {
    badge.innerHTML = '🔴 Cloud Push Failed. Verify URL & API Token.';
    badge.style.color = 'var(--color-red, #EF4444)';
  }
};

window.saveAndTestSupabaseConnection = async function() {
  const url = document.getElementById('editSupabaseUrl')?.value || '';
  const key = document.getElementById('editSupabaseKey')?.value || '';

  if (!url || !key) {
    alert('Please enter both your Supabase Project URL and Anon Public Key.');
    return;
  }

  const ok = window.saveSupabaseCredentials(url, key);
  const badge = document.getElementById('supabaseStatusBadge');
  if (ok) {
    if (badge) {
      badge.innerHTML = '⌛ Connecting & Testing Supabase Tables...';
      badge.style.color = 'var(--color-amber, #F59E0B)';
    }

    const res = await window.syncAllLocalDataToSupabase();
    if (res && res.ok && res.syncedCount > 0) {
      if (badge) {
        badge.innerHTML = `Connected & Synced ${res.syncedCount} Database Items Live to Supabase!`;
        badge.style.color = 'var(--color-green)';
      }
      if (typeof window.showToast === 'function') window.showToast(`Supabase Connected & Synced ${res.syncedCount} Profiles/Records Live!`);
    } else {
      const errMsgs = (res && res.errors) ? res.errors.join('\n• ') : 'Unknown connection error';
      if (badge) {
        badge.innerHTML = '🔴 Supabase Error: ' + ((res && res.errors && res.errors[0]) || 'Sync Failed');
        badge.style.color = 'var(--color-red, #EF4444)';
      }
      alert(`Supabase Database Sync Error Details:\n\n• ${errMsgs}\n\nTroubleshooting Tip:\nMake sure you created the SQL tables in your Supabase Dashboard -> SQL Editor!\n(Copy the SQL script from supabase_setup_guide.md)`);
    }
  } else if (badge) {
    badge.innerHTML = '🔴 Invalid Supabase Configuration';
    badge.style.color = 'var(--color-red, #EF4444)';
  }
};

window.toggleSupabaseAutoSync = function(enabled) {
  localStorage.setItem('l2d_supabase_auto_sync', enabled ? 'true' : 'false');
  if (typeof window.showToast === 'function') {
    window.showToast(enabled ? 'Automatic Supabase Sync Enabled 🔄' : 'Automatic Supabase Sync Disabled 🛑 (Manual Only)');
  }
};

window.pullSupabaseDataToLocal = async function(showToastAlert = true) {
  const client = window.getSupabaseClient();
  if (!client) {
    alert('Supabase client not initialized. Check URL & Key in Admin Settings.');
    return;
  }

  const cloudText = await window.fetchSiteTextFromSupabase();
  const cloudStudents = await window.fetchStudentsFromSupabase();
  const cloudRoutes = await window.fetchRoutesFromSupabase();

  let count = 0;
  if (cloudText) {
    localStorage.setItem('l2d_custom_site_text', JSON.stringify(cloudText));
    if (typeof window.hydrateSiteTextFromStorage === 'function') window.hydrateSiteTextFromStorage();
    count += Object.keys(cloudText).length;
  }
  if (cloudStudents) {
    localStorage.setItem('l2d_student_progress', JSON.stringify(cloudStudents));
    if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
    count += Object.keys(cloudStudents).length;
  }
  if (cloudRoutes) {
    localStorage.setItem('l2d_custom_routes', JSON.stringify(cloudRoutes));
    if (typeof window.initPrestonMap === 'function') window.initPrestonMap();
    count += Object.keys(cloudRoutes).length;
  }

  if (showToastAlert && typeof window.showToast === 'function') {
    window.showToast(`Pulled ${count} records live from Supabase Database! 📥`);
  }
};

/**
 * Submenu Tab 4: Reviews Directory Renderer
 */
function renderAdminReviewsTable() {
  const panel = document.getElementById('adminPanelReviews');
  if (!panel) return;

  let reviews = [];
  if (typeof window.loadReviewsFromStorage === 'function') {
    reviews = window.loadReviewsFromStorage();
  } else {
    try {
      const raw = localStorage.getItem('l2d_custom_reviews');
      reviews = raw ? JSON.parse(raw) : [];
    } catch(e) {}
  }

  const totalReviews = reviews.length;
  let totalRatingSum = 0;
  let fiveStarCount = 0;
  let firstTimeCount = 0;

  reviews.forEach(r => {
    totalRatingSum += (r.rating || 5);
    if ((r.rating || 5) === 5) fiveStarCount++;
    if (r.tag && (r.tag.includes('1st Time') || r.tag.includes('1st'))) firstTimeCount++;
  });

  const avgRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(1) : '5.0';

  const rowsHtml = reviews.map(rev => {
    const starsHtml = '★'.repeat(rev.rating || 5) + '☆'.repeat(5 - (rev.rating || 5));
    const textSnippet = (rev.text || '').length > 60 ? (rev.text.substring(0, 60) + '...') : (rev.text || '');

    return `
      <tr>
        <td><strong>${rev.author}</strong></td>
        <td><span style="color:#F57C00; font-weight:700;">${starsHtml}</span></td>
        <td><span class="badge badge-primary" style="font-size:0.75rem;">${rev.tag || 'Student Pass'}</span></td>
        <td><span class="badge badge-secondary">${rev.instructor || 'Farhan Hussaini'}</span></td>
        <td><span style="font-size:0.85rem; color:var(--text-light);">${rev.date || 'Recently'}</span></td>
        <td><span style="font-size:0.85rem; color:var(--text-main); font-style:italic;">"${textSnippet}"</span></td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn btn-secondary btn-sm" onclick="openReviewModal(${rev.id})" style="padding: 3px 8px; font-size: 0.75rem;">Edit</button>
            <button class="btn btn-accent btn-sm" onclick="deleteReview(${rev.id})" style="padding: 3px 8px; font-size: 0.75rem; background: var(--color-red, #EF4444); border-color: var(--color-red, #EF4444); color: #FFF;">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  panel.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card">
          <div class="stat-number">${totalReviews}</div>
          <div style="font-size:0.85rem; font-weight:700; color:var(--text-light);">Total Verified Reviews</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color:#F57C00;">${avgRating} ★</div>
          <div style="font-size:0.85rem; font-weight:700; color:var(--text-light);">Average Student Rating</div>
        </div>
        <div class="stat-card">
          <div style="font-family:var(--font-heading); font-size:1.6rem; font-weight:800; color:var(--color-green); margin-bottom:0.25rem;">
            ${firstTimeCount} | ${fiveStarCount}
          </div>
          <div style="font-size:0.85rem; font-weight:700; color:var(--text-light);">1st Time Passes & 5-Star Reviews</div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
        <div>
          <h3 style="margin:0;">Student Reviews & Testimonials Directory</h3>
          <p style="margin:0; font-size:0.88rem; color:var(--text-light);">Create, edit, or remove student reviews. All changes persist automatically to localStorage.</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openReviewModal()">+ Add New Review</button>
      </div>

      <div style="overflow-x:auto;">
        <table class="student-progress-table">
          <thead>
            <tr>
              <th>Student Author</th>
              <th>Rating</th>
              <th>Vehicle / Tag</th>
              <th>Instructor</th>
              <th>Date</th>
              <th>Review Text</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center; color:var(--text-light);">No student reviews found. Click "+ Add New Review" to create one.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

window.renderAdminReviewsTable = renderAdminReviewsTable;

/**
 * Save Site Settings & Hotspot Adjuster
 */
window.saveHubSpotPortalIdSetting = function() {
  const hsId = document.getElementById('editHubspotPortalId')?.value.trim() || '';
  if (hsId) {
    localStorage.setItem('l2d_hubspot_portal_id', hsId);
    if (typeof window.syncSiteTextToSupabase === 'function') {
      window.syncSiteTextToSupabase('hubspot_portal_id', hsId);
    }
    if (typeof window.initHubSpotCrm === 'function') {
      window.initHubSpotCrm();
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Saved HubSpot Portal ID & Synced to Cloud Database ☁️');
    }
  }
};

window.saveAdminContentEditorSettings = async function() {
  saveHubSpotPortalIdSetting();
  const newUser = document.getElementById('editAdminUsername')?.value.trim();
  const newPass = document.getElementById('editAdminPassword')?.value;
  if (newUser) {
    try {
      localStorage.setItem('l2d_admin_user', newUser);
    } catch(e) {}
  }
  if (newPass && newPass.trim() !== '') {
    try {
      const salt = generateSaltHex(16);
      const hash = await hashPassword(newPass, salt);
      localStorage.setItem('l2d_admin_password_salt', salt);
      localStorage.setItem('l2d_admin_password_hash', hash);
      localStorage.removeItem('l2d_admin_pass');
    } catch(e) {}
  }

  const heroBadge = document.getElementById('editHeroBadge')?.value.trim() || '';
  const heroHeading = document.getElementById('editHeroHeading')?.value.trim() || '';
  const heroText = document.getElementById('editHeroText')?.value.trim() || '';
  const contactPhone = document.getElementById('editContactPhone')?.value.trim() || '';
  const contactLocation = document.getElementById('editContactLocation')?.value.trim() || '';

  const siteContentObj = {
    heroBadge,
    heroHeading,
    heroText,
    contactPhone,
    contactLocation
  };
  try {
    localStorage.setItem('l2d_site_content', JSON.stringify(siteContentObj));
  } catch(e) {}

  if (typeof window.applyCustomSiteContent === 'function') {
    window.applyCustomSiteContent();
  }

  const yt1 = document.getElementById('editYarisTitle1')?.value.trim() || 'Biting Point Clutch';
  const yd1 = document.getElementById('editYarisDesc1')?.value.trim() || 'Smooth, lightweight clutch pedal designed for effortless hill starts on Penwortham Bridge.';
  const yx1 = parseInt(document.getElementById('editYarisX1')?.value || 26, 10);
  const yy1 = parseInt(document.getElementById('editYarisY1')?.value || 55, 10);

  const yt2 = document.getElementById('editYarisTitle2')?.value.trim() || 'He-Man Dual Controls';
  const yd2 = document.getElementById('editYarisDesc2')?.value.trim() || 'Full instructor dual brake and clutch pedals for 100% safety during initial lessons.';
  const yx2 = parseInt(document.getElementById('editYarisX2')?.value || 50, 10);
  const yy2 = parseInt(document.getElementById('editYarisY2')?.value || 48, 10);

  const yt3 = document.getElementById('editYarisTitle3')?.value.trim() || 'Reversing Camera';
  const yd3 = document.getElementById('editYarisDesc3')?.value.trim() || 'Wide-angle rear view camera with active guideline grid for parallel parking.';
  const yx3 = parseInt(document.getElementById('editYarisX3')?.value || 78, 10);
  const yy3 = parseInt(document.getElementById('editYarisY3')?.value || 52, 10);

  const kt1 = document.getElementById('editKonaTitle1')?.value.trim() || 'Zero Stalling Electric';
  const kd1 = document.getElementById('editKonaDesc1')?.value.trim() || 'No clutch, no gears! Focus 100% on road positioning and roundabouts around Chain Caul Way.';
  const kx1 = parseInt(document.getElementById('editKonaX1')?.value || 30, 10);
  const ky1 = parseInt(document.getElementById('editKonaY1')?.value || 54, 10);

  const kt2 = document.getElementById('editKonaTitle2')?.value.trim() || '360° Surround View';
  const kd2 = document.getElementById('editKonaDesc2')?.value.trim() || 'High-definition 4-camera overhead parking system makes bay parking effortlessly simple.';
  const kx2 = parseInt(document.getElementById('editKonaX2')?.value || 52, 10);
  const ky2 = parseInt(document.getElementById('editKonaY2')?.value || 42, 10);

  const kt3 = document.getElementById('editKonaTitle3')?.value.trim() || 'Dual Electric Pedals';
  const kd3 = document.getElementById('editKonaDesc3')?.value.trim() || 'Instructor dual braking system with instant regenerative stopping power.';
  const kx3 = parseInt(document.getElementById('editKonaX3')?.value || 76, 10);
  const ky3 = parseInt(document.getElementById('editKonaY3')?.value || 58, 10);

  const customFleet = {
    yaris: {
      hotspots: [
        { id: 1, title: yt1, desc: yd1, x: yx1, y: yy1 },
        { id: 2, title: yt2, desc: yd2, x: yx2, y: yy2 },
        { id: 3, title: yt3, desc: yd3, x: yx3, y: yy3 }
      ]
    },
    kona: {
      hotspots: [
        { id: 1, title: kt1, desc: kd1, x: kx1, y: ky1 },
        { id: 2, title: kt2, desc: kd2, x: kx2, y: ky2 },
        { id: 3, title: kt3, desc: kd3, x: kx3, y: ky3 }
      ]
    }
  };

  try {
    localStorage.setItem('l2d_custom_hotspots', JSON.stringify(customFleet));
    localStorage.setItem('l2d_fleet_hotspots', JSON.stringify(customFleet));

    const instaEndpoint = document.getElementById('editInstaEndpoint')?.value.trim() || '';
    if (instaEndpoint) {
      localStorage.setItem('l2d_insta_api_endpoint', instaEndpoint);
    } else {
      localStorage.removeItem('l2d_insta_api_endpoint');
    }

    const googleApiKey = document.getElementById('editGoogleApiKey')?.value.trim() || '';
    const googlePlaceId = document.getElementById('editGooglePlaceId')?.value.trim() || '';
    if (googleApiKey) {
      localStorage.setItem('l2d_google_places_api_key', googleApiKey);
    } else {
      localStorage.removeItem('l2d_google_places_api_key');
    }
    if (googlePlaceId) {
      localStorage.setItem('l2d_google_place_id', googlePlaceId);
    } else {
      localStorage.removeItem('l2d_google_place_id');
    }
  } catch(e) {}

  if (typeof window.fetchGoogleBusinessReviews === 'function') {
    window.fetchGoogleBusinessReviews();
  }

  if (typeof window.refreshShowroomDisplay === 'function') {
    window.refreshShowroomDisplay();
  }

  renderAdminHub();
  alert('Saved Admin Credentials, Site Content, Car Hotspots, Instagram API, and Google Business Profile settings successfully!');
  showToast('Saved All Editor Settings!');
};

/**
 * Instagram API Connection Tester (Behold.so / Graph API)
 */
window.testInstagramApiConnection = async function() {
  const input = document.getElementById('editInstaEndpoint');
  const url = input ? input.value.trim() : '';

  if (!url) {
    alert('Please enter an Instagram API endpoint URL first.');
    showToast('Please enter an Instagram API endpoint URL first.');
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('Invalid URL format. Instagram API endpoint must start with http:// or https://');
    return;
  }

  showToast('Testing Instagram API Endpoint connection... 📸');

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.data || data.items || []);
      localStorage.setItem('l2d_insta_api_endpoint', url);

      if (typeof window.syncSiteTextToSupabase === 'function') {
        window.syncSiteTextToSupabase('insta_api_endpoint', url);
      }

      if (typeof window.initInstaHighlights === 'function') {
        window.initInstaHighlights();
      }

      alert(`Instagram API Connection Successful!\n\nEndpoint: ${url}\nFetched ${items.length} live post(s) from @lrnr2drvr!`);
      showToast(`Instagram API Connected! Fetched ${items.length} posts!`);
    } else {
      alert(`Endpoint responded with status ${res.status}. Saved endpoint to storage and Supabase.`);
      localStorage.setItem('l2d_insta_api_endpoint', url);
      if (typeof window.syncSiteTextToSupabase === 'function') {
        window.syncSiteTextToSupabase('insta_api_endpoint', url);
      }
    }
  } catch(e) {
    alert(`Connected & Saved Instagram Endpoint:\n${url}\n\nSaved to local storage and Supabase.`);
    localStorage.setItem('l2d_insta_api_endpoint', url);
    if (typeof window.syncSiteTextToSupabase === 'function') {
      window.syncSiteTextToSupabase('insta_api_endpoint', url);
    }
  }
};

/**
 * Google Business Profile Reviews API Connection Tester
 */
window.testGoogleApiConnection = async function() {
  const apiKey = document.getElementById('editGoogleApiKey')?.value.trim() || '';
  const placeId = document.getElementById('editGooglePlaceId')?.value.trim() || '';

  if (apiKey) localStorage.setItem('l2d_google_places_api_key', apiKey);
  if (placeId) localStorage.setItem('l2d_google_place_id', placeId);

  const googleConfig = JSON.stringify({ apiKey, placeId });
  if (typeof window.syncSiteTextToSupabase === 'function') {
    window.syncSiteTextToSupabase('google_reviews_config', googleConfig);
  }

  showToast('Testing Google Places API connection...');

  if (typeof window.fetchGoogleBusinessReviews === 'function') {
    await window.fetchGoogleBusinessReviews();
  }

  alert(`Google Business Profile Reviews Settings Saved!\n\nAPI Key: ${apiKey ? 'Configured' : 'Default'}\nPlace ID: ${placeId || 'ChIJ... (Learner2Driver Preston)'}\n\nReviews synced across storage and Supabase!`);
  showToast('Saved & Tested Google Reviews Settings!');
};

/**
 * Student Account Management Functions (Modals & Actions)
 */
window.openCreateStudentModal = function() {
  const modal = document.getElementById('studentAccountModalBackdrop');
  if (!modal) return;

  const titleEl = document.getElementById('studentModalTitle');
  if (titleEl) titleEl.textContent = 'Setup New Student Account';

  const oldNameEl = document.getElementById('studentModalOldName');
  if (oldNameEl) oldNameEl.value = '';

  const userEl = document.getElementById('studentAccountUsername');
  if (userEl) userEl.value = '';

  const passEl = document.getElementById('studentAccountPassword');
  if (passEl) {
    passEl.value = '';
    passEl.placeholder = 'Enter new password (e.g. Learner2026!)';
  }

  const transEl = document.getElementById('studentAccountTransmission');
  if (transEl) transEl.value = 'Manual';

  const instEl = document.getElementById('studentAccountInstructor');
  if (instEl) instEl.value = 'Farhan Hussaini';

  modal.style.display = 'flex';
  if (userEl) userEl.focus();
};

window.openEditStudentModal = function(studentName) {
  const modal = document.getElementById('studentAccountModalBackdrop');
  if (!modal) return;
  const data = courseState.studentProgress[studentName];
  if (!data) return;

  const titleEl = document.getElementById('studentModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Student Profile';

  const oldNameEl = document.getElementById('studentModalOldName');
  if (oldNameEl) oldNameEl.value = studentName;

  const userEl = document.getElementById('studentAccountUsername');
  if (userEl) userEl.value = studentName;

  const passEl = document.getElementById('studentAccountPassword');
  if (passEl) {
    passEl.value = '';
    passEl.placeholder = 'Leave blank to keep current encrypted password';
  }

  const transEl = document.getElementById('studentAccountTransmission');
  if (transEl) transEl.value = data.transmission || 'Manual';

  const instEl = document.getElementById('studentAccountInstructor');
  if (instEl) instEl.value = data.instructor || 'Farhan Hussaini';

  modal.style.display = 'flex';
  if (userEl) userEl.focus();
};

window.closeStudentAccountModal = function() {
  const modal = document.getElementById('studentAccountModalBackdrop');
  if (modal) modal.style.display = 'none';
};

window.saveStudentAccountModal = async function() {
  const oldName = document.getElementById('studentModalOldName')?.value.trim();
  const username = document.getElementById('studentAccountUsername')?.value.trim();
  const password = document.getElementById('studentAccountPassword')?.value;
  const transmission = document.getElementById('studentAccountTransmission')?.value || 'Manual';
  const instructor = document.getElementById('studentAccountInstructor')?.value || 'Farhan Hussaini';

  if (!username) {
    alert('Please enter a student username.');
    return;
  }

  if (!oldName) {
    if (courseState.studentProgress[username]) {
      alert(`Student account named "${username}" already exists!`);
      return;
    }

    const plainPass = (password && password.trim() !== '') ? password : 'Learner2026!';
    const salt = generateSaltHex(16);
    const hash = await hashPassword(plainPass, salt);

    courseState.studentProgress[username] = {
      instructor,
      transmission,
      passwordSalt: salt,
      passwordHash: hash,
      completed: []
    };
    showToast(`Setup student account: ${username}`);
  } else {
    const existing = courseState.studentProgress[oldName] || { completed: [] };
    existing.instructor = instructor;
    existing.transmission = transmission;

    if (password && password.trim() !== '') {
      const salt = generateSaltHex(16);
      const hash = await hashPassword(password, salt);
      existing.passwordSalt = salt;
      existing.passwordHash = hash;
      delete existing.password;
    }

    if (username !== oldName) {
      if (courseState.studentProgress[username]) {
        alert(`Student account named "${username}" already exists!`);
        return;
      }
      courseState.studentProgress[username] = existing;
      delete courseState.studentProgress[oldName];
      if (courseState.currentStudent === oldName) {
        courseState.currentStudent = username;
      }
    }
    showToast(`Updated student profile: ${username}`);
  }

  if (typeof window.syncStudentToSupabase === 'function') {
    window.syncStudentToSupabase(username, courseState.studentProgress[username]);
    if (oldName && oldName !== username && typeof window.deleteStudentFromSupabase === 'function') {
      window.deleteStudentFromSupabase(oldName);
    }
  }

  saveLMSStateToStorage();
  closeStudentAccountModal();
  renderAdminProgressTable();
  renderLMSHeaderBar();
  renderCurriculumSidebar();
};

function findStudentKey(studentName) {
  if (!studentName) return null;
  const decoded = studentName.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  if (courseState.studentProgress[decoded]) return decoded;
  if (courseState.studentProgress[studentName]) return studentName;

  const keys = Object.keys(courseState.studentProgress || {});
  const found = keys.find(k => k.toLowerCase() === decoded.toLowerCase() || k.toLowerCase() === studentName.toLowerCase());
  return found || null;
}

window.resetStudentProgress = function(rawName) {
  const targetKey = findStudentKey(rawName);
  if (!targetKey) {
    alert(`Could not find student profile: ${rawName}`);
    return;
  }
  if (!confirm(`Are you sure you want to reset completion progress for "${targetKey}"?`)) return;

  courseState.studentProgress[targetKey].completed = [];
  if (typeof window.syncStudentToSupabase === 'function') {
    window.syncStudentToSupabase(targetKey, courseState.studentProgress[targetKey]);
  }
  saveLMSStateToStorage();
  renderAdminProgressTable();
  if (targetKey === courseState.currentStudent) {
    renderLMSHeaderBar();
    renderCurriculumSidebar();
  }
  showToast(`Reset progress for ${targetKey}.`);
};

window.deleteStudentAccount = function(rawName) {
  const targetKey = findStudentKey(rawName);
  if (!targetKey) {
    alert(`Could not find student account to delete: ${rawName}`);
    return;
  }

  if (!confirm(`Are you sure you want to permanently delete the student account for "${targetKey}"?`)) {
    return;
  }

  delete courseState.studentProgress[targetKey];
  if (typeof window.deleteStudentFromSupabase === 'function') {
    window.deleteStudentFromSupabase(targetKey);
  }

  if (courseState.currentStudent === targetKey) {
    courseState.currentStudent = null;
  }

  saveLMSStateToStorage();
  renderAdminProgressTable();
  renderLMSHeaderBar();
  renderCurriculumSidebar();
  checkStudentLoginGate();
  showToast(`Deleted student account: ${targetKey}.`);
};

document.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.action-delete-student');
  if (deleteBtn && deleteBtn.dataset.student) {
    e.preventDefault();
    const name = decodeURIComponent(deleteBtn.dataset.student);
    window.deleteStudentAccount(name);
    return;
  }

  const resetBtn = e.target.closest('.action-reset-student');
  if (resetBtn && resetBtn.dataset.student) {
    e.preventDefault();
    const name = decodeURIComponent(resetBtn.dataset.student);
    window.resetStudentProgress(name);
    return;
  }

  const editBtn = e.target.closest('.action-edit-student');
  if (editBtn && editBtn.dataset.student) {
    e.preventDefault();
    const name = decodeURIComponent(editBtn.dataset.student);
    window.openEditStudentModal(name);
    return;
  }
});

/**
 * Course Content Editor Modal Controllers (Module & Lesson)
 */
window.openCreateModuleModal = function() {
  const modal = document.getElementById('moduleModalBackdrop');
  if (!modal) return;

  const headerEl = document.getElementById('moduleModalTitleHeader');
  if (headerEl) headerEl.textContent = 'Add New Course Module';

  const idEl = document.getElementById('moduleModalId');
  if (idEl) idEl.value = '';

  const titleEl = document.getElementById('moduleModalTitle');
  if (titleEl) titleEl.value = '';

  const descEl = document.getElementById('moduleModalDescription');
  if (descEl) descEl.value = '';

  modal.style.display = 'flex';
  if (titleEl) titleEl.focus();
};

window.openEditModuleModal = function(modId) {
  const modal = document.getElementById('moduleModalBackdrop');
  if (!modal) return;
  const mod = (window.COURSE_DATA || []).find(m => m.id === modId);
  if (!mod) return;

  const headerEl = document.getElementById('moduleModalTitleHeader');
  if (headerEl) headerEl.textContent = 'Edit Course Module';

  const idEl = document.getElementById('moduleModalId');
  if (idEl) idEl.value = mod.id;

  const titleEl = document.getElementById('moduleModalTitle');
  if (titleEl) titleEl.value = mod.title || '';

  const descEl = document.getElementById('moduleModalDescription');
  if (descEl) descEl.value = mod.description || '';

  modal.style.display = 'flex';
  if (titleEl) titleEl.focus();
};

window.closeModuleModal = function() {
  const modal = document.getElementById('moduleModalBackdrop');
  if (modal) modal.style.display = 'none';
};

window.saveModuleModal = function() {
  const modId = document.getElementById('moduleModalId')?.value;
  const title = document.getElementById('moduleModalTitle')?.value.trim();
  const description = document.getElementById('moduleModalDescription')?.value.trim();

  if (!title) {
    alert('Please enter a module title.');
    return;
  }

  if (modId) {
    if (typeof window.updateModule === 'function') window.updateModule(modId, title, description);
  } else {
    if (typeof window.createModule === 'function') window.createModule(title, description);
  }
  closeModuleModal();
};

window.openCreateLessonModal = function(modId) {
  const modal = document.getElementById('lessonModalBackdrop');
  if (!modal) return;

  const headerEl = document.getElementById('lessonModalTitleHeader');
  if (headerEl) headerEl.textContent = 'Add New Lesson';

  const modIdEl = document.getElementById('lessonModalModId');
  if (modIdEl) modIdEl.value = modId;

  const idEl = document.getElementById('lessonModalId');
  if (idEl) idEl.value = '';

  const titleEl = document.getElementById('lessonModalTitle');
  if (titleEl) titleEl.value = '';

  const durEl = document.getElementById('lessonModalDuration');
  if (durEl) durEl.value = '5:00';

  const transEl = document.getElementById('lessonModalTransmission');
  if (transEl) transEl.value = 'All';

  const ytEl = document.getElementById('lessonModalYoutube');
  if (ytEl) ytEl.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  const tipEl = document.getElementById('lessonModalInstructorTip');
  if (tipEl) tipEl.value = '';

  const descEl = document.getElementById('lessonModalDescription');
  if (descEl) descEl.value = '';

  const freeEl = document.getElementById('lessonModalIsFree');
  if (freeEl) freeEl.checked = false;

  updateLessonModalLivePreview();
  modal.style.display = 'flex';
  if (titleEl) titleEl.focus();
};

window.openEditLessonModal = function(modId, lesId) {
  const modal = document.getElementById('lessonModalBackdrop');
  if (!modal) return;
  const mod = (window.COURSE_DATA || []).find(m => m.id === modId);
  if (!mod) return;
  const les = (mod.lessons || []).find(l => l.id === lesId);
  if (!les) return;

  const headerEl = document.getElementById('lessonModalTitleHeader');
  if (headerEl) headerEl.textContent = 'Edit Lesson';

  const modIdEl = document.getElementById('lessonModalModId');
  if (modIdEl) modIdEl.value = modId;

  const idEl = document.getElementById('lessonModalId');
  if (idEl) idEl.value = les.id;

  const titleEl = document.getElementById('lessonModalTitle');
  if (titleEl) titleEl.value = les.title || '';

  const durEl = document.getElementById('lessonModalDuration');
  if (durEl) durEl.value = les.duration || '5:00';

  const transEl = document.getElementById('lessonModalTransmission');
  if (transEl) transEl.value = les.transmission || 'All';

  const ytEl = document.getElementById('lessonModalYoutube');
  if (ytEl) ytEl.value = les.youtubeUrl || les.embedUrl || les.videoId || '';

  const tipEl = document.getElementById('lessonModalInstructorTip');
  if (tipEl) tipEl.value = les.instructorTip || les.tips || '';

  const descEl = document.getElementById('lessonModalDescription');
  if (descEl) descEl.value = les.description || '';

  const freeEl = document.getElementById('lessonModalIsFree');
  if (freeEl) freeEl.checked = !!les.isFreePreview;

  updateLessonModalLivePreview();
  modal.style.display = 'flex';
  if (titleEl) titleEl.focus();
};

window.closeLessonModal = function() {
  const modal = document.getElementById('lessonModalBackdrop');
  if (modal) modal.style.display = 'none';
};

window.updateLessonModalLivePreview = function() {
  const urlInput = document.getElementById('lessonModalYoutube');
  const iframe = document.getElementById('lessonModalPreviewIframe');
  const statusEl = document.getElementById('lessonModalPreviewStatus');
  if (!urlInput || !iframe) return;

  const parsed = (typeof window.parseYouTubeUrl === 'function') 
    ? window.parseYouTubeUrl(urlInput.value) 
    : parseYouTubeUrlFallback(urlInput.value);

  if (parsed.isValid && parsed.embedUrl) {
    iframe.src = parsed.embedUrl;
    iframe.style.display = 'block';
    if (statusEl) {
      statusEl.textContent = `✓ Valid YouTube Video (ID: ${parsed.videoId})`;
      statusEl.style.color = 'var(--color-green)';
    }
  } else {
    iframe.src = 'about:blank';
    iframe.style.display = 'none';
    if (statusEl) {
      statusEl.textContent = '⚠️ Invalid or empty YouTube URL. (Enter watch link, short link, or 11-char ID)';
      statusEl.style.color = 'var(--color-red, #EF4444)';
    }
  }
};

function parseYouTubeUrlFallback(url) {
  if (!url) return { isValid: false, videoId: null, embedUrl: null };
  const clean = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return { isValid: true, videoId: clean, embedUrl: `https://www.youtube.com/embed/${clean}?rel=0` };
  }
  const match = clean.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (match && match[1]) {
    return { isValid: true, videoId: match[1], embedUrl: `https://www.youtube.com/embed/${match[1]}?rel=0` };
  }
  return { isValid: false, videoId: null, embedUrl: null };
}

window.saveLessonModal = function() {
  const modId = document.getElementById('lessonModalModId')?.value;
  const lesId = document.getElementById('lessonModalId')?.value;
  const title = document.getElementById('lessonModalTitle')?.value.trim();
  const duration = document.getElementById('lessonModalDuration')?.value.trim() || '5:00';
  const transmission = document.getElementById('lessonModalTransmission')?.value || 'All';
  const youtubeUrl = document.getElementById('lessonModalYoutube')?.value.trim() || '';
  const instructorTip = document.getElementById('lessonModalInstructorTip')?.value.trim() || '';
  const description = document.getElementById('lessonModalDescription')?.value.trim() || '';
  const isFreePreview = document.getElementById('lessonModalIsFree')?.checked || false;

  if (!title) {
    alert('Please enter a lesson title.');
    return;
  }

  const payload = {
    title,
    duration,
    transmission,
    youtubeUrl,
    instructorTip,
    description,
    isFreePreview
  };

  if (lesId) {
    if (typeof window.updateLesson === 'function') window.updateLesson(modId, lesId, payload);
  } else {
    if (typeof window.createLesson === 'function') window.createLesson(modId, payload);
  }
  closeLessonModal();
};

function extractYouTubeID(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}
