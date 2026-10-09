import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { agendaWorkout, combineWorkouts, combinableWorkouts } from './combined-workout';
import { useAppStore } from '../stores/use-app-store';
import type { Exercise, Workout } from '../types';

vi.hoisted(() => vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} }));
afterAll(() => vi.unstubAllGlobals());

const definitions: Exercise[] = ['c1', 'c2', 'c3', 'b1', 'b2'].map(id => ({
  id, name: id, group: 'lower', block: 'Treino principal', targets: ['10', '12'],
  previousWeights: [5, 6], previousReps: [10, 12], best: 6, cadence: '3-1-1', rest: 60,
  restBySet: [60, 90], instructions: 'Original', technique: 'Original', videoId: 'video', videoUrl:'https://youtu.be/9fzZx9MlumA', sourcePage: 2,
}));
const originals: Workout[] = [
  { id: 'c', name: 'C1', subtitle: 'Ficha C', exerciseIds: ['c1', 'c2', 'c3'], preparation: 'Preparo C', notes: 'Nota C', cycleId: 'cycle', programCode: 'C1' },
  { id: 'b', name: 'B3', subtitle: 'Ficha B', exerciseIds: ['b1', 'b2'], preparation: 'Preparo B', notes: 'Nota B', cycleId: 'cycle', programCode: 'B3' },
];

describe('combinar fichas em uma única sessão', () => {
  beforeEach(() => useAppStore.setState({ workouts: structuredClone(originals), exercises: structuredClone(definitions), agendaChoices: {}, activeSession: null, history: [] }));

  it.each([
    ['alternating', ['c1', 'b1', 'c2', 'b2', 'c3']],
    ['sequential', ['c1', 'c2', 'c3', 'b1', 'b2']],
  ] as const)('mantém todas as prescrições na ordem %s, mesmo com fichas de tamanhos diferentes', (order, expected) => {
    const before = structuredClone({ originals, definitions });
    const result = combineWorkouts('combined', originals, definitions, order)!;
    expect(result.workout.exerciseIds).toEqual(expected);
    expect(result.workout.name).toBe('C1 + B3');
    expect(result.workout.preparation).toContain('Preparo C');
    expect(result.workout.notes).toContain('Nota B');
    expect({ originals, definitions }).toEqual(before);
    expect(result.exercises).toEqual([]);
  });

  it.each(['alternating', 'sequential'] as const)('cria sessão só com os exercícios escolhidos em modo %s', order => {
    const id = useAppStore.getState().createCombinedWorkout(['c', 'b'], order, { c: ['c1', 'c3'], b: ['b2'] })!;
    const state = useAppStore.getState();
    const workout = state.workouts.find(item => item.id === id)!;
    expect(workout.exerciseIds).toEqual(order === 'alternating' ? ['c1', 'b2', 'c3'] : ['c1', 'c3', 'b2']);
    expect(workout.combination?.selectedExerciseIds).toEqual({ c: ['c1', 'c3'], b: ['b2'] });
    state.startSession(id);
    expect(useAppStore.getState().activeSession?.exercises).toHaveLength(3);
    expect(useAppStore.getState().activeSession?.exercises.every(exercise => exercise.sets.map(set => set.targetReps).join(',') === '10,12')).toBe(true);
    expect(state.workouts.find(item => item.id === 'c')?.exerciseIds).toEqual(['c1', 'c2', 'c3']);
  });

  it('recusa seleção vazia, duplicada ou que não pertence à ficha', () => {
    const state = useAppStore.getState();
    for (const selection of [{ c: [], b: ['b1'] }, { c: ['b1'], b: ['b2'] }, { c: ['c1', 'c1'], b: ['b1'] }]) {
      expect(state.createCombinedWorkout(['c', 'b'], 'alternating', selection)).toBeNull();
    }
    expect(useAppStore.getState().workouts).toHaveLength(2);
  });

  it('mantém duas ocorrências de um exercício compartilhado com séries independentes', () => {
    const parts = [originals[0], { ...originals[1], exerciseIds: ['c1'] }];
    const result = combineWorkouts('shared', parts, definitions, 'alternating')!;
    expect(result.workout.exerciseIds).toHaveLength(4);
    expect(new Set(result.workout.exerciseIds).size).toBe(4);
    expect(result.exercises[0]).toEqual({ ...definitions[0], id: 'shared-exercise-1' });
    result.exercises[0].targets[0] = '20';
    expect(definitions[0].targets[0]).toBe('10');
  });

  it('recusa ficha ausente, repetida, incompleta ou uma combinação dentro de outra', () => {
    expect(useAppStore.getState().createCombinedWorkout(['c', 'missing'], 'alternating')).toBeNull();
    expect(combineWorkouts('x', [originals[0], originals[0]], definitions, 'alternating')).toBeNull();
    expect(combineWorkouts('x', [originals[0], { ...originals[1], exerciseIds: ['missing'] }], definitions, 'alternating')).toBeNull();
    expect(combineWorkouts('x', [originals[0], { ...originals[1], combination: { workoutIds: ['a', 'b'], order: 'alternating' } }], definitions, 'alternating')).toBeNull();
    expect(useAppStore.getState().workouts).toHaveLength(2);
  });

  it('não oferece duas cópias equivalentes do mesmo PDF', () => {
    const workout = { ...originals[0], sourceId: 'pdf-c', programId: 'program' };
    expect(combinableWorkouts([workout, { ...workout, id: 'copy' }], definitions)).toHaveLength(1);
  });

  it('salva na agenda, inicia e retoma uma só sessão sem perder registros', () => {
    const state = useAppStore.getState();
    const id = state.createCombinedWorkout(['c', 'b'], 'alternating')!;
    state.setAgendaChoice('program', '2026-10-05', id);
    const saved = useAppStore.getState();
    const workout = agendaWorkout(saved.agendaChoices['program:2026-10-05'], 'C1', saved.workouts, 'cycle')!;
    expect(workout.id).toBe(id);
    const sessionId = saved.startSession(id);
    saved.updateSet('c1', 0, { weight: 15, performedReps: 12, completed: true });
    const session = structuredClone(useAppStore.getState().activeSession);
    expect(session?.exercises.map(exercise => exercise.id)).toEqual(['c1', 'b1', 'c2', 'b2', 'c3']);
    expect(saved.startSession(id)).toBe(sessionId);
    expect(saved.startSession('c')).toBe('');
    expect(useAppStore.getState().activeSession).toEqual(session);
    expect(session?.exercises[0].sets[0]).toMatchObject({ targetReps: '10', weight: 15, completed: true });
  });

  it('personaliza descanso e recupera a agenda original ao excluir a combinação', () => {
    const state = useAppStore.getState();
    const id = state.createCombinedWorkout(['c', 'b'], 'sequential')!;
    state.setAgendaChoice('program', '2026-10-05', id);
    expect(agendaWorkout(id, 'Descanso', useAppStore.getState().workouts, 'cycle')?.id).toBe(id);
    state.deleteWorkout(id);
    const saved = useAppStore.getState();
    expect(saved.agendaChoices['program:2026-10-05']).toBeUndefined();
    expect(agendaWorkout(id, 'C1/B3', saved.workouts, 'cycle')?.id).toBe('c');
    expect(agendaWorkout('B3', 'C1/B3', saved.workouts, 'cycle')?.id).toBe('b');
  });
});
