import { dragPayload, clearDragPayload } from './sidebar.js';

export function initCanvas(canvasEl, onDrop, onDeselect) {
  canvasEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    canvasEl.classList.add('drag-over');
  });

  canvasEl.addEventListener('dragleave', () =>
    canvasEl.classList.remove('drag-over'));

  canvasEl.addEventListener('drop', e => {
    e.preventDefault();
    canvasEl.classList.remove('drag-over');
    if (!dragPayload) return;
    const r = canvasEl.getBoundingClientRect();
    onDrop(dragPayload.type,
      Math.round(e.clientX - r.left), Math.round(e.clientY - r.top));
    clearDragPayload();
  });

  canvasEl.addEventListener('mousedown', e => {
    if (!e.target.closest('.placed')) onDeselect();
  });
}
