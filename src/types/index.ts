export type ThemeMode = 'light' | 'dark' | 'system';

export type DayType = 'weekday' | 'weekend';

export type TaskCellStatus = 'pending' | 'done' | 'missed';

export type Priority = 'High' | 'Medium' | 'Low';

export type MilestoneStatus = 'not-started' | 'in-progress' | 'completed';

export type AssignmentStatus = 'todo' | 'in-progress' | 'done';

export interface Settings {
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string; // ISO date YYYY-MM-DD
  theme: ThemeMode;
  studyHoursWeekday: number; // default 2
  studyHoursWeekend: number; // default 8
  researchHoursPerSession: number; // default 2
  strongDayThreshold: number; // default 80 (represents 80%)
  weekStartsOn: 0 | 1; // 0 for Sunday, 1 for Monday (default 1)
  notificationsEnabled?: boolean; // Global routine notifications toggle
  soundEnabled?: boolean; // Audio chime toggle
}

export interface Category {
  id: string;
  name: string;
  colour: string; // Hex or CSS color string
}

export interface TaskTemplate {
  id: string;
  name: string;
  categoryId: string;
  colour?: string; // Optional custom color override (defaults to category color)
  order: number;
  active: boolean;
  isStudy?: boolean;
  isResearch?: boolean;
}

export interface RoutineSlot {
  id: string;
  dayType: DayType;
  startTime: string; // 'HH:mm' 24-hr format
  endTime: string; // 'HH:mm' 24-hr format
  title: string;
  categoryId: string;
  linkedTaskTemplateId?: string;
  notes?: string;
  notificationEnabled?: boolean; // User can turn notification on or off for this slot
}

export interface Subject {
  id: string;
  name: string;
  colour: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  plannedVideoHours: number;
  testDescription?: string;
  notes?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  isTest: boolean; // if true, video and code ticks are skipped; only written/test tick counts
  video: boolean;
  code: boolean;
  written: boolean;
}

export interface TaskDayOverride {
  hintLabel?: string;
  done: boolean;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  focusSubjectId?: string;
  overrides: Record<string, TaskDayOverride>; // key: taskTemplateId
}

export interface Milestone {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: MilestoneStatus;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  deadline: string; // YYYY-MM-DD
  priority: Priority;
  status: AssignmentStatus;
}

export interface ResearchEntry {
  id: string;
  date: string; // YYYY-MM-DD
  topic: string;
  notes: string;
  hours: number;
}

export interface SavedView {
  id: string;
  name: string;
  filters: {
    startDate?: string;
    endDate?: string;
    subjectId?: string;
    categoryId?: string;
    status?: string;
    priority?: string;
    searchQuery?: string;
  };
}

export interface PlannerData {
  schemaVersion: number;
  settings: Settings;
  categories: Category[];
  taskTemplates: TaskTemplate[];
  routineSlots: RoutineSlot[];
  subjects: Subject[];
  topics: Topic[];
  dayPlans: Record<string, DayPlan>; // keyed by date 'YYYY-MM-DD'
  milestones: Milestone[];
  assignments: Assignment[];
  researchEntries: ResearchEntry[];
  savedViews: SavedView[];
}
