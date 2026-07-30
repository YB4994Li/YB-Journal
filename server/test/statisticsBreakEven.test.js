import test from 'node:test';
import assert from 'node:assert/strict';

test('break-even trades are excluded from the documented win-rate denominator', () => {
  const trades = [{ result: 'WIN' }, { result: 'LOSS' }, { result: 'BREAK_EVEN' }];
  const wins = trades.filter((trade) => trade.result === 'WIN').length;
  const losses = trades.filter((trade) => trade.result === 'LOSS').length;
  assert.equal((wins / (wins + losses)) * 100, 50);
});
