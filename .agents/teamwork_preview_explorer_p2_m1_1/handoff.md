# Handoff Report: Learner2Driver Phase 2 - Milestone 1 Investigation & Specification

**Target File**: `c:\Users\huzai\Documents\learner2driver\.agents\teamwork_preview_explorer_p2_m1_1\handoff.md`  
**Author**: Explorer Subagent (Milestone 1)  
**Date**: 2026-08-01  
**Status**: Completed  

---

## 1. Observation

Direct examination of the existing codebase (`course.html`, `js/course-data.js`, `js/course-player.js`, and `styles/course.css`) revealed the following structural details:

### 1.1 `js/course-data.js`
- Defines a static global array `DEFAULT_COURSE_MODULES` containing 4 DVSA driving modules (`mod-1` to `mod-4`).
- Each module object contains:
  - `id`: String (e.g., `"mod-1"`)
  - `title`: String (e.g., `"Module 1: Show Me, Tell Me Questions"`)
  - `description`: String (e.g., `"Master all DVSA vehicle safety questions..."`)
  - `lessons`: Array of lesson objects.
- Each lesson object contains:
  - `id`: String (e.g., `"les-1-1"`)
  - `title`: String (e.g., `"1.1 Under the Bonnet Checks (Oil, Coolant, Brake Fluid)"`)
  - `duration`: String (e.g., `"4:30"`)
  - `videoId`: String (e.g., `"dQw4w9WgXcQ"`)
  - `embedUrl`: String (e.g., `"https://www.youtube.com/embed/videoseries?..."`)
  - `description`: String
  - `tips`: String (or `instructorTip`)
  - `isFreePreview`: Boolean
- The file exposes `window.COURSE_DATA = DEFAULT_COURSE_MODULES;` directly on window load without any `localStorage` reading or persistence logic.

### 1.2 `js/course-player.js`
- Controls state management through `courseState`:
  ```javascript
  let courseState = {
    activeLessonId: null,
    isAdmin: false,
    currentStudent: null,
    studentProgress: { ... }
  };
  ```
- Reads/writes LMS state using `loadLMSStateFromStorage()` and `saveLMSStateToStorage()`, persisting:
  - `l2d_current_student`
  - `l2d_student_progress`
  - `l2d_admin_user`, `l2d_admin_pass`
  - `l2d_site_content`
  - `l2d_custom_hotspots` / `l2d_fleet_hotspots`
  - `l2d_insta_api_endpoint`
- Dynamic rendering functions:
  - `renderLMSHeaderBar()` (updates completion counter `${completedCount}/${totalLessons}`)
  - `renderCurriculumSidebar()` (builds module headers and `.lesson-item` elements in `#curriculumTree`)
  - `renderAdminToolbar()` (displays admin actions bar)
  - `renderAdminProgressTable()` (displays student progress table)
  - `renderAdminContentEditor()` (renders form for site content, credentials, and car hotspots in `#adminContentEditorBox`)
  - `renderLessonTheater(lesson)` (loads video iframe `#activeVideoFrame`, title `#activeLessonTitle`, duration `#activeLessonMeta`, and tip `#activeLessonTip`)
  - `extractYouTubeID(url)` (lines 956-960):
    ```javascript
    function extractYouTubeID(url) {
      if (!url) return null;
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
      return match ? match[1] : null;
    }
    ```

### 1.3 `course.html`
- Contains root containers:
  - `#instructorAdminToolbar` (line 168)
  - `#adminContentEditorBox` (line 171)
  - `#studentLMSBar` (line 174)
  - `#adminProgressTableBox` (line 177)
  - `#curriculumTree` (line 192)
  - `#activeVideoFrame`, `#activeLessonTitle`, `#activeLessonMeta`, `#activeLessonTip` (lines 200-225)
- Includes modals: `#studentPortalGate`, `#adminLoginModalBackdrop`, `#editStudentModalBackdrop`.
- Currently lacks modal backdrops or DOM targets for Course Content Module & Lesson CRUD forms.

