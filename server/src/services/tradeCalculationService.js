import { calculateInstrumentRisk } from './instrumentCalculationService.js';

const usable = (value) => value != null && value !== '' && Number.isFinite(Number(value)) && Number(value) !== 0;
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

export function calculateTradeAnalytics(data, context = {}) {
  const warnings = [];
  const entry = Number(data.entryPrice), stop = Number(data.stopLoss), target = Number(data.takeProfit), exit = Number(data.exitPrice);
  let plannedRR = null;
  if (usable(data.entryPrice) && usable(data.stopLoss) && usable(data.takeProfit) && entry !== stop) {
    plannedRR = round(Math.abs(target - entry) / Math.abs(entry - stop));
  } else warnings.push('Planned RR unavailable: valid non-zero entry, stop loss, and take profit are required');

  let realizedRMultiple = null;
  if (usable(data.entryPrice) && usable(data.stopLoss) && usable(data.exitPrice) && ['BUY', 'SELL'].includes(String(data.direction).toUpperCase())) {
    const buy = String(data.direction).toUpperCase() === 'BUY';
    const riskDistance = buy ? entry - stop : stop - entry;
    if (riskDistance > 0) realizedRMultiple = round((buy ? exit - entry : entry - exit) / riskDistance);
    else warnings.push(`Realized R unavailable: ${buy ? 'BUY stop loss must be below entry' : 'SELL stop loss must be above entry'}`);
  } else warnings.push('Realized R unavailable: entry, stop loss, exit price, and direction are required');

  let riskAmount = usable(data.riskAmount) ? round(data.riskAmount) : null;
  if (riskAmount == null) {
    const instrument = calculateInstrumentRisk({ ...data, accountCurrency: context.accountCurrency, conversionRates: context.conversionRates });
    riskAmount = instrument.riskAmount;
    if (instrument.warning) warnings.push(`Risk unavailable: ${instrument.warning}`);
  }
  const balance = Number(data.balanceBeforeTrade ?? context.balanceBeforeTrade);
  const riskPercentage = riskAmount != null && Number.isFinite(balance) && balance > 0 ? round(riskAmount / balance * 100) : null;
  if (riskPercentage == null) warnings.push('Risk percentage unavailable: reliable risk amount and balance before trade are required');

  const calculated = [plannedRR, realizedRMultiple, riskPercentage].filter((value) => value != null).length;
  const manual = data.plannedRROverride != null || data.riskPercentageOverride != null;
  return {
    plannedRR,
    realizedRMultiple,
    riskAmount,
    riskPercentage,
    calculationStatus: manual ? 'MANUAL' : calculated === 3 ? 'CALCULATED' : calculated ? 'PARTIAL' : 'UNAVAILABLE',
    calculationWarnings: warnings
  };
}

export function reconstructRealizedBalances(trades, initialBalance) {
  // Realized-balance journal rule: order by closeTimeUtc, fall back to tradeDate.
  // This deliberately does not represent floating equity while trades overlap.
  let balance = Number(initialBalance);
  return [...trades]
    .sort((a, b) => {
      const ad = new Date(a.closeTimeUtc || a.tradeDate || 0).getTime();
      const bd = new Date(b.closeTimeUtc || b.tradeDate || 0).getTime();
      return ad - bd || Number(a.tradeNumber || a.rowNumber || 0) - Number(b.tradeNumber || b.rowNumber || 0);
    })
    .map((trade) => {
      const balanceBeforeTrade = round(balance);
      balance += Number(trade.profitLoss || 0);
      return { trade, balanceBeforeTrade };
    });
}
