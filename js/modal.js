import { placements }        from './state.js';
import { COLORS }            from './colors.js';
import { ASSETS }            from './assets.js';
import { importPlacements }  from './importer.js';

export function initModal(canvasEl, onImport) {
  const overlay   = document.getElementById('modal-overlay');
  const btnClose  = document.getElementById('btn-close');

  // ── Tab switching ──────────────────────────────────────────────────────
  function switchTab(panelId) {
    document.querySelectorAll('.modal-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.panel === panelId));
    document.querySelectorAll('.modal-panel').forEach(p =>
      p.hidden = p.id !== panelId);
  }

  document.querySelectorAll('.modal-tab').forEach(tab =>
    tab.addEventListener('click', () => switchTab(tab.dataset.panel)));

  // ── Export ─────────────────────────────────────────────────────────────
  const output = document.getElementById('json-output');

  document.getElementById('btn-export').addEventListener('click', () => {
    switchTab('panel-export');
    output.innerHTML = _highlight(JSON.stringify(_buildExport(canvasEl), null, 2));
    overlay.classList.add('open');
  });

  const btnCopy = document.getElementById('btn-copy');
  btnCopy.addEventListener('click', () =>
    navigator.clipboard.writeText(output.textContent).then(() => {
      btnCopy.textContent = 'Copied!';
      setTimeout(() => (btnCopy.textContent = 'Copy'), 1500);
    }));

  document.getElementById('btn-download').addEventListener('click', () => {
    const blob = new Blob([output.textContent], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'),
      { href: URL.createObjectURL(blob), download: 'placements.json' });
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ── Import ─────────────────────────────────────────────────────────────
  const fileInput    = document.getElementById('import-file');
  const pasteArea    = document.getElementById('import-paste');
  const importFeedback = document.getElementById('import-feedback');

  document.getElementById('btn-import-open').addEventListener('click', () => {
    switchTab('panel-import');
    overlay.classList.add('open');
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { pasteArea.value = e.target.result; };
    reader.readAsText(file);
  });

  document.getElementById('btn-load').addEventListener('click', () => {
    const json = pasteArea.value.trim();
    if (!json) { _setFeedback(importFeedback, 'Paste or load a JSON file first.', 'warn'); return; }
    const result = importPlacements(json, canvasEl, onImport);
    if (result.errors.length) {
      _setFeedback(importFeedback, result.errors.join(' '), 'error');
    } else {
      const skippedNote = result.skipped
        ? ` · ${result.skipped} skipped (${result.skippedTypes.join(', ')})`
        : '';
      _setFeedback(importFeedback,
        `✓ ${result.loaded} item${result.loaded !== 1 ? 's' : ''} loaded${skippedNote}.`,
        result.skipped ? 'warn' : 'ok');
      if (!result.skipped) setTimeout(_close, 800);
    }
  });

  // ── Close ──────────────────────────────────────────────────────────────
  btnClose.addEventListener('click', _close);
  document.getElementById('btn-close-import').addEventListener('click', _close);
  overlay.addEventListener('click', e => { if (e.target === overlay) _close(); });

  function _close() {
    overlay.classList.remove('open');
    importFeedback.textContent = '';
    importFeedback.className   = 'import-feedback';
    pasteArea.value = '';
    fileInput.value = '';
  }
}

function _setFeedback(el, msg, type) {
  el.textContent = msg;
  el.className   = `import-feedback import-feedback--${type}`;
}

function _buildExport(canvasEl) {
  const cw = canvasEl.clientWidth;
  const ch = canvasEl.clientHeight;
  return {
    version:    '2.0',
    exportedAt: new Date().toISOString(),
    canvasSize: { width: cw, height: ch },
    placements: placements.map(p => {
      const asset = ASSETS[p.type] ?? {};
      const { accent } = COLORS[p.type] ?? { accent: '#888' };
      return {
        id:   p.id,
        type: p.type,
        model: {
          src:    asset.src    ?? '',
          format: 'glb',
        },
        transform: {
          x:        p.x,
          y:        p.y,
          xNorm:    parseFloat((p.x / cw).toFixed(6)),
          yNorm:    parseFloat((p.y / ch).toFixed(6)),
          width:    p.width,
          height:   p.height,
          scale:    p.scale,
          rotation: p.rotation,
        },
        meta: {
          label: asset.label ?? p.type,
          icon:  asset.icon  ?? '',
          color: accent,
        },
      };
    }),
  };
}

function _highlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) return `<span class="hl-key">${match}</span>`;
          return `<span class="hl-str">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="hl-bool">${match}</span>`;
        if (/null/.test(match))       return `<span class="hl-null">${match}</span>`;
        return `<span class="hl-num">${match}</span>`;
      }
    );
}
