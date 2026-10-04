import React, { useState, useMemo } from 'react';
import { Subject } from '../../types';
import { generateDateRange, formatDisplayDate, getDayType } from '../../utils/dateUtils';
import { calculatePlannedStudyHours } from '../../utils/calculations';
import {
  X,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';

interface ReplanModalProps {
  subjects: Subject[];
  initialSubjectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onApplyReplan: (
    subjectId: string,
    newStartDate: string,
    newEndDate: string,
    newPlannedVideoHours: number,
    redistributeTopics: boolean,
    cascadeSubsequent: boolean
  ) => void;
  studyHoursWeekday?: number;
  studyHoursWeekend?: number;
}

export const ReplanModal: React.FC<ReplanModalProps> = ({
  subjects,
  initialSubjectId,
  isOpen,
  onClose,
  onApplyReplan,
  studyHoursWeekday = 2,
  studyHoursWeekend = 8,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return initialSubjectId || (subjects.length > 0 ? subjects[0].id : '');
  });

  const subject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  const [newStartDate, setNewStartDate] = useState<string>('');
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [newVideoHours, setNewVideoHours] = useState<number>(0);
  const [redistributeTopics, setRedistributeTopics] = useState(true);
  const [cascadeSubsequent, setCascadeSubsequent] = useState(true);

  // Sync inputs whenever subject changes
  React.useEffect(() => {
    if (subject) {
      setNewStartDate(subject.startDate);
      setNewEndDate(subject.endDate);
      setNewVideoHours(subject.plannedVideoHours);
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  // Calculate current metrics
  const oldDates = generateDateRange(subject.startDate, subject.endDate);
  const oldPlannedHours = oldDates.reduce((sum, d) => {
    return sum + calculatePlannedStudyHours(getDayType(d), studyHoursWeekday, studyHoursWeekend);
  }, 0);

  // Calculate proposed metrics
  const proposedDates = newStartDate <= newEndDate ? generateDateRange(newStartDate, newEndDate) : [];
  const proposedPlannedHours = proposedDates.reduce((sum, d) => {
    return sum + calculatePlannedStudyHours(getDayType(d), studyHoursWeekday, studyHoursWeekend);
  }, 0);

  const hoursDiff = proposedPlannedHours - oldPlannedHours;
  const daysDiff = proposedDates.length - oldDates.length;

  // Subsequent subjects that will be affected if cascade is enabled
  const subjectIndex = subjects.findIndex((s) => s.id === subject.id);
  const subsequentSubjects = subjectIndex !== -1 ? subjects.slice(subjectIndex + 1) : [];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartDate || !newEndDate || newStartDate > newEndDate) return;

    onApplyReplan(
      subject.id,
      newStartDate,
      newEndDate,
      Math.max(0, Number(newVideoHours)),
      redistributeTopics,
      cascadeSubsequent
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Re-plan Study Schedule
              </h3>
              <p className="text-xs text-slate-400">
                Adjust dates, re-distribute curriculum topics, and preview the new timeline.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="space-y-5">
          {/* Subject Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Select Subject to Re-Plan
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white px-3 py-2.5 focus:outline-none focus:border-purple-500 transition"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({formatDisplayDate(s.startDate)} — {formatDisplayDate(s.endDate)})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Hours Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                New Start Date
              </label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                required
                className="w-full text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                New End Date
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                required
                min={newStartDate}
                className="w-full text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Target Video Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={newVideoHours}
                onChange={(e) => setNewVideoHours(Number(e.target.value))}
                className="w-full text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Re-plan Options */}
          <div className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={redistributeTopics}
                onChange={(e) => setRedistributeTopics(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Redistribute Syllabus Topics
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Evenly spread this subject's topics across the new date range so target deadlines stay realistic.
                </span>
              </div>
            </label>

            {subsequentSubjects.length > 0 && (
              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/50 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={cascadeSubsequent}
                  onChange={(e) => setCascadeSubsequent(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Cascade Subsequent Subjects Forward ({subsequentSubjects.length} subjects)
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Automatically shift following subjects ({subsequentSubjects.map((s) => s.name).join(', ')}) forward to prevent timetable overlap.
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Interactive Before vs After Comparison Card */}
          <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preview: Schedule Redistribution</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/70 dark:bg-black/40 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1 font-semibold uppercase">Current Schedule</span>
                <div className="font-mono text-slate-800 dark:text-slate-200">
                  {formatDisplayDate(subject.startDate)} — {formatDisplayDate(subject.endDate)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{oldDates.length} days</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{oldPlannedHours}h planned</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-black/40 border border-purple-500/30">
                <span className="text-purple-500 dark:text-purple-400 block text-[11px] mb-1 font-semibold uppercase">Proposed Schedule</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white">
                  {newStartDate && newEndDate ? (
                    `${formatDisplayDate(newStartDate)} — ${formatDisplayDate(newEndDate)}`
                  ) : (
                    'Invalid dates'
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    {proposedDates.length} days ({daysDiff >= 0 ? `+${daysDiff}` : daysDiff})
                  </span>
                  <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {proposedPlannedHours}h planned ({hoursDiff >= 0 ? `+${hoursDiff}h` : `${hoursDiff}h`})
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Notes */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                Daily Tracker focus subject days and study hints will synchronize immediately upon applying.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newStartDate || !newEndDate || newStartDate > newEndDate}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-md transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Apply Re-Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
