import React, { useRef } from 'react';
import { TaskCellStatus } from '../../types';
import { Check, X as XIcon, Edit2 } from 'lucide-react';

interface TrackerCellProps {
  date: string;
  taskId: string;
  taskName: string;
  isDone: boolean;
  hintLabel?: string;
  status: TaskCellStatus;
  onToggle: () => void;
  onEditHint: () => void;
}

export const TrackerCell: React.FC<TrackerCellProps> = ({
  taskName,
  isDone,
  hintLabel,
  status,
  onToggle,
  onEditHint,
}) => {
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle();
    }
  };

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      onEditHint();
    }, 600); // 600ms long press to trigger hint edit on mobile
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const displayHint = hintLabel || taskName;

  return (
    <div
      tabIndex={0}
      role="checkbox"
      aria-checked={isDone}
      aria-label={`${taskName}: ${isDone ? 'Completed' : status === 'missed' ? 'Missed' : 'Pending'}`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`group relative h-12 min-w-[110px] sm:min-w-[130px] px-2 py-1 flex items-center justify-center text-center cursor-pointer select-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:z-10 ${
        status === 'done'
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border-emerald-500/30 shadow-inner'
          : status === 'missed'
          ? 'bg-rose-50/90 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 hover:bg-rose-100/70'
          : 'bg-white/40 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
      } border-r border-b border-slate-200/70 dark:border-slate-800/80`}
    >
      {/* State Rendering */}
      {status === 'done' ? (
        <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-150">
          <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shadow-sm">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate max-w-[100px] mt-0.5 leading-none font-medium">
            {displayHint}
          </span>
        </div>
      ) : status === 'missed' ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-4 h-4 rounded-md bg-rose-500/20 text-rose-500 flex items-center justify-center">
            <XIcon className="w-3 h-3 stroke-[2.5]" />
          </div>
          <span className="text-[10px] text-rose-400/90 truncate max-w-[100px] mt-0.5 leading-none line-through">
            {displayHint}
          </span>
        </div>
      ) : (
        /* Pending: Faded grey italic hint text */
        <span className="text-[11px] italic text-slate-400 dark:text-slate-500 truncate max-w-[110px] leading-tight px-1">
          {displayHint}
        </span>
      )}

      {/* Edit Hint Pencil (Hover on desktop) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditHint();
        }}
        aria-label="Edit hint"
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 p-1 rounded hover:bg-white/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-sm"
        title="Edit cell hint label"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
};
