// Booking: a few choices become one pre-written WhatsApp message.
import { whatsappNumber } from './content.js';

const WORDS = {
  instructor: { male: 'the male instructor', female: 'the female instructor' },
  car: { manual: 'the manual Yaris', automatic: 'the automatic Kona EV' },
  time: { any: '', morning: 'morning', afternoon: 'afternoon', evening: 'evening' },
};

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The message sent to the instructor. Optional details are left out when not given.
export function buildMessage(choice) {
  const ask = choice.block
    ? `the ten-hour block (£${choice.price})`
    : `a one-hour lesson (£${choice.price})`;
  const lines = [`Hi, I would like to book ${ask} with ${WORDS.instructor[choice.instructor]}, in ${WORDS.car[choice.car]}.`];
  if (choice.day || choice.time) lines.push(`When: ${[choice.day || 'any day', choice.time || 'any time'].join(', ')}.`);
  if (choice.name) lines.push(`Name: ${choice.name}`);
  if (choice.area) lines.push(`Pickup postcode: ${choice.area}`);
  return lines.join('\n');
}

function picked(name) {
  const input = document.querySelector(`#book input[name="${name}"]:checked`);
  return input ? input.value : null;
}

// A price element's true value, even while its figure is mid-count.
function priceOf(el) {
  return el ? (el.dataset.real ?? el.textContent).trim() : '';
}

function longDay(value) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Rolls a price figure from one number to another, then restores its true text.
function count(el, from) {
  const real = priceOf(el);
  const to = Number(real);
  if (still() || !Number.isFinite(to) || !Number.isFinite(from) || from === to) { el.textContent = real; return; }
  el.dataset.real = real;
  const start = performance.now();
  const length = 520;
  (function step(now) {
    const t = Math.min((now - start) / length, 1);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (t < 1) { requestAnimationFrame(step); return; }
    el.textContent = real;
    delete el.dataset.real;
  }(start));
}

let wasBlock = false;

function update() {
  const hour = document.querySelector('.price--1 [data-key="price_hour"]');
  const blockPrice = document.querySelector('.price--10 [data-key="price_block"]');
  const was = document.querySelector('[data-key="price_block_was"]');
  const block = picked('hours') === '10';
  const shown = block ? blockPrice : hour;

  const saving = Number(priceOf(was)) - Number(priceOf(blockPrice));
  const save = document.getElementById('price-save');
  if (save) {
    save.textContent = String(saving);
    save.closest('.price__save').hidden = !(saving > 0);
  }

  if (block !== wasBlock && shown) count(shown, Number(priceOf(block ? hour : blockPrice)));
  wasBlock = block;

  const choice = {
    block,
    price: priceOf(shown),
    instructor: picked('instructor'),
    car: picked('car'),
    day: longDay(document.getElementById('b-day')?.value),
    time: WORDS.time[picked('time')] || '',
    name: document.getElementById('b-name')?.value.trim() || '',
    area: document.getElementById('b-area')?.value.trim().toUpperCase() || '',
  };

  const summary = document.getElementById('book-summary');
  if (summary) {
    const when = choice.day || choice.time ? ` ${[choice.day, choice.time].filter(Boolean).join(', ')}.` : '';
    summary.textContent = `${block ? 'The ten-hour block' : 'One hour'} with ${WORDS.instructor[choice.instructor]}, in ${WORDS.car[choice.car]}.${when.replace(/^ (.)/, (m, c) => ` ${c.toUpperCase()}`)}`;
  }

  const link = document.getElementById('book-whatsapp');
  if (link) link.href = `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(buildMessage(choice))}`;
}

export function initBooking() {
  const book = document.getElementById('book');
  if (!book) return;

  const day = document.getElementById('b-day');
  if (day) {
    const today = new Date();
    day.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  book.addEventListener('change', update);
  book.addEventListener('input', update);

  // "Book the manual", "Book with her": preselect that choice, then go to the booking block.
  document.querySelectorAll('[data-pick]').forEach((link) => {
    link.addEventListener('click', () => {
      const [name, value] = link.dataset.pick.split(':');
      const input = book.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  });

  update();
}

// Prices can change when edited content arrives, so the message is rebuilt then.
export const refreshBooking = update;
