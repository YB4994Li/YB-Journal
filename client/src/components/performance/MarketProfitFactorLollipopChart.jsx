import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardPanel from './DashboardPanel.jsx';
import { profitFactorChartData } from '../../utils/performanceCharts.js';
import { money, number, profitFactor } from '../../utils/format.js';
import { seriesColor } from './chartPalette.js';
import PerformanceChartTooltip from './PerformanceChartTooltip.jsx';

function LollipopTooltip({active,payload,currency,entityLabel}){
  if(!active||!payload?.length)return null;
  const row=payload[0].payload;
  const color=seriesColor(row.name);
  return <PerformanceChartTooltip active={active} payload={payload} title={row.name} color={color}>
    <p className="mt-2" style={{color}}>Profit Factor: {profitFactor(row.profitFactor)}</p>
    <p className="mt-1 text-muted">Trades: {number(row.totalTrades,0)}</p>
    <p className={row.netProfitLoss<0?'mt-1 text-rose-400':'mt-1 text-muted'}>Net P&amp;L: {money(row.netProfitLoss,currency)}</p>
    <p className="mt-1 text-muted">Win Rate: {number(row.winRate||0,2)}%</p>
  </PerformanceChartTooltip>;
}

export default function MarketProfitFactorLollipopChart({rows,currency,onSelect,entityLabel='Market'}){
  const data=profitFactorChartData(rows);
  return <DashboardPanel title={`Profit Factor by ${entityLabel}`} subtitle="Risk-adjusted return ratio" className="h-full">
    {!data.length?<div className="flex h-[250px] items-center justify-center text-sm text-muted">No data to visualize.</div>:<ResponsiveContainer width="100%" height={250}>
      <ComposedChart data={data} margin={{top:18,right:12,left:0,bottom:14}} onClick={(state)=>state?.activePayload?.[0]&&onSelect?.(state.activePayload[0].payload)}>
        <CartesianGrid stroke="#303947" strokeOpacity={.45} vertical={false}/>
        <XAxis dataKey="name" stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false}/>
        <YAxis domain={[0,'auto']} stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false}/>
        <Tooltip content={<LollipopTooltip currency={currency} entityLabel={entityLabel}/>}/>
        <Bar dataKey="value" barSize={2} fillOpacity={.62} isAnimationActive animationDuration={520} animationEasing="ease-out">{data.map((row)=>{const color=seriesColor(row.name);return <Cell key={row.key||row.name} fill={color} style={{filter:`drop-shadow(0 0 2px ${color}55)`}}/>})}</Bar>
        <Scatter dataKey="value" line={false} shape="circle" isAnimationActive animationDuration={620}>{data.map((row)=>{const color=seriesColor(row.name);return <Cell key={row.key||row.name} fill={color} style={{filter:`drop-shadow(0 0 4px ${color}99)`}}/>})}<LabelList dataKey="infinityLabel" position="top" fill="#c7f36b" fontSize={14} fontWeight={700}/></Scatter>
      </ComposedChart>
    </ResponsiveContainer>}
  </DashboardPanel>;
}
