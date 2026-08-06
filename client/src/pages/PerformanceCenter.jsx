import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, RotateCcw } from 'lucide-react';
import { useHistory, useLocation } from 'react-router-dom';
import { api, errorMessage } from '../api/client.js';
import { money, number } from '../utils/format.js';
import { BREAKDOWN_BY_TAB, journalDrillDownUrl, PERFORMANCE_TABS, performanceQuery } from '../utils/performanceNavigation.js';
import BalanceChart from '../components/chart/BalanceChart.jsx';
import OutcomeDistribution from '../components/performance/OutcomeDistribution.jsx';
import PerformanceBreakdown from '../components/performance/PerformanceBreakdown.jsx';
import PerformanceMetricCard from '../components/performance/PerformanceMetricCard.jsx';
import ActiveAccountIndicator from '../components/account/ActiveAccountIndicator.jsx';
import MissingActiveAccount from '../components/account/MissingActiveAccount.jsx';
import { useActiveAccount } from '../context/ActiveAccountContext.jsx';
import OverviewDashboard from '../components/performance/OverviewDashboard.jsx';

const factor = (value) => value === 'INFINITY' ? '∞' : value == null ? '—' : number(value, 2);
const title = (tab) => tab === 'weekdays' ? 'Performance by Day' : tab[0].toUpperCase() + tab.slice(1);

export default function PerformanceCenter() {
  const location = useLocation(), history = useHistory(), query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tabParam = query.get('tab'), tab = PERFORMANCE_TABS.includes(tabParam) ? tabParam : 'overview';
  const [from, setFrom] = useState(query.get('from') || ''), [to, setTo] = useState(query.get('to') || ''), [data, setData] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [retryKey, setRetryKey] = useState(0), [sort, setSort] = useState('netProfitLoss');
  const [overviewCategories,setOverviewCategories]=useState({});
  const { activeAccountId: accountId, activeAccount: account, activePhaseId: phaseId, setActivePhaseId } = useActiveAccount();
  const phases = account?.phases || [];

  useEffect(() => { setFrom(query.get('from') || ''); setTo(query.get('to') || ''); }, [location.search]);
  const syncUrl = useCallback((next = {}) => { const state = { tab, accountId, phaseId, from, to, ...next }; history.push(`/performance?${performanceQuery(state)}`); }, [tab, accountId, phaseId, from, to, history]);
  useEffect(() => { if (!accountId || account?.accountType === 'FUNDED' && !phaseId) { setLoading(false); setData(null); return; } let active = true; setLoading(true); setError(''); const params = { ...(phaseId ? { phaseId } : {}), from: from || undefined, to: to || undefined, breakdown: BREAKDOWN_BY_TAB[tab] }; api.get(`/accounts/${accountId}/performance`, { params }).then(({ data: response }) => { if (active) setData(response.data); }).catch((reason) => { if (active) setError(errorMessage(reason)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [accountId, phaseId, account?.accountType, from, to, tab, retryKey]);
  useEffect(()=>{if(tab!=='overview'||!accountId||account?.accountType==='FUNDED'&&!phaseId)return;let active=true;const base={...(phaseId?{phaseId}:{}),from:from||undefined,to:to||undefined};Promise.all(['market','strategy','session','weekday'].map((breakdown)=>api.get(`/accounts/${accountId}/performance`,{params:{...base,breakdown}}))).then((responses)=>{if(active)setOverviewCategories(Object.fromEntries(['markets','strategies','sessions','weekdays'].map((key,index)=>[key,responses[index].data.data.breakdown]))) }).catch(()=>{if(active)setOverviewCategories({})});return()=>{active=false}},[tab,accountId,phaseId,account?.accountType,from,to,retryKey]);
  const selectPhase = (value) => { const id = Number(value); setActivePhaseId(id); syncUrl({ phaseId: id }); };
  const changeDate = (key, value) => { key === 'from' ? setFrom(value) : setTo(value); syncUrl({ [key]: value }); };
  const clear = () => { setFrom(''); setTo(''); syncUrl({ from: '', to: '' }); };
  const openCategory = (row) => history.push(journalDrillDownUrl({ accountId, phaseId, from, to, journalFilter: row.journalFilter }));
  const summary = data?.summary, currency = data?.scope.currency || account?.currency;
  const cards = summary ? [['Net P&L', money(summary.netProfitLoss, currency)], ['Total trades', summary.totalTrades], ['Win rate', summary.winRate == null ? '—' : `${number(summary.winRate, 2)}%`], ['Profit factor', factor(summary.profitFactor)], ['Average win', summary.averageWin == null ? '—' : money(summary.averageWin, currency)], ['Average loss', summary.averageLoss == null ? '—' : money(summary.averageLoss, currency)], ['Best trade', summary.bestTrade ? money(summary.bestTrade.profitLoss, currency) : '—'], ['Worst trade', summary.worstTrade ? money(summary.worstTrade.profitLoss, currency) : '—']] : [];

  return <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(199,243,107,.05),transparent_24%)]">
    <main className="mx-auto max-w-[1700px] space-y-5 px-5 py-7 lg:px-8"><ActiveAccountIndicator/>{!accountId ? <MissingActiveAccount/> : <><section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><p className="text-xs font-medium uppercase tracking-[.2em] text-lime">Analytics</p><h2 className="mt-2 text-3xl font-semibold">Performance Center</h2><p className="mt-2 text-sm text-muted">Reliable realized results for one account and phase at a time.</p></div><div className="flex flex-wrap items-end gap-3">{account?.accountType === 'FUNDED' && <div><label className="label">Active phase</label><select className="field min-w-44" value={phaseId || ''} onChange={(event) => selectPhase(event.target.value)}>{phases.filter((item)=>item.status!=='LOCKED').map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>}<div><label className="label">From</label><input type="date" className="field w-40" value={from} onChange={(event) => changeDate('from', event.target.value)}/></div><div><label className="label">To</label><input type="date" className="field w-40" value={to} onChange={(event) => changeDate('to', event.target.value)}/></div><button className="btn-secondary" onClick={clear}><RotateCcw size={15}/> Clear filters</button></div></section>
      <nav className="flex gap-2 overflow-x-auto pb-1">{PERFORMANCE_TABS.map((item) => <button className={tab === item ? 'btn-primary shrink-0' : 'btn-secondary shrink-0'} key={item} onClick={() => syncUrl({ tab: item })}>{title(item)}</button>)}</nav>
      {error ? <section className="card border-rose-500/30 p-6 text-center"><p className="text-rose-400">{error}</p><button className="btn-secondary mt-4" onClick={() => setRetryKey((value) => value + 1)}>Retry</button></section> : loading || !data ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div className="card h-24 animate-pulse bg-white/[.025]" key={index}/>)}</section> : !summary.totalTrades ? <section className="card flex min-h-72 flex-col items-center justify-center p-8 text-center"><BarChart3 size={40} className="text-lime"/><h3 className="mt-4 text-lg font-semibold">No realized trades in this period</h3><p className="mt-2 text-sm text-muted">Change or clear the date range to review performance.</p></section> : tab === 'overview' ? <OverviewDashboard summary={summary} balanceHistory={data.balanceHistory} currency={currency} categories={overviewCategories} scaleKey={`${accountId}-${phaseId}-${from}-${to}`}/> : <PerformanceBreakdown rows={data.breakdown} currency={currency} sort={sort} setSort={setSort} onSelect={openCategory}/>}</>}
    </main></div>;
}
