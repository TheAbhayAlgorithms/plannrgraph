import { DayPlan, DayType, TaskCellStatus, TaskTemplate, Topic } from '../types';
import { isPastDate, getDayType } from './dateUtils';

/**
 * Determines the status of a specific task on a given date.
 * - done: user checked it off
 * - missed: date is strictly in the past (before today) and was not checked off
 * - pending: date is today or future, and not yet checked off
 */
export function getTaskCellStatus(
  isDone: boolean,
  dateStr: string,
  todayStr: string
): TaskCellStatus {
  if (isDone) {
    return 'done';
  }
  if (isPastDate(dateStr, todayStr)) {
    return 'missed';
  }
  return 'pending';
}

/**
 * Calculates day completion percentage: (ticks / active tasks) * 100
 */
export function calculateDayCompletion(
  doneCount: number,
  activeTaskCount: number
): number {
  if (activeTaskCount <= 0) return 0;
  const percentage = (doneCount / activeTaskCount) * 100;
  return Math.round(percentage * 10) / 10;
}

/**
 * Checks if a day meets the "strong day" completion threshold.
 */
export function isStrongDay(completionPercentage: number, threshold = 80): boolean {
  return completionPercentage >= threshold;
}

/**
 * Calculates planned study hours for a specific day.
 */
export function calculatePlannedStudyHours(
  dayType: DayType,
  studyHoursWeekday = 2,
  studyHoursWeekend = 8
): number {
  return dayType === 'weekend' ? studyHoursWeekend : studyHoursWeekday;
}

/**
 * Calculates actual study hours completed on a given day.
 * Each study block (Study 1, Study 2) contributes 50% of that day's planned study hours.
 */
export function calculateActualStudyHours(
  dayType: DayType,
  study1Done: boolean,
  study2Done: boolean,
  studyHoursWeekday = 2,
  studyHoursWeekend = 8
): number {
  const plannedHours = calculatePlannedStudyHours(dayType, studyHoursWeekday, studyHoursWeekend);
  const blockWeight = plannedHours / 2;
  let hours = 0;
  if (study1Done) hours += blockWeight;
  if (study2Done) hours += blockWeight;
  return hours;
}

/**
 * Calculates topic progress for a list of topics under a subject.
 * Tests skip the Video and Code ticks (only written/test box applies).
 */
export function calculateTopicProgress(topics: Topic[]): {
  ticked: number;
  applicable: number;
  percentage: number;
} {
  if (topics.length === 0) {
    return { ticked: 0, applicable: 0, percentage: 0 };
  }

  let ticked = 0;
  let applicable = 0;

  for (const topic of topics) {
    if (topic.isTest) {
      applicable += 1;
      if (topic.written) ticked += 1;
    } else {
      applicable += 3;
      if (topic.video) ticked += 1;
      if (topic.code) ticked += 1;
      if (topic.written) ticked += 1;
    }
  }

  const percentage = applicable > 0 ? Math.round((ticked / applicable) * 100) : 0;
  return { ticked, applicable, percentage };
}

/**
 * Calculates the number of done and missed (not done) instances for a specific task template across date range.
 */
export function calculatePerTaskTotals(
  taskId: string,
  dates: string[],
  dayPlans: Record<string, DayPlan>,
  todayStr: string
): { done: number; missed: number } {
  let done = 0;
  let missed = 0;

  for (const date of dates) {
    const plan = dayPlans[date];
    const isDone = plan?.overrides[taskId]?.done ?? false;
    const status = getTaskCellStatus(isDone, date, todayStr);

    if (status === 'done') {
      done++;
    } else if (status === 'missed') {
      missed++;
    }
  }

  return { done, missed };
}

/**
 * Calculates day metrics for a given date.
 */
export function calculateDayMetrics(
  dateStr: string,
  activeTasks: TaskTemplate[],
  dayPlan: DayPlan | undefined,
  todayStr: string,
  studyHoursWeekday = 2,
  studyHoursWeekend = 8
): {
  totalTasks: number;
  doneCount: number;
  missedCount: number;
  pendingCount: number;
  completionPercentage: number;
  isStrong: boolean;
  studyHoursPlanned: number;
  studyHoursDone: number;
} {
  const totalTasks = activeTasks.length;
  let doneCount = 0;
  let missedCount = 0;
  let pendingCount = 0;

  let study1Done = false;
  let study2Done = false;

  for (const task of activeTasks) {
    const isDone = dayPlan?.overrides[task.id]?.done ?? false;
    const status = getTaskCellStatus(isDone, dateStr, todayStr);

    if (status === 'done') doneCount++;
    else if (status === 'missed') missedCount++;
    else pendingCount++;

    if (task.isStudy) {
      if (task.name.toLowerCase().includes('1') && isDone) study1Done = true;
      if (task.name.toLowerCase().includes('2') && isDone) study2Done = true;
    }
  }

  const completionPercentage = calculateDayCompletion(doneCount, totalTasks);
  const isStrong = isStrongDay(completionPercentage);
  const dayType = getDayType(dateStr);
  const studyHoursPlanned = calculatePlannedStudyHours(dayType, studyHoursWeekday, studyHoursWeekend);
  const studyHoursDone = calculateActualStudyHours(
    dayType,
    study1Done,
    study2Done,
    studyHoursWeekday,
    studyHoursWeekend
  );

  return {
    totalTasks,
    doneCount,
    missedCount,
    pendingCount,
    completionPercentage,
    isStrong,
    studyHoursPlanned,
    studyHoursDone,
  };
}
