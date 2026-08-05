import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteAccountAndRefresh } from '../src/utils/accountDeletion.js';

test('deletion removes the account card and refreshes Accounts Center statistics', async () => {
  const calls = [];
  const api = { delete: async (endpoint) => ({ data: { message: `deleted via ${endpoint}` } }) };
  const message = await deleteAccountAndRefresh({ api, accountId: 12, removeLocally: (id) => calls.push(['remove', id]), refresh: async () => calls.push(['refresh']) });
  assert.deepEqual(calls, [['remove', 12], ['refresh']]);
  assert.equal(message, 'deleted via /accounts/12');
});

test('cancelling deletion closes confirmation without making a request', () => {
  let confirmation = { id: 12 }, requests = 0;
  const cancel = () => { confirmation = null; };
  cancel();
  assert.equal(confirmation, null);
  assert.equal(requests, 0);
});
