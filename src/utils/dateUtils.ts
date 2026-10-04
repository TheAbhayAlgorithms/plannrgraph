import {
  format,
  parseISO,
  isBefore,
  isSameDay,
  addDays,
  isWeekend as dateFnsIsWeekend,
  differenceInMinutes,
  parse,
} from 'date-fns';
import { DayType } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD from the device clock.
 */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  return format(referenceDate, 'yyyy-MM-dd');
}

/**
 * Checks if target date is strictly before today (yesterday or earlier).
 */
export function isPastDate(dateStr: string, todayStr: string = getTodayDateString()): boolean {
  return dateStr < todayStr;
}

/**
 * Checks if target date is today.
 */
export function isTodayDate(dateStr: string, todayStr: string = getTodayDateString()): boolean {
  return dateStr === todayStr;
}

/**
 * Checks if target date is strictly after today (tomorrow or later).
 */
export function isFutureDate(dateStr: string, todayStr: string = getTodayDateString()): boolean {
  return dateStr > todayStr;
}

/**
 * Determines whether a date string is 'weekend' or 'weekday'.
 */
export function getDayType(dateStr: string): DayType {
  const date = parseISO(dateStr);
  return dateFnsIsWeekend(date) ? 'weekend' : 'weekday';
}

/**
 * Generates an array of date strings (YYYY-MM-DD) inclusive between start and end.
 */
export function generateDateRange(startDateStr: string, endDateStr: string): string[] {
  if (startDateStr > endDateStr) return [];
  const dates: string[] = [];
  let current = parseISO(startDateStr);
  const end = parseISO(endDateStr);

  while (isBefore(current, end) || isSameDay(current, end)) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current = addDays(current, 1);
  }

  return dates;
}

/**
 * Calculates duration in minutes between 'HH:mm' and 'HH:mm'.
 * If endTime is earlier than startTime (e.g. crossing midnight), adds 24 hours.
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  try {
    const baseDate = '2026-01-01';
    const start = parse(`${baseDate} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    let end = parse(`${baseDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

    if (isBefore(end, start)) {
      end = addDays(end, 1);
    }

    const diff = differenceInMinutes(end, start);
    return Math.max(0, diff);
  } catch {
    return 0;
  }
}

/**
 * Formats minutes into human-readable hours and minutes (e.g. 90 -> "1h 30m" or 120 -> "2h")
 */
export function formatMinutesToHours(minutes: number): string {
  if (minutes <= 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

/**
 * Formats date into readable string, e.g. "04 Oct, Sun"
 */
export function formatDisplayDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM, EEE');
  } catch {
    return dateStr;
  }
}
