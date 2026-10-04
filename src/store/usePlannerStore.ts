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
  ThemeMode,
} from '../types';
import { createInitialPlannerData } from '../data/seedData';

export interface PlannerStoreState extends PlannerData {
  // Actions
  setSettings: (settings: Partial<Settings>) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTaskDone: (date: string, taskId: string) => void;
  setTaskHint: (date: string, taskId: string, hintLabel: string) => void;
  setFocusSubject: (date: string, subjectId: string | undefined) => void;
  bulkTickDay: (date: string, done: boolean) => void;

  // Categories
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  // Tasks
  addTaskTemplate: (task: TaskTemplate) => void;
  updateTaskTemplate: (task: TaskTemplate) => void;
  deleteTaskTemplate: (taskId: string, keepHistory?: boolean) => void;
  reorderTaskTemplates: (tasks: TaskTemplate[]) => void;

  // Routine
  addRoutineSlot: (slot: RoutineSlot) => void;
  updateRoutineSlot: (slot: RoutineSlot) => void;
  deleteRoutineSlot: (slotId: string) => void;
  setRoutineSlots: (slots: RoutineSlot[]) => void;

  // Subjects & Topics
  addSubject: (subject: Subject) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;
  addTopic: (topic: Topic) => void;
  updateTopic: (topic: Topic) => void;
  deleteTopic: (topicId: string) => void;
  toggleTopicField: (topicId: string, field: 'video' | 'code' | 'written') => void;

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

  // Bulk & Maintenance
  resetToSeedData: () => void;
  clearAllData: () => void;
  importData: (data: PlannerData) => void;
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

export const usePlannerStore = create<PlannerStoreState>()(
  persist(
    (set) => ({
      ...createInitialPlannerData(),

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),

      toggleTaskDone: (date, taskId) =>
        set((state) => {
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
            dayPlans: updatedDayPlans,
            researchEntries: updatedResearchEntries,
          };
        }),

      setTaskHint: (date, taskId, hintLabel) =>
        set((state) => {
          const currentPlan = state.dayPlans[date] ?? { date, overrides: {} };
          const currentOverride = currentPlan.overrides[taskId] ?? { done: false };

          return {
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
          const currentPlan = state.dayPlans[date] ?? { date, overrides: {} };
          return {
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
            dayPlans: {
              ...state.dayPlans,
              [date]: {
                ...currentPlan,
                overrides: newOverrides,
              },
            },
          };
        }),

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

      addTaskTemplate: (task) =>
        set((state) => ({
          taskTemplates: [...state.taskTemplates, task],
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

      setRoutineSlots: (slots) =>
        set(() => ({
          routineSlots: slots,
        })),

      addSubject: (subject) =>
        set((state) => ({
          subjects: [...state.subjects, subject],
        })),

      updateSubject: (updatedSubject) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === updatedSubject.id ? updatedSubject : s
          ),
        })),

      deleteSubject: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== subjectId),
          topics: state.topics.filter((t) => t.subjectId !== subjectId),
        })),

      addTopic: (topic) =>
        set((state) => ({
          topics: [...state.topics, topic],
        })),

      updateTopic: (updatedTopic) =>
        set((state) => ({
          topics: state.topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t)),
        })),

      deleteTopic: (topicId) =>
        set((state) => ({
          topics: state.topics.filter((t) => t.id !== topicId),
        })),

      toggleTopicField: (topicId, field) =>
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === topicId ? { ...topic, [field]: !topic[field] } : topic
          ),
        })),

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

      resetToSeedData: () =>
        set(() => createInitialPlannerData()),

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
        })),

      importData: (importedData) =>
        set(() => ({
          ...importedData,
          schemaVersion: 1,
        })),
    }),
    {
      name: 'studyflow-planner-storage',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          return persistedState as PlannerStoreState;
        }
        return persistedState as PlannerStoreState;
      },
    }
  )
);
