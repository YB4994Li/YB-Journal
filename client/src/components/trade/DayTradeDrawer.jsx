import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { money, number, shortDate } from '../../utils/format.js';

const resultText={WIN:'text-lime',LOSS:'text-rose-400',BREAK_EVEN:'text-slate-300'};
const resultBorder={WIN:'border-lime/25',LOSS:'border-rose-400/25',BREAK_EVEN:'border-slate-500/35'};
const signedMoney=(value,currency)=>`${Number(value)>0?'+':''}${money(value,currency)}`;
const available=(value)=>value!==null&&value!==undefined&&value!=='';
const rValue=(value)=>`${Number(value)>0?'+':''}${number(value,2)}R`;
const utcTime=(value)=>value?new Date(value).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'}):null;

function Detail({label,value,className=''}){
  if(!available(value))return null;
  return <div className="min-w-0"><dt className="text-[9px] font-medium uppercase tracking-[.12em] text-muted">{label}</dt><dd className={`mt-1 truncate text-xs font-medium text-slate-200 ${className}`}>{value}</dd></div>;
}

function DayTradeSnapshot({trade,currency,onOpen,centered}){
  const context=[trade.session,trade.timeframe,trade.strategyName].filter(Boolean);
  const riskAmount=available(trade.riskAmount)?money(trade.riskAmount,currency):null;
  const riskPercent=available(trade.riskPercentageOverride)?`${number(trade.riskPercentageOverride,2)}%`:null;
  const plannedR=available(trade.plannedRROverride)?rValue(trade.plannedRROverride):available(trade.plannedRR)?rValue(trade.plannedRR):null;
  const realizedR=available(trade.realizedRMultiple)?rValue(trade.realizedRMultiple):null;
  const execution=[['Entry',available(trade.entryPrice)?number(trade.entryPrice):null],['Stop loss',available(trade.stopLoss)?number(trade.stopLoss):null],['Target',available(trade.takeProfit)?number(trade.takeProfit):null],['Exit',available(trade.exitPrice)?number(trade.exitPrice):null],['Lot size',available(trade.lotSize)?number(trade.lotSize):null]];
  const risk=[['Risk amount',riskAmount],['Risk %',riskPercent],['Risk source',trade.riskCalculationStatus||null],['Planned RR',plannedR]];
  const timing=[['Trade date',trade.tradeDate?shortDate(trade.tradeDate):null],['Opened',utcTime(trade.openTimeUtc)],['Closed',utcTime(trade.closeTimeUtc)]];
  return <button type="button" onClick={()=>onOpen(trade)} className={`group min-w-[390px] flex-1 rounded-xl border bg-ink/35 p-4 text-left transition hover:border-slate-500/70 hover:bg-white/[.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime ${resultBorder[trade.result]||resultBorder.BREAK_EVEN} ${centered?'max-w-[560px]':''}`}>
    <div className="flex items-start justify-between gap-4"><div><h3 className="text-base font-semibold text-white">{trade.market}</h3><p className={`mt-1 text-xs font-semibold tracking-wider ${trade.direction==='SELL'?'text-rose-300':trade.direction==='BUY'?'text-lime':'text-slate-300'}`}>{trade.direction}</p></div><span className={`rounded-md border border-current/20 bg-black/20 px-2 py-1 text-[10px] font-semibold tracking-wider ${resultText[trade.result]||resultText.BREAK_EVEN}`}>{trade.result?.replace('_',' ')}</span></div>
    {context.length>0&&<p className="mt-2 truncate text-xs text-muted">{context.join(' · ')}</p>}
    {timing.some(([,value])=>value)&&<dl className="mt-3 grid grid-cols-3 gap-x-3 border-t border-line/80 pt-3">{timing.map(([label,value])=><Detail key={label} label={label} value={value}/>)}</dl>}
    {execution.some(([,value])=>value)&&<dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-3 border-t border-line/80 pt-3 sm:grid-cols-5">{execution.map(([label,value])=><Detail key={label} label={label} value={value}/>)}</dl>}
    {risk.some(([,value])=>value)&&<dl className="mt-3 grid grid-cols-4 gap-x-3 border-t border-line/80 pt-3">{risk.map(([label,value])=><Detail key={label} label={label} value={value}/>)}</dl>}
    <dl className="mt-3 grid grid-cols-3 gap-x-3 border-t border-line/80 pt-3"><Detail label="Profit / Loss" value={signedMoney(trade.profitLoss,currency)} className={`text-base ${Number(trade.profitLoss)>0?'text-lime':Number(trade.profitLoss)<0?'text-rose-400':'text-slate-200'}`}/><Detail label="Realized R" value={realizedR} className={trade.result==='WIN'?'text-lime':trade.result==='LOSS'?'text-rose-400':'text-slate-200'}/><Detail label="Trade #" value={trade.tradeNumber}/></dl>
    {(available(trade.balanceBeforeTrade)||available(trade.balanceAfterTrade))&&<dl className="mt-3 grid grid-cols-2 gap-x-3 border-t border-line/80 pt-3"><Detail label="Balance before" value={available(trade.balanceBeforeTrade)?money(trade.balanceBeforeTrade,currency):null}/><Detail label="Balance after" value={available(trade.balanceAfterTrade)?money(trade.balanceAfterTrade,currency):null}/></dl>}
    {trade.emotion&&<div className="mt-3 border-t border-line/80 pt-3"><p className="text-[9px] font-medium uppercase tracking-[.12em] text-muted">Emotion / notes</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">{trade.emotion}</p></div>}
  </button>;
}

export default function DayTradeDrawer({day,trades,currency,onClose,onOpenTrade}){
  useEffect(()=>{if(!day)return undefined;const previous=document.body.style.overflow;document.body.style.overflow='hidden';const close=(event)=>event.key==='Escape'&&onClose();document.addEventListener('keydown',close);return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close)}},[day,onClose]);
  if(!day)return null;
  const date=day.date.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const stats=[[day.trades,'Trades',''],[day.wins,'Wins',''],[day.losses,'Losses','text-rose-400'],[day.breakEven,'BE',''],[day.winRate==null?'—':`${number(day.winRate,1)}%`,'Win rate','']];
  return createPortal(<div className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center bg-black/70 p-3 backdrop-blur-[5px] sm:p-6" onMouseDown={(event)=>event.target===event.currentTarget&&onClose()}>
    <section role="dialog" aria-modal="true" aria-label={`Daily trading snapshot for ${date}`} className="day-snapshot-in card flex max-h-[min(86dvh,680px)] w-[min(1180px,92vw)] flex-col overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,.65)]">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:items-center sm:px-6"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-lime">Daily trading snapshot</p><h2 className="mt-1.5 truncate text-lg font-semibold">{date}</h2></div><div className="hidden flex-1 items-stretch justify-end divide-x divide-line sm:flex"><div className="px-5 text-right"><p className="text-[9px] uppercase tracking-wider text-muted">Daily Net P&amp;L</p><p className={`mt-1 text-lg font-semibold ${day.net>0?'text-lime':day.net<0?'text-rose-400':'text-slate-200'}`}>{signedMoney(day.net,currency)}</p></div>{stats.map(([value,label,tone])=><div className="min-w-20 px-4 text-center" key={label}><p className={`text-base font-semibold ${tone}`}>{value}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-muted">{label}</p></div>)}</div><button type="button" aria-label="Close day details" onClick={onClose} className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-white"><X size={18}/></button></header>
      <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-2 sm:hidden"><p className={`font-semibold ${day.net>0?'text-lime':day.net<0?'text-rose-400':'text-slate-200'}`}>{signedMoney(day.net,currency)}</p><p className="text-[10px] text-muted">{day.trades}T · {day.wins}W · {day.losses}L · {day.breakEven}BE · {day.winRate==null?'—':`${number(day.winRate,1)}% WR`}</p></div>
      <div className="performance-scrollbar overflow-x-auto overflow-y-auto p-4 sm:p-5"><div className={`flex gap-3 ${trades.length===1?'justify-center':''}`}>{trades.map((trade)=><DayTradeSnapshot key={trade.id} trade={trade} currency={currency} onOpen={onOpenTrade} centered={trades.length===1}/>)}</div></div>
    </section>
  </div>,document.body);
}
