import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  PlannerData,
  Settings,
  Category,
  TaskTemplate,
  RoutineSlot,
  Subject,
  Topic,
  Milestone,
  Assignment,
  ResearchEntry,
  SavedView,
  ThemeMode,
  DayType,
  DayPlan,
} from '../types';
import { createInitialPlannerData } from '../data/seedData';
import { generateDateRange } from '../utils/dateUtils';
import { addDays, format, parseISO } from 'date-fns';

export interface PlannerStoreState extends PlannerData {
  // Actions
  setSettings: (settings: Partial<Settings>) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTaskDone: (date: string, taskId: string) => void;
  setTaskHint: (date: string, taskId: string, hintLabel: string) => void;
  setFocusSubject: (date: string, subjectId: string | undefined) => void;
  bulkTickDay: (date: string, done: boolean) => void;
  applyLabelToDateRange: (taskId: string, label: string, startDate: string, endDate: string) => void;
  moveIncompleteToTomorrow: (currentDate: string) => { movedCount: number; tomorrowDate: string | null };

  // Categories
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  // Tasks
  addTaskTemplate: (task: TaskTemplate, defaultHint?: string) => void;
  updateTaskTemplate: (task: TaskTemplate) => void;
  deleteTaskTemplate: (taskId: string, keepHistory?: boolean) => void;
  reorderTaskTemplates: (tasks: TaskTemplate[]) => void;
  toggleTaskActive: (taskId: string) => void;

  // Routine
  addRoutineSlot: (slot: RoutineSlot) => void;
  updateRoutineSlot: (slot: RoutineSlot) => void;
  deleteRoutineSlot: (slotId: string) => void;
  setRoutineSlots: (slots: RoutineSlot[]) => void;
  duplicateRoutineSlot: (slotId: string) => void;
  toggleSlotNotification: (slotId: string) => void;
  copyWeekdayToWeekend: () => void;
  reorderRoutineSlots: (dayType: DayType, newSlots: RoutineSlot[]) => void;

  // Subjects & Topics
  addSubject: (subject: Subject, syncTrackerFocus?: boolean) => void;
  updateSubject: (subject: Subject, syncTrackerFocus?: boolean) => void;
  deleteSubject: (subjectId: string) => void;
  addTopic: (topic: Topic) => void;
  bulkAddTopics: (subjectId: string, newTopics: Topic[]) => void;
  updateTopic: (topic: Topic) => void;
  deleteTopic: (topicId: string) => void;
  reorderTopics: (subjectId: string, reorderedTopics: Topic[]) => void;
  toggleTopicField: (topicId: string, field: 'video' | 'code' | 'written') => void;
  replanSubject: (
    subjectId: string,
    newStartDate: string,
    newEndDate: string,
    newPlannedVideoHours?: number,
    redistributeTopics?: boolean,
    cascadeSubsequent?: boolean
  ) => void;

  // Milestones & Assignments
  addMilestone: (milestone: Milestone) => void;
  updateMilestone: (milestone: Milestone) => void;
  deleteMilestone: (milestoneId: string) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (assignment: Assignment) => void;
  deleteAssignment: (assignmentId: string) => void;

  // Research
  addOrUpdateResearchEntry: (entry: ResearchEntry) => void;
  deleteResearchEntry: (entryId: string) => void;

  // Saved Views
  addSavedView: (view: SavedView) => void;
  updateSavedView: (view: SavedView) => void;
  deleteSavedView: (viewId: string) => void;

  // History Undo/Redo (up to 20 actions)
  undoStack: PlannerSnapshot[];
  redoStack: PlannerSnapshot[];
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Bulk & Maintenance
  resetToSeedData: () => void;
  clearAllData: () => void;
  importData: (data: PlannerData) => void;
}

export interface PlannerSnapshot {
  dayPlans: Record<string, DayPlan>;
  topics: Topic[];
  assignments: Assignment[];
  milestones: Milestone[];
  researchEntries: ResearchEntry[];
  routineSlots: RoutineSlot[];
  taskTemplates: TaskTemplate[];
  categories: Category[];
  subjects: Subject[];
}

