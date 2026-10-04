import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { calculateDayMetrics, calculatePerTaskTotals, getTaskCellStatus } from '../utils/calculations';

describe('Daily Tracker Module (Bulk Actions, Carried Tasks & Range Labels)', () => {
  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('bulk ticks and unticks all tasks for a specific day', () => {
    const store = usePlannerStore.getState();
    const testDate = '2026-10-04';
    const activeTasks = store.taskTemplates.filter((t) => t.active);

    // Bulk tick all
    store.bulkTickDay(testDate, true);
    const dayPlanDone = usePlannerStore.getState().dayPlans[testDate];
    for (const task of activeTasks) {
      expect(dayPlanDone.overrides[task.id]?.done).toBe(true);
    }

    // Verify 100% completion in metrics
    const metrics = calculateDayMetrics(testDate, activeTasks, dayPlanDone, testDate);
    expect(metrics.completionPercentage).toBe(100);
    expect(metrics.isStrong).toBe(true);

    // Bulk untick all
    store.bulkTickDay(testDate, false);
    const dayPlanUnticked = usePlannerStore.getState().dayPlans[testDate];
    for (const task of activeTasks) {
      expect(dayPlanUnticked.overrides[task.id]?.done).toBe(false);
    }
  });

  it('carries incomplete tasks forward to tomorrow with prefix label', () => {
    const store = usePlannerStore.getState();
    const currentDate = '2026-10-04';
    const tomorrowDate = '2026-10-05';
    const activeTasks = store.taskTemplates.filter((t) => t.active);

    // Tick only the first task on currentDate
    store.toggleTaskDone(currentDate, activeTasks[0].id);

    // Move remaining incomplete tasks to tomorrow
    const result = store.moveIncompleteToTomorrow(currentDate);
    expect(result.movedCount).toBe(activeTasks.length - 1);
    expect(result.tomorrowDate).toBe(tomorrowDate);

    // Verify tomorrow's dayPlan received the carried prefix on the unticked tasks
    const tomorrowPlan = usePlannerStore.getState().dayPlans[tomorrowDate];
    expect(tomorrowPlan).toBeDefined();

    for (let i = 1; i < activeTasks.length; i++) {
      const task = activeTasks[i];
      const hint = tomorrowPlan.overrides[task.id]?.hintLabel;
      expect(hint).toContain('[Carried]');
    }
  });

  it('applies custom hint label across a date range', () => {
    const store = usePlannerStore.getState();
    const taskId = 'task-extra-work';
    const startDate = '2026-10-18';
    const endDate = '2026-10-22';
    const customLabel = 'Frontend Architecture Sprint';

    store.applyLabelToDateRange(taskId, customLabel, startDate, endDate);

    const updatedState = usePlannerStore.getState();
    const range = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'];

    for (const date of range) {
      expect(updatedState.dayPlans[date]?.overrides[taskId]?.hintLabel).toBe(customLabel);
    }
  });

  it('footer per-task totals accurately count done and missed past days', () => {
    const store = usePlannerStore.getState();
    const today = '2026-10-06';
    const dates = ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'];
    const taskId = 'task-study-1';

    // 2026-10-04: mark done (past date -> done)
    store.toggleTaskDone('2026-10-04', taskId);
    // 2026-10-05: leave unticked (past date -> missed)
    // 2026-10-06: leave unticked (today -> pending, NOT missed)
    // 2026-10-07: leave unticked (future -> pending, NOT missed)

    const totals = calculatePerTaskTotals(
      taskId,
      dates,
      usePlannerStore.getState().dayPlans,
      today
    );

    expect(totals.done).toBe(1);
    expect(totals.missed).toBe(1); // Only 2026-10-05 counts as missed
  });

  it('task cell states follow strict rules: today stays pending, past is missed', () => {
    const today = '2026-10-05';
    // Unticked past date -> missed
    expect(getTaskCellStatus(false, '2026-10-04', today)).toBe('missed');
    // Unticked today -> pending
    expect(getTaskCellStatus(false, '2026-10-05', today)).toBe('pending');
    // Unticked future date -> pending
    expect(getTaskCellStatus(false, '2026-10-06', today)).toBe('pending');
    // Ticked on any date -> done
    expect(getTaskCellStatus(true, '2026-10-04', today)).toBe('done');
    expect(getTaskCellStatus(true, '2026-10-05', today)).toBe('done');
    expect(getTaskCellStatus(true, '2026-10-06', today)).toBe('done');
  });
});
