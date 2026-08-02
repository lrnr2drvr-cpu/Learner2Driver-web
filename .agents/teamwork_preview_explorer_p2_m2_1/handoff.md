# Milestone 2 Investigation & SHA-256 Hashing Specification Report

## 1. Observation

Direct examination of `course.html`, `js/course-player.js`, `js/app.js`, and `js/course-data.js` revealed multiple plain-text credential leaks, hardcoded credentials, insecure localStorage storage, and missing password hashing mechanisms.

### 1.1 Summary of Credential Vulnerability Locations

| File | Line(s) | Category | Code Snippet / Context | Security Risk |
|---|---|---|---|---|
| `course.html` | 49 | UI Leak | `(User: <code>admin</code> • Pass: <code>Huzaifa1</code>)` | Publicly exposes default admin credentials in the Student Portal Gate login card footer. |
| `course.html` | 69 | DOM Attribute | `<input type="text" id="adminLoginUsername" ... value="admin">` | Pre-fills admin username in DOM `value` attribute on public modal. |
| `course.html` | 108–111 | DOM Attribute / UI | `<input type="text" id="studentAccountPassword" ... value="Learner2026!">` | Uses `type="text"` instead of `type="password"`; pre-fills plain-text default password `Learner2026!`. |
| `course.html` | 443 | UI Leak | `User: <code>admin</code> • Pass: <code>Huzaifa1</code>` | Exposes admin credentials in main footer of the website. |
| `js/course-player.js` | 4 | Header Comment | `Student Login Without PIN (Demo: Farhan Hussaini) • Admin: admin / Huzaifa1` | Credentials in code documentation. |
| `js/course-player.js` | 13–17 | Hardcoded Data | `password: 'Learner2026!'` in default `studentProgress` object | Hardcoded plain-text passwords stored in memory for initial student profiles (`Farhan Hussaini`, `Ayesha Patel`, `Liam O'Connor`). |
| `js/course-player.js` | 22–36 | Hardcoded Fallback | `return localStorage.getItem('l2d_admin_user') || 'admin';`<br>`return localStorage.getItem('l2d_admin_pass') || 'Huzaifa1';` | Returns unhashed plain-text default admin username & password. |
| `js/course-player.js` | 73, 154, 392, 1128, 1156, 1176 | Plain-text Fallbacks | `if (!sp.password) sp.password = 'Learner2026!';` and `password = ... || 'Learner2026!'` | Fallback plain-text passwords injected during state loading, login, or account creation/editing. |
| `js/course-player.js` | 186, 229, 231 | UI Prompts / Alerts | `'Invalid Admin Credentials. Default: admin / Huzaifa1'` | Leaks credentials in authentication error alerts and inline error elements. |
| `js/course-player.js` | 218 | Authentication Check | `if (user === getAdminUsername() && pass === getAdminPassword())` | Synchronous plain-text string comparison without cryptographic hashing or salting. |
| `js/course-player.js` | 538 | UI Leak | `<td><code>${data.password || 'Learner2026!'}</code></td>` | Renders plain-text student passwords in DOM table inside Admin Hub Student Directory. |
| `js/course-player.js` | 991–994 | Insecure Storage | `localStorage.setItem('l2d_admin_user', newUser);`<br>`localStorage.setItem('l2d_admin_pass', newPass);` | Writes raw plain-text password to `localStorage.l2d_admin_pass`. |
| `js/course-player.js` | 99 | Insecure Storage | `localStorage.setItem('l2d_student_progress', JSON.stringify(courseState.studentProgress));` | Persists student progress JSON containing plain-text `password` property. |

---

## 2. Logic Chain

1. **Observation**: Plain-text passwords (`Huzaifa1`, `Learner2026!`) are stored in `localStorage` under `l2d_admin_pass` and `l2d_student_progress`, displayed in HTML elements (lines 49, 443, 538 in `course.html` and `js/course-player.js`), and evaluated via standard string equality (`===`).
2. **Deduction**: Any user inspect-elementing the DOM, viewing `localStorage`, or reading public pages gains immediate unauthorized access to admin and student accounts.
3. **Requirement**: To secure credentials according to Phase 2 Milestone 2 specifications:
   - Synchronous plain-text checks must be replaced with async Web Crypto `crypto.subtle.digest('SHA-256', ...)` verification.
   - Each credential (admin or student) must be paired with a unique 16-byte cryptographically secure random salt (hex-encoded, 32 characters).
   - Plain-text passwords must be completely removed from `localStorage`, public DOM attributes, placeholders, table renders, and error alerts.
   - An auto-migration routine must execute on initial load to convert existing plain-text storage keys (`l2d_admin_pass` and `sp.password`) into salt and SHA-256 hash pairs without losing existing account access.

