// The instructor's desk on the course page: students, lessons and settings, one tab each.
// Loaded only for a signed-in instructor; the database checks the token on every request.
import { authed, signOut } from './auth.js';

const $ = (id) => document.getElementById(id);
let modules = [];
let students = [];
let progress = [];
let started = false;

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function say(text, problem = false) {
  const status = $('desk-status');
  status.textContent = text;
  status.classList.toggle('is-problem', problem);
}

async function read(path) {
  const res = await authed(`/rest/v1/${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(res.status === 404 ? 'The course tables are not set up yet.' : `The server answered ${res.status}.`);
  return res.json();
}

async function send(path, body, prefer) {
  const res = await authed(`/rest/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.message || `The server answered ${res.status}.`);
  }
}

// ---------- tabs ----------

function showTab(name) {
  ['students', 'lessons', 'settings'].forEach((tab) => {
    const on = tab === name;
    const button = $(`tab-${tab}`);
    button.setAttribute('aria-selected', String(on));
    button.tabIndex = on ? 0 : -1;
    $(`panel-${tab}`).hidden = !on;
  });
  try { sessionStorage.setItem('l2d_desk_tab', name); } catch { /* not remembered */ }
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showTab(tab.id.replace('tab-', '')));
    // Arrow keys move between tabs, as tabs do everywhere else.
    tab.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      const next = tabs[(index + step + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });
  let remembered = null;
  try { remembered = sessionStorage.getItem('l2d_desk_tab'); } catch { /* start on students */ }
  showTab(['students', 'lessons', 'settings'].includes(remembered) ? remembered : 'students');
}

// ---------- students ----------

function lessonsFor(transmission) {
  return modules.flatMap((module) => module.lessons || []).filter((lesson) => {
    const who = String(lesson.transmission || 'All').toLowerCase();
    return who === 'all' || (transmission === 'Automatic' ? who.startsWith('auto') : who === 'manual');
  });
}

// Puts the form into "add" or "change" mode.
function studentForm(student) {
  const form = $('student-add');
  form.reset();
  $('student-add-head').textContent = student ? `Change ${student.username}` : 'Add a student';
  $('student-save').textContent = student ? 'Save changes' : 'Add student';
  $('student-cancel').hidden = !student;
  $('student-add-note').textContent = student
    ? 'Leave the password empty to keep the one they have. A new password signs them out everywhere.'
    : 'Give the username and password to the student.';
  form.elements.username.readOnly = Boolean(student);
  form.elements.password.required = !student;
  if (student) {
    form.elements.username.value = student.username;
    form.elements.instructor.value = student.instructor || 'Male instructor';
    form.elements.transmission.value = student.transmission;
    form.elements.password.focus();
  }
}

