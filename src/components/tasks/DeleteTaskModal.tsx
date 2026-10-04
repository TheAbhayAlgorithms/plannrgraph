import React from 'react';
import { TaskTemplate } from '../../types';
import { AlertTriangle, Trash2, History, X } from 'lucide-react';

interface DeleteTaskModalProps {
  task: TaskTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (taskId: string, keepHistory: boolean) => void;
}

export const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Task Template
              </h3>
              <p className="text-xs text-slate-400">
                Choose how to handle past tracking history for "{task.name}".
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description & Choices */}
        <div className="space-y-3 py-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <p>
            You are deleting <span className="font-semibold text-slate-900 dark:text-white">"{task.name}"</span>. How would you like to handle past ticks recorded in your daily tracker?
          </p>

          <div className="space-y-2.5 pt-2">
            {/* Option A: Keep History */}
            <button
              onClick={() => onConfirm(task.id, true)}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 bg-slate-50 dark:bg-slate-800/40 hover:bg-emerald-500/5 transition flex items-start gap-3 group"
            >
              <History className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-500 text-xs sm:text-sm">
                  Keep Past History (Recommended)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Removes the task from active tracking and templates, but retains your past completion records and charts intact.
                </div>
              </div>
            </button>

            {/* Option B: Purge History */}
            <button
              onClick={() => onConfirm(task.id, false)}
              className="w-full text-left p-3.5 rounded-xl border border-rose-300 dark:border-rose-900/50 hover:border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-500/10 transition flex items-start gap-3 group"
            >
              <Trash2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-700 dark:text-rose-400 text-xs sm:text-sm">
                  Delete Task & Purge All History
                </div>
                <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                  Permanently deletes all past checkmarks and data associated with this task across all dates.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
