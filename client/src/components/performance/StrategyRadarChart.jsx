import { useEffect, useMemo, useState } from 'react';
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { radarSeries } from '../../utils/performanceCharts.js';
import { money, number } from '../../utils/format.js';

const colors=['#c7f36b','#60a5fa'];
export default function StrategyRadarChart({rows,currency}){
  const eligible=rows.filter((row)=>row.key!=='unassigned');
  const [selected,setSelected]=useState(()=>eligible.slice(0,2).map((row)=>String(row.key)));
  useEffect(()=>setSelected((current)=>{const valid=current.filter((key)=>eligible.some((row)=>String(row.key)===key));return valid.length?valid.slice(0,2):eligible.slice(0,2).map((row)=>String(row.key));}),[rows]);
  const chosen=useMemo(()=>selected.map((key)=>eligible.find((row)=>String(row.key)===key)).filter(Boolean),[selected,eligible]);
  const data=radarSeries(chosen);
  const toggle=(key)=>setSelected((current)=>current.includes(key)?current.filter((item)=>item!==key):current.length<2?[...current,key]:[current[1],key]);
  return <section className="border-t border-line p-5"><div><h3 className="font-semibold">Strategy Comparison</h3><p className="mt-1 text-xs text-muted">Scores are normalized from 0–100 across the selected visible strategies.</p></div><div className="mt-4 flex flex-wrap gap-2">{eligible.map((row)=><button key={row.key} className={selected.includes(String(row.key))?'btn-primary py-1.5':'btn-secondary py-1.5'} onClick={()=>toggle(String(row.key))}>{row.name}</button>)}</div>{!chosen.length?<div className="flex h-64 items-center justify-center text-sm text-muted">No eligible strategy data.</div>:<><ResponsiveContainer width="100%" height={390}><RadarChart data={data} outerRadius="70%"><PolarGrid stroke="#303947"/><PolarAngleAxis dataKey="metric" tick={{fill:'#94a3b8',fontSize:11}}/><Tooltip contentStyle={{background:'#0d1118',border:'1px solid #242c38',borderRadius:12}} formatter={(value,name)=>[`${number(value,1)}/100`,chosen.find((row)=>String(row.key)===name)?.name||name]}/>{chosen.map((row,index)=><Radar key={row.key} name={String(row.key)} dataKey={String(row.key)} stroke={colors[index]} fill={colors[index]} fillOpacity={0.12} strokeWidth={2}/>) }<Legend formatter={(key)=>chosen.find((row)=>String(row.key)===key)?.name||key}/></RadarChart></ResponsiveContainer><div className="grid gap-2 sm:grid-cols-2">{chosen.map((row)=><div className="rounded-lg border border-line p-3 text-xs text-muted" key={row.key}><p className="font-semibold text-white">{row.name}</p><p className="mt-1">Win rate {number(row.winRate||0,2)}% · PF {row.profitFactor==='INFINITY'?'∞':number(row.profitFactor||0,2)}</p><p className="mt-1">Avg win {money(row.averageWin||0,currency)} · Avg loss {money(row.averageLoss||0,currency)}</p><p className="mt-1">Net P&L {money(row.netProfitLoss,currency)} · Consistency {number(row.consistency||0,1)}/100</p></div>)}</div></>}</section>;
}
