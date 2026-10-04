import {
  Assignment,
  DayPlan,
  DayType,
  Milestone,
  ResearchEntry,
  Subject,
  TaskCellStatus,
  TaskTemplate,
  Topic,
} from '../types';
import { isPastDate, getDayType, getTodayDateString } from './dateUtils';
import { differenceInCalendarDays, parseISO, startOfWeek, endOfWeek, subDays, format } from 'date-fns';

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

export interface SubjectStudyPlanMetrics {
  subjectId: string;
  subjectName: string;
  colour: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  dates: string[];
  plannedStudyHours: number;
  actualStudyHours: number;
  plannedVideoHours: number;
  codingHours: number;
  writtenHours: number;
  testDescription: string;
  notes: string;
  progressPercentage: number;
}

/**
 * Calculates study plan metrics for a single subject based on its tracker days.
 */
export function calculateSubjectStudyPlanMetrics(
  subject: Subject,
  dayPlans: Record<string, DayPlan>,
  topics: Topic[],
  allTrackerDates: string[],
  studyHoursWeekday = 2,
  studyHoursWeekend = 8
): SubjectStudyPlanMetrics {
  let dates = allTrackerDates.filter((d) => dayPlans[d]?.focusSubjectId === subject.id);
  if (dates.length === 0) {
    dates = allTrackerDates.filter((d) => d >= subject.startDate && d <= subject.endDate);
  }

  let plannedStudyHours = 0;
  let actualStudyHours = 0;

  for (const d of dates) {
    const dayType = getDayType(d);
    plannedStudyHours += calculatePlannedStudyHours(dayType, studyHoursWeekday, studyHoursWeekend);

    const plan = dayPlans[d];
    const study1Done = plan?.overrides['task-study-1']?.done ?? false;
    const study2Done = plan?.overrides['task-study-2']?.done ?? false;
    actualStudyHours += calculateActualStudyHours(
      dayType,
      study1Done,
      study2Done,
      studyHoursWeekday,
      studyHoursWeekend
    );
  }

  const plannedVideoHours = subject.plannedVideoHours || 0;
  const nonVideoHours = Math.max(0, plannedStudyHours - plannedVideoHours);
  const codingHours = Math.round(nonVideoHours * 0.6 * 10) / 10;
  const writtenHours = Math.round((nonVideoHours - codingHours) * 10) / 10;

  let testDescription = subject.testDescription || '';
  if (!testDescription) {
    const testTopics = topics.filter((t) => t.subjectId === subject.id && t.isTest);
    if (testTopics.length > 0) {
      testDescription = testTopics
        .map((t) => t.title.replace(/^TEST:\s*/i, ''))
        .join(', ');
    } else {
      testDescription = 'None scheduled';
    }
  }

  const progressPercentage =
    plannedStudyHours > 0
      ? Math.round((actualStudyHours / plannedStudyHours) * 100)
      : 0;

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    colour: subject.colour,
    startDate: subject.startDate,
    endDate: subject.endDate,
    dayCount: dates.length,
    dates,
    plannedStudyHours,
    actualStudyHours,
    plannedVideoHours,
    codingHours,
    writtenHours,
    testDescription,
    notes: subject.notes || '',
    progressPercentage,
  };
}

/**
 * Calculates aggregate totals across all subjects in the study plan,
 * verifying alignment with tracker's total planned study hours.
 */
export function calculateStudyPlanTotals(
  subjectMetrics: SubjectStudyPlanMetrics[],
  allTrackerDates: string[],
  studyHoursWeekday = 2,
  studyHoursWeekend = 8
): {
  totalPlannedStudyHours: number;
  totalActualStudyHours: number;
  totalVideoHours: number;
  totalCodingHours: number;
  totalWrittenHours: number;
  totalDays: number;
  overallProgressPercentage: number;
  trackerTotalPlannedStudyHours: number;
} {
  let totalPlannedStudyHours = 0;
  let totalActualStudyHours = 0;
  let totalVideoHours = 0;
  let totalCodingHours = 0;
  let totalWrittenHours = 0;
  let totalDays = 0;

  for (const m of subjectMetrics) {
    totalPlannedStudyHours += m.plannedStudyHours;
    totalActualStudyHours += m.actualStudyHours;
    totalVideoHours += m.plannedVideoHours;
    totalCodingHours += m.codingHours;
    totalWrittenHours += m.writtenHours;
    totalDays += m.dayCount;
  }

  let trackerTotalPlannedStudyHours = 0;
  for (const d of allTrackerDates) {
    const dayType = getDayType(d);
    trackerTotalPlannedStudyHours += calculatePlannedStudyHours(
      dayType,
      studyHoursWeekday,
      studyHoursWeekend
    );
  }

  const overallProgressPercentage =
    totalPlannedStudyHours > 0
      ? Math.round((totalActualStudyHours / totalPlannedStudyHours) * 100)
      : 0;

  return {
    totalPlannedStudyHours,
    totalActualStudyHours,
    totalVideoHours,
    totalCodingHours,
    totalWrittenHours,
    totalDays,
    overallProgressPercentage,
    trackerTotalPlannedStudyHours,
  };
}

