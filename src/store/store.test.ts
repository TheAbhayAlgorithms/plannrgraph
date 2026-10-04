import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';

describe('usePlannerStore', () => {
  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('loads seed data correctly', () => {
    const state = usePlannerStore.getState();
    expect(state.taskTemplates.length).toBe(9);
    expect(state.subjects.length).toBe(6);
    expect(state.routineSlots.length).toBeGreaterThan(10);
    expect(state.settings.startDate).toBe('2026-10-04');
    expect(state.settings.endDate).toBe('2026-10-30');
  });

  it('toggles task done status in dayPlans', () => {
    const { toggleTaskDone } = usePlannerStore.getState();
    const date = '2026-10-04';
    const taskId = 'task-brush';

    // Initial state is false
    expect(usePlannerStore.getState().dayPlans[date]?.overrides[taskId]?.done).toBe(false);

    // Toggle to true
    toggleTaskDone(date, taskId);
    expect(usePlannerStore.getState().dayPlans[date]?.overrides[taskId]?.done).toBe(true);

    // Toggle back to false
    toggleTaskDone(date, taskId);
    expect(usePlannerStore.getState().dayPlans[date]?.overrides[taskId]?.done).toBe(false);
  });

  it('automatically sets research hours when research task is ticked', () => {
    const { toggleTaskDone } = usePlannerStore.getState();
    const date = '2026-10-04';
    const researchTaskId = 'task-research';

    toggleTaskDone(date, researchTaskId);
    const state = usePlannerStore.getState();
    const researchEntry = state.researchEntries.find((r) => r.date === date);
    expect(researchEntry).toBeDefined();
    expect(researchEntry?.hours).toBe(2);
  });

  it('supports updating custom task hint label', () => {
    const { setTaskHint } = usePlannerStore.getState();
    const date = '2026-10-04';
    const taskId = 'task-extra-work';

    setTaskHint(date, taskId, 'Custom Assignment Prep');
    expect(usePlannerStore.getState().dayPlans[date]?.overrides[taskId]?.hintLabel).toBe(
      'Custom Assignment Prep'
    );
  });

  it('resets to seed data and clears all data cleanly', () => {
    const store = usePlannerStore.getState();
    store.clearAllData();
    expect(usePlannerStore.getState().taskTemplates.length).toBe(0);

    store.resetToSeedData();
    expect(usePlannerStore.getState().taskTemplates.length).toBe(9);
  });
});
