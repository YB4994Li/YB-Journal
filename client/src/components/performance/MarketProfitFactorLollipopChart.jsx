import { Bar, CartesianGrid, Cell, ComposedChart, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardPanel from './DashboardPanel.jsx';
import { finiteNumber } from '../../utils/performanceCharts.js';
import { money, number } from '../../utils/format.js';
import { seriesColor } from './chartPalette.js';

function LollipopTooltip({active,payload,currency}){
  if(!active||!payload?.length)return null;
  const row=payload[0].payload;
  const color=seriesColor(row.name);
  return <div className="rounded-xl border bg-[#0d1118] p-3 text-xs shadow-2xl" style={{borderColor:`${color}55`,boxShadow:`0 0 16px ${color}18`}}>
    <p className="font-semibold" style={{color}}>{row.name}</p>
    <p className="mt-2" style={{color}}>Profit Factor: {row.profitFactor==='INFINITY'?'∞':number(row.profitFactor,2)}</p>
    <p className="mt-1 text-muted">Trades: {number(row.totalTrades,0)}</p>
    <p className={row.netProfitLoss<0?'mt-1 text-rose-400':'mt-1 text-muted'}>Net P&amp;L: {money(row.netProfitLoss,currency)}</p>
    <p className="mt-1 text-muted">Win Rate: {number(row.winRate||0,2)}%</p>
  </div>;
}

export default function MarketProfitFactorLollipopChart({rows,currency,onSelect}){
  const finite=rows.map((row)=>finiteNumber(row.profitFactor));
  const infinityValue=Math.max(1,...finite)*1.1;
  const data=rows.map((row)=>({...row,value:row.profitFactor==='INFINITY'?infinityValue:finiteNumber(row.profitFactor)}));
  return <DashboardPanel title="Profit Factor by Market" subtitle="Risk-adjusted return ratio" className="h-full">
    {!data.length?<div className="flex h-[250px] items-center justify-center text-sm text-muted">No data to visualize.</div>:<ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{top:18,right:12,left:0,bottom:14}} onClick={(state)=>state?.activePayload?.[0]&&onSelect?.(state.activePayload[0].payload)}>
        <CartesianGrid stroke="#303947" strokeOpacity={.45} vertical={false}/>
        <XAxis dataKey="name" stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false}/>
        <YAxis domain={[0,'auto']} stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false}/>
        <Tooltip content={<LollipopTooltip currency={currency}/>}/>
        <Bar dataKey="value" barSize={2} fillOpacity={.62} isAnimationActive animationDuration={520} animationEasing="ease-out">{data.map((row)=>{const color=seriesColor(row.name);return <Cell key={row.key||row.name} fill={color} style={{filter:`drop-shadow(0 0 2px ${color}55)`}}/>})}</Bar>
        <Scatter dataKey="value" line={false} shape="circle" isAnimationActive animationDuration={620}>{data.map((row)=>{const color=seriesColor(row.name);return <Cell key={row.key||row.name} fill={color} style={{filter:`drop-shadow(0 0 4px ${color}99)`}}/>})}</Scatter>
      </ComposedChart>
    </ResponsiveContainer>}
  </DashboardPanel>;
}
