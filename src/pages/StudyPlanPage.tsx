import React, { useState, useMemo } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { Subject } from '../types';
import { generateDateRange, formatDisplayDate, getTodayDateString } from '../utils/dateUtils';
import {
  calculateSubjectStudyPlanMetrics,
  calculateStudyPlanTotals,
  SubjectStudyPlanMetrics,
} from '../utils/calculations';
import { ReplanModal } from '../components/studyPlan/ReplanModal';
import { showToast } from '../store/useToastStore';
import {
  GraduationCap,
  Clock,
  RotateCcw,
  Video,
  Code2,
  Award,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Check,
} from 'lucide-react';

export const StudyPlanPage: React.FC = () => {
  const {
    subjects,
    topics,
    dayPlans,
    settings,
    updateSubject,
    replanSubject,
  } = usePlannerStore();

  const todayStr = getTodayDateString();

  // All tracker dates
  const allTrackerDates = useMemo(() => {
    return generateDateRange(settings.startDate, settings.endDate);
  }, [settings.startDate, settings.endDate]);

  // Re-plan Modal state
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);
  const [replanTargetSubjectId, setReplanTargetSubjectId] = useState<string | undefined>();

  // Inline editing state for video hours and notes
  const [editingVideoHoursSubjectId, setEditingVideoHoursSubjectId] = useState<string | null>(null);
  const [tempVideoHours, setTempVideoHours] = useState<number>(0);

  const [editingNotesSubjectId, setEditingNotesSubjectId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const [editingTestSubjectId, setEditingTestSubjectId] = useState<string | null>(null);
  const [tempTestDesc, setTempTestDesc] = useState<string>('');

  // Calculate metrics per subject
  const subjectMetricsList: SubjectStudyPlanMetrics[] = useMemo(() => {
    return subjects.map((sub) =>
      calculateSubjectStudyPlanMetrics(
        sub,
        dayPlans,
        topics,
        allTrackerDates,
        settings.studyHoursWeekday,
        settings.studyHoursWeekend
      )
    );
  }, [
    subjects,
    dayPlans,
    topics,
    allTrackerDates,
    settings.studyHoursWeekday,
    settings.studyHoursWeekend,
  ]);

  // Calculate totals across all subjects
  const totals = useMemo(() => {
    return calculateStudyPlanTotals(
      subjectMetricsList,
      allTrackerDates,
      settings.studyHoursWeekday,
      settings.studyHoursWeekend
    );
  }, [
    subjectMetricsList,
    allTrackerDates,
    settings.studyHoursWeekday,
    settings.studyHoursWeekend,
  ]);

  // Handle inline video hours save
  const handleSaveVideoHours = (subject: Subject) => {
    updateSubject({
      ...subject,
      plannedVideoHours: Math.max(0, Number(tempVideoHours)),
    });
    setEditingVideoHoursSubjectId(null);
    showToast({
      type: 'success',
      title: 'Video Hours Updated',
      message: `${subject.name} video hours set to ${tempVideoHours}h.`,
    });
  };

  // Handle inline notes save
  const handleSaveNotes = (subject: Subject) => {
    updateSubject({
      ...subject,
      notes: tempNotes.trim() ? tempNotes.trim() : undefined,
    });
    setEditingNotesSubjectId(null);
    showToast({
      type: 'info',
      title: 'Notes Saved',
      message: `${subject.name} notes updated.`,
    });
  };

  // Handle inline test description save
  const handleSaveTestDesc = (subject: Subject) => {
    updateSubject({
      ...subject,
      testDescription: tempTestDesc.trim() ? tempTestDesc.trim() : undefined,
    });
    setEditingTestSubjectId(null);
    showToast({
      type: 'info',
      title: 'Test Description Saved',
      message: `${subject.name} test description updated.`,
    });
  };

  // Handle Re-plan execution
  const handleApplyReplan = (
    subjectId: string,
    newStartDate: string,
    newEndDate: string,
    newPlannedVideoHours: number,
    redistributeTopics: boolean,
    cascadeSubsequent: boolean
  ) => {
    replanSubject(
      subjectId,
      newStartDate,
      newEndDate,
      newPlannedVideoHours,
      redistributeTopics,
      cascadeSubsequent
    );
    showToast({
      type: 'success',
      title: 'Schedule Re-planned',
      message: `Updated timeline applied.${redistributeTopics ? ' Syllabus topics redistributed.' : ''}`,
    });
  };

  // Status helper for Planned vs Actual
  const getSubjectStatusBadge = (metrics: SubjectStudyPlanMetrics) => {
    if (metrics.progressPercentage >= 100) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>Completed</span>
        </span>
      );
    }
    if (todayStr >= metrics.startDate && todayStr <= metrics.endDate) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 animate-pulse">
          <span>Active Focus</span>
        </span>
      );
    }
    if (todayStr > metrics.endDate) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3" />
          <span>Behind Schedule</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <span>Upcoming</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-500" />
            Study Plan & Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Compare planned vs actual study hours, break down video and coding practice, and dynamically re-plan dates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setReplanTargetSubjectId(undefined);
              setIsReplanModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-sm transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Re-plan Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Planned Study Hours */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Planned Study Hours</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">
            {totals.totalPlannedStudyHours}h
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Matches tracker: {totals.trackerTotalPlannedStudyHours}h</span>
          </div>
        </div>

        {/* Actual Study Hours Done */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Actual Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {totals.totalActualStudyHours}h
          </div>
          <div className="text-[11px] text-slate-400">
            {totals.overallProgressPercentage}% of planned hours
          </div>
        </div>

        {/* Video Lectures Allocation */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Planned Video Hours</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-500 font-mono">
            {totals.totalVideoHours}h
          </div>
          <div className="text-[11px] text-slate-400">
            Across {subjects.length} subjects
          </div>
        </div>

        {/* Practical & Coding Allocation */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Code & Written Hours</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-500 font-mono">
            {(totals.totalCodingHours + totals.totalWrittenHours).toFixed(1)}h
          </div>
          <div className="text-[11px] text-slate-400">
            {totals.totalCodingHours}h code · {totals.totalWrittenHours}h written
          </div>
        </div>
      </div>

      {/* Hours Distribution Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-200">Study Hours Distribution</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Video ({totals.totalVideoHours}h)
            </span>
            <span className="flex items-center gap-1.5 text-blue-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Coding ({totals.totalCodingHours}h)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Written ({totals.totalWrittenHours}h)
            </span>
          </div>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          {totals.totalPlannedStudyHours > 0 && (
            <>
              <div
                style={{ width: `${(totals.totalVideoHours / totals.totalPlannedStudyHours) * 100}%` }}
                className="h-full bg-amber-500 transition-all duration-500"
                title={`Video: ${totals.totalVideoHours}h`}
              />
              <div
                style={{ width: `${(totals.totalCodingHours / totals.totalPlannedStudyHours) * 100}%` }}
                className="h-full bg-blue-500 transition-all duration-500"
                title={`Coding: ${totals.totalCodingHours}h`}
              />
              <div
                style={{ width: `${(totals.totalWrittenHours / totals.totalPlannedStudyHours) * 100}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
                title={`Written: ${totals.totalWrittenHours}h`}
              />
            </>
          )}
        </div>
      </div>

      {/* Main Study Plan Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Header */}
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5 min-w-[150px]">Subject</th>
                <th className="px-3 py-3.5 min-w-[140px]">Date Range</th>
                <th className="px-3 py-3.5 text-center min-w-[100px]">Planned (Tracker)</th>
                <th className="px-3 py-3.5 text-center min-w-[100px]">Video Hours</th>
                <th className="px-3 py-3.5 text-center min-w-[90px]">Coding Hours</th>
                <th className="px-3 py-3.5 text-center min-w-[90px]">Written Hours</th>
                <th className="px-4 py-3.5 min-w-[180px]">Mock Test Description</th>
                <th className="px-4 py-3.5 min-w-[140px]">Notes</th>
                <th className="px-4 py-3.5 min-w-[140px]">Planned vs Actual</th>
                <th className="px-3 py-3.5 text-center min-w-[90px]">Action</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {subjectMetricsList.map((metrics) => {
                const sub = subjects.find((s) => s.id === metrics.subjectId)!;
                const isEditingVideo = editingVideoHoursSubjectId === sub.id;
                const isEditingNotes = editingNotesSubjectId === sub.id;
                const isEditingTest = editingTestSubjectId === sub.id;

                return (
                  <tr
                    key={metrics.subjectId}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    {/* Subject Name & Color Dot */}
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: metrics.colour }}
                        />
                        <span className="truncate">{metrics.subjectName}</span>
                      </div>
                    </td>

                    {/* Dates & Day Count */}
                    <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">
                      <div>
                        {formatDisplayDate(metrics.startDate)} — {formatDisplayDate(metrics.endDate)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {metrics.dayCount} days scheduled
                      </span>
                    </td>

                    {/* Planned Study Hours (from tracker) */}
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {metrics.plannedStudyHours}h
                    </td>

                    {/* Video Hours (Editable Inline) */}
                    <td className="px-3 py-3 text-center font-mono">
                      {isEditingVideo ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={tempVideoHours}
                            onChange={(e) => setTempVideoHours(Number(e.target.value))}
                            className="w-14 text-center font-mono text-xs px-1 py-0.5 rounded border border-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveVideoHours(sub);
                              if (e.key === 'Escape') setEditingVideoHoursSubjectId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveVideoHours(sub)}
                            className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVideoHoursSubjectId(sub.id);
                            setTempVideoHours(sub.plannedVideoHours);
                          }}
                          className="group inline-flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition"
                          title="Click to edit video hours"
                        >
                          <span className="text-amber-500 font-semibold">{metrics.plannedVideoHours}h</span>
                          <Edit2 className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                      )}
                    </td>

                    {/* Coding Hours (Calculated) */}
                    <td className="px-3 py-3 text-center font-mono text-blue-500 font-medium">
                      {metrics.codingHours}h
                    </td>

                    {/* Written Hours (Calculated) */}
                    <td className="px-3 py-3 text-center font-mono text-emerald-500 font-medium">
                      {metrics.writtenHours}h
                    </td>

                    {/* Mock Test Description (Editable Inline) */}
                    <td className="px-4 py-3">
                      {isEditingTest ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempTestDesc}
                            onChange={(e) => setTempTestDesc(e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded border border-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTestDesc(sub);
                              if (e.key === 'Escape') setEditingTestSubjectId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTestDesc(sub)}
                            className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingTestSubjectId(sub.id);
                            setTempTestDesc(sub.testDescription || metrics.testDescription);
                          }}
                          className="cursor-pointer group flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition"
                          title="Click to edit test description"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="truncate max-w-[200px]">{metrics.testDescription}</span>
                          <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </div>
                      )}
                    </td>

                    {/* Notes (Editable Inline) */}
                    <td className="px-4 py-3">
                      {isEditingNotes ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            className="w-full text-xs px-2 py-1 rounded border border-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveNotes(sub);
                              if (e.key === 'Escape') setEditingNotesSubjectId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveNotes(sub)}
                            className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10 shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNotesSubjectId(sub.id);
                            setTempNotes(sub.notes || '');
                          }}
                          className="cursor-pointer group flex items-center justify-between text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                          title="Click to edit notes"
                        >
                          <span className="truncate max-w-[130px]">
                            {metrics.notes || <span className="italic text-slate-400">Add notes...</span>}
                          </span>
                          <Edit2 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1" />
                        </div>
                      )}
                    </td>

                    {/* Planned vs Actual */}
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {metrics.actualStudyHours}h / {metrics.plannedStudyHours}h
                          </span>
                          {getSubjectStatusBadge(metrics)}
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, metrics.progressPercentage)}%` }}
                            className={`h-full transition-all duration-500 ${
                              metrics.progressPercentage >= 100
                                ? 'bg-emerald-500'
                                : 'bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action: Re-plan */}
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setReplanTargetSubjectId(sub.id);
                          setIsReplanModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 transition"
                        title={`Re-plan ${sub.name}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer Totals */}
            <tfoot className="bg-slate-100/90 dark:bg-slate-900/90 font-bold border-t-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <tr>
                <td className="px-4 py-3">
                  <span>Total Schedule</span>
                </td>
                <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">
                  {totals.totalDays} days
                </td>
                <td className="px-3 py-3 text-center font-mono text-emerald-600 dark:text-emerald-400">
                  {totals.totalPlannedStudyHours}h
                </td>
                <td className="px-3 py-3 text-center font-mono text-amber-500">
                  {totals.totalVideoHours}h
                </td>
                <td className="px-3 py-3 text-center font-mono text-blue-500">
                  {totals.totalCodingHours}h
                </td>
                <td className="px-3 py-3 text-center font-mono text-emerald-500">
                  {totals.totalWrittenHours}h
                </td>
                <td className="px-4 py-3 text-slate-400 font-normal">
                  Mock assessments planned
                </td>
                <td className="px-4 py-3 text-slate-400 font-normal">
                  —
                </td>
                <td className="px-4 py-3 font-mono">
                  <span className="text-emerald-500">{totals.totalActualStudyHours}h</span> / {totals.totalPlannedStudyHours}h ({totals.overallProgressPercentage}%)
                </td>
                <td className="px-3 py-3 text-center text-slate-400 font-normal">
                  —
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Re-Plan Modal */}
      <ReplanModal
        subjects={subjects}
        initialSubjectId={replanTargetSubjectId}
        isOpen={isReplanModalOpen}
        onClose={() => setIsReplanModalOpen(false)}
        onApplyReplan={handleApplyReplan}
        studyHoursWeekday={settings.studyHoursWeekday}
        studyHoursWeekend={settings.studyHoursWeekend}
      />
    </div>
  );
};
