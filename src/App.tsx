import React, { useEffect } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { getTodayDateString, getDayType, formatDisplayDate } from './utils/dateUtils';
import { calculateDayMetrics } from './utils/calculations';
import {
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  ListTodo,
  Layers,
  Sparkles,
  Sun,
  Moon,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    settings,
    categories,
    taskTemplates,
    subjects,
    topics,
    routineSlots,
    dayPlans,
    milestones,
    setTheme,
    toggleTaskDone,
    resetToSeedData,
  } = usePlannerStore();

  const todayStr = getTodayDateString();
  const dayType = getDayType(todayStr);
  const todayPlan = dayPlans[todayStr];

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const todayMetrics = calculateDayMetrics(
    todayStr,
    taskTemplates.filter((t) => t.active),
    todayPlan,
    todayStr,
    settings.studyHoursWeekday,
    settings.studyHoursWeekend
  );

  const toggleTheme = () => {
    setTheme(settings.theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  StudyFlow Planner
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Module 0 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Foundation & Store Architecture (React 18 + Zustand + Tailwind)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
            <button
              onClick={resetToSeedData}
              title="Reset to fresh seed data"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Seed</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Foundation Status Banner */}
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                Module 0 Foundation Loaded Successfully
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Core data model, normalized schema, Zustand localStorage persistence, and test-verified calculation engine are active.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-200/60 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Today: {formatDisplayDate(todayStr)}</span>
            <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
              {dayType}
            </span>
          </div>
        </div>

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Date Range</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {Object.keys(dayPlans).length} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">4 Oct - 30 Oct</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Tasks</span>
              <ListTodo className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {taskTemplates.length} <span className="text-xs font-normal text-slate-500">items</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">Ordered & typed</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Routine Slots</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {routineSlots.length} <span className="text-xs font-normal text-slate-500">slots</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">Weekday & weekend</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Subjects</span>
              <BookOpen className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {subjects.length} <span className="text-xs font-normal text-slate-500">subjects</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">Schedules aligned</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Topics</span>
              <Layers className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {topics.length} <span className="text-xs font-normal text-slate-500">topics</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">Tests weighted</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Milestones</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {milestones.length} <span className="text-xs font-normal text-slate-500">goals</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-1">Planned phases</p>
          </div>
        </div>

        {/* Interactive Foundation Verification Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Live Task Checklist Test */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Today's Task State & Persistence Test
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any task to toggle state. Changes mutate the Zustand store and persist to localStorage instantly.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-500">
                  {todayMetrics.completionPercentage}% Done
                </span>
                <p className="text-[11px] text-slate-400">
                  {todayMetrics.doneCount} / {todayMetrics.totalTasks} Tasks
                </p>
              </div>
            </div>

            {/* Task list for today */}
            <div className="space-y-2">
              {taskTemplates.map((task) => {
                const isDone = todayPlan?.overrides[task.id]?.done ?? false;
                const hint = todayPlan?.overrides[task.id]?.hintLabel;
                const category = categories.find((c) => c.id === task.categoryId);

                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTaskDone(todayStr, task.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isDone
                        ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.name}
                          </span>
                          {hint && (
                            <span className="text-xs italic text-slate-400 dark:text-slate-500">
                              · {hint}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: category?.colour ?? '#94a3b8' }}
                          />
                          <span className="text-[11px] text-slate-400">{category?.name}</span>
                          {task.isStudy && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              Study Block
                            </span>
                          )}
                          {task.isResearch && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Research Block
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isDone
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isDone ? 'Done' : 'Pending'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Calculation Engine Summary */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Engine Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live formula outputs calculated for today ({todayStr}):
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                  <span>Day Completion</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {todayMetrics.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${todayMetrics.completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Strong Day Status (&ge; {settings.strongDayThreshold}%)</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-full ${
                    todayMetrics.isStrong
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  {todayMetrics.isStrong ? 'Strong Day' : 'Building Up'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Planned Study Hours</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {todayMetrics.studyHoursPlanned} hrs ({dayType})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Completed Study Hours</span>
                <span className="font-mono font-semibold text-emerald-500">
                  {todayMetrics.studyHoursDone} / {todayMetrics.studyHoursPlanned} hrs
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Active Focus Subject</span>
                <span className="font-semibold text-indigo-400">
                  {subjects.find((s) => s.id === todayPlan?.focusSubjectId)?.name ?? 'None'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              All state transitions are persisted synchronously to <code className="text-emerald-400">localStorage['studyflow-planner-storage']</code> with version 1 schema validation.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
