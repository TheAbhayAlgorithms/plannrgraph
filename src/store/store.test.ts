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

  it('duplicates a routine slot', () => {
    const store = usePlannerStore.getState();
    const initialSlots = store.routineSlots.length;
    const targetSlot = store.routineSlots[0];

    store.duplicateRoutineSlot(targetSlot.id);
    const updatedSlots = usePlannerStore.getState().routineSlots;
    expect(updatedSlots.length).toBe(initialSlots + 1);
    expect(updatedSlots[1].title).toBe(`${targetSlot.title} (Copy)`);
    expect(updatedSlots[1].id).not.toBe(targetSlot.id);
  });

  it('copies weekday routine slots to weekend', () => {
    const store = usePlannerStore.getState();
    const weekdayCount = store.routineSlots.filter((s) => s.dayType === 'weekday').length;

    store.copyWeekdayToWeekend();
    const updatedSlots = usePlannerStore.getState().routineSlots;
    const newWeekendCount = updatedSlots.filter((s) => s.dayType === 'weekend').length;
    expect(newWeekendCount).toBe(weekdayCount);
  });

  it('reorders routine slots for a specific day type', () => {
    const store = usePlannerStore.getState();
    const weekdaySlots = store.routineSlots.filter((s) => s.dayType === 'weekday');
    const reversed = [...weekdaySlots].reverse();

    store.reorderRoutineSlots('weekday', reversed);
    const updatedWeekday = usePlannerStore
      .getState()
      .routineSlots.filter((s) => s.dayType === 'weekday');

    expect(updatedWeekday[0].id).toBe(reversed[0].id);
  });

  it('adds, updates, and deletes categories', () => {
    const store = usePlannerStore.getState();
    const initialCount = store.categories.length;

    const newCat = { id: 'cat-test', name: 'Meditation', colour: '#14b8a6' };
    store.addCategory(newCat);
    expect(usePlannerStore.getState().categories.length).toBe(initialCount + 1);

    store.updateCategory({ ...newCat, name: 'Mindfulness' });
    expect(usePlannerStore.getState().categories.find((c) => c.id === 'cat-test')?.name).toBe(
      'Mindfulness'
    );

    store.deleteCategory('cat-test');
    expect(usePlannerStore.getState().categories.length).toBe(initialCount);
  });
});
