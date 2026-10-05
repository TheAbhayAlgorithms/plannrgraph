import React, { useRef, useState } from 'react';
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
  const [justTicked, setJustTicked] = useState(false);

  const handleClick = () => {
    if (!isDone) {
      setJustTicked(true);
      setTimeout(() => setJustTicked(false), 500);
    }
    onToggle();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      onEditHint();
    }, 600);
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
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`group relative h-12 min-w-[110px] sm:min-w-[130px] px-2 py-1 flex items-center justify-center text-center cursor-pointer select-none transition-all duration-150 outline-none active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:z-10 ${
        status === 'done'
          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-medium hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30'
          : status === 'missed'
          ? 'bg-rose-50/30 dark:bg-rose-950/10 text-rose-500/80 hover:bg-rose-50/70 dark:hover:bg-rose-950/20'
          : 'bg-white dark:bg-[#0c121e] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-600 dark:hover:text-slate-300'
      } ${justTicked ? 'animate-tick-ripple ring-2 ring-emerald-500/40' : ''} border-r border-b border-slate-200/60 dark:border-slate-800/60`}
    >
      {/* State Rendering */}
      {status === 'done' ? (
        <div className="flex flex-col items-center justify-center">
          <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shadow-xs animate-check-pop">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate max-w-[100px] mt-0.5 leading-none font-medium transition-colors">
            {displayHint}
          </span>
        </div>
      ) : status === 'missed' ? (
        <div className="flex flex-col items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
          <div className="w-4 h-4 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <XIcon className="w-3 h-3 stroke-[2]" />
          </div>
          <span className="text-[10px] text-rose-400 truncate max-w-[100px] mt-0.5 leading-none line-through">
            {displayHint}
          </span>
        </div>
      ) : (
        /* Pending: Clean minimal label with gentle hover feedback */
        <div className="flex items-center justify-center gap-1">
          <span className="text-[11px] text-slate-400/90 dark:text-slate-500 truncate max-w-[110px] leading-tight px-1 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            {displayHint}
          </span>
        </div>
      )}

      {/* Edit Hint Pencil (Hover on desktop) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEditHint();
        }}
        aria-label="Edit hint"
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 p-1 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        title="Edit cell hint label"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
};
