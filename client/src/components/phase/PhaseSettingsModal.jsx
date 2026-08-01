import {useEffect,useState} from 'react';
import Modal from '../ui/Modal.jsx';

export default function PhaseSettingsModal({open,phase,onClose,onSave,onArchive,onDelete,busy}){
  const [form,setForm]=useState(phase||{}); useEffect(()=>setForm(phase||{}),[phase]);
  if(!phase)return null; const set=(key,value)=>setForm((current)=>({...current,[key]:value}));
  const fields=[['initialBalance','Initial balance'],['profitTargetPercentage','Profit target %'],['maximumLossPercentage','Maximum loss %'],['dailyLossLimitPercentage','Daily loss limit %'],['minimumTradingDays','Minimum days']];
  return <Modal open={open} onClose={onClose} title={`${phase.name} settings`} subtitle="Trades remain isolated within this phase."><form onSubmit={(e)=>{e.preventDefault();onSave(form);}} className="space-y-4">
    <div><label className="label">Phase name</label><input className="field" required value={form.name||''} onChange={(e)=>set('name',e.target.value)}/></div>
    <div className="grid grid-cols-2 gap-3">{fields.map(([key,label])=><div key={key}><label className="label">{label}</label><input className="field" type="number" min="0" step={key==='minimumTradingDays'?'1':'0.0001'} value={form[key]??''} onChange={(e)=>set(key,e.target.value)}/></div>)}</div>
    <div className="flex flex-wrap gap-2 border-t border-line pt-4">
      <p className="w-full text-xs text-muted">{phase.status==='PASSED'?'Profit target reached automatically.':phase.status==='FAILED'?'Maximum loss limit reached automatically.':phase.status==='ACTIVE'?'Phase is currently active.':phase.status==='LOCKED'?'Complete the previous phase to unlock this phase.':'Phase is archived.'}</p>
      <button type="button" className="btn-secondary" onClick={onArchive}>Archive</button><button type="button" className="btn text-rose-400" onClick={onDelete}>Delete phase</button>
    </div><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>Save</button></div>
  </form></Modal>;
}
