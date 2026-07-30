import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalStrategy, normalizeStrategyKey, normalizeTimeframe, similarStrategy } from '../src/utils/tradingLibrary.js';
test('autocomplete reuses canonical strategy keys',()=>{assert.equal(normalizeStrategyKey(' PULLBACK '),normalizeStrategyKey('Pullback'));assert.equal(canonicalStrategy('pullback'),'Pullback');});
test('similar strategy produces a warning only',()=>{assert.equal(similarStrategy('Pulback',[{value:'Pullback'}]).value,'Pullback');assert.equal(canonicalStrategy('Pulback'),'Pulback');});
test('timeframe input normalization',()=>{assert.equal(normalizeTimeframe('5 minutes'),'M5');assert.equal(normalizeTimeframe('1h'),'H1');assert.equal(normalizeTimeframe('range  12'),'RANGE 12');});
