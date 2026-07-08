import type { AnalyticsPeriod, AnalyticsPeriodBounds } from '../../domain/analytics-period.js';

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  return startOfUtcDay(monday);
}

function endOfUtcWeek(date: Date): Date {
  const start = startOfUtcWeek(date);
  const sunday = new Date(start);
  sunday.setUTCDate(start.getUTCDate() + 6);
  return endOfUtcDay(sunday);
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function startOfUtcYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function endOfUtcYear(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
}

export class AnalyticsPeriodResolverService {
  resolve(
    period: AnalyticsPeriod,
    from?: Date,
    to?: Date,
    now = new Date(),
  ): AnalyticsPeriodBounds {
    switch (period) {
      case 'TODAY':
        return { from: startOfUtcDay(now), to: endOfUtcDay(now) };
      case 'YESTERDAY': {
        const yesterday = new Date(now);
        yesterday.setUTCDate(now.getUTCDate() - 1);
        return { from: startOfUtcDay(yesterday), to: endOfUtcDay(yesterday) };
      }
      case 'THIS_WEEK':
        return { from: startOfUtcWeek(now), to: endOfUtcWeek(now) };
      case 'THIS_MONTH':
        return { from: startOfUtcMonth(now), to: endOfUtcMonth(now) };
      case 'THIS_YEAR':
        return { from: startOfUtcYear(now), to: endOfUtcYear(now) };
      case 'CUSTOM':
        if (!from || !to) {
          throw new Error('Custom period requires from and to');
        }
        return { from, to };
      default:
        return { from: startOfUtcMonth(now), to: endOfUtcMonth(now) };
    }
  }
}
