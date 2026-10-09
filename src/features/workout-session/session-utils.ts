import type { Exercise, Preferences, SessionExercise, SessionSet, TrainingSession } from '../../types';
import { toDisplayWeight } from '../../utils/format';

export type PreviousSet = Partial<Pick<SessionSet, 'weight' | 'performedReps'>>;

export function suggestedRestSeconds(definition: Pick<Exercise, 'rest' | 'restBySet'> | undefined, setIndex = 0) {
  return Math.max(0, Math.min(3600, Math.round(definition?.restBySet?.[setIndex] ?? definition?.rest ?? 60)));
}

export function isExerciseComplete(exercise: SessionExercise) {
  return exercise.sets.length > 0 && exercise.sets.every(set => set.completed);
}

export function exerciseStatus(exercise: SessionExercise) {
  if (isExerciseComplete(exercise)) return 'Concluído';
  if (exercise.sets.some(set => set.completed) || exercise.status === 'in_progress') return 'Em andamento';
  return 'Pendente';
}

export function getPreviousSets(exercise: SessionExercise, definition: Exercise | undefined, history: TrainingSession[], startedAt: number): PreviousSet[] {
  const previous = history
    .filter(session => session.status === 'completed' && session.startedAt < startedAt)
    .sort((a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt))
    .flatMap(session => session.exercises.filter(item => item.id === exercise.id));
  return exercise.sets.map((set, index) => {
    const saved = previous.flatMap(item => item.sets).find(item => item.setNumber === set.setNumber && item.completed);
    return {
      weight: saved?.weight ?? definition?.previousWeights[index],
      performedReps: saved?.performedReps ?? definition?.previousReps[index],
    };
  });
}

export function summarizeSession(session: TrainingSession) {
  const sets = session.exercises.flatMap(exercise => exercise.sets);
  const completed = sets.filter(set => set.completed);
  return {
    completedExercises: session.exercises.filter(isExerciseComplete).length,
    totalExercises: session.exercises.length,
    completedSets: completed.length,
    totalSets: sets.length,
    reps: session.exercises.filter(exercise => !exercise.measurementLabel).reduce((sum, exercise) => sum + exercise.sets
      .filter(set => set.completed)
      .reduce((setTotal, set) => setTotal + set.performedReps + (set.secondaryPerformedReps ?? 0), 0), 0),
    volume: completed.reduce((sum, set) => sum + set.weight * set.performedReps, 0),
  };
}

export function getLoadRecords(session: TrainingSession, history: TrainingSession[], definitions: Exercise[], unit: Preferences['unit'] = 'kg') {
  const earlier = history.filter(item => item.id !== session.id && item.status === 'completed' && item.startedAt < session.startedAt);
  return session.exercises.flatMap(exercise => {
    const definition = definitions.find(item => item.id === exercise.id);
    const knownWeights = earlier.flatMap(item => item.exercises)
      .filter(item => item.id === exercise.id)
      .flatMap(item => item.sets.filter(set => set.completed).map(set => set.weight));
    if (definition) knownWeights.push(definition.best, ...definition.previousWeights);
    const validWeights = knownWeights.filter(weight => Number.isFinite(weight) && weight >= 0);
    if (!validWeights.length) return [];
    const previousBest = Math.max(...validWeights);
    const best = Math.max(0, ...exercise.sets.filter(set => set.completed && set.performedReps > 0).map(set => set.weight));
    // A display-unit round trip is not a new record when the displayed load is unchanged.
    const improved = best > previousBest + 0.0001 && toDisplayWeight(best, unit) > toDisplayWeight(previousBest, unit);
    return improved ? [{ id: exercise.id, name: exercise.name, weight: best, previousBest }] : [];
  });
}