### 1.4 `styles/course.css`
- Contains layout and styling for:
  - Modal overlay (`.student-portal-gate`, `.student-portal-card`)
  - Form input (`.portal-input`)
  - Admin editor panel (`.admin-editor-panel`, `.admin-editor-section`)
  - Curriculum sidebar tree (`.curriculum-sidebar`, `.module-header`, `.lesson-item`)
  - Video theater (`.video-theater-box`, `.video-frame-wrapper`)

---

## 2. Logic Chain

1. **Storage Integration**: Currently, `window.COURSE_DATA` points directly to `DEFAULT_COURSE_MODULES`. To support custom course content, a new function `loadCourseDataFromStorage()` must run during initialization (`DOMContentLoaded`). It will check `localStorage.getItem('l2d_custom_course_data')`. If valid custom data exists, `window.COURSE_DATA` will be set to the parsed array; otherwise, it will fall back to `DEFAULT_COURSE_MODULES`.
2. **Schema Uniformity**: To seamlessly integrate custom content with existing functions (`renderCurriculumSidebar()`, `selectLesson()`, `renderLessonTheater()`, and `renderLMSHeaderBar()`), every lesson in `l2d_custom_course_data` must maintain existing field names (`id`, `title`, `duration`, `description`, `videoId`, `embedUrl`, `tips`/`instructorTip`, `isFreePreview`) while adding the new `transmission` tag field (`"Manual"`, `"Auto"`, or `"All"`).
3. **CRUD Operations Logic**:
   - **Modules**:
     - *Add*: Generate `mod-${Date.now()}`, push module object `{ id, title, description, lessons: [] }` to `window.COURSE_DATA`, save to `localStorage`, re-render sidebar and editor.
     - *Edit*: Update module `title` and `description` in `window.COURSE_DATA`, save and re-render.
     - *Delete*: Remove module by ID. Purge contained lesson IDs from all student progress records (`courseState.studentProgress`), update active lesson if necessary, save and re-render.
   - **Lessons**:
     - *Add*: Select module, generate `les-${Date.now()}`, parse YouTube URL to compute `videoId` and `embedUrl`, attach fields (`title`, `duration`, `transmission`, `youtubeUrl`, `videoId`, `embedUrl`, `instructorTip`, `description`), push to module's `lessons` array, save and re-render.
     - *Edit*: Update lesson properties by matching `moduleId` and `lessonId`, re-parse YouTube URL, update active lesson theater if currently selected, save and re-render.
     - *Delete*: Remove lesson from module's `lessons` array. Remove lesson ID from all student completion progress (`studentProgress[student].completed`), select next available lesson if active, save and re-render.
4. **YouTube Parser & Live Preview**:
   - Standard YouTube URLs can take multiple forms (`watch?v=`, `youtu.be/`, `embed/`, or raw 11-character video IDs).
   - An expanded parser `parseYouTubeUrl(input)` will extract the 11-char ID, test validity, construct `https://www.youtube.com/embed/${videoId}?rel=0`, and handle invalid input gracefully with an error indicator.
   - Live iframe generator in the lesson edit modal will react to `oninput` events on the YouTube URL input, updating a live preview iframe instantly.
5. **UI & CSS Integration**:
   - Insert a "Course Curriculum & Lesson Content Editor" section inside `renderAdminContentEditor()` within `#adminContentEditorBox`.
   - Add two reusable modals to `course.html`: `#moduleModalBackdrop` (Module Add/Edit) and `#lessonModalBackdrop` (Lesson Add/Edit).
   - Add dedicated CSS classes in `styles/course.css` for transmission badges, lesson list items, and modal inputs.

---

## 3. Data Schema Specification (`l2d_custom_course_data`)

### 3.1 LocalStorage Key
`l2d_custom_course_data`

### 3.2 Full JSON Schema Definition

