# Phase 2 Milestone 2: Student LMS Login & Password Authentication Specification

## 1. Observation

### Current Files Inspected
- `c:\Users\huzai\Documents\learner2driver\course.html`
- `c:\Users\huzai\Documents\learner2driver\js\course-player.js`
- `c:\Users\huzai\Documents\learner2driver\js\course-data.js`
- `c:\Users\huzai\Documents\learner2driver\js\app.js`

### Existing Implementation Analysis
1. **Modal Layout (`course.html`, lines 18–52)**:
   - Contains `#studentPortalGate` modal overlay.
   - Text explicitly indicates `(NO PIN REQUIRED! DEMO: FARHAN HUSSAINI)`.
   - HTML inputs currently present: `#portalStudentName` (text input) and `#portalInstructorSelect` (dropdown select).
   - Missing elements:
     - No password input element (`type="password"`).
     - No inline error display container (unlike `#adminLoginModalBackdrop` which has `#adminLoginError`).
     - Button calls `submitStudentPortalLogin()` directly without form validation or event handling.

2. **State & Authentication Handling (`js/course-player.js`, lines 9–18, 47–101, 141–165)**:
   - Initial state object `courseState` defines `studentProgress` with 3 default accounts:
     - `'Farhan Hussaini'`: `{ instructor: 'Farhan Hussaini', transmission: 'Manual', password: 'Learner2026!', completed: [] }`
     - `'Ayesha Patel'`: `{ instructor: 'Farhan Hussaini', transmission: 'Automatic', password: 'Learner2026!', completed: [] }`
     - `'Liam O\'Connor'`: `{ instructor: 'Binish Moazzam', transmission: 'Manual', password: 'Learner2026!', completed: [] }`
   - Default passwords are plain-text strings (`'Learner2026!'`).
   - Function `submitStudentPortalLogin()` (lines 141–165) accepts any entered name, creates a new entry if none exists, sets `courseState.currentStudent = name`, and immediately unlocks the LMS dashboard without password verification.
   - Session persistence uses key `l2d_current_student` in `localStorage` via `loadLMSStateFromStorage()` and `saveLMSStateToStorage()`.

---

## 2. Logic Chain

1. **User Requirement & Security Gap**:
   - The current portal allows any user to log in under any student name without authentication.
   - Phase 2 Milestone 2 requires a secure login flow where students must provide both a **Username** and **Password**.
   - Passwords must be hashed using SHA-256 with a salt, yielding a 64-character hexadecimal hash string stored in `courseState.studentProgress[username]`.

2. **UI Architecture Design (`#studentPortalGate`)**:
   - Update `#studentPortalGate` card structure to include:
     - Username input: `<input type="text" id="portalStudentUsername" class="portal-input" ...>`
     - Password input: `<input type="password" id="portalStudentPassword" class="portal-input" ...>`
     - Inline Error message container: `<div id="portalStudentLoginError" style="color: var(--color-red, #EF4444); font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem;"></div>`
     - Form container `<form onsubmit="submitStudentPortalLogin(event); return false;">` enabling Enter-key submission and standard accessibility.

3. **Authentication & Hashing Strategy**:
   - **Salt Definition**: `const L2D_AUTH_SALT = 'L2D_STUDENT_PORTAL_SALT_2026';`
   - **SHA-256 Helper (`hashStudentPassword`)**: Uses native browser Web Crypto API (`crypto.subtle.digest('SHA-256', data)`). Hashes `salt + plainPassword` into a 32-byte array and converts to a 64-character hex string.
   - **Authentication Handler (`authenticateStudent(username, plainPassword)`)**:
     1. Validates presence of `username` and `plainPassword`. If either is missing, returns `{ success: false, code: 'MISSING_FIELDS', message: 'Please enter both username and password.' }`.
     2. Checks if `username` exists in `courseState.studentProgress`. If not, returns `{ success: false, code: 'INVALID_USERNAME', message: 'Student account not found. Please check your username.' }`.
     3. Hashes `plainPassword` with salt to compute 64-char hex string `computedHash`.
     4. Compares `computedHash` against `studentData.passwordHash` (or `studentData.password`).
     5. If hashes match (case-insensitive), returns `{ success: true, code: 'SUCCESS', studentData }`.
     6. If hashes do not match, returns `{ success: false, code: 'INCORRECT_PASSWORD', message: 'Incorrect password. Please try again.' }`.