function drawStudents() {
  const box = $('student-rows');
  if (!students.length) {
    box.replaceChildren(el('p', { className: 'desk__empty', textContent: 'No students yet. Add the first one with the form.' }));
    return;
  }
  const head = el('tr', {}, ...['Student', 'Instructor', 'Car', 'Progress', ''].map((name) => el('th', { scope: 'col', textContent: name })));
  const rows = students.map((student) => {
    const mine = lessonsFor(student.transmission);
    const done = progress.filter((row) => row.student_id === student.id && mine.some((lesson) => lesson.id === row.lesson_id)).length;

    const bar = el('span', { className: 'meter' }, el('span', {}));
    bar.firstChild.style.transform = `scaleX(${mine.length ? done / mine.length : 0})`;
    bar.setAttribute('aria-hidden', 'true');

    const change = el('button', { type: 'button', className: 'btn btn--small btn--quiet', textContent: 'Change' });
    change.addEventListener('click', () => studentForm(student));
    const remove = el('button', { type: 'button', className: 'btn btn--small btn--quiet btn--danger', textContent: 'Remove' });
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Remove ${student.username} and their progress?`)) return;
      try {
        await send('rpc/admin_delete_student', { p_id: student.id });
        say(`${student.username} was removed.`);
        studentForm(null);
        await loadStudents();
      } catch (error) { say(`${student.username} was not removed. ${error.message}`, true); }
    });

    return el('tr', { className: 'student-row' },
      el('th', { scope: 'row', textContent: student.username }),
      el('td', { textContent: student.instructor || 'Not set' }),
      el('td', { textContent: student.transmission }),
      el('td', { className: 'student-row__progress' }, bar, el('span', { className: 'num', textContent: `${done} of ${mine.length}` })),
      el('td', { className: 'student-row__actions' }, change, remove));
  });
  box.replaceChildren(el('table', { className: 'table' }, el('thead', {}, head), el('tbody', {}, ...rows)));
}

async function loadStudents() {
  [students, progress] = await Promise.all([
    read('students?select=id,username,instructor,transmission&order=username'),
    read('lesson_progress?select=student_id,lesson_id'),
  ]);
  drawStudents();
}

async function saveStudent(form) {
  const name = form.elements.username.value.trim();
  try {
    await send('rpc/admin_save_student', {
      p_username: name,
      p_password: form.elements.password.value,
      p_instructor: form.elements.instructor.value,
      p_transmission: form.elements.transmission.value,
    });
    studentForm(null);
    say(`${name} was saved.`);
    await loadStudents();
  } catch (error) { say(`${name} was not saved. ${error.message}`, true); }
}

// ---------- lessons ----------

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

function dirty(on = true) {
  $('course-dirty').hidden = !on;
}

function youtubeId(text) {
  const match = String(text || '').trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  if (match) return match[1];
  return /^[\w-]{11}$/.test(String(text || '').trim()) ? String(text).trim() : '';
}

function field(label, control, className = '') {
  return el('label', { className: `dialog__field ${className}`.trim() }, el('span', { textContent: label }), control);
}

function drawLesson(module, lesson) {
  const title = el('input', { className: 'input', type: 'text', value: lesson.title || '', maxLength: 120 });
  title.addEventListener('input', () => { lesson.title = title.value; });

  const video = el('input', { className: 'input', type: 'text', value: lesson.youtubeUrl || (lesson.videoId ? `https://youtu.be/${lesson.videoId}` : ''), placeholder: 'https://youtu.be/...' });
  video.addEventListener('input', () => {
    lesson.youtubeUrl = video.value.trim();
    lesson.videoId = youtubeId(video.value);
    video.setCustomValidity(video.value.trim() && !lesson.videoId ? 'That does not look like a YouTube link.' : '');
  });

  const who = el('select', { className: 'input' },
    el('option', { value: 'All', textContent: 'Everyone' }),
    el('option', { value: 'Manual', textContent: 'Manual only' }),
    el('option', { value: 'Auto', textContent: 'Automatic only' }));
  who.value = String(lesson.transmission || 'All').toLowerCase().startsWith('auto') ? 'Auto' : (lesson.transmission === 'Manual' ? 'Manual' : 'All');
  who.addEventListener('change', () => { lesson.transmission = who.value; });

  const tip = el('input', { className: 'input', type: 'text', value: lesson.tip || lesson.instructorTip || lesson.tips || '', maxLength: 240, placeholder: 'Optional' });
  tip.addEventListener('input', () => { lesson.tip = tip.value; });

  const remove = el('button', { type: 'button', className: 'btn btn--small btn--quiet btn--danger lesson-edit__remove', textContent: 'Remove' });
  remove.setAttribute('aria-label', `Remove the lesson ${lesson.title || ''}`.trim());
  remove.addEventListener('click', () => {
    module.lessons = module.lessons.filter((other) => other !== lesson);
    dirty();
    drawModules();
  });

  return el('div', { className: 'lesson-edit' },
    field('Lesson', title, 'lesson-edit__title'),
    field('YouTube link', video, 'lesson-edit__video'),
    field('For', who, 'lesson-edit__for'),
    remove,
    field('Tip shown under the video', tip, 'lesson-edit__tip'));
}

function drawModules() {
  const box = $('module-rows');
  if (!modules.length) {
    box.replaceChildren(el('p', { className: 'desk__empty', textContent: 'No modules yet. Add one to start building the course.' }));
    return;
  }
  box.replaceChildren(...modules.map((module, index) => {
    const title = el('input', { className: 'input', type: 'text', value: module.title || '', maxLength: 120 });
    title.addEventListener('input', () => { module.title = title.value; });

    const add = el('button', { type: 'button', className: 'btn btn--small btn--quiet', textContent: 'Add a lesson' });
    add.addEventListener('click', () => {
      module.lessons.push({ id: newId('les'), title: '', transmission: 'All', videoId: '', youtubeUrl: '', tip: '' });
      dirty();
      drawModules();
    });
    const remove = el('button', { type: 'button', className: 'btn btn--small btn--quiet btn--danger', textContent: 'Remove module' });
    remove.addEventListener('click', () => {
      if (module.lessons.length && !window.confirm(`Remove "${module.title || 'this module'}" and its lessons?`)) return;
      modules = modules.filter((other) => other !== module);
      dirty();
      drawModules();
    });

    return el('section', { className: 'module-edit panel' },
      el('div', { className: 'module-edit__head' }, field(`Module ${index + 1}`, title, 'module-edit__title'), remove),
      ...module.lessons.map((lesson) => drawLesson(module, lesson)),
      el('div', { className: 'module-edit__foot' }, add));
  }));
}

async function loadCourse() {
  const rows = await read('course_content?select=modules&id=eq.1');
  const saved = rows[0] && Array.isArray(rows[0].modules) ? rows[0].modules : [];
  modules = saved.map((module) => ({ ...module, id: module.id || newId('mod'), lessons: Array.isArray(module.lessons) ? module.lessons.map((lesson) => ({ ...lesson, id: lesson.id || newId('les') })) : [] }));
  drawModules();
  dirty(false);
}

async function saveCourse() {
  const bad = $('module-rows').querySelector(':invalid');
  if (bad) { bad.reportValidity(); return; }
  const untitled = modules.some((module) => !String(module.title || '').trim() || module.lessons.some((lesson) => !String(lesson.title || '').trim()));
  if (untitled) { say('Give every module and lesson a name before saving.', true); return; }
  try {
    await send('course_content?on_conflict=id', [{ id: 1, modules, updated_at: new Date().toISOString() }], 'resolution=merge-duplicates,return=minimal');
    dirty(false);
    say('Lessons saved.');
    drawStudents();
  } catch (error) { say(`The lessons were not saved. ${error.message}`, true); }
}

// ---------- settings ----------

const SETTINGS = ['google_reviews_config', 'v2_instagram_feed', 'hubspot_portal_id'];
let loadedSettings = null; // what the form held when it was filled in, so only real changes are saved

function settingsNow(form) {
  return {
    google_reviews_config: JSON.stringify({ apiKey: form.elements.googleKey.value.trim(), placeId: form.elements.googlePlace.value.trim() }),
    v2_instagram_feed: form.elements.instagram.value.trim(),
    hubspot_portal_id: form.elements.hubspot.value.trim(),
  };
}

async function loadSettings() {
  const rows = await read(`site_settings?select=key,value&key=in.(${SETTINGS.join(',')})`);
  const saved = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  let google = {};
  try { google = JSON.parse(saved.google_reviews_config) || {}; } catch { /* nothing saved yet */ }
  const form = $('settings-form');
  form.elements.googleKey.value = google.apiKey || '';
  form.elements.googlePlace.value = google.placeId || '';
  form.elements.instagram.value = saved.v2_instagram_feed || '';
  form.elements.hubspot.value = saved.hubspot_portal_id || '';
  loadedSettings = settingsNow(form);
}

async function saveSettings(form) {
  // Never save a form that was not filled from the database first: that could wipe a setting.
  if (!loadedSettings) { say('The settings could not be loaded, so nothing was saved. Reload the page and try again.', true); return; }
  const now = new Date().toISOString();
  const current = settingsNow(form);
  const rows = SETTINGS.filter((key) => current[key] !== loadedSettings[key]).map((key) => ({ key, value: current[key], updated_at: now }));
  if (!rows.length) { say('Nothing has changed.'); return; }
  try {
    await send('site_settings?on_conflict=key', rows, 'resolution=merge-duplicates,return=minimal');
    loadedSettings = current;
    say('Settings saved. They take effect the next time the homepage is opened.');
  } catch (error) { say(`The settings were not saved. ${error.message}`, true); }
}

async function changePassword(form) {
  if (form.elements.password.value !== form.elements.again.value) { say('The two passwords do not match.', true); return; }
  try {
    const res = await authed('/auth/v1/user', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: form.elements.password.value }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.msg || detail.message || `The server answered ${res.status}.`);
    }
    form.reset();
    say('Your password was changed.');
  } catch (error) { say(`Your password was not changed. ${error.message}`, true); }
}

