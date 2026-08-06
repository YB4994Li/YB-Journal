import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api/client.js';

const ActiveAccountContext = createContext(null);

const storedNumber = (key) => { const value = Number(localStorage.getItem(key)); return value || null; };

export function ActiveAccountProvider({ children }) {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAccountId, setAccountId] = useState(() => Number(query.get('accountId')) || storedNumber('activeAccountId'));
  const [activePhaseId, setPhaseId] = useState(() => Number(query.get('phaseId')) || storedNumber('activePhaseId'));

  const refreshAccounts = useCallback(async () => {
    const { data } = await api.get('/accounts');
    setAccounts(data.data);
    return data.data;
  }, []);

  useEffect(() => { refreshAccounts().catch(() => setAccounts([])).finally(() => setLoading(false)); }, [refreshAccounts]);
  useEffect(() => {
    const accountId = Number(query.get('accountId')), phaseId = Number(query.get('phaseId'));
    if (accountId) {
      setAccountId(accountId); setPhaseId(phaseId || null);
      localStorage.setItem('activeAccountId', String(accountId));
      phaseId ? localStorage.setItem('activePhaseId', String(phaseId)) : localStorage.removeItem('activePhaseId');
    }
  }, [location.search]);

  const activeAccount = accounts.find((account) => account.id === activeAccountId) || null;
  const activePhase = activeAccount?.phases?.find((phase) => phase.id === activePhaseId) || null;

  useEffect(() => {
    if (loading || !activeAccountId) return;
    if (!activeAccount) { setAccountId(null); setPhaseId(null); localStorage.removeItem('activeAccountId'); localStorage.removeItem('activePhaseId'); }
  }, [loading, activeAccountId, activeAccount]);

  const setActiveAccount = useCallback((account, phase = null) => {
    const accountId = account?.id || null, phaseId = account?.accountType === 'FUNDED' ? phase?.id || null : null;
    setAccountId(accountId); setPhaseId(phaseId);
    accountId ? localStorage.setItem('activeAccountId', String(accountId)) : localStorage.removeItem('activeAccountId');
    phaseId ? localStorage.setItem('activePhaseId', String(phaseId)) : localStorage.removeItem('activePhaseId');
  }, []);
  const setActivePhaseId = useCallback((phaseId) => {
    const id = Number(phaseId) || null; setPhaseId(id);
    id ? localStorage.setItem('activePhaseId', String(id)) : localStorage.removeItem('activePhaseId');
  }, []);

  const value = useMemo(() => ({ accounts, loading, activeAccountId, activeAccount, activePhaseId, activePhase, setActiveAccount, setActivePhaseId, refreshAccounts }), [accounts, loading, activeAccountId, activeAccount, activePhaseId, activePhase, setActiveAccount, setActivePhaseId, refreshAccounts]);
  return <ActiveAccountContext.Provider value={value}>{children}</ActiveAccountContext.Provider>;
}

export function useActiveAccount() {
  const value = useContext(ActiveAccountContext);
  if (!value) throw new Error('useActiveAccount must be used inside ActiveAccountProvider');
  return value;
}
