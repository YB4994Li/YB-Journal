import { SESSION_TIMEZONE, SESSION_WINDOWS } from '../config/sessionConfig.js';

export function parseBrokerUtcDateTime(value) {
  const input = String(value ?? '').trim();
  if (!input) return null;
  let match = input.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/);
  let parts;
  if (match) {
    parts = [match[1], match[2], match[3], match[4] ?? 0, match[5] ?? 0, match[6] ?? 0, match[7] ?? 0];
  } else {
    match = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/);
    if (!match) return null;
    parts = [match[3], match[2], match[1], match[4] ?? 0, match[5] ?? 0, match[6] ?? 0, match[7] ?? 0];
  }
  const [year, month, day, hour, minute, second, milliseconds] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second, milliseconds));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day
    || date.getUTCHours() !== hour || date.getUTCMinutes() !== minute || date.getUTCSeconds() !== second) return null;
  return date;
}

export function detectSession(openTimeUtc) {
  if (!(openTimeUtc instanceof Date) || Number.isNaN(openTimeUtc.getTime())) return 'UNKNOWN';
  const hour = openTimeUtc.getUTCHours();
  return SESSION_WINDOWS.find((window) => hour >= window.startHour && hour <= window.endHour)?.session ?? 'UNKNOWN';
}

export function autoSessionFields(openingValue, closingValue) {
  const openTimeUtc = parseBrokerUtcDateTime(openingValue);
  return {
    openTimeUtc,
    closeTimeUtc: parseBrokerUtcDateTime(closingValue),
    session: detectSession(openTimeUtc),
    sessionTimezone: SESSION_TIMEZONE,
    sessionDetection: 'AUTO'
  };
}