```json
[
  {
    "id": "mod-1",
    "title": "Module 1: Show Me, Tell Me Questions",
    "description": "Master all DVSA vehicle safety questions asked at the start of your practical test.",
    "lessons": [
      {
        "id": "les-1-1",
        "title": "1.1 Under the Bonnet Checks (Oil, Coolant, Brake Fluid)",
        "duration": "4:30",
        "transmission": "All",
        "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "videoId": "dQw4w9WgXcQ",
        "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0",
        "description": "How to open the bonnet and identify the engine oil dipstick, coolant tank, and brake fluid reservoir safely.",
        "instructorTip": "Always make sure the engine is cool before checking fluid levels on test day!",
        "tips": "Always make sure the engine is cool before checking fluid levels on test day!",
        "isFreePreview": true
      }
    ]
  }
]
```

### 3.3 Field Data Dictionary

| Field | Type | Required | Allowed Values / Format | Description |
|---|---|---|---|---|
| `id` | String | Yes | `mod-[timestamp]` or `mod-[N]` | Unique module identifier |
| `title` | String | Yes | Non-empty string | Title of the module (e.g. "Module 1: Show Me, Tell Me") |
| `description` | String | No | Text string | Summary description of module scope |
| `lessons` | Array | Yes | Array of Lesson Objects | Contained lessons under this module |
| `lesson.id` | String | Yes | `les-[timestamp]` or `les-[N]-[M]` | Unique lesson identifier |
| `lesson.title` | String | Yes | Non-empty string | Title of the lesson |
| `lesson.duration` | String | Yes | Format: "12 mins" or "4:30" | Estimated lesson completion time |
| `lesson.transmission` | String | Yes | `"Manual"`, `"Auto"`, or `"All"` | Transmission classification tag |
| `lesson.youtubeUrl` | String | Yes | Full URL or Video ID | User-entered YouTube link or ID |
| `lesson.videoId` | String | Yes | 11-char alphanumeric string | Parsed YouTube Video ID |
| `lesson.embedUrl` | String | Yes | `https://www.youtube.com/embed/[videoId]?rel=0` | Safe iframe embed src URL |
| `lesson.instructorTip` | String | No | Text string | Farhan & Binish's expert advice text |
| `lesson.description` | String | No | Text string | Detailed lesson overview |
| `lesson.isFreePreview` | Boolean | No | `true` / `false` (default `false`) | Free preview indicator |

---

## 4. CRUD Specification

### 4.1 LocalStorage Synchronization Functions

```javascript
// Load course data from localStorage or fallback to defaults
function loadCourseDataFromStorage() {
  try {
    const customDataStr = localStorage.getItem('l2d_custom_course_data');
    if (customDataStr) {
      const parsed = JSON.parse(customDataStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window.COURSE_DATA = parsed;
        return;
      }
    }
  } catch (e) {
    console.error('Error loading custom course data:', e);
  }
  window.COURSE_DATA = DEFAULT_COURSE_MODULES;
}

// Persist window.COURSE_DATA to localStorage
function saveCourseDataToStorage() {
  try {
    localStorage.setItem('l2d_custom_course_data', JSON.stringify(window.COURSE_DATA));
  } catch (e) {
    console.error('Error saving custom course data:', e);
  }
}
```

### 4.2 Module CRUD Specifications

1. **Add Module**:
   - Signature: `createModule(title, description)`
   - ID Generation: `const id = 'mod-' + Date.now();`
   - Logic: Create object `{ id, title, description, lessons: [] }`, push to `window.COURSE_DATA`, invoke `saveCourseDataToStorage()`, re-render sidebar, editor, header, and progress table.

2. **Rename / Edit Module**:
   - Signature: `updateModule(moduleId, title, description)`
   - Logic: Find module in `window.COURSE_DATA` where `m.id === moduleId`. Update `title` and `description`. Invoke `saveCourseDataToStorage()`, re-render UI.

