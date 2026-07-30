import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateMarketAnalytics, getMarketOptions, getMarketsAnalytics, normalizeMarketSymbol } from '../src/services/marketAnalyticsService.js';

test('normalizes broker suffixes consistently', () => {
  assert.equal(normalizeMarketSymbol('XAUUSDm'), 'XAUUSD');
  assert.equal(normalizeMarketSymbol('xauusdm'), 'XAUUSD');
  assert.equal(normalizeMarketSymbol('EURUSD.m'), 'EURUSD');
});

test('aggregates distinct markets, percentages, P&L, and win rate', () => {
  const result=aggregateMarketAnalytics([
    {market:'XAUUSDm',profitLoss:100,result:'WIN'},
    {market:'xauusd',profitLoss:-20,result:'LOSS'},
    {market:'NAS100',profitLoss:50,result:'WIN'},
    {market:null,profitLoss:999,result:'WIN'}
  ]);
  assert.equal(result.totalTrades,3);
  assert.deepEqual(result.markets.map(({market,tradeCount})=>[market,tradeCount]),[['XAUUSD',2],['NAS100',1]]);
  assert.ok(Math.abs(result.markets.reduce((sum,item)=>sum+item.percentage,0)-100)<0.02);
  assert.equal(result.markets[0].totalProfitLoss,80);
  assert.equal(result.markets[0].winRate,50);
});

test('returns one market as 100%', () => {
  assert.equal(aggregateMarketAnalytics([{market:'EURUSD',profitLoss:0,result:'BREAK_EVEN'}]).markets[0].percentage,100);
});

function fakeDb({ accountType='REAL', trades=[] }={}) {
  const calls=[];
  return {
    calls,
    account:{findUnique:async({where})=>({id:where.id,accountType})},
    accountPhase:{findFirst:async({where})=>where.id===9&&where.accountId===2?{id:9}:null},
    trade:{findMany:async(args)=>{calls.push(args);return trades;}}
  };
}

test('market options are account/date scoped, normalized, unique, and alphabetical', async () => {
  const db=fakeDb({trades:[{market:'xauusdm',profitLoss:0,result:'WIN'},{market:'EURUSD.m',profitLoss:0,result:'LOSS'},{market:'XAUUSD',profitLoss:0,result:'WIN'}]});
  const result=await getMarketOptions(2,{dateFrom:'2026-01-01',dateTo:'2026-01-31'},db);
  assert.deepEqual(result.markets,[{market:'EURUSD',tradeCount:1},{market:'XAUUSD',tradeCount:2}]);
  assert.equal(db.calls[0].where.accountId,2);
  assert.equal(db.calls[0].where.phaseId,null);
  assert.equal(db.calls[0].where.tradeDate.gte.toISOString(),'2026-01-01T00:00:00.000Z');
  assert.equal(db.calls[0].where.tradeDate.lte.toISOString(),'2026-01-31T23:59:59.999Z');
});

test('funded analytics are phase scoped and ignore the market query', async () => {
  const db=fakeDb({accountType:'FUNDED',trades:[{market:'XAUUSD',profitLoss:1,result:'WIN'},{market:'NAS100',profitLoss:-1,result:'LOSS'}]});
  const result=await getMarketsAnalytics(2,{phaseId:9,market:'XAUUSD',strategy:'Breakout',session:'LONDON',result:'WIN'},db);
  assert.equal(result.markets.length,2);
  assert.equal(db.calls[0].where.phaseId,9);
  assert.equal(db.calls[0].where.market,undefined);
  assert.equal(db.calls[0].where.strategy.normalizedKey,'breakout');
});
