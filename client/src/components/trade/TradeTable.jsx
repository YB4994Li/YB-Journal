import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Copy, Eye, Image, Pencil, Trash2 } from 'lucide-react';
import { assetUrl } from '../../api/client.js';
import { money, number, shortDate } from '../../utils/format.js';

const columns = [
  ['tradeNumber','#'],['strategyName','Strategy'],['importSource','Source'],['market','Market'],['tradeDate','Date'],['session','Session'],['timeframe','Timeframe'],
  ['direction','Direction'],['entryPrice','Entry'],['stopLoss','Stop'],['takeProfit','Target'],['lotSize','Lot'],['plannedRR','Planned RR'],
  ['realizedRMultiple','Realized R'],['exitPrice','Exit'],['riskAmount','Risk Amount'],['riskPercentage','Risk %'],['result','Result'],['profitLoss','Profit / Loss'],
  ['screenshot','Screenshot'],['emotion','Emotion']
];

export default function TradeTable({ data, loading, error, filters, setFilters, currency, selectedIds, onToggleTrade, onToggleVisible, onSelectAllFiltered, selectingAll, onView, onEdit, onDuplicate, onDelete, onImage }) {
  const selectAllRef = useRef(null);
  const visibleIds = data.items?.map(({ id }) => id) || [];
  const visibleSelected = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && visibleSelected === visibleIds.length;
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = visibleSelected > 0 && !allVisibleSelected;
  }, [visibleSelected, allVisibleSelected]);

  const sort = (key) => {
    if (['screenshot','emotion','session','timeframe','entryPrice','stopLoss','takeProfit','lotSize','plannedRR','resultR','exitPrice','riskPercentage'].includes(key)) return;
    setFilters((f) => ({ ...f, page: 1, sortBy: key, sortOrder: f.sortBy === key && f.sortOrder === 'asc' ? 'desc' : 'asc' }));
  };
  const display = (trade,key) => {
    if (key === 'tradeNumber') return `#${trade.tradeNumber}`;
    if (key === 'tradeDate') return shortDate(trade.tradeDate);
    if (key === 'profitLoss') return <span className={trade.profitLoss > 0 ? 'text-lime' : trade.profitLoss < 0 ? 'text-rose-400' : ''}>{money(trade.profitLoss,currency)}</span>;
    if (key === 'direction') return <span className={`rounded px-2 py-1 text-xs font-semibold ${trade.direction === 'BUY' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>{trade.direction}</span>;
    if (key === 'result') return <span className={`rounded px-2 py-1 text-xs font-semibold ${trade.result === 'WIN' ? 'bg-lime/10 text-lime' : trade.result === 'LOSS' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'}`}>{trade.result?.replace('_',' ')}</span>;
    if (key === 'session') return <span className="inline-flex items-center gap-1.5">{trade.session || '—'}{trade.sessionDetection === 'AUTO' && <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-300">Auto</span>}</span>;
    if (key === 'screenshot') return trade.screenshotPath ? <button onClick={() => onImage(assetUrl(trade.screenshotPath))} className="rounded p-2 text-lime hover:bg-lime/10"><Image size={16}/></button> : '—';
    if (key === 'emotion') return <span className="block max-w-52 truncate" title={trade.emotion}>{trade.emotion || '—'}</span>;
    if (key === 'strategyName') return trade.strategyName || '-';
    if (key === 'plannedRR') return <span title={trade.calculationWarnings?.join('\n')}>{number(trade.plannedRROverride ?? trade.plannedRR)}{trade.plannedRROverride == null && trade.plannedRR != null && <span className="ml-1 rounded bg-sky-500/10 px-1 text-[10px] text-sky-300">AUTO</span>}</span>;
    if (key === 'riskAmount') return <span title={trade.riskCalculationError ? trade.calculationWarnings?.join('\n') : ''}>{trade.riskAmount == null ? '—' : money(trade.riskAmount,currency)}{trade.riskCalculationStatus === 'CALCULATED' && <span className="ml-1 rounded bg-sky-500/10 px-1 text-[10px] text-sky-300">AUTO</span>}</span>;
    if (key === 'riskPercentage') return <span title={trade.calculationWarnings?.join('\n')}>{(trade.riskPercentageOverride ?? trade.riskPercentage) == null ? '—' : `${number(trade.riskPercentageOverride ?? trade.riskPercentage)}%`}{trade.riskPercentageOverride == null && trade.riskPercentage != null && <span className="ml-1 rounded bg-sky-500/10 px-1 text-[10px] text-sky-300">AUTO</span>}</span>;
    if (key === 'realizedRMultiple') return <span title={trade.calculationWarnings?.join('\n')}>{trade.realizedRMultiple == null ? '—' : `${number(trade.realizedRMultiple)}R`}</span>;
    if (['entryPrice','stopLoss','takeProfit','lotSize','exitPrice'].includes(key)) return number(trade[key]);
    return trade[key] || '—';
  };
  return <div className="card overflow-hidden">
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 text-sm">
      <span className="font-medium">{selectedIds.size} selected</span>
      <button className="btn-secondary py-1.5" disabled={!visibleIds.length} onClick={() => onToggleVisible(visibleIds, !allVisibleSelected)}>{allVisibleSelected ? 'Clear visible page' : 'Select visible page'}</button>
      <button className="btn-secondary py-1.5" disabled={selectingAll || !data.pagination?.total} onClick={onSelectAllFiltered}>{selectingAll ? 'Selecting…' : `Select all ${data.pagination?.total || 0} filtered trades`}</button>
    </div>
    <div className="scrollbar overflow-x-auto">
      <table className="min-w-[2150px] w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-[#171d27] text-xs uppercase tracking-wider text-muted"><tr>
          <th className="px-4 py-3"><input ref={selectAllRef} type="checkbox" aria-label="Select all visible trades" checked={allVisibleSelected} onChange={(e) => onToggleVisible(visibleIds, e.target.checked)}/></th>
          {columns.map(([key,label]) => <th key={key} className="whitespace-nowrap px-4 py-3"><button className="inline-flex items-center gap-1 hover:text-white" onClick={() => sort(key)}>{label}{filters.sortBy === key && (filters.sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button></th>)}
          <th className="sticky right-0 bg-[#171d27] px-4 py-3">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-line">
          {loading ? <tr><td colSpan={21} className="py-20 text-center text-muted">Loading journal…</td></tr>
          : error ? <tr><td colSpan={21} className="py-20 text-center text-rose-400">{error}</td></tr>
          : !data.items?.length ? <tr><td colSpan={21} className="py-20 text-center text-muted">No trades match your journal filters.</td></tr>
          : data.items.map((trade) => <tr key={trade.id} className="hover:bg-white/[.025]">
            <td className="px-4 py-3"><input type="checkbox" aria-label={`Select trade ${trade.tradeNumber}`} checked={selectedIds.has(trade.id)} onChange={(e) => onToggleTrade(trade.id, e.target.checked)}/></td>
            {columns.map(([key]) => <td key={key} className="whitespace-nowrap px-4 py-3 text-slate-300">{display(trade,key)}</td>)}
            <td className="sticky right-0 bg-panel px-3 py-2"><div className="flex gap-1">
              <button title="View" className="rounded p-2 text-muted hover:bg-white/5 hover:text-white" onClick={() => onView(trade)}><Eye size={16}/></button>
              <button title="Edit" className="rounded p-2 text-muted hover:bg-white/5 hover:text-white" onClick={() => onEdit(trade)}><Pencil size={16}/></button>
              <button title="Duplicate" className="rounded p-2 text-muted hover:bg-white/5 hover:text-white" onClick={() => onDuplicate(trade)}><Copy size={16}/></button>
              <button title="Delete" className="rounded p-2 text-muted hover:bg-rose-500/10 hover:text-rose-400" onClick={() => onDelete(trade)}><Trash2 size={16}/></button>
            </div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
      <span>{data.pagination?.total || 0} trades · Page {data.pagination?.page || 1} of {data.pagination?.totalPages || 1}</span>
      <div className="flex items-center gap-2"><select className="field w-24 py-1.5" value={filters.limit} onChange={(e) => { localStorage.setItem('journalPageSize',e.target.value); setFilters((f) => ({...f,page:1,limit:Number(e.target.value)})); }}><option>10</option><option>25</option><option>50</option></select>
        <button className="btn-secondary px-2 py-1.5" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({...f,page:f.page-1}))}><ChevronLeft size={16}/></button>
        <button className="btn-secondary px-2 py-1.5" disabled={filters.page >= (data.pagination?.totalPages || 1)} onClick={() => setFilters((f) => ({...f,page:f.page+1}))}><ChevronRight size={16}/></button>
      </div>
    </div>
  </div>;
}
