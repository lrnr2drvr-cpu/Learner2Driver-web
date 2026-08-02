# Milestone 2: Transmission-Tailored Student LMS Syllabus Rendering Analysis & Design Specification

## Executive Summary
This report presents a comprehensive investigation and architectural design specification for **Milestone 2: Transmission-tailored student LMS syllabus rendering** within the Learner2Driver Phase 2 system.

Currently, Learner2Driver stores student transmission assignments (`Manual` vs `Automatic`) in user account state (`courseState.studentProgress[studentName].transmission`). However, curriculum syllabus rendering (`renderCurriculumSidebar`), progress calculations (`renderLMSHeaderBar`), and instructor monitoring (`renderAdminProgressTable`) operate uniformly across all curriculum lessons without distinguishing between Manual (Toyota Yaris) and Automatic (Hyundai Kona EV) learning tracks.

This document details:
1. **Current Codebase Audit & Data Analysis**: How transmission assignments in student accounts interact with lesson tags (`'Manual'`, `'Auto'`, `'All'`).
2. **Detailed Architectural Design**:
   - Dynamic lesson highlighting with badges and track accent borders for Manual vs Automatic students.
   - Syllabus filter toggle ("All Lessons" vs "My Transmission Track Only").
   - Dual-track progress math calculation (Track Completion % vs Overall Curriculum Completion %).
3. **Actionable Implementation Specification & Code Snippets**: Drop-in proposed replacement functions for `js/course-player.js`, `js/course-data.js`, `course.html`, and `styles/course.css`.

---

## 1. Observation

Direct code examination of the affected files produced the following key observations:

### Observation 1.1: Transmission Storage & Lesson Metadata Schema
- **File**: `js/course-data.js` (Lines 9–154)
  Lessons define a `transmission` property with values `'All'`, `'Manual'`, or `'Auto'`.
  - Line 19: `transmission: "All"` (e.g. `les-1-1` Under the Bonnet Checks)
  - Line 65: `transmission: "Manual"` (e.g. `les-2-2` Clutch Control & Stalling Prevention Yaris Manual)
  - Line 78: `transmission: "Auto"` (e.g. `les-2-3` Hill Starts & Electric Hold Kona EV)
  - Line 131: `transmission: "Manual"` (e.g. `les-4-1` Parallel Parking Behind a Car)
  - Line 145: `transmission: "Auto"` (e.g. `les-4-2` Reverse Bay Parking & Using EV Cameras)

- **File**: `js/course-player.js` (Lines 13–18 & Lines 118-122)
  Student accounts store transmission course assignment under `courseState.studentProgress[studentName].transmission`:
  - Line 14: `'Farhan Hussaini': { instructor: 'Farhan Hussaini', transmission: 'Manual', password: 'Learner2026!', completed: [] }`
  - Line 15: `'Ayesha Patel': { instructor: 'Farhan Hussaini', transmission: 'Automatic', password: 'Learner2026!', completed: [] }`
  - Note the string variation: Student accounts store `'Automatic'`, whereas lesson objects store `'Auto'`.

### Observation 1.2: Current Syllabus Rendering Ignores Student Transmission
- **File**: `js/course-player.js` (Lines 298–335)
  `renderCurriculumSidebar()` renders all modules and lessons without checking student transmission:
  ```javascript
  // Line 316-329
  ${lessons.map(lesson => {
    const isDone = completedSet.has(lesson.id);
    const isAct = courseState.activeLessonId === lesson.id;
    return `
      <li class="lesson-item ${isAct ? 'active' : ''}" onclick="selectLesson('${module.id}', '${lesson.id}')">
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="color: ${isDone ? 'var(--color-green)' : 'var(--text-light)'};">
            ${isDone ? '✓' : '•'}
          </span>
          ${lesson.title}
        </span>
        <span style="font-size:0.75rem; color:var(--text-light);">${lesson.duration || ''}</span>
      </li>
    `;
  }).join('')}
  ```
  - **No transmission badge or accent highlighting** is applied to indicate whether a lesson is tailored to the student's vehicle track (Manual Yaris vs Auto Kona EV).
  - **No filter toggle UI** exists to allow a student to hide opposite-transmission lessons.

