import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, NavItem } from './navConfig';
import { usePlannerStore } from '../../store/usePlannerStore';
import { getTodayDateString, getDayType } from '../../utils/dateUtils';
import { calculateDayMetrics } from '../../utils/calculations';
import { Sparkles } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { settings, taskTemplates, dayPlans } = usePlannerStore();
  const todayStr = getTodayDateString();
  const dayType = getDayType(todayStr);
  const todayPlan = dayPlans[todayStr];

  const metrics = calculateDayMetrics(
    todayStr,
    taskTemplates.filter((t) => t.active),
    todayPlan,
    todayStr,
    settings.studyHoursWeekday,
    settings.studyHoursWeekend
  );

  const trackerItems = NAV_ITEMS.filter((item) => item.group === 'tracker');
  const academicItems = NAV_ITEMS.filter((item) => item.group === 'academic');
  const insightsItems = NAV_ITEMS.filter((item) => item.group === 'insights');

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1 mb-5">
      <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <aside aria-label="Main sidebar navigation" className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                StudyFlow
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Excel Tracker Replacer</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-4 py-5">
        {renderNavGroup('Tracking & Routines', trackerItems)}
        {renderNavGroup('Subjects & Studies', academicItems)}
        {renderNavGroup('Insights & Settings', insightsItems)}
      </nav>

      {/* Sidebar Compact Footer Widget */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium">Study Target ({dayType})</span>
            <span className="font-mono text-emerald-500 font-semibold">
              {metrics.studyHoursDone}h / {metrics.studyHoursPlanned}h
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  metrics.studyHoursPlanned > 0
                    ? Math.min(100, (metrics.studyHoursDone / metrics.studyHoursPlanned) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Completion</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {metrics.completionPercentage}%
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