/**
 * Checks if an assignment is strictly overdue (past deadline and not done).
 */
export function isAssignmentOverdue(
  assignment: Assignment,
  todayStr: string = getTodayDateString()
): boolean {
  return assignment.status !== 'done' && assignment.deadline < todayStr;
}

/**
 * Calculates milestone completion progress % (0 - 100).
 * If status is completed -> 100%.
 * If status is not-started -> 0%.
 * If in-progress -> evaluates linked assignments or elapsed timeline.
 */
export function calculateMilestoneProgress(
  milestone: Milestone,
  assignments: Assignment[] = [],
  todayStr: string = getTodayDateString()
): number {
  if (milestone.status === 'completed') return 100;
  if (milestone.status === 'not-started') return 0;

  // In-progress: check linked assignments in milestone date window
  const linkedAssignments = assignments.filter(
    (a) => a.deadline >= milestone.startDate && a.deadline <= milestone.endDate
  );

  if (linkedAssignments.length > 0) {
    const doneCount = linkedAssignments.filter((a) => a.status === 'done').length;
    return Math.round((doneCount / linkedAssignments.length) * 100);
  }

  // Fallback to elapsed timeline
  try {
    const start = parseISO(milestone.startDate);
    const end = parseISO(milestone.endDate);
    const today = parseISO(todayStr);

    const totalDays = Math.max(1, differenceInCalendarDays(end, start));
    const elapsedDays = differenceInCalendarDays(today, start);

    if (elapsedDays <= 0) return 10;
    if (elapsedDays >= totalDays) return 90;
    return Math.min(95, Math.max(10, Math.round((elapsedDays / totalDays) * 100)));
  } catch {
    return 50;
  }
}

/**
 * Calculates aggregate total research hours logged across all entries.
 */
export function calculateTotalResearchHours(entries: ResearchEntry[]): number {
  const sum = entries.reduce((acc, curr) => acc + (curr.hours || 0), 0);
  return Math.round(sum * 10) / 10;
}

/**
 * Calculates current week research hours and weekly breakdown.
 */