---

## 3. Caveats

- **Web Crypto Availability**: `window.crypto.subtle` is supported in all modern browsers and secure contexts (HTTPS / localhost). In legacy HTTP non-secure contexts (excluding `localhost`), `crypto.subtle` may be undefined. A fallback error-handling or lightweight JS SHA-256 implementation can be considered if legacy HTTP support is required, but standard Web Crypto is native to all modern browsers.
- **Async Execution**: `crypto.subtle.digest` returns a `Promise`. Therefore, functions that verify passwords (`submitAdminLoginModal`, `openAdminLoginModal`) or save credentials must be `async` or handle Promise resolution cleanly.
- **Student Login Flow**: Currently, `submitStudentPortalLogin()` accepts any student name without asking for a student password. If student password authentication is added in future milestones, the hashed password infrastructure designed here will support it seamlessly.

---

## 4. Conclusion & SHA-256 Password Hashing Specification

### 4.1 Cryptographic Architecture & Helper Functions

#### 1. Salt Generation Helper (`generateSaltHex`)
Generates a 16-byte (128-bit) cryptographically random salt using `window.crypto.getRandomValues()` and returns a 32-character hexadecimal string.

```javascript
function generateSaltHex(lengthBytes = 16) {
  const array = new Uint8Array(lengthBytes);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

#### 2. SHA-256 Password Hashing Helper (`hashPassword`)
Hashes a `password` concatenated with a `saltHex` using browser-native `crypto.subtle.digest('SHA-256', ...)`, producing a 64-character lowercase hex string.

```javascript
async function hashPassword(password, saltHex) {
  if (typeof password !== 'string' || typeof saltHex !== 'string') {
    throw new Error('hashPassword requires string password and string saltHex');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

#### 3. Password Verification Helper (`verifyPassword`)
```javascript
async function verifyPassword(inputPassword, storedSaltHex, storedHashHex) {
  if (!inputPassword || !storedSaltHex || !storedHashHex) return false;
  const computedHash = await hashPassword(inputPassword, storedSaltHex);
  return computedHash.toLowerCase() === storedHashHex.toLowerCase();
}
```

---

### 4.2 Storage Schema & Data Models

#### 1. Admin Credentials Schema (`localStorage`)
- `l2d_admin_user`: Admin username (string, e.g. `'admin'`)
- `l2d_admin_password_hash`: 64-character SHA-256 hex string
- `l2d_admin_password_salt`: 32-character hex salt string
- **Purged Key**: `l2d_admin_pass` (removed from `localStorage` on migration)

#### 2. Student Profile Schema (`courseState.studentProgress` & `l2d_student_progress`)
```json
{
  "Farhan Hussaini": {
    "instructor": "Farhan Hussaini",
    "transmission": "Manual",
    "passwordHash": "<64-char-hex-hash>",
    "passwordSalt": "<32-char-hex-salt>",
    "completed": []
  }
}
```
- **Purged Property**: `password` (removed from student profile objects upon migration)

---

### 4.3 Automatic Migration Engine (`migrateCredentialsToSHA256`)

Runs automatically on application initialization (`DOMContentLoaded`):

```javascript
async function migrateCredentialsToSHA256() {
  let stateModified = false;

  // --- A. Admin Credentials Migration ---
  const legacyAdminPass = localStorage.getItem('l2d_admin_pass');
  let adminHash = localStorage.getItem('l2d_admin_password_hash');
  let adminSalt = localStorage.getItem('l2d_admin_password_salt');

  if (legacyAdminPass || !adminHash || !adminSalt) {
    const rawPassToMigrate = legacyAdminPass || 'Huzaifa1';
    adminSalt = generateSaltHex();
    adminHash = await hashPassword(rawPassToMigrate, adminSalt);

    localStorage.setItem('l2d_admin_user', localStorage.getItem('l2d_admin_user') || 'admin');
    localStorage.setItem('l2d_admin_password_hash', adminHash);
    localStorage.setItem('l2d_admin_password_salt', adminSalt);
    localStorage.removeItem('l2d_admin_pass'); // Purge legacy plain-text key
    stateModified = true;
  }

  // --- B. Student Credentials Migration ---
  const studentNames = Object.keys(courseState.studentProgress || {});
  for (const name of studentNames) {
    const student = courseState.studentProgress[name];
    if (student) {
      if (student.password || !student.passwordHash || !student.passwordSalt) {
        const rawStudentPass = student.password || 'Learner2026!';
        const newSalt = generateSaltHex();
        const newHash = await hashPassword(rawStudentPass, newSalt);

        student.passwordHash = newHash;
        student.passwordSalt = newSalt;
        delete student.password; // Purge legacy plain-text field
        stateModified = true;
      }
    }
  }

  if (stateModified) {
    saveLMSStateToStorage();
  }

  return stateModified;
}
```

---

### 4.4 Plain-Text Credential Purge Plan

#### Direct HTML / DOM Modifications (`course.html`)
1. **Line 49**:
   - Replace: `Are you an instructor? <a href="#" onclick="openAdminLoginModal(); return false;" style="...">Login as Admin</a> (User: <code>admin</code> • Pass: <code>Huzaifa1</code>) to open the Admin Hub.`
   - With: `Are you an instructor? <a href="#" onclick="openAdminLoginModal(); return false;" style="...">Login as Admin</a> to access the Admin Hub.`
2. **Line 69**:
   - Replace: `<input type="text" id="adminLoginUsername" class="portal-input" placeholder="e.g. admin" value="admin" required>`
   - With: `<input type="text" id="adminLoginUsername" class="portal-input" placeholder="Enter admin username" required>`
3. **Lines 108–111**:
   - Replace: `<input type="text" id="studentAccountPassword" class="portal-input" placeholder="e.g. Learner2026!" value="Learner2026!" required>`
   - With: `<input type="password" id="studentAccountPassword" class="portal-input" placeholder="Enter new password (leave blank to keep current)">`
4. **Line 443**:
   - Replace: `<p style="font-size:0.9rem; margin-bottom:0.5rem;">User: <code>admin</code> • Pass: <code>Huzaifa1</code></p>`
   - With: `<p style="font-size:0.9rem; margin-bottom:0.5rem; color:#94A3B8;">Instructor & Admin Access Only</p>`

#### JavaScript Code Refactoring (`js/course-player.js`)
1. **Admin Hub Progress Table (Line 538)**:
   - Replace: `<td><code>${data.password || 'Learner2026!'}</code></td>`
   - With: `<td><span class="badge badge-secondary">🔒 Encrypted (SHA-256)</span></td>`
2. **Admin Authentication Handlers (`submitAdminLoginModal` & `openAdminLoginModal`)**:
   - Make functions `async`.
   - Fetch `l2d_admin_user` (default `'admin'`), `l2d_admin_password_hash`, and `l2d_admin_password_salt`.
   - Verify input password using `await verifyPassword(inputPassword, salt, hash)`.
   - Remove default credential strings (`admin` / `Huzaifa1`) from error alerts and error messages.
3. **Student Account Saving (`saveStudentAccountModal`)**:
   - Make function `async`.
   - If a new password is set, generate salt via `generateSaltHex()`, hash it via `await hashPassword(password, salt)`, and assign `passwordHash` and `passwordSalt` to the student object.
   - Never store plain-text `password` property.
4. **Admin Settings Saving (`saveAdminContentEditorSettings`)**:
   - Make function `async`.
   - When updating admin password, generate salt via `generateSaltHex()`, compute hash via `await hashPassword(newPass, newSalt)`, and update `l2d_admin_password_hash` and `l2d_admin_password_salt` in `localStorage`.
   - Delete any legacy `l2d_admin_pass` key.

---

## 5. Verification Method

To verify implementation:

1. **DOM Inspection Verification**:
   - Open `course.html` in browser.
   - Inspect Student Portal Gate footer, Admin login modal input, Student account modal input, and page footer.
   - Confirm strings `admin`, `Huzaifa1`, `Learner2026!` do not appear in any visible HTML text, `value` attributes, or placeholders.

2. **LocalStorage & Storage Schema Inspection**:
   - Open DevTools -> Application -> Local Storage.
   - Verify `l2d_admin_pass` does NOT exist.
   - Verify `l2d_admin_password_hash` exists and is a 64-character hex string.
   - Verify `l2d_admin_password_salt` exists and is a 32-character hex string.
   - Inspect `l2d_student_progress` JSON: verify student entries have `passwordHash` and `passwordSalt` properties and NO `password` property.

3. **Authentication Functionality Verification**:
   - Open Admin Modal, enter `admin` and `Huzaifa1`. Verify login unlocks successfully via SHA-256 hash comparison.
   - Change Admin password in Admin Hub -> Site Settings. Verify login works with new password and rejects old password.
