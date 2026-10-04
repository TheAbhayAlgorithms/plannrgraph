import { RoutineSlot } from '../types';
import { calculateDurationMinutes, formatMinutesToHours } from './dateUtils';

export interface OverlapConflict {
  slotId: string;
  conflictingSlotId: string;
  conflictingSlotTitle: string;
  conflictingTime: string;
}

/**
 * Converts "HH:mm" 24-hr time string to minutes from midnight (0 - 1439).
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10));
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return Math.min(1439, Math.max(0, hours * 60 + minutes));
}

/**
 * Normalizes intervals, including intervals that cross midnight (e.g., 23:15 to 04:45).
 * Returns one or two intervals within [0, 1440].
 */
export function getSlotIntervals(
  startTime: string,
  endTime: string
): Array<{ start: number; end: number }> {
  const start = timeStringToMinutes(startTime);
  const end = timeStringToMinutes(endTime);

  if (start === end) {
    return [];
  }

  if (start < end) {
    return [{ start, end }];
  }

  // Crosses midnight (e.g., 23:15 to 04:45):
  // Segment 1: [23:15, 24:00 (1440)]
  // Segment 2: [00:00 (0), 04:45]
  return [
    { start, end: 1440 },
    { start: 0, end },
  ];
}

/**
 * Checks if two intervals strictly overlap (endpoints touching does NOT count as overlap).
 */
function intervalsOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number }
): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Scans a list of routine slots for overlapping time windows.
 * Returns a record of slotId -> OverlapConflict[]
 */
export function detectSlotOverlaps(
  slots: RoutineSlot[]
): Record<string, OverlapConflict[]> {
  const conflicts: Record<string, OverlapConflict[]> = {};

  for (let i = 0; i < slots.length; i++) {
    const slotA = slots[i];
    const intervalsA = getSlotIntervals(slotA.startTime, slotA.endTime);

    for (let j = i + 1; j < slots.length; j++) {
      const slotB = slots[j];
      const intervalsB = getSlotIntervals(slotB.startTime, slotB.endTime);

      let hasOverlap = false;
      for (const intA of intervalsA) {
        for (const intB of intervalsB) {
          if (intervalsOverlap(intA, intB)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      if (hasOverlap) {
        // Record conflict for slotA
        if (!conflicts[slotA.id]) conflicts[slotA.id] = [];
        conflicts[slotA.id].push({
          slotId: slotA.id,
          conflictingSlotId: slotB.id,
          conflictingSlotTitle: slotB.title,
          conflictingTime: `${slotB.startTime} - ${slotB.endTime}`,
        });

        // Record conflict for slotB
        if (!conflicts[slotB.id]) conflicts[slotB.id] = [];
        conflicts[slotB.id].push({
          slotId: slotB.id,
          conflictingSlotId: slotA.id,
          conflictingSlotTitle: slotA.title,
          conflictingTime: `${slotA.startTime} - ${slotA.endTime}`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Calculates total scheduled minutes and checks if exceeding 24 hours (1440 minutes).
 */
export function calculateRoutineTotal(slots: RoutineSlot[]): {
  totalMinutes: number;
  formattedHours: string;
  exceeds24Hours: boolean;
} {
  const totalMinutes = slots.reduce(
    (acc, slot) => acc + calculateDurationMinutes(slot.startTime, slot.endTime),
    0
  );

  return {
    totalMinutes,
    formattedHours: formatMinutesToHours(totalMinutes),
    exceeds24Hours: totalMinutes > 1440,
  };
}
