import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Performance Center has an empty state and updates filters through state and API requests without reload', async () => {
  const source = await readFile(new URL('../../client/src/pages/PerformanceCenter.jsx', import.meta.url), 'utf8');
  assert.match(source, /No realized trades in this period/);
  assert.match(source, /setFrom\(value\)/);
  assert.match(source, /setTo\(value\)/);
  assert.match(source, /api\.get\(`\/accounts\/\$\{accountId\}\/performance`/);
  assert.doesNotMatch(source, /window\.location\.reload|location\.reload/);
});
