## 2026-08-01T08:56:56Z
You are an Implementation Worker subagent implementing Milestone 2 for Learner2Driver Phase 2.
Your working directory for coordination files is: `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_worker_p2_m2_1\`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

TASK OBJECTIVE:
Implement Milestone 2: **Web Crypto SHA-256 Password Security & Transmission-Tailored Student LMS** according to the technical specification in `c:\Users\huzai\Documents\learner2driver\.agents\orchestrator\m2_synthesis.md`.

SPECIFIC IMPLEMENTATION STEPS:
1. Read `c:\Users\huzai\Documents\learner2driver\.agents\orchestrator\m2_synthesis.md`.
2. Update `js\course-player.js`, `js\course-data.js`, and `js\app.js`:
   - Implement `generateSaltHex()`, `hashPassword()`, `verifyPassword()`, and `migrateCredentialsToSHA256()`.
   - Purge all plain-text credential leaks across JS functions, Admin table columns (`🔒 Encrypted (SHA-256)` badge), and error alerts.
   - Implement `#studentPortalGate` student login requiring both Username and Password via `authenticateStudent(username, plainPassword)`.
   - Implement transmission normalization, tailored lesson highlighting (`🕹️ My Track (Yaris)`, `⚡ My Track (Kona EV)`, `🌐 Core Track`), syllabus filter toggle ("All Lessons" vs "My Track Only"), and dual progress metrics calculation (`calculateStudentProgressMetrics`).
   - Update `renderLMSHeaderBar()` and `renderAdminProgressTable()` to present both Track Progress % and Overall Progress %.
3. Update `course.html`:
   - Update `#studentPortalGate` with `#portalStudentUsername`, `#portalStudentPassword`, `#portalStudentLoginError`, and form submit handler.
   - Remove plain-text credentials and pre-filled inputs from HTML line 49, line 69, lines 108-111 (`type="password"`), and line 443 footer.
4. Update `styles\course.css` and `styles\components.css`:
   - Add styling for `.syllabus-toggle-btn`, `.lesson-item.track-match-manual`, `.lesson-item.track-match-auto`, `.lesson-item.track-universal`, `.lesson-item.track-off`.
5. Verify zero console errors, zero plain-text leaks, and proper state persistence. Write your handoff report to `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_worker_p2_m2_1\handoff.md`.
6. Use `send_message` to notify the orchestrator when finished. Include your handoff file path.
