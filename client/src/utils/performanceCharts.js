export const CHART_METRICS = {
  netProfitLoss: { label: 'Net P&L' }, totalTrades: { label: 'Trades' }, winRate: { label: 'Win Rate' }, profitFactor: { label: 'Profit Factor' }
};
const WEEKDAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const TIMEFRAME_ORDER = ['M1','M5','M15','M30','H1','H4','D1','W1'];
export const finiteNumber = (value, fallback = 0) => value === 'INFINITY' ? fallback : Number.isFinite(Number(value)) ? Number(value) : 0;

export function profitFactorChartData(rows = []) {
  const largestFinite=Math.max(0,...rows.filter((row)=>row.profitFactor!=='INFINITY').map((row)=>finiteNumber(row.profitFactor)));
  const infinityCap=largestFinite>0?largestFinite*1.1:1;
  return rows.map((row)=>({...row,value:row.profitFactor==='INFINITY'?infinityCap:finiteNumber(row.profitFactor),infinityLabel:row.profitFactor==='INFINITY'?'∞':''}));
}

export function orderedBreakdown(rows = [], sort = 'netProfitLoss', tab = '') {
  if (tab === 'weekdays') return [...rows].sort((a,b)=>WEEKDAY_ORDER.indexOf(a.name)-WEEKDAY_ORDER.indexOf(b.name));
  if (tab === 'timeframes') return [...rows].sort((a,b)=>{const ai=TIMEFRAME_ORDER.indexOf(a.name),bi=TIMEFRAME_ORDER.indexOf(b.name);return (ai<0?999:ai)-(bi<0?999:bi)||a.name.localeCompare(b.name)});
  const finite = rows.map((row)=>finiteNumber(row[sort]));
  const infinityValue = Math.max(1,...finite) * 1.1;
  const value = (row)=>row[sort] === 'INFINITY' ? infinityValue : finiteNumber(row[sort], infinityValue);
  return [...rows].sort((a,b)=>value(b)-value(a)||a.name.localeCompare(b.name));
}

export function breakdownChartData(rows, sort, tab) {
  const source=tab==='directions'?['BUY','SELL'].map((name)=>rows.find((row)=>row.name===name)||{key:name,name,totalTrades:0,netProfitLoss:0,winRate:0,profitFactor:0,averageWin:null,averageLoss:null,journalFilter:{direction:name}}):rows;
  const ordered = tab==='directions'?source:orderedBreakdown(source, sort, tab), finite = ordered.map((row)=>finiteNumber(row[sort]));
  const infinityValue = Math.max(1,...finite)*1.1;
  return ordered.map((row)=>({...row,chartValue:row[sort]==='INFINITY'?infinityValue:finiteNumber(row[sort])}));
}

const relative = (value,max)=>max>0?Math.max(0,Math.min(100,value/max*100)):0;
export function strategyRadarData(rows = []) {
  const maxPf=Math.max(0,...rows.map((r)=>r.profitFactor==='INFINITY'?0:finiteNumber(r.profitFactor))), pfCap=Math.max(1,maxPf);
  const maxWin=Math.max(0,...rows.map((r)=>Math.max(0,finiteNumber(r.averageWin))));
  const losses=rows.map((r)=>Math.abs(Math.min(0,finiteNumber(r.averageLoss)))), maxLoss=Math.max(0,...losses), minLoss=losses.length?Math.min(...losses):0;
  const pnls=rows.map((r)=>finiteNumber(r.netProfitLoss)), minPnl=Math.min(...pnls,0), maxPnl=Math.max(...pnls,0), pnlRange=maxPnl-minPnl;
  const score=(row,index)=>({
    winRate:Math.max(0,Math.min(100,finiteNumber(row.winRate))),
    profitFactor:relative(row.profitFactor==='INFINITY'?pfCap:Math.min(finiteNumber(row.profitFactor),pfCap),pfCap),
    averageWin:relative(Math.max(0,finiteNumber(row.averageWin)),maxWin),
    lossControl:maxLoss===minLoss?100:(maxLoss-losses[index])/(maxLoss-minLoss)*100,
    netProfitLoss:pnlRange?Math.max(0,Math.min(100,(pnls[index]-minPnl)/pnlRange*100)):pnls[index]>=0?100:0,
    consistency:Math.max(0,Math.min(100,finiteNumber(row.consistency)))
  });
  return rows.map((row,index)=>({row,scores:score(row,index)}));
}

export function radarSeries(rows = []) {
  if (!rows.length) return [];
  const scored=strategyRadarData(rows);
  const axes=[['winRate','Win Rate'],['profitFactor','Profit Factor'],['averageWin','Average Win'],['lossControl','Loss Control'],['netProfitLoss','Net P&L'],['consistency','Consistency']];
  return axes.map(([key,metric])=>({metric,...Object.fromEntries(scored.map(({row,scores})=>[String(row.key),scores[key]]))}));
}

export function outcomeChartData(summary = {}) {
  const total=finiteNumber(summary.totalTrades);
  return [['Wins',summary.wins,'#c7f36b'],['Losses',summary.losses,'#fb7185'],['Break-even',summary.breakEven,'#94a3b8']].map(([name,count,color])=>({name,count:finiteNumber(count),percentage:total?finiteNumber(count)/total*100:0,color}));
}
