const round = (value, digits = 4) => Number(Number(value).toFixed(digits));

export function calculateProfitFactor(grossProfit, grossLoss) {
  const profit = Math.max(0, Number(grossProfit) || 0);
  const loss = Math.abs(Number(grossLoss) || 0);
  if (profit > 0 && loss === 0) return 'INFINITY';
  if (profit === 0 && loss > 0) return 0;
  if (profit === 0 && loss === 0) return null;
  return round(profit / loss);
}
