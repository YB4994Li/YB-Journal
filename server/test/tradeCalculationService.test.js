import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTradeAnalytics, reconstructRealizedBalances } from '../src/services/tradeCalculationService.js';

test('calculates BUY and SELL planned RR', () => {
  assert.equal(calculateTradeAnalytics({ entryPrice: 100, stopLoss: 95, takeProfit: 110 }).plannedRR, 2);
  assert.equal(calculateTradeAnalytics({ entryPrice: 100, stopLoss: 105, takeProfit: 90 }).plannedRR, 2);
});
test('calculates BUY and SELL realized R including losses and zero P&L movement', () => {
  assert.equal(calculateTradeAnalytics({ direction:'BUY', entryPrice:100, stopLoss:95, exitPrice:110 }).realizedRMultiple, 2);
  assert.equal(calculateTradeAnalytics({ direction:'SELL', entryPrice:100, stopLoss:105, exitPrice:90 }).realizedRMultiple, 2);
  assert.equal(calculateTradeAnalytics({ direction:'BUY', entryPrice:100, stopLoss:95, exitPrice:97.5 }).realizedRMultiple, -0.5);
  assert.equal(calculateTradeAnalytics({ direction:'SELL', entryPrice:100, stopLoss:105, exitPrice:100 }).realizedRMultiple, 0);
});
test('returns null for missing SL, missing TP, equal entry/SL, and invalid SL side', () => {
  assert.equal(calculateTradeAnalytics({ entryPrice:100, takeProfit:110 }).plannedRR, null);
  assert.equal(calculateTradeAnalytics({ entryPrice:100, stopLoss:95 }).plannedRR, null);
  assert.equal(calculateTradeAnalytics({ entryPrice:100, stopLoss:100, takeProfit:110 }).plannedRR, null);
  assert.equal(calculateTradeAnalytics({ direction:'BUY', entryPrice:100, stopLoss:105, exitPrice:110 }).realizedRMultiple, null);
});
test('does not default unavailable risk percentage to zero', () => {
  const result = calculateTradeAnalytics({ market:'UNKNOWN', entryPrice:100, stopLoss:95, lotSize:1 });
  assert.equal(result.riskAmount, null);
  assert.equal(result.riskPercentage, null);
});
test('calculates direct risk percentage', () => {
  assert.equal(calculateTradeAnalytics({ riskAmount:200, balanceBeforeTrade:10000 }).riskPercentage, 2);
});
test('reconstructs realized balances chronologically by close time', () => {
  const result = reconstructRealizedBalances([
    { id:2, closeTimeUtc:'2026-01-02T12:00:00Z', profitLoss:-50 },
    { id:1, closeTimeUtc:'2026-01-01T12:00:00Z', profitLoss:100 }
  ], 1000);
  assert.deepEqual(result.map(({trade,balanceBeforeTrade})=>[trade.id,balanceBeforeTrade]), [[1,1000],[2,1100]]);
});
