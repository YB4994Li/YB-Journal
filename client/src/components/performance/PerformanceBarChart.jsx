import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { breakdownChartData, CHART_METRICS } from '../../utils/performanceCharts.js';
import { money, number } from '../../utils/format.js';

const display=(value,metric,currency)=>metric==='netProfitLoss'?money(value,currency):metric==='winRate'?`${number(value,2)}%`:number(value,metric==='totalTrades'?0:2);
function ChartTooltip({active,payload,metric,currency}){if(!active||!payload?.length)return null;const row=payload[0].payload;return <div className="rounded-xl border border-line bg-[#0d1118] p-3 text-xs shadow-2xl"><p className="font-semibold text-white">{row.name}</p><p className="mt-2 text-lime">{CHART_METRICS[metric].label}: {display(row.chartValue,metric,currency)}</p><p className="mt-1 text-muted">Trades: {row.totalTrades}</p><p className={row.netProfitLoss<0?'mt-1 text-rose-400':'mt-1 text-muted'}>Net P&L: {money(row.netProfitLoss,currency)}</p><p className="mt-1 text-muted">Win rate: {row.winRate==null?'—':`${number(row.winRate,2)}%`}</p><p className="mt-1 text-muted">Profit factor: {row.profitFactor==='INFINITY'?'∞':number(row.profitFactor||0,2)}</p></div>}

export default function PerformanceBarChart({rows,metric,tab,currency,onSelect}){
  const data=breakdownChartData(rows,metric,tab), minWidth=tab==='directions'?420:Math.max(560,data.length*86);
  const category=tab==='strategies'?'Strategy':tab.slice(0,-1).replace(/^./,(c)=>c.toUpperCase());
  return <section className="border-t border-line p-5">
    <h3 className="font-semibold">Performance visualization</h3><p className="mt-1 text-sm text-muted">{CHART_METRICS[metric].label} by {category}</p>
    {!data.length?<div className="flex h-64 items-center justify-center text-sm text-muted">No data to visualize.</div>:<div className="mt-5 max-w-full overflow-x-auto"><div style={{width:'100%',minWidth}}><ResponsiveContainer width="100%" height={320}>
      <BarChart layout="horizontal" data={data} margin={{top:28,right:16,left:8,bottom:24}} barCategoryGap={tab==='directions'?'35%':'20%'}>
        <CartesianGrid stroke="#242c38" vertical={false}/>
        <XAxis type="category" dataKey="name" interval={0} stroke="#667080" tick={{fontSize:11}} height={55}/>
        <YAxis type="number" domain={metric==='winRate'?[0,100]:['auto','auto']} stroke="#667080" tick={{fontSize:11}} tickFormatter={(v)=>Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(v)}/>
        <Tooltip content={<ChartTooltip metric={metric} currency={currency}/>}/>{metric==='netProfitLoss'&&<ReferenceLine y={0} stroke="#667080"/>}
        <Bar dataKey="chartValue" radius={[5,5,0,0]} cursor="pointer" maxBarSize={tab==='directions'?120:64} onClick={(entry)=>onSelect(entry.payload||entry)}>{data.map((row)=><Cell key={row.key} fill={metric==='netProfitLoss'&&row.chartValue<0?'#fb7185':'#c7f36b'}/>)}{tab==='directions'&&<LabelList dataKey="chartValue" position="top" formatter={(v)=>display(v,metric,currency)} fill="#cbd5e1" fontSize={11}/>}</Bar>
      </BarChart>
    </ResponsiveContainer></div></div>}
    {tab==='directions'&&data.length>0&&<div className="mt-3 grid gap-2 sm:grid-cols-2">{data.map((row)=><button key={row.key} onClick={()=>onSelect(row)} className="rounded-lg border border-line p-3 text-left text-xs text-muted hover:bg-white/[.035]"><span className="font-semibold text-white">{row.name}</span> · {row.totalTrades} trades · {money(row.netProfitLoss,currency)} · {number(row.winRate||0,2)}%</button>)}</div>}
  </section>;
}
