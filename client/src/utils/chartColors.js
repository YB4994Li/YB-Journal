// High-contrast series colors tuned for dark chart backgrounds and neon glows.
// Keep this list at a power-of-two length so the full hash range addresses it.
export const CHART_SERIES_COLORS = [
  '#c7f36b', '#38bdf8', '#fb7185', '#fbbf24', '#a78bfa', '#2dd4bf', '#f97316', '#60a5fa',
  '#e879f9', '#34d399', '#f472b6', '#facc15', '#818cf8', '#22d3ee', '#fb923c', '#4ade80',
  '#c084fc', '#67e8f9', '#fda4af', '#a3e635', '#93c5fd', '#5eead4', '#fdba74', '#d8b4fe',
  '#14b8a6', '#f0abfc', '#bef264', '#7dd3fc', '#f9a8d4', '#86efac', '#fde047', '#a5b4fc',
];

export const DIRECTION_COLORS = Object.freeze({ BUY: '#c7f36b', SELL: '#fb7185' });

export function normalizeSeriesName(name) {
  return String(name ?? 'Unassigned').trim().replace(/\s+/g, ' ').toLocaleUpperCase('en-US');
}

// FNV-1a gives stable colors across sorting, filtering, charts, and page loads.
export function seriesColor(name) {
  const value = normalizeSeriesName(name);
  if (DIRECTION_COLORS[value]) return DIRECTION_COLORS[value];
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return CHART_SERIES_COLORS[(hash >>> 0) % CHART_SERIES_COLORS.length];
}
