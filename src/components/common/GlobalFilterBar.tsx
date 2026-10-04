import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlannerStore } from '../../store/usePlannerStore';
import { SavedView } from '../../types';
import { showToast } from '../../store/useToastStore';
import {
  Search,
  Bookmark,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Check,
  Calendar,
} from 'lucide-react';

export interface GlobalFilterValues {
  searchQuery: string;
  startDate: string;
  endDate: string;
  subjectId: string;
  categoryId: string;
  status: string;
  priority: string;
}

interface GlobalFilterBarProps {
  onFilterChange: (filters: GlobalFilterValues) => void;
  showCategoryFilter?: boolean;
  showPriorityFilter?: boolean;
  showStatusFilter?: boolean;
  showDateFilter?: boolean;
  placeholder?: string;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  onFilterChange,
  showCategoryFilter = true,
  showPriorityFilter = true,
  showStatusFilter = true,
  showDateFilter = true,
  placeholder = 'Search...',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    subjects,
    categories,
    savedViews,
    addSavedView,
    deleteSavedView,
  } = usePlannerStore();

  // Read initial filter values from URL search params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [startDate, setStartDate] = useState(searchParams.get('start') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end') || '');
  const [subjectId, setSubjectId] = useState(searchParams.get('subject') || 'all');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all');

  // New saved view naming state
  const [isSavingView, setIsSavingView] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [selectedViewId, setSelectedViewId] = useState<string>('custom');

  // Push filter state to parent callback & sync with URL
  useEffect(() => {
    const filters: GlobalFilterValues = {
      searchQuery,
      startDate,
      endDate,
      subjectId,
      categoryId,
      status,
      priority,
    };
    onFilterChange(filters);

    // Sync to URL search params
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (subjectId && subjectId !== 'all') params.set('subject', subjectId);
    if (categoryId && categoryId !== 'all') params.set('category', categoryId);
    if (status && status !== 'all') params.set('status', status);
    if (priority && priority !== 'all') params.set('priority', priority);

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    startDate,
    endDate,
    subjectId,
    categoryId,
    status,
    priority,
    onFilterChange,
    setSearchParams,
  ]);

  // Apply a saved view
  const handleApplySavedView = (viewId: string) => {
    setSelectedViewId(viewId);
    const view = savedViews.find((v) => v.id === viewId);
    if (!view) return;

    setSearchQuery(view.filters.searchQuery || '');
    setStartDate(view.filters.startDate || '');
    setEndDate(view.filters.endDate || '');
    setSubjectId(view.filters.subjectId || 'all');
    setCategoryId(view.filters.categoryId || 'all');
    setStatus(view.filters.status || 'all');
    setPriority(view.filters.priority || 'all');

    showToast({
      type: 'info',
      title: 'View Applied',
      message: `Restored view "${view.name}".`,
      duration: 1500,
    });
  };

  // Save current filter configuration as a named view
  const handleSaveCurrentView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;

    const newView: SavedView = {
      id: `view-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newViewName.trim(),
      filters: {
        searchQuery: searchQuery.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        subjectId: subjectId !== 'all' ? subjectId : undefined,
        categoryId: categoryId !== 'all' ? categoryId : undefined,
        status: status !== 'all' ? status : undefined,
        priority: priority !== 'all' ? priority : undefined,
      },
    };

    addSavedView(newView);
    setSelectedViewId(newView.id);
    setIsSavingView(false);
    setNewViewName('');
    showToast({
      type: 'success',
      title: 'View Saved',
      message: `Saved view "${newView.name}" successfully.`,
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSubjectId('all');
    setCategoryId('all');
    setStatus('all');
    setPriority('all');
    setSelectedViewId('custom');
    showToast({
      type: 'info',
      title: 'Filters Reset',
      duration: 1000,
    });
  };

  // Check if any filter is active
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    subjectId !== 'all' ||
    categoryId !== 'all' ||
    status !== 'all' ||
    priority !== 'all';

  return (
    <div className="p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-3">
      {/* Top Row: Search Input & Saved Views */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedViewId('custom');
            }}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Saved Views Picker & Save View Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <Bookmark className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <select
              value={selectedViewId}
              onChange={(e) => handleApplySavedView(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
            >
              <option value="custom">Custom View</option>
              {savedViews.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delete active custom view if selected */}
          {selectedViewId !== 'custom' && (
            <button
              type="button"
              onClick={() => {
                deleteSavedView(selectedViewId);
                setSelectedViewId('custom');
                showToast({
                  type: 'info',
                  title: 'View Deleted',
                  duration: 1200,
                });
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
              title="Delete this saved view"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Save current filters button */}
          <button
            type="button"
            onClick={() => setIsSavingView(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition"
            title="Save current filters as a named view"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save View</span>
          </button>
        </div>
      </div>

      {/* Save View Modal / Inline Form */}
      {isSavingView && (
        <form
          onSubmit={handleSaveCurrentView}
          className="flex items-center gap-2 p-2 rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 animate-in fade-in"
        >
          <input
            type="text"
            required
            autoFocus
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            placeholder="Enter view name (e.g. 'Only OOPs This Week')..."
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-purple-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newViewName.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-lg transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSavingView(false)}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Filter Selectors Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Subject Filter */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 font-medium">Subject:</span>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setSelectedViewId('custom');
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        {showCategoryFilter && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium">Category:</span>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSelectedViewId('custom');
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setSelectedViewId('custom');
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="done">Done / Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="todo">To Do</option>
              <option value="missed">Missed / Not Done</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        )}

        {/* Priority Filter */}
        {showPriorityFilter && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium">Priority:</span>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setSelectedViewId('custom');
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>
        )}

        {/* Date Range Filters */}
        {showDateFilter && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedViewId('custom');
              }}
              placeholder="Start"
              className="font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none"
            />
            <span className="text-slate-400 text-[10px]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedViewId('custom');
              }}
              placeholder="End"
              className="font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 px-2 py-1 focus:outline-none"
            />
          </div>
        )}

        {/* Reset All Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition ml-auto"
            title="Clear all active filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
