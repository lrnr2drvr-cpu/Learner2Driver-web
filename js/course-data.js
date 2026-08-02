/**
 * ==========================================================================
 * LEARNER2DRIVER - VIDEO COURSE CURRICULUM DATA & CRUD PERSISTENCE (course-data.js)
 * Default Modules: Show Me Tell Me, Moving Off, Junctions, Maneuvers
 * Custom Course Data Persistence Key: l2d_custom_course_data
 * ==========================================================================
 */

const DEFAULT_COURSE_MODULES = [
  {
    id: "mod-1",
    title: "Module 1: Show Me, Tell Me Questions",
    description: "Master all DVSA vehicle safety questions asked at the start of your practical test.",
    lessons: [
      {
        id: "les-1-1",
        title: "1.1 Under the Bonnet Checks (Oil, Coolant, Brake Fluid)",
        duration: "4:30",
        transmission: "All",
        youtubeUrl: "https://www.youtube.com/watch?v=HIj0_TeeCj8",
        videoId: "HIj0_TeeCj8",
        embedUrl: "https://www.youtube-nocookie.com/embed/HIj0_TeeCj8?rel=0&enablejsapi=1",
        instructorTip: "Always make sure the engine is cool before checking fluid levels on test day!",
        tips: "Always make sure the engine is cool before checking fluid levels on test day!",
        description: "How to open the bonnet and identify the engine oil dipstick, coolant tank, and brake fluid reservoir safely.",
        isFreePreview: true
      },
      {
        id: "les-1-2",
        title: "1.2 Interior Controls & Demisters (Show Me)",
        duration: "5:15",
        transmission: "All",
        youtubeUrl: "https://www.youtube.com/watch?v=HIj0_TeeCj8",
        videoId: "HIj0_TeeCj8",
        embedUrl: "https://www.youtube-nocookie.com/embed/HIj0_TeeCj8?rel=0&enablejsapi=1",
        instructorTip: "Keep your eyes on the road when operating switches during the 'Show Me' question!",
        tips: "Keep your eyes on the road when operating switches during the 'Show Me' question!",
        description: "How to operate the front and rear windscreen demisters, headlights, and wipers while driving.",
        isFreePreview: false
      }
    ]
  },
  {
    id: "mod-2",
    title: "Module 2: Moving Off & Stopping (Clutch & EV Control)",
    description: "Learn smooth launches, stalling prevention, and safe curbside stopping in both manual and automatic cars.",
    lessons: [
      {
        id: "les-2-1",
        title: "2.1 The POM Routine (Prepare, Observe, Move)",
        duration: "6:20",
        transmission: "All",
        youtubeUrl: "https://www.youtube.com/watch?v=a91XF2g5sVE",
        videoId: "a91XF2g5sVE",
        embedUrl: "https://www.youtube-nocookie.com/embed/a91XF2g5sVE?rel=0&enablejsapi=1",
        instructorTip: "Never signal before checking your mirrors and blind spots!",
        tips: "Never signal before checking your mirrors and blind spots!",
        description: "The golden routine for moving away safely without faults. Checking your 6-point blind spots.",
        isFreePreview: true
      },
      {
        id: "les-2-2",
        title: "2.2 Clutch Control & Stalling Prevention (Yaris Manual)",
        duration: "8:45",
        transmission: "Manual",
        youtubeUrl: "https://www.youtube.com/watch?v=a91XF2g5sVE",
        videoId: "a91XF2g5sVE",
        embedUrl: "https://www.youtube-nocookie.com/embed/a91XF2g5sVE?rel=0&enablejsapi=1",
        instructorTip: "If you feel the car shudder slightly, hold your left foot steady for 2 seconds!",
        tips: "If you feel the car shudder slightly, hold your left foot steady for 2 seconds!",
        description: "Finding the clutch biting point smoothly in the 2019 Toyota Yaris without over-revving.",
        isFreePreview: false
      },
      {
        id: "les-2-3",
        title: "2.3 Hill Starts & Electric Hold (Kona EV vs Yaris)",
        duration: "7:10",
        transmission: "Auto",
        youtubeUrl: "https://www.youtube.com/watch?v=a91XF2g5sVE",
        videoId: "a91XF2g5sVE",
        embedUrl: "https://www.youtube-nocookie.com/embed/a91XF2g5sVE?rel=0&enablejsapi=1",
        instructorTip: "In the Kona EV, Auto-Hold keeps you parked effortlessly on any slope!",
        tips: "In the Kona EV, Auto-Hold keeps you parked effortlessly on any slope!",
        description: "Mastering steep inclines in Penwortham and Preston without rolling backwards.",
        isFreePreview: false
      }
    ]
  },
  {
    id: "mod-3",
    title: "Module 3: Junctions & Roundabouts",
    description: "Navigate Preston's busy roundabouts, spiral lanes, and T-junctions with total confidence.",
    lessons: [
      {
        id: "les-3-1",
        title: "3.1 Approaching Roundabouts & MSPSL Routine",
        duration: "9:15",
        transmission: "All",
        youtubeUrl: "https://www.youtube.com/watch?v=463p8u_z0fQ",
        videoId: "463p8u_z0fQ",
        embedUrl: "https://www.youtube-nocookie.com/embed/463p8u_z0fQ?rel=0&enablejsapi=1",
        instructorTip: "Always check to your right early as you approach the give-way line.",
        tips: "Always check to your right early as you approach the give-way line.",
        description: "Mirrors, Signal, Position, Speed, and Look: how to time your entry onto roundabouts.",
        isFreePreview: true
      },
      {
        id: "les-3-2",
        title: "3.2 Multi-Lane & Spiral Roundabouts in Preston",
        duration: "10:30",
        transmission: "All",
        youtubeUrl: "https://www.youtube.com/watch?v=463p8u_z0fQ",
        videoId: "463p8u_z0fQ",
        embedUrl: "https://www.youtube-nocookie.com/embed/463p8u_z0fQ?rel=0&enablejsapi=1",
        instructorTip: "Don't drift lanes! Check your left door mirror before steering off the roundabout.",
        tips: "Don't drift lanes! Check your left door mirror before steering off the roundabout.",
        description: "How to stay in your lane and exit cleanly on tricky dual-carriageway roundabouts.",
        isFreePreview: false
      }
    ]
  },
  {
    id: "mod-4",
    title: "Module 4: Test Maneuvers",
    description: "Step-by-step guides to nailing all 4 DVSA reversing maneuvers first time.",
    lessons: [
      {
        id: "les-4-1",
        title: "4.1 Parallel Parking Behind a Car",
        duration: "11:00",
        transmission: "Manual",
        youtubeUrl: "https://www.youtube.com/watch?v=J50LqY_x_z8",
        videoId: "J50LqY_x_z8",
        embedUrl: "https://www.youtube-nocookie.com/embed/J50LqY_x_z8?rel=0&enablejsapi=1",
        instructorTip: "1 full turn left when your rear wheels align with the target car's bumper!",
        tips: "1 full turn left when your rear wheels align with the target car's bumper!",
        description: "Reference points for parallel parking within 2 car lengths without touching the curb.",
        isFreePreview: false
      },
      {
        id: "les-4-2",
        title: "4.2 Reverse Bay Parking & Using EV Cameras",
        duration: "8:20",
        transmission: "Auto",
        youtubeUrl: "https://www.youtube.com/watch?v=J50LqY_x_z8",
        videoId: "J50LqY_x_z8",
        embedUrl: "https://www.youtube-nocookie.com/embed/J50LqY_x_z8?rel=0&enablejsapi=1",
        instructorTip: "Always check over both shoulders even when using parking cameras!",
        tips: "Always check over both shoulders even when using parking cameras!",
        description: "How to reverse cleanly between bay lines and use the Kona EV Ultimate camera system.",
        isFreePreview: false
      }
    ]
  }
];

