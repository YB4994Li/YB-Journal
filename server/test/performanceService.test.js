import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformanceBreakdown, calculatePerformanceMetrics, getPerformance } from '../src/services/performanceService.js';

const trade = (id, profitLoss, overrides = {}) => ({ id, tradeNumber: id, profitLoss, market: 'XAUUSD', tradeDate: new Date('2026-02-02T00:00:00.000Z'), direction: 'BUY', strategy: null, session: null, timeframe: null, ...overrides });

test('performance formulas exclude break-even from win rate and calculate averages and profit factor', () => {
  const result = calculatePerformanceMetrics([trade(1, 300), trade(2, 100), trade(3, -200), trade(4, 0)]);
  assert.deepEqual({ total: result.totalTrades, wins: result.wins, losses: result.losses, breakEven: result.breakEven }, { total: 4, wins: 2, losses: 1, breakEven: 1 });
  assert.equal(result.winRate, 66.67);
  assert.equal(result.averageWin, 200);
  assert.equal(result.averageLoss, -200);
  assert.equal(result.profitFactor, 2);
  assert.equal(result.bestTrade.profitLoss, 300);
  assert.equal(result.worstTrade.profitLoss, -200);
});

test('zero-loss profit factor is infinity with profit and unavailable without profit', () => {
  assert.equal(calculatePerformanceMetrics([trade(1, 50)]).profitFactor, 'INFINITY');
  assert.equal(calculatePerformanceMetrics([trade(1, 0)]).profitFactor, null);
  assert.equal(calculatePerformanceMetrics([]).profitFactor, null);
});

test('missing strategy, session, and timeframe group under Unassigned', () => {
  for (const breakdown of ['strategy', 'session', 'timeframe']) {
    const [row] = buildPerformanceBreakdown([trade(1, 10)], breakdown);
    assert.equal(row.name, 'Unassigned');
    assert.equal(row.totalTrades, 1);
  }
});

test('markets use normalized symbols and one shared metric formula', () => {
  const rows = buildPerformanceBreakdown([trade(1, 100, { market: 'XAUUSD' }), trade(2, -40, { market: 'xauusd.m' })], 'market');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'XAUUSD');
  assert.equal(rows[0].netProfitLoss, 60);
  assert.equal(rows[0].profitFactor, 2.5);
});

test('weekday grouping uses UTC trade day and includes weekends only when present', () => {
  const rows = buildPerformanceBreakdown([
    trade(1, 10, { tradeDate: new Date('2026-02-02T00:00:00Z') }),
    trade(2, 20, { tradeDate: new Date('2026-02-07T00:00:00Z') })
  ], 'weekday');
  assert.deepEqual(new Set(rows.map((row) => row.name)), new Set(['Monday', 'Saturday']));
  assert.equal(rows.some((row) => row.name === 'Sunday'), false);
});

function dbFor(accountType = 'REAL') {
  const calls = [];
  return { calls, db: {
    account: { findUnique: async () => ({ id: 7, name: 'Primary', accountType, currency: 'USD', initialCapital: 10000, createdAt: new Date('2026-01-01') }) },
    accountPhase: { findFirst: async ({ where }) => where.id === 22 && where.accountId === 7 ? { id: 22, name: 'Evaluation', initialBalance: 5000, createdAt: new Date('2026-01-01'), startDate: null } : null },
    trade: { findMany: async ({ where }) => { calls.push(where); return [trade(1, 100, { tradeDate: new Date('2026-01-01') }), trade(2, -25, { tradeDate: new Date('2026-01-02') })]; } }
  } };
}

test('real account performance stays in real-account scope and applies inclusive dates', async () => {
  const mock = dbFor();
  const result = await getPerformance(7, { from: '2026-01-02', to: '2026-01-02', breakdown: 'market' }, mock.db);
  assert.deepEqual(mock.calls[0], { accountId: 7, phaseId: null });
  assert.equal(result.summary.totalTrades, 1);
  assert.equal(result.summary.netProfitLoss, -25);
  assert.deepEqual(result.balanceHistory.map((point) => point.balance), [10100, 10075]);
});

test('funded performance requires and isolates the selected phase', async () => {
  const missing = dbFor('FUNDED');
  await assert.rejects(() => getPerformance(7, {}, missing.db), /phaseId is required/);
  const mock = dbFor('FUNDED');
  const result = await getPerformance(7, { phaseId: 22 }, mock.db);
  assert.deepEqual(mock.calls[0], { accountId: 7, phaseId: 22 });
  assert.equal(result.scope.phaseName, 'Evaluation');
  assert.equal(result.balanceHistory[0].balance, 5000);
});
