// { id, type, x, y, scale, rotation, width, height }
export const placements = [];
let idCounter = 0;
export const nextId = () => ++idCounter;

export let selectedId = null;
export function setSelected(id) { selectedId = id; }
