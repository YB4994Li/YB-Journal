import test from 'node:test';
import assert from 'node:assert/strict';
import { instrumentSeedData, seedInstrumentSpecifications } from '../prisma/instrumentSeedData.js';

test('instrument seed contains approximately 50 unique requested markets', () => {
  assert.equal(instrumentSeedData.length, 49);
  assert.equal(new Set(instrumentSeedData.map((item) => item.normalizedSymbol)).size, 49);
  for (const symbol of ['XAUUSD','XAGUSD','EURUSD','USDJPY','NAS100','BTCUSD','USOIL']) {
    assert.ok(instrumentSeedData.some((item) => item.normalizedSymbol === symbol));
  }
});

test('instrument seed is idempotent through normalized-symbol upserts', async () => {
  const keys = [];
  const db = { instrumentSpecification: { upsert: async ({ where }) => keys.push(where.normalizedSymbol) } };
  await seedInstrumentSpecifications(db);
  await seedInstrumentSpecifications(db);
  assert.equal(keys.length, instrumentSeedData.length * 2);
  assert.equal(new Set(keys).size, instrumentSeedData.length);
});
