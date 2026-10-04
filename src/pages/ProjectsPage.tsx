import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { Assignment, Milestone, Priority, AssignmentStatus, MilestoneStatus } from '../types';
import { getTodayDateString, formatDisplayDate, calculateDaysLeft } from '../utils/dateUtils';
import { calculateMilestoneProgress, isAssignmentOverdue } from '../utils/calculations';
import { AddMilestoneModal } from '../components/projects/AddMilestoneModal';
import { AddAssignmentModal } from '../components/projects/AddAssignmentModal';
import { GlobalFilterBar, GlobalFilterValues } from '../components/common/GlobalFilterBar';
import { showToast } from '../store/useToastStore';
import {
  FolderKanban,
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const {
    milestones,
    assignments,
    subjects,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addAssignment,
    updateAssignment,
    deleteAssignment,
  } = usePlannerStore();

  const todayStr = getTodayDateString();

  // Modals state
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);

  // Quick Add Assignment state
  const [quickSubjectId, setQuickSubjectId] = useState<string>(() => subjects[0]?.id || '');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDeadline, setQuickDeadline] = useState(todayStr);
  const [quickPriority, setQuickPriority] = useState<Priority>('High');

  // Filter & Search state
  const [filters, setFilters] = useState<GlobalFilterValues>({
    searchQuery: '',
    startDate: '',
    endDate: '',
    subjectId: 'all',
    categoryId: 'all',
    status: 'all',
    priority: 'all',
  });
  const [sortBy, setSortBy] = useState<'deadline-asc' | 'deadline-desc' | 'priority' | 'status' | 'title'>('deadline-asc');

  // Quick add assignment submission
  const handleQuickAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickSubjectId || !quickDeadline) return;

    const newAssignment: Assignment = {
      id: `ass-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId: quickSubjectId,
      title: quickTitle.trim(),
      deadline: quickDeadline,
      priority: quickPriority,
      status: 'todo',
    };

    addAssignment(newAssignment);
    setQuickTitle('');
    showToast({
      type: 'success',
      title: 'Assignment Added',
      message: `"${newAssignment.title}" was added.`,
    });
  };

  // Milestone cycle status
  const handleCycleMilestoneStatus = (milestone: Milestone) => {
    const nextStatus: Record<MilestoneStatus, MilestoneStatus> = {
      'not-started': 'in-progress',
      'in-progress': 'completed',
      'completed': 'not-started',
    };
    const updated: Milestone = {
      ...milestone,
      status: nextStatus[milestone.status],
    };
    updateMilestone(updated);
    showToast({
      type: 'info',
      title: 'Milestone Updated',
      message: `${milestone.title} status changed to ${updated.status}.`,
    });
  };

  // Filter & Sort assignments
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          if (!a.title.toLowerCase().includes(q)) return false;
        }

        // Subject filter
        if (filters.subjectId !== 'all' && a.subjectId !== filters.subjectId) {
          return false;
        }

        // Priority filter
        if (filters.priority !== 'all' && a.priority !== filters.priority) {
          return false;
        }

        // Date range filter on deadline
        if (filters.startDate && a.deadline < filters.startDate) {
          return false;
        }
        if (filters.endDate && a.deadline > filters.endDate) {
          return false;
        }

        // Status filter
        if (filters.status === 'all') return true;
        if (filters.status === 'overdue' || filters.status === 'missed') {
          return isAssignmentOverdue(a, todayStr);
        }
        if (filters.status === 'pending') {
          return a.status === 'todo' || a.status === 'in-progress';
        }
        return a.status === filters.status;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline-asc') {
          return a.deadline.localeCompare(b.deadline);
        }
        if (sortBy === 'deadline-desc') {
          return b.deadline.localeCompare(a.deadline);
        }
        if (sortBy === 'priority') {
          const priorityWeights: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };
          return priorityWeights[b.priority] - priorityWeights[a.priority];
        }
        if (sortBy === 'status') {
          const statusWeights: Record<AssignmentStatus, number> = { 'in-progress': 3, todo: 2, done: 1 };
          return statusWeights[b.status] - statusWeights[a.status];
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [assignments, filters, sortBy, todayStr]);

  // Overall KPI counts
  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'done').length;
  const pendingCount = totalCount - completedCount;
  const overdueCount = assignments.filter((a) => isAssignmentOverdue(a, todayStr)).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-500" />
            Projects & Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track phase milestones, lab submissions, and assignment deadlines with daily days-left counters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddMilestoneOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddAssignmentOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Section 1: Project Milestones List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Project Phase Milestones
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {milestones.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Click status pill to cycle progress
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {milestones.map((m) => {
            const progress = calculateMilestoneProgress(m, assignments, todayStr);

            return (
              <div
                key={m.id}
                className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-3"
              >
                {/* Header: Title and Status pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {m.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDisplayDate(m.startDate)} — {formatDisplayDate(m.endDate)}</span>
                    </div>
                  </div>

                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleCycleMilestoneStatus(m)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition shrink-0 ${
                      m.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : m.status === 'in-progress'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Click to cycle status"
                  >
                    {m.status.replace('-', ' ')}
                  </button>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Milestone Completion</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className={`h-full transition-all duration-500 ${
                        progress >= 100
                          ? 'bg-emerald-500'
                          : m.status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Delete Milestone Button */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      deleteMilestone(m.id);
                      showToast({
                        type: 'info',
                        title: 'Milestone Removed',
                        message: `"${m.title}" was deleted.`,
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg opacity-40 group-hover:opacity-100 transition"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Assignments Tracker Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Assignments & Lab Submissions
            </h2>
          </div>
        </div>

        {/* Top KPIs for Assignments */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Total Assignments</div>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {totalCount}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Completed</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {completedCount}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Pending</div>
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {pendingCount}
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border shadow-sm flex items-center gap-3 ${
            overdueCount > 0
              ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e]'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              overdueCount > 0 ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Overdue Items</div>
              <div className={`text-base font-bold font-mono ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                {overdueCount}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Bar */}
        <form
          onSubmit={handleQuickAddAssignment}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm"
        >
          {/* Subject Selector */}
          <select
            value={quickSubjectId}
            onChange={(e) => setQuickSubjectId(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 shrink-0"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Title Input */}
          <div className="flex-1 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Add assignment or submission (e.g. Lab 3: Relational Algebra)..."
              className="w-full text-xs sm:text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Deadline Date */}
            <input
              type="date"
              value={quickDeadline}
              onChange={(e) => setQuickDeadline(e.target.value)}
              className="text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
            />

            {/* Priority */}
            <select
              value={quickPriority}
              onChange={(e) => setQuickPriority(e.target.value as Priority)}
              className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-2 py-1.5 focus:outline-none"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button
              type="submit"
              disabled={!quickTitle.trim()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition shrink-0"
            >
              Add
            </button>
          </div>
        </form>

        {/* Global Filter Bar */}
        <GlobalFilterBar
          onFilterChange={setFilters}
          showCategoryFilter={false}
          placeholder="Filter assignments by title, subject, priority, deadline..."
        />

        {/* Table Toolbar: Results Count and Sort */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="text-slate-500 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredAssignments.length}</span> of {totalCount} assignments
          </div>
          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 bg-white dark:bg-[#0c121e]">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="deadline-asc">Deadline (Earliest)</option>
              <option value="deadline-desc">Deadline (Latest)</option>
              <option value="priority">Priority (High first)</option>
              <option value="status">Status</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3 min-w-[130px]">Subject</th>
                  <th className="px-4 py-3 min-w-[200px]">Assignment Title</th>
                  <th className="px-3 py-3 min-w-[120px]">Deadline</th>
                  <th className="px-3 py-3 min-w-[90px]">Priority</th>
                  <th className="px-3 py-3 min-w-[100px]">Status</th>
                  <th className="px-3 py-3 min-w-[120px]">Days Left</th>
                  <th className="px-3 py-3 text-center min-w-[60px]">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment) => {
                    const sub = subjects.find((s) => s.id === assignment.subjectId);
                    const daysLeft = calculateDaysLeft(assignment.deadline, todayStr);
                    const isOverdue = isAssignmentOverdue(assignment, todayStr);

                    return (
                      <tr
                        key={assignment.id}
                        className={`transition-colors ${
                          isOverdue
                            ? 'bg-rose-50/70 dark:bg-rose-950/25 border-l-4 border-l-rose-500'
                            : assignment.status === 'done'
                            ? 'bg-emerald-500/5 dark:bg-emerald-950/10'
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/30'
                        }`}
                      >
                        {/* Subject */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sub?.colour || '#94a3b8' }}
                            />
                            <select
                              value={assignment.subjectId}
                              onChange={(e) =>
                                updateAssignment({ ...assignment, subjectId: e.target.value })
                              }
                              className="text-xs font-semibold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none cursor-pointer"
                            >
                              {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Title (Inline Editable) */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={assignment.title}
                            onChange={(e) =>
                              updateAssignment({ ...assignment, title: e.target.value })
                            }
                            className={`w-full text-xs font-medium bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5 transition ${
                              assignment.status === 'done'
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          />
                        </td>

                        {/* Deadline (Inline Editable) */}
                        <td className="px-3 py-3 font-mono">
                          <input
                            type="date"
                            value={assignment.deadline}
                            onChange={(e) =>
                              updateAssignment({ ...assignment, deadline: e.target.value })
                            }
                            className="text-xs font-mono bg-transparent text-slate-700 dark:text-slate-300 border-b border-transparent hover:border-slate-300 focus:outline-none cursor-pointer"
                          />
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-3">
                          <select
                            value={assignment.priority}
                            onChange={(e) =>
                              updateAssignment({ ...assignment, priority: e.target.value as Priority })
                            }
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                              assignment.priority === 'High'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : assignment.priority === 'Medium'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                            }`}
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <select
                            value={assignment.status}
                            onChange={(e) =>
                              updateAssignment({
                                ...assignment,
                                status: e.target.value as AssignmentStatus,
                              })
                            }
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                              assignment.status === 'done'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                                : assignment.status === 'in-progress'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Completed</option>
                          </select>
                        </td>

                        {/* Days Left (Negative shown red) */}
                        <td className="px-3 py-3 font-mono font-medium">
                          {assignment.status === 'done' ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : daysLeft < 0 ? (
                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{daysLeft} days (Overdue!)</span>
                            </div>
                          ) : daysLeft === 0 ? (
                            <span className="text-amber-500 font-bold">
                              Due Today!
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300">
                              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                            </span>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              deleteAssignment(assignment.id);
                              showToast({
                                type: 'info',
                                title: 'Assignment Deleted',
                                message: `"${assignment.title}" was removed.`,
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                            title="Delete assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No assignments found matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMilestoneModal
        isOpen={isAddMilestoneOpen}
        onClose={() => setIsAddMilestoneOpen(false)}
        onAdd={(newM) => {
          addMilestone(newM);
          showToast({
            type: 'success',
            title: 'Milestone Created',
            message: `"${newM.title}" added to project timeline.`,
          });
        }}
      />

      <AddAssignmentModal
        subjects={subjects}
        isOpen={isAddAssignmentOpen}
        onClose={() => setIsAddAssignmentOpen(false)}
        onAdd={(newA) => {
          addAssignment(newA);
          showToast({
            type: 'success',
            title: 'Assignment Created',
            message: `"${newA.title}" scheduled for ${formatDisplayDate(newA.deadline)}.`,
          });
        }}
      />
    </div>
  );
};
