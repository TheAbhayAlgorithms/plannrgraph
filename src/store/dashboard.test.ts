import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { generateDateRange } from '../utils/dateUtils';
import {
  calculateDashboardKPIs,
  calculateTodayVsYesterday,
  calculateDayMetrics,
} from '../utils/calculations';

describe('Module 9: Dashboard KPIs and Analytics', () => {
  const TODAY = '2026-10-04';

  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('CRITICAL ACCEPTANCE: dashboard KPI numbers strictly match the Daily Tracker totals', () => {
    const store = usePlannerStore.getState();
    const activeTasks = store.taskTemplates.filter((t) => t.active);
    const dates = generateDateRange(store.settings.startDate, store.settings.endDate);

    // Compute tracker totals manually as done in TrackerGrid
    let trackerTotalDone = 0;
    let trackerTotalMissed = 0;
    let trackerTotalStudyPlanned = 0;
    let trackerTotalStudyDone = 0;

    for (const d of dates) {
      const metrics = calculateDayMetrics(
        d,
        activeTasks,
        store.dayPlans[d],
        TODAY,
        store.settings.studyHoursWeekday,
        store.settings.studyHoursWeekend
      );
      trackerTotalDone += metrics.doneCount;
      trackerTotalMissed += metrics.missedCount;
      trackerTotalStudyPlanned += metrics.studyHoursPlanned;
      trackerTotalStudyDone += metrics.studyHoursDone;
    }

    // Compute dashboard KPIs
    const kpis = calculateDashboardKPIs(
      dates,
      activeTasks,
      store.dayPlans,
      store.researchEntries,
      store.topics,
      TODAY,
      store.settings.startDate,
      store.settings.studyHoursWeekday,
      store.settings.studyHoursWeekend
    );

    // Strict acceptance checks:
    expect(kpis.totalDone).toBe(trackerTotalDone);
    expect(kpis.totalMissed).toBe(trackerTotalMissed);
    expect(kpis.studyHoursPlanned).toBe(trackerTotalStudyPlanned);
    expect(kpis.studyHoursDone).toBe(trackerTotalStudyDone);
    expect(kpis.totalDays).toBe(dates.length);
  });

  it('hand-checked test case: ticking habits and study blocks reflects synchronously in KPIs', () => {
    const store = usePlannerStore.getState();
    const activeTasks = store.taskTemplates.filter((t) => t.active);
    const dates = generateDateRange(store.settings.startDate, store.settings.endDate);

    // Initial state: 0 tasks done, 0 study hours done
    let kpis = calculateDashboardKPIs(
      dates,
      activeTasks,
      store.dayPlans,
      store.researchEntries,
      store.topics,
      TODAY,
      store.settings.startDate,
      store.settings.studyHoursWeekday,
      store.settings.studyHoursWeekend
    );
    expect(kpis.totalDone).toBe(0);
    expect(kpis.studyHoursDone).toBe(0);
    expect(kpis.strongDaysCount).toBe(0);

    // Tick all 9 tasks on TODAY (2026-10-04, weekend with 8h study)
    // 9 / 9 = 100% which exceeds strong day threshold of 80%
    for (const task of activeTasks) {
      store.toggleTaskDone(TODAY, task.id);
    }

    const updatedState = usePlannerStore.getState();
    kpis = calculateDashboardKPIs(
      dates,
      activeTasks,
      updatedState.dayPlans,
      updatedState.researchEntries,
      updatedState.topics,
      TODAY,
      updatedState.settings.startDate,
      updatedState.settings.studyHoursWeekday,
      updatedState.settings.studyHoursWeekend
    );

    expect(kpis.totalDone).toBe(9);
    expect(kpis.strongDaysCount).toBe(1);

    // Since both task-study-1 and task-study-2 are done, full weekend 8h is achieved!
    expect(kpis.studyHoursDone).toBe(8);

    // Since task-research was in the first 8 tasks, research session auto-logged!
    expect(kpis.researchHours).toBe(updatedState.settings.researchHoursPerSession);
  });

  it('calculates Today vs Yesterday summary accurately', () => {
    const store = usePlannerStore.getState();
    const activeTasks = store.taskTemplates.filter((t) => t.active);

    // Tick 4 tasks today
    activeTasks.slice(0, 4).forEach((t) => store.toggleTaskDone(TODAY, t.id));

    const summary = calculateTodayVsYesterday(
      activeTasks,
      usePlannerStore.getState().dayPlans,
      TODAY,
      store.settings.studyHoursWeekday,
      store.settings.studyHoursWeekend
    );

    expect(summary.todayStr).toBe(TODAY);
    expect(summary.todayMetrics.done).toBe(4);
    expect(summary.todayMetrics.percentage).toBeGreaterThan(0);
    expect(summary.percentageDelta).toBe(summary.todayMetrics.percentage);
  });
});
