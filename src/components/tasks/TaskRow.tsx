import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Category, TaskTemplate } from '../../types';
import {
  GripVertical,
  GraduationCap,
  FlaskConical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TaskRowProps {
  task: TaskTemplate;
  index: number;
  categories: Category[];
  onUpdate: (updatedTask: TaskTemplate) => void;
  onToggleActive: (taskId: string) => void;
  onEdit: (task: TaskTemplate) => void;
  onDelete: (task: TaskTemplate) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  index,
  categories,
  onUpdate,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const category = categories.find((c) => c.id === task.categoryId);
  const displayColor = task.colour || category?.colour || '#94a3b8';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
        task.active
          ? 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
          : 'border-dashed border-slate-200 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/30 opacity-70'
      }`}
    >
      {/* Left: Drag Handle, Order, Color, Name */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder column order"
          className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 p-1 -ml-1 rounded-lg transition"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 w-5 text-center">
          #{index + 1}
        </span>

        {/* Color Indicator */}
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/10"
          style={{ backgroundColor: displayColor }}
        />

        {/* Inline editable name */}
        <input
          type="text"
          value={task.name}
          onChange={(e) => onUpdate({ ...task, name: e.target.value })}
          className="text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5 min-w-[140px] truncate transition"
        />
      </div>

      {/* Middle: Category & Flags */}
      <div className="flex flex-wrap items-center gap-2 my-2.5 sm:my-0 sm:mx-3">
        {/* Category Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-300">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: category?.colour ?? '#94a3b8' }}
          />
          <span className="truncate max-w-[100px]">{category?.name ?? 'Uncategorized'}</span>
        </div>

        {/* Study Task Pill */}
        <button
          type="button"
          onClick={() => onUpdate({ ...task, isStudy: !task.isStudy })}
          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium transition ${
            task.isStudy
              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Study Task flag"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Study</span>
        </button>

        {/* Research Task Pill */}
        <button
          type="button"
          onClick={() => onUpdate({ ...task, isResearch: !task.isResearch })}
          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium transition ${
            task.isResearch
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Research Task flag"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Research</span>
        </button>
      </div>

      {/* Right: Active Toggle, Edit, Delete */}
      <div className="flex items-center gap-1 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onToggleActive(task.id)}
          className={`p-1.5 rounded-lg transition ${
            task.active
              ? 'text-emerald-500 hover:bg-emerald-500/10'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={task.active ? 'Hide / Archive Task' : 'Activate in Tracker'}
        >
          {task.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Edit task settings"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
          title="Delete task template"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
