import { seriesColor } from './chartPalette.js';

const valueTone=(name,value)=>{const label=String(name||'').toLowerCase(),numeric=Number(value);if(label.includes('loss'))return '#fb7185';if(label.includes('profit')||label.includes('p&l'))return numeric<0?'#fb7185':'#c7f36b';return undefined};

export default function PerformanceChartTooltip({active,payload,label,title,color,children,valueFormatter}){
  if(!active||!payload?.length)return null;
  const row=payload[0]?.payload||{};
  const heading=title||label||row.name||row.market||row.label||payload[0]?.name||'Details';
  const accent=typeof color==='function'?color(row,payload):color||seriesColor(row.name||row.market||heading);
  return <div className="performance-chart-tooltip" style={{'--tooltip-accent':accent}}>
    <p className="performance-chart-tooltip__title" style={{color:accent}}>{heading}</p>
    {children||payload.filter((entry)=>entry.value!=null).map((entry,index)=><div className="performance-chart-tooltip__row" key={`${entry.dataKey||entry.name}-${index}`}><span>{entry.name||entry.dataKey||'Value'}</span><strong style={{color:valueTone(entry.name||entry.dataKey,entry.value)}}>{valueFormatter?valueFormatter(entry.value,entry.name,row):entry.value}</strong></div>)}
  </div>;
}
