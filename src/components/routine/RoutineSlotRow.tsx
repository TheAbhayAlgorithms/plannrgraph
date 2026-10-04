import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RoutineSlot, Category, TaskTemplate } from '../../types';
import { calculateDurationMinutes, formatMinutesToHours } from '../../utils/dateUtils';
import { OverlapConflict } from '../../utils/routineCalculations';
import {
  GripVertical,
  Copy,
  Trash2,
  AlertTriangle,
  Link as LinkIcon,
  Bell,
  BellOff,
} from 'lucide-react';

interface RoutineSlotRowProps {
  slot: RoutineSlot;
  categories: Category[];
  taskTemplates: TaskTemplate[];
  conflicts?: OverlapConflict[];
  onUpdate: (updatedSlot: RoutineSlot) => void;
  onDuplicate: (slotId: string) => void;
  onDelete: (slotId: string) => void;
}

export const RoutineSlotRow: React.FC<RoutineSlotRowProps> = ({
  slot,
  categories,
  taskTemplates,
  conflicts,
  onUpdate,
  onDuplicate,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const durationMinutes = calculateDurationMinutes(slot.startTime, slot.endTime);
  const formattedDuration = formatMinutesToHours(durationMinutes);
  const currentCategory = categories.find((c) => c.id === slot.categoryId);
  const hasConflicts = conflicts && conflicts.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col md:flex-row md:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
        hasConflicts
          ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/15'
          : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
      }`}
    >
      {/* Left side: Drag Handle & Times */}
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder slot"
          className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 p-1 -ml-1 rounded-lg transition"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Time Inputs */}
        <div className="flex items-center gap-1.5 font-mono">
          <input
            type="time"
            value={slot.startTime}
            onChange={(e) => onUpdate({ ...slot, startTime: e.target.value })}
            className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="time"
            value={slot.endTime}
            onChange={(e) => onUpdate({ ...slot, endTime: e.target.value })}
            className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
          />
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {formattedDuration}
          </span>
        </div>
      </div>

      {/* Center: Title & Notes */}
      <div className="flex-1 my-2.5 md:my-0 md:mx-4 space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={slot.title}
            onChange={(e) => onUpdate({ ...slot, title: e.target.value })}
            placeholder="Slot title..."
            className="flex-1 text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5 transition"
          />
          {hasConflicts && (
            <span
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0"
              title={`Overlaps with: ${conflicts.map((c) => `${c.conflictingSlotTitle} (${c.conflictingTime})`).join(', ')}`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Time Overlap</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: currentCategory?.colour ?? '#94a3b8' }}
            />
            <select
              value={slot.categoryId}
              onChange={(e) => onUpdate({ ...slot, categoryId: e.target.value })}
              className="text-xs bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Linked Task Template Dropdown */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 text-xs">
            <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
            <select
              value={slot.linkedTaskTemplateId ?? ''}
              onChange={(e) =>
                onUpdate({
                  ...slot,
                  linkedTaskTemplateId: e.target.value ? e.target.value : undefined,
                })
              }
              className="bg-transparent text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="" className="dark:bg-slate-900">
                No linked task
              </option>
              {taskTemplates.map((task) => (
                <option key={task.id} value={task.id} className="dark:bg-slate-900">
                  Link: {task.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes Input */}
          <input
            type="text"
            value={slot.notes ?? ''}
            onChange={(e) => onUpdate({ ...slot, notes: e.target.value })}
            placeholder="Add notes / review instructions..."
            className="flex-1 min-w-[140px] text-xs text-slate-500 dark:text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5 transition"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() =>
            onUpdate({
              ...slot,
              notificationEnabled: slot.notificationEnabled === false ? true : false,
            })
          }
          className={`p-1.5 rounded-lg transition ${
            slot.notificationEnabled === false
              ? 'text-slate-300 dark:text-slate-600 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
          }`}
          title={
            slot.notificationEnabled === false
              ? 'Enable reminder for this slot'
              : 'Reminders active for this slot'
          }
          aria-label={
            slot.notificationEnabled === false
              ? 'Enable reminder for this slot'
              : 'Disable reminder for this slot'
          }
        >
          {slot.notificationEnabled === false ? (
            <BellOff className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onDuplicate(slot.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Duplicate slot"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(slot.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
          title="Delete slot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
