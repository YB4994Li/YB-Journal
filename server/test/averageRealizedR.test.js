import test from 'node:test';
import assert from 'node:assert/strict';
import { averageRealizedRMetrics } from '../src/services/statisticsService.js';

test('average realized R excludes null values and reports included trades', () => {
  assert.deepEqual(averageRealizedRMetrics([
    { realizedRMultiple: 2 },
    { realizedRMultiple: null },
    { realizedRMultiple: -1 },
    { realizedRMultiple: 0 }
  ]), { averageRealizedR: 0.3333, tradeCount: 3 });
});
