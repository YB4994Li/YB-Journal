export const money = (value, currency = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency', currency, maximumFractionDigits: 2
}).format(Number(value || 0));
export const shortDate = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';
export const number = (value, digits = 4) => value == null || value === '' ? '—' : Number(value).toLocaleString('en-US', { maximumFractionDigits: digits });
