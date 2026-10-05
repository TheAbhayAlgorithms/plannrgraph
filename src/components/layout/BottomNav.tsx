import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  ListTodo,
  BookOpen,
  Menu,
  X,
  GraduationCap,
  FolderKanban,
  FlaskConical,
  BarChart3,
  Settings,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();

  const primaryTabs = [
    { label: 'Tracker', path: '/', icon: CalendarDays },
    { label: 'Routine', path: '/routine', icon: Clock },
    { label: 'Tasks', path: '/tasks', icon: ListTodo },
    { label: 'Subjects', path: '/subjects', icon: BookOpen },
  ];

  const moreTabs = [
    { label: 'Study Plan', path: '/study-plan', icon: GraduationCap },
    { label: 'Projects & Milestones', path: '/projects', icon: FolderKanban },
    { label: 'Research Log', path: '/research', icon: FlaskConical },
    { label: 'Dashboard & Charts', path: '/dashboard', icon: BarChart3 },
    { label: 'Settings & Data', path: '/settings', icon: Settings },
  ];

  const isMoreActive = moreTabs.some((t) => t.path === location.pathname);

  return (
    <>
      {/* Slide-up "More" Drawer for Mobile */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] p-5 pb-24 shadow-2xl space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                All Modules & Tools
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-lg px-2 flex items-center justify-around pb-safe"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-xl transition-all ${
                      isActive ? 'bg-emerald-500/15 text-emerald-500 scale-105' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="mt-0.5 leading-none">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More Tab Trigger */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          aria-label="Open all modules menu"
          aria-expanded={isMoreOpen}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
            isMoreActive || isMoreOpen
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              isMoreActive || isMoreOpen ? 'bg-emerald-500/15 text-emerald-500 scale-105' : ''
            }`}
          >
            <Menu className="w-5 h-5" />
          </div>
          <span className="mt-0.5 leading-none">More</span>
        </button>
      </nav>
    </>
  );
};
