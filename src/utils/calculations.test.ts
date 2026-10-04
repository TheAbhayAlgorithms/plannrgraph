import { describe, it, expect } from 'vitest';
import {
  getTaskCellStatus,
  calculateDayCompletion,
  isStrongDay,
  calculatePlannedStudyHours,
  calculateActualStudyHours,
  calculateTopicProgress,
  calculatePerTaskTotals,
} from './calculations';
import {
  getDayType,
  generateDateRange,
  calculateDurationMinutes,
  formatMinutesToHours,
  isPastDate,
  isTodayDate,
} from './dateUtils';
import { Topic, DayPlan } from '../types';

describe('Date Utilities', () => {
  it('identifies weekday vs weekend accurately', () => {
    // 2026-10-04 is Sunday -> weekend
    expect(getDayType('2026-10-04')).toBe('weekend');
    // 2026-10-05 is Monday -> weekday
    expect(getDayType('2026-10-05')).toBe('weekday');
    // 2026-10-10 is Saturday -> weekend
    expect(getDayType('2026-10-10')).toBe('weekend');
  });

  it('generates inclusive date range', () => {
    const range = generateDateRange('2026-10-04', '2026-10-06');
    expect(range).toEqual(['2026-10-04', '2026-10-05', '2026-10-06']);
  });

  it('calculates duration in minutes and handles formatting', () => {
    expect(calculateDurationMinutes('04:45', '05:05')).toBe(20);
    expect(calculateDurationMinutes('08:30', '12:30')).toBe(240);
    expect(formatMinutesToHours(20)).toBe('20m');
    expect(formatMinutesToHours(60)).toBe('1h');
    expect(formatMinutesToHours(90)).toBe('1h 30m');
    expect(formatMinutesToHours(240)).toBe('4h');
  });

  it('evaluates past, today, and future dates against today reference', () => {
    const today = '2026-10-05';
    expect(isPastDate('2026-10-04', today)).toBe(true);
    expect(isPastDate('2026-10-05', today)).toBe(false);
    expect(isTodayDate('2026-10-05', today)).toBe(true);
    expect(isPastDate('2026-10-06', today)).toBe(false);
  });
});

describe('Task Cell Status Logic', () => {
  const today = '2026-10-05';

  it('marks ticked task as done regardless of date', () => {
    expect(getTaskCellStatus(true, '2026-10-04', today)).toBe('done');
    expect(getTaskCellStatus(true, '2026-10-05', today)).toBe('done');
    expect(getTaskCellStatus(true, '2026-10-06', today)).toBe('done');
  });

  it('marks unticked past task as missed (light red)', () => {
    expect(getTaskCellStatus(false, '2026-10-04', today)).toBe('missed');
  });

  it('marks unticked today or future task as pending (faded grey)', () => {
    // Today stays pending until the day ends
    expect(getTaskCellStatus(false, '2026-10-05', today)).toBe('pending');
    // Future stays pending
    expect(getTaskCellStatus(false, '2026-10-06', today)).toBe('pending');
  });
});

describe('Day Completion & Strong Days', () => {
  it('calculates completion percentage correctly', () => {
    expect(calculateDayCompletion(0, 9)).toBe(0);
    expect(calculateDayCompletion(9, 9)).toBe(100);
    // 7 / 9 = 77.777... -> 77.8%
    expect(calculateDayCompletion(7, 9)).toBe(77.8);
    // 8 / 9 = 88.888... -> 88.9%
    expect(calculateDayCompletion(8, 9)).toBe(88.9);
  });

  it('detects strong day according to threshold', () => {
    expect(isStrongDay(77.8, 80)).toBe(false);
    expect(isStrongDay(80.0, 80)).toBe(true);
    expect(isStrongDay(88.9, 80)).toBe(true);
  });
});

describe('Study Hours Calculations', () => {
  it('calculates planned study hours for weekday (2h) and weekend (8h)', () => {
    expect(calculatePlannedStudyHours('weekday')).toBe(2);
    expect(calculatePlannedStudyHours('weekend')).toBe(8);
  });

  it('calculates actual study hours based on Study 1 and Study 2 ticks', () => {
    // Weekday: each block is worth 1h (2 / 2)
    expect(calculateActualStudyHours('weekday', false, false)).toBe(0);
    expect(calculateActualStudyHours('weekday', true, false)).toBe(1);
    expect(calculateActualStudyHours('weekday', false, true)).toBe(1);
    expect(calculateActualStudyHours('weekday', true, true)).toBe(2);

    // Weekend: each block is worth 4h (8 / 2)
    expect(calculateActualStudyHours('weekend', false, false)).toBe(0);
    expect(calculateActualStudyHours('weekend', true, false)).toBe(4);
    expect(calculateActualStudyHours('weekend', true, true)).toBe(8);
  });
});

describe('Topic Progress (with Test exclusion)', () => {
  it('correctly weights regular topics (3 boxes) and test topics (1 box)', () => {
    const topics: Topic[] = [
      {
        id: 'top-1',
        subjectId: 'sub-1',
        title: 'Classes & Objects',
        targetDate: '2026-10-04',
        isTest: false,
        video: true,
        code: true,
        written: false, // 2 out of 3 ticked
      },
      {
        id: 'top-2',
        subjectId: 'sub-1',
        title: 'Constructors',
        targetDate: '2026-10-05',
        isTest: false,
        video: true,
        code: true,
        written: true, // 3 out of 3 ticked
      },
      {
        id: 'top-test',
        subjectId: 'sub-1',
        title: 'TEST: 10 programs',
        targetDate: '2026-10-10',
        isTest: true,
        video: false, // ignored because isTest
        code: false, // ignored because isTest
        written: true, // 1 out of 1 ticked
      },
    ];

    // Applicable = 3 (topic 1) + 3 (topic 2) + 1 (test) = 7
    // Ticked = 2 + 3 + 1 = 6
    // Percentage = (6 / 7) * 100 = 85.7... -> 86%
    const progress = calculateTopicProgress(topics);
    expect(progress.applicable).toBe(7);
    expect(progress.ticked).toBe(6);
    expect(progress.percentage).toBe(86);
  });
});

describe('Per-Task Totals for Tracker Footer', () => {
  it('aggregates done and missed across history', () => {
    const today = '2026-10-06';
    const dates = ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'];
    const taskId = 'task-brush';

    const dayPlans: Record<string, DayPlan> = {
      '2026-10-04': { date: '2026-10-04', overrides: { [taskId]: { done: true } } },
      '2026-10-05': { date: '2026-10-05', overrides: { [taskId]: { done: false } } }, // missed (past)
      '2026-10-06': { date: '2026-10-06', overrides: { [taskId]: { done: false } } }, // pending (today)
      '2026-10-07': { date: '2026-10-07', overrides: { [taskId]: { done: false } } }, // pending (future)
    };

    const totals = calculatePerTaskTotals(taskId, dates, dayPlans, today);
    expect(totals.done).toBe(1);
    expect(totals.missed).toBe(1); // Only 2026-10-05 counts as missed, today & future are pending
  });
});
