/**
 * Business calendar boundaries for Scrappy (Philippines, UTC+8).
 * Function names retain the historical `Utc` suffix for compatibility.
 */
export {
  addPhDays as addUtcDays,
  endOfPhDay as endOfUtcDay,
  formatPhDate as formatUtcDate,
  isSamePhDay as isSameUtcDay,
  parsePhDateInput as parseDateInput,
  phWeekday,
  startOfPhDay as startOfUtcDay,
} from './philippine-time.js';
