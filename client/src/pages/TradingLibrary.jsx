import { useEffect,useState } from 'react';
import { Link,useLocation } from 'react-router-dom';
import { api,errorMessage } from '../api/client.js';
import { STANDARD_TIMEFRAMES } from '../utils/tradingLibrary.js';
import AccountsCenterLayout from '../components/account/AccountsCenterLayout.jsx';

export default function TradingLibrary(){
  const location=useLocation(),timeframeTab=location.pathname.endsWith('/timeframes');
  const [strategies,setStrategies]=useState([]),[archived,setArchived]=useState(false),[name,setName]=useState(''),[error,setError]=useState('');
  const load=async()=>{try{const {data}=await api.get('/strategies',{params:{archived}});setStrategies(data.data);}catch(e){setError(errorMessage(e));}};
  useEffect(()=>{load();},[archived]);
  const create=async(e)=>{e.preventDefault();if(!name.trim())return;await api.post('/strategies',{name});setName('');await load();};
  const rename=async(item)=>{const next=window.prompt('Strategy name',item.name);if(!next||next===item.name)return;await api.patch(`/strategies/${item.id}`,{name:next});await load();};
  const toggle=async(item)=>{if(!window.confirm(`${archived?'Restore':'Archive'} ${item.name}?`))return;await api.post(`/strategies/${item.id}/${archived?'restore':'archive'}`);await load();};
  return <AccountsCenterLayout section="library" showOpenJournal={false}><main className="mx-auto max-w-5xl space-y-6 px-6 py-7"><div><h2 className="text-xl font-semibold">Trading Library</h2><p className="mt-1 text-sm text-muted">Manage the strategies and timeframes used across your trades.</p><div className="mt-4 flex gap-2"><Link className={!timeframeTab?'btn-primary':'btn-secondary'} to="/accounts/library/strategies">Strategies</Link><Link className={timeframeTab?'btn-primary':'btn-secondary'} to="/accounts/library/timeframes">Timeframes</Link></div></div>{error&&<p className="text-rose-400">{error}</p>}
    {!timeframeTab?<section className="card p-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Strategies</h3><p className="mt-1 text-xs text-muted">Case and whitespace duplicates reuse one canonical strategy.</p></div><label className="text-sm text-muted"><input className="mr-2" type="checkbox" checked={archived} onChange={(e)=>setArchived(e.target.checked)}/>Archived</label></div><form className="mt-4 flex gap-2" onSubmit={create}><input className="field" value={name} onChange={(e)=>setName(e.target.value)} placeholder="New strategy"/><button className="btn-primary">Add Strategy</button></form><div className="mt-4 divide-y divide-line">{strategies.map((item)=><div className="flex items-center justify-between py-3" key={item.id}><div><p className="font-medium">{item.name}</p>{item.description&&<p className="text-xs text-muted">{item.description}</p>}<p className="text-xs text-muted">{item._count.trades} trades</p></div><div className="flex gap-2"><button className="btn-secondary py-1.5" onClick={()=>rename(item)}>Rename</button><button className="btn-secondary py-1.5" onClick={()=>toggle(item)}>{archived?'Restore':'Archive'}</button></div></div>)}</div></section>
    :<section className="card p-5"><h3 className="font-semibold">System Timeframes</h3><p className="mt-1 text-xs text-muted">Custom values remain supported and are normalized when used.</p><div className="mt-4 flex flex-wrap gap-2">{STANDARD_TIMEFRAMES.map((item)=><span className="rounded-lg border border-line bg-ink px-3 py-2 text-sm" key={item}>{item}</span>)}</div></section>}
  </main></AccountsCenterLayout>;
}
