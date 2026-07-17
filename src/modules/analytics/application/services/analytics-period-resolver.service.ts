import type { AnalyticsPeriod, AnalyticsPeriodBounds } from '../../domain/analytics-period.js';
import {
  endOfPhDay,
  endOfPhMonth,
  endOfPhWeek,
  endOfPhYear,
  startOfPhDay,
  startOfPhMonth,
  startOfPhWeek,
  startOfPhYear,
  addPhDays,
} from '../../../../shared/datetime/philippine-time.js';

export class AnalyticsPeriodResolverService {
  resolve(
    period: AnalyticsPeriod,
    from?: Date,
    to?: Date,
    now = new Date(),
  ): AnalyticsPeriodBounds {
    switch (period) {
      case 'TODAY':
        return { from: startOfPhDay(now), to: endOfPhDay(now) };
      case 'YESTERDAY': {
        const yesterday = addPhDays(now, -1);
        return { from: startOfPhDay(yesterday), to: endOfPhDay(yesterday) };
      }
      case 'THIS_WEEK':
        return { from: startOfPhWeek(now), to: endOfPhWeek(now) };
      case 'THIS_MONTH':
        return { from: startOfPhMonth(now), to: endOfPhMonth(now) };
      case 'THIS_YEAR':
        return { from: startOfPhYear(now), to: endOfPhYear(now) };
      case 'CUSTOM':
        if (!from || !to) {
          throw new Error('Custom period requires from and to');
        }
        return { from, to };
      default:
        return { from: startOfPhMonth(now), to: endOfPhMonth(now) };
    }
  }
}
