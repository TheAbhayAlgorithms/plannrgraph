import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { Category } from '../../types';
import { showToast } from '../../store/useToastStore';
import { X, Plus, Trash2, Edit2, Check, Palette } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#ef4444', // red
  '#64748b', // slate
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, addCategory, updateCategory, deleteCategory, routineSlots, taskTemplates } =
    usePlannerStore();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColour, setNewCatColour] = useState(PRESET_COLORS[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColour, setEditColour] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      colour: newCatColour,
    };

    addCategory(newCat);
    setNewCatName('');
    showToast({
      type: 'success',
      title: 'Category Created',
      message: `"${newCat.name}" is now available for routine slots and tasks.`,
    });
  };

  const startEditing = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColour(cat.colour);
  };

  const saveEditing = (id: string) => {
    if (!editName.trim()) return;
    updateCategory({
      id,
      name: editName.trim(),
      colour: editColour,
    });
    setEditingId(null);
    showToast({
      type: 'info',
      title: 'Category Updated',
      duration: 2000,
    });
  };

  const handleDelete = (cat: Category) => {
    const slotsUsing = routineSlots.filter((s) => s.categoryId === cat.id).length;
    const tasksUsing = taskTemplates.filter((t) => t.categoryId === cat.id).length;

    if (slotsUsing > 0 || tasksUsing > 0) {
      if (
        !window.confirm(
          `"${cat.name}" is currently assigned to ${slotsUsing} routine slot(s) and ${tasksUsing} task template(s). Delete anyway?`
        )
      ) {
        return;
      }
    }

    deleteCategory(cat.id);
    showToast({
      type: 'warning',
      title: 'Category Deleted',
      message: `"${cat.name}" was removed.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Manage Categories
              </h3>
              <p className="text-xs text-slate-400">
                Customize category names and color identifiers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Categories List */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Existing Categories ({categories.length})
          </span>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;
              const slotsCount = routineSlots.filter((s) => s.categoryId === cat.id).length;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Category name"
                      />
                      <input
                        type="color"
                        value={editColour}
                        onChange={(e) => setEditColour(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <button
                        onClick={() => saveEditing(cat.id)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.colour }}
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({slotsCount} slots)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="Edit category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create New Category Form */}
        <form onSubmit={handleCreate} className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Add New Category
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Coding Practice"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Color presets palette */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Color:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCatColour(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newCatColour === color ? 'scale-125 ring-2 ring-emerald-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={newCatColour}
                onChange={(e) => setNewCatColour(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent ml-1"
                title="Custom color"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
