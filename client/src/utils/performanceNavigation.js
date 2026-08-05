export const PERFORMANCE_TABS = ['overview', 'markets', 'strategies', 'sessions', 'timeframes', 'directions', 'weekdays'];
export const BREAKDOWN_BY_TAB = { markets: 'market', strategies: 'strategy', sessions: 'session', timeframes: 'timeframe', directions: 'direction', weekdays: 'weekday' };

export function performanceQuery({ tab, accountId, phaseId, from, to }) {
  const params = new URLSearchParams();
  if (tab && tab !== 'overview') params.set('tab', tab);
  if (accountId) params.set('accountId', accountId);
  if (phaseId) params.set('phaseId', phaseId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return params.toString();
}

export function journalDrillDownUrl({ accountId, phaseId, from, to, journalFilter = {} }) {
  const params = new URLSearchParams({ accountId: String(accountId) });
  if (phaseId) params.set('phaseId', phaseId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  for (const [key, value] of Object.entries(journalFilter)) if (value !== undefined && value !== null && value !== '') params.set(key, value);
  return `/journal?${params.toString()}`;
}

export function journalFiltersFromSearch(search, pageSize = 10) {
  const params = new URLSearchParams(search);
  return { page: 1, limit: pageSize, search: '', market: params.get('market') || '', strategy: '', strategyId: params.get('strategyId') || '', session: params.get('session') || '', timeframe: params.get('timeframe') || '', direction: params.get('direction') || '', weekday: params.get('weekday') || '', result: '', startDate: params.get('from') || params.get('startDate') || '', endDate: params.get('to') || params.get('endDate') || '', sortBy: 'tradeDate', sortOrder: 'desc' };
}
