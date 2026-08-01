import { Plus } from 'lucide-react';
import PhaseConfigurationForm from './PhaseConfigurationForm.jsx';

const phase = (name,type,balance,status='LOCKED') => ({ name,phaseType:type,status,initialBalance:balance,profitTargetPercentage:type==='FUNDED_LIVE'?'':'10',maximumLossPercentage:'10',dailyLossLimitPercentage:'5',minimumTradingDays:'0' });
export function generatePhases(count, balance, includeLive=true) {
  const phases=Array.from({length:Number(count)||0},(_,index)=>phase(`Phase ${index+1}`,index===0?'EVALUATION':'VERIFICATION',balance,index===0?'ACTIVE':'LOCKED'));
  if(includeLive) phases.push(phase('Funded / Live','FUNDED_LIVE',balance,phases.length?'LOCKED':'ACTIVE'));
  return phases;
}
export default function FundedChallengeSetup({ mode,setMode,phases,setPhases,accountSize }) {
  const choose=(value)=>{setMode(value);if(value!=='CUSTOM')setPhases(generatePhases(value,accountSize,true));};
  const change=(index,value)=>setPhases((current)=>current.map((item,i)=>i===index?value:item));
  const remove=(index)=>setPhases((current)=>current.filter((_,i)=>i!==index));
  const move=(index,direction)=>setPhases((current)=>{const next=[...current],target=index+direction;[next[index],next[target]]=[next[target],next[index]];return next;});
  const add=()=>setPhases((current)=>[...current,phase(`Custom phase ${current.filter((item)=>item.phaseType!=='FUNDED_LIVE').length+1}`,'CUSTOM',accountSize,current.some((item)=>item.status==='ACTIVE')?'LOCKED':'ACTIVE')]);
  const hasLive=phases.some((item)=>item.phaseType==='FUNDED_LIVE');
  const toggleLive=()=>setPhases((current)=>hasLive?current.filter((item)=>item.phaseType!=='FUNDED_LIVE'):[...current,phase('Funded / Live','FUNDED_LIVE',accountSize,current.some((item)=>item.status==='ACTIVE')?'LOCKED':'ACTIVE')]);
  return <div className="space-y-4"><div><label className="label">How many evaluation phases does this funded challenge have?</label><div className="flex flex-wrap gap-2">{['0','1','2','3','CUSTOM'].map((value)=><button key={value} type="button" className={mode===value?'btn-primary':'btn-secondary'} onClick={()=>choose(value)}>{value==='CUSTOM'?'Custom':`${value} phases`}</button>)}</div><p className="mt-2 text-xs text-muted">Funded / Live is separate and is not counted as an evaluation phase.</p></div>
    {mode==='CUSTOM'&&<div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={add}><Plus size={15}/> Add phase</button><label className="inline-flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={hasLive} onChange={toggleLive}/> Include final Funded / Live phase</label></div>}
    <div className="space-y-3">{phases.map((item,index)=><PhaseConfigurationForm key={`${item.phaseType}-${index}`} phase={item} index={index} count={phases.length} onChange={change} onRemove={remove} onMove={move}/>)}</div>
  </div>;
}