3. **Delete Module**:
   - Signature: `deleteModule(moduleId)`
   - Logic:
     - Prompt user confirmation: `confirm('Delete module and all contained lessons?')`
     - Extract all lesson IDs within the module.
     - Remove module from `window.COURSE_DATA`.
     - Purge extracted lesson IDs from all student progress records in `courseState.studentProgress`.
     - If the currently active lesson was inside this deleted module, select the first lesson of the remaining modules (or clear active lesson theater if empty).
     - Invoke `saveCourseDataToStorage()` and `saveLMSStateToStorage()`, re-render UI.

### 4.3 Lesson CRUD Specifications

1. **Add Lesson**:
   - Signature: `createLesson(moduleId, lessonPayload)`
   - ID Generation: `const id = 'les-' + Date.now();`
   - Processing:
     - Run `parseYouTubeUrl(lessonPayload.youtubeUrl)`. Extract `videoId` and `embedUrl`.
     - Construct lesson object:
       ```javascript
       const newLesson = {
         id: 'les-' + Date.now(),
         title: lessonPayload.title,
         duration: lessonPayload.duration || '10 mins',
         transmission: lessonPayload.transmission || 'All',
         youtubeUrl: lessonPayload.youtubeUrl,
         videoId: parsed.videoId || 'dQw4w9WgXcQ',
         embedUrl: parsed.embedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
         instructorTip: lessonPayload.instructorTip || '',
         tips: lessonPayload.instructorTip || '',
         description: lessonPayload.description || '',
         isFreePreview: !!lessonPayload.isFreePreview
       };
       ```
     - Find parent module by `moduleId` and push `newLesson` to `module.lessons`.
     - Save to storage and re-render.

2. **Edit Lesson**:
   - Signature: `updateLesson(moduleId, lessonId, lessonPayload)`
   - Processing:
     - Locate module and target lesson.
     - Parse updated YouTube URL.
     - Update all properties (`title`, `duration`, `transmission`, `youtubeUrl`, `videoId`, `embedUrl`, `instructorTip`, `tips`, `description`, `isFreePreview`).
     - If `courseState.activeLessonId === lessonId`, immediately call `renderLessonTheater(updatedLesson)` to update active video theater view.
     - Save to storage and re-render sidebar and editor.

3. **Delete Lesson**:
   - Signature: `deleteLesson(moduleId, lessonId)`
   - Logic:
     - Prompt user confirmation: `confirm('Are you sure you want to delete this lesson?')`
     - Remove lesson from `module.lessons`.
     - Remove `lessonId` from all `completed` arrays in `courseState.studentProgress`.
     - If `courseState.activeLessonId === lessonId`, automatically switch active lesson to the first available lesson in `window.COURSE_DATA`.
     - Save to storage and re-render all panels.

4. **Reset Curriculum**:
   - Signature: `resetCourseDataToDefaults()`
   - Logic: Clears `l2d_custom_course_data` from localStorage, resets `window.COURSE_DATA = DEFAULT_COURSE_MODULES`, re-renders UI.

---

## 5. YouTube Embed URL Parser & Live Preview

### 5.1 Enhanced YouTube Parser Function

```javascript
/**
 * Parses any standard YouTube URL or Video ID into a clean 11-char ID and embed URL.
 * Handles:
 *  - Standard: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *  - Standard with extra params: https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s
 *  - Shortened: https://youtu.be/dQw4w9WgXcQ
 *  - Embed: https://www.youtube.com/embed/dQw4w9WgXcQ
 *  - Mobile: https://m.youtube.com/watch?v=dQw4w9WgXcQ
 *  - Direct 11-char ID: dQw4w9WgXcQ
 */
function parseYouTubeUrl(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') {
    return { isValid: false, videoId: null, embedUrl: null, error: 'Empty URL provided' };
  }

  const cleanInput = urlOrId.trim();

  // Direct 11-character Video ID check
  if (/^[\w-]{11}$/.test(cleanInput)) {
    return {
      isValid: true,
      videoId: cleanInput,
      embedUrl: `https://www.youtube.com/embed/${cleanInput}?rel=0`,
      error: null
    };
  }

  // Comprehensive YouTube URL RegEx pattern
  const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i;
  const match = cleanInput.match(regExp);

  if (match && match[1]) {
    const videoId = match[1];
    return {
      isValid: true,
      videoId: videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
      error: null
    };
  }

  return {
    isValid: false,
    videoId: null,
    embedUrl: null,
    error: 'Invalid YouTube URL or Video ID format'
  };
}
```

### 5.2 Live Video Preview Generator Logic

Inside the Lesson Editor Modal, as the user types or pastes into `#editorLessonYoutubeUrl`:

