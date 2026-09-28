import { describe, expect, it } from 'vitest';
import type { Exercise, SessionExercise, SessionSet, TrainingSession } from '../../types';
import { toDisplayWeight, toKg } from '../../utils/format';
import { exerciseStatus, getLoadRecords, getPreviousSets, isExerciseComplete, summarizeSession } from './session-utils';

const set = (patch: Partial<SessionSet> = {}): SessionSet => ({
  setNumber: 1, targetReps: '10', performedReps: 10, weight: 20, completed: true, ...patch,
});
const exercise = (sets = [set()], patch: Partial<SessionExercise> = {}): SessionExercise => ({
  id: 'leg-press', name: 'Leg Press', status: 'completed', elapsedTime: 60, sets, ...patch,
});
const session = (exercises = [exercise()], patch: Partial<TrainingSession> = {}): TrainingSession => ({
  id: 'current', workoutId: 'a', workoutName: 'Treino A', cycleId: 'cycle', startedAt: 2000,
  elapsedTime: 60, currentExerciseId: 'leg-press', notes: '', status: 'completed', exercises, ...patch,
});
const definition: Exercise = {
  id: 'leg-press', name: 'Leg Press', group: 'lower', block: 'Treino principal', targets: ['10', '10'],
  previousWeights: [20, 25], previousReps: [10, 12], best: 25, cadence: '', rest: 60, instructions: '', technique: '',
};

describe('session completion and totals', () => {
  it('counts only checked sets, not prefilled or unfinished sets', () => {
    const current = session([
      exercise([set({ weight: 0, performedReps: 12 }), set({ setNumber: 2, weight: 100, completed: false })]),
      exercise([set({ weight: 30, performedReps: 8 })], { id: 'remada' }),
    ]);
    expect(summarizeSession(current)).toEqual({
      completedExercises: 1, totalExercises: 2, completedSets: 2, totalSets: 3, reps: 20, volume: 240,
    });
  });

  it('does not call an exercise with no sets complete', () => {
    expect(isExerciseComplete(exercise([]))).toBe(false);
    expect(exerciseStatus(exercise([], { status: 'not_started' }))).toBe('Pendente');
  });

  it('derives completion from actual sets rather than stale status', () => {
    expect(exerciseStatus(exercise([set()], { status: 'in_progress' }))).toBe('Concluído');
    expect(exerciseStatus(exercise([set(), set({ setNumber: 2, completed: false })]))).toBe('Em andamento');
    expect(exerciseStatus(exercise([set({ completed: false })], { status: 'not_started' }))).toBe('Pendente');
  });
});

describe('previous-set references', () => {
  it('uses the most recent completed matching set, with catalog fallback', () => {
    const older = session([exercise([set({ weight: 15, performedReps: 9 })])], { id: 'older', startedAt: 100 });
    const latest = session([exercise([
      set({ weight: 18, performedReps: 11 }),
      set({ setNumber: 2, weight: 500, completed: false }),
    ])], { id: 'latest', startedAt: 1000 });
    expect(getPreviousSets(exercise([set(), set({ setNumber: 2 })]), definition, [older, latest], 2000)).toEqual([
      { weight: 18, performedReps: 11 }, { weight: 25, performedReps: 12 },
    ]);
  });

  it('ignores later sessions and keeps zero-load references', () => {
    const earlier = session([exercise([set({ weight: 0 })])], { startedAt: 100 });
    const future = session([exercise([set({ weight: 999 })])], { startedAt: 3000 });
    expect(getPreviousSets(exercise(), definition, [future, earlier], 2000)[0].weight).toBe(0);
  });

  it('does not invent reference data for an unknown exercise', () => {
    expect(getPreviousSets(exercise(), undefined, [], 2000)).toEqual([{ weight: undefined, performedReps: undefined }]);
  });
});

describe('load records', () => {
  it('compares completed loads against catalog and earlier personal bests', () => {
    const current = session([exercise([set({ weight: 35 })])]);
    const earlier = session([exercise([set({ weight: 30 })])], { id: 'earlier', startedAt: 100 });
    expect(getLoadRecords(current, [current, earlier], [definition])).toEqual([
      { id: 'leg-press', name: 'Leg Press', weight: 35, previousBest: 30 },
    ]);
  });

  it('does not claim records for ties, unchecked sets, or zero repetitions', () => {
    expect(getLoadRecords(session([exercise([set({ weight: 25 })])]), [], [definition])).toEqual([]);
    expect(getLoadRecords(session([exercise([set({ weight: 100, completed: false })])]), [], [definition])).toEqual([]);
    expect(getLoadRecords(session([exercise([set({ weight: 100, performedReps: 0 })])]), [], [definition])).toEqual([]);
    const roundedReference = toKg(toDisplayWeight(35, 'lb'), 'lb');
    expect(getLoadRecords(session([exercise([set({ weight: roundedReference })])]), [], [{ ...definition, best: 35 }], 'lb')).toEqual([]);
  });

  it('does not compare a saved summary to later sessions or claim unknown baselines', () => {
    const current = session([exercise([set({ weight: 30 })])]);
    const future = session([exercise([set({ weight: 100 })])], { id: 'future', startedAt: 3000 });
    expect(getLoadRecords(current, [future], [definition])).toHaveLength(1);
    expect(getLoadRecords(current, [], [])).toEqual([]);
  });
});

describe('load conversion contract', () => {
  it('converts quick-stepper increments in the chosen display unit back to kilograms', () => {
    const displayed = toDisplayWeight(20, 'lb');
    const stepped = toKg(displayed + 2.5, 'lb');
    expect(toDisplayWeight(stepped, 'lb')).toBe(46.6);
    expect(stepped).not.toBe(22.5);
    expect(toKg(22.5, 'kg')).toBe(22.5);
  });
});
