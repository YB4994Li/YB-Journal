import { Bar, CartesianGrid, Cell, ComposedChart, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardPanel from './DashboardPanel.jsx';
import { finiteNumber } from '../../utils/performanceCharts.js';
import { money, number } from '../../utils/format.js';
import { seriesColor } from './chartPalette.js';

const WEEKDAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function WeekdayTooltip({active,payload,metric,currency}){
  if(!active||!payload?.length)return null;
  const row=payload[0].payload,color=seriesColor(row.name);
  const shown=metric==='winRate'?`${number(row.value,1)}%`:number(row.value,0);
  return <div className="rounded-xl border bg-[#0d1118] p-3 text-xs shadow-2xl" style={{borderColor:`${color}55`,boxShadow:`0 0 16px ${color}18`}}><p className="font-semibold" style={{color}}>{row.name}</p><p className="mt-2" style={{color}}>{metric==='winRate'?'Win Rate':'Trades'}: {shown}</p><p className="mt-1 text-muted">Trades: {number(row.totalTrades,0)}</p><p className={row.netProfitLoss<0?'mt-1 text-rose-400':'mt-1 text-muted'}>Net P&amp;L: {money(row.netProfitLoss,currency)}</p><p className="mt-1 text-muted">Win Rate: {row.winRate==null?'—':`${number(row.winRate,1)}%`}</p></div>;
}

export default function WeekdayLollipopChart({rows,metric,currency,onSelect}){
  const data=[...rows].sort((a,b)=>WEEKDAYS.indexOf(a.name)-WEEKDAYS.indexOf(b.name)).map((row)=>({...row,value:row[metric]==null?0:finiteNumber(row[metric])}));
  const title=metric==='winRate'?'Win Rate by Day':'Trades by Day';
  const domain=metric==='winRate'?[0,100]:[0,'auto'];
  return <DashboardPanel title={title} className="h-full">{!data.length?<div className="flex h-[260px] items-center justify-center text-sm text-muted">No data to visualize.</div>:<ResponsiveContainer width="100%" height={260}><ComposedChart data={data} margin={{top:22,right:8,left:0,bottom:18}} onClick={(state)=>state?.activePayload?.[0]&&onSelect?.(state.activePayload[0].payload)}><CartesianGrid stroke="#303947" strokeOpacity={.48} vertical={false}/><XAxis dataKey="name" interval={0} stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} height={48} tickLine={false}/><YAxis domain={domain} stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false} tickFormatter={(value)=>metric==='winRate'?`${value}%`:number(value,0)}/><Tooltip content={<WeekdayTooltip metric={metric} currency={currency}/>}/><Bar dataKey="value" barSize={2} fillOpacity={.65} isAnimationActive animationDuration={500} animationEasing="ease-out">{data.map((row)=>{const color=seriesColor(row.name);return <Cell key={row.key||row.name} fill={color} style={{filter:`drop-shadow(0 0 2px ${color}55)`}}/>})}</Bar><Scatter dataKey="value" line={false} shape="circle" isAnimationActive animationDuration={620}>{data.map((row)=>{const color=seriesColor(row.name);return <Cell key={row.key||row.name} fill={color} style={{filter:`drop-shadow(0 0 4px ${color}99)`}}/>})}</Scatter></ComposedChart></ResponsiveContainer>}</DashboardPanel>;
}
