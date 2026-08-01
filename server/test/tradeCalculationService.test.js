import test from 'node:test';
import assert from 'node:assert/strict';
import {
  breakEvenThresholdAmount,
  manualTradeAnalytics,
  classifyTradeResult,
  reconstructRealizedBalances
} from '../src/services/tradeCalculationService.js';

const context = { initialCapital: 10000, breakEvenThresholdPercent: 0.05 };

test('$10,000 at 0.05% produces a $5 break-even threshold', () => {
  assert.equal(breakEvenThresholdAmount(10000, 0.05), 5);
});

test('break-even classification uses inclusive boundaries', () => {
  assert.equal(classifyTradeResult(5, 10000, 0.05), 'BREAK_EVEN');
  assert.equal(classifyTradeResult(-5, 10000, 0.05), 'BREAK_EVEN');
  assert.equal(classifyTradeResult(5.01, 10000, 0.05), 'WIN');
  assert.equal(classifyTradeResult(-5.01, 10000, 0.05), 'LOSS');
});

test('manual result override remains unchanged', () => {
  const result = manualTradeAnalytics({ profitLoss: 100, result: 'LOSS', resultSource: 'MANUAL' }, context);
  assert.equal(result.result, 'LOSS');
  assert.equal(result.resultSource, 'MANUAL');
});

test('automatic risk, RR, and Realized R calculations stay disabled', () => {
  const result = manualTradeAnalytics({ market: 'XAUUSD', entryPrice: 2000, stopLoss: 1995, takeProfit: 2010, lotSize: 1, profitLoss: 10 }, context);
  assert.equal(result.plannedRR, null);
  assert.equal(result.riskAmount, null);
  assert.equal(result.riskPercentage, null);
  assert.equal(result.realizedRMultiple, null);
});

test('explicit manual risk is preserved without deriving other values', () => {
  const result = manualTradeAnalytics({ riskAmount: 200, manualRiskProvided: true, profitLoss: 100 }, context);
  assert.equal(result.riskAmount, 200);
  assert.equal(result.riskPercentage, null);
  assert.equal(result.realizedRMultiple, null);
  assert.equal(result.riskCalculationStatus, 'MANUAL');
});

test('reconstructs realized balances chronologically by close time', () => {
  const result = reconstructRealizedBalances([
    { id: 2, closeTimeUtc: '2026-01-02T12:00:00Z', profitLoss: -50 },
    { id: 1, closeTimeUtc: '2026-01-01T12:00:00Z', profitLoss: 100 }
  ], 1000);
  assert.deepEqual(result.map(({ trade, balanceBeforeTrade }) => [trade.id, balanceBeforeTrade]), [[1, 1000], [2, 1100]]);
});

test('balance history uses timestamp fallbacks and stable tie ordering', () => {
  const result = reconstructRealizedBalances([
    { id: 3, tradeDate: '2026-01-03', createdAt: '2026-01-01T00:00:03Z', profitLoss: 30 },
    { id: 2, openTimeUtc: '2026-01-02T10:00:00Z', createdAt: '2026-01-01T00:00:02Z', profitLoss: 20 },
    { id: 1, openTimeUtc: '2026-01-02T10:00:00Z', createdAt: '2026-01-01T00:00:01Z', profitLoss: 10 }
  ], 1000);
  assert.deepEqual(result.map(({ trade, balanceBeforeTrade, balanceAfterTrade }) => [trade.id, balanceBeforeTrade, balanceAfterTrade]), [
    [1, 1000, 1010], [2, 1010, 1030], [3, 1030, 1060]
  ]);
});

test('net realized P&L is preferred when supplied', () => {
  const [item] = reconstructRealizedBalances([{ id: 1, netProfitLoss: 95, profitLoss: 100 }], 1000);
  assert.equal(item.balanceAfterTrade, 1095);
});

test('funded phase histories remain isolated when reconstructed separately', () => {
  const phaseOne = reconstructRealizedBalances([{ id: 1, profitLoss: 100 }], 10000);
  const phaseTwo = reconstructRealizedBalances([{ id: 2, profitLoss: -50 }], 5000);
  assert.equal(phaseOne[0].balanceBeforeTrade, 10000);
  assert.equal(phaseTwo[0].balanceBeforeTrade, 5000);
});
