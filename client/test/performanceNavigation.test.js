import test from 'node:test';
import assert from 'node:assert/strict';
import { journalDrillDownUrl, journalFiltersFromSearch, performanceQuery } from '../src/utils/performanceNavigation.js';

test('performance tabs and filters persist in query parameters', () => {
  assert.equal(performanceQuery({ tab: 'markets', accountId: 7, phaseId: 22, from: '2026-01-01', to: '2026-01-31' }), 'tab=markets&accountId=7&phaseId=22&from=2026-01-01&to=2026-01-31');
});

test('drill-down preserves scope and dates with the matching journal filter', () => {
  const url = journalDrillDownUrl({ accountId: 7, phaseId: 22, from: '2026-01-01', to: '2026-01-31', journalFilter: { strategyId: 9 } });
  assert.equal(url, '/journal?accountId=7&phaseId=22&from=2026-01-01&to=2026-01-31&strategyId=9');
  assert.deepEqual(journalFiltersFromSearch(url.split('?')[1], 25), { page: 1, limit: 25, search: '', market: '', strategy: '', strategyId: '9', session: '', timeframe: '', direction: '', weekday: '', result: '', startDate: '2026-01-01', endDate: '2026-01-31', sortBy: 'tradeDate', sortOrder: 'desc' });
});

test('market, session, timeframe, direction, and weekday drill-down parameters are retained', () => {
  for (const [key, value] of [['market', 'XAUUSD'], ['session', 'ASIA'], ['timeframe', 'H1'], ['direction', 'BUY'], ['weekday', 1]]) {
    assert.match(journalDrillDownUrl({ accountId: 1, journalFilter: { [key]: value } }), new RegExp(`${key}=${value}`));
  }
});

test('cleared performance dates produce a full-history query', () => {
  assert.equal(performanceQuery({ tab: 'overview', accountId: 7, from: '', to: '' }), 'accountId=7');
});
