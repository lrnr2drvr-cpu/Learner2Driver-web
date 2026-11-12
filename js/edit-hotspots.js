// Editing the hotspots on the car photographs: add one, drag it into place, change its
// title and text, or remove it. Each car's hotspots are saved together as one list.
import { hotspotNodes, wireHotspot, hotspotsReady } from './ui.js';

let tools; // { editable, save, upsert, pushUndo }, handed over by edit.js

const clamp = (value) => Math.min(96, Math.max(4, value));

function noteOf(dot) {
  return document.getElementById(dot.getAttribute('aria-controls'));
}

// The hotspots as they are on the page right now.
function read(figure) {
  return Array.from(figure.querySelectorAll('.hotspot')).map((dot, index) => {
    const note = noteOf(dot);
    return {
      id: index + 1,
      title: note.querySelector('strong').textContent.replace(/\s+/g, ' ').trim(),
      desc: note.querySelector('span').textContent.replace(/\s+/g, ' ').trim(),
      x: Number(parseFloat(dot.style.getPropertyValue('--x')).toFixed(1)),
      y: Number(parseFloat(dot.style.getPropertyValue('--y')).toFixed(1)),
    };
  });
}

function draw(figure, spots) {
  figure.querySelectorAll('.hotspot, .hotspot__note').forEach((el) => el.remove());
  spots.forEach((spot, index) => {
    const [dot, note] = hotspotNodes(figure.dataset.car, spot, index);
    figure.append(dot, note);
    wireHotspot(dot);
    arm(figure, dot, note);
  });
}

function store(figure, spots) {
  return tools.upsert('fleet_hotspots', 'vehicle_id', { vehicle_id: figure.dataset.car, hotspots: spots });
}

// Saves the car's hotspots as they now are; `before` is what undo goes back to.
async function persist(figure, label, before) {
  const ok = await tools.save(label, () => store(figure, read(figure)));
  if (ok) {
    tools.pushUndo(label, async () => { await store(figure, before); draw(figure, before); });
  } else {
    draw(figure, before);
  }
}

function arm(figure, dot, note) {
  // Drag the dot to move it. A press without movement is still an ordinary click.
  let start = null;
  let dragged = false;
  dot.addEventListener('pointerdown', (event) => {
    start = { x: event.clientX, y: event.clientY, before: read(figure) };
    dragged = false;
    dot.setPointerCapture(event.pointerId);
  });
  dot.addEventListener('pointermove', (event) => {
    if (!start) return;
    if (!dragged && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 4) return;
    dragged = true;
    const box = figure.getBoundingClientRect();
    const place = `--x: ${clamp(((event.clientX - box.left) / box.width) * 100)}%; --y: ${clamp(((event.clientY - box.top) / box.height) * 100)}%`;
    dot.style.cssText = place;
    note.style.cssText = place;
  });
  const finish = () => {
    if (start && dragged) persist(figure, 'the hotspot', start.before);
    start = null;
  };
  dot.addEventListener('pointerup', finish);
  dot.addEventListener('pointercancel', finish);
  // After a drag, the click that follows must not also open or close the note.
  dot.addEventListener('click', (event) => {
    if (dragged) { event.stopImmediatePropagation(); dragged = false; }
  }, true);

  const title = note.querySelector('strong');
  const text = note.querySelector('span');
  const field = (el, max) => tools.editable(el, {
    label: 'the hotspot',
    max,
    commit: async (value, before) => {
      // What the list looked like before this change: the same, with this one field as it was.
      const mine = Array.from(figure.querySelectorAll('.hotspot')).indexOf(dot);
      const part = el === title ? 'title' : 'desc';
      const previous = read(figure).map((spot, index) => (index === mine ? { ...spot, [part]: before } : spot));
      await store(figure, read(figure));
      dot.querySelector('.visually-hidden').textContent = title.textContent;
      return async () => { await store(figure, previous); draw(figure, previous); };
    },
  });
  field(title, 50);
  field(text, 160);

  const remove = Object.assign(document.createElement('button'), { type: 'button', className: 'hotspot__remove', textContent: 'Remove hotspot' });
  remove.addEventListener('click', () => {
    const before = read(figure);
    dot.remove();
    note.remove();
    persist(figure, 'the hotspot', before);
  });
  note.append(remove);
}

function setUp(figure) {
  figure.querySelectorAll('.hotspot').forEach((dot) => arm(figure, dot, noteOf(dot)));

  const add = Object.assign(document.createElement('button'), { type: 'button', className: 'hotspot-add glass', textContent: 'Add a hotspot' });
  add.dataset.keep = '';
  add.addEventListener('click', () => {
    const before = read(figure);
    if (before.length >= 6) { tools.save('the hotspot', () => { throw new Error('A photo can hold six hotspots at most.'); }); return; }
    draw(figure, [...before, { title: 'New hotspot', desc: 'Say what this is.', x: 50, y: 50 }]);
    const dots = figure.querySelectorAll('.hotspot');
    dots[dots.length - 1].setAttribute('aria-expanded', 'true');
    persist(figure, 'the hotspot', before);
  });
  figure.append(add);
}

export async function editHotspots(shared) {
  tools = shared;
  await hotspotsReady;
  document.querySelectorAll('#cars figure[data-car]').forEach(setUp);
}
