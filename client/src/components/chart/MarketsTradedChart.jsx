import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../api/client.js';
import { money, number } from '../../utils/format.js';
import { toggleMarketSelection } from '../../utils/marketSelection.js';
import { seriesColor } from '../../utils/chartColors.js';

function ChartTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const item=payload[0].payload;
  return <div className="rounded-xl border border-line bg-[#0d1118] p-3 text-xs shadow-2xl"><p className="font-semibold text-white">{item.market}</p><p className="mt-1">{item.tradeCount} trades</p><p>{number(item.percentage,2)}%</p><p className="mt-2">Net P&L: {money(item.totalProfitLoss,currency)}</p><p>Win rate: {number(item.winRate,2)}%</p></div>;
}
export default function MarketsTradedChart({ accountId, phaseId, filters, selectedMarket, onMarketSelect, currency, refreshKey }) {
  const [data,setData]=useState({totalTrades:0,markets:[]}),[loading,setLoading]=useState(true),[metric,setMetric]=useState('tradeCount');
  useEffect(()=>{
    if(!accountId)return;
    let active=true;setLoading(true);
    const params={...(phaseId?{phaseId}:{}),dateFrom:filters.startDate||undefined,dateTo:filters.endDate||undefined,strategy:filters.strategy||undefined,session:filters.session||undefined,result:filters.result||undefined};
    api.get(`/accounts/${accountId}/analytics/markets`,{params}).then(({data:response})=>{if(active)setData(response.data);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[accountId,phaseId,filters.startDate,filters.endDate,filters.strategy,filters.session,filters.result,refreshKey]);
  const rows=useMemo(()=>data.markets.map((item)=>({...item,chartValue:metric==='tradeCount'?item.percentage:metric==='profitLoss'?item.totalProfitLoss:item.winRate})),[data,metric]);
  const pie=metric==='tradeCount'&&rows.length<=6;
  const select=(item)=>onMarketSelect(toggleMarketSelection(selectedMarket,item.market));
  return <section className="card min-h-[360px] p-5">
    <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Markets Traded</p><p className="mt-1 text-xs text-muted">Distribution by number of trades</p></div><select className="field w-32 py-1.5 text-xs" value={metric} onChange={(e)=>setMetric(e.target.value)}><option value="tradeCount">Trade count</option><option value="profitLoss">Net P&L</option><option value="winRate">Win rate</option></select></div>
    {loading?<div className="h-64 animate-pulse rounded-xl bg-white/5"/>:!rows.length?<div className="flex h-64 items-center justify-center text-center text-sm text-muted">No market data available for the selected filters.</div>:<>
      <ResponsiveContainer width="100%" height={260}>{pie?<PieChart><Pie data={rows} dataKey="chartValue" nameKey="market" innerRadius={62} outerRadius={98} paddingAngle={2} onClick={select}>{rows.map((item)=>{const color=seriesColor(item.market);return <Cell key={item.market} fill={color} opacity={!selectedMarket||selectedMarket===item.market?1:.3} stroke={selectedMarket===item.market?'#fff':'transparent'} strokeWidth={2} style={{filter:`drop-shadow(0 0 4px ${color}4d)`}}/>})}</Pie><Tooltip content={<ChartTooltip currency={currency}/>}/><text x="50%" y="48%" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="600">{data.totalTrades}</text><text x="50%" y="57%" textAnchor="middle" fill="#8b95a5" fontSize="12">Trades</text></PieChart>:<BarChart data={rows} layout="vertical" margin={{left:15,right:20}}><CartesianGrid stroke="#242c38" horizontal={false}/><XAxis type="number" tick={{fontSize:11}} stroke="#667080" unit={metric==='profitLoss'?'':'%'}/><YAxis type="category" dataKey="market" width={80} tick={{fontSize:11}} stroke="#667080"/><Tooltip content={<ChartTooltip currency={currency}/>}/><Bar dataKey="chartValue" onClick={select} radius={[0,4,4,0]}>{rows.map((item)=>{const color=seriesColor(item.market);return <Cell key={item.market} fill={color} opacity={!selectedMarket||selectedMarket===item.market?1:.35} style={{filter:`drop-shadow(0 0 4px ${color}4d)`}}/>})}</Bar></BarChart>}</ResponsiveContainer>
      {rows.length===1&&<p className="text-center text-xs text-muted">100% of trades were taken on {rows[0].market}.</p>}
    </>}
  </section>;
}
