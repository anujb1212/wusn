// src/utils/dateHelpers.ts
/**
 * Date Helpers
 */
import { TIME_CONSTANTS } from './constants.js';
export function getStartOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
export function getEndOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
export function getDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}
export function getDaysElapsed(startDate, endDate = new Date()) {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / TIME_CONSTANTS.MS_PER_DAY);
}
export function formatISODate(date) {
    const str = date.toISOString().split('T')[0];
    if (!str)
        throw new Error('Invalid date');
    return str;
}
export function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}
export function getDateRange(startDate, endDate) {
    const dates = [];
    const current = getStartOfDay(startDate);
    const end = getStartOfDay(endDate);
    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}
export function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 10)
        return 'KHARIF';
    if (month >= 11 || month <= 3)
        return 'RABI';
    return 'ZAID';
}
//# sourceMappingURL=dateHelpers.js.map