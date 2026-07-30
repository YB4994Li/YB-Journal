import { useMemo, useRef, useState } from 'react';
import { ChevronDown, LoaderCircle, Plus, X } from 'lucide-react';
import { api, errorMessage } from '../../api/client.js';
import { canonicalStrategy, normalizeStrategyKey, normalizeTimeframe, STANDARD_TIMEFRAMES } from '../../utils/tradingLibrary.js';

export function StrategyCombobox({strategyId,value,onChange,currentStrategy}){
  const [items,setItems]=useState([]),[open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState(value||''),[active,setActive]=useState(0),[creating,setCreating]=useState(false);
  const loaded=useRef(false);
  const load=async(force=false)=>{if(loaded.current&&!force)return;setLoading(true);setError('');try{const {data}=await api.get('/strategies',{params:{status:'active'}});const unique=new Map();for(const item of data.data)unique.set(item.normalizedKey||normalizeStrategyKey(item.name),item);setItems([...unique.values()].sort((a,b)=>a.name.localeCompare(b.name)));loaded.current=true;}catch(e){setError(errorMessage(e));}finally{setLoading(false);}};
  const show=()=>{setOpen(true);setQuery(value||'');load();};
  const filtered=useMemo(()=>{const key=normalizeStrategyKey(query);return items.filter((item)=>!key||normalizeStrategyKey(item.name).includes(key));},[items,query]);
  const select=(item)=>{onChange({id:item.id,name:item.name,isArchived:item.isArchived});setQuery(item.name);setOpen(false);};
  const clear=()=>{onChange(null);setQuery('');setOpen(false);};
  const create=async()=>{const name=canonicalStrategy(query);if(!name)return;setCreating(true);setError('');try{const {data}=await api.post('/strategies',{name});loaded.current=false;await load(true);select(data.data);}catch(e){setError(errorMessage(e));}finally{setCreating(false);}};
  const keyDown=(event)=>{if(!open&&(event.key==='ArrowDown'||event.key==='Enter')){event.preventDefault();show();return;}if(event.key==='ArrowDown'){event.preventDefault();setActive((index)=>Math.min(index+1,filtered.length-1));}if(event.key==='ArrowUp'){event.preventDefault();setActive((index)=>Math.max(index-1,0));}if(event.key==='Enter'&&filtered[active]){event.preventDefault();select(filtered[active]);}if(event.key==='Escape')setOpen(false);};
  const archived=currentStrategy?.isArchived&&Number(strategyId)===Number(currentStrategy.id);
  return <div className="relative">
    <div className="relative"><input role="combobox" aria-expanded={open} aria-controls="strategy-options" className="field pr-20" value={open?query:value||''} placeholder="Select a strategy" onFocus={show} onClick={show} onChange={(e)=>{setQuery(e.target.value);setOpen(true);setActive(0);}} onKeyDown={keyDown}/>{strategyId&&<button type="button" aria-label="Clear strategy" className="absolute right-9 top-2.5 text-muted hover:text-white" onClick={clear}><X size={16}/></button>}<button type="button" aria-label="Open strategies" className="absolute right-3 top-2.5 text-muted" onClick={show}><ChevronDown size={16}/></button></div>
    {archived&&<span className="mt-1 inline-block rounded bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase text-amber-300">Archived</span>}
    {open&&<div id="strategy-options" role="listbox" className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-[#111720] p-1 shadow-2xl">
      {loading?<div className="flex items-center gap-2 p-3 text-sm text-muted"><LoaderCircle className="animate-spin" size={15}/> Loading strategies…</div>:error?<div className="p-3 text-sm text-rose-300"><p>{error}</p><button type="button" className="mt-2 underline" onClick={()=>load(true)}>Retry</button></div>:<>
        {filtered.map((item,index)=><button type="button" role="option" aria-selected={Number(strategyId)===Number(item.id)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${index===active?'bg-white/10':'hover:bg-white/5'}`} key={item.id} onMouseDown={(e)=>e.preventDefault()} onClick={()=>select(item)}>{item.name}</button>)}
        {!filtered.length&&<div className="p-3 text-sm text-muted">No strategies found in your Trading Library.</div>}
        <button type="button" className="flex w-full items-center gap-2 rounded-lg border-t border-line px-3 py-2 text-left text-sm text-lime hover:bg-lime/5" disabled={creating||!query.trim()} onMouseDown={(e)=>e.preventDefault()} onClick={create}><Plus size={14}/>{creating?'Creating…':`Create strategy${query.trim()?` “${canonicalStrategy(query)}”`:''}`}</button>
      </>}
    </div>}
  </div>;
}

export function TimeframeCombobox({value,onChange,timeframes=[]}){
  const values=[...new Set([...STANDARD_TIMEFRAMES,...timeframes.map((item)=>item.value)])];
  return <><input className="field" list="timeframe-library" value={value||''} onChange={(e)=>onChange(e.target.value)} onBlur={()=>onChange(normalizeTimeframe(value))} placeholder="Optional timeframe"/><datalist id="timeframe-library">{values.map((item)=><option key={item} value={item}/>)}</datalist></>;
}
