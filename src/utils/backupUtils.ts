import { PlannerData } from '../types';
import { getTodayDateString } from './dateUtils';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: PlannerData;
}

/**
 * Validates raw JSON string against the PlannerData schema.
 */
export function validatePlannerBackup(rawJson: string): ValidationResult {
  try {
    if (!rawJson || typeof rawJson !== 'string') {
      return { isValid: false, error: 'File content is empty or unreadable.' };
    }

    const parsed = JSON.parse(rawJson);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { isValid: false, error: 'Backup root must be a valid JSON object.' };
    }

    // Settings validation
    if (!parsed.settings || typeof parsed.settings !== 'object') {
      return { isValid: false, error: 'Missing or invalid "settings" object in backup.' };
    }

    if (!parsed.settings.startDate || !parsed.settings.endDate) {
      return { isValid: false, error: 'Settings must contain both "startDate" and "endDate".' };
    }

    // Required array collections
    const requiredArrays: (keyof PlannerData)[] = [
      'categories',
      'taskTemplates',
      'routineSlots',
      'subjects',
      'topics',
      'milestones',
      'assignments',
    ];

    for (const key of requiredArrays) {
      if (!Array.isArray(parsed[key])) {
        return { isValid: false, error: `Missing or invalid "${key}" collection (expected array).` };
      }
    }

    // DayPlans dictionary check
    if (!parsed.dayPlans || typeof parsed.dayPlans !== 'object' || Array.isArray(parsed.dayPlans)) {
      return { isValid: false, error: 'Missing or invalid "dayPlans" dictionary.' };
    }

    // Normalized PlannerData
    const normalizedData: PlannerData = {
      schemaVersion: Number(parsed.schemaVersion) || 1,
      settings: {
        startDate: String(parsed.settings.startDate),
        endDate: String(parsed.settings.endDate),
        theme: parsed.settings.theme === 'light' || parsed.settings.theme === 'dark' ? parsed.settings.theme : 'light',
        studyHoursWeekday: Number(parsed.settings.studyHoursWeekday) || 2,
        studyHoursWeekend: Number(parsed.settings.studyHoursWeekend) || 8,
        researchHoursPerSession: Number(parsed.settings.researchHoursPerSession) || 2,
        strongDayThreshold: Number(parsed.settings.strongDayThreshold) || 80,
        weekStartsOn: parsed.settings.weekStartsOn === 0 ? 0 : 1,
      },
      categories: parsed.categories,
      taskTemplates: parsed.taskTemplates,
      routineSlots: parsed.routineSlots,
      subjects: parsed.subjects,
      topics: parsed.topics,
      dayPlans: parsed.dayPlans,
      milestones: parsed.milestones,
      assignments: parsed.assignments,
      researchEntries: Array.isArray(parsed.researchEntries) ? parsed.researchEntries : [],
      savedViews: Array.isArray(parsed.savedViews) ? parsed.savedViews : [],
    };

    return { isValid: true, data: normalizedData };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Corrupt JSON syntax: ${err?.message || 'Unable to parse file content.'}`,
    };
  }
}

/**
 * Generates standard backup filename with current date stamp.
 */
export function getBackupFilename(): string {
  const todayStr = getTodayDateString();
  return `plannrgraph-backup-${todayStr}.json`;
}

/**
 * Triggers a browser download for the provided PlannerData JSON string.
 */
export function downloadBackupFile(data: PlannerData, filename = getBackupFilename()): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