4. **Storage & Backward Compatibility Migration**:
   - Existing default students ('Farhan Hussaini', 'Ayesha Patel', 'Liam O\'Connor') should store pre-hashed 64-character SHA-256 strings in `passwordHash` (or `password`).
   - During `loadLMSStateFromStorage()`, if a student entry contains a plain-text password (length != 64 hex characters), the system automatically hashes the plain password with salt and updates `passwordHash`.
   - On successful login, `courseState.currentStudent` is set to `username` and persisted to `localStorage.setItem('l2d_current_student', username)`.

---

## 3. Caveats

1. **Async Web Crypto API**:
   - `crypto.subtle.digest` is asynchronous and returns a Promise.
   - `authenticateStudent` and `submitStudentPortalLogin` must be `async` functions using `await`.
2. **Client-Side LMS Architecture**:
   - As a client-side HTML5/JS web app, hashing occurs in the browser. While client-side hashing prevents plain-text exposure in `localStorage` and client memory, real-world production LMS apps rely on server-side HTTPS/TLS endpoints.
3. **Form Submission & Event Handling**:
   - `submitStudentPortalLogin(event)` must accept an optional `event` parameter and invoke `event.preventDefault()` to prevent traditional form reloads when pressing Enter in password inputs.

---

## 4. Conclusion & Complete Design Specification

### A. HTML Layout Diffs / DSN for `course.html` (`#studentPortalGate`)

Replace lines 18–52 in `course.html` with:

```html
  <!-- STUDENT LMS LOGIN PORTAL OVERLAY -->
  <div id="studentPortalGate" class="student-portal-gate" style="display: none;">
    <div class="student-portal-card">
      <div style="margin-bottom: 1.25rem;">
        <span class="badge badge-primary mb-1">Enrolled Students Only</span>
        <h2 style="margin: 0;">Student LMS Login Portal</h2>
        <p style="font-size: 0.92rem; color: var(--text-light); margin-top: 0.4rem;">
          Enter your student username and password to access your personal video curriculum and checkmark dashboard.
        </p>
      </div>

      <form id="studentLoginForm" onsubmit="submitStudentPortalLogin(event); return false;" style="text-align: left; margin-bottom: 1.5rem;">
        <label for="portalStudentUsername" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
          Student Username:
        </label>
        <input type="text" id="portalStudentUsername" class="portal-input" placeholder="e.g. Farhan Hussaini or Ayesha Patel" value="Farhan Hussaini" required autocomplete="username">

        <label for="portalStudentPassword" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
          Student Password:
        </label>
        <input type="password" id="portalStudentPassword" class="portal-input" placeholder="Enter password" style="margin-bottom: 0.5rem;" required autocomplete="current-password">

        <div id="portalStudentLoginError" style="color: var(--color-red, #EF4444); font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem;"></div>

        <button type="submit" class="btn btn-primary w-full mb-2">
          Log In to My LMS Dashboard 🚀
        </button>
      </form>

      <div style="font-size: 0.8rem; color: var(--text-light); border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
        Are you an instructor? <a href="#" onclick="openAdminLoginModal(); return false;" style="color:var(--color-green); font-weight:700;">Login as Admin</a> (User: <code>admin</code> • Pass: <code>Huzaifa1</code>) to open the Admin Hub.
      </div>
    </div>
  </div>
```

---

### B. JavaScript Specifications for `js/course-player.js`

#### 1. Salt Constant & SHA-256 Hashing Helper

```javascript
const L2D_AUTH_SALT = 'L2D_STUDENT_PORTAL_SALT_2026';

/**
 * Hashes a plain text password with L2D_AUTH_SALT into a 64-character SHA-256 hex string.
 * @param {string} plainPassword 
 * @param {string} [salt=L2D_AUTH_SALT] 
 * @returns {Promise<string>} 64-character hex string
 */
async function hashStudentPassword(plainPassword, salt = L2D_AUTH_SALT) {
  if (!plainPassword) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + plainPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
window.hashStudentPassword = hashStudentPassword;
```

#### 2. Authentication Function (`authenticateStudent`)

