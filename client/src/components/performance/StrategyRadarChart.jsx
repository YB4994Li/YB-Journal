import { useEffect,useMemo,useState } from 'react';
import { Legend,PolarAngleAxis,PolarGrid,Radar,RadarChart,ResponsiveContainer,Tooltip } from 'recharts';
import { radarSeries } from '../../utils/performanceCharts.js';
import { money,number } from '../../utils/format.js';
import { seriesColor } from './chartPalette.js';

export default function StrategyRadarChart({rows,currency,entityLabel='strategy'}){
  const eligible=rows.filter((row)=>row.key!=='unassigned');
  const [selected,setSelected]=useState(()=>eligible.slice(0,2).map((row)=>String(row.key)));
  useEffect(()=>setSelected((current)=>{const valid=current.filter((key)=>eligible.some((row)=>String(row.key)===key));return valid.length?valid.slice(0,2):eligible.slice(0,2).map((row)=>String(row.key))}),[rows]);
  const chosen=useMemo(()=>selected.map((key)=>eligible.find((row)=>String(row.key)===key)).filter(Boolean),[selected,eligible]);
  const data=radarSeries(chosen),colorFor=(row)=>seriesColor(row.name);
  const toggle=(key)=>setSelected((current)=>current.includes(key)?current.filter((item)=>item!==key):current.length<2?[...current,key]:[current[1],key]);
  return <section className="border-t border-line pt-4">
    <div className="flex flex-wrap gap-2">{eligible.map((row)=>{const color=colorFor(row),active=selected.includes(String(row.key));return <button key={row.key} className="btn-secondary py-1.5" style={active?{borderColor:`${color}66`,color,backgroundColor:`${color}18`,boxShadow:`0 0 12px ${color}22`}:undefined} onClick={()=>toggle(String(row.key))}>{row.name}</button>})}</div>
    {!chosen.length?<div className="flex h-64 items-center justify-center text-sm text-muted">No eligible strategy data.</div>:<div className="strategy-radar-layout">
      <ResponsiveContainer width="100%" height={350}><RadarChart data={data} outerRadius="70%"><PolarGrid stroke="#3a4555" strokeOpacity={.72}/><PolarAngleAxis dataKey="metric" tick={{fill:'#b4bfce',fontSize:11,fontWeight:500}}/><Tooltip contentStyle={{background:'#11161e',border:'1px solid #303947',borderRadius:12,boxShadow:'0 14px 34px rgba(0,0,0,.42)',fontSize:12}} formatter={(value,name)=>[`${number(value,1)}/100`,chosen.find((row)=>String(row.key)===name)?.name||name]}/>{chosen.map((row)=>{const color=colorFor(row);return <Radar key={row.key} name={String(row.key)} dataKey={String(row.key)} stroke={color} fill={color} fillOpacity={.18} strokeWidth={2.75} dot={{r:4,fill:color,stroke:'#e2e8f0',strokeWidth:1}} style={{filter:`drop-shadow(0 0 4px ${color}55)`}} isAnimationActive animationDuration={520}/>})}<Legend formatter={(key)=>chosen.find((row)=>String(row.key)===key)?.name||key}/></RadarChart></ResponsiveContainer>
      <div className="space-y-3">{chosen.map((row)=><article className="rounded-xl border border-line bg-ink/25 p-4 text-sm" key={row.key}><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor:colorFor(row)}}/><p className="font-semibold text-white">{row.name}</p></div><dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3"><div><dt className="text-xs text-muted">Win rate</dt><dd className="mt-0.5 font-medium">{number(row.winRate||0,2)}%</dd></div><div><dt className="text-xs text-muted">Profit factor</dt><dd className="mt-0.5 font-medium">{row.profitFactor==='INFINITY'?'∞':number(row.profitFactor||0,2)}</dd></div><div><dt className="text-xs text-muted">Average win</dt><dd className="mt-0.5 font-medium">{money(row.averageWin||0,currency)}</dd></div><div><dt className="text-xs text-muted">Average loss</dt><dd className="mt-0.5 font-medium text-rose-400">{money(row.averageLoss||0,currency)}</dd></div><div><dt className="text-xs text-muted">Net P&amp;L</dt><dd className={row.netProfitLoss<0?'mt-0.5 font-medium text-rose-400':'mt-0.5 font-medium text-lime'}>{money(row.netProfitLoss,currency)}</dd></div><div><dt className="text-xs text-muted">Consistency</dt><dd className="mt-0.5 font-medium">{number(row.consistency||0,1)}/100</dd></div></dl></article>)}</div>
    </div>}
  </section>;
}
