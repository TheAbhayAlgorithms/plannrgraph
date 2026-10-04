import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { ResearchEntry } from '../types';
import { getTodayDateString, formatDisplayDate } from '../utils/dateUtils';
import {
  calculateTotalResearchHours,
  calculateWeeklyResearchHours,
  calculateResearchStreak,
} from '../utils/calculations';
import { showToast } from '../store/useToastStore';
import {
  FlaskConical,
  Flame,
  Clock,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Sparkles,
  Award,
  TrendingUp,
  BookOpen,
  Edit2,
  Check,
} from 'lucide-react';
import { GlobalFilterBar, GlobalFilterValues } from '../components/common/GlobalFilterBar';

export const ResearchPage: React.FC = () => {
  const {
    researchEntries,
    dayPlans,
    settings,
    addOrUpdateResearchEntry,
    deleteResearchEntry,
    toggleTaskDone,
  } = usePlannerStore();

  const todayStr = getTodayDateString();

  // Filter state
  const [filters, setFilters] = useState<GlobalFilterValues>({
    searchQuery: '',
    startDate: '',
    endDate: '',
    subjectId: 'all',
    categoryId: 'all',
    status: 'all',
    priority: 'all',
  });

  // Quick Log Entry Form State
  const [entryDate, setEntryDate] = useState(todayStr);
  const [entryTopic, setEntryTopic] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryHours, setEntryHours] = useState<number>(settings.researchHoursPerSession || 2);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // Inline editing state for existing entries
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Metrics
  const totalHours = useMemo(() => calculateTotalResearchHours(researchEntries), [researchEntries]);
  const weeklyData = useMemo(
    () => calculateWeeklyResearchHours(researchEntries, todayStr, settings.weekStartsOn),
    [researchEntries, todayStr, settings.weekStartsOn]
  );
  const streak = useMemo(
    () => calculateResearchStreak(researchEntries, todayStr),
    [researchEntries, todayStr]
  );

  // Filtered and sorted entries (newest first)
  const filteredEntries = useMemo(() => {
    return researchEntries
      .filter((entry) => {
        // Query filter over topic, notes, date
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchesTopic = entry.topic.toLowerCase().includes(q);
          const matchesNotes = entry.notes.toLowerCase().includes(q);
          const matchesDate = entry.date.includes(q);
          if (!matchesTopic && !matchesNotes && !matchesDate) return false;
        }

        // Date range filter
        if (filters.startDate && entry.date < filters.startDate) {
          return false;
        }
        if (filters.endDate && entry.date > filters.endDate) {
          return false;
        }

        // Status filter (whether tracker has research done or not)
        if (filters.status !== 'all') {
          const isTrackerDone = dayPlans[entry.date]?.overrides['task-research']?.done ?? false;
          if (filters.status === 'done' && !isTrackerDone) return false;
          if ((filters.status === 'pending' || filters.status === 'todo' || filters.status === 'missed') && isTrackerDone) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [researchEntries, filters, dayPlans]);

  // Handle Save / Add Entry
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDate || !entryTopic.trim()) return;

    const existing = researchEntries.find((r) => r.date === entryDate);
    const newEntry: ResearchEntry = {
      id: existing ? existing.id : `res-${entryDate}-${Date.now()}`,
      date: entryDate,
      topic: entryTopic.trim(),
      notes: entryNotes.trim(),
      hours: Math.max(0, Number(entryHours)),
    };

    addOrUpdateResearchEntry(newEntry);

    // If tracker task-research is not done yet and hours > 0, check it
    const isTrackerDone = dayPlans[entryDate]?.overrides['task-research']?.done ?? false;
    if (!isTrackerDone && newEntry.hours > 0) {
      toggleTaskDone(entryDate, 'task-research');
    }

    setEntryTopic('');
    setEntryNotes('');
    setIsQuickLogOpen(false);
    showToast({
      type: 'success',
      title: 'Research Session Logged',
      message: `${newEntry.topic} (${newEntry.hours}h) saved for ${formatDisplayDate(newEntry.date)}.`,
    });
  };

  // Handle inline hours edit
  const handleInlineHoursChange = (entry: ResearchEntry, newHours: number) => {
    const validHours = Math.max(0, newHours);
    addOrUpdateResearchEntry({
      ...entry,
      hours: validHours,
    });
    showToast({
      type: 'info',
      title: 'Hours Updated',
      message: `${entry.topic} set to ${validHours}h.`,
      duration: 1500,
    });
  };

  // Handle inline topic edit
  const handleInlineTopicChange = (entry: ResearchEntry, newTopic: string) => {
    addOrUpdateResearchEntry({
      ...entry,
      topic: newTopic,
    });
  };

  // Handle inline notes save
  const handleSaveInlineNotes = (entry: ResearchEntry) => {
    addOrUpdateResearchEntry({
      ...entry,
      notes: tempNotes,
    });
    setEditingEntryId(null);
    showToast({
      type: 'info',
      title: 'Notes Saved',
      duration: 1500,
    });
  };

  // Toggle research tick directly from table
  const handleToggleTrackerTick = (date: string) => {
    toggleTaskDone(date, 'task-research');
    const isNowDone = !dayPlans[date]?.overrides['task-research']?.done;
    showToast({
      type: isNowDone ? 'success' : 'info',
      title: isNowDone ? 'Tracker Synced: Research Ticked' : 'Tracker Synced: Research Unticked',
      message: `${formatDisplayDate(date)} research task ${isNowDone ? 'checked' : 'cleared'}.`,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-purple-500" />
            Research Log & Hours
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Log research papers, thesis investigations, study notes, and tracked hours (auto-filled from the Daily Tracker).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickLogOpen(!isQuickLogOpen)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isQuickLogOpen ? 'Close Form' : 'Log Research Session'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Streaks, Total Hours, and Weekly Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Streak Counter */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Current Streak</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-orange-500">
              {streak.currentStreak}
            </span>
            <span className="text-xs text-slate-400 font-medium">days in a row</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-500" />
            <span>Best: {streak.longestStreak} days</span>
          </div>
        </div>

        {/* Weekly Hours */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">This Week's Hours</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-blue-500">
              {weeklyData.currentWeekHours}h
            </span>
            <span className="text-xs text-slate-400 font-medium">logged</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Target: {settings.researchHoursPerSession * 3}h / week
          </div>
        </div>

        {/* Total Research Hours */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Research Hours</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-purple-500">
              {totalHours}h
            </span>
            <span className="text-xs text-slate-400 font-medium">aggregate</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across {researchEntries.filter((r) => r.hours > 0).length} sessions
          </div>
        </div>

        {/* Tracker Auto-Fill Sync Card */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tracker Sync</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            Auto-Fill Active
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Ticking 'Research' logs {settings.researchHoursPerSession}h</span>
          </div>
        </div>
      </div>

      {/* Weekly Breakdown Rollup Bar */}
      {weeklyData.weeklyBreakdown.length > 0 && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Weekly Research Hours Rollup
            </span>
            <span className="text-xs font-mono text-slate-400">
              {weeklyData.weeklyBreakdown.length} weeks tracked
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {weeklyData.weeklyBreakdown.map((w) => (
              <div
                key={w.startDate}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-center space-y-0.5"
              >
                <div className="text-[10px] text-slate-400 truncate">{w.weekLabel}</div>
                <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                  {w.hours}h
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Log Entry Drawer / Form */}
      {isQuickLogOpen && (
        <form
          onSubmit={handleSaveEntry}
          className="p-4 sm:p-5 rounded-3xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 shadow-md space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Log Research Entry</span>
            </span>
            <button
              type="button"
              onClick={() => setIsQuickLogOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Research Topic / Paper Title
              </label>
              <input
                type="text"
                required
                value={entryTopic}
                onChange={(e) => setEntryTopic(e.target.value)}
                placeholder="e.g. Distributed Consensus & Raft leader election"
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Hours Dedicated
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={entryHours}
                onChange={(e) => setEntryHours(Number(e.target.value))}
                className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Findings & Investigation Notes
              </label>
              <input
                type="text"
                value={entryNotes}
                onChange={(e) => setEntryNotes(e.target.value)}
                placeholder="Key takeaways, paper citations, implementation thoughts..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={!entryTopic.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-sm transition"
            >
              Save Research Session
            </button>
          </div>
        </form>
      )}

      {/* Global Filter Bar */}
      <GlobalFilterBar
        onFilterChange={setFilters}
        showCategoryFilter={false}
        showPriorityFilter={false}
        placeholder="Filter research entries by topic, investigation notes, date range..."
      />

      {/* Entries Counter Header */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Research Entries & Notes
          </h2>
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredEntries.length}</span> of {researchEntries.length} entries
        </div>
      </div>

      {/* Research Entries Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 min-w-[130px]">Date</th>
                <th className="px-3 py-3 min-w-[120px] text-center">Tracker Status</th>
                <th className="px-4 py-3 min-w-[220px]">Research Topic</th>
                <th className="px-3 py-3 min-w-[100px] text-center">Hours (Editable)</th>
                <th className="px-4 py-3 min-w-[280px]">Investigation Notes</th>
                <th className="px-3 py-3 text-center min-w-[60px]">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const isTrackerDone = dayPlans[entry.date]?.overrides['task-research']?.done ?? false;
                  const isEditingNotes = editingEntryId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDisplayDate(entry.date)}</span>
                          {entry.date === todayStr && (
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tracker Tick Status (Interactive) */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTrackerTick(entry.date)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${
                            isTrackerDone
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                          title="Click to toggle Research tick in daily tracker"
                        >
                          {isTrackerDone ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                              <span>Ticked</span>
                            </>
                          ) : (
                            <span>Unticked</span>
                          )}
                        </button>
                      </td>

                      {/* Research Topic (Inline Editable) */}
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <input
                          type="text"
                          value={entry.topic}
                          onChange={(e) => handleInlineTopicChange(entry, e.target.value)}
                          className="w-full text-xs font-semibold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-purple-500 focus:outline-none px-1 py-0.5 transition"
                        />
                      </td>

                      {/* Hours Dedicated (Editable number input) */}
                      <td className="px-3 py-3 text-center font-mono">
                        <div className="inline-flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={entry.hours}
                            onChange={(e) => handleInlineHoursChange(entry, Number(e.target.value))}
                            className="w-14 text-center font-mono text-xs px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold focus:border-purple-500 focus:outline-none"
                          />
                          <span className="text-slate-400 text-xs">h</span>
                        </div>
                      </td>

                      {/* Notes (Editable Inline) */}
                      <td className="px-4 py-3">
                        {isEditingNotes ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              className="w-full text-xs px-2 py-1 rounded-lg border border-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineNotes(entry);
                                if (e.key === 'Escape') setEditingEntryId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlineNotes(entry)}
                              className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingEntryId(entry.id);
                              setTempNotes(entry.notes);
                            }}
                            className="cursor-pointer group flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
                            title="Click to edit notes"
                          >
                            <span className="truncate max-w-[280px]">
                              {entry.notes || <span className="italic text-slate-400">Click to add notes...</span>}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1" />
                          </div>
                        )}
                      </td>

                      {/* Action: Delete */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            deleteResearchEntry(entry.id);
                            showToast({
                              type: 'info',
                              title: 'Entry Removed',
                              message: `Research entry for ${formatDisplayDate(entry.date)} deleted.`,
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                          title="Delete research entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-2">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                      {filters.searchQuery ? 'No matching research entries' : 'No research sessions logged yet'}
                    </div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {filters.searchQuery
                        ? `No entries match "${filters.searchQuery}". Clear your search query to see all sessions.`
                        : `Ticking "Research" in the Daily Tracker automatically creates a session here with ${settings.researchHoursPerSession} hours, or click "Log Research Session" above.`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
