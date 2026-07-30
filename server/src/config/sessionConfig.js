// Fixed UTC windows are intentional because broker timestamps are UTC.
// A future detector can add market-local IANA time zones and DST rules here.
export const SESSION_TIMEZONE = 'UTC';

export const SESSION_WINDOWS = Object.freeze([
  { session: 'ASIA', startHour: 0, endHour: 7 },
  { session: 'LONDON', startHour: 8, endHour: 12 },
  { session: 'NEW_YORK', startHour: 13, endHour: 20 },
  { session: 'AFTER_HOURS', startHour: 21, endHour: 23 }
]);

export const SESSION_OPTIONS = Object.freeze([
  ...SESSION_WINDOWS.map(({ session }) => session),
  'UNKNOWN'
]);
