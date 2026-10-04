import {
  CalendarDays,
  Clock,
  ListTodo,
  BookOpen,
  GraduationCap,
  FolderKanban,
  FlaskConical,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  group: 'tracker' | 'academic' | 'insights';
}

export const NAV_ITEMS: NavItem[] = [
  // Primary tracking
  {
    id: 'tracker',
    label: 'Daily Tracker',
    path: '/',
    icon: CalendarDays,
    group: 'tracker',
  },
  {
    id: 'routine',
    label: 'Routine Editor',
    path: '/routine',
    icon: Clock,
    badge: 'M2',
    group: 'tracker',
  },
  {
    id: 'tasks',
    label: 'Task Manager',
    path: '/tasks',
    icon: ListTodo,
    badge: 'M3',
    group: 'tracker',
  },

  // Academic & Projects
  {
    id: 'subjects',
    label: 'Subjects & Topics',
    path: '/subjects',
    icon: BookOpen,
    badge: 'M5',
    group: 'academic',
  },
  {
    id: 'study-plan',
    label: 'Study Plan',
    path: '/study-plan',
    icon: GraduationCap,
    badge: 'M6',
    group: 'academic',
  },
  {
    id: 'projects',
    label: 'Projects & Milestones',
    path: '/projects',
    icon: FolderKanban,
    badge: 'M7',
    group: 'academic',
  },
  {
    id: 'research',
    label: 'Research Log',
    path: '/research',
    icon: FlaskConical,
    badge: 'M8',
    group: 'academic',
  },

  // Insights & Config
  {
    id: 'dashboard',
    label: 'Dashboard & Charts',
    path: '/dashboard',
    icon: BarChart3,
    badge: 'M9',
    group: 'insights',
  },
  {
    id: 'settings',
    label: 'Settings & Data',
    path: '/settings',
    icon: Settings,
    badge: 'M11',
    group: 'insights',
  },
];
