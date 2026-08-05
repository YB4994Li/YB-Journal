import test from 'node:test';
import assert from 'node:assert/strict';
import { filteredBalanceHistory, getBalanceHistory, getStatistics } from '../src/services/statisticsService.js';

const trade = (id, date, profitLoss, extra = {}) => ({ id, tradeNumber: id, tradeDate: new Date(`${date}T00:00:00.000Z`), createdAt: new Date(`${date}T12:00:00.000Z`), profitLoss, result: profitLoss > 0 ? 'WIN' : profitLoss < 0 ? 'LOSS' : 'BREAK_EVEN', ...extra });
const trades = [trade(1, '2026-01-01', 300), trade(2, '2026-01-02', -100), trade(3, '2026-01-03', -50), trade(4, '2026-01-04', 120)];

test('full history with no date filter starts at initial capital', () => {
  assert.deepEqual(filteredBalanceHistory({ trades, initialBalance: 10000, initialDate: '2025-12-31' }).map((point) => point.balance), [10000, 10300, 10200, 10150, 10270]);
});

test('selected range starts with cumulative balance before From and reconstructs visible trades', () => {
  const history = filteredBalanceHistory({ trades, initialBalance: 10000, initialDate: '2025-12-31', query: { startDate: '2026-01-03', endDate: '2026-01-04' } });
  assert.deepEqual(history.map((point) => point.balance), [10200, 10150, 10270]);
  assert.equal(history[0].label, 'Opening Balance');
});

test('From and To calendar-day boundaries are inclusive', () => {
  const from = filteredBalanceHistory({ trades, initialBalance: 10000, initialDate: '2025-12-31', query: { startDate: '2026-01-03', endDate: '2026-01-03' } });
  assert.deepEqual(from.map((point) => point.tradeNumber), [null, 3]);
  const late = [trade(5, '2026-01-04', 10, { closeTimeUtc: new Date('2026-01-04T23:59:59.999Z') })];
  assert.equal(filteredBalanceHistory({ trades: late, initialBalance: 10000, initialDate: '2026-01-01', query: { endDate: '2026-01-04' } }).length, 2);
});

test('empty selected range contains only its correctly calculated opening balance', () => {
  const history = filteredBalanceHistory({ trades, initialBalance: 10000, initialDate: '2025-12-31', query: { startDate: '2026-01-10', endDate: '2026-01-11' } });
  assert.deepEqual(history.map((point) => point.balance), [10270]);
});

test('clearing dates restores full history', () => {
  const filtered = filteredBalanceHistory({ trades, initialBalance: 10000, initialDate: '2025-12-31', query: { startDate: '2026-01-03' } });
  const cleared = filteredBalanceHistory({ trades, initialBalance: 10000, initialDate: '2025-12-31', query: { startDate: '', endDate: '' } });
  assert.equal(filtered.length, 3);
  assert.equal(cleared.length, 5);
  assert.equal(cleared[0].balance, 10000);
});

function fundedDb() {
  const where = [];
  return { where, db: {
    account: { findUnique: async () => ({ id: 8, accountType: 'FUNDED', initialCapital: 50000, createdAt: new Date('2026-01-01') }) },
    accountPhase: { findFirst: async ({ where: phaseWhere }) => phaseWhere.id === 22 && phaseWhere.accountId === 8 ? { id: 22, initialBalance: 10000, createdAt: new Date('2026-01-01') } : null },
    trade: { findMany: async ({ where: tradeWhere }) => { where.push(tradeWhere); return [trade(1, '2026-01-03', 100)]; } }
  } };
}

test('funded histories and statistics remain isolated to the selected account phase', async () => {
  const historyDb = fundedDb(), statsDb = fundedDb();
  await getBalanceHistory(8, 22, { startDate: '2026-01-03' }, historyDb.db);
  await getStatistics(8, 22, { startDate: '2026-01-03' }, statsDb.db);
  assert.deepEqual(historyDb.where[0], { accountId: 8, phaseId: 22 });
  assert.deepEqual(statsDb.where[0], { accountId: 8, phaseId: 22 });
});

test('statistics use the same inclusive date range as balance history', async () => {
  const db = {
    account: { findUnique: async () => ({ id: 1, accountType: 'REAL', initialCapital: 10000, createdAt: new Date('2025-12-31') }) },
    accountPhase: { findFirst: async () => null },
    trade: { findMany: async () => trades }
  };
  const stats = await getStatistics(1, null, { startDate: '2026-01-03', endDate: '2026-01-04' }, db);
  assert.equal(stats.initialCapital, 10200);
  assert.equal(stats.currentBalance, 10270);
  assert.equal(stats.netProfitLoss, 70);
  assert.equal(stats.totalTrades, 2);
});

test('Dashboard propagates the same dates to statistics, balance history, markets, and trades', async () => {
  const { readFile } = await import('node:fs/promises');
  const dashboard = await readFile(new URL('../../client/src/pages/Dashboard.jsx', import.meta.url), 'utf8');
  const markets = await readFile(new URL('../../client/src/components/chart/MarketsTradedChart.jsx', import.meta.url), 'utf8');
  assert.match(dashboard, /statistics`,\{params\}/);
  assert.match(dashboard, /balance-history`,\{params\}/);
  assert.match(dashboard, /startDate:currentFilters\.startDate/);
  assert.match(dashboard, /loadTrades\(accountId,filters,phaseId\)/);
  assert.match(markets, /dateFrom:filters\.startDate/);
  assert.match(markets, /dateTo:filters\.endDate/);
});
