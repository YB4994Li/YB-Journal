import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardPanel from './DashboardPanel.jsx';
import { finiteNumber } from '../../utils/performanceCharts.js';
import { money, number } from '../../utils/format.js';
import { seriesColor } from './chartPalette.js';

const format=(value,metric,currency)=>metric==='netProfitLoss'?money(value,currency):metric==='winRate'?`${number(value,1)}%`:number(value,metric==='totalTrades'?0:2);
const tooltipStyle={background:'#0d1118',border:'1px solid #303947',borderRadius:12,boxShadow:'0 14px 34px rgba(0,0,0,.42)',fontSize:12};
const directionPnlDomain=[(minimum)=>minimum<0?minimum*1.1:0,(maximum)=>maximum>0?maximum*1.1:0];

export default function PerformanceColumnChart({title,subtitle,rows,metric='netProfitLoss',currency,onSelect,large=false}){
  const finite=rows.map((row)=>finiteNumber(row[metric]));
  const cap=Math.max(1,...finite)*1.1;
  const data=rows.map((row)=>({...row,value:row[metric]==='INFINITY'?cap:finiteNumber(row[metric])}));
  const domain=metric==='winRate'?[0,100]:large&&metric==='netProfitLoss'?directionPnlDomain:['auto','auto'];
  return <DashboardPanel title={title} subtitle={subtitle}>
    {!data.length?<div className="flex h-56 items-center justify-center text-sm text-muted">No data to visualize.</div>:<div className="max-w-full overflow-x-auto"><div style={{minWidth:Math.max(420,data.length*76)}}>
      <ResponsiveContainer width="100%" height={large?330:260}>
        <BarChart layout="horizontal" data={data} margin={{top:22,right:8,left:0,bottom:18}}>
          <CartesianGrid stroke="#303947" strokeOpacity={.48} vertical={false}/>
          <XAxis type="category" dataKey="name" interval={0} stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} height={48} tickLine={false}/>
          <YAxis type="number" domain={domain} stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false} tickFormatter={(value)=>Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value)}/>
          <Tooltip contentStyle={tooltipStyle} cursor={{fill:'rgba(255,255,255,.025)'}} formatter={(value)=>[format(value,metric,currency),title]}/>
          {metric==='netProfitLoss'&&<ReferenceLine y={0} stroke="#94a3b8" strokeOpacity={.65}/>} 
          <Bar dataKey="value" maxBarSize={large?52:58} radius={[7,7,2,2]} strokeWidth={1} isAnimationActive animationDuration={480} animationEasing="ease-out" onClick={(entry)=>onSelect?.(entry.payload||entry)} cursor={onSelect?'pointer':'default'}>
            {data.map((row)=>{const color=seriesColor(row.name);return <Cell key={row.key||row.name} fill={color} stroke={color} fillOpacity={.9} style={{filter:`drop-shadow(0 0 5px ${color}55)`,transition:'filter 180ms ease, opacity 180ms ease'}}/>})}
            {large&&<LabelList dataKey="value" position="top" formatter={(value)=>format(value,metric,currency)} fill="#d5dce7" fontSize={10}/>} 
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div></div>}
  </DashboardPanel>;
}
