const numeric = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

export function breakEvenThresholdAmount(initialCapital, thresholdPercent = 0.05) {
  if (!numeric(initialCapital) || !numeric(thresholdPercent)) return 0;
  return round(Number(initialCapital) * Number(thresholdPercent) / 100);
}

export function classifyTradeResult(profitLoss, initialCapital, thresholdPercent = 0.05) {
  const pnl = numeric(profitLoss) ? Number(profitLoss) : 0;
  const threshold = breakEvenThresholdAmount(initialCapital, thresholdPercent);
  if (Math.abs(pnl) <= threshold) return 'BREAK_EVEN';
  return pnl > threshold ? 'WIN' : 'LOSS';
}

// Risk analytics are intentionally disabled. Only explicit manual inputs are retained.
export function manualTradeAnalytics(data, context = {}) {
  const manualResult = String(data.resultSource || 'AUTO').toUpperCase() === 'MANUAL';
  const manualRiskAmount = (data.manualRiskProvided === true || data.riskCalculationStatus === 'MANUAL') && numeric(data.riskAmount)
    ? round(data.riskAmount)
    : null;
  return {
    plannedRR: null,
    realizedRMultiple: null,
    riskAmount: manualRiskAmount,
    riskPercentage: null,
    result: manualResult && ['WIN', 'LOSS', 'BREAK_EVEN'].includes(data.result)
      ? data.result
      : classifyTradeResult(data.profitLoss, context.initialCapital, context.breakEvenThresholdPercent),
    resultSource: manualResult ? 'MANUAL' : 'AUTO',
    calculationStatus: manualRiskAmount !== null || data.plannedRROverride != null || data.riskPercentageOverride != null ? 'MANUAL' : 'UNAVAILABLE',
    calculationWarnings: [],
    instrumentSpecificationId: null,
    riskCalculationMode: null,
    contractSizeUsed: null,
    tickSizeUsed: null,
    tickValueUsed: null,
    pipSizeUsed: null,
    conversionRateUsed: null,
    riskCalculationSource: manualRiskAmount !== null ? 'Manual risk amount' : null,
    riskCalculationStatus: manualRiskAmount !== null ? 'MANUAL' : 'UNAVAILABLE',
    riskCalculationError: null
  };
}

export function reconstructRealizedBalances(trades, initialBalance) {
  let balance = Number(initialBalance);
  const timestamp = (trade) => {
    for (const value of [trade.closeTimeUtc, trade.openTimeUtc, trade.tradeDate]) {
      const time = value ? new Date(value).getTime() : NaN;
      if (Number.isFinite(time)) return time;
    }
    return 0;
  };
  const netPnl = (trade) => numeric(trade.netProfitLoss) ? Number(trade.netProfitLoss) : Number(trade.profitLoss || 0);
  return [...trades]
    .sort((a, b) => timestamp(a) - timestamp(b) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0) || Number(a.id ?? a.rowNumber ?? a.tradeNumber ?? 0) - Number(b.id ?? b.rowNumber ?? b.tradeNumber ?? 0))
    .map((trade) => {
      const balanceBeforeTrade = round(balance);
      const netProfitLoss = round(netPnl(trade));
      const balanceAfterTrade = round(balanceBeforeTrade + netProfitLoss);
      balance = balanceAfterTrade;
      return { trade, balanceBeforeTrade, balanceAfterTrade, netProfitLoss };
    });
}
