import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';

export default function PhaseConfigurationForm({ phase, index, count, onChange, onRemove, onMove }) {
  const set=(key,value)=>onChange(index,{...phase,[key]:value});
  return <div className="rounded-xl border border-line bg-ink/40 p-4">
    <div className="mb-3 flex items-center gap-2"><span className="text-xs font-semibold uppercase text-muted">Phase {index+1}</span><span className="rounded bg-white/5 px-2 py-1 text-[10px] text-muted">{phase.phaseType.replaceAll('_',' ')}</span><div className="ml-auto flex gap-1">
      <button type="button" className="rounded p-1 text-muted hover:text-white" disabled={!index} onClick={()=>onMove(index,-1)}><ArrowUp size={15}/></button>
      <button type="button" className="rounded p-1 text-muted hover:text-white" disabled={index===count-1} onClick={()=>onMove(index,1)}><ArrowDown size={15}/></button>
      <button type="button" className="rounded p-1 text-rose-400" onClick={()=>onRemove(index)}><Trash2 size={15}/></button>
    </div></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div><label className="label">Name</label><input className="field" required value={phase.name} onChange={(e)=>set('name',e.target.value)}/></div>
      <div><label className="label">Initial balance</label><input className="field" required min="0.01" step="0.01" type="number" value={phase.initialBalance} onChange={(e)=>set('initialBalance',e.target.value)}/></div>
      <div><label className="label">Profit target %</label><input className="field" min="0" step="0.1" type="number" value={phase.profitTargetPercentage} onChange={(e)=>set('profitTargetPercentage',e.target.value)}/></div>
      <div><label className="label">Maximum loss %</label><input className="field" min="0" step="0.1" type="number" value={phase.maximumLossPercentage} onChange={(e)=>set('maximumLossPercentage',e.target.value)}/></div>
      <div><label className="label">Daily loss limit %</label><input className="field" min="0" step="0.1" type="number" value={phase.dailyLossLimitPercentage} onChange={(e)=>set('dailyLossLimitPercentage',e.target.value)}/></div>
      <div><label className="label">Minimum trading days</label><input className="field" min="0" step="1" type="number" value={phase.minimumTradingDays} onChange={(e)=>set('minimumTradingDays',e.target.value)}/></div>
    </div>
  </div>;
}
