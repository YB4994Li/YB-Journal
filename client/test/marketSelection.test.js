import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleMarketSelection } from '../src/utils/marketSelection.js';

test('chart click applies a market filter', () => {
  assert.equal(toggleMarketSelection('', 'XAUUSD'), 'XAUUSD');
});

test('clicking the selected market clears the filter', () => {
  assert.equal(toggleMarketSelection('XAUUSD', 'XAUUSD'), '');
});
