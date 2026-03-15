import { placements } from './state.js';
import { COLORS }     from './colors.js';
import { ASSETS }     from './assets.js';

export let dragPayload = null;
export function clearDragPayload() { dragPayload = null; }

export function initSidebar(canvasEl, onPlace) {
  const sidebar = document.getElementById('sidebar');

  Object.entries(ASSETS).forEach(([type, asset]) => {
    const { accent } = COLORS[type] ?? { accent: '#888' };

    const el = document.createElement('div');
    el.className   = 'asset';
    el.draggable   = true;
    el.dataset.type = type;
    el.style.setProperty('--accent', accent);
    el.innerHTML   = `<span class="icon">${asset.icon}</span>${asset.label}`;
    sidebar.appendChild(el);

    el.addEventListener('dragstart', e => {
      dragPayload = { type };
      e.dataTransfer.effectAllowed = 'copy';
    });

    el.addEventListener('click', () => {
      const r      = canvasEl.getBoundingClientRect();
      const offset = (placements.length % 5) * 24;
      onPlace(type,
        Math.round(r.width  / 2) + offset,
        Math.round(r.height / 2) + offset);
    });
  });
}

export function updateBadges() {
  const counts = {};
  placements.forEach(p => { counts[p.type] = (counts[p.type] ?? 0) + 1; });
  document.querySelectorAll('.asset').forEach(el => {
    const n   = counts[el.dataset.type] ?? 0;
    let badge = el.querySelector('.asset-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'asset-badge';
      el.appendChild(badge);
    }
    badge.textContent   = n || '';
    badge.style.display = n ? 'flex' : 'none';
  });
}
