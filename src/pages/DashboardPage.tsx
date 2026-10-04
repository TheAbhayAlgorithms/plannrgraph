import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import {
  generateDateRange,
  formatDisplayDate,
  getTodayDateString,
} from '../utils/dateUtils';
import {
  calculateDashboardKPIs,
  calculateTodayVsYesterday,
  calculateDayMetrics,
  calculatePerTaskTotals,
  calculateTopicProgress,
} from '../utils/calculations';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    taskTemplates,
    dayPlans,
    researchEntries,
    subjects,
    topics,
    settings,
  } = usePlannerStore();

  const todayStr = getTodayDateString();
  const activeTasks = useMemo(() => taskTemplates.filter((t) => t.active), [taskTemplates]);

  // Date Range Selection State
  const [rangePreset, setRangePreset] = useState<'all' | 'past-today' | 'this-week' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState(settings.startDate);
  const [customEndDate, setCustomEndDate] = useState(settings.endDate);

  // Compute active dates based on range selection
  const selectedDates = useMemo(() => {
    let start = settings.startDate;
    let end = settings.endDate;

    if (rangePreset === 'past-today') {
      start = settings.startDate;
      end = todayStr > settings.endDate ? settings.endDate : todayStr;
    } else if (rangePreset === 'this-week') {
      // Find start and end of this week (Mon-Sun) within schedule
      const allDates = generateDateRange(settings.startDate, settings.endDate);
      const todayIdx = allDates.indexOf(todayStr);
      if (todayIdx !== -1) {
        const startIdx = Math.max(0, todayIdx - 3);
        const endIdx = Math.min(allDates.length - 1, todayIdx + 3);
        start = allDates[startIdx];
        end = allDates[endIdx];
      }
    } else if (rangePreset === 'custom') {
      start = customStartDate;
      end = customEndDate;
    }

    if (start > end) return [];
    return generateDateRange(start, end);
  }, [rangePreset, customStartDate, customEndDate, settings.startDate, settings.endDate, todayStr]);

  // Overall dates for full plan KPIs
  const allPlanDates = useMemo(() => {
    return generateDateRange(settings.startDate, settings.endDate);
  }, [settings.startDate, settings.endDate]);

  // Top Full-Schedule KPIs (matches Tracker totals)
  const fullKPIs = useMemo(() => {
    return calculateDashboardKPIs(
      allPlanDates,
      activeTasks,
      dayPlans,
      researchEntries,
      topics,
      todayStr,
      settings.startDate,
      settings.studyHoursWeekday,
      settings.studyHoursWeekend,
    );
  }, [
    allPlanDates,
    activeTasks,
    dayPlans,
    researchEntries,
    topics,
    todayStr,
    settings.startDate,
    settings.studyHoursWeekday,
    settings.studyHoursWeekend,
  ]);

  // Today vs Yesterday Comparison
  const todayVsYesterday = useMemo(() => {
    return calculateTodayVsYesterday(
      activeTasks,
      dayPlans,
      todayStr,
      settings.studyHoursWeekday,
      settings.studyHoursWeekend
    );
  }, [activeTasks, dayPlans, todayStr, settings.studyHoursWeekday, settings.studyHoursWeekend]);

  // Chart 1: Daily Completion % Data
  const dailyCompletionData = useMemo(() => {
    return selectedDates.map((d) => {
      const metrics = calculateDayMetrics(
        d,
        activeTasks,
        dayPlans[d],
        todayStr,
        settings.studyHoursWeekday,
        settings.studyHoursWeekend
      );
      return {
        date: formatDisplayDate(d),
        rawDate: d,
        completion: metrics.completionPercentage,
        isStrong: metrics.isStrong,
      };
    });
  }, [selectedDates, activeTasks, dayPlans, todayStr, settings.studyHoursWeekday, settings.studyHoursWeekend]);

  // Chart 2: Stacked Done vs Missed vs Pending per Day Data
  const stackedDayData = useMemo(() => {
    return selectedDates.map((d) => {
      const metrics = calculateDayMetrics(
        d,
        activeTasks,
        dayPlans[d],
        todayStr,
        settings.studyHoursWeekday,
        settings.studyHoursWeekend
      );
      return {
        date: formatDisplayDate(d),
        done: metrics.doneCount,
        missed: metrics.missedCount,
        pending: metrics.pendingCount,
      };
    });
  }, [selectedDates, activeTasks, dayPlans, todayStr, settings.studyHoursWeekday, settings.studyHoursWeekend]);

  // Chart 3: Subject Progress (Horizontal Bars)
  const subjectProgressData = useMemo(() => {
    return subjects.map((sub) => {
      const subTopics = topics.filter((t) => t.subjectId === sub.id);
      const progress = calculateTopicProgress(subTopics);
      return {
        name: sub.name,
        progress: progress.percentage,
        ticked: progress.ticked,
        applicable: progress.applicable,
        colour: sub.colour || '#10b981',
      };
    });
  }, [subjects, topics]);

  // Chart 4: Overall Donut Data (Done, Missed, Pending)
  const donutData = useMemo(() => {
    return [
      { name: 'Done', value: fullKPIs.totalDone, color: '#10b981' },
      { name: 'Missed', value: fullKPIs.totalMissed, color: '#ef4444' },
      { name: 'Pending', value: fullKPIs.totalPending, color: '#64748b' },
    ];
  }, [fullKPIs]);

  // Chart 5: Study Hours Planned vs Done Data
  const studyHoursData = useMemo(() => {
    return selectedDates.map((d) => {
      const metrics = calculateDayMetrics(
        d,
        activeTasks,
        dayPlans[d],
        todayStr,
        settings.studyHoursWeekday,
        settings.studyHoursWeekend
      );
      return {
        date: formatDisplayDate(d),
        planned: metrics.studyHoursPlanned,
        actual: metrics.studyHoursDone,
      };
    });
  }, [selectedDates, activeTasks, dayPlans, todayStr, settings.studyHoursWeekday, settings.studyHoursWeekend]);

  // Chart 6: Task-Wise Done vs Missed Data
  const taskWiseData = useMemo(() => {
    return activeTasks.map((task) => {
      const totals = calculatePerTaskTotals(task.id, selectedDates, dayPlans, todayStr);
      return {
        name: task.name,
        done: totals.done,
        missed: totals.missed,
      };
    });
  }, [activeTasks, selectedDates, dayPlans, todayStr]);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            Dashboard & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time KPIs, completion trends, study vs research analysis, and visual Recharts graphs.
          </p>
        </div>

        {/* Date Range Selector Pill Bar */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#0c121e] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setRangePreset('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
              rangePreset === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Time
          </button>
          <button
            type="button"
            onClick={() => setRangePreset('past-today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
              rangePreset === 'past-today'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Past & Today
          </button>
          <button
            type="button"
            onClick={() => setRangePreset('this-week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
              rangePreset === 'this-week'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Current Window
          </button>
          <button
            type="button"
            onClick={() => setRangePreset('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
              rangePreset === 'custom'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (shown when custom is selected) */}
      {rangePreset === 'custom' && (
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm text-xs">
          <span className="font-semibold text-slate-500">Filter Charts From:</span>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          />
          <span className="font-semibold text-slate-500">To:</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="font-mono px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          />
          <span className="text-slate-400 font-mono">({selectedDates.length} days selected)</span>
        </div>
      )}

      {/* 8 Full-Plan KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Days Elapsed */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Days Elapsed</span>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {fullKPIs.daysElapsed} <span className="text-xs font-normal text-slate-400">/ {fullKPIs.totalDays}</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">
            Day {fullKPIs.daysElapsed} of plan
          </span>
        </div>

        {/* 2. Tasks Done */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Tasks Done</span>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {fullKPIs.totalDone}
          </div>
          <span className="text-[10px] text-emerald-500/80 block truncate">
            Ticks completed
          </span>
        </div>

        {/* 3. Not Done (Past Days) */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Missed Tasks</span>
          <div className="text-lg font-bold font-mono text-rose-500">
            {fullKPIs.totalMissed}
          </div>
          <span className="text-[10px] text-rose-400/80 block truncate">
            In past days
          </span>
        </div>

        {/* 4. Completion So Far */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Completion</span>
          <div className="text-lg font-bold font-mono text-blue-500">
            {fullKPIs.completionSoFar}%
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            Overall schedule
          </span>
        </div>

        {/* 5. Study Hours Done / Planned */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Study Hours</span>
          <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
            {fullKPIs.studyHoursDone}h <span className="text-xs font-normal text-slate-400">/ {fullKPIs.studyHoursPlanned}h</span>
          </div>
          <span className="text-[10px] text-purple-400/80 block truncate">
            Done vs Planned
          </span>
        </div>

        {/* 6. Research Hours */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Research Hours</span>
          <div className="text-lg font-bold font-mono text-amber-500">
            {fullKPIs.researchHours}h
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            Sessions logged
          </span>
        </div>

        {/* 7. Topics Progress */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Syllabus Topics</span>
          <div className="text-lg font-bold font-mono text-teal-500">
            {fullKPIs.topicsProgress.percentage}%
          </div>
          <span className="text-[10px] text-slate-400 block truncate">
            {fullKPIs.topicsProgress.ticked} / {fullKPIs.topicsProgress.applicable} ticks
          </span>
        </div>

        {/* 8. Strong Days */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">Strong Days</span>
          <div className="text-lg font-bold font-mono text-emerald-500">
            {fullKPIs.strongDaysCount}
          </div>
          <span className="text-[10px] text-emerald-400/80 block truncate">
            &gt;={settings.strongDayThreshold}% tasks done
          </span>
        </div>
      </div>

      {/* Today vs Yesterday Summary Widget */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Today vs. Yesterday Summary
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Comparing daily routine adherence between {formatDisplayDate(todayVsYesterday.yesterdayStr)} and {formatDisplayDate(todayVsYesterday.todayStr)}.
            </p>
          </div>

          {/* Delta Pill */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
              todayVsYesterday.percentageDelta >= 0
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              {todayVsYesterday.percentageDelta >= 0 ? (
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>
                {todayVsYesterday.percentageDelta >= 0 ? `+${todayVsYesterday.percentageDelta}%` : `${todayVsYesterday.percentageDelta}%`} vs Yesterday
              </span>
            </div>

            {todayVsYesterday.todayMetrics.isStrong && (
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5" />
                <span>Strong Day Achieved!</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Today's Completed Tasks</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {todayVsYesterday.todayMetrics.done} / {todayVsYesterday.todayMetrics.total}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {todayVsYesterday.todayMetrics.percentage}% completion
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Yesterday's Completed Tasks</span>
            <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">
              {todayVsYesterday.yesterdayMetrics.done} / {todayVsYesterday.yesterdayMetrics.total}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {todayVsYesterday.yesterdayMetrics.percentage}% completion
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Today's Study Hours</span>
            <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
              {todayVsYesterday.todayMetrics.studyHoursDone}h
            </span>
            <span className="text-[10px] text-slate-500 block">
              {todayVsYesterday.studyDelta >= 0 ? `+${todayVsYesterday.studyDelta}h` : `${todayVsYesterday.studyDelta}h`} vs yesterday
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Yesterday's Study Hours</span>
            <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">
              {todayVsYesterday.yesterdayMetrics.studyHoursDone}h
            </span>
            <span className="text-[10px] text-slate-500 block">
              recorded session
            </span>
          </div>
        </div>
      </div>

      {/* Grid of 6 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Daily Completion % */}
        <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>(1) Daily Task Completion %</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Target: 80%</span>
          </div>

          <div className="h-64 w-full">
            {dailyCompletionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyCompletionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <ReferenceLine y={settings.strongDayThreshold} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Strong (80%)', fill: '#10b981', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="completion"
                    name="Completion %"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCompletion)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No data available for selected range.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Done vs Not Done Per Day (Stacked) */}
        <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>(2) Done vs. Not Done Per Day</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Stacked Volume</span>
          </div>

          <div className="h-64 w-full">
            {stackedDayData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="done" name="Done" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="missed" name="Missed" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No data available.
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Subject Progress (Horizontal Bars) */}
        <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-500" />
              <span>(3) Subject Syllabus Progress %</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Curriculum Completion</span>
          </div>

          <div className="h-64 w-full">
            {subjectProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectProgressData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="progress" name="Progress %" radius={[0, 6, 6, 0]}>
                    {subjectProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.colour} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No subjects available.
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Overall Donut (Done / Not Done / Pending) */}
        <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>(4) Overall Status Donut Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{fullKPIs.totalDone + fullKPIs.totalMissed + fullKPIs.totalPending} total instances</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center percentage label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[62%] text-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block">
                {fullKPIs.completionSoFar}%
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Completion
              </span>
            </div>
          </div>
        </div>

        {/* Chart 5: Study Hours Planned vs Done */}
        <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>(5) Study Hours: Planned vs. Actual Done</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Hours Comparison</span>
          </div>

          <div className="h-64 w-full">
            {studyHoursData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="planned" name="Planned Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual Hours Done" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No study data available.
              </div>
            )}
          </div>
        </div>

        {/* Chart 6: Task-Wise Done vs Not Done */}
        <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-teal-500" />
              <span>(6) Habit & Task-Wise Performance</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Done vs Missed</span>
          </div>

          <div className="h-64 w-full">
            {taskWiseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskWiseData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9 }}
                    stroke="#94a3b8"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                  <Bar dataKey="done" name="Done" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missed" name="Missed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No task data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