```javascript
window.handleLiveVideoPreview = function() {
  const urlInput = document.getElementById('editorLessonYoutubeUrl');
  const previewBox = document.getElementById('editorLessonVideoPreview');
  if (!urlInput || !previewBox) return;

  const res = parseYouTubeUrl(urlInput.value);
  if (res.isValid) {
    previewBox.innerHTML = `
      <div style="position:relative; width:100%; padding-top:56.25%; background:#000; border-radius:var(--radius-sm); overflow:hidden;">
        <iframe src="${res.embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen></iframe>
      </div>
      <div style="font-size:0.78rem; color:var(--color-green); margin-top:0.4rem; font-weight:700;">
        ✓ Valid YouTube Video ID: <code>${res.videoId}</code>
      </div>
    `;
  } else {
    previewBox.innerHTML = `
      <div style="padding:1.5rem; background:var(--bg-body); border:1px dashed var(--border-color); border-radius:var(--radius-sm); text-align:center; color:var(--text-light); font-size:0.85rem;">
        ⚠️ ${urlInput.value.trim() ? 'Invalid YouTube link. Please check formatting.' : 'Paste a YouTube video link above to generate live video preview.'}
      </div>
    `;
  }
};
```

---

## 6. Course Content Editor UI & Modal Design

### 6.1 Admin Panel Integration (`#adminContentEditorBox`)

When Admin Mode is active (`courseState.isAdmin === true`), `renderAdminContentEditor()` will include a new dedicated tab/section for Course Content Management:

```html
<!-- COURSE CURRICULUM CONTENT EDITOR SECTION -->
<div class="admin-editor-section">
  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
    <div>
      <h3 style="margin:0; font-size:1.25rem;">🎬 Driving Course Curriculum & Video Content Editor</h3>
      <p style="font-size:0.88rem; color:var(--text-light); margin:0.25rem 0 0;">
        Add custom driving modules, edit lesson titles, set transmission tags (Manual, Auto, All), and configure YouTube video URLs.
      </p>
    </div>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" onclick="resetCourseDataToDefaults()">Reset to Defaults 🔄</button>
      <button class="btn btn-primary btn-sm" onclick="openModuleModal()">+ Add New Module</button>
    </div>
  </div>

  <!-- Module Cards Accordion Container -->
  <div id="adminModuleEditorContainer">
    <!-- Dynamically rendered list of modules & lessons -->
  </div>
</div>
```

### 6.2 Module Accordion Card Layout (Rendered for each module)

Each module card in `#adminModuleEditorContainer` displays:
1. **Module Header**: Title, description, module lesson count badge.
2. **Module Action Buttons**:
   - `✏️ Edit Module` (`openModuleModal(moduleId)`)
   - `🗑️ Delete Module` (`deleteModule(moduleId)`)
   - `+ Add Lesson` (`openLessonModal(moduleId)`)
3. **Lesson List Table**:
   - Columns: Lesson Title, Duration, Transmission Tag (`Manual`/`Auto`/`All`), YouTube Video ID, Actions (`Edit`, `Delete`).

### 6.3 Modal Form Elements & Field IDs

#### 1. Add / Edit Module Modal (`#moduleModalBackdrop`)

