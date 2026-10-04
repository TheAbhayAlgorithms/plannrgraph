import React from 'react';
import { TaskTemplate, Subject, Category, DayPlan } from '../../types';
import { TrackerCell } from './TrackerCell';
import { formatDisplayDate, getDayType, isTodayDate } from '../../utils/dateUtils';
import {
  getTaskCellStatus,
  calculateDayMetrics,
  calculatePerTaskTotals,
} from '../../utils/calculations';
import {
  CheckCheck,
  RotateCcw,
  FastForward,
  Flame,
  GraduationCap,
  FlaskConical,
  Calendar,
  ListTodo,
} from 'lucide-react';

interface TrackerGridProps {
  dates: string[];
  todayStr: string;
  tasks: TaskTemplate[];
  categories: Category[];
  subjects: Subject[];
  dayPlans: Record<string, DayPlan>;
  studyHoursWeekday: number;
  studyHoursWeekend: number;
  onToggleTask: (date: string, taskId: string) => void;
  onEditHint: (date: string, taskId: string, taskName: string, currentHint: string) => void;
  onFocusSubjectChange: (date: string, subjectId: string | undefined) => void;
  onBulkTickDay: (date: string, done: boolean) => void;
  onMoveIncompleteToTomorrow: (date: string) => void;
}

