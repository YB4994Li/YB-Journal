import { Link } from 'react-router-dom';
import { useActiveAccount } from '../../context/ActiveAccountContext.jsx';

export default function ActiveAccountIndicator() {
  const { activeAccount: account, activePhase: phase } = useActiveAccount();
  if (!account) return null;
  const detail = account.accountType === 'FUNDED' ? `Funded${account.propFirm ? ` · ${account.propFirm}` : ''}${phase ? ` · ${phase.name}` : ''}` : `Real Account${account.broker ? ` · ${account.broker}` : ''}`;
  return <div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-wider text-muted">Active account</p><div className="flex items-baseline gap-2"><p className="truncate text-sm font-semibold text-slate-100">{account.name}</p><Link className="text-xs text-lime hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime" to="/accounts">Change</Link></div><p className="truncate text-xs text-muted">{detail}</p></div>;
}
