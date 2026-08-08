import { useId } from 'react';

const WIDTH=320,HEIGHT=80,PAD=5;

export default function AccountBalanceSparkline({history=[]}){
  const gradientId=`account-spark-${useId().replaceAll(':','')}`;
  const values=history.map((row)=>Number(row.balance)).filter(Number.isFinite);
  if(!values.length)return <div className="flex h-20 items-center justify-center rounded-lg border border-line/70 bg-ink/20 text-[11px] text-muted">No trading history yet</div>;
  const minimum=Math.min(...values),maximum=Math.max(...values),range=maximum-minimum||1;
  const points=values.map((value,index)=>({x:PAD+(values.length===1?0.5:index/(values.length-1))*(WIDTH-PAD*2),y:PAD+(maximum-value)/range*(HEIGHT-PAD*2)}));
  if(points.length===1)points.push({x:WIDTH-PAD,y:points[0].y});
  const line=points.map((point,index)=>`${index?'L':'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
  const area=`${line} L${points.at(-1).x},${HEIGHT-PAD} L${points[0].x},${HEIGHT-PAD} Z`;
  const profitable=values.at(-1)>=values[0],color=profitable?'#c7f36b':'#fb7185';
  return <div className="h-20 w-full overflow-hidden rounded-lg bg-ink/15" aria-label={`Balance ${profitable?'gain':'loss'} sparkline`}>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-full w-full" role="img">
      <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={area} fill={`url(#${gradientId})`}/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{filter:`drop-shadow(0 0 3px ${color}55)`}}>
        <animate attributeName="stroke-dasharray" from="0 1000" to="1000 0" dur=".55s" fill="freeze"/>
      </path>
    </svg>
  </div>;
}
