import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePlannerStore } from '../store/usePlannerStore';
import { Subject, Topic } from '../types';
import { calculateTopicProgress } from '../utils/calculations';
import { getTodayDateString, formatDisplayDate, isPastDate } from '../utils/dateUtils';
import { TopicRow } from '../components/subjects/TopicRow';
import { ProgressRing } from '../components/subjects/ProgressRing';
import { AddSubjectModal } from '../components/subjects/AddSubjectModal';
import { EditSubjectModal } from '../components/subjects/EditSubjectModal';
import { BulkAddTopicsModal } from '../components/subjects/BulkAddTopicsModal';
import { GlobalFilterBar, GlobalFilterValues } from '../components/common/GlobalFilterBar';
import { showToast } from '../store/useToastStore';
import {
  BookOpen,
  Plus,
  Layers,
  Clock,
  Search,
  Edit2,
  Sparkles,
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const {
    subjects,
    topics,
    addSubject,
    updateSubject,
    deleteSubject,
    addTopic,
    bulkAddTopics,
    updateTopic,
    deleteTopic,
    reorderTopics,
    toggleTopicField,
  } = usePlannerStore();

  const todayStr = getTodayDateString();

  // Selected Subject State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return subjects.length > 0 ? subjects[0].id : '';
  });

  // Modals state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'tests'>('all');

  // Quick inline add topic state
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDate, setNewTopicDate] = useState(todayStr);
  const [newTopicIsTest, setNewTopicIsTest] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Determine current active subject
  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  // Topics for selected subject
  const subjectTopics = useMemo(() => {
    if (!selectedSubject) return [];
    return topics.filter((t) => t.subjectId === selectedSubject.id);
  }, [topics, selectedSubject]);

  // Overall topics progress across all subjects
  const overallStats = useMemo(() => {
    const totalSubjects = subjects.length;
    const totalTopics = topics.length;
    const totalHours = subjects.reduce((sum, s) => sum + (s.plannedVideoHours || 0), 0);
    const overallProgress = calculateTopicProgress(topics);
    return { totalSubjects, totalTopics, totalHours, overallProgress };
  }, [subjects, topics]);

  // Selected subject progress
  const currentSubjectProgress = useMemo(() => {
    return calculateTopicProgress(subjectTopics);
  }, [subjectTopics]);

  // Count metrics for current subject
  const currentSubjectMetrics = useMemo(() => {
    const total = subjectTopics.length;
    const tests = subjectTopics.filter((t) => t.isTest);
    const testsPassed = tests.filter((t) => t.written).length;

    let completed = 0;
    let overdue = 0;

    for (const t of subjectTopics) {
      const isDone = t.isTest ? t.written : t.video && t.code && t.written;
      if (isDone) {
        completed++;
      } else if (isPastDate(t.targetDate, todayStr)) {
        overdue++;
      }
    }

    return {
      total,
      completed,
      pending: total - completed,
      overdue,
      testsCount: tests.length,
      testsPassed,
    };
  }, [subjectTopics, todayStr]);

  // Filtered topics based on search & filter pill
  const filteredTopics = useMemo(() => {
    return subjectTopics.filter((topic) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!topic.title.toLowerCase().includes(query)) return false;
      }

      // Filter pills
      const isDone = topic.isTest ? topic.written : topic.video && topic.code && topic.written;
      const isOverdue = isPastDate(topic.targetDate, todayStr) && !isDone;

      if (topicFilter === 'pending') return !isDone;
      if (topicFilter === 'completed') return isDone;
      if (topicFilter === 'overdue') return isOverdue;
      if (topicFilter === 'tests') return topic.isTest;

      return true;
    });
  }, [subjectTopics, searchQuery, topicFilter, todayStr]);

  // Handle Drag & Drop reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && selectedSubject) {
      const oldIndex = subjectTopics.findIndex((t) => t.id === active.id);
      const newIndex = subjectTopics.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(subjectTopics, oldIndex, newIndex);
        reorderTopics(selectedSubject.id, reordered);
        showToast({
          type: 'info',
          title: 'Topics Reordered',
          duration: 1500,
        });
      }
    }
  };

  // Quick inline add topic submit
  const handleQuickAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !selectedSubject) return;

    const newTopic: Topic = {
      id: `top-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subjectId: selectedSubject.id,
      title: newTopicTitle.trim(),
      targetDate: newTopicDate || todayStr,
      isTest: newTopicIsTest || newTopicTitle.toLowerCase().includes('test:'),
      video: false,
      code: false,
      written: false,
    };

    addTopic(newTopic);
    setNewTopicTitle('');
    setNewTopicIsTest(false);
    showToast({
      type: 'success',
      title: 'Topic Added',
      message: `"${newTopic.title}" was added to ${selectedSubject.name}.`,
    });
  };

  const handleGlobalFilterChange = (f: GlobalFilterValues) => {
    if (f.subjectId && f.subjectId !== 'all') {
      setSelectedSubjectId(f.subjectId);
    }
    setSearchQuery(f.searchQuery);
    if (f.status === 'done') setTopicFilter('completed');
    else if (f.status === 'pending') setTopicFilter('pending');
    else if (f.status === 'overdue') setTopicFilter('overdue');
    else if (f.status === 'all') setTopicFilter('all');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Subjects & Syllabus Topics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Organize study curriculum, monitor planned video hours, and tick off video lectures, coding, and tests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddSubjectOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar with URL query sync and saved views */}
      <GlobalFilterBar
        onFilterChange={handleGlobalFilterChange}
        showCategoryFilter={false}
        showPriorityFilter={false}
        placeholder="Filter curriculum topics or apply saved view..."
      />

      {/* Global Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Total Subjects</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {overallStats.totalSubjects}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Curriculum Topics</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {overallStats.totalTopics}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Planned Video Hours</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              {overallStats.totalHours}h
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Overall Syllabus Progress</div>
            <div className="text-lg font-bold text-emerald-500 font-mono">
              {overallStats.overallProgress.percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Subject Cards Carousel / Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Select Subject
          </h2>
          <span className="text-xs text-slate-400">
            {subjects.length} active courses
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {subjects.map((sub) => {
            const isSelected = selectedSubject?.id === sub.id;
            const subTopics = topics.filter((t) => t.subjectId === sub.id);
            const progress = calculateTopicProgress(subTopics);

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`relative group cursor-pointer p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                }`}
              >
                {/* Top: Color pill & Edit button */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: sub.colour }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSubject(sub);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition"
                    title="Edit subject"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subject Title */}
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">
                  {sub.name}
                </h3>

                {/* Date range & video hours */}
                <div className="text-[11px] text-slate-400 font-mono space-y-0.5 mb-3">
                  <div>{formatDisplayDate(sub.startDate)} - {formatDisplayDate(sub.endDate)}</div>
                  <div className="text-slate-500">{sub.plannedVideoHours}h planned video</div>
                </div>

                {/* Bottom: Topics count and progress ring */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {subTopics.length}
                    </span>{' '}
                    topics
                  </div>
                  <ProgressRing
                    percentage={progress.percentage}
                    size={38}
                    strokeWidth={4}
                    color={sub.colour || '#10b981'}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Subject Workspace */}
      {selectedSubject && (
        <div className="space-y-4 pt-2">
          {/* Detailed Subject Banner */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <ProgressRing
                  percentage={currentSubjectProgress.percentage}
                  size={64}
                  strokeWidth={6}
                  color={selectedSubject.colour}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedSubject.colour }}
                    />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {selectedSubject.name}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {formatDisplayDate(selectedSubject.startDate)} — {formatDisplayDate(selectedSubject.endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedSubject.notes || 'No extra notes provided for this subject.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsBulkAddOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Bulk Add Topics</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSubject(selectedSubject)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Subject</span>
                </button>
              </div>
            </div>

            {/* Subject Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <div className="text-xs">
                <span className="text-slate-400 block">Progress</span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {currentSubjectProgress.percentage}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {currentSubjectProgress.ticked} / {currentSubjectProgress.applicable} ticks
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block">Topics Completed</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {currentSubjectMetrics.completed} / {currentSubjectMetrics.total}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {currentSubjectMetrics.pending} remaining
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block">Mock Tests</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {currentSubjectMetrics.testsPassed} / {currentSubjectMetrics.testsCount}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  tests passed
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block">Overdue Topics</span>
                <span className={`text-base font-bold font-mono ${currentSubjectMetrics.overdue > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  {currentSubjectMetrics.overdue}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  target date elapsed
                </span>
              </div>
            </div>
          </div>

          {/* Quick Inline Add Topic Bar */}
          <form
            onSubmit={handleQuickAddTopic}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm"
          >
            <div className="flex-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder={`Quick add topic to ${selectedSubject.name} (e.g. "Lecture 4: Dynamic Programming")...`}
                className="w-full text-xs sm:text-sm bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="date"
                value={newTopicDate}
                onChange={(e) => setNewTopicDate(e.target.value)}
                className="text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
              />

              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={newTopicIsTest}
                  onChange={(e) => setNewTopicIsTest(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-medium">Test</span>
              </label>

              <button
                type="submit"
                disabled={!newTopicTitle.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition shrink-0"
              >
                Add Topic
              </button>
            </div>
          </form>

          {/* Search & Topic Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setTopicFilter('all')}
                className={`px-3 py-1 text-xs rounded-xl font-medium transition shrink-0 ${
                  topicFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
                }`}
              >
                All ({currentSubjectMetrics.total})
              </button>
              <button
                type="button"
                onClick={() => setTopicFilter('pending')}
                className={`px-3 py-1 text-xs rounded-xl font-medium transition shrink-0 ${
                  topicFilter === 'pending'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
                }`}
              >
                Pending ({currentSubjectMetrics.pending})
              </button>
              <button
                type="button"
                onClick={() => setTopicFilter('completed')}
                className={`px-3 py-1 text-xs rounded-xl font-medium transition shrink-0 ${
                  topicFilter === 'completed'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
                }`}
              >
                Completed ({currentSubjectMetrics.completed})
              </button>
              {currentSubjectMetrics.overdue > 0 && (
                <button
                  type="button"
                  onClick={() => setTopicFilter('overdue')}
                  className={`px-3 py-1 text-xs rounded-xl font-medium transition shrink-0 ${
                    topicFilter === 'overdue'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                  }`}
                >
                  Overdue ({currentSubjectMetrics.overdue})
                </button>
              )}
              {currentSubjectMetrics.testsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTopicFilter('tests')}
                  className={`px-3 py-1 text-xs rounded-xl font-medium transition shrink-0 ${
                    topicFilter === 'tests'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                  }`}
                >
                  Tests ({currentSubjectMetrics.testsCount})
                </button>
              )}
            </div>

            {/* Topic Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Topics List with Drag & Drop */}
          {filteredTopics.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTopics.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {filteredTopics.map((topic) => (
                    <TopicRow
                      key={topic.id}
                      topic={topic}
                      todayStr={todayStr}
                      onToggleField={toggleTopicField}
                      onUpdate={updateTopic}
                      onDelete={(id) => {
                        deleteTopic(id);
                        showToast({
                          type: 'info',
                          title: 'Topic Deleted',
                          message: `"${topic.title}" was removed.`,
                        });
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {searchQuery ? 'No topics match your search' : 'No topics in this subject yet'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {searchQuery
                    ? `No topic titles match "${searchQuery}". Clear your search query to see all topics.`
                    : 'Paste your topic syllabus or add topics one by one to begin tracking video hours, code, and test practice.'}
                </p>
              </div>
              {!searchQuery && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsBulkAddOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-sm transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Paste Topic Syllabus</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        onAdd={(newSubject, syncTrackerFocus) => {
          addSubject(newSubject, syncTrackerFocus);
          setSelectedSubjectId(newSubject.id);
          showToast({
            type: 'success',
            title: 'Subject Created',
            message: `${newSubject.name} was added.${syncTrackerFocus ? ' Daily Tracker focus dates synced!' : ''}`,
          });
        }}
      />

      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          isOpen={Boolean(editingSubject)}
          onClose={() => setEditingSubject(null)}
          onSave={(updatedSubject, syncTrackerFocus) => {
            updateSubject(updatedSubject, syncTrackerFocus);
            setEditingSubject(null);
            showToast({
              type: 'success',
              title: 'Subject Updated',
              message: `${updatedSubject.name} settings saved.`,
            });
          }}
          onDelete={(subjectId) => {
            deleteSubject(subjectId);
            setEditingSubject(null);
            if (selectedSubjectId === subjectId) {
              const remaining = subjects.filter((s) => s.id !== subjectId);
              if (remaining.length > 0) {
                setSelectedSubjectId(remaining[0].id);
              }
            }
            showToast({
              type: 'info',
              title: 'Subject Removed',
              message: 'Subject and all its topics were removed.',
            });
          }}
        />
      )}

      {selectedSubject && (
        <BulkAddTopicsModal
          subject={selectedSubject}
          isOpen={isBulkAddOpen}
          onClose={() => setIsBulkAddOpen(false)}
          onBulkAdd={(subId, newTopics) => {
            bulkAddTopics(subId, newTopics);
            setIsBulkAddOpen(false);
            showToast({
              type: 'success',
              title: 'Topics Imported',
              message: `Added ${newTopics.length} topics to ${selectedSubject.name}.`,
            });
          }}
        />
      )}
    </div>
  );
};
