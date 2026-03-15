import { ASSETS } from './assets.js';

const SUPPORTED_VERSIONS = ['2.0'];

/**
 * Parse and validate a JSON string, then call onPlace for each valid placement.
 * Returns { loaded, skipped, skippedTypes, errors }.
 */
export function importPlacements(jsonStr, canvasEl, onPlace) {
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return { loaded: 0, skipped: 0, skippedTypes: [], errors: ['Invalid JSON — could not parse.'] };
  }

  // Accept missing version (v1 legacy) or supported versions
  if (data.version != null && !SUPPORTED_VERSIONS.includes(data.version)) {
    return {
      loaded: 0, skipped: 0, skippedTypes: [],
      errors: [`Unsupported schema version "${data.version}". Expected: ${SUPPORTED_VERSIONS.join(', ')}.`],
    };
  }

  if (!Array.isArray(data.placements)) {
    return { loaded: 0, skipped: 0, skippedTypes: [], errors: ['"placements" must be an array.'] };
  }

  const cw = canvasEl.clientWidth;
  const ch = canvasEl.clientHeight;
  let loaded = 0;
  const skippedTypes = new Set();
  const failed = [];

  data.placements.forEach(entry => {
    const asset = ASSETS[entry.type];
    if (!asset) { skippedTypes.add(entry.type ?? '(unknown)'); return; }

    // Support both v2 (transform object) and v1 (flat x/y) shapes
    const t = entry.transform ?? entry;
    const x = t.xNorm != null
      ? Math.round(t.xNorm * cw)
      : Math.round((t.x / (data.canvasSize?.width  || cw)) * cw);
    const y = t.yNorm != null
      ? Math.round(t.yNorm * ch)
      : Math.round((t.y / (data.canvasSize?.height || ch)) * ch);

    const scale    = t.scale    ?? 1;
    const rotation = t.rotation ?? 0;
    // Always use base asset dimensions — renderItem applies scale itself
    const width    = asset.width;
    const height   = asset.height;

    try {
      onPlace(entry.type, x, y, scale, rotation, width, height);
      loaded++;
    } catch (err) {
      failed.push(`id ${entry.id}: ${err.message}`);
    }
  });

  // Only hard errors (failed placements) go into errors — skipped types are surfaced separately
  return { loaded, skipped: skippedTypes.size, skippedTypes: [...skippedTypes], errors: failed };
}
