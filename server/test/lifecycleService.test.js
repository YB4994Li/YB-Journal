import test from 'node:test';
import assert from 'node:assert/strict';
import { determinePhaseSequence, realizedLifecycle } from '../src/services/lifecycleService.js';

test('funded target uses an exact inclusive realized-balance boundary',()=>{
  assert.equal(realizedLifecycle(10000,10799.99,8,8).eligibleToPass,false);
  assert.equal(realizedLifecycle(10000,10800,8,8).eligibleToPass,true);
  assert.equal(realizedLifecycle(10000,10801,8,8).eligibleToPass,true);
});

test('maximum loss fails at its exact boundary',()=>{
  const state=realizedLifecycle(10000,9200,8,8);
  assert.equal(state.failureBalance,9200);
  assert.equal(state.lossLimitReached,true);
});

test('real account maximum loss is optional',()=>{
  const state=realizedLifecycle(100,1,null,null);
  assert.equal(state.failureBalance,null);
  assert.equal(state.lossLimitReached,false);
});

test('exact target passes and automatically activates only the next phase',()=>{const result=determinePhaseSequence([{id:1,eligibleToPass:true,lossLimitReached:false,status:'ACTIVE'},{id:2,eligibleToPass:false,lossLimitReached:false,status:'LOCKED'},{id:3,eligibleToPass:false,lossLimitReached:false,status:'LOCKED'}]);assert.deepEqual(result.map((item)=>item.status),['PASSED','ACTIVE','LOCKED']);});
test('failure keeps every later phase locked',()=>{const result=determinePhaseSequence([{eligibleToPass:false,lossLimitReached:true,status:'ACTIVE'},{eligibleToPass:false,lossLimitReached:false,status:'LOCKED'}]);assert.deepEqual(result.map((item)=>item.status),['FAILED','LOCKED']);});
test('exceeded target passes and exceeded loss fails at inclusive boundaries',()=>{assert.equal(determinePhaseSequence([{eligibleToPass:true,lossLimitReached:false,status:'ACTIVE'}])[0].status,'PASSED');assert.equal(determinePhaseSequence([{eligibleToPass:false,lossLimitReached:true,status:'ACTIVE'}])[0].status,'FAILED');});
