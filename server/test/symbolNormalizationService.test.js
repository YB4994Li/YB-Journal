import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSymbol } from '../src/services/symbolNormalizationService.js';

test('normalizes broker suffixes, separators, and explicit aliases', () => {
  const cases = {
    XAUUSDm: 'XAUUSD',
    'XAUUSD.pro': 'XAUUSD',
    GOLD: 'XAUUSD',
    GOLDm: 'XAUUSD',
    USTEC: 'NAS100',
    US100m: 'NAS100',
    NASDAQ100: 'NAS100',
    US500: 'SPX500',
    'S&P500': 'SPX500',
    DJIA: 'US30',
    WALLSTREET30: 'US30',
    'BTC/USD': 'BTCUSD',
    BTCUSDm: 'BTCUSD',
    'EUR/USD': 'EURUSD',
    'EURUSD.pro': 'EURUSD'
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(normalizeSymbol(input), expected);
});

test('does not blindly remove meaningful terminal characters', () => {
  assert.equal(normalizeSymbol('CUSTOM'), 'CUSTOM');
});
