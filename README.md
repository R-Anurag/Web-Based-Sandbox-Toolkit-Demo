# AR Sandbox Toolkit

A minimal web-based sandbox for placing assets on a canvas and exporting their positions as JSON.

## Quick Start

```bash
# No build step required — open directly in any modern browser
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

Or serve locally to avoid any browser file-protocol restrictions:

```bash
npx serve .
# → http://localhost:3000
```

## Usage

| Action | How |
|---|---|
| Place an asset | Drag from the sidebar onto the canvas, **or** click an asset to place it at the center |
| Reposition | Click and drag any placed item |
| Remove | Hover over an item → click the **✕** badge |
| Clear all | Click **Clear** in the toolbar |
| Export | Click **Export JSON** → copy to clipboard or download `placements.json` |

## Export Format

```json
{
  "exportedAt": "2025-07-14T10:00:00.000Z",
  "canvasSize": { "width": 1200, "height": 800 },
  "placements": [
    { "id": 1, "type": "cube",   "x": 320, "y": 240 },
    { "id": 2, "type": "light",  "x": 640, "y": 400 },
    { "id": 3, "type": "marker", "x": 900, "y": 180 }
  ]
}
```

- `x` / `y` — pixel coordinates relative to the top-left corner of the canvas
- `canvasSize` — viewport dimensions at export time (useful for normalising coordinates)

## Assets

| Icon | Type |
|---|---|
| 📦 | Cube |
| 🔵 | Sphere |
| 💡 | Light |
| 📷 | Camera |
| 📍 | Marker |

## Screenshot

![Sandbox screenshot](screenshot.png)

## Stack

Plain HTML + CSS + vanilla JS — zero dependencies, zero build step.
