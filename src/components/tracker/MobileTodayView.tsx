import React, { useRef } from 'react';
import { TaskTemplate, Subject, Category, RoutineSlot, DayPlan } from '../../types';
import { formatDisplayDate, getDayType, isTodayDate } from '../../utils/dateUtils';
import { calculateDayMetrics } from '../../utils/calculations';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  GraduationCap,
  FlaskConical,
  Edit2,
} from 'lucide-react';

interface MobileTodayViewProps {
  currentDate: string;
  todayStr: string;
  dates: string[];
  tasks: TaskTemplate[];
  categories: Category[];
  subjects: Subject[];
  routineSlots: RoutineSlot[];
  dayPlan?: DayPlan;
  studyHoursWeekday: number;
  studyHoursWeekend: number;
  onDateChange: (newDate: string) => void;
  onToggleTask: (date: string, taskId: string) => void;
  onEditHint: (date: string, taskId: string, taskName: string, currentHint: string) => void;
}

export const MobileTodayView: React.FC<MobileTodayViewProps> = ({
  currentDate,
  todayStr,
  dates,
  tasks,
  categories,
  subjects,
  routineSlots,
  dayPlan,
  studyHoursWeekday,
  studyHoursWeekend,
  onDateChange,
  onToggleTask,
  onEditHint,
}) => {
  const touchStartXRef = useRef<number | null>(null);

  const currentIndex = dates.indexOf(currentDate);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < dates.length - 1;

  const isToday = isTodayDate(currentDate, todayStr);
  const dayType = getDayType(currentDate);
  const focusSubject = subjects.find((s) => s.id === dayPlan?.focusSubjectId);

  // Filter slots for this dayType
  const relevantRoutineSlots = routineSlots.filter((s) => s.dayType === dayType);

  const metrics = calculateDayMetrics(
    currentDate,
    tasks,
    dayPlan,
    todayStr,
    studyHoursWeekday,
    studyHoursWeekend
  );

  const handlePrev = () => {
    if (canGoPrev) onDateChange(dates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoNext) onDateChange(dates[currentIndex + 1]);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;

    // Swipe left = Next day
    if (diff > 50 && canGoNext) {
      handleNext();
    }
    // Swipe right = Prev day
    else if (diff < -50 && canGoPrev) {
      handlePrev();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="space-y-4 select-none"
    >
      {/* Date Switcher Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm">
        <button
          onClick={handlePrev}
          disabled={!canGoPrev}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {formatDisplayDate(currentDate)}
            </span>
            {isToday && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-white shadow-sm">
                Today
              </span>
            )}
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {dayType === 'weekend' ? 'Weekend' : 'Weekday'}
            </span>
          </div>

          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              className="text-[11px] font-semibold text-emerald-500 hover:underline mt-0.5"
            >
              Jump to Today
            </button>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Overview Summary Card */}
      <div className="p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Focus Subject:
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: focusSubject?.colour ? `${focusSubject.colour}20` : '#6366f120',
                color: focusSubject?.colour ?? '#6366f1',
              }}
            >
              {focusSubject?.name ?? 'General'}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-xs text-slate-900 dark:text-white">
            <span>{metrics.completionPercentage}%</span>
            {metrics.isStrong && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${metrics.completionPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {metrics.doneCount} / {metrics.totalTasks} Tasks Done
          </span>
          <span className="font-mono">
            Study: <span className="font-semibold text-emerald-500">{metrics.studyHoursDone}h</span>{' '}
            / {metrics.studyHoursPlanned}h
          </span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 italic text-center">
        Tip: Swipe left or right to change days
      </div>

      {/* Vertical Task Checklist with Routine Times */}
      <div className="space-y-2.5">
        {tasks.map((task) => {
          const override = dayPlan?.overrides[task.id];
          const isDone = override?.done ?? false;
          const hintLabel = override?.hintLabel;
          const category = categories.find((c) => c.id === task.categoryId);
          const displayColor = task.colour || category?.colour || '#94a3b8';

          // Find matching routine slot to show timetable time
          const linkedSlot = relevantRoutineSlots.find(
            (s) =>
              s.linkedTaskTemplateId === task.id ||
              s.title.toLowerCase().includes(task.name.toLowerCase())
          );

          return (
            <div
              key={task.id}
              onClick={() => onToggleTask(currentDate, task.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isDone && <CheckCircle2 className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.name}
                    </span>
                    {task.isStudy && (
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                    {task.isResearch && (
                      <FlaskConical className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    )}
                  </div>

                  {/* Hint label */}
                  {hintLabel && (
                    <div className="text-xs italic text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      · {hintLabel}
                    </div>
                  )}

                  {/* Routine Time & Category */}
                  <div className="flex items-center gap-2 mt-1">
                    {linkedSlot && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {linkedSlot.startTime} - {linkedSlot.endTime}
                      </span>
                    )}
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: displayColor }}
                    />
                    <span className="text-[11px] text-slate-400 truncate">{category?.name}</span>
                  </div>
                </div>
              </div>

              {/* Edit Hint Icon Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditHint(currentDate, task.id, task.name, hintLabel || task.name);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Edit hint label"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
