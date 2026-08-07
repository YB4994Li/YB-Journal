import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { seriesColor } from './chartPalette.js';

const GAP=12,EDGE=8;
let pointer={x:0,y:0};
if(typeof window!=='undefined'&&!window.__ybChartTooltipPointer){
  window.__ybChartTooltipPointer=true;
  window.addEventListener('pointermove',(event)=>{pointer={x:event.clientX,y:event.clientY}},{passive:true});
}

const valueTone=(name,value)=>{const label=String(name||'').toLowerCase(),numeric=Number(value);if(label.includes('loss'))return '#fb7185';if(label.includes('profit')||label.includes('p&l'))return numeric<0?'#fb7185':'#c7f36b';return undefined};

export default function PerformanceChartTooltip({active,payload,label,title,color,children,valueFormatter}){
  const surfaceRef=useRef(null),[size,setSize]=useState({width:180,height:80});
  useLayoutEffect(()=>{if(active&&surfaceRef.current){const box=surfaceRef.current.getBoundingClientRect();if(box.width!==size.width||box.height!==size.height)setSize({width:box.width,height:box.height})}},[active,payload,children,size.width,size.height]);
  if(!active||!payload?.length||typeof document==='undefined')return null;
  const row=payload[0]?.payload||{};
  const heading=title||label||row.name||row.market||row.label||payload[0]?.name||'Details';
  const accent=typeof color==='function'?color(row,payload):color||seriesColor(row.name||row.market||heading);
  const viewportWidth=window.innerWidth,viewportHeight=window.innerHeight;
  let left=pointer.x+GAP,top=pointer.y+GAP;
  if(left+size.width>viewportWidth-EDGE)left=pointer.x-size.width-GAP;
  if(top+size.height>viewportHeight-EDGE)top=pointer.y-size.height-GAP;
  left=Math.max(EDGE,Math.min(left,viewportWidth-size.width-EDGE));
  top=Math.max(EDGE,Math.min(top,viewportHeight-size.height-EDGE));
  return createPortal(<div ref={surfaceRef} className="performance-chart-tooltip performance-chart-tooltip--portal" style={{'--tooltip-accent':accent,left,top}}>
    <p className="performance-chart-tooltip__title" style={{color:accent}}>{heading}</p>
    {children||payload.filter((entry)=>entry.value!=null).map((entry,index)=><div className="performance-chart-tooltip__row" key={`${entry.dataKey||entry.name}-${index}`}><span>{entry.name||entry.dataKey||'Value'}</span><strong style={{color:valueTone(entry.name||entry.dataKey,entry.value)}}>{valueFormatter?valueFormatter(entry.value,entry.name,row):entry.value}</strong></div>)}
  </div>,document.body);
}
