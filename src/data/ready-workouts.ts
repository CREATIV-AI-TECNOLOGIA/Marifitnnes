import type { Exercise, TrainingProgram, TrainingSession, Workout } from '../types';
import { b2Exercises, c1Exercises, proB2, proC1 } from './pro-c1-b2';
import { b3Exercises, proB3 } from './pro-b3';
import { c2Exercises, proC2 } from './pro-c2-outubro';

interface Library { workouts: Workout[]; exercises: Exercise[]; programs: TrainingProgram[]; activeSession: TrainingSession | null; }
const ready = [proC1, proB2, proB3, proC2];
const definitions = [...c1Exercises, ...b2Exercises, ...b3Exercises, ...c2Exercises];

/** Add the reviewed library without replacing personal prescriptions or active sessions. */
export function addReadyWorkouts<T extends Library>(state: T): T {
  const additions = ready.filter(workout => !state.workouts.some(item => item.id === workout.id));
  const missing = definitions.filter(exercise => !state.exercises.some(item => item.id === exercise.id));
  const workouts = [...state.workouts.map(workout => {
    const original = ready.find(item => item.programId === workout.programId && item.programCode === workout.programCode);
    if (!original || !workout.cycleId || workout.exerciseIds.length || state.activeSession?.workoutId === workout.id) return workout;
    return { ...workout, exerciseIds: [...original.exerciseIds], sourceId: original.sourceId, preparation: original.preparation, notes: original.notes };
  }), ...structuredClone(additions)];
  const programs = state.programs.map(program => {
    const absent = ready.filter(item => item.programId === program.id && !program.exerciseTemplates?.[item.programCode!]?.length);
    if (!absent.length) return program;
    return { ...program, exerciseTemplates: { ...program.exerciseTemplates, ...Object.fromEntries(absent.map(item =>
      [item.programCode!, structuredClone(definitions.filter(exercise => item.exerciseIds.includes(exercise.id)))])) },
      workoutPreparation: { ...program.workoutPreparation, ...Object.fromEntries(absent.map(item => [item.programCode!, item.preparation!])) },
      workoutNotes: { ...program.workoutNotes, ...Object.fromEntries(absent.map(item => [item.programCode!, item.notes!])) } };
  });
  if (!additions.length && !missing.length && workouts.every((item, index) => item === state.workouts[index])
    && programs.every((item, index) => item === state.programs[index])) return state;
  return { ...state, workouts, exercises: [...state.exercises, ...structuredClone(missing)], programs };
}