/**
 * YouTube URL Parser
 * Returns { isValid: boolean, videoId: string|null, embedUrl: string|null }
 */
function parseYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, videoId: null, embedUrl: null };
  }
  const cleanUrl = url.trim();

  // Direct 11-character Video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return {
      isValid: true,
      videoId: cleanUrl,
      embedUrl: `https://www.youtube.com/embed/${cleanUrl}?rel=0`
    };
  }

  // Regex matching standard YouTube link formats
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i;
  const match = cleanUrl.match(regExp);

  if (match && match[1]) {
    const videoId = match[1];
    return {
      isValid: true,
      videoId: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&enablejsapi=1`
    };
  }

  return { isValid: false, videoId: null, embedUrl: null };
}

/**
 * Storage Operations
 */
function loadCourseDataFromStorage() {
  try {
    const stored = localStorage.getItem('l2d_custom_course_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        window.COURSE_DATA = parsed;
        return window.COURSE_DATA;
      }
    }
  } catch(e) {
    console.warn('Error reading custom course data from storage', e);
  }
  window.COURSE_DATA = JSON.parse(JSON.stringify(DEFAULT_COURSE_MODULES));
  saveCourseDataToStorage();
  return window.COURSE_DATA;
}

function saveCourseDataToStorage() {
  try {
    const payload = JSON.stringify(window.COURSE_DATA || []);
    localStorage.setItem('l2d_custom_course_data', payload);
    if (typeof window.syncSiteTextToSupabase === 'function') {
      window.syncSiteTextToSupabase('course_curriculum_json', payload);
    }
  } catch(e) {
    console.warn('Error saving custom course data to storage', e);
  }
}

function resetCourseDataToDefaults() {
  if (confirm('Are you sure you want to reset all course modules and lessons to default settings? All custom edits will be lost.')) {
    window.COURSE_DATA = JSON.parse(JSON.stringify(DEFAULT_COURSE_MODULES));
    saveCourseDataToStorage();
    if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
    if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
    if (typeof window.showToast === 'function') window.showToast('Reset course data to defaults!');
  }
}

/**
 * Module CRUD Functions
 */
function createModule(title, description) {
  if (!title || !title.trim()) return null;
  const newMod = {
    id: `mod-${Date.now()}`,
    title: title.trim(),
    description: (description || '').trim(),
    lessons: []
  };

  if (!Array.isArray(window.COURSE_DATA)) {
    window.COURSE_DATA = [];
  }
  window.COURSE_DATA.push(newMod);
  saveCourseDataToStorage();

  if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
  if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
  if (typeof window.showToast === 'function') window.showToast(`Module "${newMod.title}" created successfully! 🎉`);
  return newMod;
}

function updateModule(modId, title, description) {
  if (!modId) return false;
  const mod = (window.COURSE_DATA || []).find(m => m.id === modId);
  if (!mod) return false;

  if (title && title.trim()) mod.title = title.trim();
  if (description !== undefined) mod.description = description.trim();

  saveCourseDataToStorage();
  if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
  if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
  if (typeof window.showToast === 'function') window.showToast('Module updated! 💾');
  return true;
}

function deleteModule(modId) {
  if (!modId) return false;
  const modIndex = (window.COURSE_DATA || []).findIndex(m => m.id === modId);
  if (modIndex === -1) return false;
  const targetMod = window.COURSE_DATA[modIndex];

  if (!confirm(`Are you sure you want to delete module "${targetMod.title}" and all its lessons?`)) {
    return false;
  }

  // Purge lesson IDs from all student completion lists
  const lessonIdsToPurge = (targetMod.lessons || []).map(l => l.id);
  if (window.courseState && window.courseState.studentProgress) {
    Object.keys(window.courseState.studentProgress).forEach(sName => {
      const student = window.courseState.studentProgress[sName];
      if (student && Array.isArray(student.completed)) {
        student.completed = student.completed.filter(id => !lessonIdsToPurge.includes(id));
      }
    });
    if (typeof window.saveLMSStateToStorage === 'function') {
      window.saveLMSStateToStorage();
    }
  }

  window.COURSE_DATA.splice(modIndex, 1);
  saveCourseDataToStorage();

  if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
  if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
  if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
  if (typeof window.showToast === 'function') window.showToast(`Deleted module "${targetMod.title}".`);
  return true;
}

/**
 * Lesson CRUD Functions
 */
function createLesson(modId, payload) {
  if (!modId || !payload) return null;
  const mod = (window.COURSE_DATA || []).find(m => m.id === modId);
  if (!mod) return null;

  const ytResult = parseYouTubeUrl(payload.youtubeUrl || payload.videoId || '');
  const videoId = ytResult.videoId || 'dQw4w9WgXcQ';
  const embedUrl = ytResult.embedUrl || `https://www.youtube.com/embed/${videoId}?rel=0`;

  const newLesson = {
    id: `les-${Date.now()}`,
    title: (payload.title || 'New Lesson').trim(),
    duration: (payload.duration || '5:00').trim(),
    transmission: payload.transmission || 'All',
    youtubeUrl: payload.youtubeUrl || '',
    videoId: videoId,
    embedUrl: embedUrl,
    instructorTip: (payload.instructorTip || payload.tips || '').trim(),
    tips: (payload.instructorTip || payload.tips || '').trim(),
    description: (payload.description || '').trim(),
    isFreePreview: !!payload.isFreePreview
  };

  if (!Array.isArray(mod.lessons)) mod.lessons = [];
  mod.lessons.push(newLesson);
  saveCourseDataToStorage();

  if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
  if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
  if (typeof window.showToast === 'function') window.showToast(`Lesson "${newLesson.title}" created! 🎬`);
  return newLesson;
}

function updateLesson(modId, lesId, payload) {
  if (!modId || !lesId || !payload) return false;
  const mod = (window.COURSE_DATA || []).find(m => m.id === modId);
  if (!mod) return false;
  const lesson = (mod.lessons || []).find(l => l.id === lesId);
  if (!lesson) return false;

  if (payload.title !== undefined) lesson.title = payload.title.trim();
  if (payload.duration !== undefined) lesson.duration = payload.duration.trim();
  if (payload.transmission !== undefined) lesson.transmission = payload.transmission;
  if (payload.youtubeUrl !== undefined) {
    lesson.youtubeUrl = payload.youtubeUrl.trim();
    const yt = parseYouTubeUrl(lesson.youtubeUrl);
    if (yt.isValid) {
      lesson.videoId = yt.videoId;
      lesson.embedUrl = yt.embedUrl;
    }
  }
  if (payload.instructorTip !== undefined) {
    lesson.instructorTip = payload.instructorTip.trim();
    lesson.tips = payload.instructorTip.trim();
  }
  if (payload.description !== undefined) lesson.description = payload.description.trim();
  if (payload.isFreePreview !== undefined) lesson.isFreePreview = !!payload.isFreePreview;

  saveCourseDataToStorage();

  // If active lesson, re-render theater
  if (window.courseState && window.courseState.activeLessonId === lesId) {
    if (typeof window.selectLesson === 'function') {
      window.selectLesson(modId, lesId);
    }
  }

  if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
  if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
  if (typeof window.showToast === 'function') window.showToast('Lesson updated! 💾');
  return true;
}

function deleteLesson(modId, lesId) {
  if (!modId || !lesId) return false;
  const mod = (window.COURSE_DATA || []).find(m => m.id === modId);
  if (!mod || !Array.isArray(mod.lessons)) return false;
  const lesIndex = mod.lessons.findIndex(l => l.id === lesId);
  if (lesIndex === -1) return false;
  const targetLes = mod.lessons[lesIndex];

  if (!confirm(`Are you sure you want to delete lesson "${targetLes.title}"?`)) {
    return false;
  }

  // Scrub lesson ID from all student completion records
  if (window.courseState && window.courseState.studentProgress) {
    Object.keys(window.courseState.studentProgress).forEach(sName => {
      const student = window.courseState.studentProgress[sName];
      if (student && Array.isArray(student.completed)) {
        student.completed = student.completed.filter(id => id !== lesId);
      }
    });
    if (typeof window.saveLMSStateToStorage === 'function') {
      window.saveLMSStateToStorage();
    }
  }

  mod.lessons.splice(lesIndex, 1);
  saveCourseDataToStorage();

  // If active lesson was deleted, select first available lesson
  if (window.courseState && window.courseState.activeLessonId === lesId) {
    const firstMod = (window.COURSE_DATA || [])[0];
    const firstLess = firstMod?.lessons?.[0];
    if (firstLess && typeof window.selectLesson === 'function') {
      window.selectLesson(firstMod.id, firstLess.id);
    } else if (window.courseState) {
      window.courseState.activeLessonId = null;
    }
  }

  if (typeof window.renderCurriculumSidebar === 'function') window.renderCurriculumSidebar();
  if (typeof window.renderAdminContentEditor === 'function') window.renderAdminContentEditor();
  if (typeof window.renderAdminProgressTable === 'function') window.renderAdminProgressTable();
  if (typeof window.showToast === 'function') window.showToast(`Deleted lesson "${targetLes.title}".`);
  return true;
}

// Global exports & initialization
window.DEFAULT_COURSE_MODULES = DEFAULT_COURSE_MODULES;
window.parseYouTubeUrl = parseYouTubeUrl;
window.loadCourseDataFromStorage = loadCourseDataFromStorage;
window.saveCourseDataToStorage = saveCourseDataToStorage;
window.resetCourseDataToDefaults = resetCourseDataToDefaults;
window.createModule = createModule;
window.updateModule = updateModule;
window.deleteModule = deleteModule;
window.createLesson = createLesson;
window.updateLesson = updateLesson;
window.deleteLesson = deleteLesson;

// Initial load
loadCourseDataFromStorage();
