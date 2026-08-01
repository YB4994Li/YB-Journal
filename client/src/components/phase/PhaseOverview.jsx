import {money} from '../../utils/format.js';
import PhaseStatusBadge from './PhaseStatusBadge.jsx';

const Metric=({label,children})=><div className="rounded-xl border border-line bg-ink/50 px-4 py-3"><p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p><p className="mt-1 text-base font-semibold">{children}</p></div>;

export default function PhaseOverview({phase,currency,onSettings}){
  if(!phase)return null;
  const target=Number(phase.profitTargetAmount||0),progress=Number(phase.targetProgress||0);
  return <section className="card p-4">
    <div className="flex flex-wrap items-center gap-5"><div><p className="text-lg font-semibold">{phase.name}</p><div className="mt-1"><PhaseStatusBadge status={phase.status}/></div></div>
      <Metric label="Current balance">{money(phase.currentRealizedBalance??phase.currentBalance,currency)}</Metric><Metric label="Target progress">{phase.targetBalance==null?'—':`${money(progress,currency)} / ${money(target,currency)}`}</Metric><Metric label="Maximum loss limit">{phase.failureBalance==null?'—':money(phase.failureBalance,currency)}</Metric><Metric label="Remaining before failure">{phase.remainingBeforeFailure==null?'—':money(Math.max(0,phase.remainingBeforeFailure),currency)}</Metric><button className="btn-secondary ml-auto" onClick={onSettings}>Phase settings</button>
    </div>
    <p className="mt-3 text-sm text-muted">{phase.status==='PASSED'?'Profit target reached automatically.':phase.status==='FAILED'?'Maximum loss limit reached automatically.':phase.status==='ACTIVE'?'Phase is currently active.':'Complete the previous phase to unlock this phase.'}</p>
    {target>0&&<div className="mt-3 h-2 overflow-hidden rounded bg-white/5"><div className="h-full bg-lime" style={{width:`${Math.max(0,Math.min(100,progress/target*100))}%`}}/></div>}
  </section>;
}
