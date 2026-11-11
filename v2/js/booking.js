// Booking: three choices become one pre-written WhatsApp message.
import { config } from './config.js';

const WORDS = {
  instructor: { male: 'the male instructor', female: 'the female instructor' },
  car: { manual: 'the manual Yaris', automatic: 'the automatic Kona EV' },
};

function picked(name) {
  const input = document.querySelector(`#book input[name="${name}"]:checked`);
  return input ? input.value : null;
}

function update() {
  const instructor = WORDS.instructor[picked('instructor')];
  const car = WORDS.car[picked('car')];
  const block = picked('hours') === '10';
  const price = document.querySelector(block ? '.price--10 [data-key="price_block"]' : '.price--1 [data-key="price_hour"]');
  const lessons = block ? 'The ten-hour block' : 'One hour';

  const summary = document.getElementById('book-summary');
  if (summary) summary.textContent = `${lessons} with ${instructor}, in ${car}.`;

  const link = document.getElementById('book-whatsapp');
  if (link) {
    const ask = block ? `the ten-hour block (£${price.textContent})` : `a one-hour lesson (£${price.textContent})`;
    const text = `Hi, I would like to book ${ask} with ${instructor}, in ${car}.`;
    link.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(text)}`;
  }
}

export function initBooking() {
  const book = document.getElementById('book');
  if (!book) return;
  book.addEventListener('change', update);

  // "Book the manual", "Book with her": preselect that choice, then go to the booking block.
  document.querySelectorAll('[data-pick]').forEach((link) => {
    link.addEventListener('click', () => {
      const [name, value] = link.dataset.pick.split(':');
      const input = book.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) { input.checked = true; update(); }
    });
  });

  update();
}

// Prices can change when edited content arrives, so the message is rebuilt then.
export const refreshBooking = update;
