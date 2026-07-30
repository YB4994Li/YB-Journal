export function calculateBalanceDomain(history = []) {
  const balances = history
    .map((point) => Number(point.balance))
    .filter(Number.isFinite);

  if (!balances.length) return ['auto', 'auto'];

  const minimum = Math.min(...balances);
  const maximum = Math.max(...balances);
  const actualRange = maximum - minimum;
  const midpoint = (minimum + maximum) / 2;

  // Prevent a flat or nearly flat account from being magnified excessively.
  // The minimum window is 0.5% of the account level, with an absolute floor.
  const minimumVisibleRange = Math.max(10, Math.abs(midpoint) * 0.005);
  const visibleRange = Math.max(actualRange, minimumVisibleRange);
  const padding = visibleRange * 0.1;
  const halfRange = visibleRange / 2 + padding;

  return [midpoint - halfRange, midpoint + halfRange];
}
