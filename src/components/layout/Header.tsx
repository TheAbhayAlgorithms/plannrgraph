import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlannerStore } from '../../store/usePlannerStore';
import { getTodayDateString, getDayType, formatDisplayDate } from '../../utils/dateUtils';
import { calculateDayMetrics } from '../../utils/calculations';
import { showToast } from '../../store/useToastStore';
import {
  Sun,
  Moon,
  Calendar,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Undo2,
  Redo2,
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    settings,
    setTheme,
    taskTemplates,
    dayPlans,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePlannerStore();

  const todayStr = getTodayDateString();
  const dayType = getDayType(todayStr);
  const todayPlan = dayPlans[todayStr];

  // Global Keyboard shortcuts for Undo (Ctrl/Cmd+Z) and Redo (Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) {
          undo();
          showToast({ type: 'info', title: 'Undo Action', duration: 1200 });
        }
      } else if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
          showToast({ type: 'info', title: 'Redo Action', duration: 1200 });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const metrics = calculateDayMetrics(
    todayStr,
    taskTemplates.filter((t) => t.active),
    todayPlan,
    todayStr,
    settings.studyHoursWeekday,
    settings.studyHoursWeekend
  );

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast({
      type: 'info',
      title: `${nextTheme === 'dark' ? 'Dark' : 'Light'} theme applied`,
      duration: 2000,
    });
  };

  const handleGoToday = () => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    showToast({
      type: 'success',
      title: `Navigated to Today (${formatDisplayDate(todayStr)})`,
      message: `${metrics.doneCount} of ${metrics.totalTasks} tasks completed so far (${metrics.completionPercentage}%).`,
      duration: 3000,
    });
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md px-4 sm:px-6">
      <div className="h-full flex items-center justify-between gap-3">
        {/* Left: App Identity (Mobile view) or Breadcrumb info */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">plannrgraph</span>
          </div>

          {/* Today Date Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">{formatDisplayDate(todayStr)}</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {dayType}
            </span>
          </div>
        </div>

        {/* Center: Live Today Progress Tracker Chip */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Today:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {metrics.doneCount}/{metrics.totalTasks}
            </span>
          </div>
          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${metrics.completionPercentage}%` }}
            />
          </div>
          <span className="font-bold text-emerald-500">{metrics.completionPercentage}%</span>
          {metrics.isStrong && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
              <Flame className="w-3 h-3 fill-amber-500" /> Strong
            </span>
          )}
        </div>

        {/* Right: Quick Today Button, Undo/Redo & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Undo / Redo Controls */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800/80">
            <button
              onClick={() => {
                undo();
                showToast({ type: 'info', title: 'Undo Action', duration: 1200 });
              }}
              disabled={!canUndo}
              aria-label="Undo last action"
              title="Undo (Ctrl/Cmd+Z)"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                redo();
                showToast({ type: 'info', title: 'Redo Action', duration: 1200 });
              }}
              disabled={!canRedo}
              aria-label="Redo last action"
              title="Redo (Ctrl/Cmd+Y)"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Today Button */}
          <button
            onClick={handleGoToday}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
            title="Jump to Today's date"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