```javascript
/**
 * Authenticates student credentials against courseState.studentProgress.
 * Hashes plainPassword with salt and compares against 64-char SHA-256 hash.
 * 
 * @param {string} username 
 * @param {string} plainPassword 
 * @returns {Promise<{ success: boolean, code: string, message: string, studentData?: object }>}
 */
async function authenticateStudent(username, plainPassword) {
  const cleanUsername = (username || '').trim();
  const cleanPassword = (plainPassword || '').trim();

  // 1. Missing Fields Check
  if (!cleanUsername || !cleanPassword) {
    return {
      success: false,
      code: 'MISSING_FIELDS',
      message: 'Please enter both your username and password.'
    };
  }

  // 2. User Existence Check
  const studentData = courseState.studentProgress[cleanUsername];
  if (!studentData) {
    return {
      success: false,
      code: 'INVALID_USERNAME',
      message: 'Student username not found. Please check your credentials.'
    };
  }

  // 3. SHA-256 Hash Calculation
  const computedHash = await hashStudentPassword(cleanPassword);
  const storedHash = studentData.passwordHash || studentData.password || '';

  // 4. Verification & Auto-Migration logic
  let isMatch = false;
  if (storedHash.length === 64) {
    isMatch = (computedHash.toLowerCase() === storedHash.toLowerCase());
  } else if (storedHash.length > 0) {
    // Legacy fallback for plain-text entries: upgrade to 64-char hash
    if (cleanPassword === storedHash) {
      isMatch = true;
      studentData.passwordHash = computedHash;
      studentData.password = computedHash; // Keep sync
      if (typeof saveLMSStateToStorage === 'function') saveLMSStateToStorage();
    }
  }

  // 5. Password Match Check
  if (!isMatch) {
    return {
      success: false,
      code: 'INCORRECT_PASSWORD',
      message: 'Incorrect password. Please try again.'
    };
  }

  return {
    success: true,
    code: 'SUCCESS',
    message: `Welcome back, ${cleanUsername}!`,
    studentData
  };
}
window.authenticateStudent = authenticateStudent;
```

#### 3. Modal Form Submission Handler (`submitStudentPortalLogin`)

```javascript
/**
 * Student Login Portal Submission Handler
 */
window.submitStudentPortalLogin = async function(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const userInput = document.getElementById('portalStudentUsername');
  const passInput = document.getElementById('portalStudentPassword');
  const errorEl = document.getElementById('portalStudentLoginError');

  if (errorEl) errorEl.textContent = '';

  const username = userInput ? userInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  const authResult = await authenticateStudent(username, password);

  if (!authResult.success) {
    if (errorEl) {
      errorEl.textContent = authResult.message;
    } else {
      alert(authResult.message);
    }
    return;
  }

  // Set session state & persist to l2d_current_student
  courseState.currentStudent = username;
  if (typeof saveLMSStateToStorage === 'function') {
    saveLMSStateToStorage();
  }

  // Reset password input & update UI
  if (passInput) passInput.value = '';
  checkStudentLoginGate();
  renderLMSHeaderBar();
  renderCurriculumSidebar();
  showToast(`Welcome back, ${username}! LMS Dashboard Unlocked 🎉`);
};
```

#### 4. Storage Integration & Legacy Migration (`loadLMSStateFromStorage`)

Enhance `loadLMSStateFromStorage()` to automatically migrate plain text passwords to 64-char SHA-256 hashes during startup:

```javascript
async function migrateStudentPasswords() {
  let modified = false;
  for (const name of Object.keys(courseState.studentProgress || {})) {
    const sp = courseState.studentProgress[name];
    if (sp) {
      const pass = sp.passwordHash || sp.password || 'Learner2026!';
      if (pass.length !== 64) {
        sp.passwordHash = await hashStudentPassword(pass);
        sp.password = sp.passwordHash;
        modified = true;
      }
    }
  }
  if (modified && typeof saveLMSStateToStorage === 'function') {
    saveLMSStateToStorage();
  }
}
```

---

## 5. Verification Method

1. **HTML Inspection**:
   - Inspect `course.html` and verify `#studentPortalGate` contains `#portalStudentUsername`, `#portalStudentPassword`, `#portalStudentLoginError`, and `<form>`.

2. **Functional Authentication Tests**:
   - **Test 1: Empty Fields**: Click "Log In" with empty inputs -> verify `#portalStudentLoginError` displays `"Please enter both your username and password."`
   - **Test 2: Unknown User**: Enter username `NonExistentUser` and password `Password123` -> verify error `"Student username not found. Please check your credentials."`
   - **Test 3: Incorrect Password**: Enter username `Farhan Hussaini` and password `WrongPassword!` -> verify error `"Incorrect password. Please try again."`
   - **Test 4: Valid Login**: Enter username `Farhan Hussaini` and password `Learner2026!` -> verify modal closes (`#studentPortalGate` hidden), toast appears, session header shows `👤 Farhan Hussaini`, and `localStorage.getItem('l2d_current_student')` equals `"Farhan Hussaini"`.
   - **Test 5: Password Hash Format**: Check `courseState.studentProgress['Farhan Hussaini'].passwordHash` in browser console -> verify string length is exactly 64 hexadecimal characters.
