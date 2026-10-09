import type { TrainingSession, Workout } from '../types';

export function isSessionWorkout(session: TrainingSession | null, workout: Workout | undefined, workouts: Workout[]): boolean {
  if (!session || !workout) return false;
  if (session.workoutId === workout.id) return true;
  const activeWorkout = workouts.find(item => item.id === session.workoutId);
  return !!(activeWorkout?.sourceId && activeWorkout.sourceId === workout.sourceId
    && activeWorkout.programId === workout.programId && activeWorkout.programCode === workout.programCode);
}
