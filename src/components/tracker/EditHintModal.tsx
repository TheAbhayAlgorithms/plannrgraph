import React, { useState, useEffect } from 'react';
import { X, Check, Edit3 } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

interface EditHintModalProps {
  isOpen: boolean;
  date: string;
  taskId: string;
  taskName: string;
  currentHint: string;
  onClose: () => void;
  onSave: (date: string, taskId: string, newHint: string) => void;
}

export const EditHintModal: React.FC<EditHintModalProps> = ({
  isOpen,
  date,
  taskId,
  taskName,
  currentHint,
  onClose,
  onSave,
}) => {
  const [hint, setHint] = useState(currentHint);

  useEffect(() => {
    setHint(currentHint);
  }, [currentHint, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(date, taskId, hint.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit Day Hint Label
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Editing hint for <span className="font-semibold text-slate-800 dark:text-slate-200">{taskName}</span> on{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {formatDisplayDate(date)}
          </span>.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hint Label (faded text in cell)
            </label>
            <input
              type="text"
              autoFocus
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Study · OOPs, Backend API"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Hint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
