import { describe, it, expect, beforeEach } from 'vitest';
import { usePlannerStore } from './usePlannerStore';
import { Subject, Topic } from '../types';
import { calculateTopicProgress } from '../utils/calculations';

describe('Module 5: Subjects and Topics Store & Engine', () => {
  beforeEach(() => {
    usePlannerStore.getState().resetToSeedData();
  });

  it('adds a new subject and optionally syncs focusSubjectId and study hints to dayPlans', () => {
    const store = usePlannerStore.getState();
    const initialSubjectCount = store.subjects.length;

    const newSubject: Subject = {
      id: 'sub-react-advanced',
      name: 'Advanced React & Architecture',
      colour: '#06b6d4',
      startDate: '2026-10-05',
      endDate: '2026-10-07',
      plannedVideoHours: 12,
      notes: 'State machines, SSR, and microfrontends',
    };

    // Add with syncTrackerFocus = true
    store.addSubject(newSubject, true);

    const updatedState = usePlannerStore.getState();
    expect(updatedState.subjects.length).toBe(initialSubjectCount + 1);
    expect(updatedState.subjects.find((s) => s.id === 'sub-react-advanced')).toBeDefined();

    // Check dayPlans focusSubjectId and hints for 2026-10-05, 2026-10-06, 2026-10-07
    for (const d of ['2026-10-05', '2026-10-06', '2026-10-07']) {
      const plan = updatedState.dayPlans[d];
      expect(plan).toBeDefined();
      expect(plan.focusSubjectId).toBe('sub-react-advanced');
      expect(plan.overrides['task-study-1']?.hintLabel).toBe('Study · Advanced React & Architecture');
      expect(plan.overrides['task-study-2']?.hintLabel).toBe('Practice · Advanced React & Architecture');
    }
  });

  it('updates an existing subject and cascades sync to dayPlans', () => {
    const store = usePlannerStore.getState();
    const targetSubject = store.subjects[0];

    const updated: Subject = {
      ...targetSubject,
      name: 'Operating Systems & Virtualization',
      plannedVideoHours: 25,
      colour: '#8b5cf6',
    };

    store.updateSubject(updated, true);

    const updatedState = usePlannerStore.getState();
    const found = updatedState.subjects.find((s) => s.id === targetSubject.id);
    expect(found?.name).toBe('Operating Systems & Virtualization');
    expect(found?.plannedVideoHours).toBe(25);
    expect(found?.colour).toBe('#8b5cf6');

    // DayPlans should have the updated hint
    const plan = updatedState.dayPlans[targetSubject.startDate];
    if (plan) {
      expect(plan.overrides['task-study-1']?.hintLabel).toContain('Operating Systems & Virtualization');
    }
  });

  it('deletes a subject and cascades topic deletion', () => {
    const store = usePlannerStore.getState();
    const targetSubject = store.subjects[0];
    const initialTopicCount = store.topics.length;
    const subjectTopicCount = store.topics.filter((t) => t.subjectId === targetSubject.id).length;

    expect(subjectTopicCount).toBeGreaterThan(0);

    store.deleteSubject(targetSubject.id);

    const updatedState = usePlannerStore.getState();
    expect(updatedState.subjects.find((s) => s.id === targetSubject.id)).toBeUndefined();
    expect(updatedState.topics.filter((t) => t.subjectId === targetSubject.id).length).toBe(0);
    expect(updatedState.topics.length).toBe(initialTopicCount - subjectTopicCount);
  });

  it('bulk adds topics to a subject', () => {
    const store = usePlannerStore.getState();
    const targetSubject = store.subjects[0];
    const initialCount = store.topics.filter((t) => t.subjectId === targetSubject.id).length;

    const newTopics: Topic[] = [
      {
        id: 'top-test-1',
        subjectId: targetSubject.id,
        title: 'Cache Invalidation & LRU',
        targetDate: '2026-10-05',
        isTest: false,
        video: false,
        code: false,
        written: false,
      },
      {
        id: 'top-test-2',
        subjectId: targetSubject.id,
        title: 'TEST: Operating Systems Mock 1',
        targetDate: '2026-10-06',
        isTest: true,
        video: false,
        code: false,
        written: false,
      },
    ];

    store.bulkAddTopics(targetSubject.id, newTopics);

    const updatedTopics = usePlannerStore.getState().topics.filter((t) => t.subjectId === targetSubject.id);
    expect(updatedTopics.length).toBe(initialCount + 2);
    expect(updatedTopics.find((t) => t.id === 'top-test-1')).toBeDefined();
    expect(updatedTopics.find((t) => t.id === 'top-test-2')?.isTest).toBe(true);
  });

  it('toggles video, code, and written checkboxes on topics', () => {
    const store = usePlannerStore.getState();
    const topic = store.topics.find((t) => !t.isTest)!;

    const initialVideo = topic.video;
    store.toggleTopicField(topic.id, 'video');
    expect(usePlannerStore.getState().topics.find((t) => t.id === topic.id)?.video).toBe(!initialVideo);

    const initialCode = topic.code;
    store.toggleTopicField(topic.id, 'code');
    expect(usePlannerStore.getState().topics.find((t) => t.id === topic.id)?.code).toBe(!initialCode);

    const initialWritten = topic.written;
    store.toggleTopicField(topic.id, 'written');
    expect(usePlannerStore.getState().topics.find((t) => t.id === topic.id)?.written).toBe(!initialWritten);
  });

  it('accurately calculates topic progress weighting test topics as 1 tick and regular topics as 3 ticks', () => {
    const sampleTopics: Topic[] = [
      {
        id: 't-1',
        subjectId: 'sub-1',
        title: 'Topic 1',
        targetDate: '2026-10-05',
        isTest: false,
        video: true,
        code: true,
        written: true, // 3 / 3
      },
      {
        id: 't-2',
        subjectId: 'sub-1',
        title: 'Topic 2',
        targetDate: '2026-10-06',
        isTest: false,
        video: true,
        code: false,
        written: false, // 1 / 3
      },
      {
        id: 't-3',
        subjectId: 'sub-1',
        title: 'TEST: Mock 1',
        targetDate: '2026-10-07',
        isTest: true,
        video: false, // skipped
        code: false,  // skipped
        written: true, // 1 / 1
      },
    ];

    // Total applicable ticks: 3 + 3 + 1 = 7 ticks
    // Total ticked: 3 + 1 + 1 = 5 ticks
    // Percentage: Math.round((5 / 7) * 100) = 71%
    const progress = calculateTopicProgress(sampleTopics);
    expect(progress.applicable).toBe(7);
    expect(progress.ticked).toBe(5);
    expect(progress.percentage).toBe(71);
  });

  it('reorders topics correctly within a subject', () => {
    const store = usePlannerStore.getState();
    const targetSubject = store.subjects[0];
    const initialTopics = store.topics.filter((t) => t.subjectId === targetSubject.id);

    expect(initialTopics.length).toBeGreaterThan(1);
    const reversed = [...initialTopics].reverse();

    store.reorderTopics(targetSubject.id, reversed);

    const updatedTopics = usePlannerStore.getState().topics.filter((t) => t.subjectId === targetSubject.id);
    expect(updatedTopics[0].id).toBe(reversed[0].id);
    expect(updatedTopics[updatedTopics.length - 1].id).toBe(reversed[reversed.length - 1].id);
  });
});
