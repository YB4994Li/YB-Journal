import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo } from 'react';
import { money, shortDate } from '../../utils/format.js';
import { calculateBalanceDomain } from '../../utils/chartScale.js';

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return <div className="rounded-xl border border-line bg-[#0d1118] p-3 text-xs shadow-2xl">
    <p className="font-semibold text-white">{item.label}</p><p className="mt-1 text-muted">{shortDate(item.date)}</p>
    <p className={`mt-2 ${item.profitLoss > 0 ? 'text-lime' : item.profitLoss < 0 ? 'text-rose-400' : 'text-muted'}`}>P&L: {money(item.profitLoss,currency)}</p>
    <p className="mt-1 text-white">Balance: {money(item.balance,currency)}</p>
  </div>;
}
export default function BalanceChart({ data, currency, loading, scaleKey }) {
  const yDomain = useMemo(() => calculateBalanceDomain(data), [data, scaleKey]);
  return <section className="card min-h-[360px] p-5">
    <div className="mb-5"><p className="text-sm font-semibold">Balance progression</p><p className="mt-1 text-xs text-muted">Initial capital plus chronological realized P&L</p></div>
    {loading ? <div className="flex h-64 items-center justify-center text-muted">Loading chart…</div> : <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 12, bottom: 0 }}>
        <defs><linearGradient id="balance" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c7f36b" stopOpacity={0.28}/><stop offset="100%" stopColor="#c7f36b" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid stroke="#242c38" vertical={false}/><XAxis dataKey="date" tickFormatter={(v) => shortDate(v).replace(/ \d{4}/,'')} stroke="#667080" tick={{fontSize:11}}/>
        <YAxis domain={yDomain} tickCount={6} allowDataOverflow={false} stroke="#667080" tick={{fontSize:11}} tickFormatter={(v) => Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(v)}/>
        <Tooltip content={<CustomTooltip currency={currency}/>}/><Area type="monotone" dataKey="balance" stroke="#c7f36b" strokeWidth={2} fill="url(#balance)" activeDot={{r:5,fill:'#c7f36b'}} isAnimationActive animationDuration={550} animationEasing="ease-out"/>
      </AreaChart>
    </ResponsiveContainer>}
  </section>;
}
