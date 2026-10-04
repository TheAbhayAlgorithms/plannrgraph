import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Topic } from '../../types';
import { isPastDate } from '../../utils/dateUtils';
import {
  GripVertical,
  Check,
  Trash2,
  AlertCircle,
  Video,
  Code2,
  FileText,
  Award,
} from 'lucide-react';

interface TopicRowProps {
  topic: Topic;
  todayStr: string;
  onToggleField: (topicId: string, field: 'video' | 'code' | 'written') => void;
  onUpdate: (updatedTopic: Topic) => void;
  onDelete: (topicId: string) => void;
}

export const TopicRow: React.FC<TopicRowProps> = ({
  topic,
  todayStr,
  onToggleField,
  onUpdate,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  // Determine if topic is incomplete
  const isComplete = topic.isTest
    ? topic.written
    : topic.video && topic.code && topic.written;

  // Overdue check: target date is in the past and incomplete
  const isOverdue = isPastDate(topic.targetDate, todayStr) && !isComplete;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col md:flex-row md:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isOverdue
          ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20'
          : isComplete
          ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15'
          : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
      }`}
    >
      {/* Left: Drag Handle, Title, Test Badge & Target Date */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder topic"
          className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 p-1 -ml-1 rounded-lg transition"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={topic.title}
              onChange={(e) => onUpdate({ ...topic, title: e.target.value })}
              className={`text-sm font-semibold bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-none px-1 py-0.5 w-full truncate transition ${
                isComplete
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            />
            {topic.isTest && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                <Award className="w-3 h-3 text-amber-500" />
                <span>Test</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target:</span>
            <input
              type="date"
              value={topic.targetDate}
              onChange={(e) => onUpdate({ ...topic, targetDate: e.target.value })}
              className="text-xs font-mono bg-transparent text-slate-600 dark:text-slate-300 border-b border-transparent hover:border-slate-300 focus:outline-none cursor-pointer"
            />
            {isOverdue && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                <AlertCircle className="w-3 h-3 text-rose-500" /> Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center / Right: Checkboxes (Video, Code, Written) */}
      <div className="flex items-center gap-2 sm:gap-3 my-2.5 md:my-0">
        {/* Video Checkbox */}
        {topic.isTest ? (
          <span className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-900/30 font-mono">
            Video N/A
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggleField(topic.id, 'video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              topic.video
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            {topic.video ? (
              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-500" />
            ) : (
              <Video className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Video</span>
          </button>
        )}

        {/* Code Checkbox */}
        {topic.isTest ? (
          <span className="px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-900/30 font-mono">
            Code N/A
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onToggleField(topic.id, 'code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              topic.code
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
            }`}
          >
            {topic.code ? (
              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-500" />
            ) : (
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Code</span>
          </button>
        )}

        {/* Written Checkbox (or Test Passed) */}
        <button
          type="button"
          onClick={() => onToggleField(topic.id, 'written')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
            topic.written
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
              : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
          }`}
        >
          {topic.written ? (
            <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-500" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{topic.isTest ? 'Passed' : 'Written'}</span>
        </button>

        {/* Delete topic */}
        <button
          type="button"
          onClick={() => onDelete(topic.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
          title="Delete topic"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