### Observation 1.3: Single-Track Progress Math Skews Completion Metrics
- **File**: `js/course-player.js` (Lines 264–283)
  `renderLMSHeaderBar()` calculates completion relative to `countTotalLessons()` (all 9 lessons):
  ```javascript
  // Lines 264-267
  const totalLessons = countTotalLessons();
  const studentData = courseState.studentProgress[courseState.currentStudent] || { completed: [] };
  const completedCount = (studentData.completed || []).length;
  const percent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;
  ```
  - If a Manual student completes all 7 lessons applicable to their track (5 `'All'` + 2 `'Manual'`), their calculated progress is `7 / 9` (`78%`), rendering full track completion impossible to achieve.
  - If an Automatic student completes all 7 lessons applicable to their track (5 `'All'` + 2 `'Auto'`), their progress is also capped at `78%`.

- **File**: `js/course-player.js` (Lines 512–547)
  `renderAdminProgressTable()` calculates student completion for instructors using the same un-tailored formula: `compCount / totalLessons`.

---

## 2. Logic Chain

1. **Premise 1**: Students are enrolled in specific transmission tracks (`Manual` in Toyota Yaris or `Automatic` in Hyundai Kona EV).
2. **Premise 2**: DVSA curriculum content consists of core universal driving skills (`transmission: 'All'`), manual-specific mechanics (`transmission: 'Manual'`), and EV automatic controls (`transmission: 'Auto'`).
3. **Inference 1**: Comparing `studentData.transmission` against `lesson.transmission` requires string normalization (`'Automatic'` <-> `'Auto'`).
4. **Inference 2**: When a student logs in, the LMS should immediately tailor the syllabus view:
   - Manual students see Manual & Core lessons highlighted as "My Track".
   - Automatic students see Automatic & Core lessons highlighted as "My Track".
   - Off-track lessons should be visually distinguished or filterable.
5. **Inference 3**: Course progress must be calculated relative to the student's tailored track (e.g. 7 track lessons = 100% completion) alongside overall curriculum completion metrics.

---

## 3. Detailed Architectural & UI/UX Specification

### Component A: Data Normalization & Track Comparison Helper Functions

Add utility functions to `js/course-player.js`:

```javascript
/**
 * Normalize transmission string values ('Automatic' -> 'Auto', 'Manual' -> 'Manual', 'All' -> 'All')
 */
function normalizeTransmission(trans) {
  if (!trans) return 'All';
  const t = String(trans).trim().toLowerCase();
  if (t === 'automatic' || t === 'auto') return 'Auto';
  if (t === 'manual') return 'Manual';
  return 'All';
}

/**
 * Check if a lesson belongs to a student's assigned transmission track
 */
function isLessonInStudentTrack(lessonTransmission, studentTransmission) {
  const normLesson = normalizeTransmission(lessonTransmission);
  const normStudent = normalizeTransmission(studentTransmission);
  return normLesson === 'All' || normLesson === normStudent;
}

/**
 * Calculate comprehensive student progress metrics (Track vs Overall)
 */
function calculateStudentProgressMetrics(studentName) {
  const studentData = (courseState.studentProgress && courseState.studentProgress[studentName]) || {};
  const studentTrans = studentData.transmission || 'Manual';
  const completedSet = new Set(studentData.completed || []);

  let overallTotal = 0;
  let overallCompleted = 0;
  let trackTotal = 0;
  let trackCompleted = 0;

  (window.COURSE_DATA || []).forEach(mod => {
    (mod.lessons || []).forEach(lesson => {
      overallTotal++;
      const isDone = completedSet.has(lesson.id);
      if (isDone) overallCompleted++;

      if (isLessonInStudentTrack(lesson.transmission, studentTrans)) {
        trackTotal++;
        if (isDone) trackCompleted++;
      }
    });
  });

  const trackPercent = trackTotal > 0 ? Math.min(100, Math.round((trackCompleted / trackTotal) * 100)) : 0;
  const overallPercent = overallTotal > 0 ? Math.min(100, Math.round((overallCompleted / overallTotal) * 100)) : 0;
  const normTrack = normalizeTransmission(studentTrans);
  const trackLabel = normTrack === 'Auto' ? '⚡ Automatic Track (Kona EV)' : '🕹️ Manual Track (Yaris)';

  return {
    studentTransmission: studentTrans,
    normTrack,
    trackLabel,
    trackTotal,
    trackCompleted,
    trackPercent,
    overallTotal,
    overallCompleted,
    overallPercent
  };
}
```

---

### Component B: Highlighting Tailored Lessons Specification

#### Visual Design Rules:
1. **Track-Match Lessons (`transmission === studentTransmission`)**:
   - **Manual Student + Manual Lesson**: Dedicated badge `<span class="badge badge-transmission-manual">🕹️ My Track (Yaris)</span>`, left accent border `border-left: 3px solid #2563EB`, background highlight `rgba(37, 99, 235, 0.08)`.
   - **Auto Student + Auto Lesson**: Dedicated badge `<span class="badge badge-transmission-auto">⚡ My Track (Kona EV)</span>`, left accent border `border-left: 3px solid #7C3AED`, background highlight `rgba(124, 58, 237, 0.08)`.