// Memory fallback for non-browser environments (e.g. testing or SSR)
const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(name);
    }
    return memoryStorage[name] ?? null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(name, value);
    } else {
      memoryStorage[name] = value;
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(name);
    } else {
      delete memoryStorage[name];
    }
  },
};

function takeSnapshot(state: PlannerStoreState): PlannerSnapshot {
  return {
    dayPlans: state.dayPlans,
    topics: state.topics,
    assignments: state.assignments,
    milestones: state.milestones,
    researchEntries: state.researchEntries,
    routineSlots: state.routineSlots,
    taskTemplates: state.taskTemplates,
    categories: state.categories,
    subjects: state.subjects,
  };
}

function pushSnapshot(state: PlannerStoreState) {
  const currentSnapshot = takeSnapshot(state);
  const nextStack = [...(state.undoStack || []), currentSnapshot];
  if (nextStack.length > 20) {
    nextStack.shift();
  }
  return {
    undoStack: nextStack,
    redoStack: [],
    canUndo: true,
    canRedo: false,
  };
}

export const usePlannerStore = create<PlannerStoreState>()(
  persist(
    (set) => ({
      ...createInitialPlannerData(),

      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,

      setSettings: (newSettings) =>
        set((state) => {
          const updatedSettings = { ...state.settings, ...newSettings };
          const updatedDayPlans = { ...state.dayPlans };

          if (
            (newSettings.startDate && newSettings.startDate !== state.settings.startDate) ||
            (newSettings.endDate && newSettings.endDate !== state.settings.endDate)
          ) {
            const dateList = generateDateRange(updatedSettings.startDate, updatedSettings.endDate);
            for (const d of dateList) {
              if (!updatedDayPlans[d]) {
                const subject = state.subjects.find((s) => d >= s.startDate && d <= s.endDate);
                const focusSubjectId = subject?.id;
                const overrides: Record<string, { hintLabel?: string; done: boolean }> = {};
                for (const t of state.taskTemplates) {
                  if (t.active) {
                    overrides[t.id] = { done: false };
                  }
                }
                updatedDayPlans[d] = {
                  date: d,
                  focusSubjectId,
                  overrides,
                };
              }
            }
          }

          return {
            settings: updatedSettings,
            dayPlans: updatedDayPlans,
          };
        }),

      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),

      toggleTaskDone: (date, taskId) =>
        set((state) => {
          const history = pushSnapshot(state);
          const currentPlan = state.dayPlans[date] ?? {
            date,
            overrides: {},
          };
          const currentTaskOverride = currentPlan.overrides[taskId] ?? { done: false };
          const newDone = !currentTaskOverride.done;

          const updatedDayPlans = {
            ...state.dayPlans,
            [date]: {
              ...currentPlan,
              overrides: {
                ...currentPlan.overrides,
                [taskId]: {
                  ...currentTaskOverride,
                  done: newDone,
                },
              },
            },
          };

          // If this is a research task, automatically manage research hours
          const taskTemplate = state.taskTemplates.find((t) => t.id === taskId);
          let updatedResearchEntries = state.researchEntries;

          if (taskTemplate?.isResearch) {
            const existingEntryIndex = state.researchEntries.findIndex((r) => r.date === date);
            const defaultHours = state.settings.researchHoursPerSession;

            if (newDone) {
              if (existingEntryIndex >= 0) {
                updatedResearchEntries = [...state.researchEntries];
                if (updatedResearchEntries[existingEntryIndex].hours === 0) {
                  updatedResearchEntries[existingEntryIndex] = {
                    ...updatedResearchEntries[existingEntryIndex],
                    hours: defaultHours,
                  };
                }
              } else {
                updatedResearchEntries = [
                  ...state.researchEntries,
                  {
                    id: `res-${date}-${Date.now()}`,
                    date,
                    topic: 'Research Session',
                    notes: '',
                    hours: defaultHours,
                  },
                ];
              }
            }
          }

          return {
            ...history,
            dayPlans: updatedDayPlans,
            researchEntries: updatedResearchEntries,
          };
        }),

      setTaskHint: (date, taskId, hintLabel) =>
        set((state) => {
          const history = pushSnapshot(state);
          const currentPlan = state.dayPlans[date] ?? { date, overrides: {} };
          const currentOverride = currentPlan.overrides[taskId] ?? { done: false };

          return {
            ...history,
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                overrides: {
                  ...currentPlan.overrides,
                  [taskId]: {
                    ...currentOverride,
                    hintLabel,
                  },
                },
              },
            },
          };
        }),

      setFocusSubject: (date, subjectId) =>
        set((state) => {
          const history = pushSnapshot(state);
          const currentPlan = state.dayPlans[date] ?? { date, overrides: {} };
          return {
            ...history,
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                focusSubjectId: subjectId,
              },
            },
          };
        }),

      bulkTickDay: (date, done) =>
        set((state) => {
          const history = pushSnapshot(state);
          const currentPlan = state.dayPlans[date] ?? { date, overrides: {} };
          const newOverrides = { ...currentPlan.overrides };

          for (const task of state.taskTemplates) {
            if (task.active) {
              newOverrides[task.id] = {
                ...newOverrides[task.id],
                done,
              };
            }
          }

          return {
            ...history,
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                overrides: newOverrides,
              },
            },
          };
        }),

      applyLabelToDateRange: (taskId, label, startDate, endDate) =>
        set((state) => {
          const history = pushSnapshot(state);
          const dates = generateDateRange(startDate, endDate);
          const updatedDayPlans = { ...state.dayPlans };

          for (const d of dates) {
            const currentPlan = updatedDayPlans[d] ?? { date: d, overrides: {} };
            const currentOverride = currentPlan.overrides[taskId] ?? { done: false };

            updatedDayPlans[d] = {
              ...currentPlan,
              overrides: {
                ...currentPlan.overrides,
                [taskId]: {
                  ...currentOverride,
                  hintLabel: label,
                },
              },
            };
          }

          return { ...history, dayPlans: updatedDayPlans };
        }),

      moveIncompleteToTomorrow: (currentDate) => {
        let movedCount = 0;
        let tomorrowDate: string | null = null;

        set((state) => {
          const currentPlan = state.dayPlans[currentDate];
          if (!currentPlan) return state;

          const parsed = parseISO(currentDate);
          const tomorrowStr = format(addDays(parsed, 1), 'yyyy-MM-dd');
          tomorrowDate = tomorrowStr;

          const tomorrowPlan = state.dayPlans[tomorrowStr];
          if (!tomorrowPlan) {
            return state;
          }

          const history = pushSnapshot(state);
          const updatedTomorrowOverrides = { ...tomorrowPlan.overrides };

          for (const task of state.taskTemplates) {
            if (task.active) {
              const wasDone = currentPlan.overrides[task.id]?.done ?? false;
              if (!wasDone) {
                movedCount++;
                const existingTomorrow = updatedTomorrowOverrides[task.id] ?? { done: false };
                const currentHint = currentPlan.overrides[task.id]?.hintLabel;
                const prefix = currentHint ? `[Carried] ${currentHint}` : `[Carried] ${task.name}`;
                updatedTomorrowOverrides[task.id] = {
                  ...existingTomorrow,
                  hintLabel: existingTomorrow.hintLabel?.includes('[Carried]')
                    ? existingTomorrow.hintLabel
                    : prefix,
                  done: false,
                };
              }
            }
          }

          return {
            ...history,
            dayPlans: {
              ...state.dayPlans,
              [tomorrowStr]: {
                ...tomorrowPlan,
                overrides: updatedTomorrowOverrides,
              },
            },
          };
        });

        return { movedCount, tomorrowDate };
      },

      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),

      updateCategory: (updatedCategory) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === updatedCategory.id ? updatedCategory : c
          ),
        })),

      deleteCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== categoryId),
        })),

      addTaskTemplate: (task, defaultHint) =>
        set((state) => {
          const updatedDayPlans = { ...state.dayPlans };
          const hint = defaultHint ?? task.name;
          for (const date in updatedDayPlans) {
            const plan = updatedDayPlans[date];
            if (!plan.overrides[task.id]) {
              updatedDayPlans[date] = {
                ...plan,
                overrides: {
                  ...plan.overrides,
                  [task.id]: {
                    hintLabel: hint,
                    done: false,
                  },
                },
              };
            }
          }
          return {
            taskTemplates: [...state.taskTemplates, task],
            dayPlans: updatedDayPlans,
          };
        }),

      toggleTaskActive: (taskId) =>
        set((state) => ({
          taskTemplates: state.taskTemplates.map((t) =>
            t.id === taskId ? { ...t, active: !t.active } : t
          ),
        })),

      updateTaskTemplate: (updatedTask) =>
        set((state) => ({
          taskTemplates: state.taskTemplates.map((t) =>
            t.id === updatedTask.id ? updatedTask : t
          ),
        })),

      deleteTaskTemplate: (taskId, keepHistory = true) =>
        set((state) => {
          const filteredTasks = state.taskTemplates.filter((t) => t.id !== taskId);
          if (keepHistory) {
            return { taskTemplates: filteredTasks };
          }
          const newDayPlans = { ...state.dayPlans };
          for (const date in newDayPlans) {
            const plan = newDayPlans[date];
            if (plan.overrides[taskId]) {
              const { [taskId]: _, ...restOverrides } = plan.overrides;
              newDayPlans[date] = { ...plan, overrides: restOverrides };
            }
          }
          return { taskTemplates: filteredTasks, dayPlans: newDayPlans };
        }),

      reorderTaskTemplates: (tasks) =>
        set(() => ({
          taskTemplates: tasks.map((task, index) => ({ ...task, order: index })),
        })),

      addRoutineSlot: (slot) =>
        set((state) => ({
          routineSlots: [...state.routineSlots, slot],
        })),

      updateRoutineSlot: (updatedSlot) =>
        set((state) => ({
          routineSlots: state.routineSlots.map((s) =>
            s.id === updatedSlot.id ? updatedSlot : s
          ),
        })),

      deleteRoutineSlot: (slotId) =>
        set((state) => ({
          routineSlots: state.routineSlots.filter((s) => s.id !== slotId),
        })),

      duplicateRoutineSlot: (slotId) =>
        set((state) => {
          const index = state.routineSlots.findIndex((s) => s.id === slotId);
          if (index === -1) return state;
          const target = state.routineSlots[index];
          const newSlot: RoutineSlot = {
            ...target,
            id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: `${target.title} (Copy)`,
          };
          const updated = [...state.routineSlots];
          updated.splice(index + 1, 0, newSlot);
          return { routineSlots: updated };
        }),

      toggleSlotNotification: (slotId) =>
        set((state) => ({
          routineSlots: state.routineSlots.map((s) =>
            s.id === slotId
              ? {
                  ...s,
                  notificationEnabled: s.notificationEnabled === false ? true : false,
                }
              : s
          ),
        })),

      copyWeekdayToWeekend: () =>
        set((state) => {
          const weekdaySlots = state.routineSlots.filter((s) => s.dayType === 'weekday');
          const newWeekendSlots: RoutineSlot[] = weekdaySlots.map((s) => ({
            ...s,
            id: `slot-we-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            dayType: 'weekend',
          }));
          const nonWeekendSlots = state.routineSlots.filter((s) => s.dayType !== 'weekend');
          return { routineSlots: [...nonWeekendSlots, ...newWeekendSlots] };
        }),

      reorderRoutineSlots: (dayType, newSlots) =>
        set((state) => {
          const otherSlots = state.routineSlots.filter((s) => s.dayType !== dayType);
          return { routineSlots: [...otherSlots, ...newSlots] };
        }),

      setRoutineSlots: (slots) =>
        set(() => ({
          routineSlots: slots,
        })),

      addSubject: (subject, syncTrackerFocus = false) =>
        set((state) => {
          let updatedDayPlans = state.dayPlans;
          if (syncTrackerFocus) {
            updatedDayPlans = { ...state.dayPlans };
            const dates = generateDateRange(subject.startDate, subject.endDate);
            for (const d of dates) {
              if (updatedDayPlans[d]) {
                const plan = updatedDayPlans[d];
                updatedDayPlans[d] = {
                  ...plan,
                  focusSubjectId: subject.id,
                  overrides: {
                    ...plan.overrides,
                    'task-study-1': {
                      ...plan.overrides['task-study-1'],
                      hintLabel: `Study · ${subject.name}`,
                      done: plan.overrides['task-study-1']?.done ?? false,
                    },
                    'task-study-2': {
                      ...plan.overrides['task-study-2'],
                      hintLabel: `Practice · ${subject.name}`,
                      done: plan.overrides['task-study-2']?.done ?? false,
                    },
                  },
                };
              }
            }
          }
          return {
            subjects: [...state.subjects, subject],
            dayPlans: updatedDayPlans,
          };
        }),

      updateSubject: (updatedSubject, syncTrackerFocus = false) =>
        set((state) => {
          let updatedDayPlans = state.dayPlans;
          if (syncTrackerFocus) {
            updatedDayPlans = { ...state.dayPlans };
            const dates = generateDateRange(updatedSubject.startDate, updatedSubject.endDate);
            for (const d of dates) {
              if (updatedDayPlans[d]) {
                const plan = updatedDayPlans[d];
                updatedDayPlans[d] = {
                  ...plan,
                  focusSubjectId: updatedSubject.id,
                  overrides: {
                    ...plan.overrides,
                    'task-study-1': {
                      ...plan.overrides['task-study-1'],
                      hintLabel: `Study · ${updatedSubject.name}`,
                      done: plan.overrides['task-study-1']?.done ?? false,
                    },
                    'task-study-2': {
                      ...plan.overrides['task-study-2'],
                      hintLabel: `Practice · ${updatedSubject.name}`,
                      done: plan.overrides['task-study-2']?.done ?? false,
                    },
                  },
                };
              }
            }
          }
          return {
            subjects: state.subjects.map((s) => (s.id === updatedSubject.id ? updatedSubject : s)),
            dayPlans: updatedDayPlans,
          };
        }),

      deleteSubject: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== subjectId),
          topics: state.topics.filter((t) => t.subjectId !== subjectId),
        })),

      addTopic: (topic) =>
        set((state) => ({
          topics: [...state.topics, topic],
        })),

      bulkAddTopics: (_subjectId, newTopics) =>
        set((state) => ({
          topics: [...state.topics, ...newTopics],
        })),

      updateTopic: (updatedTopic) =>
        set((state) => ({
          topics: state.topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t)),
        })),

      deleteTopic: (topicId) =>
        set((state) => ({
          topics: state.topics.filter((t) => t.id !== topicId),
        })),

      reorderTopics: (subjectId, reorderedForSubject) =>
        set((state) => {
          const otherTopics = state.topics.filter((t) => t.subjectId !== subjectId);
          return {
            topics: [...otherTopics, ...reorderedForSubject],
          };
        }),

      toggleTopicField: (topicId, field) =>
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === topicId ? { ...topic, [field]: !topic[field] } : topic
          ),
        })),

      replanSubject: (
        subjectId,
        newStartDate,
        newEndDate,
        newPlannedVideoHours,
        redistributeTopics = true,
        cascadeSubsequent = false
      ) =>
        set((state) => {
          const targetSubjectIndex = state.subjects.findIndex((s) => s.id === subjectId);
          if (targetSubjectIndex === -1) return state;

          const targetSubject = state.subjects[targetSubjectIndex];
          const newVideoHours =
            newPlannedVideoHours !== undefined
              ? Math.max(0, newPlannedVideoHours)
              : targetSubject.plannedVideoHours;

          let updatedSubjects = [...state.subjects];
          let updatedTopics = [...state.topics];
          const updatedDayPlans = { ...state.dayPlans };

          // 1. Update the target subject
          updatedSubjects[targetSubjectIndex] = {
            ...targetSubject,
            startDate: newStartDate,
            endDate: newEndDate,
            plannedVideoHours: newVideoHours,
          };

          // 2. Cascade subsequent subjects if requested
          if (cascadeSubsequent) {
            let previousEnd = newEndDate;
            for (let i = targetSubjectIndex + 1; i < updatedSubjects.length; i++) {
              const sub = updatedSubjects[i];
              const oldDates = generateDateRange(sub.startDate, sub.endDate);
              const duration = Math.max(1, oldDates.length);

              const nextStart = format(addDays(parseISO(previousEnd), 1), 'yyyy-MM-dd');
              const nextEnd = format(addDays(parseISO(nextStart), duration - 1), 'yyyy-MM-dd');

              updatedSubjects[i] = {
                ...sub,
                startDate: nextStart,
                endDate: nextEnd,
              };

              previousEnd = nextEnd;
            }
          }

          // 3. Redistribute topics across new date ranges if requested
          if (redistributeTopics) {
            const subjectsToRedistribute = cascadeSubsequent
              ? updatedSubjects.slice(targetSubjectIndex)
              : [updatedSubjects[targetSubjectIndex]];

            for (const sub of subjectsToRedistribute) {
              const subTopics = updatedTopics.filter((t) => t.subjectId === sub.id);
              if (subTopics.length > 0) {
                const availDates = generateDateRange(sub.startDate, sub.endDate);
                const dateCount = availDates.length;

                const redistributed = subTopics.map((topic, idx) => {
                  let targetDate = sub.startDate;
                  if (dateCount > 0) {
                    const step = (dateCount - 1) / Math.max(1, subTopics.length - 1);
                    const dateIdx = Math.min(dateCount - 1, Math.round(idx * step));
                    targetDate = availDates[dateIdx];
                  }
                  return {
                    ...topic,
                    targetDate,
                  };
                });

                updatedTopics = updatedTopics.map((t) => {
                  const found = redistributed.find((r) => r.id === t.id);
                  return found || t;
                });
              }
            }
          }

          // 4. Update DayPlans focusSubjectId and study hints
          const subjectsToSync = cascadeSubsequent
            ? updatedSubjects.slice(targetSubjectIndex)
            : [updatedSubjects[targetSubjectIndex]];

          for (const sub of subjectsToSync) {
            const dates = generateDateRange(sub.startDate, sub.endDate);
            for (const d of dates) {
              const currentPlan = updatedDayPlans[d] ?? {
                date: d,
                focusSubjectId: sub.id,
                overrides: {},
              };
              updatedDayPlans[d] = {
                ...currentPlan,
                focusSubjectId: sub.id,
                overrides: {
                  ...currentPlan.overrides,
                  'task-study-1': {
                    ...currentPlan.overrides['task-study-1'],
                    hintLabel: `Study · ${sub.name}`,
                    done: currentPlan.overrides['task-study-1']?.done ?? false,
                  },
                  'task-study-2': {
                    ...currentPlan.overrides['task-study-2'],
                    hintLabel: `Practice · ${sub.name}`,
                    done: currentPlan.overrides['task-study-2']?.done ?? false,
                  },
                },
              };
            }
          }

          return {
            subjects: updatedSubjects,
            topics: updatedTopics,
            dayPlans: updatedDayPlans,
          };
        }),

      addMilestone: (milestone) =>
        set((state) => ({
          milestones: [...state.milestones, milestone],
        })),

      updateMilestone: (updatedMilestone) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === updatedMilestone.id ? updatedMilestone : m
          ),
        })),

      deleteMilestone: (milestoneId) =>
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== milestoneId),
        })),

      addAssignment: (assignment) =>
        set((state) => ({
          assignments: [...state.assignments, assignment],
        })),

      updateAssignment: (updatedAssignment) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === updatedAssignment.id ? updatedAssignment : a
          ),
        })),

      deleteAssignment: (assignmentId) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== assignmentId),
        })),

      addOrUpdateResearchEntry: (entry) =>
        set((state) => {
          const index = state.researchEntries.findIndex((e) => e.id === entry.id || e.date === entry.date);
          if (index >= 0) {
            const updated = [...state.researchEntries];
            updated[index] = entry;
            return { researchEntries: updated };
          }
          return { researchEntries: [...state.researchEntries, entry] };
        }),

      deleteResearchEntry: (entryId) =>
        set((state) => ({
          researchEntries: state.researchEntries.filter((e) => e.id !== entryId),
        })),

      addSavedView: (view) =>
        set((state) => ({
          savedViews: [...state.savedViews, view],
        })),

      updateSavedView: (updatedView) =>
        set((state) => ({
          savedViews: state.savedViews.map((v) =>
            v.id === updatedView.id ? updatedView : v
          ),
        })),

      deleteSavedView: (viewId) =>
        set((state) => ({
          savedViews: state.savedViews.filter((v) => v.id !== viewId),
        })),

      resetToSeedData: () =>
        set(() => ({
          ...createInitialPlannerData(),
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        })),

      clearAllData: () =>
        set(() => ({
          schemaVersion: 1,
          settings: {
            startDate: '2026-10-04',
            endDate: '2026-10-30',
            theme: 'dark',
            studyHoursWeekday: 2,
            studyHoursWeekend: 8,
            researchHoursPerSession: 2,
            strongDayThreshold: 80,
            weekStartsOn: 1,
          },
          categories: [],
          taskTemplates: [],
          routineSlots: [],
          subjects: [],
          topics: [],
          dayPlans: {},
          milestones: [],
          assignments: [],
          researchEntries: [],
          savedViews: [],
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        })),

      importData: (importedData) =>
        set(() => ({
          ...importedData,
          schemaVersion: 1,
          undoStack: [],
          redoStack: [],
          canUndo: false,
          canRedo: false,
        })),

      undo: () =>
        set((state) => {
          if (!state.undoStack || state.undoStack.length === 0) return state;
          const currentSnapshot = takeSnapshot(state);
          const previousSnapshot = state.undoStack[state.undoStack.length - 1];
          const newUndoStack = state.undoStack.slice(0, -1);
          const newRedoStack = [...(state.redoStack || []), currentSnapshot];
          return {
            ...previousSnapshot,
            undoStack: newUndoStack,
            redoStack: newRedoStack,
            canUndo: newUndoStack.length > 0,
            canRedo: true,
          };
        }),

      redo: () =>
        set((state) => {
          if (!state.redoStack || state.redoStack.length === 0) return state;
          const currentSnapshot = takeSnapshot(state);
          const nextSnapshot = state.redoStack[state.redoStack.length - 1];
          const newRedoStack = state.redoStack.slice(0, -1);
          const newUndoStack = [...(state.undoStack || []), currentSnapshot];
          return {
            ...nextSnapshot,
            undoStack: newUndoStack,
            redoStack: newRedoStack,
            canUndo: true,
            canRedo: newRedoStack.length > 0,
          };
        }),
    }),
    {
      name: 'studyflow-planner-storage',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => {
        const { undoStack: _u, redoStack: _r, canUndo: _cu, canRedo: _cr, ...persisted } = state;
        return persisted;
      },
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          return persistedState as PlannerStoreState;
        }
        return persistedState as PlannerStoreState;
      },
    }
  )
);
