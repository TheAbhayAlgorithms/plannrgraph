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
import { TaskTemplate } from '../types';
import { TaskRow } from '../components/tasks/TaskRow';
import { AddTaskModal } from '../components/tasks/AddTaskModal';
import { EditTaskModal } from '../components/tasks/EditTaskModal';
import { DeleteTaskModal } from '../components/tasks/DeleteTaskModal';
import { showToast } from '../store/useToastStore';
import {
  ListTodo,
  Plus,
  Search,
  Eye,
  EyeOff,
  GraduationCap,
  FlaskConical,
  Filter,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const {
    taskTemplates,
    categories,
    addTaskTemplate,
    updateTaskTemplate,
    deleteTaskTemplate,
    reorderTaskTemplates,
    toggleTaskActive,
  } = usePlannerStore();

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskTemplate | null>(null);

  // Drag and Drop sensors
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

  // Filtered tasks based on activeTab, search query, and category
  const filteredTasks = useMemo(() => {
    return taskTemplates
      .filter((task) => (activeTab === 'active' ? task.active : !task.active))
      .filter((task) => {
        if (selectedCategory !== 'all' && task.categoryId !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          return task.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      });
  }, [taskTemplates, activeTab, selectedCategory, searchQuery]);

  const activeCount = taskTemplates.filter((t) => t.active).length;
  const archivedCount = taskTemplates.filter((t) => !t.active).length;
  const studyCount = taskTemplates.filter((t) => t.isStudy).length;
  const researchCount = taskTemplates.filter((t) => t.isResearch).length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = taskTemplates.findIndex((t) => t.id === active.id);
      const newIndex = taskTemplates.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(taskTemplates, oldIndex, newIndex);
        reorderTaskTemplates(reordered);
        showToast({
          type: 'info',
          title: 'Tracker Columns Reordered',
          duration: 1500,
        });
      }
    }
  };

  const handleAdd = (newTask: TaskTemplate, defaultHint?: string) => {
    addTaskTemplate(newTask, defaultHint);
    showToast({
      type: 'success',
      title: 'Task Added to Tracker',
      message: `"${newTask.name}" is now active as a daily column across all dates.`,
      duration: 3500,
    });
  };

  const handleSaveEdit = (updatedTask: TaskTemplate) => {
    updateTaskTemplate(updatedTask);
    showToast({
      type: 'info',
      title: 'Task Template Updated',
      message: `Modifications to "${updatedTask.name}" saved.`,
      duration: 2000,
    });
  };

  const handleConfirmDelete = (taskId: string, keepHistory: boolean) => {
    const task = taskTemplates.find((t) => t.id === taskId);
    deleteTaskTemplate(taskId, keepHistory);
    setDeletingTask(null);
    showToast({
      type: 'warning',
      title: 'Task Template Removed',
      message: keepHistory
        ? `"${task?.name ?? 'Task'}" removed from active templates (past history preserved).`
        : `"${task?.name ?? 'Task'}" and all historical day entries purged.`,
      duration: 3500,
    });
  };

  const handleToggleActive = (taskId: string) => {
    const task = taskTemplates.find((t) => t.id === taskId);
    const willBeActive = !task?.active;
    toggleTaskActive(taskId);
    showToast({
      type: 'info',
      title: willBeActive ? 'Task Activated' : 'Task Archived',
      message: willBeActive
        ? `"${task?.name}" restored to daily tracker checklist.`
        : `"${task?.name}" hidden from active tracking (data preserved).`,
      duration: 2500,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-emerald-500" />
            Task Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure routine task templates, column ordering, category tags, and study/research markers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Tasks
          </span>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {taskTemplates.length}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-3 h-3 text-emerald-500" /> Active in Tracker
          </span>
          <div className="text-lg font-bold text-emerald-500 mt-0.5">
            {activeCount} <span className="text-xs font-normal text-slate-400">columns</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-indigo-400" /> Study Blocks
          </span>
          <div className="text-lg font-bold text-indigo-400 mt-0.5">
            {studyCount} <span className="text-xs font-normal text-slate-400">tasks</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FlaskConical className="w-3 h-3 text-purple-400" /> Research Blocks
          </span>
          <div className="text-lg font-bold text-purple-400 mt-0.5">
            {researchCount} <span className="text-xs font-normal text-slate-400">tasks</span>
          </div>
        </div>
      </div>

      {/* Tabs and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40">
        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#0c121e] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'active'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Active ({activeCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'archived'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Archived / Hidden ({archivedCount})</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c121e] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c121e] text-xs">
            <Filter className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sortable Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
          No tasks found matching your filter.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={filteredTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {filteredTasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={task.order ?? idx}
                  categories={categories}
                  onUpdate={updateTaskTemplate}
                  onToggleActive={handleToggleActive}
                  onEdit={(t) => setEditingTask(t)}
                  onDelete={(t) => setDeletingTask(t)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modals */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        categories={categories}
        existingTasksCount={taskTemplates.length}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
      />

      <EditTaskModal
        task={editingTask}
        categories={categories}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEdit}
      />

      <DeleteTaskModal
        task={deletingTask}
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