2. **Universal Core Lessons (`transmission === 'All'`)**:
   - Display badge `<span class="badge badge-transmission-all">🌐 Core Track</span>`, left accent border `border-left: 3px solid #059669`.
3. **Opposite-Track Lessons (Off-Track)**:
   - When viewing "All Lessons", off-track lessons render with muted opacity (`opacity: 0.65`), secondary badge `<span class="badge badge-secondary" style="font-size:0.68rem;">⚡ Auto Only</span>` or `<span class="badge badge-secondary" style="font-size:0.68rem;">🕹️ Manual Only</span>`, and gray left border.

---

### Component C: Syllabus Filter Toggle Specification

#### UI Control Placement:
Directly inside `.curriculum-sidebar` above `#curriculumTree`:

```html
<div class="syllabus-filter-bar mb-3" style="background: var(--bg-body); padding: 0.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
  <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-light); margin-bottom: 0.35rem; display: flex; justify-content: space-between; align-items: center;">
    <span>SHOW SYLLABUS LESSONS:</span>
    <span class="badge badge-primary" style="font-size: 0.68rem;">${currentStudentTrans}</span>
  </div>
  <div style="display: flex; gap: 0.35rem;">
    <button class="syllabus-toggle-btn ${filter === 'all' ? 'active' : ''}" onclick="setSyllabusFilter('all')">
      All Lessons (${overallTotal})
    </button>
    <button class="syllabus-toggle-btn ${filter === 'track' ? 'active' : ''}" onclick="setSyllabusFilter('track')">
      My Track Only (${trackTotal})
    </button>
  </div>
</div>
```

#### State Management:
- Store filter choice in `courseState.syllabusFilter` (default: `'track'` when student is logged in, `'all'` when admin or logged out).
- When `courseState.syllabusFilter === 'track'`, filter out opposite-track lessons from `renderCurriculumSidebar()`.

---

### Component D: Progress Math Calculation Specification

#### Header Progress Bar (`renderLMSHeaderBar`):
Display primary progress based on the student's tailored track, alongside a secondary readout for overall curriculum progress:

```html
<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
  <div style="font-size: 0.92rem; font-weight: 800; color: var(--color-green);">
    ${metrics.trackLabel}: ${metrics.trackCompleted}/${metrics.trackTotal} (${metrics.trackPercent}%)
  </div>
  <div style="display: flex; align-items: center; gap: 0.75rem;">
    <div style="width: 140px; height: 10px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
      <div style="width: ${metrics.trackPercent}%; height: 100%; background: var(--color-green); transition: width 0.4s ease;"></div>
    </div>
    <span style="font-size: 0.78rem; color: var(--text-light); font-weight: 600;">
      Overall Curriculum: ${metrics.overallCompleted}/${metrics.overallTotal} (${metrics.overallPercent}%)
    </span>
  </div>
</div>
```

#### Admin Progress Table (`renderAdminProgressTable`):
Update table columns to report both **Track Progress** and **Overall Progress** for every student account:

| Student Name | Instructor | Transmission | Password | Track Progress | Overall Progress | Actions |
|---|---|---|---|---|---|---|
| 👤 Farhan Hussaini | Farhan Hussaini | 🕹️ Manual | `Learner2026!` | **3/7 (43%)** [Manual Track] | 3/9 (33%) | Edit / Reset / Remove |
| 👤 Ayesha Patel | Farhan Hussaini | ⚡ Automatic | `Learner2026!` | **5/7 (71%)** [Auto Track] | 5/9 (56%) | Edit / Reset / Remove |

---

## 4. Proposed Source Code Edits & Snippets

### Proposed Changes for `js/course-player.js`

