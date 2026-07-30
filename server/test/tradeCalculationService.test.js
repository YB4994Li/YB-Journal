import test from 'node:test';
import assert from 'node:assert/strict';
import {
  breakEvenThresholdAmount,
  calculateTradeAnalytics,
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
  const result = calculateTradeAnalytics({ profitLoss: 100, result: 'LOSS', resultSource: 'MANUAL' }, context);
  assert.equal(result.result, 'LOSS');
  assert.equal(result.resultSource, 'MANUAL');
});

test('calculates BUY and SELL planned RR', () => {
  assert.equal(calculateTradeAnalytics({ direction: 'BUY', entryPrice: 100, stopLoss: 95, takeProfit: 110 }, context).plannedRR, 2);
  assert.equal(calculateTradeAnalytics({ direction: 'SELL', entryPrice: 100, stopLoss: 105, takeProfit: 90 }, context).plannedRR, 2);
});

test('calculates realized R from broker P&L divided by reliable risk amount', () => {
  assert.equal(calculateTradeAnalytics({ profitLoss: 150, riskAmount: 100 }, context).realizedRMultiple, 1.5);
  assert.equal(calculateTradeAnalytics({ profitLoss: -50, riskAmount: 100 }, context).realizedRMultiple, -0.5);
});

test('missing instrument metadata returns null risk values', () => {
  const result = calculateTradeAnalytics({ market: 'XAUUSD', entryPrice: 2000, stopLoss: 1995, lotSize: 1, profitLoss: 10 }, context);
  assert.equal(result.riskAmount, null);
  assert.equal(result.riskPercentage, null);
  assert.equal(result.realizedRMultiple, null);
});

test('calculates risk percentage from balance before trade', () => {
  assert.equal(calculateTradeAnalytics({ riskAmount: 200, balanceBeforeTrade: 8000 }, context).riskPercentage, 2.5);
});

test('reconstructs realized balances chronologically by close time', () => {
  const result = reconstructRealizedBalances([
    { id: 2, closeTimeUtc: '2026-01-02T12:00:00Z', profitLoss: -50 },
    { id: 1, closeTimeUtc: '2026-01-01T12:00:00Z', profitLoss: 100 }
  ], 1000);
  assert.deepEqual(result.map(({ trade, balanceBeforeTrade }) => [trade.id, balanceBeforeTrade]), [[1, 1000], [2, 1100]]);
});
