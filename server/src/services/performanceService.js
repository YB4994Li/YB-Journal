import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { filteredBalanceHistory, selectPeriodTrades } from './statisticsService.js';
import { normalizeMarketSymbol } from './marketAnalyticsService.js';
import { normalizeTimeframe } from './tradingLibraryService.js';
import { calculateProfitFactor } from '../utils/profitFactor.js';

const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const pnl = (trade) => Number(trade.netProfitLoss ?? trade.profitLoss ?? 0);

export function calculatePerformanceMetrics(trades) {
  const wins = trades.filter((trade) => pnl(trade) > 0);
  const losses = trades.filter((trade) => pnl(trade) < 0);
  const breakEven = trades.length - wins.length - losses.length;
  const grossProfit = wins.reduce((sum, trade) => sum + pnl(trade), 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + pnl(trade), 0));
  const values = trades.map(pnl), mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const meanAbsolute = values.length ? values.reduce((sum, value) => sum + Math.abs(value), 0) / values.length : 0;
  const deviation = values.length ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) : 0;
  const ordered = [...trades].sort((a, b) => pnl(a) - pnl(b));
  const tradeSummary = (trade) => trade ? { id: trade.id, tradeNumber: trade.tradeNumber, profitLoss: round(pnl(trade)), market: trade.market, tradeDate: trade.tradeDate } : null;
  return {
    totalTrades: trades.length,
    netProfitLoss: round(grossProfit - grossLoss),
    wins: wins.length,
    losses: losses.length,
    breakEven,
    winRate: wins.length + losses.length ? round(wins.length / (wins.length + losses.length) * 100) : null,
    averageWin: wins.length ? round(grossProfit / wins.length) : null,
    averageLoss: losses.length ? round(-grossLoss / losses.length) : null,
    // 100 means identical trade P&L; dispersion relative to mean absolute P&L lowers the score.
    consistency: meanAbsolute ? round(100 / (1 + deviation / meanAbsolute)) : values.length ? 100 : 0,
    profitFactor: calculateProfitFactor(grossProfit, grossLoss),
    bestTrade: tradeSummary(ordered.at(-1)),
    worstTrade: tradeSummary(ordered[0])
  };
}

const groupKeys = {
  market: (trade) => ({ key: normalizeMarketSymbol(trade.market) || 'Unassigned', name: normalizeMarketSymbol(trade.market) || 'Unassigned', journalFilter: { market: normalizeMarketSymbol(trade.market) || '' } }),
  strategy: (trade) => ({ key: trade.strategy?.id ? String(trade.strategy.id) : 'unassigned', name: trade.strategy?.name || 'Unassigned', journalFilter: trade.strategy?.id ? { strategyId: trade.strategy.id } : { strategyId: 'unassigned' } }),
  session: (trade) => ({ key: trade.session || 'unassigned', name: trade.session ? trade.session.replaceAll('_', ' ') : 'Unassigned', journalFilter: { session: trade.session || 'unassigned' } }),
  timeframe: (trade) => { const value = normalizeTimeframe(trade.timeframe); return { key: value || 'unassigned', name: value || 'Unassigned', journalFilter: { timeframe: value || 'unassigned' } }; },
  direction: (trade) => ({ key: trade.direction || 'unassigned', name: trade.direction || 'Unassigned', journalFilter: { direction: trade.direction || 'unassigned' } }),
  weekday: (trade) => { const date = new Date(trade.tradeDate), index = date.getUTCDay(), name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]; return { key: String(index), name, journalFilter: { weekday: index } }; }
};

export function buildPerformanceBreakdown(trades, breakdown) {
  const selector = groupKeys[breakdown];
  if (!selector) return [];
  const groups = new Map();
  for (const trade of trades) {
    const category = selector(trade), current = groups.get(category.key) || { ...category, trades: [] };
    current.trades.push(trade); groups.set(category.key, current);
  }
  return [...groups.values()].map(({ trades: groupedTrades, ...category }) => ({ ...category, ...calculatePerformanceMetrics(groupedTrades) }))
    .sort((a, b) => b.netProfitLoss - a.netProfitLoss || b.totalTrades - a.totalTrades || a.name.localeCompare(b.name));
}

export async function getPerformance(accountId, query = {}, db = prisma) {
  const account = await db.account.findUnique({ where: { id: accountId }, select: { id: true, name: true, accountType: true, currency: true, initialCapital: true, createdAt: true } });
  if (!account) throw new ApiError(404, 'Account not found');
  const phaseId = query.phaseId == null || query.phaseId === '' ? null : Number(query.phaseId);
  let phase = null;
  if (phaseId) {
    phase = await db.accountPhase.findFirst({ where: { id: phaseId, accountId }, select: { id: true, name: true, initialBalance: true, startDate: true, createdAt: true } });
    if (!phase) throw new ApiError(404, 'Phase not found for this account');
  } else if (account.accountType === 'FUNDED') throw new ApiError(422, 'phaseId is required for funded account performance');
  const trades = await db.trade.findMany({
    where: { accountId, ...(phase ? { phaseId: phase.id } : { phaseId: null }) },
    include: { strategy: { select: { id: true, name: true } } }
  });
  const rangeQuery = { dateFrom: query.from, dateTo: query.to };
  const { visible } = selectPeriodTrades(trades, rangeQuery);
  const initialBalance = Number(phase?.initialBalance ?? account.initialCapital);
  const initialDate = (phase?.startDate || phase?.createdAt || account.createdAt).toISOString().slice(0, 10);
  return {
    scope: { accountId: account.id, accountName: account.name, accountType: account.accountType, currency: account.currency, phaseId: phase?.id || null, phaseName: phase?.name || null },
    filters: { from: query.from || null, to: query.to || null, breakdown: groupKeys[query.breakdown] ? query.breakdown : null },
    summary: calculatePerformanceMetrics(visible),
    balanceHistory: filteredBalanceHistory({ trades, initialBalance, initialDate, query: rangeQuery }),
    breakdown: buildPerformanceBreakdown(visible, query.breakdown)
  };
}
