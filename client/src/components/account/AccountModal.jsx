import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import AccountTypeSelector from './AccountTypeSelector.jsx';
import FundedChallengeSetup, { generatePhases } from './FundedChallengeSetup.jsx';

const blank={name:'',accountType:'REAL',currency:'USD',broker:'',propFirm:'',platform:'',externalReference:'',status:'ACTIVE',notes:'',initialCapital:'',accountSize:''};
export default function AccountModal({ open, account, onClose, onSave, onDelete, busy }) {
  const [form,setForm]=useState(blank),[phaseMode,setPhaseMode]=useState('2'),[phases,setPhases]=useState([]);
  useEffect(()=>{if(!open)return;if(account){setForm({...blank,...account});setPhases(account.phases||[]);}else{setForm(blank);setPhaseMode('2');setPhases([]);}},[open,account]);
  const set=(key,value)=>{setForm((current)=>({...current,[key]:value}));if(key==='accountSize'&&!account&&phaseMode!=='CUSTOM')setPhases(generatePhases(phaseMode,value,true));};
  const type=(value)=>{set('accountType',value);if(value==='FUNDED'&&!phases.length)setPhases(generatePhases(phaseMode,form.accountSize,true));};
  const submit=(event)=>{event.preventDefault();onSave({...form,...(form.accountType==='FUNDED'?{phases:phases.map((item,index)=>({...item,orderIndex:index}))}:{phases:[]})});};
  return <Modal open={open} onClose={onClose} title={account?'Account settings':'Create trading account'} subtitle="Real accounts have one journal; funded accounts isolate performance by phase." wide>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div><label className="label">Account name</label><input className="field" required maxLength="120" value={form.name} onChange={(e)=>set('name',e.target.value)}/></div>
        <AccountTypeSelector value={form.accountType} onChange={type} disabled={!!account}/>
        <div><label className="label">Currency</label><select className="field" value={form.currency} onChange={(e)=>set('currency',e.target.value)}>{['USD','EUR','GBP','MAD'].map((value)=><option key={value}>{value}</option>)}</select></div>
        <div><label className="label">Broker</label><input className="field" value={form.broker||''} onChange={(e)=>set('broker',e.target.value)}/></div>
        {form.accountType==='FUNDED'&&<div><label className="label">Prop firm name</label><input className="field" required value={form.propFirm||''} onChange={(e)=>set('propFirm',e.target.value)}/></div>}
        <div><label className="label">Platform</label><input className="field" value={form.platform||''} onChange={(e)=>set('platform',e.target.value)}/></div>
        <div><label className="label">External reference</label><input className="field" value={form.externalReference||''} onChange={(e)=>set('externalReference',e.target.value)}/></div>
        {account&&<div><label className="label">Status</label><select className="field" value={form.status||'ACTIVE'} onChange={(e)=>set('status',e.target.value)}>{['ACTIVE','PAUSED','PASSED','FAILED','CLOSED','ARCHIVED'].map((value)=><option key={value}>{value}</option>)}</select></div>}
        {form.accountType==='REAL'?<div><label className="label">Initial capital</label><input className="field" required min="0" step="0.01" type="number" value={form.initialCapital} onChange={(e)=>set('initialCapital',e.target.value)}/></div>:<div><label className="label">Account size</label><input className="field" required min="0.01" step="0.01" type="number" value={form.accountSize||''} onChange={(e)=>set('accountSize',e.target.value)}/></div>}
      </div>
      <div><label className="label">Notes</label><textarea className="field min-h-20" maxLength="5000" value={form.notes||''} onChange={(e)=>set('notes',e.target.value)}/></div>
      {!account&&form.accountType==='FUNDED'&&<FundedChallengeSetup mode={phaseMode} setMode={setPhaseMode} phases={phases} setPhases={setPhases} accountSize={form.accountSize}/>}
      <div className="flex justify-between gap-3 border-t border-line pt-4">{account?<button type="button" className="btn text-rose-400 hover:bg-rose-500/10" onClick={onDelete}>Delete account</button>:<span/>}<div className="flex gap-3"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy||(!account&&form.accountType==='FUNDED'&&!phases.length)}>{busy?'Saving…':'Save account'}</button></div></div>
    </form>
  </Modal>;
}
