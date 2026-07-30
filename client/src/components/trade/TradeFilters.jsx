import { Search, SlidersHorizontal, X } from 'lucide-react';
export default function TradeFilters({ filters, setFilters, options = {markets:[],strategies:[],timeframes:[]} }) {
  const set = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const clear = () => setFilters({ page: 1, limit: filters.limit, search: '', market: '', strategy: '', session: '', timeframe: '', direction: '', result: '', startDate: '', endDate: '', sortBy: 'tradeDate', sortOrder: 'desc' });
  return <div className="card p-4">
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-muted" size={18}/><input className="field pl-10" placeholder="Search trade #, strategy, market or notes…" value={filters.search} onChange={(e) => set('search',e.target.value)}/></div>
      <select className="field lg:w-40" value={filters.market} onChange={(e) => set('market',e.target.value)}><option value="">All markets</option>{options.markets.map((item)=><option key={item.value} value={item.value}>{item.value}</option>)}</select>
      {!!options.strategies.length&&<select className="field lg:w-44" value={filters.strategy} onChange={(e)=>set('strategy',e.target.value)}><option value="">All strategies</option>{options.strategies.map((item)=><option key={item.normalizedKey} value={item.value}>{item.value}</option>)}</select>}
      <select className="field lg:w-40" value={filters.session} onChange={(e) => set('session',e.target.value)}><option value="">Session</option>{['ASIA','LONDON','NEW_YORK','AFTER_HOURS','UNKNOWN'].map((session)=><option key={session} value={session}>{session.replaceAll('_',' ')}</option>)}</select>
      {!!options.timeframes.length&&<select className="field lg:w-40" value={filters.timeframe} onChange={(e)=>set('timeframe',e.target.value)}><option value="">All timeframes</option>{options.timeframes.map((item)=><option key={item.value} value={item.value}>{item.value}</option>)}</select>}
      <select className="field lg:w-32" value={filters.direction} onChange={(e) => set('direction',e.target.value)}><option value="">Direction</option><option>BUY</option><option>SELL</option></select>
      <select className="field lg:w-36" value={filters.result} onChange={(e) => set('result',e.target.value)}><option value="">Result</option><option>WIN</option><option>LOSS</option><option value="BREAK_EVEN">Break even</option></select>
    </div>
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <SlidersHorizontal size={17} className="mb-2.5 text-muted"/>
      <div><label className="label">From</label><input type="date" className="field w-40" value={filters.startDate} onChange={(e) => set('startDate',e.target.value)}/></div>
      <div><label className="label">To</label><input type="date" className="field w-40" value={filters.endDate} onChange={(e) => set('endDate',e.target.value)}/></div>
      <button className="btn-secondary ml-auto" onClick={clear}><X size={15}/> Clear</button>
    </div>
  </div>;
}
