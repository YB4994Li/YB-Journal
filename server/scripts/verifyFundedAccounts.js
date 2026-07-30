import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { importRows } from '../src/services/csvService.js';

const prisma = new PrismaClient();
const rollback = new Error('ROLLBACK_VERIFICATION');
const phase = (name, orderIndex, status, phaseType = 'EVALUATION') => ({
  name, orderIndex, status, phaseType, initialBalance: '100000', currentBalance: '100000'
});

try {
  const before = { accounts: await prisma.account.count(), trades: await prisma.trade.count() };
  let checks;
  try {
    await prisma.$transaction(async (tx) => {
      const real = await tx.account.create({ data: { name: '__verify_real__', accountType: 'REAL', currency: 'USD', initialCapital: '10000' } });
      const oneStep = await tx.account.create({ data: { name: '__verify_one__', accountType: 'FUNDED', currency: 'USD', initialCapital: '100000', accountSize: '100000', phases: { create: [phase('Phase 1', 0, 'ACTIVE'), phase('Funded / Live', 1, 'PENDING', 'FUNDED_LIVE')] } }, include: { phases: true } });
      const twoStep = await tx.account.create({ data: { name: '__verify_two__', accountType: 'FUNDED', currency: 'USD', initialCapital: '100000', accountSize: '100000', phases: { create: [phase('Phase 1', 0, 'ACTIVE'), phase('Phase 2', 1, 'PENDING', 'VERIFICATION'), phase('Funded / Live', 2, 'PENDING', 'FUNDED_LIVE')] } }, include: { phases: true } });
      const instant = await tx.account.create({ data: { name: '__verify_instant__', accountType: 'FUNDED', currency: 'USD', initialCapital: '100000', accountSize: '100000', phases: { create: [phase('Funded / Live', 0, 'ACTIVE', 'FUNDED_LIVE')] } }, include: { phases: true } });
      const [first, second] = twoStep.phases.sort((a, b) => a.orderIndex - b.orderIndex);
      const baseTrade = { accountId: twoStep.id, strategyName: 'Verification', market: 'EURUSD', tradeDate: new Date('2026-07-30'), direction: 'BUY', result: 'WIN', profitLoss: '10' };
      await tx.trade.create({ data: { ...baseTrade, phaseId: first.id, tradeNumber: 1 } });
      await tx.trade.create({ data: { ...baseTrade, phaseId: second.id, tradeNumber: 2 } });
      const firstTrades = await tx.trade.count({ where: { accountId: twoStep.id, phaseId: first.id } });
      const secondTrades = await tx.trade.count({ where: { accountId: twoStep.id, phaseId: second.id } });
      assert.equal(real.accountType, 'REAL');
      assert.equal(oneStep.phases.length, 2);
      assert.equal(twoStep.phases.length, 3);
      assert.equal(instant.phases.length, 1);
      assert.equal(instant.phases[0].status, 'ACTIVE');
      assert.deepEqual([firstTrades, secondTrades], [1, 1]);
      checks = { real: true, oneStep: true, twoStep: true, instantFunded: true, independentPhaseJournals: true };
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  const importAccount = await prisma.account.create({ data: {
    name: '__verify_csv__', accountType: 'FUNDED', currency: 'USD', initialCapital: '50000', accountSize: '50000',
    phases: { create: [phase('Funded / Live', 0, 'ACTIVE', 'FUNDED_LIVE')] }
  }, include: { phases: true } });
  try {
    const imported = await importRows(importAccount.id, [{
      strategyName: 'CSV verification', market: 'EURUSD', tradeDate: '2026-07-30', direction: 'BUY',
      result: 'WIN', profitLoss: '25', importSource: 'EXNESS', sourceTradeId: '__verify_ticket__'
    }], {}, importAccount.phases[0].id);
    assert.equal(imported.trades[0].phaseId, importAccount.phases[0].id);
    checks.csvPhaseDestination = true;
  } finally {
    await prisma.account.delete({ where: { id: importAccount.id } });
  }
  const after = { accounts: await prisma.account.count(), trades: await prisma.trade.count() };
  assert.deepEqual(after, before);
  console.log(JSON.stringify({ checks, existingRowsPreserved: before, rollbackConfirmed: true }, null, 2));
} finally {
  await prisma.$disconnect();
}
