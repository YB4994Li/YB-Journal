import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalStrategyName, ensureStrategy, mergeStrategies, normalizeStrategyKey, normalizeTimeframe, similarStrategy } from '../src/services/tradingLibraryService.js';

test('strategy normalization prevents case and whitespace duplicates', async()=>{
  assert.equal(normalizeStrategyKey('  Breakout   Retest '),'breakout retest');
  assert.equal(canonicalStrategyName('  pullback '),'Pullback');
  const existing={id:1,name:'Pullback',normalizedKey:'pullback'};
  const db={strategy:{findUnique:async()=>existing,create:async()=>{throw new Error('duplicate created');}}};
  assert.equal((await ensureStrategy(db,' PULLBACK ')).id,1);
});
test('null strategy remains optional',async()=>{assert.equal(await ensureStrategy({},'   '),null);});
test('typo warning does not automatically merge',()=>{
  const suggestion=similarStrategy('Pulback',[{name:'Pullback'}]);
  assert.equal(suggestion.name,'Pullback');
  assert.notEqual(normalizeStrategyKey('Pulback'),normalizeStrategyKey('Pullback'));
});
test('strategy merge reassigns trades and removes source',async()=>{
  const calls=[];
  const db={strategy:{findUnique:async({where})=>({id:where.id,name:where.id===2?'Pullback':'Pulback'}),delete:async({where})=>calls.push(['delete',where.id])},trade:{updateMany:async(args)=>{calls.push(['update',args]);return{count:3};}}};
  const result=await mergeStrategies(db,1,2);
  assert.equal(result.updatedTrades,3);assert.equal(calls[0][1].data.strategyName,'Pullback');
});
test('normalizes standard and custom timeframes',()=>{
  for(const value of ['M5','m5','5m','5 min','5 minutes'])assert.equal(normalizeTimeframe(value),'M5');
  for(const value of ['H1','1h','60m'])assert.equal(normalizeTimeframe(value),'H1');
  assert.equal(normalizeTimeframe('  custom   range '),'CUSTOM RANGE');
});