```html
<div id="moduleModalBackdrop" class="student-portal-gate" style="display: none;">
  <div class="student-portal-card" style="max-width: 520px;">
    <div style="margin-bottom: 1.25rem; text-align: left;">
      <span class="badge badge-primary mb-1">Curriculum Management</span>
      <h2 id="moduleModalTitle" style="margin: 0;">Add New Driving Module</h2>
    </div>

    <div style="text-align: left; margin-bottom: 1.5rem;">
      <input type="hidden" id="editorModuleId" value="">
      
      <label for="editorModuleTitleInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Module Title *
      </label>
      <input type="text" id="editorModuleTitleInput" class="portal-input" placeholder="e.g. Module 5: Night Driving & Adverse Weather" required>

      <label for="editorModuleDescInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Module Description
      </label>
      <textarea id="editorModuleDescInput" class="portal-input" style="height: 80px; resize: vertical;" placeholder="Overview of learning outcomes..."></textarea>
    </div>

    <div style="display: flex; gap: 0.75rem;">
      <button class="btn btn-secondary w-full" onclick="closeModuleModal()">Cancel</button>
      <button class="btn btn-primary w-full" onclick="saveModuleModal()">Save Module 💾</button>
    </div>
  </div>
</div>
```

#### 2. Add / Edit Lesson Modal (`#lessonModalBackdrop`)

```html
<div id="lessonModalBackdrop" class="student-portal-gate" style="display: none;">
  <div class="student-portal-card" style="max-width: 640px;">
    <div style="margin-bottom: 1.25rem; text-align: left;">
      <span class="badge badge-primary mb-1">Lesson Content Management</span>
      <h2 id="lessonModalTitle" style="margin: 0;">Add New Lesson</h2>
    </div>

    <div style="text-align: left; margin-bottom: 1.5rem;">
      <input type="hidden" id="editorLessonModuleId" value="">
      <input type="hidden" id="editorLessonId" value="">

      <div class="editor-grid-2">
        <div>
          <label for="editorLessonTitleInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
            Lesson Title *
          </label>
          <input type="text" id="editorLessonTitleInput" class="portal-input" placeholder="e.g. 5.1 Driving in Heavy Rain & Fog" required>
        </div>
        <div>
          <label for="editorLessonDurationInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
            Duration *
          </label>
          <input type="text" id="editorLessonDurationInput" class="portal-input" placeholder="e.g. 12 mins or 8:45" required>
        </div>
      </div>

      <div class="editor-grid-2">
        <div>
          <label for="editorLessonTransmissionSelect" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
            Transmission Transmission Tag *
          </label>
          <select id="editorLessonTransmissionSelect" class="portal-input">
            <option value="All">All (Manual & Automatic)</option>
            <option value="Manual">Manual Only (Toyota Yaris)</option>
            <option value="Auto">Automatic Only (Kona EV)</option>
          </select>
        </div>
        <div>
          <label for="editorLessonYoutubeUrl" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
            YouTube URL or Video ID *
          </label>
          <input type="text" id="editorLessonYoutubeUrl" class="portal-input" placeholder="https://www.youtube.com/watch?v=..." oninput="handleLiveVideoPreview()" required>
        </div>
      </div>

      <!-- Live Video Preview Frame Box -->
      <div style="margin-bottom: 1rem;">
        <label style="font-weight: 700; font-size: 0.82rem; display: block; margin-bottom: 0.3rem;">Live Video Preview:</label>
        <div id="editorLessonVideoPreview"></div>
      </div>

      <label for="editorLessonTipInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Instructor Pro Tip (Farhan & Binish's Advice)
      </label>
      <textarea id="editorLessonTipInput" class="portal-input" style="height: 60px; resize: vertical;" placeholder="e.g. Use dipped headlights when visibility is under 100 meters!"></textarea>

      <label for="editorLessonDescInput" style="font-weight: 700; font-size: 0.88rem; display: block; margin-bottom: 0.4rem;">
        Lesson Description
      </label>
      <textarea id="editorLessonDescInput" class="portal-input" style="height: 60px; resize: vertical;" placeholder="Detailed breakdown of what the pupil will practice..."></textarea>
    </div>

    <div style="display: flex; gap: 0.75rem;">
      <button class="btn btn-secondary w-full" onclick="closeLessonModal()">Cancel</button>
      <button class="btn btn-primary w-full" onclick="saveLessonModal()">Save Lesson 💾</button>
    </div>
  </div>
</div>
```

