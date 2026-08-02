# Milestone 1 Synthesis & Technical Implementation Specification

## Scope
**Course Content Editor & Restructured Admin Hub Layout**
Target files: `course.html`, `js/course-data.js`, `js/course-player.js`, `styles/course.css`, `styles/components.css`.

---

## Key Requirements & Functional Specs

### 1. Custom Course Data Persistence & CRUD Engine (`js/course-data.js` & `js/course-player.js`)
- **LocalStorage Key**: `l2d_custom_course_data`
- **Data Schema**: Array of module objects:
  ```json
  [
    {
      "id": "mod-1",
      "title": "Module 1: Show Me, Tell Me Questions",
      "description": "Master all DVSA vehicle safety questions...",
      "lessons": [
        {
          "id": "les-1-1",
          "title": "1.1 Under the Bonnet Checks",
          "duration": "4:30",
          "transmission": "All",
          "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "videoId": "dQw4w9WgXcQ",
          "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
          "instructorTip": "Always check fluid levels when engine is cool!",
          "tips": "Always check fluid levels when engine is cool!",
          "description": "How to open bonnet and check oil, coolant, brake fluid.",
          "isFreePreview": true
        }
      ]
    }
  ]
  ```
- **Storage Initialization**:
  - Read `localStorage.getItem('l2d_custom_course_data')`. If present and valid array, set `window.COURSE_DATA = parsed`. Else deep-clone `DEFAULT_COURSE_MODULES`.
- **YouTube Parser (`parseYouTubeUrl`)**:
  - Convert standard links, `youtu.be/`, `embed/`, or 11-char IDs into `{ isValid, videoId, embedUrl }`.
  - Handle live iframe preview on `oninput` inside lesson modal.
- **Module CRUD**:
  - `createModule(title, desc)`: Generate ID `mod-[timestamp]`, append, save, refresh UI.
  - `updateModule(modId, title, desc)`: Find, edit, save, refresh UI.
  - `deleteModule(modId)`: Confirm prompt, remove module, purge all contained lesson IDs from student completion records, refresh UI.
- **Lesson CRUD**:
  - `createLesson(modId, payload)`: Generate ID `les-[timestamp]`, parse YouTube URL, set transmission tag (`Manual`, `Auto`, `All`), push to module, save, refresh UI.
  - `updateLesson(modId, lesId, payload)`: Find, parse YouTube URL, update properties, if active lesson re-render theater, save, refresh UI.
  - `deleteLesson(modId, lesId)`: Confirm prompt, remove lesson, scrub lesson ID from all student `completed` lists, switch active lesson if active was deleted, save, refresh UI.

---

### 2. Critical Bug Fix in `js/course-player.js`
- **Line 291 Fix**: Fix unquoted `${module.id}` in `renderCurriculumSidebar()`:
  - Change `onclick="selectLesson(${module.id}, '${lesson.id}')"` to `onclick="selectLesson('${module.id}', '${lesson.id}')"`.
  - Enclose defensive checks for `(module.lessons || [])`.

---

### 3. Restructured Admin Hub Navigation Hierarchy (`course.html` & `js/course-player.js`)
- Replace stacked boxes with `#adminHubContainer`.
- **Primary View (Default Tab)**: `👥 Student Accounts & Progress` (`#adminTabStudents` / `#adminPanelStudents`).
  - Displays total students stat, average progress stat, manual vs auto ratio stat.
  - Enrolment directory table showing Username, Instructor, Transmission Badge (`Manual` vs `Automatic`), Password (`••••••••`), Completed ratio, Progress bar, Actions (`Edit`, `Reset`, `Remove`).
  - Button `+ Setup New Student Account 🎓` opening `#studentAccountModalBackdrop`.
- **Submenu Tabs**:
  - **Submenu Tab A**: `📚 Course Content Editor` (`#adminTabContentEditor` / `#adminPanelContentEditor`).
    - Accordion cards per module with Add Lesson, Edit Module, Delete Module, and table of lessons with Transmission Tags.
    - Modals: `#moduleModalBackdrop` and `#lessonModalBackdrop`.
  - **Submenu Tab B**: `⚙️ Advanced Site Settings` (`#adminTabSiteSettings` / `#adminPanelSiteSettings`).
    - Section 1: Site Content & Branding Text (Hero badge, Phone, Heading, Description, Location).
    - Section 2: Instructor Admin Account Credentials (Username, Password).
    - Section 3: Instagram API Endpoint & Integration Guide (`@lrnr2drvr` setup guide + test API button `testInstagramApiConnection()`).
    - Section 4: Showroom Fleet Hotspot Point Adjuster (X%/Y% coordinates).
- **Tab Switching Logic (`switchAdminTab`)**:
  - Toggles `.active`, `aria-selected`, `tabindex`, and `hidden` attribute.
  - ARIA keyboard arrow navigation listener (`ArrowLeft`, `ArrowRight`, `Home`, `End`).

---

### 4. Student Account Setup & Management (`#studentAccountModalBackdrop`)
- Fields: Student Full Name / Username, Student Portal Password, Transmission Course Select (`Manual` vs `Automatic`), Assigned Instructor Select (`Farhan Hussaini` vs `Binish Moazzam`).
- Functions: `openCreateStudentModal()`, `openEditStudentModal(studentName)`, `closeStudentAccountModal()`, `saveStudentAccountModal()`, `resetStudentProgress(studentName)`, `deleteStudentAccount(studentName)`.

---

### 5. CSS Rules (`styles/course.css` & `styles/components.css`)
- `.admin-hub-container`, `.admin-hub-header`, `.admin-user-badge`, `.admin-nav-bar`, `.admin-tab-group`, `.admin-tab-btn`, `.admin-tab-btn.active`, `.admin-tab-panel`.
- `.badge-transmission-manual`, `.badge-transmission-auto`, `.badge-transmission-all`.
- `.module-editor-card`, `.module-editor-header`, `.lesson-editor-table`, `.insta-guide-box`.

---

## Verification Criteria
1. Open `course.html` in browser. Login as Admin (`admin` / `Huzaifa1`).
2. Verify Admin Hub opens with **Student Accounts & Progress** tab active by default.
3. Test setup new student account with Username, Password, Transmission (`Manual` or `Automatic`), and Instructor. Verify entry appears in student table.
4. Switch to **Course Content Editor** tab. Add a new module, add a lesson with YouTube link, verify live preview. Edit lesson and delete lesson.
5. Switch to **Advanced Site Settings** tab. Modify site text and credentials. Test Instagram API button.
6. Click any lesson in student LMS sidebar — verify zero console errors (`Uncaught ReferenceError: mod is not defined` fixed).
