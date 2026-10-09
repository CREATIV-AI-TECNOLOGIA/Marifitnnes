import type { Exercise, Workout, WorkoutOrder } from '../types';


export function orderedExerciseIds(workouts: Workout[], order: WorkoutOrder): string[] {
  if (order === 'sequential') return workouts.flatMap(workout => workout.exerciseIds);
  const result: string[] = [];
  const length = Math.max(0, ...workouts.map(workout => workout.exerciseIds.length));
  for (let index = 0; index < length; index++) {
    for (const workout of workouts) {
      if (workout.exerciseIds[index]) result.push(workout.exerciseIds[index]);
    }
  }
  return result;
}

export function combinableWorkouts(workouts: Workout[], exercises: Exercise[]): Workout[] {
  const seen = new Set<string>();
  const available = new Set(exercises.map(exercise => exercise.id));
  return workouts.filter(workout => {
    if (workout.combination || !workout.exerciseIds.length || !workout.exerciseIds.every(id => available.has(id))) return false;
    const key = workout.sourceId ? JSON.stringify([workout.sourceId, workout.programId, workout.programCode]) : workout.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function combineWorkouts(id: string, selected: Workout[], definitions: Exercise[], order: WorkoutOrder, selection?: Record<string, string[]>) {
  if (selected.length !== 2 || selected[0].id === selected[1].id || !['sequential', 'alternating'].includes(order)
    || combinableWorkouts(selected, definitions).length !== 2) return null;
  if (selection && selected.some(workout => {
    const ids = selection[workout.id];
    return !Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || ids.some(exerciseId => !workout.exerciseIds.includes(exerciseId));
  })) return null;
  const parts = selected.map(workout => ({ ...workout, exerciseIds: selection
    ? workout.exerciseIds.filter(exerciseId => selection[workout.id].includes(exerciseId)) : [...workout.exerciseIds] }));
  const seen = new Set<string>();
  const extraExercises: Exercise[] = [];
  const exerciseIds = orderedExerciseIds(parts, order).map((exerciseId, index) => {
    if (!seen.has(exerciseId)) {
      seen.add(exerciseId);
      return exerciseId;
    }
    // A shared exercise still occurs in both source workouts, with independent sets.
    const copy = structuredClone(definitions.find(exercise => exercise.id === exerciseId)!);
    copy.id = `${id}-exercise-${index}`;
    extraExercises.push(copy);
    return copy.id;
  });
  const guidance = (field: 'preparation' | 'notes') => selected.map(workout => workout[field]
    ? `${workout.name}\n${workout[field]}` : '').filter(Boolean).join('\n\n') || undefined;
  const workout: Workout = {
    id, name: selected.map(workout => workout.name).join(' + '),
    subtitle: order === 'alternating' ? 'Exercícios alternados entre as duas fichas' : 'Uma ficha completa, depois a outra',
    exerciseIds, preparation: guidance('preparation'), notes: guidance('notes'),
    combination: { workoutIds: selected.map(workout => workout.id), order,
      selectedExerciseIds: Object.fromEntries(parts.map(workout => [workout.id, [...workout.exerciseIds]])) },
    cycleId: selected[0].cycleId === selected[1].cycleId ? selected[0].cycleId : undefined,
  };
  return { workout, exercises: extraExercises };
}

export function agendaWorkout(choice: string | undefined, entry: string | null, workouts: Workout[], cycleId: string) {
  const custom = choice ? workouts.find(workout => workout.id === choice && workout.exerciseIds.length > 0) : undefined;
  if (custom) return custom;
  const options = entry?.split('/').map(code => code.trim()) ?? [];
  const code = choice && options.includes(choice) ? choice : options[0];
  return workouts.find(workout => workout.cycleId === cycleId && workout.programCode === code && workout.exerciseIds.length > 0);
}
