import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { usePlannerStore } from '../store/usePlannerStore';
import { DayType } from '../types';
import { RoutineSlotRow } from '../components/routine/RoutineSlotRow';
import { AddSlotModal } from '../components/routine/AddSlotModal';
import { CategoryManagerModal } from '../components/routine/CategoryManagerModal';
import {
  detectSlotOverlaps,
  calculateRoutineTotal,
} from '../utils/routineCalculations';
import { showToast } from '../store/useToastStore';
import {
  Clock,
  Plus,
  Copy,
  Palette,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const RoutinePage: React.FC = () => {
  const {
    routineSlots,
    categories,
    taskTemplates,
    updateRoutineSlot,
    deleteRoutineSlot,
    duplicateRoutineSlot,
    copyWeekdayToWeekend,
    reorderRoutineSlots,
    addRoutineSlot,
  } = usePlannerStore();

  const [activeTab, setActiveTab] = useState<DayType>('weekday');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Filter slots for the active day type
  const currentSlots = useMemo(() => {
    return routineSlots.filter((slot) => slot.dayType === activeTab);
  }, [routineSlots, activeTab]);

  // Calculations for conflicts and totals
  const conflicts = useMemo(() => {
    return detectSlotOverlaps(currentSlots);
  }, [currentSlots]);

  const hasAnyConflicts = Object.keys(conflicts).length > 0;

  const totalSummary = useMemo(() => {
    return calculateRoutineTotal(currentSlots);
  }, [currentSlots]);

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentSlots.findIndex((s) => s.id === active.id);
      const newIndex = currentSlots.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(currentSlots, oldIndex, newIndex);
        reorderRoutineSlots(activeTab, reordered);
        showToast({
          type: 'info',
          title: 'Routine Reordered',
          duration: 1500,
        });
      }
    }
  };

  const handleCopyWeekday = () => {
    const count = routineSlots.filter((s) => s.dayType === 'weekday').length;
    if (
      window.confirm(
        `Copy all ${count} weekday routine slots to weekend? This will replace current weekend slots.`
      )
    ) {
      copyWeekdayToWeekend();
      setActiveTab('weekend');
      showToast({
        type: 'success',
        title: 'Routine Copied',
        message: 'All weekday routine slots have been copied to the weekend timetable.',
      });
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    const slot = routineSlots.find((s) => s.id === slotId);
    deleteRoutineSlot(slotId);
    showToast({
      type: 'warning',
      title: 'Slot Removed',
      message: `"${slot?.title ?? 'Slot'}" was deleted from timetable.`,
      duration: 2500,
    });
  };

  const handleDuplicateSlot = (slotId: string) => {
    duplicateRoutineSlot(slotId);
    showToast({
      type: 'success',
      title: 'Slot Duplicated',
      message: 'New copy added to timetable right below.',
      duration: 2000,
    });
  };

  // Find end time of the last slot for convenience when adding next slot
  const lastEndTime = currentSlots[currentSlots.length - 1]?.endTime ?? '08:00';

  return (
    <div className="space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-500" />
            Routine Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Define daily schedules, study slots, and habits with auto-durations and overlap checking.
          </p>
        </div>

        {/* Global Routine Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-500" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={handleCopyWeekday}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Duplicate all weekday slots into weekend"
          >
            <Copy className="w-3.5 h-3.5 text-amber-500" />
            <span>Copy Weekday &rarr; Weekend</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slot</span>
          </button>
        </div>
      </div>

      {/* Weekday / Weekend Tabs & Totals Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 gap-3">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#0c121e] p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setActiveTab('weekday')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'weekday'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekday Routine</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'weekday' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {routineSlots.filter((s) => s.dayType === 'weekday').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('weekend')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'weekend'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Weekend Routine</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'weekend' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {routineSlots.filter((s) => s.dayType === 'weekend').length}
            </span>
          </button>
        </div>

        {/* Scheduled Duration Summary */}
        <div className="flex items-center gap-3 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
          <span>Scheduled Total:</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-md ${
              totalSummary.exceeds24Hours
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {totalSummary.formattedHours}
          </span>
          <span className="text-slate-400">({currentSlots.length} slots)</span>
        </div>
      </div>

      {/* Warning: 24-Hour Exceeded */}
      {totalSummary.exceeds24Hours && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <div>
            <span className="font-bold">Total scheduled time exceeds 24 hours!</span> Currently at{' '}
            {totalSummary.formattedHours} ({totalSummary.totalMinutes} minutes). Please adjust slot
            durations.
          </div>
        </div>
      )}

      {/* Warning: Time Overlaps */}
      {hasAnyConflicts && (
        <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">
              Time conflict detected on {Object.keys(conflicts).length} slot(s):
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300">
              {Object.entries(conflicts).map(([slotId, conflictList]) => {
                const slot = currentSlots.find((s) => s.id === slotId);
                return (
                  <li key={slotId}>
                    <span className="font-semibold">{slot?.title ?? slotId}</span> ({slot?.startTime} -{' '}
                    {slot?.endTime}) overlaps with{' '}
                    {conflictList
                      .map((c) => `"${c.conflictingSlotTitle}" (${c.conflictingTime})`)
                      .join(', ')}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Sortable Routine Slots List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={currentSlots.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {currentSlots.map((slot) => (
              <RoutineSlotRow
                key={slot.id}
                slot={slot}
                categories={categories}
                taskTemplates={taskTemplates}
                conflicts={conflicts[slot.id]}
                onUpdate={updateRoutineSlot}
                onDuplicate={handleDuplicateSlot}
                onDelete={handleDeleteSlot}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Slot Modal */}
      <AddSlotModal
        isOpen={isAddModalOpen}
        dayType={activeTab}
        lastEndTime={lastEndTime}
        categories={categories}
        taskTemplates={taskTemplates}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(newSlot) => {
          addRoutineSlot(newSlot);
          showToast({
            type: 'success',
            title: 'Slot Added',
            message: `"${newSlot.title}" was added to the ${activeTab} timetable.`,
          });
        }}
      />

      {/* Manage Categories Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
