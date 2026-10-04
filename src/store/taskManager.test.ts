import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { TaskTemplate } from '../types';

describe('Task Manager Module (CRUD, Propagation & History)', () => {
  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('adds a new task template and propagates to ALL days in dayPlans', () => {
    const store = usePlannerStore.getState();
    const initialTaskCount = store.taskTemplates.length;
    const allDates = Object.keys(store.dayPlans);
    expect(allDates.length).toBeGreaterThan(0);

    const newTask: TaskTemplate = {
      id: 'task-meditation',
      name: 'Meditation & Breathwork',
      categoryId: 'cat-morning',
      colour: '#14b8a6',
      order: initialTaskCount,
      active: true,
      isStudy: false,
      isResearch: false,
    };

    // Add new task with custom hint
    store.addTaskTemplate(newTask, '15 min mindfulness');

    const updatedState = usePlannerStore.getState();
    expect(updatedState.taskTemplates.length).toBe(initialTaskCount + 1);

    // Verify it propagated to all days in dayPlans
    for (const date of allDates) {
      const dayPlan = updatedState.dayPlans[date];
      expect(dayPlan.overrides['task-meditation']).toBeDefined();
      expect(dayPlan.overrides['task-meditation'].done).toBe(false);
      expect(dayPlan.overrides['task-meditation'].hintLabel).toBe('15 min mindfulness');
    }
  });

  it('updates task template properties (rename, recolour, study/research flags)', () => {
    const store = usePlannerStore.getState();
    const targetTask = store.taskTemplates[0];

    const updated: TaskTemplate = {
      ...targetTask,
      name: 'Morning Hydration Plus',
      colour: '#06b6d4',
      isStudy: true,
    };

    store.updateTaskTemplate(updated);

    const result = usePlannerStore.getState().taskTemplates.find((t) => t.id === targetTask.id);
    expect(result?.name).toBe('Morning Hydration Plus');
    expect(result?.colour).toBe('#06b6d4');
    expect(result?.isStudy).toBe(true);
  });

  it('toggles task between active and archived/hidden', () => {
    const store = usePlannerStore.getState();
    const taskId = 'task-brush';

    expect(store.taskTemplates.find((t) => t.id === taskId)?.active).toBe(true);

    store.toggleTaskActive(taskId);
    expect(usePlannerStore.getState().taskTemplates.find((t) => t.id === taskId)?.active).toBe(
      false
    );

    store.toggleTaskActive(taskId);
    expect(usePlannerStore.getState().taskTemplates.find((t) => t.id === taskId)?.active).toBe(
      true
    );
  });

  it('reorders task templates and updates sequence', () => {
    const store = usePlannerStore.getState();
    const reversed = [...store.taskTemplates].reverse();

    store.reorderTaskTemplates(reversed);

    const reordered = usePlannerStore.getState().taskTemplates;
    expect(reordered[0].id).toBe(reversed[0].id);
    expect(reordered[0].order).toBe(0);
    expect(reordered[reordered.length - 1].order).toBe(reordered.length - 1);
  });

  it('deletes task template with keepHistory=true (preserves past history)', () => {
    const store = usePlannerStore.getState();
    const taskId = 'task-workout';
    const testDate = '2026-10-04';

    // Mark task done on testDate
    store.toggleTaskDone(testDate, taskId);
    expect(usePlannerStore.getState().dayPlans[testDate]?.overrides[taskId]?.done).toBe(true);

    // Delete keeping history
    store.deleteTaskTemplate(taskId, true);

    const updated = usePlannerStore.getState();
    expect(updated.taskTemplates.find((t) => t.id === taskId)).toBeUndefined();
    // History should still exist in dayPlans
    expect(updated.dayPlans[testDate]?.overrides[taskId]?.done).toBe(true);
  });

  it('deletes task template with keepHistory=false (purges all historical entries)', () => {
    const store = usePlannerStore.getState();
    const taskId = 'task-cook';
    const testDate = '2026-10-04';

    store.toggleTaskDone(testDate, taskId);
    expect(usePlannerStore.getState().dayPlans[testDate]?.overrides[taskId]?.done).toBe(true);

    // Delete purging history
    store.deleteTaskTemplate(taskId, false);

    const updated = usePlannerStore.getState();
    expect(updated.taskTemplates.find((t) => t.id === taskId)).toBeUndefined();
    // History must be completely purged from all dayPlans
    expect(updated.dayPlans[testDate]?.overrides[taskId]).toBeUndefined();
  });
});
