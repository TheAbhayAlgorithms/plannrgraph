import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { showToast } from '../../store/useToastStore';
import { Subject } from '../../types';
import { calculateDaysBetween, generateDateRange, formatDisplayDate } from '../../utils/dateUtils';
import { addDays, format, parseISO } from 'date-fns';
import {
  Wand2,
  X,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface PlanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WizardSubject {
  id: string;
  name: string;
  colour: string;
  plannedVideoHours: number;
}

const DEFAULT_COLOURS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
];

export const PlanWizardModal: React.FC<PlanWizardModalProps> = ({ isOpen, onClose }) => {
  const { settings, setSettings, importData, taskTemplates } =
    usePlannerStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Date Range
  const [startDate, setStartDate] = useState(settings.startDate);
  const [endDate, setEndDate] = useState(settings.endDate);

  // Step 2: Subjects
  const [subjectsList, setSubjectsList] = useState<WizardSubject[]>([
    { id: 'wiz-sub-1', name: 'Computer Networks', colour: '#3b82f6', plannedVideoHours: 14 },
    { id: 'wiz-sub-2', name: 'Operating Systems', colour: '#10b981', plannedVideoHours: 12 },
    { id: 'wiz-sub-3', name: 'System Design', colour: '#f59e0b', plannedVideoHours: 16 },
    { id: 'wiz-sub-4', name: 'Database Engineering', colour: '#8b5cf6', plannedVideoHours: 12 },
  ]);

  const [newSubName, setNewSubName] = useState('');
  const [newSubHours, setNewSubHours] = useState(10);
  const [newSubColour, setNewSubColour] = useState(DEFAULT_COLOURS[0]);

  const totalDays = useMemo(() => calculateDaysBetween(startDate, endDate), [startDate, endDate]);
  const isDateWindowValid = startDate <= endDate && totalDays > 0;

  // Auto-distribute dates evenly across subjects
  const scheduledSubjects = useMemo<Subject[]>(() => {
    if (!isDateWindowValid || subjectsList.length === 0) return [];

    const numSubjects = subjectsList.length;
    const baseDaysPerSubject = Math.floor(totalDays / numSubjects);
    let remainderDays = totalDays % numSubjects;

    let currentStart = parseISO(startDate);

    return subjectsList.map((sub, index) => {
      const extra = remainderDays > 0 ? 1 : 0;
      if (remainderDays > 0) remainderDays--;

      const allocatedDays = Math.max(1, baseDaysPerSubject + extra);
      const subStartStr = format(currentStart, 'yyyy-MM-dd');
      const subEnd = addDays(currentStart, allocatedDays - 1);
      const subEndStr = format(subEnd, 'yyyy-MM-dd');

      // Advance start for next subject
      currentStart = addDays(subEnd, 1);

      return {
        id: `sub-wiz-${Date.now()}-${index}`,
        name: sub.name,
        colour: sub.colour,
        startDate: subStartStr,
        endDate: subEndStr,
        plannedVideoHours: sub.plannedVideoHours,
        notes: `Generated via Plan Wizard (${allocatedDays} days allocated)`,
      };
    });
  }, [startDate, endDate, totalDays, isDateWindowValid, subjectsList]);

  if (!isOpen) return null;

  // Add subject to list
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const newSub: WizardSubject = {
      id: `wiz-sub-${Date.now()}`,
      name: newSubName.trim(),
      colour: newSubColour,
      plannedVideoHours: Math.max(1, Number(newSubHours)),
    };

    setSubjectsList([...subjectsList, newSub]);
    setNewSubName('');
    setNewSubHours(10);
    // Cycle colour
    const nextCol = DEFAULT_COLOURS[(subjectsList.length + 1) % DEFAULT_COLOURS.length];
    setNewSubColour(nextCol);
  };

  // Remove subject
  const handleRemoveSubject = (id: string) => {
    if (subjectsList.length <= 1) {
      showToast({
        type: 'warning',
        title: 'At least one subject required',
        message: 'Your plan must have at least 1 subject.',
      });
      return;
    }
    setSubjectsList(subjectsList.filter((s) => s.id !== id));
  };

  // Final Action: Generate Plan
  const handleGeneratePlan = () => {
    if (!isDateWindowValid || scheduledSubjects.length === 0) return;

    // Generate dayPlans for the entire range
    const allDates = generateDateRange(startDate, endDate);
    const newDayPlans: Record<string, any> = {};

    for (const d of allDates) {
      const matchSubject = scheduledSubjects.find((s) => d >= s.startDate && d <= s.endDate);
      const overrides: Record<string, { hintLabel?: string; done: boolean }> = {};

      for (const t of taskTemplates) {
        if (t.active) {
          overrides[t.id] = { done: false };
        }
      }

      newDayPlans[d] = {
        date: d,
        focusSubjectId: matchSubject?.id,
        overrides,
      };
    }

    // Update settings
    setSettings({
      startDate,
      endDate,
    });

    // Update store state with new subjects & day plans while preserving routine and categories
    const currentStore = usePlannerStore.getState();
    importData({
      ...currentStore,
      settings: {
        ...currentStore.settings,
        startDate,
        endDate,
      },
      subjects: scheduledSubjects,
      topics: [], // start with fresh topic matrix for new plan
      dayPlans: newDayPlans,
    });

    showToast({
      type: 'success',
      title: 'Plan Generated Successfully!',
      message: `Created ${scheduledSubjects.length} subjects across ${totalDays} scheduled days.`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-sm">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Study Plan Setup Wizard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Step {step} of 3: {step === 1 ? 'Date Window' : step === 2 ? 'Subjects & Syllabus' : 'Schedule Timeline Preview'}
            </p>
          </div>
        </div>

        {/* Progress Step Bar */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        </div>

        {/* STEP 1: Date Window */}
        {step === 1 && (
          <div className="space-y-4 pt-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                Select Plan Date Duration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define the overall sprint boundaries. Subjects will be sequentially allocated across these days.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Total Days Feedback Card */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                Total Days in Plan:
              </span>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {isDateWindowValid ? `${totalDays} Days` : 'Invalid Range'}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!isDateWindowValid}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-sm transition active:scale-95"
              >
                <span>Next: Add Subjects</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Subject List */}
        {step === 2 && (
          <div className="space-y-4 pt-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                Add & Organize Subjects
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add the subjects you plan to study. Days will be automatically balanced across them.
              </p>
            </div>

            {/* Quick Add Subject Bar */}
            <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="Subject name (e.g. Distributed Systems)..."
                className="w-full text-xs bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none px-2"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newSubHours}
                  onChange={(e) => setNewSubHours(Number(e.target.value))}
                  title="Planned Video Hours"
                  className="w-16 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-white focus:outline-none text-center"
                />

                <input
                  type="color"
                  value={newSubColour}
                  onChange={(e) => setNewSubColour(e.target.value)}
                  className="w-8 h-8 rounded-lg border-none cursor-pointer bg-transparent"
                />

                <button
                  type="submit"
                  disabled={!newSubName.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>

            {/* Current Subjects List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {subjectsList.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono text-slate-400">{idx + 1}.</span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: s.colour }}
                    />
                    <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">{s.plannedVideoHours}h planned</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(s.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition"
                      title="Remove subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={subjectsList.length === 0}
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-sm transition active:scale-95"
              >
                <span>Preview Schedule</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Timeline & Schedule Preview */}
        {step === 3 && (
          <div className="space-y-4 pt-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Automated Schedule Preview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review the calculated start and end dates for each subject before generating your new plan.
              </p>
            </div>

            {/* Timeline Breakdown Cards */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {scheduledSubjects.map((sub) => {
                const subDays = calculateDaysBetween(sub.startDate, sub.endDate);

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.colour }}
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {sub.name}
                        </span>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {sub.plannedVideoHours} hrs target
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:justify-end">
                      <div className="font-mono text-slate-600 dark:text-slate-300">
                        {formatDisplayDate(sub.startDate)} &rarr; {formatDisplayDate(sub.endDate)}
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300">
                        {subDays} Days
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning Note */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
              <span className="font-bold">Notice:</span> Generating this new plan will configure your tracker dates ({startDate} to {endDate}) and focus subjects according to this timeline.
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleGeneratePlan}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Generate Plan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
