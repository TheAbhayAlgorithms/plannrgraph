import React, { useState, useMemo } from 'react';
import { Subject, Topic } from '../../types';
import { generateDateRange } from '../../utils/dateUtils';
import { X, Layers, Plus } from 'lucide-react';

interface BulkAddTopicsModalProps {
  subject: Subject;
  isOpen: boolean;
  onClose: () => void;
  onBulkAdd: (subjectId: string, topics: Topic[]) => void;
}

export const BulkAddTopicsModal: React.FC<BulkAddTopicsModalProps> = ({
  subject,
  isOpen,
  onClose,
  onBulkAdd,
}) => {
  const [rawText, setRawText] = useState('');
  const [distributeDates, setDistributeDates] = useState(true);

  // Parse lines
  const parsedTopics = useMemo(() => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return [];

    const availableDates = generateDateRange(subject.startDate, subject.endDate);
    const dateCount = availableDates.length;

    return lines.map((line, index) => {
      // Auto-detect test topics if starts with TEST or contains "test:"
      const isTest = line.toLowerCase().includes('test:') || line.toLowerCase().startsWith('test');

      // Distribute dates across available subject dates
      let targetDate = subject.startDate;
      if (distributeDates && dateCount > 0) {
        const step = (dateCount - 1) / Math.max(1, lines.length - 1);
        const dateIndex = Math.min(dateCount - 1, Math.round(index * step));
        targetDate = availableDates[dateIndex];
      }

      const topic: Topic = {
        id: `top-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        subjectId: subject.id,
        title: line,
        targetDate,
        isTest,
        video: false,
        code: false,
        written: false,
      };

      return topic;
    });
  }, [rawText, subject, distributeDates]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTopics.length === 0) return;

    onBulkAdd(subject.id, parsedTopics);
    setRawText('');
    onClose();
  };

  const testCount = parsedTopics.filter((t) => t.isTest).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Add Topics by Pasting List
              </h3>
              <p className="text-xs text-slate-400">
                Adding topics to <span className="font-semibold text-slate-700 dark:text-slate-200">{subject.name}</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Paste List of Topics (One per line)
            </label>
            <textarea
              rows={8}
              autoFocus
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g.&#10;Introduction & Architecture&#10;Components & Props&#10;State & Hooks&#10;TEST: 15 Coding Exercises"
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Lines containing "TEST:" are automatically flagged as test topics (skipping video & code ticks).
            </p>
          </div>

          {/* Distribute Dates Checkbox */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Evenly distribute target dates across subject range
              </span>
              <input
                type="checkbox"
                checked={distributeDates}
                onChange={(e) => setDistributeDates(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">
              Distributes target deadlines between {subject.startDate} and {subject.endDate}.
            </p>
          </div>

          {/* Parsing summary */}
          {parsedTopics.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>
                Parsed <span className="font-bold">{parsedTopics.length}</span> topic(s) ({testCount} test{testCount !== 1 ? 's' : ''})
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Ready to import</span>
            </div>
          )}

          {/* Buttons */}
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
              disabled={parsedTopics.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Import {parsedTopics.length} Topic{parsedTopics.length !== 1 ? 's' : ''}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
