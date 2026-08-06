export const ACCOUNT_SCOPED_ROUTES = ['/journal', '/performance', '/calendar', '/daily-notes'];

export function accessiblePhase(account) {
  if (!account || account.accountType !== 'FUNDED') return null;
  const phases = account.phases || [];
  return phases.find((phase) => phase.status === 'ACTIVE') || [...phases].reverse().find((phase) => !['LOCKED', 'ARCHIVED'].includes(phase.status)) || null;
}

export function accountScopeSearch(accountId, phaseId) {
  const params = new URLSearchParams();
  if (accountId) params.set('accountId', accountId);
  if (phaseId) params.set('phaseId', phaseId);
  return params.toString() ? `?${params}` : '';
}

export function scopedModuleUrl(path, accountId, phaseId) {
  return `${path}${accountScopeSearch(accountId, phaseId)}`;
}
