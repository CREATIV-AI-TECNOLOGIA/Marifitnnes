import type { Exercise, TrainingSession, Workout } from '../../types';
import { completedSessions, exerciseEntries, exerciseLoad, sessionTime } from '../history/analytics';

export function percentChange(from: number, to: number) {
  if (!from) return 0;
  return Math.round(((to - from) / from) * 1000) / 10;
}

export interface LoadProgress { id: string; name: string; first: number; last: number; delta: number }

export function loadProgress(history: TrainingSession[], exercises: Exercise[]): LoadProgress[] {
  const names = new Map(exercises.map(e => [e.id, e.name]));
  for (const s of history) for (const e of s.exercises) names.set(e.id, e.name);
  return [...names.keys()].map(id => {
    const entries = exerciseEntries(history, id).sort((a, b) => a.session.startedAt - b.session.startedAt);
    if (entries.length < 2) return null;
    const loads = entries.map(({ exercise }) => exerciseLoad(exercise)).filter((n): n is number => n !== null);
    if (loads.length < 2) return null;
    const first = loads[0], last = loads[loads.length - 1];
    if (last <= first) return null;
    return { id, name: names.get(id) ?? id, first, last, delta: last - first };
  }).filter((x): x is LoadProgress => x !== null).sort((a, b) => b.delta - a.delta);
}

export function lastRecord(history: TrainingSession[], exercises: Exercise[]) {
  const names = new Map(exercises.map(e => [e.id, e.name]));
  const sessions = completedSessions(history);
  for (let i = 1; i < sessions.length; i++) {
    for (const exercise of sessions[i - 1].exercises) {
      const load = exerciseLoad(exercise);
      if (load === null) continue;
      const older = sessions.slice(i).flatMap(s => s.exercises.filter(e => e.id === exercise.id)).map(exerciseLoad).filter((n): n is number => n !== null);
      const previousBest = older.length ? Math.max(...older) : 0;
      if (load > previousBest) return { id: exercise.id, name: names.get(exercise.id) ?? exercise.name, weight: load, previousBest };
    }
  }
  return null;
}

export function healthSummary(history: TrainingSession[], exercises: Exercise[], workouts: Workout[]) {
  const sessions = completedSessions(history);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return {
    averageTime: sessions.length ? sessions.reduce((n, s) => n + sessionTime(s), 0) / sessions.length : 0,
    activeDays: new Set(sessions.map(s => new Date(s.startedAt).toDateString())).size,
    sessionsThisMonth: sessions.filter(s => s.startedAt >= monthStart).length,
    loadProgress: loadProgress(history, exercises),
    lastRecord: lastRecord(history, exercises),
    totalWorkouts: workouts.length,
  };
}
