const TIMEZONE_STORAGE_KEY = 'focusspark-timezone';

const hasTimezoneOffset = (value: string) => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim());

export function getDeviceTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function getUserTimeZone() {
  return localStorage.getItem(TIMEZONE_STORAGE_KEY) || getDeviceTimeZone();
}

export function setUserTimeZone(timeZone: unknown) {
  if (typeof timeZone !== 'string' || !timeZone.trim()) return;
  localStorage.setItem(TIMEZONE_STORAGE_KEY, timeZone.trim());
}

export function parseBackendDate(value: string | Date) {
  if (value instanceof Date) return value;
  const source = String(value).trim();
  return new Date(hasTimezoneOffset(source) ? source : `${source}Z`);
}

export function formatUserDate(value: string | Date) {
  const date = parseBackendDate(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeZone: getUserTimeZone(),
  }).format(date);
}

export function formatUserTime(value: string | Date) {
  const date = parseBackendDate(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: getUserTimeZone(),
  }).format(date);
}
