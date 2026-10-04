import React, { useState } from 'react';
import { Category, TaskTemplate } from '../../types';
import { Plus, X, GraduationCap, FlaskConical } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  categories: Category[];
  existingTasksCount: number;
  onClose: () => void;
  onAdd: (newTask: TaskTemplate, defaultHint?: string) => void;
}

const COLOR_PRESETS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#06b6d4', // cyan
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  categories,
  existingTasksCount,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [hintLabel, setHintLabel] = useState('');
  const [colour, setColour] = useState<string>('');
  const [isStudy, setIsStudy] = useState(false);
  const [isResearch, setIsResearch] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTask: TaskTemplate = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      categoryId: categoryId || (categories[0]?.id ?? ''),
      colour: colour || undefined,
      order: existingTasksCount,
      active: true,
      isStudy,
      isResearch,
    };

    onAdd(newTask, hintLabel.trim() ? hintLabel.trim() : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Task Template
            </h3>
            <p className="text-xs text-slate-400">
              Automatically creates a new tracker column for all calendar days.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meditation, DSA Practice"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Default Hint Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Default Hint Label (Optional)
            </label>
            <input
              type="text"
              value={hintLabel}
              onChange={(e) => setHintLabel(e.target.value)}
              placeholder="Faded text shown in tracker cells (e.g. LeetCode 2Q)"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Custom Colour Override */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Color Accent (Optional)
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColour(colour === c ? '' : c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    colour === c ? 'scale-125 ring-2 ring-emerald-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={colour || '#10b981'}
                onChange={(e) => setColour(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent ml-1"
                title="Custom color picker"
              />
              {colour && (
                <button
                  type="button"
                  onClick={() => setColour('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Special Flags */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Mark as Study Task
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Contributes to daily planned & completed study hours
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isStudy}
                onChange={(e) => setIsStudy(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Mark as Research Task
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Automatically derives research hours when checked off
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isResearch}
                onChange={(e) => setIsResearch(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
