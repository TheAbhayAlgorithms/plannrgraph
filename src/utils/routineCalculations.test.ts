import { describe, it, expect } from 'vitest';
import {
  timeStringToMinutes,
  getSlotIntervals,
  detectSlotOverlaps,
  calculateRoutineTotal,
} from './routineCalculations';
import { RoutineSlot } from '../types';

describe('Routine Calculations', () => {
  it('converts time strings to minutes from midnight', () => {
    expect(timeStringToMinutes('00:00')).toBe(0);
    expect(timeStringToMinutes('04:45')).toBe(285);
    expect(timeStringToMinutes('12:30')).toBe(750);
    expect(timeStringToMinutes('23:59')).toBe(1439);
  });

  it('normalizes daytime and overnight intervals', () => {
    // Normal daytime
    expect(getSlotIntervals('05:00', '06:00')).toEqual([{ start: 300, end: 360 }]);

    // Overnight (e.g. 23:15 to 04:45)
    const overnight = getSlotIntervals('23:15', '04:45');
    expect(overnight).toEqual([
      { start: 1395, end: 1440 },
      { start: 0, end: 285 },
    ]);
  });

  it('detects overlapping slots accurately without false positives on adjacent times', () => {
    const slots: RoutineSlot[] = [
      {
        id: 'slot-1',
        dayType: 'weekday',
        startTime: '04:45',
        endTime: '05:00',
        title: 'Wake',
        categoryId: 'cat-1',
      },
      {
        id: 'slot-2',
        dayType: 'weekday',
        startTime: '05:00', // Touching endpoint: NOT an overlap
        endTime: '05:30',
        title: 'Workout',
        categoryId: 'cat-1',
      },
      {
        id: 'slot-3',
        dayType: 'weekday',
        startTime: '05:15', // Overlaps with slot-2 (05:00 - 05:30)
        endTime: '05:45',
        title: 'Conflicting Slot',
        categoryId: 'cat-1',
      },
    ];

    const conflicts = detectSlotOverlaps(slots);

    // slot-1 has no overlaps
    expect(conflicts['slot-1']).toBeUndefined();

    // slot-2 and slot-3 overlap with each other
    expect(conflicts['slot-2']).toBeDefined();
    expect(conflicts['slot-2'].length).toBe(1);
    expect(conflicts['slot-2'][0].conflictingSlotId).toBe('slot-3');

    expect(conflicts['slot-3']).toBeDefined();
    expect(conflicts['slot-3'].length).toBe(1);
    expect(conflicts['slot-3'][0].conflictingSlotId).toBe('slot-2');
  });

  it('detects overnight overlap', () => {
    const slots: RoutineSlot[] = [
      {
        id: 'sleep',
        dayType: 'weekday',
        startTime: '23:15',
        endTime: '04:45',
        title: 'Sleep',
        categoryId: 'cat-1',
      },
      {
        id: 'early-bird',
        dayType: 'weekday',
        startTime: '04:00', // Collides with sleep (00:00 - 04:45)
        endTime: '05:00',
        title: 'Early Workout',
        categoryId: 'cat-1',
      },
    ];

    const conflicts = detectSlotOverlaps(slots);
    expect(conflicts['sleep']).toBeDefined();
    expect(conflicts['early-bird']).toBeDefined();
  });

  it('calculates total routine hours and flags when exceeding 24 hours', () => {
    const normalSlots: RoutineSlot[] = [
      { id: '1', dayType: 'weekday', startTime: '06:00', endTime: '12:00', title: 'A', categoryId: 'cat-1' }, // 6h
      { id: '2', dayType: 'weekday', startTime: '12:00', endTime: '18:00', title: 'B', categoryId: 'cat-1' }, // 6h
    ];
    const normalResult = calculateRoutineTotal(normalSlots);
    expect(normalResult.totalMinutes).toBe(720); // 12h
    expect(normalResult.exceeds24Hours).toBe(false);

    const excessiveSlots: RoutineSlot[] = [
      { id: '1', dayType: 'weekday', startTime: '00:00', endTime: '20:00', title: 'A', categoryId: 'cat-1' }, // 20h
      { id: '2', dayType: 'weekday', startTime: '20:00', endTime: '06:00', title: 'B', categoryId: 'cat-1' }, // 10h -> 30h total
    ];
    const excessiveResult = calculateRoutineTotal(excessiveSlots);
    expect(excessiveResult.totalMinutes).toBe(1800); // 30h
    expect(excessiveResult.exceeds24Hours).toBe(true);
  });
});
