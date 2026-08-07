import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { reconstructRealizedBalances } from './tradeCalculationService.js';
import { calculateProfitFactor } from '../utils/profitFactor.js';

const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
const dayStart = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`) : null;
const dayEnd = (value) => value ? new Date(`${String(value).slice(0, 10)}T23:59:59.999Z`) : null;
const tradeDay = (trade) => new Date(trade.tradeDate).getTime();

export function selectPeriodTrades(trades, query = {}) {
  const from = dayStart(query.startDate || query.dateFrom), to = dayEnd(query.endDate || query.dateTo);
  const before = from ? trades.filter((trade) => tradeDay(trade) < from.getTime()) : [];
  const visible = trades.filter((trade) => (!from || tradeDay(trade) >= from.getTime()) && (!to || tradeDay(trade) <= to.getTime()));
  return { before, visible, from, to };
}

export function filteredBalanceHistory({ trades, initialBalance, initialDate, query = {} }) {
  const { before, visible, from } = selectPeriodTrades(trades, query);
  const openingBalance = round(initialBalance + before.reduce((sum, trade) => sum + Number(trade.netProfitLoss ?? trade.profitLoss ?? 0), 0));
  const filtered = Boolean(query.startDate || query.dateFrom || query.endDate || query.dateTo);
  return [
    { label: filtered ? 'Opening Balance' : 'Initial Balance', date: from ? from.toISOString().slice(0, 10) : initialDate, tradeNumber: null, profitLoss: 0, balance: openingBalance },
    ...reconstructRealizedBalances(visible, openingBalance).map(({ trade, netProfitLoss, balanceAfterTrade }) => ({
      label: `Trade #${trade.tradeNumber}`,
      date: new Date(trade.closeTimeUtc || trade.openTimeUtc || trade.tradeDate).toISOString().slice(0, 10),
      tradeNumber: trade.tradeNumber,
      profitLoss: netProfitLoss,
      balance: balanceAfterTrade
    }))
  ];
}

async function context(accountId, phaseId, includeTrades, db = prisma) {
  const account = await db.account.findUnique({ where: { id: accountId } });
  if (!account) throw new ApiError(404, 'Account not found');
  let phase = null;
  if (phaseId != null) {
    phase = await db.accountPhase.findFirst({ where: { id: phaseId, accountId } });
    if (!phase) throw new ApiError(404, 'Phase not found for this account');
  } else if (account.accountType === 'FUNDED') {
    throw new ApiError(422, 'phaseId is required for funded account performance');
  }
  const trades = includeTrades ? await db.trade.findMany({
    where: { accountId, ...(phase ? { phaseId: phase.id } : { phaseId: null }) }
  }) : [];
  return { account, phase, trades, initialBalance: Number(phase?.initialBalance ?? account.initialCapital) };
}

export async function syncPhaseBalance(phaseId, db = prisma) {
  if (!phaseId) return;
  const phase = await db.accountPhase.findUnique({ where: { id: phaseId }, select: { initialBalance: true } });
  if (!phase) return;
  const pnl = await db.trade.aggregate({ where: { phaseId }, _sum: { profitLoss: true } });
  await db.accountPhase.update({ where: { id: phaseId }, data: { currentBalance: String(Number(phase.initialBalance) + Number(pnl._sum.profitLoss || 0)) } });
}

export async function getStatistics(accountId, phaseId = null, query = {}, db = prisma) {
  const { initialBalance, trades } = await context(accountId, phaseId, true, db);
  const { before, visible } = selectPeriodTrades(trades, query);
  const openingBalance = initialBalance + before.reduce((sum, trade) => sum + Number(trade.netProfitLoss ?? trade.profitLoss ?? 0), 0);
  const pnl = visible.map((trade) => Number(trade.netProfitLoss ?? trade.profitLoss ?? 0));
  const net = pnl.reduce((sum, value) => sum + value, 0);
  const wins = visible.filter((trade) => trade.result === 'WIN').length;
  const losses = visible.filter((trade) => trade.result === 'LOSS').length;
  const breakEven = visible.filter((trade) => trade.result === 'BREAK_EVEN').length;
  const grossProfit = pnl.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
  const grossLoss = Math.abs(pnl.filter((value) => value < 0).reduce((sum, value) => sum + value, 0));
  const ordered = [...visible].sort((a, b) => Number(a.profitLoss) - Number(b.profitLoss));
  const summarize = (trade) => trade ? { id: trade.id, tradeNumber: trade.tradeNumber, profitLoss: Number(trade.profitLoss) } : null;
  return {
    initialCapital: round(openingBalance), currentBalance: round(openingBalance + net), netProfitLoss: round(net),
    totalTrades: visible.length, winningTrades: wins, losingTrades: losses, breakEvenTrades: breakEven,
    winRate: wins + losses ? round((wins / (wins + losses)) * 100) : 0,
    profitFactor: calculateProfitFactor(grossProfit, grossLoss),
    expectancy: visible.length ? round(net / visible.length, 2) : null,
    bestTrade: summarize(ordered.at(-1)), worstTrade: summarize(ordered[0])
  };
}

export async function getBalanceHistory(accountId, phaseId = null, query = {}, db = prisma) {
  const { account, phase, trades, initialBalance } = await context(accountId, phaseId, true, db);
  const initialDate = (phase?.startDate || phase?.createdAt || account.createdAt).toISOString().slice(0, 10);
  return filteredBalanceHistory({ trades, initialBalance, initialDate, query });
}
