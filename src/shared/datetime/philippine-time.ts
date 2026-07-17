/** Philippines uses a fixed UTC+8 offset (no DST). */
export const PHILIPPINE_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;
export const PHILIPPINE_TIMEZONE = 'Asia/Manila';

function toPhWallClock(date: Date): Date {
  return new Date(date.getTime() + PHILIPPINE_UTC_OFFSET_MS);
}

function fromPhWallClock(wall: Date): Date {
  return new Date(wall.getTime() - PHILIPPINE_UTC_OFFSET_MS);
}

export function phDateParts(date: Date): { year: number; month: number; day: number } {
  const wall = toPhWallClock(date);
  return {
    year: wall.getUTCFullYear(),
    month: wall.getUTCMonth() + 1,
    day: wall.getUTCDate(),
  };
}

/** Monday-based weekday in PH: 0 = Sunday, 1 = Monday, … */
export function phWeekday(date: Date): number {
  return toPhWallClock(date).getUTCDay();
}

export function startOfPhDay(date: Date): Date {
  const wall = toPhWallClock(date);
  const startWall = new Date(
    Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate(), 0, 0, 0, 0),
  );
  return fromPhWallClock(startWall);
}

export function endOfPhDay(date: Date): Date {
  const wall = toPhWallClock(date);
  const endWall = new Date(
    Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate(), 23, 59, 59, 999),
  );
  return fromPhWallClock(endWall);
}

export function formatPhDate(date: Date): string {
  const { year, month, day } = phDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function toPhCompactDate(date: Date): string {
  const { year, month, day } = phDateParts(date);
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

export function parsePhDateInput(value?: string): Date {
  if (value) {
    const [yearRaw, monthRaw, dayRaw] = value.split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    if (!year || !month || !day) {
      throw new Error(`Invalid date input: ${value}`);
    }
    return fromPhWallClock(new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)));
  }
  return startOfPhDay(new Date());
}

export function isSamePhDay(left: Date, right: Date): boolean {
  return formatPhDate(left) === formatPhDate(right);
}

export function addPhDays(date: Date, days: number): Date {
  const wall = toPhWallClock(date);
  wall.setUTCDate(wall.getUTCDate() + days);
  return fromPhWallClock(wall);
}

export function toPhSequenceDate(date: Date): Date {
  return startOfPhDay(date);
}

export function phDateOrdinal(date: Date): number {
  const wall = toPhWallClock(date);
  return Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate());
}

export function phDateTime(
  date: Date,
  hour: number,
  minute = 0,
  second = 0,
  millisecond = 0,
): Date {
  const { year, month, day } = phDateParts(startOfPhDay(date));
  return fromPhWallClock(
    new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond)),
  );
}

export function toPhilippineOffsetIsoString(date: Date): string {
  const wall = toPhWallClock(date);
  const year = wall.getUTCFullYear();
  const month = String(wall.getUTCMonth() + 1).padStart(2, '0');
  const day = String(wall.getUTCDate()).padStart(2, '0');
  const hours = String(wall.getUTCHours()).padStart(2, '0');
  const minutes = String(wall.getUTCMinutes()).padStart(2, '0');
  const seconds = String(wall.getUTCSeconds()).padStart(2, '0');
  const millis = String(wall.getUTCMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${millis}+08:00`;
}

export function startOfPhWeek(date: Date): Date {
  const diff = phWeekday(date) === 0 ? -6 : 1 - phWeekday(date);
  return startOfPhDay(addPhDays(date, diff));
}

export function endOfPhWeek(date: Date): Date {
  return endOfPhDay(addPhDays(startOfPhWeek(date), 6));
}

export function startOfPhMonth(date: Date): Date {
  const { year, month } = phDateParts(date);
  return fromPhWallClock(new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)));
}

export function endOfPhMonth(date: Date): Date {
  const { year, month } = phDateParts(date);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return fromPhWallClock(new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)));
}

export function startOfPhYear(date: Date): Date {
  const { year } = phDateParts(date);
  return fromPhWallClock(new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)));
}

export function endOfPhYear(date: Date): Date {
  const { year } = phDateParts(date);
  return fromPhWallClock(new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)));
}

export function serializeDatesForApi<T>(value: T): T {
  if (value instanceof Date) {
    return toPhilippineOffsetIsoString(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => serializeDatesForApi(entry)) as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = serializeDatesForApi(entry);
    }
    return result as T;
  }
  return value;
}
