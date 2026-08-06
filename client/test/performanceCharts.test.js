import test from 'node:test';
import assert from 'node:assert/strict';
import { breakdownChartData, orderedBreakdown, outcomeChartData, radarSeries, strategyRadarData } from '../src/utils/performanceCharts.js';

const rows=[
  {key:'a',name:'Alpha',totalTrades:5,netProfitLoss:-100,winRate:40,profitFactor:0.5,averageWin:50,averageLoss:-80,consistency:60},
  {key:'b',name:'Beta',totalTrades:10,netProfitLoss:200,winRate:70,profitFactor:2,averageWin:100,averageLoss:-40,consistency:80}
];

test('chart metric changes with Sort by and preserves table order',()=>{
  assert.deepEqual(breakdownChartData(rows,'totalTrades','markets').map((r)=>[r.name,r.chartValue]),[['Beta',10],['Alpha',5]]);
  assert.deepEqual(orderedBreakdown(rows,'winRate','markets').map((r)=>r.name),['Beta','Alpha']);
});

test('weekdays retain natural order regardless of metric',()=>{
  const weekdays=[{name:'Friday',netProfitLoss:99},{name:'Monday',netProfitLoss:1},{name:'Sunday',netProfitLoss:500},{name:'Tuesday',netProfitLoss:2}];
  assert.deepEqual(orderedBreakdown(weekdays,'netProfitLoss','weekdays').map((r)=>r.name),['Monday','Tuesday','Friday','Sunday']);
});

test('one and two strategy radar comparisons produce six bounded axes',()=>{
  assert.equal(radarSeries(rows.slice(0,1)).length,6);
  const two=radarSeries(rows); assert.equal(two.length,6);
  for(const axis of two) for(const key of ['a','b']) assert.ok(axis[key]>=0&&axis[key]<=100);
});

test('negative Net P&L is normalized safely',()=>{
  const scored=strategyRadarData(rows); assert.equal(scored[0].scores.netProfitLoss,0); assert.equal(scored[1].scores.netProfitLoss,100);
});

test('empty chart adapters return stable empty data',()=>{assert.deepEqual(breakdownChartData([],'netProfitLoss','markets'),[]);assert.deepEqual(radarSeries([]),[]);});

test('Trade Outcomes adapter creates vertical chart counts and percentages',()=>{
  assert.deepEqual(outcomeChartData({totalTrades:10,wins:5,losses:3,breakEven:2}).map(({name,count,percentage})=>[name,count,percentage]),[['Wins',5,50],['Losses',3,30],['Break-even',2,20]]);
});
