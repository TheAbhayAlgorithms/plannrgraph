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
    label: 'Daily Routine',
    path: '/routine',
    icon: Clock,
    group: 'tracker',
  },
  {
    id: 'tasks',
    label: 'Tasks & Habits',
    path: '/tasks',
    icon: ListTodo,
    group: 'tracker',
  },

  // Academic & Projects
  {
    id: 'subjects',
    label: 'Subjects & Topics',
    path: '/subjects',
    icon: BookOpen,
    group: 'academic',
  },
  {
    id: 'study-plan',
    label: 'Study Plan',
    path: '/study-plan',
    icon: GraduationCap,
    group: 'academic',
  },
  {
    id: 'projects',
    label: 'Projects & Milestones',
    path: '/projects',
    icon: FolderKanban,
    group: 'academic',
  },
  {
    id: 'research',
    label: 'Research Log',
    path: '/research',
    icon: FlaskConical,
    group: 'academic',
  },

  // Insights & Config
  {
    id: 'dashboard',
    label: 'Dashboard & Charts',
    path: '/dashboard',
    icon: BarChart3,
    group: 'insights',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    group: 'insights',
  },
];
