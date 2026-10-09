import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import LoginPage from '../../features/auth/LoginPage';
import SplashPage from '../../features/auth/SplashPage';
import HomePage from '../../features/dashboard/HomePage';
import WorkoutsPage from '../../features/workouts/WorkoutsPage';
import WorkoutDetailPage from '../../features/workouts/WorkoutDetailPage';
import { PageSkeleton } from '../../components/ui';

const ObjectivePage = lazy(() => import('../../features/objectives/ObjectivePage'));
const AgendaPage = lazy(() => import('../../features/agenda/AgendaPage'));
const BuilderPage = lazy(() => import('../../features/workout-builder/BuilderPage'));
const SessionPage = lazy(() => import('../../features/workout-session/SessionPage'));
const FinishPage = lazy(() => import('../../features/workout-session/FinishPage'));
const HistoryPage = lazy(() => import('../../features/history/HistoryPage'));
const SessionDetailPage = lazy(() => import('../../features/history/SessionDetailPage'));
const ProgressPage = lazy(() => import('../../features/progress/ProgressPage'));
const ExerciseProgressPage = lazy(() => import('../../features/progress/ExerciseProgressPage'));
const CyclesPage = lazy(() => import('../../features/cycles/CyclesPage'));
const CycleDetailPage = lazy(() => import('../../features/cycles/CycleDetailPage'));
const ProfilePage = lazy(() => import('../../features/profile/ProfilePage'));
const SettingsPage = lazy(() => import('../../features/profile/SettingsPage'));
const ImportPage = lazy(() => import('../../features/imports/ImportPage'));
const ReviewPage = lazy(() => import('../../features/imports/ReviewPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="objectives/:id" element={<ObjectivePage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="workouts/import" element={<ImportPage />} />
          <Route path="workouts/import/review" element={<ReviewPage />} />
          <Route path="sources/:id" element={<Navigate to="/app/workouts" replace />} />
          <Route path="workouts/builder" element={<BuilderPage />} />
          <Route path="workouts/:id" element={<WorkoutDetailPage />} />
          <Route path="session/:id" element={<SessionPage />} />
          <Route path="session/:id/exercise/:exerciseId" element={<SessionPage />} />
          <Route path="session/:id/finish" element={<FinishPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="progress/exercise/:id" element={<ExerciseProgressPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/session/:id" element={<SessionDetailPage />} />
          <Route path="cycles" element={<CyclesPage />} />
          <Route path="cycles/:id" element={<CycleDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app/home" replace />} />
      </Routes>
    </Suspense>
  );
}
