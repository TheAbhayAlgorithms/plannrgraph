import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import {
  calculateSubjectStudyPlanMetrics,
  calculateStudyPlanTotals,
} from '../utils/calculations';
import { generateDateRange } from '../utils/dateUtils';

describe('Module 6: Study Plan & Re-Plan Engine', () => {
  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('calculates planned study hours per subject and verifies totals match tracker planned hours', () => {
    const store = usePlannerStore.getState();
    const allTrackerDates = generateDateRange(store.settings.startDate, store.settings.endDate);

    const subjectMetrics = store.subjects.map((s) =>
      calculateSubjectStudyPlanMetrics(
        s,
        store.dayPlans,
        store.topics,
        allTrackerDates,
        store.settings.studyHoursWeekday,
        store.settings.studyHoursWeekend
      )
    );

    const totals = calculateStudyPlanTotals(
      subjectMetrics,
      allTrackerDates,
      store.settings.studyHoursWeekday,
      store.settings.studyHoursWeekend
    );

    // CRITICAL ACCEPTANCE CHECK: totals match tracker's planned hours!
    expect(totals.totalPlannedStudyHours).toBe(totals.trackerTotalPlannedStudyHours);
    expect(totals.totalPlannedStudyHours).toBeGreaterThan(0);
    expect(totals.totalDays).toBe(allTrackerDates.length);
  });

  it('calculates video, coding, and written hours breakdown accurately', () => {
    const store = usePlannerStore.getState();
    const oopsSubject = store.subjects.find((s) => s.id === 'sub-oops')!;
    const allTrackerDates = generateDateRange(store.settings.startDate, store.settings.endDate);

    const metrics = calculateSubjectStudyPlanMetrics(
      oopsSubject,
      store.dayPlans,
      store.topics,
      allTrackerDates,
      store.settings.studyHoursWeekday,
      store.settings.studyHoursWeekend
    );

    expect(metrics.plannedVideoHours).toBe(oopsSubject.plannedVideoHours);
    expect(metrics.plannedStudyHours).toBeGreaterThan(metrics.plannedVideoHours);

    const nonVideoHours = metrics.plannedStudyHours - metrics.plannedVideoHours;
    expect(metrics.codingHours + metrics.writtenHours).toBeCloseTo(nonVideoHours, 1);
    expect(metrics.codingHours).toBeGreaterThanOrEqual(metrics.writtenHours);
  });

  it('resolves test description from test topics or custom subject field', () => {
    const store = usePlannerStore.getState();
    const oopsSubject = store.subjects.find((s) => s.id === 'sub-oops')!;
    const allTrackerDates = generateDateRange(store.settings.startDate, store.settings.endDate);

    const metrics = calculateSubjectStudyPlanMetrics(
      oopsSubject,
      store.dayPlans,
      store.topics,
      allTrackerDates
    );

    expect(metrics.testDescription).toBe('10 programs by hand');

    // Update with custom test description
    store.updateSubject({
      ...oopsSubject,
      testDescription: 'Comprehensive Midterm Assessment',
    });

    const updatedMetrics = calculateSubjectStudyPlanMetrics(
      usePlannerStore.getState().subjects.find((s) => s.id === 'sub-oops')!,
      store.dayPlans,
      store.topics,
      allTrackerDates
    );
    expect(updatedMetrics.testDescription).toBe('Comprehensive Midterm Assessment');
  });

  it('re-plans subject date range, redistributes topics, and synchronizes tracker focus days', () => {
    const store = usePlannerStore.getState();
    const targetSubject = store.subjects[0]; // sub-oops
    const initialTopics = store.topics.filter((t) => t.subjectId === targetSubject.id);

    // Re-plan sub-oops to 2026-10-04 to 2026-10-12 (extended by 2 days)
    store.replanSubject(
      targetSubject.id,
      '2026-10-04',
      '2026-10-12',
      18, // new video hours
      true, // redistribute topics
      true // cascade subsequent
    );

    const updatedState = usePlannerStore.getState();
    const updatedSubject = updatedState.subjects.find((s) => s.id === targetSubject.id)!;

    expect(updatedSubject.startDate).toBe('2026-10-04');
    expect(updatedSubject.endDate).toBe('2026-10-12');
    expect(updatedSubject.plannedVideoHours).toBe(18);

    // Verify DayPlans focusSubjectId synced for the extended date 2026-10-12
    expect(updatedState.dayPlans['2026-10-12']?.focusSubjectId).toBe(targetSubject.id);
    expect(updatedState.dayPlans['2026-10-12']?.overrides['task-study-1']?.hintLabel).toContain(targetSubject.name);

    // Verify topics redistributed across the new range
    const updatedTopics = updatedState.topics.filter((t) => t.subjectId === targetSubject.id);
    expect(updatedTopics.length).toBe(initialTopics.length);
    const hasTopicOnEndDate = updatedTopics.some((t) => t.targetDate === '2026-10-12');
    expect(hasTopicOnEndDate).toBe(true);

    // Verify subsequent subject (sub-dbms) was cascaded forward
    const nextSubject = updatedState.subjects[1];
    expect(nextSubject.startDate).toBe('2026-10-13');
  });

  it('updates actual study hours when study tasks are ticked in dayPlans', () => {
    const store = usePlannerStore.getState();
    const targetDate = '2026-10-04';
    const oopsSubject = store.subjects.find((s) => s.id === 'sub-oops')!;
    const allTrackerDates = generateDateRange(store.settings.startDate, store.settings.endDate);

    const initialMetrics = calculateSubjectStudyPlanMetrics(
      oopsSubject,
      store.dayPlans,
      store.topics,
      allTrackerDates
    );
    expect(initialMetrics.actualStudyHours).toBe(0);

    // Tick both study tasks for 2026-10-04
    store.toggleTaskDone(targetDate, 'task-study-1');
    store.toggleTaskDone(targetDate, 'task-study-2');

    const updatedMetrics = calculateSubjectStudyPlanMetrics(
      oopsSubject,
      usePlannerStore.getState().dayPlans,
      store.topics,
      allTrackerDates
    );

    // On 2026-10-04 (Sunday/weekend), planned study hours is 8h, so both blocks = 8h actual
    expect(updatedMetrics.actualStudyHours).toBe(8);
    expect(updatedMetrics.progressPercentage).toBeGreaterThan(0);
  });
});
