// Date-only values are calendar days, so compare their YYYY-MM-DD keys instead
// of comparing timestamps that may use different time zones.
export function isValidDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Prisma's @db.Date field is represented as a DateTime. UTC midnight keeps
// database boundaries anchored to the requested calendar day on every host.
export function dateOnlyToUtcDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function nextDateOnlyUtcDate(value) {
  const date = dateOnlyToUtcDate(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}
