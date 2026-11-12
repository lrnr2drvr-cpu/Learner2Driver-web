// The instructor's desk on the course page: student accounts and the lessons.
// Loaded only for a signed-in instructor; the database checks the token on every request.
import { authed, signOut } from './auth.js';

const $ = (id) => document.getElementById(id);
let modules = [];
let students = [];
let progress = [];

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

// ---------- students ----------

function lessonsFor(transmission) {
  return modules.flatMap((module) => module.lessons || []).filter((lesson) => {
    const who = String(lesson.transmission || 'All').toLowerCase();
    return who === 'all' || (transmission === 'Automatic' ? who.startsWith('auto') : who === 'manual');
  });
}

function drawStudents() {
  const rows = $('student-rows');
  if (!students.length) {
    rows.replaceChildren(el('p', { className: 'gate__note', textContent: 'No students yet. Add the first one below.' }));
    return;
  }
  rows.replaceChildren(...students.map((student) => {
    const mine = lessonsFor(student.transmission);
    const done = progress.filter((row) => row.student_id === student.id && mine.some((lesson) => lesson.id === row.lesson_id)).length;
    const edit = el('button', { type: 'button', className: 'link', textContent: 'Change' });
    edit.addEventListener('click', () => {
      const form = $('student-add');
      form.elements.username.value = student.username;
      form.elements.password.value = '';
      form.elements.instructor.value = student.instructor || 'Male instructor';
      form.elements.transmission.value = student.transmission;
      form.elements.password.focus();
    });
    const remove = el('button', { type: 'button', className: 'link', textContent: 'Remove' });
    remove.addEventListener('click', async () => {
      if (!window.confirm(`Remove ${student.username} and their progress?`)) return;
      try {
        await send('rpc/admin_delete_student', { p_id: student.id });
        say(`${student.username} was removed.`);
        await loadStudents();
      } catch (error) { say(`${student.username} was not removed. ${error.message}`, true); }
    });
    return el('div', { className: 'student-row' },
      el('strong', { textContent: student.username }),
      el('span', { textContent: `${student.instructor || 'No instructor set'}, ${student.transmission.toLowerCase()}` }),
      el('span', { className: 'num', textContent: `${done} of ${mine.length} lessons` }),
      el('span', { className: 'student-row__actions' }, edit, remove));
  }));
}

async function loadStudents() {
  [students, progress] = await Promise.all([
    read('students?select=id,username,instructor,transmission&order=username'),
    read('lesson_progress?select=student_id,lesson_id'),
  ]);
  drawStudents();
}

// ---------- lessons ----------

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

function youtubeId(text) {
  const match = String(text || '').trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  if (match) return match[1];
  return /^[\w-]{11}$/.test(String(text || '').trim()) ? String(text).trim() : '';
}

function field(label, control) {
  return el('label', { className: 'dialog__field' }, el('span', { textContent: label }), control);
}

function drawLesson(module, lesson) {
  const title = el('input', { className: 'input', type: 'text', value: lesson.title || '', maxLength: 120 });
  title.addEventListener('input', () => { lesson.title = title.value; });

  const video = el('input', { className: 'input', type: 'text', value: lesson.youtubeUrl || (lesson.videoId ? `https://youtu.be/${lesson.videoId}` : ''), placeholder: 'YouTube link' });
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

  const tip = el('input', { className: 'input', type: 'text', value: lesson.tip || lesson.instructorTip || lesson.tips || '', maxLength: 240 });
  tip.addEventListener('input', () => { lesson.tip = tip.value; });

  const remove = el('button', { type: 'button', className: 'link', textContent: 'Remove lesson' });
  remove.addEventListener('click', () => {
    module.lessons = module.lessons.filter((other) => other !== lesson);
    drawModules();
  });

  return el('div', { className: 'lesson-edit' }, field('Lesson', title), field('Video', video), field('For', who), field('Tip', tip), remove);
}

function drawModules() {
  $('module-rows').replaceChildren(...modules.map((module) => {
    const title = el('input', { className: 'input', type: 'text', value: module.title || '', maxLength: 120 });
    title.addEventListener('input', () => { module.title = title.value; });

    const add = el('button', { type: 'button', className: 'link', textContent: 'Add a lesson' });
    add.addEventListener('click', () => {
      module.lessons.push({ id: newId('les'), title: '', transmission: 'All', videoId: '', youtubeUrl: '', tip: '' });
      drawModules();
    });
    const remove = el('button', { type: 'button', className: 'link', textContent: 'Remove module' });
    remove.addEventListener('click', () => {
      if (module.lessons.length && !window.confirm(`Remove "${module.title || 'this module'}" and its lessons?`)) return;
      modules = modules.filter((other) => other !== module);
      drawModules();
    });

    return el('div', { className: 'module-edit' },
      field('Module', title),
      ...module.lessons.map((lesson) => drawLesson(module, lesson)),
      el('div', { className: 'actions' }, add, remove));
  }));
}

async function loadCourse() {
  const rows = await read('course_content?select=modules&id=eq.1');
  const saved = rows[0] && Array.isArray(rows[0].modules) ? rows[0].modules : [];
  modules = saved.map((module) => ({ ...module, id: module.id || newId('mod'), lessons: Array.isArray(module.lessons) ? module.lessons.map((lesson) => ({ ...lesson, id: lesson.id || newId('les') })) : [] }));
  drawModules();
}

async function saveCourse() {
  const bad = $('module-rows').querySelector(':invalid');
  if (bad) { bad.reportValidity(); return; }
  const untitled = modules.some((module) => !String(module.title || '').trim() || module.lessons.some((lesson) => !String(lesson.title || '').trim()));
  if (untitled) { say('Give every module and lesson a name before saving.', true); return; }
  try {
    await send('course_content?on_conflict=id', [{ id: 1, modules, updated_at: new Date().toISOString() }], 'resolution=merge-duplicates,return=minimal');
    say('Lessons saved.');
    drawStudents();
  } catch (error) { say(`The lessons were not saved. ${error.message}`, true); }
}

// ---------- start ----------

export async function startDesk(email) {
  $('gate').hidden = true;
  $('course').hidden = true;
  $('desk').hidden = false;
  say(`Signed in as ${email || 'an instructor'}.`);

  $('desk-out').addEventListener('click', async () => { await signOut(); window.location.reload(); });
  $('course-save').addEventListener('click', saveCourse);
  $('module-add').addEventListener('click', () => {
    modules.push({ id: newId('mod'), title: '', lessons: [] });
    drawModules();
  });

  const form = $('student-add');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = form.elements.username.value.trim();
    try {
      await send('rpc/admin_save_student', {
        p_username: name,
        p_password: form.elements.password.value,
        p_instructor: form.elements.instructor.value,
        p_transmission: form.elements.transmission.value,
      });
      form.reset();
      say(`${name} was saved.`);
      await loadStudents();
    } catch (error) { say(`${name} was not saved. ${error.message}`, true); }
  });

  try {
    await loadCourse();
    await loadStudents();
  } catch (error) {
    say(error.message, true);
  }
}
