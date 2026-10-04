import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { validatePlannerBackup } from '../utils/backupUtils';
import { PlannerData } from '../types';

describe('Module 11: Settings, Plan Setup, and Import/Export', () => {
  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  describe('Backup Validation (validatePlannerBackup)', () => {
    it('validates a complete, correctly structured backup object', () => {
      const store = usePlannerStore.getState();
      const backupObj: PlannerData = {
        schemaVersion: 1,
        settings: store.settings,
        categories: store.categories,
        taskTemplates: store.taskTemplates,
        routineSlots: store.routineSlots,
        subjects: store.subjects,
        topics: store.topics,
        dayPlans: store.dayPlans,
        milestones: store.milestones,
        assignments: store.assignments,
        researchEntries: store.researchEntries,
        savedViews: store.savedViews,
      };

      const rawJson = JSON.stringify(backupObj);
      const result = validatePlannerBackup(rawJson);

      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.settings.startDate).toBe(store.settings.startDate);
      expect(result.data?.taskTemplates.length).toBe(store.taskTemplates.length);
    });

    it('rejects corrupt JSON string with a readable syntax error message', () => {
      const corruptJson = '{ "settings": { "startDate": "2026-10-04" '; // unterminated
      const result = validatePlannerBackup(corruptJson);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Corrupt JSON syntax');
    });

    it('rejects backup missing essential settings properties', () => {
      const missingDatesJson = JSON.stringify({
        schemaVersion: 1,
        settings: {
          theme: 'dark',
        },
        categories: [],
        taskTemplates: [],
        routineSlots: [],
        subjects: [],
        topics: [],
        dayPlans: {},
        milestones: [],
        assignments: [],
      });

      const result = validatePlannerBackup(missingDatesJson);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Settings must contain both "startDate" and "endDate"');
    });

    it('rejects backup where a required collection is not an array', () => {
      const invalidCollectionJson = JSON.stringify({
        schemaVersion: 1,
        settings: {
          startDate: '2026-10-04',
          endDate: '2026-10-30',
        },
        categories: 'not-an-array',
        taskTemplates: [],
        routineSlots: [],
        subjects: [],
        topics: [],
        dayPlans: {},
        milestones: [],
        assignments: [],
      });

      const result = validatePlannerBackup(invalidCollectionJson);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing or invalid "categories" collection');
    });
  });

  describe('Plan Setup and Date Range Extension', () => {
    it('updates study targets and preferences correctly', () => {
      const store = usePlannerStore.getState();

      store.setSettings({
        studyHoursWeekday: 3.5,
        studyHoursWeekend: 10,
        researchHoursPerSession: 3,
        strongDayThreshold: 90,
        weekStartsOn: 0,
      });

      const updated = usePlannerStore.getState().settings;
      expect(updated.studyHoursWeekday).toBe(3.5);
      expect(updated.studyHoursWeekend).toBe(10);
      expect(updated.researchHoursPerSession).toBe(3);
      expect(updated.strongDayThreshold).toBe(90);
      expect(updated.weekStartsOn).toBe(0);
    });

    it('preserves existing dayPlans and initializes new dates when extending the date range', () => {
      const store = usePlannerStore.getState();
      const existingDate = '2026-10-04';

      // Mark a task done on 2026-10-04
      store.toggleTaskDone(existingDate, 'task-warm-water');
      expect(usePlannerStore.getState().dayPlans[existingDate]?.overrides['task-warm-water']?.done).toBe(true);

      // Extend plan to 2026-11-05
      store.setSettings({
        endDate: '2026-11-05',
      });

      const updatedStore = usePlannerStore.getState();
      expect(updatedStore.settings.endDate).toBe('2026-11-05');

      // Check existing day plan was preserved
      expect(updatedStore.dayPlans[existingDate]?.overrides['task-warm-water']?.done).toBe(true);

      // Check new extended date (e.g. 2026-11-02) was populated
      const extendedDatePlan = updatedStore.dayPlans['2026-11-02'];
      expect(extendedDatePlan).toBeDefined();
      expect(extendedDatePlan.date).toBe('2026-11-02');
      expect(extendedDatePlan.overrides['task-warm-water']).toBeDefined();
      expect(extendedDatePlan.overrides['task-warm-water'].done).toBe(false);
    });
  });

  describe('Theme Mode Updates', () => {
    it('sets theme preference in settings', () => {
      const store = usePlannerStore.getState();

      store.setTheme('light');
      expect(usePlannerStore.getState().settings.theme).toBe('light');

      store.setTheme('dark');
      expect(usePlannerStore.getState().settings.theme).toBe('dark');
    });
  });

  describe('Import Data and Workspace Reset', () => {
    it('restores workspace from imported data', () => {
      const store = usePlannerStore.getState();

      const customImport: PlannerData = {
        schemaVersion: 1,
        settings: {
          startDate: '2026-11-01',
          endDate: '2026-11-20',
          theme: 'light',
          studyHoursWeekday: 4,
          studyHoursWeekend: 6,
          researchHoursPerSession: 1,
          strongDayThreshold: 85,
          weekStartsOn: 1,
        },
        categories: [{ id: 'cat-new', name: 'Custom Cat', colour: '#ff0000' }],
        taskTemplates: [{ id: 'task-custom', name: 'Custom Task', categoryId: 'cat-new', active: true, order: 0 }],
        routineSlots: [],
        subjects: [],
        topics: [],
        dayPlans: {},
        milestones: [],
        assignments: [],
        researchEntries: [],
        savedViews: [],
      };

      store.importData(customImport);
      const updated = usePlannerStore.getState();

      expect(updated.settings.startDate).toBe('2026-11-01');
      expect(updated.settings.endDate).toBe('2026-11-20');
      expect(updated.categories.length).toBe(1);
      expect(updated.categories[0].name).toBe('Custom Cat');
      expect(updated.taskTemplates[0].name).toBe('Custom Task');
    });

    it('clears all data and can restore seed data cleanly', () => {
      const store = usePlannerStore.getState();

      store.clearAllData();
      const cleared = usePlannerStore.getState();
      expect(cleared.categories.length).toBe(0);
      expect(cleared.taskTemplates.length).toBe(0);
      expect(cleared.subjects.length).toBe(0);

      // Restore seed data
      store.resetToSeedData();
      const restored = usePlannerStore.getState();
      expect(restored.categories.length).toBeGreaterThan(0);
      expect(restored.taskTemplates.length).toBeGreaterThan(0);
      expect(restored.subjects.length).toBeGreaterThan(0);
      expect(restored.routineSlots.length).toBeGreaterThan(0);
    });
  });

  describe('CSV Table Exporters', () => {
    it('generates well-formed CSV for the Daily Tracker', async () => {
      const { generateTrackerCSV } = await import('../utils/exportUtils');
      const store = usePlannerStore.getState();
      const csv = generateTrackerCSV(
        ['2026-10-04', '2026-10-05'],
        store.taskTemplates.slice(0, 3),
        store.dayPlans,
        store.subjects
      );

      expect(csv).toContain('Date,Day,Focus Subject');
      expect(csv).toContain('2026-10-04');
      expect(csv).toContain('2026-10-05');
    });

    it('generates well-formed CSV for Syllabus Topics and Assignments', async () => {
      const { generateSyllabusCSV, generateAssignmentsCSV } = await import('../utils/exportUtils');
      const store = usePlannerStore.getState();

      const syllabusCsv = generateSyllabusCSV(store.subjects, store.topics);
      expect(syllabusCsv).toContain('Subject,Topic Title,Target Date,Is Test');
      expect(syllabusCsv).toContain('Classes & objects');

      const assignmentsCsv = generateAssignmentsCSV(store.assignments, store.subjects);
      expect(assignmentsCsv).toContain('Subject,Assignment Title,Deadline,Priority,Status');
      expect(assignmentsCsv).toContain('Java OOP Inheritance Lab submission');
    });
  });

  describe('Undo/Redo Engine', () => {
    it('supports undo and redo for user actions with snapshot limit', () => {
      const store = usePlannerStore.getState();
      const testDate = '2026-10-04';
      const taskId = 'task-warm-water';

      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);

      // 1. Toggle task done
      store.toggleTaskDone(testDate, taskId);
      expect(usePlannerStore.getState().dayPlans[testDate]?.overrides[taskId]?.done).toBe(true);
      expect(usePlannerStore.getState().canUndo).toBe(true);
      expect(usePlannerStore.getState().canRedo).toBe(false);

      // 2. Undo
      usePlannerStore.getState().undo();
      expect(usePlannerStore.getState().dayPlans[testDate]?.overrides[taskId]?.done).toBe(false);
      expect(usePlannerStore.getState().canRedo).toBe(true);

      // 3. Redo
      usePlannerStore.getState().redo();
      expect(usePlannerStore.getState().dayPlans[testDate]?.overrides[taskId]?.done).toBe(true);

      // 4. Verify max history cap (20 actions)
      for (let i = 0; i < 25; i++) {
        store.toggleTaskDone(testDate, taskId);
      }
      expect(usePlannerStore.getState().undoStack.length).toBeLessThanOrEqual(20);
    });
  });
});
