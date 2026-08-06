import { BarChart3, BookOpen, CalendarDays, ChevronLeft, ChevronRight, NotebookPen, Settings, WalletCards, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const primaryItems = [
  { label: 'Journal', to: '/journal', icon: BookOpen },
  { label: 'Performance Center', to: '/performance', icon: BarChart3 },
  { label: 'Trading Calendar', to: '/calendar', icon: CalendarDays },
  { label: 'Daily Notes', to: '/daily-notes', icon: NotebookPen },
  { label: 'Accounts Center', to: '/accounts', icon: WalletCards },
];

function selectionSearch(path) {
  if (path !== '/journal' && path !== '/performance') return '';
  const params = new URLSearchParams();
  const accountId = localStorage.getItem('activeAccountId'), phaseId = localStorage.getItem('activePhaseId');
  if (accountId) params.set('accountId', accountId);
  if (phaseId) params.set('phaseId', phaseId);
  return params.toString() ? `?${params}` : '';
}

function NavigationItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return <NavLink to={`${item.to}${selectionSearch(item.to)}`} onClick={onNavigate}
    className="group flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-400 transition hover:bg-white/[.045] hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime"
    activeClassName="bg-lime/10 !text-lime ring-1 ring-inset ring-lime/20"
    isActive={(_, location) => item.to === '/accounts' ? location.pathname.startsWith('/accounts') : location.pathname === item.to}
    aria-label={collapsed ? item.label : undefined} title={collapsed ? item.label : undefined}>
    <Icon size={19} className="shrink-0"/><span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{item.label}</span>
  </NavLink>;
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onClose }) {
  return <>
    <button type="button" className={`fixed inset-0 z-40 bg-black/70 transition-opacity md:hidden ${mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} aria-label="Close navigation menu" tabIndex={mobileOpen ? 0 : -1}/>
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-[#090d13] transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:sticky md:top-0 md:h-screen md:w-full md:translate-x-0`} aria-label="Application navigation">
      <div className="flex h-16 items-center border-b border-line px-4"><div className="flex min-w-0 flex-1 items-center gap-3"><img src="/yb-journal-logo.png" alt="YB-Journal logo" className="h-11 w-11 shrink-0 object-contain"/>{!collapsed && <div className="hidden min-w-0 md:block"><p className="truncate font-semibold"><span className="text-lime">YB</span>-Journal</p><p className="truncate text-[11px] text-muted">Trading journal</p></div>}<div className="min-w-0 md:hidden"><p className="truncate font-semibold"><span className="text-lime">YB</span>-Journal</p><p className="text-[11px] text-muted">Trading journal</p></div></div><button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime md:hidden" onClick={onClose} aria-label="Close navigation menu"><X size={20}/></button></div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Primary navigation">{primaryItems.map((item) => <NavigationItem key={item.to} item={item} collapsed={collapsed} onNavigate={onClose}/>)}<div className="mt-auto border-t border-line pt-3"><NavigationItem item={{ label: 'Settings', to: '/settings', icon: Settings }} collapsed={collapsed} onNavigate={onClose}/></div></nav>
      <div className="hidden border-t border-line p-3 md:block"><button type="button" className={`flex h-10 w-full items-center rounded-lg px-3 text-sm text-slate-400 transition hover:bg-white/[.045] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime ${collapsed ? 'justify-center' : 'gap-3'}`} onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={19}/> : <><ChevronLeft size={19}/><span>Collapse sidebar</span></>}</button></div>
    </aside>
  </>;
}
