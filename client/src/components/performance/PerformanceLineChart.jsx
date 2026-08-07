import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardPanel from './DashboardPanel.jsx';
import { finiteNumber } from '../../utils/performanceCharts.js';
import PerformanceChartTooltip from './PerformanceChartTooltip.jsx';

export default function PerformanceLineChart({title,subtitle,rows,metric,onSelect}){
  const data=rows.map((row)=>({...row,value:finiteNumber(row[metric])}));
  return <DashboardPanel title={title} subtitle={subtitle}>{!data.length?<div className="flex h-56 items-center justify-center text-sm text-muted">No data to visualize.</div>:<ResponsiveContainer width="100%" height={250}><LineChart data={data} margin={{top:12,right:12,left:0,bottom:14}} onClick={(state)=>state?.activePayload?.[0]&&onSelect?.(state.activePayload[0].payload)}><defs><filter id="premiumLineGlow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#c7f36b" floodOpacity=".32"/></filter></defs><CartesianGrid stroke="#303947" strokeOpacity={.45} vertical={false}/><XAxis dataKey="name" stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false}/><YAxis domain={metric==='winRate'?[0,100]:['auto','auto']} stroke="#788495" tick={{fontSize:10,fill:'#a8b2c1'}} tickLine={false}/><Tooltip content={<PerformanceChartTooltip color="#c7f36b"/>}/><Line type="monotone" dataKey="value" stroke="#c7f36b" strokeWidth={2.75} filter="url(#premiumLineGlow)" dot={{r:4,fill:'#c7f36b',stroke:'#e2ff9d',strokeWidth:1.5}} activeDot={{r:6,fill:'#c7f36b',stroke:'#fff',strokeWidth:2}} isAnimationActive animationDuration={520} animationEasing="ease-out"/></LineChart></ResponsiveContainer>}</DashboardPanel>;
}
