import * as XLSX from 'xlsx';
import {
  DayPlan,
  Subject,
  TaskTemplate,
  Topic,
  Assignment,
  ResearchEntry,
} from '../types';
import { getTodayDateString } from './dateUtils';

/**
 * Escapes fields for standard RFC 4180 CSV export.
 */
function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a client-side download of CSV text with UTF-8 BOM so Excel opens with proper encoding.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Daily Tracker to a Microsoft Excel (.xlsx) workbook.
 */
export function exportTrackerToExcel(
  dates: string[],
  tasks: TaskTemplate[],
  dayPlans: Record<string, DayPlan>,
  subjects: Subject[],
  filename = `studyflow-tracker-${getTodayDateString()}.xlsx`
): void {
  const headers = ['Date', 'Day', 'Focus Subject', ...tasks.map((t) => t.name), 'Notes / Hints'];

  const rows: (string | number)[][] = [headers];

  for (const date of dates) {
    const plan = dayPlans[date];
    const subject = subjects.find((s) => s.id === plan?.focusSubjectId);
    const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

    const hintsList: string[] = [];
    const taskValues = tasks.map((t) => {
      const override = plan?.overrides?.[t.id];
      if (override?.hintLabel) {
        hintsList.push(`${t.name}: ${override.hintLabel}`);
      }
      return override?.done ? 'DONE' : 'PENDING';
    });

    rows.push([
      date,
      dayOfWeek,
      subject?.name ?? 'General',
      ...taskValues,
      hintsList.join('; '),
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Column width auto-sizing
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    ...tasks.map(() => ({ wch: 12 })),
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Tracker');
  XLSX.writeFile(workbook, filename);
}

/**
 * Generates CSV string for Daily Tracker grid.
 */
export function generateTrackerCSV(
  dates: string[],
  tasks: TaskTemplate[],
  dayPlans: Record<string, DayPlan>,
  subjects: Subject[]
): string {
  const headers = ['Date', 'Day', 'Focus Subject', ...tasks.map((t) => t.name)];
  const lines: string[] = [headers.map(escapeCsv).join(',')];

  for (const date of dates) {
    const plan = dayPlans[date];
    const subject = subjects.find((s) => s.id === plan?.focusSubjectId);
    const dayOfWeek = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });

    const taskCols = tasks.map((t) => {
      const isDone = plan?.overrides?.[t.id]?.done ?? false;
      return isDone ? 'Done' : 'Not Done';
    });

    lines.push(
      [
        escapeCsv(date),
        escapeCsv(dayOfWeek),
        escapeCsv(subject?.name ?? 'General'),
        ...taskCols.map(escapeCsv),
      ].join(',')
    );
  }

  return lines.join('\r\n');
}

/**
 * Generates CSV string for Syllabus Topics.
 */
export function generateSyllabusCSV(subjects: Subject[], topics: Topic[]): string {
  const headers = ['Subject', 'Topic Title', 'Target Date', 'Is Test', 'Video', 'Code', 'Written', 'Done %'];
  const lines: string[] = [headers.map(escapeCsv).join(',')];

  for (const t of topics) {
    const subject = subjects.find((s) => s.id === t.subjectId);
    let donePercent = 0;
    if (t.isTest) {
      donePercent = t.written ? 100 : 0;
    } else {
      const count = (t.video ? 1 : 0) + (t.code ? 1 : 0) + (t.written ? 1 : 0);
      donePercent = Math.round((count / 3) * 100);
    }

    lines.push(
      [
        escapeCsv(subject?.name ?? 'General'),
        escapeCsv(t.title),
        escapeCsv(t.targetDate),
        escapeCsv(t.isTest ? 'Yes' : 'No'),
        escapeCsv(t.video ? 'Done' : 'Pending'),
        escapeCsv(t.code ? 'Done' : 'Pending'),
        escapeCsv(t.written ? 'Done' : 'Pending'),
        escapeCsv(`${donePercent}%`),
      ].join(',')
    );
  }

  return lines.join('\r\n');
}

/**
 * Generates CSV string for Projects & Assignments.
 */
export function generateAssignmentsCSV(assignments: Assignment[], subjects: Subject[]): string {
  const headers = ['Subject', 'Assignment Title', 'Deadline', 'Priority', 'Status'];
  const lines: string[] = [headers.map(escapeCsv).join(',')];

  for (const a of assignments) {
    const subject = subjects.find((s) => s.id === a.subjectId);
    lines.push(
      [
        escapeCsv(subject?.name ?? 'General'),
        escapeCsv(a.title),
        escapeCsv(a.deadline),
        escapeCsv(a.priority),
        escapeCsv(a.status),
      ].join(',')
    );
  }

  return lines.join('\r\n');
}

/**
 * Generates CSV string for Research Log.
 */
export function generateResearchCSV(entries: ResearchEntry[]): string {
  const headers = ['Date', 'Research Topic', 'Hours Logged', 'Findings & Notes'];
  const lines: string[] = [headers.map(escapeCsv).join(',')];

  for (const r of entries) {
    lines.push(
      [
        escapeCsv(r.date),
        escapeCsv(r.topic),
        escapeCsv(r.hours),
        escapeCsv(r.notes),
      ].join(',')
    );
  }

  return lines.join('\r\n');
}
