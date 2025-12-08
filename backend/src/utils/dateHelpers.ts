// src/utils/dateHelpers.ts
/**
 * Date Helpers
 */

import { TIME_CONSTANTS } from './constants.js';

export function getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function getDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

export function getDaysElapsed(startDate: Date, endDate: Date = new Date()): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.floor(diffMs / TIME_CONSTANTS.MS_PER_DAY);
}

export function formatISODate(date: Date): string {
    const str = date.toISOString().split('T')[0];
    if (!str) throw new Error('Invalid date');
    return str;
}

export function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = getStartOfDay(startDate);
    const end = getStartOfDay(endDate);

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

export function getCurrentSeason(): 'KHARIF' | 'RABI' | 'ZAID' {
    const month = new Date().getMonth() + 1;

    if (month >= 6 && month <= 10) return 'KHARIF';
    if (month >= 11 || month <= 3) return 'RABI';
    return 'ZAID';
}