export function calculateWeeklyResearchHours(
  entries: ResearchEntry[],
  referenceDateStr: string = getTodayDateString(),
  weekStartsOn: 0 | 1 = 1
): {
  currentWeekHours: number;
  weeklyBreakdown: Array<{ weekLabel: string; startDate: string; endDate: string; hours: number }>;
} {
  const refDate = parseISO(referenceDateStr);
  const weekStart = format(startOfWeek(refDate, { weekStartsOn }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(refDate, { weekStartsOn }), 'yyyy-MM-dd');

  let currentWeekHours = 0;
  const weekMap: Record<string, { weekLabel: string; startDate: string; endDate: string; hours: number }> = {};

  for (const entry of entries) {
    if (entry.hours <= 0) continue;

    if (entry.date >= weekStart && entry.date <= weekEnd) {
      currentWeekHours += entry.hours;
    }

    try {
      const eDate = parseISO(entry.date);
      const s = format(startOfWeek(eDate, { weekStartsOn }), 'yyyy-MM-dd');
      const e = format(endOfWeek(eDate, { weekStartsOn }), 'yyyy-MM-dd');
      const key = `${s}_${e}`;

      if (!weekMap[key]) {
        weekMap[key] = {
          weekLabel: `${format(parseISO(s), 'MMM dd')} - ${format(parseISO(e), 'MMM dd')}`,
          startDate: s,
          endDate: e,
          hours: 0,
        };
      }
      weekMap[key].hours += entry.hours;
    } catch {
      // Ignore unparseable dates
    }
  }

  const weeklyBreakdown = Object.values(weekMap).sort((a, b) => b.startDate.localeCompare(a.startDate));

  return {
    currentWeekHours: Math.round(currentWeekHours * 10) / 10,
    weeklyBreakdown,
  };
}

/**
 * Calculates current and longest consecutive day research streaks.
 */
export function calculateResearchStreak(
  entries: ResearchEntry[],
  todayStr: string = getTodayDateString()
): { currentStreak: number; longestStreak: number } {
  const activeDates = Array.from(
    new Set(
      entries
        .filter((e) => (e.hours || 0) > 0)
        .map((e) => e.date)
    )
  ).sort();

  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Longest streak calculation
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < activeDates.length; i++) {
    const prev = parseISO(activeDates[i - 1]);
    const curr = parseISO(activeDates[i]);
    const diff = differenceInCalendarDays(curr, prev);

    if (diff === 1) {
      currentRun++;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    } else if (diff > 1) {
      currentRun = 1;
    }
  }

  // 2. Current streak ending today (or yesterday if today is not logged yet)
  let currentStreak = 0;
  const dateSet = new Set(activeDates);

  let checkDate = parseISO(todayStr);
  const todayIncluded = dateSet.has(todayStr);

  if (todayIncluded) {
    currentStreak = 1;
    let prevDate = subDays(checkDate, 1);
    while (dateSet.has(format(prevDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      prevDate = subDays(prevDate, 1);
    }
  } else {
    // If today is not yet logged, check if yesterday was logged to preserve ongoing streak
    const yesterday = subDays(checkDate, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    if (dateSet.has(yesterdayStr)) {
      currentStreak = 1;
      let prevDate = subDays(yesterday, 1);
      while (dateSet.has(format(prevDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        prevDate = subDays(prevDate, 1);
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
}

export interface DashboardKPIs {
  daysElapsed: number;
  totalDays: number;
  totalDone: number;
  totalMissed: number;
  totalPending: number;
  completionSoFar: number;
  studyHoursDone: number;
  studyHoursPlanned: number;
  researchHours: number;
  topicsProgress: { ticked: number; applicable: number; percentage: number };
  strongDaysCount: number;
}

/**
 * Calculates all high-level dashboard KPIs matching the tracker's totals.
 */
export function calculateDashboardKPIs(
  dates: string[],
  activeTasks: TaskTemplate[],
  dayPlans: Record<string, DayPlan>,
  researchEntries: ResearchEntry[],
  topics: Topic[],
  todayStr: string = getTodayDateString(),
  startDate: string,
  studyHoursWeekday = 2,
  studyHoursWeekend = 8
): DashboardKPIs {
  let totalDone = 0;
  let totalMissed = 0;
  let totalPending = 0;
  let studyHoursDone = 0;
  let studyHoursPlanned = 0;
  let strongDaysCount = 0;

  for (const d of dates) {
    const metrics = calculateDayMetrics(
      d,
      activeTasks,
      dayPlans[d],
      todayStr,
      studyHoursWeekday,
      studyHoursWeekend
    );
    totalDone += metrics.doneCount;
    totalMissed += metrics.missedCount;
    totalPending += metrics.pendingCount;
    studyHoursDone += metrics.studyHoursDone;
    studyHoursPlanned += metrics.studyHoursPlanned;
    if (metrics.isStrong) {
      strongDaysCount++;
    }
  }

  const totalPossible = totalDone + totalMissed + totalPending;
  const completionSoFar = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 1000) / 10 : 0;

  const totalDays = dates.length;
  let daysElapsed = 0;
  if (todayStr >= startDate) {
    daysElapsed = Math.min(totalDays, differenceInCalendarDays(parseISO(todayStr), parseISO(startDate)) + 1);
  }

  const researchHours = calculateTotalResearchHours(researchEntries);
  const topicsProgress = calculateTopicProgress(topics);

  return {
    daysElapsed,
    totalDays,
    totalDone,
    totalMissed,
    totalPending,
    completionSoFar,
    studyHoursDone,
    studyHoursPlanned,
    researchHours,
    topicsProgress,
    strongDaysCount,
  };
}

export interface DayComparisonSummary {
  todayStr: string;
  yesterdayStr: string;
  todayMetrics: { done: number; total: number; percentage: number; studyHoursDone: number; isStrong: boolean };
  yesterdayMetrics: { done: number; total: number; percentage: number; studyHoursDone: number; isStrong: boolean };
  percentageDelta: number;
  studyDelta: number;
}

/**
 * Calculates a summary comparison between today and yesterday.
 */
export function calculateTodayVsYesterday(
  activeTasks: TaskTemplate[],
  dayPlans: Record<string, DayPlan>,
  todayStr: string = getTodayDateString(),
  studyHoursWeekday = 2,
  studyHoursWeekend = 8
): DayComparisonSummary {
  const yesterdayStr = format(subDays(parseISO(todayStr), 1), 'yyyy-MM-dd');

  const todayMetrics = calculateDayMetrics(
    todayStr,
    activeTasks,
    dayPlans[todayStr],
    todayStr,
    studyHoursWeekday,
    studyHoursWeekend
  );

  const yesterdayMetrics = calculateDayMetrics(
    yesterdayStr,
    activeTasks,
    dayPlans[yesterdayStr],
    todayStr,
    studyHoursWeekday,
    studyHoursWeekend
  );

  const percentageDelta = Math.round((todayMetrics.completionPercentage - yesterdayMetrics.completionPercentage) * 10) / 10;
  const studyDelta = Math.round((todayMetrics.studyHoursDone - yesterdayMetrics.studyHoursDone) * 10) / 10;

  return {
    todayStr,
    yesterdayStr,
    todayMetrics: {
      done: todayMetrics.doneCount,
      total: todayMetrics.totalTasks,
      percentage: todayMetrics.completionPercentage,
      studyHoursDone: todayMetrics.studyHoursDone,
      isStrong: todayMetrics.isStrong,
    },
    yesterdayMetrics: {
      done: yesterdayMetrics.doneCount,
      total: yesterdayMetrics.totalTasks,
      percentage: yesterdayMetrics.completionPercentage,
      studyHoursDone: yesterdayMetrics.studyHoursDone,
      isStrong: yesterdayMetrics.isStrong,
    },
    percentageDelta,
    studyDelta,
  };
}




