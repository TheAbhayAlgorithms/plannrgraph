import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { generateDateRange, getTodayDateString, formatDisplayDate } from '../utils/dateUtils';
import { TrackerGrid } from '../components/tracker/TrackerGrid';
import { MobileTodayView } from '../components/tracker/MobileTodayView';
import { EditHintModal } from '../components/tracker/EditHintModal';
import { ApplyRangeLabelModal } from '../components/tracker/ApplyRangeLabelModal';
import { GlobalFilterBar, GlobalFilterValues } from '../components/common/GlobalFilterBar';
import { showToast } from '../store/useToastStore';
import { triggerCelebrationConfetti } from "../utils/confettiUtils";
import {
  CalendarDays,
  Table as TableIcon,
  Smartphone,
  CalendarRange,
  Clock,
} from 'lucide-react';

export const TrackerPage: React.FC = () => {
  const {
    settings,
    taskTemplates,
    categories,
    subjects,
    routineSlots,
    dayPlans,
    toggleTaskDone,
    setTaskHint,
    setFocusSubject,
    bulkTickDay,
    applyLabelToDateRange,
    moveIncompleteToTomorrow,
  } = usePlannerStore();

  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'grid' | 'today'>('grid');

  // Modals state
  const [editingHintState, setEditingHintState] = useState<{
    date: string;
    taskId: string;
    taskName: string;
    currentHint: string;
  } | null>(null);

  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [filters, setFilters] = useState<GlobalFilterValues>({
    searchQuery: '',
    startDate: '',
    endDate: '',
    subjectId: 'all',
    categoryId: 'all',
    status: 'all',
    priority: 'all',
  });

  // All active tasks and full date range
  const allActiveTasks = useMemo(() => {
    return taskTemplates.filter((t) => t.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [taskTemplates]);

  const allDates = useMemo(() => {
    return generateDateRange(settings.startDate, settings.endDate);
  }, [settings.startDate, settings.endDate]);

  // Active task templates filtered by category and search
  const filteredTasks = useMemo(() => {
    return [...taskTemplates]
      .filter((t) => t.active)
      .filter((t) => {
        if (filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) {
          return false;
        }
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          return t.name.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [taskTemplates, filters.categoryId, filters.searchQuery]);

  // Calendar dates range filtered by date range and subject
  const filteredDates = useMemo(() => {
    const start = filters.startDate || settings.startDate;
    const end = filters.endDate || settings.endDate;
    if (start > end) return [];

    let dateList = generateDateRange(start, end);

    if (filters.subjectId !== 'all') {
      dateList = dateList.filter((d) => dayPlans[d]?.focusSubjectId === filters.subjectId);
    }

    return dateList;
  }, [filters.startDate, filters.endDate, filters.subjectId, settings.startDate, settings.endDate, dayPlans]);

  // Handlers
  const handleToggleTask = (date: string, taskId: string) => {
    toggleTaskDone(date, taskId);
    const task = taskTemplates.find((t) => t.id === taskId);
    const wasDone = dayPlans[date]?.overrides[taskId]?.done ?? false;

    // Trigger celebration when all active tasks for the day are checked
    if (!wasDone) {
      const activeTasks = taskTemplates.filter((t) => t.active);
      const nextPlan = usePlannerStore.getState().dayPlans[date];
      const isNowAllDone =
        activeTasks.length > 0 &&
        activeTasks.every((t) => nextPlan?.overrides[t.id]?.done);

      if (isNowAllDone) {
        triggerCelebrationConfetti();
        showToast({
          type: 'success',
          title: `🎉 100% Day Complete!`,
          message: `All routine targets accomplished for ${formatDisplayDate(date)}!`,
          duration: 3500,
        });
        return;
      }
    }

    showToast({
      type: wasDone ? 'info' : 'success',
      title: wasDone ? `Marked "${task?.name}" pending` : `Completed "${task?.name}"`,
      duration: 1500,
    });
  };

  const handleOpenEditHint = (
    date: string,
    taskId: string,
    taskName: string,
    currentHint: string
  ) => {
    setEditingHintState({ date, taskId, taskName, currentHint });
  };

  const handleSaveHint = (date: string, taskId: string, newHint: string) => {
    setTaskHint(date, taskId, newHint);
    showToast({
      type: 'info',
      title: 'Hint Label Updated',
      duration: 1800,
    });
  };

  const handleApplyRangeLabel = (
    taskId: string,
    label: string,
    startDate: string,
    endDate: string
  ) => {
    applyLabelToDateRange(taskId, label, startDate, endDate);
    showToast({
      type: 'success',
      title: 'Range Label Applied',
      message: `"${label}" set across dates from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}.`,
    });
  };

  const handleBulkTick = (date: string, done: boolean) => {
    bulkTickDay(date, done);
    if (done) {
      triggerCelebrationConfetti();
    }
    showToast({
      type: done ? 'success' : 'info',
      title: done ? `🎉 All tasks ticked for ${formatDisplayDate(date)}` : `All tasks reset for ${formatDisplayDate(date)}`,
      duration: 2500,
    });
  };

  const handleMoveIncomplete = (date: string) => {
    const result = moveIncompleteToTomorrow(date);
    if (!result.tomorrowDate) {
      showToast({
        type: 'warning',
        title: 'End of Plan Range',
        message: 'Cannot carry tasks forward past the plan end date.',
      });
      return;
    }
    showToast({
      type: 'info',
      title: 'Incomplete Tasks Carried Forward',
      message: `${result.movedCount} pending task(s) labeled for tomorrow (${formatDisplayDate(result.tomorrowDate)}).`,
      duration: 3500,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Controls & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-emerald-500" />
              Daily Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Check off daily habits, routine blocks, and study goals.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher: Table Grid vs Today View */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#0c121e] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Full Grid</span>
            </button>

            <button
              onClick={() => setViewMode('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'today'
                  ? 'bg-white dark:bg-[#0c121e] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Daily Checklist</span>
            </button>
          </div>

          {/* Apply Label to Range Modal Trigger */}
          <button
            onClick={() => setIsRangeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <CalendarRange className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Apply Label to Range</span>
            <span className="sm:hidden">Range Label</span>
          </button>

          {/* Jump to Today */}
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 transition active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar with URL query sync and saved views */}
      <GlobalFilterBar
        onFilterChange={setFilters}
        placeholder="Filter tasks by habit name, category, or date range..."
      />

      {/* View Rendering: Grid vs Mobile Today View */}
      {viewMode === 'grid' ? (
        <div className="space-y-3">
          <TrackerGrid
            dates={filteredDates}
            todayStr={todayStr}
            tasks={filteredTasks}
            categories={categories}
            subjects={subjects}
            dayPlans={dayPlans}
            studyHoursWeekday={settings.studyHoursWeekday}
            studyHoursWeekend={settings.studyHoursWeekend}
            onToggleTask={handleToggleTask}
            onEditHint={handleOpenEditHint}
            onFocusSubjectChange={setFocusSubject}
            onBulkTickDay={handleBulkTick}
            onMoveIncompleteToTomorrow={handleMoveIncomplete}
          />

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-2 py-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                Done (Green tick)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 inline-block" />
                Missed (Past days strictly before today)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 inline-block" />
                Pending (Today & future)
              </span>
            </div>
            <span>Use Space / Enter to toggle cell · Hover pencil to edit hint</span>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <MobileTodayView
            currentDate={selectedDate}
            todayStr={todayStr}
            dates={allDates}
            tasks={filteredTasks}
            categories={categories}
            subjects={subjects}
            routineSlots={routineSlots}
            dayPlan={dayPlans[selectedDate]}
            studyHoursWeekday={settings.studyHoursWeekday}
            studyHoursWeekend={settings.studyHoursWeekend}
            onDateChange={setSelectedDate}
            onToggleTask={handleToggleTask}
            onEditHint={handleOpenEditHint}
          />
        </div>
      )}

      {/* Modals */}
      {editingHintState && (
        <EditHintModal
          isOpen={Boolean(editingHintState)}
          date={editingHintState.date}
          taskId={editingHintState.taskId}
          taskName={editingHintState.taskName}
          currentHint={editingHintState.currentHint}
          onClose={() => setEditingHintState(null)}
          onSave={handleSaveHint}
        />
      )}

      <ApplyRangeLabelModal
        isOpen={isRangeModalOpen}
        tasks={allActiveTasks}
        defaultStartDate={settings.startDate}
        defaultEndDate={settings.endDate}
        onClose={() => setIsRangeModalOpen(false)}
        onApply={handleApplyRangeLabel}
      />
    </div>
  );
};

export default TrackerPage;
