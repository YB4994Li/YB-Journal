import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function AccountsCenterLayout({section,showAdd=false,onAdd,action,children}){
  return <div className="min-h-screen"><header className="border-b border-line bg-ink/80"><div className="mx-auto max-w-[1500px] px-6 py-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Accounts Center</h1><p className="mt-1 text-sm text-muted">Manage your accounts and reusable trading library.</p></div><div className="flex flex-wrap gap-2">{showAdd&&<button className="btn-primary" onClick={onAdd}><Plus size={16}/> Add Account</button>}{action}</div></div><nav className="mt-5 flex gap-2"><Link className={section==='accounts'?'btn-primary':'btn-secondary'} to="/accounts">Accounts</Link><Link className={section==='library'?'btn-primary':'btn-secondary'} to="/accounts/library">Trading Library</Link><Link className="btn-secondary" to="/performance">Performance</Link></nav></div></header>{children}</div>;
}
