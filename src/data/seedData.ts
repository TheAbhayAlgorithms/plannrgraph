import {
  Category,
  PlannerData,
  RoutineSlot,
  Subject,
  TaskTemplate,
  Topic,
  Milestone,
  Assignment,
  DayPlan,
} from '../types';
import { generateDateRange } from '../utils/dateUtils';

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-morning', name: 'Morning routine', colour: '#10b981' },
  { id: 'cat-study', name: 'Study', colour: '#6366f1' },
  { id: 'cat-extra', name: 'Extra work', colour: '#f59e0b' },
  { id: 'cat-research', name: 'Research', colour: '#8b5cf6' },
  { id: 'cat-break', name: 'Break/College', colour: '#64748b' },
];

export const SEED_TASKS: TaskTemplate[] = [
  { id: 'task-warm-water', name: 'Warm water', categoryId: 'cat-morning', order: 0, active: true },
  { id: 'task-brush', name: 'Brush', categoryId: 'cat-morning', order: 1, active: true },
  { id: 'task-workout', name: 'Workout', categoryId: 'cat-morning', order: 2, active: true },
  { id: 'task-study-1', name: 'Study 1', categoryId: 'cat-study', order: 3, active: true, isStudy: true },
  { id: 'task-cook', name: 'Cook', categoryId: 'cat-morning', order: 4, active: true },
  { id: 'task-get-ready', name: 'Get ready', categoryId: 'cat-morning', order: 5, active: true },
  { id: 'task-extra-work', name: 'Extra work', categoryId: 'cat-extra', order: 6, active: true },
  { id: 'task-research', name: 'Research', categoryId: 'cat-research', order: 7, active: true, isResearch: true },
  { id: 'task-study-2', name: 'Study 2', categoryId: 'cat-study', order: 8, active: true, isStudy: true },
];

