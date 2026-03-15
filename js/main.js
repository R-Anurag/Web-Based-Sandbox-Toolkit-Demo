import { placements, nextId, selectedId, setSelected } from './state.js';
import { initSidebar, updateBadges }                   from './sidebar.js';
import { initCanvas }                                   from './canvas.js';
import { renderItem, removeItemById, syncSelection }    from './placedItem.js';
import { initModal }                                    from './modal.js';
import { COLORS }                                       from './colors.js';
import { ASSETS }                                       from './assets.js';

const canvasEl = document.getElementById('canvas');
const propsEl  = document.getElementById('props');
const emptyEl  = document.getElementById('empty-state');

// ── Selection ──────────────────────────────────────────────────────────────
function selectItem(id) {
  setSelected(id);
  syncSelection(canvasEl, id);
  _updateProps();
}

function deselect() {
  setSelected(null);
  syncSelection(canvasEl, null);
  _updateProps();
}

function _updateProps() {
  const p = placements.find(i => i.id === selectedId);
  if (!p) { propsEl.hidden = true; return; }
  const { accent } = COLORS[p.type] ?? { accent: '#888' };
  propsEl.hidden = false;
  propsEl.innerHTML = `
    <span class="props-dot" style="background:${accent}"></span>
    <span class="props-type">${p.type}</span>
    <span class="props-sep">·</span>
    <span class="props-field">id <b>${p.id}</b></span>
    <span class="props-sep">·</span>
    <span class="props-field">x <b>${p.x}</b></span>
    <span class="props-sep">·</span>
    <span class="props-field">y <b>${p.y}</b></span>
    <span class="props-sep">·</span>
    <span class="props-field">scale <b>${p.scale}</b></span>
    <span class="props-hint">— press Delete to remove</span>`;
}

// ── Keyboard delete ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
    removeItemById(selectedId, canvasEl, _afterChange);
    setSelected(null);
    syncSelection(canvasEl, null);
    _updateProps();
  }
});

// ── Place ──────────────────────────────────────────────────────────────────
function placeAsset(type, x, y, scale = 1, rotation = 0, width, height) {
  const asset = ASSETS[type];
  if (!asset) return;
  const p = {
    id:       nextId(),
    type,
    x, y,
    scale,
    rotation,
    width:    width  ?? asset.width,
    height:   height ?? asset.height,
  };
  placements.push(p);
  renderItem(p, canvasEl, _afterChange, selectItem, _afterChange);
  selectItem(p.id);
  _afterChange();
}

// ── After any state change ─────────────────────────────────────────────────
function _afterChange() {
  updateBadges();
  emptyEl.style.display = placements.length ? 'none' : 'flex';
  _updateProps();
}

// ── Init ───────────────────────────────────────────────────────────────────
initSidebar(canvasEl, (type, x, y) => placeAsset(type, x, y));
initCanvas(canvasEl, (type, x, y) => placeAsset(type, x, y), deselect);
initModal(canvasEl, (type, x, y, scale, rotation, width, height) =>
  placeAsset(type, x, y, scale, rotation, width, height));

document.getElementById('btn-clear').addEventListener('click', () => {
  placements.length = 0;
  canvasEl.querySelectorAll('.placed').forEach(el => el.remove());
  deselect();
  _afterChange();
});

_afterChange();
