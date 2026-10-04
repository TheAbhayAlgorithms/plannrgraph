import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../common/ToastContainer';
import { useRoutineNotifications } from '../../hooks/useRoutineNotifications';

export const AppLayout: React.FC = () => {
  // Activate routine notifications scheduler
  useRoutineNotifications();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-bold text-xs transition"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />

        {/* Dynamic Page Content with bottom padding on mobile for BottomNav */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8 focus:outline-none"
        >
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />

        {/* Global Toast Stack */}
        <ToastContainer />
      </div>
    </div>
  );
};
