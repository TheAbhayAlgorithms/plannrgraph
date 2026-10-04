import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { findDueRoutineSlots, isNotificationSupported, getNotificationPermission } from '../utils/notificationUtils';
import { validatePlannerBackup } from '../utils/backupUtils';
import { generateTrackerCSV } from '../utils/exportUtils';
import { calculateDayMetrics } from '../utils/calculations';
import { detectSlotOverlaps } from '../utils/routineCalculations';
import { RoutineSlot } from '../types';

describe('Module 12: Polish, PWA, Notifications and End-to-End Lifecycle', () => {
  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  describe('PWA & Notification Utilities', () => {
    it('handles notification support and permission gracefully in non-browser/node environments', () => {
      // In node / jsdom environment without Notification API
      const supported = isNotificationSupported();
      expect(typeof supported).toBe('boolean');

      const perm = getNotificationPermission();
      expect(['granted', 'denied', 'default', 'unsupported']).toContain(perm);
    });

    it('findDueRoutineSlots identifies slots matching dayType and within start time window', () => {
      const slots: RoutineSlot[] = [
        {
          id: 'slot-1',
          dayType: 'weekday',
          startTime: '08:00',
          endTime: '09:00',
          title: 'Study Session',
          categoryId: 'cat-study',
          notificationEnabled: true,
        },
        {
          id: 'slot-2',
          dayType: 'weekday',
          startTime: '08:01',
          endTime: '09:00',
          title: 'Morning Routine',
          categoryId: 'cat-morning',
          notificationEnabled: true,
        },
        {
          id: 'slot-3',
          dayType: 'weekday',
          startTime: '08:00',
          endTime: '09:00',
          title: 'Disabled Notification Slot',
          categoryId: 'cat-morning',
          notificationEnabled: false, // Slot notification disabled by user
        },
        {
          id: 'slot-4',
          dayType: 'weekend',
          startTime: '08:00',
          endTime: '09:00',
          title: 'Weekend Slot',
          categoryId: 'cat-morning',
          notificationEnabled: true,
        },
      ];

      const notifiedSet = new Set<string>();

      // Check at 08:00 on weekday
      const due = findDueRoutineSlots(slots, '08:00', 'weekday', notifiedSet);
      expect(due.map((s) => s.id)).toEqual(['slot-1', 'slot-2']); // slot-3 has notification false, slot-4 is weekend

      // If slot-1 was already notified:
      notifiedSet.add('slot-1');
      const dueAgain = findDueRoutineSlots(slots, '08:00', 'weekday', notifiedSet);
      expect(dueAgain.map((s) => s.id)).toEqual(['slot-2']);
    });

    it('toggleSlotNotification toggles notification preferences per slot', () => {
      const { routineSlots, toggleSlotNotification } = usePlannerStore.getState();
      const firstSlot = routineSlots[0];
      const initialSetting = firstSlot.notificationEnabled;

      toggleSlotNotification(firstSlot.id);
      const afterFirstToggle = usePlannerStore
        .getState()
        .routineSlots.find((s) => s.id === firstSlot.id);
      expect(afterFirstToggle?.notificationEnabled).toBe(
        initialSetting === false ? true : false
      );

      toggleSlotNotification(firstSlot.id);
      const afterSecondToggle = usePlannerStore
        .getState()
        .routineSlots.find((s) => s.id === firstSlot.id);
      expect(afterSecondToggle?.notificationEnabled).toBe(initialSetting === false ? false : true);
    });
  });

  describe('Full End-to-End Application Lifecycle', () => {
    it('executes a full student workflow across all modules seamlessly', () => {
      const store = usePlannerStore.getState();

      // 1. Initial State Check
      expect(store.settings.startDate).toBe('2026-10-04');
      expect(store.routineSlots.length).toBeGreaterThan(0);
      expect(store.taskTemplates.length).toBeGreaterThan(0);
      expect(store.subjects.length).toBeGreaterThan(0);

      // 2. Routine Overlap Detection
      const weekdaySlots = store.routineSlots.filter((s) => s.dayType === 'weekday');
      const conflicts = detectSlotOverlaps(weekdaySlots);
      expect(typeof conflicts).toBe('object');

      // 3. Mark Day Tasks in Tracker & Verify Metrics
      const testDate = '2026-10-04';
      const activeTasks = store.taskTemplates.filter((t) => t.active);
      const firstTask = activeTasks[0];

      store.toggleTaskDone(testDate, firstTask.id);
      const updatedPlan = usePlannerStore.getState().dayPlans[testDate];
      expect(updatedPlan.overrides[firstTask.id]?.done).toBe(true);

      const metrics = calculateDayMetrics(
        testDate,
        activeTasks,
        updatedPlan,
        testDate,
        store.settings.studyHoursWeekday,
        store.settings.studyHoursWeekend
      );
      expect(metrics.totalTasks).toBe(activeTasks.length);
      expect(metrics.doneCount).toBeGreaterThanOrEqual(1);

      // 4. Update Topic Checklist
      const firstTopic = store.topics[0];
      store.toggleTopicField(firstTopic.id, 'video');
      store.toggleTopicField(firstTopic.id, 'code');
      const updatedTopic = usePlannerStore
        .getState()
        .topics.find((t) => t.id === firstTopic.id);
      expect(updatedTopic?.video).toBe(true);
      expect(updatedTopic?.code).toBe(true);

      // 5. Add and Complete an Assignment
      const newAssignment = {
        id: 'test-assign-delivery',
        subjectId: store.subjects[0].id,
        title: 'Final Module 12 Verification',
        deadline: '2026-10-25',
        priority: 'High' as const,
        status: 'todo' as const,
      };
      store.addAssignment(newAssignment);
      expect(usePlannerStore.getState().assignments.some((a) => a.id === newAssignment.id)).toBe(
        true
      );

      store.updateAssignment({ ...newAssignment, status: 'done' });
      expect(
        usePlannerStore.getState().assignments.find((a) => a.id === newAssignment.id)?.status
      ).toBe('done');

      // 6. Log Research Session
      const newResearch = {
        id: 'research-final-test',
        date: testDate,
        topic: 'Offline Service Worker Cache Strategy',
        notes: 'Pre-cache shell and offline fallback verified',
        hours: 2.5,
      };
      store.addOrUpdateResearchEntry(newResearch);
      expect(
        usePlannerStore.getState().researchEntries.some((r) => r.id === newResearch.id)
      ).toBe(true);

      // 7. Save a Named Filter View
      store.addSavedView({
        id: 'view-m12',
        name: 'Module 12 Final View',
        filters: {
          searchQuery: 'Study',
          status: 'done',
        },
      });
      expect(
        usePlannerStore.getState().savedViews.some((v) => v.name === 'Module 12 Final View')
      ).toBe(true);

      // 8. Generate CSV Export
      const freshStore = usePlannerStore.getState();
      const csv = generateTrackerCSV(
        [testDate],
        freshStore.taskTemplates,
        freshStore.dayPlans,
        freshStore.subjects
      );
      expect(csv).toContain('Date');
      expect(csv).toContain(testDate);

      // 9. Full Backup Export and Restoration
      const fullBackup = {
        schemaVersion: 1,
        settings: freshStore.settings,
        categories: freshStore.categories,
        taskTemplates: freshStore.taskTemplates,
        routineSlots: freshStore.routineSlots,
        subjects: freshStore.subjects,
        topics: freshStore.topics,
        dayPlans: freshStore.dayPlans,
        milestones: freshStore.milestones,
        assignments: freshStore.assignments,
        researchEntries: freshStore.researchEntries,
        savedViews: freshStore.savedViews,
      };

      const backupJson = JSON.stringify(fullBackup);
      const validation = validatePlannerBackup(backupJson);
      expect(validation.isValid).toBe(true);

      // Mutate state, then restore from backup
      store.clearAllData();
      expect(usePlannerStore.getState().subjects.length).toBe(0);

      store.importData(validation.data!);
      expect(usePlannerStore.getState().subjects.length).toBe(freshStore.subjects.length);
      expect(
        usePlannerStore.getState().assignments.some((a) => a.id === newAssignment.id)
      ).toBe(true);
    });
  });
});
