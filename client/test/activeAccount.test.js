import test from 'node:test';
import assert from 'node:assert/strict';
import { accessiblePhase, accountScopeSearch, scopedModuleUrl } from '../src/utils/activeAccount.js';

test('opening a real account has no active phase', () => {
  assert.equal(accessiblePhase({ id: 1, accountType: 'REAL', phases: [] }), null);
  assert.equal(scopedModuleUrl('/journal', 1, null), '/journal?accountId=1');
});

test('funded account selects its active phase', () => {
  const phase = accessiblePhase({ accountType: 'FUNDED', phases: [{ id: 4, status: 'LOCKED' }, { id: 5, status: 'ACTIVE' }] });
  assert.equal(phase.id, 5);
});

test('funded fallback selects latest accessible phase and never a locked phase', () => {
  const phase = accessiblePhase({ accountType: 'FUNDED', phases: [{ id: 4, status: 'PASSED' }, { id: 5, status: 'FAILED' }, { id: 6, status: 'LOCKED' }] });
  assert.equal(phase.id, 5);
});

test('module navigation preserves account and phase scope', () => {
  for (const path of ['/journal', '/performance', '/calendar', '/daily-notes']) assert.equal(scopedModuleUrl(path, 7, 22), `${path}?accountId=7&phaseId=22`);
});

test('missing account produces no fabricated query scope', () => {
  assert.equal(accountScopeSearch(null, null), '');
  assert.equal(scopedModuleUrl('/performance', null, null), '/performance');
});
