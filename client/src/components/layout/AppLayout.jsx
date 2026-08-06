import { useEffect, useState } from 'react';
import MobileHeader from './MobileHeader.jsx';
import Sidebar from './Sidebar.jsx';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setCollapsed((value) => { localStorage.setItem('sidebarCollapsed', String(!value)); return !value; });
  useEffect(() => { const close = (event) => { if (event.key === 'Escape') setMobileOpen(false); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, []);
  useEffect(() => { document.body.style.overflow = mobileOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [mobileOpen]);
  return <div
    className="min-h-screen bg-ink md:grid"
    style={{ gridTemplateColumns: `${collapsed ? '5rem' : '16rem'} minmax(0, 1fr)`, transition: 'grid-template-columns 200ms ease' }}
  >
    <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onToggle={toggle} onClose={() => setMobileOpen(false)}/>
    <div className="min-w-0">
      <MobileHeader onOpen={() => setMobileOpen(true)}/>
      {children}
    </div>
  </div>;
}
