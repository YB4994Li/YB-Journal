import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteAccountWithJournal } from '../src/services/accountDeletionService.js';

function database(trades = []) {
  const calls = [];
  const tx = {
    account: { findUnique: async () => ({ id: 7 }), delete: async ({ where }) => calls.push(['account', where.id]) },
    trade: { findMany: async () => trades, deleteMany: async ({ where }) => calls.push(['trades', where.accountId]) },
    accountPhase: { deleteMany: async ({ where }) => calls.push(['phases', where.accountId]) }
  };
  return { calls, db: { $transaction: async (operation) => operation(tx) } };
}

test('deletes a real account and its account-owned journal rows in one transaction', async () => {
  const { db, calls } = database([{ screenshotPath: 'trade.png' }]);
  const result = await deleteAccountWithJournal(db, 7);
  assert.deepEqual(calls, [['trades', 7], ['phases', 7], ['account', 7]]);
  assert.deepEqual(result.screenshots, ['trade.png']);
});

test('deletes funded phases before deleting the funded account', async () => {
  const { db, calls } = database();
  await deleteAccountWithJournal(db, 7);
  assert.ok(calls.findIndex(([name]) => name === 'phases') < calls.findIndex(([name]) => name === 'account'));
});

test('propagates a foreign-key failure so the transaction cannot report false success', async () => {
  const failure = Object.assign(new Error('constraint'), { code: 'P2003' });
  const { db } = database();
  db.$transaction = async (operation) => operation({
    account: { findUnique: async () => ({ id: 7 }), delete: async () => { throw failure; } },
    trade: { findMany: async () => [], deleteMany: async () => {} },
    accountPhase: { deleteMany: async () => {} }
  });
  await assert.rejects(() => deleteAccountWithJournal(db, 7), (error) => error === failure);
});
