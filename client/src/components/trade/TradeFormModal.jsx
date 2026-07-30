import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { StrategyCombobox, TimeframeCombobox } from './LibraryCombobox.jsx';

const empty = {
  strategyId: null, strategyName: '', strategy: null, market: '', tradeDate: new Date().toISOString().slice(0, 10), session: '', timeframe: '',
  direction: 'BUY', entryPrice: '', stopLoss: '', takeProfit: '', lotSize: '', plannedRROverride: '', resultR: '',
  exitPrice: '', riskPercentageOverride: '', result: 'WIN', profitLoss: '', emotion: ''
};
const fields = [
  ['strategyName','Strategy name','text',false], ['market','Market','text',true], ['tradeDate','Date','date',true],
  ['session','Session','select',false,['ASIA','LONDON','NEW_YORK','AFTER_HOURS','UNKNOWN']], ['timeframe','Timeframe','text'], ['direction','Direction','select',true,['BUY','SELL']],
  ['entryPrice','Entry price','number'], ['stopLoss','Stop loss','number'], ['takeProfit','Take profit','number'],
  ['lotSize','Lot size','number'], ['plannedRROverride','Planned RR override','number'], ['resultR','Legacy result in R','number'],
  ['exitPrice','Exit price','number'], ['riskPercentageOverride','Risk % override','number'],
  ['result','Result','select',true,['WIN','LOSS','BREAK_EVEN']], ['profitLoss','Profit / Loss','number',true]
];

export default function TradeFormModal({ open, trade, onClose, onSave, busy, libraryOptions }) {
  const [form, setForm] = useState(empty);
  const [screenshot, setScreenshot] = useState(null);
  useEffect(() => {
    if (!open) return;
    setScreenshot(null);
    setForm(trade ? { ...empty, ...trade, tradeDate: String(trade.tradeDate).slice(0, 10), screenshotPath: undefined } : empty);
  }, [open, trade]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value, ...(key === 'session' ? { sessionDetection: 'MANUAL' } : {}) }));
  const submit = (e) => { e.preventDefault(); onSave(form, screenshot); };
  return <Modal open={open} onClose={onClose} title={trade ? `Edit trade #${trade.tradeNumber}` : 'Log a new trade'} subtitle="Required fields are marked with an asterisk." wide>
    <form onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map(([key,label,type,required,options]) => <div key={key} className={key === 'strategyName' || key === 'market' ? 'lg:col-span-2' : ''}>
          <label className="label">{label}{required && ' *'}</label>
          {key==='strategyName'?<StrategyCombobox strategyId={form.strategyId} value={form.strategyName} currentStrategy={form.strategy} onChange={(strategy)=>setForm((current)=>({...current,strategyId:strategy?.id??null,strategyName:strategy?.name||'',strategy}))}/>
          :key==='timeframe'?<TimeframeCombobox value={form[key]} onChange={(value)=>change(key,value)} timeframes={libraryOptions?.timeframes}/>
          :type === 'select'
            ? <select className="field" required={required} value={form[key]} onChange={(e) => change(key,e.target.value)}>{!required&&<option value="">—</option>}{options.map((x) => <option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select>
            : <input className="field" required={required} type={type} step={type === 'number' ? 'any' : undefined} value={form[key] ?? ''} onChange={(e) => change(key,e.target.value)}/>}
        </div>)}
        <div className="sm:col-span-2"><label className="label">Screenshot</label><input className="field file:mr-3 file:rounded file:border-0 file:bg-lime file:px-3 file:py-1 file:text-xs file:font-semibold file:text-black" type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => setScreenshot(e.target.files[0] || null)}/><p className="mt-1 text-xs text-muted">PNG, JPG, JPEG or WEBP. Maximum configured server size is 5 MB.</p></div>
        <div className="sm:col-span-2"><label className="label">Emotion / notes</label><textarea className="field min-h-24 resize-y" maxLength="5000" value={form.emotion ?? ''} onChange={(e) => change('emotion',e.target.value)}/></div>
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : trade ? 'Save changes' : 'Create trade'}</button></div>
    </form>
  </Modal>;
}
