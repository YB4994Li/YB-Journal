import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { outcomeChartData } from '../../utils/performanceCharts.js';

export default function TradeOutcomeChart({summary}){
  const total=summary.totalTrades||0,data=outcomeChartData(summary);
  return <section className="card min-h-[360px] p-5"><h3 className="text-sm font-semibold">Trade outcomes</h3><p className="mt-1 text-xs text-muted">Count and percentage of total trades</p>{!total?<div className="flex h-64 items-center justify-center text-sm text-muted">No trade outcomes to visualize.</div>:<ResponsiveContainer width="100%" height={280}>
    <BarChart layout="horizontal" data={data} margin={{top:28,right:10,left:0,bottom:0}} barCategoryGap="25%"><CartesianGrid stroke="#242c38" vertical={false}/><XAxis type="category" dataKey="name" stroke="#667080" tick={{fontSize:11}}/><YAxis type="number" allowDecimals={false} stroke="#667080" tick={{fontSize:11}}/><Tooltip contentStyle={{background:'#0d1118',border:'1px solid #242c38',borderRadius:12}} formatter={(value,_,item)=>[`${value} (${item.payload.percentage.toFixed(1)}%)`,'Trades']}/><Bar dataKey="count" radius={[6,6,0,0]} maxBarSize={80}>{data.map((item)=><Cell key={item.name} fill={item.color}/>)}<LabelList dataKey="percentage" position="top" formatter={(value)=>`${value.toFixed(1)}%`} fill="#cbd5e1" fontSize={11}/></Bar></BarChart>
  </ResponsiveContainer>}</section>;
}