export const SEED_ROUTINE_SLOTS: RoutineSlot[] = [
  // Weekday Routine
  { id: 'slot-wd-1', dayType: 'weekday', startTime: '04:45', endTime: '04:50', title: 'Wake + Warm water', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-warm-water' },
  { id: 'slot-wd-2', dayType: 'weekday', startTime: '04:50', endTime: '05:05', title: 'Brush', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-brush' },
  { id: 'slot-wd-3', dayType: 'weekday', startTime: '05:05', endTime: '05:45', title: 'Workout', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-workout' },
  { id: 'slot-wd-4', dayType: 'weekday', startTime: '05:45', endTime: '06:45', title: 'Study 1 (video 1.5x + code along, 60 min)', categoryId: 'cat-study', linkedTaskTemplateId: 'task-study-1' },
  { id: 'slot-wd-5', dayType: 'weekday', startTime: '06:45', endTime: '07:30', title: 'Cook', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-cook' },
  { id: 'slot-wd-6', dayType: 'weekday', startTime: '07:30', endTime: '08:15', title: 'Get ready', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-get-ready' },
  { id: 'slot-wd-7', dayType: 'weekday', startTime: '08:15', endTime: '08:20', title: 'Leave buffer', categoryId: 'cat-break' },
  { id: 'slot-wd-8', dayType: 'weekday', startTime: '08:20', endTime: '17:00', title: 'College', categoryId: 'cat-break' },
  { id: 'slot-wd-9', dayType: 'weekday', startTime: '17:00', endTime: '17:30', title: 'Return and snack', categoryId: 'cat-break' },
  { id: 'slot-wd-10', dayType: 'weekday', startTime: '17:30', endTime: '19:30', title: 'Extra work (2h)', categoryId: 'cat-extra', linkedTaskTemplateId: 'task-extra-work' },
  { id: 'slot-wd-11', dayType: 'weekday', startTime: '19:30', endTime: '20:15', title: 'Dinner', categoryId: 'cat-break' },
  { id: 'slot-wd-12', dayType: 'weekday', startTime: '20:15', endTime: '22:15', title: 'Research (2h)', categoryId: 'cat-research', linkedTaskTemplateId: 'task-research' },
  { id: 'slot-wd-13', dayType: 'weekday', startTime: '22:15', endTime: '23:15', title: 'Study 2 (handwritten practice, 60 min)', categoryId: 'cat-study', linkedTaskTemplateId: 'task-study-2' },
  { id: 'slot-wd-14', dayType: 'weekday', startTime: '23:15', endTime: '04:45', title: 'Sleep', categoryId: 'cat-break' },

  // Weekend Routine
  { id: 'slot-we-1', dayType: 'weekend', startTime: '06:00', endTime: '06:05', title: 'Wake + Warm water', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-warm-water' },
  { id: 'slot-we-2', dayType: 'weekend', startTime: '06:05', endTime: '06:20', title: 'Brush', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-brush' },
  { id: 'slot-we-3', dayType: 'weekend', startTime: '06:20', endTime: '07:00', title: 'Workout', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-workout' },
  { id: 'slot-we-4', dayType: 'weekend', startTime: '07:00', endTime: '07:45', title: 'Cook', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-cook' },
  { id: 'slot-we-5', dayType: 'weekend', startTime: '07:45', endTime: '08:30', title: 'Get ready', categoryId: 'cat-morning', linkedTaskTemplateId: 'task-get-ready' },
  { id: 'slot-we-6', dayType: 'weekend', startTime: '08:30', endTime: '12:30', title: 'Study 1 (4h)', categoryId: 'cat-study', linkedTaskTemplateId: 'task-study-1' },
  { id: 'slot-we-7', dayType: 'weekend', startTime: '12:30', endTime: '14:00', title: 'Lunch', categoryId: 'cat-break' },
  { id: 'slot-we-8', dayType: 'weekend', startTime: '14:00', endTime: '18:00', title: 'Study 2 (4h)', categoryId: 'cat-study', linkedTaskTemplateId: 'task-study-2' },
  { id: 'slot-we-9', dayType: 'weekend', startTime: '18:00', endTime: '18:30', title: 'Break', categoryId: 'cat-break' },
  { id: 'slot-we-10', dayType: 'weekend', startTime: '18:30', endTime: '20:30', title: 'Extra work (2h)', categoryId: 'cat-extra', linkedTaskTemplateId: 'task-extra-work' },
  { id: 'slot-we-11', dayType: 'weekend', startTime: '20:30', endTime: '21:15', title: 'Dinner', categoryId: 'cat-break' },
  { id: 'slot-we-12', dayType: 'weekend', startTime: '21:15', endTime: '23:15', title: 'Research (2h)', categoryId: 'cat-research', linkedTaskTemplateId: 'task-research', notes: 'Sunday night: 20-min weekly review' },
  { id: 'slot-we-13', dayType: 'weekend', startTime: '23:15', endTime: '06:00', title: 'Sleep', categoryId: 'cat-break' },
];

export const SEED_SUBJECTS: Subject[] = [
  { id: 'sub-oops', name: 'OOPs (Java)', colour: '#3b82f6', startDate: '2026-10-04', endDate: '2026-10-10', plannedVideoHours: 14, notes: 'Focus on core OOP concepts and hand coding' },
  { id: 'sub-dbms', name: 'DBMS', colour: '#10b981', startDate: '2026-10-11', endDate: '2026-10-17', plannedVideoHours: 14, notes: 'ER diagram to normalization and complex SQL' },
  { id: 'sub-js', name: 'JavaScript', colour: '#f59e0b', startDate: '2026-10-18', endDate: '2026-10-23', plannedVideoHours: 12, notes: 'Async JS, DOM manipulation, storage APIs' },
  { id: 'sub-php', name: 'PHP', colour: '#8b5cf6', startDate: '2026-10-24', endDate: '2026-10-27', plannedVideoHours: 8, notes: 'Form processing, Sessions, PDO MySQL' },
  { id: 'sub-html-css', name: 'HTML/CSS', colour: '#ec4899', startDate: '2026-10-28', endDate: '2026-10-29', plannedVideoHours: 4, notes: 'Flexbox, CSS Grid, Responsive UI' },
  { id: 'sub-revision', name: 'Final revision', colour: '#6366f1', startDate: '2026-10-30', endDate: '2026-10-30', plannedVideoHours: 2, notes: 'Comprehensive mock questions and viva prep' },
];

export const SEED_TOPICS: Topic[] = [
  // OOPs Topics
  { id: 'top-oops-1', subjectId: 'sub-oops', title: 'Classes & objects', targetDate: '2026-10-04', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-2', subjectId: 'sub-oops', title: 'Constructors, this & static', targetDate: '2026-10-05', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-3', subjectId: 'sub-oops', title: 'Encapsulation & access modifiers', targetDate: '2026-10-06', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-4', subjectId: 'sub-oops', title: 'Inheritance & super', targetDate: '2026-10-07', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-5', subjectId: 'sub-oops', title: 'Polymorphism', targetDate: '2026-10-08', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-6', subjectId: 'sub-oops', title: 'Abstract classes & interfaces', targetDate: '2026-10-08', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-7', subjectId: 'sub-oops', title: 'Exception handling & packages', targetDate: '2026-10-09', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-8', subjectId: 'sub-oops', title: 'Collections & file I/O', targetDate: '2026-10-09', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-9', subjectId: 'sub-oops', title: 'Multithreading (optional)', targetDate: '2026-10-10', isTest: false, video: false, code: false, written: false },
  { id: 'top-oops-10', subjectId: 'sub-oops', title: 'TEST: 10 programs by hand', targetDate: '2026-10-10', isTest: true, video: false, code: false, written: false },

  // DBMS Topics
  { id: 'top-dbms-1', subjectId: 'sub-dbms', title: 'Intro & ER model', targetDate: '2026-10-11', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-2', subjectId: 'sub-dbms', title: 'Relational model & keys', targetDate: '2026-10-12', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-3', subjectId: 'sub-dbms', title: 'SQL DDL & DML', targetDate: '2026-10-13', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-4', subjectId: 'sub-dbms', title: 'Joins & subqueries', targetDate: '2026-10-14', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-5', subjectId: 'sub-dbms', title: 'Views, indexes & PL/SQL', targetDate: '2026-10-15', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-6', subjectId: 'sub-dbms', title: 'Normalization 1NF-BCNF', targetDate: '2026-10-16', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-7', subjectId: 'sub-dbms', title: 'Transactions & ACID', targetDate: '2026-10-16', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-8', subjectId: 'sub-dbms', title: 'Concurrency control', targetDate: '2026-10-17', isTest: false, video: false, code: false, written: false },
  { id: 'top-dbms-9', subjectId: 'sub-dbms', title: 'TEST: 30 SQL queries', targetDate: '2026-10-17', isTest: true, video: false, code: false, written: false },

  // JavaScript Topics
  { id: 'top-js-1', subjectId: 'sub-js', title: 'Variables, types, control flow', targetDate: '2026-10-18', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-2', subjectId: 'sub-js', title: 'Functions', targetDate: '2026-10-19', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-3', subjectId: 'sub-js', title: 'Scope & closures', targetDate: '2026-10-19', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-4', subjectId: 'sub-js', title: 'Arrays & objects', targetDate: '2026-10-20', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-5', subjectId: 'sub-js', title: 'DOM', targetDate: '2026-10-21', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-6', subjectId: 'sub-js', title: 'Events & form validation', targetDate: '2026-10-21', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-7', subjectId: 'sub-js', title: 'ES6', targetDate: '2026-10-22', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-8', subjectId: 'sub-js', title: 'Async, promises & fetch', targetDate: '2026-10-22', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-9', subjectId: 'sub-js', title: 'JSON & localStorage', targetDate: '2026-10-23', isTest: false, video: false, code: false, written: false },
  { id: 'top-js-10', subjectId: 'sub-js', title: 'TEST: mini quiz + 5 programs', targetDate: '2026-10-23', isTest: true, video: false, code: false, written: false },

  // PHP Topics
  { id: 'top-php-1', subjectId: 'sub-php', title: 'Syntax, arrays & functions', targetDate: '2026-10-24', isTest: false, video: false, code: false, written: false },
  { id: 'top-php-2', subjectId: 'sub-php', title: 'Forms GET/POST & validation', targetDate: '2026-10-25', isTest: false, video: false, code: false, written: false },
  { id: 'top-php-3', subjectId: 'sub-php', title: 'Sessions & cookies', targetDate: '2026-10-25', isTest: false, video: false, code: false, written: false },
  { id: 'top-php-4', subjectId: 'sub-php', title: 'MySQL PDO/mysqli CRUD', targetDate: '2026-10-26', isTest: false, video: false, code: false, written: false },
  { id: 'top-php-5', subjectId: 'sub-php', title: 'File upload', targetDate: '2026-10-26', isTest: false, video: false, code: false, written: false },
  { id: 'top-php-6', subjectId: 'sub-php', title: 'PHP OOP', targetDate: '2026-10-27', isTest: false, video: false, code: false, written: false },
  { id: 'top-php-7', subjectId: 'sub-php', title: 'TEST: login + CRUD build', targetDate: '2026-10-27', isTest: true, video: false, code: false, written: false },

  // HTML/CSS Topics
  { id: 'top-hc-1', subjectId: 'sub-html-css', title: 'Semantic HTML, forms & tables', targetDate: '2026-10-28', isTest: false, video: false, code: false, written: false },
  { id: 'top-hc-2', subjectId: 'sub-html-css', title: 'Box model & positioning', targetDate: '2026-10-28', isTest: false, video: false, code: false, written: false },
  { id: 'top-hc-3', subjectId: 'sub-html-css', title: 'Flexbox & Grid', targetDate: '2026-10-29', isTest: false, video: false, code: false, written: false },
  { id: 'top-hc-4', subjectId: 'sub-html-css', title: 'Responsive & media queries', targetDate: '2026-10-29', isTest: false, video: false, code: false, written: false },
  { id: 'top-hc-5', subjectId: 'sub-html-css', title: 'TEST: rebuild one page', targetDate: '2026-10-29', isTest: true, video: false, code: false, written: false },
];

export const SEED_MILESTONES: Milestone[] = [
  { id: 'm-1', title: 'Clear pending assignments', startDate: '2026-10-04', endDate: '2026-10-10', status: 'not-started' },
  { id: 'm-2', title: 'Design DB schema', startDate: '2026-10-11', endDate: '2026-10-17', status: 'not-started' },
  { id: 'm-3', title: 'Build frontend', startDate: '2026-10-18', endDate: '2026-10-22', status: 'not-started' },
  { id: 'm-4', title: 'PHP + MySQL backend', startDate: '2026-10-23', endDate: '2026-10-26', status: 'not-started' },
  { id: 'm-5', title: 'Testing & fixes', startDate: '2026-10-27', endDate: '2026-10-29', status: 'not-started' },
  { id: 'm-6', title: 'Final submissions', startDate: '2026-10-30', endDate: '2026-10-30', status: 'not-started' },
];

export const SEED_ASSIGNMENTS: Assignment[] = [
  { id: 'ass-1', subjectId: 'sub-oops', title: 'Java OOP Inheritance Lab submission', deadline: '2026-10-10', priority: 'High', status: 'todo' },
  { id: 'ass-2', subjectId: 'sub-dbms', title: 'E-commerce ER Diagram & Schema Design', deadline: '2026-10-17', priority: 'High', status: 'todo' },
  { id: 'ass-3', subjectId: 'sub-js', title: 'Interactive Task Board Application', deadline: '2026-10-22', priority: 'Medium', status: 'todo' },
  { id: 'ass-4', subjectId: 'sub-php', title: 'User Auth & Role Management Module', deadline: '2026-10-26', priority: 'High', status: 'todo' },
];

/**
 * Maps date to the specific Extra Work label specified in product requirements.
 */
function getExtraWorkLabelForDate(dateStr: string): string {
  if (dateStr >= '2026-10-04' && dateStr <= '2026-10-10') return 'Assignments';
  if (dateStr >= '2026-10-11' && dateStr <= '2026-10-17') return 'DB schema';
  if (dateStr >= '2026-10-18' && dateStr <= '2026-10-22') return 'Frontend';
  if (dateStr >= '2026-10-23' && dateStr <= '2026-10-26') return 'Backend';
  if (dateStr >= '2026-10-27' && dateStr <= '2026-10-29') return 'Test & fix';
  if (dateStr === '2026-10-30') return 'Submit';
  return 'Extra work';
}

/**
 * Generates initial day plans for the full date range with intelligent hint labels.
 */
export function generateSeedDayPlans(
  startDate = '2026-10-04',
  endDate = '2026-10-30',
  subjects: Subject[] = SEED_SUBJECTS
): Record<string, DayPlan> {
  const dates = generateDateRange(startDate, endDate);
  const dayPlans: Record<string, DayPlan> = {};

  for (const date of dates) {
    // Find matching subject
    const subject = subjects.find(s => date >= s.startDate && date <= s.endDate);
    const focusSubjectId = subject?.id;
    const subjectName = subject?.name ?? 'General';
    const extraWorkLabel = getExtraWorkLabelForDate(date);

    dayPlans[date] = {
      date,
      focusSubjectId,
      overrides: {
        'task-warm-water': { hintLabel: 'Wake & Hydrate', done: false },
        'task-brush': { hintLabel: 'Freshen up', done: false },
        'task-workout': { hintLabel: 'Mobility & core', done: false },
        'task-study-1': { hintLabel: `Study · ${subjectName}`, done: false },
        'task-cook': { hintLabel: 'Healthy meal', done: false },
        'task-get-ready': { hintLabel: 'Dress & pack', done: false },
        'task-extra-work': { hintLabel: extraWorkLabel, done: false },
        'task-research': { hintLabel: 'Research paper', done: false },
        'task-study-2': { hintLabel: `Practice · ${subjectName}`, done: false },
      },
    };
  }

  return dayPlans;
}

export function createInitialPlannerData(): PlannerData {
  return {
    schemaVersion: 1,
    settings: {
      startDate: '2026-10-04',
      endDate: '2026-10-30',
      theme: 'light',
      studyHoursWeekday: 2,
      studyHoursWeekend: 8,
      researchHoursPerSession: 2,
      strongDayThreshold: 80,
      weekStartsOn: 1,
    },
    categories: SEED_CATEGORIES,
    taskTemplates: SEED_TASKS,
    routineSlots: SEED_ROUTINE_SLOTS,
    subjects: SEED_SUBJECTS,
    topics: SEED_TOPICS,
    dayPlans: generateSeedDayPlans(),
    milestones: SEED_MILESTONES,
    assignments: SEED_ASSIGNMENTS,
    researchEntries: [],
    savedViews: [
      { id: 'view-all', name: 'All Tasks', filters: {} },
      { id: 'view-missed', name: 'All Missed Tasks', filters: { status: 'missed' } },
      { id: 'view-oops', name: 'Only OOPs This Week', filters: { subjectId: 'sub-oops' } },
    ],
  };
}
