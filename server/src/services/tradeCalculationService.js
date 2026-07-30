import { calculateInstrumentRisk, RISK_ERROR_MESSAGES } from './instrumentCalculationService.js';

const numeric = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const positive = (value) => numeric(value) && Number(value) > 0;
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

export function breakEvenThresholdAmount(initialCapital, thresholdPercent = 0.05) {
  return positive(initialCapital) && numeric(thresholdPercent) ? round(Number(initialCapital) * Number(thresholdPercent) / 100) : 0;
}

export function classifyTradeResult(profitLoss, initialCapital, thresholdPercent = 0.05) {
  if (!numeric(profitLoss)) return null;
  const threshold = breakEvenThresholdAmount(initialCapital, thresholdPercent);
  const pnl = Number(profitLoss);
  if (Math.abs(pnl) <= threshold) return 'BREAK_EVEN';
  return pnl > threshold ? 'WIN' : 'LOSS';
}

export function calculatePlannedRR(data) {
  if (![data.entryPrice, data.stopLoss, data.takeProfit].every(positive)) return { value: null, error: 'INVALID_PRICE_GEOMETRY' };
  const entry = Number(data.entryPrice);
  const stop = Number(data.stopLoss);
  const target = Number(data.takeProfit);
  const direction = String(data.direction || '').toUpperCase();
  const riskDistance = direction === 'BUY' ? entry - stop : direction === 'SELL' ? stop - entry : 0;
  const rewardDistance = direction === 'BUY' ? target - entry : direction === 'SELL' ? entry - target : 0;
  if (riskDistance <= 0 || rewardDistance <= 0) return { value: null, error: 'INVALID_PRICE_GEOMETRY' };
  return { value: round(rewardDistance / riskDistance), error: null };
}

export function calculateTradeAnalytics(data, context = {}) {
  const warnings = [];
  const planned = calculatePlannedRR(data);
  if (planned.error) warnings.push('Planned RR unavailable: invalid or incomplete entry, stop-loss, take-profit, or direction');

  let risk;
  if (positive(data.riskAmount) && context.preserveManualRisk !== false && !data.instrumentSpecificationId) {
    risk = { riskAmount: round(data.riskAmount), error: null, status: 'MANUAL', snapshot: {} };
  } else {
    risk = calculateInstrumentRisk({
      normalizedSymbol: data.market,
      entryPrice: data.entryPrice,
      stopLoss: data.stopLoss,
      lotSize: data.lotSize,
      accountCurrency: context.accountCurrency,
      instrumentSpecification: context.instrumentSpecification,
      conversionRate: context.conversionRate,
      conversionRates: context.conversionRates
    });
  }
  if (risk.error) warnings.push(RISK_ERROR_MESSAGES[risk.error] || risk.error);

  const balance = Number(data.balanceBeforeTrade ?? context.balanceBeforeTrade);
  const riskPercentage = risk.riskAmount !== null && Number.isFinite(balance) && balance > 0
    ? round(risk.riskAmount / balance * 100, 4)
    : null;
  if (risk.riskAmount !== null && riskPercentage === null) warnings.push('Risk percentage unavailable: invalid balance before trade');

  const realizedRMultiple = risk.riskAmount !== null && positive(risk.riskAmount) && numeric(data.profitLoss)
    ? round(Number(data.profitLoss) / risk.riskAmount, 4)
    : null;
  const manualResult = String(data.resultSource || 'AUTO').toUpperCase() === 'MANUAL';
  const result = manualResult && ['WIN', 'LOSS', 'BREAK_EVEN'].includes(data.result)
    ? data.result
    : classifyTradeResult(data.profitLoss, context.initialCapital, context.breakEvenThresholdPercent);

  const manualAnalytics = data.plannedRROverride != null || data.riskPercentageOverride != null;
  const calculatedCount = [planned.value, realizedRMultiple, riskPercentage].filter((value) => value !== null).length;
  return {
    plannedRR: planned.value,
    realizedRMultiple,
    riskAmount: risk.riskAmount,
    riskPercentage,
    result,
    resultSource: manualResult ? 'MANUAL' : 'AUTO',
    calculationStatus: manualAnalytics ? 'MANUAL' : calculatedCount === 3 ? 'CALCULATED' : calculatedCount ? 'PARTIAL' : 'UNAVAILABLE',
    calculationWarnings: warnings,
    riskCalculationStatus: risk.status,
    riskCalculationError: risk.error,
    instrumentSpecificationId: risk.snapshot?.instrumentSpecificationId ?? null,
    riskCalculationMode: risk.snapshot?.riskCalculationMode ?? null,
    contractSizeUsed: risk.snapshot?.contractSizeUsed ?? null,
    tickSizeUsed: risk.snapshot?.tickSizeUsed ?? null,
    tickValueUsed: risk.snapshot?.tickValueUsed ?? null,
    pipSizeUsed: risk.snapshot?.pipSizeUsed ?? null,
    conversionRateUsed: risk.snapshot?.conversionRateUsed ?? null,
    riskCalculationSource: risk.status === 'MANUAL' ? 'Manual risk amount' : risk.snapshot?.riskCalculationSource ?? null
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
  const netPnl = (trade) => {
    if (numeric(trade.netProfitLoss)) return Number(trade.netProfitLoss);
    if (numeric(trade.profitLoss)) return Number(trade.profitLoss);
    return ['grossProfitLoss', 'commission', 'swap', 'fees'].reduce((sum, key) => sum + (numeric(trade[key]) ? Number(trade[key]) : 0), 0);
  };
  return [...trades]
    .sort((a, b) => timestamp(a) - timestamp(b)
      || new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      || Number(a.id ?? a.rowNumber ?? a.tradeNumber ?? 0) - Number(b.id ?? b.rowNumber ?? b.tradeNumber ?? 0))
    .map((trade) => {
      const balanceBeforeTrade = round(balance);
      const netProfitLoss = round(netPnl(trade));
      const balanceAfterTrade = round(balanceBeforeTrade + netProfitLoss);
      balance = balanceAfterTrade;
      return { trade, balanceBeforeTrade, balanceAfterTrade, netProfitLoss };
    });
}