export const TrackerGrid: React.FC<TrackerGridProps> = ({
  dates,
  todayStr,
  tasks,
  categories,
  subjects,
  dayPlans,
  studyHoursWeekday,
  studyHoursWeekend,
  onToggleTask,
  onEditHint,
  onFocusSubjectChange,
  onBulkTickDay,
  onMoveIncompleteToTomorrow,
}) => {
  // Precompute per-task totals for footer
  const perTaskTotals = React.useMemo(() => {
    const map: Record<string, { done: number; missed: number }> = {};
    for (const task of tasks) {
      map[task.id] = calculatePerTaskTotals(task.id, dates, dayPlans, todayStr);
    }
    return map;
  }, [tasks, dates, dayPlans, todayStr]);

  // Overall totals across entire date range
  const overallTotals = React.useMemo(() => {
    let totalDone = 0;
    let totalMissed = 0;
    let totalStudyPlanned = 0;
    let totalStudyDone = 0;
    let totalPossibleTasks = 0;

    for (const d of dates) {
      const metrics = calculateDayMetrics(
        d,
        tasks,
        dayPlans[d],
        todayStr,
        studyHoursWeekday,
        studyHoursWeekend
      );
      totalDone += metrics.doneCount;
      totalMissed += metrics.missedCount;
      totalStudyPlanned += metrics.studyHoursPlanned;
      totalStudyDone += metrics.studyHoursDone;
      totalPossibleTasks += metrics.totalTasks;
    }

    const avgCompletion =
      totalPossibleTasks > 0 ? Math.round((totalDone / totalPossibleTasks) * 1000) / 10 : 0;

    return {
      totalDone,
      totalMissed,
      totalStudyPlanned,
      totalStudyDone,
      avgCompletion,
    };
  }, [dates, tasks, dayPlans, todayStr, studyHoursWeekday, studyHoursWeekend]);

  if (dates.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
        <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          No days match current filter criteria
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Try adjusting your date range, search query, or status filters in the toolbar above.
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e]">
        <ListTodo className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">No active tasks found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No tasks matched your category or search filter. Clear search input or activate tasks in Tasks & Habits.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-50/95 dark:bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <tr>
              {/* Sticky Date Header */}
              <th className="sticky left-0 z-30 bg-slate-50 dark:bg-[#0c121e] px-4 py-3 min-w-[130px] font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                Date
              </th>

              {/* Sticky Subject Header */}
              <th className="sticky left-[130px] z-30 bg-slate-50 dark:bg-[#0c121e] px-3 py-3 min-w-[140px] font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                Focus Subject
              </th>

              {/* Task Columns */}
              {tasks.map((task) => {
                const category = categories.find((c) => c.id === task.categoryId);
                const displayColor = task.colour || category?.colour || '#94a3b8';

                return (
                  <th
                    key={task.id}
                    className="px-3 py-2.5 min-w-[120px] font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: displayColor }}
                      />
                      <span className="truncate max-w-[90px]">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      {task.isStudy && (
                        <span className="flex items-center text-indigo-400" title="Study Task">
                          <GraduationCap className="w-3 h-3" />
                        </span>
                      )}
                      {task.isResearch && (
                        <span className="flex items-center text-purple-400" title="Research Task">
                          <FlaskConical className="w-3 h-3" />
                        </span>
                      )}
                      <span className="truncate text-slate-400">{category?.name}</span>
                    </div>
                  </th>
                );
              })}

              {/* Summary Columns */}
              <th className="px-3 py-3 min-w-[65px] text-center font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">
                Done
              </th>
              <th className="px-3 py-3 min-w-[70px] text-center font-bold text-rose-500 border-r border-slate-200 dark:border-slate-800">
                Not Done
              </th>
              <th className="px-3 py-3 min-w-[120px] font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                Completion %
              </th>
              <th className="px-3 py-3 min-w-[110px] font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                Study Hours
              </th>
              <th className="px-3 py-3 min-w-[100px] text-center font-bold text-slate-600 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {dates.map((dateStr) => {
              const isToday = isTodayDate(dateStr, todayStr);
              const dayType = getDayType(dateStr);
              const dayPlan = dayPlans[dateStr];
              const focusSubject = subjects.find((s) => s.id === dayPlan?.focusSubjectId);

              const metrics = calculateDayMetrics(
                dateStr,
                tasks,
                dayPlan,
                todayStr,
                studyHoursWeekday,
                studyHoursWeekend
              );

              return (
                <tr
                  key={dateStr}
                  className={`transition-colors ${
                    isToday
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/20 font-medium'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/50'
                  }`}
                >
                  {/* Sticky Date Column */}
                  <td
                    className={`sticky left-0 z-10 px-4 py-2.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 ${
                      isToday
                        ? 'bg-emerald-50 dark:bg-[#0c1818]'
                        : 'bg-white dark:bg-[#0c121e]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatDisplayDate(dateStr)}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-white shadow-sm">
                          Today
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {dayType === 'weekend' ? 'WE' : 'WD'}
                      </span>
                    </div>
                  </td>

                  {/* Sticky Focus Subject Column */}
                  <td
                    className={`sticky left-[130px] z-10 px-3 py-2.5 whitespace-nowrap border-r border-slate-200 dark:border-slate-800 ${
                      isToday
                        ? 'bg-emerald-50 dark:bg-[#0c1818]'
                        : 'bg-white dark:bg-[#0c121e]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <select
                        value={focusSubject?.id ?? ''}
                        onChange={(e) => onFocusSubjectChange(dateStr, e.target.value || undefined)}
                        className="text-xs font-medium px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none truncate max-w-[130px]"
                        style={{
                          borderColor: focusSubject?.colour ? `${focusSubject.colour}50` : undefined,
                          backgroundColor: focusSubject?.colour ? `${focusSubject.colour}15` : undefined,
                        }}
                      >
                        <option value="" className="dark:bg-slate-900">
                          None
                        </option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id} className="dark:bg-slate-900">
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Task Cells */}
                  {tasks.map((task) => {
                    const override = dayPlan?.overrides[task.id];
                    const isDone = override?.done ?? false;
                    const hintLabel = override?.hintLabel;
                    const status = getTaskCellStatus(isDone, dateStr, todayStr);

                    return (
                      <td key={task.id} className="p-0">
                        <TrackerCell
                          date={dateStr}
                          taskId={task.id}
                          taskName={task.name}
                          isDone={isDone}
                          hintLabel={hintLabel}
                          status={status}
                          onToggle={() => onToggleTask(dateStr, task.id)}
                          onEditHint={() =>
                            onEditHint(dateStr, task.id, task.name, hintLabel || task.name)
                          }
                        />
                      </td>
                    );
                  })}

                  {/* Done Count */}
                  <td className="px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800 font-mono">
                    {metrics.doneCount}
                  </td>

                  {/* Not Done Count (strictly past days < today) */}
                  <td className="px-3 py-2.5 text-center font-bold text-rose-500 border-r border-slate-200 dark:border-slate-800 font-mono">
                    {metrics.missedCount > 0 ? metrics.missedCount : '-'}
                  </td>

                  {/* Completion % Bar */}
                  <td className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden min-w-[50px]">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${metrics.completionPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {metrics.completionPercentage}%
                      </span>
                      {metrics.isStrong && (
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                  </td>

                  {/* Study Hours */}
                  <td className="px-3 py-2.5 font-mono text-xs border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                    <span className="font-semibold text-emerald-500">{metrics.studyHoursDone}h</span>
                    <span className="text-slate-400"> / {metrics.studyHoursPlanned}h</span>
                  </td>

                  {/* Row Actions */}
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onBulkTickDay(dateStr, true)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition"
                        title="Tick all in this day"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onBulkTickDay(dateStr, false)}
                        className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition"
                        title="Untick all in this day"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveIncompleteToTomorrow(dateStr)}
                        className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition"
                        title="Move incomplete tasks to tomorrow"
                      >
                        <FastForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Sticky Table Footer: Totals */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-100/95 dark:bg-[#090d16]/95 backdrop-blur-md border-t-2 border-slate-300 dark:border-slate-700 shadow-md font-bold">
            <tr>
              {/* Sticky Footer Date Label */}
              <td className="sticky left-0 z-30 bg-slate-100 dark:bg-[#090d16] px-4 py-3 text-slate-900 dark:text-white border-r border-slate-300 dark:border-slate-700 uppercase tracking-wider text-xs">
                Totals
              </td>

              {/* Sticky Footer Subject Empty */}
              <td className="sticky left-[130px] z-30 bg-slate-100 dark:bg-[#090d16] px-3 py-3 text-slate-400 border-r border-slate-300 dark:border-slate-700 text-center">
                —
              </td>

              {/* Per-Task Totals (Done & Missed) */}
              {tasks.map((task) => {
                const total = perTaskTotals[task.id] ?? { done: 0, missed: 0 };
                return (
                  <td
                    key={task.id}
                    className="px-2 py-2.5 text-center border-r border-slate-300 dark:border-slate-700 font-mono text-xs"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {total.done} done
                      </span>
                      <span className="text-rose-500 text-[10px]">
                        {total.missed} missed
                      </span>
                    </div>
                  </td>
                );
              })}

              {/* Overall Total Done */}
              <td className="px-3 py-3 text-center text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm border-r border-slate-300 dark:border-slate-700">
                {overallTotals.totalDone}
              </td>

              {/* Overall Total Missed */}
              <td className="px-3 py-3 text-center text-rose-500 font-mono font-bold text-sm border-r border-slate-300 dark:border-slate-700">
                {overallTotals.totalMissed}
              </td>

              {/* Average Completion % */}
              <td className="px-3 py-3 font-mono text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 text-xs">
                Avg: {overallTotals.avgCompletion}%
              </td>

              {/* Overall Study Hours Planned vs Done */}
              <td className="px-3 py-3 font-mono text-xs text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700">
                <span className="text-emerald-500">{overallTotals.totalStudyDone}h</span> /{' '}
                {overallTotals.totalStudyPlanned}h
              </td>

              {/* Footer Empty Action Cell */}
              <td className="px-2 py-3 text-center text-slate-400">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
