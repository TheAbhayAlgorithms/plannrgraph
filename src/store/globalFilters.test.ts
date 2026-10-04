import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { SavedView, Assignment, Priority, ResearchEntry } from '../types';
import { isAssignmentOverdue } from '../utils/calculations';
import { generateDateRange } from '../utils/dateUtils';

describe('Module 10: Global Filters, Search, and Saved Views', () => {
  const TODAY = '2026-10-04';

  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  describe('SavedView Store CRUD Operations', () => {
    it('initializes with seed saved views', () => {
      const store = usePlannerStore.getState();
      expect(store.savedViews).toBeDefined();
      expect(store.savedViews.length).toBeGreaterThan(0);
      const viewNames = store.savedViews.map((v) => v.name);
      expect(viewNames).toContain('All Tasks');
      expect(viewNames).toContain('All Missed Tasks');
      expect(viewNames).toContain('Only OOPs This Week');
    });

    it('can add a new custom saved view', () => {
      const store = usePlannerStore.getState();
      const customView: SavedView = {
        id: 'view-test-custom',
        name: 'Urgent System Design',
        filters: {
          searchQuery: 'System Design',
          priority: 'High',
          status: 'pending',
          subjectId: 'sub-3',
        },
      };

      store.addSavedView(customView);
      const updatedStore = usePlannerStore.getState();
      const found = updatedStore.savedViews.find((v) => v.id === 'view-test-custom');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Urgent System Design');
      expect(found?.filters.priority).toBe('High');
      expect(found?.filters.subjectId).toBe('sub-3');
    });

    it('can update an existing saved view', () => {
      const store = usePlannerStore.getState();
      const initialView = store.savedViews[0];
      expect(initialView).toBeDefined();

      store.updateSavedView({
        ...initialView,
        name: 'Updated View Name',
        filters: {
          ...initialView.filters,
          priority: 'Medium',
        },
      });

      const updatedStore = usePlannerStore.getState();
      const updated = updatedStore.savedViews.find((v) => v.id === initialView.id);
      expect(updated?.name).toBe('Updated View Name');
      expect(updated?.filters.priority).toBe('Medium');
    });

    it('can delete a saved view by id', () => {
      const store = usePlannerStore.getState();
      const initialCount = store.savedViews.length;
      const targetId = store.savedViews[0].id;

      store.deleteSavedView(targetId);
      const updatedStore = usePlannerStore.getState();
      expect(updatedStore.savedViews.length).toBe(initialCount - 1);
      expect(updatedStore.savedViews.some((v) => v.id === targetId)).toBe(false);
    });
  });

  describe('Multi-Criteria Filter Logic for Assignments', () => {
    it('filters assignments by combined priority, status, and search query', () => {
      const store = usePlannerStore.getState();
      const assignments = store.assignments;

      // Filter: High priority, status todo, search "Schema"
      const filtered = assignments.filter((a) => {
        const matchesQuery = a.title.toLowerCase().includes('schema');
        const matchesPriority = a.priority === 'High';
        const matchesStatus = a.status === 'todo';
        return matchesQuery && matchesPriority && matchesStatus;
      });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((a) => {
        expect(a.title.toLowerCase()).toContain('schema');
        expect(a.priority).toBe('High');
        expect(a.status).toBe('todo');
      });
    });

    it('correctly filters overdue assignments within a specified date window', () => {
      const store = usePlannerStore.getState();

      // Add a test assignment that is overdue
      const overdueAssignment: Assignment = {
        id: 'test-overdue-1',
        subjectId: 'sub-oops',
        title: 'Overdue Milestone Prep',
        deadline: '2026-10-01',
        priority: 'High' as Priority,
        status: 'todo',
      };
      store.addAssignment(overdueAssignment);

      const allAssignments = usePlannerStore.getState().assignments;
      const overdueItems = allAssignments.filter((a) => isAssignmentOverdue(a, TODAY));
      expect(overdueItems.some((a) => a.id === 'test-overdue-1')).toBe(true);

      // Filter by date range: 2026-10-01 to 2026-10-02
      const windowFiltered = overdueItems.filter(
        (a) => a.deadline >= '2026-10-01' && a.deadline <= '2026-10-02'
      );
      expect(windowFiltered.some((a) => a.id === 'test-overdue-1')).toBe(true);
    });
  });

  describe('Multi-Criteria Filter Logic for Tracker Tasks and Dates', () => {
    it('filters tasks by category and name substring', () => {
      const store = usePlannerStore.getState();
      const activeTasks = store.taskTemplates.filter((t) => t.active);

      // Find Study category
      const studyCategory = store.categories.find((c) => c.name.toLowerCase().includes('study'));
      expect(studyCategory).toBeDefined();

      const filteredTasks = activeTasks.filter((t) => {
        const matchesCat = t.categoryId === studyCategory!.id;
        const matchesQuery = t.name.toLowerCase().includes('study');
        return matchesCat && matchesQuery;
      });

      expect(filteredTasks.length).toBeGreaterThan(0);
      filteredTasks.forEach((t) => {
        expect(t.categoryId).toBe(studyCategory!.id);
        expect(t.name.toLowerCase()).toContain('study');
      });
    });

    it('filters date range and subject focus correctly', () => {
      const store = usePlannerStore.getState();
      const allDates = generateDateRange(store.settings.startDate, store.settings.endDate);

      // Set focus subject for today
      store.setFocusSubject(TODAY, 'sub-dbms');

      const currentDayPlans = usePlannerStore.getState().dayPlans;
      const filteredDates = allDates.filter((d) => {
        // Date within custom window
        const inWindow = d >= '2026-10-01' && d <= '2026-10-10';
        const matchesSubject = currentDayPlans[d]?.focusSubjectId === 'sub-dbms';
        return inWindow && matchesSubject;
      });

      expect(filteredDates).toContain(TODAY);
      filteredDates.forEach((d) => {
        expect(d >= '2026-10-01' && d <= '2026-10-10').toBe(true);
        expect(currentDayPlans[d]?.focusSubjectId).toBe('sub-dbms');
      });
    });
  });

  describe('Multi-Criteria Filter Logic for Research Log', () => {
    it('filters research entries by date range, notes query, and tracker check status', () => {
      const store = usePlannerStore.getState();

      const testEntry: ResearchEntry = {
        id: 'res-test-raft',
        date: '2026-10-05',
        topic: 'Raft Consensus Algorithm',
        notes: 'Leader election, heartbeat timeouts, and log replication guarantees',
        hours: 2.5,
      };
      store.addOrUpdateResearchEntry(testEntry);

      const entries = usePlannerStore.getState().researchEntries;

      const filtered = entries.filter((e) => {
        const matchesNotes = e.notes.toLowerCase().includes('raft') || e.topic.toLowerCase().includes('raft');
        const matchesDateRange = e.date >= '2026-10-01' && e.date <= '2026-10-10';
        return matchesNotes && matchesDateRange;
      });

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((e) => {
        expect(e.date >= '2026-10-01' && e.date <= '2026-10-10').toBe(true);
        const matches = e.notes.toLowerCase().includes('raft') || e.topic.toLowerCase().includes('raft');
        expect(matches).toBe(true);
      });
    });
  });
});