// ---------- start ----------

export async function startDesk(email) {
  if (started) return;
  started = true;
  $('gate').hidden = true;
  $('course').hidden = true;
  $('desk').hidden = false;
  say(`Signed in as ${email || 'an instructor'}.`);
  initTabs();

  $('desk-out').addEventListener('click', async () => {
    if (!$('course-dirty').hidden && !window.confirm('Your lesson changes are not saved. Sign out anyway?')) return;
    await signOut();
    window.location.reload();
  });
  window.addEventListener('beforeunload', (event) => { if (!$('course-dirty').hidden) event.preventDefault(); });

  $('course-save').addEventListener('click', saveCourse);
  $('module-add').addEventListener('click', () => {
    modules.push({ id: newId('mod'), title: '', lessons: [] });
    dirty();
    drawModules();
  });
  $('module-rows').addEventListener('input', () => dirty());
  $('module-rows').addEventListener('change', () => dirty());

  $('student-add').addEventListener('submit', (event) => { event.preventDefault(); saveStudent(event.currentTarget); });
  $('student-cancel').addEventListener('click', () => studentForm(null));
  $('settings-form').addEventListener('submit', (event) => { event.preventDefault(); saveSettings(event.currentTarget); });
  $('password-form').addEventListener('submit', (event) => { event.preventDefault(); changePassword(event.currentTarget); });

  try {
    await loadCourse();
    await loadStudents();
    await loadSettings();
  } catch (error) {
    say(error.message, true);
  }
}
