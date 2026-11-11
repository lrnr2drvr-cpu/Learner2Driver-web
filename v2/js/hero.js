// Hero: switch between the manual and the automatic. The large photograph crossfades,
// the small one shows the other car, and the booking choice below follows.
const NAMES = { manual: 'Toyota Yaris', automatic: 'Hyundai Kona EV' };
const OTHER = { manual: 'automatic', automatic: 'manual' };

export function initHero() {
  const hero = document.getElementById('hero-cars');
  if (!hero) return;
  const main = hero.querySelector('.photo--hero');
  const inset = hero.querySelector('.photo--inset');
  const buttons = Array.from(hero.querySelectorAll('.switch button'));
  const radios = Array.from(document.querySelectorAll('#book input[name="car"]'));

  function show(car) {
    main.querySelectorAll('img').forEach((img) => img.classList.toggle('is-shown', img.dataset.car === car));
    inset.querySelectorAll('img').forEach((img) => img.classList.toggle('is-shown', img.dataset.car === OTHER[car]));
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.car === car)));
    const chip = main.querySelector('.chip');
    if (chip) chip.textContent = NAMES[car];
    const insetChip = inset.querySelector('.chip');
    if (insetChip) insetChip.textContent = OTHER[car] === 'automatic' ? 'Electric automatic' : 'Manual';
    const swap = inset.querySelector('.photo__swap');
    if (swap) {
      swap.dataset.car = OTHER[car];
      swap.setAttribute('aria-label', `Show the ${OTHER[car]} car`);
    }
  }

  // Choosing a car here selects it in the booking block; the booking block's own
  // change event then updates the photographs, so the two can never disagree.
  function choose(car) {
    const radio = radios.find((input) => input.value === car);
    if (!radio) { show(car); return; }
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  hero.addEventListener('click', (event) => {
    const control = event.target.closest('[data-car]');
    if (control && control.matches('button')) choose(control.dataset.car);
  });
  radios.forEach((radio) => radio.addEventListener('change', () => { if (radio.checked) show(radio.value); }));

  const picked = radios.find((radio) => radio.checked);
  show(picked ? picked.value : 'manual');
}
