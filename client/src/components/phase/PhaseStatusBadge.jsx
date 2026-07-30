const colors={ACTIVE:'bg-lime/10 text-lime',PASSED:'bg-sky-500/10 text-sky-300',FAILED:'bg-rose-500/10 text-rose-400',PENDING:'bg-white/5 text-muted',ARCHIVED:'bg-amber-500/10 text-amber-300'};
export default function PhaseStatusBadge({status}){return <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${colors[status]||colors.PENDING}`}>{status}</span>;}
