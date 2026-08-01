import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Settings, Trash2, Upload, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { money, number } from '../utils/format.js';
import { useDebounce } from '../hooks/useDebounce.js';
import AccountModal from '../components/account/AccountModal.jsx';
import BalanceChart from '../components/chart/BalanceChart.jsx';
import MarketsTradedChart from '../components/chart/MarketsTradedChart.jsx';
import TradeFilters from '../components/trade/TradeFilters.jsx';
import TradeTable from '../components/trade/TradeTable.jsx';
import TradeFormModal from '../components/trade/TradeFormModal.jsx';
import TradeViewModal from '../components/trade/TradeViewModal.jsx';
import CsvImportModal from '../components/csv/CsvImportModal.jsx';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';
import Modal from '../components/ui/Modal.jsx';
import Toast from '../components/ui/Toast.jsx';
import PhaseTabs from '../components/phase/PhaseTabs.jsx';
import AccountOverview from '../components/phase/AccountOverview.jsx';
import PhaseOverview from '../components/phase/PhaseOverview.jsx';
import PhaseSettingsModal from '../components/phase/PhaseSettingsModal.jsx';

const initialFilters = { page:1, limit:Number(localStorage.getItem('journalPageSize')||10), search:'', market:'', strategy:'', session:'', timeframe:'', direction:'', result:'', startDate:'', endDate:'', sortBy:'tradeDate', sortOrder:'desc' };

