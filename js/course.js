// The video course. A student signs in with the username and password their instructor
// set; the database hands back a session token, and every later request carries it.
// Nothing about the course or other students is readable without a valid token.
import { config, store } from './config.js';
import { signIn, hasSession, getSession } from './auth.js';

const KEY = 'l2d_v2_student';
const $ = (id) => document.getElementById(id);

let token = null;
let lessons = [];   // the lessons this student sees, in order
let completed = new Set();
let current = null;

// Calls one of the student functions in the database.
async function call(name, args) {
  const res = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: config.supabaseKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (res.status === 404) throw new Error('setup');
  if (!res.ok) throw new Error('failed');
  return res.json();
}

function videoId(lesson) {
  if (/^[\w-]{11}$/.test(lesson.videoId || '')) return lesson.videoId;
  const match = String(lesson.youtubeUrl || lesson.embedUrl || '').match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}

// A lesson is for this student when it is for everyone or for their kind of car.
function forStudent(lesson, transmission) {
  const who = String(lesson.transmission || 'All').toLowerCase();
  if (who === 'all') return true;
  return transmission === 'Automatic' ? who.startsWith('auto') : who === 'manual';
}

function showProgress() {
  const total = lessons.length;
  const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
  $('course-progress').textContent = total
    ? `${done} of ${total} lessons done.`
    : 'Your instructor has not added any lessons yet.';
  $('course-bar').style.transform = `scaleX(${total ? done / total : 0})`;
  document.querySelectorAll('.lesson').forEach((button) => {
    button.classList.toggle('is-done', completed.has(button.dataset.id));
  });
}

function play(lesson) {
  current = lesson;
  document.querySelectorAll('.lesson').forEach((button) => {
    if (button.dataset.id === lesson.id) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });

  const id = videoId(lesson);
  const player = $('player');
  player.replaceChildren();
  if (id) {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    frame.title = lesson.title;
    frame.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.append(frame);
  } else {
    const note = document.createElement('p');
    note.textContent = 'This lesson has no video yet.';
    player.append(note);
  }

  $('lesson-title').textContent = lesson.title;
  $('lesson-tip').textContent = lesson.tip || lesson.instructorTip || lesson.tips || '';
  const done = completed.has(lesson.id);
  $('lesson-done').textContent = done ? 'Done' : 'Mark as done';
  $('lesson-done').setAttribute('aria-pressed', String(done));
  $('lesson-next').hidden = lessons.indexOf(lesson) === lessons.length - 1;
}

function draw(data) {
  const { student } = data;
  $('course-who').textContent = `Hello, ${student.username}.`;
  completed = new Set(data.completed || []);
  lessons = [];

  const list = $('lesson-list');
  list.replaceChildren();
  (Array.isArray(data.modules) ? data.modules : []).forEach((module) => {
    const mine = (module.lessons || []).filter((lesson) => lesson && lesson.id && forStudent(lesson, student.transmission));
    if (!mine.length) return;
    const title = document.createElement('h2');
    title.className = 'course__module';
    title.textContent = module.title || 'Module';
    list.append(title);
    mine.forEach((lesson) => {
      lessons.push(lesson);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson';
      button.dataset.id = lesson.id;
      const mark = document.createElement('span');
      mark.className = 'lesson__mark';
      mark.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'lesson__title';
      name.textContent = lesson.title || 'Lesson';
      button.append(mark, name);
      button.addEventListener('click', () => play(lesson));
      list.append(button);
    });
  });

  $('gate').hidden = true;
  $('desk').hidden = true;
  $('course').hidden = false;
  showProgress();
  const first = lessons.find((lesson) => !completed.has(lesson.id)) || lessons[0];
  if (first) play(first);
  else $('player').replaceChildren();
}

async function open(saved) {
  token = saved;
  const data = await call('student_course', { p_token: token });
  if (!data) { token = null; try { localStorage.removeItem(KEY); } catch { /* ignore */ } return false; }
  draw(data);
  return true;
}

function initStudent() {
  const form = $('student-form');
  const error = $('student-error');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    error.textContent = '';
    try {
      const result = await call('student_sign_in', { p_username: form.elements.username.value, p_password: form.elements.password.value });
      if (!result) {
        error.textContent = 'That username and password do not match.';
      } else {
        store.set(KEY, result.token);
        form.reset();
        await open(result.token);
      }
    } catch (problem) {
      error.textContent = problem.message === 'setup'
        ? 'The course is still being set up. Please try again soon.'
        : 'Could not sign in. Check your connection and try again.';
    }
    button.disabled = false;
  });

  $('student-out').addEventListener('click', async () => {
    const leaving = token;
    token = null;
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    $('course').hidden = true;
    $('gate').hidden = false;
    $('player').replaceChildren();
    if (leaving) call('student_sign_out', { p_token: leaving }).catch(() => {});
  });

  $('lesson-done').addEventListener('click', async () => {
    if (!current || !token) return;
    const done = !completed.has(current.id);
    const lesson = current;
    // Show the change at once; put it back if the save fails.
    if (done) completed.add(lesson.id); else completed.delete(lesson.id);
    play(lesson);
    showProgress();
    const ok = await call('student_set_lesson', { p_token: token, p_lesson: lesson.id, p_done: done }).catch(() => false);
    if (!ok) {
      if (done) completed.delete(lesson.id); else completed.add(lesson.id);
      play(lesson);
      showProgress();
      $('course-progress').textContent = 'That was not saved. Check your connection and try again.';
    }
  });

  $('lesson-next').addEventListener('click', () => {
    const next = lessons[lessons.indexOf(current) + 1];
    if (next) play(next);
  });
}

// The instructor's desk loads only for a signed-in instructor.
async function openDesk() {
  const session = await getSession();
  if (!session) return false;
  const { startDesk } = await import('./desk.js');
  startDesk(session.email);
  return true;
}

function initInstructor() {
  const dialog = $('signin');
  const form = $('signin-form');
  const error = $('si-error');

  $('open-signin').addEventListener('click', async () => {
    if (hasSession() && await openDesk()) return;
    error.textContent = '';
    dialog.showModal();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    error.textContent = '';
    const result = await signIn(form.elements.email.value.trim(), form.elements.password.value);
    button.disabled = false;
    if (!result.ok) { error.textContent = result.error; return; }
    form.reset();
    dialog.close();
    openDesk();
  });
}

initStudent();
initInstructor();

const saved = store.get(KEY);
if (saved) {
  open(saved).catch(() => { /* offline or not set up: the sign-in form stays */ });
}
