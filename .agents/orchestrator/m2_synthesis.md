# Milestone 2 Synthesis & Technical Implementation Specification

## Scope
**Web Crypto SHA-256 Password Security & Transmission-Tailored Student LMS**
Target files: `course.html`, `js/course-player.js`, `js/course-data.js`, `js/app.js`, `styles/course.css`, `styles/components.css`.

---

## Technical Specifications

### 1. Web Crypto SHA-256 Password Hashing & Credential Security
- **Salt Generation**: `generateSaltHex(lengthBytes = 16)` returning a 32-character random hex string via `window.crypto.getRandomValues()`.
- **SHA-256 Hashing**: `async hashPassword(password, saltHex)` using browser-native `crypto.subtle.digest('SHA-256', ...)`, returning a 64-character hex string.
- **Verification Helper**: `async verifyPassword(inputPassword, storedSaltHex, storedHashHex)`.
- **Auto-Migration (`migrateCredentialsToSHA256`)**:
  - Run automatically on initialization (`DOMContentLoaded`).
  - Convert `localStorage.l2d_admin_pass` (or default `Huzaifa1`) to `l2d_admin_password_hash` & `l2d_admin_password_salt`, purging `l2d_admin_pass`.
  - Convert student `password` fields in `courseState.studentProgress` to `passwordHash` & `passwordSalt`, purging plain-text `password`.
- **Plain-Text Credential Purge**:
  - Remove all plain-text passwords or hints (`admin`, `Huzaifa1`, `Learner2026!`) from `course.html` line 49, line 69 (`value="admin"` removed), lines 108-111 (`value="Learner2026!"` removed, `type="text"` -> `type="password"`), and line 443 footer.
  - In Admin Hub Student Directory table, display `🔒 Encrypted (SHA-256)` badge instead of plain-text passwords.
  - Remove credentials from error messages and alert popups.

---

### 2. Student LMS Login Portal (`#studentPortalGate`)
- **Form Layout**: `#studentPortalGate` modal overlay in `course.html` with:
  - Username input: `<input type="text" id="portalStudentUsername" class="portal-input" placeholder="Enter student username" required>`
  - Password input: `<input type="password" id="portalStudentPassword" class="portal-input" placeholder="Enter password" required>`
  - Error container: `<div id="portalStudentLoginError" style="color: var(--color-red, #EF4444); font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem;"></div>`
  - Submit button: `Log In to My LMS Dashboard 🚀` triggering `submitStudentPortalLogin(event)`.
- **Authentication Logic (`authenticateStudent`)**:
  - Validates username & password input presence.
  - Checks if student exists in `courseState.studentProgress`.
  - Hashes entered password with student's salt and verifies against stored `passwordHash`.
  - Handles error messages: `"Please enter both username and password"`, `"Student username not found"`, `"Incorrect password"`.
  - Persists active session in `localStorage.l2d_current_student`.

---

### 3. Transmission-Tailored Student LMS Syllabus
- **Track Matching**:
  - Normalize student transmission (`'Manual'` vs `'Automatic'` / `'Auto'`).
  - Lessons with `transmission: 'Manual'` match Manual Yaris students.
  - Lessons with `transmission: 'Auto'` match Automatic Kona EV students.
  - Lessons with `transmission: 'All'` match all students.
- **Visual Badges & Highlight**:
  - Manual track match: `<span class="badge badge-transmission-manual">🕹️ My Track (Yaris)</span>`, left border `#2563EB`, background tint `rgba(37, 99, 235, 0.05)`.
  - Auto track match: `<span class="badge badge-transmission-auto">⚡ My Track (Kona EV)</span>`, left border `#7C3AED`, background tint `rgba(124, 58, 237, 0.05)`.
  - Universal core match: `<span class="badge badge-transmission-all">🌐 Core Track</span>`, left border `#059669`.
  - Off-track lessons: opacity `0.65`, gray left border, `⚡ Auto Only` or `🕹️ Manual Only` badge.
- **Syllabus Filter Toggle**:
  - Segmented toggle inside sidebar: `"All Lessons"` vs `"My Track Only"`.
  - Managed by `courseState.syllabusFilter` (`'all'` vs `'track'`).
- **Dual Progress Math (`calculateStudentProgressMetrics`)**:
  - Track Progress: `trackCompleted / trackTotal` (e.g. 7 lessons for Manual/Auto = 100% full track completion).
  - Overall Curriculum Progress: `overallCompleted / overallTotal` (e.g. 9 total lessons).
  - Header bar and Admin Progress Table display both Track Progress and Overall Progress.

---

## Verification Criteria
1. Open `course.html`. Verify no plain-text credentials (`admin`, `Huzaifa1`, `Learner2026!`) appear anywhere in DOM elements, placeholders, or footers.
2. Verify `localStorage` stores `l2d_admin_password_hash` and `l2d_admin_password_salt`. Verify `l2d_admin_pass` is purged.
3. Open Student Login Portal. Enter invalid username or password -> verify error message. Enter valid username (`Farhan Hussaini`) and password (`Learner2026!`) -> verify successful login.
4. Verify LMS Header shows `🕹️ Manual Track (Yaris)` for Farhan, highlighting Manual lessons.
5. Test "My Track Only" toggle button -> verify Auto-only lessons hide.
6. Log in as `Ayesha Patel` (Automatic). Verify `⚡ Automatic Track (Kona EV)` is highlighted.
7. Check Admin Progress Table -> verify both Track Progress % and Overall Progress % are rendered.