export default function Dashboard() {
  const [accounts,setAccounts]=useState([]), [accountId,setAccountId]=useState(null);
  const [stats,setStats]=useState(null), [history,setHistory]=useState([]), [trades,setTrades]=useState({items:[],pagination:{}});
  const [filters,setFilters]=useState(initialFilters), [loading,setLoading]=useState(true), [tableLoading,setTableLoading]=useState(false), [error,setError]=useState('');
  const [accountSettings,setAccountSettings]=useState(false), [tradeModal,setTradeModal]=useState(false), [csvModal,setCsvModal]=useState(false);
  const [editing,setEditing]=useState(null), [viewing,setViewing]=useState(null), [image,setImage]=useState(null), [confirm,setConfirm]=useState(null), [busy,setBusy]=useState(false), [toast,setToast]=useState(null);
  const [selectedIds,setSelectedIds]=useState(()=>new Set()), [selectingAll,setSelectingAll]=useState(false);
  const [phaseId,setPhaseId]=useState(null), [phaseSettings,setPhaseSettings]=useState(false);
  const [filterOptions,setFilterOptions]=useState({markets:[],strategies:[],timeframes:[]}), [marketRefreshKey,setMarketRefreshKey]=useState(0), [updating,setUpdating]=useState(false);
  const debouncedSearch=useDebounce(filters.search);
  const account=accounts.find((item)=>item.id===accountId);
  const phases=account?.phases||[], phase=phases.find((item)=>item.id===phaseId);
  const canTrade=Boolean(account)&&account.status==='ACTIVE'&&(account.accountType!=='FUNDED'||phase?.status==='ACTIVE');
  const blockedMessage=account?.status==='FAILED'?'Account loss limit reached.':phase?.status==='FAILED'?'Maximum loss limit reached.':phase?.status==='LOCKED'?'Complete the previous phase to unlock this phase.':null;
  const notify=(message,type='success')=>{setToast({message,type});setTimeout(()=>setToast(null),4500);};

  const loadAccounts=useCallback(async()=>{
    const {data}=await api.get('/accounts'); setAccounts(data.data);
    const requested=Number(new URLSearchParams(window.location.search).get('accountId'));
    setAccountId((current)=>data.data.some((a)=>a.id===requested)?requested:data.data.some((a)=>a.id===current)?current:(data.data.find((a)=>a.status!=='ARCHIVED')?.id||null));
  },[]);
  const refreshSummary=useCallback(async(id,currentPhaseId)=>{
    if(!id)return; const params=currentPhaseId?{phaseId:currentPhaseId}:{};const [s,h]=await Promise.all([api.get(`/accounts/${id}/statistics`,{params}),api.get(`/accounts/${id}/balance-history`,{params})]);
    setStats(s.data.data);setHistory(h.data.data);
  },[]);
  const loadTrades=useCallback(async(id,current,currentPhaseId)=>{
    if(!id)return;setTableLoading(true);setError('');
    try{const params={...current,search:debouncedSearch,...(currentPhaseId?{phaseId:currentPhaseId}:{})};Object.keys(params).forEach((k)=>params[k]===''&&delete params[k]);const {data}=await api.get(`/accounts/${id}/trades`,{params});setTrades(data.data);}
    catch(e){setError(errorMessage(e));}finally{setTableLoading(false);}
  },[debouncedSearch]);
  const refreshJournalData=useCallback(async()=>{
    if(!accountId)return;
    setUpdating(true);
    try{
      await loadAccounts();
      await Promise.all([refreshSummary(accountId,phaseId),loadTrades(accountId,filters,phaseId)]);
      setMarketRefreshKey((value)=>value+1);
    }finally{setUpdating(false);}
  },[accountId,phaseId,filters,loadAccounts,refreshSummary,loadTrades]);
  useEffect(()=>{(async()=>{try{await loadAccounts();}catch(e){notify(errorMessage(e),'error');}finally{setLoading(false);}})();},[loadAccounts]);
  useEffect(()=>{if(!account)return;if(account.accountType==='FUNDED'){const requested=Number(new URLSearchParams(window.location.search).get('phaseId')),next=account.phases.find((item)=>item.id===requested)||account.phases.find((item)=>item.status==='ACTIVE')||account.phases[0];setPhaseId((current)=>account.phases.some((item)=>item.id===current)?current:next?.id||null);}else setPhaseId(null);},[account]);
  useEffect(()=>{if(accountId&&(!account||account.accountType==='REAL'||phaseId)){refreshSummary(accountId,phaseId).catch((e)=>notify(errorMessage(e),'error'));}},[accountId,phaseId,account?.accountType,refreshSummary]);
  useEffect(()=>{if(accountId&&(!account||account.accountType==='REAL'||phaseId))loadTrades(accountId,filters,phaseId);},[accountId,phaseId,account?.accountType,filters.page,filters.limit,filters.market,filters.strategy,filters.session,filters.timeframe,filters.direction,filters.result,filters.startDate,filters.endDate,filters.sortBy,filters.sortOrder,debouncedSearch]);
  useEffect(()=>{setSelectedIds(new Set());},[accountId,phaseId,filters.market,filters.strategy,filters.session,filters.timeframe,filters.direction,filters.result,filters.startDate,filters.endDate,debouncedSearch]);
  useEffect(()=>{if(!accountId||account?.accountType==='FUNDED'&&!phaseId)return;let active=true;const params={...(phaseId?{phaseId}:{}),dateFrom:filters.startDate||undefined,dateTo:filters.endDate||undefined};api.get(`/accounts/${accountId}/journal/filter-options`,{params}).then(({data})=>{if(!active)return;const options=data.data;setFilterOptions(options);setFilters((current)=>({...current,...(current.market&&!options.markets.some((item)=>item.value===current.market)?{market:''}:{}),...(current.strategy&&!options.strategies.some((item)=>item.normalizedKey===current.strategy.trim().toLowerCase())?{strategy:''}:{}),...(current.timeframe&&!options.timeframes.some((item)=>item.value===current.timeframe)?{timeframe:''}:{}),page:1}));}).catch((e)=>notify(errorMessage(e),'error'));return()=>{active=false;};},[accountId,phaseId,account?.accountType,filters.startDate,filters.endDate,marketRefreshKey]);

  const saveAccount=async(form)=>{
    setBusy(true);try{const response=await api.patch(`/accounts/${account.id}`,form);notify(response.data.message);setAccountSettings(false);await loadAccounts();await refreshSummary(account.id,phaseId);}
    catch(e){notify(errorMessage(e),'error');}finally{setBusy(false);}
  };
  const saveTrade=async(form,screenshot)=>{
    setBusy(true);try{
      const payload={...form,...(account?.accountType==='FUNDED'?{phaseId}: {})};const response=editing?await api.put(`/trades/${editing.id}`,payload):await api.post(`/accounts/${accountId}/trades`,payload);const trade=response.data.data;
      if(screenshot){const body=new FormData();body.append('screenshot',screenshot);await api.post(`/trades/${trade.id}/screenshot`,body);}
      await refreshJournalData();notify(editing?'Trade updated successfully':'Trade created successfully');setTradeModal(false);setEditing(null);
    }catch(e){notify(errorMessage(e),'error');}finally{setBusy(false);}
  };
  const duplicate=async(trade)=>{if(busy||updating)return;setBusy(true);try{const {data}=await api.post(`/trades/${trade.id}/duplicate`);await refreshJournalData();notify(data.message);}catch(e){notify(errorMessage(e),'error');}finally{setBusy(false);}};
  const executeDelete=async()=>{
    if(!confirm)return;setBusy(true);try{
      if(confirm.type==='phaseAction'){
        await api.post(`/phases/${confirm.item.id}/archive`);notify('Phase archived');setPhaseSettings(false);setConfirm(null);await reloadAccount();return;
      }
      if(confirm.type==='phaseReevaluate'){await api.patch(`/phases/${confirm.item.id}`,{...confirm.form,confirmLifecycleReevaluation:true});notify('Phase settings saved and lifecycle re-evaluated');setPhaseSettings(false);setConfirm(null);await reloadAccount();return;}
      if(confirm.type==='account'){await api.delete(`/accounts/${accountId}`);setAccountSettings(false);setAccountId(null);await loadAccounts();}
      else if(confirm.type==='phase'){await api.delete(`/phases/${phaseId}`);setPhaseSettings(false);setPhaseId(null);await loadAccounts();}
      else if(confirm.type==='bulk'){
        const {data}=await api.delete('/trades/bulk',{data:{tradeIds:[...selectedIds]}});
        setSelectedIds(new Set());await refreshJournalData();notify(`${data.data.deletedCount} selected trades deleted successfully`);setConfirm(null);return;
      }else{await api.delete(`/trades/${confirm.item.id}`);await refreshJournalData();}
      notify(confirm.type==='account'?'Account deleted':'Trade deleted');setConfirm(null);
    }catch(e){notify(errorMessage(e),'error');}finally{setBusy(false);}
  };
  const toggleTrade=(id,checked)=>setSelectedIds((current)=>{const next=new Set(current);checked?next.add(id):next.delete(id);return next;});
  const toggleVisible=(ids,checked)=>setSelectedIds((current)=>{const next=new Set(current);ids.forEach((id)=>checked?next.add(id):next.delete(id));return next;});
  const selectAllFiltered=async()=>{
    setSelectingAll(true);try{
      const params={...filters,search:debouncedSearch,...(phaseId?{phaseId}:{})};delete params.page;delete params.limit;delete params.sortBy;delete params.sortOrder;
      Object.keys(params).forEach((key)=>params[key]===''&&delete params[key]);
      const {data}=await api.get(`/accounts/${accountId}/trades/ids`,{params});setSelectedIds(new Set(data.data));
    }catch(e){notify(errorMessage(e),'error');}finally{setSelectingAll(false);}
  };
  const reloadAccount=refreshJournalData;
  const savePhase=async(form)=>{const changed=['initialBalance','profitTargetPercentage','maximumLossPercentage'].some((key)=>String(form[key]??'')!==String(phase[key]??''));if(['PASSED','FAILED'].includes(phase.status)&&changed){setConfirm({type:'phaseReevaluate',item:phase,form});return;}setBusy(true);try{await api.patch(`/phases/${phaseId}`,form);notify('Phase updated');setPhaseSettings(false);await reloadAccount();}catch(e){notify(errorMessage(e),'error');}finally{setBusy(false);}};
  const deleteScreenshot=async()=>{try{await api.delete(`/trades/${viewing.id}/screenshot`);setViewing({...viewing,screenshotPath:null});notify('Screenshot deleted');await loadTrades(accountId,filters);}catch(e){notify(errorMessage(e),'error');}};
  const cards=useMemo(()=>[
    ['Current balance',stats&&money(stats.currentBalance,account?.currency),stats&&`${stats.netProfitLoss>=0?'+':''}${money(stats.netProfitLoss,account?.currency)} net`],
    ['Win rate',stats?`${number(stats.winRate,2)}%`:'—',stats&&`${stats.winningTrades}W · ${stats.losingTrades}L · ${stats.breakEvenTrades}BE`],
    ['Total trades',stats?.totalTrades??'—','Recorded journal entries']
  ],[stats,account]);
  const confirmationDetails=(()=>{
    if(confirm?.type==='phaseReevaluate')return{title:`Re-evaluate ${confirm.item.name}?`,message:'Changing these financial rules may change this phase status and lock or activate later phases.',confirmLabel:'Save and re-evaluate',variant:'WARNING'};
    if(confirm?.type==='phaseAction'){
      const labels={archive:['Archive phase','The phase and its trades will be preserved, but the phase will be archived.','WARNING']};
      const [label,message,variant]=labels[confirm.action];return{title:confirm.action==='pass'?`Mark ${confirm.item.name} as passed?`:`${label} — ${confirm.item.name}?`,message,confirmLabel:label,variant};
    }
    if(confirm?.type==='account')return{title:'Delete account?',message:'This permanently deletes the account, all phases, and every related trade.',confirmLabel:'Delete account',variant:'DANGER'};
    if(confirm?.type==='phase')return{title:'Delete phase?',message:`Deleting ${phase?.name||'this phase'} permanently deletes its ${phase?._count?.trades||0} trades. This cannot be undone.`,confirmLabel:'Delete phase',variant:'DANGER'};
    if(confirm?.type==='bulk')return{title:'Delete selected trades?',message:`Are you sure you want to delete ${selectedIds.size} selected trades?`,confirmLabel:'Delete trades',variant:'DANGER'};
    return{title:'Delete trade?',message:'This permanently deletes the trade and its screenshot file when present.',confirmLabel:'Delete trade',variant:'DANGER'};
  })();

  if(loading)return <div className="flex min-h-screen items-center justify-center text-muted">Loading trading journal…</div>;
  return <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(199,243,107,.05),transparent_24%)]">
    <header className="border-b border-line bg-ink/80 backdrop-blur"><div className="mx-auto flex max-w-[1700px] items-center justify-between px-5 py-4 lg:px-8">
      <div className="flex items-center gap-3">
        <img src="/yb-journal-logo.png" alt="YB-Journal logo" className="h-16 w-16 shrink-0 object-contain" />
        <div>
          <h1 className="font-semibold tracking-tight"><span className="text-lime">YB</span><span className="text-white">-Journal</span></h1>
          <p className="text-xs text-muted">Trade the plan. Study the outcome.</p>
        </div>
      </div>
      <div className="flex gap-2"><Link className="btn-secondary" to="/accounts">Accounts Center</Link>{updating&&<span className="self-center text-xs text-muted">Updating…</span>}<button className="btn-secondary" title={blockedMessage||''} onClick={()=>setCsvModal(true)} disabled={!canTrade||updating}><Upload size={16}/><span className="hidden sm:inline">Import CSV</span></button><button className="btn-primary" title={blockedMessage||''} onClick={()=>{setEditing(null);setTradeModal(true);}} disabled={!canTrade||updating}><Plus size={17}/> Add trade</button></div>
    </div></header>
    <main className="mx-auto max-w-[1700px] space-y-5 px-5 py-7 lg:px-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-xs font-medium uppercase tracking-[.2em] text-lime">Overview</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Trading performance</h2><p className="mt-2 text-sm text-muted">Review execution, risk, and realized results.</p></div>
        {account&&<button className="btn-secondary px-3" onClick={()=>setAccountSettings(true)} title="Account settings"><Settings size={17}/><span className="hidden sm:inline">Settings</span></button>}
      </section>
      {!account?<section className="card flex min-h-80 flex-col items-center justify-center p-8 text-center"><WalletCards className="text-lime" size={42}/><h3 className="mt-5 text-xl font-semibold">No active trading account</h3><p className="mt-2 max-w-md text-sm text-muted">Create or select an account from Accounts Center.</p><Link className="btn-primary mt-5" to="/accounts"><Plus size={17}/> Open Accounts Center</Link></section>:<>
        {account.accountType==='FUNDED'&&<><AccountOverview account={account} phases={phases}/><div className="min-w-0"><PhaseTabs phases={phases} value={phaseId} onChange={(id)=>{setPhaseId(id);setFilters((current)=>({...current,page:1}));}}/></div><PhaseOverview phase={phase} currency={account.currency} onSettings={()=>setPhaseSettings(true)}/></>}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value,detail])=><article className="card p-5" key={label}><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-xs text-muted">{detail}</p></article>)}</section>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]"><BalanceChart data={history} currency={account.currency} loading={!stats} scaleKey={`${accountId}-${Object.values(filters).join('|')}`}/><MarketsTradedChart accountId={accountId} phaseId={phaseId} filters={filters} selectedMarket={filters.market} onMarketSelect={(market)=>setFilters((current)=>({...current,market,page:1}))} currency={account.currency} refreshKey={marketRefreshKey}/></div>
        <div className="pt-2"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-xl font-semibold">Trade journal</h3><p className="mt-1 text-sm text-muted">Search, filter, sort, and inspect every execution.</p></div>{selectedIds.size>0&&<button className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500" onClick={()=>setConfirm({type:'bulk'})}><Trash2 size={16}/> Delete selected ({selectedIds.size})</button>}</div><TradeFilters filters={filters} setFilters={setFilters} options={filterOptions}/></div>
        <TradeTable data={trades} loading={tableLoading} error={error} filters={filters} setFilters={setFilters} currency={account.currency} selectedIds={selectedIds} onToggleTrade={toggleTrade} onToggleVisible={toggleVisible} onSelectAllFiltered={selectAllFiltered} selectingAll={selectingAll} onView={setViewing} onEdit={(t)=>{setEditing(t);setTradeModal(true);}} onDuplicate={duplicate} onDelete={(item)=>setConfirm({type:'trade',item})} onImage={setImage}/>
      </>}
    </main>
    <AccountModal open={accountSettings} account={account} onClose={()=>setAccountSettings(false)} onSave={saveAccount} onDelete={()=>setConfirm({type:'account',item:account})} busy={busy}/>
    <TradeFormModal open={tradeModal} trade={editing} onClose={()=>{setTradeModal(false);setEditing(null);}} onSave={saveTrade} busy={busy} libraryOptions={filterOptions}/>
    <TradeViewModal trade={viewing} currency={account?.currency} onClose={()=>setViewing(null)} onImage={setImage} onDeleteScreenshot={deleteScreenshot}/>
    <CsvImportModal open={csvModal} accountId={accountId} account={account} phaseId={phaseId} onClose={()=>setCsvModal(false)} onImported={refreshJournalData} notify={notify}/>
    <PhaseSettingsModal phase={phase} open={phaseSettings} onClose={()=>setPhaseSettings(false)} onSave={savePhase} onArchive={()=>setConfirm({type:'phaseAction',action:'archive',item:phase})} onDelete={()=>setConfirm({type:'phase',item:phase})} busy={busy}/>
    <ConfirmModal isOpen={!!confirm} {...confirmationDetails} isLoading={busy} onConfirm={executeDelete} onCancel={()=>setConfirm(null)}/>
    <Modal open={!!image} onClose={()=>setImage(null)} title="Screenshot preview" wide>{image&&<img src={image} className="mx-auto max-h-[72vh] rounded-xl object-contain" alt="Trade screenshot"/>}</Modal>
    <Toast toast={toast} onClose={()=>setToast(null)}/>
  </div>;
}
