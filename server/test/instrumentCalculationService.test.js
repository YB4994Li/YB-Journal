import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInstrumentRisk } from '../src/services/instrumentCalculationService.js';

const specification = (values) => ({ id: 1, isActive: true, isVerified: true, source: 'Test fixture assumption', ...values });
const calculate = (values) => calculateInstrumentRisk({ accountCurrency: 'USD', lotSize: 1, ...values });

test('calculates XAUUSD and generic tick-value risk', () => {
  const result = calculate({
    normalizedSymbol: 'XAUUSD', entryPrice: 2000, stopLoss: 1999, lotSize: 0.1,
    instrumentSpecification: specification({ assetClass: 'METAL', calculationMode: 'TICK_VALUE', tickSize: 0.01, tickValuePerLot: 1, profitCurrency: 'USD' })
  });
  assert.equal(result.riskAmount, 10);
  assert.equal(result.snapshot.riskCalculationMode, 'TICK_VALUE');
});

test('calculates EURUSD using contract size', () => {
  const result = calculate({
    normalizedSymbol: 'EURUSD', entryPrice: 1.1, stopLoss: 1.099, lotSize: 0.1,
    instrumentSpecification: specification({ assetClass: 'FOREX', calculationMode: 'FOREX_CONVERSION', contractSize: 100000, profitCurrency: 'USD' })
  });
  assert.equal(result.riskAmount, 10);
});

test('calculates USDJPY quote-currency risk using entry-price conversion', () => {
  const result = calculate({
    normalizedSymbol: 'USDJPY', entryPrice: 150, stopLoss: 149.5, lotSize: 0.1,
    instrumentSpecification: specification({ assetClass: 'FOREX', calculationMode: 'FOREX_CONVERSION', contractSize: 100000, profitCurrency: 'JPY' })
  });
  assert.equal(result.riskAmount, 33.33);
});

test('calculates NAS100 and BTCUSD with explicit verified fixtures', () => {
  const nas = calculate({
    normalizedSymbol: 'NAS100', entryPrice: 20000, stopLoss: 19950,
    instrumentSpecification: specification({ assetClass: 'INDEX', calculationMode: 'TICK_VALUE', tickSize: 1, tickValuePerLot: 1, profitCurrency: 'USD' })
  });
  const btc = calculate({
    normalizedSymbol: 'BTCUSD', entryPrice: 70000, stopLoss: 69000, lotSize: 0.1,
    instrumentSpecification: specification({ assetClass: 'CRYPTO', calculationMode: 'CONTRACT_SIZE', contractSize: 1, profitCurrency: 'USD' })
  });
  assert.equal(nas.riskAmount, 50);
  assert.equal(btc.riskAmount, 100);
});

test('applies explicit currency conversion and rejects a missing conversion rate', () => {
  const spec = specification({ assetClass: 'FOREX', calculationMode: 'FOREX_CONVERSION', contractSize: 100000, profitCurrency: 'GBP' });
  assert.equal(calculate({ normalizedSymbol: 'EURGBP', entryPrice: 0.85, stopLoss: 0.849, lotSize: 0.1, conversionRate: 1.25, instrumentSpecification: spec }).riskAmount, 12.5);
  assert.equal(calculate({ normalizedSymbol: 'EURGBP', entryPrice: 0.85, stopLoss: 0.849, lotSize: 0.1, instrumentSpecification: spec }).error, 'MISSING_CONVERSION_RATE');
});

test('returns reason codes for missing data and uncertain specifications', () => {
  assert.equal(calculate({ normalizedSymbol: 'UNKNOWN', entryPrice: 1, stopLoss: 0.9 }).error, 'MISSING_INSTRUMENT_SPECIFICATION');
  const spec = specification({ assetClass: 'FOREX', calculationMode: 'CONTRACT_SIZE', contractSize: 100000, profitCurrency: 'USD' });
  assert.equal(calculate({ normalizedSymbol: 'EURUSD', entryPrice: 1, lotSize: 1, instrumentSpecification: spec }).error, 'MISSING_STOP_LOSS');
});
