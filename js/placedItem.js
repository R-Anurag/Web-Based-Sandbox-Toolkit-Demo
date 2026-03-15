import { placements } from './state.js';
import { COLORS }     from './colors.js';
import { ASSETS }     from './assets.js';

export function renderItem(p, canvasEl, onRemove, onSelect, onDragEnd) {
  const { accent, muted } = COLORS[p.type] ?? { accent: '#888', muted: 'rgba(128,128,128,.1)' };
  const asset = ASSETS[p.type] ?? { src: '', icon: '?', label: p.type };

  const el = document.createElement('div');
  el.className  = 'placed';
  el.dataset.id = p.id;
  el.style.left   = p.x + 'px';
  el.style.top    = p.y + 'px';
  el.style.width  = (p.width  * (p.scale ?? 1)) + 'px';
  el.style.height = (p.height * (p.scale ?? 1)) + 'px';
  el.style.setProperty('--accent',   accent);
  el.style.setProperty('--muted',    muted);
  el.style.setProperty('--rotation', (p.rotation ?? 0) + 'deg');

  el.innerHTML = `
    <span class="remove" title="Remove">✕</span>
    <div class="placed-inner">
      <model-viewer
        src="${asset.src}"
        alt="${asset.label}"
        auto-rotate
        camera-controls
        shadow-intensity="0"
        style="width:100%;flex:1;min-height:0;background:transparent;overflow:visible;"
      ></model-viewer>
      <span class="label">${asset.label}</span>
      <span class="coords">${p.x}, ${p.y}</span>
    </div>`;

  // Append first so model-viewer is connected before we attach the error listener
  canvasEl.appendChild(el);

  const mv = el.querySelector('model-viewer');
  mv.addEventListener('error', () => {
    mv.outerHTML = `<span class="icon" style="font-size:28px;display:block;padding:8px 0">${asset.icon}</span>`;
  });

  requestAnimationFrame(() => el.classList.add('placed--in'));

  el.querySelector('.remove').addEventListener('click', e => {
    e.stopPropagation();
    _removeItem(el, p, onRemove);
  });

  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('remove')) return;
    // Always select on mousedown; only skip canvas drag when inside model-viewer
    onSelect(p.id);
    if (!e.target.closest('model-viewer')) _startDrag(e, el, p, canvasEl, onDragEnd);
  });

  return el;
}

export function removeItemById(id, canvasEl, onRemove) {
  const el = canvasEl.querySelector(`[data-id="${id}"]`);
  const p  = placements.find(i => i.id === id);
  if (el && p) _removeItem(el, p, onRemove);
}

export function syncSelection(canvasEl, id) {
  canvasEl.querySelectorAll('.placed').forEach(el =>
    el.classList.toggle('placed--selected', Number(el.dataset.id) === id));
}

function _removeItem(el, p, onRemove) {
  el.classList.add('placed--out');
  el.addEventListener('animationend', () => {
    const idx = placements.findIndex(i => i.id === p.id);
    if (idx !== -1) placements.splice(idx, 1);
    el.remove();
    onRemove();
  }, { once: true });
}

function _startDrag(e, el, p, canvasEl, onDragEnd) {
  e.preventDefault();
  const r  = canvasEl.getBoundingClientRect();
  const ox = e.clientX - (p.x + r.left);
  const oy = e.clientY - (p.y + r.top);

  const onMove = mv => {
    const nr = canvasEl.getBoundingClientRect();
    p.x = Math.round(Math.max(0, Math.min(nr.width,  mv.clientX - nr.left - ox)));
    p.y = Math.round(Math.max(0, Math.min(nr.height, mv.clientY - nr.top  - oy)));
    el.style.left = p.x + 'px';
    el.style.top  = p.y + 'px';
    el.querySelector('.coords').textContent = `${p.x}, ${p.y}`;
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup',   onUp);
    if (onDragEnd) onDragEnd();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onUp);
}
