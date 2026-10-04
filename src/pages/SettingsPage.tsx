import React, { useState, useRef, useMemo } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { showToast } from '../store/useToastStore';
import { PlannerData } from '../types';
import { calculateDaysBetween, generateDateRange, getTodayDateString } from '../utils/dateUtils';
import { validatePlannerBackup, downloadBackupFile, getBackupFilename } from '../utils/backupUtils';
import {
  exportTrackerToExcel,
  generateTrackerCSV,
  generateSyllabusCSV,
  generateAssignmentsCSV,
  generateResearchCSV,
  downloadCsvFile,
} from '../utils/exportUtils';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { PlanWizardModal } from '../components/settings/PlanWizardModal';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  RotateCcw,
  Trash2,
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Download,
  Upload,
  Clock,
  Flame,
  Database,
  FileSpreadsheet,
  Wand2,
  Volume2,
  VolumeX,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendRoutineNotification,
  playChimeSound,
} from '../utils/notificationUtils';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { usePwaInstall } from '../hooks/usePwaInstall';

export const SettingsPage: React.FC = () => {
  const store = usePlannerStore();
  const {
    settings,
    setSettings,
    setTheme,
    resetToSeedData,
    clearAllData,
    importData,
    taskTemplates,
    categories,
    routineSlots,
    subjects,
    topics,
    dayPlans,
    milestones,
    assignments,
    researchEntries,
    savedViews,
  } = store;

  // Tabs: 'setup' | 'backup' | 'appearance' | 'danger'
  const [activeTab, setActiveTab] = useState<'setup' | 'backup' | 'appearance' | 'danger'>('setup');

  // Plan Setup Form State
  const [formStartDate, setFormStartDate] = useState(settings.startDate);
  const [formEndDate, setFormEndDate] = useState(settings.endDate);
  const [formStudyWeekday, setFormStudyWeekday] = useState(settings.studyHoursWeekday);
  const [formStudyWeekend, setFormStudyWeekend] = useState(settings.studyHoursWeekend);
  const [formResearchHours, setFormResearchHours] = useState(settings.researchHoursPerSession);
  const [formStrongThreshold, setFormStrongThreshold] = useState(settings.strongDayThreshold);
  const [formWeekStartsOn, setFormWeekStartsOn] = useState<0 | 1>(settings.weekStartsOn ?? 1);

  // File Import State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImportData, setPendingImportData] = useState<PlannerData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Confirmation Modals State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Network & PWA State
  const { isOnline } = useNetworkStatus();
  const { canInstall, promptInstall, isInstalled } = usePwaInstall();
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      setSettings({ ...settings, notificationsEnabled: true });
      showToast({
        type: 'success',
        title: 'Notifications Enabled',
        message: 'Browser desktop notifications have been permitted.',
      });
    } else if (res === 'denied') {
      showToast({
        type: 'error',
        title: 'Notifications Denied',
        message: 'Please enable notifications in your browser site permissions.',
      });
    }
  };

  const handleSendTestNotification = () => {
    playChimeSound();
    const sent = sendRoutineNotification(
      'StudyFlow Reminder (Test)',
      'Your routine notifications and study audio chimes are working smoothly!',
      { playSound: settings.soundEnabled !== false }
    );
    showToast({
      type: 'info',
      title: 'Test Alert Triggered',
      message: sent
        ? 'Desktop notification and study chime dispatched.'
        : 'Study chime played. Enable browser notifications for desktop popups.',
    });
  };

  // Days count calculation
  const totalPlanDays = useMemo(
    () => calculateDaysBetween(formStartDate, formEndDate),
    [formStartDate, formEndDate]
  );
  const isDateRangeValid = formStartDate <= formEndDate && totalPlanDays > 0;

  // Check if form has unsaved changes
  const isFormDirty =
    formStartDate !== settings.startDate ||
    formEndDate !== settings.endDate ||
    formStudyWeekday !== settings.studyHoursWeekday ||
    formStudyWeekend !== settings.studyHoursWeekend ||
    formResearchHours !== settings.researchHoursPerSession ||
    formStrongThreshold !== settings.strongDayThreshold ||
    formWeekStartsOn !== (settings.weekStartsOn ?? 1);

  // Full PlannerData object for export
  const fullBackupData: PlannerData = useMemo(() => {
    return {
      schemaVersion: 1,
      settings,
      categories,
      taskTemplates,
      routineSlots,
      subjects,
      topics,
      dayPlans,
      milestones,
      assignments,
      researchEntries,
      savedViews,
    };
  }, [
    settings,
    categories,
    taskTemplates,
    routineSlots,
    subjects,
    topics,
    dayPlans,
    milestones,
    assignments,
    researchEntries,
    savedViews,
  ]);

  // Handle saving Plan Setup
  const handleSavePlanSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDateRangeValid) {
      showToast({
        type: 'error',
        title: 'Invalid Date Window',
        message: 'Plan Start Date must be on or before End Date.',
      });
      return;
    }

    setSettings({
      startDate: formStartDate,
      endDate: formEndDate,
      studyHoursWeekday: Math.max(1, Number(formStudyWeekday)),
      studyHoursWeekend: Math.max(1, Number(formStudyWeekend)),
      researchHoursPerSession: Math.max(0, Number(formResearchHours)),
      strongDayThreshold: Math.min(100, Math.max(10, Number(formStrongThreshold))),
      weekStartsOn: formWeekStartsOn,
    });

    showToast({
      type: 'success',
      title: 'Plan Setup Saved',
      message: `Configured ${totalPlanDays} days (${formStartDate} to ${formEndDate}).`,
    });
  };

  // Handle Export Backup JSON
  const handleExportBackup = () => {
    try {
      const filename = getBackupFilename();
      downloadBackupFile(fullBackupData, filename);
      showToast({
        type: 'success',
        title: 'Backup Downloaded',
        message: `Saved ${filename} to your downloads.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: err?.message || 'Could not serialize backup data.',
      });
    }
  };

  // Table Export Handlers
  const handleExportTrackerExcel = () => {
    try {
      const dates = generateDateRange(settings.startDate, settings.endDate);
      const activeTasks = taskTemplates.filter((t) => t.active);
      const filename = `studyflow-tracker-${getTodayDateString()}.xlsx`;
      exportTrackerToExcel(dates, activeTasks, dayPlans, subjects, filename);
      showToast({
        type: 'success',
        title: 'Excel Workbook Exported',
        message: `Saved ${filename} for Microsoft Excel.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Excel Export Failed',
        message: err?.message || 'Could not export tracker spreadsheet.',
      });
    }
  };

  const handleExportTrackerCSV = () => {
    try {
      const dates = generateDateRange(settings.startDate, settings.endDate);
      const activeTasks = taskTemplates.filter((t) => t.active);
      const csv = generateTrackerCSV(dates, activeTasks, dayPlans, subjects);
      const filename = `studyflow-tracker-${getTodayDateString()}.csv`;
      downloadCsvFile(csv, filename);
      showToast({
        type: 'success',
        title: 'Tracker CSV Exported',
        message: `Saved ${filename}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'CSV Export Failed',
        message: err?.message || 'Could not export tracker CSV.',
      });
    }
  };

  const handleExportSyllabusCSV = () => {
    try {
      const csv = generateSyllabusCSV(subjects, topics);
      const filename = `studyflow-syllabus-${getTodayDateString()}.csv`;
      downloadCsvFile(csv, filename);
      showToast({
        type: 'success',
        title: 'Syllabus CSV Exported',
        message: `Saved ${filename}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'CSV Export Failed',
        message: err?.message || 'Could not export syllabus CSV.',
      });
    }
  };

  const handleExportAssignmentsCSV = () => {
    try {
      const csv = generateAssignmentsCSV(assignments, subjects);
      const filename = `studyflow-assignments-${getTodayDateString()}.csv`;
      downloadCsvFile(csv, filename);
      showToast({
        type: 'success',
        title: 'Assignments CSV Exported',
        message: `Saved ${filename}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'CSV Export Failed',
        message: err?.message || 'Could not export assignments CSV.',
      });
    }
  };

  const handleExportResearchCSV = () => {
    try {
      const csv = generateResearchCSV(researchEntries);
      const filename = `studyflow-research-${getTodayDateString()}.csv`;
      downloadCsvFile(csv, filename);
      showToast({
        type: 'success',
        title: 'Research CSV Exported',
        message: `Saved ${filename}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'CSV Export Failed',
        message: err?.message || 'Could not export research CSV.',
      });
    }
  };

  // Handle file chosen from disk
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = validatePlannerBackup(content);

      if (!result.isValid || !result.data) {
        setImportError(result.error || 'Invalid planner backup file.');
        setPendingImportData(null);
        showToast({
          type: 'error',
          title: 'Import Validation Failed',
          message: result.error || 'Corrupt or incompatible JSON schema.',
        });
      } else {
        setImportError(null);
        setPendingImportData(result.data);
        setIsImportModalOpen(true);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read selected file from your device.');
      showToast({
        type: 'error',
        title: 'File Read Error',
        message: 'Could not read local file.',
      });
    };

    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  // Confirm Import Action
  const handleConfirmImport = () => {
    if (!pendingImportData) return;

    importData(pendingImportData);
    // Update local form state to match imported settings
    setFormStartDate(pendingImportData.settings.startDate);
    setFormEndDate(pendingImportData.settings.endDate);
    setFormStudyWeekday(pendingImportData.settings.studyHoursWeekday);
    setFormStudyWeekend(pendingImportData.settings.studyHoursWeekend);
    setFormResearchHours(pendingImportData.settings.researchHoursPerSession);
    setFormStrongThreshold(pendingImportData.settings.strongDayThreshold);
    setFormWeekStartsOn(pendingImportData.settings.weekStartsOn ?? 1);

    showToast({
      type: 'success',
      title: 'Workspace Restored',
      message: `Successfully loaded backup (${pendingImportData.settings.startDate} to ${pendingImportData.settings.endDate}).`,
    });

    setPendingImportData(null);
    setIsImportModalOpen(false);
  };

  // Confirm Reset to Seed Data
  const handleConfirmReset = () => {
    resetToSeedData();
    // Refresh form states to default seed settings
    const defaultData = usePlannerStore.getState();
    setFormStartDate(defaultData.settings.startDate);
    setFormEndDate(defaultData.settings.endDate);
    setFormStudyWeekday(defaultData.settings.studyHoursWeekday);
    setFormStudyWeekend(defaultData.settings.studyHoursWeekend);
    setFormResearchHours(defaultData.settings.researchHoursPerSession);
    setFormStrongThreshold(defaultData.settings.strongDayThreshold);
    setFormWeekStartsOn(defaultData.settings.weekStartsOn ?? 1);

    showToast({
      type: 'success',
      title: 'Seed Data Restored',
      message: 'All default routines, subjects, tasks, and schedules have been reloaded.',
    });
  };

  // Confirm Clear All Data
  const handleConfirmClear = () => {
    clearAllData();
    showToast({
      type: 'warning',
      title: 'All Data Cleared',
      message: 'Workspace wiped. You can restore seed data or import a backup anytime.',
    });
  };

  // Theme Handler
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    showToast({
      type: 'info',
      title: 'Theme Preference Updated',
      message: `Switched interface to ${newTheme} mode.`,
    });
  };

  // Test Toasts
  const testToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const titles = {
      success: 'Action Completed Successfully',
      error: 'Something went wrong',
      warning: 'Please review your input',
      info: 'Information Notice',
    };
    const messages = {
      success: 'Your changes were saved to persistent local storage.',
      error: 'Failed to process request. Please try again.',
      warning: 'Strong day threshold is currently set to 80%.',
      info: 'StudyFlow Planner runs entirely offline in your browser.',
    };

    showToast({
      type,
      title: titles[type],
      message: messages[type],
      duration: 3500,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-emerald-500" />
            Settings & Plan Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure calendar date windows, daily study goals, backup & restore data, and visual preferences.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition active:scale-95 shrink-0"
          >
            <Wand2 className="w-4 h-4 text-emerald-500" />
            <span>Plan Wizard</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition active:scale-95 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (JSON)</span>
          </button>
        </div>
      </div>

      {/* Navigation Segmented Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition shrink-0 ${
            activeTab === 'setup'
              ? 'bg-white dark:bg-[#0c121e] text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Plan Setup & Targets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition shrink-0 ${
            activeTab === 'backup'
              ? 'bg-white dark:bg-[#0c121e] text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Restore</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition shrink-0 ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-[#0c121e] text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>Appearance & Toasts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold transition shrink-0 ${
            activeTab === 'danger'
              ? 'bg-white dark:bg-[#0c121e] text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Danger Zone</span>
        </button>
      </div>

      {/* TAB 1: Plan Setup & Targets */}
      {activeTab === 'setup' && (
        <form onSubmit={handleSavePlanSettings} className="space-y-6">
          {/* Plan Date Window Card */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Plan Calendar Window
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set your study sprint duration. Extending dates preserves existing tracker ticks and initializes new days.
                </p>
              </div>

              {/* Total Days Indicator Pill */}
              <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold shrink-0">
                {isDateRangeValid ? `${totalPlanDays} Days Scheduled` : 'Invalid Range'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Plan Start Date
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Plan End Date
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {!isDateRangeValid && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Start Date cannot be later than End Date.</span>
              </div>
            )}
          </div>

          {/* Daily Study & Research Targets */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Daily Study & Research Targets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target hours used for daily tracker calculations and dashboard KPI metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Weekday Study Goal (Hours/day)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formStudyWeekday}
                  onChange={(e) => setFormStudyWeekday(Number(e.target.value))}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 2 hours</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Weekend Study Goal (Hours/day)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formStudyWeekend}
                  onChange={(e) => setFormStudyWeekend(Number(e.target.value))}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Default: 8 hours</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Research Session Goal (Hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formResearchHours}
                  onChange={(e) => setFormResearchHours(Number(e.target.value))}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Auto-filled on tracker tick</span>
              </div>
            </div>
          </div>

          {/* Performance Thresholds & Calendar Week */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-500" />
                Performance Thresholds & Week Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customize streak criteria and the calendar week starting day.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Strong Day Threshold
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    &ge; {formStrongThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={formStrongThreshold}
                  onChange={(e) => setFormStrongThreshold(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Days with completion % at or above this threshold count toward your Strong Day streak.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Week Starts On
                </label>
                <select
                  value={formWeekStartsOn}
                  onChange={(e) => setFormWeekStartsOn(Number(e.target.value) as 0 | 1)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>Monday (Standard)</option>
                  <option value={0}>Sunday</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used for weekly hours rollups and timetable breakdowns.
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={!isDateRangeValid || !isFormDirty}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none rounded-2xl shadow-sm transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Plan Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Export Backup Card */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-500" />
                  Export Workspace Backup
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Download a complete, offline-compatible JSON archive of all your tasks, routines, syllabus progress, day plans, assignments, and research logs.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Current Workspace Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Routine Slots</span>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {routineSlots.length} slots
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Tracked Tasks</span>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {taskTemplates.length} templates
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Syllabus Topics</span>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {topics.length} topics ({subjects.length} subjects)
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400">Day Tracker History</span>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  {Object.keys(dayPlans).length} days
                </div>
              </div>
            </div>
          </div>

          {/* Table Spreadsheet & CSV Exports Card */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Table Spreadsheet & CSV Exports
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Export individual workspace modules directly into Microsoft Excel (.xlsx) workbooks or clean CSV spreadsheets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {/* Tracker Excel */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Daily Tracker (.xlsx)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Full spreadsheet grid with date rows, focus subjects, habit columns, and task hints.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportTrackerExcel}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>
              </div>

              {/* Tracker CSV */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Tracker Grid (.csv)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Standard comma-separated table of all daily tasks and execution checkmarks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportTrackerCSV}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Syllabus CSV */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-500" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Syllabus Topics (.csv)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Export all subjects, topic matrices, video/code/written checkboxes, and progress %.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportSyllabusCSV}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Assignments CSV */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Assignments (.csv)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Export lab submissions, milestones, priority ratings, and completion status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAssignmentsCSV}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Research CSV */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      Research Log (.csv)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Export date-stamped research investigation notes, session hours, and topic logs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportResearchCSV}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Import Restore Card */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-500" />
                Restore from Backup File
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a previously saved <span className="font-mono text-slate-600 dark:text-slate-300">.json</span> file to restore your entire planner state.
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* File Dropzone Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/40 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center cursor-pointer transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition duration-300">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Click to browse or drop backup JSON file here
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Files are validated on your device before applying. Your current data is only overwritten upon confirmation.
              </p>
            </div>

            {/* Error Message */}
            {importError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Validation Error:</span>
                  <p>{importError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Appearance & Toasts */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Theme Preference */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Interface Appearance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose your preferred theme mode. Persisted directly in local storage.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  settings.theme === 'light'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Sun className="w-5 h-5 mb-1.5 text-amber-500" />
                <span className="text-xs">Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  settings.theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Moon className="w-5 h-5 mb-1.5 text-indigo-400" />
                <span className="text-xs">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  settings.theme === 'system'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Laptop className="w-5 h-5 mb-1.5 text-slate-400" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>

          {/* Routine Slot Desktop Notifications & Audio */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Routine Slot Reminders & Audio
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Scheduled notifications when routine time slots begin, with synthesized Web Audio chimes.
                </p>
              </div>

              {/* Browser Permission Status Badge */}
              <div className="flex items-center gap-2">
                {notificationPermission === 'granted' ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Permission Granted
                  </span>
                ) : notificationPermission === 'denied' ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Permission Blocked
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Permission Pending
                  </span>
                )}
              </div>
            </div>

            {/* Notification Permission Request banner if not granted */}
            {notificationPermission !== 'granted' && isNotificationSupported() && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-amber-700 dark:text-amber-300">
                  <span className="font-semibold">Browser permission required:</span> Allow desktop
                  alerts so StudyFlow can remind you when routine blocks start.
                </div>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 transition"
                >
                  Request Permission
                </button>
              </div>
            )}

            {/* Notification Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Global Routine Notifications Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101726] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                    {settings.notificationsEnabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Routine Notifications
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Notify when slots are due
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      notificationsEnabled: !settings.notificationsEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.notificationsEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={Boolean(settings.notificationsEnabled)}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Chime Toggle */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101726] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                    {settings.soundEnabled !== false ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Study Audio Chime
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Harmonic Web Audio ping
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      soundEnabled: settings.soundEnabled === false ? true : false,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settings.soundEnabled !== false
                      ? 'bg-indigo-500'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={settings.soundEnabled !== false}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      settings.soundEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Test Trigger Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSendTestNotification}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
              >
                <Volume2 className="w-4 h-4 text-indigo-500" />
                <span>Send Test Alert & Sound</span>
              </button>
            </div>
          </div>

          {/* Progressive Web App (PWA) & Offline Access */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  Progressive Web App & Offline Ready
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Service worker cached application shell enables 100% offline access and desktop/mobile installation.
                </p>
              </div>

              {/* Live Network Status Indicator */}
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" />
                    Online
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                    <WifiOff className="w-3.5 h-3.5" />
                    Offline Mode Active
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101726] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isInstalled ? (
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> App Installed
                    </span>
                  ) : (
                    <span>Standalone Web Application</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isInstalled
                    ? 'StudyFlow is running in standalone desktop/mobile app mode.'
                    : 'Install StudyFlow to your home screen or dock for distraction-free offline studying.'}
                </p>
              </div>

              {canInstall && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition shrink-0"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Install StudyFlow App</span>
                </button>
              )}
            </div>
          </div>

          {/* Toast Notification Tester */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-sm space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-500" />
                Toast Notification Stack Tester
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify stacked toast popups and animations across all 4 notification types.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => testToast('success')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success Toast</span>
              </button>
              <button
                type="button"
                onClick={() => testToast('info')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Info Toast</span>
              </button>
              <button
                type="button"
                onClick={() => testToast('warning')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Warning Toast</span>
              </button>
              <button
                type="button"
                onClick={() => testToast('error')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Error Toast</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Danger Zone & Workspace Reset
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Restoring defaults or clearing data affects all components immediately. Always export a backup first if you want to keep your work.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Reset to Seed Data */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-emerald-500" />
                    Reset to Initial Seed Data
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Restores the default 27-day routine, syllabus subjects, topic checklists, and sample milestones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Reset Seed Data
                </button>
              </div>

              {/* Clear All Data */}
              <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    Clear All Workspace Data
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Completely erases all routines, task templates, tracker history, and subjects from local storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition active:scale-95"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Import Backup */}
      {pendingImportData && (
        <ConfirmationModal
          isOpen={isImportModalOpen}
          title="Restore Workspace from Backup?"
          description={`Restoring this file will overwrite your current workspace with ${calculateDaysBetween(
            pendingImportData.settings.startDate,
            pendingImportData.settings.endDate
          )} days scheduled (${pendingImportData.settings.startDate} to ${
            pendingImportData.settings.endDate
          }), ${pendingImportData.subjects.length} subjects, and ${
            pendingImportData.taskTemplates.length
          } tasks.`}
          confirmLabel="Overwrite & Restore"
          cancelLabel="Cancel"
          isDanger={true}
          onConfirm={handleConfirmImport}
          onClose={() => {
            setIsImportModalOpen(false);
            setPendingImportData(null);
          }}
        />
      )}

      {/* Confirmation Modal: Reset to Seed Data */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset to Initial Seed Data?"
        description="This will replace all your current custom tasks, routine slots, syllabus progress, and tracker ticks with the original sample seed dataset."
        confirmLabel="Reset Everything"
        cancelLabel="Keep Current Data"
        isDanger={false}
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* Confirmation Modal: Clear All Data */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Permanently Clear All Workspace Data?"
        description="This action cannot be undone. All routine timetables, task templates, tracker check history, syllabus progress, and assignments will be wiped clean."
        confirmLabel="Wipe Workspace"
        cancelLabel="Cancel"
        isDanger={true}
        requireTextMatch="CLEAR"
        onConfirm={handleConfirmClear}
        onClose={() => setIsClearModalOpen(false)}
      />

      {/* Plan Wizard Modal */}
      <PlanWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
