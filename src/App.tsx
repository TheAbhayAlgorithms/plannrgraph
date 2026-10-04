import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePlannerStore } from './store/usePlannerStore';
import { AppLayout } from './components/layout/AppLayout';

// Page components
import { TrackerPage } from './pages/TrackerPage';
import { RoutinePage } from './pages/RoutinePage';
import { TasksPage } from './pages/TasksPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { StudyPlanPage } from './pages/StudyPlanPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ResearchPage } from './pages/ResearchPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const { settings } = usePlannerStore();

  // Sync theme with document class
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      const isSystemDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSystemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<TrackerPage />} />
          <Route path="routine" element={<RoutinePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="study-plan" element={<StudyPlanPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