```javascript
// Add syllabusFilter to courseState
let courseState = {
  activeLessonId: null,
  isAdmin: false,
  currentStudent: null,
  syllabusFilter: 'track', // 'all' or 'track'
  studentProgress: { ... }
};

// Add setSyllabusFilter handler
window.setSyllabusFilter = function(filterMode) {
  courseState.syllabusFilter = filterMode;
  renderCurriculumSidebar();
};

// Updated renderLMSHeaderBar using calculateStudentProgressMetrics()
function renderLMSHeaderBar() {
  const bar = document.getElementById('studentLMSBar');
  if (!bar) return;

  if (!courseState.currentStudent) {
    bar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.85rem;">
        <span class="badge badge-primary">Student LMS</span>
        <strong style="color: var(--text-light);">Not Logged In</strong>
        <button class="btn btn-primary btn-sm" onclick="checkStudentLoginGate()">Student Login 🔑</button>
      </div>
    `;
    return;
  }

  const metrics = calculateStudentProgressMetrics(courseState.currentStudent);

  bar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
      <span class="badge badge-primary">${courseState.isAdmin ? '🛡️ Admin Mode' : '🎓 Student LMS'}</span>
      <strong style="color: var(--text-main); font-size: 1.05rem;">👤 ${courseState.currentStudent}</strong>
      <span class="badge ${metrics.normTrack === 'Auto' ? 'badge-transmission-auto' : 'badge-transmission-manual'}">${metrics.trackLabel}</span>
      <button class="btn btn-secondary btn-sm" onclick="logoutStudent()" style="padding: 0.25rem 0.7rem; font-size: 0.78rem;">Switch Profile / Log Out</button>
    </div>
    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
      <div style="font-size: 0.92rem; font-weight: 800; color: var(--color-green);">
        ${metrics.trackLabel}: ${metrics.trackCompleted}/${metrics.trackTotal} (${metrics.trackPercent}%)
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="width: 140px; height: 10px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
          <div style="width: ${metrics.trackPercent}%; height: 100%; background: var(--color-green); transition: width 0.4s ease;"></div>
        </div>
        <span style="font-size: 0.78rem; color: var(--text-light); font-weight: 600;">Overall: ${metrics.overallCompleted}/${metrics.overallTotal} (${metrics.overallPercent}%)</span>
      </div>
    </div>
  `;
}
```

### Proposed Changes for `styles/course.css`

```css
/* Filter Buttons */
.syllabus-toggle-btn {
  flex: 1;
  padding: 0.4rem 0.6rem;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.78rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
  min-height: 36px;
}

.syllabus-toggle-btn.active {
  background: var(--color-green);
  color: #FFF;
  border-color: var(--color-green);
}

/* Tailored Lesson Items */
.lesson-item.track-match-manual {
  border-left: 3px solid #2563EB;
  background: rgba(37, 99, 235, 0.05);
}

.lesson-item.track-match-auto {
  border-left: 3px solid #7C3AED;
  background: rgba(124, 58, 237, 0.05);
}

.lesson-item.track-universal {
  border-left: 3px solid #059669;
}

.lesson-item.track-off {
  opacity: 0.65;
  border-left: 3px solid var(--border-color);
}
```

---

## 5. Caveats

- **No external network access needed**: All student profiles and course curriculum data reside in client-side memory (`courseState`) and persist in `localStorage` under `l2d_student_progress` and `l2d_custom_course_data`.
- **Backward Compatibility**: If no student is logged in, default student transmission is treated as `'Manual'` or `'All'`, and the filter defaults to `'all'`.

---

## 6. Conclusion

Milestone 2 addresses the gap between student transmission assignments (`Manual` vs `Automatic`) and LMS syllabus rendering. Implementing normalized transmission comparison, tailored visual badges/borders, a filter toggle, and dual-track completion calculations will provide learners and instructors with an intuitive, track-tailored LMS experience.

---

## 7. Verification Method

1. **Automated / Manual Browser State Verification**:
   - Open `course.html` in browser.
   - Log in as student **Farhan Hussaini** (Manual student). Verify header shows `🕹️ Manual Track (Yaris) Completion: 0/7 (0%)`.
   - Verify sidebar highlights Manual lessons (e.g. `2.2 Clutch Control`) with `🕹️ My Track` badge.
   - Click **"My Track Only"** toggle button. Verify Auto-only lessons (`2.3` & `4.2`) disappear from sidebar.
   - Click checkmark for `les-1-1` and `les-2-2`. Verify Track Completion updates to `2/7 (29%)` and Overall updates to `2/9 (22%)`.
   - Log out and log in as student **Ayesha Patel** (Automatic student). Verify header shows `⚡ Automatic Track (Kona EV) Completion: 0/7 (0%)`.
   - Verify `les-2-3` (Kona EV Hill Starts) and `les-4-2` (EV Bay Parking) are highlighted as `⚡ My Track`.
   - Log in as **Admin** (`admin` / `Huzaifa1`). Open **Student Accounts & Progress** tab. Verify table displays both Track Completion % and Overall Completion % for all enrolled students.

2. **Storage Consistency Verification**:
   - Inspect `localStorage.getItem('l2d_student_progress')` in Browser DevTools Console to confirm completed lesson arrays retain IDs correctly regardless of active transmission filter.
