import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { Assignment, Milestone } from '../types';
import { calculateDaysLeft } from '../utils/dateUtils';
import { calculateMilestoneProgress, isAssignmentOverdue } from '../utils/calculations';

describe('Module 7: Projects, Milestones & Assignments', () => {
  const TODAY = '2026-10-04';

  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('calculates days left accurately: future positive, today zero, and past negative', () => {
    expect(calculateDaysLeft('2026-10-10', TODAY)).toBe(6);
    expect(calculateDaysLeft('2026-10-04', TODAY)).toBe(0);
    expect(calculateDaysLeft('2026-10-01', TODAY)).toBe(-3);
  });

  it('detects overdue assignments strictly when past deadline and not done', () => {
    const overdueAssignment: Assignment = {
      id: 'a-overdue',
      subjectId: 'sub-oops',
      title: 'Lab 1 Overdue submission',
      deadline: '2026-10-01', // past
      priority: 'High',
      status: 'todo',
    };
    expect(isAssignmentOverdue(overdueAssignment, TODAY)).toBe(true);

    // If marked done, it is NOT overdue
    const completedPastAssignment: Assignment = {
      ...overdueAssignment,
      status: 'done',
    };
    expect(isAssignmentOverdue(completedPastAssignment, TODAY)).toBe(false);

    // If deadline is today or future, it is NOT overdue
    const futureAssignment: Assignment = {
      ...overdueAssignment,
      deadline: '2026-10-10',
    };
    expect(isAssignmentOverdue(futureAssignment, TODAY)).toBe(false);
  });

  it('calculates milestone progress accurately based on status and linked assignments', () => {
    const completedMilestone: Milestone = {
      id: 'm-comp',
      title: 'Phase 1: Foundation',
      startDate: '2026-10-01',
      endDate: '2026-10-04',
      status: 'completed',
    };
    expect(calculateMilestoneProgress(completedMilestone, [], TODAY)).toBe(100);

    const notStartedMilestone: Milestone = {
      id: 'm-not',
      title: 'Phase 3: Deployment',
      startDate: '2026-10-20',
      endDate: '2026-10-25',
      status: 'not-started',
    };
    expect(calculateMilestoneProgress(notStartedMilestone, [], TODAY)).toBe(0);

    // In-progress with linked assignments
    const inProgressMilestone: Milestone = {
      id: 'm-prog',
      title: 'Phase 2: Core modules',
      startDate: '2026-10-04',
      endDate: '2026-10-10',
      status: 'in-progress',
    };

    const linkedAssignments: Assignment[] = [
      { id: 'a1', subjectId: 'sub-oops', title: 'Task 1', deadline: '2026-10-06', priority: 'High', status: 'done' },
      { id: 'a2', subjectId: 'sub-oops', title: 'Task 2', deadline: '2026-10-08', priority: 'Medium', status: 'todo' },
    ];

    // 1 of 2 assignments done = 50%
    const progress = calculateMilestoneProgress(inProgressMilestone, linkedAssignments, TODAY);
    expect(progress).toBe(50);
  });

  it('supports adding, updating, and deleting assignments', () => {
    const store = usePlannerStore.getState();
    const initialCount = store.assignments.length;

    const newAssignment: Assignment = {
      id: 'ass-new-test',
      subjectId: 'sub-dbms',
      title: 'Database Normalization Sheet',
      deadline: '2026-10-15',
      priority: 'High',
      status: 'todo',
    };

    // Add
    store.addAssignment(newAssignment);
    expect(usePlannerStore.getState().assignments.length).toBe(initialCount + 1);

    // Update
    store.updateAssignment({
      ...newAssignment,
      priority: 'Medium',
      status: 'done',
    });
    const updated = usePlannerStore.getState().assignments.find((a) => a.id === 'ass-new-test');
    expect(updated?.priority).toBe('Medium');
    expect(updated?.status).toBe('done');

    // Delete
    store.deleteAssignment('ass-new-test');
    expect(usePlannerStore.getState().assignments.length).toBe(initialCount);
    expect(usePlannerStore.getState().assignments.find((a) => a.id === 'ass-new-test')).toBeUndefined();
  });

  it('supports adding, cycling status, and deleting project milestones', () => {
    const store = usePlannerStore.getState();
    const initialCount = store.milestones.length;

    const newMilestone: Milestone = {
      id: 'm-test-phase',
      title: 'Phase 7: Performance Benchmarks',
      startDate: '2026-10-25',
      endDate: '2026-10-28',
      status: 'not-started',
    };

    // Add
    store.addMilestone(newMilestone);
    expect(usePlannerStore.getState().milestones.length).toBe(initialCount + 1);

    // Update status to in-progress
    store.updateMilestone({
      ...newMilestone,
      status: 'in-progress',
    });
    expect(usePlannerStore.getState().milestones.find((m) => m.id === 'm-test-phase')?.status).toBe('in-progress');

    // Delete
    store.deleteMilestone('m-test-phase');
    expect(usePlannerStore.getState().milestones.length).toBe(initialCount);
    expect(usePlannerStore.getState().milestones.find((m) => m.id === 'm-test-phase')).toBeUndefined();
  });
});
