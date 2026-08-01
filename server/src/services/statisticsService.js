import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { reconstructRealizedBalances } from './tradeCalculationService.js';

const round = (value, digits = 2) => Number(Number(value).toFixed(digits));
async function context(accountId, phaseId, includeTrades) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new ApiError(404, 'Account not found');
  let phase = null;
  if (phaseId != null) {
    phase = await prisma.accountPhase.findFirst({ where: { id: phaseId, accountId } });
    if (!phase) throw new ApiError(404, 'Phase not found for this account');
  } else if (account.accountType === 'FUNDED') {
    throw new ApiError(422, 'phaseId is required for funded account performance');
  }
  const trades = includeTrades ? await prisma.trade.findMany({
    where: { accountId, ...(phase ? { phaseId: phase.id } : { phaseId: null }) },
    orderBy: [{ tradeDate: 'asc' }, { createdAt: 'asc' }, { tradeNumber: 'asc' }]
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
export async function getStatistics(accountId, phaseId = null) {
  const { initialBalance, trades } = await context(accountId, phaseId, true);
  const pnl = trades.map((trade) => Number(trade.profitLoss));
  const net = pnl.reduce((sum, value) => sum + value, 0);
  const wins = trades.filter((trade) => trade.result === 'WIN').length;
  const losses = trades.filter((trade) => trade.result === 'LOSS').length;
  const breakEven = trades.filter((trade) => trade.result === 'BREAK_EVEN').length;
  const grossProfit=pnl.filter((value)=>value>0).reduce((sum,value)=>sum+value,0);
  const grossLoss=Math.abs(pnl.filter((value)=>value<0).reduce((sum,value)=>sum+value,0));
  const ordered = [...trades].sort((a, b) => Number(a.profitLoss) - Number(b.profitLoss));
  const summarize = (trade) => trade ? { id: trade.id, tradeNumber: trade.tradeNumber, profitLoss: Number(trade.profitLoss) } : null;
  return {
    initialCapital: initialBalance, currentBalance: round(initialBalance + net), netProfitLoss: round(net),
    totalTrades: trades.length, winningTrades: wins, losingTrades: losses, breakEvenTrades: breakEven,
    winRate: wins + losses ? round((wins / (wins + losses)) * 100) : 0,
    profitFactor: grossLoss ? round(grossProfit / grossLoss, 4) : null,
    expectancy:trades.length?round(net/trades.length,2):null,
    bestTrade: summarize(ordered.at(-1)), worstTrade: summarize(ordered[0])
  };
}
export async function getBalanceHistory(accountId, phaseId = null) {
  const { account, phase, trades, initialBalance } = await context(accountId, phaseId, true);
  const initialDate = (phase?.startDate || phase?.createdAt || account.createdAt).toISOString().slice(0, 10);
  return [
    { label: 'Initial Balance', date: initialDate, tradeNumber: null, profitLoss: 0, balance: round(initialBalance) },
    ...reconstructRealizedBalances(trades, initialBalance).map(({ trade, netProfitLoss, balanceAfterTrade }) => ({
      label: `Trade #${trade.tradeNumber}`,
      date: (trade.closeTimeUtc || trade.openTimeUtc || trade.tradeDate).toISOString().slice(0, 10),
      tradeNumber: trade.tradeNumber,
      profitLoss: netProfitLoss,
      balance: balanceAfterTrade
    }))
  ];
}
