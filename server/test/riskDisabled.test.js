import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { serializeTrade } from '../src/services/tradeService.js';

test('stale automatic risk analytics are hidden from journal responses', () => {
  const trade = serializeTrade({
    profitLoss: 25,
    plannedRR: 4,
    realizedRMultiple: 125,
    riskAmount: 0.2,
    riskPercentage: 0.2,
    riskCalculationStatus: 'CALCULATED'
  });
  assert.equal(trade.plannedRR, null);
  assert.equal(trade.realizedRMultiple, null);
  assert.equal(trade.riskAmount, null);
  assert.equal(trade.riskPercentage, null);
});

test('explicit manual risk fields remain available', () => {
  const trade = serializeTrade({
    profitLoss: 25,
    riskAmount: 50,
    plannedRROverride: 2,
    riskPercentageOverride: 1,
    riskCalculationStatus: 'MANUAL'
  });
  assert.equal(trade.riskAmount, 50);
  assert.equal(trade.plannedRROverride, 2);
  assert.equal(trade.riskPercentageOverride, 1);
});

test('statistics response does not aggregate Average R', async () => {
  const source = await readFile(new URL('../src/services/statisticsService.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /averageRealizedR|averageResultR|averagePlannedRR/);
});

test('journal UI renders unavailable risk analytics as a dash', async () => {
  const source = await readFile(new URL('../../client/src/components/trade/TradeTable.jsx', import.meta.url), 'utf8');
  assert.match(source, /riskAmount == null \? '—'/);
  assert.match(source, /riskPercentageOverride == null \? '—'/);
  assert.match(source, /realizedRMultiple'\) return '—'/);
});
