export default function OutcomeDistribution({ summary }) {
  const total = summary.totalTrades || 0;
  const rows = [['Wins', summary.wins, 'bg-lime'], ['Losses', summary.losses, 'bg-rose-400'], ['Break-even', summary.breakEven, 'bg-slate-400']];
  return <section className="card p-5"><h3 className="text-sm font-semibold">Trade outcomes</h3><p className="mt-1 text-xs text-muted">Wins, losses, and break-even trades</p><div className="mt-5 space-y-4">{rows.map(([label, count, color]) => <div key={label}><div className="mb-1.5 flex justify-between text-sm"><span>{label}</span><span className="text-muted">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/5"><div className={`h-full ${color}`} style={{ width: `${total ? count / total * 100 : 0}%` }}/></div></div>)}</div></section>;
}
