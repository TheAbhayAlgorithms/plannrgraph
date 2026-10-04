import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { ResearchEntry } from '../types';
import {
  calculateTotalResearchHours,
  calculateWeeklyResearchHours,
  calculateResearchStreak,
} from '../utils/calculations';

describe('Module 8: Research Log & Tracker Auto-Fill', () => {
  const TODAY = '2026-10-04';

  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('CRITICAL ACCEPTANCE: ticking Research in the tracker fills hours automatically', () => {
    const store = usePlannerStore.getState();
    const targetDate = TODAY;

    // Initially no research entries exist
    expect(store.researchEntries.length).toBe(0);

    // Tick the Research task in the Daily Tracker
    store.toggleTaskDone(targetDate, 'task-research');

    const updatedState = usePlannerStore.getState();

    // Verify task is marked done in dayPlans
    expect(updatedState.dayPlans[targetDate]?.overrides['task-research']?.done).toBe(true);

    // Verify a research entry was automatically generated with default hours
    const autoEntry = updatedState.researchEntries.find((r) => r.date === targetDate);
    expect(autoEntry).toBeDefined();
    expect(autoEntry?.hours).toBe(updatedState.settings.researchHoursPerSession);
    expect(autoEntry?.hours).toBe(2);
  });

  it('allows overriding auto-filled research hours and preserves the custom value', () => {
    const store = usePlannerStore.getState();
    const targetDate = '2026-10-05';

    // 1. Auto-fill by ticking Research
    store.toggleTaskDone(targetDate, 'task-research');
    let entry = usePlannerStore.getState().researchEntries.find((r) => r.date === targetDate)!;
    expect(entry.hours).toBe(2);

    // 2. Override hours to 4.5
    store.addOrUpdateResearchEntry({
      ...entry,
      hours: 4.5,
      topic: 'Vector Databases & HNSW Indexing',
      notes: 'Explored HNSW cosine similarity vs inner product in high dimensions',
    });

    const updatedEntry = usePlannerStore.getState().researchEntries.find((r) => r.date === targetDate)!;
    expect(updatedEntry.hours).toBe(4.5);
    expect(updatedEntry.topic).toBe('Vector Databases & HNSW Indexing');
    expect(updatedEntry.notes).toContain('HNSW');
  });

  it('calculates total and weekly research hours accurately', () => {
    const entries: ResearchEntry[] = [
      { id: 'r1', date: '2026-10-04', topic: 'Topic A', notes: 'Notes A', hours: 2 },
      { id: 'r2', date: '2026-10-05', topic: 'Topic B', notes: 'Notes B', hours: 3 },
      { id: 'r3', date: '2026-10-12', topic: 'Topic C', notes: 'Notes C', hours: 2.5 },
    ];

    // Total hours
    const total = calculateTotalResearchHours(entries);
    expect(total).toBe(7.5);

    // Weekly hours for week starting Mon 2026-10-05 (contains 2026-10-05 with 3h)
    const weekly = calculateWeeklyResearchHours(entries, '2026-10-05', 1);
    expect(weekly.currentWeekHours).toBe(3);
    expect(weekly.weeklyBreakdown.length).toBeGreaterThan(0);
  });

  it('calculates mini streak counter for consecutive research days', () => {
    // 3 consecutive days: 2026-10-02, 2026-10-03, 2026-10-04
    const entries: ResearchEntry[] = [
      { id: 'r1', date: '2026-10-02', topic: 'Paper 1', notes: '', hours: 2 },
      { id: 'r2', date: '2026-10-03', topic: 'Paper 2', notes: '', hours: 2 },
      { id: 'r3', date: '2026-10-04', topic: 'Paper 3', notes: '', hours: 2 },
    ];

    const streak = calculateResearchStreak(entries, '2026-10-04');
    expect(streak.currentStreak).toBe(3);
    expect(streak.longestStreak).toBe(3);

    // Streak with a broken day in past
    const brokenEntries: ResearchEntry[] = [
      { id: 'r1', date: '2026-09-20', topic: 'A', notes: '', hours: 2 },
      { id: 'r2', date: '2026-09-21', topic: 'B', notes: '', hours: 2 },
      { id: 'r3', date: '2026-09-22', topic: 'C', notes: '', hours: 2 },
      { id: 'r4', date: '2026-09-23', topic: 'D', notes: '', hours: 2 }, // 4 day streak
      { id: 'r5', date: '2026-10-04', topic: 'E', notes: '', hours: 2 }, // current day = 1
    ];

    const streak2 = calculateResearchStreak(brokenEntries, '2026-10-04');
    expect(streak2.currentStreak).toBe(1);
    expect(streak2.longestStreak).toBe(4);
  });

  it('supports adding, updating, and deleting research entries directly', () => {
    const store = usePlannerStore.getState();

    const entry: ResearchEntry = {
      id: 'res-custom-1',
      date: '2026-10-06',
      topic: 'Kernel Bypass Networking (DPDK)',
      notes: 'Ring buffers and zero-copy packet capture',
      hours: 3,
    };

    store.addOrUpdateResearchEntry(entry);
    expect(usePlannerStore.getState().researchEntries.length).toBe(1);

    // Update
    store.addOrUpdateResearchEntry({
      ...entry,
      hours: 4,
    });
    expect(usePlannerStore.getState().researchEntries.find((r) => r.id === 'res-custom-1')?.hours).toBe(4);

    // Delete
    store.deleteResearchEntry('res-custom-1');
    expect(usePlannerStore.getState().researchEntries.length).toBe(0);
  });
});
