import { Cell,Legend,Pie,PieChart,ResponsiveContainer,Tooltip } from 'recharts';
import DashboardPanel from './DashboardPanel.jsx';
import { seriesColor } from './chartPalette.js';
import PerformanceChartTooltip from './PerformanceChartTooltip.jsx';

export default function PerformanceDonutChart({title,rows,onSelect}){
  const data=rows.filter((row)=>row.totalTrades>0).map((row)=>({name:row.name,value:row.totalTrades,row}));
  const total=data.reduce((sum,item)=>sum+item.value,0);
  return <DashboardPanel title={title} subtitle="Share of total trades">{!data.length?<div className="flex h-56 items-center justify-center text-sm text-muted">No distribution data.</div>:<ResponsiveContainer width="100%" height={250}><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2} cornerRadius={4} stroke="#111722" strokeWidth={2} isAnimationActive animationDuration={500} animationEasing="ease-out" onClick={(entry)=>onSelect?.(entry.row||entry.payload?.row)}>{data.map((item)=>{const color=seriesColor(item.name);return <Cell key={item.name} fill={color} style={{filter:`drop-shadow(0 0 4px ${color}4d)`}}/>})}</Pie><text x="50%" y="47%" textAnchor="middle" fill="#f1f5f9" fontSize="20" fontWeight="600">{total}</text><text x="50%" y="57%" textAnchor="middle" fill="#94a3b8" fontSize="10">TRADES</text><Tooltip content={<PerformanceChartTooltip valueFormatter={(value)=>`${value} trades`}/>}/><Legend wrapperStyle={{fontSize:11,color:'#a8b2c1'}}/></PieChart></ResponsiveContainer>}</DashboardPanel>;
}
