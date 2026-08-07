import { useMemo, useState } from 'react';
import BalanceChart from '../chart/BalanceChart.jsx';
import TradeOutcomeChart from './TradeOutcomeChart.jsx';
import PerformanceKpiCard from './PerformanceKpiCard.jsx';
import PerformanceLineChart from './PerformanceLineChart.jsx';
import DashboardPanel from './DashboardPanel.jsx';
import { money, number } from '../../utils/format.js';

const category=(rows,best=true)=>{const sorted=[...(rows||[])].sort((a,b)=>b.netProfitLoss-a.netProfitLoss);return best?sorted[0]:sorted.at(-1)};

export default function OverviewDashboard({summary,balanceHistory,currency,scaleKey,categories={}}){
  const [period,setPeriod]=useState('daily');
  const closing=balanceHistory.at(-1)?.balance;
  const grossProfit=(summary.averageWin||0)*(summary.wins||0),grossLoss=Math.abs((summary.averageLoss||0)*(summary.losses||0));
  const timeline=useMemo(()=>{const buckets=new Map();for(const row of balanceHistory){const date=new Date(row.date),key=period==='monthly'?row.date.slice(0,7):period==='weekly'?`${date.getUTCFullYear()}-W${Math.ceil((((date-new Date(Date.UTC(date.getUTCFullYear(),0,1)))/86400000)+1)/7)}`:row.date;buckets.set(key,{name:key,balance:row.balance});}return [...buckets.values()]},[balanceHistory,period]);
  const kpis=[['Net P&L',summary.netProfitLoss,true],['Closing Balance',closing,true],['Total Trades',summary.totalTrades],['Win Rate',`${number(summary.winRate||0,2)}%`],['Profit Factor',summary.profitFactor==='INFINITY'?'∞':number(summary.profitFactor||0,2)],['Average Win',summary.averageWin,true],['Average Loss',summary.averageLoss,true],['Best Trade',summary.bestTrade?.profitLoss,true],['Worst Trade',summary.worstTrade?.profitLoss,true]];
  const notable=[['Best market',category(categories.markets)],['Worst market',category(categories.markets,false)],['Best strategy',category(categories.strategies)],['Worst strategy',category(categories.strategies,false)],['Best session',category(categories.sessions)],['Worst weekday',category(categories.weekdays,false)]];
  const summaryItems=[['Gross Profit',grossProfit],['Gross Loss',-grossLoss],['Average Trade',summary.totalTrades?summary.netProfitLoss/summary.totalTrades:0],['Largest Win',summary.bestTrade?.profitLoss||0],['Largest Loss',summary.worstTrade?.profitLoss||0]];

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">{kpis.map(([label,value,moneyValue])=><PerformanceKpiCard key={label} label={label} value={value} currency={currency} moneyValue={moneyValue} negative={moneyValue&&value<0}/>)}</div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-8"><BalanceChart data={balanceHistory} currency={currency} loading={false} scaleKey={scaleKey}/></div>
      <div className="xl:col-span-4"><TradeOutcomeChart summary={summary}/></div>
      <div className="h-full xl:col-span-7"><DashboardPanel title="Cumulative P&L by Time" subtitle="Closing balance grouped by period" className="h-full"><div className="mb-2 flex justify-end gap-1">{['daily','weekly','monthly'].map((item)=><button key={item} onClick={()=>setPeriod(item)} className={period===item?'btn-primary px-3 py-1 text-xs':'btn-secondary px-3 py-1 text-xs'}>{item}</button>)}</div><PerformanceLineChart title="" rows={timeline} metric="balance"/></DashboardPanel></div>
      <div className="h-full xl:col-span-5"><DashboardPanel title="Performance Summary" className="flex h-full flex-col"><div className="grid flex-1 grid-cols-2 grid-rows-3 gap-3">{summaryItems.map(([label,value])=><div className="flex min-w-0 flex-col justify-center rounded-lg border border-line p-5" style={label==='Largest Loss'?{gridColumn:'1 / -1'}:undefined} key={label}><p className="text-sm font-medium text-muted">{label}</p><p className={value<0?'mt-2 text-2xl font-bold tracking-tight text-rose-400':'mt-2 text-2xl font-bold tracking-tight'}>{money(value,currency)}</p></div>)}</div></DashboardPanel></div>
      <div className="xl:col-span-12"><DashboardPanel title="Best and Worst Categories"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{notable.map(([label,row])=><div className="rounded-lg border border-line p-3" key={label}><p className="text-xs text-muted">{label}</p><p className="mt-1 font-semibold">{row?.name||'—'}</p><p className={row?.netProfitLoss<0?'mt-1 text-xs text-rose-400':'mt-1 text-xs text-lime'}>{row?money(row.netProfitLoss,currency):'No data'}</p></div>)}</div></DashboardPanel></div>
    </div>
  </div>;
}
