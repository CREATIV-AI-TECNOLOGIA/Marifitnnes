import type { SessionExercise, TrainingSession } from '../../types';

export type Period = '30d' | '3m' | '6m' | 'all';
export const periodOptions = [
  { value: '30d', label: '30 dias' }, { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' }, { value: 'all', label: 'Tudo' },
];
export const dateKey = (value: number | Date) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const localDate = (value: string) => new Date(`${value}T12:00:00`);
export const completedSessions = (history: TrainingSession[]) => history
  .filter(s => s.status === 'completed').sort((a, b) => b.startedAt - a.startedAt);
export const completedSets = (exercise: SessionExercise) => exercise.sets.filter(s => s.completed);
export const exerciseVolume = (exercise: SessionExercise) => completedSets(exercise)
  .reduce((total, s) => total + s.weight * s.performedReps, 0);
export const exerciseLoad = (exercise: SessionExercise): number | null => {
  const sets = completedSets(exercise);
  return sets.length ? Math.max(...sets.map(s => s.weight)) : null;
};
export const sessionVolume = (session: TrainingSession) => session.exercises.reduce((n, e) => n + exerciseVolume(e), 0);
export const sessionSetCount = (session: TrainingSession) => session.exercises.reduce((n, e) => n + completedSets(e).length, 0);
export const sessionTime = (session: TrainingSession) => Math.max(0, session.elapsedTime);

export function inPeriod(history: TrainingSession[], period: Period, now = new Date()) {
  const sessions = completedSessions(history);
  if (period === 'all') return sessions;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === '30d') start.setDate(start.getDate() - 29);
  else {
    const day = start.getDate();
    start.setDate(1);
    start.setMonth(start.getMonth() - (period === '3m' ? 3 : 6));
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    start.setDate(Math.min(day, lastDay));
  }
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return sessions.filter(s => s.startedAt >= +start && s.startedAt <= +end);
}

export function exerciseEntries(history: TrainingSession[], exerciseId: string) {
  return completedSessions(history).flatMap(session => session.exercises
    .filter(e => e.id === exerciseId && (completedSets(e).length > 0 || e.elapsedTime > 0))
    .map(exercise => ({ session, exercise })));
}

export function exerciseDays(history: TrainingSession[], exerciseId: string) {
  const days = new Map<string, { date: string; timestamp: number; load: number | null; volume: number; seconds: number; sessions: number }>();
  for (const { session, exercise } of exerciseEntries(history, exerciseId)) {
    const date = dateKey(session.startedAt);
    const day = days.get(date) ?? { date, timestamp: +localDate(date), load: null, volume: 0, seconds: 0, sessions: 0 };
    const load = exerciseLoad(exercise);
    if (load !== null) day.load = day.load === null ? load : Math.max(day.load, load);
    day.volume += exerciseVolume(exercise);
    day.seconds += Math.max(0, exercise.elapsedTime);
    day.sessions += 1;
    days.set(date, day);
  }
  return [...days.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export function weeklySessions(history: TrainingSession[]) {
  const sessions = completedSessions(history);
  if (!sessions.length) return [];
  const monday = (timestamp: number) => {
    const d = new Date(timestamp);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return d;
  };
  const counts = new Map<string, number>();
  for (const s of sessions) {
    const key = dateKey(monday(s.startedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const result = [];
  const cursor = monday(sessions[sessions.length - 1].startedAt);
  const end = monday(sessions[0].startedAt);
  for (; cursor <= end; cursor.setDate(cursor.getDate() + 7)) {
    const date = dateKey(cursor);
    result.push({ date, timestamp: +cursor, count: counts.get(date) ?? 0 });
  }
  return result;
}
