import { Image, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { money, number, shortDate } from '../../utils/format.js';
import { assetUrl } from '../../api/client.js';

export default function TradeViewModal({ trade, currency, onClose, onImage, onDeleteScreenshot }) {
  if (!trade) return null;
  const entries = [
    ['Strategy',trade.strategyName || '-'],['Market',trade.market],['Date',shortDate(trade.tradeDate)],
    ['Session',trade.session || '—'],['Timeframe',trade.timeframe],['Direction',trade.direction],['Entry',number(trade.entryPrice)],
    ['Stop loss',number(trade.stopLoss)],['Take profit',number(trade.takeProfit)],['Lot size',number(trade.lotSize)],
    ['Planned RR',number(trade.plannedRROverride)],
    ['Realized R','—'],['Exit',number(trade.exitPrice)],
    ['Risk amount',trade.riskAmount == null ? '—' : money(trade.riskAmount,currency)],
    ['Risk',trade.riskPercentageOverride == null ? '—' : `${number(trade.riskPercentageOverride)}%`],
    ['Balance before trade',money(trade.balanceBeforeTrade,currency)],['Balance after trade',money(trade.balanceAfterTrade,currency)],['Result',trade.result?.replace('_',' ')],['P&L',money(trade.profitLoss,currency)]
  ];
  return <Modal open onClose={onClose} title={`Trade #${trade.tradeNumber}`} subtitle={`${trade.market} · ${trade.direction}`} wide>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{entries.map(([label,value])=><div key={label} className="rounded-xl border border-line bg-ink/50 p-3"><p className="text-xs uppercase tracking-wider text-muted">{label}</p><p className="mt-1 font-medium">{value ?? '—'}</p></div>)}</div>
    <div className="mt-5 rounded-xl border border-line p-4"><p className="label">Emotion / notes</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{trade.emotion || 'No notes recorded.'}</p></div>
    {trade.screenshotPath ? <div className="mt-5"><div className="mb-2 flex items-center justify-between"><span className="label mb-0">Screenshot</span><button className="btn text-xs text-rose-400" onClick={onDeleteScreenshot}><Trash2 size={14}/> Remove</button></div><button className="group relative block w-full overflow-hidden rounded-xl border border-line" onClick={()=>onImage(assetUrl(trade.screenshotPath))}><img src={assetUrl(trade.screenshotPath)} alt={`Trade ${trade.tradeNumber}`} className="max-h-80 w-full object-cover"/><span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Image/> Preview</span></button></div> : null}
  </Modal>;
}