---

## 7. CSS Selectors Specification (`styles/course.css`)

The following new CSS rules must be appended to `styles/course.css`:

```css
/* Module & Lesson Editor Accordions */
.module-editor-card {
  background: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  transition: var(--transition-fast);
}

.module-editor-card:hover {
  border-color: var(--color-green);
}

.module-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.module-editor-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Transmission Tag Badges */
.badge-transmission {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-transmission-manual {
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-transmission-auto {
  background: rgba(139, 92, 246, 0.15);
  color: #8B5CF6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-transmission-all {
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Editor Lesson List Table / Rows */
.lesson-editor-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.lesson-editor-table th,
.lesson-editor-table td {
  padding: 0.65rem 0.85rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.85rem;
}

.lesson-editor-table th {
  background: var(--bg-surface);
  font-weight: 700;
  color: var(--text-main);
}

/* Live Video Preview Box */
.video-preview-wrapper {
  background: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
}
```

---

## 8. Caveats

1. **Read-Only Scope**: This investigation report provides the complete architecture and UI specification. Source code modification of `course.html`, `js/course-data.js`, `js/course-player.js`, or `styles/course.css` will be executed by the Implementer agent.
2. **LocalStorage Availability**: Standard browser restrictions apply to `localStorage`. Fallback to `DEFAULT_COURSE_MODULES` handles quota errors or privacy mode restrictions gracefully.
3. **Student Progress Syncing**: When a lesson is deleted by an admin, its ID must be scrubbed from all student `completed` arrays in `courseState.studentProgress` to avoid orphan completion tallies.

---

## 9. Conclusion

The specification for `l2d_custom_course_data` is fully detailed and ready for implementation in Milestone 2. The solution provides full CRUD capabilities for course modules and individual lessons with transmission tagging, automatic YouTube URL parsing and live iframe previews, robust student progress synchronization, and seamless integration with Learner2Driver's Admin Dashboard.

---

## 10. Verification Method

To independently verify the design and subsequent implementation:

1. **Data Loading Verification**:
   - Inspect `window.COURSE_DATA` in DevTools console when `l2d_custom_course_data` is set in `localStorage`.
   - Clear `localStorage` and verify fallback to `DEFAULT_COURSE_MODULES`.
2. **Module & Lesson CRUD Verification**:
   - In Admin Mode (`admin` / `Huzaifa1`), create a new module (e.g. "Module 5: Highway Driving"). Verify entry in sidebar `#curriculumTree`.
   - Add a lesson under Module 5 with Transmission Tag `Auto`, duration `15 mins`, and YouTube URL `https://youtu.be/dQw4w9WgXcQ`. Verify live preview.
   - Edit lesson title and switch Transmission Tag to `Manual`. Verify immediate update in theater and sidebar.
   - Delete the lesson and verify student progress tallies update accordingly.
3. **YouTube Parser Test Cases**:
   - Input `https://www.youtube.com/watch?v=dQw4w9WgXcQ` -> Parsed ID: `dQw4w9WgXcQ`
   - Input `https://youtu.be/dQw4w9WgXcQ?t=12` -> Parsed ID: `dQw4w9WgXcQ`
   - Input `https://www.youtube.com/embed/dQw4w9WgXcQ` -> Parsed ID: `dQw4w9WgXcQ`
   - Input `dQw4w9WgXcQ` -> Parsed ID: `dQw4w9WgXcQ`
