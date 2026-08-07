import { money, number } from '../../utils/format.js';

export default function PerformanceKpiCard({label,value,detail,currency,moneyValue=false,negative}) {
  const shown=moneyValue?money(value||0,currency):typeof value==='number'?number(value,2):value??'—';
  const direction=label.startsWith('BUY ')?'BUY':label.startsWith('SELL ')?'SELL':null;
  const tone=direction==='BUY'?'border-lime/25 shadow-[0_0_18px_rgba(199,243,107,.07)]':direction==='SELL'?'border-rose-400/25 shadow-[0_0_18px_rgba(251,113,133,.07)]':'';
  const text=direction==='BUY'?'text-lime':direction==='SELL'?'text-rose-400':negative?'text-rose-400':'';
  return <article className={`card min-w-0 p-4 ${tone}`}><p className={`text-[10px] font-medium uppercase tracking-wider ${direction?text:'text-muted'}`}>{label}</p><p className={`mt-2 truncate text-xl font-semibold ${text}`}>{shown}</p>{detail&&<p className="mt-1 truncate text-xs text-muted">{detail}</p>}</article>;
}
