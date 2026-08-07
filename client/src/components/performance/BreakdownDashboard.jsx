import { Bar,BarChart,CartesianGrid,Legend,ResponsiveContainer,Tooltip,XAxis,YAxis } from 'recharts';
import PerformanceKpiCard from './PerformanceKpiCard.jsx';
import PerformanceColumnChart from './PerformanceColumnChart.jsx';
import PerformanceDonutChart from './PerformanceDonutChart.jsx';
import PerformanceLineChart from './PerformanceLineChart.jsx';
import StrategyRadarChart from './StrategyRadarChart.jsx';
import WeekdayHeatmap from './WeekdayHeatmap.jsx';
import DetailedBreakdownTable from './DetailedBreakdownTable.jsx';
import DashboardPanel from './DashboardPanel.jsx';
import { orderedBreakdown } from '../../utils/performanceCharts.js';
import { money,number } from '../../utils/format.js';

const title=(tab)=>({markets:'Market',strategies:'Strategy',sessions:'Session',timeframes:'Timeframe',directions:'Direction',weekdays:'Day'}[tab]);
const grossProfit=(r)=>(r.averageWin||0)*(r.wins||0),grossLoss=(r)=>Math.abs((r.averageLoss||0)*(r.losses||0));
const metricLabel=(metric)=>({netProfitLoss:'Net P&L',totalTrades:'Trades',winRate:'Win Rate',profitFactor:'Profit Factor'}[metric]);

export default function BreakdownDashboard({rows,tab,metric,setMetric,currency,onSelect}){
  const ordered=orderedBreakdown(rows,metric,tab),byPnl=orderedBreakdown(rows,'netProfitLoss',tab),byTrades=orderedBreakdown(rows,'totalTrades',tab),byPf=orderedBreakdown(rows,'profitFactor',tab);
  const best=byPnl[0],worst=[...byPnl].reverse()[0],most=byTrades[0],label=title(tab);
  const kpis=tab==='directions'?[...rows.map((r)=>({label:`${r.name} Net P&L`,value:r.netProfitLoss,moneyValue:true,negative:r.netProfitLoss<0})),...rows.map((r)=>({label:`${r.name} Win Rate`,value:`${number(r.winRate||0,1)}%`}))]:[{label:`Best ${label}`,value:best?.name,detail:best&&money(best.netProfitLoss,currency)},{label:`Worst ${label}`,value:worst?.name,detail:worst&&money(worst.netProfitLoss,currency)},{label:tab==='strategies'?'Most Used Strategy':`Most ${tab==='markets'?'Traded':'Active'} ${label}`,value:most?.name,detail:most&&`${most.totalTrades} trades`},...(tab==='strategies'?[{label:'Highest Profit Factor',value:byPf[0]?.name,detail:byPf[0]&&`PF ${byPf[0].profitFactor==='INFINITY'?'∞':number(byPf[0].profitFactor||0,2)}`}]:[])];
  const primary=<PerformanceColumnChart title={`${metricLabel(metric)} by ${label}`} rows={ordered} metric={metric} currency={currency} onSelect={onSelect} large={tab==='directions'}/>;
  const usage=<PerformanceDonutChart title={`${label} ${tab==='directions'?'Share':'Usage'}`} rows={ordered} onSelect={onSelect}/>;
  const winRate=<PerformanceColumnChart title={`Win Rate by ${label}`} rows={ordered} metric="winRate" currency={currency} onSelect={onSelect}/>;
  const comparison=tab==='sessions'||tab==='directions'?<DashboardPanel title={`${label} comparison`} subtitle="Gross profit versus absolute gross loss"><ResponsiveComparison rows={ordered} onSelect={onSelect}/></DashboardPanel>:<PerformanceLineChart title={`Profit Factor by ${label}`} rows={ordered} metric="profitFactor" onSelect={onSelect}/>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">{tab==='weekdays'?'Performance by Day':`${label} analytics`}</h2><p className="mt-1 text-xs text-muted">Visual summary with exact values available below.</p></div><label className="text-xs text-muted">Primary metric<select className="field ml-2 inline-block w-36 py-1.5 text-xs" value={metric} onChange={(e)=>setMetric(e.target.value)}><option value="netProfitLoss">Net P&L</option><option value="totalTrades">Trades</option><option value="winRate">Win Rate</option><option value="profitFactor">Profit Factor</option></select></label></div>
    <div className={`grid gap-3 sm:grid-cols-2 ${kpis.length===4?'xl:grid-cols-4':'xl:grid-cols-3'}`}>{kpis.map((card)=><PerformanceKpiCard key={card.label} currency={currency} {...card}/>)}</div>
    {tab==='weekdays'?<><WeekdayHeatmap rows={ordered} metric={metric} currency={currency} onSelect={onSelect}/><div className="grid items-start gap-4 xl:grid-cols-2"><div className="space-y-4">{primary}<PerformanceColumnChart title="Trades by Day" rows={ordered} metric="totalTrades" currency={currency} onSelect={onSelect}/></div><div className="space-y-4">{usage}<PerformanceLineChart title="Win Rate by Day" rows={ordered} metric="winRate" onSelect={onSelect}/></div></div></>:tab==='strategies'?<div className="space-y-4"><DashboardPanel title="Strategy Radar Comparison" subtitle="Select up to two strategies"><StrategyRadarChart rows={ordered} currency={currency}/></DashboardPanel><div className="grid items-start gap-4 lg:grid-cols-2">{usage}{comparison}{primary}{winRate}</div></div>:['markets','sessions','timeframes','directions'].includes(tab)?<div className="space-y-4"><DashboardPanel title={`${label} Radar Comparison`} subtitle={`Select up to two ${label.toLowerCase()}s`}><StrategyRadarChart rows={ordered} currency={currency} entityLabel={label}/></DashboardPanel><div className="grid items-start gap-4 lg:grid-cols-2">{usage}{comparison}{primary}{winRate}</div></div>:<div className="grid items-start gap-4 xl:grid-cols-2"><div className="space-y-4">{primary}{winRate}</div><div className="space-y-4">{usage}{comparison}</div></div>}
    <DetailedBreakdownTable rows={ordered} currency={currency} onSelect={onSelect}/>
  </div>;
}

function ResponsiveComparison({rows,onSelect}){const data=rows.map((r)=>({...r,grossProfit:grossProfit(r),grossLoss:grossLoss(r)}));return <ResponsiveContainer width="100%" height={250}><BarChart data={data} onClick={(state)=>state?.activePayload?.[0]&&onSelect(state.activePayload[0].payload)}><CartesianGrid stroke="#242c38" vertical={false}/><XAxis dataKey="name" stroke="#667080" tick={{fontSize:10}}/><YAxis stroke="#667080" tick={{fontSize:10}}/><Tooltip/><Legend/><Bar dataKey="grossProfit" name="Gross Profit" fill="#c7f36b" radius={[4,4,0,0]}/><Bar dataKey="grossLoss" name="Gross Loss" fill="#fb7185" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>}
